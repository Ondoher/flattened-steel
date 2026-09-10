# Algorithm32 Current Dataflow

Focus: Cache construction, storage, reconstruction, loading, and optimization.

Related owners: [architecture-contracts](../architecture-contracts/current-dataflow.md), [transport-geometry](../transport-geometry/current-dataflow.md), [color-celestial](../color-celestial/current-dataflow.md).

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
[historical Star parity data-set contract](../../../../archives/topics/retired-20260906/agents/topics/algorithm32/production/star-parity-data-set.md) preserves
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
[production architecture boundary](../architecture-contracts/architecture-boundaries.md#algorithm-source-promotion-and-conformance).
The [historical Star parity data-set contract](../../../../archives/topics/retired-20260906/agents/topics/algorithm32/archive/algorithm32-star/production/star-parity-data-set.md#completed-stage-8-comparisons)
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
[ground topic](../qualification/ground-contract.md#implemented-gpu-work-and-historical-evidence)
owns the complete order,
zero-BRDF, omission, and lifecycle contract.

The historical dedicated reduced-domain ground lane passed its authenticated
Star/CPU/GPU comparisons, exact omitted/zero checks, coordinate checks, and
WebGL cleanup on this machine. Separate retained Node checks establish
controller invalidation and non-invalidation behavior. The
[baseline import status](../qualification/baseline-import-status.md#focused-stage-8-ground-browser-reproduction)
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
[baseline import status](../architecture-contracts/baseline-import-status.md) owns exact run results.
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


## Shared-Block Distant-Sun Runtime

The production generator evaluates the unchanged Native15/N4 recurrence over
5,494 shared physical coordinates and stores 89 authenticated 8x8 blocks. The
single content-addressed package reconstructs all 109 dense controls exactly;
its numerical and generation evidence is owned by
[shared generation qualification](shared-generation-qualification.md).
The retained dense inventory is a reference-only generator/verifier input and
is absent from the served production inventory.

Flat32 computes the physical observer direction and solar zenith, sends only
the scalar to its server resolver, and authenticates the selected package's
complete metadata graph. The persistent module Worker authenticates, decompresses,
and packetizes complete blocks. Four bounded transport jobs feed explicit host
pins and a 64 MiB unpinned LRU. No complete dense scene is reconstructed by the
production browser.

The source-owned shared attachment maintains the current/predicted window in a
24-layer RGBA32F packet atlas. A row-to-slot map and altitude ledger provide
exact addressing while retaining the four hardware-filtered RGBA spectral
reads. Native15 arithmetic, the geometry-owned endpoint, N4, and the Q30
quadratic-near-observer final-view integration are unchanged.

Time updates stage complete cache and receiver-light state, then publish the
cache, atmospheric direction, geometry, celestial placement, endpoint lighting,
and shadows at one frame boundary. One runtime and compiled shader survive
ordinary time changes. Prediction misses preserve the complete last-good frame.
Only the explicitly qualified package/device/browser/backend may allocate a
second atlas for otherwise incompatible large jumps.

Input angles below 108 degrees remain illuminated, including ordinal 108 for
[107.5, 108). Input 108 and above selects darkness using the same shared runtime:
no encoded block requests or cache-data atlas, with 36 bytes of typed sampler
placeholders needed by the stable shader. Context loss releases old GPU resources
while the context is lost; restoration rebuilds the latest physical observation
and authenticated cache selection, including clean subsequent disposal.

The production host serves only complete, authenticated, allowlisted shared
artifacts with immutable caching. It rejects the retired dense inventory and
never evaluates the atmospheric recurrence. The
[rollout owner](shared-runtime-rollout.md) records the selected identity,
publication, rollback, local host observation, and retained references.
[Runtime qualification](shared-runtime-qualification.md) owns timing and memory:
bounded discrete time changes are accepted, while continuous time animation
at the experiment's Q10 cadence remains unqualified at production Q30.