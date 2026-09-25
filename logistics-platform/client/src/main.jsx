import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { DataProvider } from "./context/DataContext.jsx";
import { Layout } from "./components/Layout.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { AdminLayout } from "./components/AdminLayout.jsx";

// ── Eagerly loaded (critical path) ────────────────────────────────────────
import { LandingPage } from "./pages/LandingPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { ForgotPassword } from "./pages/ForgotPassword.jsx";
import { ResetPassword } from "./pages/ResetPassword.jsx";
import { Unauthorized } from "./pages/Unauthorized.jsx";
import { NotFound } from "./pages/NotFound.jsx";

// ── Lazily loaded (split by role) ─────────────────────────────────────────
const TrackShipment = lazy(() => import("./pages/TrackShipment.jsx").then(m => ({ default: m.TrackShipment })));
const Marketplace = lazy(() => import("./pages/Marketplace.jsx").then(m => ({ default: m.Marketplace })));
const ProductDetails = lazy(() => import("./pages/ProductDetails.jsx").then(m => ({ default: m.ProductDetails })));

// Customer
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard.jsx").then(m => ({ default: m.CustomerDashboard })));
const CreateShipment = lazy(() => import("./pages/CreateShipment.jsx").then(m => ({ default: m.CreateShipment })));
const MyShipments = lazy(() => import("./pages/MyShipments.jsx").then(m => ({ default: m.MyShipments })));
const ETAPrediction = lazy(() => import("./pages/ETAPrediction.jsx").then(m => ({ default: m.ETAPrediction })));
const Notifications = lazy(() => import("./pages/Notifications.jsx").then(m => ({ default: m.Notifications })));
const Profile = lazy(() => import("./pages/Profile.jsx").then(m => ({ default: m.Profile })));

// Driver
const DriverDashboard = lazy(() => import("./pages/DriverDashboard.jsx").then(m => ({ default: m.DriverDashboard })));
const AssignedShipments = lazy(() => import("./pages/driver/AssignedShipments.jsx").then(m => ({ default: m.AssignedShipments })));
const DeliveryDetails = lazy(() => import("./pages/driver/DeliveryDetails.jsx").then(m => ({ default: m.DeliveryDetails })));
const GPSTracking = lazy(() => import("./pages/driver/GPSTracking.jsx").then(m => ({ default: m.GPSTracking })));
const DeliveryConfirmation = lazy(() => import("./pages/driver/DeliveryConfirmation.jsx").then(m => ({ default: m.DeliveryConfirmation })));

// Admin
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx").then(m => ({ default: m.AdminDashboard })));
const ManageUsers = lazy(() => import("./pages/admin/ManageUsers.jsx").then(m => ({ default: m.ManageUsers })));
const ManageShipments = lazy(() => import("./pages/admin/ManageShipments.jsx").then(m => ({ default: m.ManageShipments })));
const ManageDrivers = lazy(() => import("./pages/admin/ManageDrivers.jsx").then(m => ({ default: m.ManageDrivers })));
const DriverAssignment = lazy(() => import("./pages/admin/DriverAssignment.jsx").then(m => ({ default: m.DriverAssignment })));
const LiveTracking = lazy(() => import("./pages/admin/LiveTracking.jsx").then(m => ({ default: m.LiveTracking })));
const ETAMonitoring = lazy(() => import("./pages/admin/ETAMonitoring.jsx").then(m => ({ default: m.ETAMonitoring })));
const NotificationsAdmin = lazy(() => import("./pages/admin/NotificationsAdmin.jsx").then(m => ({ default: m.NotificationsAdmin })));
const Reports = lazy(() => import("./pages/admin/Reports.jsx").then(m => ({ default: m.Reports })));
const ProductManagement = lazy(() => import("./pages/admin/ProductManagement.jsx").then(m => ({ default: m.ProductManagement })));

import "./styles.css";

