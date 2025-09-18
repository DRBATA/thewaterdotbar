import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getSessionId } from "@/lib/session"

export async function POST(req: Request) {
  const { itemId, qty = 1, bundle_components, venue_id } = await req.json()
  console.log(`🛒 ADD: Received request - itemId=${itemId}, qty=${qty}, venue_id=${venue_id}`)
  
  if (!itemId) {
    return NextResponse.json({ error: "Missing itemId" }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = await createClient()

  const sessionId = await getSessionId()
  console.log(`🛒 ADD: Using session_id=${sessionId}`)
  
  try {
    // 1. Find or create cart header
    const { data: cartHeader, error: cartHeaderError } = await supabase
      .from("cart_headers")
      .select("id")
      .eq("session_id", sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (cartHeaderError) {
      console.error(`🛒 ADD: Cart header error:`, cartHeaderError)
      throw new Error(`Cart header error: ${cartHeaderError.message}`);
    }
    
    let cartId;
    if (!cartHeader) {
      console.log(`🛒 ADD: Creating new cart header for session ${sessionId}`)
      // Create new cart header if not exists
      const { data: newCartHeader, error: newCartError } = await supabase
        .from("cart_headers")
        .insert({
          session_id: sessionId,
          venue_id: venue_id || null
        })
        .select("id")
        .single();
        
      if (newCartError) {
        console.error(`🛒 ADD: New cart error:`, newCartError)
        throw new Error(`New cart error: ${newCartError.message}`);
      }
      cartId = newCartHeader.id;
      console.log(`🛒 ADD: Created cart ${cartId}`)
    } else {
      cartId = cartHeader.id;
      console.log(`🛒 ADD: Using existing cart ${cartId}`)
    }
    
    // 2. Add item to cart_items or update quantity if exists
    const { data: existingItem, error: existingItemError } = await supabase
      .from("cart_items")
      .select("id, qty")
      .eq("cart_id", cartId)
      .eq("item_id", itemId)
      .maybeSingle();
      
    if (existingItemError) {
      throw new Error(`Existing item error: ${existingItemError.message}`);
    }
    
    if (existingItem) {
      console.log(`🛒 ADD: Updating existing item ${itemId} from qty ${existingItem.qty} to ${existingItem.qty + qty}`)
      // Update quantity if item already exists
      const updateData: any = { qty: existingItem.qty + qty };
      const { error: updateError } = await supabase
        .from("cart_items")
        .update(updateData)
        .eq("id", existingItem.id);
        
      if (updateError) {
        console.error(`🛒 ADD: Update error:`, updateError)
        throw new Error(`Update error: ${updateError.message}`);
      }
      console.log(`🛒 ADD: Successfully updated item ${itemId}`)
      return NextResponse.json({ success: true, action: 'updated' });
    } else {
      console.log(`🛒 ADD: Inserting new item ${itemId} with qty ${qty}`)
      // Insert new item
      const { error: insertError } = await supabase
        .from("cart_items")
        .insert({
          cart_id: cartId,
          item_id: itemId,
          qty,
          bundle_components
        });
        
      if (insertError) {
        console.error(`🛒 ADD: Insert error:`, insertError)
        throw new Error(`Insert error: ${insertError.message}`);
      }
      console.log(`🛒 ADD: Successfully inserted item ${itemId}`)
      return NextResponse.json({ success: true, action: 'inserted' });
    }
  } catch (error: any) {
    console.error("Cart add error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
