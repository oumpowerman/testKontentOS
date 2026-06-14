import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Shield, Swords, Sparkles, MessageCircle, Heart, Star, Activity, Award } from 'lucide-react';
import { LeaderboardEntry } from '../../hooks/useLeaderboard';
import UserAvatarWithHP from '../common/UserAvatarWithHP';

interface LeaderboardProfileCardModalProps {
    entry: LeaderboardEntry | null;
    onClose: () => void;
    onQuickCheer?: (emoji: string) => void;
}

const LeaderboardProfileCardModal: React.FC<LeaderboardProfileCardModalProps> = ({ entry, onClose, onQuickCheer }) => {
    if (!entry) return null;

    const [modalFlying, setModalFlying] = useState<{ id: number; emoji: string; x: number; y: number }[]>([]);

    const handleLocalReaction = (e: React.MouseEvent, emoji: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        // Calculate coordinate relative to click event
        const newEmoji = {
            id: Date.now() + Math.random(),
            emoji,
            x: e.clientX,
            y: e.clientY
        };

        setModalFlying(prev => [...prev, newEmoji]);

        if (onQuickCheer) {
            onQuickCheer(emoji);
        }

        setTimeout(() => {
            setModalFlying(prev => prev.filter(item => item.id !== newEmoji.id));
        }, 1200);
    };

    const { user, rank, score, missions, penalties, badges } = entry;

    // Get RPG Class/Title based on badges and stats
    const getRPGClass = () => {
        if (badges.includes('FIRE')) {
            return {
                title: 'Blazing speedrunner ⚡',
                description: 'จอมเวทย์อัคคีความเร็วแสง สนุกกับการคลี่คลายงานพริบตาเดียวยอดเยี่ยม!',
                color: 'text-orange-500 bg-orange-50 border-orange-200'
            };
        }
        if (badges.includes('SHIELD')) {
            return {
                title: 'Iron Discipline Paladin 🛡️',
                description: 'อัศวินเกราะเหล็กวิถีแห่งความสม่ำเสมอ แกร่งกล้าปราศจากข้อผิดพลาดใดๆ!',
                color: 'text-blue-600 bg-blue-50 border-blue-200'
            };
        }
        if (badges.includes('RISK')) {
            return {
                title: 'Danger Zone Raider 💀',
                description: 'ขุนศึกจอมบุ่มบ่าม ท้าทายกำหนดส่งเดดไลน์อย่างใจหายใจคว่ำ!',
                color: 'text-red-500 bg-red-50 border-red-200'
            };
        }
        if (badges.includes('SLEEPY')) {
            return {
                title: 'Dreamwalker Nomad 💤',
                description: 'ผู้สัญจรต่างมิติ พักสมองในห้วงนิทรา รอวันปลุกพลังขยันระเบิดออก!',
                color: 'text-indigo-500 bg-indigo-50 border-indigo-200'
            };
        }
        if (rank === 1) {
            return {
                title: 'Halls of Fame Monarch 👑',
                description: 'ราชันย์ผู้ไร้เทียมทาน ส่องประกายอยู่บนพิกัดสูงสุดของตารางตระการตา!',
                color: 'text-yellow-600 bg-yellow-50 border-yellow-250/60'
            };
        }
        return {
            title: 'Pathfinder Recruit 🧭',
            description: 'ผู้กล้านักสำรวจแห่งสายงาน กำลังสั่งสมชั่วโมงฝึกฝนเพื่อมุ่งสู่อันดับท็อปเซียน!',
            color: 'text-slate-600 bg-slate-50 border-slate-200'
        };
    };

    const rpgClass = getRPGClass();

    // Stats calculations
    const levelProgress = (user.xp % 1000) / 10; // Simple percentage to next 1000 XP block
    const hpColor = user.hp > 80 ? 'bg-emerald-500 animate-pulse' : user.hp > 40 ? 'bg-amber-400' : 'bg-red-500 animate-bounce';

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Micro-blur Backdrop overlay */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
                />

                {/* Premium Glassmorphic Card Container */}
                <motion.div
                    initial={{ scale: 0.9, y: 40, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 40, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 350 }}
                    className="relative w-full max-w-sm bg-white/90 backdrop-blur-2xl border border-white/80 rounded-[3rem] shadow-[0_35px_70px_rgba(30,41,59,0.25)] overflow-hidden z-10 p-6 flex flex-col"
                >
                    {/* Top Accent Light Beam */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pink-400 via-indigo-500 to-amber-400" />
                    
                    {/* Floating Glow Orbs inside card for background high fidelity */}
                    <div className="absolute top-12 left-1/4 w-32 h-32 bg-indigo-300/15 rounded-full blur-2xl -z-10" />
                    <div className="absolute bottom-20 right-1/4 w-32 h-32 bg-pink-300/15 rounded-full blur-2xl -z-10" />

                    {/* Header Controls */}
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 bg-slate-100/50 px-2.5 py-1 rounded-xl">
                            <Activity className="w-3 h-3 text-indigo-500" /> Stats Card
                        </span>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </motion.button>
                    </div>

                    {/* Profile Identity */}
                    <div className="flex flex-col items-center text-center">
                        <div className="relative group mb-4">
                            {/* Outer magical rotating auras */}
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-1.5 bg-gradient-to-r from-pink-500 via-indigo-500 to-amber-400 rounded-full blur-[2px] opacity-75 group-hover:opacity-100 transition-opacity"
                            />
                            <div className="relative bg-white p-1.5 rounded-full">
                                <UserAvatarWithHP 
                                    user={user} 
                                    size="2xl"
                                    showLevel={false} 
                                    showStatus={false}
                                    showAdminBadge={false}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
                                {user.name}
                                {rank <= 3 && (
                                    <Trophy className={`w-5 h-5 ${rank === 1 ? 'text-yellow-500 fill-yellow-300' : rank === 2 ? 'text-slate-400 fill-slate-200' : 'text-orange-500 fill-orange-200'}`} />
                                )}
                            </h3>
                            <p className="text-xs font-bold text-indigo-500 tracking-wide uppercase">{user.position || 'เจ้าหน้าที่ผู้ปฏิบัติงาน'}</p>
                            
                            {/* Feeling Speech Bubble */}
                            {user.feeling ? (
                                <div className="mt-3 bg-indigo-50/50 border border-indigo-150 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 italic tracking-wide max-w-[280px] leading-relaxed relative shadow-inner">
                                    <MessageCircle className="w-3 h-3 text-indigo-400 absolute left-2 -top-1.5 bg-white rounded-full p-0.5 border border-indigo-100" />
                                    "{user.feeling}"
                                </div>
                            ) : (
                                <div className="h-2" />
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-slate-100 my-5" />

                    {/* Character RPG Class & Attributes */}
                    <div className="space-y-4">
                        <div className={`p-4 rounded-3xl border ${rpgClass.color} flex flex-col gap-1 text-center shadow-inner`}>
                            <span className="text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 text-indigo-500 mb-0.5">
                                <Award className="w-3.5 h-3.5" /> Character RPG Class
                            </span>
                            <span className="text-sm font-black tracking-tight">{rpgClass.title}</span>
                            <p className="text-xs font-bold opacity-80 leading-relaxed mt-1">{rpgClass.description}</p>
                        </div>

                        {/* Attribute Levels */}
                        <div className="space-y-2.5">
                            {/* Level with smooth progress */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                    <span>Level {user.level || 1}</span>
                                    <span>{score.toLocaleString()} XP</span>
                                </div>
                                <div className="w-full h-3 bg-slate-150 rounded-full overflow-hidden p-[2px] border border-slate-200 shadow-inner">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(levelProgress, 8)}%` }}
                                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                                    />
                                </div>
                            </div>

                            {/* HP Level indicator */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                    <span>Energy (พลังงาน)</span>
                                    <span className="font-bold">{user.hp || 100}% HP</span>
                                </div>
                                <div className="w-full h-3 bg-slate-150 rounded-full overflow-hidden p-[2px] border border-slate-200 shadow-inner">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${user.hp || 100}%` }}
                                        className={`h-full ${hpColor} rounded-full`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Interactive Stat Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="bg-slate-50/70 p-3 rounded-2.5xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                                    <Swords className="w-3 h-3 text-green-500" /> Missions
                                </span>
                                <span className="text-lg font-black text-green-600">+{missions}</span>
                                <span className="text-[9px] font-bold text-slate-400 leading-none">สำเร็จในรอบนี้</span>
                            </div>
                            <div className="bg-slate-50/70 p-3 rounded-2.5xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                                    <Shield className="w-3 h-3 text-red-500" /> Penalties
                                </span>
                                <span className="text-lg font-black text-red-500">-{penalties}</span>
                                <span className="text-[9px] font-bold text-slate-400 leading-none">ค่าปรับ / แอบอู้</span>
                            </div>
                        </div>
                    </div>

                    {/* Portal overlays for local floating modal reactions */}
                    <div className="fixed inset-0 pointer-events-none z-[110] overflow-hidden">
                        <AnimatePresence>
                            {modalFlying.map(item => (
                                <motion.div
                                    key={item.id}
                                    initial={{ x: item.x, y: item.y, scale: 0.5, opacity: 1 }}
                                    animate={{ 
                                        y: item.y - 140, 
                                        x: item.x + (Math.random() * 80 - 40),
                                        scale: [0.8, 1.8, 1.3, 0], 
                                        opacity: [1, 1, 0.7, 0],
                                        rotate: [0, Math.random() * 50 - 25]
                                    }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                    className="absolute text-5xl select-none filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
                                >
                                    {item.emoji}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Interactive Cheer/Encouragement Section */}
                    {onQuickCheer && (
                        <div className="mt-6 pt-4 border-t border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest mb-3 flex items-center justify-center gap-1.5">
                                <Heart className="w-3 h-3 text-pink-400 fill-pink-300" /> ส่งกำลังใจให้เพื่อนร่วมงาน
                            </p>
                            <div className="flex justify-around items-center gap-2">
                                {['🔥', '👍', '👏', '🎉', '👑'].map((emoji) => (
                                    <motion.button
                                        key={emoji}
                                        whileHover={{ scale: 1.25, y: -4 }}
                                        whileTap={{ scale: 0.85 }}
                                        onClick={(e) => handleLocalReaction(e, emoji)}
                                        className="text-2xl p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-150 rounded-2xl shadow-sm transition-all text-center select-none cursor-pointer"
                                    >
                                        {emoji}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default LeaderboardProfileCardModal;
