# Local-Sun Cache Production Port

## Status And Intended Result

Selected on 2026-10-11: return to `production-algorithm32` and prepare the next
work to port the accepted local-Sun cache experiment. This is a production-owned
adaptation plan. [Promotion status](local-sun-cache-promotion-status.md) owns
phase disposition and the next execution unit. This setup prepares the work;
production implementation, fixtures, defaults and deployed selections have not
changed.

The intended result is a production flat/local configuration that constructs the
accepted compact source-centered cache, reuses it across admitted horizontal
source/observer changes, and publishes coherent exact-state sky, finite Sun and
receiver lighting. Unsupported configurations require an explicit compatible
replacement or a reported unsupported result. Preserve the last complete frame
on failed or superseded replacement; never hide missing support by clamping.

The ended experiment's [closeout](../../poc-experiments/engineering-studies/local-sun-cache-reuse/p7-closeout.md),
[contract](../../poc-experiments/engineering-studies/local-sun-cache-reuse/p3-contract.md),
[layout qualification](../../poc-experiments/engineering-studies/local-sun-cache-reuse/p3-layout-qualification.md),
[movement qualification](../../poc-experiments/engineering-studies/local-sun-cache-reuse/p3-movement.md)
and [application qualification](../../poc-experiments/engineering-studies/local-sun-cache-reuse/p5-qualification.md)
are retained authority for the selected behavior and its limitations. This port
does not reopen the experiment or grant empirical flat/local accuracy claims.

## Selected Scope

Port the accepted numerical behavior through production owners:

- Euclidean-radius compact positions, stable radius-excess calculations, positive
  cross-row stencils, complete-support admission and omission of proven empty bands.
- Geometric-density normalization, including spectral factors and the per-node
  source-axis directional limit; stored physical scattering density stays unmodified.
- Source-centered bounds for the separate 2,048 source-amplitude bands, canonical
  construction coordinates and compatible horizontal reuse.
- The selected incoming quadrature, analytic exponential columns, positive
  optical-depth interval weights and construction/view numerical policies.
- CPU reference, GPU construction and runtime sampling, followed by staged
  cache/placement/shader/receiver publication and ordinary Flat32 integration.
- Finite-Sun and stellar consumers needed to preserve the experiment's accepted
  normal-scene behavior, with each required correction independently identified
  and qualified in P0/P4 rather than hidden inside a cache rewrite.

The 90-second film is an appearance and choreography reference. Its observatory,
camera score, high Sun screen placement, 4K recording, one-second diffuse/adaptation
interpolation and film-specific shared shadow map are outside this port. Optional
overhead-calibrated Sun radius and central-view FOV remain separate choices.
Retain the ordinary fixed-radius source, current p2 presentation and shared
human-vision choices unless the production controls reveal an explicitly scoped
consumer gap. No physical brightness or source-size compensation is selected.

Ozone restoration, reflective atmospheric ground, gray-horizon research, spectral
packet packing, cubic spatial interpolation, paging, multiple source heights in
one cache and additional construction optimization are separate work. Retain the
accepted invariant Mie phase-matrix calculation. No new frame-rate or
absolute physical error claim follows from the port.

## Production Ownership And Contract Changes

Paths below are repository-relative. Final declarations and method names belong
to P0's contract unit; these are responsibilities and existing integration owners.

