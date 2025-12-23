/**
 * Order Mapper
 * Converts internal Order (DB format) to CanonicalOrder (POS format)
 * This is the ONLY place where Order → CanonicalOrder conversion happens
 */

import { Order, CanonicalOrder } from '@/lib/types';

/**
 * Converts DB Order to CanonicalOrder
 * This is the single source of truth for order format conversion
 * 
 * @param order - Order from database
 * @param source - Order source ('QR_MENU' or 'AI')
 * @returns CanonicalOrder ready for POS adapters
 */
export function orderToCanonical(order: Order, source: 'QR_MENU' | 'AI' = 'QR_MENU'): CanonicalOrder {
  // Calculate item totals
  const items = order.items.map((item) => ({
    id: item.menuItemId,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.price,
    total: item.price * item.quantity,
  }));

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = 0; // Tax calculation can be added later if needed
  const discount = 0; // Discount calculation can be added later if needed
  const calculatedTotal = subtotal + tax - discount;
  
  // Validate data consistency (DB remains source of truth)
  if (Math.abs(calculatedTotal - order.totalAmount) > 0.01) {
    console.warn(
      `Order ${order.orderId} total mismatch: DB=${order.totalAmount}, Calculated=${calculatedTotal.toFixed(2)}`
    );
  }
  
  const total = order.totalAmount; // Use DB value as source of truth

  return {
    orderId: order.orderId,
    businessId: order.businessId,
    table: order.tableId,
    source,
    items,
    subtotal,
    tax,
    discount,
    total,
    notes: order.aiSummary || undefined,
    createdAt: order.createdAt,
  };
}

