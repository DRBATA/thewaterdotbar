import { clsx, type ClassValue } from "clsx"

export function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} AED`;
}
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
