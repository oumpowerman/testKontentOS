
import { User, MasterOption, Channel } from '../types';
import * as XLSX from 'xlsx';

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

export const readFileAsTextWithAutoEncoding = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const buffer = e.target?.result as ArrayBuffer;
            const arr = new Uint8Array(buffer);
            
            // Check UTF-8 BOM (0xEF, 0xBB, 0xBF)
            if (arr.length >= 3 && arr[0] === 0xEF && arr[1] === 0xBB && arr[2] === 0xBF) {
                const decoder = new TextDecoder('utf-8');
                resolve(decoder.decode(buffer.slice(3)));
                return;
            }

            try {
                // Try decoding as UTF-8 (strict)
                const decoder = new TextDecoder('utf-8', { fatal: true });
                const text = decoder.decode(buffer);
                resolve(text);
            } catch (err) {
                // Fallback to Windows-874 (Thai Excel format) / TIS-620
                try {
                    const decoder = new TextDecoder('windows-874');
                    const text = decoder.decode(buffer);
                    resolve(text);
                } catch (fallbackErr) {
                    try {
                        const decoder = new TextDecoder('tis-620');
                        resolve(decoder.decode(buffer));
                    } catch (finalErr) {
                        const textDecoder = new TextDecoder('utf-8');
                        resolve(textDecoder.decode(buffer));
                    }
                }
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

export const parseContentStockCSV = async (
    file: File, 
    users: User[], 
    channels: Channel[], 
    masterOptions: MasterOption[]
): Promise<any[]> => {
    try {
        const text = await readFileAsTextWithAutoEncoding(file);
        const rows = text.split(/\r\n|\n/);
        
        if (rows.length < 2) {
            throw new Error('File is empty or invalid format');
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
        
        return newTasksPayload;
    } catch (err) {
        throw err;
    }
};

const formatToYYYYMMDD = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const parseHistoricalLeaveCSV = async (
    file: File,
    users: User[]
): Promise<any[]> => {
    try {
        const text = await readFileAsTextWithAutoEncoding(file);
        const rows = text.split(/\r\n|\n/);
        
        if (rows.length < 2) {
            throw new Error('ไฟล์ว่างเปล่าหรือรูปแบบไม่ถูกต้อง');
        }

        const headers = parseCSVLine(rows[0]).map(h => h.trim().toLowerCase());
        
        const colMap = {
            email: headers.findIndex(h => h === 'email' || h === 'อีเมล' || h === 'username' || h === 'ชื่อผู้ใช้'),
            leaveType: headers.findIndex(h => h === 'leave_type' || h === 'leave type' || h === 'ประเภทการลา' || h === 'type'),
            startDate: headers.findIndex(h => h === 'start_date' || h === 'start date' || h === 'วันที่เริ่มต้น' || h === 'เริ่ม'),
            endDate: headers.findIndex(h => h === 'end_date' || h === 'end date' || h === 'วันที่สิ้นสุด' || h === 'สิ้นสุด'),
            reason: headers.findIndex(h => h === 'reason' || h === 'เหตุผล' || h === 'เหตุผลการลา'),
            isHalfDay: headers.findIndex(h => h === 'is_half_day' || h === 'is half day' || h === 'ครึ่งวัน' || h === 'ลาครึ่งวัน'),
            halfDaySession: headers.findIndex(h => h === 'half_day_session' || h === 'session' || h === 'ช่วงเวลา')
        };

        // Validate essential headers
        if (colMap.email === -1 || colMap.leaveType === -1 || colMap.startDate === -1 || colMap.endDate === -1) {
            throw new Error('ไม่พบหัวคอลัมน์ที่จำเป็น (อีเมล/ชื่อผู้ใช้, ประเภทการลา, วันที่เริ่มต้น, วันที่สิ้นสุด)');
        }

        const parsedLeaves: any[] = [];

        for (let i = 1; i < rows.length; i++) {
            const rowStr = rows[i].trim();
            if (!rowStr) continue;
            
            const cols = parseCSVLine(rowStr);
            const rawEmail = cols[colMap.email]?.trim();
            if (!rawEmail) continue;

            // Find user by email or fallback to username/name if match not found exactly
            const matchedUser = users.find(u => u.email?.trim().toLowerCase() === rawEmail.toLowerCase()) ||
                                users.find(u => u.name?.trim().toLowerCase() === rawEmail.toLowerCase()) ||
                                users.find(u => u.username?.trim().toLowerCase() === rawEmail.toLowerCase());
            
            if (!matchedUser) {
                console.warn(`Could not find user for email/name/username: ${rawEmail}`);
                continue; // Skip or let caller handle unmapped users
            }

            let rawType = cols[colMap.leaveType]?.trim().toUpperCase() || 'SICK';
            // Map Thai or raw types to LeaveType
            let type: string = 'SICK';
            if (rawType.includes('ป่วย') || rawType === 'SICK') type = 'SICK';
            else if (rawType.includes('พักร้อน') || rawType.includes('ประจำปี') || rawType === 'VACATION') type = 'VACATION';
            else if (rawType.includes('กิจ') || rawType === 'PERSONAL') type = 'PERSONAL';
            else if (rawType.includes('ฉุกเฉิน') || rawType === 'EMERGENCY') type = 'EMERGENCY';
            else if (rawType.includes('สาย') || rawType === 'LATE_ENTRY') type = 'LATE_ENTRY';
            else if (rawType.includes('ทำงานนอกสถานที่') || rawType === 'ONSITE') type = 'ONSITE';
            else if (rawType.includes('รีโมท') || rawType === 'WFH') type = 'WFH';
            else if (rawType.includes('ไม่รับค่าจ้าง') || rawType === 'UNPAID') type = 'UNPAID';

            const rawStart = cols[colMap.startDate]?.trim();
            const rawEnd = cols[colMap.endDate]?.trim();

            // Parse start and end date with support for slash and dash
            const parseFlexDate = (dateStr: string): Date | null => {
                if (!dateStr) return null;
                const cleanStr = dateStr.trim().replace(/-/g, '/');
                return parseTHDate(cleanStr);
            };

            const startDateObj = parseFlexDate(rawStart);
            const endDateObj = parseFlexDate(rawEnd);

            if (!startDateObj || !endDateObj) {
                console.warn(`Invalid date format for row ${i}: ${rawStart} / ${rawEnd}`);
                continue;
            }

            const reasonText = colMap.reason > -1 ? cols[colMap.reason]?.trim() : '';
            const finalReason = `[MIGRATED] ประวัติการลาย้อนหลัง: ${reasonText || 'ไม่มีระบุเหตุผล'}`;

            const rawIsHalfDay = colMap.isHalfDay > -1 ? cols[colMap.isHalfDay]?.trim().toLowerCase() : '';
            const isHalfDay = rawIsHalfDay === 'true' || rawIsHalfDay === 'yes' || rawIsHalfDay === '1' || rawIsHalfDay === 'ใช่';

            const rawSession = colMap.halfDaySession > -1 ? cols[colMap.halfDaySession]?.trim().toUpperCase() : null;
            const halfDaySession = rawSession === 'AM' || rawSession === 'PM' ? rawSession : null;

            parsedLeaves.push({
                user_id: matchedUser.id,
                type,
                start_date: formatToYYYYMMDD(startDateObj),
                end_date: formatToYYYYMMDD(endDateObj),
                reason: finalReason,
                status: 'APPROVED',
                is_half_day: isHalfDay,
                half_day_session: halfDaySession,
                created_at: new Date().toISOString()
            });
        }
        
        return parsedLeaves;
    } catch (err) {
        throw err;
    }
};

export const parseHistoricalLeaveExcel = async (
    file: File,
    users: User[]
): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert sheet to 2D array
                const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
                if (rows.length < 2) {
                    reject(new Error('ไฟล์ Excel ว่างเปล่าหรือไม่มีข้อมูล'));
                    return;
                }

                const headerRow = (rows[0] as any[]).map(h => String(h || '').trim().toLowerCase());
                
                const colMap = {
                    email: headerRow.findIndex(h => h === 'email' || h === 'อีเมล' || h === 'username' || h === 'ชื่อผู้ใช้'),
                    leaveType: headerRow.findIndex(h => h === 'leave_type' || h === 'leave type' || h === 'ประเภทการลา' || h === 'type'),
                    startDate: headerRow.findIndex(h => h === 'start_date' || h === 'start date' || h === 'วันที่เริ่มต้น' || h === 'เริ่ม'),
                    endDate: headerRow.findIndex(h => h === 'end_date' || h === 'end date' || h === 'วันที่สิ้นสุด' || h === 'สิ้นสุด'),
                    reason: headerRow.findIndex(h => h === 'reason' || h === 'เหตุผล' || h === 'เหตุผลการลา'),
                    isHalfDay: headerRow.findIndex(h => h === 'is_half_day' || h === 'is half day' || h === 'ครึ่งวัน' || h === 'ลาครึ่งวัน'),
                    halfDaySession: headerRow.findIndex(h => h === 'half_day_session' || h === 'session' || h === 'ช่วงเวลา')
                };

                if (colMap.email === -1 || colMap.leaveType === -1 || colMap.startDate === -1 || colMap.endDate === -1) {
                    reject(new Error('ไม่พบหัวคอลัมน์ที่จำเป็นใน Excel (อีเมล/ชื่อผู้ใช้, ประเภทการลา, วันที่เริ่มต้น, วันที่สิ้นสุด)'));
                    return;
                }

                const parsedLeaves: any[] = [];

                for (let i = 1; i < rows.length; i++) {
                    const cols = rows[i] as any[];
                    if (!cols || cols.length === 0) continue;

                    const rawEmail = String(cols[colMap.email] || '').trim();
                    if (!rawEmail) continue;

                    const matchedUser = users.find(u => u.email?.trim().toLowerCase() === rawEmail.toLowerCase()) ||
                                        users.find(u => u.name?.trim().toLowerCase() === rawEmail.toLowerCase()) ||
                                        users.find(u => u.username?.trim().toLowerCase() === rawEmail.toLowerCase());
                    
                    if (!matchedUser) {
                        console.warn(`Could not find user for email/name/username: ${rawEmail}`);
                        continue;
                    }

                    let rawType = String(cols[colMap.leaveType] || '').trim().toUpperCase() || 'SICK';
                    let type: string = 'SICK';
                    if (rawType.includes('ป่วย') || rawType === 'SICK') type = 'SICK';
                    else if (rawType.includes('พักร้อน') || rawType.includes('ประจำปี') || rawType === 'VACATION') type = 'VACATION';
                    else if (rawType.includes('กิจ') || rawType === 'PERSONAL') type = 'PERSONAL';
                    else if (rawType.includes('ฉุกเฉิน') || rawType === 'EMERGENCY') type = 'EMERGENCY';
                    else if (rawType.includes('สาย') || rawType === 'LATE_ENTRY') type = 'LATE_ENTRY';
                    else if (rawType.includes('ทำงานนอกสถานที่') || rawType === 'ONSITE') type = 'ONSITE';
                    else if (rawType.includes('รีโมท') || rawType === 'WFH') type = 'WFH';
                    else if (rawType.includes('ไม่รับค่าจ้าง') || rawType === 'UNPAID') type = 'UNPAID';

                    const rawStart = String(cols[colMap.startDate] || '').trim();
                    const rawEnd = String(cols[colMap.endDate] || '').trim();

                    const parseFlexDate = (dateStr: string): Date | null => {
                        if (!dateStr) return null;
                        
                        // Handle numeric date representation in Excel (serial numbers)
                        if (/^\d+(\.\d+)?$/.test(dateStr)) {
                            const serial = parseFloat(dateStr);
                            const utcDays = Math.floor(serial - 25569);
                            const date = new Date(utcDays * 86400 * 1000);
                            if (!isNaN(date.getTime())) return date;
                        }

                        const cleanStr = dateStr.trim().replace(/-/g, '/');
                        return parseTHDate(cleanStr);
                    };

                    const startDateObj = parseFlexDate(rawStart);
                    const endDateObj = parseFlexDate(rawEnd);

                    if (!startDateObj || !endDateObj) {
                        console.warn(`Invalid date format for row ${i}: ${rawStart} / ${rawEnd}`);
                        continue;
                    }

                    const reasonText = colMap.reason > -1 ? String(cols[colMap.reason] || '').trim() : '';
                    const finalReason = `[MIGRATED] ประวัติการลาย้อนหลัง: ${reasonText || 'ไม่มีระบุเหตุผล'}`;

                    const rawIsHalfDay = colMap.isHalfDay > -1 ? String(cols[colMap.isHalfDay] || '').trim().toLowerCase() : '';
                    const isHalfDay = rawIsHalfDay === 'true' || rawIsHalfDay === 'yes' || rawIsHalfDay === '1' || rawIsHalfDay === 'ใช่';

                    const rawSession = colMap.halfDaySession > -1 ? String(cols[colMap.halfDaySession] || '').trim().toUpperCase() : null;
                    const halfDaySession = rawSession === 'AM' || rawSession === 'PM' ? rawSession : null;

                    parsedLeaves.push({
                        user_id: matchedUser.id,
                        type,
                        start_date: formatToYYYYMMDD(startDateObj),
                        end_date: formatToYYYYMMDD(endDateObj),
                        reason: finalReason,
                        status: 'APPROVED',
                        is_half_day: isHalfDay,
                        half_day_session: halfDaySession,
                        created_at: new Date().toISOString()
                    });
                }

                resolve(parsedLeaves);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

export const parseHistoricalLeaveJSON = async (
    file: File,
    users: User[]
): Promise<any[]> => {
    try {
        const text = await readFileAsTextWithAutoEncoding(file);
        const items = JSON.parse(text);
        
        if (!Array.isArray(items)) {
            throw new Error('รูปแบบ JSON ไม่ถูกต้อง คาดหวังอาเรย์ของออบเจกต์ [ { ... }, { ... } ]');
        }

        const parsedLeaves: any[] = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item || typeof item !== 'object') continue;

            const emailKey = Object.keys(item).find(k => {
                const l = k.toLowerCase().replace(/_/g, '');
                return l === 'email' || l === 'อีเมล' || l === 'username' || l === 'ชื่อผู้ใช้';
            });
            const rawEmail = emailKey ? String(item[emailKey] || '').trim() : '';
            if (!rawEmail) continue;

            const matchedUser = users.find(u => u.email?.trim().toLowerCase() === rawEmail.toLowerCase()) ||
                                users.find(u => u.name?.trim().toLowerCase() === rawEmail.toLowerCase()) ||
                                users.find(u => u.username?.trim().toLowerCase() === rawEmail.toLowerCase());
            
            if (!matchedUser) {
                console.warn(`Could not find user for email/name/username: ${rawEmail}`);
                continue;
            }

            const typeKey = Object.keys(item).find(k => {
                const l = k.toLowerCase().replace(/_/g, '');
                return l === 'leavetype' || l === 'ประเภทการลา' || l === 'type';
            });
            let rawType = typeKey ? String(item[typeKey] || '').trim().toUpperCase() : 'SICK';
            let type: string = 'SICK';
            if (rawType.includes('ป่วย') || rawType === 'SICK') type = 'SICK';
            else if (rawType.includes('พักร้อน') || rawType.includes('ประจำปี') || rawType === 'VACATION') type = 'VACATION';
            else if (rawType.includes('กิจ') || rawType === 'PERSONAL') type = 'PERSONAL';
            else if (rawType.includes('ฉุกเฉิน') || rawType === 'EMERGENCY') type = 'EMERGENCY';
            else if (rawType.includes('สาย') || rawType === 'LATE_ENTRY') type = 'LATE_ENTRY';
            else if (rawType.includes('ทำงานนอกสถานที่') || rawType === 'ONSITE') type = 'ONSITE';
            else if (rawType.includes('รีโมท') || rawType === 'WFH') type = 'WFH';
            else if (rawType.includes('ไม่รับค่าจ้าง') || rawType === 'UNPAID') type = 'UNPAID';

            const startKey = Object.keys(item).find(k => {
                const l = k.toLowerCase().replace(/_/g, '');
                return l === 'startdate' || l === 'วันที่เริ่มต้น' || l === 'เริ่ม';
            });
            const endKey = Object.keys(item).find(k => {
                const l = k.toLowerCase().replace(/_/g, '');
                return l === 'enddate' || l === 'วันที่สิ้นสุด' || l === 'สิ้นสุด';
            });

            const rawStart = startKey ? String(item[startKey] || '').trim() : '';
            const rawEnd = endKey ? String(item[endKey] || '').trim() : '';

            const parseFlexDate = (dateStr: string): Date | null => {
                if (!dateStr) return null;
                const cleanStr = dateStr.trim().replace(/-/g, '/');
                return parseTHDate(cleanStr);
            };

            const startDateObj = parseFlexDate(rawStart);
            const endDateObj = parseFlexDate(rawEnd);

            if (!startDateObj || !endDateObj) {
                console.warn(`Invalid date format for JSON index ${i}: ${rawStart} / ${rawEnd}`);
                continue;
            }

            const reasonKey = Object.keys(item).find(k => {
                const l = k.toLowerCase().replace(/_/g, '');
                return l === 'reason' || l === 'เหตุผล' || l === 'เหตุผลการลา';
            });
            const reasonText = reasonKey ? String(item[reasonKey] || '').trim() : '';
            const finalReason = `[MIGRATED] ประวัติการลาย้อนหลัง: ${reasonText || 'ไม่มีระบุเหตุผล'}`;

            const halfDayKey = Object.keys(item).find(k => {
                const l = k.toLowerCase().replace(/_/g, '');
                return l === 'ishalfday' || l === 'ครึ่งวัน' || l === 'ลาครึ่งวัน';
            });
            const rawIsHalfDay = halfDayKey ? String(item[halfDayKey] || '').trim().toLowerCase() : '';
            const isHalfDay = rawIsHalfDay === 'true' || rawIsHalfDay === 'yes' || rawIsHalfDay === '1' || rawIsHalfDay === 'ใช่' || (halfDayKey && item[halfDayKey] === true);

            const sessionKey = Object.keys(item).find(k => {
                const l = k.toLowerCase().replace(/_/g, '');
                return l === 'halfdaysession' || l === 'session' || l === 'ช่วงเวลา';
            });
            const rawSession = sessionKey ? String(item[sessionKey] || '').trim().toUpperCase() : null;
            const halfDaySession = rawSession === 'AM' || rawSession === 'PM' ? rawSession : null;

            parsedLeaves.push({
                user_id: matchedUser.id,
                type,
                start_date: formatToYYYYMMDD(startDateObj),
                end_date: formatToYYYYMMDD(endDateObj),
                reason: finalReason,
                status: 'APPROVED',
                is_half_day: isHalfDay,
                half_day_session: halfDaySession,
                created_at: new Date().toISOString()
            });
        }

        return parsedLeaves;
    } catch (err) {
        throw new Error('ล้มเหลวในการอ่านไฟล์ JSON: ' + (err instanceof Error ? err.message : String(err)));
    }
};

export const parseHistoricalLeaveFile = async (
    file: File,
    users: User[]
): Promise<any[]> => {
    const name = file.name.toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        return parseHistoricalLeaveExcel(file, users);
    } else if (name.endsWith('.json')) {
        return parseHistoricalLeaveJSON(file, users);
    } else {
        return parseHistoricalLeaveCSV(file, users);
    }
};
