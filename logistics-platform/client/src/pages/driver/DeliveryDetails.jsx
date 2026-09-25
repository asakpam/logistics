import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useData } from "../../context/DataContext.jsx";

const DEMO_DATA = {
  "TRK260808A1B2": {
    trackingNumber: "TRK260808A1B2",
    customer: "Kofi Mensah",
    phone: "+233 20 123 4567",
    email: "kofi@example.com",
    from: "Accra Central Market, Circle",
    to: "East Legon, Accra (House 14, Boundary Rd)",
    packageType: "Electronics",
    weight: "2.4 kg",
    status: "In Transit",
    distance: "14.2 km",
    eta: "Today, 4:30 PM",
    instructions: "Handle with care. Call customer on arrival. Do not leave unattended.",
    pickedAt: "08:30 AM",
    notes: "Fragile — laptop inside.",
  },
  "TRK260805X3Y4": {
    trackingNumber: "TRK260805X3Y4",
    customer: "Ama Owusu",
    phone: "+233 24 987 6543",
    email: "ama@example.com",
    from: "Takoradi Port, Sekondi-Takoradi",
    to: "Tarkwa, W/R — Goldfields Reception",
    packageType: "Documents",
    weight: "0.3 kg",
    status: "Assigned",
    distance: "58.1 km",
    eta: "Aug 24, 2026 · 2:00 PM",
    instructions: "Deliver to reception desk. Signature required. Do not fold.",
    pickedAt: "—",
    notes: "Legal documents — signature required.",
  },
};

const STATUS_OPTIONS = ["Assigned", "Dispatched", "In Transit", "Out For Delivery", "Delivered"];

const STATUS_COLOR = {
  "Assigned": "badge-muted", "Dispatched": "badge-primary", "In Transit": "badge-primary",
  "Out For Delivery": "badge-warning", "Delivered": "badge-success",
};

export function DeliveryDetails() {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  const { shipments, updateStatus } = useData();

  const live = shipments?.find(s => (s.trackingNumber || s.id) === trackingNumber);
  const shipment = live ? {
    trackingNumber: live.trackingNumber || live.id,
    customer: live.customerName || live.customer || "Customer",
    phone: live.customerPhone || live.phone || "—",
    email: live.customerEmail || live.email || "—",
    from: live.pickupAddress || live.from || "—",
    to: live.destinationAddress || live.to || "—",
    packageType: live.packageType || live.type || "Standard",
    weight: live.weight ? `${live.weight} kg` : "—",
    status: live.status,
    distance: live.distance || "—",
    eta: live.eta || live.date || "Today",
    instructions: live.notes || "Standard handling. Call recipient on arrival.",
    pickedAt: live.date || "—",
    notes: live.notes || "",
  } : (DEMO_DATA[trackingNumber] || Object.values(DEMO_DATA)[0]);

  const [status, setStatus] = useState(shipment.status);
  const [saved, setSaved]   = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (shipment?.status) setStatus(shipment.status);
  }, [shipment?.status]);

  async function handleSave() {
    try {
      if (live) {
        await updateStatus(live.id || live._id || live.trackingNumber, status);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Failed to update status");
    }
  }

  async function handleConfirm() {
    try {
      setStatus("Delivered");
      if (live) {
        await updateStatus(live.id || live._id || live.trackingNumber, "Delivered");
      }
      setConfirmed(true);
      setTimeout(() => navigate(`/driver/confirm/${shipment.trackingNumber}`), 1500);
    } catch {
      alert("Failed to confirm delivery");
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Delivery <span className="gradient-text">Details</span>
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            Full information for shipment <code style={{ color: "var(--clr-primary)" }}>{shipment.trackingNumber}</code>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span className={`badge ${STATUS_COLOR[status] || "badge-muted"}`} style={{ fontSize: "0.9rem", padding: "0.5rem 1rem" }}>
            {status}
          </span>
          <Link to="/driver/shipments" className="btn btn-ghost btn-sm">← All Shipments</Link>
        </div>
      </div>

      <div className="dash-grid-2">
        {/* Shipment + customer info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-lg)" }}>
          <div className="card">
            <div className="card-header"><h2 className="card-title">Shipment Information</h2></div>
            {[
              { label: "Tracking No.",  val: shipment.trackingNumber, code: true },
              { label: "Customer",      val: shipment.customer },
              { label: "Phone",         val: shipment.phone, phone: true },
              { label: "Email",         val: shipment.email },
              { label: "Package",       val: `${shipment.packageType} · ${shipment.weight}` },
              { label: "Pickup",        val: shipment.from },
              { label: "Destination",   val: shipment.to },
              { label: "Distance",      val: shipment.distance },
              { label: "ETA",           val: shipment.eta, highlight: true },
              { label: "Picked Up At",  val: shipment.pickedAt },
            ].map(item => (
              <div className="detail-row" key={item.label}>
                <span className="detail-label">{item.label}</span>
                {item.code
                  ? <code style={{ fontSize: "0.82rem", color: "var(--clr-primary)" }}>{item.val}</code>
                  : item.phone
                  ? <a href={`tel:${item.val}`} style={{ color: "var(--clr-primary)", fontWeight: 500 }}>{item.val}</a>
                  : <span className="detail-val" style={item.highlight ? { color: "var(--clr-primary)", fontWeight: 700 } : {}}>{item.val}</span>
                }
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="card">
            <div className="card-header"><h2 className="card-title">📋 Delivery Instructions</h2></div>
            <div style={{ background: "var(--clr-surface-2)", borderRadius: "var(--r-md)", padding: "1rem", border: "1px solid var(--clr-border)" }}>
              <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{shipment.instructions}</p>
            </div>
            {shipment.notes && (
              <div style={{ background: "color-mix(in srgb, var(--clr-warning) 10%, transparent)", borderRadius: "var(--r-md)", padding: "0.75rem 1rem", border: "1px solid color-mix(in srgb, var(--clr-warning) 30%, transparent)", marginTop: "0.75rem" }}>
                <p className="text-xs text-muted" style={{ marginBottom: "0.2rem" }}>⚠️ Note</p>
                <p style={{ fontSize: "0.85rem" }}>{shipment.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status update + map */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-lg)" }}>
          <div className="card">
            <div className="card-header"><h2 className="card-title">Update Status</h2></div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
              {STATUS_OPTIONS.map(opt => (
                <label key={opt} className={`status-option${status === opt ? " active" : ""}`} style={{ cursor: "pointer" }}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                id="save-status-btn"
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={handleSave}
              >
                {saved ? "✅ Saved!" : "Save Status"}
              </button>
              {status === "Out For Delivery" || status === "Delivered" ? (
                <button
                  id="confirm-delivery-btn"
                  className="btn btn-success"
                  style={{ width: "100%" }}
                  onClick={handleConfirm}
                  disabled={confirmed}
                >
                  {confirmed ? "✅ Confirmed — Redirecting…" : "🎉 Confirm Delivery"}
                </button>
              ) : null}
            </div>
          </div>

          {/* Map placeholder */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <h2 className="card-title">Navigation</h2>
              <span className="badge badge-success" style={{ fontSize: "0.75rem" }}>● GPS Active</span>
            </div>
            <div className="map-placeholder" style={{ minHeight: 220 }}>
              <div className="map-placeholder-inner">
                <span style={{ fontSize: "2.5rem" }}>🗺️</span>
                <p style={{ fontWeight: 600 }}>Live Navigation</p>
                <p className="text-xs text-faint">Connect Google Maps API for turn-by-turn navigation.</p>
                <p className="text-xs text-faint" style={{ marginTop: "0.25rem" }}>Destination: {shipment.to}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
