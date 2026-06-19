
import React from 'react';
import { Settings, HelpCircle } from 'lucide-react';
import { NexusFolder } from '../../../types';
import { motion } from 'framer-motion';

interface NexusNavigationProps {
    currentFolder: NexusFolder | null;
    onOpenSettings: () => void;
    onOpenHelp: () => void;
    isIntegrated?: boolean;
}

const NexusNavigation: React.FC<NexusNavigationProps> = ({ 
    currentFolder, 
    onOpenSettings,
    onOpenHelp,
    isIntegrated = false
}) => {
    return (
        <div className={`${isIntegrated ? 'mb-6' : 'mb-10'} font-kanit`}>
            {/* Header Section: Title + Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-1"
                >
                    <h1 className="text-3xl md:text-5xl font-bold text-slate-800 tracking-tight">
                        {currentFolder ? currentFolder.name : 'คลังแสงส่วนตัว'}
                    </h1>
                </motion.div>

                <div className="flex items-center gap-2 shrink-0">
                    <button 
                        onClick={onOpenSettings}
                        className="p-2.5 bg-white/60 backdrop-blur-md border border-white/80 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={onOpenHelp}
                        className="p-2.5 bg-white/60 backdrop-blur-md border border-white/80 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
                        title="Help"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Description Section */}
            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-slate-400 font-medium text-sm max-w-2xl"
            >
                {currentFolder 
                    ? currentFolder.description || `จัดการรายการทั้งหมดในโฟลเดอร์ ${currentFolder.name}`
                    : 'ศูนย์กลางการจัดการเครื่องมือและทรัพยากรภายนอกทั้งหมด เชื่อมต่อ และจัดการทุกอย่างได้ในที่เดียว'
                }
            </motion.p>
        </div>
    );
};

export default NexusNavigation;
