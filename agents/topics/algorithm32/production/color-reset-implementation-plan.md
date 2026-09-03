# Production Color Reset Implementation Plan

Status: implementation complete through P7; owner-directed application default
activation is complete; P8 engineering qualification is complete except for
fresh GPU B1 regeneration and owner appearance judgment. P9 implementation and
documentation cleanup are complete; source/licensing and final release closure
remain open.

This is the canonical plan for integrating the selected Color Reset design
into production. The [production design](color-reset-design.md) owns equations,
responsibilities, selection decisions, and claim boundaries. The closed
[contained experiment plan](../../extraterrestrial/color-reset-experiment-plan.md)
is detailed evidence history and is not an implementation instruction.

## Completion Target

Promote receiver-light state, `color-reset-slope-078-p9`, neutral direct and
diffuse scene lighting, the complete brightest-2,000 catalog, one-pixel
`q=24`, and the reversible ordered human-vision filters into the existing
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
  numerical-authority acceptance and release qualification for the affected
  capability. The project owner subsequently directed application default
  activation before those research items close; that direction does not waive
  the source, licensing, or release gates.

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
  [project-wide research register](../../../../references/followup.md#missing-third-party-sources-or-canonical-registrations). Apply the selected
  provisional-authority boundary: unresolved rows do not block P1-P7, but a
  URL, DOI, local payload, or contained run is not final authority and cannot
  close release qualification or the final P9 gate. Owner-directed application
  default activation does not change that boundary.
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
- Initially defer the production default to P9 and use explicit selection
  during qualification. The later owner-directed activation is recorded under
  P9 and supersedes only this sequencing decision.

Gate: selector tests prove exact routing, no aliases, fail-closed behavior, and
independence among Color, sources, catalog, and filters.

Result: `Flat32ProductionSelections` owns typed exact identities and ordered
validation. Basic Bruneton no longer disables celestial sources in either
mode. Unknown selections and recognized P3/P5/P6 selections fail closed rather
than aliasing to current behavior. The initial pre-P9 default was the explicitly
identified source-luminance-lift model; the later owner-directed P9 selection
changes that default without changing P1's selection architecture. Both type checks pass, Algorithm32
passes `594/594`, and the focused Chrome Headless 153 Flat32 lane passes
`21/21` with its full-cache application case intentionally outside the basic-
cache run.

## P2 - Publish Total Receiver Light

Status: complete.

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

Result: production retains the existing geometry-supported and atmosphere-
transmitted direct-normal algorithm unchanged, derives a separately identified
direct-horizontal packet with the selected source-center cosine equation,
reduces the fixed 32-direction cosine-weighted cache sample to diffuse-
horizontal, and publishes their exact total. Every complete state carries all
four Native15 packets, their physical packet units and derivation provenance,
the four photopic lux projections, and the temporary pre-P3 total `E_v / pi`
input used by the still-live source-luminance-lift Color. Model/profile, exact
runtime cache generation, basis, direct packets, diffuse result, and
quadrature identity participate in invalidation. Rejection, failure,
cancellation, disposal, and latest-request-wins supersession cannot replace
the last complete publication.

Flat32 now performs this measurement from the installed scattering cache
before its composed-frame preflight, so the first published application frame
uses total receiver light. The two type checks pass, Algorithm32 passes its
complete Node lane, the Algorithm32 WebGL lane passes `23/23`, the basic Flat32
lane passes `21/21`, and the full exact-cache Flat32 lane passes `22/22` when
its required local cache-server proxy is supplied. The deferred physical and
authority questions remain explicit in the
[project-wide research backlog](../../../../references/followup.md#color-reset-research-questions) and
do not alter the selected algorithm. The complete Node result is `598/598`.

## P3 - Promote `slope-078/p9` Color

Status: complete.

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

Result: production owns the fixed `color-reset-slope-078-p9` model and its
seven immutable response constants. It applies the accepted common scalar to
signed Native15-projected linear sRGB before the inherited, unchanged
Bruneton exponential/display encoding. The model consumes the P2 photopic
total-horizontal lux through the facade-owned live
`color.totalHorizontalIlluminance.value` binding; callers cannot replace that
binding, and complete receiver-light publication updates it with the matching
packet generation. Flat32 now routes the explicit candidate identity while
retaining `BrunetonSourceLuminanceLiftColorDisplayModel` and `basic-bruneton`
as separate exact controls. The later default activation selects this Color
Reset model when configuration is omitted.

All six accepted cadence gains, derivatives, and logarithmic elasticities
reproduce the CR4G binary64 values exactly. Darkness is finite at gain
`9887.08997070112`, the sampled 200,000-lux daylight point is identity, signed
pre-tone values remain signed until the existing Bruneton clamp, and shader
source/binding contracts pass. Both type checks pass, Algorithm32 passes
`602/602`, the Chrome Headless 153 WebGL lane passes `24/24` including
selected-value CPU/GPU parity, and the rebuilt focused Flat32 lane passes
`21/21` with its full-cache application case intentionally excluded. P3
introduced no new source-gap research question.

## P4 - Connect Receiver Light To Scene Lighting

Status: complete.

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

Result: `NeutralLambertianSceneLighting` now owns the Color-free, unit-bearing
spectral equations. It accepts direct-normal irradiance, diffuse irradiance
already integrated for the evaluated surface, surface/source directions, and
the fixed neutral reflectance `rho=0.18`; it publishes separate direct,
diffuse, and exactly additive combined Native15 irradiance and outgoing-
radiance packets. Direct support is clamped only by `max(0,n dot s)`, while
the Lambertian scale is exactly `rho/pi`.

Flat32's existing scene-light owner now consumes the installed P2 direct-
normal and diffuse-horizontal spectra. The selected Color owner performs only
the subsequent Native15-to-linear-sRGB projection needed by Three; it does not
enter the spectral lighting equations. The derived directional and ambient
lights are installed before composed-frame preflight, retain the receiver-
light and packet identities, preserve the existing six-shadow lifecycle, and
are restored from the last published mode after a failed replacement. The
captured scene still enters the atmosphere at the single existing display
boundary.

The production Three black-ground upper-hemisphere adapter is exact for the
upward horizontal neutral surface represented by `diffuseHorizontal`; it is a
normal-dependent approximation for other surface normals because P2 does not
publish the full directional sky field. That non-horizontal directional-
diffuse question is recorded in the
[project-wide research backlog](../../../../references/followup.md#color-reset-research-questions)
and no broader claim is made.

Both type checks pass. Algorithm32 passes `605/605`, the Chrome Headless 153
WebGL lane passes `24/24`, the rebuilt focused Flat32 lane passes
`22/22`, and the full exact-cache application lane passes `23/23`.

## P5 - Replace The 500-Star Roster With 2,000 Stars

Status: complete.

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

Result: production owns a tracked materializer and verifier plus the ignored
local package `server/flat32/data/brightest-2000-stellar-package-v1`. The
package authenticates immutable CR6B/CR6F/CR6G parents and retains the exact
double-precision roster and packets alongside the accepted 152,000-byte split
float32 representation. Runtime imports only production code and local package
bytes; no contained module is a dependency. Missing or altered package bytes
fail closed, and the licensing-sensitive derivatives remain outside Git and
release packaging.

The explicit `brightest-2000` selection constructs all 2,000 members, preserves
the first 500 ids, directions, and packet scalars exactly, retains all seven
declared proxy derivations, and exposes separate `2000x1 RGBA32F` member and
`2000x15 R32F` spectrum textures. The sparse palette derives its 2,001-entry
capacity from member count. The older tiled stellar transport architecture is
retained and generalized to a 2,048-member capacity with `704x419x15` R32F
storage. Canonical collision ownership and ordered accumulation are unchanged;
the catalog increment does not alter `gl_PointSize=1.0` or the P7-owned
executable `q=24` calibration.

The exact local proof confirms endpoints HR 2491 and HR 7474, prefix boundary
HR 7590, first added HR 2012, all 30,000 finite nonnegative values, the exact
`1,993/7` partition, 152,000 source bytes, and expanded transport bounds. A
Chrome Headless 153 production recast proves selected GPU readback, collision
conservation, 2,001-entry allocation, replacement, disposal, and context
restoration. Both type checks pass; Algorithm32 passes `605/605`, Algorithm32
WebGL passes `25/25`, Flat32 basic passes `22/22`, Flat32 exact-cache passes
`23/23`, and the Flat32 build passes.

## P6 - Add The Ordered Presentation-Filter Registry

Status: complete.

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

Result: `ViewPresentationFilterRegistry` now owns the versioned stage and
semantic-target vocabulary, implements only the selected
`source-linear/stellar` registrations, assigns deterministic array order, and
hashes the complete normalized configuration. Empty, fully disabled, and
nonstellar paths return the original RGB object without arithmetic. The
selected mesopic implementation accepts an authenticated local Native15
scotopic-weight vector and uses fixed `0.5` maximum rod contribution; it does
not track or release the CIE-derived coefficients. Missing or malformed weights
fail closed. The following low-light chroma implementation uses fixed `0.65`
retention and preserves E8 linear luminance. Both retain finite signed RGB
without an output clamp.

The registry emits the fixed source-linear stellar GLSL hook for P7. Flat32
normalizes and identifies filter selections now, rejects alternate strengths,
stages, targets, duplicates, and reversed order, but enabled selections remain
fail-closed until P7 can publish the hook with a compatible stellar generation.
Both type checks pass, Algorithm32 passes `613/613`, the Flat32 build passes,
and Chrome Headless 153 passes the basic Flat32 lane `22/22` with its full-cache
case intentionally skipped. No new research fact was introduced; the scotopic
dataset and mesopic-authority limitations remain owned by the existing rows in
the [project-wide research register](../../../../references/followup.md#missing-third-party-sources-or-canonical-registrations).

## P7 - Integrate One-Pixel Stellar Presentation

Status: complete.

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

Result: the live celestial consumer retains the transported stellar Native15
packet separately from other path radiance, reads collision-combined apparent
magnitude from palette row 15, and lets Bruneton Color replace only that
stellar projection with the selected source-linear filter result before the
unchanged scene composition and display encoding. Spectral rows 0-14,
`gl_PointSize=1.0`, and wavelength-independent `q=24` are retained. The
corrected production policy stores the historical q1 base
`60,999.839486002405`, the CR6C multiplier `24`, and their effective
`1,463,996.1476640578` boundary scale under a new presentation identity. The
first P7 promotion pass had left the q1 scale executable despite documenting
q24; live appearance review exposed the mismatch.

The screen index and 16-row R32F palette rebuild transactionally for view,
viewport/DPR, observation/configuration, and context changes. Their generation
identity includes catalog/policy, exact view, Color, registry configuration,
scotopic-weight content, receiver-light generation, and adaptation luminance.
Failed staging retains the prior publication but exposes exact-zero stellar
bindings while that publication is incompatible. The 108-degree cache
transition changes scattering state without selecting stars from solar angle,
time labels, or cache darkness.

Flat32 exposes `physical`, `chroma`, `mesopic`, and ordered `human` selections;
the mesopic paths authenticate an ignored local CIE-derived 15-weight package.
Unsupported Flat/local and Ferwerda/filter combinations fail closed. The fixed
32-direction receiver-sky median is the documented production approximation to
the experiment's unmasked sky-pixel median; its sensitivity is deferred in the
[project-wide research backlog](../../../../references/followup.md#color-reset-research-questions).

Corrected verification passes Algorithm32 Node `614/614`, Chrome Headless 153
Algorithm32 WebGL `26/26`, Flat32 basic `23/23` with the full-cache case
intentionally skipped, the configured exact-cache Flat32 lane `24/24`, both
type checks, and the Flat32 build. The WebGL lane covers 500/2,000-member palette generation,
collision-conserved spectra and magnitude, one-pixel invariance, resize/view
replacement, context restoration, the enabled mesopic-then-chroma GPU equation,
and no exact-white/clipping regression in the retained qualified one-pixel
control. Explicit `colorModel=color-reset-slope-078-p9` routing permits a
live qualification capture independent of the application default. Corrective
640-by-400 captures with the experiment's exact camera show the promoted sunset
response and visible one-pixel stars at sunset plus one hour. Shared-sky RGB-
byte RMSE is `4.4705308752784809` at sunset and `1.23266099354202` at plus one
hour; full production cadence captures and owner appearance review remain P8
rather than being inferred from this gate.

## P8 - Run Production Qualification

Status: substantially complete. The
[production qualification record](color-reset-production-qualification.md)
owns current evidence and the remaining gates.

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
2,000-star production presentation as engineering evidence. Open rows in the
[project-wide research register](../../../../references/followup.md#color-reset-research-register)
keep affected scientific/numerical-authority and release gates
provisional even when every engineering check passes.

Current result: the full nine-condition default-human cadence exists and
passes engineering inspection, including the exact 108-degree cache boundary.
Algorithm32 Node passes `610/610`, Algorithm32 WebGL passes `26/26`, the exact-
cache Flat32 lane and build pass `24/24`, both type checks pass, the runtime-
dependency inventory is clean, and the RTX 2060/D3D11 1080p gate measures
22.14 ms mean and 22.43 ms p95 atmosphere GPU time. Production stellar
resource and lifecycle gates pass. Fresh GPU B1 regeneration remains blocked
on a production-owned offline adapter for the direct-40 paper profile; runtime
recurrence will not be restored. Owner acceptance of the production cadence is
also still required.

## P9 - Select Defaults And Close Promotion

Status: partially complete by project-owner direction. Application defaults,
superseded-path removal, and documentation/release inventory are complete;
source/licensing closure and the final release gate remain pending.

Entry condition: every applicable row in the
[project-wide research register](../../../../references/followup.md#color-reset-research-register)
is closed by its required authority and registration, and every externally
derived byte selected for distribution has documented license and
redistribution clearance. P1-P8 engineering completion does not waive this
condition.

- [x] Select `color-reset-slope-078-p9` as the ordinary application default;
  retain `basic-bruneton` as the explicit B1/control option. The owner directed
  this activation before full P8 closure.
- [x] Make the brightest-2,000 roster the ordinary production stellar catalog;
  retain brightest-500 as an explicit control.
- [x] Keep perceptual filters reversible and separately selectable. The owner
  selected the ordered mesopic-then-chroma `human` configuration as the
  ordinary application default; `physical` remains the exact disabled control.
- [x] Remove the superseded source-luminance-lift implementation and configuration
  paths if no remaining production claim requires them; do not leave a
  permanent compatibility bridge.
- [x] Complete the production status, current dataflow, Flat32 documentation, public
  configuration documentation, deployment inventory, and release checklist.

Gate: one production strategy remains, current documentation names this design
and plan as canonical, all release lanes pass after default selection, and the
closed experiment remains evidence rather than runtime code.

Default-activation result: omission now resolves to
`color-reset-slope-078-p9`, `brightest-2000`, and the ordered human stellar
presentation. Flat32 loads/authenticates the 2,000-star and scotopic-weight
packages before application construction and publishes the resolved Color,
catalog, and filter identities on the shell. Explicit physical presentation,
Basic Bruneton, and brightest-500 controls remain available. The superseded
source-luminance-lift route has been removed. Captures
`000015` and `000016` verify the no-override sunset and sunset-plus-one-hour
routes; the latter contains visible one-pixel stars. Flat32 passes `23/23` in
the basic lane and `24/24` in the exact-cache application lane. Against the
prior candidate-camera production captures, their RGB-byte RMSE is
`0.00322748612183951` at sunset and `0.0656101173600536` at plus one hour;
the small plus-one-hour delta is consistent with the expanded catalog. Capture
`000014` is retained but is not default-route evidence because its diagnostic
suffix explicitly selected Basic Bruneton.

Human-default result: run `000017` proves the no-override plus-one-hour route
publishes and executes `human-mesopic-luminance-v1` followed by
`human-low-light-chroma-v1`. Against the otherwise identical physical run
`000016`, only 351 of 768,000 RGB channels change (RMSE
`0.110709125263759`, maximum delta `42`). The full exact-cache Flat32 lane
passes `24/24`, including switching through the nonstellar Flat/local mode;
the application supplies an empty stellar-filter list in that mode and
restores the selected chain on spherical/distant return.

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
