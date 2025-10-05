"use client"
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button"
import { useEffect, useRef, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, XCircle, QrCode } from "lucide-react"
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

interface Venue {
  id: string
  name: string
  address: string
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
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [venues, setVenues] = useState<Venue[]>([])
  const [showQR, setShowQR] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | null>(null)

  // Listen for cart-updated events to trigger parent component refresh
  useEffect(() => {
    const handleCartUpdate = () => {
      console.log("🛒 CartSummary: cart-updated event received")
      // Trigger parent component to refresh cart data
      window.dispatchEvent(new Event('cart-refresh-needed'))
    }

    window.addEventListener('cart-updated', handleCartUpdate)
    
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate)
    }
  }, [])

  // Fetch venues on component mount
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await fetch('/api/venues')
        if (response.ok) {
          const venuesData = await response.json()
          setVenues(venuesData)
        }
      } catch (error) {
        console.error('Error fetching venues:', error)
      }
    }
    fetchVenues()
  }, [])

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
          // Call the refresh function if available, or trigger a cart update
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            // Dispatch a custom event to signal cart update
            window.dispatchEvent(new Event('cart-updated'));
          }
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
      console.log('🛒 Agent triggered checkout - proceeding to payment');
      if (tier) {
        setConfirmationModalOpen(true);
      } else {
        handleCheckout();
      }
    };
    
    const handleAgentSetVenue = (event: any) => {
      console.log('🛒 Agent set venue', event.detail);
      const { venue_id, venue_name } = event.detail || {};
      
      if (venue_id) {
        const venue = venues.find(v => v.id === venue_id);
        if (venue) {
          setSelectedVenue(venue);
          console.log(`✅ Venue set to: ${venue.name}`);
        } else {
          // If venue not found in list, create a basic venue object
          setSelectedVenue({ id: venue_id, name: venue_name || 'Selected Venue', address: '' });
        }
      } else {
        setSelectedVenue(null);
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

    const handleAgentGetCartData = async () => {
      console.log('🛒 Agent requested cart data - fetching current cart');
      try {
        // Fetch current cart data from API
        const response = await fetch('/api/cart', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const cartData = await response.json();
          console.log('🛒 Sending cart data back to agent:', cartData);
          
          // Dispatch response event back to hedra frontend
          window.dispatchEvent(new CustomEvent('agent-cart-data-response', {
            detail: cartData
          }));
        } else {
          console.error('Failed to fetch cart data:', response.statusText);
          // Send empty cart response on error
          window.dispatchEvent(new CustomEvent('agent-cart-data-response', {
            detail: { items: [], total: 0 }
          }));
        }
      } catch (error) {
        console.error('Error fetching cart data:', error);
        // Send empty cart response on error
        window.dispatchEvent(new CustomEvent('agent-cart-data-response', {
          detail: { items: [], total: 0 }
        }));
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
    window.addEventListener('agent-get-cart-data', handleAgentGetCartData);
    window.addEventListener('agent-set-venue', handleAgentSetVenue);
    
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
      window.removeEventListener('agent-get-cart-data', handleAgentGetCartData);
      window.removeEventListener('agent-set-venue', handleAgentSetVenue);
      console.log('🛒 Cart event listeners cleaned up');
    };
  }, [onRemoveItemAction, onClearCart]);

  const handleConfettiComplete = () => {
    setShowConfetti(false)
  }

  const handleClearCart = async () => {
    setClearingCart(true)
    try {
      const response = await fetch("/api/cart/clear", {
        method: "POST",
      })
      if (response.ok) {
        onClearCart?.()
        setIsOpen(false)
        // Trigger cart refresh event to reload with new cart_header
        window.dispatchEvent(new Event('cart-updated'))
      }
    } catch (error) {
      console.error("Error clearing cart:", error)
    } finally {
      setClearingCart(false)
    }
  }

  const generateQRCode = (url: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&format=png&ecc=M&data=${encodeURIComponent(url)}`;
  };

  // Poll for payment status when QR is shown
  useEffect(() => {
    if (!showQR || !paymentUrl || paymentStatus === 'paid') return

    const checkPaymentStatus = async () => {
      // Extract session ID from payment URL
      const urlParts = paymentUrl.split('/')
      const sessionId = urlParts[urlParts.length - 1].split('?')[0]
      
      try {
        const response = await fetch(`/api/stripe/check-payment?session_id=${sessionId}`)
        const data = await response.json()
        
        if (data.status === 'paid') {
          setPaymentStatus('paid')
          // Play success sound
          const audio = new Audio('/notification.mp3')
          audio.play().catch(() => {})
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
      }
    }

    // Check immediately, then every 3 seconds
    checkPaymentStatus()
    const interval = setInterval(checkPaymentStatus, 3000)

    return () => clearInterval(interval)
  }, [showQR, paymentUrl, paymentStatus])

  const handleCheckout = async () => {
    logEvent({
      event_name: "checkout_initiated",
      step_name: "checkout",
      metadata: { cartTotal: total, itemCount: cartItems.reduce((acc, item) => acc + item.quantity, 0) },
    })
    if (loading) return
    setLoading(true)
    try {
      // Flow 1: Pay on This Device - redirect to Stripe
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

  const handleGenerateCustomerQR = async () => {
    logEvent({
      event_name: "generate_customer_qr",
      step_name: "checkout",
      metadata: { cartTotal: total },
    })
    if (loading) return
    setLoading(true)
    try {
      // Flow 2: Generate QR for Customer to Pay
      // Include assessment data from sessionStorage
      const assessmentData = typeof window !== 'undefined' && sessionStorage.getItem('hydrationAssessment')
        ? JSON.parse(sessionStorage.getItem('hydrationAssessment')!)
        : null

      const res = await fetch("/api/stripe/checkout", { 
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          venue_id: selectedVenue?.id,
          assessmentData // Include assessment for customer's device
        })
      })
      const data = await res.json()
      if (data.url) {
        setPaymentUrl(data.url)
        setShowQR(true)
        // Clear staff device Dexie after QR generated
        if (typeof window !== 'undefined' && sessionStorage.getItem('hydrationAssessment')) {
          sessionStorage.removeItem('hydrationAssessment')
        }
      } else {
        alert(data.error || "Unable to generate QR code")
      }
    } catch (err) {
      alert("Network error generating QR code")
    } finally {
      setLoading(false)
    }
  }

  const handleSharePlanQR = async () => {
    logEvent({
      event_name: "share_plan_qr",
      step_name: "cart_transfer",
      metadata: { cartTotal: total },
    })
    if (loading) return
    setLoading(true)
    try {
      // Flow 3: Share Plan Only (No Payment)
      // Get assessment data from sessionStorage
      const assessmentData = typeof window !== 'undefined' && sessionStorage.getItem('hydrationAssessment')
        ? JSON.parse(sessionStorage.getItem('hydrationAssessment')!)
        : null

      const res = await fetch("/api/cart/create-transfer", { 
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          venue_id: selectedVenue?.id || 'AOI',
          assessmentData
        })
      })
      const data = await res.json()
      if (data.transferUrl) {
        setPaymentUrl(data.transferUrl)
        setShowQR(true)
      } else {
        alert(data.error || "Unable to create plan transfer")
      }
    } catch (err) {
      alert("Network error creating plan transfer")
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
        <SheetContent className="flex flex-col w-full sm:max-w-md bg-white/10 backdrop-blur-xl text-white border-l border-white/30" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}>
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-white">Your Order</SheetTitle>
          </SheetHeader>
          
          {/* Venue Selector */}
          <div className="mb-4">
            <label className="text-sm text-white/70 mb-2 block">Select Venue (Optional)</label>
            <select
              value={selectedVenue?.id || ''}
              onChange={async (e) => {
                const venue = venues.find(v => v.id === e.target.value);
                setSelectedVenue(venue || null);
                
                // Update cart header with venue_id in database
                if (venue) {
                  try {
                    await fetch('/api/cart/update-venue', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ venue_id: venue.id })
                    });
                  } catch (error) {
                    console.error('Failed to update cart venue:', error);
                  }
                }
              }}
              className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all"
              style={{ WebkitAppearance: 'menulist', appearance: 'menulist' }}
            >
              <option value="">Online Order (Delivery)</option>
              {venues.map(venue => (
                <option key={venue.id} value={venue.id} className="bg-gray-800 text-white">
                  {venue.name}
                </option>
              ))}
            </select>
            {selectedVenue && (
              <p className="text-xs text-teal-300 mt-1">
                📍 {selectedVenue.address}
              </p>
            )}
          </div>
          
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
          {/* Payment Options */}
          <div className="space-y-3 mt-6" style={{ marginBottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))' }}>
            <Button 
              size="lg" 
              className="w-full bg-teal-500 text-white hover:bg-teal-600 h-12 text-lg" 
              onClick={() => tier ? setConfirmationModalOpen(true) : handleCheckout()}
              disabled={loading || cartItems.length === 0}
            >
              {loading ? "Processing..." : "💳 Pay on This Device"}
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="w-full border-teal-500 text-teal-300 hover:bg-teal-500/20 h-12 text-lg" 
              onClick={() => handleGenerateCustomerQR()}
              disabled={loading || cartItems.length === 0}
            >
              📱 Generate QR for Customer
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="w-full border-purple-500 text-purple-300 hover:bg-purple-500/20 h-12 text-lg" 
              onClick={() => handleSharePlanQR()}
              disabled={loading || cartItems.length === 0}
            >
              🔗 Share Plan Only (No Payment)
            </Button>
          </div>
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
        
        {/* QR Code Modal */}
        {showQR && paymentUrl && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
              <div className="text-center">
                {paymentStatus === 'paid' ? (
                  <>
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-2xl font-bold mb-2 text-green-600">Payment Received!</h3>
                    <p className="text-gray-600 mb-6">Order has been paid successfully</p>
                    <Button
                      onClick={() => {
                        setShowQR(false)
                        setPaymentStatus(null)
                        // Clear cart and refresh
                        onClearCart?.()
                        // Clear AI questionnaire data
                        sessionStorage.removeItem("hydrationAssessment")
                        window.location.reload()
                      }}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Start New Order
                    </Button>
                  </>
                ) : (
                  <>
                    <QrCode className="w-8 h-8 mx-auto mb-4 text-teal-600" />
                    <h3 className="text-xl font-bold mb-2 text-gray-900">Payment QR Code</h3>
                    <p className="text-gray-600 mb-2">Scan to pay at {selectedVenue?.name}</p>
                    <p className="text-sm text-gray-500 mb-6">Total: {formatCurrency(discountedTotal)}</p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <img 
                        src={generateQRCode(paymentUrl)} 
                        alt="Payment QR Code"
                        className="mx-auto max-w-full h-auto w-64 h-64"
                      />
                    </div>
                    
                    <p className="text-xs text-gray-400 mb-4">Waiting for payment...</p>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowQR(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Close
                      </Button>
                      <Button
                        onClick={() => window.open(paymentUrl, '_blank')}
                        className="flex-1 bg-teal-600 hover:bg-teal-700"
                      >
                        Open Link
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        </SheetContent>
      </Sheet>
    </>
  )
}