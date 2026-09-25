import { Link } from "react-router-dom";

const ETA_DATA = [
  { trackingNumber:"TRK260808A1B2", customer:"Kofi Mensah",   status:"In Transit",       predictedEta:"Aug 9 · 4:30 PM",  actualEta:"—",             error:"—",    model:"v2.1", ts:"10 min ago" },
  { trackingNumber:"TRK260805X3Y4", customer:"Ama Owusu",     status:"Delivered",        predictedEta:"Aug 5 · 5:00 PM",  actualEta:"Aug 5 · 4:47 PM", error:"-13 min", model:"v2.1", ts:"1d ago" },
  { trackingNumber:"TRK260801Z5W6", customer:"Yaw Darko",     status:"Delivered",        predictedEta:"Aug 3 · 2:00 PM",  actualEta:"Aug 3 · 2:11 PM", error:"+11 min", model:"v2.0", ts:"5d ago" },
  { trackingNumber:"TRK260802K9L0", customer:"Kwame Boateng", status:"Delivered",        predictedEta:"Aug 4 · 10:00 AM", actualEta:"Aug 4 · 10:35 AM",error:"+35 min", model:"v2.0", ts:"6d ago" },
  { trackingNumber:"TRK260804M3N4", customer:"Efua Mensah",   status:"Dispatched",       predictedEta:"Aug 25 · 2:00 PM", actualEta:"—",             error:"—",    model:"v2.1", ts:"2h ago" },
  { trackingNumber:"TRK260823P1Q2", customer:"Kwesi Appiah",  status:"In Transit",       predictedEta:"Aug 24 · 1:00 PM", actualEta:"—",             error:"—",    model:"v2.1", ts:"30 min ago" },
];

const STATUS_COLOR = {
  "In Transit":"badge-primary","Dispatched":"badge-primary","Out For Delivery":"badge-warning","Delivered":"badge-success",
};

function errorColor(e) {
  if (e === "—") return "var(--clr-text-faint)";
  const mins = parseInt(e);
  if (isNaN(mins)) return "var(--clr-text-faint)";
  if (Math.abs(mins) <= 15) return "var(--clr-success)";
  if (Math.abs(mins) <= 30) return "var(--clr-warning)";
  return "var(--clr-danger)";
}

export function ETAMonitoring() {
  const delivered = ETA_DATA.filter(d => d.status === "Delivered" && d.error !== "—");
  const avgError  = delivered.length
    ? (delivered.reduce((s, d) => s + Math.abs(parseInt(d.error)), 0) / delivered.length).toFixed(1)
    : "—";
  const accuracy  = delivered.filter(d => Math.abs(parseInt(d.error)) <= 15).length;
  const pct       = delivered.length ? Math.round((accuracy / delivered.length) * 100) : "—";

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            ETA <span className="gradient-text">Monitoring</span> 🔮
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            Compare predicted vs actual delivery times. Evaluate ML model performance.
          </p>
        </div>
        <Link to="/dashboard/admin" className="btn btn-ghost btn-sm">← Admin</Link>
      </div>

      {/* Summary stats */}
      <div className="stats-grid">
        {[
          { label: "Predictions Made",   value: ETA_DATA.length,   icon: "🔮", color: "var(--clr-primary)" },
          { label: "Completed Deliveries",value: delivered.length,  icon: "✅", color: "var(--clr-success)" },
          { label: "Avg. ETA Error",      value: avgError === "—" ? "—" : `${avgError} min`, icon: "⏱️", color: "#6366f1" },
          { label: "Within ±15 min",      value: pct === "—" ? "—" : `${pct}%`,              icon: "🎯", color: "var(--clr-warning)" },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Model info */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header">
          <h2 className="card-title">🤖 Active Model</h2>
          <span className="badge badge-primary">ML-ETA v2.1 — Gradient Boost</span>
        </div>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          {[
            { label: "Algorithm",    val: "Gradient Boosting Regressor" },
            { label: "Features",     val: "Distance, traffic, time-of-day, driver history" },
            { label: "Training Data",val: "12,400 historical deliveries" },
            { label: "Last Retrain", val: "Aug 1, 2026" },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs text-faint" style={{ marginBottom: "0.2rem" }}>{item.label}</p>
              <p style={{ fontWeight: 500, fontSize: "0.88rem" }}>{item.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header"><h2 className="card-title">ETA Predictions Log</h2></div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tracking ID</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Predicted ETA</th>
                <th>Actual Delivery</th>
                <th>Error</th>
                <th>Model</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {ETA_DATA.map(d => (
                <tr key={d.trackingNumber}>
                  <td><code className="trk-code" style={{ fontSize:"0.75rem" }}>{d.trackingNumber}</code></td>
                  <td className="text-sm">{d.customer}</td>
                  <td><span className={`badge ${STATUS_COLOR[d.status] || "badge-muted"}`}>{d.status}</span></td>
                  <td className="text-sm" style={{ color:"var(--clr-primary)" }}>{d.predictedEta}</td>
                  <td className="text-sm">{d.actualEta}</td>
                  <td style={{ fontWeight:700, color:errorColor(d.error) }}>{d.error}</td>
                  <td><span className="badge badge-muted" style={{ fontSize:"0.72rem" }}>{d.model}</span></td>
                  <td className="text-xs text-faint">{d.ts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
