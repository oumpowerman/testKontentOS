import React, { useEffect, useRef, useState } from 'react';
import { drawPixelFurniture, drawWizardCharacter } from './ultimate/utils/pixelRenderer';
import { ZoomIn, ZoomOut, Maximize2, Navigation } from 'lucide-react';
import { 
    SyncedPlayer, 
    FURNITURE_MAP, 
    MIN_BOUND, 
    MAX_BOUND, 
    getIsometricPos, 
    getFlatPosFromScreen 
} from './ultimate/utils/isometric';
import { drawDetailedRoomBackground } from './ultimate/utils/drawers/roomBackground';
import { PlayerTagOverlay, OverlayPlayer } from './ultimate/PlayerTagOverlay';
import { User } from '../../../types';

interface PixelHeroFollowerProps {
    currentUser: User;
    activeFocusTaskName?: string;
    otherPlayers?: SyncedPlayer[];
    onPositionChange?: (x: number, y: number, isIdle: boolean) => void;
    onFurnitureClick?: (key: string) => void;
    onViewportChange?: (zoom: number, pan: { x: number, y: number }) => void;
    onSendReaction?: (targetId: string, type: 'heart' | 'spell', cx: number, cy: number) => void;
}

export { FURNITURE_MAP, getIsometricPos };

