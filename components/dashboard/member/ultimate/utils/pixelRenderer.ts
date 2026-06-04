/**
 * Utility for rendering 8-bit retro pixel art in elegant 3D Isometric Projection on standard 2D Canvas.
 * Orchestrates modular drawers for clean architecture.
 */

import { drawDesk } from './drawers/desk';
import { drawSofa } from './drawers/sofa';
import { drawBookshelf } from './drawers/bookshelf';
import { drawPlants } from './drawers/plants';
import {
    drawQuestBoard,
    drawDutySign,
    drawGoalBeacon,
    drawLeaderboardAltar,
    drawVaultBox,
    drawChatBall,
    drawWikiPortal
} from './drawers/interactive';
import {
    drawCauldron,
    drawCatBed,
    drawStellarGlobe,
    drawMagicWell
} from './drawers/decorative';
import {
    drawBed,
    drawTelevision,
    drawDiningTable,
    drawWardrobe
} from './drawers/household';

export { drawWizardCharacter } from './drawers/wizard';

// Draw helper: Render retro 3D Isometric furniture on Canvas with realistic ambient shadows and depth.
export const drawPixelFurniture = (
    ctx: CanvasRenderingContext2D,
    type: 'DESK' | 'SOFA' | 'BOOKSHELF' | 'PLANT_1' | 'PLANT_2' | 'QUEST_BOARD' | 'DUTY_SIGN' | 'GOAL_BEACON' | 'LEADERBOARD_ALTAR' | 'VAULT_BOX' | 'CHAT_BALL' | 'WIKI_PORTAL' | 'CAULDRON' | 'CAT_BED' | 'STELLAR_GLOBE' | 'MAGIC_WELL' | 'BED' | 'TELEVISION' | 'DINING_TABLE' | 'WARDROBE',
    x: number,
    y: number,
    pixelSize: number = 3,
    tick: number = 0
) => {
    ctx.save();
    ctx.translate(x, y);

    const ambientShadow = 'rgba(6, 8, 20, 0.45)';

    switch (type) {
        case 'DESK':
            drawDesk(ctx, pixelSize, tick, ambientShadow);
            break;
        case 'SOFA':
            drawSofa(ctx, pixelSize, tick, ambientShadow);
            break;
        case 'BOOKSHELF':
            drawBookshelf(ctx, pixelSize, tick, ambientShadow);
            break;
        case 'PLANT_1':
        case 'PLANT_2':
            drawPlants(ctx, type, pixelSize, tick, ambientShadow);
            break;
        case 'QUEST_BOARD':
            drawQuestBoard(ctx, pixelSize, tick, ambientShadow);
            break;
        case 'DUTY_SIGN':
            drawDutySign(ctx, pixelSize, tick, ambientShadow);
            break;
        case 'GOAL_BEACON':
            drawGoalBeacon(ctx, pixelSize, tick, ambientShadow);
            break;
        case 'LEADERBOARD_ALTAR':
            drawLeaderboardAltar(ctx, pixelSize, tick, ambientShadow);
            break;
        case 'VAULT_BOX':
            drawVaultBox(ctx, pixelSize, tick, ambientShadow);
            break;
        case 'CHAT_BALL':
            drawChatBall(ctx, pixelSize, tick, ambientShadow);
            break;
        case 'WIKI_PORTAL':
            drawWikiPortal(ctx, pixelSize, tick, ambientShadow);
            break;
        case 'CAULDRON':
            drawCauldron(ctx, pixelSize, tick, ambientShadow);
            break;
        case 'CAT_BED':
            drawCatBed(ctx, pixelSize, tick, ambientShadow);
            break;
        case 'STELLAR_GLOBE':
            drawStellarGlobe(ctx, pixelSize, tick, ambientShadow);
            break;
        case 'MAGIC_WELL':
            drawMagicWell(ctx, pixelSize, tick, ambientShadow);
            break;
        case 'BED':
            drawBed(ctx, pixelSize, tick, ambientShadow);
            break;
        case 'TELEVISION':
            drawTelevision(ctx, pixelSize, tick, ambientShadow);
            break;
        case 'DINING_TABLE':
            drawDiningTable(ctx, pixelSize, tick, ambientShadow);
            break;
        case 'WARDROBE':
            drawWardrobe(ctx, pixelSize, tick, ambientShadow);
            break;
        default:
            break;
    }

    ctx.restore();
};
