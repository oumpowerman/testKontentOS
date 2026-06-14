import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { MergedQueueItem } from './types';
import QueueItemCard from './QueueItemCard';
import { Channel, Task, MasterOption } from '../../../../types';

interface QueueGridViewProps {
    items: MergedQueueItem[];
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

const QueueGridView: React.FC<QueueGridViewProps> = ({
    items,
    channels,
    masterOptions,
    isProcessing,
    onEditContent,
    onEditScript,
    onToggleFinished,
    onMarkAsDone,
    onRemove,
    onOpenPlanning
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode='popLayout'>
                {items.map((item, index) => (
                    <QueueItemCard
                        key={item.id}
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
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default QueueGridView;
