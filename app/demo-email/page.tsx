import { Resend } from 'resend';
import { WaterBarFollowupEmail } from '../../emails/water-bar-followup';

// Note: This component now runs on the server and uses a Server Action.
// The 'use client' directive is no longer needed.

export default function DemoEmailPage() {
  
  async function sendEmail(formData: FormData) {
    'use server';
    
    const toEmail = formData.get('email') as string;

    if (!toEmail) {
      console.error("No email provided.");
      return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    
    try {
      await resend.emails.send({
        from: 'The Water Bar <hello@updates.thewater.bar>',
        to: toEmail,
        subject: 'A Follow-up from The Water Bar',
        react: <WaterBarFollowupEmail userFirstName="Valued Guest" />,
      });
      console.log(`Follow-up email sent to ${toEmail}`);
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">Send Demo Follow-up Email</h1>
        <p className="text-center text-gray-600 mb-6">
          Enter an email to receive a test of our new React Email template.
        </p>
        <form action={sendEmail} className="flex flex-col space-y-4">
          <input
            type="email"
            name="email" // The 'name' attribute is crucial for FormData
            placeholder="Your email address"
            required
            className="border border-gray-300 p-3 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <button 
            type="submit"
            className="bg-blue-600 text-white px-4 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
          >
            Send Test Email
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-4 text-center">
          After submitting, check your server console for logs and your inbox for the email.
        </p>
      </div>
    </main>
  );
}
