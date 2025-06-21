// app/dashboard/dashboard-client.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AnalyticsData } from "./types"

interface DashboardClientProps {
  data: AnalyticsData[]
}

export function DashboardClient({ data }: DashboardClientProps) {
  return (
    <div className="min-h-screen bg-cream-50 p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-stone-800 tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
          Analytics Dashboard
        </h1>
        <p className="text-stone-500 mt-2">An overview of your campaign performance and user funnels.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((campaign) => (
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
                </TableBody>
              </Table>
            </CardContent>
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
