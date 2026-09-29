-- RPC Functions Migration for I WILL BUY IT

-- 1. submit_customer_request RPC
CREATE OR REPLACE FUNCTION public.submit_customer_request(p_data JSONB)
RETURNS JSONB AS $$
DECLARE
  v_contact_name TEXT;
  v_contact_phone TEXT;
  v_contact_email TEXT;
  v_normalized_phone TEXT;
  v_customer_id UUID;
  v_request_id UUID := gen_random_uuid();
  v_request_code TEXT;
  v_request_type TEXT;
  v_design_id UUID := NULL;
  v_selected_colour TEXT;
  v_print_side TEXT;
  v_size TEXT;
  v_quantity INT;
  v_needed_by_date DATE := NULL;
  v_consent BOOLEAN;
  v_idea_description TEXT;
  v_reference_artwork_path TEXT;
  v_design_name_snapshot TEXT := NULL;
  v_design_code_snapshot TEXT := NULL;
  v_des_rec RECORD;
BEGIN
  -- Strict Consent Check (Must be explicitly true, never defaults to true)
  IF p_data->>'consent' IS NULL OR (p_data->>'consent')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'Customer consent is required and must be explicitly true.';
  END IF;

  -- Extract and validate customer fields
  v_contact_name := TRIM(COALESCE(p_data->>'contactName', ''));
  v_contact_phone := TRIM(COALESCE(p_data->>'contactPhone', ''));
  v_contact_email := TRIM(NULLIF(p_data->>'contactEmail', ''));
  v_idea_description := TRIM(NULLIF(p_data->>'ideaDescription', ''));
  v_selected_colour := LOWER(TRIM(COALESCE(p_data->>'selectedColour', 'navy')));
  v_print_side := LOWER(TRIM(COALESCE(p_data->>'printSide', 'front')));
  v_size := TRIM(COALESCE(p_data->>'size', 'M'));
  v_quantity := COALESCE((p_data->>'quantity')::INT, 1);
  v_reference_artwork_path := TRIM(NULLIF(p_data->>'referenceUploadPath', ''));
  v_request_type := COALESCE(NULLIF(p_data->>'requestType', ''), 'custom');

  IF p_data->>'neededByDate' IS NOT NULL AND TRIM(p_data->>'neededByDate') != '' THEN
    v_needed_by_date := (p_data->>'neededByDate')::DATE;
  END IF;

  -- Validate request type
  IF v_request_type NOT IN ('gallery', 'custom') THEN
    RAISE EXCEPTION 'Invalid request type. Must be gallery or custom.';
  END IF;

  -- Validate name and phone
  IF LENGTH(v_contact_name) < 2 OR LENGTH(v_contact_name) > 100 THEN
    RAISE EXCEPTION 'Customer name must be between 2 and 100 characters.';
  END IF;

  v_normalized_phone := REGEXP_REPLACE(v_contact_phone, '\D', '', 'g');
  IF LENGTH(v_normalized_phone) < 7 OR LENGTH(v_normalized_phone) > 15 THEN
    RAISE EXCEPTION 'Valid phone number with 7 to 15 digits is required.';
  END IF;

  IF v_contact_email IS NOT NULL AND (v_contact_email NOT LIKE '%@%' OR v_contact_email NOT LIKE '%.%') THEN
    RAISE EXCEPTION 'Invalid email format.';
  END IF;

  IF v_quantity < 1 OR v_quantity > 1000 THEN
    RAISE EXCEPTION 'Quantity must be between 1 and 1000.';
  END IF;

  IF v_selected_colour NOT IN ('navy', 'black', 'cream') OR v_print_side NOT IN ('front', 'back', 'both') OR v_size NOT IN ('S', 'M', 'L', 'XL', 'XXL') THEN
    RAISE EXCEPTION 'Invalid garment colour, print side, or size selection.';
  END IF;

  -- If gallery request, fetch authoritative design metadata from database
  IF v_request_type = 'gallery' AND p_data->>'designId' IS NOT NULL AND TRIM(p_data->>'designId') != '' THEN
    v_design_id := (p_data->>'designId')::UUID;
    SELECT d.name, d.code INTO v_des_rec
    FROM public.designs d
    WHERE d.id = v_design_id AND d.status = 'published' AND d.deleted_at IS NULL;

    IF v_des_rec.name IS NULL THEN
      RAISE EXCEPTION 'Selected gallery design is unavailable or not published.';
    END IF;

    v_design_name_snapshot := v_des_rec.name;
    v_design_code_snapshot := v_des_rec.code;
  END IF;

  -- Upsert customer record
  INSERT INTO public.customers (name, phone, normalized_phone, email)
  VALUES (v_contact_name, v_contact_phone, v_normalized_phone, v_contact_email)
  ON CONFLICT (normalized_phone) DO UPDATE
  SET name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      email = COALESCE(EXCLUDED.email, public.customers.email),
      updated_at = NOW()
  RETURNING id INTO v_customer_id;

  -- Generate human-readable request code
  v_request_code := 'IWBI-R' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8));

  -- Insert request record with forced server fields
  INSERT INTO public.requests (
    id, request_code, request_type, customer_id, design_id,
    contact_name, contact_phone, contact_email,
    design_name_snapshot, design_code_snapshot, idea_description,
    selected_colour, print_side, size, quantity, needed_by_date,
    consent, status, reference_artwork_path, admin_notes, created_at, updated_at
  ) VALUES (
    v_request_id, v_request_code, v_request_type, v_customer_id, v_design_id,
    v_contact_name, v_contact_phone, v_contact_email,
    v_design_name_snapshot, v_design_code_snapshot, v_idea_description,
    v_selected_colour, v_print_side, v_size, v_quantity, v_needed_by_date,
    true, 'New', v_reference_artwork_path, '', NOW(), NOW()
  );

  -- Insert initial activity history audit entry
  INSERT INTO public.activity_history (entity_type, entity_id, action)
  VALUES ('request', v_request_id, 'Request submitted');

  -- Return ONLY success and request_code (internal UUID is omitted)
  RETURN jsonb_build_object(
    'request_code', v_request_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.submit_customer_request FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_customer_request TO service_role;


-- 2. check_rate_limit RPC (Atomic single-statement upsert)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_ip_hash TEXT,
  p_max_requests INT,
  p_window_seconds INT
) RETURNS BOOLEAN AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_allowed BOOLEAN := false;
BEGIN
  -- Validate server parameters
  IF p_max_requests < 1 OR p_max_requests > 100 OR p_window_seconds < 10 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters.';
  END IF;

  -- Clean up expired rows periodically
  DELETE FROM public.rate_limits WHERE window_start < (v_now - INTERVAL '1 day');

  -- Atomic single-statement upsert
  INSERT INTO public.rate_limits (ip_hash, request_count, window_start)
  VALUES (p_ip_hash, 1, v_now)
  ON CONFLICT (ip_hash) DO UPDATE
  SET
    request_count = CASE
      WHEN (v_now - public.rate_limits.window_start) > (p_window_seconds || ' seconds')::INTERVAL THEN 1
      ELSE public.rate_limits.request_count + 1
    END,
    window_start = CASE
      WHEN (v_now - public.rate_limits.window_start) > (p_window_seconds || ' seconds')::INTERVAL THEN v_now
      ELSE public.rate_limits.window_start
    END;

  SELECT (request_count <= p_max_requests) INTO v_allowed
  FROM public.rate_limits
  WHERE ip_hash = p_ip_hash;

  RETURN v_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.check_rate_limit FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO service_role;


