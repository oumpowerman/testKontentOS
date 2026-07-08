import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthDynamicBackgroundProps {
  authMode: 'LOGIN' | 'REGISTER' | 'FORGOT' | 'UPDATE';
}

interface ThemeConfig {
  bgClass: string;
  orbs: {
    orb1: { from: string; to: string; x: number; y: number; scale: number };
    orb2: { from: string; to: string; x: number; y: number; scale: number };
    orb3: { from: string; to: string; x: number; y: number; scale: number };
  };
}

const THEMES: Record<'LOGIN' | 'REGISTER' | 'FORGOT' | 'UPDATE', ThemeConfig> = {
  LOGIN: {
    bgClass: "from-[#f0f9ff] via-[#f8fafc] to-[#e0f2fe]",
    orbs: {
      orb1: { from: "rgba(59, 130, 246, 0.25)", to: "rgba(99, 102, 241, 0.25)", x: 20, y: -20, scale: 1.2 },
      orb2: { from: "rgba(14, 165, 233, 0.25)", to: "rgba(168, 85, 247, 0.15)", x: -30, y: 30, scale: 1.3 },
      orb3: { from: "rgba(99, 102, 241, 0.2)", to: "rgba(56, 189, 248, 0.15)", x: -10, y: -10, scale: 0.9 },
    }
  },
  REGISTER: {
    bgClass: "from-[#fff1f2] via-[#fafaf9] to-[#ffe4e6]",
    orbs: {
      orb1: { from: "rgba(244, 63, 94, 0.25)", to: "rgba(225, 29, 72, 0.2)", x: 10, y: -30, scale: 1.3 },
      orb2: { from: "rgba(245, 158, 11, 0.2)", to: "rgba(251, 113, 133, 0.25)", x: -20, y: 20, scale: 1.1 },
      orb3: { from: "rgba(244, 63, 94, 0.15)", to: "rgba(253, 186, 116, 0.2)", x: 20, y: 15, scale: 1.0 },
    }
  },
  FORGOT: {
    bgClass: "from-[#faf5ff] via-[#f8fafc] to-[#f3e8ff]",
    orbs: {
      orb1: { from: "rgba(168, 85, 247, 0.25)", to: "rgba(217, 70, 239, 0.2)", x: -10, y: -25, scale: 1.2 },
      orb2: { from: "rgba(99, 102, 241, 0.25)", to: "rgba(168, 85, 247, 0.2)", x: 25, y: 15, scale: 1.2 },
      orb3: { from: "rgba(139, 92, 246, 0.2)", to: "rgba(232, 121, 249, 0.15)", x: -25, y: 10, scale: 1.0 },
    }
  },
  UPDATE: {
    bgClass: "from-[#faf5ff] via-[#f8fafc] to-[#f3e8ff]",
    orbs: {
      orb1: { from: "rgba(168, 85, 247, 0.25)", to: "rgba(217, 70, 239, 0.2)", x: -10, y: -25, scale: 1.2 },
      orb2: { from: "rgba(99, 102, 241, 0.25)", to: "rgba(168, 85, 247, 0.2)", x: 25, y: 15, scale: 1.2 },
      orb3: { from: "rgba(139, 92, 246, 0.2)", to: "rgba(232, 121, 249, 0.15)", x: -25, y: 10, scale: 1.0 },
    }
  }
};

