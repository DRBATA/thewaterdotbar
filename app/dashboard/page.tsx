// app/dashboard/page.tsx
import { createClient } from "@supabase/supabase-js"
import { DashboardClient } from "./dashboard-client"
import { AnalyticsData } from "./types"

export const dynamic = 'force-dynamic' // ensure the page is always dynamic

// This is a Server Component that fetches data
export default async function DashboardPage() {
  // Create an admin client that can bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch all unique session_id's for each source to count visitors
  const { data: pageViews, error: pageViewError } = await supabase
    .from("analytics_events")
    .select("source, session_id")
    .eq("event_name", "page_view")

  if (pageViewError) {
    console.error("Error fetching page views:", pageViewError)
    return <div>Error loading data.</div>
  }

  // Fetch all events to build the funnels
  const { data: allEvents, error: eventsError } = await supabase
    .from("analytics_events")
    .select("source, session_id, step_name")

  if (eventsError) {
    console.error("Error fetching events:", eventsError)
    return <div>Error loading data.</div>
  }

  // --- Data Processing ---
  const campaigns = [...new Set(allEvents.map((e) => e.source))]
  const funnelSteps = ["landing", "barista_chat", "cart", "checkout"]

  const analyticsData: AnalyticsData[] = campaigns.map((campaign) => {
    const campaignVisitors = new Set(pageViews.filter((v) => v.source === campaign).map((v) => v.session_id)).size
    let lastStepCount = campaignVisitors

    const funnel = funnelSteps.map((step) => {
      const stepUsers = new Set(
        allEvents
          .filter((e) => e.source === campaign && e.step_name === step)
          .map((e) => e.session_id)
      ).size

      const rate = lastStepCount > 0 ? ((stepUsers / lastStepCount) * 100).toFixed(1) + "%" : "0.0%"
      lastStepCount = stepUsers

      return { step, count: stepUsers, rate }
    })

    return {
      source: campaign,
      visitors: campaignVisitors,
      funnel,
    }
  })

  return <DashboardClient data={analyticsData} />
}
