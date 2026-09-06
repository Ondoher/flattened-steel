# Algorithm32 Production

This directory is the sole maintained source for the production Algorithm32
implementation. Production models, contracts, CPU/reference execution,
renderer integration, and GPU/runtime work belong here. Archived and
experimental implementations may inform research, but production code must not
depend on them at runtime.

The authoritative implementation sequence and completion criteria live in
[`agents/topics/algorithm32/production/production-implementation-plan.md`](../../agents/topics/algorithm32/production/production-implementation-plan.md).

## Current State

Production owns physical and spectral normalization, source-specific primary
`J1` and direct `L1`, pure later-order recurrence through requested N2 and
default N4, cumulative cache fields, geometry-owned final-view reconstruction
and sampling, source-owned cache lifecycle, deterministic GPU construction,
opaque runtime bindings, and the Three and React integration boundaries. The
binary64 CPU path remains the reference and conformance surface; GPU
construction is the production cache path.

Flat/local and spherical/distant N4 stored-field transport are integrated in
GPU construction passes. Each geometry supplies the transport ray and cache
stencils, canonical atmosphere supplies extinction, and
`IntegratedCacheTransport` reads the pure input field through the source-owned
layout. Production no longer constructs or uploads a geometry-expanded
transport table for either path. The binary64 CPU transport builders remain
reference and diagnostic authorities.

The [production implementation plan](../../agents/topics/algorithm32/production/production-implementation-plan.md)
owns current delivery status, completion criteria, and verification evidence.
The completed [reconciliation record]
(../../agents/topics/algorithm32/archive/reconciliation-2026-08-04/extraterrestrial/reconciliation.md)
owns the standards-reconciliation checkpoint. The completed
[Flat/local GPU transport offload plan]
(../../agents/topics/algorithm32/flat-local/gpu-transport-offload-plan.md)
owns that qualification boundary. Extraterrestrial production integration has
completed typed optional Step 3, all of Step 4, and all distant-Sun cache Step
5 groups. The exact cache contracts, sealed binary64 logical field,
scalar `R32F` GPU construction, 75-scalar real WebGL parity gate, dedicated
resource, transactional controller lifecycle, geometry stencil contribution,
configured-model construction, exact controller reuse, and atomic binding
installation and replacement/failure lifecycle proofs are complete. Step 5 is
closed by 522 Node specs, 10 real Three/WebGL specs, and exact complete GPU B1
parity at aggregate RMSE `11.820392` mW. Step 6 live distant-Sun composition
has completed groups 6.1 through 6.9. The enabled production shader now uses
geometry-owned horizon support, a fixed four-sample uniform-disk raster,
matched scene-hit suppression, the completed distant-Sun field, separate
`celestialRadiance`, and one `preDisplayRadiance` addition before Color. Its
real-WebGL CPU-oracle matrix passes with maximum coverage residual
`0.0000016689300537109375`; the complete current gates are 524 Node specs and
11 Three/WebGL specs. Step 6.10 is closed by exact complete B1 parity at
aggregate RMSE `11.820392` mW. The first Flat/local finite-Sun production
normal path now adds a dedicated scalar `R32F` source-radiance field,
geometry-owned finite placement and atmosphere support, four-sample disk
coverage, matched scene visibility, and the same one-addition composition.
Focused real-browser N1 proofs reach `ready` and visibly render the disk;
remaining Step 9 lifecycle and visibility-matrix qualification is tracked by
the extraterrestrial integration plan. The completed
feature-reorganization
record is [archived under the Algorithm32 topic](../../agents/topics/algorithm32/archive/feature-implementation-reorganization-2026-08-06/implementation-feature-reorganization-plan.md). A
software-renderer result establishes conformance only, not supported-hardware
timing or resource budgets.

The Three scene-color boundary uses a half-float renderer-linear sRGB target.
Color retains the established production scene-display proxy and writes the
Bruneton Figure-1 exponential result directly, matching the reference dome
renderer without a second sRGB transfer. Very bright channels can still
converge on the exponential mapper's exact-white plateau; resolving that global
highlight/gamut behavior remains appearance work. The rejected sky-derived
automatic-exposure candidate is disconnected: Color publishes no exposure
texture binding, the Three installer creates no meter runtime, and production
uses the fixed Figure-1 coefficient. Its contained implementation remains
available for future star-adaptation research. Physical sky-irradiance scene
lighting and any replacement exposure model remain separate deferred
capabilities.

