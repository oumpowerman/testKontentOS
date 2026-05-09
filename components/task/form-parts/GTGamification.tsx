import React from 'react';
import { Star } from 'lucide-react';
import { Difficulty } from '../../../types';
import { DIFFICULTY_LABELS } from '../../../constants';
import { calculateTaskXP } from '../../../lib/gameLogic';
import { useGameConfig } from '../../../context/GameConfigContext';

interface GTGamificationProps {
    difficulty: Difficulty;
    setDifficulty: (val: Difficulty) => void;
    estimatedHours: number;
    setEstimatedHours: (val: number) => void;
}

const GTGamification: React.FC<GTGamificationProps> = ({ difficulty, setDifficulty, estimatedHours, setEstimatedHours }) => {
    const { config } = useGameConfig();
    const totalProjectedXP = calculateTaskXP({ difficulty, estimatedHours }, undefined, config).total;

    return (
        <div className="bg-emerald-50/50 p-5 rounded-[2rem] border border-emerald-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100 rounded-bl-full opacity-50 pointer-events-none"></div>
            <div className="flex justify-between items-center mb-4 relative z-10">
                <span className="text-xs font-bold text-emerald-700 uppercase flex items-center tracking-wider"><Star className="w-4 h-4 mr-1 fill-emerald-500" /> XP Calculator</span>
                <span className="text-md font-bold text-white bg-emerald-500 px-3 py-1 rounded-lg shadow-md shadow-emerald-200 border border-emerald-400">Proj: +{totalProjectedXP} XP</span>
            </div>
            <div className="grid grid-cols-2 gap-4 relative z-10">
                <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">Difficulty</label>
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl outline-none text-sm font-bold text-gray-600 cursor-pointer hover:border-emerald-300 transition-all focus:ring-2 focus:ring-emerald-100">
                        {Object.entries(DIFFICULTY_LABELS).map(([key, val]) => <option key={key} value={key}>{(val as any).label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">Est. Hours</label>
                    <input type="number" min="0" step="0.5" value={estimatedHours} onChange={(e) => setEstimatedHours(Number(e.target.value))} className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl outline-none text-sm font-bold text-gray-600 text-center hover:border-emerald-300 transition-all focus:ring-2 focus:ring-emerald-100" placeholder="0" />
                </div>
            </div>
        </div>
    );
};

export default GTGamification;