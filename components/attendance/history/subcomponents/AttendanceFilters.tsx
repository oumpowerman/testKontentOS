import React from 'react';
import { Calendar, ArrowRight, Filter, RefreshCw, Briefcase } from 'lucide-react';
import FilterDropdown from '../../../common/FilterDropdown';

interface AttendanceFiltersProps {
    filters: {
        startDate: string;
        endDate: string;
        workType: string;
    };
    onFilterChange: (key: string, value: string) => void;
    onReset: () => void;
    onRefresh: () => void;
    isFetching: boolean;
}

const workTypeOptions = [
    { key: 'ALL', label: 'ทุกรูปแบบ (All Types)' },
    { key: 'OFFICE', label: 'เข้าออฟฟิศ' },
    { key: 'WFH', label: 'Work From Home' },
    { key: 'SITE', label: 'On Site (ข้างนอก)' },
    { key: 'LEAVE', label: 'การลา (Leaves)' }
];

export const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({
    filters,
    onFilterChange,
    onReset,
    onRefresh,
    isFetching
}) => {
    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
                {/* Date Range */}
                <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-2xl border border-gray-200 w-full sm:w-auto">
                    <Calendar className="w-4 h-4 text-gray-400 ml-1" />
                    <input 
                        type="date" 
                        className="bg-transparent text-xs font-bold text-gray-600 outline-none w-28 cursor-pointer"
                        value={filters.startDate}
                        onChange={(e) => onFilterChange('startDate', e.target.value)}
                    />
                    <ArrowRight className="w-3 h-3 text-gray-300" />
                    <input 
                        type="date" 
                        className="bg-transparent text-xs font-bold text-gray-600 outline-none w-28 cursor-pointer"
                        value={filters.endDate}
                        onChange={(e) => onFilterChange('endDate', e.target.value)}
                    />
                </div>

                {/* Work Type Filter with FilterDropdown */}
                <div className="w-full sm:w-60">
                    <FilterDropdown
                        label="รูปแบบงาน"
                        options={workTypeOptions}
                        value={filters.workType}
                        onChange={(val) => onFilterChange('workType', val)}
                        placeholder="ทุกรูปแบบ"
                        showAllOption={false}
                        clearable={false}
                        icon={<Briefcase className="w-4 h-4" />}
                    />
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
                <button 
                    onClick={onReset} 
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="ล้างตัวกรอง"
                >
                    <Filter className="w-4 h-4" />
                </button>
                <button 
                    onClick={onRefresh} 
                    className={`p-2.5 text-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer ${isFetching ? 'animate-spin' : ''}`}
                    title="โหลดข้อมูลใหม่"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default AttendanceFilters;
