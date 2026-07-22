# Mission Control architecture

Mission Control is a server-rendered Next.js application with explicit
boundaries around browser-only state and WebGL. Spatial features grow vertically
inside the universe module while data entry, persistence, and semantic controls
remain outside the render tree.

## Directory responsibilities

```text
app/                     Routes, layouts, route metadata, and global CSS
components/
  ui/                    Reusable framework-facing presentation primitives
  universe/              WebGL/React Three Fiber rendering boundary
lib/                     Framework-agnostic configuration and shared logic
store/                   Typed client-state stores and their React providers
types/                   Shared type-level utilities and domain contracts
public/                  Static files served without transformation
```

New directories are added when real code needs them. In particular, generic
`utils/`, top-level `styles/`, and `assets/` directories are intentionally
omitted: broadly named utility folders lose ownership over time, global styles
already have a route-level home, and Next.js serves static assets from
`public/`. Feature-specific hooks, types, and helpers should remain colocated
with their feature until they are genuinely shared.

## Architectural decisions

### Server components by default

Components remain React Server Components unless they require browser APIs,
interaction, WebGL, or client state. This minimizes shipped JavaScript and
keeps data access on the server by default. Client boundaries carry an explicit
`"use client"` directive.

### Isolated 3D runtime

`UniverseCanvas` owns the React Three Fiber canvas policy. It uses an on-demand
render loop and a bounded device-pixel ratio to protect battery life and GPU
fill rate. `LazyUniverseCanvas` disables server rendering for WebGL and creates
a code-splitting point, so the Three.js stack is not part of routes that do not
render the universe. Scene contents will be composed as children rather than
embedded in the canvas component.

`UniverseViewport` keeps an intentional CSS space background mounted beneath
the canvas, preflights WebGL support, and contains rendering failures without
removing the semantic page structure. The scene uses deterministic static star
layers and a static shader backdrop. Only the camera rig is animated: an
on-demand scheduler invalidates at 30 frames per second while ambient motion is
allowed and is removed entirely for reduced-motion users. The canvas caps DPR at
1.35 so the smoother camera cadence does not increase GPU fill cost on dense
displays. `CameraRig` is the
single future integration point for deliberate navigation toward scene nodes.

### Galaxy placement convention

Galaxy definitions use world-space `[x, y, z]` coordinates relative to the
universe origin. The staging camera remains at `[0, 0, 8]`, looking toward the
origin; navigable destinations live beyond the origin on negative `z`, leaving
the origin clear for camera staging and future transitions. University is
placed at `[-1.45, 0.9, -8.5]` with a visual radius of approximately 2.2 world
units after scale. Personal Growth is placed at `[4.25, -1.15, -9.8]`, lower,
deeper, and opposite University across the staging axis. This preserves a clear
travel corridor and the sense of a wider universe. New galaxies should preserve
deliberate separation in all three axes rather than forming a screen-space grid.

The first galaxy introduces only a compact definition contract and procedural
renderer. Identity data, placement, orientation, palette, and particle
distribution live in the definition; camera travel remains exclusively owned
by `CameraRig`. DOM labels stay outside WebGL so destinations remain semantic,
focusable, and represented when the canvas is unavailable.

### Atmospheric depth

The surrounding cosmos is composed from static, deterministic layers rather
than textures or post-processing. Regionally biased star shells provide varied
density and stellar temperature, while a small number of low-contrast
non-interactive formations imply celestial structure far beyond navigable
destinations. Broad shader fields create spatial depth without particle haze,
blotchy point volumes, textures, or time-based uniforms. These layers share the
existing on-demand scheduler solely through camera parallax and introduce no
independent animation loop. Large-scale deterministic stellar filaments add
coherent directional structure at extreme distance; they rotate only through
the shared ambient scheduler and remain static for reduced-motion users.

