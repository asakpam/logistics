import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ErrorBoundary } from "./ErrorBoundary.jsx";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Automatically close mobile menus on route transition
  useEffect(() => {
    setAdminSidebarOpen(false);
    setMobileNavOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  // Dashboard link based on role
  const dashboardHref =
    user?.role === "admin"  ? "/dashboard/admin"  :
    user?.role === "driver" ? "/dashboard/driver" :
    "/dashboard/customer";

  const isAdminRoute =
    user?.role === "admin" &&
    (location.pathname.startsWith("/admin") ||
      location.pathname.startsWith("/dashboard/admin"));

  return (
    <div className="app-shell">
      {/* ── Top Navigation Bar ───────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-brand-wrap">
          {/* Hamburger button */}
          {isAdminRoute ? (
            <button
              id="admin-hamburger-btn"
              type="button"
              className="hamburger-btn admin-hamburger-btn"
              onClick={() => setAdminSidebarOpen((prev) => !prev)}
              aria-label={adminSidebarOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={adminSidebarOpen}
              aria-controls="admin-sidebar"
            >
              <span className="hamburger-icon">{adminSidebarOpen ? "✕" : "☰"}</span>
            </button>
          ) : (
            <button
              id="mobile-nav-toggle-btn"
              type="button"
              className="hamburger-btn mobile-nav-toggle-btn"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav-drawer"
            >
              <span className="hamburger-icon">{mobileNavOpen ? "✕" : "☰"}</span>
            </button>
          )}

          {/* Brand */}
          <Link to="/" className="brand">
            <span className="brand-icon">📦</span>
            <span className="brand-text">Logistics <span className="accent">Platform</span></span>
          </Link>
        </div>

        {/* Desktop Nav links */}
        <nav className="topbar-nav" aria-label="Main navigation">
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
                className="topbar-user-name text-sm text-muted"
                style={{ fontWeight: 500 }}
              >
                {user.name?.split(" ")[0]}
              </span>
              <span
                className="badge badge-primary topbar-role-badge"
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

      {/* ── Public / Customer Mobile Navigation Drawer ──────── */}
      {mobileNavOpen && !isAdminRoute && (
        <>
          <div
            className="mobile-nav-backdrop open"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-nav-drawer"
            className="mobile-nav-drawer open"
            aria-label="Mobile Navigation"
          >
            <div className="mobile-nav-header">
              <span className="mobile-nav-title">Menu</span>
              <button
                type="button"
                className="sidebar-close-btn"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation"
              >
                ✕
              </button>
            </div>
            <nav className="mobile-nav-links">
              <NavLink
                to="/"
                end
                className="mobile-nav-link"
                onClick={() => setMobileNavOpen(false)}
              >
                🏠 Home
              </NavLink>
              <NavLink
                to="/track/TRK-DEMO"
                className="mobile-nav-link"
                onClick={() => setMobileNavOpen(false)}
              >
                📍 Track Shipment
              </NavLink>
              <NavLink
                to="/marketplace"
                className="mobile-nav-link"
                onClick={() => setMobileNavOpen(false)}
              >
                🛍️ Marketplace
              </NavLink>
              {user && (
                <NavLink
                  to={dashboardHref}
                  className="mobile-nav-link"
                  onClick={() => setMobileNavOpen(false)}
                >
                  📊 Dashboard
                </NavLink>
              )}
            </nav>
            <div className="mobile-nav-footer">
              {user ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="text-sm font-semibold">{user.name}</span>
                    <span className="badge badge-primary" style={{ textTransform: "capitalize" }}>{user.role}</span>
                  </div>
                  <button
                    className="btn btn-outline btn-sm w-full"
                    onClick={() => {
                      setMobileNavOpen(false);
                      handleLogout();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <Link
                    to="/login"
                    className="btn btn-ghost btn-sm w-full"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary btn-sm w-full"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Page Content ────────────────────────────────────── */}
      <main className="page-content">
        <ErrorBoundary>
          <Outlet context={{ adminSidebarOpen, setAdminSidebarOpen }} />
        </ErrorBoundary>
      </main>
    </div>
  );
}
