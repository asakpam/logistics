import { useState, useEffect } from "react";
import { useData } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

/* ─── Demo Data ──────────────────────────────────────────── */
const DEMO_SHIPMENTS = [
  { id: "TRK260808A1B2", customer: "Kofi Mensah",   driver: "Emmanuel Adu",   from: "Accra",     to: "Kumasi",       status: "In Transit",       date: "Aug 8, 2026",  eta: "Aug 9",   weight: "2.4 kg", type: "Electronics" },
  { id: "TRK260805X3Y4", customer: "Ama Owusu",     driver: "—",              from: "Takoradi",  to: "Accra",        status: "Pending",          date: "Aug 5, 2026",  eta: "TBD",     weight: "0.3 kg", type: "Documents"   },
  { id: "TRK260801Z5W6", customer: "Kwame Asante",  driver: "Victor Boateng", from: "Kumasi",    to: "Tamale",       status: "Delivered",        date: "Aug 1, 2026",  eta: "Done",    weight: "5.1 kg", type: "Clothing"    },
  { id: "TRK260808Q7R8", customer: "Akua Frimpong", driver: "—",              from: "Accra",     to: "Cape Coast",   status: "Pending",          date: "Aug 8, 2026",  eta: "TBD",     weight: "1.2 kg", type: "Food"        },
  { id: "TRK260807M9N0", customer: "Yaw Darko",     driver: "Samuel Adjei",   from: "Accra",     to: "Tema",         status: "Out For Delivery", date: "Aug 7, 2026",  eta: "Today",   weight: "0.8 kg", type: "Documents"   },
  { id: "TRK260802K9L0", customer: "Abena Boadu",   driver: "Emmanuel Adu",   from: "Tema",      to: "Sunyani",      status: "Delivered",        date: "Aug 2, 2026",  eta: "Done",    weight: "3.7 kg", type: "Machinery"   },
  { id: "TRK260806R1S2", customer: "Kwesi Nkrumah", driver: "Grace Appiah",   from: "Accra",     to: "Ho, Volta",    status: "In Transit",       date: "Aug 6, 2026",  eta: "Aug 9",   weight: "1.9 kg", type: "Fragile"     },
];

const DEMO_CUSTOMERS = [
  { id: "USR001", name: "Kofi Mensah",   email: "kofi@example.com",  phone: "+233 20 123 4567", joined: "Jan 15, 2026", shipments: 5,  status: "Active"   },
  { id: "USR002", name: "Ama Owusu",     email: "ama@example.com",   phone: "+233 24 987 6543", joined: "Feb 3, 2026",  shipments: 2,  status: "Active"   },
  { id: "USR003", name: "Kwame Asante",  email: "kwame@example.com", phone: "+233 27 444 5555", joined: "Mar 20, 2026", shipments: 8,  status: "Active"   },
  { id: "USR004", name: "Akua Frimpong", email: "akua@example.com",  phone: "+233 55 222 3333", joined: "Apr 5, 2026",  shipments: 1,  status: "Active"   },
  { id: "USR005", name: "Yaw Darko",     email: "yaw@example.com",   phone: "+233 20 777 8888", joined: "May 12, 2026", shipments: 4,  status: "Inactive" },
  { id: "USR006", name: "Abena Boadu",   email: "abena@example.com", phone: "+233 24 999 0000", joined: "Jun 8, 2026",  shipments: 3,  status: "Active"   },
];

const DEMO_DRIVERS = [
  { id: "DRV001", name: "Emmanuel Adu",   phone: "+233 24 111 2222", vehicle: "GR-4521-21", vehicleType: "Van",    available: false, active: true,  deliveries: 3, rating: 4.9, joined: "Jan 10, 2026" },
  { id: "DRV002", name: "Victor Boateng", phone: "+233 20 333 4444", vehicle: "AK-8834-20", vehicleType: "Truck",  available: true,  active: true,  deliveries: 5, rating: 4.7, joined: "Feb 22, 2026" },
  { id: "DRV003", name: "Samuel Adjei",   phone: "+233 27 555 6666", vehicle: "GE-2210-19", vehicleType: "Bike",   available: false, active: true,  deliveries: 2, rating: 4.5, joined: "Mar 5, 2026"  },
  { id: "DRV004", name: "Grace Appiah",   phone: "+233 55 777 8888", vehicle: "BA-9901-22", vehicleType: "Van",    available: false, active: true,  deliveries: 1, rating: 4.8, joined: "Apr 14, 2026" },
  { id: "DRV005", name: "Kofi Boateng",   phone: "+233 20 444 5555", vehicle: "ER-1122-23", vehicleType: "Truck",  available: true,  active: false, deliveries: 0, rating: 0,   joined: "Aug 1, 2026"  },
];

const ACTIVITY_LOG = [
  { icon: "📦", text: "New shipment TRK260808Q7R8 created by Akua Frimpong",       time: "4h ago"  },
  { icon: "🚚", text: "Driver Emmanuel Adu assigned to TRK260808A1B2",             time: "6h ago"  },
  { icon: "✅", text: "TRK260801Z5W6 marked as Delivered",                         time: "5d ago"  },
  { icon: "👤", text: "New customer Abena Boadu registered",                       time: "6d ago"  },
  { icon: "🛡️", text: "Driver Grace Appiah activated by admin",                   time: "1w ago"  },
  { icon: "📍", text: "TRK260807M9N0 status updated to Out For Delivery",          time: "1d ago"  },
];

const STATUS_COLORS = {
  "Pending":          "badge-muted",
  "Assigned":         "badge-primary",
  "Dispatched":       "badge-primary",
  "In Transit":       "badge-primary",
  "Out For Delivery": "badge-warning",
  "Delivered":        "badge-success",
  "Cancelled":        "badge-danger",
};

const ADMIN_TABS = ["Overview", "Shipments", "Users", "Drivers", "Reports"];

/* ─── Helpers ────────────────────────────────────────────── */
function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

