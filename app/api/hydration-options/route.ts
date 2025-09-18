import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get all drinks from hydration_options table
    const { data: drinks, error } = await supabase
      .from("hydration_options")
      .select("*")
      .order("name")
    
    if (error) {
      console.error("Error fetching drinks:", error)
      return NextResponse.json({ drinks: [] })
    }
    
    return NextResponse.json({ drinks: drinks || [] })
  } catch (error) {
    console.error("Error in hydration-options API:", error)
    return NextResponse.json({ drinks: [] })
  }
}
