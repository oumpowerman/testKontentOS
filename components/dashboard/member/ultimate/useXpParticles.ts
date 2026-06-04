import { useState, useRef } from 'react';

export interface XpParticle {
    id: number;
    x: number;
    y: number;
    color: string;
    scale: number;
    symbol?: string;
}

export function useXpParticles() {
    const [particles, setParticles] = useState<XpParticle[]>([]);
    const particleIdCounter = useRef(0);

    const triggerExperienceExplosion = (clientX?: number, clientY?: number, type: 'xp' | 'heart' | 'spell' = 'xp') => {
        const initialX = clientX ?? (window.innerWidth / 2);
        const initialY = clientY ?? (window.innerHeight / 2 - 100);
        const newParticles: XpParticle[] = [];
        
        // Custom branding reaction lists
        let colors = ['#f43f5e', '#a855f7', '#6366f1', '#10e981', '#fbbf24', '#ff79c6'];
        let charSymbol = '✦';
        let count = 45;

        if (type === 'heart') {
            colors = ['#ff4d6d', '#ff758f', '#ff8fa3', '#ff0a54', '#ff5c8a'];
            charSymbol = '❤️';
            count = 25; // lighter bubble burst
        } else if (type === 'spell') {
            colors = ['#c084fc', '#a855f7', '#6366f1', '#38bdf8', '#fb7185', '#fbbf24'];
            charSymbol = '⚡';
            count = 35;
        }
        
        for (let i = 0; i < count; i++) {
            newParticles.push({
                id: particleIdCounter.current++,
                x: initialX + (Math.random() * 80 - 40),
                y: initialY + (Math.random() * 80 - 40),
                color: colors[Math.floor(Math.random() * colors.length)],
                scale: type === 'xp' ? Math.random() * 1.5 + 0.5 : Math.random() * 0.9 + 0.6,
                symbol: charSymbol
            });
        }
        setParticles(prev => [...prev, ...newParticles]);

        // Auto remove particles after animation completes
        setTimeout(() => {
            setParticles(prev => prev.filter(p => !newParticles.includes(p)));
        }, 1800);
    };

    return {
        particles,
        triggerExperienceExplosion
    };
}
