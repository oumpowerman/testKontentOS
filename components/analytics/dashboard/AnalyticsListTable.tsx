
import React from 'react';
import { Info, Hash, ExternalLink, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ContentAnalytics, Task, Channel } from '../../../types';

interface AnalyticsListTableProps {
    data: (Task & { analytics?: ContentAnalytics[] })[];
    channels: Channel[];
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    onRowClick?: (task: any) => void;
}

const AnalyticsListTable: React.FC<AnalyticsListTableProps> = ({ 
    data, 
    channels, 
    currentPage, 
    totalPages, 
    onPageChange,
    totalItems,
    onRowClick
}) => {
    const getChannelInfo = (channelId: string | undefined) => {
        return channels.find(c => c.id === channelId);
    };

    return (
        <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">รายการคอนเทนต์</th>
                            <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">แพลตฟอร์ม</th>
                            <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">ยอดวิว</th>
                            <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">ER %</th>
                            <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">การมีส่วนร่วม</th>
                            <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">การรับชมต่อ</th>
                            <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">วันที่</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-8 py-20 text-center">
                                    <div className="max-w-xs mx-auto flex flex-col items-center">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:rotate-12">
                                            <Info className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-slate-400 text-sm font-medium">ไม่พบข้อมูลการวิเคราะห์ในฐานข้อมูล</p>
                                    </div>
                                </td>
                            </tr>
                        ) : data.map((item, idx) => {
                            const latest = item.analytics?.[item.analytics.length - 1];
                            const pt = (item as any).displayPlatform || 'OTHER';
                            const channel = getChannelInfo(item.channelId);
                            
                            const totalEngagement = latest ? (latest.likes + latest.shares + latest.comments + latest.saves) : 0;
                            const er = latest && latest.views > 0 ? (totalEngagement / latest.views) * 100 : 0;
                            const isAboveAvg = er > 3; // Standard social benchmark

                            return (
                                <tr 
                                    key={idx} 
                                    onClick={() => onRowClick?.(item)}
                                    className={`group hover:bg-slate-50/50 transition-all duration-200 ${onRowClick ? 'cursor-pointer' : ''}`}
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight line-clamp-1">{item.title}</span>
                                                <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {channel && (
                                                    <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                        <Hash className="w-2.5 h-2.5" />
                                                        {channel.name}
                                                    </span>
                                                )}
                                                <span className="h-1 w-1 bg-slate-200 rounded-full"></span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ID-{item.id.substring(0, 4)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                pt === 'TIKTOK' ? 'bg-black' : 
                                                pt === 'FACEBOOK' ? 'bg-blue-600' :
                                                pt === 'YOUTUBE' ? 'bg-red-600' :
                                                'bg-indigo-400'
                                            }`} />
                                            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{pt}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-bold text-slate-900">{latest?.views.toLocaleString() || '-'}</span>
                                            {latest && latest.views > 10000 && (
                                                <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 px-1 rounded uppercase">Viral Potential</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        {latest ? (
                                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                er > 5 ? 'bg-emerald-50 text-emerald-600' : 
                                                er > 2 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'
                                            }`}>
                                                {er.toFixed(1)}%
                                                {er > 4 ? <ArrowUpRight className="w-2.5 h-2.5" /> : null}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-semibold text-slate-600">{totalEngagement.toLocaleString() || '-'}</span>
                                            {latest && (
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">S/L: {latest.likes > 0 ? (latest.shares/latest.likes).toFixed(2) : 0}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-bold text-indigo-600">{latest?.retentionRate ? `${latest.retentionRate}%` : '-'}</span>
                                            {latest?.retentionRate && (
                                                <div className="w-16 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${latest.retentionRate}%` }}></div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                            {latest ? new Date(latest.capturedAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }) : 'N/A'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
                <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Showing <span className="text-slate-900">{data.length}</span> of <span className="text-slate-900">{totalItems}</span> contents
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                            {[...Array(totalPages)].map((_, i) => {
                                const pageNum = i + 1;
                                // Basic logic to hide some pages if too many
                                if (totalPages > 5 && Math.abs(pageNum - currentPage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                                    if (pageNum === 2 || pageNum === totalPages - 1) return <span key={i} className="px-2 text-slate-300">...</span>;
                                    return null;
                                }
                                
                                return (
                                    <button
                                        key={i}
                                        onClick={() => onPageChange(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                            currentPage === pageNum 
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                                            : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button 
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsListTable;