| Concern | Production owner and required adaptation |
| --- | --- |
| Physical compact domain and admission | `src/algorithm32/implementation/flat-earth/FlatScatteringCacheGeometry.js`, `FlatEarthGeometry.js` and local position-domain declarations. Replace the assumption that every domain is a rectangular `zNodes/rhoNodes` product with an explicit executable compact topology, row offsets/counts, physical band identity and complete-support result. Keep coordinate transformations in geometry. |
| Domain selection and packing | `implementation/local-sun/cache/LocalSunConstructionDomainSelection.js`, `LocalSunFieldPacking` and their declarations. Preserve arbitrary physical `positionCount` packing; do not fabricate rectangular axis counts for a ragged layout. Source-amplitude shell bands and scattering-position bands remain different contracts. |
| Primary source and shell bounds | `LocalSunShellFactCache.js`, `LocalSunCacheProvider.js`, `LocalSunConstructionLightSource.js`, `LocalSunCacheSource.js`. Supply accepted source-centered bounds explicitly rather than deriving them from observer/world offset. Retain direct L1 and pure/cumulative recurrence meanings. |
| Spatial/angular/spectral reconstruction | `LocalSunCpuCache.js`, `LocalSunCache.js`, geometry shader/cache contributors and `atmospheric-transport/cache/IntegratedCacheTransport.js`. Resolve direction support per spatial tap at axis nodes and apply the selected spectral normalization from actual medium/source/profile inputs. |
| Construction and view transport | Existing direction domains, canonical atmosphere contributors, `CacheOperations`, `CachePassAssembler`, `IntegratedCacheTransport`, `Algorithm32Transport`, `spectral/SpectralCalculator.js` and `scattering-density-transport.js`. Represent column/quadrature choices as typed numerical policy with matched CPU/GPU behavior. Do not alter spherical transport by implication. |
| Cache identity and resource ownership | `LocalSunCacheController.js`, concrete local cache/bindings and shared GPU runtime owners. Separate canonical physical/numerical construction identity from live frame identity. Declare all auxiliary textures and phase payloads in ordinary resource accounting, cancellation and disposal. |
| Live geometry/source state | `FlatEarthGeometry`, `FlatGeometryShaderContributor`, `LocalSunLightSource`, facade/runtime declarations and prepared-frame bindings. Current objects enforce one-time placement and embed live geometry in shader constants. Introduce an explicit staged update boundary rather than mutating private configuration. `FlatSynchronizer` selects observation instants; `SolarPosition.resolveSubsolarLocation()` and geometry's source-position resolver retain actual placement ownership. |
| Coherent frame publication | `Algorithm32Runtime` and source-owned controller/frame binding. Adapt the existing distant `updateSharedScene` staging pattern to local capabilities where appropriate. A cache build alone is not a committed frame: cache, exact placement, shader inputs, receiver spectra and visible sources must all be ready before publication. Retire old resources only after borrowers release them. |
| Application and receiver lighting | `src/flat32/ModeController.js`, `Flat32Application.js`, `LocalSunSceneLighting` and local shader/renderer bindings. Current fast reuse is spherical-only and local lights use fixed color/intensity values. Add the qualified local update path and measured spectral receiver lighting using existing application ownership. Preserve ordinary object-shadow behavior unless a required correction is separately qualified. |
| Finite-Sun placement and coverage | `FlatEarthGeometry.js`, `rendering-runtime/three/SunDiskTileGenerationPass.js`, `celestial-source-support/CelestialScreenPaletteConsumerShaderContribution.js` and celestial declarations. Resolve scene axes once; preserve physical angular size/parallax. Carry the accepted circle/pixel disjoint guard through producer and filtered consumer, including projected radius in active and zero bindings. |
| Flat stars and shared vision filters | Geometry-owned flat-star placement, `CelestialSourceRoster`, `StellarPointSetSource`, shader assembly/installation, stellar palette generation and `FlatLocalMode`/production selections. Replace spherical-only capability gates with explicit supported flat capabilities; identify epoch/rotation/projection/parallax and filter/adaptation compatibility. Reuse the existing authenticated catalog and filter equations, not a fake spherical roster or a new brightness gain. |
| Profiles, ingress and exports | Algorithm32 execution-profile declarations/builders, source and geometry options, public interfaces, exports and `Flat32ProductionSelections.js`. Expose one complete named candidate policy with documented defaults and overrides, units, spectral basis, precision, applicability, revisions and all numerical differences. Descriptive manifests report executable choices; they do not execute or reconstruct them. |

Runtime code must not import `experiments/`, sealed runs or generated bundles.
Retire the experiment's private-member replacement, backend interception, shader
string substitution and patched `dispose()` mechanisms. Adapt algorithms, not
that module structure. Generic construction remains source-independent; local
geometry/source contributors own local decisions.

The current [architecture boundary](../architecture-contracts/architecture-boundaries.md)
documents full replacement on time/location changes; the current
[reuse contract](extension-contract.md) includes resolved placement in identity.
P0 must explicitly amend those narrow contracts for the qualified local successor
before implementation. This plan does not silently reinterpret existing behavior.

The ordinary celestial consumer already applies accumulated view transmission
once to boundary radiance. Preserve that behavior and geometry-owned ray termination
while installing new transport; do not reintroduce the experiment's superseded
full-slab stellar attenuation. P4's selected shared filters are
`human-mesopic-luminance-v1` (maximum rod contribution 0.5), then
`human-low-light-chroma-v1` (maximum chroma retention 0.65), driven by the matching
measured receiver state. These are a distinct consumer milestone, not part of
proving compact atmospheric storage.

## Evidence, Profile And Resource Decisions

The initial fidelity target is the accepted profile: source height 4,828,032 m,
source-centered cylinder radius 33,378,000 m, altitude 0-100,000 m, v9 compact
layout with 1,049 positions, six omitted and 55 admitted geometric bands,
Native15/W27/N4, scalar R32F, incoming partitioned polar40 / midpoint azimuth48
(offset 0.5), column48-tail64
construction and column15 runtime. Black atmospheric ground and disabled ozone
are part of that comparison configuration, not permission to change unrelated
production profiles.

