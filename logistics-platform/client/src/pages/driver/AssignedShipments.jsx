import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";

const DEMO_SHIPMENTS = [
  {
    trackingNumber: "TRK260808A1B2",
    customer: "Kofi Mensah",
    phone: "+233 20 123 4567",
    from: "Accra Central Market",
    to: "East Legon, Accra",
    packageType: "Electronics",
    weight: "2.4 kg",
    status: "In Transit",
    distance: "14.2 km",
    eta: "Today, 4:30 PM",
    instructions: "Handle with care. Call customer on arrival.",
  },
  {
    trackingNumber: "TRK260805X3Y4",
    customer: "Ama Owusu",
    phone: "+233 24 987 6543",
    from: "Takoradi Port",
    to: "Tarkwa, W/R",
    packageType: "Documents",
    weight: "0.3 kg",
    status: "Assigned",
    distance: "58.1 km",
    eta: "Aug 24, 2026",
    instructions: "Deliver to reception desk. Signature required.",
  },
  {
    trackingNumber: "TRK260804M3N4",
    customer: "Yaw Darko",
    phone: "+233 55 234 5678",
    from: "Kumasi Central",
    to: "Sunyani, Bono",
    packageType: "Clothing",
    weight: "3.1 kg",
    status: "Dispatched",
    distance: "80.5 km",
    eta: "Aug 25, 2026",
    instructions: "Leave at gate if customer not available.",
  },
];

const STATUS_COLOR = {
  "Assigned":   "badge-muted",
  "Dispatched": "badge-primary",
  "In Transit": "badge-primary",
  "Out For Delivery": "badge-warning",
  "Delivered":  "badge-success",
};

export function AssignedShipments() {
  const { user } = useAuth();
  const { shipments: liveShipments, loading, reload, isBackendLive } = useData();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const isDev = import.meta.env.DEV;
  const hasLiveData = Array.isArray(liveShipments) && liveShipments.length > 0;
  const assignedLive = hasLiveData
    ? liveShipments.filter(s => s.status !== "Pending" || (s.driverId && s.driver !== "—"))
    : (isDev && !isBackendLive ? DEMO_SHIPMENTS : []);

  const filtered = assignedLive.filter(s => {
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    const term = search.toLowerCase();
    const trk = (s.trackingNumber || s.id || "").toLowerCase();
    const cust = (s.customerName || s.customer || "").toLowerCase();
    const dest = (s.destinationAddress || s.to || "").toLowerCase();
    const matchSearch = trk.includes(term) || cust.includes(term) || dest.includes(term);
    return matchStatus && matchSearch;
  });

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Assigned <span className="gradient-text">Shipments</span>
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            All deliveries currently assigned to you, <strong>{user?.name?.split(" ")[0] || "Driver"}</strong>.
          </p>
        </div>
        <Link to="/dashboard/driver" className="btn btn-ghost btn-sm">← Dashboard</Link>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        {[
          { label: "Total Assigned", value: assignedLive.length, icon: "📋", color: "var(--clr-primary)" },
          { label: "In Transit",     value: assignedLive.filter(s => s.status === "In Transit").length, icon: "🚚", color: "#6366f1" },
          { label: "Dispatched",     value: assignedLive.filter(s => s.status === "Dispatched").length, icon: "🏁", color: "var(--clr-warning)" },
          { label: "Awaiting Start", value: assignedLive.filter(s => s.status === "Assigned").length,   icon: "⏳", color: "var(--clr-text-muted)" },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
        {["All", "Assigned", "Dispatched", "In Transit", "Out For Delivery"].map(s => (
          <button key={s} className={`tab-pill${statusFilter === s ? " active" : ""}`} onClick={() => setStatusFilter(s)}>
            {s}
          </button>
        ))}
        <input
          className="form-control search-sm"
          placeholder="Search ID or customer…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: "auto", maxWidth: 240 }}
        />
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "35vh", gap: "1rem" }}>
          <div style={{ fontSize: "2.5rem" }}>📦</div>
          <p className="text-muted">Loading assigned shipments…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <p style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📭</p>
          <h3 style={{ marginBottom: "0.5rem" }}>No Assigned Shipments</h3>
          <p className="text-muted text-sm" style={{ maxWidth: 440, margin: "0 auto 1.5rem" }}>
            {search || statusFilter !== "All"
              ? "No shipments match your active filter criteria."
              : "You do not have any deliveries assigned to you yet. When an administrator assigns a delivery to your route, it will appear here."}
          </p>
          <button className="btn btn-outline btn-sm" onClick={() => reload()}>
            🔄 Refresh List
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filtered.map(s => {
            const trk = s.trackingNumber || s.id;
            return (
              <div key={trk} className="card">
                <div className="assigned-shipment-grid">
                  {/* Shipment info */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                      <code className="trk-code" style={{ fontSize: "0.78rem" }}>{trk}</code>
                      <span className={`badge ${STATUS_COLOR[s.status] || "badge-muted"}`}>{s.status}</span>
                    </div>
                    <div className="shipment-route" style={{ fontSize: "0.85rem" }}>
                      {s.pickupAddress || s.from} <span className="route-arrow">→</span> {s.destinationAddress || s.to}
                    </div>
                    <p className="text-xs text-faint" style={{ marginTop: "0.3rem" }}>
                      {s.packageType || s.type || "Standard"} · {s.weight ? `${s.weight} kg` : ""} {s.distance ? `· ${s.distance}` : ""}
                    </p>
                  </div>

                  {/* Customer */}
                  <div>
                    <p className="text-xs text-faint" style={{ marginBottom: "0.2rem" }}>Customer Contact</p>
                    <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>{s.customerName || s.customer || "Customer"}</p>
                    {(s.customerPhone || s.phone) ? (
                      <a href={`tel:${s.customerPhone || s.phone}`} style={{ fontSize: "0.8rem", color: "var(--clr-primary)" }}>
                        📞 {s.customerPhone || s.phone}
                      </a>
                    ) : <span className="text-xs text-muted">No phone</span>}
                  </div>

                  {/* ETA */}
                  <div>
                    <p className="text-xs text-faint" style={{ marginBottom: "0.2rem" }}>ETA / Date</p>
                    <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--clr-primary)", margin: 0 }}>{s.eta || s.date || "Today"}</p>
                    {s.notes && <p className="text-xs text-faint">{s.notes.slice(0, 40)}…</p>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/driver/delivery/${trk}`)}
                      id={`open-delivery-${trk}`}
                    >
                      Open Details →
                    </button>
                    <Link
                      to="/dashboard/driver"
                      className="btn btn-ghost btn-sm"
                      style={{ textAlign: "center" }}
                    >
                      Update Status
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
