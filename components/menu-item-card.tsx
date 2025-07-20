"use client"
import Image from "next/image"
import { useState } from "react"
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Minus, ChevronDown, ChevronUp } from "lucide-react"
import GlowEffect from "./GlowEffect"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  venues?: {
    id: string
    name: string
    address: string
    distance?: number
    qty_on_hand: number
    lat?: number
    lng?: number
  }[]
}

interface MenuItemCardProps {
  item: MenuItem
  onAddToCartAction: (item: MenuItem) => void
  onRemoveFromCartAction: (itemId: string) => void
  quantity: number
}

export function MenuItemCard({ item, onAddToCartAction, onRemoveFromCartAction, quantity }: MenuItemCardProps) {
  // State to track if venue list is expanded
  const [venuesExpanded, setVenuesExpanded] = useState(false);
  
  // Check if this is the Morning Party ticket
  const isMorningParty = item.name.toLowerCase().includes("morning party");
  const isFree = item.price === 0;
  
  // Check if this item has venue availability information
  const hasVenues = item.venues && item.venues.length > 0;
  const hasMultipleVenues = item.venues && item.venues.length > 1;
  
  return (
    <Card className={`relative w-full max-w-sm rounded-xl ${isMorningParty ? "bg-amber-50 border-amber-300 shadow-lg" : "bg-white/40 backdrop-blur-lg border-white/50 shadow-lg"} transition-all hover:shadow-xl border`}>
      {/* Free badge */}
      {(isMorningParty && isFree) && (
        <div className="absolute top-0 right-0 z-10 bg-green-500 text-white py-1 px-3 rounded-bl-lg font-bold tracking-wide">
          FREE
        </div>
      )}
      
      {/* Venue availability badges */}
      {hasVenues && (
        <div className="absolute bottom-0 left-0 z-10 w-full">
          {/* Show closest venue or all venues if expanded */}
          {item.venues?.slice(0, venuesExpanded ? item.venues.length : 1).map((venue, index) => {
            // Create a Google Maps URL using venue coordinates if available, otherwise use venue name
            const mapUrl = venue.lat && venue.lng
              ? `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name)}+Dubai`;
            
            // Determine color based on venue position
            const bgColorClass = index === 0 
              ? 'bg-emerald-500' 
              : index === 1 
                ? 'bg-emerald-600' 
                : 'bg-emerald-700';
            
            return (
              <div 
                key={venue.id}
                className={`${bgColorClass} text-white py-1 px-3 text-xs font-medium 
                          ${index === 0 && !venuesExpanded ? 'rounded-tr-lg' : ''} cursor-pointer 
                          flex items-center justify-between group`}
                style={{ marginTop: index > 0 ? '-1px' : '0' }}
                onClick={(e) => {
                  // Don't navigate if clicking the toggle button area
                  if ((e.target as HTMLElement).closest('.venue-expand-button')) {
                    return;
                  }
                  window.open(mapUrl, '_blank');
                }}
                role="button"
                tabIndex={0}
                aria-label={`Get directions to ${venue.name}`}
              >
                <span>
                  {venue.name} ({venue.distance !== undefined ? venue.distance.toFixed(1) : '?'} km) • {venue.qty_on_hand} in stock
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                  <path d="M9 18l6-6-6-6"></path>
                </svg>
              </div>
            );
          })}
          
          {/* Expand/collapse button only if multiple venues */}
          {hasMultipleVenues && (
            <div 
              className="venue-expand-button bg-emerald-800 text-white py-1 px-3 text-xs font-medium rounded-br-lg cursor-pointer flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                setVenuesExpanded(!venuesExpanded);
              }}
              role="button"
              tabIndex={0}
              aria-label={venuesExpanded ? 'Show fewer venues' : 'Show all venues'}
            >
              <span className="mr-1">{venuesExpanded ? 'Show less' : `+${item.venues!.length - 1} more venues`}</span>
              {venuesExpanded ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </div>
          )}
        </div>
      )}
      <div className="relative h-48 w-full">
        <GlowEffect intensity={1.5} />
        <Image
          src={item.image || "/placeholder.svg"}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
          className="relative z-0 transition-transform duration-300 hover:scale-105"
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
