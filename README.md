# SVPRNOVA.org Homepage — V1.1

A standalone public-facing homepage concept for SVPRNOVA.org.

## Files

- `index.html` — homepage structure
- `style.css` — visual system, responsive layout, ignition sequence, transitions, and motion
- `script.js` — persistent starfield, parallax, ignition sound/sequence, Spectrum visualization, constellation topology, and background audio
- `siteData.js` — centralized public-site content/data scaffold for future expansion
- `assets/svprnova-logo-source.svg` — supplied source logo
- `assets/svprnova-mark-light.svg` — transparent warm-white logo treatment for dark sections
- `assets/svprnova-score.mp3` — web-optimized version of the supplied SVPRNOVA music

## V1.1 interaction changes

- The site opens on a pure starfield with a distant, unstable ignition star.
- Clicking the star triggers a synthesized sub-bass deep-space impact and supernova transition.
- The ignition object resolves toward the final upper-left SVPRNOVA hero mark.
- The hero mark has a stronger corona, flicker, lens flare, and close-layer mouse parallax.
- Hero typography and controls move with the same environment at a slightly different depth.
- Ambient stars are smaller and use much higher mouse-parallax sensitivity than V1.
- Constellation stars now each have their own deliberately distant depth; their SVG connections follow their moving endpoints.
- The supplied background score begins from the ignition click, which satisfies normal browser user-gesture requirements.

## Local preview

For best behavior, preview through a small local web server rather than opening the HTML directly from disk. For example, from this folder:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Current route placeholders

The public navigation is already pointed toward the intended V1 routes:

- `/research`
- `/chapters`
- `/about`
- `/join`

The Portal button points to `https://svprnova.com/login`.

Only the homepage is implemented in this package, so the `.org` routes above should be added when those pages are built.
