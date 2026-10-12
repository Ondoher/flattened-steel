# Local-Sun P0 Contracts And Controls

Selected 2026-10-12 for the [production port](local-sun-cache-promotion-plan.md).
This document owns the prospective compact-domain, complete local profile,
support, frame-publication and admission contracts. It does not describe an
implemented runtime capability. P1-P4 install these contracts in their existing
owners; existing runtime defaults and deployed distant packages remain controls.
The [status](local-sun-cache-promotion-status.md) owns completion and next work.

## Frozen Boundary

Starting production commit: `13f058ec6c9b6bbeaf10d45837e8dfaaeb78f2f4`.
The P0 baseline also preserves the already-reviewed shared-parameter and selected
shape edits to the plan/status. The baseline and review unit are recorded under
`.codex-tmp/review-standards/session-xlu2SC/`.

The production-owned [control fixture](../../../../src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-compact-p0-controls.json)
pins the exact sealed `00478-p3-contract` contract, layout and gates, their
original derivation record, and the retained pure stencil helper by SHA-256.
Its producer imports no live production implementation. Authoring may invoke
that authenticated helper; portable verification reads only this checked fixture
and its maintained producer. Neither path allocates or reopens an experiment run.
Every historical parent remains immutable.

The first P1 capability is compact topology/admission and source-centered
amplitude **bounds and partition**. Its independent control includes all 1,049
positions, 61 physical bands, 22 rows, 2,049 amplitude boundaries, and 11 admitted
or rejected stencil sentinels. Bounds also use the independent cylinder equations
`dmin=h-H`, `dmax=hypot(h,R)`; compare these with the sealed node-distance extrema.
For boundary index `i=0..2048`, the independent equation is
`1/d_i²=(1-i/2048)/dmin²+(i/2048)/dmax²` with exact endpoints.
This does not supply held source-strength samples or scattering-field gold.

## Parameter Applicability

The distant comparison is the selected Native48/Z180/W27/F68/Native15/N4
compiler family in `scripts/algorithm32/solar-zenith-cache/`, including the
profile-input compiler and selected anchored-radial numerical policy in the
[release](distant-sun-strobing-release.md). The deployed spherical view path is
Q30, as executed by `src/flat32/SphericalDistantMode.js`; the bare Native profile's
15 uniform view intervals alone do not describe that selection. Existing
compiler options for Native51, solar interpolation and geometry policy remain
distant-specific alternatives, not implicit local overrides.

| Parameter and executable owner | Distant selection | Local candidate decision and override boundary |
| --- | --- | --- |
| Spectral basis and packet: `profiles/native-15/native-15-profile.js` | 15 contiguous bin averages and the exact Native source irradiance-density packet | Same basis, sample semantics and packet. Read the shared owner; no copied tuned spectrum. Basis-compatible source packets remain typed inputs, but new emissions require separate numerical acceptance. No custom basis is admitted by this first candidate. |
| Atmosphere: `CanonicalAtmosphere`, native profile and compiler input owners | Rayleigh scale height 8,000 m; Mie 1,200 m; Rayleigh scale 0.00000124062 m^-1; Angstrom alpha 0.8/beta 0.04; Mie albedo 0.8/g 0.7 | Same coefficients, density profiles and phase equations from shared owners. Horizontal uniformity and flat altitude replace spherical height evaluation. Changed medium families need new comparison controls; no ignored override. |
| Ground and ozone: accepted profile/models | Black atmospheric ground; ozone disabled | Same selections. Nonblack ground and enabled ozone explicitly unsupported by the candidate; scene materials do not imply atmospheric reflection. |
| Orders: native profile and source cache owners | Shared package N4; ordinary supported selections N1/N2/N4 | Same pure/cumulative meanings and requested orders. First frozen field control is N4; N1/N2 need independent truncation/output comparisons before acceptance. No silent N4 substitution. |
| Outgoing reconstruction: W27 domain owner | 6×27×27 = 4,374 directions | Same W27 and interpolation. At each spatial tap, geometry resolves its own source-relative frame; axis taps use the qualified canonical-meridian limit. |
| Incoming quadrature: F68 owner versus local geometry policy | Reflection-completed F68, 68 weighted directions | Local horizon-partitioned polar40 × midpoint azimuth48, 1,920 positive weighted directions, total 4π sr. Preserve as an explicit geometry-dependent policy, not an independently tuned common default. |
| Source transmittance: profile/source and atmosphere owners | 20 sampled intervals | Flat exponential-column analytic integration. A sampled interval count is inapplicable to this analytic policy; ingress rejects a conflicting sampled-count override. |
| Construction transport: numerical policy/atmosphere/geometry/cache integration owners | 15 intervals under the selected spherical policy | Squared cumulative Rayleigh column, 48 intervals, tau-64 prefix, positive attenuation weights. Count and placement are one local policy; do not copy the spherical count alone. |
| Runtime view transport: Algorithm32/geometry/atmosphere | Deployed Q30, quadratic near observer | Analytic columns with positive column15 integration. Preserve exact shortened-ray and boundary meanings. A future count change changes policy identity and needs new matching controls. |
| Physical positions: geometry/domain owners | Spherical Native48 with solar-zenith axis | Experiment-selected v9 source-centered ragged topology. No separate Sun-angle position axis under the selected symmetries. Altitude H=100,000 m differs from spherical 60,000 m thickness. |
| Source amplitude: local source owner | Collimated distant irradiance; no finite-distance amplitude shells | Finite source radius 25,749.504 m, reference distance 4,800,000 m, reference incident scale 1, inverse-square falloff and 2,048 held amplitude bands. Preserve irradiance packet semantics; do not reinterpret this as total power. |
| Precision and resource controls: storage/runtime owners | Scalar spectral FP32; release-specific two-atlas ceiling | Same scalar R32F semantics, binary64 CPU reference. Apply common host controls; use the explicit local overlap budget below because measured allocations differ. Spherical cubic P2/atlas addresses and ceilings do not describe local construction. |

