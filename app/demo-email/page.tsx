import { Resend } from 'resend';
import { WaterBarFollowupEmail } from '../../emails/water-bar-followup';
import { WaterBarMissedYouEmail } from '../../emails/water-bar-missed-you';
import React from 'react';

export default function DemoEmailPage() {
  
  async function sendEmail(formData: FormData) {
    'use server';
    
    const toEmail = formData.get('email') as string;
    const template = formData.get('template') as string;

    if (!toEmail || !template) {
      console.error("Email or template not provided.");
      return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    
    let subject = '';
    let emailComponent: React.ReactElement;

    if (template === 'attendee') {
      subject = 'A Follow-up from The Water Bar';
      emailComponent = <WaterBarFollowupEmail userFirstName="Valued Guest" />;
    } else {
      subject = 'We Missed You at The Water Bar!';
      emailComponent = <WaterBarMissedYouEmail userFirstName="Valued Guest" />;
    }

    try {
      await resend.emails.send({
        from: 'The Water Bar <hello@updates.thewater.bar>',
        to: toEmail,
        subject: subject,
        react: emailComponent,
      });
      console.log(`${template} email sent to ${toEmail}`);
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">Send Campaign Email</h1>
        <p className="text-center text-gray-600 mb-6">
          Select a template and enter an email to send a test.
        </p>
        <form action={sendEmail} className="flex flex-col space-y-4">
          <div>
            <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
              Email Template
            </label>
            <select
              id="template"
              name="template"
              required
              className="border border-gray-300 p-3 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="attendee">Thank You (For Attendees)</option>
              <option value="missed-you">Sorry We Missed You (For No-Shows)</option>
            </select>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Your email address"
              required
              className="border border-gray-300 p-3 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
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
