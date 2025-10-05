import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateEmailColors } from '@/lib/email-colors';
import { render } from '@react-email/components';
import SharePlanEmail from '@/emails/share-plan';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cartId, customerEmail, customerName } = body;

    if (!cartId || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing cartId or customerEmail' },
        { status: 400 }
      );
    }

    // Fetch cart data
    const supabase = await createClient();
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select(`
        id,
        assessment_data,
        cart_items (
          product_id,
          quantity,
          products (
            id,
            name,
            color_primary,
            color_accent,
            color_mood
          )
        )
      `)
      .eq('id', cartId)
      .single();

    if (cartError || !cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    if (!cart.assessment_data) {
      return NextResponse.json(
        { error: 'No assessment data in cart' },
        { status: 400 }
      );
    }

    const assessment = cart.assessment_data;

    // Calculate colors from products in cart
    const products = cart.cart_items
      .map((item: any) => item.products)
      .filter(Boolean);
    
    const colors = calculateEmailColors(products);

    // Generate QR code
    const qrData = JSON.stringify({
      type: 'hydration_plan',
      cart_id: cartId,
      timestamp: new Date().toISOString(),
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: colors.primary,
        light: '#FFFFFF',
      },
    });

    // Render email
    const emailHtml = render(
      SharePlanEmail({
        customerName: customerName || 'Valued Customer',
        cartId,
        assessment: {
          deficits: assessment.deficits || {},
          recommended_drinks: assessment.recommended_drinks || [],
          recommended_meals: assessment.recommended_meals || [],
        },
        qrCodeUrl: qrCodeDataUrl,
        colors,
        updatePlanUrl: `https://thewater.bar/tracker/update?cart_id=${cartId}`,
        viewCartUrl: `https://thewater.bar/cart/${cartId}`,
      })
    );

    // Send email using Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'The Water Bar <plans@thewater.bar>',
        to: [customerEmail],
        subject: '✨ Your Personalized Hydration Plan',
        html: emailHtml,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(result)}`);
    }

    // Log email send
    await supabase.from('email_log').insert({
      to_email: customerEmail,
      subject: 'Personalized Hydration Plan',
      flow: 'share-plan',
      cart_id: cartId,
      status: 'sent',
    });

    return NextResponse.json({
      success: true,
      emailId: result.id,
    });

  } catch (error: any) {
    console.error('Error sending plan email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
