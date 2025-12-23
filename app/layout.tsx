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
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-white antialiased">
        <CartProvider>
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

