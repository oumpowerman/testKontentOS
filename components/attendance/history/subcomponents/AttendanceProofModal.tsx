import React from 'react';
import { createPortal } from 'react-dom';
import { XCircle, ExternalLink } from 'lucide-react';
import { getDirectDriveUrl } from '../../../../lib/imageUtils';

interface AttendanceProofModalProps {
    viewProofUrl: string | null;
    onClose: () => void;
}

export const AttendanceProofModal: React.FC<AttendanceProofModalProps> = ({
    viewProofUrl,
    onClose
}) => {
    if (!viewProofUrl) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[200] bg-slate-950/95 flex items-center justify-center p-4 backdrop-blur-md" 
            onClick={onClose}
        >
            <div 
                className="relative max-w-lg w-full bg-white p-2 rounded-2xl shadow-2xl animate-in zoom-in-95 cursor-auto" 
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute -top-12 right-0 text-white hover:text-gray-300 flex items-center gap-1 font-bold text-xs bg-slate-900/60 hover:bg-slate-900/80 px-2.5 py-1.5 rounded-full cursor-pointer transition-all"
                >
                    <XCircle className="w-5 h-5" /> ปิด
                </button>
                <img 
                    src={getDirectDriveUrl(viewProofUrl)} 
                    className="w-full h-auto max-h-[75vh] object-contain rounded-xl shadow-inner bg-slate-950" 
                    alt="Proof" 
                    referrerPolicy="no-referrer"
                />
                <a 
                    href={viewProofUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center justify-center mt-3 text-indigo-600 font-bold text-sm hover:underline py-2"
                >
                    เปิดรูปต้นฉบับ <ExternalLink className="w-4 h-4 ml-1.5" />
                </a>
            </div>
        </div>,
        document.body
    );
};

export default AttendanceProofModal;
