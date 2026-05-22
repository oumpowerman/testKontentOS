
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Tag } from 'lucide-react';
import { Task } from '../../../../types';
import { useMasterData } from '../../../../hooks/useMasterData';

interface StrategySectionProps {
    task: Task;
}

const StrategySection: React.FC<StrategySectionProps> = ({ task }) => {
    const { masterOptions } = useMasterData();

    const getOptionLabel = (key: string | undefined, type: string) => {
        if (!key) return 'ไม่ระบุ';
        const option = masterOptions.find(o => o.key === key && o.type === type);
        return option?.label || key;
    };

    const bouncyHover = {
        scale: 1.03,
        y: -4,
        transition: { type: 'spring', stiffness: 400, damping: 12 }
    } as const;

    return (
        <motion.section 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <div className="flex items-center gap-2 text-slate-300 px-1">
                <Sparkles className="w-4 h-4" />
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Strategy & Identity</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Pillar Card */}
                <motion.div 
                    whileHover={bouncyHover}
                    className="group relative overflow-hidden bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500"
                >
                    <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-3">Content Pillar</p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-300 flex items-center justify-center">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <p className="text-lg font-semibold text-slate-600">{getOptionLabel(task.pillar, 'PILLAR')}</p>
                    </div>
                </motion.div>

                {/* Category Card */}
                <motion.div 
                    whileHover={bouncyHover}
                    className="group relative overflow-hidden bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500"
                >
                    <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-3">Category</p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-300 flex items-center justify-center">
                            <Tag className="w-5 h-5" />
                        </div>
                        <p className="text-lg font-semibold text-slate-600">{getOptionLabel(task.category, 'CATEGORY')}</p>
                    </div>
                </motion.div>

                {/* Format Card */}
                <motion.div 
                    whileHover={bouncyHover}
                    className="group relative overflow-hidden bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 sm:col-span-2"
                >
                    <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-3">Content Format</p>
                    <div className="flex flex-wrap gap-2">
                        {task.contentFormats && task.contentFormats.length > 0 ? (
                            task.contentFormats.map(f => (
                                <span key={f} className="px-4 py-2 bg-amber-50 text-amber-500 rounded-xl text-sm font-semibold border border-amber-100 shadow-sm">
                                    {getOptionLabel(f, 'FORMAT')}
                                </span>
                            ))
                        ) : (
                            <span className="text-slate-400 text-sm font-medium italic">Unspecified</span>
                        )}
                    </div>
                </motion.div>
            </div>

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

export default StrategySection;
