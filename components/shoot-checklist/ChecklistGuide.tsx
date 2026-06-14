
import React from 'react';
import { PackageOpen, ListChecks, RotateCcw, Trash2, Camera, Layers, ArrowRight } from 'lucide-react';

const ChecklistGuide: React.FC = () => {
    return (
        <div className="space-y-8 font-sans">
            
            {/* Intro Card */}
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="text-xl font-black mb-2 flex items-center">
                        🎒 จัดเป๋าออกกอง (Shoot Checklist)
                    </h4>
                    <p className="text-teal-100 leading-relaxed font-medium">
                        ลืมเมมฯ ลืมแบตฯ คือฝันร้าย! 😱 <br/>
                        หน้านี้จะช่วยให้ทีม <span className="text-yellow-300 font-bold">"แพ็คของ-เช็คของ"</span> ได้แบบโปรๆ <br/>
                        ข้อมูลซิงค์กันสดๆ (Real-time) ใครติ๊กอะไร รู้กันทั้งทีม!
                    </p>
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] opacity-20 rotate-12">
                    <Camera className="w-32 h-32" />
                </div>
            </div>

            {/* Workflow Steps */}
            <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-teal-500" /> Flow การใช้งาน (How it works)
                </h3>
                
                <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex gap-4">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg">1</div>
                        <div>
                            <h5 className="font-bold text-gray-800 flex items-center gap-2">
                                เติมของเข้าคลัง <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Inventory</span>
                            </h5>
                            <p className="text-sm text-gray-600 mt-1">
                                กดปุ่ม <span className="font-bold text-indigo-600">"คลังอุปกรณ์"</span> เพื่อดูสมบัติบ้าทั้งหมดของเรา <br/>
                                เพิ่มของใหม่ใส่รูปได้ 📸 จะได้ไม่หยิบผิดอัน!
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex gap-4">
                        <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg">2</div>
                        <div>
                            <h5 className="font-bold text-gray-800 flex items-center gap-2">
                                จัดเซ็ตลงกระเป๋า <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Packing</span>
                            </h5>
                            <p className="text-sm text-gray-600 mt-1">
                                จะไปถ่ายงานอะไร? จิ้มเลือก <b>Smart Chips</b> (เช่น Vlog, Interview) ด้านบน <br/>
                                รายการของจะเด้งมาให้ครบชุด ไม่ต้องนั่งนึกใหม่ทีละชิ้น
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex gap-4">
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg">3</div>
                        <div>
                            <h5 className="font-bold text-gray-800 flex items-center gap-2">
                                ตรวจเช็คหน้างาน <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Check!</span>
                            </h5>
                            <p className="text-sm text-gray-600 mt-1">
                                หยิบใส่กระเป๋าแล้วกดติ๊ก ✅ หลอดพลังจะเต็ม 100%<br/>
                                ถ้าเจอของขาดหน้างาน พิมพ์เพิ่มในช่อง <b>"Quick Add"</b> ได้เลย
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Reset vs Clear */}
            <section className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">
                    จบงานแล้วทำไงต่อ? (Reset Options)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-400">
                            <RotateCcw className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 text-sm">ปุ่ม Reset (ลูกศรวน)</p>
                            <p className="text-xs text-gray-500">เอาติ๊กถูกออกทั้งหมด (แต่ของยังอยู่) <br/>ใช้ตอนเช็คของขากลับ หรือเช็คซ้ำ</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-50 rounded-lg border border-red-100 text-red-500">
                            <Trash2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-red-600 text-sm">ปุ่ม Clear All (ถังขยะ)</p>
                            <p className="text-xs text-gray-500">ลบทุกอย่างออกจากหน้าจอ <br/>เพื่อให้พร้อมจัดเซ็ตใหม่สำหรับงานหน้า</p>
                        </div>
                    </div>
                </div>
            </section>

             {/* Pro Tip */}
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                <div className="p-2 bg-white rounded-full text-blue-500 shadow-sm">
                    <PackageOpen className="w-5 h-5" />
                </div>
                <p className="text-xs text-blue-800 font-medium">
                    <b>Pro Tip:</b> สร้าง Preset ไว้หลายๆ แบบ (เช่น "Set เล็ก", "Set ใหญ่ไฟกระพริบ") จะช่วยประหยัดเวลาจัดของได้เยอะมาก!
                </p>
            </div>

        </div>
    );
};

export default ChecklistGuide;
