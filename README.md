# Projects Console

A 3D portfolio site. Your projects are cartridges you slot into a console. Built with Vite + Three.js. Works on desktop and mobile, with a plain HTML fallback for no-WebGL / crawlers.

## Run it

```bash
npm install
npm run dev      # opens http://localhost:5173
npm run build    # production build to dist/
npm run preview  # serve the built site
```

## Add / edit projects

Everything reads from one file: [`src/projects.js`](src/projects.js). Each entry becomes a cartridge in 3D **and** a card in the HTML fallback automatically. Fields:

- `title`, `tagline`, `description` — text
- `color` — the cartridge label/ridge color (hex)
- `tags` — array of short strings
- `links` — array of `{ label, url }`

## How it's built

- **`src/main.js`** — the Three.js scene. Console + cartridges are generated procedurally (no 3D asset downloads needed to start). Cartridges are laid out in an arc, float idly, lift on hover, and fly into the console slot when selected. Tap/click uses raycasting; drag-vs-tap is distinguished by pointer travel so orbiting doesn't trigger a selection.
- **Fallback** — `buildFallbackGrid()` always renders the project list as real HTML. If WebGL is unavailable the 3D scene never boots and this stays visible (also what crawlers see).
- **Mobile** — `devicePixelRatio` capped at 2, antialias off on touch devices, `touch-action: none` so we own the gestures.

## Next steps (optional polish)

- Swap the procedural console for a modeled glTF (Blender → Draco/KTX2 compressed) — drop it in and replace `buildConsole()`.
- Add real thumbnails to the cartridge label textures.
- Per-project routes (`/project/mshu`) so links unfurl properly on social.
