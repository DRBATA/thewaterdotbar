'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Order {
  id: string
  created_at: string
  total_amount: number
  status: string
  customer_name?: string
  order_items: {
    quantity: number
    products: {
      name: string
    }
  }[]
}

export default function StaffDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        total_amount,
        status,
        customer_name,
        order_items (
          quantity,
          products (
            name
          )
        )
      `)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setOrders(data)
    }
    setLoading(false)
  }

  const markAsFulfilled = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'fulfilled' })
      .eq('id', orderId)

    if (!error) {
      // Remove from list after fulfilling
      setOrders(orders.filter(o => o.id !== orderId))
    }
  }

  useEffect(() => {
    fetchOrders()

    // Set up real-time subscription for new orders
    const channel = supabase
      .channel('orders')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'orders',
        filter: 'status=eq.paid'
      }, (payload) => {
        // Fetch full order details when new order arrives
        fetchOrders()
        // Play notification sound
        const audio = new Audio('/notification.mp3')
        audio.play().catch(() => {})
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Staff Dashboard - Paid Orders</h1>
        
        {loading ? (
          <div className="text-center py-8">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No pending orders
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Order #{order.id.slice(-6).toUpperCase()}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                    {order.customer_name && (
                      <p className="text-sm font-medium mt-1">{order.customer_name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{order.total_amount} AED</p>
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm mt-2">
                      PAID
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4 mb-4">
                  <h4 className="font-medium mb-2">Items:</h4>
                  {order.order_items.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span>{item.quantity}x {item.products.name}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => markAsFulfilled(order.id)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Mark as Fulfilled ✓
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={fetchOrders}
            className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            Refresh Orders
          </button>
        </div>
      </div>
    </div>
  )
}
