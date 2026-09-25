import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";

const PACKAGE_TYPES = [
  "Documents",
  "Electronics",
  "Clothing",
  "Food & Perishables",
  "Fragile / Glassware",
  "Furniture",
  "Machinery / Equipment",
  "Other",
];

const GHANA_CITIES = [
  "Accra", "Kumasi", "Tamale", "Takoradi", "Cape Coast",
  "Sunyani", "Koforidua", "Ho", "Wa", "Bolgatanga",
  "Tema", "Tarkwa", "Obuasi", "Techiman", "Nkawkaw",
];

function StepIndicator({ step, labels }) {
  return (
    <div className="step-indicator">
      {labels.map((label, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <div key={label} className="step-item">
            <div className={`step-circle ${done ? "done" : active ? "active" : ""}`}>
              {done ? "✓" : idx}
            </div>
            <span className={`step-label ${active ? "active-label" : done ? "done-label" : ""}`}>{label}</span>
            {i < labels.length - 1 && <div className={`step-line ${done ? "done" : ""}`} />}
          </div>
        );
      })}
    </div>
  );
}

export function CreateShipment() {
  const { user } = useAuth();
  const { createShipment } = useData();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    pickupAddress: "",
    pickupCity: "",
    destinationAddress: "",
    destinationCity: "",
    receiverName: "",
    receiverPhone: "",
    packageType: "",
    weight: "",
    deliveryFee: "",
    pickupDate: "",
    notes: "",
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function nextStep() {
    setStep((s) => Math.min(s + 1, 3));
  }
  function prevStep() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const shipment = await createShipment(form);
      setResult(shipment);
      setStep(4); // success
    } catch (err) {
      setError(err.message || "Failed to create shipment. Please try again.");
      setStep(4);
    } finally {
      setLoading(false);
    }
  }

  const stepLabels = ["Sender & Receiver", "Package Details", "Review & Confirm"];

  // ── Success State ──────────────────────────────────────────────
  if (step === 4 && result) {
    return (
      <div className="create-shipment-page">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h1 className="success-title">Shipment Created!</h1>
          <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
            Your shipment has been successfully booked and is awaiting driver assignment.
          </p>
          <div className="trk-display">
            <span className="text-muted text-sm">Tracking Number</span>
            <span className="trk-big">{result.trackingNumber}</span>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/track/${result.trackingNumber}`)}
            >
              Track Shipment →
            </button>
            <button
              className="btn btn-outline"
              onClick={() => { setStep(1); setResult(null); setForm({ pickupAddress:"", pickupCity:"", destinationAddress:"", destinationCity:"", receiverName:"", receiverPhone:"", packageType:"", weight:"", deliveryFee:"", pickupDate:"", notes:"" }); }}
            >
              Create Another
            </button>
            <button className="btn btn-ghost" onClick={() => navigate("/dashboard/customer")}>
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-shipment-page">
      <div className="create-shipment-container">
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 className="dashboard-title">
            Create <span className="gradient-text">Shipment</span>
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            Fill in the shipment details below to book a delivery.
          </p>
        </div>

        <StepIndicator step={step} labels={stepLabels} />

        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
          {/* ── Step 1: Sender & Receiver ── */}
          {step === 1 && (
            <div className="form-grid animate-fade-up">
              <div className="form-section">
                <h2 className="form-section-title">📍 Pickup Details</h2>
                <div className="form-group">
                  <label className="form-label">Pickup Address *</label>
                  <input
                    className="form-control"
                    placeholder="e.g. 12 Independence Ave"
                    value={form.pickupAddress}
                    onChange={(e) => update("pickupAddress", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pickup City *</label>
                  <select
                    className="form-control"
                    value={form.pickupCity}
                    onChange={(e) => update("pickupCity", e.target.value)}
                    required
                  >
                    <option value="">Select city</option>
                    {GHANA_CITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Pickup Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.pickupDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => update("pickupDate", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h2 className="form-section-title">📬 Receiver Details</h2>
                <div className="form-group">
                  <label className="form-label">Receiver Full Name *</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Kofi Mensah"
                    value={form.receiverName}
                    onChange={(e) => update("receiverName", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Receiver Phone *</label>
                  <input
                    className="form-control"
                    type="tel"
                    placeholder="+233 20 000 0000"
                    value={form.receiverPhone}
                    onChange={(e) => update("receiverPhone", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination Address *</label>
                  <input
                    className="form-control"
                    placeholder="e.g. 45 Ring Road East"
                    value={form.destinationAddress}
                    onChange={(e) => update("destinationAddress", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination City *</label>
                  <select
                    className="form-control"
                    value={form.destinationCity}
                    onChange={(e) => update("destinationCity", e.target.value)}
                    required
                  >
                    <option value="">Select city</option>
                    {GHANA_CITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Package Details ── */}
          {step === 2 && (
            <div className="form-grid animate-fade-up">
              <div className="form-section">
                <h2 className="form-section-title">📦 Package Information</h2>
                <div className="form-group">
                  <label className="form-label">Package Type *</label>
                  <select
                    className="form-control"
                    value={form.packageType}
                    onChange={(e) => update("packageType", e.target.value)}
                    required
                  >
                    <option value="">Select type</option>
                    {PACKAGE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg) *</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="e.g. 2.5"
                    value={form.weight}
                    onChange={(e) => update("weight", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Fee (GHS)</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 50.00"
                    value={form.deliveryFee}
                    onChange={(e) => update("deliveryFee", e.target.value)}
                  />
                  <span className="form-hint">Leave blank to use platform-calculated rate.</span>
                </div>
              </div>

              <div className="form-section">
                <h2 className="form-section-title">📝 Additional Notes</h2>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Special Instructions</label>
                  <textarea
                    className="form-control"
                    style={{ minHeight: 140, resize: "vertical" }}
                    placeholder="e.g. Fragile — handle with care. Call receiver before delivery."
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                  />
                </div>

                {/* Quick estimate */}
                {form.weight && (
                  <div className="estimate-box">
                    <span className="text-sm text-muted">Estimated Fee</span>
                    <span className="estimate-value">
                      GHS {form.deliveryFee ? Number(form.deliveryFee).toFixed(2) : (Number(form.weight) * 12 + 15).toFixed(2)}
                    </span>
                    <span className="text-xs text-faint">Based on weight · subject to change</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && (
            <div className="review-card animate-fade-up">
              <h2 className="form-section-title" style={{ marginBottom: "1.5rem" }}>🔍 Review Your Shipment</h2>
              {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div>
                  <p className="review-group-label">📍 Pickup</p>
                  <p className="review-value">{form.pickupAddress}, {form.pickupCity}</p>
                  <p className="review-sub">{form.pickupDate}</p>
                </div>
                <div>
                  <p className="review-group-label">📬 Receiver</p>
                  <p className="review-value">{form.receiverName}</p>
                  <p className="review-sub">{form.receiverPhone}</p>
                  <p className="review-sub">{form.destinationAddress}, {form.destinationCity}</p>
                </div>
                <div>
                  <p className="review-group-label">📦 Package</p>
                  <p className="review-value">{form.packageType}</p>
                  <p className="review-sub">{form.weight} kg</p>
                </div>
                <div>
                  <p className="review-group-label">💰 Delivery Fee</p>
                  <p className="review-value">
                    GHS {form.deliveryFee ? Number(form.deliveryFee).toFixed(2) : (Number(form.weight) * 12 + 15).toFixed(2)}
                  </p>
                  <p className="review-sub">Estimated</p>
                </div>
                {form.notes && (
                  <div style={{ gridColumn: "span 2" }}>
                    <p className="review-group-label">📝 Notes</p>
                    <p className="review-sub">{form.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Navigation Buttons ── */}
          <div className="form-nav">
            {step > 1 && (
              <button type="button" className="btn btn-ghost" onClick={prevStep}>
                ← Back
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              id={step === 3 ? "confirm-shipment-btn" : "next-step-btn"}
              disabled={loading}
              style={{ marginLeft: "auto" }}
            >
              {loading ? "Booking…" : step === 3 ? "Confirm & Book →" : "Next →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
