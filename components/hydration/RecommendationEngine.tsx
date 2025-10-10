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
      const drinks = drinksData.drinks || []
      setRecommendations(drinks)
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
          
          // Download OpenAI images and convert to base64
          const mealsWithBase64Images = await Promise.all(
            mealsData.meals.map(async (meal: any, idx: number) => {
              const imageUrl = mealImagesData.meals?.[idx]?.image_url
              
              if (imageUrl) {
                try {
                  // Download image from OpenAI
                  const imageResponse = await fetch(imageUrl)
                  const blob = await imageResponse.blob()
                  
                  // Convert to base64
                  const reader = new FileReader()
                  const base64Promise = new Promise<string>((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string)
                    reader.readAsDataURL(blob)
                  })
                  const imageData = await base64Promise
                  
                  return {
                    ...meal,
                    imageData, // Base64 for Supabase upload
                    image_type: mealImagesData.meals?.[idx]?.image_type
                  }
                } catch (error) {
                  console.error('Failed to download meal image:', error)
                  return {
                    ...meal,
                    image_url: imageUrl, // Fallback to URL
                    image_type: mealImagesData.meals?.[idx]?.image_type
                  }
                }
              }
              
              return meal
            })
          )
          
          setMealCards(mealsWithBase64Images)
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
  
  // Auto-save OUTPUT to sessionStorage when recommendations are generated
  useEffect(() => {
    if (recommendations.length > 0 && hasGenerated) {
      const outputRecommendations = {
        deficits,
        recommended_drinks: recommendations.map(drink => ({
          name: drink.name,
          quantity: drink.quantity,
          nutrients_provided: drink.nutrients || {},
          reason: drink.reason || ''
        })),
        recommended_meals: mealCards.map(meal => ({
          name: meal.name,
          description: meal.explanation || '',
          imageData: (meal as any).imageData || '',
          image_type: meal.image_type || '',
          nutrients_provided: meal.nutrients || {},
          foods: meal.foods || [],
          items: meal.items || []
        }))
      }
      
      sessionStorage.setItem('hydrationOutputRecommendations', JSON.stringify(outputRecommendations))
      console.log('💾 OUTPUT recommendations auto-saved to sessionStorage')
    }
  }, [recommendations, mealCards, deficits, hasGenerated])

  // Retry mechanism
  const retryRecommendations = () => {
    generateRecommendations()
  }

  const addProduct = async (productId: string, quantity: number, productName: string, reason?: string, nutrients?: any) => {
    try {
      const payload: any = { itemId: productId, qty: quantity };
      
      // Add AI recommendation context if available
      if (reason || nutrients) {
        payload.ai_recommendation = {
          reason: reason || '',
          nutrients_provided: nutrients || {}
        };
      }
      
      // Include assessment data from sessionStorage (for first item)
      // This ensures assessment is saved to cart_headers when first item is added
      if (typeof window !== 'undefined') {
        const inputContext = sessionStorage.getItem('hydrationInputContext');
        const outputRecommendations = sessionStorage.getItem('hydrationOutputRecommendations');
        
        if (inputContext || outputRecommendations) {
          payload.assessmentData = {
            input: inputContext ? JSON.parse(inputContext) : null,
            output: outputRecommendations ? JSON.parse(outputRecommendations) : null
          };
          console.log('📦 Including assessment data with cart item');
        }
      }
      
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
      // Get assessment data once (will be included with first item only)
      let assessmentDataToSend = null;
      if (typeof window !== 'undefined') {
        const inputContext = sessionStorage.getItem('hydrationInputContext');
        const outputRecommendations = sessionStorage.getItem('hydrationOutputRecommendations');
        
        if (inputContext || outputRecommendations) {
          assessmentDataToSend = {
            input: inputContext ? JSON.parse(inputContext) : null,
            output: outputRecommendations ? JSON.parse(outputRecommendations) : null
          };
        }
      }
      
      // Add all products to cart with AI recommendation context
      for (let i = 0; i < recommendations.length; i++) {
        const product = recommendations[i];
        const payload: any = {
          itemId: product.id,
          qty: product.quantity
        };
        
        // Include AI recommendation data
        if (product.reason || product.nutrients) {
          payload.ai_recommendation = {
            reason: product.reason || '',
            nutrients_provided: product.nutrients || {}
          };
        }
        
        // Include assessment data ONLY with first item
        if (i === 0 && assessmentDataToSend) {
          payload.assessmentData = assessmentDataToSend;
          console.log('📦 Including assessment data with first item of bulk add');
        }
        
        await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      // Store OUTPUT recommendations to sessionStorage (for email construction)
      const outputRecommendations = {
        deficits,
        recommended_drinks: recommendations.map(drink => ({
          name: drink.name,
          quantity: drink.quantity,
          nutrients_provided: drink.nutrients || {},
          reason: drink.reason || ''
        })),
        recommended_meals: mealCards.map(meal => ({
          name: meal.name,
          description: meal.explanation || '',
          imageData: (meal as any).imageData || '', // Base64 for Supabase upload
          image_type: meal.image_type || '',
          nutrients_provided: meal.nutrients || {},
          foods: meal.foods || [],
          items: meal.items || []
        }))
      }
      
      sessionStorage.setItem('hydrationOutputRecommendations', JSON.stringify(outputRecommendations))
      console.log('💾 OUTPUT recommendations saved to sessionStorage (for email)')

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
      {/* Generate Button - Show when no results or user wants to regenerate */}
      {!isLoading && (
        <div className="flex justify-center">
          <Button
            onClick={() => {
              generateRecommendations()
            }}
            disabled={!drinkInputs || !mealInputs}
            size="lg"
            className="min-w-[200px]"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {hasGenerated ? "Regenerate AI Plan" : "Generate AI Plan"}
          </Button>
        </div>
      )}

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
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-1">💧 Your Hydration Gap</h3>
            <p className="text-sm text-gray-600">
              You need <strong>{(deficits as any)?.water_ml || 0}ml more water</strong> based on your activity.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ✨ These are <strong>options</strong> - pick one or combine them to meet your needs
            </p>
          </div>
          <h3 className="text-lg font-semibold mb-3">Choose Your Hydration</h3>
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
                    onClick={() => addProduct(product.id, product.quantity, product.name, product.reason, product.nutrients)}
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
          <div className="space-y-2 mt-4">
            <Button
              onClick={addAllToCart}
              disabled={isProcessing || recommendations.length === 0}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShoppingCart className="mr-2 h-4 w-4" />
              )}
              Add All Options to Cart ({recommendations.length} items)
            </Button>
            <p className="text-xs text-center text-gray-500">
              Or add individual items above using the + ADD buttons
            </p>
          </div>
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