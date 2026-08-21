# PRD: Websites Production Center

- Slug: `websites-production-center`
- Status: approved
- Source: Build a Forge Websites-system dashboard to monitor clients, interest, and site production so Daniel can plan builds and exceed expectations.
- Date: 2026-08-21

## Problem

The Forge Websites system already maps **live shipped sites** as planets, but there is no place inside that system to run the **business and production side**: who is interested, who is a client, what projects are in flight, and where each build sits in the path to launch. Without that center, pipeline and production planning live outside Mission Control, so the universe cannot guide the work that creates the next sites.

## Users

- Primary: Daniel — solo operator of Mission Control; uses the app privately (Clerk is for security, not multi-user collaboration).
- Secondary: N/A

## Goals

- See **active projects in progress** and move them through a simple production pipeline.
- Track **interested clients / leads** separately from contracted work.
- Keep **client information** (contact, notes, status) in one place.
- Optionally **link a project to a live Forge planet** when the site ships or already exists.
- Treat the surface as a **production planning center** for sites, not a public CRM or team workspace.

## Non-goals

- Multi-user / collaborator access, roles, or sharing.
- Invoicing, payments, proposals, contracts, or email automation.
- Auto-creating Forge planets from projects (linking to existing planet definitions only in v1).
- Replacing the live-planet launch / Vercel open behavior.
- Analytics dashboards, revenue charts, or marketing funnels.
- Mobile-native apps or offline-first redesign beyond existing Mission Control sync patterns.

## Scope

### In

- A semantic DOM dashboard available when navigating the **Forge → Websites** system (not galaxy overview only; not a separate galaxy).
- Records: **clients**, **opportunities (interested)**, **projects** with a **simple default production stage** pipeline.
- Client card / detail: identity, contact fields, notes, status, related opportunities/projects.
- Project board or list: stage, client link, optional Forge planet link, notes.
- Opportunity list: interested prospects not yet (or not only) active projects.
- Persistence via the same private Mission Control record + sync path used by other personal instruments (local first, cloud sync under Daniel’s identity).
- UX aligned with recent dashboard simplifications: clear hierarchy, progressive disclosure, less chrome.

### Out

- Editing Forge planet definitions from this dashboard.
- Billing, calendars, Slack/Notion sync, AI auto-writes.
- Custom stage editor UI in v1 (fixed default stages; rename/customization can be later).
- Public or client-facing portal.

## Current behavior

- Forge galaxy contains the **Websites** system (`components/universe/galaxies/forge/`).
- Websites planets are static definitions (`firmus-planets.ts`) that open live URLs / Vercel project pages.
- University, Jiu-Jitsu, Strength, and Reading already use immersive / ops dashboards with repository + sync patterns (`lib/mission-record-sync`, collection APIs).
- There is **no** client/project/opportunity model for Forge today.

## Proposed behavior

1. Enter **Websites** system orbit → Production Center control appears (collapsed summary by default).
2. Open center → three clear areas:
   - **Attention / pipeline pulse** — counts for leads, active projects, blocked/at-risk (if marked).
   - **Projects** — primary work surface; filter or group by stage; advance/retreat stage; open project detail.
   - **People** — clients + interested leads; open client card.
3. Creating a **client** captures name, optional company/contact, status (`lead` | `active` | `paused` | `archived`), notes.
4. Creating an **opportunity** attaches to a client (or creates lead client), with interest note and status (`open` | `won` | `lost` | `parked`).
5. Creating a **project** attaches to a client, starts at first production stage, optional link to an existing Forge planet id, notes / next action.
6. Default stages (simple, fixed for v1):
   1. `discovery`
   2. `design`
   3. `build`
   4. `review`
   5. `launch`
   6. `shipped` (complete; may link planet)
7. Linking a planet is optional and uses known `forgePlanets` ids; does not invent new planets.
8. Closing / minimizing the dashboard restores the Websites spatial view without leaving system orbit.

## Requirements

### Functional

