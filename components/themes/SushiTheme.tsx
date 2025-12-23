'use client';

import { motion } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';

export function SushiTheme({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [fish] = useState(() =>
    Array.from({ length: 5 }, (_, i) => ({
      top: 20 + i * 18,
      duration: 12 + Math.random() * 4,
      xOffset: (Math.random() - 0.5) * 20,
    })),
  );
  const [sushiPieces] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      left: 10 + i * 11,
      top: 35 + (i % 4) * 18,
      duration: 3 + Math.random() * 2,
    })),
  );
  const [bubbles] = useState(() =>
    Array.from({ length: 12 }, () => ({
      left: Math.random() * 100,
      size: 10 + Math.random() * 15,
      xOffset: (Math.random() - 0.5) * 30,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 3,
    })),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-900/40 via-cyan-900/30 to-neutral-950 overflow-hidden">
      {/* Sushi conveyor belt with sushi icons */}
      {mounted && (
        <motion.div
          className="absolute top-2 left-0 right-0 flex gap-8 overflow-hidden"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {[...Array(10)].map((_, i) => (
            <div key={i} className="text-4xl opacity-30 whitespace-nowrap">
              🍣 🍱 🍣 🍱
            </div>
          ))}
        </motion.div>
      )}

      {/* Ocean waves - realistic */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-400/40 to-transparent"
          style={{
            bottom: `${i * 20}px`,
            height: `${25 + i * 8}px`,
            clipPath: `polygon(0 ${100 - i * 5}%, 100% ${90 - i * 5}%, 100% 100%, 0% 100%)`,
          }}
          animate={{
            x: ['-100%', '100%'],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 5 + i * 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Swimming fish - emoji icons */}
      {mounted &&
        fish.map((f, i) => (
          <motion.div
            key={i}
            className="absolute text-6xl opacity-45"
            style={{
              top: `${f.top}%`,
            }}
            animate={{
              x: ['-10%', '110%'],
              y: [0, f.xOffset, 0],
              rotateY: [0, 180, 0],
            }}
            transition={{
              duration: f.duration,
              repeat: Infinity,
              delay: i * 2.5,
              ease: 'easeInOut',
            }}
          >
            🐟
          </motion.div>
        ))}

      {/* Floating sushi pieces - emoji icons */}
      {mounted &&
        sushiPieces.map((piece, i) => (
          <motion.div
            key={i}
            className="absolute text-5xl opacity-55"
            style={{
              left: `${piece.left}%`,
              top: `${piece.top}%`,
            }}
            animate={{
              y: [0, -35, 0],
              rotate: [0, 20, -20, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: piece.duration,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          >
            {i % 2 === 0 ? '🍣' : '🍱'}
          </motion.div>
        ))}

      {/* Bubbles rising from bottom - realistic */}
      {mounted &&
        bubbles.map((bubble, i) => (
          <motion.div
            key={`bubble-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${bubble.left}%`,
              bottom: '5%',
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95) 0%, rgba(34,211,238,0.7) 50%, transparent 100%)',
              boxShadow: '0 0 12px rgba(34,211,238,0.6), inset -4px -4px 6px rgba(0,0,0,0.25)',
              border: '1.5px solid rgba(255,255,255,0.5)',
            }}
            animate={{
              y: [0, -900],
              x: [0, bubble.xOffset],
              opacity: [0.8, 1, 0.6, 0],
              scale: [1, 1.5, 1.3, 0.6],
            }}
            transition={{
              duration: bubble.duration,
              repeat: Infinity,
              delay: bubble.delay,
              ease: 'easeOut',
            }}
          />
        ))}

      {/* Seaweed floating */}
      {mounted &&
        Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={`seaweed-${i}`}
            className="absolute text-6xl opacity-20"
            style={{
              left: `${20 + i * 25}%`,
              bottom: '10%',
            }}
            animate={{
              y: [0, -15, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.8,
              ease: 'easeInOut',
            }}
          >
            🌿
          </motion.div>
        ))}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

