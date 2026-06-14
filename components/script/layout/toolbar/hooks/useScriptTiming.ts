import { useMemo } from 'react';
import { calculateDuration } from '../utils/timingUtils';

export const useScriptTiming = (content: string) => {
    return useMemo(() => {
        return calculateDuration(content);
    }, [content]);
};
