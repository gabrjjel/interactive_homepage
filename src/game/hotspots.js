import { intersects } from '../utils/index.js';

export function resolveInteractionBounds(hotspot, map) {
  const tileWidth = map.tileWidth;
  const tileHeight = map.tileHeight;
  const defaultWidth = hotspot.width > 0 ? hotspot.width : tileWidth;
  const defaultHeight = hotspot.height > 0 ? hotspot.height : tileHeight;

  const tileX = Number.parseInt(hotspot.properties?.tileX ?? '', 10);
  const tileY = Number.parseInt(hotspot.properties?.tileY ?? '', 10);
  if (Number.isFinite(tileX) && Number.isFinite(tileY)) {
    return {
      x: tileX * tileWidth,
      y: tileY * tileHeight,
      width: defaultWidth,
      height: defaultHeight,
    };
  }

  const tileIndex = Number.parseInt(hotspot.properties?.tileIndex ?? '', 10);
  if (Number.isFinite(tileIndex) && tileIndex >= 0) {
    const indexX = tileIndex % map.width;
    const indexY = Math.floor(tileIndex / map.width);
    return {
      x: indexX * tileWidth,
      y: indexY * tileHeight,
      width: defaultWidth,
      height: defaultHeight,
    };
  }

  return {
    x: hotspot.x,
    y: hotspot.y,
    width: defaultWidth,
    height: defaultHeight,
  };
}

export function getInteractableHotspot(player, hotspots, map) {
  const playerBounds = {
    x: player.x,
    y: player.y,
    width: player.width,
    height: player.height,
  };

  for (const hotspot of hotspots) {
    const hotspotBounds = resolveInteractionBounds(hotspot, map);
    if (
      intersects(playerBounds, {
        x: hotspotBounds.x,
        y: hotspotBounds.y,
        width: hotspotBounds.width,
        height: hotspotBounds.height,
      })
    ) {
      return hotspot;
    }
  }

  return null;
}