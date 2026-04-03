# CLAUDE.md — Oozy Maps

## What to build

A standalone React + TypeScript + Vite app that renders animated Perlin noise on any of 30+ map projections. The user can select a projection, tweak noise parameters with sliders, and watch the texture animate in real time.

This combines two existing projects by Baird:

1. **The animated Goode Homolosine globe** from the homepage of `bairdlangenbrunner.com` — an oozy, animated noise texture rendered on an Interrupted Goode Homolosine projection using D3 and Canvas
2. **The 30-projection system** from `projection-explorer` — all the D3 projection definitions, categories, and rendering logic

## Step 1: Read the source repos

Both repos are on the local filesystem. **Read these before writing any code.**

### Personal website (the noise globe)

```
~/Dropbox/_git_ALL/_github-repos-personal/projects/bairdlangenbrunner.com/
```

This is a Next.js 16 app (App Router). The homepage (`app/page.tsx` or similar) dynamically loads an animated globe component. The README confirms: "Homepage: Animated Interrupted Goode Homolosine projection using D3."

**Find and study these things:**

- The globe/map component — likely a client component in `app/` or a separate component file, possibly loaded via `next/dynamic`. Look for files named something like `globe`, `map`, `homolosine`, `projection`, `noise`, or `hero`.
- The Canvas rendering code — this is almost certainly `<canvas>` with 2D context, doing per-pixel noise rendering
- The noise implementation — could be:
  - A local Perlin/simplex noise function in the codebase
  - An npm dependency like `simplex-noise`, `noisejs`, or similar (check `package.json`)
  - A custom implementation
- The animation loop (`requestAnimationFrame`)
- How noise is sampled: is it 2D in screen space? 3D on the sphere (lon/lat/time)? 4D (x,y,z,time) for seamless spherical wrapping?
- The color mapping: how noise values map to pixel colors (palette, gradient, etc.)
- The projection setup: how `d3.geoInterruptedHomolosine()` is configured
- How the projection boundary/clipping works (pixels outside the projection shape should be transparent)
- Any land/ocean mask or coastline overlay

**Extract the exact noise parameters** (frequency, octaves, speed, etc.) so we can use them as defaults.

### Projection Explorer

```
~/Dropbox/_git_ALL/_github-repos-personal/projects/projection-explorer/
```

This is a React + TypeScript + Vite app. Key files to read:

- The projection definitions file — contains all 30 projections organized into 6 categories (conformal, equal-area, compromise, equidistant, azimuthal, other). Each is a factory function returning a d3 projection instance. Some have special config:
  - Orthographic: clipAngle(90)
  - Stereographic: clipAngle(140)
  - Gnomonic: clipAngle(60)
  - Conic projections: parallels + clipExtent
- `package.json` for dependency versions
- The canvas rendering pipeline (if it uses Canvas — the original version was SVG but the current version may use Canvas)
- How `fitSize`/`fitExtent` scales projections to the viewport

**Copy the full projection definitions** (names, d3 constructor functions, category groupings, clip configs) into the new project.

## Step 2: Create the new project

```
~/Dropbox/_git_ALL/_github-repos-personal/projects/oozy-maps/
```

### Stack

