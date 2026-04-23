function parseNumber(value, parser, fallback = 0) {
  const parsed = parser(value ?? '');
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseInteger(value, fallback = 0) {
  return parseNumber(value, (input) => Number.parseInt(input, 10), fallback);
}

export function parseFloatValue(value, fallback = 0) {
  return parseNumber(value, Number.parseFloat, fallback);
}

export function parseProperties(node) {
  const properties = {};
  node.querySelectorAll('properties > property').forEach((propertyNode) => {
    const name = propertyNode.getAttribute('name');
    if (!name) {
      return;
    }

    properties[name] = propertyNode.getAttribute('value') ?? propertyNode.textContent ?? '';
  });
  return properties;
}

export function parseCsv(csvText) {
  return csvText
    .trim()
    .split(',')
    .map((value) => parseInteger(value.trim(), 0));
}

export function normalizeObject(objectNode) {
  const width = parseFloatValue(objectNode.getAttribute('width'), 0);
  const height = parseFloatValue(objectNode.getAttribute('height'), 0);
  const x = parseFloatValue(objectNode.getAttribute('x'), 0);
  const rawY = parseFloatValue(objectNode.getAttribute('y'), 0);

  return {
    id: parseInteger(objectNode.getAttribute('id')),
    name: objectNode.getAttribute('name') ?? '',
    type: objectNode.getAttribute('type') ?? '',
    gid: parseInteger(objectNode.getAttribute('gid'), 0),
    x,
    y: rawY - height,
    width,
    height,
    properties: parseProperties(objectNode),
  };
}

export function normalizeSpawn(object, mapWidth, mapHeight, tileWidth, tileHeight) {
  const tileX = Math.max(0, Math.min(mapWidth - 1, Math.floor(object.x / tileWidth)));
  const tileY = Math.max(0, Math.min(mapHeight - 1, Math.floor(object.y / tileHeight)));
  const direction = object.properties?.direction ?? 'down';

  return {
    tileX,
    tileY,
    direction,
  };
}

export function parseLayers(mapNode, width, height) {
  return [...mapNode.querySelectorAll('layer')].map((layerNode) => ({
    id: parseInteger(layerNode.getAttribute('id')),
    name: layerNode.getAttribute('name') ?? '',
    width: parseInteger(layerNode.getAttribute('width'), width),
    height: parseInteger(layerNode.getAttribute('height'), height),
    data: parseCsv(layerNode.querySelector('data')?.textContent ?? ''),
  }));
}