# Tristan Winata — GitHub Homepage

A static GitHub Pages portfolio built around an interactive Three.js render of the hedgehog STL.

## Features

- Optimized 3D hedgehog model (the uploaded ~72 MB / 1.5M-triangle STL was reduced to a ~1.8 MB GLB for the web).
- Model begins at **X = 90°** and continuously spins around the **world Z-axis**.
- Drag / zoom 3D inspection with OrbitControls.
- Responsive portfolio layout with animated project previews.
- Featured repos: Mega Feed Handler, RiverML, Machine Learning Visualizer, and TabDock.
- No build step required.

## Preview locally

Because the page uses ES modules, serve it over HTTP rather than double-clicking `index.html`.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish with GitHub Pages

### Recommended: `HedgehogDubz.github.io`

1. Create a public repository named `HedgehogDubz.github.io`.
2. Copy all files in this folder into the repository root.
3. Push to `main`.
4. In GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → main / root**.
5. The site will be available at `https://hedgehogdubz.github.io/` after GitHub finishes the deployment.

You can also publish this from another repository and enable Pages there.

## Swap in real project recordings

The current cards use lightweight animated canvas previews. If you later want a real MP4/WebM clip, replace a card's `<canvas>` with something like:

```html
<video autoplay muted loop playsinline poster="assets/project-poster.jpg">
  <source src="assets/project-demo.webm" type="video/webm">
  <source src="assets/project-demo.mp4" type="video/mp4">
</video>
```

Then add `object-fit: cover; width: 100%; height: 100%;` to the video in `styles.css`.
