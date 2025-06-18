"use client"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, XCircle } from "lucide-react"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface CartSummaryProps {
  cartItems: CartItem[]
  total: number
  onRemoveItemAction: (itemId: string) => void
}

export function CartSummary({ cartItems, total, onRemoveItemAction }: CartSummaryProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || "Unable to start checkout")
      }
    } catch (err) {
      alert("Network error starting checkout")
    } finally {
      setLoading(false)
    }
  }
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="lg"
          className="fixed bottom-6 right-6 rounded-full shadow-xl bg-amber-700 text-white hover:bg-amber-800 transition-all duration-300 h-14 px-6 text-base"
        >
          <ShoppingCart className="mr-2 size-5" />
          View Cart ({cartItems.reduce((acc, item) => acc + item.quantity, 0)}) - ${total.toFixed(2)}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-md bg-cream-50 text-stone-800 border-l-stone-200">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold text-amber-900">Your Order</SheetTitle>
        </SheetHeader>
        <Separator className="my-4 bg-stone-300/70" />
        {cartItems.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-stone-500">Your cart is empty.</div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-stone-700">
                      {item.name} <span className="text-stone-400">({item.quantity})</span>
                    </p>
                    <p className="text-sm text-stone-500">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveItemAction(item.id)}
                    className="text-stone-500 hover:text-red-600"
                  >
                    <XCircle className="size-5" />
                    <span className="sr-only">Remove item</span>
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <Separator className="my-4 bg-stone-300/70" />
        <div className="flex items-center justify-between text-xl font-bold text-amber-800">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <Button
          size="lg"
          className="w-full mt-6 bg-amber-700 text-white hover:bg-amber-800 h-12 text-lg"
          onClick={handleCheckout}
          disabled={loading || cartItems.length === 0}
        >
          {loading ? "Redirecting..." : "Proceed to Checkout"}
        </Button>
      </SheetContent>
    </Sheet>
  )
}
