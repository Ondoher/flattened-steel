# Production Color Reset Implementation Plan

Status: implementation complete through P1; P2 is next.

This is the canonical plan for integrating the selected Color Reset design
into production. The [production design](color-reset-design.md) owns equations,
responsibilities, selection decisions, and claim boundaries. The closed
[contained experiment plan](../../extraterrestrial/color-reset-experiment-plan.md)
is detailed evidence history and is not an implementation instruction.

## Completion Target

Promote receiver-light state, `color-reset-slope-078-p9`, neutral direct and
diffuse scene lighting, the complete brightest-2,000 catalog, one-pixel
`q=24`, and the optional ordered human-vision filters into the existing
Algorithm32/Flat32 architecture. Retain `basic-bruneton` as an explicit option
and introduce no contained runtime dependency or old/new compatibility bridge.

The initial appearance-qualified release surface is spherical/distant. Work is
split into independently reviewable increments so a catalog, Color, lighting,
or filter defect cannot be hidden by another simultaneous change.

## Promotion Precedence

When the accepted experiment and current production behavior disagree about an
algorithm, the experiment controls the equations, numerical parameters,
operation order, catalog ordering, and approved behavioral result. This rule
does not authorize copying the experiment's architecture or coding approach.

Production component ownership, interfaces, dataflow, lifecycle, resource
management, atomic publication, failure behavior, and integration boundaries
remain controlling. Repository guidance and coding standards control source
layout, implementation, verification, evidence, provenance, and documentation.
Contained code is an adaptation reference only and may not become a production
runtime dependency.

Stop for explicit review only when reproducing the selected algorithm raises a
concrete concern about units or inputs, numerical stability, a preserved
physical invariant, data verifiability or legal use, production performance or
resources, or failure to reproduce the accepted result. Otherwise, resolve the
conflict by implementing the experimental algorithm through the existing
production architecture and standards.

## Selected Pre-Execution Boundaries

Source research and official-experiment registration are deferred. Production
implementation, deterministic reproduction, and engineering verification may
proceed using the accepted contained results as provisional algorithmic
authority. An unresolved source-gap row continues to block final scientific or
numerical-authority acceptance, release qualification, and P9 default
selection for the affected capability; it does not by itself block P1-P7
engineering work.

The initial qualification matrix is Windows, the current pinned Chrome
Headless executable, WebGL2 via ANGLE/D3D11, and the NVIDIA GeForce RTX 2060.
The promotion manifest records the exact browser version used by each gate; P0
observed Chrome Headless 153. Full-frame appearance and performance use a
1920-by-1080 drawing buffer at DPR 1. DPR 2 qualification is limited to
one-pixel raster occupancy, screen-index rebuild, resize, and lifecycle
behavior using a bounded CSS viewport whose drawing buffer does not exceed
1920 by 1080. Broader browsers, GPUs, operating systems, viewports, and 4K
performance are not part of this promotion gate.

External-data source payloads and derivatives may be generated and exercised
locally, but BSC, Pickles, Johnson/SVO, Vega, and CIE-derived bytes may not be
publicly distributed or placed in a release package until their applicable
license and redistribution rows close. A production-owned data layout does not
remove that restriction; publicly distributed repositories must also keep the
affected bytes outside tracked surfaces pending clearance.

## P0 - Freeze Promotion Authorities And Inventory Production

Status: complete. The canonical evidence and ownership record is the
[production promotion manifest](color-reset-promotion-manifest.md).

- Record every accepted parent run, artifact identity, schema, source hash,
  derivation, equation, and selected parameter in one production promotion
  manifest.
- Record every unresolved third-party citation and first-party official-
  experiment boundary from the canonical
  [source-gap register](color-reset-source-gaps.md). Apply the selected
  provisional-authority boundary: unresolved rows do not block P1-P7, but a
  URL, DOI, local payload, or contained run is not final authority and cannot
  close release qualification or P9 default selection.
- Inventory current owners for Color construction, facade runtime bindings,
  receiver-environment state, direct source state, scene lighting, stellar
  source data, palette generation, collision handling, configuration, and
  Flat32 composition.
- Record the current 500-star source and palette identities and every fixed
  member-count or `501`-entry assumption.
- Pin the selected Windows/current-Chrome-Headless/WebGL2/ANGLE-D3D11/RTX 2060
  matrix in the promotion manifest, recording the exact browser version for
  each gate, including the 1920-by-1080 DPR 1 full-frame case and the bounded
  DPR 2 raster/lifecycle case.

