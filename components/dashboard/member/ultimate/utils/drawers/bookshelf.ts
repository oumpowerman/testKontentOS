/**
 * Bookshelf rendering function for high-detailed retro 3D Isometric bookshelves on Canvas
 */
export const drawBookshelf = (
    ctx: CanvasRenderingContext2D,
    pixelSize: number,
    tick: number,
    ambientShadow: string
) => {
    // 1. Solid rectangular base ground shadow
    ctx.fillStyle = ambientShadow;
    ctx.beginPath();
    ctx.ellipse(0, 11 * pixelSize, 16 * pixelSize, 7 * pixelSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Heavy Mahogany wood frame
    ctx.fillStyle = '#270e01'; // Dark interior shadow
    ctx.fillRect(-14 * pixelSize, -28 * pixelSize, 28 * pixelSize, 38 * pixelSize);

    // Highlight side panel
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-14 * pixelSize, -28 * pixelSize, 3 * pixelSize, 38 * pixelSize);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(11 * pixelSize, -28 * pixelSize, 3 * pixelSize, 38 * pixelSize);

    // Top Crown crown molding
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-15 * pixelSize, -30 * pixelSize, 30 * pixelSize, 3 * pixelSize);

    // 3. Level Shelves with depth
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-11 * pixelSize, -14 * pixelSize, 22 * pixelSize, 2 * pixelSize);
    ctx.fillRect(-11 * pixelSize, -1 * pixelSize, 22 * pixelSize, 2 * pixelSize);
    ctx.fillRect(-11 * pixelSize, 12 * pixelSize, 22 * pixelSize, 2 * pixelSize);

    const books = [
        { color: '#f43f5e', height: 7, pos: -8 },
        { color: '#ec4899', height: 8, pos: -6 },
        { color: '#818cf8', height: 6, pos: -4 },
        { color: '#10b981', height: 7, pos: 1 },
        { color: '#fbbf24', height: 8, pos: 3 },
        { color: '#a855f7', height: 9, pos: 5 },
    ];

    // Fill books with subtle 3D vertical offsets
    // Top Shelf Books
    ctx.fillStyle = books[0].color; ctx.fillRect(books[0].pos * pixelSize, -24 * pixelSize, 1.8 * pixelSize, books[0].height * pixelSize);
    ctx.fillStyle = books[1].color; ctx.fillRect(books[1].pos * pixelSize, -25 * pixelSize, 1.8 * pixelSize, books[1].height * pixelSize);
    ctx.fillStyle = books[2].color; ctx.fillRect(books[2].pos * pixelSize, -23 * pixelSize, 1.8 * pixelSize, books[2].height * pixelSize);

    // Gold Sparkle Trophy in Center shelf
    ctx.fillStyle = '#fbbf24';// Star Gold Cup
    ctx.fillRect(-5 * pixelSize, -10 * pixelSize, 5 * pixelSize, 3 * pixelSize); // chalice
    ctx.fillRect(-4 * pixelSize, -7 * pixelSize, 3 * pixelSize, 1 * pixelSize); // stem
    ctx.fillRect(-3 * pixelSize, -6 * pixelSize, 1 * pixelSize, 3 * pixelSize); // main stick
    ctx.fillRect(-4 * pixelSize, -3 * pixelSize, 3 * pixelSize, 1 * pixelSize); // base plate

    // Lower Shelf books (Leaning style!)
    ctx.fillStyle = books[3].color; ctx.fillRect(books[3].pos * pixelSize, 4 * pixelSize, 1.8 * pixelSize, books[3].height * pixelSize);
    ctx.fillStyle = books[4].color; ctx.fillRect(books[4].pos * pixelSize, 3 * pixelSize, 1.8 * pixelSize, books[4].height * pixelSize);
    
    ctx.save();
    ctx.fillStyle = books[5].color;
    ctx.translate(books[5].pos * pixelSize, 6 * pixelSize);
    ctx.rotate(0.12); // Slanted diagonal placement!
    ctx.fillRect(0, -6 * pixelSize, 1.8 * pixelSize, 7 * pixelSize);
    ctx.restore();
};
