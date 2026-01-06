'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import CustomContentEditor from '@/components/CustomContentEditor';

interface DashboardMenuItem {
  businessId: string;
  category: string;
  categoryEn?: string;
  name: string;
  nameEn?: string;
  price: number;
  imageUrl?: string;
  ingredients?: string[];
  allergens?: string[];
  ingredientsEn?: string[];
  allergensEn?: string[];
  customizationOptions?: string[];
  isFeatured?: boolean;
  isPregnancySafe?: boolean;
  isBusiness?: boolean;
  isHidden?: boolean;
  sortOrder?: number;
}

interface DashboardTable {
  businessId: string;
  tableId: string;
  label: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [items, setItems] = useState<DashboardMenuItem[]>([]);
  const [tables, setTables] = useState<DashboardTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'tables' | 'settings' | 'printer' | 'orders' | 'pos' | 'content'>('menu');
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<{
    name: string;
    nameEn?: string;
    type: string;
    template: string;
    logoUrl?: string;
    aiInstructions?: string;
    subscription?: {
      status: string;
      planType?: 'full' | 'menu_only';
      menuOnlyMessage?: string;
      tablesAllowed?: number;
      nextBillingDate?: string;
    };
    printerConfig?: {
      enabled: boolean;
      type: string;
      endpoint: string;
      payloadType: string;
      headers?: Record<string, string>;
      port?: number;
    };
    posConfig?: {
      enabled: boolean;
      provider?: string;
      endpoint: string;
      method: string;
      headers: Record<string, string>;
      timeoutMs: number;
    };
    businessHours?: {
      start: string;
      end: string;
    } | null;
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
    } | null;
  } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [revenueStats, setRevenueStats] = useState<{
    today: number;
    week: number;
    month: number;
  } | null>(null);
  const [scanStats, setScanStats] = useState<{
    totalScans: number;
    scansLast24h: number;
    scansLast7d: number;
    scansByTable: Record<string, number>;
    scansBySource: Record<string, number>;
    totalChatEntries: number;
    totalChatOrders: number;
    chatEntriesLast24h: number;
    chatOrdersLast24h: number;
    chatEntriesLast7d: number;
    chatOrdersLast7d: number;
  } | null>(null);
  const [loyaltyContacts, setLoyaltyContacts] = useState<Array<{
    id: string;
    name: string;
    phone: string;
    email: string | null;
    source: string;
    created_at: string;
    updated_at: string | null;
  }>>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [categories, setCategories] = useState<Array<{ category: string; categoryEn?: string }>>([]);
  const [editingItem, setEditingItem] = useState<DashboardMenuItem | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchingImages, setSearchingImages] = useState(false);
  const [imageSearchResults, setImageSearchResults] = useState<Array<{ id: string; url: string; thumbnail: string }>>([]);
  const [imageSearchQuery, setImageSearchQuery] = useState('');

  const fileInputGalleryRef = useRef<HTMLInputElement | null>(null);
  const fileInputCameraRef = useRef<HTMLInputElement | null>(null);

  const [newItem, setNewItem] = useState({
    category: '',
    categoryEn: '',
    name: '',
    nameEn: '',
    price: '',
    imageUrl: '',
    ingredients: '',
    ingredientsEn: '',
    allergens: '',
    allergensEn: '',
    isFeatured: false,
    isPregnancySafe: false,
    isBusiness: false,
  });

  const [newTable, setNewTable] = useState({
    tableId: '',
    label: '',
  });

  useEffect(() => {
    // Get businessId from JWT token in cookie
    async function getBusinessId() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (res.ok && data.businessId) {
          setBusinessId(data.businessId);
        } else {
          setError('מזהה עסק לא נמצא. אנא התחברו שוב.');
          router.push('/login?from=/dashboard');
        }
      } catch (err) {
        setError('נכשל בטעינת פרטי העסק. אנא התחברו שוב.');
        router.push('/login?from=/dashboard');
      }
    }
    getBusinessId();
  }, [router]);

  useEffect(() => {
    if (businessId) {
      loadMenu();
      loadTables();
      loadBusinessInfo();
    }
  }, [businessId]);

  // Debounce image search
  useEffect(() => {
    if (!imageSearchQuery.trim()) {
      setImageSearchResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      searchImages(imageSearchQuery);
    }, 500);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSearchQuery]);

  useEffect(() => {
    if (businessId && activeTab === 'content') {
      loadLoyaltyContacts();
    }
  }, [businessId, activeTab]);

  useEffect(() => {
    if (businessId && activeTab === 'orders') {
      loadOrders();
      
      // Auto-refresh orders and stats every 5 seconds when orders tab is active
      const interval = setInterval(() => {
        loadOrders();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [businessId, activeTab]);

  async function loadBusinessInfo() {
    if (!businessId) return;
    try {
      // CRITICAL: Check localStorage for cached customContent that was saved after update
      // This bypasses read replica lag by using the data we know was saved
      const localStorageKey = `business_${businessId}_customContent`;
      const cachedData = typeof window !== 'undefined' ? localStorage.getItem(localStorageKey) : null;
      let cachedCustomContent: any = null;
      let cachedTimestamp = 0;
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          cachedCustomContent = parsed.customContent;
          cachedTimestamp = parsed.timestamp || 0;
          console.log('💾 Found cached customContent in localStorage:', {
            timestamp: cachedTimestamp,
            age: Date.now() - cachedTimestamp,
            phone: cachedCustomContent?.contact?.phone,
            email: cachedCustomContent?.contact?.email,
          });
        } catch (e) {
          console.warn('⚠️ Failed to parse cached customContent:', e);
        }
      }

      // CRITICAL: Check localStorage for cached printerConfig that was saved after update
      // This bypasses read replica lag by using the data we know was saved
      const printerConfigKey = `business_${businessId}_printerConfig`;
      const cachedPrinterData = typeof window !== 'undefined' ? localStorage.getItem(printerConfigKey) : null;
      let cachedPrinterConfig: any = null;
      let cachedPrinterTimestamp = 0;
      
      if (cachedPrinterData) {
        try {
          const parsed = JSON.parse(cachedPrinterData);
          cachedPrinterConfig = parsed.printerConfig;
          cachedPrinterTimestamp = parsed.timestamp || 0;
          console.log('💾 Found cached printerConfig in localStorage:', {
            timestamp: cachedPrinterTimestamp,
            age: Date.now() - cachedPrinterTimestamp,
            enabled: cachedPrinterConfig?.enabled,
            endpoint: cachedPrinterConfig?.endpoint,
          });
        } catch (e) {
          console.warn('⚠️ Failed to parse cached printerConfig:', e);
        }
      }

      // CRITICAL: Check localStorage for cached template that was saved after update
      // This bypasses read replica lag by using the data we know was saved
      const templateKey = `business_${businessId}_template`;
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

      // CRITICAL: Check localStorage for cached aiInstructions that was saved after update
      // This bypasses read replica lag by using the data we know was saved
      const aiInstructionsKey = `business_${businessId}_aiInstructions`;
      const cachedAiInstructionsData = typeof window !== 'undefined' ? localStorage.getItem(aiInstructionsKey) : null;
      let cachedAiInstructions: string | null = null;
      let cachedAiInstructionsTimestamp = 0;
      
      if (cachedAiInstructionsData) {
        try {
          const parsed = JSON.parse(cachedAiInstructionsData);
          cachedAiInstructions = parsed.aiInstructions;
          cachedAiInstructionsTimestamp = parsed.timestamp || 0;
          console.log('💾 Found cached aiInstructions in localStorage:', {
            timestamp: cachedAiInstructionsTimestamp,
            age: Date.now() - cachedAiInstructionsTimestamp,
            hasInstructions: !!cachedAiInstructions,
            length: cachedAiInstructions?.length || 0,
          });
        } catch (e) {
          console.warn('⚠️ Failed to parse cached aiInstructions:', e);
        }
      }

      // CRITICAL: Check localStorage for cached businessHours that was saved after update
      // This bypasses read replica lag by using the data we know was saved
      const businessHoursKey = `business_${businessId}_businessHours`;
      const cachedBusinessHoursData = typeof window !== 'undefined' ? localStorage.getItem(businessHoursKey) : null;
      let cachedBusinessHours: { start: string; end: string } | null | null = null;
      let cachedBusinessHoursTimestamp = 0;
      
      if (cachedBusinessHoursData) {
        try {
          const parsed = JSON.parse(cachedBusinessHoursData);
          cachedBusinessHours = parsed.businessHours;
          cachedBusinessHoursTimestamp = parsed.timestamp || 0;
          console.log('💾 Found cached businessHours in localStorage:', {
            timestamp: cachedBusinessHoursTimestamp,
            age: Date.now() - cachedBusinessHoursTimestamp,
            businessHours: cachedBusinessHours,
          });
        } catch (e) {
          console.warn('⚠️ Failed to parse cached businessHours:', e);
        }
      }

      // CRITICAL: Check localStorage for cached name, nameEn, and logoUrl that were saved after update
      // This bypasses read replica lag by using the data we know was saved
      const businessBasicInfoKey = `business_${businessId}_basicInfo`;
      const cachedBasicInfoData = typeof window !== 'undefined' ? localStorage.getItem(businessBasicInfoKey) : null;
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
      
      // Add cache busting to ensure fresh data
      const res = await fetch(`/api/business/info?businessId=${encodeURIComponent(businessId)}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      const data = await res.json();
      if (res.ok && data.business) {
        console.log('📥 Loaded business info from API:', {
          customContent: data.business.customContent,
          contact: data.business.customContent?.contact,
          instagram: data.business.customContent?.contact?.instagram,
          instagramLength: data.business.customContent?.contact?.instagram?.length,
        });
        
        // Clean customContent from old fields - define before setBusinessInfo
        const cleanCustomContent = (content: any) => {
          if (!content) return null;
          return {
            ...content,
            contact: content.contact ? {
              enabled: content.contact.enabled,
              phone: content.contact.phone || '',
              email: content.contact.email || '',
              whatsapp: content.contact.whatsapp || '',
              instagram: content.contact.instagram || '',
              facebook: content.contact.facebook || '',
            } : undefined,
            loyaltyClub: content.loyaltyClub ? {
              enabled: content.loyaltyClub.enabled,
            } : undefined,
          };
        };
        
        // CRITICAL: Use cached customContent if it's newer than 5 minutes old
        // This ensures we use the data we know was saved, not stale read replica data
        let finalCustomContent = cleanCustomContent(data.business.customContent);
        if (cachedCustomContent && cachedTimestamp > Date.now() - 5 * 60 * 1000) {
          // Cached data is recent (less than 5 minutes old), use it instead of API data
          finalCustomContent = cleanCustomContent(cachedCustomContent);
          console.log('✅ Using cached customContent from localStorage (source of truth):', {
            phone: finalCustomContent?.contact?.phone,
            email: finalCustomContent?.contact?.email,
            cachedAge: Date.now() - cachedTimestamp,
          });
        }

        // CRITICAL: Use cached printerConfig if it's newer than 5 minutes old
        // This ensures we use the data we know was saved, not stale read replica data
        let finalPrinterConfig = data.business.printerConfig || {
          enabled: false,
          type: 'http',
          endpoint: '',
          payloadType: 'json',
        };
        if (cachedPrinterConfig && cachedPrinterTimestamp > Date.now() - 5 * 60 * 1000) {
          // Cached data is recent (less than 5 minutes old), use it instead of API data
          finalPrinterConfig = cachedPrinterConfig;
          console.log('✅ Using cached printerConfig from localStorage (source of truth):', {
            enabled: finalPrinterConfig?.enabled,
            endpoint: finalPrinterConfig?.endpoint,
            cachedAge: Date.now() - cachedPrinterTimestamp,
          });
        }

        // CRITICAL: Use cached template if it's newer than 5 minutes old
        // This ensures we use the data we know was saved, not stale read replica data
        let finalTemplate = data.business.template || 'generic';
        if (cachedTemplate && cachedTemplateTimestamp > Date.now() - 5 * 60 * 1000) {
          // Cached data is recent (less than 5 minutes old), use it instead of API data
          finalTemplate = cachedTemplate;
          console.log('✅ Using cached template from localStorage (source of truth):', {
            template: finalTemplate,
            cachedAge: Date.now() - cachedTemplateTimestamp,
          });
        }

        // CRITICAL: Use cached aiInstructions if it's newer than 5 minutes old
        // This ensures we use the data we know was saved, not stale read replica data
        let finalAiInstructions = data.business.aiInstructions || '';
        if (cachedAiInstructions !== null && cachedAiInstructionsTimestamp > Date.now() - 5 * 60 * 1000) {
          // Cached data is recent (less than 5 minutes old), use it instead of API data
          finalAiInstructions = cachedAiInstructions;
          console.log('✅ Using cached aiInstructions from localStorage (source of truth):', {
            hasInstructions: !!finalAiInstructions,
            length: finalAiInstructions?.length || 0,
            cachedAge: Date.now() - cachedAiInstructionsTimestamp,
          });
        }

        // CRITICAL: Use cached businessHours if it's newer than 5 minutes old
        // This ensures we use the data we know was saved, not stale read replica data
        let finalBusinessHours = data.business.businessHours || null;
        if (cachedBusinessHours !== null && cachedBusinessHoursTimestamp > Date.now() - 5 * 60 * 1000) {
          // Cached data is recent (less than 5 minutes old), use it instead of API data
          finalBusinessHours = cachedBusinessHours;
          console.log('✅ Using cached businessHours from localStorage (source of truth):', {
            businessHours: finalBusinessHours,
            cachedAge: Date.now() - cachedBusinessHoursTimestamp,
          });
        }

        // CRITICAL: Use cached name, nameEn, and logoUrl if they're newer than 5 minutes old
        // This ensures we use the data we know was saved, not stale read replica data
        let finalName = data.business.name;
        let finalNameEn = data.business.nameEn || undefined;
        let finalLogoUrl = data.business.logoUrl || '';
        
        if (cachedBasicInfoTimestamp > Date.now() - 5 * 60 * 1000) {
          // Cached data is recent (less than 5 minutes old), use it instead of API data
          if (cachedName !== null) finalName = cachedName;
          if (cachedNameEn !== undefined) finalNameEn = cachedNameEn;
          if (cachedLogoUrl !== undefined) finalLogoUrl = cachedLogoUrl || '';
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
            type: data.business.type,
            template: finalTemplate, // Use cached or API data
            aiInstructions: finalAiInstructions, // Use cached or API data
            businessHours: finalBusinessHours, // Use cached or API data
            subscription: data.business.subscription,
            customContent: finalCustomContent, // Use cached or API data
            printerConfig: finalPrinterConfig, // Use cached or API data
            posConfig: data.business.posConfig || {
              enabled: false,
              provider: 'generic',
              endpoint: '',
              method: 'POST',
              headers: {},
              timeoutMs: 5000,
            },
          };

          if (!prev) return newBusinessInfo;

          // Deep comparison to check if anything actually changed
          const nameChanged = prev.name !== newBusinessInfo.name;
          const logoChanged = prev.logoUrl !== newBusinessInfo.logoUrl;
          const typeChanged = prev.type !== newBusinessInfo.type;
          const templateChanged = prev.template !== newBusinessInfo.template;
          const aiInstructionsChanged = prev.aiInstructions !== newBusinessInfo.aiInstructions;
          const hoursChanged = JSON.stringify(prev.businessHours) !== JSON.stringify(newBusinessInfo.businessHours);
          const subscriptionChanged = JSON.stringify(prev.subscription) !== JSON.stringify(newBusinessInfo.subscription);
          
          // CRITICAL: If customContent was updated via PUT (has _lastCustomContentUpdate), 
          // don't overwrite it with stale data from GET request
          if ((prev as any)._lastCustomContentUpdate && (prev as any)._lastCustomContentUpdate > Date.now() - 5000) {
            // Keep the PUT-updated value - it's the source of truth
            console.log('🛡️ Preserving PUT-updated customContent, ignoring stale GET data', {
              lastUpdate: (prev as any)._lastCustomContentUpdate,
              age: Date.now() - (prev as any)._lastCustomContentUpdate,
            });
            return {
              ...newBusinessInfo,
              customContent: prev.customContent, // Keep the PUT-updated value
              _lastCustomContentUpdate: (prev as any)._lastCustomContentUpdate,
            } as any;
          }
          
          // Clean customContent before comparison to avoid false negatives from old fields
          // (cleanCustomContent is defined above, outside setBusinessInfo)
          const prevCleaned = cleanCustomContent(prev.customContent);
          const newCleaned = cleanCustomContent(newBusinessInfo.customContent);
          const contentChanged = JSON.stringify(prevCleaned) !== JSON.stringify(newCleaned);
          
          // Check if contact fields specifically changed (more granular check)
          let contactFieldsChanged = false;
          if (prevCleaned?.contact && newCleaned?.contact) {
            const prevContact = prevCleaned.contact;
            const newContact = newCleaned.contact;
            contactFieldsChanged = 
              prevContact.phone !== newContact.phone ||
              prevContact.email !== newContact.email ||
              prevContact.whatsapp !== newContact.whatsapp ||
              prevContact.instagram !== newContact.instagram ||
              prevContact.facebook !== newContact.facebook ||
              prevContact.enabled !== newContact.enabled;
          } else if (prevCleaned?.contact !== newCleaned?.contact) {
            contactFieldsChanged = true;
          }
          
          const printerChanged = JSON.stringify(prev.printerConfig) !== JSON.stringify(newBusinessInfo.printerConfig);
          const posChanged = JSON.stringify(prev.posConfig) !== JSON.stringify(newBusinessInfo.posConfig);

          // Always update if customContent or contact fields changed
          if (contentChanged || contactFieldsChanged) {
            console.log('🔄 customContent or contact fields changed, forcing update', {
              contentChanged,
              contactFieldsChanged,
              prevContact: prevCleaned?.contact,
              newContact: newCleaned?.contact,
            });
            return newBusinessInfo;
          }

          // If nothing changed, return previous to prevent re-render
          if (!nameChanged && !logoChanged && !typeChanged && !templateChanged && 
              !aiInstructionsChanged && !hoursChanged && !subscriptionChanged && !printerChanged && !posChanged) {
            return prev;
          }
          
          return newBusinessInfo;
        });
      }
    } catch (err) {
      console.error('Failed to load business info', err);
    }
  }

  async function loadScanStats() {
    if (!businessId) return;
    try {
      const res = await fetch(`/api/scans/stats?businessId=${encodeURIComponent(businessId)}`);
      const data = await res.json();
      
      if (res.ok) {
        setScanStats(data);
      }
    } catch (err) {
      console.error('Failed to load scan stats:', err);
    }
  }

  async function loadOrders() {
    if (!businessId) return;
    try {
      setLoading(true);
      setError(null);
      const [ordersRes, statsRes] = await Promise.all([
        fetch(`/api/orders/list?businessId=${encodeURIComponent(businessId)}`),
        fetch(`/api/orders/stats?businessId=${encodeURIComponent(businessId)}`),
      ]);
      
      const ordersData = await ordersRes.json();
      const statsData = await statsRes.json();
      
      if (ordersRes.ok) {
        setOrders(ordersData.orders || []);
      }
      
      if (statsRes.ok) {
        setRevenueStats(statsData);
      }

      // Load scan stats
      await loadScanStats();
    } catch (err: any) {
      setError(err.message || 'נכשל בטעינת הזמנות');
    } finally {
      setLoading(false);
    }
  }

  async function loadLoyaltyContacts() {
    if (!businessId) return;
    try {
      setLoadingContacts(true);
      const res = await fetch(`/api/contacts/list?businessId=${encodeURIComponent(businessId)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setLoyaltyContacts(data.contacts || []);
      }
    } catch (err) {
      console.error('Failed to load loyalty contacts', err);
    } finally {
      setLoadingContacts(false);
    }
  }

  async function loadCategories() {
    if (!businessId) return;
    try {
      const res = await fetch(`/api/menu/categories?businessId=${encodeURIComponent(businessId)}`);
      const data = await res.json();
      if (!res.ok) {
        console.error('Failed to load categories', data.message);
        return;
      }
      setCategories(data.categories ?? []);
    } catch (err: any) {
      console.error('Failed to load categories', err);
    }
  }

  async function saveCategory() {
    if (!businessId || !newItem.category.trim()) {
      toast.error('נא להזין שם קטגוריה');
      return;
    }

    try {
      const res = await fetch('/api/menu/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          category: newItem.category.trim(),
          categoryEn: newItem.categoryEn?.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'נכשל בשמירת הקטגוריה');
        return;
      }

      toast.success('הקטגוריה נשמרה בהצלחה!');
      // Reload categories to show the new one
      await loadCategories();
    } catch (err: any) {
      console.error('Failed to save category', err);
      toast.error('נכשל בשמירת הקטגוריה');
    }
  }

  async function loadMenu() {
    if (!businessId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/menu?businessId=${encodeURIComponent(businessId)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'נכשל בטעינת התפריט');
      }
      setItems(data.items ?? []);
      // Load categories after menu is loaded
      await loadCategories();
    } catch (err: any) {
      setError(err.message || 'נכשל בטעינת התפריט');
    } finally {
      setLoading(false);
    }
  }

  async function loadTables() {
    if (!businessId) return;
    try {
      const res = await fetch(`/api/tables?businessId=${encodeURIComponent(businessId)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'נכשל בטעינת השולחנות');
      }
      setTables(data.tables ?? []);
    } catch (err: any) {
      console.error('Failed to load tables', err);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId || !newItem.category || !newItem.name || !newItem.price) return;

    const priceNumber = Number(newItem.price);
    if (Number.isNaN(priceNumber)) {
      setError('המחיר חייב להיות מספר');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const ingredients = newItem.ingredients
        ? newItem.ingredients.split(',').map((i) => i.trim()).filter(Boolean)
        : [];
      const allergens = newItem.allergens
        ? newItem.allergens.split(',').map((a) => a.trim()).filter(Boolean)
        : [];
      const ingredientsEn = newItem.ingredientsEn
        ? newItem.ingredientsEn.split(',').map((i) => i.trim()).filter(Boolean)
        : [];
      const allergensEn = newItem.allergensEn
        ? newItem.allergensEn.split(',').map((a) => a.trim()).filter(Boolean)
        : [];

      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          category: newItem.category.trim(),
          categoryEn: newItem.categoryEn?.trim() || null,
          name: newItem.name,
          nameEn: newItem.nameEn || undefined,
          price: priceNumber,
          imageUrl: newItem.imageUrl || undefined,
          ingredients: ingredients.length > 0 ? ingredients : undefined,
          ingredientsEn: ingredientsEn.length > 0 ? ingredientsEn : undefined,
          allergens: allergens.length > 0 ? allergens : undefined,
          allergensEn: allergensEn.length > 0 ? allergensEn : undefined,
          isFeatured: newItem.isFeatured,
          isPregnancySafe: newItem.isPregnancySafe,
          isBusiness: newItem.isBusiness,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'נכשל ביצירת פריט');
      }
      setNewItem({
        category: '',
        categoryEn: '',
        name: '',
        nameEn: '',
        price: '',
        imageUrl: '',
        ingredients: '',
        ingredientsEn: '',
        allergens: '',
        allergensEn: '',
        isFeatured: false,
        isPregnancySafe: false,
        isBusiness: false,
      });
      await loadMenu();
    } catch (err: any) {
      setError(err.message || 'נכשל ביצירת פריט');
    } finally {
      setLoading(false);
    }
  }

  async function handleEditItem(item: DashboardMenuItem) {
    setEditingItem(item);
    setNewItem({
      category: item.category,
      categoryEn: item.categoryEn || '',
      name: item.name,
      nameEn: item.nameEn || '',
      price: item.price.toString(),
      imageUrl: item.imageUrl || '',
      ingredients: item.ingredients?.join(', ') || '',
      ingredientsEn: item.ingredientsEn?.join(', ') || '',
      allergens: item.allergens?.join(', ') || '',
      allergensEn: item.allergensEn?.join(', ') || '',
      isFeatured: item.isFeatured || false,
      isPregnancySafe: item.isPregnancySafe || false,
      isBusiness: item.isBusiness || false,
    });
  }

  async function handleUpdateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId || !editingItem || !newItem.category || !newItem.name || !newItem.price) return;

    const priceNumber = Number(newItem.price);
    if (Number.isNaN(priceNumber)) {
      setError('המחיר חייב להיות מספר');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const ingredients = newItem.ingredients
        ? newItem.ingredients.split(',').map((i) => i.trim()).filter(Boolean)
        : [];
      const allergens = newItem.allergens
        ? newItem.allergens.split(',').map((a) => a.trim()).filter(Boolean)
        : [];
      const ingredientsEn = newItem.ingredientsEn
        ? newItem.ingredientsEn.split(',').map((i) => i.trim()).filter(Boolean)
        : [];
      const allergensEn = newItem.allergensEn
        ? newItem.allergensEn.split(',').map((a) => a.trim()).filter(Boolean)
        : [];

      const categoryEnValue = newItem.categoryEn?.trim() || null;
      
      const res = await fetch(`/api/menu/${encodeURIComponent(editingItem.name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          category: newItem.category.trim(),
          categoryEn: categoryEnValue,
          name: newItem.name,
          nameEn: newItem.nameEn?.trim() || undefined,
          price: priceNumber,
          imageUrl: newItem.imageUrl || undefined,
          ingredients: ingredients.length > 0 ? ingredients : undefined,
          ingredientsEn: ingredientsEn.length > 0 ? ingredientsEn : undefined,
          allergens: allergens.length > 0 ? allergens : undefined,
          allergensEn: allergensEn.length > 0 ? allergensEn : undefined,
          isFeatured: newItem.isFeatured,
          isPregnancySafe: newItem.isPregnancySafe,
          isBusiness: newItem.isBusiness,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'נכשל בעדכון פריט');
      }
      if (data.warning) {
        console.warn('⚠️', data.warning);
        toast.error('הקטגוריה לא נשמרה - יש להוסיף את ה-column category_en בדטה בייס');
      }
      setEditingItem(null);
      setNewItem({
        category: '',
        categoryEn: '',
        name: '',
        nameEn: '',
        price: '',
        imageUrl: '',
        ingredients: '',
        ingredientsEn: '',
        allergens: '',
        allergensEn: '',
        isFeatured: false,
        isPregnancySafe: false,
        isBusiness: false,
      });
      await loadMenu();
    } catch (err: any) {
      setError(err.message || 'נכשל בעדכון פריט');
    } finally {
      setLoading(false);
    }
  }

  function cancelEdit() {
    setEditingItem(null);
    setNewItem({
      category: '',
      categoryEn: '',
      name: '',
      nameEn: '',
      price: '',
      imageUrl: '',
      ingredients: '',
      ingredientsEn: '',
      allergens: '',
      allergensEn: '',
      isFeatured: false,
      isPregnancySafe: false,
      isBusiness: false,
    });
  }

  async function toggleFeatured(item: DashboardMenuItem) {
    if (!businessId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/menu/${encodeURIComponent(item.name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          isFeatured: !item.isFeatured,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'נכשל בעדכון');
      }
      await loadMenu();
    } catch (err: any) {
      setError(err.message || 'נכשל בעדכון');
    } finally {
      setLoading(false);
    }
  }

  async function toggleHidden(item: DashboardMenuItem) {
    if (!businessId) return;
    try {
      setLoading(true);
      setError(null);
      const newIsHidden = !item.isHidden;
      const res = await fetch(`/api/menu/${encodeURIComponent(item.name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          isHidden: newIsHidden,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'נכשל בעדכון');
      }
      toast.success(newIsHidden ? 'המנה הוסרה מהמלאי' : 'המנה הוחזרה למלאי');
      await loadMenu();
    } catch (err: any) {
      setError(err.message || 'נכשל בעדכון');
      toast.error(err.message || 'נכשל בעדכון');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteItem(name: string) {
    if (!businessId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/menu/${encodeURIComponent(name)}?businessId=${encodeURIComponent(businessId)}`,
        {
          method: 'DELETE',
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'נכשל במחיקת פריט');
      }
      await loadMenu();
    } catch (err: any) {
      setError(err.message || 'נכשל במחיקת פריט');
    } finally {
      setLoading(false);
    }
  }

  async function moveItemUp(item: DashboardMenuItem) {
    if (!businessId) return;
    const currentIndex = items.findIndex(i => i.name === item.name);
    if (currentIndex <= 0) return; // Already at top

    const prevItem = items[currentIndex - 1];
    const currentSortOrder = item.sortOrder ?? currentIndex;
    const prevSortOrder = prevItem.sortOrder ?? (currentIndex - 1);

    try {
      setLoading(true);
      // Swap sort orders
      await Promise.all([
        fetch(`/api/menu/${encodeURIComponent(item.name)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            sortOrder: prevSortOrder,
          }),
        }),
        fetch(`/api/menu/${encodeURIComponent(prevItem.name)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            sortOrder: currentSortOrder,
          }),
        }),
      ]);
      await loadMenu();
    } catch (err: any) {
      setError(err.message || 'נכשל בהזזת מנה');
      toast.error(err.message || 'נכשל בהזזת מנה');
    } finally {
      setLoading(false);
    }
  }

  async function moveItemDown(item: DashboardMenuItem) {
    if (!businessId) return;
    const currentIndex = items.findIndex(i => i.name === item.name);
    if (currentIndex < 0 || currentIndex >= items.length - 1) return; // Already at bottom

    const nextItem = items[currentIndex + 1];
    const currentSortOrder = item.sortOrder ?? currentIndex;
    const nextSortOrder = nextItem.sortOrder ?? (currentIndex + 1);

    try {
      setLoading(true);
      // Swap sort orders
      await Promise.all([
        fetch(`/api/menu/${encodeURIComponent(item.name)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            sortOrder: nextSortOrder,
          }),
        }),
        fetch(`/api/menu/${encodeURIComponent(nextItem.name)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            sortOrder: currentSortOrder,
          }),
        }),
      ]);
      await loadMenu();
    } catch (err: any) {
      setError(err.message || 'נכשל בהזזת מנה');
      toast.error(err.message || 'נכשל בהזזת מנה');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTable(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId || !newTable.tableId || !newTable.label) return;

    // No limit on number of tables - removed tablesAllowed restriction

    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          tableId: newTable.tableId,
          label: newTable.label,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'נכשל ביצירת שולחן');
      }
      setNewTable({ tableId: '', label: '' });
      await loadTables();
    } catch (err: any) {
      setError(err.message || 'נכשל ביצירת שולחן');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTable(tableId: string) {
    if (!businessId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/tables/${encodeURIComponent(tableId)}?businessId=${encodeURIComponent(businessId)}`,
        {
          method: 'DELETE',
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'נכשל במחיקת שולחן');
      }
      await loadTables();
      if (selectedTable === tableId) {
        setSelectedTable(null);
        setQrDataUrl(null);
      }
    } catch (err: any) {
      setError(err.message || 'נכשל במחיקת שולחן');
    } finally {
      setLoading(false);
    }
  }

  async function generateQR(tableId: string) {
    if (!businessId) return;
    try {
      const url = `${window.location.origin}/menu/${businessId}/${tableId}/home`;
      const dataUrl = await QRCode.toDataURL(url);
      setQrDataUrl(dataUrl);
      setSelectedTable(tableId);
    } catch (err) {
      setError('נכשל ביצירת קוד QR');
    }
  }

  async function handleImageUpload(file: File) {
    if (!businessId) {
      toast.error('מזהה עסק לא נמצא, אנא התחברו מחדש.');
      return;
    }
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('businessId', businessId);

      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'העלאת תמונה נכשלה');
      }

      if (!data.url) {
        throw new Error('לא התקבל URL לתמונה מהשרת');
      }

      setNewItem((prev) => ({ ...prev, imageUrl: data.url }));
      toast.success('התמונה הועלתה בהצלחה ונשמרה לפריט!');
    } catch (err: any) {
      toast.error(err.message || 'העלאת תמונה נכשלה');
    } finally {
      setUploadingImage(false);
    }
  }

  async function searchImages(query: string) {
    if (!query.trim()) {
      setImageSearchResults([]);
      return;
    }

    try {
      setSearchingImages(true);
      
      // Call our API endpoint for image search
      const res = await fetch(`/api/images/search?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'נכשל בחיפוש תמונות');
      }

      if (data.images && data.images.length > 0) {
        setImageSearchResults(data.images);
      } else {
        toast.error('לא נמצאו תמונות');
        setImageSearchResults([]);
      }
    } catch (err: any) {
      console.error('Error searching images', err);
      toast.error(err.message || 'נכשל בחיפוש תמונות');
      setImageSearchResults([]);
    } finally {
      setSearchingImages(false);
    }
  }

  async function handleAutoTranslate(
    source: 'category' | 'name' | 'ingredients' | 'allergens',
    showToast = true,
  ) {
    try {
      let text = '';
      if (source === 'category') text = newItem.category;
      if (source === 'name') text = newItem.name;
      if (source === 'ingredients') text = newItem.ingredients;
      if (source === 'allergens') text = newItem.allergens;

      if (!text.trim()) {
        if (showToast) toast.error('אין טקסט בעברית לתרגום');
        return;
      }

      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          target: source,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'תרגום נכשל');
      }

      const translated: string = data.translated || '';
      if (!translated) {
        if (showToast) toast.error('לא התקבל תרגום מהשרת');
        return;
      }

      setNewItem((prev) => {
        if (source === 'category') return { ...prev, categoryEn: translated };
        if (source === 'name') return { ...prev, nameEn: translated };
        if (source === 'ingredients') return { ...prev, ingredientsEn: translated };
        if (source === 'allergens') return { ...prev, allergensEn: translated };
        return prev;
      });
      if (showToast) toast.success('התרגום נוסף לשדה האנגלי, אפשר לערוך לפני שמירה');
    } catch (err: any) {
      if (showToast) toast.error(err.message || 'תרגום נכשל');
    }
  }

  // Auto-translate category when it changes (only if categoryEn is empty)
  useEffect(() => {
    // Only auto-translate if category has text and categoryEn is empty
    if (newItem.category && newItem.category.trim() && !newItem.categoryEn?.trim()) {
      // Small delay to avoid translating on every keystroke
      const timeoutId = setTimeout(async () => {
        try {
          const res = await fetch('/api/ai/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: newItem.category.trim(),
              target: 'category',
            }),
          });

          const data = await res.json();
          if (res.ok && data.translated) {
            setNewItem((prev) => ({ ...prev, categoryEn: data.translated }));
          }
        } catch (err) {
          // Silent fail for auto-translate
          console.error('Auto-translate failed:', err);
        }
      }, 1000); // Wait 1 second after user stops typing

      return () => clearTimeout(timeoutId);
    }
  }, [newItem.category, newItem.categoryEn]);

  // Auto-translate name when it changes (only if nameEn is empty)
  useEffect(() => {
    // Only auto-translate if name has text and nameEn is empty
    if (newItem.name && newItem.name.trim() && !newItem.nameEn?.trim()) {
      // Small delay to avoid translating on every keystroke
      const timeoutId = setTimeout(async () => {
        try {
          const res = await fetch('/api/ai/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: newItem.name.trim(),
              target: 'name',
            }),
          });

          const data = await res.json();
          if (res.ok && data.translated) {
            setNewItem((prev) => ({ ...prev, nameEn: data.translated }));
          }
        } catch (err) {
          // Silent fail for auto-translate
          console.error('Auto-translate failed:', err);
        }
      }, 1000); // Wait 1 second after user stops typing

      return () => clearTimeout(timeoutId);
    }
  }, [newItem.name, newItem.nameEn]);

  // Auto-translate ingredients when it changes (only if ingredientsEn is empty)
  useEffect(() => {
    // Only auto-translate if ingredients has text and ingredientsEn is empty
    if (newItem.ingredients && newItem.ingredients.trim() && !newItem.ingredientsEn?.trim()) {
      // Small delay to avoid translating on every keystroke
      const timeoutId = setTimeout(async () => {
        try {
          const res = await fetch('/api/ai/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: newItem.ingredients.trim(),
              target: 'ingredients',
            }),
          });

          const data = await res.json();
          if (res.ok && data.translated) {
            setNewItem((prev) => ({ ...prev, ingredientsEn: data.translated }));
          }
        } catch (err) {
          // Silent fail for auto-translate
          console.error('Auto-translate failed:', err);
        }
      }, 1000); // Wait 1 second after user stops typing

      return () => clearTimeout(timeoutId);
    }
  }, [newItem.ingredients, newItem.ingredientsEn]);

  // Auto-translate allergens when it changes (only if allergensEn is empty)
  useEffect(() => {
    // Only auto-translate if allergens has text and allergensEn is empty
    if (newItem.allergens && newItem.allergens.trim() && !newItem.allergensEn?.trim()) {
      // Small delay to avoid translating on every keystroke
      const timeoutId = setTimeout(async () => {
        try {
          const res = await fetch('/api/ai/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: newItem.allergens.trim(),
              target: 'allergens',
            }),
          });

          const data = await res.json();
          if (res.ok && data.translated) {
            setNewItem((prev) => ({ ...prev, allergensEn: data.translated }));
          }
        } catch (err) {
          // Silent fail for auto-translate
          console.error('Auto-translate failed:', err);
        }
      }, 1000); // Wait 1 second after user stops typing

      return () => clearTimeout(timeoutId);
    }
  }, [newItem.allergens, newItem.allergensEn]);

  if (!businessId) {
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
        <p className="text-red-400">מזהה עסק לא נמצא. אנא התחברו שוב.</p>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white pb-40 lg:pb-6">
      {/* Header - Modern Design */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/50 px-4 lg:px-6 py-4 lg:py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl lg:text-3xl font-bold mb-1 bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
            לוח בקרה עסקי
          </h1>
          <p className="text-neutral-400 text-sm lg:text-base">
            נהלו את התפריט, השולחנות וקודי QR, מדפסת, וצפו בהזמנות והכנסות.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6">
        {error && (
          <div className="bg-red-950/40 border border-red-500/50 rounded-xl px-4 py-3 backdrop-blur-sm">
            <p className="text-sm text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* Subscription Warning Banner */}
        {businessInfo?.subscription && 
         (businessInfo.subscription.status === 'expired' || businessInfo.subscription.status === 'past_due') && (
          <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-500/50 rounded-xl p-4 backdrop-blur-sm shadow-lg">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-300 mb-1">
                  המנוי {businessInfo.subscription.status === 'expired' ? 'פג תוקף' : 'בפיגור תשלום'}
                </h3>
                <p className="text-sm text-yellow-200/80 mb-2">
                  המנוי שלך {businessInfo.subscription.status === 'expired' ? 'פג תוקף' : 'בפיגור תשלום'}.
                  הלקוחות לא יוכלו לבצע הזמנות עד שתחדש את המנוי.
                </p>
                {businessInfo.subscription.nextBillingDate && (
                  <p className="text-xs text-yellow-200/60">
                    תאריך חיוב הבא: {new Date(businessInfo.subscription.nextBillingDate).toLocaleDateString('he-IL')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Desktop Navigation - Horizontal Scroll */}
        <nav className="hidden lg:flex gap-2 border-b border-neutral-800/50 mb-6 overflow-x-auto scrollbar-hide">
          {[
            { id: 'menu', label: '📋 ניהול תפריט', icon: '📋', showFor: ['full', 'menu_only'] as const },
            { id: 'tables', label: '🪑 שולחנות, QR ו-NFC', icon: '🪑', showFor: ['full', 'menu_only'] as const },
            { id: 'content', label: '✨ תוכן נוסף', icon: '✨', showFor: ['full', 'menu_only'] as const },
            { id: 'settings', label: '⚙️ הגדרות עסק', icon: '⚙️', showFor: ['full', 'menu_only'] as const },
            { id: 'printer', label: '🖨️ הגדרות מדפסת', icon: '🖨️', showFor: ['full'] as const },
            { id: 'pos', label: '💳 אינטגרציית POS', icon: '💳', showFor: ['full'] as const },
            { id: 'orders', label: '📊 הזמנות ורווחים', icon: '📊', showFor: ['full'] as const },
          ]
            .filter((tab) => {
              const planType = (businessInfo?.subscription?.planType || 'full') as 'full' | 'menu_only';
              return (tab.showFor as readonly ('full' | 'menu_only')[]).includes(planType);
            })
            .map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'orders' && businessId) loadOrders();
              }}
              className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-neutral-800/80 text-white border-b-2 border-white shadow-lg'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Mobile Bottom Navigation - Premium Expandable Grid */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-800/50 shadow-2xl">
          {(() => {
            // Build all menu items array
            const allMenuItems = [
              { id: 'content', label: 'תוכן', icon: '✨', showFor: ['full', 'menu_only'] as const },
              { id: 'tables', label: 'שולחנות', icon: '🪑', showFor: ['full', 'menu_only'] as const },
              { id: 'menu', label: 'תפריט', icon: '📋', showFor: ['full', 'menu_only'] as const },
              { id: 'settings', label: 'הגדרות', icon: '⚙️', showFor: ['full', 'menu_only'] as const },
              { id: 'printer', label: 'מדפסת', icon: '🖨️', showFor: ['full'] as const },
              { id: 'pos', label: 'POS', icon: '💳', showFor: ['full'] as const },
              { id: 'orders', label: 'הזמנות', icon: '📊', showFor: ['full'] as const, action: () => businessId && loadOrders() },
            ];

            // Filter by plan type
            const planType = (businessInfo?.subscription?.planType || 'full') as 'full' | 'menu_only';
            const visibleItems = allMenuItems.filter((tab) => 
              (tab.showFor as readonly ('full' | 'menu_only')[]).includes(planType)
            );

            // Get items to display based on state
            const initialItems = visibleItems.slice(0, 2);
            const remainingItems = visibleItems.slice(2);
            const hasMore = remainingItems.length > 0;

            // Items to show: initial 2 + (More button if needed) OR all items if expanded
            const itemsToShow = menuExpanded 
              ? visibleItems 
              : [...initialItems, ...(hasMore ? [{ id: 'more', label: 'עוד', icon: '➕', isMore: true }] : [])];

            return (
              <div className="overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={menuExpanded ? 'expanded' : 'collapsed'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="grid grid-cols-3 gap-1 p-2">
                      {itemsToShow.map((tab: any, index: number) => {
                        if (tab.isMore) {
                          return (
                            <motion.button
                              key="more"
                              onClick={() => setMenuExpanded(true)}
                              className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg transition-all duration-200 text-neutral-400 active:bg-neutral-800/50 hover:bg-neutral-800/30"
                              whileTap={{ scale: 0.95 }}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                            >
                              <span className="text-xl">➕</span>
                              <span className="text-[10px] font-medium">עוד</span>
                            </motion.button>
                          );
                        }

                        return (
                          <motion.button
                            key={tab.id}
                            onClick={() => {
                              setActiveTab(tab.id as any);
                              if (tab.action) tab.action();
                              if (menuExpanded) setMenuExpanded(false);
                            }}
                            className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg transition-all duration-200 ${
                              activeTab === tab.id
                                ? 'bg-neutral-800 text-white'
                                : 'text-neutral-400 active:bg-neutral-800/50'
                            }`}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                          >
                            <span className="text-xl">{tab.icon}</span>
                            <span className="text-[10px] font-medium">{tab.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Close button when expanded */}
                <AnimatePresence>
                  {menuExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="border-t border-neutral-800/30"
                    >
                      <button
                        onClick={() => setMenuExpanded(false)}
                        className="w-full flex items-center justify-center gap-2 py-3 px-2 text-neutral-400 hover:text-white transition-colors active:bg-neutral-800/30"
                      >
                        <span className="text-sm font-medium">סגור</span>
                        <motion.span
                          animate={{ rotate: 0 }}
                          className="text-lg"
                        >
                          ↑
                        </motion.span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })()}
        </nav>

        {activeTab === 'menu' && (
          <section className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold mb-2">ניהול תפריט</h2>
                <p className="text-sm text-neutral-400">
                  צרו ועדכנו קטגוריות, פריטים, מרכיבים, אלרגנים והתאמות אישיות.
                </p>
              </div>
              {tables.length > 0 && businessId && (
                <a
                  href={`/menu/${businessId}/${tables[0].tableId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-green-400 hover:text-green-300 border border-green-400/40 px-4 py-2 rounded-lg transition-all hover:bg-green-400/10"
                >
                  <span>→</span>
                  <span>צפה בתפריט לקוח</span>
                </a>
              )}
            </div>

            <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 rounded-2xl p-5 lg:p-6 space-y-4 shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-neutral-200">קטגוריה</label>
                    {newItem.category.trim() && !categories.find(c => c.category === newItem.category.trim()) && (
                      <button
                        type="button"
                        onClick={saveCategory}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center gap-1"
                        title="שמור קטגוריה זו לשימוש עתידי"
                      >
                        💾 שמור קטגוריה
                      </button>
                    )}
                  </div>
                  <div className="relative flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        list="categories-list"
                        value={newItem.category}
                        onChange={(e) => setNewItem((v) => ({ ...v, category: e.target.value.trim() }))}
                        onBlur={(e) => {
                          // When user selects from list or types, update categoryEn if it exists
                          const trimmedValue = e.target.value.trim();
                          const selectedCategory = categories.find(c => c.category === trimmedValue);
                          if (selectedCategory && selectedCategory.categoryEn) {
                            // Update categoryEn if it's empty or if the selected category has a different categoryEn
                            if (!newItem.categoryEn || newItem.categoryEn !== selectedCategory.categoryEn) {
                              setNewItem((v) => ({ ...v, categoryEn: selectedCategory.categoryEn || '' }));
                            }
                          }
                        }}
                        className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                        placeholder="למשל: עיקריות (או בחר מהרשימה)"
                        required
                      />
                      <datalist id="categories-list">
                        {categories.map((cat, idx) => (
                          <option key={idx} value={cat.category}>
                            {cat.categoryEn ? `${cat.category} (${cat.categoryEn})` : cat.category}
                          </option>
                        ))}
                      </datalist>
                    </div>
                    {categories.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            const selectedCategory = categories.find(c => c.category === e.target.value);
                            if (selectedCategory) {
                              setNewItem((v) => ({ 
                                ...v, 
                                category: selectedCategory.category,
                                categoryEn: selectedCategory.categoryEn || v.categoryEn
                              }));
                            }
                            e.target.value = ''; // Reset select
                          }
                        }}
                        className="rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-neutral-300"
                        title="בחר קטגוריה קיימת"
                      >
                        <option value="">בחר...</option>
                        {categories.map((cat, idx) => (
                          <option key={idx} value={cat.category}>
                            {cat.categoryEn ? `${cat.category} (${cat.categoryEn})` : cat.category}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {categories.length > 0 && (
                    <p className="text-xs text-neutral-400 mt-1">
                      {categories.length} קטגוריות קיימות - בחר מהרשימה או הקלד חדשה
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-neutral-200">קטגוריה באנגלית</label>
                    <button
                      type="button"
                      onClick={() => handleAutoTranslate('category')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      ✨ תרגם אוטומטית
                    </button>
                  </div>
                  <input
                    value={newItem.categoryEn}
                    onChange={(e) => setNewItem((v) => ({ ...v, categoryEn: e.target.value }))}
                    className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="e.g. Starters"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-200">שם</label>
                  <input
                    value={newItem.name}
                    onChange={(e) => setNewItem((v) => ({ ...v, name: e.target.value }))}
                    className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="למשל: פיצה מרגריטה"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-neutral-200">שם באנגלית</label>
                    <button
                      type="button"
                      onClick={() => handleAutoTranslate('name')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      ✨ תרגם אוטומטית
                    </button>
                  </div>
                  <input
                    value={newItem.nameEn}
                    onChange={(e) => setNewItem((v) => ({ ...v, nameEn: e.target.value }))}
                    className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="e.g. Margherita Pizza"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-200">מחיר (₪)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.price === '' || newItem.price === '0' ? '' : newItem.price}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string, but prevent showing 0 when typing
                      // Remove leading zeros except for decimal numbers
                      if (value === '0') {
                        setNewItem((v) => ({ ...v, price: '' }));
                      } else {
                        setNewItem((v) => ({ ...v, price: value }));
                      }
                    }}
                    onBlur={(e) => {
                      // If empty or invalid, set to empty string (not 0)
                      const value = e.target.value;
                      // Remove trailing zeros and decimal point if not needed
                      if (value && !isNaN(Number(value)) && Number(value) > 0) {
                        const numValue = Number(value);
                        // Format to remove trailing zeros
                        const formatted = numValue % 1 === 0 ? numValue.toString() : numValue.toFixed(2).replace(/\.?0+$/, '');
                        setNewItem((v) => ({ ...v, price: formatted }));
                      } else if (value === '' || value === '0' || isNaN(Number(value)) || Number(value) <= 0) {
                        setNewItem((v) => ({ ...v, price: '' }));
                      }
                    }}
                    className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="12.50"
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-neutral-200">תמונה של המנה</label>
                {newItem.imageUrl && (
                  <div className="mb-3">
                    <img
                      src={newItem.imageUrl}
                      alt={newItem.name || 'תמונה'}
                      className="h-24 w-24 lg:h-32 lg:w-32 object-cover rounded-xl border-2 border-neutral-700/50 shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputGalleryRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex-1 lg:flex-initial rounded-lg bg-white text-black px-4 py-3 text-sm font-semibold disabled:opacity-60 hover:bg-neutral-100 transition-all active:scale-95"
                  >
                    📷 העלה מהטלפון
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputCameraRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex-1 lg:flex-initial rounded-lg bg-neutral-700/80 text-white px-4 py-3 text-sm font-semibold hover:bg-neutral-600 disabled:opacity-60 transition-all active:scale-95"
                  >
                    📸 צלם עכשיו
                  </button>
                </div>
                <input
                  ref={fileInputGalleryRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handleImageUpload(file);
                      e.target.value = '';
                    }
                  }}
                />
                <input
                  ref={fileInputCameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handleImageUpload(file);
                      e.target.value = '';
                    }
                  }}
                />
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-neutral-400 mb-1">
                    🔍 חפש תמונות באינטרנט:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageSearchQuery}
                      onChange={(e) => {
                        setImageSearchQuery(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && imageSearchQuery.trim()) {
                          e.preventDefault();
                          void searchImages(imageSearchQuery);
                        }
                      }}
                      className="flex-1 rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      placeholder="למשל: פיצה מרגריטה, סלט, המבורגר..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (imageSearchQuery.trim()) {
                          void searchImages(imageSearchQuery);
                        } else if (newItem.name.trim()) {
                          // Auto-search by item name
                          setImageSearchQuery(newItem.name);
                          void searchImages(newItem.name);
                        }
                      }}
                      disabled={searchingImages}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-60 transition-all"
                    >
                      {searchingImages ? '🔍...' : '🔍 חפש'}
                    </button>
                  </div>
                  
                  {imageSearchResults.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-neutral-400 mb-2">תוצאות חיפוש:</p>
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {imageSearchResults.map((img) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => {
                              setNewItem((v) => ({ ...v, imageUrl: img.url }));
                              setImageSearchResults([]);
                              setImageSearchQuery('');
                              toast.success('תמונה נבחרה!');
                            }}
                            className="relative aspect-square rounded-lg overflow-hidden border-2 border-neutral-700/50 hover:border-blue-500/50 transition-all group"
                          >
                            <img
                              src={img.thumbnail}
                              alt="תמונה"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                              <span className="text-white text-xs opacity-0 group-hover:opacity-100">✓</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-neutral-400 mt-3 mb-1">
                  או הדביקו URL קיים:
                </p>
                <input
                  type="url"
                  value={newItem.imageUrl}
                  onChange={(e) => setNewItem((v) => ({ ...v, imageUrl: e.target.value }))}
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-200">מרכיבים (מופרדים בפסיקים)</label>
                  <input
                    value={newItem.ingredients}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Remove any trailing 0 (even if it's part of a word or after spaces/commas)
                      // Match: 0 at the end, optionally preceded by spaces or commas
                      value = value.replace(/[\s,]*0+$/, '');
                      setNewItem((v) => ({ ...v, ingredients: value }));
                    }}
                    onBlur={(e) => {
                      let value = e.target.value;
                      // Remove any 0 at the end, even if it's attached to a word (like "word0" -> "word")
                      // This regex matches: any character that's not a digit, followed by one or more zeros at the end
                      value = value.replace(/([^\d\s,])0+([\s,]*$)/g, '$1$2');
                      // Also remove standalone 0 at the end (with optional spaces/commas before it)
                      value = value.replace(/[\s,]*0+[\s,]*$/g, '');
                      // Clean up multiple commas and spaces
                      value = value.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
                      // Remove leading/trailing commas
                      value = value.replace(/^,|,$/g, '');
                      setNewItem((v) => ({ ...v, ingredients: value }));
                    }}
                    className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="למשל: עגבניות, מוצרלה, בזיליקום"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-200">אלרגנים (מופרדים בפסיקים)</label>
                  <input
                    value={newItem.allergens}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Remove any trailing 0 (even if it's part of a word or after spaces/commas)
                      value = value.replace(/[\s,]*0+$/, '');
                      setNewItem((v) => ({ ...v, allergens: value }));
                    }}
                    onBlur={(e) => {
                      let value = e.target.value;
                      // Remove any 0 at the end, even if it's attached to a word (like "word0" -> "word")
                      // This regex matches: any character that's not a digit, followed by one or more zeros at the end
                      value = value.replace(/([^\d\s,])0+([\s,]*$)/g, '$1$2');
                      // Also remove standalone 0 at the end (with optional spaces/commas before it)
                      value = value.replace(/[\s,]*0+[\s,]*$/g, '');
                      // Clean up multiple commas and spaces
                      value = value.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
                      // Remove leading/trailing commas
                      value = value.replace(/^,|,$/g, '');
                      setNewItem((v) => ({ ...v, allergens: value }));
                    }}
                    className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="למשל: גלוטן, חלב"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-neutral-200">
                      מרכיבים באנגלית
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAutoTranslate('ingredients')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      ✨ תרגם אוטומטית
                    </button>
                  </div>
                  <input
                    value={newItem.ingredientsEn}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Remove any trailing 0 (even if it's part of a word or after spaces/commas)
                      value = value.replace(/[\s,]*0+$/, '');
                      setNewItem((v) => ({ ...v, ingredientsEn: value }));
                    }}
                    onBlur={(e) => {
                      let value = e.target.value;
                      // Remove any 0 at the end, even if it's attached to a word (like "word0" -> "word")
                      // This regex matches: any character that's not a digit, followed by one or more zeros at the end
                      value = value.replace(/([^\d\s,])0+([\s,]*$)/g, '$1$2');
                      // Also remove standalone 0 at the end (with optional spaces/commas before it)
                      value = value.replace(/[\s,]*0+[\s,]*$/g, '');
                      // Clean up multiple commas and spaces
                      value = value.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
                      // Remove leading/trailing commas
                      value = value.replace(/^,|,$/g, '');
                      setNewItem((v) => ({ ...v, ingredientsEn: value }));
                    }}
                    className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="e.g. Tomatoes, Mozzarella, Basil"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-neutral-200">
                      אלרגנים באנגלית
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAutoTranslate('allergens')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      ✨ תרגם אוטומטית
                    </button>
                  </div>
                  <input
                    value={newItem.allergensEn}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Remove any trailing 0 (even if it's part of a word or after spaces/commas)
                      value = value.replace(/[\s,]*0+$/, '');
                      setNewItem((v) => ({ ...v, allergensEn: value }));
                    }}
                    onBlur={(e) => {
                      let value = e.target.value;
                      // Remove any 0 at the end, even if it's attached to a word (like "word0" -> "word")
                      // This regex matches: any character that's not a digit, followed by one or more zeros at the end
                      value = value.replace(/([^\d\s,])0+([\s,]*$)/g, '$1$2');
                      // Also remove standalone 0 at the end (with optional spaces/commas before it)
                      value = value.replace(/[\s,]*0+[\s,]*$/g, '');
                      // Clean up multiple commas and spaces
                      value = value.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
                      // Remove leading/trailing commas
                      value = value.replace(/^,|,$/g, '');
                      setNewItem((v) => ({ ...v, allergensEn: value }));
                    }}
                    className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="e.g. Gluten, Milk"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={newItem.isFeatured}
                    onChange={(e) => setNewItem((v) => ({ ...v, isFeatured: e.target.checked }))}
                    className="w-5 h-5 rounded border-2 border-neutral-600 bg-neutral-800/80 text-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
                  />
                  <span className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">⭐ מומלץ</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={newItem.isPregnancySafe}
                    onChange={(e) => setNewItem((v) => ({ ...v, isPregnancySafe: e.target.checked }))}
                    className="w-5 h-5 rounded border-2 border-neutral-600 bg-neutral-800/80 text-green-500 focus:ring-2 focus:ring-green-500/50 transition-all cursor-pointer"
                  />
                  <span className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">🤰 מתאים להריון</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={newItem.isBusiness}
                    onChange={(e) => setNewItem((v) => ({ ...v, isBusiness: e.target.checked }))}
                    className="w-5 h-5 rounded border-2 border-neutral-600 bg-neutral-800/80 text-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
                  />
                  <span className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">💼 מנה עסקית</span>
                </label>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-800/50">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 text-sm font-semibold disabled:opacity-60 hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  {loading ? '⏳ שומר...' : editingItem ? '✅ עדכן פריט' : '➕ הוסף פריט'}
                </button>
                {editingItem && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 sm:flex-initial rounded-lg bg-neutral-700/80 text-white px-6 py-3 text-sm font-semibold hover:bg-neutral-600 transition-all active:scale-95"
                  >
                    ✖️ ביטול
                  </button>
                )}
              </div>
          </form>

          <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-neutral-800/50 to-neutral-800/30 px-5 py-4 border-b border-neutral-800/50">
              <h3 className="text-base font-bold text-white">📋 רשימת פריטים</h3>
              <p className="text-xs text-neutral-400 mt-1">{items.length} פריטים בתפריט</p>
            </div>
            <div className="divide-y divide-neutral-800/30">
              {items.length === 0 && (
                <div className="px-5 py-12 text-center">
                  <div className="text-4xl mb-3 opacity-30">🍽️</div>
                  <p className="text-sm text-neutral-400 font-medium">
                    עדיין אין פריטים. צרו את הפריט הראשון שלכם למעלה.
                  </p>
                </div>
              )}
              {items.map((item) => (
                <div
                  key={`${item.businessId}-${item.name}`}
                  className="px-4 lg:px-6 py-4 hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row gap-4">
                    {item.imageUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-20 w-20 lg:h-24 lg:w-24 object-cover rounded-xl border-2 border-neutral-700/50 shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-neutral-300 bg-neutral-800/60 px-2.5 py-1 rounded-lg">
                          {item.category}
                        </span>
                        {item.isHidden && (
                          <span className="text-xs font-medium text-orange-300 bg-orange-900/40 px-2.5 py-1 rounded-lg border border-orange-700/30">
                            👁️ לא במלאי
                          </span>
                        )}
                        {item.isFeatured && (
                          <span className="text-xs font-medium text-yellow-300 bg-yellow-900/40 px-2.5 py-1 rounded-lg border border-yellow-700/30">
                            ⭐ מומלץ
                          </span>
                        )}
                        {item.isBusiness && (
                          <span className="text-xs font-medium text-blue-300 bg-blue-900/40 px-2.5 py-1 rounded-lg border border-blue-700/30">
                            💼 עסקי
                          </span>
                        )}
                        {item.isPregnancySafe && (
                          <span className="text-xs font-medium text-green-300 bg-green-900/40 px-2.5 py-1 rounded-lg border border-green-700/30">
                            🤰 מתאים להריון
                          </span>
                        )}
                        <span className="text-lg font-bold text-white ml-auto">₪{item.price.toFixed(2)}</span>
                      </div>
                      <h4 className={`text-base font-semibold mb-2 ${item.isHidden ? 'text-neutral-500 line-through' : 'text-white'}`}>{item.name}</h4>
                      {item.ingredients && item.ingredients.length > 0 && (
                        <p className="text-sm text-neutral-400 mb-1">
                          <span className="text-neutral-500 font-medium">מרכיבים:</span> {item.ingredients.join(', ')}
                        </p>
                      )}
                      {item.allergens && item.allergens.length > 0 && (
                        <p className="text-sm text-red-300">
                          <span className="text-neutral-500 font-medium">אלרגנים:</span> {item.allergens.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 lg:flex-col">
                      <div className="flex gap-2">
                        <button
                          onClick={() => moveItemUp(item)}
                          disabled={items.findIndex(i => i.name === item.name) === 0}
                          className={`text-sm px-3 py-2 rounded-lg font-medium transition-all active:scale-95 ${
                            items.findIndex(i => i.name === item.name) === 0
                              ? 'text-neutral-500 bg-neutral-800/30 border border-neutral-700/20 cursor-not-allowed'
                              : 'text-white bg-neutral-700/60 border border-neutral-600/30 hover:bg-neutral-600'
                          }`}
                          title="הזז למעלה"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveItemDown(item)}
                          disabled={items.findIndex(i => i.name === item.name) === items.length - 1}
                          className={`text-sm px-3 py-2 rounded-lg font-medium transition-all active:scale-95 ${
                            items.findIndex(i => i.name === item.name) === items.length - 1
                              ? 'text-neutral-500 bg-neutral-800/30 border border-neutral-700/20 cursor-not-allowed'
                              : 'text-white bg-neutral-700/60 border border-neutral-600/30 hover:bg-neutral-600'
                          }`}
                          title="הזז למטה"
                        >
                          ↓
                        </button>
                      </div>
                      <button
                        onClick={() => toggleHidden(item)}
                        className={`text-sm px-4 py-2 rounded-lg font-medium transition-all active:scale-95 ${
                          item.isHidden
                            ? 'text-orange-300 bg-orange-900/40 border border-orange-700/30 hover:bg-orange-900/50'
                            : 'text-green-300 bg-green-900/40 border border-green-700/30 hover:bg-green-900/50'
                        }`}
                        title={item.isHidden ? 'המנה לא במלאי - לחץ להחזיר למלאי' : 'המנה במלאי - לחץ להסיר מהמלאי'}
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => toggleFeatured(item)}
                        className={`text-sm px-4 py-2 rounded-lg font-medium transition-all active:scale-95 ${
                          item.isFeatured
                            ? 'text-yellow-300 bg-yellow-900/40 border border-yellow-700/30 hover:bg-yellow-900/50'
                            : 'text-neutral-400 bg-neutral-800/60 border border-neutral-700/30 hover:bg-neutral-700/60 hover:text-white'
                        }`}
                        title={item.isFeatured ? 'הסר ממומלצות' : 'סמן כמומלץ'}
                      >
                        ⭐
                      </button>
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-sm px-4 py-2 rounded-lg font-medium text-white bg-blue-600/80 border border-blue-500/30 hover:bg-blue-600 transition-all active:scale-95"
                      >
                        ✏️ ערוך
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.name)}
                        className="text-sm px-4 py-2 rounded-lg font-medium text-red-300 bg-red-900/30 border border-red-700/30 hover:bg-red-900/40 transition-all active:scale-95"
                      >
                        🗑️ מחק
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'tables' && (
        <section className="space-y-6">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold mb-2">🪑 שולחנות, QR ו-NFC</h2>
            <p className="text-sm text-neutral-400">
              הגדירו שולחנות ויצרו קודי QR ותגי NFC אוטומטיים לכל שולחן.
            </p>
          </div>

          <form onSubmit={handleAddTable} className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 rounded-2xl p-5 lg:p-6 space-y-4 shadow-xl">
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 mb-2">
              <p className="text-xs text-neutral-300 leading-relaxed">
                <strong className="text-blue-300">מזהה שולחן</strong> - מזהה טכני ייחודי (ללא רווחים, למשל: table-1, bar-1)
                <br />
                <strong className="text-blue-300">תווית</strong> - השם שהלקוח רואה (יכול להיות בעברית, למשל: שולחן 1, בר 1)
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-200">
                  מזהה שולחן <span className="text-neutral-500 text-xs">(ייחודי, ללא רווחים)</span>
                </label>
                <input
                  value={newTable.tableId}
                  onChange={(e) => setNewTable((v) => ({ ...v, tableId: e.target.value.replace(/\s+/g, '-') }))}
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="table-1"
                  required
                  pattern="[a-zA-Z0-9_-]+"
                  title="רק אותיות, מספרים, מקפים ותחתונים (ללא רווחים)"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-200">
                  תווית <span className="text-neutral-500 text-xs">(מה שהלקוח רואה)</span>
                </label>
                <input
                  value={newTable.label}
                  onChange={(e) => setNewTable((v) => ({ ...v, label: e.target.value }))}
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="שולחן 1"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 text-sm font-semibold disabled:opacity-60 hover:from-green-500 hover:to-green-400 transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  {loading ? '⏳ שומר...' : '➕ הוסף שולחן'}
                </button>
              </div>
            </div>
          </form>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-gradient-to-r from-neutral-800/50 to-neutral-800/30 px-5 py-4 border-b border-neutral-800/50">
                <h3 className="text-base font-bold text-white">🪑 שולחנות</h3>
                <p className="text-xs text-neutral-400 mt-1">{tables.length} שולחנות פעילים</p>
              </div>
              <div className="divide-y divide-neutral-800/30">
                {tables.length === 0 && (
                  <div className="px-5 py-12 text-center">
                    <div className="text-4xl mb-3 opacity-30">🪑</div>
                    <p className="text-sm text-neutral-400 font-medium">
                      עדיין אין שולחנות. צרו את השולחן הראשון שלכם למעלה.
                    </p>
                  </div>
                )}
                {tables.map((table) => (
                  <div
                    key={`${table.businessId}-${table.tableId}`}
                    className="px-4 lg:px-6 py-4 hover:bg-neutral-800/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white text-base mb-1">{table.label}</div>
                        <div className="text-neutral-400 text-xs font-mono">{table.tableId}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/menu/${businessId}/${table.tableId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-white bg-green-600/80 px-3 py-2 rounded-lg hover:bg-green-600 transition-all active:scale-95 font-medium"
                        >
                          👁️ צפה בתפריט
                        </a>
                        <button
                          onClick={() => generateQR(table.tableId)}
                          className="text-xs text-white bg-neutral-700/80 px-3 py-2 rounded-lg hover:bg-neutral-600 transition-all active:scale-95 font-medium"
                        >
                          📱 צפה ב-QR
                        </button>
                        <button
                          onClick={() => handleDeleteTable(table.tableId)}
                          className="text-xs text-red-300 bg-red-900/30 px-3 py-2 rounded-lg hover:bg-red-900/40 transition-all active:scale-95 font-medium border border-red-700/30"
                        >
                          🗑️ מחק
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {qrDataUrl && selectedTable ? (
              <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 rounded-2xl p-5 lg:p-6 space-y-4 shadow-xl">
                <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/50 rounded-xl px-4 py-3">
                  <h3 className="text-sm font-bold text-green-300 mb-1">
                    ✅ קוד QR מוכן להדפסה
                  </h3>
                  <p className="text-xs text-green-200/80">
                    עבור: {tables.find((t) => t.tableId === selectedTable)?.label}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-2xl">
                    <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 lg:w-64 lg:h-64" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <a
                      href={qrDataUrl}
                      download={`qr-${selectedTable}.png`}
                      className="flex-1 text-sm text-center text-white bg-gradient-to-r from-green-600 to-green-500 px-4 py-3 rounded-lg hover:from-green-500 hover:to-green-400 font-semibold transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                      📥 הורד QR להדפסה
                    </a>
                  </div>
                  <p className="text-xs text-neutral-400 text-center leading-relaxed">
                    הדפיסו את הקוד והניחו אותו על השולחן.<br />
                    הלקוחות יסרקו את הקוד עם הטלפון ויגיעו ישירות לתפריט.
                  </p>
                </div>
                
                {/* NFC Tag Section */}
                <div className="mt-6 pt-6 border-t border-neutral-800/50">
                  <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/50 rounded-xl px-4 py-3 mb-4">
                    <h3 className="text-sm font-bold text-blue-300 mb-1">
                      📡 תג NFC
                    </h3>
                    <p className="text-xs text-blue-200/80">
                      הגדירו תג NFC לשולחן זה
                    </p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs text-neutral-300 mb-2 font-medium">URL לתג NFC:</p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        id={`nfc-url-${selectedTable}`}
                        value={businessId && selectedTable ? `${window.location.origin}/menu/${businessId}/${selectedTable}/home` : ''}
                        className="flex-1 text-xs bg-neutral-800/80 border border-neutral-700/50 px-4 py-2.5 rounded-lg text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        onClick={async () => {
                          if (!businessId || !selectedTable) return;
                          const url = `${window.location.origin}/menu/${businessId}/${selectedTable}/home`;
                          try {
                            await navigator.clipboard.writeText(url);
                            toast.success('הקישור הועתק ללוח!');
                          } catch (err) {
                            const input = document.getElementById(`nfc-url-${selectedTable}`) as HTMLInputElement;
                            if (input) {
                              input.select();
                              document.execCommand('copy');
                              toast.success('הקישור הועתק ללוח!');
                            } else {
                              toast.error('לא הצלחנו להעתיק את הקישור, נסו ידנית.');
                            }
                          }
                        }}
                        className="text-sm text-white bg-neutral-700/80 px-4 py-2.5 rounded-lg hover:bg-neutral-600 transition-all active:scale-95 font-medium whitespace-nowrap"
                      >
                        📋 העתק
                      </button>
                    </div>
                    <div className="bg-neutral-800/50 border border-neutral-700/30 rounded-lg p-4 space-y-2">
                      <p className="text-xs font-semibold text-neutral-200 mb-2">📋 הוראות הגדרת NFC:</p>
                      <ol className="text-[11px] text-neutral-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                        <li>רכשו תגי NFC (NTAG213 או NTAG215 מומלצים)</li>
                        <li>השתמשו באפליקציית NFC Tools או NFC TagWriter</li>
                        <li>בחרו "כתוב URL" או "Write URL"</li>
                        <li>הדביקו את הקישור למעלה</li>
                        <li>הניחו את הטלפון על התג עד שהכתיבה מסתיימת</li>
                        <li>הדביקו את התג על השולחן</li>
                      </ol>
                      <p className="text-[11px] text-neutral-500 mt-3 pt-3 border-t border-neutral-700/30">
                        💡 <strong>טיפ:</strong> בדקו את התג לפני הדבקה - סרקו אותו עם הטלפון כדי לוודא שהוא פותח את התפריט הנכון.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-800/50">
                  <p className="text-xs text-neutral-300 mb-2 font-medium">קישור ישיר לתפריט:</p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      id={`menu-url-${selectedTable}`}
                      value={businessId && selectedTable ? `${window.location.origin}/menu/${businessId}/${selectedTable}` : ''}
                      className="flex-1 text-xs bg-neutral-800/80 border border-neutral-700/50 px-4 py-2.5 rounded-lg text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={async () => {
                        if (!businessId || !selectedTable) return;
                        const url = `${window.location.origin}/menu/${businessId}/${selectedTable}`;
                        try {
                          await navigator.clipboard.writeText(url);
                          toast.success('הקישור הועתק ללוח!');
                        } catch (err) {
                          // Fallback for older browsers
                          const input = document.getElementById(`menu-url-${selectedTable}`) as HTMLInputElement;
                          if (input) {
                            input.select();
                            document.execCommand('copy');
                            toast.success('הקישור הועתק ללוח!');
                          } else {
                            toast.error('לא הצלחנו להעתיק את הקישור, נסו ידנית.');
                          }
                        }
                      }}
                      className="text-sm text-white bg-neutral-700/80 px-4 py-2.5 rounded-lg hover:bg-neutral-600 transition-all active:scale-95 font-medium whitespace-nowrap"
                    >
                      📋 העתק
                    </button>
                  </div>
                  <a
                    href={`/menu/${businessId}/${selectedTable}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-3 text-sm text-green-400 hover:text-green-300 text-center font-medium transition-colors"
                  >
                    → פתח בתפריט לקוח (חלון חדש)
                  </a>
                </div>
              </div>
            ) : (
              <div className="border border-neutral-800 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                <div className="text-4xl mb-3">📱</div>
                <p className="text-sm text-neutral-400 mb-2">עדיין לא נבחר שולחן</p>
                <p className="text-xs text-neutral-500">
                  לחצו על "צפה ב-QR" ליד אחד השולחנות כדי לראות את קוד ה-QR שלו
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'content' && (
        <section className="space-y-6">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold mb-2">✨ תוכן נוסף - דף נחיתה</h2>
            <p className="text-sm text-neutral-400">
              נהלו את תוכן דף הנחיתה: תמונת רקע לכפתור התפריט, פרטי קשר, מועדון לקוחות וביקורות.
            </p>
          </div>

          {businessId && businessInfo && (
            <CustomContentEditor 
              key={`content-${businessId}`}
              businessId={businessId} 
              initialContent={businessInfo.customContent || null}
              onSave={async (savedContent) => {
                // CRITICAL: Use the saved content from RPC response (source of truth)
                // Don't reload from server - it returns stale data due to read replica lag
                if (savedContent) {
                  // CRITICAL: Save to localStorage so it persists after page refresh
                  // This bypasses read replica lag by using the data we know was saved
                  const localStorageKey = `business_${businessId}_customContent`;
                  try {
                    localStorage.setItem(localStorageKey, JSON.stringify({
                      customContent: savedContent,
                      timestamp: Date.now(),
                    }));
                    console.log('💾 Saved customContent to localStorage:', {
                      key: localStorageKey,
                      phone: savedContent?.contact?.phone,
                      email: savedContent?.contact?.email,
                    });
                  } catch (e) {
                    console.warn('⚠️ Failed to save to localStorage:', e);
                  }
                  
                  setBusinessInfo((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      customContent: savedContent, // Use RPC result - it's the source of truth
                      _lastCustomContentUpdate: Date.now(), // Track when updated via PUT
                    };
                  });
                  console.log('✅ Updated businessInfo with RPC result (source of truth), NOT reloading from server');
                  console.log('✅ Saved content:', {
                    phone: savedContent?.contact?.phone,
                    email: savedContent?.contact?.email,
                    whatsapp: savedContent?.contact?.whatsapp,
                    instagram: savedContent?.contact?.instagram,
                    facebook: savedContent?.contact?.facebook,
                  });
                }
              }}
            />
          )}

          {!businessInfo && (
            <p className="text-xs text-neutral-500">טוען פרטי עסק...</p>
          )}

          {/* Loyalty Club Contacts List */}
          {businessId && businessInfo?.customContent?.loyaltyClub?.enabled && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">📋 רשימת אנשי קשר - מועדון לקוחות</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    כל האנשים שהצטרפו למועדון הלקוחות דרך דף הנחיתה
                  </p>
                </div>
                <button
                  onClick={loadLoyaltyContacts}
                  disabled={loadingContacts}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded text-xs font-medium transition"
                >
                  {loadingContacts ? 'מעדכן...' : '🔄 עדכן'}
                </button>
              </div>

              {loadingContacts ? (
                <div className="text-center py-8">
                  <p className="text-sm text-neutral-400">טוען אנשי קשר...</p>
                </div>
              ) : loyaltyContacts.length === 0 ? (
                <div className="border border-neutral-800 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-sm text-neutral-400">עדיין אין אנשי קשר</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    אנשי קשר יופיעו כאן לאחר שיצטרפו דרך דף הנחיתה
                  </p>
                </div>
              ) : (
                <div className="border border-neutral-800 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-800/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300">שם</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300">טלפון</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300">אימייל</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300">תאריך הצטרפות</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300">עודכן לאחרונה</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {loyaltyContacts.map((contact) => (
                          <tr key={contact.id} className="hover:bg-neutral-800/30 transition">
                            <td className="px-4 py-3 text-sm text-white">{contact.name}</td>
                            <td className="px-4 py-3 text-sm text-white font-mono">{contact.phone}</td>
                            <td className="px-4 py-3 text-sm text-neutral-400">
                              {contact.email || <span className="text-neutral-600">—</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-neutral-400">
                              {new Date(contact.created_at).toLocaleDateString('he-IL', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="px-4 py-3 text-sm text-neutral-400">
                              {contact.updated_at
                                ? new Date(contact.updated_at).toLocaleDateString('he-IL', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : <span className="text-neutral-600">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-neutral-800/30 px-4 py-2 text-xs text-neutral-400">
                    סה"כ: {loyaltyContacts.length} אנשי קשר
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {activeTab === 'settings' && (
        <section className="space-y-6">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold mb-2">⚙️ הגדרות עסק</h2>
            <p className="text-sm text-neutral-400">
              ניהול פרטי העסק, סטטוס המנוי והגדרות התנהגות ה-AI.
            </p>
          </div>

          {/* Subscription Overview + Billing */}
          {businessInfo?.subscription && (
            <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 rounded-2xl p-5 lg:p-6 shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] text-neutral-400 mb-1">סטטוס מנוי</div>
                  <div className="text-sm font-semibold">
                    {businessInfo.subscription.status === 'trial' && 'תקופת ניסיון'}
                    {businessInfo.subscription.status === 'active' && 'מנוי פעיל'}
                    {businessInfo.subscription.status === 'expired' && 'מנוי פג תוקף'}
                    {businessInfo.subscription.status === 'past_due' && 'מנוי בפיגור תשלום'}
                  </div>
                  {businessInfo.subscription.nextBillingDate && (
                    <div className="text-[11px] text-neutral-500 mt-1">
                      חיוב הבא:{' '}
                      {new Date(
                        businessInfo.subscription.nextBillingDate,
                      ).toLocaleDateString('he-IL')}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-neutral-400 mb-1">שולחנות פעילים</div>
                  <div className="text-sm font-semibold">
                    {tables.length} שולחנות
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    כולל כל השולחנות עם QR פעיל
                  </div>
                </div>
              </div>

              {(businessInfo.subscription.status === 'expired' ||
                businessInfo.subscription.status === 'past_due') && (
                <div className="rounded-md border border-yellow-500/40 bg-yellow-950/40 px-3 py-2 text-[11px] text-yellow-100 flex items-start gap-2">
                  <span>⚠️</span>
                  <span>
                    המנוי לא פעיל כרגע. הלקוחות יכולים לראות את התפריט, אבל לא לבצע הזמנות.
                    <br />
                    פנו לסופר־אדמין או לצוות התמיכה כדי להסדיר תשלום ולחדש את המנוי.
                  </span>
                </div>
              )}

              {/* Billing controls removed - no longer based on number of tables */}
            </div>
          )}

          {businessInfo && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!businessId) return;

                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const nameEn = formData.get('nameEn') as string;
                const logoUrl = formData.get('logoUrl') as string;
                const type = formData.get('type') as string;
                const template = formData.get('template') as string;
                const aiInstructions = formData.get('aiInstructions') as string;
                const menuOnlyMessage = formData.get('menuOnlyMessage') as string;
                console.log('📝 Form submitted with menuOnlyMessage:', {
                  menuOnlyMessage,
                  menuOnlyMessageLength: menuOnlyMessage?.length,
                  planType: businessInfo.subscription?.planType,
                  willSend: businessInfo.subscription?.planType === 'menu_only',
                  trimmed: menuOnlyMessage?.trim(),
                });
                const businessHoursStart = formData.get('businessHoursStart') as string;
                const businessHoursEnd = formData.get('businessHoursEnd') as string;
                const businessHoursEnabled = formData.get('businessHoursEnabled') === 'on';

                // Build businessHours object - always send it (even if null) to clear previous value
                let businessHours: { start: string; end: string } | null = null;
                if (businessHoursEnabled && businessHoursStart && businessHoursEnd) {
                  businessHours = {
                    start: businessHoursStart,
                    end: businessHoursEnd,
                  };
                }
                // If businessHoursEnabled is false, businessHours will be null (to clear previous value)

                try {
                  setLoading(true);
                  setError(null);
                  const res = await fetch('/api/business/update', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      businessId,
                      name,
                      nameEn: nameEn?.trim() || undefined,
                      logoUrl: logoUrl || undefined,
                      type,
                      template,
                      aiInstructions: aiInstructions || undefined,
                      businessHours: businessHours, // Always send, even if null
                      menuOnlyMessage: businessInfo.subscription?.planType === 'menu_only'
                        ? (menuOnlyMessage?.trim() || null)
                        : undefined,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    throw new Error(data.message || 'נכשל בעדכון פרטי העסק');
                  }
                  // Update menuOnlyMessage in subscription if it was updated
                  const updatedSubscription = businessInfo.subscription?.planType === 'menu_only' && menuOnlyMessage !== undefined
                    ? {
                        ...businessInfo.subscription,
                        menuOnlyMessage: menuOnlyMessage.trim() || undefined,
                      }
                    : businessInfo.subscription;

                  // Use template from API response if available (source of truth), otherwise use form value
                  const finalTemplate = data.template || template;
                  
                  // Use aiInstructions from API response if available (source of truth), otherwise use form value
                  const finalAiInstructions = data.aiInstructions !== undefined ? data.aiInstructions : (aiInstructions || '');
                  
                  // Use businessHours from API response if available (source of truth), otherwise use form value
                  // CRITICAL: If API returns null but we sent a value, use the value we sent (bypass read replica lag)
                  let finalBusinessHours: { start: string; end: string } | null = null;
                  if (data.businessHours !== undefined) {
                    // API returned a value (even if null), use it
                    finalBusinessHours = data.businessHours;
                  } else if (businessHours !== undefined) {
                    // API didn't return businessHours, use the value we sent
                    finalBusinessHours = businessHours;
                  } else {
                    // No value was sent, use null
                    finalBusinessHours = null;
                  }

                  // Use name, nameEn, and logoUrl from API response if available (source of truth), otherwise use form values
                  // CRITICAL: If API doesn't return these values, use the values we sent (bypass read replica lag)
                  const finalName = data.name !== undefined ? data.name : name;
                  const finalNameEn = data.nameEn !== undefined ? data.nameEn : (nameEn?.trim() || undefined);
                  const finalLogoUrl = data.logoUrl !== undefined ? data.logoUrl : (logoUrl || undefined);

                  setBusinessInfo({ 
                    name: finalName, // Use API response or form value
                    nameEn: finalNameEn, // Use API response or form value
                    logoUrl: finalLogoUrl, // Use API response or form value
                    type, 
                    template: finalTemplate, // Use API response as source of truth
                    aiInstructions: finalAiInstructions, // Use API response as source of truth
                    businessHours: finalBusinessHours, // Use API response as source of truth
                    subscription: updatedSubscription,
                    printerConfig: businessInfo.printerConfig,
                    customContent: businessInfo.customContent,
                  });
                  
                  // CRITICAL: Save template to localStorage to bypass read replica lag
                  if (typeof window !== 'undefined' && finalTemplate) {
                    const localStorageKey = `business_${businessId}_template`;
                    localStorage.setItem(localStorageKey, JSON.stringify({
                      template: finalTemplate,
                      timestamp: Date.now(),
                    }));
                    console.log('💾 Saved template to localStorage:', finalTemplate);
                  }

                  // CRITICAL: Save aiInstructions to localStorage to bypass read replica lag
                  if (typeof window !== 'undefined') {
                    const aiInstructionsKey = `business_${businessId}_aiInstructions`;
                    localStorage.setItem(aiInstructionsKey, JSON.stringify({
                      aiInstructions: finalAiInstructions || '',
                      timestamp: Date.now(),
                    }));
                    console.log('💾 Saved aiInstructions to localStorage:', {
                      hasInstructions: !!finalAiInstructions,
                      length: finalAiInstructions?.length || 0,
                    });
                  }

                  // CRITICAL: Save businessHours to localStorage to bypass read replica lag
                  if (typeof window !== 'undefined') {
                    const businessHoursKey = `business_${businessId}_businessHours`;
                    localStorage.setItem(businessHoursKey, JSON.stringify({
                      businessHours: finalBusinessHours,
                      timestamp: Date.now(),
                    }));
                    console.log('💾 Saved businessHours to localStorage:', {
                      businessHours: finalBusinessHours,
                    });
                  }

                  // CRITICAL: Save name, nameEn, and logoUrl to localStorage to bypass read replica lag
                  if (typeof window !== 'undefined') {
                    const basicInfoKey = `business_${businessId}_basicInfo`;
                    localStorage.setItem(basicInfoKey, JSON.stringify({
                      name: finalName,
                      nameEn: finalNameEn,
                      logoUrl: finalLogoUrl,
                      timestamp: Date.now(),
                    }));
                    console.log('💾 Saved basicInfo to localStorage:', {
                      name: finalName,
                      nameEn: finalNameEn,
                      logoUrl: finalLogoUrl,
                    });
                  }
                  
                  toast.success('פרטי העסק עודכנו בהצלחה!');
                } catch (err: any) {
                  const message = err.message || 'נכשל בעדכון פרטי העסק';
                  setError(message);
                  toast.error(message);
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-5 bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 rounded-2xl p-5 lg:p-6 shadow-xl"
            >
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-200">שם העסק</label>
                <input
                  name="name"
                  defaultValue={businessInfo.name}
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-neutral-200">
                    שם העסק באנגלית <span className="text-neutral-500 text-xs font-normal">(אופציונלי)</span>
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!businessInfo.name) return;
                      try {
                        const res = await fetch('/api/ai/translate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ text: businessInfo.name, target: 'name' }),
                        });
                        const data = await res.json();
                        if (res.ok && data.translated) {
                          const nameEnInput = document.querySelector('input[name="nameEn"]') as HTMLInputElement;
                          if (nameEnInput) {
                            nameEnInput.value = data.translated;
                          }
                          toast.success('תרגום הושלם!');
                        } else {
                          toast.error('נכשל בתרגום');
                        }
                      } catch (err) {
                        toast.error('שגיאה בתרגום');
                      }
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    ✨ תרגם אוטומטית
                  </button>
                </div>
                <input
                  name="nameEn"
                  defaultValue={businessInfo.nameEn || ''}
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="e.g. Gili Restaurant"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-200">
                  לוגו העסק (URL) <span className="text-neutral-500 text-xs font-normal">(אופציונלי)</span>
                </label>
                <input
                  name="logoUrl"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  defaultValue={businessInfo.logoUrl || ''}
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                <p className="text-xs text-neutral-400 mt-1">
                  הזן URL של תמונת הלוגו. אם לא מוזן, יוצג שם העסק בטקסט.
                </p>
                {businessInfo.logoUrl && (
                  <div className="mt-3 p-3 bg-neutral-800/40 rounded-lg">
                    <p className="text-xs text-neutral-300 mb-2 font-medium">תצוגה מקדימה:</p>
                    <img
                      src={businessInfo.logoUrl}
                      alt="Logo preview"
                      className="max-h-24 max-w-full object-contain rounded-lg border border-neutral-700/50"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-200">סוג העסק</label>
                <select
                  name="type"
                  defaultValue={businessInfo.type}
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  required
                >
                  <option value="bar">בר</option>
                  <option value="pizza">פיצריה</option>
                  <option value="sushi">מסעדת סושי</option>
                  <option value="generic">מסעדה</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-200">תבנית עיצוב</label>
                <select
                  name="template"
                  defaultValue={businessInfo.template}
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  required
                >
                  <optgroup label="בר">
                    <option value="bar-modern">בר - מגניב (עם אנימציות)</option>
                    <option value="bar-mid">בר - בינוני</option>
                    <option value="bar-classic">בר - קלאסי</option>
                  </optgroup>
                  <optgroup label="פיצה">
                    <option value="pizza-modern">פיצה - מגניב (עם אנימציות)</option>
                    <option value="pizza-mid">פיצה - בינוני</option>
                    <option value="pizza-classic">פיצה - קלאסי</option>
                  </optgroup>
                  <optgroup label="אחר">
                    <option value="sushi">סושי</option>
                    <option value="gold">קלאסי על גוון זהב</option>
                    <option value="generic">כללי</option>
                  </optgroup>
                </select>
              </div>


              <div className="space-y-3 p-4 bg-blue-900/10 border border-blue-700/20 rounded-xl">
                <label className="block text-sm font-medium text-neutral-200">
                  💼 שעות פעילות למנות עסקיות
                </label>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  הגדירו שעות פעילות למנות עסקיות. מחוץ לשעות האלו, לקוחות לא יוכלו להזמין מנות עסקיות.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="businessHoursEnabled"
                      defaultChecked={businessInfo.businessHours !== null && businessInfo.businessHours !== undefined}
                      className="w-5 h-5 rounded border-2 border-neutral-600 bg-neutral-800/80 text-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
                    />
                    <span className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">הפעל הגבלת שעות</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-neutral-300">שעת התחלה</label>
                    <input
                      type="time"
                      name="businessHoursStart"
                      defaultValue={businessInfo.businessHours?.start || '10:00'}
                      className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-neutral-300">שעת סיום</label>
                    <input
                      type="time"
                      name="businessHoursEnd"
                      defaultValue={businessInfo.businessHours?.end || '18:00'}
                      className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  דוגמה: 10:00-18:00 - מנות עסקיות זמינות רק בשעות האלו
                </p>
              </div>

              {businessInfo.subscription?.planType === 'menu_only' && (
                <div className="space-y-2 p-4 bg-neutral-800/30 border border-neutral-700/30 rounded-xl">
                  <label className="block text-sm font-medium text-neutral-200">
                    📋 הודעה מותאמת אישית לתפריט דיגיטלי
                  </label>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                    הודעה שתוצג ללקוחות בתפריט הדיגיטלי. השאירו ריק כדי לא להציג הודעה.
                  </p>
                  <textarea
                    name="menuOnlyMessage"
                    defaultValue={businessInfo.subscription?.menuOnlyMessage || ''}
                    rows={4}
                    className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-y"
                    placeholder="לדוגמה:&#10;ברוכים הבאים לתפריט הדיגיטלי שלנו!&#10;להזמנות, אנא צרו קשר בטלפון: 03-1234567&#10;או הגיעו אלינו ישירות."
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-200">
                  🤖 הוראות מותאמות אישית ל-AI
                </label>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  הגדירו הוראות ספציפיות ל-AI כדי לענות על שאלות נפוצות של לקוחות.
                  <br />
                  דוגמאות: "בסושי - מנות X, Y חייבות להיות אפויות, לא נא", "אין אפשרות להסיר גבינה מפיצה מרגריטה"
                </p>
                <textarea
                  name="aiInstructions"
                  defaultValue={businessInfo.aiInstructions || ''}
                  rows={8}
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-y"
                  placeholder="לדוגמה:&#10;בסושי - המנות 'סלמון אפוי' ו'טונה אפויה' חייבות להיות אפויות, לא נא.&#10;אין אפשרות להסיר גבינה מפיצה מרגריטה.&#10;כל המנות ללא גלוטן מסומנות בתפריט."
                />
              </div>

              <div className="pt-4 border-t border-neutral-800/50">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 text-sm font-semibold disabled:opacity-60 hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  {loading ? '⏳ שומר...' : '💾 שמור שינויים'}
                </button>
              </div>
            </form>
          )}

          {!businessInfo && (
            <p className="text-xs text-neutral-500">טוען פרטי עסק...</p>
          )}
        </section>
      )}

      {activeTab === 'printer' && (
        <section className="space-y-6">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold mb-2">🖨️ הגדרות מדפסת / BON</h2>
            <p className="text-sm text-neutral-400">
              הגדירו את המדפסת או מערכת ה-BON שלכם כדי לקבל הזמנות אוטומטית.
            </p>
          </div>

          {businessInfo && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!businessId) return;

                const formData = new FormData(e.currentTarget);
                const enabled = formData.get('enabled') === 'on';
                const type = formData.get('type') as string;
                const endpoint = formData.get('endpoint') as string;
                const payloadType = formData.get('payloadType') as string;
                const port = formData.get('port') ? Number(formData.get('port')) : undefined;

                try {
                  setLoading(true);
                  setError(null);
                  const res = await fetch('/api/business/printer-config', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      businessId,
                      printerConfig: {
                        enabled,
                        type,
                        endpoint,
                        payloadType,
                        port,
                      },
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    throw new Error(data.message || 'נכשל בעדכון הגדרות המדפסת');
                  }
                  
                  // Use the printerConfig returned from the API (source of truth)
                  const savedPrinterConfig = data.printerConfig || {
                      enabled,
                      type,
                      endpoint,
                      payloadType,
                      port,
                  };
                  
                  setBusinessInfo({
                    ...businessInfo,
                    printerConfig: savedPrinterConfig,
                  });
                  
                  // CRITICAL: Save to localStorage to bypass read replica lag
                  // This ensures we use the data we know was saved, not stale read replica data
                  if (typeof window !== 'undefined') {
                    const localStorageKey = `business_${businessId}_printerConfig`;
                    localStorage.setItem(localStorageKey, JSON.stringify({
                      printerConfig: savedPrinterConfig,
                      timestamp: Date.now(),
                    }));
                    console.log('💾 Saved printerConfig to localStorage:', savedPrinterConfig);
                  }
                  
                  toast.success('הגדרות המדפסת עודכנו בהצלחה!');
                } catch (err: any) {
                  const message = err.message || 'נכשל בעדכון הגדרות המדפסת';
                  setError(message);
                  toast.error(message);
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-5 bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 rounded-2xl p-5 lg:p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 p-4 bg-neutral-800/40 rounded-lg">
                <input
                  type="checkbox"
                  name="enabled"
                  id="printer-enabled"
                  defaultChecked={businessInfo.printerConfig?.enabled || false}
                  className="w-5 h-5 rounded border-2 border-neutral-600 bg-neutral-800/80 text-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
                />
                <label htmlFor="printer-enabled" className="text-sm font-medium text-neutral-200 cursor-pointer">
                  הפעל שליחה אוטומטית למדפסת
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-200">סוג חיבור</label>
                <select
                  name="type"
                  defaultValue={businessInfo.printerConfig?.type || 'http'}
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  required
                >
                  <option value="http">HTTP/HTTPS (REST API)</option>
                  <option value="tcp">TCP/IP</option>
                  <option value="serial">Serial Port</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-200">
                  כתובת IP / URL <span className="text-neutral-500 text-xs font-normal">(למשל: 192.168.1.100 או https://printer.example.com)</span>
                </label>
                <input
                  name="endpoint"
                  type="text"
                  defaultValue={businessInfo.printerConfig?.endpoint || ''}
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="192.168.1.100"
                />
              </div>

              {businessInfo.printerConfig?.type === 'tcp' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-200">פורט</label>
                  <input
                    name="port"
                    type="number"
                    defaultValue={businessInfo.printerConfig?.port || 9100}
                    className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="9100"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-200">סוג Payload</label>
                <select
                  name="payloadType"
                  defaultValue={businessInfo.printerConfig?.payloadType || 'json'}
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  required
                >
                  <option value="json">JSON</option>
                  <option value="text">Plain Text</option>
                  <option value="xml">XML</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-800/50">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 text-sm font-semibold disabled:opacity-60 hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  {loading ? '⏳ שומר...' : '💾 שמור הגדרות'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    console.log('🔍 Testing printer - current state:', {
                      businessId,
                      hasPrinterConfig: !!businessInfo?.printerConfig,
                      enabled: businessInfo?.printerConfig?.enabled,
                      endpoint: businessInfo?.printerConfig?.endpoint,
                      type: businessInfo?.printerConfig?.type,
                      payloadType: businessInfo?.printerConfig?.payloadType,
                    });
                    
                    if (!businessId) {
                      toast.error('שגיאה: לא נמצא מזהה עסק');
                      return;
                    }
                    if (!businessInfo?.printerConfig?.endpoint || businessInfo.printerConfig.endpoint.trim() === '') {
                      toast.error('אנא הגדירו כתובת IP/URL תחילה');
                      return;
                    }
                    if (!businessInfo?.printerConfig?.enabled) {
                      toast.error('אנא הפעילו את המדפסת ושמרו את ההגדרות תחילה');
                      return;
                    }
                    try {
                      setLoading(true);
                      // Send printerConfig from state to bypass read replica lag
                      const res = await fetch('/api/printer/test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          businessId,
                          printerConfig: businessInfo.printerConfig, // Send from state to bypass read replica lag
                          testOrder: {
                            orderId: 'test-' + Date.now(),
                            tableId: 'test-table',
                            items: [{ name: 'פריט בדיקה', quantity: 1, price: 10 }],
                            totalAmount: 10,
                          },
                        }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        toast.success('✅ בדיקת מדפסת הצליחה!');
                      } else {
                        toast.error(`❌ שגיאה: ${data.message}`);
                      }
                    } catch (err: any) {
                      toast.error(`❌ שגיאה: ${err.message}`);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || !businessInfo?.printerConfig?.endpoint || businessInfo?.printerConfig?.endpoint?.trim() === ''}
                  className="flex-1 sm:flex-initial rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:from-green-500 hover:to-green-400 transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  {loading ? '⏳ בודק...' : '🔍 בדוק חיבור למדפסת'}
                </button>
              </div>
            </form>
          )}

          {!businessInfo && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3 opacity-30">🖨️</div>
              <p className="text-sm text-neutral-400 font-medium">טוען הגדרות מדפסת...</p>
            </div>
          )}
        </section>
      )}

      {activeTab === 'pos' && (
        <section className="space-y-6">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold mb-2">💳 אינטגרציית POS (קופה)</h2>
            <p className="text-sm text-neutral-400">
              הגדירו את ה-API של מערכת הקופה שלכם כדי לקבל הזמנות אוטומטית.
            </p>
          </div>

          {businessInfo && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const enabled = formData.get('enabled') === 'on';
                const provider = (formData.get('provider') as string) || 'generic';
                const endpoint = (formData.get('endpoint') as string) || '';
                const timeoutMs = parseInt((formData.get('timeoutMs') as string) || '5000', 10);

                // Collect headers from dynamic rows
                const headers: Record<string, string> = {};
                const headerRows = e.currentTarget.querySelectorAll('[data-header-row]');
                headerRows.forEach((row) => {
                  const keyInput = row.querySelector('[data-header-key]') as HTMLInputElement;
                  const valueInput = row.querySelector('[data-header-value]') as HTMLInputElement;
                  if (keyInput?.value && valueInput?.value) {
                    headers[keyInput.value] = valueInput.value;
                  }
                });

                try {
                  setLoading(true);
                  setError(null);
                  const res = await fetch('/api/business/pos-config', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      posConfig: {
                        enabled,
                        provider,
                        endpoint,
                        method: 'POST',
                        headers,
                        timeoutMs,
                      },
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    throw new Error(data.message || 'נכשל בעדכון הגדרות POS');
                  }
                  setBusinessInfo({
                    ...businessInfo,
                    posConfig: {
                      enabled,
                      provider,
                      endpoint,
                      method: 'POST',
                      headers,
                      timeoutMs,
                    },
                  });
                  toast.success('הגדרות POS עודכנו בהצלחה!');
                } catch (err: any) {
                  const message = err.message || 'נכשל בעדכון הגדרות POS';
                  setError(message);
                  toast.error(message);
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-5 bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 rounded-2xl p-5 lg:p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 p-4 bg-neutral-800/40 rounded-lg">
                <input
                  type="checkbox"
                  name="enabled"
                  id="pos-enabled"
                  defaultChecked={businessInfo.posConfig?.enabled || false}
                  className="w-5 h-5 rounded border-2 border-neutral-600 bg-neutral-800/80 text-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
                />
                <label htmlFor="pos-enabled" className="text-sm font-medium text-neutral-200 cursor-pointer">
                  הפעל שליחה אוטומטית ל-POS
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-200">
                  ספק POS <span className="text-neutral-500 text-xs font-normal">(בחר את מערכת הקופה שלך)</span>
                </label>
                <select
                  name="provider"
                  defaultValue={businessInfo.posConfig?.provider || 'generic'}
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                >
                  <option value="generic">Generic HTTP (ברירת מחדל)</option>
                  <option value="casbit">Caspit</option>
                  <option value="resto">Resto</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-200">
                  כתובת API (Endpoint URL) <span className="text-neutral-500 text-xs font-normal">(למשל: https://pos.example.com/api/orders)</span>
                </label>
                <input
                  name="endpoint"
                  type="text"
                  defaultValue={businessInfo.posConfig?.endpoint || ''}
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="https://pos.example.com/api/orders"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-neutral-200">Headers (כותרות HTTP)</label>
                <div id="headers-container" className="space-y-3">
                  {Object.entries(businessInfo.posConfig?.headers || {}).map(([key, value], index) => (
                    <div key={index} data-header-row className="flex flex-col gap-2 relative">
                      <div className="flex gap-2">
                        <input
                          data-header-key
                          type="text"
                          defaultValue={key}
                          placeholder="Key (למשל: Authorization)"
                          className="flex-1 rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            (e.currentTarget.closest('[data-header-row]') as HTMLElement)?.remove();
                          }}
                          className="px-4 py-3 bg-red-600/80 text-white rounded-lg hover:bg-red-600 transition-all active:scale-95 font-medium"
                        >
                          ×
                        </button>
                      </div>
                      <input
                        data-header-value
                        type="text"
                        defaultValue={value}
                        placeholder="Value"
                        className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  ))}
                  {(!businessInfo.posConfig?.headers || Object.keys(businessInfo.posConfig.headers).length === 0) && (
                    <div data-header-row className="flex flex-col gap-2 relative">
                      <div className="flex gap-2">
                        <input
                          data-header-key
                          type="text"
                          placeholder="Key (למשל: Authorization)"
                          className="flex-1 rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            (e.currentTarget.closest('[data-header-row]') as HTMLElement)?.remove();
                          }}
                          className="px-4 py-3 bg-red-600/80 text-white rounded-lg hover:bg-red-600 transition-all active:scale-95 font-medium"
                        >
                          ×
                        </button>
                      </div>
                      <input
                        data-header-value
                        type="text"
                        placeholder="Value"
                        className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    const container = document.getElementById('headers-container');
                    if (container) {
                      const newRow = document.createElement('div');
                      newRow.setAttribute('data-header-row', '');
                      newRow.className = 'flex flex-col gap-2 relative';
                      newRow.innerHTML = `
                        <div class="flex gap-2">
                          <input data-header-key type="text" placeholder="Key (למשל: Authorization)" class="flex-1 rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" />
                          <button type="button" class="px-4 py-3 bg-red-600/80 text-white rounded-lg hover:bg-red-600 transition-all active:scale-95 font-medium" onclick="this.closest('[data-header-row]').remove()">×</button>
                        </div>
                        <input data-header-value type="text" placeholder="Value" class="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" />
                      `;
                      container.appendChild(newRow);
                    }
                  }}
                  className="mt-2 px-4 py-2 text-sm bg-neutral-700/80 text-neutral-200 rounded-lg hover:bg-neutral-600 transition-all active:scale-95 font-medium"
                >
                  ➕ הוסף Header
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-200">
                  Timeout (מילישניות) <span className="text-neutral-500 text-xs font-normal">(100-60000)</span>
                </label>
                <input
                  name="timeoutMs"
                  type="number"
                  min="100"
                  max="60000"
                  defaultValue={businessInfo.posConfig?.timeoutMs || 5000}
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-800/50">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 text-sm font-semibold disabled:opacity-60 hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  {loading ? '⏳ שומר...' : '💾 שמור הגדרות'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!businessId || !businessInfo?.posConfig?.endpoint) {
                      toast.error('אנא הגדירו כתובת API תחילה');
                      return;
                    }
                    try {
                      setLoading(true);
                      const res = await fetch('/api/pos/test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          businessId,
                        }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        toast.success('✅ בדיקת חיבור ל-POS הצליחה!');
                      } else {
                        toast.error(`❌ שגיאה: ${data.message}`);
                      }
                    } catch (err: any) {
                      toast.error(`❌ שגיאה: ${err.message}`);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || !businessInfo?.posConfig?.endpoint}
                  className="flex-1 sm:flex-initial rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 text-sm font-semibold disabled:opacity-60 hover:from-green-500 hover:to-green-400 transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  🔍 בדוק חיבור ל-POS
                </button>
              </div>
            </form>
          )}

          {!businessInfo && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3 opacity-30">💳</div>
              <p className="text-sm text-neutral-400 font-medium">טוען הגדרות POS...</p>
            </div>
          )}
        </section>
      )}

      {activeTab === 'orders' && (
        <section className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold mb-2">📊 הזמנות ורווחים</h2>
              <p className="text-sm text-neutral-400">
                צפו בכל ההזמנות, סטטוסים וסיכומי הכנסות.
              </p>
            </div>
            {revenueStats && (
              <div className="flex gap-3">
                <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-500/30 rounded-xl px-4 py-3 backdrop-blur-sm">
                  <div className="text-xs text-green-300/80 mb-1">היום</div>
                  <div className="text-lg font-bold text-white">₪{revenueStats.today.toFixed(2)}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-500/30 rounded-xl px-4 py-3 backdrop-blur-sm">
                  <div className="text-xs text-blue-300/80 mb-1">השבוע</div>
                  <div className="text-lg font-bold text-white">₪{revenueStats.week.toFixed(2)}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-xl px-4 py-3 backdrop-blur-sm">
                  <div className="text-xs text-purple-300/80 mb-1">החודש</div>
                  <div className="text-lg font-bold text-white">₪{revenueStats.month.toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Scan Statistics Section */}
          {scanStats && (
            <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-gradient-to-r from-neutral-800/50 to-neutral-800/30 px-5 py-4 border-b border-neutral-800/50">
                <h3 className="text-base font-bold text-white">📱 סטטיסטיקות סריקות QR/NFC</h3>
                <p className="text-xs text-neutral-400 mt-1">מעקב אחרי סריקות קוד QR ותגי NFC</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-500/30 rounded-xl px-4 py-3 backdrop-blur-sm">
                    <div className="text-xs text-blue-300/80 mb-1">סה"כ סריקות</div>
                    <div className="text-2xl font-bold text-white">{scanStats.totalScans}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-500/30 rounded-xl px-4 py-3 backdrop-blur-sm">
                    <div className="text-xs text-green-300/80 mb-1">אחרונות 24 שעות</div>
                    <div className="text-2xl font-bold text-white">{scanStats.scansLast24h}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-xl px-4 py-3 backdrop-blur-sm">
                    <div className="text-xs text-purple-300/80 mb-1">אחרונות 7 ימים</div>
                    <div className="text-2xl font-bold text-white">{scanStats.scansLast7d}</div>
                  </div>
                </div>

                {/* Scans by Source */}
                {Object.keys(scanStats.scansBySource).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-neutral-300 mb-3">סריקות לפי מקור</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(scanStats.scansBySource).map(([source, count]) => (
                        <div
                          key={source}
                          className="bg-neutral-800/60 border border-neutral-700/30 rounded-lg px-3 py-2"
                        >
                          <span className="text-xs text-neutral-400">
                            {source === 'qr' ? 'QR' : source === 'nfc' ? 'NFC' : source === 'direct_link' ? 'קישור ישיר' : source}:
                          </span>
                          <span className="text-sm font-bold text-white ml-2">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scans by Table */}
                {Object.keys(scanStats.scansByTable).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-neutral-300 mb-3">סריקות לפי שולחן</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(scanStats.scansByTable)
                        .sort(([, a], [, b]) => b - a)
                        .map(([tableId, count]) => (
                          <div
                            key={tableId}
                            className="bg-neutral-800/60 border border-neutral-700/30 rounded-lg px-3 py-2"
                          >
                            <div className="text-xs text-neutral-400">שולחן {tableId}</div>
                            <div className="text-sm font-bold text-white">{count} סריקות</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Statistics Section */}
          {scanStats && (
            <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-gradient-to-r from-neutral-800/50 to-neutral-800/30 px-5 py-4 border-b border-neutral-800/50">
                <h3 className="text-base font-bold text-white">💬 סטטיסטיקות צ'אט AI</h3>
                <p className="text-xs text-neutral-400 mt-1">מעקב אחרי כניסות לצ'אט והזמנות דרך הצ'אט</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-neutral-300">כניסות לצ'אט</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl px-3 py-2 backdrop-blur-sm">
                        <div className="text-xs text-indigo-300/80 mb-1">סה"כ</div>
                        <div className="text-xl font-bold text-white">{scanStats.totalChatEntries}</div>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl px-3 py-2 backdrop-blur-sm">
                        <div className="text-xs text-indigo-300/80 mb-1">24 שעות</div>
                        <div className="text-xl font-bold text-white">{scanStats.chatEntriesLast24h}</div>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl px-3 py-2 backdrop-blur-sm">
                        <div className="text-xs text-indigo-300/80 mb-1">7 ימים</div>
                        <div className="text-xl font-bold text-white">{scanStats.chatEntriesLast7d}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-neutral-300">הזמנות דרך הצ'אט</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 rounded-xl px-3 py-2 backdrop-blur-sm">
                        <div className="text-xs text-emerald-300/80 mb-1">סה"כ</div>
                        <div className="text-xl font-bold text-white">{scanStats.totalChatOrders}</div>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 rounded-xl px-3 py-2 backdrop-blur-sm">
                        <div className="text-xs text-emerald-300/80 mb-1">24 שעות</div>
                        <div className="text-xl font-bold text-white">{scanStats.chatOrdersLast24h}</div>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 rounded-xl px-3 py-2 backdrop-blur-sm">
                        <div className="text-xs text-emerald-300/80 mb-1">7 ימים</div>
                        <div className="text-xl font-bold text-white">{scanStats.chatOrdersLast7d}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conversion Rate */}
                {scanStats.totalChatEntries > 0 && (
                  <div className="mt-4 pt-4 border-t border-neutral-800/50">
                    <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 border border-amber-500/30 rounded-xl px-4 py-3 backdrop-blur-sm">
                      <div className="text-xs text-amber-300/80 mb-1">שיעור המרה (הזמנות מתוך כניסות)</div>
                      <div className="text-2xl font-bold text-white">
                        {((scanStats.totalChatOrders / scanStats.totalChatEntries) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-amber-200/60 mt-1">
                        {scanStats.totalChatOrders} מתוך {scanStats.totalChatEntries} כניסות
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-neutral-800/50 to-neutral-800/30 px-5 py-4 border-b border-neutral-800/50">
              <h3 className="text-base font-bold text-white">📋 רשימת הזמנות</h3>
              <p className="text-xs text-neutral-400 mt-1">{orders.length} הזמנות</p>
            </div>
            <div className="hidden lg:grid lg:grid-cols-5 gap-4 px-5 py-3 text-xs font-semibold text-neutral-300 border-b border-neutral-800/50">
              <div>תאריך ושעה</div>
              <div>שולחן</div>
              <div>פריטים</div>
              <div>סכום</div>
              <div>סטטוס</div>
            </div>
            <div className="divide-y divide-neutral-800/30">
              {orders.length === 0 && (
                <div className="px-5 py-12 text-center">
                  <div className="text-4xl mb-3 opacity-30">📦</div>
                  <p className="text-sm text-neutral-400 font-medium">
                    עדיין אין הזמנות. הזמנות יופיעו כאן כשהלקוחות יזמינו דרך התפריט.
                  </p>
                </div>
              )}
              {orders.map((order) => (
                <div
                  key={order.orderId}
                  className="px-4 lg:px-5 py-4 hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="lg:grid lg:grid-cols-5 gap-4 items-center">
                    <div className="mb-2 lg:mb-0">
                      <div className="text-xs text-neutral-400 lg:hidden mb-1">תאריך ושעה</div>
                      <div className="text-sm text-neutral-300">
                        {new Date(order.createdAt).toLocaleString('he-IL')}
                      </div>
                    </div>
                    <div className="mb-2 lg:mb-0">
                      <div className="text-xs text-neutral-400 lg:hidden mb-1">שולחן</div>
                      <div className="text-sm font-medium text-white">{order.tableId}</div>
                    </div>
                    <div className="mb-2 lg:mb-0">
                      <div className="text-xs text-neutral-400 lg:hidden mb-1">פריטים</div>
                      <div className="text-sm text-neutral-300">
                        {order.items?.length || 0} פריט{order.items?.length !== 1 ? 'ים' : ''}
                      </div>
                    </div>
                    <div className="mb-2 lg:mb-0">
                      <div className="text-xs text-neutral-400 lg:hidden mb-1">סכום</div>
                      <div className="text-base font-bold text-white">₪{order.totalAmount?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-400 lg:hidden mb-1">סטטוס</div>
                      <span
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                          order.status === 'printed'
                            ? 'bg-green-900/40 text-green-300 border border-green-700/30'
                            : order.status === 'printer_error'
                            ? 'bg-red-900/40 text-red-300 border border-red-700/30'
                            : order.status === 'sent_to_printer'
                            ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/30'
                            : 'bg-neutral-800/60 text-neutral-300 border border-neutral-700/30'
                        }`}
                      >
                        {order.status === 'received'
                          ? 'התקבלה'
                          : order.status === 'sent_to_printer'
                          ? 'נשלחה למדפסת'
                          : order.status === 'printed'
                          ? 'הודפסה'
                          : 'שגיאת מדפסת'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      </div>
    </main>
  );
}

// BillingControls component removed - no longer based on number of tables

