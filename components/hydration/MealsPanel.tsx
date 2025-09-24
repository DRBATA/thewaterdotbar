'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Check, Plus, ChevronRight } from 'lucide-react'
import { useHydrationContext } from '@/contexts'

interface MealsPanelProps {
  onNext?: () => void
}

export function MealsPanel({ onNext }: MealsPanelProps) {
  const { meals } = useHydrationContext()
  const [tempAllergies, setTempAllergies] = useState<string>(meals.allergies || '')
  const [allergiesSet, setAllergiesSet] = useState<boolean>(!!meals.allergies)

  const handleClarificationSubmit = async (clarifiedMeal: string) => {
    if (meals.clarificationData) {
      await meals.processMealWithAI(clarifiedMeal, "breakfast")
      meals.setShowClarification(false)
      meals.setClarificationData(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>What have you eaten today?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Allergies Input */}
<div className="p-3 bg-red-50 rounded-lg border border-red-200">
  <Label className="text-red-800 font-medium">Allergies & Dietary Restrictions</Label>
  <div className="flex gap-2 mt-2">
    <Input
      placeholder="e.g., nuts, dairy, gluten, shellfish"
      value={tempAllergies}
      onChange={(e) => {
        setTempAllergies(e.target.value)
        setAllergiesSet(false)  // Reset the "set" state when typing
      }}
    />
    <Button
      size="sm"
      variant={allergiesSet ? "default" : "outline"}
      onClick={() => {
        meals.setAllergies(tempAllergies)
        setAllergiesSet(true)
      }}
      className="px-3"
    >
      {allergiesSet ? (
        <Check className="h-4 w-4" />
      ) : (
        <span>Add</span>
      )}
    </Button>
  </div>
  <p className="text-xs text-red-600 mt-1">
    This will filter meal recommendations to avoid these ingredients
  </p>
</div>

          {/* Breakfast */}
          <div>
            <Label>Breakfast</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., eggs, toast, orange juice"
                value={meals.breakfast}
                onChange={(e) => meals.setBreakfast(e.target.value)}
              />
              <Button 
                size="sm" 
                onClick={() => meals.processMealWithAI(meals.breakfast, "breakfast")}
                disabled={!meals.breakfast.trim() || meals.processingStates.breakfast}
              >
                {meals.processingStates.breakfast ? "Processing..." : "Add"}
              </Button>
            </div>
            {meals.mealNutrition.breakfast && (
              <div className="p-2 bg-blue-50 rounded-md mt-2 text-xs">
                <div className="font-medium text-blue-800 mb-1">From breakfast:</div>
                <div className="text-blue-700 space-y-0.5">
                  <div>Water: {meals.mealNutrition.breakfast.water}ml</div>
                  <div>Sodium: {meals.mealNutrition.breakfast.sodium}mg</div>
                  <div>Potassium: {meals.mealNutrition.breakfast.potassium}mg</div>
                  <div>Fiber: {meals.mealNutrition.breakfast.fiber}g</div>
                  <div>Protein: {meals.mealNutrition.breakfast.protein}g</div>
                </div>
              </div>
            )}
          </div>
          {/* Lunch */}
          <div>
            <Label>Lunch</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., chicken salad, rice"
                value={meals.lunch}
                onChange={(e) => meals.setLunch(e.target.value)}
              />
              <Button 
                size="sm" 
                onClick={() => meals.processMealWithAI(meals.lunch, "lunch")}
                disabled={!meals.lunch.trim() || meals.processingStates.lunch}
              >
                {meals.processingStates.lunch ? "Processing..." : "Add"}
              </Button>
            </div>
            {meals.mealNutrition.lunch && (
              <div className="p-2 bg-green-50 rounded-md mt-2 text-xs">
                <div className="font-medium text-green-800 mb-1">From lunch:</div>
                <div className="text-green-700 space-y-0.5">
                  <div>Water: {meals.mealNutrition.lunch.water}ml</div>
                  <div>Sodium: {meals.mealNutrition.lunch.sodium}mg</div>
                  <div>Potassium: {meals.mealNutrition.lunch.potassium}mg</div>
                  <div>Fiber: {meals.mealNutrition.lunch.fiber}g</div>
                  <div>Protein: {meals.mealNutrition.lunch.protein}g</div>
                </div>
              </div>
            )}
          </div>

          {/* Dinner */}
          <div>
            <Label>Dinner</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., salmon, vegetables"
                value={meals.dinner}
                onChange={(e) => meals.setDinner(e.target.value)}
              />
              <Button 
                size="sm" 
                onClick={() => meals.processMealWithAI(meals.dinner, "dinner")}
                disabled={!meals.dinner.trim() || meals.processingStates.dinner}
              >
                {meals.processingStates.dinner ? "Processing..." : "Add"}
              </Button>
            </div>
            {meals.mealNutrition.dinner && (
              <div className="p-2 bg-purple-50 rounded-md mt-2 text-xs">
                <div className="font-medium text-purple-800 mb-1">From dinner:</div>
                <div className="text-purple-700 space-y-0.5">
                  <div>Water: {meals.mealNutrition.dinner.water}ml</div>
                  <div>Sodium: {meals.mealNutrition.dinner.sodium}mg</div>
                  <div>Potassium: {meals.mealNutrition.dinner.potassium}mg</div>
                  <div>Fiber: {meals.mealNutrition.dinner.fiber}g</div>
                  <div>Protein: {meals.mealNutrition.dinner.protein}g</div>
                </div>
              </div>
            )}
          </div>

          {/* Snacks */}
          <div>
            <Label>Snacks</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., almonds, apple"
                value={meals.snacks}
                onChange={(e) => meals.setSnacks(e.target.value)}
              />
              <Button 
                size="sm" 
                onClick={() => meals.processMealWithAI(meals.snacks, "snacks")}
                disabled={!meals.snacks.trim() || meals.processingStates.snacks}
              >
                {meals.processingStates.snacks ? "Processing..." : "Add"}
              </Button>
            </div>
            {meals.mealNutrition.snacks && (
              <div className="p-2 bg-yellow-50 rounded-md mt-2 text-xs">
                <div className="font-medium text-yellow-800 mb-1">From snacks:</div>
                <div className="text-yellow-700 space-y-0.5">
                  <div>Water: {meals.mealNutrition.snacks.water}ml</div>
                  <div>Sodium: {meals.mealNutrition.snacks.sodium}mg</div>
                  <div>Potassium: {meals.mealNutrition.snacks.potassium}mg</div>
                  <div>Fiber: {meals.mealNutrition.snacks.fiber}g</div>
                  <div>Protein: {meals.mealNutrition.snacks.protein}g</div>
                </div>
              </div>
            )}
          </div>
          {/* Total Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Total from Food:</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <div>Water: {meals.totalMealIntake.water}ml</div>
              <div>Sodium: {meals.totalMealIntake.sodium}mg</div>
              <div>Potassium: {meals.totalMealIntake.potassium}mg</div>
              <div>Fiber: {meals.totalMealIntake.fiber}g</div>
              <div>Protein: {meals.totalMealIntake.protein}g</div>
            </div>
          </div>

          {/* Navigation Button */}
          {onNext && (
            <Button 
              onClick={onNext}
              variant="outline"
              className="w-full mt-6 bg-white/5 backdrop-blur border-teal-500/20 hover:bg-teal-500/10 hover:border-teal-500/40 transition-all"
            >
              Continue to Review
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* AI Clarification Modal */}
      <Dialog open={meals.showClarification} onOpenChange={meals.setShowClarification}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Need more details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>{meals.clarificationData?.question}</p>
            <Button onClick={() => meals.setShowClarification(false)}>
              Skip for now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}