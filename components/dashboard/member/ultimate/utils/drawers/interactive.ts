/**
 * Drawing functions for special RPG interactive furniture elements on Canvas
 */

export const drawQuestBoard = (
    ctx: CanvasRenderingContext2D,
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // Shadow base
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 10 * pixelSize, 12 * pixelSize, 5 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wooden poles
    ctx.fillStyle = '#451a03'; // left support pole
    ctx.fillRect(-6 * pixelSize, -12 * pixelSize, 2 * pixelSize, 22 * pixelSize);
    ctx.fillStyle = '#381c0c'; // right support pole
    ctx.fillRect(4 * pixelSize, -12 * pixelSize, 2 * pixelSize, 22 * pixelSize);

    // Main Board backing
    ctx.fillStyle = '#78350f'; // main wooden board
    ctx.fillRect(-10 * pixelSize, -22 * pixelSize, 20 * pixelSize, 12 * pixelSize);
    ctx.fillStyle = '#92400e'; // board top roof accent
    ctx.fillRect(-11 * pixelSize, -24 * pixelSize, 22 * pixelSize, 2 * pixelSize);

    // Pinned Quest scrolls (Parchment color)
    ctx.fillStyle = '#fef08a'; // Left parchment paper
    ctx.fillRect(-8 * pixelSize, -20 * pixelSize, 7 * pixelSize, 9 * pixelSize);
    ctx.fillStyle = '#fef08a'; // Right parchment paper
    ctx.fillRect(1 * pixelSize, -19 * pixelSize, 7 * pixelSize, 7 * pixelSize);

    // Red/blue magic custom quest markers
    ctx.fillStyle = '#ef4444'; // Red seal
    ctx.fillRect(-7 * pixelSize, -19 * pixelSize, 2 * pixelSize, 2 * pixelSize);
    ctx.fillStyle = '#3b82f6'; // Blue seal
    ctx.fillRect(2 * pixelSize, -18 * pixelSize, 2 * pixelSize, 2 * pixelSize);

    // Mimic handwritten text line stripes
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-7 * pixelSize, -16 * pixelSize, 5 * pixelSize, 0.7 * pixelSize);
    ctx.fillRect(-7 * pixelSize, -14 * pixelSize, 4 * pixelSize, 0.7 * pixelSize);
    ctx.fillRect(2 * pixelSize, -15 * pixelSize, 5 * pixelSize, 0.7 * pixelSize);
};

export const drawDutySign = (
    ctx: CanvasRenderingContext2D,
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // Shadow base
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 10 * pixelSize, 10 * pixelSize, 4.5 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // Metallic steel dark post
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-1.5 * pixelSize, -14 * pixelSize, 3 * pixelSize, 24 * pixelSize);
    
    // Control board frame head
    ctx.fillStyle = '#334155';
    ctx.fillRect(-5 * pixelSize, -26 * pixelSize, 10 * pixelSize, 13 * pixelSize);
    ctx.fillStyle = '#0f172a'; // Inner background
    ctx.fillRect(-4 * pixelSize, -25 * pixelSize, 8 * pixelSize, 11 * pixelSize);

    // 3 Beaming Duty Lights: Green (Active), Amber (Pending), Red (Inaction / Warning)
    const greenGlowing = Math.sin(tick * 0.15) > 0;
    const amberGlowing = Math.sin(tick * 0.1) < -0.2;
    const redGlowing = Math.sin(tick * 0.2) > 0.4;

    // TOP: RED (Alert Mode)
    ctx.fillStyle = redGlowing ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(0, -22 * pixelSize, 1.8 * pixelSize, 0, Math.PI * 2);
    ctx.fill();

    // MID: AMBER (Warning Mode)
    ctx.fillStyle = amberGlowing ? '#f59e0b' : '#78350f';
    ctx.beginPath();
    ctx.arc(0, -19.5 * pixelSize, 1.8 * pixelSize, 0, Math.PI * 2);
    ctx.fill();

    // BOTTOM: GREEN (Perfect Operation Mode)
    ctx.fillStyle = greenGlowing ? '#10b981' : '#064e3b';
    ctx.beginPath();
    ctx.arc(0, -17 * pixelSize, 1.8 * pixelSize, 0, Math.PI * 2);
    ctx.fill();
};

