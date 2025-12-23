'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

interface DashboardMenuItem {
  businessId: string;
  category: string;
  name: string;
  price: number;
  imageUrl?: string;
  ingredients?: string[];
  allergens?: string[];
  customizationOptions?: string[];
  isFeatured?: boolean;
  isPregnancySafe?: boolean;
  isBusiness?: boolean;
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
  const [activeTab, setActiveTab] = useState<'menu' | 'tables' | 'settings' | 'printer' | 'orders'>('menu');
  const [businessInfo, setBusinessInfo] = useState<{
    name: string;
    type: string;
    template: string;
    menuStyle?: string;
    logoUrl?: string;
    aiInstructions?: string;
    subscription?: {
      status: string;
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
  } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [revenueStats, setRevenueStats] = useState<{
    today: number;
    week: number;
    month: number;
  } | null>(null);
  const [editingItem, setEditingItem] = useState<DashboardMenuItem | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({
    category: '',
    name: '',
    price: '',
    imageUrl: '',
    ingredients: '',
    allergens: '',
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

  useEffect(() => {
    if (businessId && activeTab === 'orders') {
      loadOrders();
    }
  }, [businessId, activeTab]);

  async function loadBusinessInfo() {
    if (!businessId) return;
    try {
      const res = await fetch(`/api/business/info?businessId=${encodeURIComponent(businessId)}`);
      const data = await res.json();
      if (res.ok && data.business) {
        setBusinessInfo({
          name: data.business.name,
          logoUrl: data.business.logoUrl || '',
          type: data.business.type,
          template: data.business.template,
          menuStyle: data.business.menuStyle || 'elegant',
          aiInstructions: data.business.aiInstructions || '',
          businessHours: data.business.businessHours || null,
          subscription: data.business.subscription,
          printerConfig: data.business.printerConfig || {
            enabled: false,
            type: 'http',
            endpoint: '',
            payloadType: 'json',
          },
          posConfig: data.business.posConfig || {
            enabled: false,
            provider: 'generic',
            endpoint: '',
            method: 'POST',
            headers: {},
            timeoutMs: 5000,
          },
        });
      }
    } catch (err) {
      console.error('Failed to load business info', err);
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
    } catch (err: any) {
      setError(err.message || 'נכשל בטעינת הזמנות');
    } finally {
      setLoading(false);
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

      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          category: newItem.category,
          name: newItem.name,
          price: priceNumber,
          imageUrl: newItem.imageUrl || undefined,
          ingredients: ingredients.length > 0 ? ingredients : undefined,
          allergens: allergens.length > 0 ? allergens : undefined,
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
        name: '',
        price: '',
        imageUrl: '',
        ingredients: '',
        allergens: '',
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
      name: item.name,
      price: item.price.toString(),
      imageUrl: item.imageUrl || '',
      ingredients: item.ingredients?.join(', ') || '',
      allergens: item.allergens?.join(', ') || '',
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

      const res = await fetch(`/api/menu/${encodeURIComponent(editingItem.name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          category: newItem.category,
          name: newItem.name,
          price: priceNumber,
          imageUrl: newItem.imageUrl || undefined,
          ingredients: ingredients.length > 0 ? ingredients : undefined,
          allergens: allergens.length > 0 ? allergens : undefined,
          isFeatured: newItem.isFeatured,
          isPregnancySafe: newItem.isPregnancySafe,
          isBusiness: newItem.isBusiness,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'נכשל בעדכון פריט');
      }
      setEditingItem(null);
      setNewItem({
        category: '',
        name: '',
        price: '',
        imageUrl: '',
        ingredients: '',
        allergens: '',
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
      name: '',
      price: '',
      imageUrl: '',
      ingredients: '',
      allergens: '',
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

  async function handleAddTable(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId || !newTable.tableId || !newTable.label) return;

    // בדיקה מול המנוי: אם יש מגבלה על מספר השולחנות – לא מאפשרים לעבור אותה
    const tablesAllowed = businessInfo?.subscription?.tablesAllowed;
    if (typeof tablesAllowed === 'number' && tables.length >= tablesAllowed) {
      toast.error('הגעת למספר המקסימלי של שולחנות במנוי. פנו למנהל המערכת להגדלת המנוי.');
      return;
    }

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
      const url = `${window.location.origin}/menu/${businessId}/${tableId}`;
      const dataUrl = await QRCode.toDataURL(url);
      setQrDataUrl(dataUrl);
      setSelectedTable(tableId);
    } catch (err) {
      setError('נכשל ביצירת קוד QR');
    }
  }

  if (!businessId) {
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
        <p className="text-red-400">מזהה עסק לא נמצא. אנא התחברו שוב.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold mb-2">לוח בקרה עסקי</h1>
        <p className="text-neutral-400 text-sm">
          נהלו את התפריט, השולחנות וקודי QR, מדפסת, וצפו בהזמנות והכנסות.
        </p>
      </header>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-500/40 rounded px-3 py-2">
          {error}
        </p>
      )}

      {/* Subscription Warning Banner */}
      {businessInfo?.subscription && 
       (businessInfo.subscription.status === 'expired' || businessInfo.subscription.status === 'past_due') && (
        <div className="bg-yellow-900/40 border-2 border-yellow-500/50 rounded-lg p-4 mb-4">
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

      <div className="flex gap-2 border-b border-neutral-800 mb-4">
        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 text-sm font-semibold ${
            activeTab === 'menu'
              ? 'border-b-2 border-white text-white'
              : 'text-neutral-400'
          }`}
        >
          ניהול תפריט
        </button>
        <button
          onClick={() => setActiveTab('tables')}
          className={`px-4 py-2 text-sm font-semibold ${
            activeTab === 'tables'
              ? 'border-b-2 border-white text-white'
              : 'text-neutral-400'
          }`}
        >
          שולחנות וקודי QR
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-sm font-semibold ${
            activeTab === 'settings'
              ? 'border-b-2 border-white text-white'
              : 'text-neutral-400'
          }`}
        >
          הגדרות עסק
        </button>
        <button
          onClick={() => setActiveTab('printer')}
          className={`px-4 py-2 text-sm font-semibold ${
            activeTab === 'printer'
              ? 'border-b-2 border-white text-white'
              : 'text-neutral-400'
          }`}
        >
          הגדרות מדפסת
        </button>
        <button
          onClick={() => setActiveTab('pos')}
          className={`px-4 py-2 text-sm font-semibold ${
            activeTab === 'pos'
              ? 'border-b-2 border-white text-white'
              : 'text-neutral-400'
          }`}
        >
          אינטגרציית POS
        </button>
        <button
          onClick={() => {
            setActiveTab('orders');
            if (businessId) loadOrders();
          }}
          className={`px-4 py-2 text-sm font-semibold ${
            activeTab === 'orders'
              ? 'border-b-2 border-white text-white'
              : 'text-neutral-400'
          }`}
        >
          הזמנות ורווחים
        </button>
      </div>

      {activeTab === 'menu' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">ניהול תפריט</h2>
              <p className="text-xs text-neutral-400 mb-3">
                צרו ועדכנו קטגוריות, פריטים, מרכיבים, אלרגנים והתאמות אישיות.
              </p>
            </div>
            {tables.length > 0 && businessId && (
              <a
                href={`/menu/${businessId}/${tables[0].tableId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-400 hover:text-green-300 border border-green-400/40 px-3 py-1 rounded"
              >
                → צפה בתפריט לקוח
              </a>
            )}
          </div>

          <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="space-y-3 mb-4 text-xs border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[120px]">
                <label className="block mb-1 text-neutral-300">קטגוריה</label>
                <input
                  value={newItem.category}
                  onChange={(e) => setNewItem((v) => ({ ...v, category: e.target.value }))}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1"
                  placeholder="למשל: עיקריות"
                  required
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block mb-1 text-neutral-300">שם</label>
                <input
                  value={newItem.name}
                  onChange={(e) => setNewItem((v) => ({ ...v, name: e.target.value }))}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1"
                  placeholder="למשל: פיצה מרגריטה"
                  required
                />
              </div>
              <div className="w-24">
                <label className="block mb-1 text-neutral-300">מחיר</label>
                <input
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem((v) => ({ ...v, price: e.target.value }))}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1"
                  placeholder="12.5"
                  required
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block mb-1 text-neutral-300">URL תמונה (אופציונלי)</label>
                <input
                  type="url"
                  value={newItem.imageUrl}
                  onChange={(e) => setNewItem((v) => ({ ...v, imageUrl: e.target.value }))}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block mb-1 text-neutral-300">מרכיבים (מופרדים בפסיקים)</label>
                <input
                  value={newItem.ingredients}
                  onChange={(e) => setNewItem((v) => ({ ...v, ingredients: e.target.value }))}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1"
                  placeholder="למשל: עגבניות, מוצרלה, בזיליקום"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block mb-1 text-neutral-300">אלרגנים (מופרדים בפסיקים)</label>
                <input
                  value={newItem.allergens}
                  onChange={(e) => setNewItem((v) => ({ ...v, allergens: e.target.value }))}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1"
                  placeholder="למשל: גלוטן, חלב"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mb-2 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newItem.isPregnancySafe}
                  onChange={(e) => setNewItem((v) => ({ ...v, isPregnancySafe: e.target.checked }))}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-white"
                />
                <span className="text-sm text-neutral-300">🤰 מתאים להריון</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newItem.isBusiness}
                  onChange={(e) => setNewItem((v) => ({ ...v, isBusiness: e.target.checked }))}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-white"
                />
                <span className="text-sm text-neutral-300">💼 מנה עסקית</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-white text-black px-3 py-2 text-xs font-semibold disabled:opacity-60"
              >
                {loading ? 'שומר...' : editingItem ? 'עדכן פריט' : 'הוסף פריט'}
              </button>
              {editingItem && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-md bg-neutral-700 text-white px-3 py-2 text-xs font-semibold hover:bg-neutral-600"
                >
                  ביטול
                </button>
              )}
            </div>
          </form>

