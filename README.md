# SVPRNOVA Public Website — V3.1

Static front-end package for `svprnova.org`.

## Routes
- `/` — Homepage
- `/research/` — Research page
- `/chapters/` — Chapters & Research Hubs page

The homepage, Research route, and Chapters route share a lightweight client-side route shell when entered through the root site. Internal navigation uses the History API, so the persistent `<audio>` element stays mounted and the Runox score can continue playing without restarting. Physical `research/index.html` and `chapters/index.html` fallbacks are included for ordinary static hosting and direct route loads.

## Files
- `index.html` — shared homepage/research/chapters shell
- `research/index.html` — direct-load fallback for `/research/`
- `chapters/index.html` — direct-load fallback for `/chapters/`
- `style.css` — global, Research, and Chapters styles
- `script.js` — homepage environment, audio, intro, shared interactions
- `research.js` — client routing and Research-page interactions
- `chapters.js` — Chapters constellation/parallax interactions
- `spectrum.js` — reusable Spectrum prism visualization
- `siteData.js` — public content data
- `assets/` — logo, score, and Runox credit image
