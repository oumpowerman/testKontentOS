import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Users } from 'lucide-react';
import { Task, User } from '../../../../types';

interface TaskCrewSectionProps {
    task: Task;
    users: User[];
    variants?: Variants;
}

const TaskCrewSection: React.FC<TaskCrewSectionProps> = ({ task, users, variants }) => {
    const getUserById = (id: string) => users.find(u => u.id === id);

    return (
        <motion.section variants={variants} className="space-y-4">
            <div className="flex items-center gap-2 text-slate-300 px-1">
                <Users className="w-4 h-4" />
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Assigned Crew</h4>
            </div>
            <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6"
            >
                <div className="space-y-4">
                    <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-[0.2em]">Main Assignees</p>
                    <div className="flex flex-wrap gap-2.5">
                        {task.assigneeIds && task.assigneeIds.length > 0 ? (
                            task.assigneeIds.map(id => {
                                const user = getUserById(id);
                                return user ? (
                                    <motion.div 
                                        key={id} 
                                        whileHover={{ scale: 1.1, x: 5 }}
                                        className="group flex items-center gap-2 p-1 pr-3 bg-slate-50/50 border border-slate-100/50 rounded-full hover:bg-white hover:shadow-sm transition-all cursor-default"
                                    >
                                        <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover border-2 border-white" />
                                        <span className="text-[11px] font-semibold text-slate-500">{user.name}</span>
                                    </motion.div>
                                ) : null;
                            })
                        ) : (
                            <p className="text-xs text-slate-200 italic">No assignees linked</p>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.section>
    );
};

export default TaskCrewSection;
