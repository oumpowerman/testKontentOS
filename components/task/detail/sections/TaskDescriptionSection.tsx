import React from 'react';
import { motion, Variants } from 'framer-motion';
import { FileText, AlertTriangle, Target, Info, Tag } from 'lucide-react';
import Markdown from 'react-markdown';
import { Task } from '../../../../types';

interface TaskDescriptionSectionProps {
    task: Task;
    variants?: Variants;
    showAlert: (message: string, title?: string) => void;
}

const TaskDescriptionSection: React.FC<TaskDescriptionSectionProps> = ({ task, variants, showAlert }) => {
    return (
        <motion.section variants={variants} className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-slate-300 px-1">
                <FileText className="w-4 h-4" />
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">รายละเอียดงาน</h4>
            </div>
            <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-h-[250px] relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-100/30 via-purple-100/30 to-pink-100/30" />
                <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-p:text-slate-500 prose-p:leading-relaxed prose-strong:text-slate-700">
                    {task.description ? (
                        <Markdown>{task.description}</Markdown>
                    ) : (
                        <p className="italic text-slate-200 text-lg">ไม่มีรายละเอียดสำหรับงานนี้</p>
                    )}
                </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div 
                    whileHover={task.caution ? { scale: 1.02, y: -2 } : {}}
                    onClick={() => task.caution && showAlert(task.caution, 'รายละเอียดข้อควรระวัง')}
                    className={`group p-6 rounded-[2rem] border flex gap-4 transition-all duration-300 ${
                        task.caution 
                            ? 'bg-rose-50/20 border-rose-200/30 cursor-pointer shadow-sm' 
                            : 'bg-slate-50/30 border-slate-100/30 opacity-60'
                    }`}
                >
                    <AlertTriangle className={`w-6 h-6 shrink-0 ${task.caution ? 'text-rose-400' : 'text-slate-200'}`} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <p className={`text-[10px] font-semibold uppercase tracking-widest ${task.caution ? 'text-rose-500' : 'text-slate-400'}`}>
                                ข้อควรระวัง
                            </p>
                            {task.caution && <span className="w-1 h-1 rounded-full bg-rose-300 animate-pulse" />}
                        </div>
                        <p className={`text-sm leading-relaxed line-clamp-2 ${task.caution ? 'text-rose-600/70 font-medium' : 'text-slate-300 italic'}`}>
                            {task.caution || 'ไม่มีข้อควรระวังพิเศษ'}
                        </p>
                        {task.caution && (
                            <p className="mt-2 text-[9px] text-rose-400 font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                                คลิกเพื่ออ่านเพิ่มเติม
                            </p>
                        )}
                    </div>
                </motion.div>

                <motion.div 
                    whileHover={task.importance ? { scale: 1.02, y: -2 } : {}}
                    onClick={() => task.importance && showAlert(task.importance, 'รายละเอียดสิ่งสำคัญ')}
                    className={`group p-6 rounded-[2rem] border flex gap-4 transition-all duration-300 ${
                        task.importance 
                            ? 'bg-indigo-50/20 border-indigo-200/30 cursor-pointer shadow-sm' 
                            : 'bg-slate-50/30 border-slate-100/30 opacity-60'
                    }`}
                >
                    <Target className={`w-6 h-6 shrink-0 ${task.importance ? 'text-indigo-400' : 'text-slate-200'}`} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <p className={`text-[10px] font-semibold uppercase tracking-widest ${task.importance ? 'text-indigo-500' : 'text-slate-400'}`}>
                                จุดเน้นสำคัญ
                            </p>
                            {task.importance && <span className="w-1 h-1 rounded-full bg-indigo-300 animate-pulse" />}
                        </div>
                        <p className={`text-sm leading-relaxed line-clamp-2 ${task.importance ? 'text-indigo-600/70 font-medium' : 'text-slate-300 italic'}`}>
                            {task.importance || 'ไม่มีจุดเน้นพิเศษ'}
                        </p>
                        {task.importance && (
                            <p className="mt-2 text-[9px] text-indigo-400 font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                                คลิกเพื่ออ่านเพิ่มเติม
                            </p>
                        )}
                    </div>
                </motion.div>
            </div>

            {task.remark && (
                <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="bg-amber-50/20 p-6 rounded-[2rem] border border-amber-100/20 flex gap-4"
                >
                    <Info className="w-6 h-6 text-amber-300 shrink-0" />
                    <div>
                        <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-widest mb-1">หมายเหตุ</p>
                        <p className="text-sm text-amber-700/70 leading-relaxed font-medium">{task.remark}</p>
                    </div>
                </motion.div>
            )}

            {/* Tags / Hashtags Row */}
            {task.tags && task.tags.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.2 }}
                    className="bg-white p-5 rounded-[2rem] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col gap-3"
                >
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                        <Tag className="w-3.5 h-3.5 text-slate-400 stroke-[2]" /> แท็กที่เกี่ยวข้อง (Tags)
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                        {task.tags.map((tag, idx) => {
                            const schemes = [
                                { cls: 'bg-indigo-50/50 text-indigo-600 hover:bg-indigo-100/70 border-indigo-100/60 shadow-sm' }, // Indigo/Violet
                                { cls: 'bg-rose-50/50 text-rose-600 hover:bg-rose-100/70 border-rose-100/60 shadow-sm' }, // Rose/Pink
                                { cls: 'bg-emerald-50/50 text-emerald-600 hover:bg-emerald-100/70 border-emerald-100/60 shadow-sm' }, // Emerald
                                { cls: 'bg-amber-50/50 text-amber-600 hover:bg-amber-100/70 border-amber-100/60 shadow-sm' }, // Amber
                                { cls: 'bg-sky-50/50 text-sky-600 hover:bg-sky-100/70 border-sky-100/60 shadow-sm' }, // Sky/Blue
                            ];
                            const scheme = schemes[idx % schemes.length];
                            return (
                                <motion.span 
                                    key={tag} 
                                    whileHover={{ 
                                        scale: 1.04, 
                                        y: -1
                                    }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    className={`px-3 py-1 ${scheme.cls} rounded-xl text-xs font-semibold border transition-all duration-150 flex items-center select-none cursor-default`}
                                >
                                    <span className="opacity-40 mr-1 text-[10px] font-bold">#</span>
                                    {tag}
                                </motion.span>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </motion.section>
    );
};

export default TaskDescriptionSection;
