# Duct Cleaning Simulator

## Project Overview

Training simulator for Carolina Quality Air technicians. Goal: play through scenarios, show up to real job sites, fail at nothing.

**Core thesis:** Duct cleaning is 20% technique, 80% everything else (logistics, problem-solving, communication).

## Tech Stack

- React 18+ with hooks (useState, useReducer, useEffect)
- Vite for dev/build
- Tailwind CSS via CDN (no build step)
- Single-file component architecture (for now)

## Code Style

- Functional components only, no classes
- useReducer for game state management
- Descriptive action types: `SET_PHASE`, `ADD_PENALTY`, `CLEAN_DUCT`
- Keep components under 150 lines when possible
- Use Tailwind utility classes, dark theme (zinc-900 backgrounds, yellow-500 accents)

## Game Structure

### 6 Phases
1. **Pre-Job:** Job briefing → Equipment loadout → Vehicle check → Route planning
2. **Arrival:** First contact → Site survey → Hazard check
3. **Setup:** Power connection → Register removal
4. **Execution:** Duct cleaning with airflow direction + tool selection
5. **Completion:** Quality check → Reassembly → Customer walkthrough
6. **Results:** Score breakdown, retry option

### 3 Scenarios
- `residential`: Ranch home, attic split system, flex duct
- `commercial`: Strip mall dental office, RTU, rigid metal, roof access
- `courthouse`: Durham County, PTAC units, multi-day, historic building

### Key Mechanics
- **Equipment loadout:** Forget critical items = job fails. Forget minor items = penalties.
- **Vehicle pre-trip:** Random events (low fuel, check engine, tire issue, unsecured equipment)
- **Register removal:** Conditions (normal, painted, stripped, caulked, brittle) require correct approach
- **Airflow direction:** Whip UPSTREAM, vacuum DOWNSTREAM. Wrong = ineffective clean + penalty.
- **Material rules:** Flex = gentle only (aggressive = collapse). Ductboard = air wash only (contact = fiber release).
- **Hazards:** Mold/asbestos = STOP WORK immediately

### Scoring
- Start at 100 points
- Penalties subtract (wrong tool: -10, collapsed duct: -25, ignored hazard: -30)
- Bonuses add (correct hazard protocol: +5, good equipment choice: +3)

## File Structure

```
src/
  main.jsx          # React entry point
  DuctSimulator.jsx # Main game component (all-in-one for now)
tests/
  game.test.js      # Smoke tests for core mechanics
```

## Commands

```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Production build
npm run test     # Run tests
```

## Current State (v1.3.0)

All planned features implemented:
- ✓ All 3 scenarios playable (residential, commercial, courthouse)
- ✓ 6-phase structure complete
- ✓ Equipment loadout with penalties
- ✓ Vehicle pre-trip random events
- ✓ Register removal with conditions/approaches
- ✓ Airflow direction enforcement
- ✓ Material-specific tool rules
- ✓ Hazard detection (mold, asbestos, dead animal)
- ✓ Problem scenarios (painted screws, breaker trips, etc.)
- ✓ Scoring system with grade breakdown
- ✓ Customer dialogue trees (7 customer types, branching conversations)
- ✓ Completion dialogue trees (walkthrough with customer)
- ✓ Vacuum gauge diagnostics training
- ✓ Multi-day courthouse progression (3 days, 3 floors)
- ✓ 2D site map navigation (interactive floor plans)
- ✓ Before/after photo gallery UI
- ✓ Keyboard shortcuts (Esc pause, Enter advance, 1-9 select)
- ✓ Mobile responsive design (375px+)
- ✓ Pause menu with resume/exit

### Multi-Day Courthouse Features
- Day 1: Floor 1 (Ground Level - Courtrooms A & B, Clerk offices)
- Day 2: Floor 2 (Courtroom C, Judge chambers)
- Day 3: Floor 3 (Admin offices, Records room, PTAC units)
- End of day: Pack up equipment, security checkout, day summary
- Start of day: Security check-in, equipment setup, callbacks from previous days
- Random events reference previous days ("Security remembers you...")
- Progress persists across days (cleaned ducts stay clean)

## Testing Notes

When adding tests, focus on:
1. State transitions (phase progression)
2. Penalty/bonus calculation
3. Material + tool compatibility matrix
4. Airflow direction validation
5. Register condition + approach outcomes

## Who Made This

Training tool for Carolina Quality Air, based on real job experience at Durham County Courthouse and field training with Jeff Bagley's crew.
