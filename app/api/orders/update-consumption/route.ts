import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/orders/update-consumption
 * Mark order items as consumed
 * Triggers Supabase Realtime webhook to Fly.io
 */
export async function POST(req: NextRequest) {
  try {
    const { order_id, consumed_items } = await req.json();

    if (!order_id || !consumed_items || !Array.isArray(consumed_items)) {
      return NextResponse.json(
        { error: 'order_id and consumed_items array required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update all selected items as consumed
    const { error } = await supabase
      .from('order_items')
      .update({ consumed: true })
      .in('id', consumed_items);

    if (error) throw error;

    // This update triggers the Supabase Realtime webhook
    // which notifies the Fly.io server for follow-up emails

    return NextResponse.json({ 
      success: true,
      updated: consumed_items.length 
    });

  } catch (error: any) {
    console.error('Error updating consumption:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update consumption' },
      { status: 500 }
    );
  }
}
