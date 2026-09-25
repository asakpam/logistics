import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api.js";

// ── Chart helpers ────────────────────────────────────────────────────────────

function BarChart({ data, color = "var(--clr-primary)" }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: 120, padding: "0 0.5rem" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
          <span style={{ fontSize: "0.7rem", color: "var(--clr-text-muted)", fontWeight: 600 }}>{d.value}</span>
          <div style={{
            width: "100%", background: color, borderRadius: "var(--r-sm) var(--r-sm) 0 0",
            height: `${(d.value / max) * 90}px`, transition: "height 0.6s ease", opacity: 0.8,
          }} />
          <span style={{ fontSize: "0.65rem", color: "var(--clr-text-faint)", textAlign: "center" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ value, total, color, label }) {
  const r = 40, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const pct  = total > 0 ? (value / total) * circ : 0;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--clr-surface-2)" strokeWidth="14" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={`${pct} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 50 50)" style={{ transition: "stroke-dasharray 0.8s ease" }} />
        <text x="50" y="46" textAnchor="middle" style={{ fontSize: "14px", fontWeight: 800, fill: "var(--clr-text)" }}>
          {total > 0 ? Math.round((value / total) * 100) : 0}%
        </text>
        <text x="50" y="60" textAnchor="middle" style={{ fontSize: "8px", fill: "var(--clr-text-muted)" }}>{label}</text>
      </svg>
    </div>
  );
}

// ── Range helpers ────────────────────────────────────────────────────────────

const RANGE_OPTIONS = [
  { label: "Today",         value: "today"   },
  { label: "This Week",     value: "week"    },
  { label: "This Month",    value: "month"   },
  { label: "Last 3 Months", value: "3months" },
  { label: "This Year",     value: "year"    },
];

// ── Component ────────────────────────────────────────────────────────────────

