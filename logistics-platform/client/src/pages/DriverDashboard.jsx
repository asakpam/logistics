import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { DriverPendingApproval } from "./DriverPendingApproval.jsx";

const DEMO_ASSIGNED = [
  {
    id: "TRK260808A1B2",
    trackingNumber: "TRK260808A1B2",
    from: "Accra Central Market",
    pickupAddress: "Accra Central Market, Accra",
    to: "East Legon, Accra",
    destinationAddress: "East Legon, Accra",
    customer: "Kofi Mensah",
    customerName: "Kofi Mensah",
    customerPhone: "+233 20 123 4567",
    phone: "+233 20 123 4567",
    packageType: "Electronics",
    type: "Electronics",
    weight: "2.4 kg",
    deliveryFee: 120,
    status: "In Transit",
    distance: "14.2 km",
    date: "Aug 8, 2026",
    eta: "Today, 4:30 PM",
    notes: "Handle with care. Fragile electronic items.",
  },
  {
    id: "TRK260805X3Y4",
    trackingNumber: "TRK260805X3Y4",
    from: "Takoradi Port",
    pickupAddress: "Takoradi Port, Western Region",
    to: "Tarkwa, W/R",
    destinationAddress: "Tarkwa, Western Region",
    customer: "Ama Owusu",
    customerName: "Ama Owusu",
    customerPhone: "+233 24 987 6543",
    phone: "+233 24 987 6543",
    packageType: "Documents",
    type: "Documents",
    weight: "0.3 kg",
    deliveryFee: 75,
    status: "Assigned",
    distance: "58.1 km",
    date: "Aug 5, 2026",
    eta: "Tomorrow",
    notes: "Deliver to main administration reception.",
  },
];

const DEMO_AVAILABLE = [
  {
    id: "TRK260808Q7R8",
    trackingNumber: "TRK260808Q7R8",
    from: "Accra Mall, Tetteh Quarshie",
    pickupAddress: "Accra Mall, Tetteh Quarshie",
    to: "Cape Coast Castle, Central",
    destinationAddress: "Cape Coast Castle, Central Region",
    customer: "Akua Frimpong",
    customerName: "Akua Frimpong",
    customerPhone: "+233 55 222 3333",
    phone: "+233 55 222 3333",
    packageType: "Food & Produce",
    type: "Food & Produce",
    weight: "1.2 kg",
    deliveryFee: 180,
    status: "Pending",
    distance: "145 km",
    date: "Today",
    eta: "Same day delivery requested",
    notes: "Express delivery requested. Keep perishable parcel chilled.",
  }
];

const STATUS_OPTIONS = ["Assigned", "Dispatched", "In Transit", "Out For Delivery", "Delivered"];

const STATUS_BADGE = {
  "Pending":          "badge-muted",
  "Assigned":         "badge-primary",
  "Dispatched":       "badge-primary",
  "In Transit":       "badge-primary",
  "Out For Delivery": "badge-warning",
  "Delivered":        "badge-success",
  "Cancelled":        "badge-danger",
};

