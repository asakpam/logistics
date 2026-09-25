import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const dashboardHref =
    user?.role === "admin"  ? "/dashboard/admin"  :
    user?.role === "driver" ? "/dashboard/driver" :
    user ? "/dashboard/customer" : "/";

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        {/* Animated 404 */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "8rem", lineHeight: 1, fontFamily: "var(--font-display)", fontWeight: 900, background: "var(--grad-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "-4px" }}>
            404
          </div>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "3.5rem", pointerEvents: "none" }}>
            📦
          </div>
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.75rem" }}>
          Package Not Found
        </h1>
        <p className="text-muted" style={{ marginBottom: "2rem", lineHeight: 1.6 }}>
          Oops! This page seems to have been lost in transit. It may have been moved, deleted, or the tracking number might be wrong.
        </p>

        {/* Quick actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 320, margin: "0 auto" }}>
          <button
            id="back-home-btn"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => navigate(dashboardHref)}
          >
            {user ? "🏠 Go to Dashboard" : "🏠 Back to Home"}
          </button>
          <button
            id="back-btn"
            className="btn btn-ghost"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => navigate(-1)}
          >
            ← Go Back
          </button>
        </div>

        {/* Quick links */}
        <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--clr-border)" }}>
          <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>
            Or navigate to:
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            {[
              { label: "Track Shipment", href: "/track/TRK-DEMO" },
              { label: "Marketplace",   href: "/marketplace" },
              { label: "Login",         href: "/login" },
            ].map(link => (
              <button
                key={link.href}
                className="btn btn-outline btn-sm"
                onClick={() => navigate(link.href)}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
