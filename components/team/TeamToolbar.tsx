
import React, { useState, useRef, useEffect } from 'react';
import { Search, Users, User, Filter, X, UserCheck, ChevronDown } from 'lucide-react';
import { ViewScope } from '../../hooks/useTeamFilters';
import { motion, AnimatePresence } from 'framer-motion';

interface TeamToolbarProps {
    viewScope: ViewScope;
    setViewScope: (s: ViewScope) => void;
    searchQuery: string;
    setSearchQuery: (s: string) => void;
    selectedPosition: string;
    setSelectedPosition: (p: string) => void;
    availablePositions: string[];
    onReset: () => void;
}

const TeamToolbar: React.FC<TeamToolbarProps> = ({
    viewScope, setViewScope,
    searchQuery, setSearchQuery,
    selectedPosition, setSelectedPosition,
    availablePositions,
    onReset
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="bg-white/80 backdrop-blur-xl p-3 rounded-3xl border border-white/40 shadow-xl shadow-indigo-500/5 flex flex-col lg:flex-row gap-4 items-center justify-between relative z-[120]">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 via-purple-50/50 to-pink-50/50 opacity-50 pointer-events-none" />
            
            {/* Left: Scope & Position */}
            <div className={`flex flex-col sm:flex-row gap-3 w-full lg:w-auto relative ${isDropdownOpen ? 'z-40' : 'z-30'}`}>
                <div className="flex bg-gray-100/50 p-1.5 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
                    <button 
                        onClick={() => setViewScope('MY_SQUAD')}
                        className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${viewScope === 'MY_SQUAD' ? 'text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {viewScope === 'MY_SQUAD' && (
                            <motion.div 
                                layoutId="teamToolbarActiveTab"
                                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-blue-100"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <Users className="w-4 h-4" /> 
                            <span>My Squad</span>
                        </span>
                    </button>

                    <button 
                        onClick={() => setViewScope('ALL')}
                        className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${viewScope === 'ALL' ? 'text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {viewScope === 'ALL' && (
                            <motion.div 
                                layoutId="teamToolbarActiveTab"
                                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-purple-100"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <User className="w-4 h-4" /> 
                            <span>All Team</span>
                        </span>
                    </button>

                    <button 
                        onClick={() => setViewScope('ONLY_ME')}
                        className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${viewScope === 'ONLY_ME' ? 'text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {viewScope === 'ONLY_ME' && (
                            <motion.div 
                                layoutId="teamToolbarActiveTab"
                                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-emerald-100"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <UserCheck className="w-4 h-4" /> 
                            <span>Only Me</span>
                        </span>
                    </button>
                </div>

                {/* Custom Position Dropdown */}
                <div className={`relative w-full sm:min-w-[180px] sm:w-auto ${isDropdownOpen ? 'z-50' : 'z-10'}`} ref={dropdownRef}>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`relative w-full flex items-center justify-between bg-white/40 backdrop-blur-md border border-white/80 text-gray-700 text-xs font-bold py-2.5 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200/50 cursor-pointer hover:bg-white/60 hover:border-indigo-300 transition-all shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-4px_rgba(99,102,241,0.15)] ${isDropdownOpen ? 'ring-2 ring-indigo-200/50 border-indigo-300' : ''}`}
                    >
                        <div className="flex items-center gap-2">
                            <Filter className={`w-3.5 h-3.5 transition-colors ${isDropdownOpen ? 'text-indigo-600' : 'text-indigo-400'}`} />
                            <span>{selectedPosition === 'ALL' ? 'ตำแหน่งทั้งหมด' : selectedPosition}</span>
                        </div>
                        <motion.div 
                            animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                            className="text-indigo-400"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </motion.div>
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 5, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute top-full left-0 w-full mt-2 bg-white/95 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-2xl shadow-indigo-500/20 overflow-hidden z-[210]"
                            >
                                <div className="max-h-[280px] overflow-y-auto p-1.5 custom-scrollbar">
                                    <button 
                                        onClick={() => { setSelectedPosition('ALL'); setIsDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedPosition === 'ALL' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-500'}`}
                                    >
                                        ตำแหน่งทั้งหมด
                                    </button>
                                    {availablePositions.map(p => (
                                        <button 
                                            key={p}
                                            onClick={() => { setSelectedPosition(p); setIsDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedPosition === p ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-500'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Right: Search */}
            <div className="flex gap-2 w-full lg:w-auto relative z-10">
                <div className="relative flex-1 lg:w-64 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาชื่อ..." 
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200/60 focus:bg-white focus:border-indigo-200 rounded-2xl text-xs font-bold outline-none transition-all shadow-inner focus:shadow-lg focus:shadow-indigo-500/10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
                {(searchQuery || selectedPosition !== 'ALL' || viewScope !== 'ALL') && (
                    <button 
                        onClick={onReset}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                        title="ล้างตัวกรอง"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default TeamToolbar;
