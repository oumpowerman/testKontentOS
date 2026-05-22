
import React, { useState } from 'react';
import { Eye, Heart, Share2, TrendingUp, Target, Bookmark, LucideIcon, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCompactNumber } from '../../../lib/utils';

interface MetricInfo {
    title: string;
    description: string;
    insight: string;
}

const METRIC_GLOSSARY: Record<string, MetricInfo> = {
    'ยอดการเข้าชมทั้งหมด': {
        title: 'Total Views (ยอดวิว)',
        description: 'จำนวนครั้งที่คอนเทนต์ถูกเปิดเล่นทั้งหมดในระยะเวลาที่เลือก',
        insight: 'หากตัวเลขนี้สูงแต่ Engagement ต่ำ อาจแปลว่าหน้าปก (Hook) ดี แต่เนื้อหาด้านในยังไม่ดึงดูดพอ'
    },
    'อัตราการมีส่วนร่วม': {
        title: 'Engagement Rate (ER%)',
        description: 'ค่าเฉลี่ยปฏิกิริยา (Like, Share, Comment) ต่อจำนวนคนเห็น',
        insight: 'มาตรฐาน Social Media อยู่ที่ 2-5% หากเกิน 5% ถือว่ายอดเยี่ยมมาก! คอนเทนต์นี้มีโอกาสเป็นไวรัล'
    },
    'ลำดับปฏิกิริยารวม': {
        title: 'Total Interactions',
        description: 'ผลรวมของ Like + Share + Comment + Save ทั้งหมด',
        insight: 'ใช้ดู "ปริมาณ" การตอบสนองโดยรวม เป็นตัววัดความแข็งแกร่งของชุมชนผู้ติดตาม'
    },
    'ยอดถูกใจ': {
        title: 'Likes (ความพึงพอใจ)',
        description: 'จำนวนการกดถูกใจหรือส่งหัวใจให้คอนเทนต์',
        insight: 'บอกถึงความพึงพอใจเบื้องต้น แต่ Share และ Save จะมีน้ำหนักในการดันฟีดมากกว่า'
    },
    'ยอดการแชร์': {
        title: 'Shares (การบอกต่อ)',
        description: 'จำนวนครั้งที่มีการแชร์คอนเทนต์ออกไปสู่ภายนอก',
        insight: 'ตัวแปรที่สำคัญที่สุดในการสร้าง Viral! ยิ่งแชร์เยอะ แพลตฟอร์มจะยิ่งเปิดการมองเห็นให้คนใหม่ๆ'
    }
};

interface StatCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    icon: LucideIcon;
    color: string;
    idx: number;
    onInfoClick: (label: string) => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, icon: Icon, color, idx, onInfoClick }) => {
    const colorMap: Record<string, string> = {
        indigo: 'text-indigo-600 bg-indigo-50',
        rose: 'text-rose-600 bg-rose-50',
        emerald: 'text-emerald-600 bg-emerald-50',
        amber: 'text-amber-600 bg-amber-50',
        violet: 'text-violet-600 bg-violet-50',
        blue: 'text-blue-600 bg-blue-50',
    };

    const colorClasses = colorMap[color] || colorMap.indigo;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, ease: "easeOut" }}
            className="group bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative"
        >
            <button 
                onClick={() => onInfoClick(label)}
                className="absolute top-4 right-4 p-1 text-slate-300 hover:text-indigo-500 transition-colors"
                title="ดูความหมาย"
            >
                <Info className="w-3.5 h-3.5" />
            </button>

            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 ${colorClasses}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                        {typeof value === 'number' ? formatCompactNumber(value) : value}
                    </h3>
                    {subValue && (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                            {subValue}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

interface AnalyticsStatsGridProps {
    summary: {
        totalViews: number;
        totalLikes: number;
        totalShares: number;
        avgEngagementRate: number;
        totalInteraction: number;
    }
}

const AnalyticsStatsGrid: React.FC<AnalyticsStatsGridProps> = ({ summary }) => {
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

    const stats = [
        { 
            label: 'ยอดการเข้าชมทั้งหมด', 
            value: summary.totalViews, 
            icon: Eye, 
            color: 'indigo' 
        },
        { 
            label: 'อัตราการมีส่วนร่วม', 
            value: `${summary.avgEngagementRate.toFixed(2)}%`, 
            subValue: '+2.4%',
            icon: TrendingUp, 
            color: 'emerald' 
        },
        { 
            label: 'ลำดับปฏิกิริยารวม', 
            value: summary.totalInteraction, 
            icon: Target, 
            color: 'violet' 
        },
        { 
            label: 'ยอดถูกใจ', 
            value: summary.totalLikes, 
            icon: Heart, 
            color: 'rose' 
        },
        { 
            label: 'ยอดการแชร์', 
            value: summary.totalShares, 
            icon: Share2, 
            color: 'blue' 
        },
    ];

    const metricInfo = selectedMetric ? METRIC_GLOSSARY[selectedMetric] : null;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
                {stats.map((stat, idx) => (
                    <StatCard 
                        key={idx} 
                        {...stat} 
                        idx={idx} 
                        onInfoClick={(label) => setSelectedMetric(label)}
                    />
                ))}
            </div>

            <AnimatePresence>
                {selectedMetric && metricInfo && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 relative">
                            <button 
                                onClick={() => setSelectedMetric(null)}
                                className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                <div className="p-3 bg-white rounded-xl shadow-sm border border-indigo-100 shrink-0">
                                    <div className="text-indigo-600 font-medium text-lg">คู่มือชี้วัด</div>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-indigo-900 font-medium text-base">{metricInfo.title}</h4>
                                    <p className="text-indigo-700 text-sm">{metricInfo.description}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded uppercase tracking-wider">มุมมองจากผู้เชี่ยวชาญ</span>
                                        <p className="text-indigo-600 text-xs font-semibold italic">"{metricInfo.insight}"</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AnalyticsStatsGrid;
