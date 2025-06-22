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

export async function POST(_req: NextRequest, { params }: { params: { pin: string } }) {
  const { pin } = params;
  const { error, data } = await supabaseAdmin
    .from("order_items")
    .update({ claimed_at: new Date().toISOString() })
    .eq("pin_code", pin)
    .is("claimed_at", null)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Invalid or already claimed" }, { status: 404 });
  }
  return NextResponse.json({ success: true, claimed_at: data.claimed_at });
}
