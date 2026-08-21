# Spec 04: Clients and opportunities UI

- ID: `04`
- Slug: `production-center-people-ui`
- PRD: `CURSOR FILES/docs/prd/websites-production-center.md`
- Status: approved
- Parallel-safe: yes

## Objective

Build the People surface: clients, interested opportunities, and a client detail card with related work.

## Context

Leads and client information sit beside projects so Daniel can plan production without leaving Websites orbit.

## Dependencies

- Depends on: `02`
- Unlocks: `none` (shell composition in `05` may embed this panel)
- Shared contracts this spec **creates**:
  - `websites-people-panel.tsx` (clients list, opportunity list, client detail)
- Shared contracts this spec **consumes**:
  - Controller + types from `01`/`02`
- Overlapping paths:
  - `components/universe/galaxies/forge/websites-people-panel.tsx` (new)
  - Shared production-center CSS module people-section classes only

## Behavior

1. List clients with status; filter or emphasize `lead` / `active`.
2. Create/edit client: name required; optional company, contact, notes, status.
3. Create/edit opportunity linked to a client; statuses `open | won | lost | parked`.
4. Client detail shows related open opportunities and projects (read from controller lists).
5. Empty states for no clients / no opportunities.
6. Progressive disclosure for composers and long notes.

## Acceptance criteria

- [ ] AC-1: Create lead client → appears in people list with status `lead`.
- [ ] AC-2: Create open opportunity on that client → shows on client detail and in opportunities list.
- [ ] AC-3: Mark opportunity `won`/`lost`/`parked` persists.
- [ ] AC-4: Client detail lists that client’s projects when any exist.
- [ ] AC-5: Archiving a client does not delete historical projects/opportunities (they remain queryable; UI may badge archived).

## Non-goals

- Project stage board (spec 03)
- Planet linking (spec 05)
- Invoicing / proposals

## Test plan

- Lead → opportunity → open client card → see both
- Edge cases: opportunity without notes; duplicate names allowed

## Assumptions

- [Asumido]: Creating an opportunity requires an existing client (creating client first); no “create client inline” required in v1 if flow is two steps.
