import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Resend } from 'resend';

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
    const { error: stockError } = await supabaseAdmin.rpc('decrement_venue_stock', {
      p_venue_id: venue_id,
      p_product_id: orderItem.item_id,
      p_amount: 1
    });
      
    if (stockError) {
      console.error("Failed to update stock:", stockError);
      // We don't return an error here, as the PIN was successfully claimed
      // But we do log the error for monitoring
    } else {
      // 4. Check if stock is running low after decrement
      const LOW_STOCK_THRESHOLD = 5; // Alert when 5 or fewer items left
      
      // Get current stock level
      const { data: currentStock } = await supabaseAdmin
        .from("venue_stock")
        .select("qty_on_hand")
        .eq("venue_id", venue_id)
        .eq("product_id", orderItem.item_id)
        .single();
      
      // Get product and venue details for the alert
      if (currentStock && currentStock.qty_on_hand <= LOW_STOCK_THRESHOLD) {
        // Get product name
        const { data: product } = await supabaseAdmin
          .from("products")
          .select("name")
          .eq("id", orderItem.item_id)
          .single();
        
        // Get venue name
        const { data: venue } = await supabaseAdmin
          .from("venues")
          .select("name")
          .eq("id", venue_id)
          .single();
        
        if (product && venue) {
          // Send low stock alert email
          try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
              from: 'The Water Bar Stock Alert <alerts@thewater.bar>',
              to: ['gaia@inspiredbeingco.com'],
              subject: `🚨 Low Stock Alert: ${product.name} at ${venue.name}`,
              html: `
                <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #e53e3e;">⚠️ Low Stock Alert</h1>
                  <p>Hello Water Bar Team,</p>
                  <p>The following product is running low and needs restocking:</p>
                  <div style="background-color: #f9f9f9; border-left: 4px solid #e53e3e; padding: 15px; margin: 20px 0;">
                    <p><strong>Product:</strong> ${product.name}</p>
                    <p><strong>Location:</strong> ${venue.name}</p>
                    <p><strong>Remaining Stock:</strong> ${currentStock.qty_on_hand} units</p>
                  </div>
                  <p>Please arrange for a restock as soon as possible.</p>
                  <p>Thank you,<br>The Water Bar System</p>
                </div>
              `
            });
            console.log(`Low stock alert sent for ${product.name} at ${venue.name}`);
          } catch (emailError) {
            console.error('Failed to send low stock alert email:', emailError);
          }
        }
      }
    }
  }
  
  return NextResponse.json({ 
    success: true, 
    claimed_at: data.claimed_at, 
    venue_id: data.venue_id 
  });
}
