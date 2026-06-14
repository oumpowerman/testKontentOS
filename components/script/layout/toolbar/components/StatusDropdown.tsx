import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { ScriptStatus } from '../../../../../types/features';
import { FloatingPortal } from './FloatingPortal';

export const STATUS_CONFIG: Record<ScriptStatus, { label: string, color: string, icon: string }> = {
    DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: '📝' },
    REVIEW: { label: 'In Review', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: '👀' },
    FINAL: { label: 'Final', color: 'bg-green-50 text-green-700 border-green-200', icon: '✅' },
    SHOOTING: { label: 'Shooting', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: '🎬' },
    DONE: { label: 'Done', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '🏁' }
};

interface StatusDropdownProps {
    status: ScriptStatus;
    changeStatus: (status: ScriptStatus) => void;
    showStatusMenu: boolean;
    setShowStatusMenu: (isOpen: boolean) => void;
    statusBtnRef: React.RefObject<HTMLDivElement>;
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
    status,
    changeStatus,
    showStatusMenu,
    setShowStatusMenu,
    statusBtnRef,
}) => {
    return (
        <div className="relative shrink-0" ref={statusBtnRef}>
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={`
                    h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-2 transition-all border shadow-sm
                    ${STATUS_CONFIG[status].color} hover:shadow-md
                `}
            >
                <span className="text-base">{STATUS_CONFIG[status].icon}</span>
                {STATUS_CONFIG[status].label}
                <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
            </motion.button>
            
            <FloatingPortal 
                isOpen={showStatusMenu} 
                onClose={() => setShowStatusMenu(false)} 
                anchorRef={statusBtnRef}
                className="w-48 bg-white rounded-xl shadow-xl border border-indigo-50 p-2 animate-in fade-in zoom-in-95 origin-top-right"
                align="left"
            >
                {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                    <button 
                        key={key} 
                        type="button"
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            changeStatus(key as ScriptStatus); 
                            setShowStatusMenu(false); 
                        }} 
                        className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-between transition-colors mb-1 ${status === key ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <span className="flex items-center gap-2"><span className="text-base">{conf.icon}</span> {conf.label}</span>
                        {status === key && <Check className="w-3 h-3 text-indigo-600" />}
                    </button>
                ))}
            </FloatingPortal>
        </div>
    );
};
