import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSessionId } from "@/lib/session"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  const { itemId } = await req.json()
  if (!itemId) {
    return NextResponse.json({ error: "Missing itemId" }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = await createClient()
  const sessionId = await getSessionId()

  try {
    // 1. Get cart header
    const { data: cartHeader, error: headerError } = await supabase
      .from("cart_headers")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle()

    if (headerError) {
      throw new Error(`Error fetching cart header: ${headerError.message}`)
    }

    // If no cart found, nothing to remove
    if (!cartHeader) {
      return NextResponse.json({ success: true })
    }
    
    // 2. Find the specific item in cart
    const { data: cartItem, error: itemError } = await supabase
      .from("cart_items")
      .select("id, qty")
      .eq("cart_id", cartHeader.id)
      .eq("item_id", itemId)
      .maybeSingle()

    if (itemError) {
      throw new Error(`Error fetching cart item: ${itemError.message}`)
    }

    // If item not found in cart, nothing to remove
    if (!cartItem) {
      return NextResponse.json({ success: true })
    }
    
    // 3. Process the item removal
    if (cartItem.qty <= 1) {
      // Delete the item if it's the last one
      const { error: deleteError } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", cartItem.id)

      if (deleteError) {
        throw new Error(`Error deleting cart item: ${deleteError.message}`)
      }

      // Check if this was the last item in the cart
      const { count, error: countError } = await supabase
        .from("cart_items")
        .select("id", { count: "exact" })
        .eq("cart_id", cartHeader.id)

      if (countError) {
        console.error("Error counting remaining items:", countError)
      } else if (count === 0) {
        // Delete the cart header if it's empty
        await supabase
          .from("cart_headers")
          .delete()
          .eq("id", cartHeader.id)
      }
    } else {
      // Reduce the quantity
      const { error: updateError } = await supabase
        .from("cart_items")
        .update({ qty: cartItem.qty - 1 })
        .eq("id", cartItem.id)

      if (updateError) {
        throw new Error(`Error updating cart item: ${updateError.message}`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Cart remove error:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
