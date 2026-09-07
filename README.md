# SVPRNOVA Public Website — V5.3

Static front-end package for `svprnova.org`.

## Routes
- `/` — Homepage
- `/research/` — Research
- `/chapters/` — Chapters & Research Hubs
- `/about/` — About, mission, origin, philosophy, and people
- `/join/` — Membership, Premium concept, Chapters/Hubs, Institutional Access, and competitions

All five public routes share the same client-side route shell. Internal navigation uses the History API so the persistent starfield, navigation shell, and `<audio>` element remain mounted; the Runox score can continue playing without restarting. Physical route `index.html` fallbacks are included for static hosting and direct loads.

## Core files
- `index.html` — shared public-site shell
- `research/index.html`, `chapters/index.html`, `about/index.html`, `join/index.html` — direct-load route fallbacks using the same shell
- `style.css` — global and route-specific styles
- `script.js` — homepage environment, audio, ignition, and shared interactions
- `research.js` — shared History API routing + Research interactions
- `chapters.js` — Chapters constellation interactions
- `about.js` — About origin thought field
- `join.js` — Join route console, personalized pathway animation, and Institutional Access flow
- `spectrum.js` — reusable Spectrum prism visualization
- `siteData.js` — public content data
- `assets/` — brand, score, founder, and artist assets

## V5.3 performance/stability notes
- Hidden route animations now sleep instead of continuing to render inside the shared route shell.
- Spectrum canvases only animate while their section is near the viewport and the owning route is active.
- The persistent starfield pauses in background tabs, uses a safer mobile backing-store resolution, and debounces mobile viewport resize reallocations.
- Homepage constellation geometry is only recalculated while the constellation section is near the viewport.
- Research, Chapters, About, and Join animation loops are route-aware; mobile/coarse-pointer devices use a visually equivalent 45 fps cap for expensive procedural effects.
- Chapters SVG connector geometry no longer performs continuous layout reads after its parallax has settled.
- Off-screen decorative homepage loops are paused during the ignition overlay, when they are not visible.
- The score no longer blocks ignition while media buffers, and audio/image resources use lighter loading behavior.
- No intentional visual redesigns were made in V5.3.
