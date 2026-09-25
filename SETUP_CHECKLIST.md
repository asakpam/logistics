# ✅ Supabase Setup Checklist

**Your Supabase Project:** https://ekkeajtpxgwrtcebumhh.supabase.co

---

## Step 1: ✅ Credentials Updated

Your `.env` file has been updated with:
- ✅ SUPABASE_URL: `https://ekkeajtpxgwrtcebumhh.supabase.co`
- ✅ SUPABASE_SERVICE_KEY: (configured)

---

## Step 2: 🔲 Run Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ekkeajtpxgwrtcebumhh
2. Click **SQL Editor** in the left sidebar
3. Click **New Query** button
4. Open file: `server/supabase-schema.sql`
5. Copy ALL the contents (Ctrl+A, Ctrl+C)
6. Paste into SQL Editor
7. Click **Run** (or press Ctrl+Enter)

**Expected Result:**
```
✅ "Logistics Platform schema created successfully!"
```

**Verify Tables Created:**
Run this query to check:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- drivers
- notifications
- products
- shipment_status_history
- shipments
- staff
- users

---

## Step 3: 🔲 Create Storage Bucket

1. In Supabase Dashboard, click **Storage** (left sidebar)
2. Click **New Bucket** button
3. Fill in:
   - **Name:** `ghana-cards`
   - **Public bucket:** ❌ OFF (keep it PRIVATE)
   - **Allowed MIME types:** Leave default
   - **File size limit:** Leave default (50MB is fine)
4. Click **Create bucket**

### Set Storage Policies

After creating the bucket:

1. Click on the `ghana-cards` bucket
2. Go to **Policies** tab
3. Click **New policy** → **For full customization**

