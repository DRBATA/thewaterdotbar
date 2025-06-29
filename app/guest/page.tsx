import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

interface SearchParams {
  key?: string;
  q?: string; // Search query
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
  let query = supabase
    .from("orders")
    .select("id, email, total, created_at, order_items:order_items(name, qty, pin_code)")
    .order("created_at", { ascending: false });

  // Add search filter if 'q' param exists
  if (searchParams.q) {
    query = query.ilike("email", `%${searchParams.q}%`);
  }

  const { data: orders, error } = await query;

  if (error) throw new Error(error.message);

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Guest Orders</h1>

      {/* Search Form */}
      <form method="get" className="mb-6">
        <input type="hidden" name="key" value={searchParams.key} />
        <div className="flex">
          <input
            type="text"
            name="q"
            defaultValue={searchParams.q || ""}
            placeholder="Search by email..."
            className="w-full p-2 border rounded-l-md shadow-sm"
          />
          <button type="submit" className="bg-stone-700 text-white p-2 rounded-r-md">
            Search
          </button>
        </div>
      </form>

      {orders?.length === 0 && <p>No matching orders found.</p>}
      <ul className="space-y-6">
        {orders?.map((order: any) => (
          <li key={order.id} className="border rounded p-4 bg-white shadow-sm">
            <div className="flex justify-between mb-2">
              <span className="font-medium">{order.email ?? "No email"}</span>
              <span>{formatCurrency(Number(order.total))}</span>
            </div>
            <ul className="list-disc list-inside text-sm text-stone-700 space-y-2 mt-3">
              {order.order_items.map((item: any, idx: number) => (
                <li key={idx}>
                  {item.qty}× {item.name}
                  {item.pin_code && (
                    <div className="mt-1">
                      <span className="font-mono text-xs bg-stone-100 p-1 rounded">
                        PIN: {item.pin_code}
                      </span>
                    </div>
                  )}
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
