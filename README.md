# Mission Control

Mission Control is a personal operating system navigated through an interactive
universe. Galaxies represent major areas of life. Star systems and stations are
destinations for focused work such as university courses, training, reading, and
intelligence.

## Current capability

- Procedural WebGL universe with staged spatial navigation
- University galaxy with real course schedules and operations records
- Personal Growth galaxy (Jiu-Jitsu, Strength & Physique, Reading, French station)
- Mission operating deck (`Ctrl/Cmd + K`): Identity, Current Vector, Capture, Review, Experiments
- Jarvis (`Ctrl/Cmd + J`): read-only mission intelligence assistant
- Observatory: weekly world-intelligence briefing
- Local-first IndexedDB with authenticated Neon cloud sync (Clerk Google OAuth)

## Requirements

- Node.js 20.9 or newer
- pnpm 11

## Development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Production

Live site: [https://mission-control-universe.vercel.app/](https://mission-control-universe.vercel.app/)

Prefer production deploy with:

```bash
vercel deploy --prod
```

## Update line

**REBIRTH UPDATE: CURSORS INTRODUCTION** — daily orbit instruments, unified command dock, living-cosmos roadmap.

## Validation

```bash
pnpm check
pnpm build
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for folder responsibilities, performance
boundaries, and growth rules.
