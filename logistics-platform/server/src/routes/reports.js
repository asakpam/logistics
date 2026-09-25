/**
 * GET /api/reports
 *
 * Returns aggregated platform analytics for the admin Reports dashboard.
 * All queries run in parallel against Supabase (PostgreSQL) so the endpoint stays fast.
 *
 * Shape returned:
 * {
 *   kpi:         { totalShipments, delivered, active, delayed, avgDeliveryHours, successRate, delayRate }
 *   monthly:     [{ month: "Jan", count: 38 }, …]   — last 6 calendar months
 *   byStatus:    [{ status: "Delivered", count: 287 }, …]
 *   driverPerf:  [{ driverId, name, deliveries, onTime, avgDeliveryHours, successRate }, …]
 * }
 */

import { Router } from "express";
import { requireRegisteredUser, verifySupabaseToken, requireRole } from "../middleware/auth.js";
import { supabase } from "../config/db.js";

const router = Router();

router.use(verifySupabaseToken, requireRegisteredUser);

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const ACTIVE_STATUSES = ["Dispatched", "In Transit", "Out For Delivery", "Assigned"];

router.get("/", requireRole("admin"), async (req, res) => {
  try {
    // ── Date range filter ──────────────────────────────────────────────────
    const range = req.query.range || "month";
    const now   = new Date();
    const from  = new Date();

    if      (range === "today")   from.setHours(0, 0, 0, 0);
    else if (range === "week")    from.setDate(now.getDate() - 7);
    else if (range === "month")   from.setMonth(now.getMonth() - 1);
    else if (range === "3months") from.setMonth(now.getMonth() - 3);
    else if (range === "year")    from.setFullYear(now.getFullYear() - 1);
    else                          from.setMonth(now.getMonth() - 1);

    const fromIso = from.toISOString();
    const nowIso  = now.toISOString();

    // ── Fetch all shipments in range (Supabase doesn't support $group-style aggregation via JS client) ──
    const { data: shipments, error: shipErr } = await supabase
      .from("shipments")
      .select("id, status, driver_id, created_at, updated_at, estimated_arrival")
      .gte("created_at", fromIso)
      .lte("created_at", nowIso);

    if (shipErr) throw shipErr;

    // ── KPI aggregation (in-memory) ─────────────────────────────────────────
    let total = 0, delivered = 0, cancelled = 0, active = 0;
    for (const s of shipments) {
      total++;
      if (s.status === "Delivered")           delivered++;
      else if (s.status === "Cancelled")      cancelled++;
      else if (ACTIVE_STATUSES.includes(s.status)) active++;
    }
    const delayed     = Math.max(0, total - delivered - active - cancelled);
    const successRate = total > 0 ? Math.round((delivered / total) * 1000) / 10 : 0;
    const delayRate   = total > 0 ? Math.round((delayed / total) * 1000) / 10 : 0;

    const kpi = { totalShipments: total, delivered, active, cancelled, delayed,
                  avgDeliveryHours: null, successRate, delayRate };

    // ── By-status breakdown ──────────────────────────────────────────────────
    const statusMap = {};
    for (const s of shipments) {
      statusMap[s.status] = (statusMap[s.status] || 0) + 1;
    }
    const byStatus = Object.entries(statusMap)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // ── Monthly counts — last 6 calendar months ──────────────────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const { data: allRecent, error: recErr } = await supabase
      .from("shipments")
      .select("created_at")
      .gte("created_at", sixMonthsAgo.toISOString());
    if (recErr) throw recErr;

    const monthMap = {};
    for (const s of allRecent) {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthMap[key] = (monthMap[key] || { year: d.getFullYear(), month: d.getMonth(), count: 0 });
      monthMap[key].count++;
    }
    const monthly = Object.values(monthMap)
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
      .map(m => ({ month: MONTH_LABELS[m.month], year: m.year, count: m.count }));

    // ── Driver performance (top 10 by deliveries) ────────────────────────────
    const driverMap = {};
    for (const s of shipments) {
      if (!s.driver_id) continue;
      if (!driverMap[s.driver_id]) {
        driverMap[s.driver_id] = { total: 0, delivered: 0, onTime: 0, totalDurationMs: 0 };
      }
      driverMap[s.driver_id].total++;
      if (s.status === "Delivered") {
        driverMap[s.driver_id].delivered++;
        const dur = new Date(s.updated_at) - new Date(s.created_at);
        driverMap[s.driver_id].totalDurationMs += dur;
        // on-time: delivered and updatedAt <= estimatedArrival
        if (s.estimated_arrival && new Date(s.updated_at) <= new Date(s.estimated_arrival)) {
          driverMap[s.driver_id].onTime++;
        }
      }
    }

    // Fetch driver + user info for top 10
    const topDriverIds = Object.entries(driverMap)
      .sort((a, b) => b[1].delivered - a[1].delivered)
      .slice(0, 10)
      .map(([id]) => id);

    let driverDocs = [];
    if (topDriverIds.length > 0) {
      const { data: driverRows } = await supabase
        .from("drivers")
        .select("id, user_id, user:users!drivers_user_id_fkey(id, name, email)")
        .in("id", topDriverIds);
      driverDocs = driverRows || [];
    }

    const driverInfoMap = {};
    for (const d of driverDocs) {
      driverInfoMap[d.id] = { name: d.user?.name || "Unknown Driver", email: d.user?.email || "" };
    }

    const driverPerf = topDriverIds.map(dId => {
      const stats = driverMap[dId];
      const info  = driverInfoMap[dId] || { name: "Unknown Driver", email: "" };
      const avgMs = stats.delivered > 0 ? stats.totalDurationMs / stats.delivered : null;
      const avgH  = avgMs !== null ? Math.round((avgMs / 3_600_000) * 10) / 10 : null;
      const succR = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 1000) / 10 : 0;
      return {
        driverId: dId,
        name:     info.name,
        email:    info.email,
        deliveries: stats.total,
        delivered:  stats.delivered,
        onTime:     stats.onTime,
        avgDeliveryHours: avgH,
        successRate: succR,
      };
    });

    res.json({ kpi, monthly, byStatus, driverPerf });
  } catch (err) {
    console.error("Reports aggregation error:", err);
    res.status(500).json({ message: "Failed to generate report" });
  }
});

export default router;