P0 must resolve production-profile differences explicitly, including supported
orders N1/N2/N4, configurable source heights, spectral inputs, medium families,
source radius/power and coverage. A change of height, medium, ground, emission,
spectral/numerical policy, coverage or implementation identity requires compatible
reconstruction. Horizontal motion is reusable only under the qualified physical
symmetries and complete ray/stencil admission. Unsupported custom profiles cannot
silently borrow a cache qualified for another configuration.

Use immutable experimental artifacts and their complete derivation chains as
the selected independent comparison boundary. Pin source/artifact hashes, schema,
all profile inputs, queries, orders, extraction operations and fixed tolerances
before observing candidate production output. A newly run experimental producer
that imports changed live production is not an independent oracle. Derive small
production-owned fixtures or durable comparison reports without changing parent
runs. Record any missing evidence as a P0 gate instead of manufacturing gold.

The production binary64 CPU result becomes a GPU oracle only after passing that
independent comparison for each affected capability. Then compare GPU construction,
stored fields and complete runtime rays against accepted evidence/CPU under
predeclared precision bounds. CPU/GPU agreement, analytic invariants and images
supplement that evidence; they do not replace it. Preserve original experimental
tolerances where their meaning applies and justify any distinct production bound
before candidate scoring. No absolute physical error percentage is introduced.

Resource admission requires a new production decision in P0. The accepted field
alone is 275,299,560 bytes; incoming radiance is 120,844,800 bytes and the phase
matrix is 33,592,320 bytes. The experiment measured roughly 1.16-1.18 GB logical
application peaks; this exceeds historical small-grid expectations. Account for
old/new cache overlap, lazy shader/shadow resources, temporary fields, auxiliary
textures and receiver staging. Distinguish logical allocation from sampled process
memory and driver/GPU observations. The ordinary experiment's 1.6 GB bound is a
comparison, not an automatically adopted production budget; the film's expired
2.4 GB/AFK exception is not available.

Use serialized qualification jobs with the current ordinary host controls:
8 GiB free-memory reserve, 8 GiB owned-process ceiling, ten-minute bounded jobs,
progress at least every 30 seconds and owned-resource cleanup. Split work at
meaningful evidence boundaries if needed; do not silently extend a resource or
timing limit. Offline film timing establishes no interactive performance target.

## Work Sequence

### P0 — Freeze Production Contracts And Comparison Controls

First execution unit; no numerical port or application default change yet.

- Pin the production baseline and accepted experiment artifacts; preserve the
  already-reviewed P7 closeout edits as separate existing work.
- Inventory every accepted algorithm and required consumer correction against
  its production owner and independent output evidence. Resolve missing N1/N2,
  profile-family or celestial coverage before claiming those capabilities qualified.
- Amend the focused geometry/domain, cache identity, complete profile and
  prepared-frame/publication contracts. Define support rejection, replacement,
  cancellation, stale results, leases and context-loss behavior.
- Specify application pending/failure behavior using current busy/error controls:
  keep the last complete frame, distinguish requested from displayed state, and
  make retry/cancellation meaningful. Do not display a new time label as if an
  old frame were already that state.
- Freeze matching queries, boundary/axis/tangent cases, compact-vs-unculled
  comparisons, parity limits, production resource budgets and existing defaults
  as controls before measuring candidate outputs.
- Produce production-owned fixtures/comparison metadata and focused verification
  entrypoints with complete provenance. Review the contract/evidence unit.

Exit: explicit implementable contracts, an independent comparison for each first
capability, frozen acceptance/resource policies and a captured implementation baseline.

### P1 — Port Compact Domain, Source Bounds And CPU Reference

- Implement executable compact topology, stable radius excess, refinement,
  omission, addressing and CPU support/stencils in their production owners.
- Thread source-centered source-amplitude bounds through supported constructors;
  keep physical bands separate from compact addresses and amplitude bands.
- Implement selected incoming domains, per-node axis reconstruction, spectral
  normalization and positive transport policies with complete profile inputs.
- Compare independent selected fields/rays and analytic edge cases for affected
  orders, including zeros/nonzeros, tangencies, ground/top/outer boundary and
  unsupported queries. Verify conservation/accounting and direct-L1 isolation.

The smallest coding slice is compact topology/admission plus explicit source-shell
bounds and their CPU fixtures. That slice is useful to checkpoint but does not
complete P1 or qualify the GPU/application. Existing production selection stays
available as the control.

### P2 — Port GPU Construction And Runtime Lookup

- Implement legitimate shader/domain contributors and declared auxiliary-resource
  bindings; remove any need for assembled-shader string patches.
