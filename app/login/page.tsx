"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("from") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || "Login failed");
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
        <h1 className="text-2xl font-semibold text-white mb-2">התחברות עסק</h1>
        <p className="text-sm text-neutral-400 mb-4">
          התחברו כדי לנהל את התפריט, השולחנות וההזמנות שלכם.
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

        <div className="space-y-1">
          <label className="text-sm text-neutral-200" htmlFor="password">
            סיסמה
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-white text-black py-2 text-sm font-semibold hover:bg-neutral-200 transition disabled:opacity-60"
        >
          {loading ? "מתחבר..." : "התחברות"}
        </button>
      </form>
    </main>
  );
}


