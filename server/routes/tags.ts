import express from 'express';
import { tagIndexService } from '../../utils/tagIndexer.js';

const router = express.Router();

router.get('/api/tags', async (req, res) => {
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

router.post('/api/tags/sync', (req, res) => {
    try {
        tagIndexService.notifyUpdate();
        res.json({ success: true, message: 'Tag index sync trigger set successfully' });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message || 'Tag sync failed' });
    }
});

export default router;
