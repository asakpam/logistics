import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function Unauthorized() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const dashboardHref =
    user?.role === "admin"  ? "/dashboard/admin"  :
    user?.role === "driver" ? "/dashboard/driver" :
    user?.role === "customer" ? "/dashboard/customer" :
    "/login";

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div className="card animate-fade-up" style={{ textAlign: "center", maxWidth: 480, padding: "3rem 2rem", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
        {/* Shield Icon / Error badge */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "5rem", lineHeight: 1 }}>
            🛡️
          </div>
          <span
            className="badge badge-danger"
            style={{
              position: "absolute",
              bottom: "-8px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "1px",
              padding: "0.25rem 0.6rem"
            }}
          >
            403 FORBIDDEN
          </span>
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.75rem", color: "var(--clr-text)" }}>
          Access Denied
        </h1>

        <p className="text-muted" style={{ marginBottom: "2rem", lineHeight: 1.6, fontSize: "0.95rem" }}>
          You do not have permission to access this page.
        </p>

        {user && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--clr-border)", borderRadius: "var(--r-md)", padding: "0.75rem 1rem", marginBottom: "1.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
            <span className="text-muted">Current Role:</span>
            <span className="badge badge-primary" style={{ textTransform: "capitalize" }}>{user.role}</span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button
            id="return-dashboard-btn"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => navigate(dashboardHref, { replace: true })}
          >
            {user ? "Return to Dashboard" : "Sign In"}
          </button>

          {user ? (
            <button
              id="switch-account-btn"
              className="btn btn-ghost"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
            >
              Sign in with another account
            </button>
          ) : (
            <button
              className="btn btn-ghost"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => navigate("/")}
            >
              ← Back to Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
