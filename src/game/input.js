import { DIRECTION_KEY_PRIORITY } from '../config.js';

export const KEY_TO_DIRECTION = {
  arrowdown: 'down',
  s: 'down',
  arrowleft: 'left',
  a: 'left',
  arrowup: 'up',
  w: 'up',
  arrowright: 'right',
  d: 'right',
};

export const INTERACT_KEYS = new Set(['e', 'enter', ' ']);

export function getQueuedInput(keys, lastDirectionKey) {
  if (lastDirectionKey && keys.has(lastDirectionKey)) {
    return {
      key: lastDirectionKey,
      direction: KEY_TO_DIRECTION[lastDirectionKey],
    };
  }

  for (const key of DIRECTION_KEY_PRIORITY) {
    if (keys.has(key)) {
      return {
        key,
        direction: KEY_TO_DIRECTION[key],
      };
    }
  }

  return null;
}