export const AuthDynamicBackground: React.FC<AuthDynamicBackgroundProps> = ({ authMode }) => {
  const activeTheme = THEMES[authMode] || THEMES.LOGIN;

  // Keyframes for premium fluid organic liquid morphing
  const fluidMorphs = [
    "40% 60% 70% 30% / 40% 50% 60% 50%",
    "60% 40% 50% 50% / 50% 60% 40% 60%",
    "50% 50% 60% 40% / 40% 40% 60% 60%",
    "40% 60% 70% 30% / 40% 50% 60% 50%"
  ];

  const fluidMorphsAlt = [
    "50% 50% 60% 40% / 40% 40% 60% 60%",
    "40% 60% 70% 30% / 40% 50% 60% 50%",
    "60% 40% 50% 50% / 50% 60% 40% 60%",
    "50% 50% 60% 40% / 40% 40% 60% 60%"
  ];

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none z-0">
      {/* Smooth transitioning solid base gradient */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${activeTheme.bgClass}`}
        initial={false}
        animate={{
          transition: { duration: 1.2, ease: "easeInOut" }
        }}
      />

      {/* Floating Dynamic Liquid Orbs */}
      <div className="absolute inset-0 w-full h-full blur-[90px] md:blur-[110px] scale-105">
        {/* Orb 1 */}
        <motion.div
          className="absolute right-[-10%] top-[-10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px]"
          animate={{
            x: activeTheme.orbs.orb1.x + '%',
            y: activeTheme.orbs.orb1.y + '%',
            scale: activeTheme.orbs.orb1.scale,
            background: `radial-gradient(circle, ${activeTheme.orbs.orb1.from} 0%, ${activeTheme.orbs.orb1.to} 100%)`,
            borderRadius: fluidMorphs,
            rotate: 360
          }}
          transition={{
            x: { type: "spring", stiffness: 25, damping: 15 },
            y: { type: "spring", stiffness: 25, damping: 15 },
            scale: { type: "spring", stiffness: 25, damping: 15 },
            background: { duration: 1.2, ease: "easeInOut" },
            borderRadius: { duration: 25, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 35, repeat: Infinity, ease: "linear" }
          }}
          style={{ mixBlendMode: 'multiply' }}
        />

        {/* Orb 2 */}
        <motion.div
          className="absolute left-[-15%] bottom-[-15%] w-[65vw] h-[65vw] max-w-[750px] max-h-[750px]"
          animate={{
            x: activeTheme.orbs.orb2.x + '%',
            y: activeTheme.orbs.orb2.y + '%',
            scale: activeTheme.orbs.orb2.scale,
            background: `radial-gradient(circle, ${activeTheme.orbs.orb2.from} 0%, ${activeTheme.orbs.orb2.to} 100%)`,
            borderRadius: fluidMorphsAlt,
            rotate: -360
          }}
          transition={{
            x: { type: "spring", stiffness: 20, damping: 12 },
            y: { type: "spring", stiffness: 20, damping: 12 },
            scale: { type: "spring", stiffness: 20, damping: 12 },
            background: { duration: 1.2, ease: "easeInOut" },
            borderRadius: { duration: 30, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 45, repeat: Infinity, ease: "linear" }
          }}
          style={{ mixBlendMode: 'multiply' }}
        />

        {/* Orb 3 */}
        <motion.div
          className="absolute left-[20%] top-[25%] w-[45vw] h-[45vw] max-w-[500px] max-h-[500px]"
          animate={{
            x: activeTheme.orbs.orb3.x + '%',
            y: activeTheme.orbs.orb3.y + '%',
            scale: activeTheme.orbs.orb3.scale,
            background: `radial-gradient(circle, ${activeTheme.orbs.orb3.from} 0%, ${activeTheme.orbs.orb3.to} 100%)`,
            borderRadius: fluidMorphs,
            rotate: 180
          }}
          transition={{
            x: { type: "spring", stiffness: 22, damping: 14 },
            y: { type: "spring", stiffness: 22, damping: 14 },
            scale: { type: "spring", stiffness: 22, damping: 14 },
            background: { duration: 1.2, ease: "easeInOut" },
            borderRadius: { duration: 28, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 40, repeat: Infinity, ease: "linear" }
          }}
          style={{ mixBlendMode: 'screen' }}
        />
      </div>

      {/* Gentle vignette to ground the composition */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.015)_100%)]" />
    </div>
  );
};
