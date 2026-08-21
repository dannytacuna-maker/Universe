# Spec 02: Controller and Websites visibility

- ID: `02`
- Slug: `production-center-controller-visibility`
- PRD: `CURSOR FILES/docs/prd/websites-production-center.md`
- Status: approved
- Parallel-safe: no

## Objective

Expose a React controller hook for production-center records and mount visibility only in Forge → Websites system orbit.

## Context

Domain/sync from spec 01 must be usable from the universe viewport the same way University/Jiu-Jitsu instruments are gated by navigation level and system id.

## Dependencies

- Depends on: `01`
- Unlocks: `03`, `04`, `05`
- Shared contracts this spec **creates**:
  - `useWebsitesProductionCenter` (or equivalent) controller with loading, error, CRUD actions, derived pulse counts
  - Visibility predicate: Forge galaxy + Websites system + `navigationLevel === "system"` (+ view settled if that is the local pattern)
- Shared contracts this spec **consumes**:
  - Repository/types from `01`
  - `universe-viewport.tsx` navigation state; `websitesSystem` / `forgeGalaxyId`
- Overlapping paths:
  - `components/universe/universe-viewport.tsx`
  - `components/universe/galaxies/forge/use-websites-production-center.ts` (new)
  - Possibly a thin placeholder dashboard component that returns null or a stub until specs 03–05

## Behavior

1. Hook loads lists on mount when visible (or when Forge websites is active), surfaces `storageError` / loading like peer instruments.
2. Derived pulse: open opportunities count; active projects (stage ≠ `shipped`); attention count for stages `review` | `launch`.
3. Viewport renders the production-center root only when visibility is true; collapsed by default.
4. Does not alter planet click → external URL behavior.

## Acceptance criteria

- [ ] AC-1: Dashboard root is absent in Forge galaxy overview and in other galaxies/systems.
- [ ] AC-2: Dashboard root appears after entering Websites system orbit (when camera/view settled, if that pattern exists).
- [ ] AC-3: Hook exposes create/edit/delete (or archive) actions wired to repository from `01`.
- [ ] AC-4: Planet launches from Websites labels still open external URLs unchanged.

## Non-goals

- Full project/people UI layouts (specs 03–04)
- Planet picker UI details (spec 05)

## Test plan

- Navigate: Universe → Forge → Websites; confirm control appears
- Navigate away; confirm it unmounts
- Edge cases: rapid back navigation; webgl unsupported settled path

## Assumptions

- None beyond PRD visibility assumption (system orbit, not galaxy overview).
