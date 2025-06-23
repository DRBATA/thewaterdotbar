import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Image from "next/image";
import PrintButton from './PrintButton.tsx';

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
        claimed_at
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

  // DEBUG: Output order items for inspection
  // Remove this after debugging
  console.log("Order Items:", order.order_items);

  return (
    <>
      <pre style={{background:'#f1f1f1',color:'#333',padding:'1em',marginBottom:'2em',borderRadius:'8px',fontSize:'0.9em',overflowX:'auto'}}>{JSON.stringify(order.order_items, null, 2)}</pre>

    <div className="bg-gray-50 min-h-screen font-sans flex items-center justify-center p-4 sm:p-6 lg:p-8 print:bg-white print:p-0">
      <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg p-8 print:shadow-none print:rounded-none">
  {/* Event Info Block */}
  <div className="mb-8 p-6 rounded-lg bg-yellow-50 border-l-4 border-yellow-400">
    <h2 className="text-2xl font-bold text-yellow-900 mb-2">The Morning Party: Frequency Calibration Pass</h2>
    <div className="text-lg font-semibold text-yellow-800 mb-1">Sunday, June 29, 10 AM – 1 PM</div>
    <div className="text-md text-yellow-700 mb-2">AOI x Johny Dar Experience<br />Al Khayat Avenue, Al Quoz Industrial Area 1, Plot 364-191<br />Old Community, Warehouse 4, Dubai</div>
    <div className="mt-2 text-yellow-800 font-medium">This free ticket <span className='font-bold'>includes access to the rave only</span>. It <span className='font-bold'>does not include any drinks or premium experiences</span>.</div>
  </div>
        <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">The Water Bar</h1>
            <p className="text-gray-500 mt-1">Open Ticket - Show at Event</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-700">Order #{order.id.toString().substring(0, 8)}</h2>
            <p className="text-sm text-gray-500">
              Date: {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-gray-700"><strong>Billed to:</strong> {order.email}</p>
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
      <div className="inline-block px-6 py-3 rounded-lg bg-blue-100 border-2 border-blue-400">
        <div className="text-lg font-bold text-blue-800 tracking-widest">Your PIN</div>
        <div className="text-3xl font-extrabold text-blue-900 mt-1 mb-1" style={{ letterSpacing: '0.15em' }}>{item.pin_code}</div>
      </div>
      <div className="mt-2 text-blue-700 font-medium text-sm">You’ll need this PIN to claim your purchase at The Water Bar. Please have it ready.</div>
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
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Important Event Information:</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Please present this ticket (digital or printed) and be prepared to confirm your email address ({order.email}) upon arrival.</li>
            <li>To ensure you can schedule all your booked experiences, we advise arriving 15-20 minutes before your first desired session.</li>
            <li>We look forward to welcoming you to The Water Bar!</li>
          </ul>
        </div>

        <div className="mt-8 text-center print:hidden">
          <PrintButton />
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Thank you for your purchase!</p>
          <p>If you have any questions, please contact us.</p>
        </div>
      </div>
    </div>
    </>
  );
}
