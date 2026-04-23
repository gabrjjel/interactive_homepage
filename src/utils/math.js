export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function roundToNearestPixel(value) {
  return Math.round(value);
}

export function intersects(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}