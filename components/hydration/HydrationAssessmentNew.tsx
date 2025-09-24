// components/hydration/HydrationAssessmentNew.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Settings, RefreshCw, UserPlus, Info } from 'lucide-react'
import { ProfilePanel } from './ProfilePanel'
import { DrinksPanel } from './DrinksPanel'
import { MealsPanel } from './MealsPanel'  
import { ReviewPanel } from './ReviewPanel'
import { RecommendationEngine } from './RecommendationEngine'
import { useHydrationContext } from '@/contexts/HydrationContext'
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
  const [selectedVenue, setSelectedVenue] = useState<string>('f4ce6693-dac2-4010-a4f0-9ebb2bdaafbd')
  const [resetTrigger, setResetTrigger] = useState(0) // Force re-render on reset

  const handleReset = () => {
    // Reset to profile tab
    setActiveTab('profile')
    // Increment trigger to force child components to reset
    setResetTrigger(prev => prev + 1)
    // This will cause panels to reload their default states
    window.location.reload() // Simple solution for now
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) onCloseAction();  // only fire when closing
      }}
    >
      <DialogContent className={`w-[95vw] max-w-4xl h-[85vh] md:h-[90vh] overflow-y-auto overflow-x-hidden ${styles.assessmentModal}`}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>AI Hydration Assessment</DialogTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleReset}>
                <UserPlus className="mr-2 h-4 w-4" />
                Start Fresh (New Client)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Info className="mr-2 h-4 w-4" />
                About
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full grid-cols-5 ${styles.tabsList}`}>
          <TabsTrigger value="profile" className={styles.tabTrigger}>Profile</TabsTrigger>
<TabsTrigger value="drinks" className={styles.tabTrigger}>Drinks</TabsTrigger>
<TabsTrigger value="meals" className={styles.tabTrigger}>Meals</TabsTrigger>
<TabsTrigger value="review" className={styles.tabTrigger}>Review</TabsTrigger>
<TabsTrigger value="recommendations" className={styles.tabTrigger}>AI Plan</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <ProfilePanel 
              venueId={selectedVenue} 
              onVenueChange={setSelectedVenue}
              onNext={() => setActiveTab('drinks')} 
            />
          </TabsContent>
          
          <TabsContent value="drinks">
            <DrinksPanel onNext={() => setActiveTab('meals')} />
          </TabsContent>
          
          <TabsContent value="meals">
            <MealsPanel onNext={() => setActiveTab('review')} />
          </TabsContent>
          
          <TabsContent value="review">
            <ReviewPanel 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
              venueId={selectedVenue}
            />
          </TabsContent>
          
          <TabsContent value="recommendations">
            <RecommendationEngine venueId={selectedVenue} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}