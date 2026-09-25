import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Unauthorized } from "../pages/Unauthorized.jsx";

/**
 * Guards a route by auth state and optional role.
 *
 * Usage:
 *   <ProtectedRoute>                              ← any authenticated user
 *   <ProtectedRoute role="admin">                 ← admin only
 *   <ProtectedRoute role={["admin","staff"]}>     ← admin OR staff
 */
export function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  // Still resolving Firebase onAuthStateChanged
  if (loading) {
    return (
      <div className="full-page-center">
        <div className="spinner" aria-label="Loading" />
        <p className="text-muted text-sm">Loading…</p>
      </div>
    );
  }

  // Not authenticated → send to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Account deactivated check
  if (user.isActive === false) {
    return <Unauthorized />;
  }

  // Role check
  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(user.role)) {
      // Reject unauthorized access with 403 Access Denied
      return <Unauthorized />;
    }
  }

  return children;
}

