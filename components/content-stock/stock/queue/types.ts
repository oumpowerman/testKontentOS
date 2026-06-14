import { Task, ScriptSummary } from '../../../../types';

export interface MergedQueueItem {
    id: string;
    type: 'CONTENT' | 'SCRIPT';
    title: string;
    status: string;
    isSoftFinished: boolean;
    shootLocation?: string;
    shootTimeStart?: string;
    shootTimeEnd?: string;
    shootNotes?: string;
    channelId?: string;
    contentId?: string; // For scripts
    scriptId?: string;  // For contents that have a linked script
    sort_order: number;
    item: Task | ScriptSummary;
}

export type QueueViewMode = 'GRID' | 'TABLE';
