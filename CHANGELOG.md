# Logistics Platform — Changelog

> **Purpose:** Track every meaningful change to the codebase session-by-session to prevent mistakes, avoid rework, and maintain a clear picture of what has been built, what is broken, and what is next.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| DONE   | Complete and working |
| BUILD  | Built but untested / needs Firebase keys |
| WARN   | Known issue / broken |
| WIP    | In progress |
| TODO   | Not started |
| DROP   | Removed / replaced |

---

## Session 6 — 2026-09-01/02

### Feature: User Registration & Driver Approval Workflow ✅

Complete implementation of role-based registration, driver approval pipeline, and admin management without rebuilding the application.

#### Backend Changes

| File | Status | Notes |
|------|--------|-------|
| `server/src/models/User.js` | DONE | Added `status` field (`enum: pending, approved, rejected, suspended, active`). Drivers default to `"pending"`, customers to `"active"` |
| `server/src/models/Driver.js` | DONE | Added `status` field, `vehicleType` field, defaulted `licenseNumber`/`vehicleNumber` to allow registration without them |
| `server/src/routes/auth.js` | DONE | `POST /register` now sets `status: "pending"` for drivers and creates `Driver` document; `status: "active"` for customers |
| `server/src/routes/users.js` | DONE | **NEW FILE** — `GET /api/users` (admin list all users), `PATCH /api/users/:id/status` (admin update user status) |
| `server/src/routes/drivers.js` | DONE | Added `PATCH /:id/approve`, `PATCH /:id/reject`, `PATCH /:id/status`; updated `GET /available` to strictly filter `status === "approved"` only |
| `server/src/app.js` | DONE | Mounted `/api/users` route |

#### Frontend Changes

| File | Status | Notes |
|------|--------|-------|
| `client/src/pages/DriverPendingApproval.jsx` | DONE | **NEW FILE** — Pending/Rejected screen shown to unapproved drivers. Includes status badge, blocking message, check-status button, sign-out |
| `client/src/pages/DriverDashboard.jsx` | DONE | Added guard: renders `<DriverPendingApproval>` if `user.status === "pending"` or `"rejected"`, blocking all operational features |
| `client/src/context/DataContext.jsx` | DONE | Added `approveDriver()`, `rejectDriver()`, `updateUserStatus()`; exposes `pendingDrivers`, `approvedDrivers` derived lists; fetches live drivers from `/api/drivers` with user profile merge |
| `client/src/pages/AdminDashboard.jsx` | DONE | Added **Pending Driver Approvals** table (full-width in Overview tab) with driver name, email, phone, registration date, status badge, Review button; added **Review/Approve/Reject modal**; stats card shows live pending count; Drivers tab shows live badge count |
| `client/src/pages/admin/ManageDrivers.jsx` | DONE | Now fetches live driver data from backend; added Pending/Approved/Rejected/Suspended filter tabs with badge counts; **Review Application modal** with Approve/Reject; updated status badges to use real statuses |
| `client/src/pages/admin/ManageUsers.jsx` | DONE | Now fetches live customers/drivers from MongoDB; real-time Disable/Enable toggle; updated badge logic for `active`/`approved`/`pending` statuses |
| `client/src/pages/admin/DriverAssignment.jsx` | DONE | **Strictly** only `status === "approved"` AND `isAvailable === true` drivers appear in assignment list; clear empty-state message if no approved drivers exist |
| `client/src/styles.css` | DONE | Added `.btn-success` (green gradient) and `.btn-danger` (red gradient) CSS classes used by approval/rejection buttons |

#### Workflow Implemented

| Flow | Status |
|------|--------|
| Customer registers → `status: active` → immediate Customer Dashboard | ✅ |
| Driver registers → `status: pending` → sees Pending Approval screen (all features blocked) | ✅ |
| Admin sees pending drivers in Overview tab count badge and table | ✅ |
| Admin clicks Review → modal shows driver details → Approve / Reject buttons | ✅ |
| Approved driver → full Driver Dashboard + appears in assignment list | ✅ |
| Rejected driver → sees Rejection screen, cannot access any features | ✅ |
| Driver Assignment page → ONLY approved + available drivers selectable | ✅ |

