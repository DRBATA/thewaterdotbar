import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface BodyProfile {
  weight: number
  leanBodyMass: number
  icwLbmRatio: number
  ecwTbwRatio: number
}

interface CurrentIntake {
  water: number
  sodium: number
  potassium: number
  magnesium: number
  calcium: number
  fiber: number
  protein: number
}

export async function POST(request: NextRequest) {
  try {
    const { profile, activityLevel, sweatLoss, currentIntake, planDuration } = await request.json()
    
    const supabase = await createClient()
    
    // Calculate daily targets based on profile
    const targets = calculateTargets(profile, activityLevel, sweatLoss)
    
    // Calculate deficits
    const deficits = {
      water: Math.max(0, targets.water - currentIntake.water),
      sodium: Math.max(0, targets.sodium - currentIntake.sodium),
      potassium: Math.max(0, targets.potassium - currentIntake.potassium),
      magnesium: Math.max(0, targets.magnesium - currentIntake.magnesium),
      calcium: Math.max(0, targets.calcium - currentIntake.calcium),
      fiber: Math.max(0, targets.fiber - currentIntake.fiber),
      protein: Math.max(0, targets.protein - currentIntake.protein),
    }
    
    // Call AI to generate drink recommendations for 50% of deficits
    const drinkResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/generate-drinks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deficits })
    })
    
    const drinkData = await drinkResponse.json()
    
    return NextResponse.json({
      recommendations: drinkData.drinks || []
    })
    
    // FOCUSED PRODUCT SCORING ALGORITHM
    const scoredProducts = products.map(product => {
      let score = 0
      const contributions = {}
      
      // Priority 1: B-Vitamins (Rite Greens for vitamins/minerals)
      if (product.vitamin_b6_mg || product.vitamin_b12_mcg || product.iron_mg || product.zinc_mg) {
        score += 2.0  // High priority for Rite Greens
        contributions.vitamins = true
      }
      
      // Priority 2: Fiber for gut health - if <15g, recommend gut health sachet
      if (deficits.fiber > 0 && (product.soluble_fiber_g || product.fiber_g)) {
        const fiberAmount = product.soluble_fiber_g || product.fiber_g || 0
        const contribution = Math.min(fiberAmount, deficits.fiber)
        // Boost score for products with high soluble fiber (gut health sachets)
        const fiberBonus = product.soluble_fiber_g ? 2.0 : 1.0
        score += (contribution / deficits.fiber) * fiberBonus
        contributions.fiber = contribution
      }
      
      // Priority 3: Electrolyte balance
      // Recommend Coconut products when potassium deficit exists AND product has high K+
      if (deficits.potassium > 0 && product.potassium_mg) {
        // Only score highly if this product actually has significant potassium (like coconut water)
        if (product.potassium_mg > 400) {
          const contribution = Math.min(product.potassium_mg, deficits.potassium)
          score += (contribution / deficits.potassium) * 1.0
          contributions.potassium = contribution
        }
      }
      
      // Recommend Celery products when sodium deficit exists AND product has high Na+
      if (deficits.sodium > 0 && product.sodium_mg) {
        // Only score highly if this product actually has significant sodium (like celery juice)
        if (product.sodium_mg > 150) {
          const contribution = Math.min(product.sodium_mg, deficits.sodium)
          score += (contribution / deficits.sodium) * 0.9
          contributions.sodium = contribution
        }
      }
      
      // Priority 4: Protein (any protein-rich product)
      if (deficits.protein > 0 && product.protein_g && product.protein_g > 5) {
        const contribution = Math.min(product.protein_g, deficits.protein)
        score += (contribution / deficits.protein) * 0.8
        contributions.protein = contribution
      }
      
      // Priority 5: Plain water (Perrier) for hydration-only needs
      if (deficits.water > 0 && product.water_content_ml) {
        const contribution = Math.min(product.water_content_ml, deficits.water)
        // Boost score for plain water products when only hydration is needed
        const isPlainWater = !product.sodium_mg && !product.potassium_mg && !product.fiber_g
        const waterBonus = isPlainWater ? 0.8 : 0.5
        score += (contribution / deficits.water) * waterBonus
        contributions.water = contribution
      }
      
      // Priority 6: Polyphenols (kombucha) - low priority since coffee/tea already provide
      if (product.polyphenols_mg && product.polyphenols_mg > 100) {
        score += 0.2  // Low priority bonus for polyphenol-rich products
        contributions.polyphenols = true
      }
      
      return {
        ...product,
        score,
        contributions,
      }
    })
    
    // Sort by score and select top items
    scoredProducts.sort((a, b) => b.score - a.score)
    
    // Greedy selection: pick items that best close gaps
    const recommendations = []
    const remainingDeficits = { ...deficits }
    const maxItems = 8 // Reasonable cart size
    
    for (const product of scoredProducts) {
      if (recommendations.length >= maxItems) break
      
      // Check if this product helps with remaining deficits
      let helps = false
      if (product.water_content_ml && remainingDeficits.water > 0) helps = true
      if (product.sodium_mg && remainingDeficits.sodium > 0) helps = true
      if (product.potassium_mg && remainingDeficits.potassium > 0) helps = true
      if (product.fiber_g && remainingDeficits.fiber > 0) helps = true
      if (product.protein_g && remainingDeficits.protein > 0) helps = true
      
      if (helps) {
        // Calculate quantity needed
        let quantity = 1
        
        // For water-based products, calculate based on water deficit
        if (product.water_content_ml && remainingDeficits.water > 0) {
          quantity = Math.min(3, Math.ceil(remainingDeficits.water / product.water_content_ml))
        }
        
        recommendations.push({
          id: product.id,
          name: product.name,
          quantity,
          sodium_mg: product.sodium_mg,
          potassium_mg: product.potassium_mg,
          magnesium_mg: product.magnesium_mg,
          fiber_g: product.fiber_g,
          protein_g: product.protein_g,
          water_content_ml: product.water_content_ml,
          price_aed: product.price_aed,
        })
        
        // Update remaining deficits
        if (product.water_content_ml) remainingDeficits.water -= product.water_content_ml * quantity
        if (product.sodium_mg) remainingDeficits.sodium -= product.sodium_mg * quantity
        if (product.potassium_mg) remainingDeficits.potassium -= product.potassium_mg * quantity
        if (product.fiber_g) remainingDeficits.fiber -= product.fiber_g * quantity
        if (product.protein_g) remainingDeficits.protein -= product.protein_g * quantity
      }
    }
    
    return NextResponse.json({ recommendations })
    
  } catch (error) {
    console.error("Error calculating recommendations:", error)
    return NextResponse.json({ recommendations: [] })
  }
}

