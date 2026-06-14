import React from 'react';

// Generatively styled magical stars
const sparkles = Array.from({ length: 18 }).map((_, i) => {
    const starColors = [
        'rgba(244, 63, 94, 0.65)',  // Rose
        'rgba(234, 179, 8, 0.65)',  // Amber
        'rgba(34, 197, 94, 0.65)',  // Emerald
        'rgba(59, 130, 246, 0.65)', // Blue
        'rgba(168, 85, 247, 0.65)', // Purple
        'rgba(255, 255, 255, 0.8)'  // Sparkling white
    ];
    return {
        id: `magic-sparkle-${i}`,
        top: `${5 + Math.random() * 80}%`,
        left: `${3 + Math.random() * 94}%`,
        size: Math.random() * 14 + 6,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        delay: Math.random() * -10,
        duration: Math.random() * 4 + 3
    };
});

// Rising magical orbs / dream bubbles
const dreamBubbles = Array.from({ length: 10 }).map((_, i) => ({
    id: `dream-bubble-${i}`,
    left: `${10 + Math.random() * 80}%`,
    bottom: `-${10 + Math.random() * 10}%`,
    size: Math.random() * 8 + 4,
    duration: Math.random() * 15 + 15,
    delay: Math.random() * -10,
    blur: Math.random() * 1 + 1
}));

// Fluffy dreaming clouds with sweet tint
const clouds = [
    { id: 'cloud-1', y: '25%', scale: 0.9, duration: 45, delay: -15, opacity: 0.75, color: '#ffffff' },
    { id: 'cloud-2', y: '40%', scale: 1.1, duration: 60, delay: -40, opacity: 0.6, color: '#fdf2f8' },
    { id: 'cloud-3', y: '15%', scale: 0.7, duration: 35, delay: -5, opacity: 0.8, color: '#eff6ff' },
    { id: 'cloud-4', y: '55%', scale: 0.85, duration: 50, delay: -22, opacity: 0.7, color: '#fff9db' },
    { id: 'cloud-5', y: '30%', scale: 1.0, duration: 55, delay: -10, opacity: 0.65, color: '#faf5ff' },
];

