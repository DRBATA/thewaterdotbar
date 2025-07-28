import { createClient } from "@/lib/supabase/server"

async function fetchProducts() {
  // Use the same working Supabase client as the chat API
  const supabase = await createClient()

  // Fetch products using the same pattern as the chat API
  const { data: drinksData, error: drinksError } = await supabase
    .from("products")
    .select(`
      id, 
      name, 
      description, 
      price, 
      tags, 
      pairings, 
      venue_stock(
        qty_on_hand, 
        venue:venue_id(id, name, from_date, to_date)
      )
    `)

  if (drinksError) {
    console.error("Supabase error fetching products:", drinksError)
    throw new Error("Failed to fetch product data")
  }

  const currentDateStr = new Date().toISOString().split('T')[0];

  // Transform and filter products (same logic as chat API)
  const transformAndFilter = (items: any[]) => {
    return items.map((item: any) => {
      const venues = item.venue_stock
        ?.filter((vs: any) => 
          vs.qty_on_hand > 0 && 
          vs.venue && 
          (!vs.venue.from_date || vs.venue.from_date <= currentDateStr) &&
          (!vs.venue.to_date || vs.venue.to_date >= currentDateStr)
        )
        ?.map((vs: any) => ({ id: vs.venue.id, name: vs.venue.name, qty_on_hand: vs.qty_on_hand })) || [];
      return { ...item, venues };
    }).filter(item => item.venues.length > 0);
  };

  const products = transformAndFilter(drinksData || []);
  console.log(`Successfully fetched ${products.length} products for avatar agent`)
  
  return products;
}

export async function GET(req: Request) {
  try {
    const products = await fetchProducts();
    return new Response(JSON.stringify(products), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error("Error in GET /api/products:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch product data" }), { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const products = await fetchProducts();

    if (drinksError) {
      console.error("Supabase error fetching products:", drinksError)
      return new Response(JSON.stringify({ error: "Failed to fetch product data" }), { status: 500 })
    }

    const currentDateStr = new Date().toISOString().split('T')[0];

    // Transform and filter products (same logic as chat API)
    const transformAndFilter = (items: any[]) => {
      return items.map((item: any) => {
        const venues = item.venue_stock
          ?.filter((vs: any) => 
            vs.qty_on_hand > 0 && 
            vs.venue && 
            (!vs.venue.from_date || vs.venue.from_date <= currentDateStr) &&
            (!vs.venue.to_date || vs.venue.to_date >= currentDateStr)
          )
          ?.map((vs: any) => ({ id: vs.venue.id, name: vs.venue.name, qty_on_hand: vs.qty_on_hand })) || [];
        return { ...item, venues };
      }).filter(item => item.venues.length > 0);
    };

    const products = transformAndFilter(drinksData || []);

    console.log(`Successfully fetched ${products.length} products for avatar agent`)

    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error("Error in products API:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 })
  }
}
