# Pixel Home Documentation

This document describes the current implementation of the project as it exists in the repository today. It covers setup, server startup, runtime architecture, map conventions, current authored content, controls, and the main gaps that still remain.

## Project Summary

Pixel Home is a static browser project that turns a homepage into a small explorable pixel-art room. The site boots directly in the browser with ES modules, loads a Tiled-authored TMX map at runtime, renders layered tile data onto a canvas, and lets the player move around the map to trigger hotspot interactions.

The current implementation is intentionally lightweight:

- No build step
- No package manager
- No framework
- No backend
- One HTML page, one stylesheet, and browser-loaded JavaScript modules under `src/`

## Current Repository Layout

```text
/
|- index.html
|- styles.css
|- documentation.md
|- assets/
|  |- maps/
|  |  |- homepage.tmx
|  |  |- tilesheet.tsx
|  |- player/
|  |  |- gif/
|  |- tilesheet.png
|  |- player/spritesheet.png
|- reference/
|  |- GB tilesheet 4 colours.aseprite
|- src/
   |- main.js
   |- config.js
   |- content.js
   |- game.js
   |- map-loader.js
   |- utils.js
   |- game/
   |  |- hotspots.js
   |  |- index.js
   |  |- input.js
   |  |- renderer.js
   |  |- sprite-loader.js
   |- map/
   |  |- index.js
   |  |- parser.js
   |- ui/
   |  |- modal.js
   |- utils/
      |- image.js
      |- index.js
      |- math.js
```

## Setup And Server

This project must be served over HTTP. Opening `index.html` directly from the filesystem is not sufficient because the app fetches map and tileset assets at runtime.

### Prerequisite

Install Python 3 if it is not already available.

```bash
sudo apt-get update
sudo apt-get install -y python3
```

### Start The Static Server

From the project root, start a local static HTTP server on port 8000.

If you are in this dev container, the repository root is:

```bash
cd /workspaces/site_homepage
```

If you are working in a different local clone, `cd` into that project root instead.

Then run:

```bash
python3 -m http.server 8000
```

Open the site at:

```text
http://127.0.0.1:8000
```

### Why A Server Is Required

The app fetches these files at runtime:

- `assets/maps/homepage.tmx`
- `assets/maps/tilesheet.tsx`
- `assets/tilesheet.png`
- `assets/player/spritesheet.png`

Without HTTP serving, those fetches will fail or behave inconsistently depending on browser security rules.

## Runtime Overview

### Boot Flow

1. `index.html` loads `styles.css` and `src/main.js`.
2. `src/main.js` selects the canvas and modal DOM nodes.
3. `src/main.js` calls `loadHomepageMap()` from `src/map/index.js`.
4. The loader fetches the TMX file, the external TSX tileset, and the tilesheet image.
5. The map parser normalizes layers, objects, and optional spawn metadata.
6. `src/main.js` creates `HomepageGame` with the parsed map and hotspot interaction callbacks.
7. `HomepageGame.init()` loads the player spritesheet, sizes the canvas, binds events, and starts the animation loop.

### Main Entry Points

- `src/main.js`: app bootstrap, hotspot action routing, and modal wiring
- `src/game/index.js`: core gameplay loop, input handling, movement, collisions, interaction triggering, and render orchestration
- `src/map/index.js`: TMX and TSX loading plus normalized map assembly
- `src/map/parser.js`: XML parsing helpers for layers, properties, objects, and spawn data
- `src/game/renderer.js`: tile, object, player, and hotspot overlay rendering
- `src/ui/modal.js`: modal open, close, and content rendering behavior
- `src/content.js`: structured content records used by hotspot-driven modals
- `src/config.js`: current gameplay and rendering constants

## Current HTML And UI Shell

The page consists of a single full-screen shell with two primary UI surfaces:

1. A `<canvas id="game">` used for all map, object, and player rendering
2. A modal overlay used for hotspot content and text fallback interactions

### Modal Structure

The modal includes:

- Backdrop
- Close button
- Kicker text
- Title
- Paragraph body container
- Optional bullet list container

### Current Styling Direction

The current stylesheet uses a restrained retro palette:

- Background: dark green (`--bg`)
- Panel surface: pale green (`--panel`)
- Panel text: dark ink (`--panel-ink`)
- Panel accent/border: muted green (`--panel-accent`)

The layout centers the canvas in the viewport, disables overflow on the page, and uses pixelated image rendering for crisp sprite scaling.

## Game Loop And Player Behavior

The main gameplay implementation lives in `src/game/index.js`.

### Player State

The player tracks:

- Tile coordinates (`tileX`, `tileY`)
- Pixel coordinates (`x`, `y`)
- Dimensions (`width`, `height`)
- Facing direction

If the TMX map provides a spawn object, the player uses it. Otherwise the game falls back to tile `(8, 10)` facing `down`.

### Movement Model

Movement is tile-based but visually interpolated over time.

Current values from `src/config.js`:

- `TILE_STEP_MS = 240`
- `WALK_FRAME_MS = 90`
- `WALK_SEQUENCE = [0, 1, 0, 3]`
- `TURN_ONLY_THRESHOLD_MS = 75`