function calculateTargets(profile: BodyProfile, activityLevel: string, sweatLoss: number) {
  const lbm = profile.leanBodyMass
  
  // SIMPLIFIED FOCUS TARGETS:
  
  // 1. HYDRATION - Base water: 33ml/kg LBM + sweat replacement
  const waterTotal = (33 * lbm + sweatLoss * 1000)
  
  // 2. ELECTROLYTES (key for hydration balance)
  // Potassium: 45mg/kg LBM base
  let potassiumBase = 45 * lbm
  if (profile.icwLbmRatio < 0.43) {
    potassiumBase *= 1.2  // ICW boost for cellular hydration
  }
  const potassiumTotal = potassiumBase + (195 * sweatLoss)
  
  // Sodium: Activity dependent
  let sodiumBase = (activityLevel === "desk" ? 35 : 50) * lbm
  if (profile.ecwTbwRatio > 0.4) {
    sodiumBase *= 0.8  // Reduce for puffiness
  }
  const sodiumTotal = sodiumBase + (920 * sweatLoss)
  
  // 3. PROTEIN - Critical for recovery
  const proteinTotal = activityLevel === "training" ? 1.5 * profile.weight : 1.2 * profile.weight
  
  // 4. FIBER - Gut health focus (Rite Greens target)
  const fiberTotal = 15  // 15g fiber target for gut health
  
  // 5. B-VITAMINS via Rite Greens (reverse calculated daily needs)
  // Based on Rite Greens providing: B6=1.54mg (110% RNI), B9=240mcg (120% RNI), B12=0.8mcg (53% RNI)
  const vitaminB6Total = 1.4  // Daily RNI
  const folateTotal = 200  // Daily RNI in mcg
  const vitaminB12Total = 1.5  // Daily RNI in mcg
  
  return {
    water: waterTotal,
    sodium: sodiumTotal,
    potassium: potassiumTotal,
    protein: proteinTotal,
    fiber: fiberTotal,
    // Skip calcium, magnesium - too complex for quick assessment
    // B-vitamins tracked but not used in scoring (Rite Greens handles this)
  }
}
