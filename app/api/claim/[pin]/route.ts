import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(_req: NextRequest, { params }: { params: { pin: string } }) {
  const { pin } = params;
  if (!pin || pin.length !== 4) {
    return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("order_items")
    .select('id,pin_code,claimed_at,qty,name,item_id,order_id')
    .eq("pin_code", pin)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "PIN not found" }, { status: 404 });
  }
  if (!data) {
    return NextResponse.json({ error: "PIN not found" }, { status: 404 });
  }

  // fetch order for email
  const { data: order } = await supabaseAdmin.from('orders').select('email,created_at,total').eq('id', data.order_id).maybeSingle();
  const result = { ...data, order };

  if (data.claimed_at) {
    return NextResponse.json({ error: "Already claimed", claimed_at: data.claimed_at }, { status: 410 });
  }
  return NextResponse.json(result);
}

export async function POST(req: NextRequest, { params }: { params: { pin: string } }) {
  const { pin } = params;
  const body = await req.json();
  const { venue_id, redemption_choice } = body;
  
  // Validate venue_id is provided
  if (!venue_id) {
    return NextResponse.json({ error: "Venue selection required" }, { status: 400 });
  }
  
  // 1. First get the order item to confirm it exists and is unclaimed
  const { data: orderItem, error: fetchError } = await supabaseAdmin
    .from("order_items")
    .select("id, item_id")
    .eq("pin_code", pin)
    .is("claimed_at", null)
    .maybeSingle();
    
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  
  if (!orderItem) {
    return NextResponse.json({ error: "Invalid PIN or already claimed" }, { status: 404 });
  }
  
  // 2. Update order_item with claimed_at and venue_id
  const { error, data } = await supabaseAdmin
    .from("order_items")
    .update({ 
      claimed_at: new Date().toISOString(),
      venue_id: venue_id,
      redemption_choice: redemption_choice || null
    })
    .eq("id", orderItem.id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // 3. Decrement stock at the selected venue
  if (orderItem.item_id) {
    const { error: stockError } = await supabaseAdmin
      .from("venue_stock")
      .update({ qty_on_hand: supabaseAdmin.rpc('decrement', { val: 1 }) })
      .eq("venue_id", venue_id)
      .eq("product_id", orderItem.item_id)
      .gt("qty_on_hand", 0);
      
    if (stockError) {
      console.error("Failed to update stock:", stockError);
      // We don't return an error here, as the PIN was successfully claimed
      // But we do log the error for monitoring
    }
  }
  
  return NextResponse.json({ 
    success: true, 
    claimed_at: data.claimed_at, 
    venue_id: data.venue_id 
  });
}
