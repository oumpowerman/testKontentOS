
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { MasterOption } from '../types';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext';

interface MasterDataContextType {
    masterOptions: MasterOption[];
    annualHolidays: any[];
    calendarExceptions: any[];
    inventoryItems: any[];
    isLoading: boolean;
    fetchMasterOptions: () => Promise<void>;
    addMasterOption: (option: Omit<MasterOption, 'id'>) => Promise<boolean>;
    updateMasterOption: (option: MasterOption) => Promise<boolean>;
    deleteMasterOption: (id: string) => Promise<boolean>;
    saveMasterOptionsBulk: (options: any[]) => Promise<boolean>;
    // Inventory Mutations
    addInventoryItem: (item: any) => Promise<boolean>;
    updateInventoryItem: (item: any) => Promise<boolean>;
    deleteInventoryItem: (id: string) => Promise<boolean>;
    batchUpdateInventoryItems: (ids: string[], payload: any) => Promise<boolean>;
    updateInventoryStock: (id: string, newQuantity: number) => Promise<boolean>;
    seedDefaults: () => Promise<void>;
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

// LocalStorage Keys
const CACHE_KEY_OPTIONS = 'master_options_cache';
const CACHE_KEY_VERSION = 'master_options_version_cache';
const CACHE_KEY_INVENTORY = 'inventory_items_cache';
const CACHE_KEY_INVENTORY_VERSION = 'inventory_version_cache';

// Default Data for seeding (Moved from hook to provider)
const DEFAULT_OPTIONS = [
    { type: 'STATUS', key: 'TODO', label: 'To Do 📝', color: 'bg-gray-100 text-gray-600', sort_order: 1, progress_value: 0 },
    { type: 'STATUS', key: 'IDEA', label: 'Idea / Draft 💡', color: 'bg-yellow-50 text-yellow-600', sort_order: 2, progress_value: 15 },
    { type: 'STATUS', key: 'SCRIPT', label: 'Scripting ✍️', color: 'bg-orange-50 text-orange-600', sort_order: 3, progress_value: 30 },
    { type: 'STATUS', key: 'SHOOTING', label: 'Shooting 🎥', color: 'bg-purple-50 text-purple-600', sort_order: 4, progress_value: 50 },
    { type: 'STATUS', key: 'EDIT_CLIP', label: 'Editing ✂️', color: 'bg-indigo-50 text-indigo-600', sort_order: 5, progress_value: 70 },
    { type: 'STATUS', key: 'FEEDBACK', label: 'Review / Feedback 👀', color: 'bg-pink-50 text-pink-600', sort_order: 6, progress_value: 85 },
    { type: 'STATUS', key: 'APPROVE', label: 'Approved 👍', color: 'bg-emerald-50 text-emerald-600', sort_order: 7, progress_value: 95 },
    { type: 'STATUS', key: 'DONE', label: 'Done ✅', color: 'bg-green-100 text-green-700', sort_order: 8, progress_value: 100 },
    { type: 'TASK_STATUS', key: 'TODO', label: 'To Do (รอทำ) 📥', color: 'bg-gray-100 text-gray-600', sort_order: 1 },
    { type: 'TASK_STATUS', key: 'DOING', label: 'Doing (กำลังทำ) 🔨', color: 'bg-blue-50 text-blue-600', sort_order: 2 },
    { type: 'TASK_STATUS', key: 'WAITING', label: 'Waiting (รอตรวจ/รอผล) ✋', color: 'bg-orange-50 text-orange-600', sort_order: 3 },
    { type: 'TASK_STATUS', key: 'DONE', label: 'Done (เสร็จแล้ว) ✅', color: 'bg-green-100 text-green-700', sort_order: 4 },
    { type: 'FORMAT', key: 'SHORT_FORM', label: 'Short Form (สั้น)', color: 'bg-rose-100 text-rose-700', sort_order: 1 },
    { type: 'FORMAT', key: 'LONG_FORM', label: 'Long Form (ยาว)', color: 'bg-indigo-100 text-indigo-700', sort_order: 2 },
    { type: 'FORMAT', key: 'REELS', label: 'Reels / TikTok', color: 'bg-zinc-100 text-zinc-700', sort_order: 3 },
    { type: 'FORMAT', key: 'PICTURE', label: 'Photo / Album', color: 'bg-teal-100 text-teal-700', sort_order: 4 },
    { type: 'FORMAT', key: 'STORY', label: 'Story', color: 'bg-amber-100 text-amber-700', sort_order: 5 },
    { type: 'PILLAR', key: 'ENTERTAINMENT', label: 'Entertainment 🎬', color: 'bg-purple-100 text-purple-700', sort_order: 1 },
    { type: 'PILLAR', key: 'EDUCATION', label: 'Education 📚', color: 'bg-blue-100 text-blue-700', sort_order: 2 },
    { type: 'PILLAR', key: 'LIFESTYLE', label: 'Lifestyle 🌱', color: 'bg-green-100 text-green-700', sort_order: 3 },
    { type: 'PILLAR', key: 'PROMO', label: 'Promotion 📢', color: 'bg-orange-100 text-orange-700', sort_order: 4 },
    { type: 'PILLAR', key: 'REALTIME', label: 'Realtime / News ⚡', color: 'bg-red-100 text-red-700', sort_order: 5 },
    { type: 'CATEGORY', key: 'VLOG', label: 'Vlog', color: 'bg-gray-100 text-gray-700', sort_order: 1 },
    { type: 'CATEGORY', key: 'REVIEW', label: 'Review', color: 'bg-gray-100 text-gray-700', sort_order: 2 },
    { type: 'CATEGORY', key: 'HOW_TO', label: 'How-to', color: 'bg-gray-100 text-gray-700', sort_order: 3 },
    { type: 'CATEGORY', key: 'INTERVIEW', label: 'Interview', color: 'bg-gray-100 text-gray-700', sort_order: 4 },
    { type: 'POSITION', key: 'CEO', label: 'CEO', color: 'bg-slate-900 text-white', sort_order: 0 },
    { type: 'POSITION', key: 'HR_MANAGER', label: 'HR Manager', color: 'bg-pink-100 text-pink-700', sort_order: 1 },
    { type: 'POSITION', key: 'SENIOR_HR', label: 'Senior HR', color: 'bg-pink-50 text-pink-600', sort_order: 2 },
    { type: 'POSITION', key: 'CREATIVE', label: 'Creative', color: 'bg-yellow-100 text-yellow-700', sort_order: 3 },
    { type: 'POSITION', key: 'EDITOR', label: 'Editor', color: 'bg-blue-100 text-blue-700', sort_order: 4 },
    { type: 'POSITION', key: 'PRODUCTION', label: 'Production', color: 'bg-green-100 text-green-700', sort_order: 5 },
    { type: 'POSITION', key: 'ADMIN', label: 'Admin / Co-ord', color: 'bg-purple-100 text-purple-700', sort_order: 6 },
    { type: 'WORK_CONFIG', key: 'START_TIME', label: '10:00', color: '', sort_order: 1 },
    { type: 'WORK_CONFIG', key: 'END_TIME', label: '19:00', color: '', sort_order: 2 },
    { type: 'WORK_CONFIG', key: 'LATE_BUFFER', label: '15', color: '', sort_order: 3 },
    { type: 'WORK_CONFIG', key: 'MIN_HOURS', label: '9', color: '', sort_order: 4 },
    { type: 'WORK_CONFIG', key: 'OT_THRESHOLD_HOURS', label: '2', color: '', sort_order: 5 },
    { type: 'WORK_CONFIG', key: 'CHECKOUT_PENALTY_TIME', label: '06:00', color: '', sort_order: 6 },
    { type: 'WORK_CONFIG', key: 'DAILY_SUMMARY_DELAY_HOURS', label: '1', color: '', sort_order: 7 },
    { type: 'WORK_CONFIG', key: 'LINE_SUMMARY_DESTINATION', label: '', color: '', sort_order: 8 },
    { type: 'WORK_CONFIG', key: 'HP_PENALTY_EARLY_LEAVE_INTERVAL', label: '10', color: '', sort_order: 9 },
    { type: 'WORK_CONFIG', key: 'HP_PENALTY_EARLY_LEAVE_RATE', label: '1', color: '', sort_order: 10 },
    { type: 'ATTENDANCE_TYPE', key: 'OFFICE', label: 'เข้าออฟฟิศ', color: 'bg-indigo-600', sort_order: 10 },
    { type: 'ATTENDANCE_TYPE', key: 'ON_TIME', label: 'มาตรงเวลา (On Time)', color: 'bg-emerald-600', sort_order: 15, description: '{"icon": "CheckCircle", "category": "STANDARD"}' },
    { type: 'ATTENDANCE_TYPE', key: 'WFH', label: 'ทำงานที่บ้าน (WFH)', color: 'bg-blue-600', sort_order: 10, description: '{"icon": "Home", "category": "STANDARD"}' },
    { type: 'ATTENDANCE_TYPE', key: 'SITE', label: 'ออกกอง/ข้างนอก', color: 'bg-orange-500', sort_order: 10, description: '{"icon": "MapPin", "category": "STANDARD"}' },
    { type: 'ATTENDANCE_TYPE', key: 'LATE', label: 'มาสาย (Late)', color: 'bg-yellow-500', sort_order: -5, description: '{"icon": "Clock", "category": "STANDARD"}' },
    { type: 'ATTENDANCE_TYPE', key: 'EARLY_LEAVE', label: 'กลับก่อน (Early)', color: 'bg-orange-400', sort_order: -5, description: '{"icon": "LogOut", "category": "STANDARD"}' },
    { type: 'ATTENDANCE_TYPE', key: 'ABSENT', label: 'ขาดงาน (Absent)', color: 'bg-red-500', sort_order: -20, description: '{"icon": "UserX", "category": "STANDARD"}' },
    { type: 'ATTENDANCE_TYPE', key: 'NO_SHOW', label: 'หายเงียบ (No Show)', color: 'bg-red-800', sort_order: -50, description: '{"icon": "Ghost", "category": "STANDARD"}' },
    { type: 'LEAVE_TYPE', key: 'SICK', label: 'ลาป่วย', color: 'bg-red-500', sort_order: 1, description: '{"icon": "HeartPulse", "category": "STANDARD", "defaultQuota": 30, "placeholder": "ระบุอาการป่วย..."}' },
    { type: 'LEAVE_TYPE', key: 'VACATION', label: 'พักร้อน', color: 'bg-blue-500', sort_order: 2, description: '{"icon": "Palmtree", "category": "STANDARD", "defaultQuota": 6, "placeholder": "ระบุแผนการพักผ่อน..."}' },
    { type: 'LEAVE_TYPE', key: 'PERSONAL', label: 'ลากิจ', color: 'bg-purple-500', sort_order: 3, description: '{"icon": "Briefcase", "category": "STANDARD", "defaultQuota": 6, "placeholder": "ระบุธุระที่จำเป็น..."}' },
    { type: 'LEAVE_TYPE', key: 'EMERGENCY', label: 'ลาฉุกเฉิน', color: 'bg-rose-600', sort_order: 4, description: '{"icon": "AlertCircle", "category": "STANDARD", "defaultQuota": 3, "placeholder": "ระบุเหตุฉุกเฉิน..."}' },
    { type: 'LEAVE_TYPE', key: 'WFH', label: 'Work From Home', color: 'bg-blue-600', sort_order: 0, description: '{"icon": "Home", "category": "SPECIAL", "subLabel": "ขออนุญาตทำงานที่บ้าน", "defaultQuota": 100, "placeholder": "เช่น เคลียร์งานตัดต่อที่บ้าน...", "reasonLabel": "รายละเอียดงานที่จะทำ (Task)"}' },
    { type: 'LEAVE_TYPE', key: 'OVERTIME', label: 'ขอทำ OT', color: 'bg-indigo-600', sort_order: 5, description: '{"icon": "Moon", "category": "SPECIAL", "subLabel": "ขอทำงานล่วงเวลา", "defaultQuota": 999, "placeholder": "เช่น เร่งปิดงานลูกค้า Project A...", "reasonLabel": "รายละเอียดงานที่จะทำ (OT Task)"}' },
    { type: 'LEAVE_TYPE', key: 'LATE_ENTRY', label: 'แจ้งเข้าสาย', color: 'bg-amber-500', sort_order: 10, description: '{"icon": "Clock", "category": "CORRECTION", "defaultQuota": 999, "placeholder": "เช่น รถติดหนักมากที่แยก..."}' },
    { type: 'LEAVE_TYPE', key: 'FORGOT_CHECKIN', label: 'ลืมลงเวลาเข้า', color: 'bg-rose-500', sort_order: 11, description: '{"icon": "LogIn", "category": "CORRECTION", "defaultQuota": 999, "placeholder": "เช่น ลืมกดเข้างานเนื่องจากรีบไปประชุม..."}' },
    { type: 'LEAVE_TYPE', key: 'FORGOT_CHECKOUT', label: 'ลืมลงเวลาออก', color: 'bg-orange-500', sort_order: 12, description: '{"icon": "LogOut", "category": "CORRECTION", "defaultQuota": 999, "placeholder": "เช่น ลืมกดออกเนื่องจากรีบไปธุระต่อ..."}' },
    { type: 'LEAVE_TYPE', key: 'FORGOT_BOTH', label: 'ลืมทั้งเข้า-ออก', color: 'bg-red-600', sort_order: 13, description: '{"icon": "History", "category": "CORRECTION", "defaultQuota": 999, "placeholder": "เช่น ลืมกดทั้งเข้าและออกเนื่องจาก..."}' },
    { type: 'LEAVE_TYPE', key: 'UNPAID', label: 'ลาไม่รับค่าจ้าง', color: 'bg-slate-800', sort_order: 20, description: '{"icon": "FileText", "category": "STANDARD", "defaultQuota": 999, "placeholder": "ระบุเหตุผลการลา..."}' },
    { type: 'ATTENDANCE_RULE_KEY', key: 'CORRECTION_REFUND', label: 'คืนค่า HP (แก้เวลาออก)', color: 'bg-emerald-500', sort_order: 100, description: '{"icon": "RefreshCw", "category": "SYSTEM"}' },
    { type: 'ATTENDANCE_RULE_KEY', key: 'ABSENT_REFUND', label: 'คืนค่า HP (แก้ขาดงาน)', color: 'bg-blue-500', sort_order: 101, description: '{"icon": "RefreshCw", "category": "SYSTEM"}' },
    { type: 'ATTENDANCE_RULE_KEY', key: 'FORGOT_CHECKOUT', label: 'ลืมตอกบัตรออก (Penalty)', color: 'bg-rose-500', sort_order: 102, description: '{"icon": "AlertTriangle", "category": "SYSTEM"}' },
    { type: 'PLATFORM_CONFIG', key: 'YOUTUBE', label: 'YouTube Studio', color: 'bg-red-50 text-red-600', sort_order: 1, description: 'https://studio.youtube.com/channel/UC/videos/upload?d=ud' },
    { type: 'PLATFORM_CONFIG', key: 'FACEBOOK', label: 'Facebook Reels', color: 'bg-blue-50 text-blue-600', sort_order: 2, description: 'https://www.facebook.com/reels/create' },
    { type: 'PLATFORM_CONFIG', key: 'TIKTOK', label: 'TikTok Upload', color: 'bg-zinc-50 text-zinc-600', sort_order: 3, description: 'https://www.tiktok.com/upload' },
    { type: 'PLATFORM_CONFIG', key: 'INSTAGRAM', label: 'Instagram Create', color: 'bg-pink-50 text-pink-600', sort_order: 4, description: 'https://www.instagram.com/reels/create/' },
];

export const MasterDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [options, setOptions] = useState<MasterOption[]>([]);
    const [annualHolidays, setAnnualHolidays] = useState<any[]>([]);
    const [calendarExceptions, setCalendarExceptions] = useState<any[]>([]);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();
    const isMutatingOptionsCache = useRef(false);
    const isMutatingInventoryCache = useRef(false);

