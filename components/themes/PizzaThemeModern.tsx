'use client';

import { motion } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';

export function PizzaThemeModern({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [slices] = useState(() =>
    Array.from({ length: 4 }, (_, i) => ({
      left: 20 + i * 20,
      top: 30 + i * 15,
      duration: 2 + Math.random(),
    })),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-red-900/50 via-orange-900/40 to-neutral-950 overflow-hidden">
      {/* Rotating pizza - realistic pizza icon */}
      {mounted && (
        <motion.div
          className="absolute top-8 right-8 text-9xl opacity-35"
          animate={{ rotate: 360 }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          🍕
        </motion.div>
      )}

      {/* Multiple pizza slices floating */}
      {mounted &&
        Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`slice-${i}`}
            className="absolute text-6xl opacity-30"
            style={{
              left: `${8 + i * 12}%`,
              top: `${12 + (i % 4) * 22}%`,
            }}
            animate={{
              y: [0, -35, 0],
              rotate: [0, 180, 360],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          >
            🍕
          </motion.div>
        ))}

      {/* Stretching cheese animation - realistic */}
      {mounted &&
        [...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-sm"
            style={{
              left: `${18 + i * 18}%`,
              top: `${22 + i * 14}%`,
              width: `${90 + i * 18}px`,
              height: '7px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(253,224,71,0.95) 20%, rgba(251,191,36,1) 50%, rgba(253,224,71,0.95) 80%, transparent 100%)',
              boxShadow: '0 0 25px rgba(253,224,71,0.9)',
            }}
            animate={{
              scaleX: [1, 2.8, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2.5 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          />
        ))}

      {/* Hot steam from oven */}
      {mounted &&
        [...Array(8)].map((_, i) => (
          <motion.div
            key={`steam-${i}`}
            className="absolute w-4 h-24 rounded-full blur-lg opacity-70"
            style={{
              left: `${22 + i * 8}%`,
              bottom: '12%',
              background: 'linear-gradient(to top, rgba(255,255,255,0.9) 0%, rgba(220,220,220,0.6) 50%, transparent 100%)',
            }}
            animate={{
              y: [0, -140, 0],
              opacity: [0.7, 1, 0],
              scale: [1, 2, 1],
              x: [0, (Math.random() - 0.5) * 25],
            }}
            transition={{
              duration: 2.5 + Math.random() * 1,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeOut',
            }}
          />
        ))}

      {/* Pepperoni floating */}
      {mounted &&
        Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={`pepperoni-${i}`}
            className="absolute rounded-full opacity-50"
            style={{
              left: `${Math.random() * 90}%`,
              top: `${18 + Math.random() * 65}%`,
              width: '24px',
              height: '24px',
              background: 'radial-gradient(circle, rgba(220,38,38,0.95) 0%, rgba(185,28,28,0.8) 70%, rgba(153,27,27,0.6) 100%)',
              boxShadow: '0 0 15px rgba(220,38,38,0.7), inset 0 0 8px rgba(0,0,0,0.3)',
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 360],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          />
        ))}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
