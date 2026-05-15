
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { WikiArticle, User } from '../types';
import { useToast } from './ToastContext';

interface WikiContextType {
    articles: WikiArticle[];
    isLoading: boolean;
    addArticle: (article: Omit<WikiArticle, 'id' | 'lastUpdated' | 'helpfulCount' | 'createdAt' | 'author' | 'lastEditor'>, currentUser: User) => Promise<void>;
    updateArticle: (id: string, updates: Partial<WikiArticle>, currentUser: User) => Promise<void>;
    deleteArticle: (id: string) => Promise<void>;
    toggleHelpful: (id: string) => Promise<void>;
    refreshWiki: () => Promise<void>;
    fetchArticleDetail: (id: string) => Promise<WikiArticle | null>;
}

const WikiContext = createContext<WikiContextType | undefined>(undefined);

// LocalStorage Keys
const CACHE_KEY_WIKI = 'wiki_articles_cache';
const CACHE_KEY_WIKI_VERSION = 'wiki_articles_version_cache';

export const WikiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [articles, setArticles] = useState<WikiArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const isMutatingCache = useRef(false);

    const mapArticle = useCallback((a: any): WikiArticle => ({
        id: a.id,
        title: a.title,
        category: a.category,
        content: a.content || '',
        targetRoles: a.target_roles || ['ALL'],
        createdAt: new Date(a.created_at),
        lastUpdated: new Date(a.updated_at),
        isPinned: a.is_pinned,
        coverImage: a.cover_image,
        helpfulCount: a.helpful_count || 0,
        createdBy: a.created_by,
        updatedBy: a.updated_by,
        author: a.author ? { name: a.author.full_name, avatarUrl: a.author.avatar_url } : undefined,
        lastEditor: a.lastEditor ? { name: a.lastEditor.full_name, avatarUrl: a.lastEditor.avatar_url } : undefined,
        isPartial: a.content === undefined || a.content === null
    }), []);

    const updateSystemVersion = async () => {
        try {
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('system_metadata')
                .upsert({ key: 'wiki_version', last_updated_at: now }, { onConflict: 'key' });
            
            if (error) throw error;
            return now;
        } catch (e) {
            console.error('Failed to update wiki system version:', e);
            return null;
        }
    };

    const fetchArticles = useCallback(async () => {
        try {
            // 1. Check LocalStorage Cache
            const cachedWiki = localStorage.getItem(CACHE_KEY_WIKI);
            const cachedVersion = localStorage.getItem(CACHE_KEY_WIKI_VERSION);

            // 2. Fetch Current Version from system_metadata
            let { data: versionData, error: versionError } = await supabase
                .from('system_metadata')
                .select('last_updated_at')
                .eq('key', 'wiki_version')
                .single();

            // 2.1 Heal missing version if necessary
            if (!versionError && !versionData) {
                console.log('🔧 Wiki: Initializing missing wiki_version metadata...');
                const newVer = await updateSystemVersion();
                if (newVer) {
                    versionData = { last_updated_at: newVer };
                }
            } else if (versionError && versionError.code === 'PGRST116') {
                // Key not found
                console.log('🔧 Wiki: Creating wiki_version metadata...');
                const newVer = await updateSystemVersion();
                if (newVer) {
                    versionData = { last_updated_at: newVer };
                    versionError = null;
                }
            }

            const currentVersion = versionData?.last_updated_at;

            // 3. Compare Version and decide whether to fetch full data
            let wikiData = null;
            let useCache = false;

            if (isMutatingCache.current) {
                useCache = true;
                wikiData = JSON.parse(localStorage.getItem(CACHE_KEY_WIKI) || '[]');
                console.log('🚀 Wiki: Using cached version (Mutation in progress)');
            } else if (!versionError && cachedWiki && cachedVersion && currentVersion && cachedVersion === currentVersion) {
                try {
                    wikiData = JSON.parse(cachedWiki);
                    useCache = true;
                    console.log('🚀 Wiki: Using cached version', currentVersion);
                } catch (e) {
                    console.warn('⚠️ Wiki: Cache corrupted, clearing...');
                    localStorage.removeItem(CACHE_KEY_WIKI);
                    localStorage.removeItem(CACHE_KEY_WIKI_VERSION);
                }
            }

            if (!useCache) {
                // Fetch Full Data (Metadata only for performance)
                console.log('📡 Wiki: Fetching articles metadata (Version mismatch or no cache)...');
                const { data, error } = await supabase
                    .from('wiki_articles')
                    .select(`
                        id, title, category, target_roles, is_pinned, cover_image, 
                        helpful_count, created_by, updated_by, created_at, updated_at,
                        author:profiles!wiki_articles_created_by_fkey(full_name, avatar_url),
                        lastEditor:profiles!wiki_articles_updated_by_fkey(full_name, avatar_url)
                    `)
                    .order('is_pinned', { ascending: false })
                    .order('updated_at', { ascending: false });
                
                if (error) throw error;
                wikiData = data;

                // Update Cache
                if (data && currentVersion) {
                    localStorage.setItem(CACHE_KEY_WIKI, JSON.stringify(data));
                    localStorage.setItem(CACHE_KEY_WIKI_VERSION, currentVersion);
                }
            }

            if (wikiData) {
                setArticles(wikiData.map(mapArticle));
            }
        } catch (err: any) {
            console.error('Fetch wiki failed:', err);
        } finally {
            setIsLoading(false);
        }
    }, [mapArticle]);

    const updateLocalCache = async (action: 'ADD' | 'UPDATE' | 'DELETE', payload: any, skipVersionUpdate: boolean = false) => {
        isMutatingCache.current = true;
        try {
            const cachedWiki = localStorage.getItem(CACHE_KEY_WIKI);
            let rawArticles = cachedWiki ? JSON.parse(cachedWiki) : [];
            
            if (action === 'ADD') {
                // Check if already exists to avoid duplicates from realtime
                if (!rawArticles.some((a: any) => a.id === payload.id)) {
                    rawArticles.unshift(payload);
                }
            } else if (action === 'UPDATE') {
                const index = rawArticles.findIndex((o: any) => o.id === payload.id);
                if (index > -1) {
                    // Preserve content if the payload is a metadata-only update
                    const existingContent = rawArticles[index].content;
                    rawArticles[index] = { 
                        ...rawArticles[index], 
                        ...payload,
                        content: payload.content !== undefined ? payload.content : existingContent
                    };
                }
            } else if (action === 'DELETE') {
                rawArticles = rawArticles.filter((o: any) => o.id !== payload);
            }
            
            // Re-sort: pinned first, then updated_at desc
            rawArticles.sort((a: any, b: any) => {
                if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
                return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
            });

            localStorage.setItem(CACHE_KEY_WIKI, JSON.stringify(rawArticles));
            setArticles(rawArticles.map(mapArticle));

            if (!skipVersionUpdate) {
                const newVersion = await updateSystemVersion();
                if (newVersion) {
                    localStorage.setItem(CACHE_KEY_WIKI_VERSION, newVersion);
                }
            }
        } catch (e) {
            console.error('Error updating wiki local cache:', e);
        } finally {
            setTimeout(() => {
                isMutatingCache.current = false;
            }, 1000);
        }
    };

    useEffect(() => {
        fetchArticles();

        // 1. Listen to system_metadata for version updates (Delta Sync Versioning)
        const metadataChannel = supabase.channel('wiki-metadata-changes')
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'system_metadata',
                filter: 'key=eq.wiki_version'
            }, (payload) => {
                const remoteVersion = payload.new.last_updated_at;
                const localVersion = localStorage.getItem(CACHE_KEY_WIKI_VERSION);

                if (remoteVersion !== localVersion) {
                    // Safe-Sync: Wait for Delta Sync to update the version cache
                    setTimeout(() => {
                        if (localStorage.getItem(CACHE_KEY_WIKI_VERSION) !== remoteVersion) {
                            console.log('🔄 Wiki: Delta missed, healing with full fetch...');
                            fetchArticles();
                        }
                    }, 2000);
                }
            }).subscribe();

        // 2. Listen to wiki_articles for content changes (Delta Sync Content)
        const articlesChannel = supabase
            .channel('wiki-articles-changes')
            .on(
                'postgres_changes', 
                { event: '*', schema: 'public', table: 'wiki_articles' }, 
                async (payload) => {
                    // Only handle if we are not the one who mutated it
                    if (isMutatingCache.current) return;

                    console.log(`🔄 Wiki: Remote ${payload.eventType} detected, syncing delta...`);
                    
                    if (payload.eventType === 'DELETE') {
                        await updateLocalCache('DELETE', payload.old.id, true);
                    } else {
                        // For INSERT and UPDATE, we need to fetch the joined data (author, lastEditor)
                        try {
                            const { data, error } = await supabase
                                .from('wiki_articles')
                                .select(`
                                    *,
                                    author:profiles!wiki_articles_created_by_fkey(full_name, avatar_url),
                                    lastEditor:profiles!wiki_articles_updated_by_fkey(full_name, avatar_url)
                                `)
                                .eq('id', payload.new.id)
                                .single();
                            
                            if (error) throw error;
                            if (data) {
                                await updateLocalCache(payload.eventType === 'INSERT' ? 'ADD' : 'UPDATE', data, true);
                            }
                        } catch (err) {
                            console.error('Delta sync failed, falling back to full fetch:', err);
                            fetchArticles();
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(metadataChannel);
            supabase.removeChannel(articlesChannel);
        };
    }, [fetchArticles, mapArticle]);

    const addArticle = async (article: Omit<WikiArticle, 'id' | 'lastUpdated' | 'helpfulCount' | 'createdAt' | 'author' | 'lastEditor'>, currentUser: User) => {
        try {
            const payload = {
                title: article.title,
                content: article.content,
                category: article.category,
                target_roles: article.targetRoles,
                is_pinned: article.isPinned,
                cover_image: article.coverImage,
                created_by: currentUser.id,
                updated_by: currentUser.id
            };

            const { data, error } = await supabase.from('wiki_articles').insert(payload).select(`
                *,
                author:profiles!wiki_articles_created_by_fkey(full_name, avatar_url),
                lastEditor:profiles!wiki_articles_updated_by_fkey(full_name, avatar_url)
            `).single();
            
            if (error) throw error;
            
            if (data) {
                await updateLocalCache('ADD', data);
            }

            showToast('สร้างคู่มือใหม่เรียบร้อย 🎉', 'success');
        } catch (err: any) {
            console.error(err);
            showToast('สร้างไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const updateArticle = async (id: string, updates: Partial<WikiArticle>, currentUser: User) => {
        try {
            const payload: any = {
                updated_at: new Date().toISOString(),
                updated_by: currentUser.id
            };
            if (updates.title !== undefined) payload.title = updates.title;
            if (updates.content !== undefined) payload.content = updates.content;
            if (updates.category !== undefined) payload.category = updates.category;
            if (updates.targetRoles !== undefined) payload.target_roles = updates.targetRoles;
            if (updates.isPinned !== undefined) payload.is_pinned = updates.isPinned;
            if (updates.coverImage !== undefined) payload.cover_image = updates.coverImage;
            if (updates.helpfulCount !== undefined) payload.helpful_count = updates.helpfulCount;

            const { data, error } = await supabase.from('wiki_articles').update(payload).eq('id', id).select(`
                *,
                author:profiles!wiki_articles_created_by_fkey(full_name, avatar_url),
                lastEditor:profiles!wiki_articles_updated_by_fkey(full_name, avatar_url)
            `).single();
            
            if (error) throw error;

            if (data) {
                await updateLocalCache('UPDATE', data);
            }
            
            showToast('อัปเดตคู่มือเรียบร้อย ✅', 'success');
        } catch (err: any) {
            showToast('อัปเดตไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const deleteArticle = async (id: string) => {
        try {
            const { error } = await supabase.from('wiki_articles').delete().eq('id', id);
            if (error) throw error;
            
            await updateLocalCache('DELETE', id);
            showToast('ลบคู่มือแล้ว 🗑️', 'info');
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const toggleHelpful = async (id: string) => {
        try {
            const article = articles.find(a => a.id === id);
            if (article) {
                const newCount = (article.helpfulCount || 0) + 1;
                const { data, error } = await supabase.from('wiki_articles').update({ helpful_count: newCount }).eq('id', id).select(`
                    *,
                    author:profiles!wiki_articles_created_by_fkey(full_name, avatar_url),
                    lastEditor:profiles!wiki_articles_updated_by_fkey(full_name, avatar_url)
                `).single();
                
                if (error) throw error;
                if (data) {
                    await updateLocalCache('UPDATE', data);
                }
                showToast('ขอบคุณที่กดถูกใจครับ ❤️', 'success');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchArticleDetail = async (id: string): Promise<WikiArticle | null> => {
        try {
            // Check if we already have the full content in state
            const existing = articles.find(a => a.id === id);
            if (existing && !existing.isPartial) return existing;

            console.log(`📡 Wiki: Fetching full content for article ${id}`);
            const { data, error } = await supabase
                .from('wiki_articles')
                .select(`
                    *,
                    author:profiles!wiki_articles_created_by_fkey(full_name, avatar_url),
                    lastEditor:profiles!wiki_articles_updated_by_fkey(full_name, avatar_url)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                const fullArticle = mapArticle(data);
                // Update state silently so we don't trigger refetches
                setArticles(prev => prev.map(a => a.id === id ? fullArticle : a));
                return fullArticle;
            }
            return null;
        } catch (err) {
            console.error('Fetch article detail failed:', err);
            return null;
        }
    };

    const value = useMemo(() => ({
        articles,
        isLoading,
        addArticle,
        updateArticle,
        deleteArticle,
        toggleHelpful,
        fetchArticleDetail,
        refreshWiki: fetchArticles
    }), [articles, isLoading, fetchArticles]);

    return (
        <WikiContext.Provider value={value}>
            {children}
        </WikiContext.Provider>
    );
};

export const useWikiContext = () => {
    const context = useContext(WikiContext);
    if (context === undefined) {
        throw new Error('useWikiContext must be used within a WikiProvider');
    }
    return context;
};
