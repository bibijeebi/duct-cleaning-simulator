# Duct Cleaning Simulator

**Training simulator for Carolina Quality Air technicians.**

Developed for the Carolina Quality Air training program, based on real job training at Durham County Courthouse.

> "Duct cleaning is 20% technique, 80% everything else."

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Current Version: 1.4.0

### What's New in v1.4.0
- **Splash Screen**: Carolina Quality Air branding on startup
- **Demo Mode**: Skip to key moments for quick feature demonstrations
- **Quick Stats Dashboard**: Overview of scenarios, decision points, and coverage
- **Courthouse Default**: The showpiece scenario is now pre-selected
- **Contact Footer**: Easy access to developer contact

## Features

### Training Coverage
- **3 Training Scenarios** - From beginner residential to advanced multi-day courthouse
- **50+ Decision Points** - Equipment selection, customer interaction, hazard response
- **6 Job Phases** - Pre-Job, Arrival, Setup, Execute, Complete, Results
- **7 Customer Types** - Helpful, suspicious, micromanager, professional, security, absent, facilities

### Core Gameplay

#### Scenarios
- **Residential**: Ranch home with attic split system, flex duct (Beginner)
- **Commercial**: Dental office with rooftop RTU, rigid metal (Intermediate)
- **Courthouse**: Multi-day institutional job with 47 PTAC units (Advanced - Recommended)

#### 6-Phase Job Structure
1. **Pre-Job**: Briefing, equipment loadout, vehicle check, route planning
2. **Arrival**: Customer contact, site survey with 2D map navigation, hazard check
3. **Setup**: Access cutting, power connection, register removal with condition handling
4. **Execution**: Duct cleaning with airflow direction and tool selection
5. **Completion**: Photo documentation, before/after gallery, customer walkthrough
6. **Results**: Score breakdown with retry option and training certificate

### Training Mechanics
- **Equipment Loadout** - Forget critical items and the job fails
- **Vehicle Pre-Trip** - Random events (low fuel, tire issues, unsecured equipment)
- **Register Removal** - Handle painted, stripped, caulked, or brittle registers
- **Airflow Direction** - Whip upstream, vacuum downstream (wrong = penalty)
- **Material Rules** - Flex requires gentle tools; ductboard requires air wash only
- **Hazard Detection** - Mold, asbestos, dead animals (some require stop work)
- **NADCA Compliance** - Documentation checkpoints throughout the job

### Customer Interactions
- **7 Customer Types** - Helpful, suspicious, micromanager, professional, security, absent, facilities
- **Branching Dialogue Trees** - Choices affect score and relationship
- **Completion Walkthrough** - Before/after photo review with customers

### Advanced Features
- **Demo Mode** - Skip to key moments (access cutting, hazard discovery, customer confrontation)
- **Vacuum Gauge Diagnostics** - Learn to read gauge patterns and diagnose issues
- **Multi-Day Courthouse Progression** - 3 days, 3 floors with persistent progress
- **2D Site Map Navigation** - Interactive floor plans for surveying
- **Photo Documentation** - Before/after gallery UI
- **Training Certificate** - Printable certificate on successful completion

### Quality of Life
- **Keyboard Shortcuts**
  - `Esc` - Pause/resume game
  - `Enter` - Advance dialogue/continue
  - `1-9` - Select dialogue options
- **Mobile Responsive** - Works on 375px+ viewports
- **Pause Menu** - Exit to menu or resume

## Screenshots

*Screenshots coming soon*

<!--
![Splash Screen](screenshots/splash-screen.png)
![Main Menu](screenshots/main-menu.png)
![Equipment Loadout](screenshots/equipment-loadout.png)
![Site Map Navigation](screenshots/site-map.png)
![Access Cutting](screenshots/access-cutting.png)
![Duct Cleaning](screenshots/duct-cleaning.png)
![Results Screen](screenshots/results.png)
-->

## Scoring System

- Start at 100 points
- Penalties subtract (wrong tool: -10, collapsed duct: -25, ignored hazard: -30)
- Bonuses add (correct hazard protocol: +5, good customer rapport: +3, NADCA compliance: +15)
- Final grade: A (90+), B (80-89), C (70-79), D (60-69), F (<60)

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

## Tech Stack

- React 18+ with hooks (useState, useReducer, useEffect)
- Vite for dev/build
- Tailwind CSS via CDN
- Vitest for testing

## Developed For

**Carolina Quality Air Training Program**

Based on real job experience at Durham County Courthouse and field training with Jeff Bagley's crew.

---

*Questions? Contact benji@asperheim.dev*
