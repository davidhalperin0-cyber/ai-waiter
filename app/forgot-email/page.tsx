'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';

function ForgotEmailPageInner() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEmail(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to find email");
      }

      setEmail(data.email);
    } catch (err: any) {
      setError(err.message || "Failed to find email");
    } finally {
      setLoading(false);
    }
  }

  if (email) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl bg-neutral-900/70 p-6 shadow-lg border border-neutral-800">
          <h1 className="text-2xl font-semibold text-white mb-2">אימייל נמצא</h1>
          <p className="text-sm text-neutral-400 mb-4">
            האימייל המשויך לעסק <strong className="text-white">{businessName}</strong> הוא:
          </p>
          <div className="bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2">
            <p className="text-white font-medium">{email}</p>
          </div>
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
        <h1 className="text-2xl font-semibold text-white mb-2">שכחתי אימייל</h1>
        <p className="text-sm text-neutral-400 mb-4">
          הזינו את שם העסק ומספר הטלפון כדי למצוא את האימייל שלכם.
        </p>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-500/40 rounded px-3 py-2">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <label className="text-sm text-neutral-200" htmlFor="businessName">
            שם העסק
          </label>
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-200" htmlFor="phone">
            מספר טלפון (אופציונלי)
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="למשל: 0501234567"
          />
          <p className="text-xs text-neutral-500">
            אם יש לכם מספר טלפון במערכת, זה יעזור לנו למצוא את האימייל שלכם.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-white text-black py-2 text-sm font-semibold hover:bg-neutral-200 transition disabled:opacity-60"
        >
          {loading ? "מחפש..." : "מצא אימייל"}
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

export default function ForgotEmailPage() {
  return (
    <Suspense fallback={null}>
      <ForgotEmailPageInner />
    </Suspense>
  );
}

