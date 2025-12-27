'use client';

import React from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ThemeWrapper from '../../../../../components/themes/ThemeWrapper';

// Modern SVG Icons
function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function LoyaltyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function HomePageContent({
  businessId,
  tableId,
}: {
  businessId: string;
  tableId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessInfo, setBusinessInfo] = useState<{
    name: string;
    logoUrl?: string;
    template: 'bar-modern' | 'bar-classic' | 'bar-mid' | 'pizza-modern' | 'pizza-classic' | 'pizza-mid' | 'sushi' | 'generic' | 'gold';
    customContent?: {
      menuButtonImageUrl?: string;
      promotions?: Array<{
        id: string;
        title: string;
        titleEn?: string;
        enabled: boolean;
      }>;
      contact?: {
        enabled: boolean;
        phone?: string;
        email?: string;
        whatsapp?: string;
        instagram?: string;
        facebook?: string;
      };
      loyaltyClub?: {
        enabled: boolean;
        title: string;
        titleEn?: string;
      };
      reviews?: {
        enabled: boolean;
        googleReviewsUrl?: string;
      };
    };
  } | null>(null);
  const [language, setLanguage] = useState<'he' | 'en'>('he');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const infoRes = await fetch(
          `/api/menu/info?businessId=${encodeURIComponent(businessId)}&_t=${Date.now()}`,
          { cache: 'no-store' }
        );
        const infoData = await infoRes.json();

        if (!infoRes.ok) {
          throw new Error(infoData.message || 'שגיאה בטעינת המידע');
        }

        setBusinessInfo({
          name: infoData.name || 'העסק',
          logoUrl: infoData.logoUrl,
          template: (infoData.template || 'generic') as any,
          customContent: infoData.customContent || null,
        });
      } catch (err: any) {
        setError(err.message || 'שגיאה בטעינת המידע');
      } finally {
        setLoading(false);
      }
    }

    if (businessId) {
      loadData();
    }
  }, [businessId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('menu_language');
    if (saved === 'he' || saved === 'en') {
      setLanguage(saved);
    }
  }, []);

  const switchLanguage = (lang: 'he' | 'en') => {
    setLanguage(lang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('menu_language', lang);
    }
  };

  if (loading) {
    return (
      <ThemeWrapper template="generic">
        <div className="min-h-screen flex items-center justify-center text-white">
          {language === 'en' ? 'Loading...' : 'טוען...'}
        </div>
      </ThemeWrapper>
    );
  }

  if (error || !businessInfo) {
    return (
      <ThemeWrapper template="generic">
        <div className="min-h-screen flex items-center justify-center text-white">
          <p>{error || 'שגיאה בטעינת המידע'}</p>
        </div>
      </ThemeWrapper>
    );
  }

  const template = businessInfo.template;
  const hasPromotions = businessInfo.customContent?.promotions?.some(p => p.enabled);
  const contact = businessInfo.customContent?.contact;
  const hasContact = contact?.enabled && (
    contact.phone || contact.email || contact.whatsapp || contact.instagram || contact.facebook
  );

  return (
    <ThemeWrapper template={template}>
      <main className="min-h-screen text-white flex flex-col">
        {/* Minimal Header */}
        <header className="pt-6 pb-4 px-6">
          <div className="flex items-center justify-end max-w-4xl mx-auto">
            {/* Language Toggle - Minimal */}
            <div className="flex gap-1.5">
              <button
                onClick={() => switchLanguage('he')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  language === 'he'
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                עברית
              </button>
              <button
                onClick={() => switchLanguage('en')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  language === 'en'
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </header>

        {/* Main Content - Vertical Spine (Strict Centered Axis) */}
        <div className="flex-1 flex flex-col items-center px-6">
          <div className="w-full max-w-md flex flex-col items-center">
            
            {/* 1. Top Padding (15vh) & Business Name - Brand Identity */}
            <div className="pt-[15vh] text-center w-full">
              {businessInfo.logoUrl ? (
                <motion.img
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  src={businessInfo.logoUrl}
                  alt={businessInfo.name}
                  className="h-20 max-h-[80px] w-auto mx-auto object-contain"
                />
              ) : (
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="text-4xl md:text-5xl font-semibold tracking-tight text-white uppercase"
                  style={{ fontFamily: 'var(--font-sans), system-ui, -apple-system, sans-serif' }}
                >
                  {businessInfo.name}
                </motion.h1>
              )}
            </div>

            {/* 2. Macro Spacer 1 (80px - 120px) */}
            <div className="h-20 md:h-32" />

            {/* 3. PRIMARY ACTION: Menu Entry Button - Glass / Blur Premium */}
            <div className="w-full">
              <Link href={`/menu/${businessId}/${tableId}`} className="block">
                <motion.button
                  className="relative w-full aspect-[2/1] md:aspect-[16/9] min-w-[280px] max-w-[340px] mx-auto rounded-3xl font-medium text-xl md:text-2xl transition-all overflow-hidden shadow-2xl flex items-center justify-center group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Glass Background / Blur Layer */}
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-[20px] saturate-[180%] z-0" 
                    style={{
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    }}
                  />
                  
                  {/* Fallback for browsers without backdrop-filter support */}
                  <div className="absolute inset-0 bg-white/92 opacity-0 group-hover:opacity-100 transition-opacity z-0" 
                    style={{
                      display: 'none',
                    }}
                  />
                  
                  {/* Subtle Food Image Layer (if provided) */}
                  {businessInfo.customContent?.menuButtonImageUrl && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay z-0 transition-transform duration-700 group-hover:scale-110"
                      style={{
                        backgroundImage: `url(${businessInfo.customContent.menuButtonImageUrl})`,
                      }}
                    />
                  )}
                  
                  {/* Text Overlay - Always Readable */}
                  <span className="relative z-10 text-white tracking-wide font-semibold drop-shadow-lg">
                    {language === 'en' ? 'Enter Menu' : 'צפה בתפריט'}
                  </span>
                </motion.button>
              </Link>
            </div>

            {/* 4. Macro Spacer 2 (64px) */}
            <div className="h-16 md:h-24" />

            {/* 5. Contact / Social Icons - Discovery Row (Secondary Whispers) */}
            {hasContact && (
              <div className="w-full">
                <div className="flex justify-center items-center gap-6 md:gap-8">
                  {contact.phone && (
                    <motion.a
                      href={`tel:${contact.phone}`}
                      className="group"
                      aria-label={language === 'en' ? 'Phone' : 'טלפון'}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
<PhoneIcon className="w-6 h-6 text-white/40 group-hover:text-white/80 transition-all duration-300" />
</motion.a>
                  )}
                  {contact.whatsapp && (
                    <motion.a
                      href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                      aria-label="WhatsApp"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45, duration: 0.5 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <WhatsAppIcon className="w-6 h-6 text-white/40 group-hover:text-white/80 transition-all duration-300" />
                    </motion.a>
                  )}
                  {contact.instagram && (
                    <motion.a
                      href={contact.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                      aria-label="Instagram"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <InstagramIcon className="w-6 h-6 text-white/40 group-hover:text-white/80 transition-all duration-300" />
                    </motion.a>
                  )}
                  {contact.facebook && (
                    <motion.a
                      href={contact.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                      aria-label="Facebook"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.55, duration: 0.5 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FacebookIcon className="w-6 h-6 text-white/40 group-hover:text-white/80 transition-all duration-300" />
                    </motion.a>
                  )}
                </div>
              </div>
            )}

            {/* 6. Optional Discovery - Loyalty / Reviews (Subtle Footer) */}
            <div className="mt-auto pt-16 pb-12 w-full flex flex-col items-center gap-4 opacity-40 hover:opacity-100 transition-opacity">
              {businessInfo.customContent?.loyaltyClub?.enabled && (
                <motion.button 
                  className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
<LoyaltyIcon className="w-4 h-4" />
<span>
                    {language === 'en' 
                      ? businessInfo.customContent.loyaltyClub.titleEn || 'Loyalty'
                      : businessInfo.customContent.loyaltyClub.title || 'מועדון לקוחות'}
                  </span>
                </motion.button>
              )}

              {businessInfo.customContent?.reviews?.enabled && businessInfo.customContent.reviews.googleReviewsUrl && (
                <motion.a
                  href={businessInfo.customContent.reviews.googleReviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white/80 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {language === 'en' ? 'Reviews' : 'ביקורות'}
                </motion.a>
              )}
            </div>
          </div>
        </div>

      </main>
    </ThemeWrapper>
  );
}

export default function HomePage({
  params,
}: {
  params: { businessId: string; tableId: string };
}) {
  const { businessId, tableId } = params;
  
  return <HomePageContent businessId={businessId} tableId={tableId} />;
}
