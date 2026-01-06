'use client';

import { ReactNode } from 'react';

export function BarThemeClassic({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#1a1a1a]">
      {/* Modern subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] via-[#1f1f1f] to-[#1a1a1a] opacity-100" />
      
      {/* Subtle texture - very minimal, modern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}







