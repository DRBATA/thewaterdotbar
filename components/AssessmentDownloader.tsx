'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

/**
 * F45/Partner Venue Scenario Handler
 * 
 * When user does assessment on partner device (F45 iPad) and pays via QR on their phone,
 * they receive email with "Download My Assessment" button.
 * 
 * This component:
 * 1. Checks for ?track_order=xxx&download=true in URL
 * 2. Fetches assessment INPUT data from order
 * 3. Saves to user's device (Dexie + sessionStorage)
 * 4. Redirects to hydration assessment with pre-filled data
 */
export default function AssessmentDownloader() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const trackOrder = searchParams.get('track_order')
    const shouldDownload = searchParams.get('download') === 'true'

    if (!trackOrder || !shouldDownload) return

    const downloadAssessment = async () => {
      try {
        setStatus('downloading')
        setMessage('📥 Downloading your hydration assessment...')

        // Fetch order data with assessment
        const response = await fetch(`/api/orders/${trackOrder}`)
        if (!response.ok) throw new Error('Order not found')

        const order = await response.json()
        const assessmentData = order.assessment_data

        if (!assessmentData?.input) {
          throw new Error('No assessment data found in order')
        }

        const inputContext = assessmentData.input

        console.log('📥 Received assessment INPUT:', inputContext)

        // Save to sessionStorage for immediate access
        if (inputContext.profile) {
          sessionStorage.setItem('hydrationInputContext', JSON.stringify(inputContext))
          console.log('✅ Saved INPUT to sessionStorage')
        }

        if (inputContext.meals) {
          sessionStorage.setItem('hydrationMeals', JSON.stringify(inputContext.meals))
          console.log('✅ Saved meals to sessionStorage')
        }

        // Save to Dexie for 24h persistence
        const { db, profileHelpers, assessmentHelpers } = await import('@/lib/dexie-db')

        // Save profile data (permanent)
        if (inputContext.profile) {
          await profileHelpers.saveProfile({
            weight: inputContext.profile.weight,
            bodyFat: inputContext.profile.bodyFat,
            sex: inputContext.profile.sex,
            allergies: inputContext.meals?.allergies || ''
          })
          console.log('✅ Saved profile to Dexie')
        }

        // Create/update assessment (24h persistence)
        if (inputContext.profile && inputContext.targets) {
          const assessmentId = await assessmentHelpers.saveAssessment({
            profile: {
              weight: inputContext.profile.weight,
              bodyFat: inputContext.profile.bodyFat,
              sex: inputContext.profile.sex,
              allergies: inputContext.meals?.allergies || ''
            },
            activityLevel: inputContext.activityLevel || 'desk',
            sweatContext: inputContext.sweatContext || 'none',
            sessionHours: inputContext.sessionHours || 0,
            targets: inputContext.targets,
            meals: {
              breakfast: inputContext.meals?.breakfast || '',
              lunch: inputContext.meals?.lunch || '',
              dinner: inputContext.meals?.dinner || '',
              snacks: inputContext.meals?.snacks || '',
              parsed: inputContext.meals?.parsed || {}
            }
          })
          console.log('✅ Saved assessment to Dexie:', assessmentId)
        }

        setStatus('success')
        setMessage('✅ Assessment downloaded! Redirecting to your dashboard...')

        // Redirect to hydration assessment page
        setTimeout(() => {
          router.push('/#hydration-assessment')
        }, 2000)

      } catch (error) {
        console.error('❌ Download error:', error)
        setStatus('error')
        setMessage(`❌ Failed to download assessment: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    downloadAssessment()
  }, [searchParams, router])

  // Don't render anything if not in download mode
  if (status === 'idle') return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
        {status === 'downloading' && (
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        )}
        {status === 'success' && (
          <div className="text-6xl mb-4">✅</div>
        )}
        {status === 'error' && (
          <div className="text-6xl mb-4">❌</div>
        )}
        <p className="text-lg font-medium text-gray-900">{message}</p>
        {status === 'error' && (
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        )}
      </div>
    </div>
  )
}
