import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    
    // Super simple payload - just the cart ID!
    const qrPayload = {
      cart_id: sessionId,
      source: 'water_bar',
      timestamp: new Date().toISOString()
    }
    
    // Generate QR code with minimal data
    const qrCodeDataUrl = await QRCode.toDataURL(
      JSON.stringify(qrPayload), 
      {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }
    )
    
    return NextResponse.json({
      qrCode: qrCodeDataUrl,
      transferId: sessionId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    })
    
  } catch (error) {
    console.error('Error generating booking QR:', error)
    return NextResponse.json({ 
      error: 'Failed to generate QR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}