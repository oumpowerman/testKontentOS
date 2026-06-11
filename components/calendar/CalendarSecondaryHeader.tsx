import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Inbox, Package, Eye, Wrench, Check, Plus, X, Ban
} from 'lucide-react';
import NotificationBellBtn from '../NotificationBellBtn';
import { COLOR_THEMES } from '../../constants';
import { ChipConfig, Channel, User } from '../../types';

interface CalendarSecondaryHeaderProps {
    show: boolean;
    onClose: () => void;
    
    // Filters logic
    activeChipIds: string[];
    toggleChip: (id: string) => void;
    customChips: ChipConfig[];
    channels: Channel[];
    users?: User[];
    onManageFilters: () => void;
    
    // Tools logic
    unreadCount: number;
    onOpenNotifications?: () => void;
    onOpenSettings: () => void;
    onToggleWorkbox?: () => void;
    onToggleStock: () => void;
    isWorkboxOpen: boolean;
    isStockOpen: boolean;
    
    // Layout logic
    taskDisplayMode: 'MINIMAL' | 'DOT' | 'EMOJI' | 'FULL';
    setTaskDisplayMode: (mode: 'MINIMAL' | 'DOT' | 'EMOJI' | 'FULL') => void;
    isExpanded?: boolean;
}

const CalendarSecondaryHeader: React.FC<CalendarSecondaryHeaderProps> = ({
    show, onClose,
    activeChipIds, toggleChip, customChips, channels, users = [], onManageFilters,
    unreadCount, onOpenNotifications, onOpenSettings, onToggleWorkbox, onToggleStock,
    isWorkboxOpen, isStockOpen,
    taskDisplayMode, setTaskDisplayMode,
    isExpanded = false
}) => {
    const [isViewMenuOpen, setIsViewMenuOpen] = React.useState(false);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                        height: { type: 'spring', stiffness: 180, damping: 25, mass: 0.8 },
                        opacity: { duration: 0.25, ease: 'easeInOut' }
                    }}
                    className={`
                        z-30 overflow-hidden
                        ${isExpanded 
                            ? 'bg-transparent border-t border-slate-100/60' 
                            : 'bg-white/80 backdrop-blur-2xl border-x border-b border-white/60 rounded-b-[2.5rem] -mt-1'
                        }
                    `}
                >
                    <div className="max-w-[1920px] mx-auto px-4 lg:px-8 py-5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            
                            {/* --- FILTERS SECTION --- */}
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 mask-fade-right flex-1">
                                    <button
                                        onClick={() => toggleChip('ALL')}
                                        className={`
                                            px-4 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap shadow-sm border shrink-0 active:scale-95
                                            ${activeChipIds.length === 0
                                                ? 'bg-slate-800 text-white border-slate-800 ring-2 ring-slate-100' 
                                                : 'bg-white text-slate-500 border-gray-200 hover:border-indigo-200'}
                                        `}
                                    >
                                        ทั้งหมด
                                    </button>

                                    {customChips.map((chip) => {
                                        const theme = COLOR_THEMES.find(t => t.id === chip.colorTheme) || COLOR_THEMES[0];
                                        const isActive = activeChipIds.includes(chip.id);
                                        const isExclude = chip.mode === 'EXCLUDE';
                                        
                                        let channelLogo = null;
                                        let chColor = (theme as any).hex || '#fff';
                                        let isAssignee = false;
                                        if (chip.type === 'CHANNEL') {
                                            const ch = channels.find(c => c.id === chip.value);
                                            if (ch?.logoUrl) {
                                                channelLogo = ch.logoUrl;
                                                if (ch.color && ch.color !== '#000000' && ch.color !== '#000') {
                                                    chColor = ch.color;
                                                }
                                            }
                                        } else if (chip.type === 'ASSIGNEE') {
                                            isAssignee = true;
                                            const u = users.find(user => user.id === chip.value);
                                            if (u?.avatarUrl) {
                                                channelLogo = u.avatarUrl;
                                            }
                                            chColor = '#6366f1';
                                        }

                                        const isLogoChip = !!channelLogo;
                                        const baseClasses = isLogoChip
                                            ? (isActive 
                                                ? 'bg-transparent border-transparent shadow-none' 
                                                : 'bg-transparent border-transparent shadow-none opacity-60 hover:opacity-100')
                                            : (isExclude 
                                                ? (isActive 
                                                    ? 'bg-red-500 text-white border-red-500 shadow-md ring-2 ring-offset-2 ring-red-100' 
                                                    : 'bg-white text-red-500 border-red-100 hover:bg-red-50 hover:border-red-200')
                                                : (isActive 
                                                    ? `${theme.activeBg} text-white border-transparent shadow-lg ring-2 ring-offset-2 ring-transparent` 
                                                    : `bg-white ${theme.text} border-gray-200 hover:border-${theme.id}-200 hover:-translate-y-0.5`));

                                        return (
                                            <button
                                                key={chip.id}
                                                onClick={() => toggleChip(chip.id)}
                                                className={`
                                                    ${isLogoChip ? 'p-1' : 'px-4 py-2'} rounded-full text-[10px] font-black transition-all whitespace-nowrap shrink-0 flex items-center gap-2 active:scale-95
                                                    ${baseClasses}
                                                    ${!isLogoChip ? 'shadow-sm border' : ''}
                                                    relative
                                                `}
                                            >
                                                {isExclude && <Ban className="w-3 h-3 stroke-[3px]" />}
                                                {channelLogo ? (
                                                    <div className="relative">
                                                        <img 
                                                            src={channelLogo} 
                                                            alt={chip.label} 
                                                            className={`w-9 h-9 rounded-full object-cover transition-all duration-500 ${isActive ? (isAssignee ? 'scale-110 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : 'scale-110') : 'hover:scale-105'}`}
                                                            style={{ 
                                                                filter: isActive 
                                                                    ? `drop-shadow(0 0 6px ${isAssignee ? '#6366f1' : chColor})`
                                                                    : 'none',
                                                                border: isActive ? `2px solid ${chColor}` : 'none'
                                                            }}
                                                            title={chip.label} 
                                                        />
                                                        {isActive && !isExclude && (
                                                            <div 
                                                                className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100"
                                                                style={{ color: chColor }}
                                                            >
                                                                <Check className="w-2.5 h-2.5 stroke-[4px]" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span>{chip.label.toUpperCase()}</span>
                                                )}
                                            </button>
                                        );
                                    })}

                                    <button 
                                        onClick={onManageFilters}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-slate-400 hover:text-indigo-600 transition-all shrink-0 active:scale-90"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* --- TOOLS SECTION --- */}
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="flex items-center gap-2 p-1.5 bg-white/90 rounded-[1.25rem] border border-gray-200 shadow-sm">
                                    {/* Notifications */}
                                    <NotificationBellBtn 
                                        onClick={onOpenNotifications || onOpenSettings}
                                        unreadCount={unreadCount}
                                    />

                                    {/* Workbox */}
                                    {onToggleWorkbox && (
                                        <button 
                                            onClick={onToggleWorkbox}
                                            className={`p-2.5 rounded-xl transition-all ${isWorkboxOpen ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-transparent text-slate-400 hover:text-indigo-600 hover:bg-slate-50'}`}
                                            title="Workbox"
                                        >
                                            <Inbox className="w-4 h-4" />
                                        </button>
                                    )}

                                    {/* Stock */}
                                    <button 
                                        onClick={onToggleStock}
                                        className={`p-2.5 rounded-xl transition-all ${isStockOpen ? 'bg-amber-500 text-white shadow-md shadow-amber-100' : 'bg-transparent text-slate-400 hover:text-amber-600 hover:bg-slate-50'}`}
                                        title="คลังงาน"
                                    >
                                        <Package className="w-4 h-4" />
                                    </button>

                                    <div className="w-px h-4 bg-gray-200 mx-1" />

                                    {/* Density Selector */}
                                    <div className="relative">
                                        <button 
                                            onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
                                            className={`p-2.5 rounded-xl transition-all ${isViewMenuOpen ? 'bg-sky-50 text-sky-600' : 'bg-transparent text-slate-400 hover:text-sky-600 hover:bg-slate-50'}`}
                                            title="Density"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        
                                        <AnimatePresence>
                                            {isViewMenuOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setIsViewMenuOpen(false)} />
                                                    <motion.div 
                                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                        className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 origin-top-right"
                                                    >
                                                        <p className="text-[10px] font-black text-slate-400 px-3 py-1.5 uppercase tracking-wider">Visual Density</p>
                                                        <div className="space-y-1">
                                                            {['MINIMAL', 'DOT', 'EMOJI', 'FULL'].map((mode) => (
                                                                <button
                                                                    key={mode}
                                                                    onClick={() => { setTaskDisplayMode(mode as any); setIsViewMenuOpen(false); }}
                                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black transition-all ${taskDisplayMode === mode ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                                                                >
                                                                    {mode}
                                                                    {taskDisplayMode === mode && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Settings */}
                                    <button 
                                        onClick={onOpenSettings}
                                        className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all"
                                        title="การตั้งค่า"
                                    >
                                        <Wrench className="w-4 h-4" />
                                    </button>
                                </div>

                                <button 
                                    onClick={onClose}
                                    className="w-11 h-11 flex items-center justify-center bg-white border border-gray-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-2xl transition-all active:scale-90 shadow-sm"
                                    title="ปิดเครื่องมือ"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CalendarSecondaryHeader;