const RainbowSky: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-tr from-[#ffa8bc] via-[#f7d6f5] to-[#b1dcff] transition-all duration-1000">
            <style>{`
                @keyframes cloud-drift-flow {
                    0% { transform: translateX(-35vw); }
                    100% { transform: translateX(115vw); }
                }
                @keyframes majestic-rainbow-glow {
                    0%, 100% { 
                        opacity: 0.65; 
                        filter: drop-shadow(0 0 25px rgba(254, 219, 219, 0.45));
                        transform: scale(1);
                    }
                    50% { 
                        opacity: 0.88; 
                        filter: drop-shadow(0 0 50px rgba(186, 230, 253, 0.8));
                        transform: scale(1.02);
                    }
                }
                @keyframes star-shimmer-magic {
                    0%, 100% { transform: scale(0.4) rotate(0deg); opacity: 0.15; filter: drop-shadow(0 0 2px rgba(255,255,255,0.2)); }
                    50% { transform: scale(1.25) rotate(180deg); opacity: 0.95; filter: drop-shadow(0 0 8px currentColor); }
                }
                @keyframes dream-orb-float {
                    0% { transform: translateY(0) translateX(0); opacity: 0; }
                    10% { opacity: 0.6; }
                    90% { opacity: 0.6; }
                    100% { transform: translateY(-110vh) translateX(40px); opacity: 0; }
                }
                @keyframes shooting-star-magic {
                    0% { transform: translate(110vw, -10vh) rotate(-40deg) scale(0); opacity: 0; }
                    1% { opacity: 1; transform: translate(108vw, -8vh) rotate(-40deg) scale(1.2); }
                    10% { opacity: 0.8; transform: translate(60vw, 30vh) rotate(-40deg) scale(1); }
                    14% { opacity: 0; transform: translate(45vw, 42vh) rotate(-40deg) scale(0); }
                    100% { transform: translate(-20vw, 90vh) rotate(-40deg) scale(0); opacity: 0; }
                }
                @keyframes shooting-star-magic-2 {
                    0% { transform: translate(80vw, -15vh) rotate(-35deg) scale(0); opacity: 0; }
                    30% { transform: translate(80vw, -15vh) rotate(-35deg) scale(0); opacity: 0; }
                    31% { opacity: 1; transform: translate(78vw, -13vh) rotate(-35deg) scale(1.3); }
                    40% { opacity: 0.7; transform: translate(40vw, 20vh) rotate(-35deg) scale(0.9); }
                    43% { opacity: 0; transform: translate(25vw, 32vh) rotate(-35deg) scale(0); }
                    100% { transform: translate(-30vw, 80vh) rotate(-35deg) scale(0); opacity: 0; }
                }
            `}</style>

            {/* Glowing grand ambient sun behind the rainbow */}
            <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-100/35 rounded-full filter blur-[60px] animate-pulse pointer-events-none select-none duration-[8000ms]" />

            {/* Shooting Star 1 */}
            <div 
                className="absolute w-28 h-[2px] bg-gradient-to-r from-transparent via-white/90 to-sky-100 z-1 pointer-events-none"
                style={{ animation: 'shooting-star-magic 14s linear infinite', animationDelay: '1s' }}
            />

            {/* Shooting Star 2 */}
            <div 
                className="absolute w-36 h-[2px] bg-gradient-to-r from-transparent via-pink-100 to-indigo-100 z-1 pointer-events-none"
                style={{ animation: 'shooting-star-magic-2 18s linear infinite', animationDelay: '6s' }}
            />

            {/* Grand Atmospheric Rainbow with SVG Blur Filter */}
            <div className="absolute inset-x-0 top-[-8%] flex justify-center z-1 w-full h-[85%] select-none pointer-events-none">
                <svg 
                    viewBox="0 0 1440 600" 
                    className="w-[124%] max-w-[1440px] h-full origin-top transition-all duration-1000"
                    preserveAspectRatio="none"
                    style={{ animation: 'majestic-rainbow-glow 11s ease-in-out infinite' }}
                >
                    <g filter="url(#high-glow-blur)" opacity="0.8">
                        {/* Perfect overlapping nested arc bands for continuous, zero-gap seamless rainbow */}
                        {/* Red Arc */}
                        <path d="M 120,580 A 600,600 0 0,1 1320,580" fill="none" stroke="#ff4d79" strokeWidth="26" strokeLinecap="round" />
                        {/* Orange Arc */}
                        <path d="M 143,580 A 577,577 0 0,1 1297,580" fill="none" stroke="#ff9b3d" strokeWidth="26" strokeLinecap="round" />
                        {/* Yellow Arc */}
                        <path d="M 166,580 A 554,554 0 0,1 1274,580" fill="none" stroke="#fff44f" strokeWidth="26" strokeLinecap="round" />
                        {/* Green Arc */}
                        <path d="M 189,580 A 531,531 0 0,1 1251,580" fill="none" stroke="#4eff98" strokeWidth="26" strokeLinecap="round" />
                        {/* Cyan Arc */}
                        <path d="M 212,580 A 508,508 0 0,1 1228,580" fill="none" stroke="#2bf9ff" strokeWidth="26" strokeLinecap="round" />
                        {/* Indigo Blue Arc */}
                        <path d="M 235,580 A 485,485 0 0,1 1205,580" fill="none" stroke="#3b82f6" strokeWidth="26" strokeLinecap="round" />
                        {/* Violet/Magenta Arc */}
                        <path d="M 258,580 A 462,462 0 0,1 1182,580" fill="none" stroke="#d946ef" strokeWidth="26" strokeLinecap="round" />
                    </g>
                    <defs>
                        <filter id="high-glow-blur" x="-30%" y="-30%" width="160%" height="160%">
                            {/* Blends colors into a gorgeous atmospheric bloom */}
                            <feGaussianBlur stdDeviation="15" />
                        </filter>
                    </defs>
                </svg>
            </div>

            {/* Glowing Magical Rising Orbs / bubbles */}
            {dreamBubbles.map((orb) => (
                <div
                    key={orb.id}
                    className="absolute bg-white rounded-full opacity-40 shadow-[0_0_10px_rgba(255,255,255,0.7)]"
                    style={{
                        left: orb.left,
                        bottom: orb.bottom,
                        width: orb.size,
                        height: orb.size,
                        filter: `blur(${orb.blur}px)`,
                        animation: `dream-orb-float ${orb.duration}s infinite linear`,
                        animationDelay: `${orb.delay}s`
                    }}
                />
            ))}

            {/* Twinkling Magical Sparkle Stars across the beautiful sky */}
            {sparkles.map((star) => (
                <div
                    key={star.id}
                    className="absolute z-2"
                    style={{
                        top: star.top,
                        left: star.left,
                        width: star.size,
                        height: star.size,
                        color: star.color,
                        animation: `star-shimmer-magic ${star.duration}s infinite ease-in-out`,
                        animationDelay: `${star.delay}s`
                    }}
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-[0_0_6px_currentColor]">
                        <path d="M12 0L15.3 8.7L24 12L15.3 15.3L12 24L8.7 15.3L0 12L8.7 8.7L12 0Z" />
                    </svg>
                </div>
            ))}

            {/* Drifting fluffy dreamy clouds sliding across the rainbow baseline */}
            {clouds.map((cloud) => (
                <div
                    key={cloud.id}
                    className="absolute z-3"
                    style={{ 
                        top: cloud.y, 
                        transform: `scale(${cloud.scale})`, 
                        opacity: cloud.opacity,
                        animation: `cloud-drift-flow ${cloud.duration}s linear infinite`,
                        animationDelay: `${cloud.delay}s`
                    }}
                >
                    <svg width="220" height="70" viewBox="0 0 200 60" fill="white" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg opacity-90 transition-all duration-1000">
                        <path d="M40 40 C 40 21, 80 21, 80 40 C 80 12, 140 12, 140 40 C 170 40, 170 60, 140 60 L 40 60 C 10 60, 10 40, 40 40 Z" fill={cloud.color} />
                    </svg>
                </div>
            ))}
        </div>
    );
};

export default RainbowSky;

