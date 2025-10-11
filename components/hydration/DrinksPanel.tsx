'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useHydrationContext } from '@/contexts'

interface DrinksPanelProps {
  onNext?: () => void
  trackingOrderId?: string | null
}

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  consumed: boolean
  nutrients: {
    water: number
    sodium: number
    potassium: number
    magnesium: number
    calcium: number
    fiber: number
    soluble_fiber: number
    insoluble_fiber: number
    protein: number
    iron: number
    zinc: number
    copper: number
    choline: number
    b6: number
    b9: number
    b12: number
    vitamin_c: number
    vitamin_d: number
    caffeine: number
    probiotics: number
    omega3: number
    polyphenols: number
  }
}

export function DrinksPanel({ onNext, trackingOrderId }: DrinksPanelProps) {
  const { drinks, deficits } = useHydrationContext()
  const { toast } = useToast()
  const [selectedDrink, setSelectedDrink] = useState<any>(null)
  const [addedDrinks, setAddedDrinks] = useState<any[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedOrderItems, setSelectedOrderItems] = useState<Set<string>>(new Set())
  const [isLoadingOrder, setIsLoadingOrder] = useState(false)
  const [isUpdatingConsumption, setIsUpdatingConsumption] = useState(false)

  // Load available drinks from database
  useEffect(() => {
    const loadDrinks = async () => {
      try {
        const response = await fetch('/api/hydration-options')
        const data = await response.json()
        drinks.setAvailableDrinks(data.drinks || [])
      } catch (error) {
        console.error('Error loading drinks:', error)
      }
    }
    loadDrinks()
  }, [])

  // Load order items if trackingOrderId is provided
  useEffect(() => {
    if (trackingOrderId) {
      loadOrderItems()
    }
  }, [trackingOrderId])

  const loadOrderItems = async () => {
    if (!trackingOrderId) return
    
    setIsLoadingOrder(true)
    try {
      const response = await fetch(`/api/orders/${trackingOrderId}/items`)
      const data = await response.json()
      
      if (data.items) {
        // Filter out already consumed items
        const unconsumed = data.items.filter((item: OrderItem) => !item.consumed)
        setOrderItems(unconsumed)
      }
    } catch (error) {
      console.error('Error loading order items:', error)
      toast({
        title: 'Error',
        description: 'Failed to load purchased drinks',
        variant: 'destructive'
      })
    } finally {
      setIsLoadingOrder(false)
    }
  }

  const toggleOrderItem = (itemId: string) => {
    setSelectedOrderItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const handleAddSelectedToIntake = async () => {
    if (selectedOrderItems.size === 0) return
    
    setIsUpdatingConsumption(true)
    try {
      // 1. Add to Dexie with REAL nutrients from products table
      const { drinkLogHelpers, assessmentHelpers } = await import('@/lib/dexie-db')
      
      // Prepare drinks for logging with actual product nutrients
      const drinksToLog = []
      for (const itemId of selectedOrderItems) {
        const item = orderItems.find(i => i.id === itemId)
        if (!item) continue
        
        // Use REAL nutrients from products table (already fetched by API)
        drinksToLog.push({
          product_id: item.product_id,
          name: item.product_name,
          quantity: item.quantity,
          nutrients: item.nutrients // ✅ Real data from Supabase products table!
        })
      }
      
      // Use helper to log all drinks (assessment_id is optional!)
      if (drinksToLog.length > 0) {
        await drinkLogHelpers.logDrinks(drinksToLog, 'email_tracking')
        
        // Check if user should create assessment for better recommendations
        const hasAssessment = await assessmentHelpers.getCurrentAssessment()
        if (!hasAssessment) {
          console.log('💡 Tip: Complete ProfilePanel → "Generate Plan" for personalized recommendations')
        }
      }
      
      // 2. Update Supabase (mark as consumed)
      await fetch('/api/orders/update-consumption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: trackingOrderId,
          consumed_items: Array.from(selectedOrderItems)
        })
      })
      
      // 3. Show success and refresh
      toast({
        title: 'Success!',
        description: `Added ${selectedOrderItems.size} drinks to your hydration log`
      })
      
      // 4. Refresh the hydration context from Dexie
      drinks.refreshFromDexie()
      
      // Remove selected items from UI
      setOrderItems(prev => prev.filter(item => !selectedOrderItems.has(item.id)))
      setSelectedOrderItems(new Set())
      
    } catch (error) {
      console.error('Error updating consumption:', error)
      toast({
        title: 'Error',
        description: 'Failed to update tracking',
        variant: 'destructive'
      })
    } finally {
      setIsUpdatingConsumption(false)
    }
  }

  // Handle adding a drink
  const handleAddDrink = (drink: any) => {
    const nutrients = {
      water: drink.h2o_ml || 0,
      sodium: drink.na_mg || 0,
      potassium: drink.k_mg || 0,
      magnesium: drink.mg_mg || 0,
      calcium: drink.calcium_mg || 0,
      fiber: (drink.soluble_fiber_g || 0) + (drink.insoluble_fiber_g || 0),
      protein: drink.protein_g || 0,
      probiotics: drink.probiotic_cfu || 0,
      omega3: drink.omega3_mg || 0,
      polyphenols: drink.polyphenols_mg || 0,
      b6: drink.b6_mg || 0,
      b9: drink.b9_ug || 0,
      b12: drink.b12_ug || 0,
      iron: drink.iron_mg || 0,
      zinc: drink.zinc_mg || 0,
      copper: drink.copper_mg || 0,
      choline: drink.choline_mg || 0,
      vitamin_c: drink.vitamin_c_mg || 0,
      vitamin_d: drink.vitamin_d_ug || 0,
      caffeine: drink.caffeine_mg || 0,
      soluble_fiber: drink.soluble_fiber_g || 0,
      insoluble_fiber: drink.insoluble_fiber_g || 0
    }

    drinks.addDrink(nutrients)
    setAddedDrinks([...addedDrinks, drink]) // Track added drinks
    
    toast({
      title: `Added ${drink.name}`,
      description: `${drink.h2o_ml || 0}ml water${drink.caffeine_mg ? `, ${drink.caffeine_mg}mg caffeine` : ''}`
    })
  }

  // Quick add common drinks
  const quickAddWater = (amount: number) => {
    drinks.addDrink({ water: amount })
    toast({
      title: `Added ${amount}ml water`,
      description: 'Plain water'
    })
  }

  const filteredDrinks = drinks.availableDrinks
    .filter(d => 
      d.category === 'drink' && 
      d.name.toLowerCase().includes(drinks.drinkSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (drinks.drinkSortBy === "name") return a.name.localeCompare(b.name)
      return (b.h2o_ml || 0) - (a.h2o_ml || 0)
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle>What have you drunk today?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Tracking Section */}
        {trackingOrderId && (
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-blue-900 flex items-center gap-2">
                📧 Purchased Drinks from Email
              </h4>
              {orderItems.length > 0 && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  {orderItems.length} item{orderItems.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {isLoadingOrder ? (
              <div className="text-sm text-blue-700">Loading your purchased drinks...</div>
            ) : orderItems.length === 0 ? (
              <div className="text-sm text-blue-700">
                All purchased drinks have been logged! ✅
              </div>
            ) : (
              <>
                <p className="text-sm text-blue-700">
                  Select the drinks you've consumed today:
                </p>
                <div className="space-y-2">
                  {orderItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleOrderItem(item.id)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        selectedOrderItems.has(item.id)
                          ? 'border-blue-500 bg-blue-100'
                          : 'border-blue-200 bg-white hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-blue-900">{item.product_name}</div>
                          <div className="text-xs text-blue-600">Qty: {item.quantity}</div>
                        </div>
                        {selectedOrderItems.has(item.id) && (
                          <div className="text-2xl">✅</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <Button
                  onClick={handleAddSelectedToIntake}
                  disabled={selectedOrderItems.size === 0 || isUpdatingConsumption}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdatingConsumption 
                    ? '⏳ Updating...' 
                    : `Add Selected to Today's Intake (${selectedOrderItems.size})`
                  }
                </Button>
              </>
            )}
          </div>
        )}
        
        {/* Current Intake Display */}
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Current Intake:</h4>
          <div className="text-sm text-green-700 space-y-1">
            <div>Water: {drinks.totalIntake.water}ml</div>
            <div>Sodium: {drinks.totalIntake.sodium}mg</div>
            <div>Potassium: {drinks.totalIntake.potassium}mg</div>
            <div>Caffeine: {drinks.totalIntake.caffeine}mg</div>
          </div>
        </div>

        {/* Remaining Deficits */}
        <div className="p-4 bg-orange-50 rounded-lg">
          <h4 className="font-medium text-orange-800 mb-2">Still Need:</h4>
          <div className="text-sm text-orange-700 space-y-1">
            <div>Water: {deficits.water || 0}ml</div>
            <div>Sodium: {deficits.sodium || 0}mg</div>
            <div>Potassium: {deficits.potassium || 0}mg</div>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div>
          <Label>Quick Add Water</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Button variant="outline" onClick={() => quickAddWater(250)}>
              250ml
            </Button>
            <Button variant="outline" onClick={() => quickAddWater(500)}>
              500ml
            </Button>
            <Button variant="outline" onClick={() => quickAddWater(1000)}>
              1L
            </Button>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="flex gap-2">
          <Input
            placeholder="Search drinks..."
            value={drinks.drinkSearch}
            onChange={(e) => drinks.setDrinkSearch(e.target.value)}
          />
          <Select 
            value={drinks.drinkSortBy} 
            onValueChange={(value) => drinks.setDrinkSortBy(value as any)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">A-Z</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Selected Drink Preview */}
        {selectedDrink && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="font-semibold text-blue-900">{selectedDrink.name}</div>
            <div className="text-sm text-blue-700 mt-1">
              {selectedDrink.h2o_ml}ml water
              {selectedDrink.na_mg > 0 && ` • ${selectedDrink.na_mg}mg sodium`}
              {selectedDrink.k_mg > 0 && ` • ${selectedDrink.k_mg}mg potassium`}
              {selectedDrink.caffeine_mg > 0 && ` • ${selectedDrink.caffeine_mg}mg caffeine`}
            </div>
            <Button 
              size="sm" 
              className="mt-2 w-full"
              onClick={() => {
                handleAddDrink(selectedDrink)
                setSelectedDrink(null)
              }}
            >
              Add to Today's Intake
            </Button>
          </div>
        )}

        {/* Drinks Grid */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Tap to preview drink details</p>
          <div className="h-48 overflow-y-auto border rounded-lg p-2">
            <div className="grid grid-cols-3 gap-2">
              {filteredDrinks.map((drink, idx) => (
                <Button
                  key={idx}
                  variant={selectedDrink?.id === drink.id ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-auto py-2 px-1"
                  onClick={() => setSelectedDrink(drink)}
                >
                  <div className="text-center w-full">
                    <div className="font-medium truncate">{drink.name}</div>
                    <div className="text-gray-500">
                      {drink.h2o_ml ? `${drink.h2o_ml}ml` : ""}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Added Drinks List */}
        {addedDrinks.length > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <Label className="text-green-800 font-medium">Today's Drinks:</Label>
            <div className="text-sm text-green-700 space-y-1 mt-2 max-h-24 overflow-y-auto">
              {addedDrinks.map((d, i) => (
                <div key={i} className="flex justify-between">
                  <span>{d.name}</span>
                  <span className="text-xs">{d.h2o_ml}ml</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reset Button */}
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => {
            drinks.resetIntake()
            setAddedDrinks([])
          }}
          className="w-full"
        >
          Reset All Drinks
        </Button>

        {/* Navigation Button */}
        {onNext && (
          <Button 
            onClick={onNext}
            variant="outline"
            className="w-full mt-6 bg-white/5 backdrop-blur border-teal-500/20 hover:bg-teal-500/10 hover:border-teal-500/40 transition-all"
          >
            Continue to Meals
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}