-- These indexes will speed up the queries used by the analytics dashboard.

-- This index helps find all events for a specific campaign source and funnel step, which is the core logic of the dashboard.
CREATE INDEX idx_analytics_events_source_step_name ON public.analytics_events (source, step_name);

-- This index speeds up the initial query to find all 'page_view' events to count unique visitors.
CREATE INDEX idx_analytics_events_event_name ON public.analytics_events (event_name);

-- This index is useful for quickly looking up all events for a single user session.
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events (session_id);
