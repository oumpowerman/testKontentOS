/**
 * Plants rendering function for clay pot plants on Canvas
 */
export const drawPlants = (
    ctx: CanvasRenderingContext2D,
    type: 'PLANT_1' | 'PLANT_2',
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // Shadow base
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 9 * pixelSize, 8 * pixelSize, 4 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // Clay pot
    ctx.fillStyle = '#b45309'; // Shadow side
    ctx.fillRect(-4 * pixelSize, 3 * pixelSize, 8 * pixelSize, 6 * pixelSize);
    ctx.fillStyle = '#f59e0b'; // Light side
    ctx.fillRect(-4 * pixelSize, 3 * pixelSize, 4 * pixelSize, 6 * pixelSize);

    // Rim
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-5 * pixelSize, 2 * pixelSize, 10 * pixelSize, 1.5 * pixelSize);

    // Sprouting plant foliage with layered translucent shadows
    ctx.fillStyle = '#065f46'; // dark leaves background
    ctx.beginPath();
    ctx.arc(-2 * pixelSize, -1 * pixelSize, 4.5 * pixelSize, 0, Math.PI * 2);
    ctx.arc(3 * pixelSize, -2 * pixelSize, 5 * pixelSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981'; // vibrant front leaves
    ctx.beginPath();
    ctx.arc(0, -5 * pixelSize, 4 * pixelSize, 0, Math.PI * 2);
    ctx.arc(-3 * pixelSize, -3 * pixelSize, 4 * pixelSize, 0, Math.PI * 2);
    ctx.arc(3 * pixelSize, -3 * pixelSize, 4 * pixelSize, 0, Math.PI * 2);
    ctx.fill();

    // Shimmering star on the leaves to give magical charm (PLANT_1 only)
    if (type === 'PLANT_1') {
        ctx.fillStyle = '#a7f3d0';
        ctx.fillRect(1 * pixelSize, -6 * pixelSize, 1 * pixelSize, 1 * pixelSize);
        ctx.fillRect(-2 * pixelSize, -2 * pixelSize, 1 * pixelSize, 1 * pixelSize);
    }
};
