import { COLLISION_LAYER_NAME } from '../config.js';
import { loadImage } from '../utils/index.js';
import { normalizeObject, normalizeSpawn, parseInteger, parseLayers } from './parser.js';

const MAP_FILES = {
  homepage: 'homepage.tmx',
  hidden_room: 'hidden_room.tmx',
};

export function isSupportedMapId(mapId) {
  return typeof mapId === 'string' && Object.hasOwn(MAP_FILES, mapId);
}

export async function loadMap(mapId = 'homepage') {
  const resolvedMapId = isSupportedMapId(mapId) ? mapId : 'homepage';
  const mapUrl = new URL(`../../assets/maps/${MAP_FILES[resolvedMapId]}`, import.meta.url);

  return loadMapFromUrl(mapUrl, resolvedMapId);
}

export async function loadHomepageMap() {
  return loadMap('homepage');
}

async function loadMapFromUrl(mapUrl, mapId) {
  const mapResponse = await fetch(mapUrl);
  if (!mapResponse.ok) {
    throw new Error(`Failed to load TMX map: ${mapResponse.status}`);
  }

  const mapText = await mapResponse.text();
  const mapXml = new DOMParser().parseFromString(mapText, 'application/xml');
  const mapNode = mapXml.querySelector('map');
  if (!mapNode) {
    throw new Error('TMX map is missing the root map node.');
  }

  const width = parseInteger(mapNode.getAttribute('width'));
  const height = parseInteger(mapNode.getAttribute('height'));
  const tileWidth = parseInteger(mapNode.getAttribute('tilewidth'));
  const tileHeight = parseInteger(mapNode.getAttribute('tileheight'));

  const tilesetRef = mapNode.querySelector('tileset');
  if (!tilesetRef) {
    throw new Error('TMX map is missing a tileset reference.');
  }

  const tilesetUrl = new URL(tilesetRef.getAttribute('source') ?? '', mapUrl);
  const tilesetResponse = await fetch(tilesetUrl);
  if (!tilesetResponse.ok) {
    throw new Error(`Failed to load TSX tileset: ${tilesetResponse.status}`);
  }

  const tilesetText = await tilesetResponse.text();
  const tilesetXml = new DOMParser().parseFromString(tilesetText, 'application/xml');
  const tilesetNode = tilesetXml.querySelector('tileset');
  const imageNode = tilesetNode?.querySelector('image');
  if (!tilesetNode || !imageNode) {
    throw new Error('TSX tileset is missing image metadata.');
  }

  const imageSource = imageNode.getAttribute('source') ?? '../tilesheet.png';
  const tilesetImageUrl = new URL(imageSource, tilesetUrl);
  const tilesetImage = await loadImage(tilesetImageUrl.href);

  const columns = parseInteger(tilesetNode.getAttribute('columns'));
  const tileCount = parseInteger(tilesetNode.getAttribute('tilecount'));
  const declaredTileWidth = parseInteger(tilesetNode.getAttribute('tilewidth'), tileWidth);
  const declaredTileHeight = parseInteger(tilesetNode.getAttribute('tileheight'), tileHeight);
  const rowCount = Math.max(Math.ceil(tileCount / Math.max(columns, 1)), 1);
  const inferredSourceTileWidth = Math.floor(tilesetImage.naturalWidth / Math.max(columns, 1));
  const inferredSourceTileHeight = Math.floor(tilesetImage.naturalHeight / rowCount);
  const sourceTileWidth = inferredSourceTileWidth >= declaredTileWidth ? inferredSourceTileWidth : declaredTileWidth;
  const sourceTileHeight = inferredSourceTileHeight >= declaredTileHeight ? inferredSourceTileHeight : declaredTileHeight;

  const parsedLayers = parseLayers(mapNode, width, height);
  const collisionLayer =
    parsedLayers.find((layer) => layer.name.trim().toLowerCase() === COLLISION_LAYER_NAME) ?? null;

  if (collisionLayer && collisionLayer.data.length !== width * height) {
    throw new Error('Collision layer data length does not match map dimensions.');
  }

  const layers = parsedLayers.filter((layer) => layer !== collisionLayer);
  const objects = [...mapNode.querySelectorAll('objectgroup > object')].map(normalizeObject);
  const spawnObject = objects.find(
    (object) => object.type === 'spawn' || object.properties?.playerSpawn === 'true',
  );
  const playerSpawn = spawnObject ? normalizeSpawn(spawnObject, width, height, tileWidth, tileHeight) : null;

  return {
    id: mapId,
    width,
    height,
    tileWidth,
    tileHeight,
    pixelWidth: width * tileWidth,
    pixelHeight: height * tileHeight,
    layers,
    hasCollisionLayer: Boolean(collisionLayer),
    collisionLayer: collisionLayer?.data ?? null,
    playerSpawn,
    objects,
    tileset: {
      firstGid: parseInteger(tilesetRef.getAttribute('firstgid'), 1),
      columns,
      tileCount,
      tileWidth: declaredTileWidth,
      tileHeight: declaredTileHeight,
      sourceTileWidth,
      sourceTileHeight,
      image: tilesetImage,
    },
  };
}