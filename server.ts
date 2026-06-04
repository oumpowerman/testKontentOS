
import express from 'express';
import { google } from 'googleapis';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { createClient } from '@supabase/supabase-js';
import { isAfter, isBefore, addDays, isSameMonth, isPast, isToday, subDays } from 'date-fns';
import { tagIndexService } from './utils/tagIndexer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

// Trust proxy is required for secure cookies behind a reverse proxy (like in AI Studio)
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cookieSession({
    name: 'session',
    keys: ['juijui-planner-secret'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true, 
    sameSite: 'none',
    httpOnly: true 
}));

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Google OAuth Configuration
const getRedirectUri = (req?: express.Request) => {
    // 1. Priority: Fixed Env Var (set this in Vercel to your custom domain)
    if (process.env.APP_URL) {
        return `${process.env.APP_URL.replace(/\/$/, '')}/auth/google/callback`;
    }
    
    // 2. Secondary: Current Request Host (Best for dynamic environments like Vercel)
    if (req) {
        const host = req.headers.host;
        const protocol = (req.headers['x-forwarded-proto'] as string) || 'https';
        return `${protocol}://${host}/auth/google/callback`;
    }

    // 3. Fallback for environment inference
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${PORT}`;
    return `${baseUrl.replace(/\/$/, '')}/auth/google/callback`;
};

// 2. Google Callback
app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    console.log('Received auth callback with code:', !!code);
    
    try {
        // We MUST use the SAME redirect URI used in the first step
        const currentRedirectUri = getRedirectUri(req);
        console.log('Using redirect URI for token exchange:', currentRedirectUri);

        const localOauthClient = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            currentRedirectUri
        );

        const { tokens } = await localOauthClient.getToken(code as string);
        console.log('Successfully obtained tokens');

        // To prevent Vercel Header size limits (4KB cookie max),
        // we store only the strictly necessary tokens in the session.
        (req.session as any).tokens = {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date,
            token_type: tokens.token_type,
            scope: tokens.scope
        };
        
        res.send(`
            <html>
                <head>
                    <title>Authentication Successful</title>
                    <style>
                        body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f0f4f8; margin: 0; }
                        .card { background: white; padding: 2.5rem; border-radius: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 400px; }
                        h2 { color: #4f46e5; margin-top: 0; }
                        p { color: #64748b; line-height: 1.5; }
                        .loader { border: 3px solid #f3f3f3; border-top: 3px solid #4f46e5; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 20px auto; }
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="loader"></div>
                        <h2>Connected!</h2>
                        <p>Google Drive has been successfully connected. This window will close automatically.</p>
                        <script>
                            // Handle Success
                            const notifyAndClose = () => {
                                // 1. Try to notify opener via postMessage
                                if (window.opener) {
                                    try {
                                        window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
                                    } catch (e) {
                                        console.error("postMessage failed", e);
                                    }
                                }

                                // 2. Fallback via localStorage
                                try {
                                    localStorage.setItem('GOOGLE_AUTH_TIMESTAMP', Date.now().toString());
                                } catch (e) {
                                    console.error("localStorage failed", e);
                                }

                                // 3. Close
                                setTimeout(() => { window.close(); }, 500);
                            };

                            notifyAndClose();
                        </script>
                    </div>
                </body>
            </html>
        `);
    } catch (error: any) {
        console.error('Error getting tokens:', error);
        res.status(500).send(`
            <div style="padding: 20px; font-family: sans-serif; text-align: center;">
                <h2 style="color: #ef4444;">Authentication Failed</h2>
                <p>Something went wrong while connecting to Google Drive.</p>
                <pre style="text-align: left; background: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 12px; overflow: auto;">${error.message || error}</pre>
                <button onclick="window.close()" style="padding: 8px 16px; background: #64748b; color: white; border: none; border-radius: 6px; cursor: pointer;">Close Window</button>
            </div>
        `);
    }
});

// Update Auth URL route as well
app.get('/api/auth/google/url', (req, res) => {
    try {
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            throw new Error('Google Client ID or Secret is missing');
        }
        
        const currentRedirectUri = getRedirectUri(req);
        const localOauthClient = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            currentRedirectUri
        );

        const url = localOauthClient.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent'
        });
        res.json({ url });
    } catch (error: any) {
        console.error('Error generating auth URL:', error);
        res.status(500).json({ error: error.message || 'Failed' });
    }
});

// 3. Check Auth Status
app.get('/api/auth/google/status', (req, res) => {
    const tokens = (req.session as any).tokens;
    res.json({ connected: !!tokens });
});

// 3.5 Get Access Token
app.get('/api/auth/google/token', async (req, res) => {
    const tokens = (req.session as any).tokens;
    if (!tokens) return res.status(401).json({ error: 'Not connected' });
    
    try {
        const localAuthClient = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            getRedirectUri(req)
        );
        localAuthClient.setCredentials(tokens);
        const { token } = await localAuthClient.getAccessToken();
        
        // Update session with potentially refreshed tokens
        (req.session as any).tokens = localAuthClient.credentials;
        
        res.json({ accessToken: token });
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});

// Helper function to get or create a folder
async function getOrCreateFolder(drive: any, folderName: string, parentId?: string) {
    let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    if (parentId) {
        query += ` and '${parentId}' in parents`;
    }

    const response = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive',
    });

    if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id;
    }

    const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : []
    };

    const folder = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
    });

    return folder.data.id;
}

// 4. Upload to Google Drive
const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/upload/google-drive', upload.single('file'), async (req, res) => {
    const tokens = (req.session as any).tokens;
    if (!tokens) {
        return res.status(401).json({ error: 'Not connected to Google Drive' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Create a local OAuth2 client for this specific request to avoid race conditions
        const localAuthClient = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            getRedirectUri(req)
        );
        localAuthClient.setCredentials(tokens);
        
        const drive = google.drive({ version: 'v3', auth: localAuthClient });

        // Professional Folder Structure: Juijui_Planner_Assets -> Script_Images
        const rootFolderName = 'Juijui_Planner_Assets';
        const subFolderName = 'Script_Images';

        const rootFolderId = await getOrCreateFolder(drive, rootFolderName);
        const scriptFolderId = await getOrCreateFolder(drive, subFolderName, rootFolderId);

        const fileMetadata = {
            name: `script-img-${Date.now()}-${req.file.originalname}`,
            mimeType: req.file.mimetype,
            parents: [scriptFolderId] 
        };

        const media = {
            mimeType: req.file.mimetype,
            body: Readable.from(req.file.buffer)
        };

        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id'
        });

        const fileId = file.data.id;

        // Make file public so it can be viewed in the editor
        await drive.permissions.create({
            fileId: fileId!,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });

        // Construct a direct link using lh3.googleusercontent.com which is more reliable for embedding
        const directLink = `https://lh3.googleusercontent.com/d/${fileId}`;
        
        res.json({ 
            id: fileId,
            url: directLink 
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload to Google Drive' });
    }
});

// --- Enterprise Server-Side Tag Index & Search API ---
app.get('/api/tags', async (req, res) => {
    const q = (req.query.q as string) || '';
    const limit = parseInt(req.query.limit as string) || 12;
    const startTime = process.hrtime();
    
    try {
        const matchedTags = await tagIndexService.searchTags(q, limit);
        const diff = process.hrtime(startTime);
        const speedMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3); // precise duration
        
        res.json({
            success: true,
            query: q,
            tags: matchedTags,
            speedMs: `${speedMs}ms`,
            indexedAt: Date.now()
        });
    } catch (err: any) {
        console.error('Tag search error:', err);
        res.status(500).json({ success: false, error: err.message || 'Tag search failed' });
    }
});

app.post('/api/tags/sync', (req, res) => {
    try {
        tagIndexService.notifyUpdate();
        res.json({ success: true, message: 'Tag index sync trigger set successfully' });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message || 'Tag sync failed' });
    }
});

