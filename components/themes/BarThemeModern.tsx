'use client';

import { motion } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';

export function BarThemeModern({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [bubbles] = useState(() =>
    Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      size: 12 + Math.random() * 20,
      xOffset: (Math.random() - 0.5) * 35,
      duration: 2.5 + Math.random() * 2,
      delay: Math.random() * 2,
    })),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-amber-900/40 via-neutral-950 to-black overflow-hidden">
      {/* Beer glass icons floating */}
      {mounted &&
        Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={`glass-${i}`}
            className="absolute text-7xl opacity-25"
            style={{
              left: `${10 + i * 25}%`,
              top: `${15 + i * 20}%`,
            }}
            animate={{
              y: [0, -25, 0],
              rotate: [0, 8, -8, 0],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'easeInOut',
            }}
          >
            🍺
          </motion.div>
        ))}

      {/* Animated beer bubbles - realistic */}
      {mounted &&
        bubbles.map((bubble, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${bubble.left}%`,
              bottom: '8%',
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95) 0%, rgba(251,191,36,0.8) 40%, rgba(245,158,11,0.5) 70%, transparent 100%)',
              boxShadow: '0 0 18px rgba(251,191,36,0.7), inset -6px -6px 12px rgba(0,0,0,0.25)',
              border: '1.5px solid rgba(255,255,255,0.4)',
            }}
            animate={{
              y: [0, -1000],
              x: [0, bubble.xOffset],
              opacity: [0.8, 1, 0.7, 0],
              scale: [1, 1.4, 1.2, 0.7],
            }}
            transition={{
              duration: bubble.duration,
              repeat: Infinity,
              delay: bubble.delay,
              ease: 'easeOut',
            }}
          />
        ))}

      {/* Strong neon glow effect - bar atmosphere */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-52 bg-gradient-to-b from-amber-400/50 via-amber-500/30 to-transparent"
        animate={{
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