Gate: the manifest authenticates CR2, CR3, CR4G, CR6C-G, CR7, and CR8; records
the provisional status and release effect of every open source-gap row; pins
the selected qualification matrix and no-public-redistribution boundary; and
the inventory has no unresolved owner or hidden fixed-500 assumption.

## P1 - Make Selections Explicit And Independent

Status: complete.

- Define typed Color identifiers `basic-bruneton` and
  `color-reset-slope-078-p9`.
- Define independent celestial enablement, stellar catalog, and ordered
  presentation-filter configuration.
- Remove the current coupling in which selecting Bruneton disables celestial
  sources.
- Reject unknown model, catalog, stage, target, filter, parameter, and
  incompatible-order selections.
- Decide the production default only at P9; use explicit selection during
  qualification.

Gate: selector tests prove exact routing, no aliases, fail-closed behavior, and
independence among Color, sources, catalog, and filters.

Result: `Flat32ProductionSelections` owns typed exact identities and ordered
validation. Basic Bruneton no longer disables celestial sources in either
mode. Unknown selections and recognized P3/P5/P6 selections fail closed rather
than aliasing to current behavior. The pre-P9 default remains the explicitly
identified source-luminance-lift model. Both type checks pass, Algorithm32
passes `594/594`, and the focused Chrome Headless 153 Flat32 lane passes
`21/21` with its full-cache application case intentionally outside the basic-
cache run.

## P2 - Publish Total Receiver Light

Status: pending.

- Extend the existing `LocalLightLevelCalculator` and
  `ReceiverEnvironmentLightController` rather than introducing a parallel
  lighting subsystem.
- Publish direct-normal, direct-horizontal, diffuse-horizontal, and
  total-horizontal Native15 packets with explicit units and provenance.
- Derive total-horizontal photopic lux for Color from the combined packet.
- Replace the facade's direct-only initial brightness proxy and ensure an
  environmental build adds rather than substitutes diffuse light.
- Key invalidation to observation, source placement, atmosphere, cache,
  spectral basis, and quadrature identity.
- Preserve the last complete measurement on rejection, failure, cancellation,
  or supersession.

Gate: analytic direct-only, diffuse-only, combined, darkness, orientation, and
atomic lifecycle tests pass on CPU and the application exposes no
framebuffer-derived or named-time state.

## P3 - Promote `slope-078/p9` Color

Status: pending.

- Implement the fixed qualified response under the production Color interface.
- Bind total-horizontal lux as facade-owned live state.
- Preserve the existing Native15 projection, scene/celestial composition, and
  Bruneton exponential/display encoding beneath the new response.
- Keep basic Bruneton byte- and identity-stable.
- Add CPU equation tests, shader-source contracts, finite/range tests, and
  selected-value CPU/GPU parity.

Gate: response values and slopes reproduce the accepted binary64 authority;
daytime and low-Sun preservation gates pass; basic Bruneton remains exact and
independently selectable.

## P4 - Connect Receiver Light To Scene Lighting

Status: pending.

- Route direct-normal and diffuse-horizontal spectra to the existing scene
  lighting owner.
- Implement the accepted neutral Lambertian direct, diffuse, and additive
  combined relationships without using Color or photopic labels in spectral
  lighting equations.
- Preserve captured-scene composition at the single display boundary.
- Keep arbitrary materials, interreflection, new shadows, and local-Sun
  appearance outside this increment.

Gate: production reproduces the CR3 neutral direct-only, diffuse-only, and
combined relationships, including exact additivity and zero direct support
after sunset, while pixels outside the geometry mask remain unchanged.

## P5 - Replace The 500-Star Roster With 2,000 Stars

Status: pending.

- Materialize production-owned data for the exact CR6B ordered roster and CR6F
  Native15 packet set; do not import experiment fixtures at runtime.
- Keep externally derived catalog and spectral bytes local and out of public
  tracked or release-package surfaces until their applicable license and
  redistribution rows close.
- Preserve the first 500 ids, directions, and packet values exactly.
- Retain all seven declared proxy spectra and their provenance.
- Generalize source tables, layouts, identities, textures, palette capacity,
  diagnostics, and tests from 500 members/501 palette entries to 2,000
  members/2,001 palette entries.
- Retain the accepted `2000x1 RGBA32F` plus `2000x15 R32F` representation or
  prove an exactly equivalent production representation.
- Preserve canonical collision ownership and sum every colliding spectrum once.
- Keep `q=24`; do not tune brightness from member count or CR6H robust counts.

