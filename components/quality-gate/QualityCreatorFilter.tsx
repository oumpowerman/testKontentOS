
import React, { useState } from 'react';
import { User } from '../../types';
import { Trash2, Users, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QualityCreatorFilterProps {
    users: User[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    onClear: () => void;
}

const QualityCreatorFilter: React.FC<QualityCreatorFilterProps> = ({
    users,
    selectedIds,
    onToggle,
    onClear
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Sort users so that positions containing "Creative" come first
    const sortedUsers = [...users].sort((a, b) => {
        const aHasCreative = a.position ? a.position.toLowerCase().includes('creative') : false;
        const bHasCreative = b.position ? b.position.toLowerCase().includes('creative') : false;
        
        if (aHasCreative && !bHasCreative) return -1;
        if (!aHasCreative && bHasCreative) return 1;
        
        // Secondary sort by name for consistent ordering
        return a.name.localeCompare(b.name, 'th');
    });

    const activeUsers = sortedUsers.filter(u => u.isActive);
    const unselectedUsers = activeUsers.filter(u => !selectedIds.includes(u.id));
    const selectedUsers = activeUsers.filter(u => selectedIds.includes(u.id));

    // Logic for +N
    const LIMIT = 8;
    const showPlusN = !isExpanded && unselectedUsers.length > LIMIT;
    const displayedUnselected = showPlusN ? unselectedUsers.slice(0, LIMIT - 1) : unselectedUsers;
    const hiddenCount = unselectedUsers.length - (LIMIT - 1);

    return (
        <div className="flex items-center gap-4 w-full py-2 overflow-x-auto no-scrollbar">
            <style>{`
                .selected-glow-indigo-strong {
                    box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {/* Left Side: Unselected Stack */}
            <div className="flex items-center gap-3 shrink-0">
                <button
                    onClick={selectedIds.length > 0 ? onClear : undefined}
                    disabled={selectedIds.length === 0}
                    className={`
                        text-[10px] font-black uppercase tracking-widest shrink-0 flex items-center justify-center px-4 py-2.5 rounded-xl border transition-all duration-500 min-w-[120px] select-none
                        ${selectedIds.length > 0
                            ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700 cursor-pointer active:scale-95 shadow-lg shadow-indigo-500/20'
                            : 'bg-white/5 text-indigo-400/40 border-white/5 cursor-default'
                        }
                    `}
                >
                    {selectedIds.length > 0 ? (
                        <><Trash2 className="w-3.5 h-3.5 mr-2 animate-pulse" /> Clear ({selectedIds.length})</>
                    ) : (
                        <><Users className="w-3.5 h-3.5 mr-2 opacity-80" /> Team</>
                    )}
                </button>

                <motion.div 
                    layout
                    className="flex items-center"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {displayedUnselected.map((user, index) => (
                        <motion.button
                            key={user.id}
                            layoutId={`q-creator-${user.id}`}
                            onClick={() => onToggle(user.id)}
                            className="relative group/item shrink-0"
                            title={user.name}
                            animate={{
                                marginLeft: (isHovered || isExpanded || index === 0) ? 4 : -20,
                                zIndex: (isHovered || isExpanded) ? 10 : displayedUnselected.length - index,
                                filter: (isHovered || isExpanded) ? 'grayscale(0%) brightness(1)' : 'grayscale(100%) brightness(0.6)',
                                opacity: (isHovered || isExpanded) ? 1 : 0.7,
                                scale: (isHovered || isExpanded) ? 1.05 : 1,
                            }}
                            whileHover={{ 
                                scale: 1.2, 
                                y: -4, 
                                zIndex: 50,
                                filter: 'grayscale(0%) brightness(1.2)',
                                marginLeft: 8,
                                marginRight: 8
                            }}
                            transition={{ 
                                type: "spring", 
                                stiffness: 400, 
                                damping: 25
                            }}
                        >
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 shadow-xl bg-slate-800 ring-1 ring-white/5">
                              {user.avatarUrl ? (
                                <img 
                                  src={user.avatarUrl} 
                                  alt={user.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-black text-xs">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                        </motion.button>
                    ))}

                    {showPlusN && (
                        <motion.button
                            key="plus-n"
                            layout
                            onClick={() => setIsExpanded(true)}
                            className="w-10 h-10 rounded-full bg-white/5 border-2 border-dashed border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-[10px] shadow-lg hover:bg-white/10 transition-colors z-10 shrink-0 ml-1"
                        >
                            +{hiddenCount}
                        </motion.button>
                    )}
                </motion.div>
            </div>

            {/* Divider */}
            <AnimatePresence>
                {selectedUsers.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, width: 0 }}
                        animate={{ opacity: 1, scale: 1, width: 'auto' }}
                        exit={{ opacity: 0, scale: 0.8, width: 0 }}
                        className="flex items-center px-2 overflow-hidden"
                    >
                        <div className="w-8 h-px bg-indigo-500/20 mx-2"></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Right Side: Selected */}
            <motion.div layout className="flex items-center gap-2.5">
                {selectedUsers.map((user) => (
                    <motion.button
                        key={user.id}
                        layoutId={`q-creator-${user.id}`}
                        onClick={() => onToggle(user.id)}
                        className="relative group/selected shrink-0"
                        animate={{ 
                            scale: 1,
                            filter: 'grayscale(0%) brightness(1)',
                            opacity: 1
                        }}
                        whileHover={{ scale: 1.1, y: -2 }}
                    >
                        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-indigo-500 shadow-2xl selected-glow-indigo-strong bg-slate-900 p-0.5">
                            <div className="w-full h-full rounded-full overflow-hidden relative">
                              {user.avatarUrl ? (
                                <img 
                                  src={user.avatarUrl} 
                                  alt={user.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-black text-sm">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                                <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover/selected:opacity-100 transition-opacity flex items-center justify-center">
                                    <Trash2 className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-black text-indigo-300 uppercase tracking-tighter whitespace-nowrap bg-black/40 px-1.5 py-0.5 rounded-md backdrop-blur-sm border border-white/5">
                            {user.name.split(' ')[0]}
                        </div>
                    </motion.button>
                ))}
            </motion.div>
        </div>
    );
};

export default QualityCreatorFilter;
