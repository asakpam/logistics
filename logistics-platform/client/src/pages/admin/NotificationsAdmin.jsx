import { useState } from "react";
import { Link } from "react-router-dom";

const DEMO_NOTIFS = [
  { _id:"n1", type:"📦", category:"Shipment",  recipient:"Kofi Mensah",   shipment:"TRK260808A1B2", channel:"Email+SMS", message:"Shipment registered",    status:"Delivered", ts:"Aug 8 · 08:05 AM" },
  { _id:"n2", type:"👤", category:"Assigned",  recipient:"Kofi Mensah",   shipment:"TRK260808A1B2", channel:"Push+SMS",  message:"Driver assigned",         status:"Delivered", ts:"Aug 8 · 08:15 AM" },
  { _id:"n3", type:"🚚", category:"Transit",   recipient:"Ama Owusu",     shipment:"TRK260805X3Y4", channel:"Push",      message:"In Transit",               status:"Delivered", ts:"Aug 5 · 09:30 AM" },
  { _id:"n4", type:"📍", category:"Delivery",  recipient:"Ama Owusu",     shipment:"TRK260805X3Y4", channel:"SMS",       message:"Out for delivery",         status:"Delivered", ts:"Aug 5 · 01:00 PM" },
  { _id:"n5", type:"✅", category:"Delivered", recipient:"Yaw Darko",     shipment:"TRK260801Z5W6", channel:"Email+SMS", message:"Package delivered",        status:"Delivered", ts:"Aug 3 · 02:11 PM" },
  { _id:"n6", type:"⚠️", category:"Delay",    recipient:"Kwame Boateng", shipment:"TRK260802K9L0", channel:"Push+SMS",  message:"Slight delay in Kumasi",   status:"Delivered", ts:"Aug 2 · 11:40 AM" },
  { _id:"n7", type:"📦", category:"Shipment",  recipient:"Abena Asante",  shipment:"TRK260808Q7R8", channel:"Email",     message:"Shipment registered",      status:"Delivered", ts:"Aug 8 · 10:02 AM" },
  { _id:"n8", type:"🔔", category:"System",    recipient:"All Customers", shipment:"—",             channel:"Email",     message:"Platform maintenance Aug 10",status:"Delivered",ts:"Aug 7 · 09:00 AM" },
];

const CATEGORIES = ["All","Shipment","Assigned","Transit","Delivery","Delivered","Delay","System"];
const CHANNELS   = ["All","Email","SMS","Push","Email+SMS","Push+SMS"];

export function NotificationsAdmin() {
  const [catFilter, setCatFilter]  = useState("All");
  const [chanFilter, setChanFilter]= useState("All");
  const [search, setSearch]        = useState("");

  const filtered = DEMO_NOTIFS.filter(n => {
    const matchCat  = catFilter  === "All" || n.category === catFilter;
    const matchChan = chanFilter === "All" || n.channel === chanFilter;
    const term      = search.toLowerCase();
    const matchSearch = n.recipient.toLowerCase().includes(term) || n.shipment.toLowerCase().includes(term) || n.message.toLowerCase().includes(term);
    return matchCat && matchChan && matchSearch;
  });

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Notifications <span className="gradient-text">Management</span>
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            View and manage all outbound notifications sent to customers and drivers.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/dashboard/admin" className="btn btn-ghost btn-sm">← Admin</Link>
          <button className="btn btn-outline btn-sm" onClick={() => alert("Send custom notification — wire to backend")}>
            + Send Notification
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: "Total Sent",      value: DEMO_NOTIFS.length,                                    icon: "📤", color: "var(--clr-primary)" },
          { label: "Email",           value: DEMO_NOTIFS.filter(n => n.channel.includes("Email")).length, icon: "📧", color: "#6366f1" },
          { label: "SMS",             value: DEMO_NOTIFS.filter(n => n.channel.includes("SMS")).length,   icon: "📱", color: "var(--clr-warning)" },
          { label: "Push",            value: DEMO_NOTIFS.filter(n => n.channel.includes("Push")).length,  icon: "🔔", color: "var(--clr-success)" },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {CATEGORIES.map(c => (
            <button key={c} className={`tab-pill${catFilter === c ? " active" : ""}`} onClick={() => setCatFilter(c)} style={{ fontSize: "0.78rem" }}>{c}</button>
          ))}
        </div>
        <select className="form-control search-sm" value={chanFilter} onChange={e => setChanFilter(e.target.value)} style={{ maxWidth: 140 }}>
          {CHANNELS.map(c => <option key={c} value={c}>{c === "All" ? "All Channels" : c}</option>)}
        </select>
        <input
          id="notif-admin-search"
          className="form-control search-sm"
          placeholder="Search recipient, shipment…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 240 }}
        />
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{filtered.length} notification{filtered.length !== 1 ? "s" : ""}</h2>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Category</th>
                <th>Recipient</th>
                <th>Shipment</th>
                <th>Message</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:"center", padding:"2rem", color:"var(--clr-text-faint)" }}>No notifications found.</td></tr>
              ) : filtered.map(n => (
                <tr key={n._id}>
                  <td style={{ fontSize:"1.2rem" }}>{n.type}</td>
                  <td><span className="badge badge-muted" style={{ fontSize:"0.72rem" }}>{n.category}</span></td>
                  <td style={{ fontWeight:600, fontSize:"0.88rem" }}>{n.recipient}</td>
                  <td><code style={{ fontSize:"0.76rem", color:"var(--clr-primary)" }}>{n.shipment}</code></td>
                  <td className="text-sm text-muted">{n.message}</td>
                  <td className="text-xs">{n.channel}</td>
                  <td><span className="badge badge-success" style={{ fontSize:"0.72rem" }}>✓ {n.status}</span></td>
                  <td className="text-xs text-faint">{n.ts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
