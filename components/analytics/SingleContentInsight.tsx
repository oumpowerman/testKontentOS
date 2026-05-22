
import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, TrendingUp, BarChart3, Clock, AlertCircle, PlusCircle, Search, Edit2, Trash2 } from 'lucide-react';
import { Task, ContentAnalytics } from '../../types';
import { supabase } from '../../lib/supabase';
import { formatCompactNumber } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import AnalyticsStatsGrid from './dashboard/AnalyticsStatsGrid';
import AnalyticsEntryModal from './AnalyticsEntryModal';
import { useToast } from '../../context/ToastContext';
import { useGlobalDialog } from '../../context/GlobalDialogContext';

interface SingleContentInsightProps {
    task: Task;
    onAnalyticsUpdate?: (hasSomeAnalytics: boolean, hasAllAnalytics: boolean) => void;
}

const SingleContentInsight: React.FC<SingleContentInsightProps> = ({ task, onAnalyticsUpdate }) => {
    const { showToast } = useToast();
    const { showAlert, showConfirm } = useGlobalDialog();
    const platforms = task.targetPlatforms && task.targetPlatforms.length > 0 ? task.targetPlatforms : ['OTHER'];
    const [selectedPlatform, setSelectedPlatform] = useState<string>(platforms[0]);
    const [analytics, setAnalytics] = useState<ContentAnalytics[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<ContentAnalytics | null>(null);

    const handleEditRecord = (record: ContentAnalytics) => {
        setEditingRecord(record);
        setIsEntryModalOpen(true);
    };

    const handleDeleteRecord = async (id: string) => {
        const confirmed = await showConfirm(
            'การลบนี้จะลบสถิติของ Platform และวันเวลาดังกล่าว ยอดสรุปและกราฟเส้นจะถูกคำนวณใหม่ตามจริงครับ คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?',
            'ยืนยันการลบสถิตินี้?'
        );

        if (confirmed) {
            try {
                const { error } = await supabase
                    .from('content_analytics')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                showToast('ลบรายการสถิติเรียบร้อยแล้วครับ 🎉', 'success');
                fetchTaskAnalytics();
            } catch (err) {
                console.error('Delete Snapshot Error:', err);
                showToast('ลบรายการสถิติไม่สำเร็จ กรุณาลองอีกครั้งครับ', 'error');
            }
        }
    };

    const fetchTaskAnalytics = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('content_analytics')
                .select('*')
                .eq('content_id', task.id)
                .order('captured_at', { ascending: true });

            if (error) throw error;
            
            // Map snake_case to camelCase
            const mappedData: ContentAnalytics[] = (data || []).map(item => ({
                id: item.id,
                contentId: item.content_id,
                platform: item.platform || 'OTHER',
                capturedAt: item.captured_at,
                views: item.views,
                likes: item.likes,
                comments: item.comments,
                shares: item.shares,
                saves: item.saves,
                retentionRate: item.retention_rate,
                avgWatchTime: item.avg_watch_time,
                reach: item.reach,
                isAiExtracted: item.is_ai_extracted,
                rawAiData: item.raw_ai_data,
                createdAt: item.created_at,
                updatedAt: item.updated_at
            }));

            setAnalytics(mappedData);

            if (onAnalyticsUpdate) {
                const hasSome = mappedData.length > 0;
                const matches = platforms.every(pt => mappedData.some(a => a.platform === pt));
                onAnalyticsUpdate(hasSome, matches);
            }
        } catch (err) {
            console.error('Fetch Single Insight Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTaskAnalytics();
    }, [task.id]);

    const platformAnalytics = useMemo(() => {
        return analytics.filter(a => a.platform === selectedPlatform);
    }, [analytics, selectedPlatform]);

    const latest = platformAnalytics[platformAnalytics.length - 1];

    const summary = useMemo(() => {
        const v = latest?.views || 0;
        const l = latest?.likes || 0;
        const s = latest?.shares || 0;
        const c = latest?.comments || 0;
        const sv = latest?.saves || 0;
        const interaction = l + s + c + sv;
        const er = v > 0 ? (interaction / v) * 100 : 0;

        return {
            totalViews: v,
            totalLikes: l,
            totalShares: s,
            totalComments: c,
            totalSaves: sv,
            totalEngagement: interaction,
            totalInteraction: interaction,
            avgEngagementRate: er,
            avgRetention: latest?.retentionRate || 0,
            avgWatchTime: latest?.avgWatchTime || 0,
            platformBreakdown: {}
        };
    }, [latest]);

    const chartData = useMemo(() => {
        return platformAnalytics.map(a => ({
            date: new Date(a.capturedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
            views: a.views,
            likes: a.likes,
            retention: a.retentionRate || 0
        }));
    }, [platformAnalytics]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">Calculating Insights...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 py-6">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex bg-slate-100/80 p-1.5 rounded-2xl gap-2 overflow-x-auto scrollbar-none max-w-full border border-slate-200/40">
                    {platforms.map(pt => {
                        const isFilled = analytics.some(a => a.platform === pt);
                        const isActive = selectedPlatform === pt;
                        return (
                            <button
                                key={pt}
                                onClick={() => setSelectedPlatform(pt)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-xs font-extrabold transition-all shrink-0 group relative ${
                                    isActive 
                                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' 
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/40'
                                }`}
                            >
                                <div className={`w-2.5 h-2.5 rounded-full shadow-sm transition-transform group-hover:scale-110 ${
                                    pt === 'TIKTOK' ? 'bg-black' : 
                                    pt === 'FACEBOOK' ? 'bg-blue-600' :
                                    pt === 'YOUTUBE' ? 'bg-red-600' :
                                    'bg-indigo-500'
                                }`} />
                                <span className="tracking-tight uppercase">{pt}</span>
                                {isFilled ? (
                                    <div 
                                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 ${
                                            isActive 
                                                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-100' 
                                                : 'bg-emerald-100 text-emerald-600'
                                        }`}
                                        title="กรอกสถิติแล้ว 🎉"
                                    >
                                        <Check className="w-2.5 h-2.5 stroke-[4.5px]" />
                                    </div>
                                ) : (
                                    <div 
                                        className={`w-4 h-4 rounded-full flex items-center justify-center border border-dashed transition-all shrink-0 ${
                                            isActive 
                                                ? 'border-amber-400 bg-amber-50 text-amber-500 animate-pulse' 
                                                : 'border-slate-300 text-slate-400 opacity-60'
                                        }`}
                                        title="ยังไม่ได้กรอกสถิติครับ ⚡"
                                    >
                                        <span className="text-[10px] font-black leading-none select-none">-</span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                <button 
                    onClick={() => setIsEntryModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-slate-900 transition-all active:scale-95"
                >
                    <PlusCircle className="w-4 h-4" />
                    อัปเดตสถิติล่าสุด
                </button>
            </div>

            {platformAnalytics.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] p-20 text-center space-y-6">
                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                        <BarChart3 className="w-8 h-8 text-slate-300" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-xl font-bold text-slate-900">ยังไม่มีข้อมูลการวิเคราะห์</h4>
                        <p className="text-slate-400 max-w-xs mx-auto">คอนเทนต์นี้น่าจะเพิ่งลงหรือยังไม่ได้บันทึกข้อมูลครับ เริ่มบันทึกข้อมูลแรกเพื่อดูการเติบโตได้เลย!</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    {/* Stats Grid */}
                    <AnalyticsStatsGrid summary={summary as any} />

                    {/* Chart Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900">แนวโน้มจำนวนผู้ชม (Views Growth)</h3>
                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                                </div>
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="views" stroke="#6366f1" fillOpacity={1} fill="url(#colorViews)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900">อัตราการดูต่อ (Retention Rate %)</h3>
                                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                    <Search className="w-4 h-4 text-emerald-500" />
                                </div>
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Line type="monotone" dataKey="retention" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Log */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
                        <div className="flex items-center gap-3 mb-6">
                            <Clock className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-lg font-bold">Data Capture Log</h3>
                        </div>
                        <div className="space-y-4">
                            {platformAnalytics.slice().reverse().map((a, idx) => (
                                <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 hover:bg-white/5 -mx-4 px-4 rounded-xl transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[10px] font-bold">
                                            #{platformAnalytics.length - idx}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{new Date(a.capturedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{new Date(a.capturedAt).toLocaleTimeString('th-TH')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-white">{formatCompactNumber(a.views)}</p>
                                            <p className="text-[9px] text-slate-400 uppercase font-medium">Views</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-indigo-400">{a.retentionRate || 0}%</p>
                                            <p className="text-[9px] text-slate-400 uppercase font-medium">Retention</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 pl-4 border-l border-white/10">
                                            <button 
                                                onClick={() => handleEditRecord(a)}
                                                className="p-1 px-2 text-[11px] text-indigo-400 hover:text-white hover:bg-white/10 rounded-md transition-all flex items-center gap-1"
                                                title="แก้ไข"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                                <span>แก้</span>
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteRecord(a.id)}
                                                className="p-1 px-2 text-[11px] text-red-400 hover:text-white hover:bg-red-500/20 rounded-md transition-all flex items-center gap-1"
                                                title="ลบ"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                <span>ลบ</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {isEntryModalOpen && (
                <AnalyticsEntryModal 
                    content={{ ...task, displayPlatform: selectedPlatform } as any}
                    editingRecord={editingRecord}
                    onClose={() => {
                        setIsEntryModalOpen(false);
                        setEditingRecord(null);
                    }}
                    onSave={fetchTaskAnalytics}
                />
            )}
        </div>
    );
};

export default SingleContentInsight;