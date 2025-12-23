import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-neutral-950 via-neutral-900 to-black px-4 text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        מערכת הזמנות QR חכמה למסעדות ולברים
      </h1>
      <p className="max-w-xl text-neutral-300 mb-8">
        פלטפורמת SaaS לניהול תפריטים דיגיטליים, הזמנות חכמות בעזרת AI והדפסה למטבח בזמן אמת –
        בלי צורך בידע טכני למסעדות.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link
          href="/register"
          className="rounded-full bg-white text-black px-6 py-2 text-sm font-semibold hover:bg-neutral-200 transition"
        >
          יצירת חשבון לעסק
        </Link>
        <Link
          href="/super-admin/login"
          className="rounded-full border border-neutral-500 px-6 py-2 text-sm font-semibold hover:border-white transition"
        >
          התחברות מנהל מערכת
        </Link>
      </div>
    </main>
  );
}

