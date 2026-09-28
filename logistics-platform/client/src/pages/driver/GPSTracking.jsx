import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { api } from "../../lib/api.js";

// Fix Leaflet's broken default icon paths under Vite
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

function MapPanner({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.panTo(position, { animate: true, duration: 0.8 });
  }, [position, map]);
  return null;
}

export function GPSTracking() {
  const { user } = useAuth();
  const { shipments } = useData();
  const [tracking, setTracking]             = useState(false);
  const [coords, setCoords]                 = useState(null);
  const [error, setError]                   = useState("");
  const [accuracy, setAccuracy]             = useState(null);
  const [history, setHistory]               = useState([]);
  const [shareTime, setShareTime]           = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);

  const watchId = useRef(null);
  const timerRef = useRef(null);
  const socketRef = useRef(null);
  const lastPostTimeRef = useRef(0);

  // Find active shipment for driver
  const liveActive = shipments?.find(s =>
    ["In Transit", "Out For Delivery", "Dispatched", "Assigned"].includes(s.status)
  );

  const activeDelivery = liveActive ? {
    trackingNumber: liveActive.trackingNumber || liveActive.id,
    customer: liveActive.customerName || liveActive.customer || "Customer",
    to: liveActive.destinationAddress || liveActive.to || "Destination",
    eta: liveActive.eta || "Today",
    status: liveActive.status,
  } : {
    trackingNumber: "TRK260808A1B2",
    to: "East Legon, Accra",
    customer: "Kofi Mensah",
    eta: "Today, 4:30 PM",
    status: "In Transit",
  };

  function connectSocket(trk) {
    if (socketRef.current?.connected) return socketRef.current;

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const token = api.defaults.headers.common?.Authorization?.replace("Bearer ", "") || "demo-token";

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      setSocketConnected(true);
      if (trk) {
        socket.emit("shipment:join", { trackingNumber: trk });
      }
    });

    socket.on("disconnect", () => setSocketConnected(false));
    socket.on("connect_error", () => setSocketConnected(false));

    socketRef.current = socket;
    return socket;
  }

  function startTracking() {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    const trk = activeDelivery.trackingNumber;
    const socket = connectSocket(trk);

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const c = {
          lat: lat.toFixed(6),
          lng: lng.toFixed(6),
          ts: new Date().toLocaleTimeString(),
        };
        setCoords(c);
        setAccuracy(pos.coords.accuracy?.toFixed(0));
        setHistory(prev => [c, ...prev].slice(0, 5));

        // 1. Live Socket.IO emission to customer tracking room
        if (socket?.connected) {
          socket.emit("driver:location", {
            trackingNumber: trk,
            latitude: lat,
            longitude: lng,
          });
        }

        // 2. Throttle POST to database / API (once every 10 seconds)
        const now = Date.now();
        if (now - lastPostTimeRef.current > 10000) {
          lastPostTimeRef.current = now;
          api.post("/tracking/location", {
            trackingNumber: trk,
            latitude: lat,
            longitude: lng,
          }).catch(() => {
            // Silently ignore if offline or demo mode
          });
        }
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    timerRef.current = setInterval(() => setShareTime(t => t + 1), 1000);
    setTracking(true);
  }

  function stopTracking() {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    }
    setTracking(false);
  }

  useEffect(() => () => { stopTracking(); }, []);

  function fmtTime(s) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${h > 0 ? h + "h " : ""}${m > 0 ? m + "m " : ""}${sec}s`;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            GPS <span className="gradient-text">Tracking</span> 📡
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            Share your live location with customers during delivery.
          </p>
        </div>
        <Link to="/dashboard/driver" className="btn btn-ghost btn-sm">← Dashboard</Link>
      </div>

      {/* Status banner */}
      {tracking ? (
        <div className="alert alert-info" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.3rem" }}>📡</span>
            <div>
              <p style={{ fontWeight: 700 }}>
                Live GPS Tracking Active {socketConnected && <span style={{ fontSize: "0.8rem", color: "var(--clr-success)" }}>(Real-time Connected)</span>}
              </p>
              <p className="text-xs" style={{ opacity: 0.8 }}>
                Broadcasting position for <strong>{activeDelivery.trackingNumber}</strong>. Sharing for {fmtTime(shareTime)}.
              </p>
            </div>
          </div>
          <div style={{ width: 10, height: 10, background: "var(--clr-success)", borderRadius: "50%", animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>
      ) : (
        <div style={{ background: "var(--clr-surface-2)", borderRadius: "var(--r-lg)", padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem", border: "1px solid var(--clr-border)" }}>
          <span style={{ fontSize: "1.2rem" }}>⏸️</span>
          <p className="text-muted text-sm">GPS sharing is <strong>inactive</strong>. Start sharing to let customers track you on the live map.</p>
        </div>
      )}

      <div className="dash-grid-2">
        {/* Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-lg)" }}>
          {/* Toggle */}
          <div className="card">
            <div className="card-header"><h2 className="card-title">Location Sharing</h2></div>
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <button
                id="toggle-gps-btn"
                className={`btn ${tracking ? "btn-danger" : "btn-success"}`}
                style={{ fontSize: "1.1rem", padding: "1rem 2.5rem", borderRadius: "var(--r-full)" }}
                onClick={tracking ? stopTracking : startTracking}
              >
                {tracking ? "⏹ Stop Sharing" : "📍 Go Live — Start Sharing"}
              </button>
              {error && (
                <p style={{ color: "var(--clr-danger)", fontSize: "0.83rem", marginTop: "1rem" }}>{error}</p>
              )}
            </div>

            {/* Current coordinates */}
            {coords ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div className="detail-row">
                  <span className="detail-label">Latitude</span>
                  <code style={{ color: "var(--clr-primary)" }}>{coords.lat}°</code>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Longitude</span>
                  <code style={{ color: "var(--clr-primary)" }}>{coords.lng}°</code>
                </div>
                {accuracy && (
                  <div className="detail-row">
                    <span className="detail-label">Accuracy</span>
                    <span className="detail-val">±{accuracy}m</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Last Update</span>
                  <span className="detail-val">{coords.ts}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Sharing Duration</span>
                  <span className="detail-val" style={{ color: "var(--clr-primary)", fontWeight: 700 }}>{fmtTime(shareTime)}</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "1rem", color: "var(--clr-text-faint)" }}>
                <p className="text-sm">
                  {tracking ? "Acquiring GPS signal…" : "Start sharing to see your coordinates."}
                </p>
              </div>
            )}
          </div>

          {/* Active delivery */}
          <div className="card">
            <div className="card-header"><h2 className="card-title">Active Delivery</h2></div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div className="detail-row">
                <span className="detail-label">Shipment</span>
                <code style={{ fontSize: "0.82rem", color: "var(--clr-primary)" }}>{activeDelivery.trackingNumber}</code>
              </div>
              <div className="detail-row">
                <span className="detail-label">Customer</span>
                <span className="detail-val">{activeDelivery.customer}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Destination</span>
                <span className="detail-val">{activeDelivery.to}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className="badge badge-primary">{activeDelivery.status}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">ETA</span>
                <span className="detail-val" style={{ color: "var(--clr-primary)", fontWeight: 700 }}>{activeDelivery.eta}</span>
              </div>
            </div>
            <Link to={`/driver/delivery/${activeDelivery.trackingNumber}`} className="btn btn-outline btn-sm" style={{ marginTop: "1rem", width: "100%", justifyContent: "center" }}>
              Open Delivery Details →
            </Link>
          </div>

          {/* Location history */}
          {history.length > 0 && (
            <div className="card">
              <div className="card-header"><h2 className="card-title">Recent Location Updates</h2></div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {history.map((h, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderBottom: "1px solid var(--clr-border)" }}>
                    <span className="text-xs text-faint">{h.ts}</span>
                    <code style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)" }}>{h.lat}, {h.lng}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="card" style={{ minHeight: 400, display: "flex", flexDirection: "column" }}>
          <div className="card-header">
            <h2 className="card-title">Live Map</h2>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              {tracking && (
                <span className="badge badge-success" style={{ fontSize: "0.75rem" }}>
                  ● Sharing {socketConnected ? "(Real-time)" : ""}
                </span>
              )}
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 380, borderRadius: "var(--r-md)", overflow: "hidden", position: "relative" }}>
            {coords ? (
              <MapContainer
                center={[parseFloat(coords.lat), parseFloat(coords.lng)]}
                zoom={15}
                style={{ height: "100%", minHeight: 380, width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapPanner position={[parseFloat(coords.lat), parseFloat(coords.lng)]} />
                <Marker position={[parseFloat(coords.lat), parseFloat(coords.lng)]} icon={driverIcon}>
                  <Popup>
                    <strong>Your Location</strong><br />
                    {coords.lat}, {coords.lng}<br />
                    <small>Accuracy: ±{accuracy || "—"}m</small>
                  </Popup>
                </Marker>
              </MapContainer>
            ) : (
              <div className="map-placeholder" style={{ height: "100%", minHeight: 380 }}>
                <div className="map-placeholder-inner">
                  <span style={{ fontSize: "3rem" }}>🗺️</span>
                  <p style={{ fontWeight: 700, marginTop: "0.5rem" }}>Live Driver Map</p>
                  <p className="text-xs text-faint" style={{ maxWidth: 260, textAlign: "center" }}>
                    Click &quot;Go Live — Start Sharing&quot; to acquire your GPS position and transmit to the customer tracking map.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
