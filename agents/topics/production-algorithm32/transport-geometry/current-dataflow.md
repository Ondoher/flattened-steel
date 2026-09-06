# Algorithm32 Current Dataflow

Focus: Physical transport, geometry, ground, and source placement.

Related owners: [architecture-contracts](../architecture-contracts/current-dataflow.md), [caches](../caches/current-dataflow.md), [color-celestial](../color-celestial/current-dataflow.md).

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
[flat/local promotion register](../caches/unresolved-research.md) owns the
exact metrics and report identities.

The pre-fusion V5 post-promotion verification realized the exact selected
default through the production geometry and recorded 9,690 transport queries,
236 taps per query, `164,707,792` packed-data bytes, `74,795,400` resident
bytes, and `389,675,392` peak tracked logical bytes. Those values remain the
eliminated baseline. The fused default records zero Flat packed-transport
bytes, `224,386,200` peak logical field/tracked bytes, `63,024` peak packed
auxiliary bytes, and the unchanged `74,795,400`-byte resident result.
