# Mission Control

Personal operations dashboard for university, training, reading, French, and
Observatory intelligence. Local-first IndexedDB with optional Neon sync behind
Clerk Google auth.

## Stack

- Next.js App Router
- Clerk (Google OAuth)
- Neon (optional cloud sync)
- Vercel

## Development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Validation

```bash
pnpm check
pnpm build
```

## Production

Live: [https://mission-control-universe.vercel.app/](https://mission-control-universe.vercel.app/)

Architecture notes live in [`CURSOR FILES/ARCHITECTURE.md`](./CURSOR%20FILES/ARCHITECTURE.md).
