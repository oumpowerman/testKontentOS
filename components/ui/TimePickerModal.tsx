
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ChevronRight, ChevronLeft } from 'lucide-react';

interface TimePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (time: string) => void;
    initialTime?: string;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({ isOpen, onClose, onSelect, initialTime }) => {
    const [view, setView] = useState<'hours' | 'minutes'>('hours');
    const [hour, setHour] = useState(12);
    const [minute, setMinute] = useState(0);
    const [ampm, setAmPm] = useState<'AM' | 'PM'>('PM');

    useEffect(() => {
        if (initialTime) {
            const [h, m] = initialTime.split(':').map(Number);
            if (!isNaN(h)) {
                if (h === 0) {
                    setHour(12);
                    setAmPm('AM');
                } else if (h === 12) {
                    setHour(12);
                    setAmPm('PM');
                } else if (h > 12) {
                    setHour(h - 12);
                    setAmPm('PM');
                } else {
                    setHour(h);
                    setAmPm('AM');
                }
            }
            if (!isNaN(m)) setMinute(m);
        }
    }, [initialTime, isOpen]);

    const handleConfirm = () => {
        let h = hour;
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        
        const formattedTime = `${h.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        onSelect(formattedTime);
        onClose();
    };

    const hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const minuteNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

    const getPosition = (index: number, total: number, radius: number) => {
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
        return {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle),
        };
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div 
                    className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                >
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 text-center border-b border-gray-100 bg-gray-50/50">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                    <Clock className="w-5 h-4 mr-2 text-indigo-600" />
                                    เลือกเวลาที่ต้องการ
                                </h3>
                                <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                            
                            <div className="flex items-center justify-center space-x-2">
                                <button 
                                    onClick={() => setView('hours')}
                                    className={`text-5xl font-black transition-colors ${view === 'hours' ? 'text-indigo-600' : 'text-gray-300'}`}
                                >
                                    {hour.toString().padStart(2, '0')}
                                </button>
                                <span className="text-5xl font-black text-gray-300">:</span>
                                <button 
                                    onClick={() => setView('minutes')}
                                    className={`text-5xl font-black transition-colors ${view === 'minutes' ? 'text-indigo-600' : 'text-gray-300'}`}
                                >
                                    {minute.toString().padStart(2, '0')}
                                </button>
                                <div className="flex flex-col ml-4 space-y-1">
                                    <button 
                                        onClick={() => setAmPm('AM')}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${ampm === 'AM' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-400'}`}
                                    >
                                        AM
                                    </button>
                                    <button 
                                        onClick={() => setAmPm('PM')}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${ampm === 'PM' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-400'}`}
                                    >
                                        PM
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Clock Surface */}
                        <div className="p-8 flex justify-center">
                            <div className="relative w-64 h-64 bg-gray-50 rounded-full shadow-inner flex items-center justify-center font-kanit">
                                {/* Center dot */}
                                <div className="absolute w-2 h-2 bg-indigo-600 rounded-full z-20"></div>
                                
                                {/* Hand */}
                                <motion.div 
                                    animate={{ 
                                        rotate: view === 'hours' 
                                            ? (hour % 12) * 30 
                                            : minute * 6
                                    }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    className="absolute w-1 h-28 bg-indigo-600/30 origin-bottom flex flex-col items-center"
                                    style={{ bottom: '50%' }}
                                >
                                    <div className="w-4 h-4 bg-indigo-600 rounded-full -mt-2 shadow-lg ring-4 ring-indigo-50"></div>
                                </motion.div>

                                {/* Numbers */}
                                {view === 'hours' ? (
                                    hourNumbers.map((num, i) => {
                                        const pos = getPosition(i, 12, 100);
                                        return (
                                            <button
                                                key={`hour-${num}`}
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setHour(num);
                                                    setTimeout(() => setView('minutes'), 300);
                                                }}
                                                className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                                    ${hour === num ? 'bg-indigo-600 text-white shadow-lg scale-125 z-10' : 'text-gray-500 hover:bg-gray-200'}`}
                                                style={{ 
                                                    transform: `translate(${pos.x}px, ${pos.y}px)`
                                                }}
                                            >
                                                {num}
                                            </button>
                                        );
                                    })
                                ) : (
                                    minuteNumbers.map((num, i) => {
                                        const pos = getPosition(i, 12, 100);
                                        return (
                                            <button
                                                key={`min-${num}`}
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMinute(num);
                                                }}
                                                className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                                    ${minute === num ? 'bg-indigo-600 text-white shadow-lg scale-125 z-10' : 'text-gray-500 hover:bg-gray-200'}`}
                                                style={{ 
                                                    transform: `translate(${pos.x}px, ${pos.y}px)`
                                                }}
                                            >
                                                {num.toString().padStart(2, '0')}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-gray-50/50 flex space-x-3">
                            <button 
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 px-6 bg-white border border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all active:scale-95"
                            >
                                ยกเลิก
                            </button>
                            <button 
                                type="button"
                                onClick={handleConfirm}
                                className="flex-[2] py-4 px-6 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                            >
                                ตกลง
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default TimePickerModal;
