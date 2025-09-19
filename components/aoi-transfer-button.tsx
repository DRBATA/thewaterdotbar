'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { QrCode, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface AOITransferButtonProps {
  cartItems: any[]
  assessmentData: any
  sessionId: string
}

export function AOITransferButton({ cartItems, assessmentData, sessionId }: AOITransferButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [qrCode, setQrCode] = useState<string>('')
  const [transferId, setTransferId] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [status, setStatus] = useState<'pending' | 'scanned' | 'completed'>('pending')
  
  const generateQR = async () => {
    setIsGenerating(true)
    setIsOpen(true)
    
    try {
      const response = await fetch('/api/cart/generate-booking-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems,
          assessmentData,
          sessionId
        })
      })
      
      const data = await response.json()
      setQrCode(data.qrCode)
      setTransferId(data.transferId)
      
      // Poll for status updates
      pollTransferStatus(data.transferId)
    } catch (error) {
      console.error('Error generating QR:', error)
    } finally {
      setIsGenerating(false)
    }
  }
  
  const pollTransferStatus = async (id: string) => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/cart/transfer-status/${id}`)
      const data = await response.json()
      
      if (data.status === 'scanned') {
        setStatus('scanned')
      } else if (data.status === 'completed') {
        setStatus('completed')
        clearInterval(interval)
        setTimeout(() => setIsOpen(false), 2000)
      }
    }, 2000)
    
    // Clear after 10 minutes
    setTimeout(() => clearInterval(interval), 600000)
  }
  
  return (
    <>
      <Button
        variant="outline"
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0"
        onClick={generateQR}
      >
        <QrCode className="mr-2 h-4 w-4" />
        Transfer to AOI Booking
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {status === 'pending' && 'Show to AOI Staff'}
              {status === 'scanned' && 'Processing Transfer...'}
              {status === 'completed' && '✅ Transfer Complete!'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4">
            {isGenerating ? (
              <Loader2 className="h-48 w-48 animate-spin" />
            ) : qrCode ? (
              <>
                <div className="relative">
                  <Image 
                    src={qrCode} 
                    alt="Transfer QR Code"
                    width={300}
                    height={300}
                  />
                  {status === 'scanned' && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  )}
                  {status === 'completed' && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <span className="text-6xl">✅</span>
                    </div>
                  )}
                </div>
                
                <div className="text-center space-y-2">
                  {status === 'pending' && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Valid for 10 minutes
                      </p>
                      <p className="text-xs">
                        Transfer ID: {transferId.slice(0, 8)}...
                      </p>
                    </>
                  )}
                  
                  {status === 'completed' && (
                    <div className="space-y-1">
                      <p className="font-medium text-green-600">
                        Items added to your AOI booking!
                      </p>
                      <p className="text-sm text-muted-foreground">
                        AI has optimized drink timing for your activities
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
