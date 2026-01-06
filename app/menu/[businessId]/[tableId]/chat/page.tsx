'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/components/CartContext';
import { SessionProvider, useSession } from '@/components/SessionContext';
import toast from 'react-hot-toast';
import ThemeWrapper from '@/components/themes/ThemeWrapper';

interface MenuItemLite {
  businessId: string;
  name: string;
  price: number;
  imageUrl?: string;
  ingredients?: string[];
  allergens?: string[];
  category?: string;
  isPregnancySafe?: boolean;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  mentionedItem?: MenuItemLite;
  quickReplies?: { text: string; label?: string }[];
}

// Helper function to clean trailing 0s from array fields
function cleanArrayField(arr: string[]): string[] {
  if (!arr || !Array.isArray(arr)) return arr;
  return arr.map(str => {
    // Clean each string in the array
    const parts = str.split(',').map(part => {
      return part.replace(/([^\d])0+$/g, '$1').trim();
    });
    let cleaned = parts.join(', ');
    cleaned = cleaned.replace(/[\s,]*0+[\s,]*$/g, '');
    cleaned = cleaned.replace(/\s*,\s*,/g, ',').replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/^,|,$/g, '');
    return cleaned;
  }).filter(Boolean);
}

function ChatPageContent({
  businessId,
  tableId,
}: {
  businessId: string;
  tableId: string;
}) {
  const router = useRouter();
  const { items, addItem, removeItem, clear } = useCart();
  const { session, markOrderConfirmed, markCartUpdated, updateSession, isSessionValid } = useSession();
  const [sessionExpired, setSessionExpired] = useState(false);
  
  // Initialize with welcome message (same for server and client to avoid hydration error)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content:
        'היי! אני העוזר החכם של המסעדה. אני יודע מה הוספתם להזמנה. אפשר לשאול אותי על אלרגיות, מרכיבים או שינויים במנות, ואני אעזור לכם לסיים את ההזמנה בצורה בטוחה ונוחה.',
      quickReplies: [
        { text: 'לסגור את ההזמנה', label: 'לסגור את ההזמנה' },
        { text: 'להמשיך בצ\'אט', label: 'להמשיך בצ\'אט' },
      ],
    },
  ]);
  
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Get storage key for AI history - uses deviceId if available, otherwise falls back to tableId
  const getChatStorageKey = () => {
    const deviceId = session?.deviceId;
    // Use deviceId for AI history persistence across sessions, fallback to tableId for backward compatibility
    return deviceId 
      ? `chat_messages_${businessId}_${deviceId}`
      : `chat_messages_${businessId}_${tableId}`;
  };
  
  // Load messages from localStorage after hydration (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    
    if (!session) return; // Wait for session to load
    
    const storageKey = getChatStorageKey();
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Backward compatibility: handle old format (just array) and new format (object with messages and sessionStart)
        let messagesArray: Message[] = [];
        let storedSessionStart: number | null = null;
        
        if (Array.isArray(parsed)) {
          // Old format - just array of messages
          messagesArray = parsed;
        } else if (parsed.messages && Array.isArray(parsed.messages)) {
          // New format - object with messages and sessionStart
          messagesArray = parsed.messages;
          storedSessionStart = parsed.sessionStart || null;
        }
        
        // Check if stored messages belong to current session
        // If sessionStart doesn't match, clear old messages (new session after expiration)
        if (storedSessionStart !== null && storedSessionStart !== session.sessionStart) {
          // Session changed - clear old messages
          localStorage.removeItem(storageKey);
          // Keep welcome message
          const welcomeMessage: Message = {
            id: Date.now(),
            role: 'assistant',
            content:
              'היי! אני העוזר החכם של המסעדה. אני יודע מה הוספתם להזמנה. אפשר לשאול אותי על אלרגיות, מרכיבים או שינויים במנות, ואני אעזור לכם לסיים את ההזמנה בצורה בטוחה ונוחה.',
            quickReplies: [
              { text: 'לסגור את ההזמנה', label: 'לסגור את ההזמנה' },
              { text: 'להמשיך בצ\'אט', label: 'להמשיך בצ\'אט' },
            ],
          };
          setMessages([welcomeMessage]);
          return;
        }
        
        // Check if messages are not too old (24 hours)
        if (messagesArray.length > 0) {
          setMessages(messagesArray);
        }
      } catch (e) {
        // Invalid stored data
      }
    }
  }, [businessId, tableId, session?.deviceId, session?.sessionStart]);

  // Track chat entry when page loads
  useEffect(() => {
    if (!businessId || !tableId) return;

    // Track chat entry (fire and forget - don't wait for response)
    fetch('/api/chat/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId,
        tableId,
      }),
    }).catch((err) => {
      // Silently fail - tracking is not critical
      console.error('Failed to track chat entry:', err);
    });
  }, [businessId, tableId]);
  
  // Save messages to localStorage whenever they change (only after hydration)
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined' || !session) return;
    
    const storageKey = getChatStorageKey();
    // Store messages with sessionStart to detect session changes
    localStorage.setItem(storageKey, JSON.stringify({
      messages: messages,
      sessionStart: session.sessionStart, // Store sessionStart to detect new sessions
    }));
  }, [messages, businessId, tableId, isHydrated, session?.deviceId, session?.sessionStart]);
  const [input, setInput] = useState('');
  const [isFinalReady, setIsFinalReady] = useState(false);
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<{
    name: string;
    logoUrl?: string;
    template: string;
  } | null>(null);

  const [menuItems, setMenuItems] = useState<MenuItemLite[]>([]);
  const [fullMenuItems, setFullMenuItems] = useState<MenuItemLite[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check session validity on page load
  // CRITICAL: Check session directly from localStorage on page load to catch expiration
  // even if the phone was closed and reopened after 1 hour
  useEffect(() => {
    // Check session from localStorage immediately on page load
    const checkSessionFromStorage = () => {
      if (typeof window === 'undefined') return false;
      
      const storageKey = `session_${businessId}_${tableId}`;
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) return false;
      
      try {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        const sessionAge = now - parsed.sessionStart;
        const maxAge = 60 * 60 * 1000; // 1 hour
        
        if (sessionAge >= maxAge) {
          // Session expired - remove it and return true (expired)
          localStorage.removeItem(storageKey);
          return true;
        }
        
        return false; // Session is valid
      } catch (e) {
        return false;
      }
    };
    
    // Check immediately on page load
    if (checkSessionFromStorage()) {
      setSessionExpired(true);
      toast.error('הקישור פג תוקף. אנא סרוק את קוד ה-QR מחדש כדי להזמין.');
      return;
    }
    
    // Also check using the session from state if available
    if (session && isSessionValid && !isSessionValid()) {
      setSessionExpired(true);
      toast.error('הקישור פג תוקף. אנא סרוק את קוד ה-QR מחדש כדי להזמין.');
    }
  }, [session, isSessionValid, businessId, tableId]);

  useEffect(() => {
    async function loadData() {
      try {
        // Load business info (for theme)
        const infoRes = await fetch(`/api/menu/info?businessId=${encodeURIComponent(businessId)}`);
        if (infoRes.ok) {
          const infoData = await infoRes.json();
          
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

          // CRITICAL: Use cached template if it's newer than 5 minutes old
          // This ensures we use the data we know was saved, not stale read replica data
          let finalTemplate = infoData.template || 'generic';
          if (cachedTemplate && cachedTemplateTimestamp > Date.now() - 5 * 60 * 1000) {
            // Cached data is recent (less than 5 minutes old), use it instead of API data
            finalTemplate = cachedTemplate;
            console.log('✅ Using cached template from localStorage (source of truth):', {
              template: finalTemplate,
              cachedAge: Date.now() - cachedTemplateTimestamp,
            });
          }

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
              logoUrl: finalLogoUrl, // Use cached or API data
              template: finalTemplate, // Use cached or API data
            };

            if (!prev) return newBusinessInfo;

            // Deep comparison to check if anything actually changed
            const nameChanged = prev.name !== newBusinessInfo.name;
            const logoChanged = prev.logoUrl !== newBusinessInfo.logoUrl;
            const templateChanged = prev.template !== newBusinessInfo.template;

            // If nothing changed, return previous to prevent re-render
            if (!nameChanged && !logoChanged && !templateChanged) {
              return prev;
            }

            return newBusinessInfo;
          });
        }

        // Load menu items
        const res = await fetch(`/api/menu?businessId=${encodeURIComponent(businessId)}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.items)) {
          // Filter out hidden items (isHidden = true) from customer menu
          const visibleItems = data.items.filter((item: any) => !item.isHidden);
          
          // נשמור רק את מה שצריך לעגלה
          const mapped = visibleItems.map((item: any) => ({
            businessId: item.businessId,
            name: item.name,
            price: item.price,
          }));
          setMenuItems(mapped);
          
          // נשמור את כל הפרטים להצגת מנות
          const fullMapped = visibleItems.map((item: any) => ({
            businessId: item.businessId,
            name: item.name,
            price: item.price,
            imageUrl: item.imageUrl,
            ingredients: item.ingredients,
            allergens: item.allergens,
            category: item.category,
            isPregnancySafe: item.isPregnancySafe,
          }));
          setFullMenuItems(fullMapped);
        }
      } catch (err) {
        console.error('Failed to load data for chat', err);
      }
    }
    loadData();
  }, [businessId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when entering chat
  useEffect(() => {
    if (typeof window === 'undefined' || messages.length === 0) return;
    
    const lastReadKey = `chat_last_read_${businessId}_${tableId}`;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      localStorage.setItem(lastReadKey, lastMessage.id.toString());
    }
  }, [businessId, tableId, messages]);

  // "Is everything okay?" check - after order confirmation, only when user returns
  useEffect(() => {
    if (!session || !session.lastOrderTime || session.everythingOkayShown) return;

    const now = Date.now();
    const timeSinceOrder = now - session.lastOrderTime;
    const checkInterval = 10 * 60 * 1000; // 10 minutes

    // Only show if 10+ minutes have passed since order
    if (timeSinceOrder >= checkInterval) {
      const checkMessage: Message = {
        id: Date.now(),
        role: 'assistant',
        content: 'הכל בסדר עם ההזמנה? יש משהו שחסר או שצריך לשנות?',
      };
      setMessages((prev) => [...prev, checkMessage]);
      updateSession({ everythingOkayShown: true });
    }
  }, [session, updateSession]);

  // Incomplete order detection - if cart has items but no order for X minutes
  useEffect(() => {
    if (!session || items.length === 0 || session.incompleteOrderShown) return;

    // Check if there's an incomplete order (items in cart, no confirmed order)
    if (session.orderStatus === 'in_progress' && session.lastCartUpdate) {
      const now = Date.now();
      const timeSinceCartUpdate = now - session.lastCartUpdate;
      const incompleteThreshold = 10 * 60 * 1000; // 10 minutes

      if (timeSinceCartUpdate >= incompleteThreshold) {
        const incompleteMessage: Message = {
          id: Date.now(),
          role: 'assistant',
          content: 'ראיתי שהייתם באמצע הזמנה. רוצים להמשיך? אני כאן לעזור!',
        };
        setMessages((prev) => [...prev, incompleteMessage]);
        updateSession({ incompleteOrderShown: true });
      }
    }
  }, [session, items.length, updateSession]);

  function applyActions(actions: any[]) {
    if (!Array.isArray(actions) || actions.length === 0) return;

    let addedCount = 0;
    let removedCount = 0;
    const addedItemsSummary: { name: string; quantity: number }[] = [];
    const removedItemsSummary: { name: string; quantity: number }[] = [];

    actions.forEach((action) => {
      if (action?.type === 'add_to_cart' && typeof action.itemName === 'string') {
        const quantity = typeof action.quantity === 'number' && action.quantity > 0 ? action.quantity : 1;
        const menuItem = menuItems.find((m) => m.name === action.itemName);
        if (!menuItem) {
          console.warn('AI requested add_to_cart for unknown item', action.itemName);
          return;
        }
        addItem({
          menuItemId: `${menuItem.businessId}-${menuItem.name}`,
          name: menuItem.name,
          price: menuItem.price,
          quantity,
          customizations: Array.isArray(action.customizations) ? action.customizations : undefined,
        });
        addedCount += quantity;
        const existingSummary = addedItemsSummary.find((i) => i.name === menuItem.name);
        if (existingSummary) {
          existingSummary.quantity += quantity;
        } else {
          addedItemsSummary.push({ name: menuItem.name, quantity });
        }
      } else if (action?.type === 'remove_from_cart' && typeof action.itemName === 'string') {
        const quantity = typeof action.quantity === 'number' && action.quantity > 0 ? action.quantity : 1;
        // Find the item in the current cart
        const cartItem = items.find((i) => i.name === action.itemName);
        if (!cartItem) {
          console.warn('AI requested remove_from_cart for item not in cart', action.itemName);
          return;
        }
        removeItem(cartItem.menuItemId, quantity);
        removedCount += quantity;
        const existingSummary = removedItemsSummary.find((i) => i.name === cartItem.name);
        if (existingSummary) {
          existingSummary.quantity += quantity;
        } else {
          removedItemsSummary.push({ name: cartItem.name, quantity });
        }
      }
    });

    if (addedCount > 0 || removedCount > 0) {
      // GUARDRAIL: If changes were made after a summary, reset confirmation state
      // The AI should provide a new summary in its next response
      setIsFinalReady(false);
      setLastSummary(null);
      markCartUpdated();

      const summaryParts: string[] = [];
      if (addedItemsSummary.length > 0) {
        const itemsText = addedItemsSummary
          .map((i) => `${i.name} × ${i.quantity}`)
          .join(', ');
        summaryParts.push(`הוספתי: ${itemsText}`);
      }
      if (removedItemsSummary.length > 0) {
        const itemsText = removedItemsSummary
          .map((i) => `${i.name} × ${i.quantity}`)
          .join(', ');
        summaryParts.push(`הסרתי: ${itemsText}`);
      }

      toast.success(`עדכנתי את ההזמנה לפי הבקשה לצ'אט.`);

      const assistantMessage: Message = {
        id: Date.now() + 2,
        role: 'assistant',
        content: `${summaryParts.join('. ')}.\nאני אכין סיכום מעודכן של ההזמנה.`,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    }
  }

  function handleQuickReplyClick(buttonText: string) {
    // Handle special quick reply buttons
    if (buttonText === 'לסגור את ההזמנה') {
      // Request order summary from AI
      if (items.length > 0) {
        // If there are items in cart, ask AI for summary
        sendMessageWithText('תראה לי סיכום של ההזמנה שלי');
      } else {
        // If no items, navigate to menu page
        router.push(`/menu/${businessId}/${tableId}`);
      }
      return;
    }
    
    // For other buttons, send as regular message
    sendMessageWithText(buttonText);
  }

  async function sendMessageWithText(messageText: string) {
    if (!messageText.trim() || loading) return;

    // Check if session is still valid - check from localStorage first (more reliable)
    const checkSessionFromStorage = () => {
      if (typeof window === 'undefined') return false;
      
      const storageKey = `session_${businessId}_${tableId}`;
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) return false;
      
      try {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        const sessionAge = now - parsed.sessionStart;
        const maxAge = 60 * 60 * 1000; // 1 hour
        
        if (sessionAge >= maxAge) {
          // Session expired - remove it and return true (expired)
          localStorage.removeItem(storageKey);
          return true;
        }
        
        return false; // Session is valid
      } catch (e) {
        return false;
      }
    };
    
    // Check from localStorage first
    if (checkSessionFromStorage()) {
      toast.error('הקישור פג תוקף. אנא סרוק את קוד ה-QR מחדש כדי להזמין.');
      setSessionExpired(true);
      return;
    }
    
    // Also check using the session from state if available
    if (!isSessionValid || !isSessionValid()) {
      toast.error('הקישור פג תוקף. אנא סרוק את קוד ה-QR מחדש כדי להזמין.');
      setSessionExpired(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: messageText,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          tableId,
          cart: items,
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      const reply = data.reply ?? 'מצטער, משהו השתבש.';

      // Find the mentioned item in full menu items
      let mentionedItem: MenuItemLite | undefined;
      
      console.log('🔍 Frontend: Received data.mentionedItem:', data.mentionedItem);
      console.log('🔍 Frontend: Received data.actions:', data.actions);
      console.log('🔍 Frontend: fullMenuItems count:', fullMenuItems.length);
      
      // First, try to find in fullMenuItems (which has all fields including imageUrl from /api/menu)
      // This is the most reliable source for complete item data
      if (data.mentionedItem) {
        console.log('🔍 Frontend: Searching in fullMenuItems for:', data.mentionedItem.name);
        // Try exact match first
        mentionedItem = fullMenuItems.find(
          (m) => m.name.toLowerCase() === data.mentionedItem.name.toLowerCase(),
        );
        // Try match without spaces
        if (!mentionedItem) {
          const itemNameNoSpaces = data.mentionedItem.name.toLowerCase().replace(/\s/g, '');
          mentionedItem = fullMenuItems.find(
            (m) => m.name.toLowerCase().replace(/\s/g, '') === itemNameNoSpaces,
          );
        }
        // Try partial match
        if (!mentionedItem) {
          mentionedItem = fullMenuItems.find(
            (m) => m.name.toLowerCase().includes(data.mentionedItem.name.toLowerCase()) || 
                  data.mentionedItem.name.toLowerCase().includes(m.name.toLowerCase()),
          );
        }
        if (mentionedItem) {
          console.log('✅ Frontend: Found in fullMenuItems:', mentionedItem.name, 'imageUrl:', mentionedItem.imageUrl);
        } else {
          console.warn('❌ Frontend: Not found in fullMenuItems, using data.mentionedItem as fallback');
          // Fallback to data.mentionedItem if not found in fullMenuItems
          mentionedItem = {
            businessId: data.mentionedItem.businessId || '',
            name: data.mentionedItem.name || '',
            price: data.mentionedItem.price || 0,
            imageUrl: data.mentionedItem.imageUrl || data.mentionedItem.image_url || undefined,
            ingredients: data.mentionedItem.ingredients ? cleanArrayField(data.mentionedItem.ingredients) : undefined,
            allergens: data.mentionedItem.allergens ? cleanArrayField(data.mentionedItem.allergens) : undefined,
            category: data.mentionedItem.category || undefined,
            isPregnancySafe: data.mentionedItem.isPregnancySafe || data.mentionedItem.is_pregnancy_safe || false,
          };
        }
      }
      
      // If mentionedItem not found but there's a show_item action, try to find it manually
      if (!mentionedItem && data.actions) {
        const showItemAction = data.actions.find((a: any) => a?.type === 'show_item');
        if (showItemAction?.itemName) {
          console.log('🔍 Frontend: Searching for show_item action:', showItemAction.itemName);
          const normalizedActionName = showItemAction.itemName.trim().toLowerCase();
          // Try exact match
          mentionedItem = fullMenuItems.find(
            (m) => m.name.toLowerCase().trim() === normalizedActionName,
          );
          // Try match without spaces
          if (!mentionedItem) {
            const actionNameNoSpaces = normalizedActionName.replace(/\s/g, '');
            mentionedItem = fullMenuItems.find(
              (m) => m.name.toLowerCase().replace(/\s/g, '') === actionNameNoSpaces,
            );
          }
          // Try partial match
          if (!mentionedItem) {
            mentionedItem = fullMenuItems.find(
              (m) => m.name.toLowerCase().includes(normalizedActionName) || 
                    normalizedActionName.includes(m.name.toLowerCase()),
            );
          }
          if (mentionedItem) {
            console.log('✅ Frontend: Found via show_item action:', mentionedItem.name, 'imageUrl:', mentionedItem.imageUrl);
          } else {
            console.warn('❌ Frontend: Not found via show_item action');
          }
        }
      }
      
      // If still not found but data.mentionedItem exists, use it as fallback (even if missing some fields)
      if (!mentionedItem && data.mentionedItem) {
        console.log('⚠️ Frontend: Using data.mentionedItem as fallback (may be missing imageUrl)');
        mentionedItem = {
          businessId: data.mentionedItem.businessId || '',
          name: data.mentionedItem.name || '',
          price: data.mentionedItem.price || 0,
          imageUrl: data.mentionedItem.imageUrl || data.mentionedItem.image_url || undefined,
          ingredients: data.mentionedItem.ingredients ? cleanArrayField(data.mentionedItem.ingredients) : undefined,
          allergens: data.mentionedItem.allergens ? cleanArrayField(data.mentionedItem.allergens) : undefined,
          category: data.mentionedItem.category || undefined,
          isPregnancySafe: data.mentionedItem.isPregnancySafe || data.mentionedItem.is_pregnancy_safe || false,
        };
      }
      
      console.log('📦 Frontend: Final mentionedItem:', mentionedItem ? { name: mentionedItem.name, imageUrl: mentionedItem.imageUrl } : 'null');

      // Extract quick_reply actions
      const quickReplies = data.actions
        ?.filter((a: any) => a.type === 'quick_reply')
        .map((a: any) => ({
          text: a.text || '',
          label: a.label || a.text || '',
        })) || [];

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: reply,
        mentionedItem,
        quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // GUARDRAIL: Check if this is a summary (contains structured order format)
      const isOrderSummary = reply.includes('סיכום') || reply.includes('סה"כ') || 
                             (reply.includes('×') && reply.match(/\d+\s*×/));
      
      if (isOrderSummary) {
        setLastSummary(reply);
        setIsFinalReady(true);
      }

      // GUARDRAIL: If user requested changes (actions were applied), reset confirmation state
      if (data.actions && data.actions.length > 0) {
        const hasCartChanges = data.actions.some(
          (a: any) => a.type === 'add_to_cart' || a.type === 'remove_from_cart'
        );
        
        if (hasCartChanges) {
          // User requested changes - require new summary and confirmation
          setIsFinalReady(false);
          setLastSummary(null);
          markCartUpdated();
        }
        
        applyActions(data.actions);
      }
    } catch (err) {
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'הייתה שגיאה בתקשורת עם ה-AI. אנא נסו שוב.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessageWithText(input);
    setInput('');
  }

  async function confirmOrder() {
    if (!items.length || !lastSummary) return;

    // Check if session is still valid
    if (!isSessionValid || !isSessionValid()) {
      toast.error('הקישור פג תוקף. אנא סרוק את קוד ה-QR מחדש כדי להזמין.');
      setSessionExpired(true);
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          tableId,
          items,
          aiSummary: lastSummary,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        markOrderConfirmed();
        clear();
        
        // GUARDRAIL: Post-confirmation lock - clear all confirmation state
        setIsFinalReady(false);
        setLastSummary(null);
        
        // Clear chat messages after order confirmation
        const welcomeMessage: Message = {
          id: Date.now(),
          role: 'assistant',
          content:
            'הזמנה אושרה בהצלחה! מזהה: ' + data.orderId.substring(0, 8) + '\n\nאם תרצו להזמין שוב, אני כאן לעזור!',
        };
        setMessages([welcomeMessage]);
        
        // Clear from localStorage
        if (typeof window !== 'undefined' && session) {
          const storageKey = getChatStorageKey();
          localStorage.setItem(storageKey, JSON.stringify({
            messages: [welcomeMessage],
            sessionStart: session.sessionStart, // Store sessionStart with messages
          }));
        }
        
        toast.success(`הזמנה אושרה! מזהה: ${data.orderId}`);
      } else {
        toast.error(data.message || 'נכשל ביצירת ההזמנה');
      }
    } catch (err) {
      toast.error('שגיאת רשת ביצירת ההזמנה');
    }
  }

  // Fixed menu style (removed menuStyle system)
  const menuStyle = {
    card: {
      base: 'flex flex-col rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-700 cursor-pointer',
      image: 'w-full h-56 rounded-[2rem] overflow-hidden bg-white/5 border border-white/5 mb-4 shadow-2xl flex-shrink-0',
      hover: 'hover:bg-white/[0.06] hover:border-white/20 hover:-translate-y-1',
      content: 'px-2',
    },
    button: {
      primary: 'rounded-full bg-white text-black px-8 py-3 text-sm font-light tracking-widest hover:bg-neutral-200 transition-all duration-500 uppercase',
      category: {
        active: 'bg-white text-black shadow-2xl scale-105',
        inactive: 'bg-transparent border border-white/10 hover:border-white/30 text-white/60',
      },
    },
    typography: {
      itemTitle: 'text-2xl font-light tracking-tight mb-2 text-white/95',
      itemDescription: 'text-sm text-white/50 mb-4 leading-relaxed font-light italic',
      price: 'text-xl font-light tracking-widest text-white/90',
      sectionTitle: 'text-3xl font-extralight tracking-[0.2em] mb-10 text-center uppercase text-white/40',
    },
    badge: {
      featured: 'text-[10px] tracking-[0.2em] uppercase text-amber-200/80 border border-amber-200/20 px-3 py-1 rounded-full mb-2 inline-block',
      pregnancy: 'text-[10px] tracking-[0.1em] text-emerald-200/70 border border-emerald-200/10 px-3 py-1 rounded-full inline-flex items-center gap-2',
      category: 'hidden',
    },
    spacing: {
      cardGap: 'gap-8',
      sectionGap: 'mb-20',
    },
    expanded: {
      container: 'bg-neutral-950/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] overflow-hidden flex flex-col relative h-full',
      image: 'relative max-h-[20vh] h-[20vh] w-full grayscale-[0.2] flex-shrink-0 overflow-hidden',
      content: 'flex-1 overflow-y-auto p-10 lg:p-16 text-center min-h-0',
      button: 'w-full rounded-full bg-white text-black py-5 text-sm font-light tracking-[0.3em] uppercase hover:tracking-[0.4em] transition-all duration-700',
    },
  };

  return (
    <ThemeWrapper template={businessInfo?.template || 'generic'}>
      <main className="fixed inset-0 flex flex-col overflow-hidden text-white bg-white/[0.02] backdrop-blur-3xl">
        {/* Header - Premium Glassmorphism */}
        <header className="relative z-20 px-6 py-6 border-b border-white/10 bg-white/[0.08] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px]"
                animate={{ 
                  boxShadow: ["0 0 20px rgba(139, 92, 246, 0.3)", "0 0 40px rgba(139, 92, 246, 0.6)", "0 0 20px rgba(139, 92, 246, 0.3)"]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center text-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  🤖
                </div>
              </motion.div>
              <div>
                <h1 className="text-lg font-light tracking-[0.15em] uppercase text-white/90">AI Assistant</h1>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] tracking-widest uppercase text-white/40">המערכת מחוברת ופעילה</span>
                </div>
              </div>
            </div>
            
            <Link
              href={`/menu/${businessId}/${tableId}`}
              className="p-3 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] transition-all group"
            >
              <motion.span 
                className="block text-xl text-white/60 group-hover:text-white"
                whileHover={{ x: -4 }}
              >
                ←
              </motion.span>
            </Link>
          </div>
        </header>

        {/* Session Expired Message */}
        {sessionExpired && (
          <motion.div
            className="mx-6 mt-6 rounded-[2rem] border border-yellow-500/30 bg-yellow-950/20 backdrop-blur-xl p-6 text-center"
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
              ניתן לצפות בהודעות, אך לא ניתן להזמין
            </p>
          </motion.div>
        )}

        {/* Messages Section - Scrollable */}
        <section className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scrollbar-hide no-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((m, index) => {
              // Check if this is an order summary message (don't show item cards in summaries)
              const isOrderSummary = m.content.includes('סיכום') || 
                                    m.content.includes('סה"כ') || 
                                    (m.content.includes('×') && m.content.match(/\d+\s*×/)) ||
                                    m.content.includes('סיכום ההזמנה');
              
              return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ 
                  type: "spring", 
                  damping: 25, 
                  stiffness: 300,
                  delay: index === messages.length - 1 ? 0.05 : 0 
                }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex flex-col gap-4 max-w-[85%] lg:max-w-[60%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Avatar / Role Indicator */}
                  <div className={`flex items-center gap-3 mb-1 px-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-light">
                      {m.role === 'user' ? 'לקוח' : 'עוזר חכם'}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`relative group rounded-[2rem] px-6 py-4 shadow-2xl transition-all duration-500 ${
                      m.role === 'assistant'
                        ? 'bg-white/[0.12] border border-white/10 text-white/90 rounded-tl-lg backdrop-blur-md'
                        : 'bg-white text-black font-medium rounded-tr-lg shadow-[0_0_40px_rgba(255,255,255,0.1)]'
                    }`}
                  >
                    <div className="text-base leading-relaxed whitespace-pre-wrap break-words font-light tracking-wide">
                      {m.content}
                    </div>
                  </div>
                  
                  {/* Quick Reply Buttons */}
                  {m.role === 'assistant' && m.quickReplies && m.quickReplies.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex flex-wrap gap-2 mt-2"
                    >
                      {m.quickReplies.map((button, idx) => (
                        <motion.button
                          key={idx}
                          onClick={() => handleQuickReplyClick(button.text)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-light tracking-wide hover:bg-white/20 hover:border-white/30 transition-all backdrop-blur-sm"
                        >
                          {button.text}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                  
                  {/* Show mentioned item card - Redesigned to be Premium */}
                  {/* Don't show item cards in order summary messages to avoid confusion */}
                  {m.role === 'assistant' && m.mentionedItem && !isOrderSummary && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`${menuStyle.card.base} ${menuStyle.card.hover} w-full max-w-[320px] shadow-3xl overflow-hidden mt-2`}
                    >
                      {/* Image Area */}
                      <div className={menuStyle.card.image}>
                        {m.mentionedItem.imageUrl ? (
                          <img
                            src={m.mentionedItem.imageUrl}
                            alt={m.mentionedItem.name}
                            className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">
                            🍽️
                          </div>
                        )}
                      </div>
                      
                      {/* Content Area */}
                      <div className={menuStyle.card.content}>
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h4 className={menuStyle.typography.itemTitle}>
                              {m.mentionedItem.name}
                            </h4>
                            {m.mentionedItem.category && (
                              <span className="text-[10px] tracking-[0.1em] uppercase text-white/40">
                                {m.mentionedItem.category}
                              </span>
                            )}
                          </div>
                          <span className={menuStyle.typography.price}>
                            ₪{m.mentionedItem.price.toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Ingredients */}
                        {m.mentionedItem.ingredients && m.mentionedItem.ingredients.length > 0 && (
                          <p className={menuStyle.typography.itemDescription}>
                            {m.mentionedItem.ingredients.join(', ')}
                          </p>
                        )}
                        
                        {/* Status Badges */}
                        {(m.mentionedItem.allergens?.length || m.mentionedItem.isPregnancySafe) && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {m.mentionedItem.allergens?.map(a => (
                              <span key={a} className="text-[9px] tracking-wider uppercase text-red-300/60 border border-red-300/10 px-2 py-0.5 rounded-full bg-red-300/5">
                                {a}
                              </span>
                            ))}
                            {m.mentionedItem.isPregnancySafe && (
                              <span className={menuStyle.badge.pregnancy}>
                                🤰 מתאים להריון
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Add to cart action */}
                        <motion.button
                          onClick={() => {
                            addItem({
                              menuItemId: `${businessId}-${m.mentionedItem!.name}`,
                              name: m.mentionedItem!.name,
                              price: m.mentionedItem!.price,
                            });
                            toast.success(`${m.mentionedItem!.name} נוסף לעגלה`);
                            markCartUpdated();
                          }}
                          className={`${menuStyle.button.primary} w-full`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          הוסף להזמנה
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
              );
            })}
          </AnimatePresence>
          
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] rounded-tl-sm px-6 py-4 backdrop-blur-sm">
                <div className="flex gap-2">
                  {[0, 0.2, 0.4].map((delay) => (
                    <motion.div
                      key={delay}
                      className="w-1.5 h-1.5 bg-white/40 rounded-full"
                      animate={{ 
                        opacity: [0.3, 1, 0.3],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ duration: 1, repeat: Infinity, delay }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </section>

        {/* Footer Area - Floating Style */}
        <footer className="relative z-30 px-6 pb-10 pt-4 bg-gradient-to-t from-black/40 via-black/20 to-transparent">
          <div className="max-w-4xl mx-auto space-y-4">
            <AnimatePresence>
              {isFinalReady && (
                <motion.button
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={confirmOrder}
                  className="w-full rounded-[2rem] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-5 text-sm font-light tracking-[0.3em] uppercase shadow-[0_20px_50px_rgba(16,185,129,0.2)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.4)] transition-all active:scale-95 flex items-center justify-center gap-4"
                >
                  <span className="text-xl">✓</span>
                  שלח הזמנה למטבח
                </motion.button>
              )}
            </AnimatePresence>

            <form onSubmit={sendMessage} className="relative flex items-center gap-3">
              <div className="relative flex-1 group">
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="איך אפשר לעזור?"
                  className="w-full relative rounded-[2rem] bg-white/[0.12] border border-white/10 px-8 py-5 text-base text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/[0.15] transition-all tracking-wide font-light"
                  autoFocus
                />
              </div>
              
              <motion.button
                type="submit"
                disabled={loading || !input.trim()}
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl disabled:opacity-20 disabled:grayscale transition-all hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-2xl transform rotate-180">←</span>
                )}
              </motion.button>
            </form>
          </div>
        </footer>
      </main>
    </ThemeWrapper>
  );
}

export default function ChatPage({
  params,
}: {
  params: { businessId: string; tableId: string };
}) {
  const { businessId, tableId } = params;
  
  return (
    <SessionProvider businessId={businessId} tableId={tableId}>
      <ChatPageContent businessId={businessId} tableId={tableId} />
    </SessionProvider>
  );
}

