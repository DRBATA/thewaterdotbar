'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { db } from '@/lib/dexie-db'

export default function TrackerSetupPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [assessmentData, setAssessmentData] = useState<any>(null)
  const { toast } = useToast()

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

    // Fetch assessment data from server
    fetch(`/api/orders/get-assessment?order_id=${orderId}`)
      .then(res => res.json())
      .then(data => {
        if (data.assessmentData) {
          setAssessmentData(data.assessmentData)
        } else {
          toast({
            title: 'No Assessment Found',
            description: 'This order does not have an associated hydration assessment',
            variant: 'destructive'
          })
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load assessment:', err)
        toast({
          title: 'Error',
          description: 'Failed to load assessment data',
          variant: 'destructive'
        })
        setLoading(false)
      })
  }, [orderId])

  const downloadAssessment = async () => {
    if (!assessmentData) return
    
    setDownloading(true)
    
    try {
      // Map assessment data to Dexie schema
      // First, ensure user profile exists
      let profileId = 1; // Default profile
      const existingProfile = await db.user_profile.toArray();
      if (existingProfile.length > 0) {
        profileId = existingProfile[0].id!;
      } else {
        // Create profile from assessment data
        profileId = await db.user_profile.add({
          weight: assessmentData.profile?.weight || 70,
          bodyFat: assessmentData.profile?.bodyFat || 20,
          sex: assessmentData.profile?.sex || 'male',
          allergies: assessmentData.profile?.allergies || '',
          updatedAt: new Date()
        });
      }
      
      // Save assessment with proper schema
      await db.hydration_assessments.add({
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        profile_id: profileId,
        activityLevel: assessmentData.todayActivity?.activityLevel || 'moderate',
        sweatContext: assessmentData.todayActivity?.sweatContext || 'moderate',
        sessionHours: assessmentData.todayActivity?.sessionHours || 1,
        targets: assessmentData.targets || {
          water: 3000,
          sodium: 2000,
          potassium: 3500,
          protein: 100,
          fiber: 30
        },
        meals: {
          breakfast: assessmentData.mealsConsumed?.breakfast || '',
          lunch: assessmentData.mealsConsumed?.lunch || '',
          dinner: assessmentData.mealsConsumed?.dinner || '',
          snacks: assessmentData.mealsConsumed?.snacks || '',
          parsed: assessmentData.mealsConsumed?.parsed || {
            water: 0, sodium: 0, potassium: 0, magnesium: 0, calcium: 0,
            iron: 0, zinc: 0, copper: 0, choline: 0, protein: 0,
            fiber: 0, soluble_fiber: 0, insoluble_fiber: 0,
            b6: 0, b9: 0, b12: 0, vitamin_c: 0, vitamin_d: 0,
            caffeine: 0, probiotics: 0, omega3: 0, polyphenols: 0
          }
        }
      })
      
      setSuccess(true)
      toast({
        title: 'Success!',
        description: 'Your hydration assessment has been saved to your device',
      })
      
      // Redirect to tracker after 2 seconds
      setTimeout(() => {
        window.location.href = '/tracker'
      }, 2000)
      
    } catch (error) {
      console.error('Failed to save assessment:', error)
      toast({
        title: 'Error',
        description: 'Failed to save assessment to your device',
        variant: 'destructive'
      })
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p className="text-gray-600">Loading your assessment...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-900">All Set!</h2>
              <p className="text-gray-600 text-center">
                Your assessment is now available on this device
              </p>
              <p className="text-sm text-gray-500 text-center">
                Redirecting to your tracker...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!assessmentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-center">No Assessment Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center mb-4">
              This order does not have an associated hydration assessment.
            </p>
            <Button 
              className="w-full"
              onClick={() => window.location.href = '/tracker'}
            >
              Go to Tracker
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Download className="h-6 w-6 text-teal-600" />
            Download Your Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <h3 className="font-semibold text-teal-900 mb-2">What You'll Get:</h3>
            <ul className="space-y-2 text-sm text-teal-800">
              <li>✓ Your personal profile (weight, body composition)</li>
              <li>✓ Today's activity level and context</li>
              <li>✓ Meals consumed analysis</li>
              <li>✓ Daily hydration & nutrition targets</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> This assessment is accurate as of the time it was created. 
              If you've consumed more fluids or food since then, you can update your tracker accordingly.
            </p>
          </div>

          <Button 
            size="lg"
            className="w-full bg-teal-600 hover:bg-teal-700"
            onClick={downloadAssessment}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Save to My Device
              </>
            )}
          </Button>

          <Button 
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = '/tracker'}
          >
            Skip for Now
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