export const PixelHeroFollower: React.FC<PixelHeroFollowerProps> = ({ 
    currentUser,
    activeFocusTaskName = '',
    otherPlayers = [], 
    onPositionChange,
    onFurnitureClick,
    onViewportChange,
    onSendReaction
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Viewport interactive state refs & state (Internal state for UI overlay rendering)
    const [zoom, setZoomState] = useState(1.0);
    const [pan, setPanState] = useState({ x: 0, y: 0 });
    const [overlayPlayers, setOverlayPlayers] = useState<OverlayPlayer[]>([]);
    
    const zoomRef = useRef(1.0);
    const panRef = useRef({ x: 0, y: 0 });

    const updateViewport = (newZoom: number, newPan: { x: number, y: number }) => {
        zoomRef.current = newZoom;
        panRef.current = newPan;
        setZoomState(newZoom);
        setPanState(newPan);
        if (onViewportChange) {
            onViewportChange(newZoom, newPan);
        }
    };

    // Track mouse, clicks and hero coordinates in mathematical flat space [-0.5..0.5]
    const mouseFlat = useRef({ fx: 0, fy: 0 });
    const heroFlat = useRef({ fx: 0, fy: 0 });
    const targetFlat = useRef({ fx: 0, fy: 0 });
    const isMovingToTarget = useRef<boolean>(false);
    
    // Mouse dragging and panning tracker states
    const isDraggingMap = useRef<boolean>(false);
    const dragStartMouse = useRef({ x: 0, y: 0 });
    const dragStartPan = useRef({ x: 0, y: 0 });
    
    // Inactivity timers and state
    const lastActiveTime = useRef<number>(Date.now());
    const isIdleRef = useRef<boolean>(false);
    const [isHoveringClickable, setIsHoveringClickable] = useState(false);
    const [selectedIdleFurniture, setSelectedIdleFurniture] = useState<keyof typeof FURNITURE_MAP>('DESK');

    // Sync online multiplayers internally for canvas animation
    const otherPlayersRef = useRef<SyncedPlayer[]>([]);
    const otherPlayersFlatsRef = useRef<Record<string, { fx: number, fy: number, tick: number }>>({});

    useEffect(() => {
        otherPlayersRef.current = otherPlayers;
        
        // Purge idle left players
        const activeIds = new Set(otherPlayers.map(p => p.id));
        Object.keys(otherPlayersFlatsRef.current).forEach(id => {
            if (!activeIds.has(id)) {
                delete otherPlayersFlatsRef.current[id];
            }
        });
    }, [otherPlayers]);

    // Handle initial sizing and dynamic syncing on load
    useEffect(() => {
        if (onViewportChange) {
            onViewportChange(zoomRef.current, panRef.current);
        }
    }, []);

    // Interactive Drag and Scroll Events
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const SAFE_WALK_MIN = -1.15;
        const SAFE_WALK_MAX = 1.15;
        const clampToWalkable = (val: number) => Math.max(SAFE_WALK_MIN, Math.min(SAFE_WALK_MAX, val));

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            // Zoom bounds limits 0.45 to 2.2
            const nextZoom = Math.max(0.45, Math.min(2.2, zoomRef.current + e.deltaY * -0.0016));
            updateViewport(nextZoom, panRef.current);
        };

        const handleMouseDown = (e: MouseEvent) => {
            // Ignore if clicking on buttons
            if ((e.target as HTMLElement).closest('.hud-button')) return;

            isDraggingMap.current = false;
            dragStartMouse.current = { x: e.clientX, y: e.clientY };
            dragStartPan.current = { ...panRef.current };
            
            lastActiveTime.current = Date.now();
            if (isIdleRef.current) {
                isIdleRef.current = false;
            }

            // Bind global move events so dragging outside canvas maintains lock
            window.addEventListener('mousemove', handleMouseMoveGlobal);
            window.addEventListener('mouseup', handleMouseUpGlobal);
        };

        const handleMouseMoveGlobal = (e: MouseEvent) => {
            const dx = e.clientX - dragStartMouse.current.x;
            const dy = e.clientY - dragStartMouse.current.y;

            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                isDraggingMap.current = true;
                const nextPan = {
                    x: dragStartPan.current.x + dx,
                    y: dragStartPan.current.y + dy
                };
                updateViewport(zoomRef.current, nextPan);
            }
        };

        const handleMouseMoveOnCanvas = (e: MouseEvent) => {
            // Only follow mouse if not currently dragging the map
            if (isDraggingMap.current) return;

            const canvas = canvasRef.current;
            if (!canvas) return;

            // Don't follow if mouse is on top of interactive HUD buttons
            if ((e.target as HTMLElement).closest('.hud-button')) return;

            const { fx, fy } = getFlatPosFromScreen(
                e.clientX,
                e.clientY,
                canvas.width,
                canvas.height,
                panRef.current.x,
                panRef.current.y,
                zoomRef.current
            );

            // Clamp coordinate target for neat boundary limits
            targetFlat.current.fx = clampToWalkable(fx);
            targetFlat.current.fy = clampToWalkable(fy);
            isMovingToTarget.current = true;

            // Reset idle state
            lastActiveTime.current = Date.now();
            if (isIdleRef.current) {
                isIdleRef.current = false;
            }

            // Check if mouse is hovering over any furniture to trigger hover visual effect (wizard look-at)
            let isNearFurniture = false;
            let closestDist = 0.095;
            Object.entries(FURNITURE_MAP).forEach(([key, item]) => {
                const isInteractable = [
                    'BOOKSHELF', 'DESK', 'SOFA', 'QUEST_BOARD', 'DUTY_SIGN',
                    'GOAL_BEACON', 'LEADERBOARD_ALTAR', 'VAULT_BOX', 'CHAT_BALL', 'WIKI_PORTAL'
                ].includes(key);
                if (!isInteractable) return;

                const dist = Math.sqrt(Math.pow(fx - item.fx, 2) + Math.pow(fy - item.fy, 2));
                if (dist < closestDist) {
                    isNearFurniture = true;
                }
            });
            setIsHoveringClickable(isNearFurniture);
        };

        const handleMouseUpGlobal = (e: MouseEvent) => {
            window.removeEventListener('mousemove', handleMouseMoveGlobal);
            window.removeEventListener('mouseup', handleMouseUpGlobal);

            // If we panned the world, skip walking calculation
            if (isDraggingMap.current) {
                isDraggingMap.current = false;
                return;
            }

            // Quick click helper: Move player hero to targeted coordinate or click furniture!
            const canvas = canvasRef.current;
            if (!canvas) return;

            const { fx, fy } = getFlatPosFromScreen(
                e.clientX,
                e.clientY,
                canvas.width,
                canvas.height,
                panRef.current.x,
                panRef.current.y,
                zoomRef.current
            );

            // Check if user tapped directly on or near any piece of furniture
            let clickedFurnitureKey: string | null = null;
            let closestDist = 0.095; // distance click radius

            Object.entries(FURNITURE_MAP).forEach(([key, item]) => {
                const isInteractable = [
                    'BOOKSHELF', 'DESK', 'SOFA', 'QUEST_BOARD', 'DUTY_SIGN',
                    'GOAL_BEACON', 'LEADERBOARD_ALTAR', 'VAULT_BOX', 'CHAT_BALL', 'WIKI_PORTAL'
                ].includes(key);
                if (!isInteractable) return;

                const dist = Math.sqrt(Math.pow(fx - item.fx, 2) + Math.pow(fy - item.fy, 2));
                if (dist < closestDist) {
                    closestDist = dist;
                    clickedFurnitureKey = key;
                }
            });

            if (clickedFurnitureKey && onFurnitureClick) {
                // Walk character to the front/side coordinates of the furniture then open modal with brief delay
                const targetFurniture = FURNITURE_MAP[clickedFurnitureKey as keyof typeof FURNITURE_MAP];
                targetFlat.current.fx = targetFurniture.fx + (clickedFurnitureKey === 'DESK' ? -0.04 : clickedFurnitureKey === 'SOFA' ? -0.02 : 0.05);
                targetFlat.current.fy = targetFurniture.fy + (clickedFurnitureKey === 'DESK' ? 0.08 : clickedFurnitureKey === 'SOFA' ? 0.04 : 0.06);
                isMovingToTarget.current = true;
                
                onFurnitureClick(clickedFurnitureKey);
            } else {
                // Normal plain coordinates walk path
                targetFlat.current.fx = clampToWalkable(fx);
                targetFlat.current.fy = clampToWalkable(fy);
                isMovingToTarget.current = true;
            }
        };

        // --- Touch support for mobile dragging and interaction ---
        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 0) return;
            dragStartMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            dragStartPan.current = { ...panRef.current };
            isDraggingMap.current = false;

            lastActiveTime.current = Date.now();
            if (isIdleRef.current) {
                isIdleRef.current = false;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 0) return;
            const dx = e.touches[0].clientX - dragStartMouse.current.x;
            const dy = e.touches[0].clientY - dragStartMouse.current.y;

            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                isDraggingMap.current = true;
                const nextPan = {
                    x: dragStartPan.current.x + dx,
                    y: dragStartPan.current.y + dy
                };
                updateViewport(zoomRef.current, nextPan);
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (isDraggingMap.current) {
                isDraggingMap.current = false;
                return;
            }

            // Handle touch tap walk
            if (e.changedTouches.length === 0) return;
            const touch = e.changedTouches[0];
            const canvas = canvasRef.current;
            if (!canvas) return;

            const { fx, fy } = getFlatPosFromScreen(
                touch.clientX,
                touch.clientY,
                canvas.width,
                canvas.height,
                panRef.current.x,
                panRef.current.y,
                zoomRef.current
            );

            let clickedFurnitureKey: string | null = null;
            let closestDist = 0.095;

            Object.entries(FURNITURE_MAP).forEach(([key, item]) => {
                const isInteractable = [
                    'BOOKSHELF', 'DESK', 'SOFA', 'QUEST_BOARD', 'DUTY_SIGN',
                    'GOAL_BEACON', 'LEADERBOARD_ALTAR', 'VAULT_BOX', 'CHAT_BALL', 'WIKI_PORTAL'
                ].includes(key);
                if (!isInteractable) return;

                const dist = Math.sqrt(Math.pow(fx - item.fx, 2) + Math.pow(fy - item.fy, 2));
                if (dist < closestDist) {
                    closestDist = dist;
                    clickedFurnitureKey = key;
                }
            });

            if (clickedFurnitureKey && onFurnitureClick) {
                const targetFurniture = FURNITURE_MAP[clickedFurnitureKey as keyof typeof FURNITURE_MAP];
                targetFlat.current.fx = targetFurniture.fx;
                targetFlat.current.fy = targetFurniture.fy + 0.05;
                isMovingToTarget.current = true;
                onFurnitureClick(clickedFurnitureKey);
            } else {
                targetFlat.current.fx = clampToWalkable(fx);
                targetFlat.current.fy = clampToWalkable(fy);
                isMovingToTarget.current = true;
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('mousedown', handleMouseDown);
        container.addEventListener('touchstart', handleTouchStart);
        container.addEventListener('touchmove', handleTouchMove);
        container.addEventListener('touchend', handleTouchEnd);
        container.addEventListener('mousemove', handleMouseMoveOnCanvas);

        // Cycle through cozy sit targets when idle
        const idleCycle = setInterval(() => {
            if (isIdleRef.current) {
                const items: Array<keyof typeof FURNITURE_MAP> = ['DESK', 'SOFA', 'BOOKSHELF'];
                const nextItem = items[Math.floor(Math.random() * items.length)];
                setSelectedIdleFurniture(nextItem);
            }
        }, 11000);

        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('mousedown', handleMouseDown);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('mousemove', handleMouseMoveOnCanvas);
            window.removeEventListener('mousemove', handleMouseMoveGlobal);
            window.removeEventListener('mouseup', handleMouseUpGlobal);
            clearInterval(idleCycle);
        };
    }, []);

    // Canvas main animation thread
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        let tick = 0;
        const lerpFactor = 0.022; // Slower, elegant smooth path walk following
        const pixelSize = 3.5; // Crispy retro pixels

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            tick++;

            // Retrive interactive values safely from react refs to avoid canvas context re-bind glitches
            const currentZoom = zoomRef.current;
            const currentPan = panRef.current;

            // --- 1. Draw 3D Isometric Detailed Room Atmosphere Background ---
            drawDetailedRoomBackground(ctx, width, height, currentPan.x, currentPan.y, currentZoom, tick);

            // --- 2. Determine targets and update local character coordinates ---
            const timeSinceActive = Date.now() - lastActiveTime.current;
            if (timeSinceActive > 8000) {
                isIdleRef.current = true;
            }

            // Target coordinates: Either destination target click, or mouse hover, or cozy furniture seat
            let targetFlatFx = heroFlat.current.fx;
            let targetFlatFy = heroFlat.current.fy;

            if (isMovingToTarget.current) {
                targetFlatFx = targetFlat.current.fx;
                targetFlatFy = targetFlat.current.fy;
            } else if (isIdleRef.current) {
                const mapKey = selectedIdleFurniture;
                const furniture = FURNITURE_MAP[mapKey];
                if (furniture) {
                    if (mapKey === 'DESK') {
                        targetFlatFx = furniture.fx - 0.04;
                        targetFlatFy = furniture.fy + 0.11;
                    } else if (mapKey === 'SOFA') {
                        targetFlatFx = furniture.fx - 0.02;
                        targetFlatFy = furniture.fy + 0.03;
                    } else {
                        targetFlatFx = furniture.fx + 0.05;
                        targetFlatFy = furniture.fy + 0.12;
                    }
                }
            }

            // Interpolate coordinates smoothly
            const dfx = targetFlatFx - heroFlat.current.fx;
            const dfy = targetFlatFy - heroFlat.current.fy;
            const distFlat = Math.sqrt(dfx * dfx + dfy * dfy);
            const isWalking = distFlat > 0.01;

            if (isWalking) {
                heroFlat.current.fx += dfx * lerpFactor;
                heroFlat.current.fy += dfy * lerpFactor;
            } else {
                isMovingToTarget.current = false; // Reset lock upon completion
            }

            // Sync with Supabase Multiplayers (scale [-0.5..0.5] range up to transportable [0..1] range)
            if (tick % 10 === 0 && onPositionChange) {
                onPositionChange(
                    heroFlat.current.fx + 0.5,
                    heroFlat.current.fy + 0.5,
                    !isWalking
                );
            }

            // --- 4. Prepare Y-Sorted list of actors / items rendering sequence ---
            interface Renderable {
                screenY: number;
                draw: () => void;
            }
            const renderQueue: Renderable[] = [];

            // Add furniture landmarks to the queue
            Object.entries(FURNITURE_MAP).forEach(([key, f]) => {
                const pos = getIsometricPos(f.fx, f.fy, width, height, currentPan.x, currentPan.y, currentZoom);
                renderQueue.push({
                    screenY: pos.y,
                    draw: () => drawPixelFurniture(ctx, key as any, pos.x, pos.y, pixelSize * currentZoom, tick)
                });
            });

            // Add local character
            const localPos = getIsometricPos(heroFlat.current.fx, heroFlat.current.fy, width, height, currentPan.x, currentPan.y, currentZoom);
            renderQueue.push({
                screenY: localPos.y,
                draw: () => drawWizardCharacter(
                    ctx,
                    localPos.x,
                    localPos.y,
                    currentUser.level,
                    'คุณ',
                    !isWalking,
                    tick,
                    dfx < 0,
                    isHoveringClickable,
                    '#db2777', // Premium magenta robe
                    true,
                    pixelSize * currentZoom
                )
            });

            // Add other online multiplayer wizards
            otherPlayersRef.current.forEach(play => {
                const otherFlatFx = play.x - 0.5;
                const otherFlatFy = play.y - 0.5;

                if (!otherPlayersFlatsRef.current[play.id]) {
                    otherPlayersFlatsRef.current[play.id] = {
                        fx: otherFlatFx,
                        fy: otherFlatFy,
                        tick: Math.floor(Math.random() * 100)
                    };
                }

                const oflat = otherPlayersFlatsRef.current[play.id];
                oflat.tick++;

                const odfx = otherFlatFx - oflat.fx;
                const odfy = otherFlatFy - oflat.fy;
                oflat.fx += odfx * 0.08;
                oflat.fy += odfy * 0.08;

                const otherWalking = Math.sqrt(odfx * odfx + odfy * odfy) > 0.005;
                const syncedScreenPos = getIsometricPos(oflat.fx, oflat.fy, width, height, currentPan.x, currentPan.y, currentZoom);

                renderQueue.push({
                    screenY: syncedScreenPos.y,
                    draw: () => drawWizardCharacter(
                        ctx,
                        syncedScreenPos.x,
                        syncedScreenPos.y,
                        play.level,
                        play.name,
                        play.idle || !otherWalking,
                        oflat.tick,
                        odfx < 0,
                        false,
                        play.color || '#3b82f6',
                        false,
                        pixelSize * currentZoom
                    )
                });
            });

            // --- Y-SORTING EXECUTION ---
            // Render everything sorted ascending by height coordinate (Y) to guarantee beautiful layered overlapping!
            renderQueue.sort((a, b) => a.screenY - b.screenY);
            renderQueue.forEach(item => item.draw());

            // --- 5. Draw Celestial Atmosphere Light Rays ---
            const rayGradient = ctx.createLinearGradient(width, 0, 0, height);
            rayGradient.addColorStop(0, 'rgba(129, 140, 248, 0.06)'); // Soft cosmic indigo flare
            rayGradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.02)');
            rayGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = rayGradient;
            ctx.beginPath();
            ctx.moveTo(width * 0.35, 0);
            ctx.lineTo(width, 0);
            ctx.lineTo(width, height * 0.7);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fill();

            // --- 6. Prepare list of players' screen coordinates for HTML RPG overlays ---
            const overlayList: OverlayPlayer[] = [];
            
            // Add local self player details
            overlayList.push({
                id: currentUser.id,
                name: currentUser.name || 'Wizard',
                level: currentUser.level || 1,
                hp: currentUser.hp ?? 100,
                maxHp: currentUser.maxHp ?? 100,
                feeling: currentUser.feeling || 'พร้อมสมาธิร่ายเวทมนตร์ ✨',
                focusTask: activeFocusTaskName || '',
                isSelf: true,
                screenX: localPos.x,
                screenY: localPos.y,
                color: '#db2777'
            });

            // Add other online multiplayers
            otherPlayersRef.current.forEach(play => {
                const oflat = otherPlayersFlatsRef.current[play.id];
                if (oflat) {
                    const syncedScreenPos = getIsometricPos(oflat.fx, oflat.fy, width, height, currentPan.x, currentPan.y, currentZoom);
                    overlayList.push({
                        id: play.id,
                        name: play.name,
                        level: play.level,
                        hp: play.hp ?? 100,
                        maxHp: play.maxHp ?? 100,
                        feeling: play.feeling || '',
                        focusTask: play.focusTask || '',
                        isSelf: false,
                        screenX: syncedScreenPos.x,
                        screenY: syncedScreenPos.y,
                        color: play.color || '#3b82f6'
                    });
                }
            });

            // Save to React state throttled to every 2 ticks (approx 30fps) for top rendering speed
            if (tick % 2 === 0) {
                setOverlayPlayers(overlayList);
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, [currentUser, activeFocusTaskName, isHoveringClickable, selectedIdleFurniture, onPositionChange, onFurnitureClick]);

    // Fast viewport HUD click controls
    const triggerZoomIn = () => {
        const nextZoom = Math.min(2.2, zoomRef.current + 0.15);
        updateViewport(nextZoom, panRef.current);
    };

    const triggerZoomOut = () => {
        const nextZoom = Math.max(0.45, zoomRef.current - 0.15);
        updateViewport(nextZoom, panRef.current);
    };

    const triggerRecenter = () => {
        updateViewport(1.0, { x: 0, y: 0 });
    };

    return (
        <div 
            id="pixel-hero-canvas-container" 
            ref={containerRef}
            className="fixed inset-0 pointer-events-auto overflow-hidden select-none z-0 cursor-grab active:cursor-grabbing"
        >
            {/* Dark cozy room atmosphere vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#06070a] via-[#0b0c14]/95 to-[#10111d]/98 pointer-events-none z-0" />
            
            {/* Main Interactive drawing Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-90 z-0" />

            {/* Real-time RPG HUD Name, Level and health overlay */}
            <PlayerTagOverlay 
                players={overlayPlayers} 
                onReaction={onSendReaction || (() => {})} 
            />

            {/* FLOATING CAMERA CONTROL DECK HUD (Bottom Right) */}
            <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-[#121424]/90 border border-slate-700/60 p-2 rounded-2xl shadow-2xl z-20 pointer-events-auto">
                <button
                    type="button"
                    onClick={triggerZoomIn}
                    className="hud-button w-9 h-9 flex items-center justify-center text-indigo-300 hover:text-indigo-100 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                    title="ซูมเข้า (Zoom In)"
                >
                    <ZoomIn className="w-5 h-5 pointer-events-none" />
                </button>
                <div className="w-px h-6 bg-slate-800" />
                <button
                    type="button"
                    onClick={triggerZoomOut}
                    className="hud-button w-9 h-9 flex items-center justify-center text-indigo-300 hover:text-indigo-100 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                    title="ซูมออก (Zoom Out)"
                >
                    <ZoomOut className="w-5 h-5 pointer-events-none" />
                </button>
                <div className="w-px h-6 bg-slate-800" />
                <button
                    type="button"
                    onClick={triggerRecenter}
                    className="hud-button w-9 h-9 flex items-center justify-center text-rose-450 hover:text-rose-300 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                    title="จัดตำแหน่งกล้องหน้าตรง (Recenter View)"
                >
                    <Maximize2 className="w-4 h-4 pointer-events-none" />
                </button>
                <span className="text-[10px] font-mono text-slate-500 font-bold px-1.5 min-w-[32px] text-center">
                    {Math.round(zoom * 100)}%
                </span>
            </div>

            {/* QUICK CAMERA SCROLL/PAN HINT (Bottom Left) */}
            <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-[#121424]/40 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/5 shadow-xs text-slate-400 text-[10px] font-medium z-10 pointer-events-none">
                <Navigation className="w-3.5 h-3.5 rotate-45 text-pink-400" />
                <span>คลิกลากเมาส์ หรือ สองนิ้วเลื่อน เพื่อแพนกล้องแผนที่ 🗺️</span>
            </div>
        </div>
    );
};

export default PixelHeroFollower;