The geometry-dependent policies are supported by the retained
[P3 decisions](../../poc-experiments/engineering-studies/local-sun-cache-reuse/p3-execution.md):
coarse optically thick trapezoids in the large flat cylinder, horizon and
cylinder-tangent angular transitions, and descending paths through the dense
lower atmosphere. Run `00128` failed the squared-physical-distance trial;
`00132` passed the specified density-column primary/withheld comparisons.
The F68 diagnosis remained uncertain; this is not proof that F68 is universally
invalid. The retained policy's approximations and limited accuracy claims remain
those of the [abstraction inventory](../../poc-experiments/engineering-studies/local-sun-cache-reuse/abstraction-inventory.md).
Replacing it with F68/15/Q30 would be a distinct numerical qualification.

Dropping the separate Sun-angle position axis follows from the horizontally
uniform slab, isotropic finite source, fixed height and source-centered framing.
It does not remove outgoing angular dependence, scattering phase, pointwise
incoming source direction or axis-specific reconstruction. Redesigning the
source/geometry coupling is deferred; geometry keeps coordinate ownership.

## Complete Candidate Profile And Support

Prospective named policy: `local-sun-compact-v9-native15-n4-v1`. P1 implements a
complete builder under the existing local/profile owners, using accepted shared
objects and local executable policies. Identity reports normalized accepted
facts; no descriptor constructs algorithms or reconstructs configuration.

The first admitted numerical control fixes source height 4,828,032 m, atmosphere
top 100,000 m, source-centered coverage radius 33,378,000 m, the table's complete
spectral/medium/source/ground/numerical facts, pure J1..J4, transported L1..L3,
and cumulative Jthrough4. Direct L1 remains separate from stored multiple-order
scattering. Quantities retain their basis/sample semantics and provenance:
J is W m^-3 sr^-1 nm^-1, radiance L is W m^-2 sr^-1 nm^-1,
irradiance is W m^-2 nm^-1, transmittance is dimensionless.

The complete profile includes tagged analytic versus sampled source-path policy
and tagged local column versus spherical transport policy. All counts that a
selected policy uses are positive integers. Inapplicable counts are absent and
rejected if supplied; an analytic policy must not pretend to consume 20 samples.
Accepted source inputs are finite unit-bearing radius/reference distance,
nonnegative compatible irradiance packet/scale and an explicit falloff policy.
The initial candidate rejects source intersection with the atmospheric slab.
Changed height, radius, emission, spectrum, medium, ground, coverage, quadrature,
order or implementation requires compatible reconstruction and corresponding
independent controls. Other profiles may be represented but are not qualified
by this frozen control. Runtime support must distinguish unsupported,
requires-replacement and admitted outcomes before allocation/publication.

## Executable Domain And Reconstruction Contract

Prospective geometry-owned `CompactLocalCacheTopology` exposes actual
`positionCount`, ordered altitude rows with contiguous offsets/counts, physical
band IDs/radii/admission, and physical nodes. `positionAt(index)` resolves a real
node; `resolveStencil(point,direction)` returns a complete positive support
result or a named rejection. Physical queries use unit-bearing lengths and unit
directions. Cache packing consumes arbitrary positionCount, never fictional
rectangular zCount/rhoCount. Source-amplitude bands are separate from scattering
bands and packed addresses.

