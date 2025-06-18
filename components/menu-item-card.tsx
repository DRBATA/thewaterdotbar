"use client"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Minus } from "lucide-react"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string
}

interface MenuItemCardProps {
  item: MenuItem
  onAddToCart: (item: MenuItem) => void
  onRemoveFromCart: (itemId: string) => void
  quantity: number
}

export function MenuItemCard({ item, onAddToCart, onRemoveFromCart, quantity }: MenuItemCardProps) {
  return (
    <Card className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg border border-stone-200/70">
      <div className="relative h-48 w-full">
        <Image
          src={item.image || "/placeholder.svg"}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
          className="transition-transform duration-300 hover:scale-105"
        />
      </div>
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-xl font-semibold text-stone-700 tracking-tight">{item.name}</CardTitle>
        <CardDescription className="text-sm text-stone-500 mt-1">{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between p-5 pt-0">
        <span className="text-xl font-bold text-amber-700">${item.price.toFixed(2)}</span>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemoveFromCart(item.id)}
            disabled={quantity === 0}
            className="size-8 rounded-full text-amber-700 hover:bg-amber-50 hover:text-amber-800 disabled:text-stone-400"
          >
            <Minus className="size-4" />
            <span className="sr-only">Remove from cart</span>
          </Button>
          <span className="w-6 text-center font-medium text-stone-700">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAddToCart(item)}
            className="size-8 rounded-full text-amber-700 hover:bg-amber-50 hover:text-amber-800"
          >
            <Plus className="size-4" />
            <span className="sr-only">Add to cart</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
