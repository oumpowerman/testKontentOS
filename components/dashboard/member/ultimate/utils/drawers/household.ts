/**
 * Drawing functions for basic cozy household furniture on Canvas (Retro 8-bit Pixel Art)
 */

export const drawBed = (
    ctx: CanvasRenderingContext2D,
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // 1. Shadow underneath the bed
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 9 * pixelSize, 16 * pixelSize, 8 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Headboard (Behind the pillows)
    ctx.fillStyle = '#451a03'; // Deep wood shadow
    ctx.fillRect(-12 * pixelSize, -12 * pixelSize, 4 * pixelSize, 14 * pixelSize);
    ctx.fillStyle = '#78350f'; // Headboard panel
    ctx.fillRect(-12 * pixelSize, -16 * pixelSize, 3 * pixelSize, 4 * pixelSize);

    // 3. Wooden Bed Frame Base
    ctx.fillStyle = '#78350f'; // Warm brown wood
    ctx.fillRect(-10 * pixelSize, -2 * pixelSize, 22 * pixelSize, 8 * pixelSize); // side panel
    ctx.fillStyle = '#92400e'; // Top leg highlight
    ctx.fillRect(-10 * pixelSize, 6 * pixelSize, 2 * pixelSize, 2 * pixelSize); // back-left leg
    ctx.fillRect(10 * pixelSize, 6 * pixelSize, 2 * pixelSize, 2 * pixelSize); // front-right leg

    // 4. Clean Soft Mattress (Layered)
    ctx.fillStyle = '#e2e8f0'; // Cushion foam base
    ctx.fillRect(-10 * pixelSize, -5 * pixelSize, 21 * pixelSize, 5 * pixelSize);

    // 5. Fluffy Pillows (Two cozy white pillows against the headboard)
    ctx.fillStyle = '#f8fafc'; // Pure white pillows
    ctx.fillRect(-9 * pixelSize, -8 * pixelSize, 4 * pixelSize, 3 * pixelSize);
    ctx.fillRect(-9 * pixelSize, -4 * pixelSize, 4 * pixelSize, 3 * pixelSize);
    // Pillow shadows
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-5 * pixelSize, -8 * pixelSize, 1 * pixelSize, 3 * pixelSize);
    ctx.fillRect(-5 * pixelSize, -4 * pixelSize, 1 * pixelSize, 3 * pixelSize);

    // 6. Cozy Red Blanket (Draped over most of the bed)
    ctx.fillStyle = '#991b1b'; // Deep crimson warm blanket shadow
    ctx.fillRect(-3 * pixelSize, -5 * pixelSize, 14 * pixelSize, 10 * pixelSize);
    ctx.fillStyle = '#dc2626'; // Bright red blanket top
    ctx.fillRect(-2 * pixelSize, -5 * pixelSize, 13 * pixelSize, 9 * pixelSize);

    // Blanket decorative stripe (gold)
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(4 * pixelSize, -5 * pixelSize, 1.5 * pixelSize, 10 * pixelSize);

    // Breathing or snug animation for a sleep vibe nearby (Zz particles sometimes)
    if (tick % 180 < 60) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '6px sans-serif';
        const zOffset = (tick % 60) * 0.1 * pixelSize;
        ctx.fillText('z', 6 * pixelSize, -10 * pixelSize - zOffset);
    }
};

