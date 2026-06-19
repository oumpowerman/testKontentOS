
import React from 'react';
import { Goal, Channel, User } from '../../types';
import { PLATFORM_ICONS } from '../../constants';
import { differenceInDays, format } from 'date-fns';
import { MoreHorizontal, Plus, RefreshCw, Trophy, AlertCircle, Coins, Star, Flame, Zap, Heart, Calendar } from 'lucide-react';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { motion, AnimatePresence } from 'framer-motion';

interface GoalCardProps {
    goal: Goal;
    channel?: Channel;
    users: User[];
    currentUser: User;
    onUpdate: (goal: Goal) => void;
    onToggleOwner: (goalId: string, userId: string, isOwner: boolean) => void;
    onToggleBoost: (goalId: string, isBoosted: boolean) => void;
    onDelete: (id: string) => void;
    onEdit: (goal: Goal) => void;
    onRedeem: (id: string) => void;
    onRequestExtension: (id: string, reason: string) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ 
    goal, channel, users, currentUser, onUpdate, onToggleOwner, onToggleBoost, onDelete, onEdit, onRedeem, onRequestExtension
}) => {
    const { showConfirm } = useGlobalDialog();
    
    // Calculations
    const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
    const isCompleted = percent >= 100;
    const isNearCompletion = percent >= 70 && percent < 100;
    const PlatformIcon = PLATFORM_ICONS[goal.platform] || PLATFORM_ICONS['OTHER'];
    
    // Date Logic
    const daysLeft = differenceInDays(new Date(goal.deadline), new Date());
    const isOverdue = daysLeft < 0 && !isCompleted;
    const isExpiringSoon = daysLeft >= 0 && daysLeft <= 3 && !isCompleted;
    
    // User Logic
    const isOwner = goal.owners.includes(currentUser.id);
    const isBoosted = goal.boosts.includes(currentUser.id);

    // Dynamic Styles
    let progressBarColor = 'bg-gradient-to-r from-indigo-500 to-blue-400';
    let statusColor = 'text-indigo-400 border-indigo-500/30';
    let statusText = `${daysLeft} Days Remaining`;
    let StatusIcon = null;

    if (isCompleted) {
        progressBarColor = 'bg-gradient-to-r from-emerald-500 to-teal-400';
        statusColor = 'text-emerald-400 border-emerald-500/30';
        statusText = 'Mission Accomplished';
        StatusIcon = <Trophy className="w-3 h-3" />;
    } else if (isNearCompletion) {
        progressBarColor = 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400';
        statusColor = 'text-amber-400 border-amber-500/30';
        statusText = 'Final Push: Near Target';
        StatusIcon = <Zap className="w-3 h-3 animate-bounce" />;
    } else if (isOverdue) {
        progressBarColor = goal.isRedeemed ? 'bg-gradient-to-r from-rose-500 to-orange-400' : 'bg-slate-700';
        statusColor = goal.isRedeemed ? 'text-rose-400 border-rose-500/30' : 'text-slate-500 border-white/5';
        statusText = goal.isRedeemed ? 'Redemption Active' : 'Mission Failed';
        StatusIcon = goal.isRedeemed ? <Zap className="w-3 h-3 animate-pulse" /> : <AlertCircle className="w-3 h-3" />;
    } else if (isExpiringSoon) {
        progressBarColor = 'bg-gradient-to-r from-rose-500 to-orange-400';
        statusColor = 'text-rose-400 border-rose-500/30';
        statusText = `Critical: ${daysLeft} Days Left`;
        StatusIcon = <Flame className="w-3 h-3" />;
    }

    const handleDelete = async () => {
        if (await showConfirm(`ต้องการลบเป้าหมาย "${goal.title}" หรือไม่?`, 'ยืนยันการลบ')) {
            onDelete(goal.id);
        }
    };

    const handleUpdateClick = () => {
        if (isCompleted) return;
        if (isOverdue && !goal.isRedeemed) {
            // If overdue and not redeemed, owner must redeem first
            if (isOwner) {
                onRedeem(goal.id);
            }
            return;
        }
        onUpdate(goal);
    };

    return (
        <motion.div 
            layout
            onClick={handleUpdateClick}
            className={`
                bg-slate-900/40 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2.5rem] border transition-all flex flex-col h-full group relative overflow-hidden
                ${isCompleted ? 'border-emerald-500/30 shadow-lg shadow-emerald-900/20' : isNearCompletion ? 'border-amber-500/50 shadow-2xl shadow-amber-900/30 ring-2 ring-amber-500/20' : isOverdue ? (goal.isRedeemed ? 'border-rose-500/30 shadow-xl' : 'border-white/5 opacity-80') : isExpiringSoon ? 'border-rose-500/30 shadow-xl shadow-rose-900/20' : 'border-white/10 shadow-2xl shadow-black/40'}
                ${!isCompleted ? 'cursor-pointer hover:shadow-indigo-500/20 hover:border-indigo-500/60 hover:-translate-y-1' : ''}
                ${isNearCompletion ? 'animate-pulse-subtle' : ''}
                transition-all duration-500
            `}
        >
            {/* Background Decoration */}
            <div className={`absolute top-0 right-0 w-48 h-48 blur-[80px] opacity-20 -mr-20 -mt-20 pointer-events-none ${isCompleted ? 'bg-emerald-500' : isNearCompletion ? 'bg-amber-500' : isExpiringSoon ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
            
            {/* Scanline Animation for Near Completion */}
            {isNearCompletion && (
                <motion.div 
                    animate={{ y: ['0%', '1000%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/10 to-transparent h-10 w-full z-0 pointer-events-none"
                />
            )}
            
            {/* Modern Abstract Pattern - Background */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <pattern id={`grid-${goal.id}`} width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.2" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#grid-${goal.id})`} />
                </svg>
            </div>
            
            {/* Top Bar Status Line */}
            <div className={`h-1 w-full ${progressBarColor} transition-all duration-1000 opacity-60`}></div>

            <div className="p-4 sm:p-6 md:p-8 flex-1 flex flex-col relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                        <div className={`
                            w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center border transition-all shadow-xl backdrop-blur-md shrink-0
                            ${isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : isOverdue ? 'bg-white/5 border-white/5 text-gray-600' : 'bg-white/5 border-white/10 text-indigo-400 group-hover:border-indigo-500/50 group-hover:text-indigo-300'}
                        `}>
                            <PlatformIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1 sm:mb-2">
                                {channel && (
                                    <span className={`text-[8px] sm:text-[9px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border uppercase tracking-[0.1em] sm:tracking-[0.15em] ${channel.color} bg-black/20`}>
                                        {channel.name}
                                    </span>
                                )}
                                <span className={`flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border uppercase tracking-[0.1em] sm:tracking-[0.15em] ${statusColor} bg-black/20 ${isExpiringSoon || isNearCompletion ? 'animate-pulse' : ''}`}>
                                    {StatusIcon} {statusText}
                                </span>
                            </div>
                            <h3 className={`font-black text-base sm:text-xl tracking-tight line-clamp-1 uppercase italic ${isOverdue ? 'text-gray-600 line-through' : 'text-white'}`} title={goal.title}>
                                {goal.title}
                            </h3>
                        </div>
                    </div>
                    
                    {/* Menu Actions */}
                    <div className="relative group/menu" onClick={e => e.stopPropagation()}>
                        <button className="p-2.5 text-gray-600 hover:text-white rounded-xl hover:bg-white/5 transition-all">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                        <div className="absolute right-0 top-full w-48 pt-2 hidden group-hover/menu:block z-30 animate-in fade-in zoom-in-95">
                            <div className="bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                                <button onClick={() => onRequestExtension(goal.id, goal.title)} className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-500/20 transition-colors flex items-center gap-3">
                                    <Calendar className="w-4 h-4" /> Request Extension
                                </button>
                                <button onClick={() => onEdit(goal)} className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3">
                                    <RefreshCw className="w-4 h-4" /> Reconfigure
                                </button>
                                <button onClick={handleDelete} className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-3">
                                    <AlertCircle className="w-4 h-4" /> Terminate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Section */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex justify-between items-end mb-3 sm:mb-4">
                        <div className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter italic ${isCompleted ? 'text-emerald-400' : isOverdue ? 'text-gray-600' : isNearCompletion ? 'text-amber-400' : isExpiringSoon ? 'text-rose-400' : 'text-indigo-400'}`}>
                            {percent}<span className="text-lg sm:text-2xl text-gray-700 font-black ml-1">%</span>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] sm:text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] mb-0.5 sm:mb-1">Sync Status</p>
                            <p className="text-xs sm:text-base font-black text-gray-300 tracking-tight">
                                {goal.currentValue.toLocaleString()} <span className="text-gray-700 mx-0.5 sm:mx-1">/</span> {goal.targetValue.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden p-1 border border-white/5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full rounded-full ${progressBarColor} relative overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.3)] ${isNearCompletion ? 'shadow-amber-500/50' : ''}`}
                        >
                            {/* Shimmer Effect for active goals */}
                            {!isCompleted && !isOverdue && (
                                <motion.div 
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: isNearCompletion ? 1 : 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-1/2 h-full"
                                />
                            )}
                        </motion.div>
                    </div>
                </div>

                {/* Boosts / Cheers Section - Grand Display */}
                <div className="mb-6 sm:mb-8 flex flex-wrap items-center gap-3 sm:gap-4" onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={() => onToggleBoost(goal.id, isBoosted)}
                        className={`
                            flex items-center gap-1.5 sm:gap-2.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest transition-all active:scale-90
                            ${isBoosted 
                                ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50' 
                                : 'bg-white/5 border border-white/10 text-gray-500 hover:border-rose-500/50 hover:text-rose-400'}
                        `}
                    >
                        <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isBoosted ? 'fill-white' : ''}`} />
                        {isBoosted ? 'Boosted!' : 'Send Power'}
                    </button>
                    
                    <div className="flex -space-x-2 sm:-space-x-3 overflow-hidden">
                        {goal.boosts.slice(0, 5).map(uid => {
                            const u = users.find(user => user.id === uid);
                            if (!u) return null;
                            return (
                                <motion.img 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    key={uid} 
                                    src={u.avatarUrl} 
                                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-slate-900 bg-slate-800 object-cover shadow-xl" 
                                    title={`${u.name} ส่งพลังเชียร์!`} 
                                />
                            );
                        })}
                        {goal.boosts.length > 5 && (
                            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] sm:text-[10px] font-black text-gray-500 shadow-xl">
                                +{goal.boosts.length - 5}
                            </div>
                        )}
                    </div>
                    {goal.boosts.length > 0 && (
                        <motion.span 
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-[9px] sm:text-[10px] font-black text-rose-400 uppercase tracking-[0.1em] sm:tracking-[0.15em]"
                        >
                            {goal.boosts.length} Boosts!
                        </motion.span>
                    )}
                </div>

                {/* Footer Info */}
                <div className="mt-auto flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-4 pt-4 sm:pt-6 border-t border-white/5" onClick={e => e.stopPropagation()}>
                    {/* Guardians */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex -space-x-3 sm:-space-x-4">
                            {goal.owners.map(uid => {
                                const u = users.find(user => user.id === uid);
                                if (!u) return null;
                                return (
                                    <img key={uid} src={u.avatarUrl} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl border border-slate-900 bg-slate-800 object-cover shadow-xl" title={u.name} />
                                );
                            })}
                        </div>
                        <button 
                            onClick={() => onToggleOwner(goal.id, currentUser.id, isOwner)}
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl border flex items-center justify-center text-xs transition-all shadow-xl ${isOwner ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white border-rose-500/30' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-indigo-600 hover:text-white'}`}
                            title={isOwner ? "Leave Team" : "Join Team"}
                        >
                            {isOwner ? '-' : <Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                    </div>

                    {/* Incentives Badge */}
                    <div className="flex flex-col items-start xs:items-end gap-1 sm:gap-1.5 shrink-0">
                        <span className="text-[8px] sm:text-[9px] font-black text-gray-600 uppercase tracking-[0.15em] sm:tracking-[0.2em]">Rewards {goal.isRedeemed && '(30%)'}</span>
                        <div className="flex items-center gap-3 sm:gap-4 bg-black/40 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-white/5 shadow-inner">
                            <div className="flex items-center text-[10px] sm:text-[11px] font-black text-amber-400 italic">
                                <Star className="w-3.5 h-3.5 text-amber-400 mr-1 sm:mr-1.5 fill-amber-400" /> {goal.isRedeemed ? Math.round(goal.rewardXp * 0.3) : goal.rewardXp}
                            </div>
                            <div className="w-px h-3 sm:h-4 bg-white/10"></div>
                            <div className="flex items-center text-[10px] sm:text-[11px] font-black text-amber-400 italic">
                                <Coins className="w-3.5 h-3.5 text-amber-500 mr-1 sm:mr-1.5 fill-amber-500" /> {goal.isRedeemed ? Math.round(goal.rewardCoin * 0.3) : goal.rewardCoin}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Action Button */}
            {!isCompleted && (
                <div 
                    className={`
                        w-full py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all flex items-center justify-center gap-2.5 sm:gap-3 border-t
                        ${isOverdue ? (goal.isRedeemed ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white') : isNearCompletion ? 'bg-amber-600/20 text-amber-400 border-amber-500/20 group-hover:bg-amber-600 group-hover:text-white' : isExpiringSoon ? 'bg-rose-600/20 text-rose-400 border-rose-500/20 group-hover:bg-rose-600 group-hover:text-white' : 'bg-white/5 text-gray-500 border-white/5 group-hover:bg-indigo-600 group-hover:text-white'}
                    `}
                >
                    {isOverdue ? (
                        goal.isRedeemed ? (
                            <><Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Sync Redemption Progress</>
                        ) : (
                            <><Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Mission Failed: Redeem Now</>
                        )
                    ) : (
                        <><Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {isNearCompletion ? 'Final Push: Sync Now' : 'Sync Progress'}</>
                    )}
                </div>
            )}
             {isCompleted && (
                <div className="w-full py-4 sm:py-5 bg-emerald-500/10 text-emerald-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] border-t border-emerald-500/20 flex items-center justify-center gap-2.5 sm:gap-3">
                    <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Mission Accomplished
                </div>
            )}
        </motion.div>
    );
};

export default GoalCard;
