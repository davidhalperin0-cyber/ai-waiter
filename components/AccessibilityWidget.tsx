'use client';

import { useEffect, useState } from 'react';

export function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [focusVisible, setFocusVisible] = useState(false);
  const [underlineLinks, setUnderlineLinks] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;

    const storedNight = window.localStorage.getItem('a11y_night_mode') === 'true';
    const storedContrast = window.localStorage.getItem('a11y_high_contrast') === 'true';
    const storedFontSize = (window.localStorage.getItem('a11y_font_size') as 'normal' | 'large' | 'xlarge') || 'normal';
    const storedFocusVisible = window.localStorage.getItem('a11y_focus_visible') === 'true';
    const storedUnderlineLinks = window.localStorage.getItem('a11y_underline_links') === 'true';

    setNightMode(storedNight);
    setHighContrast(storedContrast);
    setFontSize(storedFontSize);
    setFocusVisible(storedFocusVisible);
    setUnderlineLinks(storedUnderlineLinks);

    if (storedNight) root.classList.add('a11y-night');
    if (storedContrast) root.classList.add('a11y-high-contrast');
    if (storedFontSize !== 'normal') root.classList.add(`a11y-font-${storedFontSize}`);
    if (storedFocusVisible) root.classList.add('a11y-focus-visible');
    if (storedUnderlineLinks) root.classList.add('a11y-underline-links');
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('a11y-font-normal', 'a11y-font-large', 'a11y-font-xlarge');
    if (fontSize !== 'normal') {
      root.classList.add(`a11y-font-${fontSize}`);
    }
    window.localStorage.setItem('a11y_font_size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    if (focusVisible) {
      root.classList.add('a11y-focus-visible');
    } else {
      root.classList.remove('a11y-focus-visible');
    }
    window.localStorage.setItem('a11y_focus_visible', String(focusVisible));
  }, [focusVisible]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    if (underlineLinks) {
      root.classList.add('a11y-underline-links');
    } else {
      root.classList.remove('a11y-underline-links');
    }
    window.localStorage.setItem('a11y_underline_links', String(underlineLinks));
  }, [underlineLinks]);

  return (
    <div className="fixed bottom-20 left-4 z-50 text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-neutral-900/80 border border-white/20 px-3 py-2 text-white shadow-lg hover:bg-neutral-800 transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-neutral-900"
        aria-label="פתיחת תפריט נגישות"
        aria-expanded={open}
      >
        <span>♿</span>
        <span>נגישות</span>
      </button>

      {open && (
        <div className="mt-2 w-64 rounded-2xl bg-neutral-900/95 border border-white/15 p-4 shadow-2xl backdrop-blur max-h-[80vh] overflow-y-auto">
          <p className="mb-3 text-xs text-neutral-300 font-semibold">אפשרויות נגישות</p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setHighContrast((v) => !v)}
              className={`w-full rounded-lg px-3 py-2.5 text-left text-xs border transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 ${
                highContrast
                  ? 'bg-white text-black border-white'
                  : 'bg-neutral-800 text-neutral-100 border-neutral-600 hover:bg-neutral-700'
              }`}
              aria-pressed={highContrast}
            >
              🎨 ניגודיות גבוהה
            </button>

            <button
              type="button"
              onClick={() => setNightMode((v) => !v)}
              className={`w-full rounded-lg px-3 py-2.5 text-left text-xs border transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 ${
                nightMode
                  ? 'bg-white text-black border-white'
                  : 'bg-neutral-800 text-neutral-100 border-neutral-600 hover:bg-neutral-700'
              }`}
              aria-pressed={nightMode}
            >
              🌙 מצב לילה
            </button>

            <div className="pt-2 border-t border-neutral-700">
              <p className="mb-2 text-[10px] text-neutral-400 font-medium">גודל טקסט</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFontSize('normal')}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] border transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 ${
                    fontSize === 'normal'
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-800 text-neutral-100 border-neutral-600 hover:bg-neutral-700'
                  }`}
                  aria-pressed={fontSize === 'normal'}
                >
                  רגיל
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('large')}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] border transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 ${
                    fontSize === 'large'
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-800 text-neutral-100 border-neutral-600 hover:bg-neutral-700'
                  }`}
                  aria-pressed={fontSize === 'large'}
                >
                  גדול
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('xlarge')}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] border transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 ${
                    fontSize === 'xlarge'
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-800 text-neutral-100 border-neutral-600 hover:bg-neutral-700'
                  }`}
                  aria-pressed={fontSize === 'xlarge'}
                >
                  גדול מאוד
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFocusVisible((v) => !v)}
              className={`w-full rounded-lg px-3 py-2.5 text-left text-xs border transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 ${
                focusVisible
                  ? 'bg-white text-black border-white'
                  : 'bg-neutral-800 text-neutral-100 border-neutral-600 hover:bg-neutral-700'
              }`}
              aria-pressed={focusVisible}
            >
              ⌨️ הדגשת פוקוס
            </button>

            <button
              type="button"
              onClick={() => setUnderlineLinks((v) => !v)}
              className={`w-full rounded-lg px-3 py-2.5 text-left text-xs border transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 ${
                underlineLinks
                  ? 'bg-white text-black border-white'
                  : 'bg-neutral-800 text-neutral-100 border-neutral-600 hover:bg-neutral-700'
              }`}
              aria-pressed={underlineLinks}
            >
              🔗 קו תחתון לקישורים
            </button>
          </div>

          <p className="mt-3 text-[10px] text-neutral-500 leading-relaxed">
            אפשרויות אלו משפיעות על כל המסך כדי לסייע בקריאה ונראות, בהתאם לתקן WCAG 2.1 AA.
          </p>
        </div>
      )}
    </div>
  );
}


