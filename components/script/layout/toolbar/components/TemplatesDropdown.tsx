import React from 'react';
import { motion } from 'framer-motion';
import { LayoutTemplate, Sparkles } from 'lucide-react';
import { FloatingPortal } from './FloatingPortal';
import { useScriptContext } from '../../../core/ScriptContext';
import { useToast } from '../../../../../context/ToastContext';
import { useGlobalDialog } from '../../../../../context/GlobalDialogContext';

const TEMPLATES = [
    { label: 'TikTok Viral (Hook-Value-CTA)', content: "<h2>Hook (3s)</h2><p>[หยุดคนดูด้วยภาพหรือคำพูดแรงๆ]</p><h2>Value (15-45s)</h2><p>[เนื้อหาหลัก/เคล็ดลับ/เรื่องเล่า]</p><ol><li>...</li><li>...</li><li>...</li></ol><h2>CTA (5s)</h2><p>ถ้าชอบฝากกดหัวใจ กดติดตามด้วยนะครับ</p>" },
    { label: 'Vlog (Cinematic)', content: "<p><strong>Scene 1: Intro (B-Roll)</strong></p><p>[ภาพบรรยากาศสวยๆ เพลงประกอบขึ้น]</p><p>Voice over: วันนี้จะพามา...</p><p><strong>Scene 2: Talking Head</strong></p><p>สวัสดีครับทุกคน วันนี้เราอยู่ที่...</p><p><strong>Scene 3: Montage</strong></p><p>[ตัดสลับภาพกิจกรรมรัวๆ]</p><p><strong>Scene 4: Conclusion</strong></p><p>สรุปความประทับใจ...</p>" },
];

interface TemplatesDropdownProps {
    showTemplates: boolean;
    setShowTemplates: (isOpen: boolean) => void;
    templatesBtnRef: React.RefObject<HTMLDivElement>;
}

export const TemplatesDropdown: React.FC<TemplatesDropdownProps> = ({
    showTemplates,
    setShowTemplates,
    templatesBtnRef,
}) => {
    const { setContent } = useScriptContext();
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    const handleSelectTemplate = async (tplContent: string) => {
        const confirmed = await showConfirm(
            "เนื้อหาเดิมจะถูกแทนที่ด้วย Template ที่เลือกทั้งหมด", 
            "ยืนยันการเปลี่ยน Template?"
        );
        
        if (confirmed) {
            setContent(tplContent);
            setShowTemplates(false);
            showToast('ใช้ Template เรียบร้อย', 'success');
        }
    };

    return (
        <div className="relative shrink-0" ref={templatesBtnRef}>
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTemplates(!showTemplates)} 
                className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 rounded-lg shadow-sm transition-all" 
                title="Templates"
            >
                <LayoutTemplate className="w-4 h-4" />
            </motion.button>
            
            <FloatingPortal
                isOpen={showTemplates}
                onClose={() => setShowTemplates(false)}
                anchorRef={templatesBtnRef}
                className="w-64 bg-white rounded-xl shadow-xl border border-orange-100 p-2 animate-in fade-in zoom-in-95 origin-top-right"
                align="right"
            >
                <p className="text-[10px] font-black text-orange-400 uppercase px-3 py-1.5 flex items-center">
                    <Sparkles className="w-3 h-3 mr-1"/> เลือก Template
                </p>
                {TEMPLATES.map((tpl, i) => (
                    <button 
                        key={i} 
                        type="button"
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            handleSelectTemplate(tpl.content); 
                        }} 
                        className="w-full text-left px-3 py-2.5 text-xs font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors truncate mb-1"
                    >
                        {tpl.label}
                    </button>
                ))}
            </FloatingPortal>
        </div>
    );
};
