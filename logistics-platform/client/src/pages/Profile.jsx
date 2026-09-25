import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";

export function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const { shipments } = useData();
  const navigate = useNavigate();

  const [editing, setEditing]   = useState(false);
  const [saved, setSaved]       = useState(false);
  const [form, setForm]         = useState({
    name:  user?.name  || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [pwForm, setPwForm]     = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg]       = useState("");

  function handleSave(e) {
    e.preventDefault();
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  }

  function handlePwSubmit(e) {
    e.preventDefault();
    if (!pwForm.next || pwForm.next.length < 6) {
      setPwMsg("Password must be at least 6 characters.");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg("Passwords do not match.");
      return;
    }
    setPwMsg("✅ Password updated successfully!");
    setPwForm({ current: "", next: "", confirm: "" });
    setTimeout(() => setPwMsg(""), 3000);
  }

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  const stats = [
    { label: "Total Shipments",  value: shipments.length || 5,                                                      color: "#6366f1" },
    { label: "Active",           value: shipments.filter(s => !["Delivered","Cancelled"].includes(s.status)).length || 2, color: "var(--clr-primary)" },
    { label: "Delivered",        value: shipments.filter(s => s.status === "Delivered").length || 2,                 color: "var(--clr-success)" },
    { label: "Pending",          value: shipments.filter(s => s.status === "Pending").length || 1,                   color: "var(--clr-warning)" },
  ];

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            My <span className="gradient-text">Profile</span>
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            Manage your personal information and account settings.
          </p>
        </div>
        {saved && (
          <span className="badge badge-success" style={{ fontSize: "0.9rem", padding: "0.5rem 1rem" }}>
            ✅ Saved!
          </span>
        )}
      </div>

      <div className="dash-grid-2">
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-lg)" }}>

          {/* Profile card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Personal Information</h2>
              <button
                id="profile-edit-btn"
                className={`btn btn-sm ${editing ? "btn-ghost" : "btn-outline"}`}
                onClick={() => setEditing(e => !e)}
              >
                {editing ? "Cancel" : "✏️ Edit"}
              </button>
            </div>

            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div className="profile-avatar" style={{ width: 72, height: 72, fontSize: "2rem" }}>
                {(form.name || user?.name || "U")[0].toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>{form.name || user?.name}</p>
                <span className="badge badge-primary" style={{ textTransform: "capitalize" }}>
                  {user?.role || "customer"}
                </span>
              </div>
            </div>

            {editing ? (
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    id="profile-name"
                    className="form-control"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    id="profile-email"
                    className="form-control"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    id="profile-phone"
                    className="form-control"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+233 XX XXX XXXX"
                  />
                </div>
                <button id="profile-save-btn" type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                  Save Changes
                </button>
              </form>
            ) : (
              <div>
                {[
                  { label: "Full Name",      val: form.name  || "—" },
                  { label: "Email",          val: form.email || "—" },
                  { label: "Phone",          val: form.phone || "—" },
                  { label: "Account Type",   val: user?.role || "Customer", cap: true },
                  { label: "Account Status", val: "Active", badge: "badge-success" },
                  { label: "Member Since",   val: "Aug 2026" },
                ].map(item => (
                  <div className="detail-row" key={item.label}>
                    <span className="detail-label">{item.label}</span>
                    {item.badge
                      ? <span className={`badge ${item.badge}`}>{item.val}</span>
                      : <span className="detail-val" style={item.cap ? { textTransform: "capitalize" } : {}}>{item.val}</span>
                    }
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">🔒 Security</h2>
            </div>
            <form onSubmit={handlePwSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  id="pw-current"
                  className="form-control"
                  type="password"
                  value={pwForm.current}
                  onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                  placeholder="Enter current password"
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  id="pw-new"
                  className="form-control"
                  type="password"
                  value={pwForm.next}
                  onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                  placeholder="At least 6 characters"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  id="pw-confirm"
                  className="form-control"
                  type="password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="Re-enter new password"
                />
              </div>
              {pwMsg && (
                <p style={{ fontSize: "0.84rem", color: pwMsg.startsWith("✅") ? "var(--clr-success)" : "var(--clr-danger)" }}>
                  {pwMsg}
                </p>
              )}
              <button id="pw-update-btn" type="submit" className="btn btn-outline" style={{ width: "100%" }}>
                Update Password
              </button>
            </form>
            <hr style={{ border: "none", borderTop: "1px solid var(--clr-border)", margin: "1.25rem 0" }} />
            <button
              id="profile-logout-btn"
              className="btn btn-danger"
              style={{ width: "100%" }}
              onClick={handleLogout}
            >
              🚪 Sign Out of Account
            </button>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-lg)" }}>
          {/* Shipment stats */}
          <div className="card">
            <div className="card-header"><h2 className="card-title">Shipment Summary</h2></div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {stats.map(s => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--clr-border)" }}>
                  <span className="text-muted text-sm">{s.label}</span>
                  <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Account settings */}
          <div className="card">
            <div className="card-header"><h2 className="card-title">Account Settings</h2></div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                { icon: "🔔", label: "Email Notifications",   sub: "Receive shipment updates by email" },
                { icon: "📱", label: "SMS Notifications",     sub: "Get delivery alerts via SMS" },
                { icon: "🌍", label: "Language",              sub: "English (Ghana)" },
                { icon: "🛡️", label: "Two-Factor Auth",       sub: "Enhance your account security" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid var(--clr-border)" }}>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: "0.88rem" }}>{item.label}</p>
                      <p className="text-xs text-faint">{item.sub}</p>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm">Configure</button>
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="card" style={{ border: "1px solid color-mix(in srgb, var(--clr-danger) 30%, transparent)" }}>
            <div className="card-header"><h2 className="card-title" style={{ color: "var(--clr-danger)" }}>⚠️ Danger Zone</h2></div>
            <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>
              These actions are irreversible. Please proceed with caution.
            </p>
            <button className="btn btn-danger btn-sm" style={{ width: "100%" }}>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
