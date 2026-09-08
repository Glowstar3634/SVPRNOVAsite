# SVPRNOVA Public Website — V5.3.2

Static front-end package for `svprnova.org`.

## Routes
- `/` — Homepage + ignition sequence
- `/research/` — Research model and Spectrum
- `/chapters/` — Constellation/chapter network
- `/about/` — About, mission, origin, philosophy, and people
- `/join/` — Membership, Premium concept, Chapters/Hubs, Institutional Access, and competitions

Desktop retains the seamless shared client-side route shell and continuous score playback. On iOS/iPadOS WebKit, physical route fallbacks are used and hidden route DOM is discarded after initialization to stay within Safari's tighter per-tab memory/compositor budget.

## Core files
- `index.html` — shared public-site shell
- `style.css` — global visuals and responsive/mobile-WebKit stability profile
- `script.js` — global starfield, ignition, audio, shared visual lifecycle
- `spectrum.js` — shared Spectrum canvas system
- `research.js` — routing + research visuals
- `chapters.js` — Chapters constellation motion/geometry
- `about.js` — About question field
- `join.js` — Join system animations
- `siteData.js` — public content data
- `assets/` — brand, score, founder, artist, and prerasterized noise assets


## V5.3.2 ignition handoff fix
- Removed the mobile-WebKit opacity transition from the full scrolling `<main>` and footer. The homepage remains exactly the same height/layout, but Safari no longer needs to promote a roughly 7,800 CSS-pixel-tall page into compositor tiles when ignition completes.
- The existing full-screen ignition overlay now provides the crossfade by itself; the hero title and copy retain their original post-ignition reveal animations, preserving the visible sequence.
- Tightened the iOS/iPadOS section activation margin so only the hero's decorative motion wakes during the ignition handoff; below-the-fold effects resume as they approach the viewport.
- Desktop launch behavior is unchanged.

## V5.3.1 mobile stability fixes
- Added an iOS/iPadOS WebKit-specific stability profile, detected before first paint.
- The full-screen starfield now uses a stable mobile backing surface and ignores Safari URL-bar-only viewport height changes, eliminating repeated GPU-buffer reallocations during scroll.
- Mobile WebKit starfield and Spectrum canvases use a 1x backing buffer and 30 fps presentation cap while retaining the same geometry, motion, colors, and effects.
- Expensive per-frame canvas `shadowBlur` work is replaced by cached prerendered glow sprites on mobile WebKit.
- Off-screen CSS animations pause on iOS/iPadOS and resume automatically when their section approaches the viewport.
- Hidden homepage/footer animations are paused behind the ignition overlay on every platform.
- Persistent `will-change` compositor reservations are disabled on mobile WebKit.
- Full-screen SVG turbulence noise was replaced with a tiny prerasterized tiled noise texture.
- Fixed-position backdrop filters and redundant blur filters use visually equivalent lower-memory treatments on mobile WebKit.
- The ignition preserves its pulse, supernova, shockwaves, logo resolve, and flicker, but avoids repeatedly rerasterizing filtered surfaces on mobile WebKit.
- MP3 decoder startup is staggered slightly after the ignition blast on mobile WebKit to avoid a transient audio+GPU allocation spike.
- On mobile WebKit, only the active route remains resident; navigation uses the existing physical route fallbacks instead of retaining all five pages and their effect graphs in one tab.
- Desktop behavior and presentation remain unchanged except for the lower-cost prerasterized noise texture and pausing invisible prelaunch animations.
