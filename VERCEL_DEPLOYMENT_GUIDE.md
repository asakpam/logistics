# Vercel Deployment Guide

This guide explains how to deploy the **Logistics Platform** using **Vercel**.

---

## 1. Architecture & Hosting Strategy

| Layer | Component | Recommended Host | Why |
| :--- | :--- | :--- | :--- |
| **Frontend** | `logistics-platform/client` (Vite + React) | **Vercel** | Lightning-fast global CDN, instant deployments, automatic SSL, zero maintenance. |
| **Backend** | `logistics-platform/server` (Express + Socket.IO) | **Render / Railway / VPS** | **Critical:** Socket.IO requires persistent WebSockets for live driver GPS tracking. Vercel Serverless Functions do not support persistent WebSockets. |
| **Database & Auth** | Supabase | **Supabase Cloud** | Managed PostgreSQL database, authentication, and file storage. |

---

## 2. Preparing the Frontend for Vercel

The required configuration has already been prepared in [`logistics-platform/client/vercel.json`](file:///c:/Users/Skinny/Downloads/final%20year%20project/logistics-platform/client/vercel.json):

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
> **Why this is critical:** Since the frontend is a Single Page Application (SPA) using React Router, this rewrite ensures that refreshing pages like `/dashboard`, `/admin/shipments`, or `/track` doesn't result in a `404 Not Found` error.

---

## 3. Deploying via Vercel Dashboard (GitHub Integration - Recommended)

Because your code is already hosted at `https://github.com/asakpam/logistics`:

### Step 1: Import Project in Vercel
1. Go to [vercel.com](https://vercel.com) and log in (or sign up with GitHub).
2. Click **Add New...** → **Project**.
3. Locate your repository (`asakpam/logistics`) and click **Import**.

### Step 2: Configure Project Settings (IMPORTANT)
Under the **Configure Project** screen:
1. **Project Name**: `logistics-client` (or any preferred name).
2. **Root Directory**: Click **Edit** next to Root Directory, select **`logistics-platform/client`**, and click **Continue**.
3. **Framework Preset**: Vercel should automatically detect **Vite**.
4. **Build & Output Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Add Environment Variables
Under **Environment Variables**, add the following variables:

| Variable Name | Value Description | Example / Current Value |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://ekkeajtpxgwrtcebumhh.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase public anon key | *(From `client/.env`)* |
| `VITE_API_URL` | URL of your deployed backend API | `https://your-backend.onrender.com/api` |
| `VITE_SOCKET_URL` | Base URL of your backend for Socket.IO | `https://your-backend.onrender.com` |

### Step 4: Deploy
Click **Deploy**. Vercel will install dependencies, build the Vite app, and provide you with a production URL (e.g. `https://logistics-client-xyz.vercel.app`).

---

## 4. Alternative: Deploying via Vercel CLI

If you prefer to deploy directly from your local terminal:

1. Open a terminal in `logistics-platform/client`:
   ```bash
   cd "logistics-platform/client"
   ```
2. Run the Vercel deployment command:
   ```bash
   npx vercel
   ```
3. Follow the CLI prompts:
   - *Set up and deploy?* **Y**
   - *Which scope?* Select your Vercel account.
   - *Link to existing project?* **N** (or **Y** if already created).
   - *What's your project's name?* `logistics-client`
   - *In which directory is your code located?* `./`
   - *Want to modify these settings?* **N**
4. Deploy to production:
   ```bash
   npx vercel --prod
   ```
5. Set environment variables using the CLI:
   ```bash
   npx vercel env add VITE_SUPABASE_URL
   npx vercel env add VITE_SUPABASE_ANON_KEY
   npx vercel env add VITE_API_URL
   npx vercel env add VITE_SOCKET_URL
   ```

---

## 5. Connecting Backend (CORS & Environment Variables)

Once your frontend is deployed on Vercel (e.g. `https://logistics-client.vercel.app`), update your backend environment:

1. In your backend hosting provider (e.g. Render/Railway):
   - Set `CLIENT_URL=https://logistics-client.vercel.app`
2. This allows the backend Express server and Socket.IO server to accept requests from your Vercel domain without being blocked by CORS.

---

## 6. What about deploying the Express backend to Vercel?

If you attempt to host `logistics-platform/server` on Vercel as a Serverless function:
- **Serverless Limitation**: Vercel Serverless functions terminate immediately after handling HTTP requests.
- **Socket.IO Issue**: Persistent WebSockets for live driver location broadcasting (`trackingSocket.js`) **will not work** on Vercel Serverless.
- **Recommendation**: Deploy the backend on **Render.com** (Web Service: Node.js, `npm start`) or **Railway.app**, which both run persistent Node.js servers with native WebSocket support.
