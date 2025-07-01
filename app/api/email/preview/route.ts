import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { WaterBarMissedYouEmail } from '@/emails/water-bar-missed-you';
import { WaterBarFollowupEmail } from '@/emails/water-bar-followup';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const template = searchParams.get('template');

    let emailComponent;

    // We can add more templates here in the future
    switch (template) {
      case 'missed-you':
        emailComponent = WaterBarMissedYouEmail({ userFirstName: 'Valued Guest' });
        break;
      case 'follow-up':
        emailComponent = WaterBarFollowupEmail({ userFirstName: 'Valued Guest' });
        break;
      default:
        return new Response('<h1>Error: Invalid template specified.</h1><p>Please provide a valid template name, such as `missed-you`.</p>', { 
          status: 400, 
          headers: { 'Content-Type': 'text/html' }
        });
    }

    // Render the React component to an HTML string
    const html = await render(emailComponent);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error: any) {
    console.error('Email preview rendering error:', error);
    return new Response(`<h1>Error</h1><p>Failed to render email preview: ${error.message}</p>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
