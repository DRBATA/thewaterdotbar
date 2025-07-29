"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { MenuItemCard } from "@/components/menu-item-card"
import { CartSummary } from "@/components/cart-summary"
import FilterBar from "@/components/FilterBar"
import { Separator } from "@/components/ui/separator"
// VirtualBaristaChat removed - replaced with UnifiedChatAvatar
import { useFilters } from "@/context/filter-context"
import { logEvent } from "@/lib/analytics"
import { WelcomePopup } from "@/components/WelcomePopup"
import type { MenuItem } from "@/app/page" // Import the MenuItem type
import { LocationProvider, useLocation } from "@/components/location-provider"

interface CartItem extends MenuItem {
  quantity: number
}

interface MenuDisplayProps {
  initialDrinks: MenuItem[]
  initialWellnessExperiences: MenuItem[]
}

// Create a wrapper component that uses the location provider
export function MenuDisplay(props: MenuDisplayProps) {
  return (
    <LocationProvider fallbackLocation={{ lat: 25.2048, lng: 55.2708 }}>  {/* Dubai fallback */}
      <LocationAwareMenuDisplay {...props} />
    </LocationProvider>
  );
}

// Inner component with access to location data
function LocationAwareMenuDisplay({ initialDrinks, initialWellnessExperiences }: MenuDisplayProps) {
  const { userLocation, isLoading: isLoadingLocation, error: locationError, calculateDistance, locationEnabled, toggleLocation } = useLocation();
  const isEventLive = process.env.NEXT_PUBLIC_EVENT_LIVE === 'true';

  if (!isEventLive) {
    return (
      <>
        <section className="container mx-auto px-4 pt-24 pb-2 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-stone-900">The Water Bar</h1>
          <p className="text-xl md:text-2xl font-semibold text-blue-600 mb-3">Perfect Your Functional Hydration</p>
          
          <div className="max-w-3xl mx-auto mb-4">
            <p className="text-lg text-stone-700">Get a precision-crafted hydration plan tailored to your body type, activity level, and wellness goals.</p>
            <p className="text-md text-stone-600 mt-1">Our AI Hydration Coach analyzes your unique needs for optimal performance, electrolyte balance, and recovery.</p>
          </div>
          
          {/* Performance/electrolytes/recovery buttons removed as requested */}
          
          <button 
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    console.log("Geolocation acquired:", position.coords.latitude, position.coords.longitude);
                    // Location is handled by the LocationProvider
                  },
                  (error) => {
                    console.error("Geolocation error:", error.message);
                  }
                );
              }
            }} 
            className="bg-stone-100 hover:bg-stone-200 transition-colors rounded-lg p-3 inline-block mb-2 shadow-md cursor-pointer"
          >
            <p className="font-medium text-stone-800">🔴 {userLocation ? 'Showing venues near you' : 'GPS inactive - click to activate to find distance to venue with available stock'}</p>
          </button>
        </section>
        <Separator className="my-4" />
        <main className="container mx-auto px-4 py-8 text-center">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow-lg" role="alert">
            <h2 className="font-bold text-2xl mb-2">The Event is Now Over</h2>
            <p className="text-lg">Thank you for joining us! We hope you had a wonderful time. Ordering is now closed.</p>
          </div>
        </main>
      </>
    );
  }
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const hasProcessedUrlCartAddition = useRef(false);
  
  // Update drinks and experiences with real distance data
  const [drinks, setDrinks] = useState<MenuItem[]>(initialDrinks);
  const [wellnessExperiences, setWellnessExperiences] = useState<MenuItem[]>(initialWellnessExperiences);
  
  // Recalculate distances when location changes
  useEffect(() => {
    if (isLoadingLocation) return;
    
    // Update drinks with real distance calculations
    const updatedDrinks = initialDrinks.map(drink => ({
      ...drink,
      venues: drink.venues?.map(venue => ({
        ...venue,
        distance: calculateDistance(venue.lat, venue.lng)
      }))
      .sort((a, b) => (a.distance || 999) - (b.distance || 999))
      .slice(0, 3) // Keep top 3 closest venues
    }));
    
    // Update experiences with real distance calculations
    const updatedExperiences = initialWellnessExperiences.map(experience => ({
      ...experience,
      venues: experience.venues?.map(venue => ({
        ...venue,
        distance: calculateDistance(venue.lat, venue.lng)
      }))
      .sort((a, b) => (a.distance || 999) - (b.distance || 999))
      .slice(0, 3) // Keep top 3 closest venues
    }));
    
    setDrinks(updatedDrinks);
    setWellnessExperiences(updatedExperiences);
  }, [initialDrinks, initialWellnessExperiences, isLoadingLocation, calculateDistance]);

  // Use the initial data passed as props
  // Set up predefined filter tags as specified
  const { activeTags, setSuggestedTags } = useFilters()
  
  // Set predefined filter options
  useEffect(() => {
    setSuggestedTags(['kombucha', 'water', 'perrier', 'chaga', 'gut health', 'greens'])
  }, [setSuggestedTags])
  
  // Location status indicator content
  const getLocationStatus = () => {
    if (isLoadingLocation) return { message: "Finding your location...", color: "text-blue-600" };
    if (locationError) return { message: "Using default location (Dubai)", color: "text-amber-600" };
    if (locationEnabled && userLocation.lat && userLocation.lng) {
      return { 
        message: `Using your current location ${userLocation.lat.toFixed(3)}, ${userLocation.lng.toFixed(3)}`, 
        color: "text-green-600" 
      };
    }
    return { message: "Location services are disabled", color: "text-amber-600" };
  };

  const tagMatch = (item: MenuItem) => {
    if (activeTags.length === 0) return true
    const text = `${item.name ?? ''} ${item.description ?? ''}`.toLowerCase()
    return activeTags.every(tag => text.includes(tag.toLowerCase()))
  }

  const filterMenuItems = useCallback(() => {
    const filteredDrinks = drinks.filter(tagMatch)
    const filteredExperiences = wellnessExperiences.filter(tagMatch)
    return { filteredDrinks, filteredExperiences }
  }, [drinks, wellnessExperiences, tagMatch])

  const { filteredDrinks, filteredExperiences } = filterMenuItems();

  // Calculate cart total whenever items change
  useEffect(() => {
    const newTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    setTotal(newTotal)
  }, [cartItems])

  // Log page view on initial load
  useEffect(() => {
    logEvent({ event_name: "page_view", step_name: "landing" })
  }, [])
  
  // Load cart items from Supabase database on page load
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await fetch("/api/cart/get", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
        
        if (response.ok) {
          const data = await response.json()
          
          // Process cart items from database
          if (data.items && data.items.length > 0) {
            // Create cart items by looking up product details
            const dbCartItems: CartItem[] = data.items
              .map((item: any) => {
                // Find matching drink or experience
                const product = [...drinks, ...wellnessExperiences].find(p => p.id === item.item_id)
                if (!product) return null
                
                return {
                  ...product,
                  quantity: item.qty
                }
              })
              .filter(Boolean) // Remove any nulls
            
            setCartItems(dbCartItems)
            console.log("Loaded " + dbCartItems.length + " items from saved cart")
          }
        }
      } catch (error) {
        console.error("Error loading cart items:", error)
      }
    }
    
    fetchCartItems()
  }, [drinks, wellnessExperiences]); // Re-run if product data changes

  const handleAddToCart = useCallback(async (item: MenuItem) => {
    logEvent({ event_name: "add_to_cart", step_name: "cart", metadata: { itemId: item.id, itemName: item.name } })

    // Check if the item is the "Triple Threat Pass" bundle
    const isBundle = item.name === 'Triple Threat Pass';
    const bundle_components = isBundle
      ? ['ticket.entry', 'ticket.drink', 'ticket.wellness.flex']
      : undefined;

    await fetch("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: item.id,
        bundle_components // This will be included if it's a bundle, otherwise undefined
      }),
    })
    // optimistic UI update
    setCartItems((prev) => {
      const found = prev.find((i) => i.id === item.id)
      return found
        ? prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...prev, { ...item, quantity: 1 }]
    })
  }, []);

  // Handle adding item to cart from URL parameter
  useEffect(() => {
    if (hasProcessedUrlCartAddition.current || (initialDrinks.length === 0 && initialWellnessExperiences.length === 0)) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const productIdToAdd = params.get('add-to-cart');

    if (productIdToAdd) {
      const allProducts = [...initialDrinks, ...initialWellnessExperiences];
      const productToAdd = allProducts.find(p => p.id === productIdToAdd);

      if (productToAdd) {
        handleAddToCart(productToAdd);
        hasProcessedUrlCartAddition.current = true; // Mark as processed

        // Clean the URL to prevent re-adding on refresh
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [initialDrinks, initialWellnessExperiences, handleAddToCart]);

  const handleRemoveFromCart = async (itemId: string) => {
    await fetch("/api/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    })
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === itemId)
      if (existing && existing.quantity > 1) {
        return prev.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i))
      }
      return prev.filter((i) => i.id !== itemId)
    })
  }
  
  const handleClearCart = () => {
    setCartItems([])
  }

  const getItemQuantity = (itemId: string) => {
    const item = cartItems.find((cartItem) => cartItem.id === itemId)
    return item ? item.quantity : 0
  }

  // Listen for agent cart action events (placed after handler functions are defined)
  useEffect(() => {
    const handleAgentAddToCart = (event: CustomEvent) => {
      const { product_id, product_name, quantity } = event.detail;
      console.log(`Agent triggered add to cart: ${product_name} (${product_id}) x${quantity}`);
      
      // Find the product in our data
      const allProducts = [...drinks, ...wellnessExperiences];
      const product = allProducts.find(p => p.id === product_id);
      
      if (product) {
        // Add to cart the specified number of times
        for (let i = 0; i < quantity; i++) {
          handleAddToCart(product);
        }
      } else {
        console.error(`Product not found: ${product_id}`);
      }
    };
    
    const handleAgentRemoveFromCart = (event: CustomEvent) => {
      const { product_id, product_name, quantity } = event.detail;
      console.log(`Agent triggered remove from cart: ${product_name} (${product_id}) x${quantity}`);
      
      // Remove from cart the specified number of times
      for (let i = 0; i < quantity; i++) {
        handleRemoveFromCart(product_id);
      }
    };
    
    const handleAgentViewCart = (event: CustomEvent) => {
      console.log('Agent triggered view cart - opening cart modal');
      // Click the VIEW CART button to open the cart modal
      const viewCartButton = document.querySelector('[data-view-cart-button]') as HTMLButtonElement;
      if (viewCartButton) {
        viewCartButton.click();
      } else {
        // Fallback: scroll to cart summary
        const cartSummary = document.querySelector('[data-cart-summary]');
        if (cartSummary) {
          cartSummary.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };
    
    const handleAgentCheckout = (event: CustomEvent) => {
      console.log('Agent triggered checkout - going to Stripe payment');
      // Click the PROCEED TO CHECKOUT button directly
      const checkoutButton = document.querySelector('[data-checkout-button]') as HTMLButtonElement;
      if (checkoutButton) {
        checkoutButton.click();
      } else {
        // Fallback: scroll to cart summary to show checkout button
        const cartSummary = document.querySelector('[data-cart-summary]');
        if (cartSummary) {
          cartSummary.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };
    
    const handleAgentCopyDiscount = (event: CustomEvent) => {
      console.log('Agent triggered copy discount code');
      // Click the COPY DISCOUNT CODE button
      const copyDiscountButton = document.querySelector('[data-copy-discount-button]') as HTMLButtonElement;
      if (copyDiscountButton) {
        copyDiscountButton.click();
      }
    };
    
    // Add event listeners
    window.addEventListener('agent-add-to-cart', handleAgentAddToCart as EventListener);
    window.addEventListener('agent-remove-from-cart', handleAgentRemoveFromCart as EventListener);
    window.addEventListener('agent-view-cart', handleAgentViewCart as EventListener);
    window.addEventListener('agent-checkout', handleAgentCheckout as EventListener);
    window.addEventListener('agent-copy-discount', handleAgentCopyDiscount as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('agent-add-to-cart', handleAgentAddToCart as EventListener);
      window.removeEventListener('agent-remove-from-cart', handleAgentRemoveFromCart as EventListener);
      window.removeEventListener('agent-view-cart', handleAgentViewCart as EventListener);
      window.removeEventListener('agent-checkout', handleAgentCheckout as EventListener);
      window.removeEventListener('agent-copy-discount', handleAgentCopyDiscount as EventListener);
    };
  }, [drinks, wellnessExperiences, handleAddToCart, handleRemoveFromCart]);

  return (
    <>
      <WelcomePopup />
      <section className="container mx-auto px-4 pt-24 pb-2 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-stone-900">The Water Bar</h1>
        <p className="text-xl md:text-2xl font-semibold text-blue-600 mb-3">Experience Highdrartion</p>
        
        <div className="max-w-3xl mx-auto mb-4">
          <p className="text-lg text-stone-700">Get a precision-crafted hydration plan tailored to your body type, activity level, and wellness goals. Our AI Hydration Coach analyzes your unique needs for optimal performance, electrolyte balance, and recovery.</p>
        </div>
        

        
        <button 
          onClick={() => toggleLocation()}
          className={`backdrop-blur-lg border transition-all rounded-lg p-4 inline-block mb-2 shadow-lg cursor-pointer ${locationEnabled 
            ? 'bg-green-500/30 border-green-500/50 hover:bg-green-500/40' 
            : 'bg-white/20 border-white/30 hover:bg-white/30'}`}
        >
          <p className="text-xl font-semibold text-white">
            {locationEnabled 
              ? '🟢 Location active - tap to disable' 
              : '🔴 Location inactive - tap to enable to find available drinks near me'}
          </p>
        </button>
        {/* Location status indicator */}
        <div className={`mt-2 text-sm font-medium ${getLocationStatus().color}`}>
          <span className="inline-flex items-center gap-1">
            {isLoadingLocation ? (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : userLocation.lat && userLocation.lng ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {getLocationStatus().message}
          </span>
        </div>
      </section>
      <Separator className="my-4" />
      


      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredExperiences
  .sort((a, b) => (a.price === 0 ? -1 : b.price === 0 ? 1 : 0))
  .map((experience) => (
              <MenuItemCard
                key={experience.id}
                item={experience}
                onAddToCartAction={handleAddToCart}
                onRemoveFromCartAction={handleRemoveFromCart}
                quantity={getItemQuantity(experience.id)}
              />
            ))}
          </div>
        </section>

        

        <section className="mb-24">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredDrinks
  .sort((a, b) => (a.price === 0 ? -1 : b.price === 0 ? 1 : 0))
  .map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onAddToCartAction={handleAddToCart}
                onRemoveFromCartAction={handleRemoveFromCart}
                quantity={getItemQuantity(item.id)}
              />
            ))}
          </div>
        </section>
      </main>

      {/* About & Location accordion */}
      <section className="container mx-auto px-4 mb-24">
        <details className="bg-stone-100 rounded-lg shadow-md p-4">
          <summary className="cursor-pointer font-semibold text-stone-800">About, Partners & Location</summary>
          <div className="mt-4 space-y-6">
            <a href="https://www.instagram.com/aoi.rejuvenation/" target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-blue-700 transition-colors shadow-md">
              In Partnership with AOI Rejuvenation
            </a>
            {/* Social links */}
            <div className="flex flex-wrap justify-center items-center gap-4">
              <a href="https://www.instagram.com/thewaterbarglobal/" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">The Water Bar</a>
              <a href="https://www.instagram.com/johnydarexperience/" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">Johny Dar Experience</a>
              <a href="https://medium.com/@Asb_14920/a-new-era-of-wellness-and-creativity-inside-the-johny-dar-experience-in-dubai-256e321c9e0d" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">Medium Article</a>
              <a href="https://www.magzter.com/stories/newspaper/Khaleej-Times/THE-MORNING-PARTY-OFFERS-A-NEW-WAY-TO-SOCIALISE-IN-DUBAI?srsltid=AfmBOoo_pSMqPBXuVSYRd0Le_6UtzzgsKSlfMwACQzZdLf9m6xW2Dnp8" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">Khaleej Times Feature</a>
            </div>

            {/* Location map */}
            <div className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg border border-stone-200">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3611.8849265822923!2d55.227652199999994!3d25.139581000000003!2m3!1f1!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f69006a1bfe73%3A0x61c97157c58f5347!2sJohny%20Dar%20Experience!5e0!3m2!1sen!2suk!4v1750945639448!5m2!1sen!2suk"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </details>
      </section>
      <CartSummary cartItems={cartItems} total={total} onRemoveItemAction={handleRemoveFromCart} onClearCart={handleClearCart} data-cart-summary />
    </>
  )
}
