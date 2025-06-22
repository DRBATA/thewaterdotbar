import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const runtime = "edge";

interface SearchParams {
  key?: string;
}

export default async function GuestList({ searchParams }: { searchParams: SearchParams }) {
  // simple gate using ?key=ADMIN_KEY
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || searchParams.key !== adminKey) {
    return (
      <main className="min-h-screen flex items-center justify-center text-stone-600">
        <div>
          <h1 className="text-xl font-semibold mb-2">Access denied</h1>
          <p>Invalid or missing key query parameter.</p>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, email, total, created_at, order_items:order_items(name, qty)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Guest Orders</h1>
      {orders?.length === 0 && <p>No orders yet.</p>}
      <ul className="space-y-6">
        {orders?.map((order) => (
          <li key={order.id} className="border rounded p-4 bg-white shadow-sm">
            <div className="flex justify-between mb-2">
              <span className="font-medium">{order.email ?? "No email"}</span>
              <span>{formatCurrency(Number(order.total))}</span>
            </div>
            <ul className="list-disc list-inside text-sm text-stone-700">
              {order.order_items.map((item: any, idx: number) => (
                <li key={idx}>
                  {item.qty}× {item.name}
                </li>
              ))}
            </ul>
            <p className="text-xs text-stone-500 mt-2">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
