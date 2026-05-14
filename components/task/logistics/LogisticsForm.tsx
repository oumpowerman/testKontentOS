import React, { useState } from 'react';
import { User, Task } from '../../../types';
import { ChevronDown, ChevronUp, Clock, Sparkles, UserPlus, AlignLeft, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogisticsFormProps {
    users: User[];
    parentTask: Task;
    isAdding: boolean;
    onSubmit: (data: {
        title: string;
        assigneeId: string;
        description: string;
        difficulty: 'EASY' | 'MEDIUM' | 'HARD';
        estimatedHours: number;
    }) => void;
    onOpenUserPicker: () => void;
    selectedAssigneeId: string;
}

const LogisticsForm: React.FC<LogisticsFormProps> = ({ 
    users, 
    parentTask, 
    isAdding, 
    onSubmit,
    onOpenUserPicker,
    selectedAssigneeId
}) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');
    const [estimatedHours, setEstimatedHours] = useState<number>(0);
    const [isExpanded, setIsExpanded] = useState(false);

    const activeUsers = users.filter(u => u.isActive);
    const selectedAssigneeUser = activeUsers.find(u => u.id === selectedAssigneeId);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        
        if (!newTaskTitle.trim() || isAdding) return;

        onSubmit({
            title: newTaskTitle,
            assigneeId: selectedAssigneeId,
            description,
            difficulty,
            estimatedHours
        });

        // Clear form
        setNewTaskTitle('');
        setDescription('');
        setDifficulty('EASY');
        setEstimatedHours(0);
        setIsExpanded(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="flex-1 relative">
                    <input 
                        type="text" 
                        className={`w-full pl-4 pr-24 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all ${isExpanded ? 'bg-white border-indigo-200' : ''}`}
                        placeholder="เพิ่มงานย่อย (เช่น จองตั๋ว, หาของ)..."
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                    />
                    <button 
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                            isExpanded 
                            ? 'bg-indigo-600 text-white shadow-indigo-200 ring-2 ring-indigo-100' 
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100'
                        }`}
                        title={isExpanded ? "ย่อรายละเอียด" : "ขยายรายละเอียดเพิ่ม"}
                    >
                        <span className="text-[10px] font-medium uppercase tracking-tighter">
                            {isExpanded ? 'Hide' : 'Details'}
                        </span>
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                            <ChevronDown className="w-3.5 h-3.5 stroke-[3px]" />
                        </motion.div>
                    </button>
                </div>
                
                <div className="flex gap-2 shrink-0">
                    {/* CUSTOM USER PICKER TRIGGER */}
                    <button
                        type="button"
                        onClick={onOpenUserPicker}
                        className={`
                            flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 py-2 px-3 rounded-xl border transition-all sm:min-w-[140px] sm:max-w-[180px]
                            ${selectedAssigneeId 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-white hover:border-indigo-300'}
                        `}
                    >
                        {selectedAssigneeUser ? (
                            <>
                                <img src={selectedAssigneeUser.avatarUrl} className="w-5 h-5 rounded-full object-cover border border-white" />
                                <span className="text-xs font-bold truncate">{selectedAssigneeUser.name.split(' ')[0]}</span>
                            </>
                        ) : (
                            <>
                                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                    <UserPlus className="w-3 h-3" />
                                </div>
                                <span className="text-xs font-bold">Assign</span>
                            </>
                        )}
                    </button>

                    <button 
                        type="submit" 
                        disabled={!newTaskTitle.trim() || isAdding}
                        className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm min-w-[44px] flex items-center justify-center"
                    >
                        {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-3"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {/* Description */}
                            <div className="relative group">
                                <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                    <AlignLeft className="w-4 h-4" />
                                </div>
                                <textarea 
                                    placeholder="รายละเอียดเพิ่มเติม (ระบุสิ่งที่ต้องทำ)..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all resize-none min-h-[84px]"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                {/* Estimated Hours */}
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between group focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-medium text-gray-400 uppercase tracking-tight">ชั่วโมงที่คาดหวัง</p>
                                            <p className="text-[10px] text-gray-400">ระบุเป็นตัวเลข</p>
                                        </div>
                                    </div>
                                    <input 
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        className="w-16 bg-transparent text-right font-bold text-gray-700 outline-none"
                                        value={estimatedHours}
                                        onChange={e => setEstimatedHours(parseFloat(e.target.value) || 0)}
                                    />
                                </div>

                                {/* Difficulty */}
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-medium text-gray-400 uppercase tracking-tight">ความยากง่าย</p>
                                            <p className="text-[10px] text-gray-400">{difficulty === 'EASY' ? 'ง่าย ๆ ชิล ๆ' : difficulty === 'MEDIUM' ? 'ระดับกลาง' : 'ท้าทายมาก'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {(['EASY', 'MEDIUM', 'HARD'] as const).map((level, idx) => {
                                            const isSelected = difficulty === level;
                                            const colors = level === 'EASY' ? 'text-emerald-500' : level === 'MEDIUM' ? 'text-amber-500' : 'text-rose-500';
                                            return (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    onClick={() => setDifficulty(level)}
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isSelected ? `bg-white shadow-sm ring-2 ring-${level === 'EASY' ? 'emerald' : level === 'MEDIUM' ? 'amber' : 'rose'}-100 ${colors}` : 'text-gray-300 hover:bg-gray-100'}`}
                                                >
                                                    <Sparkles className={`w-3.5 h-3.5 ${isSelected ? 'fill-current' : ''}`} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </form>
    );
};

export default LogisticsForm;
