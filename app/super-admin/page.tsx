'use client';

import { useEffect, useState } from 'react';

interface Business {
  businessId: string;
  name: string;
  type: string;
  email: string;
  isEnabled: boolean;
  subscription: {
    status: string;
    tablesAllowed: number;
  };
  createdAt: string;
  ordersCount: number;
  tablesCount: number;
}

interface PlatformStats {
  totalBusinesses: number;
  activeBusinesses: number;
  totalOrders: number;
  ordersToday: number;
  totalRevenue: number;
  totalTables: number;
}

export default function SuperAdminPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'businesses' | 'pricing'>('overview');
  const [pricingConfig, setPricingConfig] = useState({
    pricePerTable: 50,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const res = await fetch('/api/super-admin/stats');
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      } else {
        setError(data.message || 'נכשל בטעינת סטטיסטיקות');
      }
    } catch (err: any) {
      setError(err.message || 'נכשל בטעינת סטטיסטיקות');
    } finally {
      setLoading(false);
    }
  }

  async function loadBusinesses() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/super-admin/businesses');
      const data = await res.json();
      if (res.ok) {
        setBusinesses(data.businesses || []);
      } else {
        setError(data.message || 'נכשל בטעינת עסקים');
      }
    } catch (err: any) {
      setError(err.message || 'נכשל בטעינת עסקים');
    } finally {
      setLoading(false);
    }
  }

  async function toggleBusinessStatus(businessId: string, currentStatus: boolean) {
    try {
      setLoading(true);
      const res = await fetch(`/api/super-admin/businesses/${businessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !currentStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        await loadBusinesses();
        await loadStats();
        alert('סטטוס העסק עודכן בהצלחה!');
      } else {
        alert(data.message || 'נכשל בעדכון סטטוס העסק');
      }
    } catch (err: any) {
      alert(err.message || 'נכשל בעדכון סטטוס העסק');
    } finally {
      setLoading(false);
    }
  }

  async function updateSubscription(businessId: string, tablesAllowed: number) {
    try {
      setLoading(true);
      const business = businesses.find((b) => b.businessId === businessId);
      if (!business) return;

      const res = await fetch(`/api/super-admin/businesses/${businessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: {
            ...business.subscription,
            tablesAllowed,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await loadBusinesses();
        alert('מספר השולחנות עודכן בהצלחה!');
      } else {
        alert(data.message || 'נכשל בעדכון מספר השולחנות');
      }
    } catch (err: any) {
      alert(err.message || 'נכשל בעדכון מספר השולחנות');
    } finally {
      setLoading(false);
    }
  }

  async function updateSubscriptionStatus(businessId: string, newStatus: string) {
    try {
      setLoading(true);
      const business = businesses.find((b) => b.businessId === businessId);
      if (!business) return;

      const res = await fetch(`/api/super-admin/businesses/${businessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: {
            ...business.subscription,
            status: newStatus,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await loadBusinesses();
        await loadStats();
        alert(`סטטוס המנוי עודכן ל-${newStatus === 'active' ? 'פעיל' : newStatus === 'trial' ? 'ניסיון' : newStatus === 'expired' ? 'פג תוקף' : 'פיגור תשלום'}!`);
      } else {
        alert(data.message || 'נכשל בעדכון סטטוס המנוי');
      }
    } catch (err: any) {
      alert(err.message || 'נכשל בעדכון סטטוס המנוי');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold mb-2">מנהל מערכת ראשי של הפלטפורמה</h1>
        <p className="text-sm text-neutral-400">
        ניהול כל העסקים, המנויים והסטטיסטיקות של הפלטפורמה.
      </p>
      </header>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-500/40 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 border-b border-neutral-800 mb-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-semibold ${
            activeTab === 'overview'
              ? 'border-b-2 border-white text-white'
              : 'text-neutral-400'
          }`}
        >
          סקירה כללית
        </button>
        <button
          onClick={() => {
            setActiveTab('businesses');
            loadBusinesses();
          }}
          className={`px-4 py-2 text-sm font-semibold ${
            activeTab === 'businesses'
              ? 'border-b-2 border-white text-white'
              : 'text-neutral-400'
          }`}
        >
          ניהול עסקים
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2 text-sm font-semibold ${
            activeTab === 'pricing'
              ? 'border-b-2 border-white text-white'
              : 'text-neutral-400'
          }`}
        >
          תמחור
        </button>
      </div>

      {activeTab === 'overview' && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">סטטיסטיקות פלטפורמה</h2>
          {loading && !stats ? (
            <p className="text-xs text-neutral-400">טוען סטטיסטיקות...</p>
          ) : stats ? (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
                <div className="text-2xl font-bold mb-1">{stats.totalBusinesses}</div>
                <div className="text-xs text-neutral-400">סה"כ עסקים</div>
                <div className="text-[10px] text-green-400 mt-1">
                  {stats.activeBusinesses} פעילים
                </div>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
                <div className="text-2xl font-bold mb-1">{stats.totalOrders}</div>
                <div className="text-xs text-neutral-400">סה"כ הזמנות</div>
                <div className="text-[10px] text-blue-400 mt-1">
                  {stats.ordersToday} היום
                </div>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
                <div className="text-2xl font-bold mb-1">₪{stats.totalRevenue.toFixed(2)}</div>
                <div className="text-xs text-neutral-400">סה"כ הכנסות</div>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
                <div className="text-2xl font-bold mb-1">{stats.totalTables}</div>
                <div className="text-xs text-neutral-400">סה"כ שולחנות</div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500">לא ניתן לטעון סטטיסטיקות</p>
          )}
        </section>
      )}

      {activeTab === 'businesses' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">ניהול עסקים</h2>
            <button
              onClick={loadBusinesses}
              disabled={loading}
              className="text-xs text-white bg-neutral-700 px-3 py-1 rounded hover:bg-neutral-600 disabled:opacity-60"
            >
              רענן
            </button>
          </div>

          {loading && businesses.length === 0 ? (
            <p className="text-xs text-neutral-400">טוען עסקים...</p>
          ) : businesses.length === 0 ? (
            <p className="text-xs text-neutral-500">אין עסקים במערכת</p>
          ) : (
            <div className="border border-neutral-800 rounded-lg overflow-hidden">
              <div className="bg-neutral-900/70 text-[11px] text-neutral-400 px-3 py-2 grid grid-cols-8 gap-2">
                <div>שם עסק</div>
                <div>אימייל</div>
                <div>סוג</div>
                <div>שולחנות</div>
                <div>הזמנות</div>
                <div>סטטוס</div>
                <div>מנוי</div>
                <div className="text-right">פעולות</div>
              </div>
              <div className="divide-y divide-neutral-800 text-xs">
                {businesses.map((business) => (
                  <div
                    key={business.businessId}
                    className="grid grid-cols-8 gap-2 items-center px-3 py-2 hover:bg-neutral-900/50"
                  >
                    <div className="font-semibold truncate">{business.name}</div>
                    <div className="text-neutral-400 text-[11px] truncate">{business.email}</div>
                    <div className="text-[11px]">{business.type}</div>
                    <div>{business.tablesCount}</div>
                    <div>{business.ordersCount}</div>
                    <div>
                      <span
                        className={`text-[10px] px-2 py-1 rounded ${
                          business.isEnabled
                            ? 'bg-green-900/40 text-green-400'
                            : 'bg-red-900/40 text-red-400'
                        }`}
                      >
                        {business.isEnabled ? 'פעיל' : 'מושבת'}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`text-[10px] px-2 py-1 rounded ${
                          business.subscription.status === 'active'
                            ? 'bg-blue-900/40 text-blue-400'
                            : business.subscription.status === 'trial'
                            ? 'bg-yellow-900/40 text-yellow-400'
                            : 'bg-red-900/40 text-red-400'
                        }`}
                      >
                        {business.subscription.status === 'active'
                          ? 'פעיל'
                          : business.subscription.status === 'trial'
                          ? 'ניסיון'
                          : business.subscription.status === 'expired'
                          ? 'פג תוקף'
                          : business.subscription.status === 'past_due'
                          ? 'פיגור'
                          : business.subscription.status}
                      </span>
                    </div>
                    <div className="text-right flex gap-2 justify-end items-center">
                      <select
                        value={business.subscription.status}
                        onChange={(e) => updateSubscriptionStatus(business.businessId, e.target.value)}
                        disabled={loading}
                        className="text-[10px] px-2 py-1 rounded bg-neutral-800 border border-neutral-700 disabled:opacity-60"
                        title="עדכן סטטוס מנוי"
                      >
                        <option value="trial">ניסיון</option>
                        <option value="active">פעיל</option>
                        <option value="expired">פג תוקף</option>
                        <option value="past_due">פיגור תשלום</option>
                      </select>
                      <button
                        onClick={() => toggleBusinessStatus(business.businessId, business.isEnabled)}
                        disabled={loading}
                        className={`text-[10px] px-2 py-1 rounded ${
                          business.isEnabled
                            ? 'bg-red-600 text-white hover:bg-red-500'
                            : 'bg-green-600 text-white hover:bg-green-500'
                        } disabled:opacity-60`}
                        title={business.isEnabled ? 'השבת עסק' : 'הפעל עסק'}
                      >
                        {business.isEnabled ? 'השבת' : 'הפעל'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'pricing' && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">תמחור</h2>
          <p className="text-xs text-neutral-400 mb-4">
            הגדירו את התמחור החודשי לכל שולחן. העסקים ישלמו לפי מספר השולחנות שלהם.
          </p>

          <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50 space-y-4 text-xs">
            <div>
              <label className="block mb-1 text-neutral-300">מחיר חודשי לכל שולחן (₪)</label>
              <input
                type="number"
                step="0.01"
                value={pricingConfig.pricePerTable}
                onChange={(e) =>
                  setPricingConfig({ pricePerTable: Number(e.target.value) })
                }
                className="w-full max-w-xs rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                placeholder="50"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                זה המחיר הבסיסי לכל שולחן. העסקים ישלמו: מספר שולחנות × מחיר זה (Stripe).
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <h3 className="font-semibold mb-2">דוגמאות תמחור:</h3>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-400">5 שולחנות:</span>
                  <span className="font-semibold">
                    ₪{(pricingConfig.pricePerTable * 5).toFixed(2)}/חודש
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">10 שולחנות:</span>
                  <span className="font-semibold">
                    ₪{(pricingConfig.pricePerTable * 10).toFixed(2)}/חודש
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">20 שולחנות:</span>
                  <span className="font-semibold">
                    ₪{(pricingConfig.pricePerTable * 20).toFixed(2)}/חודש
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                // TODO: Save pricing config to database
                alert('תמחור נשמר! (TODO: שמירה בבסיס הנתונים)');
              }}
              className="rounded-md bg-white text-black px-4 py-2 text-xs font-semibold hover:bg-neutral-200"
            >
              שמור תמחור
            </button>
          </div>

          {businesses.length > 0 && (
            <div className="mt-6 border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
              <h3 className="font-semibold mb-3 text-xs">עדכון מספר שולחנות לעסק</h3>
              <div className="space-y-2 text-xs">
                {businesses.map((business) => (
                  <div
                    key={business.businessId}
                    className="flex items-center justify-between gap-2 p-2 bg-neutral-800 rounded"
                  >
                    <div className="flex-1">
                      <div className="font-semibold">{business.name}</div>
                      <div className="text-[10px] text-neutral-400">
                        נוכחי: {business.subscription.tablesAllowed} שולחנות
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        defaultValue={business.subscription.tablesAllowed}
                        onBlur={(e) => {
                          const newValue = Number(e.target.value);
                          if (newValue !== business.subscription.tablesAllowed) {
                            updateSubscription(business.businessId, newValue);
                          }
                        }}
                        className="w-20 rounded-md bg-neutral-900 border border-neutral-700 px-2 py-1 text-xs"
                      />
                      <span className="text-[10px] text-neutral-400">שולחנות</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