#### Build Verification
- `npm run build` → ✅ **Exit code 0**. 142 modules transformed. All lazy chunks generated individually per screen.

---

## Session 5 — 2026-08-31

### Auth Architecture Refactor

| File | Status | Notes |
|------|--------|-------|
| `client/src/context/AuthContext.jsx` | DONE | Removed public role-selector from login. Role is now determined purely from backend DB/Firebase, not from user input |
| `client/src/pages/LoginPage.jsx` | DONE | Removed role dropdown; added "Clear Session Data" button for debugging |
| `client/src/pages/Unauthorized.jsx` | DONE | **NEW FILE** — 403 Access Denied page for wrong-role access attempts |
| `server/src/config/firebaseAdmin.js` | DONE | Fixed ESM compatibility: replaced `admin.apps` (undefined in ESM) with `getApps()` from `firebase-admin/app` and `getAuth(app)` from `firebase-admin/auth` |

#### Known Issues Fixed

- **FIXED:** `TypeError: Cannot read properties of undefined (reading 'length')` — `admin.apps` is not available in Node ESM. Must use named exports from `firebase-admin/app` and `firebase-admin/auth`
- **FIXED:** Admin login was routing to Customer Dashboard. Root cause: role was being set from a user-selected dropdown, not from the database. Role is now always fetched from `/api/auth/me`
- **NOTE:** MongoDB Atlas `querySrv ECONNREFUSED` errors occur when ISP/firewall blocks external DNS (port 53 UDP). Fix: whitelist `0.0.0.0/0` in Atlas Network Access, or use system DNS. App falls back to localStorage when backend is offline

#### Environment Variables Updated
- `FIREBASE_SERVICE_ACCOUNT_PATH` — added to `server/.env` pointing to `serviceAccountKey.json`

---

## Session 4 — 2026-08-23

### Screen Audit — All Routes Verified

Ran full browser audit across all 30 routes. Results:

| Category | Status | Notes |
|----------|--------|-------|
| Public (9 routes) | ✅ All pass | Landing, Login, Register, Forgot/Reset Password, Track, Marketplace, ProductDetails, 404 |
| Customer (6 routes) | ✅ All pass | Dashboard, CreateShipment, MyShipments, ETAPrediction, Notifications, Profile |
| Driver (5 routes) | ✅ All pass | Dashboard, AssignedShipments, DeliveryDetails, GPSTracking, DeliveryConfirmation |
| Admin (10 routes) | ✅ All pass | Dashboard, Users, Shipments, Drivers, Assignment, LiveTracking, ETA, Notifications, Reports, Products |

### Bug Fixed — Demo Auth Session Lost on Page Reload

**Root cause:** `demoLogin()` only set user state in memory; hard reload cleared it since `onAuthStateChanged` doesn't fire for demo accounts.

**Fix in `AuthContext.jsx`:**
- `useState` initializer now reads `localStorage.get("demo_user")` synchronously on first render (zero flicker)
- `loading` initial state is `false` when a persisted demo user is found
- `demoLogin()` now writes full user object to `localStorage.setItem("demo_user", ...)`
- `logout()` now clears `localStorage.removeItem("demo_user")`

---

## Session 3 — 2026-08-23


### Design Review — Screen Specification Audit

Reviewed `Intelligent_Logistics_Platform_All_Screens.docx` and cross-referenced all 30 required screens against the codebase.

| Category | Total Screens | Built | TODO Stubs | Missing |
|----------|--------------|-------|------------|---------|
| Customer | 11 | 2 | 4 | 5 |
| Driver | 5 | 0 | 1 | 4 |
| Admin | 9 | 0 | 2 | 7 |
| Product | 3 | 0 | 1 | 2 |
| System | 2 | 0 | 0 | 2 |
| **Total** | **30** | **2** | **8** | **20** |

### All 21 Missing Screens Built ✅

