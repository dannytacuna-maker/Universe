# Mission Control architecture

Mission Control is a server-rendered Next.js application with a sidebar dashboard
shell. Domain data stays local-first (IndexedDB) with optional Neon cloud sync.
Observatory intelligence remains a server/cron pipeline.

## Directory responsibilities

```text
app/                     Routes, layouts, route metadata, and global CSS
components/
  dashboard/             App shell, section routing, Home status
  ui/                    Shared presentation primitives (MissionWorkspace, etc.)
  universe/galaxies/     Domain workspaces, repositories, and hooks
  intelligence/          Observatory briefing UI
  mission-control/       Cloud sync hook (deck UI removed)
  auth/                  Clerk gates and account control
lib/                     Shared logic, sync, intelligence, auth
store/                   Dashboard navigation store
types/                   Shared type-level utilities
public/                  Static files
```

## Navigation

Authenticated entry is `app/page.tsx` → `DashboardApp` inside
`DashboardNavigationStoreProvider`. Sections use `?section=` (legacy
`?destination=` is migrated). Grouped sidebar: University, Personal Growth,
plus Home and Observatory.

## Data

IndexedDB database `mission-control` and `/api/mission/sync` sync domain
collections under `components/universe/galaxies/**`. Home schedule reads Google
Calendar through Clerk (`/api/calendar/schedule`). Mission-operating IndexedDB
stores remain inert for compatibility.
