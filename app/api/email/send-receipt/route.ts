import { NextResponse } from "next/server";
import { Resend } from 'resend';
import { OrderConfirmationEmail } from '@/emails/order-confirmation';
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    const { orderId } = await req.json();

    if (!orderId) {
        return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    try {
        const supabase = await createClient();

        // Fetch the full order details for the email
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', orderId)
            .single();

        if (orderError || !orderData) {
            console.error(`Error fetching order ${orderId} for email:`, orderError);
            return NextResponse.json({ error: "Order not found or error fetching details." }, { status: 404 });
        }

        const userFirstName = 'Valued Customer';

        const resend = new Resend(process.env.RESEND_API_KEY);
        const { data, error } = await resend.emails.send({
            from: 'The Water Bar <hello@thewater.bar>',
            to: [orderData.email!],
            subject: `Your Water Bar Order Confirmation #${orderData.id.substring(0, 8)}`,
            react: OrderConfirmationEmail({
                orderId: orderData.id,
                userFirstName: userFirstName,
                orderItems: orderData.order_items.map((item: { name: string; qty: number; pin_code: string; }) => ({ name: item.name, quantity: item.qty, pin_code: item.pin_code })),
                total: orderData.total,
            }),
        });

        if (error) {
          console.error(`Resend API error for order ${orderId}:`, error);
          return NextResponse.json({ error: "Failed to send email.", details: error }, { status: 500 });
        }

        console.log(`Order confirmation email sent successfully to ${orderData.email} for order ${orderId}`);
        return NextResponse.json({ success: true, message: "Email sent successfully." });

    } catch (error: any) {
        console.error(`Failed to send confirmation email for order ${orderId}:`, error);
        return NextResponse.json({ error: "Failed to send email.", details: error.message }, { status: 500 });
    }
}
