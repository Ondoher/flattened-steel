# Celestial Contribution Cache Design

Current stellar-screen representation is superseded by the
[Stellar Screen-Palette Cache Design](stellar-screen-palette-design.md). The
stellar member-by-transport field and point-set consumer described below are
retained historical evidence and do not govern the active stellar cache round.

The atmospheric scattering-cache replacement motivated by the spherical
twilight diagnosis is now owned by the
[Distant-Sun Solar-Zenith Spectral Cache Design](../algorithm32/cache/solar-zenith-cache-design.md).
This document retains the diagnostic evidence and celestial-boundary ownership;
it does not independently select the atmospheric field, page layout, or codec.

Status: active production-follow-up design. The closed isolated candidate's
Stage 12.0 contracts were accepted by
immutable run `000002-g0-boundary-contract-proof`; Stage 12.1 geometry
realization is accepted by immutable run `000008-g1-geometry-transform-proof`;
Stage 12.2 synthetic generation identity and controller realization is accepted
by immutable run `000009-g2-generation-lifecycle-proof`; Stage 12.3 CPU star
transport is accepted by immutable run `000017-g3-cpu-star-transport-proof`;
Stage 12.4 derived CPU Sun-disk transport data is accepted by immutable run
`000024-g4-cpu-sun-disk-transport-proof`; Stage 12.5 ray-probe evaluation is
accepted by `000025-g5-ray-probe-frame-evaluator-proof`; G6a source/geometry
assembly is accepted by `000027-g6a-primary-celestial-cache-proof`; and G6b
selects scalar `R32F` array packing in
`000028-g6b-r32f-representation-proof`; and G6c is accepted by
`000030-g6c-gpu-cache-render-proof`. G7 is accepted by
`000046-g7-live-gpu-consumption-proof` for the live distant-Sun path: the
published R32F cache is queried through geometry-provided stencils, four
reconstructed pixel sub-rays apply matched scene-hit visibility, and celestial
radiance composes once before Color. G8 is accepted by
`000047-g8-distant-sun-qualification` for the declared Chrome-headless
WebGL2/SwiftShader distant-Sun resource, lifecycle, and timing contract. GPU
stars remain deferred. Visual output is accepted by
`000048-g7-visual-capture-proof`, which retains clear, partial, blocked,
horizon, and out-of-domain PNG captures. The existing atmospheric Sun remains the
single radiometry, placement, and transport-physics owner. G6c constructs the
primary cache through cache-render shader passes, publishes it, and supplies
its geometry-owned shader lookup. Numerical resolution and GPU resource limits
remain qualification outputs, not implicit defaults.

Initial production lifecycle amendment: the
[production API and ownership contract](production-api-ownership-contract.md)
supersedes this document's live time/location and placement-refresh proposals.
Before mandatory MVP Stage 14, external time/location is fixed when
constructing or configuring the geometry; any change creates a replacement
geometry, facade, scene, and complete cache set. References below to live
celestial placement, query-packet refresh, or cache reuse across time changes
describe experiment evidence or the mandatory Stage 14 animation/cache-
transform design, not requirements of the initial integration tranche.

## Program-Close Completion Boundary

The accepted distant-Sun proof slice is not sufficient to close this topic.
The required visual images are retained by accepted run
`000048-g7-visual-capture-proof`. Before G9 can close evidence, the
implementation must move celestial resources into the normal ShaderBuilder/
shader-handle lifecycle. It must also implement GPU point-set stars (projection,
normalized response, exact pixel solid angle, off-frame response, matched
visibility, and conservation), live celestial transform/placement refresh, and
actual application context-loss restoration.

Run `000059-g7-atmosphere-preview` is supplemental display evidence only: it
uses a limited single-scattering atmosphere context and preview-only exposure
scaling to make the synthetic fixture's Sun disk legible. It neither replaces
the normal cumulative-cache transport nor satisfies the required runtime
integration.

Normal installation is now established by accepted run
`000064-g7-three-atmosphere-integration`: `Config.celestial` contains an
application-owned `CelestialRuntimeParticipant`; spherical geometry constructs
the primary source assembly and GPU controller; `ShaderBuilder` publishes and
binds the normal atmospheric cache and the separate celestial cache; and
`Algorithm32.setupShader()` installs both into one Three `EffectComposer`
pass. This first proof covers installation, binding, disposal, and display
composition. Immutable run
`000144-pre-g9-celestial-replacement-runtime-proof` additionally qualifies
normal shader-handle replacement: it stages a distinct primary field and
binding, publishes only the completed successor, preserves the installed
runtime after an injected allocation failure, disposes the retired generation,
and releases the final generation when the handle is disposed. Live placement
updates remain separate work.

Flat north-polar azimuthal-equidistant/dome mapping and finite extraterrestrial
objects, including the Moon, remain separate geometry/source capability
families. They must not be folded into the spherical distant-disk contract;
each needs its own adapter/object design and accepted evidence before program
closure.

The exploratory experiment is closed. Its retained results are design evidence,
not code to restore or a runtime dependency. The repository architecture fixes
the eventual accepted destination as production `src/algorithm32`. Initial
implementation and qualification occurred in a segregated direct copy of that
production surface; the live production tree, external stash, prior experiment,
and application adapters were not implementation dependencies.

## Production API Ownership Boundary

The closed candidate demonstrated an internal runtime path, but it is not a
production API to copy verbatim. The API-first promotion sequence is defined
by the [Extraterrestrial Production Integration API Plan]
(production-integration-api-plan.md), and the exact public/internal contract,
owner map, invalidation matrix, and candidate classification are now fixed by
the [Production API and Ownership Contract]
(production-api-ownership-contract.md). This section retains the architectural
constraints realized by that reviewed contract.

Static celestial source facts belong in an optional immutable
`Config.celestialSources` roster: stable source IDs, radiometry, profiles,
catalog provenance, and field-definition identity. `Config.celestial` is a
historical candidate implementation detail and is not a second production alias.
Production declaration files must describe the selected roster in `Config`,
`SharedModel`, snapshots, ShaderBuilder build results, and every internal
geometry/cache capability before a runtime port is accepted.

Evaluated placement, observation/body-orientation state, and receiver state
are live geometry inputs. A shader handle receives them through one validated
live-state update route, which prepares a geometry-owned query packet and
refreshes only per-frame celestial bindings. Compatible live updates neither
alter a field-generation fingerprint nor call `setConfig()` or build a cache.
Camera, viewport, and scene-hit inputs remain renderer-owned live state and
never enter this celestial API or a cache identity.

Geometry owns celestial/model transforms, support classification, domain
coordinates, stencils, and controller creation. Sources own static radiometry
and placement-state provenance; the atmosphere remains the direct-transport
owner. The celestial cache owns only generation-scoped payloads, packing,
runtime bindings, publication, and disposal. `ShaderBuilder` coordinates that
cache as a distinct participant beside the source-created scattering cache;
neither cache owns the supplied backend. Composition adds `celestialRadiance`
to `pathRadiance` once before Color, which remains the only
spectral-to-display owner.

`CelestialFrameEvaluator` and shader-handle sky-meter readback methods are
contained qualification helpers, not public production runtime APIs. The
spherical Sun plus static-epoch star family remains the first implementation
tranche. The reviewed production API now also requires a distinct
`flat-local-finite-sun-v1` roster, live-state variant, and additive
finite-local celestial capability on the existing `LocalSunLightSource`; its
implementation and qualification follow the spherical tranche before final
promotion. `LightSourceModel` and the existing local-Sun construction contract
remain unchanged. Live stellar rotation,
transformed-source twilight replacement, HDR calibration, and Moon behavior
remain separately designed and qualified follow-up work.

## Historical Isolated Implementation And Qualification Boundary

The closed Stage 12 candidate used two deliberately separate roots before any
production promotion. These paths are exact historical containment evidence:

```text
scripts/extraterrestrial/             tracked source and control surface
  package.json
  package-lock.json
  containment-policy.json
  baseline-manifest.json
  baseline/
    src/algorithm32/       exact immutable production copy
  candidate/
    src/algorithm32/       initially identical mutable implementation fork
  harness/
  fixtures/
  runners/

tmp/extraterrestrial/                 ignored generated-output surface
  runs/                    create-once qualification records and artifacts
  work/                    disposable generated intermediates
```

The package lock, containment policy, baseline manifest, authored fixtures,
and copied baseline/candidate source were tracked control inputs even when a
tool created them. Locally installed locked packages could occupy the ignored
`scripts/extraterrestrial/node_modules/`; dependencies were not experimental
output. Build products, browser bundles, profiles, caches, reports, captures,
diagnostics, renders, logs, readbacks, and qualification artifacts were
experimental output and had to resolve under `tmp/extraterrestrial/`.

