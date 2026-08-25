
import { InternCandidate, InternStatus, Gender } from '../types';

/**
 * Service for mapping Google Sheet data to InternCandidate database structure
 */
export const internMappingService = {
    /**
     * Map Thai Gender string to Gender enum
     */
    mapGender: (gen: string): Gender => {
        const g = gen.trim().toLowerCase();
        if (g === 'boy') return 'MALE';
        if (g === 'girl') return 'FEMALE';
        return 'OTHER';
    },

    /**
     * Map Thai Status string to InternStatus enum
     */
    mapStatus: (status: string): InternStatus => {
        const s = status.trim();
        const mapping: Record<string, InternStatus> = {
            'ยังไม่ได้นัดสัมภาษณ์': 'APPLIED',
            'โทรสอบถาม': 'APPLIED',
            'รอสัมภาษณ์': 'INTERVIEW_SCHEDULED',
            'สัมภาษณ์แล้วรอประกาศผล': 'INTERVIEWED',
            'ผ่าน': 'ACCEPTED',
            'ได้ที่ฝึกแล้ว': 'REJECTED', // Got internship elsewhere
            'ไม่ผ่าน': 'REJECTED',      // We rejected them
            'ไม่สนใจ': 'REJECTED'       // They withdrew
        };
        return mapping[s] || 'APPLIED';
    },

    /**
     * Parse Thai month name to month index (0-11)
     */
    parseThaiMonth: (monthName: string): number => {
        const months = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        const index = months.indexOf(monthName.trim());
        return index !== -1 ? index : 0;
    },

    /**
     * Construct a Date object from day number and Thai month name
     */
    constructDate: (day: number | string, monthName: string, year: number = new Date().getFullYear()): Date => {
        const d = typeof day === 'string' ? parseInt(day) : day;
        const m = internMappingService.parseThaiMonth(monthName);
        return new Date(year, m, d);
    },

    /**
     * Parse internship period string like "23/03 - 05/06" or "23/03 ถึง 05/06"
     */
    parsePeriod: (period: string, baseYear: number = new Date().getFullYear()): { startDate: Date, endDate: Date } => {
        try {
            // Support various separators: -, –, —, ถึง
            const separators = /[-–—]|ถึง/;
            const parts = period.split(separators).map(p => p.trim());
            
            if (parts.length !== 2) throw new Error('Invalid period format');

            const parseDatePart = (part: string, year: number) => {
                // Support DD/MM or DD/MM/YYYY
                const segments = part.split('/').map(n => parseInt(n));
                const day = segments[0];
                const month = segments[1];
                const y = segments[2] || year;
                
                // Handle Buddhist Era (BE) if year > 2400
                const finalYear = y > 2400 ? y - 543 : y;
                
                return new Date(finalYear, month - 1, day);
            };

            let startDate = parseDatePart(parts[0], baseYear);
            let endDate = parseDatePart(parts[1], baseYear);

            // Handle year rollover (e.g., 20/12 - 10/01)
            // If end date is before start date, it's likely the next year
            if (endDate < startDate && parts[1].split('/').length < 3) {
                endDate.setFullYear(startDate.getFullYear() + 1);
            }

            return { startDate, endDate };
        } catch (e) {
            console.error('Error parsing period:', period, e);
            const now = new Date();
            return { startDate: now, endDate: now };
        }
    },

    /**
     * Normalize a string for robust comparison:
     * - Lowercase
     * - Remove all whitespace
     * - Remove special characters (brackets, colons, etc.)
     * - Remove Thai tone marks and problematic vowels for better matching
     */
    normalizeKey: (key: string): string => {
        if (!key) return '';
        return key
            .toLowerCase()
            .replace(/\s+/g, '') // Remove all whitespace
            .replace(/[()\[\]{}<>\/\\|!@#$%^&*+\-=_:;,.?]/g, '') // Remove special chars
            // Remove Thai tone marks and some vowels that often cause encoding issues/mismatches
            // \u0E31 (Mai Han-Akat), \u0E34-\u0E3A (Vowels), \u0E47-\u0E4E (Tone marks/Nikhahit)
            .replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, '');
    },

    /**
     * Find a value in a row object by multiple possible partial key matches
     */
    findValueByKeywords: (row: any, keywords: string[]): any => {
        const keys = Object.keys(row);
        const normalizedKeywords = keywords.map(k => internMappingService.normalizeKey(k));
        
        for (const keyword of normalizedKeywords) {
            if (!keyword) continue;
            const targetKey = keys.find(k => {
                const normK = internMappingService.normalizeKey(k);
                return normK.includes(keyword);
            });
            if (targetKey && row[targetKey] !== undefined && row[targetKey] !== null) {
                return row[targetKey];
            }
        }
        return undefined;
    },

    /**
     * Main mapping function to convert a raw row object to InternCandidate partial
     */
    mapRowToIntern: (row: any, baseYear: number = new Date().getFullYear()): Partial<InternCandidate> => {
        // Define robust keyword mappings
        const k = {
            name: ['Name', 'ชื่อ', 'Fullname', 'ชื่อ-นามสกุล'],
            nickname: ['Nickname', 'ชื่อเล่น'],
            email: ['Mail', 'Email', 'อีเมล', 'E-mail'],
            phone: ['Tel', 'Phone', 'เบอร์', 'โทร'],
            university: ['University', 'มหาลัย', 'มหาวิทยาลัย'],
            faculty: ['Faculty', 'คณะ'],
            year: ['ปี', 'Year', 'ชั้นปี'],
            position: ['ตำแหน่ง', 'Position', 'Job', 'Role'],
            status: ['สถานะ', 'Status'],
            period: ['ระยะฝึกงาน (ช่วง)', 'Period', 'Duration', 'Range', 'ช่วงเวลา'],
            source: ['มาจาก', 'Source', 'Chanal', 'Channel', 'ช่องทาง'],
            portfolio: ['Portfolio', 'พอร์ต'],
            notes: ['หมายเหตุ', 'Note', 'Remark'],
            duration: ['ระยะฝึกงาน (วัน)', 'Duration Days', 'Days']
        };

        const periodValue = (internMappingService.findValueByKeywords(row, k.period) || '').toString();
        const { startDate, endDate } = internMappingService.parsePeriod(periodValue, baseYear);
        
        const rawPosition = (internMappingService.findValueByKeywords(row, k.position) || '').toString().trim();
        const normalizedPosition = rawPosition.toUpperCase();

        return {
            fullName: (internMappingService.findValueByKeywords(row, k.name) || '').toString().trim(),
            nickname: (internMappingService.findValueByKeywords(row, k.nickname) || '').toString().trim(),
            email: (internMappingService.findValueByKeywords(row, k.email) || '').toString().trim(),
            phoneNumber: (internMappingService.findValueByKeywords(row, k.phone) || '').toString().trim(),
            university: (internMappingService.findValueByKeywords(row, k.university) || '').toString().trim(),
            faculty: (internMappingService.findValueByKeywords(row, k.faculty) || '').toString().trim(),
            academicYear: (internMappingService.findValueByKeywords(row, k.year) || '').toString().trim(),
            portfolioUrl: (internMappingService.findValueByKeywords(row, k.portfolio) || '').toString().trim(),
            gender: internMappingService.mapGender((internMappingService.findValueByKeywords(row, ['Gen', 'Gender', 'เพศ']) || '').toString()),
            position: normalizedPosition,
            source: (internMappingService.findValueByKeywords(row, k.source) || '').toString().trim(),
            startDate,
            endDate,
            applicationDate: internMappingService.constructDate(
                internMappingService.findValueByKeywords(row, ['Date', 'วันที่']) || 1, 
                internMappingService.findValueByKeywords(row, ['Month', 'เดือน']) || 'มกราคม', 
                baseYear
            ),
            status: internMappingService.mapStatus((internMappingService.findValueByKeywords(row, k.status) || '').toString()),
            notes: (internMappingService.findValueByKeywords(row, k.notes) || '').toString().trim(),
            durationDays: parseInt((internMappingService.findValueByKeywords(row, k.duration) || '0').toString())
        };
    }
};
