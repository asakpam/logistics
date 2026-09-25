import { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../../context/DataContext.jsx";

const DEMO_CUSTOMERS = [
  { _id: "c1", name: "Kofi Mensah",    email: "kofi@example.com",    phone: "+233 20 123 4567", joined: "Jan 15, 2026", status: "active",   shipments: 8  },
  { _id: "c2", name: "Ama Owusu",      email: "ama@example.com",     phone: "+233 24 987 6543", joined: "Feb 3, 2026",  status: "active",   shipments: 3  },
  { _id: "c3", name: "Yaw Darko",      email: "yaw@example.com",     phone: "+233 55 234 5678", joined: "Mar 20, 2026", status: "active",   shipments: 12 },
  { _id: "c4", name: "Abena Asante",   email: "abena@example.com",   phone: "+233 27 345 6789", joined: "Apr 7, 2026",  status: "inactive", shipments: 1  },
  { _id: "c5", name: "Kwame Boateng",  email: "kwame@example.com",   phone: "+233 50 456 7890", joined: "May 12, 2026", status: "active",   shipments: 5  },
];

const DEMO_DRIVERS = [
  { _id: "d1", name: "Emmanuel Adu",   email: "emmanuel@driver.com", phone: "+233 20 111 2222", joined: "Dec 1, 2025",  status: "approved", deliveries: 145, vehicle: "Toyota Hiace · GH-1234-23" },
  { _id: "d2", name: "Samuel Adjei",   email: "samuel@driver.com",   phone: "+233 24 333 4444", joined: "Jan 8, 2026",  status: "approved", deliveries: 98,  vehicle: "Nissan Urvan · GH-5678-24" },
  { _id: "d3", name: "Victor Boateng", email: "victor@driver.com",   phone: "+233 55 555 6666", joined: "Feb 14, 2026", status: "approved", deliveries: 67,  vehicle: "Hyundai H100 · GH-9012-24" },
  { _id: "d4", name: "Isaac Mensah",   email: "isaac@driver.com",    phone: "+233 27 777 8888", joined: "Mar 3, 2026",  status: "suspended",deliveries: 22,  vehicle: "Toyota Hiace · GH-3456-23" },
];

const TABS = ["Customers", "Drivers"];

export function ManageUsers() {
  const { customers, drivers, updateUserStatus, updateUser, deleteUser, loading } = useData();
  const [activeTab, setActiveTab] = useState("Customers");
  const [search, setSearch]       = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Use live data if available, fallback to demo
  const customersList = Array.isArray(customers) && customers.length > 0 ? customers : DEMO_CUSTOMERS;
  const driversList   = Array.isArray(drivers) && drivers.length > 0   ? drivers   : DEMO_DRIVERS;

  const data = activeTab === "Customers" ? customersList : driversList;

  const filtered = Array.isArray(data) ? data.filter(u => {
    if (!u) return false;
    const term = (search || "").toLowerCase();
    const nameStr = (u.name || "").toLowerCase();
    const emailStr = (u.email || "").toLowerCase();
    const phoneStr = (u.phone || "").toLowerCase();
    return nameStr.includes(term) || emailStr.includes(term) || phoneStr.includes(term);
  }) : [];

  const handleEdit = (user) => {
    setEditModal(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      street: user.street || user.address?.street || "",
      city: user.city || user.address?.city || "",
      region: user.region || user.address?.region || ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    try {
      await updateUser(editModal._id || editModal.id, {
        name: editForm.name,
        phone: editForm.phone,
        address: {
          street: editForm.street,
          city: editForm.city,
          region: editForm.region
        }
      });
      setEditModal(null);
      alert("User updated successfully");
    } catch (err) {
      console.error("Failed to update user:", err);
      alert("Failed to update user: " + (err.message || "Unknown error"));
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}? This action may affect their shipment records.`)) {
      return;
    }
    try {
      await deleteUser(user._id || user.id);
      alert("User deleted successfully");
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Failed to delete user: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div className="dashboard-page">
      {loading && (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--clr-text-muted)" }}>
          Loading users...
        </div>
      )}
      {!loading && (
        <>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            User <span className="gradient-text">Management</span>
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            Manage all platform customers and drivers in real-time.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/dashboard/admin" className="btn btn-ghost btn-sm">← Admin</Link>
          <button id="add-user-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: "Total Customers",  value: customersList.length,                                                                                  icon: "👥", color: "var(--clr-primary)" },
          { label: "Active Customers", value: customersList.filter(u => (u.status||"").toLowerCase() === "active").length,                       icon: "✅", color: "var(--clr-success)" },
          { label: "Total Drivers",    value: driversList.length,                                                                                    icon: "🚚", color: "#6366f1" },
          { label: "Approved Drivers", value: driversList.filter(u => (u.status||"").toLowerCase() === "approved" || (u.status||"").toLowerCase() === "active").length, icon: "📍", color: "var(--clr-warning)" },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Tabs + search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div className="dash-tabs" style={{ marginBottom: 0 }}>
          {TABS.map(t => (
            <button key={t} className={`dash-tab${activeTab === t ? " active" : ""}`} onClick={() => { setActiveTab(t); setSearch(""); }}>
              {t} <span className="tab-badge">{t === "Customers" ? customersList.length : driversList.length}</span>
            </button>
          ))}
        </div>
        <input
          id="user-search"
          className="form-control search-sm"
          placeholder={`Search ${activeTab.toLowerCase()}…`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                {activeTab === "Drivers" && <th>Vehicle</th>}
                {activeTab === "Drivers" && <th>Deliveries</th>}
                {activeTab === "Customers" && <th>Shipments</th>}
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--clr-text-faint)" }}>No users found.</td></tr>
              ) : filtered.map(u => {
                const st = (u.status || "active").toLowerCase();
                const badgeClass = st === "active" || st === "approved" ? "badge-success" : st === "pending" ? "badge-warning" : "badge-danger";

                return (
                  <tr key={u._id || u.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--clr-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {u.name ? u.name[0] : "U"}
                        </div>
                        {u.name}
                      </div>
                    </td>
                    <td className="text-muted text-sm">{u.email}</td>
                    <td className="text-sm">{u.phone || "N/A"}</td>
                    {activeTab === "Drivers" && <td className="text-xs text-muted">{u.vehicle || "Van"}</td>}
                    {activeTab === "Drivers" && <td style={{ fontWeight: 700 }}>{u.deliveries ?? 0}</td>}
                    {activeTab === "Customers" && <td style={{ fontWeight: 700 }}>{u.shipments ?? 0}</td>}
                    <td className="text-xs text-faint">{u.joined || "Recently"}</td>
                    <td>
                      <span className={`badge ${badgeClass}`} style={{ textTransform: "capitalize" }}>
                        {u.status || "active"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleEdit(u)}
                          title="Edit user"
                        >
                          ✏️
                        </button>
                        <button
                          className={`btn btn-sm ${st === "active" || st === "approved" ? "btn-danger" : "btn-success"}`}
                          onClick={() => updateUserStatus(u._id || u.userId || u.id, (st === "active" || st === "approved") ? "suspended" : "active")}
                          id={`toggle-user-${u._id || u.id || u.userId || "row"}`}
                        >
                          {(st === "active" || st === "approved") ? "Disable" : "Enable"}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(u)}
                          title="Delete user"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setEditModal(null)}>
          <div className="card" style={{ width: "100%", maxWidth: 480, padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: "1rem" }}>
              <h2 className="card-title">Edit User: {editModal.name}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditModal(null)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                className="form-control" 
                value={editForm.name} 
                onChange={e => setEditForm({...editForm, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email (read-only)</label>
              <input className="form-control" value={editForm.email} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input 
                className="form-control" 
                value={editForm.phone} 
                onChange={e => setEditForm({...editForm, phone: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Street Address</label>
              <input 
                className="form-control" 
                value={editForm.street} 
                onChange={e => setEditForm({...editForm, street: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input 
                className="form-control" 
                value={editForm.city} 
                onChange={e => setEditForm({...editForm, city: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Region</label>
              <input 
                className="form-control" 
                value={editForm.region} 
                onChange={e => setEditForm({...editForm, region: e.target.value})}
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditModal(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div className="card" style={{ width: "100%", maxWidth: 440, padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: "1rem" }}>
              <h2 className="card-title">Add New User</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-control" placeholder="Enter full name" /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" placeholder="email@example.com" /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-control" placeholder="+233 XX XXX XXXX" /></div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control"><option value="customer">Customer</option><option value="driver">Driver</option></select>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Add User</button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
