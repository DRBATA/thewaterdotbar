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
}

export default async function HomePage() {
  const supabase = await createClient()

  const { data: drinksData, error: drinksError } = await supabase.from("products").select<"*", Product>("*")
  const { data: wellnessData, error: wellnessError } = await supabase.from("experiences").select<"*", Experience>("*")

  if (drinksError) {
    console.error("Error fetching drinks:", drinksError.message)
  }
  if (wellnessError) {
    console.error("Error fetching wellness experiences:", wellnessError.message)
  }

  const drinks: MenuItem[] = (drinksData || []).map((d: Product) => ({
    id: d.id,
    name: d.name,
    description: d.description || "No description available.",
    price: d.price || 0,
    image: d.image_url || "/refreshing-summer-drink.png",
  }))

  const wellnessExperiences: MenuItem[] = (wellnessData || []).map((w: Experience) => ({
    id: w.id,
    name: w.name,
    description: w.description || "No description available.",
    price: w.price || 0,
    image: w.image_url || "/holistic-wellness.png",
  }))

  return (
    <div className="min-h-screen text-stone-800">

      <MenuDisplay initialDrinks={drinks} initialWellnessExperiences={wellnessExperiences} />
    </div>
  )
}
