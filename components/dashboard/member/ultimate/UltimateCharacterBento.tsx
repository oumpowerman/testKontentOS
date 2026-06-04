import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { User } from '../../../../types';

interface UltimateCharacterBentoProps {
    currentUser: User;
}

export const UltimateCharacterBento: React.FC<UltimateCharacterBentoProps> = ({ currentUser }) => {
    return (
        <div 
            id="ultimate-character-bento" 
            className="lg:col-span-5 bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-md"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img 
                            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'} 
                            alt="User avatar sketch" 
                            className="w-12 h-12 rounded-2xl border-2 border-indigo-500/40 bg-zinc-800 object-cover"
                        />
                        <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center bg-indigo-500 text-white font-black text-[9px] rounded-lg">
                            {currentUser.level}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-base font-black text-white">{currentUser.name}</h2>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">พลังชีวิตเวทมนตร์ & เคนซึเลเวล</p>
                    </div>
                </div>

                <span className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-[10px] rounded-full shadow-sm">
                    <Flame className="w-3.5 h-3.5 animate-bounce" />
                    <span>LEVEL {currentUser.level}</span>
                </span>
            </div>

            {/* STATS BARS */}
            <div className="space-y-4 my-6">
                {/* HP Bar */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-extrabold text-rose-400 flex items-center gap-1">
                            ❤️ HP พลังสายใจชีวิต (Health)
                        </span>
                        <span className="text-xs font-black text-white/90 font-mono">
                            {currentUser.hp || 100} / {currentUser.maxHp || 100}
                        </span>
                    </div>
                    <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.max(0, ((currentUser.hp || 100) / (currentUser.maxHp || 100)) * 100))}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="bg-gradient-to-r from-rose-500 to-pink-500 h-full rounded-full"
                        />
                    </div>
                </div>

                {/* XP Bar */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-extrabold text-indigo-400 flex items-center gap-1">
                            🟢 EXP พลังงานเรียนรู้ (Experience)
                        </span>
                        <span className="text-xs font-black text-white/90 font-mono">
                            {currentUser.xp || 0} / 100 XP
                        </span>
                    </div>
                    <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.max(0, (currentUser.xp || 0)))}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
                        />
                    </div>
                </div>
            </div>

            {/* BOTTOM STAT INFO */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/5">
                <div className="text-center bg-white/[0.02] py-2 rounded-xl border border-white/5">
                    <span className="block text-[9px] text-slate-400 font-bold">XPs สะสม</span>
                    <span className="text-xs font-black text-indigo-400">{currentUser.xp} XP</span>
                </div>
                <div className="text-center bg-white/[0.02] py-2 rounded-xl border border-white/5">
                    <span className="block text-[9px] text-slate-400 font-bold">คะแนนรวม</span>
                    <span className="text-xs font-black text-emerald-400">{currentUser.availablePoints || 0} Pts</span>
                </div>
                <div className="text-center bg-white/[0.02] py-2 rounded-xl border border-white/5">
                    <span className="block text-[9px] text-slate-400 font-bold">เดธเคานต์</span>
                    <span className="text-xs font-black text-rose-500 font-mono">{currentUser.deathCount || 0} ครั้ง</span>
                </div>
            </div>
        </div>
    );
};

export default UltimateCharacterBento;
