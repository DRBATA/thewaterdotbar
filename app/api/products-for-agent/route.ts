import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Use the EXACT same query as the working main page
    const { data: drinksData, error: drinksError } = await supabase
      .from("products")
      .select(`
        *,
        venue_stock(
          qty_on_hand,
          venue:venue_id(id, name, address, lat, lng, from_date, to_date)
        )
      `)

    if (drinksError) {
      console.error("Supabase error fetching products:", drinksError)
      return Response.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    // Apply the same filtering as the main page
    const currentDateStr = new Date().toISOString().split('T')[0];

    const filteredProducts = (drinksData || []).map((product: any) => {
      const venues = product.venue_stock
        ?.filter((vs: any) => 
          vs.qty_on_hand > 0 && 
          vs.venue && 
          (!vs.venue.from_date || vs.venue.from_date <= currentDateStr) &&
          (!vs.venue.to_date || vs.venue.to_date >= currentDateStr)
        )
        ?.map((vs: any) => ({ 
          id: vs.venue.id, 
          name: vs.venue.name, 
          qty_on_hand: vs.qty_on_hand 
        })) || [];
      
      return { ...product, venues };
    }).filter(product => product.venues.length > 0);

    console.log(`✅ Products API: Found ${filteredProducts.length} products for agent`)

    return Response.json(filteredProducts)

  } catch (error) {
    console.error("❌ Products API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
