import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const { experienceId, date, duration_minutes = 30 } = await req.json()

  if (!experienceId || !date) {
    return NextResponse.json({ 
      error: "Missing required fields: experienceId, date" 
    }, { status: 400 })
  }

  const supabase = await createClient()
  
  try {
    // Fetch existing bookings for the date and experience
    const { data: existingBookings } = await supabase
      .from('cart_items')
      .select(`
        booking_metadata,
        booking_status
      `)
      .eq('item_type', 'booking')
      .eq('item_id', experienceId)
      .in('booking_status', ['pending', 'confirmed', 'checked-in', 'active'])

    // Extract booked time slots
    const bookedSlots = existingBookings
      ?.filter(booking => 
        booking.booking_metadata?.date === date
      )
      .map(booking => ({
        time: booking.booking_metadata.time,
        duration: booking.booking_metadata.duration_minutes || 30
      })) || []

    // Generate all possible 10-minute slots from 9 AM to 9 PM
    const allSlots: string[] = []
    for (let hour = 9; hour < 21; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        allSlots.push(timeString)
      }
    }

    // Filter out unavailable slots (with 10-minute buffer)
    const availableSlots = allSlots.filter(slot => {
      const [slotHour, slotMinute] = slot.split(':').map(Number)
      const slotStart = slotHour * 60 + slotMinute
      const slotEnd = slotStart + duration_minutes

      return !bookedSlots.some(booked => {
        const [bookedHour, bookedMinute] = booked.time.split(':').map(Number)
        const bookedStart = bookedHour * 60 + bookedMinute - 10 // 10-min buffer before
        const bookedEnd = bookedStart + booked.duration + 20 // 10-min buffer after

        // Check if slot overlaps with booked time (including buffers)
        return (slotStart < bookedEnd && slotEnd > bookedStart)
      })
    })

    // AI-powered time suggestions: prioritize optimal times
    const suggestedSlots = availableSlots.sort((a, b) => {
      const [aHour] = a.split(':').map(Number)
      const [bHour] = b.split(':').map(Number)

      // Priority order: 10-12 AM (morning energy), 2-4 PM (afternoon clarity), 6-8 PM (evening wind-down)
      const getTimePriority = (hour: number) => {
        if (hour >= 10 && hour < 12) return 1 // Morning priority
        if (hour >= 14 && hour < 16) return 2 // Afternoon priority  
        if (hour >= 18 && hour < 20) return 3 // Evening priority
        return 4 // Other times
      }

      return getTimePriority(aHour) - getTimePriority(bHour)
    })

    return NextResponse.json({ 
      availableSlots: suggestedSlots,
      bookedSlots: bookedSlots.map(slot => slot.time),
      totalAvailable: suggestedSlots.length
    })
    
  } catch (error: any) {
    console.error("Availability check error:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
