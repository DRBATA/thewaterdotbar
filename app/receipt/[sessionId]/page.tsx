import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Image from "next/image";
import PrintButton from './PrintButton';

type ReceiptPageProps = {
  params: {
    sessionId: string;
  };
};

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { sessionId } = params;

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      created_at,
      total,
      email,
      order_items (
        quantity,
        price,
        products (
          name,
          description,
          image_url
        )
      )
    `
    )
    .eq("stripe_session_id", sessionId)
    .limit(1);

  if (error || !orders || orders.length === 0) {
    console.error("Error fetching order for receipt:", error);
    notFound();
  }

  const order = orders[0] as any;

  return (
    <div className="bg-gray-50 min-h-screen font-sans flex items-center justify-center p-4 sm:p-6 lg:p-8 print:bg-white print:p-0">
      <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg p-8 print:shadow-none print:rounded-none">
        <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">The Water Bar</h1>
            <p className="text-gray-500 mt-1">Order Receipt</p>
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
                    src={item.products.image_url || '/placeholder.png'}
                    alt={item.products.name}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                <div className="ml-4 flex flex-1 flex-col">
                  <div>
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <h3>{item.products.name}</h3>
                      <p className="ml-4 font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.quantity} x ${item.price.toFixed(2)}
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
            <p>${order.total.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="mt-10 text-center print:hidden">
            <PrintButton />
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
            <p>Thank you for your purchase!</p>
            <p>If you have any questions, please contact us.</p>
        </div>
      </div>
    </div>
  );
}
