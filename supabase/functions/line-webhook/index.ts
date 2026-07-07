// Supabase Edge Function to handle LINE Messaging Webhooks
// https://deno.land/manual/getting_started/setup_your_environment

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

const LINE_REPLY_API = 'https://api.line.me/v2/bot/message/reply';

// CORS configuration helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: any) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const lineAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
  const appUrl = Deno.env.get('APP_URL') || 'https://ais-pre-soapbi7qz4nmg2wfsrvxm5-179529156039.asia-southeast1.run.app';

  try {
    const payload = await req.json();
    console.log('Received LINE Webhook payload:', JSON.stringify(payload));

    const events = payload.events || [];
    if (events.length === 0) {
      return new Response(JSON.stringify({ message: 'No events to process' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ALLOWED_KEYWORDS = ['ขอไอดี', 'เชื่อมต่อ', 'my id', 'link', 'connect', 'juijui-connect'];

    for (const event of events) {
      const replyToken = event.replyToken;
      const source = event.source || {};
      const userId = source.userId;
      const type = event.type;

      let shouldTrigger = false;

      // 1. ถ้าเป็นการเพิ่มเพื่อนใหม่ -> ส่งทักทายพร้อมปุ่มผูกบัญชีทันที
      if (type === 'follow') {
        shouldTrigger = true;
      }

      // 2. ถ้าเป็นส่งข้อความทั่วไป -> เช็คคำสำคัญหรือโค้ดลับ
      if (type === 'message' && event.message?.type === 'text') {
        const userMessage = event.message.text.trim().toLowerCase();
        
        // ตรวจสอบว่าตรงกับคำสำคัญหรือโค้ดลับที่เราอนุญาตหรือไม่
        if (ALLOWED_KEYWORDS.includes(userMessage)) {
          shouldTrigger = true;
        }
      }

      // ทำงานต่อเฉพาะเมื่อเงื่อนไขผ่านเท่านั้น
      if (replyToken && userId && shouldTrigger) {
        console.log(`Processing triggered event type "${type}" for LINE User ID: ${userId}`);

        // Construct the custom link URL containing the line_user_id query param
        const linkingUrl = `${appUrl.replace(/\/$/, '')}?line_user_id=${userId}`;

        // Construct beautiful Flex Message contents
        const flexPayload = {
          replyToken: replyToken,
          messages: [
            {
              type: 'flex',
              altText: '🔗 เชื่อมต่อบัญชี LINE กับระบบ Juijui Planner',
              contents: {
                type: 'bubble',
                hero: {
                  type: 'image',
                  url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
                  size: 'full',
                  aspectRatio: '20:13',
                  aspectMode: 'cover'
                },
                body: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: 'เชื่อมต่อบัญชี LINE ของคุณ',
                      weight: 'bold',
                      size: 'lg',
                      color: '#1e293b'
                    },
                    {
                      type: 'box',
                      layout: 'vertical',
                      margin: 'md',
                      spacing: 'sm',
                      contents: [
                        {
                          type: 'text',
                          text: 'ยินดีต้อนรับสู่ระบบแจ้งเตือนอัจฉริยะ! กรุณาเชื่อมต่อบัญชีไลน์ของคุณเข้ากับ Juijui Planner เพื่อใช้งานฟีเจอร์ดังนี้:',
                          size: 'xs',
                          color: '#64748b',
                          wrap: true
                        },
                        {
                          type: 'text',
                          text: '• 📋 แจ้งเตือนสิทธิ์ลา และรายงานสรุปการทำงาน\n• ⚡ อนุมัติ/ส่งใบลา ได้ทันใจตรงจากสมาร์ทโฟน\n• 🎮 แจ้งเตือนความคืบหน้า เควส และเลเวลขึ้นรายวัน',
                          size: 'xs',
                          color: '#475569',
                          wrap: true,
                          margin: 'xs'
                        },
                        {
                          type: 'text',
                          text: 'LINE ID ส่วนตัวของคุณ:',
                          size: 'xxs',
                          color: '#94a3b8',
                          margin: 'md'
                        },
                        {
                          type: 'text',
                          text: userId,
                          size: 'xs',
                          weight: 'bold',
                          color: '#0f172a'
                        }
                      ]
                    }
                  ]
                },
                footer: {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'xs',
                  contents: [
                    {
                      type: 'button',
                      style: 'primary',
                      height: 'sm',
                      color: '#4f46e5',
                      action: {
                        type: 'uri',
                        label: '🔗 กดเพื่อผูกบัญชีทันที',
                        uri: linkingUrl
                      }
                    },
                    {
                      type: 'box',
                      layout: 'horizontal',
                      margin: 'sm',
                      contents: [
                        {
                          type: 'text',
                          text: 'ระบบประมวลผลอัตโนมัติโดย Juijui Planner',
                          size: 'xxs',
                          color: '#94a3b8',
                          align: 'center'
                        }
                      ]
                    }
                  ]
                }
              }
            }
          ]
        };

        // Call LINE API to reply
        const response = await fetch(LINE_REPLY_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lineAccessToken}`
          },
          body: JSON.stringify(flexPayload)
        });

        const responseText = await response.text();
        console.log(`LINE Reply Status: ${response.status}, Response: ${responseText}`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
