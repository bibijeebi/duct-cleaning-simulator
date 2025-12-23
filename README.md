# Duct Cleaning Simulator

Training simulator for Carolina Quality Air technicians.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Using with Claude Code

```bash
# Start Claude Code in this directory
claude

# Useful first commands:
> Read CLAUDE.md and summarize current state
> Run npm test and report results
> think hard about what's missing for V1.2
```

## Project Structure

```
├── CLAUDE.md           # Project context for Claude Code
├── src/
│   ├── main.jsx        # React entry
│   └── DuctSimulator.jsx  # Main game (2000+ lines)
├── tests/
│   └── game.test.js    # Smoke tests
├── package.json
└── vite.config.js
```

## Current Version: 1.1

### Implemented
- 3 scenarios (residential, commercial, courthouse)
- 6-phase job structure
- Equipment loadout with penalties
- Vehicle pre-trip random events
- Register removal mechanics
- Airflow direction enforcement
- Material-specific tool rules
- Hazard detection
- Scoring system

### Roadmap (V1.2)
- Customer dialogue trees
- 2D site map navigation
- Multi-day job progression
- Vacuum gauge diagnostics
- Before/after photo UI

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run test` | Run tests |
| `npm run test:watch` | Tests in watch mode |
