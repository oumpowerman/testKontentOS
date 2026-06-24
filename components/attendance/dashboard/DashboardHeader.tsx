
import React from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface DashboardHeaderProps {
    currentMonth: Date;
    setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedEmploymentType: string;
    setSelectedEmploymentType: (type: string) => void;
    selectedPosition: string;
    setSelectedPosition: (position: string) => void;
    positions: string[];
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    currentMonth,
    setCurrentMonth,
    searchTerm,
    setSearchTerm,
    selectedEmploymentType,
    setSelectedEmploymentType,
    selectedPosition,
    setSelectedPosition,
    positions
}) => {
    return (
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between lg:justify-start gap-2 bg-gray-50 p-1 rounded-xl self-start lg:self-auto w-full lg:w-auto">
                <button 
                    onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} 
                    className="p-2 hover:bg-white rounded-lg text-gray-500 shadow-sm transition-all"
                >
                    <ChevronLeft className="w-5 h-5"/>
                </button>
                <div className="px-4 font-bold text-gray-700 min-w-[140px] text-center capitalize">
                    {format(currentMonth, 'MMMM yyyy')}
                </div>
                <button 
                    onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} 
                    className="p-2 hover:bg-white rounded-lg text-gray-500 shadow-sm transition-all"
                >
                    <ChevronRight className="w-5 h-5"/>
                </button>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full lg:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:w-48 lg:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาพนักงาน..." 
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Employment Type Filter */}
                <select
                    value={selectedEmploymentType}
                    onChange={(e) => setSelectedEmploymentType(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                >
                    <option value="ALL">ประเภทการจ้างงาน: ทั้งหมด</option>
                    <option value="FULL_TIME">💼 พนักงานประจำ</option>
                    <option value="PROBATION">📋 พนักงานทดลองงาน</option>
                    <option value="INTERN">🎓 นักศึกษาฝึกงาน</option>
                </select>

                {/* Position Filter */}
                <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                >
                    <option value="ALL">ตำแหน่ง: ทั้งหมด</option>
                    {positions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default DashboardHeader;
