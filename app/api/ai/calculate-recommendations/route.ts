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
    
    // Get products with nutritional data for AI-based recommendations
    // Filter by actual venue stock (only items with qty_on_hand > 0)
    const { data: products } = await supabase
      .from("products")
      .select(`
        *,
        venue_stock!inner(qty_on_hand)
      `)
      .not("volume_ml", "is", null)
      .gt("venue_stock.qty_on_hand", 0)
      .limit(50)
    
    if (!products || products.length === 0) {
      return NextResponse.json({ recommendations: [] })
    }
    
    // Simple scoring algorithm for now (can be replaced with AI call later)
    const scoredProducts = products.map(product => {
      let score = 0
      
      // Score based on water content
      if (product.water_content_ml && deficits.water > 0) {
        score += (product.water_content_ml / 500) * 10 // Normalize to 500ml
      }
      
      // Score based on sodium
      if (product.sodium_mg && deficits.sodium > 0) {
        score += Math.min(product.sodium_mg / deficits.sodium, 1) * 20
      }
      
      // Score based on potassium
      if (product.potassium_mg && deficits.potassium > 0) {
        score += Math.min(product.potassium_mg / deficits.potassium, 1) * 20
      }
      
      // Score based on fiber
      if (product.fiber_g && deficits.fiber > 0) {
        score += Math.min(product.fiber_g / deficits.fiber, 1) * 15
      }
      
      // Score based on protein
      if (product.protein_g && deficits.protein > 0) {
        score += Math.min(product.protein_g / deficits.protein, 1) * 15
      }
      
      return { ...product, score }
    })
    
    // Sort by score and select top items
    scoredProducts.sort((a, b) => b.score - a.score)
    
    // Select top 5 products with quantities
    const recommendations = scoredProducts.slice(0, 5).map(product => {
      let quantity = 1
      
      // Calculate quantity based on water deficit
      if (product.water_content_ml && deficits.water > 0) {
        quantity = Math.min(3, Math.ceil(deficits.water / product.water_content_ml))
      }
      
      return {
        id: product.id,
        name: product.name,
        quantity,
        sodium_mg: product.sodium_mg,
        potassium_mg: product.potassium_mg,
        fiber_g: product.fiber_g,
        protein_g: product.protein_g,
        water_content_ml: product.water_content_ml,
        price_aed: product.price_aed,
      }
    })
    
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
