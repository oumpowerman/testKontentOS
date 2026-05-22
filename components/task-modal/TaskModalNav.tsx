import React from 'react';
import { ChevronRight, ChevronDown, Activity, Layout, Truck, FileText, MessageSquare, Paperclip, History, Book } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TAB_CONFIGS } from './constants';

interface TaskModalNavProps {
    isNavExpanded: boolean;
    setIsNavExpanded: (val: boolean) => void;
    isMobile: boolean;
    currentTheme: { icon: any, label: string };
    themeColor: string;
    viewMode: string;
    setViewMode: (mode: any) => void;
    isContent: boolean;
    hasLinkedScript: boolean;
    assetCount: number;
    subTaskCount?: number;
    commentCount?: number;
}

const TaskModalNav: React.FC<TaskModalNavProps> = ({
    isNavExpanded,
    setIsNavExpanded,
    isMobile,
    currentTheme,
    themeColor,
    viewMode,
    setViewMode,
    isContent,
    hasLinkedScript,
    assetCount,
    subTaskCount,
    commentCount
}) => {
    return (
        <motion.div 
            layout
            animate={{ 
                height: isNavExpanded ? 'auto' : 46,
            }}
            transition={{
                height: { type: 'spring', damping: 25, stiffness: 120 }
            }}
            className="shrink-0 bg-white border-b border-slate-50 relative overflow-hidden"
        >
            {/* INFINITE ENERGY RAIL */}
            <div className="absolute top-0 left-0 right-0 h-[4px] overflow-hidden z-50 pointer-events-none">
                
                {/* Soft Ambient Glow */}
                <div className="absolute inset-0 opacity-40 blur-md">
                    <div
                        className="w-full h-full"
                        style={{
                            background: `
                                linear-gradient(
                                    90deg,
                                    #818cf8 0%,
                                    #e879f9 25%,
                                    #fde68a 50%,
                                    #6ee7b7 75%,
                                    #67e8f9 100%
                                )
                            `,
                        }}
                    />
                </div>

                {/* Infinite Rail */}
                <motion.div
                    animate={{
                        x: ['0%', '-50%'],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 10,
                        ease: 'linear',
                    }}
                    className="absolute top-0 left-0 h-full w-[200%]"
                    style={{
                        willChange: 'transform',
                    }}
                >
                    <div
                        className="absolute top-0 left-0 h-full w-full"
                        style={{
                            backgroundImage: `
                                linear-gradient(
                                    90deg,
                                    rgba(129,140,248,0.95) 0%,
                                    rgba(232,121,249,0.95) 20%,
                                    rgba(253,230,138,0.95) 40%,
                                    rgba(110,231,183,0.95) 60%,
                                    rgba(103,232,249,0.95) 80%,
                                    rgba(129,140,248,0.95) 100%
                                )
                            `,
                            backgroundSize: '50% 100%',
                            backgroundRepeat: 'repeat-x',
                            filter: 'blur(0.4px)',
                        }}
                    />
                </motion.div>

                {/* Moving Shine */}
                <motion.div
                    animate={{
                        x: ['-20%', '120%'],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: 'easeInOut',
                    }}
                    className="absolute top-0 h-full w-32"
                    style={{
                        background: `
                            linear-gradient(
                                90deg,
                                transparent 0%,
                                rgba(255,255,255,0.55) 50%,
                                transparent 100%
                            )
                        `,
                        filter: 'blur(3px)',
                        mixBlendMode: 'screen',
                    }}
                />
            </div>

            <AnimatePresence initial={false}>
                {!isNavExpanded ? (
                    /* COLLAPSED NAV (With Rainbow Line) */
                    <motion.div 
                        key="collapsed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setIsNavExpanded(true)}
                        className="h-[46px] flex items-center justify-between px-6 cursor-pointer hover:bg-slate-50/50 transition-colors group absolute inset-0 z-10"
                    >
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className={`p-1 bg-${themeColor}-50 rounded-lg group-hover:scale-110 transition-transform`}>
                                {React.createElement(currentTheme.icon, { className: `w-4 h-4 text-${themeColor}-500` })}
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest">
                                <span className="hidden sm:inline">MENU: </span>
                                <span className={`text-${themeColor}-600`}>{currentTheme.label}</span>
                            </span>
                        </div>

                        {/* PREMIUM MINI MARKERS (COLLAPSED NAVIGATION HUB) */}
                        <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-50/60 border border-slate-100/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                            {isContent && subTaskCount !== undefined && subTaskCount > 0 && (
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center gap-1 px-1 sm:px-1.5 py-0.5 rounded-md bg-cyan-50 border border-cyan-100 text-cyan-600 shadow-[0_1px_1px_rgba(0,0,0,0.02)]" 
                                    title={`งานย่อย: ${subTaskCount} รายการ`}
                                >
                                    <Truck className="w-3.5 h-3.5 stroke-[2.2px]" />
                                    <span className="text-[9px] sm:text-[10px] font-black leading-none">{subTaskCount}</span>
                                </motion.div>
                            )}
                            
                            {hasLinkedScript && (
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center px-1 sm:px-1.5 py-0.5 rounded-md bg-rose-50 border border-rose-100 text-rose-500 shadow-[0_1px_1px_rgba(0,0,0,0.02)]" 
                                    title="มีบทภาพยนตร์ / สคริปต์"
                                >
                                    <FileText className="w-3.5 h-3.5 stroke-[2.2px]" />
                                </motion.div>
                            )}

                            {commentCount !== undefined && commentCount > 0 && (
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center gap-1 px-1 sm:px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-[0_1px_1px_rgba(0,0,0,0.02)]" 
                                    title={`คอมเมนต์แชท: ${commentCount} รายการ`}
                                >
                                    <MessageSquare className="w-3.5 h-3.5 stroke-[2.2px]" />
                                    <span className="text-[9px] sm:text-[10px] font-black leading-none">{commentCount}</span>
                                </motion.div>
                            )}

                            {assetCount > 0 && (
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center gap-1 px-1 sm:px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-100 text-amber-600 shadow-[0_1px_1px_rgba(0,0,0,0.02)]" 
                                    title={`ไฟล์แนบ: ${assetCount} ไฟล์`}
                                >
                                    <Paperclip className="w-3.5 h-3.5 stroke-[2.2px]" />
                                    <span className="text-[9px] sm:text-[10px] font-black leading-none">{assetCount}</span>
                                </motion.div>
                            )}
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2">
                            <span className="hidden md:inline text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors tracking-widest">TAP FOR TOOLS</span>
                            <ChevronRight className="w-4 h-4 text-slate-200 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </motion.div>
                ) : (
                    /* EXPANDED NAV */
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white overflow-hidden"
                    >
                        <motion.div 
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="px-2 sm:px-6 pt-2 sm:pt-4 pb-1.5 sm:pb-4"
                        >
                            <div className="flex items-center justify-between mb-3 px-2">
                                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> Navigation Hub
                                </span>
                                <button 
                                    onClick={() => setIsNavExpanded(false)}
                                    className="text-[12px] font-medium  text-indigo-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
                                >
                                    HIDE MENU <ChevronDown className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="flex bg-gray-100/80 p-1 rounded-xl sm:rounded-2xl overflow-x-auto scrollbar-none relative gap-1 snap-x snap-mandatory">
                                {[
                                    { id: 'DETAILS', label: 'ดีเทล', icon: Layout },
                                    ...(isContent ? [{ id: 'LOGISTICS', label: 'งานย่อย', icon: Truck, count: subTaskCount }] : []),
                                    ...(hasLinkedScript ? [{ id: 'SCRIPT', label: 'สคริปต์', icon: FileText }] : []),
                                    { id: 'COMMENTS', label: 'แชท', icon: MessageSquare, count: commentCount },
                                    { id: 'ASSETS', label: 'ไฟล์', icon: Paperclip, count: assetCount },
                                    { id: 'HISTORY', label: 'ประวัติ', icon: History },
                                    { id: 'WIKI', label: 'คู่มือ', icon: Book }
                                ].map((tab) => {
                                    const isActive = viewMode === tab.id;
                                    const config = TAB_CONFIGS[tab.id];

                                    return (
                                        <button 
                                            key={tab.id}
                                            onClick={() => {
                                                setViewMode(tab.id as any);
                                                if (isMobile) setIsNavExpanded(false);
                                            }}
                                            className={`
                                                flex-1 py-1.5 sm:py-2.5 px-3 sm:px-4 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold transition-all duration-300 ease-out flex items-center justify-center gap-2 whitespace-nowrap relative snap-start z-10
                                                ${isActive ? `text-${config.color}-600` : `text-slate-500 hover:text-slate-700`}
                                            `}
                                        >
                                            <tab.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                                            <span className="hidden sm:inline">{tab.label}</span>
                                            
                                            {tab.count !== undefined && tab.count > 0 && (
                                                <motion.span 
                                                    initial={{ scale: 0, y: 5 }}
                                                    animate={{ scale: 1, y: 0 }}
                                                    className={`
                                                        min-w-[12px] sm:min-w-[16px] h-[12px] sm:h-[16px] px-1 flex items-center justify-center rounded-full text-[7px] sm:text-[9px] font-black border border-white/40 shadow-sm
                                                        ${isActive 
                                                            ? `bg-${config.color}-500 text-white` 
                                                            : 'bg-slate-500/80 text-white'}
                                                    `}
                                                >
                                                    {tab.count}
                                                </motion.span>
                                            )}

                                            {isActive && (
                                                <>
                                                    <motion.div 
                                                        layoutId="activeTabBackground"
                                                        className="absolute inset-0 bg-white shadow-sm ring-1 ring-black/5 rounded-lg sm:rounded-xl -z-10"
                                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                                    />
                                                    <motion.div 
                                                        layoutId="activeTabUnderline"
                                                        className={`absolute -bottom-1 left-2 right-2 h-0.5 sm:h-1 bg-${config.color}-400/40 rounded-full blur-[1px]`}
                                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                                    >
                                                        <motion.div 
                                                            animate={{ 
                                                                x: ['-100%', '100%'],
                                                                opacity: [0, 1, 0]
                                                            }}
                                                            transition={{ 
                                                                repeat: Infinity, 
                                                                duration: 1.5,
                                                                ease: "linear"
                                                            }}
                                                            className={`absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50`}
                                                        />
                                                    </motion.div>
                                                </>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default TaskModalNav;
