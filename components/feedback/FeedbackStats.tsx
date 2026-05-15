
import React from 'react';
import { FeedbackItem } from '../../types';
import { Quote, Sparkles, Zap } from 'lucide-react';

interface FeedbackStatsProps {
    stats?: { shoutouts: number, ideas: number, totalEngagement: number };
    items?: FeedbackItem[]; // Keep for backward compatibility if needed
}

const FeedbackStats: React.FC<FeedbackStatsProps> = ({ stats, items = [] }) => {
    // If stats are provided (Enterprise mode), use them. Otherwise fallback to client calculation.
    const shoutouts = stats ? stats.shoutouts : items.filter(i => i.status === 'APPROVED' && i.type === 'SHOUTOUT').length;
    const ideas = stats ? stats.ideas : items.filter(i => i.status === 'APPROVED' && i.type === 'IDEA').length;
    
    const totalEngagement = stats ? stats.totalEngagement : items.filter(i => i.status === 'APPROVED').reduce((acc, curr) => 
        acc + (curr.voteCount || 0) + (curr.commentCount || 0) + (curr.repostCount || 0), 0
    );

    return (
        <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-pink-50 p-4 rounded-3xl border border-pink-100 text-center shadow-sm">
                    <div className="text-2xl font-black text-pink-500 mb-1">{shoutouts}</div>
                    <div className="text-[10px] font-black text-pink-400 uppercase tracking-wider">Shoutouts</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100 text-center shadow-sm">
                    <div className="text-2xl font-black text-amber-500 mb-1">{ideas}</div>
                    <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Ideas</div>
                </div>
            </div>

            {/* Engagement Card */}
            <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100 flex items-center justify-between shadow-sm">
                <div>
                    <div className="text-2xl font-black text-indigo-600 leading-none">{totalEngagement}</div>
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mt-1">Total Engagement</div>
                </div>
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Zap className="w-5 h-5 text-white fill-white" />
                </div>
            </div>

            {/* Quote of the day */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[32px] p-6 text-white relative overflow-hidden shadow-xl">
                <Quote className="absolute top-4 left-4 w-8 h-8 text-white/20 fill-white/20" />
                <div className="relative z-10 text-center">
                    <p className="text-sm font-medium leading-relaxed italic mb-4">
                        "Feedback is the breakfast of champions."
                    </p>
                    <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">
                        — Ken Blanchard
                    </p>
                </div>
                <Sparkles className="absolute bottom-[-10px] right-[-10px] w-24 h-24 text-white/10 animate-pulse" />
            </div>
        </div>
    );
};

export default FeedbackStats;
