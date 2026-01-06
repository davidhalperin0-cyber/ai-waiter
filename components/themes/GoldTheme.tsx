'use client';

import { ReactNode } from 'react';

export function GoldTheme({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-amber-50 via-yellow-50/30 to-amber-50">
      {/* Elegant gold pattern */}
      <div 
        className="absolute inset-0 opacity-8"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 15px,
            rgba(217, 119, 6, 0.15) 15px,
            rgba(217, 119, 6, 0.15) 30px
          )`,
        }}
      />
      
      {/* Luxurious gold border */}
      <div className="absolute inset-0 border-8 border-amber-600/25 pointer-events-none" />
      <div className="absolute inset-4 border-2 border-amber-500/20 pointer-events-none" />
      
      {/* Ornate corners */}
      <div className="absolute top-0 left-0 w-32 h-32">
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-amber-700/30" />
        <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-amber-600/25" />
      </div>
      <div className="absolute top-0 right-0 w-32 h-32">
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-amber-700/30" />
        <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-amber-600/25" />
      </div>
      <div className="absolute bottom-0 left-0 w-32 h-32">
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-amber-700/30" />
        <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-amber-600/25" />
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32">
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-amber-700/30" />
        <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-amber-600/25" />
      </div>

      {/* Subtle gold shimmer effect */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: `linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 215, 0, 0.1) 50%,
            transparent 100%
          )`,
          animation: 'shimmer 3s infinite',
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}







