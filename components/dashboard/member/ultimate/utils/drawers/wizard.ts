/**
 * Draw Wizard Character on Canvas with high atmospheric isometric detail
 */
export const drawWizardCharacter = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    charLevel: number,
    charName: string,
    isCharIdle: boolean,
    charTick: number,
    isFacingLeft: boolean,
    isHoveringClickable: boolean,
    customColor?: string,
    isSelf: boolean = false,
    pixelSize: number = 3
) => {
    ctx.save();
    ctx.translate(x, y);

    // 1. Draw 3D Ground Drop Shadow beneath feet (Pulsating and shifting during actions)
    const bounceOffset = isCharIdle ? Math.sin(charTick * 0.08) * 0.6 : 0;
    const isWalking = !isCharIdle;
    const walkOffset = isWalking ? Math.sin(charTick * 0.25) * 2.2 : 0;
    const eyeBlink = charTick % 180 < 8;

    ctx.fillStyle = 'rgba(6, 8, 20, 0.45)';
    ctx.beginPath();
    const rx = (7 + (isWalking ? 0 : Math.cos(charTick * 0.08) * 0.4)) * pixelSize;
    const ry = rx * 0.48; // Isometric 2:1 angle ratio
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mirror horizontal character orientation depending on facing dir
    if (isFacingLeft) {
        ctx.scale(-1, 1);
    }

    // Colors according to user's virtual level progression tier
    const skinColor = '#ffd0a1';
    const shadowSkinColor = '#e5b383';
    const eyeColor = '#1e293b';
    let clothColor = customColor || '#fb7185';
    let accentClothColor = '#db2777';
    let hatColor = '#6366f1';
    let hatAccent = '#ffd700';

    if (charLevel >= 15) {
        hatColor = '#312e81'; // Celestial Void Navy
        clothColor = customColor || '#22c55e'; // Green Archmage
        accentClothColor = '#15803d';
    } else if (charLevel >= 8) {
        hatColor = '#6b21a8'; // Purple wizard
        clothColor = customColor || '#fbbf24'; // Amber
        accentClothColor = '#b45309';
    } else if (charLevel >= 3) {
        hatColor = '#1d4ed8'; // Royal Blue
        clothColor = customColor || '#ec4899'; // Hot pink
        accentClothColor = '#9f1239';
    }

    const gridOffset = { x: -8, y: -19 }; // Render offset to center coordinate over shadow feet point

    // 2. Wizard Footing Legs
    ctx.fillStyle = '#334155';
    if (isWalking) {
        // Alternating stride feet
        ctx.fillRect((gridOffset.x + 3.5) * pixelSize, (gridOffset.y + 16 + Math.max(0, walkOffset)) * pixelSize, 2.2 * pixelSize, 2.5 * pixelSize);
        ctx.fillRect((gridOffset.x + 9.5) * pixelSize, (gridOffset.y + 16 + Math.max(0, -walkOffset)) * pixelSize, 2.2 * pixelSize, 2.5 * pixelSize);
    } else {
        // Feet grounded with tiny hover slide
        ctx.fillRect((gridOffset.x + 4.2) * pixelSize, (gridOffset.y + 17) * pixelSize, 2 * pixelSize, 2 * pixelSize);
        ctx.fillRect((gridOffset.x + 8.8) * pixelSize, (gridOffset.y + 17) * pixelSize, 2 * pixelSize, 2 * pixelSize);
    }

    // 3. Robe body (Breathing dynamics)
    const bodyY = gridOffset.y + 9 + bounceOffset;
    ctx.fillStyle = clothColor;
    ctx.fillRect((gridOffset.x + 3) * pixelSize, bodyY * pixelSize, 10 * pixelSize, 8 * pixelSize);

    // Accent line patterns / sash details on Robe
    ctx.fillStyle = accentClothColor;
    ctx.fillRect((gridOffset.x + 2.5) * pixelSize, (bodyY + 6.5) * pixelSize, 11 * pixelSize, 1.5 * pixelSize); // Belt
    ctx.fillRect((gridOffset.x + 7) * pixelSize, bodyY * pixelSize, 2 * pixelSize, 6.5 * pixelSize); // Lapel

    // 4. Head, skin & face details
    const headY = gridOffset.y + 4 + bounceOffset;
    ctx.fillStyle = skinColor;
    ctx.fillRect((gridOffset.x + 4.5) * pixelSize, headY * pixelSize, 7 * pixelSize, 5 * pixelSize);
    ctx.fillStyle = shadowSkinColor;
    ctx.fillRect((gridOffset.x + 10.5) * pixelSize, headY * pixelSize, 1 * pixelSize, 5 * pixelSize);

    // Expressive blinking wizard eyes
    if (!eyeBlink) {
        ctx.fillStyle = eyeColor;
        ctx.fillRect((gridOffset.x + 6.5) * pixelSize, (headY + 1.5) * pixelSize, 1 * pixelSize, 1.5 * pixelSize);
        ctx.fillRect((gridOffset.x + 8.5) * pixelSize, (headY + 1.5) * pixelSize, 1 * pixelSize, 1.5 * pixelSize);
    }

    // Hover response action expression
    if (isSelf && isHoveringClickable) {
        // Surprised Red mouth
        ctx.fillStyle = '#ef4444';
        ctx.fillRect((gridOffset.x + 7.5) * pixelSize, (headY + 3.5) * pixelSize, 1 * pixelSize, 1 * pixelSize);

        // Surprise magic thought bubble above character
        ctx.save();
        ctx.scale(isFacingLeft ? -1 : 1, 1); // restore writing direction
        const popX = (isFacingLeft ? -22 : 22);
        const popY = headY - 8;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(popX - 8, popY - 6, 16, 13, 4);
        ctx.fill();

        ctx.strokeStyle = '#312e81';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#e11d48'; // Magenta ! exclamation mark
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡', popX, popY + 4);
        ctx.restore();
    } else {
        // Neutral or slight smile
        ctx.fillStyle = shadowSkinColor;
        ctx.fillRect((gridOffset.x + 7.5) * pixelSize, (headY + 3.8) * pixelSize, 1.5 * pixelSize, 0.5 * pixelSize);
    }

    // 5. Deluxe Witch/Wizard high pointy hat
    const hatY = gridOffset.y + bounceOffset;
    ctx.fillStyle = hatColor;
    ctx.fillRect((gridOffset.x + 2.5) * pixelSize, (hatY + 3.5) * pixelSize, 11 * pixelSize, 1.5 * pixelSize); // brim
    ctx.fillRect((gridOffset.x + 4.5) * pixelSize, (hatY + 0.5) * pixelSize, 7 * pixelSize, 3 * pixelSize); // base crown
    ctx.fillRect((gridOffset.x + 6) * pixelSize, (hatY - 2.5) * pixelSize, 4 * pixelSize, 3 * pixelSize); // mid crown
    ctx.fillRect((gridOffset.x + 7.5) * pixelSize, (hatY - 4.5) * pixelSize, 2 * pixelSize, 2 * pixelSize); // tip

    // Glitter star crystal on hat peak base
    ctx.fillStyle = hatAccent;
    ctx.fillRect((gridOffset.x + 8 * pixelSize), (hatY - 6) * pixelSize, 1 * pixelSize, 1 * pixelSize);
    ctx.fillRect((gridOffset.x + 7.5 * pixelSize), (hatY - 5.5) * pixelSize, 2 * pixelSize, 0.5 * pixelSize);

    // 6. Familiar floating Slime companion for wizards above Lv.5
    if (charLevel >= 5) {
        const petOffset = { x: -16, y: -4 };
        const petFloat = Math.sin(charTick * 0.12) * 1.5;

        // Blob body
        ctx.fillStyle = '#34d399'; // Emerald gelatin
        ctx.fillRect((gridOffset.x + petOffset.x) * pixelSize, (gridOffset.y + petOffset.y + petFloat) * pixelSize, 5 * pixelSize, 4 * pixelSize);

        // Slime face
        ctx.fillStyle = '#064e3b';
        ctx.fillRect((gridOffset.x + petOffset.x + 1) * pixelSize, (gridOffset.y + petOffset.y + 1.2 + petFloat) * pixelSize, 0.6 * pixelSize, 1 * pixelSize);
        ctx.fillRect((gridOffset.x + petOffset.x + 3) * pixelSize, (gridOffset.y + petOffset.y + 1.2 + petFloat) * pixelSize, 0.6 * pixelSize, 1 * pixelSize);
    }

    ctx.restore();

    // 7. Render Text Info Banner delegated to HTML Overlay! (Commented out to prevent double-draw)
    /*
    ctx.save();
    ctx.fillStyle = isSelf ? '#f472b6' : '#60a5fa';
    ctx.font = 'bold 9px "Courier New", monospace';
    ctx.textAlign = 'center';
    
    // Drop shadow text effect for crisp readability
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    const roleString = isSelf ? ' (คุณ)' : '';
    ctx.fillText(`${charName}${roleString}`, x, y + 10);
    
    // Stats level row
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(`Lv.${charLevel}`, x, y + 20);
    ctx.restore();
    */
};
