import {
  DIRECTION_VECTORS,
  SHOW_HOTSPOT_HINTS,
  SPRITE_ROWS,
  TILE_STEP_MS,
  TURN_ONLY_THRESHOLD_MS,
  VIEWPORT_PADDING,
  WALK_FRAME_MS,
  WALK_SEQUENCE,
} from '../config.js';
import { clamp } from '../utils/index.js';
import { getQueuedInput, INTERACT_KEYS, KEY_TO_DIRECTION } from './input.js';
import { getInteractableHotspot, resolveInteractionBounds } from './hotspots.js';
import { renderHotspotHints, renderPlayerSprite, renderRenderableObjects, renderTileLayer } from './renderer.js';
import { loadKeyedSpriteSheet } from './sprite-loader.js';

export class HomepageGame {
  constructor({ canvas, map, onHotspotInteract = null, isModalOpen = null }) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.context.imageSmoothingEnabled = false;
    this.map = map;
    this.keys = new Set();
    this.keyDownAt = new Map();
    this.lastDirectionKey = null;
    this.interactRequested = false;
    this.lastFrameTime = 0;
    this.playerSpriteSheet = null;
    this.playerStep = null;
    this.animationFrame = 0;
    this.walkAnimationElapsedMs = 0;
    this.hasCollisionLayer = map.hasCollisionLayer;
    this.collisionLayer = map.collisionLayer;
    this.onHotspotInteract = onHotspotInteract;
    this.isModalOpen = isModalOpen;
    this.hotspots = map.objects.filter((object) => object.type === 'hotspot');
    const spawnTileX = clamp(map.playerSpawn?.tileX ?? 8, 0, map.width - 1);
    const spawnTileY = clamp(map.playerSpawn?.tileY ?? 10, 0, map.height - 1);
    const spawnDirection = map.playerSpawn?.direction ?? 'down';
    this.player = {
      tileX: spawnTileX,
      tileY: spawnTileY,
      x: map.tileWidth * spawnTileX,
      y: map.tileHeight * spawnTileY,
      width: map.tileWidth,
      height: map.tileHeight,
      direction: spawnDirection,
    };

