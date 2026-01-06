'use client';

import React from 'react';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/components/CartContext';
import { SessionProvider, useSession } from '@/components/SessionContext';
import toast from 'react-hot-toast';
import ThemeWrapper from '../../../../components/themes/ThemeWrapper';

interface MenuItem {
  businessId: string;
  category: string;
  categoryEn?: string;
  name: string;
  nameEn?: string;
  price: number;
  imageUrl?: string;
  ingredients?: string[];
  ingredientsEn?: string[];
  allergens?: string[];
  allergensEn?: string[];
  isFeatured?: boolean;
  isPregnancySafe?: boolean;
  isBusiness?: boolean;
}

function CustomerMenuPageContent({
  businessId,
  tableId,
}: {
  businessId: string;
  tableId: string;
}) {
  const { items, addItem } = useCart();
  const { session, markCartUpdated, updateSession, isSessionValid } = useSession();
  const [sessionExpired, setSessionExpired] = useState(false);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all'); // For scroll-based highlighting only
  const [businessInfo, setBusinessInfo] = useState<{
    name: string;
    nameEn?: string; // Optional English translation
    logoUrl?: string;
    template: 'bar-modern' | 'bar-classic' | 'bar-mid' | 'pizza-modern' | 'pizza-classic' | 'pizza-mid' | 'sushi' | 'generic' | 'gold';
    subscriptionStatus?: string;
    planType?: 'full' | 'menu_only';
    menuOnlyMessage?: string; // Custom message for menu-only plan
    businessHours?: {
      start: string;
      end: string;
    } | null;
    customContent?: {
      events?: {
        enabled: boolean;
        title: string;
        titleEn?: string;
        description: string;
        descriptionEn?: string;
        formFields?: Array<{
          name: string;
          label: string;
          labelEn?: string;
          type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
          required: boolean;
          options?: string[];
        }>;
      };
      contact?: {
        enabled: boolean;
        title: string;
        titleEn?: string;
        description: string;
        descriptionEn?: string;
        phone?: string;
        email?: string;
        whatsapp?: string;
        instagram?: string;
        facebook?: string;
      };
      loyaltyClub?: {
        enabled: boolean;
        title: string;
        titleEn?: string;
        description: string;
        descriptionEn?: string;
        benefits?: Array<{
          text: string;
          textEn?: string;
        }>;
      };
      reviews?: {
        enabled: boolean;
        title: string;
        titleEn?: string;
        description: string;
        descriptionEn?: string;
      };
      delivery?: {
        enabled: boolean;
        title: string;
        titleEn?: string;
        description: string;
        descriptionEn?: string;
        link?: string;
      };
    };
  } | null>(null);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [businessDisabled, setBusinessDisabled] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [expandedItem, setExpandedItem] = useState<MenuItem | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [currentServerTime, setCurrentServerTime] = useState<string | null>(null); // Format: "HH:MM"
  const [upsellSuggestion, setUpsellSuggestion] = useState<{
    name: string;
    price: number;
    category: string;
    imageUrl?: string;
  } | null>(null);
  const [hasNewChatMessage, setHasNewChatMessage] = useState(false);
  const [language, setLanguage] = useState<'he' | 'en'>('he');
  const [categoryTranslations, setCategoryTranslations] = useState<Record<string, string>>({});
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);

  async function translateCategory(category: string): Promise<string> {
    if (language === 'he') return category;
  
    if (categoryTranslations[category]) {
      return categoryTranslations[category];
    }
  
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: category,
          target: 'category',
        }),
      });
  
      if (!res.ok) throw new Error('translate failed');
  
      const data = await res.json();
      const translated = data.translated || category;
  
      setCategoryTranslations((prev) => ({
        ...prev,
        [category]: translated,
      }));
  
      return translated;
    } catch {
      return category;
    }
  }
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Check session validity on page load and periodically
  useEffect(() => {
    if (!session) return;
    
    // Check immediately
    if (isSessionValid && !isSessionValid()) {
      setSessionExpired(true);
      toast.error('הקישור פג תוקף. אנא סרוק את קוד ה-QR מחדש כדי להזמין.');
      return;
    }
    
    // Check every 10 seconds to catch expiration
    const interval = setInterval(() => {
      if (isSessionValid && !isSessionValid()) {
        setSessionExpired(true);
        toast.error('הקישור פג תוקף. אנא סרוק את קוד ה-QR מחדש כדי להזמין.');
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [session, isSessionValid]);

  useEffect(() => {
    async function loadData(showLoading = true) {
      try {
        if (showLoading) {
          setLoading(true);
        }
        setError(null);

        // Load business info (for theme) - with cache busting to get fresh data
        const infoRes = await fetch(
          `/api/menu/info?businessId=${encodeURIComponent(businessId)}&_t=${Date.now()}`,
          { cache: 'no-store' }
        );
        const infoData = await infoRes.json();

        console.log('📋 Menu info loaded:', {
          planType: infoData.planType,
          menuOnlyMessage: infoData.menuOnlyMessage,
          hasMessage: !!infoData.menuOnlyMessage,
        });

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

        // CRITICAL: Use cached template if it's newer than 5 minutes old
        // This ensures we use the data we know was saved, not stale read replica data
        let finalTemplate = (infoData.template || 'generic') as 'bar-modern' | 'bar-classic' | 'bar-mid' | 'pizza-modern' | 'pizza-classic' | 'pizza-mid' | 'sushi' | 'generic' | 'gold';
        if (cachedTemplate && cachedTemplateTimestamp > Date.now() - 5 * 60 * 1000) {
          // Cached data is recent (less than 5 minutes old), use it instead of API data
          finalTemplate = cachedTemplate as any;
          console.log('✅ Using cached template from localStorage (source of truth):', {
            template: finalTemplate,
            cachedAge: Date.now() - cachedTemplateTimestamp,
          });
        }

        const newBusinessInfo = {
          name: infoData.name || 'העסק',
          nameEn: infoData.nameEn || undefined, // Optional English translation
          logoUrl: infoData.logoUrl,
          template: finalTemplate, // Use cached or API data
          subscriptionStatus: infoData.subscriptionStatus || 'active',
          planType: (infoData.planType || 'full') as 'full' | 'menu_only',
          menuOnlyMessage: infoData.menuOnlyMessage || null,
          businessHours: infoData.businessHours || null,
          customContent: infoData.customContent || null,
        };
        
        console.log('📋 Setting businessInfo state:', {
          planType: newBusinessInfo.planType,
          menuOnlyMessage: newBusinessInfo.menuOnlyMessage,
          menuOnlyMessageType: typeof newBusinessInfo.menuOnlyMessage,
          menuOnlyMessageLength: newBusinessInfo.menuOnlyMessage?.length,
          hasMessage: !!newBusinessInfo.menuOnlyMessage,
        });

        if (infoRes.status === 403) {
          if (infoData.subscriptionStatus === 'disabled') {
            setBusinessDisabled(true);
            setBusinessInfo(newBusinessInfo);
          } else if (infoData.subscriptionStatus === 'expired') {
            setSubscriptionExpired(true);
            setBusinessInfo(newBusinessInfo);
          }
        } else if (infoRes.ok) {
          // Only update if values actually changed to prevent infinite re-renders
          setBusinessInfo((prev) => {
            if (!prev) return newBusinessInfo;
            
            // Deep comparison to check if anything actually changed
            const nameChanged = prev.name !== newBusinessInfo.name;
            const logoChanged = prev.logoUrl !== newBusinessInfo.logoUrl;
            const templateChanged = prev.template !== newBusinessInfo.template;
            const statusChanged = prev.subscriptionStatus !== newBusinessInfo.subscriptionStatus;
            const planTypeChanged = prev.planType !== newBusinessInfo.planType;
            const messageChanged = prev.menuOnlyMessage !== newBusinessInfo.menuOnlyMessage;
            const hoursChanged = JSON.stringify(prev.businessHours) !== JSON.stringify(newBusinessInfo.businessHours);
            const contentChanged = JSON.stringify(prev.customContent) !== JSON.stringify(newBusinessInfo.customContent);
            
            // If nothing changed, return previous to prevent re-render
            if (!nameChanged && !logoChanged && !templateChanged && 
                !statusChanged && !planTypeChanged && !messageChanged && !hoursChanged && !contentChanged) {
              return prev;
            }
            
            return newBusinessInfo;
          });
        }

        // Load menu items - with cache busting (only on initial load)
        if (showLoading) {
          const menuRes = await fetch(
            `/api/menu?businessId=${encodeURIComponent(businessId)}&_t=${Date.now()}`,
            { cache: 'no-store' }
          );
          const menuData = await menuRes.json();
          if (!menuRes.ok) {
            throw new Error(menuData.message || 'טעינה נכשלה');
          }
          // Filter out hidden items (isHidden = true) from customer menu
          const visibleItems = (menuData.items ?? []).filter((item: any) => !item.isHidden);
          setMenuItems(visibleItems);
        }
      } catch (err: any) {
        setError(err.message || 'שגיאה בטעינת התפריט');
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    }

    loadData(true);
    
    // No polling - only load once per businessId to prevent infinite re-renders
  }, [businessId]);

  // Load saved language preference from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('menu_language');
    if (saved === 'he' || saved === 'en') {
      setLanguage(saved);
    }
  }, []);

  const switchLanguage = (lang: 'he' | 'en') => {
    setLanguage(lang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('menu_language', lang);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach((item) => set.add(item.category));
    // Add "מנות עסקיות" category if there are any business items
    const hasBusinessItems = menuItems.some(item => item.isBusiness);
    if (hasBusinessItems) {
      set.add('business');
    }
    return Array.from(set);
  }, [menuItems]);

  const featuredItems = useMemo(() => {
    // Only show items marked as featured
    const featured = menuItems.filter((item) => item.isFeatured === true);
    // If no featured items, show first 5 items as fallback
    return featured.length > 0 ? featured : menuItems.slice(0, Math.min(5, menuItems.length));
  }, [menuItems]);

  // Auto-rotate featured items
  useEffect(() => {
    if (featuredItems.length === 0) return;
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [featuredItems.length]);

  // Check for new chat messages
  useEffect(() => {
    function checkNewMessages() {
      if (typeof window === 'undefined') return;
      
      const storageKey = `chat_messages_${businessId}_${tableId}`;
      const lastReadKey = `chat_last_read_${businessId}_${tableId}`;
      
      const stored = localStorage.getItem(storageKey);
      const lastRead = localStorage.getItem(lastReadKey);
      
      if (stored) {
        try {
          const messages = JSON.parse(stored);
          if (Array.isArray(messages) && messages.length > 0) {
            // Check if there are new messages since last read
            const lastMessage = messages[messages.length - 1];
            const lastReadTime = lastRead ? parseInt(lastRead, 10) : 0;
            
            // If last message is from assistant and is newer than last read, show indicator
            if (lastMessage.role === 'assistant' && lastMessage.id > lastReadTime) {
              setHasNewChatMessage(true);
            } else {
              setHasNewChatMessage(false);
            }
          }
        } catch (e) {
          // Invalid data
        }
      }
    }
    
    checkNewMessages();
    // Check every 2 seconds
    const interval = setInterval(checkNewMessages, 2000);
    return () => clearInterval(interval);
  }, [businessId, tableId]);

  // Get current time in client's timezone (or business timezone if specified)
  // This ensures the time is correct regardless of where the server is located
  function getCurrentLocalTime(): string {
    // Get client's timezone (browser automatically detects it)
    const now = new Date();
    
    // Use Intl API to get time in client's local timezone
    // This works correctly even if server is in different timezone
    const localTime = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);
    
    const hours = localTime.find(part => part.type === 'hour')?.value || '00';
    const minutes = localTime.find(part => part.type === 'minute')?.value || '00';
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }

  // Update current time every minute
  useEffect(() => {
    // Set initial time
    setCurrentServerTime(getCurrentLocalTime());
    
    // Update every minute
    const interval = setInterval(() => {
      setCurrentServerTime(getCurrentLocalTime());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Check if business hours are active
  function isBusinessHoursActive(): boolean {
    if (!businessInfo?.businessHours) {
      // No business hours restriction - always available
      return true;
    }

    // Use current local time (client's timezone)
    const currentTime = currentServerTime || getCurrentLocalTime();
    const { start, end } = businessInfo.businessHours;
    
    // Simple time comparison (HH:MM format)
    // Note: This compares time in the client's local timezone
    // The business should set hours according to their local timezone
    return currentTime >= start && currentTime <= end;
  }

  // Group items by category for continuous scroll display
  const itemsByCategory = useMemo(() => {
    const businessHoursActive = isBusinessHoursActive();
    const grouped: Record<string, MenuItem[]> = {};
    
    menuItems.forEach((item) => {
      // Filter out business items if outside business hours
      if (item.isBusiness && !businessHoursActive && businessInfo?.businessHours) {
        return; // Skip this item
      }
      
      const categoryKey = item.isBusiness ? 'business' : item.category;
      if (!grouped[categoryKey]) {
        grouped[categoryKey] = [];
      }
      grouped[categoryKey].push(item);
    });
    
    return grouped;
  }, [menuItems, businessInfo?.businessHours]);

  // Get all categories in order (business first if exists, then others)
 // Get all categories in order (business first if exists, then others)
const orderedCategories = useMemo(() => {
  const businessHoursActive = isBusinessHoursActive();

  // Separate business and regular categories
  const regularCategories = categories.filter(cat => cat !== 'business');

  const hasBusinessItems =
    Array.isArray(itemsByCategory['business']) &&
    itemsByCategory['business'].length > 0;

  // Show business category first only if allowed
  if (hasBusinessItems && businessHoursActive) {
    return ['business', ...regularCategories];
  }

  return regularCategories;
}, [categories, itemsByCategory, businessInfo?.businessHours, currentServerTime]);

  // Scroll-based active category detection
  useEffect(() => {
    function updateActiveCategory() {
      const headerOffset = 120;
      const scrollPosition = window.scrollY + headerOffset;

      // Check featured section first
      const featuredSection = document.getElementById('featured-section');
      if (featuredSection) {
        const featuredTop = featuredSection.offsetTop;
        const featuredBottom = featuredTop + featuredSection.offsetHeight;
        if (scrollPosition >= featuredTop && scrollPosition < featuredBottom) {
          setActiveCategory('all');
          return;
        }
      }

      // Check each category section
      for (const category of orderedCategories) {
        const categoryElement = document.getElementById(`category-${category}`);
        if (categoryElement) {
          const categoryTop = categoryElement.offsetTop;
          const categoryBottom = categoryTop + categoryElement.offsetHeight;
          if (scrollPosition >= categoryTop && scrollPosition < categoryBottom) {
            setActiveCategory(category);
            return;
          }
        }
      }

      // Default to first category if scrolled past all
      if (orderedCategories.length > 0) {
        setActiveCategory(orderedCategories[0]);
      }
    }

    window.addEventListener('scroll', updateActiveCategory);
    updateActiveCategory(); // Initial check

    return () => window.removeEventListener('scroll', updateActiveCategory);
  }, [orderedCategories]);

  // Scroll to category section
  function scrollToCategory(category: string) {
    const categoryId = category === 'all' ? 'featured-section' : `category-${category}`;
    const element = document.getElementById(categoryId);
    if (element) {
      const headerOffset = 120; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  async function handleAddToCart(item: MenuItem) {
    // Check if planType is menu_only - block adding to cart
    if (businessInfo?.planType === 'menu_only') {
      toast.error(language === 'en' 
        ? 'Orders are not available. This is a digital menu only. Please contact the restaurant to place an order.'
        : 'הזמנות אינן זמינות. זהו תפריט דיגיטלי בלבד. אנא צרו קשר עם המסעדה להזמנה.'
      );
      return;
    }
    if (subscriptionExpired || businessDisabled) {
      toast.error('לא ניתן להוסיף פריטים לעגלה - העסק אינו יכול לקבל הזמנות כרגע');
      return;
    }

    // Check if session is still valid
    if (!isSessionValid || !isSessionValid()) {
      toast.error('הקישור פג תוקף. אנא סרוק את קוד ה-QR מחדש כדי להזמין.');
      setSessionExpired(true);
      return;
    }

    // Check if this is a business item and if business hours are active
    if (item.isBusiness && !isBusinessHoursActive()) {
      const { start, end } = businessInfo?.businessHours || { start: '', end: '' };
      toast.error(`מנות עסקיות זמינות רק בין השעות ${start} - ${end}`);
      return;
    }

    const displayName = language === 'en' && item.nameEn ? item.nameEn : item.name;

    addItem({
      menuItemId: `${item.businessId}-${item.name}`,
      name: displayName,
      price: item.price,
    });
    toast.success(
      language === 'en'
        ? `${displayName} was added to the cart`
        : `${displayName} נוסף לעגלה`,
    );
    
    // Mark cart as updated
    markCartUpdated();
    
    // Check for upsell suggestion (only if not already shown for this specific item)
    // GUARDRAIL: Frequency limitation - one upsell per item, per session
    if (session && !session.upsellShown) {
      // GUARDRAIL: Don't suggest if item is already in cart (double-check client-side)
      const itemAlreadyInCart = items.some((cartItem) => 
        cartItem.name.toLowerCase() === item.name.toLowerCase()
      );
      
      if (!itemAlreadyInCart) {
        try {
          // Pass current cart items to API for server-side filtering
          const cartItemNames = items.map((i) => i.name);
          const res = await fetch(
            `/api/ai/upsell?businessId=${encodeURIComponent(businessId)}&itemName=${encodeURIComponent(item.name)}&cartItems=${encodeURIComponent(JSON.stringify(cartItemNames))}`,
          );
          if (res.ok) {
            const data = await res.json();
            if (data.suggestedItem) {
              // GUARDRAIL: Double-check the suggested item is not in cart
              const suggestedInCart = items.some((cartItem) =>
                cartItem.name.toLowerCase() === data.suggestedItem.name.toLowerCase()
              );
              
              if (!suggestedInCart) {
                setUpsellSuggestion(data.suggestedItem);
                updateSession({ upsellShown: true });
              }
            }
          }
        } catch (err) {
          // Silently fail - upsell is optional
          console.error('Upsell fetch error:', err);
        }
      }
    }
  }

  function handleExpandItem(item: MenuItem) {
    setScrollPosition(window.scrollY);
    setExpandedItem(item);
    // Prevent body scroll when expanded on mobile
    if (window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    }
  }

  const handleCollapseItem = useCallback(() => {
    setExpandedItem(null);
    document.body.style.overflow = '';
    // Restore scroll position
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPosition);
    });
  }, [scrollPosition]);

  // Handle swipe down on mobile
  useEffect(() => {
    if (!expandedItem) return;

    let touchStartY = 0;
    let touchCurrentY = 0;

    function handleTouchStart(e: TouchEvent) {
      touchStartY = e.touches[0].clientY;
    }

    function handleTouchMove(e: TouchEvent) {
      touchCurrentY = e.touches[0].clientY;
      const deltaY = touchCurrentY - touchStartY;
      // If swiping down more than 100px, collapse
      if (deltaY > 100) {
        handleCollapseItem();
      }
    }

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [expandedItem, handleCollapseItem]);

  function scrollToItem(itemName: string) {
    const element = document.getElementById(`item-${itemName}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight briefly
      element.classList.add('ring-2', 'ring-white');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-white');
      }, 2000);
    }
  }

  const template = (businessInfo?.template || 'generic') as string;
  
  // Fixed menu style (removed menuStyle system)
  // Modern premium styling for bar-classic theme
  const isBarClassic = template === 'bar-classic';
  
  const menuStyle = {
    card: {
      base: isBarClassic 
        ? 'flex flex-col rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5 transition-all duration-700 cursor-pointer'
        : 'flex flex-col rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-700 cursor-pointer',
      image: isBarClassic
        ? 'w-full h-56 rounded-[2rem] overflow-hidden bg-white/3 border border-white/3 mb-4 shadow-2xl flex-shrink-0'
        : 'w-full h-56 rounded-[2rem] overflow-hidden bg-white/5 border border-white/5 mb-4 shadow-2xl flex-shrink-0',
      hover: isBarClassic
        ? 'hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-1'
        : 'hover:bg-white/[0.06] hover:border-white/20 hover:-translate-y-1',
      content: 'px-2',
    },
    button: {
      primary: isBarClassic
        ? 'rounded-full bg-[#8B2635] text-[#FAF8F3] px-8 py-3 text-sm font-medium tracking-widest hover:bg-[#A02E3F] transition-all duration-500 uppercase shadow-lg'
        : 'rounded-full bg-white text-black px-8 py-3 text-sm font-light tracking-widest hover:bg-neutral-200 transition-all duration-500 uppercase',
      category: {
        active: isBarClassic
          ? 'bg-[#D4AF37] text-[#1a1a1a] shadow-2xl scale-105 font-medium'
          : 'bg-white text-black shadow-2xl scale-105',
        inactive: isBarClassic
          ? 'bg-transparent border border-white/8 hover:border-white/15 text-[#FAF8F3]/80'
          : 'bg-transparent border border-white/10 hover:border-white/30 text-white/60',
      },
    },
    typography: {
      itemTitle: isBarClassic
        ? 'text-2xl font-medium tracking-tight mb-2 text-[#FAF8F3]'
        : 'text-2xl font-light tracking-tight mb-2 text-white/95',
      itemDescription: isBarClassic
        ? 'text-sm text-[#FAF8F3]/60 mb-4 leading-relaxed font-light'
        : 'text-sm text-white/50 mb-4 leading-relaxed font-light italic',
      price: isBarClassic
        ? 'text-xl font-medium tracking-widest text-[#D4AF37]'
        : 'text-xl font-light tracking-widest text-white/90',
      sectionTitle: isBarClassic
        ? 'text-3xl font-medium tracking-[0.2em] mb-10 text-center uppercase text-[#FAF8F3]/50'
        : 'text-3xl font-extralight tracking-[0.2em] mb-10 text-center uppercase text-white/40',
    },
    badge: {
      featured: isBarClassic
        ? 'text-[10px] tracking-[0.2em] uppercase text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1 rounded-full mb-2 inline-block bg-[#D4AF37]/10'
        : 'text-[10px] tracking-[0.2em] uppercase text-amber-200/80 border border-amber-200/20 px-3 py-1 rounded-full mb-2 inline-block',
      pregnancy: isBarClassic
        ? 'text-[10px] tracking-[0.1em] text-emerald-300/80 border border-emerald-300/20 px-3 py-1 rounded-full inline-flex items-center gap-2 bg-emerald-300/5'
        : 'text-[10px] tracking-[0.1em] text-emerald-200/70 border border-emerald-200/10 px-3 py-1 rounded-full inline-flex items-center gap-2',
      category: 'hidden',
    },
    spacing: {
      cardGap: 'gap-8',
      sectionGap: 'mb-20',
    },
    expanded: {
      container: isBarClassic
        ? 'bg-[#1a1a1a]/95 backdrop-blur-3xl border border-white/5 rounded-[3rem] overflow-hidden flex flex-col relative h-full'
        : 'bg-neutral-950/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] overflow-hidden flex flex-col relative h-full',
      image: 'relative max-h-[20vh] h-[20vh] w-full grayscale-[0.2] flex-shrink-0 overflow-hidden',
      content: 'flex-1 overflow-y-auto p-10 lg:p-16 text-center min-h-0',
      button: isBarClassic
        ? 'w-full rounded-full bg-[#8B2635] text-[#FAF8F3] py-5 text-sm font-medium tracking-[0.3em] uppercase hover:bg-[#A02E3F] hover:tracking-[0.4em] transition-all duration-700 shadow-lg'
        : 'w-full rounded-full bg-white text-black py-5 text-sm font-light tracking-[0.3em] uppercase hover:tracking-[0.4em] transition-all duration-700',
    },
  };

  // SINGLE SOURCE OF TRUTH: Business name - name is always the fallback
  // Rules:
  // - English: Use nameEn if exists and non-empty, otherwise ALWAYS use name
  // - Hebrew: Always use name
  // - NEVER return empty/undefined - name is the guaranteed fallback
  const displayBusinessName = useMemo(() => {
    // If businessInfo not loaded, return placeholder
    if (!businessInfo || !businessInfo.name) {
      return 'Menu';
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
    return template === 'pizza-classic';
  }, [businessInfo, template]);

  // Parse pizza brand name into hero and sub-branding
  const pizzaBrandParts = useMemo(() => {
    if (!isPizzaBrand) return null;
    const nameUpper = displayBusinessName.toUpperCase();
    
    // Try to split on common patterns: "CLASSIC PIZZA CO." -> ["CLASSIC", "PIZZA CO."]
    // Look for "PIZZA" as the divider
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
      // Take first word as hero, rest as sub-brand
      return {
        hero: words[0],
        subBrand: words.slice(1).join(' '),
      };
    }
    
    return null;
  }, [isPizzaBrand, displayBusinessName]);

  if (!businessInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white" dir={language === 'he' ? 'rtl' : 'ltr'}>
        {language === 'en' ? 'Loading...' : 'טוען...'}
      </div>
    );
  }
  
  return (
    <ThemeWrapper template={template}>
      <main 
        className="min-h-screen text-white pb-32"
        dir={language === 'he' ? 'rtl' : 'ltr'}
      >
        {/* Header - Premium Redesign */}
        <header className="relative pt-8 pb-12 px-6 overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20">
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[150%] bg-gradient-to-b from-white/10 to-transparent blur-3xl rounded-full" />
          </div>

          <div className="flex flex-col items-center text-center">
            {/* SINGLE SOURCE OF TRUTH: Business name rendered exactly once */}
            {businessInfo?.logoUrl && businessInfo.logoUrl.trim() ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative mb-6 group"
              >
                <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <img
                  src={businessInfo.logoUrl}
                  alt={displayBusinessName}
                  className="relative max-h-20 lg:max-h-24 w-auto object-contain drop-shadow-2xl"
                  onError={(e) => {
                    // Hide image on error and show fallback
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.logo-fallback') as HTMLElement;
                      if (fallback) {
                        fallback.style.display = 'flex';
                      }
                    }
                  }}
                />
                {/* Fallback: show full business name if logo fails */}
                <div className="hidden logo-fallback absolute inset-0 items-center justify-center">
                  {isPizzaBrand && pizzaBrandParts ? (
                    <div>
                      <div
                        className="text-6xl lg:text-7xl font-medium tracking-[0.12em] uppercase leading-tight"
                        style={{
                          fontFamily: 'system-ui, -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif',
                          letterSpacing: '0.12em',
                          color: '#E8E6E1', // Soft ivory, elegant and refined
                          fontWeight: 500,
                        }}
                      >
                        {pizzaBrandParts.hero}
                      </div>
                      <div
                        className="text-2xl lg:text-3xl font-light tracking-[0.2em] uppercase mt-1"
                        style={{
                          fontFamily: 'system-ui, -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif',
                          letterSpacing: '0.2em',
                          color: '#A67C52', // Warm terracotta, elegant and appetizing
                          fontWeight: 300,
                        }}
                      >
                        {pizzaBrandParts.subBrand}
                      </div>
                    </div>
                  ) : (
                    <h1
                      className="text-5xl lg:text-6xl font-light tracking-[0.15em] uppercase"
                      style={{
                        fontFamily: 'system-ui, -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif',
                        letterSpacing: '0.15em',
                        color: isBarClassic ? '#FAF8F3' : '#FFFFFF',
                        fontWeight: 300,
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {displayBusinessName.split('').map((char, index) => {
                        const isFirstLetter = index === 0;
                        const accentColor = isBarClassic ? '#D4AF37' : '#F5D76E';
                        
                        return (
                          <span
                            key={index}
                            style={{
                              color: isFirstLetter ? accentColor : 'inherit',
                              fontWeight: isFirstLetter ? 400 : 300,
                            }}
                          >
                            {char === ' ' ? '\u00A0' : char}
                          </span>
                        );
                      })}
                    </h1>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  ease: [0.25, 0.1, 0.25, 1]
                }}
                className="mb-6 relative"
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
                  // Premium pizza brand treatment: Hero + Sub-branding
                  <motion.div
                    initial={{ opacity: 0, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
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
                      className="text-6xl lg:text-7xl font-medium tracking-[0.12em] uppercase leading-tight"
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
                      className="text-2xl lg:text-3xl font-light tracking-[0.2em] uppercase mt-1"
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
                  // Standard premium treatment for non-pizza brands
                  <motion.h1
                    initial={{ opacity: 0, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    transition={{ 
                      duration: 0.5,
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                    className="text-5xl lg:text-6xl font-light tracking-[0.15em] uppercase relative z-10"
                    style={{
                      fontFamily: 'system-ui, -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif',
                      letterSpacing: '0.15em',
                      color: isBarClassic ? '#FAF8F3' : '#FFFFFF',
                      fontWeight: 300,
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {displayBusinessName.split('').map((char, index) => {
                      // Add subtle gold accent to first letter for premium feel
                      const isFirstLetter = index === 0;
                      const accentColor = isBarClassic ? '#D4AF37' : '#F5D76E';
                      
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

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-center gap-3">
                <span className={`h-[1px] w-8 ${isBarClassic ? 'bg-[#FAF8F3]/15' : 'bg-white/20'}`} />
                <span className={`text-[10px] uppercase tracking-[0.2em] font-medium ${isBarClassic ? 'text-[#FAF8F3]/50' : 'text-white/40'}`}>
                  {language === 'en' ? `Table ${tableId}` : `שולחן ${tableId}`}
                </span>
                <span className={`h-[1px] w-8 ${isBarClassic ? 'bg-[#FAF8F3]/15' : 'bg-white/20'}`} />
              </div>
            </motion.div>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => switchLanguage('he')}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  language === 'he'
                    ? isBarClassic
                      ? 'bg-[#D4AF37] text-[#1a1a1a] border-[#D4AF37]'
                      : 'bg-white text-black border-white'
                    : isBarClassic
                      ? 'bg-white/5 text-[#FAF8F3]/70 border-white/8'
                    : 'bg-white/5 text-white/70 border-white/20'
                }`}
              >
                עברית
              </button>
              <button
                type="button"
                onClick={() => switchLanguage('en')}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  language === 'en'
                    ? isBarClassic
                      ? 'bg-[#D4AF37] text-[#1a1a1a] border-[#D4AF37]'
                      : 'bg-white text-black border-white'
                    : isBarClassic
                      ? 'bg-white/5 text-[#FAF8F3]/70 border-white/8'
                    : 'bg-white/5 text-white/70 border-white/20'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </header>

        <div className="px-4">
          {/* Menu Only Plan Message */}
          {(() => {
            const shouldShow = businessInfo?.planType === 'menu_only' && !subscriptionExpired && !businessDisabled && businessInfo?.menuOnlyMessage && businessInfo.menuOnlyMessage.trim().length > 0;
            console.log('🔍 Menu message check:', {
              planType: businessInfo?.planType,
              planTypeMatch: businessInfo?.planType === 'menu_only',
              subscriptionExpired,
              businessDisabled,
              menuOnlyMessage: businessInfo?.menuOnlyMessage,
              menuOnlyMessageType: typeof businessInfo?.menuOnlyMessage,
              menuOnlyMessageLength: businessInfo?.menuOnlyMessage?.length,
              menuOnlyMessageTrimmed: businessInfo?.menuOnlyMessage?.trim(),
              menuOnlyMessageTrimmedLength: businessInfo?.menuOnlyMessage?.trim()?.length,
              hasMessage: !!businessInfo?.menuOnlyMessage,
              hasNonEmptyMessage: !!(businessInfo?.menuOnlyMessage && businessInfo.menuOnlyMessage.trim().length > 0),
              shouldShow,
              allConditions: {
                planType: businessInfo?.planType === 'menu_only',
                notExpired: !subscriptionExpired,
                notDisabled: !businessDisabled,
                hasMessage: !!(businessInfo?.menuOnlyMessage && businessInfo.menuOnlyMessage.trim().length > 0),
              },
            });
            return shouldShow ? (
              <motion.div
                className="mb-8 rounded-[2rem] border border-neutral-700/50 bg-neutral-900/40 backdrop-blur-xl p-8 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="text-sm text-white/80 leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
                  {businessInfo.menuOnlyMessage}
                </div>
              </motion.div>
            ) : null;
          })()}

          {/* Business Disabled / Subscription Expired Message */}
          {(subscriptionExpired || businessDisabled) && (
            <motion.div
              className="mb-8 rounded-[2rem] border border-red-500/20 bg-red-950/20 backdrop-blur-xl p-8 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-4xl mb-4 opacity-50">✦</div>
              <h2 className="text-lg font-light tracking-wide mb-2">
                {businessDisabled 
                  ? (language === 'en' ? 'Account is inactive' : 'החשבון אינו פעיל')
                  : (language === 'en' ? 'Subscription expired' : 'המנוי פג תוקף')
                }
              </h2>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs mx-auto mb-4">
                {language === 'en' 
                  ? `The business ${businessInfo?.name} cannot accept orders at this time.`
                  : `העסק ${businessInfo?.name} אינו יכול לקבל הזמנות כרגע.`
                }
              </p>
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-white/30">
                  {language === 'en' ? 'View only' : 'תצוגה בלבד'}
                </p>
              </div>
            </motion.div>
          )}

          {sessionExpired && !subscriptionExpired && !businessDisabled && (
            <motion.div
              className="mb-8 rounded-[2rem] border border-yellow-500/30 bg-yellow-950/20 backdrop-blur-xl p-6 text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-3xl mb-3">⏰</div>
              <h2 className="text-lg font-medium mb-2 text-yellow-200">
                הקישור פג תוקף
              </h2>
              <p className="text-sm text-white/70 leading-relaxed max-w-xs mx-auto mb-4">
                הקישור תקף לשעה אחת בלבד. כדי להזמין שוב, אנא סרוק את קוד ה-QR מחדש.
              </p>
              <p className="text-xs text-white/50">
                {language === 'en' 
                  ? 'You can view the menu, but cannot add items to cart'
                  : 'ניתן לצפות בתפריט, אך לא ניתן להוסיף פריטים לעגלה'
                }
              </p>
            </motion.div>
          )}

          {/* Don't show menu if subscription is expired or business is disabled */}
          {!subscriptionExpired && !businessDisabled ? (
            <>
          {/* Mobile Categories Navigation - Grid Layout */}
          <nav className="lg:hidden sticky top-0 z-30 mb-8 -mx-4 bg-black/40 backdrop-blur-sm pt-4 pb-4">
            <div className="px-4">
              {/* Home button */}
              <div className="mb-3">
                <motion.button
                  onClick={() => scrollToCategory('all')}
                  className="relative w-full group"
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className={`px-5 py-2.5 rounded-full text-xs font-medium tracking-wider transition-all duration-500 ${
                      activeCategory === 'all'
                        ? isBarClassic
                          ? 'text-[#1a1a1a] z-10'
                          : 'text-black z-10'
                        : isBarClassic
                          ? 'text-[#FAF8F3]/70 bg-white/5 border border-white/8'
                        : 'text-white/60 bg-white/5 border border-white/10'
                    }`}
                  >
                    {language === 'en' ? 'Home' : 'עמוד הבית'}
                  </div>
                  {activeCategory === 'all' && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute inset-0 rounded-full -z-10 ${isBarClassic ? 'bg-[#D4AF37]' : 'bg-white'}`}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              </div>

              {/* Categories Grid */}
              {orderedCategories.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {(categoriesExpanded ? orderedCategories : orderedCategories.slice(0, 3)).map((cat) => {
                  // Get categoryEn from first item in category
                  const categoryItems = itemsByCategory[cat] || [];
                  const firstItem = categoryItems[0];
                  let displayCategory: string;
                  if (cat === 'business') {
                    displayCategory = language === 'en' ? '💼 Business' : '💼 עסקי';
                  } else if (language === 'en' && firstItem?.categoryEn) {
                    displayCategory = firstItem.categoryEn;
                  } else if (language === 'en') {
                    displayCategory = categoryTranslations[cat] || cat;
                  } else {
                    displayCategory = cat;
                  }
                  
                  return (
                    <motion.button
                      key={cat}
                      onClick={() => scrollToCategory(cat)}
                      className="relative group"
                      whileTap={{ scale: 0.95 }}
                    >
                      <div
                        className={`px-3 py-2 rounded-full text-xs font-medium tracking-wider transition-all duration-500 text-center ${
                          activeCategory === cat
                            ? isBarClassic
                              ? 'text-[#1a1a1a] z-10'
                              : 'text-black z-10'
                            : isBarClassic
                              ? 'text-[#FAF8F3]/70 bg-white/5 border border-white/8'
                            : 'text-white/60 bg-white/5 border border-white/10'
                        }`}
                      >
                        <span className="line-clamp-1">{displayCategory}</span>
                      </div>
                      {activeCategory === cat && (
                        <motion.div
                          layoutId="activeTab"
                          className={`absolute inset-0 rounded-full -z-10 ${isBarClassic ? 'bg-[#D4AF37]' : 'bg-white'}`}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </motion.button>
                  );
                  })}
                </div>
              )}

              {/* Expand/Collapse Button */}
              {orderedCategories.length > 3 && (
                <motion.button
                  onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                  className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                    isBarClassic
                      ? 'text-[#FAF8F3]/70 bg-white/5 border border-white/8 hover:bg-white/8'
                      : 'text-white/60 bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{categoriesExpanded ? (language === 'en' ? 'Show Less' : 'הצג פחות') : (language === 'en' ? 'Show More' : 'הצג עוד')}</span>
                  <motion.span
                    animate={{ rotate: categoriesExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-lg"
                  >
                    ↓
                  </motion.span>
                </motion.button>
              )}
            </div>
          </nav>

        {/* Continuous Menu Layout - All items in one scrollable page */}
        <div className="lg:grid lg:grid-cols-[1fr_14rem] lg:gap-6 mb-6">
          {/* Main Content Area */}
          <div className="space-y-8">
            {/* Featured Section */}
            {featuredItems.length > 0 && (
              <section id="featured-section" className="mb-12">
                <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold mb-6 text-center">
                  {language === 'en' ? 'Featured deals' : 'מבצעים ודילים חמים'}
                </h2>
                <div className="relative h-[28rem] lg:h-[32rem] rounded-[3rem] overflow-hidden bg-white/[0.02] border border-white/10 shadow-2xl group">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={featuredIndex}
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-0 flex flex-col items-center justify-center p-8 lg:p-12 cursor-pointer z-10"
                      onClick={() => scrollToItem(featuredItems[featuredIndex].name)}
                    >
                      {/* Image container with glow */}
                      <div className="relative w-56 h-56 lg:w-72 lg:h-72 mb-8 flex-shrink-0 group-hover:scale-105 transition-transform duration-700">
                        <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full scale-110 opacity-50" />
                        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                          {featuredItems[featuredIndex].imageUrl ? (
                            <img
                              src={featuredItems[featuredIndex].imageUrl}
                              alt={featuredItems[featuredIndex].name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-7xl opacity-20">
                              🍽️
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-center max-w-md">
                        <span className="inline-block px-3 py-1 rounded-full border border-amber-200/20 text-[10px] uppercase tracking-[0.2em] text-amber-200/60 mb-4">
                          {language === 'en' ? 'Recommended this week' : 'מומלץ השבוע'}
                        </span>
                        <h3 className="text-3xl lg:text-4xl font-light tracking-tight text-white mb-4">
                          {language === 'en' && featuredItems[featuredIndex].nameEn
                            ? featuredItems[featuredIndex].nameEn
                            : featuredItems[featuredIndex].name}
                        </h3>
                        <div className="flex items-center justify-center gap-4 mb-6">
                          <span className="h-[1px] w-8 bg-white/10" />
                          <span className="text-2xl font-light tracking-widest text-white/90">
                            ₪{featuredItems[featuredIndex].price.toFixed(2)}
                          </span>
                          <span className="h-[1px] w-8 bg-white/10" />
                        </div>
                        
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(featuredItems[featuredIndex]);
                          }}
                          className={`rounded-full px-8 py-3 text-xs font-medium uppercase tracking-[0.2em] transition-colors ${
                            isBarClassic
                              ? 'bg-[#8B2635] text-[#FAF8F3] hover:bg-[#A02E3F]'
                              : 'bg-white text-black hover:bg-neutral-200'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {language === 'en' ? 'Add to order' : 'הוסף להזמנה'}
                        </motion.button>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Minimal indicators */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
                    {featuredItems.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setFeaturedIndex(i)}
                        className={`h-1 rounded-full transition-all duration-500 ${
                          i === featuredIndex
                            ? 'w-12 bg-white'
                            : 'w-2 bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
        </div>
      </section>
            )}

            {/* All Categories - Continuous Scroll */}
            {loading && (
              <p className="text-sm text-white/60 text-center py-8">
                {language === 'en' ? 'Loading menu...' : 'טוען תפריט...'}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-500/40 rounded px-4 py-3">
                {error}
              </p>
            )}
            {!loading && !error && orderedCategories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-white/50">
                  {language === 'en'
                    ? 'There are no items in the menu yet. The business owner needs to add items in the dashboard.'
                    : 'עדיין אין מנות בתפריט. בעל העסק צריך להוסיף מנות בדשבורד.'}
                </p>
              </div>
            )}

            {/* Render all categories with their items */}
            {!loading && !error && orderedCategories.map((category) => {
              const categoryItems = itemsByCategory[category] || [];
              if (categoryItems.length === 0) return null;

              // Get categoryEn from first item in category
              const firstItem = categoryItems[0];
              let displayCategory: string;
              if (category === 'business') {
                displayCategory = language === 'en' ? '💼 Business Meals' : '💼 מנות עסקיות';
              } else if (language === 'en' && firstItem?.categoryEn) {
                displayCategory = firstItem.categoryEn;
              } else if (language === 'en') {
                displayCategory = categoryTranslations[category] || category;
              } else {
                displayCategory = category;
              }

              return (
                <section key={category} id={`category-${category}`} className="space-y-4">
                  {/* Category Header */}
                  <div className="mb-6 pt-8">
                    <h2 className={menuStyle.typography.sectionTitle}>
                      {displayCategory}
                    </h2>
                  </div>

                  {/* Category Items */}
                  {categoryItems.map((item, index) => {
                const isExpanded = expandedItem?.name === item.name;
                const displayName = language === 'en' && item.nameEn ? item.nameEn : item.name;
                const displayIngredients =
                  language === 'en' && item.ingredientsEn && item.ingredientsEn.length > 0
                    ? item.ingredientsEn
                    : item.ingredients;
                const displayAllergens =
                  language === 'en' && item.allergensEn && item.allergensEn.length > 0
                    ? item.allergensEn
                    : item.allergens;

                return (
                  <AnimatePresence key={`${item.businessId}-${item.name}`} mode="wait">
                    {!isExpanded ? (
                      <motion.article
                        id={`item-${item.name}`}
                        key={`card-${item.name}`}
                        className={`${menuStyle.card.base} ${menuStyle.card.hover}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleExpandItem(item)}
                      >
                        {/* Image - Same size as featured items */}
                        <div className={`${menuStyle.card.image} h-56 lg:h-72`}>
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">
                              🍽️
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className={menuStyle.card.content}>
                          {/* Badges */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {item.isFeatured && (
                              <span className={menuStyle.badge.featured}>
                                {language === 'en' ? 'Recommended' : 'מומלץ'}
                              </span>
                            )}
                            {item.isBusiness && (
                              <span className="text-[10px] tracking-[0.2em] uppercase text-blue-300/80 border border-blue-300/20 px-3 py-1 rounded-full inline-block">
                                {language === 'en' ? '💼 Business' : '💼 עסקי'}
                              </span>
                            )}
                          </div>

                          {/* Title and Price Row */}
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h3 className={menuStyle.typography.itemTitle}>{displayName}</h3>
                            <span className={`${menuStyle.typography.price} hidden lg:block whitespace-nowrap`}>
                              ₪{item.price.toFixed(2)}
                            </span>
                          </div>

                          {/* Category Badge */}
                          {menuStyle.badge.category !== 'hidden' && (
                            <span className={menuStyle.badge.category}>{item.category}</span>
                          )}

                          {/* Description */}
                          {(displayIngredients?.length ||
                            displayAllergens?.length ||
                            item.isPregnancySafe) && (
                            <p className={menuStyle.typography.itemDescription}>
                              {displayIngredients?.join(', ')}
                              {displayAllergens?.length && (
                                <span className="text-red-300">
                                  {language === 'en' ? ' • Allergens: ' : ' • אלרגנים: '}
                                  {displayAllergens.join(', ')}
                                </span>
                              )}
                              {item.isPregnancySafe && (
                                <span className={`${menuStyle.badge.pregnancy} mt-2 block w-fit`}>
                                  {language === 'en' ? '🤰 Pregnancy-safe' : '🤰 מתאים להריון'}
                                </span>
                              )}
                            </p>
                          )}

                          {/* Price & Button Row */}
                          <div className="flex items-center justify-between mt-auto pt-2">
                            <span className={`${menuStyle.typography.price} lg:hidden`}>
                              ₪{item.price.toFixed(2)}
                            </span>
                            {businessInfo?.planType !== 'menu_only' && (
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(item);
                                }}
                                className={`${menuStyle.button.primary} w-full lg:w-auto`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {language === 'en' ? 'Add to Cart' : 'הוסף לעגלה'}
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.article>
                  ) : (
                    <motion.div
                      key={`expanded-${item.name}`}
                      className="hidden lg:block w-full rounded-3xl overflow-hidden max-h-[80vh] flex flex-col"
                      initial={{ opacity: 0, scale: 0.95, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -20 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                      <div className={`${menuStyle.expanded.container} flex-1 min-h-0 flex flex-col`}>
                        {/* Close Button */}
                        <button
                          onClick={handleCollapseItem}
                          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition"
                        >
                          <span className="text-2xl">×</span>
                        </button>

                        {/* Title and Price - Fixed at top */}
                        <div className="flex-shrink-0 p-6 lg:p-8 pb-4 border-b border-white/10">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h2
                              className={`${menuStyle.typography.itemTitle} text-2xl lg:text-3xl text-white`}
                            >
                              {displayName}
                            </h2>
                            <span className={`${menuStyle.typography.price} text-2xl lg:text-3xl text-white whitespace-nowrap`}>
                              ₪{item.price.toFixed(2)}
                            </span>
                          </div>
                          <span className={menuStyle.badge.category}>
                            {item.category}
                          </span>
                        </div>

                        {/* Scrollable Content Area - Image and Details */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                          {/* Image - Smaller, positioned lower */}
                          <div className="max-h-[25vh] h-[25vh] w-full overflow-hidden my-6 mx-8 rounded-2xl">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-8xl opacity-30">
                                🍽️
                              </div>
                            )}
                          </div>

                          {/* Details Section - Above button */}
                          <div className="px-8 lg:px-16 pb-4">
                            {/* Full Description */}
                            {displayIngredients && displayIngredients.length > 0 && (
                              <div className="mb-4">
                                <h3 className="text-lg font-semibold text-white mb-2">
                                  {language === 'en' ? 'Ingredients:' : 'מרכיבים:'}
                                </h3>
                                <p className="text-base text-white/80 leading-relaxed">
                                  {displayIngredients.join(', ')}
                                </p>
                              </div>
                            )}

                            {/* Allergens */}
                            {displayAllergens && displayAllergens.length > 0 && (
                              <div className="mb-4">
                                <h3 className="text-lg font-semibold text-white mb-2">
                                  {language === 'en' ? 'Allergens:' : 'אלרגנים:'}
                                </h3>
                                <p className="text-sm text-red-300">
                                  {displayAllergens.join(', ')}
                                </p>
                              </div>
                            )}

                            {/* Pregnancy Safe Badge */}
                            {item.isPregnancySafe && (
                              <div className="mb-4">
                                <span className={menuStyle.badge.pregnancy}>
                                  <span>🤰</span>
                                  <span className="font-semibold">
                                    {language === 'en' ? 'Pregnancy-safe' : 'מתאים להריון'}
                                  </span>
                                </span>
                              </div>
                            )}

                            {/* Options / Add-ons placeholder - can be extended later */}
                            <div className="mb-6">
                              {/* Future: Add customization options here */}
                            </div>
                          </div>
                        </div>

                        {/* Fixed Bottom Action Section */}
                        <div className="flex-shrink-0 p-6 lg:p-8 border-t border-white/20 bg-neutral-950/90 backdrop-blur-sm">
                          {businessInfo?.planType !== 'menu_only' && (
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(item);
                                handleCollapseItem();
                              }}
                              className={menuStyle.expanded.button}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {language === 'en' ? 'Add to cart' : 'הוסף לעגלה'} - ₪
                              {item.price.toFixed(2)}
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              );
            })}
                </section>
              );
            })}

          </div>

          {/* Categories Sidebar - Desktop Premium Design */}
          <aside className="hidden lg:block lg:mb-0 lg:sticky lg:top-8 lg:self-start">
            <div className="relative pl-6">
              <div className="mb-8 pl-4">
                <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold mb-1">
                  {language === 'en' ? 'MENU' : 'תפריט'}
                </h2>
                <div className="h-[1px] w-8 bg-white/20" />
              </div>
              
              <div className="space-y-1">
                <motion.button
                  onClick={() => scrollToCategory('all')}
                  className="relative w-full text-right group flex items-center justify-end py-3 px-4 transition-all"
                  whileHover={{ x: -4 }}
                >
                  <span className={`text-sm tracking-wide transition-all duration-300 ${
                    activeCategory === 'all' ? 'text-white font-medium' : 'text-white/40 group-hover:text-white/70'
                  }`}>
                    {language === 'en' ? 'Home' : 'עמוד הבית'}
                  </span>
                  {activeCategory === 'all' && (
                    <motion.div
                      layoutId="activeTabDesktop"
                      className="absolute right-0 w-1 h-6 bg-white rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>

                {orderedCategories.map((cat, index) => {
                  // Get categoryEn from first item in category
                  const categoryItems = itemsByCategory[cat] || [];
                  const firstItem = categoryItems[0];
                  let displayCategory: string;
                  if (cat === 'business') {
                    displayCategory = language === 'en' ? '💼 Business Meals' : '💼 מנות עסקיות';
                  } else if (language === 'en' && firstItem?.categoryEn) {
                    displayCategory = firstItem.categoryEn;
                  } else if (language === 'en') {
                    displayCategory = categoryTranslations[cat] || cat;
                  } else {
                    displayCategory = cat;
                  }
                
                  
                  return (
                  <motion.button
                    key={cat}
                    onClick={() => scrollToCategory(cat)}
                    className="relative w-full text-right group flex items-center justify-end py-3 px-4 transition-all"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: -4 }}
                  >
                    <span className={`text-sm tracking-wide transition-all duration-300 ${
                      activeCategory === cat ? 'text-white font-medium' : 'text-white/40 group-hover:text-white/70'
                    }`}>
                      {displayCategory}
                    </span>
                    {activeCategory === cat && (
                      <motion.div
                        layoutId="activeTabDesktop"
                        className="absolute right-0 w-1 h-6 bg-white rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile Expanded Overlay */}
          <AnimatePresence>
            {expandedItem && (
              <>
                {/* Backdrop - click outside to close (mobile only) */}
                <motion.div
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleCollapseItem}
                />

                {/* Mobile Expanded Card - near full-screen */}
                <motion.div
                  className="fixed inset-x-4 top-20 bottom-24 lg:hidden z-50 rounded-3xl flex flex-col overflow-hidden"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={`${menuStyle.expanded.container} flex-1 min-h-0 flex flex-col`}>
                    {/* Close Button */}
          <button
                      onClick={handleCollapseItem}
                      className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition"
          >
                      <span className="text-2xl">×</span>
          </button>

                    {/* Title and Price - Fixed at top */}
                    <div className="flex-shrink-0 p-6 pb-4 border-b border-white/10">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h2 className={`${menuStyle.typography.itemTitle} text-2xl text-white`}>
                          {language === 'en' && expandedItem.nameEn
                            ? expandedItem.nameEn
                            : expandedItem.name}
                        </h2>
                        <span className={`${menuStyle.typography.price} text-2xl text-white whitespace-nowrap`}>
                          ₪{expandedItem.price.toFixed(2)}
                        </span>
                      </div>
                      <span className={menuStyle.badge.category}>
                        {expandedItem.category}
          </span>
                    </div>

                    {/* Scrollable Content Area - Image and Details */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                      {/* Image - Smaller, positioned lower */}
                      <div className="max-h-[25vh] h-[25vh] w-full overflow-hidden my-4 mx-6 rounded-2xl">
                        {expandedItem.imageUrl ? (
                          <img
                            src={expandedItem.imageUrl}
                            alt={expandedItem.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-8xl opacity-30">
                            🍽️
                          </div>
                        )}
                      </div>

                      {/* Details Section - Above button */}
                      <div className="px-6 pb-4">
                        {/* Full Description */}
                        {(
                          language === 'en'
                            ? expandedItem.ingredientsEn
                            : expandedItem.ingredients
                        ) &&
                          (language === 'en'
                            ? expandedItem.ingredientsEn
                            : expandedItem.ingredients
                          )!.length > 0 && (
                            <div className="mb-4">
                              <h3 className="text-lg font-semibold text-white mb-2">
                                {language === 'en' ? 'Ingredients:' : 'מרכיבים:'}
                              </h3>
                              <p className="text-base text-white/80 leading-relaxed">
                                {(language === 'en'
                                  ? expandedItem.ingredientsEn
                                  : expandedItem.ingredients
                                )!.join(', ')}
                              </p>
                            </div>
                          )}

                        {/* Allergens */}
                        {(
                          language === 'en'
                            ? expandedItem.allergensEn
                            : expandedItem.allergens
                        ) &&
                          (language === 'en'
                            ? expandedItem.allergensEn
                            : expandedItem.allergens
                          )!.length > 0 && (
                            <div className="mb-4">
                              <h3 className="text-lg font-semibold text-white mb-2">
                                {language === 'en' ? 'Allergens:' : 'אלרגנים:'}
                              </h3>
                              <p className="text-sm text-red-300">
                                {(language === 'en'
                                  ? expandedItem.allergensEn
                                  : expandedItem.allergens
                                )!.join(', ')}
                              </p>
                            </div>
                          )}

                        {/* Pregnancy Safe Badge */}
                        {expandedItem.isPregnancySafe && (
                          <div className="mb-4">
                            <span className={menuStyle.badge.pregnancy}>
                              <span>🤰</span>
          <span className="font-semibold">
                                {language === 'en' ? 'Pregnancy-safe' : 'מתאים להריון'}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fixed Bottom Action Section */}
                    <div className="flex-shrink-0 p-6 border-t border-white/20 bg-white/10 backdrop-blur-sm">
                      {businessInfo?.planType !== 'menu_only' && (
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(expandedItem);
                            handleCollapseItem();
                          }}
                          className={menuStyle.expanded.button}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {language === 'en' ? 'Add to cart' : 'הוסף לעגלה'} - ₪
                          {expandedItem.price.toFixed(2)}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

        {/* Upsell Suggestion - Subtle and contextual */}
        <AnimatePresence>
          {upsellSuggestion && businessInfo?.planType !== 'menu_only' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-24 left-4 right-4 lg:bottom-auto lg:left-auto lg:right-auto lg:relative lg:mb-4 z-40"
            >
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-white/70 mb-1">💡 המלצה</p>
                  <p className="text-base font-medium text-white">
                    לקוחות אחרים הזמינו גם את {upsellSuggestion.name}
                  </p>
                  <p className="text-sm text-white/60 mt-1">₪{upsellSuggestion.price.toFixed(2)}</p>
                  <p className="text-xs text-white/50 mt-1">אם תרצה, אפשר להוסיף</p>
                </div>
                <motion.button
                  onClick={() => {
                    addItem({
                      menuItemId: `${businessId}-${upsellSuggestion.name}`,
                      name: upsellSuggestion.name,
                      price: upsellSuggestion.price,
                    });
                    toast.success(`${upsellSuggestion.name} נוסף לעגלה`);
                    setUpsellSuggestion(null);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition flex-shrink-0 ${
                    isBarClassic
                      ? 'bg-[#8B2635] text-[#FAF8F3] hover:bg-[#A02E3F]'
                      : 'bg-white text-black hover:bg-white/90'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  הוסף
                </motion.button>
                <button
                  onClick={() => setUpsellSuggestion(null)}
                  className="text-white/50 hover:text-white transition flex-shrink-0"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer - Floating Premium Design */}
        <AnimatePresence>
          {totalItems > 0 && businessInfo?.planType !== 'menu_only' && (
            <motion.footer
              className="fixed bottom-6 inset-x-4 lg:inset-x-auto lg:right-8 lg:w-96 z-40"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="bg-neutral-900/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between mb-4 px-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">העגלה שלך</span>
                    <span className="text-sm text-white/80">
                      {totalItems} פריט{totalItems !== 1 ? 'ים' : ''}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold block">סה"כ</span>
                    <span className="text-xl font-light tracking-wider text-white">
                      ₪{totalPrice.toFixed(2)}
          </span>
        </div>
                </div>

        <Link
          href={`/menu/${businessId}/${tableId}/chat`}
                  className="block group"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      const storageKey = `chat_messages_${businessId}_${tableId}`;
                      const lastReadKey = `chat_last_read_${businessId}_${tableId}`;
                      const stored = localStorage.getItem(storageKey);
                      if (stored) {
                        try {
                          const messages = JSON.parse(stored);
                          if (Array.isArray(messages) && messages.length > 0) {
                            const lastMessage = messages[messages.length - 1];
                            localStorage.setItem(lastReadKey, lastMessage.id.toString());
                          }
                        } catch (e) {}
                      }
                      setHasNewChatMessage(false);
                    }
                  }}
                >
                  <motion.div
                    className={`relative overflow-hidden rounded-full py-4 px-6 flex items-center justify-center gap-3 transition-transform duration-500 ${
                      isBarClassic
                        ? 'bg-[#8B2635] text-[#FAF8F3] hover:bg-[#A02E3F]'
                        : 'bg-white text-black'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {hasNewChatMessage && (
                      <span className="absolute left-6 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                    <span className="text-xs font-medium uppercase tracking-[0.2em]">
                      המשך להזמנה
                    </span>
                    <span className="text-lg opacity-30 group-hover:translate-x-[-4px] transition-transform duration-500">←</span>
                  </motion.div>
        </Link>
              </div>
            </motion.footer>
          )}
        </AnimatePresence>
            </>
          ) : null}
        </div>
    </main>
    </ThemeWrapper>
  );
}

export default function CustomerMenuPage({
  params,
}: {
  params: { businessId: string; tableId: string };
}) {
  const { businessId, tableId } = params;
  
  return (
    <SessionProvider businessId={businessId} tableId={tableId}>
      <CustomerMenuPageContent businessId={businessId} tableId={tableId} />
    </SessionProvider>
  );
}
