import React, { useState, useEffect } from 'react';
import { MasterOption } from '../../../../types';
import { ShieldCheck, FileText, CheckCircle, RefreshCcw, Save } from 'lucide-react';

interface SystemPolicyViewProps {
    masterOptions: MasterOption[];
    onUpdate: (option: MasterOption) => Promise<boolean>;
    onAdd: (option: Omit<MasterOption, 'id'>) => Promise<boolean>;
}

const SystemPolicyView: React.FC<SystemPolicyViewProps> = ({ masterOptions, onUpdate, onAdd }) => {
    const activePolicy = masterOptions.find(
        o => o.type === 'SYSTEM_POLICY' && o.key === 'TERMS_OF_SERVICE'
    );

    const [title, setTitle] = useState('ข้อตกลงและเงื่อนไขการปฏิบัติงาน');
    const [version, setVersion] = useState(1);
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (activePolicy) {
            setTitle(activePolicy.label || 'ข้อตกลงและเงื่อนไขการปฏิบัติงาน');
            setVersion(activePolicy.progressValue || 1);
            setContent(activePolicy.description || '');
        } else {
            // Default sample content if none exists
            setContent(
                `# ข้อตกลงการใช้ระบบและระเบียบปฏิบัติ\n\n` +
                `ยินดีต้อนรับสู่ระบบบริหารงานของบริษัท ข้อตกลงนี้ทำขึ้นเพื่อความเข้าใจและรักษามาตรฐานการทำงานร่วมกัน\n\n` +
                `### 1. การรักษาข้อมูลความลับ (Confidentiality)\n` +
                `- สมาชิกตกลงที่จะเก็บรักษาข้อมูลทางธุรกิจ ข้อมูลลูกค้า สคริปต์ และสื่อดิจิทัลทั้งหมดเป็นความลับ\n` +
                `- ห้ามเปิดเผยข้อมูลใดๆ แก่บุคคลภายนอกโดยไม่ได้รับอนุญาต\n\n` +
                `### 2. มาตรฐานการบันทึกเวลาทำงาน (Attendance Standards)\n` +
                `- สมาชิกต้องบันทึกเวลาเข้างาน (Check-In) และออกงาน (Check-Out) ตามเวลาและสถานที่ที่กำหนดจริง\n` +
                `- การปลอมแปลงสถานที่หรือพิกัด GPS จะถือเป็นความผิดวินัยร้ายแรง\n\n` +
                `### 3. ทรัพย์สินทางปัญญา (Intellectual Property)\n` +
                `- งานวิดีโอ สคริปต์ และคอนเทนต์ที่สร้างขึ้นระหว่างการจ้างงาน ถือเป็นลิขสิทธิ์ของบริษัทโดยสมบูรณ์\n\n` +
                `### 4. บทลงโทษทางระบบ (Gamification & HP System)\n` +
                `- ระบบมีการหักค่าพลังชีวิต (HP) และคะแนนสำหรับพฤติกรรมที่ขัดต่อระเบียบปฏิบัติ\n` +
                `- หาก HP เหลือ 0 บัญชีผู้ใช้จะเข้าสู่สถานะจำจำเพื่อรอรับการพิจารณาตรวจสอบ`
            );
        }
    }, [activePolicy]);

    const handlePublish = async () => {
        if (!title.trim() || !content.trim()) return;
        setIsSaving(true);
        try {
            if (activePolicy) {
                await onUpdate({
                    ...activePolicy,
                    label: title,
                    progressValue: version,
                    description: content,
                    isActive: true,
                });
            } else {
                await onAdd({
                    type: 'SYSTEM_POLICY',
                    key: 'TERMS_OF_SERVICE',
                    label: title,
                    color: '#4f46e5',
                    sortOrder: 1,
                    isActive: true,
                    isDefault: true,
                    description: content,
                    progressValue: version,
                });
            }
        } catch (error) {
            console.error('Error saving policy:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Editor Column */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        เขียนและจัดการข้อตกลงระบบ (Edit Policy)
                    </h3>
                    <p className="text-xs text-gray-500">
                        แก้ไขเนื้อหาข้อตกลง หากเปลี่ยนเวอร์ชัน (Version) ระบบจะบังคับให้ผู้ใช้ทุกคนต้องอ่านและกดยอมรับใหม่อีกครั้งก่อนเข้าใช้งานเว็บไซต์
                    </p>

                    <div className="grid grid-cols-3 gap-4 mt-2">
                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-bold text-gray-600">หัวข้อข้อตกลง</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                                placeholder="เช่น ข้อตกลงการใช้ระบบและระเบียบปฏิบัติ"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-600">เวอร์ชันระบบ (Version)</label>
                            <input
                                type="number"
                                value={version}
                                onChange={(e) => setVersion(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-gray-600">รายละเอียดข้อตกลง (รองรับข้อความหรือ Markdown)</label>
                            <span className="text-[10px] text-gray-400 font-mono">
                                {content.length} characters
                            </span>
                        </div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={15}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-sans leading-relaxed"
                            placeholder="พิมพ์ข้อตกลงการปฏิบัติงาน เงื่อนไขความรับผิดชอบ และระเบียบปฏิบัติขององค์กร..."
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handlePublish}
                            disabled={isSaving || !title.trim() || !content.trim()}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold shadow-md shadow-indigo-100 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <RefreshCcw className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            บันทึกและเปิดใช้งานข้อตกลง (Publish & Enforce)
                        </button>
                    </div>
                </div>

                {/* Preview / Status Column */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Status Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider text-gray-400">
                            สถานะการบังคับใช้ปัจจุบัน
                        </h4>
                        
                        <div className="flex items-center gap-3 bg-green-50 border border-green-100 p-4 rounded-xl">
                            <ShieldCheck className="w-8 h-8 text-green-600 shrink-0" />
                            <div>
                                <div className="text-sm font-bold text-green-800">
                                    ระบบป้องกันความปลอดภัยทำงานอยู่
                                </div>
                                <div className="text-xs text-green-600">
                                    ผู้ใช้งานที่ไม่ผ่านเกณฑ์เวอร์ชันปัจจุบันจะถูกระงับไม่ให้เข้าใช้งานหน้าเว็บ
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4 space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span className="text-gray-400">เวอร์ชันเปิดใช้งาน:</span>
                                <span className="font-bold text-indigo-600">v{version}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">สถานะ:</span>
                                <span className="flex items-center gap-1 font-bold text-green-600">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse inline-block" />
                                    Active & Live
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Appears to Users Mock Preview */}
                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 bg-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl text-white">
                            User View Mock
                        </div>
                        <h4 className="font-bold text-gray-400 text-xs tracking-wide uppercase">
                            ตัวอย่างเมื่อแสดงผลกับพนักงาน
                        </h4>

                        <div className="bg-slate-800 p-4 rounded-xl space-y-2 border border-slate-700">
                            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                                <ShieldCheck className="w-4 h-4" />
                                ป้องกันโดยนโยบายบริษัท v{version}
                            </div>
                            <h5 className="font-bold text-sm text-white">{title}</h5>
                            <div className="h-32 overflow-y-auto border border-slate-700 bg-slate-900 rounded-lg p-2.5 text-[10px] text-slate-300 font-sans space-y-2 leading-relaxed">
                                {content ? (
                                    content.split('\n').map((line, idx) => (
                                        <p key={idx}>{line}</p>
                                    ))
                                ) : (
                                    <p className="text-slate-500 italic">กรุณากรอกข้อมูลนโยบาย</p>
                                )}
                            </div>
                            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
                                <span>* ต้องเลื่อนอ่านจนสุดถึงปุ่มยอมรับจะทำงาน</span>
                                <button className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg opacity-50 cursor-not-allowed">
                                    ฉันยอมรับ v{version}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemPolicyView;
