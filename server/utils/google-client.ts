import { google } from 'googleapis';
import express from 'express';

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

export const getRedirectUri = (req?: express.Request) => {
    const PORT = 3000;
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

export const getGoogleOAuthClient = (req?: express.Request) => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        getRedirectUri(req)
    );
};

export async function getOrCreateFolder(drive: any, folderName: string, parentId?: string) {
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
