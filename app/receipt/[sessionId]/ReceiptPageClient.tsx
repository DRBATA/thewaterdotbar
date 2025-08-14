'use client';

import React, { useState, useEffect } from 'react';
import AutoDownloadPopup from './AutoDownloadPopup';

interface ReceiptPageClientProps {
  orderItems: Array<{
    id: string;
    item_id: string;
    name: string;
    qty: number;
    price: number;
    plan?: any;
  }>;
  orderId: string;
  children: React.ReactNode;
}

export default function ReceiptPageClient({ orderItems, orderId, children }: ReceiptPageClientProps) {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Check if user has disabled the popup
    const hidePopup = localStorage.getItem('hideDownloadPopup');
    
    // Only show popup if user hasn't disabled it and there are items to save
    if (hidePopup !== 'true' && orderItems.length > 0) {
      // Show popup after a short delay to let the page load
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [orderItems.length]);

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  return (
    <>
      {children}
      {showPopup && (
        <AutoDownloadPopup
          orderItems={orderItems}
          orderId={orderId}
          onClose={handleClosePopup}
        />
      )}
    </>
  );
}
