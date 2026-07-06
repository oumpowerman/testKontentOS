import React, { useState, useMemo, useEffect } from 'react';
import { Search, CheckCircle2, Users, X, Filter, Briefcase, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    position?: string;
    employmentType?: string;
    isActive: boolean;
}

interface EmployeeSegmentationSectionProps {
    users: User[];
    filteredEmployees: User[];
    selectedUserIds: Set<string>;
    employmentTypeFilter: 'ALL' | 'INTERN' | 'PROBATION' | 'FULL_TIME';
    setEmploymentTypeFilter: (filter: 'ALL' | 'INTERN' | 'PROBATION' | 'FULL_TIME') => void;
    positionFilter: string;
    setPositionFilter: (filter: string) => void;
    userSearchTerm: string;
    setUserSearchTerm: (term: string) => void;
    onToggleUserSelected: (userId: string) => void;
    onToggleUsersSelected: (userIds: string[], select: boolean) => void;
    onSelectAllFiltered: () => void;
    onDeselectAllFiltered: () => void;
    positions: string[];
}

const getEmploymentTypeThai = (type?: string) => {
    switch (type) {
        case 'FULL_TIME': return 'พนักงานประจำ';
        case 'PROBATION': return 'ทดลองงาน';
        case 'INTERN': return 'นักศึกษาฝึกงาน';
        default: return 'พนักงาน';
    }
};

const getGradientColor = (name: string) => {
    const gradients = [
        'from-rose-400 to-pink-500 text-white',
        'from-violet-400 to-indigo-500 text-white',
        'from-blue-400 to-cyan-500 text-white',
        'from-emerald-400 to-teal-500 text-white',
        'from-amber-400 to-orange-500 text-white',
        'from-fuchsia-400 to-purple-600 text-white',
        'from-sky-400 to-blue-500 text-white',
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
        sum += name.charCodeAt(i);
    }
    return gradients[sum % gradients.length];
};

