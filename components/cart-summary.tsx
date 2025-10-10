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
  
  // Poll for payment completion (Flow 2)
  useEffect(() => {
    if (!showQR || !paymentUrl || paymentStatus === 'paid') return
    
    // Extract session_id from Stripe checkout URL
    const sessionIdMatch = paymentUrl.match(/\/pay\/([^?]+)/)
    if (!sessionIdMatch) return
    
    const stripeSessionId = sessionIdMatch[1]
    
    const pollPayment = setInterval(async () => {
      try {
        // Check Stripe session status
        const res = await fetch(`/api/stripe/check-session?session_id=${stripeSessionId}`)
        const data = await res.json()
        
        if (data.payment_status === 'paid' && data.order_id) {
          clearInterval(pollPayment)
          setPaymentStatus('paid')
          
          // Send email using OUTPUT recommendations from sessionStorage
          const recommendations = sessionStorage.getItem('hydrationOutputRecommendations')
          if (recommendations) {
            try {
              await fetch('/api/send-receipt-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: data.order_id,
                  customerEmail: data.customer_email,
                  assessmentData: JSON.parse(recommendations)
                })
              })
              console.log('✅ Email sent with recommendations')
            } catch (emailError) {
              console.error('Failed to send email:', emailError)
            }
          }
          
          // Now clear OUTPUT recommendations
          sessionStorage.removeItem('hydrationOutputRecommendations')
        }
      } catch (error) {
        console.error('Payment poll error:', error)
      }
    }, 2000) // Poll every 2 seconds
    
    return () => clearInterval(pollPayment)
  }, [showQR, paymentUrl, paymentStatus])

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
      // Get OUTPUT recommendations if they exist (for email)
      const outputRecommendations = typeof window !== 'undefined' && sessionStorage.getItem('hydrationOutputRecommendations')
        ? JSON.parse(sessionStorage.getItem('hydrationOutputRecommendations')!)
        : null
      
      console.log('🔍 CHECKOUT: Found assessment recommendations?', !!outputRecommendations)
      if (outputRecommendations) {
        console.log('📋 Recommendations:', {
          drinks: outputRecommendations.recommended_drinks?.length,
          meals: outputRecommendations.recommended_meals?.length
        })
      }

      const res = await fetch("/api/stripe/checkout", { 
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          venue_id: selectedVenue?.id,
          assessmentData: outputRecommendations // Pass OUTPUT for email (direct payment)
        })
      })
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
      // Get BOTH INPUT and OUTPUT from sessionStorage
      const inputContext = typeof window !== 'undefined' && sessionStorage.getItem('hydrationInputContext')
        ? JSON.parse(sessionStorage.getItem('hydrationInputContext')!)
        : null
      
      const outputRecommendations = typeof window !== 'undefined' && sessionStorage.getItem('hydrationOutputRecommendations')
        ? JSON.parse(sessionStorage.getItem('hydrationOutputRecommendations')!)
        : null

      console.log('🔍 QR GENERATION: Assessment data check', {
        hasInput: !!inputContext,
        hasOutput: !!outputRecommendations,
        drinks: outputRecommendations?.recommended_drinks?.length,
        meals: outputRecommendations?.recommended_meals?.length
      })

      // Combine both for cart_headers storage
      const assessmentBundle = {
        input: inputContext,     // For customer download
        output: outputRecommendations  // For email display
      }

      const res = await fetch("/api/stripe/checkout", { 
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          venue_id: selectedVenue?.id,
          assessmentData: assessmentBundle // BOTH input and output
        })
      })
      const data = await res.json()
      if (data.url) {
        setPaymentUrl(data.url)
        setShowQR(true)
        
        // FLOW 2 CLEANUP: Clear staff device after successful transfer to cloud
        if (typeof window !== 'undefined') {
          // 1. Clear ALL sessionStorage (both INPUT and OUTPUT transferred to cart_headers)
          sessionStorage.removeItem('hydrationInputContext')
          sessionStorage.removeItem('hydrationProfile')
          sessionStorage.removeItem('hydrationMeals')
          sessionStorage.removeItem('hydrationAllergies')
          sessionStorage.removeItem('hydrationOutputRecommendations') // Clear this too - it's in cart_headers now!
          
          // 2. Clear Dexie (staff device doesn't need this data anymore)
          try {
            const { db } = await import('@/lib/dexie-db')
            await db.hydration_assessments.clear()
            await db.drink_logs.clear()
            console.log('✅ Cleared staff device Dexie after transfer')
          } catch (err) {
            console.warn('Failed to clear Dexie:', err)
          }
          
          // 3. Cart will be cleared after payment completes
          // (webhook will handle cleanup when customer pays)
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
      // First, get the current cart session ID
      const cartRes = await fetch("/api/cart", {
        method: "GET",
        credentials: "include"
      })
      const cartData = await cartRes.json()
      
      if (!cartData.sessionId) {
        alert("Unable to get cart session")
        setLoading(false)
        return
      }

      // Generate booking QR with cart_id
      // (AI recommendations already stored in cart_items)
      const res = await fetch("/api/cart/generate-booking-qr", { 
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: cartData.sessionId
        })
      })
      const data = await res.json()
      
      if (data.qrCode) {
        // Use the QR code data URL directly
        setPaymentUrl(data.qrCode) // Store QR data URL
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
// Determine which buttons to show based on venue
const getButtonsForVenue = () => {
  const venueName = selectedVenue?.name || '';
  
  // F45 venues: Checkout + QR Payment
  if (venueName.includes('F45')) {
    return {
      showCheckout: true,
      showQRPayment: true,
      showSharePlan: false
    };
  }
  
  // AOI: Checkout + Share Plan
  if (venueName.includes('Art of Implosion')) {
    return {
      showCheckout: true,
      showQRPayment: false,
      showSharePlan: true
    };
  }
  
  // All other venues (Ice House, Armani, Online): Checkout only
  return {
    showCheckout: true,
    showQRPayment: false,
    showSharePlan: false
  };
};

const buttons = getButtonsForVenue();

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
              <option value="" className="bg-gray-800 text-white">Select a venue...</option>
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
          {/* Payment Options - Conditional based on venue */}
          <div className="space-y-3 mt-6" style={{ marginBottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))' }}>
            {/* Always show Checkout button */}
            {buttons.showCheckout && (
              <Button 
                size="lg" 
                className="w-full bg-teal-500 text-white hover:bg-teal-600 h-12 text-lg" 
                onClick={() => tier ? setConfirmationModalOpen(true) : handleCheckout()}
                disabled={loading || cartItems.length === 0 || !selectedVenue}
              >
                {loading ? "Processing..." : "💳 Proceed to Checkout"}
              </Button>
            )}
            
            {/* F45 Only: QR Payment */}
            {buttons.showQRPayment && (
              <Button 
                size="lg" 
                variant="outline"
                className="w-full border-teal-500 text-teal-300 hover:bg-teal-500/20 h-12 text-lg" 
                onClick={() => handleGenerateCustomerQR()}
                disabled={loading || cartItems.length === 0}
              >
                📱 Generate QR to Pay
              </Button>
            )}
            
            {/* AOI Only: Share Plan */}
            {buttons.showSharePlan && (
              <Button 
                size="lg" 
                variant="outline"
                className="w-full border-purple-500 text-purple-300 hover:bg-purple-500/20 h-12 text-lg" 
                onClick={() => handleSharePlanQR()}
                disabled={loading || cartItems.length === 0}
              >
                🔗 Share Plan Only (No Payment)
              </Button>
            )}
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
                      onClick={async () => {
                        setShowQR(false)
                        setPaymentStatus(null)
                        
                        // FLOW 2 COMPLETE: Clear everything after successful payment
                        onClearCart?.()
                        sessionStorage.removeItem("hydrationAssessment")
                        
                        // Clear Dexie (staff device ready for next customer)
                        try {
                          const { db } = await import('@/lib/dexie-db')
                          await db.hydration_assessments.clear()
                          await db.drink_logs.clear()
                          console.log('✅ Staff device fully reset after payment')
                        } catch (err) {
                          console.warn('Failed to clear Dexie:', err)
                        }
                        
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
                        src={paymentUrl.startsWith('data:') ? paymentUrl : generateQRCode(paymentUrl)} 
                        alt="Payment QR Code"
                        className="mx-auto max-w-full h-auto w-64 h-64"
                      />
                    </div>
                    
                    {/* Show different actions based on QR type */}
                    {paymentUrl.startsWith('data:') ? (
                      // Flow 3: Plan Transfer QR
                      <>
                        <p className="text-xs text-gray-500 mb-4">
                          Staff can scan this QR to view your cart with AI recommendations
                        </p>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => setShowQR(false)}
                            variant="outline"
                            className="flex-1"
                          >
                            Close
                          </Button>
                          <Button
                            onClick={async () => {
                              // Send plan via email
                              const email = prompt('Enter your email address:')
                              if (!email) return
                              
                              try {
                                // Get cart ID
                                const cartRes = await fetch("/api/cart", {
                                  method: "GET",
                                  credentials: "include"
                                })
                                const cartData = await cartRes.json()
                                
                                const res = await fetch('/api/send-plan-email', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    cartId: cartData.sessionId,
                                    customerEmail: email,
                                    customerName: 'Valued Customer'
                                  })
                                })
                                if (res.ok) {
                                  alert('✅ Plan sent to your email! Check your inbox.')
                                } else {
                                  const error = await res.json()
                                  alert(`Failed to send email: ${error.error}`)
                                }
                              } catch (err) {
                                alert('Network error sending email')
                              }
                            }}
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                          >
                            📧 Email Plan
                          </Button>
                        </div>
                      </>
                    ) : (
                      // Flow 2: Payment QR
                      <>
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