import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Task, User } from '../../../types';
import TaskMetricsSection from './sections/TaskMetricsSection';
import TaskSpecsSection from './sections/TaskSpecsSection';
import TaskDescriptionSection from './sections/TaskDescriptionSection';
import TaskCrewSection from './sections/TaskCrewSection';

interface TaskInfoViewProps {
    task: Task;
    users: User[];
    difficultyLevel: number;
    showAlert: (message: string, title?: string) => void;
    onOpenTask?: (task: Task) => void;
    priorityInfo: {
        label: string;
        color: string;
        icon: React.ElementType;
    };
    sectionVariants: Variants;
    bouncyHover: any;
}

const TaskInfoView: React.FC<TaskInfoViewProps> = ({
    task,
    users,
    difficultyLevel,
    showAlert,
    onOpenTask,
    priorityInfo,
    sectionVariants,
    bouncyHover
}) => {
    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-10 scrollbar-none">
            {/* --- SECTION 1: KEY METRICS --- */}
            <TaskMetricsSection 
                task={task} 
                priorityInfo={priorityInfo} 
                variants={sectionVariants} 
                bouncyHover={bouncyHover} 
            />

            {/* --- SECTION 2: TASK BENTO --- */}
            <TaskSpecsSection 
                task={task} 
                difficultyLevel={difficultyLevel} 
                variants={sectionVariants} 
                onOpenTask={onOpenTask} 
            />

            {/* --- SECTION 3: DESCRIPTION & TEAM --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <TaskDescriptionSection 
                    task={task} 
                    variants={sectionVariants} 
                    showAlert={showAlert} 
                />

                <TaskCrewSection 
                    task={task} 
                    users={users} 
                    variants={sectionVariants} 
                />
            </div>
        </div>
    );
};

export default TaskInfoView;
