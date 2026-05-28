
import React from 'react';
import { ShieldAlert, ScrollText } from 'lucide-react';
import { BRAND_CONFIG } from '../../config/brand.ts';

interface LegalSectionProps {
  type: 'PRIVACY' | 'TERMS';
}

const LegalSection: React.FC<LegalSectionProps> = ({ type }) => {
  return (
    <div className="py-24 px-6 max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm font-bold mb-4">
          {type === 'PRIVACY' ? <ShieldAlert className="w-4 h-4" /> : <ScrollText className="w-4 h-4" />}
          {type === 'PRIVACY' ? 'Privacy Policy' : 'Terms of Service'}
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
            {type === 'PRIVACY' ? 'นโยบายความเป็นส่วนตัว' : 'ข้อกำหนดและเงื่อนไขการใช้งาน'}
        </h2>
        <p className="text-slate-500 font-medium">อัปเดตล่าสุดเมื่อวันที่ 1 พฤษภาคม 2026</p>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm prose prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-strong:text-slate-800">
        <h3>1. บทนำ</h3>
        <p>
          ยินดีต้อนรับสู่ <strong>{BRAND_CONFIG.name}</strong> เราให้ความสำคัญกับการปกป้องข้อมูลส่วนบุคคลของคุณ...
          (Mockup content: เอกสารนี้เป็นเพียงตัวอย่างสั้นๆ สำหรับการแสดงผลหน้าเพจที่เลือกจาก Footer)
        </p>

        <h3>2. การเก็บรวบรวมข้อมูล</h3>
        <p>
          เราเก็บรวบรวมเฉพาะข้อมูลที่จำเป็นต่อการให้บริการจัดการหน้าคอนเทนต์และทีมครีเอเตอร์ของคุณเท่านั้น 
          โดยข้อมูลทั้งหมดจะถูกจัดเก็บอย่างปลอดภัยบนระบบฐานข้อมูลมาตรฐานสากล
        </p>

        <h3>3. หน้าที่ของผู้ใช้งาน</h3>
        <p>
          ผู้ใช้งานตกลงที่จะใช้ระบบอย่างถูกกฎหมายและไม่กระทำการใดๆ ที่ส่งผลกระทบต่อระบบส่วนรวม...
        </p>

        <div className="mt-12 p-8 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-500 text-sm">
          หมายเหตุ: นี่คือเนื้อหาตัวอย่างสำหรับการทดสอบระบบนำทางของ Footer <br/>
          เนื้อหาจริงควรได้รับการตรวจสอบโดยที่ปรึกษากฎหมายก่อนการใช้งานเชิงพาณิชย์
        </div>
      </div>
    </div>
  );
};

export default LegalSection;
