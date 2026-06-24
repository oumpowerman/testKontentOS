// Calculate Isometric 3D Projection coordinates
export const get3DCoordinates = (laneIndex: number, progress: number, totalLanes: number) => {
    // Balanced 3D lane width - dynamically scale if there are many tracks so it never overflows
    const maxTrackWidth = 720; // Ensure entire track width fits nicely
    const laneWidth = Math.min(85, maxTrackWidth / Math.max(1, totalLanes - 1 || 1)); 
    const laneOffset = (laneIndex - (totalLanes - 1) / 2) * laneWidth;

    // Start gate (far top - progress = 0)
    const startX = 500 + laneOffset * 0.55; // Symmetrical narrow width at the far end
    const startY = 70; // Start line at the top

    // Finish gate (close bottom - progress = 1)
    const endX = 500 + laneOffset * 1.25; // Symmetrical outward flare at the bottom end
    const endY = 295; // Finish line at the bottom

    // Linear Interpolation
    const x = startX + (endX - startX) * progress;
    const y = startY + (endY - startY) * progress;
    
    // Perspective Scaling Balance
    // Start scale 0.55 (far away), Finish scale 0.9 (close to screen)
    const scale = 0.55 + (0.9 - 0.55) * progress;
    const zIndex = Math.floor(y); // Characters in foreground (larger Y) layer on top of those in background

    return { x, y, scale, zIndex };
};
