import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";

/* ─── Demo data ───────────────────────────────────────────── */
const DEMO_SHIPMENTS = [
  {
    id: "TRK260808A1B2",
    from: "Accra Central",
    to: "Kumasi, Ashanti",
    status: "In Transit",
    statusColor: "badge-primary",
    eta: "Aug 9, 2026",
    date: "Aug 8, 2026",
    weight: "2.4 kg",
    packageType: "Electronics",
    driver: "Emmanuel Adu",
    progress: 65,
  },
  {
    id: "TRK260805X3Y4",
    from: "Takoradi, W/R",
    to: "Accra, Greater Accra",
    status: "Out For Delivery",
    statusColor: "badge-warning",
    eta: "Today by 5 PM",
    date: "Aug 5, 2026",
    weight: "0.3 kg",
    packageType: "Documents",
    driver: "Samuel Adjei",
    progress: 88,
  },
  {
    id: "TRK260801Z5W6",
    from: "Kumasi, Ashanti",
    to: "Tamale, N/R",
    status: "Delivered",
    statusColor: "badge-success",
    eta: "Delivered Aug 3",
    date: "Aug 1, 2026",
    weight: "5.1 kg",
    packageType: "Clothing",
    driver: "Victor Boateng",
    progress: 100,
  },
  {
    id: "TRK260808Q7R8",
    from: "Accra",
    to: "Cape Coast, C/R",
    status: "Pending",
    statusColor: "badge-muted",
    eta: "Awaiting assignment",
    date: "Aug 8, 2026",
    weight: "1.2 kg",
    packageType: "Food & Perishables",
    driver: "—",
    progress: 8,
  },
  {
    id: "TRK260802K9L0",
    from: "Tema, Greater Accra",
    to: "Sunyani, Bono",
    status: "Delivered",
    statusColor: "badge-success",
    eta: "Delivered Aug 4",
    date: "Aug 2, 2026",
    weight: "3.7 kg",
    packageType: "Machinery",
    driver: "Emmanuel Adu",
    progress: 100,
  },
];

const NOTIFICATIONS = [
  { icon: "📦", type: "booked",    text: "Shipment TRK260808Q7R8 has been booked successfully.", time: "4h ago",  read: false },
  { icon: "🚚", type: "transit",   text: "TRK260808A1B2 is now In Transit — heading to Kumasi.", time: "6h ago",  read: false },
  { icon: "📍", type: "pickup",    text: "TRK260805X3Y4 was picked up by driver Samuel Adjei.",  time: "1d ago",  read: true  },
  { icon: "👤", type: "assigned",  text: "Driver Emmanuel Adu has been assigned to TRK260808A1B2.", time: "1d ago", read: true },
  { icon: "✅", type: "delivered", text: "TRK260801Z5W6 has been delivered successfully.",        time: "5d ago",  read: true  },
  { icon: "⚠️", type: "delayed",   text: "TRK260802K9L0 experienced a minor delay in Kumasi.",  time: "6d ago",  read: true  },
];

const ACTIVITY = [
  { icon: "📦", text: "New shipment booked",          sub: "TRK260808Q7R8 · Cape Coast",   time: "4h ago"  },
  { icon: "🚚", text: "Shipment In Transit",           sub: "TRK260808A1B2 · Kumasi",       time: "6h ago"  },
  { icon: "✅", text: "Delivery confirmed",            sub: "TRK260801Z5W6 · Tamale",       time: "5d ago"  },
  { icon: "📍", text: "Driver out for delivery",      sub: "TRK260805X3Y4 · Accra",        time: "1d ago"  },
];

const TABS = ["Overview", "My Shipments", "Notifications", "Profile"];

