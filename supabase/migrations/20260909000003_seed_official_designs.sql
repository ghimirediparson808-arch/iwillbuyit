-- Seed the 7 Official Launch Designs and Variants into Supabase

DO $$
DECLARE
  v_never_alone_id UUID := gen_random_uuid();
  v_street_duck_id UUID := gen_random_uuid();
  v_coffee_energy_id UUID := gen_random_uuid();
  v_slow_pace_id UUID := gen_random_uuid();
  v_human_evolution_id UUID := gen_random_uuid();
  v_the_climb_id UUID := gen_random_uuid();
  v_justice_id UUID := gen_random_uuid();
BEGIN

  -- 1. Never Alone (IWBI-001)
  INSERT INTO public.designs (id, code, name, category, short_description, full_description, tags, status, featured, gallery_cover)
  VALUES (
    v_never_alone_id, 'IWBI-001', 'Never Alone', 'Typography',
    'A distressed eye graphic about the unseen battles people carry.',
    'A distressed eye graphic about the unseen battles people carry.',
    ARRAY['typography', 'streetwear', 'monochrome'], 'published', true, NULL
  ) ON CONFLICT (code) DO NOTHING;

  -- 2. Street Duck (IWBI-002)
  INSERT INTO public.designs (id, code, name, category, short_description, full_description, tags, status, featured, gallery_cover)
  VALUES (
    v_street_duck_id, 'IWBI-002', 'Street Duck', 'Graphic',
    'A bold urban duck character with a music-first streetwear attitude.',
    'A bold urban duck character with a music-first streetwear attitude.',
    ARRAY['graphic', 'character', 'streetwear'], 'published', true, NULL
  ) ON CONFLICT (code) DO NOTHING;

  -- 3. Coffee Energy (IWBI-003)
  INSERT INTO public.designs (id, code, name, category, short_description, full_description, tags, status, featured, gallery_cover)
  VALUES (
    v_coffee_energy_id, 'IWBI-003', 'Coffee Energy', 'Typography',
    'A playful chalkboard equation for people powered by coffee.',
    'A playful chalkboard equation for people powered by coffee.',
    ARRAY['coffee', 'typography', 'minimal'], 'published', true, NULL
  ) ON CONFLICT (code) DO NOTHING;

  -- 4. Slow Pace (IWBI-004)
  INSERT INTO public.designs (id, code, name, category, short_description, full_description, tags, status, featured, gallery_cover)
  VALUES (
    v_slow_pace_id, 'IWBI-004', 'Slow Pace', 'Graphic',
    'A relaxed turtle reminding everyone that good things take time.',
    'A relaxed turtle reminding everyone that good things take time.',
    ARRAY['character', 'fun', 'typography'], 'published', true, NULL
  ) ON CONFLICT (code) DO NOTHING;

  -- 5. Human Evolution (IWBI-005)
  INSERT INTO public.designs (id, code, name, category, short_description, full_description, tags, status, featured, gallery_cover)
  VALUES (
    v_human_evolution_id, 'IWBI-005', 'Human Evolution', 'Minimal',
    'A cosmic sequence that moves from galaxies to the human form.',
    'A cosmic sequence that moves from galaxies to the human form.',
    ARRAY['cosmic', 'minimal', 'monochrome'], 'published', true, NULL
  ) ON CONFLICT (code) DO NOTHING;

  -- 6. The Climb (IWBI-006)
  INSERT INTO public.designs (id, code, name, category, short_description, full_description, tags, status, featured, gallery_cover)
  VALUES (
    v_the_climb_id, 'IWBI-006', 'The Climb', 'Minimal',
    'A vertical rope composition inspired by struggle, support and reaching higher.',
    'A vertical rope composition inspired by struggle, support and reaching higher.',
    ARRAY['minimal', 'climb', 'line-art'], 'published', true, NULL
  ) ON CONFLICT (code) DO NOTHING;

  -- 7. Justice (IWBI-007)
  INSERT INTO public.designs (id, code, name, category, short_description, full_description, tags, status, featured, gallery_cover)
  VALUES (
    v_justice_id, 'IWBI-007', 'Justice', 'Editorial',
    'A classical winged figure composed as a modern editorial print.',
    'A classical winged figure composed as a modern editorial print.',
    ARRAY['editorial', 'statue', 'grayscale'], 'published', true, NULL
  ) ON CONFLICT (code) DO NOTHING;

  -- Retrieve actual IDs in case of CONFLICT DO NOTHING
  SELECT id INTO v_never_alone_id FROM public.designs WHERE code = 'IWBI-001';
  SELECT id INTO v_street_duck_id FROM public.designs WHERE code = 'IWBI-002';
  SELECT id INTO v_coffee_energy_id FROM public.designs WHERE code = 'IWBI-003';
  SELECT id INTO v_slow_pace_id FROM public.designs WHERE code = 'IWBI-004';
  SELECT id INTO v_human_evolution_id FROM public.designs WHERE code = 'IWBI-005';
  SELECT id INTO v_the_climb_id FROM public.designs WHERE code = 'IWBI-006';
  SELECT id INTO v_justice_id FROM public.designs WHERE code = 'IWBI-007';

  -- Seed Variants for each design (Navy, Black, Cream - Front)
  -- Never Alone
  INSERT INTO public.design_variants (design_id, garment_colour, print_side, transparent_artwork_path, is_available) VALUES
  (v_never_alone_id, 'navy', 'front', '/assets/designs/never-alone/master/print-dark-shirt.png', true),
  (v_never_alone_id, 'black', 'front', '/assets/designs/never-alone/master/print-dark-shirt.png', true),
  (v_never_alone_id, 'cream', 'front', '/assets/designs/never-alone/master/print-light-shirt.png', true)
  ON CONFLICT (design_id, garment_colour, print_side) DO NOTHING;

  -- Street Duck
  INSERT INTO public.design_variants (design_id, garment_colour, print_side, transparent_artwork_path, is_available) VALUES
  (v_street_duck_id, 'navy', 'front', '/assets/designs/street-duck/master/print-dark-shirt.png', true),
  (v_street_duck_id, 'black', 'front', '/assets/designs/street-duck/master/print-dark-shirt.png', true),
  (v_street_duck_id, 'cream', 'front', '/assets/designs/street-duck/master/print-light-shirt.png', true)
  ON CONFLICT (design_id, garment_colour, print_side) DO NOTHING;

  -- Coffee Energy
  INSERT INTO public.design_variants (design_id, garment_colour, print_side, transparent_artwork_path, is_available) VALUES
  (v_coffee_energy_id, 'navy', 'front', '/assets/designs/coffee-energy/master/print-dark-shirt.png', true),
  (v_coffee_energy_id, 'black', 'front', '/assets/designs/coffee-energy/master/print-dark-shirt.png', true),
  (v_coffee_energy_id, 'cream', 'front', '/assets/designs/coffee-energy/master/print-light-shirt.png', true)
  ON CONFLICT (design_id, garment_colour, print_side) DO NOTHING;

  -- Slow Pace
  INSERT INTO public.design_variants (design_id, garment_colour, print_side, transparent_artwork_path, is_available) VALUES
  (v_slow_pace_id, 'navy', 'front', '/assets/designs/slow-pace/master/print-dark-shirt.png', true),
  (v_slow_pace_id, 'black', 'front', '/assets/designs/slow-pace/master/print-dark-shirt.png', true),
  (v_slow_pace_id, 'cream', 'front', '/assets/designs/slow-pace/master/print-light-shirt.png', true)
  ON CONFLICT (design_id, garment_colour, print_side) DO NOTHING;

  -- Human Evolution
  INSERT INTO public.design_variants (design_id, garment_colour, print_side, transparent_artwork_path, is_available) VALUES
  (v_human_evolution_id, 'navy', 'front', '/assets/designs/human-evolution/master/print-dark-shirt.png', true),
  (v_human_evolution_id, 'black', 'front', '/assets/designs/human-evolution/master/print-dark-shirt.png', true),
  (v_human_evolution_id, 'cream', 'front', '/assets/designs/human-evolution/master/print-light-shirt.png', true)
  ON CONFLICT (design_id, garment_colour, print_side) DO NOTHING;

  -- The Climb
  INSERT INTO public.design_variants (design_id, garment_colour, print_side, transparent_artwork_path, is_available) VALUES
  (v_the_climb_id, 'navy', 'front', '/assets/designs/the-climb/master/print-dark-shirt.png', true),
  (v_the_climb_id, 'black', 'front', '/assets/designs/the-climb/master/print-dark-shirt.png', true),
  (v_the_climb_id, 'cream', 'front', '/assets/designs/the-climb/master/print-light-shirt.png', true)
  ON CONFLICT (design_id, garment_colour, print_side) DO NOTHING;

  -- Justice
  INSERT INTO public.design_variants (design_id, garment_colour, print_side, transparent_artwork_path, is_available) VALUES
  (v_justice_id, 'navy', 'front', '/assets/designs/justice/master/print-dark-shirt.png', true),
  (v_justice_id, 'black', 'front', '/assets/designs/justice/master/print-dark-shirt.png', true),
  (v_justice_id, 'cream', 'front', '/assets/designs/justice/master/print-light-shirt.png', true)
  ON CONFLICT (design_id, garment_colour, print_side) DO NOTHING;

  -- Seed Default Sizes (S, M, L, XL, XXL) for all 7 designs
  INSERT INTO public.design_sizes (design_id, size, is_enabled)
  SELECT d.id, s.sz, true
  FROM public.designs d
  CROSS JOIN (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL')) AS s(sz)
  ON CONFLICT (design_id, size) DO NOTHING;

  -- Seed Initial Inventory (Navy, Black, Cream x S, M, L, XL, XXL)
  INSERT INTO public.inventory (garment_colour, size, quantity_available, reserved_quantity, low_stock_threshold)
  SELECT c.clr, s.sz, 50, 0, 5
  FROM (VALUES ('navy'), ('black'), ('cream')) AS c(clr)
  CROSS JOIN (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL')) AS s(sz)
  ON CONFLICT (garment_colour, size) DO NOTHING;

END $$;
