# Spec 03: Projects board UI

- ID: `03`
- Slug: `production-center-projects-board`
- PRD: `CURSOR FILES/docs/prd/websites-production-center.md`
- Status: approved
- Parallel-safe: yes

## Objective

Build the primary Projects surface: list/group by stage, create/edit, and move projects along the default pipeline.

## Context

Production Center’s main job is planning site production. Projects are the primary work surface; people UI is separate (spec 04).

## Dependencies

- Depends on: `02`
- Unlocks: `05`
- Shared contracts this spec **creates**:
  - `websites-projects-panel.tsx` (or equivalent) component API consuming the controller from `02`
- Shared contracts this spec **consumes**:
  - Controller + types from `01`/`02`
- Overlapping paths:
  - `components/universe/galaxies/forge/websites-projects-panel.tsx` (new)
  - Shared CSS module or globals classes scoped to production center **only if** introduced as `websites-production-center.module.css` project-section classes (coordinate with 04/05 to avoid fighting the same selectors in one wave)

## Behavior

1. Show projects grouped or ordered by stage (discovery → shipped).
2. Create project: require client, default stage `discovery`, optional notes/next action; planet link can be stubbed until spec 05.
3. Edit project fields; advance/retreat stage via explicit controls (not free-text stage).
4. Empty state when no projects.
5. Progressive disclosure for long notes; quiet chrome consistent with recent dashboards.

## Acceptance criteria

- [ ] AC-1: New project appears under `discovery`.
- [ ] AC-2: Advance/retreat moves stage one step and persists after reopen.
- [ ] AC-3: Shipped projects remain visible but visually secondary (or filterable); still listed.
- [ ] AC-4: Cannot set an invalid stage string from the UI.
- [ ] AC-5: Keyboard-accessible controls with labels.

## Non-goals

- Full client/opportunity CRUD UI (spec 04)
- Planet picker (spec 05) — optional disabled field or “coming” omit is fine

## Test plan

- Create project → advance to `build` → reload → still `build`
- Edge cases: project with archived client; only one stage step per click

## Assumptions

- [Asumido]: Stage groups as sections/columns is acceptable; exact layout left to implementer within progressive-disclosure constraints.