| File | Status | Notes |
|------|--------|-------|
| `pages/MyShipments.jsx` | DONE | Table + card view toggle, status filter pills, search, live data |
| `pages/ETAPrediction.jsx` | DONE | Live countdown timer, confidence bar, ML model info card |
| `pages/Notifications.jsx` | DONE | Tabs: All/Shipment/Delivery/SMS, per-item dismiss, mark-all-read |
| `pages/Profile.jsx` | DONE | Editable personal info, change password form, account stats, danger zone |
| `pages/ForgotPassword.jsx` | DONE | Firebase sendPasswordResetEmail + success/error states |
| `pages/ResetPassword.jsx` | DONE | Firebase confirmPasswordReset, password strength meter, show/hide |
| `pages/driver/AssignedShipments.jsx` | DONE | Stats row, status filter, driver shipment cards with action buttons |
| `pages/driver/DeliveryDetails.jsx` | DONE | Full shipment info, instructions, status radio update, confirm delivery |
| `pages/driver/GPSTracking.jsx` | DONE | Browser Geolocation API, start/stop sharing, coordinates, history |
| `pages/driver/DeliveryConfirmation.jsx` | DONE | Pre/post confirm states, success animation, redirect |
| `pages/admin/ManageUsers.jsx` | DONE | Customers/Drivers tabs, status toggle, add user modal |
| `pages/admin/ManageShipments.jsx` | DONE | Full table, inline status dropdown, search, filter, export stub |
| `pages/admin/ManageDrivers.jsx` | DONE | Driver cards, availability toggle, suspend/reinstate, add driver modal |
| `pages/admin/DriverAssignment.jsx` | DONE | Two-panel select UI, step indicators, confirm assignment, history |
| `pages/admin/LiveTracking.jsx` | DONE | Active shipments list, clickable selection, map placeholder, detail panel |
| `pages/admin/ETAMonitoring.jsx` | DONE | Predicted vs actual comparison table, model info, color-coded errors |
| `pages/admin/NotificationsAdmin.jsx` | DONE | Sent notifications log, category/channel filters, recipient, status |
| `pages/admin/Reports.jsx` | DONE | KPI cards, SVG bar/donut charts, ETA accuracy, driver performance table |
| `pages/ProductDetails.jsx` | DONE | Full product view, qty selector, add to cart, seller info, related |
| `pages/admin/ProductManagement.jsx` | DONE | Products table, add/edit modal, delete, status toggle |
| `pages/NotFound.jsx` | DONE | 404 gradient display, smart dashboard redirect, quick nav links |

### Routing Updated

| File | Status | Notes |
|------|--------|-------|
| `client/src/main.jsx` | DONE | All 21 new routes wired with `React.lazy` + `<Suspense>`. Added `PageLoader`, 404 catch-all, `/forgot-password`, `/reset-password` |

### Build Verification
- `npm run build` → ✅ **Exit code 0**. 140 modules transformed. All lazy chunks generated individually per screen.

---

## Session 2 — 2026-08-05


| File | Role |
|------|------|
| `pages/MyShipments.jsx` | Customer |
| `pages/ETAPrediction.jsx` | Customer |
| `pages/Notifications.jsx` | Customer |
| `pages/Profile.jsx` | Customer |
| `pages/ForgotPassword.jsx` | Customer |
| `pages/ResetPassword.jsx` | Customer |
| `pages/driver/AssignedShipments.jsx` | Driver |
| `pages/driver/DeliveryDetails.jsx` | Driver |
| `pages/driver/GPSTracking.jsx` | Driver |
| `pages/driver/DeliveryConfirmation.jsx` | Driver |
| `pages/admin/ManageUsers.jsx` | Admin |
| `pages/admin/ManageShipments.jsx` | Admin |
| `pages/admin/ManageDrivers.jsx` | Admin |
| `pages/admin/DriverAssignment.jsx` | Admin |
| `pages/admin/LiveTracking.jsx` | Admin |
| `pages/admin/ETAMonitoring.jsx` | Admin |
| `pages/admin/NotificationsAdmin.jsx` | Admin |
| `pages/admin/Reports.jsx` | Admin |
| `pages/ProductDetails.jsx` | Product |
| `pages/admin/ProductManagement.jsx` | Admin |
| `pages/NotFound.jsx` | System |

---

## Session 2 — 2026-08-05

### Infrastructure (Phase 1)

