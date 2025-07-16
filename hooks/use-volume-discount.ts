import { volumeDiscountTiers } from '@/lib/discount-tiers';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export function useVolumeDiscount(items: CartItem[]) {
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Find the highest applicable tier
  const tier = [...volumeDiscountTiers]
    .reverse()
    .find((t) => itemCount >= t.minItems) || null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = tier ? subtotal * tier.rate : 0;

  return {
    tier,
    subtotal,
    discount,
    total: subtotal - discount,
  };
}
