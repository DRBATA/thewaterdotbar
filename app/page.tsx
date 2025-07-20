import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

import { MenuDisplay } from "@/components/menu-display" // We will create this next

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
  // Venue availability information
  venues?: {
    id: string
    name: string
    address: string
    distance?: number // km away
    qty_on_hand: number
  }[]
}

// Simple distance calculation function (Haversine formula)
function calculateDistance(lat1?: number, lon1?: number, lat2?: number, lon2?: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999; // Default to far away if coordinates missing
  
  // Convert degrees to radians
  const toRad = (x: number) => x * Math.PI / 180;
  const R = 6371; // Radius of the earth in km
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  
  return distance;
}

export default async function HomePage() {
  const supabase = await createClient()
  
  // Get user location (in production this would come from browser geolocation)
  // For demo purposes we'll use a default Dubai location
  const userLat = 25.2048; // Dubai default latitude
  const userLng = 55.2708; // Dubai default longitude

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
    
  // Fetch all wellness experiences with venue stock information, regardless of is_active flag
  const { data: wellnessData, error: wellnessError } = await supabase
    .from("experiences")
    .select(`
      *,
      venue_stock(
        qty_on_hand,
        venue:venue_id(id, name, address, lat, lng, from_date, to_date)
      )
    `)

  if (drinksError) {
    console.error("Error fetching drinks:", drinksError.message)
  }
  if (wellnessError) {
    console.error("Error fetching wellness experiences:", wellnessError.message)
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
        distance: calculateDistance(userLat, userLng, vs.venue.lat, vs.venue.lng),
        qty_on_hand: vs.qty_on_hand
      }))
      // Sort PURELY by distance - stock quantity doesn't affect ranking
      ?.sort((a: any, b: any) => a.distance - b.distance)
      // Limit to top 3 closest venues
      ?.slice(0, 3) || [];
      
    return {
      id: d.id,
      name: d.name,
      description: d.description || "No description available.",
      price: d.price || 0,
      image: d.image_url || "/refreshing-summer-drink.png",
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
        distance: calculateDistance(userLat, userLng, vs.venue.lat, vs.venue.lng),
        qty_on_hand: vs.qty_on_hand
      }))
      // Sort PURELY by distance - stock quantity doesn't affect ranking
      ?.sort((a: any, b: any) => a.distance - b.distance)
      // Limit to top 3 closest venues
      ?.slice(0, 3) || [];
      
    return {
      id: w.id,
      name: w.name,
      description: w.description || "No description available.",
      price: w.price || 0,
      image: w.image_url || "/holistic-wellness.png",
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
    </div>
  )
}
