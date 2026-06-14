import express from 'express';
import { SCOPES, getGoogleOAuthClient } from '../utils/google-client.js';

const router = express.Router();

// 1. Google Auth URL generator
router.get('/api/auth/google/url', (req, res) => {
    try {
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            throw new Error('Google Client ID or Secret is missing');
        }
        
        const localOauthClient = getGoogleOAuthClient(req);

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

// 2. Google Session Connection Status
router.get('/api/auth/google/status', (req, res) => {
    const tokens = (req.session as any)?.tokens;
    res.json({ connected: !!tokens });
});

// 3. Get Active/Refreshed Access Token
router.get('/api/auth/google/token', async (req, res) => {
    const tokens = (req.session as any)?.tokens;
    if (!tokens) return res.status(401).json({ error: 'Not connected' });
    
    try {
        const localAuthClient = getGoogleOAuthClient(req);
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

// 4. Google Callback Handler
router.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    console.log('Received auth callback with code:', !!code);
    
    try {
        const localOauthClient = getGoogleOAuthClient(req);
        const { tokens } = await localOauthClient.getToken(code as string);
        console.log('Successfully obtained tokens');

        // Store necessary tokens in session
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
                                if (window.opener) {
                                    try {
                                        window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
                                    } catch (e) {
                                        console.error("postMessage failed", e);
                                    }
                                }
                                try {
                                    localStorage.setItem('GOOGLE_AUTH_TIMESTAMP', Date.now().toString());
                                } catch (e) {
                                    console.error("localStorage failed", e);
                                }
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

export default router;
