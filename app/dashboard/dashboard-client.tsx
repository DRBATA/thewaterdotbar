// app/dashboard/dashboard-client.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AnalyticsData } from "./types"

interface DashboardClientProps {
  data: AnalyticsData[];
  campaignCounts?: { source: string; count: number; utm_campaigns: string[] }[];
}

export function DashboardClient({ data, campaignCounts }: DashboardClientProps) {
  return (
    <div className="min-h-screen bg-cream-50 p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-stone-800 tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
          Analytics Dashboard
        </h1>
        <p className="text-stone-500 mt-2">An overview of your campaign performance and user funnels.</p>
      </header>

      {campaignCounts && campaignCounts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Completed Orders by Campaign (All Data)</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Source</TableHead>
                <TableHead># Orders</TableHead>
                <TableHead>UTM Campaign(s)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaignCounts.map((row: { source: string; count: number; utm_campaigns: string[] }) => (
                <TableRow key={row.source || 'unknown'}>
                  <TableCell>{row.source || 'unknown'}</TableCell>
                  <TableCell>{row.count}</TableCell>
                  <TableCell>{row.utm_campaigns && row.utm_campaigns.length > 0 ? row.utm_campaigns.join(', ') : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((campaign: AnalyticsData) => (
          <Card key={campaign.source} className="bg-white shadow-lg border-stone-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-amber-800">{campaign.source}</span>
                <Badge variant="secondary">{campaign.visitors} Visitors</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Step</TableHead>
                    <TableHead className="text-right">Users</TableHead>
                    <TableHead className="text-right">Conv. Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaign.funnel.map((step, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium capitalize">{step.step.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-right">{step.count}</TableCell>
                      <TableCell className="text-right">{step.rate}</TableCell>
                    </TableRow>
                  ))}
                  {/* Completed Orders Row */}
                  {(() => {
                    const lastStepCount = campaign.funnel.length > 0 ? campaign.funnel[campaign.funnel.length - 1].count : 0;
                    const convRate = lastStepCount > 0 ? ((campaign.completedOrders / lastStepCount) * 100).toFixed(1) + "%" : "0.0%";
                    return (
                      <TableRow key="completed-orders">
                        <TableCell className="font-medium">Completed Orders</TableCell>
                        <TableCell className="text-right">{campaign.completedOrders}</TableCell>
                        <TableCell className="text-right">{convRate}</TableCell>
                      </TableRow>
                    );
                  })()}
                </TableBody>
              </Table>
            </CardContent>

            {/* Cart Items Section */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Cart Items</h3>
              {campaign.cartItems.length === 0 ? (
                <div className="text-stone-400">No items added to carts for this campaign.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>Item ID</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Added At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaign.cartItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.session_id}</TableCell>
                        <TableCell>{item.item_id}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>{item.created_at}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Barista Chat Section */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Barista Chat</h3>
              {campaign.chatMessages.length === 0 ? (
                <div className="text-stone-400">No chat conversations for this campaign.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaign.chatMessages.map((msg, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{msg.session_id}</TableCell>
                        <TableCell>{msg.role}</TableCell>
                        <TableCell>{msg.content}</TableCell>
                        <TableCell>{msg.created_at}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-stone-500">No analytics data yet. Check back after you've had some visitors!</p>
        </div>
      )}
    </div>
  )
}
