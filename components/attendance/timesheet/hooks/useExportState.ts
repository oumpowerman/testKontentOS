import { useState } from 'react';
import { ExportConfigOptions } from '../utils/csvGenerator';

export function useExportState() {
    const [cellFormat, setCellFormat] = useState<'detailed' | 'summary'>('detailed');
    const [showWorkedDays, setShowWorkedDays] = useState(true);
    const [showLateDays, setShowLateDays] = useState(true);
    const [showLeaveDays, setShowLeaveDays] = useState(true);
    const [showEmail, setShowEmail] = useState(false);
    const [holidayFormat, setHolidayFormat] = useState<'text' | 'blank'>('text');
    const [activeTab, setActiveTab] = useState<'settings' | 'preview'>('settings');

    const configOptions: ExportConfigOptions = {
        cellFormat,
        showWorkedDays,
        showLateDays,
        showLeaveDays,
        showEmail,
        holidayFormat
    };

    return {
        cellFormat,
        setCellFormat,
        showWorkedDays,
        setShowWorkedDays,
        showLateDays,
        setShowLateDays,
        showLeaveDays,
        setShowLeaveDays,
        showEmail,
        setShowEmail,
        holidayFormat,
        setHolidayFormat,
        activeTab,
        setActiveTab,
        configOptions
    };
}
