-- Create table for tracking daily consumption
CREATE TABLE IF NOT EXISTS consumption_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- What was consumed
    item_name TEXT NOT NULL,
    hydration_option_id UUID REFERENCES hydration_options(id),
    quantity DECIMAL(5,2) DEFAULT 1.0,
    
    -- Photo-based logging
    photo_url TEXT,
    ai_confidence DECIMAL(3,2),
    ai_recognized_items JSONB,
    
    -- Nutritional values (calculated from hydration_options * quantity)
    water_ml INTEGER,
    sodium_mg DECIMAL(8,2),
    potassium_mg DECIMAL(8,2),
    magnesium_mg DECIMAL(8,2),
    soluble_fiber_g DECIMAL(6,2),
    insoluble_fiber_g DECIMAL(6,2),
    probiotic_cfu BIGINT,
    omega3_mg DECIMAL(8,2),
    polyphenols_mg DECIMAL(8,2),
    protein_g DECIMAL(6,2),
    
    -- Context
    consumption_type TEXT CHECK (consumption_type IN ('meal', 'snack', 'drink', 'supplement')),
    meal_time TEXT CHECK (meal_time IN ('breakfast', 'lunch', 'dinner', 'pre_workout', 'post_workout', 'other')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_consumption_log_user_date ON consumption_log(user_profile_id, logged_at DESC);
CREATE INDEX idx_consumption_log_hydration_option ON consumption_log(hydration_option_id);

-- Comments
COMMENT ON TABLE consumption_log IS 'Tracks all food, drinks, and supplements consumed by users';
COMMENT ON COLUMN consumption_log.ai_recognized_items IS 'JSON array of items recognized from photo with confidence scores';
COMMENT ON COLUMN consumption_log.ai_confidence IS 'Overall confidence score of AI recognition (0-1)';