The universe origin also contains one non-interactive celestial guardian at
background depth. It is an original astronomical figure rather than a literal
licensed character. A single project-owned transparent image plate provides the
anatomical detail that procedural line geometry could not deliver, while a second
low-opacity additive pass supplies restrained stellar radiance without bloom or
post-processing. The matte preserves the source's soft dust perimeter so the
guardian dissolves into the surrounding starfield instead of reading as a hard
billboard. Its oversized plane extends beyond the top and right view boundaries,
letting the visible body arc behind the destination field. The optimized source
is below one megabyte and remains isolated inside the WebGL boundary; a local
Suspense boundary prevents its load from blocking the rest of the universe. Its
warm antique-gold spectrum is kept behind navigable galaxies and reduced on
portrait screens. The guardian is absent on arrival and may reveal itself only
once per scene mount after fifteen uninterrupted seconds of visible-tab
inactivity. Pointer, keyboard, wheel, and touch activity reset the countdown only
before the reveal begins; once the apparition starts, user input does not dismiss
or interrupt it. Visibility changes or deliberate travel still cancel the effect.
A bounded dust-first, face-second envelope then returns both material passes to
zero opacity. Reduced-motion users do not receive the apparition. The effect owns
no application state, semantic destination, or frame scheduler; its timeout and
passive activity listeners are cleaned up with the component, while the brief
reveal uses the existing ambient invalidation cadence.

Entering University reveals a feature-owned interior stellar field built from
deterministic spiral lanes rather than uniform particle noise. The overview
camera crosses into this larger field so the course systems read as locations
inside a galactic volume. Its only motion is an extremely slow rotation driven
by the existing 30 FPS scheduler, and reduced-motion users receive the same
static spatial structure without rotation. The interior combines fine spiral
lanes, sparse highlights, and a deeper low-luminance volume layer. Their small,
opposing sub-degree rotations create gentle parallax without pulsing, blinking,
or reallocating particle data during animation.
The general starfield reduces its opacity and apparent point size as the camera
enters University and Logistics. This preserves depth without letting unrelated
foreground stars obscure the feature-owned spiral and orbital structures. Its
presence is reduced further in portrait viewports, improving both composition
and mobile fill-rate without changing particle buffers or camera ownership.
Feature-owned luminous layers use restrained additive blending rather than
post-processing bloom. The Logistics core uses a small procedural normal-falloff
shader. Its two orbital guides and markers correspond to the two real weekly
class meetings; they rotate in-plane through the existing system group so the
composition never turns edge-on. Neither adds a frame loop, texture, shadow, or
per-frame allocation.

### Staged spatial navigation

Universe travel is modeled as four explicit levels: the wider universe, a
galaxy overview, an individual system, and a landed planet destination.
Navigation stores separate `selectedGalaxyId`, `selectedSystemId`, and
`selectedPlanetId` values so a child ID never implies its parent. Zustand owns
only this cross-component navigation state;
`UniverseViewport` coordinates semantic DOM controls with the WebGL scene,
while `CameraRig` remains the sole owner of camera position, look target, field
of view, ambient drift, and reduced-motion snapping. Camera poses are resolved
through the small `universe-camera-poses` registry. Adding a future destination
therefore extends definitions and poses without allowing scene objects or
labels to mutate the camera directly.
Motion-enabled travel uses a restrained smoothstep path, a small vertical arc,
and temporary field-of-view compression before returning to ambient drift. The
same poses snap immediately when reduced motion is requested. A monotonic reset
token lets the semantic origin control deliberately replay the universe pose
without moving camera ownership out of `CameraRig`.

`CameraRig` also owns bounded user zoom. Wheel input and the plus/minus keyboard
keys adjust a distance multiplier along the active pose's camera-to-target vector;
zero resets that multiplier. Input is ignored during deliberate travel, does not
prevent native events, and never grants free camera rotation. Reduced-motion users
receive the same zoom as an immediate pose update rather than a damped transition.

The University galaxy contains world-space course-system definitions colocated
under `components/universe/galaxies/university/`. A definition owns identity,
position, camera approach position, palette, scale, deterministic seed,
responsive label placement, and the user-supplied recurring weekly schedule.
Semester dates are not inferred when the source timetable does not provide a
year. Logistics is the first explorable system; the three other real courses and
one cross-course Final Project system are mapped as visible future destinations
with subdued incomplete visuals. Final Project deliberately has no fabricated
meeting schedule. Course labels remain ordinary DOM buttons outside WebGL,
surface concise schedule previews on focus or hover, and preserve complete room
and group details for assistive technology. Every canvas interaction has a
semantic equivalent that survives WebGL failure.