Behavior details:

- Arrow keys and WASD are supported.
- A very short press updates facing direction only.
- Holding the direction key past the threshold starts a movement step.
- Movement clamps to map bounds.
- Collision data, when present, blocks entry into non-walkable tiles.

### Direction And Animation

Direction rows in the player spritesheet are defined as:

- `down: 0`
- `left: 2`
- `up: 4`
- `right: 6`

The player animation resets to frame `0` when idle or blocked.

### Resize Behavior

The canvas always keeps its internal pixel size equal to the map size, then scales via CSS based on the current viewport.

The scale logic:

- Uses `VIEWPORT_PADDING = 24`
- Chooses an integer scale when the viewport is large enough
- Falls back to a fractional minimum of `0.8` when space is tight

## Input System

The input module lives in `src/game/input.js`.

### Supported Keys

- Move: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`
- Move aliases: `W`, `A`, `S`, `D`
- Interact: `E`, `Enter`, `Space`

### Queue Resolution

When multiple movement keys are held:

- The most recently active direction key is preferred if it is still pressed.
- Otherwise the fallback priority order is down, left, up, right.

That priority is encoded in `DIRECTION_KEY_PRIORITY`.

## Map Loading And Parsing

The map loader is implemented in `src/map/index.js` and uses helpers from `src/map/parser.js`.

### Files Loaded At Runtime

- `assets/maps/homepage.tmx`
- `assets/maps/tilesheet.tsx`
- `assets/tilesheet.png`

### What The Loader Validates

The loader currently validates that:

- The TMX contains a root `<map>` node
- The TMX contains a `<tileset>` reference
- The TSX loads successfully
- The TSX contains an `<image>` node
- The collision layer length matches `width * height` when a collision layer exists

### Normalized Map Payload

The loader returns a normalized object with:

- Map width and height in tiles
- Tile width and height in pixels
- Pixel width and height of the full map
- Parsed tile layers excluding the collision layer
- Collision metadata
- Normalized TMX object records
- Optional player spawn
- Tileset metadata, including source tile dimensions inferred from the image

### XML Parsing Rules

The parser currently:

- Parses layer CSV into integer arrays
- Converts TMX object Y coordinates from bottom-origin placement to top-left placement by subtracting object height
- Reads TMX custom properties into plain objects
- Normalizes spawn objects into tile coordinates plus facing direction

## Rendering Model

Rendering is handled in `src/game/renderer.js`.

### Layer Ordering

The current render split is positional rather than name-based:

- Background layers: every map layer except the last two
- Foreground layers: the last two map layers

The render order is:

1. Background tile layers
2. Tile-backed TMX objects
3. Player sprite
4. Foreground tile layers
5. Optional hotspot debug overlays

This means the layering behavior depends on the order of layers in the TMX file.

### TMX Object Rendering

TMX objects with `gid >= firstgid` are treated as renderable tile objects.

Important details:

- Object width and height are respected
- Object positions are rounded to nearest pixel before drawing
- The renderer supports objects larger than one tile without forcing them back to `16x16`

### Player Spritesheet Processing

The player sprite loader:

- Loads `assets/player/spritesheet.png`
- Draws it into an offscreen canvas
- Uses the top-left pixel color as the transparency key
- Rewrites matching pixels to alpha `0`

This is a color-key transparency pass rather than relying on native alpha in the source asset.

### Hotspot Debug Overlay

`SHOW_HOTSPOT_HINTS` is currently set to `true` in `src/config.js`.

When enabled, the game draws:

- A translucent yellow hotspot fill
- A yellow outline
- A dark label background
- A yellow prompt/name label

This is useful for authoring and debugging, but it is currently always on unless the constant is changed manually.

## Collision System

Collision data comes from a hidden tile layer named `collisions`.

Rules:

- `0` means walkable
- Any non-zero value means blocked

If the layer is absent, the game falls back to map-bound-only movement and does not block internal tiles.

## Hotspots And Interactions

Hotspot logic is implemented in `src/game/hotspots.js` and routed in `src/main.js`.

### How A Hotspot Is Recognized

A TMX object is treated as a hotspot when `type="hotspot"`.

Hotspot detection is rectangle-based and uses the shared `intersects()` helper.

### Interaction Bounds Resolution Priority

The current bounds resolution order is:

1. `properties.tileX` + `properties.tileY`
2. `properties.tileIndex`
3. Raw TMX object `x` and `y`

This makes it easier to author interaction areas by tile coordinates rather than requiring hand-tuned pixel placement.

### Interaction Routing

When the player overlaps a hotspot and presses an interact key, `src/main.js` resolves the payload in this order:

1. If `contentId === 'contact'`, open `https://www.google.com` in a new tab
2. If `interactionType === 'route'` and `route` exists, navigate with `window.location.assign(route)`
3. If `contentId` matches a record in `HOMEPAGE_CONTENT`, open the modal with that structured content
4. Otherwise open a fallback text modal using `prompt` and `text`

That first rule is important: the current `contact` hotspot does not open the modal copy defined in `src/content.js`; it immediately opens Google in a new tab.

