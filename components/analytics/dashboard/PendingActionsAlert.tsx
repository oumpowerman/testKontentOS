
import React from 'react';
import { AlertCircle, ArrowRight, Brain, CalendarClock } from 'lucide-react';
import { Task } from '../../../types';
import { motion } from 'framer-motion';

interface PendingActionsAlertProps {
    pendingTasks: Task[];
    onAction: (task: Task) => void;
}

const PendingActionsAlert: React.FC<PendingActionsAlertProps> = ({ pendingTasks, onAction }) => {
    if (pendingTasks.length === 0) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group"
        >
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
            <div className="relative bg-white border border-amber-100 rounded-[2rem] p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0 border border-amber-100">
                    <CalendarClock className="w-8 h-8 text-amber-500" />
                </div>
                
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        พบ {pendingTasks.length} รายการที่ครบกำหนดบันทึกสถิติแล้ว
                    </h3>
                    <p className="text-slate-500 font-medium mt-1">
                        คอนเทนต์ด้านล่างนี้ลงไปเกิน 7 วันแล้ว ต้องการข้อมูลเพื่อวิเคราะห์ผลครับ
                    </p>
                    
                    {/* List of pending items */}
                    <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                        {pendingTasks.slice(0, 3).map((task) => (
                            <button 
                                key={task.id}
                                onClick={() => onAction(task)}
                                className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] font-bold text-amber-700 hover:bg-amber-100 transition-colors flex items-center gap-2 max-w-[200px]"
                            >
                                <span className="truncate">{task.title}</span>
                                <ArrowRight className="w-3 h-3 shrink-0" />
                            </button>
                        ))}
                        {pendingTasks.length > 3 && (
                            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-400">
                                และอีก {pendingTasks.length - 3} รายการ...
                            </div>
                        )}
                    </div>
                </div>

                <div className="hidden lg:flex -space-x-3 overflow-hidden">
                    {pendingTasks.slice(0, 5).map((task, idx) => (
                        <div key={task.id} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                           <span className="text-[10px] font-bold text-slate-400 capitalize">{task.title.charAt(0)}</span>
                        </div>
                    ))}
                    {pendingTasks.length > 5 && (
                        <div className="w-10 h-10 rounded-full border-2 border-white bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-600 shadow-sm">
                            +{pendingTasks.length - 5}
                        </div>
                    )}
                </div>

                <button 
                    onClick={() => onAction(pendingTasks[0])}
                    className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-amber-500 hover:text-black transition-all shadow-lg active:scale-95 whitespace-nowrap"
                >
                    เริ่มกรอกข้อมูล <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </motion.div>
    );
};

export default PendingActionsAlert;
