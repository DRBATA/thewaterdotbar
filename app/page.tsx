import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

import { MenuDisplay } from "@/components/menu-display" // We will create this next
import { UnifiedChatAvatar } from "@/components/UnifiedChatAvatar"
import { HydrationAssessmentButton } from "@/components/hydration-assessment-button"

// Define types for fetched data
interface Product {
  id: string
  name: string
  description: string | null
  price: number | null
  image_url: string | null
  category: string | null
  tags: string[] | null
  created_at: string | null
}
interface Experience {
  id: string
  name: string
  description: string | null
  price: number | null
  image_url: string | null
  category: string | null
  duration_minutes: number | null
  tags: string[] | null
  created_at: string | null
}

// Define the MenuItem type expected by client components
export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  faqs?: any // FAQ data from Supabase JSONB column
  // Venue availability information
  venues?: {
    id: string
    name: string
    address: string
    lat?: number // Latitude coordinate
    lng?: number // Longitude coordinate
    distance?: number // km away - will be calculated client-side
    qty_on_hand: number
  }[]
}

// Distance calculation moved to client-side in location-provider.tsx

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch all products with venue stock information, regardless of is_active flag
  const { data: drinksData, error: drinksError } = await supabase
    .from("products")
    .select(`
      *,
      venue_stock(
        qty_on_hand,
        venue:venue_id(id, name, address, lat, lng, from_date, to_date)
      )
    `)
    
  // Skip wellness experiences for now - no venue_stock relationship
  const wellnessData: any[] = []
  const wellnessError = null

  if (drinksError) {
    console.error("Error fetching drinks:", drinksError)
  }
  if (wellnessError) {
    console.error("Error fetching wellness experiences:", wellnessError)
  }

  const currentDate = new Date();
  const currentDateStr = currentDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

  // Transform product data to include venue information
  const drinks: MenuItem[] = (drinksData || []).map((d: any) => {
    // Extract and process venue information
    const venues = d.venue_stock
      ?.filter((vs: any) => {
        // Only include venues that:
        // 1. Have stock above threshold (any stock > 0)
        // 2. Have valid venue data
        // 3. Are currently active (today falls between from_date and to_date or to_date is null)
        return (
          vs.qty_on_hand > 0 && 
          vs.venue && 
          (!vs.venue.from_date || vs.venue.from_date <= currentDateStr) &&
          (!vs.venue.to_date || vs.venue.to_date >= currentDateStr)
        );
      })
      ?.map((vs: any) => ({
        id: vs.venue.id,
        name: vs.venue.name,
        address: vs.venue.address,
        lat: vs.venue.lat,
        lng: vs.venue.lng,
        qty_on_hand: vs.qty_on_hand
      })) || [];
      
    return {
      id: d.id,
      name: d.name,
      description: d.description || "No description available.",
      price: d.price_aed || 0,
      image: d.image_url || "/refreshing-summer-drink.png",
      faqs: d.faqs, // Include FAQ data from Supabase
      venues: venues
    };
  })

  // Transform wellness experience data to include venue information
  const wellnessExperiences: MenuItem[] = (wellnessData || []).map((w: any) => {
    // Extract and process venue information
    const venues = w.venue_stock
      ?.filter((vs: any) => {
        // Only include venues that:
        // 1. Have stock above threshold (any stock > 0)
        // 2. Have valid venue data
        // 3. Are currently active (today falls between from_date and to_date or to_date is null)
        return (
          vs.qty_on_hand > 0 && 
          vs.venue && 
          (!vs.venue.from_date || vs.venue.from_date <= currentDateStr) &&
          (!vs.venue.to_date || vs.venue.to_date >= currentDateStr)
        );
      })
      ?.map((vs: any) => ({
        id: vs.venue.id,
        name: vs.venue.name,
        address: vs.venue.address,
        lat: vs.venue.lat,
        lng: vs.venue.lng,
        qty_on_hand: vs.qty_on_hand
      })) || [];
      
    return {
      id: w.id,
      name: w.name,
      description: w.description || "No description available.",
      price: w.price || 0,
      image: w.image_url || "/holistic-wellness.png",
      faqs: w.faqs, // Include FAQ data from Supabase
      venues: venues
    };
  })

  // Only include products that have at least one active venue with stock
  const availableDrinks = drinks.filter(item => item.venues && item.venues.length > 0);
  
  // Filter experiences - since they don't have venue_stock entries, this will be an empty array
  const availableExperiences = wellnessExperiences.filter(item => item.venues && item.venues.length > 0);
  
  return (
    <div className="min-h-screen text-stone-800">
      <MenuDisplay 
        initialDrinks={availableDrinks} 
        initialWellnessExperiences={availableExperiences} 
      />
      <HydrationAssessmentButton />
      <UnifiedChatAvatar />
    </div>
  )
}