// --- Enterprise Server-Side Dashboard Stats & Aggregations API ---
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ajkycqazreebczqjsfpv.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa3ljcWF6cmVlYmN6cWpzZnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTM5MjMsImV4cCI6MjA4NDA2OTkyM30.VscG53hy5tT5_oT297RECiVzaCcCw51AYWQeme_PDRo';
const serverSupabase = createClient(supabaseUrl, supabaseAnonKey);

const isTaskCompletedServer = (status: string): boolean => {
    if (!status) return false;
    const s = status.trim().toUpperCase();
    if (s === 'DONE' || s === 'APPROVE' || s === 'PASSED') return true;
    const COMPLETION_KEYWORDS = [
        'COMPLETE', 'SUCCESS', 'PUBLISH', 'POSTED', 
        'FINISH', 'CLOSED', 'ARCHIVE', 'FINAL', 'DONE',
        'APPROVED', 'VERIFIED', 'ACCEPTED', 'PASS'
    ];
    return COMPLETION_KEYWORDS.some(k => s.includes(k));
};

const mapDbToTaskServer = (data: any, type: 'CONTENT' | 'TASK'): any => {
    const startDateVal = data.start_date || data.startDate || data.created_at;
    const endDateVal = data.end_date || data.endDate || data.created_at;

    let platforms = [];
    if (Array.isArray(data.target_platform)) {
        platforms = data.target_platform;
    } else if (data.target_platform) {
        platforms = [data.target_platform];
    }

    const reviews = (data.task_reviews || []).map((r: any) => ({
        id: r.id,
        taskId: r.content_id || r.task_id, 
        round: r.round,
        scheduledAt: r.scheduled_at,
        reviewerId: r.reviewer_id,
        status: r.status,
        feedback: r.feedback,
        isCompleted: r.is_completed
    }));

    return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        type: type, 
        status: data.status,
        priority: type === 'TASK' ? data.priority : undefined,
        tags: data.tags || [],
        pillar: data.pillar,
        contentFormats: data.content_formats || [],
        category: data.category,
        remark: data.remark,
        startDate: startDateVal,
        endDate: endDateVal,
        createdAt: data.created_at,
        updatedAt: data.updated_at || undefined,
        channelId: data.channel_id,
        targetPlatforms: platforms,
        scheduledTime: data.scheduled_time,
        isUnscheduled: data.is_unscheduled ?? false,
        assigneeIds: data.assignee_ids || [],
        ideaOwnerIds: data.idea_owner_ids || [],
        editorIds: data.editor_ids || [],
        assets: data.assets || [],
        reviews: reviews.sort((a: any, b: any) => (a.round || 0) - (b.round || 0)),
        logs: [], 
        performance: data.performance || undefined,
        difficulty: data.difficulty || 'MEDIUM',
        estimatedHours: data.estimated_hours || 0,
        assigneeType: data.assignee_type || 'TEAM',
        targetPosition: data.target_position,
        caution: data.caution,
        importance: data.importance,
        publishedLinks: data.published_links || {},
        shootDate: data.shoot_date || undefined,
        shootLocation: data.shoot_location || undefined,
        shootTripId: data.shoot_trip_id || undefined,
        shootTimeStart: data.shoot_time_start || undefined,
        shootTimeEnd: data.shoot_time_end || undefined,
        shootNotes: data.shoot_notes || undefined,
        localPath: data.local_path || undefined,
        driveLabel: data.drive_label || undefined,
        isInShootQueue: data.is_in_shoot_queue || false,
        isSoftFinished: data.is_soft_finished || false,
        contentId: data.content_id,
        showOnBoard: data.show_on_board,
        parentContentTitle: data.contents?.title,
        roadmapId: data.roadmap_id,
        scriptId: data.script_id,
        sla_revert_count: data.sla_revert_count,
        is_penalized: data.is_penalized,
        last_penalized_at: data.last_penalized_at || undefined,
    };
};

