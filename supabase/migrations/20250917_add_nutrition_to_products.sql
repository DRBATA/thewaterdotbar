-- Add nutritional columns to products table for AI hydration calculations
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sodium_mg numeric,
ADD COLUMN IF NOT EXISTS potassium_mg numeric,
ADD COLUMN IF NOT EXISTS magnesium_mg numeric,
ADD COLUMN IF NOT EXISTS calcium_mg numeric,
ADD COLUMN IF NOT EXISTS fiber_g numeric,
ADD COLUMN IF NOT EXISTS soluble_fiber_g numeric,
ADD COLUMN IF NOT EXISTS insoluble_fiber_g numeric,
ADD COLUMN IF NOT EXISTS protein_g numeric,
ADD COLUMN IF NOT EXISTS volume_ml numeric,
ADD COLUMN IF NOT EXISTS water_content_ml numeric,
ADD COLUMN IF NOT EXISTS probiotic_cfu numeric,
ADD COLUMN IF NOT EXISTS omega3_mg numeric,
ADD COLUMN IF NOT EXISTS polyphenols_mg numeric,
ADD COLUMN IF NOT EXISTS vitamin_c_mg numeric,
ADD COLUMN IF NOT EXISTS vitamin_d_iu numeric,
ADD COLUMN IF NOT EXISTS iron_mg numeric,
ADD COLUMN IF NOT EXISTS zinc_mg numeric;

-- Create hydration_targets table for configurable daily/weekly targets
CREATE TABLE IF NOT EXISTS public.hydration_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text UNIQUE,
  water_ml_per_kg numeric,
  protein_g_per_kg numeric,
  sodium_mg_base numeric,
  potassium_mg_min numeric,
  magnesium_mg_min numeric,
  calcium_mg_min numeric,
  soluble_fiber_g_min numeric,
  insoluble_fiber_g_min numeric,
  probiotics_cfu_week numeric,
  omega3_mg_week numeric,
  polyphenols_mg_week numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default targets
INSERT INTO public.hydration_targets
(label, water_ml_per_kg, protein_g_per_kg, sodium_mg_base, potassium_mg_min,
 magnesium_mg_min, calcium_mg_min, soluble_fiber_g_min, insoluble_fiber_g_min,
 probiotics_cfu_week, omega3_mg_week, polyphenols_mg_week)
VALUES
('default', 30, 1.2, 1500, 3500, 350, 900, 8, 12, 1e11, 14000, 3500)
ON CONFLICT (label) DO UPDATE SET
 water_ml_per_kg=EXCLUDED.water_ml_per_kg,
 protein_g_per_kg=EXCLUDED.protein_g_per_kg,
 sodium_mg_base=EXCLUDED.sodium_mg_base,
 potassium_mg_min=EXCLUDED.potassium_mg_min,
 magnesium_mg_min=EXCLUDED.magnesium_mg_min,
 calcium_mg_min=EXCLUDED.calcium_mg_min,
 soluble_fiber_g_min=EXCLUDED.soluble_fiber_g_min,
 insoluble_fiber_g_min=EXCLUDED.insoluble_fiber_g_min,
 probiotics_cfu_week=EXCLUDED.probiotics_cfu_week,
 omega3_mg_week=EXCLUDED.omega3_mg_week,
 polyphenols_mg_week=EXCLUDED.polyphenols_mg_week,
 updated_at=now();

-- Update Rite Greens with actual nutritional data
UPDATE public.products SET
  calcium_mg = 106,  -- 15% RNI
  vitamin_b6_mg = 1.54,  -- 110% RNI
  vitamin_b9_folate_mcg = 240,  -- 120% RNI
  vitamin_b12_mcg = 0.8,  -- 53% RNI
  iron_mg = 6.5,  -- 75% RNI men, 44% women
  zinc_mg = 3.3,  -- 35% RNI men, 47% women
  vitamin_d_iu = 200,  -- 5 μg = 200 IU (50% RNI)
  volume_ml = 250,  -- Mixed with water
  water_content_ml = 250
WHERE id = '8449b9da-6f17-4a62-885f-813bd4c5f4d4';

-- Update Poppy (prebiotic soda) - fiber focus
UPDATE public.products SET
  soluble_fiber_g = 2.0,  -- Prebiotic fiber
  volume_ml = 355,
  water_content_ml = 340
WHERE name ILIKE '%poppy%';

-- Update Once Upon a Coconut - potassium focus
UPDATE public.products SET
  potassium_mg = 600,
  sodium_mg = 50,
  volume_ml = 500,
  water_content_ml = 490
WHERE name ILIKE '%coconut%';

-- Update Celery Juice - sodium/potassium balance
UPDATE public.products SET
  sodium_mg = 200,
  potassium_mg = 500,
  volume_ml = 500,
  water_content_ml = 485
WHERE name ILIKE '%celery%';
