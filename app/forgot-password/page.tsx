'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';

function ForgotPasswordPageInner() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send reset email");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl bg-neutral-900/70 p-6 shadow-lg border border-neutral-800">
          <h1 className="text-2xl font-semibold text-white mb-2">אימייל נשלח</h1>
          <p className="text-sm text-neutral-400 mb-4">
            שלחנו לך קישור לאיפוס סיסמה לאימייל: <strong className="text-white">{email}</strong>
          </p>
          <p className="text-xs text-neutral-500">
            הקישור תקף למשך שעה. אם לא קיבלת את האימייל, בדוק את תיקיית הספאם.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full rounded-md bg-white text-black py-2 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            חזרה להתחברות
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
        <h1 className="text-2xl font-semibold text-white mb-2">שכחתי סיסמה</h1>
        <p className="text-sm text-neutral-400 mb-4">
          הזינו את כתובת האימייל שלכם ונשלח לכם קישור לאיפוס סיסמה.
        </p>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-500/40 rounded px-3 py-2">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <label className="text-sm text-neutral-200" htmlFor="email">
            אימייל
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-white text-black py-2 text-sm font-semibold hover:bg-neutral-200 transition disabled:opacity-60"
        >
          {loading ? "שולח..." : "שלח קישור לאיפוס סיסמה"}
        </button>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full text-xs text-center text-neutral-400 hover:text-white transition"
          >
            חזרה להתחברות
          </button>
        </div>
      </form>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordPageInner />
    </Suspense>
  );
}

