# 📊 Logistics Platform - Project Analysis

**Generated:** September 2, 2026  
**Student:** Asakpam Blessing | 11167338  
**Status:** In Development - MVP Phase

---

## 🎯 Project Overview

### Purpose
A full-stack intelligent logistics platform for Ghana that enables:
- **Customers** to create and track shipments in real-time
- **Drivers** to manage deliveries with GPS tracking
- **Admins** to oversee operations, assign drivers, and view analytics

### Tech Stack
| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18.3, Vite 6.0, React Router 7.1 |
| **Backend** | Node.js, Express 4.21, Socket.IO 4.8 |
| **Database** | MongoDB 8.x with Mongoose 8.9 |
| **Authentication** | Firebase Auth 11.1 + Firebase Admin 14.2 |
| **Real-time** | Socket.IO (WebSocket) |
| **Maps** | Leaflet 1.9 + React-Leaflet 4.2 |
| **Notifications** | Twilio SMS API |
| **Validation** | Zod 3.24 |
| **File Upload** | Multer 2.3 |

---

## 📁 Project Structure

```
logistics-platform/
├── client/                          # React Frontend (Port 3000)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx           # App shell with nav
│   │   │   └── ProtectedRoute.jsx   # Role-based route guard
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Firebase auth + user state
│   │   │   └── DataContext.jsx      # Global data fetching
│   │   ├── lib/
│   │   │   ├── api.js               # Axios instance with auth
│   │   │   └── firebase.js          # Firebase SDK config
│   │   ├── pages/
│   │   │   ├── [public]             # Landing, Login, Register, Track
│   │   │   ├── [customer]           # Dashboard, CreateShipment, MyShipments
│   │   │   ├── driver/              # Dashboard, GPSTracking, Deliveries
│   │   │   └── admin/               # Dashboard, Manage* pages
│   │   ├── main.jsx                 # App entry + routing
│   │   └── styles.css               # Global styles
│   ├── vite.config.js               # Dev server + proxy config
│   └── package.json
│
└── server/                          # Express Backend (Port 5001)
    ├── src/
    │   ├── config/
    │   │   └── db.js                # MongoDB connection
    │   ├── middleware/
    │   │   ├── auth.js              # Firebase token verification
    │   │   ├── upload.js            # Multer config (Ghana Card)
    │   │   └── validate.js          # Zod validation middleware
    │   ├── models/
    │   │   ├── User.js              # Central user account
    │   │   ├── Driver.js            # Driver profile + vehicle
    │   │   ├── Shipment.js          # Shipment lifecycle
    │   │   ├── Notification.js      # SMS/Push notifications
    │   │   ├── Product.js           # Marketplace items
    │   │   └── Staff.js             # Staff/admin records
    │   ├── routes/
    │   │   ├── auth.js              # Registration + /me
    │   │   ├── users.js             # User CRUD
    │   │   ├── shipments.js         # Shipment management
    │   │   ├── tracking.js          # GPS location updates
    │   │   ├── drivers.js           # Driver approval + assignment
    │   │   ├── products.js          # Marketplace API
    │   │   ├── reports.js           # Analytics
    │   │   └── staff.js             # Staff management
    │   ├── services/
    │   │   └── [notification, ETA, etc.]
    │   ├── socket/
    │   │   └── trackingSocket.js    # Real-time location broadcast
    │   ├── app.js                   # Express app factory
    │   └── index.js                 # Server entry + Socket.IO
    ├── uploads/                     # Ghana Card images storage
    ├── .env                         # Environment config
    └── package.json
```

---

## 🗄️ Database Schema

### Collections Overview
| Collection | Records | Purpose |
|-----------|---------|---------|
| `users` | All accounts | Central identity for customers, drivers, admins |
| `drivers` | Driver profiles | Vehicle info, license, location, approval status |
| `shipments` | All deliveries | Package details, status history, tracking |
| `notifications` | Alert history | SMS/Push notification log |
| `products` | Marketplace items | For future marketplace feature |
| `staff` | Admin/staff | Internal team accounts |

