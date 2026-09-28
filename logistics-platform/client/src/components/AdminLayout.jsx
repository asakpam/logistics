import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useOutletContext } from "react-router-dom";

export function AdminLayout() {
  const outletCtx = useOutletContext();
  const location = useLocation();
  const [localOpen, setLocalOpen] = useState(false);

  const isOpen = outletCtx?.adminSidebarOpen ?? localOpen;
  const setIsOpen = outletCtx?.setAdminSidebarOpen ?? setLocalOpen;

  // Auto-close sidebar whenever the route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: "/dashboard/admin", label: "Dashboard", icon: "📊" },
    { path: "/admin/users", label: "Users", icon: "👥" },
    { path: "/admin/drivers", label: "Drivers", icon: "🚚" },
    { path: "/admin/shipments", label: "Shipments", icon: "📦" },
    { path: "/admin/assign", label: "Assignments", icon: "🎯" },
    { path: "/admin/live-tracking", label: "Live Tracking", icon: "📍" },
    { path: "/admin/eta", label: "ETA Monitoring", icon: "⏱️" },
    { path: "/admin/reports", label: "Reports", icon: "📈" },
    { path: "/admin/products", label: "Products", icon: "🛍️" },
    { path: "/admin/notifications", label: "Notifications", icon: "🔔" },
  ];

  return (
    <div className="admin-layout">
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="admin-sidebar-backdrop open"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Permanent on desktop >= 1024px, Off-canvas on mobile/tablet < 1024px) */}
      <aside
        id="admin-sidebar"
        className={`admin-sidebar ${isOpen ? "open" : ""}`}
        aria-label="Admin Navigation"
      >
        <div className="admin-sidebar-header">
          <h3 className="admin-sidebar-title">Admin Panel</h3>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin navigation links">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard/admin"}
              className={({ isActive }) =>
                `admin-nav-item${isActive ? " active" : ""}`
              }
              onClick={() => setIsOpen(false)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
