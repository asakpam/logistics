# Changelog

All notable changes to the Logistics Platform project are documented here.

---

## [Unreleased] — 2026-09-24

### 🔄 Major: Full Supabase Migration (Auth + Database + Storage)

The entire backend and authentication stack has been migrated from Firebase + MongoDB to **Supabase** (PostgreSQL + Supabase Auth + Supabase Storage).

---

### Added

#### Database & Schema
- `server/supabase-complete-setup.sql` — Full PostgreSQL schema including:
  - `public.users` table (synced from Supabase Auth via trigger)
  - `public.drivers` table with Ghana Card image reference
  - `public.shipments` table with status history (JSONB)
  - `public.products` table
  - `public.notifications` table
  - `public.shipment_tracking` table for live GPS updates
  - `public.reviews` table
  - Row-Level Security (RLS) policies for all tables
  - `SECURITY DEFINER` helper functions (`current_user_id()`, `is_admin()`) to avoid RLS recursion
  - `handle_new_user()` trigger — auto-syncs every new Supabase Auth user into `public.users`

#### Backend — Server (`server/src/`)
- `src/lib/supabase.js` — Supabase client singleton for backend use (service role key)
- `src/middleware/auth.js` — Replaced Firebase token verification with `verifySupabaseToken` (JWT validation via Supabase)
- `src/middleware/upload.js` — Ghana Card image upload via Supabase Storage (replaced local disk storage)
- `src/models/User.js` — Rewrote all methods (`create`, `findById`, `findByEmail`, `findByAuthId`, `findByIdAndUpdate`, `findAll`) to use Supabase PostgreSQL
- `src/models/Driver.js` — Rewrote all methods to use Supabase PostgreSQL
- `src/models/Shipment.js` — Rewrote all methods to use Supabase PostgreSQL
- `src/models/Product.js` — Rewrote all methods to use Supabase PostgreSQL
- `src/models/Notification.js` — Rewrote all methods to use Supabase PostgreSQL
- `src/routes/auth.js` — New registration handler supporting both `customer` and `driver` roles:
  - Customer: immediate `active` status
  - Driver: `pending` status, awaiting admin approval
  - Syncs `auth_id` from Supabase Auth JWT into `public.users`
  - Handles multipart/form-data for Ghana Card upload (drivers only)
- `src/routes/drivers.js` — `PATCH /:id/approve` endpoint for admin driver approval
- Admin credentials seeded via `supabase-complete-setup.sql` (bcrypt-hashed password)

#### Frontend — Client (`client/src/`)
- `src/lib/supabase.js` — Supabase JS client for frontend (anon key)
- `src/context/AuthContext.jsx` — Fully rewritten to use Supabase Auth:
  - `registerWithEmail()` — Signs up via `supabase.auth.signUp()`, immediately sets session token, syncs profile to backend
  - `loginWithEmail()` — Signs in via `supabase.auth.signInWithPassword()`, syncs backend profile
  - `loginWithGoogle()` — OAuth via `supabase.auth.signInWithOAuth()`
  - `logout()` — Signs out via `supabase.auth.signOut()`
  - `onAuthStateChange` listener keeps session in sync
  - Race-condition guard (`activeLoginRef`) prevents listener overwriting explicit login state
  - Graceful fallback to `buildLocalUser()` if backend sync fails
- `src/pages/RegisterPage.jsx` — Updated to call `registerWithEmail()` from new AuthContext
- `src/pages/LoginPage.jsx` — Updated to call `loginWithEmail()` from new AuthContext
- `src/pages/ForgotPassword.jsx` — Updated to use `supabase.auth.resetPasswordForEmail()`
- `src/pages/ResetPassword.jsx` — Updated to use `supabase.auth.updateUser()`

---

### Changed

- **Auth provider**: Firebase → Supabase Auth
- **Database**: MongoDB (Mongoose) → Supabase PostgreSQL (direct Supabase client calls)
- **File storage**: Local disk (`/uploads`) → Supabase Storage bucket (`ghana-cards`)
- **Backend port**: Updated to `5001` (was `5000`)
- **README.md**: Reflects outdated Firebase/MongoDB references (pending update)

---

### Fixed

- **Email confirmation blocking registration**: Disabled "Confirm email" in Supabase Dashboard (Authentication → Providers → Email) so users receive an authenticated session immediately upon `signUp()` without needing to click a confirmation link
- **RLS infinite recursion**: Resolved policy recursion on `public.users` by using `SECURITY DEFINER` functions instead of inline policy queries
- **Auth ID sync**: Fixed `auth_id` not being written to `public.users` on first registration — backend now explicitly sets `authId` from the verified JWT
- **Driver approval workflow preserved**: Driver `status=pending` is set on registration; only admin can approve via `PATCH /api/drivers/:id/approve` — this is completely separate from email confirmation
- **Ghana Card document retrieval & display**: Added `/api/drivers/:id/ghana-card-url` endpoint to generate signed URLs from Supabase Storage private bucket `ghana-cards`, and updated `AdminDashboard.jsx` to load and display the verification image dynamically
- **Admin Driver Application Review modal layout & scrolling**: Resolved viewport overflow where the modal extended beyond the screen hiding Approve and Reject buttons; structured `.modal-card` with `max-height: 90vh; display: flex; flex-direction: column; overflow: hidden;`, a fixed header, an independently scrollable body (`flex: 1; overflow-y: auto; min-height: 0;`), and a fixed action footer keeping Approve and Reject buttons permanently visible in the viewport without page zooming or scrolling

---

### Security

- All protected routes verified with Supabase JWT (`verifySupabaseToken` middleware)
- RLS policies enforce per-role data access at the database level
- Service role key used only on the server; anon key used on the client
- Admin role gated by `is_admin()` function checked in both RLS policies and API middleware

---

### Migration Notes

> The following manual steps were performed in the Supabase Dashboard and are **not** reproducible via code alone:
> - Ran `supabase-complete-setup.sql` in the SQL Editor to create all tables, triggers, and RLS policies
> - Disabled **"Confirm email"** under Authentication → Providers → Email
> - Verified the `handle_new_user` trigger is active in the Database → Triggers panel

---

## [0.1.0] — Initial Scaffold (Pre-Migration)

- React + Vite client with landing, dashboard, tracking, shipment creation, driver, admin, and marketplace screens
- Express API with MongoDB/Mongoose models for users, drivers, shipments, products, and notifications
- Firebase Auth verification on protected routes
- Role-based access control (customer / driver / admin)
- Shipment status history and live-location update rules
- Socket.IO tracking channel with assigned-driver checks
