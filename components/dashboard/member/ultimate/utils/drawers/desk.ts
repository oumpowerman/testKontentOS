/**
 * Desk rendering function for elegant retro 3D Isometric desks on Canvas
 */
export const drawDesk = (
    ctx: CanvasRenderingContext2D,
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // 1. Solid Floor Shadow (Ambient Occlusion)
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 8 * pixelSize, 24 * pixelSize, 12 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Pillars/Legs (4 solid cylindrical support structures in isometric spacing)
    // Back Left leg
    ctx.fillStyle = '#1c0d02';
    ctx.fillRect(-15 * pixelSize, -3 * pixelSize, 3 * pixelSize, 11 * pixelSize);
    // Back Right leg
    ctx.fillRect(12 * pixelSize, -3 * pixelSize, 3 * pixelSize, 11 * pixelSize);
    // Front Left leg
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-12 * pixelSize, 3 * pixelSize, 3 * pixelSize, 11 * pixelSize);
    // Front Right leg
    ctx.fillStyle = '#78350f';
    ctx.fillRect(9 * pixelSize, 3 * pixelSize, 3 * pixelSize, 11 * pixelSize);

    // 3. Desk Top Wooden Slab (Isometric projection cuboid)
    // Front edges thicknesses (3D depth rim)
    ctx.fillStyle = '#512e16'; // left thickness face
    ctx.beginPath();
    ctx.moveTo(-18 * pixelSize, -4 * pixelSize);
    ctx.lineTo(0, 5 * pixelSize);
    ctx.lineTo(0, 9 * pixelSize);
    ctx.lineTo(-18 * pixelSize, 0 * pixelSize);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#381c0c'; // right thickness face
    ctx.beginPath();
    ctx.moveTo(0, 5 * pixelSize);
    ctx.lineTo(18 * pixelSize, -4 * pixelSize);
    ctx.lineTo(18 * pixelSize, 0 * pixelSize);
    ctx.lineTo(0, 9 * pixelSize);
    ctx.closePath();
    ctx.fill();

    // Top Slab surface diamond
    ctx.fillStyle = '#834c24'; // main oak
    ctx.beginPath();
    ctx.moveTo(0, -13 * pixelSize); // far back
    ctx.lineTo(18 * pixelSize, -4 * pixelSize); // far right
    ctx.lineTo(0, 5 * pixelSize); // far front
    ctx.lineTo(-18 * pixelSize, -4 * pixelSize); // far left
    ctx.closePath();
    ctx.fill();

    // Highlight stripe on wood grain
    ctx.fillStyle = '#a1622f';
    ctx.beginPath();
    ctx.moveTo(-10 * pixelSize, -5 * pixelSize);
    ctx.lineTo(2 * pixelSize, 1 * pixelSize);
    ctx.lineTo(12 * pixelSize, -4 * pixelSize);
    ctx.lineTo(0 * pixelSize, -10 * pixelSize);
    ctx.closePath();
    ctx.fill();

    // 4. Smart Computer Monolith (Isometric Terminal screen)
    // Stand base & mount
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(2 * pixelSize, -6 * pixelSize, 5 * pixelSize, 1 * pixelSize);
    ctx.fillStyle = '#334155';
    ctx.fillRect(4 * pixelSize, -8 * pixelSize, 2 * pixelSize, 2 * pixelSize);

    // Screen bezel (isometric offset)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(1 * pixelSize, -15 * pixelSize);
    ctx.lineTo(11 * pixelSize, -10 * pixelSize);
    ctx.lineTo(11 * pixelSize, -5 * pixelSize);
    ctx.lineTo(1 * pixelSize, -10 * pixelSize);
    ctx.closePath();
    ctx.fill();

    // Glowing virtual display terminal
    ctx.fillStyle = '#059669'; // terminal deep emerald
    ctx.beginPath();
    ctx.moveTo(2 * pixelSize, -14 * pixelSize);
    ctx.lineTo(10 * pixelSize, -10 * pixelSize);
    ctx.lineTo(10 * pixelSize, -6 * pixelSize);
    ctx.lineTo(2 * pixelSize, -10 * pixelSize);
    ctx.closePath();
    ctx.fill();

    // Screen code lights
    ctx.fillStyle = '#a7f3d0';
    ctx.fillRect(4 * pixelSize, -11 * pixelSize, 4 * pixelSize, 1 * pixelSize);
    ctx.fillRect(3 * pixelSize, -9 * pixelSize, 5 * pixelSize, 1 * pixelSize);

    // 5. Retro Spell Lamp setup
    ctx.fillStyle = '#334155';
    ctx.fillRect(-12 * pixelSize, -10 * pixelSize, 1 * pixelSize, 6 * pixelSize); // stem
    ctx.fillStyle = '#bfdbfe'; // base socket
    ctx.fillRect(-13 * pixelSize, -4 * pixelSize, 3 * pixelSize, 1 * pixelSize);
    
    ctx.fillStyle = '#ec4899'; // glowing magenta wizard bulb
    ctx.fillRect(-13.5 * pixelSize, -12 * pixelSize, 4 * pixelSize, 3 * pixelSize);

    // Illuminative atmospheric magic cone
    const lampGradient = ctx.createLinearGradient(-11 * pixelSize, -11 * pixelSize, -16 * pixelSize, 10 * pixelSize);
    lampGradient.addColorStop(0, 'rgba(236, 72, 153, 0.35)');
    lampGradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = lampGradient;
    ctx.beginPath();
    ctx.moveTo(-11.5 * pixelSize, -11 * pixelSize);
    ctx.lineTo(-24 * pixelSize, 12 * pixelSize);
    ctx.lineTo(-2 * pixelSize, 12 * pixelSize);
    ctx.closePath();
    ctx.fill();
};
