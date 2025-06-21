// lib/analytics.ts

// This function gets a unique ID for the user from their browser's local storage.
// If it's a new user, it creates a new ID and saves it.
export function getSessionId(): string | null {
  if (typeof window !== 'undefined') {
    if (!localStorage.getItem('user_session_id')) {
      localStorage.setItem('user_session_id', crypto.randomUUID());
    }
    return localStorage.getItem('user_session_id');
  }
  return null;
}

// This function reads the 'utm_campaign' from the URL.
// This is how we know which Instagram ad brought the user here.
// If it's not present, we assume it's 'organic' traffic.
export function getSource(): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('utm_campaign') || 'organic';
  }
  return 'organic';
}

interface AnalyticsEvent {
  event_name: string;
  step_name: string;
  metadata?: Record<string, any>;
}

// This is the main function that sends the event to your Supabase table.
export function logEvent({ event_name, step_name, metadata = {} }: AnalyticsEvent) {
  // This code only runs in the user's browser, not on the server.
  if (typeof window === 'undefined') return;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is not defined.');
    return;
  }

  fetch(`${supabaseUrl}/rest/v1/analytics_events`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_name,
      step_name,
      source: getSource(),
      session_id: getSessionId(),
      metadata,
    }),
  }).catch(console.error);
}
