'use client'

import { useEffect, useState } from 'react'

export const runtime = "edge";

interface Props {
  searchParams: { session?: string };
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export default function SuccessPage({ searchParams }: Props) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch order details if session ID provided
    if (searchParams.session) {
      fetch(`/api/orders/get?session_id=${searchParams.session}`)
        .then(res => res.json())
        .then(data => {
          if (data.items) {
            setOrderItems(data.items)
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [searchParams.session])

  const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-teal-50 to-white">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Show this screen to staff to collect your order</p>
        </div>

        {loading ? (
          <div className="text-center py-4">Loading order details...</div>
        ) : orderItems.length > 0 ? (
          <div className="border-t border-b border-gray-200 py-4 mb-6">
            <h2 className="font-semibold text-lg mb-3">Your Order:</h2>
            {orderItems.map((item, index) => (
              <div key={index} className="flex justify-between py-2">
                <span>{item.quantity}x {item.name}</span>
                <span className="font-medium">{item.price * item.quantity} AED</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 mt-3 border-t font-bold text-lg">
              <span>Total Paid:</span>
              <span className="text-green-600">{total} AED</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            Order details will appear here
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Staff has been notified of your order
          </p>
          <button
            onClick={() => window.close()}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors duration-150"
          >
            Close This Window
          </button>
        </div>
      </div>
    </main>
  );
}
