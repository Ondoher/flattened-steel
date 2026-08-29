# Extraterrestrial Production Follow-Up

Status: paused production follow-up backlog, current through 2026-08-22. The
Stage 12 exploratory experiment is complete and candidate-qualified;
production Steps 1 through 6 are complete, and the first Flat/local finite-Sun
Step 9 normal path is implemented. Its lifecycle, visibility, and direct-
illumination hardening remain open. The stellar screen-palette Step 7 port and
the ACES/conic appearance work are preserved at their documented resumption
points, not active execution. The owner-directed prerequisite is now the
[Distant-Sun Solar-Zenith Branch-Integrated Spectral Cache Design](../algorithm32/cache/solar-zenith-cache-design.md)
and its [contained execution plan](../algorithm32/cache/distant-sun-solar-zenith-cache-plan.md).
No production cache change is authorized by that research. This document owns
the wider paused production backlog. The selected visible-celestial resource
architecture remains the geometry-provided
[Celestial Contribution Cache](celestial-contribution-cache-design.md), with
separate distant-Sun, stellar-point-set, and Flat finite-Sun resources rather
than one aggregate cache controller.
Production typed-seam Step 3, Step 4 source/geometry boundaries, and distant-Sun
cache groups 5.1 through 5.8 are complete. Shader build/result slots and
lifecycle are source-family-specific, the conditional celestial shader
assembly vocabulary is installed, and the distant-Sun binary64 and scalar
`R32F` cache construction paths and the dedicated resource/controller
lifecycle are proven, and the independent ShaderBuilder participant now derives
geometry facts, builds the enabled resource, contributes lookup source, and
installs its binding atomically beside scattering. Replacement, failure,
last-valid, supersession, binding-replacement, cleanup, and final-disposal
behavior are now proven without disturbing scattering ownership. Step 5 is
closed with 522 Node specs, 10 real Three/WebGL specs, and exact 17-condition
GPU B1 parity at aggregate RMSE `11.820392` mW. Step 6 live distant-Sun
composition is split into groups 6.1 through 6.10 in the production
integration API plan. Groups 6.1 through 6.9 are complete: the production
runtime now performs geometry-owned horizon support, one completed-cache
lookup per accepted fixed sub-sample, matched live-scene suppression,
separate celestial accumulation, and exactly one pre-Color spectral addition.
The 524-spec Node lane and 11-spec real Three/WebGL lane pass; the live visual
matrix matches its CPU coverage oracle within `0.0000016689300537109375`.
Step 6.10 is complete. Current gates pass 538 Node specs and 12 real
Three/WebGL specs; complete GPU B1 remains `11.820392` mW.

The API-first execution sequence for the first promotion is owned by the
[Extraterrestrial Production Integration API Plan](production-integration-api-plan.md).
Its Step 1 [Production API and Ownership Contract]
(production-api-ownership-contract.md) now resolves public versus internal
ownership before any candidate semantics are ported; this document retains
the wider production backlog and capability ordering.

Pre-final appearance runs use one browser/condition shard at a time and leave
CPU and memory headroom for the interactive UI. They do not invoke the separate
CPU N4 atmospheric-scattering/cache authority, refined convergence, or CPU
full-frame previews. The normal distant-GPU builder's bounded 11-by-13-by-15
binary64 direct-celestial reference/support helper remains disclosed as part of
GPU setup rather than being mislabeled as the deferred CPU-heavy lane. Final
CPU-heavy verification uses concurrency `1`, below-normal priority where
supported, and reserved host resources. Long phases emit progress heartbeats
and fail only after declared inactivity; no absolute limit aborts measurable
forward progress. These execution controls do not relax the final scientific
gates.

The retained production scope is: (1) reconcile and promote accepted semantic
deltas with durable production tests; (2) after separate acceptance and
authorization, port the distant-Sun point-local spectral scene cache and
regenerate its comparison reports; (3) separately design any later common
local/far transform API or cache-shape relationship rather than making it a
premise of the distant field; (4) add live celestial placement/rotation
transforms and real application context-loss recovery; (5) finish Flat/local
finite-Sun static invalidation and visual parity; and (6) design any future
dark-scene or star adaptation and Geometry ambient response independently of
the rejected sky meter. These are paused production tasks, not reasons to
modify or reopen retained experimental evidence.

This plan does not restore the stashed external camera-bound frame evaluator
or import its experiment as a runtime dependency. The read-only stash labeled
`- extra-atmosphere refresh` is behavioral evidence for multi-point batching,
extended-source integration, and pre-Color composition; it contains no
persistent celestial cache to restore. Its finite-body depth and self-exclusion
evidence is retained only for the deferred
[resolved-Moon follow-up](moon-follow-up.md).

