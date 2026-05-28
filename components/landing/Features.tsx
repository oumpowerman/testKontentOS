
import React from 'react';
import { motion } from 'framer-motion';
import { BRAND_CONFIG } from '../../config/brand.ts';
import { 
  BarChart3, 
  Calendar, 
  Users, 
  Video, 
  Layers, 
  MessageSquare,
  ShieldCheck,
  Zap
} from 'lucide-react';

const FEATURE_LIST = [
  {
    title: 'Dashboard ภาพรวม',
    desc: 'ดูสถานะงานทั้งหมดแบบ Real-time ไม่ว่าจะเป็น Content ที่กำลังผลิต หรือยอด KPI ของทีม',
    icon: BarChart3,
    color: 'bg-blue-50 text-blue-600'
  },
  {
    title: 'Calendar & Content Plan',
    desc: 'วางแผนตารางโพสต์ง่ายๆ แค่ลากวาง เห็นภาพรวมความถี่ของ Content ในแต่ละแพลตฟอร์ม',
    icon: Calendar,
    color: 'bg-purple-50 text-purple-600'
  },
  {
    title: 'Team Management',
    desc: 'มอบหมายงาน ติดตามสถานะ และให้ Feedback ทีมงานได้ในที่เดียว ลดการใช้ LINE/Messenger หายเกลี้ยง',
    icon: Users,
    color: 'bg-indigo-50 text-indigo-600'
  },
  {
    title: 'Content Script Hub',
    desc: 'เขียนบท สคริปต์ และสตอรี่บอร์ด พร้อมระบบ Version Control ไม่ต้องกลัวไฟล์หายหรือทับกัน',
    icon: Video,
    color: 'bg-pink-50 text-pink-600'
  },
  {
    title: 'Meeting & Duty',
    desc: 'จดบันทึกการประชุม และมอบหมาย Duty ประจำวันให้ทีมงานได้ทันทีหลังคุยเสร็จ',
    icon: Layers,
    color: 'bg-orange-50 text-orange-600'
  },
  {
    title: 'Internal Chat',
    desc: 'คุยงานแยกตามโปรเจกต์ ค้นหาง่าย และไม่ปนกับเรื่องส่วนตัว',
    icon: MessageSquare,
    color: 'bg-cyan-50 text-cyan-600'
  }
];

const Features: React.FC = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <motion.h2 
            className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            ฟีเจอร์ที่เกิดมาเพื่อ <br className="sm:hidden" /> <span className="text-purple-600 underline decoration-purple-100 underline-offset-8">ครีเอเตอร์</span>
          </motion.h2>
          <motion.p 
            className="text-lg text-slate-500 max-w-2xl mx-auto font-medium"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            เราเข้าใจว่าการทำ Content ไม่ใช่แค่การตัดต่อ แต่รวมถึงการบริหารจัดการที่ยุ่งเหยิง <br className="hidden md:block" />
            {BRAND_CONFIG.name} จึงรวมทุกอย่างที่คุณต้องใช้มาไว้ในจุดเดียว
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURE_LIST.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2rem] border border-slate-100 hover:border-purple-100 hover:shadow-xl hover:shadow-purple-50 transition-all group"
            >
              <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <f.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
              <p className="text-slate-500 leading-relaxed font-medium">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 p-12 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] text-white overflow-hidden relative">
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">ความเร็วและความปลอดภัย</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Ultra-Fast Performance</h4>
                    <p className="text-slate-400 text-sm">ออกแบบด้วยเทคโนโลยีล่าสุด ให้คุณทำงานได้อย่างลื่นไหลไม่มีสะดุด</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Enterprise Grade Security</h4>
                    <p className="text-slate-400 text-sm">ข้อมูลทั้งหมดของคุณถูกเข้ารหัสและดูแลอย่างดีที่สุด มั่นใจได้ 100%</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
               <div className="w-64 h-64 md:w-80 md:h-80 bg-purple-500/20 rounded-full flex items-center justify-center blur-3xl absolute -right-20 -top-20" />
               <motion.div 
                 initial={{ rotate: -5 }}
                 animate={{ rotate: 5 }}
                 transition={{ repeat: Infinity, repeatType: 'reverse', duration: 3 }}
                 className="bg-white/5 backdrop-blur-md p-10 rounded-[2rem] border border-white/10"
               >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <pre className="text-indigo-300 font-mono text-sm">
                    {`{
                      "project": "${BRAND_CONFIG.name}",
                      "status": "Running",
                      "uptime": "99.99%",
                      "security": "Hardened"
                    }`}
                  </pre>
               </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
