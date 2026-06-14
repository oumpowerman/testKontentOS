/**
 * Utility functions for script timing and word analysis.
 */

export const cleanContentForTiming = (html: string): string => {
    if (!html) return '';
    return html
        .replace(/\[.*?\]/g, '') // Remove [Stage Directions]
        .replace(/\(.*?\)/g, '') // Remove (Parenthetical Notes)
        .replace(/<strong>.*?:?<\/strong>:?\s*/g, '') // Remove Bold Character Names (handles : inside or outside)
        .replace(/<[^>]*>?/gm, '') // Remove HTML Tags
        .replace(/^[^\n:]+:\s*/gm, '') // Remove "Name: " at start of lines (fallback)
        .trim();
};

export const calculateDuration = (content: string): { estimatedSeconds: number; formattedDuration: string } => {
    const textContent = cleanContentForTiming(content);
    const estimatedSeconds = Math.ceil(textContent.length / 12); 
    const minutes = Math.floor(estimatedSeconds / 60);
    const seconds = estimatedSeconds % 60;
    const formattedDuration = `${minutes}m ${seconds}s`;
    
    return {
        estimatedSeconds,
        formattedDuration
    };
};
