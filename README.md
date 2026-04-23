# Pixel Home

Pixel Home is a small interactive homepage prototype built like a top-down pixel-art room. Instead of a static landing page, the site loads Tiled-authored maps, renders them to a canvas, and lets the visitor walk around to trigger in-world hotspots.

The current build includes a secondary hidden room that can be reached through the stairs on the bottom-right tile of the homepage.

## Features

- Browser-only static site
- ES module-based runtime
- TMX and TSX map loading at runtime
- Tile-based movement with animated walking
- Collision layer support
- Hotspot-triggered modal content
- Keyboard controls for movement and interaction

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- Tiled TMX/TSX assets
- Canvas rendering

## Getting Started

This project must be served over HTTP because the app fetches map and asset files at runtime.

### 1. Install Python 3

```bash
sudo apt-get update
sudo apt-get install -y python3
```

### 2. Start a local server

From the repository root, run:

```bash
python3 -m http.server 8000
```

### 3. Open the site

Visit:

```text
http://127.0.0.1:8000
```

## Controls

- Move: Arrow keys or WASD
- Interact: E, Enter, or Space
- Close modal: Escape

## Project Structure

```text
.
|- index.html
|- styles.css
|- README.md
|- documentation.md
|- assets/
|- src/
|  |- main.js
|  |- config.js
|  |- content.js
|  |- game/
|  |- map/
|  |- ui/
|  |- utils/
|- reference/
```

## Runtime Overview

- `index.html` loads the canvas shell and `src/main.js`
- `src/main.js` boots the app and wires hotspot behavior
- `src/map/index.js` loads and normalizes the TMX map and TSX tileset
- `src/game/index.js` handles movement, collisions, interactions, and rendering
- `src/ui/modal.js` controls hotspot modal content
- `src/content.js` stores the current text content for interactive hotspots

## Current Map Behavior

- Primary map: `homepage.tmx` at 32 x 16 tiles
- Secondary map: `hidden_room.tmx` at 16 x 8 tiles
- Tile size: 16 x 16 pixels
- Collision source: hidden `collisions` layer when present
- Spawn source: TMX object with `type="spawn"`
- Homepage hotspots: `About`, `Projects`, `Contact`, and the bottom-right stairs to the hidden room
- Hidden room exit: bottom-right stairs route back to the homepage

## Development Notes

- The app currently has no build step and no package manager setup.
- Opening `index.html` directly from the filesystem is not supported.
- `documentation.md` contains a much more detailed description of the current implementation.
- The `reference/` directory contains source/reference art files used during development and is not required at runtime.

## Next Improvements

- Replace placeholder contact behavior with the final destination or modal content
- Add mobile or touch controls
- Add a runtime toggle for hotspot debug overlays
- Move content records into a more structured content source