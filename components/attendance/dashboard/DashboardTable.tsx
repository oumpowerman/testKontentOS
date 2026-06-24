import React, { useState, useMemo } from 'react';
import { User } from '../../../types';
import { AttendanceLog } from '../../../types/attendance';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface UserStat {
    userId: string;
    present: number;
    late: number;
    leaves: number;
    absent: number;
    totalHours: number;
    avgCheckIn: string;
    logs: AttendanceLog[];
}

interface DashboardTableProps {
    isLoading: boolean;
    filteredStats: UserStat[];
    users: User[];
    getGrade: (stat: UserStat) => { grade: string, color: string };
    onUserClick: (user: User, stat: UserStat) => void;
}

const DashboardTable: React.FC<DashboardTableProps> = ({
    isLoading,
    filteredStats,
    users,
    getGrade,
    onUserClick
}) => {
    // Collapsible states: initially all expanded
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    const toggleGroup = (groupId: string) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    // Dynamically compute stats grouped by Position
    const { groups, groupedData } = useMemo(() => {
        const grouped: Record<string, UserStat[]> = {};
        const positionSet = new Set<string>();

        filteredStats.forEach(stat => {
            const user = users.find(u => u.id === stat.userId);
            const position = user?.position?.trim() || 'ไม่ระบุตำแหน่ง';
            positionSet.add(position);

            if (!grouped[position]) {
                grouped[position] = [];
            }
            grouped[position].push(stat);
        });

        const colorPalettes = [
            'bg-indigo-50/60 text-indigo-700 border-indigo-100 hover:bg-indigo-100/50',
            'bg-amber-50/60 text-amber-700 border-amber-100 hover:bg-amber-100/50',
            'bg-emerald-50/60 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50',
            'bg-sky-50/60 text-sky-700 border-sky-100 hover:bg-sky-100/50',
            'bg-purple-50/60 text-purple-700 border-purple-100 hover:bg-purple-100/50',
            'bg-rose-50/60 text-rose-700 border-rose-100 hover:bg-rose-100/50',
            'bg-teal-50/60 text-teal-700 border-teal-100 hover:bg-teal-100/50',
            'bg-orange-50/60 text-orange-700 border-orange-100 hover:bg-orange-100/50'
        ];

        const sortedPositions = Array.from(positionSet).sort();
        const computedGroups = sortedPositions.map((pos, index) => ({
            id: pos,
            title: pos,
            bg: colorPalettes[index % colorPalettes.length]
        }));

        return { groups: computedGroups, groupedData: grouped };
    }, [filteredStats, users]);

    return (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100 text-xs text-gray-500 uppercase">
                            <th className="px-6 py-4 font-bold">Employee</th>
                            <th className="px-6 py-4 font-bold text-center">Days Present</th>
                            <th className="px-6 py-4 font-bold text-center">Late Count</th>
                            <th className="px-6 py-4 font-bold text-center">Absent</th>
                            <th className="px-6 py-4 font-bold text-center">Leaves</th>
                            <th className="px-6 py-4 font-bold text-center">Total Hours</th>
                            <th className="px-6 py-4 font-bold text-center">Grade</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr><td colSpan={7} className="py-20 text-center text-gray-400">Loading Report...</td></tr>
                        ) : filteredStats.length === 0 ? (
                            <tr><td colSpan={7} className="py-20 text-center text-gray-400">ไม่พบข้อมูลพนักงาน</td></tr>
                        ) : (
                            groups.map(group => {
                                const groupStats = groupedData[group.id] || [];
                                if (groupStats.length === 0) return null;

                                const isCollapsed = collapsedGroups[group.id];

                                return (
                                    <React.Fragment key={group.id}>
                                        {/* Collapsible Section Header Row */}
                                        <tr 
                                            className={`${group.bg} cursor-pointer border-y border-gray-100 select-none transition-all`}
                                            onClick={() => toggleGroup(group.id)}
                                        >
                                            <td colSpan={7} className="px-6 py-3 font-bold text-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span>{group.title}</span>
                                                        <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-gray-200 shadow-2xs font-bold">
                                                            {groupStats.length} คน
                                                        </span>
                                                    </div>
                                                    <div className="text-gray-400">
                                                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Section Content Rows */}
                                        {!isCollapsed && groupStats.map(stat => {
                                            const user = users.find(u => u.id === stat.userId);
                                            if (!user) return null;
                                            const grade = getGrade(stat);

                                            return (
                                                <tr 
                                                    key={stat.userId} 
                                                    className="hover:bg-indigo-50/30 transition-all cursor-pointer group"
                                                    onClick={() => onUserClick(user, stat)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img src={user.avatarUrl} className="w-10 h-10 rounded-full bg-gray-200 object-cover border border-gray-100" />
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-800">{user.name}</p>
                                                                <p className="text-xs text-gray-500">{user.position}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-block px-3 py-1 bg-gray-100 rounded-lg text-sm font-bold text-gray-700">
                                                            {stat.present}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${stat.late > 0 ? 'bg-red-50 text-red-600' : 'text-gray-400'}`}>
                                                            {stat.late}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${stat.absent > 0 ? 'bg-red-100 text-red-700' : 'text-gray-400'}`}>
                                                            {stat.absent}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${stat.leaves > 0 ? 'bg-pink-50 text-pink-600' : 'text-gray-400'}`}>
                                                            {stat.leaves}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-sm font-mono text-gray-600">
                                                            {stat.totalHours.toFixed(1)} h
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-block w-10 py-1 rounded-lg text-xs font-black ${grade.color}`}>
                                                            {grade.grade}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DashboardTable;
