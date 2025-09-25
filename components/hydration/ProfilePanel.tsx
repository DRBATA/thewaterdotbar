'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import { useHydrationContext } from '@/contexts'
import { useState, useEffect } from 'react'
import styles from './hydration-assessment.module.css'

interface ProfilePanelProps {
  venueId?: string
  onVenueChange?: (venueId: string) => void
  onNext?: () => void
}

export function ProfilePanel({ venueId, onVenueChange, onNext }: ProfilePanelProps) {
  const { profile } = useHydrationContext()
  const [venues, setVenues] = useState<any[]>([])
  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempWeight, setTempWeight] = useState<string>(String(profile.weight || ''))
  const [tempBodyFat, setTempBodyFat] = useState<string>(String(profile.manualBodyFat || ''))
  const [sessionMinutes, setSessionMinutes] = useState<number>(Math.round((profile.sessionHours || 0) * 60))
  const [tempSessionMinutes, setTempSessionMinutes] = useState<string>(String(sessionMinutes || ''))
  // Fetch venues on mount
  useEffect(() => {
    fetch('/api/venues')
      .then(res => res.json())
      .then(data => setVenues(data || []))
      .catch(err => console.error('Error fetching venues:', err))
  }, [])
  
  return (
    <Card className={styles.panelCard}>
      <CardHeader>
        <CardTitle>Your Body Profile</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Tell us about your body and what you've already consumed or planned for today. 
          We'll calculate what gaps remain and recommend drinks/meals to fill them.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Venue Selection */}
        <div>
          <Label>Select Venue</Label>
          <Select value={venueId} onValueChange={onVenueChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose your venue" />
            </SelectTrigger>
            <SelectContent>
              {venues.map(venue => (
                <SelectItem key={venue.id} value={venue.id}>
                  {venue.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Input Method Selection */}
        <div>
          <Label>How would you like to input your body composition?</Label>
          <Select 
            value={profile.inputMethod} 
            onValueChange={(value) => profile.setInputMethod(value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direct">Enter body fat % directly</SelectItem>
              <SelectItem value="bodytype">Choose body type</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Weight Input */}
        <div>
          <Label>Weight (kg)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={editingField === 'weight' ? tempWeight : profile.weight || ''}
              onChange={(e) => {
                setEditingField('weight')
                setTempWeight(e.target.value)
              }}
              onFocus={() => {
                setEditingField('weight')
                setTempWeight(String(profile.weight || ''))
              }}
              placeholder="70"
              className={`${styles.input} flex-1`}
            />
            {editingField === 'weight' && (
              <Button
                size="sm"
                onClick={() => {
                  profile.setWeight(tempWeight === '' ? 0 : Number(tempWeight))
                  setEditingField(null)
                }}
              >
                Set
              </Button>
            )}
          </div>
        </div>

        {/* Sex Selection - Only needed when using body type estimation */}
        {profile.inputMethod === 'bodytype' && (
          <div>
            <Label>Sex</Label>
            <Select value={profile.sex} onValueChange={(value) => profile.setSex(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Body Fat Input (conditional) */}
        {profile.inputMethod === 'direct' && (
          <div>
            <Label>Body Fat %</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={editingField === 'bodyfat' ? tempBodyFat : profile.manualBodyFat || ''}
                onChange={(e) => {
                  setEditingField('bodyfat')
                  setTempBodyFat(e.target.value)
                }}
                onFocus={() => {
                  setEditingField('bodyfat')
                  setTempBodyFat(String(profile.manualBodyFat || ''))
                }}
                placeholder="15"
                className={`${styles.input} flex-1`}
              />
              {editingField === 'bodyfat' && (
                <Button
                  size="sm"
                  onClick={() => {
                    profile.setManualBodyFat(tempBodyFat === '' ? 0 : Number(tempBodyFat))
                    setEditingField(null)
                  }}
                >
                  Set
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Body Type Selection (conditional) */}
        {profile.inputMethod === 'bodytype' && (
          <div>
            <Label>Body Type</Label>
            <Select value={profile.bodyType} onValueChange={(value) => profile.setBodyType(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shredded">Shredded (visible abs)</SelectItem>
                <SelectItem value="fit">Fit (athletic build)</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="carrying-extra">Carrying extra weight</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Activity Level */}
        <div>
          <Label>Activity Level</Label>
          <Select value={profile.activityLevel} onValueChange={(value) => profile.setActivityLevel(value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light (desk job)</SelectItem>
              <SelectItem value="moderate">Moderate (gym, sports)</SelectItem>
              <SelectItem value="heavy">Heavy (HIIT, powerlifting)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Weight Training Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="weight-training"
            checked={profile.bodyComposition.includesWeightTraining}
            onCheckedChange={(checked) => {
              profile.setIncludesWeightTraining(!!checked)
              console.log('Weight training:', checked)
            }}
          />
          <Label htmlFor="weight-training">
            Includes weight training (increases protein needs)
          </Label>
        </div>

        {/* Sweat Context */}
        <div>
          <Label>Session Environment</Label>
          <Select value={profile.sweatContext} onValueChange={(value) => profile.setSweatContext(value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cool">Cool environment (gym) </SelectItem>
              <SelectItem value="moderate">Moderate heat (rooftop pool)</SelectItem>
              <SelectItem value="hot">Hot environment (sauna, hot yoga)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Session Duration */}
<div>
  <Label>Session Duration (minutes)</Label>
  <div className="flex gap-2">
    <Input
      type="number"
      step="15"
      min="0"
      value={editingField === 'session' ? tempSessionMinutes : sessionMinutes || ''}
      onChange={(e) => {
        setEditingField('session')
        setTempSessionMinutes(e.target.value)
      }}
      onFocus={() => {
        setEditingField('session')
        setTempSessionMinutes(String(sessionMinutes || ''))
      }}
      placeholder="0"
      className={`${styles.input} flex-1`}
    />
    {editingField === 'session' && (
      <Button
        size="sm"
        onClick={() => {
          const minutes = tempSessionMinutes === '' ? 0 : Number(tempSessionMinutes)
          setSessionMinutes(minutes)
          profile.setSessionHours(minutes / 60)
          setEditingField(null)
        }}
      >
        Set
      </Button>
    )}
    <span className="text-sm text-muted-foreground self-center">
      {sessionMinutes > 0 && `(${(sessionMinutes / 60).toFixed(1)}h)`}
    </span>
  </div>
</div>

        {/* Calculated Results */}
        <div className={styles.resultsBox}>
          <h4 className="font-medium text-blue-800 mb-2">Your Targets:</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div>Lean Body Mass: {profile.bodyComposition.leanBodyMass.toFixed(1)}kg</div>
            <div>Water: {profile.targets.water}ml</div>
            <div>Sodium: {profile.targets.sodium}mg</div>
            <div>Potassium: {profile.targets.potassium}mg</div>
            <div>Protein: {profile.targets.protein}g</div>
            <div>Fiber: {profile.targets.fiber}g</div>
          </div>
        </div>

        {/* Navigation Button */}
        {onNext && (
          <Button 
            onClick={onNext}
            variant="outline"
            className="w-full mt-6 bg-white/5 backdrop-blur border-teal-500/20 hover:bg-teal-500/10 hover:border-teal-500/40 transition-all"
          >
            Continue to Drinks
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}