- React 18+ with TypeScript
- Vite
- D3.js v7 + d3-geo-projection v4
- Canvas 2D for rendering
- Whatever noise library the personal site uses (or `simplex-noise` if it's a custom implementation — match the algorithm)

### Initialize

```bash
cd ~/Dropbox/_git_ALL/_github-repos-personal/projects/
npm create vite@latest oozy-maps -- --template react-ts
cd oozy-maps
npm install
npm install d3 d3-geo-projection simplex-noise
npm install -D @types/d3 @types/d3-geo-projection
```

Adjust the noise package based on what the personal site actually uses.

## Step 3: Core rendering pipeline

The rendering approach:

1. **Build an inversion lookup table** when the projection changes:
   - For every pixel (x, y) on the canvas, call `projection.invert([x, y])` to get `[lon, lat]`
   - If `invert` returns null or the point is outside the projection bounds, mark it as empty
   - Store as a `Float32Array` — two floats (lon, lat) per pixel
   - This is the expensive part, but it only needs to recompute when the projection or canvas size changes

2. **On each animation frame**, iterate the noise:
   - For each pixel with valid (lon, lat), sample noise at `(lon, lat, time)`
   - Map the noise value to a color via the color palette
   - Write RGBA to an `ImageData` buffer
   - For pixels outside the projection, write transparent (alpha = 0)
   - `putImageData` to the canvas

3. **Optionally overlay** land boundaries, graticule, or projection outline on a second canvas layer on top

### Noise sampling (seamless on sphere)

To avoid seam artifacts at ±180° longitude, sample noise in **3D Cartesian coordinates on the unit sphere**, not in lon/lat space:

```typescript
// Convert lon/lat (degrees) to 3D point on unit sphere
const λ = lon * Math.PI / 180;
const φ = lat * Math.PI / 180;
const nx = Math.cos(φ) * Math.cos(λ);
const ny = Math.cos(φ) * Math.sin(λ);
const nz = Math.sin(φ);

// 4D noise: 3 spatial + 1 time dimension for animation
const value = noise4D(nx * freq, ny * freq, nz * freq, time * speed);
```

If the personal site uses a different approach (e.g., 2D noise in lon/lat, or 3D noise with time as z), **match that first** — the goal is to reproduce the homepage look, then generalize.

### Octave stacking (fBm)

For richer textures, stack multiple octaves:

```typescript
function fbm(nx, ny, nz, t, octaves, lacunarity, persistence) {
  let value = 0, amplitude = 1, frequency = 1, maxAmp = 0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise4D(nx * frequency, ny * frequency, nz * frequency, t);
    maxAmp += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  return value / maxAmp; // normalized to [-1, 1]
}
```

### Performance

Inverting every pixel every frame is expensive. Key optimizations:

- **Cache the lon/lat lookup**: only recompute when projection or canvas size changes
- **Render at reduced resolution**: e.g., canvas at 50% of display size, scaled up with CSS. Let the user toggle between "draft" and "full" resolution.
- **Skip empty pixels**: the lookup table marks which pixels are outside the projection — skip them in the noise loop
- **Use `ImageData` directly**: avoid per-pixel `fillRect` calls; write to the `Uint8ClampedArray` buffer and `putImageData` once per frame
- **Consider Web Workers** if the main thread can't keep up — offload the noise computation

## Step 4: UI

### Design system

Match the aesthetic from projection-explorer: dark theme, clean, monospace + serif fonts.

- **Background**: `#0a0c10`
- **Surface**: `#12151c`
- **Text**: `#c8cdd8`
- **Text dim**: `#5a6070`
- **Accent**: `#e85d3a`
- **Fonts**: DM Mono (monospace), Instrument Serif (headings)
- **Lowercase** for all UI text (no capitalization, even at start of labels)

### Layout

```
┌──────────────────────────────────────────────────────┐
│  oozy maps                      [projection picker ▾] │
├──────────────────────────────────────────────────────┤
│                                                       │
│               [canvas — full width]                   │
│           animated perlin noise fills                 │
│           the projection silhouette                   │
│                                                       │
├──────────────────────────────────────────────────────┤
│  frequency ══════●══════  1.0    speed ══════●══  0.3 │
│  octaves   ═══●═════════  3      lacunarity ══●══ 2.0 │
│  persistence ═══●═══════  0.5    amplitude ═══●══ 1.0 │
│  central longitude ════════════●══════════════  0°    │
│  [resolution: draft / full]   [overlay: none ▾]       │
└──────────────────────────────────────────────────────┘
```

### Projection picker

Reuse the exact same 30 projections and 6-category grouping from projection-explorer. A dropdown grouped by category is probably cleanest here (unlike projection-explorer which uses button groups). Include the Interrupted Goode Homolosine as the default selection since that's the one from the homepage.

**Important**: The Interrupted Goode Homolosine is `d3.geoInterruptedHomolosine()` from d3-geo-projection. It may not be one of the current 30 in projection-explorer — if not, **add it** as an additional projection. This is the signature projection for this app and should be the default.

### Sliders

| Parameter        | Range       | Default | Step | Description                                         |
|------------------|-------------|---------|------|-----------------------------------------------------|
| frequency        | 0.1 – 8.0  | *       | 0.1  | Spatial frequency of noise on the sphere             |
| speed            | 0.0 – 2.0  | *       | 0.01 | Time evolution speed of animation                    |
| octaves          | 1 – 8      | *       | 1    | Number of noise layers stacked (fBm)                 |
| lacunarity       | 1.0 – 4.0  | *       | 0.1  | Frequency multiplier between octaves                 |
| persistence      | 0.1 – 1.0  | *       | 0.05 | Amplitude decay between octaves                      |
| amplitude        | 0.1 – 3.0  | *       | 0.1  | Overall intensity/contrast                           |
| central longitude| -180 – 180  | 0       | 1    | Re-centers the projection                            |

`*` = Use defaults extracted from the personal site's globe component. If you can't determine them, use: frequency=1.5, speed=0.3, octaves=4, lacunarity=2.0, persistence=0.5, amplitude=1.0.

Each slider should display its current numeric value.

### Color palette

Extract the color mapping from the personal site's globe. If it's a simple gradient (e.g., dark-to-light with a specific hue), reproduce it exactly. Consider also offering a few preset palettes:

- **Homepage** (the default — whatever the personal site uses)
- **Thermal** (dark blue → cyan → yellow → red)
- **Monochrome** (black → white)
- **Earth** (ocean blue → land green/brown)
- **Custom** (let the user pick two or three colors)

### Optional overlays

A toggle or dropdown to overlay on top of the noise:

- **None** (just the noise)
- **Coastlines** (TopoJSON land boundaries, thin stroke)
- **Graticule** (lat/lon grid lines)
- **Both**

These should render on a separate canvas or SVG layer above the noise canvas, using the same projection.

### Additional controls

- **Pause/play** button to freeze the animation
- **Resolution toggle**: draft (half-res, smooth) vs. full (pixel-perfect, slower)
- **Reset** button to restore all defaults
- **Randomize** button — pick random noise parameters for happy accidents

## Step 5: File structure

```
oozy-maps/
├── public/
├── src/
│   ├── App.tsx                  # Main layout, state management
│   ├── App.css                  # Global styles
│   ├── main.tsx                 # Entry point
│   ├── components/
│   │   ├── NoiseCanvas.tsx      # Core canvas rendering + animation loop
│   │   ├── ProjectionPicker.tsx # Dropdown grouped by category
│   │   ├── SliderPanel.tsx      # All parameter sliders
│   │   ├── OverlayCanvas.tsx    # Coastlines + graticule overlay
│   │   └── Controls.tsx         # Pause, reset, randomize, resolution
│   ├── data/
│   │   └── projections.ts       # All projection definitions (30 from explorer + Interrupted Goode Homolosine)
│   ├── lib/
│   │   ├── noise.ts             # Noise sampling + fBm wrapper
│   │   ├── colormap.ts          # Noise value → RGBA color mapping
│   │   └── invertLookup.ts      # Projection inversion lookup table
│   └── types.ts                 # Shared TypeScript types
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── CLAUDE.md                    # This file
└── README.md
```

## Style rules

- Lowercase for all UI text (no capitalization, even at start of labels)
- Match projection-explorer's dark theme and typography
- Sliders should be styled to match the existing central longitude slider aesthetic
- Canvas should fill the available width, with aspect ratio determined by the projection's natural shape
- Responsive: on mobile, stack sliders vertically below the canvas

## What success looks like

1. Opening the app shows the Interrupted Goode Homolosine with animated Perlin noise that looks like (or very close to) the homepage of bairdlangenbrunner.com
2. Switching to Mercator, Mollweide, or any other projection instantly re-renders the noise in that projection's shape
3. Moving sliders produces immediate visual feedback — the noise gets choppier, smoother, faster, more layered, etc.
4. The animation is smooth (targeting 30+ fps at draft resolution on a modern laptop)
5. The projection boundary clips cleanly — no noise bleeds outside the projection silhouette

## Known gotchas

- `d3.geoInterruptedHomolosine()` is an interrupted projection — its `.invert()` may not work for all pixels within the bounding box (the gaps between lobes return null). Handle this the same as out-of-bounds pixels (transparent).
- Some projections (Gnomonic, Stereographic) have limited domains — `invert` will return null for most of the canvas. This is expected; just show noise where valid.
- The Orthographic projection only shows one hemisphere — noise will only fill that half-circle.
- `simplex-noise` v4+ uses ESM and a different API than v3. Check which version you install.
- For 4D noise (needed for seamless spherical animation), you need a noise library that supports it. `simplex-noise` supports `noise4D`. If using a different library, verify 4D support.
- Conic projections in projection-explorer use bounded graticules for `fitExtent` and explicit `clipExtent` — replicate that handling here or the projection will render incorrectly.

## Git setup

After creating the project:

```bash
cd ~/Dropbox/_git_ALL/_github-repos-personal/projects/oozy-maps/
git init
git add -A
git commit -m "initial commit: oozy maps app"
```

Don't create the GitHub repo yet — Baird will do that when ready.
