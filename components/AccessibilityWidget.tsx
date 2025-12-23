'use client';

import { useEffect, useState } from 'react';

export function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;

    const storedNight = window.localStorage.getItem('a11y_night_mode') === 'true';
    const storedContrast = window.localStorage.getItem('a11y_high_contrast') === 'true';

    setNightMode(storedNight);
    setHighContrast(storedContrast);

    if (storedNight) root.classList.add('a11y-night');
    if (storedContrast) root.classList.add('a11y-high-contrast');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    if (nightMode) {
      root.classList.add('a11y-night');
    } else {
      root.classList.remove('a11y-night');
    }
    window.localStorage.setItem('a11y_night_mode', String(nightMode));
  }, [nightMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('a11y-high-contrast');
    } else {
      root.classList.remove('a11y-high-contrast');
    }
    window.localStorage.setItem('a11y_high_contrast', String(highContrast));
  }, [highContrast]);

  return (
    <div className="fixed bottom-4 left-4 z-50 text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-neutral-900/80 border border-white/20 px-3 py-2 text-white shadow-lg hover:bg-neutral-800 transition"
        aria-label="פתיחת תפריט נגישות"
      >
        <span>♿</span>
        <span>נגישות</span>
      </button>

      {open && (
        <div className="mt-2 w-56 rounded-2xl bg-neutral-900/95 border border-white/15 p-3 shadow-2xl backdrop-blur">
          <p className="mb-2 text-[11px] text-neutral-300 font-semibold">מצבי נגישות</p>

          <button
            type="button"
            onClick={() => setHighContrast((v) => !v)}
            className={`mb-2 w-full rounded-lg px-3 py-2 text-left text-[11px] border ${
              highContrast
                ? 'bg-white text-black border-white'
                : 'bg-neutral-800 text-neutral-100 border-neutral-600'
            }`}
          >
            ניגודיות גבוהה
          </button>

          <button
            type="button"
            onClick={() => setNightMode((v) => !v)}
            className={`w-full rounded-lg px-3 py-2 text-left text-[11px] border ${
              nightMode
                ? 'bg-white text-black border-white'
                : 'bg-neutral-800 text-neutral-100 border-neutral-600'
            }`}
          >
            מצב לילה
          </button>

          <p className="mt-2 text-[10px] text-neutral-500">
            אפשרויות אלו משפיעות על כל המסך כדי לסייע בקריאה ונראות.
          </p>
        </div>
      )}
    </div>
  );
}


