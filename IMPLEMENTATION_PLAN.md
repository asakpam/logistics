# Logistics Platform — Project Implementation Plan
**Student:** Asakpam Blessing | 11167338  
**Tech Stack:** React · Tailwind CSS · Node.js · Express · MongoDB · Firebase Auth · Socket.IO · Google Maps API · Twilio · FCM

---

## Overview

The Logistics Platform is a full-stack web application serving three user roles:
- **Customer** — create/track shipments, view ETA, receive notifications, browse marketplace
- **Driver** — view assigned deliveries, share live GPS location, update status
- **Admin** — manage users, shipments, drivers, view analytics

---

## Project Structure

```
logistics-platform/
├── client/                  # React + Vite + Tailwind CSS
│   └── src/
│       ├── pages/           # One file per route/screen
│       ├── components/      # Reusable UI components
│       ├── context/         # Auth, Socket context
│       ├── hooks/           # useGeolocation, useSocket, etc.
│       └── lib/             # Firebase config, Axios instance
│
└── server/                  # Node.js + Express
    └── src/
        ├── models/          # Mongoose schemas
        ├── routes/          # Express route handlers
        ├── controllers/     # Business logic
        ├── middleware/       # Auth guards
        └── services/        # Twilio, FCM, ETA, Socket logic
```

---

## Phase 1 — Project Scaffolding

**Goal:** Set up both the client and server projects with all dependencies configured.

### MVP Improvement Notes
- Use Firebase Auth as the only authentication authority; MongoDB stores `firebaseUid`, profile data, role, and active status, not passwords.
- Protect all shipment-management routes with Firebase token verification and role-based access control.
- Allow only admins to assign drivers and only the assigned driver to publish live location updates.
- Keep the first build focused on authentication, shipment creation, driver assignment, live tracking, status updates, and notifications.
- Treat marketplace, advanced AI ETA, payments, and route optimization as stretch/future features unless the MVP is complete.

### Client Setup
- Create React app using Vite
- Install: `tailwindcss`, `react-router-dom`, `axios`, `socket.io-client`, `leaflet`, `firebase`
- Configure Tailwind CSS with a custom design system (colors, fonts)
- Set up React Router with base layout (Navbar, sidebar)

### Server Setup
- Create Node.js + Express app
- Install: `express`, `mongoose`, `socket.io`, `cors`, `dotenv`, `twilio`, `firebase-admin`, `zod`
- Connect to MongoDB Atlas
- Create `.env` file with: MongoDB URI, Firebase credentials, Twilio API keys, Google Maps API key

---

## Phase 2 — Authentication & Role-Based Access

