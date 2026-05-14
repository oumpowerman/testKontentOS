import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';
import { Task } from '../../../../types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface TaskMetricsSectionProps {
    task: Task;
    priorityInfo: {
        label: string;
        color: string;
        icon: React.ElementType;
    };
    variants?: Variants;
    bouncyHover?: any;
}

const TaskMetricsSection: React.FC<TaskMetricsSectionProps> = ({ task, priorityInfo, variants, bouncyHover }) => {
    return (
        <motion.section variants={variants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
                whileHover={bouncyHover}
                className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 transition-all duration-500"
            >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-${priorityInfo.color}-50 text-${priorityInfo.color}-400 flex items-center justify-center shrink-0`}>
                    <priorityInfo.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                    <p className="text-[9px] sm:text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">ความสำคัญ</p>
                    <p className={`text-base sm:text-lg font-semibold text-${priorityInfo.color}-500`}>{priorityInfo.label}</p>
                </div>
            </motion.div>

            <motion.div 
                whileHover={bouncyHover}
                className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 transition-all duration-500"
            >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-sky-50 text-sky-300 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                    <p className="text-[9px] sm:text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">วันกำหนดส่ง</p>
                    <p className="text-base sm:text-lg font-semibold text-slate-600 truncate">
                        {task.endDate ? format(new Date(task.endDate), 'd MMM yyyy', { locale: th }) : 'ไม่ระบุ'}
                    </p>
                </div>
            </motion.div>

            <motion.div 
                whileHover={bouncyHover}
                className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 transition-all duration-500"
            >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-300 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                    <p className="text-[9px] sm:text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">ระยะเวลา</p>
                    <p className="text-base sm:text-lg font-semibold text-slate-600 truncate">
                        {task.startDate && task.endDate ? (
                            `${format(new Date(task.startDate), 'd MMM', { locale: th })} - ${format(new Date(task.endDate), 'd MMM', { locale: th })}`
                        ) : 'ไม่ระบุ'}
                    </p>
                </div>
            </motion.div>
        </motion.section>
    );
};

export default TaskMetricsSection;
