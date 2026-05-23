
import React, { useState, useMemo } from 'react';
import { User } from '../../../types';
import { X, Search, History, UserX, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface InactiveCreatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    selectedIds: string[];
    onToggle: (id: string) => void;
}

const InactiveCreatorModal: React.FC<InactiveCreatorModalProps> = ({
    isOpen,
    onClose,
    users,
    selectedIds,
    onToggle
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [displayLimit, setDisplayLimit] = useState(5);

    const inactiveUsers = useMemo(() => {
        return users
            .filter(u => !u.isActive)
            .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.position.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [users, searchQuery]);

    const groupedUsers = useMemo(() => {
        const groups: { [key: string]: User[] } = {};
        const limitedUsers = inactiveUsers.slice(0, displayLimit);
        
        limitedUsers.forEach(u => {
            const pos = u.position || 'Other';
            if (!groups[pos]) groups[pos] = [];
            groups[pos].push(u);
        });
        return groups;
    }, [inactiveUsers, displayLimit]);

    const hasMore = inactiveUsers.length > displayLimit;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 sm:p-6">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border-4 border-white ring-1 ring-black/5"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                            <div className="relative z-10 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-bold flex items-center gap-3">
                                        <History className="w-6 h-6 text-indigo-400" />
                                        อดีตทีมงาน (Ex-Staff)
                                    </h3>
                                    <p className="text-slate-400 text-sm font-medium mt-1">ค้นหาและกรองสคริปต์จากสมาชิกที่ลาออกไปแล้ว</p>
                                </div>
                                <button 
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input 
                                    type="text"
                                    placeholder="ค้นหาชื่อ หรือ ตำแหน่ง..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all font-bold text-slate-700 shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            {Object.keys(groupedUsers).length > 0 ? (
                                Object.entries(groupedUsers).map(([position, users]) => (
                                    <div key={position} className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-px flex-1 bg-slate-100" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-2">{position}</span>
                                            <div className="h-px flex-1 bg-slate-100" />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {users.map(user => {
                                                const isSelected = selectedIds.includes(user.id);
                                                return (
                                                    <motion.button
                                                        key={user.id}
                                                        whileHover={{ scale: 1.02, y: -2 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => onToggle(user.id)}
                                                        className={`
                                                            flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 text-left
                                                            ${isSelected 
                                                                ? 'bg-indigo-50 border-indigo-200 shadow-md shadow-indigo-100' 
                                                                : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100'
                                                            }
                                                        `}
                                                    >
                                                        <div className="relative">
                                                            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${isSelected ? 'border-indigo-400' : 'border-white'} shadow-sm bg-slate-100 grayscale`}>
                                                                {user.avatarUrl ? (
                                                                    <img 
                                                                        src={user.avatarUrl} 
                                                                        alt={user.name} 
                                                                        className="w-full h-full object-cover opacity-80"
                                                                        referrerPolicy="no-referrer"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-slate-300 text-slate-500 font-bold">
                                                                        {user.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {isSelected && (
                                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`font-bold text-sm truncate ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                                {user.name}
                                                            </div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                {user.position}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className={`
                                                            w-8 h-8 rounded-xl flex items-center justify-center transition-colors
                                                            ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-300'}
                                                        `}>
                                                            {isSelected ? <X className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <UserX className="w-10 h-10 text-slate-200" />
                                    </div>
                                    <h4 className="text-slate-400 font-black">ไม่พบรายชื่อที่ค้นหา</h4>
                                    <p className="text-slate-300 text-xs mt-1">ลองเปลี่ยนคำค้นหา หรือตำแหน่งดูครับ</p>
                                </div>
                            )}

                            {/* Load More */}
                            {hasMore && (
                                <div className="pt-4 flex justify-center">
                                    <button
                                        onClick={() => setDisplayLimit(prev => prev + 5)}
                                        className="flex items-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs rounded-2xl border border-slate-200 transition-all active:scale-95"
                                    >
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        ดูเพิ่มเติม ({inactiveUsers.length - displayLimit})
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Selected: <span className="text-indigo-500">{selectedIds.filter(id => users.find(u => u.id === id && !u.isActive)).length}</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-slate-900 text-white font-bold text-xs rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
                            >
                                ตกลง (DONE)
                            </button>
                        </div>
                    </motion.div>

                    <style>{`
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 6px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: #e2e8f0;
                            border-radius: 10px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: #cbd5e1;
                        }
                    `}</style>
                </div>
            )}
        </AnimatePresence>
    );

    if (typeof document === 'undefined') return null;
    const portalRoot = document.getElementById('portal-root') || document.body;
    return createPortal(modalContent, portalRoot);
};

export default InactiveCreatorModal;
