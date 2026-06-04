import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../../lib/supabase';
import { SyncedPlayer } from './utils/isometric';
import { User } from '../../../../types';

export function useUltimatePresence(
    currentUser: User, 
    focusTaskName: string = '', 
    onReactionReceived?: (reaction: any) => void
) {
    const [otherPlayers, setOtherPlayers] = useState<SyncedPlayer[]>([]);
    const channelRef = useRef<any>(null);
    const lastReportTime = useRef<number>(0);
    
    const focusTaskRef = useRef(focusTaskName);
    const reactionCallbackRef = useRef(onReactionReceived);

    useEffect(() => {
        focusTaskRef.current = focusTaskName;
    }, [focusTaskName]);

    useEffect(() => {
        reactionCallbackRef.current = onReactionReceived;
    }, [onReactionReceived]);

    useEffect(() => {
        // Create a unique channel for live-sync presence in the workroom
        const channel = supabase.channel('room:ultimate_presence_v1', {
            config: {
                presence: {
                    key: currentUser.id,
                },
            },
        });

        channelRef.current = channel;

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const playersList: SyncedPlayer[] = [];

                Object.keys(state).forEach(key => {
                    if (key === currentUser.id) return; // skip self
                    const userPresences = state[key] as any[];
                    if (userPresences && userPresences.length > 0) {
                        const latest = userPresences[userPresences.length - 1];
                        playersList.push({
                            id: key,
                            name: latest.name || 'Anonymous Wizard',
                            level: latest.level || 1,
                            color: latest.color || '#3b82f6',
                            x: latest.x ?? 0.5,
                            y: latest.y ?? 0.5,
                            idle: !!latest.idle,
                            hp: latest.hp ?? 100,
                            maxHp: latest.maxHp ?? 100,
                            feeling: latest.feeling || 'พร้อมสมาธิร่ายเวทมนตร์ ✨',
                            focusTask: latest.focusTask || ''
                        });
                    }
                });

                setOtherPlayers(playersList);
            })
            .on('broadcast', { event: 'reaction' }, ({ payload }) => {
                if (reactionCallbackRef.current) {
                    reactionCallbackRef.current(payload);
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    try {
                        await channel.track({
                            id: currentUser.id,
                            name: currentUser.name || 'Wizard',
                            level: currentUser.level || 1,
                            color: '#db2777', // pink dress tag
                            x: 0.5,
                            y: 0.5,
                            idle: false,
                            hp: currentUser.hp ?? 100,
                            maxHp: currentUser.maxHp ?? 100,
                            feeling: currentUser.feeling || 'พร้อมสมาธิร่ายเวทมนตร์ ✨',
                            focusTask: focusTaskRef.current,
                            lastActive: Date.now()
                        });
                    } catch (err) {
                        console.warn('Presence tracking track error:', err);
                    }
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [currentUser]);

    const reportPosition = (x: number, y: number, isIdle: boolean) => {
        const now = Date.now();
        if (now - lastReportTime.current > 160) {
            lastReportTime.current = now;
            if (channelRef.current) {
                channelRef.current.track({
                    id: currentUser.id,
                    name: currentUser.name || 'Wizard',
                    level: currentUser.level || 1,
                    color: '#db2777',
                    x,
                    y,
                    idle: isIdle,
                    hp: currentUser.hp ?? 100,
                    maxHp: currentUser.maxHp ?? 100,
                    feeling: currentUser.feeling || 'พร้อมสมาธิร่ายเวทมนตร์ ✨',
                    focusTask: focusTaskRef.current,
                    lastActive: now
                }).catch((err: any) => console.warn('Track update position error:', err));
            }
        }
    };

    const sendReaction = (targetId: string, type: 'heart' | 'spell', clientX: number, clientY: number) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'reaction',
                payload: {
                    fromId: currentUser.id,
                    fromName: currentUser.name || 'Wizard',
                    toId: targetId,
                    type,
                    x: clientX,
                    y: clientY
                }
            }).catch((err: any) => console.warn('Send reaction error:', err));
        }
    };

    return {
        otherPlayers,
        reportPosition,
        sendReaction
    };
}
