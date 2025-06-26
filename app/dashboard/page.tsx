// app/dashboard/page.tsx
import { createClient } from "@supabase/supabase-js"
import { DashboardClient } from "@/app/dashboard/dashboard-client"
import { AnalyticsData } from "./types"

export const dynamic = 'force-dynamic' // ensure the page is always dynamic

// This is a Server Component that fetches data
export default async function DashboardPage() {
  // Create an admin client that can bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch completed order counts per campaign (legacy: by source, and enhanced: by utm_campaign if present)
  const { data: campaignCountsRaw, error: campaignCountsError } = await supabase
    .from("analytics_events")
    .select("source, utm_campaign")
    .eq("event_name", "order_completed");

  if (campaignCountsError) {
    console.error("Error fetching completed order counts:", campaignCountsError);
    return <div>Error loading campaign order summary.</div>;
  }

  // Group and count orders per source (legacy) and show utm_campaign if present
  type CampaignCountRow = { source: string | null; utm_campaign: string | null };
  const campaignMap: Record<string, { count: number, utm_campaigns: Set<string> }> = {};
  (campaignCountsRaw || []).forEach((row: CampaignCountRow) => {
    const key = row.source || "unknown";
    if (!campaignMap[key]) {
      campaignMap[key] = { count: 0, utm_campaigns: new Set() };
    }
    campaignMap[key].count += 1;
    if (row.utm_campaign) {
      campaignMap[key].utm_campaigns.add(row.utm_campaign);
    }
  });
  const campaignCounts = Object.entries(campaignMap).map(([source, val]) => ({
    source,
    count: val.count,
    utm_campaigns: Array.from(val.utm_campaigns),
  }));
  

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

  const orderCountMap: Record<string, number> = {};
(campaignCounts || []).forEach(row => {
  orderCountMap[row.source || "organic"] = row.count;
});

// Fetch all cart_items and join with cart_headers to get session_id
const { data: cartItemsRaw } = await supabase
  .from("cart_items")
  .select("item_id, qty, created_at, cart_id, cart_headers(session_id)");

// Fetch all analytics_events to map session_id to utm_campaign
const { data: analyticsEventsRaw } = await supabase
  .from("analytics_events")
  .select("session_id, source");

// Build a map of session_id => utm_campaign
const sessionToCampaign: Record<string, string> = {};
(analyticsEventsRaw || []).forEach(ev => {
  sessionToCampaign[ev.session_id] = ev.source || "organic";
});

// Group cart items by campaign

type CartItemWithHeader = {
  item_id: string;
  qty: number;
  created_at: string;
  cart_headers: { session_id: string } | { session_id: string }[] | null;
};

const cartItems: CartItemWithHeader[] = (cartItemsRaw || []) as CartItemWithHeader[];
const cartItemsByCampaign: Record<string, Array<{ session_id: string; item_id: string; qty: number; created_at: string }>> = {};
cartItems.forEach(item => {
  const session_id = Array.isArray(item.cart_headers)
    ? item.cart_headers[0]?.session_id
    : item.cart_headers?.session_id;
  const safeCampaign = (session_id && sessionToCampaign[session_id]) ? sessionToCampaign[session_id] : "organic";
  if (!cartItemsByCampaign[safeCampaign]) cartItemsByCampaign[safeCampaign] = [];
  cartItemsByCampaign[safeCampaign].push({
    session_id: session_id || "unknown",
    item_id: item.item_id,
    qty: item.qty,
    created_at: item.created_at,
  });
});

// Fetch all chat_sessions and join with analytics_events for utm_campaign
const { data: chatSessionsRaw } = await supabase
  .from("chat_sessions")
  .select("id, session_id");

// Fetch all chat_messages
const { data: chatMessagesRaw } = await supabase
  .from("chat_messages")
  .select("session_id, role, content, created_at");

// Group chat messages by campaign
const chatMessagesByCampaign: Record<string, Array<{ session_id: string; role: string; content: string; created_at: string }>> = {};
(chatMessagesRaw || []).forEach(msg => {
  const campaign = sessionToCampaign[msg.session_id] || "organic";
  if (!chatMessagesByCampaign[campaign]) chatMessagesByCampaign[campaign] = [];
  chatMessagesByCampaign[campaign].push({
    session_id: msg.session_id,
    role: msg.role,
    content: msg.content,
    created_at: msg.created_at,
  });
});

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
      completedOrders: orderCountMap[campaign] || 0,
      cartItems: cartItemsByCampaign[campaign] || [],
      chatMessages: chatMessagesByCampaign[campaign] || [],
    }
  })

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h2>Completed Orders by Campaign (All Data)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px' }}>Campaign Source</th>
              <th style={{ textAlign: 'left', padding: '8px' }}># Orders</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>UTM Campaign(s)</th>
            </tr>
          </thead>
          <tbody>
            {(campaignCounts || []).map(row => (
              <tr key={row.source || 'unknown'}>
                <td style={{ padding: '8px' }}>{row.source || 'unknown'}</td>
                <td style={{ padding: '8px' }}>{row.count}</td>
                <td style={{ padding: '8px' }}>{row.utm_campaigns && row.utm_campaigns.length > 0 ? row.utm_campaigns.join(', ') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DashboardClient data={analyticsData} campaignCounts={campaignCounts} />
    </>
  )
}
