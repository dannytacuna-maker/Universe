# Mission Control

Mission Control is a personal operating system navigated through an interactive
universe. Galaxies represent major areas of life, while star systems establish
destinations for focused areas such as university courses and personal growth.

The current prototype includes a procedural WebGL universe, staged spatial
navigation, a University galaxy with real course scheduling, and a Personal
Growth galaxy with a local-first Jiu-Jitsu training log.

## Requirements

- Node.js 20.9 or newer
- pnpm 11

## Development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Data and privacy

The Jiu-Jitsu training log currently uses browser-local IndexedDB storage. It is
not synchronized across devices, included in the repository, or sent to a
server. External university documents are also not included in this project.

## Deployment

The application is compatible with Vercel's native Next.js deployment flow.
Production deployments should be created from the `main` branch after the
validation commands below pass.

## Validation

```bash
pnpm check
pnpm build
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the folder responsibilities,
performance boundaries, and growth rules.