Gate: exact roster endpoints and prefix, all 30,000 finite nonnegative values,
the `1,993/7` partition, selected GPU readbacks, collision conservation,
resource bounds, context restoration, and replacement lifecycle pass.

## P6 - Add The Ordered Presentation-Filter Registry

Status: pending.

- Implement typed stage and semantic-target registration, deterministic order,
  configuration identities, exact identity mode, and fail-closed compatibility.
- Implement only the source-linear hooks required for the selected stellar
  filters; reserve other stages as types/design boundaries until used.
- Promote `human-mesopic-luminance-v1` at rod contribution `0.5` before
  `human-low-light-chroma-v1` at retention `0.65`.
- Preserve physical color, chroma-only, and full selected-chain toggle paths.
- Preserve finite signed wide-gamut components without a hidden clamp.

Gate: identity is exact, filter order is enforced, nonstellar pixels are
unchanged, luminance/chroma invariants reproduce accepted equations, and
unsupported combinations fail closed.

## P7 - Integrate One-Pixel Stellar Presentation

Status: pending.

- Keep `gl_PointSize=1.0` and apply the fixed wavelength-independent `q=24`
  presentation calibration at the source-owned pre-composition boundary.
- Rebuild screen indices and palettes transactionally for catalog, view,
  observation, resize, DPR, and context changes.
- Publish catalog, screen index, palette, filter configuration, receiver light,
  and Color as one compatible runtime generation.
- Exercise the 108-degree scattering-cache transition without switching stars
  from time, solar angle, or cache darkness.

Gate: every star occupies one raster pixel, supported viewport/DPR cases retain
the declared calibration and collision behavior, no stellar pixel clips or
becomes exact white in the qualified cadence, and failed rebuilds preserve the
prior compatible generation.

## P8 - Run Production Qualification

Status: pending.

- Regenerate the exact B1 table and all six figures using explicit
  `basic-bruneton`; require RMSE at or below `11.820391604126252` without Color
  participating in physical scoring.
- Reproduce the CR7 daylight-through-dark cadence under the production
  candidate and run a new 2,000-star production appearance sequence.
- Treat the 2,000-star sequence as integration qualification, not as permission
  to increase `q=24` when faint members remain sub-robust.
- Verify daylight, low-Sun, twilight chronology, direct/diffuse scene lighting,
  physical and filtered stars, catalog transition, resize, DPR, mode switching,
  context loss/restoration, failure preservation, disposal, and supersession.
- Run complete Algorithm32 Node/WebGL, Flat32, type-check, build, performance,
  memory, and supported-hardware resource gates.
- Produce source and runtime-dependency inventories proving no contained import.

Gate: every design invariant passes from production source, all requested
images exist before appearance judgment, and owner review accepts the complete
2,000-star production presentation as engineering evidence. Open source-gap
rows keep affected scientific/numerical-authority and release gates
provisional even when every engineering check passes.

## P9 - Select Defaults And Close Promotion

Status: pending.

Entry condition: every source-gap row affecting a capability selected for
release or default use is closed by its required authority and registration,
and every externally derived byte selected for distribution has documented
license and redistribution clearance. P1-P8 engineering completion does not
waive this condition.

- Select `color-reset-slope-078-p9` as the default only after P8 passes; retain
  `basic-bruneton` as the explicit B1/control option.
- Make the brightest-2,000 roster the production stellar catalog.
- Keep perceptual filters optional unless the owner separately selects their
  enabled configuration as the application default.
- Remove the superseded source-luminance-lift implementation and configuration
  paths if no remaining production claim requires them; do not leave a
  permanent compatibility bridge.
- Update the production status, current dataflow, Flat32 documentation, public
  configuration documentation, deployment inventory, and release checklist.

Gate: one production strategy remains, current documentation names this design
and plan as canonical, all release lanes pass after default selection, and the
closed experiment remains evidence rather than runtime code.

## Deferred Follow-Ups

- Flat/local appearance qualification.
- Moon and planet lighting or appearance.
- Light pollution.
- Automatic or temporal visual adaptation.
- Physical optical and presentation-only solar filters.
- Bloom, PSF, halo, glare, camera, and sensor simulation.
- Arbitrary spectral materials and interreflection.
- Population-level psychophysical validation.

Each follow-up requires its own stage, target, provenance, compatibility, and
evidence boundary. It may not silently modify this promotion's accepted
atmosphere, `q=24`, catalog, or filter identities.
