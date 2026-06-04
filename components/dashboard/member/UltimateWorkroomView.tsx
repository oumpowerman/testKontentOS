import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Task, MasterOption, User } from '../../../types';
import MyWorkBoard from './MyWorkBoard';
import PixelHeroFollower, { FURNITURE_MAP, getIsometricPos } from './PixelHeroFollower';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import ItemShopModal from '../../gamification/ItemShopModal';

// Custom Hooks & Sub-components
import { useAudioSynth } from './ultimate/useAudioSynth';
import { useUltimatePresence } from './ultimate/useUltimatePresence';
import { useXpParticles } from './ultimate/useXpParticles';
import UltimateCharacterBento from './ultimate/UltimateCharacterBento';
import UltimateFocusShieldConsole from './ultimate/UltimateFocusShieldConsole';
import UltimateWorkroomHeader from './ultimate/UltimateWorkroomHeader';

interface UltimateWorkroomViewProps {
    tasks: Task[];
    masterOptions: MasterOption[];
    users: User[];
    currentUser: User;
    onEditTask: (task: Task) => void;
    onUpdateTask?: (task: Task) => void;
    onDeleteTask?: (taskId: string) => void;
    onNavigateBack: () => void;
    onRefreshProfile?: () => Promise<any>;
    isFetching?: boolean;
}

