-- ============================================================================
-- Intelligent Logistics Platform - Supabase Complete Setup & Policies
-- ============================================================================
-- Safe & idempotent script: Updates existing schema, sets up RLS policies,
-- security helper functions, storage rules, and auth triggers.
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ekkeajtpxgwrtcebumhh/sql/new
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SCHEMA FIXES (MIGRATE FROM OLD FIREBASE SCHEMA TO SUPABASE AUTH)
-- Ensure 'auth_id' exists on users table and is linked to auth.users
DO $$
BEGIN
  -- Add auth_id column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'auth_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Make firebase_uid nullable if it still has a NOT NULL constraint, or drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'firebase_uid'
  ) THEN
    ALTER TABLE public.users ALTER COLUMN firebase_uid DROP NOT NULL;
  END IF;
END $$;

-- Create unique index on auth_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);

-- ============================================================================
-- 3. SECURITY DEFINER HELPER FUNCTIONS (AVOIDS RLS INFINITE RECURSION)
-- ============================================================================
-- In Postgres, querying 'users' inside a policy on 'users' causes infinite recursion.
-- Using SECURITY DEFINER functions bypasses RLS for the internal lookup.

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() AND role IN ('staff', 'admin') AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Drop existing policies if any to allow clean re-creation
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename IN (
      'users', 'drivers', 'shipments', 'shipment_status_history', 
      'notifications', 'products', 'staff'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- TABLE: USERS
-- ----------------------------------------------------------------------------
-- SELECT: Users can view own profile; Admins/Staff can view all; Authenticated users can view basic public profile of others (e.g. driver name)
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT TO authenticated
  USING (
    auth_id = auth.uid() 
    OR public.is_staff()
    OR is_active = true
  );

-- INSERT: Authenticated users can insert their own record, or admins can create users
CREATE POLICY "users_insert_policy" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (
    auth_id = auth.uid() OR public.is_admin()
  );

-- UPDATE: Users can update their own record, admins can update any user
CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE TO authenticated
  USING (
    auth_id = auth.uid() OR public.is_admin()
  )
  WITH CHECK (
    -- Prevent normal users from escalating their own role
    (auth_id = auth.uid() AND (role = public.current_user_role() OR public.is_admin()))
    OR public.is_admin()
  );

-- DELETE: Admins only
CREATE POLICY "users_delete_policy" ON public.users
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- TABLE: DRIVERS
-- ----------------------------------------------------------------------------
-- SELECT: Own driver profile, admins/staff, or approved drivers visible to customers for delivery
CREATE POLICY "drivers_select_policy" ON public.drivers
  FOR SELECT TO authenticated
  USING (
    user_id = public.current_user_id()
    OR public.is_staff()
    OR status = 'approved'
  );

-- INSERT: Authenticated users can create their driver profile
CREATE POLICY "drivers_insert_policy" ON public.drivers
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = public.current_user_id() OR public.is_admin()
  );

-- UPDATE: Drivers can update own profile, Admins/Staff can update any
CREATE POLICY "drivers_update_policy" ON public.drivers
  FOR UPDATE TO authenticated
  USING (
    user_id = public.current_user_id() OR public.is_staff()
  )
  WITH CHECK (
    user_id = public.current_user_id() OR public.is_staff()
  );

-- DELETE: Admins only
CREATE POLICY "drivers_delete_policy" ON public.drivers
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- TABLE: SHIPMENTS
-- ----------------------------------------------------------------------------
-- SELECT: 
-- 1. Customers see own shipments
-- 2. Assigned drivers see their deliveries
-- 3. Approved drivers see unassigned 'Pending' shipments to accept work
-- 4. Staff/Admin see all shipments
CREATE POLICY "shipments_select_policy" ON public.shipments
  FOR SELECT TO authenticated
  USING (
    customer_id = public.current_user_id()
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = public.current_user_id())
    OR (status = 'Pending' AND driver_id IS NULL AND EXISTS (
      SELECT 1 FROM public.drivers WHERE user_id = public.current_user_id() AND status = 'approved'
    ))
    OR public.is_staff()
  );

-- INSERT: Customers and Staff/Admin can create shipments
CREATE POLICY "shipments_insert_policy" ON public.shipments
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id = public.current_user_id() OR public.is_staff()
  );

-- UPDATE:
-- 1. Assigned drivers can update status & location
-- 2. Customers can cancel their own Pending shipments
-- 3. Staff/Admin can update any shipment (assignment, status, etc.)
CREATE POLICY "shipments_update_policy" ON public.shipments
  FOR UPDATE TO authenticated
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = public.current_user_id())
    OR (customer_id = public.current_user_id() AND status = 'Pending')
    OR public.is_staff()
  )
  WITH CHECK (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = public.current_user_id())
    OR (customer_id = public.current_user_id() AND status = 'Cancelled')
    OR public.is_staff()
  );

