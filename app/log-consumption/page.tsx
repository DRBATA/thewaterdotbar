'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { db, ownedProductsHelpers } from '@/lib/dexie-db';
import crypto from 'crypto-js';

export default function LogConsumptionPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function processLog() {
      try {
        const dataParam = searchParams.get('data');
        const sigParam = searchParams.get('sig');

        if (!dataParam || !sigParam) {
          throw new Error('Invalid link - missing parameters');
        }

        // Verify signature
        const expectedSig = crypto.HmacSHA256(dataParam, process.env.NEXT_PUBLIC_WEBHOOK_SECRET || 'your-secret-key')
          .toString(crypto.enc.Base64url);

        if (sigParam !== expectedSig) {
          throw new Error('Invalid signature - link may have been tampered with');
        }

        // Decode payload
        const payload = JSON.parse(
          Buffer.from(dataParam, 'base64url').toString('utf-8')
        );

        const { products: productList, orderId } = payload;
        setProducts(productList);

        // Log each product to Dexie
        for (const product of productList) {
          // Check if product already exists in owned_products
          const existing = await db.owned_products
            .where('productId')
            .equals(product.product_id)
            .first();

          if (existing) {
            // Add consumption to existing product
            await ownedProductsHelpers.logConsumption(
              existing.id!,
              `${product.quantity}x`,
              `AOI Experience - Order ${orderId}`
            );
          } else {
            // Add new product with first consumption
            await ownedProductsHelpers.addProduct({
              productId: product.product_id,
              name: product.name,
              purchaseDate: new Date(),
              orderId: orderId,
              isActive: true,
            });

            // Get the newly created product and log consumption
            const newProduct = await db.owned_products
              .where('productId')
              .equals(product.product_id)
              .first();

            if (newProduct) {
              await ownedProductsHelpers.logConsumption(
                newProduct.id!,
                `${product.quantity}x`,
                `AOI Experience - Order ${orderId}`
              );
            }
          }
        }

        setStatus('success');
        setMessage(`Successfully logged ${productList.length} products to your hydration tracker!`);

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);

      } catch (error: any) {
        console.error('❌ Failed to log consumption:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to log consumption. Please try again.');
      }
    }

    processLog();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Logging to Your Tracker...
            </h1>
            <p className="text-gray-600">
              Updating your hydration records
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Success!
            </h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-purple-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Logged Products:</h3>
              <ul className="text-left text-sm text-gray-700 space-y-1">
                {products.map((p, i) => (
                  <li key={i}>• {p.name} ({p.quantity}x)</li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-gray-500">
              Redirecting to your dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Error
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
