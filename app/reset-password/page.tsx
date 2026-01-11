'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);

  // Check token validity on page load
  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setTokenInvalid(true);
        setCheckingToken(false);
        return;
      }

      try {
        const res = await fetch(`/api/auth/check-reset-token?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok || !data.valid) {
          if (data.expired) {
            setTokenExpired(true);
          } else {
            setTokenInvalid(true);
          }
        }
      } catch (err) {
        console.error('Error checking token:', err);
        setTokenInvalid(true);
      } finally {
        setCheckingToken(false);
      }
    }

    checkToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("הסיסמאות לא תואמות");
      return;
    }

    if (password.length < 8) {
      setError("הסיסמה חייבת להכיל לפחות 8 תווים");
      return;
    }

    if (!token) {
      setError("קישור לא תקין");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        // If token expired during submission, update UI
        if (data.message?.includes('פג תוקף') || data.message?.includes('expired')) {
          setTokenExpired(true);
        }
        throw new Error(data.message || "שגיאה באיפוס הסיסמה");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "שגיאה באיפוס הסיסמה");
    } finally {
      setLoading(false);
    }
  }

  // Show loading state while checking token
  if (checkingToken) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl bg-neutral-900/70 p-6 shadow-lg border border-neutral-800">
          <h1 className="text-2xl font-semibold text-white mb-2">בודק קישור...</h1>
          <p className="text-sm text-neutral-400 mb-4">
            אנא המתן, בודקים את תקינות הקישור.
          </p>
        </div>
      </main>
    );
  }

  // Show expired token message
  if (tokenExpired) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl bg-neutral-900/70 p-6 shadow-lg border border-neutral-800">
          <h1 className="text-2xl font-semibold text-white mb-2">קישור פג תוקף</h1>
          <p className="text-sm text-neutral-400 mb-4">
            הקישור לאיפוס סיסמה פג תוקף. קישורי איפוס סיסמה תקפים למשך דקה אחת בלבד (במצב בדיקה).
          </p>
          <button
            onClick={() => router.push('/forgot-password')}
            className="w-full rounded-md bg-white text-black py-2 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            בקש קישור חדש
          </button>
          <button
            onClick={() => router.push('/login')}
            className="w-full rounded-md bg-neutral-800 text-white py-2 text-sm font-semibold hover:bg-neutral-700 transition border border-neutral-700"
          >
            חזרה להתחברות
          </button>
        </div>
      </main>
    );
  }

  // Show invalid token message
  if (tokenInvalid || !token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl bg-neutral-900/70 p-6 shadow-lg border border-neutral-800">
          <h1 className="text-2xl font-semibold text-white mb-2">קישור לא תקין</h1>
          <p className="text-sm text-neutral-400 mb-4">
            הקישור לאיפוס סיסמה לא תקין או כבר שימש לאיפוס סיסמה.
          </p>
          <button
            onClick={() => router.push('/forgot-password')}
            className="w-full rounded-md bg-white text-black py-2 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            בקש קישור חדש
          </button>
          <button
            onClick={() => router.push('/login')}
            className="w-full rounded-md bg-neutral-800 text-white py-2 text-sm font-semibold hover:bg-neutral-700 transition border border-neutral-700"
          >
            חזרה להתחברות
          </button>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl bg-neutral-900/70 p-6 shadow-lg border border-neutral-800">
          <h1 className="text-2xl font-semibold text-white mb-2">סיסמה עודכנה</h1>
          <p className="text-sm text-neutral-400 mb-4">
            הסיסמה שלכם עודכנה בהצלחה. כעת תוכלו להתחבר עם הסיסמה החדשה.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full rounded-md bg-white text-black py-2 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            התחברות
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl bg-neutral-900/70 p-6 shadow-lg border border-neutral-800"
      >
        <h1 className="text-2xl font-semibold text-white mb-2">איפוס סיסמה</h1>
        <p className="text-sm text-neutral-400 mb-4">
          הזינו סיסמה חדשה לחשבון שלכם.
        </p>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-500/40 rounded px-3 py-2">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <label className="text-sm text-neutral-200" htmlFor="password">
            סיסמה חדשה
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-200" htmlFor="confirmPassword">
            אימות סיסמה
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              aria-label={showConfirmPassword ? "הסתר סיסמה" : "הצג סיסמה"}
            >
              {showConfirmPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-white text-black py-2 text-sm font-semibold hover:bg-neutral-200 transition disabled:opacity-60"
        >
          {loading ? "מעדכן..." : "עדכן סיסמה"}
        </button>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}