          <div className="border border-neutral-800 rounded-lg overflow-hidden">
            <div className="bg-neutral-900/70 text-[11px] text-neutral-400 px-3 py-2">
              רשימת פריטים
            </div>
            <div className="divide-y divide-neutral-800 text-xs">
              {items.length === 0 && (
                <div className="px-3 py-3 text-neutral-500 text-[11px]">
                  עדיין אין פריטים. צרו את הפריט הראשון שלכם למעלה.
                </div>
              )}
              {items.map((item) => (
                <div
                  key={`${item.businessId}-${item.name}`}
                  className="px-3 py-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        {item.isFeatured && (
                          <span className="text-[10px] text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded">
                            ⭐ מומלץ
                          </span>
                        )}
                        {item.isBusiness && (
                          <span className="text-[10px] text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded">
                            💼 עסקי
                          </span>
                        )}
                        <span className="font-semibold">{item.name}</span>
                        <span className="text-white">₪{item.price.toFixed(2)}</span>
                      </div>
                      {item.imageUrl && (
                        <div className="mb-1">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-16 w-16 object-cover rounded border border-neutral-700"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {item.ingredients && item.ingredients.length > 0 && (
                        <p className="text-[11px] text-neutral-400 mb-1">
                          <span className="text-neutral-500">מרכיבים:</span> {item.ingredients.join(', ')}
                        </p>
                      )}
                      {item.allergens && item.allergens.length > 0 && (
                        <p className="text-[11px] text-red-400">
                          <span className="text-neutral-500">אלרגנים:</span> {item.allergens.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleFeatured(item)}
                        className={`text-[11px] px-2 py-1 rounded ${
                          item.isFeatured
                            ? 'text-yellow-400 bg-yellow-900/30 hover:bg-yellow-900/40'
                            : 'text-neutral-400 bg-neutral-800 hover:bg-neutral-700'
                        }`}
                        title={item.isFeatured ? 'הסר ממומלצות' : 'סמן כמומלץ'}
                      >
                        ⭐
                      </button>
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-[11px] text-white bg-neutral-700 px-2 py-1 rounded hover:bg-neutral-600"
                      >
                        ערוך
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.name)}
                        className="text-[11px] text-red-400 hover:text-red-300"
                      >
                        מחק
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
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">שולחנות וקודי QR</h2>
          <p className="text-xs text-neutral-400 mb-3">
            הגדירו שולחנות ויצרו קודי QR אוטומטיים לכל שולחן.
          </p>

          <form onSubmit={handleAddTable} className="space-y-3 mb-4 text-xs border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
            <div className="mb-2">
              <p className="text-[10px] text-neutral-400 mb-3">
                <strong className="text-neutral-300">מזהה שולחן</strong> - מזהה טכני ייחודי (ללא רווחים, למשל: table-1, bar-1)
                <br />
                <strong className="text-neutral-300">תווית</strong> - השם שהלקוח רואה (יכול להיות בעברית, למשל: שולחן 1, בר 1)
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[140px]">
                <label className="block mb-1 text-neutral-300">
                  מזהה שולחן <span className="text-neutral-500 text-[10px]">(ייחודי, ללא רווחים)</span>
                </label>
                <input
                  value={newTable.tableId}
                  onChange={(e) => setNewTable((v) => ({ ...v, tableId: e.target.value.replace(/\s+/g, '-') }))}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1"
                  placeholder="table-1"
                  required
                  pattern="[a-zA-Z0-9-_]+"
                  title="רק אותיות, מספרים, מקפים ותחתונים (ללא רווחים)"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block mb-1 text-neutral-300">
                  תווית <span className="text-neutral-500 text-[10px]">(מה שהלקוח רואה)</span>
                </label>
                <input
                  value={newTable.label}
                  onChange={(e) => setNewTable((v) => ({ ...v, label: e.target.value }))}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1"
                  placeholder="שולחן 1"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-white text-black px-3 py-2 text-xs font-semibold disabled:opacity-60"
              >
                {loading ? 'שומר...' : 'הוסף שולחן'}
              </button>
            </div>
          </form>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-neutral-800 rounded-lg overflow-hidden">
              <div className="bg-neutral-900/70 text-[11px] text-neutral-400 px-3 py-2">
                שולחנות
              </div>
              <div className="divide-y divide-neutral-800 text-xs">
                {tables.length === 0 && (
                  <div className="px-3 py-3 text-neutral-500 text-[11px]">
                    עדיין אין שולחנות. צרו את השולחן הראשון שלכם למעלה.
                  </div>
                )}
                {tables.map((table) => (
                  <div
                    key={`${table.businessId}-${table.tableId}`}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <div>
                      <div className="font-semibold">{table.label}</div>
                      <div className="text-neutral-400 text-[11px]">{table.tableId}</div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/menu/${businessId}/${table.tableId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-white bg-green-600 px-2 py-1 rounded hover:bg-green-500"
                      >
                        צפה בתפריט
                      </a>
                      <button
                        onClick={() => generateQR(table.tableId)}
                        className="text-[11px] text-white bg-neutral-700 px-2 py-1 rounded hover:bg-neutral-600"
                      >
                        צפה ב-QR
                      </button>
                      <button
                        onClick={() => handleDeleteTable(table.tableId)}
                        className="text-[11px] text-red-400 hover:text-red-300"
                      >
                        מחק
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {qrDataUrl && selectedTable ? (
              <div className="border border-neutral-800 rounded-lg p-4 space-y-3">
                <div className="bg-green-950/30 border border-green-500/40 rounded px-3 py-2 mb-3">
                  <h3 className="text-sm font-semibold text-green-400 mb-1">
                    ✅ קוד QR מוכן להדפסה
                  </h3>
                  <p className="text-[10px] text-green-300/80">
                    עבור: {tables.find((t) => t.tableId === selectedTable)?.label}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white p-3 rounded-lg">
                    <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                  </div>
                  <div className="flex gap-2 w-full">
                    <a
                      href={qrDataUrl}
                      download={`qr-${selectedTable}.png`}
                      className="flex-1 text-xs text-center text-white bg-green-600 px-3 py-2 rounded hover:bg-green-500 font-semibold"
                    >
                      📥 הורד QR להדפסה
                    </a>
                  </div>
                  <p className="text-[10px] text-neutral-400 text-center">
                    הדפיסו את הקוד והניחו אותו על השולחן.<br />
                    הלקוחות יסרקו את הקוד עם הטלפון ויגיעו ישירות לתפריט.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-800">
                  <p className="text-[10px] text-neutral-400 mb-1">קישור ישיר לתפריט:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      id={`menu-url-${selectedTable}`}
                      value={businessId && selectedTable ? `/menu/${businessId}/${selectedTable}` : ''}
                      className="flex-1 text-[10px] bg-neutral-900 border border-neutral-700 px-2 py-1 rounded text-neutral-300"
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
                      className="text-[10px] text-white bg-neutral-700 px-2 py-1 rounded hover:bg-neutral-600"
                    >
                      העתק
                    </button>
                  </div>
                  <a
                    href={`/menu/${businessId}/${selectedTable}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-2 text-xs text-green-400 hover:text-green-300 text-center"
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

      {activeTab === 'settings' && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">הגדרות עסק</h2>
          <p className="text-xs text-neutral-400 mb-3">
            ניהול פרטי העסק, סטטוס המנוי והגדרות התנהגות ה-AI.
          </p>

          {/* Subscription Overview + Billing */}
          {businessInfo?.subscription && (
            <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/60 text-xs flex flex-col gap-3">
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
                  <div className="text-[11px] text-neutral-400 mb-1">שולחנות בתוכנית</div>
                  <div className="text-sm font-semibold">
                    {tables.length}/{businessInfo.subscription.tablesAllowed ?? 'לא מוגבל'}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {businessInfo.subscription.tablesAllowed &&
                    tables.length > businessInfo.subscription.tablesAllowed
                      ? 'חריגה ממספר השולחנות המותרים'
                      : 'כולל כל השולחנות עם QR פעיל'}
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

              <BillingControls businessId={businessId} currentTablesAllowed={businessInfo.subscription.tablesAllowed} />
            </div>
          )}

          {businessInfo && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!businessId) return;

                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const logoUrl = formData.get('logoUrl') as string;
                const type = formData.get('type') as string;
                const template = formData.get('template') as string;
                const menuStyle = formData.get('menuStyle') as string;
                const aiInstructions = formData.get('aiInstructions') as string;
                const businessHoursStart = formData.get('businessHoursStart') as string;
                const businessHoursEnd = formData.get('businessHoursEnd') as string;
                const businessHoursEnabled = formData.get('businessHoursEnabled') === 'on';

                // Build businessHours object
                let businessHours: { start: string; end: string } | null = null;
                if (businessHoursEnabled && businessHoursStart && businessHoursEnd) {
                  businessHours = {
                    start: businessHoursStart,
                    end: businessHoursEnd,
                  };
                }

                try {
                  setLoading(true);
                  setError(null);
                  const res = await fetch('/api/business/update', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      businessId,
                      name,
                      logoUrl: logoUrl || undefined,
                      type,
                      template,
                      menuStyle: menuStyle || undefined,
                      aiInstructions: aiInstructions || undefined,
                      businessHours: businessHours || null,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    throw new Error(data.message || 'נכשל בעדכון פרטי העסק');
                  }
                  setBusinessInfo({ 
                    name,
                    logoUrl: logoUrl || undefined,
                    type, 
                    template,
                    menuStyle: menuStyle || 'elegant', 
                    aiInstructions: aiInstructions || '',
                    businessHours: businessHours,
                    printerConfig: businessInfo.printerConfig,
                  });
                  toast.success('פרטי העסק עודכנו בהצלחה!');
                } catch (err: any) {
                  const message = err.message || 'נכשל בעדכון פרטי העסק';
                  setError(message);
                  toast.error(message);
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4 border border-neutral-800 rounded-lg p-4 bg-neutral-900/50 text-xs"
            >
              <div>
                <label className="block mb-1 text-neutral-300">שם העסק</label>
                <input
                  name="name"
                  defaultValue={businessInfo.name}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-neutral-300">
                  לוגו העסק (URL) <span className="text-neutral-500 text-xs">(אופציונלי)</span>
                </label>
                <input
                  name="logoUrl"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  defaultValue={businessInfo.logoUrl || ''}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  הזן URL של תמונת הלוגו. אם לא מוזן, יוצג שם העסק בטקסט.
                </p>
                {businessInfo.logoUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-neutral-400 mb-1">תצוגה מקדימה:</p>
                    <img
                      src={businessInfo.logoUrl}
                      alt="Logo preview"
                      className="max-h-20 max-w-full object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-1 text-neutral-300">סוג העסק</label>
                <select
                  name="type"
                  defaultValue={businessInfo.type}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                  required
                >
                  <option value="bar">בר</option>
                  <option value="pizza">פיצריה</option>
                  <option value="sushi">מסעדת סושי</option>
                  <option value="generic">מסעדה</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-neutral-300">תבנית עיצוב</label>
                <select
                  name="template"
                  defaultValue={businessInfo.template}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
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

              <div>
                <label className="block mb-1 text-neutral-300">סגנון תפריט</label>
                <select
                  name="menuStyle"
                  defaultValue={businessInfo.menuStyle || 'elegant'}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                >
                  <option value="elegant">אלגנטי - עיצוב מעודן ומרווח</option>
                  <option value="compact">קומפקטי - צפוף וחסכוני במקום</option>
                  <option value="bold">בולט - עיצוב חזק ומובלט</option>
                </select>
                <p className="text-xs text-neutral-400 mt-1">
                  משפיע על עיצוב הכרטיסים, הכפתורים והטיפוגרפיה בתפריט הלקוח
                </p>
              </div>

              <div>
                <label className="block mb-1 text-neutral-300">
                  💼 שעות פעילות למנות עסקיות
                </label>
                <p className="text-[10px] text-neutral-500 mb-2">
                  הגדירו שעות פעילות למנות עסקיות. מחוץ לשעות האלו, לקוחות לא יוכלו להזמין מנות עסקיות.
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="businessHoursEnabled"
                      defaultChecked={businessInfo.businessHours !== null && businessInfo.businessHours !== undefined}
                      className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-white"
                    />
                    <span className="text-sm text-neutral-300">הפעל הגבלת שעות</span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block mb-1 text-[10px] text-neutral-400">שעת התחלה</label>
                    <input
                      type="time"
                      name="businessHoursStart"
                      defaultValue={businessInfo.businessHours?.start || '10:00'}
                      className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1 text-[10px] text-neutral-400">שעת סיום</label>
                    <input
                      type="time"
                      name="businessHoursEnd"
                      defaultValue={businessInfo.businessHours?.end || '18:00'}
                      className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-neutral-500 mt-2">
                  דוגמה: 10:00-18:00 - מנות עסקיות זמינות רק בשעות האלו
                </p>
              </div>

              <div>
                <label className="block mb-1 text-neutral-300">
                  🤖 הוראות מותאמות אישית ל-AI
                </label>
                <p className="text-[10px] text-neutral-500 mb-2">
                  הגדירו הוראות ספציפיות ל-AI כדי לענות על שאלות נפוצות של לקוחות.
                  <br />
                  דוגמאות: "בסושי - מנות X, Y חייבות להיות אפויות, לא נא", "אין אפשרות להסיר גבינה מפיצה מרגריטה"
                </p>
                <textarea
                  name="aiInstructions"
                  defaultValue={businessInfo.aiInstructions || ''}
                  rows={8}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-xs font-mono"
                  placeholder="לדוגמה:&#10;בסושי - המנות 'סלמון אפוי' ו'טונה אפויה' חייבות להיות אפויות, לא נא.&#10;אין אפשרות להסיר גבינה מפיצה מרגריטה.&#10;כל המנות ללא גלוטן מסומנות בתפריט."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-white text-black px-4 py-2 text-xs font-semibold disabled:opacity-60"
              >
                {loading ? 'שומר...' : 'שמור שינויים'}
              </button>
            </form>
          )}

          {!businessInfo && (
            <p className="text-xs text-neutral-500">טוען פרטי עסק...</p>
          )}
        </section>
      )}

      {activeTab === 'printer' && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">הגדרות מדפסת / BON</h2>
          <p className="text-xs text-neutral-400 mb-3">
            הגדירו את המדפסת או מערכת ה-BON שלכם כדי לקבל הזמנות אוטומטית.
          </p>

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
                  setBusinessInfo({
                    ...businessInfo,
                    printerConfig: {
                      enabled,
                      type,
                      endpoint,
                      payloadType,
                      port,
                    },
                  });
                  toast.success('הגדרות המדפסת עודכנו בהצלחה!');
                } catch (err: any) {
                  const message = err.message || 'נכשל בעדכון הגדרות המדפסת';
                  setError(message);
                  toast.error(message);
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4 border border-neutral-800 rounded-lg p-4 bg-neutral-900/50 text-xs"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="enabled"
                  id="printer-enabled"
                  defaultChecked={businessInfo.printerConfig?.enabled || false}
                  className="rounded"
                />
                <label htmlFor="printer-enabled" className="text-neutral-300">
                  הפעל שליחה אוטומטית למדפסת
                </label>
              </div>

              <div>
                <label className="block mb-1 text-neutral-300">סוג חיבור</label>
                <select
                  name="type"
                  defaultValue={businessInfo.printerConfig?.type || 'http'}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                  required
                >
                  <option value="http">HTTP/HTTPS (REST API)</option>
                  <option value="tcp">TCP/IP</option>
                  <option value="serial">Serial Port</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-neutral-300">
                  כתובת IP / URL <span className="text-neutral-500">(למשל: 192.168.1.100 או https://printer.example.com)</span>
                </label>
                <input
                  name="endpoint"
                  type="text"
                  defaultValue={businessInfo.printerConfig?.endpoint || ''}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                  placeholder="192.168.1.100"
                />
              </div>

              {businessInfo.printerConfig?.type === 'tcp' && (
                <div>
                  <label className="block mb-1 text-neutral-300">פורט</label>
                  <input
                    name="port"
                    type="number"
                    defaultValue={businessInfo.printerConfig?.port || 9100}
                    className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                    placeholder="9100"
                  />
                </div>
              )}

              <div>
                <label className="block mb-1 text-neutral-300">סוג Payload</label>
                <select
                  name="payloadType"
                  defaultValue={businessInfo.printerConfig?.payloadType || 'json'}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                  required
                >
                  <option value="json">JSON</option>
                  <option value="text">Plain Text</option>
                  <option value="xml">XML</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-white text-black px-4 py-2 text-xs font-semibold disabled:opacity-60"
                >
                  {loading ? 'שומר...' : 'שמור הגדרות'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!businessId || !businessInfo?.printerConfig?.endpoint) {
                      toast.error('אנא הגדירו כתובת IP/URL תחילה');
                      return;
                    }
                    try {
                      setLoading(true);
                      const res = await fetch('/api/printer/test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          businessId,
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
                  disabled={loading || !businessInfo?.printerConfig?.endpoint}
                  className="rounded-md bg-green-600 text-white px-4 py-2 text-xs font-semibold disabled:opacity-60 hover:bg-green-500"
                >
                  בדוק חיבור למדפסת
                </button>
              </div>
            </form>
          )}

          {!businessInfo && (
            <p className="text-xs text-neutral-500">טוען הגדרות מדפסת...</p>
          )}
        </section>
      )}

      {activeTab === 'pos' && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">אינטגרציית POS (קופה)</h2>
          <p className="text-xs text-neutral-400 mb-3">
            הגדירו את ה-API של מערכת הקופה שלכם כדי לקבל הזמנות אוטומטית.
          </p>

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
              className="space-y-4 border border-neutral-800 rounded-lg p-4 bg-neutral-900/50 text-xs"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="enabled"
                  id="pos-enabled"
                  defaultChecked={businessInfo.posConfig?.enabled || false}
                  className="rounded"
                />
                <label htmlFor="pos-enabled" className="text-neutral-300">
                  הפעל שליחה אוטומטית ל-POS
                </label>
              </div>

              <div>
                <label className="block mb-1 text-neutral-300">
                  ספק POS <span className="text-neutral-500">(בחר את מערכת הקופה שלך)</span>
                </label>
                <select
                  name="provider"
                  defaultValue={businessInfo.posConfig?.provider || 'generic'}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                >
                  <option value="generic">Generic HTTP (ברירת מחדל)</option>
                  <option value="casbit">Caspit</option>
                  <option value="resto">Resto</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-neutral-300">
                  כתובת API (Endpoint URL) <span className="text-neutral-500">(למשל: https://pos.example.com/api/orders)</span>
                </label>
                <input
                  name="endpoint"
                  type="text"
                  defaultValue={businessInfo.posConfig?.endpoint || ''}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                  placeholder="https://pos.example.com/api/orders"
                />
              </div>

              <div>
                <label className="block mb-1 text-neutral-300">Headers (כותרות HTTP)</label>
                <div id="headers-container" className="space-y-2">
                  {Object.entries(businessInfo.posConfig?.headers || {}).map(([key, value], index) => (
                    <div key={index} data-header-row className="flex gap-2">
                      <input
                        data-header-key
                        type="text"
                        defaultValue={key}
                        placeholder="Key (למשל: Authorization)"
                        className="flex-1 rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                      />
                      <input
                        data-header-value
                        type="text"
                        defaultValue={value}
                        placeholder="Value"
                        className="flex-1 rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          (e.currentTarget.closest('[data-header-row]') as HTMLElement)?.remove();
                        }}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {(!businessInfo.posConfig?.headers || Object.keys(businessInfo.posConfig.headers).length === 0) && (
                    <div data-header-row className="flex gap-2">
                      <input
                        data-header-key
                        type="text"
                        placeholder="Key (למשל: Authorization)"
                        className="flex-1 rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                      />
                      <input
                        data-header-value
                        type="text"
                        placeholder="Value"
                        className="flex-1 rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          (e.currentTarget.closest('[data-header-row]') as HTMLElement)?.remove();
                        }}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-500"
                      >
                        ×
                      </button>
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
                      newRow.className = 'flex gap-2';
                      newRow.innerHTML = `
                        <input data-header-key type="text" placeholder="Key" class="flex-1 rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2" />
                        <input data-header-value type="text" placeholder="Value" class="flex-1 rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2" />
                        <button type="button" class="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-500" onclick="this.closest('[data-header-row]').remove()">×</button>
                      `;
                      container.appendChild(newRow);
                    }
                  }}
                  className="mt-2 px-3 py-1 text-xs bg-neutral-700 text-neutral-300 rounded-md hover:bg-neutral-600"
                >
                  + הוסף Header
                </button>
              </div>

              <div>
                <label className="block mb-1 text-neutral-300">
                  Timeout (מילישניות) <span className="text-neutral-500">(100-60000)</span>
                </label>
                <input
                  name="timeoutMs"
                  type="number"
                  min="100"
                  max="60000"
                  defaultValue={businessInfo.posConfig?.timeoutMs || 5000}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-white text-black px-4 py-2 text-xs font-semibold disabled:opacity-60"
                >
                  {loading ? 'שומר...' : 'שמור הגדרות'}
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
                  className="rounded-md bg-green-600 text-white px-4 py-2 text-xs font-semibold disabled:opacity-60 hover:bg-green-500"
                >
                  בדוק חיבור ל-POS
                </button>
              </div>
            </form>
          )}

          {!businessInfo && (
            <p className="text-xs text-neutral-500">טוען הגדרות POS...</p>
          )}
        </section>
      )}

      {activeTab === 'orders' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">הזמנות ורווחים</h2>
              <p className="text-xs text-neutral-400 mb-3">
                צפו בכל ההזמנות, סטטוסים וסיכומי הכנסות.
              </p>
      </div>
            {revenueStats && (
              <div className="flex gap-4 text-xs">
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg px-3 py-2">
                  <div className="text-neutral-400">היום</div>
                  <div className="text-white font-semibold">₪{revenueStats.today.toFixed(2)}</div>
                </div>
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg px-3 py-2">
                  <div className="text-neutral-400">השבוע</div>
                  <div className="text-white font-semibold">₪{revenueStats.week.toFixed(2)}</div>
                </div>
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg px-3 py-2">
                  <div className="text-neutral-400">החודש</div>
                  <div className="text-white font-semibold">₪{revenueStats.month.toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>

          <div className="border border-neutral-800 rounded-lg overflow-hidden">
            <div className="bg-neutral-900/70 text-[11px] text-neutral-400 px-3 py-2 grid grid-cols-5">
              <div>תאריך ושעה</div>
              <div>שולחן</div>
              <div>פריטים</div>
              <div>סכום</div>
              <div>סטטוס</div>
            </div>
            <div className="divide-y divide-neutral-800 text-xs">
              {orders.length === 0 && (
                <div className="px-3 py-3 text-neutral-500 text-[11px] text-center">
                  עדיין אין הזמנות. הזמנות יופיעו כאן כשהלקוחות יזמינו דרך התפריט.
                </div>
              )}
              {orders.map((order) => (
                <div
                  key={order.orderId}
                  className="grid grid-cols-5 items-center px-3 py-2 hover:bg-neutral-900/50"
                >
                  <div className="text-[11px] text-neutral-400">
                    {new Date(order.createdAt).toLocaleString('he-IL')}
                  </div>
                  <div>{order.tableId}</div>
                  <div className="text-[11px] text-neutral-400">
                    {order.items?.length || 0} פריט{order.items?.length !== 1 ? 'ים' : ''}
                  </div>
                  <div className="font-semibold">₪{order.totalAmount?.toFixed(2) || '0.00'}</div>
                  <div>
                    <span
                      className={`text-[10px] px-2 py-1 rounded ${
                        order.status === 'printed'
                          ? 'bg-green-900/40 text-green-400'
                          : order.status === 'printer_error'
                          ? 'bg-red-900/40 text-red-400'
                          : order.status === 'sent_to_printer'
                          ? 'bg-yellow-900/40 text-yellow-400'
                          : 'bg-neutral-800 text-neutral-400'
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
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

interface BillingControlsProps {
  businessId: string | null;
  currentTablesAllowed?: number;
}

function BillingControls({ businessId, currentTablesAllowed }: BillingControlsProps) {
  const [desiredTables, setDesiredTables] = useState<number>(currentTablesAllowed || 1);
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    if (!businessId) return;
    if (!desiredTables || desiredTables <= 0) {
      toast.error('יש להזין מספר שולחנות גדול מאפס');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, tablesRequested: desiredTables }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'נכשל ביצירת תהליך חיוב');
      }
      if (data.url) {
        window.location.href = data.url as string;
      } else {
        toast.error('לא התקבלה כתובת תשלום מ-Stripe');
      }
    } catch (err: any) {
      toast.error(err.message || 'נכשל ביצירת תהליך חיוב');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3 justify-between items-center mt-2">
      <div className="flex items-center gap-2">
        <label className="text-[11px] text-neutral-400">
          מספר שולחנות במנוי (50₪ לחודש לכל שולחן):
        </label>
        <input
          type="number"
          min={1}
          value={desiredTables}
          onChange={(e) => setDesiredTables(Number(e.target.value))}
          className="w-20 rounded-md bg-neutral-900 border border-neutral-700 px-2 py-1 text-[11px]"
        />
      </div>
      <div className="flex items-center gap-3 text-[11px]">
        <span className="text-neutral-400">
          סכום חודשי משוער: ₪{(desiredTables * 50).toFixed(2)}
        </span>
        <button
          type="button"
          onClick={startCheckout}
          disabled={loading || !businessId}
          className="rounded-md bg-green-600 text-white px-3 py-1 font-semibold disabled:opacity-60 hover:bg-green-500"
        >
          {loading ? 'מעביר ל-Stripe...' : 'שדרג / חדש מנוי'}
        </button>
      </div>
    </div>
  );
}

