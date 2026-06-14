
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StockTablePaginationProps {
    totalCount: number;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

const StockTablePagination: React.FC<StockTablePaginationProps> = ({
    totalCount,
    currentPage,
    totalPages,
    itemsPerPage,
    onPageChange
}) => {
    if (totalCount === 0) return null;

    return (
        <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-white sticky bottom-0 z-20 rounded-b-[2.5rem]">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">
                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} Items
            </div>
            
            <div className="flex items-center gap-3 mx-auto sm:mx-0">
                <button 
                    onClick={() => onPageChange(currentPage - 1)} 
                    disabled={currentPage === 1} 
                    className="p-2.5 border border-gray-200 rounded-2xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-500 shadow-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-indigo-600 px-4 bg-indigo-50 py-2 rounded-2xl border border-indigo-100 shadow-inner">
                        {currentPage}
                    </span>
                    <span className="text-[10px] font-black text-gray-300 px-1">/</span>
                    <span className="text-xs font-bold text-gray-400 px-2">
                        {totalPages}
                    </span>
                </div>

                <button 
                    onClick={() => onPageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages} 
                    className="p-2.5 border border-gray-200 rounded-2xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-500 shadow-sm"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
            
            <div className="hidden sm:block w-[150px]"></div> {/* Spacer to balance */}
        </div>
    );
};

export default StockTablePagination;
