# Backend Deployment Quickstart — SFG Logistics

This guide walks you through deploying the Express + Socket.IO backend server in under 3 minutes so real-time GPS tracking, bookings, driver approvals, and delivery confirmations work in production.

---

## Why the Backend Must Be Deployed Separately from Vercel

| Component | Platform | Why |
| :--- | :--- | :--- |
| **Frontend** (`client/`) | **Vercel** | Static Single Page App (React + Vite) |
| **Backend** (`server/`) | **Railway / Render** | Needs persistent WebSocket server (Socket.IO) for live GPS location streaming. Serverless platforms cannot maintain persistent socket connections. |
| **Database** | **Supabase** | Cloud PostgreSQL + Auth + Storage |

---

## Option A: Deploy to Railway (Recommended — Fastest)

Railway automatically detects our pre-configured `railway.json` and `Procfile`.

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **+ New Project** → **Deploy from GitHub repo**.
3. Select your repository: `asakpam/logistics`.
4. Click on the newly created service card:
   - Go to **Settings** → **Service**:
     - Find **Root Directory** and set it to: `logistics-platform/server`
   - Go to **Networking**:
     - Click **Generate Domain** (e.g. `sfg-logistics-api.up.railway.app`).
5. Go to the **Variables** tab and add the following 4 environment variables:

| Variable | Value |
| :--- | :--- |
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | `https://ekkeajtpxgwrtcebumhh.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVra2VhanRweGd3cnRjZWJ1bWhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA0MTUzMSwiZXhwIjoyMTA1NjE3NTMxfQ.t6ap5IIquJrInhRfTju4LXN253tUAIFHo-kUIFXZ_KU` |
| `CLIENT_URL` | `https://your-app.vercel.app` *(or leave blank)* |

6. Railway will automatically deploy. Check the logs: you should see `🚀 Logistics Server running` and `✅ Supabase connected successfully!`.
7. Test the health check endpoint in your browser:
   `https://[your-railway-domain].up.railway.app/api/health` → should return `{"status":"ok","service":"logistics-platform"}`.

---

## Option B: Deploy to Render (Alternative Free Tier)

Render automatically detects our pre-configured `render.yaml`.

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New +** → **Web Service**.
3. Connect your repository: `asakpam/logistics`.
4. Configure the service:
   - **Name**: `sfg-logistics-server`
   - **Root Directory**: `logistics-platform/server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
   - **Plan**: `Free`
5. In **Environment Variables**, add:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `SUPABASE_URL`: `https://ekkeajtpxgwrtcebumhh.supabase.co`
   - `SUPABASE_SERVICE_KEY`: *(paste service role key above)*
6. Click **Create Web Service**.
7. Copy your assigned service URL (e.g. `https://sfg-logistics-server.onrender.com`).

---

## Final Step: Connect Vercel to Your Deployed Backend

Once you have your backend domain (e.g., `https://sfg-logistics-api.up.railway.app`):

1. Go to your project on [vercel.com](https://vercel.com).
2. Navigate to **Settings** → **Environment Variables**.
3. Add or update these 4 environment variables:

| Variable Name | Value | Visibility |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://[your-backend-domain]/api` | **Config** |
| `VITE_SOCKET_URL` | `https://[your-backend-domain]` | **Config** |
| `VITE_SUPABASE_URL` | `https://ekkeajtpxgwrtcebumhh.supabase.co` | **Config** |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVra2VhanRweGd3cnRjZWJ1bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNDE1MzEsImV4cCI6MjEwNTYxNzUzMX0.8iCSxjfZwg8kYc26NjDJS40z5bN8v2pO0fSIkN6CSVM` | **Config** |

> **Important Reminder on Vercel Variables:**
> Ensure all `VITE_` variables have visibility set to **Config** (or Plaintext), not **Secret**, because Vite embeds `VITE_` variables at build time into the client bundle.

4. Go to the **Deployments** tab in Vercel, click the three dots (`...`) next to your latest deployment, and select **Redeploy** (without cache) so the new variables are baked into the frontend build.

---

## Verifying the End-to-End Logistics Pipeline

Once deployed, you can verify the complete loop:
1. **Customer registers/logs in** → books a delivery → receives instant tracking number.
2. **Admin dashboard** → assigns an approved driver to the package.
3. **Driver dashboard** → sees assigned package in real-time.
4. **Driver opens GPS Tracking** → clicks "Go Live — Start Sharing" → coordinates stream live over Socket.IO.
5. **Customer opens Track Shipment** → sees live map marker smoothly pan to driver's location.
6. **Driver opens Confirm Delivery** → clicks "Confirm Delivery" → status updates to **Delivered** in Supabase.
7. **Customer tracking screen** → instantly reflects completed delivery with celebratory confirmation!