export const drawTelevision = (
    ctx: CanvasRenderingContext2D,
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // 1. Shadow Base
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 10 * pixelSize, 12 * pixelSize, 5 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Retro Walnut Wooden TV Console Stand
    ctx.fillStyle = '#451a03'; // Deep walnut shadow
    ctx.fillRect(-10 * pixelSize, 3 * pixelSize, 20 * pixelSize, 7 * pixelSize);
    ctx.fillStyle = '#78350f'; // Main drawer wood
    ctx.fillRect(-9 * pixelSize, 3 * pixelSize, 18 * pixelSize, 6 * pixelSize);

    // Golden console knobs
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-5 * pixelSize, 5 * pixelSize, 1 * pixelSize, 1.5 * pixelSize);
    ctx.fillRect(4 * pixelSize, 5 * pixelSize, 1 * pixelSize, 1.5 * pixelSize);

    // Shelf hollow opening
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-3 * pixelSize, 4 * pixelSize, 6 * pixelSize, 4 * pixelSize);

    // 3. The Classic CRT Television Cabinet
    ctx.fillStyle = '#57534e'; // Stone dark gray plastic/wood chassis
    ctx.fillRect(-7 * pixelSize, -11 * pixelSize, 14 * pixelSize, 14 * pixelSize);
    
    // Front screen bevel framing
    ctx.fillStyle = '#292524'; // Inner dark screen bezel
    ctx.fillRect(-6 * pixelSize, -10 * pixelSize, 12 * pixelSize, 12 * pixelSize);

    // CRT Screen Glass (Glowing animated retro cybernetic static)
    // Create random static colors
    const staticStyles = ['#1e1b4b', '#312e81', '#4338ca', '#2563eb'];
    const staticIndex = Math.floor((tick * 0.1) % staticStyles.length);
    ctx.fillStyle = staticStyles[staticIndex];
    ctx.fillRect(-5 * pixelSize, -9 * pixelSize, 8 * pixelSize, 10 * pixelSize);

    // Screen scanlines overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let r = -9; r < 1; r += 2) {
        ctx.fillRect(-5 * pixelSize, r * pixelSize, 8 * pixelSize, 0.7 * pixelSize);
    }

    // Glowing spark / dial indicator
    ctx.fillStyle = '#10b981'; // Green indicator LED dot
    ctx.fillRect(4 * pixelSize, -2 * pixelSize, 1.2 * pixelSize, 1.2 * pixelSize);
    ctx.fillStyle = '#292524'; // Knobs dial
    ctx.fillRect(4 * pixelSize, -7 * pixelSize, 1 * pixelSize, 1.5 * pixelSize);
    ctx.fillRect(4 * pixelSize, -5 * pixelSize, 1 * pixelSize, 1.5 * pixelSize);

    // 4. TV Rabbit-Ears Antennas
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-2 * pixelSize, -11 * pixelSize);
    ctx.lineTo(-6 * pixelSize, -18 * pixelSize); // Antenna Left
    ctx.moveTo(2 * pixelSize, -11 * pixelSize);
    ctx.lineTo(6 * pixelSize, -18 * pixelSize); // Antenna Right
    ctx.stroke();

    // Tips of antenna
    ctx.fillStyle = '#f43f5e'; // red tips
    ctx.beginPath();
    ctx.arc(-6 * pixelSize, -18 * pixelSize, 1 * pixelSize, 0, Math.PI * 2);
    ctx.arc(6 * pixelSize, -18 * pixelSize, 1 * pixelSize, 0, Math.PI * 2);
    ctx.fill();
};

