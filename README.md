# SVPRNOVA Public Website — V5.2

Static front-end package for `svprnova.org`.

## Routes
- `/` — Homepage
- `/research/` — Research
- `/chapters/` — Chapters & Research Hubs
- `/about/` — About, mission, origin, philosophy, and people
- `/join/` — Membership, Premium concept, Chapters/Hubs, Institutional Access, and competitions

All five public routes share the same lightweight client-side route shell. Internal navigation uses the History API so the persistent starfield, navigation shell, and `<audio>` element remain mounted; the Runox score can continue playing without restarting. Physical route `index.html` fallbacks are included for static hosting and direct loads.

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

## V5.2 notes
- About and Join use gradient seams between consecutive sections.
- The Join hero guide star orbits the central prompt and migrates to orbit hovered/focused routes.
- The Premium concept map has eight surrounding knowledge/resource nodes and continuously spawns question traces that visit three distinct nodes before returning to the center.
- The center question cycles through a nine-question interdisciplinary bank every six seconds.
- Institutional Access connector paths are calculated from live DOM centers and carry animated research/math/science/opportunity/event/network icons into member nodes.