function ProgressBar({ value, color = "var(--clr-primary)" }) {
  return (
    <div style={{ background: "var(--clr-surface-2)", borderRadius: "var(--r-full)", height: 6, overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: "var(--r-full)", transition: "width 0.6s ease" }} />
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────── */
export function CustomerDashboard() {
  const { user, logout } = useAuth();
  const { shipments: liveShipments, loading: dataLoading } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Use live shipments if available, otherwise empty array (no fake demo data for real users)
  const allShipments = liveShipments;

  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

  const filteredShipments = allShipments.filter((s) => {
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    const matchSearch =
      (s.id || s.trackingNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.to || s.destinationAddress || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.from || s.pickupAddress || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = [
    { label: "Active Shipments",  value: allShipments.filter(s => !["Delivered","Cancelled"].includes(s.status)).length, icon: "🚚", color: "var(--clr-primary)" },
    { label: "Delivered",         value: allShipments.filter(s => s.status === "Delivered").length,                       icon: "✅", color: "var(--clr-success)" },
    { label: "Pending",           value: allShipments.filter(s => s.status === "Pending").length,                         icon: "⏳", color: "var(--clr-warning)" },
    { label: "Total Shipments",   value: allShipments.length,                                                              icon: "📦", color: "#6366f1" },
  ];

  return (
    <div className="dashboard-page">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Welcome back, <span className="gradient-text">{user?.name?.split(" ")[0] ?? "Customer"}</span> 👋
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            Here's an overview of your shipments and account activity.
          </p>
        </div>
        <Link to="/shipments/create" className="btn btn-primary" id="create-shipment-cta">
          + New Shipment
        </Link>
      </div>

      {/* ── Stats Row ───────────────────────────────────────── */}
      <div className="stats-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab Navigation ──────────────────────────────────── */}
      <div className="dash-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`dash-tab${activeTab === tab ? " active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "Notifications" && unreadCount > 0
              ? <>{tab} <span className="tab-badge">{unreadCount}</span></>
              : tab}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════════════════ */}
      {activeTab === "Overview" && (
        <div className="dash-grid-3">

          {/* Recent Shipments */}
          <div className="card" style={{ gridColumn: "span 2" }}>
            <div className="card-header">
              <h2 className="card-title">Recent Shipments</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab("My Shipments")}>View all →</button>
            </div>
            <div className="shipment-list">
              {DEMO_SHIPMENTS.slice(0, 3).map((s) => (
                <div
                  key={s.id}
                  className="shipment-row"
                  onClick={() => navigate(`/track/${s.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="shipment-row-icon">📦</div>
                  <div className="shipment-row-body">
                    <div className="shipment-row-top">
                      <span className="shipment-trk">{s.id}</span>
                      <span className={`badge ${s.statusColor}`}>{s.status}</span>
                    </div>
                    <div className="shipment-route">
                      {s.from} <span className="route-arrow">→</span> {s.to}
                    </div>
                    <ProgressBar
                      value={s.progress}
                      color={s.status === "Delivered" ? "var(--clr-success)" : s.status === "Out For Delivery" ? "var(--clr-warning)" : s.status === "Pending" ? "var(--clr-text-faint)" : "var(--clr-primary)"}
                    />
                    <div className="shipment-meta-row">
                      <span className="text-xs text-faint">{s.date}</span>
                      <span className="text-xs text-muted">ETA: {s.eta}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-lg)" }}>

            {/* Book Shipment CTA */}
            <div className="book-cta-card">
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📬</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "0.4rem" }}>
                Send a Package
              </h3>
              <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>
                Book a new shipment in minutes. Get real-time tracking and ML-predicted ETA.
              </p>
              <Link to="/shipments/create" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                + Book Shipment
              </Link>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Recent Activity</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {ACTIVITY.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{a.icon}</span>
                    <div>
                      <p style={{ fontSize: "0.83rem", fontWeight: 500, color: "var(--clr-text)" }}>{a.text}</p>
                      <p className="text-xs text-faint">{a.sub} · {a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: MY SHIPMENTS
      ══════════════════════════════════════════════════════ */}
      {activeTab === "My Shipments" && (
        <div className="card">
          <div className="card-header" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
            <h2 className="card-title">My Shipments</h2>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginLeft: "auto" }}>
              <input
                className="form-control search-sm"
                placeholder="Search shipment ID or city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="form-control search-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
                <option value="Out For Delivery">Out For Delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shipment ID</th>
                  <th>Pickup</th>
                  <th>Destination</th>
                  <th>Package</th>
                  <th>Status</th>
                  <th>ETA</th>
                  <th>Date</th>
                  <th>Track</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--clr-text-faint)" }}>
                      No shipments found.
                    </td>
                  </tr>
                ) : filteredShipments.map((s) => (
                  <tr key={s.id}>
                    <td><code className="trk-code">{s.id}</code></td>
                    <td className="text-muted">{s.from}</td>
                    <td className="text-muted">{s.to}</td>
                    <td className="text-xs text-muted">{s.packageType} · {s.weight}</td>
                    <td><span className={`badge ${s.statusColor}`}>{s.status}</span></td>
                    <td className="text-sm">{s.eta}</td>
                    <td className="text-xs text-faint">{s.date}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => navigate(`/track/${s.id}`)}
                      >
                        Track →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: "right", marginTop: "0.5rem" }}>
            <Link to="/shipments/create" className="btn btn-primary btn-sm">
              + New Shipment
            </Link>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: NOTIFICATIONS
      ══════════════════════════════════════════════════════ */}
      {activeTab === "Notifications" && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Notifications</h2>
            {unreadCount > 0 && (
              <span className="badge badge-primary">{unreadCount} new</span>
            )}
          </div>
          <div className="notif-list">
            {NOTIFICATIONS.map((n, i) => (
              <div key={i} className={`notif-item${n.read ? " read" : ""}`}>
                <span className="notif-icon">{n.icon}</span>
                <div style={{ flex: 1 }}>
                  <p className="notif-text">{n.text}</p>
                  <span className="text-xs text-faint">{n.time}</span>
                </div>
                {!n.read && <span className="notif-dot" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: PROFILE
      ══════════════════════════════════════════════════════ */}
      {activeTab === "Profile" && (
        <div className="dash-grid-2">
          {/* Profile Info */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Account Profile</h2>
              <button className="btn btn-ghost btn-sm">Edit</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
              <div className="profile-avatar">
                {(user?.name ?? "C")[0].toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>{user?.name ?? "Demo Customer"}</p>
                <span className="badge badge-primary" style={{ textTransform: "capitalize" }}>{user?.role ?? "customer"}</span>
              </div>
            </div>
            <div>
              <div className="detail-row">
                <span className="detail-label">Full Name</span>
                <span className="detail-val">{user?.name ?? "Demo Customer"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email</span>
                <span className="detail-val">{user?.email ?? "customer@demo.com"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone</span>
                <span className="detail-val">{user?.phone ?? "+233 20 000 0001"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Account Type</span>
                <span className="detail-val" style={{ textTransform: "capitalize" }}>{user?.role ?? "Customer"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Member Since</span>
                <span className="detail-val">Jan 2026</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Account Status</span>
                <span className="badge badge-success">Active</span>
              </div>
            </div>
          </div>

          {/* Shipment Summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-lg)" }}>
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Shipment Summary</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { label: "Total Shipments",  value: DEMO_SHIPMENTS.length,                                              color: "#6366f1" },
                  { label: "Active",           value: DEMO_SHIPMENTS.filter(s => !["Delivered"].includes(s.status)).length, color: "var(--clr-primary)" },
                  { label: "Delivered",        value: DEMO_SHIPMENTS.filter(s => s.status === "Delivered").length,         color: "var(--clr-success)" },
                  { label: "Pending",          value: DEMO_SHIPMENTS.filter(s => s.status === "Pending").length,           color: "var(--clr-warning)" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--clr-border)" }}>
                    <span className="text-muted text-sm">{item.label}</span>
                    <span style={{ fontWeight: 700, color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Security</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <button className="btn btn-ghost" style={{ justifyContent: "flex-start", textAlign: "left" }}>🔒 Change Password</button>
                <button className="btn btn-ghost" style={{ justifyContent: "flex-start", textAlign: "left" }}>📧 Update Email</button>
                <button
                  className="btn btn-danger"
                  style={{ justifyContent: "flex-start", textAlign: "left", marginTop: "0.5rem" }}
                  onClick={async () => { await logout(); }}
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
