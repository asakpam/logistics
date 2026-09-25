import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../../lib/api.js";

// ── Fix Leaflet default icon paths under Vite ────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const makeColorIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const ICONS = {
  "In Transit":       makeColorIcon("green"),
  "Out For Delivery": makeColorIcon("orange"),
  "Dispatched":       makeColorIcon("blue"),
  default:            makeColorIcon("grey"),
};

// Pan / zoom the map to show all markers
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 13, { animate: true });
    } else {
      map.fitBounds(positions, { padding: [40, 40], animate: true });
    }
  }, [positions, map]);
  return null;
}

const STATUS_COLOR = {
  "Dispatched":        "badge-primary",
  "In Transit":        "badge-primary",
  "Out For Delivery":  "badge-warning",
};

const ACTIVE_STATUSES = ["Dispatched", "In Transit", "Out For Delivery"];

function ProgressBar({ value }) {
  return (
    <div style={{ background: "var(--clr-surface-2)", borderRadius: "var(--r-full)", height: 5, overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", background: "var(--clr-primary)", borderRadius: "var(--r-full)", transition: "width 0.6s ease" }} />
    </div>
  );
}

const PROGRESS_MAP = {
  "Pending": 5, "Assigned": 20, "Dispatched": 35,
  "In Transit": 60, "Out For Delivery": 85, "Delivered": 100, "Cancelled": 0,
};

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function LiveTracking() {
  const navigate = useNavigate();

  const [shipments,       setShipments]       = useState([]);
  const [positions,       setPositions]       = useState({}); // { trackingNumber: { lat, lng } }
  const [loading,         setLoading]         = useState(true);
  const [statusFilter,    setStatusFilter]    = useState("All");
  const [selectedTrk,     setSelectedTrk]     = useState(null);
  const [socketStatus,    setSocketStatus]    = useState("connecting");

  const socketRef = useRef(null);

  // ── Load active shipments ─────────────────────────────────────────────────
  useEffect(() => {
    api.get("/shipments")
      .then(res => {
        const active = (res.data || []).filter(s => ACTIVE_STATUSES.includes(s.status));
        setShipments(active);

        // Seed last-known coordinates from DB
        const seed = {};
        active.forEach(s => {
          if (s.currentLatitude && s.currentLongitude) {
            seed[s.trackingNumber] = { lat: s.currentLatitude, lng: s.currentLongitude };
          }
        });
        setPositions(seed);

        if (active.length > 0) setSelectedTrk(active[0].trackingNumber);
      })
      .catch(() => {/* admin will see empty state */})
      .finally(() => setLoading(false));
  }, []);

  // ── Socket.IO — subscribe to all active shipment rooms ───────────────────
  useEffect(() => {
    if (shipments.length === 0) return;

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const token = api.defaults.headers.common?.Authorization?.replace("Bearer ", "") || "";

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketStatus("live");
      // Join every active shipment room so we receive all location updates
      shipments.forEach(s => socket.emit("shipment:join", { trackingNumber: s.trackingNumber }));
    });

    socket.on("shipment:locationUpdate", ({ trackingNumber, latitude, longitude }) => {
      setPositions(prev => ({ ...prev, [trackingNumber]: { lat: latitude, lng: longitude } }));
    });

    socket.on("disconnect", () => setSocketStatus("offline"));
    socket.on("connect_error", () => setSocketStatus("offline"));

    return () => { socket.disconnect(); };
  }, [shipments]);

  const filtered = shipments.filter(s =>
    statusFilter === "All" || s.status === statusFilter
  );

  const selectedShipment = shipments.find(s => s.trackingNumber === selectedTrk) || null;

  // Build array of [lat, lng] pairs for all markers currently on the map
  const markerPositions = Object.values(positions).map(p => [p.lat, p.lng]);
  // Default centre: Accra, Ghana
  const mapCenter = markerPositions.length > 0 ? markerPositions[0] : [5.6037, -0.1870];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Live <span className="gradient-text">Tracking</span> 🗺️
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            Monitor all active shipments and driver locations in real-time.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span className={`badge ${socketStatus === "live" ? "badge-success" : "badge-muted"}`} style={{ fontSize: "0.85rem" }}>
            {socketStatus === "live" ? "● Live" : socketStatus === "connecting" ? "⏳ Connecting" : "○ Offline"}
          </span>
          <Link to="/dashboard/admin" className="btn btn-ghost btn-sm">← Admin</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: "Active Shipments",  value: shipments.length,                                                    icon: "📦", color: "var(--clr-primary)" },
          { label: "In Transit",        value: shipments.filter(s => s.status === "In Transit").length,             icon: "🚚", color: "#6366f1" },
          { label: "Out For Delivery",  value: shipments.filter(s => s.status === "Out For Delivery").length,       icon: "📍", color: "var(--clr-warning)" },
          { label: "Drivers Tracked",   value: Object.keys(positions).length,                                       icon: "👤", color: "var(--clr-success)" },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {["All", "In Transit", "Out For Delivery", "Dispatched"].map(f => (
          <button key={f} className={`tab-pill${statusFilter === f ? " active" : ""}`} onClick={() => setStatusFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="dash-grid-2">
        {/* Shipment list */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Active Shipments</h2>
            <span className="badge badge-primary">{filtered.length}</span>
          </div>

          {loading && (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <p className="text-muted">Loading shipments…</p>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <p style={{ fontSize: "2rem" }}>📭</p>
              <p className="text-muted">No active shipments right now.</p>
            </div>
          )}

          <div className="shipment-list">
            {filtered.map(s => {
              const hasGps = !!positions[s.trackingNumber];
              const progress = PROGRESS_MAP[s.status] ?? 0;
              return (
                <div
                  key={s.trackingNumber}
                  className={`shipment-row${selectedTrk === s.trackingNumber ? " selected" : ""}`}
                  style={{ cursor: "pointer", borderLeft: selectedTrk === s.trackingNumber ? "3px solid var(--clr-primary)" : "3px solid transparent" }}
                  onClick={() => setSelectedTrk(s.trackingNumber)}
                >
                  <div className="shipment-row-icon">🚚</div>
                  <div className="shipment-row-body">
                    <div className="shipment-row-top">
                      <code className="trk-code" style={{ fontSize: "0.74rem" }}>{s.trackingNumber}</code>
                      <span className={`badge ${STATUS_COLOR[s.status] || "badge-primary"}`}>{s.status}</span>
                    </div>
                    <div className="shipment-route" style={{ fontSize: "0.82rem" }}>
                      {s.pickupAddress} <span className="route-arrow">→</span> {s.destinationAddress}
                    </div>
                    <ProgressBar value={progress} />
                    <div className="shipment-meta-row">
                      <span className="text-xs text-faint">
                        {hasGps ? "📍 GPS active" : "⏳ Awaiting GPS"}
                      </span>
                      <span className="text-xs text-muted">
                        ETA: {s.estimatedArrival ? fmt(s.estimatedArrival) : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map + selected detail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-lg)" }}>
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <h2 className="card-title">Live Fleet Map</h2>
              <span className={`badge ${socketStatus === "live" ? "badge-success" : "badge-muted"}`} style={{ fontSize: "0.75rem" }}>
                {markerPositions.length} driver{markerPositions.length !== 1 ? "s" : ""} on map
              </span>
            </div>

            <div style={{ height: 340, borderRadius: "var(--r-md)", overflow: "hidden" }}>
              <MapContainer
                center={mapCenter}
                zoom={markerPositions.length > 0 ? 12 : 7}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* One marker per shipment with known GPS coordinates */}
                {shipments.map(s => {
                  const pos = positions[s.trackingNumber];
                  if (!pos) return null;
                  const icon = ICONS[s.status] || ICONS.default;
                  return (
                    <Marker
                      key={s.trackingNumber}
                      position={[pos.lat, pos.lng]}
                      icon={icon}
                      eventHandlers={{ click: () => setSelectedTrk(s.trackingNumber) }}
                    >
                      <Popup>
                        <strong>{s.trackingNumber}</strong><br />
                        {s.status}<br />
                        {s.pickupAddress} → {s.destinationAddress}
                      </Popup>
                    </Marker>
                  );
                })}

                {/* Auto-fit bounds when positions change */}
                <FitBounds positions={markerPositions} />
              </MapContainer>
            </div>

            {markerPositions.length === 0 && !loading && (
              <p className="text-xs text-faint" style={{ textAlign: "center", marginTop: "0.5rem" }}>
                No GPS coordinates received yet. Markers appear as drivers share their location.
              </p>
            )}
          </div>

          {selectedShipment && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Selected Shipment</h2>
                <span className={`badge ${STATUS_COLOR[selectedShipment.status] || "badge-primary"}`}>
                  {selectedShipment.status}
                </span>
              </div>
              {[
                { label: "Tracking",  val: selectedShipment.trackingNumber, code: true },
                { label: "Route",     val: `${selectedShipment.pickupAddress} → ${selectedShipment.destinationAddress}` },
                { label: "Receiver",  val: selectedShipment.receiverName },
                { label: "Progress",  val: `${PROGRESS_MAP[selectedShipment.status] ?? 0}%` },
                { label: "ETA",       val: selectedShipment.estimatedArrival ? fmt(selectedShipment.estimatedArrival) : "—", highlight: true },
                { label: "GPS",       val: positions[selectedShipment.trackingNumber]
                    ? `${positions[selectedShipment.trackingNumber].lat.toFixed(4)}, ${positions[selectedShipment.trackingNumber].lng.toFixed(4)}`
                    : "No signal yet" },
              ].map(item => (
                <div className="detail-row" key={item.label}>
                  <span className="detail-label">{item.label}</span>
                  {item.code
                    ? <code style={{ fontSize: "0.82rem", color: "var(--clr-primary)" }}>{item.val}</code>
                    : <span className="detail-val" style={item.highlight ? { color: "var(--clr-primary)", fontWeight: 700 } : {}}>{item.val}</span>
                  }
                </div>
              ))}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => navigate(`/track/${selectedShipment.trackingNumber}`)}>
                  Full Track →
                </button>
                <Link to="/admin/assign" className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                  Reassign
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
