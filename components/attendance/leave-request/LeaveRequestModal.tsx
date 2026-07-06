
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    pendingUsage?: LeaveUsage;
    requests?: LeaveRequest[];
    initialDate?: Date;
    initialReason?: string; // Add Prop
    fixedType?: LeaveType;
}

const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({ 
    isOpen, onClose, onSubmit, masterOptions = [], leaveUsage, pendingUsage, initialDate, initialReason, fixedType
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

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 overscroll-none">
                    {/* Backdrop animate-in / animate-out */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal container animate-in / animate-out with scale & lift */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="relative bg-white w-full sm:max-w-lg rounded-none sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh] border-0 sm:border-4 border-white ring-0 sm:ring-1 sm:ring-gray-100/50"
                    >
                        {step === 'SELECT' ? (
                            <div className="flex flex-col h-full min-h-0">
                                 <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">เลือกรายการ</h3>
                                        <p className="text-gray-400 text-[11px] sm:text-xs font-medium">คุณต้องการส่งคำขอเรื่องอะไร?</p>
                                    </div>
                                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-4 sm:p-5 overflow-y-auto bg-[#f8fafc] flex-1 overscroll-contain">
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
                                pendingUsage={pendingUsage}
                                initialDate={initialDate}
                                initialReason={initialReason}
                                fixedType={!!fixedType}
                            />
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default LeaveRequestModal;