-- 3. convert_request_to_order RPC (Transactional, Idempotent, Authoritative Snapshots)
CREATE OR REPLACE FUNCTION public.convert_request_to_order(
  p_request_id UUID,
  p_unit_price NUMERIC,
  p_quantity INT,
  p_admin_notes TEXT DEFAULT ''
) RETURNS JSONB AS $$
DECLARE
  v_req public.requests%ROWTYPE;
  v_order_id UUID := gen_random_uuid();
  v_order_code TEXT;
  v_total NUMERIC;
  v_res JSONB;
  v_authoritative_name TEXT;
  v_authoritative_code TEXT;
  v_authoritative_artwork TEXT;
  v_var_rec RECORD;
BEGIN
  -- Authorization check
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  -- Validation
  IF p_unit_price < 0 THEN
    RAISE EXCEPTION 'Unit price cannot be negative';
  END IF;

  IF p_quantity < 1 OR p_quantity > 10000 THEN
    RAISE EXCEPTION 'Quantity must be between 1 and 10000';
  END IF;

  -- Lock request row for transaction
  SELECT * INTO v_req FROM public.requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- Idempotency check: return existing order if already converted
  IF v_req.status = 'Converted to Order' AND v_req.order_id IS NOT NULL THEN
    SELECT jsonb_build_object('order_id', v_req.order_id, 'already_converted', true) INTO v_res;
    RETURN v_res;
  END IF;

  IF v_req.status = 'Closed' THEN
    RAISE EXCEPTION 'Cannot convert a closed request';
  END IF;

  -- Authoritative snapshot resolution
  IF v_req.request_type = 'gallery' AND v_req.design_id IS NOT NULL THEN
    SELECT d.name, d.code INTO v_authoritative_name, v_authoritative_code
    FROM public.designs d
    WHERE d.id = v_req.design_id AND d.status = 'published' AND d.deleted_at IS NULL;

    IF v_authoritative_name IS NULL THEN
      RAISE EXCEPTION 'Design is no longer published or available.';
    END IF;

    SELECT transparent_artwork_path INTO v_authoritative_artwork
    FROM public.design_variants
    WHERE design_id = v_req.design_id AND garment_colour = v_req.selected_colour AND is_available = true
    LIMIT 1;

    IF v_authoritative_artwork IS NULL THEN
      v_authoritative_artwork := '/assets/designs/' || LOWER(REGEXP_REPLACE(v_authoritative_name, '\s+', '-', 'g')) || '/master/print-dark-shirt.png';
    END IF;
  ELSE
    v_authoritative_name := COALESCE(v_req.design_name_snapshot, 'Custom Design');
    v_authoritative_code := COALESCE(v_req.design_code_snapshot, 'Custom');
    v_authoritative_artwork := v_req.reference_artwork_path;
  END IF;

  v_total := p_unit_price * p_quantity;
  v_order_code := 'IWBI-O' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8));

  -- Create order record
  INSERT INTO public.orders (
    id, order_code, source_request_id, customer_id, contact_name, contact_phone,
    payment_status, production_status, total_npr, admin_notes
  ) VALUES (
    v_order_id, v_order_code, v_req.id, v_req.customer_id, v_req.contact_name, v_req.contact_phone,
    'Unpaid', 'Confirmed', v_total, COALESCE(p_admin_notes, '')
  );

  -- Create immutable order item snapshot using authoritative database fields
  INSERT INTO public.order_items (
    order_id, design_id, design_name_snapshot, design_code_snapshot, artwork_snapshot_path,
    garment_colour, print_side, size, quantity, unit_price_npr, line_total_npr
  ) VALUES (
    v_order_id, v_req.design_id, v_authoritative_name, v_authoritative_code, v_authoritative_artwork,
    COALESCE(v_req.selected_colour, 'navy'), COALESCE(v_req.print_side, 'front'),
    COALESCE(v_req.size, 'M'), p_quantity, p_unit_price, v_total
  );

  -- Update request status
  UPDATE public.requests
  SET status = 'Converted to Order', order_id = v_order_id, updated_at = NOW()
  WHERE id = p_request_id;

  -- Audit history for both request and order
  INSERT INTO public.activity_history (entity_type, entity_id, action, admin_id)
  VALUES ('request', p_request_id, 'Converted to order ' || v_order_code, auth.uid());

  INSERT INTO public.activity_history (entity_type, entity_id, action, admin_id)
  VALUES ('order', v_order_id, 'Created from request ' || v_req.request_code, auth.uid());

  IF p_quantity != v_req.quantity THEN
    INSERT INTO public.activity_history (entity_type, entity_id, action, admin_id)
    VALUES ('order', v_order_id, 'Quantity modified from request default ' || v_req.quantity || ' to ' || p_quantity, auth.uid());
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_code', v_order_code,
    'already_converted', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.convert_request_to_order FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convert_request_to_order TO authenticated;
