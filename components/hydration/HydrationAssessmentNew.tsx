// components/hydration/HydrationAssessmentNew.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfilePanel } from './ProfilePanel'
import { DrinksPanel } from './DrinksPanel'
import { MealsPanel } from './MealsPanel'  
import { ReviewPanel } from './ReviewPanel'
import { RecommendationEngine } from './RecommendationEngine'
import { HydrationProvider } from '@/contexts/HydrationContext'
import styles from './hydration-assessment.module.css'

interface HydrationAssessmentModalProps {
  isOpen: boolean
  onCloseAction: () => void
}

export function HydrationAssessmentModal({ 
  isOpen, 
  onCloseAction 
}: HydrationAssessmentModalProps) {
  const [activeTab, setActiveTab] = useState('profile')
  const [selectedVenue, setSelectedVenue] = useState<string>('')

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className={`w-[95vw] max-w-4xl h-[85vh] md:h-[90vh] overflow-y-auto overflow-x-hidden ${styles.assessmentModal}`}>
        <DialogHeader>
          <DialogTitle>AI Hydration Assessment</DialogTitle>
        </DialogHeader>
        
        <HydrationProvider>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full grid-cols-5 ${styles.tabsList}`}>
            <TabsTrigger value="profile" className={styles.tabTrigger}>Profile</TabsTrigger>
<TabsTrigger value="drinks" className={styles.tabTrigger}>Drinks</TabsTrigger>
<TabsTrigger value="meals" className={styles.tabTrigger}>Meals</TabsTrigger>
<TabsTrigger value="review" className={styles.tabTrigger}>Review</TabsTrigger>
<TabsTrigger value="recommendations" className={styles.tabTrigger}>AI Plan</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <ProfilePanel venueId={selectedVenue} onVenueChange={setSelectedVenue} />
            </TabsContent>
            
            <TabsContent value="drinks">
              <DrinksPanel />
            </TabsContent>
            
            <TabsContent value="meals">
              <MealsPanel />
            </TabsContent>
            
            <TabsContent value="review">
              <ReviewPanel 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                venueId={selectedVenue}
              />
            </TabsContent>
            
            <TabsContent value="recommendations">
              <RecommendationEngine />
            </TabsContent>
          </Tabs>
        </HydrationProvider>
      </DialogContent>
    </Dialog>
  )
}