A read-only production-code survey now fixes the eventual production
destination and owner map in `src/algorithm32`, with geometry-mediated,
source-family celestial cache controllers and resources that remain separate
from each other and from the source-created atmospheric scattering cache.
Stage 12 is first implemented and
qualified in the runtime-closed production snapshot governed by the
[historical isolated implementation and qualification boundary](celestial-contribution-cache-design.md#historical-isolated-implementation-and-qualification-boundary).
The experiment copies the complete current `src/algorithm32` tree into a
sealed baseline and an initially byte-identical mutable candidate under
`scripts/extraterrestrial/`; it never imports the live production tree.
Generated runs, builds, browser bundles, profiles, caches, reports, readbacks,
captures, diagnostics, renders, logs, and scratch artifacts go only under the
ignored `tmp/extraterrestrial/` output root and never become implementation
inputs. The exact seams and working modules are owned by the
[production algorithm placement and owner map](celestial-contribution-cache-design.md#production-algorithm-placement-and-owner-map).
The candidate is an engineering qualification surface, not a production
runtime dependency or a second permanent implementation. `src/algorithm32`,
`src/flat32`, `scripts/algorithm32-star`, and the external stash remain
read-only until an explicit promotion checkpoint.

Stages 12.0 through 12.9 follow the
[proof-of-concept verification boundary](stage-12-implementation-topic.md#proof-of-concept-verification).
The experimental lane creates or runs no unit-test tree, unit-test suite,
unit-test files, test framework, or package test commands. Focused
self-verifying runners exercise real vertical slices, measure the declared
invariants and negative controls, and retain immutable
accepted/rejected/failed/interrupted runs. Durable unit and regression
coverage is Stage 12.10 production-promotion hardening, not a prerequisite for
developing or accepting an experimental cache strategy.
The concise
[progressive experimental goals](stage-12-implementation-topic.md#progressive-experimental-goals)
are the operating checklist; the detailed stages below supply their exact
work and observable conclusions.

The production integration uses the same first-class pipeline-participant
pattern proven by the latest candidate: `ShaderBuilder` prepares and binds the
independent generated resources, and the shader handle owns complete-set
replacement and disposal.
The defining difference is the cache's use and spectral output. The
atmospheric light-source cache supplies cumulative scattering density to
ordinary atmosphere transport, which produces `pathRadiance`; the celestial
resources supply complete atmosphere-transported point irradiance and extended
radiance to their live raster consumers, which produce `celestialRadiance`. Algorithm32
adds that spectral radiance to `pathRadiance` once before the existing Color
boundary. Separate cache controllers and the static-definition/live-query
split are supporting ownership and invalidation decisions, not a different
pipeline architecture. They share only neutral scalar-field GPU execution
mechanics; celestial passes do not acquire scattering orders or scattering
descriptors. The stash's standalone frame evaluator is not
promoted. The external code supplies the assembly precedent, while Stage 12
retains this repository's stronger successor-publication and
last-valid-preservation lifecycle.

The first implementation target is the bounded
`spherical-sun-stars-radial-v1` family:

- one bounded multi-member infinite point-set mechanics fixture;
- one distant uniform Sun-disk mechanics fixture;
- concentric spherical ground and atmosphere boundaries;
- a radially symmetric atmosphere;
- static field-source definitions separated from evaluated live placement
  states;
- geometry-owned celestial-to-model transforms and horizon-aware `(h, u)`
  cache stencils;
- complete per-point-member or per-extended-layer 15-channel transported
  spectra;
- one immutable two-layer roster with no celestial foreground edges; and
- live camera/scene rasterization after cache lookup.

These fixtures establish mechanics, not calibrated Sirius or Sun claims.
Every Moon contribution, finite-body opacity/depth contract, celestial mutual
ordering rule, flat geometry, profiled disk, and catalog-scale star field
follows only through a separately qualified capability family.

## Current Position

The Stage 12 candidate lane is complete. The accepted evidence is retained;
unpromoted semantic delta, deferred capability work, and calibration are now
production follow-up rather than conditions that reopen the experiment.
The early G2 synthetic aggregate-generation controller remains lifecycle
evidence only. The later integrated GPU path is the production template: its
distant-Sun, stellar-point-set, and finite-Sun plans/controllers/resources are
independent, and `ShaderBuilder` collects their bindings in one preparation
transaction. Production keeps that separation while removing two experimental
shortcuts: fake celestial `order: 1` values and celestial artifacts constructed
through `ScatteringCacheDescriptor`.
Immutable run
`000002-g0-boundary-contract-proof` accepted all 10 assertions and 25
classified negative controls. The sealed production source, baseline, and
initial candidate contain the same 285 files and aggregate SHA-256
`515987a60fdf661ef283e42bcf436c1bc5baf0a8768e33969a53e49da097612d`.
The machine policy proves the two-root boundary, local dependency and runnable
closures, baseline immutability, generated-output exclusion, and protected
production equality. The
[G0 decision manifest](../../../scripts/extraterrestrial/decisions/g0-decision-manifest-v1.json)
classifies every
[question that architecture cannot answer](celestial-contribution-cache-design.md#open-questions-not-inferable-from-the-architecture)
as fixed, provisional, or deferred to a named goal.

G1 is accepted by immutable run `000008-g1-geometry-transform-proof` with
11/11 assertions and 5/5 negative controls. The candidate now owns
named-frame evaluation, geographic receiver mapping, `(h, u)` field reduction,
horizon classification, full/partial/empty Sun support, and deterministic
query stencils. Its claim remains strictly geometry-only: no transported
field, generation lifecycle, raster, visibility, or GPU implementation has
been claimed or started.

G2 is accepted by immutable run `000009-g2-generation-lifecycle-proof` with
10/10 assertions and 3/3 negative controls. Its candidate-only controller
proves complete synthetic generation publication, exact reuse, failure and
supersession preservation, atomic replacement, distinct celestial slots, and
idempotent owned-resource disposal without backend ownership. It establishes
no transported payload, shader, raster, visibility, or GPU result.

G3 is accepted by immutable run `000017-g3-cpu-star-transport-proof` with 6/6
assertions and 2/2 negative controls. It uses geometry build paths and the
candidate atmosphere to retain two binary64 15-channel star irradiance fields;
exact nodes have zero measured relative error and the refined lattice meets a
15% relative or `1e-11` absolute interpolation policy. It establishes no Sun
field, raster, visibility, shader, or GPU result. The shared boundary-stencil
correction is requalified by accepted G1 run `000022` and G3 run `000023`.

G4 is accepted by immutable run `000024-g4-cpu-sun-disk-transport-proof` with
6/6 assertions and 2/2 negative controls. It derives 15-channel uniform
Sun-disk radiance from the existing `DistantSunLightSource` irradiance and
angular radius, then uses geometry paths and the candidate atmosphere for
direct transport; it introduces no second Sun definition or transport owner.
Exact-node error is at most `2.3049312601276617e-15`; the selected 15%
relative or `1e-11` absolute interpolation policy has normalized worst-case
`0.9009522166916419`. Full, partial horizon-crossing, and empty geometry
support reuse the shared Sun, and below-horizon/out-of-support samples are
exact zero. G5, G6a, G6b, G6c, G7, and G8 are subsequently accepted. The
isolated candidate lane is closed; production-integration Step 3 has completed
its execution-profile-normalized typed seams and non-regression gates. Step 4
source and geometry boundaries are complete. The current objective is the
appearance diagnostic and shared Color design described in the status above;
Step 9 production hardening remains a separate open track.

## Entry Conditions

The following are already available design inputs:

- stable typed spectral quantities and one canonical 15-channel
  spectral-density basis;
- Algorithm32 atmosphere path/transmittance operations and one Color boundary;
- exact point and extended conservation identities from retained experiments;
- read-only batch/extended-integration/composition semantics from the closed
  external stash,
  without treating its camera-bound evaluator as an implementation dependency;
- existing geometry-owned model/ray/cache-transform patterns; and
- the proven attachment-owned cache-controller lifecycle shape.

The following are not prerequisites for beginning 12.0:

- calibrated Sun or Sirius claims;
- XA3 completion;
- any Moon geometry, ephemeris, radiometry, texture, lighting, rendering, or
  occlusion work recorded in the
  [resolved-Moon follow-up](moon-follow-up.md);
- Flat32 migration follow-up;
- broad catalog-star capacity; or
- a final production/release resource profile.

They remain required only for the claims or later capability families that
depend on them.

No scientific or Flat32 prerequisite blocks 12.0. The eventual production
target, algorithm insertion point, physical owners, lifecycle split, and
first-pass module map are already determined. Before candidate implementation
writes begin, record the exact `src/algorithm32` checkpoint, create the
immutable baseline and mutable candidate, and prove the experiment's runtime
and write containment. Stage 12.0 then freezes the G0-owned live-state,
frame, identity, roster, quantity, and failure semantics. Later physical,
raster, visibility, numerical, resource, and public-API choices are scheduled
explicitly in the same decision manifest rather than guessed before their
own proof stages.

## Detailed Implementation Sequence

Every stage has an observable conclusion. A stage is not complete merely
because classes or shaders exist.

### 12.0 Freeze the implementation boundary and executable contracts

- Capture the exact current `src/algorithm32` tree into
  `scripts/extraterrestrial/baseline/src/algorithm32/` and
  seed
  `scripts/extraterrestrial/candidate/src/algorithm32/`
  byte-for-byte from that baseline. The baseline is immutable; only the
  candidate is an implementation surface.
- Record the source revision, scoped source-tree state, complete sorted file
  set, byte lengths, per-file hashes, aggregate hash, dependency-lock identity,
  runtime/proof-runner dependency closure, and explicit exclusions. Snapshot
  creation is create-once; a refresh creates a new versioned baseline rather
  than overwriting one.
- Add containment before physical work: switch the active topic to a two-root
  boundary and add a matching nested `AGENTS.md`. Source, copied code,
  fixtures, proof runners, and control metadata may be written only under
  `scripts/extraterrestrial/`; every execution or qualification output may be
  written only under the ignored `tmp/extraterrestrial/`. Create no
  experimental unit-test surface. The package lock, containment policy,
  baseline manifest, and locally installed locked package closure are
  control/dependency material rather than run output. Require experiment-local
  dependency resolution and recursive import-closure checks, reject symlinks
  and junctions, real-path-check both destination classes, retain create-once
  run records under `tmp/extraterrestrial/runs/` using the canonical
  [immutable run protocol](stage-12-implementation-topic.md#immutable-run-records),
  and compare before/after fingerprints for protected production paths. No
  runnable may import live `src/algorithm32`, `src/flat32`,
  `scripts/algorithm32-star`, an external repository, or generated output
  under `tmp/extraterrestrial/` as implementation, configuration, fixture, or
  oracle source. Tool and package dependencies are locked separately and are
  not implementation source.
- Reproduce the selected production baseline smoke and fingerprint probes from
  the sealed copy without running or extending its unit-test suite, and prove
  the candidate begins byte-identical. Confirm that the eventual
  `src/algorithm32` owner/module map is mirrored inside the candidate while
  every live production and application surface remains read-only.
- Freeze `Config.celestialSources` and the static `CelestialSourceRoster`
  boundary. Select the cheap live update ingress for evaluated placement
  states, observation/body-orientation state, and receiver state without
  routing those values through full `setConfig()`.
- Freeze the paired `ShaderBuilder` build-context and shader-provider
  contract: preserve the existing light-source-created scattering-cache
  participant and add the separate geometry-created celestial-cache
  participant, each with independent identity, resources, replacement, and
  disposal. Explicitly reject a sidecar renderer or frame-composer runtime.
- Freeze the distinct cache-use and quantity contracts. The scattering cache
  remains a cumulative scattering-density input sampled inside ordinary path
  transport. The celestial cache is sampled afterward by the live source
  raster; extended samples are transported spectral radiance, while point
  samples become spectral radiance exactly once through normalized response
  and exact pixel solid angle.
- Freeze how the visible Sun references the same canonical radiometry and
  evaluated placement identity as the atmospheric Sun without making either
  geometry or the cache a second Sun owner.
- Freeze the bounded multi-star fixture with at least two members and the
  distant uniform Sun-disk field-source definition plus their evaluated
  placement-state fixtures, including units, basis, named celestial
  frames/epochs, and provenance labels.
- Freeze the serializable source-definition, placement-state, layer/member
  roster, geometry-domain, generation, representation, query-packet, and
  failure schemas from the cache design, including distinct static-definition
  and evaluated-state fingerprints.
- Freeze the first-family capability envelope and explicitly reject every
  finite celestial placement, opaque celestial layer, nonempty
  `foregroundOf` graph, finite point source, Moon source, flat geometry,
  profiled/asymmetric disk, and catalog-scale input.
- Freeze only the renderer-neutral invariants already required by the
  architecture: ordered pixel-corner rays, exact pixel solid angle, normalized
  response, and camera state as live-only input. Defer the exact projection
  convention, adapter, visibility mechanism, point response, and Sun
  quadrature to 12.5, where they can be selected by a conservation proof.
- Record the GPU resource-path decision as deferred to 12.6. That stage selects
  between a generalized multi-resource executor and a celestial executor over
  the same externally owned backend using measured candidates.
- Fix the exact named-frame mechanics fixture and a provisional hard
  point-member capacity of 16 through 12.5. Defer `(h, u)` realization to
  12.1; point transport controls and tolerances to 12.3; Sun controls and
  tolerances to 12.4; final representation capacity and resource ceilings to
  12.6; browser consumption to 12.7; and qualifying hardware plus performance
  budgets to 12.8. Final public contract names are deferred to 12.10.
- Create one boundary-and-contract proof runner plus a decision manifest for
  source kind/measure compatibility, named-frame placement,
  static-definition versus evaluated-state identity, compatible
  placement-only reuse, stable layer/member indexing, additive roster shape,
  camera exclusion, and failure classification. The runner proves the frozen
  contract mechanics; it does not pretend that later controller, raster, or
  shader implementation already exists.

**Observable conclusion:** one reproducible immutable boundary-and-contract
proof run accepts the complete point-set and distant uniform Sun-disk fixtures
plus a two-layer, zero-edge roster; rejects unit, basis, kind, frame, roster,
foreground-edge, opacity, finite placement, capacity, family, and identity
errors; proves a compatible evaluated placement-state change updates only the
query fingerprint; and proves camera/FOV/viewport/display changes do not
change the physical-field fingerprint. The baseline manifest reproduces the
selected production tree exactly, the candidate starts byte-identical,
baseline probes pass, every runnable dependency resolves inside the experiment
or its locked package dependencies, mutation/escape controls reject the
declared escapes, and protected production fingerprints remain unchanged.
Output-root checks prove that generated files resolve under
`tmp/extraterrestrial/`, that the output root is ignored, and that no generated
output appears in source control; source-root checks prove that no authored or
copied experiment file escaped `scripts/extraterrestrial/`. The isolated
implementation checkpoint, live update semantics, shared Sun identity route,
renderer-neutral raster invariants, provisional capacity, and every deferred
raster, visibility, field-realization, GPU, numerical, resource, budget, and
public-name decision are present in the same decision manifest with an owner
goal and deadline. The manifest freezes
distinct scattering/celestial slots, post-transport pre-Color ordering, and
prohibited quantity routes. Their implementation is proven by the integrated
lifecycle, CPU consumer, and GPU live-pipeline runs in 12.2, 12.5, and 12.7
rather than by pre-implementation unit tests.

Through candidate qualification, every production-style path named below
denotes its mirrored path inside
`scripts/extraterrestrial/candidate/`. It becomes a live
`src/algorithm32` path only during explicit promotion.

### 12.1 Implement the geometry celestial transform and cache domain

- Add the geometry-owned operations to `SphericalEarthGeometry`, delegating
  the first-family reduction to `SphericalCelestialContributionDomain`, for
  domain description, celestial
  placement resolution, build-sample resolution, receiver stencil resolution,
  direction stencil resolution, compatible query-packet preparation, layer
  support resolution, and controller creation.
- Define the observation-state packet: named celestial frame, epoch/time
  scale, body orientation, geographic receiver state, and model frame.
- Match every evaluated placement state to its static field-source definition
  and reject source/frame/form/time-scale/provider-contract mismatches before
  transformation.
- Implement `directionToSource` consistently from receiver toward source;
  reject camera-space or ambiguous incoming-direction inputs.
- Implement the spherical first-family reduction:

    ```text
    h  = length(receiver) - groundRadius
    mu = dot(localUp(receiver), directionToSource)
    u  = horizonNormalize(h, mu)
    ```

- Classify ground/horizon, top-atmosphere path, source support, seams, and
  out-of-domain cases before interpolation.
- Resolve the distant Sun's current center direction and angular support
  without introducing finite depth, opacity, or celestial foreground
  ordering.
- Provide one shared semantic definition for CPU and shader transforms. No
  cache or consumer may reconstruct these values from texture layout.

**Observable conclusion:** one reproducible immutable geometry-transform proof
run covers multiple epochs, longitudes, latitudes, altitudes,
zenith/horizon/below-horizon directions, longitude wrap, invalid domains, at
least two distinct star directions, and full/partial/empty Sun support.
Geography/time changes produce new query-packet fingerprints, Sun support, and
stencils while leaving the first-family field plan and two-layer roster
unchanged.

### 12.2 Implement generation identity and the geometry-owned controller

**Historical G2 proof scope:** this synthetic aggregate controller established
lifecycle invariants before the final GPU integration existed. The current
production plan does not promote this controller; it applies those invariants
to the separate source-family controllers and complete ShaderBuilder
transaction described under Current Position.

- Implement the immutable layer-roster table, bounded stable point-member
  table, and separate dense point-member and extended-layer indices.
- Implement physical-field, representation, runtime-compatibility, generation,
  and query-state fingerprints.
- Add the geometry-created, attachment-owned controller under
  `caches/celestial/` and the distinct
  `celestialCacheController`, `celestialCacheGeneration`, and
  `celestialCacheIdentity` build-result slots. Rename the existing generic
  attachment slots to `scatteringCacheController`, `scatteringCache`, and
  `scatteringCacheIdentity`; do not retain aliases or overload either shader
  namespace.
- Extend `ShaderBuilder` and `Algorithm32ShaderHandle` with this second
  pipeline participant in the same setup transaction as the existing
  light-source-created scattering cache. The celestial generation supplies
  its own descriptor, payloads, bindings, and shader contribution; no
  application adapter or frame evaluator installs it out of band.
- Implement plan derivation, exact reuse, serialized staging, cancellation,
  supersession, complete-only publication, failed-candidate cleanup, active
  generation preservation, replacement, and idempotent disposal using
  synthetic payloads first.
- Report retained logical, packed, peak, and resident resource categories
  independently.

**Observable conclusion:** one reproducible immutable integrated lifecycle
proof run shows exactly one aggregate generation publishing after its layer
roster, complete point-member table, and single Sun extended resource finish;
no partial star set becomes active; exact requests reuse it; failed,
cancelled, and superseded candidates preserve it; replacement disposes the
prior generation only after publication; and disposal releases every owned
resource exactly once without disposing the backend. The same run proves the
distinct scattering/celestial build-result, descriptor, binding, and shader
slots using synthetic payloads.

### 12.3 Build and query the transported star point-set on the CPU

- Traverse the geometry-owned `(h, u)` nodes for every bounded point member.
- Resolve the exact build ray/path through geometry and obtain channel-wise
  direct transmittance from the atmosphere owner.
- Store the complete per-node 15-channel
  `E_point = V_build * T * F_source` result in binary64 logical storage.
- Preserve stable member identity and per-member accounting while publishing
  one point-set cache-query/batch result; camera projection and point-response
  distribution remain in 12.5.
- Implement explicit geometry-stencil interpolation, exact-zero horizon
  classification, and fail-loud out-of-domain behavior.
- Keep live celestial placement outside the field fingerprint. Query the same
  field at new geometry-resolved directions after epoch/geography changes.

**Observable conclusion:** one reproducible immutable CPU star-field proof run
shows that every member's exact nodes and stratified off-node probes match
independent direct binary64 transport within the predeclared bound.
Below-horizon values are exact zero without interpolation leakage. At every
probe, the aggregate point-set packet equals the channel-wise sum of its
retained member packets without coverage or opacity. Member radiometry,
roster, or atmosphere changes replace the generation, while placement-only
and camera-only changes reuse its transported fields. Raster flux conservation
remains an observable conclusion of 12.5.

### 12.4 Derive and query the Sun-disk extended field on the CPU

- Read the existing atmospheric Sun's canonical radiometry and evaluated
  placement identity. The light source remains the only Sun definition and
  the atmosphere remains the only direct-transport physics owner; neither
  geometry nor the celestial cache may create, mutate, or independently
  derive a competing Sun source.
- Traverse the same geometry domain for the distant uniform Sun-disk fixture
  and cache its complete per-node 15-channel derived disk radiance,
  `C_extended = V_build * T * L_source`, using that shared Sun definition and
  atmosphere transport. This cache is disk-rendering input, not atmospheric
  illumination input and not a second application of transmittance.
- Keep the current Sun center and angular support in the geometry query packet
  as evaluated from the shared placement state, and enforce support through
  cache-owned logical queries.
- Probe full directional support, no directional support, horizon crossing,
  and spectral transmittance variation without requiring a camera raster.

**Observable conclusion:** one reproducible immutable CPU Sun-field proof run
shows that exact and interpolated cache probes meet the predeclared
direct-transport bound; out-of-support and ground-blocked directional queries
are zero for a reported reason; and the live query packet derives the expected
Sun center, angular support, and geometry stencils from the existing
atmospheric Sun identity without finite celestial depth or a pixel-raster
dependency. It does not render a disk, add a second Sun owner, or change
ordinary atmospheric lighting.

### 12.5 Implement the live CPU consumer and spectral composition

- Render the visible Sun disk by consuming G4's derived extended radiance at
  the physical footprint directions. This is the first stage that projects,
  clips, quadratures, and composes the disk; G4 only supplies its
  camera-independent transport data.
- Implement internal `CelestialFrameEvaluator` qualification machinery as a
  separate raster/pixel consumer over the existing one-ray `Reference`
  atmosphere result; do not expose it as a production facade path and do not
  hide response spreading or a Sun footprint inside `Reference.evaluate()`.
- Make the ray probe the sole raster ingress: consume its ordered pixel-corner
  rays, physical sample rays, and matched-direction visibility answers. The
  evaluator does not select or reconstruct a camera projection; the probe's
  rays define what is rendered. Derive exact spherical pixel solid angle,
  clipping, and normalized point response with explicit off-raster mass from
  that probe contract.
- Implement the declared extended pixel-footprint quadrature and compare full,
  empty, partial, and horizon-crossing pixel cases with an independent
  high-order angular integral.
- Query live visibility through the ray probe at the exact point direction and
  matched extended footprint directions; a response pixel or center ray is
  never substituted for a physical source-direction probe.
- Reject celestial foreground edges in this family. Evaluate each star and
  the Sun independently while applying ordinary live scene visibility at
  their selected physical directions.
- Query each point member's irradiance once before response spreading and
  query extended radiance at physical footprint directions.
- Retain separate path, point, extended, celestial, and pre-display packets.
  The active production runtime has no spectral endpoint packet, so its
  immediate pre-display spectral sum is path plus celestial while captured
  scene RGB remains on the established Color bridge. Any future compatible
  spectral endpoint remains separately labeled.
- Add `celestialRadiance` once before the Color boundary without mutating or
  relabeling `pathRadiance`.

**Observable conclusion:** one reproducible immutable CPU
raster/conservation/composition proof run shows that the same cache generation
conserves per-member and aggregate point-set flux plus Sun-disk flux across
camera rotation, FOV, projection, resolution, and source motion. Renderer
foreground blockers affect only selected physical source directions; a scene
blocker at a response pixel is not mistaken for visibility at the exact star
direction. Extended footprint integration converges to the uniform-Sun-disk
oracles and live occlusion never erases path radiance. Wrong routes for
destination-ray transport, destination-pixel point visibility, edge
renormalization, center-only extended visibility/transport, response-overlap
visibility, duplicate coverage/transmittance, or duplicate composition fail
deterministically.

### 12.6 Implement GPU cache packing, construction, and lookup

Before selecting GPU packing, design and prove the primary celestial-cache and
`CelestialSource` query interface for the existing distant Sun/celestial
sphere. Geometry supplies coordinates, support classification, and paths;
source radiometry remains source-owned. Transformable bodies, Moon support, and
live animation are deferred extensions, not prerequisites for this interface
proof or later GPU resource-path generalization.

The G6a proof must use source-returned cache fragment specifications: source
identity, source-local frame/anchor/extent, dimensions/channel layout,
radiance payload, support metadata, and composition policy. Geometry transforms
and validates those fragments, builds sparse pages/indirection tables, applies
transport exactly once, and exposes one `sampleLight(geometryCelestialQuery)`
shape. Implement only the spherical distant Sun first. The flat north-polar
azimuthal-equidistant/dome adapter is an explicit design target sharing that
shape, not a claim of flat-family implementation or qualification.

Treat Stage 12.6 as three explicit subgoals: G6a freezes the source/geometry
interface, G6b selects and proves scalar `R32F` packing, and G6c constructs,
publishes, and shader-queries the actual GPU resource through the established
backend. G7 begins only after G6c accepts; it performs live ray/pixel
consumption and spectral composition rather than resource construction.

- Implement the first representation target in the established cache format:
  scalar `R32F` array textures with one native spectral channel per layer.
  Point and extended contributions retain separate `(u, h)` arrays, but the
  celestial cache must use the same scalar layout/precision conventions as
  existing caches rather than introducing an `RGBA32F`-specific format.
- Use the established cache-render shader-pass route. Each source-builder
  extension contributes declared radiometry plus cache-build shader
  inputs/modules; geometry transforms and assembles those contributions into
  the common celestial pass plan; `CachePassAssembler`, `CacheGpuExecutor`,
  and the externally owned `ThreeCacheBackend` construct the scalar `R32F`
  resources. A direct upload of CPU-computed final transported cache values
  is not an accepted substitute.
- Use nearest texel access plus explicit geometry-provided bilinear indices
  and weights so GPU lookup matches the CPU stencil.
- Execute the candidate atmosphere transport shader operations inside those
  cache-render passes, exactly once per constructed field value. Source
  radiometry is an input; geometry supplies coordinates/support/path data;
  neither source nor geometry becomes a second atmosphere owner.
- Stage and validate all resources before one aggregate publication.
- Limit readback to exact nodes, discontinuity probes, stratified
  interpolation probes, and checksums.

**Observable conclusion:** one reproducible immutable GPU construction and
parity proof run produces a capability report identifying layer/member
capacities, texture counts, dimensions, array layers, formats, precision,
bytes, render-build time, and backend limits. All 15 channels at exact and
interpolated probes meet the predeclared CPU parity bound, the roster/member
table and all payloads publish together, and a resource/capability failure
preserves the active generation.

G6c is accepted by immutable run `000030-g6c-gpu-cache-render-proof`: real
headless WebGL2 renders one cache pass into an 11 x 13 x 15 scalar `R32F`
array field, with all 2,145 exact nodes selected-read back against the CPU
oracle at maximum error `3.7420860638829985e-7`. It also proves the distinct
celestial runtime binding, explicit geometry-stencil lookup contract, and
failure-preserving publication. G7 is accepted by immutable run
`000046-g7-live-gpu-consumption-proof`: the published distant-Sun cache is
sampled through the live spherical shader path, with four reconstructed
sub-pixel rays and matched scene-hit texels. Clear output contains full and
partial Sun disk coverage; replacing the live hit texture with all blocked
values produces exact zero without a cache rebuild. This acceptance is limited
to the distant Sun; GPU stars and the remainder of the broad G7 observable
conclusion are deferred to later capability work.

G8 is accepted by immutable run `000047-g8-distant-sun-qualification`: the
declared Chrome-headless WebGL2/ANGLE SwiftShader contract records 10 ms
initial render-build, 20 ms live two-frame execution, 8,580 B resident and
8,736 B peak tracked storage, exact reuse, failure preservation, repeated
disposal, and fresh-backend field rehydration. This is a Sun-only hardware
qualification, not GPU-star or application context-loss qualification.

## Production Follow-Up Backlog

The following work was transferred from the completed candidate lane. It is
implemented only through an explicit production promotion and must not modify
or reinterpret retained experiment evidence. Visual image captures are accepted by immutable run
`000048-g7-visual-capture-proof`; normal `ShaderBuilder`/shader-handle
celestial installation is accepted by `000064-g7-three-atmosphere-integration`,
but celestial replacement/rebuild qualification; GPU star projection,
off-frame response, matched visibility, and conservation; live celestial
transform/placement refresh; and real application context-loss restoration.
Star source records will use the canonical `celestial-rh-v1`
latitude/longitude direction and explicit angular support; spherical shell and
flat-dome placement remain geometry presentation transforms.
The first catalog roster is now fixed as the 500 brightest valid-position,
valid-`Vmag` entries from CDS/VizieR Bright Star Catalogue `V/50/catalog`,
ordered by ascending `Vmag` then HR identifier. Its J2000 declination/right
ascension map directly to `celestial-rh-v1` latitude/longitude. V magnitude
and optional B-V are catalog photometry only: their normalized relative V-band
flux ranks members but cannot substitute for the native-15 stellar packets
required by transported-cache construction. The checked-in source input,
deterministic parser/selector, source-definition adapter, and contract proof
must remain the single owner of that selection rule.
Immutable run `000109-pre-g9-bright-star-catalog-contract-proof` accepts this
catalog-coordinate/placement boundary only; it does not reduce the remaining
star-cache radiometry, GPU-raster, live-transform, or flat-dome qualification
work.
The selected live star transform is the shared pole rotation
`Rz(-thetaEarth(t))`: spherical and flat adapters apply it before their
respective shell or dome placement, without rebuilding cache payloads.
Flat implementation additionally requires explicit `rotationEpoch`, period,
and zero-dome-azimuth alignment. The base map uses the Unix epoch with
longitude zero at canonical `+X`/dome azimuth zero; later real-sky calibration
is an explicit offset, not an inferred projection behavior.
The initial Flat calibration has no extra offset: calculate the same rotation
angle as the spherical adapter at the current simulator time, apply the same
`Rz(-thetaEarth(t))`, then perform the Flat dome transform. This is the
default implementation path; a real-sky calibration is a later opt-in
alignment offset, not a prerequisite for the initial 500-star roster.
At the base epoch, equal celestial and terrestrial latitude/longitude define
the overhead alignment invariant; Flat dome calibration must realize that same
catalog meaning.
Flat north-polar azimuthal-equidistant/dome mapping and finite-body/Moon work
remain separate production capability designs. They no longer gate the closed
candidate lane.

### Advanced Algorithm32 validation work: `bruneton-paper`

The mandatory [`bruneton-paper` validation-profile and regeneration stage](../algorithm32/production/production-implementation-plan.md#13-implement-the-bruneton-paper-validation-profile-and-regeneration-path)
was advanced before extraterrestrial production integration. Production now
has the generic execution-profile seam and a complete 17-condition GPU B1
regeneration path. The reflected-68 default scores aggregate B1 RMSE
`11.820392` mW. The reflected-68 native-N4 CPU/GPU oracle was refreshed from
current production on 2026-08-11 and its complete Node and Three/WebGL gates
pass. Remaining B2/B3 regeneration remains Algorithm32 validation work rather
than a prerequisite for extraterrestrial Step 3.

### Pre-G9.1 Create and use the stellar celestial source — complete

Create a candidate-only `StellarCelestialSource` over the accepted BSC V/50
500-member roster. It is the sole owner of catalog selection/identity and must
expose two distinct products:

1. its static point-source definitions, including the immutable catalog
   identity, `celestial-rh-v1` coordinate, and explicit point support; and
2. its live canonical placement states for a requested epoch, containing the
   catalog unit direction but no geometry, cache-coordinate, or camera state.

Geometry must consume this source rather than hand-assembling BSC definitions
or placements. It applies the shared time/body transform and then chooses the
spherical shell or Flat dome presentation transform. The first Flat path uses
the inherited zero alignment and same calculated `Rz(-thetaEarth(t))` as the
spherical path. The source must enter the celestial runtime roster through an
explicit star-source slot, but it must not fabricate native-15 packets from
Vmag or B-V, create a transported cache field, or raster stars. Those are
subsequent radiometry and GPU-star steps.

**Observable conclusion:** a contained proof constructs the source from the
checked-in catalog, obtains all 500 source definitions and live placements
only through its public interface, passes them through spherical geometry at
the Unix epoch and a rotated epoch, and verifies stable source identity,
overhead/alignment behavior, placement refresh without catalog/cache-identity
change, and rejection of a mismatched catalog/time/frame contract.

Accepted immutable run `000112-pre-g9-stellar-celestial-source-proof` meets
this conclusion with 8/8 assertions and 3/3 negative controls. Its source is
placement-only by construction: it publishes no cache fragment or inferred
stellar radiometry.

### Pre-G9.2 Materialize stellar photometry and the bounded point cache — complete

Extend `StellarCelestialSource` with a source-owned
`StellarSpectralPhotometry` companion. Import the versioned Pickles
flux-calibrated templates plus SVO Generic Johnson B/V response and Vega
zero-point data as checked-in catalog inputs. Select two nonnegative Pickles
shapes that bracket the catalog B/V flux ratio, blend their V-normalized
native-15 shapes to satisfy the measured B-V constraint, then scale once to
the observed BSC V magnitude. Observed V magnitude is apparent received flux;
there is no stellar luminosity reconstruction or inverse-square adjustment.

Use those packets in the existing point-set transport cache and geometry's
ordinary cache-render contract. The initial GPU representation is capacity 512
with a 32-by-16 member tile grid and one R32F layer per native wavelength,
giving a 352-by-208-by-15 resource for the current 11-by-13 `(u,h)` domain.
The 500 active members are packed by geometry; twelve unused tiles are zero.
The full field identity includes source/template/filter/zero-point/basis and
packet hashes but excludes live time, rotation, placement, receiver, camera,
and visibility.

**Observable conclusion:** one contained proof verifies the imported input
hashes; all 500 nonnegative native-15 packets; Johnson-V reconstruction within
the BSC rounding tolerance; fallback/quality provenance; CPU exact-node and
bounded off-node transport; full member conservation and geometry tile lookup;
zero unused tiles; and source/cache identity stability across live placement
updates. Point projection, spread, and live scene visibility are not part of
this step.

The original packet-materialization substep was accepted by immutable run
`000113-pre-g9-stellar-photometry-proof`, but its nearest-template shape
selection later measured B residual p95 `0.15099` mag and maximum `0.97205`
mag in `000162-stellar-photometry-b-band-reconstruction-experiment`. The
superseding bracketed B/V policy is accepted by
`000163-stellar-photometry-b-band-reconstruction-experiment`, which
independently reconstructs both catalog B and V for all 500 packets within
`8.881784197001252e-16` mag, and by
`000164-pre-g9-stellar-photometry-proof`, which requalifies normal packet
materialization and bounded blend provenance. Immutable run
`000122-pre-g9-stellar-tiled-cache-cpu-proof` accepts the full CPU/cache-plan
substep: all 500 fields are packed into the 512-capacity layout, every active
tile conserves its binary32 value, all twelve inactive tiles are zero, and
live placement changes do not invalidate the static field. Real headless
WebGL2 execution is accepted by immutable run
`000142-pre-g9-stellar-tiled-cache-proof`: the normal tiled-star GPU
controller constructs the full 352-by-208-by-15 `R32F` resource through one
fifteen-submission cache-render pass, preserves selected scalar values within
binary32 tolerance, retains unused tile zeroes, and preserves the active
generation after injected allocation failure. Earlier apparent renderer
timeouts were a proof-server MIME defect: `browser/index.html` was served as
`application/octet-stream` rather than `text/html`, so Chrome downloaded it
without executing the module.

### Pre-G9.3 Qualify normal celestial replacement/rebuild — complete

The normal `Algorithm32` facade, `ShaderBuilder`, shader-handle, and
`EffectComposer` route must stage a complete successor celestial generation,
publish its distinct runtime binding only after successful construction,
preserve the active pass/configuration/binding when staging fails, and retire
each field exactly once at replacement and final handle disposal.

Immutable run `000144-pre-g9-celestial-replacement-runtime-proof` meets this
conclusion with a real Chrome-headless WebGL2 backend. It rebuilds the distant
Sun primary cache from a 0.12-radian to a 0.18-radian source support, observes
the new cache sample and runtime texture binding, injects an allocation failure
for a 0.24-radian candidate without publication, and confirms that only the
current field remains live until shader-handle disposal.

### Pre-G9.4 Consume the stellar point cache in the live GPU raster — complete

The accepted tiled star generation is consumed by the normal
`Algorithm32`/`ShaderBuilder`/`EffectComposer` pass. The initial static epoch
uses canonical catalog directions. For each member, the shader fetches its
geometry stencil from the `352 x 208 x 15` R32F tile field, tests the exact
source direction against the uncropped spherical pixel footprint, tests the
matching renderer scene-hit sample, and contributes `E / Omega_pixel` once.
The response is one inside its single exact footprint and zero outside, with
no edge or off-frame renormalization. Live celestial transforms are deliberately
not part of this static-epoch raster step.

Immutable run `000152-pre-g9-stellar-live-raster-proof` accepts this through
real Chrome-headless WebGL2. It verifies the complete 500-member field and
runtime binding, positive selected field readback, assembled exact-solid-angle
consumer, live blocker suppression, and an opposite-camera off-frame delta
below one thousandth of the centered response.

### Pre-G9.4a Rejected HDR sky-derived display adaptation experiment

Current disposition: rejected and disconnected from production on 2026-08-12.
The historical candidate sequence below is retained as experiment evidence, not
current guidance. Production Color publishes no exposure texture binding, the
Three installer constructs no meter runtime, and the fixed Figure-1 coefficient
is active. Future star adaptation must receive a separate design and
qualification.

The stellar source radiometry is accepted through `000163` and `000164`, and
the renderer-backed one-hour-after-sunset scene `000165` still has no visible
sky stars under the fixed daylight display coefficient. Add a Color-owned HDR
reduction/encoding path with these constraints:

Implementation is now active in the candidate: Geometry provides a 4-by-8
observer-local midpoint-in-cosine quadrature; Color renders ordinary
atmospheric `pathRadiance` only into a live 1-by-1 `R32F` illuminance texture
before the normal pass; and the normal Color shader samples that texture for
one uniform exposure. The retained ISO-EV12 end-to-end renderer run is `000169`, which
measures `0.0053322226740419865 lux` at the one-hour-after-sunset observer and
shows resolved stellar pixels. It is implementation evidence, not yet the
full bright/dark, source-exclusion, lifecycle, and calibration qualification.
Run `000170` then removes the harness-owned `groundLinearSrgb` material
override: the subjective capture now installs Geometry's default Lambert ground
endpoint, which is black until a separately-owned ambient-light controller is
introduced. This establishes the endpoint ownership boundary before the
Flat32 ambient-light comparison.
Run `000172` adds one neutral ordinary-scene `AmbientLight` to that Geometry
endpoint. Before the scene capture, it refreshes the same Color-owned `R32F`
sky probe used by display exposure and maps `E_v / 10,240 lux` to light
intensity. The retained result records `0.0053322226740419865 lux` and
`5.2072487051191278e-7` ambient intensity; the ground remains dark while the
stellar sky remains visible. This is a contained first-frame CPU readback
bridge for Three lighting, while Color continues to consume the texture on GPU.

The former threshold curve is superseded: it treated `pi * 5 cd/m²` and
`pi * 0.005 cd/m²` as exposure thresholds, leaving gain exactly `1` through
the entire photopic range. It consequently assigns the same exposure to the
`1,436.133 lux` Sun-facing sunset and the `185.739 lux` twenty-minute
twilight, then jumps to the bounded maximum only for the one-hour-dark scene.
Those CIE values define visual operating regimes, not a display exposure.

The candidate now uses a global photographic key: the geometry meter defines
`L_adapt = E_v / pi`, and Color derives a single exposure
`min((a * pi / K) / max(E_v, E_min), gain_max)` for completed scene-linear RGB,
where `a = 0.18` is the Reinhard middle-gray key and `K` is the retained
Figure-1 coefficient. This derives the reference illuminance from the actual
display mapping (about `1,931 lux`), rather than from the previously unused
ISO-EV12 constant. It retains one exposure for atmosphere, Sun, stars, and
the captured scene bridge; no time, source, star-specific, or per-pixel
normalization is introduced. Runs `000174` through `000179` remain historical
evidence of the superseded curve and establish the required bright/twilight/
dark comparison inputs for requalification. The temporary Three ambient bridge
continues to read the same physical meter but retains its separate `E_v / 10,240`
daylight-scene calibration: applying Color's inverse display reference to
Three intensity cancels adaptation and produces an over-bright twilight ground.

One retained candidate iteration superseded an earlier removal and sampled the
same `RGBA32F` probe that Geometry uses: the RGB channels remain direct HDR
Lambert irradiance, while photopic `E_v` supplies one frame-wide adaptation
gain. That gain is `clamp(E_ref / max(E_v, E_ref / 16,384), 1, 16,384)`, with
`E_ref = 0.18 * pi / K`; it brightens low-light scenes, leaves daylight at
one, and has no time, source, star-specific, or per-pixel input. Run `000194`
returns visible colored twenty-minute twilight with the same physical HDR sky
payload, and `000195` retains the bright-side sunset check.

**HDR scene-input ambient bridge — implemented, analytic qualification next:**
the temporary normalized `RGB_chroma * E_v / 10,240` bridge is removed.
Geometry now passes `E_sky_RGB(n)` directly to Three's Lambert ambient input
with unit intensity, and Three supplies the `1 / pi` diffuse factor. The
normal `EffectComposer` uses half-float offscreen linear-sRGB buffers; Color
now consumes that HDR scene input directly rather than converting it through a
clamped display-RGB inverse bridge. Runs `000191` (civil twilight) and
`000192` (sunset) confirm the normal runtime accepts the direct values,
preserves their warm chromaticity, and avoids the previous white ground.

The remaining qualification is analytical rather than a new arbitrary
calibration: render a neutral 18% Geometry-owned Lambert patch at sunset,
civil twilight, and one hour after sunset; compare the scene-linear target to
`rho * E_sky_RGB / pi` before the globally adapted Color mapping. Require proportional
irradiance response and no clamp/normalization at or above the former
`10,240 lux` reference. Only Color may compress the resulting HDR radiance
for display.

- Meter one frame-wide exposure from completed clear-sky spectral luminance;
  do not use time, a day/night mode, source identity, a star-specific gain, or
  a per-pixel normalization.
- Have geometry provide a fixed observer-local upper-hemisphere quadrature.
  Evaluate ordinary atmosphere path radiance to the top boundary at each probe
  direction, exclude scene endpoints and celestial contributions, CIE-project
  it to photopic luminance, and reduce
  `sum(Lv * max(dot(up, direction), 0) * solidAngleWeight)` into a small HDR
  texture. The quadrature must return `pi * Lv` for uniform radiance and must
  remain camera/FOV/viewport independent.
- Apply that one exposure to the completed scene-linear RGB before the
  standard Figure-1 exponential display mapping. Preserve all source
  radiance, transport, visibility, cache, and spectral-to-linear-sRGB steps.
- Keep the captured scene bridge participating in the final uniformly exposed
  image, while sky-only metering ensures that atmospheric scattering alone
  controls stellar masking.
- Qualify bright-scatter star masking, dark-scatter star emergence, uniform
  exposure, retained Sun chromaticity, no source/cache identity change, and
  real HDR render-target/reduction resource lifecycle. Establish the reduction
  statistic, temporal behavior, calibrated bounds, and display target from
  measurements rather than an arbitrary visual multiplier.
- Use the approximate external twilight target
  `m_limit(theta) = 1.07 * theta - 10` (solar depression `theta` in degrees)
  to calibrate and report the shared meter's Color-exposure and
  Geometry-ambient response. Compare measured rendered emergence against that
  target, but do not implement it as a runtime magnitude threshold, time
  branch, or star-specific visibility gate.
- `000185-twilight-local-brightness-calibration` is the accepted first grid:
  `E_v` is `1421.196, 252.268, 7.986, 0.03978, 0, 0 lux` at solar depression
  `0, 3, 6, 9, 12, 15` degrees respectively. The zero-valued 12/15-degree
  dark end prevents curve fitting; first identify and correct that meter or
  atmospheric-result floor, then repeat this unchanged calibration grid.
- `000186-twilight-sky-probe-range-diagnostic` resolves that first question:
  the meter reduction is not the floor. All 32 geometry-provided atmospheric
  samples are positive at 11 degrees, but all are exactly zero at 12 and 15
  degrees. Defer response-curve fitting until atmospheric dark-twilight
  path-radiance support is diagnosed; changing exposure or ambient cannot
  restore a zero upstream signal.
- Replace the temporary white `Three.AmbientLight` bridge with Geometry-owned
  sampled sky irradiance. Extend the existing upper-hemisphere quadrature to
  emit spectral/scene-linear-RGB `E_sky(n)` for each endpoint normal; Color
  derives its photopic `E_v` exposure state from the same samples. Qualify
  horizontal-ground irradiance, twilight chromaticity, monotonic darkening,
  and source/camera independence. Flat32's elevation-based ambient floor is a
  read-only comparison artifact, not a valid response model.

### Pre-G9.4b Qualify the distant-Sun solar-zenith field

The current distant-Sun scattering cache uses an altitude-plus-W27
reference-column lookup. It does not preserve the local spherical Sun
elevation at an actual view-ray sample. Accepted immutable run
`000205-subjective-globe-twenty-minutes-after-sunset-actual-point-j1-control-render`
establishes the discrepancy through direct per-sample spherical first-order
transport: at the retained San Jose 20-minute fixture it measures `130.016`
lux, versus `185.739` lux for the current cached renderer in `000194`.
Accepted run `000497` further closes `97.20795%` of the focused nautical
center/flank deficit with actual-point direct first-order radiance while
holding the old N4 cache fixed. Both controls are diagnostic only; neither is a
production cache replacement.

Leave the current reduced cache and its reports in place during this design
step.

The [solar-zenith cache design](../algorithm32/cache/solar-zenith-cache-design.md)
owns the contained numerical representation. Its
[distant-Sun execution plan](../algorithm32/cache/distant-sun-solar-zenith-cache-plan.md)
owns scene support, packed altitude/zenith inventory, the actual-point N4 solver, offline
compiler, contained loader, and evidence gates.

- Qualify only the radially stratified spherical atmosphere under a distant
  collimated source in this prerequisite.
- Keep the existing `(h, W27)` cache unchanged until the uncompressed
  point-local scene cache and bounded packed residency are accepted.
- If a later production port is authorized, define live distant-source
  transform ingress and requalify direct/higher-order transport, rendering,
  HDR meter, endpoint lighting, residency, and lifecycle behavior.
- Do not require or infer a common local/far field shape. Finite/local source
  coordinates, inverse-square physics, and any shared transform interface
  remain a separate design after distant acceptance.
- Regenerate Bruneton reports only after the replacement is accepted. Earlier
  reports remain archived measurements of the reduced `(h, W27)` cache.

**Observable conclusion:** separate design/proof records establish the
distant-Sun point-local scene cache without changing the current cache. A
later integrated replacement record demonstrates that lookup matches direct
spherical transport across horizon-crossing, finite-endpoint, and below-horizon
source cases at every supported scattering order, with the resource/lifecycle
budget accepted. A replacement report set records its provenance and does not
overwrite earlier reference-column results.

### Pre-G9.5 Implement and qualify the flat/local finite-Sun family

Initial source/geometry and GPU-cache slices are accepted by immutable runs
`000080-pre-g9-flat-local-finite-sun-contract-proof` and
`000082-pre-g9-flat-local-finite-sun-gpu-cache-proof`. They establish the
configured 3,000-mile/16-mile defaults, one source-owned radiance definition,
finite support/solid-angle mechanics, and a real WebGL2 `1 x 1 x 15` `R32F`
source-relative cache. The latter holds static source radiance; live Flat
geometry supplies center/radius and the shader integrates the atmospheric
segment before the body. The remaining qualification items below are still
open.

`000087-pre-g9-flat-local-finite-sun-runtime-proof` additionally accepts the
normal candidate facade/`ShaderBuilder`/shader-handle/`EffectComposer` path.
It installs a combined finite-disk, finite atmospheric-segment, and ordinary
cumulative-scattering shader, then verifies that a 100,000 m horizontal center
update reaches the live uniform without replacing the celestial generation.

`000092-pre-g9-flat-local-finite-sun-ground-scenes-proof` accepts retained
512 x 512 clear, fully scene-blocked, and partially scene-blocked images
through that same normal pass. The scene uses the `FlatEarthGeometry`-owned
ground plane, renderer-produced depth/hit inputs, the accepted Flat32
observer-centered dome (100 km apex; 1,926,774 m maximum view-ray extent), a
78-degree vertical FOV, and an off-center local Sun. The dome removes the
planar grazing-ray white-horizon discontinuity without changing cache
construction. Its display-only exposure is intentionally separate from the
source packet/cache. Static-invalidation replacement and failure preservation
remain open.

Accepted runs `000100-union-glacier-flat-0-render`,
`000101-union-glacier-flat-180-render`, and
`000106-union-glacier-flat-90-render`, and
`000107-union-glacier-flat-45-render` retain boxed Union Glacier Flat/local
scenes at the frozen 6.283 Mm-horizontal closest-approach placement, the
13.347 Mm-horizontal Flat 45 placement, the 22.648 Mm-horizontal Flat 90
placement, and the 31.413 Mm-horizontal Flat 180 placement. Each uses the
720 x 414, 70-degree horizon-facing camera and six Flat32 review boxes. The
Flat 0 Sun is 37.538 degrees above frame; the Flat 45 Sun is 19.886 degrees
above the horizon and in frame; the Flat 90 Sun is 12.034 degrees above the
horizon and in frame; the Flat 180 Sun is 8.738 degrees above the horizon and
in frame. Superseding run `000102-union-glacier-flat-180-render`
makes the center a required geometry-owned live shader binding and verifies
the disk uniform equals the selected Flat 180 atmospheric source center. These
establish scene configuration, not geographic, ephemeris, observational, or
full visual-match validation.

- Introduce `flat-local-finite-sun-v1` as a distinct source/geometry family;
  do not route it through the spherical distant-disk controller or cache
  layout.
- Materialize the source-owned `LocalSunDefinition` from simulator settings:
  15-channel uniform surface radiance, physical radius, and uniform-disk
  profile. The retained Flat32 defaults are a 3,000-mile center height and a
  16-mile radius. The evaluated orbit center is a separate live placement
  state.
- Replace or adapt the current Flat32 reference-distance/inverse-square local
  light adapter so that atmospheric illumination and visible-disk rendering
  share that one source radiance. Derive receiver illumination by integrating
  radiance over the visible disk solid angle; do not introduce a second
  radiometric scale.
- Extend `FlatEarthGeometry` with finite-source placement, source-relative
  cache coordinates, receiver stencil, exact apparent angular support, and
  ray–body intersection. Horizontal orbit translation refreshes only live
  geometry/query state while its source-relative domain remains valid; height,
  radius, surface radiance, atmosphere, or domain-policy changes publish a new
  field generation.
- Keep static source radiance in the selected flat source-relative cache and
  require Flat geometry to bind the evaluated center/radius once per frame.
  Evaluate both placement-dependent atmospheric transport and finite-disk
  support from those same values at the live raster; a cache default must
  never supply an evaluated center. Consume the result with matched live scene
  visibility and finite-disk coverage before the one existing pre-Color
  composition boundary. A future transported field is permitted only when its
  static domain remains valid across the live placement contract.
- Qualify, with fresh immutable focused runners, source-radiance/solid-angle
  illumination parity, exact apparent-radius and ray–body support, disk
  conservation across viewport/FOV/camera changes, natural distance falloff,
  static-invalidation replacement/failure preservation. The normal
  `ShaderBuilder`/shader-handle installation and live horizontal center-binding
  refresh are accepted by `000087`; geometry-ground clear/partial/scene-blocked
  finite-disk visibility is accepted by `000092`.

**Observable conclusion:** one or more accepted immutable records establish
that the simulator-configured finite local Sun has one radiometric owner; its
visible disk and atmospheric/direct illumination agree at every declared
receiver; compatible horizontal orbit motion does not rebuild the physical
field; and unsupported dome, terrain, mutual-occlusion, and Moon behavior
remains rejected rather than silently approximated.

### 12.7 Implement GPU live raster consumption

- Add the geometry query and cache sampling shader contributions in distinct
  namespaces and in the order:

    ```text
    geometry/ray reconstruction
      -> base Algorithm32 atmosphere
      -> celestial cache query
      -> celestial live raster integration
      -> spectral pre-display composition
      -> Color
    ```

- Add separate zero-initialized `celestialRadiance` and
  `preDisplayRadiance` state values plus `sampleCelestialCache`,
  `evaluateCelestialRadiance`, and `composeSpectralRadiance` assembly slots.
- Reconstruct current pixel corners/solid angle, integrate the Sun disk,
  project point members, and account for off-frame point response.
- Implement the selected exact-source and matched-extended live visibility
  mechanism without caching scene depth or camera state.
- Refresh only the small geometry query packet after first-family
  placement/geography changes.

**Observable conclusion:** one reproducible immutable browser live-pipeline
proof run preserves per-channel member, aggregate point-set, and Sun-disk
conservation over camera/FOV/resize/source-placement changes while reporting
the same physical-field fingerprint. Clear and live-scene-blocked star cases
plus full, partial, empty, and horizon-crossing Sun pixels match CPU behavior.
A layer roster, static source definition, atmosphere, geometry
family/domain/model-frame/transform-stencil version, or stable-build-visibility
change publishes a new generation; compatible geography/body-orientation,
receiver, and evaluated-placement changes do not. Injected
duplicate-transmittance, duplicate-coverage, response-pixel visibility, and
wrong-direction routes are detected.

### 12.8 Qualify lifecycle, resources, and performance

- Exercise layer-roster, member-roster, radiometry, atmosphere,
  geometry-domain, spectral, numerical, layout, backend, placement-only,
  camera-only, scene-only, and display-only transitions against the
  invalidation matrix.
- Exercise failure, cancellation, supersession, retry, last-valid
  restoration, context loss/restoration, repeated replacement, and repeated
  disposal.
- Record CPU build time and peak memory; retained, packed, and resident bytes;
  GPU render-build time; query-packet refresh cost; shader fetch count;
  point-member traversal/acceleration cost; and representative frame cost on
  the declared hardware class.
- Confirm that a live out-of-domain receiver contributes zero and never
  clamps, extrapolates, samples stale data, or rebuilds inside the frame.

**Observable conclusion:** one reproducible immutable qualification run and
report either accepts `spherical-sun-stars-radial-v1` within every predeclared
numerical, layer-roster, live-visibility, resource, lifecycle, and performance
budget or rejects it with the failed budget and no fallback implementation.
The raw report and its generated evidence remain under
`tmp/extraterrestrial/runs/`; the tracked current-state record preserves its
command/input identities, environment identity, hashes, bounds, conclusion,
and claim limits.

### 12.9 Close first-family evidence and claim boundaries

- Complete or promote XA1 and XA2 as standalone evidence without making them
  runtime dependencies.
- Record in the tracked current-state evidence owner the exact fixture
  identities, commands, environment/capability identity, result hashes,
  parity bounds, Sun-disk and aggregate/per-member star conservation,
  lifecycle outcomes, and supported/non-supported claims. Raw generated
  evidence remains under `tmp/extraterrestrial/` and is not committed.
- Run the required proof-runner, type, browser, containment, and
  document-consistency gates against the isolated candidate, including the
  sealed-baseline, candidate-delta, dependency-closure, immutable-run, and
  protected-production guards. Do not add an experimental unit-test gate.
- Label the point and disk inputs as mechanics fixtures unless XA3 separately
  accepts their calibrated payloads.

**Observable conclusion:** one accepted tracked first-family record identifies
every required immutable proof-run ID and terminal-manifest hash, the layer
roster, descriptor, generation/resource report, CPU/GPU/browser evidence,
exact candidate delta, raw-artifact hashes, reproduction commands, and claim
boundary without requiring ignored artifacts as implementation or promotion
inputs. If any required gate is red, the family remains
implemented-validation-pending rather than accepted and no production
promotion begins.

### 12.10 Promote the accepted semantic delta to production

- Freeze the accepted candidate and its exact delta from the sealed baseline.
- Compare the sealed baseline with the then-current `src/algorithm32` tree and
  classify every intervening production change before promotion. Never
  overwrite, reset, or silently synchronize live production.
- Port only the reviewed accepted semantic delta into the eventual production
  module map. Do not copy experimental runners, fixtures, diagnostics,
  candidate-only adapters, or stale unchanged files into production.
- Design or adapt the durable production unit and regression coverage for the
  reviewed semantic delta here. This is the first stage that authors such
  coverage; it is not copied back into the experimental lane.
- Run fresh production unit/regression-test, type, browser, build, lifecycle,
  resource, containment, and document-consistency gates from the promoted
  tree.
- Verify that production imports no experiment path and that the experiment
  remains evidence rather than a runtime or build dependency.

**Observable conclusion:** one promotion record maps sealed baseline files to
candidate changes and then-current production changes; accounts for every
promoted file and rejected experimental file; shows no incidental production
mutation; proves production has no experiment dependency; and records all
fresh production gates green. Until this conclusion is met, Stage 12 remains
candidate-qualified rather than production-implemented.

### 12.11 Select the next cache family or stop

- Compare the accepted first family with the requirements for:

    - the oriented, textured, spectrally Sun-lit finite surface in the
      [resolved-Moon follow-up](moon-follow-up.md);
    - distant or finite sources over flat geometry;
    - profiled disks;
    - celestial mutual ordering and occultation; and
    - catalog-scale point-source storage/acceleration.

- Choose exactly one next family only after its axes, placement dependency,
  visibility policy, source capacity, and qualification budgets are designed.
- Complete the applicable XA3 branches before calibrated Sun or Sirius release
  claims; lunar calibration and objective geometry evidence remain owned by
  the resolved-Moon follow-up. Complete payload manifest/license review before
  redistributing any selected source data.
- Do not generalize the first-family implementation to an unsupported pairing
  merely because its logical source kind matches.

**Observable conclusion:** a capability decision names one next family and
its prerequisite design document, or explicitly records that Stage 12 stops
with the accepted Sun-and-stars spherical/radial family. No Moon, flat,
calibrated, mutual-ordering, or catalog-scale behavior is implied in the
absence of that record.

## Exit Boundary

Stage 12 establishes direct visible boundary-source transport only for the
accepted Sun-and-stars capability family. It establishes no Moon contribution,
finite lunar geometry, lunar surface lighting, or Moon-over-star occlusion.
It also does not establish celestial illumination of the terrestrial
atmosphere, ground, or scene; planets; diffuse sky fields; exposure/glare; or
human/camera visibility. Those require new physical owners, cache paths,
evidence, and implementation plans.
