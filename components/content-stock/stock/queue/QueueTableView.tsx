import React from 'react';
import { AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { MergedQueueItem } from './types';
import QueueItemRow from './QueueItemRow';
import { Channel, Task, MasterOption } from '../../../../types';

interface QueueTableViewProps {
    items: MergedQueueItem[];
    channels: Channel[];
    masterOptions: MasterOption[];
    isProcessing: string | null;
    onEditContent: (task: Task) => void;
    onEditScript?: (scriptId: string) => void;
    onToggleFinished: (item: MergedQueueItem) => void;
    onMarkAsDone: (item: MergedQueueItem) => void;
    onReorder: (newItems: MergedQueueItem[]) => void;
    onRemove: (item: MergedQueueItem) => void;
    onOpenPlanning: (item: MergedQueueItem) => void;
}

interface ReorderableItemProps {
    item: MergedQueueItem;
    index: number;
    channels: Channel[];
    masterOptions: MasterOption[];
    isProcessing: string | null;
    onEditContent: (task: Task) => void;
    onEditScript?: (scriptId: string) => void;
    onToggleFinished: (item: MergedQueueItem) => void;
    onMarkAsDone: (item: MergedQueueItem) => void;
    onRemove: (item: MergedQueueItem) => void;
    onOpenPlanning: (item: MergedQueueItem) => void;
}

const ReorderableItem = React.forwardRef<any, ReorderableItemProps>(({ 
    item, 
    index, 
    channels, 
    masterOptions, 
    isProcessing, 
    onEditContent, 
    onEditScript, 
    onToggleFinished, 
    onMarkAsDone, 
    onRemove, 
    onOpenPlanning 
}, ref) => {
    const controls = useDragControls();

    return (
        <Reorder.Item
            ref={ref}
            value={item}
            dragListener={false}
            dragControls={controls}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            whileDrag={{ 
                scale: 1.02, 
                boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                backgroundColor: "rgb(249 250 251)"
            }}
        >
            <QueueItemRow
                item={item}
                sequenceNumber={index + 1}
                channel={channels.find(c => c.id === item.channelId)}
                masterOptions={masterOptions}
                isFinished={item.isSoftFinished}
                isProcessing={isProcessing === item.id}
                onEditContent={onEditContent}
                onEditScript={onEditScript}
                onToggleFinished={onToggleFinished}
                onMarkAsDone={onMarkAsDone}
                onRemove={onRemove}
                onOpenPlanning={onOpenPlanning}
                dragControls={controls}
            />
        </Reorder.Item>
    );
});

ReorderableItem.displayName = 'ReorderableItem';

const QueueTableView: React.FC<QueueTableViewProps> = ({
    items,
    channels,
    masterOptions,
    isProcessing,
    onEditContent,
    onEditScript,
    onToggleFinished,
    onMarkAsDone,
    onReorder,
    onRemove,
    onOpenPlanning
}) => {
    return (
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/80 overflow-hidden shadow-sm">
            {/* Unified Grid Header */}
            <div className="hidden md:grid grid-cols-[60px_45px_45px_1fr_160px_120px_100px] items-center gap-4 px-6 py-4 bg-slate-900 border-b border-white/10 text-[12px] font-kanit font-bold text-slate-400 uppercase tracking-widest">
                <div className="flex justify-center">ลำดับ</div>
                <div className="flex justify-center">สถานะ</div>
                <div className="flex justify-center">ประเภท</div>
                <div className="pl-2">รายการที่ต้องถ่ายทำ</div>
                <div className="pl-4">สถานที่ถ่ายทำ</div>
                <div className="pl-4">เวลาที่ระบุ</div>
                <div className="text-center">จัดการ</div>
            </div>
            
            <Reorder.Group 
                axis="y" 
                values={items} 
                onReorder={onReorder}
                className="divide-y divide-gray-50 contents"
            >
                <AnimatePresence mode='popLayout'>
                    {items.map((item, index) => (
                        <ReorderableItem 
                            key={item.id}
                            item={item}
                            index={index}
                            channels={channels}
                            masterOptions={masterOptions}
                            isProcessing={isProcessing}
                            onEditContent={onEditContent}
                            onEditScript={onEditScript}
                            onToggleFinished={onToggleFinished}
                            onMarkAsDone={onMarkAsDone}
                            onRemove={onRemove}
                            onOpenPlanning={onOpenPlanning}
                        />
                    ))}
                </AnimatePresence>
            </Reorder.Group>
        </div>
    );
};

export default QueueTableView;
