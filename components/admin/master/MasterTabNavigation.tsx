
import React from 'react';
import { Activity, CheckSquare, Flag, Tag, Calendar, CalendarDays, Type, Layers, LayoutTemplate, FileText, MapPin, Presentation, Package, AlertTriangle, Briefcase, HeartPulse, Clock, ShieldAlert, Gift, Smile, Monitor, HardDrive, BookOpen, Gamepad2, Coins, Gavel, ShieldCheck } from 'lucide-react';
import { MasterTab } from '../../../hooks/useMasterDataView';

// Metadata Configuration
export const MASTER_META: Record<string, { label: string, icon: any, desc: string, group: string }> = {
    // --- WORKFLOW ---
    STATUS: { label: 'Content Status', icon: Activity, desc: 'สถานะของงานวิดีโอ/คอนเทนต์ (เช่น Idea, Script, Shoot)', group: 'WORKFLOW' },
    TASK_STATUS: { label: 'Task Status', icon: CheckSquare, desc: 'สถานะของงานทั่วไป (เช่น To Do, Doing, Done)', group: 'WORKFLOW' },
    PROJECT_TYPE: { label: 'Project Type', icon: Flag, desc: 'ประเภทของโปรเจกต์ (เช่น Internal, Sponsor, Collab) ใช้แยกกลุ่มรายได้', group: 'WORKFLOW' },
    TAG_PRESET: { label: 'Tag Presets', icon: Tag, desc: 'ป้ายกำกับด่วน (เช่น #Urgent, #Rerun) ให้ทีมกดเลือกได้เลยไม่ต้องพิมพ์', group: 'WORKFLOW' },
    EVENT_TYPE: { label: 'Calendar Events', icon: Calendar, desc: 'ประเภทของ Highlight วันที่ในปฏิทิน (เช่น วันหยุด, วันออกกอง)', group: 'WORKFLOW' },
    YEARLY: { label: 'Yearly Holidays', icon: CalendarDays, desc: 'วันหยุดประจำปี (กำหนดครั้งเดียว แสดงทุกปี)', group: 'WORKFLOW' },
    CALENDAR: { label: 'Operational Calendar', icon: Calendar, desc: 'ปฏิทินปฏิบัติงาน (กำหนดวันทำงาน/วันหยุดพิเศษรายวัน)', group: 'WORKFLOW' }, // NEW
    
    // --- CONTENT ---
    FORMAT: { label: 'Formats', icon: Type, desc: 'รูปแบบของงาน (เช่น Short Form, Long Form, Post)', group: 'CONTENT' },
    PILLAR: { label: 'Pillars', icon: Layers, desc: 'แกนเนื้อหา (เช่น Education, Entertainment, Lifestyle)', group: 'CONTENT' },
    CATEGORY: { label: 'Categories', icon: LayoutTemplate, desc: 'หมวดหมู่ย่อย (เช่น Vlog, Review, Interview)', group: 'CONTENT' },
    SCRIPT_CATEGORY: { label: 'Script Categories', icon: FileText, desc: 'หมวดหมู่สคริปต์ (เช่น Vlog, Storytelling, Review)', group: 'CONTENT' },
    SHOOT_LOCATION: { label: 'Shoot Locations', icon: MapPin, desc: 'สถานที่ถ่ายทำ (สำหรับแปะใน Script)', group: 'CONTENT' },
    MEETING_CATEGORY: { label: 'Meeting Topics', icon: Presentation, desc: 'หัวข้อการประชุม (เช่น General, Crisis, Project Update)', group: 'CONTENT' },

    // --- RESOURCES ---
    INVENTORY: { label: 'Equipment Categories', icon: Package, desc: 'หมวดหมู่อุปกรณ์หลักและย่อย (ใช้ในหน้า Checklist)', group: 'INVENTORY' },
    ITEM_CONDITION: { label: 'Item Condition', icon: AlertTriangle, desc: 'สภาพอุปกรณ์ (เช่น Good, Broken, Lost) ใช้แปะป้ายสถานะของ', group: 'INVENTORY' },
    POSITION: { label: 'Positions', icon: Briefcase, desc: 'ตำแหน่งงานและหน้าที่ความรับผิดชอบ (ใช้ในหน้าสมัครและหน้าทีม)', group: 'TEAM' },
    LEAVE_TYPE: { label: 'Leave Types', icon: HeartPulse, desc: 'ประเภทการลา (เช่น ลาป่วย, ลากิจ, พักร้อน)', group: 'TEAM' },
    ATTENDANCE_RULES: { label: 'Work Time Config', icon: Clock, desc: 'ตั้งค่าเวลาเข้างาน กะงาน', group: 'TEAM' },
    LOCATIONS: { label: 'Office Locations', icon: MapPin, desc: 'พิกัดสถานที่ทำงาน/สาขา (สำหรับเช็คอิน GPS)', group: 'TEAM' },
    REJECTION_REASON: { label: 'Reject Reasons', icon: ShieldAlert, desc: 'เหตุผลที่ส่งแก้งาน (QC) ใช้เก็บสถิติปัญหาที่พบบ่อย', group: 'TEAM' },

    // --- SYSTEM ---
    GAME_TUNING: { label: 'Game Balancing', icon: Gamepad2, desc: 'ปรับสมดุลเกม (XP, HP, Gold, Drop Rate)', group: 'SYSTEM' },
    REWARDS: { label: 'Rewards', icon: Gift, desc: 'ของรางวัลในร้านค้าสวัสดิการ (ใช้แลกแต้ม JP)', group: 'SYSTEM' },
    GREETINGS: { label: 'Greetings', icon: Smile, desc: 'คำอวยพร/ข้อความต้อนรับที่จะสุ่มแสดงเมื่อเปิดแอป', group: 'SYSTEM' },
    DASHBOARD: { label: 'Dashboard', icon: Monitor, desc: 'ตั้งค่าการ์ดสรุปงานในหน้า Admin Dashboard', group: 'SYSTEM' },
    MAINTENANCE: { label: 'Maintenance', icon: HardDrive, desc: 'ดูแลรักษาระบบ (Backup, Cleanup)', group: 'SYSTEM' },
    WIKI_CATEGORY: { label: 'Wiki Categories', icon: BookOpen, desc: 'หมวดหมู่ของคู่มือการทำงาน (Wiki)', group: 'SYSTEM' },
    STORAGE_HUB: { label: 'Storage Hubs', icon: HardDrive, desc: 'จัดการไดรฟ์และ Hub เก็บไฟล์ (รองรับการย้ายไดรฟ์ E: F: G: อัตโนมัติ)', group: 'SYSTEM' },
    PAYROLL_RULES: { label: 'Payroll Rules', icon: Coins, desc: 'ตั้งค่าอัตราค่าปรับ (หักเงิน) สำหรับการขาด/ลา/สาย', group: 'SYSTEM' },
    TRIBUNAL_SETTINGS: { label: 'Tribunal Settings', icon: Gavel, desc: 'ตั้งค่าระบบฟ้องร้อง (รางวัล, บทลงโทษ, หมวดหมู่)', group: 'SYSTEM' },
    SYSTEM_POLICY: { label: 'Policy Enforcer', icon: ShieldCheck, desc: 'ข้อตกลงการปฏิบัติงานและระเบียบวินัยสำหรับการใช้ระบบ', group: 'SYSTEM' },
};

