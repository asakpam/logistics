import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext.jsx";

const STATUS_OPTIONS = ["All","Pending","Assigned","Dispatched","In Transit","Out For Delivery","Delivered","Cancelled"];
const STATUS_COLOR = {
  "Pending":"badge-muted","Assigned":"badge-primary","Dispatched":"badge-primary",
  "In Transit":"badge-primary","Out For Delivery":"badge-warning",
  "Delivered":"badge-success","Cancelled":"badge-danger",
};

const DEMO_SHIPMENTS = [
  { _id:"s1", trackingNumber:"TRK260808A1B2", customerName:"Kofi Mensah",   driverName:"Emmanuel Adu",   pickupAddress:"Accra Central",    destinationAddress:"Kumasi",           status:"In Transit",       eta:"Aug 9, 2026",  date:"Aug 8, 2026",  weight:"2.4 kg",  packageType:"Electronics" },
  { _id:"s2", trackingNumber:"TRK260805X3Y4", customerName:"Ama Owusu",     driverName:"Samuel Adjei",   pickupAddress:"Takoradi, W/R",     destinationAddress:"Accra",            status:"Out For Delivery", eta:"Today 5 PM",   date:"Aug 5, 2026",  weight:"0.3 kg",  packageType:"Documents"   },
  { _id:"s3", trackingNumber:"TRK260801Z5W6", customerName:"Yaw Darko",     driverName:"Victor Boateng", pickupAddress:"Kumasi, Ashanti",   destinationAddress:"Tamale, N/R",      status:"Delivered",        eta:"Aug 3, 2026",  date:"Aug 1, 2026",  weight:"5.1 kg",  packageType:"Clothing"    },
  { _id:"s4", trackingNumber:"TRK260808Q7R8", customerName:"Abena Asante",  driverName:"—",              pickupAddress:"Accra",             destinationAddress:"Cape Coast, C/R",  status:"Pending",          eta:"Awaiting",     date:"Aug 8, 2026",  weight:"1.2 kg",  packageType:"Food"        },
  { _id:"s5", trackingNumber:"TRK260802K9L0", customerName:"Kwame Boateng", driverName:"Emmanuel Adu",   pickupAddress:"Tema, G/A",         destinationAddress:"Sunyani, Bono",    status:"Delivered",        eta:"Aug 4, 2026",  date:"Aug 2, 2026",  weight:"3.7 kg",  packageType:"Machinery"   },
  { _id:"s6", trackingNumber:"TRK260804M3N4", customerName:"Efua Mensah",   driverName:"Victor Boateng", pickupAddress:"Kumasi Central",    destinationAddress:"Sunyani, Bono",    status:"Dispatched",       eta:"Aug 25, 2026", date:"Aug 4, 2026",  weight:"3.1 kg",  packageType:"Clothing"    },
];

export function ManageShipments() {
  const { shipments: liveShipments, updateStatus } = useData();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch]             = useState("");
  const [updating, setUpdating]         = useState({});

  const allShipments = liveShipments.length > 0 ? liveShipments : DEMO_SHIPMENTS;

  const filtered = allShipments.filter(s => {
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    const term = search.toLowerCase();
    const matchSearch =
      (s.trackingNumber || s.id || "").toLowerCase().includes(term) ||
      (s.customerName || "").toLowerCase().includes(term) ||
      (s.driverName || "").toLowerCase().includes(term) ||
      (s.destinationAddress || s.to || "").toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  async function handleStatusChange(shipmentId, newStatus) {
    setUpdating(prev => ({ ...prev, [shipmentId]: true }));
    try {
      await updateStatus(shipmentId, newStatus);
    } finally {
      setUpdating(prev => ({ ...prev, [shipmentId]: false }));
    }
  }

  const counts = STATUS_OPTIONS.slice(1).reduce((acc, s) => ({
    ...acc, [s]: allShipments.filter(sh => sh.status === s).length
  }), {});

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Shipment <span className="gradient-text">Management</span>
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            View, update, and manage all platform shipments.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/dashboard/admin" className="btn btn-ghost btn-sm">← Admin</Link>
          <button className="btn btn-outline btn-sm" onClick={() => alert("Export CSV — connect to backend")}>
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: "Total",       value: allShipments.length,                                                   icon: "📦", color: "var(--clr-primary)" },
          { label: "Active",      value: allShipments.filter(s => !["Delivered","Cancelled","Pending"].includes(s.status)).length, icon: "🚚", color: "#6366f1" },
          { label: "Delivered",   value: allShipments.filter(s => s.status === "Delivered").length,             icon: "✅", color: "var(--clr-success)" },
          { label: "Pending",     value: allShipments.filter(s => s.status === "Pending").length,               icon: "⏳", color: "var(--clr-warning)" },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
        {STATUS_OPTIONS.map(s => (
          <button key={s} className={`tab-pill${statusFilter === s ? " active" : ""}`} onClick={() => setStatusFilter(s)}>
            {s} {s !== "All" && <span style={{ opacity: 0.7, fontSize: "0.8em" }}>({counts[s] || 0})</span>}
          </button>
        ))}
        <input
          id="shipments-search"
          className="form-control search-sm"
          placeholder="Search ID, customer, driver…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: "auto", maxWidth: 260 }}
        />
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{filtered.length} shipment{filtered.length !== 1 ? "s" : ""}</h2>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tracking ID</th>
                <th>Customer</th>
                <th>Driver</th>
                <th>Pickup</th>
                <th>Destination</th>
                <th>Package</th>
                <th>Status</th>
                <th>ETA</th>
                <th>Date</th>
                <th>Update Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: "center", padding: "2rem", color: "var(--clr-text-faint)" }}>No shipments found.</td></tr>
              ) : filtered.map(s => (
                <tr key={s._id || s.id || s.trackingNumber}>
                  <td><code className="trk-code" style={{ fontSize: "0.72rem" }}>{s.trackingNumber || s.id}</code></td>
                  <td className="text-sm">{s.customerName}</td>
                  <td className="text-sm text-muted">{s.driverName || s.driver || "—"}</td>
                  <td className="text-xs text-muted">{s.pickupAddress || s.from}</td>
                  <td className="text-xs text-muted">{s.destinationAddress || s.to}</td>
                  <td className="text-xs text-muted">{s.packageType} · {s.weight}</td>
                  <td><span className={`badge ${STATUS_COLOR[s.status] || "badge-muted"}`}>{s.status}</span></td>
                  <td className="text-xs">{s.eta}</td>
                  <td className="text-xs text-faint">{s.date}</td>
                  <td>
                    <select
                      className="form-control"
                      style={{ fontSize: "0.78rem", padding: "0.3rem 0.5rem", minWidth: 130 }}
                      value={s.status}
                      onChange={e => handleStatusChange(s._id || s.id, e.target.value)}
                      disabled={updating[s._id || s.id]}
                    >
                      {STATUS_OPTIONS.slice(1).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/track/${s.trackingNumber || s.id}`)}>Track</button>
                      <Link to="/admin/assign" className="btn btn-sm btn-outline" style={{ fontSize: "0.75rem" }}>Assign</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
