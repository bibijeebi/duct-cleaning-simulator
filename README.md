# Duct Cleaning Simulator

Training simulator for Carolina Quality Air technicians.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Current Version: 1.3.0

### Features

#### Core Gameplay
- **3 Training Scenarios**
  - Residential: Ranch home with attic split system, flex duct
  - Commercial: Dental office with rooftop RTU, rigid metal
  - Courthouse: Multi-day institutional job with PTAC units

- **6-Phase Job Structure**
  1. Pre-Job: Briefing, equipment loadout, vehicle check, route planning
  2. Arrival: Customer contact, site survey with 2D map navigation, hazard check
  3. Setup: Power connection, register removal with condition handling
  4. Execution: Duct cleaning with airflow direction and tool selection
  5. Completion: Photo documentation, before/after gallery, customer walkthrough
  6. Results: Score breakdown with retry option

#### Training Mechanics
- **Equipment Loadout** - Forget critical items and the job fails
- **Vehicle Pre-Trip** - Random events (low fuel, tire issues, unsecured equipment)
- **Register Removal** - Handle painted, stripped, caulked, or brittle registers
- **Airflow Direction** - Whip upstream, vacuum downstream (wrong = penalty)
- **Material Rules** - Flex requires gentle tools; ductboard requires air wash only
- **Hazard Detection** - Mold, asbestos, dead animals (some require stop work)

#### Customer Interactions
- **7 Customer Types** - Helpful, suspicious, micromanager, professional, security, absent, facilities
- **Branching Dialogue Trees** - Choices affect score and relationship
- **Completion Walkthrough** - Before/after photo review with customers

#### Advanced Features
- **Vacuum Gauge Diagnostics** - Learn to read gauge patterns and diagnose issues
- **Multi-Day Courthouse Progression** - 3 days, 3 floors with persistent progress
- **2D Site Map Navigation** - Interactive floor plans for surveying
- **Photo Documentation** - Before/after gallery UI

#### Quality of Life
- **Keyboard Shortcuts**
  - `Esc` - Pause/resume game
  - `Enter` - Advance dialogue/continue
  - `1-9` - Select dialogue options
- **Mobile Responsive** - Works on 375px+ viewports
- **Pause Menu** - Exit to menu or resume

### Scoring System
- Start at 100 points
- Penalties subtract (wrong tool: -10, collapsed duct: -25, ignored hazard: -30)
- Bonuses add (correct hazard protocol: +5, good customer rapport: +3)
- Final grade: A (90+), B (80-89), C (70-79), D (60-69), F (<60)

## Screenshots

*Screenshots coming soon*

<!--
![Main Menu](screenshots/main-menu.png)
![Equipment Loadout](screenshots/equipment-loadout.png)
![Site Map Navigation](screenshots/site-map.png)
![Duct Cleaning](screenshots/duct-cleaning.png)
![Results Screen](screenshots/results.png)
-->

## Project Structure

```
src/
  main.jsx          # React entry point
  DuctSimulator.jsx # Main game component
tests/
  game.test.js      # Game mechanic tests
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (localhost:5173) |
| `npm run build` | Production build |
| `npm run test` | Run tests |
| `npm run test:watch` | Tests in watch mode |

## Using with Claude Code

```bash
# Start Claude Code in this directory
claude

# Useful first commands:
> Read CLAUDE.md and summarize current state
> Run npm test and report results
> Help me add a new feature
```

## Tech Stack

- React 18+ with hooks (useState, useReducer, useEffect)
- Vite for dev/build
- Tailwind CSS via CDN
- Vitest for testing

## Who Made This

Training tool for Carolina Quality Air, based on real job experience at Durham County Courthouse and field training with Jeff Bagley's crew.
