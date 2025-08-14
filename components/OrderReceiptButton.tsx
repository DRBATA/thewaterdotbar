import React, { useState } from 'react';
import { Download, Check, Loader2 } from 'lucide-react';
import { ownedProductsHelpers } from '@/lib/dexie-db';

interface OrderReceiptButtonProps {
  orderItems: Array<{
    id: string;
    product_id?: string;
    name: string;
    description?: string;
    quantity: number;
    price: number;
    // Standard usage instructions (from Supabase product data)
    timing?: string;
    dosage?: string;
    frequency?: string;
    contraindications?: string[];
    venueIntegration?: string;
  }>;
  orderId?: string;
  className?: string;
}

export default function OrderReceiptButton({ 
  orderItems, 
  orderId, 
  className = "" 
}: OrderReceiptButtonProps) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSaveToPersonalCoach = async () => {
    setStatus('saving');
    setErrorMessage('');

    try {
      // Save all order items to Dexie as owned products
      await ownedProductsHelpers.addFromOrder(orderItems, orderId);
      
      setStatus('saved');
      
      // Reset to idle after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error('Error saving to personal coach:', error);
      setStatus('error');
      setErrorMessage('Failed to save to personal coach. Please try again.');
      
      // Reset to idle after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage('');
      }, 5000);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'saving':
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Saving to Coach...
          </>
        );
      case 'saved':
        return (
          <>
            <Check className="w-4 h-4 mr-2 text-green-500" />
            Saved to Personal Coach!
          </>
        );
      case 'error':
        return (
          <>
            <Download className="w-4 h-4 mr-2" />
            Try Again
          </>
        );
      default:
        return (
          <>
            <Download className="w-4 h-4 mr-2" />
            Save to Personal Coach
          </>
        );
    }
  };

  const getButtonStyle = () => {
    switch (status) {
      case 'saved':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'error':
        return 'bg-red-500 hover:bg-red-600 text-white';
      default:
        return 'bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-white';
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleSaveToPersonalCoach}
        disabled={status === 'saving' || status === 'saved'}
        className={`
          w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
          flex items-center justify-center
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:shadow-lg hover:shadow-teal-500/25
          ${getButtonStyle()}
          ${className}
        `}
      >
        {getButtonContent()}
      </button>
      
      {errorMessage && (
        <p className="text-red-500 text-sm text-center">{errorMessage}</p>
      )}
      
      {status === 'saved' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 text-sm text-center">
            ✅ Your products are now available for personalized coaching! 
            Chat with your AI coach about optimal timing and usage.
          </p>
        </div>
      )}
      
      {status === 'idle' && orderItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm text-center">
            💡 Save your purchase to get personalized coaching on when and how to use each product
          </p>
        </div>
      )}
    </div>
  );
}
