# Spec 01: Production center domain and sync

- ID: `01`
- Slug: `production-center-domain-sync`
- PRD: `CURSOR FILES/docs/prd/websites-production-center.md`
- Status: approved
- Parallel-safe: no

## Objective

Define client, opportunity, and project record types plus Mission Control collection wiring so production-center data can persist privately like other personal instruments.

## Context

v1 needs clients, opportunities (interested), and projects with fixed production stages, stored via the existing mission-record sync path under Daniel’s identity.

## Dependencies

- Depends on: `none`
- Unlocks: `02`, `03`, `04`, `05`
- Shared contracts this spec **creates** (APIs, types, schema, routes):
  - Types: `WebsitesClient`, `WebsitesOpportunity`, `WebsitesProject`, status/stage unions, create/update inputs
  - Collection store names registered in `lib/mission-record-collections.ts` (and any ID helpers)
  - Repository module under `components/universe/galaxies/forge/` (or adjacent) with list/save/update/delete for the three collections
- Shared contracts this spec **consumes**:
  - `lib/mission-record-sync.ts`, `lib/mission-record-collections.ts`, server mission-record allowlist if required
- Overlapping paths (files, routes, tables this spec would change):
  - `lib/mission-record-collections.ts`
  - `lib/server/mission-record-database.ts` or related allowlists if collections are gated
  - `components/universe/galaxies/forge/websites-production-*.ts` (new domain/repository files)

## Behavior

1. Introduce fixed stage union: `discovery | design | build | review | launch | shipped`.
2. Client status: `lead | active | paused | archived`.
3. Opportunity status: `open | won | lost | parked`; each opportunity references `clientId`.
4. Project references `clientId`, has `stage`, optional `forgePlanetId`, notes / nextAction fields as needed by PRD.
5. Register three collections and ensure get-id helpers work for sync.
6. Repository exposes typed CRUD that writes through mission-record sync (same pattern as University/Reading).
7. Reject or ignore unknown `forgePlanetId` values at the domain/repository boundary when saving (must be empty or a known planet id from `forgePlanets`).

## Acceptance criteria

- [ ] AC-1: TypeScript unions for stage/status are exhaustive-switch friendly (`never` default possible for consumers).
- [ ] AC-2: Creating a client/opportunity/project via repository returns a stable id and appears in list after reload path used by other records.
- [ ] AC-3: Updating project stage persists and reloads correctly.
- [ ] AC-4: Saving a project with a non-existent `forgePlanetId` fails validation or clears the invalid link (documented choice in code comments / error message).
- [ ] AC-5: New collections are included in the mission-record collection registry used by sync bootstrap.

## Non-goals

- UI
- Viewport mounting
- Custom stage configuration

## Test plan

- Unit/typecheck: `npx tsc --noEmit`
- Manual or repository-level: save client → opportunity → project → reload list
- Edge cases: empty notes; archived client still referenced by project; invalid planet id

## Assumptions

- [Asumido]: Three separate collections (not one polymorphic store) — simpler sync and queries.
