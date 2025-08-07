"use client"

/**
 * WATER BAR RECONCILIATION DASHBOARD
 * 
 * This is the foundation for a comprehensive business intelligence system.
 * 
 * CURRENT DATA SOURCES (from Supabase):
 * - stock_addition_history: All stock movements (positive = additions, negative = adjustments/waste)
 * - order_items: PIN claims (these are your SALES DATA - each claim = revenue)
 * - venue_stock: Current inventory levels per venue
 * - products: Product catalog with pricing (future: cost basis, margins)
 * - venues: Location data (future: performance by location)
 * 
 * FUTURE BUSINESS INTELLIGENCE EXPANSIONS:
 * 
 * 1. SALES ANALYTICS (PIN Claims = Sales Data):
 *    - order_items.claimed_at = sale timestamp
 *    - order_items.qty = units sold
 *    - products.price = revenue per unit
 *    - Calculate: daily/weekly/monthly sales trends
 *    - Best/worst performing products by venue
 *    - Peak hours analysis from claim timestamps
 * 
 * 2. PROFIT & LOSS ANALYSIS:
 *    - stock_additions with cost_per_unit = COGS (Cost of Goods Sold)
 *    - PIN claims × product.price = Revenue
 *    - Margin = (Revenue - COGS) / Revenue
 *    - Track profitability by product, venue, time period
 * 
 * 3. FORECASTING & INVENTORY OPTIMIZATION:
 *    - Historical claim patterns → predict future demand
 *    - Seasonal trends (summer vs winter hydration needs)
 *    - Venue-specific patterns (gym vs office vs event space)
 *    - Optimal reorder points and quantities
 * 
 * 4. OPERATIONAL INSIGHTS:
 *    - Variance analysis (this page) → identify theft, waste, process issues
 *    - Staff performance (who adds stock vs claim accuracy)
 *    - Customer behavior (hydration plan adherence, repeat purchases)
 * 
 * 5. FINANCIAL REPORTING:
 *    - Monthly P&L statements
 *    - Cash flow from inventory investments
 *    - ROI by venue and product category
 *    - Tax reporting (inventory valuations)
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle, BarChart3, RefreshCw, Filter, X } from 'lucide-react'
import { toast } from "sonner"
import { Label } from "@/components/ui/label"

/**
 * CORE DATA INTERFACES FOR BUSINESS INTELLIGENCE
 * 
 * These interfaces represent the foundation data that can be expanded
 * to support comprehensive business analytics and reporting.
 */

interface ReconciliationItem {
  product_id: string          // Links to products table for pricing, categories, margins
  venue_id: string            // Links to venues table for location analytics
  product_name: string        // Display name
  venue_name: string          // Display name
  stock_added: number         // FUTURE: Add cost_basis for COGS calculation
  stock_removed: number       // Waste/adjustments - important for loss analysis
  items_claimed: number       // SALES DATA! Each claim = revenue transaction
  current_stock: number       // Real-time inventory for reorder alerts
  calculated_stock: number    // Expected stock based on movements
  variance: number            // Key metric: positive = surplus, negative = shortage
  
  // FUTURE EXPANSIONS:
  // revenue?: number         // items_claimed × product.price
  // cost_of_goods?: number   // stock_added × cost_per_unit
  // margin?: number          // (revenue - cost_of_goods) / revenue
  // turnover_rate?: number   // items_claimed / average_stock
  // days_of_supply?: number  // current_stock / average_daily_claims
}

interface ReconciliationSummary {
  total_products: number       // Portfolio size
  items_with_variance: number  // Operational health indicator
  total_stock_added: number    // Total inventory investment
  total_stock_removed: number  // Total waste/adjustments
  total_items_claimed: number  // Total sales volume
  total_current_stock: number  // Total inventory value
  
  // FUTURE BUSINESS METRICS:
  // total_revenue?: number           // total_items_claimed × avg_price
  // total_cost_of_goods?: number     // total_stock_added × avg_cost
  // gross_margin?: number            // (revenue - cogs) / revenue
  // inventory_turnover?: number      // total_items_claimed / avg_stock
  // variance_percentage?: number     // items_with_variance / total_products
}

