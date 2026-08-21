# Spec 05: Shell, planet link, and architecture

- ID: `05`
- Slug: `production-center-shell-planet-arch`
- PRD: `CURSOR FILES/docs/prd/websites-production-center.md`
- Status: approved
- Parallel-safe: no

## Objective

Compose the Production Center shell (pulse + panels), add optional Forge planet linking on projects, and document the feature in ARCHITECTURE.

## Context

Specs 03–04 deliver panels; this wires the full dashboard experience, planet picker from `forgePlanets`, and product architecture notes.

## Dependencies

- Depends on: `02`, `03`, `04`
- Unlocks: `none`
- Shared contracts this spec **creates**:
  - `websites-production-center.tsx` shell composing pulse, projects panel, people panel
  - Planet link select/clear on project create/edit using `forgePlanets`
  - ARCHITECTURE.md section for Websites Production Center
- Shared contracts this spec **consumes**:
  - Panels from `03`/`04`, controller from `02`, `firmus-planets.ts` / `forgePlanets`
- Overlapping paths:
  - `components/universe/galaxies/forge/websites-production-center.tsx` (new)
  - `components/universe/galaxies/forge/websites-production-center.module.css` (or globals)
  - `components/universe/galaxies/forge/websites-projects-panel.tsx` (planet field)
  - `components/universe/universe-viewport.tsx` (swap stub for shell if needed)
  - `ARCHITECTURE.md`

## Behavior

1. Collapsed summary shows pulse counts (open opportunities, active projects, review/launch attention).
2. Expanded layout: pulse → projects (primary) → people (secondary / disclosure ok).
3. Project form includes optional planet select: empty or one of existing planet ids; show planet display name; allow unlink.
4. Linked planet does not change click-to-launch behavior of spatial planets; optional convenience link in UI to open `externalUrl` is allowed.
5. ARCHITECTURE documents: system-orbit instrument, record types, no auto-planet creation, private sync.

## Acceptance criteria

- [ ] AC-1: End-to-end: add lead, add project, advance ≥2 stages, link a planet, reload — data intact.
- [ ] AC-2: Pulse numbers match filtered lists.
- [ ] AC-3: Planet picker only lists current `forgePlanets`.
- [ ] AC-4: ARCHITECTURE.md mentions Websites Production Center and constraints.
- [ ] AC-5: UI stays quieter than a full CRM (progressive disclosure present for secondary fields).

## Non-goals

- Creating new Forge planets
- Vercel API integration
- Billing

## Test plan

- Full Websites orbit walkthrough against success criteria in the PRD
- Edge cases: unlink planet; link then ship stage; open external URL from linked project

## Assumptions

- None.