Stable radius excess is `rho²/(hypot(rho,h-z)+(h-z))`; use the stable operation
order near the axis. Rows include exact axis and cylinder support. Omit a
physical band only when its outer radius is strictly below `h-H`; tangent bands
remain admitted. No omitted slot receives storage or dispatch. Positive cross-row
weights preserve constants and affine Euclidean-radius/altitude moments.
Geometry resolves angular support separately at every spatial tap. Reconstruct
the qualified geometric-density normalization from actual source/medium/spectral
inputs and restore physical J without modifying stored density or compensating
brightness. Axis taps use one canonical meridian; nonaxis taps use W27 support.

`LocalSunSourceSupportEnvelope` carries accepted source height, slab and cylinder
bounds and the explicit amplitude distance partition. Geometry validates each
required ray, shortened endpoint and every spatial/directional support tap.
Horizontal rigid transforms are reusable only when all support is complete and
physical symmetry holds. Outside-support results contain the reason and required
replacement input; no clamp, missing-tap renormalization or fake vacuum fallback.

## Identity, Preparation And Publication

The local source-owned construction identity includes complete physical and
numerical profile, canonical topology/envelope, basis/packets, source intrinsic
facts, implementation revisions and backend capabilities. Canonical construction
placement is immutable. Horizontal live placement is excluded only after the
geometry-owned support check. The exact frame identity includes observation,
resolved placement/transform, receiver position, celestial inputs, presentation
state that affects staged bindings, and monotonically increasing generation.
A matching construction identity alone never makes a frame publishable.

P3 extends `Algorithm32Runtime.updateSharedScene` ownership with a local staged
capability. `prepareLocalFrame(request,signal)` returns a prospective
`PreparedLocalSunFrame`: generation, exact frame state, support result, owned
cache lease, geometry/source shader bindings, compiled shader readiness,
measured direct/diffuse receiver spectra/adaptation, finite-Sun and stellar inputs,
and complete allocation accounting. Applications supply observation, not projected
cache coordinates. Geometry and source placement are prepared together without
mutating their private configuration. No public texture/packing API is selected.

`publishPreparedLocalFrame(prepared)` validates current generation, context,
support and readiness, then commits all components together at one frame boundary.
Cache construction completion is insufficient. Publication transfers ownership;
abort/failure/stale result releases candidate resources without touching the
displayed frame. Supersession increments generation and cancels prior preparation;
late completion must discard its own resources. Retry prepares the current request
with a new generation. Cancellation returns to displayed state without mislabeling it.

Published frames own token/refcount cache leases. Retirement prevents new borrowers;
old resources dispose only after the last lease releases. No immediate previous-cache
dispose while an old frame borrows it. Context loss invalidates GPU-backed frames
and leases, cancels candidates, reports unavailable state and prepares a complete
restored frame on a valid context. It cannot promise to keep rendering a lost context.
Disposal is idempotent and rejects further preparation/publication.

Flat32 continues to use its busy/error controls. While preparing, show requested
state as pending and identify the displayed instant/location from the published
frame. Failure or unsupported support retains that frame and reports the reason;
retry acts on the retained request. Camera/display changes avoid physical rebuilds
only when their support/bindings remain admitted. P0 specifies this behavior;
P3/P4 implement and prove it.

## Acceptance And Resource Admission

Freeze comparison inputs before candidate output: every fixture node/band/row and
all 2,049 amplitude boundaries, exact-node queries, axis/near-axis, cross-row,
ground/top/cylinder endpoints, omission/tangent rules and all four fixture rejection
sentinels. P1 adds candidate comparisons against this prepared authority; P0's
fixture proof validates preparation only. Coordinate/radius/altitude-moment
absolute tolerance is 1e-7 m, weight sum 1e-12, exact-node weight 1e-10;
these are original declared gates, not observed residuals promoted to tolerances.
All support identities/admission flags/counts are exact. Inverse-square partition
consistency uses absolute 1e-27 m^-2; this checks algebra, not source-field accuracy.

Matched future CPU/GPU quantity comparisons retain relative 0.002;
fresh/reused comparisons retain 0.0001. Absolute floors are J 1e-12
W m^-3 sr^-1 nm^-1, L 1e-9 W m^-2 sr^-1 nm^-1, irradiance 1e-9
W m^-2 nm^-1 and T 1e-7. Ray endpoint tolerance is 0.01 m. Missing support,
clamps, nonfinite fields and GL errors are failures. Report every negative value
and apply the retained quantity absolute floor without hiding it by clamping. Compact/unculled
occupied fields require the declared exact identity; empty proof slots are zero.
Those checks remain unexecuted future gates, not P0 passes or physical error bounds.

