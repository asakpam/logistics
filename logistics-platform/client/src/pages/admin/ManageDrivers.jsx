import { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../../context/DataContext.jsx";

const DEMO_DRIVERS = [
  { _id:"d1", name:"Emmanuel Adu",   email:"emmanuel@driver.com", phone:"+233 20 111 2222", vehicle:"Toyota Hiace",   plate:"GH-1234-23", deliveries:145, activeShipments:2, status:"approved",    available:true,  rating:4.9, joined:"Dec 2025" },
  { _id:"d2", name:"Samuel Adjei",   email:"samuel@driver.com",   phone:"+233 24 333 4444", vehicle:"Nissan Urvan",   plate:"GH-5678-24", deliveries:98,  activeShipments:1, status:"approved",    available:false, rating:4.7, joined:"Jan 2026" },
  { _id:"d3", name:"Victor Boateng", email:"victor@driver.com",   phone:"+233 55 555 6666", vehicle:"Hyundai H100",   plate:"GH-9012-24", deliveries:67,  activeShipments:1, status:"approved",    available:true,  rating:4.8, joined:"Feb 2026" },
  { _id:"d4", name:"Isaac Mensah",   email:"isaac@driver.com",    phone:"+233 27 777 8888", vehicle:"Toyota Hiace",   plate:"GH-3456-23", deliveries:22,  activeShipments:0, status:"suspended",   available:false, rating:3.9, joined:"Mar 2026" },
  { _id:"d5", name:"Grace Asante",   email:"grace@driver.com",    phone:"+233 50 999 0000", vehicle:"Ford Transit",   plate:"GH-7890-24", deliveries:41,  activeShipments:0, status:"approved",    available:true,  rating:4.6, joined:"Apr 2026" },
];

export function ManageDrivers() {
  const { drivers: liveDrivers, pendingDrivers, approveDriver, rejectDriver, updateUserStatus, updateUser, deleteUser, loading } = useData();
  const driversList = Array.isArray(liveDrivers) && liveDrivers.length > 0 ? liveDrivers : DEMO_DRIVERS;

  const [search, setSearch]       = useState("");
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter]       = useState("All");
  const [reviewModal, setReviewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});

  const filtered = Array.isArray(driversList) ? driversList.filter(d => {
    const term = search.toLowerCase();
    const nameStr = (d.name || "").toLowerCase();
    const emailStr = (d.email || "").toLowerCase();
    const plateStr = (d.plate || d.vehicleNumber || "").toLowerCase();
    const matchSearch = nameStr.includes(term) || emailStr.includes(term) || plateStr.includes(term);

    const st = (d.status || "").toLowerCase();
    let matchFilter = true;
    if (filter === "Pending") matchFilter = st === "pending";
    else if (filter === "Approved") matchFilter = st === "approved" || st === "active";
    else if (filter === "Rejected") matchFilter = st === "rejected";
    else if (filter === "Suspended") matchFilter = st === "suspended";
    else if (filter === "Available") matchFilter = d.available;

    return matchSearch && matchFilter;
  }) : [];

  const handleEdit = (driver) => {
    setEditModal(driver);
    setEditForm({
      name: driver.name || "",
      email: driver.email || "",
      phone: driver.phone || "",
      licenseNumber: driver.licenseNumber || "",
      vehicleType: driver.vehicleType || driver.vehicle || "Van",
      vehicleNumber: driver.vehicleNumber || driver.plate || "",
      street: driver.street || "",
      city: driver.city || "",
      region: driver.region || ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    try {
      // Update user profile fields
      await updateUser(editModal.userId || editModal._id, {
        name: editForm.name,
        phone: editForm.phone,
        address: {
          street: editForm.street,
          city: editForm.city,
          region: editForm.region
        }
      });
      // Note: Driver-specific fields (license, vehicle) would need a separate API endpoint
      // For now, we're updating user profile fields only
      setEditModal(null);
      alert("Driver updated successfully");
    } catch (err) {
      console.error("Failed to update driver:", err);
      alert("Failed to update driver: " + (err.message || "Unknown error"));
    }
  };

  const handleDelete = async (driver) => {
    const driverId = driver.userId || driver._id;
    if (!window.confirm(`Are you sure you want to delete driver ${driver.name}? This may affect their assigned shipments and delivery history.`)) {
      return;
    }
    try {
      await deleteUser(driverId);
      alert("Driver deleted successfully");
    } catch (err) {
      console.error("Failed to delete driver:", err);
      alert("Failed to delete driver: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Driver <span className="gradient-text">Management</span>
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            Monitor, review driver applications, manage, and assign platform drivers.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/dashboard/admin" className="btn btn-ghost btn-sm">← Admin</Link>
          <button id="add-driver-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Driver
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: "Total Drivers",    value: driversList.length,                                                                    icon: "🚚", color: "var(--clr-primary)" },
          { label: "Pending Approvals",value: pendingDrivers.length,                                                                 icon: "⏳", color: "var(--clr-warning)" },
          { label: "Approved Drivers", value: driversList.filter(d => (d.status||"").toLowerCase() === "approved" || (d.status||"").toLowerCase() === "active").length, icon: "✅", color: "var(--clr-success)" },
          { label: "Suspended",        value: driversList.filter(d => (d.status||"").toLowerCase() === "suspended").length,        icon: "🚫", color: "var(--clr-danger)" },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
        {["All","Pending","Approved","Rejected","Suspended","Available"].map(f => (
          <button key={f} className={`tab-pill${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
            {f} {f === "Pending" && pendingDrivers.length > 0 && <span style={{ background: "var(--clr-warning)", color: "#fff", padding: "0.1rem 0.4rem", borderRadius: "10px", fontSize: "0.72rem", marginLeft: "0.3rem" }}>{pendingDrivers.length}</span>}
          </button>
        ))}
        <input
          id="driver-search"
          className="form-control search-sm"
          placeholder="Search name, email, plate…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: "auto", maxWidth: 260 }}
        />
      </div>

      {/* Driver cards */}
      <div className="driver-cards-grid">
        {filtered.map(d => {
          const st = (d.status || "pending").toLowerCase();
          const badgeClass = st === "approved" || st === "active" ? "badge-success" : st === "pending" ? "badge-warning" : "badge-danger";

          return (
            <div key={d._id || d.id} className="card">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--clr-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                  {d.name ? d.name[0] : "D"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontWeight: 700 }}>{d.name}</p>
                    <span className={`badge ${badgeClass}`} style={{ textTransform: "capitalize" }}>{d.status || "Pending"}</span>
                  </div>
                  <p className="text-xs text-faint">{d.email}</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                {[
                  { label: "Phone",       val: d.phone || "N/A" },
                  { label: "Vehicle",     val: d.vehicle || `${d.vehicleType || "Van"} · ${d.plate || "N/A"}` },
                  { label: "License No.", val: d.licenseNumber || "N/A" },
                  { label: "Deliveries",  val: d.deliveries ?? 0, bold: true },
                  { label: "Rating",      val: `⭐ ${d.rating || "4.8"}`, highlight: true },
                  { label: "Joined",      val: d.joined || "Recently" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.83rem" }}>
                    <span className="text-muted">{item.label}</span>
                    <span style={{ fontWeight: item.bold ? 700 : 500, color: item.highlight ? "var(--clr-warning)" : "var(--clr-text)" }}>{item.val}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
                {st === "pending" ? (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setReviewModal(d)}
                  >
                    🔍 Review Application
                  </button>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className={`btn btn-sm ${st === "suspended" ? "btn-success" : "btn-danger"}`}
                        style={{ flex: 1 }}
                        onClick={() => updateUserStatus(d.userId || d._id, st === "suspended" ? "approved" : "suspended")}
                      >
                        {st === "suspended" ? "Reinstate" : "Suspend"}
                      </button>
                      {(st === "approved" || st === "active") && (
                        <Link to="/admin/assign" className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                          Assign →
                        </Link>
                      )}
                    </div>
                    {(st === "approved" || st === "active") && (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => handleEdit(d)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => handleDelete(d)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Review Driver Application</h2>
              <button className="modal-close" onClick={() => setReviewModal(null)}>✕</button>
            </div>
            <div style={{ padding: "0.5rem 0" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", background: "var(--clr-surface-2)", borderRadius: "var(--r-md)", padding: "1rem", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Driver Name</span><span style={{ fontWeight: 600 }}>{reviewModal.name}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Email</span><span style={{ fontWeight: 600 }}>{reviewModal.email}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Phone</span><span style={{ fontWeight: 600 }}>{reviewModal.phone || "N/A"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">License No.</span><span style={{ fontWeight: 600 }}>{reviewModal.licenseNumber || "N/A"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Vehicle Details</span><span style={{ fontWeight: 600 }}>{reviewModal.vehicle || "Van"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Registration Date</span><span style={{ fontWeight: 600 }}>{reviewModal.joined || "Today"}</span></div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  className="btn btn-success"
                  style={{ flex: 1, padding: "0.75rem" }}
                  onClick={async () => {
                    await approveDriver(reviewModal._id || reviewModal.userId);
                    setReviewModal(null);
                  }}
                >
                  ✓ Approve Driver
                </button>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1, padding: "0.75rem" }}
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to reject this driver application?")) {
                      await rejectDriver(reviewModal._id || reviewModal.userId);
                      setReviewModal(null);
                    }
                  }}
                >
                  ✕ Reject Driver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Driver Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Edit Driver</h2>
              <button className="modal-close" onClick={() => setEditModal(null)}>✕</button>
            </div>
            <div style={{ padding: "0.5rem 0" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-control"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-control"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input
                    className="form-control"
                    value={editForm.street}
                    onChange={e => setEditForm({ ...editForm, street: e.target.value })}
                  />
                </div>
                <div className="modal-grid-2">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      className="form-control"
                      value={editForm.city}
                      onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Region</label>
                    <input
                      className="form-control"
                      value={editForm.region}
                      onChange={e => setEditForm({ ...editForm, region: e.target.value })}
                    />
                  </div>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--clr-muted)", marginTop: "0.5rem" }}>
                  Note: Driver-specific fields (license, vehicle) are read-only. Contact support to update vehicle credentials.
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1, padding: "0.75rem" }}
                  onClick={() => setEditModal(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "0.75rem" }}
                  onClick={handleSaveEdit}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div className="card" style={{ width: "100%", maxWidth: 480, padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: "1rem" }}>
              <h2 className="card-title">Add New Driver</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="dash-grid-2" style={{ gap: "0.75rem" }}>
              <div className="form-group"><label className="form-label">Full Name</label><input className="form-control" placeholder="Driver name" /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" placeholder="email@driver.com" /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-control" placeholder="+233 XX XXX XXXX" /></div>
              <div className="form-group"><label className="form-label">License No.</label><input className="form-control" placeholder="DRV-XXXXXX" /></div>
              <div className="form-group"><label className="form-label">Vehicle Type</label><input className="form-control" placeholder="e.g. Toyota Hiace" /></div>
              <div className="form-group"><label className="form-label">Plate Number</label><input className="form-control" placeholder="GH-XXXX-XX" /></div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Add Driver</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
