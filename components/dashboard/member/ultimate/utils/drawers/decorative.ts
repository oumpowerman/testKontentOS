/**
 * Drawing functions for special RPG decorative elements on Canvas (Retro 8-bit Pixel Art)
 */

export const drawCauldron = (
    ctx: CanvasRenderingContext2D,
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // Shadow base
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 9 * pixelSize, 11 * pixelSize, 5 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Cauldron metal legs support (3 legs)
    ctx.fillStyle = '#1e293b'; // Slate dark metal
    ctx.fillRect(-6 * pixelSize, 4 * pixelSize, 2 * pixelSize, 5 * pixelSize);
    ctx.fillRect(4 * pixelSize, 4 * pixelSize, 2 * pixelSize, 5 * pixelSize);
    ctx.fillRect(-1 * pixelSize, 5 * pixelSize, 2 * pixelSize, 4 * pixelSize);

    // 2. Bulbous cauldron body
    ctx.fillStyle = '#334155'; // Lighter slate for body
    ctx.beginPath();
    ctx.arc(0, 0, 8 * pixelSize, 0, Math.PI * 2);
    ctx.fill();

    // Body shadow shading side
    ctx.fillStyle = '#0f172a'; // Deep slate shadow
    ctx.beginPath();
    ctx.arc(0, 0, 8 * pixelSize, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b'; // Mid shade inside shadow
    ctx.beginPath();
    ctx.arc(0, 0, 8 * pixelSize, Math.PI / 3, 3 * Math.PI / 4);
    ctx.fill();

    // 3. Lip Rim of cauldron
    ctx.fillStyle = '#475569'; // Rim highlight
    ctx.fillRect(-7 * pixelSize, -8 * pixelSize, 14 * pixelSize, 2 * pixelSize);
    ctx.fillStyle = '#1e293b'; // Rim shadow
    ctx.fillRect(0, -8 * pixelSize, 7 * pixelSize, 2 * pixelSize);

    // 4. Boiling Magic Fluid (emerald green)
    ctx.fillStyle = '#059669'; // Dark emerald base fluid
    ctx.fillRect(-5 * pixelSize, -7 * pixelSize, 10 * pixelSize, 1.5 * pixelSize);
    ctx.fillStyle = '#10b981'; // Lighter green core
    ctx.fillRect(-3 * pixelSize, -7 * pixelSize, 6 * pixelSize, 1 * pixelSize);

    // 5. Dynamic rising glowing potion bubbles
    const bubbleSeed = [
        { ox: -3, oy: -9, tOffset: 0, sz: 1.6, col: '#34d399' },
        { ox: 1, oy: -11, tOffset: 20, sz: 2.2, col: '#a7f3d0' },
        { ox: 4, oy: -8, tOffset: 45, sz: 1.2, col: '#059669' },
        { ox: -1, oy: -14, tOffset: 65, sz: 1.8, col: '#6ee7b7' }
    ];

    bubbleSeed.forEach((b, idx) => {
        // Move bubble vertically using cyclicity
        const cycle = (tick + b.tOffset) % 80;
        const speedFactor = 0.15;
        const driftY = cycle * speedFactor * pixelSize;
        const floatX = Math.sin(tick * 0.05 + idx * 1.5) * 2 * pixelSize;

        const bx = b.ox * pixelSize + floatX;
        const by = b.oy * pixelSize - driftY;

        // Fade out as it rises near the top
        const opacity = Math.max(0, 1 - cycle / 80);
        if (opacity > 0) {
            ctx.fillStyle = b.col;
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(bx, by, b.sz * pixelSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Tiny glow sparkle core for the largest bubble
            if (b.sz > 2.0 && opacity > 0.4) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(bx - 0.5 * pixelSize, by - 0.5 * pixelSize, 1 * pixelSize, 1 * pixelSize);
            }
        }
    });
    ctx.globalAlpha = 1.0; // Reset
};

export const drawCatBed = (
    ctx: CanvasRenderingContext2D,
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // Cushion shadow base
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 9 * pixelSize, 12 * pixelSize, 6 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Cozy Woolen Soft Cushion (Indiglo/Purple outer)
    ctx.fillStyle = '#581c87'; // Deep violet shadow
    ctx.beginPath();
    ctx.ellipse(0, 5 * pixelSize, 11 * pixelSize, 5 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lighter upper cushion rim
    ctx.fillStyle = '#7e22ce'; // Purple ring rim
    ctx.beginPath();
    ctx.ellipse(0, 4 * pixelSize, 11 * pixelSize, 4 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#a855f7'; // Light pinkish purple core hollow
    ctx.beginPath();
    ctx.ellipse(0, 4.5 * pixelSize, 8 * pixelSize, 3 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Sleeping Magic Black Cat (Curled beautifully in center)
    // Breathing scale animation
    const breath = Math.sin(tick * 0.04) * 0.45;
    const catY = 2.5 * pixelSize;
    const catRadiusX = (6 + breath) * pixelSize;
    const catRadiusY = (3.5 + breath * 0.4) * pixelSize;

    // Drawing curled ball cat body
    ctx.fillStyle = '#090d16'; // Deep charcoal black fur
    ctx.beginPath();
    ctx.ellipse(0, catY, catRadiusX, catRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Round head
    const headX = -2 * pixelSize;
    const headY = 1 * pixelSize;
    ctx.beginPath();
    ctx.arc(headX, headY, 3 * pixelSize, 0, Math.PI * 2);
    ctx.fill();

    // Cat pointed ears (pink tips)
    ctx.fillStyle = '#090d16'; // Outer ear left
    ctx.beginPath();
    ctx.moveTo(headX - 2.5 * pixelSize, headY - 1 * pixelSize);
    ctx.lineTo(headX - 1.5 * pixelSize, headY - 5 * pixelSize);
    ctx.lineTo(headX - 0.5 * pixelSize, headY - 1.5 * pixelSize);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#fda4af'; // Pink inner left
    ctx.beginPath();
    ctx.moveTo(headX - 2 * pixelSize, headY - 1.5 * pixelSize);
    ctx.lineTo(headX - 1.5 * pixelSize, headY - 4 * pixelSize);
    ctx.lineTo(headX - 1 * pixelSize, headY - 1.8 * pixelSize);
    ctx.closePath();
    ctx.fill();

    // Sleeping peaceful eye lines (tiny curved lines)
    ctx.strokeStyle = '#fef08a'; // Glowing yellow sleeping slivers of light
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(headX - 1 * pixelSize, headY + 0.5 * pixelSize, 0.7 * pixelSize, 0.1, Math.PI - 0.1);
    ctx.stroke();

    // Cat curly tail wrapped around
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.ellipse(3 * pixelSize, 3 * pixelSize, 1.5 * pixelSize, 3 * pixelSize, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Zzzz floating sleeping particles
    if (tick % 150 < 75) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '7px sans-serif';
        const zOffset = (tick % 75) * 0.15 * pixelSize;
        ctx.fillText('z', -8 * pixelSize - (tick % 5), -2 * pixelSize - zOffset);
    }
};

export const drawStellarGlobe = (
    ctx: CanvasRenderingContext2D,
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // Shadow
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 9 * pixelSize, 9 * pixelSize, 4 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Ornate Golden Victorian Tripod Stand
    ctx.fillStyle = '#78350f'; // Dark bronze/gold shadow pod
    ctx.fillRect(-5 * pixelSize, 5 * pixelSize, 10 * pixelSize, 2 * pixelSize);
    ctx.fillRect(-1.5 * pixelSize, 5 * pixelSize, 3 * pixelSize, 4 * pixelSize); // center pole
    
    // Curved support arms
    ctx.strokeStyle = '#d97706'; // Golden rim wire frame
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 6 * pixelSize, 0, Math.PI, false); // Half circle gold cradle
    ctx.stroke();

    // Gold pedestal feet
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-6 * pixelSize, 7 * pixelSize, 2 * pixelSize, 2 * pixelSize);
    ctx.fillRect(4 * pixelSize, 7 * pixelSize, 2 * pixelSize, 2 * pixelSize);

    // 2. Cosmic Bobbing Nebula Sphere (Center element floating up/down)
    const bob = Math.sin(tick * 0.06) * 1.5 * pixelSize;
    const centerGlobeX = 0;
    const centerGlobeY = -2 * pixelSize + bob;

    // Glowing nebula backdrop blur ring
    const radGrd = ctx.createRadialGradient(centerGlobeX, centerGlobeY, 1, centerGlobeX, centerGlobeY, 8 * pixelSize);
    radGrd.addColorStop(0, 'rgba(99, 102, 241, 0.45)');
    radGrd.addColorStop(0.5, 'rgba(236, 72, 153, 0.15)');
    radGrd.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGrd;
    ctx.beginPath();
    ctx.arc(centerGlobeX, centerGlobeY, 8 * pixelSize, 0, Math.PI * 2);
    ctx.fill();

    // Actual physical core glass sphere
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'; // Dark starry core
    ctx.beginPath();
    ctx.arc(centerGlobeX, centerGlobeY, 4.5 * pixelSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f472b6'; // Glowing fuchsia astral equator ring
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(centerGlobeX, centerGlobeY + 0.5 * pixelSize, 6 * pixelSize, 1.8 * pixelSize, 0.25, 0, Math.PI * 2);
    ctx.stroke();

    // Glittery core sparks
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(centerGlobeX - 1.5 * pixelSize, centerGlobeY - 1 * pixelSize, 1 * pixelSize, 1 * pixelSize);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(centerGlobeX + 0.5 * pixelSize, centerGlobeY + 1 * pixelSize, 1 * pixelSize, 1 * pixelSize);
};

export const drawMagicWell = (
    ctx: CanvasRenderingContext2D,
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // Shadow Base
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 10 * pixelSize, 14 * pixelSize, 6.5 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Cobblestone circular walling (Bricks styled as layered rings)
    ctx.fillStyle = '#1e293b'; // Slate stone shadow
    ctx.fillRect(-11 * pixelSize, -2 * pixelSize, 22 * pixelSize, 11 * pixelSize);

    ctx.fillStyle = '#334155'; // Front bright wall block
    ctx.fillRect(-10 * pixelSize, -1 * pixelSize, 10 * pixelSize, 10 * pixelSize);

    // Decorative copper band around well
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-11 * pixelSize, 3 * pixelSize, 22 * pixelSize, 2 * pixelSize);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-10 * pixelSize, 3 * pixelSize, 10 * pixelSize, 2 * pixelSize);

    // Individual brick seams (pixelated slits)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6 * pixelSize, -1 * pixelSize, 1 * pixelSize, 4 * pixelSize);
    ctx.fillRect(1 * pixelSize, -1 * pixelSize, 1 * pixelSize, 4 * pixelSize);
    ctx.fillRect(-3 * pixelSize, 5 * pixelSize, 1 * pixelSize, 4 * pixelSize);
    ctx.fillRect(5 * pixelSize, 5 * pixelSize, 1 * pixelSize, 4 * pixelSize);

    // Rounded lip of the well opening (isometric shape)
    ctx.restore();
    ctx.save();
    ctx.translate(0, 0); // Re-locate relative to original canvas shift
    
    ctx.fillStyle = '#475569'; // light masonry stone top
    ctx.beginPath();
    ctx.ellipse(0, -2 * pixelSize, 11 * pixelSize, 4.5 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Liquid Glowing water pool (translucent magical azure)
    ctx.fillStyle = '#0369a1'; // Deep aquatic blue
    ctx.beginPath();
    ctx.ellipse(0, -2.5 * pixelSize, 9 * pixelSize, 3.5 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing core gradient
    const waterGrd = ctx.createRadialGradient(0, -3 * pixelSize, 1, 0, -3 * pixelSize, 6 * pixelSize);
    waterGrd.addColorStop(0, 'rgba(56, 189, 248, 0.85)'); // Cyan heart
    waterGrd.addColorStop(1, 'rgba(3, 105, 161, 0.3)');
    ctx.fillStyle = waterGrd;
    ctx.beginPath();
    ctx.ellipse(0, -2.5 * pixelSize, 8.5 * pixelSize, 3 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Central floating focus crystals (Spike of glass floating above)
    const floatHeight = Math.sin(tick * 0.075) * 2 * pixelSize;
    const cryX = 0;
    const cryY = -12 * pixelSize + floatHeight;

    // Glowing cyan cone crystal (drawn manually with polygon coordinates)
    ctx.fillStyle = '#38bdf8'; // Crystal main body (light cyan)
    ctx.beginPath();
    ctx.moveTo(cryX, cryY - 6 * pixelSize); // Top tip
    ctx.lineTo(cryX + 2.5 * pixelSize, cryY); // Right point
    ctx.lineTo(cryX, cryY + 4 * pixelSize); // Bottom tip
    ctx.lineTo(cryX - 2.5 * pixelSize, cryY); // Left point
    ctx.closePath();
    ctx.fill();

    // Highlight face
    ctx.fillStyle = '#e0f2fe'; // Ice-white side
    ctx.beginPath();
    ctx.moveTo(cryX, cryY - 6 * pixelSize);
    ctx.lineTo(cryX, cryY + 4 * pixelSize);
    ctx.lineTo(cryX - 2.5 * pixelSize, cryY);
    ctx.closePath();
    ctx.fill();

    // Tiny magical pixel dust splashing upwards from pool
    const particles = [
        { dx: -5, dy: -6, offset: 0 },
        { dx: 4, dy: -5, offset: 25 },
        { dx: -1, dy: -10, offset: 45 },
        { dx: 6, dy: -8, offset: 60 }
    ];

    particles.forEach((p, index) => {
        const cycle = (tick + p.offset) % 64;
        const riseNum = cycle * 0.15 * pixelSize;
        const floatX = Math.sin(tick * 0.1 + index) * pixelSize;

        const px = p.dx * pixelSize + floatX;
        const py = -3 * pixelSize - riseNum;
        const size = Math.max(0.6, 1.4 * (1 - cycle / 64)) * pixelSize;

        if (cycle < 60) {
            ctx.fillStyle = index % 2 === 0 ? '#38bdf8' : '#7dd3fc';
            ctx.globalAlpha = 1 - cycle / 64;
            ctx.fillRect(px - size / 2, py - size / 2, size, size);
        }
    });
    ctx.globalAlpha = 1.0;
};