Stages 12.0 through 12.9 used the
[proof-of-concept verification boundary](stage-12-implementation-topic.md#proof-of-concept-verification):
focused integrated runners and immutable evidence, with no experiment-local
unit-test tree or framework. Durable unit/regression hardening belongs to the
explicit production-promotion stage.

The complete selected `src/algorithm32` tree was copied directly so relative
implementation imports remained local and no hand-reduced replacement quietly
changed the starting architecture. The baseline and candidate had separate
roles: the baseline proved what production state was copied; the candidate
contained all Stage 12 changes. The baseline was never modified, and expected
candidate changes never weakened baseline verification.

Snapshot provenance recorded the source revision and scoped tree state, exact
file set, byte lengths, per-file and aggregate hashes, dependency-lock
identity, repository-local runtime/proof-runner closure, and explicit
exclusions. Snapshot creation was create-once. Any refresh created and
requalified a new versioned baseline instead of synchronizing or overwriting
the old one.

Every runnable entry point had a recursively verified import closure. Relative,
absolute, file-URL, or dynamic imports could not escape
`scripts/extraterrestrial/`; bare dependencies had to be declared and locked by
the experiment. Generated output under `tmp/extraterrestrial/` was never an
implementation, configuration, fixture, or oracle input, although a post-run
verifier could inspect the output it validated. Symlinks and junctions were
prohibited. Source and control destinations were real-path checked under the
tracked root, generated destinations were real-path checked under the ignored
output root, and protected production trees were fingerprinted before and
after each run. Runners derived both roots from repository identity rather than
the process working directory.

Before snapshot initialization, the active topic and a nested `AGENTS.md`
restricted implementation and source-control writes to
`scripts/extraterrestrial/` and every generated run, report, readback, capture,
build product, browser bundle, profile, cache, diagnostic, render, log, and
scratch write to `tmp/extraterrestrial/`.
Create-once run directories followed the canonical
[immutable run protocol](stage-12-implementation-topic.md#immutable-run-records)
under `tmp/extraterrestrial/runs/`; raw generated artifacts were never
committed. Canonical current-state documents retained accepted commands,
identities, hashes, tolerances, conclusions, and claim boundaries without
making ignored artifacts a runtime or promotion dependency.
`src/algorithm32`, `src/flat32`,
`scripts/algorithm32-star`, and `C:\dev\poly-gc-react` remained read-only
evidence surfaces throughout candidate qualification.

This isolation changed the implementation process, not the architecture below.
Production-style paths in Stages 12.0 through 12.9 referred to their mirrored
candidate paths. A separate future promotion step must reconcile the accepted
baseline-to-candidate delta with then-current production and port only the
reviewed semantics. Production must never import the experiment, and the
experiment does not become a second maintained runtime.

## Decision Summary

`CelestialContributionCache` is a camera-independent pipeline cache of
complete 15-channel celestial source quantities after direct atmosphere
transport. Its queries return transported point spectral irradiance or
transported extended spectral radiance; the live raster resolves those
quantities into `celestialRadiance`, which joins `pathRadiance` once before
Color. It stores neither an image nor generic atmosphere transmittance for a
caller to apply.

The selected architecture has two geometry-owned data products:

1. an immutable **transported-field generation**, built only when its physical
   field dependencies change and containing the immutable layer roster,
   membership, and composition policy; and
2. a small immutable **live query packet**, which maps current celestial
   placement and receiver geography into that generation's coordinates and
   carries current distant-source support.

A geometry-provided controller builds, validates, atomically publishes,
replaces, and disposes complete generations. The layer roster is not a
separately published object: a consumer can never pair a member payload with
the wrong layer or member roster.

The controller is a common **celestial cache builder**. Each celestial source
or light source contributes a source-specific builder extension that declares
its stable radiometry, representation kind, build inputs, and query payload.
Geometry supplies the corresponding coordinate reduction, named-frame and live
placement transforms, horizon/support classification, and atmosphere path;
it does not own source brightness. The builder publishes one common external
generation/query shape, while star directional fields and transformable Sun or
Moon bodies retain their distinct internal construction semantics.

The application owns independent source definitions and their radiometry.
Geometry owns the instantiated celestial cache, its build scheduling and
lifecycle, and all geometry-specific coordinate/indirection lookup tables.
When geometry requires a cache generation, it invokes the compatible
source-specific builder extension to construct that source's payload; the
source does not own or independently publish the cache instance.

## Proposal: Geometry-Driven Celestial Cache Queries

### Purpose

The celestial cache answers one physical question: **what transported
extraterrestrial light arrives from this ray direction at this receiver?**
Its public query is independent of camera projection and cache packing:

```text
sampleLight(geometryCelestialQuery)
  -> { classification, spectralRadiance, sourceIdentity, diagnostics }
```

`classification` distinguishes clear contribution, out-of-support,
ground-horizon, out-of-domain, and source absence. Exact zero is returned for
noncontributing classifications. A consumer such as the ray probe provides the
physical ray; it never selects cache texels or invents celestial coordinates.

### Geometry-owned query construction

Geometry reconstructs the physical meter-space ray from the active rendering
path, then owns this reduction:

```text
receiver position + physical ray direction
  -> active geometry family
  -> celestial coordinate and support classification
  -> cache stencil or sparse-indirection key
  -> geometryCelestialQuery
```

The geometry-owned query contains the source-independent receiver coordinate,
the geometry-family identifier, a physical direction, any required transport
stencil, and a source-support coordinate. Geometry also owns the lookup tables
that map those coordinates to cache pages/tiles. Source caches receive this
already-resolved query and may not recalculate position, projection, horizon,
or atmosphere-path semantics.

### Two geometry adapters, one cache shape

The first implementation is spherical, but the contract is designed for both
families:

| Family | Geometry mapping | Presentation surface |
| --- | --- | --- |
| Spherical Earth | Normalize the physical direction and use its celestial-sphere direction/longitude-latitude coordinate. | The celestial globe/sphere. |
| Flat Earth | Map the celestial-sphere direction through a north-polar azimuthal-equidistant projection. For celestial latitude `phi` and longitude `lambda`, its planar radial coordinate is `rho = pi/2 - phi`, with planar coordinates derived from `rho` and `lambda`. | Map that projected sky under the flat world's dome; the dome is presentation only. |

Both adapters produce the same abstract `geometryCelestialQuery`. They differ
only in the coordinate/stencil and presentation mapping produced by geometry.
The cache and source builder do not branch on camera projection.

### Source and cache responsibilities

The application owns independent `CelestialSource` definitions. The initial
source is the distant Sun; its static identity owns radiometry and angular
support. Geometry owns the instantiated primary celestial cache and asks the
compatible source builder extension for its fragment and cache-build
contribution. Geometry classifies support in its query and the cache returns
the transported radiance; the source never owns a published cache instance.

The implemented `StellarCelestialSource` is a
catalog/placement source, not yet a radiometric field builder: constructed
from the accepted BSC V/50 roster, it exposes its static point-source
definitions and epoch-bound canonical placement states through one public
interface. The geometry query path must consume those outputs rather than
recreate catalog records itself. `StellarCelestialSource` joins the celestial
runtime roster in an explicit star-source slot, but returns no transported
cache fragment until a separate qualified native-15 stellar-photometry policy
exists. Geometry retains the shared live rotation and all spherical/Flat
presentation transforms.
Immutable run `000112-pre-g9-stellar-celestial-source-proof` accepts this
source boundary: the runtime participant exposes the source in its explicit
point-source slot, geometry receives all 500 definitions/placements through
that interface, and a live epoch/body rotation refresh changes placement while
retaining catalog identity. It does not establish star radiometry, cache
payloads, GPU raster, or Flat-dome qualification.

### Stellar radiometry and point-cache design

**Chosen physical input policy:** each catalog star contributes an *apparent*
top-of-atmosphere spectral irradiance-density packet. The packet is not the
star's emitted luminosity, surface radiance, or an inverse-square calculation:
the BSC observed V magnitude already measures the flux arriving at Earth. The
atmosphere applies its direct transmittance once as the point-cache transport
operation; the later raster point response converts the transported point
quantity into a view contribution without reapplying distance falloff.

The `StellarCelestialSource` will receive a source-owned
`StellarSpectralPhotometry` companion constructed from three versioned,
checked-in scientific inputs under `scripts/extraterrestrial/catalogs/`:

1. the BSC V/50 selected record, including `Vmag`, B-V, spectral type, and
   visual-magnitude provenance/quality code;
2. the flux-calibrated Pickles stellar-template library, selected by normalized
   BSC spectral type and luminosity class (with a nearest compatible template
   fallback); and
3. the SVO Generic Johnson B and V response curves and Vega-system zero-point
   definitions.

The template choice gives the spectral *shape*. `Vmag` supplies the absolute
normalization. Define `M_V(F)` as the SVO Johnson-V energy-response weighted
mean spectral flux density (the response integral divided by the response
integral's wavelength weight), in the same `W m^-2 nm^-1` units as the Vega
zero point. For selected template `S(lambda)`, compute
`mTemplate = M_V(S)`. The apparent spectral flux is:

```text
A = F_V,zero * 10^(-0.4 * Vmag) / mTemplate
F_star(lambda) = A * S(lambda)
```

where `F_V,zero` and `M_V` use the same named SVO Vega/Johnson-V convention.
The implementation must use the complete passband response, not merely a
single effective wavelength or an RGB color conversion. It integrates the
scaled template over every contiguous native-15 wavelength bin and stores the
bin average in `W m^-2 nm^-1` as one native-15 irradiance-density packet. The
catalog B-V remains a validation/selection signal: choose the nearest template
within the parsed spectral-type/luminosity-class candidates; if no candidate
exists, choose nearest synthetic B-V across the library and record that
fallback. It must not be turned into an arbitrary RGB tint or an unphysical
negative-extinction correction.

The raw `n_Vmag` and uncertainty fields must be imported before materializing
packets. They are retained as provenance/quality metadata; the fixed
500-member Vmag/HR membership rule is not silently changed. Any record whose
declared input cannot be normalized through the selected Johnson convention
fails the materialization explicitly rather than receiving a guessed spectrum.

**Cache shape and identity:** materialized packets become the source-owned
members of the existing point-set transport interface. The first full roster
uses fixed capacity 512 with exactly 500 active members. Geometry packs each
member's `(h,u)` field into an explicit 32-by-16 tile grid: `width = 32 *
uCount`, `height = 16 * hCount`, with one ordinary R32F array layer for each
of the 15 native wavelength channels. Unused twelve tiles are exact zero. This
is the same geometry-assembled R32F/cache-render format as the existing cache,
but gives a bounded, portable 352-by-208-by-15 layout for the current
11-by-13 domain instead of requiring a 7,680-layer member/wavelength texture.
The source remains responsible for packets; geometry owns tile/index mapping,
stencils, and lookup; visibility and projection remain live raster work.

The static star-field identity contains the BSC source checksum and selection,
template-library manifest hash, template-selection/fallback revision, Johnson
B/V response and Vega-zero-point hashes, native-15 basis hash, member packet
hashes, capacity, and tile layout. It excludes epoch, Earth rotation,
geographic receiver, shell/dome placement, camera, and scene depth. A packet
or photometry-policy change rebuilds the field; a time or placement change only
refreshes live query/transform state.

Qualification must prove imported-source hashes; all 500 finite, nonnegative
native-15 packets; reconstructed Johnson-V magnitude within the declared
catalog rounding tolerance; explicit fallback/quality reporting; exact-node
and bounded off-node transport parity; exact-zero unused tiles; tile-index
lookup/conservation for all active members; and no cache rebuild after a live
rotation or placement change. GPU point projection, point-spread response,
and scene visibility remain the next separate raster stage.
Immutable run `000113-pre-g9-stellar-photometry-proof` accepts the packet
materialization portion: 107 checked-in normal Pickles templates, 500 finite
native-15 apparent-irradiance packets, two explicit global-B-V fallbacks, and
Johnson-V reconstruction with maximum error `3.1086244689504383e-15` mag under
the declared SVO response convention. Immutable run
`000122-pre-g9-stellar-tiled-cache-cpu-proof` accepts the bounded CPU/cache
plan: the 500 source-owned transported fields are packed into the 32-by-16
geometry tile grid, all active values are conserved within binary32 precision,
the twelve inactive tiles are exact zero, and placement-only refresh leaves
the static identity unchanged. The typed GPU plan is one `sampler2DArray`
copy pass into the 352-by-208-by-15 `R32F` resource. Immutable run
`000142-pre-g9-stellar-tiled-cache-proof` accepts actual browser construction
through the normal tiled-star GPU controller, all fifteen wavelength layers,
selected binary32 readback, zero unused tiles, and failure preservation. The
previous browser timeout diagnosis is closed: its runner served the generated
HTML entry as `application/octet-stream`, so Chrome did not execute the page.
The server must serve `.html` as `text/html; charset=utf-8` for every browser
proof.

### Fragment-based source assembly

The source builder extension should not receive geometry's finished cache and
mutate it. Instead, geometry asks each compatible source to return one or more
portable **celestial cache fragment specifications**. A fragment contains its
source identity and representation kind, a source-local anchor/relative offset
and extent, logical dimensions, channel layout, source-owned radiance values,
support metadata, and composition policy. A relative offset alone is not
sufficient for all source kinds: the specification must also carry the local
coordinate frame or parameterization that lets geometry transform the fragment
into its active celestial coordinate system.

Geometry then owns assembly:

```text
source.buildCacheFragments(buildRequest)
  -> fragment specifications + source radiometry payloads + cache-build inputs/modules
geometry.transformAndAssemble(fragments)
  -> pages/tiles, indirection table, R32F layout, cache-render pass plan
CacheGpuExecutor.execute(passPlan)
  -> staged transported resources, runtime bindings, complete generation
```

During assembly, geometry transforms fragment locations, assigns indices,
checks bounds and overlap/composition rules, and builds the final dense or
sparse representation plan. It supplies geometry-owned support, path, and
atmosphere-transport semantics to cache-render shader passes; a source
fragment supplies radiometry and source-specific shader inputs/modules but
must not independently apply atmosphere transmittance. `CacheGpuExecutor`
executes those passes through the externally owned backend, producing the
transported `R32F` field. A raw upload of a CPU-computed final atmosphere field
is not a construction path. This preserves the invariant that returned cache
light is transported exactly once while keeping source radiometry distinct
from geometry and atmosphere ownership.

For a Sun, the initial fragment can be a compact uniform-radiance disk payload
with angular-support metadata. Its source payload is perspective-invariant for
the accepted distant-Sun family; only geometry's current direction, horizon,
and atmospheric path vary by receiver. For sparse stars, fragments can be small tiles
or individual records. The spherical and flat geometry adapters transform the
same source-local fragments into their respective celestial-sphere or
north-polar azimuthal-equidistant cache layout.

**Resolved celestial radiance coordinate contract:** every directional star
element is specified in the named right-handed `celestial-rh-v1` frame by
`latitudeRadians` in `[-pi/2, pi/2]` and `longitudeRadians` in `[-pi, pi)`.
The canonical unit direction toward the element is:

```text
d_celestial = (
  cos(latitude) * cos(longitude),
  cos(latitude) * sin(longitude),
  sin(latitude)
)
```

Thus longitude zero is `+X`, positive longitude turns toward `+Y`, and the
north celestial pole is `+Z`. The half-open longitude seam is a source-data
normalization rule, not a visible gap. Each radiance element also declares its
angular support: directional-field cells carry latitude/longitude bounds, while
point stars carry their point/footprint support and their native-15 spectral
quantity. Latitude/longitude locate radiance; they do not silently assign a
physical star distance.

**Resolved first catalog roster:** the initial catalog input is the CDS/VizieR
Bright Star Catalogue, Fifth Revised Edition, `V/50/catalog`, in its J2000
FK5 coordinate fields. The checked-in source input is the 9,110-record TSV
projection under `scripts/extraterrestrial/catalogs/bright-star-catalog-v50.tsv`
(SHA-256 `d79223194f938533b4a4b7d832249d8661cf7adda088a8a0ec44039d3baab759`).
After excluding the 14 records without a valid J2000 position or V magnitude,
the roster is the first 500 of the remaining 9,096 stars, sorted by ascending
`Vmag` and then ascending Harvard Revised (`HR`) number. This is a stable
selection rule, not an opaque generated list.

For each selected entry, declination becomes `latitudeRadians`; J2000 right
ascension in hours becomes `longitudeRadians = RA * pi / 12`, normalized into
`[-pi, pi)`. The source record retains `memberId = bsc-v50-hr-<HR>`, HR,
name, J2000 coordinates, V magnitude, optional `B-V`, and spectral type. It
also retains `relativeVBandFlux = 10^(-0.4 * (Vmag - Vmag_brightest))` strictly
as a dimensionless brightness ordering/relative-photometry value. V/50 does
not supply a calibrated native-15 stellar source spectrum, so neither Vmag,
B-V, nor `relativeVBandFlux` is passed off as an atmospheric irradiance or
radiance packet. A later spectral-photometry policy must explicitly materialize
those packets and becomes a static cache invalidation input when it does.

The catalog adapter creates the existing two-part source interface: static
point-source definitions carry catalog identity/coordinates and point support;
live placement states carry only `d_celestial`, the selected epoch, and the
named celestial-frame contract. Geometry consumes those placements with its
live `bodyFromCelestial` matrix. Thus all 500 coordinates are now usable by
the existing source/geometry boundary, while stellar spectral calibration,
cache radiometry, and GPU point raster remain distinct follow-up work.
Immutable run `000109-pre-g9-bright-star-catalog-contract-proof` accepts this
input/adapter boundary: 9,096 valid records, the 500-member roster from Vmag
`-1.46` through `3.96`, canonical unit directions, matched source definitions
and placements, and the Unix-epoch spherical overhead invariant. It explicitly
does not claim stellar spectrum calibration, cache construction, GPU raster,
or flat-dome projection.

Geometry applies the live `bodyFromCelestial` and model-frame transforms to
this canonical direction. For spherical presentation it may place the element
on a chosen celestial shell with
`p = earthCenter + shellRadius * directionModel`. For flat presentation it
maps the same direction through its north-polar azimuthal-equidistant sky
projection and then onto its dome. Shell radius/dome placement are
geometry-owned presentation parameters: they can change visual 3D placement
without changing source radiance, angular support, transport, or cache identity.
The source record is therefore shared by both geometry families, while their
cache coordinates, seams, wrapping, and lookup tables remain adapter-owned.

**Resolved local-Sun scale rule:** the simulator settings materialize one
source-owned local-Sun definition with a unit-bearing physical radius and
configured 15-channel surface radiance. The current Flat32 defaults are
3,000 miles of center height and a 16-mile radius (32-mile diameter). The
source definition contains neither a reference-distance irradiance calibration
nor a separate display-size scale. Geometry receives the evaluated center from
the simulator/orbit state and, for every active receiver, resolves distance,
exact angular support `asin(radius / distance)`, and the finite-body transform.
It may scale a presentation representation from those values, but it never
owns nominal size or radiometry.

The same source radiance drives both paths. A clear view ray through the disk
receives source radiance attenuated only by its source-to-receiver atmosphere
path. Atmospheric and terrestrial direct illumination integrate that radiance
over the receiver-visible disk solid angle; the expected distance falloff then
arises from the shrinking solid angle, with no second inverse-square or
reference-scale multiplier. The existing Flat32 local-light reference-distance
adapter must be replaced or adapted to this finite-radiance contract before it
can participate in the celestial family. Horizontal orbital motion is a live
geometry transform when the flat source-relative cache domain remains valid;
changing radius, radiance, vertical scale, atmosphere, or cache-domain policy
invalidates the physical field. The candidate now has the first executable
slice of that distinct family: a source-relative `1 x 1 x 15` `R32F` cache
stores the static surface-radiance packet, while Flat geometry supplies the
required live body center/radius binding that resolves ray--sphere support and
the renderer integrates only the receiver-to-top-atmosphere segment before the
body. The disk and atmospheric segment consume that one geometry-owned center;
the static cache has no evaluated-center fallback. Thus a compatible horizontal
center change updates a per-frame binding and does not rebuild the cache. This
is deliberately not a change to the accepted distant-Sun cache or the legacy
Flat32 reference-distance adapter.

Immutable run `000087-pre-g9-flat-local-finite-sun-runtime-proof` accepts the
normal candidate `Algorithm32 -> ShaderBuilder -> shader-handle ->
EffectComposer` installation for this slice. It compiles the finite-disk,
live finite-atmosphere, and ordinary cumulative-cache contributions together;
the caller-owned horizontal center binding refreshed to 100,000 m without
replacing the celestial generation. Immutable run
`000092-pre-g9-flat-local-finite-sun-ground-scenes-proof` supersedes the
earlier visual capture. It uses the accepted Flat32 observer-centered dome
(100 km apex; 1,926,774 m maximum view-ray extent) over a
`FlatEarthGeometry`-owned ground/horizon endpoint at 512 x 512 pixels and a
78-degree vertical FOV with the source intentionally off-center. The dome
removes the planar grazing-ray white-horizon discontinuity without changing
the source-relative cache. Renderer-produced depth/hit inputs distinguish
clear, fully scene-blocked, and partially scene-blocked finite disks; measured
disk-region energy is 276.697, 240.172, and 269.076 respectively. The retained
visual capture uses a display-only exposure multiplier of 120; it does not
alter the configured source-radiance packet or source-relative cache.
Static-invalidation remains unqualified.

Accepted runs `000100-union-glacier-flat-0-render`,
`000101-union-glacier-flat-180-render`, and
`000106-union-glacier-flat-90-render`, and
`000107-union-glacier-flat-45-render` retain four Flat/local scene contexts:
Union Glacier / Flat 0, Flat 45, Flat 90, and Flat 180, each with the fixed 720 x 414,
70-degree horizon-facing camera and six Flat32 review boxes. Flat 0 uses the
closest-approach center `[0, 6,283,427.593, 4,828,032] m`, placing the
37.538-degree Sun above frame; Flat 45 uses
`[-8,882,196.551, 9,962,553.551, 4,828,032] m`, placing the 19.886-degree
Sun in frame; Flat 90 uses
`[-12,561,323.593, 18,844,750.419, 4,828,032] m`, placing the 12.034-degree
Sun in frame; Flat 180 uses `[-24,595.666, 31,412,707.264, 4,828,032] m`,
placing the 8.738-degree Sun in frame. Superseding run
`000102-union-glacier-flat-180-render` verifies the
disk shader reads precisely that geometry-owned Flat 180 center, rather than a
static cache default. These establish scene configuration only, not geographic,
ephemeris, observational, or full visual-match validation.

For the Sun, geometry identifies the current disk center in its active mapping;
the cache performs an exact angular-support test around that center before
reading transport data. For future sparse stars, a directional cell may index a
compact candidate list, but that indirection only narrows candidates. An exact
direction/support test remains the final authority so a one-pixel source is not
blurred, dropped, or leaked into adjacent cells.

### Staging

1. Implement and prove the spherical adapter plus the primary Sun cache.
2. Freeze the common `CelestialSource`, `geometryCelestialQuery`, and
   `sampleLight()` shapes.
3. Add the flat north-polar azimuthal-equidistant adapter as a separately
   qualified geometry family, reusing the public cache shape but not spherical
   coordinates or transport assumptions.

Moon bodies, catalog-scale sparse-star cache/raster structures, and
implementation of the selected live transforms remain follow-up work. The
initial 500-star catalog roster and source/placement adapter are now present;
they must extend this contract without turning the presentation dome into
physical transport geometry.

### Deferred live-transform contract

Cache construction is the current implementation priority; live-transform
implementation is deferred. A future rewrite of `DistantSunLightSource` must support a live
light-source transform contribution that can be assembled into the shader at
render time without rebuilding transported cache data. The same transform
contract must serve extraterrestrial objects and light contributors, including
the transformable Sun and later Moon. If the selected contract is functional on
the CPU, this stage must define its equivalent serializable/shader-assembly
form as part of the same interface rather than introducing unrelated CPU and
GPU transform mechanisms. Such transforms affect rendered placement only;
they do not alter source radiometry, geometry-owned physical mapping, or cache
field identity unless a future qualified family explicitly says otherwise.

**Resolved directional-field time transform:** a star catalog remains fixed in
`celestial-rh-v1`. Let `thetaEarth(t)` be the east-positive Earth-rotation
angle at the current time. The live body-frame direction is
`d_body = Rz(-thetaEarth(t)) * d_celestial`, where `Rz` is the ordinary
right-handed rotation about the celestial `+Z` pole. The negative sign makes a
fixed catalog direction acquire the expected westward apparent motion as the
body rotates eastward. Geometry then applies its ordinary body-to-model
transform. The spherical adapter places that rotated direction on its celestial
shell; the flat adapter converts the same rotated latitude/longitude through
the azimuthal-equidistant map before dome placement. `thetaEarth` is a live
CPU query/shader uniform, never cache payload or field identity, so a time
change refreshes placement without rebuilding catalog radiance or transported
cache resources.

The transform configuration contains `rotationEpoch` (where
`thetaEarth = 0`), `rotationPeriod`, and a `zeroAlignment` mapping from catalog
longitude zero to the geometry's named reference direction. The base celestial
map contract fixes `rotationEpoch` to the Unix epoch
`1970-01-01T00:00:00Z` and fixes `zeroAlignment` to the canonical `+X`
direction: at that instant, catalog longitude zero maps to body/model `+X` and
Flat dome azimuth zero. This is a deterministic simulator coordinate
convention, not an assertion of historical astronomical alignment. A later
real-sky/Flat calibration may add an explicit alignment offset without changing
catalog latitude/longitude, source radiance, or cache identity.

The epoch alignment invariant is exact for the spherical adapter: a catalog
element whose celestial latitude/longitude equal a terrestrial receiver's
latitude/longitude is directly overhead for that receiver at the Unix epoch.
The initial Flat dome calibration is deliberately the same calculation, not a
second sky-alignment solve: at each simulator time it evaluates the shared
`thetaEarth(t)` from the same Unix epoch and configured period, applies the
same `Rz(-thetaEarth(t))` to `d_celestial`, and only then applies its
north-polar azimuthal-equidistant/dome transform. Its default
`zeroAlignment` is therefore the inherited identity (`+X` / dome azimuth
zero), exactly as for the spherical adapter. The Flat implementation must
realize the same Unix-epoch overhead relationship rather than reinterpret
catalog coordinates. A real-sky/Flat calibration remains an optional explicit
alignment offset for a later capability; it is not required to place or rotate
the initial catalog.

This split is essential. In the first symmetric family, a source can move
across the local sky as epoch or geographic receiver state changes without
rebuilding the transported spectra. Geometry updates the query packet and
chooses a different field coordinate. Camera orientation, projection, FOV,
viewport, pixel coordinates, point response, and live scene depth never enter
the physical field axes or fingerprint. The renderer's view-ray origin matters
only when geometry designates it as the physical receiver; moving that
receiver refreshes the query packet but does not rebuild the first-family
field.

The first accepted implementation family is
`spherical-sun-stars-radial-v1`. Its spherical transport and celestial-sphere
mapping remain separate from the planned flat-Earth star-sky family. Both
families retain canonical celestial-sphere directions as the camera-independent
source data and wrap those directions through a geometry-owned presentation
projection: the spherical family uses the celestial globe directly, while the
flat family uses a north-polar azimuthal-equidistant projection of the celestial
sphere and maps that projected sky under its dome. A finite/local Sun is not
part of the flat-family scope:

The celestial-rendering contract must therefore accept two representation
kinds: a **directional field** for projected, effectively infinite stars, and
a **transformable 3D body** for the Sun and future Moon. A body has source
radiometry and geometry facts plus a live placement transform. An additional
live celestial/body rotation transform may animate it to emulate Earth rotation
without becoming cache data or physical-field identity. The same live-transform
separation will later be applied to light-source placement, but light-source
integration is a separate concern. Moon behavior remains deferred.

- concentric spherical ground and atmosphere boundaries;
- a radially symmetric atmosphere;
- one bounded aggregate infinite point-set layer;
- one distant uniform Sun-disk layer;
- one multi-star mechanics fixture and one distant uniform Sun-disk fixture in
  the acceptance roster;
- per-member or per-extended-layer transported values over geometry-owned
  altitude and horizon-aware direction coordinates; and
- analytic ground/horizon classification before interpolation.

The Sun and star field compose additively and the first family permits no
opaque celestial layer or foreground edge. The stars publish and compose as
one layer, but retain individual directions and transported irradiance until
after live scene visibility and projection. The oriented, textured, Sun-lit
finite Moon is deferred to the [resolved-Moon follow-up](moon-follow-up.md).
Flat geometry, asymmetric terrain, profiled extended disks, mutual celestial
ordering, and catalog-scale star fields remain separate capability families.

## Production Algorithm Placement And Owner Map

A read-only survey of the current production implementation fixes the
architectural placement. The first-family path is:

```text
static celestial source roster in Config/SharedModel
  -> ShaderBuilder setup
       -> existing light-source-created scattering-cache controller
       -> separate geometry-created celestial-cache controller
            -> one immutable transported-field generation

live placement states + observation/receiver state
  -> geometry-prepared live query packet

live camera + viewport
  -> geometry model-ray and pixel-corner reconstruction
  -> point projection / Sun footprint integration

ordinary Algorithm32 transport
  -> pathRadiance
celestial cache lookup + live raster visibility
  -> celestialRadiance
spectral composition
  -> preDisplayRadiance = pathRadiance + celestialRadiance
Color
  -> the one spectral-to-display conversion
```

### HDR visual adaptation for stellar visibility — active

The fixed Figure-1 display coefficient is a daylight-oriented display fit. It
can correctly compress a high-radiance Sun without preserving the visibly
small, physically valid stellar radiance that remains after atmospheric
scattering. A time-of-day flag, a star-specific gain, or a per-pixel
normalization is not admissible: each would decouple star visibility from the
scattered sky that physically masks it.

Geometry now owns a two-pass observer-local sky-irradiance measurement path:

```text
ordinary atmospheric sky spectral radiance (pathRadiance only)
  -> photopic illuminance plus scene-linear RGB irradiance over clear-sky samples
  -> Geometry endpoint ambient-light input
completed scene-linear RGB (sky + captured scene bridge)
  -> one sky-meter-derived global adaptation gain
  -> standard Figure-1 exponential display map
  -> display RGB (Color)
```

The metering statistic is derived from ordinary unoccluded atmospheric sky radiance,
not time, a source identity, a star pixel, or a per-pixel brightness target.
Its result drives two separate consumers: Geometry uses the RGB irradiance for
physical endpoint lighting, and Color uses its photopic channel for one global
viewer-adaptation gain. Lower local sky brightness lowers Geometry endpoint
ambient light and raises only that shared display gain.
The cache, source radiometry, transport, geometry, live visibility, and
pixel-footprint response remain untouched. The contained implementation uses a
4-ring by 8-azimuth equal-solid-angle midpoint quadrature and a live 1-by-1
`RGBA32F` reduction target. The current Three endpoint bridge reads it for
scene lighting; a later radiometric endpoint path removes that readback.

The initial meter will be a geometry-owned, camera-independent upper-hemisphere
quadrature at the observer. Geometry supplies fixed local directions
`omega_i` and solid-angle weights `DeltaOmega_i`; the probe evaluates ordinary
atmospheric path radiance to the top boundary with no scene endpoint and no
celestial contribution. Color projects each native-15 packet to photopic
luminance `L_v(omega_i)` and reduces:

```text
E_v = sum_i L_v(omega_i) * max(dot(observerUp, omega_i), 0) * DeltaOmega_i
```

The weights must integrate a uniform sky exactly to `E_v = pi * L_v`. A small
The reduction records `E_v` in its first channel and sky diffuse
scene-linear-RGB irradiance in the remaining channels. The probe excludes
stellar and Sun-disk contributions, so celestial sources cannot illuminate the
ground through this ambient path; only their atmospheric scatter can do so.

Color retains the standard Figure-1 exponential display map after CIE
projection. Before that map it applies exactly one camera-independent gain
from the probe: `clamp((0.18 * pi / K) / max(E_v, E_ref / 16,384), 1,
16,384)`, where `E_ref = 0.18 * pi / K` (about `1,931 lux`). This derives the
exposure from the retained Figure-1 coefficient and the standard 18%
middle-gray key. The lower bound means daylight is never dimmed; the 14-stop
upper bound permits a shared dark-scene response when the present meter reaches
its documented zero floor. There is no time, source, star-specific, or
per-pixel branch in Color.

Twilight calibration uses the published approximate naked-eye relation
`m_limit(theta) = 1.07 * theta - 10`, where `theta` is solar depression in
degrees, as an *external validation target*. It supplies an expected limiting
V magnitude for selected physically rendered scenes, against which Geometry's
sky-irradiance ambient response can be checked. It must not enter the renderer
as a time rule, a magnitude cut,
or a per-star visibility gate: the rendered stellar radiance still competes
continuously with the atmospheric sky under the shared local-brightness state.

Immutable run `000185-twilight-local-brightness-calibration` establishes the
first measurement baseline at `theta = 0, 3, 6, 9, 12, 15` degrees. The
ordinary atmospheric meter falls monotonically from `1421.196 lux` at sunset
to `0.03978 lux` at nine degrees, but reports exact zero at twelve and fifteen
degrees. Those zeroes are a dark-end meter/result limitation to resolve before
fitting either response curve; they are not evidence that the physical night
sky is black and must not be substituted with a star-specific rule.

Immutable run `000186-twilight-sky-probe-range-diagnostic` localizes that
limitation: at eleven degrees every one of Geometry's 32 probe rays retains
positive atmospheric path luminance (log2 values from about `-19.0` to
`-26.4`), while at twelve and fifteen degrees all 32 are exactly zero. The
loss therefore occurs in atmospheric path-radiance evaluation before the HDR
meter reduction or Geometry ambient response. Tuning the ambient consumer
cannot repair it; atmospheric dark-twilight transport/support is the
next separate diagnosis if calibration beyond the currently working dark
range is required.

### Spherical twilight cache-coordinate correction

The diagnosis in this section is retained evidence. The focused
[solar-zenith cache design](../algorithm32/cache/solar-zenith-cache-design.md)
now owns the proposed replacement design space, offline construction,
Native15 representation candidates, residency, compression, and qualification
contract. The
[distant-Sun execution plan](../algorithm32/cache/distant-sun-solar-zenith-cache-plan.md)
owns its contained implementation order and evidence gates.

The current distant-Sun scattering cache is a reduced reference-column field:
its lookup state is altitude `h` plus the existing source-relative W27 view
direction stencil. At build time it evaluates that state at one reference
point on the observer radial column. This is sufficient only while the
reference column's local Sun elevation represents every actual point along a
view ray. It does not at twilight: Earth curvature changes the local radial
normal along the straight view ray, so a sample can see the Sun even when the
reference point at the same altitude cannot, or vice versa.

The corrected spherical atmospheric state is the usual
`(r, mu, mu_s, nu)` form: radius `r = |p|`, view-local cosine
`mu = dot(p, v) / r`, Sun-local cosine `mu_s = dot(p, s) / r`, and relative
view/Sun cosine `nu = dot(v, s)`. Direct first-order scattering at actual
point `p` must use the corresponding ground visibility and source-path
transmittance:

```text
V(p, s) * T_source(p, s) * E_s * [beta_R(p) P_R(nu) + beta_M(p) P_M(nu)]
```

The former runtime approximation is therefore not an equivalent coordinate
change:

```text
L_current = integral T_view(o, p) C(h(p), W27(v, s)) dp
C is built at p_ref(h), not at p.
```

The replacement solver must preserve spherical state at each offline branch
point, including actual-point direct-Sun visibility/source paths in every
higher-order recurrence term. The selected runtime semantic is cumulative
local spectral scattering density in one point-local cache per scene,
addressed by altitude, actual local solar zenith, and complete local
source-relative outgoing direction. Geometry continues to own ray termination
and actual sample coordinates; Algorithm32 continues live branch integration.
The distant light source owns `s` and source irradiance, and the atmosphere
remains the transport owner. This does not introduce camera or object state
into the cache or move Color/ambient ownership.

Immutable run `000205-subjective-globe-twenty-minutes-after-sunset-actual-point-j1-control-render`
is the accepted diagnostic control for this decision (artifact-set SHA-256
`d3657799b4f36f3906679729aeca912df02607532bafc4186217e111d4cb7c21`). It
replaces cache lookup only for order-1 with direct per-sample spherical
visibility and source-path integration in the normal renderer at the retained
San Jose, 20-minute-after-sunset, Sun-facing fixture. It measures `130.016`
lux, whereas the current cached order-4 scene in accepted run `000194` reads
`185.739` lux, and preserves a narrow warm horizon rather than the broader
cached brown transition. This establishes that the reduced cache is not
twilight-equivalent; it does **not** qualify a new field layout, higher-order
transport, resource budget, or a replacement normal renderer.

The focused San Jose nautical-twilight follow-up is immutable run
`000497-san-jose-nautical-twilight-actual-point-j1-control` (artifact-set
SHA-256
`3460c9e3b4d450757861ad57ef9ae459d0a34b2d52af729611a68638cae82877`).
It holds the accepted run-`000493` ozone/F68/W39/N4 cache and all presentation
inputs fixed, then adds only directly integrated actual-point first-order
radiance after current cached transport. A binary64 `320 x 320` three-ray
control closes `97.20795%` of the original source-axis center/flank deficit;
the current and augmented images show the deep split becoming a continuous
source-facing horizon band. This is strong causal evidence for the missing
actual-point state. It remains a hybrid because the added term does not feed
J2--J4 and therefore is not the replacement-cache qualification.

**Production transformed-source ingress follow-up:** the earlier integration
architecture proposed one transformed-source ingress for distant and local
lights. That remains a later production-design question, not a premise or
completion gate of the distant-Sun numerical plan. A distant production port
must expose a live source transform without rebuilding its static atmosphere
asset, but it need not implement or prove a finite/local coordinate family in
the same step. A later local design must independently select its finite-source
coordinates, inverse-square policy, and asset identity before deciding whether
the source-transform API is genuinely shared.

For the distant source, Geometry owns application of the active direction and
the source owns supplied direction and irradiance. Under the selected
one-cache-per-scene design, that direction belongs to scene-cache identity.
A direction change therefore selects or atomically swaps a separately built
compatible scene cache; continuous animation remains deferred. Static
atmosphere/compiler products may still be reused as declared construction
inputs. The current reduced distant cache remains unchanged until numerical
and integration contracts are separately qualified.

The solar-zenith design now owns selection and qualification of the new
spherical field representation. A later production port must reconcile it
with this transform ingress, then requalify direct and higher-order transport,
live lookup, lifecycle, HDR meter, and endpoint lighting before regenerating
the Bruneton comparison reports. Existing Bruneton scores remain historical to
the reduced `(h, W27)` cache and must not be compared as scores for the
corrected contract.

For the current ordinary Three endpoint scene, a Geometry-owned Lambert ground
receives sampled HDR sky irradiance. The controller refreshes the `RGBA32F`
probe before capture and passes its three scene-linear RGB irradiance values
directly to `AmbientLight` with unit intensity. In the installed Three
Lambert path this produces `diffuseColor * E_sky_RGB / pi`; there is no
photopic-lux normalization, intensity cap, or separate endpoint exposure.
`EffectComposer`'s offscreen half-float linear-sRGB target retains that range,
and Color reads it as HDR linear RGB before applying its single final display
mapping. For a receiver normal `n`, the physical Geometry input is
`E_sky(n) = integral(L_sky(omega) * max(dot(n, omega), 0) dOmega)`; the
existing upper-hemisphere plan evaluates it for horizontal local ground.
No elevation curve, ambient floor, or photopic-lux scale may substitute for
that sampled Geometry-lighting input. Color's separate global adaptation gain
uses only the same probe's photopic channel.

The existing captured scene endpoint remains an RGB input to the current
Color-owned bridge. Production has no spectral `endpointTransportedRadiance`
state today, and the first celestial family does not create one. Its immediate
pre-display spectral sum is therefore exactly `pathRadiance +
celestialRadiance`; the captured scene RGB and its existing transmittance
handling remain separate.

### Existing pipeline precedent and cache-semantic distinction

The production integration pattern is not a new sidecar pipeline. The current
`poly-gc-react` design already models `CelestialContributionCache` as a
separate generated resource under the existing `Algorithm32` facade and
`ShaderBuilder` lifecycle:

```text
canonical owners
  -> immutable celestial cache generation
  -> ShaderBuilder validation/resource preparation/binding
  -> cache-owned shader contribution after base transport
  -> pathRadiance + celestialRadiance
  -> existing Color
```

That is the direct celestial analogue of the established atmospheric-light
assembly shape: `SharedModel.lightSource` creates its generated atmosphere
cache, `ShaderBuilder` builds and binds it, the cache supplies its own shader
contribution, and the shader handle owns replacement and disposal. Stage 12
must extend this pipeline-participant pattern. It must not install
`CelestialFrameEvaluator`, the external stash's camera-bound frame composer,
or another renderer as a parallel production path.

The integration and lifecycle are analogous; the cache contracts are not
interchangeable. The existing light-source scattering cache supplies
cumulative spectral scattering density to ordinary transport. It is sampled
along the view path and integrated with view transmittance and path measure to
produce `pathRadiance`. The celestial cache instead supplies complete direct
source-to-receiver transported quantities to the live source raster after
ordinary path transport. Extended entries are already spectral radiance;
point entries remain spectral irradiance until the one
`response / pixelSolidAngle` conversion. The raster's pipeline-visible result
is spectral `celestialRadiance`.

Only the assembly shape is inherited from current `poly-gc-react` production
code. Its configuration replacement is not the lifecycle oracle for Stage 12.
The stronger prepare-successor, publish-complete, preserve-last-valid, and
idempotent-disposal behavior comes from this repository's existing
attachment-owned light-source cache controller and remains mandatory for the
celestial controller.

The following are supporting ownership and lifecycle assignments, not the
defining difference from the light-source pipeline:

1. geometry, rather than the celestial source roster, creates the cache
   controller because geometry owns the celestial/body/geographic/model/cache
   transforms;
2. static source definitions belong to `Config`/`SharedModel`, while evaluated
   placement and receiver state belong to a small live geometry query packet;
   and
3. celestial controller, generation, direct identity, binding, and shader slots
   remain distinct from the atmospheric scattering-cache slots even though
   they follow the same setup, publication, replacement, and disposal shape.

The external stash did not implement this modeled integration. Its celestial
modules were standalone CPU camera/raster/frame components, while its
`SharedModel` and `ShaderBuilder` still integrated only the atmospheric light
source and its incident-radiance cache. Those modules remain behavioral
evidence, not the architecture to reproduce.

### Existing seams and selected changes

| Responsibility | Current production seam | Selected Stage 12 change |
| --- | --- | --- |
| Static source facts | `Algorithm32._copyConfig()` and `SharedModel` now accept optional `Config.celestial`: an application-owned immutable `CelestialRuntimeParticipant` with one primary source id and a static source roster. | Keep only static field-source definitions and roster identity here. Evaluated placement states never enter facade config. |
| Celestial transforms and domain | `SphericalEarthGeometry` already owns renderer-to-model transforms, atmosphere paths, cache build rays, CPU stencils, and equivalent shader stencils. | Make `SphericalEarthGeometry` the first-family provider. Add the required celestial domain, placement, build-sample, receiver-stencil, direction-stencil, query-packet, and controller-factory operations. `FlatEarthGeometry` does not support this family and must reject it. |
| Atmospheric scattering cache | `ShaderBuilder` creates one controller through `lightSource.createCacheController()` and stores generic `cacheController`, `cache`, and `cacheIdentity` slots. | Preserve that physical path but name its lifecycle slots `scatteringCacheController`, `scatteringCache`, and `scatteringCacheIdentity`. It remains source-owned and independent of celestial resources. |
| Celestial cache | No production slot exists. Existing light-source controllers supply the proven staging, reuse, supersession, atomic publication, failure-preservation, and disposal pattern. | Add `celestialCacheController`, `celestialCacheGeneration`, and `celestialCacheIdentity`. Geometry creates the controller; the generation owns its roster, point and extended payloads, runtime bindings, diagnostics, and disposal. |
| Setup orchestration | `ShaderBuilder._createBuildContext()` builds only the scattering cache, and `Algorithm32ShaderHandle` preserves or disposes only one controller. | Coordinate both controllers as separate attachment-owned results, await complete generations before shader publication, preserve each reusable controller independently, and dispose both transactionally. Neither controller owns the externally supplied backend. |
| Shader assembly declarations and providers | Direct `ShaderContribution` providers currently cover geometry, atmosphere, atmospheric light source, scattering cache, transport, then Color. | Add distinct scattering-cache and celestial-cache provider declarations plus separate celestial-cache, celestial-raster, and composition shader symbols and runtime binding namespaces. |
| Shader execution | `ShaderState` contains `pathRadiance`; `evaluateTransport` is followed immediately by Color composition. | Add zero-initialized `celestialRadiance` and `preDisplayRadiance`. Add `sampleCelestialCache`, `evaluateCelestialRadiance`, and `composeSpectralRadiance` slots after ordinary transport and before Color. Never mutate or relabel `pathRadiance`. |
| Camera/raster facts | The Three adapter already refreshes inverse projection/view matrices, model-space camera positions, and viewport size. Geometry can reconstruct a model ray at any UV, but production currently requests only the pixel-center ray. | Reuse the same live bindings and geometry transform to obtain ordered corner rays. Add renderer-neutral forward projection, clipping, exact spherical pixel solid angle, point response, and extended-footprint contracts. Camera, FOV, projection, and viewport remain live raster facts and never enter field identity. |
| Live scene visibility | `SceneInputCapture` already publishes nearest-filter scene-hit and physical-depth textures, currently used only for the destination view ray. | Treat it as a candidate Three visibility substrate. A qualified adapter must resolve visibility at the exact projected star direction and matched Sun quadrature directions; the cache stores no live scene facts. |
| Color | `BrunetonColorDisplayModel` converts `state.pathRadiance` and then applies the existing captured-scene RGB bridge. | Color remains the only spectral-to-display owner and instead converts completed `state.preDisplayRadiance`. It owns no source, cache, projection, response, or visibility logic. |
| CPU oracle | `Reference.evaluate()` is deliberately a one-ray atmosphere result. Checked spectral packet addition and `Color.convert()` already exist. | Keep `Reference` as the base path oracle. A separate CPU celestial frame/pixel evaluator consumes its result, the cache generation, query packet, raster packet, and injected visibility resolver, then creates `celestialRadiance` and the checked pre-display sum. |
| Renderer/application adapters | React/Three and Flat32 mutate frame bindings outside the physical model. | Extend the renderer-neutral and Three seams only after their contracts are selected. Flat32 is not the owner or first-family acceptance surface. |

No aggregate snapshot of `SphericalEarthGeometry` can serve as the celestial
field identity: observer and atmospheric-light-source facts would incorrectly
turn compatible placement or receiver changes into rebuilds. The direct typed
celestial-domain owner exposes only the supported radii/domain, `(h, u)`
mapping and nodes, transform/stencil/horizon versions, stable visibility
policy, and family identity consumed by construction and reuse.

Likewise, the existing `resolveCacheBuildRay()` is only a mechanical helper.
Its ambiguous `incomingDirection` and nullable ground-blocked result do not
cross the new boundary. `resolveCelestialBuildSample()` uses
`directionToSource` and returns an explicit `clear` or `ground-horizon`
classification plus the geometry-built atmosphere path.

### Production integration roles

The candidate's first-pass module map is historical qualification context,
not current path guidance. A future accepted promotion must allocate every new
module and declaration through the
[canonical Algorithm32 organization](../algorithm32/archive/reconciliation-2026-08-04/algorithm32/source-organization-plan.md#selected-target-tree)
from demonstrated ownership and dependency direction. It must not recreate
the vacated candidate-era owner folders, invent an `ExtraterrestrialSource`
declaration, or retain a compatibility alias for a rolled-back camera-space
contract.

The logical integration roles remain:

- the existing facade and model owners accept static source definitions and
  roster identity, while evaluated placement stays on the live-state route;
- the spherical geometry owner provides the first-family transform, domain,
  build-sample, stencil, query-packet, and controller-creation behavior;
- one geometry-provided celestial controller owns generation planning,
  payloads, packing, runtime bindings, publication, diagnostics, and disposal
  without taking ownership of geometry transforms;
- renderer-neutral raster, footprint, visibility, and spectral-composition
  operations receive owners only when promotion demonstrates their actual
  consumers and nearest common boundary;
- existing GPU assembler, GPU runtime, runtime rendering, React adapter, and
  Color owners receive only their direct assembly, resource, binding,
  lifecycle, and pre-display integration changes; and
- qualification-only frame evaluation remains evidence support, not a facade
  API or parallel production runtime.

The first celestial GPU representation uses the established scalar cache
format: `R32F` array textures with one native spectral channel per layer.
`ThreeCacheBackend`, `CacheGpuExecutor`, and `CachePassAssembler` are already
scalar `R32F` machinery. G6c uses their cache-render shader-pass path to
construct celestial layer sets while preserving format, precision, addressing,
and backend ownership conventions. It must not introduce a parallel
`RGBA32F`-specific celestial format or silently relabel celestial fields as
scattering artifacts.

### Decisions retained from the historical placement

- The closed implementation and qualification surface was the isolated
  `scripts/extraterrestrial/candidate/src/algorithm32`
  snapshot fork.
- The eventual accepted destination was and remains `src/algorithm32`;
  production receives only the reviewed semantic delta at an explicit
  promotion checkpoint.
- `scripts/algorithm32-star/`, `C:\dev\poly-gc-react`, and `src/flat32` were
  evidence or later consumer surfaces, never candidate runtime dependencies.
- The source roster is static facade/model configuration; evaluated
  placement and observation state are live inputs.
- Geometry owns celestial/body/geographic/model/cache transforms and creates
  the cache controller.
- The celestial cache and atmospheric scattering cache have separate
  identities, generations, bindings, shader namespaces, and lifecycle slots.
- The atmosphere remains the only direct-transport physics owner.
- The existing fullscreen Algorithm32 pass is the first-family raster
  consumer; no authored RGB billboard, second display pass, or 3D Sun/star
  object is part of the physical route.
- Camera/FOV/viewport changes alter corner rays, projection, support, response,
  and pixel solid angle only. They neither rebuild nor re-key the transported
  field.
- Celestial spectra enter after ordinary path transport and before the one
  Color conversion. Captured scene RGB behavior is unchanged.
- The first family contains only additive Sun and stars. No Moon or celestial
  foreground edge is admitted.

### Open questions not inferable from the architecture

Stage 12.0 must classify every choice below as fixed, provisional, or deferred
to a named experimental goal. A deferred choice is not a missing decision when
its constraints, owner goal, reconsideration deadline, and change rule are
recorded. G0 freezes the semantics needed to begin geometry work; later goals
select physical and renderer policies using their own observable proofs.
Everything else above is an implementation decision already fixed by
ownership and algorithm placement.

1. **Live-state ingress:** the exact public update surface that supplies
   evaluated placement states, observation/body-orientation state, and the
   geometry-mapped receiver without invoking full `setConfig()`; and how the
   visible Sun shares placement and canonical radiometry identity with the
   existing atmospheric Sun without creating a second owner.
2. **Named-frame fixture:** the concrete celestial frame, epoch/time scale,
   body-orientation transform, geographic receiver packet, provider
   fingerprint, and exact mechanics fixture values.
3. **Field realization:** `(h, u)` node locations and counts,
   `horizonNormalize`, boundary tolerances, interpolation/parity tolerances,
   direct-transmittance integration controls, and whether the node set is
   family-fixed or explicit geometry configuration.
4. **GPU resource path (selected):** source builder extensions contribute
   shader inputs/modules; geometry assembles the cache-render pass plan; and
   the established scalar `R32F` `CachePassAssembler`/`CacheGpuExecutor`/
   `ThreeCacheBackend` path constructs every spectral layer. No direct upload
   of a CPU-computed final transported field is permitted. G6c accepted this
   route for the distant Sun; future source kinds must separately qualify their
   binding, capability, parity, and publication behavior.
5. **Raster adapter:** the ray probe is the sole CPU evaluator ingress. It
   supplies ordered corner and physical sample rays, defines the effective
   projection, and supplies matching visibility answers. G5 selects the
   footprint quadrature, raster-origin convention, clipping rules, and the
   corresponding Three adapter without reconstructing projection from camera
   state.
6. **Live visibility:** whether the existing scene-hit/depth capture can
   qualify, or whether exact star and matched Sun samples require a dedicated
   visibility pass or analytic query, including transparency, alpha testing,
   subpixel/MSAA, displaced, and skinned geometry policy.
7. **Point and Sun policies:** point-response kernel, chromaticity, finite
   support/tails, off-raster accounting, Sun quadrature/refinement, and their
   numerical error controls.
8. **Capacity and budgets:** bounded star-member capacity, query-packet
   storage/traversal strategy, retained/packed/peak/resident resource ceilings,
   build/query/frame-time budgets, and the qualifying hardware class.
9. **Public contract names:** final public names for the live-state update and
   renderer-neutral raster contracts. The CPU frame evaluator is internal
   qualification machinery and does not receive a facade method.

## Requirements Ledger

| Id | Requirement |
| --- | --- |
| `CCC-R01` | Every returned spectrum has already passed through atmosphere transport. Runtime never applies atmosphere transmittance to it again. |
| `CCC-R02` | Point spectral irradiance and extended spectral radiance remain separate typed measures through source input, build, storage, lookup, validation, and composition. |
| `CCC-R03` | Stored fields and their physical identity contain no camera orientation, projection, FOV, viewport, pixel ratio, pixel coordinate, point response, live scene depth, Color, exposure, or display state. A geometry-mapped physical receiver may affect only the live query packet while it remains inside the declared field domain. |
| `CCC-R04` | Geometry alone transforms named celestial-frame placement into ground/model placement and alone maps receivers and directions into cache coordinates or stencils. |
| `CCC-R05` | Sources own radiometry and celestial-frame placement facts. Geometry never becomes a second brightness owner, and the cache never becomes a second source, atmosphere, geometry, spectral, or Color owner. |
| `CCC-R06` | A cache generation retains a bounded, duplicate-free layer roster. The star field is one aggregate point-set layer with a stable member table; member direction and transported irradiance remain individually addressable until exact visibility and projection complete. |
| `CCC-R07` | Point transport is queried at the exact geometry-resolved source direction before camera response spreads its irradiance. Destination response pixels never select atmosphere transport. |
| `CCC-R08` | Extended transport is queried at physical footprint directions and integrated with one angular measure. There is no center-direction transport shortcut or second coverage multiplier. |
| `CCC-R09` | Stable geometry visibility is either included in the field and fingerprinted or explicitly excluded. Renderer foreground visibility is always live and never invalidates a field. |
| `CCC-R10` | The receiver is the current view-ray origin mapped into geometry model meters, not an atmosphere march point, scene endpoint, or unconverted renderer position. |
| `CCC-R11` | Runtime initializes a separate `celestialRadiance`, adds surviving cache contributions to it, and supplies `pathRadiance + celestialRadiance` to the one Color boundary. |
| `CCC-R12` | Every supported source/geometry family declares its logical domain, physical reduction, interpolation, discontinuity policy, error bound, source capacity, and resource envelope. Unsupported pairings fail. |
| `CCC-R13` | Durable boundaries use unit-bearing packets and a fingerprinted spectral-density basis. Private hot paths may use validated canonical scalars and packed arrays. |
| `CCC-R14` | A disabled optional cache is exact additive zero. A configured but missing, stale, malformed, incompatible, or failed cache is not silently replaced by another rendering path. |
| `CCC-R15` | One attachment-owned geometry controller stages complete generations, publishes atomically, preserves the active generation on candidate failure, and disposes idempotently. |
| `CCC-R16` | CPU and GPU use equivalent geometry-provided transform and stencil operations. Storage never infers coordinates from texture dimensions. |
| `CCC-R17` | Acceptance requires CPU-oracle checks, interpolation/conservation evidence, resource and lifecycle checks, all-channel GPU parity, and a fresh applicable browser result. |
| `CCC-R18` | The first family is strictly additive and accepts no opaque celestial layer or foreground edge. Point members never occlude one another; a live scene blocker suppresses only the direct celestial contribution and never atmosphere path radiance. |
| `CCC-R19` | Static field-source definitions and evaluated placement states have separate fingerprints. A compatible placement-state change refreshes only the live query packet; a source-definition or provider-contract change rebuilds the generation. |

## Contribution Layer Model

A contribution layer is an ownership, query, publication, failure, and
composition unit. It is not a viewport image, display layer, draw-order trick,
or promise of one GPU texture.

The first generation contains:

```text
layer 0: aggregate infinite star field
layer 1: distant uniform Sun disk
foreground edges: none
```

The first layer kinds are:

| Layer kind | Stored contribution | Runtime behavior |
| --- | --- | --- |
| `infinite-point-set` | A bounded static member table and complete transported point spectral-irradiance fields; no evaluated directions. | Gets exact member directions from the live query packet, tests live scene visibility, then projects and adds all surviving members as one star-field result. |
| `distant-extended` | Complete transported directional-radiance field for the uniform Sun disk; no evaluated center direction. | Gets the current Sun center/support from the live query packet and integrates over the current footprint. |

"Stars act as one" means:

- one layer ID, direct layer contract, aggregate fingerprint, build plan, capacity,
  publication event, failure state, query result, and disposal unit;
- one canonical member order with unique stable IDs;
- one aggregate conservation report with retained per-member accounting;
- linear member addition without coverage, opacity, or star/star depth
  ordering; and
- whole-layer replacement in the first implementation.

It does not mean pre-summing different star directions. The live consumer
retains each member's exact query-packet placement alongside its cached
transported irradiance until live scene visibility, camera projection,
response, and off-raster accounting have completed.

This boundary is supported by useful read-only evidence in the closed
`poly-gc-react` stash labeled `- extra-atmosphere refresh`. Its production
`TransportedPointSourceAccumulator` implemented `accumulateMany(...)`,
retained per-source exact rays, and emitted one linearly combined point result.
The stash did not implement a persistent celestial cache: it recomputed
transport in a camera-bound CPU frame pipeline. The current design keeps the
batch and extended-integration semantics while moving the already transported
spectra into this geometry-owned cache. Its finite-body resolver remains
read-only evidence for the deferred Moon follow-up, not a first-family
contract.

## Terms And Direction Convention

The design uses these terms consistently:

- `s` is one stable celestial source identity;
- `x` is a receiver position in geometry model meters;
- `directionToSource` is a unit vector from `x` toward the point source or
  toward one physical sample on an extended source;
- photon propagation direction is `-directionToSource`;
- `lambda` identifies one channel in the canonical spectral-density basis;
- `T_atmosphere(x, directionToSource, lambda)` is direct spectral
  transmittance over the geometry-resolved source path; and
- `V_build` contains only the stable visibility declared by the cache family.

The public and cache-facing contracts do not use an ambiguous
`incomingDirection` or any `directionCamera` field. Camera matrices may
produce model-space footprint rays at render time, but camera-space directions
are not source facts or cache coordinates.

## Physical Quantities

### Point field

A point source owns top-of-atmosphere spectral irradiance density
`F_source,s` in `W m^-2 nm^-1`. The logical cached result is:

```text
E_point,s(x, lambda)
  = V_build,s(x)
    * T_atmosphere(x, directionToSource,s, lambda)
    * F_source,s(x, lambda)
```

`E_point` is complete transported spectral irradiance density in
`W m^-2 nm^-1`. A finite source may make `F_source` receiver-dependent through
a declared distance law; the first family admits only infinite sources whose
incident measure is receiver-independent.

For destination pixel `i`, runtime performs the one conversion:

```text
L_point,s,i(lambda)
  = V_live,s
    * E_point,s(x, lambda)
    * p_s,i
    / Omega_i
```

The star-field layer result is `sum_s L_point,s,i(lambda)` over its bounded
member table after exact-direction live scene visibility.

`p_s,i` is nonnegative normalized response mass and `Omega_i` is the exact
current pixel solid angle. The complete response obeys:

```text
sum(p_on_raster) + p_off_raster = 1
```

Off-raster mass is reported and never redistributed.

### Extended field

An extended source owns directional top-of-atmosphere spectral radiance
density `L_source,s` in `W m^-2 sr^-1 nm^-1`. The logical cached result is:

```text
C_extended,s(x, directionToSource, lambda)
  = V_build,s(x, directionToSource)
    * T_atmosphere(x, directionToSource, lambda)
    * L_source,s(x, directionToSource, lambda)
```

`C_extended` is complete transported spectral radiance density in
`W m^-2 sr^-1 nm^-1`. Runtime integrates it over the current pixel footprint:

```text
L_extended,s,i(lambda)
  = (1 / Omega_i) integral over pixel footprint P_i of
      V_live,s(directionToSource)
      * C_extended,s(x, directionToSource, lambda)
    dOmega
```

The integral owns angular occupancy. Runtime does not apply another disk
coverage scalar.

For the selected uniform disk:

```text
E_disk(lambda) = pi * L_source(lambda) * sin(angularRadius)^2
```

The field-source definition must make the owned quantity unambiguous. A
disk-integrated irradiance packet may be converted once into uniform
directional radiance during source normalization; both forms cannot remain
independent runtime owners.

### Composition

The cache contributes direct celestial boundary radiance only:

```text
celestialRadiance
  = aggregate star-field point radiance
    + sum(extended-layer pixel radiance)

preDisplayRadiance
  = pathRadiance
    + celestialRadiance

when an Algorithm32 path later supplies a compatible spectral endpoint:

preDisplayRadiance
  += endpointTransportedRadiance
```

The current production path has no spectral endpoint term; its captured scene
RGB remains on the established Color bridge. If an Algorithm32 path later
provides a compatible spectral endpoint, that term remains separately labeled
before this sum. Neither endpoint nor celestial radiance is folded into or
mislabeled as atmosphere path radiance. Color performs the single
spectral-to-display conversion.

## Source Definition And Placement-State Contract

Each immutable field-source definition contains:

- unique `sourceId`;
- `point` or `extended` kind;
- exactly one unit-bearing 15-channel spectral-density measure;
- spectral basis, channel order, represented bin widths, provenance,
  uncertainty status, and content fingerprint;
- a placement-provider contract naming the celestial frame, origin convention,
  permitted infinite-direction form, time scale, and provider fingerprint;
- distant angular-support definition and profile identity when applicable;
- infinite placement/depth semantics;
- separate radiometry, support/profile, and placement-provider-contract
  fingerprints; and
- one static `sourceDefinitionFingerprint`.

The definition contains no evaluated epoch, direction, model transform,
current support, or cache stencil. The current source-owned placement is a
separate immutable state:

```text
CelestialPlacementState {
  sourceId
  direction in the declared celestial frame
  frame/origin identity
  epoch and time scale
  placementStateFingerprint
}
```

A source provider may evaluate astronomy or ephemeris state at an epoch. It
does not convert that state into a camera, renderer, ground-local, model, or
cache frame. Artificial presentation placement remains separately labeled and
cannot support an astronomical placement claim.

No bare numeric spectrum, authored RGB value, apparent point size, or
camera-space direction crosses this boundary.

The geometry-owned build request groups the static field-source definitions
into immutable typed layer declarations stored in the generation:

```text
starField:
  kind: infinite-point-set
  members: [point field-source definitions in canonical sourceId order]

sun:
  kind: distant-extended
  sourceId: sun
  profile: uniform-disk

foregroundEdges: []
```

Layer membership is derived configuration, not a second source identity. The
first-family contract permits only additive composition and no opaque
blocker or foreground edge. The star-field fingerprint covers its complete
ordered member set, while every member retains its own source-definition and
radiometry fingerprints. A live query packet must carry exactly one compatible
placement state for each active source definition.

## Geometry Transform And Query Contract

Geometry provides the cache because it owns the receiver domain, ground
geography, body-fixed frame, and relationship between celestial placement and
the active model. Time is an input to the transform, not cache-owned state:
the source/state provider owns celestial state at a declared epoch, while
geometry owns body-fixed orientation and localization of that state.

Every supporting geometry provides equivalent CPU and shader operations with
these semantics:

```text
celestialContributionDomain
  -> typed bounded domain, frame, transform, visibility, and direct family identity

resolveCelestialSourcePlacement(
  sourceDefinition,
  placementState,
  observationState,
  receiver
)
  -> model-frame directionToSource, infinite depth,
     distant extended support, and transform fingerprint

resolveCelestialBuildSample(fieldCoordinate, sourceRecord)
  -> model receiver, directionToSource, atmosphere path,
     stable visibility classification

resolveCelestialReceiverStencil(receiver)
  -> valid/invalid classification plus physical node indices and weights

resolveCelestialDirectionStencil(receiver, directionToSource)
  -> visible/blocked/out-of-domain classification plus physical node
     indices and weights

prepareCelestialContributionQuery(
  generationIdentity,
  placementStates,
  observationState,
  receiver
)
  -> one generation-compatible live query packet

createCelestialContributionCacheController(backend, scheduler)
  -> one attachment-owned controller retaining this geometry
```

Concrete method names may follow repository conventions during 12.0, but
these operations and owners are required. A geometry implementation may
provide a fused receiver-and-direction stencil where its physical reduction
requires one.

A geometry-resolved placement packet is typed:

```text
sourceId
sourceKind
sourceDefinitionFingerprint
placementStateFingerprint
receiverPositionModelMeters
directionToSourceModel
depth: infinite
distant angular support, when applicable
transformFingerprint
```

A geometry-resolved build sample is also typed:

```text
receiverPositionModelMeters
directionToSourceModel
atmospherePath
stableVisibility:
  clear | ground-horizon
```

Cache storage receives only geometry-produced node coordinates, indices,
weights, and classifications. It does not normalize a world position, derive
an up vector, reconstruct latitude, inspect texture dimensions, or repeat a
celestial transform.

## Generation And Live Query Packet

### Immutable transported-field generation

One generation contains:

- an immutable direct generation identity and typed contract;
- a stable, duplicate-free ordered layer table;
- a bounded member table for every point-set layer;
- separate point and extended logical payload families;
- CPU logical values or their validated retained build artifact;
- final packed GPU payload declarations and resources when applicable;
- geometry-owned static query-domain metadata;
- checksums, byte counts, capability results, and build diagnostics; and
- one generation identity.

Source IDs are canonicalized into stable dense indices separately for point
and extended entries. Source selection is discrete and never interpolated.
The baseline design stores a complete transported 15-channel vector per
source and field node. A point-set layer is aggregated as one query,
publication, and composition result only after its members retain enough
identity and placement to resolve exact visibility and projection. The cache
does not expose a transmittance factor for Algorithm32 to combine with source
spectra.

A later internal factorization is admissible only after it proves that the
cache-owned query reconstructs the same complete `E_point` or `C_extended`
within a declared bound. Such a factorization remains private to the cache;
the caller still receives a transported quantity.

The logical object shape is:

```text
CelestialContributionCacheGeneration {
  cacheKind
  familyId
  generationId
  direct identity and fingerprints

  layers: [
    PointSetContributionLayer {
      layerId
      fixedCapacity
      members: [
        PointSetMember {
          memberId
          sourceIndex
          pointFieldIndex
          source-definition/radiometry fingerprints
        }
      ]
      aggregationPolicy: additive
    }

    ExtendedContributionLayer {
      layerId
      sourceIndex
      extendedFieldIndex
      compositionPolicy: additive
    }
  ]

  pointFields[pointFieldIndex]
    -> TransportedIrradianceField15

  extendedFields[extendedFieldIndex]
    -> TransportedRadianceField15

  representation
  retained/packed resources
  validation and resource diagnostics
}
```

Layer entries and field references are immutable and internally
generation-scoped. There is no externally writable member array, no
independently publishable roster object, and no path for a consumer to mix
fields from different generations.

### Live geometry query packet

Geometry derives a small immutable query packet from:

- the active generation identity and typed contract;
- current receiver model position and geographic observation state;
- current epoch/body orientation;
- current evaluated celestial-frame placement states; and
- the selected live visibility contract.

It references the generation's immutable ordered layer roster and contains
the current geometry-resolved placement and source index for each entry,
distant Sun support, and enough geometry state to produce field stencils. It
contains no transported spectral payload and cannot redefine layer membership
or composition policy.

Its logical shape is:

```text
CelestialContributionQueryPacket {
  generationId
  runtimeCompatibilityFingerprint
  queryStateFingerprint
  receiverPositionModelMeters
  observationTransformFingerprint
  receiverStencilState

  layerQueries: [
    starField {
      members: [
        {
          memberId
          sourceIndex
          placementStateFingerprint
          directionToSourceModel
        }
      ]
    }

    sun {
      sourceIndex
      placementStateFingerprint
      directionToCenterModel
      angularSupport
    }
  ]
}
```

Point-member stencils may be derived eagerly from this packet because the first
member set is bounded. Extended footprint stencils are derived at the selected
physical quadrature directions. Both routes call geometry semantics rather
than inferring texture coordinates.

For `spherical-sun-stars-radial-v1`, placement and geographic rotation are query
dependencies, not transported-field dependencies. Changing epoch, longitude,
latitude, or body orientation refreshes this packet but reuses the generation
while:

- source identities, kinds, and radiometry remain unchanged;
- point members remain infinite and the Sun remains within the supported
  distant uniform-disk contract;
- the same radial atmosphere and spherical geometry family apply; and
- the receiver remains within the declared altitude domain.

Current star and Sun directions are therefore live geometry state in the
selected family; radiometry and the Sun support/profile kind remain
field/compatibility dependencies. Other finite or asymmetric families may
classify placement as a field dependency and rebuild. Every family must
declare this choice; it is never inferred.

## Direct Contracts And Identity

The generation's direct typed contract and identity inputs have these required
sections:

| Section | Required contents |
| --- | --- |
| Identity | Cache kind, schema version, builder version, generation id, creation state, and deterministic payload checksums. |
| Physical-field dependencies | Ordered static source-definition identity, including kind, radiometry, support/profile, and placement-provider-contract identities; atmosphere transport identity; geometry family/domain identity; stable-visibility identity; spectral-basis identity; and numerical-policy identity. Evaluated placement states are excluded only for a family that declares placement-invariant fields. |
| Layers | Stable layer IDs/kinds/order, additive composition policy, empty foreground-edge set, point-member capacities, canonical member order, and layer replacement granularity. |
| Representation | Representation version, axes and nodes, interpolation, boundary policy, precision, channel packing, texture/resource layout, source capacity, and representation fingerprint. |
| Domain | Model frame, receiver semantics, bounded ranges, node locations, transform version, horizon policy, top-atmosphere policy, and out-of-domain behavior. |
| Sources | Stable source ids and dense indices, kind, units, separate radiometry/support/placement-provider-contract fingerprints, infinite-direction placement form, distant support/profile contract, static source-definition fingerprint, and payload reference. No evaluated placement-state fingerprint is stored here. |
| Spectral | Basis fingerprint, density semantics, channel centers/bounds/widths, channel order, channel count, and packing groups. |
| Runtime compatibility | Query-contract version, geometry-shader contract version, visibility policy, supported raster contract, and required shader features. |
| Resources | Logical sample counts, typed-array ownership, GPU dimensions/formats, byte counts, retained/packed/peak/resident categories, and backend capability identity. |
| Provenance | Builder inputs and evidence references sufficient to audit derivation without duplicating canonical source data. |

Identity is split so invalidation is explicit:

```text
physicalFieldFingerprint
representationFingerprint
runtimeCompatibilityFingerprint
generationId
```

The live query packet has a separate `queryStateFingerprint`. For the first
family, evaluated placement-state fingerprints, epoch, geographic receiver
state, the geometry-mapped physical receiver origin, and current direction
affect the query packet but not `physicalFieldFingerprint`.

## Selected First Physical Family

### Capability envelope

`spherical-sun-stars-radial-v1` supports only:

- one concentric spherical ground body;
- one concentric top-atmosphere boundary;
- radially symmetric atmosphere state;
- one bounded aggregate layer of infinite point members with
  receiver-independent incident irradiance;
- one distant uniform Sun disk with receiver-independent radiance and angular
  radius;
- additive composition with no celestial foreground edges or opaque celestial
  policy;
- analytic ground/horizon build visibility; and
- receiver altitudes inside a declared closed interval.

The first acceptance roster contains a multi-member point fixture with at
least two distinct directions and one distant uniform Sun-disk fixture. The
direct family contract declares a fixed point-member bound that qualification
must accept
against resource and frame-time budgets. Passing this family does not
establish a catalog-scale star field.

Every finite celestial placement, Moon source, opaque celestial layer,
nonempty foreground graph, finite point source, parallax-sensitive field axis,
distance falloff, asymmetric terrain, textured or spectrally varying disk
profile, and nonspherical atmosphere state is rejected by this family.

### Logical and physical coordinates

For ground radius `R`, receiver `x`, local up `n`, and
`directionToSource`:

```text
h  = length(x) - R
n  = normalize(x)
mu = dot(n, directionToSource)
```

Geometry analytically computes the ground-horizon threshold
`muHorizon(h)`. Directions below it are classified `ground-horizon` and
return exact zero before storage lookup.

Visible directions use a horizon-normalized coordinate:

```text
u = (mu - muHorizon(h)) / (1 - muHorizon(h))
```

`u = 0` is the geometric horizon and `u = 1` is local zenith. The physical
field axes are `(h, u)`, with geometry-owned node arrays and mapping. A
qualified nonuniform node distribution may concentrate samples near the
horizon without changing the logical query.

The logical transported fields are:

```text
starField[memberIndex, h, u, wavelength]
extended[layerIndex, h, u, wavelength]
```

Wavelength is payload structure, not a spatial texture coordinate. Source
and layer selection is discrete. Receiver longitude, latitude, azimuth, epoch,
camera orientation, FOV, and viewport are not physical field axes. They
influence the geometry-resolved `directionToSource`, which changes `mu` and
therefore the queried `u`.

The source path terminates at the physical top-atmosphere sphere. An
observer-centered render safety dome is not a celestial transport boundary.

### Interpolation and discontinuities

Geometry supplies bracketing `(h, u)` node indices and weights. Cache lookup
uses explicit bilinear reconstruction so CPU and GPU execute the same stencil.
The cache does not use nearest lookup, extrapolation, or semantic
clamp-to-edge.

The exact query is classified before interpolation:

- below-ground/horizon, unsupported source, and outside angular support
  produce typed exact zero;
- out-of-domain receiver or coordinate produces a query failure and zero
  contribution with a bounded diagnostic;
- source selection never blends;
- angular support is evaluated against the live geometry-resolved disk center
  before the cache-owned extended query returns a contribution; and
- no valid stencil crosses a declared horizon, support, domain, or coordinate
  seam.

Node locations, resolution, and accepted binary64/float32 error bounds are
qualification outputs. They must be recorded in the direct representation
contract before the family is accepted.

### Initial packing direction

The CPU oracle computes each logical node in binary64 and retains values as
separate point or extended arrays in canonical channel order.

The initial GPU qualification target is:

- separate point and extended scalar `sampler2DArray` resources;
- texture axes `(u, h)`;
- one `R32F` array layer for each native spectral channel, therefore fifteen
  layers for the accepted basis and no pad lane;
- cache-render shader passes that consume source radiometry and
  geometry/atmosphere build inputs to construct each transported layer;
- nearest texel fetch with explicit geometry-provided bilinear weights; and
- complete contribution layers installed as one generation atomically.

The backend must qualify texture dimensions, array-layer capacity, format,
precision, render-build cost, and resident bytes. Failure to qualify this target
stops the family; it does not authorize an unmeasured format fallback. An
alternative representation requires a new representation fingerprint and the
same logical parity evidence.

## Cache-Owned Logical Queries

The public semantics are:

```text
samplePointSet(layerId, geometryQuery)
  -> bounded ordered records {
       memberId,
       transported spectral irradiance packet,
       geometryPlacementIndex
     } | typed zero/failure

sampleExtended(layerId, geometryQuery, directionToSource)
  -> transported spectral radiance packet | typed zero/failure
```

`geometryQuery` is compatible only with the generation for which geometry
prepared it. The cache validates the generation, static source definition,
layer/member, kind, basis, and query-contract fingerprints, plus the query
packet's placement-state/provider-contract and geometry-transform
compatibility, before sampling.

The point result does not carry or duplicate a placement object.
`geometryPlacementIndex` refers to the typed placement already owned by the
compatible live query packet. This avoids storing a stale model direction in
a transport generation and keeps placement-only updates cheap.

GPU code follows the same split:

```text
geometry contribution:
  resolve current layer/member placement
  classify horizon/domain/support
  resolve celestial cache stencil

cache contribution:
  fetch/batch point-set irradiance
  fetch extended radiance
  reconstruct the complete 15-channel transported result
```

Algorithm32 and raster code do not reproduce geometry formulas.

The corresponding construction path is separate from this live lookup path:
the source extension exposes only declared radiometry and cache-build shader
inputs/modules; geometry assembles its field coordinates and atmosphere paths
into direct cache-render pass declarations; and the cache executor renders the staged
`R32F` layers. The live shader reads only the published bindings and
geometry-provided indices/weights; it neither reruns construction nor derives
coordinates from texture dimensions.

## Construction

Cache construction is asynchronous and occurs during awaited setup or awaited
configuration replacement, never in a render frame.

The geometry-owned controller performs:

1. Capture immutable layer, static source-definition, atmosphere,
   geometry-domain, visibility, spectral, numerical, representation, and
   backend contracts plus their directly consumed identities.
2. Validate layer/member IDs, kinds, units, basis, placement-provider
   contracts/forms, radiometry, the required empty foreground-edge set,
   additive composition, point-set capacity, family pairing, domain coverage,
   and backend capability.
3. Canonicalize layer order and point members by stable ID, then derive the
   complete build plan and fingerprints.
4. Traverse the geometry-owned `(h, u)` node domain for every supported
   member/layer field.
5. Ask geometry to resolve each build receiver, sourceward ray, atmosphere
   path, and stable visibility classification.
6. Ask the atmosphere owner for channel-wise transmittance over that exact
   geometry-resolved path.
7. Multiply the source-owned spectral measure by transport once, producing
   complete point irradiance or extended radiance. Do not apply response,
   pixel solid angle, exposure, Color, or live scene visibility.
8. Validate finiteness, nonnegativity, unit/basis identity, exact-zero
   classifications, spectral channel count, horizon behavior, conservation
   identities, layer-roster invariants, and interpolation error against direct
   binary64 probes.
9. Pack the final resources directly where practical; compute checksums,
   byte counts, resource categories, and provenance.
10. Return one complete immutable candidate and publish it only after every
    member/layer payload and the aggregate layer declaration pass validation.

The atmosphere owner remains the only owner of transport physics. Geometry
resolves the path; the cache builder orchestrates and multiplies typed
quantities; neither independently reimplements Beer-Lambert transport.

Point members may be built or packed independently for throughput, but the
star field has no partially active state. Its member table, payloads, and
aggregate diagnostics publish together.

## Runtime Query And Composition

For each frame:

1. Geometry prepares or reuses the live query packet for the active receiver,
   observation state, evaluated placement states, and cache generation.
2. The raster runtime reconstructs current model-space pixel corner rays and
   exact pixel solid angles.
3. Algorithm32 evaluates its ordinary atmosphere path and endpoint terms.
4. Runtime initializes `celestialRadiance` to spectral zero.
5. The point consumer queries the aggregate star-field layer, applies live
   scene visibility at each exact source direction, and combines surviving
   responses.
6. The extended consumer integrates the distant uniform Sun disk with matched
   footprint visibility samples.
7. Algorithm32 adds both compatible contributions to `celestialRadiance`.
8. Color receives the one compatible pre-display spectral sum.

### Aggregate point-set consumer

For each member of the one star-field layer:

1. Use geometry's exact model-frame `directionToSource`.
2. Use geometry's field stencil to query transported irradiance once.
3. Resolve live renderer visibility at the same exact source direction.
4. Project a surviving source through the current camera.
5. Evaluate the selected normalized response and exact per-pixel solid angle.
6. Retain on-raster and off-raster response mass without edge
   renormalization.
7. Add `E_point * p / Omega` to affected pixels.

After every member is evaluated, combine overlapping destination pixels
channel-wise and publish one star-field result containing the aggregate
on-frame/off-frame conservation equation plus per-member diagnostics.

The first GPU point response is deliberately the exact spherical-pixel
ownership kernel: reconstruct the four uncropped corner rays, assign `p = 1`
only to the footprint containing the source direction, and assign `p = 0`
elsewhere. The footprint solid angle is the sum of its two exact spherical
triangle solid angles. Thus a visible point contributes `E / Omega_pixel`
exactly once; no response is renormalized at an edge or outside the frame.
Scene-hit visibility is sampled from that same footprint before this response.
Immutable run `000152-pre-g9-stellar-live-raster-proof` accepts this consumer
over the complete real 500-member tiled field through the normal runtime; its
centered clear-minus-blocked spectral response is `1.0093856417370262e-8`,
while the opposite off-frame camera difference is
`1.4499512701604544e-13`.

The destination response pixel's center ray and depth are not substitutes for
the exact source-direction visibility or cache query. A live scene blocker at
the exact star direction suppresses the source before response spreading;
depth under a later response pixel does not retroactively change source
visibility.

### Extended consumer

For the Sun contribution layer:

1. Use geometry's current model-frame disk center and angular support.
2. Select footprint quadrature directions and solid-angle weights from the
   current pixel corner rays.
3. Test source support and live visibility at each selected physical
   direction.
4. Ask geometry for that direction's field stencil.
5. Query complete transported radiance and integrate it once using the
   declared solid-angle weights.
6. Divide the accumulated pixel flux by the exact pixel solid angle and add
   the resulting radiance.

The first cache family owns a uniform source profile. A later profile family
must specify whether profile evaluation is part of cache-owned reconstruction
or expands the stored field. The caller never invents an unversioned profile
factor.

## Visibility Split

Visibility is divided deliberately:

| Visibility fact | First-family owner and behavior |
| --- | --- |
| Spherical ground/horizon escape | Geometry classifies it during build/query; it is part of `V_build` and the field/domain fingerprint. |
| Physical top-atmosphere boundary | Geometry supplies the source path termination. It is not a renderer dome or a live scene object. |
| Asymmetric terrain or stable body blocker | Unsupported by the first family. A later family must add dimensions or a proved representation and fingerprint it. |
| Ordinary renderer scene depth/hits | Live raster input. It never enters field identity. |
| Point exact-source foreground visibility | Live query at the projected exact source direction, before response spreading. |
| Extended foreground visibility | Live at matched footprint samples or a separately bounded conservative policy. |
| Celestial mutual occlusion/eclipses | Unsupported. The first family accepts no finite celestial placement, opaque layer, or foreground edge. |

Live scene visibility suppresses only the direct celestial contribution behind
the blocker. It does not erase atmosphere path radiance accumulated in front
of that blocker. Point emitters never enter a celestial blocker table and
never occlude one another.

The cache consumer depends on a renderer-neutral live visibility operation:

```text
resolveLiveCelestialVisibility(directionToSourceModel)
  -> visible | blocked with blocker/depth diagnostics
```

How a renderer supplies that result may be a projected depth lookup, a
source-sized visibility pass, an analytic scene query, or a qualified
equivalent. The result semantics are fixed even though the renderer mechanism
is selected during its implementation stage.

## Controller, Publication, And Disposal

Each renderer/runtime attachment obtains one controller from the active
geometry:

```text
geometry.createCelestialContributionCacheController({
  backend,
  scheduler
})
```

The controller retains the geometry and exposes these semantics:

```text
active

createCelestialContributionCache({
  layers,
  atmosphere,
  spectralBasis,
  visibilityPolicy,
  numericalPolicy,
  representationPolicy,
  signal
})
  -> complete generation

dispose()
```

It follows the proven light-source controller lifecycle shape:

- derive a deterministic build plan before allocation;
- reuse an exactly compatible active generation;
- serialize staging for one attachment;
- allow a newer request to supersede/cancel an older candidate;
- publish only after every resource in the aggregate generation is complete;
- dispose a failed or superseded candidate without disturbing the active
  generation;
- replace the active generation atomically, then dispose the old generation;
- preserve the active generation when awaited replacement fails;
- make controller and generation disposal idempotent; and
- never dispose the externally owned backend.

Algorithm32 setup coordinates the controller but does not become the cache or
transform owner. Scattering-cache and celestial-cache controller/result slots,
direct identities, provider declarations, shader symbols, bindings, and
disposal remain distinct.

The first implementation replaces whole generations. Per-layer or per-member
subresource replacement is a later optimization and must preserve aggregate
atomic publication. In particular, a star-field member update cannot expose a
mixed old/new member table.

## Invalidation And Reuse

| Change | First-family field action | Live/resource action |
| --- | --- | --- |
| Layer ID/kind/order/additive composition policy, star member roster, static source ID/kind/spectrum, placement-provider frame/origin/time-scale contract, Sun support policy, or uniform-radiance value | Rebuild whole generation. | Replace the roster, source-definition/member tables, payloads, and bindings atomically. |
| Compatible evaluated infinite-star or Sun direction, epoch, body rotation, geographic longitude/latitude, or other placement-state value | Reuse field while the declared family invariants hold. | Geometry validates the provider contract and refreshes the live query packet. |
| A source becomes finite, a Moon or opaque layer is introduced, a foreground edge is requested, the Sun disk becomes profiled, or another source leaves the family envelope | Reject pairing; no reuse. | Await an explicitly supported family/configuration. |
| Atmosphere optical state, radial profile, ground/top radius, or source-path transport policy | Rebuild. | Replace generation. |
| Geometry family, model frame, receiver domain, transform/stencil version, horizon policy, or stable build visibility | Rebuild. | Replace geometry contribution and generation. |
| Geometry-mapped physical receiver origin moves within the declared altitude domain | Reuse. | Refresh receiver/query stencils. |
| Receiver leaves the declared domain | Do not rebuild inside the frame. | Contribute zero with a bounded diagnostic until awaited replacement succeeds. |
| Spectral basis, channel order, or density semantics | Rebuild. | Replace field and shader compatibility state. |
| Node layout, interpolation, precision, packing, or representation version | Repack only from retained compatible validated logical values when explicitly supported; otherwise rebuild. | Replace resources and the direct representation contract. |
| Camera rotation, projection, FOV, viewport, pixel ratio, or resize | Reuse. | Refresh rays, footprints, response, solid angle, and query state as needed. |
| Foreground scene geometry, depth, or hit state | Reuse. | Use current live visibility. |
| Point-response or extended quadrature policy | Reuse transported fields. | Update raster policy/material and runtime compatibility state. |
| Color, exposure, tone mapping, or display state | Reuse. | Color-owned update only. |
| GPU context restoration with valid retained payloads | No physics rebuild. | Recreate and atomically rebind GPU resources. |

If a future family makes placement part of field construction, its
physical-field identity contract must include the relevant evaluated
placement-state fingerprint among its physical-field dependencies and the
matrix for that family must require a rebuild.

## Failure Policy

Setup, build, or awaited replacement fails loudly for:

- duplicate or missing layer/member/source IDs;
- any nonempty foreground-edge graph, opaque celestial policy, finite
  celestial placement, or point-set capacity overflow;
- source kind/measure/unit/basis mismatch;
- missing placement state or a placement-state source/frame/form/time-scale
  mismatch with its static source definition/provider contract;
- camera-space or unnamed-frame placement at a durable boundary;
- unsupported source/geometry family pairing;
- invalid epoch, time scale, transform, frame, direction, or angular support;
- incomplete receiver/domain coverage;
- non-finite or prohibited negative values;
- malformed node arrays, stencils, payload lengths, scalar layer counts, checksums, or
  fingerprints;
- an interpolation stencil crossing a classified discontinuity;
- unqualified texture counts, dimensions, format, precision, or capacity;
- stale generation/query compatibility;
- configured but missing cache state; or
- duplicate transmittance, response, support, or angular-coverage application.

An intentionally disabled cache contributes exact spectral zero. That is not
a fallback for a configured failure.

A failed or superseded candidate preserves the last committed generation.
After setup, a live invalid/out-of-domain query contributes zero for the
affected celestial term and emits a bounded diagnostic. It never clamps,
extrapolates, samples stale state, rebuilds inside the frame, or falls back to
authored RGB stars, legacy effects, incident-radiance caches, or imported
experiment code.

## CPU/GPU And Qualification Contract

The CPU lane is the readable deterministic oracle for:

- unit and basis enforcement;
- geometry transform and stencil values;
- direct transport at exact nodes and independent probes;
- interpolation error;
- point flux conservation;
- extended angular integration;
- exact-zero classifications;
- lifecycle fingerprints; and
- pre-display spectral composition.

The GPU lane implements the same geometry operations, node selection, explicit
interpolation, source-kind split, channel packing, and component ordering. Its
construction route is cache-render shader passes: source extensions contribute
radiometry/build modules, geometry assembles coordinates and atmosphere paths,
and the candidate's copied production atmosphere shader operations generate
the transported `R32F` layers through the existing executor/backend. It
neither imports the live production tree nor uploads an unrelated CPU
atmosphere frame as a substitute. Fresh production qualification repeats this
gate after promotion.

Before `spherical-sun-stars-radial-v1` is accepted, a qualification report must
record:

1. exact layer roster, star member roster, and fixed member/resource
   capacities;
2. altitude and horizon-coordinate bounds and node locations;
3. interpolation and boundary policy;
4. maximum and representative all-channel error against direct binary64
   probes, including near-horizon cases;
5. clear and live-scene-blocked exact-star cases, full/partial/empty and
   horizon-crossing Sun support, and path-radiance-preservation outcomes;
6. CPU build time, retained bytes, packed bytes, and peak memory;
7. GPU resource count, dimensions, layers, formats, resident bytes,
   render-build time, and backend capability limits;
8. shader fetch count, star-set traversal/acceleration, and representative
   frame cost;
9. placement-only query refresh cost and proof that it does not rebuild;
10. aggregate and per-member point conservation plus Sun-disk conservation
    across camera/FOV/resolution changes;
11. staged publication, failure, supersession, restoration, context restore,
    and disposal outcomes; and
12. all-channel CPU/GPU parity with the exact accepted tolerances.

Numerical node counts, tolerances, resource ceilings, and performance budgets
are deliberately not invented in this design document. Stage 12 qualification
must predeclare them, measure them, and either accept the family or stop. A
viewport-sized final-frame texture or generic five-dimensional tensor is not
an admissible substitute.

## Capability Follow-Ups

The following require their own family design and qualification:

- finite point sources, including distance law and parallax;
- every Moon contribution, including finite shape, observer-specific
  orientation, body-fixed texture/BRDF, spectral Sun lighting, atmospheric
  transport factorization, depth/opacity, and Moon-over-star visibility, as
  recorded in the [resolved-Moon follow-up](moon-follow-up.md);
- all celestial mutual ordering and occultation;
- distant and finite sources over flat geometry;
- treatment of any flat observer-centered safety dome;
- wavelength-dependent or spatially varying extended profiles;
- asymmetric terrain/body visibility;
- catalog-scale point-source capacity, batching, acceleration, or proved
  source/spectral factorization;
- planets and diffuse celestial fields; and
- celestial illumination of the terrestrial atmosphere, ground, or scene.

These are not hidden implementation details. They change axes, payload
capacity, visibility, or physical ownership and therefore must not be admitted
through a generalized fallback.

## Relationship To The Closed External Work

The read-only `C:\dev\poly-gc-react` stash labeled
`- extra-atmosphere refresh` and its experiments established useful physical
contracts for point/extended quantities, exact pixel solid angle, point
conservation, per-direction extended integration, finite-body depth,
multi-point aggregation, and one pre-Color spectral addition. They did not
implement a persistent camera-independent cache:

- source adapters retained camera-space `directionCamera` state and embedded
  celestial-to-camera matrices;
- visibility combined globe, scene, and celestial blockers in camera space;
- `TransportedPointSourceAccumulator.accumulateMany(...)` transported each
  star and then emitted one additive batch while retaining exact rays,
  per-member diagnostics, and contributing IDs;
- the exact-direction resolver's finite-body behavior is evidence for the
  deferred Moon follow-up, not a first-family implementation contract;
- the stash's separate atmospheric incident-radiance caches demonstrate
  candidate mechanics for geometry-derived build rays, now-rejected four-RGBA
  spectral packing, shader binding, and cleanup, but use the wrong ownership
  and lack the aggregate generation/invalidation contract required here;
- the production frame evaluator recomputed transport for camera pixels and
  source directions and explicitly described the accepted slice as
  `no-cache`; and
- no camera-independent receiver domain, interpolation policy, immutable
  generation identity, controller, or invalidation lifecycle was accepted.

The external cache design supplied useful candidate questions, direct identity
and declaration sections, coordinate reductions, lifecycle cases, and resource
gates. This
implementation specializes it in five supporting ways. These delimit
ownership and the first capability family; the defining pipeline distinction
remains the cache's use and the live raster's transported
spectral-radiance result:

1. geometry, not a generic builder or source, provides the controller and owns
   every celestial/ground/model/cache transform;
2. live geography/placement is a separate query packet rather than an
   unconditional transported-field rebuild dependency;
3. the first field family is explicitly a two-layer additive
   spherical/radial family rather than a generic source/geometry tensor;
4. the Sun is one distant uniform extended layer and the stars are one bounded
   point-set layer with retained member records; and
5. the complete Moon, flat geometry, celestial mutual ordering, and
   catalog-scale star fields are separate capability designs rather than
   unresolved variants inside the first cache.

No external-stash implementation file, prior-experiment runtime module,
fixture artifact, or rolled-back production patch is an implementation
dependency or acceptance oracle. The direct production copy is identified
starting code, not an oracle; independent transport and conservation controls
still decide the candidate.

## Observable Design Closure

Stage 12.0 closed only after its implementation record confirmed:

- the sealed production-snapshot identity, exact baseline/candidate equality,
  runtime/proof-runner dependency closure, containment controls,
  protected-production before/after equality, and eventual `src/algorithm32`
  module map;
- the semantic geometry/controller/query ownership and packet boundaries
  above, without claiming that field realization or lifecycle code exists;
- the live-state ingress and shared visible/atmospheric Sun identity route;
- the exact multi-star and distant uniform Sun-disk static field-source
  definitions and evaluated placement-state fixtures;
- the first-family domain and top-atmosphere policy;
- the two-layer additive roster and required empty foreground-edge graph;
- a contract-only representation marker, a provisional bounded point-member
  capacity through the CPU consumer goal, and the G6 deadline for selecting a
  GPU vector-resource route;
- the renderer-neutral invariants that camera state is live-only, pixel
  corners are ordered, response is normalized, and pixel solid angle is exact,
  plus G5 deadlines for the concrete raster, response, quadrature, and
  visibility policies; and
- explicit owner goals and deadlines for field realization, transport
  tolerances, GPU representation, browser consumption, hardware budgets, and
  final public names.

At that point 12.0 concluded with one reproducible immutable self-verifying
source-definition, placement-state, named-transform, identity, layer-roster,
containment, and failure-contract proof run, plus the decision manifest that
froze or scheduled later assembly and quantity-route proofs. It made no
claim that stencils, transported fields, cache lifecycle, rasterization, or
GPU execution already exist. Flat geometry, the complete resolved Moon,
celestial mutual ordering, and catalog-scale star-field capacity remain
explicit later designs rather than unresolved ambiguity inside the first
cache.