The University overview also derives one semantic weekly timetable directly from
the course-system definitions. It groups the existing meetings from Monday to
Friday, includes the intentionally empty Thursday, and repeats no room, time, or
group configuration. The timetable lives in the DOM overlay rather than WebGL,
appears only after the University camera settles, and preserves semantic table
structure while compact screens restack the week into a vertically scannable
agenda. Each meeting is a keyboard-focusable semantic control that reuses the
same activation and emphasis callbacks as its spatial course label, so schedule
context and the corresponding star system stay perceptually linked without
duplicating navigation state or camera ownership.
An active course may enlarge its own deterministic visual layers for the approach
shot, but it does not move the camera; `CameraRig` remains the only camera-travel
integration point. Logistics currently uses this rule for its deterministic
four-band orbital particle field.

The current spatial level is reflected in a deliberately small query-string
contract: `destination=<galaxy>` selects a galaxy overview,
`destination=<galaxy>/<system>` selects an explorable system, and
`destination=<galaxy>/<system>/<planet>` selects a landed planet. Current deep-link
examples are `destination=university/logistics` and
`destination=personal-growth/jiu-jitsu` or
`destination=personal-growth/strength-physique`. Strength planet deep links are
`destination=personal-growth/strength-physique/beerus-planet`,
`destination=personal-growth/strength-physique/training-archive`, and
`destination=personal-growth/strength-physique/gym-playlist`. Jiu-Jitsu and Reading
planet deep links are `destination=personal-growth/jiu-jitsu/hyperbolic-time-chamber`
and `destination=personal-growth/reading/celestial-library`. URL parsing is pure and
colocated with the universe feature; `UniverseViewport` synchronizes browser history
and Zustand through `pushState` and `popstate`. Unknown or future destinations fall
back to the universe instead of fabricating unavailable navigation. This is client-side
state reflection, not a replacement for future server-owned routes and domain data.

### Personal Growth and real-world visual state

Personal Growth is a feature-owned galaxy with three first-class explorable system
definitions: Jiu-Jitsu, Strength and Physique, and Reading. Daily Discipline was removed
because it no longer represents a required destination. Each renderer receives only the
compact derived progress signal it can communicate spatially. For Jiu-Jitsu, recent
attention affects halo clarity, active-week consistency affects orbital stability,
accumulated sessions affect field depth, and each recorded session contributes one
bounded marker. For Strength and Physique, the six restrained markers correspond to the
current week's Push, Pull, Legs, Push, Pull, Legs rhythm; completed sessions clarify
those markers while recorded lifts modestly strengthen the surrounding structure. The
visualization never reads storage and never owns authoritative records.

Personal Growth records are stored in a feature-owned IndexedDB database named
`mission-control`. Schema version 3 preserves the original Jiu-Jitsu and Strength stores
and adds separate Reading book and session stores. The Strength plan describes muscle
groups and bounded exercise counts rather than prescribing exercises: Push covers chest,
shoulders, and triceps; Pull covers back, rear delts, and biceps; Legs covers legs and
calves, repeated over six sessions. Personal records are limited to bench press, squat,
and deadlift, and body-weight entries retain their measured date. Reading books own
status, page progress, rating, and final reflection; reading sessions own time, page
range, pages read, and session reflection. Repositories and hooks remain feature-colocated;
data is not copied into Zustand. The UI creates no example records, and every base
celestial system is a destination identity rather than a claim of progress.

Personal Growth planets now share one compact definition contract for identity, parent
system, placement, camera pose, landing origin, palette, and semantic label coordinates.
This is the smallest reusable boundary justified by planets across three systems; their
domain dashboards and persistence remain feature-specific. A generic procedural planet
and landing surface handle the lightweight destinations, while Beerus' Planet retains its
specialized renderer. Camera travel remains exclusively owned by `CameraRig`.

