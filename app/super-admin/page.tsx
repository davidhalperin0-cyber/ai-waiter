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
    planType?: 'full' | 'menu_only';
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
    // Don't load businesses automatically - only when user clicks refresh or switches to businesses tab
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
      const res = await fetch('/api/super-admin/businesses', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      const data = await res.json();
      if (res.ok) {
        // API already parses subscription, but ensure it's an object
        const parsedBusinesses = (data.businesses || []).map((business: any) => ({
          ...business,
          subscription: typeof business.subscription === 'string' 
            ? JSON.parse(business.subscription) 
            : (business.subscription || { status: 'trial', planType: 'full' }),
        }));
        console.log('🔄 Loaded businesses:', parsedBusinesses.length);
        const targetBusiness = parsedBusinesses.find((b: Business) => b.businessId === 'b72bca1a-7fd3-470d-998e-971785f30ab4');
        if (targetBusiness) {
          console.log('🔄 Target business after load:', {
            businessId: targetBusiness.businessId,
            isEnabled: targetBusiness.isEnabled,
            subscription: targetBusiness.subscription,
          });
          console.log('⚠️ WARNING: GET request returned stale data for isEnabled:', {
            returnedIsEnabled: targetBusiness.isEnabled,
            note: 'This is expected - GET request returns stale data due to connection pooling'
          });
        }
        
        // CRITICAL: Never overwrite isEnabled if it was set via RPC
        // The GET request returns stale data due to connection pooling / read replicas
        // If a business has _lastRpcUpdate, it means isEnabled was set via RPC, which is the source of truth
        // We should NEVER overwrite RPC-set values with GET request values
        setBusinesses(prev => {
          console.log('🔄 loadBusinesses: Checking existing businesses for RPC updates...', {
            prevCount: prev.length,
            newCount: parsedBusinesses.length,
          });
          const updated = parsedBusinesses.map((b: Business) => {
            const existing = prev.find(p => p.businessId === b.businessId);
            if (existing) {
              const existingWithTimestamp = existing as Business & { _lastRpcUpdate?: number };
              // If isEnabled was set via RPC (has _lastRpcUpdate), NEVER overwrite it with GET request data
              // The RPC result is the source of truth, GET request is unreliable due to stale reads
              if (existingWithTimestamp._lastRpcUpdate) {
                console.log('✅ Preserving RPC isEnabled value (RPC is source of truth):', {
                  businessId: b.businessId,
                  rpcIsEnabled: existing.isEnabled,
                  getRequestIsEnabled: b.isEnabled,
                  _lastRpcUpdate: existingWithTimestamp._lastRpcUpdate,
                  timeSinceUpdate: `${Math.round((Date.now() - existingWithTimestamp._lastRpcUpdate) / 1000)}s`,
                  note: 'GET request returns stale data, RPC is reliable',
                });
                // Keep the RPC value and preserve the timestamp
                return { ...b, isEnabled: existing.isEnabled, _lastRpcUpdate: existingWithTimestamp._lastRpcUpdate } as Business & { _lastRpcUpdate?: number };
              } else {
                console.log('⚠️ No RPC update found, using GET request value (might be stale):', {
                  businessId: b.businessId,
                  getRequestIsEnabled: b.isEnabled,
                  existingIsEnabled: existing.isEnabled,
                });
              }
              // If no RPC update, use GET request value (but it might be stale)
              return { ...b };
            }
            // New business, use GET request value
            console.log('🆕 New business, using GET request value:', {
              businessId: b.businessId,
              isEnabled: b.isEnabled,
            });
            return { ...b };
          });
          return updated;
        });
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
      const newStatus = !currentStatus;
      console.log('🔄 Toggling business status:', { businessId, currentStatus, newStatus });

      // Optimistic update - update UI immediately
      setBusinesses(prev => prev.map(b => 
        b.businessId === businessId 
          ? { ...b, isEnabled: newStatus }
          : b
      ));

      const res = await fetch(`/api/super-admin/businesses/${businessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: newStatus }),
      });
      const data = await res.json();
      console.log('📥 Update response:', data);
      
      if (res.ok && data.business) {
        // CRITICAL: Always use the RPC result from the response
        // The RPC function already verified the update, so we trust its result
        // Don't trust any fetched data - it might be stale
        const rpcIsEnabled = data.business.isEnabled;
        
        console.log('✅ Using RPC result from response:', {
          businessId,
          requestedIsEnabled: newStatus,
          rpcIsEnabled: rpcIsEnabled,
          matches: rpcIsEnabled === newStatus,
        });
        
        // Update immediately with RPC result - this is the source of truth
        // Store timestamp to track when this was updated via RPC
        setBusinesses(prev => prev.map(b => 
          b.businessId === businessId 
            ? { 
                ...b, 
                isEnabled: rpcIsEnabled, // ALWAYS use RPC result, never trust fetched data
                subscription: data.business.subscription || b.subscription,
                _lastRpcUpdate: Date.now(), // Track when this was updated via RPC
              } as Business & { _lastRpcUpdate?: number }
            : b
        ));
        
        // DON'T reload from server - it returns stale data
        // The RPC result is the source of truth - trust it completely
        console.log('✅ Updated business state with RPC result, NOT reloading from server');
        
        // Only reload stats, not businesses (to avoid stale data overwriting RPC result)
        await loadStats();
      } else if (res.ok) {
        // If no business in response, don't reload - it returns stale data
        // Just update stats
        console.log('⚠️ No business in response, not reloading to avoid stale data');
        await loadStats();
      } else {
        // Revert optimistic update on error
        setBusinesses(prev => prev.map(b => 
          b.businessId === businessId 
            ? { ...b, isEnabled: currentStatus }
            : b
        ));
        alert(data.message || 'נכשל בעדכון סטטוס העסק');
      }
    } catch (err: any) {
      console.error('❌ Update error:', err);
      // Revert optimistic update on error
      setBusinesses(prev => prev.map(b => 
        b.businessId === businessId 
          ? { ...b, isEnabled: currentStatus }
          : b
      ));
      alert(err.message || 'נכשל בעדכון סטטוס העסק');
    } finally {
      setLoading(false);
    }
  }

  // updateSubscription function removed - no longer based on number of tables

  async function updateSubscriptionStatus(businessId: string, newStatus: string) {
    try {
      setLoading(true);
      const business = businesses.find((b) => b.businessId === businessId);
      if (!business) return;

      console.log('🔄 Updating subscription status:', { businessId, newStatus, current: business.subscription });

      const res = await fetch(`/api/super-admin/businesses/${businessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: {
            ...(business.subscription || {}),
            status: newStatus,
          },
        }),
      });
      const data = await res.json();
      console.log('📥 Update response:', data);
      
      if (res.ok && data.business) {
        // Update immediately with response data - trust the RPC result
        setBusinesses(prev => prev.map(b => 
          b.businessId === businessId 
            ? { ...b, subscription: data.business.subscription || b.subscription }
            : b
        ));
        
        // Don't reload from server - it returns stale data
        // Trust the RPC result that was returned in the response
        console.log('✅ Updated subscription state with RPC result, not reloading from server');
        
        // Only reload stats, not businesses (to avoid stale data)
        await loadStats();
      } else {
        alert(data.message || 'נכשל בעדכון סטטוס המנוי');
      }
    } catch (err: any) {
      console.error('❌ Update error:', err);
      alert(err.message || 'נכשל בעדכון סטטוס המנוי');
    } finally {
      setLoading(false);
    }
  }

  async function updatePlanType(businessId: string, newPlanType: 'full' | 'menu_only') {
    try {
      setLoading(true);
      const business = businesses.find((b) => b.businessId === businessId);
      if (!business) return;

      console.log('🔄 Updating plan type:', { businessId, newPlanType, current: business.subscription });

      const res = await fetch(`/api/super-admin/businesses/${businessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: {
            ...(business.subscription || {}),
            planType: newPlanType,
          },
        }),
      });
      const data = await res.json();
      console.log('📥 Update response:', data);
      
      if (res.ok && data.business) {
        // Update immediately with response data - trust the RPC result
        setBusinesses(prev => prev.map(b => 
          b.businessId === businessId 
            ? { ...b, subscription: data.business.subscription || b.subscription }
            : b
        ));
        
        // Don't reload from server - it returns stale data
        // Trust the RPC result that was returned in the response
        console.log('✅ Updated plan type state with RPC result, not reloading from server');
        
        // Only reload stats, not businesses (to avoid stale data)
        await loadStats();
      } else {
        alert(data.message || 'נכשל בעדכון סוג החבילה');
      }
    } catch (err: any) {
      console.error('❌ Update error:', err);
      alert(err.message || 'נכשל בעדכון סוג החבילה');
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
                        key={`status-${business.businessId}-${business.isEnabled}`}
                        className={`text-[10px] px-2 py-1 rounded ${
                          business.isEnabled
                            ? 'bg-green-900/40 text-green-400'
                            : 'bg-red-900/40 text-red-400'
                        }`}
                      >
                        {business.isEnabled ? 'פעיל' : 'מושבת'}
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span
                        className={`text-[10px] px-2 py-1 rounded ${
                          (business.subscription.planType || 'full') === 'full'
                            ? 'bg-purple-900/40 text-purple-400'
                            : 'bg-orange-900/40 text-orange-400'
                        }`}
                        title="סוג חבילה"
                      >
                        {(business.subscription.planType || 'full') === 'full' ? 'חבילה מלאה' : 'תפריט בלבד'}
                      </span>
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
                    <div className="text-right flex gap-2 justify-end items-center flex-wrap">
                      <select
                        key={`planType-${business.businessId}-${business.subscription?.planType || 'full'}`}
                        value={business.subscription?.planType || 'full'}
                        onChange={(e) => updatePlanType(business.businessId, e.target.value as 'full' | 'menu_only')}
                        disabled={loading}
                        className="text-[10px] px-2 py-1 rounded bg-neutral-800 border border-neutral-700 disabled:opacity-60"
                        title="סוג חבילה"
                      >
                        <option value="full">חבילה מלאה</option>
                        <option value="menu_only">תפריט בלבד</option>
                      </select>
                      <select
                        key={`status-${business.businessId}-${business.subscription?.status || 'trial'}`}
                        value={business.subscription?.status || 'trial'}
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
            הגדירו את התמחור החודשי למנוי. העסקים ישלמו את המחיר הזה כל חודש.
          </p>

          <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50 space-y-4 text-xs">
            <div>
              <label className="block mb-1 text-neutral-300">מחיר חודשי למנוי (₪)</label>
              <input
                type="number"
                step="0.01"
                value={pricingConfig.pricePerTable}
                onChange={(e) =>
                  setPricingConfig({ pricePerTable: Number(e.target.value) })
                }
                className="w-full max-w-xs rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2"
                placeholder="500"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                זה המחיר החודשי למנוי. העסקים ישלמו את המחיר הזה כל חודש (Stripe).
              </p>
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

          {/* Tables management removed - no longer based on number of tables */}
        </section>
      )}
    </main>
  );
}
