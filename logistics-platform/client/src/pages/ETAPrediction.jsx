import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

const DEMO_ETA = {
  "TRK260808A1B2": {
    trackingNumber: "TRK260808A1B2",
    destination: "Kumasi, Ashanti",
    status: "In Transit",
    predictedEta: new Date(Date.now() + 1000 * 60 * 60 * 14).toISOString(), // 14h from now
    lastUpdate: "10 minutes ago",
    confidence: 91,
    model: "ML-ETA v2.1 (Gradient Boost)",
    factors: ["Distance: 270 km", "Traffic: Moderate", "Driver speed: 82 km/h", "Historical avg: 13.5h"],
  },
  "TRK260805X3Y4": {
    trackingNumber: "TRK260805X3Y4",
    destination: "Accra, Greater Accra",
    status: "Out For Delivery",
    predictedEta: new Date(Date.now() + 1000 * 60 * 90).toISOString(), // 90 min
    lastUpdate: "3 minutes ago",
    confidence: 97,
    model: "ML-ETA v2.1 (Gradient Boost)",
    factors: ["Distance: 4.2 km", "Traffic: Low", "Driver: On final stretch", "Historical avg: 25 min"],
  },
};

function Countdown({ targetIso }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function calc() {
      const diff = new Date(targetIso) - new Date();
      if (diff <= 0) { setRemaining("Delivered"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h > 0 ? h + "h " : ""}${m}m ${s}s`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return (
    <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "2.5rem", fontWeight: 800, color: "var(--clr-primary)", letterSpacing: 2 }}>
      {remaining}
    </span>
  );
}

export function ETAPrediction() {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState("");

  const data = DEMO_ETA[trackingNumber] || DEMO_ETA["TRK260808A1B2"];
  const etaDate = new Date(data.predictedEta);
  const etaFormatted = etaDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) +
    " · " + etaDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const STATUS_COLOR = {
    "Pending": "badge-muted", "Assigned": "badge-primary", "Dispatched": "badge-primary",
    "In Transit": "badge-primary", "Out For Delivery": "badge-warning",
    "Delivered": "badge-success", "Cancelled": "badge-danger",
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            <span className="gradient-text">ETA Prediction</span> 🔮
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            ML-powered delivery time estimate for <code style={{ color: "var(--clr-primary)" }}>{data.trackingNumber}</code>
          </p>
        </div>
        <span className={`badge ${STATUS_COLOR[data.status]}`} style={{ fontSize: "0.9rem", padding: "0.5rem 1rem" }}>
          {data.status}
        </span>
      </div>

      {/* Quick lookup */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header">
          <h2 className="card-title">Look Up Another Shipment</h2>
        </div>
        <form
          style={{ display: "flex", gap: "0.75rem" }}
          onSubmit={e => { e.preventDefault(); if (input.trim()) navigate(`/eta/${input.trim()}`); }}
        >
          <input
            id="eta-tracking-input"
            className="form-control"
            placeholder="Enter tracking number (e.g. TRK260808A1B2)"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Predict →</button>
        </form>
      </div>

      <div className="dash-grid-3">
        {/* Countdown card */}
        <div className="card" style={{ gridColumn: "span 2", textAlign: "center" }}>
          <div style={{ padding: "1rem 0" }}>
            <p className="text-muted text-sm" style={{ marginBottom: "0.5rem", letterSpacing: 1, textTransform: "uppercase", fontSize: "0.75rem" }}>
              Estimated Time Remaining
            </p>
            <Countdown targetIso={data.predictedEta} />
            <p className="text-muted" style={{ marginTop: "0.75rem" }}>
              Predicted arrival: <strong style={{ color: "var(--clr-text)" }}>{etaFormatted}</strong>
            </p>
            <p className="text-muted text-sm" style={{ marginTop: "0.4rem" }}>
              Destination: <strong>{data.destination}</strong>
            </p>

            {/* Confidence bar */}
            <div style={{ maxWidth: 360, margin: "1.5rem auto 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span className="text-xs text-muted">Prediction Confidence</span>
                <span className="text-xs" style={{ fontWeight: 700, color: "var(--clr-success)" }}>{data.confidence}%</span>
              </div>
              <div style={{ background: "var(--clr-surface-2)", borderRadius: "var(--r-full)", height: 8, overflow: "hidden" }}>
                <div style={{ width: `${data.confidence}%`, height: "100%", background: "var(--clr-success)", borderRadius: "var(--r-full)", transition: "width 0.6s ease" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Status + update */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Live Status</h2></div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div className="detail-row">
              <span className="detail-label">Tracking No.</span>
              <code style={{ fontSize: "0.82rem", color: "var(--clr-primary)" }}>{data.trackingNumber}</code>
            </div>
            <div className="detail-row">
              <span className="detail-label">Current Status</span>
              <span className={`badge ${STATUS_COLOR[data.status]}`}>{data.status}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Destination</span>
              <span className="detail-val">{data.destination}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Last Updated</span>
              <span className="detail-val">{data.lastUpdate}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Confidence</span>
              <span className="detail-val" style={{ color: "var(--clr-success)", fontWeight: 700 }}>{data.confidence}%</span>
            </div>
          </div>
          <Link
            to={`/track/${data.trackingNumber}`}
            className="btn btn-ghost btn-sm"
            style={{ marginTop: "1rem", width: "100%", justifyContent: "center" }}
          >
            View Full Tracking →
          </Link>
        </div>
      </div>

      {/* Model info */}
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <div className="card-header">
          <h2 className="card-title">Prediction Model Info</h2>
          <span className="badge badge-primary" style={{ fontSize: "0.75rem" }}>🤖 {data.model}</span>
        </div>
        <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>
          This ETA is computed by our machine-learning model trained on historical delivery data. Factors considered:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          {data.factors.map((f, i) => (
            <span key={i} style={{ background: "var(--clr-surface-2)", border: "1px solid var(--clr-border)", borderRadius: "var(--r-full)", padding: "0.3rem 0.9rem", fontSize: "0.82rem", color: "var(--clr-text-muted)" }}>
              {f}
            </span>
          ))}
        </div>
        <p className="text-xs text-faint" style={{ marginTop: "1rem" }}>
          ⚠️ ETA is an estimate and may vary due to traffic, weather, or driver routing changes. The platform updates predictions every 5 minutes.
        </p>
      </div>
    </div>
  );
}
