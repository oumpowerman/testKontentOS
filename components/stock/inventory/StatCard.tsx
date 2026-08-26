
import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    colorClass: string;
    delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, colorClass, delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
                </div>
                {subtitle && (
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">
                        {subtitle}
                    </span>
                )}
            </div>
            <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-tight">{title}</h3>
                <div className="text-3xl font-black text-gray-800 tabular-nums">
                    {value}
                </div>
            </div>
        </motion.div>
    );
};

export default StatCard;