export const drawGoalBeacon = (
    ctx: CanvasRenderingContext2D,
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // Shadow Base underneath floating anchor
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 10 * pixelSize, 11 * pixelSize, 5 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stone gothic pedestal
    ctx.fillStyle = '#312e81'; // dark blue base stone
    ctx.fillRect(-6 * pixelSize, 2 * pixelSize, 12 * pixelSize, 8 * pixelSize);
    ctx.fillStyle = '#3730a3'; // middle step
    ctx.fillRect(-4 * pixelSize, -2 * pixelSize, 8 * pixelSize, 4 * pixelSize);
    ctx.fillStyle = '#4f46e5'; // gold plate holder
    ctx.fillRect(-3 * pixelSize, -4 * pixelSize, 6 * pixelSize, 2 * pixelSize);

    // Floating dynamic diamond Crystal (floating upward/downward using sin logic)
    const floatDelta = Math.sin(tick * 0.08) * 2.5 * pixelSize;
    const crystalY = -14 * pixelSize + floatDelta;

    ctx.save();
    ctx.translate(0, crystalY);

    // Render multi-faceted glowing diamond shape
    ctx.fillStyle = '#a855f7'; // purple core
    ctx.beginPath();
    ctx.moveTo(0, -8 * pixelSize); // top tip
    ctx.lineTo(4 * pixelSize, 0); // right edge
    ctx.lineTo(0, 8 * pixelSize); // bottom tip
    ctx.lineTo(-4 * pixelSize, 0); // left edge
    ctx.closePath();
    ctx.fill();

    // Bright energy reflections
    ctx.fillStyle = '#e9d5ff'; // light highlight
    ctx.beginPath();
    ctx.moveTo(0, -8 * pixelSize);
    ctx.lineTo(0, 8 * pixelSize);
    ctx.lineTo(-4 * pixelSize, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Magic levitation sparkles
    if (tick % 60 < 30) {
        ctx.fillStyle = '#f472b6';
        ctx.fillRect(5 * pixelSize, crystalY + 6, 1 * pixelSize, 1 * pixelSize);
        ctx.fillStyle = '#67e8f9';
        ctx.fillRect(-6 * pixelSize, crystalY - 2, 1 * pixelSize, 1 * pixelSize);
    }
};

export const drawLeaderboardAltar = (
    ctx: CanvasRenderingContext2D,
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // Large shadow
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 11 * pixelSize, 16 * pixelSize, 8 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tiered altar steps (Epic gold frame design)
    ctx.fillStyle = '#5c4308'; // shadow rim
    ctx.beginPath();
    ctx.ellipse(0, 7 * pixelSize, 14 * pixelSize, 6 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d97706'; // gold step 1
    ctx.fillRect(-10 * pixelSize, 2 * pixelSize, 20 * pixelSize, 6 * pixelSize);
    ctx.fillStyle = '#f59e0b'; // gold step 2
    ctx.fillRect(-8 * pixelSize, -2 * pixelSize, 16 * pixelSize, 4 * pixelSize);

    // Golden pillar statuette on top
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-3 * pixelSize, -8 * pixelSize, 6 * pixelSize, 6 * pixelSize);

    // Glowing Victory Medallion hovering (glistening effect)
    const goldPulseY = -17 * pixelSize + Math.sin(tick * 0.05) * 1.5 * pixelSize;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, goldPulseY, 4 * pixelSize, 0, Math.PI * 2);
    ctx.fill();

    // Glimmer star symbol inside gold coin
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1 * pixelSize, goldPulseY - 2 * pixelSize, 2 * pixelSize, 4 * pixelSize);
    ctx.fillRect(-2 * pixelSize, goldPulseY - 1 * pixelSize, 4 * pixelSize, 2 * pixelSize);
};

export const drawVaultBox = (
    ctx: CanvasRenderingContext2D,
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // Shadow base
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 9 * pixelSize, 13 * pixelSize, 6 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // Arch chest wood body
    ctx.fillStyle = '#512e16';
    ctx.fillRect(-9 * pixelSize, -5 * pixelSize, 18 * pixelSize, 12 * pixelSize);

    // Gold corner steel straps and braces
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-9 * pixelSize, -5 * pixelSize, 2 * pixelSize, 12 * pixelSize); // left trim
    ctx.fillRect(7 * pixelSize, -5 * pixelSize, 2 * pixelSize, 12 * pixelSize); // right trim
    ctx.fillRect(-9 * pixelSize, -5 * pixelSize, 18 * pixelSize, 2.5 * pixelSize); // lid rim

    // Center locks
    ctx.fillStyle = '#1e293b'; // keyslot dark
    ctx.fillRect(-1.5 * pixelSize, 1 * pixelSize, 3 * pixelSize, 3 * pixelSize);

    // Leaking diamond aura stars (Shop elements!)
    const sparkleX = Math.sin(tick * 0.1) * 8 * pixelSize;
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(sparkleX, -10 * pixelSize, 1 * pixelSize, 1 * pixelSize);
};

