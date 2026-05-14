import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Zap, Sparkles, Target, ChevronRight } from 'lucide-react';
import { Task } from '../../../../types';

interface TaskSpecsSectionProps {
    task: Task;
    difficultyLevel: number;
    variants?: Variants;
    onOpenTask?: (task: Task) => void;
}

const TaskSpecsSection: React.FC<TaskSpecsSectionProps> = ({ task, difficultyLevel, variants, onOpenTask }) => {
    return (
        <motion.section variants={variants} className="space-y-4">
            <div className="flex items-center gap-2 text-slate-300 px-1">
                <Zap className="w-4 h-4" />
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">ข้อมูลเฉพาะของงาน</h4>
            </div>
            
            <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8"
            >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                    <div className="space-y-1">
                        <p className="text-[9px] sm:text-[10px] font-semibold text-slate-300 uppercase tracking-widest">ประเภท</p>
                        <p className="text-sm sm:text-lg font-semibold text-slate-600 truncate">{task.assigneeType || 'รายบุคคล'}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[9px] sm:text-[10px] font-semibold text-slate-300 uppercase tracking-widest">ตำแหน่ง</p>
                        <p className="text-sm sm:text-lg font-semibold text-slate-600 truncate">{task.targetPosition || 'ไม่ระบุ'}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[9px] sm:text-[10px] font-semibold text-slate-300 uppercase tracking-widest">ความยาก</p>
                        <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Sparkles 
                                    key={star} 
                                    className={`w-3 h-3 sm:w-4 sm:h-4 ${star <= difficultyLevel ? 'text-amber-300 fill-amber-300' : 'text-slate-100'}`} 
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[9px] sm:text-[10px] font-semibold text-slate-300 uppercase tracking-widest">ชั่วโมงงาน</p>
                        <p className="text-sm sm:text-lg font-semibold text-slate-600">{task.estimatedHours || 0} ชม.</p>
                    </div>
                </div>

                {task.contentId && (
                    <div className="pt-10 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-slate-300 mb-4 ml-1 uppercase tracking-[0.2em] text-[11px] font-bold">
                            <Target className="w-4 h-4" />
                            <span>การเชื่อมต่อโครงการหลัก</span>
                        </div>
                        <motion.div 
                            whileHover={{ y: -5 }}
                            onClick={() => onOpenTask && onOpenTask({ id: task.contentId, type: 'CONTENT', title: 'Loading...' } as Task)}
                            className="relative group cursor-pointer overflow-hidden rounded-[2rem] border border-indigo-100 bg-white"
                        >
                            {/* Ambient Glow */}
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="px-8 py-6 flex flex-col sm:flex-row items-center gap-6 relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shrink-0">
                                    <Target className="w-7 h-7" />
                                </div>
                                
                                <div className="flex-1 text-center sm:text-left">
                                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">Project Master</span>
                                        <Sparkles className="w-3 h-3 text-amber-400" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                                        เข้าดูรายละเอียดโครงการหลักและไฟล์งานต้นฉบับ
                                    </h4>
                                    <p className="text-xs text-slate-400 font-medium mt-1">ดูสคริปต์, ไฟล์แนบ และข้อมูลสำคัญของ Master Project นี้</p>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Indicator Line */}
                            <div className="absolute bottom-0 left-0 h-1 bg-indigo-500/0 group-hover:bg-indigo-500/100 transition-all duration-500 w-0 group-hover:w-full" />
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </motion.section>
    );
};

export default TaskSpecsSection;
