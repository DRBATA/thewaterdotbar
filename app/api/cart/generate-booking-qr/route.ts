import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import QRCode from "qrcode"

export async function POST(request: NextRequest) {
  try {
    const { cartItems, assessmentData, sessionId } = await request.json()
    const supabase = await createClient()
    
    // Create a transfer record
    const { data: transfer, error } = await supabase
      .from('cart_transfers')
      .insert({
        session_id: sessionId,
        cart_items: cartItems,
        assessment_data: assessmentData,
        venue_target: 'AOI',
        status: 'pending',
        expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 min expiry
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Generate QR code with transfer ID
    const transferUrl = `${process.env.NEXT_PUBLIC_AOI_URL}/api/cart-receive?transfer=${transfer.id}`
    const qrCodeDataUrl = await QRCode.toDataURL(transferUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    return NextResponse.json({
      qrCode: qrCodeDataUrl,
      transferId: transfer.id,
      expiresAt: transfer.expires_at
    })
    
  } catch (error) {
    console.error('Error generating booking QR:', error)
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 })
  }
}
