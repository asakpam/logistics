import { useState } from "react";

const DEMO_NOTIFICATIONS = [
  { id: 1, icon: "📦", type: "shipment", category: "Shipment", title: "Shipment Registered",    text: "Shipment TRK260808Q7R8 has been booked successfully.", time: "4h ago",  read: false, tracking: "TRK260808Q7R8" },
  { id: 2, icon: "🚚", type: "transit",  category: "Delivery",  title: "In Transit",             text: "TRK260808A1B2 is now In Transit — heading to Kumasi.", time: "6h ago",  read: false, tracking: "TRK260808A1B2" },
  { id: 3, icon: "📍", type: "pickup",   category: "Delivery",  title: "Driver Out for Delivery", text: "TRK260805X3Y4 is out for delivery. Expected by 5 PM.", time: "1d ago",  read: false, tracking: "TRK260805X3Y4" },
  { id: 4, icon: "👤", type: "assigned", category: "Shipment", title: "Driver Assigned",         text: "Driver Emmanuel Adu has been assigned to TRK260808A1B2.", time: "1d ago", read: true,  tracking: "TRK260808A1B2" },
  { id: 5, icon: "✅", type: "delivered",category: "Delivery",  title: "Delivered",              text: "TRK260801Z5W6 has been delivered successfully to Tamale.", time: "5d ago", read: true, tracking: "TRK260801Z5W6" },
  { id: 6, icon: "✅", type: "delivered",category: "Delivery",  title: "Delivered",              text: "TRK260802K9L0 has been delivered successfully to Sunyani.", time: "6d ago",read: true, tracking: "TRK260802K9L0" },
  { id: 7, icon: "⚠️", type: "delay",    category: "Shipment", title: "Slight Delay",           text: "TRK260802K9L0 experienced a minor delay in Kumasi due to traffic.", time: "6d ago", read: true, tracking: "TRK260802K9L0" },
  { id: 8, icon: "💬", type: "sms",      category: "SMS",       title: "SMS Sent",              text: "An SMS notification was sent to your registered number for TRK260808Q7R8.", time: "4h ago", read: true, tracking: "TRK260808Q7R8" },
];

const TABS = ["All", "Shipment", "Delivery", "SMS"];

export function Notifications() {
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState("All");

  const filtered = notifications.filter(n =>
    activeTab === "All" || n.category === activeTab
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function markRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  function deleteNotif(id) {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab] = tab === "All"
      ? notifications.filter(n => !n.read).length
      : notifications.filter(n => n.category === tab && !n.read).length;
    return acc;
  }, {});

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            <span className="gradient-text">Notifications</span> 🔔
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            Stay updated on your shipment events and alerts.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {unreadCount > 0 && (
            <span className="badge badge-primary">{unreadCount} unread</span>
          )}
          <button
            id="mark-all-read-btn"
            className="btn btn-ghost btn-sm"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            ✓ Mark all read
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="dash-tabs" style={{ marginBottom: "1.25rem" }}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={`dash-tab${activeTab === tab ? " active" : ""}`}
            onClick={() => setActiveTab(tab)}
            id={`notif-tab-${tab.toLowerCase()}`}
          >
            {tab}
            {tabCounts[tab] > 0 && (
              <span className="tab-badge">{tabCounts[tab]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
            {activeTab !== "All" ? ` · ${activeTab}` : ""}
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔕</div>
            <h3 style={{ marginBottom: "0.5rem" }}>No notifications</h3>
            <p className="text-muted">You're all caught up!</p>
          </div>
        ) : (
          <div className="notif-list">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`notif-item${n.read ? " read" : ""}`}
                onClick={() => markRead(n.id)}
                style={{ cursor: "pointer", position: "relative" }}
              >
                <span className="notif-icon">{n.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.2rem" }}>
                    <p style={{ fontWeight: n.read ? 500 : 700, fontSize: "0.88rem", color: "var(--clr-text)" }}>
                      {n.title}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                      <span className="text-xs text-faint">{n.time}</span>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "0.1rem 0.4rem", fontSize: "0.75rem", minHeight: "auto" }}
                        onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
                        title="Dismiss"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <p className="notif-text">{n.text}</p>
                  <div style={{ marginTop: "0.4rem" }}>
                    <span style={{ background: "var(--clr-surface-2)", border: "1px solid var(--clr-border)", borderRadius: "var(--r-full)", padding: "0.15rem 0.6rem", fontSize: "0.72rem", color: "var(--clr-text-muted)" }}>
                      {n.category}
                    </span>
                  </div>
                </div>
                {!n.read && <span className="notif-dot" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
