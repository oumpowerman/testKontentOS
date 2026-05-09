
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, History, ShoppingBag, Swords, HeartCrack, ChevronDown, Filter, 
    Loader2, Wallet, Star, ArrowUpRight, ArrowDownLeft, ShieldAlert, 
    Zap, TrendingUp, Calendar, Gift, Award
} from 'lucide-react';
import { User, GameLog } from '../../types';
import { useGamification } from '../../hooks/useGamification';
import { format, isSameDay, subDays } from 'date-fns';
import th from 'date-fns/locale/th';
import { 
    AreaChart, Area, Tooltip as ReTooltip, 
    ResponsiveContainer, XAxis
} from 'recharts';

interface MemberHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
}

type FilterType = 'ALL' | 'EARNED' | 'SPENT' | 'PENALTY';

// Load enough items for the chart to look decent on first load
const PAGE_SIZE = 50; 

const MemberHistoryModal: React.FC<MemberHistoryModalProps> = ({ isOpen, onClose, currentUser }) => {
    const { fetchGameLogs } = useGamification(currentUser);
    
    const [logs, setLogs] = useState<GameLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [filter, setFilter] = useState<FilterType>('ALL');

    // --- DATA FETCHING ---
    const loadLogs = async (reset = false) => {
        if (isLoading && !reset) return;
        setIsLoading(true);
        
        const targetPage = reset ? 1 : page;
        const data = await fetchGameLogs(currentUser.id, targetPage, PAGE_SIZE, filter);
        
        if (reset) {
            setLogs(data);
        } else {
            setLogs(prev => [...prev, ...data]);
        }
        
        // Determine if we have more data to load
        setHasMore(data.length === PAGE_SIZE);
        setPage(targetPage + 1);
        setIsLoading(false);
    };

    // Reload when modal opens or filter changes
    useEffect(() => {
        if (isOpen) {
            loadLogs(true);
        }
    }, [isOpen, filter]);

    // --- ANALYTICS ENGINE ---
    const analytics = useMemo(() => {
        const income = logs.filter(l => l.jpChange > 0).reduce((sum, l) => sum + l.jpChange, 0);
        const expense = Math.abs(logs.filter(l => l.jpChange < 0).reduce((sum, l) => sum + l.jpChange, 0));
        
        // Calculate Chart Data (Last 7 Days from loaded data)
        // Note: Ideally this should come from a separate aggregate API, but we calc from logs for now
        const today = new Date();
        const chartData = Array.from({ length: 7 }).map((_, i) => {
            const d = subDays(today, 6 - i);
            // Filter logs for this specific day
            const dayLogs = logs.filter(l => isSameDay(new Date(l.createdAt), d));
            
            return {
                name: format(d, 'dd/MM'), // Label
                income: dayLogs.filter(l => l.jpChange > 0).reduce((sum, l) => sum + l.jpChange, 0),
                xp: dayLogs.reduce((sum, l) => sum + (l.xpChange || 0), 0)
            };
        });

        return { income, expense, chartData };
    }, [logs]);

    // --- GROUPING ENGINE ---
    const groupedLogs = useMemo(() => {
        const groups: { label: string, items: GameLog[] }[] = [];
        logs.forEach(log => {
            const date = new Date(log.createdAt);
            let label = format(date, 'd MMMM yyyy', { locale: th });
            
            if (isSameDay(date, new Date())) label = 'วันนี้ (Today)';
            else if (isSameDay(date, subDays(new Date(), 1))) label = 'เมื่อวาน (Yesterday)';

            let group = groups.find(g => g.label === label);
            if (!group) {
                group = { label, items: [] };
                groups.push(group);
            }
            group.items.push(log);
        });
        return groups;
    }, [logs]);

    // --- STYLE HELPER ---
    const getLogStyle = (log: GameLog) => {
        const type = log.actionType;
        const isNegative = log.hpChange < 0 || log.xpChange < 0 || (log.jpChange < 0 && type !== 'SHOP_PURCHASE');
        
        if (type === 'SHOP_PURCHASE') 
            return { icon: <ShoppingBag className="w-5 h-5"/>, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' };
        
        if (type === 'ITEM_USE') 
            return { icon: <Zap className="w-5 h-5"/>, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' };

        if (type === 'MANUAL_ADJUST')
            return isNegative
                ? { icon: <ShieldAlert className="w-5 h-5"/>, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' }
                : { icon: <Award className="w-5 h-5"/>, color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' };

        if (type.includes('TRIBUNAL'))
            return type.includes('PENALTY')
                ? { icon: <ShieldAlert className="w-5 h-5"/>, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' }
                : { icon: <Award className="w-5 h-5"/>, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' };

        if (type.includes('TASK')) 
            return log.xpChange > 0 
                ? { icon: <Swords className="w-5 h-5"/>, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200' }
                : { icon: <HeartCrack className="w-5 h-5"/>, color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-200' };

        if (type.includes('DUTY'))
             return log.hpChange < 0 
                ? { icon: <ShieldAlert className="w-5 h-5"/>, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' }
                : { icon: <ShieldAlert className="w-5 h-5"/>, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' };
        
        if (type.includes('ATTENDANCE'))
             return log.hpChange < 0 || log.jpChange < 0
                ? { icon: <Calendar className="w-5 h-5"/>, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' }
                : { icon: <Calendar className="w-5 h-5"/>, color: 'text-teal-600', bg: 'bg-teal-100', border: 'border-teal-200' };

        if (type === 'KPI_REWARD')
             return { icon: <Award className="w-5 h-5"/>, color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' };

        // Default
        return isNegative
            ? { icon: <ShieldAlert className="w-5 h-5"/>, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' }
            : { icon: <History className="w-5 h-5"/>, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-indigo-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-300 font-sans">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative animate-in zoom-in-95 border-4 border-white ring-1 ring-gray-100">
                
                {/* --- LEFT PANEL: PROFILE & ANALYTICS (Fixed) --- */}
                <div className="md:w-[320px] lg:w-[360px] bg-slate-50 border-r border-slate-100 flex flex-col shrink-0 h-full overflow-hidden">
                    
                    {/* 1. Header Profile Card */}
                    <div className="p-6 pb-2">
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50 to-purple-50 rounded-bl-full opacity-50"></div>
                            
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="relative">
                                    <img src={currentUser.avatarUrl} className="w-16 h-16 rounded-full object-cover border-4 border-slate-50 shadow-sm" alt="Profile" />
                                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
                                        Lv.{currentUser.level}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{currentUser.name}</h3>
                                    <p className="text-xs text-slate-500 font-medium">{currentUser.position}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-5 relative z-10">
                                <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Wallet</p>
                                    <p className="text-lg font-bold text-indigo-700">{currentUser.availablePoints.toLocaleString()}</p>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
                                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Total XP</p>
                                    <p className="text-lg font-bold text-amber-700">{currentUser.xp.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Analytics Section (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
                        
                        {/* Income / Expense Mini Stats */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                                <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Recent Activity
                            </h4>
                            <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600"><ArrowDownLeft className="w-4 h-4" /></div>
                                    <span className="text-xs font-bold text-emerald-700">Income</span>
                                </div>
                                <span className="font-black text-emerald-600">+{analytics.income.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-rose-50/50 rounded-2xl border border-rose-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-100 rounded-xl text-rose-600"><ArrowUpRight className="w-4 h-4" /></div>
                                    <span className="text-xs font-bold text-rose-700">Expense</span>
                                </div>
                                <span className="font-black text-rose-600">-{analytics.expense.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-xs font-bold text-slate-500 mb-4 text-center">XP Growth (7 Days)</p>
                            <div className="h-40 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics.chartData}>
                                        <defs>
                                            <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <ReTooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', fontSize: '12px' }} 
                                            labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                                        />
                                        <XAxis dataKey="name" hide />
                                        <Area type="monotone" dataKey="xp" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT PANEL: TIMELINE (Main Content) --- */}
                <div className="flex-1 flex flex-col bg-white h-full overflow-hidden relative">
                    
                    {/* Header & Filters */}
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-20">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Transaction History</h2>
                            <p className="text-xs text-gray-400 font-medium">ประวัติการทำรายการย้อนหลัง</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Filter Pills */}
                    <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
                         {[
                            { id: 'ALL', label: 'ทั้งหมด (All)' },
                            { id: 'EARNED', label: 'รายรับ (Income)' },
                            { id: 'SPENT', label: 'รายจ่าย (Expense)' },
                            { id: 'PENALTY', label: 'บทลงโทษ (Penalty)' }
                        ].map(f => (
                            <button 
                                key={f.id}
                                onClick={() => setFilter(f.id as FilterType)}
                                className={`
                                    px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border
                                    ${filter === f.id 
                                        ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' 
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'}
                                `}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Timeline List */}
                    <div className="flex-1 overflow-y-auto p-6 pb-20 scrollbar-thin scrollbar-thumb-slate-200">
                        {isLoading && logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                <Loader2 className="w-10 h-10 animate-spin mb-3 text-indigo-400" />
                                <p className="text-sm font-bold">กำลังโหลดข้อมูล...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <History className="w-10 h-10 opacity-30" />
                                </div>
                                <p className="text-base font-bold text-slate-400">ไม่พบประวัติรายการ</p>
                                <p className="text-xs">เริ่มทำภารกิจเพื่อสร้างประวัติใหม่ๆ กันเถอะ!</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {groupedLogs.map((group, gIdx) => (
                                    <div key={gIdx} className="relative">
                                        {/* Date Sticky Header */}
                                        <div className="sticky top-0 z-10 flex justify-center mb-6">
                                            <span className="bg-slate-100/90 backdrop-blur-md text-slate-500 text-[10px] font-bold px-4 py-1.5 rounded-full shadow-sm border border-white uppercase tracking-wider">
                                                {group.label}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-4 relative pl-4 md:pl-8">
                                            {/* Timeline Line */}
                                            <div className="absolute left-[27px] md:left-[43px] top-2 bottom-2 w-0.5 bg-slate-100 -z-10 rounded-full"></div>

                                            {group.items.map((log) => {
                                                const style = getLogStyle(log);
                                                return (
                                                    <div key={log.id} className="flex items-start gap-4 group">
                                                        {/* Icon Circle */}
                                                        <div className={`
                                                            w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 z-10 border-4 border-white shadow-sm transition-transform group-hover:scale-110
                                                            ${style.bg} ${style.color}
                                                        `}>
                                                            {style.icon}
                                                        </div>

                                                        {/* Content Card */}
                                                        <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-slate-700 line-clamp-2 leading-snug">
                                                                    {log.description}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400 font-bold mt-1 font-mono">
                                                                    {format(new Date(log.createdAt), 'HH:mm')}
                                                                </p>
                                                            </div>
                                                            
                                                            {/* Badges */}
                                                            <div className="flex gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
                                                                {log.xpChange !== 0 && (
                                                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border flex items-center whitespace-nowrap ${log.xpChange > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                                        {log.xpChange > 0 ? '+' : ''}{log.xpChange} XP
                                                                    </span>
                                                                )}
                                                                {log.hpChange !== 0 && (
                                                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border flex items-center whitespace-nowrap ${log.hpChange > 0 ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                                        {log.hpChange > 0 ? '+' : ''}{log.hpChange} HP
                                                                    </span>
                                                                )}
                                                                {log.jpChange !== 0 && (
                                                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border flex items-center whitespace-nowrap ${log.jpChange > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                                        {log.jpChange > 0 ? '+' : ''}{log.jpChange} JP
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                         {hasMore && !isLoading && (
                            <button 
                                onClick={() => loadLogs()}
                                className="w-full py-4 mt-8 text-xs font-bold text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-2xl transition-all flex items-center justify-center gap-2 border border-transparent hover:border-slate-200"
                            >
                                <ChevronDown className="w-4 h-4" /> โหลดเพิ่มเติม (Load More)
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default MemberHistoryModal;
