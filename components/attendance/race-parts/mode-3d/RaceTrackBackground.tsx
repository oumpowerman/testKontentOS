import React from 'react';
import { get3DCoordinates } from './projection';

interface RaceTrackBackgroundProps {
    totalLanes: number;
}

export const RaceTrackBackground: React.FC<RaceTrackBackgroundProps> = ({ totalLanes }) => {
    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-current text-slate-200" viewBox="0 0 1000 360" preserveAspectRatio="none">
            {/* Isometric parallel lane markers drawn programmatically based on user lane indices */}
            {Array.from({ length: totalLanes }).map((_, idx) => {
                const start = get3DCoordinates(idx, 0, totalLanes);
                const finish = get3DCoordinates(idx, 1, totalLanes);
                
                return (
                    <g key={idx}>
                        {/* The main dashed horizontal running track vector */}
                        <line 
                            x1={start.x} 
                            y1={start.y} 
                            x2={finish.x} 
                            y2={finish.y} 
                            stroke="#cbd5e1" 
                            strokeWidth="1.5" 
                            strokeDasharray="4 6" 
                        />
                        {/* Starting lane boundary node */}
                        <circle cx={start.x} cy={start.y} r="2.5" fill="#94a3b8" />
                        {/* Finishing lane boundary node */}
                        <circle cx={finish.x} cy={finish.y} r="2.5" fill="#475569" />
                    </g>
                );
            })}

            {/* Slanted Master Start Gate line */}
            {(() => {
                const startLeft = get3DCoordinates(0, 0, totalLanes);
                const startRight = get3DCoordinates(totalLanes - 1, 0, totalLanes);
                const midX = (startLeft.x + startRight.x) / 2;
                const midY = (startLeft.y + startRight.y) / 2;
                return (
                    <g>
                        <line 
                            x1={startLeft.x} 
                            y1={startLeft.y} 
                            x2={startRight.x} 
                            y2={startRight.y} 
                            stroke="#0f172a" 
                            strokeWidth="2.5" 
                            strokeDasharray="4 4" 
                        />
                        <text 
                            x={midX} 
                            y={midY - 12} // Adjust to appear above the rear Start line
                            fill="#64748b" 
                            fontSize="9" 
                            fontWeight="900" 
                            textAnchor="middle"
                            className="font-mono"
                        >
                            START LINE
                        </text>
                    </g>
                );
            })()}

            {/* Slanted Master Finish Gate line */}
            {(() => {
                const finishLeft = get3DCoordinates(0, 1, totalLanes);
                const finishRight = get3DCoordinates(totalLanes - 1, 1, totalLanes);
                const midX = (finishLeft.x + finishRight.x) / 2;
                const midY = (finishLeft.y + finishRight.y) / 2;
                return (
                    <g>
                        <line 
                            x1={finishLeft.x} 
                            y1={finishLeft.y} 
                            x2={finishRight.x} 
                            y2={finishRight.y} 
                            stroke="#cbd5e1" 
                            strokeWidth="5" 
                            strokeLinecap="round"
                        />
                        <line 
                            x1={finishLeft.x} 
                            y1={finishLeft.y} 
                            x2={finishRight.x} 
                            y2={finishRight.y} 
                            stroke="#0f172a" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                        />
                        <circle cx={finishLeft.x} cy={finishLeft.y} r="4" fill="#0f172a" />
                        <circle cx={finishRight.x} cy={finishRight.y} r="4" fill="#0f172a" />
                        <text 
                            x={midX} 
                            y={midY + 18} // Adjust to appear below the foreground Finish line
                            fill="#0f172a" 
                            fontSize="10" 
                            fontWeight="900" 
                            textAnchor="middle"
                            className="font-mono"
                        >
                            FINISH 🏆
                        </text>
                    </g>
                );
            })()}
        </svg>
    );
};
