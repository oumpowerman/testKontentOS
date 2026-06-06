import { useState, useEffect, useRef, useCallback } from 'react';
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
    
    // Store positions independently to mix with presence state
    const positionsRef = useRef<Record<string, { x: number, y: number, idle: boolean }>>({});
    
    const focusTaskRef = useRef(focusTaskName);
    const reactionCallbackRef = useRef(onReactionReceived);

    // Using tabId to allow multiple connections from the same user to exist (can be modified back to currentUser.id if preferred)
    const presenceKey = currentUser.id; 

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
                    key: presenceKey,
                },
                broadcast: {
                    self: false,
                    ack: false,
                }
            },
        });

        channelRef.current = channel;

        let lastStateUpdate = 0;
        let stateUpdateTimer: any = null;

        const updatePlayersList = () => {
            if (!channel.presenceState) return;
            const state = channel.presenceState();
            const playersList: SyncedPlayer[] = [];

            Object.keys(state).forEach(key => {
                if (key === presenceKey) return; // skip self
                const userPresences = state[key] as any[];
                if (userPresences && userPresences.length > 0) {
                    const latest = userPresences[userPresences.length - 1];
                    const pos = positionsRef.current[key] || { x: 0.5, y: 0.5, idle: true };

                    playersList.push({
                        id: key,
                        name: latest.name || 'Anonymous Wizard',
                        level: latest.level || 1,
                        color: latest.color || '#3b82f6',
                        x: pos.x,
                        y: pos.y,
                        idle: pos.idle,
                        hp: latest.hp ?? 100,
                        maxHp: latest.maxHp ?? 100,
                        feeling: latest.feeling || 'พร้อมสมาธิร่ายเวทมนตร์ ✨',
                        focusTask: latest.focusTask || ''
                    });
                }
            });

            setOtherPlayers(playersList);
        };

        const throttledUpdatePlayersList = () => {
            const now = Date.now();
            if (now - lastStateUpdate > 400) {
                lastStateUpdate = now;
                updatePlayersList();
            } else if (!stateUpdateTimer) {
                stateUpdateTimer = setTimeout(() => {
                    lastStateUpdate = Date.now();
                    updatePlayersList();
                    stateUpdateTimer = null;
                }, 400 - (now - lastStateUpdate));
            }
        };

        channel
            .on('presence', { event: 'sync' }, () => {
                throttledUpdatePlayersList();
            })
            .on('broadcast', { event: 'pos' }, ({ payload }) => {
                // Update position cache
                positionsRef.current[payload.id] = {
                    x: payload.x,
                    y: payload.y,
                    idle: payload.idle
                };
                // Re-render players with new positions but throttle the React tree updates
                throttledUpdatePlayersList();
            })
            .on('broadcast', { event: 'reaction' }, ({ payload }) => {
                if (reactionCallbackRef.current) {
                    reactionCallbackRef.current(payload);
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    try {
                        // Track base presence info less frequently
                        await channel.track({
                            id: presenceKey,
                            name: currentUser.name || 'Wizard',
                            level: currentUser.level || 1,
                            color: '#db2777', 
                            hp: currentUser.hp ?? 100,
                            maxHp: currentUser.maxHp ?? 100,
                            feeling: currentUser.feeling || 'พร้อมสมาธิร่ายเวทมนตร์ ✨',
                            focusTask: focusTaskRef.current,
                            joinedAt: Date.now()
                        });
                    } catch (err) {
                        console.warn('Presence tracking track error:', err);
                    }
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [currentUser, presenceKey]);

    const reportPosition = useCallback((x: number, y: number, isIdle: boolean) => {
        const now = Date.now();
        // Throttle broadcast position to ~100ms
        if (now - lastReportTime.current > 100) {
            lastReportTime.current = now;
            if (channelRef.current) {
                // Use broadcast for frequent positional updates instead of presence track
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'pos',
                    payload: {
                        id: presenceKey,
                        x,
                        y,
                        idle: isIdle
                    }
                }).catch((err: any) => console.warn('Broadcast position error:', err));
            }
        }
    }, [presenceKey]);

    const sendReaction = useCallback((targetId: string, type: 'heart' | 'spell', clientX: number, clientY: number) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'reaction',
                payload: {
                    fromId: presenceKey,
                    fromName: currentUser.name || 'Wizard',
                    toId: targetId,
                    type,
                    x: clientX,
                    y: clientY
                }
            }).catch((err: any) => console.warn('Send reaction error:', err));
        }
    }, [presenceKey, currentUser.name]);

    return {
        otherPlayers,
        reportPosition,
        sendReaction
    };
}
