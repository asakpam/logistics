/**
 * etaService.js
 *
 * Computes estimated arrival time using:
 *  1. Haversine formula  — straight-line distance between pickup and destination
 *  2. Historical average — queries the last N delivered shipments on the same
 *     route (same pickup/destination city prefix) to derive an empirical speed
 *  3. Weight buffer      — adds extra time for heavy packages
 *  4. Safe fallback      — if no coords are provided or history is sparse, falls
 *     back to a configurable base delivery time
 *
 * All distance calculations use the WGS-84 spherical model (R = 6 371 km).
 */

import { supabase } from "../config/db.js";

// ── Constants ────────────────────────────────────────────────────────────────
const EARTH_RADIUS_KM   = 6_371;
const BASE_HOURS        = 24;          // fallback when no coords/history
const WEIGHT_BUFFER_KG  = 10;          // packages over this get extra time
const WEIGHT_BUFFER_HRS = 4;           // hours added for heavy packages
const DEFAULT_SPEED_KPH = 60;          // assumed avg road speed with no history
const HISTORY_LIMIT     = 20;          // how many past deliveries to sample
const MIN_SAMPLES       = 3;           // need at least this many to trust the avg
const OVERHEAD_HOURS    = 1.5;         // loading, traffic, last-mile overhead

/**
 * Haversine distance between two WGS-84 coordinates.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in kilometres
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat  = toRad(lat2 - lat1);
  const dLon  = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * Query Supabase for the average speed (km/h) of recently completed shipments
 * that share the same general route corridor.
 *
 * We match on the first word of both pickup and destination addresses —
 * good enough for city-level routing without needing a geocoder.
 *
 * @param {string} pickupAddress
 * @param {string} destinationAddress
 * @returns {Promise<number|null>} avg speed in km/h, or null if not enough data
 */
async function historicalAvgSpeedKph(pickupAddress, destinationAddress) {
  try {
    const fromCity = (pickupAddress || "").split(/[\s,]+/)[0];
    const toCity   = (destinationAddress || "").split(/[\s,]+/)[0];

    if (!fromCity || !toCity) return null;

    const { data: past, error } = await supabase
      .from("shipments")
      .select("current_latitude, current_longitude, pickup_address, destination_address, created_at, updated_at, status_history, weight")
      .eq("status", "Delivered")
      .not("current_latitude", "is", null)
      .not("current_longitude", "is", null)
      .order("updated_at", { ascending: false })
      .limit(HISTORY_LIMIT * 2);

    if (error || !past) return null;

    const matching = past.filter(s => {
      const p = (s.pickup_address || "").toLowerCase();
      const d = (s.destination_address || "").toLowerCase();
      return p.includes(fromCity.toLowerCase()) && d.includes(toCity.toLowerCase());
    });

    if (matching.length < MIN_SAMPLES) return null;

    const speeds = matching
      .map(s => {
        const history = Array.isArray(s.status_history) ? s.status_history : [];
        const deliveredEntry = [...history].reverse().find(h => h.status === "Delivered");
        const deliveredAt = deliveredEntry?.changedAt || deliveredEntry?.changed_at
          ? new Date(deliveredEntry.changedAt || deliveredEntry.changed_at)
          : new Date(s.updated_at);
        const dispatchedEntry = history.find(h => h.status === "Dispatched");
        const dispatchedAt = dispatchedEntry?.changedAt || dispatchedEntry?.changed_at
          ? new Date(dispatchedEntry.changedAt || dispatchedEntry.changed_at)
          : new Date(s.created_at);

        const travelHours = (deliveredAt - dispatchedAt) / 3_600_000;
        if (travelHours <= 0) return null;
        return travelHours;
      })
      .filter(Boolean);

    if (speeds.length < MIN_SAMPLES) return null;

    const avgTravelHours = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    return avgTravelHours;
  } catch {
    return null;
  }
}

/**
 * Compute estimated arrival time for a new or updating shipment.
 *
 * Priority order:
 *   1. Haversine distance + historical average travel time (most accurate)
 *   2. Haversine distance + default speed assumption
 *   3. Base hours fallback
 *
 * @param {object} options
 * @param {number}  [options.weight=1]               - Package weight in kg
 * @param {number}  [options.pickupLat]               - Pickup latitude
 * @param {number}  [options.pickupLng]               - Pickup longitude
 * @param {number}  [options.destLat]                 - Destination latitude
 * @param {number}  [options.destLng]                 - Destination longitude
 * @param {string}  [options.pickupAddress]            - Pickup address string
 * @param {string}  [options.destinationAddress]       - Destination address string
 * @param {Date}    [options.pickupDate]               - When the shipment is picked up
 * @returns {Promise<Date>} Estimated arrival Date object
 */
export async function computeEta({
  weight          = 1,
  pickupLat,
  pickupLng,
  destLat,
  destLng,
  pickupAddress   = "",
  destinationAddress = "",
  pickupDate,
} = {}) {
  const start = pickupDate ? new Date(pickupDate) : new Date();
  let   deliveryHours = BASE_HOURS;

  const hasCoords = pickupLat != null && pickupLng != null && destLat != null && destLng != null;

  if (hasCoords) {
    // ── Path A: we have coordinates ────────────────────────────────────────
    const distanceKm = haversineKm(pickupLat, pickupLng, destLat, destLng);

    // Try to get historical avg travel time for this corridor
    const historicalHours = await historicalAvgSpeedKph(pickupAddress, destinationAddress);

    if (historicalHours !== null) {
      // Use historical average adjusted by distance ratio
      // (historical shipments may have different exact distances)
      const assumedAvgDistKm = distanceKm; // best proxy we have
      const impliedSpeedKph  = assumedAvgDistKm / historicalHours;
      const effectiveSpeed   = Math.max(impliedSpeedKph, 20); // never below 20 km/h
      deliveryHours = (distanceKm / effectiveSpeed) + OVERHEAD_HOURS;
    } else {
      // Fallback: standard road-speed assumption
      deliveryHours = (distanceKm / DEFAULT_SPEED_KPH) + OVERHEAD_HOURS;
    }
  } else if (pickupAddress && destinationAddress) {
    // ── Path B: no coords, but we have addresses — try history only ────────
    const historicalHours = await historicalAvgSpeedKph(pickupAddress, destinationAddress);
    if (historicalHours !== null) {
      deliveryHours = historicalHours + OVERHEAD_HOURS;
    }
    // else: falls through to BASE_HOURS
  }

  // Weight buffer for heavy shipments
  if (weight > WEIGHT_BUFFER_KG) {
    deliveryHours += WEIGHT_BUFFER_HRS;
  }

  // Enforce a sensible minimum (1 hour) and maximum (7 days)
  deliveryHours = Math.max(1, Math.min(deliveryHours, 168));

  const eta = new Date(start);
  eta.setTime(eta.getTime() + deliveryHours * 3_600_000);
  return eta;
}

/**
 * Simple synchronous fallback (kept for places that can't await).
 * Uses only weight — no Haversine, no history.
 *
 * @param {object} options
 * @param {number} [options.weight=1]
 * @returns {Date}
 */
export function computeBasicEta({ weight = 1 } = {}) {
  const hours = BASE_HOURS + (weight > WEIGHT_BUFFER_KG ? WEIGHT_BUFFER_HRS : 0);
  const eta   = new Date();
  eta.setTime(eta.getTime() + hours * 3_600_000);
  return eta;
}
