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
  isSessionValid: () => boolean; // Check if session is still valid (within 1 minute for testing)
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize or load session from localStorage
  // IMPORTANT: Only load existing valid session, don't create new one automatically
  // This prevents expired sessions from being reset on page refresh
  useEffect(() => {
    const storageKey = `session_${businessId}_${tableId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check if session is still valid (not older than 1 minute for testing)
        const now = Date.now();
        const sessionAge = now - parsed.sessionStart;
        const maxAge = 60 * 1000; // 1 minute (for testing)
        
        console.log('Checking stored session:', { 
          sessionAge, 
          maxAge, 
          isValid: sessionAge < maxAge,
          sessionAgeSeconds: Math.floor(sessionAge / 1000),
          maxAgeSeconds: Math.floor(maxAge / 1000),
          remainingSeconds: sessionAge < maxAge ? Math.floor((maxAge - sessionAge) / 1000) : 0,
          sessionStart: parsed.sessionStart,
          now
        });
        
        if (sessionAge < maxAge) {
          // Session is valid - load it
          console.log('Loading valid session');
          setSession(parsed);
          setIsInitialized(true);
          return;
        } else {
          // Session expired - remove it from localStorage and clear from state
          console.log('Session expired - removing:', { sessionAge, maxAge, expired: true });
          localStorage.removeItem(storageKey);
          // Mark that session was expired so we don't create a new one on refresh
          const expirationCheckKey = `session_expired_${businessId}_${tableId}`;
          localStorage.setItem(expirationCheckKey, Date.now().toString());
          setSession(null);
          setIsInitialized(true);
        }
      } catch (e) {
        // Invalid stored data - remove it but don't create new session
        console.error('Invalid session data:', e);
        localStorage.removeItem(storageKey);
        setSession(null);
        setIsInitialized(true);
      }
    } else {
      // No stored session - this could mean:
      // 1. First-time visitor (should create new session)
      // 2. Session expired and was removed (should NOT create new session)
      // To distinguish, we check if there's a flag indicating expiration
      // For now, we'll only create a new session if we can't determine expiration
      // The page-level checks will handle showing the expired message
      
      // Check if there was a recent expiration (within last 2 minutes)
      // If so, don't create new session - it was likely expired
      const expirationCheckKey = `session_expired_${businessId}_${tableId}`;
      const expiredFlag = localStorage.getItem(expirationCheckKey);
      
      if (expiredFlag) {
        const expiredTime = parseInt(expiredFlag, 10);
        const timeSinceExpiration = Date.now() - expiredTime;
        // If expired within last 2 minutes, don't create new session
        if (timeSinceExpiration < 2 * 60 * 1000) {
          console.log('Session was recently expired - not creating new one');
          setSession(null);
          setIsInitialized(true);
          return;
        } else {
          // Old expiration flag - remove it and allow new session
          localStorage.removeItem(expirationCheckKey);
        }
      }
      
      // No expiration flag or old expiration - this is likely a first-time visitor or new QR scan
      // Clear any old expiration flag and create a new session
      // expirationCheckKey already defined above, so just use it
      localStorage.removeItem(expirationCheckKey); // Clear expiration flag for new session
      
      console.log('No stored session found - creating new session');
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
      setIsInitialized(true);
      // Don't save to localStorage here - let the save useEffect handle it
    }
  }, [tableId, businessId]);

  // Save session to localStorage whenever it changes
  // BUT: Only save if session is valid (not expired) and after initialization
  useEffect(() => {
    // Don't save until initialization is complete to avoid race conditions
    if (!isInitialized) return;
    
    if (session) {
      const storageKey = `session_${businessId}_${tableId}`;
      // Double check session is still valid before saving
      const now = Date.now();
      const sessionAge = now - session.sessionStart;
      const maxAge = 60 * 1000; // 1 minute (for testing)
      
      console.log('Attempting to save session:', { sessionAge, maxAge, isValid: sessionAge < maxAge });
      
      if (sessionAge < maxAge) {
        localStorage.setItem(storageKey, JSON.stringify(session));
        console.log('Session saved to localStorage');
      } else {
        // Session expired - don't save it, remove it and clear from state
        console.log('Preventing save of expired session:', { sessionAge, maxAge });
        localStorage.removeItem(storageKey);
        setSession(null);
      }
    } else {
      // If session is null, make sure it's removed from localStorage
      const storageKey = `session_${businessId}_${tableId}`;
      localStorage.removeItem(storageKey);
      console.log('Session is null - removed from localStorage');
    }
  }, [session, businessId, tableId, isInitialized]);

  function updateSession(updates: Partial<SessionState>) {
    setSession((prev) => {
      if (!prev) return null;
      
      // Check if any values actually changed
      let hasChanges = false;
      for (const key in updates) {
        if (prev[key as keyof SessionState] !== updates[key as keyof SessionState]) {
          hasChanges = true;
          break;
        }
      }
      
      // Only update if values actually changed
      if (!hasChanges) {
        return prev;
      }
      
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
    const maxAge = 60 * 1000; // 1 minute (for testing)
    const isValid = sessionAge < maxAge;
    
    // If session expired, clear it
    if (!isValid && typeof window !== 'undefined') {
      const storageKey = `session_${businessId}_${tableId}`;
      localStorage.removeItem(storageKey);
      setSession(null); // Clear session from state too
    }
    
    return isValid;
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



