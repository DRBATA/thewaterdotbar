"use client";

import { useState } from 'react';

interface SendEmailButtonProps {
  orderId: string;
}

export default function SendEmailButton({ orderId }: SendEmailButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsSending(true);
    setError(null);
    try {
      const response = await fetch('/api/email/send-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send email');
      }

      setIsSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const buttonStyles = "w-64 px-6 py-3 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-colors";

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleClick}
        disabled={isSending || isSent}
        className={`${buttonStyles} ${
          isSent
            ? 'bg-green-500 cursor-not-allowed focus:ring-green-400'
            : isSending
            ? 'bg-gray-400 cursor-wait focus:ring-gray-300'
            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        }`}
      >
        {isSent ? 'Email Sent!' : isSending ? 'Sending...' : 'Send Receipt to Email'}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