Jiu-Jitsu contains the Hyperbolic Time Chamber as a review destination. The existing
session logger is unchanged and remains available in the Jiu-Jitsu system. The landed
dashboard derives weekly and monthly sessions, total hours, sparring rounds, recent
sessions, unique techniques, reflections, mobility completion, and the current month's
training calendar from that same session repository. It writes no parallel analytics
state. Its translucent DOM instrument sits within a procedural chamber environment so
the destination remains spatial while all controls and history remain accessible without
WebGL.

Reading contains the Celestial Library. Its landed dashboard supports adding books,
explicit reading statuses, session logging, page ranges, time, reflections, current
progress, history, planned books, ratings, and final reflections. A pure summary derives
the current book, weekly time and pages, recent reflections, and the next reading queue.
The library uses ordinary forms and semantic history outside WebGL, staged over a quiet
procedural library environment. Records remain local to the current browser and origin.

Strength and Physique contains three landed destinations: Beerus' Planet, Training
Archive, and Gym Playlist. Shared definitions own system-space placement, label
placement, camera pose, surface staging coordinates, identity, and palette. Each marker
uses a deliberately enlarged invisible raycast sphere, while equivalent DOM buttons
remain the authoritative keyboard and non-WebGL interaction. Landing preserves
`CameraRig` as the sole camera owner and hides the parent system field rather than
leaving duplicate scene layers active. Planet entry uses a bounded DOM cloud-cover
transition: cloud layers close before navigation commits, remain over the deliberate
camera path, and clear only after camera arrival. Reduced-motion and non-WebGL users
skip that decorative cover and retain immediate navigation.

Beerus' system marker is a procedural shader planet with a separate cloud shell,
restrained atmosphere, and deterministic orbital debris. Its previous miniature tree
silhouette was removed because its scale did not read coherently in the system view.
The landed surface uses one higher-quality optimized 578 KB project-local environment
plate, a deterministic foreground atmosphere, and a single optimized transparent Whis
image plate. The environment plate has restrained ambient parallax while one inexpensive
procedural veil supplies readable cloud drift, horizon breathing, and a slow travelling
light front; two bounded static particle buffers create dust and distant blossom movement
at separate depths. Whis is
statically grounded with a contact shadow; character bobbing is intentionally absent.
This is a deliberate 2.5D cinematic staging boundary rather than a free-roaming world.
It adds no post-processing, shadows, physics, texture pack, or independent render loop.
All atmosphere motion shares the existing 30 FPS invalidation scheduler and remains
fully static for reduced-motion users.

Whis' semantic training assistant stays outside WebGL and composes the existing
`WorkoutSplit` and `StrengthRecords` components. It therefore reads and mutates the
same IndexedDB-backed Strength records without creating parallel progress state. The
system overview intentionally exposes only planet destinations; the current training
plan, personal records, and weight controls appear only after landing with Whis. The planet
view remains useful when WebGL is unavailable: the destination, back path, Whis welcome,
training program, personal records, and weight tracking all survive independently of
the canvas.

Training Archive stores the user-supplied original PDF as a project-local static asset
and derives a compact typed presentation of its four-week, four-day, two-rotation
powerbuilding structure. The original document remains directly accessible so the UI
does not become a lossy replacement for source material. Gym Playlist is a separate
planet whose DOM panel presents two public user-supplied Spotify playlists side by side
with lazy embedded playback and ordinary external links. Spotify owns media playback;
Mission Control stores no audio or playback state. Both
destination panels arrive as viewport workspaces beneath the persistent spatial navigation
strip and remain present for the duration of the landed view; navigation, rather than a
redundant panel toggle, is the only way to leave them. Both supporting planets use lightweight
procedural markers and static horizon surfaces rather than new texture packs or
rendering loops.

This local-first persistence is intentionally private and useful before an
account backend exists, but it is device-and-browser specific: it is not synced,
backed up, or available across origins. Before multi-device use, a server-owned
repository should implement the same feature boundary with authenticated
ownership, schema migrations, export, and conflict handling. IndexedDB should
then become an explicit offline adapter rather than the sole source of truth.

### Request-safe global state

The Zustand store is created by a factory and exposed through a provider rather
than exported as a browser singleton. This prevents state leaking between
server requests and makes isolated tests straightforward. The initial slice
models the current spatial level and selected destination; server-owned
business data should not be copied into global client state without a concrete
interaction need.