interface MasterTabNavigationProps {
    activeTab: MasterTab;
    onTabChange: (tab: MasterTab) => void;
}

const MasterTabNavigation: React.FC<MasterTabNavigationProps> = ({ activeTab, onTabChange }) => {
    
    const renderTabButton = (key: string) => {
        const meta = MASTER_META[key];
        if (!meta) return null;
        const Icon = meta.icon;
        const isActive = activeTab === key;
        
        return (
            <button 
                key={key}
                onClick={() => onTabChange(key as MasterTab)} 
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap mb-1 ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <Icon className="w-4 h-4 mr-2" /> {meta.label}
            </button>
        );
    };

    return (
        <div className="flex xl:flex-col gap-2 overflow-x-auto xl:w-64 pb-2 xl:pb-0 shrink-0">
            {/* GROUP: WORKFLOW */}
            <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm min-w-max">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Production & Workflow</div>
                {['STATUS', 'TASK_STATUS', 'PROJECT_TYPE', 'TAG_PRESET', 'EVENT_TYPE', 'YEARLY', 'CALENDAR'].map(key => renderTabButton(key))}
            </div>

            {/* GROUP: CONTENT */}
            <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm min-w-max">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Content Metadata</div>
                {['FORMAT', 'PILLAR', 'CATEGORY', 'SCRIPT_CATEGORY', 'SHOOT_LOCATION', 'MEETING_CATEGORY'].map(key => renderTabButton(key))}
            </div>

            {/* GROUP: INVENTORY & HR */}
            <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm min-w-max">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Resources & HR</div>
                    {['INVENTORY', 'ITEM_CONDITION', 'POSITION', 'LOCATIONS', 'ATTENDANCE_RULES', 'LEAVE_TYPE', 'REJECTION_REASON'].map(key => renderTabButton(key))}
            </div>

            {/* GROUP: SYSTEM */}
            <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm min-w-max">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">System Config</div>
                    {['GAME_TUNING', 'PAYROLL_RULES', 'TRIBUNAL_SETTINGS', 'REWARDS', 'GREETINGS', 'DASHBOARD', 'MAINTENANCE', 'WIKI_CATEGORY', 'STORAGE_HUB', 'SYSTEM_POLICY'].map(key => renderTabButton(key))}
            </div>
        </div>
    );
};

export default MasterTabNavigation;