export const drawChatBall = (
    ctx: CanvasRenderingContext2D,
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // Shadow base
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 10 * pixelSize, 9 * pixelSize, 4 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fine copper iron leg stand
    ctx.fillStyle = '#475569';
    ctx.fillRect(-1 * pixelSize, 0, 2 * pixelSize, 10 * pixelSize);
    ctx.fillStyle = '#64748b'; // circular clamp base
    ctx.fillRect(-3 * pixelSize, -2 * pixelSize, 6 * pixelSize, 2 * pixelSize);
    ctx.fillRect(-4 * pixelSize, 8 * pixelSize, 8 * pixelSize, 2 * pixelSize);

    // Shimmering Purple Vortex communication orb
    const pulseRatio = 1 + Math.sin(tick * 0.08) * 0.06;
    const orbRad = 5 * pulseRatio * pixelSize;
    const orbY = -7 * pixelSize;

    const orbGradient = ctx.createRadialGradient(0, orbY, 2, 0, orbY, orbRad);
    orbGradient.addColorStop(0, '#f472b6'); // pink lightning glow center
    orbGradient.addColorStop(0.6, '#a855f7'); // deep amethyst field
    orbGradient.addColorStop(1, 'rgba(88, 28, 135, 0.8)'); // dark void boundary

    ctx.fillStyle = orbGradient;
    ctx.beginPath();
    ctx.arc(0, orbY, orbRad, 0, Math.PI * 2);
    ctx.fill();

    // Magic glow reflections
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(-1.5 * pixelSize, orbY - 1.5 * pixelSize, 1.2 * pixelSize, 0, Math.PI * 2);
    ctx.fill();
};

export const drawWikiPortal = (
    ctx: CanvasRenderingContext2D,
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // Giant circular portal shadow
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 10 * pixelSize, 18 * pixelSize, 6.5 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // Solid obsidian pillars on both sides
    ctx.fillStyle = '#0f172a'; // Left Pillar frame
    ctx.fillRect(-13 * pixelSize, -24 * pixelSize, 3 * pixelSize, 32 * pixelSize);
    ctx.fillStyle = '#1e293b'; // highlight left
    ctx.fillRect(-12 * pixelSize, -24 * pixelSize, 1 * pixelSize, 32 * pixelSize);

    ctx.fillStyle = '#0f172a'; // Right Pillar frame
    ctx.fillRect(10 * pixelSize, -24 * pixelSize, 3 * pixelSize, 32 * pixelSize);
    ctx.fillStyle = '#1e293b'; // highlight right
    ctx.fillRect(11 * pixelSize, -24 * pixelSize, 1 * pixelSize, 32 * pixelSize);

    // Curved top arch archway
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-13 * pixelSize, -27 * pixelSize, 26 * pixelSize, 3 * pixelSize);

    // Cosmic swirl portal matrix inside
    ctx.save();
    const swirlGrad = ctx.createLinearGradient(-10 * pixelSize, -24 * pixelSize, 10 * pixelSize, 8 * pixelSize);
    // Slowly shifting active portal shades
    const colorShift = Math.sin(tick * 0.04) * 0.5 + 0.5;
    const colA = colorShift > 0.5 ? '#1d4ed8' : '#4f46e5';
    const colB = colorShift > 0.5 ? '#a855f7' : '#ec4899';
    
    swirlGrad.addColorStop(0, '#020617');
    swirlGrad.addColorStop(0.4, colA);
    swirlGrad.addColorStop(0.8, colB);
    swirlGrad.addColorStop(1, '#020617');

    ctx.fillStyle = swirlGrad;
    ctx.fillRect(-10 * pixelSize, -24 * pixelSize, 20 * pixelSize, 32 * pixelSize);

    // Draw active vortex energy orbits
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    const lineOffset = (tick % 40) / 40 * 10;
    ctx.beginPath();
    for (let idx = -20; idx < 20; idx += 10) {
        ctx.moveTo(-10 * pixelSize, (idx + lineOffset) * pixelSize);
        ctx.lineTo(10 * pixelSize, (idx + lineOffset + 6) * pixelSize);
    }
    ctx.stroke();
    ctx.restore();
};
