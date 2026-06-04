/**
 * Sofa rendering function for cozy retro 3D Isometric sofas on Canvas
 */
export const drawSofa = (
    ctx: CanvasRenderingContext2D,
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // 1. Long Wide soft Shadow under base cushions
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 10 * pixelSize, 32 * pixelSize, 14 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Base Wooden Feet
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-22 * pixelSize, 9 * pixelSize, 3 * pixelSize, 3 * pixelSize);
    ctx.fillRect(19 * pixelSize, 9 * pixelSize, 3 * pixelSize, 3 * pixelSize);
    ctx.fillRect(0, 10 * pixelSize, 3 * pixelSize, 3 * pixelSize);

    // 3. Isometric Thick Backrest block
    ctx.fillStyle = '#7f1d1d'; // Shadow backside
    ctx.beginPath();
    ctx.moveTo(-26 * pixelSize, -8 * pixelSize);
    ctx.lineTo(24 * pixelSize, -16 * pixelSize);
    ctx.lineTo(24 * pixelSize, 0);
    ctx.lineTo(-26 * pixelSize, 8 * pixelSize);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#991b1b'; // Mid-tone backrest top rim
    ctx.beginPath();
    ctx.moveTo(-26 * pixelSize, -8 * pixelSize);
    ctx.lineTo(24 * pixelSize, -16 * pixelSize);
    ctx.lineTo(24 * pixelSize, -11 * pixelSize);
    ctx.lineTo(-26 * pixelSize, -3 * pixelSize);
    ctx.closePath();
    ctx.fill();

    // 4. Plump seat cushions
    ctx.fillStyle = '#ef4444'; // Bright warm coral red
    ctx.beginPath();
    ctx.moveTo(-23 * pixelSize, -1 * pixelSize);
    ctx.lineTo(21 * pixelSize, -9 * pixelSize);
    ctx.lineTo(21 * pixelSize, 7 * pixelSize);
    ctx.lineTo(-23 * pixelSize, 15 * pixelSize);
    ctx.closePath();
    ctx.fill();

    // Double cushion division stripe
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(-1 * pixelSize, -5 * pixelSize);
    ctx.lineTo(-1 * pixelSize, 11 * pixelSize);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#991b1b';
    ctx.stroke();

    // 5. Left and Right Massive padded Armrests (3D boxes)
    // Left armrest
    ctx.fillStyle = '#be123c';
    ctx.fillRect(-28 * pixelSize, 2 * pixelSize, 5 * pixelSize, 11 * pixelSize);
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(-28 * pixelSize, -2 * pixelSize, 5 * pixelSize, 4 * pixelSize);
    
    // Right armrest
    ctx.fillStyle = '#9f1239';
    ctx.fillRect(23 * pixelSize, -6 * pixelSize, 5 * pixelSize, 11 * pixelSize);
    ctx.fillStyle = '#be123c';
    ctx.fillRect(23 * pixelSize, -10 * pixelSize, 5 * pixelSize, 4 * pixelSize);

    // 6. Cute decorative wizard yellow spirit pillows
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-17 * pixelSize, -2 * pixelSize, 5 * pixelSize, 5 * pixelSize);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-16 * pixelSize, -3 * pixelSize, 4 * pixelSize, 4 * pixelSize);

    ctx.fillStyle = '#d97706';
    ctx.fillRect(12 * pixelSize, -7 * pixelSize, 5 * pixelSize, 5 * pixelSize);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(13 * pixelSize, -8 * pixelSize, 4 * pixelSize, 4 * pixelSize);
};
