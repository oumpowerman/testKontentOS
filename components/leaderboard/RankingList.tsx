import React, { useState, useMemo } from 'react';
import { CheckCircle2, AlertTriangle, TrendingDown, TrendingUp, MessageCircle, Flame, Shield, Skull, Moon, Heart, Smile } from 'lucide-react';
import { LeaderboardEntry, BadgeType } from '../../hooks/useLeaderboard';
import UserAvatarWithHP from '../common/UserAvatarWithHP';
import { motion, AnimatePresence } from 'framer-motion';

interface RankingListProps {
    list: LeaderboardEntry[];
    emptyMessage?: string;
    onSelectUser?: (entry: LeaderboardEntry) => void;
}

const RankingList: React.FC<RankingListProps> = ({ list, emptyMessage = "ยังไม่มีข้อมูลในรอบนี้", onSelectUser }) => {
    // Local flying emojis state (Quick Cheer Reaction)
    const [flyingEmojis, setFlyingEmojis] = useState<{ id: number; emoji: string; x: number; y: number }[]>([]);
    
    // Cheer counts, seeded deterministically based on user ID to make the app feel alive and populated
    const [cheerCounts, setCheerCounts] = useState<Record<string, Record<string, number>>>(() => {
        const initial: Record<string, Record<string, number>> = {};
        list.forEach(entry => {
            const seed = entry.user.id.split('').reduce((sum, cur) => sum + cur.charCodeAt(0), 0);
            initial[entry.user.id] = {
                '🔥': (seed % 4) + 1,
                '👍': ((seed + 2) % 5) + 2,
                '👏': ((seed + 5) % 4) + 1,
            };
        });
        return initial;
    });

    const getBadgeIcon = (type: BadgeType) => {
        switch (type) {
            case 'FIRE': return <Flame className="w-3 h-3 text-orange-500 fill-orange-500 animate-pulse" />;
            case 'SHIELD': return <Shield className="w-3 h-3 text-blue-500 fill-blue-200" />;
            case 'RISK': return <Skull className="w-3 h-3 text-red-400" />;
            case 'SLEEPY': return <Moon className="w-3 h-3 text-indigo-300" />;
            default: return null;
        }
    };

    // 1️⃣ Determine dynamic Rank Trend dynamically based on performance
    const getTrendIndicator = (entry: LeaderboardEntry) => {
        const isUp = entry.missions > 0 && entry.penalties === 0;
        const isDown = entry.penalties > 0;

        if (isUp) {
            return (
                <div className="flex flex-col items-center justify-center text-emerald-500" title="กำลังพุ่งขึ้น!">
                    <motion.div
                        animate={{ y: [1, -2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500 stroke-[3px]" />
                    </motion.div>
                </div>
            );
        } else if (isDown) {
            return (
                <div className="flex flex-col items-center justify-center text-rose-500" title="แนวโน้มลดลง">
                    <motion.div
                        animate={{ y: [-1, 2, -1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <TrendingDown className="w-3.5 h-3.5 text-rose-500 stroke-[3px]" />
                    </motion.div>
                </div>
            );
        } else {
            return (
                <div className="flex flex-col items-center justify-center text-slate-300" title="แนวโน้มคงที่">
                    <span className="text-xs font-black select-none">─</span>
                </div>
            );
        }
    };

    // Trigger local floating animation and increment count (Quick Cheer Reaction)
    const handleCheer = (e: React.MouseEvent, userId: string, emoji: string) => {
        e.stopPropagation(); // Avoid triggering open modal
        
        // Client coordinates for exact particle launch origin
        const clientX = e.clientX;
        const clientY = e.clientY;

        const newEmoji = {
            id: Date.now() + Math.random(),
            emoji,
            x: clientX,
            y: clientY
        };

        setFlyingEmojis(prev => [...prev, newEmoji]);

        setCheerCounts(prev => {
            const userCheers = prev[userId] || { '🔥': 0, '👍': 0, '👏': 0 };
            return {
                ...prev,
                [userId]: {
                    ...userCheers,
                    [emoji]: (userCheers[emoji] || 0) + 1
                }
            };
        });

        // Cleanup after flight completes
        setTimeout(() => {
            setFlyingEmojis(prev => prev.filter(item => item.id !== newEmoji.id));
        }, 1200);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-250/20 border border-white/60 overflow-visible relative z-10 max-w-4xl mx-auto mb-32"
        >
            
            {/* Flying Emojis Overlay Portals Container */}
            <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
                <AnimatePresence>
                    {flyingEmojis.map(item => (
                        <motion.div
                            key={item.id}
                            initial={{ x: item.x, y: item.y, scale: 0.5, opacity: 1 }}
                            animate={{ 
                                y: item.y - 120, // Float straight up
                                x: item.x + (Math.random() * 60 - 30), // Drift horizontally
                                scale: [0.8, 1.6, 1.2, 0], 
                                opacity: [1, 1, 0.8, 0],
                                rotate: [0, Math.random() * 40 - 20]
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="absolute text-3xl select-none"
                        >
                            {item.emoji}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 px-6 py-5 bg-slate-50/50 border-b border-slate-150 text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-wider backdrop-blur-sm sticky top-0 z-20 rounded-t-[2.5rem]">
                <div className="col-span-3 sm:col-span-2 text-center flex items-center justify-center gap-1">อันดับ & แนวโน้ม</div>
                <div className="col-span-5 sm:col-span-5 pl-2 flex items-center">เจ้าหน้าที่ & สถานะ</div>
                <div className="col-span-2 sm:col-span-3 text-right flex items-center justify-end">คะแนน</div>
                <div className="col-span-2 text-center flex items-center justify-center">ผลงาน</div>
            </div>

            <div className="divide-y divide-slate-100/60 pb-1">
                {list.length === 0 && (
                    <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                        <TrendingDown className="w-12 h-12 mb-2 opacity-20" />
                        <p>{emptyMessage}</p>
                    </div>
                )}

                {list.map((entry, index) => {
                    const userId = entry.user.id;
                    const userCheers = cheerCounts[userId] || { '🔥': 0, '👍': 0, '👏': 0 };

                    return (
                        <motion.div 
                            key={userId} 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + (index * 0.05) }}
                            onClick={() => onSelectUser && onSelectUser(entry)}
                            className="grid grid-cols-12 px-3 md:px-6 py-4/5 items-center hover:bg-white/80 transition-all duration-200 group relative cursor-pointer select-none"
                        >
                            {/* Rank and 1️⃣ Rank Trend Indicator */}
                            <div className="col-span-3 sm:col-span-2 flex items-center justify-center gap-2.5">
                                <span className="text-xl font-black text-slate-300 group-hover:text-indigo-500 transition-colors group-hover:scale-110 inline-block">
                                    {entry.rank}
                                </span>
                                <div className="p-1 bg-slate-50/70 border border-slate-100 rounded-lg shadow-inner flex items-center justify-center w-7 h-7">
                                    {getTrendIndicator(entry)}
                                </div>
                            </div>

                            {/* Agent Profile & Feeling Bubble */}
                            <div className="col-span-5 sm:col-span-5 flex items-center gap-2.5 sm:gap-4 pl-2">
                                <div className="group-hover:scale-105 transition-transform duration-300">
                                    <UserAvatarWithHP 
                                        user={entry.user} 
                                        size="md"
                                        showLevel={true}
                                        showStatus={true}
                                        showAdminBadge={true}
                                    />
                                </div>
                                
                                <div className="min-w-0 flex flex-col justify-center">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-slate-700 truncate text-xs sm:text-base group-hover:text-indigo-700 transition-colors">
                                            {entry.user.name}
                                        </p>
                                        
                                        {/* BADGES ROW */}
                                        <div className="flex gap-1">
                                            {entry.badges.map(badge => (
                                                <div key={badge} className="p-0.5 bg-white/75 rounded border border-slate-200" title={badge}>
                                                    {getBadgeIcon(badge)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Feeling in List */}
                                    {entry.user.feeling ? (
                                        <div className="flex items-center gap-1 mt-1">
                                            <MessageCircle className="w-3 h-3 text-indigo-400 shrink-0" />
                                            <p className="text-[10px] text-slate-500 italic truncate max-w-[100px] md:max-w-xs bg-indigo-50/30 px-2 py-0.5 rounded-lg border border-indigo-100/50">
                                                "{entry.user.feeling}"
                                            </p>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-slate-400 mt-0.5">{entry.user.position || 'เจ้าหน้าที่'}</span>
                                    )}

                                    {/* 4️⃣ Quick Cheer Reaction buttons (Shown inline or overlaying) */}
                                    <div className="flex items-center gap-1.5 mt-2 transition-all">
                                        {Object.entries(userCheers).map(([emoji, count]) => (
                                            <motion.button
                                                key={emoji}
                                                whileHover={{ scale: 1.2, y: -2 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => handleCheer(e, userId, emoji)}
                                                className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-full text-xs font-bold text-slate-500 shadow-sm transition-all cursor-pointer"
                                            >
                                                <span>{emoji}</span>
                                                <span className="text-[10px] tracking-tighter text-slate-400">{count}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Score */}
                            <div className="col-span-2 sm:col-span-3 text-right pr-2">
                                <div className="font-black text-indigo-600 text-sm sm:text-lg group-hover:text-indigo-700 transition-colors">
                                    {entry.score.toLocaleString()}
                                </div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">แต้ม XP</div>
                            </div>

                            {/* Stats */}
                            <div className="col-span-2 flex justify-center gap-1.5 md:gap-4 select-none">
                                <div className="flex flex-col items-center group/stat" title="ภารกิจที่สำเร็จ">
                                    <span className="text-[10px] sm:text-xs font-bold text-green-600 bg-green-50/50 px-1.5 py-0.5 rounded-md mb-0.5 group-hover/stat:bg-green-100 transition-colors border border-green-100/50">
                                        +{entry.missions}
                                    </span>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                </div>
                                <div className="flex flex-col items-center group/stat" title="ส่งช้า/ขาด">
                                    <span className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md mb-0.5 transition-colors border ${entry.penalties > 0 ? 'text-red-500 bg-red-50/50 group-hover/stat:bg-red-100 border-red-100/50' : 'text-gray-300 bg-gray-50/50 border-gray-100/50'}`}>
                                        -{entry.penalties}
                                    </span>
                                    <AlertTriangle className={`w-3.5 h-3.5 ${entry.penalties > 0 ? 'text-red-400' : 'text-gray-300'}`} />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default RankingList;
