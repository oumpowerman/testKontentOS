import express from 'express';
import { isSameMonth, isAfter, addDays, isPast, isToday, isBefore } from 'date-fns';
import { serverSupabase, isTaskCompletedServer, mapDbToTaskServer } from '../utils/supabase.js';

const router = express.Router();

router.get('/api/dashboard/stats', async (req, res) => {
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
                tasks: matchingTasks // Provide mapped task items
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

export default router;
