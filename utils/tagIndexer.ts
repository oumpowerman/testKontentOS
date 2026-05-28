import { createClient } from '@supabase/supabase-js';

// Access Environment variables for Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ajkycqazreebczqjsfpv.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa3ljcWF6cmVlYmN6cWpzZnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTM5MjMsImV4cCI6MjA4NDA2OTkyM30.VscG53hy5tT5_oT297RECiVzaCcCw51AYWQeme_PDRo';

const isMock = !process.env.REACT_APP_SUPABASE_URL && !process.env.SUPABASE_URL;

let supabaseClient: any = null;
if (!isMock) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

// Enterprise Tag Struct for fast mapping
export interface TagIndexEntry {
    name: string;
    count: number;
}

// In-Memory Index cache for lightning-fast sub-millisecond retrieval (Enterprise design pattern)
class EnterpriseTagIndex {
    private cache: TagIndexEntry[] = [];
    private lastRefreshed = 0;
    private refreshIntervalMs = 60 * 1000; // Refresh every 1 minute
    private defaultTags: TagIndexEntry[] = [
        { name: 'Vlog', count: 4200 },
        { name: 'Review', count: 3500 },
        { name: 'Tiktok', count: 2800 },
        { name: 'Shorts', count: 2300 },
        { name: 'BehindTheScenes', count: 1850 },
        { name: 'Prank', count: 1540 },
        { name: 'Challenge', count: 1200 },
        { name: 'Finance', count: 980 },
        { name: 'Travel', count: 850 },
        { name: 'Gaming', count: 720 },
        { name: 'Cooking', count: 540 },
        { name: 'Music', count: 430 }
    ];

    /**
     * Rebuild index by querying Supabase tasks or falling back to in-memory datasets
     */
    public async rebuildIndex(): Promise<void> {
        try {
            if (isMock || !supabaseClient) {
                // If offline or mock data, index our mocked high-volume datasets
                this.cache = [...this.defaultTags];
                this.lastRefreshed = Date.now();
                return;
            }

            console.log('[TagIndex] Querying Supabase for tag indexing...');
            // Fetch tasks tags from Supabase for index processing
            // In a real enterprise DB, this would query a dedicated index view, table, or redis cache.
            const { data, error } = await supabaseClient
                .from('tasks')
                .select('tags')
                .limit(2000); // Index top latest tasks for preview scalability

            if (error) throw error;

            if (data && Array.isArray(data)) {
                const counts: Record<string, number> = {};
                data.forEach((row: any) => {
                    const tags = row.tags;
                    if (Array.isArray(tags)) {
                        tags.forEach((tag: string) => {
                            const trimmed = tag?.trim();
                            if (trimmed) {
                                counts[trimmed] = (counts[trimmed] || 0) + 1;
                            }
                        });
                    }
                });

                this.cache = Object.entries(counts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count);
                
                // Merge with default tags to guarantee diverse results in sparse mock DBs
                const existingNames = new Set(this.cache.map(t => t.name.toLowerCase()));
                this.defaultTags.forEach(defTag => {
                    if (!existingNames.has(defTag.name.toLowerCase())) {
                        this.cache.push(defTag);
                    }
                });
                
                // Keep sorted
                this.cache.sort((a, b) => b.count - a.count);
            } else {
                this.cache = [...this.defaultTags];
            }

            this.lastRefreshed = Date.now();
        } catch (err) {
            console.error('[TagIndex] Failed to rebuild tag index, using fallback tags:', err);
            this.cache = [...this.defaultTags];
            this.lastRefreshed = Date.now();
        }
    }

    /**
     * Fast prefix & substring matching for tag autocomplete
     */
    public async searchTags(query: string, limit: number = 12): Promise<TagIndexEntry[]> {
        // Run index builder if cache is stale or empty
        if (this.cache.length === 0 || Date.now() - this.lastRefreshed > this.refreshIntervalMs) {
            await this.rebuildIndex();
        }

        const cleanQuery = query.toLowerCase().trim().replace(/^#/, '');

        if (!cleanQuery) {
            return this.cache.slice(0, limit);
        }

        return this.cache
            .filter(tag => tag.name.toLowerCase().includes(cleanQuery))
            .slice(0, limit);
    }

    /**
     * Sync method allowing clients to notify tag changes for real-time reactivity
     */
    public notifyUpdate() {
        this.lastRefreshed = 0; // Trigger index rebuild on next request
    }
}

export const tagIndexService = new EnterpriseTagIndex();
