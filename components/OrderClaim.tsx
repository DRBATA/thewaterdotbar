"use client";
import { useState } from "react";

interface OrderClaimProps {
  pin: string;
  order: {
    id: string;
    email: string;
    created_at: string;
    total: number;
  };
  items: Array<{
    id: string;
    pin_code: string;
    name: string;
    qty: number;
    item_id: string;
  }>;
  venue_id: string;
  onClaimCompleteAction: (result: any) => void;
  onErrorAction: (error: string) => void;
}

export default function OrderClaim({ pin, order, items, venue_id, onClaimCompleteAction, onErrorAction }: OrderClaimProps) {
  console.log('OrderClaim component mounted with props:', {
    pin,
    order,
    items: items?.length || 'undefined',
    venue_id,
    hasOnClaimCompleteAction: !!onClaimCompleteAction,
    hasOnErrorAction: !!onErrorAction
  });
  
  const [selectedItems, setSelectedItems] = useState<string[]>(items?.map(item => item.id) || []); // All selected by default
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [itemsGiven, setItemsGiven] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Debug: Check if items is undefined or has issues
  if (!items || !Array.isArray(items)) {
    console.error('OrderClaim: items prop is invalid:', items);
    onErrorAction('Invalid items data received');
    return null;
  }
  
  if (!venue_id) {
    console.error('OrderClaim: venue_id is missing:', venue_id);
    onErrorAction('Venue ID is required');
    return null;
  }

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleComplete = async () => {
    if (!emailConfirmed || !itemsGiven) {
      onErrorAction('Please confirm email and that items have been given');
      return;
    }

    if (selectedItems.length === 0) {
      onErrorAction('Please select at least one item to claim');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/claim/${pin}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venue_id: venue_id,
          selected_item_ids: selectedItems
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onClaimCompleteAction(result);
      } else {
        onErrorAction(result.error || 'Failed to complete claim');
      }
    } catch (error) {
      console.error('Error completing claim:', error);
      onErrorAction('Failed to complete claim. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedItemsData = items.filter(item => selectedItems.includes(item.id));
  const totalQuantity = selectedItemsData.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">
        PIN {pin} - Complete Order Claim
      </h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">Customer Email:</p>
        <p className="font-medium text-gray-900">{order.email}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Items in this order:</h3>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                selectedItems.includes(item.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleItemToggle(item.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  disabled={isProcessing}
                />
                <div>
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-500">PIN: {item.pin_code}</div>
                </div>
              </div>
              <div className="text-lg font-semibold text-blue-600">
                × {item.qty}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedItems.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-lg font-medium text-gray-800">
            <strong>Total items to give:</strong> {totalQuantity}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {selectedItemsData.length} different products selected
          </p>
        </div>
      )}

      <div className="mb-6 space-y-3">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={emailConfirmed}
            onChange={(e) => setEmailConfirmed(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            disabled={isProcessing}
          />
          <span className="text-gray-700">Email confirmed with customer</span>
        </label>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={itemsGiven}
            onChange={(e) => setItemsGiven(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            disabled={isProcessing}
          />
          <span className="text-gray-700">Items have been given to customer</span>
        </label>
      </div>

      <button
        onClick={handleComplete}
        disabled={!emailConfirmed || !itemsGiven || selectedItems.length === 0 || isProcessing}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
          emailConfirmed && itemsGiven && selectedItems.length > 0 && !isProcessing
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Completing Claim...</span>
          </div>
        ) : (
          `Complete Claim (${totalQuantity} items)`
        )}
      </button>
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        Staff: Verify customer email matches and confirm all selected items have been given
      </p>
    </div>
  );
}
