# SVPRNOVA Public Website — V4.2

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


## V4.2 Chapters direction
The `/chapters/` route is one continuous constellation scene rather than a stack of independent page sections. The graph moves from the SVPRNOVA network/platform ecosystem into the University Chapters cluster and then the Research Hubs cluster, with both local structures connected directly to the same Constellation core. Northwestern is shown as the founding/flagship university node; unnamed future chapter nodes remain intentionally dormant.
