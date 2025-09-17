"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, ShoppingCart, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BodyComposition {
  weight: number
  bodyFat: number
  leanBodyMass: number
  totalBodyWater: number
  intracellularWater: number
  extracellularWater: number
  icwLbmRatio: number
  ecwTbwRatio: number
}

interface NutritionalIntake {
  water: number
  sodium: number
  potassium: number
  magnesium: number
  calcium: number
  fiber: number
  protein: number
  probiotics: number
  omega3: number
  polyphenols: number
}

interface RecommendedProduct {
  id: string
  name: string
  quantity: number
  sodium_mg?: number
  potassium_mg?: number
  magnesium_mg?: number
  fiber_g?: number
  protein_g?: number
  water_content_ml?: number
  price_aed: number
}

interface HydrationAssessmentModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId?: string  // Make optional since we'll use cookie session
}

export function HydrationAssessmentModal({ isOpen, onClose }: HydrationAssessmentModalProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("profile")
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<RecommendedProduct[]>([])
  const [planDuration, setPlanDuration] = useState<1 | 3 | 5>(1)
  
  // Body composition state
  const [profile, setProfile] = useState<BodyComposition>({
    weight: 70,
    bodyFat: 15,
    leanBodyMass: 59.5,
    totalBodyWater: 43.9,
    intracellularWater: 25.1,
    extracellularWater: 18.8,
    icwLbmRatio: 0.42,
    ecwTbwRatio: 0.43,
  })

  const [inputMethod, setInputMethod] = useState<"direct" | "bodytype">("direct")
  const [sex, setSex] = useState<"male" | "female">("male")
  const [bodyType, setBodyType] = useState<"shredded" | "fit" | "average" | "carrying-extra">("average")
  const [activityLevel, setActivityLevel] = useState<"desk" | "training">("desk")
  const [sweatLoss, setSweatLoss] = useState(0)

  // Current intake tracking
  const [currentDrinks, setCurrentDrinks] = useState("")
  const [breakfast, setBreakfast] = useState("")
  const [lunch, setLunch] = useState("")
  const [dinner, setDinner] = useState("")
  const [snacks, setSnacks] = useState("")

  // Nutritional accumulator
  const [totalIntake, setTotalIntake] = useState<NutritionalIntake>({
    water: 0,
    sodium: 0,
    potassium: 0,
    magnesium: 0,
    calcium: 0,
    fiber: 0,
    protein: 0,
    probiotics: 0,
    omega3: 0,
    polyphenols: 0,
  })

  // Update profile calculations
  const updateProfile = (field: keyof BodyComposition, value: number) => {
    const newProfile = { ...profile, [field]: value }

    if (field === "weight" || field === "bodyFat") {
      newProfile.leanBodyMass = newProfile.weight * (1 - newProfile.bodyFat / 100)
      newProfile.totalBodyWater = newProfile.leanBodyMass * 0.738
      newProfile.intracellularWater = newProfile.totalBodyWater * 0.57
      newProfile.extracellularWater = newProfile.totalBodyWater * 0.43
    }

    newProfile.icwLbmRatio = newProfile.intracellularWater / newProfile.leanBodyMass
    newProfile.ecwTbwRatio = newProfile.extracellularWater / newProfile.totalBodyWater

    setProfile(newProfile)
  }

  const calculateFromBodyType = () => {
    const bodyFatMap = {
      male: { shredded: 10, fit: 15, average: 22, "carrying-extra": 28 },
      female: { shredded: 20, fit: 25, average: 32, "carrying-extra": 38 },
    }

    const bodyFat = bodyFatMap[sex][bodyType]
    updateProfile("bodyFat", bodyFat)
  }

  // Process meal with AI (nano model for simple parsing)
  const processMealWithAI = async (meal: string, mealType: string) => {
    if (!meal.trim()) return

    setIsProcessing(true)
    try {
      const response = await fetch("/api/ai/parse-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meal, mealType }),
      })

      const data = await response.json()
      
      // Update total intake with parsed nutritional data
      setTotalIntake(prev => ({
        water: prev.water + (data.water || 0),
        sodium: prev.sodium + (data.sodium || 0),
        potassium: prev.potassium + (data.potassium || 0),
        magnesium: prev.magnesium + (data.magnesium || 0),
        calcium: prev.calcium + (data.calcium || 0),
        fiber: prev.fiber + (data.fiber || 0),
        protein: prev.protein + (data.protein || 0),
        probiotics: prev.probiotics + (data.probiotics || 0),
        omega3: prev.omega3 + (data.omega3 || 0),
        polyphenols: prev.polyphenols + (data.polyphenols || 0),
      }))

      // Trigger background AI calculation for recommendations
      calculateRecommendationsInBackground()
    } catch (error) {
      console.error("Error processing meal:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Background AI calculation that updates as meals are added
  const calculateRecommendationsInBackground = useCallback(async () => {
    try {
      const response = await fetch("/api/ai/calculate-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          activityLevel,
          sweatLoss,
          currentIntake: totalIntake,
          planDuration,
        }),
      })

      const data = await response.json()
      setAiRecommendations(data.recommendations || [])
    } catch (error) {
      console.error("Error calculating recommendations:", error)
    }
  }, [profile, activityLevel, sweatLoss, totalIntake, planDuration])

  // Trigger background calculation when relevant state changes
  useEffect(() => {
    if (totalIntake.water > 0 || totalIntake.sodium > 0) {
      calculateRecommendationsInBackground()
    }
  }, [totalIntake, calculateRecommendationsInBackground])

  // Add all recommendations to cart with multiplier
  const addAllToCart = async () => {
    setIsProcessing(true)
    
    try {
      for (const product of aiRecommendations) {
        const response = await fetch("/api/cart/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: product.id,
            qty: product.quantity,
          }),
        })
      }

      toast({
        title: "Success!",
        description: `Added ${aiRecommendations.length} items for your ${planDuration}-day hydration plan`,
      })

      // Clear session storage for next user
      sessionStorage.clear()
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add items to cart",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Load from session storage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("hydrationAssessment")
    if (saved) {
      const data = JSON.parse(saved)
      setProfile(data.profile || profile)
      setTotalIntake(data.totalIntake || totalIntake)
    }
  }, [])

  // Save to session storage on changes
  useEffect(() => {
    sessionStorage.setItem("hydrationAssessment", JSON.stringify({
      profile,
      totalIntake,
    }))
  }, [profile, totalIntake])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Hydration Assessment</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="drinks">Drinks</TabsTrigger>
            <TabsTrigger value="meals">Meals</TabsTrigger>
            <TabsTrigger value="recommendations">
              Plan {aiRecommendations.length > 0 && `(${aiRecommendations.length})`}
            </TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Body Composition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Input Method</Label>
                  <Select value={inputMethod} onValueChange={(v: any) => setInputMethod(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct (Weight + Body Fat %)</SelectItem>
                      <SelectItem value="bodytype">Body Type Estimate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      value={profile.weight}
                      onChange={(e) => updateProfile("weight", parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  {inputMethod === "direct" ? (
                    <div>
                      <Label>Body Fat (%)</Label>
                      <Input
                        type="number"
                        value={profile.bodyFat}
                        onChange={(e) => updateProfile("bodyFat", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label>Sex</Label>
                        <Select value={sex} onValueChange={(v: any) => setSex(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Body Type</Label>
                        <Select value={bodyType} onValueChange={(v: any) => setBodyType(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="shredded">Shredded</SelectItem>
                            <SelectItem value="fit">Fit</SelectItem>
                            <SelectItem value="average">Average</SelectItem>
                            <SelectItem value="carrying-extra">Carrying Extra</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={calculateFromBodyType} className="col-span-2">
                        Calculate
                      </Button>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Activity Level</Label>
                    <Select value={activityLevel} onValueChange={(v: any) => setActivityLevel(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desk">Desk/Light</SelectItem>
                        <SelectItem value="training">Training/Heat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sweat Loss (L)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={sweatLoss}
                      onChange={(e) => setSweatLoss(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Display key ratios */}
                <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>ICW/LBM Ratio:</span>
                    <span className={profile.icwLbmRatio < 0.43 ? "text-orange-600" : ""}>
                      {profile.icwLbmRatio.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ECW/TBW Ratio:</span>
                    <span className={profile.ecwTbwRatio > 0.4 ? "text-blue-600" : ""}>
                      {profile.ecwTbwRatio.toFixed(3)}
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={() => setActiveTab("drinks")}
                  className="w-full"
                >
                  Next: Current Drinks
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drinks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>What have you had to drink today?</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click quick add buttons or type custom drinks
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Quick Add Drinks</Label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTotalIntake(prev => ({
                          ...prev,
                          water: prev.water + 240,
                        }))
                        toast({ title: "Added Coffee (240ml)" })
                      }}
                    >
                      ☕ Coffee (240ml)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTotalIntake(prev => ({
                          ...prev,
                          water: prev.water + 500,
                        }))
                        toast({ title: "Added Water (500ml)" })
                      }}
                    >
                      💧 Water (500ml)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTotalIntake(prev => ({
                          ...prev,
                          water: prev.water + 500,
                          potassium: prev.potassium + 600,
                          sodium: prev.sodium + 50,
                        }))
                        toast({ title: "Added Coconut Water" })
                      }}
                    >
                      🥥 Coconut Water
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTotalIntake(prev => ({
                          ...prev,
                          water: prev.water + 500,
                          sodium: prev.sodium + 200,
                          potassium: prev.potassium + 200,
                        }))
                        toast({ title: "Added Electrolytes (500ml)" })
                      }}
                    >
                      ⚡ Electrolytes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTotalIntake(prev => ({
                          ...prev,
                          water: prev.water + 350,
                          potassium: prev.potassium + 450,
                          sodium: prev.sodium + 150,
                          protein: prev.protein + 8,
                        }))
                        toast({ title: "Added Milk" })
                      }}
                    >
                      🥛 Milk (350ml)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTotalIntake(prev => ({
                          ...prev,
                          water: prev.water + 250,
                          fiber: prev.fiber + 8.5,
                          protein: prev.protein + 12,
                        }))
                        toast({ title: "Added Rite Greens" })
                      }}
                    >
                      🥬 Rite Greens
                    </Button>
                  </div>
                  
                  {/* Show cumulative totals */}
                  {totalIntake.water > 0 && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Current Totals:</p>
                      <p className="text-xs text-muted-foreground">
                        Water: {totalIntake.water}ml
                        {totalIntake.sodium > 0 && ` • Sodium: ${totalIntake.sodium}mg`}
                        {totalIntake.potassium > 0 && ` • Potassium: ${totalIntake.potassium}mg`}
                        {totalIntake.fiber > 0 && ` • Fiber: ${totalIntake.fiber}g`}
                        {totalIntake.protein > 0 && ` • Protein: ${totalIntake.protein}g`}
                      </p>
                    </div>
                  )}
                </div>
                
                <Button 
                  className="w-full mt-4"
                  onClick={() => setActiveTab("meals")}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Next: Meals
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>What have you eaten today?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Breakfast</Label>
                  <Input
                    placeholder="e.g., eggs, toast, orange juice"
                    value={breakfast}
                    onChange={(e) => setBreakfast(e.target.value)}
                    onBlur={() => processMealWithAI(breakfast, "breakfast")}
                  />
                </div>

                <div>
                  <Label>Lunch</Label>
                  <Input
                    placeholder="e.g., chicken salad, rice"
                    value={lunch}
                    onChange={(e) => setLunch(e.target.value)}
                    onBlur={() => processMealWithAI(lunch, "lunch")}
                  />
                </div>

                <div>
                  <Label>Dinner</Label>
                  <Input
                    placeholder="e.g., salmon, vegetables"
                    value={dinner}
                    onChange={(e) => setDinner(e.target.value)}
                    onBlur={() => processMealWithAI(dinner, "dinner")}
                  />
                </div>

                <div>
                  <Label>Snacks</Label>
                  <Input
                    placeholder="e.g., apple, nuts"
                    value={snacks}
                    onChange={(e) => setSnacks(e.target.value)}
                    onBlur={() => processMealWithAI(snacks, "snacks")}
                  />
                </div>
                
                {/* Show meal nutritional breakdown */}
                {(totalIntake.sodium > 0 || totalIntake.potassium > 0 || totalIntake.fiber > 0) && (
                  <div className="p-3 bg-muted rounded-lg mt-4">
                    <p className="text-sm font-medium mb-1">Nutrients from meals:</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {totalIntake.water > 0 && <div>Water: {totalIntake.water}ml</div>}
                      {totalIntake.sodium > 0 && <div>Sodium: {totalIntake.sodium}mg</div>}
                      {totalIntake.potassium > 0 && <div>Potassium: {totalIntake.potassium}mg</div>}
                      {totalIntake.fiber > 0 && <div>Fiber: {totalIntake.fiber}g</div>}
                      {totalIntake.protein > 0 && <div>Protein: {totalIntake.protein}g</div>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Drink Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Plan Duration</Label>
                  <Select value={planDuration.toString()} onValueChange={(v) => setPlanDuration(parseInt(v) as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Day</SelectItem>
                      <SelectItem value="3">3 Days (1.7x)</SelectItem>
                      <SelectItem value="5">5 Days (1.9x)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {aiRecommendations.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      {aiRecommendations.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {product.quantity}
                              {product.water_content_ml && ` • ${product.water_content_ml * product.quantity}ml`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.sodium_mg && `Na: ${product.sodium_mg}mg `}
                              {product.potassium_mg && `K: ${product.potassium_mg}mg `}
                              {product.fiber_g && `Fiber: ${product.fiber_g}g`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {product.price_aed * product.quantity} AED
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={async () => {
                                console.log("Adding product to cart:", product)
                                try {
                                  const response = await fetch("/api/cart/add", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      itemId: product.id,
                                      qty: product.quantity,
                                    }),
                                  })
                                  if (response.ok) {
                                    toast({ 
                                      title: "Added to cart",
                                      description: `${product.name} x${product.quantity}`
                                    })
                                  }
                                } catch (error) {
                                  console.error("Error adding to cart:", error)
                                  toast({ 
                                    title: "Error",
                                    description: "Failed to add to cart",
                                    variant: "destructive"
                                  })
                                }
                              }}
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button 
                      onClick={addAllToCart}
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Add All Drinks to Cart
                        </>
                      )}
                    </Button>

                    {/* Nutritional deficit display */}
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">Remaining Nutritional Needs:</p>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Protein:</span>
                          <span>{Math.max(0, profile.weight * 1.2 - totalIntake.protein).toFixed(0)}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sodium:</span>
                          <span>{Math.max(0, (activityLevel === "desk" ? 1500 : 2000) - totalIntake.sodium).toFixed(0)}mg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Potassium:</span>
                          <span>{Math.max(0, 3500 - totalIntake.potassium).toFixed(0)}mg</span>
                        </div>
                      </div>
                    </div>

                    {/* Optional meal generation */}
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        setIsProcessing(true)
                        try {
                          const deficits = {
                            sodium: Math.max(0, (activityLevel === "desk" ? 1500 : 2000) - totalIntake.sodium),
                            potassium: Math.max(0, 3500 - totalIntake.potassium),
                            fiber: Math.max(0, 15 - totalIntake.fiber),
                            protein: Math.max(0, profile.weight * 1.2 - totalIntake.protein)
                          }
                          
                          // TODO: Add allergy input UI
                          const allergies = [] // For now, empty array
                          
                          const response = await fetch("/api/ai/generate-meals", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ deficits, allergies })
                          })
                          
                          const data = await response.json()
                          // TODO: Display meal suggestions in a modal or new tab
                          console.log("Meal suggestions:", data)
                        } catch (error) {
                          console.error("Error generating meals:", error)
                        } finally {
                          setIsProcessing(false)
                        }
                      }}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Generate Meal Suggestions for Remaining Needs
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2" />
                    <p>Calculating your drink recommendations...</p>
                    <p className="text-sm mt-2">Based on your profile and meals</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Nutritional Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Water:</span>
                    <span>{(totalIntake.water / 1000).toFixed(2)} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sodium:</span>
                    <span>{totalIntake.sodium.toFixed(0)} mg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Potassium:</span>
                    <span>{totalIntake.potassium.toFixed(0)} mg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protein:</span>
                    <span>{totalIntake.protein.toFixed(1)} g</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fiber:</span>
                    <span>{totalIntake.fiber.toFixed(1)} g</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
