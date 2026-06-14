import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../types/core';
import { SideProfileCharacter } from './cozy-lounge/SideProfileCharacter';

interface HolidayCozyLoungeProps {
    users: User[];
}

export const HolidayCozyLounge: React.FC<HolidayCozyLoungeProps> = ({ users }) => {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [activeHoverZone, setActiveHoverZone] = useState<number | null>(null);

    // Active zones meta definitions
    const zones = useMemo(() => [
        {
            id: 0,
            title: 'Sunlit Dev Cafe ☕',
            desc: 'บาร์เอสเพรสโซ่ข้างถนนอุ่นๆ ส่งกลิ่นกาแฟดริปอบอวล',
            colorBg: 'bg-amber-50/50',
            borderColor: 'border-amber-300',
            badgeClass: 'bg-amber-100 border-amber-300 text-amber-800'
        },
        {
            id: 1,
            title: 'Fluffy Rest Nest 😴',
            desc: 'เตียงนุ่มฟูกับโซฟาพาสเทล เอนหลังเคลิ้มชาร์จพลัง',
            colorBg: 'bg-blue-50/50',
            borderColor: 'border-blue-300',
            badgeClass: 'bg-blue-100 border-blue-300 text-blue-800'
        },
        {
            id: 2,
            title: 'Pro Active Gym 🏋️‍♂️',
            desc: 'เสื่อโยคะคลายเส้นและม้าบาร์เบล ฟื้นฟูร่างกายฟิตปั๋ง',
            colorBg: 'bg-emerald-50/50',
            borderColor: 'border-emerald-300',
            badgeClass: 'bg-emerald-100 border-emerald-300 text-emerald-800'
        },
        {
            id: 3,
            title: 'Arcade & Music 🎮',
            desc: 'โซนตู้เกมนีออนยุค 80s และสเตจแจมดนตรีดนตรีสด',
            colorBg: 'bg-purple-50/50',
            borderColor: 'border-purple-300',
            badgeClass: 'bg-purple-100 border-purple-300 text-purple-800'
        }
    ], []);

    // Layout calculation: Assign users to precise coordinates corresponding to the 2D side-profile furniture
    const renderedUsersInLounge = useMemo(() => {
        return users.map((user, index) => {
            const zoneIdx = index % 4;
            const idxInZone = Math.floor(index / 4);

            let posX = '0%';
            let posY = '0%';
            let direction: 'left' | 'right' = 'right';
            let pose: 'idle' | 'sleeping' | 'drinking' | 'gaming' | 'singing' | 'stretching' | 'lifting' = 'idle';
            let actionText = 'กำลังเที่ยวเล่นสนุกสนาน';
            let statusIcon = '✨';

            switch (zoneIdx) {
                case 0: // SUNLIT CAFE
                    if (idxInZone === 0) {
                        // Stool 1
                        posX = '5%';
                        posY = '185px'; // aligns with Stool 1 height
                        direction = 'right';
                        pose = 'drinking';
                        actionText = 'นั่งชิลจิบกาแฟคาปูชิโน่หอมนุ่มริมเคาน์เตอร์';
                        statusIcon = '☕';
                    } else if (idxInZone === 1) {
                        // Stool 2
                        posX = '16%';
                        posY = '185px';
                        direction = 'left';
                        pose = 'drinking';
                        actionText = 'จิบลาร์เต้อาร์ตร้อน คุยโม้ปรัชญาการเขียนโค้ดไร้บั๊ก';
                        statusIcon = '☕';
                    } else if (idxInZone === 2) {
                        // Behind counter (barista!)
                        posX = '11%';
                        posY = '200px';
                        direction = 'right';
                        pose = 'idle';
                        actionText = 'สวมบทบาริสต้ามือหนึ่งกวนสตีมนมและดริปเอสเพรสโซ่เกรดพรีเมียม';
                        statusIcon = '🧪';
                    } else {
                        // Standing/Waiting line
                        const offset = (idxInZone - 3) * 22;
                        posX = `${22 + offset}px`;
                        posY = '200px';
                        direction = 'right';
                        pose = 'idle';
                        actionText = 'ยืนรอคิวออเดอร์ครัวซองต์เนยเบลเยียมอบร้อนพวยพุ่ง';
                        statusIcon = '🥯';
                    }
                    break;

                case 1: // FLUFFY REST NEST
                    if (idxInZone === 0) {
                        // Cozy Bed
                        posX = '29%';
                        posY = '188px'; // Resting horizontal on Mattress
                        direction = 'right';
                        pose = 'sleeping';
                        actionText = 'ล้มตัวลงนอนใต้หมอนนวมขนขนนกสุดหวานปุ๋ย';
                        statusIcon = '💤';
                    } else if (idxInZone === 1) {
                        // Cozy Sofa
                        posX = '42%';
                        posY = '188px';
                        direction = 'left';
                        pose = 'sleeping';
                        actionText = 'เอนหลังเคลิ้มดูซีรีส์ฟินๆ ใต้ผ้าห่มสำลีสีเหลืองพาสเทล';
                        statusIcon = '😴';
                    } else if (idxInZone === 2) {
                        // Beanbag floor cushions
                        posX = '35.5%';
                        posY = '200px';
                        direction = 'right';
                        pose = 'idle';
                        actionText = 'นั่งเอนหลังหลับตาสมาธิสูดไอเย็นธรรมชาติสุดสงบ';
                        statusIcon = '🍃';
                    } else {
                        // Cozy floor sleeping carpet
                        const offset = (idxInZone - 3) * 20;
                        posX = `${38 + offset}%`;
                        posY = '200px';
                        direction = 'left';
                        pose = 'sleeping';
                        actionText = 'ฟุบนอนซบเบาะแมวมารุฟินๆ ดำฝันหวานอย่างเป็นสุข';
                        statusIcon = '💤';
                    }
                    break;

                case 2: // ACTIVE GYM
                    if (idxInZone === 0) {
                        // Yoga Mat
                        posX = '56%';
                        posY = '204px'; // Sitting-flat yoga stretching
                        direction = 'right';
                        pose = 'stretching';
                        actionText = 'เหยียดกล้ามเนื้อสะโพกและหลัง บรรเทาโรคออฟฟิศซินโดรมแสนปวดเกร็ง';
                        statusIcon = '🧘';
                    } else if (idxInZone === 1) {
                        // Bench Press lifting
                        posX = '69.5%';
                        posY = '185px';
                        direction = 'right';
                        pose = 'lifting';
                        actionText = 'เซ็ตยกดัมเบลหนารุ่นเหล็กดุ ปั๊มกล้ามสามหัวฟิตสุดพลัง';
                        statusIcon = '🏋️';
                    } else if (idxInZone === 2) {
                        // Free weight gym floor
                        posX = '62%';
                        posY = '200px';
                        direction = 'left';
                        pose = 'lifting';
                        actionText = 'โซโล่ยกดัมเบิลบีบไหล่กว้างสร้างสเน่ห์กระชากใจ';
                        statusIcon = '⚡';
                    } else {
                        // Standing around checkin
                        const offset = (idxInZone - 3) * 18;
                        posX = `${64.5 + offset}%`;
                        posY = '200px';
                        direction = 'right';
                        pose = 'idle';
                        actionText = 'วิดพื้นเบาเหงื่อตกเป็นเม็ดสลับเต้นแอร์โรบิกสุดร้อนแรง';
                        statusIcon = '🥊';
                    }
                    break;

                case 3: // RETRO ARCADE & MUSIC STAGE
                    if (idxInZone === 0) {
                        // Arcade machine
                        posX = '77.5%';
                        posY = '200px';
                        direction = 'right';
                        pose = 'gaming';
                        actionText = 'จับจอยสติ๊กคู่ใจ โยกยิงปราบลอร์ดบอสปีศาจมารแบบไม่กระพริบตา';
                        statusIcon = '🕹️';
                    } else if (idxInZone === 1) {
                        // Mic Stage Center
                        posX = '92.5%';
                        posY = '188px'; // sitting on stage Stool
                        direction = 'left';
                        pose = 'singing';
                        actionText = 'ดีดกีต้าร์สะพายหลังขับเสียงเพลงร็อคบัลลาดปนโรแมนติกพริ้วใจ';
                        statusIcon = '🎸';
                    } else if (idxInZone === 2) {
                        // Keyboard next to stage
                        posX = '86.5%';
                        posY = '200px';
                        direction = 'right';
                        pose = 'gaming'; // fingers playing keys
                        actionText = 'โซโล่นิ้วพรมคีย์บอร์ดซินธิไซเซอร์ปั่นจังหวะแนวดาด้าแดนซ์เซนเซชั่น';
                        statusIcon = '🎹';
                    } else {
                        // Crowd spectating
                        const offset = (idxInZone - 3) * 16;
                        posX = `${82 + offset}%`;
                        posY = '200px';
                        direction = 'right';
                        pose = 'idle';
                        actionText = 'ยืนโบกมือปรบมือขอลายเซ็นศิลปินดังพร้อมฮัมทำนองแจ๊สหวานหู';
                        statusIcon = '🎵';
                    }
                    break;
            }

            return {
                user,
                posX,
                posY,
                direction,
                pose,
                actionText,
                statusIcon,
                zoneIdx
            };
        });
    }, [users]);

    return (
        <div className="w-full py-2 select-none animate-in fade-in duration-500 font-sans" id="holiday-cozy-lounge-root-view">
            {/* Header section with cute labels */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-900 pb-3 mb-5" id="holiday-cozy-header">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md border-2 border-slate-900 bg-amber-400 flex items-center justify-center text-xl shadow-[2px_2px_0px_#000] font-black">
                        🏡
                    </div>
                    <div>
                        <h3 className="font-sans font-black text-slate-900 text-sm tracking-wide uppercase">สนามกิจกรรมผ่อนคลายวันหยุดแสนน่ารัก</h3>
                        <p className="text-[10px] text-slate-500 font-bold">วันนี้วันหยุดพิเศษ! พนักงานทุกคนมาปักหลักคุยเล่นและพักผ่อนในบาร์/คาเฟ่วิวมินิมอล 2D กันอย่างพร้อมหน้า 🍮🛋️🎨</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#000] text-[9.5px] font-black uppercase text-slate-800">
                        😴 พักเงียบ {renderedUsersInLounge.filter(u => u.zoneIdx === 1).length} คน
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border-2 border-slate-900 bg-amber-400 shadow-[2px_2px_0px_#000] text-[9.5px] font-black uppercase text-slate-900">
                        ☕ ดริปกาแฟ {renderedUsersInLounge.filter(u => u.zoneIdx === 0).length} คน
                    </span>
                </div>
            </div>

            {/* THE AWESOME 2D SIDE-VIEW PLAYGROUND COZY DECK */}
            <div 
                className="relative w-full h-[320px] border-4 border-slate-900 rounded-3xl overflow-hidden bg-slate-50 shadow-[4px_4px_0px_#000] flex flex-col justify-end"
                id="cozy-2d-viewframe"
                style={{
                    backgroundImage: 'linear-gradient(to top, #e2e8f0 1.5px, transparent 1.5px)',
                    backgroundSize: '100% 12px',
                    backgroundColor: '#fafaf9'
                }}
            >
                {/* 1) CHAMBER OVERLAYS & SKY WALLPAPERS */}
                <div className="absolute inset-x-0 top-0 bottom-[40px] grid grid-cols-4 divide-x-2 divide-dashed divide-slate-300/60 pointer-events-none z-0">
                    {/* Cafe chamber sky-back */}
                    <div className="relative bg-gradient-to-b from-amber-50/40 to-transparent">
                        <span className="absolute left-3 top-12 font-mono text-[8px] font-bold text-amber-500/50 uppercase tracking-widest leading-none">CAFE BAR</span>
                    </div>
                    {/* Bed cozy sky-back */}
                    <div className="relative bg-gradient-to-b from-blue-50/40 to-transparent">
                        <span className="absolute left-3 top-12 font-mono text-[8px] font-bold text-blue-500/50 uppercase tracking-widest leading-none">SLEEPER AREA</span>
                    </div>
                    {/* Gym power space */}
                    <div className="relative bg-gradient-to-b from-emerald-50/40 to-transparent">
                        <span className="absolute left-3 top-12 font-mono text-[8px] font-bold text-emerald-500/50 uppercase tracking-widest leading-none">FITNESS BOX</span>
                    </div>
                    {/* Arcade/Stage box */}
                    <div className="relative bg-gradient-to-b from-purple-50/40 to-transparent">
                        <span className="absolute left-3 top-12 font-mono text-[8px] font-bold text-purple-500/50 uppercase tracking-widest leading-none">RETRO LOUNGE</span>
                    </div>
                </div>

                {/* 2) 2D ILLUSTRATION FURNITURE LAYER */}
                <div className="absolute inset-0 pointer-events-none z-10">
                    
                    {/* FLOOR LINE BASE (2px strong line art) */}
                    <div className="absolute inset-x-0 bottom-[40px] h-1.5 bg-slate-900" />
                    {/* Ground grass dirt floor block */}
                    <div className="absolute inset-x-0 bottom-0 h-[40px] bg-slate-100 border-t border-slate-300" />

                    {/* CHAMBER 1: SUNLIT CAFE FURNITURES (Side View) */}
                    {/* Cafe signs & details */}
                    <div className="absolute left-[3%] bottom-[125px] border-2 border-slate-900 bg-amber-400 text-slate-950 font-black text-[7px] px-1.5 py-0.5 rounded shadow-[1.5px_1.5px_0px_#000] rotate-[-5deg]">
                        OPEN ☕
                    </div>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 320" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="pendant-glow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#fbbf24" />
                                <stop offset="100%" stopColor="#fafaf9" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Cafe Wall Shelf with cups (Line art) */}
                        <path d="M 80 100 H 170" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
                        <rect x="90" y="86" width="10" height="14" rx="1.5" fill="#fef3c7" stroke="#0f172a" strokeWidth="1.5" />
                        <rect x="110" y="86" width="10" height="14" rx="1.5" fill="#fcd34d" stroke="#0f172a" strokeWidth="1.5" />
                        <rect x="140" y="88" width="16" height="12" rx="1.5" fill="#fb923c" stroke="#0f172a" strokeWidth="1.5" />

                        {/* STOOL 1 (Cafe Seat Left) */}
                        <line x1="72" y1="210" x2="72" y2="280" stroke="#0f172a" strokeWidth="2.5" />
                        <line x1="72" y1="235" x2="92" y2="280" stroke="#0f172a" strokeWidth="1.5" />
                        <ellipse cx="72" cy="210" rx="14" ry="4" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />

                        {/* STOOL 2 (Cafe Seat Right) */}
                        <line x1="142" y1="210" x2="142" y2="280" stroke="#0f172a" strokeWidth="2.5" />
                        <line x1="142" y1="235" x2="122" y2="280" stroke="#0f172a" strokeWidth="1.5" />
                        <ellipse cx="142" cy="210" rx="14" ry="4" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />

                        {/* THE ESPRESSO BAR/COUNTER (Side-view) */}
                        <rect x="88" y="222" width="40" height="58" rx="3" fill="#d97706" stroke="#0f172a" strokeWidth="2" />
                        {/* Wooden woodgrains decoration */}
                        <line x1="100" y1="228" x2="100" y2="274" stroke="#78350f" strokeWidth="1.2" />
                        <line x1="108" y1="228" x2="108" y2="274" stroke="#78350f" strokeWidth="1.2" />
                        <line x1="116" y1="228" x2="116" y2="274" stroke="#78350f" strokeWidth="1.2" />
                        {/* Espresso Machine on top */}
                        <rect x="94" y="200" width="28" height="22" rx="2" fill="#94a3b8" stroke="#0f172a" strokeWidth="2" />
                        <rect x="98" y="210" width="10" height="12" fill="#475569" stroke="#0f172a" strokeWidth="1.5" />
                        {/* Drip nozzle */}
                        <path d="M 120 208 H 125 V 215" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
                        {/* Steam rising */}
                        <path d="M 124 194 Q 126 186 122 178 M 121 193 Q 123 188 120 182" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" />

                        {/* CHAMBER 2: SLEEPING COZY NEST FURNITURES (Side View) */}
                        {/* Grid Window */}
                        <rect x="315" y="55" width="45" height="50" rx="4" fill="#bae6fd" stroke="#0f172a" strokeWidth="2.2" />
                        <line x1="337.5" y1="55" x2="337.5" y2="105" stroke="#0f172a" strokeWidth="1.5" />
                        <line x1="315" y1="80" x2="360" y2="80" stroke="#0f172a" strokeWidth="1.5" />
                        {/* Cute yellow window curtain */}
                        <path d="M 315 55 Q 325 75 325 105 Q 315 105 315 55" fill="#fef08a" stroke="#0f172a" strokeWidth="1.5" />
                        <path d="M 360 55 Q 350 75 350 105 Q 360 105 360 55" fill="#fef08a" stroke="#0f172a" strokeWidth="1.5" />

                        {/* COZY BED */}
                        {/* Wooden bed headstand panel */}
                        <rect x="264" y="215" width="10" height="65" rx="2" fill="#7c2d12" stroke="#0f172a" strokeWidth="2" />
                        {/* Bed base bottom structure */}
                        <rect x="274" y="246" width="70" height="34" rx="2" fill="#a16207" stroke="#0f172a" strokeWidth="2" />
                        {/* Double Bed soft pink thick mattress */}
                        <rect x="274" y="232" width="67" height="15" rx="3" fill="#ffe4e6" stroke="#0f172a" strokeWidth="2" />
                        {/* Soft white fluffy pillow */}
                        <rect x="277" y="222" width="20" height="11" rx="4" fill="#fafafa" stroke="#0f172a" strokeWidth="1.8" />
                        {/* Cosy blanket throw folded down */}
                        <path d="M 304 232 H 341 V 247 H 304 Q 308 238 304 232 Z" fill="#60a5fa" stroke="#0f172a" strokeWidth="1.8" />

                        {/* COZY SOFA (Sleeve couch view) */}
                        {/* Left rounded armrest */}
                        <rect x="390" y="235" width="10" height="45" rx="4" fill="#14b8a6" stroke="#0f172a" strokeWidth="2" />
                        {/* Right rounded armrest */}
                        <rect x="454" y="235" width="10" height="45" rx="4" fill="#14b8a6" stroke="#0f172a" strokeWidth="2" />
                        {/* Main sofa long cushion bottom */}
                        <rect x="400" y="248" width="54" height="32" rx="4" fill="#0d9488" stroke="#0f172a" strokeWidth="2" />
                        {/* Backrest tall cushions */}
                        <rect x="400" y="224" width="54" height="25" rx="5" fill="#0f766e" stroke="#0f172a" strokeWidth="2" />
                        {/* Cute yellow throw cushion lying down */}
                        <rect x="442" y="235" width="10" height="14" rx="2" fill="#facc15" stroke="#0f172a" strokeWidth="1.5" transform="rotate(15, 442, 235)" />

                        {/* CHAMBER 3: ACTIVE JUNGLE GYM FURNITURES (Side View) */}
                        {/* Hanging punching box bag */}
                        <line x1="535" y1="0" x2="535" y2="90" stroke="#475569" strokeWidth="1.5" />
                        <rect x="522" y="90" width="26" height="48" rx="5" fill="#ef4444" stroke="#0f172a" strokeWidth="2.2" />
                        {/* Accent tape on punchbag */}
                        <rect x="522" y="106" width="26" height="10" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />

                        {/* GREEN/YOGA MAT FLAT */}
                        <rect x="524" y="274" width="46" height="6" rx="2" fill="#10b981" stroke="#0f172a" strokeWidth="1.8" />

                        {/* BENCH PRESS SYSTEM */}
                        {/* Upright metal safety rack sticks */}
                        <line x1="680" y1="210" x2="680" y2="280" stroke="#334155" strokeWidth="3" />
                        <line x1="712" y1="210" x2="712" y2="280" stroke="#334155" strokeWidth="3" />
                        <path d="M 675 210 H 685 M 707 210 H 717" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                        {/* Horizontal Bench padded deck red/black */}
                        <rect x="668" y="245" width="56" height="11" rx="2.5" fill="#dc2626" stroke="#0f172a" strokeWidth="2" />
                        {/* Bench support metal leg */}
                        <line x1="696" y1="256" x2="696" y2="280" stroke="#0f172a" strokeWidth="2" />
                        {/* Barbell resting on the rack hooks! */}
                        <line x1="662" y1="210" x2="730" y2="210" stroke="#475569" strokeWidth="2.5" />
                        {/* Plate weight left */}
                        <rect x="656" y="200" width="6" height="20" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="1.8" />
                        {/* Plate weight right */}
                        <rect x="730" y="200" width="6" height="20" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="1.8" />

                        {/* CHAMBER 4: ARCADE & MUSIC STAGE (Side View) */}
                        {/* Retro Glowing Neon hanging stars */}
                        <polygon points="785,55 788,62 795,63 790,68 791,75 785,71 779,75 780,68 775,63 782,62" fill="#f43f5e" stroke="#0f172a" strokeWidth="1.2" />
                        <polygon points="940,40 943,47 950,48 945,53 946,60 940,56 934,60 935,53 930,48 937,47" fill="#a855f7" stroke="#0f172a" strokeWidth="1.2" />

                        {/* RETRO ARCADE CABINET (Beautiful angle-edge box outline) */}
                        <path d="M 770 280 V 180 L 784 170 H 808 L 814 185 L 795 210 H 814 V 280 Z" fill="#312e81" stroke="#0f172a" strokeWidth="2.2" />
                        {/* Lightup marquee banner */}
                        <path d="M 784 170 H 808 L 804 182 H 788 Z" fill="#ec4899" stroke="#0f172a" strokeWidth="1.5" />
                        {/* Glowing 8bit CRT Game Screen */}
                        <polygon points="788,187 804,187 800,206 791,206" fill="#06b6d4" stroke="#0f172a" strokeWidth="1.5" />
                        {/* Control deck joystick panel sticking out */}
                        <rect x="786" y="208" width="22" height="6" rx="1.5" fill="#facc15" stroke="#0f172a" strokeWidth="1.5" />

                        {/* COMPACT STAGE BOARD GRID */}
                        <rect x="860" y="268" width="115" height="12" rx="3" fill="#b45309" stroke="#0f172a" strokeWidth="2.2" />
                        {/* Stage Front plank steps texture */}
                        <line x1="880" y1="268" x2="880" y2="280" stroke="#78350f" strokeWidth="1.5" />
                        <line x1="910" y1="268" x2="910" y2="280" stroke="#78350f" strokeWidth="1.5" />
                        <line x1="940" y1="268" x2="940" y2="280" stroke="#78350f" strokeWidth="1.5" />

                        {/* Stage Spotlight Cones overlay */}
                        <polygon points="915,0 925,0 970,268 870,268" fill="url(#pendant-glow)" opacity="0.12" />

                        {/* Professional Standing Microphone Stand on Stage */}
                        <line x1="886" y1="205" x2="886" y2="268" stroke="#0f172a" strokeWidth="1.8" />
                        {/* Round iron weight baseline circle */}
                        <ellipse cx="886" cy="268" rx="8" ry="2" fill="#475569" stroke="#0f172a" strokeWidth="1.5" />
                        {/* Boom arm angle */}
                        <line x1="886" y1="205" x2="894" y2="198" stroke="#0f172a" strokeWidth="2" />
                        {/* Microphone head capsule */}
                        <circle cx="896" cy="196" r="3" fill="#94a3b8" stroke="#0f172a" strokeWidth="1.5" />
                    </svg>

                </div>

                {/* 3) FLOATING EMOTES & ACTIVE CHARACTERS LAYER */}
                <div className="absolute inset-0 z-20 pointer-events-auto" id="holiday-characters-deck">
                    {renderedUsersInLounge.map((userPack) => {
                        const isHovered = activeHoverZone === userPack.zoneIdx;
                        const isDeepSelected = selectedUser?.id === userPack.user.id;

                        // Calculate fine-tuned absolute top percentage or pixel coordinate
                        const leftVal = userPack.posX;
                        const topVal = userPack.posY; // exact height matching chair, bed, or floor

                        return (
                            <div
                                key={userPack.user.id}
                                className="absolute cursor-pointer transition-all duration-500 ease-out z-[90] group text-center"
                                style={{
                                    left: leftVal,
                                    top: topVal,
                                    transform: `translate(-50%, -100%) scale(${isDeepSelected ? 1.15 : 1.0})`,
                                    zIndex: isDeepSelected ? 200 : 100
                                }}
                                onClick={() => setSelectedUser(userPack.user)}
                                onMouseEnter={() => setActiveHoverZone(userPack.zoneIdx)}
                                onMouseLeave={() => setActiveHoverZone(null)}
                            >
                                <motion.div
                                    whileHover={{ y: -3.5 }}
                                    className="relative flex flex-col items-center"
                                >
                                    {/* Action Balloon Bubble floating */}
                                    <div className="absolute -top-[16px] bg-slate-900 border border-slate-700 text-[8px] text-white px-1 py-[1.5px] rounded-full flex items-center justify-center gap-1 shadow-md scale-90 opacity-90 group-hover:scale-100 group-hover:opacity-100 transition-all">
                                        <span>{userPack.statusIcon}</span>
                                        <span className="font-bold">{userPack.user.name}</span>
                                    </div>

                                    {/* Sleep Bubble floating indicator */}
                                    {userPack.pose === 'sleeping' && (
                                        <div className="absolute -top-[30px] -right-[15px] pointer-events-none select-none">
                                            <motion.span
                                                animate={{ 
                                                    y: [0, -12], 
                                                    x: [0, 4, -2, 2], 
                                                    opacity: [0, 1, 0] 
                                                }}
                                                transition={{ 
                                                    repeat: Infinity, 
                                                    duration: 3.5, 
                                                    ease: 'easeOut' 
                                                }}
                                                className="font-mono text-[9px] font-black text-sky-400"
                                            >
                                                Zzz
                                            </motion.span>
                                        </div>
                                    )}

                                    {/* 2D RENDERING ENGINE */}
                                    <SideProfileCharacter
                                        user={userPack.user}
                                        pose={userPack.pose}
                                        direction={userPack.direction}
                                        scale={0.88}
                                    />

                                    {/* Little hover balloon description banner */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-5 hidden group-hover:block bg-slate-950 text-white text-[9.5px] font-black px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-800 whitespace-nowrap z-[300]">
                                        <div className="flex items-center gap-1">
                                            <span className="text-amber-400 font-bold">{userPack.user.name}</span>
                                            {userPack.user.name && <span className="text-slate-400 font-normal">({userPack.user.name})</span>}
                                        </div>
                                        <div className="text-[8px] text-slate-300 font-normal mt-0.5 max-w-[200px] whitespace-normal leading-tight">
                                            {userPack.actionText}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* LIVE COZY RESIDENT CHATS */}
            <AnimatePresence>
                {selectedUser && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-4 p-3.5 border-2 border-slate-900 bg-white rounded-2xl shadow-[4px_4px_0px_#000] flex items-center justify-between gap-3 animate-in fade-in"
                        id="user-cozy-chat-room"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-3xl leading-none bg-slate-50 border-2 border-slate-950 px-2 py-1.5 rounded-md shadow-sm select-none">
                                {selectedUser.emoji || '👾'}
                            </span>
                            <div>
                                <h4 className="font-sans font-black text-slate-900 text-xs text-left">
                                    มุมระบายความชาร์จแบตของ {selectedUser.name} <span className="text-amber-500">({selectedUser.name || 'ไม่มีชื่อเล่น'})</span>
                                </h4>
                                <p className="text-[10.5px] text-slate-500 font-bold leading-snug mt-0.5 text-left">
                                    {renderedUsersInLounge.find(u => u.user.id === selectedUser.id)?.actionText || 'กำลังเที่ยวเล่นชาร์จพลังงานเพื่อวันเขียนโค้ดอันยอดเยี่ยมที่สุด'}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedUser(null)}
                            className="bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-900 text-[10px] font-black px-3.5 py-1 rounded-md transition-colors"
                        >
                            ปิดพจนานุกรมกิจกรรม
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
