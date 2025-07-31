"use client";
import { useState } from "react";

interface EmailVerificationProps {
  pin: string;
  options: Array<{
    itemId: string;
    orderId: string;
    maskedEmail: string;
    missingChars: Array<{ position: number; char: string }>;
  }>;
  onVerified: (orderItem: any) => void;
  onError: (error: string) => void;
}

export default function EmailVerification({ pin, options, onVerified, onError }: EmailVerificationProps) {
  const [inputValues, setInputValues] = useState<Record<string, string[]>>({});
  const [isVerifying, setIsVerifying] = useState(false);

  const handleInputChange = (optionIndex: number, charIndex: number, value: string) => {
    const key = `${optionIndex}`;
    const currentValues = inputValues[key] || new Array(options[optionIndex].missingChars.length).fill('');
    currentValues[charIndex] = value.toLowerCase();
    
    setInputValues({
      ...inputValues,
      [key]: currentValues
    });
  };

  const handleVerifyEmail = async (optionIndex: number) => {
    const option = options[optionIndex];
    const providedChars = inputValues[`${optionIndex}`] || [];
    
    // Build the verification payload
    const verificationData = option.missingChars.map((missing, index) => ({
      position: missing.position,
      char: providedChars[index] || ''
    }));

    setIsVerifying(true);
    
    try {
      const response = await fetch('/api/claim/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: option.itemId,
          providedChars: verificationData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        onVerified(result.orderItem);
      } else {
        onError(result.error || 'Email verification failed');
      }
    } catch (error) {
      onError('Network error during verification');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        PIN {pin} - Email Verification Required
      </h2>
      
      <p className="text-gray-600 text-center mb-8">
        Complete your email address to reveal your order:
      </p>

      <div className="space-y-6">
        {options.map((option, optionIndex) => (
          <div key={option.itemId} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-mono tracking-wider">
                {option.maskedEmail}
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-600">Fill in the missing characters:</span>
              {option.missingChars.map((missing, charIndex) => (
                <input
                  key={charIndex}
                  type="text"
                  maxLength={1}
                  className="w-8 h-8 text-center border border-gray-300 rounded focus:border-blue-500 focus:outline-none font-mono"
                  value={inputValues[`${optionIndex}`]?.[charIndex] || ''}
                  onChange={(e) => handleInputChange(optionIndex, charIndex, e.target.value)}
                  placeholder="?"
                />
              ))}
            </div>
            
            <button
              onClick={() => handleVerifyEmail(optionIndex)}
              disabled={isVerifying || !inputValues[`${optionIndex}`]?.every(char => char.trim() !== '')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        Staff: Ask the customer to provide the missing letters from their email address
      </div>
    </div>
  );
}
