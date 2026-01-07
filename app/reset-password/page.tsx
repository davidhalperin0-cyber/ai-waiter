'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-200" htmlFor="confirmPassword">
            אימות סיסמה
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40"
          />
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

