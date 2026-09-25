import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

// ── Fix Leaflet's broken default icon paths under Vite ──────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const driverIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const destinationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

// Smoothly pan the map whenever the driver position changes
function MapPanner({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.panTo(position, { animate: true, duration: 0.8 });
  }, [position, map]);
  return null;
}

const STATUS_COLOR = {
  "Pending":           "badge-muted",
  "Assigned":          "badge-primary",
  "Dispatched":        "badge-primary",
  "In Transit":        "badge-primary",
  "Out For Delivery":  "badge-warning",
  "Delivered":         "badge-success",
  "Cancelled":         "badge-danger",
};

const PROGRESS_MAP = {
  "Pending": 5, "Assigned": 20, "Dispatched": 35,
  "In Transit": 60, "Out For Delivery": 85, "Delivered": 100, "Cancelled": 0,
};

function ProgressBar({ value }) {
  return (
    <div style={{ background: "var(--clr-surface-2)", borderRadius: "var(--r-full)", height: 8, overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", background: "var(--grad-primary)", borderRadius: "var(--r-full)", transition: "width 0.6s ease" }} />
    </div>
  );
}

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function buildTimeline(statusHistory = [], currentStatus) {
  const STEPS = [
    { status: "Pending",           icon: "📦" },
    { status: "Assigned",          icon: "👤" },
    { status: "Dispatched",        icon: "🏁" },
    { status: "In Transit",        icon: "🚚" },
    { status: "Out For Delivery",  icon: "📍" },
    { status: "Delivered",         icon: "✅" },
  ];
  const histMap = {};
  statusHistory.forEach(h => { histMap[h.status] = h.changedAt || h.timestamp; });
  const currentIdx = STEPS.findIndex(s => s.status === currentStatus);
  return STEPS.map((step, i) => ({
    ...step,
    time: histMap[step.status] ? fmt(histMap[step.status]) : "—",
    done: i <= currentIdx,
  }));
}

export function TrackShipment() {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [shipment, setShipment]         = useState(null);
  const [loading,  setLoading]          = useState(true);
  const [error,    setError]            = useState(null);
  const [searchInput, setSearchInput]   = useState("");
  const [driverPos, setDriverPos]       = useState(null); // { lat, lng }
  const [socketStatus, setSocketStatus] = useState("connecting"); // connecting | live | offline

  const socketRef = useRef(null);

  // ── Fetch shipment from backend ────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`/shipments/track/${trackingNumber}`)
      .then(res => {
        setShipment(res.data);
        // Seed driver position from last known coordinates
        if (res.data.currentLatitude && res.data.currentLongitude) {
          setDriverPos({ lat: res.data.currentLatitude, lng: res.data.currentLongitude });
        }
      })
      .catch(err => {
        if (err.response?.status === 404) setError("not_found");
        else setError("server_error");
      })
      .finally(() => setLoading(false));
  }, [trackingNumber]);

  // ── Socket.IO — subscribe to live driver location updates ─────────────────
  useEffect(() => {
    if (!trackingNumber) return;

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    // Use the stored Firebase/demo token if available
    const token = api.defaults.headers.common?.Authorization?.replace("Bearer ", "") || "public";

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketStatus("live");
      socket.emit("shipment:join", { trackingNumber });
    });

    socket.on("shipment:locationUpdate", ({ latitude, longitude }) => {
      setDriverPos({ lat: latitude, lng: longitude });
    });

    socket.on("disconnect", () => setSocketStatus("offline"));
    socket.on("connect_error", () => setSocketStatus("offline"));

    return () => { socket.disconnect(); };
  }, [trackingNumber]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="track-page">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: "1rem" }}>
          <div style={{ fontSize: "2.5rem" }}>📦</div>
          <p className="text-muted">Loading shipment…</p>
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (error === "not_found" || !shipment) {
    return (
      <div className="track-page">
        <div className="track-not-found">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
          <h1>Shipment Not Found</h1>
          <p className="text-muted" style={{ margin: "0.75rem 0 1.5rem" }}>
            No shipment found for tracking number <strong>{trackingNumber}</strong>.
          </p>
          <form
            onSubmit={e => { e.preventDefault(); if (searchInput.trim()) navigate(`/track/${searchInput.trim()}`); }}
            style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}
          >
            <input className="form-control" style={{ maxWidth: 280 }} placeholder="Try another tracking number"
              value={searchInput} onChange={e => setSearchInput(e.target.value)} />
            <button type="submit" className="btn btn-primary">Track</button>
          </form>
          <p style={{ marginTop: "1rem" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("/")}>← Back to home</button>
          </p>
        </div>
      </div>
    );
  }

  // ── Server error ───────────────────────────────────────────────────────────
  if (error === "server_error") {
    return (
      <div className="track-page">
        <div className="track-not-found">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
          <h1>Unable to Load Shipment</h1>
          <p className="text-muted" style={{ margin: "0.75rem 0 1.5rem" }}>
            Could not reach the server. Please try again in a moment.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  const progress  = PROGRESS_MAP[shipment.status] ?? 0;
  const timeline  = buildTimeline(shipment.statusHistory, shipment.status);
  const isLive    = driverPos && ["In Transit", "Out For Delivery", "Dispatched"].includes(shipment.status);
  // Default map centre: Accra, Ghana
  const mapCenter = driverPos ? [driverPos.lat, driverPos.lng] : [5.6037, -0.1870];

  return (
    <div className="track-page">
      {/* ── Page Header ── */}
      <div className="track-header">
        <div>
          <h1 className="dashboard-title">
            Tracking <span className="gradient-text">{shipment.trackingNumber}</span>
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            {shipment.pickupAddress} <span className="route-arrow">→</span> {shipment.destinationAddress}
          </p>
        </div>
        <span className={`badge ${STATUS_COLOR[shipment.status] || "badge-muted"}`} style={{ fontSize: "0.9rem", padding: "0.5rem 1rem" }}>
          {shipment.status}
        </span>
      </div>

      {/* ── Progress Bar ── */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <span className="text-muted text-sm">Delivery Progress</span>
          <span className="text-sm" style={{ fontWeight: 600, color: "var(--clr-primary)" }}>{progress}%</span>
        </div>
        <ProgressBar value={progress} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
          <span className="text-xs text-faint">{shipment.pickupAddress}</span>
          <span className="text-xs text-faint">{shipment.destinationAddress}</span>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 1.6fr" }}>
        {/* ── Timeline ── */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Shipment Timeline</h2></div>
          <div className="timeline">
            {timeline.map((step, i) => (
              <div key={i} className={`timeline-step${step.done ? " done" : ""}`}>
                <div className="timeline-icon">{step.icon}</div>
                <div className="timeline-line" />
                <div className="timeline-body">
                  <div className="timeline-status">{step.status}</div>
                  <div className="timeline-time">{step.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Details + Live Map ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Details */}
          <div className="card">
            <div className="card-header"><h2 className="card-title">Shipment Details</h2></div>
            <div>
              {[
                { label: "Tracking #",  val: shipment.trackingNumber, code: true },
                { label: "Receiver",    val: `${shipment.receiverName} · ${shipment.receiverPhone}` },
                { label: "Package",     val: `${shipment.packageType} · ${shipment.weight} kg` },
                { label: "Created",     val: fmt(shipment.createdAt) },
                { label: "ETA",         val: shipment.estimatedArrival ? fmt(shipment.estimatedArrival) : "Calculating…", highlight: true },
              ].map(item => (
                <div className="detail-row" key={item.label}>
                  <span className="detail-label">{item.label}</span>
                  {item.code
                    ? <code style={{ fontSize: "0.82rem", color: "var(--clr-primary)" }}>{item.val}</code>
                    : <span className="detail-val" style={item.highlight ? { color: "var(--clr-primary)", fontWeight: 600 } : {}}>{item.val}</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Live Map */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <h2 className="card-title">Live Driver Location</h2>
              <span className={`badge ${socketStatus === "live" ? "badge-success" : "badge-muted"}`} style={{ fontSize: "0.75rem" }}>
                {socketStatus === "live" ? "● Live" : socketStatus === "connecting" ? "⏳ Connecting" : "○ Offline"}
              </span>
            </div>

            {/* Always render the map; show a notice overlay when no GPS data yet */}
            <div style={{ height: 300, borderRadius: "var(--r-md)", overflow: "hidden", position: "relative" }}>
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Driver marker — only when we have coordinates */}
                {driverPos && (
                  <Marker position={[driverPos.lat, driverPos.lng]} icon={driverIcon}>
                    <Popup>🚚 Driver is here</Popup>
                  </Marker>
                )}

                {/* Pan map smoothly on every GPS update */}
                {driverPos && <MapPanner position={[driverPos.lat, driverPos.lng]} />}
              </MapContainer>

              {/* Overlay when driver hasn't shared location yet */}
              {!isLive && (
                <div style={{
                  position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  background: "rgba(0,0,0,0.55)", borderRadius: "var(--r-md)",
                  pointerEvents: "none", gap: "0.4rem",
                }}>
                  <span style={{ fontSize: "2rem" }}>📍</span>
                  <p style={{ color: "#fff", fontWeight: 600, margin: 0, fontSize: "0.9rem" }}>
                    {shipment.status === "Delivered" ? "Shipment delivered ✅" : "Awaiting driver GPS signal…"}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", margin: 0 }}>
                    Map will update automatically once the driver is en route.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
