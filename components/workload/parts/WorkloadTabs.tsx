import React from 'react';
import { Users, User } from 'lucide-react';

interface WorkloadTabsProps {
    viewMode: 'TEAM' | 'ME';
    setViewMode: (mode: 'TEAM' | 'ME') => void;
}

const WorkloadTabs: React.FC<WorkloadTabsProps> = ({ viewMode, setViewMode }) => {
    return (
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex gap-2 shrink-0">
            <button 
                onClick={() => setViewMode('TEAM')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all duration-300 ${
                    viewMode === 'TEAM' 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-105' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
                <Users className="w-4 h-4" /> ภาพรวมทีม (Team Capacity)
            </button>
            <button 
                onClick={() => setViewMode('ME')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all duration-300 ${
                    viewMode === 'ME' 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-105' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
                <User className="w-4 h-4" /> คิวงานของฉัน (Personal Queue)
            </button>
        </div>
    );
};

export default WorkloadTabs;
