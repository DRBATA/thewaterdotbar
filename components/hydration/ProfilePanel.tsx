'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useHydrationContext } from '@/contexts'

export function ProfilePanel() {
  const { profile } = useHydrationContext()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Body Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <Input
            type="number"
            value={profile.weight}
            onChange={(e) => profile.setWeight(Number(e.target.value))}
            placeholder="70"
          />
        </div>

        {/* Sex Selection */}
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

        {/* Body Fat Input (conditional) */}
        {profile.inputMethod === 'direct' && (
          <div>
            <Label>Body Fat %</Label>
            <Input
              type="number"
              value={profile.manualBodyFat}
              onChange={(e) => profile.setManualBodyFat(Number(e.target.value))}
              placeholder="15"
            />
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
              <SelectItem value="moderate">Moderate (hot yoga, cardio)</SelectItem>
              <SelectItem value="heavy">Heavy (HIIT, intense cardio)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Weight Training Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="weight-training"
            checked={profile.bodyComposition.includesWeightTraining}
            onCheckedChange={(checked) => {
              // TODO: Need to update this in the hook
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
              <SelectItem value="cool">Cool environment</SelectItem>
              <SelectItem value="moderate">Moderate heat</SelectItem>
              <SelectItem value="hot">Hot environment (sauna, hot yoga)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Session Duration */}
        <div>
          <Label>Session Duration (hours)</Label>
          <Input
            type="number"
            step="0.5"
            value={profile.sessionHours}
            onChange={(e) => profile.setSessionHours(Number(e.target.value))}
            placeholder="1"
          />
        </div>

        {/* Calculated Results */}
        <div className="p-4 bg-blue-50 rounded-lg">
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
      </CardContent>
    </Card>
  )
}