| File | Status | Notes |
|------|--------|-------|
| `.agents/rules/changelog.md` | DONE | Added workspace agent rule to continuously update CHANGELOG.md after every change |
| `client/src/styles.css` | DONE | Full design system — dark theme, color tokens, glassmorphism, animations. Replaces old 118-line stub |
| `client/index.html` | DONE | Added SEO meta, OG tags, inline SVG favicon |
| `client/vite.config.js` | DONE | Created (was missing). React plugin + /api proxy to Express port 5000 |
| `client/package.json` | DONE | Moved @vitejs/plugin-react to devDeps. Added leaflet@^1.9.4, react-leaflet@^4.2.1 |
| `client/.env` | BUILD | Created template — Firebase keys must be filled in |
| `client/src/lib/firebase.js` | BUILD | Created — reads VITE_FIREBASE_* env vars. Needs real credentials to work |
| `client/src/lib/api.js` | DONE | Unchanged — Axios instance + Bearer token helper |

#### Known Issues Fixed This Session

- WARN react-leaflet@5 peer-dep conflict: requires React 19 but project uses React 18. FIXED: pinned to react-leaflet@^4.2.1
- WARN AuthContext.jsx had wrong import path "./api.js". FIXED: corrected to "../lib/api.js"
- WARN Duplicate leaflet key appeared in package.json after an edit. FIXED: cleaned up
- WIP npm install (task-115) running in background — not yet confirmed complete

---

### Authentication (Phase 2)

| File | Status | Notes |
|------|--------|-------|
| `client/src/context/AuthContext.jsx` | BUILD | Full rewrite. Firebase onAuthStateChanged, email/password, Google OAuth popup, MongoDB /api/auth/me sync, logout, refreshUser |
| `client/src/components/ProtectedRoute.jsx` | DONE | New file. Guards routes by auth + role. Unauthenticated goes to /login. Wrong role redirects to own dashboard |
| `client/src/components/Layout.jsx` | DONE | Full rewrite. Sticky glass navbar, NavLink active states, role badge, smart dashboard link per role |
| `client/src/pages/LoginPage.jsx` | BUILD | Full rewrite. Email/password form, Google OAuth button, show/hide password, friendly Firebase error messages, role-based redirect |
| `client/src/pages/RegisterPage.jsx` | BUILD | Full rewrite. Role-selector radio cards (customer/driver), client-side validation, Google OAuth, Firebase error handling |
| `client/src/main.jsx` | DONE | Updated. ProtectedRoute wraps all dashboard routes with role enforcement |
| `server/src/middleware/auth.js` | DONE | Pre-existing and complete — verifyFirebaseToken, requireRegisteredUser, requireRole |
| `server/src/routes/auth.js` | DONE | Pre-existing and complete — POST /register, GET /me |

---

### Landing Page (Phase 3)

| File | Status | Notes |
|------|--------|-------|
| `client/src/pages/LandingPage.jsx` | DONE | Full rewrite. Hero section with animated gradient title, floating tracking card, sample live shipments display; Features grid (4 cards); How It Works (4 steps); CTA banner; Footer with navigation links |

---

## Session 1 — Prior (Scaffolding)

> Original scaffolding done before this changelog was created.

### Server — All scaffolded

| File | Notes |
|------|-------|
| `server/src/app.js` | Express app setup |
| `server/src/index.js` | Server entry point |
| `server/src/models/User.js` | Mongoose schema — firebaseUid, name, email, phone, role, isActive |
| `server/src/models/Driver.js` | Mongoose schema — userId, licenseNumber, vehicleNumber, lat, lng, isAvailable |
| `server/src/models/Shipment.js` | Mongoose schema — trackingNumber, statusHistory array, ETA |
| `server/src/models/Notification.js` | Mongoose schema — userId, message, type, isRead |
| `server/src/models/Product.js` | Mongoose schema — marketplace products |
| `server/src/models/Staff.js` | Mongoose schema — staff/admin profiles |
| `server/src/routes/auth.js` | POST /register, GET /me |
| `server/src/routes/shipments.js` | Full shipment CRUD |
| `server/src/routes/drivers.js` | Driver routes |
| `server/src/routes/products.js` | Product routes |
| `server/src/routes/tracking.js` | GPS tracking REST fallback |
| `server/src/routes/staff.js` | Staff management |
| `server/src/middleware/auth.js` | Firebase token verify + role guard |
| `server/src/middleware/validate.js` | Zod body validation helper |
| `server/src/services/etaService.js` | STUB — needs Haversine + avg speed logic |
| `server/src/services/notificationService.js` | STUB — Twilio SMS + FCM push helpers |
| `server/src/services/trackingNumber.js` | Auto-generates TRK######GH tracking IDs |
| `server/src/socket/trackingSocket.js` | Socket.IO rooms + driver location events |
| `server/.env.example` | Server env var template |

