'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, CheckCircle2, Droplet, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { drinkLogHelpers } from '@/lib/dexie-db'
import { NutritionalIntake } from '@/types'

interface Drink {
  id: string
  name: string
  quantity: number
  reason?: string
  nutrients_provided?: {
    water?: number
    sodium?: number
    potassium?: number
    magnesium?: number
    fiber?: number
    protein?: number
    b12?: number
  }
  image_url?: string
}

export default function TrackerUpdatePage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [selectedDrinks, setSelectedDrinks] = useState<Set<string>>(new Set())
  const [updating, setUpdating] = useState(false)
  const [success, setSuccess] = useState(false)
  
  useEffect(() => {
    if (!orderId) {
      toast({
        title: 'Error',
        description: 'No order ID provided',
        variant: 'destructive'
      })
      setLoading(false)
      return
    }
    
    // Fetch order drinks from cart_items with AI recommendations
    fetch(`/api/orders/get-drinks?order_id=${orderId}`)
      .then(res => res.json())
      .then(data => {
        if (data.drinks) {
          setDrinks(data.drinks)
          // Pre-select all drinks
          const allDrinkIds = new Set<string>(data.drinks.map((d: Drink) => d.id))
          setSelectedDrinks(allDrinkIds)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load drinks:', err)
        toast({
          title: 'Error',
          description: 'Failed to load your order',
          variant: 'destructive'
        })
        setLoading(false)
      })
  }, [orderId])
  
  const toggleDrink = (drinkId: string) => {
    setSelectedDrinks(prev => {
      const next = new Set(prev)
      if (next.has(drinkId)) {
        next.delete(drinkId)
      } else {
        next.add(drinkId)
      }
      return next
    })
  }
  
  const updateTimeline = async () => {
    setUpdating(true)
    
    try {
      // Prepare drinks for logging
      const drinksToLog = drinks
        .filter(drink => selectedDrinks.has(drink.id))
        .map(drink => {
          // Map to NutritionalIntake format
          const nutrients: NutritionalIntake = {
            water: drink.nutrients_provided?.water || 0,
            sodium: drink.nutrients_provided?.sodium || 0,
            potassium: drink.nutrients_provided?.potassium || 0,
            magnesium: drink.nutrients_provided?.magnesium || 0,
            protein: drink.nutrients_provided?.protein || 0,
            fiber: drink.nutrients_provided?.fiber || 0,
            b12: drink.nutrients_provided?.b12 || 0,
            // Fill remaining required fields with 0
            soluble_fiber: 0,
            insoluble_fiber: 0,
            calcium: 0,
            iron: 0,
            zinc: 0,
            copper: 0,
            choline: 0,
            b6: 0,
            b9: 0,
            vitamin_c: 0,
            vitamin_d: 0,
            caffeine: 0,
            probiotics: 0,
            omega3: 0,
            polyphenols: 0
          }
          
          return {
            product_id: drink.id,
            name: drink.name,
            quantity: drink.quantity,
            nutrients
          }
        })
      
      // Log drinks using Dexie helper
      await drinkLogHelpers.logDrinks(drinksToLog, 'purchase')
      
      setSuccess(true)
      toast({
        title: 'Success!',
        description: `Updated your timeline with ${selectedDrinks.size} drinks`,
      })
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        window.close()
      }, 3000)
      
    } catch (error) {
      console.error('Failed to update timeline:', error)
      toast({
        title: 'Error',
        description: 'Failed to update your timeline',
        variant: 'destructive'
      })
    } finally {
      setUpdating(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your drinks...</p>
        </div>
      </div>
    )
  }
  
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Timeline Updated!</h2>
            <p className="text-gray-600 mb-4">
              Your hydration tracker has been updated with {selectedDrinks.size} drinks
            </p>
            <p className="text-sm text-gray-500">
              This window will close automatically...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <Droplet className="h-12 w-12 text-blue-500 mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Update Your Hydration Tracker
          </h1>
          <p className="text-gray-600">
            Select the drinks you've consumed to update your timeline
          </p>
        </div>
        
        {drinks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <Info className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No drinks found in this order</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Your Drinks ({drinks.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {drinks.map(drink => (
                  <div
                    key={drink.id}
                    className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => toggleDrink(drink.id)}
                  >
                    <Checkbox
                      checked={selectedDrinks.has(drink.id)}
                      onCheckedChange={() => toggleDrink(drink.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {drink.name} x{drink.quantity}
                        </h3>
                      </div>
                      
                      {drink.reason && (
                        <p className="text-sm text-blue-600 mb-2">
                          {drink.reason}
                        </p>
                      )}
                      
                      {drink.nutrients_provided && (
                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                          {drink.nutrients_provided.water && (
                            <span className="bg-blue-100 px-2 py-1 rounded">
                              💧 {drink.nutrients_provided.water}ml
                            </span>
                          )}
                          {drink.nutrients_provided.sodium && (
                            <span className="bg-orange-100 px-2 py-1 rounded">
                              🧂 {drink.nutrients_provided.sodium}mg Na
                            </span>
                          )}
                          {drink.nutrients_provided.potassium && (
                            <span className="bg-yellow-100 px-2 py-1 rounded">
                              🍌 {drink.nutrients_provided.potassium}mg K
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <div className="bg-white rounded-lg p-4 border border-blue-200 mb-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">Selected: {selectedDrinks.size} of {drinks.length} drinks</p>
                  <p className="text-gray-600">
                    Uncheck any drinks you haven't consumed yet. They won't be added to your timeline.
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={updateTimeline}
              disabled={updating || selectedDrinks.size === 0}
              className="w-full h-12 text-lg"
            >
              {updating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Updating Timeline...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Update My Timeline ({selectedDrinks.size})
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
