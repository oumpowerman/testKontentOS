import React from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Star } from 'lucide-react';
import { User } from '../../../../types';

interface DetailModalHeaderProps {
    user: User;
    isScrolled: boolean;
    totalIssues: number;
    onClose: () => void;
}

export const DetailModalHeader: React.FC<DetailModalHeaderProps> = ({
    user,
    isScrolled,
    totalIssues,
    onClose
}) => {
    return (
        <motion.div 
            animate={{ 
                paddingTop: isScrolled ? '16px' : '32px',
                paddingBottom: isScrolled ? '16px' : '32px',
                paddingLeft: isScrolled ? '24px' : '32px',
                paddingRight: isScrolled ? '24px' : '32px'
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-gradient-to-br from-indigo-50 via-white to-pink-50 relative overflow-hidden shrink-0 border-b border-indigo-100"
        >
            <motion.button 
                onClick={onClose} 
                animate={{
                    top: isScrolled ? '12px' : '24px',
                    right: isScrolled ? '16px' : '24px'
                }}
                transition={{ duration: 0.3 }}
                className="absolute p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm z-20 border border-slate-100"
            >
                <X className="w-5 h-5"/>
            </motion.button>

            <div className="flex items-center gap-4 relative z-10">
                <div className="relative">
                    <motion.div 
                        animate={{ 
                            borderRadius: isScrolled ? '1.5rem' : '2.5rem',
                            inset: isScrolled ? '-4px' : '-8px'
                        }}
                        transition={{ duration: 0.3 }}
                        className="absolute bg-gradient-to-tr from-indigo-200 to-pink-200 blur-lg opacity-40 animate-pulse"
                    ></motion.div>
                    <motion.img 
                        src={user.avatarUrl} 
                        animate={{ 
                            width: isScrolled ? '48px' : '96px',
                            height: isScrolled ? '48px' : '96px',
                            borderRadius: isScrolled ? '1.2rem' : '2.2rem'
                        }}
                        transition={{ duration: 0.3 }}
                        className="border-4 border-white object-cover shadow-xl relative z-10" 
                        alt={user.name} 
                        referrerPolicy="no-referrer"
                    />
                    <motion.div 
                        animate={{
                            width: isScrolled ? '20px' : '28px',
                            height: isScrolled ? '20px' : '28px',
                            borderRadius: isScrolled ? '8px' : '12px'
                        }}
                        transition={{ duration: 0.3 }}
                        className={`absolute -bottom-1 -right-1 border-2 border-white flex items-center justify-center z-20 ${user.workStatus === 'ONLINE' ? 'bg-emerald-400' : 'bg-slate-300'}`}
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </motion.div>
                </div>
                <div className="min-w-0">
                    <motion.div 
                        animate={{ 
                            opacity: isScrolled ? 0 : 1,
                            height: isScrolled ? 0 : 'auto',
                            marginBottom: isScrolled ? 0 : '4px'
                        }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2 overflow-hidden"
                    >
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-100 text-[10px] font-black text-indigo-500 uppercase tracking-widest">Profile Card</span>
                        {totalIssues === 0 && <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1"><Star className="w-2 h-2" /> Perfect</span>}
                    </motion.div>
                    <motion.h3 
                        animate={{ 
                            fontSize: isScrolled ? '1.25rem' : '1.875rem',
                            lineHeight: isScrolled ? '1.75rem' : '2.25rem'
                        }}
                        transition={{ duration: 0.3 }}
                        className="font-bold text-slate-800 tracking-tight mb-1 truncate text-left"
                    >
                        {user.name}
                    </motion.h3>
                    <motion.div 
                        animate={{ 
                            opacity: isScrolled ? 0 : 1,
                            height: isScrolled ? 0 : 'auto'
                        }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2 overflow-hidden"
                    >
                        <span className="px-3 py-1 rounded-xl bg-white border border-indigo-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
                            {user.position}
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-400 to-sky-400 text-[10px] font-black text-white uppercase tracking-widest shadow-md">
                            Level {user.level}
                        </span>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};
