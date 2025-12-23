'use client';

import { motion } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';

export function GenericTheme({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [particlePositions] = useState(() =>
    Array.from({ length: 6 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 4 + Math.random() * 2,
    })),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-black">
      {/* Subtle gradient animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-transparent to-blue-900/5"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating particles - more visible */}
      {mounted &&
        particlePositions.map((pos, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-sm"
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              width: '8px',
              height: '8px',
              background: 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, rgba(59,130,246,0.3) 50%, transparent 100%)',
              boxShadow: '0 0 10px rgba(168,85,247,0.5)',
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: pos.duration,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeInOut',
            }}
          />
        ))}

      {/* Gradient orbs */}
      {mounted &&
        Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={`orb-${i}`}
            className="absolute rounded-full blur-2xl opacity-30"
            style={{
              left: `${20 + i * 30}%`,
              top: `${30 + i * 20}%`,
              width: `${100 + i * 50}px`,
              height: `${100 + i * 50}px`,
              background: i % 2 === 0
                ? 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
              x: [0, 20, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.7,
              ease: 'easeInOut',
            }}
          />
        ))}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

