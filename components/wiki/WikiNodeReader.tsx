
import React, { useState, useEffect, useRef } from 'react';
import { WikiNode, User } from '../../types';
import { 
    X, 
    Edit3, 
    FileText, 
    Calendar, 
    User as UserIcon, 
    Clock, 
    ArrowUp, 
    Share2, 
    Bookmark,
    ChevronRight,
    BookOpen,
    Info,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { format } from 'date-fns';

interface WikiNodeReaderProps {
    isOpen: boolean;
    onClose: () => void;
    node: WikiNode | null;
    isAdmin: boolean;
    onEdit: () => void;
}

const WikiNodeReader: React.FC<WikiNodeReaderProps> = (props) => {
    return (
        <AnimatePresence>
            {props.isOpen && props.node && <WikiNodeReaderModal {...props} />}
        </AnimatePresence>
    );
};

const WikiNodeReaderModal: React.FC<WikiNodeReaderProps> = ({ onClose, node, isAdmin, onEdit }) => {
    const [showBackToTop, setShowBackToTop] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    const { scrollYProgress } = useScroll({
        container: scrollContainerRef
    });
    
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    useEffect(() => {
        const handleScroll = () => {
            if (scrollContainerRef.current) {
                setShowBackToTop(scrollContainerRef.current.scrollTop > 400);
            }
        };
        
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
        }
        return () => container?.removeEventListener('scroll', handleScroll);
    }, []);

    if (!node) return null;

    const scrollToTop = () => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-full max-w-5xl bg-white/80 backdrop-blur-2xl rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-full border border-white/60 isolate"
            >
                {/* Reading Progress Bar (Apple/Google Hybrid) */}
                <motion.div 
                    className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 z-[60] origin-left"
                    style={{ scaleX }}
                />

                {/* Sticky Header (Apple Glassmorphism) */}
                <div className="px-10 py-8 border-b border-white/40 flex items-center justify-between shrink-0 bg-white/40 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center gap-6">
                        <motion.div 
                            whileHover={{ rotate: 10, scale: 1.1 }}
                            className="p-4 rounded-[1.8rem] bg-gradient-to-br from-indigo-400 to-purple-500 text-white shadow-xl border border-white/40"
                        >
                            <FileText className="w-8 h-8" />
                        </motion.div>
                        <div className="min-w-0">
                            <h3 className="text-3xl font-bold text-slate-800 tracking-tight truncate max-w-md">
                                {node.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-white/60 rounded-full border border-white/80 text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
                                    <BookOpen className="w-3 h-3 text-indigo-400" /> Handbook Page
                                </span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                                    <Clock className="w-3.5 h-3.5" />
                                    Updated {format(new Date(node.updatedAt), 'MMM dd, yyyy')}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 mr-4">
                            <button className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-white/60 rounded-2xl transition-all active:scale-90">
                                <Share2 className="w-5 h-5" />
                            </button>
                            <button className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-white/60 rounded-2xl transition-all active:scale-90">
                                <Bookmark className="w-5 h-5" />
                            </button>
                        </div>

                        {isAdmin && (
                            <motion.button 
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onEdit}
                                className="flex items-center gap-2.5 px-6 py-3 bg-white/80 text-indigo-600 font-bold text-sm rounded-2xl hover:bg-white transition-all border border-indigo-100 shadow-sm"
                            >
                                <Edit3 className="w-5 h-5" /> Edit Page
                            </motion.button>
                        )}
                        
                        <button 
                            onClick={onClose} 
                            className="p-3.5 bg-slate-100/50 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 group"
                        >
                            <X className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </button>
                    </div>
                </div>

                {/* Body (Editorial Layout) */}
                <div 
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto p-12 md:p-20 scrollbar-thin scrollbar-thumb-slate-200/50 [mask-image:linear-gradient(to_bottom,transparent,black_40px)]"
                >
                    <div className="max-w-3xl mx-auto">
                        {/* Intro / Description Card (Google Style) */}
                        {node.description && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-16 p-10 bg-gradient-to-br from-slate-50 to-white rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group"
                            >
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-100/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                                <div className="flex items-start gap-6 relative z-10">
                                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100/50">
                                        <Info className="w-7 h-7 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-lg font-medium leading-relaxed italic">
                                            {node.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Main Content (HTML) */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="prose prose-slate prose-lg max-w-none markdown-body"
                            dangerouslySetInnerHTML={{ __html: node.content || '<p className="italic text-slate-400">ไม่มีเนื้อหาในหน้านี้</p>' }}
                        />

                        {/* End of Document (Apple Style) */}
                        <div className="mt-24 pt-12 border-t border-slate-100 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-800 mb-2">You\'re all caught up!</h4>
                            <p className="text-slate-400 font-medium text-sm max-w-xs">
                                This document was last verified on {format(new Date(node.updatedAt), 'MMMM d, yyyy')}
                            </p>
                            
                            <div className="mt-10 flex items-center gap-3">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                                            <UserIcon className="w-5 h-5 text-slate-400" />
                                        </div>
                                    ))}
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">Verified by Team Leaders</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back to Top FAB (Google Style) */}
                <AnimatePresence>
                    {showBackToTop && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.5, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5, y: 20 }}
                            onClick={scrollToTop}
                            className="absolute bottom-10 right-10 w-14 h-14 bg-indigo-500 text-white rounded-2xl shadow-[0_12px_24px_-8px_rgba(99,102,241,0.5)] flex items-center justify-center hover:bg-indigo-600 hover:shadow-[0_16px_32px_-8px_rgba(99,102,241,0.6)] transition-all z-[70] active:scale-90 border border-white/20"
                        >
                            <ArrowUp className="w-6 h-6" />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Footer (Minimal Apple Style) */}
                <div className="px-10 py-6 border-t border-white/40 bg-white/40 backdrop-blur-md flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] opacity-50">
                        <AlertCircle className="w-3 h-3" /> Internal HQ Document
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] opacity-50">Juijui Corp. © 2026</p>
                </div>
            </motion.div>
        </div>
    );
};

export default WikiNodeReader;

