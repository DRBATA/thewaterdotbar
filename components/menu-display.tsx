"use client"

import { useState, useEffect } from "react"
import { MenuItemCard } from "@/components/menu-item-card"
import { CartSummary } from "@/components/cart-summary"
import { Separator } from "@/components/ui/separator"
import { VirtualBaristaChat } from "@/components/virtual-barista-chat"
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
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState<number>(0)

  // Use the initial data passed as props
  const drinks = initialDrinks
  const wellnessExperiences = initialWellnessExperiences

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
    await fetch("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id }),
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
      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <h2
            className="text-4xl font-bold text-stone-700 mb-8 text-center tracking-tight"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Wellness Experiences
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {wellnessExperiences.map((experience) => (
              <MenuItemCard
                key={experience.id}
                item={experience}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                quantity={getItemQuantity(experience.id)}
              />
            ))}
          </div>
        </section>

        <Separator className="my-12 bg-stone-200" />

        <section className="mb-24">
          <h2
            className="text-4xl font-bold text-stone-700 mb-8 text-center tracking-tight"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Our Drinks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {drinks.map((drink) => (
              <MenuItemCard
                key={drink.id}
                item={drink}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                quantity={getItemQuantity(drink.id)}
              />
            ))}
          </div>
        </section>
      </main>
      <VirtualBaristaChat />
      <CartSummary cartItems={cartItems} total={total} onRemoveItemAction={handleRemoveFromCart} onClearCart={handleClearCart} />
    </>
  )
}
