-- Manual Admin Provisioning Script for Supabase
-- Run this query in Supabase SQL Editor after creating your admin user in Supabase Auth Dashboard.
-- Replace YOUR_REAL_ADMIN_EMAIL with your actual admin user email.

INSERT INTO public.admin_profiles (
  id,
  display_name,
  role,
  is_active
)
SELECT
  id,
  'Store Owner',
  'admin',
  true
FROM auth.users
WHERE lower(email) = lower('YOUR_REAL_ADMIN_EMAIL')
ON CONFLICT (id) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;
