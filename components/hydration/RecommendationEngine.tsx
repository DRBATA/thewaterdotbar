'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useHydrationContext } from '@/contexts'
import { splitDeficitsForRecommendations, buildDrinkQueryInstructions, buildMealQueryInstructions } from '@/utils/recommendationSplitter'
import { buildMealRecommendationRequest, buildDrinkRecommendationRequest } from '@/utils/mealRecommendationBuilder'

export function RecommendationEngine() {
  const { totalIntake, deficits, meals: mealsData } = useHydrationContext()
  const [recommendations, setRecommendations] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const generateRecommendations = async () => {
    setIsGenerating(true)
    
    try {
      // 1. Split deficits 50/50
      const previousMeals = [
        mealsData.breakfast, mealsData.lunch, mealsData.dinner, mealsData.snacks
      ].filter(Boolean)
      
      const { drinksTarget, mealsTarget } = splitDeficitsForRecommendations(
        deficits, 
        totalIntake, 
        previousMeals
      )
      
      // 2. Generate variety rules
      const drinkInstructions = buildDrinkQueryInstructions(drinksTarget, 'venue_id_here')
      
      // 3. Build AI requests
      const drinkRequest = {
        ...drinkInstructions,
        ...buildDrinkRecommendationRequest(drinksTarget, [], {})
      }
      const mealRequest = {
        ...buildMealQueryInstructions(mealsTarget),
        ...buildMealRecommendationRequest(mealsTarget, previousMeals)
      }
      
      // 4. Call AI endpoints in parallel
      const [drinkResponse, mealResponse] = await Promise.all([
        fetch('/api/ai/recommend-drinks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(drinkRequest)
        }),
        fetch('/api/ai/recommend-meals', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mealRequest)
        })
      ])
      
      const drinks = await drinkResponse.json()
      const mealsRecommendations = await mealResponse.json()
      
      setRecommendations({ drinks, meals: mealsRecommendations })
      
    } catch (error) {
      console.error('Error generating recommendations:', error)
    } finally {
      setIsGenerating(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={generateRecommendations}
          disabled={isGenerating}
          className="w-full mb-4"
        >
          {isGenerating ? 'Generating...' : '🤖 Get Smart Recommendations'}
        </Button>
        
        {recommendations && (
          <div className="space-y-4">
            {/* Drink Recommendations */}
            <div>
              <h4 className="font-medium mb-2">Recommended Drinks:</h4>
              {recommendations.drinks?.map((drink: any, idx: number) => (
                <div key={idx} className="p-2 border rounded">
                  <div className="font-medium">{drink.name}</div>
                  <div className="text-sm text-gray-600">{drink.reason}</div>
                </div>
              ))}
            </div>
            
            {/* Meal Recommendations */}
            <div>
              <h4 className="font-medium mb-2">Recommended Foods:</h4>
              {recommendations.meals?.map((meal: any, idx: number) => (
                <div key={idx} className="p-2 border rounded">
                  <div className="font-medium">{meal.name}</div>
                  <div className="text-sm text-gray-600">{meal.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}