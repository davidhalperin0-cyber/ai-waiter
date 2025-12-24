import './globals.css';
import type { Metadata } from 'next';
import React from 'react';
import { CartProvider } from '@/components/CartContext';
import { Toaster } from 'react-hot-toast';
import { AccessibilityWidget } from '@/components/AccessibilityWidget';

export const metadata: Metadata = {
  title: 'AI QR Ordering SaaS',
  description: 'Multi-tenant AI-powered QR ordering for restaurants and bars',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-neutral-950 text-white antialiased">
        <CartProvider>
          {/* Skip to main content link - WCAG requirement */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            דילוג לתוכן הראשי
          </a>
          {children}
          <AccessibilityWidget />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                direction: 'rtl',
                fontSize: '0.85rem',
              },
            }}
          />
        </CartProvider>
      </body>
    </html>
  );
}