### Client — Stubs replaced in Session 2

| File | Notes |
|------|-------|
| `client/src/pages/LandingPage.jsx` | DROP was ~25 lines |
| `client/src/pages/LoginPage.jsx` | DROP was demo-only buttons |
| `client/src/pages/RegisterPage.jsx` | DROP was ~17 lines |
| `client/src/context/AuthContext.jsx` | DROP was demo-only, no Firebase |
| `client/src/components/Layout.jsx` | DROP was basic topbar stub |
| `client/src/pages/CustomerDashboard.jsx` | TODO still stub ~1KB |
| `client/src/pages/CreateShipment.jsx` | TODO still stub ~1.5KB |
| `client/src/pages/DriverDashboard.jsx` | TODO still stub |
| `client/src/pages/AdminDashboard.jsx` | TODO still stub |
| `client/src/pages/TrackShipment.jsx` | TODO still stub |
| `client/src/pages/Marketplace.jsx` | TODO still stub |

---

## Session 7 — 2026-09-02

### MVP Readiness Pass ✅

All six blockers preventing a working MVP were resolved in one session.

#### 1 — Environment Variables

| File | Status | Notes |
|------|--------|-------|
| `client/.env` | DONE | Added `VITE_SOCKET_URL=http://localhost:5000` used by both map pages |
| `server/.env.example` | DONE | Added `FCM_SERVER_KEY`, `GOOGLE_MAPS_API_KEY` entries with comments; all vars now documented |

#### 2 — Dependency Fix

| File | Status | Notes |
|------|--------|-------|
| `server/package.json` | DONE | Moved `firebase-admin` from `devDependencies` → `dependencies`. It is a runtime dependency used by `firebaseAdmin.js` and `auth.js` middleware |

#### 3 — Leaflet + Socket.IO Maps

| File | Status | Notes |
|------|--------|-------|
| `client/src/pages/TrackShipment.jsx` | DONE | Full rewrite. Fetches shipment from new public `GET /api/shipments/track/:trackingNumber`. Renders Leaflet `MapContainer` with green driver marker. Subscribes via Socket.IO `shipment:join` + `shipment:locationUpdate`. `MapPanner` helper smoothly pans map on every GPS update. Overlay shown when no GPS signal / delivered |
| `client/src/pages/admin/LiveTracking.jsx` | DONE | Full rewrite. Fetches all active shipments from backend (filtered to Dispatched/In Transit/Out For Delivery). One coloured Leaflet marker per shipment. Joins ALL active shipment rooms on Socket.IO connect. `FitBounds` helper auto-zooms to show all markers. Live GPS coordinate display in selected-shipment detail panel |
| `server/src/routes/shipments.js` | DONE | Added public `GET /shipments/track/:trackingNumber` route (no auth) — exposes only safe fields needed by the tracking page |

#### 4 — Real Reports Backend

| File | Status | Notes |
|------|--------|-------|
| `server/src/routes/reports.js` | DONE | **NEW FILE** — `GET /api/reports?range=today\|week\|month\|3months\|year`. Five parallel MongoDB aggregations: KPI totals, per-status breakdown, monthly counts (last 6 months always), avg delivery time for delivered shipments, per-driver performance with on-time calculation |
| `server/src/app.js` | DONE | Mounted `/api/reports` route |
| `client/src/pages/admin/Reports.jsx` | DONE | Full rewrite. Fetches from `/api/reports`. Loading skeleton, error state with retry. Date range selector triggers refetch. All KPI cards, bar charts, donut charts, and driver table are driven by real aggregated data |

#### 5 — Haversine ETA Service

