export const getVibeConfig = (index: number, userId: string, name: string) => {
    const vibes = [
        {
            title: 'Sunlit Cafe ☕',
            desc: 'จิบคาปูชิโน่ นั่งชิลคุยกับเพื่อน',
            badgeBg: 'bg-amber-100/75 border-amber-250 text-amber-800',
            glow: 'drop-shadow-[0_0_10px_rgba(245,158,11,0.65)]',
            activities: [
               'จิบคาปูชิโน่ฟองนุ่มๆ ☕',
               'อร่อยเพลินกับทีรามิสุชิ้นโต 🍰',
               'กำลังดริปกาแฟสูตรพิเศษคูลๆ 🧪',
               'สั่งครัวซองต์เนยสดเพิ่มรัวๆ 🥐'
            ]
        },
        {
            title: 'Sleeping Nest 😴',
            desc: 'ล้มตัวลงนอน ชาร์จแบตชีวิต',
            badgeBg: 'bg-blue-100/75 border-blue-250 text-blue-800',
            glow: 'drop-shadow-[0_0_10px_rgba(59,130,246,0.65)]',
            activities: [
               'คร่อกฟี้... แอบงีบพักสายตาสุดฟิน 💤',
               'ใส่ผ้าปิดตา ขอนอนหลับเต็มตื่น 😴',
               'ซุกตัวบนเบาะนวมนิ่มๆ อุ่นจัง 💤',
               'เอนหลังรับลมธรรมชาติแสนสงบ 🍃'
            ]
        },
        {
            title: 'Active Yard 🏃‍♂️',
            desc: 'คาร์ดิโอ สเก็ตบอร์ด ปลดปล่อยพลัง',
            badgeBg: 'bg-emerald-100/75 border-emerald-250 text-emerald-800',
            glow: 'drop-shadow-[0_0_10px_rgba(16,185,129,0.65)]',
            activities: [
               'ไถสเก็ตบอร์ดตัวโปรดร่อนรับลม 🛹',
               'ยืดเส้นยืดสายโยคะแก้ปวดหลัง 🤸‍♂️',
               'ยกดัมเบลล์ฟิตเนสปั้นหุ่นสุดเฟิร์ม 🏋️',
               'ออกกำลังกายเบาๆ คูลดาวน์ฟินๆ 👟'
            ]
        },
        {
            title: 'Arcade & Jam 🎮',
            desc: 'ตี้บอร์ดเกม เพลิดเพลินเสียงดนตรี',
            badgeBg: 'bg-indigo-100/75 border-indigo-250 text-indigo-800',
            glow: 'drop-shadow-[0_0_10px_rgba(99,102,241,0.65)]',
            activities: [
               'สตรีมเกมตลุยด่านกับเพื่อนซี้ 🎮',
               'โซโล่กีตาร์โปร่งเพลินใจ 🎸',
               'ดวลบอร์ดเกมกลยุทธ์สุดระทึก 🎲',
               'เปิดเพลย์ลิสต์เพลงโปรดปังๆ 🎧'
            ]
        }
    ];

    const zoneIdx = index % 4;
    const config = vibes[zoneIdx];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const actIdx = Math.abs(hash) % config.activities.length;
    const activity = config.activities[actIdx];

    return {
        ...config,
        zoneIdx,
        activity
    };
};

export const getChillZonePosition = (index: number, total: number) => {
    const zone = index % 4;
    const idxInZone = Math.floor(index / 4);
    
    let left = 0;
    let bottom = 0;
    
    switch (zone) {
        case 0:
            left = 10 + (idxInZone * 6) % 18;
            bottom = 25 + (idxInZone * 11) % 35;
            break;
        case 1:
            left = 34 + (idxInZone * 6.5) % 16;
            bottom = 15 + (idxInZone * 13) % 35;
            break;
        case 2:
            left = 56 + (idxInZone * 5.5) % 16;
            bottom = 25 + (idxInZone * 9) % 35;
            break;
        case 3:
            left = 76 + (idxInZone * 5.5) % 16;
            bottom = 18 + (idxInZone * 11) % 35;
            break;
    }
    
    return { left: `${left}%`, bottom: `${bottom}px` };
};
