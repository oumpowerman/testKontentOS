import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HistoryPaginationProps {
    page: number;
    totalCount: number;
    pageSize: number;
    loading: boolean;
    onPageChange: (newPage: number | ((prev: number) => number)) => void;
}

const HistoryPagination: React.FC<HistoryPaginationProps> = ({
    page,
    totalCount,
    pageSize,
    loading,
    onPageChange
}) => {
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return (
        <div className="p-8 border-t border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0 rounded-b-[3rem]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                Page <span className="text-slate-800">{page + 1}</span> of <span className="text-slate-800">{totalPages}</span>
                <span className="mx-3 opacity-20">|</span>
                Total <span className="text-indigo-600 font-bold">{totalCount.toLocaleString()}</span> Results
            </div>
            
            <div className="flex gap-4">
                <button 
                    disabled={page === 0 || loading}
                    onClick={() => onPageChange(p => Math.max(0, p - 1))}
                    className="group px-6 py-3 rounded-2xl text-xs font-bold bg-white text-slate-500 border border-slate-100 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm active:scale-95 disabled:active:scale-100"
                >
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Previous
                </button>
                <button 
                    disabled={page >= totalPages - 1 || loading}
                    onClick={() => onPageChange(p => p + 1)}
                    className="group px-6 py-3 rounded-2xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95 disabled:active:scale-100"
                >
                    Next <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
            </div>
        </div>
    );
};

export default HistoryPagination;
