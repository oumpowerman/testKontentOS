import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';

const SilverAura = lazy(() => import('./SilverAura'));
const GoldAura = lazy(() => import('./GoldAura'));
const CelestialAura = lazy(() => import('./CelestialAura'));

interface PlayerAuraProps {
    level: number;
    x: number;
    y: number;
}

export const PlayerAura: React.FC<PlayerAuraProps> = ({ level, x, y }) => {
    // Determine Aura type based on RPG tier bracket boundaries
    // Level 1-2: Beginners (No Aura to make level 3+ unlock highly rewarding!)
    if (level < 3) {
        return null;
    }

    return (
        <div 
            className="absolute pointer-events-none z-0 overflow-visible"
            style={{ 
                left: `${x}px`, 
                top: `${y}px`,
                transform: 'translate(-50%, -50%)',
                width: '1px',
                height: '1px'
            }}
        >
            <Suspense fallback={null}>
                {level >= 15 ? (
                    <CelestialAura />
                ) : level >= 8 ? (
                    <GoldAura />
                ) : (
                    <SilverAura />
                )}
            </Suspense>
        </div>
    );
};

export default PlayerAura;
