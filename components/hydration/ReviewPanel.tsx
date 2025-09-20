'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useHydrationContext } from '@/contexts'

export function ReviewPanel() {
  const { profile, totalIntake, deficits, vitaminStatus } = useHydrationContext()

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

  const handleAddToCart = async () => {
    // This will integrate with your cart system
    console.log('Adding hydration plan to cart:', {
      profile: profile.bodyComposition,
      targets: profile.targets,
      totalIntake,
      deficits,
      vitaminStatus
    })
    
    // TODO: Call your cart API
    // await fetch('/api/cart/add-hydration-plan', { ... })
  }

  const handleGenerateRecommendations = async () => {
    // This will call your AI recommendation endpoints
    console.log('Generating AI recommendations based on deficits:', deficits)
    
    // TODO: Call your AI endpoints
    // await fetch('/api/ai/recommend-drinks', { body: JSON.stringify(deficits) })
    // await fetch('/api/ai/recommend-meals', { body: JSON.stringify(deficits) })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Your Hydration Summary
          <Badge variant={overallScore >= 80 ? "default" : overallScore >= 60 ? "secondary" : "destructive"}>
            {overallScore}% Complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Overall Progress</span>
            <span>{overallScore}%</span>
          </div>
          <Progress value={overallScore} className="h-3" />
        </div>

        {/* Individual Nutrient Progress */}
        <div className="space-y-3">
          <h4 className="font-medium">Nutrient Targets:</h4>
          
          {/* Water */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Water</span>
              <span>{totalIntake.water}ml / {profile.targets.water}ml</span>
            </div>
            <Progress value={Math.min(achievements.water, 100)} className="h-2" />
          </div>

          {/* Sodium */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Sodium</span>
              <span>{totalIntake.sodium}mg / {profile.targets.sodium}mg</span>
            </div>
            <Progress value={Math.min(achievements.sodium, 100)} className="h-2" />
          </div>

          {/* Potassium */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Potassium</span>
              <span>{totalIntake.potassium}mg / {profile.targets.potassium}mg</span>
            </div>
            <Progress value={Math.min(achievements.potassium, 100)} className="h-2" />
          </div>

          {/* Protein */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Protein</span>
              <span>{totalIntake.protein}g / {profile.targets.protein}g</span>
            </div>
            <Progress value={Math.min(achievements.protein, 100)} className="h-2" />
          </div>

          {/* Fiber */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Fiber</span>
              <span>{totalIntake.fiber}g / {profile.targets.fiber}g</span>
            </div>
            <Progress value={Math.min(achievements.fiber, 100)} className="h-2" />
          </div>
        </div>

        {/* Remaining Deficits */}
        {(deficits.water || 0) + (deficits.sodium || 0) + (deficits.potassium || 0) > 0 && (
          <div className="p-4 bg-orange-50 rounded-lg">
            <h4 className="font-medium text-orange-800 mb-2">Still Need:</h4>
            <div className="text-sm text-orange-700 space-y-1">
              {deficits.water && deficits.water > 0 && (
                <div>💧 Water: {deficits.water}ml</div>
              )}
              {deficits.sodium && deficits.sodium > 0 && (
                <div>🧂 Sodium: {deficits.sodium}mg</div>
              )}
              {deficits.potassium && deficits.potassium > 0 && (
                <div>🍌 Potassium: {deficits.potassium}mg</div>
              )}
              {deficits.protein && deficits.protein > 0 && (
                <div>🥩 Protein: {deficits.protein}g</div>
              )}
              {deficits.fiber && deficits.fiber > 0 && (
                <div>🥬 Fiber: {deficits.fiber}g</div>
              )}
            </div>
          </div>
        )}

        {/* Vitamin Status */}
        {vitaminStatus.needsGreens || vitaminStatus.needsPoppi && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Recommendations:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              {vitaminStatus.needsGreens && (
                <div>🌿 Consider Rite Greens for vitamin deficiencies</div>
              )}
              {vitaminStatus.needsPoppi && (
                <div>🦠 Consider Poppi for gut health (low fiber)</div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Button 
            onClick={handleGenerateRecommendations}
            className="w-full"
            size="lg"
          >
            🤖 Get AI Recommendations
          </Button>
          
          <Button 
            onClick={handleAddToCart}
            variant="outline"
            className="w-full"
            size="lg"
          >
            🛒 Add Plan to Cart
          </Button>
        </div>

        {/* Body Composition Summary */}
        <div className="p-4 bg-gray-50 rounded-lg text-sm">
          <h4 className="font-medium text-gray-800 mb-2">Your Profile:</h4>
          <div className="text-gray-600 space-y-1">
            <div>Weight: {profile.bodyComposition.weight}kg</div>
            <div>Body Fat: {profile.bodyComposition.bodyFat}%</div>
            <div>Lean Body Mass: {profile.bodyComposition.leanBodyMass.toFixed(1)}kg</div>
            <div>Activity: {profile.activityLevel}</div>
            <div>Sweat Loss: {profile.sweatLoss.toFixed(1)}L</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}