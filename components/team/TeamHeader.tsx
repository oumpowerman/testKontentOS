
import React, { memo, useState } from 'react';
import { Send, ShoppingBag, Wallet, Settings, Sparkles, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { User } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileActionSheet } from './MobileActionSheet';

interface TeamHeaderProps {
    onAddTask?: (type?: any) => void;
    onManageClick?: () => void;
    currentUser: User | null;
    isShopOpen: boolean;
    toggleShop: () => void;
    viewMode: 'TEAM' | 'INTERNS';
    setViewMode: (mode: 'TEAM' | 'INTERNS') => void;
    onOpenRandomizer?: () => void;
    onOpenReport?: () => void;
}

const TeamHeader: React.FC<TeamHeaderProps> = ({ 
    onAddTask, 
    onManageClick,
    currentUser, 
    isShopOpen, 
    toggleShop,
    viewMode,
    setViewMode,
    onOpenRandomizer,
    onOpenReport
}) => {
    const isAdmin = currentUser?.role === 'ADMIN';
    const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

    return (
        <div className="relative p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-white/40 backdrop-blur-xl border border-white/80 shadow-2xl shadow-indigo-500/10 overflow-hidden group w-full">
            {/* Decorative Floating Elements */}
            <motion.div 
                animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 w-24 h-24 bg-white/40 rounded-full blur-2xl"
            />
            <motion.div 
                animate={{ 
                    y: [0, 10, 0],
                    rotate: [0, -5, 0]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-200/30 rounded-full blur-3xl"
            />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 md:gap-6 w-full">
                <div className="flex items-start gap-3.5 md:gap-4 w-full md:w-auto">
                    <motion.div 
                        whileHover={{ scale: 1.2, rotate: [0, -15, 15, 0] }}
                        transition={{ 
                            scale: { type: "spring", stiffness: 300 },
                            rotate: { duration: 0.5, ease: "easeInOut" }
                        }}
                        className="text-4xl md:text-5xl drop-shadow-2xl filter brightness-110 cursor-default shrink-0 mt-0.5"
                    >
                        👨‍👦‍👦
                    </motion.div>
                    <div className="flex-1 min-w-0">
                        <div className="relative inline-block w-full">
                            <AnimatePresence mode="wait">
                                <motion.h1 
                                    key={viewMode}
                                    initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                                    transition={{ duration: 0.4, ease: "circOut" }}
                                    className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-gray-900 via-gray-800 to-gray-600 tracking-tight flex flex-wrap items-baseline gap-x-2 gap-y-1"
                                >
                                    {viewMode === 'TEAM' ? (
                                        <>
                                            <span className="text-gray-900">Squad Tasks</span>
                                            <span className="text-indigo-600 font-bold text-xs sm:text-sm md:text-base lg:text-lg">
                                                (ภารกิจแก๊ง)
                                            </span>
                                        </>
                                    ) : (
                                        <motion.div 
                                            className="flex flex-wrap items-baseline gap-x-2 gap-y-1"
                                            animate={{ 
                                                rotate: [0, -1, 1, -1, 0],
                                                scale: [1, 1.02, 1]
                                            }}
                                            transition={{ 
                                                duration: 4, 
                                                repeat: Infinity, 
                                                ease: "easeInOut" 
                                            }}
                                        >
                                            <span className="bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600">
                                                Interns
                                            </span>
                                            <span className="text-indigo-600 font-bold text-xs sm:text-sm md:text-base lg:text-lg">
                                                (จัดการเด็กฝึกงาน) 🎓
                                            </span>
                                        </motion.div>
                                    )}
                                </motion.h1>
                            </AnimatePresence>
                        </div>
                        
                        {/* Subtitle & Switcher Toggle Wrapper (Column on mobile, Row on desktop) */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 w-full">
                            <p className="text-gray-500 text-xs md:text-sm font-semibold flex items-center gap-1.5 leading-relaxed">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>
                                    {viewMode === 'TEAM' ? 'เช็คงานเบี้ยบ้ายรายทาง งานด่วน งานงอก' : 'จัดการตารางฝึกงานของน้องๆ'}
                                </span>
                            </p>
                            
                            {/* View Switcher Toggle */}
                            <div className="flex bg-gray-200/50 backdrop-blur-md p-1 rounded-xl border border-gray-300/50 relative self-start shrink-0 scale-90 sm:scale-100 origin-left">
                                <button 
                                    onClick={() => setViewMode('TEAM')}
                                    className={`relative z-10 px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-colors duration-300 ${viewMode === 'TEAM' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-655'}`}
                                >
                                    TEAM
                                    {viewMode === 'TEAM' && (
                                        <motion.div 
                                            layoutId="teamModeTab"
                                            className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                                            transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                        />
                                    )}
                                </button>
                                <button 
                                    onClick={() => setViewMode('INTERNS')}
                                    className={`relative z-10 px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-colors duration-300 ${viewMode === 'INTERNS' ? 'text-purple-600' : 'text-gray-400 hover:text-gray-655'}`}
                                >
                                    INTERNS
                                    {viewMode === 'INTERNS' && (
                                        <motion.div 
                                            layoutId="teamModeTab"
                                            className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                                            transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                        />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Desktop Buttons (Visible on desktop only) */}
                <div className="hidden md:flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Admin Manage Button */}
                    {isAdmin && onManageClick && (
                        <motion.button 
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onManageClick}
                            className="p-3.5 bg-white/60 backdrop-blur-md border border-white/80 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 rounded-2xl shadow-sm transition-all"
                            title="จัดการสมาชิก"
                        >
                            <Settings className="w-5 h-5" />
                        </motion.button>
                    )}

                    <AnimatePresence>
                        {viewMode === 'TEAM' && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-wrap items-center gap-3"
                            >
                                {/* Randomizer Button */}
                                {onOpenRandomizer && (
                                    <motion.button 
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onOpenRandomizer} 
                                        className="group flex items-center px-6 py-3.5 bg-gradient-to-br from-pink-400 to-rose-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-pink-500/20 hover:shadow-pink-500/40 transition-all border border-white/20"
                                    >
                                        <span className="text-lg mr-2 group-hover:rotate-12 transition-transform">🎲</span>
                                        สุ่มผู้โชคดี
                                    </motion.button>
                                )}

                                {/* Report Issue Button */}
                                {onOpenReport && (
                                    <motion.button 
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onOpenReport} 
                                        className="group flex items-center px-6 py-3.5 bg-gradient-to-br from-red-400 to-orange-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-red-500/20 hover:shadow-red-500/40 transition-all border border-white/20"
                                    >
                                        <AlertTriangle className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                                        ฟ้อง/แจ้งเหตุ
                                    </motion.button>
                                )}

                                {/* Distribute Task Button */}
                                {onAddTask && (
                                    <motion.button 
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onAddTask('TASK')} 
                                        className="group flex items-center px-6 py-3.5 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all border border-white/20"
                                    >
                                        <Send className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                                        สั่งงานด่วน
                                    </motion.button>
                                )}

                                {/* Wallet & Shop */}
                                {currentUser && (
                                    <motion.div 
                                        whileHover={{ scale: 1.05 }}
                                        className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-1 pr-5 pl-3.5 rounded-2xl flex items-center shadow-xl shadow-indigo-500/20 cursor-default border border-white/20 relative overflow-hidden group/wallet"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/wallet:translate-x-full transition-transform duration-1000" />
                                        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mr-3 backdrop-blur-md border border-white/10">
                                            <Wallet className="w-4.5 h-4.5 text-yellow-300 drop-shadow-sm" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-indigo-100 font-black uppercase tracking-widest leading-none mb-1">My Points</p>
                                            <p className="text-xl font-black leading-none tabular-nums">{currentUser.availablePoints || 0}</p>
                                        </div>
                                    </motion.div>
                                )}
                                
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={toggleShop} 
                                    className={`flex items-center px-5 py-3.5 rounded-2xl text-sm font-black shadow-lg transition-all border ${isShopOpen ? 'bg-indigo-50/80 backdrop-blur-md border-indigo-200 text-indigo-700' : 'bg-white/60 backdrop-blur-md border-white/80 text-gray-600 hover:text-indigo-600 hover:border-indigo-200'}`}
                                >
                                    <ShoppingBag className={`w-4 h-4 mr-2 transition-transform ${isShopOpen ? 'scale-110' : ''}`} /> 
                                    {isShopOpen ? 'ปิดร้าน' : 'ร้านค้า'}
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Mobile Actions Container (Sleek horizontal toolbar layout on mobile) */}
                {viewMode === 'TEAM' && (
                    <div className="flex md:hidden items-center gap-2.5 w-full mt-4">
                        {/* Compact Points Badge */}
                        {currentUser && (
                            <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2.5 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/40 rounded-xl shadow-sm">
                                <Wallet className="w-4 h-4 text-indigo-600 shrink-0" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[8px] text-indigo-700 font-extrabold tracking-wider uppercase leading-none">Points</span>
                                    <span className="text-sm font-black text-indigo-900 tabular-nums leading-none mt-0.5 truncate">{currentUser.availablePoints || 0}</span>
                                </div>
                            </div>
                        )}

                        {/* Quick Task Button */}
                        {onAddTask && (
                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onAddTask('TASK')} 
                                className="flex-1 min-w-0 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 border border-white/10"
                            >
                                <Send className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">สั่งงานด่วน</span>
                            </motion.button>
                        )}

                        {/* Control Menu Sheet Trigger */}
                        <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsActionSheetOpen(true)} 
                            className="flex-1 min-w-0 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/85 backdrop-blur-md border border-gray-200/80 text-gray-700 rounded-xl text-xs font-bold shadow-sm"
                        >
                            <MoreHorizontal className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span className="truncate">ควบคุมทีม</span>
                        </motion.button>
                    </div>
                )}

                {/* Custom Bottom Action Sheet for Mobile */}
                <MobileActionSheet
                    isOpen={isActionSheetOpen}
                    onClose={() => setIsActionSheetOpen(false)}
                    onOpenRandomizer={onOpenRandomizer}
                    onOpenReport={onOpenReport}
                    isShopOpen={isShopOpen}
                    toggleShop={toggleShop}
                    isAdmin={isAdmin}
                    onManageClick={onManageClick}
                />
            </div>
        </div>
    );
};

export default memo(TeamHeader);

