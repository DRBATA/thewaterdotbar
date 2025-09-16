-- Add body composition metrics to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,1);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS lean_body_mass_kg DECIMAL(5,2);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_body_water_l DECIMAL(4,2);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS intracellular_water_l DECIMAL(4,2);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS extracellular_water_l DECIMAL(4,2);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS body_fat_percentage DECIMAL(4,2);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS metabolic_rate INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS climate_factor TEXT CHECK (climate_factor IN ('temperate', 'hot_dry', 'hot_humid', 'cold'));

-- Add authentication link
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Create index for auth lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);

-- Comments for documentation
COMMENT ON COLUMN user_profiles.weight_kg IS 'Body weight in kilograms';
COMMENT ON COLUMN user_profiles.lean_body_mass_kg IS 'LBM calculated from body composition analysis';
COMMENT ON COLUMN user_profiles.total_body_water_l IS 'TBW in liters - key for hydration calculations';
COMMENT ON COLUMN user_profiles.intracellular_water_l IS 'ICW - water inside cells';
COMMENT ON COLUMN user_profiles.extracellular_water_l IS 'ECW - water outside cells';
COMMENT ON COLUMN user_profiles.activity_level IS 'Multiplier for calculating daily needs';
COMMENT ON COLUMN user_profiles.climate_factor IS 'Environmental multiplier for hydration needs';
