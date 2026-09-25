import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function DriverPendingApproval({ status = "pending" }) {
  const { user, logout } = useAuth();
  const isRejected = status === "rejected";

  return (
    <div className="auth-page" style={{ minHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div className="auth-card animate-fade-up" style={{ maxWidth: 520, textAlign: "center", padding: "2.5rem 2rem" }}>

        {/* Status Icon */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: isRejected ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
          color: isRejected ? "var(--clr-danger)" : "var(--clr-warning)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.2rem",
          margin: "0 auto 1.5rem"
        }}>
          {isRejected ? "❌" : "⏳"}
        </div>

        {/* Title */}
        <h1 className="auth-title" style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>
          {isRejected ? "Application Rejected" : "Pending Administrator Approval"}
        </h1>

        {/* Subtitle */}
        <div className="badge" style={{
          fontSize: "0.82rem",
          padding: "0.35rem 0.9rem",
          marginBottom: "1.25rem",
          background: isRejected ? "var(--clr-danger)" : "var(--clr-warning)",
          color: "#fff"
        }}>
          Status: {isRejected ? "Rejected" : "Awaiting Review"}
        </div>

        {/* Description Box */}
        <div style={{
          background: "var(--clr-surface-2)",
          border: "1px solid var(--clr-border)",
          borderRadius: "var(--r-md)",
          padding: "1.25rem",
          marginBottom: "1.5rem",
          textAlign: "left"
        }}>
          <p style={{ fontWeight: 600, color: "var(--clr-text)", marginBottom: "0.5rem" }}>
            Hello, {user?.name || "Driver"} 👋
          </p>

          {isRejected ? (
            <p className="text-muted text-sm" style={{ lineHeight: 1.6 }}>
              Your driver registration application has been reviewed and was <strong>not approved</strong> by the platform administrator at this time. If you believe this is an error, please contact support.
            </p>
          ) : (
            <>
              <p className="text-muted text-sm" style={{ lineHeight: 1.6, marginBottom: "0.75rem" }}>
                Your driver application is currently <strong>awaiting administrator approval</strong>. Please wait for an administrator to review your application.
              </p>
              <p className="text-xs text-faint">
                For security reasons, operational features such as shipment assignments, GPS tracking, and delivery updates remain locked until your application is approved.
              </p>
            </>
          )}
        </div>

        {/* User summary details */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.83rem",
          padding: "0.75rem 1rem",
          background: "var(--clr-bg-2)",
          borderRadius: "var(--r-md)",
          border: "1px solid var(--clr-border)",
          marginBottom: "1.5rem"
        }}>
          <span className="text-muted">Account Email</span>
          <span style={{ fontWeight: 600 }}>{user?.email}</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            className="btn btn-outline"
            style={{ flex: 1 }}
            onClick={() => window.location.reload()}
          >
            🔄 Check Status
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() => logout()}
          >
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
}
