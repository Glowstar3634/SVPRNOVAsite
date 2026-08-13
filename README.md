# SVPRNOVA Public Homepage

A standalone front-end concept for `svprnova.org`, built around the visual system agreed for the public SVPRNOVA website.

## Files

- `index.html` — homepage markup
- `style.css` — brand system, layouts, transitions, responsive behavior, animation styling
- `script.js` — starfield, parallax, scroll reveals, Spectrum simulation, constellation topology, audio controls
- `siteData.js` — centralized copy/data for future page expansion
- `assets/svprnova-mark-light.svg` — transparent light-mark derivative used on dark surfaces
- `assets/svprnova-logo-source.svg` — untouched source SVG supplied for the project
- `assets/svprnova-score.mp3` — web-optimized conversion of the supplied SVPRNOVA music

## Preview

For the most accurate preview, serve the folder from a local web server instead of double-clicking `index.html`:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Audio behavior

Modern browsers generally block audible autoplay until the visitor interacts with the page. The homepage attempts playback on load; if the browser blocks it, the score begins on the first pointer/keyboard interaction. A persistent score toggle is always available in the lower-right corner.

## Future routes

This package intentionally builds only the homepage. Links intended for `/research`, `/chapters`, `/about`, and `/join` can be pointed at those routes as those pages are created. The Portal link already points to `https://svprnova.com/login`.

## Brand palette

- Primary `#5267E8`
- Secondary `#5A0A86`
- Accent `#94B1FF`
- Space 999 `#000000`
- Space 900 `#0F0520`
- Space 800 `#170033`
- Fire 600 `#FF2D00`
- Fire 250 `#FFC901`
- Fire 100 `#FFEB7C`
- Iron 900 `#1E1E20`
- Iron 500 `#3B3B3E`
- Iron 300 `#5C5E63`
- Star 100 `#FFFAEC`
- Star 000 `#FFFFFF`

Display font: Kanit. Body: Space Grotesk. Mono: Space Mono.