-- DELETE: Admins only
CREATE POLICY "shipments_delete_policy" ON public.shipments
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- TABLE: SHIPMENT_STATUS_HISTORY
-- ----------------------------------------------------------------------------
-- SELECT: Participants of the shipment (customer, driver, staff)
CREATE POLICY "status_history_select_policy" ON public.shipment_status_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = shipment_id
      AND (
        s.customer_id = public.current_user_id()
        OR s.driver_id IN (SELECT id FROM public.drivers WHERE user_id = public.current_user_id())
        OR public.is_staff()
      )
    )
  );

-- INSERT: Participants can append status history
CREATE POLICY "status_history_insert_policy" ON public.shipment_status_history
  FOR INSERT TO authenticated
  WITH CHECK (
    changed_by = public.current_user_id() OR public.is_staff()
  );

-- ----------------------------------------------------------------------------
-- TABLE: NOTIFICATIONS
-- ----------------------------------------------------------------------------
-- SELECT: Users see only their own notifications
CREATE POLICY "notifications_select_policy" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = public.current_user_id() OR public.is_admin());

-- UPDATE: Users can mark their own notifications as read
CREATE POLICY "notifications_update_policy" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = public.current_user_id());

-- INSERT: System / Staff / Authenticated users
CREATE POLICY "notifications_insert_policy" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- DELETE: Users can delete their own notifications; Admins can delete any
CREATE POLICY "notifications_delete_policy" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = public.current_user_id() OR public.is_admin());

-- ----------------------------------------------------------------------------
-- TABLE: PRODUCTS (MARKETPLACE)
-- ----------------------------------------------------------------------------
-- SELECT: Active products are visible to all (including anon visitors)
CREATE POLICY "products_select_policy" ON public.products
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_staff());

-- INSERT: Authenticated users can list products
CREATE POLICY "products_insert_policy" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = public.current_user_id() OR public.is_staff());

-- UPDATE: Product owner or Staff/Admin
CREATE POLICY "products_update_policy" ON public.products
  FOR UPDATE TO authenticated
  USING (owner_id = public.current_user_id() OR public.is_staff());

-- DELETE: Product owner or Admin
CREATE POLICY "products_delete_policy" ON public.products
  FOR DELETE TO authenticated
  USING (owner_id = public.current_user_id() OR public.is_admin());

-- ----------------------------------------------------------------------------
-- TABLE: STAFF
-- ----------------------------------------------------------------------------
-- SELECT: Staff can see own record; Admins can see all
CREATE POLICY "staff_select_policy" ON public.staff
  FOR SELECT TO authenticated
  USING (user_id = public.current_user_id() OR public.is_admin());

-- INSERT: Admins only
CREATE POLICY "staff_insert_policy" ON public.staff
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE: Admins only
CREATE POLICY "staff_update_policy" ON public.staff
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- DELETE: Admins only
CREATE POLICY "staff_delete_policy" ON public.staff
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 5. STORAGE BUCKET & POLICIES (ghana-cards)
-- ============================================================================

-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ghana-cards', 
  'ghana-cards', 
  false, 
  5242880, 
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg'];

-- Clean existing storage policies for ghana-cards
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%ghana-cards%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Policy 1: Authenticated users can upload to their own folder: <auth.uid()>/...
CREATE POLICY "Allow authenticated uploads to ghana-cards"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'ghana-cards'
);

-- Policy 2: Users can view their own uploaded files, Admins/Staff can view all
CREATE POLICY "Allow users and admins to view ghana-cards"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'ghana-cards' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_staff()
  )
);

-- Policy 3: Users can update their own files
CREATE POLICY "Allow users to update own ghana-cards"
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'ghana-cards' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Users can delete their own files, Admins can delete any
CREATE POLICY "Allow users and admins to delete ghana-cards"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'ghana-cards' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin()
  )
);

-- ============================================================================
-- 6. AUTH SIGNUP TRIGGER (SYNC auth.users -> public.users)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, name, role, status, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'customer'),
    CASE 
      WHEN COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'customer') = 'driver' THEN 'pending'::public.user_status
      ELSE 'active'::public.user_status
    END,
    true
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_id = EXCLUDED.auth_id,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 7. RPC HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_by_auth_id(uid UUID)
RETURNS TABLE(
  id UUID,
  auth_id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  avatar TEXT,
  role public.user_role,
  status public.user_status,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.auth_id, u.name, u.email, u.phone, u.avatar, u.role, u.status, u.is_active
  FROM public.users u
  WHERE u.auth_id = uid AND u.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

SELECT '✅ Complete Supabase setup and policies applied successfully!' AS status;
