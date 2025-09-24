// components/hydration/ReviewPanel.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useHydrationContext } from '@/contexts'
import { Droplet, Zap } from 'lucide-react'
import styles from './hydration-assessment.module.css'

export function ReviewPanel({ activeTab, setActiveTab, venueId }: { 
  activeTab?: string, 
  setActiveTab?: (tab: string) => void,
  venueId?: string 
}) {
  const { profile, totalIntake, deficits } = useHydrationContext()

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

  const handleViewRecommendations = () => {
    // Simply navigate to the AI Plan tab where RecommendationEngine will auto-generate
    if (setActiveTab) {
      setActiveTab('recommendations')
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
            onClick={handleViewRecommendations}
            className={`w-full ${styles.primaryButton}`}
          >
            VIEW AI RECOMMENDATIONS
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}