export const EmployeeSegmentationSection: React.FC<EmployeeSegmentationSectionProps> = ({
    users,
    filteredEmployees,
    selectedUserIds,
    employmentTypeFilter,
    setEmploymentTypeFilter,
    positionFilter,
    setPositionFilter,
    userSearchTerm,
    setUserSearchTerm,
    onToggleUserSelected,
    onToggleUsersSelected,
    onSelectAllFiltered,
    onDeselectAllFiltered,
    positions,
}) => {
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);

    // Filter list of selected employees
    const selectedUsers = useMemo(() => {
        return users.filter(u => selectedUserIds.has(u.id));
    }, [users, selectedUserIds]);

    // Grouping filtered employees by position for Bento Grid representation
    const employeesByPosition = useMemo(() => {
        const groups: Record<string, User[]> = {};
        filteredEmployees.forEach(emp => {
            const pos = emp.position || 'พนักงานทั่วไป (General)';
            if (!groups[pos]) {
                groups[pos] = [];
            }
            groups[pos].push(emp);
        });
        return groups;
    }, [filteredEmployees]);

    // Handle position-level bulk selection toggle
    const handleTogglePositionGroup = (position: string) => {
        const groupEmps = filteredEmployees.filter(emp => (emp.position || 'พนักงานทั่วไป (General)') === position);
        const groupSelectedCount = groupEmps.filter(emp => selectedUserIds.has(emp.id)).length;
        const allSelected = groupSelectedCount === groupEmps.length;

        const ids = groupEmps.map(emp => emp.id);
        onToggleUsersSelected(ids, !allSelected);
    };

    return (
        <div className="p-6 bg-white rounded-[2rem] border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-left space-y-1">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                        🎯 รายชื่อพนักงานที่ได้รับการส่งออกข้อมูล (Target Employees)
                    </h4>
                    <p className="text-[11px] font-bold text-slate-400 pl-1">
                        {selectedUserIds.size === users.length ? (
                            <span className="text-emerald-600">✨ เลือกพนักงานทั้งหมด ({users.length} ท่าน)</span>
                        ) : selectedUserIds.size === 0 ? (
                            <span className="text-rose-500">⚠️ ยังไม่ได้เลือกพนักงาน (กรุณากดจัดการรายชื่อเพื่อเลือก)</span>
                        ) : (
                            <span className="text-indigo-600">📝 ระบุพนักงานเฉพาะเจาะจง ({selectedUserIds.size} จาก {users.length} ท่าน)</span>
                        )}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsSubModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100 transition-all active:scale-95 shadow-sm self-start sm:self-center shrink-0"
                >
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>จัดการรายชื่อพนักงาน (Manage Target)</span>
                </button>
            </div>

            {/* Overlapping Avatars Display */}
            <div className="flex items-center gap-3 py-2 px-1 overflow-x-auto no-scrollbar">
                {selectedUsers.length > 0 ? (
                    <div className="flex items-center pl-2">
                        {selectedUsers.slice(0, 10).map((user, index) => {
                            const nameInitial = user.name.trim().charAt(0);
                            const gradientClass = getGradientColor(user.name);
                            return (
                                <div
                                    key={user.id}
                                    className="relative -ml-2.5 first:ml-0 w-9 h-9 rounded-full ring-2 ring-white shadow-sm flex items-center justify-center font-bold text-[11px] overflow-hidden shrink-0 transition-transform duration-200 hover:-translate-y-1 hover:z-10"
                                    title={`${user.name} (${user.position || 'พนักงาน'})`}
                                >
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center uppercase`}>
                                            {nameInitial}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {selectedUsers.length > 10 && (
                            <div className="relative -ml-2.5 w-9 h-9 rounded-full ring-2 ring-white bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[10px] shadow-sm shrink-0">
                                +{selectedUsers.length - 10}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-400 font-bold">ไม่มีการเลือกผู้ใช้งานเป้าหมายในรายงานนี้</p>
                    </div>
                )}
            </div>

            {/* Sub-Modal: Bento Group Selection (Attendee Selector Style) */}
            <AnimatePresence>
                {isSubModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4">
                        {/* Glass Overlay backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSubModalOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />

                        {/* Modal container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="relative w-full max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[85vh] bg-white rounded-none sm:rounded-[2rem] border-0 sm:border border-slate-100 shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-left">
                                <div className="space-y-0.5">
                                    <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                        <Users className="w-5 h-5 text-indigo-500" /> เลือกรายชื่อพนักงานสำหรับส่งออก
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-medium tracking-tight">
                                        ค้นหาพนักงาน จัดหมวดหมู่ตามตำแหน่ง และเลือกกลุ่มเป้าหมายบัญชีองค์กร
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsSubModalOpen(false)}
                                    className="p-1.5 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Top Controls: Search Bar & Filters */}
                            <div className="p-4 bg-white border-b border-slate-100 space-y-3">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="ค้นหาพนักงานด้วยชื่อ หรือแผนก..."
                                        value={userSearchTerm}
                                        onChange={(e) => setUserSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all"
                                    />
                                    {userSearchTerm && (
                                        <button
                                            onClick={() => setUserSearchTerm('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Employment Type Filters */}
                                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                                    {(['ALL', 'FULL_TIME', 'PROBATION', 'INTERN'] as const).map((filter) => {
                                        const label = filter === 'ALL' ? 'ทั้งหมด' : getEmploymentTypeThai(filter);
                                        const active = employmentTypeFilter === filter;
                                        return (
                                            <button
                                                key={filter}
                                                type="button"
                                                onClick={() => setEmploymentTypeFilter(filter)}
                                                className={`py-1.5 px-3 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap ${
                                                    active
                                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold shadow-sm'
                                                        : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Bento Grid: Grouped by Position */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/30">
                                {Object.keys(employeesByPosition).length > 0 ? (
                                    Object.entries(employeesByPosition).map(([pos, emps]) => {
                                        const selectedInGroup = emps.filter(e => selectedUserIds.has(e.id)).length;
                                        const allGroupSelected = selectedInGroup === emps.length;

                                        return (
                                            <div
                                                key={pos}
                                                className="bg-white p-4 rounded-2xl border border-slate-200/50 shadow-sm space-y-3"
                                            >
                                                {/* Position Group Header */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-left">
                                                        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-500 border border-slate-100">
                                                            <Briefcase className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-xs font-bold text-slate-700">{pos}</h5>
                                                            <p className="text-[9px] text-slate-400 font-medium font-sarabun tracking-tight">
                                                                เลือกแล้ว {selectedInGroup} จาก {emps.length} ท่าน
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleTogglePositionGroup(pos)}
                                                        className={`px-2.5 py-1 text-[9px] font-bold border rounded-md transition-all ${
                                                            allGroupSelected
                                                                ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-100 text-indigo-700'
                                                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                                                        }`}
                                                    >
                                                        {allGroupSelected ? 'ล้างเลือกกลุ่ม' : 'เลือกทั้งกลุ่ม'}
                                                    </button>
                                                </div>

                                                {/* Employees list in position group */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {emps.map((user) => {
                                                        const isSelected = selectedUserIds.has(user.id);
                                                        const nameInitial = user.name.trim().charAt(0);
                                                        const gradientClass = getGradientColor(user.name);

                                                        return (
                                                            <button
                                                                key={user.id}
                                                                type="button"
                                                                onClick={() => onToggleUserSelected(user.id)}
                                                                className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all active:scale-98 ${
                                                                    isSelected
                                                                        ? 'bg-indigo-50/40 border-indigo-200/80 text-slate-800'
                                                                        : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50/30'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <div className="relative w-8 h-8 rounded-full shadow-sm flex items-center justify-center font-bold text-[10px] overflow-hidden shrink-0">
                                                                        {user.avatarUrl ? (
                                                                            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                                                                        ) : (
                                                                            <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center uppercase`}>
                                                                                {nameInitial}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="truncate text-left">
                                                                        <p className="text-xs font-bold text-slate-700 leading-tight truncate">{user.name}</p>
                                                                        <p className="text-[9px] font-medium text-slate-400 mt-0.5">
                                                                            {getEmploymentTypeThai(user.employmentType)}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                                                                    isSelected
                                                                        ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm shadow-indigo-100'
                                                                        : 'border-slate-300 bg-white'
                                                                }`}>
                                                                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                                        <p className="text-xs text-slate-500 font-bold">ไม่พบรายชื่อพนักงานที่ตรงกับเงื่อนไขการค้นหา</p>
                                        <p className="text-[10px] text-slate-400">กรุณาลองปรับเปลี่ยนตัวกรอง หรือตรวจสอบคำค้นหาใหม่อีกครั้ง</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="text-[11px] text-slate-400 font-medium text-left">
                                    เลือกอยู่ <span className="text-indigo-600 font-extrabold">{selectedUserIds.size}</span> ท่าน จากพนักงานทั้งหมด {users.length} ท่าน
                                </div>
                                <div className="flex items-center justify-end gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={onSelectAllFiltered}
                                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 text-indigo-700 text-[10px] font-medium uppercase rounded-lg transition-colors"
                                    >
                                        เลือกทั้งหมดที่กรอง
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onDeselectAllFiltered}
                                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-medium uppercase rounded-lg transition-colors"
                                    >
                                        ล้างผลลัพธ์
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsSubModalOpen(false)}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium uppercase rounded-xl transition-colors shadow-md shadow-indigo-100"
                                    >
                                        ตกลง (Apply)
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
