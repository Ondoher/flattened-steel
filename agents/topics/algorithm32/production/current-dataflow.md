# Algorithm32 Current Dataflow

Historical links into non-retained `scripts/algorithm32-star/...` files or
runs are archive-internal and resolve through the
[Algorithm32-Star evidence index](../archive/algorithm32-star/README.md).

Status: current production behavior and implementation seams.

Solar-zenith adoption is complete through PA7. The owner-selected deployment
catalog/packaging and obsolete GPU-runtime cleanup are implemented, and the
complete Algorithm32 WebGL lane passes `23/23` against the mandatory exact
scene-cache contract.
Shared CPU and shader transport now pass physical position, atmosphere coordinate, and physical outgoing
direction to the concrete cache. The spherical/distant and Flat/local caches
resolve their own concrete stencils through the active geometry. Distant
runtime cache creation requires the exact selected manifest-backed point-local
asset and integrates it with Q30; Flat/local remains on its existing concrete
cache. No receiver-column/point-local runtime switch exists. The former
receiver-column GPU cache/controller are removed; the CPU recurrence remains a
reference and offline-construction surface.

This document describes the production dataflow that exists now. The
[production plan](production-implementation-plan.md) owns delivery stages;
the [cache design](../cache/README.md) owns selected numerical controls; and
the repository-level references and official experiments own evidence.

## Production Boundary

- `src/algorithm32` is the sole production implementation and declares no
  runtime dependency on the former source repository or the Algorithm32-star
  research tree. The final mechanical import audit confirms this boundary.
- Physical quantities cross durable boundaries with their units as data.
  Spectral packets identify quantity, units, native-15 basis, bin semantics,
  and provenance. Raw arrays remain internal to numerical kernels, packed
  cache data, resident cache storage, and fixed shader representations.
- The atmosphere owns medium coefficients, density profiles, phase functions,
  extinction, and Beer-Lambert transmittance. Spherical and flat geometry each
  own their physical cache positions, atmosphere and ground bounds,
  source-relative direction frames, construction lookup, and final-view
  physical stencils. The distant and local-Sun sources each own their
  radiometry and state, primary fields, concrete layouts, requested-order
  plans, cache controller, and publication lifecycle. The CPU source adapter accepts the
  canonical omitted boundary or an explicit profile-backed Lambertian BRDF,
  and GPU construction accepts the same choices through canonical-black and
  reflective boundary contributions. Generic cache operations own later-order
  scatter, stored-field transport, copy, and addition. The
  [ground topic](../ground/README.md) owns the exact reflective ownership and
  order dependencies.
- Executable domain owners expose the direct IDs, nodes, vectors, weights,
  frames, and stencil behavior used by construction and sampling. CPU packing
  owners and direct GPU `CacheFieldStorage` values supply field extents,
  packed-data shapes, indexing, allocation, and shader addressing. Physical
  spectral and sampled-field provenance identities stay with the consumers
  that compare them.
- Atmospheric path radiance remains spectral through its retained E8
  projection. The ordinary Three scene is captured in renderer-linear sRGB
  before the atmosphere pass. At the single display boundary, the composition
  owner projects spectral transmittance into the retained red, green, and blue
  display bands selected during the historical comparison work, attenuates the
  captured scene color, combines it with projected path linear sRGB, and
  performs final display encoding. Scene RGB is not an atmospheric transport
  quantity.

## Spherical/Distant CPU Oracle And Resident Sampling

The source-owned binary64 CPU oracle supports requested maximum scattering
orders 1, 2, and 4, with 4 as the default. It evaluates primary `J1` over
Native-48 x W27 x native-15, direct-primary `L1` over Native-48 x
Fibonacci-34 x native-15, generic `L(k - 1) -> Jk` scattering, and generic
stored-field `Jk -> Lk` transport beginning at `J2 -> L2`. Direct-primary
`L1` is not reconstructed by transporting stored `J1`.

Only pure fields feed recurrence. Cumulative fields are produced by separate
addition and never feed scatter or transport. N2 constructs no `L2`; N4
constructs no `L4`; and the supported request set has no standalone N3 mode.
The native production profile, rather than the paper-comparison profile, is
the default. Its default physical profile contains no ground albedo. An
explicit profile may own a typed albedo packet and supply the matching uniform
Lambertian boundary to the CPU recurrence.

Ground leaves `J1` unchanged. For reflective construction, `J2` adds direct
source illumination with source-to-hit and hit-to-sample transmittance and the
incidence cosine. `J3` illuminates ground only from pure `L1`, and `J4` only
from pure `L2`, using geometry-owned hits and retained construction-position
lookup.
Cumulative fields never illuminate ground. Omitted ground bypasses the
contributor and preserves the prior field identities exactly; explicit zero
BRDF is numerically identical but has distinct boundary/cache identity.

Before Algorithm32-Star retirement, Stage 8 used a sealed, reader-verified
parity data set containing omitted, nonzero reflective, and explicit-zero
spherical/distant gold. The
[historical Star parity data-set contract](star-parity-data-set.md) preserves
that artifact's exact manifest and payload hashes, inventory, comparison
policies, and former claim boundary. The retired data set is historical
evidence only: it is not a current regression oracle or executable authority.

