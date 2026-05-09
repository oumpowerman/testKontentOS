import React, { useMemo, useState, useEffect } from 'react';
import { MessageCircle, X, ArrowRightLeft } from 'lucide-react';

interface ChatPreviewProps {
    content: string;
    isOpen: boolean;
    onClose: () => void;
    characters: string[]; 
}

const ChatPreview: React.FC<ChatPreviewProps> = ({ content, isOpen, onClose, characters }) => {
    const [activeRightChar, setActiveRightChar] = useState<string | null>(null);

    const chatBubbles = useMemo(() => {
        const cleanContent = content
            .replace(/<\/p>/gi, '\n') 
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '') 
            .replace(/&nbsp;/g, ' '); 

        const lines = cleanContent.split('\n');
        
        const bubbles: { speaker: string, text: string, lineIndex: number }[] = [];
        let currentSpeaker = '';
        let currentText = '';
        let currentLineIndex = 0;

        const pushCurrentBubble = () => {
            if (currentSpeaker && currentText) {
                bubbles.push({ speaker: currentSpeaker, text: currentText.trim(), lineIndex: currentLineIndex });
                currentSpeaker = '';
                currentText = '';
            }
        };

        lines.forEach((line, idx) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            // Logic 1: Narrator/Stage Direction check (Starts with [)
            if (/^\[/.test(trimmedLine)) {
                pushCurrentBubble();
                // Strip [ and ] for display
                const displayText = trimmedLine.replace(/^\[|\]$/g, '');
                bubbles.push({ speaker: 'NARRATOR', text: displayText, lineIndex: idx + 1 });
                return;
            }

            const match = trimmedLine.match(/^(.+?):\s*(.*)/);
            
            if (match) {
                pushCurrentBubble();
                currentSpeaker = match[1].trim();
                currentText = match[2];
                currentLineIndex = idx + 1;
            } else {
                if (currentSpeaker) {
                    currentText += '\n' + trimmedLine;
                } else {
                    bubbles.push({ speaker: 'NARRATOR', text: trimmedLine, lineIndex: idx + 1 });
                }
            }
        });
        
        pushCurrentBubble();

        return bubbles;
    }, [content]);

    // --- Unique Speakers for Cycling ---
    const uniqueSpeakers = useMemo(() => {
        const speakers = new Set<string>();
        chatBubbles.forEach(b => {
            if (b.speaker !== 'NARRATOR') speakers.add(b.speaker.trim());
        });
        return Array.from(speakers);
    }, [chatBubbles]);

    // Set initial active right character if not set
    useEffect(() => {
        if (!activeRightChar && uniqueSpeakers.length > 0) {
            setActiveRightChar(uniqueSpeakers[0]);
        }
    }, [uniqueSpeakers, activeRightChar]);

    const cycleRightChar = () => {
        if (uniqueSpeakers.length === 0) return;
        const currentIndex = activeRightChar ? uniqueSpeakers.indexOf(activeRightChar) : -1;
        const nextIndex = (currentIndex + 1) % uniqueSpeakers.length;
        setActiveRightChar(uniqueSpeakers[nextIndex]);
    };

    if (!isOpen) return null;

    return (
        <div className="w-full md:w-1/2 bg-[#eef2f6] border-l border-white/50 flex flex-col h-full overflow-hidden absolute md:relative z-20 top-0 animate-in slide-in-from-right-10 duration-300 shadow-2xl md:shadow-none">
            {/* Header */}
            <div className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200 flex justify-between items-center shadow-sm z-10 shrink-0">
                <h3 className="font-bold text-gray-700 flex items-center tracking-tight">
                    <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-xl mr-3">
                        <MessageCircle className="w-5 h-5" />
                    </span>
                    Live Preview
                </h3>
                <div className="flex items-center gap-2">
                    {/* Cycle Right Character Toggle */}
                    {uniqueSpeakers.length > 1 && (
                        <button 
                            onClick={cycleRightChar} 
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100"
                            title="สลับคนพูดอยู่ขวา (Cycle Right Character)"
                        >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span className="text-[12px] font-bold uppercase">
                                {activeRightChar || 'สลับฝั่ง'}
                            </span>
                        </button>
                    )}
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 md:hidden p-2 hover:bg-red-50 rounded-full transition-colors">
                        <X className="w-5 h-5"/>
                    </button>
                </div>
            </div>
            
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                {chatBubbles.map((bubble, idx) => {
                    const isNarrator = bubble.speaker === 'NARRATOR';
                    const charIndex = uniqueSpeakers.indexOf(bubble.speaker.trim());
                    
                    // Logic: If speaker matches activeRightChar, put on Right. Otherwise Left.
                    const isRight = activeRightChar 
                        ? bubble.speaker.trim() === activeRightChar 
                        : charIndex !== -1 && charIndex % 2 !== 0;
                    
                    if (isNarrator) {
                        return (
                            <div key={idx} className="flex flex-col items-center my-6 opacity-80 animate-in fade-in zoom-in-95 duration-500">
                                <span className="text-[12px] text-gray-400 font-bold mb-1">#{bubble.lineIndex}</span>
                                <span className="text-sm font-bold text-gray-500 italic bg-gray-200/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gray-200 shadow-sm">
                                    {bubble.text}
                                </span>
                            </div>
                        )
                    }

                    // Avatar Color Generation (Simple hash)
                    const avatarColor = isRight ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-pink-500 to-orange-400';

                    return (
                        <div key={idx} className={`flex gap-3 ${isRight ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 fade-in duration-300`} style={{ animationDelay: `${idx * 50}ms` }}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-md border-2 border-white shrink-0`}>
                                {bubble.speaker.charAt(0)}
                            </div>

                            <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                <div className="flex items-center gap-2 mb-1 px-1">
                                    {isRight && <span className="text-[12px] text-gray-300 font-bold">#{bubble.lineIndex}</span>}
                                    <span className="text-[12px] text-gray-400 font-bold uppercase tracking-wide">{bubble.speaker}</span>
                                    {!isRight && <span className="text-[12px] text-gray-300 font-bold">#{bubble.lineIndex}</span>}
                                </div>
                                <div className={`
                                    px-4 py-3 text-sm shadow-sm whitespace-pre-wrap leading-relaxed
                                    ${isRight 
                                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none shadow-indigo-200' 
                                        : 'bg-white text-gray-700 border border-gray-100 rounded-2xl rounded-tl-none shadow-gray-200'}
                                `}>
                                    {bubble.text}
                                </div>
                            </div>
                        </div>
                    );
                })}
                
                {chatBubbles.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                        <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
                        <p className="text-sm font-bold">ยังไม่มีบทสนทนา</p>
                        <p className="text-xs mt-1">พิมพ์ "ชื่อ: ข้อความ" หรือ [วงเล็บ] เพื่อเริ่มคุยกันเลย!</p>
                    </div>
                )}
                
                {/* Spacer */}
                <div className="h-12"></div>
            </div>
        </div>
    );
};

export default ChatPreview;