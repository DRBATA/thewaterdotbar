import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getSessionId } from "@/lib/session"

export async function POST(req: Request) {
  const { itemId, qty = 1 } = await req.json()
  if (!itemId) {
    return NextResponse.json({ error: "Missing itemId" }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createClient()

  // Logged-in user (optional)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const sessionId = await getSessionId()
  
  try {
    // 1. Find or create cart header
    const { data: cartHeader, error: cartHeaderError } = await supabase
      .from("cart_headers")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();
      
    if (cartHeaderError) {
      throw new Error(`Cart header error: ${cartHeaderError.message}`);
    }
    
    let cartId;
    if (!cartHeader) {
      // Create new cart header if not exists
      const { data: newCartHeader, error: newCartError } = await supabase
        .from("cart_headers")
        .insert({
          session_id: sessionId,
          user_id: user?.id ?? null
        })
        .select("id")
        .single();
        
      if (newCartError) {
        throw new Error(`New cart error: ${newCartError.message}`);
      }
      cartId = newCartHeader.id;
    } else {
      cartId = cartHeader.id;
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
      // Update quantity if item already exists
      const { error: updateError } = await supabase
        .from("cart_items")
        .update({ qty: existingItem.qty + qty })
        .eq("id", existingItem.id);
        
      if (updateError) {
        throw new Error(`Update error: ${updateError.message}`);
      }
    } else {
      // Insert new item
      const { error: insertError } = await supabase
        .from("cart_items")
        .insert({
          cart_id: cartId,
          item_id: itemId,
          qty
        });
        
      if (insertError) {
        throw new Error(`Insert error: ${insertError.message}`);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cart add error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
