import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Briefcase } from 'lucide-react';
import { User } from '../../../types';
import FilterDropdown from '../../common/FilterDropdown';
import IndividualSelector from './IndividualSelector';

interface RandomizerConfigProps {
    topic: string;
    setTopic: (topic: string) => void;
    numWinners: number;
    setNumWinners: (num: number) => void;
    selectedPosition: string;
    setSelectedPosition: (pos: string) => void;
    selectedUserIds: string[];
    setSelectedUserIds: React.Dispatch<React.SetStateAction<string[]>>;
    activeUsers: User[];
    isSpinning: boolean;
    onSpin: () => void;
}

const RandomizerConfig: React.FC<RandomizerConfigProps> = ({
    topic,
    setTopic,
    numWinners,
    setNumWinners,
    selectedPosition,
    setSelectedPosition,
    selectedUserIds,
    setSelectedUserIds,
    activeUsers,
    isSpinning,
    onSpin
}) => {
    // Get unique positions
    const positions = Array.from(new Set(activeUsers.map(u => u.position).filter(Boolean)));

    // Filter users based on position
    const usersInPosition = selectedPosition === 'ALL' 
        ? activeUsers 
        : activeUsers.filter(u => u.position === selectedPosition);

    // Final pool based on position AND manual selection
    const finalPool = selectedUserIds.length > 0
        ? usersInPosition.filter(u => selectedUserIds.includes(u.id))
        : usersInPosition;

    const handleToggleUser = (id: string) => {
        setSelectedUserIds(prev => 
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        );
    };

    const positionOptions = [
        { key: 'ALL', label: `ทุกคนในทีม (${activeUsers.length})` },
        ...positions.map(pos => ({
            key: pos,
            label: `${pos} (${activeUsers.filter(u => u.position === pos).length})`
        }))
    ];

    return (
        <motion.div 
            key="config"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center w-full space-y-8"
        >
            {/* Topic Input */}
            <div className="w-full">
                <label className="block text-lg font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                    วันนี้สุ่มเรื่องอะไรดี? ✨
                </label>
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                    <input 
                        type="text"
                        placeholder="เช่น มื้อนี้ใครจองโต๊ะ, ใครล้างจาน..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={isSpinning}
                        className="relative w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white text-lg font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all disabled:opacity-50 shadow-sm"
                    />
                </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Number of Winners */}
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                        จำนวนผู้โชคดี (คน) 👥
                    </label>
                    <div className="relative">
                        <input 
                            type="number"
                            min="1"
                            max={finalPool.length || 1}
                            value={numWinners}
                            onChange={(e) => setNumWinners(Math.max(1, parseInt(e.target.value) || 1))}
                            disabled={isSpinning}
                            className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white text-lg font-bold outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold pointer-events-none">
                            คน
                        </div>
                    </div>
                    <p className="text-[12px] text-slate-400 font-medium italic">
                        * สุ่มได้สูงสุด {finalPool.length} คน
                    </p>
                </div>

                {/* Position Filter */}
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                        สุ่มเฉพาะตำแหน่ง 💼
                    </label>
                    <FilterDropdown 
                        label="ตำแหน่ง"
                        value={selectedPosition}
                        options={positionOptions}
                        onChange={setSelectedPosition}
                        icon={<Briefcase className="w-4 h-4" />}
                        showAllOption={false}
                    />
                </div>
            </div>

            {/* Individual Selector */}
            <IndividualSelector 
                users={usersInPosition}
                selectedIds={selectedUserIds}
                onToggle={handleToggleUser}
                onClear={() => setSelectedUserIds([])}
                disabled={isSpinning}
            />

            {/* Action Button */}
            <div className="w-full flex flex-col items-center pt-4">
                <motion.button
                    whileHover={{ scale: 1.05, rotate: [0, -1, 1, -1, 0] }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onSpin}
                    disabled={isSpinning || finalPool.length === 0 || !topic.trim()}
                    className="w-full max-w-sm py-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-[2rem] font-medium text-2xl shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    <div className="relative z-10 flex items-center justify-center gap-3">
                        {isSpinning ? (
                            <>
                                <Loader2 className="w-8 h-8 animate-spin" />
                                กำลังสุ่ม...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-8 h-8 animate-pulse" />
                                {finalPool.length === 0 ? 'ไม่มีคนให้สุ่ม' : 'เริ่มสุ่มเลย!'}
                            </>
                        )}
                    </div>
                </motion.button>
                {!topic.trim() && !isSpinning && (
                    <p className="mt-4 text-rose-500 text-xs font-bold animate-bounce">
                        ⚠️ กรุณาพิมพ์หัวข้อก่อนเริ่มสุ่มนะจ๊ะ
                    </p>
                )}
            </div>
        </motion.div>
    );
};

export default RandomizerConfig;
