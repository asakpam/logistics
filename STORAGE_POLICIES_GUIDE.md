# 🗄️ Supabase Storage Policies - Step by Step Guide

**Having trouble creating storage policies? Follow these exact steps.**

---

## Step 1: Create the Storage Bucket First

1. Go to: https://supabase.com/dashboard/project/ekkeajtpxgwrtcebumhh/storage/buckets
2. Click **"New Bucket"** button (top right)
3. Fill in:
   - **Name:** `ghana-cards`
   - **Public bucket:** ❌ **OFF** (keep it private!)
   - **File size limit:** 5242880 (5MB)
   - **Allowed MIME types:** Leave empty (or add: `image/jpeg,image/jpg,image/png`)
4. Click **"Create bucket"**
5. ✅ You should now see `ghana-cards` in your bucket list

---

## Step 2: Create Storage Policies

### Method 1: Using SQL Editor (Recommended)

1. Go to: https://supabase.com/dashboard/project/ekkeajtpxgwrtcebumhh/sql/new
2. Copy and paste this **complete SQL**:

```sql
-- ============================================================================
-- STORAGE POLICIES FOR GHANA-CARDS BUCKET
-- ============================================================================

-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to ghana-cards"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ghana-cards'
);

-- Policy 2: Allow authenticated users to read their own files
CREATE POLICY "Allow users to read own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ghana-cards' AND
  (
    -- Users can read files in their own folder
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Admins can read all files
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  )
);

-- Policy 3: Allow users to update their own files
CREATE POLICY "Allow users to update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ghana-cards' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow users to delete their own files
CREATE POLICY "Allow users to delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ghana-cards' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%ghana-cards%';
```

3. Click **"Run"** (Ctrl+Enter)
4. ✅ You should see: "Success. 4 rows affected" or similar

---

### Method 2: Using Storage UI (Alternative)

If SQL doesn't work, use the UI:

1. Go to: https://supabase.com/dashboard/project/ekkeajtpxgwrtcebumhh/storage/buckets/ghana-cards
2. Click on the **`ghana-cards`** bucket
3. Click **"Policies"** tab
4. Click **"New Policy"** button

#### Create Policy 1: Upload

1. Click **"New Policy"** → **"For full customization"**
2. **Policy name:** `Allow authenticated uploads to ghana-cards`
3. **Allowed operation:** Check ✅ **INSERT**
4. **Target roles:** Select `authenticated`
5. **USING expression:** Leave empty
6. **WITH CHECK expression:**
```sql
bucket_id = 'ghana-cards'
```
7. Click **"Review"** → **"Save policy"**

#### Create Policy 2: Read/Download

1. Click **"New Policy"** → **"For full customization"**
2. **Policy name:** `Allow users to read own files`
3. **Allowed operation:** Check ✅ **SELECT**
4. **Target roles:** Select `authenticated`
5. **USING expression:**
```sql
bucket_id = 'ghana-cards' AND
(
  (storage.foldername(name))[1] = auth.uid()::text
  OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_id = auth.uid()
    AND role = 'admin'
  )
)
```
6. **WITH CHECK expression:** Leave empty
7. Click **"Review"** → **"Save policy"**

---

## Step 3: Verify Policies Work

### Test in SQL Editor

