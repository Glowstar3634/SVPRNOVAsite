# SVPRNOVA Public Website — V2.3

Static front-end package for `svprnova.org`.

## Routes
- `/` — Homepage
- `/research/` — Research page

The homepage and Research route share a lightweight client-side route shell. Internal navigation to `/research` uses the History API, so the existing `<audio>` element remains mounted and the Runox score continues playing without a cut. A physical `research/index.html` fallback is also included so `/research/` works on ordinary static hosting and direct page loads.

## Files
- `index.html` — shared homepage/research shell
- `research/index.html` — direct-load fallback for `/research/`
- `style.css` — global and research styles
- `script.js` — homepage environment, audio, intro, Spectrum visual
- `research.js` — client routing and Research-page interactions
- `siteData.js` — public content data
- `assets/` — logo, score, Runox credit image
