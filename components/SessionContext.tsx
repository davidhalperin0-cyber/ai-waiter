"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type SessionStatus = 'none' | 'in_progress' | 'confirmed';

export interface SessionState {
  tableId: string;
  businessId: string;
  sessionStart: number; // timestamp
  orderStatus: SessionStatus;
  lastOrderTime?: number; // timestamp of last confirmed order
  lastCartUpdate?: number; // timestamp of last cart update
  upsellShown: boolean; // track if upsell was already shown in this phase
  everythingOkayShown: boolean; // track if "everything okay" was shown
  incompleteOrderShown: boolean; // track if incomplete order prompt was shown
  deviceId?: string; // unique device identifier for AI history
}

// Generate or get device ID for AI history persistence
export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  
  const storageKey = 'device_id';
  let deviceId = localStorage.getItem(storageKey);
  
  if (!deviceId) {
    // Generate a unique device ID
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(storageKey, deviceId);
  }
  
  return deviceId;
}

interface SessionContextValue {
  session: SessionState | null;
  updateSession: (updates: Partial<SessionState>) => void;
  resetSession: () => void;
  markOrderConfirmed: () => void;
  markCartUpdated: () => void;
  isSessionValid: () => boolean; // Check if session is still valid (within 1 hour)
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ 
  children, 
  tableId, 
  businessId 
}: { 
  children: ReactNode;
  tableId: string;
  businessId: string;
}) {
  const [session, setSession] = useState<SessionState | null>(null);

  // Initialize or load session from localStorage
  useEffect(() => {
    const storageKey = `session_${businessId}_${tableId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check if session is still valid (not older than 1 hour)
        const now = Date.now();
        const sessionAge = now - parsed.sessionStart;
        const maxAge = 60 * 60 * 1000; // 1 hour
        
        if (sessionAge < maxAge) {
          setSession(parsed);
          return;
        }
      } catch (e) {
        // Invalid stored data, create new session
      }
    }
    
    // Create new session
    const newSession: SessionState = {
      tableId,
      businessId,
      sessionStart: Date.now(),
      orderStatus: 'none',
      upsellShown: false,
      everythingOkayShown: false,
      incompleteOrderShown: false,
      deviceId: getDeviceId(),
    };
    
    setSession(newSession);
    localStorage.setItem(storageKey, JSON.stringify(newSession));
  }, [tableId, businessId]);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (session) {
      const storageKey = `session_${businessId}_${tableId}`;
      localStorage.setItem(storageKey, JSON.stringify(session));
    }
  }, [session, businessId, tableId]);

  function updateSession(updates: Partial<SessionState>) {
    setSession((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }

  function resetSession() {
    const storageKey = `session_${businessId}_${tableId}`;
    localStorage.removeItem(storageKey);
    const newSession: SessionState = {
      tableId,
      businessId,
      sessionStart: Date.now(),
      orderStatus: 'none',
      upsellShown: false,
      everythingOkayShown: false,
      incompleteOrderShown: false,
      deviceId: getDeviceId(),
    };
    setSession(newSession);
  }

  function markOrderConfirmed() {
    updateSession({
      orderStatus: 'confirmed',
      lastOrderTime: Date.now(),
      upsellShown: false, // Reset for next order
      incompleteOrderShown: false,
    });
  }

  function markCartUpdated() {
    updateSession({
      orderStatus: 'in_progress',
      lastCartUpdate: Date.now(),
    });
  }

  function isSessionValid(): boolean {
    if (!session) return false;
    const now = Date.now();
    const sessionAge = now - session.sessionStart;
    const maxAge = 60 * 60 * 1000; // 1 hour
    return sessionAge < maxAge;
  }

  return (
    <SessionContext.Provider value={{ session, updateSession, resetSession, markOrderConfirmed, markCartUpdated, isSessionValid }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}



