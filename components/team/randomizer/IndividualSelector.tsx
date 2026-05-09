
import React, { useState } from 'react';
import { User } from '../../../types';
import { Trash2, Users, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface IndividualSelectorProps {
    users: User[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    onClear: () => void;
    disabled?: boolean;
}

const IndividualSelector: React.FC<IndividualSelectorProps> = ({
    users,
    selectedIds,
    onToggle,
    onClear,
    disabled = false
}) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const unselectedUsers = users.filter(u => !selectedIds.includes(u.id));
    const selectedUsers = users.filter(u => selectedIds.includes(u.id));

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    เลือกรายบุคคล (Optional) 👤
                </label>
                {selectedIds.length > 0 && (
                    <button
                        onClick={onClear}
                        disabled={disabled}
                        className="text-[12px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                    >
                        <Trash2 className="w-3 h-3" /> ล้างทั้งหมด ({selectedIds.length})
                    </button>
                )}
            </div>

            <div className="bg-slate-50/50 rounded-[2rem] p-6 border-2 border-dashed border-slate-200 min-h-[120px] flex flex-col gap-6">
                {/* Unselected Pool */}
                <div className="space-y-2">
                    <div className="text-[14px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Plus className="w-3 h-3" /> คลิกเพื่อเพิ่มเข้ากลุ่มสุ่ม
                    </div>
                    <div 
                        className="flex flex-wrap gap-2"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <AnimatePresence mode="popLayout">
                            {unselectedUsers.map((user) => (
                                <motion.button
                                    key={user.id}
                                    layoutId={`user-${user.id}`}
                                    onClick={() => !disabled && onToggle(user.id)}
                                    disabled={disabled}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="relative group shrink-0"
                                    title={user.name}
                                >
                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-white ring-1 ring-black/5 grayscale hover:grayscale-0 transition-all">
                                        {user.avatarUrl ? (
                                            <img 
                                                src={user.avatarUrl} 
                                                alt={user.name}
                                                className="w-full h-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 font-black text-xs">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus className="w-2 h-2" />
                                    </div>
                                </motion.button>
                            ))}
                        </AnimatePresence>
                        {unselectedUsers.length === 0 && selectedIds.length === 0 && (
                            <div className="text-xs text-slate-400 font-medium italic">ไม่มีสมาชิกให้เลือก</div>
                        )}
                        {unselectedUsers.length === 0 && selectedIds.length > 0 && (
                            <div className="text-xs text-indigo-500 font-black italic">เลือกครบทุกคนแล้ว! ✨</div>
                        )}
                    </div>
                </div>

                {/* Selected Pool */}
                {selectedUsers.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-slate-200/50">
                        <div className="text-[12px] font-medium text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                            <Check className="w-3 h-3" /> สมาชิกที่จะถูกสุ่ม ({selectedUsers.length})
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <AnimatePresence mode="popLayout">
                                {selectedUsers.map((user) => (
                                    <motion.button
                                        key={user.id}
                                        layoutId={`user-${user.id}`}
                                        onClick={() => !disabled && onToggle(user.id)}
                                        disabled={disabled}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="relative group shrink-0"
                                        title={user.name}
                                    >
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-400 shadow-md bg-white p-0.5 ring-2 ring-indigo-100">
                                            <div className="w-full h-full rounded-full overflow-hidden">
                                                {user.avatarUrl ? (
                                                    <img 
                                                        src={user.avatarUrl} 
                                                        alt={user.name}
                                                        className="w-full h-full object-cover"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold text-sm">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-2.5 h-2.5" />
                                        </div>
                                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[12px] font-medium text-indigo-600 uppercase tracking-tighter whitespace-nowrap">
                                            {user.name.split(' ')[0]}
                                        </div>
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IndividualSelector;
