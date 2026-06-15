
import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { LeaveUsage } from '../../../types/attendance';
import LeaveQuotaWidget from '../../dashboard/widgets/LeaveQuotaWidget';

interface LeaveQuotaModalProps {
    isOpen: boolean;
    onClose: () => void;
    leaveUsage: LeaveUsage;
    onHistoryClick: () => void;
}

const LeaveQuotaModal: React.FC<LeaveQuotaModalProps> = ({ 
    isOpen, onClose, leaveUsage, onHistoryClick 
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Backdrop Click to Close */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 z-20 p-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Reuse the existing widget but strip its outer border/shadow via CSS or just container clipping */}
                <div className="p-2">
                    <LeaveQuotaWidget 
                        leaveUsage={leaveUsage}
                        onHistoryClick={() => {
                            onHistoryClick();
                            onClose();
                        }}
                    />
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LeaveQuotaModal;
