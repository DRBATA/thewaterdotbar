'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Plus, X, RefreshCw, ShoppingCart } from 'lucide-react'
import { useHydrationContext } from '@/contexts'
import { useToast } from '@/hooks/use-toast'
import { splitDeficitsForAI } from '@/utils/recommendationSplitter'

interface Product {
  id: string
  name: string
  quantity: number
  price_aed?: number
  nutrients?: any
  reason?: string
  image_url?: string
}

interface MealCard {
  name: string
  foods?: string[]
  items?: Array<{ name: string; grams?: number; ml?: number }>
  nutrients?: any
  explanation?: string
  image_url?: string
  image_type?: string
  wild_card?: boolean
}

interface RecommendationEngineProps {
  venueId?: string
}

export function RecommendationEngine({ venueId }: RecommendationEngineProps) {
  const { profile, totalIntake, deficits, meals } = useHydrationContext()
  const { toast } = useToast()
  
  // Loading states
  const [isLoadingDrinks, setIsLoadingDrinks] = useState(false)
  const [isLoadingMeals, setIsLoadingMeals] = useState(false)
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Error states
  const [drinksError, setDrinksError] = useState<string | null>(null)
  const [mealsError, setMealsError] = useState<string | null>(null)
  
  // Results state
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [mealCards, setMealCards] = useState<MealCard[]>([])
  
  // Input payloads
  const [drinkInputs, setDrinkInputs] = useState<any | null>(null)
  const [mealInputs, setMealInputs] = useState<any | null>(null)
  
  // Generation control
  const [hasGenerated, setHasGenerated] = useState(false)
  
  // Auto-prepare inputs when component mounts (AI Plan tab opens)
  useEffect(() => {
    if (!deficits || !totalIntake) return
    
    try {
      // Parse allergies from comma-separated string
      const allergiesList = (meals?.allergies || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)

      // Get previous meals to avoid repetition
      const previousMeals = [
        meals?.breakfast,
        meals?.lunch, 
        meals?.dinner,
        meals?.snacks,
      ].filter(Boolean) as string[]

      // Estimate caffeine drink count (80mg = 1 drink)
      const caffeineCount = Math.max(0, Math.round(((totalIntake as any).caffeine || 0) / 80))

      // Split deficits using our clean splitter
      const { drinksPayload, mealsPayload } = splitDeficitsForAI(
        deficits as any,
        totalIntake as any,
        {
          sweatLossL: (profile as any)?.sweatLoss ?? 0,
          caffeineCount,
          daysRequested: 1,
          allergies: allergiesList,
          previousMeals,
          sessionDrinks: [],
        }
      )

      // Add venueId to drinks payload for stock filtering
      setDrinkInputs({ ...drinksPayload, venueId })
      setMealInputs(mealsPayload)
      
    } catch (err) {
      console.error('Failed to prepare AI inputs:', err)
    }
  }, [deficits, totalIntake, meals?.allergies, meals?.breakfast, meals?.lunch, meals?.dinner, meals?.snacks, venueId])

  // Generate recommendations using our new APIs
  const generateRecommendations = async () => {
    if (!drinkInputs || !mealInputs) {
      toast({
        title: "Please complete profile and meals",
        description: "Fill in your profile and meal information first",
      })
      return
    }
    
    // Reset errors
    setDrinksError(null)
    setMealsError(null)
    setHasGenerated(true)
    
    try {
      // Step 1: Call generate-drinks API
      setIsLoadingDrinks(true)
      const drinksResponse = await fetch('/api/ai/generate-drinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(drinkInputs)
      })
      
      if (!drinksResponse.ok) throw new Error('Drinks API failed')
      const drinksData = await drinksResponse.json()
      setRecommendations(drinksData.drinks || [])
      setIsLoadingDrinks(false)
      
      // Step 2: Call generate-meals API  
      setIsLoadingMeals(true)
      const mealsResponse = await fetch('/api/ai/generate-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealInputs)
      })
      
      if (!mealsResponse.ok) throw new Error('Meals API failed')
      const mealsData = await mealsResponse.json()
      setIsLoadingMeals(false)
      
      // Step 3: Call generate-meal-images API with meal results
      if (mealsData.meals && mealsData.meals.length > 0) {
        setIsLoadingImages(true)
        
        // Transform new format to old format for image API
        const mealsForImages = mealsData.meals.map((meal: any) => ({
          name: meal.name,
          foods: meal.items 
            ? meal.items.map((item: any) => item.name)
            : meal.foods || [],
          nutrients: meal.nutrients,
          explanation: meal.explanation
        }))
        
        const mealImagesResponse = await fetch('/api/ai/generate-meal-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meals: mealsForImages,
            allergies: mealInputs.allergies || [],
            previousMeals: mealInputs.previousMeals || []
          })
        })
        
        if (mealImagesResponse.ok) {
          const mealImagesData = await mealImagesResponse.json()
          // Merge image data with original meal data
          const mealsWithImages = mealsData.meals.map((meal: any, idx: number) => ({
            ...meal,
            image_url: mealImagesData.meals?.[idx]?.image_url,
            image_type: mealImagesData.meals?.[idx]?.image_type
          }))
          setMealCards(mealsWithImages)
        } else {
          // If images fail, still show meals without images
          setMealCards(mealsData.meals || [])
        }
        setIsLoadingImages(false)
      }
      
    } catch (error) {
      console.error('Failed to generate recommendations:', error)
      
      if (isLoadingDrinks) {
        setDrinksError('Failed to load drink recommendations')
        setIsLoadingDrinks(false)
      }
      if (isLoadingMeals) {
        setMealsError('Failed to load meal recommendations')
        setIsLoadingMeals(false)
      }
      if (isLoadingImages) {
        setIsLoadingImages(false)
      }
      
      toast({
        title: "Error",
        description: "Failed to generate recommendations. Try refreshing.",
        variant: "destructive",
      })
    }
  }

  // NO AUTO-GENERATION - User must click button
  useEffect(() => {
    // Only prepare inputs, don't generate
    // User will explicitly click to generate
  }, [drinkInputs, mealInputs])

  // Retry mechanism
  const retryRecommendations = () => {
    generateRecommendations()
  }

  const addProduct = async (productId: string, quantity: number, productName: string) => {
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: productId, qty: quantity })
      })
      
      if (response.ok) {
        window.dispatchEvent(new Event('cart-updated'))
        toast({
          title: "Added to Cart",
          description: `${productName} (${quantity}x)`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to cart",
        variant: "destructive",
      })
    }
  }

  // Remove product and add replacement
  const removeAndReplace = async (productId: string) => {
    // Remove from current recommendations
    setRecommendations(prev => prev.filter(p => p.id !== productId))
    
    // Could trigger a new recommendation here
    toast({
      title: "Removed",
      description: "Product removed from recommendations",
    })
  }

  // Add all drinks to cart
  const addAllToCart = async () => {
    setIsProcessing(true)
    
    try {
      // Add all products to cart
      for (const product of recommendations) {
        await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: product.id, qty: product.quantity })
        })
      }

      // Store assessment data for success page
      await fetch('/api/cart/store-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: 'current-session',
          assessmentData: {
            profile,
            totalIntake,
            deficits,
            recommendedDrinks: recommendations,
            recommendedMeals: mealCards,
            dailyTargets: profile.targets
          }
        })
      })

      // Trigger cart refresh
      window.dispatchEvent(new Event('cart-updated'))
      setTimeout(() => {
        window.dispatchEvent(new Event('cart-updated'))
      }, 100)

      toast({
        title: "Success!",
        description: `Added ${recommendations.length} items to cart`,
      })

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

  const isLoading = isLoadingDrinks || isLoadingMeals || isLoadingImages
  const hasErrors = drinksError || mealsError

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
     
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          <div className="text-sm text-muted-foreground">
            {isLoadingDrinks && "Generating drink recommendations..."}
            {isLoadingMeals && "Generating meal suggestions..."}
            {isLoadingImages && "Creating meal images..."}
          </div>
        </div>
      )}

      {/* Error State with Retry */}
      {hasErrors && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-800">Failed to load recommendations</h4>
              <p className="text-sm text-red-600 mt-1">
                {drinksError || mealsError}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={retryRecommendations}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Drinks Section */}
      {recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Recommended Drinks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((product) => (
              <Card key={product.id} className="w-full overflow-hidden hover:shadow-lg transition-shadow">
                {product.image_url && (
                  <div className="relative w-full h-40 bg-gray-100">
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-base">{product.name}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAndReplace(product.id)}
                      className="h-6 w-6 p-0 ml-2 flex-shrink-0 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {product.reason && (
                    <div className="bg-blue-50 border-l-2 border-blue-400 p-2 mb-3">
                      <p className="text-xs text-blue-700">
                        {product.reason}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground mb-3">
                    Qty: {product.quantity}
                  </p>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addProduct(product.id, product.quantity, product.name)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    ADD
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add All Drinks Button */}
          <Button
            onClick={addAllToCart}
            disabled={isProcessing || recommendations.length === 0}
            className="w-full mt-4"
            size="lg"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="mr-2 h-4 w-4" />
            )}
            Add All Drinks to Cart ({recommendations.length} items)
          </Button>
        </div>
      )}

      {/* Meals Section */}
      {mealCards.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Recommended Meals</h3>
          <div className="grid grid-cols-1 gap-4">
            {mealCards.map((meal, index) => (
              <Card key={index} className="overflow-hidden w-full">
                {meal.image_url && (
                  <div className="relative w-full h-48 sm:h-56 overflow-hidden">
                    <img 
                      src={meal.image_url} 
                      alt={meal.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 line-clamp-1">
                    {meal.name}
                    {meal.wild_card && <span className="ml-2 text-xs text-purple-600">(Creative)</span>}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {meal.items 
                      ? meal.items.map(item => 
                          `${item.name}${item.grams ? ` (${item.grams}g)` : ''}${item.ml ? ` (${item.ml}ml)` : ''}`
                        ).join(', ')
                      : meal.foods?.join(', ') || ''
                    }
                  </p>
                  {meal.explanation && (
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {meal.explanation}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !hasErrors && recommendations.length === 0 && mealCards.length === 0 && (
        <div className="text-center p-8">
          <p className="text-muted-foreground">
            Complete your profile and meal information to get personalized recommendations.
          </p>
        </div>
      )}
    </div>
  )
}