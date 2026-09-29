-- RLS Policies & Security Controls for I WILL BUY IT

-- Enable RLS on all 12 tables
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Hardened is_admin() function with SECURITY DEFINER and empty search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- REVOKE all direct raw-table write & read access from anon / public
REVOKE ALL ON public.designs FROM anon, public;
REVOKE ALL ON public.design_variants FROM anon, public;
REVOKE ALL ON public.design_sizes FROM anon, public;
REVOKE ALL ON public.requests FROM anon, public;
REVOKE ALL ON public.customers FROM anon, public;
REVOKE ALL ON public.orders FROM anon, public;
REVOKE ALL ON public.order_items FROM anon, public;
REVOKE ALL ON public.inventory FROM anon, public;
REVOKE ALL ON public.activity_history FROM anon, public;
REVOKE ALL ON public.rate_limits FROM anon, public, authenticated;

-- 1. admin_profiles
CREATE POLICY "Admins can view admin profiles" ON public.admin_profiles
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can update their own profile" ON public.admin_profiles
  FOR UPDATE TO authenticated USING (id = auth.uid() AND public.is_admin());

-- 2. site_settings (Public can view brand settings)
CREATE POLICY "Public can view site settings" ON public.site_settings
  FOR SELECT TO public USING (true);
CREATE POLICY "Admins can update site settings" ON public.site_settings
  FOR ALL TO authenticated USING (public.is_admin());

-- 3. designs, design_variants, design_sizes, customers, requests, orders, order_items, inventory, activity_history
-- Admin-only access policies
CREATE POLICY "Admins can perform all actions on designs" ON public.designs
  FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can perform all actions on design_variants" ON public.design_variants
  FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can perform all actions on design_sizes" ON public.design_sizes
  FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can perform all actions on customers" ON public.customers
  FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can perform all actions on requests" ON public.requests
  FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can perform all actions on orders" ON public.orders
  FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can perform all actions on order_items" ON public.order_items
  FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can perform all actions on inventory" ON public.inventory
  FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can perform all actions on activity_history" ON public.activity_history
  FOR ALL TO authenticated USING (public.is_admin());
