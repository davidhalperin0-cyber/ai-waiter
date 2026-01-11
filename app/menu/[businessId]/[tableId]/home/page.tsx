'use client';

import React from 'react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeWrapper from '../../../../../components/themes/ThemeWrapper';
import { SessionProvider } from '@/components/SessionContext';

// Modern SVG Icons
function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function LoyaltyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function HomePageContent({
  businessId,
  tableId,
}: {
  businessId: string;
  tableId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessInfo, setBusinessInfo] = useState<{
    name: string;
    nameEn?: string; // Optional English translation
    logoUrl?: string;
    template: 'bar-modern' | 'bar-classic' | 'bar-mid' | 'pizza-modern' | 'pizza-classic' | 'pizza-mid' | 'sushi' | 'generic' | 'gold';
    customContent?: {
      menuButtonImageUrl?: string;
      contact?: {
        enabled: boolean;
        phone?: string;
        email?: string;
        whatsapp?: string;
        instagram?: string;
        facebook?: string;
      };
      loyaltyClub?: {
        enabled: boolean;
      };
      reviews?: {
        enabled: boolean;
        googleReviewsUrl?: string;
      };
    };
  } | null>(null);
  const [language, setLanguage] = useState<'he' | 'en'>('he');
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [loyaltyName, setLoyaltyName] = useState('');
  const [loyaltyPhone, setLoyaltyPhone] = useState('');
  const [loyaltyEmail, setLoyaltyEmail] = useState('');
  const [loyaltySubmitting, setLoyaltySubmitting] = useState(false);
  const [loyaltySuccess, setLoyaltySuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // CRITICAL: Define cache keys before using them
        const templateKey = `business_${businessId}_template`;
        const cacheVersionKey = `business_${businessId}_template_version`;
        
        // Check if there's a URL parameter to force refresh (for testing/debugging)
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const forceRefresh = urlParams?.get('refresh') === 'true';
        
        // If force refresh, clear template cache
        if (forceRefresh && typeof window !== 'undefined') {
          localStorage.removeItem(templateKey);
          localStorage.removeItem(cacheVersionKey);
          console.log('🔄 Force refresh: Cleared template cache');
        }
        
        // Add cache busting and version check to force fresh data
        const lastKnownVersion = typeof window !== 'undefined' ? localStorage.getItem(cacheVersionKey) : null;
        
        const infoRes = await fetch(
          `/api/menu/info?businessId=${encodeURIComponent(businessId)}&_t=${Date.now()}&_v=${lastKnownVersion || '0'}`,
          { cache: 'no-store' }
        );
        const infoData = await infoRes.json();

        if (!infoRes.ok) {
          throw new Error(infoData.message || 'Error loading information');
        }

        // Debug: Log what we received from API
        console.log('📥 API Response - Template and customContent:', {
          template: infoData.template,
          hasCustomContent: !!infoData.customContent,
          customContent: infoData.customContent,
          contact: infoData.customContent?.contact,
          facebook: infoData.customContent?.contact?.facebook,
          instagram: infoData.customContent?.contact?.instagram,
        });

        // CRITICAL: Check localStorage for cached template that was saved after update
        // This bypasses read replica lag by using the data we know was saved
        const cachedTemplateData = typeof window !== 'undefined' ? localStorage.getItem(templateKey) : null;
        let cachedTemplate: string | null = null;
        let cachedTemplateTimestamp = 0;
        
        if (cachedTemplateData) {
          try {
            const parsed = JSON.parse(cachedTemplateData);
            cachedTemplate = parsed.template;
            cachedTemplateTimestamp = parsed.timestamp || 0;
            console.log('💾 Found cached template in localStorage:', {
              timestamp: cachedTemplateTimestamp,
              age: Date.now() - cachedTemplateTimestamp,
              template: cachedTemplate,
            });
          } catch (e) {
            console.warn('⚠️ Failed to parse cached template:', e);
          }
        }

        // CRITICAL: Check localStorage for cached name, nameEn, and logoUrl that were saved after update
        // This bypasses read replica lag by using the data we know was saved
        const basicInfoKey = `business_${businessId}_basicInfo`;
        const cachedBasicInfoData = typeof window !== 'undefined' ? localStorage.getItem(basicInfoKey) : null;
        let cachedName: string | null = null;
        let cachedNameEn: string | undefined = undefined;
        let cachedLogoUrl: string | undefined = undefined;
        let cachedBasicInfoTimestamp = 0;
        
        if (cachedBasicInfoData) {
          try {
            const parsed = JSON.parse(cachedBasicInfoData);
            cachedName = parsed.name;
            cachedNameEn = parsed.nameEn;
            cachedLogoUrl = parsed.logoUrl;
            cachedBasicInfoTimestamp = parsed.timestamp || 0;
            console.log('💾 Found cached basicInfo in localStorage:', {
              timestamp: cachedBasicInfoTimestamp,
              age: Date.now() - cachedBasicInfoTimestamp,
              name: cachedName,
              nameEn: cachedNameEn,
              logoUrl: cachedLogoUrl,
            });
          } catch (e) {
            console.warn('⚠️ Failed to parse cached basicInfo:', e);
          }
        }

        // CRITICAL: Check cache version to detect if template was updated recently
        // If cache version is newer than what we're seeing, prefer cached template
        const currentCacheVersion = typeof window !== 'undefined' ? localStorage.getItem(cacheVersionKey) : null;
        const cacheVersionNumber = currentCacheVersion ? parseInt(currentCacheVersion, 10) : 0;
        const lastKnownVersionNumber = lastKnownVersion ? parseInt(lastKnownVersion, 10) : 0;
        
        // CRITICAL: Always prioritize API template if it's different from cache
        // BUT: If cache was updated more recently (newer version), prefer cache to bypass read replica lag
        let finalTemplate = (infoData.template || 'generic') as any;
        
        console.log('🔍 Template comparison:', {
          cachedTemplate,
          apiTemplate: infoData.template,
          areDifferent: cachedTemplate !== infoData.template,
          cachedAge: cachedTemplateTimestamp > 0 ? Date.now() - cachedTemplateTimestamp : 0,
          cacheVersion: cacheVersionNumber,
          lastKnownVersion: lastKnownVersionNumber,
          cacheIsNewer: cacheVersionNumber > lastKnownVersionNumber,
        });
        
        // If cache version is newer than what we knew about, template was just updated
        // In this case, prefer cached template even if API doesn't match (read replica lag)
        if (cachedTemplate && cacheVersionNumber > lastKnownVersionNumber && cachedTemplateTimestamp > Date.now() - 10 * 60 * 1000) {
          console.log('🔄 Cache version is newer! Using cached template (bypassing read replica lag):', {
            cachedTemplate,
            apiTemplate: infoData.template,
            cacheVersion: cacheVersionNumber,
            lastKnownVersion: lastKnownVersionNumber,
          });
          finalTemplate = cachedTemplate as any;
        } else if (cachedTemplate && cachedTemplate !== infoData.template && infoData.template) {
          // Cache and API differ, and cache isn't newer - use API (template was updated on server)
          console.log('🔄 Template changed! Using API template (newer):', {
            cachedTemplate,
            apiTemplate: infoData.template,
          });
          // Clear cached template to force use of API template
          if (typeof window !== 'undefined') {
            localStorage.removeItem(templateKey);
            // Update version to signal change
            localStorage.setItem(cacheVersionKey, Date.now().toString());
          }
          finalTemplate = infoData.template as any;
        } else if (cachedTemplate === infoData.template && cachedTemplateTimestamp > Date.now() - 5 * 60 * 1000) {
          // Only use cache if it matches API AND is recent (both conditions must be true)
          finalTemplate = cachedTemplate as any;
          console.log('✅ Using cached template (matches API and is recent):', {
            template: finalTemplate,
            cachedAge: Date.now() - cachedTemplateTimestamp,
          });
        } else {
          // Default: Use API template (most reliable source)
          finalTemplate = (infoData.template || 'generic') as any;
          console.log('📥 Using API template (default):', {
            template: finalTemplate,
            reason: !cachedTemplate ? 'no cache' : cachedTemplate !== infoData.template ? 'mismatch' : 'cache too old',
          });
          // Update cache with API template
          if (typeof window !== 'undefined' && finalTemplate) {
            const now = Date.now();
            localStorage.setItem(templateKey, JSON.stringify({
              template: finalTemplate,
              timestamp: now,
            }));
            localStorage.setItem(cacheVersionKey, now.toString());
          }
        }
        
        console.log('🎨 Final template selected:', finalTemplate);

        // CRITICAL: Use cached name, nameEn, and logoUrl if they're newer than 5 minutes old
        // This ensures we use the data we know was saved, not stale read replica data
        let finalName = infoData.name || 'העסק';
        let finalNameEn = infoData.nameEn || undefined;
        let finalLogoUrl = infoData.logoUrl;
        
        if (cachedBasicInfoTimestamp > Date.now() - 5 * 60 * 1000) {
          // Cached data is recent (less than 5 minutes old), use it instead of API data
          if (cachedName !== null) finalName = cachedName;
          if (cachedNameEn !== undefined) finalNameEn = cachedNameEn;
          if (cachedLogoUrl !== undefined) finalLogoUrl = cachedLogoUrl;
          console.log('✅ Using cached basicInfo from localStorage (source of truth):', {
            name: finalName,
            nameEn: finalNameEn,
            logoUrl: finalLogoUrl,
            cachedAge: Date.now() - cachedBasicInfoTimestamp,
          });
        }

        // Only update if values actually changed to prevent infinite re-renders
        setBusinessInfo((prev) => {
          const newBusinessInfo = {
            name: finalName, // Use cached or API data
            nameEn: finalNameEn, // Use cached or API data
            logoUrl: finalLogoUrl, // Use cached or API data
            template: finalTemplate, // Use cached or API data
            customContent: infoData.customContent || null,
          };

          console.log('📥 Setting businessInfo state:', {
            hasCustomContent: !!newBusinessInfo.customContent,
            contact: newBusinessInfo.customContent?.contact,
            facebook: newBusinessInfo.customContent?.contact?.facebook,
            instagram: newBusinessInfo.customContent?.contact?.instagram,
          });

          if (!prev) return newBusinessInfo;

          // Deep comparison to check if anything actually changed
          const nameChanged = prev.name !== newBusinessInfo.name;
          const logoChanged = prev.logoUrl !== newBusinessInfo.logoUrl;
          const templateChanged = prev.template !== newBusinessInfo.template;
          const contentChanged = JSON.stringify(prev.customContent) !== JSON.stringify(newBusinessInfo.customContent);

          // If nothing changed, return previous to prevent re-render
          if (!nameChanged && !logoChanged && !templateChanged && !contentChanged) {
            return prev;
          }

          return newBusinessInfo;
        });
      } catch (err: any) {
        setError(err.message || 'Error loading information');
      } finally {
        setLoading(false);
      }
    }

    if (businessId) {
      loadData();
    }
  }, [businessId]);

  // CRITICAL: Listen for template changes via localStorage storage events
  // This allows the page to update immediately when template is changed in another tab
  useEffect(() => {
    if (typeof window === 'undefined' || !businessId) return;
    
    const templateKey = `business_${businessId}_template`;
    const cacheVersionKey = `business_${businessId}_template_version`;
    
    const handleStorageChange = (e: StorageEvent) => {
      // Check if template or version changed
      if (e.key === templateKey || e.key === cacheVersionKey) {
        console.log('🔄 Template storage changed, reloading data...', {
          key: e.key,
          newValue: e.newValue,
        });
        // Reload business info to get updated template
        async function reloadData() {
          try {
            const lastKnownVersion = localStorage.getItem(cacheVersionKey);
            const infoRes = await fetch(
              `/api/menu/info?businessId=${encodeURIComponent(businessId)}&_t=${Date.now()}&_v=${lastKnownVersion || '0'}`,
              { cache: 'no-store' }
            );
            const infoData = await infoRes.json();
            
            if (infoRes.ok) {
              // Get updated cache
              const cachedTemplateData = localStorage.getItem(templateKey);
              let cachedTemplate: string | null = null;
              let cachedTemplateTimestamp = 0;
              
              if (cachedTemplateData) {
                try {
                  const parsed = JSON.parse(cachedTemplateData);
                  cachedTemplate = parsed.template;
                  cachedTemplateTimestamp = parsed.timestamp || 0;
                } catch (e) {
                  console.warn('Failed to parse cached template:', e);
                }
              }
              
              const currentCacheVersion = localStorage.getItem(cacheVersionKey);
              const cacheVersionNumber = currentCacheVersion ? parseInt(currentCacheVersion, 10) : 0;
              const lastKnownVersionNumber = lastKnownVersion ? parseInt(lastKnownVersion, 10) : 0;
              
              // Use same logic as loadData to determine final template
              let finalTemplate = (infoData.template || 'generic') as any;
              
              if (cachedTemplate && cacheVersionNumber > lastKnownVersionNumber && cachedTemplateTimestamp > Date.now() - 10 * 60 * 1000) {
                finalTemplate = cachedTemplate as any;
              } else if (cachedTemplate && cachedTemplate !== infoData.template && infoData.template) {
                finalTemplate = infoData.template as any;
              } else if (cachedTemplate === infoData.template && cachedTemplateTimestamp > Date.now() - 5 * 60 * 1000) {
                finalTemplate = cachedTemplate as any;
              }
              
              // Update state if template changed
              setBusinessInfo((prev) => {
                if (!prev || prev.template !== finalTemplate) {
                  return {
                    ...prev!,
                    template: finalTemplate,
                  };
                }
                return prev;
              });
            }
          } catch (err) {
            console.error('Error reloading template:', err);
          }
        }
        
        reloadData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for same-tab updates (when template is saved in same tab)
    const checkVersionInterval = setInterval(() => {
      const currentVersion = localStorage.getItem(cacheVersionKey);
      const storedVersion = sessionStorage.getItem(`last_template_version_${businessId}`);
      
      if (currentVersion && currentVersion !== storedVersion) {
        console.log('🔄 Template version changed in same tab, reloading...');
        sessionStorage.setItem(`last_template_version_${businessId}`, currentVersion);
        handleStorageChange({
          key: cacheVersionKey,
          newValue: currentVersion,
        } as StorageEvent);
      }
    }, 1000); // Check every second
    
    // Initialize stored version
    const currentVersion = localStorage.getItem(cacheVersionKey);
    if (currentVersion) {
      sessionStorage.setItem(`last_template_version_${businessId}`, currentVersion);
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkVersionInterval);
    };
  }, [businessId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('menu_language');
    if (saved === 'he' || saved === 'en') {
      setLanguage(saved);
    }
  }, []);

  // CRITICAL: Clear expiration flag IMMEDIATELY when this page loads
  // This page is the entry point when scanning QR - clearing the flag here
  // allows SessionProvider to create a new session
  // This must run synchronously BEFORE any React effects or SessionProvider initializes
  if (typeof window !== 'undefined' && businessId && tableId) {
    const expirationCheckKey = `session_expired_${businessId}_${tableId}`;
    const hadExpirationFlag = localStorage.getItem(expirationCheckKey);
    if (hadExpirationFlag) {
      console.log('New QR scan detected on home page - clearing expiration flag synchronously');
      localStorage.removeItem(expirationCheckKey);
      // Also clear any old session to force creation of new one
      const sessionKey = `session_${businessId}_${tableId}`;
      localStorage.removeItem(sessionKey);
    }
  }

  // Also clear in useEffect as backup (runs after component mount)
  useEffect(() => {
    if (!businessId || !tableId || typeof window === 'undefined') return;
    
    // Clear expiration flag when scanning QR (this is a new QR scan)
    const expirationCheckKey = `session_expired_${businessId}_${tableId}`;
    const hadExpirationFlag = localStorage.getItem(expirationCheckKey);
    if (hadExpirationFlag) {
      console.log('New QR scan detected on home page - clearing expiration flag (useEffect backup)');
      localStorage.removeItem(expirationCheckKey);
      // Also clear any old session to force creation of new one
      const sessionKey = `session_${businessId}_${tableId}`;
      localStorage.removeItem(sessionKey);
    }
  }, [businessId, tableId]);

  // Track QR/NFC scan when page loads
  useEffect(() => {
    if (!businessId || !tableId) return;

    // Detect source (QR, NFC, or direct link)
    const referer = typeof window !== 'undefined' ? document.referrer : '';
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const source = urlParams?.get('source') || (referer.includes('nfc') ? 'nfc' : 'qr');

    // Detect device type
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
    let deviceType = 'desktop';
    if (/mobile|android|iphone|ipad/i.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      deviceType = 'tablet';
    }

    // Track scan (fire and forget - don't wait for response)
    fetch('/api/scans/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId,
        tableId,
        source: source as 'qr' | 'nfc' | 'direct_link',
        deviceType,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        referer: typeof window !== 'undefined' ? document.referrer : undefined,
      }),
    }).catch((err) => {
      // Silently fail - tracking is not critical
      console.error('Failed to track scan:', err);
    });
  }, [businessId, tableId]);

  const switchLanguage = (lang: 'he' | 'en') => {
    setLanguage(lang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('menu_language', lang);
    }
  };

  const handleLoyaltySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!loyaltyName.trim()) {
      alert(language === 'en' ? 'Name is required' : 'שם הוא שדה חובה');
      return;
    }

    if (!loyaltyPhone.trim()) {
      alert(language === 'en' ? 'Phone is required' : 'טלפון הוא שדה חובה');
      return;
    }

    setLoyaltySubmitting(true);
    setLoyaltySuccess(false);

    try {
      const res = await fetch('/api/contacts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          name: loyaltyName.trim(),
          phone: loyaltyPhone.trim(),
          email: loyaltyEmail.trim() || null, // Email is optional
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join loyalty club');
      }

      setLoyaltySuccess(true);
      setLoyaltyName('');
      setLoyaltyPhone('');
      setLoyaltyEmail('');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowLoyaltyModal(false);
        setLoyaltySuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error('Error joining loyalty club:', error);
      alert(language === 'en' ? 'Failed to join. Please try again.' : 'נכשל בהצטרפות. נסה שוב.');
    } finally {
      setLoyaltySubmitting(false);
    }
  };

  // SINGLE SOURCE OF TRUTH: Business name - name is always the fallback
  // Rules:
  // - English: Use nameEn if exists and non-empty, otherwise ALWAYS use name
  // - Hebrew: Always use name
  // - NEVER return empty/undefined - name is the guaranteed fallback
  // IMPORTANT: This must be called BEFORE any early returns to maintain hook order
  const displayBusinessName = useMemo(() => {
    // If businessInfo not loaded, return placeholder
    if (!businessInfo || !businessInfo.name) {
      return 'Business';
    }
    
    // For English: try nameEn, but ALWAYS fallback to name
    if (language === 'en' && businessInfo.nameEn) {
      const nameEn = String(businessInfo.nameEn).trim();
      if (nameEn.length > 0) {
        return nameEn;
      }
    }
    
    // ALWAYS return name as fallback (guaranteed to exist at this point)
    return String(businessInfo.name);
  }, [businessInfo, language]);

  // Detect if this is pizza-classic template for special branding treatment
  const isPizzaBrand = useMemo(() => {
    if (!businessInfo) return false;
    // Only apply special branding to pizza-classic template
    return businessInfo.template === 'pizza-classic';
  }, [businessInfo]);

  // Parse pizza brand name into hero and sub-branding
  const pizzaBrandParts = useMemo(() => {
    if (!isPizzaBrand) return null;
    const nameUpper = displayBusinessName.toUpperCase();
    
    // Try to split on common patterns: "CLASSIC PIZZA CO." -> ["CLASSIC", "PIZZA CO."]
    const pizzaIndex = nameUpper.indexOf('PIZZA');
    if (pizzaIndex > 0) {
      return {
        hero: displayBusinessName.substring(0, pizzaIndex).trim(),
        subBrand: displayBusinessName.substring(pizzaIndex).trim(),
      };
    }
    
    // If no "PIZZA" found, try to split on common words
    const words = displayBusinessName.split(/\s+/);
    if (words.length >= 2) {
      return {
        hero: words[0],
        subBrand: words.slice(1).join(' '),
      };
    }
    
    return null;
  }, [isPizzaBrand, displayBusinessName]);

  if (loading) {
    return (
      <ThemeWrapper template="generic">
        <div className="min-h-screen flex items-center justify-center text-white">
          {language === 'en' ? 'Loading...' : 'טוען...'}
        </div>
      </ThemeWrapper>
    );
  }

  if (error || !businessInfo) {
    return (
      <ThemeWrapper template="generic">
        <div className="min-h-screen flex items-center justify-center text-white">
          <p>{error || (language === 'en' ? 'Error loading information' : 'שגיאה בטעינת המידע')}</p>
        </div>
      </ThemeWrapper>
    );
  }

  const template = businessInfo.template;
  const contact = businessInfo.customContent?.contact;
  
  // Debug: Log what we have in businessInfo
  console.log('🏠 HomePage - businessInfo state:', {
    hasBusinessInfo: !!businessInfo,
    hasCustomContent: !!businessInfo?.customContent,
    customContent: businessInfo?.customContent,
    contact: contact,
    facebook: contact?.facebook,
    instagram: contact?.instagram,
  });
  
  // Helper function to normalize URLs (add https:// if missing)
  const normalizeUrl = (url: string | undefined, label: string = 'URL'): string | undefined => {
    console.log(`🔧 normalizeUrl(${label}):`, { input: url, type: typeof url });
    
    if (!url || url.trim() === '') {
      console.log(`🔧 normalizeUrl(${label}): Empty or undefined, returning undefined`);
      return undefined;
    }
    
    const trimmed = url.trim();
    console.log(`🔧 normalizeUrl(${label}): Trimmed:`, trimmed);
    
    // Reject dangerous or invalid URLs
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('about:') || trimmed.startsWith('#')) {
      console.warn(`🔧 normalizeUrl(${label}): Invalid URL detected:`, trimmed);
      return undefined;
    }
    
    // If already has protocol, validate and return
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      // Validate that it's a proper URL
      try {
        new URL(trimmed);
        console.log(`🔧 normalizeUrl(${label}): Already has protocol, returning:`, trimmed);
        return trimmed;
      } catch (e) {
        console.warn(`🔧 normalizeUrl(${label}): Invalid URL format:`, trimmed, e);
        return undefined;
      }
    }
    
    // For any other string, add https:// prefix
    // This handles cases like:
    // - "instagram.com/username" -> "https://instagram.com/username"
    // - "www.facebook.com/page" -> "https://www.facebook.com/page"
    // - "g.page/r/..." -> "https://g.page/r/..."
    if (trimmed.length > 0) {
      const result = `https://${trimmed}`;
      // Validate the resulting URL
      try {
        new URL(result);
        console.log(`🔧 normalizeUrl(${label}): Adding https://, returning:`, result);
        return result;
      } catch (e) {
        console.warn(`🔧 normalizeUrl(${label}): Invalid URL format after adding https://:`, result, e);
        return undefined;
      }
    }
    
    console.log(`🔧 normalizeUrl(${label}): Empty after processing, returning undefined`);
    return undefined;
  };
  
  // Normalize social media URLs
  const instagramUrl = normalizeUrl(contact?.instagram, 'Instagram');
  const facebookUrl = normalizeUrl(contact?.facebook, 'Facebook');
  const googleReviewsUrl = normalizeUrl(businessInfo.customContent?.reviews?.googleReviewsUrl, 'GoogleReviews');
  
  // Debug: Log URLs to see what we're working with - ALWAYS log, not just if they exist
  console.log('🔗 Social media URLs:', {
    instagram: { raw: contact?.instagram, normalized: instagramUrl, exists: !!instagramUrl },
    facebook: { raw: contact?.facebook, normalized: facebookUrl, exists: !!facebookUrl },
    googleReviews: { raw: businessInfo.customContent?.reviews?.googleReviewsUrl, normalized: googleReviewsUrl, exists: !!googleReviewsUrl },
    contactObject: contact,
  });
  
  // Check if we have any contact info (phone, email, whatsapp)
  const hasContact = contact?.enabled && (
    contact.phone || contact.email || contact.whatsapp
  );
  
  // Check if we have social media links (these should show even if contact.enabled is false)
  const hasSocialMedia = instagramUrl || facebookUrl;
  
  // Debug: Log contact and social media status
  console.log('🔍 Contact & Social Media Debug:', {
    contactEnabled: contact?.enabled,
    hasContact,
    hasSocialMedia,
    instagramUrl,
    facebookUrl,
    rawInstagram: contact?.instagram,
    rawFacebook: contact?.facebook,
    willShowContactSection: hasContact || hasSocialMedia,
    willShowInstagram: !!instagramUrl,
    willShowFacebook: !!facebookUrl,
  });
  
  return (
    <ThemeWrapper template={template}>
      <main 
        className="min-h-screen text-white flex flex-col"
        dir={language === 'he' ? 'rtl' : 'ltr'}
      >
        {/* Minimal Header */}
        <header className="pt-6 pb-4 px-6">
          <div className="flex items-center justify-end max-w-4xl mx-auto">
            {/* Language Toggle - Minimal */}
            <div className="flex gap-1.5">
              <button
                onClick={() => switchLanguage('he')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  language === 'he'
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                עברית
              </button>
              <button
                onClick={() => switchLanguage('en')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  language === 'en'
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </header>

        {/* Main Content - Vertical Spine (Strict Centered Axis) */}
        <div className="flex-1 flex flex-col items-center px-6">
          <div className="w-full max-w-md flex flex-col items-center">
            
            {/* 1. Top Padding (15vh) & Business Name - Brand Identity */}
            <div className="pt-[15vh] text-center w-full">
              <AnimatePresence mode="wait">
                {businessInfo.logoUrl && businessInfo.logoUrl.trim() ? (
                  <motion.div
                    key={`logo-${displayBusinessName}-${language}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="relative"
                  >
                    <img
                      src={businessInfo.logoUrl}
                      alt={displayBusinessName}
                      className="h-20 max-h-[80px] w-auto mx-auto object-contain"
                      onError={(e) => {
                        // Hide image on error and show fallback
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          // Remove existing fallback if any
                          const existingFallback = parent.querySelector('.logo-fallback');
                          if (existingFallback) {
                            existingFallback.remove();
                          }
                          // Check if pizza-classic template for special branding
                          const isPizzaClassic = businessInfo?.template === 'pizza-classic';
                          const nameUpper = displayBusinessName.toUpperCase();
                          const pizzaIndex = nameUpper.indexOf('PIZZA');
                          
                          if (isPizzaClassic && pizzaIndex > 0) {
                            // Pizza-classic special branding: Hero + Sub-branding
                            const fallback = document.createElement('div');
                            
                            // Hero part
                            const hero = document.createElement('div');
                            hero.className = 'text-6xl md:text-7xl font-medium tracking-[0.12em] uppercase leading-tight';
                            hero.style.fontFamily = 'system-ui, -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif';
                            hero.style.letterSpacing = '0.12em';
                            hero.style.color = '#E8E6E1'; // Soft ivory, elegant and refined
                            hero.style.fontWeight = '500';
                            hero.textContent = displayBusinessName.substring(0, pizzaIndex).trim();
                            
                            // Sub-branding part
                            const subBrand = document.createElement('div');
                            subBrand.className = 'text-2xl md:text-3xl font-light tracking-[0.2em] uppercase mt-1';
                            subBrand.style.fontFamily = 'system-ui, -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif';
                            subBrand.style.letterSpacing = '0.2em';
                            subBrand.style.color = '#A67C52'; // Warm terracotta, elegant and appetizing
                            subBrand.style.fontWeight = '300';
                            subBrand.textContent = displayBusinessName.substring(pizzaIndex).trim();
                            
                            fallback.appendChild(hero);
                            fallback.appendChild(subBrand);
                            fallback.className = 'logo-fallback';
                            parent.appendChild(fallback);
                          } else {
                            // Standard premium treatment
                            const fallback = document.createElement('h1');
                            fallback.className = 'logo-fallback text-5xl md:text-6xl font-light tracking-[0.15em] uppercase';
                            fallback.style.fontFamily = 'system-ui, -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif';
                            fallback.style.letterSpacing = '0.15em';
                            fallback.style.color = '#FFFFFF';
                            fallback.style.fontWeight = '300';
                            fallback.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
                            
                            // Create spans for each character with accent on first letter
                            displayBusinessName.split('').forEach((char, index) => {
                              const isFirstLetter = index === 0;
                              const accentColor = '#F5D76E';
                              const span = document.createElement('span');
                              span.style.color = isFirstLetter ? accentColor : 'inherit';
                              span.style.fontWeight = isFirstLetter ? '400' : '300';
                              span.textContent = char === ' ' ? '\u00A0' : char;
                              fallback.appendChild(span);
                            });
                            
                            parent.appendChild(fallback);
                          }
                        }
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`name-${displayBusinessName}-${language}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                    className="relative"
                  >
                    {/* Subtle premium glow - very minimal and elegant */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ 
                        duration: 0.6,
                        delay: 0.2
                      }}
                      className="absolute inset-0 blur-2xl bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -z-10"
                    />
                    
                    {isPizzaBrand && pizzaBrandParts ? (
                      // Premium pizza brand treatment: Hero + Sub-branding (pizza-classic only)
                      <motion.div
                        initial={{ opacity: 0, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0 }}
                        transition={{ 
                          duration: 0.5,
                          ease: [0.25, 0.1, 0.25, 1]
                        }}
                        className="relative z-10"
                      >
                        {/* Hero: "CLASSIC" */}
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            duration: 0.4,
                            delay: 0.1,
                            ease: [0.25, 0.1, 0.25, 1]
                          }}
                          className="text-6xl md:text-7xl font-medium tracking-[0.12em] uppercase leading-tight"
                          style={{
                            fontFamily: 'system-ui, -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif',
                            letterSpacing: '0.12em',
                            color: '#E8E6E1', // Soft ivory, elegant and refined
                            fontWeight: 500,
                          }}
                        >
                          {pizzaBrandParts.hero}
                        </motion.div>
                        
                        {/* Sub-branding: "PIZZA CO." */}
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            duration: 0.4,
                            delay: 0.25,
                            ease: [0.25, 0.1, 0.25, 1]
                          }}
                          className="text-2xl md:text-3xl font-light tracking-[0.2em] uppercase mt-1"
                          style={{
                            fontFamily: 'system-ui, -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif',
                            letterSpacing: '0.2em',
                            color: '#A67C52', // Warm terracotta, elegant and appetizing
                            fontWeight: 300,
                          }}
                        >
                          {pizzaBrandParts.subBrand}
                        </motion.div>
                      </motion.div>
                    ) : (
                      // Standard premium treatment for non-pizza-classic brands
                      <motion.h1
                        initial={{ opacity: 0, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0 }}
                        transition={{ 
                          duration: 0.5,
                          ease: [0.25, 0.1, 0.25, 1]
                        }}
                        className="text-5xl md:text-6xl font-light tracking-[0.15em] uppercase relative z-10"
                        style={{ 
                          fontFamily: 'system-ui, -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif',
                          letterSpacing: '0.15em',
                          color: '#FFFFFF',
                          fontWeight: 300,
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        {displayBusinessName.split('').map((char, index) => {
                          // Add subtle gold accent to first letter for premium feel
                          const isFirstLetter = index === 0;
                          const accentColor = '#F5D76E';
                          
                          return (
                            <motion.span
                              key={index}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{
                                duration: 0.3,
                                delay: 0.1 + (index * 0.02),
                                ease: [0.25, 0.1, 0.25, 1]
                              }}
                              className="inline-block"
                              style={{
                                color: isFirstLetter ? accentColor : 'inherit',
                                fontWeight: isFirstLetter ? 400 : 300,
                              }}
                            >
                              {char === ' ' ? '\u00A0' : char}
                            </motion.span>
                          );
                        })}
                      </motion.h1>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Macro Spacer 1 (80px - 120px) */}
            <div className="h-20 md:h-32" />

            {/* 3. PRIMARY ACTION: Menu Entry Button - Glass / Blur Premium */}
            <div className="w-full flex justify-center">
              <Link href={`/menu/${businessId}/${tableId}?from=home`} className="block">
                <motion.button
                  className={`relative px-8 py-4 rounded-lg font-medium text-lg md:text-xl transition-all duration-300 overflow-hidden shadow-lg flex items-center justify-center group ${
                    template === 'bar-classic'
                      ? 'bg-white/10 backdrop-blur-md border border-white/20 hover:border-[#D4AF37]/40'
                      : 'bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/40'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Glass Background / Blur Layer */}
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-[20px] saturate-[180%] z-0" 
                    style={{
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    }}
                  />
                  
                  {/* Subtle Food Image Layer (if provided) */}
                  {businessInfo.customContent?.menuButtonImageUrl && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay z-0 transition-transform duration-700 group-hover:scale-110 rounded-lg"
                      style={{
                        backgroundImage: `url(${businessInfo.customContent.menuButtonImageUrl})`,
                      }}
                    />
                  )}
                  
                  {/* Text Overlay - Always Readable with Pulse Glow Effect */}
                  <motion.span 
                    className={`relative z-10 tracking-wide font-semibold transition-colors duration-300 ${
                      template === 'bar-classic' ? 'text-[#FAF8F3] group-hover:text-[#D4AF37]' : 'text-white group-hover:text-white'
                    }`}
                    animate={{
                      opacity: [0.9, 1, 0.9],
                      textShadow: template === 'bar-classic'
                        ? [
                            '0 0 10px rgba(212, 175, 55, 0.4)',
                            '0 0 20px rgba(212, 175, 55, 0.6), 0 0 30px rgba(212, 175, 55, 0.4)',
                            '0 0 10px rgba(212, 175, 55, 0.4)',
                          ]
                        : [
                            '0 0 10px rgba(255, 255, 255, 0.3)',
                            '0 0 20px rgba(255, 255, 255, 0.5), 0 0 30px rgba(255, 255, 255, 0.3)',
                            '0 0 10px rgba(255, 255, 255, 0.3)',
                          ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    {language === 'en' ? 'Enter Menu' : 'צפה בתפריט'}
                  </motion.span>
                  
                  {/* Pulse Glow Ring Effect */}
                  <motion.div
                    className={`absolute inset-0 rounded-lg border-2 ${template === 'bar-classic' ? 'border-[#D4AF37]/40' : 'border-white/30'}`}
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.05, 1],
                      boxShadow: template === 'bar-classic'
                        ? [
                            '0 0 20px rgba(212, 175, 55, 0.3)',
                            '0 0 40px rgba(212, 175, 55, 0.5), 0 0 60px rgba(212, 175, 55, 0.3)',
                            '0 0 20px rgba(212, 175, 55, 0.3)',
                          ]
                        : [
                            '0 0 20px rgba(255, 255, 255, 0.2)',
                            '0 0 40px rgba(255, 255, 255, 0.4), 0 0 60px rgba(255, 255, 255, 0.2)',
                            '0 0 20px rgba(255, 255, 255, 0.2)',
                          ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </motion.button>
              </Link>
            </div>

            {/* 4. Macro Spacer 2 (64px) */}
            <div className="h-16 md:h-24" />

            {/* 5. Contact / Social Icons - Discovery Row (Secondary Whispers) */}
            {/* Show if we have contact info OR social media links */}
            {(hasContact || hasSocialMedia || instagramUrl || facebookUrl) && (
              <div className="w-full">
                <div className="flex justify-center items-center gap-6 md:gap-8">
                  {contact?.phone && (
                    <motion.a
                      href={`tel:${contact.phone}`}
                      className={`p-3 rounded-full bg-transparent border transition-all duration-300 ${
                        template === 'bar-classic'
                          ? 'border-white/20 hover:border-[#D4AF37]/40'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      aria-label={language === 'en' ? 'Phone' : 'טלפון'}
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        delay: 0.4, 
                        duration: 0.6,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <PhoneIcon className={`w-6 h-6 transition-colors duration-300 ${
                        template === 'bar-classic'
                          ? 'text-[#FAF8F3]/60 hover:text-[#D4AF37]'
                          : 'text-white/60 hover:text-white'
                      }`} />
                    </motion.a>
                  )}
                  {contact?.email && (
                    <motion.a
                      href={`mailto:${contact.email}`}
                      className={`p-3 rounded-full bg-transparent border transition-all duration-300 ${
                        template === 'bar-classic'
                          ? 'border-white/20 hover:border-[#D4AF37]/40'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      aria-label={language === 'en' ? 'Email' : 'אימייל'}
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        delay: 0.42, 
                        duration: 0.6,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <EmailIcon className={`w-6 h-6 transition-colors duration-300 ${
                        template === 'bar-classic'
                          ? 'text-[#FAF8F3]/60 hover:text-[#D4AF37]'
                          : 'text-white/60 hover:text-white'
                      }`} />
                    </motion.a>
                  )}
                  {contact?.whatsapp && (
                    <motion.a
                      href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 rounded-full bg-transparent border transition-all duration-300 ${
                        template === 'bar-classic'
                          ? 'border-white/20 hover:border-[#D4AF37]/40'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      aria-label="WhatsApp"
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        delay: 0.45, 
                        duration: 0.6,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <WhatsAppIcon className={`w-6 h-6 transition-colors duration-300 ${
                        template === 'bar-classic'
                          ? 'text-[#FAF8F3]/60 hover:text-[#D4AF37]'
                          : 'text-white/60 hover:text-white'
                      }`} />
                    </motion.a>
                  )}
                  {instagramUrl && (
                    <motion.a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 rounded-full bg-transparent border transition-all duration-300 ${
                        template === 'bar-classic'
                          ? 'border-white/20 hover:border-[#D4AF37]/40'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      aria-label="Instagram"
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        delay: 0.5, 
                        duration: 0.6,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <InstagramIcon className={`w-6 h-6 transition-colors duration-300 ${
                        template === 'bar-classic'
                          ? 'text-[#FAF8F3]/60 hover:text-[#D4AF37]'
                          : 'text-white/60 hover:text-white'
                      }`} />
                    </motion.a>
                  )}
                  {facebookUrl && (
                    <motion.a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 rounded-full bg-transparent border transition-all duration-300 ${
                        template === 'bar-classic'
                          ? 'border-white/20 hover:border-[#D4AF37]/40'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      aria-label="Facebook"
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        delay: 0.55, 
                        duration: 0.6,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FacebookIcon className={`w-6 h-6 transition-colors duration-300 ${
                        template === 'bar-classic'
                          ? 'text-[#FAF8F3]/60 hover:text-[#D4AF37]'
                          : 'text-white/60 hover:text-white'
                      }`} />
                    </motion.a>
                  )}
                </div>
              </div>
            )}

            {/* 6. Optional Discovery - Loyalty / Reviews (Subtle Footer) */}
            <div className="mt-auto pt-16 pb-12 w-full flex flex-col items-center gap-4">
              {businessInfo.customContent?.loyaltyClub?.enabled && (
                <motion.button 
                  onClick={() => setShowLoyaltyModal(true)}
                  className="group relative flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white/80 transition-all duration-300 cursor-pointer overflow-hidden"
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: 0.7,
                    duration: 0.6,
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    y: -3,
                    transition: { duration: 0.3 }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-red-400/20 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300" />
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 10, 0],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: "easeInOut"
                    }}
                  >
                    <LoyaltyIcon className="relative w-4 h-4 group-hover:drop-shadow-lg transition-all duration-300" />
                  </motion.div>
                  <span className="relative">
                    {language === 'en' ? 'Loyalty Club' : 'מועדון לקוחות'}
                  </span>
                </motion.button>
              )}

              {businessInfo.customContent?.reviews?.enabled && googleReviewsUrl && (
                <motion.a
                  href={googleReviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white/80 transition-all duration-300 overflow-hidden"
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: 0.8,
                    duration: 0.6,
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    y: -3,
                    transition: { duration: 0.3 }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300" />
                  <span className="relative">
                  {language === 'en' ? 'Reviews' : 'ביקורות'}
                  </span>
                </motion.a>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Loyalty Club Modal */}
      <AnimatePresence>
        {showLoyaltyModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !loyaltySubmitting && setShowLoyaltyModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-x-4 bottom-4 md:inset-x-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-neutral-900 rounded-2xl shadow-2xl z-50 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {language === 'en' ? '🎁 Loyalty Club' : '🎁 מועדון הלקוחות'}
                  </h2>
                  <p className="text-sm text-neutral-400">
                    {language === 'en' 
                      ? 'Exclusive deals for members'
                      : 'הטבות ומבצעים לחברי המועדון'}
                  </p>
                </div>

                {/* Form */}
                {!loyaltySuccess ? (
                  <form onSubmit={handleLoyaltySubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        {language === 'en' ? 'Name' : 'שם'}
                        <span className="text-red-400 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={loyaltyName}
                        onChange={(e) => setLoyaltyName(e.target.value)}
                        placeholder={language === 'en' ? 'John Doe' : 'ישראל ישראלי'}
                        required
                        disabled={loyaltySubmitting}
                        className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        dir={language === 'he' ? 'rtl' : 'ltr'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        {language === 'en' ? 'Phone Number' : 'מספר טלפון'}
                        <span className="text-red-400 ml-1">*</span>
                      </label>
                      <input
                        type="tel"
                        value={loyaltyPhone}
                        onChange={(e) => setLoyaltyPhone(e.target.value)}
                        placeholder={language === 'en' ? '050-1234567' : '050-1234567'}
                        required
                        disabled={loyaltySubmitting}
                        className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        {language === 'en' ? 'Email' : 'אימייל'}
                        <span className="text-neutral-500 ml-1 text-xs">({language === 'en' ? 'Optional' : 'אופציונלי'})</span>
                      </label>
                      <input
                        type="email"
                        value={loyaltyEmail}
                        onChange={(e) => setLoyaltyEmail(e.target.value)}
                        placeholder={language === 'en' ? 'email@example.com' : 'email@example.com'}
                        disabled={loyaltySubmitting}
                        className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        dir="ltr"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loyaltySubmitting || !loyaltyName.trim() || !loyaltyPhone.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition"
                    >
                      {loyaltySubmitting 
                        ? (language === 'en' ? 'Joining...' : 'מצטרף...')
                        : (language === 'en' ? 'Join the Club' : 'הצטרף למועדון')
                      }
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-4xl mb-4">✅</div>
                    <p className="text-lg font-medium text-white mb-2">
                      {language === 'en' ? 'Successfully Joined!' : 'הצטרפת בהצלחה!'}
                    </p>
                    <p className="text-sm text-neutral-400">
                      {language === 'en' ? 'You will receive exclusive offers soon.' : 'תקבל מבצעים בלעדיים בקרוב.'}
                    </p>
                  </div>
                )}

                {/* Close Button */}
                {!loyaltySubmitting && (
                  <button
                    onClick={() => {
                      setShowLoyaltyModal(false);
                      setLoyaltySuccess(false);
                      setLoyaltyName('');
                      setLoyaltyPhone('');
                      setLoyaltyEmail('');
                    }}
                    className="w-full text-neutral-400 hover:text-white text-sm transition"
                  >
                    {language === 'en' ? 'Close' : 'סגור'}
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ThemeWrapper>
  );
}

export default function HomePage({
  params,
}: {
  params: { businessId: string; tableId: string };
}) {
  const { businessId, tableId } = params;
  
  return (
    <SessionProvider businessId={businessId} tableId={tableId}>
      <HomePageContent businessId={businessId} tableId={tableId} />
    </SessionProvider>
  );
}
