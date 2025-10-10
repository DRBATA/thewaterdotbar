import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateEmailColors } from '@/lib/email-colors';
import { render } from '@react-email/components';
import WaterBarReceipt from '@/emails/water-bar-receipt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, customerEmail, assessmentData } = body;

    if (!orderId || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing orderId or customerEmail' },
        { status: 400 }
      );
    }

    // Fetch order data
    const supabase = await createClient();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        total,
        email,
        cart_id,
        order_items (
          item_id,
          name,
          qty,
          price
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fetch product details with colors
    const itemIds = order.order_items.map((item: any) => item.item_id);
    const { data: products } = await supabase
      .from('products')
      .select('id, image_url, color_primary, color_accent, color_mood')
      .in('id', itemIds);

    // Map products to items
    const orderItems = order.order_items.map((item: any) => {
      const product = products?.find(p => p.id === item.item_id);
      return {
        name: item.name,
        quantity: item.qty,
        price: item.price,
        image_url: product?.image_url,
      };
    });

    // Calculate dynamic colors (if assessment exists)
    let colors;
    // Handle both direct OUTPUT and bundled {input, output} structure
    let assessment = assessmentData?.output || assessmentData; // Use OUTPUT if bundled, otherwise use directly
    
    if (assessment && assessment.recommended_drinks) { // Check for actual recommendations
      // Upload meal images to Supabase Storage if provided
      if (assessment.recommended_meals && Array.isArray(assessment.recommended_meals)) {
        for (const meal of assessment.recommended_meals) {
          if (meal.imageData) {
            try {
              // Convert base64 to buffer
              const base64Data = meal.imageData.replace(/^data:image\/\w+;base64,/, '');
              const buffer = Buffer.from(base64Data, 'base64');
              
              // Upload to Supabase Storage
              const fileName = `meal-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('meal-images')
                .upload(fileName, buffer, {
                  contentType: 'image/png',
                  cacheControl: '3600',
                });
              
              if (!uploadError && uploadData) {
                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                  .from('meal-images')
                  .getPublicUrl(fileName);
                
                meal.imageUrl = publicUrl;
                delete meal.imageData; // Remove base64 to reduce payload
              }
            } catch (uploadError) {
              console.error('Failed to upload meal image:', uploadError);
              // Continue without image
            }
          }
        }
      }
      
      // Calculate colors from products
      const productColors = products?.filter(p => p.color_primary) || [];
      if (productColors.length > 0) {
        colors = calculateEmailColors(productColors);
      }
    }

    // Render email
    const emailHtml = render(
      WaterBarReceipt({
        customerName: order.email ? order.email.split('@')[0] : 'Valued Customer',
        customerEmail: order.email,
        orderId: order.id,
        orderDate: order.created_at,
        orderItems,
        total: order.total,
        assessment,
        colors,
        updateTrackerUrl: `https://thewater.bar/?track_order=${order.id}`,
        downloadAssessmentUrl: assessmentData?.input  // Only show download if INPUT context exists (QR flow)
          ? `https://thewater.bar/?track_order=${order.id}&download=true`
          : undefined,
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
        from: 'The Water Bar <noreply@receipt.thewater.bar>',
        to: [customerEmail],
        subject: assessment 
          ? `Your Personalized Hydration Plan + Receipt #${order.id.substring(0, 8)}`
          : `Your Water Bar Receipt #${order.id.substring(0, 8)}`,
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
      subject: assessment 
        ? `Hydration Plan + Receipt #${order.id.substring(0, 8)}`
        : `Receipt #${order.id.substring(0, 8)}`,
      flow: 'water-bar-receipt',
      order_id: orderId,
      status: 'sent',
    });

    return NextResponse.json({
      success: true,
      emailId: result.id,
    });

  } catch (error: any) {
    console.error('Error sending receipt email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
