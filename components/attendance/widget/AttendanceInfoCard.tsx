
import React from 'react';
import { TrendingUp, Clock, Award, ShieldCheck, Sparkles } from 'lucide-react';

const AttendanceInfoCard: React.FC = () => {
    return (
        <div className="h-full min-h-[400px] bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-center shadow-2xl border border-indigo-700/50">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-[0.03] rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 opacity-10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none animate-pulse"></div>

            <div className="relative z-10">
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 mb-4">
                        <Sparkles className="w-3 h-3 text-yellow-300" />
                        <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Tips for Professional</span>
                    </div>
                    <h3 className="text-3xl font-bold tracking-tight text-white leading-tight">
                        Why Time Matters? <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200">ทำไมเวลาถึงสำคัญ?</span>
                    </h3>
                </div>

                <div className="space-y-4">
                    {/* Item 1 */}
                    <div className="group flex items-start gap-4 bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 transition-all duration-300 hover:border-white/20 hover:scale-[1.02]">
                        <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-300 group-hover:text-white group-hover:bg-indigo-500 transition-colors">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-base text-white">ความแม่นยำ (Accuracy)</h4>
                            <p className="text-xs text-indigo-200/80 mt-1 leading-relaxed">
                                ข้อมูลเวลาที่ถูกต้อง ช่วยให้การคำนวณเงินเดือนและ OT เป๊ะ ไม่ตกหล่น
                            </p>
                        </div>
                    </div>

                    {/* Item 2 */}
                    <div className="group flex items-start gap-4 bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 transition-all duration-300 hover:border-white/20 hover:scale-[1.02]">
                        <div className="p-2.5 bg-yellow-500/20 rounded-xl text-yellow-300 group-hover:text-white group-hover:bg-yellow-500 transition-colors">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-base text-white">ผลประเมิน (KPI Impact)</h4>
                            <p className="text-xs text-indigo-200/80 mt-1 leading-relaxed">
                                วินัยการเข้างานส่งผลโดยตรงต่อคะแนนประเมินประจำปีและโบนัส
                            </p>
                        </div>
                    </div>

                    {/* Item 3 */}
                    <div className="group flex items-start gap-4 bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 transition-all duration-300 hover:border-white/20 hover:scale-[1.02]">
                        <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-300 group-hover:text-white group-hover:bg-emerald-500 transition-colors">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-base text-white">ความน่าเชื่อถือ (Trust)</h4>
                            <p className="text-xs text-indigo-200/80 mt-1 leading-relaxed">
                                สร้างมาตรฐานการทำงานแบบมืออาชีพ และได้รับความไว้วางใจจากทีม
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <p className="text-[10px] text-indigo-300 font-medium">
                        "Punctuality is the soul of business."
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AttendanceInfoCard;
