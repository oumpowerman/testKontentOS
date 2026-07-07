import React from 'react';
import { X } from 'lucide-react';
import { LeaveRequest } from '../../../../types/attendance';
import { getStatusBadge } from './utils';

interface RequestHeaderProps {
    request: LeaveRequest;
    onClose: () => void;
}

export const RequestHeader: React.FC<RequestHeaderProps> = ({ request, onClose }) => {
    return (
        <div className="relative bg-gradient-to-r from-slate-50 to-slate-100/50 p-6 border-b border-slate-100 shrink-0">
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                id="close-modal-btn"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="flex gap-4 items-start">
                {request.user?.avatarUrl ? (
                    <img 
                        src={request.user.avatarUrl} 
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md shrink-0 animate-fade-in" 
                        alt={request.user?.name}
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-white shadow-md flex items-center justify-center font-semibold text-indigo-400 text-xl shrink-0">
                        {request.user?.name?.charAt(0)}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-slate-800 leading-tight truncate">
                        {request.user?.name || 'ไม่ทราบชื่อ'}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-1">
                        {request.user?.position || 'พนักงานบริษัท'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {getStatusBadge(request.status)}
                        {request.user?.employmentType && (
                            <span className="text-[10px] bg-slate-200/60 text-slate-600 font-extrabold px-2.5 py-0.5 rounded-md uppercase">
                                {request.user.employmentType === 'FULL_TIME' ? 'พนักงานประจำ' : request.user.employmentType === 'PROBATION' ? 'ทดลองงาน' : 'เด็กฝึกงาน'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default RequestHeader;