- FR-1: Show Production Center when `selectedGalaxyId === forge` and active system is Websites and navigation is at system level (and settled view), analogous to other system instruments.
- FR-2: Create, edit, archive clients with name, company, contact channels, notes, and status.
- FR-3: Create, edit, close opportunities (interested) linked to a client.
- FR-4: Create, edit, delete/archive projects linked to a client with stage, notes, optional next action, optional `forgePlanetId`.
- FR-5: Move a project forward/back along the default stage list without editing free-form stage strings.
- FR-6: Overview pulse: counts for open opportunities, projects not in `shipped`, and projects in `review`/`launch` (ready to ship attention).
- FR-7: Client detail shows related opportunities and projects.
- FR-8: Persist all records privately through Mission Control sync (same security model as other personal collections; Clerk gates the app).
- FR-9: Optional planet link picker limited to existing `forgePlanets` definitions; display planet name; allow clear/unlink.
- FR-10: Dashboard UX uses progressive disclosure (lists first; composers and long notes behind disclosure) consistent with recent Mission Control dashboards.

### Non-functional

- NFR-1: Single-user; no multi-tenant APIs or sharing endpoints.
- NFR-2: Accessible semantic DOM (keyboard, labels, focus) outside WebGL.
- NFR-3: Does not block Websites planet click → external launch behavior.
- NFR-4: Type-safe records; exhaustive handling for status/stage unions.
- NFR-5: Follow existing sync allowlist / collection envelope patterns; no secrets in client bundles.

## Constraints

- Stack: Next.js App Router, existing Mission Control sync + Clerk, Forge Websites navigation in `universe-viewport`.
- Integrations: Optional read-only link to static Forge planet definitions; no Vercel API required for v1.
- Legal / compliance: Personal private data for Daniel only.
- Time / sequencing: Discovery → specs → implement in waves; v1 is the planning center, not planet authoring.

## Success criteria

- From Websites orbit, Daniel can open Production Center and in one session: add a lead, convert or attach an active project, move it through at least two stages, and optionally link a shipped project to an existing Forge planet.
- Active projects and interested clients are visible without leaving the Websites system.
- Data survives reload via existing sync path.
- Live planet opens still work unchanged.

## Assumptions

- [Asumido]: “Interested clients” map to **opportunities** (and/or clients with status `lead`), while **active projects** are the production board — confirmed objects from intake.
- [Asumido]: Default stages above are acceptable until a later customization feature.
- [Asumido]: Visibility is **Websites system orbit** (not Forge galaxy overview), matching “lives inside the website system.”
- [Asumido]: Storage follows the same collection + sync pattern as University/Reading rather than inventing a new backend.
- [Asumido]: No invoice/proposal fields in v1 schema.
- [Asumido]: Agent discovery docs live under `CURSOR FILES/docs/` per project organization rules.

## Open questions

- None blocking v1. (Optional later: custom stages, auto-create planet stubs, proposal docs.)

## Risks

- Overbuilding CRM chrome — mitigate with progressive disclosure and the same simplification language as recent dashboards.
- Confusion between live planets and in-progress projects — mitigate with clear labels (“Live site” vs “In production”) and optional planet link only.
- Sync allowlist / API envelope miss — mitigate by mirroring an existing collection end-to-end in the first implementation spec.

## Spec split (filled after GATE A)

| ID | Spec | Depends on | Parallel-safe |
|----|------|------------|---------------|
| 01 | Domain types + collections + repository sync | none | no |
| 02 | Controller hook + Websites system visibility | 01 | no |
| 03 | Projects board UI | 02 | yes |
| 04 | Clients + opportunities UI | 02 | yes |
| 05 | Shell + planet link + ARCHITECTURE | 02, 03, 04 | no |

### Implementation order

Wave 1 (blocking):
- `01` — domain + sync (creates shared contracts)

Wave 2 (blocking):
- `02` — controller + viewport visibility

Wave 3 (`/multitask`):
- `03` projects board
- `04` people UI  
Reason: separate panel files; both only consume the controller from `02`

Wave 4 (blocking):
- `05` — compose shell, planet picker, architecture docs

