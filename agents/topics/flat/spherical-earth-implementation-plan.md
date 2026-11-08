# Spherical Earth Feature

Status: M1-M4 completed on 2026-11-08 under the owner's independent-execution requests.
The [execution record](spherical-earth-implementation-execution.md#final-m4-report)
owns completed deliverables, final rendering comparisons, performance/lifetime
evidence, consequential fixes and verification limits.
The [Flat entry](README.md) owns current application behavior. The date/parser
design decisions remain preserved and separate.

## Outcome And Completion

Add Spherical Earth as an independently registered production page in Flat.
It renders an observer-level spherical ground, atmosphere, distant Sun and the
existing brightest-2,000 star catalog at the shared location and timestamp.
This is the spherical counterpart to the existing Flat Earth scene, rather
than a map, orbiting globe browser or a replacement application shell.

Completion requires:

- Select Spherical Earth in either workspace view or open `/flat/spherical-earth`.
  Retain the current empty initial selection. Support one spherical view, mixed
  Flat/spherical views, and two independently controlled spherical views.
- Consume the existing shared geographic location and absolute timestamp. Wait
  for a location when missing. Each view owns direction, height, vertical FOV,
  renderer/camera/scene and context resources. Changing shared time/location
  updates every mounted scene; closing one view releases only its resources.
- Provide the existing compact icon-toolbar pattern and contributed Camera/sky
  configuration, using shared MUI controls and context defaults: small/outlined,
  with explicit supported props taking precedence. Preserve pointer-look,
  Center on Sun, height/FOV presets and Sky modes. The Flat degrees-from-closest
  editor remains Flat-owned and continues to change the same shared timestamp.
- Use production Algorithm32 spherical geometry/distant-Sun transport with the
  existing deployed shared cache, canonical Bruneton atmosphere, Native15/N4,
  corrected60-sun035 and monotone-cubic lookup. Preserve supported 40 km coverage,
  actual spherical horizon/occlusion and established high-altitude integration.
  Use Flat's selected color/human stellar presentation consistently; compare
  reference renders with explicitly matching color/exposure settings.
- Retain compatible scene/program/cache resources for ordinary time/height edits.
  Update necessary physical source/receiver facts and lighting. FOV/mouse look
  redraw the retained scene. Hold the last complete frame during preparation
  or failure, publish coherent candidates, and preserve retry/context recovery.
- Run locally and as a discoverable app with Flat-owned routes, worker output
  and deployable data. Runtime operation must not require a running Flat32 app,
  its server routes, its source tree, an experiment or an external repository.

No timezone/parser implementation, new time UI, terrain/maps, extra scene objects,
camera linking, global workspace redesign, new scattering research, generated
cache replacement or suspended-experiment work. The current timestamp already
supplies the instant needed for solar/star placement. A ground object is required.
Use the existing green visual ground treatment without changing the baked
physical ground-boundary configuration.

## Starting Evidence And Important Differences

Production references, inspected read-only for this plan:

- `src/flat32/SphericalDistantMode.js`, `DistantSunSceneState.js` and
  `Algorithm32Runtime.js`: configured spherical scene, distant-source placement,
  shared attachment preparation, receiver measurement and retained publication.
- `src/flat32/SharedDistantCacheAssets.js` and `DistantSunSceneCacheResolver.js`:
  authenticated metadata selection and engine transport integration. Adapt their
  responsibilities into Flat services; do not import these files at runtime.
- `server/flat32/features/shared-cache/` and its router: package authentication,
  selection and delivery. The service currently imports Flat32 constants;
  extract genuinely reusable engine-format contracts into neutral ownership
  before sharing that implementation with Flat.
- [Current 40 km package and horizon coverage](../production-app/product-behavior/forty-km-elevation.md):
  selected package `1e35e0ce4b064690d48ff9639c4c7a1ad557e1eb752716c9f2105a3ac8354e4b`,
  report SHA-256 `85d8230697d6ea7ac18ac2a83ac2d526ed59cd9476c65dca3d251a2ebf508d68`.
  Source selection agrees with the current server. This supersedes older 10 km
  and per-scene-package descriptions for this implementation.
- [Shared transport](../production-algorithm32/caches/shared-transport-verification.md)
  and current `src/algorithm32/implementation/distant-sun/cache/` source:
  retained metadata, complete compressed artifacts, persistent module Worker,
  preparation/coalescing and per-context attachment ownership.
- Existing Flat feature/controller/view/service contracts, page contributions,
  server routing, and the [owned-content cleanup](owned-content-cleanup-execution.md).

The package is already built: approximately 734 MB on disk. Its documented
largest scene requires about 496 MiB per GPU atlas, with a transition potentially
holding two. Two spherical views own independent GPU resources, so memory is a
material early measurement, not an assumption that CPU sharing shares textures.
These are recorded package estimates, not a new fixed budget or admission rule.
Check actual device capabilities/allocation behavior and report measured costs.
Flat Earth currently warms a detached cache/context at feature readiness even
when no Flat page is selected. Include that retained allocation and concurrent
startup work in spherical-only and two-spherical measurements. Preserve the
owner-requested eager Flat warming; do not disable it to improve these results.

`DistantSunSharedCacheTransport.current` currently enforces one live transport
per module/process scope. It must not be recreated or disposed per view. Its
ownership in a composed deployment must be resolved in M1; importing the Flat32
bootstrap's global borrowing convention unchanged is insufficient.

Existing evidence establishes the engine/cache starting point, not the new
feature's integration. Reuse unchanged numerical/package evidence; invalidate
specific claims when relevant source, physics, format, package or settings
change. No package rebuild or broad scientific requalification is presumed.

## Ownership And File Outline

The workspace continues to consume generic page and contribution capabilities.
Neither scene feature imports the other. Models that own application state are
registered services; parsers, geometry adapters and rendering aggregates are
not called models.

| Location | Purpose |
| --- | --- |
| `src/flat/features/spherical-earth/index.js`, `build.json` | Activate the feature's services and package its CSS through the normal feature build. |
| `controller.js` and adjacent declaration | Register the page and contributions; resolve shared configuration/catalog/cache capabilities; coordinate per-view sessions and cleanup. |
| `models/spherical-earth-model.js` and adjacent declaration | Registered per-view camera/accepted-height/Sky state and derived unit-bearing observation inputs. |
| `views/spherical-earth.js` and adjacent declaration | View service projecting state and relaying presentation/canvas intent. |
| `components/` and `styles/` | Class React page, feature toolbar/settings adapters and localized status/retry presentation using shared controls. |
| `SphericalEarthSession.js` | Serialize/coalesce observation work, coordinate cancellation and pending versus displayed state for one mounted view. |
| `runtime/` | Own graphics, configured engine scene, curved ground, cache attachment, lighting, coherent publication and release. Keep resource owners separate from passive candidate facts. |
| `src/flat/services/stellar-catalog.js` and adjacent declaration | App-wide source/human-filter capability promoted from the current Flat Earth-owned implementation; both features resolve the same interface. |
| `src/flat/services/distant-sun-cache.js` and adjacent declaration | App-owned authenticated package/transport access and scene-selection capabilities, independent of any workspace representation. |
| `server/flat/features/spherical-earth-cache/` and `server/flat/routing/` | Registered package service and thin mount-relative resolver/asset router, installed before the app fallback. |
| Neutral engine/server support and worker build script | Reusable format/service logic and build output, with no Flat32 application dependency. |
| `builds/flat.json`, app activation/spec entries, templates/types/localization | Register the feature, service activation, styles, phrases, declarations, tests and independently deployed worker/assets. |

Use current service-file naming and ambient `.d.ts` contracts. The outline
expresses responsibilities; split only when actual ownership warrants it.
Reuse existing shared controls. Lift domain-neutral camera/presentation helpers
only where both real consumers need them; do not turn the entire Flat runtime
into a feature-kind switch or perform a speculative framework refactor.

Promoting the stellar service includes its consumers, declarations, tests,
activation and asset URL contract. Preserve the shared immutable source and
independent GPU resources. Existing Flat-owned server stellar URLs can remain
stable: ownership of the service, not renaming working URLs, is the requirement.

## Milestones

Each milestone ends with a short execution-record report: completed deliverables,
observed evidence, interpretation/limits, disposition and next action. Estimates
are provisional active work/check time, not hard limits or new approval pauses.
Revise them using the first working cache/deployment slice.

### M1 — Registered Page And Independent Cache Delivery

Purpose: expose the page early and resolve the largest deployment/lifetime
uncertainties before implementing the full scene. Estimate: 3–6 hours, primarily
package-service extraction, large-asset deployment and transport ownership.

- Preserve the current working baseline and declare the source unit. Create
  `spherical-earth-implementation-execution.md` beside this plan. Record existing
  uncommitted date/time notes and any owner edits; do not rewrite them.
- Register the Spherical Earth page through app-pages with its own controller,
  view and model service. Mount real feature-owned React content in either view,
  with localized title, missing-location/loading/failure/retry states. Do not
  label a placeholder or decoded block as a working spherical atmosphere.
- Adapt reusable cache-serving/resolution code into neutral support with Flat's
  registered service/router wrappers. Use the existing I/O/filesystem service
  boundaries. Preserve metadata compatibility, complete-file integrity, paths,
  cancellation and meaningful HTTP failures. External bytes are authenticated
  at ingress; owned decoded content is not repeatedly rehashed on every edit.
- Give Flat independently configured deployment data and app-relative resolver,
  block and Worker URLs. Extend the maintained worker build to emit into Flat's
  output, retaining the decoder pin and Flat32 output for its existing consumer.
  Do not hardcode `/flat32`, a sibling source path or document-location-dependent
  nested-route resolution into the new runtime.
- Reuse the selected immutable package as deployment input. Measure its files
  before proposing tracked copies. Prefer a configured operational data root
  and explicit deployment/staging arrangement over duplicating ~734 MB in Git.
  A local staging copy may derive from the existing production package; record
  provenance and preserve original bytes. The deployed Flat app must be complete
  without the Flat32 app. Missing data produces an actionable unavailable state,
  never a silent runtime rebuild or a black fallback presented as valid darkness.
- Browser readiness fetches authenticated metadata and only the blocks needed
  by the selected scene and its interpolation support. Do not eagerly download
  the entire inventory. Demonstrate selective loading and coalescing of blocks
  required by two spherical views, separately from package deployment size.
- Resolve transport ownership with a bounded early check: two borrowing sessions
  and an app restart/composed-registry lifecycle. Prefer one Flat app service
  owning one transport/Worker for its views. If the engine singleton is genuinely
  shared across live apps, use explicit acquire/release ownership so one app
  cannot terminate another's work. A small engine ownership change is within
  scope if needed; preserve coalescing and existing Flat32 consumers. Do not
  introduce a second live singleton or assume independent registries fix it.
  Include Flat32's existing `SharedDistantCacheAssets.dispose()` creator/disposer:
  migrate every live participant in a genuinely shared module scope to the same
  ownership protocol, or demonstrate actual module isolation. Test both app-start
  orders and stopping the original creator while another app continues using it.
- Demonstrate Flat-mounted metadata resolution and one real block decoded through
  its built module Worker. Inspect actual package/device size/texture limits
  and estimate two-view transition residency, including the unclaimed Flat startup
  cache/context, before proceeding to heavy renders.

Deliverable/completion: a selectable production feature shell, functioning
Flat-owned cache/worker delivery, and recorded transport ownership proof. This
is the first visible milestone. M2 supplies the first completed shader render.
If a package/deployment issue fails, repair that portion and retain the page
work; do not expand into cache generation or reduce physical quality.

### M2 — Render A Real Spherical Scene

Purpose: complete the real shader integration using current shared inputs.
Depends on M1. Estimate: 4–7 hours; curved ground/depth and engine bindings are
the dominant uncertainty.

- Promote the existing catalog/human-filter capability to app ownership and
  update Flat Earth to consume it without importing another feature. Keep current
  catalog authentication and the recent accepted-content reuse behavior.
- Construct spherical geometry and distant-Sun placement from the existing
  configuration timestamp/latitude/longitude. Use current production physical
  parameters and scene-cache descriptors; do not parse localized field strings
  or introduce timezone work into the scene feature.
- Assemble Algorithm32 with canonical atmosphere, existing shared package,
  Sun/stars, selected Flat color/presentation filters and a Three scene. Start
  at the existing 5 m/50-degree vertical FOV defaults and a level camera. Missing
  location remains missing rather than silently selecting a city.
- Use geometry-owned curved ground and matching analytic horizon/scene depth,
  with the current green visual material and receiver/source scene lighting.
  Reuse the 40 km coverage design: sufficient fixed ground coverage and camera
  far/depth range. Preserve 30/120 live view-integration interval selection where
  required by the existing high-altitude policy, without height-specific shaders.
- Install receiver measurement, atmosphere/celestial composition, and real
  diagnostics before reporting ready. Distinguish a package's intentional dark
  state (currently beginning at solar zenith 108 degrees) from missing assets;
  darkness retains appropriate source/star/transmittance/scene behavior.
- Produce a real day and low-Sun capture with visible spherical ground/horizon,
  plus a night/dark-source capture showing celestial behavior. Record exact
  location, UTC instant, height, FOV, camera, physical/package and color settings.

Deliverable/completion: actual Spherical Earth rendering in Flat using shared
location/time, real curved ground and shader-owned Sun/stars, with useful ready
and retry feedback. Existing Flat Earth and shared catalog tests remain passing.
Publish the captures as soon as available; they prove scene appearance rather
than numerical accuracy or responsiveness by themselves.

### M3 — Complete Controls And Retained Observation Updates

Purpose: make the scene usable without repeating the Flat feature's earlier
rebuild/validation problems. Depends on M2. Estimate: 4–7 hours, especially
atomic cache/lighting transitions and independent-view lifetimes.

- Contribute feature-owned Sky, height, FOV and Center on Sun controls and a
  Camera/sky settings section. Use existing icon/menu/panel controls and explicit
  view identities. Workspace scene/settings/close controls stay workspace-owned.
  Shared date/time editing stays with global configuration; do not reproduce
  Flat's degrees-from-closest editor inside Spherical Earth.
- Preserve the existing Full / No atmosphere / Shader off semantics: atmosphere
  off has Sun illumination 0 and disc brightness 100%; Shader off draws the raw
  Three scene with neutral white ambient intensity 1; No atmosphere keeps the
  established compensated dim fill. Keep raw physical measurements separate
  from presentation choices.
- Implement pointer-lock look, independent camera direction, current supported
  elevation/FOV presets and Sun centering. FOV/mouse look coalesce redraws and
  do not reload packages or rebuild scenes. Per-view controls affect only their
  owner; the Flat alternate-time editor updates both scene families via the clock.
- Use the engine's shared attachment for time/location/height preparation.
  Retain scene, endpoints, handle/programs and compatible cache resources;
  acquire/release package blocks according to the actual new required scene.
  Prepare new geometry/source facts and receiver light, then atomically install
  cache/source/camera/lighting/bindings. Preserve the last complete display on
  precommit failure and implement rollback for fallible installation. Report
  post-commit retirement failure separately from failed publication.
- Coalesce rapid shared-time input while allowing valid in-flight progress;
  cancel superseded location/height work. Verify final displayed state rather
  than only the accepted clock. Avoid stale results after feature switches,
  unmount, retry, context loss or closing either comparison view.
- Share package/CPU transport work between spherical views with subscriber-aware
  cancellation. Keep GPU ownership/context uploads independent. Closing one
  subscriber does not abort another or dispose its transport; app stop releases
  the app's final owned transport/Worker only after consumers retire.

Deliverable/completion: working per-view controls and coherent retained updates
in mixed and two-spherical views. Counters show no scene/program reconstruction
for compatible warm edits; any required block download/upload is reported as
cache working-set movement rather than concealed as a full rebuild.

### M4 — Verify Rendering, Isolation And Discoverable Deployment

Purpose: validate the complete production feature and preserve Flat's behavior.
Depends on M1–M3. Estimate: 2–4 hours plus package transfer/browser run time;
update estimates if actual network/device performance differs materially.

- Start with happy-path regressions in existing lanes, then required invalid
  input/package, cancellation, failure and cleanup cases. Verify registration,
  service isolation, both page orders, same-feature comparison, mixed views,
  scoped settings and removal/recreation of one view without stale identities.
- Compare Spherical Earth with the current engine/Flat32 reference under matched
  physical, color and camera settings. Reuse prior cache qualification for
  unchanged bytes. Compare solar direction/zenith, receiver spectra and
  adaptation, shader bindings and representative output pixels numerically.
  Establish tolerances from existing contracts/repeatability before judging
  candidate output; do not assume different display-model defaults should match.
- Inspect paired day, sunset and dark-state captures at ordinary and 40 km
  heights for horizon curvature/occlusion, green ground, Sun/stars, limb coverage
  and absence of black coverage gaps. Inspect mixed Flat/spherical captures with
  shared location/time and independently changed cameras/heights/FOVs.
- Exercise a zenith-bin/interpolation boundary and the intentional dark boundary
  in both directions, rapid scrubbing, simultaneous view requests, resize and
  FOV/centering during preparation, package failure/retry, context loss/recovery,
  and close/app-stop while downloads/Worker work are in flight. Verify exact
  subscription, cache lease, GPU and Worker release; no view can own another's
  resources or install an obsolete candidate.
- Test standalone Flat and a composed host at its configured mount, including
  direct nested-page entry/reload. Omit Flat32 from the deployed app and prove
  Flat's resolver, static artifacts, module Worker and fallback decoder load
  correctly. Check routing order, unavailable package state and asset-path
  rejection using Flat's existing server test patterns.
- Measure cold resolve/download/decode/upload/first-ready stages separately from
  warm time/height input and FOV redraw. Record actual bytes, retained/transition
  GPU use, request coalescing, worker count, cache hits, programs/allocations and
  completed frame timing for one/mixed/two-spherical views. Use a small fixed
  set that includes retained Flat startup warming in spherical-only cases;
  distinguish downloaded selected blocks from the complete on-disk inventory.
  Use six warmed edits per relevant case and report variability/GPU waits.
  Avoid fixed speedup promises or blocking on historical browser/GPU identities.
- Use maintained commands: engine/app/server type checks; `test:algorithm32` and
  targeted `test:algorithm32:three` cache/worker/stellar/scene cases; `test:flat`
  and a normal production build including the Flat worker. Exercise affected
  Flat32 server/engine consumers when shared code contracts change. Run focused
  checks during development and the combined affected checks once stable.
  Reuse unchanged evidence instead of repeatedly running broad science suites.

Deliverable/completion: all completion outcomes demonstrated, actual visual and
numeric comparisons, lifecycle/isolation and independent deployment evidence,
plus a final timing/resource report with limitations. Actual allocation failure
must remain an honest isolated view failure; do not silently drop resolution or
disable physics to fit another view. Missing required evidence remains explicit
unfinished work, rather than a claim of release-wide scientific qualification.

## Execution, Checkpoints And Resumption

The owner first authorized M1 and then authorized independent execution of the
remaining M2-M4 on 2026-11-08. All milestones are complete. The execution record
owns the final outcome, evidence, decisions, resource measurements and limits.

Write generated evidence/helpers under unique run directories in
`.codex-tmp/spherical-earth/`. Use JavaScript/Python helpers and existing runtimes.
Automated browsers use disposable profiles removed on success/failure; retain
captures/measurements rather than cookies or cache directories. Preserve existing
production packages and historical/experimental evidence; source adaptation never
imports a suspended experiment at runtime.

The execution record owns milestone status, decisions, inputs/artifact links,
next action, unresolved dependencies and final report. Report early page/cache
and real-render evidence when available. Diagnose failures, preserve useful
results and repair only the affected portion. Reestimate from actual progress;
elapsed time or old resource measurements do not introduce approval gates.

Engineering standards reviewers remain cancelled. Primary self-review, types,
existing tests and rendered evidence remain required; no compliance result is
claimed from disabled review. One independent read-only plan critique is required
before handoff, not a source review or recurring milestone audit. Existing
checkpoint-adviser monitoring remains independent. Checkpoints always include
the complete current repository state, including owner edits; they do not select
only this feature's files. Any future independent-execution checkpoint authority
still follows whole-repository inspection and sensitive/large-data safeguards.
Do not push or publish without separate authority.

## Plan Critique

One read-only critique by `spherical_earth_plan_critique` on 2026-11-08 found the
scope and milestone sequence coherent and recommended three clarifications.
All are incorporated: account for the existing eager Flat cache/context in
spherical-only memory and startup measurements; include every live creator/
disposer when resolving shared transport ownership, with both start orders and
original-creator shutdown; and make selective block loading explicit instead
of downloading the complete package inventory. No suggestions were rejected.
The primary checked the revised sequence and links before execution. The critique
was a planning review; it did not perform implementation or standards review.