interface ReconciliationData {
  summary: ReconciliationSummary
  reconciliation: ReconciliationItem[]
  
  // FUTURE ANALYTICS SECTIONS:
  // sales_trends?: SalesTrend[]      // Time-series sales data
  // profit_analysis?: ProfitData[]   // P&L by product/venue
  // forecasts?: ForecastData[]       // Demand predictions
  // alerts?: Alert[]                 // Automated business alerts
}

export default function ReconciliationPage() {
  const [data, setData] = useState<ReconciliationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Filter state
  const [productFilter, setProductFilter] = useState<string>('')
  const [venueFilter, setVenueFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('') // 'product', 'experience', or ''
  const [varianceFilter, setVarianceFilter] = useState<string>('') // 'all', 'variance-only', 'critical'
  
  // Detail view state
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null)
  const [itemTransactions, setItemTransactions] = useState<any[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  useEffect(() => {
    loadReconciliationData()
  }, [])

  /**
   * CORE DATA LOADING FUNCTION
   * 
   * Currently fetches reconciliation data from /api/reconciliation
   * 
   * FUTURE EXPANSIONS:
   * - Add date range filters for historical analysis
   * - Include sales trends: /api/sales-analytics?period=30d
   * - Include profit data: /api/profit-analysis?venue_id=xxx
   * - Include forecasts: /api/forecasting?product_id=xxx
   * - Add real-time updates via WebSocket for live dashboard
   * 
   * BUSINESS INTELLIGENCE OPPORTUNITIES:
   * - Cache frequently accessed data for performance
   * - Add data export functionality (CSV, PDF reports)
   * - Implement automated alerts for critical variances
   * - Add comparative analysis (this month vs last month)
   */
  const loadReconciliationData = async () => {
    setLoading(true)
    try {
      // CURRENT: Basic reconciliation data
      const res = await fetch('/api/reconciliation')
      
      // FUTURE: Parallel data loading for comprehensive dashboard
      // const [reconRes, salesRes, profitRes] = await Promise.all([
      //   fetch('/api/reconciliation'),
      //   fetch('/api/sales-analytics'),
      //   fetch('/api/profit-analysis')
      // ])
      
      if (res.ok) {
        const reconciliationData = await res.json()
        setData(reconciliationData)
        setLastUpdated(new Date())
        
        // FUTURE: Store data in localStorage for offline analysis
        // localStorage.setItem('lastReconciliation', JSON.stringify(reconciliationData))
      } else {
        toast.error('Failed to load reconciliation data')
      }
    } catch (error) {
      console.error('Error loading reconciliation:', error)
      toast.error('Failed to load reconciliation data')
    } finally {
      setLoading(false)
    }
  }

  /**
   * VARIANCE ANALYSIS VISUAL INDICATORS
   * 
   * This function creates the core visual language for inventory health.
   * 
   * BUSINESS INTELLIGENCE APPLICATIONS:
   * - Green (Perfect): Operational excellence indicator
   * - Blue (Surplus): Potential overstock, slow-moving inventory
   * - Red (Shortage): Potential theft, waste, or high demand
   * 
   * FUTURE ENHANCEMENTS:
   * - Add percentage-based thresholds (±5% vs ±10%)
   * - Color-code by financial impact (high-value items get priority)
   * - Add trend indicators (improving vs worsening variance)
   * - Include confidence intervals for expected variance ranges
   */
  const getVarianceBadge = (variance: number) => {
    if (variance === 0) {
      // PERFECT MATCH: Indicates excellent operational control
      return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Perfect</Badge>
    } else if (variance > 0) {
      // SURPLUS: May indicate slow sales, overordering, or returns
      return <Badge variant="outline" className="text-blue-600 border-blue-600"><TrendingUp className="w-3 h-3 mr-1" />+{variance}</Badge>
    } else {
      // SHORTAGE: May indicate theft, waste, high demand, or process issues
      return <Badge variant="destructive"><TrendingDown className="w-3 h-3 mr-1" />{variance}</Badge>
    }
  }

  const getVarianceColor = (variance: number) => {
    if (variance === 0) return 'text-green-600'
    if (variance > 0) return 'text-blue-600'
    return 'text-red-600'
  }

  // Filter reconciliation data based on current filters
  const getFilteredData = () => {
    if (!data) return []
    
    return data.reconciliation.filter(item => {
      // Product name filter
      if (productFilter && !item.product_name.toLowerCase().includes(productFilter.toLowerCase())) {
        return false
      }
      
      // Venue filter
      if (venueFilter && !item.venue_name.toLowerCase().includes(venueFilter.toLowerCase())) {
        return false
      }
      
      // Type filter (product vs experience)
      if (typeFilter && item.type !== typeFilter) {
        return false
      }
      
      // Variance filter
      if (varianceFilter === 'variance-only' && item.variance === 0) {
        return false
      }
      if (varianceFilter === 'critical' && Math.abs(item.variance) < 5) {
        return false
      }
      
      return true
    })
  }

  // Get unique values for filter dropdowns
  const getUniqueProducts = () => {
    if (!data) return []
    return [...new Set(data.reconciliation.map(item => item.product_name))].sort()
  }

  const getUniqueVenues = () => {
    if (!data) return []
    return [...new Set(data.reconciliation.map(item => item.venue_name))].sort()
  }

  // Clear all filters
  const clearFilters = () => {
    setProductFilter('')
    setVenueFilter('')
    setTypeFilter('')
    setVarianceFilter('')
  }

  // Fetch transaction details for a specific item
  const loadItemTransactions = async (item: ReconciliationItem) => {
    setSelectedItem(item)
    setLoadingTransactions(true)
    
    try {
      // For now, skip the API call since schema has issues
      console.log('Clicked item:', item.product_name, 'at', item.venue_name)
      console.log('Product ID:', item.product_id, 'Venue ID:', item.venue_id)
      setItemTransactions([])
      setLoadingTransactions(false)
      return
      
      const response = await fetch(`/api/reconciliation/transactions?product_id=${item.product_id}&venue_id=${item.venue_id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch transaction details')
      }
      const transactions = await response.json()
      setItemTransactions(transactions)
    } catch (error) {
      console.error('Error loading transaction details:', error)
      toast.error('Failed to load transaction details')
      setItemTransactions([])
    } finally {
      setLoadingTransactions(false)
    }
  }

  // Close transaction detail modal
  const closeTransactionModal = () => {
    setSelectedItem(null)
    setItemTransactions([])
  }

  // Obfuscate email for privacy (show 60% of characters)
  const obfuscateEmail = (email: string) => {
    if (!email) return 'Unknown'
    const [local, domain] = email.split('@')
    if (!domain) return email
    
    const visibleChars = Math.ceil(local.length * 0.6)
    const obfuscatedLocal = local.substring(0, visibleChars) + '*'.repeat(local.length - visibleChars)
    return `${obfuscatedLocal}@${domain}`
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
          <span className="ml-2 text-lg">Loading reconciliation data...</span>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Data</h2>
          <p className="text-gray-600 mb-4">Unable to load reconciliation data</p>
          <Button onClick={loadReconciliationData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Get filtered data
  const filteredData = getFilteredData()
  const itemsWithVariance = filteredData.filter(item => item.variance !== 0)
  const criticalVariance = filteredData.filter(item => Math.abs(item.variance) >= 5)

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold">Inventory Reconciliation</h1>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={loadReconciliationData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter reconciliation data by product, venue, type, or variance level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Product Filter */}
            <div>
              <Label htmlFor="product-filter">Product/Experience</Label>
              <select
                id="product-filter"
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Products/Experiences</option>
                {getUniqueProducts().map(product => (
                  <option key={product} value={product}>{product}</option>
                ))}
              </select>
            </div>

            {/* Venue Filter */}
            <div>
              <Label htmlFor="venue-filter">Venue</Label>
              <select
                id="venue-filter"
                value={venueFilter}
                onChange={(e) => setVenueFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Venues</option>
                {getUniqueVenues().map(venue => (
                  <option key={venue} value={venue}>{venue}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <Label htmlFor="type-filter">Type</Label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Types</option>
                <option value="product">Products Only</option>
                <option value="experience">Experiences Only</option>
              </select>
            </div>

            {/* Variance Filter */}
            <div>
              <Label htmlFor="variance-filter">Variance</Label>
              <select
                id="variance-filter"
                value={varianceFilter}
                onChange={(e) => setVarianceFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Items</option>
                <option value="variance-only">With Variance Only</option>
                <option value="critical">Critical Variance (±5+)</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <Button 
                onClick={clearFilters} 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BUSINESS INTELLIGENCE SUMMARY CARDS */}
      {/* 
        These cards represent the foundation KPIs for Water Bar operations.
        Each metric connects to broader business intelligence opportunities:
        
        1. Total Products = Portfolio Diversity
           - FUTURE: Add category breakdown (hydration vs energy vs wellness)
           - FUTURE: Show product lifecycle stages (new, mature, declining)
           
        2. Items with Variance = Operational Health Score
           - FUTURE: Calculate variance percentage as operational KPI
           - FUTURE: Set automated alerts when variance exceeds thresholds
           - FUTURE: Track variance trends over time
           
        3. Stock Added = Investment Tracking
           - FUTURE: Add cost basis to calculate total inventory investment
           - FUTURE: Show cash flow impact of inventory purchases
           - FUTURE: Calculate inventory turnover ratios
           
        4. Items Claimed = Sales Volume (Revenue Proxy)
           - FUTURE: Multiply by product prices for actual revenue
           - FUTURE: Show growth trends (daily/weekly/monthly)
           - FUTURE: Calculate conversion rates (claims vs available stock)
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PORTFOLIO DIVERSITY METRIC */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total_products}</div>
            <p className="text-xs text-gray-500">Tracked across all venues</p>
            {/* FUTURE: Add category breakdown chart */}
          </CardContent>
        </Card>

        {/* OPERATIONAL HEALTH INDICATOR */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Items with Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.summary.items_with_variance}</div>
            <p className="text-xs text-gray-500">Need investigation</p>
            {/* FUTURE: Show percentage and trend arrow */}
          </CardContent>
        </Card>

        {/* INVENTORY INVESTMENT TRACKING */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Stock Added</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{data.summary.total_stock_added}</div>
            <p className="text-xs text-gray-500">Total additions</p>
            {/* FUTURE: Show cost basis and cash flow impact */}
          </CardContent>
        </Card>

        {/* SALES VOLUME (REVENUE PROXY) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Items Claimed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.summary.total_items_claimed}</div>
            <p className="text-xs text-gray-500">Via PIN claims</p>
            {/* FUTURE: Show actual revenue and growth trend */}
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalVariance.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Critical Variance Alert
            </CardTitle>
            <CardDescription className="text-red-600">
              {criticalVariance.length} item(s) have significant discrepancies (±5 or more)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalVariance.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <span className="font-medium">{item.product_name}</span>
                    <span className="text-gray-500 ml-2">at {item.venue_name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">Expected: {item.calculated_stock}</span>
                    <span className="text-sm">Actual: {item.current_stock}</span>
                    <Badge variant="destructive" className="font-bold">
                      {item.variance > 0 ? '+' : ''}{item.variance}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Reconciliation Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Detailed Reconciliation</span>
            <Badge variant="outline" className="ml-2">
              {filteredData.length} of {data.reconciliation.length} items
            </Badge>
          </CardTitle>
          <CardDescription>
            Stock movements vs PIN claims analysis. Variance = Current Stock - Expected Stock
            {(productFilter || venueFilter || typeFilter || varianceFilter) && (
              <span className="block mt-1 text-teal-600">
                Filters active: {[productFilter && 'Product', venueFilter && 'Venue', typeFilter && 'Type', varianceFilter && 'Variance'].filter(Boolean).join(', ')}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Product</th>
                  <th className="text-left p-2 font-medium">Venue</th>
                  <th className="text-right p-2 font-medium">Added</th>
                  <th className="text-right p-2 font-medium">Removed</th>
                  <th className="text-right p-2 font-medium">Claimed</th>
                  <th className="text-right p-2 font-medium">Expected</th>
                  <th className="text-right p-2 font-medium">Current</th>
                  <th className="text-center p-2 font-medium">Variance</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr 
                    key={index} 
                    className={`border-b hover:bg-gray-50 cursor-pointer transition-colors ${Math.abs(item.variance) >= 5 ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-blue-50'}`}
                    onClick={() => loadItemTransactions(item)}
                    title="Click to view transaction details"
                  >
                    <td className="p-2 font-medium">
                      {item.product_name}
                      {item.type && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {item.type === 'product' ? 'Product' : 'Experience'}
                        </Badge>
                      )}
                    </td>
                    <td className="p-2 text-gray-600">{item.venue_name}</td>
                    <td className="p-2 text-right text-green-600">+{item.stock_added}</td>
                    <td className="p-2 text-right text-red-600">{item.stock_removed > 0 ? `-${item.stock_removed}` : '0'}</td>
                    <td className="p-2 text-right text-blue-600">{item.items_claimed}</td>
                    <td className="p-2 text-right font-medium">{item.calculated_stock}</td>
                    <td className="p-2 text-right font-medium">{item.current_stock}</td>
                    <td className="p-2 text-center">
                      {getVarianceBadge(item.variance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FUTURE BUSINESS INTELLIGENCE ROADMAP */}
      {/*
        This section outlines the complete business intelligence expansion plan.
        Each feature builds on the existing reconciliation foundation.
        
        IMPLEMENTATION PRIORITY:
        1. Sales Analytics (easiest - PIN claims are already sales data)
        2. Profit/Loss Analysis (medium - requires cost basis in stock_additions)
        3. Forecasting (complex - requires historical pattern analysis)
        
        DATA REQUIREMENTS FOR EACH FEATURE:
        
        SALES ANALYTICS:
        - order_items.claimed_at (timestamp) → time-series analysis
        - order_items.qty × products.price → revenue calculation
        - venue_id → location-based performance
        - product categories → category performance
        - customer emails → repeat customer analysis
        
        PROFIT & LOSS ANALYSIS:
        - stock_additions.quantity_added × cost_per_unit → COGS
        - PIN claims × product.price → Revenue
        - (Revenue - COGS) / Revenue → Gross Margin
        - venue overhead costs → Net Profit
        - time periods → P&L statements
        
        FORECASTING & DEMAND PLANNING:
        - Historical claim patterns → seasonal trends
        - Venue-specific demand patterns → location optimization
        - Product lifecycle analysis → inventory planning
        - External factors (weather, events) → demand modeling
        - Reorder point optimization → automated purchasing
        
        AUTOMATED ALERTS & MONITORING:
        - Variance thresholds → operational alerts
        - Low stock warnings → reorder alerts
        - High variance patterns → theft/waste detection
        - Sales velocity changes → demand shift alerts
        - Profitability alerts → margin protection
      */}
      <Card className="border-dashed border-gray-300">
        <CardHeader>
          <CardTitle className="text-gray-500">Business Intelligence Roadmap</CardTitle>
          <CardDescription>
            Transform reconciliation data into comprehensive business insights and automated operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-gray-400">
            {/* PHASE 1: SALES ANALYTICS */}
            <div className="p-4">
              <TrendingUp className="w-8 h-8 mx-auto mb-2" />
              <h3 className="font-medium">Sales Analytics</h3>
              <p className="text-sm mb-2">Transform PIN claims into sales intelligence</p>
              <div className="text-xs text-left space-y-1">
                <div>• Daily/weekly/monthly revenue trends</div>
                <div>• Best/worst performing products</div>
                <div>• Peak hours and seasonal patterns</div>
                <div>• Venue performance comparison</div>
                <div>• Customer behavior analysis</div>
              </div>
            </div>
            
            {/* PHASE 2: FORECASTING */}
            <div className="p-4">
              <BarChart3 className="w-8 h-8 mx-auto mb-2" />
              <h3 className="font-medium">Demand Forecasting</h3>
              <p className="text-sm mb-2">Predict future inventory needs</p>
              <div className="text-xs text-left space-y-1">
                <div>• Historical demand pattern analysis</div>
                <div>• Seasonal trend predictions</div>
                <div>• Optimal reorder points</div>
                <div>• Venue-specific demand modeling</div>
                <div>• Automated purchase recommendations</div>
              </div>
            </div>
            
            {/* PHASE 3: PROFIT & LOSS */}
            <div className="p-4">
              <CheckCircle className="w-8 h-8 mx-auto mb-2" />
              <h3 className="font-medium">Profit & Loss Analysis</h3>
              <p className="text-sm mb-2">Complete financial performance tracking</p>
              <div className="text-xs text-left space-y-1">
                <div>• Cost of goods sold (COGS) tracking</div>
                <div>• Gross margin by product/venue</div>
                <div>• Monthly P&L statements</div>
                <div>• ROI and cash flow analysis</div>
                <div>• Tax reporting and valuations</div>
              </div>
            </div>
          </div>
          
          {/* TECHNICAL IMPLEMENTATION NOTES */}
          <div className="mt-6 p-4 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Technical Implementation Path:</strong>
            <div className="mt-2 space-y-1">
              <div>1. Add cost_per_unit field to stock_additions table</div>
              <div>2. Create sales_analytics API endpoint using order_items data</div>
              <div>3. Implement time-series analysis for forecasting</div>
              <div>4. Build automated alert system with configurable thresholds</div>
              <div>5. Add data export functionality (CSV, PDF reports)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selectedItem.product_name}</h2>
                  <p className="text-gray-600">{selectedItem.venue_name}</p>
                </div>
                <Button onClick={closeTransactionModal} variant="outline" size="sm">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {loadingTransactions ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
                  <span className="ml-2">Loading transaction details...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-green-600 font-medium">Stock Added</div>
                      <div className="text-2xl font-bold text-green-700">+{selectedItem.stock_added}</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-red-600 font-medium">Stock Removed</div>
                      <div className="text-2xl font-bold text-red-700">-{selectedItem.stock_removed}</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-blue-600 font-medium">Items Claimed</div>
                      <div className="text-2xl font-bold text-blue-700">{selectedItem.items_claimed}</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-600">Current Variance</div>
                        <div className={`text-lg font-bold ${getVarianceColor(selectedItem.variance)}`}>
                          {selectedItem.variance > 0 ? '+' : ''}{selectedItem.variance}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Expected: {selectedItem.calculated_stock}</div>
                        <div className="text-sm text-gray-600">Current: {selectedItem.current_stock}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Transaction History</h3>
                    {itemTransactions.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No transaction details available</p>
                    ) : (
                      <div className="space-y-3">
                        {itemTransactions.map((transaction, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  transaction.type === 'stock_addition' ? 'bg-green-500' :
                                  transaction.type === 'stock_removal' ? 'bg-red-500' :
                                  transaction.type === 'purchase' ? 'bg-blue-500' :
                                  transaction.type === 'claim' ? 'bg-purple-500' :
                                  'bg-gray-500'
                                }`}></div>
                                <div>
                                  <div className="font-medium capitalize">
                                    {transaction.type?.replace('_', ' ') || 'Unknown'}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {transaction.created_at ? new Date(transaction.created_at).toLocaleString() : 'Unknown time'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-bold ${
                                  transaction.quantity > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {transaction.user_name || 
                                   (transaction.email ? obfuscateEmail(transaction.email) : 'Unknown user')}
                                </div>
                              </div>
                            </div>
                            {transaction.notes && (
                              <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                {transaction.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
