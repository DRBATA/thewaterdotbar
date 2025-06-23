// app/dashboard/types.ts

// This file holds the shared data structures for the dashboard.
export interface AnalyticsData {
  source: string;
  visitors: number;
  funnel: {
    step: string;
    count: number;
    rate: string;
  }[];
  completedOrders: number;
  cartItems: Array<{
    session_id: string;
    item_id: string;
    qty: number;
    created_at: string;
  }>;
  chatMessages: Array<{
    session_id: string;
    role: string;
    content: string;
    created_at: string;
  }>;
}
