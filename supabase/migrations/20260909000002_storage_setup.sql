-- Storage Buckets Setup & Security Policies

-- Create/update design-assets bucket (Private bucket, served via validated proxy handler)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('design-assets', 'design-assets', false, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'];

-- Create/update request-uploads bucket (Private bucket, customer uploads via server endpoint)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('request-uploads', 'request-uploads', false, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

-- Storage RLS Policies for design-assets
CREATE POLICY "Admin read and manage for design-assets" ON storage.objects
  FOR ALL TO authenticated USING (bucket_id = 'design-assets' AND public.is_admin());

-- Storage RLS Policies for request-uploads
CREATE POLICY "Admin read and manage for request-uploads" ON storage.objects
  FOR ALL TO authenticated USING (bucket_id = 'request-uploads' AND public.is_admin());
