
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { MasterOption } from '../types';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { DEFAULT_OPTIONS } from './masterDefaults';

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
