-- Create hydration_assessments table to store assessment data for email integration
CREATE TABLE IF NOT EXISTS hydration_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    profile JSONB NOT NULL,
    daily_targets JSONB NOT NULL,
    total_intake JSONB NOT NULL,
    activity_level TEXT NOT NULL,
    deficits JSONB NOT NULL,
    recommended_drinks JSONB DEFAULT '[]'::jsonb,
    recommended_meals JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast session_id lookups
CREATE INDEX IF NOT EXISTS idx_hydration_assessments_session_id ON hydration_assessments(session_id);

-- Index for cleanup queries by created_at
CREATE INDEX IF NOT EXISTS idx_hydration_assessments_created_at ON hydration_assessments(created_at);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_hydration_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hydration_assessments_updated_at
    BEFORE UPDATE ON hydration_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_hydration_assessments_updated_at();
