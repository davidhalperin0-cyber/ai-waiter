'use client';

import { ReactNode } from 'react';

export function PizzaThemeClassic({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-red-50 via-orange-50/50 to-red-50">
      {/* Classic Italian pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 20px,
            rgba(220, 38, 38, 0.1) 20px,
            rgba(220, 38, 38, 0.1) 40px
          )`,
        }}
      />
      
      {/* Vintage border */}
      <div className="absolute inset-0 border-8 border-red-800/15 pointer-events-none" />
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-red-700/25" />
      <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 border-red-700/25" />
      <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 border-red-700/25" />
      <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-red-700/25" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}




