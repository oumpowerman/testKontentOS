
import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { ColumnKey, AVAILABLE_COLUMNS } from './StockTableSettings';

interface StockTableHeaderProps {
    columnOrder: ColumnKey[];
    visibleColumns: ColumnKey[];
    columnWidths: Record<string, number>;
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
    onSort: (key: any) => void;
    onResize: (key: string, width: number) => void;
    onReorder: (startIndex: number, endIndex: number) => void;
}

const StockTableHeader: React.FC<StockTableHeaderProps> = ({
    columnOrder,
    visibleColumns,
    columnWidths,
    sortConfig,
    onSort,
    onResize,
    onReorder
}) => {
    const [resizing, setResizing] = useState<string | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const startX = useRef(0);
    const startWidth = useRef(0);

    const handleMouseDown = (e: React.MouseEvent, key: string) => {
        e.preventDefault();
        e.stopPropagation();
        setResizing(key);
        startX.current = e.pageX;
        startWidth.current = columnWidths[key] || 150;
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizing) return;
            const diff = e.pageX - startX.current;
            const newWidth = Math.max(80, startWidth.current + diff);
            onResize(resizing, newWidth);
        };

        const handleMouseUp = () => {
            setResizing(null);
        };

        if (resizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizing, onResize]);

    const renderSortIcon = (key: string) => {
        if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
        return sortConfig.direction === 'asc' 
            ? <ArrowUp className="w-3 h-3 ml-1 text-indigo-600" />
            : <ArrowDown className="w-3 h-3 ml-1 text-indigo-600" />;
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('columnIndex', index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        const startIndex = parseInt(e.dataTransfer.getData('columnIndex'));
        setDragOverIndex(null);
        if (startIndex !== dropIndex) {
            onReorder(startIndex, dropIndex);
        }
    };

    return (
        <thead>
            <tr className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-200 text-[14px] font-kanit font-black text-black-400 uppercase tracking-widest">
                {/* Fixed Title Column */}
                <th 
                    className="px-6 py-4 sticky left-0 z-30 bg-gray-50/95 cursor-pointer hover:bg-gray-100 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-gray-100"
                    style={{ width: columnWidths['title'] || 350 }}
                    onClick={() => onSort('title')}
                >
                    <div className="flex items-center justify-center relative group">
                        หัวข้อคอนเทนต์ (ชื่อเรื่อง) 🎬 {renderSortIcon('title')}
                        <div 
                            className="absolute right-[-6px] top-0 bottom-0 w-3 cursor-col-resize hover:bg-indigo-400/30 transition-colors z-40"
                            onMouseDown={(e) => handleMouseDown(e, 'title')}
                        />
                    </div>
                </th>

                        {/* Dynamic Columns */}
                {columnOrder.map((key, index) => {
                    if (!visibleColumns.includes(key)) return null;
                    const col = AVAILABLE_COLUMNS.find(c => c.key === key);
                    if (!col) return null;

                    return (
                        <th 
                            key={key}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragLeave={() => setDragOverIndex(null)}
                            className={`px-4 py-4 text-center cursor-pointer hover:bg-gray-100 transition-all relative group hidden md:table-cell ${dragOverIndex === index ? 'bg-indigo-50 border-x-2 border-indigo-200' : ''}`}
                            style={{ width: columnWidths[key] || 150 }}
                            onClick={() => onSort(key)}
                        >
                            <div className="flex items-center justify-center gap-1">
                                <GripVertical className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                                {col.label} {renderSortIcon(key)}
                            </div>
                            
                            {/* Resize Handle */}
                            <div 
                                className="absolute right-[-2px] top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-400/50 transition-colors z-40"
                                onMouseDown={(e) => handleMouseDown(e, key)}
                            />
                        </th>
                    );
                })}

                {/* Fixed Action Column */}
                <th className="px-4 py-4 text-center sticky right-0 z-30 bg-gray-50/95 w-[80px] border-l border-gray-100 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] hidden lg:table-cell">
                    จัดการ (ปุ่มกด) ⚙️
                </th>
            </tr>
        </thead>
    );
};

export default StockTableHeader;
