import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Format date
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Function to send ticket email
export async function sendTicketEmail(
  email: string, 
  orderItems: any[], 
  orderId: string, 
  orderDate: string
) {
  try {
    // Build the HTML for tickets/pins
    const ticketItemsHtml = orderItems.map(item => `
      <div style="margin-bottom: 15px; padding: 15px; border: 1px solid #e2e2e2; border-radius: 8px; background-color: #f9f9f9;">
        <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${item.qty}× ${item.name}</p>
        ${item.pin_code ? `
          <div style="background-color: #ffffff; border: 1px dashed #cccccc; padding: 10px; margin-top: 10px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #666666;">ENTRY PIN</p>
            <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 24px; font-weight: bold;">${item.pin_code}</p>
          </div>
        ` : ''}
      </div>
    `).join('');

    // Send the email
    const { data, error } = await resend.emails.send({
      from: 'The Water Bar <tickets@thewaterdotbar.vercel.app>',
      to: [email],
      subject: 'Your Water Bar Tickets & PIN',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; color: #333333; line-height: 1.5; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { margin-bottom: 30px; text-align: center; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999999; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; color: #111827;">Your Water Bar Tickets</h1>
                <p style="margin: 10px 0 0 0; color: #6b7280;">Order #${orderId.substring(0, 8)} &middot; ${formatDate(orderDate)}</p>
              </div>
              
              <p>Thank you for your order! Please show this email or take a screenshot of your PIN(s) for entry.</p>
              
              <h2 style="margin: 30px 0 15px 0; font-size: 18px;">Your Tickets</h2>
              ${ticketItemsHtml}
              
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} The Water Bar. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}