    const mapInventoryItem = useCallback((i: any) => ({
        id: i.id,
        name: i.name,
        description: i.description, 
        categoryId: i.category_id,
        imageUrl: i.image_url,
        itemType: i.item_type || 'FIXED', 
        quantity: i.quantity || 0,
        unit: i.unit,
        minThreshold: i.min_threshold,
        maxCapacity: i.max_capacity,
        tags: i.tags || [],
        assetGroup: i.asset_group,
        purchasePrice: i.purchase_price,
        purchaseDate: i.purchase_date ? new Date(i.purchase_date) : undefined,
        serialNumber: i.serial_number,
        warrantyExpire: i.warranty_expire ? new Date(i.warranty_expire) : undefined,
        condition: i.condition,
        currentHolderId: i.current_holder_id,
        groupLabel: i.group_label,
        createdAt: i.created_at ? new Date(i.created_at) : undefined
    }), []);

    const updateSystemVersion = async (key: 'master_options_version' | 'inventory_version') => {
        try {
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('system_metadata')
                .upsert({ key, last_updated_at: now }, { onConflict: 'key' });
            
            if (error) throw error;
            return now;
        } catch (e) {
            console.error(`Failed to update system version for ${key}:`, e);
            return null;
        }
    };

    const fetchOptions = useCallback(async () => {
        try {
            // 1. Check LocalStorage Cache for Options
            const cachedOptions = localStorage.getItem(CACHE_KEY_OPTIONS);
            const cachedOptionsVersion = localStorage.getItem(CACHE_KEY_VERSION);

            // 2. Check LocalStorage Cache for Inventory
            const cachedInventory = localStorage.getItem(CACHE_KEY_INVENTORY);
            const cachedInventoryVersion = localStorage.getItem(CACHE_KEY_INVENTORY_VERSION);

            // 3. Fetch Current Versions from system_metadata
            let { data: versionsData, error: versionsError } = await supabase
                .from('system_metadata')
                .select('key, last_updated_at')
                .in('key', ['master_options_version', 'inventory_version']);

            // 3.1 Heal missing versions if necessary
            if (!versionsError) {
                const missingKeys = [];
                if (!versionsData?.some(v => v.key === 'master_options_version')) missingKeys.push('master_options_version');
                if (!versionsData?.some(v => v.key === 'inventory_version')) missingKeys.push('inventory_version');

                if (missingKeys.length > 0) {
                    console.log('🔧 Master Data: Initializing missing version metadata...', missingKeys);
                    for (const key of missingKeys) {
                        await updateSystemVersion(key as any);
                    }
                    // Re-fetch versions after healing
                    const { data: healedData } = await supabase
                        .from('system_metadata')
                        .select('key, last_updated_at')
                        .in('key', ['master_options_version', 'inventory_version']);
                    versionsData = healedData;
                }
            }

            const currentOptionsVersion = versionsData?.find(v => v.key === 'master_options_version')?.last_updated_at;
            const currentInventoryVersion = versionsData?.find(v => v.key === 'inventory_version')?.last_updated_at;

            // 4. Handle Options Cache
            let optionsData = null;
            let useOptionsCache = false;

            if (isMutatingOptionsCache.current) {
                useOptionsCache = true;
                optionsData = JSON.parse(localStorage.getItem(CACHE_KEY_OPTIONS) || '[]');
                console.log('🚀 Master Data: Using cached options (Mutation in progress)');
            } else if (!versionsError && cachedOptions && cachedOptionsVersion && currentOptionsVersion && cachedOptionsVersion === currentOptionsVersion) {
                try {
                    optionsData = JSON.parse(cachedOptions);
                    useOptionsCache = true;
                    console.log('🚀 Master Data: Using cached options', currentOptionsVersion);
                } catch (e) {
                    console.warn('⚠️ Master Data: Options Cache corrupted');
                }
            }

            if (!useOptionsCache) {
                console.log('📡 Master Data: Fetching master_options...');
                const { data, error } = await supabase
                    .from('master_options')
                    .select('*')
                    .order('sort_order', { ascending: true });
                
                if (error) throw error;
                optionsData = data;

                if (data && currentOptionsVersion) {
                    localStorage.setItem(CACHE_KEY_OPTIONS, JSON.stringify(data));
                    localStorage.setItem(CACHE_KEY_VERSION, currentOptionsVersion);
                }
            }

            // 5. Handle Inventory Cache
            let inventoryData = null;
            let useInventoryCache = false;

            if (isMutatingInventoryCache.current) {
                useInventoryCache = true;
                inventoryData = JSON.parse(localStorage.getItem(CACHE_KEY_INVENTORY) || '[]');
                console.log('🚀 Master Data: Using cached inventory (Mutation in progress)');
            } else if (!versionsError && cachedInventory && cachedInventoryVersion && currentInventoryVersion && cachedInventoryVersion === currentInventoryVersion) {
                try {
                    inventoryData = JSON.parse(cachedInventory);
                    useInventoryCache = true;
                    console.log('🚀 Master Data: Using cached inventory', currentInventoryVersion);
                } catch (e) {
                    console.warn('⚠️ Master Data: Inventory Cache corrupted');
                }
            }

            if (!useInventoryCache) {
                console.log('📡 Master Data: Fetching inventory_items...');
                const { data, error } = await supabase
                    .from('inventory_items')
                    .select('*')
                    .order('name', { ascending: true });
                
                if (error) throw error;
                inventoryData = data;

                if (data && currentInventoryVersion) {
                    localStorage.setItem(CACHE_KEY_INVENTORY, JSON.stringify(data));
                    localStorage.setItem(CACHE_KEY_INVENTORY_VERSION, currentInventoryVersion);
                }
            }

            // 6. Fetch other small data in parallel
            const [holidaysRes, exceptionsRes] = await Promise.all([
                supabase.from('annual_holidays').select('*').order('month', { ascending: true }).order('day', { ascending: true }),
                supabase.from('calendar_exceptions').select('*').order('date', { ascending: true })
            ]);

            if (optionsData) {
                setOptions(optionsData.map((item: any) => ({
                    id: item.id,
                    type: (item.type || '').trim().toUpperCase(),
                    key: (item.key || '').trim(),
                    label: item.label,
                    color: item.color,
                    sortOrder: item.sort_order,
                    isActive: item.is_active,
                    isDefault: item.is_default,
                    parentKey: item.parent_key,
                    description: item.description,
                    progressValue: item.progress_value
                })));
            }

            if (inventoryData) {
                setInventoryItems(inventoryData.map(mapInventoryItem));
            }

            if (holidaysRes.data) {
                setAnnualHolidays(holidaysRes.data.map((h: any) => ({
                id: h.id,
                name: h.name,
                day: h.day,
                month: h.month,
                typeKey: h.type_key,
                isActive: h.is_active
            })));
            }
            if (exceptionsRes.data) setCalendarExceptions(exceptionsRes.data);

        } catch (err: any) {
            console.error('Fetch master options failed:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateOptionsLocalCache = async (action: 'ADD' | 'UPDATE' | 'DELETE', payload: any, skipVersionUpdate: boolean = false) => {
        isMutatingOptionsCache.current = true;
        try {
            const cachedOptions = localStorage.getItem(CACHE_KEY_OPTIONS);
            let rawOptions = cachedOptions ? JSON.parse(cachedOptions) : [];
            
            if (action === 'ADD') {
                if (!rawOptions.some((o: any) => o.id === payload.id)) {
                    rawOptions.push(payload);
                }
            } else if (action === 'UPDATE') {
                const index = rawOptions.findIndex((o: any) => o.id === payload.id);
                if (index > -1) rawOptions[index] = { ...rawOptions[index], ...payload };
            } else if (action === 'DELETE') {
                rawOptions = rawOptions.filter((o: any) => o.id !== payload);
            }
            
            rawOptions.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
            localStorage.setItem(CACHE_KEY_OPTIONS, JSON.stringify(rawOptions));
            
            setOptions(rawOptions.map((item: any) => ({
                id: item.id,
                type: (item.type || '').trim().toUpperCase(),
                key: (item.key || '').trim(),
                label: item.label,
                color: item.color,
                sortOrder: item.sort_order,
                isActive: item.is_active,
                isDefault: item.is_default,
                parentKey: item.parent_key,
                description: item.description,
                progressValue: item.progress_value
            })));

            if (!skipVersionUpdate) {
                const newVersion = await updateSystemVersion('master_options_version');
                if (newVersion) {
                    localStorage.setItem(CACHE_KEY_VERSION, newVersion);
                }
            }
        } catch (e) {
            console.error('Error updating local options cache:', e);
        } finally {
            setTimeout(() => {
                isMutatingOptionsCache.current = false;
            }, 1000);
        }
    };

    const updateInventoryLocalCache = async (action: 'ADD' | 'UPDATE' | 'DELETE' | 'BATCH_UPDATE', payload: any, skipVersionUpdate: boolean = false) => {
        isMutatingInventoryCache.current = true;
        try {
            const cachedInventory = localStorage.getItem(CACHE_KEY_INVENTORY);
            let rawInventory = cachedInventory ? JSON.parse(cachedInventory) : [];
            
            if (action === 'ADD') {
                if (Array.isArray(payload)) {
                    payload.forEach(item => {
                        if (!rawInventory.some((i: any) => i.id === item.id)) {
                            rawInventory.push(item);
                        }
                    });
                } else {
                    if (!rawInventory.some((i: any) => i.id === payload.id)) {
                        rawInventory.push(payload);
                    }
                }
            } else if (action === 'UPDATE') {
                const index = rawInventory.findIndex((i: any) => i.id === payload.id);
                if (index > -1) rawInventory[index] = { ...rawInventory[index], ...payload };
            } else if (action === 'DELETE') {
                rawInventory = rawInventory.filter((i: any) => i.id !== payload);
            } else if (action === 'BATCH_UPDATE') {
                const { ids, data } = payload;
                rawInventory = rawInventory.map((i: any) => 
                    ids.includes(i.id) ? { ...i, ...data } : i
                );
            }
            
            rawInventory.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
            localStorage.setItem(CACHE_KEY_INVENTORY, JSON.stringify(rawInventory));
            setInventoryItems(rawInventory.map(mapInventoryItem));

            if (!skipVersionUpdate) {
                const newVersion = await updateSystemVersion('inventory_version');
                if (newVersion) {
                    localStorage.setItem(CACHE_KEY_INVENTORY_VERSION, newVersion);
                }
            }
        } catch (e) {
            console.error('Error updating local inventory cache:', e);
        } finally {
            setTimeout(() => {
                isMutatingInventoryCache.current = false;
            }, 1000);
        }
    };

    const addMasterOption = async (option: Omit<MasterOption, 'id'>) => {
        try {
            const exists = options.some(o => 
                o.type === option.type && 
                (o.key === option.key || o.label.toLowerCase().trim() === option.label.toLowerCase().trim())
            );

            if (exists) {
                showToast(`ข้อมูล "${option.label}" มีอยู่แล้วในระบบ`, 'warning');
                return false;
            }

            const payload = {
                type: option.type,
                key: option.key,
                label: option.label,
                color: option.color,
                sort_order: option.sortOrder,
                is_active: option.isActive,
                is_default: option.isDefault,
                parent_key: option.parentKey || null,
                description: option.description || null,
                progress_value: option.progressValue || 0
            };

            const { data, error } = await supabase.from('master_options').insert(payload).select().single();
            if (error) throw error;

            await updateOptionsLocalCache('ADD', data);
            showToast('เพิ่มข้อมูลสำเร็จ ✅', 'success');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('เพิ่มไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const updateMasterOption = async (option: MasterOption) => {
        try {
            const payload = {
                type: option.type,
                key: option.key,
                label: option.label,
                color: option.color,
                sort_order: option.sortOrder,
                is_active: option.isActive,
                is_default: option.isDefault,
                parent_key: option.parentKey || null,
                description: option.description || null,
                progress_value: option.progressValue || 0
            };

            const { data, error } = await supabase.from('master_options').update(payload).eq('id', option.id).select().single();
            if (error) throw error;

            await updateOptionsLocalCache('UPDATE', data);
            showToast('อัปเดตข้อมูลสำเร็จ ✨', 'success');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('อัปเดตไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const deleteMasterOption = async (id: string) => {
        const confirmed = await showConfirm('ยืนยันการลบข้อมูลนี้? หากลบแล้วอาจกระทบกับงานเก่าที่ใช้ค่านี้อยู่', 'ลบข้อมูลมาสเตอร์');
        if(!confirmed) return false;

        try {
            const { error } = await supabase.from('master_options').delete().eq('id', id);
            if (error) throw error;

            await updateOptionsLocalCache('DELETE', id);
            showToast('ลบข้อมูลเรียบร้อย 🗑️', 'info');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const saveMasterOptionsBulk = async (optionsToSave: any[]) => {
        try {
            const payloads = optionsToSave.map(option => {
                const p: any = {
                    type: option.type,
                    key: option.key,
                    label: option.label,
                    color: option.color || '',
                    sort_order: option.sortOrder !== undefined ? option.sortOrder : (option.sort_order || 0),
                    is_active: option.isActive !== undefined ? option.isActive : (option.is_active ?? true),
                    is_default: option.isDefault !== undefined ? option.isDefault : (option.is_default ?? false),
                    parent_key: option.parentKey || option.parent_key || null,
                    description: option.description || null,
                    progress_value: option.progressValue !== undefined ? option.progressValue : (option.progress_value || 0)
                };
                if (option.id) {
                    p.id = option.id;
                }
                return p;
            });

            const { data: savedRows, error } = await supabase
                .from('master_options')
                .upsert(payloads, { onConflict: 'type,key' })
                .select();

            if (error) throw error;
            if (!savedRows) throw new Error('ไม่ได้รับข้อมูลที่บันทึกกลับมาจากฐานข้อมูล');

            const cachedOptions = localStorage.getItem(CACHE_KEY_OPTIONS);
            let rawOptions = cachedOptions ? JSON.parse(cachedOptions) : [];

            savedRows.forEach((data) => {
                const index = rawOptions.findIndex((o: any) => o.id === data.id);
                if (index > -1) {
                    rawOptions[index] = { ...rawOptions[index], ...data };
                } else {
                    rawOptions.push(data);
                }
            });

            rawOptions.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
            localStorage.setItem(CACHE_KEY_OPTIONS, JSON.stringify(rawOptions));

            setOptions(rawOptions.map((item: any) => ({
                id: item.id,
                type: (item.type || '').trim().toUpperCase(),
                key: (item.key || '').trim(),
                label: item.label,
                color: item.color,
                sortOrder: item.sort_order,
                isActive: item.is_active,
                isDefault: item.is_default,
                parentKey: item.parent_key,
                description: item.description,
                progressValue: item.progress_value
            })));

            const newVersion = await updateSystemVersion('master_options_version');
            if (newVersion) {
                localStorage.setItem(CACHE_KEY_VERSION, newVersion);
            }

            showToast('บันทึกข้อมูลเรียบร้อย ✨', 'success');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const addInventoryItem = async (item: any) => {
        try {
            const { data, error } = await supabase.from('inventory_items').insert(item).select();
            if (error) throw error;
            await updateInventoryLocalCache('ADD', data);
            return true;
        } catch (err: any) {
            console.error(err);
            return false;
        }
    };

    const updateInventoryItem = async (item: any) => {
        try {
            const { id, ...payload } = item;
            const { data, error } = await supabase.from('inventory_items').update(payload).eq('id', id).select().single();
            if (error) throw error;
            await updateInventoryLocalCache('UPDATE', data);
            return true;
        } catch (err: any) {
            console.error(err);
            return false;
        }
    };

    const deleteInventoryItem = async (id: string) => {
        try {
            const { error } = await supabase.from('inventory_items').delete().eq('id', id);
            if (error) throw error;
            await updateInventoryLocalCache('DELETE', id);
            return true;
        } catch (err: any) {
            console.error(err);
            return false;
        }
    };

    const batchUpdateInventoryItems = async (ids: string[], payload: any) => {
        try {
            const { error } = await supabase.from('inventory_items').update(payload).in('id', ids);
            if (error) throw error;
            await updateInventoryLocalCache('BATCH_UPDATE', { ids, data: payload });
            return true;
        } catch (err: any) {
            console.error(err);
            return false;
        }
    };

    const updateInventoryStock = async (id: string, newQuantity: number) => {
        try {
            const { data, error } = await supabase.from('inventory_items').update({ quantity: newQuantity }).eq('id', id).select().single();
            if (error) throw error;
            await updateInventoryLocalCache('UPDATE', data);
            return true;
        } catch (err: any) {
            console.error(err);
            return false;
        }
    };

    const seedDefaults = async () => {
        try {
            setIsLoading(true);
            showToast('กำลังตรวจสอบฐานข้อมูล... กรุณารอสักครู่', 'info');
            
            const { data: existingData, error: fetchError } = await supabase
                .from('master_options')
                .select('id, type, key, description');

            if (fetchError) throw fetchError;

            const existingMap = new Map(
                existingData?.map((i: any) => [`${i.type.trim().toUpperCase()}_${i.key.trim()}`, i]) || []
            );

            let insertedCount = 0;
            let updatedCount = 0;
            
            for (const opt of DEFAULT_OPTIONS) {
                const compositeKey = `${opt.type}_${opt.key}`;
                const existing = existingMap.get(compositeKey);

                if (!existing) {
                    const { error: insertError } = await supabase
                        .from('master_options')
                        .insert(opt);

                    if (!insertError) {
                        insertedCount++;
                    }
                } else if (!existing.description && opt.description) {
                    // Update if description is missing
                    const { error: updateError } = await supabase
                        .from('master_options')
                        .update({ description: opt.description })
                        .eq('id', existing.id);
                    
                    if (!updateError) {
                        updatedCount++;
                    }
                }
            }

            if (insertedCount > 0 || updatedCount > 0) {
                showToast(`ซิงค์ข้อมูลสำเร็จ (เพิ่ม ${insertedCount}, อัปเดต ${updatedCount}) 🎉`, 'success');
                await fetchOptions(); 
            } else {
                showToast('ข้อมูลครบถ้วนและเป็นปัจจุบันอยู่แล้วครับ', 'success');
            }

        } catch (err: any) {
            console.error(err);
            showToast('สร้างข้อมูลไม่สำเร็จ: ' + err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // fetchOptions(); // Disable initial fetchOptions on mount - managed by useTaskManager

        const metadataChannel = supabase.channel('system-metadata-changes')
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'system_metadata'
            }, (payload) => {
                const updatedKey = payload.new.key;
                const remoteVersion = payload.new.last_updated_at;

                if (updatedKey === 'master_options_version') {
                    const localVersion = localStorage.getItem(CACHE_KEY_VERSION);
                    if (remoteVersion !== localVersion) {
                        // Safe-Sync: Wait a bit for Delta Sync, if still mismatch, force full fetch
                        setTimeout(() => {
                            if (localStorage.getItem(CACHE_KEY_VERSION) !== remoteVersion) {
                                console.log('🔄 Master Data: Options Delta missed, healing with full fetch...');
                                fetchOptions();
                            }
                        }, 2000);
                    }
                } else if (updatedKey === 'inventory_version') {
                    const localVersion = localStorage.getItem(CACHE_KEY_INVENTORY_VERSION);
                    if (remoteVersion !== localVersion) {
                        // Safe-Sync: Wait a bit for Delta Sync
                        setTimeout(() => {
                            if (localStorage.getItem(CACHE_KEY_INVENTORY_VERSION) !== remoteVersion) {
                                console.log('🔄 Master Data: Inventory Delta missed, healing with full fetch...');
                                fetchOptions();
                            }
                        }, 2000);
                    }
                }
            }).subscribe();

        const holidaysChannel = supabase.channel('global-annual-holidays')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'annual_holidays' }, () => {
                fetchOptions();
            }).subscribe();

        const exceptionsChannel = supabase.channel('global-calendar-exceptions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_exceptions' }, () => {
                fetchOptions();
            }).subscribe();

        const optionsChannel = supabase.channel('global-master-options')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'master_options' }, (payload) => {
                if (!isMutatingOptionsCache.current) {
                    console.log(`🔄 Master Data: Remote options ${payload.eventType} detected, syncing delta...`);
                    if (payload.eventType === 'DELETE') {
                        updateOptionsLocalCache('DELETE', payload.old.id, true);
                    } else {
                        updateOptionsLocalCache(payload.eventType === 'INSERT' ? 'ADD' : 'UPDATE', payload.new, true);
                    }
                }
            }).subscribe();

        const inventoryChannel = supabase.channel('global-inventory-items')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, (payload) => {
                if (!isMutatingInventoryCache.current) {
                    console.log(`🔄 Master Data: Remote inventory ${payload.eventType} detected, syncing delta...`);
                    if (payload.eventType === 'DELETE') {
                        updateInventoryLocalCache('DELETE', payload.old.id, true);
                    } else {
                        updateInventoryLocalCache(payload.eventType === 'INSERT' ? 'ADD' : 'UPDATE', payload.new, true);
                    }
                }
            }).subscribe();

        return () => {
            supabase.removeChannel(metadataChannel);
            supabase.removeChannel(holidaysChannel);
            supabase.removeChannel(exceptionsChannel);
            supabase.removeChannel(optionsChannel);
            supabase.removeChannel(inventoryChannel);
        };
    }, [fetchOptions, mapInventoryItem]);

    const value = useMemo(() => ({
        masterOptions: options,
        annualHolidays,
        calendarExceptions,
        inventoryItems,
        isLoading,
        fetchMasterOptions: fetchOptions,
        addMasterOption,
        updateMasterOption,
        deleteMasterOption,
        saveMasterOptionsBulk,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        batchUpdateInventoryItems,
        updateInventoryStock,
        seedDefaults
    }), [
        options, annualHolidays, calendarExceptions, inventoryItems, isLoading, 
        fetchOptions, addMasterOption, updateMasterOption, deleteMasterOption, saveMasterOptionsBulk,
        addInventoryItem, updateInventoryItem, deleteInventoryItem, 
        batchUpdateInventoryItems, updateInventoryStock, seedDefaults
    ]);

    return (
        <MasterDataContext.Provider value={value}>
            {children}
        </MasterDataContext.Provider>
    );
};

export const useMasterDataContext = () => {
    const context = useContext(MasterDataContext);
    if (context === undefined) {
        throw new Error('useMasterDataContext must be used within a MasterDataProvider');
    }
    return context;
};
