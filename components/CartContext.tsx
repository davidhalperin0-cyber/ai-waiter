"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: string[];
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (menuItemId: string, quantity?: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function addItem(item: Omit<CartItem, 'quantity'> & { quantity?: number }) {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.menuItemId
            ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
            : i,
        );
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }];
    });
  }

  function removeItem(menuItemId: string, quantity?: number) {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItemId);
      if (!existing) return prev;
      
      const removeQty = quantity ?? existing.quantity;
      if (removeQty >= existing.quantity) {
        // Remove the item completely
        return prev.filter((i) => i.menuItemId !== menuItemId);
      } else {
        // Reduce quantity
        return prev.map((i) =>
          i.menuItemId === menuItemId
            ? { ...i, quantity: i.quantity - removeQty }
            : i,
        );
      }
    });
  }

  function clear() {
    setItems([]);
  }

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

