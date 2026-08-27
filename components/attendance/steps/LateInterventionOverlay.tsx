import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, ArrowRight, Lock } from 'lucide-react';
import { BRAND_CONFIG } from '../../../config/brand';

interface LateInterventionOverlayProps {
    startTime: string;
    isExceededLastShift?: boolean;
    onSwitchToLeave?: () => void;
    onClose: () => void;
    onConfirm: () => void;
    onGoBack: () => void;
}

const LateInterventionOverlay: React.FC<LateInterventionOverlayProps> = ({
    startTime,
    isExceededLastShift = false,
    onSwitchToLeave,
    onClose,
    onConfirm,
    onGoBack,
}) => {
    const isMode2 = BRAND_CONFIG.allowLateAppealMode === 2;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6"
        >
            <motion.div 
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className={`${(isExceededLastShift && !isMode2) ? 'bg-red-100 border border-red-200' : 'bg-red-50'} p-4 rounded-full mb-4 animate-in fade-in`}
            >
                {(isExceededLastShift && !isMode2) ? (
                    <Lock className="w-12 h-12 text-red-600 animate-pulse" />
                ) : (
                    <AlertTriangle className="w-12 h-12 text-red-500 animate-bounce" />
                )}
            </motion.div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">
                {(isExceededLastShift && !isMode2) ? 'เลยเวลาเข้างานแล้ว! ⛔' : 'เข้างานสายเกินกำหนด! 😱'}
            </h3>
            
            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                {isMode2 ? (
                    <>
                        ขณะนี้เลยกำหนดเวลาเริ่มเข้างานแล้ว ({startTime} น.) <br/>
                        ระบบจะทำการบันทึกสถานะว่า <b>"มาสาย"</b> และดำเนินการหักคะแนน HP อัตโนมัติ
                    </>
                ) : isExceededLastShift ? (
                    <>
                        ขณะนี้เลยกำหนดเวลาเริ่มเข้างานแล้ว ({startTime} น.) <br/>
                        <span className="text-red-600 font-bold">ระบบได้ทำการล็อกการตอกบัตรเข้างานโดยตรงไว้</span> <br/>
                        หากต้องการยื่นคำขอเข้าสาย (Late Request) จะต้องเป็นคำขอที่เกิดจากอุบัติเหตุหรือเหตุผลจำเป็นจริง ๆ เท่านั้น
                    </>
                ) : (
                    <>
                        ตอนนี้เลยกำหนดเวลาเริ่มเข้างานแล้ว ({startTime} น.) <br/>
                        ระบบจะบันทึกสถานะว่า <b>"มาสาย"</b> และอาจมีการหักแต้ม HP อัตโนมัติ
                    </>
                )}
            </p>
            
            <div className="w-full space-y-3">
                {!isMode2 && (
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            if (onSwitchToLeave) onSwitchToLeave();
                            else onClose();
                        }}
                        className="w-full px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                    >
                        <Clock className="w-5 h-5" /> ยื่นคำขอเข้าสาย (Late Request) / ขออนุญาตลา
                    </motion.button>
                )}
                
                {isMode2 ? (
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onConfirm}
                        className="w-full px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                    >
                        ยอมรับโทษและเช็คอินทันที <ArrowRight className="w-4 h-4" />
                    </motion.button>
                ) : !(isExceededLastShift && !isMode2) && (
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onConfirm}
                        className="w-full py-3.5 bg-white border-2 border-orange-100 text-orange-600 hover:bg-orange-50 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        เช็คอินทันที (ยอมรับเงื่อนไขการสาย) <ArrowRight className="w-4 h-4" />
                    </motion.button>
                )}

                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onGoBack}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs"
                >
                    ย้อนกลับไปเลือกประเภทงาน
                </motion.button>
            </div>
        </motion.div>
    );
};

export default LateInterventionOverlay;
