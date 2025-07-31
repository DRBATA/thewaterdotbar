import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { itemId, providedChars } = body;
  
  if (!itemId || !providedChars) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }
  
  // Get the order item and email
  const { data: orderItem, error: itemError } = await supabaseAdmin
    .from("order_items")
    .select('id,pin_code,claimed_at,qty,name,item_id,order_id')
    .eq("id", itemId)
    .is("claimed_at", null)
    .maybeSingle();
    
  if (itemError || !orderItem) {
    return NextResponse.json({ error: "Order item not found or already claimed" }, { status: 404 });
  }
  
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('email,created_at,total')
    .eq('id', orderItem.order_id)
    .maybeSingle();
    
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  
  // Verify the provided characters match the email
  const email = order.email;
  console.log('Email verification debug:');
  console.log('Email:', email);
  console.log('Provided chars:', providedChars);
  
  const isValid = providedChars.every(({ position, char }: { position: number, char: string }) => {
    const emailChar = email[position];
    const matches = emailChar && emailChar.toLowerCase() === char.toLowerCase();
    console.log(`Position ${position}: email[${position}]='${emailChar}' vs provided='${char}' -> ${matches}`);
    return matches;
  });
  
  console.log('Overall validation result:', isValid);
  
  if (!isValid) {
    return NextResponse.json({ error: "Email verification failed" }, { status: 400 });
  }
  
  // Email verified! Return order details for confirmation
  return NextResponse.json({
    success: true,
    orderItem: {
      ...orderItem,
      order: order
    }
  });
}