The reflective CPU implementation contains the previously accepted Stage 8.2
behavior. A zero-length return path produces exact unit transmittance,
higher-order ground illumination uses the retained construction lookup, and
the pre-retirement reduced-domain binary64 report passed without failures or
coverage gaps for the production sources it recorded. That report is
historical and does not authorize a rerun against retired gold. Any renewed
acceptance or CPU-oracle claim must select and pass a new isolated independent
authority under the
[production architecture boundary](architecture-boundaries.md#algorithm-source-promotion-and-conformance).
The [historical Star parity data-set contract](../archive/algorithm32-star/production/star-parity-data-set.md#completed-stage-8-comparisons)
preserves the exact former report and coverage.

The CPU build result retains pure `J` and `L` fields plus its cumulative field
for diagnostics and CPU/GPU comparison. `DistantSunCpuCache` consumes a
completed result, retains only the cumulative reader and its direct physical
sample-provenance identity, and samples all 15 channels by combining
geometry-resolved actual-neighbor Native-48 altitude weights with the complete
W27 direction stencil. It is a deterministic oracle and synchronous sampling
surface, not a second production GPU-cache strategy or an active-cache
publication owner.

## Executable GPU Construction

The distant source emits one typed staging plan for the requested maximum.
The exact produced fields, in pass order, are:

| Request | Produced fields                                                                 | Retained staging result |
| ------- | ------------------------------------------------------------------------------- | ----------------------- |
| N1      | `J1`, `Jthrough1`                                                               | `Jthrough1`             |
| N2      | `J1`, `L1`, `J2`, `Jthrough2`                                                   | `Jthrough2`             |
| N4      | `J1`, `L1`, `J2`, `Jthrough2`, `L2`, `J3`, `Jthrough3`, `L3`, `J4`, `Jthrough4` | `Jthrough4`             |

`Jthrough1` is an explicit one-input copy. Each later cumulative field is an
explicit addition of the preceding cumulative field and the new pure `Jk`.
The N2 and N4 graphs share the same `J1`, `L1`, `J2`, and `Jthrough2`
algorithms. N4 covers J3 while constructing no `L4`. No cumulative field is
read by a scatter or transport pass.

Executable GLSL remains behind the same ownership boundaries as the CPU
algorithm:

- the distant source supplies source direction and irradiance plus the
  source-specific primary `J1` and direct-primary `L1` programs;
- the atmosphere supplies wavelength/medium evaluation, Rayleigh and Mie
  phase functions, extinction, and source-path transmittance;
- spherical geometry supplies physical Native-48 positions, atmosphere and
  ground ray bounds, source-aligned W27 and Fibonacci-34 direction mapping,
  incoming weights, and packed transport-tap accessors;
- the ground owner supplies either the canonical-black omitted module or the
  reflective Lambertian construction contribution;
- `CacheOperations` supplies the source-independent 34-direction scatter
  loop, spherical/distant packed-tap transport, one-input copy, and two-input
  cumulative addition; and
- `IntegratedCacheTransport` supplies Flat/local stored-field transport from
  geometry-owned rays and stencils plus atmosphere-owned extinction.

Reflective construction uses the existing N2/N4 graph and retains its pure
ground-illumination inputs through their final consumers; no cumulative field
enters reflection or recurrence. Geometry provides the hit, normal, distance,
and construction index, while the atmosphere provides source-path and
finite-segment transmittance. The
[ground topic](../ground/README.md#implemented-gpu-work-and-historical-evidence)
owns the complete order,
zero-BRDF, omission, and lifecycle contract.

The historical dedicated reduced-domain ground lane passed its authenticated
Star/CPU/GPU comparisons, exact omitted/zero checks, coordinate checks, and
WebGL cleanup on this machine. Separate retained Node checks establish
controller invalidation and non-invalidation behavior. The
[baseline import status](baseline-import-status.md#focused-stage-8-ground-browser-reproduction)
owns the exact environment, cases, scalar totals, and result.

For N4, spherical geometry resolves the selected construction rays once. It
uses the retained construction lookup, W27 interpolation, and the production
15-interval trapezoidal transport control to pack active source
direction/position
addresses and per-channel `transmittance * path measure * interpolation
weight` coefficients. The source plan passes the same immutable logical
transport data to both `J2 -> L2` and `J3 -> L3`. The generic transport shader
only performs weighted reads of the supplied pure field; it has no knowledge
of distant versus local sources or spherical versus flat geometry. The Three
backend currently materializes that shared logical data as private pass
resources when each transport program is compiled.

The retired Star parity corpus historically used frozen 40-interval
construction inputs supplied by comparison-only controls. Those controls and
their production path were retired with the executable evidence bridge; they
are not current configuration or a rerun surface. The production default
remains 15, and runtime light-source constants and rebuilt `dist/flat32`
output contain no Star-parity controls or 40-interval transport literal.

`CachePassAssembler` dependency-orders the owner modules and emits one
deterministic GLSL 3 shader per logical pass. `CacheGpuExecutor` assembles the
complete build before submission, compiles each pass program once, and reuses
that program for all 15 wavelength-layer submissions. Build/pass defines are
resolved into shader source, while typed build/pass uniforms and packed data
are normalized or materialized by the backend when the pass program is
created. A layer submission supplies the wavelength selector, layer-frequency
values, and opaque input-field textures; it does not rebuild or recompile the
program. Backend compilation is an awaited operation.

`ThreeCacheBackend` now starts each program through Three's asynchronous
compilation-readiness path when `compileAsync` is available, with synchronous
`compile` retained only as the renderer fallback. This prevents a first
submission from paying an unresolved parallel-link wait on the browser's main
thread. When a caller supplies a cache-build scheduler, `CacheGpuExecutor`
yields after every completed nonfinal wavelength layer as well as at pass
boundaries, then rechecks cancellation before continuing. The Flat32
attachment supplies that scheduler, so its direct scene, setup status, browser
events, and Karma heartbeat continue to advance during the cold build. These
changes alter orchestration only; they do not change a field, wavelength,
domain, pass, or numerical sample.

`ThreeCacheBackend` privately owns high-precision scalar R32F array targets,
packed-data textures, and compiled programs. It checks the external renderer's
WebGL2, float-rendering/sampling, size, layer, and precision capabilities and
restores caller renderer state after compilation, submission, and selected
readback. Position and direction work runs across the render target while the
shader owns its declared incoming-direction or transport-tap loop.

The executor probes a requested bounded scalar set immediately after each
producing pass. It then disposes the pass program, releases every input field
after its last declared consumer, and returns an artifact that owns only the
requested cumulative result. Cancellation or failure cleans all still-owned
programs and fields. A successful build reports unit-bearing logical byte
diagnostics for `peakFieldStorage`, `peakPackedDataStorage`,
`peakTrackedStorage`, and `residentFieldStorage`; these values exclude opaque
renderer and driver overhead.

The retained real-browser construction gate establishes the
declared produced-field comparisons, exact N1 copy, shared N2/N4 stability,
selected-only readback, result-only retention, cleanup, and logical-memory
reporting. Fibonacci-34 vectors and quadrature constants are exact literals,
historically selected for Node/browser identity, so the domain and profile
identities are identical in Node and the browser. The
[baseline import status](baseline-import-status.md) owns exact run results.
Software-renderer evidence establishes conformance, not supported-hardware
performance.

## Published GPU Cache And Runtime Ownership

Each runtime attachment asks its configured atmospheric source for one cache
controller. The distant-Sun controller owns one executor, serializes staging
generations, derives a deterministic reuse key from the direct source-owned
plan identity and accepted backend capabilities, and publishes only a complete
N1, N2, or N4 cumulative result. The plan identity covers executable field
storage, every pass and owner module, binding-value identities, selected
domain IDs, and ground selection. Equal keys may reuse that controller's
active result. Changed construction inputs rebuild; camera and display changes
do not. Failure, cancellation, and supersession leave the last published cache
usable. The controller owns the cache and its resident result but not the
renderer backend.

`Algorithm32AtmosphereComposer` creates one `ThreeCacheBackend` for its
composer. `ShaderBuilder` awaits the source controller, receives the completed
`GpuScatteringCache`, and passes only its ordinary shader contribution and
opaque runtime binding into final-view assembly. The backend resolves that
binding and installs its private texture into the renderer uniform. No raw
texture, construction plan, pure field, backend program, or CPU cache payload
crosses the cache/runtime boundary. A shader handle disposes its runtime and
controller before the composer disposes the backend.

The public `ShaderSetupRequest` has no low-level cache, contribution, or symbol
override that can bypass source-owned cache creation. Low-level assembly
inputs remain an internal test seam rather than a second public runtime
strategy. Shader setup reuses a controller only for the same live source,
backend, and scheduler owners; the controller then applies its direct plan
reuse key to each cache request.

## Final-View Cumulative Transport

The runtime integrates one already-cumulative local spectral scattering field.
At each path point it updates view transmittance, resolves one geometry-owned
atmosphere coordinate, and passes pairing-neutral physical sample context to
one logical cache lookup. The concrete cache asks the active geometry for its
position and source-framed W27 direction stencils, multiplies by path measure,
and returns cumulative spectral density. There is no incident-direction loop
and no separate direct term, so `J1` is not counted twice. Direct-primary `L1`
exists only inside source-owned cache construction.

The selected production final-view count is 15 uniform physical-distance
intervals.
`Algorithm32Transport` binds that count as a runtime integer uniform and uses
it for the loop termination and trapezoid endpoints. This preserves the
selected 16 sample locations, measures, and cache queries while preventing ANGLE from
compile-time unrolling the complete transport and W27 lookup call graph. It is
a shader-compilation representation choice, not permission to substitute a
different production sample count.

Spherical shader geometry reconstructs altitude from the live camera ground-
relative position plus the ray offset, avoiding subtraction between two
Earth-scale binary32 radii. The atmosphere and cache receive that same
physical context. Shared transport does not branch on source or geometry kind;
each concrete cache interprets the context through its paired geometry.

The CPU reference follows the same boundary through `CpuScatteringCache`.
The generic spectral calculator performs exactly one physical-context
cumulative sample per path point, and the concrete CPU cache resolves its
stencils through the paired geometry. Static objects shorten the view segment,
and an unshortened ray ends at the geometry-owned atmosphere exit.

## Offline And Resident Point-Local Adoption

The PA2 production command under `scripts/algorithm32/solar-zenith-cache`
executes the qualified actual-point N4 GPU recurrence offline, one Native15
wavelength at a time. It consumes canonical production Native48, Z180, W27,
reflection-completed F68, and Native15 owners plus a scene definition, then
emits a content-addressed oracle payload, exact-seam derivative, W27 index,
packed-row ledger, manifest, hashes, and derivation record. The San Jose
nautical rebuild exactly matches the sealed P9/P10 payload identities.

No runtime owner imports the compiler or executes this recurrence. The PA3
asset loader verifies the exact manifest and compatibility identities, rebuilds
the executable packed ledger, verifies hashes and payload shapes, scans all
Native15 values, and checks the complete logical-to-unique W27 map before GPU
ownership begins. The loader transposes those unchanged floats into a logical
W27 face-grid atlas with four RGBA channel groups. `ThreeCacheBackend` eagerly
uploads the `648 x 27 x retainedRows` RGBA32F atlas and the validated
`4374 x 1` R16UI provenance index as two opaque bindings.
`DistantSunSceneCache` derives local solar zenith and the source-relative
outgoing frame at the actual physical path point, combines at most four
altitude/zenith rows, and emits a non-value for unsupported ledger rows rather
than clamping or returning zero.

The resident shader resolves four packed ledger rows, support state, and
altitude/solar-zenith weights once per path point. Hardware bilinear sampling
performs the four W27 direction taps for each of four RGBA spectral groups.
This reduces the Q30 maximum from 7,200 scalar cache reads to 480 atlas reads
per output pixel without changing any Native15 source value.

`DistantSunLightSource.createCacheController()` now requires the exact selected
asset and creates its attachment-owned manifest loader/controller directly.
The selected asset direction is installed as Geometry's explicit distant
source placement, avoiding a nearby ephemeris recomputation. Algorithm32's
live transport retains Geometry's first scene-object, ground, or atmosphere
endpoint and evaluates 30 intervals whose normalized boundaries are squared;
each interval samples cumulative density at its distance midpoint and applies
half-interval extinction on both sides of that contribution. Endpoint
composition remains spectral path radiance plus attenuated captured scene
color at the display boundary.

The distant scene-cache controller now serializes generation-local loads,
reuses only an exact active identity, preserves the last complete cache on
failure, disposes superseded candidates, and atomically swaps complete
two-texture binding groups. It enforces the qualified exact-seam logical-byte
limits and reports resident, atomic-transition, and transition-plus-staging
payloads separately from opaque driver overhead. Context loss releases invalid
renderer objects while their original context is lost; the source retains its
exact asset selection and reconstructs the complete cache after restoration.

The default Flat32 application derives the live distant-Sun direction and
observer solar zenith from its observation, submits only the scalar zenith to
the server resolver, and loads the returned content-addressed package. An
explicit dark response instead publishes one shared texture-free cache whose
cumulative Native15 scattering density is zero. That state downloads no cache
payload and keeps spherical geometry, transport, scene composition, and stars
inside the ordinary Algorithm32 shader. An unsupported spherical scene still
fails cache preparation explicitly and preserves the application's direct
scene fallback; it never falls back to receiver-column construction. PA5
publication/lifecycle and PA6 production qualification are complete. PA6
retains fresh B1 scores and six figures, exact oracle/seam parity, six live
scene assets, all declared endpoint classes, complete W27 rotation, and named
RTX 2060 timing/resource evidence. PA7 run `000585` emits all six runtime-only
packages at `901,034,856` bytes. The older celestial-composition fixture now
supplies a complete production-shaped exact asset through the real scene-cache
controller and passes inside the unfiltered `23/23` WebGL gate.

Those six packages are retained qualification evidence. A verified generated
construction inventory covers every integer solar-
zenith angle from 0 through 108 degrees. It contains 109 unique cache packages,
`17,411,056,920` oracle bytes, and `16,154,147,172` exact-runtime bytes. The
inventory and independent verification record retain their original
repository-relative paths inside the verified archives linked from the
[production status](README.md). That verification matched every package
manifest, ledger, R32F payload, and R16UI index SHA-256. The application keeps
one scene cache resident and atomically swap complete caches; total
offline/deployed storage, rather than steady resident size, scales with the
number of angle bins. The bin-covered runtime inventory at
`server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1`
contains 109 packages,
`17,230,339,148` total bytes, and a `161,192,508`-byte maximum resident cache.
It owns half-up, half-open bins across `[0, 108)` and returns explicit darkness
at 108 degrees. All dark angles share the procedural zero-scattering runtime
state rather than multiplying the offline inventory. Its union ledgers cover
both bin edges, and all 5,494 shared
physical coordinates are byte-identical across their construction parents.
The server selects the exact catalog record and returns its content-addressed
manifest/package URLs. Static
storage or a CDN serves the large immutable files; the server does not calculate
the Sun position, execute recurrence, or return the payload inside its resolver
response.

## Flat/Local Production Dataflow

`FlatEarthGeometry` supplies the configured ground/top bounds, local
source-relative frame, construction paths, clamped bilinear position stencils,
and W27 direction stencils. Its default position domain scales 19 altitude
fractions by the configured atmosphere top and 15 radial fractions by the
configured cache radial maximum. The measured 100 km/4.8 Mm instantiation has
285 positions; other scaled instantiations are executable but not
convergence-qualified by that study.

The Flat32 application preserves each synchronized finite Sun position in
physical meters and configures each flat/local candidate's radial maximum as
the greater of 4.8 Mm and the observer's horizontal distance from that
source's subpoint. This scales only the existing 15 radial fractions. It does
not scale the source position, false-Sun altitude, reference distance, source
radius, inverse-square falloff, or meter-to-scene conversion. Union Glacier
Flat 0 and Flat 180 therefore use 6.283427593 Mm and 31.412716893 Mm radial
domains instead of both clamping to the 4.8 Mm terminal row. The latter
scaled configurations are executable application inputs; the existing
convergence claim remains limited to the measured 4.8 Mm case.

For final-view sky termination, `FlatLocalMode` also configures the accepted
observer-centered dome: a 100 km atmosphere apex and 1,926,774 m maximum
observer view-ray extent. This boundary is consumed by final view traversal;
it is not a replacement cache domain or shell policy. Supplying it removes
the sharp white near-horizon discontinuity that appeared when Flat32 used
only the fallback scene ray limit.

`LocalSunLightSource` owns the typed reference-distance irradiance, physical
source position, inverse-square behavior, source-radius clamp, finite
source-path bound, primary fields, selected position and direction domains,
CPU fields/cache, and mandatory source-paired shell facts. The fixed fact
owner retains 2,049 binary64 boundaries and 2,048 held scales privately,
returns copies, resolves higher-index internal-boundary ownership, and derives
its identity from the physical source and frozen policy. Callers cannot choose
a shell count, identity, cache, incoming domain, or continuous-versus-held
strategy.

The one flat/local construction contract is z19/rho15,
paired-plus-rotated-Fibonacci-68, W27, native-15, and requested N1/N2/N4. The
incoming quadrature combines the selected paired-Fibonacci-34 set with its
90-degree-rotated copy at half weight, retaining 34 exact antipodal pairs,
zero first moment, and total weight `4π`. Construction
lighting applies the arithmetic-mean shell-held inverse-square amplitude only
to `J1`. `local-sun-primary-radiance.js` independently integrates continuous
finite-source direct `L1`; it reads neither shell facts nor stored `J1`.
Integrated stored-field transport accepts only pure `J2 -> L2` and
`J3 -> L3`, and only pure fields feed later scatter. Each Flat transport
fragment reconstructs its geometry-owned ray and z/rho/W stencils, evaluates
atmosphere-owned extinction, and samples the pure input field through the
local layout. Cumulative fields are separate sums with no query-time shell
multiplier.

Historical pre-retirement evidence authenticated the binary64 CPU path for the
bounded omitted-ground boundary. The independent Star-only v3 gold recorded
its 24-file source closure and executed requested N1, N2, and N4 independently.
The matching production comparison authenticated both implementations' source,
atmosphere/profile, native-15 basis, domains, and controls, then passed 40,560
field scalars, 26,900 core exact leaves, 224 exact input-authentication leaves,
29 behavioral edge records, and 9,720 resident sampled scalars at zero
mismatches. The historical gold identity was
`algorithm32-star-local-sun-shell-cpu-gold-v3-sha256:bb3a1f871a375e53d9c180899003041afc4dda93cbe3fe69e62080481bd8d0c9`;
the historical report identity was
`algorithm32-star-local-sun-shell-cpu-comparison-report-v3-sha256:358f1abbbc910774be040baae85d240c2d2d0ca14c9eb4f51bb96af5ceaddd5a`.
The unchanged gold file SHA-256 was
`61532368d7efa2d4a60fc932a901097a8e583ccb0eb3593eb9b26d29c2674985`;
the refreshed report file SHA-256 was
`d5fa37c70729eec944f59a7802f51b3a66dfb875969f0f1d076ab9ab0ea2c399`.
The focused isolation control proved shell-held versus continuous `J1`
changed only `J1` and its cumulative contribution. Shared prefixes,
cumulative sums, the public CPU entrypoint, and zero query-time shell scaling
also passed. The geometry excludes an inward ray's coincident top plane, so a
top-node direct-L1 ray continues to its ground/rho exit instead of collapsing
to zero length.

That historical comparison covered omitted ground only. The Stage 8 ground
owner and order routing remain implemented, and the CPU and GPU
implementations agree for omitted, explicit-zero, and nonzero cases under the
declared bounded probes, order checks, cumulative sums, and zero-BRDF
isolation. The retired Star producer and comparison are not current authority
for any of those outputs. Any renewed acceptance must select a new independent
authority in an isolated evidence lane under the production architecture
boundary; historical spherical Stage 8 evidence and CPU/GPU agreement cannot
substitute for that authority.

Stage 9.6.3 replaces the local GPU construction path. `LocalSunCacheSource`
binds one deterministically converted 2,049-scalar R32 shell-boundary payload
only to `primary-j1`; the shader resolves higher-index ownership and derives
the arithmetic-mean held scale there. Its separate `direct-l1` program has no
input field or shell binding. It follows the selected paired-Fibonacci ray to the
nearest reusable ground, top, or rho boundary and recomputes finite-source
direction, inverse-square irradiance, source transmittance, phase, and medium
facts at every integration sample.

The exact replacement graphs are:

```text
N1: local-sun-primary-j1, local-sun-copy-j1-to-jthrough1
N2: local-sun-primary-j1, local-sun-direct-l1,
    local-sun-scatter-l1-to-j2,
    local-sun-add-j1-j2-to-jthrough2
N4: local-sun-primary-j1, local-sun-direct-l1,
    local-sun-scatter-l1-to-j2,
    local-sun-add-j1-j2-to-jthrough2,
    local-sun-transport-j2-to-l2,
    local-sun-scatter-l2-to-j3,
    local-sun-add-jthrough2-j3-to-jthrough3,
    local-sun-transport-j3-to-l3,
    local-sun-scatter-l3-to-j4,
    local-sun-add-jthrough3-j4-to-jthrough4
```

N1, N2, and N4 create no packed Flat stored-field transport data. For N4,
`LocalSunCacheController` selects Flat geometry, canonical atmosphere,
`IntegratedCacheTransport`, and the local layout for both transport passes.
Construction uploads the small physical/domain/source facts and no CPU
radiance, scattering-density field, transport addresses, or transport
coefficients. Ordinary execution retains only the cumulative result;
conformance readback remains selected and field-scoped. The concrete fixed
and indexed CPU transport builders remain diagnostic reference surfaces and
are not part of `createBuildPlan()` or a selectable production path.

The pre-retirement focused Chrome 150 lane passed `2/2` in 71.582 seconds with
zero WebGL errors. Independent N1, N2, and N4 executions compared 40,560 omitted-ground
scalars with the Star-only v3 gold, including all 22,320 N4 scalars, with zero
mismatches under the declared R32F bounds. Shared `J1`, `L1`, and `J2`
prefixes are bit-identical and N1's copy is exact. Explicit-zero and nonzero
reflective builds each passed 3,300 production CPU/GPU probes with zero
mismatches. The boundary upload was exactly 8,196 bytes, no CPU `J`/`L` upload
occurred, and the slowest bounded build was 5,224.8 ms against the 120,000 ms
policy bound. Historical run `000335` recorded method, tolerance, and resource
evidence only because its 4/4 path controls differed from production's 15/15
controls; it is not current authority.

`LocalSunLightSource.createCacheController()` now creates the typed
`LocalSunCacheController` and private source. Exact reuse, replacement,
supersession, cancellation, failure preservation, declared invalidation,
camera/display non-invalidation, cleanup, and complete-result-only
publication pass. Resource reporting separates retained binary64 facts, the
8,196-byte boundary texture, the exactly zero Flat packed-transport metric,
observed field/auxiliary-data/tracked peaks, and the final resident field. The retired Star implementation
is historical evidence only and is neither current numerical authority nor a
production runtime/build dependency.

The following historical GPU policy and evidence describe only the authorized
Stage 9.1-9.5 baseline; they do not validate the Stage 9.6 target. That
baseline separates the production domain from the bounded browser execution
domain. Production was 19-by-15 positions, Fibonacci-34/W27/native-15 with
15 source and transport intervals. Its browser gate used an explicit
two-by-two/W3 construction domain for N4 pass probes and cumulative lookup,
then exercised production-W27 N1 through public ShaderBuilder setup for three
complete rays and all 90 radiance/transmittance scalars. It is historical
compositional evidence, not evidence for paired-F34, shell-held `J1`, or
continuous local `L1`.

The v4 position study passes its spatial and logical-resource gates. Its two
15-versus-60 control studies remain failing, non-gating characterizations, W9
fails the W9-to-W27 supporting maximum-error limit, and no denser-W or
supported-hardware claim follows. The
[flat/local promotion register](../flat-local/unresolved-research.md) owns the
exact metrics and report identities.

The pre-fusion V5 post-promotion verification realized the exact selected
default through the production geometry and recorded 9,690 transport queries,
236 taps per query, `164,707,792` packed-data bytes, `74,795,400` resident
bytes, and `389,675,392` peak tracked logical bytes. Those values remain the
eliminated baseline. The fused default records zero Flat packed-transport
bytes, `224,386,200` peak logical field/tracked bytes, `63,024` peak packed
auxiliary bytes, and the unchanged `74,795,400`-byte resident result.

## Shared Spectral Path And Captured-Scene Composition

Final atmospheric state remains native-15 spectral path radiance plus
transmittance. `BrunetonColorDisplayModel` retains the E8 native-15
CIE/bin-width/683/XYZ-to-linear-sRGB path projection. Separately, the composer
captures the ordinary Three scene in renderer-linear sRGB before the
atmosphere pass. At the display boundary, the color model:

1. averages native-15 transmittance channels into the retained red, green, and
   blue display bands selected during the historical comparison work;
2. applies those bands only when a scene endpoint lies within the atmosphere
   segment;
3. combines `pathLinearSrgb + sceneLinearSrgb *
sceneTransmittanceRgb`; and
4. performs the final display encoding once.

Flat32 selects `BrunetonSourceLuminanceLiftColorDisplayModel`, which retains
that complete composition and Figure-1 mapping as its bright baseline. Before
configuration publication, `LocalLightLevelCalculator` applies geometry-owned
source support and atmosphere-owned source-path transmittance to the primary
source irradiance, then reduces it to one photopic `E_v / pi` scalar. Color
maps that scalar from exact gamma `1` at `5 cd m^-2` to exact gamma `0.125` at
`0.001 cd m^-2` with a smooth logarithmic Hermite curve, applies one common RGB
gain, and caps that gain at `32768`. Flat32 setup does not replace this scalar
with its retained explicit diffuse-environment diagnostic measurement.

This RGB-band operation is a display-boundary compositor, not RGB atmospheric
transport or cache construction. `ShaderRuntimePass` binds the current
composer read-buffer texture as the captured scene color on every render.
`ShaderBuilder` no longer declares or requires a native-15 matte endpoint
texture. `Algorithm32AtmosphereComposer` no longer accepts or owns an endpoint
adapter.

The historical pre-retirement source pins were
`scripts/algorithm32-star/src/output/spectral-to-rgb.js` at SHA-256
`e55fa94464c506e6bdb3a664196bf9763759d5f22709577f4b0918deeed629fc`
for E8 and
`scripts/algorithm32-star/src/production-reference/color/BrunetonColorDisplayModel.js`
at SHA-256
`35595582e4e08c38776f056f4244c6ef76006ece60716cabd982df81ba341626`
for the compositor, preserved from `C:\dev\poly-gc-react` commit
`514d5f6080d2dd485efdb07b5da9a203357a40c0`. These exact paths and hashes are
provenance records only; they are not current executable authorities and must
not be retargeted.

The historical replacement focused browser gate passed `1/1` and exercised a real
captured scene texture, both the attenuated-endpoint and background branches,
CPU/shader agreement, read-buffer rebinding, diagnostics, and cleanup. The
earlier endpoint-adapter lane is superseded and cannot accept this path.

## Open Color Reset And Celestial Boundaries

Production now contains the spherical/distant Sun-plus-brightest-500 roster,
one-pixel stellar screen-index/palette generation, and final celestial
composition machinery. P1 adds one exact Flat32 selection owner for Color,
celestial enablement, stellar catalog, and ordered presentation filters. These
selections are independent: Basic Bruneton no longer disables celestial
sources. Unknown values and recognized later-phase choices fail closed instead
of aliasing to an implemented path. Production still uses the explicit pre-P9
source-luminance-lift Color default and the current 500-member data, so the
selected receiver-light state, `slope-078/p9`, neutral diffuse scene lighting,
brightest-2,000 replacement, `q=24`, and optional human-vision filters are not
yet production behavior.
Their current architecture and execution order are owned by the
[Production Color Reset Design](color-reset-design.md) and
[Production Color Reset Implementation Plan](color-reset-implementation-plan.md).
The [promotion manifest](color-reset-promotion-manifest.md) owns the P0
evidence, production-owner, fixed-500, qualification, and redistribution
inventory.
The [closed contained plan](../../extraterrestrial/color-reset-experiment-plan.md)
remains evidence history.

Flat geometry, the finite-distance point Sun, and the Stage 9.1-9.5 local-cache
behavior are implemented within their recorded production boundaries. The
paired-plus-rotated-Fibonacci-68/N=2048/continuous-`L1` facts/domain and omitted-ground CPU
contract are implemented through Stage 9.6.2. Stage 9.6.2a closes the
contract/executable-owner, private-surface, runtime-mechanics, public
entrypoint, and direct requested-N1/N2/N4 implementation gaps for that omitted-ground
CPU path. Stage 9.6.3 implements the replacement GPU construction graph
and closes its omitted-ground numerical, graph, upload, readback, and bounded
resource gates. Stages 9.6.4-9.6.6 complete public lifecycle/resources,
ordinary N4 Flat32 cutover, and containment. Reflective local CPU/GPU behavior
is implemented and checked. Its former Star comparisons are historical only;
any renewed numerical acceptance requires a newly selected independent
authority and isolated evidence lane under the production architecture
boundary.

The corrected captured-scene composition selected during the historical Star
work is implemented. Its refreshed Node, type-check, direct-Star, and
real-WebGL results are retained historical evidence rather than current Star
authority. V5 post-promotion verification passes without changing the v4
selection. The architecture retains independent geometry and source
owners, but the current
[supported pairings](architecture-boundaries.md#supported-geometry-and-source-pairings)
do not include flat/distant or spherical/local.
Extraterrestrial sources follow `flat32` in the declared delivery order.

This repository now contains a runnable host-sized `flat32` application. Its
local owners create the DOM shell, a browser-device-pixel-ratio Three renderer,
camera, ordinary matte ground and review objects, and the source
application's initial one-ambient/six-directional flat/local Three lighting
with all six targets. It retains the matching six 4096-by-4096 PCF-soft shadow
maps, exact recast focus/camera configuration, isolated per-object caster
layers, and shared ground receiver. `ThreeSceneRuntime` owns direct fallback,
composer/base-pass preparation, map enablement, PCF selection, capability
checks, frame operation, and update policy; `LocalSunSceneLighting` owns the
six light and camera/tuning configurations; and `EndpointScene` owns casters,
receivers, and physical depth endpoints.

`SphericalDistantMode` owns the current native-production spherical geometry,
distant source, canonical black ground, and ordinary N4 configuration.
`Algorithm32Runtime` owns the backend, cache-build scheduler, live bindings,
asynchronous shader preparation, composed-frame
preflight, atomic render-operation replacement, direct-scene failure fallback,
and ordered disposal. Host resizing changes only scene capture and final
composition pixels; it does not reduce the cache domains or the six 4096
shadow maps.

The [Flat32 one-degree scene-cache hookup plan](flat32-one-degree-cache-hookup-plan.md)
is complete. Flat32 preserves the observation's live source direction for
placement while resolving its scalar solar zenith, validating the selected
offline package, and atomically publishing the new cache.
The normal Polylith server mounts the resolver at
`/flat32/api/distant-sun-scene-cache` and immutable assets below
`/flat32/scene-caches/`. `FLAT32_DISTANT_SUN_CACHE_ROOT` selects the deployed
package root; local omission uses the qualified bin-covered package set at
`server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1`.

The first hooked-up shader placed exact-seam index and packed-row resolution
inside the Native15 loop and admitted up to 14,400 texture reads per output
pixel under Q30. Hoisting invariant work alone did not materially improve the
live application. Pass-local GPU queries measured roughly 673-880 ms per
1920-by-1080 scalar frame, proving the earlier `gl.finish()` counter evidence
was CPU-submission timing. RGBA channel packing reached roughly 63-73 ms after
warm-up; the selected face-grid atlas reaches 22.22 ms mean and 22.30 ms p95
over eight warmed frames on the named RTX 2060/D3D11 path. Accepted proof is
`flat32-distant-sun-runtime-performance-20260831-11`. Algorithm32 `591/591`,
Algorithm32 WebGL `23/23`, and the full exact-cache Flat32 lane `16/16` pass.
The same pass measures 123.32 ms mean at 3840 by 2160, so 4K 30-FPS rendering
remains open. These timings are hardware-specific and do not establish a
portable performance guarantee.

The composer captures the Three scene before the atmosphere pass, and the
runtime supplies that read-buffer texture to the retained display-boundary
compositor. After the fused Flat transport cutover, the ordinary-N4 Flat32
lane passes `3/3` in Chrome Headless 151, covering the application path and
two transactional failure paths in 53.181 seconds. The earlier 108.656-second
ready-state and 3m41s complete-lane observations belong to the pre-fusion
packed/indexed implementations. Timing remains diagnostic; the current
headless environment reports a software renderer and does not establish
supported-hardware performance.

The first independent Stage 11.4 interaction slice is implemented:
`PointerLookController` owns the legacy pointer-lock rotation settings,
canvas activation, lock-state accessibility text, and listener cleanup. A
click on the scene locks the pointer and rotates the existing camera; Escape
releases it.

Stage 11.3's transactional owners are implemented: `ModeController`
prepares an isolated candidate, preflights it, publishes it atomically, and
only then disposes the replaced runtime. Failed candidates and constructor
failures preserve and republish the prior runtime and dispose all unowned
mode, composer, and target resources. Current Stage 9.6 evidence exercises
successful flat/local publication through the enabled local-Sun controller.

The partial Stage 11.5 controls and source-update owners remain present. Their
compact toolbar includes San Jose and Union Glacier, Flat 0/45/90/135/180,
Flat/Globe time basis, Sunrise/Solar-noon/Sunset, and globe hour/minute
offsets. `LocationTimeController` retains the source application's
`FlatSynchronizer` calculations and 450 ms coalescing delay, and
`Flat32ApplicationState` remains the one requested-state snapshot. The current
focused lane verifies requested-versus-published state, scaled source-bearing
domains, source-update invalidation, independent camera state, and successful
transactional publication through the selected Stage 9.6 cache.

The application being adapted remains in
`C:\dev\poly-gc-react`; it is migration evidence, not a runtime or build
dependency. Stage 11 incrementally adapts required behavior to the production
interfaces here; the
[implementation plan](production-implementation-plan.md#11-integrate-flat32)
owns that migration and the prohibition on a retained external runtime/build
dependency. Stage 9.6.5 restored and verifies default N4; broader Stage 11.8
acceptance remains separate work.

Broader pinned-source auditing, new isolated independent Stage 8 and reflective
local-ground evidence, the import manifest, citations,
the expanded release suite, arbitrary scaled flat/local convergence,
beyond-W27 evidence, and selected-domain supported-hardware performance/
resource qualification remain open. Stage 8's retained focused reflective
Star-output and GPU evidence is historical passing evidence only. Renewed
acceptance requires a newly selected authority under the production
architecture boundary, not a rerun of the retired bridge. The broader audit
must not be described as complete. None of these gaps creates an alternate
accepted cache or runtime path.
