# Logistics Platform

Full-stack MVP scaffold for the Logistics final year project.

## What Is Included

- React + Vite client with landing, dashboard, tracking, shipment creation, driver, admin, and marketplace screens.
- Express API with MongoDB models for users, drivers, shipments, products, and notifications.
- Firebase Auth verification on protected routes.
- Role-based access control for customers, drivers, and admins.
- Shipment status history and safer live-location update rules.
- Socket.IO tracking channel with assigned-driver checks.

## MVP Scope

Build these features first:

1. Firebase login/register.
2. Customer creates shipment.
3. Admin assigns driver.
4. Assigned driver updates status and GPS location.
5. Customer tracks shipment status/location.
6. Status-change notifications.

Keep marketplace, payment, route optimization, and advanced AI ETA as stretch features until the MVP works well.

## Server Setup

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

The server expects:

- `MONGODB_URI`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- optional Twilio credentials for SMS

## Client Setup

```bash
cd client
npm install
npm run dev
```

The client uses `VITE_API_URL` when provided, otherwise it calls `http://localhost:5000/api`.
