'use client';

import { motion } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';

export function PizzaThemeMid({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-red-800/25 via-orange-900/15 to-neutral-950">
      {/* Subtle warm glow */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-orange-400/15 via-red-500/10 to-transparent"
        animate={{
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Minimal pizza icons */}
      {mounted &&
        Array.from({ length: 2 }).map((_, i) => (
          <motion.div
            key={`pizza-${i}`}
            className="absolute text-6xl opacity-12"
            style={{
              left: `${30 + i * 40}%`,
              top: `${25 + i * 30}%`,
            }}
            animate={{
              rotate: [0, 360],
              opacity: [0.12, 0.2, 0.12],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              delay: i * 5,
              ease: 'linear',
            }}
          >
            🍕
          </motion.div>
        ))}

      {/* Subtle floating elements */}
      {mounted &&
        Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={`element-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: '8px',
              height: '8px',
              background: 'rgba(251, 146, 60, 0.3)',
            }}
            animate={{
              y: [0, -25, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeInOut',
            }}
          />
        ))}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}



