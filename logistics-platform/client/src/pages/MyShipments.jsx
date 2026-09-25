import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";

const STATUS_COLOR = {
  "Pending":          "badge-muted",
  "Assigned":         "badge-primary",
  "Dispatched":       "badge-primary",
  "In Transit":       "badge-primary",
  "Out For Delivery": "badge-warning",
  "Delivered":        "badge-success",
  "Cancelled":        "badge-danger",
};

const DEMO_SHIPMENTS = [
  { id: "TRK260808A1B2", from: "Accra Central", to: "Kumasi, Ashanti", status: "In Transit",       statusColor: "badge-primary", eta: "Aug 9, 2026",        date: "Aug 8, 2026", weight: "2.4 kg", packageType: "Electronics",        driver: "Emmanuel Adu",   progress: 65  },
  { id: "TRK260805X3Y4", from: "Takoradi, W/R", to: "Accra, Greater Accra", status: "Out For Delivery", statusColor: "badge-warning", eta: "Today by 5 PM",     date: "Aug 5, 2026", weight: "0.3 kg", packageType: "Documents",           driver: "Samuel Adjei",   progress: 88  },
  { id: "TRK260801Z5W6", from: "Kumasi, Ashanti", to: "Tamale, N/R",        status: "Delivered",        statusColor: "badge-success", eta: "Delivered Aug 3",   date: "Aug 1, 2026", weight: "5.1 kg", packageType: "Clothing",            driver: "Victor Boateng", progress: 100 },
  { id: "TRK260808Q7R8", from: "Accra",          to: "Cape Coast, C/R",    status: "Pending",           statusColor: "badge-muted",   eta: "Awaiting assignment",date: "Aug 8, 2026", weight: "1.2 kg", packageType: "Food & Perishables",  driver: "—",              progress: 8   },
  { id: "TRK260802K9L0", from: "Tema, Greater Accra", to: "Sunyani, Bono", status: "Delivered",        statusColor: "badge-success", eta: "Delivered Aug 4",   date: "Aug 2, 2026", weight: "3.7 kg", packageType: "Machinery",           driver: "Emmanuel Adu",   progress: 100 },
];

function ProgressBar({ value, color = "var(--clr-primary)" }) {
  return (
    <div style={{ background: "var(--clr-surface-2)", borderRadius: "var(--r-full)", height: 6, overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: "var(--r-full)", transition: "width 0.6s ease" }} />
    </div>
  );
}

export function MyShipments() {
  const { user } = useAuth();
  const { shipments: liveShipments, loading } = useData();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("table"); // "table" | "cards"

  const allShipments = liveShipments.length > 0 ? liveShipments : DEMO_SHIPMENTS;

  const filtered = allShipments.filter((s) => {
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    const term = search.toLowerCase();
    const matchSearch =
      (s.id || s.trackingNumber || "").toLowerCase().includes(term) ||
      (s.to || s.destinationAddress || "").toLowerCase().includes(term) ||
      (s.from || s.pickupAddress || "").toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  const counts = {
    All:              allShipments.length,
    Pending:          allShipments.filter(s => s.status === "Pending").length,
    "In Transit":     allShipments.filter(s => s.status === "In Transit").length,
    "Out For Delivery": allShipments.filter(s => s.status === "Out For Delivery").length,
    Delivered:        allShipments.filter(s => s.status === "Delivered").length,
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            My <span className="gradient-text">Shipments</span>
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            Track, manage and view all your shipments in one place.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            className={`btn btn-sm ${view === "table" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setView("table")}
            title="Table view"
          >☰ Table</button>
          <button
            className={`btn btn-sm ${view === "cards" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setView("cards")}
            title="Card view"
          >⊞ Cards</button>
          <Link to="/shipments/create" className="btn btn-primary" id="my-shipments-create-btn">
            + New Shipment
          </Link>
        </div>
      </div>

      {/* Status filter pills */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        {Object.entries(counts).map(([status, count]) => (
          <button
            key={status}
            className={`tab-pill${statusFilter === status ? " active" : ""}`}
            onClick={() => setStatusFilter(status)}
            id={`filter-${status.replace(/\s+/g, "-").toLowerCase()}`}
          >
            {status} <span style={{ opacity: 0.7, fontSize: "0.8em" }}>({count})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
          <h2 className="card-title">
            {filtered.length} shipment{filtered.length !== 1 ? "s" : ""}
            {statusFilter !== "All" ? ` · ${statusFilter}` : ""}
          </h2>
          <input
            id="shipments-search"
            className="form-control search-sm"
            placeholder="Search by ID, pickup or destination…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 320, marginLeft: "auto" }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--clr-text-faint)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
            <p>Loading shipments…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
            <h3 style={{ marginBottom: "0.5rem" }}>No shipments found</h3>
            <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
              {search ? `No results for "${search}"` : `No ${statusFilter !== "All" ? statusFilter : ""} shipments yet.`}
            </p>
            <Link to="/shipments/create" className="btn btn-primary">
              + Book Your First Shipment
            </Link>
          </div>
        ) : view === "table" ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Pickup</th>
                  <th>Destination</th>
                  <th>Package</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>ETA</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id || s.trackingNumber}>
                    <td><code className="trk-code">{s.id || s.trackingNumber}</code></td>
                    <td className="text-muted">{s.from || s.pickupAddress}</td>
                    <td className="text-muted">{s.to || s.destinationAddress}</td>
                    <td className="text-xs text-muted">{s.packageType} · {s.weight}</td>
                    <td className="text-sm">{s.driver || s.driverName || "—"}</td>
                    <td>
                      <span className={`badge ${s.statusColor || STATUS_COLOR[s.status] || "badge-muted"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="text-sm">{s.eta}</td>
                    <td className="text-xs text-faint">{s.date}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => navigate(`/track/${s.id || s.trackingNumber}`)}
                      >
                        Track →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Card view */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem", padding: "0 0 0.5rem" }}>
            {filtered.map((s) => (
              <div
                key={s.id || s.trackingNumber}
                className="shipment-row"
                style={{ cursor: "pointer", padding: "1rem", borderRadius: "var(--r-lg)", border: "1px solid var(--clr-border)" }}
                onClick={() => navigate(`/track/${s.id || s.trackingNumber}`)}
              >
                <div className="shipment-row-top" style={{ marginBottom: "0.5rem" }}>
                  <code className="trk-code" style={{ fontSize: "0.78rem" }}>{s.id || s.trackingNumber}</code>
                  <span className={`badge ${s.statusColor || STATUS_COLOR[s.status] || "badge-muted"}`}>{s.status}</span>
                </div>
                <div className="shipment-route" style={{ marginBottom: "0.75rem" }}>
                  {s.from || s.pickupAddress} <span className="route-arrow">→</span> {s.to || s.destinationAddress}
                </div>
                <ProgressBar
                  value={s.progress || 0}
                  color={s.status === "Delivered" ? "var(--clr-success)" : s.status === "Out For Delivery" ? "var(--clr-warning)" : "var(--clr-primary)"}
                />
                <div className="shipment-meta-row" style={{ marginTop: "0.5rem" }}>
                  <span className="text-xs text-faint">{s.packageType} · {s.weight}</span>
                  <span className="text-xs text-muted">ETA: {s.eta}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
