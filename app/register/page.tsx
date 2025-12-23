"use client";

import { FormEvent, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      businessName: formData.get("businessName"),
      businessType: formData.get("businessType"),
      email: formData.get("email"),
      password: formData.get("password"),
      template: formData.get("template"),
    };

    try {
      const res = await axios.post("/api/business/register", payload);
      if (res.status === 200) {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl bg-neutral-900/70 p-6 shadow-lg border border-neutral-800"
      >
        <h1 className="text-2xl font-semibold text-white mb-2">הרשמת עסק</h1>
        <p className="text-sm text-neutral-400 mb-4">
          צרו חשבון לעסק והתחילו לעבוד עם מערכת הזמנות QR חכמה בתוך דקות.
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
            name="businessName"
            required
            className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-200" htmlFor="businessType">
            סוג העסק
          </label>
          <select
            id="businessType"
            name="businessType"
            required
            className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <option value="bar">בר</option>
            <option value="pizza">פיצריה</option>
            <option value="sushi">מסעדת סושי</option>
            <option value="generic">מסעדה</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-200" htmlFor="template">
            תבנית עיצוב
          </label>
          <select
            id="template"
            name="template"
            required
            className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40"
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

        <div className="space-y-1">
          <label className="text-sm text-neutral-200" htmlFor="email">
            אימייל
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-200" htmlFor="password">
            סיסמה
          </label>
          <input
            type="password"
            id="password"
            name="password"
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
          {loading ? "יוצר חשבון..." : "יצירת חשבון"}
        </button>
      </form>
    </main>
  );
}

