import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const router = express.Router();

// Secure Server-side Smart Assistant Endpoint using Gemini
router.post('/api/chat/assist', async (req, res) => {
    const { message, tasks = [], channels = [] } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
        return res.json({
            text: "⚠️ [AI System] กรุณาตั้งค่า GEMINI_API_KEY ในหน้า Settings > Secrets ของระบบก่อนนะครับ เพื่อเปิดใช้งานผู้ช่วยอัจฉริยะคุยสดกับเซิร์ฟเวอร์",
            functionCalls: []
        });
    }

    try {
        const aiInstance = new GoogleGenAI({ 
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: {
                headers: {
                    'User-Agent': 'aistudio-build'
                }
            }
        });
        
        const systemInstruction = `
คุณคือ Juijui Assistant 🤖 ผู้ช่วย AI อัจฉริยะประจำระบบจัดการคอนเทนต์ KontentOS (ระบบบริหารจัดการพล็อต เลเอาต์ บทสคริปต์ และสื่อวิดีโอระดับโปรสำหรับทีมครีเอเตอร์)

หน้าที่ของคุณคือ:
1. ให้คำปรึกษา แนะนำไอเดียทำคลิปสั้น (TikTok/Shorts/Reels) ร่างพล็อตสคริปต์ ลำดับภาพ และจัดสรรแคมเปญอย่างก้าวหน้าและมืออาชีพ
2. ช่วยบริหารระบบงานผลิต โดยเมื่อผู้ใช้บอกเจตนาจะ "เพิ่ม/จดงาน" หรือ "สร้าง/เพิ่มช่องรายการ" ให้พิจารณาเรียกใช้ "Tools" หรือ Functions เพื่อทำการจัดสร้างข้อมูลให้ผู้ใช้อย่างชาญฉลาด

ข้อมูลปัจจุบันในขณะนี้:
- รายการช่อง/รายการ (Channels) ที่มีในระบบ: ${JSON.stringify(channels.map((c: any) => ({ id: c.id, name: c.name, platforms: c.platforms || [] })))}
- รายการงาน (Tasks) ในระบบขณะนี้: ${JSON.stringify(tasks.map((t: any) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority })))}

หากผู้ใช้ต้องการเพิ่มงาน (เช่น "จดงานให้หน่อยลุย ถ่ายรีวิว", "เพิ่มงานเขียนสคริปต์ไอเดียแบรนด์หรู") ให้ส่งคำสั่งตัวเลือก 'createTask' เพื่อดำเนินการทันที
หากผู้ใช้ต้องการเพิ่มช่องรายการใหม่ (เช่น "เปิดช่อง YouTube ใหม่ชื่อ จุ๊ยจุ๊ยฟีด", "สร้างช่อง TikTok แซ่บเว่อร์") ให้ส่งคำสั่ง 'createChannel'

รบกวนตอบกลับผู้ใช้เป็นภาษาไทยที่สุภาพ มีเสน่ห์แบบครีเอทีฟ คุยสนุก เป็นกันเองแต่เป็นมืออาชีพ (ใช้ Emojis ตกแต่งประกอบอย่างพอดีงาม)
`;

        const createTaskDeclaration = {
            name: 'createTask',
            description: 'บันทึกงานใหม่เข้าระบบ KontentOS ไม่ว่าจะเป็นงานเขียนสคริปต์ ถ่ายคลิป หรือตัดต่อโปรดักชั่น',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: 'ชื่องานที่กระชับ ชัดเจน เข้าใจง่ายในทีม (ภาษาไทย)'
                    },
                    description: {
                        type: Type.STRING,
                        description: 'รายละเอียดเนื้อหาหรือสิ่งที่ต้องเตรียมเพิ่มเติมสำหรับงานนี้'
                    },
                    priority: {
                        type: Type.STRING,
                        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
                        description: 'ความสำคัญเร่งด่วนของงาน (ถ้าไม่ระบุให้ตั้ง MEDIUM)'
                    },
                    channelId: {
                        type: Type.STRING,
                        description: 'ID ของช่องรายการที่เกี่ยวข้อง ค้นหาจากรายการช่องที่มีในระบบด้านบน (หากไม่ระบุในข้อความ ให้พยายามเลือกจากชื่อที่ใกล้เคียง)'
                    }
                },
                required: ['title']
            }
        };

        const createChannelDeclaration = {
            name: 'createChannel',
            description: 'ทำการสร้างช่องคอนเทนต์หรือรายการใหม่ผูกกับแพลตฟอร์มหลักเข้าระบบ',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    name: {
                        type: Type.STRING,
                        description: 'ชื่อช่อง/ชื่อรายการคอนเทนต์ใหม่'
                    },
                    platform: {
                        type: Type.STRING,
                        enum: ['YOUTUBE', 'TIKTOK', 'FACEBOOK', 'INSTAGRAM', 'OTHER'],
                        description: 'แพลตฟอร์มหลักของช่องรายการใหม่'
                    },
                    description: {
                        type: Type.STRING,
                        description: 'แนวข้อมูลหรือช่องนี้ทำเกี่ยวกับอะไรสั้นๆ'
                    }
                },
                required: ['name', 'platform']
            }
        };

        const result = await aiInstance.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: message,
            config: {
                systemInstruction,
                tools: [{ functionDeclarations: [createTaskDeclaration, createChannelDeclaration] }]
            }
        });

        const candidate = result.candidates?.[0];
        const text = candidate?.content?.parts?.find((p: any) => p.text)?.text || '';
        const functionCalls = candidate?.content?.parts?.filter((p: any) => p.functionCall);

        res.json({
            text: text || "รับทราบครับกระพริบตาเดียว! กำลังจัดการภารกิจนี้ให้อยู่นะครับ...",
            functionCalls: functionCalls ? functionCalls.map((f: any) => f.functionCall) : []
        });

    } catch (error: any) {
        console.error("Gemini Chat Assist Error on server:", error);
        res.status(500).json({
            text: "⚠️ ขออภัยครับ ระบบประมวลผลอัจฉริยะลัดวงจรชั่วคราว ลองส่งข้อความใหม่อีกทีนะครับ!"
        });
    }
});

export default router;
