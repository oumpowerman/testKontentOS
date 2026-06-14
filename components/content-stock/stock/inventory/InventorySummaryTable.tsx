
import React from 'react';
import { MasterOption, Task } from '../../../../types';
import { Landmark, Tags, Layers } from 'lucide-react';

interface InventorySummaryTableProps {
    tasks: Task[];
    masterOptions: MasterOption[];
}

const InventorySummaryTable: React.FC<InventorySummaryTableProps> = ({ tasks, masterOptions }) => {
    const pillarOptions = masterOptions.filter(o => o.type === 'PILLAR');
    const categoryOptions = masterOptions.filter(o => o.type === 'CATEGORY');

    // Grouping logic
    const pillarCounts = pillarOptions.map(p => ({
        key: p.key,
        label: p.label,
        count: tasks.filter(t => t.pillar === p.key).length
    })).sort((a, b) => b.count - a.count);

    const categoryCounts = categoryOptions.map(c => ({
        key: c.key,
        label: c.label,
        count: tasks.filter(t => t.category === c.key).length
    })).sort((a, b) => b.count - a.count);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pillar Breakdown */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                <div className="px-6 py-5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                        <Landmark className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-800 uppercase tracking-widest text-sm">Breakdown by Pillar</h3>
                </div>
                <div className="p-2">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <th className="px-4 py-3">Pillar Name</th>
                                <th className="px-4 py-3 text-right">Count</th>
                                <th className="px-4 py-3 text-right">Percentage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {pillarCounts.map(item => (
                                <tr key={item.key} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-4 py-3 text-sm font-bold text-gray-700 group-hover:text-blue-600">{item.label}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-800 text-right">{item.count}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-[10px] font-bold text-gray-400">
                                                {tasks.length > 0 ? ((item.count / tasks.length) * 100).toFixed(1) : 0}%
                                            </span>
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-blue-500 rounded-full" 
                                                    style={{ width: `${tasks.length > 0 ? (item.count / tasks.length) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                <div className="px-6 py-5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                        <Tags className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-800 uppercase tracking-widest text-sm">Breakdown by Category</h3>
                </div>
                <div className="p-2">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <th className="px-4 py-3">Category Name</th>
                                <th className="px-4 py-3 text-right">Count</th>
                                <th className="px-4 py-3 text-right">Percentage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {categoryCounts.map(item => (
                                <tr key={item.key} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-4 py-3 text-sm font-bold text-gray-700 group-hover:text-emerald-600">{item.label}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-800 text-right">{item.count}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-[10px] font-bold text-gray-400">
                                                {tasks.length > 0 ? ((item.count / tasks.length) * 100).toFixed(1) : 0}%
                                            </span>
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-emerald-500 rounded-full" 
                                                    style={{ width: `${tasks.length > 0 ? (item.count / tasks.length) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventorySummaryTable;
