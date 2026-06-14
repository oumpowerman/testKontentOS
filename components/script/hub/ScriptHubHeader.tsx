
import React from 'react';
import { FileText, Plus, Sparkles, Info, User, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ScriptModeSwitcher, { ScriptHubMode } from './ScriptModeSwitcher';

interface ScriptHubHeaderProps {
    onCreateClick: () => void;
    onInfoClick?: () => void; // New prop
    mode: ScriptHubMode;
    onModeChange: (mode: ScriptHubMode) => void;
    selectedBg: string;
    onBgChange: (bg: string) => void;
}

const ScriptHubHeader: React.FC<ScriptHubHeaderProps> = ({ 
    onCreateClick, 
    onInfoClick, 
    mode = 'HUB',
    onModeChange,
    selectedBg,
    onBgChange
}) => {
    const isStudio = mode === 'STUDIO';
    const [isBgMenuOpen, setIsBgMenuOpen] = React.useState(false);

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 relative group transition-all duration-500 overflow-visible">
            {/* Decorative Background with dedicated overflow clipping */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0">
                <div className={`
                    absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl rounded-bl-[100px] opacity-60 transition-transform duration-700 group-hover:scale-110
                    ${isStudio ? 'from-indigo-50 to-violet-50' : 'from-rose-50 to-orange-50'}
                `}></div>
            </div>

            {/* Mode Switcher - Top Right */}
            <div className="absolute top-4 right-4 z-20 overflow-visible">
                <ScriptModeSwitcher 
                    mode={mode} 
                    onChange={onModeChange} 
                    className="scale-90 origin-top-right opacity-80 hover:opacity-100 transition-opacity"
                />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 overflow-visible">
                <div className="overflow-visible">
                    <div className="flex items-center gap-3 mb-2 overflow-visible">
                         <div className={`p-2 rounded-xl shadow-sm transition-colors duration-500 ${isStudio ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
                            {isStudio ? <User className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                            {isStudio ? 'My Studio' : 'Script Hub'}
                        </h1>
                        
                        {/* Wallpaper Ambient Trigger & Info Group */}
                        <div className="flex items-center gap-1.5 overflow-visible">
                            {/* Wallpaper Selector */}
                            <div className="relative overflow-visible">
                                <button 
                                    onClick={() => setIsBgMenuOpen(!isBgMenuOpen)}
                                    className={`p-1.5 bg-white/80 hover:bg-white rounded-full transition-all shadow-sm border border-gray-100 active:scale-95 ${isStudio ? 'text-gray-400 hover:text-indigo-500' : 'text-gray-400 hover:text-rose-500'}`}
                                    title="เปลี่ยนวอลเปเปอร์ / บรรยากาศพื้นหลัง"
                                    type="button"
                                >
                                    <Image className="w-5 h-5 text-slate-500" />
                                </button>
                                
                                <AnimatePresence>
                                    {isBgMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsBgMenuOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute left-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-2.5 z-20"
                                            >
                                                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block px-2.5 py-1 mb-1 select-none">
                                                    เปลี่ยนบรรยากาศสีพื้นหลัง
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onBgChange('default');
                                                        setIsBgMenuOpen(false);
                                                    }}
                                                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 select-none cursor-pointer ${selectedBg === 'default' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 border border-slate-200" />
                                                    🍊 แอมเบอร์ (ดั้งเดิม)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onBgChange('sunset');
                                                        setIsBgMenuOpen(false);
                                                    }}
                                                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 select-none cursor-pointer ${selectedBg === 'sunset' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-indigo-300 to-rose-300 border border-slate-200" />
                                                    🌅 ภูเขาพระอาทิตย์ทะเลสาบ
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onBgChange('midnight');
                                                        setIsBgMenuOpen(false);
                                                    }}
                                                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 select-none cursor-pointer ${selectedBg === 'midnight' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700" />
                                                    🌌 ค่ำคืนสงบ (Midnight)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onBgChange('rainbow');
                                                        setIsBgMenuOpen(false);
                                                    }}
                                                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 select-none cursor-pointer ${selectedBg === 'rainbow' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-pink-200 via-indigo-100 to-sky-200 border border-slate-200" />
                                                    🌈 สายรุ้งพาสเทลเบาๆ
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onBgChange('beach');
                                                        setIsBgMenuOpen(false);
                                                    }}
                                                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 select-none cursor-pointer ${selectedBg === 'beach' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-sky-300 to-emerald-200 border border-slate-200" />
                                                    🌴 ริมชายหาด ทะเลเลื่อนไหว
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onBgChange('rainbow-sky');
                                                        setIsBgMenuOpen(false);
                                                    }}
                                                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 select-none cursor-pointer ${selectedBg === 'rainbow-sky' ? 'bg-pink-50 text-pink-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-pink-200 via-purple-200 to-sky-200 border border-slate-200" />
                                                    🌈 ก้อนเมฆ & สายรุ้ง
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Info Button */}
                            {onInfoClick && (
                                <button 
                                    onClick={onInfoClick}
                                    className={`p-1.5 bg-white/80 hover:bg-white rounded-full transition-all shadow-sm border border-gray-100 active:scale-95 ${isStudio ? 'text-gray-400 hover:text-indigo-500' : 'text-gray-400 hover:text-rose-500'}`}
                                    title="คู่มือการใช้งาน"
                                    type="button"
                                >
                                    <Info className="w-5 h-5 text-slate-500" />
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-gray-500 font-medium max-w-lg leading-relaxed">
                        {isStudio 
                            ? 'พื้นที่สร้างสรรค์ส่วนตัวของคุณ จัดการไอเดีย ร่างบท และเตรียมความพร้อมก่อนแชร์ให้ทีม'
                            : 'ศูนย์รวมบทและสคริปต์ จัดการไอเดีย ร่างบท และส่งไม้ต่อให้ทีม Production ได้อย่างลื่นไหล'
                        }
                    </p>
                </div>

                <button 
                    onClick={onCreateClick}
                    className={`
                        group relative flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl
                        text-white font-black text-sm
                        transition-all duration-300
                        ${isStudio 
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-xl shadow-indigo-200 hover:shadow-indigo-300' 
                            : 'bg-gradient-to-r from-rose-600 to-pink-600 shadow-xl shadow-rose-200 hover:shadow-rose-300'
                        }
                        hover:-translate-y-1 hover:scale-[1.02]
                        active:scale-95 active:translate-y-0
                    `}
                >
                    <Plus className="w-5 h-5 stroke-[3px]" />
                    <span className="relative z-10 drop-shadow-sm">สร้างสคริปต์ใหม่</span>
                    <Sparkles className="w-4 h-4 text-yellow-300 absolute top-2 right-2 animate-bounce opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>
        </div>
    );
};

export default ScriptHubHeader;
