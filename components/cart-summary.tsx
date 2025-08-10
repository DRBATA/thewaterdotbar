"use client"
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button"
import { useEffect, useRef, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, XCircle } from "lucide-react"
import { useVolumeDiscount } from "@/hooks/use-volume-discount"
import { CopyDiscountCode } from "./copy-discount-code"
import { DiscountConfetti } from "./discount-confetti"
import { logEvent } from "@/lib/analytics"

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
  onClearCart?: () => void
}

export function CartSummary({ cartItems, total, onRemoveItemAction, onClearCart }: CartSummaryProps) {
  const [loading, setLoading] = useState(false)
  const [clearingCart, setClearingCart] = useState(false)
  const [isConfirmationModalOpen, setConfirmationModalOpen] = useState(false)
  const { tier, subtotal, discount, total: discountedTotal } = useVolumeDiscount(cartItems)
  const [showConfetti, setShowConfetti] = useState(false)
  const prevTierRef = useRef(tier)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const prevMinItems = prevTierRef.current?.minItems ?? 0
    const currentMinItems = tier?.minItems ?? 0

    if (currentMinItems > prevMinItems) {
      setShowConfetti(true)
    }
    
    prevTierRef.current = tier
  }, [tier])

  // Add RPC event listeners for agent cart actions
  useEffect(() => {
    const handleAgentAddToCart = async (event: any) => {
      console.log('🛒 Agent triggered add to cart', event.detail);
      console.log('🔧 Cart Summary received agent add-to-cart event');
      const { product_id, product_name, quantity = 1 } = event.detail || {};
      
      if (!product_id) {
        console.error('Missing product_id in agent add-to-cart event');
        return;
      }
      
      try {
        const response = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: product_id,
            qty: quantity
          })
        });
        
        if (response.ok) {
          console.log(`✅ Added ${product_name || product_id} to cart`);
          // Optionally refresh cart display here if needed
          window.location.reload(); // Simple refresh to show updated cart
        } else {
          console.error('Failed to add item to cart:', await response.text());
        }
      } catch (error) {
        console.error('Error adding item to cart:', error);
      }
    };
    
    const handleAgentRemoveFromCart = async (event: any) => {
      console.log('🛒 Agent triggered remove from cart', event.detail);
      const { product_id, product_name } = event.detail || {};
      
      if (!product_id) {
        console.error('Missing product_id in agent remove-from-cart event');
        return;
      }
      
      try {
        // Call the remove handler passed as prop
        if (onRemoveItemAction) {
          onRemoveItemAction(product_id);
          console.log(`✅ Removed ${product_name || product_id} from cart`);
        }
      } catch (error) {
        console.error('Error removing item from cart:', error);
      }
    };
    
    const handleAgentViewCart = () => {
      console.log('🛒 Agent triggered view cart - opening cart modal');
      setIsOpen(true);
    };
    
    const handleAgentCloseCart = () => {
      console.log('🛒 Agent triggered close cart - closing cart modal');
      setIsOpen(false);
    };
    
    const handleAgentClearCart = () => {
      console.log('🛒 Agent triggered clear cart - clearing all items');
      // Trigger the clear cart button
      const clearButton = document.querySelector('[data-clear-cart-button]') as HTMLButtonElement;
      if (clearButton) {
        clearButton.click();
      } else {
        console.warn('Could not find clear cart button');
      }
    };
    
    const handleAgentCheckout = () => {
      console.log('🛒 Agent triggered checkout - proceeding to Stripe payment');
      if (tier) {
        setConfirmationModalOpen(true);
      } else {
        handleCheckout();
      }
    };
    
    const handleAgentCopyDiscount = () => {
      console.log('🛒 Agent triggered copy discount code');
      // Trigger the copy discount code component
      const copyButton = document.querySelector('[data-copy-discount-trigger]') as HTMLButtonElement;
      if (copyButton) {
        copyButton.click();
      }
    };
    
    // Add event listeners
    window.addEventListener('agent-add-to-cart', handleAgentAddToCart);
    window.addEventListener('agent-remove-from-cart', handleAgentRemoveFromCart);
    window.addEventListener('agent-view-cart', handleAgentViewCart);
    window.addEventListener('agent-close-cart', handleAgentCloseCart);
    window.addEventListener('agent-clear-cart', handleAgentClearCart);
    window.addEventListener('agent-checkout', handleAgentCheckout);
    window.addEventListener('agent-copy-discount', handleAgentCopyDiscount);
    
    console.log('🛒 Cart event listeners registered successfully');
    
    // Cleanup
    return () => {
      window.removeEventListener('agent-add-to-cart', handleAgentAddToCart);
      window.removeEventListener('agent-remove-from-cart', handleAgentRemoveFromCart);
      window.removeEventListener('agent-view-cart', handleAgentViewCart);
      window.removeEventListener('agent-close-cart', handleAgentCloseCart);
      window.removeEventListener('agent-clear-cart', handleAgentClearCart);
      window.removeEventListener('agent-checkout', handleAgentCheckout);
      window.removeEventListener('agent-copy-discount', handleAgentCopyDiscount);
      console.log('🛒 Cart event listeners cleaned up');
    };
  }, []); // Remove tier dependency to ensure listeners are always registered

  const handleConfettiComplete = () => {
    setShowConfetti(false)
  }

  const handleClearCart = async () => {
    if (clearingCart || cartItems.length === 0) return
    setClearingCart(true)
    try {
      const response = await fetch("/api/cart/clear", { method: "POST", headers: { "Content-Type": "application/json" } })
      if (response.ok && onClearCart) onClearCart()
      else console.error("Failed to clear cart")
    } catch (error) {
      console.error("Error clearing cart:", error)
    } finally {
      setClearingCart(false)
    }
  }

  const handleCheckout = async () => {
    logEvent({
      event_name: "checkout_initiated",
      step_name: "checkout",
      metadata: { cartTotal: total, itemCount: cartItems.reduce((acc, item) => acc + item.quantity, 0) },
    })
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || "Unable to start checkout")
    } catch (err) {
      alert("Network error starting checkout")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DiscountConfetti fire={showConfetti} onComplete={handleConfettiComplete} tier={tier} />
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="default"
            size="lg"
            className={`fixed top-4 right-4 rounded-full shadow-lg bg-teal-400/90 text-white hover:bg-teal-500 transition-all duration-300 py-3 ${cartItems.length === 0 ? 'px-4 w-14 justify-center' : 'px-6 w-auto'} text-base font-semibold`}
            aria-label={cartItems.length === 0 ? 'Open cart' : 'View cart with items'}
          >
            <ShoppingCart className="size-5" />
            {cartItems.length > 0 && (
              <span className="ml-2 flex items-center">
                <span>View Cart ({cartItems.reduce((acc, item) => acc + item.quantity, 0)}) - {formatCurrency(discountedTotal)}</span>
                {tier && <span className="ml-2 rounded-full bg-lime-300 px-2 py-1 text-xs font-bold text-lime-900">{tier.rate * 100}% OFF</span>}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col w-full sm:max-w-md bg-white/10 backdrop-blur-xl text-white border-l border-white/30">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-white">Your Order</SheetTitle>
          </SheetHeader>
          <Separator className="my-4 bg-white/30" />
          {cartItems.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-stone-500">Your cart is empty.</div>
          ) : (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-stone-100">{item.name} <span className="text-stone-300">({item.quantity})</span></p>
                      <p className="text-sm text-stone-300">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onRemoveItemAction(item.id)} className="text-stone-300 hover:text-red-500">
                      <XCircle className="size-5" />
                      <span className="sr-only">Remove item</span>
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          <Separator className="my-4 bg-white/30" />
          <div className="space-y-2 text-white">
            <div className="flex items-center justify-between text-md">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {tier && (
              <div className="flex items-center justify-between text-md text-lime-300">
                <span>Discount ({tier.rate * 100}%)</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <Separator className="my-2 bg-white/30" />
            <div className="flex items-center justify-between text-xl font-bold">
              <span>Total</span>
              <span>{formatCurrency(discountedTotal)}</span>
            </div>
          </div>
          <CopyDiscountCode tier={tier} />

          {tier && (
            <div className="mt-4 text-center text-sm text-amber-200 bg-amber-900/50 p-3 rounded-lg border border-amber-500/50">
              <p className="font-semibold">Remember to apply your discount code on the next screen!</p>
            </div>
          )}
          {cartItems.length > 0 && (
            <Button variant="outline" className="w-full mt-3 border-teal-500 text-teal-300 hover:bg-teal-500/20" onClick={handleClearCart} disabled={clearingCart}>
              {clearingCart ? "Clearing..." : "Clear Cart"}
            </Button>
          )}
          <Button 
            size="lg" 
            className="w-full mt-6 bg-teal-500 text-white hover:bg-teal-600 h-12 text-lg" 
            onClick={() => tier ? setConfirmationModalOpen(true) : handleCheckout()}
            disabled={loading || cartItems.length === 0}
          >
            {loading ? "Redirecting..." : "Proceed to Checkout"}
          </Button>
        {isConfirmationModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-gray-800 border border-teal-500/50 p-8 rounded-2xl shadow-2xl text-white max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4 text-teal-300">One Last Step!</h2>
              <p className="mb-6 text-gray-300">Have you copied your discount code? Remember to paste it on the next screen to get your discount.</p>
              <div className="flex justify-end space-x-4">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white" onClick={() => setConfirmationModalOpen(false)}>Cancel</Button>
                <Button className="bg-teal-500 text-white hover:bg-teal-600" onClick={() => {
                  setConfirmationModalOpen(false);
                  handleCheckout();
                }}>
                  Yes, Proceed to Checkout
                </Button>
              </div>
            </div>
          </div>
        )}
        </SheetContent>
      </Sheet>
    </>
  )
}