    this.backgroundLayers = map.layers.slice(0, Math.max(map.layers.length - 2, 0));
    this.foregroundLayers = map.layers.slice(this.backgroundLayers.length);
    this.renderableObjects = map.objects.filter((object) => object.gid >= map.tileset.firstGid);

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.frame = this.frame.bind(this);
  }

  async init() {
    this.playerSpriteSheet = await loadKeyedSpriteSheet();
    this.canvas.width = this.map.pixelWidth;
    this.canvas.height = this.map.pixelHeight;
    this.handleResize();

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);
    requestAnimationFrame(this.frame);
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize() {
    const rawScale = Math.min(
      (window.innerWidth - VIEWPORT_PADDING) / this.map.pixelWidth,
      (window.innerHeight - VIEWPORT_PADDING) / this.map.pixelHeight,
    );
    const scale = rawScale >= 1 ? Math.floor(rawScale) : Math.max(rawScale, 0.8);

    this.canvas.style.width = `${Math.round(this.map.pixelWidth * scale)}px`;
    this.canvas.style.height = `${Math.round(this.map.pixelHeight * scale)}px`;
  }

  handleKeyDown(event) {
    const normalizedKey = event.key.toLowerCase();

    if (INTERACT_KEYS.has(normalizedKey)) {
      event.preventDefault();
      if (!event.repeat) {
        this.interactRequested = true;
      }
      return;
    }

    if (event.repeat) {
      return;
    }

    const direction = KEY_TO_DIRECTION[normalizedKey];
    if (!direction) {
      return;
    }

    event.preventDefault();
    this.keys.add(normalizedKey);
    this.keyDownAt.set(normalizedKey, performance.now());
    this.lastDirectionKey = normalizedKey;
  }

  handleKeyUp(event) {
    const normalizedKey = event.key.toLowerCase();
    this.keys.delete(normalizedKey);
    this.keyDownAt.delete(normalizedKey);
    if (this.lastDirectionKey === normalizedKey) {
      const remainingDirections = [...this.keys].map((key) => KEY_TO_DIRECTION[key]).filter(Boolean);
      const fallbackDirection = remainingDirections.at(-1);
      this.lastDirectionKey = fallbackDirection
        ? Object.keys(KEY_TO_DIRECTION).find((key) => KEY_TO_DIRECTION[key] === fallbackDirection && this.keys.has(key)) ?? null
        : null;
    }
  }

  frame(timestamp) {
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = timestamp;
    }

    const deltaSeconds = Math.min((timestamp - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = timestamp;

    this.update(deltaSeconds);
    this.render();
    requestAnimationFrame(this.frame);
  }

  update(deltaSeconds) {
    if (this.isModalOpen?.()) {
      this.animationFrame = 0;
      this.walkAnimationElapsedMs = 0;
      this.playerStep = null;
      this.interactRequested = false;
      return;
    }

    const deltaMs = deltaSeconds * 1000;

    if (this.playerStep) {
      this.playerStep.elapsed = Math.min(this.playerStep.elapsed + deltaMs, this.playerStep.duration);
      const progress = this.playerStep.elapsed / this.playerStep.duration;
      this.player.x = this.playerStep.startX + (this.playerStep.targetX - this.playerStep.startX) * progress;
      this.player.y = this.playerStep.startY + (this.playerStep.targetY - this.playerStep.startY) * progress;
      this.walkAnimationElapsedMs += deltaMs;
      const frameIndex = Math.floor(this.walkAnimationElapsedMs / WALK_FRAME_MS) % WALK_SEQUENCE.length;
      this.animationFrame = WALK_SEQUENCE[frameIndex];

      if (progress >= 1) {
        this.player.tileX = this.playerStep.targetTileX;
        this.player.tileY = this.playerStep.targetTileY;
        this.player.x = this.playerStep.targetX;
        this.player.y = this.playerStep.targetY;
        this.playerStep = null;

        if (this.interactRequested) {
          this.tryInteract();
        }
      }
      return;
    }

    if (this.interactRequested) {
      this.tryInteract();
    }

    const queuedInput = getQueuedInput(this.keys, this.lastDirectionKey);
    if (!queuedInput) {
      this.animationFrame = 0;
      this.walkAnimationElapsedMs = 0;
      return;
    }

    const { key, direction } = queuedInput;

    if (this.player.direction !== direction) {
      this.player.direction = direction;
      this.animationFrame = 0;
    }

    const heldMs = performance.now() - (this.keyDownAt.get(key) ?? performance.now());
    if (heldMs < TURN_ONLY_THRESHOLD_MS) {
      return;
    }

    this.startStep(direction);
  }

  tryInteract() {
    this.interactRequested = false;
    const hotspot = getInteractableHotspot(this.player, this.hotspots, this.map);
    if (!hotspot) {
      return;
    }

    const interactionType = hotspot.properties?.interactionType ?? (hotspot.properties?.route ? 'route' : 'text');

    this.onHotspotInteract?.({
      interactionType,
      contentId: hotspot.properties.contentId,
      route: hotspot.properties.route,
      text: hotspot.properties.text,
      prompt: hotspot.properties.prompt ?? hotspot.name ?? '',
    });
  }

  getInteractionBounds(hotspot) {
    return resolveInteractionBounds(hotspot, this.map);
  }

  canWalkToTile(tileX, tileY) {
    if (!this.hasCollisionLayer || !this.collisionLayer) {
      return true;
    }

    const tileIndex = tileY * this.map.width + tileX;
    const tileValue = this.collisionLayer[tileIndex] ?? 0;
    return tileValue === 0;
  }

  startStep(direction) {
    const vector = DIRECTION_VECTORS[direction];
    const maxTileX = this.map.width - 1;
    const maxTileY = this.map.height - 1;
    const targetTileX = clamp(this.player.tileX + vector.x, 0, maxTileX);
    const targetTileY = clamp(this.player.tileY + vector.y, 0, maxTileY);

    if (targetTileX === this.player.tileX && targetTileY === this.player.tileY) {
      this.animationFrame = 0;
      return;
    }

    if (!this.canWalkToTile(targetTileX, targetTileY)) {
      this.animationFrame = 0;
      return;
    }

    this.playerStep = {
      startX: this.player.tileX * this.map.tileWidth,
      startY: this.player.tileY * this.map.tileHeight,
      targetX: targetTileX * this.map.tileWidth,
      targetY: targetTileY * this.map.tileHeight,
      targetTileX,
      targetTileY,
      duration: TILE_STEP_MS,
      elapsed: 0,
    };
  }

  render() {
    this.context.clearRect(0, 0, this.map.pixelWidth, this.map.pixelHeight);

    for (const layer of this.backgroundLayers) {
      renderTileLayer(this.context, layer, this.map);
    }

    renderPlayerSprite(this.context, this.playerSpriteSheet, this.player, this.animationFrame, SPRITE_ROWS);

    for (const layer of this.foregroundLayers) {
      renderTileLayer(this.context, layer, this.map);
    }

    renderRenderableObjects(this.context, this.renderableObjects, this.map);

    if (SHOW_HOTSPOT_HINTS) {
      renderHotspotHints(this.context, this.hotspots, this.map, (hotspot) => this.getInteractionBounds(hotspot));
    }
  }
}