# Developer Build Notes

This project is organized so a junior developer can safely change one layer at a time.

## Where To Look

- Gameplay state and scoring: `src/state/gameStore.ts`, `src/systems/scoring.ts`
- Scenario layout, registers, rooms, access holes: `src/data/scenario.ts`
- Duct graph and material rules: `src/data/ductNetwork.ts`
- Equipment names, categories, hotbar defaults: `src/data/equipment.ts`
- Three.js environment and collision helpers: `src/scene/SceneManager.ts`
- Procedural office geometry: `src/scene/Building.ts`
- Parking lot, van spawn, and exterior: `src/scene/ParkingLot.ts`
- Air handler and mechanical room props: `src/scene/MechanicalRoom.ts`, `src/entities/AirHandler.ts`
- First-person movement: `src/player/Controller.ts`
- Raycast interaction prompts and E-key routing: `src/player/Interaction.ts`
- Phase rules: `src/phases/*.ts`
- HUD, loadout, inventory, duct cross-section, scorecard: `src/ui/*.ts` and `src/ui/hud.module.css`
- Audio loops: `src/systems/audio.ts`

## Change Rules

1. Change scenario facts in `src/data/*` first. Avoid hardcoding positions in phase files.
2. If a new object can be clicked, put its metadata in `mesh.userData.interactive` and let `Interaction.ts` route it.
3. If a new action affects score, use `addScoreEvent` in `gameStore.ts` so the scorecard can explain it.
4. If a phase can advance, add the completion logic to that phase file only. Do not advance phases from random UI handlers.
5. If collision changes, update the matching visual mesh and Rapier collider together through `SceneManager.addBoxCollider`.
6. Keep the DOM HUD vanilla. No React. No localStorage.

## Current Scenario Boundary

The first playable job is a small commercial office suite: van spawn, assessment, setup, removal, cleaning, patching, walkthrough, and scorecard. The building exterior shows two stories, while the simulated job is the fully playable main-floor suite.
