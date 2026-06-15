
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { LeaveType, LeaveUsage, LeaveRequest } from '../../../types/attendance';
import { MasterOption } from '../../../types';
import LeaveTypeSelector from './LeaveTypeSelector';
import LeaveFormContainer from './LeaveFormContainer';

interface LeaveRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => Promise<boolean>;
    masterOptions?: MasterOption[];
    leaveUsage?: LeaveUsage; 
    requests?: LeaveRequest[];
    initialDate?: Date;
    initialReason?: string; // Add Prop
    fixedType?: LeaveType;
}

const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({ 
    isOpen, onClose, onSubmit, masterOptions = [], leaveUsage, initialDate, initialReason, fixedType
}) => {
    const [step, setStep] = useState<'SELECT' | 'FORM'>('SELECT');
    const [selectedType, setSelectedType] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (fixedType) {
                setSelectedType(fixedType);
                setStep('FORM');
            } else {
                setSelectedType(null);
                setStep('SELECT');
            }
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, fixedType]);

    const handleSelectType = (key: string) => {
        setSelectedType(key);
        setStep('FORM');
    };

    const handleBack = () => {
        if (fixedType) {
            onClose();
        } else {
            setStep('SELECT');
            setSelectedType(null);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overscroll-none">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 border-4 border-white ring-1 ring-gray-100">
                {step === 'SELECT' ? (
                    <div className="flex flex-col h-full min-h-0">
                         <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">เลือกรายการ</h3>
                                <p className="text-gray-400 text-xs font-medium">คุณต้องการส่งคำขอเรื่องอะไร?</p>
                            </div>
                            <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto bg-[#f8fafc] flex-1 overscroll-contain">
                            <LeaveTypeSelector masterOptions={masterOptions} onSelect={handleSelectType} />
                        </div>
                    </div>
                ) : (
                    <LeaveFormContainer 
                        selectedType={selectedType!}
                        onBack={handleBack}
                        onSubmit={onSubmit}
                        onClose={onClose}
                        masterOptions={masterOptions}
                        leaveUsage={leaveUsage}
                        initialDate={initialDate}
                        initialReason={initialReason}
                        fixedType={!!fixedType}
                    />
                )}
            </div>
        </div>,
        document.body
    );
};

export default LeaveRequestModal;
