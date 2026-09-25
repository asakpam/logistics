# Intelligent AI Logistics Platform

An Intelligent Logistics Platform featuring real-time shipment tracking, role-based dashboards (Customer, Driver, Admin), digital address resolution, and driver verification workflows.

---

## 🏗 Project Architecture

This repository contains the complete Final Year Project implementation and documentation:

```
├── logistics-platform/
│   ├── client/          # React + Vite frontend application
│   └── server/          # Node.js + Express backend API & Socket.IO
├── docs/ & specs/       # Comprehensive architectural guides, diagrams & research
│   ├── QUICKSTART.md
│   ├── PROJECT_STATUS.md
│   ├── IMPLEMENTATION_SUMMARY.md
│   ├── TESTING_GUIDE.md
│   └── README_ENHANCED.md
└── diagrams/            # Architecture and data-flow diagrams
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Supabase account (or configured database instance)
- npm or yarn

### 1. Backend Setup
```bash
cd logistics-platform/server
cp .env.example .env
npm install
npm run dev
```

The server runs on `http://localhost:5001`. Ensure your `.env` contains:
- `PORT=5001`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

### 2. Frontend Setup
```bash
cd logistics-platform/client
cp .env.example .env
npm install
npm run dev
```

The client application runs on `http://localhost:3000` (or `http://localhost:5173`).

---

## ✨ Core Features

- **Multi-Role Access Control**: Unified secure authentication with dedicated views for Customers, Drivers, and Administrators.
- **Ghana Digital Address System**: Integration for precise location lookups and delivery addresses.
- **Driver Verification Pipeline**: Driver onboarding with identity verification and admin approval workflows.
- **Live Tracking & Status Updates**: Real-time shipment status transitions with Socket.IO updates.
- **Admin Management Console**: Overview of active shipments, drivers, users, and system notifications.

---

## 📚 Technical Documentation

- [Quickstart Guide](file:///QUICKSTART.md) - Rapid setup and test scenarios
- [Implementation Summary](file:///IMPLEMENTATION_SUMMARY.md) - Technical architecture & schema specifications
- [Testing Guide](file:///TESTING_GUIDE.md) - End-to-end verification checklist
- [Enhanced Platform Guide](file:///README_ENHANCED.md) - Feature deep-dive
