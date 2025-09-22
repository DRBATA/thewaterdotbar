'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useHydrationContext } from '@/contexts'

export function DrinksPanel() {
  const { drinks, deficits } = useHydrationContext()
  const { toast } = useToast()

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

        {/* Drinks Grid */}
        <div className="h-48 overflow-y-auto border rounded-lg p-2">
          <div className="grid grid-cols-3 gap-2">
            {filteredDrinks.map((drink, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs h-auto py-2 px-1"
                onClick={() => handleAddDrink(drink)}
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

        {/* Reset Button */}
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={drinks.resetIntake}
          className="w-full"
        >
          Reset All Drinks
        </Button>
      </CardContent>
    </Card>
  )
}