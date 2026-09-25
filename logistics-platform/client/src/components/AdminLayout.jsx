import { NavLink, Outlet } from "react-router-dom";

export function AdminLayout() {
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
    <div style={{ display: "flex", minHeight: "calc(100vh - 68px)" }}>
      {/* Sidebar */}
      <aside style={{
        width: "240px",
        background: "var(--clr-surface)",
        borderRight: "1px solid var(--clr-border)",
        padding: "1.5rem 0",
        position: "sticky",
        top: 68,
        height: "calc(100vh - 68px)",
        overflowY: "auto",
      }}>
        <div style={{ padding: "0 1rem 1rem 1rem", borderBottom: "1px solid var(--clr-border)", marginBottom: "1rem" }}>
          <h3 style={{ 
            fontSize: "0.75rem", 
            fontWeight: 700, 
            textTransform: "uppercase", 
            letterSpacing: "0.05em", 
            color: "var(--clr-text-muted)",
            marginBottom: "0.5rem"
          }}>
            Admin Panel
          </h3>
        </div>
        
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0 0.75rem" }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard/admin"}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.625rem 0.875rem",
                borderRadius: "var(--r-md)",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: isActive ? "var(--clr-primary)" : "var(--clr-text)",
                background: isActive ? "var(--clr-primary-alpha)" : "transparent",
                transition: "all var(--tr-fast)",
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.background = "var(--clr-surface-2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
