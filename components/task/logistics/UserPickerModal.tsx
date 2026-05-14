import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { User } from '../../../types';
import { X, Search, UserPlus, CheckCircle2 } from 'lucide-react';

interface UserPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    selectedUserId: string;
    onSelectUser: (userId: string) => void;
}

const UserPickerModal: React.FC<UserPickerModalProps> = ({ 
    isOpen, 
    onClose, 
    users, 
    selectedUserId, 
    onSelectUser 
}) => {
    const [assigneeSearch, setAssigneeSearch] = useState('');

    const activeUsers = useMemo(() => users.filter(u => u.isActive), [users]);

    const groupedUsers = useMemo(() => {
        const groups: Record<string, User[]> = {};
        const lowerQ = assigneeSearch.toLowerCase();
        
        const filtered = activeUsers.filter(u => 
            u.name.toLowerCase().includes(lowerQ) || 
            (u.position || '').toLowerCase().includes(lowerQ)
        );

        filtered.forEach(user => {
            const pos = user.position || 'Other';
            if (!groups[pos]) groups[pos] = [];
            groups[pos].push(user);
        });

        // Sort positions
        return Object.keys(groups).sort().reduce((obj, key) => {
            obj[key] = groups[key];
            return obj;
        }, {} as Record<string, User[]>);
    }, [activeUsers, assigneeSearch]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                onClick={onClose} 
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative border-4 border-white ring-1 ring-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 bg-white shrink-0">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-gray-900 text-xl flex items-center gap-3">
                                <span className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                                    <UserPlus className="w-5 h-5 text-white" />
                                </span>
                                เลือกผู้รับผิดชอบ
                            </h3>
                            <p className="text-xs font-bold text-gray-400 mt-1 ml-12 uppercase tracking-widest">Assign task to member</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-all active:scale-90"><X className="w-5 h-5"/></button>
                    </div>
                    
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อ หรือตำแหน่ง..." 
                            className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-2 border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/30 rounded-2xl text-sm font-bold outline-none transition-all placeholder:text-gray-300"
                            value={assigneeSearch}
                            onChange={e => setAssigneeSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Body with Sections */}
                <div className="flex-1 overflow-y-auto p-6 bg-white space-y-8 custom-scrollbar">
                    {/* None Option - Always show at top */}
                    {!assigneeSearch && (
                        <div className="mb-4">
                            <button
                                onClick={() => { onSelectUser(''); onClose(); }}
                                className={`
                                    w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 hover:shadow-lg
                                    ${!selectedUserId 
                                        ? 'bg-rose-50 border-rose-200 text-rose-600 ring-4 ring-rose-50' 
                                        : 'bg-white border-dashed border-gray-200 text-gray-400 hover:border-rose-200 hover:text-rose-500'}
                                `}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-colors ${!selectedUserId ? 'bg-white border-rose-500' : 'bg-gray-50 border-gray-100'}`}>
                                    <X className="w-6 h-6 stroke-[3px]" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm uppercase tracking-wider">ยังไม่ระบุ</p>
                                    <p className="text-[10px] font-bold opacity-60">Unassigned task</p>
                                </div>
                                {!selectedUserId && (
                                    <CheckCircle2 className="w-5 h-5 ml-auto text-rose-500" />
                                )}
                            </button>
                        </div>
                    )}

                    {Object.keys(groupedUsers).length === 0 ? (
                        <div className="text-center py-20 text-gray-300">
                            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="font-bold text-sm">ไม่พบสมาชิกที่ค้นหา</p>
                        </div>
                    ) : (
                        Object.entries(groupedUsers).map(([position, usersList]) => (
                            <div key={position} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-[2px] flex-1 bg-gray-50" />
                                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">{position}</h4>
                                    <span className="text-[10px] font-bold bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full">{usersList.length}</span>
                                    <div className="h-[2px] flex-1 bg-gray-50" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {usersList.map(user => {
                                        const isSelected = selectedUserId === user.id;
                                        return (
                                            <button
                                                key={user.id}
                                                onClick={() => { onSelectUser(user.id); onClose(); }}
                                                className={`
                                                    p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 hover:shadow-lg relative overflow-hidden group
                                                    ${isSelected 
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 ring-4 ring-indigo-50 ring-offset-2' 
                                                        : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/10'}
                                                `}
                                            >
                                                <div className="relative shrink-0">
                                                    <img 
                                                        src={user.avatarUrl} 
                                                        className={`w-12 h-12 rounded-xl object-cover border-2 shadow-sm transition-all duration-300 ${isSelected ? 'border-white/40 scale-105' : 'border-white group-hover:scale-105'}`} 
                                                    />
                                                    {isSelected && (
                                                        <div className="absolute -top-2 -right-2 bg-white text-indigo-600 rounded-full p-1 border-2 border-indigo-100 shadow-md">
                                                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[3px]" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-left flex-1 min-w-0">
                                                    <p className={`text-sm font-bold truncate transition-colors ${isSelected ? 'text-white' : 'text-gray-900 group-hover:text-indigo-600'}`}>
                                                        {user.name}
                                                    </p>
                                                    <p className={`text-[10px] font-bold truncate flex items-center gap-1 transition-colors ${isSelected ? 'text-indigo-100' : 'text-gray-400'}`}>
                                                        {user.position || 'Member'}
                                                    </p>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default UserPickerModal;
