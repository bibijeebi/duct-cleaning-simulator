# Duct Cleaning Simulator

A procedural first-person HVAC duct-cleaning training scenario built with Vite, TypeScript, Three.js, Rapier.js, Zustand, and vanilla CSS modules.

## Run

```bash
pnpm install
pnpm dev
```

Open the local URL Vite prints, click the canvas to lock the pointer, then play from the Carolina Quality Air van through the final scorecard.

## Build

```bash
pnpm build
```

The static Cloudflare Pages output is written to `dist/`.

## Controls

- WASD: move
- Shift: sprint
- Mouse: look
- E: interact
- Left-click: use selected tool / clean selected duct
- Right-click: secondary action during stuck-whip events
- 1-9: hotbar select
- Tab: inventory, duct map, and scenario briefing
- Esc: pause
- Space: jump
- C: crouch

## Implemented

- Complete playable scenario from parking-lot van spawn to end scorecard.
- Procedural low-poly parking lot, office suite, drop ceiling, trunk duct, branch ducts, registers, air handler, van, tools, negative air machine, hoses, access holes, patches, and plastic sheeting.
- Rapier-backed first-person collision with pointer lock, gravity, sprint, crouch, and jump.
- Six functional training phases: loadout, assessment, setup, register removal, cleaning, and patching/completion.
- Register condition mini-interactions: painted screws, stripped screws, caulk, brittle plastic, dropped screws, penalties, and missing-screw tracking.
- Cleaning loop with returns-before-supply rule, duct map selection, airflow/vacuum placement, whip insertion, compressor state, material-specific technique penalties, real-time debris reduction, 2D cross-section inset, and problem events.
- Patching loop with mastic, sheet metal patch, screw perimeter, FSK tape, insulation, wrong-material penalties, filter replacement, final walkthrough, and score math.
- In-memory Zustand state only. No localStorage. No GLB/GLTF or external runtime assets.

## Deliberate Scope Cuts

- The office has a two-story exterior facade, but the fully playable job area is the main-floor suite described in the scenario.
- All art is primitive/procedural for Phase 1. The attached concept images were used as visual direction only.
- Asbestos protocol is implemented as a hazard event path, but the default training run favors non-fatal events so a normal playthrough can reach patching and scorecard.
