import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export function GPSTracking() {
  const { user } = useAuth();
  const [tracking, setTracking]   = useState(false);
  const [coords, setCoords]       = useState(null);
  const [error, setError]         = useState("");
  const [accuracy, setAccuracy]   = useState(null);
  const [history, setHistory]     = useState([]);
  const [shareTime, setShareTime] = useState(0);
  const watchId = useRef(null);
  const timerRef = useRef(null);

  function startTracking() {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6), ts: new Date().toLocaleTimeString() };
        setCoords(c);
        setAccuracy(pos.coords.accuracy?.toFixed(0));
        setHistory(prev => [c, ...prev].slice(0, 5));
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    timerRef.current = setInterval(() => setShareTime(t => t + 1), 1000);
    setTracking(true);
  }

  function stopTracking() {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    clearInterval(timerRef.current);
    setTracking(false);
  }

  useEffect(() => () => { stopTracking(); }, []);

  function fmtTime(s) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${h > 0 ? h + "h " : ""}${m > 0 ? m + "m " : ""}${sec}s`;
  }

  const activeDelivery = { trackingNumber: "TRK260808A1B2", to: "East Legon, Accra", customer: "Kofi Mensah", eta: "Today, 4:30 PM" };

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
              <p style={{ fontWeight: 700 }}>Live GPS Tracking Active</p>
              <p className="text-xs" style={{ opacity: 0.8 }}>
                Your location is being shared. Sharing for {fmtTime(shareTime)}.
              </p>
            </div>
          </div>
          <div style={{ width: 10, height: 10, background: "var(--clr-success)", borderRadius: "50%", animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>
      ) : (
        <div style={{ background: "var(--clr-surface-2)", borderRadius: "var(--r-lg)", padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem", border: "1px solid var(--clr-border)" }}>
          <span style={{ fontSize: "1.2rem" }}>⏸️</span>
          <p className="text-muted text-sm">GPS sharing is <strong>inactive</strong>. Start sharing to let customers track you.</p>
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
        <div className="card" style={{ minHeight: 400 }}>
          <div className="card-header">
            <h2 className="card-title">Live Map</h2>
            {tracking && <span className="badge badge-success" style={{ fontSize: "0.75rem" }}>● Sharing</span>}
          </div>
          <div className="map-placeholder" style={{ flex: 1, minHeight: 360 }}>
            <div className="map-placeholder-inner">
              <span style={{ fontSize: "3rem" }}>🗺️</span>
              <p style={{ fontWeight: 700, marginTop: "0.5rem" }}>Live Driver Map</p>
              <p className="text-xs text-faint" style={{ maxWidth: 260, textAlign: "center" }}>
                Connect Google Maps / Leaflet to display your real-time location and route to the destination.
              </p>
              {coords && (
                <p className="text-xs" style={{ marginTop: "0.75rem", color: "var(--clr-primary)", fontWeight: 600 }}>
                  📍 {coords.lat}, {coords.lng}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
