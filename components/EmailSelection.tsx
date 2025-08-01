"use client";
import { useState } from "react";

interface EmailSelectionProps {
  pin: string;
  options: Array<{
    itemId: string;
    orderId: string;
    email: string;
    itemName: string;
    quantity: number;
  }>;
  onSelectedAction: (orderItem: any) => void;
  onErrorAction: (error: string) => void;
}

export default function EmailSelection({ pin, options, onSelectedAction, onErrorAction }: EmailSelectionProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEmailClick = async (optionIndex: number) => {
    const option = options[optionIndex];
    setSelectedOption(optionIndex);
    setIsProcessing(true);

    try {
      // Simulate the order item structure expected by the confirmation page
      const orderItem = {
        type: 'single_claim',
        pin_code: pin,
        name: option.itemName,
        qty: option.quantity,
        order: {
          id: option.orderId,
          email: option.email,
          created_at: new Date().toISOString(), // We don't have this from the API, but it's not critical
          total: 0 // We don't have this from the API, but it's not critical
        },
        item_id: option.itemId,
        order_item_id: option.itemId
      };

      onSelectedAction(orderItem);
    } catch (error) {
      console.error('Error selecting email:', error);
      onErrorAction('Failed to select email. Please try again.');
      setIsProcessing(false);
      setSelectedOption(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">
        PIN {pin} - Select Customer Email
      </h2>
      <p className="text-gray-600 mb-6 text-center">
        Multiple orders found for this PIN. Click the correct customer email:
      </p>
      
      <div className="space-y-3">
        {options.map((option, index) => (
          <button
            key={option.itemId}
            onClick={() => handleEmailClick(index)}
            disabled={isProcessing}
            className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
              selectedOption === index
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            } ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{option.email}</div>
                <div className="text-sm text-gray-500">
                  {option.itemName} × {option.quantity}
                </div>
              </div>
              {selectedOption === index && isProcessing && (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        Staff: Click the email that matches the customer in front of you
      </p>
    </div>
  );
}