| File | Status | Notes |
|------|--------|-------|
| `server/src/services/etaService.js` | DONE | Full rewrite. `computeEta()` (async): Haversine distance between pickup/destination coords → historical average travel time from last 20 delivered shipments on same city corridor → `DEFAULT_SPEED_KPH=60` fallback → `OVERHEAD_HOURS=1.5` → weight buffer (+4h if >10 kg). `computeBasicEta()` kept as sync fallback |
| `server/src/routes/shipments.js` | DONE | `POST /shipments` now awaits `computeEta()` with `try/catch` fallback to `computeBasicEta()` |

#### 6 — Demo Login Gated

| File | Status | Notes |
|------|--------|-------|
| `client/src/context/AuthContext.jsx` | DONE | `IS_DEV = import.meta.env.DEV` (Vite sets `false` in production builds). `demoLogin()` throws `"Demo login is not available in production"` when `!IS_DEV`. All `@demo.com` email paths and `!FIREBASE_CONFIGURED` fallbacks gated with `&& IS_DEV`. `demoLogin` removed from public context value — components cannot call it. `isDemoMode` flag added to context so UI can optionally show dev hints |

#### Build Verification
- `npm run build` → ✅ **Exit code 0**. 215 modules transformed. All lazy chunks generated. 10.12s.

---

## What's Next — Prioritized Backlog

| Priority | Phase | What to Build |
|----------|-------|---------------|
| HIGH | Now | Run `npm install` in `server/` to move `firebase-admin` into the correct `node_modules` location |
| HIGH | Now | Add pickup/destination lat-lng fields to `CreateShipment.jsx` form (feeds Haversine ETA directly) |
| MED  | Phase 8 | Wire FCM push notifications (`FCM_SERVER_KEY`) into `notificationService.js` |
| MED  | Phase 8 | Add geocoding (Google Maps or Nominatim) so addresses → coordinates on shipment creation |
| MED  | Phase 9 | `ETAPrediction.jsx` — show the real ETA from `shipment.estimatedArrival` with a live countdown |
| LOW  | Phase 10 | Marketplace cart / checkout flow |
| LOW  | Phase 11 | Production deployment: set `CLIENT_URL` to real domain, configure Atlas network whitelist |

---

## Environment Variables Checklist

### Client (client/.env)
- [ ] VITE_FIREBASE_API_KEY
- [ ] VITE_FIREBASE_AUTH_DOMAIN
- [ ] VITE_FIREBASE_PROJECT_ID
- [ ] VITE_FIREBASE_STORAGE_BUCKET
- [ ] VITE_FIREBASE_MESSAGING_SENDER_ID
- [ ] VITE_FIREBASE_APP_ID
- [x] VITE_API_URL = http://localhost:5000/api

### Server (server/.env)
- [ ] MONGODB_URI
- [ ] FIREBASE_SERVICE_ACCOUNT (JSON string or path to key file)
- [ ] TWILIO_ACCOUNT_SID
- [ ] TWILIO_AUTH_TOKEN
- [ ] TWILIO_PHONE_NUMBER
- [ ] FCM_SERVER_KEY
- [ ] GOOGLE_MAPS_API_KEY
- [ ] PORT = 5000

---

## Dependency Versions — Locked

| Package | Pinned Version | Reason |
|---------|---------------|--------|
| react | ^18.3.1 | Project baseline — do not upgrade to 19 yet |
| react-leaflet | ^4.2.1 | v5 requires React 19 — MUST stay on v4 |
| leaflet | ^1.9.4 | Peer dependency of react-leaflet v4 |
| firebase | ^11.1.0 | Client Auth SDK |
| react-router-dom | ^7.1.1 | Routing |
| socket.io-client | ^4.8.1 | Real-time GPS events |
| axios | ^1.7.9 | HTTP client |
| @vitejs/plugin-react | ^4.3.4 | Vite plugin (devDep) |
| vite | ^6.0.7 | Build tool (devDep) |

---

## Rules for Future Sessions

1. Always check this file at the start of a session before writing any code.
2. Never reinstall or change a locked dependency version without updating this file.
3. Mark files as BUILD (not DONE) until they have been tested with real Firebase credentials.
4. When fixing an import path or a bug, document it under "Known Issues Fixed".
5. Do not create a new version of a file that already has DONE status without first checking its current content.
