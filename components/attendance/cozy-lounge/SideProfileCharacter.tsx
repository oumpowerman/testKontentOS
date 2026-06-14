import React from 'react';
import { motion } from 'framer-motion';
import { User } from '../../../types/core';

export interface SideProfileCharacterProps {
    user: User;
    pose: 'idle' | 'sleeping' | 'drinking' | 'gaming' | 'singing' | 'stretching' | 'lifting' | 'sitting' | 'sleeping_bed' | 'lifting_bench' | 'punching';
    direction?: 'left' | 'right';
    scale?: number;
}

const getDeterministicStyle = (userId: string) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx1 = Math.abs(hash) % 5;
    const idx2 = Math.abs(hash >> 3) % 5;
    const idx3 = Math.abs(hash >> 6) % 5;

    const hairColors = ['#f59e0b', '#7c2d12', '#1e293b', '#ec4899', '#3b82f6'];
    const shirtColors = ['#6366f1', '#10b981', '#f43f5e', '#a855f7', '#06b6d4'];
    const skinColors = ['#ffedd5', '#fef3c7', '#ffe4e6', '#fed7aa', '#f5f5f4'];
    
    // styles: 'short' (0), 'ponytail' (1), 'cap' (2), 'curly' (3), 'bob' (4)
    const hairStyle = idx1;
    const hairColor = hairColors[idx2];
    const shirtColor = shirtColors[idx3];
    const skinColor = skinColors[(idx1 + idx2) % skinColors.length];

    return {
        hairStyle,
        hairColor,
        shirtColor,
        skinColor
    };
};

