'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Download } from 'lucide-react'

interface StoredAssessment {
  profile: any
  dailyTargets: any
  totalIntake: any
  activityLevel: string
  deficits: {
    protein: number
    sodium: number
    potassium: number
    fiber: number
  }
  timestamp: number
}

export default function AssessmentSuccessDisplay() {
  const [assessment, setAssessment] = useState<StoredAssessment | null>(null)
  const [isEmailSending, setIsEmailSending] = useState(false)

  useEffect(() => {
    // BASIC VERSION: Retrieve stored assessment data
    const stored = sessionStorage.getItem('hydrationAssessment')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setAssessment(data)
        console.log('📋 Retrieved assessment data:', data)
      } catch (error) {
        console.error('Error parsing stored assessment:', error)
      }
    }
  }, [])

  const emailMyPlan = async () => {
    if (!assessment) return
    
    setIsEmailSending(true)
    try {
      // TODO: Enhance this to include AI recommendations + meal images
      // For now, just email the basic deficit summary
      
      const planData = {
        assessment,
        // TODO: Add purchased drinks from cart/order
        // TODO: Add AI-generated meal recommendations
        // TODO: Add meal images
        basicPlan: `
          Your Hydration Assessment Results:
          
          Body Profile: ${assessment.profile.weight}kg, ${assessment.profile.bodyFat}% body fat
          Activity Level: ${assessment.activityLevel}
          
          Remaining Daily Needs:
          • Protein: ${assessment.deficits.protein}g
          • Sodium: ${assessment.deficits.sodium}mg  
          • Potassium: ${assessment.deficits.potassium}mg
          • Fiber: ${assessment.deficits.fiber}g
          
          Next Steps: Pick up your drinks and follow meal suggestions (coming soon with AI enhancement)
        `
      }
      
      // TODO: Call enhanced receipt API with plan data
      console.log('📧 Would email plan:', planData)
      
      // Simulate email send for now
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert('Plan emailed! (Basic version - AI recommendations coming soon)')
      
    } catch (error) {
      console.error('Error emailing plan:', error)
      alert('Error sending email')
    } finally {
      setIsEmailSending(false)
    }
  }

  if (!assessment) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No assessment data found.</p>
          <p className="text-sm mt-2">Complete a hydration assessment to see your personalized plan here.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎯 Your Hydration Assessment Complete
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Basic version - AI meal recommendations with threshold matrix coming soon
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Basic Profile Summary */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">Weight</p>
            <p className="text-lg">{assessment.profile.weight}kg</p>
          </div>
          <div>
            <p className="text-sm font-medium">Body Fat</p>
            <p className="text-lg">{assessment.profile.bodyFat}%</p>
          </div>
          <div>
            <p className="text-sm font-medium">Lean Body Mass</p>
            <p className="text-lg">{assessment.profile.leanBodyMass.toFixed(1)}kg</p>
          </div>
          <div>
            <p className="text-sm font-medium">Activity Level</p>
            <p className="text-lg capitalize">{assessment.activityLevel}</p>
          </div>
        </div>

        {/* Remaining Deficits */}
        <div className="p-3 bg-orange-50 rounded-lg">
          <p className="font-medium mb-2">Remaining Daily Needs:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Protein:</span>
              <span className="font-medium">{assessment.deficits.protein.toFixed(0)}g</span>
            </div>
            <div className="flex justify-between">
              <span>Fiber:</span>
              <span className="font-medium">{assessment.deficits.fiber.toFixed(0)}g</span>
            </div>
            <div className="flex justify-between">
              <span>Sodium:</span>
              <span className="font-medium">{assessment.deficits.sodium.toFixed(0)}mg</span>
            </div>
            <div className="flex justify-between">
              <span>Potassium:</span>
              <span className="font-medium">{assessment.deficits.potassium.toFixed(0)}mg</span>
            </div>
          </div>
        </div>

        {/* TODO: AI Recommendations Section */}
        <div className="p-3 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
          <p className="font-medium text-blue-800 mb-1">🚧 Coming Soon: AI Recommendations</p>
          <p className="text-sm text-blue-700">
            • Personalized drink selections based on your deficits<br/>
            • Meal suggestions with images<br/>
            • Threshold-based recommendations (B12 &lt;50% → kefir, etc.)<br/>
            • Pattern-based swaps (coffee-heavy → yerba mate)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={emailMyPlan}
            disabled={isEmailSending}
            className="flex-1"
          >
            <Mail className="mr-2 h-4 w-4" />
            {isEmailSending ? 'Sending...' : 'Email My Plan'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {
              // TODO: Generate downloadable PDF/HTML version
              console.log('📄 Would generate downloadable plan')
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Assessment completed at {new Date(assessment.timestamp).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  )
}
