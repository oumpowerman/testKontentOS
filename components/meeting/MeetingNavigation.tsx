import React from 'react';
import { BookOpen, CheckSquare, Share2, ListChecks, Paperclip } from 'lucide-react';
import MeetingTimer from './MeetingTimer';
import { motion } from 'framer-motion';

type MeetingTab = 'AGENDA' | 'NOTES' | 'FILES' | 'ACTIONS' | 'DECISIONS';

interface MeetingNavigationProps {
    activeTab: MeetingTab;
    setActiveTab: (tab: MeetingTab) => void;
}

const TABS = [
    { id: 'AGENDA', label: 'วาระ', icon: ListChecks, color: 'amber', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-500', shadow: 'shadow-amber-100' },
    { id: 'NOTES', label: 'บันทึก', icon: BookOpen, color: 'indigo', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-500', shadow: 'shadow-indigo-100' },
    { id: 'FILES', label: 'ไฟล์', icon: Paperclip, color: 'blue', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-500', shadow: 'shadow-blue-100' },
    { id: 'ACTIONS', label: 'สั่งงาน', icon: CheckSquare, color: 'orange', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-500', shadow: 'shadow-orange-100' },
    { id: 'DECISIONS', label: 'มติ', icon: Share2, color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500', shadow: 'shadow-emerald-100' }
];

const MeetingNavigation: React.FC<MeetingNavigationProps> = React.memo(({ activeTab, setActiveTab }) => {
    const activeTheme = TABS.find(t => t.id === activeTab) || TABS[1];

    return (
        <div className="px-3 md:px-6 pt-2 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex gap-1 md:gap-2 relative">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    
                    return (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as MeetingTab)}
                            className={`
                                relative pb-3 pt-2 px-2.5 md:px-4 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 rounded-t-2xl group shrink-0
                                ${isActive ? tab.text : 'text-slate-400 hover:text-slate-600'}
                            `}
                        >
                            {/* Background Slide Effect */}
                            {isActive && (
                                <motion.div 
                                    layoutId="activeTabBg"
                                    className={`absolute inset-0 ${tab.bg} rounded-t-2xl -z-10`}
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}

                            {/* Underline Slide Effect */}
                            {isActive && (
                                <motion.div 
                                    layoutId="activeTabUnderline"
                                    className={`absolute bottom-0 left-0 right-0 h-1 ${tab.bg.replace('bg-', 'bg-').replace('50', '500')} rounded-t-full`}
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}

                            <tab.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform duration-300 ${isActive ? 'scale-110 stroke-[2.5px]' : 'group-hover:scale-110'}`} /> 
                            <span className={`${isActive ? 'inline' : 'hidden sm:inline'}`}>{tab.label}</span>

                            {/* Glow effect for active tab */}
                            {isActive && (
                                <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-1 ${tab.bg.replace('bg-', 'bg-').replace('50', '400')} blur-sm opacity-50`}></div>
                            )}
                        </button>
                    );
                })}
            </div>
            
            <div className="flex items-center gap-4 ml-4 shrink-0">
                <div className={`hidden lg:flex items-center gap-2 px-3 py-1 rounded-full border ${activeTheme.bg} ${activeTheme.text} ${activeTheme.border.replace('border-', 'border-').replace('500', '100')} text-[9px] font-black uppercase tracking-tighter animate-in fade-in zoom-in duration-500`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTheme.bg.replace('bg-', 'bg-').replace('50', '500')} animate-pulse`}></div>
                    {activeTheme.label} Mode
                </div>
                <div className="hidden xs:block">
                    <MeetingTimer />
                </div>
            </div>
        </div>
    );
});

export default MeetingNavigation;