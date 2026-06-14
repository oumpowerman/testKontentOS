import express from 'express';
import multer from 'multer';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { getGoogleOAuthClient, getOrCreateFolder } from '../utils/google-client.js';
import { BRAND_CONFIG } from '../../config/brand.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 1. Upload to Google Drive API
router.post('/api/upload/google-drive', upload.single('file'), async (req, res) => {
    const tokens = (req.session as any)?.tokens;
    if (!tokens) {
        return res.status(401).json({ error: 'Not connected to Google Drive' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const localAuthClient = getGoogleOAuthClient(req);
        localAuthClient.setCredentials(tokens);
        
        const drive = google.drive({ version: 'v3', auth: localAuthClient });

        const rootFolderName = `${BRAND_CONFIG.name.replace(/\s+/g, '_')}_Assets`;
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

// 2. Export Script to Google Docs API
router.post('/api/export/google-docs', async (req, res) => {
    const tokens = (req.session as any)?.tokens;
    if (!tokens) {
        return res.status(401).json({ error: 'Not connected to Google Drive' });
    }

    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    try {
        const localAuthClient = getGoogleOAuthClient(req);
        localAuthClient.setCredentials(tokens);
        
        const drive = google.drive({ version: 'v3', auth: localAuthClient });

        const rootFolderName = `${BRAND_CONFIG.name.replace(/\s+/g, '_')}_Assets`;
        const subFolderName = 'Exported_Scripts';

        const rootFolderId = await getOrCreateFolder(drive, rootFolderName);
        const scriptFolderId = await getOrCreateFolder(drive, subFolderName, rootFolderId);

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {
                        font-family: "Arial", "Inter", sans-serif;
                        font-size: 11pt;
                        line-height: 1.6;
                        color: #1e293b;
                        margin: 1in;
                    }
                    h1 {
                        font-family: "Arial", "Inter", sans-serif;
                        color: #1e1b4b;
                        font-size: 22pt;
                        font-weight: bold;
                        margin-bottom: 6px;
                    }
                    h2 {
                        font-family: "Arial", "Inter", sans-serif;
                        color: #4f46e5;
                        font-size: 15pt;
                        font-weight: bold;
                        border-bottom: 1.5px solid #e2e8f0;
                        padding-bottom: 6px;
                        margin-top: 24px;
                        margin-bottom: 12px;
                    }
                    p {
                        margin-top: 0;
                        margin-bottom: 10px;
                    }
                    strong {
                        font-weight: bold;
                        color: #0f172a;
                    }
                    ul, ol {
                        margin-top: 0;
                        margin-bottom: 10px;
                        padding-left: 20px;
                    }
                    li {
                        margin-bottom: 6px;
                    }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <hr style="border: none; border-top: 1px solid #cbd5e1; margin-bottom: 24px;" />
                ${content}
            </body>
            </html>
        `;

        const fileMetadata = {
            name: title,
            mimeType: 'application/vnd.google-apps.document',
            parents: [scriptFolderId]
        };

        const media = {
            mimeType: 'text/html',
            body: Readable.from(htmlContent)
        };

        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, webViewLink'
        });

        res.json({
            id: file.data.id,
            name: file.data.name,
            webViewLink: file.data.webViewLink
        });
    } catch (error: any) {
        console.error('Export Google Docs error:', error);
        res.status(500).json({ error: error.message || 'Failed to export script to Google Docs' });
    }
});

export default router;