export const drawDiningTable = (
    ctx: CanvasRenderingContext2D,
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // 1. Ambient Floor Shadows
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 9 * pixelSize, 15 * pixelSize, 6 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Left Retro Wooden Chair
    ctx.fillStyle = '#451a03'; // deep shade
    ctx.fillRect(-10 * pixelSize, -3 * pixelSize, 3 * pixelSize, 10 * pixelSize); // chair back frame
    ctx.fillRect(-10 * pixelSize, 1 * pixelSize, 5 * pixelSize, 2 * pixelSize);  // seat
    ctx.fillRect(-8 * pixelSize, 3 * pixelSize, 1.5 * pixelSize, 5 * pixelSize); // seat leg front

    // 3. Right Retro Wooden Chair
    ctx.fillStyle = '#451a03';
    ctx.fillRect(7 * pixelSize, -3 * pixelSize, 3 * pixelSize, 10 * pixelSize); // chair back frame
    ctx.fillRect(5 * pixelSize, 1 * pixelSize, 5 * pixelSize, 2 * pixelSize);  // seat
    ctx.fillRect(6.5 * pixelSize, 3 * pixelSize, 1.5 * pixelSize, 5 * pixelSize); // seat leg front

    // 4. Main Dining Table Frame
    ctx.fillStyle = '#78350f'; // Warm oak legs
    ctx.fillRect(-5 * pixelSize, 0 * pixelSize, 2 * pixelSize, 8 * pixelSize);  // left leg
    ctx.fillRect(3 * pixelSize, 0 * pixelSize, 2 * pixelSize, 8 * pixelSize);   // right leg

    // Tabletop
    ctx.fillStyle = '#92400e'; // Rich wood tabletop
    ctx.fillRect(-7 * pixelSize, -3 * pixelSize, 14 * pixelSize, 4 * pixelSize);
    ctx.fillStyle = '#b45309'; // Surface highlights
    ctx.fillRect(-6.5 * pixelSize, -3 * pixelSize, 13 * pixelSize, 1 * pixelSize);

    // 5. Hot Steaming Mug of Coffee/Tea on Table (animated vapor)
    ctx.fillStyle = '#cbd5e1'; // Ceramic light gray mug
    ctx.fillRect(-1 * pixelSize, -5 * pixelSize, 2 * pixelSize, 2 * pixelSize);
    ctx.fillStyle = '#92400e'; // Caramel hot coffee inside surface
    ctx.fillRect(-0.6 * pixelSize, -5.2 * pixelSize, 1.2 * pixelSize, 0.5 * pixelSize);
    
    // Coffee cup handle
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(1.1 * pixelSize, -4 * pixelSize, 0.6 * pixelSize, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    // Gentle rising vapor curls (animated steam!)
    const steamSeed = [
        { dx: -0.5, dy: -5.8, tOffset: 0 },
        { dx: 0.5, dy: -6.5, tOffset: 25 },
        { dx: -0.2, dy: -7.5, tOffset: 50 }
    ];

    steamSeed.forEach((s, idx) => {
        const cycle = (tick + s.tOffset) % 60;
        const rise = cycle * 0.1 * pixelSize;
        const wave = Math.sin(tick * 0.08 + idx) * 0.8 * pixelSize;

        const sx = s.dx * pixelSize + wave;
        const sy = s.dy * pixelSize - rise;
        const opacity = Math.max(0, 0.6 - cycle / 60);

        if (opacity > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = opacity;
            ctx.fillRect(sx, sy, 0.8 * pixelSize, 0.8 * pixelSize);
        }
    });

    ctx.globalAlpha = 1.0; // Reset
};

export const drawWardrobe = (
    ctx: CanvasRenderingContext2D,
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // 1. Base Shadow
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 10 * pixelSize, 11 * pixelSize, 4.5 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Oak Wood Cabinet Chassis
    ctx.fillStyle = '#451a03'; // deep wood backplate/edges shadow
    ctx.fillRect(-8 * pixelSize, -20 * pixelSize, 16 * pixelSize, 29 * pixelSize);

    ctx.fillStyle = '#78350f'; // Warm oak doors/sides panels
    ctx.fillRect(-7 * pixelSize, -20 * pixelSize, 14 * pixelSize, 28 * pixelSize);

    // Decorative molding top lintel
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-9 * pixelSize, -22 * pixelSize, 18 * pixelSize, 2.5 * pixelSize);
    ctx.fillStyle = '#b45309'; // bright lintel highlights
    ctx.fillRect(-8 * pixelSize, -22 * pixelSize, 16 * pixelSize, 1 * pixelSize);

    // Center Door Split seam (black groove)
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-0.5 * pixelSize, -20 * pixelSize, 1 * pixelSize, 28 * pixelSize);

    // 3. Golden Handles
    ctx.fillStyle = '#fbbf24'; // Brass/gold handles sparkling
    ctx.fillRect(-1.8 * pixelSize, -6 * pixelSize, 1 * pixelSize, 3 * pixelSize);
    ctx.fillRect(0.8 * pixelSize, -6 * pixelSize, 1 * pixelSize, 3 * pixelSize);

    // Drawer at the bottom
    ctx.fillStyle = '#572205'; // drawer groove border
    ctx.fillRect(-6 * pixelSize, 4 * pixelSize, 12 * pixelSize, 3 * pixelSize);
    ctx.fillStyle = '#92400e'; // drawer head
    ctx.fillRect(-5.5 * pixelSize, 4.5 * pixelSize, 11 * pixelSize, 2 * pixelSize);

    ctx.fillStyle = '#fbbf24'; // Drawer golden knob center
    ctx.fillRect(-0.5 * pixelSize, 5 * pixelSize, 1 * pixelSize, 1 * pixelSize);
};
