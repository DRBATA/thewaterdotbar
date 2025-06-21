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
}
