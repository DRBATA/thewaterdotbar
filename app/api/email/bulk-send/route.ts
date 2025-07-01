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
    const { audience, testMode, testEmail, manualRecipients } = await request.json();

    if (!audience || !['attendees', 'no-shows'].includes(audience)) {
      return NextResponse.json({ error: 'Invalid audience type' }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Missing Resend API key' }, { status: 500 });
    }

    let recipients: Recipient[] = [];

    // Priority 1: Manual recipient list
    if (manualRecipients && Array.isArray(manualRecipients) && manualRecipients.length > 0) {
      recipients = manualRecipients.map(email => ({ email, first_name: 'Valued Guest' }));
    } 
    // Priority 2: Test email override
    else if (testEmail) {
      recipients = [{ email: testEmail, first_name: 'Test User' }];
    } 
    // Priority 3: Database query
    else {
      const supabase = await createClient();
      if (audience === 'attendees') {
        const { data: attendeesData, error: attendeesError } = await supabase
          .from('order_items')
          .select('orders(email)')
          .not('claimed_at', 'is', null)
          .limit(testMode ? 3 : 1000);

        if (attendeesError) {
          return NextResponse.json({ error: `Error fetching attendees: ${attendeesError.message}` }, { status: 500 });
        }

        recipients = attendeesData
          .filter(item => Array.isArray(item.orders) ? item.orders.length > 0 : !!item.orders)
          .map(item => {
            const orderInfo = Array.isArray(item.orders) ? item.orders[0] : item.orders;
            return { email: (orderInfo as any).email, first_name: 'Valued Guest' };
          });
      } else { // audience === 'no-shows'
        const { data: claimedOrderItems, error: claimedError } = await supabase
          .from('order_items')
          .select('order_id')
          .not('claimed_at', 'is', null)
          .not('order_id', 'is', null);

        if (claimedError) {
          return NextResponse.json({ error: `Error fetching claimed orders: ${claimedError.message}` }, { status: 500 });
        }

        const claimedOrderIds = [...new Set(claimedOrderItems.map(item => item.order_id))];
        let noShowsQuery = supabase.from('orders').select('email').limit(testMode ? 3 : 1000);

        if (claimedOrderIds.length > 0) {
          noShowsQuery = noShowsQuery.not('id', 'in', `(${claimedOrderIds.join(',')})`);
        }

        const { data: noShows, error: noShowsError } = await noShowsQuery;

        if (noShowsError) {
          return NextResponse.json({ error: `Error fetching no-shows: ${noShowsError.message}` }, { status: 500 });
        }

        recipients = noShows.map(order => ({ email: order.email, first_name: 'Valued Guest' }));
      }
    }

    // Deduplicate recipients by email
    const uniqueRecipients = Array.from(new Map(recipients.map(item => [item.email, item])).values());

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
