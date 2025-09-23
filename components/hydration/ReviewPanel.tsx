// components/hydration/ReviewPanel.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useHydrationContext } from '@/contexts'
import { Loader2, ShoppingCart, Droplet, Zap } from 'lucide-react'
import styles from './hydration-assessment.module.css'

export function ReviewPanel({ activeTab, setActiveTab, venueId }: { 
  activeTab?: string, 
  setActiveTab?: (tab: string) => void,
  venueId?: string 
}) {
  const { profile, totalIntake, deficits, vitaminStatus } = useHydrationContext()
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<any>(null)

  // AUTO-GENERATE when entering Review tab (Option B)
  useEffect(() => {
    if (activeTab === 'review' && !recommendations && !loading) {
      handleGenerateRecommendations()
    }
  }, [activeTab, recommendations, loading])

  // Calculate achievement percentages
  const achievements = {
    water: Math.round((totalIntake.water / profile.targets.water) * 100),
    sodium: Math.round((totalIntake.sodium / profile.targets.sodium) * 100),
    potassium: Math.round((totalIntake.potassium / profile.targets.potassium) * 100),
    protein: Math.round((totalIntake.protein / profile.targets.protein) * 100),
    fiber: Math.round((totalIntake.fiber / profile.targets.fiber) * 100)
  }

  const overallScore = Math.round(
    (achievements.water + achievements.sodium + achievements.potassium + 
     achievements.protein + achievements.fiber) / 5
  )

  const handleGenerateRecommendations = async () => {
    setLoading(true)
    try {
      // Split deficits 65/35 with null safety
      const drinkDeficits = {
        water: (deficits.water || 0) * 0.65,
        sodium: (deficits.sodium || 0) * 0.65,
        potassium: (deficits.potassium || 0) * 0.65,
        magnesium: (deficits.magnesium || 0) * 0.65,
        fiber: (deficits.fiber || 0) * 0.65,
      }
  
      const mealDeficits = {
        water: (deficits.water || 0) * 0.35,
        sodium: (deficits.sodium || 0) * 0.35,
        potassium: (deficits.potassium || 0) * 0.35,
        protein: (deficits.protein || 0) * 0.35,
        fiber: (deficits.fiber || 0) * 0.35,
      }

      // Call both endpoints in parallel
      const [drinksRes, mealsRes] = await Promise.all([
        fetch('/api/ai/generate-drinks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            deficits: drinkDeficits,
            vitaminStatus,
            venueId 
          })
        }),
        fetch('/api/ai/generate-meals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            deficits: mealDeficits 
          })
        })
      ])

      const drinks = await drinksRes.json()
      const meals = await mealsRes.json()

      setRecommendations({ drinks, meals })
      
      // AUTO-NAVIGATE to AI Plan tab (Option A)
      if (setActiveTab) {
        setTimeout(() => {
          setActiveTab('recommendations')
        }, 500) // Small delay to show loading state
      }
    } catch (error) {
      console.error('Failed to generate recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (item: any) => {
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          qty: item.quantity || 1,
          venue_id: venueId // Pass the venue along!
        })
      })
      
      if (response.ok) {
        console.log('Added to cart:', item.name)
        // TODO: Show success toast
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className={styles.panelCard}>
        <CardHeader>
          <CardTitle>Your Hydration Summary</CardTitle>
          <Badge className="w-fit">{overallScore}% Complete</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Overall Progress</div>
            <Progress value={overallScore} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Nutrient Targets:</div>
            {Object.entries(achievements).map(([nutrient, percent]) => (
              <div key={nutrient} className="flex items-center justify-between text-sm">
                <span className="capitalize">{nutrient}</span>
                <div className="flex items-center gap-2">
                  <Progress value={percent} className="w-24 h-2" />
                  <span className="text-xs w-10">{percent}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Still Need Section */}
{Object.values(deficits).some(d => (d || 0) > 0) && (
  <div className="pt-4 border-t">
    <div className="text-sm font-medium mb-2">Still Need:</div>
    <div className="space-y-1">
      {(deficits.water || 0) > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Droplet className="h-3 w-3" />
          <span>Water: {Math.round(deficits.water || 0)}ml</span>
        </div>
      )}
      {(deficits.sodium || 0) > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Zap className="h-3 w-3" />
          <span>Sodium: {Math.round(deficits.sodium || 0)}mg</span>
        </div>
      )}
      {(deficits.potassium || 0) > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Zap className="h-3 w-3" />
          <span>Potassium: {Math.round(deficits.potassium || 0)}mg</span>
        </div>
      )}
    </div>
  </div>
)}

          <Button 
            onClick={handleGenerateRecommendations}
            className={`w-full ${styles.primaryButton}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Recommendations...
              </>
            ) : (
              'GET AI RECOMMENDATIONS'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recommendations Display */}
      {recommendations && (
        <>
          {/* Drinks Recommendations */}
          {recommendations.drinks?.drinks?.length > 0 && (
            <Card className={styles.panelCard}>
              <CardHeader>
                <CardTitle>Recommended Drinks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.drinks.drinks.map((drink: any) => (
                  <div key={drink.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{drink.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Quantity: {drink.quantity}
                        </div>
                        <div className="text-xs mt-1">{drink.reason}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{drink.price_aed} AED</div>
                        <Button 
                          size="sm" 
                          onClick={() => handleAddToCart(drink)}
                          className={`mt-2 ${styles.primaryButton}`}
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t font-medium">
                  Total: {recommendations.drinks.total_cost} AED
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meals Recommendations */}
          {recommendations.meals?.meals?.length > 0 && (
            <Card className={styles.panelCard}>
              <CardHeader>
                <CardTitle>Recommended Meals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.meals.meals.map((meal: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <div className="font-medium">{meal.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {meal.foods.join(', ')}
                    </div>
                    <div className="text-xs mt-1">{meal.explanation}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}