"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Package, MapPin, User, Calendar } from "lucide-react"
import { toast } from "sonner"

interface Product {
  id: string // Changed from number to support UUIDs
  name: string
}

interface Venue {
  id: string // Changed from number to support UUIDs
  name: string
}

interface StockAddition {
  id: number
  product_name: string
  venue_name: string
  quantity_added: number
  added_by: string
  added_at: string
  notes?: string
}

export default function StockAddition() {
  const [products, setProducts] = useState<Product[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [recentAdditions, setRecentAdditions] = useState<StockAddition[]>([])
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedVenue, setSelectedVenue] = useState('')
  const [quantity, setQuantity] = useState('')
  const [addedBy, setAddedBy] = useState('')
  const [notes, setNotes] = useState('')

  // Load products and venues on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load products - use products-all to get ALL products, not just ones with existing stock
      const productsRes = await fetch('/api/products-all')
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
      }

      // Load venues
      const venuesRes = await fetch('/api/venues')
      if (venuesRes.ok) {
        const venuesData = await venuesRes.json()
        setVenues(venuesData)
      }

      // Load recent additions
      await loadRecentAdditions()
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    }
  }

  const loadRecentAdditions = async () => {
    try {
      const res = await fetch('/api/stock-additions')
      if (res.ok) {
        const data = await res.json()
        setRecentAdditions(data)
      }
    } catch (error) {
      console.error('Error loading recent additions:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProduct || !selectedVenue || !quantity || !addedBy) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    
    // Debug: Log the values being sent
    console.log('DEBUG - Form values:', {
      selectedProduct,
      selectedVenue,
      quantity,
      addedBy,
      notes
    })
    
    const parsedQuantity = parseInt(quantity)
    console.log('DEBUG - Parsed quantity:', parsedQuantity, 'Type:', typeof parsedQuantity)
    
    const requestBody = {
      product_id: selectedProduct, // Send the UUID string directly
      venue_id: selectedVenue,   // Send the UUID string directly
      quantity_added: parsedQuantity, // Can be positive or negative
      added_by: addedBy,
      notes: notes || null
    }
    
    console.log('DEBUG - Request body:', requestBody)
    
    try {
      const res = await fetch('/api/stock-additions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (res.ok) {
        const isNegative = parseInt(quantity) < 0
        toast.success(isNegative ? 'Stock adjustment completed!' : 'Stock added successfully!')
        
        // Reset form
        setSelectedProduct('')
        setSelectedVenue('')
        setQuantity('')
        setNotes('')
        
        // Reload recent additions
        await loadRecentAdditions()
      } else {
        const error = await res.text()
        toast.error(`Failed to add stock: ${error}`)
      }
    } catch (error) {
      console.error('Error adding stock:', error)
      toast.error('Failed to add stock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Package className="w-6 h-6 text-teal-600" />
        <h1 className="text-2xl font-bold">Stock Management</h1>
      </div>

      {/* Add Stock Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Stock Management
          </CardTitle>
          <CardDescription>
            Add stock (positive numbers) or remove stock (negative numbers) for corrections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Selection */}
              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Venue Selection */}
              <div className="space-y-2">
                <Label htmlFor="venue">Venue *</Label>
                <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 50 (or -5 to remove)"
                  step="1"
                  min={undefined}
                />
                <p className="text-xs text-gray-500">
                  Positive numbers add stock, negative numbers remove stock
                </p>
              </div>

              {/* Added By */}
              <div className="space-y-2">
                <Label htmlFor="addedBy">Added By *</Label>
                <Input
                  id="addedBy"
                  value={addedBy}
                  onChange={(e) => setAddedBy(e.target.value)}
                  placeholder="Your name"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about this delivery..."
                rows={2}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Adding Stock...' : 'Add Stock'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Additions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Additions
          </CardTitle>
          <CardDescription>
            Latest stock additions across all venues
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentAdditions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No recent stock additions
            </p>
          ) : (
            <div className="space-y-3">
              {recentAdditions.slice(0, 10).map((addition) => (
                <div key={addition.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{addition.product_name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {addition.venue_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {addition.added_by}
                        </span>
                        <span>
                          {new Date(addition.added_at).toLocaleDateString()}
                        </span>
                      </div>
                      {addition.notes && (
                        <p className="text-sm text-gray-500 mt-1">{addition.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-600">
                      +{addition.quantity_added}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}