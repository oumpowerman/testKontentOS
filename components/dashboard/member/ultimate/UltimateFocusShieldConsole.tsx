import React from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Award } from 'lucide-react';
import { Task } from '../../../../types';
import { SynthType } from './useAudioSynth';

interface UltimateFocusShieldConsoleProps {
    doingTasks: Task[];
    selectedFocusTaskId: string;
    onSelectedFocusTaskIdChange: (id: string) => void;
    pomodoroSeconds: number;
    timerType: 'WORK' | 'BREAK';
    isTimerRunning: boolean;
    toggleTimer: () => void;
    resetTimer: () => void;
    isAudioSynthPlaying: boolean;
    synthType: SynthType;
    onSynthTypeChange: (type: SynthType) => void;
    toggleSynth: () => void;
}

export const UltimateFocusShieldConsole: React.FC<UltimateFocusShieldConsoleProps> = ({
    doingTasks,
    selectedFocusTaskId,
    onSelectedFocusTaskIdChange,
    pomodoroSeconds,
    timerType,
    isTimerRunning,
    toggleTimer,
    resetTimer,
    isAudioSynthPlaying,
    synthType,
    onSynthTypeChange,
    toggleSynth
}) => {
    return (
        <div 
            id="ultimate-focus-shield" 
            className="lg:col-span-7 bg-slate-900/50 hover:bg-slate-900/80 border border-white/10 rounded-[2.5rem] p-6 relative overflow-hidden backdrop-blur-md transition-all duration-300"
        >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                {/* TEXT INFO */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                            <Award className="w-4 h-4 animate-spin-slow" />
                        </span>
                        <h3 className="text-sm font-black text-white">Focus Pomodoro Shield (โหมดเพ่งสติสลายตั๋วงาน)</h3>
                    </div>
                    <p className="text-[11px] text-slate-400">
                        ตั้งสติและปิดตาบอร์ดอื่นเพื่อพิชิตงานเดี่ยวที่กำลัง "ลุย" ทีละเรื่องอย่างมีประสิทธิภาพ!
                    </p>

                    {/* SELECTOR FOR ACTIVE FOCUS TARGET */}
                    <div className="pt-2">
                        <label className="block text-[9px] font-black uppercase text-indigo-400 mb-1">เลือกเป้าหมายโฟกัสปัจจุบัน:</label>
                        {doingTasks.length > 0 ? (
                            <select
                                value={selectedFocusTaskId}
                                onChange={(e) => onSelectedFocusTaskIdChange(e.target.value)}
                                className="bg-black/40 border border-white/10 text-xs text-white rounded-xl px-3 py-1.5 w-full max-w-[280px] focus:outline-none focus:border-indigo-500 text-left font-bold"
                            >
                                {doingTasks.map(t => (
                                    <option key={t.id} value={t.id} className="bg-slate-950 text-white">
                                        🎯 {t.title.length > 25 ? `${t.title.slice(0, 25)}...` : t.title}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="text-[10px] text-rose-400 font-extrabold bg-rose-950/20 border border-rose-800/10 p-2 rounded-xl">
                                ⚠️ กรุณาย้ายงานอย่างน้อย 1 ใบไปในช่อง "Doing (กำลังทำ)" ก่อนเปิด Focus Mode
                            </div>
                        )}
                    </div>
                </div>

                {/* HIGH DESIGN COUNTDOWN COMPONENT */}
                <div className="flex items-center gap-5 bg-black/30 border border-white/5 py-4 px-6 rounded-3xl w-full md:w-auto justify-center">
                    <div className="text-center">
                        <span className="text-[10px] font-black tracking-widest text-indigo-400/80 uppercase block">
                            {timerType === 'WORK' ? '⚔️ WORK SPRINT' : '🧘 BREAK SQUAT'}
                        </span>
                        <span className="text-3xl md:text-4.5xl font-extrabold text-white font-mono leading-none tracking-tighter mt-1 block">
                            {Math.floor(pomodoroSeconds / 60).toString().padStart(2, '0')}
                            <span className="animate-pulse text-indigo-400">:</span>
                            {(pomodoroSeconds % 60).toString().padStart(2, '0')}
                        </span>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={toggleTimer}
                            title={isTimerRunning ? 'Pause' : 'Start'}
                            className={`p-2 rounded-xl transition-all duration-300 pointer-events-auto cursor-pointer ${
                                isTimerRunning 
                                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400' 
                                    : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                            }`}
                        >
                            {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-white fill-white" />}
                        </button>
                        <button
                            type="button"
                            onClick={resetTimer}
                            title="Reset timer"
                            className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all duration-300 pointer-events-auto cursor-pointer"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* BINAURAL SOUND WAVE PRODUCER */}
            <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                    <span className="p-2 bg-indigo-950/50 rounded-xl text-indigo-400">
                        <Volume2 className="w-4 h-4" />
                    </span>
                    <div>
                        <h4 className="text-[11px] font-extrabold text-white">คลื่นเสียงสังเคราะห์สมาธิ (Binaural beats synth)</h4>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                            ใช้ Web Audio API สังเคราะห์ความถี่คลื่นความสงบระนาบหูทั้งสองข้างแบบต่อเนื่อง
                        </p>
                    </div>
                </div>

                {/* SELECT SOUNDS */}
                <div className="flex items-center gap-2">
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                        <button
                            type="button"
                            onClick={() => onSynthTypeChange('BINAURAL')}
                            className={`px-2 py-1 rounded-lg text-[9.5px] font-black uppercase transition-all ${
                                synthType === 'BINAURAL' ? 'bg-indigo-500/30 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Focus Delta
                        </button>
                        <button
                            type="button"
                            onClick={() => onSynthTypeChange('OCEAN_RUMBLE')}
                            className={`px-2 py-1 rounded-lg text-[9.5px] font-black uppercase transition-all ${
                                synthType === 'OCEAN_RUMBLE' ? 'bg-pink-500/30 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Sea Rumble
                        </button>
                        <button
                            type="button"
                            onClick={() => onSynthTypeChange('CHIPTUNE')}
                            className={`px-2 py-1 rounded-lg text-[9.5px] font-black uppercase transition-all ${
                                synthType === 'CHIPTUNE' ? 'bg-purple-500/30 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Cozy 8-bit
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={toggleSynth}
                        className={`px-4 py-1.5 rounded-xl font-extrabold text-[10px] flex items-center gap-1.5 transition-all duration-300 pointer-events-auto cursor-pointer ${
                            isAudioSynthPlaying 
                                ? 'bg-rose-500 text-white hover:bg-rose-600' 
                                : 'bg-emerald-500 text-white hover:bg-emerald-600'
                        }`}
                    >
                        {isAudioSynthPlaying ? (
                            <>
                                <VolumeX className="w-3.5 h-3.5" />
                                <span>หยุดเสียงเพลง</span>
                            </>
                        ) : (
                            <>
                                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                                <span>บรรเลงคลื่นเสียง 🎧</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UltimateFocusShieldConsole;