**Policy 1: Allow Uploads**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ghana-cards' AND
  auth.role() = 'authenticated'
);
```

**Policy 2: Allow Downloads**
```sql
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
    -- Users can view their own
    (storage.foldername(name))[1] = auth.uid()::text
  )
);
```

---

## Step 4: 🔲 Start the Server

```bash
cd server
npm run dev
```

**Expected Output:**
```
✅ Supabase connected successfully to: https://ekkeajtpxgwrtcebumhh.supabase.co
🚀 Logistics Server running on http://localhost:5001
```

**If you see errors:**
- ❌ "relation 'users' does not exist" → Go back to Step 2, run schema
- ❌ "Invalid API key" → Check your `.env` file has the correct key
- ❌ "Failed to connect" → Check your internet connection

---

## Step 5: 🔲 Start the Frontend

In a new terminal:
```bash
cd client
npm run dev
```

**Expected Output:**
```
VITE v6.4.3  ready in XXX ms
➜  Local:   http://localhost:3000/
```

---

## Step 6: 🔲 Test User Registration

### Test 1: Register a Customer

1. Open http://localhost:3000/register
2. Click **Customer** role
3. Fill in:
   - Name: `Test Customer`
   - Email: `customer@test.com`
   - Password: `Test123456`
   - Confirm Password: `Test123456`
   - Phone: (optional)
   - Address fields: (optional)
4. Click **Create Account**

**Expected:**
- ✅ Redirects to `/dashboard/customer`
- ✅ No errors in console

**Verify in Supabase:**
1. Go to **Table Editor** → `users` table
2. Find the new user
3. Check: `role = 'customer'`, `status = 'active'`

### Test 2: Register a Driver

1. Open http://localhost:3000/register (in new incognito/private window)
2. Click **🚚 Delivery Driver** role
3. Fill in ALL fields:
   - Name: `Test Driver`
   - Email: `driver@test.com`
   - Password: `Test123456`
   - Phone: `+233555123456` (required)
   - **Address:**
     - Street: `123 Test Avenue`
     - City: `Accra`
     - Region: `Greater Accra`
   - **Driver Info:**
     - License Number: `DL-2024-12345`
     - Vehicle Type: `Van`
     - Vehicle Number: `GH-1234-20`
     - Digital Address: `GA-001-1234`
   - **Ghana Card:** Upload any image (JPG/PNG, under 5MB)
4. Click **Create Account**

**Expected:**
- ✅ Redirects to `/driver/pending`
- ✅ Shows "Pending Approval" message

**Verify in Supabase:**

1. **Table Editor → `users`:**
   - role = `'driver'`
   - status = `'pending'`
   - address fields populated

2. **Table Editor → `drivers`:**
   - All fields populated
   - ghana_card_image has a value

3. **Storage → `ghana-cards` bucket:**
   - Should see uploaded file: `{userId}/{timestamp}_random.jpg`

---

## Step 7: 🔲 Create Admin User

You need an admin to approve drivers. Run this in SQL Editor:

```sql
-- Replace 'YOUR_FIREBASE_UID' with your actual Firebase UID
-- (You can get it from Firebase Console → Authentication → Users)
INSERT INTO users (
  firebase_uid,
  name,
  email,
  role,
  status,
  is_active
) VALUES (
  'YOUR_FIREBASE_UID',
  'Admin User',
  'admin@logistics.com',
  'admin',
  'active',
  true
)
ON CONFLICT (firebase_uid) DO UPDATE 
SET role = 'admin', status = 'active';
```

**Or create via registration first, then update:**
```sql
-- If you already registered as customer, upgrade to admin:
UPDATE users 
SET role = 'admin', status = 'active'
WHERE email = 'your-email@example.com';
```

---

## Step 8: 🔲 Test Driver Approval

1. Login as admin user
2. Navigate to `/admin/drivers` or Admin Dashboard
3. You should see pending driver
4. Click **Review** or **Approve**
5. Driver status should change to `'approved'`

**Verify:**
- drivers table: status = `'approved'`
- users table: status = `'approved'`
- Driver can now login

---

## 🐛 Troubleshooting

### Server won't start

**Error: "relation 'users' does not exist"**
- You didn't run the schema SQL yet
- Go to Step 2 and run `supabase-schema.sql`

**Error: "Invalid API key"**
- Wrong credentials in `.env`
- Make sure you copied the **service_role** key (not anon key)
- Restart server after updating `.env`

### Driver registration fails

**Ghana Card not uploading:**
1. Check storage bucket `ghana-cards` exists
2. Verify storage policies are set (Step 3)
3. Check file is <5MB
4. Must be JPG, JPEG, or PNG

**Role shows as "customer" instead of "driver":**
- Check browser console for errors
- Check server logs for debug output
- Verify form shows all driver fields
- Make sure Ghana Card file is selected

### Can't login after registration

**Check:**
1. Firebase is configured (serviceAccountKey.json exists)
2. User exists in Supabase users table
3. User status is 'active' or 'approved' (not 'pending' for customers)
4. is_active = true

---

## ✅ Success Criteria

You'll know everything is working when:

- [✅] Server starts with "Supabase connected successfully"
- [✅] Customer registration works
- [✅] Driver registration with Ghana Card works
- [✅] Data appears in Supabase Table Editor
- [✅] Ghana Card image appears in Storage
- [✅] Driver approval workflow works
- [✅] No console errors

---

## 📊 Quick Health Check

Run this in Supabase SQL Editor:

```sql
-- Count records in each table
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'drivers', COUNT(*) FROM drivers
UNION ALL
SELECT 'shipments', COUNT(*) FROM shipments
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'products', COUNT(*) FROM products;
```

After testing, you should see:
- users: at least 2 (customer + driver)
- drivers: at least 1
- Others: 0 (until you create shipments, etc.)

---

## 🚀 Next Steps After Setup

Once all tests pass:

1. **Update remaining routes** (see `SUPABASE_MIGRATION_FINAL_SUMMARY.md`)
   - users.js
   - shipments.js
   - tracking.js
   - products.js
   - reports.js
   - staff.js

2. **Update Socket.IO** for real-time tracking
   - socket/trackingSocket.js

3. **Comprehensive testing**
   - Create shipments
   - Test tracking
   - Test notifications
   - Test marketplace

---

## 📞 Need Help?

- **Setup issues:** Check `server/SUPABASE_SETUP.md`
- **Migration details:** Check `SUPABASE_MIGRATION_FINAL_SUMMARY.md`
- **Code examples:** Look at `server/src/routes/auth.js` (already migrated)

**Your Supabase Dashboard:** https://supabase.com/dashboard/project/ekkeajtpxgwrtcebumhh

Good luck! 🎉
