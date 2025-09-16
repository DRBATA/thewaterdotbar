import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getSessionId } from "@/lib/session"

export async function POST(req: Request) {
  const { 
    experienceId, 
    date, 
    time, 
    duration_minutes, 
    experience_name,
    price,
    venue_id = '20c2f440-9133-42ec-a8d6-6336e649ec4b' // AOI venue ID
  } = await req.json()

  if (!experienceId || !date || !time || !duration_minutes) {
    return NextResponse.json({ 
      error: "Missing required fields: experienceId, date, time, duration_minutes" 
    }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = await createClient()
  const sessionId = await getSessionId()
  
  try {
    // 1. Check availability for the requested slot
    const { data: existingBookings } = await supabase
      .from('cart_items')
      .select(`
        booking_metadata,
        booking_status
      `)
      .eq('item_type', 'booking')
      .eq('item_id', experienceId)
      .in('booking_status', ['pending', 'confirmed', 'checked-in', 'active'])

    // Check for conflicts
    const requestedStart = new Date(`${date}T${time}:00`)
    const requestedEnd = new Date(requestedStart.getTime() + duration_minutes * 60000)

    const hasConflict = existingBookings?.some(booking => {
      if (booking.booking_metadata?.date !== date) return false
      
      const bookedStart = new Date(`${date}T${booking.booking_metadata.time}:00`)
      const bookedEnd = new Date(bookedStart.getTime() + (booking.booking_metadata.duration_minutes || 30) * 60000)
      
      // Add 10-minute buffer
      const bufferStart = new Date(bookedStart.getTime() - 10 * 60000)
      const bufferEnd = new Date(bookedEnd.getTime() + 10 * 60000)
      
      return (requestedStart < bufferEnd && requestedEnd > bufferStart)
    })

    if (hasConflict) {
      return NextResponse.json({ 
        error: "Time slot not available. Please choose a different time." 
      }, { status: 409 })
    }

    // 2. Find or create cart header
    const { data: cartHeader, error: cartHeaderError } = await supabase
      .from("cart_headers")
      .select("id")
      .eq("session_id", sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (cartHeaderError) {
      throw new Error(`Cart header error: ${cartHeaderError.message}`)
    }
    
    let cartId
    if (!cartHeader) {
      const { data: newCartHeader, error: newCartError } = await supabase
        .from("cart_headers")
        .insert({
          session_id: sessionId,
          venue_id: venue_id
        })
        .select("id")
        .single()
        
      if (newCartError) {
        throw new Error(`New cart error: ${newCartError.message}`)
      }
      cartId = newCartHeader.id
    } else {
      cartId = cartHeader.id
    }
    
    // 3. Add booking to cart_items
    const { error: insertError } = await supabase
      .from("cart_items")
      .insert({
        cart_id: cartId,
        item_id: experienceId,
        item_type: 'booking',
        qty: 1,
        booking_status: 'pending',
        booking_metadata: {
          date,
          time,
          duration_minutes,
          experience_name,
          price,
          venue_id
        }
      })
      
    if (insertError) {
      throw new Error(`Insert booking error: ${insertError.message}`)
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `${experience_name} booked for ${date} at ${time}` 
    })
    
  } catch (error: any) {
    console.error("Booking error:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