- Exercise actual ragged addresses, every spatial/directional support case,
  omission, pure/cumulative orders and matched CPU/GPU complete rays.
- Measure construction and retained payload, phase/auxiliary resources and failure
  cleanup. Require exact occupied-field identity for matched omission controls
  where the frozen comparison requires it.

Exit: independently qualified CPU and production GPU paths through the shared
runtime consumer, within the P0 resource and precision envelope.

### P3 — Add Reuse And Atomic Complete-Frame Publication

- Canonicalize construction inputs; retain exact live observation, source position,
  receiver state and support decision in a separately identified candidate frame.
- Stage cache leases, geometry/source bindings, shader readiness, receiver spectra
  and celestial inputs; commit together at a frame boundary.
- Qualify admitted rotations/translations and actual day trajectories against
  fresh construction. Height/medium/source/coverage changes must rebuild.
- Exercise compile/receiver/build failure, cancellation, supersession, retry,
  context loss, disposal with borrowers, and unsupported coverage. Keep old usable
  state until successful replacement, except when its WebGL context itself is lost.

Exit: one coherent accepted frame at every publication and bounded replacement
overlap, with no stale-result publication or leaked resources.

### P4 — Integrate Ordinary Flat32 And Required Celestial Consumers

- Add the local admitted-update path to the existing application controller;
  use exact-state measured direct/diffuse receiver spectra and adaptation.
- Complete the P0-mapped finite-disc/transmission/stellar corrections needed for
  normal-scene parity, each in its proper production feature and matched evidence.
- Keep camera/display-only changes from rebuilding the physical field when admitted;
  qualify the existing scene's materials and shadows through the coherent frame.
- Retain the current p2 and shared human-vision presentation as identified inputs;
  film smoothing, calibrated-radius mode and cinematic framing are separate work.

Exit: ordinary flat/local interaction, appearance and failure behavior are
qualified against exact-state controls, without experimental runtime dependencies.

### P5 — Qualify And Prepare Adoption

- Run the focused production CPU/GPU, lifecycle, application and supported-hardware
  matrix, including the accepted sites/trajectory and adverse support changes.
- Verify distant/spherical regressions for shared paths actually changed. Broaden
  to the existing Bruneton/B-family gates when shared transport/profile behavior
  can affect them; local-Sun images are not Bruneton truth data.
- Record measured startup/update/rebuild costs and steady/overlap resources without
  inferring a frame-rate guarantee. Validate all mapped source reviews and audits.
- Prepare a concrete candidate selection, complete profiles, retained compatible
  rollback and acceptance record. Change default/deployed selections only at the
  separately recorded adoption boundary after the evidence is reviewable.

Exit: qualified production capability and explicit adoption/rollback disposition.
Deployment, publication and another cinematic recording are not implied by setup.

## Source, Output And Review Boundaries

Maintained implementation belongs under existing owners in `src/algorithm32/`
and required adapters in `src/flat32/`. Tests and small fixtures belong beside
their production feature using existing runners. New offline qualification tools
may live under `scripts/algorithm32/local-sun-cache/`; application evidence belongs
under `scripts/flat32/` where appropriate. Derive outputs only under the ignored
plan-owned root `tmp/production-local-sun-cache-promotion/`, in new immutable run
directories with source/input/tool/profile identities and terminal provenance.
No output is allocated by this setup.

Use JavaScript and ambient declarations; no native helpers or new experiment
test tree. Production tests use existing Jasmine/Karma/Node lanes. Relevant
commands include `npm run typecheck:algorithm32`, `npm run test:algorithm32`,
`npm run test:algorithm32:three`, `npm run typecheck:flat32` and
`npm run test:ui:flat32`, scoped and expanded according to the actual unit.
Proof runners establish immutable numerical evidence separately from unit tests.

Retain the historical z19/rho15 and paired-Fibonacci34 GPU/receiver fixtures as
their original controls; they do not qualify the current Fibonacci68 default or
the new compact candidate. Add distinct compact-profile evidence rather than
globally replacing expected 285-position values. Focused browser lanes use
`ALGORITHM32_THREE_GREP` and `FLAT32_GREP`. The existing
`test:acceptance:lighting` command omits the engine Three/WebGL lane and is not
sufficient by itself for this port.

Standards follow destination folders. Engine source maps to `code`; Flat32 to
`http-application`; ordinary scripts to `code`; topic documents to `base`.
Do not inherit the contained experiment's narrower standards. Capture each
implementation baseline before edits and batch primary review plus independent
audit at coherent milestones, retaining required gates until validated. This
planning unit has its own review and does not authorize a compliance claim for
future implementation.
