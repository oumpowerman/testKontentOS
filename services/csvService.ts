
import { User, MasterOption, Channel } from '../types';

// --- Helper Functions (Pure Logic) ---

const parseCSVLine = (text: string) => {
    const result = [];
    let cell = '';
    let quote = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; } 
        else if (char === '"') { quote = !quote; } 
        else if (char === ',' && !quote) { result.push(cell); cell = ''; } 
        else { cell += char; }
    }
    result.push(cell);
    return result;
};

const findUserByName = (name: string, users: User[]): string | null => {
    if (!name) return null;
    const cleanName = name.trim().toLowerCase();
    const user = users.find(u => u.name.toLowerCase() === cleanName) || users.find(u => u.name.toLowerCase().includes(cleanName));
    return user ? user.id : null;
};

const findMasterKey = (type: string, rawValue: string, masterOptions: MasterOption[]) => {
    if (!rawValue) return null;
    const cleanRaw = rawValue.trim().toUpperCase();
    const options = masterOptions.filter(o => o.type === type);
    const exactKey = options.find(o => o.key === cleanRaw);
    if (exactKey) return exactKey.key;
    const fuzzyLabel = options.find(o => o.label.toUpperCase().includes(cleanRaw));
    if (fuzzyLabel) return fuzzyLabel.key;
    return null;
};

const parseTHDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const cleanStr = dateStr.trim();
    if (cleanStr.includes('/')) {
        const parts = cleanStr.split('/');
        if (parts.length === 3) {
            const d = parseInt(parts[0]);
            const m = parseInt(parts[1]) - 1; 
            let y = parseInt(parts[2]);
            if (y > 2400) y -= 543;
            const date = new Date(y, m, d);
            if (!isNaN(date.getTime())) return date;
        }
    }
    const fallback = new Date(cleanStr);
    return !isNaN(fallback.getTime()) ? fallback : null;
};

// --- Main Service Function ---

export const parseContentStockCSV = async (
    file: File, 
    users: User[], 
    channels: Channel[], 
    masterOptions: MasterOption[]
): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const rows = text.split(/\r\n|\n/);
                
                if (rows.length < 2) {
                    reject(new Error('File is empty or invalid format'));
                    return;
                }

                const headers = parseCSVLine(rows[0]).map(h => h.trim().toLowerCase());
                
                const colMap = {
                    title: headers.indexOf('content topic'),
                    format: headers.indexOf('content format'),
                    pillar: headers.indexOf('pillar'),
                    category: headers.indexOf('category'),
                    status: headers.indexOf('status'),
                    date: headers.indexOf('publish date'),
                    channel: headers.findIndex(h => h === 'chanel' || h === 'channel'),
                    owner: headers.indexOf('owner'),
                    idea: headers.indexOf('idea'),
                    edit: headers.indexOf('edit'),
                    sub: headers.indexOf('sub'),
                    remark: headers.findIndex(h => h.includes('remark')),
                    platform: headers.indexOf('post')
                };

                const newTasksPayload: any[] = [];

                for (let i = 1; i < rows.length; i++) {
                    const rowStr = rows[i].trim();
                    if (!rowStr) continue;
                    
                    const cols = parseCSVLine(rowStr);
                    const title = colMap.title > -1 ? cols[colMap.title]?.trim() : '';
                    if (!title) continue; 

                    let status = findMasterKey('STATUS', (colMap.status > -1 ? cols[colMap.status] : '').toUpperCase(), masterOptions) || 'TODO';
                    
                    let channelId = null;
                    const channelName = colMap.channel > -1 ? cols[colMap.channel]?.trim() : '';
                    if (channelName) {
                        const foundChannel = channels.find(c => c.name.toLowerCase().includes(channelName.toLowerCase()));
                        if (foundChannel) channelId = foundChannel.id;
                    }

                    let targetPlatforms: string[] = [];
                    if (colMap.platform > -1) {
                         const p = cols[colMap.platform]?.toLowerCase() || '';
                         if(p.includes('yt')) targetPlatforms.push('YOUTUBE');
                         if(p.includes('fb')) targetPlatforms.push('FACEBOOK');
                    }

                    let targetDate = new Date();
                    let isUnscheduled = true;
                    const dateStr = colMap.date > -1 ? cols[colMap.date]?.trim() : '';
                    const parsedDate = parseTHDate(dateStr);
                    if (parsedDate) {
                        targetDate = parsedDate;
                        isUnscheduled = false;
                    }

                    const ideaOwnerIds = [];
                    const editorIds = [];
                    const assigneeIds = [];
                    if (colMap.owner > -1) { const uid = findUserByName(cols[colMap.owner], users); if (uid) ideaOwnerIds.push(uid); }
                    if (colMap.edit > -1) { const uid = findUserByName(cols[colMap.edit], users); if (uid) editorIds.push(uid); }
                    if (colMap.sub > -1) { const uid = findUserByName(cols[colMap.sub], users); if (uid) assigneeIds.push(uid); }

                    const contentFormat = colMap.format > -1 ? findMasterKey('FORMAT', cols[colMap.format], masterOptions) : null;
                    const pillar = colMap.pillar > -1 ? findMasterKey('PILLAR', cols[colMap.pillar], masterOptions) : null;
                    const category = colMap.category > -1 ? findMasterKey('CATEGORY', cols[colMap.category], masterOptions) : null;

                    newTasksPayload.push({
                        title,
                        description: colMap.idea > -1 ? cols[colMap.idea] : '',
                        status,
                        channel_id: channelId,
                        start_date: targetDate.toISOString(),
                        end_date: targetDate.toISOString(),
                        is_unscheduled: isUnscheduled,
                        priority: 'MEDIUM',
                        content_formats: contentFormat ? [contentFormat] : [],
                        pillar: pillar,
                        category: category,
                        remark: colMap.remark > -1 ? cols[colMap.remark] : '',
                        target_platform: targetPlatforms,
                        idea_owner_ids: ideaOwnerIds,
                        editor_ids: editorIds,
                        assignee_ids: assigneeIds
                    });
                }
                
                resolve(newTasksPayload);
            } catch (err) {
                reject(err);
            }
        };
        
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};
