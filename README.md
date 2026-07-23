# Projects Console

A 3D portfolio site. Your projects are cartridges you slot into a console. Built with Vite + Three.js. Works on desktop and mobile, with a plain HTML fallback for no-WebGL / crawlers.

## Run it

```bash
npm install
npm run dev      # opens http://localhost:5173
npm run build    # production build to dist/
npm run preview  # serve the built site
```

## Deploy

Use `npm run build` and publish the `dist/` directory. Netlify and Vercel configuration files are included for security and cache headers.

Set the production site URL before building so canonical links, social previews, `robots.txt`, and `sitemap.xml` use absolute URLs:

```bash
VITE_SITE_URL=https://your-domain.example npm run build
```

Netlify's `URL` and Vercel's `VERCEL_PROJECT_PRODUCTION_URL` are detected automatically when `VITE_SITE_URL` is not set. A build warning appears when no production URL is available.

## Add / edit projects

Everything reads from one file: [`src/projects.js`](src/projects.js). Each entry becomes a cartridge in 3D **and** a card in the HTML fallback automatically. Fields:

- `title`, `tagline`, `description`, `status` — text
- `color` — the cartridge label/ridge color (hex)
- `cover` — lightweight runtime image used on the cartridge
- `route` — shareable project-page URL
- `tags` — array of short strings
- `links` — array of `{ label, url }`

## How it's built

- **`src/main.js`** — the Three.js scene. Console + cartridges are generated procedurally (no 3D asset downloads needed to start). Cartridges are laid out in an arc, float idly, lift on hover, and fly into the console slot when selected. Tap/click uses raycasting; drag-vs-tap is distinguished by pointer travel so orbiting doesn't trigger a selection.
- **Fallback** — `buildFallbackGrid()` always renders the project list as real HTML. If WebGL is unavailable the 3D scene never boots and this stays visible (also what crawlers see).
- **Mobile** — `devicePixelRatio` capped at 2, antialias off on touch devices, `touch-action: none` so we own the gestures.

## Launch checks

- Verify the homepage and every `/project/.../` route on the production domain.
- Check the résumé, email, LinkedIn, and external project links.
- Test keyboard navigation, reduced-motion mode, a touch device, and the no-WebGL fallback.
- Validate one homepage URL and one project URL in the social-preview debugger for the platform where the portfolio will be shared.
