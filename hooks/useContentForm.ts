import React, { useState, useEffect } from 'react';
import { format, isValid } from 'date-fns';
import { Task, Status, Priority, ContentPillar, ContentFormat, Platform, TaskAsset, Channel, MasterOption, TaskPerformance, Difficulty, AssigneeType, Script, User } from '../types';

interface UseContentFormProps {
    initialData?: Task | null;
    selectedDate?: Date | null;
    sourceScript?: Script | null; // NEW: Source script for promote flow
    channels: Channel[];
    masterOptions: MasterOption[];
    currentUser?: User;
    onSave: (task: Task) => void;
}

export const useContentForm = ({ initialData, selectedDate, sourceScript, channels, masterOptions, onSave, currentUser }: UseContentFormProps) => {
    // --- State ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [remark, setRemark] = useState('');
    
    // Dates & Status
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isStock, setIsStock] = useState(false);
    const [scheduledTime, setScheduledTime] = useState(''); 
    const [status, setStatus] = useState<string>(''); 
    const [tags, setTags] = useState<string[]>([]);
    
    // Content Specifics
    const [channelId, setChannelId] = useState<string>('');
    const [targetPlatforms, setTargetPlatforms] = useState<Platform[]>(['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM']);
    const [pillar, setPillar] = useState<string>('');
    const [contentFormats, setContentFormats] = useState<string[]>([]); // New Multi
    const [category, setCategory] = useState('');
    const [publishedLinks, setPublishedLinks] = useState<Record<string, string>>({}); 

    // Production Info
    const [shootDate, setShootDate] = useState('');
    const [shootLocation, setShootLocation] = useState('');
    const [localPath, setLocalPath] = useState('');
    const [driveLabel, setDriveLabel] = useState('');

    // People
    const [ideaOwnerIds, setIdeaOwnerIds] = useState<string[]>([]);
    const [editorIds, setEditorIds] = useState<string[]>([]);
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]); // Support/Sub
    
    // Other
    const [assets, setAssets] = useState<TaskAsset[]>([]);
        
    // Script Integration
    const [scriptId, setScriptId] = useState<string | undefined>(undefined);
    
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false); // NEW: Track saving state

    // --- Options from Master Data ---
    const formatOptions = masterOptions.filter(o => o.type === 'FORMAT' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const pillarOptions = masterOptions.filter(o => o.type === 'PILLAR' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const categoryOptions = masterOptions.filter(o => o.type === 'CATEGORY' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const statusOptions = masterOptions.filter(o => o.type === 'STATUS' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);

    // --- Initialization ---
    useEffect(() => {
        if (initialData && initialData.type === 'CONTENT') {
            setTitle(initialData.title);
            setDescription(initialData.description);
            setRemark(initialData.remark || '');
            setStartDate(initialData.startDate ? format(initialData.startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
            setEndDate(initialData.endDate ? format(initialData.endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
            setIsStock(!!initialData.isUnscheduled);
            setScheduledTime(initialData.scheduledTime || '');
            setStatus(initialData.status);
            setTags(initialData.tags || []);
            
            setChannelId(initialData.channelId || '');
            // Ensure array consistency for platforms
            setTargetPlatforms(Array.isArray(initialData.targetPlatforms) ? initialData.targetPlatforms : []);
            setPillar(initialData.pillar || '');
            
            // Handle Legacy vs Multi
            if (initialData.contentFormats && Array.isArray(initialData.contentFormats)) {
                setContentFormats(initialData.contentFormats as string[]);
            } else {
                setContentFormats([]);
            }
            
            setCategory(initialData.category || '');
            setPublishedLinks(initialData.publishedLinks || {});

            // Production Info Safety Check
            setShootDate(initialData.shootDate && isValid(new Date(initialData.shootDate)) ? format(initialData.shootDate, 'yyyy-MM-dd') : '');
            setShootLocation(initialData.shootLocation || '');
            setLocalPath(initialData.localPath || '');
            setDriveLabel(initialData.driveLabel || '');

            setIdeaOwnerIds(initialData.ideaOwnerIds || []);
            setEditorIds(initialData.editorIds || []);
            setAssigneeIds(initialData.assigneeIds || []);
            
            setAssets(initialData.assets || []);
            setScriptId(initialData.scriptId); // Link script
        } else {
            // Defaults for New Content
            setTitle(sourceScript?.title || '');
            setDescription(sourceScript ? `Script Link: ${sourceScript.title}` : '');
            setRemark('');
            const defaultDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
            setStartDate(defaultDate);
            setEndDate(defaultDate);
            setIsStock(false);
            setScheduledTime('');
            
            // DYNAMIC DEFAULT STATUS: Take the first one from sorted list
            const defaultStatus = statusOptions.find(o => o.isDefault)?.key || (statusOptions.length > 0 ? statusOptions[0].key : 'TODO');
            setStatus(defaultStatus);
        
            setTags(sourceScript?.tags || []);
            
            if (sourceScript?.channelId) setChannelId(sourceScript.channelId);
            else if (channels.length > 0) setChannelId(channels[0].id);
            else setChannelId('');

            setTargetPlatforms(['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM']);
            setPillar(pillarOptions.find(o => o.isDefault)?.key || '');
            
            const defaultFormat = formatOptions.find(o => o.isDefault)?.key || '';
            setContentFormats(defaultFormat ? [defaultFormat] : []);
            
            const defaultCat = sourceScript?.category || categoryOptions.find(o => o.isDefault)?.key || '';
            setCategory(defaultCat);

            setShootDate('');
            setShootLocation('');
            setLocalPath('');
            setDriveLabel('');
            
            const initialIdeaOwners = sourceScript?.ideaOwnerId ? [sourceScript.ideaOwnerId] : (currentUser ? [currentUser.id] : []);
            setIdeaOwnerIds(initialIdeaOwners);
            setEditorIds([]);
            setAssigneeIds([]);
            setAssets([]);
            setPublishedLinks({});
            setScriptId(sourceScript?.id); // Linkage
        }
        setError('');
        setIsSaving(false);
    }, [initialData, selectedDate, sourceScript, channels, masterOptions]); 

    // --- Handlers ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim()) {
            setError('อย่าลืมตั้งชื่อคอนเทนต์นะ!');
            return;
        }
        if (!channelId) {
            setError('กรุณาเลือกช่องทาง (Channel) ด้วยครับ');
            return;
        }
        if (!isStock && new Date(startDate) > new Date(endDate)) {
            setError('วันเริ่มต้องมาก่อนวันจบสิครับผม');
            return;
        }

        setIsSaving(true); // Start loading

        try {
            // 1. Date Conversion (Fix Timezone issues by using explicit construction)
            const [sy, sm, sd] = startDate.split('-').map(Number);
            const startObj = new Date(sy, sm - 1, sd);
            
            const [ey, em, ed] = endDate.split('-').map(Number);
            const endObj = new Date(ey, em - 1, ed);

            // 2. Production Date Conversion (Must be precise for Trip Grouping)
            let finalShootDate = undefined;
            if (shootDate) {
                const [shy, shm, shd] = shootDate.split('-').map(Number);
                finalShootDate = new Date(shy, shm - 1, shd);
            }

            const newTask: Task = {
                id: initialData ? initialData.id : crypto.randomUUID(),
                type: 'CONTENT',
                title,
                description,
                remark,
                status: status as Status,
                tags,
                
                // Dates
                startDate: startObj,
                endDate: endObj,
                isUnscheduled: isStock,
                scheduledTime: scheduledTime || undefined,

                // Content Fields (Crucial for Weekly Quests)
                channelId,
                targetPlatforms: targetPlatforms, // Array format is key for Quest Matching
                pillar: pillar as ContentPillar,
                contentFormats: contentFormats, // New Multi
                category,
                publishedLinks,

                // Production Info (Crucial for Trip Manager)
                shootDate: finalShootDate,
                shootLocation: shootLocation.trim() || undefined,
                localPath: localPath.trim() || undefined,
                driveLabel: driveLabel || undefined,

                // People
                ideaOwnerIds,
                editorIds,
                assigneeIds, // Support

                // Assets & Script
                assets,   
                scriptId, // Linkage
            };

            await onSave(newTask as Task); // Wait for save (usually async in parent wrapper)
        } catch (err) {
            console.error(err);
            setError('Save failed');
        } finally {
            setIsSaving(false); // Stop loading
        }
    };

    const togglePlatform = (p: Platform) => {
        setTargetPlatforms(prev => prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]);
    };

    const handleLinkChange = (platform: string, url: string) => {
        setPublishedLinks(prev => ({ ...prev, [platform]: url }));
    };

    const toggleUserSelection = (userId: string, currentList: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const addAsset = (newAsset: TaskAsset) => setAssets(prev => [...prev, newAsset]);
    const removeAsset = (id: string) => setAssets(prev => prev.filter(a => a.id !== id));

    return {
        // State
        title, setTitle,
        description, setDescription,
        remark, setRemark,
        startDate, setStartDate,
        endDate, setEndDate,
        isStock, setIsStock,
        scheduledTime, setScheduledTime,
        status, setStatus,
        
        channelId, setChannelId,
        targetPlatforms, 
        pillar, setPillar,
        contentFormats, setContentFormats,
        category, setCategory,
        publishedLinks, handleLinkChange,

        shootDate, setShootDate,
        shootLocation, setShootLocation,
        localPath, setLocalPath,
        driveLabel, setDriveLabel,

        ideaOwnerIds, setIdeaOwnerIds,
        editorIds, setEditorIds,
        assigneeIds, setAssigneeIds,
        assets, 
        scriptId, setScriptId,

        error,
        isSaving, // EXPORTED
        
        // Options
        formatOptions,
        pillarOptions,
        categoryOptions,
        statusOptions,

        // Actions
        handleSubmit,
        togglePlatform,
        toggleUserSelection,
        addAsset,
        removeAsset
    };
};