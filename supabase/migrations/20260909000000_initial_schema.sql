-- Initial Schema Migration for I WILL BUY IT
-- Creates 12 relational tables: admin_profiles, site_settings, designs, design_variants, design_sizes, customers, requests, orders, order_items, inventory, activity_history, rate_limits

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ADMIN PROFILES
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SITE SETTINGS (Singleton)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL DEFAULT 'I WILL BUY IT',
  whatsapp_local TEXT NOT NULL DEFAULT '9813115554',
  whatsapp_e164 TEXT NOT NULL DEFAULT '+9779813115554',
  whatsapp_url TEXT NOT NULL DEFAULT 'https://wa.me/9779813115554',
  currency TEXT NOT NULL DEFAULT 'NPR',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kathmandu',
  upload_limit_mb INT NOT NULL DEFAULT 10,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.site_settings (brand_name, whatsapp_local, whatsapp_e164, whatsapp_url, currency, timezone, upload_limit_mb)
SELECT 'I WILL BUY IT', '9813115554', '+9779813115554', 'https://wa.me/9779813115554', 'NPR', 'Asia/Kathmandu', 10
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

-- 3. DESIGNS
CREATE TABLE IF NOT EXISTS public.designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  short_description TEXT DEFAULT '',
  full_description TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'unavailable', 'archived')),
  featured BOOLEAN NOT NULL DEFAULT false,
  gallery_cover TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_designs_status ON public.designs(status);
CREATE INDEX IF NOT EXISTS idx_designs_featured ON public.designs(featured);

-- 4. DESIGN VARIANTS
CREATE TABLE IF NOT EXISTS public.design_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES public.designs(id) ON DELETE CASCADE,
  garment_colour TEXT NOT NULL CHECK (garment_colour IN ('navy', 'black', 'cream')),
  print_side TEXT NOT NULL CHECK (print_side IN ('front', 'back')),
  transparent_artwork_path TEXT NOT NULL,
  preview_asset_path TEXT DEFAULT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(design_id, garment_colour, print_side)
);

CREATE INDEX IF NOT EXISTS idx_design_variants_design_id ON public.design_variants(design_id);

-- 5. DESIGN SIZES
CREATE TABLE IF NOT EXISTS public.design_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES public.designs(id) ON DELETE CASCADE,
  size TEXT NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL', 'XXL')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(design_id, size)
);

-- 6. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  normalized_phone TEXT NOT NULL UNIQUE,
  email TEXT DEFAULT NULL,
  address TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_normalized_phone ON public.customers(normalized_phone);

-- 7. REQUESTS (consent column has NO default value)
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code TEXT UNIQUE NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('gallery', 'custom')),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  design_id UUID REFERENCES public.designs(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT DEFAULT NULL,
  design_name_snapshot TEXT DEFAULT NULL,
  design_code_snapshot TEXT DEFAULT NULL,
  idea_description TEXT DEFAULT NULL,
  selected_colour TEXT CHECK (selected_colour IN ('navy', 'black', 'cream')),
  print_side TEXT CHECK (print_side IN ('front', 'back', 'both')),
  size TEXT CHECK (size IN ('S', 'M', 'L', 'XL', 'XXL')),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 1000),
  needed_by_date DATE DEFAULT NULL,
  consent BOOLEAN NOT NULL,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Converted to Order', 'Closed')),
  order_id UUID DEFAULT NULL,
  reference_artwork_path TEXT DEFAULT NULL,
  reference_preview_url TEXT DEFAULT NULL,
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_request_code ON public.requests(request_code);

-- 8. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT UNIQUE NOT NULL,
  source_request_id UUID UNIQUE REFERENCES public.requests(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Paid', 'Refunded')),
  production_status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (production_status IN ('Confirmed', 'Printing', 'Quality Check', 'Ready', 'Delivered', 'Cancelled')),
  total_npr NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_npr >= 0),
  estimated_ready_date DATE DEFAULT NULL,
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ DEFAULT NULL,
  archived_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_production_status ON public.orders(production_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON public.orders(order_code);

-- Foreign key linking requests.order_id to orders.id
ALTER TABLE public.requests
  DROP CONSTRAINT IF EXISTS fk_requests_order,
  ADD CONSTRAINT fk_requests_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

-- 9. ORDER ITEMS (ON DELETE RESTRICT to preserve historical line items)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  design_id UUID REFERENCES public.designs(id) ON DELETE SET NULL,
  design_name_snapshot TEXT NOT NULL,
  design_code_snapshot TEXT NOT NULL,
  artwork_snapshot_path TEXT DEFAULT NULL,
  garment_colour TEXT NOT NULL CHECK (garment_colour IN ('navy', 'black', 'cream')),
  print_side TEXT NOT NULL CHECK (print_side IN ('front', 'back', 'both')),
  size TEXT NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL', 'XXL')),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 10000),
  unit_price_npr NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (unit_price_npr >= 0),
  line_total_npr NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (line_total_npr >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 10. INVENTORY
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garment_colour TEXT NOT NULL CHECK (garment_colour IN ('navy', 'black', 'cream')),
  size TEXT NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL', 'XXL')),
  quantity_available INT NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  low_stock_threshold INT NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(garment_colour, size)
);

-- 11. ACTIVITY HISTORY (Single canonical audit log source)
CREATE TABLE IF NOT EXISTS public.activity_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  admin_id UUID REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_activity_history_entity ON public.activity_history(entity_type, entity_id);

-- 12. RATE LIMITS
CREATE TABLE IF NOT EXISTS public.rate_limits (
  ip_hash TEXT PRIMARY KEY,
  request_count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
