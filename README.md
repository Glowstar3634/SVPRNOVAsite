# SVPRNOVA Public Website — V5.3

Static front-end package for `svprnova.org`.

## Routes
- `/` — Homepage
- `/research/` — Research
- `/chapters/` — Chapters & Research Hubs
- `/about/` — About, mission, origin, philosophy, and people
- `/join/` — Membership, Premium concept, Chapters/Hubs, Institutional Access, and competitions

All five public routes share the same client-side route shell. Internal navigation uses the History API so the persistent starfield, navigation shell, and `<audio>` element remain mounted; the Runox score can continue playing without restarting. Physical route `index.html` fallbacks are included for static hosting and direct loads.

## V5.3 performance work
- Ignition animation begins immediately on click instead of waiting for the background score to buffer.
- Full-screen starfield automatically adapts particle count, canvas DPR, frame rate, and parallax to mobile / lower-resource hardware.
- Starfield painting is temporarily frozen during the heaviest supernova frames so the launch animation gets the compositor budget.
- Spectrum canvases only animate while near the viewport, use lower DPR/node counts on phones, and replace expensive per-node shadow blur with a cheaper mobile halo.
- Chapters, About, Research, and Join animation loops now stop while their route/section is hidden or offscreen and resume on demand.
- Expensive DOM geometry reads are throttled and mobile parallax is disabled where a coarse pointer makes it unnecessary.
- Mobile CSS removes full-screen blend-mode noise, backdrop blur on fixed UI, several continuous SVG dash effects, and oversized glow radii while preserving the same visual composition.
- Founder and artist images now use optimized WebP assets and lazy decoding; the founder portrait drops from ~2.6 MB to ~70 KB.
- Background score preload changed from `auto` to `metadata` to reduce initial mobile memory/network pressure.
- Google Fonts use `display=swap`.

## Core files
- `index.html` — shared public-site shell
- `research/index.html`, `chapters/index.html`, `about/index.html`, `join/index.html` — direct-load route fallbacks using the same shell
- `style.css` — global and route-specific styles
- `script.js` — homepage environment, adaptive performance profile, audio, ignition, and shared interactions
- `research.js` — shared History API routing + Research interactions
- `chapters.js` — Chapters constellation interactions
- `about.js` — About origin thought field
- `join.js` — Join route console, personalized pathway animation, and Institutional Access flow
- `spectrum.js` — reusable, visibility-aware Spectrum prism visualization
- `siteData.js` — public content data
- `assets/` — brand, score, founder, and artist assets
