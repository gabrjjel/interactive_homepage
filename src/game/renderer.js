import { PLAYER_SPRITE_SIZE } from '../config.js';
import { roundToNearestPixel } from '../utils/index.js';

function drawTileByGid(context, tileset, gid, targetX, targetY, targetWidth, targetHeight) {
  const { columns, sourceTileWidth, sourceTileHeight, firstGid, image } = tileset;
  const localId = gid - firstGid;
  if (localId < 0) {
    return;
  }

  const sourceX = (localId % columns) * sourceTileWidth;
  const sourceY = Math.floor(localId / columns) * sourceTileHeight;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceTileWidth,
    sourceTileHeight,
    targetX,
    targetY,
    targetWidth,
    targetHeight,
  );
}

export function renderTileLayer(context, layer, map) {
  layer.data.forEach((gid, index) => {
    if (gid < map.tileset.firstGid) {
      return;
    }

    const targetX = (index % layer.width) * map.tileWidth;
    const targetY = Math.floor(index / layer.width) * map.tileHeight;
    drawTileByGid(context, map.tileset, gid, targetX, targetY, map.tileWidth, map.tileHeight);
  });
}

export function renderRenderableObjects(context, objects, map) {
  objects.forEach((object) => {
    const targetWidth = object.width > 0 ? roundToNearestPixel(object.width) : map.tileWidth;
    const targetHeight = object.height > 0 ? roundToNearestPixel(object.height) : map.tileHeight;
    const targetX = roundToNearestPixel(object.x);
    const targetY = roundToNearestPixel(object.y);
    drawTileByGid(context, map.tileset, object.gid, targetX, targetY, targetWidth, targetHeight);
  });
}

export function renderPlayerSprite(context, playerSpriteSheet, player, animationFrame, spriteRows) {
  if (!playerSpriteSheet) {
    context.fillStyle = '#d7f4bf';
    context.fillRect(player.x, player.y, player.width, player.height);
    return;
  }

  const sourceX = animationFrame * PLAYER_SPRITE_SIZE;
  const sourceY = spriteRows[player.direction] * PLAYER_SPRITE_SIZE;
  const targetX = roundToNearestPixel(player.x);
  const targetY = roundToNearestPixel(player.y);

  context.drawImage(
    playerSpriteSheet,
    sourceX,
    sourceY,
    PLAYER_SPRITE_SIZE,
    PLAYER_SPRITE_SIZE,
    targetX,
    targetY,
    PLAYER_SPRITE_SIZE,
    PLAYER_SPRITE_SIZE,
  );
}

export function renderHotspotHints(context, hotspots, map, getInteractionBounds) {
  context.save();
  context.font = '10px monospace';
  context.textBaseline = 'top';

  hotspots.forEach((hotspot) => {
    const bounds = getInteractionBounds(hotspot);
    const x = roundToNearestPixel(bounds.x);
    const y = roundToNearestPixel(bounds.y);
    const width = roundToNearestPixel(bounds.width);
    const height = roundToNearestPixel(bounds.height);
    const label = hotspot.properties?.prompt ?? hotspot.name ?? 'hotspot';

    context.fillStyle = 'rgba(255, 221, 0, 0.18)';
    context.fillRect(x, y, width, height);

    context.strokeStyle = '#ffdd00';
    context.lineWidth = 1;
    context.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);

    const labelPadding = 2;
    const labelHeight = 12;
    const labelWidth = Math.max(context.measureText(label).width + labelPadding * 2, width);
    const labelX = x;
    const labelY = Math.max(0, y - labelHeight - 1);

    context.fillStyle = 'rgba(7, 18, 14, 0.85)';
    context.fillRect(labelX, labelY, labelWidth, labelHeight);
    context.fillStyle = '#ffdd00';
    context.fillText(label, labelX + labelPadding, labelY + 1);
  });

  context.restore();
}