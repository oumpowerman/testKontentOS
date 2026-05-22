
import React, { useState } from 'react';
import { 
    Brain, FileText, Calendar, Coffee, LayoutTemplate, MessageSquare, Trophy, User
} from 'lucide-react';
import GuideHeader from './guide/GuideHeader';
import GuideKeywords from './guide/GuideKeywords';
import GuideMember from './guide/GuideMember';
import GuideContent from './guide/GuideContent';
import GuideScript from './guide/GuideScript';
import GuideMeeting from './guide/GuideMeeting';
import GuideDuty from './guide/GuideDuty';
import GuideGame from './guide/GuideGame';

const SystemLogicGuide: React.FC = () => {
    const [activeSection, setActiveSection] = useState('KEYWORDS');

    const SECTIONS = [
        { id: 'KEYWORDS', label: '🧠 The Brain (Keywords)', icon: Brain, color: 'text-pink-500' },
        { id: 'MEMBER', label: '👤 Member View', icon: User, color: 'text-green-500' },
        { id: 'CONTENT', label: '🎬 Content & Tasks', icon: LayoutTemplate, color: 'text-indigo-500' },
        { id: 'SCRIPT', label: '📝 Script Hub', icon: FileText, color: 'text-rose-500' },
        { id: 'MEETING', label: '🗣️ Meeting Room', icon: MessageSquare, color: 'text-blue-500' },
        { id: 'DUTY', label: '🧹 Duty & Swaps', icon: Coffee, color: 'text-amber-500' },
        { id: 'GAME', label: '🎮 Gamification', icon: Trophy, color: 'text-purple-500' },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 animate-in fade-in duration-500 font-sans">
            <GuideHeader />

            {/* Navigation Tabs */}
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-6">
                {SECTIONS.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`
                                flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold whitespace-nowrap transition-all border-2
                                ${isActive 
                                    ? 'bg-white text-slate-800 border-indigo-600 shadow-lg shadow-indigo-100 ring-4 ring-indigo-50 transform -translate-y-1' 
                                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:bg-slate-50'}
                            `}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? section.color : 'text-slate-400'}`} />
                            {section.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Rendering based on Active Tab */}
            {activeSection === 'KEYWORDS' && <GuideKeywords />}
            {activeSection === 'MEMBER' && <GuideMember />}
            {activeSection === 'CONTENT' && <GuideContent />}
            {activeSection === 'SCRIPT' && <GuideScript />}
            {activeSection === 'MEETING' && <GuideMeeting />}
            {activeSection === 'DUTY' && <GuideDuty />}
            {activeSection === 'GAME' && <GuideGame />}
        </div>
    );
};

export default SystemLogicGuide;
