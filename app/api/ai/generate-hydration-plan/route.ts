import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { applyThresholdRules, applyRotationRules } from "@/lib/threshold-matrix-rules"

export async function POST(request: NextRequest) {
  try {
    const { 
      deficits, 
      dailyTargets, 
      totalIntake,
      recentProducts = [],
      planDays = 1
    } = await request.json()
    
    const supabase = await createClient()
    
    // Apply threshold matrix rules to get recommended product types
    const recommendedTypes = applyThresholdRules(deficits, dailyTargets, recentProducts)
    
    // Map product recommendations to actual database items
    const drinkRecommendations = []
    
    for (const productType of recommendedTypes) {
      // Search for matching products in database
      let query = supabase
        .from('hydration_options')
        .select('*')
        .eq('category', 'drink')
      
      // Direct product name matching from threshold matrix
      if (productType.includes('Kefir')) {
        query = query.eq('name', 'Kefir (plain, 250 mL)')
      } else if (productType.includes('Celery Juice (250 mL)')) {
        query = query.eq('name', 'Celery Juice (250 mL)')
      } else if (productType.includes('SoSodium')) {
        query = query.eq('name', 'SoSodium – Celery Juice (330 mL)')
      } else if (productType.includes('Once Upon a Coconut')) {
        query = query.eq('name', 'Once Upon a Coconut (330 mL)')
      } else if (productType.includes('Coconut Water 330')) {
        query = query.eq('name', 'Coconut Water 330 mL (tetra)')
      } else if (productType.includes('Coconut Water (1 cup')) {
        query = query.eq('name', 'Coconut Water (1 cup, 250 mL)')
      } else if (productType.includes('YALA Kombucha')) {
        query = query.eq('name', 'YALA Kombucha × New Mind Chaga (250 mL)')
      } else if (productType.includes('Poppi Prebiotic Cola')) {
        query = query.eq('name', 'Poppi Prebiotic Cola (330 mL)')
      } else if (productType.includes('Rite Gut Health')) {
        query = query.eq('name', 'Rite Gut Health (1 sachet)')
      } else if (productType.includes('Rite Greens')) {
        query = query.eq('name', 'Rite Greens (1 sachet)')
      }
      
      const { data } = await query.limit(1).single()
      
      if (data) {
        // Calculate quantity based on deficit size
        let quantity = 1
        
        // Sodium deficit logic
        if (deficits.sodium > 800 && data.na_mg > 100) {
          quantity = Math.min(3, Math.ceil(deficits.sodium / (data.na_mg * 2)))
        } else if (deficits.sodium > 300 && data.na_mg > 50) {
          quantity = Math.min(2, Math.ceil(deficits.sodium / (data.na_mg * 3)))
        }
        
        // Potassium deficit logic  
        if (deficits.potassium > 800 && data.k_mg > 200) {
          quantity = Math.min(3, Math.ceil(deficits.potassium / (data.k_mg * 2)))
        } else if (deficits.potassium > 400 && data.k_mg > 100) {
          quantity = Math.min(2, Math.ceil(deficits.potassium / (data.k_mg * 3)))
        }
        
        // Water deficit logic
        if (deficits.water > 1000 && data.h2o_ml > 250) {
          quantity = Math.min(4, Math.ceil(deficits.water / (data.h2o_ml * 2)))
        }
        
        drinkRecommendations.push({
          ...data,
          quantity,
          reason: getReasonForRecommendation(productType, deficits),
          nutrients_provided: {
            water: data.h2o_ml * quantity,
            sodium: data.na_mg * quantity,
            potassium: data.k_mg * quantity,
            protein: data.protein_g * quantity,
            fiber: ((data.soluble_fiber_g || 0) + (data.insoluble_fiber_g || 0)) * quantity,
            b12: data.b12_ug * quantity,
            probiotics: data.probiotic_cfu * quantity
          }
        })
      }
    }
    
    // Multi-day plan with rotation
    if (planDays > 1) {
      const multiDayPlan = []
      multiDayPlan.push(drinkRecommendations) // Day 1
      
      for (let day = 2; day <= planDays; day++) {
        // Get products from previous days
        const previousDaysProducts = multiDayPlan.map(dayPlan => 
          dayPlan.map((p: any) => p.name)
        )
        
        // Apply rotation rules
        const rotatedProducts = applyRotationRules(
          drinkRecommendations.map(p => p.name),
          previousDaysProducts
        )
        
        // Fetch rotated products from database
        const dayPlan = []
        for (const productName of rotatedProducts) {
          const { data } = await supabase
            .from('hydration_options')
            .select('*')
            .ilike('name', `%${productName}%`)
            .limit(1)
            .single()
          
          if (data) {
            dayPlan.push({
              ...data,
              quantity: drinkRecommendations.find(r => 
                r.name.toLowerCase().includes(productName.toLowerCase())
              )?.quantity || 1
            })
          }
        }
        
        multiDayPlan.push(dayPlan)
      }
      
      return NextResponse.json({
        plan: multiDayPlan,
        totalDays: planDays,
        deficitsCovered: calculateDeficitCoverage(drinkRecommendations, deficits)
      })
    }
    
    return NextResponse.json({
      drinks: drinkRecommendations,
      deficitsCovered: calculateDeficitCoverage(drinkRecommendations, deficits)
    })
    
  } catch (error) {
    console.error("Error generating hydration plan:", error)
    return NextResponse.json({ drinks: [] })
  }
}

function getReasonForRecommendation(productType: string, deficits: any): string {
  const reasons: Record<string, string> = {
    'kefir': `B12 + probiotics synergy (${Math.round(deficits.b12 || 0)}µg B12 deficit)`,
    'celery juice': `High sodium content (${Math.round(deficits.sodium || 0)}mg deficit)`,
    'coconut water': `Natural potassium source (${Math.round(deficits.potassium || 0)}mg deficit)`,
    'kombucha': `Probiotics + hydration (${Math.round(deficits.water || 0)}ml water deficit)`,
    'prebiotic cola': `Fiber support (${Math.round(deficits.fiber || 0)}g fiber deficit)`,
    'mineral water': `Electrolyte balance`,
    'broth': `Sodium + warming hydration`
  }
  
  return reasons[productType.toLowerCase()] || 'Supports hydration goals'
}

function calculateDeficitCoverage(recommendations: any[], deficits: any): any {
  const coverage: any = {}
  
  for (const rec of recommendations) {
    if (rec.nutrients_provided) {
      for (const [nutrient, amount] of Object.entries(rec.nutrients_provided)) {
        if (!coverage[nutrient]) coverage[nutrient] = 0
        coverage[nutrient] += amount as number
      }
    }
  }
  
  // Calculate percentage covered
  const percentCovered: any = {}
  for (const [nutrient, deficit] of Object.entries(deficits)) {
    if (coverage[nutrient] && deficit) {
      percentCovered[nutrient] = Math.min(100, (coverage[nutrient] / (deficit as number)) * 100)
    }
  }
  
  return {
    absolute: coverage,
    percentage: percentCovered
  }
}
