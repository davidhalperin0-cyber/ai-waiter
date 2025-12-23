'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/components/CartContext';
import { SessionProvider, useSession } from '@/components/SessionContext';
import toast from 'react-hot-toast';
import { getMenuStyle, MenuStyleVariant } from '@/lib/menuStyle';
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
}

function ChatPageContent({
  businessId,
  tableId,
}: {
  businessId: string;
  tableId: string;
}) {
  const { items, addItem, removeItem, clear } = useCart();
  const { session, markOrderConfirmed, markCartUpdated, updateSession } = useSession();
  
  // Initialize with welcome message (same for server and client to avoid hydration error)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content:
        'היי! אני העוזר החכם של המסעדה. אני יודע מה הוספתם להזמנה. אפשר לשאול אותי על אלרגיות, מרכיבים או שינויים במנות, ואני אעזור לכם לסיים את ההזמנה בצורה בטוחה ונוחה.',
    },
  ]);
  
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Load messages from localStorage after hydration (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    
    const storageKey = `chat_messages_${businessId}_${tableId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check if messages are not too old (24 hours)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) {
        // Invalid stored data
      }
    }
  }, [businessId, tableId]);
  
  // Save messages to localStorage whenever they change (only after hydration)
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    
    const storageKey = `chat_messages_${businessId}_${tableId}`;
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, businessId, tableId, isHydrated]);
  const [input, setInput] = useState('');
  const [isFinalReady, setIsFinalReady] = useState(false);
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<{
    name: string;
    logoUrl?: string;
    template: string;
    menuStyle?: MenuStyleVariant;
  } | null>(null);

  const [menuItems, setMenuItems] = useState<MenuItemLite[]>([]);
  const [fullMenuItems, setFullMenuItems] = useState<MenuItemLite[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Load business info (for theme)
        const infoRes = await fetch(`/api/menu/info?businessId=${encodeURIComponent(businessId)}`);
        if (infoRes.ok) {
          const infoData = await infoRes.json();
          setBusinessInfo({
            name: infoData.name,
            logoUrl: infoData.logoUrl,
            template: infoData.template || 'generic',
            menuStyle: infoData.menuStyle || 'elegant',
          });
        }

        // Load menu items
        const res = await fetch(`/api/menu?businessId=${encodeURIComponent(businessId)}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.items)) {
          // נשמור רק את מה שצריך לעגלה
          const mapped = data.items.map((item: any) => ({
            businessId: item.businessId,
            name: item.name,
            price: item.price,
          }));
          setMenuItems(mapped);
          
          // נשמור את כל הפרטים להצגת מנות
          const fullMapped = data.items.map((item: any) => ({
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
    const checkInterval = 1 * 60 * 1000; // 1 minute (לבדיקה - לשנות חזרה ל-15 דקות אחרי)

    // Only show if 1+ minute has passed since order
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
        content: `${summaryParts.join('. ')}.\nיש עוד משהו שאפשר לעזור בו לפני שסוגרים את ההזמנה?`,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: input,
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
      if (data.mentionedItem) {
        mentionedItem = fullMenuItems.find(
          (m) => m.name.toLowerCase() === data.mentionedItem.name.toLowerCase(),
        );
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: reply,
        mentionedItem,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLastSummary(reply);
      setIsFinalReady(true);

      if (data.actions) {
        applyActions(data.actions);
        markCartUpdated();
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

  async function confirmOrder() {
    if (!items.length || !lastSummary) return;

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
        
        // Clear chat messages after order confirmation
        const welcomeMessage: Message = {
          id: Date.now(),
          role: 'assistant',
          content:
            'הזמנה אושרה בהצלחה! מזהה: ' + data.orderId.substring(0, 8) + '\n\nאם תרצו להזמין שוב, אני כאן לעזור!',
        };
        setMessages([welcomeMessage]);
        
        // Clear from localStorage
        if (typeof window !== 'undefined') {
          const storageKey = `chat_messages_${businessId}_${tableId}`;
          localStorage.setItem(storageKey, JSON.stringify([welcomeMessage]));
        }
        
        setIsFinalReady(false);
        setLastSummary(null);
        toast.success(`הזמנה אושרה! מזהה: ${data.orderId}`);
      } else {
        toast.error(data.message || 'נכשל ביצירת ההזמנה');
      }
    } catch (err) {
      toast.error('שגיאת רשת ביצירת ההזמנה');
    }
  }

  const menuStyle = useMemo(() => {
    return getMenuStyle(businessInfo?.menuStyle || 'elegant');
  }, [businessInfo?.menuStyle]);

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

        {/* Messages Section - Scrollable */}
        <section className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scrollbar-hide no-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((m, index) => (
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
                  
                  {/* Show mentioned item card - Redesigned to be Premium */}
                  {m.role === 'assistant' && m.mentionedItem && (
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
            ))}
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

