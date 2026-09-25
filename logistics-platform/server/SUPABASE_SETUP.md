# 🚀 Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project name:** `logistics-platform`
   - **Database password:** (generate a strong password and save it)
   - **Region:** Choose closest to your users (e.g., `us-east-1` or `eu-west-1`)
   - **Pricing plan:** Free tier is sufficient for development

5. Wait 2-3 minutes for project to be created

---

## Step 2: Get API Credentials

1. In your Supabase project dashboard, click **Settings** (gear icon) → **API**

2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **service_role key** (under "Project API keys" - **NOT the anon key**)

3. Open `server/.env` and update:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key-here
   ```

⚠️ **Important:** Never commit the `service_role` key to Git! It has full database access.

---

## Step 3: Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)

2. Click **New query**

3. Copy the entire contents of `supabase-schema.sql`

4. Paste into the SQL editor

5. Click **Run** or press `Ctrl+Enter`

6. You should see: `"Logistics Platform schema created successfully!"`

This creates:
- ✅ 7 tables (users, drivers, shipments, status_history, notifications, products, staff)
- ✅ All indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for auto-timestamps and status tracking
- ✅ Helper functions (tracking number generation, etc.)

---

## Step 4: Create Storage Bucket for Ghana Card Images

1. In Supabase Dashboard, go to **Storage** (left sidebar)

2. Click **New bucket**

3. Fill in:
   - **Name:** `ghana-cards`
   - **Public bucket:** ❌ OFF (keep private)
   - Click **Create bucket**

4. Click on the `ghana-cards` bucket

5. Go to **Policies** tab

6. Click **New policy** → **Custom policy**

7. Add this policy for uploads:
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'ghana-cards' AND
     auth.role() = 'authenticated'
   );
   ```

8. Add this policy for downloads:
   ```sql
   -- Allow admins to view all, drivers to view own
   CREATE POLICY "Allow authorized downloads"
   ON storage.objects FOR SELECT
   USING (
     bucket_id = 'ghana-cards' AND (
       -- Admins can view all
       EXISTS (
         SELECT 1 FROM users 
         WHERE firebase_uid = auth.uid()::text 
         AND role = 'admin'
       ) OR
       -- Drivers can view their own
       (storage.foldername(name))[1] = auth.uid()::text
     )
   );
   ```

---

## Step 5: Verify Setup

Run this query in SQL Editor to check tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- ✅ drivers
- ✅ notifications
- ✅ products
- ✅ shipment_status_history
- ✅ shipments
- ✅ staff
- ✅ users

---

## Step 6: Test Connection

1. Start your server:
   ```bash
   cd server
   npm run dev
   ```

2. Check console - should see:
   ```
   ✅ Supabase connected successfully!
   🚀 Logistics Server running on http://localhost:5001
   ```

3. Test health endpoint:
   ```bash
   curl http://localhost:5001/api/health
   ```

---

## 🔐 Security Notes

### Service Role Key
- Has **full access** to your database
- Bypasses Row Level Security (RLS)
- **Never** expose in frontend code
- Only use on backend server

### Row Level Security (RLS)
- Already configured in `supabase-schema.sql`
- Customers can only see their own shipments
- Drivers can only see assigned shipments
- Admins can see everything
- Test RLS by querying as different users

### Firebase Integration
- Firebase handles authentication (passwords, OAuth)
- Supabase stores user profile data
- `firebase_uid` links Firebase account to Supabase user record

---

## 📚 Next Steps

1. ✅ Complete Steps 1-6 above
2. ⏭️ Run `npm run dev` in server folder
3. ⏭️ Test user registration
4. ⏭️ Verify data appears in Supabase Dashboard → Table Editor

---

## 🆘 Troubleshooting

### Error: "relation 'users' does not exist"
- You didn't run `supabase-schema.sql` yet
- Go to SQL Editor and run the schema script

### Error: "Invalid API key"
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`
- Make sure you copied the **service_role** key, not anon key
- Restart your server after updating `.env`

### Error: "RLS policy violation"
- Make sure you're passing Firebase authentication properly
- Check that `auth.uid()` matches the `firebase_uid` in users table
- Service role key bypasses RLS for testing

### Ghana Card upload fails
- Check storage bucket `ghana-cards` exists
- Verify storage policies are set
- Check file size < 5MB
- Verify MIME type is image/jpeg or image/png

---

## 📊 Monitoring

### View Data
Supabase Dashboard → **Table Editor** → Select table

### View Logs
Supabase Dashboard → **Logs** → Select log type

### Run Queries
Supabase Dashboard → **SQL Editor** → New query

---

## 🎯 Schema Overview

```
users (id, firebase_uid, name, email, role, status, ...)
  ↓ 1:1
drivers (id, user_id → users.id, license_number, vehicle_number, ...)
  ↓ 1:∞
shipments (id, customer_id → users.id, driver_id → drivers.id, ...)
  ↓ 1:∞
shipment_status_history (id, shipment_id → shipments.id, status, ...)

users
  ↓ 1:∞
notifications (id, user_id → users.id, message, type, ...)

users
  ↓ 1:∞
products (id, owner_id → users.id, title, price, ...)
```

---

**Setup Complete!** 🎉

Your database is now ready for development with PostgreSQL superpowers!
