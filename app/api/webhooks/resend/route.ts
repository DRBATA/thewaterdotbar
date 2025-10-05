import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Webhook } from 'svix';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('svix-signature');
    
    // Verify webhook signature from Resend
    if (signature && process.env.RESEND_WEBHOOK_SECRET) {
      const webhook = new Webhook(process.env.RESEND_WEBHOOK_SECRET);
      try {
        webhook.verify(body, {
          'svix-id': request.headers.get('svix-id') || '',
          'svix-timestamp': request.headers.get('svix-timestamp') || '',
          'svix-signature': signature,
        });
      } catch (err) {
        console.error('❌ Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }
    
    const payload = JSON.parse(body);
    
    console.log('📧 Resend webhook received:', payload.type);
    
    // Resend webhook event structure:
    // {
    //   type: 'email.delivered' | 'email.opened' | 'email.clicked' | 'email.bounced',
    //   data: { email_id: 'xxx', ... }
    // }
    
    const { type, data } = payload;
    
    // Extract event type (e.g., 'email.delivered' → 'delivered')
    const eventType = type.replace('email.', '');
    
    // Log event to Supabase
    const { error } = await supabase.from('email_events').insert({
      email_id: data.email_id,
      event_type: eventType,
      event_time: new Date().toISOString(),
      metadata: data,
    });
    
    if (error) {
      console.error('❌ Failed to log email event:', error);
      return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
    }
    
    console.log(`✅ Email event logged: ${data.email_id} - ${eventType}`);
    
    // If payment link was clicked, check if we need follow-up
    if (eventType === 'clicked') {
      // TODO: Check if payment completed, send follow-up if not
      console.log('🔔 Payment link clicked - monitoring for payment');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Resend webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
