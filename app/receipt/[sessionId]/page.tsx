import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Image from "next/image";
import PrintButton from './PrintButton.tsx';
import SendEmailButton from './SendEmailButton';
import OrderReceiptButton from '@/components/OrderReceiptButton';
import ReceiptPageClient from './ReceiptPageClient';

type TicketPageProps = {
  params: {
    sessionId: string;
  };
};

export default async function TicketPage({ params }: TicketPageProps) {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const { sessionId } = params;

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select(`
      id,
      created_at,
      total,
      email,
      order_items (
        item_id,
        name, 
        qty,
        price,
        pin_code,
        claimed_at,
        plan
      )
    `)
    .eq("stripe_session_id", sessionId)
    .single(); // Use .single() if stripe_session_id is unique and you expect one order

  if (orderError || !orderData) {
    console.error("Error fetching order for receipt:", orderError);
    notFound();
  }

  // Fetch image_urls for each order item
  const orderItemsWithImages = await Promise.all(
    (orderData.order_items || []).map(async (item: { item_id: string; name: string; qty: number; price: number; /* other potential fields */ }) => {
      let imageUrl = '/placeholder.png'; // Default placeholder
      // Try fetching from products table
      const { data: product } = await supabase
        .from('products')
        .select('image_url')
        .eq('id', item.item_id)
        .single();
      
      if (product && product.image_url) {
        imageUrl = product.image_url;
      } else {
        // If not found in products or product has no image, try experiences table
        const { data: experience } = await supabase
          .from('experiences')
          .select('image_url')
          .eq('id', item.item_id)
          .single();
        if (experience && experience.image_url) {
          imageUrl = experience.image_url;
        }
      }

      // Ensure local image paths are absolute from the root
      if (imageUrl && imageUrl !== '/placeholder.png' && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        imageUrl = '/' + imageUrl;
      }

      return { ...item, image_url: imageUrl };
    })
  );

  const order = { ...orderData, order_items: orderItemsWithImages } as any;

  return (
    <ReceiptPageClient 
      orderItems={order.order_items.map((item: any) => ({
        id: item.item_id,
        item_id: item.item_id,
        name: item.name,
        qty: item.qty,
        price: item.price,
        plan: item.plan
      }))}
      orderId={order.id}
    >
    <div className="bg-gray-50 min-h-screen font-sans flex items-center justify-center p-4 sm:p-6 lg:p-8 print:bg-white print:p-0">
      <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg p-8 print:shadow-none print:rounded-none">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="The Water Bar Logo" width={150} height={50} />
        </div>
        {/* Event Info Block */}

        <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">The Water Bar</h1>
            <p className="text-gray-500 mt-1">Your Digital Receipt & PINs</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-700">Order #{order.id.toString().substring(0, 8)}</h2>
            <p className="text-sm text-gray-500">
              Date: {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirmation Details</h3>
          {order.email ? (
            <>
              <p className="text-gray-700"><strong>Billed to:</strong> {order.email}</p>
              <p className="text-sm text-gray-500 mt-1">A confirmation email has been sent to this address.</p>
            </>
          ) : (
            <p className="text-amber-700 bg-amber-50 p-3 rounded-md">
              Your order is confirmed. The email address was not recorded for this transaction.
            </p>
          )}
        </div>

        <div className="flow-root mb-8">
          <ul role="list" className="-my-6 divide-y divide-gray-200">
            {order.order_items.map((item: any, index: number) => (
              <li key={index} className="flex py-6">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                  <Image
                    src={item.image_url || '/placeholder.png'}
                    alt={item.name}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                <div className="ml-4 flex flex-1 flex-col">
                  <div>
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <h3>{item.name}</h3>
                      <p className="ml-4 font-semibold">{formatCurrency(item.price * item.qty)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Quantity: {item.qty} {formatCurrency(item.price)}\n                      <br />\n                      {item.pin_code && (
                        <div className="mt-4">
                          <div className="text-center">
                            {Array.isArray(item.pin_code) ? (
                              <div className="space-y-3">
                                {item.pin_code.map((pin: string, index: number) => {
                                  const pinLabels = ['Entry', 'Drink', 'Wellness']; // Assuming fixed order
                                  return (
                                    <div key={pin} className="inline-block px-6 py-3 rounded-lg bg-blue-100 border-2 border-blue-400 mr-2">
                                      <div className="text-lg font-bold text-blue-800 tracking-widest">{pinLabels[index] || 'Your'} PIN</div>
                                      <div className="text-3xl font-extrabold text-blue-900 mt-1 mb-1" style={{ letterSpacing: '0.15em' }}>{pin}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="inline-block px-6 py-3 rounded-lg bg-blue-100 border-2 border-blue-400">
                                <div className="text-lg font-bold text-blue-800 tracking-widest">Your PIN</div>
                                <div className="text-3xl font-extrabold text-blue-900 mt-1 mb-1" style={{ letterSpacing: '0.15em' }}>{item.pin_code}</div>
                              </div>
                            )}
                            <div className="mt-2 text-blue-700 font-medium text-sm">You’ll need these PINs to claim your purchases at The Water Bar. Please have them ready.</div>
                          </div>
                        </div>
                      )}
                      {item.plan && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2">💧 Hydration Plan</h4>
                          <div className="text-sm text-blue-800">
                            {item.plan.daily_target && (
                              <p className="mb-2">Daily Target: {item.plan.daily_target}ml</p>
                            )}
                            {item.plan.schedule && item.plan.schedule.length > 0 && (
                              <div className="mb-2">
                                <p className="font-medium mb-1">Schedule:</p>
                                <ul className="space-y-1 ml-4">
                                  {item.plan.schedule.map((step: any, idx: number) => (
                                    <li key={idx} className="flex justify-between">
                                      <span>{step.time} - {step.amount}ml</span>
                                      {step.product && <span className="text-blue-600">{step.product}</span>}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {item.plan.notes && (
                              <p className="italic mt-2">{item.plan.notes}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between text-lg font-bold text-gray-900">
            <p>Total</p>
            <p>{formatCurrency(order.total)}</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How to Claim:</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Visit any of our partner venues to redeem your items.</li>
            <li>Present the PIN code for each item to the staff at the venue.</li>
            <li>The staff will confirm your PIN and hand over your purchase. Enjoy!</li>
          </ul>
        </div>

        {/* Personal Coach Integration */}
        <div className="mt-8 print:hidden">
          <OrderReceiptButton 
            orderItems={order.order_items.map((item: any) => ({
              id: item.item_id,
              product_id: item.item_id,
              name: item.name,
              quantity: item.qty,
              price: item.price,
              timing: item.plan?.timing,
              dosage: item.plan?.dosage,
              frequency: item.plan?.frequency,
              contraindications: item.plan?.contraindications || [],
              venueIntegration: item.plan?.venueIntegration
            }))}
            orderId={order.id}
            className="mb-6"
          />
        </div>

        <div className="mt-8 text-center print:hidden flex justify-center items-center space-x-4">
          <PrintButton />
          <SendEmailButton orderId={order.id} />
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Thank you for your purchase!</p>
          <p>If you have any questions, please contact us.</p>
          <a href="https://www.instagram.com/thewaterbarglobal/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-2 inline-block">
            Follow us on Instagram
          </a>
        </div>
      </div>
    </div>
    </ReceiptPageClient>
  );
}