### User Model
```javascript
{
  firebaseUid: String (unique, indexed),
  name: String (required),
  email: String (unique, required),
  phone: String,
  avatar: String (URL),
  role: Enum ["customer", "driver", "staff", "admin"],
  status: Enum ["pending", "approved", "rejected", "suspended", "active"],
  isActive: Boolean,
  address: {
    street: String,
    city: String,
    region: String,
    country: String (default: "Ghana")
  },
  fcmToken: String,
  preferences: {
    smsAlerts: Boolean,
    pushAlerts: Boolean,
    emailAlerts: Boolean
  },
  deletedAt: Date (soft delete),
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships:**
- `User 1:1 Driver` (when role === "driver")
- `User 1:∞ Shipment` (as customer)
- `User 1:∞ Notification`

### Driver Model
```javascript
{
  userId: ObjectId → User (required, unique),
  licenseNumber: String (required),
  vehicleNumber: String (required),
  vehicleType: String (default: "Van"),
  digitalAddress: String (Ghana Digital Address: GA-001-1234),
  ghanaCardImage: String (filename),
  status: Enum ["pending", "approved", "rejected", "suspended"],
  currentLatitude: Number,
  currentLongitude: Number,
  isAvailable: Boolean,
  lastLocationAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Shipment Model
```javascript
{
  trackingNumber: String (unique, indexed),
  customerId: ObjectId → User (required),
  driverId: ObjectId → Driver,
  pickupAddress: String (required),
  destinationAddress: String (required),
  receiverName: String (required),
  receiverPhone: String (required),
  packageType: String (required),
  weight: Number (min: 0.1),
  deliveryFee: Number (min: 0),
  status: Enum ["Pending", "Assigned", "Dispatched", "In Transit", 
                "Out For Delivery", "Delivered", "Cancelled"],
  statusHistory: [{
    status: String,
    note: String,
    changedBy: ObjectId → User,
    changedAt: Date
  }],
  currentLatitude: Number,
  currentLongitude: Number,
  estimatedArrival: Date,
  pickupDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Authentication & Authorization

### Firebase Authentication Flow
```
1. User registers → Firebase creates account (email/password or Google OAuth)
2. Frontend receives Firebase ID token
3. Backend verifies token via Firebase Admin SDK
4. Backend syncs user profile to MongoDB (firebaseUid as foreign key)
5. JWT token stored in axios headers for all API calls
```

### Role-Based Access Control (RBAC)
| Role | Permissions |
|------|------------|
| **Customer** | Create/track shipments, view own orders, update profile |
| **Driver** | View assigned deliveries, update GPS location, change delivery status |
| **Admin** | Full CRUD on users/shipments/drivers, assign drivers, view analytics |
| **Staff** | Similar to admin (future differentiation) |

### Route Protection
- **Backend:** `verifyFirebaseToken` middleware + `requireRole()` checks
- **Frontend:** `<ProtectedRoute role={["customer", "admin"]}>` wrapper component

---

## 🚀 Key Features

### ✅ Implemented (MVP Phase)

#### 1. **User Registration & Authentication**
- Firebase email/password + Google OAuth
- Role selection (Customer/Driver)
- Driver approval workflow (pending → approved)
- Ghana Card image upload for driver verification
- Address collection (street, city, region)

#### 2. **Shipment Management**
- Create shipment with pickup/destination
- Auto-generated tracking number (TRK...)
- Status lifecycle with history tracking
- Customer view of all their shipments

#### 3. **Driver Management**
- Admin dashboard to review pending drivers
- View driver details: license, vehicle, Ghana Card
- Approve/reject driver applications
- Driver assignment to shipments

#### 4. **Real-Time GPS Tracking** (In Progress)
- Socket.IO rooms per shipment (`shipment:{trackingNumber}`)
- Driver broadcasts location every ~15 seconds
- Customer sees live map updates
- Fallback REST API for location updates

#### 5. **Role-Based Dashboards**
- **Customer Dashboard:** Shipment stats, recent orders, notifications
- **Driver Dashboard:** Assigned deliveries, active tracking, status updates
- **Admin Dashboard:** User/driver/shipment management, analytics

#### 6. **Notification System** (Partial)
- SMS notifications via Twilio
- Push notifications via FCM
- In-app notification center
- Trigger on status changes (Dispatched, In Transit, Delivered)

### 🚧 In Development

#### 7. **ETA Prediction Module**
- Algorithm: Distance calculation + historical avg speed + buffer
- Dynamic recalculation on location updates
- Display predicted arrival time to customer

#### 8. **Marketplace**
- Product listing by customers/vendors
- Category browsing
- Product details page
- Future: Cart + checkout integration

### 📋 Planned (Stretch Features)

- Mobile Money payment integration (MTN, Vodafone)
- Advanced AI-based ETA (ML model + traffic/weather data)
- Route optimization for drivers
- QR code scanning for packages
- Native mobile apps (React Native)
- Multi-language support (English + Twi)
- Driver performance ratings
- Automated dispatch system

---

## 🔄 User Flows

### Customer Flow
```
Landing Page → Register (role: customer) → Customer Dashboard
    ↓
Create Shipment → Fill details → Submit
    ↓
View "My Shipments" → Click shipment → Track on Map (live)
    ↓
Receive SMS/Push when status changes
    ↓
Shipment delivered → View receipt
```

### Driver Flow
```
Landing Page → Register (role: driver) → Upload Ghana Card → Pending Approval
    ↓
Admin reviews → Approved
    ↓
Driver Dashboard → View assigned deliveries
    ↓
Start delivery → Enable GPS tracking → Location broadcasts live
    ↓
Update status: Dispatched → In Transit → Out For Delivery → Delivered
    ↓
Delivery Confirmation → Customer receives notification
```

### Admin Flow
```
Admin Dashboard → Manage Drivers → Review pending drivers
    ↓
View driver details (license, vehicle, Ghana Card image)
    ↓
Approve driver → Driver can now receive assignments
    ↓
Manage Shipments → Assign driver to shipment
    ↓
Live Tracking → Monitor all active deliveries on map
    ↓
Reports → View analytics (delivery rate, avg ETA accuracy)
```

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register new user (customer/driver) |
| GET | `/api/auth/me` | Token | Get current user profile |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin | List all users |
| GET | `/api/users/:id` | Token | Get user by ID |
| PUT | `/api/users/:id` | Token | Update user profile |
| DELETE | `/api/users/:id` | Admin | Soft delete user |

### Shipments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/shipments` | Customer | Create new shipment |
| GET | `/api/shipments` | Token | List shipments (filtered by role) |
| GET | `/api/shipments/:id` | Token | Get shipment details |
| PUT | `/api/shipments/:id/status` | Driver | Update shipment status |
| PUT | `/api/shipments/:id/assign` | Admin | Assign driver to shipment |
| DELETE | `/api/shipments/:id` | Admin | Cancel/delete shipment |

### Tracking
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/tracking/:trackingNumber` | None | Get shipment tracking info |
| POST | `/api/tracking/location` | Driver | Update driver location (REST fallback) |

### Drivers
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/drivers` | Admin | List all drivers |
| GET | `/api/drivers/pending` | Admin | List pending driver approvals |
| PUT | `/api/drivers/:id/approve` | Admin | Approve driver application |
| PUT | `/api/drivers/:id/reject` | Admin | Reject driver application |
| GET | `/api/drivers/:id/ghana-card` | Admin | Serve Ghana Card image |

### Products (Marketplace)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | None | List marketplace products |
| POST | `/api/products` | Token | Create product listing |
| GET | `/api/products/:id` | None | Get product details |
| PUT | `/api/products/:id` | Owner | Update product |
| DELETE | `/api/products/:id` | Owner | Delete product |

### Reports (Analytics)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reports/analytics` | Admin | Get platform statistics |

---

## 🔌 Socket.IO Events

### Tracking Channel
| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `driver:join` | Client → Server | `{ trackingNumber, driverId }` | Driver joins shipment room |
| `driver:location` | Client → Server | `{ trackingNumber, lat, lng, timestamp }` | Driver sends GPS update |
| `shipment:locationUpdate` | Server → Clients | `{ trackingNumber, lat, lng, timestamp }` | Broadcast to all tracking that shipment |
| `shipment:statusChange` | Server → Clients | `{ trackingNumber, status, updatedAt }` | Notify status change |
| `disconnect` | Client | - | Clean up driver from rooms |

### Room Structure
- Room name: `shipment:{trackingNumber}`
- Participants: Assigned driver + customer + admins

---

## 🐛 Known Issues & Current Bugs

### 🔴 Critical
1. **Driver registration role bug (IN PROGRESS - FIX APPLIED)**
   - **Issue:** Drivers were being registered as "customer" instead of "driver"
   - **Root cause:** `onAuthStateChanged` listener in AuthContext was firing before backend registration completed
   - **Fix:** Modified RegisterPage to set `activeLoginRef` flag before Firebase account creation
   - **Status:** Testing required - awaiting user confirmation

### 🟡 Medium Priority
2. **Ghana Card image display in admin review**
   - **Issue:** Ghana Card images not showing in admin driver review modal
   - **Cause:** File upload proxy issue + missing image serve endpoint
   - **Status:** Backend serves at `/uploads/:filename`, need to verify frontend integration

3. **Vite proxy misconfiguration**
   - **Issue:** Proxy was pointing to port 5000, but backend runs on 5001
   - **Fix:** Updated vite.config.js to point to correct port
   - **Status:** Fixed, needs testing

### 🟢 Low Priority / Enhancement
4. **Driver address fields missing in registration form**
   - **Added:** Street, city, region fields to registration
   - **Status:** Fixed

5. **No error handling for file upload size limits**
   - **Current:** 5MB limit on Ghana Card images
   - **Enhancement:** Better user feedback on upload errors

---

## ✅ Recent Fixes & Changes

### Driver Registration Fix (Sept 2, 2026)
**Problem:** Driver registration was creating users with role="customer"

**Changes Made:**
1. **vite.config.js** - Fixed proxy target from 5000 → 5001
2. **AuthContext.jsx** - Added `setActiveLoginFlag()` function to control auth listener
3. **RegisterPage.jsx** - Driver registration now:
   - Sets `activeLoginRef` flag BEFORE Firebase account creation
   - Creates Firebase account directly (not through `registerWithEmail`)
   - Sends ALL driver data + Ghana Card in ONE API call to `/auth/register`
   - Resets flag in finally block to allow normal auth flow after registration
4. **auth.js (backend)** - Updated to handle existing users (upsert logic)
   - If user exists (from auth listener), update to driver role
   - If user doesn't exist, create new user
   - Validates driver-specific fields (license, vehicle, Ghana Card)
   - Creates/updates Driver record with all details

**Testing Status:** Awaiting user testing

---

## 📊 Current State Summary

### Working Features ✅
- User registration (customer + driver with Ghana Card upload)
- Firebase authentication (email/password + Google OAuth)
- Role-based routing and dashboard access
- Shipment creation by customers
- Admin driver review and approval workflow
- User management (list, view, activate/deactivate)
- Basic shipment listing and status display
- Protected routes with role enforcement

### In Progress 🚧
- Driver registration role assignment (fix applied, testing pending)
- Real-time GPS tracking (Socket.IO events defined, needs testing)
- ETA calculation module (algorithm defined, needs implementation)
- Notification service (Twilio integrated, trigger logic needs work)

### Not Started 📋
- Marketplace product listings
- Payment integration
- Advanced analytics dashboard
- Driver performance ratings
- Mobile apps
- Route optimization

---

## 🎓 Academic Context

### Course
Final Year Project - Computer Science/Software Engineering

### Learning Objectives Demonstrated
1. **Full-stack development** - React frontend + Node.js backend
2. **Database design** - MongoDB schema with relationships
3. **Real-time systems** - WebSocket implementation with Socket.IO
4. **Authentication & security** - Firebase Auth + JWT tokens
5. **API design** - RESTful endpoints + validation
6. **Cloud services integration** - Firebase, Twilio, Maps API
7. **Version control** - Git (repository structure evident)
8. **Software architecture** - MVC pattern, separation of concerns

### Unique Features for Ghana Market
- Ghana Digital Address support (GA-001-1234 format)
- Ghana Card verification for driver approval
- Ghana-centric regions (Greater Accra, Ashanti, etc.)
- SMS notifications via local telcos
- Currency in Ghana Cedis (GHS)

---

## 🚀 Deployment Readiness

### Current Status: **Development**

### Before Production:
- [ ] Complete driver registration bug testing
- [ ] Implement comprehensive error handling
- [ ] Add input validation on all forms
- [ ] Set up environment variables for production
- [ ] Configure MongoDB Atlas for production
- [ ] Set up Firebase project for production
- [ ] Add rate limiting and security headers
- [ ] Implement request logging
- [ ] Add unit and integration tests
- [ ] Set up CI/CD pipeline
- [ ] Configure domain and SSL certificate
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Deploy backend to Railway/Render/Heroku
- [ ] Set up monitoring and error tracking (Sentry)

### Recommended Deployment Stack:
- **Frontend:** Vercel or Netlify
- **Backend:** Railway, Render, or Heroku
- **Database:** MongoDB Atlas (M0 free tier or M10)
- **File Storage:** AWS S3 or Cloudinary (for Ghana Card images)
- **CDN:** Cloudflare
- **Monitoring:** Sentry + Logtail

---

## 📚 Documentation Status

| Document | Status | Location |
|----------|--------|----------|
| Implementation Plan | ✅ Complete | IMPLEMENTATION_PLAN.md |
| Project Analysis | ✅ Complete | PROJECT-ANALYSIS.md (this file) |
| API Documentation | 🚧 Partial | Inline in code + this document |
| User Manual | ❌ Not started | - |
| Deployment Guide | ❌ Not started | - |
| Test Plan | ❌ Not started | - |
| Changelog | ✅ Complete | CHANGELOG.md |

---

## 🔗 Quick Links

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001/api
- **API Health Check:** http://localhost:5001/api/health
- **MongoDB:** mongodb://127.0.0.1:27017/logistics-platform

---

## 👥 Contributors

- **Asakpam Blessing** - Lead Developer (Student ID: 11167338)
- **Project Supervisor:** [TBD]
- **Institution:** [TBD]

---

## 📝 Notes for Future Development

1. **Performance Optimization**
   - Implement pagination for all list endpoints
   - Add Redis caching for frequently accessed data
   - Optimize MongoDB queries with proper indexing
   - Lazy load images and maps

2. **Security Enhancements**
   - Implement rate limiting per user/IP
   - Add CSRF protection
   - Sanitize all user inputs
   - Encrypt sensitive data at rest
   - Regular security audits

3. **User Experience**
   - Add loading skeletons instead of spinners
   - Implement optimistic UI updates
   - Add offline support with service workers
   - Improve mobile responsiveness
   - Add onboarding tours

4. **Code Quality**
   - Add ESLint + Prettier configuration
   - Write unit tests (Jest + React Testing Library)
   - Add E2E tests (Playwright or Cypress)
   - Set up code coverage tracking
   - Document all components with JSDoc

---

**Last Updated:** September 2, 2026  
**Version:** 0.1.0 (MVP)
