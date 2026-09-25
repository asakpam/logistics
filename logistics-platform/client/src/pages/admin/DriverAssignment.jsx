import { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../../context/DataContext.jsx";

const DEMO_UNASSIGNED = [
  { _id:"s4", trackingNumber:"TRK260808Q7R8", customerName:"Abena Asante",  from:"Accra",           to:"Cape Coast, C/R",  packageType:"Food",       weight:"1.2 kg", date:"Aug 8, 2026" },
  { _id:"s7", trackingNumber:"TRK260823P1Q2", customerName:"Efua Mensah",   from:"Tema, G/A",       to:"Ho, Volta",         packageType:"Electronics",weight:"2.8 kg", date:"Aug 23, 2026" },
  { _id:"s8", trackingNumber:"TRK260823R3S4", customerName:"Kwesi Appiah",  from:"Kumasi",          to:"Tamale, N/R",       packageType:"Machinery",  weight:"8.5 kg", date:"Aug 23, 2026" },
];

const DEMO_AVAILABLE_DRIVERS = [
  { _id:"d1", name:"Emmanuel Adu",   vehicle:"Toyota Hiace",  plate:"GH-1234-23", deliveries:145, rating:4.9, available:true,  status:"approved" },
  { _id:"d3", name:"Victor Boateng", vehicle:"Hyundai H100",  plate:"GH-9012-24", deliveries:67,  rating:4.8, available:true,  status:"approved" },
  { _id:"d5", name:"Grace Asante",   vehicle:"Ford Transit",  plate:"GH-7890-24", deliveries:41,  rating:4.6, available:true,  status:"approved" },
];

export function DriverAssignment() {
  const { assignDriver, shipments, approvedDrivers } = useData();
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [selectedDriver, setSelectedDriver]     = useState(null);
  const [confirmed, setConfirmed]               = useState(false);
  const [assignments, setAssignments]           = useState([]);
  const [assigning, setAssigning]               = useState(false);

  // Filter shipments needing assignment
  const unassignedShipments = shipments.length > 0
    ? shipments.filter(s => s.status === "Pending" || !s.driver || s.driver === "—")
    : DEMO_UNASSIGNED;

  // STRICT REQUIREMENT: Only drivers whose role="driver" AND status="approved" (or "active") appear
  const eligibleDrivers = approvedDrivers.length > 0 ? approvedDrivers : DEMO_AVAILABLE_DRIVERS;
  const availableDrivers = eligibleDrivers.filter(d => {
    const st = (d.status || "").toLowerCase();
    const isApproved = st === "approved" || st === "active";
    return isApproved && (d.available ?? true);
  });

  async function handleAssign() {
    if (!selectedShipment || !selectedDriver) return;
    setAssigning(true);
    try {
      await assignDriver(selectedShipment._id || selectedShipment.id, selectedDriver._id || selectedDriver.id, selectedDriver.name);
      setAssignments(prev => [...prev, { shipment: selectedShipment, driver: selectedDriver }]);
      setConfirmed(true);
      setTimeout(() => {
        setConfirmed(false);
        setSelectedShipment(null);
        setSelectedDriver(null);
      }, 2500);
    } finally {
      setAssigning(false);
    }
  }

  const unassigned = unassignedShipments.filter(s => !assignments.find(a => (a.shipment._id || a.shipment.id) === (s._id || s.id)));

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Driver <span className="gradient-text">Assignment</span>
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            Select a shipment and an approved, available driver to assign.
          </p>
        </div>
        <Link to="/dashboard/admin" className="btn btn-ghost btn-sm">← Admin</Link>
      </div>

      {/* Confirmation toast */}
      {confirmed && (
        <div className="alert alert-info" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.3rem" }}>✅</span>
          <div>
            <p style={{ fontWeight: 700 }}>Driver Assigned Successfully!</p>
            <p className="text-xs">
              {selectedDriver?.name || "Driver"} → {selectedShipment?.trackingNumber || selectedShipment?.id || "Shipment"}
            </p>
          </div>
        </div>
      )}

      {/* Step indicators */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { step: 1, label: "Select Shipment", done: !!selectedShipment },
          { step: 2, label: "Select Driver",   done: !!selectedDriver },
          { step: 3, label: "Confirm",          done: confirmed },
        ].map(s => (
          <div key={s.step} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: s.done ? "var(--clr-success)" : "var(--clr-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: s.done ? "#fff" : "var(--clr-text-muted)", border: `2px solid ${s.done ? "var(--clr-success)" : "var(--clr-border)"}` }}>
              {s.done ? "✓" : s.step}
            </div>
            <span className={`text-sm ${s.done ? "" : "text-muted"}`} style={{ fontWeight: s.done ? 600 : 400 }}>{s.label}</span>
            {s.step < 3 && <span className="text-muted" style={{ fontSize: "0.8rem" }}>→</span>}
          </div>
        ))}
      </div>

      <div className="dash-grid-2">
        {/* Unassigned shipments */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Unassigned Shipments</h2>
            <span className="badge badge-warning">{unassigned.length}</span>
          </div>
          <div className="shipment-list">
            {unassigned.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ fontSize: "2rem" }}>🎉</p>
                <p className="text-muted text-sm">All shipments assigned!</p>
              </div>
            ) : unassigned.map(s => {
              const trk = s.trackingNumber || s.id;
              const isSelected = selectedShipment && (selectedShipment._id || selectedShipment.id) === (s._id || s.id);
              return (
                <div
                  key={s._id || s.id}
                  className={`shipment-row${isSelected ? " selected" : ""}`}
                  style={{ cursor: "pointer", borderLeft: isSelected ? "3px solid var(--clr-primary)" : "3px solid transparent" }}
                  onClick={() => setSelectedShipment(s)}
                  id={`select-shipment-${s._id || s.id}`}
                >
                  <div className="shipment-row-icon">📦</div>
                  <div className="shipment-row-body">
                    <div className="shipment-row-top">
                      <code className="trk-code" style={{ fontSize: "0.75rem" }}>{trk}</code>
                      <span className="badge badge-muted">{s.status || "Pending"}</span>
                    </div>
                    <div className="shipment-route" style={{ fontSize: "0.82rem" }}>
                      {s.from || s.pickupAddress} <span className="route-arrow">→</span> {s.to || s.destinationAddress}
                    </div>
                    <div className="shipment-meta-row">
                      <span className="text-xs text-faint">{s.customerName || s.customer}</span>
                      <span className="text-xs text-muted">{s.packageType} · {s.weight}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Available Approved drivers only */}
        <div className="card">
          <div className="card-header" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
            <h2 className="card-title">Approved & Available Drivers</h2>
            <span className="badge badge-success">{availableDrivers.length} approved</span>
          </div>

          <div className="shipment-list">
            {availableDrivers.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <p className="text-muted text-sm">No approved, available drivers found.</p>
                <p className="text-xs text-faint" style={{ marginTop: "0.25rem" }}>Review pending driver applications in Admin Dashboard to approve drivers.</p>
              </div>
            ) : (
              availableDrivers.map(d => {
                const isSelected = selectedDriver && (selectedDriver._id || selectedDriver.id) === (d._id || d.id);
                return (
                  <div
                    key={d._id || d.id}
                    className={`shipment-row${isSelected ? " selected" : ""}`}
                    style={{ cursor: "pointer", borderLeft: isSelected ? "3px solid var(--clr-success)" : "3px solid transparent" }}
                    onClick={() => setSelectedDriver(d)}
                    id={`select-driver-${d._id || d.id}`}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--clr-success)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                      {d.name ? d.name[0] : "D"}
                    </div>
                    <div className="shipment-row-body">
                      <div className="shipment-row-top">
                        <span style={{ fontWeight: 600 }}>{d.name}</span>
                        <span className="badge badge-success">✓ Approved & Available</span>
                      </div>
                      <div className="shipment-meta-row">
                        <span className="text-xs text-muted">{d.vehicle || `${d.vehicleType || "Van"} · ${d.plate || "N/A"}`}</span>
                        <span className="text-xs text-faint">⭐ {d.rating || "4.8"} · {d.deliveries || 0} deliveries</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Assign button */}
      {selectedShipment && selectedDriver && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Confirm Assignment</p>
              <p className="text-muted text-sm">
                Assign <strong>{selectedDriver.name}</strong> to shipment <code style={{ color: "var(--clr-primary)" }}>{selectedShipment.trackingNumber || selectedShipment.id}</code>
                {" "}going to <strong>{selectedShipment.to || selectedShipment.destinationAddress}</strong>?
              </p>
            </div>
            <button
              id="confirm-assign-btn"
              className="btn btn-primary"
              style={{ padding: "0.75rem 2rem" }}
              onClick={handleAssign}
              disabled={assigning}
            >
              {assigning ? "Assigning…" : "🚀 Assign Driver"}
            </button>
          </div>
        </div>
      )}

      {/* Recent assignments */}
      {assignments.length > 0 && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <div className="card-header"><h2 className="card-title">Recent Assignments This Session</h2></div>
          {assignments.map((a, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid var(--clr-border)" }}>
              <div>
                <code style={{ fontSize: "0.82rem", color: "var(--clr-primary)" }}>{a.shipment.trackingNumber || a.shipment.id}</code>
                <span className="text-muted text-xs" style={{ marginLeft: "0.5rem" }}>{a.shipment.from} → {a.shipment.to}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="text-sm">→ {a.driver.name}</span>
                <span className="badge badge-success">Assigned</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
