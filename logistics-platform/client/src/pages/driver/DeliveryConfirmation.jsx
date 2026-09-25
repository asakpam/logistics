import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const DEMO_DATA = {
  "TRK260808A1B2": {
    trackingNumber: "TRK260808A1B2",
    customer: "Kofi Mensah",
    phone: "+233 20 123 4567",
    from: "Accra Central Market",
    to: "East Legon, Accra (House 14, Boundary Rd)",
    packageType: "Electronics",
    weight: "2.4 kg",
    deliveredAt: new Date().toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
  },
};

export function DeliveryConfirmation() {
  const { trackingNumber } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confirmed, setConfirmed]   = useState(false);
  const [confirming, setConfirming] = useState(false);

  const shipment = DEMO_DATA[trackingNumber] || {
    trackingNumber: trackingNumber || "TRK260808A1B2",
    customer: "Customer",
    phone: "—",
    from: "Pickup Address",
    to: "Destination Address",
    packageType: "Package",
    weight: "—",
    deliveredAt: new Date().toLocaleString(),
  };

  function handleConfirm() {
    setConfirming(true);
    setTimeout(() => {
      setConfirmed(true);
      setConfirming(false);
    }, 1500);
  }

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 540 }}>
        {!confirmed ? (
          <>
            {/* Pre-confirmation */}
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem" }}>📦</div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.75rem" }}>
                Confirm Delivery
              </h1>
              <p className="text-muted" style={{ marginTop: "0.5rem" }}>
                Please verify the delivery details before confirming.
              </p>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Shipment Summary</h2>
                <span className="badge badge-warning">Pending Confirmation</span>
              </div>

              {[
                { label: "Tracking No.", val: shipment.trackingNumber, code: true },
                { label: "Customer",     val: shipment.customer },
                { label: "Phone",        val: shipment.phone },
                { label: "Pickup",       val: shipment.from },
                { label: "Destination",  val: shipment.to },
                { label: "Package",      val: `${shipment.packageType} · ${shipment.weight}` },
                { label: "Delivered At", val: shipment.deliveredAt, highlight: true },
                { label: "Driver",       val: user?.name || "—" },
              ].map(item => (
                <div className="detail-row" key={item.label}>
                  <span className="detail-label">{item.label}</span>
                  {item.code
                    ? <code style={{ fontSize: "0.82rem", color: "var(--clr-primary)" }}>{item.val}</code>
                    : <span className="detail-val" style={item.highlight ? { color: "var(--clr-success)", fontWeight: 700 } : {}}>{item.val}</span>
                  }
                </div>
              ))}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  id="cancel-confirm-btn"
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => navigate(`/driver/delivery/${shipment.trackingNumber}`)}
                >
                  ← Go Back
                </button>
                <button
                  id="confirm-delivery-final-btn"
                  className="btn btn-success"
                  style={{ flex: 2 }}
                  onClick={handleConfirm}
                  disabled={confirming}
                >
                  {confirming ? "Confirming…" : "✅ Confirm Delivery"}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Success state */
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "5rem", marginBottom: "1rem", animation: "fadeIn 0.5s ease" }}>🎉</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "2rem", marginBottom: "0.5rem" }}>
              Delivery Confirmed!
            </h1>
            <p className="text-muted" style={{ marginBottom: "2rem" }}>
              Package successfully delivered to <strong>{shipment.customer}</strong> at <strong>{shipment.to}</strong>.
            </p>

            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span className="text-muted text-sm">Tracking Number</span>
                <code style={{ color: "var(--clr-primary)" }}>{shipment.trackingNumber}</code>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span className="text-muted text-sm">Delivered At</span>
                <span style={{ color: "var(--clr-success)", fontWeight: 700 }}>{shipment.deliveredAt}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="text-muted text-sm">Status</span>
                <span className="badge badge-success">✅ Delivered</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link to="/driver/shipments" className="btn btn-primary" style={{ justifyContent: "center" }}>
                View All Shipments →
              </Link>
              <Link to="/dashboard/driver" className="btn btn-ghost" style={{ justifyContent: "center" }}>
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