```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE name = 'ghana-cards';

-- Check policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Policy already exists"

**Error:** `policy "Allow authenticated uploads to ghana-cards" already exists`

**Solution:** Drop the old policy first:
```sql
DROP POLICY IF EXISTS "Allow authenticated uploads to ghana-cards" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;
```

Then re-run the CREATE POLICY statements.

---

### Issue 2: "Bucket not found"

**Error:** `bucket_id 'ghana-cards' does not exist`

**Solution:** Create the bucket first (see Step 1 above).

---

### Issue 3: "Permission denied for schema storage"

**Error:** `permission denied for schema storage`

**Solution:** You need to be the bucket owner or use the SQL Editor which has proper permissions. Use **Method 1: SQL Editor** above.

---

### Issue 4: Policies not working (files can't be uploaded)

**Check:**
1. Bucket exists: `SELECT * FROM storage.buckets WHERE name = 'ghana-cards';`
2. Policies exist: `SELECT * FROM pg_policies WHERE tablename = 'objects';`
3. User is authenticated (has valid JWT token)
4. File path format is: `{userId}/{filename}`

**Quick fix:** Delete all policies and recreate:
```sql
-- Remove all ghana-cards policies
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname LIKE '%ghana-cards%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Recreate policies (paste the 4 CREATE POLICY statements from above)
```

---

## 🧪 Test Upload (Using Frontend)

Once policies are created:

1. Open: http://localhost:3000/register
2. Register as **Driver**
3. Upload Ghana Card image
4. Click "Create Account"
5. Check Supabase Storage: https://supabase.com/dashboard/project/ekkeajtpxgwrtcebumhh/storage/buckets/ghana-cards

**You should see:** `{user-id}/timestamp_random.jpg`

---

## 🔒 What These Policies Do

### Policy 1: Upload
- **Who:** Any authenticated user
- **What:** Can INSERT (upload) files
- **Where:** Only to `ghana-cards` bucket
- **Why:** Allows drivers to upload their Ghana Card during registration

### Policy 2: Read
- **Who:** Authenticated users
- **What:** Can SELECT (download/view) files
- **Where:** 
  - Their own files (files in their user ID folder)
  - Admins can see all files
- **Why:** Privacy - users only see their own files, admins can verify

### Policy 3: Update
- **Who:** Authenticated users
- **What:** Can UPDATE files
- **Where:** Only their own files
- **Why:** Allows users to replace their Ghana Card if needed

### Policy 4: Delete
- **Who:** Authenticated users
- **What:** Can DELETE files
- **Where:** Only their own files
- **Why:** Allows users to remove their Ghana Card

---

## ✅ Quick Checklist

Before testing driver registration:

- [ ] Bucket `ghana-cards` exists
- [ ] Bucket is **private** (not public)
- [ ] 4 storage policies created
- [ ] Policies verified with SQL query
- [ ] Backend server running (connects to Supabase)
- [ ] Frontend server running (http://localhost:3000)
- [ ] Database schema already run (users table exists)

---

## 💡 Pro Tips

### Tip 1: Use SQL Editor for Policies
The UI can be confusing. SQL is faster and more reliable.

### Tip 2: Test Without Policies First
Temporarily make bucket public to test if upload works:
1. Storage → ghana-cards → Settings
2. Toggle "Public bucket" ON
3. Test upload
4. Toggle back OFF
5. Add policies

### Tip 3: Check Backend Logs
If upload fails, check server logs:
```
cd server
npm run dev
```
Look for error messages when uploading.

### Tip 4: Bypass Storage (Temporary)
If storage policies are too difficult right now, you can disable Supabase Storage:

In `server/.env`:
```env
USE_SUPABASE_STORAGE=false
```

Files will upload to `server/uploads/ghana-cards/` instead. You can add storage later.

---

## 📞 Still Having Issues?

If policies still don't work:

1. **Share the error message** - What exactly is the error?
2. **Check server logs** - Any errors in backend console?
3. **Check browser console** - Any errors in DevTools?
4. **Verify bucket exists** - Run: `SELECT * FROM storage.buckets;`
5. **Try the temporary bypass** - Set `USE_SUPABASE_STORAGE=false`

---

## 🎯 Next Steps After Policies Work

1. ✅ Test driver registration with Ghana Card upload
2. ✅ Verify file appears in Storage
3. ✅ Test admin can view driver's Ghana Card
4. ✅ Test driver can't view other drivers' Ghana Cards

---

**Your Supabase Dashboard:** https://supabase.com/dashboard/project/ekkeajtpxgwrtcebumhh

Good luck! Let me know if you're still stuck. 🚀
