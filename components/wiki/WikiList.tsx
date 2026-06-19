
import React, { useState } from 'react';
import { Search, Menu, Plus, Pin, Book, Clock, Star, Zap, Shield, HelpCircle, Layers, LayoutList, LayoutGrid, User, Sparkles } from 'lucide-react';
import { WikiArticle, MasterOption } from '../../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';

interface WikiListProps {
    articles: WikiArticle[];
    categories: MasterOption[];
    selectedCategory: string;
    onSelectCategory: (key: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    viewingArticleId: string | undefined;
    onSelectArticle: (article: WikiArticle) => void;
    onCreate: () => void;
    isSidebarOpen: boolean;
    onOpenSidebar: () => void;
    isMobileListVisible: boolean;
}

// Draggable Wrapper Component
const DraggableArticle = React.forwardRef<HTMLDivElement, { 
    article: WikiArticle; 
    children: React.ReactNode;
    isActive: boolean;
}>(({ article, children, isActive }, ref) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: article.id,
        data: { article }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 100 : 1,
    } : undefined;

    // Combine refs
    const setRefs = (node: HTMLDivElement | null) => {
        setNodeRef(node);
        if (typeof ref === 'function') {
            ref(node);
        } else if (ref) {
            ref.current = node;
        }
    };

    return (
        <div 
            ref={setRefs} 
            style={style} 
            {...listeners} 
            {...attributes}
            className={`transition-opacity ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
            {children}
        </div>
    );
});

DraggableArticle.displayName = 'DraggableArticle';

// Playful Icons Map
const CATEGORY_ICONS: Record<string, any> = {
    'GENERAL': Star,
    'RULES': Shield,
    'TOOLS': Zap,
    'ONBOARDING': HelpCircle,
    'WORKFLOW': Layers,
};

const WikiList: React.FC<WikiListProps> = ({
    articles, categories, selectedCategory, onSelectCategory,
    searchQuery, setSearchQuery, viewingArticleId, onSelectArticle, onCreate,
    isSidebarOpen, onOpenSidebar, isMobileListVisible
}) => {
    // Density State
    const [viewDensity, setViewDensity] = useState<'COMFORTABLE' | 'COMPACT'>('COMFORTABLE');

    return (
        <div className="flex flex-col h-full w-full bg-white/20 backdrop-blur-sm relative overflow-hidden">
            {/* Background Glows for the list area */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-200/20 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute top-1/2 -right-20 w-64 h-64 bg-pink-200/10 rounded-full blur-[80px] pointer-events-none"></div>

            {/* Header Area */}
            <div className="p-6 border-b border-white/40 bg-white/40 backdrop-blur-xl sticky top-0 z-20 space-y-5 shrink-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                         {!isSidebarOpen && (
                             <motion.button 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                onClick={onOpenSidebar} 
                                className="hidden lg:flex p-2.5 hover:bg-white/80 rounded-2xl text-slate-500 transition-all active:scale-95 border border-white/80 shadow-sm bg-white/40"
                             >
                                <Menu className="w-5 h-5" />
                             </motion.button>
                         )}
                         <div className="flex flex-col">
                            <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                                บทความ 
                                <span className="bg-indigo-500 text-white text-[20px] font-medium px-3 py-1 rounded-full shadow-[0_4px_12px_-2px_rgba(99,102,241,0.4)] border border-white/20">
                                    {articles.length}
                                </span>
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 opacity-70">Knowledge Base</p>
                         </div>
                    </div>
                    <div className="flex items-center gap-3">
                         {/* Density Toggle */}
                         <div className="hidden md:flex bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/80 shadow-inner">
                             <button 
                                 onClick={() => setViewDensity('COMFORTABLE')}
                                 className={`p-2 rounded-xl transition-all duration-300 ${viewDensity === 'COMFORTABLE' ? 'bg-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)] text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                 title="Card View"
                             >
                                 <LayoutGrid className="w-4 h-4" />
                             </button>
                             <button 
                                 onClick={() => setViewDensity('COMPACT')}
                                 className={`p-2 rounded-xl transition-all duration-300 ${viewDensity === 'COMPACT' ? 'bg-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)] text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                 title="Compact View"
                             >
                                 <LayoutList className="w-4 h-4" />
                             </button>
                         </div>
                         
                         <motion.button 
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onCreate} 
                            className="relative group overflow-hidden p-3 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white rounded-2xl shadow-[0_12px_24px_-8px_rgba(99,102,241,0.5)] border border-white/20"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            <Plus className="w-6 h-6 stroke-[3px] relative z-10" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full border-2 border-white animate-pulse shadow-sm"></div>
                        </motion.button>
                    </div>
                </div>
                
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-all duration-300 group-focus-within:scale-110" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาบทความที่คุณต้องการ..." 
                        className="w-full pl-12 pr-4 py-3.5 bg-white/60 backdrop-blur-md border border-white/80 focus:bg-white focus:border-indigo-300 focus:shadow-[0_12px_32px_-8px_rgba(99,102,241,0.1)] rounded-[1.25rem] text-sm outline-none transition-all font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-400 shadow-inner"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Mobile Category Dropdown (Sticker Style) */}
                <div className="lg:hidden flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                    <button 
                        onClick={() => onSelectCategory('ALL')} 
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all duration-300 ${selectedCategory === 'ALL' ? 'bg-slate-800 text-white border-slate-800 shadow-lg scale-105' : 'bg-white/60 border-white/80 text-slate-500 hover:bg-white'}`}
                    >
                        ALL
                    </button>
                    {categories.map(c => (
                        <button 
                            key={c.key} 
                            onClick={() => onSelectCategory(c.key)} 
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all duration-300 ${selectedCategory === c.key ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg scale-105' : 'bg-white/60 border-white/80 text-slate-500 hover:bg-white'}`}
                        >
                            {c.label.split('(')[0]}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto bg-transparent scrollbar-thin scrollbar-thumb-slate-200/50 relative z-10 [mask-image:linear-gradient(to_bottom,transparent,black_40px)]">
                <div className={`p-6 ${viewDensity === 'COMPACT' ? 'space-y-3' : 'space-y-6'}`}>
                    <AnimatePresence mode="popLayout">
                        {articles.map((article, index) => {
                            const isActive = viewingArticleId === article.id;
                            const category = categories.find(c => c.key === article.category);
                            const colorKey = category?.color?.split(' ')[0].replace('bg-', '') || 'slate';
                            const Icon = CATEGORY_ICONS[article.category] || Book;

                            if (viewDensity === 'COMPACT') {
                                return (
                                    <DraggableArticle key={article.id} article={article} isActive={isActive}>
                                        <motion.div 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: index * 0.03 }}
                                            onClick={() => onSelectArticle(article)}
                                            className={`
                                                flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 group relative overflow-hidden
                                                ${isActive 
                                                    ? 'bg-white shadow-[0_12px_32px_-8px_rgba(99,102,241,0.2)] border-indigo-200 ring-1 ring-white/60 translate-x-2' 
                                                    : 'bg-white/50 backdrop-blur-sm border-white/80 hover:bg-white/80 hover:border-indigo-100 hover:shadow-lg hover:translate-x-2'}
                                            `}
                                        >
                                            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
                                            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-${colorKey}-100/80 text-${colorKey}-600 border border-white/80 shadow-sm group-hover:scale-110 transition-transform`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {article.isPinned && <Pin className="w-3 h-3 text-orange-500 fill-orange-500 animate-pulse" />}
                                                    <h4 className={`text-sm font-bold truncate ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>{article.title}</h4>
                                                </div>
                                                <p className="text-[10px] text-slate-400 flex items-center gap-2 mt-1 font-bold uppercase tracking-wider opacity-70">
                                                    <span>{format(article.lastUpdated, 'd MMM')}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {article.lastEditor?.name.split(' ')[0] || 'Unknown'}</span>
                                                </p>
                                            </div>
                                        </motion.div>
                                    </DraggableArticle>
                                );
                            }

                            // COMFORTABLE VIEW
                            return (
                                <DraggableArticle key={article.id} article={article} isActive={isActive}>
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => onSelectArticle(article)}
                                        className={`
                                            p-7 rounded-[2.75rem] border border-white/80 cursor-pointer transition-all duration-500 group relative flex flex-col gap-5 overflow-hidden isolate
                                            ${isActive 
                                                ? 'bg-white shadow-[0_40px_80px_-20px_rgba(99,102,241,0.2)] border-indigo-200 ring-4 ring-indigo-50/50 z-10 transform scale-[1.02] -translate-y-1.5' 
                                                : 'bg-white/70 backdrop-blur-md hover:bg-white/90 hover:border-indigo-100 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-2.5'}
                                        `}
                                    >
                                        {/* Decorative Background Glow */}
                                        <div className={`absolute -top-12 -right-12 w-40 h-40 bg-${colorKey}-400/10 rounded-full blur-3xl pointer-events-none group-hover:bg-${colorKey}-400/20 transition-all duration-700`}></div>
                                        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-400/5 rounded-full blur-3xl pointer-events-none"></div>

                                        {/* Sticker Header */}
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className={`
                                                flex items-center gap-2.5 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border
                                                bg-${colorKey}-100/90 text-${colorKey}-600 border-white/80 shadow-sm backdrop-blur-md group-hover:scale-105 transition-transform
                                            `}>
                                                <Icon className="w-4 h-4" />
                                                {category?.label.split('(')[0] || article.category}
                                            </div>
                                            {article.isPinned && (
                                                <motion.div 
                                                    animate={{ rotate: [12, 15, 12] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="bg-gradient-to-br from-yellow-300 to-orange-400 p-2.5 rounded-2xl text-white border-2 border-white rotate-12 shadow-[0_8px_16px_-4px_rgba(251,191,36,0.4)]"
                                                >
                                                    <Pin className="w-4 h-4 fill-white" />
                                                </motion.div>
                                            )}
                                        </div>

                                        <div className="space-y-2.5 relative z-10">
                                            <h3 className={`font-bold text-xl leading-tight line-clamp-2 transition-all duration-300 ${isActive ? 'text-indigo-900' : 'text-slate-800 group-hover:text-indigo-600'}`}>
                                                {article.title}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1 w-12 bg-indigo-500/20 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 w-0 group-hover:w-full transition-all duration-700"></div>
                                                </div>
                                                <Sparkles className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between mt-2 pt-5 border-t border-dashed border-slate-200/60 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    {article.lastEditor?.avatarUrl ? (
                                                        <img src={article.lastEditor.avatarUrl} className="w-8 h-8 rounded-xl border-2 border-white shadow-md group-hover:rotate-6 transition-transform" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400 border border-white/80 shadow-sm"><User className="w-4 h-4"/></div>
                                                    )}
                                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm"></div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider leading-none mb-1">Editor</span>
                                                    <span className="text-xs font-bold text-slate-700 tracking-tight truncate max-w-[100px]">
                                                        {article.lastEditor?.name || 'Unknown'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1 opacity-70">Last Updated</span>
                                                <span className="text-[10px] text-indigo-500 font-black bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm flex items-center">
                                                    <Clock className="w-3.5 h-3.5 mr-1.5" /> {format(article.lastUpdated, 'd MMM')}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </DraggableArticle>
                            );
                        })}
                    </AnimatePresence>
                    
                    {articles.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-96 text-slate-400 animate-in zoom-in-95 duration-700">
                            <motion.div 
                                animate={{ y: [0, -10, 0], rotate: [3, -3, 3] }}
                                transition={{ repeat: Infinity, duration: 4 }}
                                className="w-32 h-32 bg-white/80 backdrop-blur-md rounded-[3rem] flex items-center justify-center mb-8 relative shadow-2xl border border-white/80"
                            >
                                <Book className="w-16 h-16 opacity-10 text-indigo-500" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Search className="w-10 h-10 text-slate-200 animate-pulse" />
                                </div>
                                <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-pink-300 to-rose-400 rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                                    <Plus className="w-6 h-6 text-white" />
                                </div>
                            </motion.div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">ไม่พบบทความ</h3>
                            <p className="text-sm mt-3 text-slate-400 font-bold max-w-[200px] text-center leading-relaxed">ลองเปลี่ยนคำค้นหา หรือสร้างบทความใหม่เพื่อเติมเต็มคลังความรู้ ✨</p>
                            
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onCreate}
                                className="mt-8 px-8 py-3.5 bg-indigo-500 text-white font-black text-xs rounded-2xl shadow-lg hover:shadow-indigo-200 transition-all"
                            >
                                + สร้างบทความแรก
                            </motion.button>
                        </div>
                    )}
                    <div className="h-20"></div>
                </div>
            </div>
        </div>
    );
};

export default WikiList;
