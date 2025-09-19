"use client"

import { useState, useEffect, useCallback, lazy, Suspense } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, ShoppingCart, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const HydrationSphere = lazy(() => import("./hydration-sphere").then(m => ({ default: m.HydrationSphere })))

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
  // Additional micronutrients
  b6: number
  b9: number
  b12: number
  iron: number
  zinc: number
  copper: number
  choline: number
  vitamin_c: number
  vitamin_d: number
  caffeine: number
  soluble_fiber: number
  insoluble_fiber: number
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
  onCloseAction: () => void
  sessionId?: string  // Make optional since we'll use cookie session
}

export function HydrationAssessmentModal({ isOpen, onCloseAction }: HydrationAssessmentModalProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("profile")
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([])
  const [recentProducts, setRecentProducts] = useState<string[]>([])
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

  const [inputMethod, setInputMethod] = useState<"direct" | "tbw" | "bodytype">("direct")
  const [sex, setSex] = useState<"male" | "female">("male")
  const [bodyType, setBodyType] = useState<"shredded" | "fit" | "average" | "carrying-extra">("average")
  const [activityLevel, setActivityLevel] = useState<"light" | "moderate" | "heavy">("moderate")
  const [dailyTargets, setDailyTargets] = useState({
    potassium: 0,
    sodium: 0,
    protein: 0,
    water: 0,
    fiber: 20,
    b12: 2.4,
    magnesium: 320,
  })
  const [sweatLoss, setSweatLoss] = useState(0)
  const [sweatMethod, setSweatMethod] = useState<"manual" | "context">("context")
  const [sweatContext, setSweatContext] = useState<"cool" | "moderate" | "hot">("moderate")
  const [sessionHours, setSessionHours] = useState(1)

  // Current intake tracking
  const [currentDrinks, setCurrentDrinks] = useState("")
  const [drinkSearch, setDrinkSearch] = useState("")
  const [availableDrinks, setAvailableDrinks] = useState<any[]>([])
  const [drinkSortBy, setDrinkSortBy] = useState<"name" | "volume">("name")
  const [showClarification, setShowClarification] = useState(false)
  const [clarificationData, setClarificationData] = useState<{
    question: string
    suggestions: string[]
    originalInput: string
  } | null>(null)
  const [breakfast, setBreakfast] = useState("")
  const [lunch, setLunch] = useState("")
  const [dinner, setDinner] = useState("")
  const [snacks, setSnacks] = useState("")
  // Removed allergies - these are only suggestions!
  const [mealSuggestions, setMealSuggestions] = useState<any[]>([])
  const [showMealModal, setShowMealModal] = useState(false)

  // Comprehensive nutritional accumulator (all nutrients from matrix)
  const [totalIntake, setTotalIntake] = useState<NutritionalIntake>({
    water: 0,
    sodium: 0,      // na_mg in DB
    potassium: 0,   // k_mg in DB
    magnesium: 0,   // mg_mg in DB
    calcium: 0,
    fiber: 0,       // soluble_fiber_g + insoluble_fiber_g
    protein: 0,
    probiotics: 0,  // probiotic_cfu in DB
    omega3: 0,      // omega3_mg in DB
    polyphenols: 0, // polyphenols_mg in DB
    // Additional micronutrients from matrix
    b6: 0,          // b6_mg in DB
    b9: 0,          // b9_ug in DB (folate)
    b12: 0,         // b12_ug in DB
    iron: 0,        // iron_mg in DB
    zinc: 0,        // zinc_mg in DB
    copper: 0,      // copper_mg in DB
    choline: 0,     // choline_mg in DB
    vitamin_c: 0,   // vitamin_c_mg in DB
    vitamin_d: 0,   // vitamin_d_ug in DB
    caffeine: 0,    // caffeine_mg in DB
    soluble_fiber: 0,
    insoluble_fiber: 0,
  })

  // Individual meal nutrition tracking
  const [mealNutrition, setMealNutrition] = useState<{
    breakfast: NutritionalIntake | null,
    lunch: NutritionalIntake | null,
    dinner: NutritionalIntake | null,
    snacks: NutritionalIntake | null,
  }>({
    breakfast: null,
    lunch: null,
    dinner: null,
    snacks: null,
  })

  // Update profile calculations
  const updateProfile = (field: keyof BodyComposition, value: number) => {
    const newProfile = { ...profile, [field]: value }

    if (inputMethod === "direct" && (field === "weight" || field === "bodyFat")) {
      // Calculate from weight and body fat
      newProfile.leanBodyMass = newProfile.weight * (1 - newProfile.bodyFat / 100)
      newProfile.totalBodyWater = newProfile.leanBodyMass * 0.738
      // Correct ratio: ~62% ICW, ~38% ECW
      newProfile.intracellularWater = newProfile.totalBodyWater * 0.62
      newProfile.extracellularWater = newProfile.totalBodyWater * 0.38
    } else if (inputMethod === "tbw" && field === "totalBodyWater") {
      // From BIA device - derive LBM from TBW
      newProfile.leanBodyMass = value / 0.738
      newProfile.bodyFat = ((newProfile.weight - newProfile.leanBodyMass) / newProfile.weight) * 100
      newProfile.totalBodyWater = value
      // Use standard ratios if ICW/ECW not provided
      if (!newProfile.intracellularWater || !newProfile.extracellularWater) {
        newProfile.intracellularWater = value * 0.62
        newProfile.extracellularWater = value * 0.38
      }
    }

    // Allow manual ICW/ECW override from BIA device
    if (field === "intracellularWater" || field === "extracellularWater") {
      newProfile.totalBodyWater = newProfile.intracellularWater + newProfile.extracellularWater
    }
    
    newProfile.icwLbmRatio = newProfile.intracellularWater / newProfile.leanBodyMass
    newProfile.ecwTbwRatio = newProfile.extracellularWater / newProfile.totalBodyWater

    setProfile(newProfile)
    
    // Calculate LBM-based daily targets
    calculateDailyTargets(newProfile)
  }

  // Calculate realistic LBM-based targets
  const calculateDailyTargets = (bodyProfile: BodyComposition) => {
    const lbm = bodyProfile.leanBodyMass
    
    // Base targets scaled to LBM (more realistic)
    const baseTargets = {
      potassium: lbm * 40,      // 40mg × LBM kg (vs impossible 3500mg)
      sodium: lbm * 30,         // 30mg × LBM kg (vs impossible 1500mg)  
      protein: lbm * 1.4,       // 1.4g × LBM kg for moderate activity
      water: lbm * 35,          // 35ml × LBM kg base hydration
    }
    
    // Calculate sweat adjustments
    const sweatLoss = calculateSweatLoss()
    const sweatAdjustments = {
      potassium: sweatLoss * 250,
      sodium: sweatLoss * 900,
      water: sweatLoss * 500,
    }
    
    setDailyTargets({
      potassium: baseTargets.potassium + sweatAdjustments.potassium,
      sodium: baseTargets.sodium + sweatAdjustments.sodium,
      protein: baseTargets.protein,
      water: baseTargets.water + sweatAdjustments.water,
      fiber: 20, // Fixed daily target
      b12: 2.4, // Fixed RDA
      magnesium: sex === "female" ? 310 : 420, // Gender-specific RDA
    })
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
    if (!meal.trim()) {
      // Clear individual meal nutrition if meal is empty
      setMealNutrition(prev => ({ ...prev, [mealType]: null }))
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/ai/parse-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meal, mealType }),
      })

      const data = await response.json()
      
      // Check if clarification is needed
      if (data.needsClarification) {
        setClarificationData({
          question: data.question,
          suggestions: data.suggestions,
          originalInput: meal
        })
        setShowClarification(true)
        setIsProcessing(false)
        return
      }
      
      // Store individual meal nutrition
      const mealData = {
        water: data.water || 0,
        sodium: data.sodium || 0,
        potassium: data.potassium || 0,
        magnesium: data.magnesium || 0,
        calcium: data.calcium || 0,
        fiber: data.fiber || 0,
        protein: data.protein || 0,
        probiotics: data.probiotics || 0,
        omega3: data.omega3 || 0,
        polyphenols: data.polyphenols || 0,
        b6: data.b6 || 0,
        b9: data.b9 || 0,
        b12: data.b12 || 0,
        iron: data.iron || 0,
        zinc: data.zinc || 0,
        copper: data.copper || 0,
        choline: data.choline || 0,
        vitamin_c: data.vitamin_c || 0,
        vitamin_d: data.vitamin_d || 0,
        caffeine: data.caffeine || 0,
        soluble_fiber: data.soluble_fiber || 0,
        insoluble_fiber: data.insoluble_fiber || 0,
      }
      
      // Update meal-specific nutrition
      setMealNutrition(prev => ({
        ...prev,
        [mealType]: mealData
      }))
      
      // Add to total intake (all nutrients)
      setTotalIntake(prev => ({
        ...prev,
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
        b6: prev.b6 + (data.b6 || 0),
        b9: prev.b9 + (data.b9 || 0),
        b12: prev.b12 + (data.b12 || 0),
        iron: prev.iron + (data.iron || 0),
        zinc: prev.zinc + (data.zinc || 0),
        copper: prev.copper + (data.copper || 0),
        choline: prev.choline + (data.choline || 0),
        vitamin_c: prev.vitamin_c + (data.vitamin_c || 0),
        vitamin_d: prev.vitamin_d + (data.vitamin_d || 0),
        caffeine: prev.caffeine + (data.caffeine || 0),
        soluble_fiber: prev.soluble_fiber + (data.soluble_fiber || 0),
        insoluble_fiber: prev.insoluble_fiber + (data.insoluble_fiber || 0),
      }))

      toast({
        title: "Meal Added",
        description: data.explanation || `${meal} - ${data.water}ml water, ${data.sodium}mg sodium, ${data.protein}g protein`,
      })
    } catch (error) {
      console.error("Error parsing meal:", error)
      toast({
        title: "Error",
        description: "Failed to parse meal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle clarification response
  const handleClarificationResponse = async (clarifiedMeal: string) => {
    setShowClarification(false)
    setClarificationData(null)
    
    // Re-submit with clarified meal
    await processMealWithAI(clarifiedMeal, "meal")
  }

  // Calculate sweat loss based on method
  const calculateSweatLoss = () => {
    if (sweatMethod === "context") {
      const rates = { cool: 0.3, moderate: 0.6, hot: 1.0 }
      return rates[sweatContext] * sessionHours
    }
    return sweatLoss
  }

  // Background AI calculation that updates as meals are added
  const generateAIRecommendations = useCallback(async () => {
    // Calculate current deficits
    const deficits = {
      water: Math.max(0, dailyTargets.water - totalIntake.water),
      sodium: Math.max(0, dailyTargets.sodium - totalIntake.sodium),
      potassium: Math.max(0, dailyTargets.potassium - totalIntake.potassium),
      protein: Math.max(0, dailyTargets.protein - totalIntake.protein),
      fiber: Math.max(0, dailyTargets.fiber - totalIntake.fiber),
      b12: Math.max(0, (dailyTargets.b12 || 2.4) - totalIntake.b12),
      magnesium: Math.max(0, (dailyTargets.magnesium || 320) - totalIntake.magnesium),
      probiotics: totalIntake.probiotics === 0 ? 1 : 0, // Binary check
    };
    
    // Call new hydration plan API with threshold matrix rules
    try {
      const response = await fetch('/api/ai/generate-hydration-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deficits,
          dailyTargets,
          totalIntake,
          recentProducts,
          planDays: planDuration
        })
      });
      
      const data = await response.json();
      
      if (data.drinks) {
        setAiRecommendations(data.drinks);
        // Track what we recommended to avoid repetition
        setRecentProducts(prev => [...prev, ...data.drinks.map((d: any) => d.name)]);
      } else if (data.plan) {
        // Multi-day plan
        setAiRecommendations(data.plan[0]); // Show day 1
        console.log('Multi-day plan generated:', data.plan);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Fallback to previous logic if new API fails
      generateFallbackRecommendations();
    }
  }, [dailyTargets, totalIntake, planDuration, recentProducts]);

  const generateFallbackRecommendations = async () => {
    try {
      const response = await fetch("/api/ai/calculate-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          activityLevel,
          sweatLoss: calculateSweatLoss(),
          currentIntake: totalIntake,
          planDuration,
        }),
      })

      const data = await response.json()
      setAiRecommendations(data.recommendations || [])
    } catch (error) {
      console.error("Error calculating recommendations:", error)
    }
  }

  // Load drinks from hydration_options on mount
  useEffect(() => {
    const loadDrinks = async () => {
      try {
        const response = await fetch("/api/hydration-options")
        const data = await response.json()
        setAvailableDrinks(data.drinks || [])
      } catch (error) {
        console.error("Error loading drinks:", error)
      }
    }
    loadDrinks()
  }, [])

  // Trigger AI recommendations when switching to recommendations tab or when intake changes
  useEffect(() => {
    if (activeTab === "recommendations") {
      generateAIRecommendations()
    }
  }, [activeTab, totalIntake, dailyTargets, planDuration])

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
        
        if (response.ok) {
          const data = await response.json()
          console.log(`🛒 AI Modal Batch: Cart ${data.action || 'unknown'} for ${product.name}`)
        }
      }

      // Trigger cart refresh after all items added
      console.log(`🛒 AI Modal: Triggering refresh after batch add of ${aiRecommendations.length} items`)
      window.dispatchEvent(new Event('cart-updated'))
      
      // Double trigger for safety with batch operations
      setTimeout(() => {
        window.dispatchEvent(new Event('cart-updated'))
      }, 100)

      toast({
        title: "Success!",
        description: `Added ${aiRecommendations.length} items for your ${planDuration}-day hydration plan`,
      })

      // Clear session storage for next user
      sessionStorage.clear()
      onCloseAction()
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
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-teal-300">AI Hydration Assessment</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-sm border border-white/20">
            <TabsTrigger value="profile" className="data-[state=active]:bg-teal-500/30 data-[state=active]:text-white text-white/70">Profile</TabsTrigger>
            <TabsTrigger value="drinks" className="data-[state=active]:bg-teal-500/30 data-[state=active]:text-white text-white/70">Drinks</TabsTrigger>
            <TabsTrigger value="meals" className="data-[state=active]:bg-teal-500/30 data-[state=active]:text-white text-white/70">Meals</TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=active]:bg-teal-500/30 data-[state=active]:text-white text-white/70">
              Plan {aiRecommendations.length > 0 && `(${aiRecommendations.length})`}
            </TabsTrigger>
            <TabsTrigger value="review" className="data-[state=active]:bg-teal-500/30 data-[state=active]:text-white text-white/70">Review</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Body Composition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700">Input Method</Label>
                    <Select value={inputMethod} onValueChange={(v) => setInputMethod(v as any)}>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-white/20">
                        <SelectItem value="direct" className="text-white hover:bg-white/10">Direct (Weight + Body Fat %)</SelectItem>
                        <SelectItem value="tbw" className="text-white hover:bg-white/10">From BIA Device (TBW)</SelectItem>
                        <SelectItem value="bodytype" className="text-white hover:bg-white/10">Visual Estimation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {inputMethod === "direct" ? (
                    <>
                      <div>
                        <Label className="text-gray-700">Weight (kg)</Label>
                        <Input
                          type="number"
                          value={profile.weight}
                          onChange={(e) => updateProfile("weight", Number(e.target.value))}
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700">Body Fat (%)</Label>
                        <Input
                          type="number"
                          value={profile.bodyFat}
                          onChange={(e) => updateProfile("bodyFat", Number(e.target.value))}
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                    </>
                  ) : inputMethod === "tbw" ? (
                    <>
                      <div>
                        <Label className="text-gray-700">Weight (kg)</Label>
                        <Input
                          type="number"
                          value={profile.weight}
                          onChange={(e) => setProfile({ ...profile, weight: Number(e.target.value) })}
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700">Total Body Water (L)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={profile.totalBodyWater}
                          onChange={(e) => updateProfile("totalBodyWater", Number(e.target.value))}
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      <div className="col-span-2 grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-700">ICW (L)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={profile.intracellularWater}
                            onChange={(e) => updateProfile("intracellularWater", Number(e.target.value))}
                            className="bg-white border-gray-300 text-gray-900"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-700">ECW (L)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={profile.extracellularWater}
                            onChange={(e) => updateProfile("extracellularWater", Number(e.target.value))}
                            className="bg-white border-gray-300 text-gray-900"
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-gray-700">Lean Body Mass (kg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={profile.leanBodyMass.toFixed(1)}
                          readOnly
                          className="bg-gray-100 border-gray-300 text-gray-700"
                        />
                        <p className="text-xs text-gray-500 mt-1">Calculated from TBW ÷ 0.738</p>
                      </div>
                    </>
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
                    <Label className="text-gray-700">Activity Level</Label>
                    <Select value={activityLevel} onValueChange={(v) => setActivityLevel(v as any)}>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-white/20">
                        <SelectItem value="desk" className="text-white hover:bg-white/10">Desk/Light</SelectItem>
                        <SelectItem value="training" className="text-white hover:bg-white/10">Training</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-700">Sweat Loss Calculation</Label>
                    <Select value={sweatMethod} onValueChange={(v: "manual" | "context") => setSweatMethod(v)}>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-white/20">
                        <SelectItem value="context" className="text-white hover:bg-white/10">Context Estimate</SelectItem>
                        <SelectItem value="manual" className="text-white hover:bg-white/10">Manual Input</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Sweat calculation inputs based on method */}
                {sweatMethod === "context" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-gray-700">Session Context</Label>
                      <Select value={sweatContext} onValueChange={(v: "cool" | "moderate" | "hot") => setSweatContext(v)}>
                        <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-white/20">
                          <SelectItem value="cool" className="text-white hover:bg-white/10">Cool/Light (0.3 L/h)</SelectItem>
                          <SelectItem value="moderate" className="text-white hover:bg-white/10">Moderate (0.6 L/h)</SelectItem>
                          <SelectItem value="hot" className="text-white hover:bg-white/10">Hot/Hard (1.0 L/h)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-700">Session Hours</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={sessionHours}
                        onChange={(e) => setSessionHours(Number(e.target.value) || 1)}
                        className="bg-white border-gray-300 text-gray-900"
                      />
                    </div>
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      Estimated: {(() => {
                        const rates = { cool: 0.3, moderate: 0.6, hot: 1.0 }
                        return (rates[sweatContext] * sessionHours).toFixed(2)
                      })()} L
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="text-gray-700">Sweat Loss (L)</Label>
                    <Input
                      type="number"
                      value={sweatLoss}
                      onChange={(e) => setSweatLoss(Number(e.target.value))}
                      step="0.1"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="breakfast">Breakfast</Label>
                  <Input
                    id="breakfast"
                    value={breakfast}
                    onChange={(e) => setBreakfast(e.target.value)}
                  />
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
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">What have you had to drink today?</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click quick add buttons or search from database
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Sort Controls */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search drinks..."
                      value={drinkSearch}
                      onChange={(e) => setDrinkSearch(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={drinkSortBy} onValueChange={(v: "name" | "volume") => setDrinkSortBy(v)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">A-Z</SelectItem>
                        <SelectItem value="volume">Volume</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Drinks Grid from Database - Filter by category='drink' */}
                  <div className="h-48 overflow-y-auto border rounded-lg p-2">
                    <div className="grid grid-cols-3 gap-2">
                      {availableDrinks
                        .filter(d => 
                          d.category === 'drink' && 
                          d.name.toLowerCase().includes(drinkSearch.toLowerCase())
                        )
                        .sort((a, b) => {
                          if (drinkSortBy === "name") return a.name.localeCompare(b.name)
                          return (b.h2o_ml || 0) - (a.h2o_ml || 0)
                        })
                        .map((drink, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="text-xs h-auto py-2 px-1"
                            onClick={() => {
                              setTotalIntake(prev => ({
                                ...prev,
                                water: prev.water + (drink.h2o_ml || 0),
                                sodium: prev.sodium + (drink.na_mg || 0),
                                potassium: prev.potassium + (drink.k_mg || 0),
                                magnesium: prev.magnesium + (drink.mg_mg || 0),
                                calcium: prev.calcium + (drink.calcium_mg || 0),
                                fiber: prev.fiber + ((drink.soluble_fiber_g || 0) + (drink.insoluble_fiber_g || 0)),
                                protein: prev.protein + (drink.protein_g || 0),
                                probiotics: prev.probiotics + (drink.probiotic_cfu || 0),
                                omega3: prev.omega3 + (drink.omega3_mg || 0),
                                polyphenols: prev.polyphenols + (drink.polyphenols_mg || 0),
                                b6: prev.b6 + (drink.b6_mg || 0),
                                b9: prev.b9 + (drink.b9_ug || 0),
                                b12: prev.b12 + (drink.b12_ug || 0),
                                iron: prev.iron + (drink.iron_mg || 0),
                                zinc: prev.zinc + (drink.zinc_mg || 0),
                                copper: prev.copper + (drink.copper_mg || 0),
                                choline: prev.choline + (drink.choline_mg || 0),
                                vitamin_c: prev.vitamin_c + (drink.vitamin_c_mg || 0),
                                vitamin_d: prev.vitamin_d + (drink.vitamin_d_ug || 0),
                                caffeine: prev.caffeine + (drink.caffeine_mg || 0),
                                soluble_fiber: prev.soluble_fiber + (drink.soluble_fiber_g || 0),
                                insoluble_fiber: prev.insoluble_fiber + (drink.insoluble_fiber_g || 0),
                              }))
                              toast({ 
                                title: `Added ${drink.name}`,
                                description: `${drink.h2o_ml || 0}ml water${drink.caffeine_mg ? `, ${drink.caffeine_mg}mg caffeine` : ''}`
                              })
                            }}
                          >
                            <div className="text-center w-full">
                              <div className="font-medium truncate">{drink.name}</div>
                              <div className="text-gray-500">
                                {drink.h2o_ml ? `${drink.h2o_ml}ml` : ""}
                              </div>
                            </div>
                          </Button>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quick Add Common Drinks</Label>
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
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., eggs, toast, orange juice"
                      value={breakfast}
                      onChange={(e) => setBreakfast(e.target.value)}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => processMealWithAI(breakfast, "breakfast")}
                      disabled={!breakfast.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {mealNutrition.breakfast && (
                    <div className="p-2 bg-blue-50 rounded-md mt-2 text-xs">
                      <div className="font-medium text-blue-800 mb-1">From breakfast:</div>
                      <div className="text-blue-700 space-y-0.5">
                        {mealNutrition.breakfast.water > 0 && <div>Water: {mealNutrition.breakfast.water}ml</div>}
                        {mealNutrition.breakfast.sodium > 0 && <div>Sodium: {mealNutrition.breakfast.sodium}mg</div>}
                        {mealNutrition.breakfast.potassium > 0 && <div>Potassium: {mealNutrition.breakfast.potassium}mg</div>}
                        {mealNutrition.breakfast.fiber > 0 && <div>Fiber: {mealNutrition.breakfast.fiber}g</div>}
                        {mealNutrition.breakfast.protein > 0 && <div>Protein: {mealNutrition.breakfast.protein}g</div>}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Lunch</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., chicken salad, rice"
                      value={lunch}
                      onChange={(e) => setLunch(e.target.value)}
                      onBlur={() => processMealWithAI(lunch, "lunch")}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => processMealWithAI(lunch, "lunch")}
                      disabled={!lunch.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {mealNutrition.lunch && (
                    <div className="p-2 bg-green-50 rounded-md mt-2 text-xs">
                      <div className="font-medium text-green-800 mb-1">From lunch:</div>
                      <div className="text-green-700 space-y-0.5">
                        {mealNutrition.lunch.water > 0 && <div>Water: {mealNutrition.lunch.water}ml</div>}
                        {mealNutrition.lunch.sodium > 0 && <div>Sodium: {mealNutrition.lunch.sodium}mg</div>}
                        {mealNutrition.lunch.potassium > 0 && <div>Potassium: {mealNutrition.lunch.potassium}mg</div>}
                        {mealNutrition.lunch.fiber > 0 && <div>Fiber: {mealNutrition.lunch.fiber}g</div>}
                        {mealNutrition.lunch.protein > 0 && <div>Protein: {mealNutrition.lunch.protein}g</div>}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Dinner</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., salmon, vegetables"
                      value={dinner}
                      onChange={(e) => setDinner(e.target.value)}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => processMealWithAI(dinner, "dinner")}
                      disabled={!dinner.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {mealNutrition.dinner && (
                    <div className="p-2 bg-orange-50 rounded-md mt-2 text-xs">
                      <div className="font-medium text-orange-800 mb-1">From dinner:</div>
                      <div className="text-orange-700 space-y-0.5">
                        {mealNutrition.dinner.water > 0 && <div>Water: {mealNutrition.dinner.water}ml</div>}
                        {mealNutrition.dinner.sodium > 0 && <div>Sodium: {mealNutrition.dinner.sodium}mg</div>}
                        {mealNutrition.dinner.potassium > 0 && <div>Potassium: {mealNutrition.dinner.potassium}mg</div>}
                        {mealNutrition.dinner.fiber > 0 && <div>Fiber: {mealNutrition.dinner.fiber}g</div>}
                        {mealNutrition.dinner.protein > 0 && <div>Protein: {mealNutrition.dinner.protein}g</div>}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Snacks</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., apple, nuts"
                      value={snacks}
                      onChange={(e) => setSnacks(e.target.value)}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => processMealWithAI(snacks, "snacks")}
                      disabled={!snacks.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {mealNutrition.snacks && (
                    <div className="p-2 bg-purple-50 rounded-md mt-2 text-xs">
                      <div className="font-medium text-purple-800 mb-1">From snacks:</div>
                      <div className="text-purple-700 space-y-0.5">
                        {mealNutrition.snacks.water > 0 && <div>Water: {mealNutrition.snacks.water}ml</div>}
                        {mealNutrition.snacks.sodium > 0 && <div>Sodium: {mealNutrition.snacks.sodium}mg</div>}
                        {mealNutrition.snacks.potassium > 0 && <div>Potassium: {mealNutrition.snacks.potassium}mg</div>}
                        {mealNutrition.snacks.fiber > 0 && <div>Fiber: {mealNutrition.snacks.fiber}g</div>}
                        {mealNutrition.snacks.protein > 0 && <div>Protein: {mealNutrition.snacks.protein}g</div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Global Clarification Mini-Chat */}
                {showClarification && clarificationData && (
                  <div className="border rounded-lg p-4 bg-blue-50 space-y-3">
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                        AI
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{clarificationData.question}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {clarificationData.suggestions.map((suggestion, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleClarificationResponse(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                        <div className="mt-2">
                          <Input
                            placeholder="Or type your own..."
                            className="text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const target = e.target as HTMLInputElement
                                if (target.value.trim()) {
                                  handleClarificationResponse(target.value.trim())
                                  target.value = ''
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
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
                    {/* Make recommendations scrollable horizontally */}
                    <div className="overflow-x-auto pb-2">
                      <div className="flex gap-3 min-w-max">
                        {aiRecommendations.map((product, index) => (
                        <div key={index} className="flex-shrink-0 w-64 p-3 border rounded-lg relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={async () => {
                              // Remove this item and get a replacement
                              const dismissed = aiRecommendations[index].name;
                              setRecentProducts(prev => [...prev, dismissed]);
                              
                              // Remove from current recommendations
                              const newRecs = aiRecommendations.filter((_, i) => i !== index);
                              setAiRecommendations(newRecs);
                              
                              // Get a replacement recommendation
                              generateAIRecommendations();
                            }}
                          >
                            ×
                          </Button>
                          <div className="flex-1 pt-2">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {product.quantity}
                              {product.h2o_ml && ` • ${product.h2o_ml * product.quantity}ml`}
                            </p>
                            {product.reason && (
                              <p className="text-xs text-blue-600 italic mb-1">
                                {product.reason}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {product.na_mg && `Na: ${product.na_mg * product.quantity}mg `}
                              {product.k_mg && `K: ${product.k_mg * product.quantity}mg `}
                              {product.protein_g && `Protein: ${product.protein_g * product.quantity}g`}
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
                                // Store assessment data for email integration via Stripe webhook
                                const assessmentData = {
                                  profile,
                                  dailyTargets,
                                  totalIntake,
                                  activityLevel,
                                  deficits: {
                                    protein: Math.max(0, dailyTargets.protein - totalIntake.protein),
                                    sodium: Math.max(0, dailyTargets.sodium - totalIntake.sodium),
                                    potassium: Math.max(0, dailyTargets.potassium - totalIntake.potassium),
                                    fiber: Math.max(0, dailyTargets.fiber - totalIntake.fiber),
                                    water: Math.max(0, dailyTargets.water - totalIntake.water),
                                  },
                                  timestamp: Date.now()
                                }
                                sessionStorage.setItem('hydrationAssessment', JSON.stringify(assessmentData))
                                console.log('💾 Stored assessment for email integration')
                                
                                // Also store in database for Stripe webhook email integration
                                try {
                                  await fetch('/api/cart/store-assessment', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      sessionId: sessionStorage.getItem('session_id') || `session_${Date.now()}`,
                                      assessmentData
                                    })
                                  });
                                  console.log('📧 Assessment stored for webhook email integration');
                                } catch (dbError) {
                                  console.log('Database storage failed, but session storage succeeded');
                                }
                                
                                if (!product.id) {
                                  console.error("Product ID is missing:", product)
                                  toast({ title: "Error", description: "Product ID missing" })
                                  return
                                }
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
                                    const data = await response.json()
                                    toast({ 
                                      title: "Added to cart",
                                      description: `${product.name} x${product.quantity}`
                                    })
                                    // Always trigger cart refresh, especially important for INSERT
                                    console.log(`🛒 AI Modal: Cart ${data.action || 'unknown'}, triggering refresh`, data)
                                    window.dispatchEvent(new Event('cart-updated'))
                                    // Force immediate refresh for INSERT operations
                                    if (data.action === 'inserted') {
                                      console.log(`🛒 AI Modal: Firing delayed refresh for INSERT`)
                                      setTimeout(() => {
                                        window.dispatchEvent(new Event('cart-updated'))
                                      }, 100)
                                    }
                                  } else {
                                    const errorData = await response.text()
                                    console.error("Cart add failed:", response.status, errorData)
                                    toast({ 
                                      title: "Failed to add to cart",
                                      description: `Error: ${response.status}`
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
                    </div>

                    <Button 
                      onClick={() => {
                        // Store assessment data for email integration via Stripe webhook
                        const assessmentData = {
                          profile,
                          dailyTargets,
                          totalIntake,
                          activityLevel,
                          deficits: {
                            protein: Math.max(0, dailyTargets.protein - totalIntake.protein),
                            sodium: Math.max(0, dailyTargets.sodium - totalIntake.sodium),
                            potassium: Math.max(0, dailyTargets.potassium - totalIntake.potassium),
                            fiber: Math.max(0, dailyTargets.fiber - totalIntake.fiber),
                            water: Math.max(0, dailyTargets.water - totalIntake.water),
                          },
                          timestamp: Date.now()
                        }
                        sessionStorage.setItem('hydrationAssessment', JSON.stringify(assessmentData))
                        console.log('💾 Stored assessment for bundle purchase email integration')
                        
                        // Also store in database for Stripe webhook email integration
                        fetch('/api/cart/store-assessment', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            sessionId: sessionStorage.getItem('session_id') || `session_${Date.now()}`,
                            assessmentData
                          })
                        }).then(() => {
                          console.log('📧 Assessment stored for webhook email integration');
                        }).catch(() => {
                          console.log('Database storage failed, but session storage succeeded');
                        });
                        
                        addAllToCart()
                      }}
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
                          <span>{Math.max(0, dailyTargets.protein - totalIntake.protein).toFixed(0)}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sodium:</span>
                          <span>{Math.max(0, dailyTargets.sodium - totalIntake.sodium).toFixed(0)}mg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Potassium:</span>
                          <span>{Math.max(0, dailyTargets.potassium - totalIntake.potassium).toFixed(0)}mg</span>
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
                            sodium: Math.max(0, dailyTargets.sodium - totalIntake.sodium),
                            potassium: Math.max(0, dailyTargets.potassium - totalIntake.potassium),
                            fiber: Math.max(0, dailyTargets.fiber - totalIntake.fiber),
                            protein: Math.max(0, dailyTargets.protein - totalIntake.protein)
                          }
                          
                          // No allergies - these are only suggestions
                          
                          const response = await fetch("/api/ai/generate-meals", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ deficits, allergies: [] })
                          })
                          
                          const data = await response.json()
                          if (data.meals && data.meals.length > 0) {
                            // Generate images for meals
                            const imageResponse = await fetch("/api/ai/generate-meal-images", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ meals: data.meals })
                            })
                            const mealsWithImages = await imageResponse.json()
                            setMealSuggestions(mealsWithImages.meals || data.meals)
                            
                            // Display inline instead of modal
                            const mealDisplay = document.getElementById('meal-suggestions-display')
                            if (mealDisplay) {
                              mealDisplay.scrollIntoView({ behavior: 'smooth' })
                            }
                          }
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

                    {/* Meal Suggestions Display */}
                    {mealSuggestions.length > 0 && (
                      <div id="meal-suggestions-display" className="mt-6 space-y-4">
                        <h3 className="font-semibold text-lg">Meal Suggestions</h3>
                        {mealSuggestions.map((meal, idx) => (
                          <Card key={idx} className="overflow-hidden">
                            <div className="grid md:grid-cols-2 gap-4">
                              {/* Meal Image */}
                              {meal.image_url ? (
                                <img 
                                  src={meal.image_url} 
                                  alt={meal.name}
                                  className="w-full h-48 md:h-full object-cover"
                                />
                              ) : (
                                <div className="relative h-48 md:h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                  <div className="text-center p-4">
                                    <div className="text-4xl mb-2">🍽️</div>
                                    <p className="text-sm text-gray-600">{meal.name}</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Meal Details */}
                              <CardContent className="p-4 space-y-3">
                                <h4 className="font-semibold">{meal.name}</h4>
                                <p className="text-sm text-gray-600">{meal.foods.join(", ")}</p>
                                <p className="text-xs text-gray-500">{meal.explanation}</p>
                                
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="bg-blue-50 p-1 rounded">
                                    Na: {meal.nutrients.sodium}mg
                                  </div>
                                  <div className="bg-green-50 p-1 rounded">
                                    K: {meal.nutrients.potassium}mg
                                  </div>
                                  <div className="bg-orange-50 p-1 rounded">
                                    Fiber: {meal.nutrients.fiber}g
                                  </div>
                                  <div className="bg-purple-50 p-1 rounded">
                                    Protein: {meal.nutrients.protein}g
                                  </div>
                                </div>
                              </CardContent>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
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
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Nutritional Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 3D Hydration Sphere */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-medium mb-2">Hydration Visualization</h4>
                  <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading 3D sphere...</div>}>
                    <HydrationSphere
                      waterIntake={totalIntake.water}
                      sodiumIntake={totalIntake.sodium}
                      potassiumIntake={totalIntake.potassium}
                      waterTarget={dailyTargets.water}
                      sodiumTarget={dailyTargets.sodium}
                      potassiumTarget={dailyTargets.potassium}
                    />
                  </Suspense>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div className="text-center">
                      <div className="text-pink-600">Inner Blob (ICW)</div>
                      <div>Potassium-driven</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-600">Outer Blob (ECW)</div>
                      <div>Water/Sodium-driven</div>
                    </div>
                  </div>
                </div>

                {/* Nutritional Totals */}
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
