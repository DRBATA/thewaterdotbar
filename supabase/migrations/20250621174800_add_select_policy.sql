-- This policy allows server-side code (like our dashboard page)
-- using the 'service_role' key to read all data from the analytics_events table.
-- Without this, the dashboard cannot fetch the data to display.
CREATE POLICY "Allow service_role to read all data"
ON public.analytics_events
FOR SELECT
TO service_role
USING (true);
