
import React from 'react';
import { motion } from 'framer-motion';
import { History, Zap, CheckCircle2 } from 'lucide-react';
import { UpdateLog } from '../../services/landingService';
import { BRAND_CONFIG } from '../../config/brand.ts';

interface UpdatesSectionProps {
  updates?: UpdateLog[];
}

const UpdatesSection: React.FC<UpdatesSectionProps> = ({ updates }) => {
  return (
    <div className="py-24 px-6 max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-4">
          <History className="w-4 h-4" />
          อัปเดตระบบ
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">สิ่งที่เปลี่ยนไปในรุ่นล่าสุด</h2>
        <p className="text-slate-500 font-medium">เราพัฒนา {BRAND_CONFIG.name} อย่างต่อเนื่องเพื่อประสบการณ์ที่ดีที่สุด</p>
      </div>

      <div className="relative border-l-2 border-slate-100 ml-4 md:ml-8 space-y-12 pb-12">
        {updates?.map((log, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative pl-8 md:pl-12"
          >
            {/* Timeline Dot */}
            <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm ${
              log.type === 'major' ? 'bg-purple-500' : 'bg-blue-400'
            }`} />
            
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 inline-block ${
                    log.type === 'major' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {log.type === 'major' ? 'Major Release' : 'Feature Update'}
                  </span>
                  <h3 className="text-2xl font-black text-slate-800">{log.version}</h3>
                </div>
                <div className="text-sm font-bold text-slate-400 bg-slate-50 px-4 py-1.5 rounded-full">
                  {log.date}
                </div>
              </div>
              
              <ul className="space-y-3">
                {log.changes.map((change, cIdx) => (
                  <li key={cIdx} className="flex items-start gap-3 text-slate-600 font-medium leading-relaxed">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 inline-block w-full max-w-2xl">
          <Zap className="w-10 h-10 text-orange-400 mx-auto mb-4" />
          <h4 className="font-black text-slate-800 text-lg mb-2">ยังมีอีกเพียบที่เรากำลังทำ!</h4>
          <p className="text-slate-500 text-sm font-medium">คอยติดตามอัปเดตใหม่ๆ ได้ทุกสัปดาห์</p>
        </div>
      </div>
    </div>
  );
};

export default UpdatesSection;