app.get('/api/dashboard/stats', async (req, res) => {
    const timeRange = (req.query.timeRange as string) || 'LAST_30';
    const customDays = parseInt(req.query.customDays as string) || 7;
    const viewScope = (req.query.viewScope as string) || 'ALL';
    const userId = req.query.userId as string;

    try {
        const today = new Date();

        // 1. Fetch configurations
        const { data: configs, error: configError } = await serverSupabase
            .from('dashboard_configs')
            .select('*')
            .order('sort_order', { ascending: true });

        if (configError) throw configError;

        // 2. Fetch contents
        const { data: contents, error: contentError } = await serverSupabase
            .from('contents')
            .select(`
                id, title, description, status, pillar, category, content_formats, tags,
                start_date, end_date, channel_id, created_at, updated_at, is_unscheduled, remark, scheduled_time,
                target_platform, assignee_ids, idea_owner_ids, editor_ids, shoot_trip_id,
                shoot_date, is_in_shoot_queue, is_soft_finished,
                task_reviews(id, round, status, is_completed),
                content_analytics(id, platform),
                sponsorship_details(is_sponsored, deal_value, requirements, payment_status, is_paid, invoice_url, client_id)
            `);
        
        if (contentError) throw contentError;

        // 3. Fetch tasks
        const { data: dbTasks, error: dbTasksError } = await serverSupabase
            .from('tasks')
            .select(`
                id, title, status, priority, start_date, end_date, created_at, updated_at, 
                assignee_ids, content_id, show_on_board, target_position, roadmap_id, 
                difficulty, assignee_type, estimated_hours, scheduled_time,
                contents(title), task_reviews(id, round, status, is_completed)
            `);

        if (dbTasksError) throw dbTasksError;

        // Combine into unified Task model (simplified for stat aggregate)
        const combined: any[] = [];

        if (contents) {
            contents.forEach((d: any) => {
                combined.push(mapDbToTaskServer(d, 'CONTENT'));
            });
        }

        if (dbTasks) {
            dbTasks.forEach((d: any) => {
                combined.push(mapDbToTaskServer(d, 'TASK'));
            });
        }

        // Apply global filtering logic (same as useDashboardStats.ts)
        const checkDateInRange = (dateVal: any) => {
            if (!dateVal) return false;
            const date = new Date(dateVal);
            switch (timeRange) {
                case 'THIS_MONTH': return isSameMonth(date, today);
                case 'LAST_30': return isAfter(date, addDays(today, -30));
                case 'LAST_90': return isAfter(date, addDays(today, -90));
                case 'CUSTOM': return isAfter(date, addDays(today, -customDays));
                case 'ALL': return true;
                default: return true;
            }
        };

        const filtered = combined.filter((t: any) => {
            const isDone = isTaskCompletedServer(t.status);

            // 0. Exclude Stock Items from general stats (unless Done)
            if (t.isUnscheduled && !isDone) {
                return false;
            }

            // 1. Scope Filter (Me vs All)
            if (viewScope === 'ME' && userId) {
                const isAssignee = t.assigneeIds?.includes(userId);
                const isOwner = t.ideaOwnerIds?.includes(userId);
                const isEditor = t.editorIds?.includes(userId);
                if (!isAssignee && !isOwner && !isEditor) return false;
            }

            // 2. Time Range Filter
            if (timeRange === 'ALL') return true;
            if (!t.endDate) return false;
            
            const endDateObj = new Date(t.endDate);
            const isInRange = checkDateInRange(endDateObj);
            
            if (isDone) {
                return isInRange;
            } else {
                return isInRange || isBefore(endDateObj, today); 
            }
        });

        // 4. Calculate Card Stats matching each dashboard config
        const cardStats = (configs || []).map((config: any) => {
            const statusKeys: string[] = config.status_keys || [];
            const filterType = config.filter_type || 'STATUS';

            const matchingTasks = filtered.filter((t: any) => {
                if (filterType === 'STATUS') {
                    return statusKeys.includes(t.status || '');
                } 
                else if (filterType === 'FORMAT') {
                    const formats = t.contentFormats || [];
                    return statusKeys.some(key => formats.includes(key));
                }
                else if (filterType === 'PILLAR') {
                    return statusKeys.includes(t.pillar || '');
                }
                else if (filterType === 'CATEGORY') {
                    return statusKeys.includes(t.category || '');
                }
                return false;
            });

            // Urgent Count for this card config
            const urgentCount = matchingTasks.filter((t: any) => {
                const isDone = isTaskCompletedServer(t.status);
                if (isDone || t.isUnscheduled || !t.endDate) return false;
                
                const endDateObj = new Date(t.endDate);
                const isOverdue = isPast(endDateObj) && !isToday(endDateObj);
                const isDueSoon = isToday(endDateObj) || isBefore(endDateObj, addDays(new Date(), 1));
                
                return isOverdue || isDueSoon;
            }).length;

            return {
                id: config.id,
                key: config.key,
                label: config.label,
                icon: config.icon,
                colorTheme: config.color_theme,
                statusKeys: statusKeys,
                filterType: filterType,
                sortOrder: config.sort_order,
                count: matchingTasks.length,
                urgentCount: urgentCount,
                tasks: matchingTasks // Provide complete mapped task items for details view!
            };
        });

        // Calculate progress percentage and total count
        const totalFilteredTasks = filtered.length;
        const doneTasksCount = filtered.filter((t: any) => isTaskCompletedServer(t.status)).length;
        const progressPercentage = totalFilteredTasks > 0 ? Math.round((doneTasksCount / totalFilteredTasks) * 100) : 0;

        // Format chart data matching CHART_COLORS_MAP on client
        const chartData = cardStats.map((stat: any) => ({
            name: stat.label,
            value: stat.count,
            colorTheme: stat.colorTheme || 'blue'
        })).filter((d: any) => d.value > 0);

        res.json({
            success: true,
            cardStats,
            chartData,
            totalFilteredTasks,
            progressPercentage
        });

    } catch (err: any) {
        console.error('Server-side dashboard stats failed:', err);
        res.status(500).json({ success: false, error: err.message || 'Failed to aggregate dashboard stats' });
    }
});

// Vite middleware for development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
    });
    app.use(vite.middlewares);
} else if (!process.env.VERCEL) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*all', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

export default app;

if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