The current project supports only the production architecture's selected
[spherical/distant and flat/local pairings](../../agents/topics/algorithm32/production/architecture-boundaries.md#supported-geometry-and-source-pairings).
The geometry and source contracts remain independent; unused flat/distant and
spherical/local cross-pairings are not completion or parity requirements.

## Source Layout

`implementation/` is the public concrete implementation surface. Every
immediate child names the feature it implements and owns that feature's
complete private closure. `implementation/index.js` is the aggregate public
runtime entry point and exports exactly `Algorithm32`,
`BrunetonColorDisplayModel`, `CanonicalAtmosphere`,
`DistantSunLightSource`, `FlatEarthGeometry`, `LocalSunLightSource`,
`SphericalEarthGeometry`, `StellarPointSetSource`, `ThreeCacheBackend`,
`UniformLambertianGroundBoundary`, `Algorithm32AtmosphereComposer`,
`Algorithm32Bindings`, `Algorithm32R3FAtmosphereComposer`,
`Algorithm32R3FValues`, and `Algorithm32ThreeResources`.

`interfaces/` is declaration-only. It owns the global behavioral interfaces
and public data contracts for Algorithm32, atmosphere, cache backend, color,
geometry, ground boundary, light source, physical quantities, and spectral
quantities. Concrete classes declare each intentional behavioral contract with
class-level `@implements` tags.

Cross-feature non-public mechanisms use responsibility-specific root owners:
`atmospheric-transport`, `celestial-contribution-cache`,
`celestial-source-support`, `geometry-support`, `gpu-cache-runtime`,
`ground-transport`, `light-source-support`, `math`, `physical-quantities`,
`reference-evidence`, `reference-execution`, `rendering-runtime`,
`sampling-domains`, `shader-assembly`, `spectral-values`, `time`, `validation`,
and `value-identity`. `profiles/native-15` remains the public readonly profile
surface. No technical-layer compatibility tree or old-path alias remains.

Atmosphere behavior is an externally implementable capability expressed by
the global `AtmosphereModel` interface. `CanonicalAtmosphere` is the standard
public implementation at `implementation/canonical-atmosphere`; callers remain
free to provide another compatible implementation.

The current contract treats `SpectralBasis` and `SpectralPacket` as public
readonly value interfaces. The facade has mutually exclusive configuration
forms: the legacy application form assembles the complete Native-15 execution
profile, while a trusted owner may supply one already-complete
`Algorithm32ExecutionProfile`. The latter carries its basis, aligned physical
packets and models, numerical selections, source placement, and executable
domains as one validated authority; it is not a partial spectral override.
Concrete spectral value builders remain non-public shared support under
`spectral-values`.

The Bruneton benchmark owns its pinned direct 40-coordinate basis, spectral
inputs, atmosphere, ground, conditions, and identity. Algorithm32 accepts
those values through a typed, basis-aware execution configuration without
embedding or recognizing Bruneton-specific constants. The external Stage 13
generator now executes that profile through either the production binary64 CPU
reference or the production GPU cache and final-view transport shaders, and
emits backend-identified hashed B1/B3 boundaries for the independent scorers.
The GPU lane replaces only terminal display conversion with native spectral
readout. Generated and scored experiment output is routed into separate
`cpu/` and `gpu/` subdirectories beneath each experiment result folder,
including reports, candidate data, provenance, cubes, and figures; an explicit
alternate root retains that hierarchy. Canonical J2-through-J5 generation remains
pending; the native-15 application default is unchanged.

The standard `npm run gate:algorithm32:bruneton-sky-color` command regenerates
the complete production GPU B1 boundary and then requires the 1,377 matched
atmosphere-only rays to satisfy the tracked Bruneton color/luminance contract.
This color gate is conjunctive with, and never replaces, measured B1 RMSE
non-regression. The Sun disk is outside this gate.

Public interfaces type Algorithm32's built-in capability boundaries. The
current API does not define a supported third-party implementation
SDK or expose cache, sampling-domain, shader, or other internal machinery for
caller implementations.

The selected geometry owns every coordinate transform, with Algorithm32 as
the mediator. Callers and source-positioning helpers provide physical or
semantic state to the facade; applications and light sources do not project
that state into geometry model coordinates themselves. Flat32 may select a
semantic daily event through `FlatEarthGeometry.resolveObservationInstant()`,
but the geometry's private `FlatSynchronizer` performs that calculation and
does not escape the feature. External code supplies the resulting time and
location through facade observation configuration. A change creates a
replacement geometry, facade, scene, and cache set. In-place time/location animation is
deferred mandatory MVP work; production Stage 14 must provide cache transforms
that avoid rebuilding for every clock tick.

The current tree keeps cache sampling-domain classes under the non-public
`sampling-domains` owner. Native-15 remains public readonly configuration under
`profiles/native-15`. Neither is exported as a concrete implementation feature.

The selected spherical/distant production convention is Z-up in model space
with an exact-0 m first native altitude node. Its GPU cache receives a
build-derived contact mask so discrete exact-ground rays use the same
binary64 ground classification as the CPU reference. Flat32 maps its ordinary
Y-up observer-local Three scene through the geometry-owned frame; callers do
not rotate camera or Sun directions themselves.

## Contract Rules

Durable configuration, request, result, sample, serialized, and class
properties use neutral physical names. Their values carry units as data. For
example, use `sceneScale`, `sceneDepthMax`, and `resolveSceneDepthMax`; do not
encode a unit in those property or method names.

Once a unit-bearing value has been accepted and normalized to a known unit, a
local scalar can and should name that unit when it clarifies arithmetic, such as
`altitudeMeters`. This exception applies only to local implementation values,
including shader-facing normalized scalars, and not to durable object shapes.

Contracts are replaced directly when they change. Do not retain aliases,
fallback field names, alternate packet shapes, re-export adapters, or other
backwards-compatibility bridges.

Cache shader resources use direct `ShaderTextureDeclaration` entries and
opaque `CacheRuntimeBinding` handles. A raw texture is not an alternate public
input.

The owner of a boundary validates a value when it enters the system. Internal
code then relies on the accepted contract, JSDoc, and static type checking
instead of repeatedly validating the same value. `Object.freeze` is not a
contract or immutability mechanism in Algorithm32; it adds unnecessary
complexity and must not be used for that purpose.

Complex contracts belong in the nearest ambient `.d.ts` file and receive
property-level documentation. JavaScript classes and non-trivial functions use
JSDoc with explicit parameter and return types. Ambient contracts are named
directly in declaration files and JSDoc; do not add `import(...).Type`,
`import type`, or local alias bridges for them. Runtime module imports and
external package types remain module-scoped where they are not ambient
contracts. A class implementation file is named for and exports that class;
reusable stateless helpers live in focused neighboring modules, and lower-level
helpers precede the composed class or operation that uses them.

Class-specific support operations use private instance methods, including pure
operations that do not read instance state. A class module exports only its
class; genuinely reusable operations move to cohesive utility modules, and
module constants live in the owning `consts.js`. Use setters only for direct
assignment with no processing; use a named method when a state change
validates, normalizes, derives, coordinates, or otherwise performs work.

Type checking owns class and module shape. Unit tests cover observable
behavior rather than parsing class exports, private members, or declarations.

## References and Experiments

Published external references and official experiment records are the only
citation authorities:

- [`/references/references.md`](../../references/references.md) owns the AMA
  reference list used by source and fixture citations.
- [`/references/experiments.md`](../../references/experiments.md) owns the
  referenceable official experiment list.

Production physics, formulas, algorithm choices, meaningful variations, and
fixture values require a citation to one of those authorities. Tests of API
shape, validation behavior, module boundaries, and other implementation
mechanics do not require physics citations.

## Verification

Run the production Jasmine lane with:

```text
npm run test:algorithm32
```

The current result is recorded in the
[baseline import status](../../agents/topics/algorithm32/production/baseline-import-status.md).
Specs live beside the source they exercise in `_tests/` directories.

Run focused Three/WebGL browser conformance with:

```text
npm run test:algorithm32:three
```

Browser-only Jasmine specs use the adjacent `*.browser.js` suffix and run
through Karma and headless Chrome without a Polylith or application build.
They cover real renderer and GPU contracts that Node cannot establish. A
software-renderer pass is conformance evidence only, not hardware performance
evidence. The [testing topic](../../agents/topics/testing/README.md) owns the
runner boundaries and conventions.

Run the JavaScript/JSDoc type-checking lane with:

```text
npm run typecheck:algorithm32
```

The baseline import status owns the current verification result; future
contract changes must preserve that lane without introducing compatibility
contracts.
