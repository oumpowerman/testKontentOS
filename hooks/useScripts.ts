
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Script, ScriptSummary, User, ScriptType } from '../types';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext';
// Fix: Use correct GenAI import
import { GoogleGenAI } from "@google/genai";

interface FetchScriptsOptions {
    page: number;
    pageSize: number;
    searchQuery?: string;
    viewTab?: 'QUEUE' | 'LIBRARY' | 'HISTORY';
    filterOwner?: string[]; // Changed to Array
    filterChannel?: string[]; // Changed to Array
    filterCategory?: string;
    filterTags?: string[]; // NEW: Multi-tag filter
    filterStatus?: string[];
    sortOrder?: 'ASC' | 'DESC'; // NEW: Add Sort Order
    isDeepSearch?: boolean; // NEW: Deep search in content
    isPersonal?: boolean; // NEW: Filter for personal workspace
    append?: boolean; // NEW: Append results instead of replacing
}

export const useScripts = (currentUser: User) => {
    const [scripts, setScripts] = useState<ScriptSummary[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    // Helper to map DB result to ScriptSummary object
    const mapScriptSummary = (s: any): ScriptSummary => ({
        id: s.id,
        title: s.title,
        status: s.status,
        version: s.version,
        authorId: s.author_id,
        contentId: s.content_id,
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
        author: s.author ? { name: s.author.full_name, avatarUrl: s.author.avatar_url } : undefined,
        ideaOwnerId: s.idea_owner_id,
        ideaOwner: s.idea_owner ? { name: s.idea_owner.full_name, avatarUrl: s.idea_owner.avatar_url } : undefined,
        linkedTaskTitle: s.contents?.title,
        estimatedDuration: s.estimated_duration || 0,
        scriptType: (s.script_type as ScriptType) || 'MONOLOGUE',
        isInShootQueue: s.is_in_shoot_queue || false,
        channelId: s.channel_id,
        category: s.category,
        tags: s.tags || [],
        objective: s.objective,
        lockedBy: s.locked_by,
        lockedAt: s.locked_at ? new Date(s.locked_at) : undefined,
        locker: s.locker ? { name: s.locker.full_name, avatarUrl: s.locker.avatar_url } : undefined,
        shareToken: s.share_token,
        isPublic: s.is_public,
        isPersonal: s.is_personal,
        sheets: s.sheets || []
    });

    const fetchScripts = useCallback(async (options: FetchScriptsOptions) => {
        const fetchId = Date.now();
        (fetchScripts as any).lastFetchId = fetchId;
        
        if (!options.append) setIsLoading(true);
        try {
            // OPTIMIZATION: Select specific columns excluding 'content' and 'sheets'
            let query = supabase
                .from('scripts')
                .select(`
                    id, title, status, version, author_id, content_id, created_at, updated_at, 
                    estimated_duration, script_type, is_in_shoot_queue, channel_id, category, tags, objective,
                    idea_owner_id, locked_by, locked_at, share_token, is_public, is_personal,
                    author:profiles!scripts_author_id_fkey(full_name, avatar_url),
                    idea_owner:profiles!scripts_idea_owner_id_fkey(full_name, avatar_url),
                    locker:profiles!scripts_locked_by_fkey(full_name, avatar_url),
                    contents (title)
                `, { count: 'exact' });

            // 1. Tab Filter
            if (options.isPersonal !== undefined) {
                query = query.eq('is_personal', options.isPersonal);
                // If in personal mode, only show scripts where user is author OR idea owner
                if (options.isPersonal) {
                    query = query.or(`author_id.eq.${currentUser.id},idea_owner_id.eq.${currentUser.id}`);
                }
            }

            if (options.viewTab === 'QUEUE') {
                query = query.eq('is_in_shoot_queue', true);
            } else if (options.viewTab === 'HISTORY') {
                query = query.eq('status', 'DONE');
            } else {
                // LIBRARY: Active scripts not in queue and not done
                query = query.eq('is_in_shoot_queue', false).neq('status', 'DONE');
            }

            // 2. Specific Filters (UPDATED: Support Multi-Select)
            if (options.filterOwner && options.filterOwner.length > 0) {
                // NEW LOGIC: Filter by Author (Writer) only to show active work
                query = query.in('author_id', options.filterOwner);
            }

            if (options.filterChannel && options.filterChannel.length > 0) {
                query = query.in('channel_id', options.filterChannel);
            }

            if (options.filterCategory && options.filterCategory !== 'ALL') {
                query = query.eq('category', options.filterCategory);
            }
            if (options.filterStatus && options.filterStatus.length > 0 && !options.filterStatus.includes('ALL')) {
                query = query.in('status', options.filterStatus);
            }

            if (options.filterTags && options.filterTags.length > 0) {
                // Use .cs (contains) for array filtering
                // This finds scripts that contain ALL of the selected tags
                query = query.contains('tags', options.filterTags);
            }

            // 3. Search (Server-side)
            if (options.searchQuery) {
                if (options.isDeepSearch) {
                    // Deep Search: Title OR Tags OR Content OR Sheets (Using Computed Column 'sheets_text')
                    query = query.or(`title.ilike.%${options.searchQuery}%,tags.cs.{${options.searchQuery}},content.ilike.%${options.searchQuery}%,sheets_text.ilike.%${options.searchQuery}%`);
                } else {
                    // Standard Search: Title OR Tags
                    query = query.or(`title.ilike.%${options.searchQuery}%,tags.cs.{${options.searchQuery}}`);
                }
            }

            // 4. Sorting & Pagination
            // Queue view usually prioritizes queue status, but standard view follows sort order
            const isAscending = options.sortOrder === 'ASC';
            
            if (options.viewTab !== 'QUEUE') {
                 query = query.order('updated_at', { ascending: isAscending });
            } else {
                 // For Queue, usually we want FIFO or manual order, but let's respect sort for now
                 query = query.order('is_in_shoot_queue', { ascending: false });
                 query = query.order('updated_at', { ascending: isAscending });
            }

            query = query.range((options.page - 1) * options.pageSize, options.page * options.pageSize - 1);

            const { data, error, count } = await query;

            // STALE CHECK: If a newer request has been started, ignore this one
            if ((fetchScripts as any).lastFetchId !== fetchId) return;

            if (error) throw error;

            if (data) {
                const newScripts = data.map(mapScriptSummary);
                if (options.append) {
                    setScripts(prev => [...prev, ...newScripts]);
                } else {
                    setScripts(newScripts);
                }
                setTotalCount(count || 0);
            }
        } catch (err: any) {
            console.error('Fetch scripts failed:', err);
            showToast('โหลดข้อมูลไม่สำเร็จ', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast, currentUser.id]);

    // Initial Realtime
    useEffect(() => {
        // Subscribe to changes to update list automatically if needed
        // (Optional: fetchScripts could be called here, but usually it's controlled by UI)
        return () => { };
    }, []);


    // Fetch FULL script content by ID
    const getScriptById = async (id: string): Promise<Script | null> => {
        try {
            const { data, error } = await supabase
                .from('scripts')
                .select(`
                    *,
                    sheets,
                    author:profiles!scripts_author_id_fkey(full_name, avatar_url),
                    idea_owner:profiles!scripts_idea_owner_id_fkey(full_name, avatar_url),
                    locker:profiles!scripts_locked_by_fkey(full_name, avatar_url),
                    contents (title)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) return null;

            return {
                ...mapScriptSummary(data),
                content: data.content || '',
                characters: data.characters || [],
                document_state: data.document_state
            };
        } catch (err) {
            console.error('Fetch script detail failed', err);
            return null;
        }
    };
    
    // NEW: Get Script by Content ID (Linkage)
    const getScriptByContentId = async (contentId: string): Promise<ScriptSummary | null> => {
        try {
            const { data, error } = await supabase
                .from('scripts')
                .select(`
                    id, title, status, version, author_id, content_id, created_at, updated_at, 
                    estimated_duration, script_type, is_in_shoot_queue, channel_id, category, tags, objective,
                    idea_owner_id, locked_by, locked_at, share_token, is_public, is_personal,
                    author:profiles!scripts_author_id_fkey(full_name, avatar_url),
                    idea_owner:profiles!scripts_idea_owner_id_fkey(full_name, avatar_url),
                    locker:profiles!scripts_locked_by_fkey(full_name, avatar_url)
                `)
                .eq('content_id', contentId)
                .maybeSingle(); // Use maybeSingle to prevent error if not found

            if (error) throw error;
            if (data) return mapScriptSummary(data);
            return null;
        } catch (err) {
            // console.error("Error checking linked script:", err);
            return null;
        }
    };

    // Create Script
    const createScript = async (scriptData: Partial<Script>) => {
        try {
            const payload = {
                title: scriptData.title,
                content: scriptData.content || '',
                status: 'DRAFT',
                version: 1,
                author_id: scriptData.authorId || currentUser.id,
                idea_owner_id: scriptData.ideaOwnerId || currentUser.id,
                content_id: scriptData.contentId || null,
                script_type: scriptData.scriptType || 'MONOLOGUE',
                channel_id: scriptData.channelId || null,
                category: scriptData.category || null,
                tags: scriptData.tags || [],
                objective: scriptData.objective || '',
                is_in_shoot_queue: false,
                is_personal: scriptData.isPersonal !== undefined ? scriptData.isPersonal : true, // Default to personal for new scripts
                sheets: scriptData.sheets || []
            };

            const { data, error } = await supabase.from('scripts').insert(payload).select().single();
            if (error) throw error;
            setTotalCount(prev => prev + 1);
            
            showToast('สร้างสคริปต์ใหม่เรียบร้อย', 'success');
            return data.id;
        } catch (err: any) {
            console.error(err);
            showToast('สร้างไม่สำเร็จ: ' + err.message, 'error');
            return null;
        }
    };

    const updateScript = async (id: string, updates: Partial<Script>): Promise<boolean> => {
        try {
            const payload: any = {
                updated_at: new Date().toISOString()
            };
            
            // Map fields to DB columns
            if (updates.title) payload.title = updates.title;
            if (updates.content) payload.content = updates.content;
            if (updates.status) payload.status = updates.status;
            if (updates.estimatedDuration !== undefined) payload.estimated_duration = updates.estimatedDuration;
            if (updates.scriptType) payload.script_type = updates.scriptType;
            if (updates.characters) payload.characters = updates.characters;
            if (updates.ideaOwnerId !== undefined) payload.idea_owner_id = updates.ideaOwnerId;
            if (updates.authorId !== undefined) payload.author_id = updates.authorId;
            if (updates.isInShootQueue !== undefined) payload.is_in_shoot_queue = updates.isInShootQueue;
            if (updates.isPublic !== undefined) payload.is_public = updates.isPublic;
            if (updates.shareToken !== undefined) payload.share_token = updates.shareToken;
            if (updates.isPersonal !== undefined) payload.is_personal = updates.isPersonal;
            if (updates.sheets) payload.sheets = updates.sheets;
            
            // --- FIX: Add Missing Metadata Fields ---
            if (updates.channelId !== undefined) payload.channel_id = updates.channelId;
            if (updates.category !== undefined) payload.category = updates.category;
            if (updates.tags !== undefined) payload.tags = updates.tags;
            if (updates.objective !== undefined) payload.objective = updates.objective;

            // --- CRITICAL FIX: MAP contentId for linking ---
            if (updates.contentId !== undefined) payload.content_id = updates.contentId;

            // Fix: select aliased column name contentId from snake_case content_id to match type
            const { data, error } = await supabase
                .from('scripts')
                .update(payload)
                .eq('id', id)
                .select('contentId:content_id') // Fetch contentId for automation
                .single();

            if (error) throw error;

            // Optimistic update for list view
            setScripts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

            // --- TRINITY PHASE 3: SYNC STATUS ---
            // If Status changed to FINAL and there is a linked Content
            if (updates.status === 'FINAL' && data?.contentId) {
                 const confirmSync = await showConfirm(
                    'บทเสร็จสมบูรณ์แล้ว! (FINAL)',
                    'ต้องการอัปเดตสถานะงานหลักเป็น "ถ่ายทำ (SHOOTING)" เลยไหม?'
                 );

                 if (confirmSync) {
                     const { error: syncError } = await supabase
                        .from('contents')
                        .update({ status: 'SHOOTING' })
                        .eq('id', data.contentId);
                    
                    if (!syncError) {
                        showToast('อัปเดตสถานะงานหลักเป็น SHOOTING แล้ว 🎬', 'success');
                    } else {
                        console.error("Sync status error", syncError);
                        showToast('อัปเดตงานหลักไม่สำเร็จ', 'error');
                    }
                 }
            }

            return true;
        } catch (err) {
            console.error('Update script failed', err);
            return false;
        }
    };

    // Promote Script to Content
    const promoteToContent = async (scriptId: string, contentData: any) => {
        try {
            // 1. Create Content
            const { data: newContent, error: contentError } = await supabase
                .from('contents')
                .insert(contentData)
                .select()
                .single();

            if (contentError) throw contentError;

            // 2. Link Script to new Content
            const { error: scriptError } = await supabase
                .from('scripts')
                .update({ 
                    content_id: newContent.id,
                    channel_id: newContent.channel_id, // Sync channel
                    category: newContent.category // Sync category
                })
                .eq('id', scriptId);

            if (scriptError) throw scriptError;

            // 3. Update Local State
            setScripts(prev => prev.map(s => s.id === scriptId ? { ...s, contentId: newContent.id } : s));
            
            showToast('ส่งเข้ากระบวนการผลิตเรียบร้อย! 🚀', 'success');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('Promote ไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const deleteScript = async (id: string) => {
        if (!await showConfirm('ยืนยันการลบสคริปต์?')) return;
        try {
            const { error } = await supabase.from('scripts').delete().eq('id', id);
            if (error) throw error;
            setScripts(prev => prev.filter(s => s.id !== id));
            showToast('ลบสคริปต์แล้ว', 'info');
            setTotalCount(prev => prev - 1);
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const toggleShootQueue = async (id: string, currentStatus: boolean): Promise<boolean> => {
        try {
            const success = await updateScript(id, { isInShootQueue: !currentStatus });
            if (success) {
                showToast(
                    !currentStatus ? 'เพิ่มเข้าคิวถ่ายทำแล้ว 🎬' : 'เอาออกจากคิวแล้ว', 
                    !currentStatus ? 'success' : 'info'
                );
                return true;
            }
            return false;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    // Fix: Updated to use @google/genai guidelines
    const generateScriptWithAI = async (prompt: string, type: 'HOOK' | 'OUTLINE' | 'FULL') => {
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                showToast('API Key ไม่ถูกต้อง', 'error');
                return null;
            }

            const ai = new GoogleGenAI({ apiKey });

            let finalPrompt = '';
            if (type === 'HOOK') {
                finalPrompt = `ช่วยคิด Hook ให้น่าสนใจ 3 แบบ สำหรับคลิปหัวข้อ: "${prompt}" (ขอสั้นๆ กระชับ ไม่เกิน 2 บรรทัดต่อแบบ)`;
            } else if (type === 'OUTLINE') {
                finalPrompt = `ช่วยวางโครงเรื่อง (Outline) สำหรับคลิปหัวข้อ: "${prompt}" โดยแบ่งเป็น Hook, Body (3 points), Conclusion/CTA`;
            } else {
                finalPrompt = `เขียนบทสคริปต์เต็มรูปแบบ สำหรับหัวข้อ: "${prompt}" โดยขอภาษาที่เป็นกันเอง เข้าใจง่าย เหมาะสำหรับ TikTok/Reels`;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: finalPrompt,
            });

            return response.text ?? null;

        } catch (err: any) {
            console.error("AI Error:", err);
            showToast('AI Error: ' + err.message, 'error');
            return null;
        }
    };

    return {
        scripts,
        totalCount,
        isLoading,
        fetchScripts,
        getScriptById,
        getScriptByContentId, 
        createScript,
        updateScript,
        promoteToContent, // NEW EXPORT
        deleteScript,
        toggleShootQueue,
        generateScriptWithAI
    };
};
