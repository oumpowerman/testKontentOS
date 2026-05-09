
import React, { useRef, useState, useMemo, useCallback } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { getStroke } from 'perfect-freehand';
import { Trash2, Undo2, Palette, Eraser, MousePointer2 } from 'lucide-react';

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

interface Stroke {
  points: number[][];
  color: string;
  size: number;
}

const DrawingComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, selected }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentStroke, setCurrentStroke] = useState<number[][] | null>(null);
  const [brushColor, setBrushColor] = useState('#4f46e5');
  const [brushRadius, setBrushRadius] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  // Parse strokes from node attributes
  const strokes: Stroke[] = useMemo(() => {
    try {
      return JSON.parse(node.attrs.lines || '[]');
    } catch (e) {
      return [];
    }
  }, [node.attrs.lines]);

  const getSvgPathFromStroke = (strokePoints: number[][], size: number) => {
    const outlinePoints = getStroke(strokePoints, {
      size: size,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
    });

    if (!outlinePoints.length) return '';

    const d = outlinePoints.reduce(
      (acc, [x, y], i) => {
        if (i === 0) acc.push(`M ${x} ${y}`);
        else acc.push(`L ${x} ${y}`);
        return acc;
      },
      [] as string[]
    );

    d.push('Z');
    return d.join(' ');
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentStroke([[x, y, e.pressure || 0.5]]);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!currentStroke) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentStroke([...currentStroke, [x, y, e.pressure || 0.5]]);
  };

  const handlePointerUp = () => {
    if (!currentStroke) return;

    const newStroke: Stroke = {
      points: currentStroke,
      color: isEraser ? '#ffffff' : brushColor,
      size: brushRadius,
    };

    const newStrokes = [...strokes, newStroke];
    updateAttributes({ lines: JSON.stringify(newStrokes) });
    setCurrentStroke(null);
  };

  const undo = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (strokes.length === 0) return;
    const newStrokes = strokes.slice(0, -1);
    updateAttributes({ lines: JSON.stringify(newStrokes) });
  }, [strokes, updateAttributes]);

  const clear = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    updateAttributes({ lines: '[]' });
  }, [updateAttributes]);

  return (
    <NodeViewWrapper className={`drawing-node my-4 relative group ${selected ? 'ring-2 ring-indigo-500 rounded-xl' : ''}`}>
      <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 bg-white border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsEraser(false)}
              className={`p-1.5 rounded-lg transition-all ${!isEraser ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
              title="Pen"
            >
              <Palette className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsEraser(true)}
              className={`p-1.5 rounded-lg transition-all ${isEraser ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <input 
              type="color" 
              value={brushColor} 
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-6 h-6 rounded-full overflow-hidden cursor-pointer border-0 p-0"
              disabled={isEraser}
            />
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={brushRadius} 
              onChange={(e) => setBrushRadius(parseInt(e.target.value))}
              className="w-20 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => undo(e)} 
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all" 
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => clear(e)} 
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-all" 
              title="Clear"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="bg-white relative touch-none" style={{ height: '300px' }}>
          <svg
            ref={svgRef}
            className="w-full h-full cursor-crosshair block"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* Render existing strokes */}
            {strokes.map((stroke, i) => (
              <path
                key={i}
                d={getSvgPathFromStroke(stroke.points, stroke.size)}
                fill={stroke.color}
              />
            ))}
            
            {/* Render current stroke */}
            {currentStroke && (
              <path
                d={getSvgPathFromStroke(currentStroke, brushRadius)}
                fill={isEraser ? '#ffffff' : brushColor}
              />
            )}
          </svg>
        </div>
        
        {/* Footer Info */}
        <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 flex justify-between items-center">
          <span>SMOOTH DRAWING CANVAS (PERFECT FREEHAND)</span>
          <span className="flex items-center gap-1"><MousePointer2 className="w-3 h-3" /> Interactive Node</span>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default DrawingComponent;
