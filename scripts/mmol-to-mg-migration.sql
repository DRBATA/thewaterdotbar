-- Migration script to convert electrolyte values from mmol to mg
-- Conversion factors:
-- Sodium (Na): 1 mmol = 23 mg
-- Potassium (K): 1 mmol = 39 mg

-- STEP 1: Add new columns with the _mg suffix
ALTER TABLE hydration_options 
ADD COLUMN na_mg_new NUMERIC,
ADD COLUMN k_mg_new NUMERIC;

-- STEP 2: Convert and populate the new columns
-- Use COALESCE to handle NULL values
UPDATE hydration_options
SET 
  na_mg_new = ROUND(COALESCE(na_mmol, 0) * 23),
  k_mg_new = ROUND(COALESCE(k_mmol, 0) * 39);

-- STEP 3: Verify data before proceeding
-- SELECT name, na_mmol, na_mg_new, k_mmol, k_mg_new FROM hydration_options LIMIT 20;

-- STEP 4: Drop the old columns
ALTER TABLE hydration_options
DROP COLUMN na_mmol,
DROP COLUMN k_mmol;

-- STEP 5: Rename the new columns to the standard names
ALTER TABLE hydration_options
RENAME COLUMN na_mg_new TO na_mg;

ALTER TABLE hydration_options
RENAME COLUMN k_mg_new TO k_mg;

-- STEP 6: Add a comment to document the conversion
COMMENT ON TABLE hydration_options IS 'Converted electrolyte values from mmol to mg on 2025-07-14. Na: 1 mmol = 23 mg, K: 1 mmol = 39 mg';