### Route shell without placeholder product UI

The root layout supplies metadata, responsive viewport behavior, global style
tokens, and an application shell. The root route mounts the request-safe
navigation provider around the universe viewport without introducing a
dashboard or unrelated application interface.

### Strict contracts and imports

TypeScript enables strict checking plus unchecked-index, override, and switch
fallthrough safeguards. The `@/` alias creates stable absolute imports.
`Brand` is available for future domain identifiers so structurally identical
IDs cannot be mixed accidentally, without prematurely defining domain models.

### Styling

Tailwind is available for component-level styling. A small global stylesheet
owns only reset behavior, application-wide tokens, and accessibility defaults.
Geist Sans and Geist Mono are self-hosted through the `geist` package at the root
layout, avoiding external font requests and layout shift. Navigation uses Geist
Sans; Geist Mono remains reserved for future metrics, coordinates, or technical
identifiers. The viewport may apply non-interactive CSS vignette and color-field
layers above WebGL for consistent optical framing, but semantic controls remain
above them and the canvas continues to own spatial content. Reduced-motion
preferences are respected before any motion is introduced.

Spatial destination names are arrival-aware. `CameraRig` reports completion once
per deliberate transition, while `UniverseViewport` owns the corresponding DOM
visibility state. Labels therefore remain semantic and outside WebGL but do not
appear until the destination is framed. Reduced-motion travel reports arrival
immediately after the camera snaps. A bounded watchdog restores labels if the
canvas fails during travel, preserving the existing non-WebGL experience.

### External course sources

A deployed browser cannot silently watch arbitrary folders on a user's computer.
Future file-backed courses should enter through a server-owned ingestion boundary,
not through Three.js components or Zustand. The preferred design is a small source
adapter contract with a local desktop companion for watched folders and separate
cloud adapters for providers such as OneDrive or Google Drive. A browser-only
File System Access adapter may be offered as an explicitly granted, Chromium-only
convenience, but it should not be the sole persistence strategy.

Each adapter should emit the same normalized content manifest: stable document ID,
course ID, source path or provider key, content type, modified time, and content
hash. The domain layer can then derive projects, assignments, notes, and future
planet representations from that manifest. Raw documents, extraction, search
indexes, and study-guide generation remain outside the render store. Generated
materials must retain source provenance and require explicit user intent before
document contents are sent to an AI provider. No adapter or planet model is added
until the ingestion workflow is implemented.

Planet dragging should begin only after planets have a persisted domain model.
The future interaction target will project pointer movement onto the system's
orbital plane, convert that intersection to an orbital angle, enforce ordering or
collision rules, and persist the new angle outside WebGL. Three.js transforms will
remain a projection of that state rather than becoming the source of truth. The
same operation will require a keyboard-accessible adjustment path; current schedule
markers are not draggable because their positions encode real meeting data.

### Quality gates

ESLint combines Next.js Core Web Vitals and TypeScript rules. Prettier and its
Tailwind plugin provide deterministic formatting and class ordering. The
`check` script runs type checking, linting, and formatting verification; the
production build remains a separate release-level check.

### Dependency policy

pnpm owns a reproducible lockfile and uses its hoisted linker for reliable
cross-tool resolution on Windows and in common editors. Native install scripts
are denied by default; only `sharp` (Next.js image processing) and
`unrs-resolver` (the lint import resolver) are explicitly allowed. TypeScript
and ESLint are pinned to the newest major versions supported by the current
Next.js lint stack rather than incompatible registry-leading majors.

## Growth rules

- Prefer vertical feature modules once a workspace or universe capability has
  multiple components, hooks, state, and tests.
- Keep Three.js objects and frame-loop work below `components/universe/`; keep
  DOM overlays and controls in ordinary UI components.
- Store authoritative remote data on the server. Zustand is for cross-component
  client interaction state, not an automatic cache for all data.
- Import modules directly. Add barrel files only when they form a deliberate
  public API and do not create circular dependencies.
- Add tests alongside the behavior they verify when the first business rules
  are implemented; avoid empty test infrastructure with no behavior to test.
- Measure before increasing canvas pixel ratio, enabling continuous rendering,
  or adding post-processing.
