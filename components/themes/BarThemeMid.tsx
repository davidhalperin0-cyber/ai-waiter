'use client';

import { motion } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';

export function BarThemeMid({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-amber-800/30 via-amber-900/20 to-neutral-950">
      {/* Subtle animated background glow */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-amber-400/20 via-amber-500/10 to-transparent"
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Minimal floating elements */}
      {mounted &&
        Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={`element-${i}`}
            className="absolute text-5xl opacity-15"
            style={{
              left: `${20 + i * 30}%`,
              top: `${20 + i * 25}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.8,
              ease: 'easeInOut',
            }}
          >
            🍺
          </motion.div>
        ))}

      {/* Subtle particles */}
      {mounted &&
        Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: '6px',
              height: '6px',
              background: 'rgba(251, 191, 36, 0.4)',
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          />
        ))}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}







