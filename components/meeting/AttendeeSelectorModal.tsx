
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

    const handleSelectAll = () => {
        // Select all visible users in the current filter
        const visibleIds: string[] = [];
        // Iterate manually to avoid flat() type issues
        Object.values(groupedUsers).forEach((group: User[]) => {
            group.forEach(u => visibleIds.push(u.id));
        });
        const newSelection = new Set([...localSelected, ...visibleIds]);
        setLocalSelected(Array.from(newSelection));
    };

    const handleClearSelection = () => {
        setLocalSelected([]);
    };

    const handleSave = () => {
        onConfirm(localSelected);
        onClose();
    };

    if (!isOpen) return null;

    // FIX: Increased Z-Index to 10000 to ensure it appears above the Expanded Meeting Detail (which is z-9999)
    return createPortal(
        <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl border-4 border-white ring-1 ring-gray-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300 relative"
                onClick={e => e.stopPropagation()} // Prevent close when clicking inside
            >
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 bg-white flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Users className="w-6 h-6 text-indigo-600" />
                                เลือกผู้เข้าร่วมประชุม
                            </h3>
                            <p className="text-sm text-gray-500">เลือกสมาชิกที่ต้องการเชิญเข้าห้องนี้</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Search & Actions */}
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="ค้นหาชื่อ หรือตำแหน่ง..." 
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={handleSelectAll}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors whitespace-nowrap"
                        >
                            Select All
                        </button>
                    </div>
                </div>

                {/* Body: Grouped List */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-6">
                    {Object.keys(groupedUsers).length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>ไม่พบรายชื่อสมาชิก</p>
                        </div>
                    ) : (
                        Object.entries(groupedUsers).map(([position, groupUsers]) => {
                            // Explicit cast to resolve 'unknown' type error
                            const usersList = groupUsers as User[];
                            
                            return (
                                <div key={position} className="animate-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="bg-white border border-gray-200 p-1.5 rounded-lg text-gray-500 shadow-sm">
                                            <Briefcase className="w-3.5 h-3.5" />
                                        </span>
                                        <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide">{position}</h4>
                                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full font-bold">{usersList.length}</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {usersList.map(user => {
                                            const isSelected = localSelected.includes(user.id);
                                            return (
                                                <div 
                                                    key={user.id}
                                                    onClick={() => toggleSelection(user.id)}
                                                    className={`
                                                        flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 relative overflow-hidden group
                                                        ${isSelected 
                                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-[1.02]' 
                                                            : 'bg-white border-transparent hover:border-indigo-200 hover:shadow-sm'
                                                        }
                                                    `}
                                                >
                                                    {/* Checkmark BG Effect */}
                                                    {isSelected && (
                                                        <div className="absolute -right-4 -bottom-4 text-indigo-500 opacity-20">
                                                            <Check className="w-16 h-16" />
                                                        </div>
                                                    )}

                                                    <div className="relative shrink-0">
                                                        <img 
                                                            src={user.avatarUrl} 
                                                            className={`w-10 h-10 rounded-full object-cover border-2 ${isSelected ? 'border-white/30' : 'border-gray-100'}`} 
                                                        />
                                                        {isSelected && (
                                                            <div className="absolute -top-1 -right-1 bg-white text-indigo-600 rounded-full p-0.5 border border-indigo-100 shadow-sm">
                                                                <Check className="w-3 h-3 stroke-[3px]" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0 z-10">
                                                        <h5 className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                                            {user.name}
                                                        </h5>
                                                        <p className={`text-xs truncate ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
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
                <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center shrink-0 z-20">
                    <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-gray-500">เลือกแล้ว:</span>
                         <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                            {localSelected.length} คน
                         </span>
                         {localSelected.length > 0 && (
                             <button onClick={handleClearSelection} className="text-[10px] text-gray-400 hover:text-red-500 underline ml-2">
                                 ล้างค่า
                             </button>
                         )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                            ยกเลิก
                        </button>
                        <button 
                            onClick={handleSave}
                            className="px-8 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95"
                        >
                            ยืนยัน ({localSelected.length})
                        </button>
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
};

export default AttendeeSelectorModal;