export function DriverDashboard() {
  const { user } = useAuth();
  const { shipments: liveShipments, acceptShipment, updateStatus, loading: dataLoading } = useData();
  
  // Guard check: Pending or Rejected drivers cannot access operational driver features
  if (user?.role === "driver" && (user?.status === "pending" || user?.status === "rejected")) {
    return <DriverPendingApproval status={user.status} />;
  }

  // Active view: "assigned" deliveries vs "available" bookings
  const [activeTab, setActiveTab] = useState("assigned");

  // Separate live shipments into Assigned vs Available
  const hasLive = (liveShipments && liveShipments.length > 0);

  const assignedDeliveries = hasLive
    ? liveShipments.filter(s => s.status !== "Pending" || (s.driverId && s.driver !== "—"))
    : DEMO_ASSIGNED;

  const availableBookings = hasLive
    ? liveShipments.filter(s => s.status === "Pending" && (!s.driverId || s.driver === "—" || s.driverName === "—"))
    : DEMO_AVAILABLE;

  const currentList = activeTab === "assigned" ? assignedDeliveries : availableBookings;

  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [status, setStatus] = useState("Assigned");
  const [statusNote, setStatusNote] = useState("");
  const [tracking, setTracking] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Sync selected delivery when list changes or active tab switches
  useEffect(() => {
    if (currentList.length > 0) {
      // If current selected is in list, keep it; otherwise pick first
      const found = currentList.find(d => (d.id || d.trackingNumber) === (selectedDelivery?.id || selectedDelivery?.trackingNumber));
      const next = found || currentList[0];
      setSelectedDelivery(next);
      setStatus(next.status || "Assigned");
    } else {
      setSelectedDelivery(null);
    }
  }, [activeTab, liveShipments]);

  // Update status handler (persists to Supabase backend)
  const handleSaveStatus = async () => {
    if (!selectedDelivery) return;
    setActionLoading(true);
    setFeedbackMsg("");
    try {
      const id = selectedDelivery.id || selectedDelivery._id || selectedDelivery.trackingNumber;
      await updateStatus(id, status, statusNote);
      setFeedbackMsg("✓ Status updated successfully!");
      setSelectedDelivery(prev => prev ? { ...prev, status } : prev);
      setTimeout(() => setFeedbackMsg(""), 3500);
    } catch (err) {
      console.error("Save status error:", err);
      alert(err.response?.data?.message || err.message || "Failed to update shipment status");
    } finally {
      setActionLoading(false);
    }
  };

  // Accept available shipment handler (persists to Supabase backend)
  const handleAcceptShipment = async (shipment) => {
    if (!shipment) return;
    setActionLoading(true);
    setFeedbackMsg("");
    try {
      const id = shipment.id || shipment._id || shipment.trackingNumber;
      await acceptShipment(id);
      setFeedbackMsg(`✓ Booking ${shipment.trackingNumber || id} claimed! Switched to your Assigned Deliveries.`);
      setActiveTab("assigned");
      setTimeout(() => setFeedbackMsg(""), 4000);
    } catch (err) {
      console.error("Accept shipment error:", err);
      alert(err.response?.data?.message || err.message || "Failed to claim booking");
    } finally {
      setActionLoading(false);
    }
  };

  const completedCount = assignedDeliveries.filter(s => s.status === "Delivered").length;
  const inProgressCount = assignedDeliveries.filter(s => ["In Transit", "Out For Delivery", "Dispatched", "Assigned"].includes(s.status)).length;

  const stats = [
    { label: "Active Assigned",  value: inProgressCount,          icon: "🚚", color: "var(--clr-primary)" },
    { label: "Available Requests", value: availableBookings.length, icon: "📦", color: "var(--clr-warning)" },
    { label: "Completed",        value: completedCount,           icon: "✅", color: "var(--clr-success)" },
    { label: "Rating",           value: "4.9 ★",                  icon: "⭐", color: "#f59e0b" },
  ];

  return (
    <div className="dashboard-page">
      {/* ── Header ── */}
      <div className="dashboard-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="dashboard-title">
            Driver Dashboard{" "}
            <span className="gradient-text">{user?.name?.split(" ")[0] ?? "Driver"}</span> 🚚
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            Accept customer bookings, navigate routes, and update delivery statuses in real-time.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            id="toggle-tracking-btn"
            className={`btn ${tracking ? "btn-danger" : "btn-success"}`}
            onClick={() => setTracking((t) => !t)}
          >
            {tracking ? "⏹ Stop GPS Tracking" : "📍 Go Live (GPS)"}
          </button>
        </div>
      </div>

      {tracking && (
        <div className="alert alert-info" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.2rem" }}>📡</span>
          <span>Live GPS tracking is <strong>active</strong> — your location is being broadcast to customers and logistics dispatch.</span>
        </div>
      )}

      {feedbackMsg && (
        <div style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid var(--clr-success)", color: "var(--clr-success)", borderRadius: "var(--r-md)", padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.9rem", fontWeight: 600 }}>
          {feedbackMsg}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="stats-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── View Toggle Tabs ── */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", borderBottom: "1px solid var(--clr-border)", paddingBottom: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <button
          className={`dash-tab${activeTab === "assigned" ? " active" : ""}`}
          onClick={() => setActiveTab("assigned")}
          id="driver-tab-assigned"
          style={{ padding: "0.5rem 1rem", fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <span>🚚 Assigned Deliveries</span>
          <span className="tab-badge">{assignedDeliveries.length}</span>
        </button>
        <button
          className={`dash-tab${activeTab === "available" ? " active" : ""}`}
          onClick={() => setActiveTab("available")}
          id="driver-tab-available"
          style={{ padding: "0.5rem 1rem", fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <span>📦 Available Bookings</span>
          <span className="tab-badge" style={{ background: availableBookings.length > 0 ? "var(--clr-success)" : undefined, color: availableBookings.length > 0 ? "#fff" : undefined }}>
            {availableBookings.length}
          </span>
        </button>
        <span className="text-xs text-muted" style={{ marginLeft: "auto" }}>
          {activeTab === "assigned" ? "Deliveries assigned to you" : "Customer requests open for delivery acceptance"}
        </span>
      </div>

      {/* ── Main Grid ── */}
      <div className="dashboard-grid">
        {/* ── Shipment List (Left Column) ── */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              {activeTab === "assigned" ? "Your Deliveries" : "Available Requests"}
            </h2>
            <span className="badge badge-primary">{currentList.length}</span>
          </div>

          <div className="shipment-list">
            {currentList.length === 0 ? (
              <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--clr-text-muted)" }}>
                <p style={{ fontSize: "2rem", margin: "0 0 0.5rem 0" }}>📭</p>
                <p style={{ fontSize: "0.9rem", margin: 0 }}>
                  {activeTab === "assigned"
                    ? "No deliveries currently assigned to you."
                    : "No new customer bookings available right now."}
                </p>
              </div>
            ) : (
              currentList.map((d) => {
                const trk = d.trackingNumber || d.id;
                const isSelected = (selectedDelivery?.id || selectedDelivery?.trackingNumber) === trk;
                return (
                  <div
                    key={trk}
                    id={`shipment-row-${trk}`}
                    className={`shipment-row${isSelected ? " selected" : ""}`}
                    onClick={() => {
                      setSelectedDelivery(d);
                      setStatus(d.status || "Assigned");
                      setStatusNote("");
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="shipment-row-icon">
                      {activeTab === "assigned" ? "🚚" : "📦"}
                    </div>
                    <div className="shipment-row-body">
                      <div className="shipment-row-top">
                        <span className="shipment-trk">{trk}</span>
                        <span className={`badge ${STATUS_BADGE[d.status] || "badge-muted"}`}>
                          {d.status}
                        </span>
                      </div>
                      <div className="shipment-route">
                        {d.from || d.pickupAddress} <span className="route-arrow">→</span> {d.to || d.destinationAddress}
                      </div>
                      <div className="shipment-meta-row">
                        <span className="text-xs text-faint">
                          {d.packageType || d.type || "Standard"} {d.weight ? `· ${d.weight}` : ""}
                        </span>
                        {d.deliveryFee ? (
                          <span className="text-xs" style={{ color: "var(--clr-success)", fontWeight: 700 }}>
                            GH₵ {Number(d.deliveryFee).toFixed(2)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Delivery Detail & Actions (Right Column) ── */}
        <div className="card" style={{ gridColumn: "span 2" }}>
          {selectedDelivery ? (
            <>
              <div className="card-header" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <h2 className="card-title">
                    {activeTab === "assigned" ? "Delivery Details & Controls" : "Booking Request Details"}
                  </h2>
                  <span className="text-xs text-muted">
                    Reference: <code className="trk-code">{selectedDelivery.trackingNumber || selectedDelivery.id}</code>
                  </span>
                </div>
                <span className={`badge ${STATUS_BADGE[selectedDelivery.status] || "badge-muted"}`}>
                  {selectedDelivery.status}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "1.5rem" }}>
                {/* Information Column */}
                <div>
                  {/* Customer Information (Necessary for delivery) */}
                  <div style={{ background: "var(--clr-bg-2)", border: "1px solid var(--clr-border)", borderRadius: "var(--r-md)", padding: "0.85rem", marginBottom: "1rem" }}>
                    <div className="text-xs text-faint" style={{ marginBottom: "0.4rem", fontWeight: 700, color: "var(--clr-primary)" }}>
                      👤 CUSTOMER CONTACT
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.88rem" }}>
                      <div>
                        <span className="text-xs text-muted" style={{ display: "block" }}>Name</span>
                        <strong>{selectedDelivery.customerName || selectedDelivery.customer || "Customer"}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-muted" style={{ display: "block" }}>Phone Number</span>
                        {(selectedDelivery.customerPhone || selectedDelivery.phone) ? (
                          <a
                            href={`tel:${selectedDelivery.customerPhone || selectedDelivery.phone}`}
                            style={{ color: "var(--clr-primary)", fontWeight: 600 }}
                          >
                            📞 {selectedDelivery.customerPhone || selectedDelivery.phone}
                          </a>
                        ) : (
                          <span className="text-muted">Not provided</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Route & Delivery Details */}
                  <div className="detail-row">
                    <span className="detail-label">Pickup Location</span>
                    <span className="detail-val">{selectedDelivery.pickupAddress || selectedDelivery.from}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Destination</span>
                    <span className="detail-val">{selectedDelivery.destinationAddress || selectedDelivery.to}</span>
                  </div>
                  {selectedDelivery.receiverName && (
                    <div className="detail-row">
                      <span className="detail-label">Recipient</span>
                      <span className="detail-val">
                        {selectedDelivery.receiverName} {selectedDelivery.receiverPhone ? `(${selectedDelivery.receiverPhone})` : ""}
                      </span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Package Type</span>
                    <span className="detail-val">{selectedDelivery.packageType || selectedDelivery.type || "Standard"}</span>
                  </div>
                  {selectedDelivery.weight && (
                    <div className="detail-row">
                      <span className="detail-label">Weight</span>
                      <span className="detail-val">{selectedDelivery.weight}</span>
                    </div>
                  )}
                  {selectedDelivery.deliveryFee !== undefined && (
                    <div className="detail-row">
                      <span className="detail-label">Delivery Fee</span>
                      <span className="detail-val" style={{ color: "var(--clr-success)", fontWeight: 700 }}>
                        GH₵ {Number(selectedDelivery.deliveryFee).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Booking Date</span>
                    <span className="detail-val">{selectedDelivery.date || "Today"}</span>
                  </div>
                  {selectedDelivery.eta && (
                    <div className="detail-row">
                      <span className="detail-label">Estimated ETA</span>
                      <span className="detail-val">{selectedDelivery.eta}</span>
                    </div>
                  )}
                  {selectedDelivery.notes && (
                    <div className="detail-row" style={{ alignItems: "flex-start" }}>
                      <span className="detail-label">Instructions</span>
                      <span className="detail-val text-xs text-muted" style={{ fontStyle: "italic" }}>
                        {selectedDelivery.notes}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action / Control Column */}
                <div>
                  {activeTab === "available" ? (
                    /* Accept Booking View */
                    <div style={{ background: "var(--clr-bg-2)", border: "1px solid var(--clr-border)", borderRadius: "var(--r-md)", padding: "1.25rem", textAlign: "center", display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <span style={{ fontSize: "2.5rem" }}>📦</span>
                      <div>
                        <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1.1rem", fontFamily: "var(--font-display)" }}>
                          Claim This Delivery
                        </h3>
                        <p className="text-xs text-muted" style={{ margin: 0 }}>
                          Accepting will assign this booking to you and move it to your active deliveries.
                        </p>
                      </div>
                      <button
                        id="accept-booking-btn"
                        className="btn btn-primary"
                        style={{ width: "100%", padding: "0.85rem", fontSize: "0.95rem" }}
                        disabled={actionLoading}
                        onClick={() => handleAcceptShipment(selectedDelivery)}
                      >
                        {actionLoading ? "Accepting…" : "✓ Accept Delivery"}
                      </button>
                    </div>
                  ) : (
                    /* Update Delivery Status View */
                    <div style={{ background: "var(--clr-bg-2)", border: "1px solid var(--clr-border)", borderRadius: "var(--r-md)", padding: "1.1rem" }}>
                      <p className="form-label" style={{ marginBottom: "0.75rem", fontWeight: 700 }}>
                        Update Delivery Status
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginBottom: "1rem" }}>
                        {STATUS_OPTIONS.map((opt) => (
                          <label
                            key={opt}
                            className={`status-option${status === opt ? " active" : ""}`}
                            style={{ cursor: "pointer", padding: "0.45rem 0.75rem" }}
                          >
                            <input
                              type="radio"
                              name="delivery-status"
                              value={opt}
                              checked={status === opt}
                              onChange={() => setStatus(opt)}
                              style={{ display: "none" }}
                            />
                            <span className="status-dot" />
                            {opt}
                          </label>
                        ))}
                      </div>

                      <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                        <label className="form-label" style={{ fontSize: "0.78rem" }}>Status Update Note (Optional)</label>
                        <input
                          className="form-control"
                          style={{ fontSize: "0.82rem", padding: "0.4rem 0.6rem" }}
                          placeholder="e.g. Arrived at pickup / Package handed over"
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                        />
                      </div>

                      <button
                        id="save-status-btn"
                        className="btn btn-primary"
                        style={{ width: "100%" }}
                        disabled={actionLoading}
                        onClick={handleSaveStatus}
                      >
                        {actionLoading ? "Saving…" : "Save Status"}
                      </button>

                      <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--clr-border)", display: "flex", gap: "0.5rem" }}>
                        <Link
                          to={`/driver/delivery/${selectedDelivery.trackingNumber || selectedDelivery.id}`}
                          className="btn btn-sm btn-ghost"
                          style={{ flex: 1, textAlign: "center", fontSize: "0.78rem" }}
                        >
                          📋 Full Details
                        </Link>
                        <Link
                          to={`/driver/confirm/${selectedDelivery.trackingNumber || selectedDelivery.id}`}
                          className="btn btn-sm btn-ghost"
                          style={{ flex: 1, textAlign: "center", fontSize: "0.78rem" }}
                        >
                          ✍️ Proof / Confirm
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Map Guidance Card */}
              <div className="map-placeholder" style={{ marginTop: "1.25rem" }}>
                <div className="map-placeholder-inner">
                  <span style={{ fontSize: "1.8rem" }}>🗺️</span>
                  <p style={{ margin: "0.25rem 0", fontWeight: 600 }}>Destination: {selectedDelivery.destinationAddress || selectedDelivery.to}</p>
                  <p className="text-xs text-faint">
                    <Link to="/driver/gps" style={{ color: "var(--clr-primary)", textDecoration: "underline" }}>
                      Open GPS Navigation & Live Route →
                    </Link>
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--clr-text-muted)" }}>
              <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem 0" }}>🚚</p>
              <p>Select a shipment from the list to view details and update its delivery status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
