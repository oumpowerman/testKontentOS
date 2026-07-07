import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ApprovalPaginationProps {
    currentPage: number;
    setCurrentPage: (page: number | ((prev: number) => number)) => void;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
}

export const ApprovalPagination: React.FC<ApprovalPaginationProps> = ({
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage
}) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm gap-3 mt-4">
            <div className="text-xs text-gray-500 font-bold">
                แสดงหน้า <span className="text-indigo-600">{currentPage}</span> จาก <span className="text-indigo-600">{totalPages}</span> (ทั้งหมด {totalItems} รายการ)
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                    className="p-2 rounded-xl border border-gray-200/80 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors text-gray-500 outline-none cursor-pointer flex items-center"
                    title="หน้าแรก"
                    id="pagination-first-page-btn"
                >
                    <ChevronLeft className="w-4 h-4" />
                    <ChevronLeft className="w-4 h-4 -ml-2" />
                </button>
                <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-2 rounded-xl border border-gray-200/80 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors text-xs font-bold text-gray-600 flex items-center gap-1 outline-none cursor-pointer"
                    id="pagination-prev-page-btn"
                >
                    <ChevronLeft className="w-4 h-4" />
                    <span>ก่อนหน้า</span>
                </button>
                
                <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Dynamic sliding window for page numbers
                        let pageNum = i + 1;
                        if (currentPage > 3 && totalPages > 5) {
                            if (currentPage + 2 <= totalPages) {
                                pageNum = currentPage - 3 + i + 1;
                            } else {
                                pageNum = totalPages - 5 + i + 1;
                            }
                        }
                        return (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-9 h-9 rounded-xl text-xs font-black transition-all border outline-none cursor-pointer ${
                                    currentPage === pageNum
                                        ? 'bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-100'
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                                }`}
                                id={`pagination-page-${pageNum}-btn`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-3 py-2 rounded-xl border border-gray-200/80 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors text-xs font-bold text-gray-600 flex items-center gap-1 outline-none cursor-pointer"
                    id="pagination-next-page-btn"
                >
                    <span>ถัดไป</span>
                    <ChevronRight className="w-4 h-4" />
                </button>
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="p-2 rounded-xl border border-gray-200/80 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors text-gray-500 outline-none cursor-pointer flex items-center"
                    title="หน้าสุดท้าย"
                    id="pagination-last-page-btn"
                >
                    <ChevronRight className="w-4 h-4 animate-none" />
                    <ChevronRight className="w-4 h-4 -ml-2" />
                </button>
            </div>
        </div>
    );
};

export default ApprovalPagination;
