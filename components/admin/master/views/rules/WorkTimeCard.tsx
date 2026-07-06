import React from 'react';
import { Clock, Sparkles, Save } from 'lucide-react';
import TimePickerModal from '../../../../ui/TimePickerModal';

interface WorkTimeConfig {
    start: string;
    end: string;
    buffer: string;
    minHours: string;
    otThreshold: string;
    checkoutPenaltyTime: string;
    dailySummaryDelayHours: string;
    lineSummaryDestination: string;
    enableAttendanceRace: string;
}

interface WorkTimeCardProps {
    tempTimeConfig: WorkTimeConfig;
    setTempTimeConfig: React.Dispatch<React.SetStateAction<WorkTimeConfig>>;
    otJpRate: string;
    setOtJpRate: React.Dispatch<React.SetStateAction<string>>;
    isStartTimeOpen: boolean;
    setIsStartTimeOpen: (open: boolean) => void;
    isEndTimeOpen: boolean;
    setIsEndTimeOpen: (open: boolean) => void;
    isCheckoutPenaltyTimeOpen: boolean;
    setIsCheckoutPenaltyTimeOpen: (open: boolean) => void;
    handleSaveTimeConfig: () => Promise<void>;
}

const WorkTimeCard: React.FC<WorkTimeCardProps> = ({
    tempTimeConfig,
    setTempTimeConfig,
    otJpRate,
    setOtJpRate,
    isStartTimeOpen,
    setIsStartTimeOpen,
    isEndTimeOpen,
    setIsEndTimeOpen,
    isCheckoutPenaltyTimeOpen,
    setIsCheckoutPenaltyTimeOpen,
    handleSaveTimeConfig,
}) => {
    return (
        <div id="work-time-card" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-800 flex items-center mb-6">
                <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                ตั้งค่าเวลาทำการ (Hybrid Logic)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 items-end">
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">เวลาเข้างาน (Start Time)</label>
                    <button
                        id="btn-start-time"
                        type="button"
                        onClick={() => setIsStartTimeOpen(true)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 flex items-center justify-between group hover:border-indigo-400 transition-all shadow-sm"
                    >
                        {tempTimeConfig.start}
                        <Clock className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                    </button>
                    <TimePickerModal 
                        isOpen={isStartTimeOpen}
                        onClose={() => setIsStartTimeOpen(false)}
                        initialTime={tempTimeConfig.start}
                        onSelect={(val) => setTempTimeConfig(prev => ({ ...prev, start: val }))}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">เวลาเลิกงาน (End Time)</label>
                    <button
                        id="btn-end-time"
                        type="button"
                        onClick={() => setIsEndTimeOpen(true)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 flex items-center justify-between group hover:border-indigo-400 transition-all shadow-sm"
                    >
                        {tempTimeConfig.end}
                        <Clock className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                    </button>
                    <TimePickerModal 
                        isOpen={isEndTimeOpen}
                        onClose={() => setIsEndTimeOpen(false)}
                        initialTime={tempTimeConfig.end}
                        onSelect={(val) => setTempTimeConfig(prev => ({ ...prev, end: val }))}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">ชั่วโมงขั้นต่ำ (Min Hours)</label>
                    <div className="relative">
                        <input 
                            id="input-min-hours"
                            type="number" 
                            className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-indigo-100 outline-none"
                            value={tempTimeConfig.minHours}
                            onChange={e => setTempTimeConfig(prev => ({ ...prev, minHours: e.target.value }))}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">Hrs</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">อนุโลมสายได้ (Late Buffer)</label>
                    <div className="relative">
                        <input 
                            id="input-late-buffer"
                            type="number" 
                            className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-indigo-100 outline-none"
                            value={tempTimeConfig.buffer}
                            onChange={e => setTempTimeConfig(prev => ({ ...prev, buffer: e.target.value }))}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">Min</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">เกณฑ์ลืมออกงาน (OT Threshold)</label>
                    <div className="relative">
                        <input 
                            id="input-ot-threshold"
                            type="number" 
                            className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-indigo-100 outline-none"
                            value={tempTimeConfig.otThreshold}
                            onChange={e => setTempTimeConfig(prev => ({ ...prev, otThreshold: e.target.value }))}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">Hrs</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">อัตราคะแนน OT (OT JP Rate)</label>
                    <div className="relative">
                        <input 
                            id="input-ot-jp-rate"
                            type="number" 
                            className="w-full pl-4 pr-16 py-3 border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-indigo-100 outline-none"
                            value={otJpRate}
                            onChange={e => setOtJpRate(e.target.value)}
                            placeholder="10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">JP/ชม.</span>
                    </div>
                </div>
            </div>

            {/* Server-Side Automated Checks Sub-section */}
            <div className="mt-8 pt-6 border-t border-dashed border-gray-100">
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    ระบบตรวจสอบและเตือนสติเซิร์ฟเวอร์ & ฟังก์ชันพิเศษ (Server-Side Checks & Add-ons)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {/* Plan B Info Card */}
                    <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100/60 flex flex-col justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 mb-2">
                                📋 แผนที่ B (Active)
                            </span>
                            <h5 className="font-bold text-sm text-gray-800 mb-1">เตือนสติพนักงานเมื่อลืมเข้างาน</h5>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                เซิร์ฟเวอร์จะคำนวณเวลางานอัตโนมัติ และแจ้งเตือนแถบสีแดงเข้า LINE ทันทีเมื่อเลยเวลาเข้างานที่กำหนดไว้
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-indigo-100/40 flex items-center justify-between text-xs font-bold text-indigo-700">
                            <span>⏰ เวลาทำงานของนาฬิกาปลุกเซิร์ฟเวอร์วันนี้:</span>
                            <span className="bg-indigo-100/80 px-2 py-1 rounded-lg">
                                {(() => {
                                    const [h, m] = tempTimeConfig.start.split(':').map(Number);
                                    const buf = parseInt(tempTimeConfig.buffer) || 0;
                                    const date = new Date();
                                    date.setHours(h, m + buf + 1);
                                    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} น.`;
                                })()}
                            </span>
                        </div>
                    </div>

                    {/* Plan C Config Card */}
                    <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-100/60 flex flex-col justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 mb-2">
                                🛠️ แผนที่ C (Active)
                            </span>
                            <h5 className="font-bold text-sm text-gray-800 mb-1">ตรวจเช็คพนักงานลืมออกงานข้ามวัน</h5>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                เซิร์ฟเวอร์จะตื่นเช้าตรู่ของวันใหม่มาตรวจเช็ค และหักแต้ม/ส่งคำเตือนลืมตอกบัตรออกของเมื่อวานโดยอัตโนมัติ
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-amber-100/40 flex items-center justify-between gap-4">
                            <span className="text-xs font-bold text-amber-800">⏰ ตั้งเวลาตรวจเช็คของเซิร์ฟเวอร์:</span>
                            <div className="flex items-center gap-2">
                                <button
                                    id="btn-checkout-penalty-time"
                                    type="button"
                                    onClick={() => setIsCheckoutPenaltyTimeOpen(true)}
                                    className="px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-800 flex items-center gap-1 hover:border-amber-400 transition-all shadow-sm"
                                >
                                    {tempTimeConfig.checkoutPenaltyTime} น.
                                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                                </button>
                                <TimePickerModal 
                                    isOpen={isCheckoutPenaltyTimeOpen}
                                    onClose={() => setIsCheckoutPenaltyTimeOpen(false)}
                                    initialTime={tempTimeConfig.checkoutPenaltyTime}
                                    onSelect={(val) => setTempTimeConfig(prev => ({ ...prev, checkoutPenaltyTime: val }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Plan D Config Card */}
                    <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/60 flex flex-col justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 mb-2">
                                📊 แผนที่ D (Active)
                            </span>
                            <h5 className="font-bold text-sm text-gray-800 mb-1">รายงานสรุป ขาด/ลา/มาสาย รายวัน</h5>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                ส่งสรุปรายงานความเรียบร้อย ขาด ลา มาสาย เข้าทางกลุ่ม LINE สำหรับ HR หรือ เจ้าของ เพื่อความโปร่งใสแบบ real-time
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-emerald-100/40 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-emerald-800">⏱️ หน่วงเวลาส่งหลังเข้างาน:</span>
                                <div className="relative w-24">
                                    <input
                                        id="input-summary-delay"
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        className="w-full px-2.5 py-1.5 pr-8 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 outline-none focus:ring-1 focus:ring-emerald-300"
                                        value={tempTimeConfig.dailySummaryDelayHours || '1'}
                                        onChange={e => setTempTimeConfig(prev => ({ ...prev, dailySummaryDelayHours: e.target.value }))}
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-emerald-500 font-bold">ชม.</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-emerald-800">🔑 LINE Group / Destination ID:</span>
                                <input
                                    id="input-summary-destination"
                                    type="text"
                                    placeholder="เช่น C4f0..., C923... (คั่นด้วยจุลภาค)"
                                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 placeholder-emerald-300 outline-none focus:ring-1 focus:ring-emerald-300"
                                    value={tempTimeConfig.lineSummaryDestination || ''}
                                    onChange={e => setTempTimeConfig(prev => ({ ...prev, lineSummaryDestination: e.target.value }))}
                                />
                                <p className="text-[9px] text-emerald-600/85 leading-normal mt-0.5">
                                    * สามารถใส่ได้หลายปลายทาง โดยคั่นด้วยเครื่องหมายจุลภาค <code>,</code>
                                </p>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-bold text-emerald-700 pt-1">
                                <span>⏰ เวลาแจ้งเตือนวันนี้:</span>
                                <span className="bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                    {(() => {
                                        try {
                                            const [h, m] = tempTimeConfig.start.split(':').map(Number);
                                            const delay = parseFloat(tempTimeConfig.dailySummaryDelayHours) || 1.0;
                                            const date = new Date();
                                            date.setHours(h, m + Math.round(delay * 60));
                                            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} น.`;
                                        } catch (e) {
                                            return '--:-- น.';
                                        }
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Add-on Feature Card (Weekly Attendance Race Toggle) */}
                    <div className="p-4 bg-violet-50/40 rounded-2xl border border-violet-100/60 flex flex-col justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700 mb-2">
                                🏆 ฟังก์ชันเสริม (Add-on Feature)
                            </span>
                            <h5 className="font-bold text-sm text-gray-800 mb-1">ระบบสนามวิ่งแข่งเช็คอินรายวัน</h5>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                เพิ่มความสนุกและลูกเล่นน่ารักๆ (Weekly Attendance Race) เพื่อกระตุ้นให้พนักงานตื่นเช้ามาลงเวลาเข้างาน
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-violet-100/40 flex items-center justify-between">
                            <span className="text-xs font-bold text-violet-800">สถานะการใช้งาน:</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    id="toggle-attendance-race"
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={tempTimeConfig.enableAttendanceRace === 'true'}
                                    onChange={e => setTempTimeConfig(prev => ({ 
                                        ...prev, 
                                        enableAttendanceRace: e.target.checked ? 'true' : 'false' 
                                    }))}
                                />
                                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                                <span className="ml-2 text-xs font-bold text-gray-700">
                                    {tempTimeConfig.enableAttendanceRace === 'true' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button 
                    id="btn-save-work-time"
                    onClick={handleSaveTimeConfig}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200 flex items-center"
                >
                    <Save className="w-4 h-4 mr-2" /> บันทึกกฎการเข้างาน
                </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
                * <b>Hybrid Rule:</b> พนักงานจะถือว่าทำงานครบสมบูรณ์ เมื่อกดออกหลังเวลาเลิกงาน <b>หรือ</b> ทำงานครบชั่วโมงขั้นต่ำที่กำหนด
            </p>
        </div>
    );
};

export default WorkTimeCard;
