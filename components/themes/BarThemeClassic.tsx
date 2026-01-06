'use client';

import { ReactNode } from 'react';

export function BarThemeClassic({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-amber-50 via-amber-100/50 to-amber-50">
      {/* Classic wood texture pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(139, 69, 19, 0.1) 10px,
            rgba(139, 69, 19, 0.1) 20px
          )`,
        }}
      />
      
      {/* Subtle vintage border */}
      <div className="absolute inset-0 border-8 border-amber-800/20 pointer-events-none" />
      
      {/* Classic decorative corners */}
      <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-amber-700/30" />
      <div className="absolute top-0 right-0 w-24 h-24 border-t-4 border-r-4 border-amber-700/30" />
      <div className="absolute bottom-0 left-0 w-24 h-24 border-b-4 border-l-4 border-amber-700/30" />
      <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-amber-700/30" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}







