
import { supabase } from '../lib/supabase';
import { BRAND_CONFIG } from '../config/brand.ts';

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  line?: string;
  youtube?: string;
}

export interface HeroVideo {
  url: string;
  type?: 'youtube' | 'drive' | 'direct' | 'auto';
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterCategory {
  title: string;
  links: FooterLink[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface UpdateLog {
  version: string;
  date: string;
  changes: string[];
  type: 'major' | 'minor' | 'patch';
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  office_hours: string;
}

export interface LandingSettings {
  social_links: SocialLinks;
  hero_video?: HeroVideo;
  hero_stats?: {
    total_users: string;
    total_contents: string;
  };
  pricing?: any[];
  footer_categories?: FooterCategory[];
  faqs?: FAQItem[];
  updates?: UpdateLog[];
  contact?: ContactInfo;
}

// --- MOCKUP FALLBACK DATA ---
export const MOCKUP_SETTINGS: LandingSettings = {
  social_links: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    line: "https://line.me",
    youtube: "https://youtube.com"
  },
  footer_categories: [
    {
      title: 'ผลิตภัณฑ์',
      links: [
        { label: 'ฟีเจอร์ทั้งหมด', href: 'FEATURES' },
        { label: 'ปฏิทินคอนเทนต์', href: 'FEATURES' },
        { label: 'ระบบบริหารทีม', href: 'FEATURES' },
      ]
    },
    {
      title: 'แหล่งข้อมูล',
      links: [
        { label: 'คู่มือการใช้งาน', href: 'FAQS' },
        { label: 'อัปเดตระบบ', href: 'UPDATES' },
      ]
    },
    {
      title: 'สนับสนุน',
      links: [
        { label: 'ติดต่อเรา', href: 'CONTACT' },
        { label: 'Privacy Policy', href: 'PRIVACY' },
        { label: 'Terms of Service', href: 'TERMS' },
      ]
    }
  ],
  faqs: [
    { question: `${BRAND_CONFIG.name} คืออะไร?`, answer: "ระบบจัดการงานคอนเทนต์แบบ All-in-one สำหรับครีเอเตอร์" },
    { question: "ราคาเบื้องต้นเท่าไหร่?", answer: "เรามีแพ็กเกจเริ่มต้นฟรีสำหรับทีมขนาดเล็ก" }
  ],
  updates: [
    { version: "v1.0.5", date: "2024-05-01", type: "minor", changes: ["เพิ่มระบบ Video Preview", "ปรับปรุง UI Footer"] },
    { version: "v1.0.0", date: "2024-04-15", type: "major", changes: [`เปิดตัวระบบ ${BRAND_CONFIG.name} อย่างเป็นทางการ`] }
  ],
  contact: {
    email: BRAND_CONFIG.supportEmail,
    phone: "02-xxx-xxxx",
    address: "Bangkok, Thailand",
    office_hours: "จันทร์ - ศุกร์ | 09:00 - 18:00"
  }
};

export const getLandingSettings = async (): Promise<LandingSettings> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'landing_page_config')
      .single();

    if (error || !data) {
      return MOCKUP_SETTINGS;
    }

    // Merge DB data with mockup as base to ensure all keys exist
    return { ...MOCKUP_SETTINGS, ...(data.value as object) };
  } catch (err) {
    console.error('Error fetching landing settings:', err);
    return MOCKUP_SETTINGS;
  }
};
