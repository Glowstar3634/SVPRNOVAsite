# SVPRNOVA Public Homepage — V1.2

Static front-facing homepage prototype for `svprnova.org`.

## Files

- `index.html` — homepage structure
- `style.css` — complete visual system, responsive layout, ignition/flare animations
- `script.js` — starfield, reverse parallax, ignition/audio, Spectrum visualization, constellation geometry
- `siteData.js` — content/data scaffold for future page expansion
- `assets/svprnova-logo-source.svg` — exact supplied SVPRNOVA 3.1 source logo
- `assets/svprnova-mark-light.svg` — light-on-dark treatment generated from the exact 3.1 logo geometry
- `assets/svprnova-score.mp3` — web-optimized version of the supplied SVPRNOVA music

## V1.2 changes

- Replaced every logo instance with the supplied SVPRNOVA 3.1 mark.
- Reversed mouse parallax direction throughout the cosmic environment.
- Removed the hero kicker and centered the `SVPRNOVA` title + slogan in their own parallax layer.
- Preserved the hero description/actions in the left-side composition.
- Increased the resolved logo glow substantially.
- Enlarged the lens flare, rotated it 15 degrees clockwise, and synchronized its flicker timing with the logo star.
- Reworked constellation nodes into true stellar point anchors embedded in the starfield.
- Connection lines now recalculate from the rendered center of each star every frame, so they remain attached during depth parallax.
- Reduced vertical padding between major homepage sections.

## Run locally

Open `index.html` directly for a quick preview, or serve the directory through a local static server for the most browser-consistent behavior.

Example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

The music begins from the ignition click, which satisfies normal browser user-interaction requirements for audible playback.
