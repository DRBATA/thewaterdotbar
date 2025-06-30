import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { WaterBarFollowupEmail } from '@/emails/water-bar-followup';
import { WaterBarMissedYouEmail } from '@/emails/water-bar-missed-you';
import { revalidatePath } from 'next/cache';

const resend = new Resend(process.env.RESEND_API_KEY);

// This function does the actual work but returns an object
async function sendBroadcastImpl(audience: 'attendees' | 'non-attendees') {
  'use server';

  const supabase = await createClient();
  const functionName = audience === 'attendees' ? 'get_attendee_emails' : 'get_non_attendee_emails';

  const { data, error } = await supabase.rpc(functionName);

  if (error) {
    console.error(`Error fetching ${audience}:`, error);
    return { success: false, message: `Failed to fetch ${audience}.` };
  }

  const emails = data as { email: string }[] | null;

  if (!emails || emails.length === 0) {
    return { success: true, message: `No one in the ${audience} list to email.` };
  }

  const emailPromises = emails.map(({ email }) => {
    const emailComponent = audience === 'attendees' 
      ? <WaterBarFollowupEmail userEmail={email} />
      : <WaterBarMissedYouEmail userEmail={email} />;

    return resend.emails.send({
      from: 'The Water Bar <hello@updates.thewater.bar>',
      to: email,
      subject: audience === 'attendees' ? 'Thanks for coming!' : 'We missed you!',
      react: emailComponent,
    });
  });

  try {
    await Promise.all(emailPromises);
    revalidatePath('/admin/broadcast');
    return { success: true, message: `Successfully sent emails to ${emails?.length || 0} ${audience}.` };
  } catch (e) {
    console.error('Failed to send emails:', e);
    return { success: false, message: 'An error occurred while sending emails.' };
  }
}

// This wrapper function is compatible with Next.js form actions
async function sendBroadcast(audience: 'attendees' | 'non-attendees', formData: FormData) {
  'use server';
  
  const result = await sendBroadcastImpl(audience);
  
  // You can do something with the result if needed
  console.log(result.message);
  
  // No return value makes TypeScript happy
}

export default function BroadcastPage() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Email Broadcast Center</h1>
        <p style={styles.text}>
          Send marketing emails to your event guests. Unsubscribed users are automatically excluded.
        </p>
        <form action={sendBroadcast.bind(null, 'attendees')} style={styles.form}>
          <h2 style={styles.subtitle}>Attendee Follow-up</h2>
          <p style={styles.description}>Send the "Thanks for coming" email to everyone who claimed a ticket.</p>
          <button type="submit" style={styles.button}>Send to Attendees</button>
        </form>
        <form action={sendBroadcast.bind(null, 'non-attendees')} style={styles.form}>
          <h2 style={styles.subtitle}>Non-Attendee Follow-up</h2>
          <p style={styles.description}>Send the "We missed you" email to everyone who did NOT claim a ticket.</p>
          <button type="submit" style={{...styles.button, ...styles.buttonSecondary}}>Send to Non-Attendees</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: 'sans-serif',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    textAlign: 'center' as const,
    maxWidth: '600px',
    width: '100%',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  text: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '30px',
  },
  form: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '20px',
    marginTop: '20px',
  },
  subtitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  description: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
  },
  button: {
    backgroundColor: '#D94A8C',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
  },
  buttonSecondary: {
    backgroundColor: '#6b7280',
  },
};
