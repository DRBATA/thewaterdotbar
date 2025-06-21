CREATE TABLE analytics_events (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    event_name TEXT NOT NULL,
    session_id TEXT NOT NULL,
    step_name TEXT,
    source TEXT,
    metadata JSONB
);

-- Enable Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anonymous users to insert into the table
CREATE POLICY "Allow anonymous insert" ON public.analytics_events FOR INSERT WITH CHECK (true);