export function Reports() {
  const [range,   setRange]   = useState("month");
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchReports = useCallback(async (r) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/reports?range=${r}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load report data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(range); }, [range, fetchReports]);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Reports <span className="gradient-text">Dashboard</span> 📊</h1>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "40vh", gap: "1rem" }}>
          <div style={{ fontSize: "2.5rem" }}>📊</div>
          <p className="text-muted">Aggregating data…</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Reports <span className="gradient-text">Dashboard</span> 📊</h1>
          <Link to="/dashboard/admin" className="btn btn-ghost btn-sm">← Admin</Link>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "2rem" }}>⚠️</p>
          <p className="text-muted" style={{ margin: "0.75rem 0 1.5rem" }}>{error || "No data available."}</p>
          <button className="btn btn-primary" onClick={() => fetchReports(range)}>Retry</button>
        </div>
      </div>
    );
  }

  const { kpi, monthly, byStatus, driverPerf } = data;

  // ── KPI cards ──────────────────────────────────────────────────────────────
  const stats = [
    { label: "Total Shipments",     value: kpi.totalShipments,                                                icon: "📦", color: "var(--clr-primary)",  sub: `${kpi.active} currently active` },
    { label: "Successful Deliveries",value: kpi.delivered,                                                    icon: "✅", color: "var(--clr-success)",  sub: `${kpi.successRate}% success rate` },
    { label: "Avg. Delivery Time",  value: kpi.avgDeliveryHours != null ? `${kpi.avgDeliveryHours}h` : "—",  icon: "⏱️", color: "#6366f1",            sub: "based on delivered shipments" },
    { label: "Delayed / Unresolved",value: kpi.delayed,                                                       icon: "⚠️", color: "var(--clr-warning)",  sub: `${kpi.delayRate}% delay rate` },
  ];

  // ── Chart data ─────────────────────────────────────────────────────────────
  const monthlyChartData = monthly.map(m => ({ label: m.month, value: m.count }));

  const STATUS_COLORS = {
    "Delivered":        "var(--clr-success)",
    "In Transit":       "var(--clr-primary)",
    "Out For Delivery": "var(--clr-warning)",
    "Assigned":         "#6366f1",
    "Dispatched":       "#06b6d4",
    "Pending":          "var(--clr-text-muted)",
    "Cancelled":        "var(--clr-danger)",
  };

  const deliveredCount = byStatus.find(s => s.status === "Delivered")?.count || 0;
  const activeCount    = byStatus.filter(s => ["In Transit","Out For Delivery","Dispatched","Assigned"].includes(s.status))
                                 .reduce((sum, s) => sum + s.count, 0);

  const statusChartData = byStatus.map(s => ({ label: s.status.replace("Out For Delivery", "OFD"), value: s.count }));

  return (
    <div className="dashboard-page">
      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Reports <span className="gradient-text">Dashboard</span> 📊
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            Platform analytics, delivery performance, and driver stats.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link to="/dashboard/admin" className="btn btn-ghost btn-sm">← Admin</Link>
          <select
            className="form-control"
            value={range}
            onChange={e => setRange(e.target.value)}
            style={{ maxWidth: 160 }}
          >
            {RANGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button className="btn btn-outline btn-sm" onClick={() => fetchReports(range)}>↻ Refresh</button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="stats-grid">
        {stats.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--clr-text-faint)", marginTop: "0.2rem" }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="dash-grid-3">
        {/* Monthly bar chart */}
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div className="card-header">
            <h2 className="card-title">Monthly Shipments</h2>
            <span className="badge badge-muted">Last 6 months</span>
          </div>
          {monthlyChartData.length > 0
            ? <BarChart data={monthlyChartData} color="var(--clr-primary)" />
            : <p className="text-muted" style={{ padding: "2rem", textAlign: "center" }}>No data for this period.</p>
          }
        </div>

        {/* Status donut + legend */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Status Breakdown</h2></div>
          <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "0.5rem", paddingTop: "0.5rem" }}>
            <DonutChart value={deliveredCount} total={kpi.totalShipments} color="var(--clr-success)" label="Delivered" />
            <DonutChart value={activeCount}    total={kpi.totalShipments} color="var(--clr-primary)" label="Active" />
          </div>
          {byStatus.map(item => (
            <div key={item.status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderBottom: "1px solid var(--clr-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLORS[item.status] || "var(--clr-text-muted)" }} />
                <span className="text-sm text-muted">{item.status}</span>
              </div>
              <span style={{ fontWeight: 700, color: STATUS_COLORS[item.status] || "inherit" }}>{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Status bar chart ── */}
      {statusChartData.length > 0 && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <div className="card-header"><h2 className="card-title">Shipments by Status</h2></div>
          <BarChart data={statusChartData} color="#6366f1" />
        </div>
      )}

      {/* ── ETA accuracy summary ── */}
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <div className="card-header">
          <h2 className="card-title">Delivery Time Summary</h2>
        </div>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          {[
            { label: "Total Delivered",    value: kpi.delivered,                                                         color: "var(--clr-success)" },
            { label: "Success Rate",       value: `${kpi.successRate}%`,                                                  color: "var(--clr-primary)" },
            { label: "Avg. Delivery Time", value: kpi.avgDeliveryHours != null ? `${kpi.avgDeliveryHours}h` : "—",       color: "#6366f1" },
            { label: "Delay Rate",         value: `${kpi.delayRate}%`,                                                    color: kpi.delayRate > 15 ? "var(--clr-danger)" : "var(--clr-warning)" },
          ].map(item => (
            <div key={item.label} style={{ minWidth: 160 }}>
              <p className="text-xs text-faint" style={{ marginBottom: "0.2rem" }}>{item.label}</p>
              <p style={{ fontWeight: 800, fontSize: "1.4rem", color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Driver performance table ── */}
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <div className="card-header">
          <h2 className="card-title">Driver Performance</h2>
          <Link to="/admin/drivers" className="btn btn-ghost btn-sm">Manage Drivers →</Link>
        </div>

        {driverPerf.length === 0 ? (
          <p className="text-muted" style={{ padding: "2rem", textAlign: "center" }}>No driver delivery data for this period.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Total Assigned</th>
                  <th>Delivered</th>
                  <th>On Time</th>
                  <th>Avg. Time</th>
                  <th>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {driverPerf.map(d => (
                  <tr key={d.driverId}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--clr-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>
                          {d.name[0]}
                        </div>
                        {d.name}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{d.deliveries}</td>
                    <td style={{ color: "var(--clr-success)", fontWeight: 700 }}>{d.delivered}</td>
                    <td style={{ color: "var(--clr-primary)", fontWeight: 600 }}>{d.onTime}</td>
                    <td>{d.avgDeliveryHours != null ? `${d.avgDeliveryHours}h` : "—"}</td>
                    <td>
                      <span className={`badge ${d.successRate >= 90 ? "badge-success" : d.successRate >= 70 ? "badge-warning" : "badge-danger"}`}>
                        {d.successRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
