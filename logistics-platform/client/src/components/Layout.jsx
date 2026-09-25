import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ErrorBoundary } from "./ErrorBoundary.jsx";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  // Dashboard link based on role
  const dashboardHref =
    user?.role === "admin"  ? "/dashboard/admin"  :
    user?.role === "driver" ? "/dashboard/driver" :
    "/dashboard/customer";

  return (
    <div className="app-shell">
      {/* ── Top Navigation Bar ───────────────────────────────── */}
      <header className="topbar">
        {/* Brand */}
        <Link to="/" className="brand">
          <span className="brand-icon">📦</span>
          Logistics <span className="accent">Platform</span>
        </Link>

        {/* Nav links */}
        <nav aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Home
          </NavLink>
          <NavLink
            to="/track/TRK-DEMO"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Track
          </NavLink>
          <NavLink
            to="/marketplace"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Marketplace
          </NavLink>
          {user && (
            <NavLink
              to={dashboardHref}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              Dashboard
            </NavLink>
          )}
        </nav>

        {/* Auth actions */}
        <div className="topbar-actions">
          {user ? (
            <>
              <span
                className="text-sm text-muted"
                style={{ fontWeight: 500 }}
              >
                {user.name?.split(" ")[0]}
              </span>
              <span
                className="badge badge-primary"
                style={{ textTransform: "capitalize" }}
              >
                {user.role}
              </span>
              <button
                id="logout-btn"
                className="btn btn-outline btn-sm"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm" id="nav-login">
                Sign in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" id="nav-register">
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ── Page Content ────────────────────────────────────── */}
      <main className="page-content">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