/* ─── Main Component ─────────────────────────────────────── */
export function AdminDashboard() {
  const { 
    shipments: liveShipments, 
    customers: liveCustomers,
    adminUsers: liveAdminUsers,
    allUsers: liveAllUsers,
    drivers: liveDrivers, 
    pendingDrivers: livePendingDrivers,
    approveDriver,
    rejectDriver,
    updateStatus, 
    assignDriver,
    updateUser,
    deleteUser,
    updateUserStatus,
    loading: dataLoading 
  } = useData();

  const [activeTab, setActiveTab]           = useState("Overview");
  const [shipmentSearch, setShipmentSearch] = useState("");
  const [shipmentStatus, setShipmentStatus] = useState("All");
  const [userSearch,     setUserSearch]     = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  const [driverSearch,   setDriverSearch]   = useState("");
  const [showAddDriver,  setShowAddDriver]  = useState(false);
  const [assignModal,    setAssignModal]    = useState(null); // shipment id
  const [reviewDriverModal, setReviewDriverModal] = useState(null); // driver object
  const [viewShipmentModal, setViewShipmentModal] = useState(null); // booking object
  const [viewUserModal,     setViewUserModal]     = useState(null); // user object
  const [editUserModal,     setEditUserModal]     = useState(null); // user object
  const [deleteUserModal,   setDeleteUserModal]   = useState(null); // user object
  const [editForm, setEditForm] = useState({ name: "", phone: "", street: "", city: "", region: "", status: "active", newPassword: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [ghanaCardUrl, setGhanaCardUrl] = useState(null); // signed URL for Ghana Card image
  const [ghanaCardLoading, setGhanaCardLoading] = useState(false);
  const [ghanaCardError, setGhanaCardError] = useState(null);

  // Fetch signed Ghana Card URL whenever review modal opens for a driver with a card
  useEffect(() => {
    if (!reviewDriverModal) {
      setGhanaCardUrl(null);
      setGhanaCardError(null);
      return;
    }
    if (!reviewDriverModal.ghanaCardImage) {
      setGhanaCardUrl(null);
      setGhanaCardError(null);
      return;
    }
    // Fetch the signed URL from backend using the driver's _id
    const driverId = reviewDriverModal._id;
    setGhanaCardLoading(true);
    setGhanaCardUrl(null);
    setGhanaCardError(null);
    api.get(`/drivers/${driverId}/ghana-card-url`)
      .then(res => {
        setGhanaCardUrl(res.data.signedUrl);
      })
      .catch(err => {
        console.error("Failed to load Ghana Card URL:", err);
        setGhanaCardError("Could not load Ghana Card image.");
      })
      .finally(() => setGhanaCardLoading(false));
  }, [reviewDriverModal]);

  const { user: currentUser } = useAuth();

  const handleSaveUser = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editUserModal) return;
    setActionLoading(true);
    setActionError("");
    try {
      const payload = {
        name: editForm.name,
        phone: editForm.phone,
        address: {
          street: editForm.street,
          city: editForm.city,
          region: editForm.region
        },
        status: editForm.status
      };
      if (editForm.newPassword && editForm.newPassword.trim()) {
        if (editForm.newPassword.trim().length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        payload.password = editForm.newPassword.trim();
      }
      await updateUser(editUserModal._id || editUserModal.id, payload);
      setEditUserModal(null);
    } catch (err) {
      console.error("Save user error:", err);
      setActionError(err.response?.data?.message || err.message || "Failed to update user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserModal) return;
    const targetId = deleteUserModal._id || deleteUserModal.id;
    if (currentUser && (targetId === currentUser.id || targetId === currentUser._id)) {
      setActionError("You cannot delete your own active administrator account.");
      return;
    }
    setActionLoading(true);
    setActionError("");
    try {
      await deleteUser(targetId);
      setDeleteUserModal(null);
    } catch (err) {
      console.error("Delete user error:", err);
      setActionError(err.response?.data?.message || err.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleDriver = async (driverId) => {
    const driver = drivers.find(d => (d.id === driverId || d._id === driverId));
    if (!driver) return;
    const targetUserId = driver.userId || driver._id || driver.id;
    const isCurrentlyActive = driver.active !== false && (driver.status === "approved" || driver.status === "active");
    const nextStatus = isCurrentlyActive ? "suspended" : "approved";
    try {
      if (updateUserStatus) {
        await updateUserStatus(targetUserId, nextStatus);
      }
    } catch (err) {
      console.error("Failed to toggle driver status:", err);
    }
  };

  // Merge live data with demo fallbacks
  const allShipments = (liveShipments && liveShipments.length > 0) ? liveShipments : DEMO_SHIPMENTS;
  const allCustomers = (liveCustomers && liveCustomers.length > 0) ? liveCustomers : DEMO_CUSTOMERS;
  const drivers = (liveDrivers && liveDrivers.length > 0) ? liveDrivers : DEMO_DRIVERS;
  const pendingDrivers = livePendingDrivers || [];

  // Non-driver users (Customers + Admins)
  const nonDriverUsers = (liveAllUsers && liveAllUsers.length > 0)
    ? liveAllUsers.filter(u => u && u.role !== "driver")
    : [...allCustomers, ...(liveAdminUsers || [])];

  /* derived counts */
  const total      = allShipments.length;
  const pending    = allShipments.filter(s => s.status === "Pending").length;
  const inTransit  = allShipments.filter(s => ["In Transit","Out For Delivery","Dispatched","Assigned"].includes(s.status)).length;
  const delivered  = allShipments.filter(s => s.status === "Delivered").length;

  /* shipment filters */
  const filteredShipments = allShipments.filter(s => {
    const matchStatus = shipmentStatus === "All" || s.status === shipmentStatus;
    const term = shipmentSearch.toLowerCase();
    const matchSearch = (s.id || s.trackingNumber || "").toLowerCase().includes(term) ||
      (s.customer || s.customerName || "").toLowerCase().includes(term) ||
      (s.customerPhone || s.receiverPhone || "").toLowerCase().includes(term) ||
      (s.from || s.pickupAddress || "").toLowerCase().includes(term) ||
      (s.to || s.destinationAddress || "").toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  /* user filters (Customers + Admins, excluding drivers) */
  const filteredUsers = nonDriverUsers.filter(u => {
    const matchRole = userRoleFilter === "All" || (u.role || "customer").toLowerCase() === userRoleFilter.toLowerCase();
    const term = userSearch.toLowerCase();
    const matchSearch = (u.name || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term) ||
      (u.phone || "").toLowerCase().includes(term);
    return matchRole && matchSearch;
  });

  /* driver filters */
  const filteredDrivers = drivers.filter(d =>
    (d.name || "").toLowerCase().includes(driverSearch.toLowerCase()) ||
    (d.vehicle || d.plate || "").toLowerCase().includes(driverSearch.toLowerCase())
  );

  return (
    <div className="dashboard-page">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Admin <span className="gradient-text">Dashboard</span> 🛡️
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            Full platform management — shipments, customers, drivers, and analytics.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {pendingDrivers.length > 0 && (
            <span className="badge badge-warning" style={{ padding: "0.5rem 1rem", alignSelf: "center", fontSize: "0.85rem" }}>
              🚚 {pendingDrivers.length} Pending Driver{pendingDrivers.length > 1 ? "s" : ""}
            </span>
          )}
          <button className="btn btn-primary" onClick={() => setActiveTab("Shipments")}>
            Manage Shipments
          </button>
        </div>
      </div>

      {/* ── 7-KPI Stats ────────────────────────────────────── */}
      <div className="stats-grid stats-grid-wide">
        <StatCard label="Total Shipments"   value={total}                  icon="📦" color="var(--clr-primary)" />
        <StatCard label="Pending"           value={pending}                icon="⏳" color="var(--clr-warning)" />
        <StatCard label="In Transit"        value={inTransit}              icon="🚚" color="#6366f1"            />
        <StatCard label="Delivered"         value={delivered}              icon="✅" color="var(--clr-success)" />
        <StatCard label="Customers"         value={allCustomers.length}    icon="👥" color="#ec4899"            />
        <StatCard label="Drivers"           value={drivers.length}         icon="🚗" color="#f59e0b"            />
        <StatCard label="Pending Drivers"   value={pendingDrivers.length}  icon="⏳" color="var(--clr-warning)" />
      </div>

      {/* ── Tab Navigation ─────────────────────────────────── */}
      <div className="dash-tabs">
        {ADMIN_TABS.map((tab) => (
          <button
            key={tab}
            className={`dash-tab${activeTab === tab ? " active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab} {tab === "Drivers" && pendingDrivers.length > 0 && <span className="tab-badge" style={{ background: "var(--clr-warning)", color: "#fff" }}>{pendingDrivers.length}</span>}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════
          TAB: OVERVIEW
      ════════════════════════════════════════════════════ */}
      {activeTab === "Overview" && (
        <>
          <div className="dash-grid-3">

          {/* ── PENDING DRIVER APPROVALS SECTION ──────────────── */}
          <div className="card" style={{ gridColumn: "span 3" }}>
            <div className="card-header" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <h2 className="card-title">Pending Driver Approvals</h2>
                <span className="badge badge-warning" style={{ fontSize: "0.82rem" }}>
                  Pending Driver Approvals: {pendingDrivers.length}
                </span>
              </div>
              <span className="text-xs text-muted">Awaiting administrator verification</span>
            </div>

            {pendingDrivers.length === 0 ? (
              <div style={{ padding: "1.5rem", textAlign: "center" }}>
                <p className="text-muted text-sm">🎉 No pending driver applications awaiting review.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Registered</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDrivers.map((d) => (
                      <tr key={d._id || d.id}>
                        <td style={{ fontWeight: 600 }}>{d.name}</td>
                        <td className="text-muted text-sm">{d.email}</td>
                        <td className="text-muted text-sm">{d.phone || "N/A"}</td>
                        <td className="text-xs text-faint">{d.joined || "Today"}</td>
                        <td><span className="badge badge-warning">Pending</span></td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => setReviewDriverModal(d)}
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Activity</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {ACTIVITY_LOG.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{a.icon}</span>
                  <div>
                    <p style={{ fontSize: "0.82rem", color: "var(--clr-text)", lineHeight: 1.45 }}>{a.text}</p>
                    <p className="text-xs text-faint">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Map Placeholder */}
          <div className="card" style={{ gridColumn: "span 2" }}>
            <div className="card-header">
              <h2 className="card-title">Live Shipment Monitor</h2>
              <span className="badge badge-success" style={{ fontSize: "0.75rem" }}>● Live</span>
            </div>
            <div className="map-placeholder" style={{ minHeight: 260 }}>
              <div className="map-placeholder-inner">
                <span style={{ fontSize: "3rem" }}>🗺️</span>
                <p style={{ fontWeight: 700, fontSize: "1rem" }}>Live GPS Map</p>
                <p className="text-sm text-muted">Connect Google Maps API to view all active driver locations in real-time.</p>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
                  {DEMO_SHIPMENTS.filter(s => ["In Transit","Out For Delivery"].includes(s.status)).map(s => (
                    <div key={s.id} style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: "var(--r-md)", padding: "0.5rem 0.75rem", fontSize: "0.78rem" }}>
                      <span style={{ color: "var(--clr-primary)", fontWeight: 700 }}>{s.id}</span>
                      <span className="text-muted"> · {s.driver} · </span>
                      <span>{s.from} → {s.to}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </div>
          {/* ML / ETA Panel — full-width below the main grid */}
          <div className="card" style={{ marginTop: "1rem" }}>
            <div className="card-header">
              <h2 className="card-title">🤖 ML / ETA Prediction System</h2>
              <span className="badge badge-primary">Model Active</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--sp-md)" }}>
              {[
                { label: "Model",              value: "Random Forest Regressor", sub: "v1.2.0",       icon: "🧠", color: "#6366f1" },
                { label: "Avg. ETA Error",     value: "±18 min",                 sub: "RMSE: 0.312",  icon: "📊", color: "var(--clr-primary)" },
                { label: "Predictions Today",  value: "47",                       sub: "All completed",icon: "⚡", color: "var(--clr-success)" },
                { label: "Model Accuracy",     value: "91.4%",                   sub: "Last 30 days", icon: "🎯", color: "var(--clr-warning)" },
              ].map((m) => (
                <div key={m.label} className="ml-metric-card">
                  <div className="ml-metric-icon" style={{ color: m.color, background: `${m.color}22` }}>{m.icon}</div>
                  <div>
                    <div className="ml-metric-value">{m.value}</div>
                    <div className="ml-metric-label">{m.label}</div>
                    <div className="text-xs text-faint">{m.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "rgba(14,165,233,0.06)", borderRadius: "var(--r-md)", border: "1px solid var(--clr-border-2)" }}>
              <p className="text-sm text-muted">
                <strong style={{ color: "var(--clr-text)" }}>How it works:</strong> Historical shipment data is used to train a regression model served as a Python API and called by the backend when a shipment is booked or updated.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════
          TAB: SHIPMENTS / BOOKINGS
      ════════════════════════════════════════════════════ */}
      {activeTab === "Shipments" && (
        <div className="card">
          <div className="card-header" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h2 className="card-title">Customer Bookings &amp; Shipments</h2>
              <p className="text-xs text-muted" style={{ marginTop: "0.2rem" }}>
                All customer delivery requests and bookings across the platform
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto", flexWrap: "wrap" }}>
              <SearchBar value={shipmentSearch} onChange={setShipmentSearch} placeholder="Search ID, customer, phone, city…" />
              <select className="form-control search-sm" value={shipmentStatus} onChange={(e) => setShipmentStatus(e.target.value)}>
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="In Transit">In Transit</option>
                <option value="Out For Delivery">Out For Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Customer Phone</th>
                  <th>Pickup</th>
                  <th>Destination</th>
                  <th>Package</th>
                  <th>Status</th>
                  <th>Assigned Driver</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: "2rem", color: "var(--clr-text-muted)" }}>
                      No bookings found matching your search.
                    </td>
                  </tr>
                ) : filteredShipments.map((s) => (
                  <tr key={s.id || s._id}>
                    <td>
                      <code className="trk-code" style={{ fontWeight: 700 }}>
                        {s.trackingNumber || s.id}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.customerName || s.customer}</div>
                      {s.customerEmail && <div className="text-xs text-muted">{s.customerEmail}</div>}
                    </td>
                    <td className="text-sm">
                      {s.customerPhone ? (
                        <a href={`tel:${s.customerPhone}`} style={{ color: "var(--clr-primary)", fontWeight: 500 }}>
                          📞 {s.customerPhone}
                        </a>
                      ) : (
                        <span className="text-muted text-xs">N/A</span>
                      )}
                    </td>
                    <td className="text-sm text-muted">{s.from || s.pickupAddress}</td>
                    <td className="text-sm text-muted">{s.to || s.destinationAddress}</td>
                    <td className="text-xs text-muted">
                      {s.type || s.packageType} · {s.weight || "—"}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[s.status] ?? "badge-muted"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="text-sm">
                      {s.driver && s.driver !== "—" ? (
                        <span style={{ fontWeight: 600 }}>{s.driver}</span>
                      ) : (
                        <span className="text-muted text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="text-xs text-faint">{s.date}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button
                          className="btn btn-sm btn-ghost"
                          id={`view-shipment-${s.id}`}
                          onClick={() => setViewShipmentModal(s)}
                        >
                          View Details
                        </button>
                        {(s.driver === "—" || !s.driverId || s.status === "Pending") && (
                          <button
                            className="btn btn-sm btn-primary"
                            id={`assign-btn-${s.id}`}
                            onClick={() => setAssignModal(s.id || s.trackingNumber)}
                          >
                            Assign
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-faint" style={{ marginTop: "0.5rem" }}>
            Showing {filteredShipments.length} of {allShipments.length} total bookings
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TAB: USERS (CUSTOMERS & ADMINS)
      ════════════════════════════════════════════════════ */}
      {(activeTab === "Users" || activeTab === "Customers") && (
        <div className="card">
          <div className="card-header" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h2 className="card-title">User Management</h2>
              <p className="text-xs text-muted" style={{ marginTop: "0.2rem" }}>
                Manage customer and administrator accounts, profile details, and access
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto", flexWrap: "wrap", alignItems: "center" }}>
              <div className="dash-tabs" style={{ marginBottom: 0 }}>
                {["All", "customer", "admin"].map(r => (
                  <button
                    key={r}
                    className={`dash-tab${userRoleFilter === r ? " active" : ""}`}
                    onClick={() => setUserRoleFilter(r)}
                    style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem" }}
                  >
                    {r === "All" ? "All Users" : r === "customer" ? "Customers" : "Admins"}
                    <span className="tab-badge" style={{ marginLeft: "0.35rem" }}>
                      {r === "All" ? nonDriverUsers.length : nonDriverUsers.filter(u => (u.role || "customer") === r).length}
                    </span>
                  </button>
                ))}
              </div>
              <SearchBar value={userSearch} onChange={setUserSearch} placeholder="Search by name, email, phone…" />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Shipments</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--clr-text-muted)" }}>
                      No users found matching your criteria.
                    </td>
                  </tr>
                ) : filteredUsers.map((u) => {
                  const roleStr = u.role || "customer";
                  const statusStr = (u.status || (u.isActive ? "active" : "inactive")).toLowerCase();
                  const badgeClass = statusStr === "active" ? "badge-success" : statusStr === "suspended" ? "badge-warning" : "badge-danger";

                  return (
                    <tr key={u._id || u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div
                            className="avatar-sm"
                            style={{
                              background: roleStr === "admin" ? "var(--grad-primary)" : "var(--clr-surface-2)",
                              color: roleStr === "admin" ? "#fff" : "var(--clr-text)",
                              fontWeight: 700
                            }}
                          >
                            {u.name ? u.name[0] : "U"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                            {roleStr === "admin" && (
                              <span className="badge badge-primary" style={{ fontSize: "0.68rem", padding: "0.15rem 0.4rem" }}>
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-muted text-sm">{u.email}</td>
                      <td className="text-sm">
                        {u.phone ? (
                          <a href={`tel:${u.phone}`} style={{ color: "var(--clr-primary)" }}>
                            {u.phone}
                          </a>
                        ) : (
                          <span className="text-muted text-xs">N/A</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${roleStr === "admin" ? "badge-primary" : "badge-muted"}`} style={{ textTransform: "capitalize" }}>
                          {roleStr}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`} style={{ textTransform: "capitalize" }}>
                          {statusStr}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {roleStr === "customer" ? (u.shipmentCount ?? u.shipments ?? 0) : "—"}
                      </td>
                      <td className="text-xs text-faint">{u.joined || fmtDate(u.createdAt) || "Recently"}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button
                            className="btn btn-sm btn-ghost"
                            id={`view-user-${u._id || u.id}`}
                            onClick={() => setViewUserModal(u)}
                          >
                            View
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            id={`edit-user-${u._id || u.id}`}
                            onClick={() => {
                              setEditUserModal(u);
                              setEditForm({
                                name: u.name || "",
                                phone: u.phone || "",
                                street: u.address?.street || u.addressStreet || "",
                                city: u.address?.city || u.addressCity || "",
                                region: u.address?.region || u.addressRegion || "",
                                status: u.status || "active",
                                newPassword: ""
                              });
                              setActionError("");
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            id={`delete-user-${u._id || u.id}`}
                            onClick={() => {
                              setDeleteUserModal(u);
                              setActionError("");
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-faint" style={{ marginTop: "0.5rem" }}>
            Showing {filteredUsers.length} of {nonDriverUsers.length} platform users (drivers managed in Drivers tab)
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TAB: DRIVERS
      ════════════════════════════════════════════════════ */}
      {activeTab === "Drivers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-lg)" }}>
          <div className="card">
            <div className="card-header" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
              <h2 className="card-title">Driver Management</h2>
              <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
                <SearchBar value={driverSearch} onChange={setDriverSearch} placeholder="Search by name or plate…" />
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddDriver(v => !v)}>
                  {showAddDriver ? "✕ Cancel" : "+ Add Driver"}
                </button>
              </div>
            </div>

            {/* Add Driver Form */}
            {showAddDriver && (
              <div className="add-driver-form">
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "1rem" }}>Add New Driver</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-control" placeholder="e.g. Kwame Boateng" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input className="form-control" type="tel" placeholder="+233 20 000 0000" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vehicle Plate *</label>
                    <input className="form-control" placeholder="e.g. GR-0001-24" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vehicle Type *</label>
                    <select className="form-control">
                      <option>Van</option>
                      <option>Truck</option>
                      <option>Bike</option>
                      <option>Car</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-control" type="email" placeholder="driver@example.com" />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  <button className="btn btn-primary" id="save-driver-btn">Save Driver</button>
                  <button className="btn btn-ghost" onClick={() => setShowAddDriver(false)}>Cancel</button>
                </div>
              </div>
            )}

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Phone</th>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Availability</th>
                    <th>Active Runs</th>
                    <th>Rating</th>
                    <th>Account</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map((d) => (
                    <tr key={d.id} style={{ opacity: d.active ? 1 : 0.55 }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div className="avatar-sm" style={{ background: d.active ? "var(--grad-primary)" : "var(--clr-surface-2)" }}>
                            {d.name[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{d.name}</div>
                            <div className="text-xs text-faint">Since {d.joined}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-muted">{d.phone}</td>
                      <td><code className="trk-code">{d.vehicle}</code></td>
                      <td className="text-sm text-muted">{d.vehicleType}</td>
                      <td>
                        <span className={`badge ${d.available ? "badge-success" : "badge-muted"}`}>
                          {d.available ? "Available" : "On Delivery"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{d.deliveries}</td>
                      <td>
                        {d.rating > 0
                          ? <span style={{ color: "#f59e0b", fontWeight: 700 }}>★ {d.rating}</span>
                          : <span className="text-faint text-xs">No data</span>
                        }
                      </td>
                      <td>
                        <span className={`badge ${d.active ? "badge-success" : "badge-danger"}`}>
                          {d.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button className="btn btn-sm btn-ghost" id={`view-driver-${d.id}`}>Edit</button>
                          <button
                            className={`btn btn-sm ${d.active ? "btn-danger" : "btn-success"}`}
                            id={`toggle-driver-${d.id || d._id}`}
                            onClick={() => toggleDriver(d.id || d._id)}
                          >
                            {d.active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TAB: REPORTS
      ════════════════════════════════════════════════════ */}
      {activeTab === "Reports" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-lg)" }}>

          {/* KPI Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--sp-md)" }}>
            {[
              { label: "Completed Deliveries",  value: delivered,  icon: "✅", color: "var(--clr-success)", sub: "This month" },
              { label: "Delayed Deliveries",     value: 1,          icon: "⚠️", color: "var(--clr-warning)", sub: "5.9% delay rate" },
              { label: "Avg. Delivery Time",     value: "2.4 hrs",  icon: "⏱️", color: "var(--clr-primary)", sub: "Within Accra" },
              { label: "Avg. ETA Error",         value: "±18 min",  icon: "🤖", color: "#6366f1",            sub: "ML model (RMSE 0.312)" },
              { label: "On-Time Rate",           value: "82%",      icon: "📊", color: "#10b981",            sub: "Target: 90%" },
            ].map((k) => (
              <div key={k.label} className="stat-card" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%" }}>
                  <div className="stat-icon" style={{ background: `${k.color}22`, color: k.color, width: 38, height: 38 }}>{k.icon}</div>
                  <div className="stat-value" style={{ fontSize: "1.4rem" }}>{k.value}</div>
                </div>
                <div>
                  <div className="stat-label">{k.label}</div>
                  <div className="text-xs text-faint">{k.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Shipment Trends + Driver Leaderboard */}
          <div className="dash-grid-2">
            {/* Trends */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">📈 Shipment Trends (Aug 2026)</h2>
              </div>
              <div className="chart-placeholder">
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {[
                    { day: "Mon Aug 4", count: 3, color: "var(--clr-primary)" },
                    { day: "Tue Aug 5", count: 5, color: "var(--clr-primary)" },
                    { day: "Wed Aug 6", count: 4, color: "var(--clr-primary)" },
                    { day: "Thu Aug 7", count: 7, color: "#6366f1" },
                    { day: "Fri Aug 8", count: 2, color: "var(--clr-warning)" },
                  ].map((row) => (
                    <div key={row.day} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span className="text-xs text-faint" style={{ width: 80, flexShrink: 0 }}>{row.day}</span>
                      <div style={{ flex: 1, background: "var(--clr-surface-2)", borderRadius: "var(--r-full)", height: 10, overflow: "hidden" }}>
                        <div style={{ width: `${(row.count / 7) * 100}%`, height: "100%", background: row.color, borderRadius: "var(--r-full)", transition: "width 0.6s ease" }} />
                      </div>
                      <span className="text-xs" style={{ fontWeight: 700, width: 20, textAlign: "right" }}>{row.count}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-faint" style={{ marginTop: "1rem", textAlign: "center" }}>
                  Connect analytics backend to display full chart data
                </p>
              </div>
            </div>

            {/* Driver Leaderboard */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">🏆 Driver Performance</h2>
                <span className="text-xs text-faint">This month</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {DEMO_DRIVERS.filter(d => d.rating > 0).sort((a, b) => b.rating - a.rating).map((d, i) => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0", borderBottom: "1px solid var(--clr-border)" }}>
                    <span style={{ fontWeight: 800, fontSize: "1.1rem", color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : "#b87333", width: 24, textAlign: "center" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                    <div className="avatar-sm">{d.name[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{d.name}</div>
                      <div className="text-xs text-faint">{d.deliveries} deliveries · {d.vehicleType}</div>
                    </div>
                    <span style={{ color: "#f59e0b", fontWeight: 800 }}>★ {d.rating}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status breakdown */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Shipment Status Breakdown</h2>
            </div>
            <div style={{ display: "flex", gap: "var(--sp-md)", flexWrap: "wrap" }}>
              {[
                { label: "Pending",          count: pending,   color: "var(--clr-warning)",  pct: Math.round(pending / total * 100)   },
                { label: "In Transit",       count: inTransit, color: "var(--clr-primary)",  pct: Math.round(inTransit / total * 100) },
                { label: "Delivered",        count: delivered, color: "var(--clr-success)",  pct: Math.round(delivered / total * 100) },
              ].map((s) => (
                <div key={s.label} style={{ flex: 1, minWidth: 160, background: "var(--clr-bg-2)", border: "1px solid var(--clr-border)", borderRadius: "var(--r-md)", padding: "var(--sp-md)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span className="text-sm text-muted">{s.label}</span>
                    <span style={{ fontWeight: 700 }}>{s.count}</span>
                  </div>
                  <div style={{ background: "var(--clr-surface-2)", borderRadius: "var(--r-full)", height: 8, overflow: "hidden" }}>
                    <div style={{ width: `${s.pct}%`, height: "100%", background: s.color, borderRadius: "var(--r-full)" }} />
                  </div>
                  <div className="text-xs text-faint" style={{ marginTop: "0.3rem" }}>{s.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Driver Modal ─────────────────────────────── */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Assign Driver</h2>
              <button className="modal-close" onClick={() => setAssignModal(null)}>✕</button>
            </div>
            <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>
              Selecting a driver for shipment <code className="trk-code">{assignModal}</code>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto", minHeight: 0 }}>
              {drivers.filter(d => d.active !== false && d.status !== "rejected").map((d) => (
                <button
                  key={d._id || d.id}
                  className="driver-select-row"
                  id={`modal-assign-${d._id || d.id}`}
                  onClick={async () => {
                    await assignDriver(assignModal, d._id || d.id, d.name);
                    setAssignModal(null);
                  }}
                >
                  <div className="avatar-sm">{d.name?.[0] || "D"}</div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontWeight: 600 }}>{d.name}</div>
                    <div className="text-xs text-muted">{d.phone || d.vehicleNumber || d.vehicle || "Active Driver"}</div>
                  </div>
                  <span className="badge badge-success">Assign</span>
                </button>
              ))}
              {drivers.filter(d => d.active !== false && d.status !== "rejected").length === 0 && (
                <p className="text-muted text-sm" style={{ padding: "1rem 0" }}>No available drivers at this time.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Review Driver Approval Modal ────────────────────── */}
      {reviewDriverModal && (
        <div className="modal-overlay" onClick={() => setReviewDriverModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Driver Application Review</h2>
              <button className="modal-close" onClick={() => setReviewDriverModal(null)}>✕</button>
            </div>

            {/* Scrollable Modal Content */}
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "0.5rem 0.25rem 0.5rem 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--clr-warning)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 700, color: "#fff" }}>
                  {reviewDriverModal.name ? reviewDriverModal.name[0] : "D"}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{reviewDriverModal.name}</h3>
                  <span className="badge badge-warning">Status: Pending Review</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", background: "var(--clr-surface-2)", borderRadius: "var(--r-md)", padding: "1rem", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Email</span><span style={{ fontWeight: 600 }}>{reviewDriverModal.email}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Phone</span><span style={{ fontWeight: 600 }}>{reviewDriverModal.phone || "N/A"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">License Number</span><span style={{ fontWeight: 600 }}>{reviewDriverModal.licenseNumber || "N/A"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Vehicle Type</span><span style={{ fontWeight: 600 }}>{reviewDriverModal.vehicleType || "Van"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Vehicle Number</span><span style={{ fontWeight: 600 }}>{reviewDriverModal.vehicleNumber || reviewDriverModal.plate || "N/A"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Digital Address</span><span style={{ fontWeight: 600 }}>{reviewDriverModal.digitalAddress || "N/A"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Registration Date</span><span style={{ fontWeight: 600 }}>{reviewDriverModal.joined || "Today"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Application Details</span><span className="badge badge-muted">Awaiting Verification</span></div>
              </div>

              {/* Physical Address Section */}
              <div style={{ marginBottom: "1.25rem" }}>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--clr-text)" }}>Physical Address</h4>
                <div style={{ background: "var(--clr-surface-2)", borderRadius: "var(--r-md)", padding: "1rem", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div><span className="text-muted">Street:</span> <span style={{ fontWeight: 600 }}>{reviewDriverModal.street || "N/A"}</span></div>
                  <div><span className="text-muted">City:</span> <span style={{ fontWeight: 600 }}>{reviewDriverModal.city || "N/A"}</span></div>
                  <div><span className="text-muted">Region:</span> <span style={{ fontWeight: 600 }}>{reviewDriverModal.region || "N/A"}</span></div>
                </div>
              </div>

              {/* Ghana Card Section */}
              <div style={{ marginBottom: "1.25rem" }}>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--clr-text)" }}>Identity Verification</h4>
                <div style={{ border: "1px solid var(--clr-border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
                  {reviewDriverModal.ghanaCardImage ? (
                    <div>
                      <div style={{ padding: "0.75rem", background: "var(--clr-surface)", borderBottom: "1px solid var(--clr-border)", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>📄</span>
                        <span>Ghana Card Image</span>
                      </div>
                      <div style={{ padding: "1rem", textAlign: "center", minHeight: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {ghanaCardLoading && (
                          <span style={{ color: "var(--clr-text-muted)", fontSize: "0.85rem" }}>Loading Ghana Card…</span>
                        )}
                        {!ghanaCardLoading && ghanaCardError && (
                          <span style={{ color: "var(--clr-error, #ef4444)", fontSize: "0.85rem" }}>{ghanaCardError}</span>
                        )}
                        {!ghanaCardLoading && ghanaCardUrl && (
                          <img
                            src={ghanaCardUrl}
                            alt="Ghana Card"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "200px",
                              borderRadius: "var(--r-sm)",
                              border: "1px solid var(--clr-border)"
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "block";
                            }}
                          />
                        )}
                        {!ghanaCardLoading && !ghanaCardUrl && !ghanaCardError && (
                          <span style={{ color: "var(--clr-text-muted)", fontSize: "0.85rem" }}>Ghana Card image not available</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "1rem", textAlign: "center", color: "var(--clr-text-muted)", fontSize: "0.85rem" }}>
                      No Ghana Card uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fixed Action Footer */}
            <div style={{ flexShrink: 0, paddingTop: "1rem", borderTop: "1px solid var(--clr-border)", display: "flex", gap: "0.75rem" }}>
              <button
                className="btn btn-success"
                style={{ flex: 1, padding: "0.75rem" }}
                onClick={async () => {
                  await approveDriver(reviewDriverModal._id || reviewDriverModal.userId || reviewDriverModal.id);
                  setReviewDriverModal(null);
                }}
              >
                ✓ Approve Driver
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1, padding: "0.75rem" }}
                onClick={async () => {
                  if (window.confirm("Are you sure you want to reject this driver application?")) {
                    await rejectDriver(reviewDriverModal._id || reviewDriverModal.userId || reviewDriverModal.id);
                    setReviewDriverModal(null);
                  }
                }}
              >
                ✕ Reject Driver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Shipment / Booking Details Modal ───────────── */}
      {viewShipmentModal && (
        <div className="modal-overlay" onClick={() => setViewShipmentModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, margin: 0 }}>Booking Details</h2>
                  <span className={`badge ${STATUS_COLORS[viewShipmentModal.status] ?? "badge-muted"}`}>
                    {viewShipmentModal.status}
                  </span>
                </div>
                <div className="text-xs text-muted" style={{ marginTop: "0.25rem" }}>
                  Reference / Tracking: <code className="trk-code">{viewShipmentModal.id || viewShipmentModal.trackingNumber}</code>
                </div>
              </div>
              <button className="modal-close" onClick={() => setViewShipmentModal(null)}>✕</button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, paddingRight: "0.25rem", minHeight: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Customer Contact Information */}
              <div style={{ background: "var(--clr-bg-2)", border: "1px solid var(--clr-border)", borderRadius: "var(--r-md)", padding: "1rem" }}>
                <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "var(--clr-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  👤 Customer Contact Information
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", fontSize: "0.88rem" }}>
                  <div>
                    <span className="text-xs text-faint" style={{ display: "block" }}>Full Name</span>
                    <strong>{viewShipmentModal.customerName || viewShipmentModal.customer?.name || "N/A"}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-faint" style={{ display: "block" }}>Email</span>
                    <a href={`mailto:${viewShipmentModal.customerEmail || viewShipmentModal.customer?.email || ""}`} style={{ color: "var(--clr-primary)", wordBreak: "break-all" }}>
                      {viewShipmentModal.customerEmail || viewShipmentModal.customer?.email || "N/A"}
                    </a>
                  </div>
                  <div>
                    <span className="text-xs text-faint" style={{ display: "block" }}>Phone Number</span>
                    <a href={`tel:${viewShipmentModal.customerPhone || viewShipmentModal.customer?.phone || ""}`} style={{ color: "var(--clr-primary)", fontWeight: 600 }}>
                      {viewShipmentModal.customerPhone || viewShipmentModal.customer?.phone || "N/A"}
                    </a>
                  </div>
                </div>
              </div>

              {/* Delivery Route */}
              <div style={{ background: "var(--clr-bg-2)", border: "1px solid var(--clr-border)", borderRadius: "var(--r-md)", padding: "1rem" }}>
                <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "var(--clr-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  📍 Route & Recipient
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.88rem" }}>
                  <div>
                    <span className="text-xs text-faint" style={{ display: "block" }}>Pickup Location</span>
                    <div>{viewShipmentModal.pickupAddress || viewShipmentModal.from || "N/A"}</div>
                  </div>
                  <div>
                    <span className="text-xs text-faint" style={{ display: "block" }}>Destination</span>
                    <div>{viewShipmentModal.destinationAddress || viewShipmentModal.to || "N/A"}</div>
                  </div>
                  <div>
                    <span className="text-xs text-faint" style={{ display: "block" }}>Recipient Name</span>
                    <div>{viewShipmentModal.receiverName || "—"}</div>
                  </div>
                  <div>
                    <span className="text-xs text-faint" style={{ display: "block" }}>Recipient Phone</span>
                    {viewShipmentModal.receiverPhone ? (
                      <a href={`tel:${viewShipmentModal.receiverPhone}`} style={{ color: "var(--clr-primary)" }}>
                        {viewShipmentModal.receiverPhone}
                      </a>
                    ) : "—"}
                  </div>
                </div>
              </div>

              {/* Package & Shipment Details */}
              <div style={{ background: "var(--clr-bg-2)", border: "1px solid var(--clr-border)", borderRadius: "var(--r-md)", padding: "1rem" }}>
                <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "var(--clr-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  📦 Package & Booking Information
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", fontSize: "0.88rem" }}>
                  <div>
                    <span className="text-xs text-faint" style={{ display: "block" }}>Package Category</span>
                    <strong>{viewShipmentModal.packageType || viewShipmentModal.type || "Standard"}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-faint" style={{ display: "block" }}>Weight</span>
                    <div>{viewShipmentModal.weight ? `${viewShipmentModal.weight} kg` : "—"}</div>
                  </div>
                  <div>
                    <span className="text-xs text-faint" style={{ display: "block" }}>Delivery Fee</span>
                    <strong style={{ color: "var(--clr-success)" }}>
                      {viewShipmentModal.deliveryFee ? `GH₵ ${Number(viewShipmentModal.deliveryFee).toFixed(2)}` : "GH₵ 0.00"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-xs text-faint" style={{ display: "block" }}>Booking Date</span>
                    <div>{viewShipmentModal.date || (viewShipmentModal.createdAt ? new Date(viewShipmentModal.createdAt).toLocaleDateString() : "—")}</div>
                  </div>
                  <div>
                    <span className="text-xs text-faint" style={{ display: "block" }}>Estimated Delivery (ETA)</span>
                    <div>{viewShipmentModal.eta || (viewShipmentModal.estimatedArrival ? new Date(viewShipmentModal.estimatedArrival).toLocaleDateString() : "TBD")}</div>
                  </div>
                </div>
                {viewShipmentModal.notes && (
                  <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--clr-border)" }}>
                    <span className="text-xs text-faint" style={{ display: "block" }}>Instructions / Notes</span>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--clr-text-muted)" }}>{viewShipmentModal.notes}</p>
                  </div>
                )}
              </div>

              {/* Assigned Driver Section */}
              <div style={{ background: "var(--clr-bg-2)", border: "1px solid var(--clr-border)", borderRadius: "var(--r-md)", padding: "1rem" }}>
                <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "var(--clr-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  🚚 Driver Assignment
                </h4>
                {viewShipmentModal.driver && viewShipmentModal.driver !== "—" ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{viewShipmentModal.driver}</div>
                      {viewShipmentModal.driverPhone && (
                        <div className="text-xs text-muted">Phone: <a href={`tel:${viewShipmentModal.driverPhone}`} style={{ color: "var(--clr-primary)" }}>{viewShipmentModal.driverPhone}</a></div>
                      )}
                    </div>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => {
                        const targetId = viewShipmentModal.id || viewShipmentModal.trackingNumber;
                        setViewShipmentModal(null);
                        setAssignModal(targetId);
                      }}
                    >
                      Reassign Driver
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span className="text-sm text-muted">No driver currently assigned</span>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        const targetId = viewShipmentModal.id || viewShipmentModal.trackingNumber;
                        setViewShipmentModal(null);
                        setAssignModal(targetId);
                      }}
                    >
                      Assign Driver
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ flexShrink: 0, paddingTop: "1rem", borderTop: "1px solid var(--clr-border)", display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setViewShipmentModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View User Account Details Modal ─────────────────── */}
      {viewUserModal && (
        <div className="modal-overlay" onClick={() => setViewUserModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div className="avatar-sm">{viewUserModal.name?.[0] || "U"}</div>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, margin: 0 }}>{viewUserModal.name}</h2>
                  <div className="text-xs text-muted" style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginTop: "0.2rem" }}>
                    <span className={`badge ${viewUserModal.role === "admin" ? "badge-primary" : "badge-muted"}`}>
                      {viewUserModal.role === "admin" ? "Administrator" : "Customer"}
                    </span>
                    <span className={`badge ${viewUserModal.status === "active" || viewUserModal.isActive !== false ? "badge-success" : "badge-danger"}`}>
                      {viewUserModal.status || "active"}
                    </span>
                  </div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setViewUserModal(null)}>✕</button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, paddingRight: "0.25rem", minHeight: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "var(--clr-bg-2)", border: "1px solid var(--clr-border)", borderRadius: "var(--r-md)", padding: "1rem" }}>
                <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "var(--clr-primary)" }}>
                  Account Profile
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.88rem" }}>
                  <div>
                    <span className="text-xs text-faint" style={{ display: "block" }}>Email</span>
                    <a href={`mailto:${viewUserModal.email}`} style={{ color: "var(--clr-primary)", wordBreak: "break-all" }}>
                      {viewUserModal.email || "N/A"}
                    </a>
                  </div>
                  <div>
                    <span className="text-xs text-faint" style={{ display: "block" }}>Phone Number</span>
                    {viewUserModal.phone ? (
                      <a href={`tel:${viewUserModal.phone}`} style={{ color: "var(--clr-primary)" }}>
                        {viewUserModal.phone}
                      </a>
                    ) : "N/A"}
                  </div>
                  <div>
                    <span className="text-xs text-faint" style={{ display: "block" }}>Registered Date</span>
                    <div>{viewUserModal.joined || (viewUserModal.createdAt ? new Date(viewUserModal.createdAt).toLocaleDateString() : "—")}</div>
                  </div>
                  <div>
                    <span className="text-xs text-faint" style={{ display: "block" }}>Total Bookings</span>
                    <strong>{viewUserModal.shipmentCount ?? viewUserModal.shipments ?? 0} shipments</strong>
                  </div>
                </div>
              </div>

              <div style={{ background: "var(--clr-bg-2)", border: "1px solid var(--clr-border)", borderRadius: "var(--r-md)", padding: "1rem" }}>
                <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "var(--clr-primary)" }}>
                  Location Address
                </h4>
                <p style={{ margin: 0, fontSize: "0.88rem" }}>
                  {[
                    viewUserModal.street || viewUserModal.address?.street,
                    viewUserModal.city || viewUserModal.address?.city,
                    viewUserModal.region || viewUserModal.address?.region
                  ].filter(Boolean).join(", ") || "No address details registered"}
                </p>
              </div>
            </div>

            <div style={{ flexShrink: 0, paddingTop: "1rem", borderTop: "1px solid var(--clr-border)", display: "flex", justifyContent: "space-between" }}>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  const target = viewUserModal;
                  setViewUserModal(null);
                  setEditForm({
                    name: target.name || "",
                    phone: target.phone || "",
                    street: target.address?.street || target.addressStreet || "",
                    city: target.address?.city || target.addressCity || "",
                    region: target.address?.region || target.addressRegion || "",
                    status: target.status || "active",
                    newPassword: ""
                  });
                  setEditUserModal(target);
                }}
              >
                ✏️ Edit Profile
              </button>
              <button className="btn btn-ghost" onClick={() => setViewUserModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ──────────────────────────────────── */}
      {editUserModal && (
        <div className="modal-overlay" onClick={() => setEditUserModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, margin: 0 }}>Edit User Account</h2>
                <span className="text-xs text-muted">
                  Updating {editUserModal.role || "user"} ({editUserModal.email})
                </span>
              </div>
              <button className="modal-close" onClick={() => setEditUserModal(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveUser} style={{ overflowY: "auto", flex: 1, paddingRight: "0.25rem", minHeight: 0, display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {actionError && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--clr-danger)", color: "var(--clr-danger)", borderRadius: "var(--r-md)", padding: "0.6rem 0.8rem", fontSize: "0.85rem" }}>
                  {actionError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  className="form-control"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-control"
                  type="tel"
                  placeholder="+233 20 000 0000"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    className="form-control"
                    placeholder="Accra, Kumasi…"
                    value={editForm.city}
                    onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Region</label>
                  <input
                    className="form-control"
                    placeholder="Greater Accra, Ashanti…"
                    value={editForm.region}
                    onChange={(e) => setEditForm(prev => ({ ...prev, region: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input
                  className="form-control"
                  placeholder="Street / Digital Address"
                  value={editForm.street}
                  onChange={(e) => setEditForm(prev => ({ ...prev, street: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Status</label>
                <select
                  className="form-control"
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive / Suspended</option>
                </select>
              </div>

              <div style={{ background: "var(--clr-bg-2)", border: "1px solid var(--clr-border)", borderRadius: "var(--r-md)", padding: "0.85rem" }}>
                <label className="form-label" style={{ marginBottom: "0.2rem" }}>
                  Reset User Password (Optional)
                </label>
                <p className="text-xs text-muted" style={{ margin: "0 0 0.5rem 0" }}>
                  Leave blank to preserve current password. Changing will securely update login credentials in Supabase Auth.
                </p>
                <input
                  className="form-control"
                  type="password"
                  placeholder="Enter new password (min. 6 characters)"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>

              <div style={{ flexShrink: 0, paddingTop: "0.75rem", borderTop: "1px solid var(--clr-border)", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditUserModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete User Confirmation Modal ───────────────────── */}
      {deleteUserModal && (
        <div className="modal-overlay" onClick={() => setDeleteUserModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--clr-danger)" }}>
                Delete User Account
              </h2>
              <button className="modal-close" onClick={() => setDeleteUserModal(null)}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ margin: 0, fontSize: "0.95rem" }}>
                Are you sure you want to delete this user? This action cannot be undone.
              </p>

              <div style={{ background: "var(--clr-bg-2)", border: "1px solid var(--clr-border)", borderRadius: "var(--r-md)", padding: "0.85rem", fontSize: "0.88rem" }}>
                <div><strong>Name:</strong> {deleteUserModal.name}</div>
                <div><strong>Email:</strong> {deleteUserModal.email}</div>
                <div><strong>Role:</strong> {deleteUserModal.role || "customer"}</div>
                {deleteUserModal.shipmentCount !== undefined && (
                  <div><strong>Total Shipments:</strong> {deleteUserModal.shipmentCount}</div>
                )}
              </div>

              <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "var(--r-md)", padding: "0.75rem", fontSize: "0.82rem", color: "var(--clr-text-muted)" }}>
                🛡️ <strong>Historical Records Preserved:</strong> All existing shipment, booking, and delivery records associated with this customer will be safely retained in the database for auditing and operational history. The user's account will be deactivated and login credentials revoked.
              </div>

              {currentUser && (currentUser.id === (deleteUserModal._id || deleteUserModal.id)) && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--clr-danger)", color: "var(--clr-danger)", borderRadius: "var(--r-md)", padding: "0.6rem 0.8rem", fontSize: "0.85rem" }}>
                  ⚠️ You cannot delete your own active administrator account.
                </div>
              )}

              {actionError && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--clr-danger)", color: "var(--clr-danger)", borderRadius: "var(--r-md)", padding: "0.6rem 0.8rem", fontSize: "0.85rem" }}>
                  {actionError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", paddingTop: "0.5rem" }}>
                <button className="btn btn-ghost" onClick={() => setDeleteUserModal(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  disabled={actionLoading || (currentUser && (currentUser.id === (deleteUserModal._id || deleteUserModal.id)))}
                  onClick={handleDeleteUser}
                >
                  {actionLoading ? "Deleting…" : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
