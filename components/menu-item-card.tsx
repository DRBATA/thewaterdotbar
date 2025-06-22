"use client"
import Image from "next/image"
import { formatCurrency } from "@/lib/utils";
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
  onAddToCartAction: (item: MenuItem) => void
  onRemoveFromCartAction: (itemId: string) => void
  quantity: number
}

export function MenuItemCard({ item, onAddToCartAction, onRemoveFromCartAction, quantity }: MenuItemCardProps) {
  // Check if this is the Morning Party ticket
  const isMorningParty = item.name.toLowerCase().includes("morning party");
  const isFree = item.price === 0;
  
  return (
    <Card className={`relative w-full max-w-sm overflow-hidden rounded-xl ${isMorningParty ? "bg-amber-50 border-amber-300 shadow-lg" : "bg-white border-stone-200/70 shadow-md"} transition-all hover:shadow-lg border`}>
      {(isMorningParty && isFree) && (
        <div className="absolute top-0 right-0 z-10 bg-green-500 text-white py-1 px-3 rounded-bl-lg font-bold tracking-wide">
          FREE
        </div>
      )}
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
        <CardTitle className={`text-xl font-semibold tracking-tight ${isMorningParty ? "text-amber-800" : "text-stone-700"}`}>
          {item.name}
          {(isMorningParty && isFree) && <span className="block text-sm font-bold text-green-600 mt-1">NO CREDIT CARD REQUIRED</span>}
        </CardTitle>
        <CardDescription className="text-sm text-stone-500 mt-1">{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between p-5 pt-0">
        <span className={`text-xl font-bold ${isFree ? "text-green-600" : "text-amber-700"}`}>
          {isFree ? "FREE" : formatCurrency(item.price)}
        </span>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemoveFromCartAction(item.id)}
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
            onClick={() => onAddToCartAction(item)}
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
