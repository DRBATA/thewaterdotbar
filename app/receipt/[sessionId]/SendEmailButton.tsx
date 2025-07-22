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

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isSending || isSent}
        className={`px-4 py-2 rounded-md text-white font-semibold transition-colors ${
          isSent
            ? 'bg-green-500 cursor-not-allowed'
            : isSending
            ? 'bg-gray-400 cursor-wait'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isSent ? 'Email Sent!' : isSending ? 'Sending...' : 'Send Receipt to Email'}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
