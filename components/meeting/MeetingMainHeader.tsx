
import React from 'react';
import { ArrowLeft, Coffee, Info, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { format, addMonths, subMonths, startOfMonth } from 'date-fns';
import { th } from 'date-fns/locale';

interface MeetingMainHeaderProps {
    onInfoOpen: () => void;
    onCreateMeeting: () => void;
}

const MeetingMainHeader: React.FC<MeetingMainHeaderProps> = ({ 
    onInfoOpen, 
    onCreateMeeting
}) => {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6 shrink-0 px-2 md:px-0 pt-2">
            <div className="flex items-center gap-3 md:gap-4">
                <motion.div 
                    key="logo"
                    whileHover={{ rotate: 0, scale: 1.1 }}
                    initial={{ rotate: -3 }}
                    className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg shadow-indigo-200 text-white transition-transform duration-300 cursor-pointer"
                >
                    <Coffee className="w-6 h-6 md:w-8 md:h-8" />
                </motion.div>
                <div>
                    <h1 className="text-xl md:text-3xl font-bold text-gray-800 tracking-tight flex items-center">
                        Meeting Room
                        <span className="ml-2 text-lg md:text-2xl animate-bounce">💬</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-0.5">
                         <p className="text-gray-500 text-[10px] md:text-sm font-bold bg-white/60 px-2 md:px-3 py-0.5 md:py-1 rounded-full w-fit backdrop-blur-sm border border-white/50">
                            จดบันทึก ✦ ติดตามงาน
                        </p>
                        <button 
                            onClick={onInfoOpen}
                            className="p-1 bg-white text-indigo-300 hover:text-indigo-500 rounded-full transition-all border border-indigo-50"
                            title="คู่มือการใช้งาน"
                        >
                            <Info className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            <button 
                onClick={onCreateMeeting}
                className="w-full sm:w-auto flex items-center justify-center px-4 md:px-6 py-2.5 md:py-3.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold rounded-xl md:rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95 group border-2 md:border-4 border-white/30 text-sm md:text-base"
            >
                <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2 stroke-[3px] group-hover:rotate-90 transition-transform" /> 
                <span>เริ่มการประชุม</span>
            </button>
        </div>
    );
};

export default MeetingMainHeader;
