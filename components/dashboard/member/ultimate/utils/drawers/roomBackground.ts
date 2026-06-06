import { getIsometricPos } from '../isometric';

interface MysticParticle {
    fx: number;
    fy: number;
    height: number;
    speed: number;
    size: number;
    color: string;
}

// Stored local embers to preserve movement seamlessly across frames without React re-renders
const embers: MysticParticle[] = [];
const initEmbers = () => {
    if (embers.length > 0) return;
    for (let i = 0; i < 40; i++) {
        embers.push({
            fx: (Math.random() - 0.5) * 2.6,
            fy: (Math.random() - 0.5) * 2.6,
            height: Math.random() * 80 + 10,
            speed: 0.3 + Math.random() * 0.4,
            size: 1 + Math.random() * 2,
            color: Math.random() > 0.5 ? 'rgba(236, 72, 153, 0.5)' : 'rgba(129, 140, 248, 0.4)'
        });
    }
};

/**
 * Draws the highly physical textured floor, rugs, back walls, ambient lights, star windows, and glowing embers.
 */
export const drawDetailedRoomBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    panX: number,
    panY: number,
    zoom: number,
    tick: number
) => {
    initEmbers();
    ctx.save();

    const scaleX = Math.max(340, Math.min(width * 0.44, 480)) * zoom;
    const scaleY = scaleX * 0.52;
    const centerX = width / 2 + panX;
    const centerY = height * 0.55 + panY;

    // --- 1. DRAW COZY COLOURED WOVEN RUGS (Floor level offsets) ---
    // Desk Rug (around local desk: fx: 0.75, fy: -0.80)
    const deskRugPos = getIsometricPos(0.67, -0.72, width, height, panX, panY, zoom);
    ctx.fillStyle = 'rgba(67, 56, 202, 0.25)'; // Indigo Rug
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(deskRugPos.x, deskRugPos.y, 45 * zoom, 23 * zoom, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Sofa Rug (around local sofa: fx: -0.10, fy: 0.85)
    const sofaRugPos = getIsometricPos(-0.10, 0.85, width, height, panX, panY, zoom);
    ctx.fillStyle = 'rgba(219, 39, 119, 0.15)'; // Rose Magenta Rug
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.35)';
    ctx.beginPath();
    ctx.ellipse(sofaRugPos.x, sofaRugPos.y, 55 * zoom, 28 * zoom, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // --- 2. DRAW ALTERNATING RETRO FLOOR TILES (Filled Polygons) ---
    // Draw 14x14 enlarged block slate-stone layout from -1.4 to 1.4
    const divisions = 14;
    const step = 2.8 / divisions; // from -1.4 to 1.4

    for (let i = 0; i < divisions; i++) {
        for (let j = 0; j < divisions; j++) {
            const fx1 = -1.4 + i * step;
            const fy1 = -1.4 + j * step;
            const fx2 = fx1 + step;
            const fy2 = fy1 + step;

            // Compute corner isometric screen coordinates
            const p1 = getIsometricPos(fx1, fy1, width, height, panX, panY, zoom);
            const p2 = getIsometricPos(fx2, fy1, width, height, panX, panY, zoom);
            const p3 = getIsometricPos(fx2, fy2, width, height, panX, panY, zoom);
            const p4 = getIsometricPos(fx1, fy2, width, height, panX, panY, zoom);

            // Alternate colors for checkerboard look with cozy space tones
            const isDark = (i + j) % 2 === 0;
            ctx.fillStyle = isDark ? '#0b0c16' : '#0e101f';
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.fill();

            // Accent grid seams
            ctx.strokeStyle = '#16192d';
            ctx.lineWidth = 0.5 * zoom;
            ctx.stroke();
        }
    }

    // --- 2.5 DRAW HIGH-CONTRAST 3D NEON ISLAND PLATFORM BORDERS ---
    const frontLeftCorner = getIsometricPos(-1.4, 1.4, width, height, panX, panY, zoom);
    const leftEdgeBase = getIsometricPos(-1.4, -1.4, width, height, panX, panY, zoom);
    const rightEdgeBase = getIsometricPos(1.4, 1.4, width, height, panX, panY, zoom);

    // Deep structural physical base (dark slate extrusion downward for breathtaking 3D depth!)
    ctx.fillStyle = '#06070c';
    ctx.beginPath();
    ctx.moveTo(leftEdgeBase.x, leftEdgeBase.y);
    ctx.lineTo(frontLeftCorner.x, frontLeftCorner.y);
    ctx.lineTo(rightEdgeBase.x, rightEdgeBase.y);
    ctx.lineTo(rightEdgeBase.x, rightEdgeBase.y + 12 * zoom);
    ctx.lineTo(frontLeftCorner.x, frontLeftCorner.y + 12 * zoom);
    ctx.lineTo(leftEdgeBase.x, leftEdgeBase.y + 12 * zoom);
    ctx.closePath();
    ctx.fill();

    // 3D edge lines (shimmers)
    ctx.strokeStyle = '#1e1b4b'; // dark border outline for 3D depth
    ctx.lineWidth = 1 * zoom;
    ctx.beginPath();
    ctx.moveTo(leftEdgeBase.x, leftEdgeBase.y + 12 * zoom);
    ctx.lineTo(frontLeftCorner.x, frontLeftCorner.y + 12 * zoom);
    ctx.lineTo(rightEdgeBase.x, rightEdgeBase.y + 12 * zoom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(frontLeftCorner.x, frontLeftCorner.y);
    ctx.lineTo(frontLeftCorner.x, frontLeftCorner.y + 12 * zoom);
    ctx.stroke();

    // Glowing Neon Indigo running alongside the upper edges of the island
    ctx.strokeStyle = '#4f46e5'; // neon indigo line
    ctx.lineWidth = 3.5 * zoom;
    ctx.beginPath();
    ctx.moveTo(leftEdgeBase.x, leftEdgeBase.y);
    ctx.lineTo(frontLeftCorner.x, frontLeftCorner.y);
    ctx.lineTo(rightEdgeBase.x, rightEdgeBase.y);
    ctx.stroke();

    // Glowing Neon Hot Pink highlight line centered inside
    ctx.strokeStyle = '#ec4899'; // neon pink highlight
    ctx.lineWidth = 1.2 * zoom;
    ctx.beginPath();
    ctx.moveTo(leftEdgeBase.x, leftEdgeBase.y);
    ctx.lineTo(frontLeftCorner.x, frontLeftCorner.y);
    ctx.lineTo(rightEdgeBase.x, rightEdgeBase.y);
    ctx.stroke();

    // --- 3. DRAW HIGH CLASS INDIGO/CYBER BACK WALL PANELS ---
    // Back Left Wall: extends along fy = -1.4, fx variable from -1.4 to 1.4
    // Back Right Wall: extends along fx = 1.4, fy variable from -1.4 to 1.4
    const wallHeight = 140 * zoom;

    // Corner point (fx: 1.4, fy: -1.4)
    const cornerBase = getIsometricPos(1.4, -1.4, width, height, panX, panY, zoom);

    // Left Wall Segment
    ctx.fillStyle = '#0a0b12'; // Deep core shade
    ctx.beginPath();
    ctx.moveTo(leftEdgeBase.x, leftEdgeBase.y);
    ctx.lineTo(cornerBase.x, cornerBase.y);
    ctx.lineTo(cornerBase.x, cornerBase.y - wallHeight);
    ctx.lineTo(leftEdgeBase.x, leftEdgeBase.y - wallHeight);
    ctx.closePath();
    ctx.fill();

    // Right Wall Segment
    ctx.fillStyle = '#08090f'; // Slightly darker ambient side
    ctx.beginPath();
    ctx.moveTo(cornerBase.x, cornerBase.y);
    ctx.lineTo(rightEdgeBase.x, rightEdgeBase.y);
    ctx.lineTo(rightEdgeBase.x, rightEdgeBase.y - wallHeight);
    ctx.lineTo(cornerBase.x, cornerBase.y - wallHeight);
    ctx.closePath();
    ctx.fill();

    // Baseboard trims (neon pink/indigo line accent on wall borders)
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)'; // Indigo glowing LED line
    ctx.lineWidth = 3 * zoom;
    ctx.beginPath();
    ctx.moveTo(leftEdgeBase.x, leftEdgeBase.y - 4 * zoom);
    ctx.lineTo(cornerBase.x, cornerBase.y - 4 * zoom);
    ctx.lineTo(rightEdgeBase.x, rightEdgeBase.y - 4 * zoom);
    ctx.stroke();

    // Wall panels divider lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1 * zoom;
    const dividerCount = 5;
    for (let s = 1; s < dividerCount; s++) {
        const ratio = s / dividerCount;
        // Left wall dividers
        const lBase = {
            x: leftEdgeBase.x + (cornerBase.x - leftEdgeBase.x) * ratio,
            y: leftEdgeBase.y + (cornerBase.y - leftEdgeBase.y) * ratio
        };
        ctx.beginPath();
        ctx.moveTo(lBase.x, lBase.y);
        ctx.lineTo(lBase.x, lBase.y - wallHeight);
        ctx.stroke();

        // Right wall dividers
        const rBase = {
            x: cornerBase.x + (rightEdgeBase.x - cornerBase.x) * ratio,
            y: cornerBase.y + (rightEdgeBase.y - cornerBase.y) * ratio
        };
        ctx.beginPath();
        ctx.moveTo(rBase.x, rBase.y);
        ctx.lineTo(rBase.x, rBase.y - wallHeight);
        ctx.stroke();
    }

    // --- 4. DRAW COSMIC PARALLAX STAR WINDOWS ---
    // Let's place an elegant cyber-window on the Left Wall!
    const windowWidth = 80 * zoom;
    const windowH = 65 * zoom;
    const windowLeftX = leftEdgeBase.x + (cornerBase.x - leftEdgeBase.x) * 0.28;
    const windowLeftY = leftEdgeBase.y + (cornerBase.y - leftEdgeBase.y) * 0.28 - wallHeight * 0.72;

    ctx.save();
    // Blur ambient filter
    ctx.fillStyle = '#06070a';
    ctx.fillRect(windowLeftX - windowWidth / 2, windowLeftY, windowWidth, windowH);

    // Dynamic galaxy stars in window
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let s = 0; s < 8; s++) {
        const sx = windowLeftX - windowWidth / 2 + ((s * 37 + tick * 0.1) % windowWidth);
        const sy = windowLeftY + ((s * 19) % windowH);
        const sSize = Math.max(0.8, 1.5 * Math.sin((tick + s * 10) * 0.08)) * zoom;
        ctx.fillRect(sx, sy, sSize, sSize);
    }

    // Window glass gloss reflection effect
    ctx.fillStyle = 'rgba(236, 72, 153, 0.08)'; // Magenta nebula reflection
    ctx.beginPath();
    ctx.ellipse(windowLeftX, windowLeftY + windowH / 2, windowWidth * 0.45, windowH * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Window retro metal frames
    ctx.strokeStyle = '#27273f';
    ctx.lineWidth = 3.5 * zoom;
    ctx.strokeRect(windowLeftX - windowWidth / 2, windowLeftY, windowWidth, windowH);
    ctx.lineWidth = 1 * zoom;
    ctx.strokeRect(windowLeftX - windowWidth / 4, windowLeftY, windowWidth / 2, windowH);
    ctx.restore();

    // And another beautiful space window on the Right Wall!
    const windowRightX = cornerBase.x + (rightEdgeBase.x - cornerBase.x) * 0.42;
    const windowRightY = cornerBase.y + (rightEdgeBase.y - cornerBase.y) * 0.42 - wallHeight * 0.72;

    ctx.save();
    ctx.fillStyle = '#06070a';
    ctx.fillRect(windowRightX - windowWidth / 2, windowRightY, windowWidth, windowH);

    ctx.fillStyle = 'rgba(129, 140, 248, 0.9)'; // Nebula cyan/purple stars
    for (let s = 0; s < 8; s++) {
        const sx = windowRightX - windowWidth / 2 + ((s * 31 + tick * 0.08) % windowWidth);
        const sy = windowRightY + ((s * 23) % windowH);
        const sSize = Math.max(0.8, 1.3 * Math.sin((tick + s * 15) * 0.06)) * zoom;
        ctx.fillRect(sx, sy, sSize, sSize);
    }

    ctx.fillStyle = 'rgba(99, 102, 241, 0.08)'; // Blue starry glow
    ctx.beginPath();
    ctx.ellipse(windowRightX, windowRightY + windowH / 2, windowWidth * 0.45, windowH * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#27273f';
    ctx.lineWidth = 3.5 * zoom;
    ctx.strokeRect(windowRightX - windowWidth / 2, windowRightY, windowWidth, windowH);
    ctx.lineWidth = 1 * zoom;
    ctx.strokeRect(windowRightX - windowWidth / 4, windowRightY, windowWidth / 2, windowH);
    ctx.restore();

    // --- 5. DRAW GRADIENT CAST SPOTLIGHT ON HALL OF FAME & BEACONS ---
    // Goal Beacon center: fy: -0.55, fx: -0.40 (add beautiful radial glowing spotlight)
    const gbSpot = getIsometricPos(-0.40, -0.55, width, height, panX, panY, zoom);
    const gbGrad = ctx.createRadialGradient(gbSpot.x, gbSpot.y, 1, gbSpot.x, gbSpot.y, 40 * zoom);
    gbGrad.addColorStop(0, 'rgba(168, 85, 247, 0.15)');
    gbGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = gbGrad;
    ctx.beginPath();
    ctx.ellipse(gbSpot.x, gbSpot.y, 40 * zoom, 20 * zoom, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- 6. DRAW AMBIENT FLOATING MAGICAL EMBER PARTICLES ---
    embers.forEach(emb => {
        // Float upwards
        emb.height += emb.speed;
        if (emb.height > 100) {
            emb.height = 10;
            emb.fx = (Math.random() - 0.5) * 2.6;
            emb.fy = (Math.random() - 0.5) * 2.6;
        }

        const basePos = getIsometricPos(emb.fx, emb.fy, width, height, panX, panY, zoom);
        const floatY = basePos.y - emb.height * zoom;

        // Draw pixel glow particle
        ctx.fillStyle = emb.color;
        ctx.fillRect(basePos.x - emb.size * zoom / 2, floatY - emb.size * zoom / 2, emb.size * zoom, emb.size * zoom);

        // Tiny glowing core
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(basePos.x - (emb.size * 0.4) * zoom / 2, floatY - (emb.size * 0.4) * zoom / 2, (emb.size * 0.4) * zoom, (emb.size * 0.4) * zoom);
    });

    ctx.restore();
};
