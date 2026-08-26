
import React from 'react';
import { MasterOption, Task } from '../../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import StatCard from './StatCard';
import { Package, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface InventoryDashboardProps {
    tasks: Task[];
    masterOptions: MasterOption[];
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ tasks, masterOptions }) => {
    const pillarOptions = masterOptions.filter(o => o.type === 'PILLAR');
    const categoryOptions = masterOptions.filter(o => o.type === 'CATEGORY');

    // Data for Pillar Bar Chart
    const pillarData = pillarOptions.map(p => ({
        name: p.label,
        count: tasks.filter(t => t.pillar === p.key).length
    })).filter(d => d.count > 0).sort((a, b) => b.count - a.count);

    // Data for Category Pie Chart
    const categoryData = categoryOptions.map(c => ({
        name: c.label,
        value: tasks.filter(t => t.category === c.key).length
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

    const totalStock = tasks.length;
    const topPillar = pillarData[0]?.name || '-';
    const topCategory = categoryData[0]?.name || '-';

    return (
        <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Total Stock" 
                    value={totalStock} 
                    icon={Package} 
                    colorClass="bg-indigo-500" 
                    subtitle="Items"
                />
                <StatCard 
                    title="Top Pillar" 
                    value={topPillar} 
                    icon={TrendingUp} 
                    colorClass="bg-blue-500" 
                    subtitle="Most Content"
                />
                <StatCard 
                    title="Top Category" 
                    value={topCategory} 
                    icon={CheckCircle2} 
                    colorClass="bg-emerald-500" 
                    subtitle="Most Variety"
                />
                <StatCard 
                    title="Health Status" 
                    value={totalStock > 20 ? 'Good' : 'Low'} 
                    icon={AlertCircle} 
                    colorClass={totalStock > 20 ? 'bg-green-500' : 'bg-orange-500'} 
                    subtitle="Inventory"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pillar Distribution Chart */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 px-2">Pillar Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pillarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 700 }}
                                />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                                    {pillarData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Distribution Chart */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 px-2">Category Breakdown</h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 700 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Custom Legend */}
                        <div className="w-1/3 space-y-2 pr-4">
                            {categoryData.slice(0, 5).map((entry, index) => (
                                <div key={entry.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-[10px] font-bold text-gray-500 truncate max-w-[80px]">{entry.name}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-800">{entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryDashboard;
