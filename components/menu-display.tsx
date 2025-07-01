"use client"

import { useState, useEffect } from "react"
import { MenuItemCard } from "@/components/menu-item-card"
import { CartSummary } from "@/components/cart-summary"
import { Separator } from "@/components/ui/separator"
import { VirtualBaristaChat } from "@/components/virtual-barista-chat"
import { useFilters } from "@/context/filter-context"
import { logEvent } from "@/lib/analytics"
import type { MenuItem } from "@/app/page" // Import the MenuItem type

interface CartItem extends MenuItem {
  quantity: number
}

interface MenuDisplayProps {
  initialDrinks: MenuItem[]
  initialWellnessExperiences: MenuItem[]
}

export function MenuDisplay({ initialDrinks, initialWellnessExperiences }: MenuDisplayProps) {
  const isEventLive = process.env.NEXT_PUBLIC_EVENT_LIVE !== 'false';

  if (!isEventLive) {
    return (
      <>
        <section className="container mx-auto px-4 pt-24 pb-2 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-stone-900">The Morning Party x Johny Dar Experience</h1>
          <p className="text-lg md:text-xl text-stone-700 mb-6">Dubai’s first SOBER party trend. Our virtual barista helps you shape your own wellness journey—share your mood, your goals, or just what brings you here.</p>
          <div className="bg-stone-100 rounded-lg p-4 inline-block mb-2 shadow-md">
              <p className="text-xl font-semibold text-stone-800">
                  Sunday, 29th June | ⏰ 10 AM | 📍Johny Dar Experience, Al Quoz, Dubai
              </p>
          </div>
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

  // Use the initial data passed as props
  const { activeTags } = useFilters()

  const tagMatch = (item: MenuItem) => {
    if (activeTags.length === 0) return true
    const text = `${item.name ?? ''} ${item.description ?? ''}`.toLowerCase()
    return activeTags.every(tag => text.includes(tag.toLowerCase()))
  }

  const drinks = initialDrinks.filter(tagMatch)
  const wellnessExperiences = initialWellnessExperiences.filter(tagMatch)

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
  }, [drinks, wellnessExperiences]) // Re-run if product data changes

  const handleAddToCart = async (item: MenuItem) => {
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
  }

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

  return (
    <>
      <section className="container mx-auto px-4 pt-24 pb-2 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-stone-900">The Morning Party x Johny Dar Experience</h1>
        <p className="text-lg md:text-xl text-stone-700 mb-6">Dubai’s first SOBER party trend. Our virtual barista helps you shape your own wellness journey—share your mood, your goals, or just what brings you here.</p>
        <div className="bg-stone-100 rounded-lg p-4 inline-block mb-2 shadow-md">
            <p className="text-xl font-semibold text-stone-800">
                Sunday, 29th June | ⏰ 10 AM | 📍Johny Dar Experience, Al Quoz, Dubai
            </p>
        </div>
      </section>
      <Separator className="my-4" />

      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {[...wellnessExperiences]
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
            {[...drinks]
  .sort((a, b) => (a.price === 0 ? -1 : b.price === 0 ? 1 : 0))
  .map((drink) => (
              <MenuItemCard
                key={drink.id}
                item={drink}
                onAddToCartAction={handleAddToCart}
                onRemoveFromCartAction={handleRemoveFromCart}
                quantity={getItemQuantity(drink.id)}
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
      <VirtualBaristaChat />
      <CartSummary cartItems={cartItems} total={total} onRemoveItemAction={handleRemoveFromCart} onClearCart={handleClearCart} />
    </>
  )
}
