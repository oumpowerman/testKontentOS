
import React, { useState } from 'react';
import { User } from '../types';
import { useLeaderboard, TimeRange, LeaderboardEntry } from '../hooks/useLeaderboard';
import { Trophy, Sparkles, Crown } from 'lucide-react';
import MentorTip from './MentorTip';
import { motion } from 'framer-motion';

// Import refactored sub-components
import PodiumSection from './leaderboard/PodiumSection';
import RankingList from './leaderboard/RankingList';
import UserStatsFooter from './leaderboard/UserStatsFooter';
import PastelStageBackground from './leaderboard/PastelStageBackground';
import LeaderboardProfileCardModal from './leaderboard/LeaderboardProfileCardModal';

interface LeaderboardViewProps {
    users: User[];
    currentUser: User;
}

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ users, currentUser }) => {
    const { topThree, restList, myStats, timeRange, setTimeRange } = useLeaderboard(users, currentUser);
    const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);

    return (
        <PastelStageBackground>
            <div className="space-y-8 animate-in fade-in duration-500 pb-32 relative">
                 <MentorTip variant="orange" messages={[
                "🔥 สัปดาห์นี้ใครจะเป็น MVP? ดูคะแนนได้ที่นี่เลย!",
                "XP ได้จากการทำงานเสร็จตรงเวลา และการช่วยเพื่อนๆ",
                "อย่าลืมนะ! ส่งงานช้า หรือโดดเวร คะแนนลดนะจ๊ะ 📉"
            ]} />

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                <div className="flex items-center gap-4">
                    <motion.div 
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.8 }}
                        className="p-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl shadow-xl shadow-orange-200/50 text-white relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <Trophy className="w-10 h-10 drop-shadow-md" />
                    </motion.div>
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            Hall of Fame
                            <motion.div
                                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Crown className="w-8 h-8 text-yellow-500 fill-yellow-300" />
                            </motion.div>
                        </h1>
                        <p className="text-slate-500 font-bold text-base mt-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            ลานประลองของคนขยัน (Leaderboard)
                        </p>
                    </div>
                </div>

                {/* Glassy Time Switcher */}
                <div className="bg-white/60 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-white/60 flex relative">
                    {['WEEKLY', 'MONTHLY', 'ALL_TIME'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeRange(t as TimeRange)}
                            className={`
                                px-5 py-2.5 rounded-xl text-xs font-black transition-all relative z-10
                                ${timeRange === t 
                                    ? 'text-white shadow-lg shadow-indigo-200 scale-105' 
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}
                            `}
                        >
                            {timeRange === t && (
                                <motion.div 
                                    layoutId="leaderboardActiveTab"
                                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl -z-10"
                                />
                            )}
                            {t === 'WEEKLY' ? 'สัปดาห์นี้' : t === 'MONTHLY' ? 'เดือนนี้' : 'ตลอดกาล'}
                        </button>
                    ))}
                </div>
            </div>

            {/* 1. TOP 3 PODIUM */}
            <PodiumSection topThree={topThree} onSelectUser={setSelectedUser} />

            {/* 2. RANKING LIST */}
            <RankingList 
                list={restList} 
                emptyMessage={topThree.length === 0 ? "ยังไม่มีข้อมูลในรอบนี้" : undefined}
                onSelectUser={(entry) => setSelectedUser(entry)}
            />

            {/* 3. STICKY FOOTER (MY STATS) */}
            <UserStatsFooter myStats={myStats} />

            {/* RPG Character Profile Card Modal */}
            <LeaderboardProfileCardModal 
                entry={selectedUser} 
                onClose={() => setSelectedUser(null)} 
                onQuickCheer={() => {}} // Local animations and state handles clicks automatically in premium detail
            />
        </div>
        </PastelStageBackground>
    );
};

export default LeaderboardView;
