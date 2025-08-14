'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Check, Trash2 } from 'lucide-react';
import { ownedProductsHelpers, planHelpers } from '@/lib/dexie-db';

interface AutoDownloadPopupProps {
  orderItems: Array<{
    id: string;
    item_id: string;
    name: string;
    qty: number;
    price: number;
    plan?: any;
  }>;
  orderId: string;
  onClose: () => void;
}

interface DrinkItem {
  id: string;
  name: string;
  quantity: number;
  consumed: number;
  timing?: string;
  dosage?: string;
  frequency?: string;
}

export default function AutoDownloadPopup({ orderItems, orderId, onClose }: AutoDownloadPopupProps) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [drinkItems, setDrinkItems] = useState<DrinkItem[]>([]);
  const [showDontShowAgain, setShowDontShowAgain] = useState(false);

  useEffect(() => {
    // Convert order items to drink items for tracking
    const drinks = orderItems.map(item => ({
      id: item.item_id,
      name: item.name,
      quantity: item.qty,
      consumed: 0,
      timing: item.plan?.timing || 'As needed',
      dosage: item.plan?.dosage || '1 serving',
      frequency: item.plan?.frequency || 'Daily'
    }));
    setDrinkItems(drinks);
  }, [orderItems]);

  const handleSaveToPersonalCoach = async () => {
    setStatus('saving');

    try {
      // Transform order items to match the expected format
      const formattedItems = orderItems.map(item => ({
        id: item.id,
        product_id: item.item_id,
        name: item.name,
        quantity: item.qty,
        price: item.price,
        timing: item.plan?.timing,
        dosage: item.plan?.dosage,
        frequency: item.plan?.frequency,
        contraindications: item.plan?.contraindications || [],
        venueIntegration: item.plan?.venueIntegration
      }));

      // Save to owned products (existing functionality)
      await ownedProductsHelpers.addFromOrder(formattedItems, orderId);

      // Save as hydration plan (NEW: Cart ID becomes Plan ID)
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 3 days later
      
      const planData = {
        planId: orderId, // Cart/Order ID becomes Plan ID
        orderId: orderId,
        products: orderItems.map(item => ({
          productId: item.item_id,
          name: item.name,
          quantity: item.qty,
          timing: item.plan?.timing,
          dosage: item.plan?.dosage,
          frequency: item.plan?.frequency
        })),
        startDate: today,
        endDate: endDate,
        totalSodium: 0, // Will be calculated by AI
        totalPotassium: 0, // Will be calculated by AI
        totalFluid: 0, // Will be calculated by AI
        userFeedback: undefined
      };

      await planHelpers.savePlan(planData);
      
      setStatus('saved');
      
      // Check if user doesn't want to see this again
      const dontShow = localStorage.getItem('hideDownloadPopup');
      if (dontShow === 'true') {
        setTimeout(() => onClose(), 2000);
      }
      
    } catch (error) {
      console.error('Error saving to personal coach:', error);
      setStatus('error');
    }
  };

  const handleMarkConsumed = (drinkId: string) => {
    setDrinkItems(prev => prev.map(drink => 
      drink.id === drinkId 
        ? { ...drink, consumed: Math.min(drink.consumed + 1, drink.quantity) }
        : drink
    ));
  };

  const handleRemoveConsumed = (drinkId: string) => {
    setDrinkItems(prev => prev.map(drink => 
      drink.id === drinkId 
        ? { ...drink, consumed: Math.max(drink.consumed - 1, 0) }
        : drink
    ));
  };

  const handleDontShowAgain = () => {
    localStorage.setItem('hideDownloadPopup', 'true');
    setShowDontShowAgain(true);
    setTimeout(() => onClose(), 1000);
  };

  const getRemainingDrinks = () => {
    return drinkItems.reduce((total, drink) => total + (drink.quantity - drink.consumed), 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              🎉 Drinks Downloaded!
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Your drinks are ready for personalized coaching over the next few days!
            </p>

            {status === 'idle' && (
              <button
                onClick={handleSaveToPersonalCoach}
                className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
                         flex items-center justify-center
                         bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-white
                         hover:shadow-lg hover:shadow-teal-500/25"
              >
                <Download className="w-4 h-4 mr-2" />
                Save to Personal Coach
              </button>
            )}

            {status === 'saving' && (
              <div className="flex items-center justify-center py-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500 mr-2"></div>
                Saving to Coach...
              </div>
            )}

            {status === 'saved' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center text-green-800">
                  <Check className="w-5 h-5 mr-2" />
                  <span className="font-medium">Saved to Personal Coach!</span>
                </div>
                <p className="text-green-700 text-sm mt-2">
                  Chat with your AI coach about optimal timing and usage.
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  Failed to save. Please try again.
                </p>
              </div>
            )}
          </div>

          {status === 'saved' && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">
                Track Your Consumption ({getRemainingDrinks()} remaining)
              </h4>
              <div className="space-y-3">
                {drinkItems.map((drink) => (
                  <div key={drink.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{drink.name}</p>
                      <p className="text-xs text-gray-600">
                        {drink.consumed}/{drink.quantity} consumed
                      </p>
                      <p className="text-xs text-gray-500">{drink.timing}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRemoveConsumed(drink.id)}
                        disabled={drink.consumed === 0}
                        className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium min-w-[20px] text-center">
                        {drink.quantity - drink.consumed}
                      </span>
                      <button
                        onClick={() => handleMarkConsumed(drink.id)}
                        disabled={drink.consumed >= drink.quantity}
                        className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showDontShowAgain}
                onChange={(e) => setShowDontShowAgain(e.target.checked)}
                className="mr-2 rounded border-gray-300"
              />
              <span className="text-xs text-gray-600">Don't show this again</span>
            </label>
            {showDontShowAgain && (
              <button
                onClick={handleDontShowAgain}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Save preference
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