**Wireframes:** Login (#8), Register (#9)  
**Flowchart:** User Flow → Select Role

### Backend
| File | Purpose |
|------|---------|
| `models/User.js` | Fields: id, firebaseUid, name, email, phone, role, avatar, isActive, createdAt |
| `models/Driver.js` | Fields: id, userId, licenseNumber, vehicleNumber, lat, lng, isAvailable |
| `routes/auth.js` | POST /register · GET /me |
| `middleware/auth.js` | `verifyToken` — decodes Firebase JWT · `requireRole(role)` — role gate |

### Frontend
| File | Purpose |
|------|---------|
| `pages/Login.jsx` | Email/password form + Google OAuth button |
| `pages/Register.jsx` | Full name, email, phone, password, role selector |
| `context/AuthContext.jsx` | Firebase `onAuthStateChanged`, persists user session |
| `components/ProtectedRoute.jsx` | Redirect unauthenticated users, enforce role routing |

---

## Phase 3 — Landing Page

**Wireframe:** Screen #1

| Component | Content |
|-----------|---------|
| `Navbar` | Logo, nav links, Login + Sign Up buttons |
| `HeroSection` | "Delivering Trust, Every Step of the Way" · Track + Create CTAs |
| `FeaturesSection` | 4 cards: Real-time Tracking · Predictive ETA · Notifications · Secure & Reliable |
| `TrackSearch` | Input box — enter tracking number → navigate to `/track/:id` |
| `Footer` | Company info, links |

---

## Phase 4 — Shipment Management

**Wireframes:** Create Shipment (#4), Customer Dashboard (#2)  
**Flowchart:** Shipment Lifecycle

### Shipment Status Lifecycle
```
Pending → Assigned → Dispatched → In Transit → Out For Delivery → Delivered
                                                                 → Cancelled
```

### Backend
| File | Purpose |
|------|---------|
| `models/Shipment.js` | All shipment fields + `statusHistory[]` array for timeline |
| `routes/shipments.js` | POST /shipments · GET /shipments · GET /:id · PUT /:id · DELETE /:id |
| `services/trackingNumber.js` | Auto-generates unique tracking ID (e.g., TRK123456GH) |

### Frontend
| File | Purpose |
|------|---------|
| `pages/CreateShipment.jsx` | Left panel: Sender/Receiver info · Right panel: Package details, pickup date |
| `pages/CustomerDashboard.jsx` | Stats row (Total/In Transit/Delivered/Pending), shipments table, donut chart, notifications |

---

## Phase 5 — Real-Time GPS Tracking

**Wireframes:** Track Shipment Map (#3), Driver App (#5)  
**Flowcharts:** GPS Tracking Flow, Shipment Lifecycle

### How It Works (Socket.IO Loop)
```
Driver enables GPS → Browser Geolocation API captures coords
  → Socket emit: driver:location { lat, lng, trackingNumber }
    → Server receives → updates MongoDB → broadcasts: shipment:locationUpdate
      → Customer tracking page receives → map marker moves in real time
```

### Backend
| File | Purpose |
|------|---------|
| `socket/trackingSocket.js` | Rooms: `shipment:{trackingNumber}` · Events: driver:join, driver:location, shipment:locationUpdate |
| `routes/tracking.js` | POST /api/tracking/location (REST fallback) · GET /api/tracking/:trackingNumber |

### Frontend
| File | Purpose |
|------|---------|
| `hooks/useGeolocation.js` | Wraps `navigator.geolocation.watchPosition`, emits every ~15 seconds |
| `pages/TrackShipment.jsx` | Left: Tracking info + timeline · Right: Live map with driver marker |
| `pages/DriverDashboard.jsx` | 4 tabs: Home (assigned list) · Active Tracking (map + timer) · Update Status · Profile |

---

## Phase 6 — Notification Engine

**Wireframe:** Notifications page (#6)  
**Flowchart:** Notification Engine

### Trigger Rules
| Status Change | SMS (Twilio) | Push (FCM) |
|--------------|:---:|:---:|
| Dispatched | ✅ | ✅ |
| In Transit | ✅ | ✅ |
| Delivered | ✅ | ✅ |

### Backend
| File | Purpose |
|------|---------|
| `models/Notification.js` | Fields: id, userId, message, type, isRead, createdAt |
| `services/notificationService.js` | `sendSMS(phone, msg)` · `sendPush(token, title, body)` · `notifyStatusChange(shipment, status)` |

### Frontend
| File | Purpose |
|------|---------|
| `pages/Notifications.jsx` | Tabs: All · SMS · Push · "Mark all as read" · "Load More" |

---

## Phase 7 — Admin Dashboard

**Wireframe:** Admin Dashboard (#7)  
**Flowchart:** User Flow → Admin path

### Frontend Pages
| Page | Features |
|------|---------|
| `AdminDashboard.jsx` | Sidebar nav, stats row, recent shipments table, line chart |
| `admin/ManageUsers.jsx` | User list, activate/deactivate/delete |
| `admin/ManageShipments.jsx` | All shipments, filters by status/date, assign driver modal |
| `admin/ManageDrivers.jsx` | Driver list, availability toggle, last seen location |

### Backend
| Route | Purpose |
|-------|---------|
| `GET /api/admin/analytics` | Totals: users, shipments, delivery rate, avg ETA accuracy |
| `PUT /api/admin/drivers/:id/assign` | Assign driver to shipment, triggers status → Assigned |

---

## Phase 8 — ETA Prediction Module

**Flowchart:** ETA Prediction Flow

### Algorithm
```
On Shipment Created:
  1. Extract: Pickup Location + Destination + Package Type
  2. Calculate Distance (Haversine formula or Google Distance Matrix)
  3. Query historical deliveries for same zone → get average speed
  4. ETA = (Remaining Distance / Avg Speed) + buffer
  5. Store ETA in Shipment document
  6. Display to customer

On Each Location Update:
  7. Recalculate remaining distance from driver's current coords
  8. Update ETA dynamically
```

### Backend
| File | Purpose |
|------|---------|
| `services/etaService.js` | `calculateDistance(origin, dest)` · `getHistoricalAvgSpeed(zone)` · `computeETA(shipmentId)` |

---

## Phase 9 — Marketplace

**Wireframe:** Products / Marketplace (#10)

### Backend
| File | Purpose |
|------|---------|
| `models/Product.js` | Fields: id, ownerId, title, description, price, imageUrl, category, createdAt |
| `routes/products.js` | POST /products · GET /products (with ?category=) · PUT /:id · DELETE /:id |

### Frontend
| File | Purpose |
|------|---------|
| `pages/Marketplace.jsx` | Search bar, category sidebar, featured products grid (GHS pricing), "Add to Cart" |

---

## Phase 10 — Profile & Settings

| File | Features |
|------|---------|
| `pages/Profile.jsx` | View/edit: name, phone, email, avatar upload |
| Driver tab | Vehicle number, license number, bio |

---

## API Reference Summary

```
Authentication
  POST   /api/auth/register
  GET    /api/auth/me

Users
  GET    /api/users
  GET    /api/users/:id
  PUT    /api/users/:id

Shipments
  POST   /api/shipments
  GET    /api/shipments
  GET    /api/shipments/:id
  PUT    /api/shipments/:id/status
  PUT    /api/shipments/:id/assign

Tracking
  POST   /api/tracking/location
  GET    /api/tracking/:trackingNumber

Drivers
  GET    /api/drivers
  POST   /api/drivers/me

Products
  POST   /api/products
  GET    /api/products

Admin
  GET    /api/admin/analytics
  PUT    /api/admin/drivers/:id/assign
```

---

## Database Collections

| Collection | Key Fields |
|-----------|-----------|
| `users` | id, name, email, phone, role, avatar, createdAt |
| `drivers` | id, userId, licenseNumber, vehicleNumber, lat, lng, isAvailable |
| `shipments` | id, trackingNumber, customerId, driverId, pickup, destination, status, statusHistory[], estimatedArrival, lat, lng |
| `products` | id, ownerId, title, description, price, imageUrl, category |
| `notifications` | id, userId, message, type, isRead, createdAt |

---

## Screens Summary (from Wireframes)

| # | Screen | Route | Role |
|---|--------|-------|------|
| 1 | Landing Page | `/` | Public |
| 2 | Customer Dashboard | `/dashboard/customer` | Customer |
| 3 | Track Shipment (Map) | `/track/:trackingNumber` | Public/Customer |
| 4 | Create Shipment | `/shipments/create` | Customer |
| 5 | Driver Dashboard | `/dashboard/driver` | Driver |
| 6 | Notifications | `/notifications` | All |
| 7 | Admin Dashboard | `/dashboard/admin` | Admin |
| 8 | Login | `/login` | Public |
| 9 | Register | `/register` | Public |
| 10 | Marketplace | `/marketplace` | Public/Customer |

---

## Future Features (Post-Submission)
- Full GPS hardware integration (vehicle trackers)
- AI-based ETA using machine learning + traffic/weather data
- Native Android/iOS app for drivers
- Mobile Money payment integration (MTN, Vodafone, AirtelTigo)
- QR Code / Barcode scanning for packages
- Route optimization algorithm
- Integration with external logistics APIs