Select a new production **1,600,000,000-byte logical owned-GPU-allocation ceiling**,
including old/new overlap, fields, phase/auxiliary textures, shader/celestial/shadow
resources and receiver staging. This is an explicit P0 admission policy, not an
inherited experiment allowance or GPU physical-memory guarantee. Frozen-count
estimate: old retained field 275,299,560 + new construction peak 825,898,680 +
incoming 120,844,800 + phase 33,592,320 = 1,255,635,360 bytes, leaving
344,364,640 bytes for every other owned allocation. This conservative subtotal
is not measured production usage and may double-count peak components. Before
allocation, owners must estimate all retained/new resources and reject if the
ceiling cannot be met; measure actual declared allocations and prevent peak
overflow. Never dispose the displayed frame to force admission. Hardware lacking
the needed texture/FP32/context capabilities returns explicit unsupported status.

Qualification jobs serialize; retain 8 GiB free-memory reserve, 8 GiB owned-process
ceiling, ten-minute bound, progress within 30 seconds and owned-resource cleanup.
Logical allocations, process samples and driver/GPU observations are reported
separately. No replacement-latency or frame-rate target is selected.

## Capability Evidence And Remaining Gates

| Capability / production owner | Independent authority and comparison requirement |
| --- | --- |
| Compact shape, omission, stencils / flat geometry and local packing | P0 fixture pins 00478 and authenticated pure helper; 00495 stencil and 00510 omission records support declared controls. P1 compares all nodes and exact-node identity plus sentinels; P2 compares occupied compact/unculled fields. |
| Source-centered bounds / LocalSunShellFactCache and provider | Independent cylinder and inverse-square equations plus sealed-layout extrema. Full boundary vector prepared. The bounded P1 [held-source qualification](local-sun-held-amplitude-qualification.md) separately pins and compares the frozen held-amplitude vector; status owns its receipt. |
| Per-tap axis limit, normalized reconstruction, pure/cumulative recurrence / CPU cache and shared transport | Retained P3 abstraction/contract/layout qualification and 00519 report define the accepted algorithms. Whole-field hashes alone do not supply portable scalar gold; obtain independently derived matching field/ray diagnostics before CPU becomes an oracle. |
| Incoming measure / sampling domains and geometry | The bounded P1 [incoming qualification](local-sun-incoming-quadrature-qualification.md) ports and compares all ordered vectors/weights against retained historical controls. Per-node transforms and field integration remain separate gates; status owns its receipt. |
| Column policies / geometry, atmosphere and cache integration | Retained P3 decisions and controls, including 00132 trial and later selected-policy qualification. Preserve exact policy; independent N1/N2, changed-profile and scalar-output comparisons are still required before numerical acceptance. |
| GPU construction/runtime / source GPU cache and shared transport | Accepted independently compared CPU plus retained policy/precision controls; no CPU/GPU parity claim yet. Declare all resources and prove cleanup/admission. |
| Horizontal reuse and complete frame / controller and Algorithm32Runtime | 00538 movement report; compare fresh/reused exact-state spectra under admitted transforms and prove failures, cancellation, leases/context recovery. |
| Receiver lighting / LocalSunSceneLighting and Flat32 | 00639 exact-state application report; reproduce physical direct/diffuse values without film smoothing. Its failed performance targets and relaxed latency gate confer no interactive guarantee. |
| Finite-disc coverage / SunDiskTileGenerationPass and consumer | 00675 celestial report and linked P5 qualification: geometry-owned axes/parallax, circle/pixel disjoint guard at producer and filtered consumer, projected-radius active/zero bindings, single view transmission. Pin each affected scalar/image input before P4 changes. |
| Flat stars and shared vision / geometry, roster/catalog, stellar palette and filters | Same retained celestial authority: actual epoch/rotation/projection/parallax; authenticated current catalog; mesopic max rod 0.5 then low-light max chroma 0.65 from measured adaptation. No fake spherical roster or brightness gain. New selection compatibility requires its own control. |

P0 closes the first-capability comparison-preparation gap through geometry data and
analytic bounds. P1's selected held amplitudes have their separate qualification
owner above. Field/ray scalar diagnostics, additional profile
families, N1/N2, GPU, reuse and consumers remain explicit acceptance gates in the
phases that implement them. This inventory does not turn aggregate reports,
appearance captures or successful type checks into numerical gold.

Offline entrypoints:

```text
node scripts/algorithm32/local-sun-cache/LocalSunP0Controls.js
node scripts/algorithm32/local-sun-cache/LocalSunP0Controls.js --verify-parents
npx --no-install tsc -p scripts/algorithm32/local-sun-cache/jsconfig.json
```

`--derive` is the explicit authoring operation. It writes only the intended checked
fixture and retains independent parents/tool/equation identities. Portable proof
does not require the generated experiment tree. P1 records actual comparisons in
new immutable runs under `tmp/production-local-sun-cache-promotion/`; no numerical
qualification run is allocated by P0.
