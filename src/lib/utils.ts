import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting utility
export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

// Number formatting utility
export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

// Priority color mapping utility
export function getPriorityColor(priority: string) {
  switch (priority) {
    case 'Critical':
      return 'fis-critical-gradient text-red-800 border-red-200'
    case 'High':
      return 'fis-high-gradient text-orange-800 border-orange-200'
    case 'Medium':
      return 'bg-yellow-50 text-yellow-800 border-yellow-200'
    case 'Low':
      return 'bg-blue-50 text-blue-800 border-blue-200'
    default:
      return 'bg-gray-50 text-gray-800 border-gray-200'
  }
}

// Need reason formatting utility
export function formatNeedReason(reason: string) {
  if (reason === 'cnsDelivery') return 'CNS Delivery';
  if (reason === 'dvpDelivery') return 'DVP Delivery';
  if (reason === 'deficit') return 'Deficit';
  
  const spaced = reason.replace(/([A-Z])/g, ' $1');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
} 