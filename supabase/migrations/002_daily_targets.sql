-- Create table for calculated daily nutritional targets
CREATE TABLE IF NOT EXISTS daily_targets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Base hydration targets
    water_ml INTEGER NOT NULL,
    sodium_mg INTEGER NOT NULL,
    potassium_mg INTEGER NOT NULL,
    magnesium_mg INTEGER NOT NULL,
    
    -- Fiber targets
    soluble_fiber_g DECIMAL(4,2),
    insoluble_fiber_g DECIMAL(4,2),
    
    -- Gut health targets
    probiotic_cfu BIGINT,
    
    -- Essential nutrients
    omega3_mg INTEGER,
    polyphenols_mg INTEGER,
    protein_g DECIMAL(5,2),
    
    -- B vitamins
    b6_mg DECIMAL(4,2),
    b9_ug INTEGER,
    b12_ug DECIMAL(4,2),
    
    -- Minerals
    iron_mg DECIMAL(4,2),
    zinc_mg DECIMAL(4,2),
    calcium_mg INTEGER,
    vitamin_d_ug DECIMAL(4,2),
    
    -- Context modifiers applied
    heat_multiplier DECIMAL(3,2) DEFAULT 1.0,
    activity_multiplier DECIMAL(3,2) DEFAULT 1.0,
    muscle_building_multiplier DECIMAL(3,2) DEFAULT 1.0,
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_profile_id, date)
);

-- Index for quick lookups
CREATE INDEX idx_daily_targets_user_date ON daily_targets(user_profile_id, date DESC);

-- Comments
COMMENT ON TABLE daily_targets IS 'Personalized daily nutritional targets calculated from body metrics';
COMMENT ON COLUMN daily_targets.heat_multiplier IS 'Adjustment for hot climate or sauna use';
COMMENT ON COLUMN daily_targets.activity_multiplier IS 'Adjustment for exercise intensity';
COMMENT ON COLUMN daily_targets.muscle_building_multiplier IS 'Adjustment for anabolic goals';
