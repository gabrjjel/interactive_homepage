export const TILE_STEP_MS = 240;
export const WALK_FRAME_MS = 90;
export const WALK_SEQUENCE = [0, 1, 0, 3];
export const SPRITE_ROWS = {
  down: 0,
  left: 2,
  up: 4,
  right: 6,
};

export const DIRECTION_VECTORS = {
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
};

export const VIEWPORT_PADDING = 24;
export const TURN_ONLY_THRESHOLD_MS = 75;
export const SHOW_HOTSPOT_HINTS = true;
export const PLAYER_SPRITE_SIZE = 16;
export const COLLISION_LAYER_NAME = 'collisions';

export const DIRECTION_KEY_PRIORITY = [
  'arrowdown',
  's',
  'arrowleft',
  'a',
  'arrowup',
  'w',
  'arrowright',
  'd',
];