export const SideProfileCharacter: React.FC<SideProfileCharacterProps> = ({
    user,
    pose,
    direction = 'right',
    scale = 1.0
}) => {
    const { hairStyle, hairColor, shirtColor, skinColor } = getDeterministicStyle(user.id);
    const isSleeping = pose === 'sleeping' || pose === 'sleeping_bed';

    // head position configuration
    const headCenter = (pose === 'sleeping_bed' || pose === 'lifting_bench')
        ? { x: 16, y: 38 }
        : { x: 26, y: 28 };

    // Animation settings
    const headSway = isSleeping 
        ? { rotate: [2, -2, 2], y: [0, 0.4, 0] }
        : pose === 'drinking'
        ? { rotate: [0, 8, 0], y: [0, -1, 0] }
        : { rotate: [-1, 2, -1] };

    const headTransition = isSleeping 
        ? { duration: 3, repeat: Infinity, ease: 'easeInOut' as const }
        : pose === 'drinking'
        ? { duration: 4, repeat: Infinity, ease: 'easeInOut' as const }
        : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const };

    const armMovement = pose === 'lifting'
        ? { y: [2, -12, 2], rotate: [0, -20, 0] }
        : pose === 'singing'
        ? { rotate: [-5, 5, -5] }
        : pose === 'gaming'
        ? { x: [0, 0.5, 0], y: [0, -0.5, 0] }
        : { y: [0, 0.8, 0] };

    const armTransition = pose === 'lifting'
        ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const }
        : { duration: 0.8, repeat: Infinity, ease: 'easeInOut' as const };

    // Flip side-view horizontally depending on direction
    const transformX = direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)';

    return (
        <div 
            className="relative flex flex-col items-center select-none"
            style={{ 
                transform: `scale(${scale})`,
                width: '64px',
                height: '76px'
            }}
        >
            {/* CHARACTER SVG BODY */}
            <svg 
                width="64" 
                height="76" 
                viewBox="0 0 64 76" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="transition-transform duration-300"
                style={{ transform: transformX }}
            >
                {/* 2D OUTLINE FILTER */}
                <defs>
                    <filter id="drop-shadow">
                        <feDropShadow dx="1" dy="1.5" stdDeviation="0.5" floodColor="#0f172a" floodOpacity="0.15" />
                    </filter>
                </defs>

                <g filter="url(#drop-shadow)">
                    {/* LEGS / FEET */}
                    {pose === 'sleeping_bed' ? (
                        // Horizontal flat sleeper legs (bed)
                        <g>
                            <path d="M24 48 H 52" stroke="#000" strokeWidth="6" strokeLinecap="round" />
                            <path d="M24 48 H 52" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
                            {/* Cute feet / socks */}
                            <circle cx="53" cy="48" r="3.5" fill="#f87171" stroke="#000" strokeWidth="1.5" />
                        </g>
                    ) : pose === 'lifting_bench' ? (
                        // Legs dangling from physical bench press deck
                        <g>
                            <path d="M22 55 H 34 V 74" stroke="#000" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            <path d="M22 55 H 34 V 74" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            <rect x="31" y="72" width="7" height="3.5" rx="1.5" fill="#f43f5e" stroke="#000" strokeWidth="1.2" />
                        </g>
                    ) : pose === 'sitting' ? (
                        // High-fidelity sitting posture - angled L-shape
                        <g>
                            <path d="M24 57 H 34 V 71" stroke="#000" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            <path d="M24 57 H 34 V 71" stroke="#334155" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            <path d="M25 57 H 38 V 71" stroke="#000" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            <path d="M25 57 H 38 V 71" stroke="#475569" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            <rect x="31" y="69" width="7" height="3.5" rx="1.5" fill="#f87171" stroke="#000" strokeWidth="1.2" />
                            <rect x="35" y="69" width="7" height="3.5" rx="1.5" fill="#f87171" stroke="#000" strokeWidth="1.2" />
                        </g>
                    ) : pose === 'sleeping' ? (
                        // Horizontal legs
                        <g>
                            <path d="M24 64 H 46" stroke="#000" strokeWidth="6" strokeLinecap="round" />
                            <path d="M24 64 H 46" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
                            {/* Cute feet / socks */}
                            <circle cx="47" cy="64" r="3.5" fill="#f87171" stroke="#000" strokeWidth="1.5" />
                        </g>
                    ) : pose === 'stretching' ? (
                        // Legs flat on floor stretch
                        <g>
                            <path d="M24 72 H 50" stroke="#000" strokeWidth="5" strokeLinecap="round" />
                            <path d="M24 72 H 50" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
                            <circle cx="51" cy="72" r="3" fill="#f87171" stroke="#000" strokeWidth="1.5" />
                        </g>
                    ) : pose === 'drinking' ? (
                        // Sitting high stool legs dangling
                        <g>
                            {/* Leg 1 */}
                            <path d="M25 56 Q 30 64 26 73" stroke="#000" strokeWidth="5" strokeLinecap="round" />
                            <path d="M25 56 Q 30 64 26 73" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
                            {/* Blue shoe */}
                            <path d="M24 73 C 27 73 30 74 29 76 H 23 Z" fill="#3b82f6" stroke="#000" strokeWidth="1.2" />
                        </g>
                    ) : (
                        // Stand / Default status legs slightly apart
                        <g>
                            {/* Leg left */}
                            <path d="M23 58 V 74" stroke="#000" strokeWidth="5.5" strokeLinecap="round" />
                            <path d="M23 58 V 74" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
                            {/* Leg right */}
                            <path d="M29 58 V 74" stroke="#000" strokeWidth="5.5" strokeLinecap="round" />
                            <path d="M29 58 V 74" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
                            
                            {/* Shoes */}
                            <rect x="19" y="72" width="7" height="3.5" rx="1.5" fill="#f87171" stroke="#000" strokeWidth="1.2" />
                            <rect x="26" y="72" width="7" height="3.5" rx="1.5" fill="#f87171" stroke="#000" strokeWidth="1.2" />
                        </g>
                    )}

                    {/* TORSO / SHIRT */}
                    {pose === 'sleeping_bed' ? (
                        <motion.g animate={{ y: [0, -0.6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                            <rect x="14" y="38" width="22" height="15" rx="6" fill="#000" />
                            <rect x="15" y="39" width="20" height="13" rx="5" fill={shirtColor} />
                        </motion.g>
                    ) : pose === 'lifting_bench' ? (
                        <motion.g animate={{ y: [0, -0.4, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
                            <rect x="14" y="44" width="22" height="13" rx="4" fill="#000" />
                            <rect x="15" y="45" width="20" height="11" rx="3" fill={shirtColor} />
                        </motion.g>
                    ) : pose === 'sleeping' ? (
                        // Lying flat
                        <g>
                            <rect x="14" y="44" width="22" height="15" rx="6" fill="#000" />
                            <rect x="15" y="45" width="20" height="13" rx="5" fill={shirtColor} />
                        </g>
                    ) : pose === 'stretching' ? (
                        // Tilted forward torso
                        <g>
                            <path d="M12 48 Q 23 42 27 58 Z" fill="#000" />
                            <path d="M13 49 Q 22 44 26 57 Z" fill={shirtColor} />
                        </g>
                    ) : (
                        // Default sitting or standing upright torso
                        <g>
                            <rect x="18" y="40" width="16" height="20" rx="5" fill="#000" />
                            <rect x="19" y="41" width="14" height="18" rx="4" fill={shirtColor} />
                        </g>
                    )}

                    {/* HEAD GROUP WITH TRANSLATION WRAPPER */}
                    <g transform={`translate(${headCenter.x - 26}, ${headCenter.y - 28})`}>
                        <motion.g 
                            id="character-head-group"
                            animate={headSway}
                            transition={headTransition}
                            style={{ originX: '26px', originY: '28px' }}
                        >
                            {/* HEAD CIRCLE */}
                            <circle cx="26" cy="28" r="11" fill="#000" />
                            <circle cx="26" cy="28" r="9.5" fill={skinColor} />

                            {/* NOSE (Cute rounded side nose) */}
                            <path d="M34.5 27.5 C 36.5 27.5 36.5 29.5 34.5 29.5" stroke="#000" strokeWidth="1.8" fill={skinColor} />

                            {/* DETAILED HAIR DESIGN (deterministic styles) */}
                            {hairStyle === 0 && (
                                // Short hair with beautiful side bangs looking sideways
                                <g>
                                    <path d="M16 26 C 16 16 34 16 34 22 C 34 23 30 25 28 22 C 26 21 21 21 19 25 Z" fill="#000" />
                                    <path d="M17 25 C 17 17 33 17 33 22 C 33 23 29 24 28 22 C 26 21 21 21 20 24 Z" fill={hairColor} />
                                </g>
                            )}
                            {hairStyle === 1 && (
                                // Cute ponytail hanging in the back
                                <g>
                                    {/* Back hair tail */}
                                    <path d="M16 28 Q 10 33 6 42 Q 9 44 14 36" fill="#000" stroke="#000" strokeWidth="1" />
                                    <path d="M16 28 Q 10 33 6 42" stroke={hairColor} strokeWidth="3" strokeLinecap="round" />
                                    {/* Main scalp hair */}
                                    <path d="M17 24 C 17 16 33 16 33 22 C 31 23 29 23 25 23 H 20 Z" fill={hairColor} />
                                    <circle cx="15.5" cy="28" r="2" fill="#ec4899" /> {/* cute hair-tie */}
                                </g>
                            )}
                            {hairStyle === 2 && (
                                // Cool side-cap / baseball cap backward or forward
                                <g>
                                    <circle cx="26" cy="23" r="10" fill="#000" />
                                    <ellipse cx="26" cy="23" rx="9" ry="8.5" fill={hairColor} />
                                    {/* Cap bill / visor pointing forward */}
                                    <path d="M26 14 Q 38 12 39 19 H 26 Z" fill="#f43f5e" stroke="#000" strokeWidth="1.5" />
                                </g>
                            )}
                            {hairStyle === 3 && (
                                // Curly / fluffy afro hair style
                                <g>
                                    <circle cx="21" cy="22" r="5" fill="#000" />
                                    <circle cx="26" cy="18" r="6" fill="#000" />
                                    <circle cx="31" cy="21" r="5" fill="#000" />
                                    <circle cx="21" cy="22" r="4" fill={hairColor} />
                                    <circle cx="26" cy="18" r="5" fill={hairColor} />
                                    <circle cx="31" cy="21" r="4" fill={hairColor} />
                                </g>
                            )}
                            {hairStyle === 4 && (
                                // Neat short bob cut outlining the face
                                <g>
                                    <path d="M15 28 C 15 16 35 16 35 27 V 32 H 31 V 27 C 31 22 19 22 19 28 Z" fill="#000" />
                                    <path d="M16 27 C 16 17 34 17 34 26 V 31 H 31 Q 31 23 19 24 Q 19 27 18 30 Z" fill={hairColor} />
                                </g>
                            )}

                            {/* EYE (Sideways representation) */}
                            {isSleeping ? (
                                // Closed happy arc for sleeping
                                <path d="M29 27 Q 31 29 32 27" stroke="#000" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                            ) : (
                                // Cute shiny black anime side-eye dots or line
                                <g>
                                    <circle cx="30.5" cy="27" r="1.8" fill="#000" />
                                    <circle cx="31.2" cy="26.3" r="0.6" fill="#fff" />
                                </g>
                            )}

                            {/* ROSY BLUSH CHEEK */}
                            <circle cx="28" cy="31" r="2" fill="#fda4af" opacity="0.85" />
                            
                            {/* CUTE MOUTH */}
                            {!isSleeping && (
                                <path d="M30 32.5 Q 31 34 32.5 32.5" stroke="#000" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                            )}
                        </motion.g>
                    </g>

                    {/* DYNAMIC HANDS & ACTIONS */}
                    {pose === 'sitting' && (
                        // Hands resting on lap
                        <g>
                            <path d="M22 45 Q 32 46 30 54" stroke="#000" strokeWidth="5" strokeLinecap="round" fill="none" />
                            <path d="M22 45 Q 32 46 30 54" stroke={shirtColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
                            <circle cx="30" cy="54" r="2.5" fill={skinColor} stroke="#000" strokeWidth="1.2" />
                        </g>
                    )}

                    {pose === 'lifting_bench' && (
                        // Lifted horizontal barbell bench pressing
                        <motion.g 
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <path d="M22 45 V 24" stroke="#000" strokeWidth="5" strokeLinecap="round" />
                            <path d="M22 45 V 24" stroke={shirtColor} strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M28 45 V 24" stroke="#000" strokeWidth="5" strokeLinecap="round" />
                            <path d="M28 45 V 24" stroke={shirtColor} strokeWidth="2.5" strokeLinecap="round" />
                            <circle cx="22" cy="24" r="2.5" fill={skinColor} stroke="#000" strokeWidth="1.2" />
                            <circle cx="28" cy="24" r="2.5" fill={skinColor} stroke="#000" strokeWidth="1.2" />
                        </motion.g>
                    )}

                    {pose === 'drinking' && (
                        // Lifted hand holding standard coffee cup
                        <g>
                            {/* Arm leading to mouth */}
                            <path d="M22 47 Q 35 44 32 34" stroke="#000" strokeWidth="5" strokeLinecap="round" fill="none" />
                            <path d="M22 47 Q 35 44 32 34" stroke={shirtColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
                            {/* Coffee Cup with handle (Side-view) */}
                            <rect x="30" y="30" width="8" height="7.5" rx="1" fill="#fff" stroke="#000" strokeWidth="1.2" />
                            <path d="M38 32 C 40 32 40 35 38 35" stroke="#000" strokeWidth="1.2" fill="none" />
                            {/* Tiny coffee color fill */}
                            <rect x="31" y="31.2" width="6" height="1.8" fill="#92400e" />
                        </g>
                    )}

                    {pose === 'sleeping' && (
                        // Tiny sleeping folded hands
                        <g>
                            <circle cx="28" cy="51" r="2.5" fill={skinColor} stroke="#000" strokeWidth="1.2" />
                        </g>
                    )}

                    {pose === 'sleeping_bed' && (
                        // Bed sleeping tiny folded hands
                        <g>
                            <circle cx="18" cy="46" r="2.5" fill={skinColor} stroke="#000" strokeWidth="1.2" />
                        </g>
                    )}

                    {pose === 'gaming' && (
                        // Extended arms holding arcade joysticks / controllers
                        <g>
                            {/* Arm */}
                            <path d="M23 48 H 36" stroke="#000" strokeWidth="5" strokeLinecap="round" />
                            <path d="M23 48 H 36" stroke={shirtColor} strokeWidth="2.5" strokeLinecap="round" />
                            {/* Little controller unit */}
                            <rect x="34" y="44" width="7" height="8" rx="1.5" fill="#f43f5e" stroke="#000" strokeWidth="1.2" />
                            {/* Joystick stick */}
                            <line x1="37" y1="44" x2="37" y2="40" stroke="#000" strokeWidth="1.5" />
                            <circle cx="37" cy="39" r="1.5" fill="#e11d48" />
                        </g>
                    )}

                    {pose === 'singing' && (
                        // Holding fine acoustic guitar side-view
                        <g>
                            {/* Arm wrapping */}
                            <path d="M20 48 Q 28 54 36 49" stroke="#000" strokeWidth="5.5" strokeLinecap="round" fill="none" />
                            <path d="M20 48 Q 28 54 36 49" stroke={shirtColor} strokeWidth="2.8" strokeLinecap="round" fill="none" />
                            {/* Guitar SVG overlay */}
                            {/* Guitar body */}
                            <ellipse cx="33" cy="53" rx="7" ry="5" fill="#b45309" stroke="#000" strokeWidth="1.2" />
                            <circle cx="33" cy="53" r="2" fill="#78350f" />
                            {/* Guitar neck */}
                            <path d="M33 53 L 49 43" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M33 53 L 49 43" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
                        </g>
                    )}

                    {pose === 'lifting' && (
                        // Lifted weight arm raising up with dumbbell
                        <g>
                            {/* Arm raised up */}
                            <path d="M22 45 Q 32 30 36 21" stroke="#000" strokeWidth="5" strokeLinecap="round" fill="none" />
                            <path d="M22 45 Q 32 30 36 21" stroke={shirtColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
                            {/* Dumbbell stick */}
                            <line x1="30" y1="21" x2="42" y2="21" stroke="#000" strokeWidth="2" />
                            {/* Dumbbel weight plates */}
                            <rect x="29" y="16" width="3" height="10" rx="1" fill="#475569" stroke="#000" strokeWidth="1.2" />
                            <rect x="40" y="16" width="3" height="10" rx="1" fill="#475569" stroke="#000" strokeWidth="1.2" />
                        </g>
                    )}

                    {pose === 'stretching' && (
                        // Extended arms reaching forward
                        <g>
                            <path d="M22 48 Q 36 50 42 54" stroke="#000" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                            <path d="M22 48 Q 36 50 42 54" stroke={shirtColor} strokeWidth="2.2" strokeLinecap="round" fill="none" />
                        </g>
                    )}

                    {pose === 'punching' && (
                        // Repeated forward punching animation with a boxing glove
                        <motion.g
                            animate={{ x: [0, 8, -1, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, ease: 'easeOut' }}
                        >
                            <path d="M22 45 H 37" stroke="#000" strokeWidth="5.5" strokeLinecap="round" />
                            <path d="M22 45 H 37" stroke={shirtColor} strokeWidth="2.8" strokeLinecap="round" />
                            <circle cx="38" cy="45" r="4.5" fill="#ef4444" stroke="#000" strokeWidth="1.2" />
                            <path d="M36 47.5 Q 34 49 33 47" stroke="#000" strokeWidth="1" fill="#ef4444" />
                        </motion.g>
                    )}

                    {pose === 'idle' && (
                        // Cute simple idle relaxed arms
                        <g>
                            <path d="M22 45 Q 26 55 24 57" stroke="#000" strokeWidth="5" strokeLinecap="round" fill="none" />
                            <path d="M22 45 Q 26 55 24 57" stroke={shirtColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
                        </g>
                    )}
                </g>
            </svg>
        </div>
    );
};
