
import React from 'react';
import { Scale, AlertTriangle, ArrowRight } from 'lucide-react';
import { ViewMode } from '../../../../types';

interface TribunalStateProps {
    onNavigate: (view: ViewMode) => void;
}

const TribunalState: React.FC<TribunalStateProps> = ({ onNavigate }) => {
    return (
        <div className="relative overflow-hidden bg-[#FFFBEB] rounded-[2.5rem] p-8 text-amber-950 shadow-sm border border-amber-200/50 h-full flex flex-col justify-between items-center text-center group transition-all hover:shadow-md">
            {/* Subtle Decorative Element */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-200/20 rounded-full blur-3xl transform translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center gap-4 w-full my-auto">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-amber-100 shadow-md shrink-0">
                    <Scale className="w-8 h-8 text-amber-500 animate-[bounce_2s_infinite]" />
                </div>
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center border border-amber-200/50">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> TRIBUNAL
                        </span>
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-tight mb-2 text-amber-950">
                        โอกาสสุดท้าย <span className="text-amber-500">⚖️</span>
                    </h3>
                    <p className="text-amber-800/80 text-xs font-semibold max-w-[240px] leading-relaxed">
                        รีบไปล้างประพฤติและเคลียร์ความรับผิดชอบก่อนที่จะโดนหักคะแนน HP สำคัญของตัวละคร
                    </p>
                </div>
            </div>

            <button 
                onClick={() => onNavigate('DUTY')}
                className="relative z-10 flex items-center justify-center gap-2 px-6 py-4 bg-amber-500 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg hover:bg-amber-600 transition-all active:scale-95 w-full text-center"
            >
                🙏 ไปแก้ตัวเดี๋ยวนี้
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
};

export default TribunalState;