export const UltimateWorkroomView: React.FC<UltimateWorkroomViewProps> = ({
    tasks,
    masterOptions,
    users,
    currentUser,
    onEditTask,
    onUpdateTask,
    onDeleteTask,
    onNavigateBack,
    onRefreshProfile,
    isFetching = false
}) => {
    const { showToast } = useToast();

    // --- State: Dynamic Window sizing to align isometric click overlays ---
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1200,
        height: typeof window !== 'undefined' ? window.innerHeight : 800
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- State: Active Drawer view ---
    const [activeDrawer, setActiveDrawer] = useState<'DESK' | 'SOFA' | 'BOOKSHELF' | null>(null);
    const [isDeskMaximized, setIsDeskMaximized] = useState<boolean>(false);

    // --- State: Viewport Zoom and Pan (Synchronized from PixelHeroFollower) ---
    const [viewport, setViewport] = useState({ zoom: 1.0, pan: { x: 0, y: 0 } });
    const [searchParams, setSearchParams] = useSearchParams();
    const [isShopOpen, setIsShopOpen] = useState(false);

    // --- Audio Synth Engine Hook ---
    const {
        isAudioSynthPlaying,
        synthType,
        setSynthType,
        toggleSynth,
        ringSuccessChime
    } = useAudioSynth();

    // --- Local DB Preference State ---
    const [isDefaultFirstUrl, setIsDefaultFirstUrl] = useState(() => {
        return currentUser.ultimateWorkroomEnabled !== false;
    });

    const handleWarpBack = () => {
        onNavigateBack();
    };

    // --- State: Focus Pomodoro ---
    const [selectedFocusTaskId, setSelectedFocusTaskId] = useState<string>('');
    const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerType, setTimerType] = useState<'WORK' | 'BREAK'>('WORK');

    // --- Particle Explosions Custom Hook ---
    const { particles, triggerExperienceExplosion } = useXpParticles();

    // List of tasks in "DOING" to let the user select for focus mode
    const doingTasks = useMemo(() => {
        return tasks.filter(t => {
            const s = t.status ? t.status.toUpperCase() : '';
            return !t.isUnscheduled && t.type !== 'CONTENT' && s.includes('DOING');
        });
    }, [tasks]);

    // Track active task being focused for real-time presence broadcasting
    const activeFocusTaskName = useMemo(() => {
        return doingTasks.find(t => t.id === selectedFocusTaskId)?.title || '';
    }, [doingTasks, selectedFocusTaskId]);

    // Handle incoming reactions (hearts / spells) dynamically with beautiful coordinates overlay matching
    const handleReactionReceived = (payload: any) => {
        let cx = window.innerWidth / 2;
        let cy = window.innerHeight / 2 - 100;

        const playerHtmlId = `player-tag-${payload.toId}`;
        const elem = document.getElementById(playerHtmlId);
        if (elem) {
            const rect = elem.getBoundingClientRect();
            cx = rect.left + rect.width / 2;
            cy = rect.top;
        }
        
        triggerExperienceExplosion(cx, cy, payload.type);
    };

    // --- Real-time Presence Custom Hook with focus mapping and dynamic reactions ---
    const { otherPlayers, reportPosition, sendReaction } = useUltimatePresence(
        currentUser,
        activeFocusTaskName,
        handleReactionReceived
    );

    // Update local state when currentUser prop changes
    useEffect(() => {
        setIsDefaultFirstUrl(currentUser.ultimateWorkroomEnabled !== false);
    }, [currentUser]);

    // Handle Default Landing Toggle (Persistent)
    const handleToggleDefaultLanding = async () => {
        const nextVal = !isDefaultFirstUrl;
        setIsDefaultFirstUrl(nextVal);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ ultimate_workroom_enabled: nextVal })
                .eq('id', currentUser.id);

            if (error) throw error;
            showToast(nextVal ? 'ตั้งค่าเป็นหน้าแรกหลังจากเข้าระบบแล้ว ⚡' : 'ยกเลิกการเปิดหน้านี้เป็นหน้าแรกแล้ว', 'success');
            if (onRefreshProfile) onRefreshProfile();
        } catch (err) {
            console.error('Failed to save room setting:', err);
            // Fallback
            localStorage.setItem(`ultimate_room_enabled_${currentUser.id}`, String(nextVal));
            showToast('บันทึกการตั้งค่าลงเครื่องเรียบร้อย', 'success');
        }
    };

    // Timer Interval Engine
    useEffect(() => {
        let timerId: any = null;
        if (isTimerRunning && pomodoroSeconds > 0) {
            timerId = setInterval(() => {
                setPomodoroSeconds(s => s - 1);
            }, 1000);
        } else if (pomodoroSeconds === 0) {
            setIsTimerRunning(false);
            // Sound cute synth alert when pomodoro rings
            ringSuccessChime();
            
            if (timerType === 'WORK') {
                showToast('👑 ยอดเยี่ยมมาก! เคลียร์สมาธิครบกำหนดแล้ว ได้รับโบนัส XPs!', 'success');
                triggerExperienceExplosion();
                setTimerType('BREAK');
                setPomodoroSeconds(5 * 60); // 5 mins break
            } else {
                showToast('🎒 จบชั่วโมงพักแล้ว พร้อมลุยงานต่อกันเลย!', 'success');
                setTimerType('WORK');
                setPomodoroSeconds(25 * 60); // 25 mins work
            }
        }
        return () => {
            if (timerId) clearInterval(timerId);
        };
    }, [isTimerRunning, pomodoroSeconds, timerType, ringSuccessChime, triggerExperienceExplosion, showToast]);

    const resetTimer = () => {
        setIsTimerRunning(false);
        setPomodoroSeconds(timerType === 'WORK' ? 25 * 60 : 5 * 60);
    };

    const handleFurnitureClick = (type: string) => {
        ringSuccessChime();

        if (type === 'DESK' || type === 'SOFA' || type === 'BOOKSHELF') {
            setActiveDrawer(type as any);
            showToast(`🧙‍♂️ เปิดวิสัยทัศน์ ${type === 'DESK' ? 'โต๊ะทำงานเวทมนตร์' : type === 'SOFA' ? 'คอนโซลดนตรีโซฟาพักผ่อน' : 'สมุดประเมินเลเวลชั้นหนังสือ'} เรียบร้อยแล้ว`, 'info');
        } else if (type === 'VAULT_BOX') {
            setIsShopOpen(true);
            showToast('🪙 เปิดใช้งานหีบมหาสมบัติ แลกซื้อของขวัญร้านค้าแล้ว!', 'success');
        } else {
            // Check warping portal
            const warpRoutes: Record<string, string> = {
                QUEST_BOARD: 'WEEKLY',
                DUTY_SIGN: 'DUTY',
                GOAL_BEACON: 'GOALS',
                LEADERBOARD_ALTAR: 'LEADERBOARD',
                CHAT_BALL: 'CHAT',
                WIKI_PORTAL: 'WIKI'
            };

            const targetView = warpRoutes[type];
            if (targetView) {
                const labelName = FURNITURE_MAP[type as keyof typeof FURNITURE_MAP]?.label || type;
                showToast(`🔮 ร่ายมนตร์แปรผันมิติ กำลังย้ายร่างไปหลัก: ${labelName}...`, 'info');
                setTimeout(() => {
                    setSearchParams(prev => {
                        const next = new URLSearchParams(prev);
                        next.set('view', targetView);
                        return next;
                    });
                }, 750);
            }
        }
    };

    return (
        <div id="ultimate-workroom-root" className="min-h-screen bg-[#0e101a] text-slate-100 font-sans p-4 md:p-8 relative overflow-hidden flex flex-col justify-between">
            {/* 8-bit cursor follower and live network friends component in background with full panning and zooming support */}
            <PixelHeroFollower 
                currentUser={currentUser}
                activeFocusTaskName={activeFocusTaskName}
                otherPlayers={otherPlayers}
                onPositionChange={reportPosition}
                onFurnitureClick={handleFurnitureClick}
                onViewportChange={(zoom, pan) => setViewport({ zoom, pan })}
                onSendReaction={sendReaction}
            />

            {/* EXP Star floaters layer */}
            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                <AnimatePresence>
                    {particles.map(p => (
                        <motion.div
                            key={p.id}
                            initial={{ x: p.x, y: p.y, scale: p.scale, opacity: 1, rotate: 0 }}
                            animate={{ 
                                x: p.x + (Math.random() * 500 - 250), 
                                y: p.y - (Math.random() * 400 + 100), 
                                scale: 0,
                                opacity: 0,
                                rotate: Math.random() * 360
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.6, ease: "easeOut" }}
                            className="absolute flex items-center justify-center"
                        >
                            <span 
                                className="text-xl filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.85)] select-none font-sans"
                                style={{ color: p.color }}
                            >
                                {p.symbol || '✦'}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Glowing top gradients */}
            <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-indigo-950/20 via-purple-950/10 to-transparent pointer-events-none z-0" />
            <div className="absolute -top-40 left-1/3 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
            <div className="absolute -top-40 right-1/4 w-[450px] h-[450px] bg-rose-500/10 rounded-full blur-[140px] pointer-events-none z-0" />

            {/* MAIN WORK ROOM HEADER */}
            <UltimateWorkroomHeader
                currentUser={currentUser}
                isDefaultFirstUrl={isDefaultFirstUrl}
                activeDrawer={activeDrawer}
                onToggleDefaultLanding={handleToggleDefaultLanding}
                onCloseAllDrawers={() => setActiveDrawer(null)}
                onNavigateBack={handleWarpBack}
            />

            {/* Interactive Overlays on top of the Pixel furniture on canvas */}
            <div className="fixed inset-0 pointer-events-none z-10 select-none">
                {/* Glow indicators and clickable areas */}
                {Object.entries(FURNITURE_MAP).map(([key, f]) => {
                    const isInteractable = [
                        'BOOKSHELF',
                        'DESK',
                        'SOFA',
                        'QUEST_BOARD',
                        'DUTY_SIGN',
                        'GOAL_BEACON',
                        'LEADERBOARD_ALTAR',
                        'VAULT_BOX',
                        'CHAT_BALL',
                        'WIKI_PORTAL'
                    ].includes(key);
                    if (!isInteractable) return null;

                    const pos = getIsometricPos(f.fx, f.fy, windowSize.width, windowSize.height, viewport.pan.x, viewport.pan.y, viewport.zoom);
                    
                    const getOffset = (k: string) => {
                        switch (k) {
                            case 'BOOKSHELF': return 42;
                            case 'WIKI_PORTAL': return 52;
                            case 'DUTY_SIGN': return 36;
                            case 'DESK': return 16;
                            case 'SOFA': return 10;
                            default: return 20;
                        }
                    };

                    const labelShort = f.label.replace(/\(.*?\)/g, '').trim();

                    return (
                        <div
                            key={key}
                            className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer flex flex-col items-center justify-center p-3 bg-transparent"
                            style={{
                                left: `${pos.x}px`,
                                top: `${pos.y - getOffset(key) * viewport.zoom}px`,
                                transform: `translate(-50%, -50%) scale(${Math.max(0.65, Math.min(1.35, viewport.zoom))})`,
                            }}
                            onClick={() => handleFurnitureClick(key)}
                            title={`คลิกเปิดใช้งาน: ${f.label}`}
                        >
                            {/* Pulsating magic ring of light */}
                            <div className="w-5 h-5 rounded-full border border-pink-500/50 bg-pink-500/10 flex items-center justify-center animate-bounce shadow-[0_0_12px_rgba(236,72,153,0.3)] mb-1.5 group-hover:scale-125 transition-all duration-300">
                                <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
                            </div>

                            {/* Sparkling cursor help ring */}
                            <div className="absolute inset-x-[-12px] inset-y-[-6px] rounded-2xl border border-dashed border-pink-500/0 group-hover:border-pink-500/35 group-hover:bg-pink-500/5 transition-all duration-300 scale-95 group-hover:scale-105" />

                            {/* Floating pill badge always visible and glowing on hover */}
                            <span className="px-2 py-0.5 bg-[#111221]/92 border border-slate-700 group-hover:border-pink-500/60 text-white rounded-lg text-[9px] font-extrabold shadow-md transition-all duration-300 whitespace-nowrap flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {labelShort}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* TRANQUIL SOFT DIM BACKDROP OVERLAY */}
            <AnimatePresence>
                {activeDrawer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActiveDrawer(null)}
                        className="fixed inset-0 bg-[#060813] z-30 cursor-pointer pointer-events-auto backdrop-blur-xs"
                    />
                )}
            </AnimatePresence>

            {/* LEFT SIDEBAR: BOOKSHELF (Bento Stats) */}
            <AnimatePresence>
                {activeDrawer === 'BOOKSHELF' && (
                    <motion.div
                        initial={{ x: '-100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '-100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 120 }}
                        className="fixed top-0 left-0 h-full w-full max-w-md bg-[#0b0c15]/98 border-r border-white/10 shadow-2xl backdrop-blur-xl z-40 p-6 flex flex-col justify-between overflow-y-auto pointer-events-auto"
                    >
                        <div className="flex-1">
                            <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/5">
                                <h3 className="text-sm font-black text-white flex items-center gap-2 tracking-tight uppercase">
                                    <span>📚</span> สมุดประเมินวิญญาณ Bento Stats
                                </h3>
                                <button 
                                    onClick={() => setActiveDrawer(null)}
                                    className="p-1 px-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-white/5"
                                >
                                    ปิดแผง ✕
                                </button>
                            </div>

                            <UltimateCharacterBento currentUser={currentUser} />
                        </div>
                        
                        <div className="pt-4 border-t border-white/5 text-center">
                            <p className="text-[9px] text-slate-500 font-extrabold tracking-widest uppercase">
                                🔮 SPIRITUAL CHARACTER REGISTERED
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* RIGHT SIDEBAR: SOFA (Focus Shield Console & Sounds) */}
            <AnimatePresence>
                {activeDrawer === 'SOFA' && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 120 }}
                        className="fixed top-0 right-0 h-full w-full max-w-2xl bg-[#0b0c15]/98 border-l border-white/10 shadow-2xl backdrop-blur-xl z-40 p-6 flex flex-col justify-between overflow-y-auto pointer-events-auto"
                    >
                        <div className="flex-1">
                            <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/5">
                                <h3 className="text-sm font-black text-white flex items-center gap-2 tracking-tight uppercase">
                                    <span>🛋️</span> แผงดนตรีสมาธิ Focus Shield
                                </h3>
                                <button 
                                    onClick={() => setActiveDrawer(null)}
                                    className="p-1 px-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-white/5"
                                >
                                    ปิดแผง ✕
                                </button>
                            </div>

                            <UltimateFocusShieldConsole
                                doingTasks={doingTasks}
                                selectedFocusTaskId={selectedFocusTaskId}
                                onSelectedFocusTaskIdChange={setSelectedFocusTaskId}
                                pomodoroSeconds={pomodoroSeconds}
                                timerType={timerType}
                                isTimerRunning={isTimerRunning}
                                toggleTimer={() => setIsTimerRunning(prev => !prev)}
                                resetTimer={resetTimer}
                                isAudioSynthPlaying={isAudioSynthPlaying}
                                synthType={synthType}
                                onSynthTypeChange={setSynthType}
                                toggleSynth={toggleSynth}
                            />
                        </div>

                        <div className="pt-4 border-t border-white/5 text-center">
                            <p className="text-[9px] text-slate-500 font-extrabold tracking-widest uppercase">
                                🎧 CHILL SOFA COGNITIVE MODULATOR
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BOTTOM DRAWER: DESK (My Work Board) */}
            <AnimatePresence>
                {activeDrawer === 'DESK' && (
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 140 }}
                        className={`fixed bottom-0 left-0 right-0 ${
                            isDeskMaximized 
                                ? 'h-screen rounded-t-none border-t-0' 
                                : 'h-[82vh] rounded-t-[2.5rem] border-t border-white/15'
                        } bg-[#07080f]/99 shadow-2xl backdrop-blur-2xl z-40 p-4 md:p-6 flex flex-col justify-between overflow-hidden pointer-events-auto transition-[height,border-radius,border-color] duration-300 ease-out`}
                    >
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5 flex-shrink-0">
                                <div>
                                    <h3 className="text-base font-black text-white flex items-center gap-2 tracking-tight uppercase">
                                        <span>💻</span> กระดานจัดสรรงานเวทมนตร์ (My Work Board)
                                    </h3>
                                    <p className="text-[10px] text-slate-400 mt-0.5">ลากและสลับย้ายรหัสงานของคุณที่นี่ คืนสมาธิแห่งออฟฟิศ</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setIsDeskMaximized(!isDeskMaximized)}
                                        className="p-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-indigo-500/20 flex items-center gap-1.5"
                                    >
                                        {isDeskMaximized ? (
                                            <>
                                                <span>🗗</span> ย่อหน้าต่างลง
                                            </>
                                        ) : (
                                            <>
                                                <span>🗖</span> ขยายเต็มจอ
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setActiveDrawer(null);
                                            setIsDeskMaximized(false);
                                        }}
                                        className="p-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/5"
                                    >
                                        พับกระดานเก็บลงโต๊ะไม้ ✕
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 min-h-0 flex flex-col">
                                <MyWorkBoard 
                                    tasks={tasks}
                                    masterOptions={masterOptions}
                                    users={users}
                                    currentUser={currentUser}
                                    onOpenTask={onEditTask}
                                    onUpdateTask={onUpdateTask}
                                    onDeleteTask={onDeleteTask}
                                    isUltimate={true}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Center screen hint displayed when interface is completely serene with no drawer open */}
            <AnimatePresence>
                {!activeDrawer && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center select-none"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-500/20 rounded-full backdrop-blur-md text-xs font-extrabold text-indigo-300">
                            ✨ แตะคลิกเครื่องเรือนเพื่อเข้าสู่โหมดต่างๆ ม้าพิกเซลเดินเที่ยวได้ด้วยเมาส์ 🐎
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ITEM SHOP MODAL (Opened from VAULT_BOX) */}
            <ItemShopModal 
                isOpen={isShopOpen} 
                onClose={() => setIsShopOpen(false)} 
                currentUser={currentUser}
                onRefreshProfile={onRefreshProfile}
            />
        </div>
    );
};

export default UltimateWorkroomView;
