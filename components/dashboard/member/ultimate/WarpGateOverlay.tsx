import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewMode } from '../../../../types';

interface WarpGateOverlayProps {
    globalWarpStage: 'IDLE' | 'WARPING_IN' | 'WARPING_OUT';
    warpTargetView: ViewMode | null;
}

export const WarpGateOverlay: React.FC<WarpGateOverlayProps> = ({
    globalWarpStage,
    warpTargetView,
}) => {
    return (
        <AnimatePresence>
            {globalWarpStage !== 'IDLE' && (
                <motion.div
                    key="global-dimensional-portal-shroud"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                    className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#080913] select-none pointer-events-auto overflow-hidden"
                >
                    {/* Pulsating Cosmos / Nebula starry dust background */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-black pointer-events-none" />
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1200&q=30')] opacity-5 bg-cover bg-center mix-blend-screen pointer-events-none" />

                    {/* Glowing dimensional vortex fields */}
                    <motion.div
                        animate={{
                            rotate: globalWarpStage === 'WARPING_IN' ? [0, 360] : [360, 720],
                            scale: globalWarpStage === 'WARPING_IN' ? [0.4, 2.5] : [2.5, 0.4],
                            opacity: globalWarpStage === 'WARPING_IN' ? [0, 0.95] : [0.95, 0],
                        }}
                        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-indigo-500/25 via-pink-500/20 to-purple-600/30 blur-3xl pointer-events-none"
                    />

                    <motion.div
                        animate={{
                            rotate: globalWarpStage === 'WARPING_IN' ? [360, -360] : [-360, -1080],
                            scale: globalWarpStage === 'WARPING_IN' ? [0.2, 1.8] : [1.8, 0.1],
                            opacity: globalWarpStage === 'WARPING_IN' ? [0, 0.85] : [0.85, 0],
                        }}
                        transition={{ duration: 1.3, ease: "easeInOut" }}
                        className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-teal-500/20 via-sky-500/15 to-purple-500/25 blur-2xl pointer-events-none"
                    />

                    {/* Cinematic spinning wormhole core */}
                    <div className="relative flex items-center justify-center w-72 h-72">
                        {/* Outer dashed control rings */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 rounded-full border border-dashed border-indigo-400/30 pointer-events-none"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-4 rounded-full border border-dotted border-pink-400/30 pointer-events-none"
                        />

                        {/* Plasma particle ball core */}
                        <motion.div
                            animate={{
                                scale: globalWarpStage === 'WARPING_IN' ? [0.1, 1.25, 1] : [1, 1.45, 0],
                                opacity: globalWarpStage === 'WARPING_IN' ? [0, 1] : [1, 0],
                            }}
                            transition={{ duration: 0.95, ease: "easeOut" }}
                            className="relative flex items-center justify-center w-40 h-40"
                        >
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-500 blur-xl opacity-90 animate-pulse" />
                            <div className="absolute inset-1 rounded-full bg-slate-950 flex items-center justify-center border-2 border-indigo-500/50">
                                <span className="text-4xl animate-bounce">🌌</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Immersive state info status HUD */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="mt-8 flex flex-col items-center justify-center text-center gap-3 relative z-10 font-sans px-6"
                    >
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full shadow-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                            <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-widest font-mono">
                                {warpTargetView === 'ULTIMATE_WORKROOM' ? 'TELEPORTING TO COCKPIT' : 'RETURNING TO MISSION PANEL'}
                            </span>
                        </div>
                        <h3 className="text-lg md:text-xl font-extrabold text-white font-kanit drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                            {warpTargetView === 'ULTIMATE_WORKROOM'
                                ? 'กำลังเปิดสัญญาณข้ามประตูมิติแบบพิกเซล...'
                                : 'กำลังนำจิตดึงสติกลับกริดทำงานหลัก...'}
                        </h3>
                        <p className="text-xs text-slate-400/95 font-medium max-w-sm leading-relaxed">
                            {warpTargetView === 'ULTIMATE_WORKROOM'
                                ? 'กรุณารอการเชื่อมต่อพลังงานจิตสถิติสมาธิ เพื่อปั้นความเงียบสงบ'
                                : 'ภารกิจบันทึกข้อมูลเสร็จเรียบร้อย ชาร์จความสดชื่นกลับมาเต็มเปี่ยม!'}
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WarpGateOverlay;
