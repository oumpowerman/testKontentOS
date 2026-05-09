
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, Users, Briefcase } from 'lucide-react';
import { User } from '../../types';

interface AttendeeSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    selectedIds: string[];
    onConfirm: (newSelectedIds: string[]) => void;
}

const AttendeeSelectorModal: React.FC<AttendeeSelectorModalProps> = ({ 
    isOpen, onClose, users, selectedIds, onConfirm 
}) => {
    const [localSelected, setLocalSelected] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Sync state when opening
    useEffect(() => {
        if (isOpen) {
            setLocalSelected([...selectedIds]);
            setSearchQuery('');
        }
    }, [isOpen, selectedIds]);

    // Group Users Logic
    const groupedUsers = useMemo(() => {
        const groups: Record<string, User[]> = {};
        
        // Filter active users first
        const activeUsers = users.filter(u => u.isActive);
        
        // Filter by search
        const filtered = activeUsers.filter(u => 
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.position.toLowerCase().includes(searchQuery.toLowerCase())
        );

        filtered.forEach(user => {
            const pos = user.position || 'General Member';
            if (!groups[pos]) groups[pos] = [];
            groups[pos].push(user);
        });

        // Sort keys to keep order consistent
        return Object.keys(groups).sort().reduce((obj, key) => {
            obj[key] = groups[key];
            return obj;
        }, {} as Record<string, User[]>);
    }, [users, searchQuery]);

    const toggleSelection = (userId: string) => {
        setLocalSelected(prev => 
            prev.includes(userId) 
            ? prev.filter(id => id !== userId) 
            : [...prev, userId]
        );
    };

    const toggleGroupSelection = (usersInGroup: User[]) => {
        const groupIds = usersInGroup.map(u => u.id);
        const allSelected = groupIds.every(id => localSelected.includes(id));

        if (allSelected) {
            // Deselect all in group
            setLocalSelected(prev => prev.filter(id => !groupIds.includes(id)));
        } else {
            // Select all in group (keeping others)
            const newSelection = new Set([...localSelected, ...groupIds]);
            setLocalSelected(Array.from(newSelection));
        }
    };

    const visibleUsers = useMemo(() => {
        const list: User[] = [];
        Object.values(groupedUsers).forEach((group: User[]) => {
            group.forEach(u => list.push(u));
        });
        return list;
    }, [groupedUsers]);

    const isAllVisibleSelected = visibleUsers.length > 0 && visibleUsers.every(u => localSelected.includes(u.id));

    const handleToggleAllVisible = () => {
        const visibleIds = visibleUsers.map(u => u.id);
        if (isAllVisibleSelected) {
            // Deselect all visible
            setLocalSelected(prev => prev.filter(id => !visibleIds.includes(id)));
        } else {
            // Select all visible
            const newSelection = new Set([...localSelected, ...visibleIds]);
            setLocalSelected(Array.from(newSelection));
        }
    };

    const handleClearSelection = () => {
        setLocalSelected([]);
    };

    const handleSave = () => {
        onConfirm(localSelected);
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border-4 border-white ring-1 ring-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 relative"
                onClick={e => e.stopPropagation()} // Prevent close when clicking inside
            >
                
                {/* Header */}
                <div className="px-8 py-7 border-b border-gray-100 bg-white relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none overflow-hidden" />
                    
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                                <span className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                                    <Users className="w-6 h-6 text-white" />
                                </span>
                                เลือกผู้เข้าร่วมประชุม
                            </h3>
                            <p className="text-sm font-medium text-gray-400 mt-2 ml-14">ระบุสมาชิกที่ต้องการเชิญเข้าร่วมการประชุม</p>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-all active:scale-90"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Search & Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-8 relative z-20">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="ค้นหาชื่อ หรือตำแหน่ง..." 
                                className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-2 border-transparent rounded-[1.5rem] text-sm font-medium focus:border-indigo-100 focus:bg-white focus:ring-4 focus:ring-indigo-50/30 outline-none transition-all placeholder:text-gray-300 shadow-sm"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {visibleUsers.length > 0 && (
                            <button 
                                onClick={handleToggleAllVisible}
                                className={`
                                    px-8 py-4 rounded-[1.5rem] text-sm font-medium transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap min-w-[140px]
                                    ${isAllVisibleSelected 
                                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white shadow-rose-100/50' 
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100/50'
                                    }
                                `}
                            >
                                {isAllVisibleSelected ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                {isAllVisibleSelected ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Body: Grouped List */}
                <div className="flex-1 overflow-y-auto px-8 py-6 bg-white space-y-8 scrollbar-hide">
                    {Object.keys(groupedUsers).length === 0 ? (
                        <div className="text-center py-20 text-gray-300">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Users className="w-10 h-10 opacity-30" />
                            </div>
                            <p className="font-medium">ไม่พบรายชื่อสมาชิกนิคะ</p>
                        </div>
                    ) : (
                        Object.entries(groupedUsers).map(([position, groupUsers]) => {
                            const usersList = groupUsers as User[];
                            const allSelectedInGroup = usersList.every(u => localSelected.includes(u.id));
                            const someSelectedInGroup = usersList.some(u => localSelected.includes(u.id));
                            
                            return (
                                <div key={position} className="animate-in slide-in-from-bottom-2 fade-in duration-300">
                                    <button 
                                        onClick={() => toggleGroupSelection(usersList)}
                                        className="w-full flex items-center justify-between mb-4 group/header p-2 -mx-2 rounded-2xl hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`
                                                p-2 rounded-xl border-2 transition-all
                                                ${allSelectedInGroup 
                                                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                                                    : someSelectedInGroup
                                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                                        : 'bg-white border-gray-100 text-gray-400 group-hover/header:border-indigo-200'
                                                }
                                            `}>
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-sm font-black text-gray-700 uppercase tracking-widest">{position}</h4>
                                            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full">{usersList.length}</span>
                                        </div>
                                        
                                        <div className={`
                                            flex items-center gap-2 text-xs font-bold transition-all
                                            ${allSelectedInGroup ? 'text-indigo-600' : 'text-gray-300 group-hover/header:text-indigo-400'}
                                        `}>
                                            <span className="hidden sm:inline uppercase tracking-tighter">
                                                {allSelectedInGroup ? 'Deselect Group' : 'Select Group'}
                                            </span>
                                            <div className={`
                                                w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                                                ${allSelectedInGroup ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}
                                            `}>
                                                {allSelectedInGroup && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                                                {!allSelectedInGroup && someSelectedInGroup && <div className="w-2 h-0.5 bg-indigo-400 rounded-full" />}
                                            </div>
                                        </div>
                                    </button>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                                        {usersList.map(user => {
                                            const isSelected = localSelected.includes(user.id);
                                            return (
                                                <div 
                                                    key={user.id}
                                                    onClick={() => toggleSelection(user.id)}
                                                    className={`
                                                        flex items-center gap-4 p-4 rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300 relative overflow-hidden
                                                        ${isSelected 
                                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 ring-2 ring-indigo-50 ring-offset-2' 
                                                            : 'bg-white border-gray-50 hover:border-indigo-100 hover:shadow-lg hover:shadow-gray-100/50'
                                                        }
                                                    `}
                                                >
                                                    {/* Background Glow for Selected */}
                                                    {isSelected && (
                                                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                                                    )}

                                                    <div className="relative shrink-0">
                                                        <img 
                                                            src={user.avatarUrl} 
                                                            className={`w-12 h-12 rounded-2xl object-cover border-2 shadow-sm transition-all duration-300 ${isSelected ? 'border-white/40 scale-105' : 'border-white'}`} 
                                                            referrerPolicy="no-referrer"
                                                        />
                                                        {isSelected && (
                                                            <div className="absolute -top-2 -right-2 bg-white text-indigo-600 rounded-full p-1 border border-indigo-100 shadow-md animate-in zoom-in-50 duration-300">
                                                                <Check className="w-3 h-3 stroke-[3px]" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0 z-10">
                                                        <h5 className={`font-medium text-base truncate tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                                            {user.name}
                                                        </h5>
                                                        <p className={`text-xs font-normal truncate transition-colors ${isSelected ? 'text-indigo-100' : 'text-gray-400'}`}>
                                                            {user.position}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 z-20">
                    <div className="flex items-center gap-3">
                         <div className="flex -space-x-2 mr-2">
                             {users.filter(u => localSelected.includes(u.id)).slice(0, 3).map(u => (
                                 <img key={u.id} src={u.avatarUrl} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                             ))}
                             {localSelected.length > 3 && (
                                 <div className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                     +{localSelected.length - 3}
                                 </div>
                             )}
                         </div>
                         <div className="flex flex-col">
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Selection</span>
                             <div className="flex items-center gap-2">
                                <span className="bg-indigo-600 text-white px-3 py-0.5 rounded-full text-xs font-bold">
                                    {localSelected.length} คน
                                </span>
                                {localSelected.length > 0 && (
                                    <button 
                                        onClick={handleClearSelection} 
                                        className="text-[10px] font-bold text-rose-400 hover:text-rose-600 transition-colors uppercase tracking-wider underline border-none bg-transparent"
                                    >
                                        Clear All
                                    </button>
                                )}
                             </div>
                         </div>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button 
                            onClick={onClose} 
                            className="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all border-2 border-transparent"
                        >
                            ยกเลิก
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={localSelected.length === 0}
                            className="flex-1 sm:flex-none px-12 py-3.5 rounded-2xl text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-100 hover:shadow-indigo-300 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:translate-y-0"
                        >
                            ยืนยันเลือก ({localSelected.length})
                        </button>
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
};

export default AttendeeSelectorModal;
