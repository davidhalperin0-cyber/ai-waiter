"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

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
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clear: () => void;
  getCart: () => CartItem[];
  setBusinessAndTable: (businessId: string, tableId: string) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

// Storage key - will be set per business/table
const getStorageKey = (businessId?: string, tableId?: string): string => {
  if (businessId && tableId) {
    return `cart_${businessId}_${tableId}`;
  }
  return 'cart_default';
};

export function CartProvider({ 
  children,
}: { 
  children: ReactNode;
}) {
  const [businessId, setBusinessIdState] = useState<string | undefined>();
  const [tableId, setTableIdState] = useState<string | undefined>();
  
  const setBusinessAndTable = useCallback((bid: string, tid: string) => {
    setBusinessIdState(bid);
    setTableIdState(tid);
  }, []);
  
  const storageKey = getStorageKey(businessId, tableId);
  
  // Initialize cart from localStorage - will reload when storageKey changes
  const [items, setItems] = useState<CartItem[]>([]);
  
  // Load cart from localStorage when businessId/tableId are set
  useEffect(() => {
    if (typeof window === 'undefined' || !businessId || !tableId) return;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading cart from localStorage:', e);
    }
  }, [businessId, tableId, storageKey]);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving cart to localStorage:', e);
    }
  }, [items, storageKey]);

  // Sync with other tabs/windows via storage event
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const newItems = JSON.parse(e.newValue);
          if (Array.isArray(newItems)) {
            setItems(newItems);
          }
        } catch (e) {
          console.error('Error syncing cart from storage event:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.menuItemId);
      if (existing) {
        const updated = prev.map((i) =>
          i.menuItemId === item.menuItemId
            ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
            : i,
        );
        return updated;
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }];
    });
  }, []);

  const removeItem = useCallback((menuItemId: string, quantity?: number) => {
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
  }, []);

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      // Auto-remove if quantity is 0 or negative
      removeItem(menuItemId);
      return;
    }
    
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItemId);
      if (!existing) return prev;
      
      return prev.map((i) =>
        i.menuItemId === menuItemId
          ? { ...i, quantity }
          : i,
      );
    });
  }, [removeItem]);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const getCart = useCallback(() => {
    return items;
  }, [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear, getCart, setBusinessAndTable }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

