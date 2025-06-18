"use client"

import { useState, useEffect } from "react"
import { MenuItemCard } from "@/components/menu-item-card"
import { CartSummary } from "@/components/cart-summary"
import { Separator } from "@/components/ui/separator"
import { VirtualBaristaChat } from "@/components/virtual-barista-chat"
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

  useEffect(() => {
    const newTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    setTotal(newTotal)
  }, [cartItems])

  const handleAddToCart = (item: MenuItem) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((cartItem) => cartItem.id === item.id)
      if (existingItem) {
        return prevItems.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        )
      } else {
        return [...prevItems, { ...item, quantity: 1 }]
      }
    })
  }

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((cartItem) => cartItem.id === itemId)
      if (existingItem && existingItem.quantity > 1) {
        return prevItems.map((cartItem) =>
          cartItem.id === itemId ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem,
        )
      } else {
        return prevItems.filter((cartItem) => cartItem.id !== itemId)
      }
    })
  }

  const getItemQuantity = (itemId: string) => {
    const item = cartItems.find((cartItem) => cartItem.id === itemId)
    return item ? item.quantity : 0
  }

  return (
    <>
      <VirtualBaristaChat />
      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
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

        <Separator className="my-12 bg-stone-200" />

        <section className="mb-24">
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
      </main>
      <CartSummary cartItems={cartItems} total={total} onRemoveItem={handleRemoveFromCart} />
    </>
  )
}
