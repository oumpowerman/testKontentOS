import React from 'react';

interface RaceTrackBackgroundProps {
    totalLanes: number;
}

export const RaceTrackBackground: React.FC<RaceTrackBackgroundProps> = ({ totalLanes }) => {
    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-current text-slate-200" viewBox="0 0 1000 230" preserveAspectRatio="none">
            {/* Isometric parallel lane markers drawn programmatically based on user lane indices */}
            {Array.from({ length: totalLanes }).map((_, idx) => {
                const y = 230 - 12 - (idx / (totalLanes - 1 || 1)) * 140;
                const defaultStart = 120 + (idx / (totalLanes - 1 || 1)) * 140;
                const defaultFinish = 780 + (idx / (totalLanes - 1 || 1)) * 100;
                
                return (
                    <g key={idx}>
                        {/* The main dashed horizontal running track vector */}
                        <line 
                            x1={defaultStart} 
                            y1={y} 
                            x2={defaultFinish} 
                            y2={y} 
                            stroke="#cbd5e1" 
                            strokeWidth="1" 
                            strokeDasharray="4 6" 
                        />
                        {/* Starting lane boundary node */}
                        <circle cx={defaultStart} cy={y} r="1.5" fill="#94a3b8" />
                        {/* Finishing lane boundary node */}
                        <circle cx={defaultFinish} cy={y} r="1.5" fill="#475569" />
                    </g>
                );
            })}

            {/* Slanted Master Start Gate line */}
            <line x1="120" y1={230 - 12} x2="260" y2={230 - 152} stroke="#0f172a" strokeWidth="2" strokeDasharray="3 3" />
            <text x="145" y={150} fill="#64748b" fontSize="8" fontWeight="900" transform="rotate(-30, 145, 150)" className="font-mono">START LINE</text>

            {/* Slanted Master Finish Gate line */}
            <line x1="780" y1={230 - 12} x2="880" y2={230 - 152} stroke="#0f172a" strokeWidth="2" />
            <text x="800" y={150} fill="#0f172a" fontSize="8" fontWeight="900" transform="rotate(-30, 800, 150)" className="font-mono">FINISH 🏆</text>
        </svg>
    );
};
