
import { Status, Priority } from '../types';

// Updated Colors for 10-step workflow
export const STATUS_COLORS: Record<Status, string> = {
  'IDEA': 'bg-gray-100 text-gray-600 border-gray-200',
  'SCRIPT': 'bg-yellow-50 text-yellow-600 border-yellow-200',
  'SHOOTING': 'bg-orange-50 text-orange-600 border-orange-200',
  'EDIT_CLIP': 'bg-blue-50 text-blue-600 border-blue-200',
  'FEEDBACK': 'bg-pink-50 text-pink-600 border-pink-200',
  'EDIT_DRAFT_1': 'bg-indigo-50 text-indigo-600 border-indigo-200',
  'FEEDBACK_1': 'bg-purple-50 text-purple-600 border-purple-200',
  'EDIT_DRAFT_2': 'bg-cyan-50 text-cyan-600 border-cyan-200',
  'APPROVE': 'bg-emerald-50 text-emerald-600 border-emerald-200',
  'DONE': 'bg-green-100 text-green-700 border-green-300 ring-1 ring-green-300',
};

// Updated Labels for 10-step workflow
export const STATUS_LABELS: Record<Status, string> = {
  'IDEA': 'Idea/Draft 💡',
  'SCRIPT': 'Script ✍️',
  'SHOOTING': 'Shooting 🎥',
  'EDIT_CLIP': 'Edit Clip ✂️',
  'FEEDBACK': 'Feedback 💬',
  'EDIT_DRAFT_1': 'Edit Draft1 🛠️',
  'FEEDBACK_1': 'Feedback 1 🗣️',
  'EDIT_DRAFT_2': 'Edit Draft 2 🔧',
  'APPROVE': 'Approve 👍',
  'DONE': 'Done ✅',
  'WAITING': 'Waiting ⏳',
  'REVISE': 'Revise 🛠️',
  'TODO': 'To Do 📝',
  'DOING': 'Doing ⚡',
  'BLOCKED': 'Blocked 🚫',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  'LOW': 'text-slate-400',
  'MEDIUM': 'text-blue-500',
  'HIGH': 'text-orange-500',
  'URGENT': 'text-red-500 font-bold',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  'LOW': 'จุ๊ยๆ ชิวๆ 🍹',
  'MEDIUM': 'งานทั่วไป 🙂',
  'HIGH': 'เริ่มเดือด ⚡️',
  'URGENT': 'ไฟลุกท่วม 🔥',
};

// --- HELPERS: Intelligent Status Check (The Brains 🧠) ---

export const isStockTerminalStatus = (status: string | undefined | null): boolean => {
    if (!status) return false;
    const s = status.trim().toUpperCase();
    
    // Terminal keywords signifying complete/posted/published
    const isDone = s.includes('DONE');
    const isPublish = s.includes('PUBLISH');
    const isPosted = s.includes('POSTED');
    const isComplete = s.includes('COMPLETE');
    const isSuccess = s.includes('SUCCESS');
    
    // Active keywords that signify work-in-progress or review
    const isFinal = s.includes('FINAL');
    const isApprove = s.includes('APPROVE');
    // "POST" means "Post-Production" (editing) - active, UNLESS it is "POSTED" (uploaded)
    const isPostProduction = s.includes('POST') && !s.includes('POSTED');
    
    const hasMatch = isDone || isPublish || isPosted || isComplete || isSuccess;
    const hasExcluded = isFinal || isApprove || isPostProduction;
    
    return hasMatch && !hasExcluded;
};

export const isTaskCompleted = (status: string): boolean => {
    if (!status) return false;
    const s = status.trim().toUpperCase();
    
    if (s === 'DONE' || s === 'APPROVE' || s === 'PASSED') return true;
    
    const COMPLETION_KEYWORDS = [
        'COMPLETE', 'SUCCESS', 'PUBLISH', 'POSTED', 
        'FINISH', 'CLOSED', 'ARCHIVE', 'FINAL', 'DONE',
        'APPROVED', 'VERIFIED', 'ACCEPTED', 'PASS'
    ];
    
    return COMPLETION_KEYWORDS.some(k => s.includes(k));
};

export const isTaskTodo = (status: string): boolean => {
    if (!status) return false;
    const s = status.toUpperCase();
    
    // Core Initial Statuses
    if (s === 'TODO' || s === 'IDEA' || s === 'SCRIPT') return true;
    
    const TODO_KEYWORDS = [
        'TODO', 'IDEA', 'SCRIPT', 'BACKLOG', 'PLAN', 'START', 'READY'
    ];
    
    return TODO_KEYWORDS.some(k => s.includes(k));
};