function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "1rem" }}>
      <div style={{ fontSize: "2.5rem" }}>📦</div>
      <p style={{ color: "var(--clr-text-muted)", fontSize: "0.9rem" }}>Loading…</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<Layout />}>

                {/* ── Public ──────────────────────────────────────── */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/track/:trackingNumber" element={<TrackShipment />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/:productId" element={<ProductDetails />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/access-denied" element={<Unauthorized />} />

                {/* ── Customer ────────────────────────────────────── */}
                <Route path="/dashboard/customer" element={
                  <ProtectedRoute role={["customer", "admin"]}><CustomerDashboard /></ProtectedRoute>
                } />
                <Route path="/customer/dashboard" element={
                  <ProtectedRoute role={["customer", "admin"]}><CustomerDashboard /></ProtectedRoute>
                } />
                <Route path="/shipments/create" element={
                  <ProtectedRoute role={["customer", "admin"]}><CreateShipment /></ProtectedRoute>
                } />
                <Route path="/customer/shipments/create" element={
                  <ProtectedRoute role={["customer", "admin"]}><CreateShipment /></ProtectedRoute>
                } />
                <Route path="/shipments/my" element={
                  <ProtectedRoute role={["customer", "admin"]}><MyShipments /></ProtectedRoute>
                } />
                <Route path="/customer/shipments" element={
                  <ProtectedRoute role={["customer", "admin"]}><MyShipments /></ProtectedRoute>
                } />
                <Route path="/eta/:trackingNumber" element={
                  <ProtectedRoute role={["customer", "admin"]}><ETAPrediction /></ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute role={["customer", "driver", "admin"]}><Notifications /></ProtectedRoute>
                } />
                <Route path="/customer/notifications" element={
                  <ProtectedRoute role={["customer", "driver", "admin"]}><Notifications /></ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute role={["customer", "driver", "admin"]}><Profile /></ProtectedRoute>
                } />
                <Route path="/customer/profile" element={
                  <ProtectedRoute role={["customer", "driver", "admin"]}><Profile /></ProtectedRoute>
                } />

                {/* ── Driver ──────────────────────────────────────── */}
                <Route path="/dashboard/driver" element={
                  <ProtectedRoute role="driver"><DriverDashboard /></ProtectedRoute>
                } />
                <Route path="/driver/dashboard" element={
                  <ProtectedRoute role="driver"><DriverDashboard /></ProtectedRoute>
                } />
                <Route path="/driver/shipments" element={
                  <ProtectedRoute role="driver"><AssignedShipments /></ProtectedRoute>
                } />
                <Route path="/driver/delivery/:trackingNumber" element={
                  <ProtectedRoute role="driver"><DeliveryDetails /></ProtectedRoute>
                } />
                <Route path="/driver/gps" element={
                  <ProtectedRoute role="driver"><GPSTracking /></ProtectedRoute>
                } />
                <Route path="/driver/tracking" element={
                  <ProtectedRoute role="driver"><GPSTracking /></ProtectedRoute>
                } />
                <Route path="/driver/confirm/:trackingNumber" element={
                  <ProtectedRoute role="driver"><DeliveryConfirmation /></ProtectedRoute>
                } />
                <Route path="/driver/profile" element={
                  <ProtectedRoute role="driver"><Profile /></ProtectedRoute>
                } />

                {/* ── Admin ───────────────────────────────────────── */}
                <Route element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
                  <Route path="/dashboard/admin" element={<AdminDashboard />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<ManageUsers />} />
                  <Route path="/admin/shipments" element={<ManageShipments />} />
                  <Route path="/admin/drivers" element={<ManageDrivers />} />
                  <Route path="/admin/assign" element={<DriverAssignment />} />
                  <Route path="/admin/assignments" element={<DriverAssignment />} />
                  <Route path="/admin/live-tracking" element={<LiveTracking />} />
                  <Route path="/admin/tracking" element={<LiveTracking />} />
                  <Route path="/admin/eta" element={<ETAMonitoring />} />
                  <Route path="/admin/notifications" element={<NotificationsAdmin />} />
                  <Route path="/admin/reports" element={<Reports />} />
                  <Route path="/admin/products" element={<ProductManagement />} />
                </Route>

                {/* ── 404 catch-all ───────────────────────────────── */}
                <Route path="*" element={<NotFound />} />

              </Route>
            </Routes>
          </Suspense>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
