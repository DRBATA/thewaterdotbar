import { Resend } from 'resend';
import { WaterBarFollowupEmail } from '../../../../emails/water-bar-followup';
import { WaterBarMissedYouEmail } from '../../../../emails/water-bar-missed-you';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import React from 'react';

// Helper to chunk array into smaller batches
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Helper to delay execution (for rate limiting)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Define recipient type
type Recipient = { email: string; first_name?: string };

export async function POST(request: Request) {
  try {
    const { audience, testMode, testEmail } = await request.json();
    
    if (!audience || !['attendees', 'no-shows'].includes(audience)) {
      return NextResponse.json({ error: 'Invalid audience type' }, { status: 400 });
    }
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Missing Resend API key' }, { status: 500 });
    }
    
    // Initialize Supabase
    const supabase = await createClient();
    
    // Fetch recipients based on audience type
    let recipients: Recipient[] = [];
    
    // Override with test email if provided (much easier way to test)
    if (testEmail) {
      // Use the provided test email instead of querying the database
      recipients = [{
        email: testEmail,
        first_name: 'Test User'
      }];
    }
    // Only query the database if we're not using a test email
    else if (audience === 'attendees') {
      // Fetch users who attended (have orders with at least one claimed_at item)
      const { data: attendeesData, error: attendeesError } = await supabase
        .from('order_items')
        .select('orders(email)') // Only select email since first_name doesn't exist
        .not('claimed_at', 'is', null)
        .limit(testMode ? 3 : 1000);
      
      if (attendeesError) {
        return NextResponse.json({ error: `Error fetching attendees: ${attendeesError.message}` }, { status: 500 });
      }
      
      // Flatten and map the data
      recipients = attendeesData
        .filter(item => Array.isArray(item.orders) ? item.orders.length > 0 : !!item.orders)
        .map(item => {
          // When using the syntax orders(email) Supabase returns an array of matching parent rows
          const orderInfo = Array.isArray(item.orders) ? item.orders[0] : item.orders;
          return {
            email: (orderInfo as any).email,
            first_name: 'Valued Guest' // Hard-code since first_name column doesn't exist
          };
        });

    } else { // audience === 'no-shows'
      // 1. Get all order_ids that have at least one claimed item.
      const { data: claimedOrderItems, error: claimedError } = await supabase
          .from('order_items')
          .select('order_id')
          .not('claimed_at', 'is', null)
          .neq('order_id', null);

      if (claimedError) {
          return NextResponse.json({ error: `Error fetching claimed orders: ${claimedError.message}` }, { status: 500 });
      }

      const claimedOrderIds = [...new Set(claimedOrderItems.map(item => item.order_id))];

      // 2. Get all orders whose ID is NOT in the claimed list.
      const { data: noShows, error: noShowsError } = await supabase
          .from('orders')
          .select('email')
          .not('id', 'in', `(${claimedOrderIds.join(',')})`)
          .limit(testMode ? 3 : 1000);
      
      if (noShowsError) {
        return NextResponse.json({ error: `Error fetching no-shows: ${noShowsError.message}` }, { status: 500 });
      }
      
      recipients = noShows.map(order => ({ 
        email: order.email,
        first_name: 'Valued Guest' // Hard-code since first_name column doesn't exist
      }));
    }
    
    // Deduplicate recipients by email
    const uniqueRecipients = Array.from(
      new Map(recipients.map(item => [item.email, item])).values()
    );
    
    // Process in batches
    const batches = chunkArray(uniqueRecipients, 10);
    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];
    
    for (const [batchIndex, batch] of batches.entries()) {
      const sendPromises = batch.map(async (recipient: Recipient) => {
        try {
          const emailComponent = audience === 'attendees'
            ? React.createElement(WaterBarFollowupEmail, { userFirstName: recipient.first_name || 'Valued Guest', userEmail: recipient.email })
            : React.createElement(WaterBarMissedYouEmail, { userFirstName: recipient.first_name || 'Valued Guest', userEmail: recipient.email });
          
          const subject = audience === 'attendees'
            ? 'A Follow-up from The Water Bar'
            : 'We Missed You at The Water Bar!';
          
          await resend.emails.send({
            from: 'The Water Bar <hello@updates.thewater.bar>',
            to: recipient.email,
            subject: subject,
            react: emailComponent,
          });
          
          successCount++;
          return { success: true, email: recipient.email };
        } catch (error: any) {
          errorCount++;
          errors.push({ email: recipient.email, error: error.message });
          return { success: false, email: recipient.email, error };
        }
      });
      
      await Promise.all(sendPromises);
      
      if (batchIndex < batches.length - 1) {
        await delay(1000);
      }
    }
    
    return NextResponse.json({
      success: true,
      total: uniqueRecipients.length,
      sent: successCount,
      failed: errorCount,
      errors: errors.length > 0 ? errors : undefined,
    });
    
  } catch (error: any) {
    console.error('Bulk email sending error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