### Modal Behavior

The modal can be closed by:

- Clicking the close button
- Clicking the backdrop
- Pressing `Escape`

While the modal is open, the game loop pauses movement and interaction processing.

## Current Content State

Content records live in `src/content.js`.

### About

- Kicker: `About`
- Title: `A homepage you can walk through`
- Body: two paragraphs describing the explorable-homepage concept

### Projects

- Kicker: `Projects`
- Title: `Selected work lives behind map hotspots`
- Body: two paragraphs
- Bullets:
  - Product design systems and frontend engineering
  - Interactive brand sites and campaign microsites
  - Creative coding, motion, and spatial navigation experiments

### Contact

- Kicker: `Contact`
- Title: `Make the map lead somewhere real`
- Body: placeholder contact-oriented copy

Current runtime note: this record exists, but the `contact` hotspot does not use it because of the hardcoded special case in `src/main.js`.

## Current Authored Map State

The current TMX file is `assets/maps/homepage.tmx`.

### Map Dimensions

- Width: `32` tiles
- Height: `16` tiles
- Tile size: `16x16`
- Pixel size: `512x256`

### Tileset

The map references `assets/maps/tilesheet.tsx`, which currently declares:

- `tilewidth="16"`
- `tileheight="16"`
- `tilecount="176"`
- `columns="11"`
- Image source: `../tilesheet.png`

### Layers

The current TMX contains these tile layers:

- `Camada de Blocos 1`
- `Camada de Blocos 2`
- `Camada de Blocos 3`
- `Camada de Blocos 4`
- `Camada de Blocos 5`
- `collisions`

The first five are rendered. The `collisions` layer is excluded from visual rendering and used only for blocking logic.

### Object Layer

The map currently has one object group: `Camada de Objetos 1`.

That object group contains:

- Decorative renderable TMX tile objects
- Three hotspot objects
- One spawn object

### Current Hotspots

1. `About`
   - Type: `hotspot`
   - `contentId`: `about`
   - `interactionType`: `content`
   - Prompt: `About`
   - Tile anchor: `(16, 5)`

2. `Projects`
   - Type: `hotspot`
   - `contentId`: `projects`
   - `interactionType`: `content`
   - Prompt: `Projects`
   - Tile anchor: `(17, 5)`

3. `Contact`
   - Type: `hotspot`
   - `contentId`: `contact`
   - `interactionType`: `content`
   - Prompt: `Contact`
   - Tile anchor: `(18, 5)`

### Current Spawn

The map currently defines one spawn object:

- Name: `Player Spawn`
- Type: `spawn`
- Raw TMX position: `x=16`, `y=48`, `width=16`, `height=16`
- Normalized spawn tile: `(1, 2)`
- Direction: `down`

## Utility Modules

Shared utilities are intentionally small.

### `src/utils/image.js`

- `loadImage(src)`: Promise-based DOM image loading helper

### `src/utils/math.js`

- `clamp(value, min, max)`
- `roundToNearestPixel(value)`
- `intersects(a, b)`

### `src/utils/index.js`

Re-exports the shared helpers above.

## Compatibility Shims

These files currently exist as lightweight re-export shims:

- `src/game.js`
- `src/map-loader.js`
- `src/utils.js`

They preserve older import paths while the implementation lives in the more structured subdirectories.

## Error Handling

`src/main.js` wraps bootstrap in `try/catch`.

If map bootstrap fails:

- The error is logged to the console
- A centered in-page message is appended to the map shell

Current user-facing error text:

`Failed to load the map. Please refresh or check the console.`

## Current Constraints And Gaps

The project works, but several areas are still intentionally rough or placeholder-level.

### Current Gaps

1. `contact` is hardcoded to open Google instead of using the content record or a real contact destination.
2. Hotspot debug overlays are always enabled through a constant rather than a more flexible runtime toggle.
3. There is no build, lint, test, or packaging workflow in the repository.
4. There are no touch or mobile controls.
5. Layer splitting for foreground/background depends on layer order rather than explicit naming or metadata.
6. Hotspot interaction requires overlap; there is no contextual on-map prompt such as "Press E".
7. Content still lives in JavaScript rather than a more scalable structured content system.
8. There is no persistence, scene switching system, or route-aware map management beyond single-route hotspot support.

### Things That Are Already Solid Enough To Build On

1. The browser-only architecture is simple and easy to reason about.
2. Tiled integration is already end-to-end functional.
3. Collision and spawn handling are implemented cleanly enough for further iteration.
4. The modal system is small but usable.
5. The codebase is already split into sensible runtime modules.

## Recommended Next Documentation Updates

When the implementation changes, this document should be updated if any of the following move:

- Server startup assumptions
- Map file names or asset paths
- Hotspot routing behavior
- Spawn defaults
- Debug flag defaults
- Layer ordering rules
- Content source or schema

## Quick Reference

### Run

```bash
cd /workspaces/site_homepage
python3 -m http.server 8000
```

### Open

```text
http://127.0.0.1:8000
```

### Main Controls

- Move: Arrow keys or WASD
- Interact: E, Enter, or Space
- Close modal: Escape
