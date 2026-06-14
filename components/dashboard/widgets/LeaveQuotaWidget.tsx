
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LeaveUsage, LeaveType } from '../../../types/attendance';
import { Palmtree, HeartPulse, Briefcase, ChevronRight, Sparkles, Star, Cloud, FileText } from 'lucide-react';
import { useMasterData } from '../../../hooks/useMasterData';

interface LeaveQuotaWidgetProps {
    leaveUsage: LeaveUsage;
    onHistoryClick?: () => void;
}

const PASTEL_THEMES: Record<string, any> = {
    'VACATION': { 
        bg: 'bg-[#E0F7FA]', 
        text: 'text-[#00ACC1]', 
        bar: 'bg-gradient-to-r from-[#4DD0E1] to-[#00BCD4]', 
        glow: 'shadow-[0_0_15px_rgba(0,188,212,0.4)]',
        icon: Palmtree,
        label: 'พักร้อน',
        accent: 'text-[#80DEEA]'
    },
    'SICK': { 
        bg: 'bg-[#FCE4EC]', 
        text: 'text-[#D81B60]', 
        bar: 'bg-gradient-to-r from-[#F06292] to-[#E91E63]', 
        glow: 'shadow-[0_0_15px_rgba(233,30,99,0.4)]',
        icon: HeartPulse,
        label: 'ลาป่วย',
        accent: 'text-[#F8BBD0]'
    },
    'PERSONAL': { 
        bg: 'bg-[#F3E5F5]', 
        text: 'text-[#8E24AA]', 
        bar: 'bg-gradient-to-r from-[#BA68C8] to-[#9C27B0]', 
        glow: 'shadow-[0_0_15px_rgba(156,39,176,0.4)]',
        icon: Briefcase,
        label: 'ลากิจ',
        accent: 'text-[#E1BEE7]'
    },
    'DEFAULT': {
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        bar: 'bg-gradient-to-r from-slate-400 to-slate-600',
        glow: 'shadow-[0_0_15px_rgba(71,85,105,0.4)]',
        icon: FileText,
        label: 'อื่นๆ',
        accent: 'text-slate-300'
    }
};

const LeaveQuotaWidget: React.FC<LeaveQuotaWidgetProps> = ({ leaveUsage, onHistoryClick }) => {
    const { masterOptions } = useMasterData();
    
    const displayOptions = useMemo(() => {
        return masterOptions
            .filter(o => o.type === 'LEAVE_TYPE' && o.isActive)
            .filter(o => {
                try {
                    const meta = o.description ? JSON.parse(o.description) : {};
                    return meta.category === 'STANDARD';
                } catch (e) {
                    return false;
                }
            })
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }, [masterOptions]);

    return (
        <div className="bg-white rounded-[3rem] border-4 border-[#F8F9FA] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-8 relative overflow-hidden group h-full flex flex-col justify-between">
            
            {/* Background Decor - Cute Floating Elements */}
            <motion.div 
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 right-10 text-[#FFD54F] opacity-20"
            >
                <Star className="w-8 h-8 fill-current" />
            </motion.div>
            <motion.div 
                animate={{ x: [0, 10, 0], y: [0, 5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-10 left-4 text-[#B2EBF2] opacity-30"
            >
                <Cloud className="w-12 h-12 fill-current" />
            </motion.div>

            {/* Header */}
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex flex-col">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <motion.div 
                            whileHover={{ rotate: 360, scale: 1.2 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-2xl shadow-lg shadow-indigo-200"
                        >
                            <Sparkles className="w-5 h-5" />
                        </motion.div>
                        <span className="tracking-tight">โควตาวันลา</span>
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 ml-14">My Leave Quota</p>
                </div>
                
                {onHistoryClick && (
                    <motion.button 
                        whileHover={{ x: 5 }}
                        onClick={onHistoryClick}
                        className="px-4 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-2xl text-xs font-black transition-all flex items-center gap-1 border border-slate-100"
                    >
                        ประวัติ <ChevronRight className="w-4 h-4" />
                    </motion.button>
                )}
            </div>

            {/* Quota Bars */}
            <div className="space-y-8 relative z-10">
                {displayOptions.map((option, index) => {
                    const type = option.key;
                    let limit = 0;
                    try {
                        const meta = option.description ? JSON.parse(option.description) : {};
                        limit = meta.defaultQuota || 0;
                    } catch (e) {}

                    const used = leaveUsage[type as LeaveType] || 0;
                    const remaining = Math.max(0, limit - used);
                    const percentUsed = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
                    
                    const theme = PASTEL_THEMES[type] || PASTEL_THEMES['DEFAULT'];
                    const Icon = theme.icon;

                    return (
                        <motion.div 
                            key={type}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative"
                        >
                            <div className="flex justify-between items-end mb-3 px-1">
                                <div className="flex items-center gap-3">
                                    <motion.div 
                                        animate={{ 
                                            rotate: [0, -10, 10, -10, 0],
                                            scale: [1, 1.1, 1]
                                        }}
                                        transition={{ 
                                            duration: 2, 
                                            repeat: Infinity, 
                                            repeatDelay: 3 + index,
                                            ease: "easeInOut" 
                                        }}
                                        className={`p-2.5 ${theme.bg} ${theme.text} rounded-2xl shadow-sm border border-white`}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </motion.div>
                                    <div>
                                        <span className="text-sm font-black text-slate-700 block leading-none">{option.label}</span>
                                        <span className={`text-[10px] font-bold ${theme.accent} uppercase tracking-widest`}>{type}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Remaining</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-2xl font-black tracking-tighter ${remaining === 0 ? 'text-rose-500' : 'text-slate-800'}`}>
                                            {remaining}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">/ {limit} วัน</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Progress Track - 3D Style */}
                            <div className="h-5 w-full bg-slate-100 rounded-full p-1 border border-slate-200/50 shadow-inner relative group/bar overflow-hidden">
                                {/* Bar with Glow and Gradient */}
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentUsed}%` }}
                                    transition={{ duration: 1.5, ease: "circOut" }}
                                    className={`h-full rounded-full relative ${theme.bar} ${theme.glow} border border-white/30`}
                                >
                                    {/* Glass Shine Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent h-1/2 rounded-full"></div>
                                    
                                    {/* Animated Shimmer */}
                                    <motion.div 
                                        animate={{ x: ['-100%', '200%'] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2 h-full skew-x-[-20deg]"
                                    />
                                </motion.div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Bottom Decor */}
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-50 rounded-full blur-[80px] opacity-60 pointer-events-none"></div>
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-50 rounded-full blur-[80px] opacity-60 pointer-events-none"></div>
        </div>
    );
};

export default LeaveQuotaWidget;
