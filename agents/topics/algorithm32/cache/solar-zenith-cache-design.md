# Distant-Sun Solar-Zenith Scene-Cache Design

Status: complete canonical design, closed with the Flat32 H7 integration on
2026-08-31. The point-local cumulative-density representation is complete
through the contained P10 decision, production adoption is complete through
PA7, and the 0-degree through 108-degree construction inventory is built and
byte-verified. Half-open runtime bins cover `[0, 108)`, while every angle from
108 degrees onward shares one texture-free zero-scattering runtime state.
Accepted run
`000569` selects Native48/Z180/W27/F68/N4/Q30; runs `000572` and `000577`
measure the complete uncompressed W27 asset and lifecycle; and run `000579`
qualifies exact cubed-sphere seam deduplication. The production-owned offline
compiler now exactly reproduces the P9/P10 payload identities. Exact
manifest-backed loading, immutable two-texture upload, resident point-local
lookup, exact asset source placement, and live Q30 transport are implemented.
PA6 final proof
`tmp/extraterrestrial/production-adoption/pa6-final-qualification-20260829-1`
passes the fresh B1, exact parity, six-scene, endpoint, rotation, lifecycle,
and named-hardware gates. This
document owns the numerical and runtime design for one distant-Sun atmosphere
cache per scene.

## Selected Direction

The selected scene cache stores cumulative local spectral scattering density:

```text
C4(r, mu_s, outgoingDirection, wavelength)
  = J1 + J2 + J3 + J4
```

where:

```text
r    = length(p)
mu_s = dot(normalize(p), distantSunDirection)
```

and `outgoingDirection` is the complete direction expressed in the sample's
local source-relative frame. That two-dimensional direction determines the
usual view-zenith and view/Sun invariants `mu` and `nu`; they are not separate
stored axes when the full direction is retained.

One cache is built and published for one scene Sun state and its declared
spatial support. The cache is point-local and camera-independent. Camera
origin, camera orientation, camera-ray length, object identity, object depth,
display state, and post-exit celestial sources are not cache dimensions.

The final product requires a substantially broader offline inventory than the
six qualified scenes: enough discrete scene caches to cover the Sun through
all non-dark hours, provisionally at one-degree solar-angle increments. The
six-scene set is qualification and deployment-mechanics evidence, not the final
coverage catalog. The darkness cutoff and indexed solar-angle bin policy must
be selected from measured evidence. Solar azimuth is not a cache dimension:
spherical symmetry, source-relative coordinates, multi-direction B1 evidence,
six qualified scene builds, and complete-rotation coverage establish the
rotational contract.

The first complete construction inventory is
`tmp/extraterrestrial/production-adoption/one-degree-inventory-20260829-1`.
It contains 109 unique packages, `17,411,056,920` uncompressed oracle bytes,
and `16,154,147,172` exact-seam runtime bytes. Independent streaming
verification in `one-degree-inventory-verification-20260829-1` matched every
manifest, ledger, oracle payload, exact payload, and logical-direction index
SHA-256. This establishes constructed data and measured storage only; it does
not qualify nearest-degree bins or the darkness cutoff.

Geometry keeps its current simple responsibility: determine the physical end
of a camera ray. Algorithm32 keeps its current live path integration and
samples actual points along that ray. Zenith awareness is added only to the
cache query made at each actual point.

The following alternatives are not selected:

- observer-projected `(altitude, observer-ray direction)` pages;
- branch-distance or camera-origin checkpoint caches;
- completed path-radiance checkpoints;
- canonical whole-ray prefixes; and
- single-boundary-total endpoint fields.

Those alternatives may remain historical evidence, but they no longer govern
the active design or execution plan.

## Glossary

| Term                        | Meaning                                                                                                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scene Sun state**         | The fixed distant-Sun direction and radiometric source identity used by one scene cache.                                                                                         |
| **Transport state**         | One physical local state addressed by `(r, mu_s, outgoingDirection)`.                                                                                                            |
| **Native15 spectrum**       | Fifteen ordered bin-average spectral values spanning `360` through `830 nm`.                                                                                                     |
| **Spectral field sample**   | One transport state paired with one Native15 cumulative-density spectrum.                                                                                                        |
| **Sample inventory**        | The complete deterministic set of spectral field samples supported by one scene cache, including coordinate nodes and packing metadata.                                          |
| **Scene support**           | The declared set of actual atmospheric points and outgoing directions that cameras and visible endpoints may query in the scene.                                                 |
| **Inventory block**         | Every outgoing direction and Native15 value at one `(altitude, local-solar-zenith)` node.                                                                                        |
| **Packed-row ledger**       | Metadata mapping a physical altitude/solar-zenith stencil to resident inventory rows.                                                                                            |
| **Resident scene cache**    | The one atomically published cache handle containing every block required by the declared scene support. Physical textures are an implementation detail, not separate Sun pages. |
| **Construction quadrature** | Transient wavelength, direction, or path samples used offline to construct the cache. It is not a runtime cache axis.                                                            |

## Why The Cache Needs Local Solar Zenith

The previous spherical distant-Sun cache stores altitude plus a source-relative
outgoing direction, but constructs every altitude at one reference radial
column above the observer. Runtime samples at the same altitude reuse that
column even when Earth curvature gives the actual point a different local
radial normal and different Sun visibility.

The San Jose nautical-twilight evidence establishes the consequence:

- the reduced reference column cannot represent sunlight reaching remote
  points along a curved horizon when the same-altitude reference point is
  Earth-shadowed;
- increased incoming and outgoing angular counts do not restore the missing
  position state;
- ozone changes spectral extinction but does not repair the topology; and
- run `000497`'s actual-point J1 control closes about `97.2%` of the focused
  source-axis center/flank deficit.

The omitted state is the sample's local solar zenith:

```text
mu_s = dot(normalize(p), s)
```

Adding the observer's Sun angle only to cache identity would not be enough.
Every actual point along a spherical ray has its own `mu_s`.

## Runtime Contract

For observer `o`, unit ray direction `v`, and Geometry-provided visible length
`t_end`, Algorithm32 retains its current integration structure:

```text
for each quadrature sample t in [0, t_end]:
    p = o + t * v

    altitude = length(p) - bottomRadius
    localUp = normalize(p)
    mu_s = dot(localUp, sceneSunDirection)
    localOutgoing = express(v, localUp, sceneSunDirection)

    C4 = sceneCache.lookup(altitude, mu_s, localOutgoing)
    pathRadiance += viewTransmittance * C4 * sampleWeight
```

Native15 values remain spectral through atmosphere integration and celestial
composition. Color receives the completed spectral result at the existing
boundary.

The selected first reconstruction stencil is:

```text
2 altitude nodes
x 2 local-solar-zenith nodes
x 4 cubed-sphere direction nodes
= at most 16 Native15 spectral taps
```

Queries outside declared scene support fail explicitly. They do not silently
clamp to the nearest retained zenith row.

The production GLSL resolves all channel-invariant lookup state before its
Native15 loop. For each physical path sample it maps the four logical W27
directions to exact-seam slots once, resolves the four altitude/solar-zenith
packed rows once, and computes support and spatial weights once. The channel
loop retains the same ordered R32F interpolation but cannot repeat those
ledger and R16UI operations fifteen times. This is an exact evaluation-order
correction; it does not alter a cache coordinate, payload, weight, spectral
value, or Q30 path sample.

## Geometry And Scene Objects

Geometry remains the owner of ray termination:

```text
t_end = min(
    nearest scene-object intersection,
    ground intersection,
    atmosphere exit
)
```

Objects do not change the scene cache. A moving object changes `t_end`, not
the stored atmospheric field. For an opaque endpoint:

```text
L_camera = L_atmosphere(0 -> t_end)
         + T_view(0 -> t_end) * L_surface
```

A black surface can therefore retain atmospheric haze in front of it.
Transparent objects require segmented composition but use the same local
cache for each atmospheric segment.

Object-cast volumetric shadows are not part of this static cache. If later
required, they need a separate dynamic visibility contribution rather than
making object state a cache dimension.

## One Cache Per Scene

The scene cache is identified by:

- planet bottom/top radii and spherical geometry policy;
- atmosphere density profiles and spectral coefficients;
- ozone, aerosol, and ground identities;
- distant-source spectral shape, normalization, direction, and visibility
  policy;
- Native15 basis;
- maximum scattering order and recurrence identity;
- altitude, local-solar-zenith, incoming, and outgoing domains;
- scene-support definition and culling policy;
- packing, precision, and reconstruction rules; and
- compiler/tool/source identities and content hashes.

All blocks needed by the declared scene support become resident and publish as
one cache. The active design does not page the cache as the Sun moves. A
different scene Sun state selects or swaps a separately built cache.

Animation remains deferred. A future discrete Sun-state animation may swap
complete compatible scene caches atomically; interpolation between scene
caches requires separate continuity evidence.

Broad time-of-day coverage does not require every cache to be resident at once.
One selected scene cache remains the GPU resident unit. The offline/deployed
inventory grows approximately with the number of retained solar-angle bins,
while steady resident GPU size remains the size of one selected cache and
atomic swapping retains the already-qualified two-cache transition policy.

The production resolver owns half-up, half-open one-degree bins across
`[0, 108)`, with explicit darkness beginning at 108 degrees. Each runtime-only
package contains the union of ledger rows required at both interval edges.
All 5,494 coordinates shared by construction parents have byte-identical
Native15 rows, so assembly changes support coverage without approximating the
scattering field.

## Server Cache Resolution

The final product requires a server entry point that resolves one scene
solar-zenith angle to the correct qualified cache. The application owns the
location/time calculation and submits only that scalar angle, using the angle
convention and units fixed by the endpoint contract. The browser does not carry
the complete solar-angle catalog as handwritten application source. The
deployed endpoint/catalog version fixes the supported atmosphere, geometry,
spectral, recurrence, and codec identities; those identities remain explicit
in the returned manifest for independent client validation rather than becoming
resolver inputs.

The resolver response is small. It returns either:

- the exact selected solar-angle bin and scene-cache identity;
- the content-addressed manifest URL and manifest SHA-256;
- the package root used for its ledger, exact-seam payload, and direction index;
- the representative solar-zenith angle owned by that bin;
- cacheability/version facts and optional adjacent-bin prefetch identities; or
- an explicit dark, unsupported, or incompatible result.

The resolver service should not dynamically rebuild the atmosphere cache and
need not proxy approximately 150 MB through an application JSON response. The
offline builder publishes immutable content-addressed packages to static object
storage or a CDN. The server selects one package; the existing loader downloads
and verifies its manifest and payload hashes from those returned URLs. HTTP/CDN
caching can therefore share packages across clients while the application keeps
only the selected cache resident.

The server owns bin policy and catalog availability, but it does not calculate
the Sun position and cannot weaken the client's manifest compatibility checks.
A stale, malformed, hash-mismatched, or physically incompatible response still
fails before publication. Dark results must be distinguished from missing
assets so that complete darkness is an intentional supported outcome rather
than an accidental zero-spectrum fallback. All dark solar angles select one
procedural, texture-free cache contribution that returns zero cumulative
Native15 solar scattering. This is a valid cache implementation behind the
same generic controller/resource interface, not a disabled shader: the live
source placement, geometry, transmittance, scene composition, and celestial
sources remain assembled. No dark angle adds an offline package, resolver
descriptor payload, or resident cache texture.

Flat32's deployed namespace is `/flat32`: its resolver is
`/flat32/api/distant-sun-scene-cache`, and its immutable package namespace is
`/flat32/scene-caches/`. The endpoint is document-relative in the browser so
the application slug remains part of the request. The server package root is
deployment configuration, not a browser request parameter.

## Scene Support And Culling

A full rectangular cache contains every altitude and local-solar-zenith node.
One local scene normally queries a smaller subset. Offline Geometry can derive
the `mu_s` range reachable at each altitude from the declared camera/spatial
support, then add the interpolation-safe halo required by neighboring
altitude and zenith nodes.

The resulting packed-row ledger stores, for each retained altitude support:

- physical altitude node identity;
- retained solar-zenith node range or explicit indices;
- packed row offsets;
- lower/upper interpolation neighbors;
- support and halo provenance; and
- compatibility identity.

Culling removes unavailable inventory blocks; it does not approximate their
spectra. Construction must prove that every runtime stencil required by scene
support is present.

Run `000498` is the first geometry/logical-byte census for the exact San Jose
nautical scene, Native48, a 180-center one-degree zenith grid, production W27,
Native15, and `R32F`. Its conservative interpolation-safe ledger retains 617
of 8,640 altitude/zenith blocks:

```text
154.424171 MiB
```

One additional zenith node on both sides retains 713 blocks:

```text
178.451271 MiB
```

Those figures do not yet prove N4 construction closure, spectral accuracy, or
physical packing. They establish that a single resident scene cache need not
contain the full rectangular field when scene support is bounded.

P0 run `000516` now freezes the first supported region as the retained San
Jose observer position, complete camera rotation, and every endpoint from zero
through Geometry's first object, ground, or atmosphere-exit termination. It
also gives solar noon and nautical twilight independent cache identities;
camera and object state remain absent from stored axes.

P1 run `000517` closes that support analytically and with dense query tests.
The solar-noon ledger retains 618 altitude/zenith blocks and the nautical
ledger retains 617. Their exact packed logical payloads are respectively
`338,392,080` and `337,844,520` bytes for comparison W39, or `162,187,920` and
`161,925,480` bytes for successor W27. Both require 18 distinct Z180 indices
if allocated as complete zenith pages. Each scene proof exercises `6,736,896`
reachable local queries and finds all required altitude/zenith stencil taps.
This closes inventory support only; it does not establish N4 construction
closure, interpolation accuracy, physical texture allocation, or driver
memory.

Runs `000519` through `000524` now establish the first complete implementation
chain for the selected representation. Run `000519` replaces observer
projection with direct packed local-row accumulation at `595 nm`. Run `000520`
extends that path through all 15 wavelengths and writes independently loadable
W39 scene caches for solar noon and nautical twilight. Run `000522` loads the
complete cache and proves actual-point altitude, local-solar-zenith, and local
source-relative outgoing reconstruction without a validity mask or additive
correction. Run `000524` consumes each cache as the sole cumulative-density
provider and preserves both requested first-look renders.

The solar-noon first look has row-220 mean RGB
`(148.74, 146.33, 141.94)`, close to the rejected-page diagnostic run
`000513`'s `(145.43, 144.62, 141.62)`. The nautical first look has center-band
luminance `57.81` and left/right flank values `53.58` and `58.16`; the focused
central depression is absent. These are operational plausibility observations,
not resolution or physical-accuracy qualification. Native48, Z180, F68, and
W39 remain provisional until P6.

The owner rejects the pale gray near-ground band in run `000524`'s solar-noon
render. It is an active defect, not an accepted aerosol-haze characteristic.
P6 must retain that exact render as a control and distinguish at pre-display
Native15 level among near-ground radial interpolation, aerosol/Rayleigh and
order composition, and display compression. Resolution qualification cannot
hide the band inside frame-wide error statistics. If a converged cache leaves
the band unchanged, the responsible non-cache model boundary must be named and
corrected before camera/object coverage begins.

P6.1 runs `000525` and `000526` isolate the first radial candidate. Run
`000525` rebuilds the complete solar-noon Native15 W39 cache with the same 48
node count and the near-ground-weighted mapping
`altitude[i] = 60000 * (i / 47)^2`; Z180, F68, W39, N4, atmosphere, camera,
and path controls remain fixed. Run `000526` renders the original and candidate
caches under retained, quarter-exposure linear, and per-pixel chromaticity
displays and records all 15 path samples for blue-sky, gray-band, and ground
controls. Every image is preserved unconditionally.

The radial candidate does not correct the defect. Retained row 220 changes
only from `(148.74, 146.33, 141.94)` to `(144.83, 143.33, 139.88)`. At the
focused band pixel, total Native15 path magnitude changes by `-4.45%` and the
maximum normalized-channel shape change is `0.001453`; the band remains pale
under both linear and chromaticity views. The first path midpoint, at about
`190.3 m` altitude, supplies `92.61%` of the control spectral sum and `93.16%`
of the candidate sum. This rules down both the tested radial interpolation and
display compression as primary causes. P6 must next retain separate J1--J4 and
Rayleigh/aerosol contributions for that dominant near-observer sample before
selecting a model correction.

P6.2 run `000527` performs that separation without constructing additional
resident caches. For every Native15 wavelength it reruns the unchanged
Native48/Z180/F68/W39 recurrence and stores the final scattering event as an
RG32F diagnostic pair `(Rayleigh, Mie)`. Transport consumes their sum, so the
ordinary recurrence remains unchanged. Sparse readback reconstructs every
P6.1 stencil at all 15 path samples for the blue-sky, gray-band, and ground
pixels. Separated density and complete path radiance agree with run `000526`
within `8.20e-8` and `5.87e-8` maximum relative error.

The gray-band focus is `43.21%` final-event Rayleigh and `56.79%` final-event
Mie, compared with `83.11%/16.89%` in the blue-sky control. Its order shares
are `50.93%` J1, `28.11%` J2, `13.70%` J3, and `7.26%` J4; the blue-sky shares
are `70.65%`, `19.10%`, `7.11%`, and `3.14%`. Thus both aerosol participation
and multiple scattering are materially stronger in the rejected band. The
component label describes the final scattering event only: higher-order
incoming radiance can contain both molecular and aerosol ancestry. These data
identify the next controlled variable but do not by themselves prove that the
canonical `0.04` Angstrom beta, Mie phase function, or recurrence is wrong.
P6 next varies aerosol loading in isolation while retaining the same cache
coordinates, orders, camera, and display.

P6.3 run `000528` completes that control with independent `0x`, `0.25x`,
`0.5x`, and `1x` canonical aerosol builds. Mie scattering and extinction scale
together; alpha, single-scattering albedo, phase parameter, Rayleigh, ozone,
Native48, Z180, F68, W39, N4, Geometry, camera, black ground, and display stay
fixed. All four complete caches render unconditionally.

The pale horizon structure survives with no aerosol. Row 220 progresses from
blue-gray `(65.10, 74.32, 81.67)` at `0x`, through nearly neutral
`(109.26, 111.39, 111.21)` at `0.5x`, to warm-gray
`(148.74, 146.33, 141.94)` at `1x`. At zero aerosol the focused band is
`77.70%` J1, `16.86%` J2, `4.19%` J3, and `1.26%` J4. Aerosol therefore
controls brightness, warmth, and higher-order participation but is not the
source of the band geometry.

The leading numerical suspect is now the live camera-path quadrature rather
than cache radial interpolation or atmospheric composition. The focused
horizon ray is about `847.8 km` long, yet the retained uniform 15-interval
midpoint rule represents its first `56.5 km` interval with one sample at about
`190.3 m` altitude. That single sample supplies more than `92.6%` of the
focused spectrum. P6 must next refine or event-split the camera quadrature
while leaving the complete cache unchanged. This is a runtime integration
control, not a change to Geometry's ground/atmosphere ray termination.

P6.4 run `000529` confirms that control. It reuses the byte-identical canonical
run-`000520` cache and unchanged Geometry endpoints. The control reproduces
uniform 15 exactly. Candidate segment boundaries use
`t_i = t_end * (i/N)^2`, with each segment evaluated at its distance midpoint
and weighted by its own `t_(i+1) - t_i`; no measure is discarded or counted
twice.

At the rejected row 220, quadratic 15 changes RGB from
`(148.74, 146.33, 141.94)` to `(171.94, 184.27, 215.26)`. The focused
Native15 magnitude rises by `60.59%` and maximum normalized-channel shape
change is `0.04871`. Quadratic 30 and 60 converge closely: 30 is `0.71%` below
60 in magnitude and differs by at most `0.000593` in normalized spectral
shape. Their row-220 values are `(173.50, 186.46, 218.12)` and
`(173.95, 187.05, 218.90)`. The first focused segment changes from `56.52 km`
under uniform 15 to `3.77 km`, `0.942 km`, and `0.235 km` for quadratic 15,
30, and 60.

This materially corrects the owner-rejected gray band and identifies the
uniform view quadrature as its cause. It does not yet select quadratic spacing
or an interval count as the final general rule. The candidate must be checked
across solar noon, sunset, twilight, upward rays, atmosphere exits, ground
hits, and object-shortened endpoints. The cache representation and Geometry
termination contract remain unchanged.

P6.5 run `000530` qualifies quadratic 30 as the retained provisional view-path
rule for the current two-scene lane. It preserves Q30/Q60 solar-noon and
nautical renders plus an opaque-black 10 km object control, then compares Q30
with uniform-960 Native15 integration on upward, horizon, ground-hit, and
object-shortened rays from 100 m through 50 km. Geometry endpoints and endpoint
classes match exactly. The worst sparse case is the solar-noon horizon at
`0.927412%` magnitude error and `0.000764425` maximum normalized spectral-shape
difference, inside the predeclared `2%` and `0.002` gates. Q30 is therefore
selected for subsequent contained coverage work; this is not a production
promotion or a claim that quadratic spacing is optimal for every future scene.

The scene-support definition is a required contract input. A fixed observer
with rotation, a bounded camera volume, and unrestricted movement around the
planet require different inventories while retaining the same cache semantic.

## Domain And Memory Baselines

The qualified successor returns to production W27. W39 remains available only
for visual comparison in contained POCs.

| Domain                           | Count |
| -------------------------------- | ----: |
| Native48 altitude                |    48 |
| provisional solar-zenith centers |   180 |
| F68 incoming quadrature          |    68 |
| production W27 outgoing          | 4,374 |
| comparison W39 outgoing          | 9,126 |
| Native15 wavelength values       |    15 |

One uncompressed `R32F` inventory block costs:

```text
W27: 4,374 * 15 * 4 = 262,440 bytes
W39: 9,126 * 15 * 4 = 547,560 bytes
```

The full rectangular payloads cost:

```text
Native48 * Z180 * W27 * Native15 * 4 = 2,267,481,600 bytes
Native48 * Z180 * W39 * Native15 * 4 = 4,730,918,400 bytes
```

The W39 equivalent of run `000498`'s 617-block ledger would be approximately
`322.2 MiB`. This is an arithmetic projection, not an accepted W39 packing
result.

Runtime memory, not offline construction time, governs layout decisions.
Offline temporary J/L fields, ping-pong resources, and readback staging do not
count as resident scene-cache bytes, although the builder must still be able
to complete safely.

## Altitude And Solar-Zenith Resolution

Native48 is a baseline, not a final radial grid. The solar-noon POC exposed a
large gap between the boundary node and the first interior node at `1,875 m`.
In the observer-projected diagnostic page that gap combined with invalid shell
states to create a broad dark horizon ramp.

Runs `000513` and `000515` separate the effects:

- adding page-only rows at `1.7`, `10`, `50`, `100`, `250`, `500`, and
  `1,000 m` raises row-220 mean RGB from approximately
  `(12.10, 9.49, 7.89)` to `(145.43, 144.62, 141.62)`; and
- validity-aware interpolation on the original Native48 projected page raises
  it only to `(80.52, 86.31, 91.74)`.

These are diagnostics of the rejected observer-projected representation. The
selected point-local field has a valid physical value at every retained
`(altitude, mu_s, outgoingDirection)` state and therefore does not use
observer-shell validity as a field value.

Run `000569` retains Native48 for the selected P8 candidate because it passes
the unchanged external Kider B1 boundary. Runs `000561` through `000565`
demonstrate sensitivity to coordinate-node placement and test denser support
in:

- the near-ground aerosol and molecular region;
- the first few atmospheric scale heights;
- ozone transitions; and
- the upper-atmosphere boundary.

Those shifted-grid comparisons execute the same solver on different nodes;
they are not measured data or an independently converged physical oracle.
They remain non-blocking diagnostics. The first refined altitude/solar-zenith
candidate is rejected because its unchanged Direct40 B1 score regresses to
`18.47808688506421`. Refinement reopens only for a specific visible twilight
defect, a successively over-resolved convergence reference, or external
twilight spectral measurements. Doubling every dimension remains a cost
bound, not a selected resolution strategy.

## Offline Construction

The existing contained POC solver already constructs the required transient
pure-order fields:

```text
Jk(altitude, localSolarZenith, W39)
Lk(altitude, localSolarZenith, F68)
```

Only the preceding pure transported order feeds the next order:

```text
direct L1 -> J2
J2 -> L2
L2 -> J3
J3 -> L3
L3 -> J4
```

Cumulative density never feeds recurrence.

The selected scene-cache compiler processes one wavelength at a time:

```text
create packed scene accumulator for retained (altitude, mu_s) rows

evaluate selected J1 rows and accumulate

construct J2
copy selected J2 rows into the accumulator
transport J2 -> L2

construct J3
copy selected J3 rows into the accumulator
transport J3 -> L3

construct J4
copy selected J4 rows into the accumulator

write the completed wavelength layer
```

The selected rows are local solver states. No camera ray, shell intersection,
observer frame, or scene-page projection participates in emission.

The compiler writes:

- one independently identified Native15 scene-cache payload;
- the packed-row ledger;
- scene-support and compatibility metadata;
- derivation records for every selected block;
- exact logical and physical byte ledgers; and
- immutable construction evidence.

## Historical Observer-Projected POC

Runs `000509` through `000515` remain useful preserved evidence but do not
define the selected cache contract.

- `000509` proves a complete Native15 N4 page can be compiled and consumed by
  the ordinary camera integrator.
- `000511` proves several fixed-observer pages can be projected from one
  wavelength solve.
- `000513` shows that near-ground projected support removes the solar-noon
  dark ramp.
- `000515` shows that excluding invalid projected taps materially helps but
  cannot reconstruct missing near-ground values.

The architectural lesson is that collapsing `mu_s` through an observer-ray
projection creates observer dependence and invalid rectangular states. The
successor retains `mu_s` explicitly and samples it at each actual Algorithm32
quadrature point.

The old lane and immutable runs remain preserved. Successor implementation
belongs in a new contained lane and must not rewrite those artifacts.

## Spectral Representation And Compression

Native15 `R32F` is the uncompressed correctness baseline. RGB is not an
atmospheric cache representation.

Approximate cross-zenith and spectral redundancy remains plausible. Run
`000500` demonstrates useful proxy redundancy but also weak-blue and transfer
failures. The uncompressed point-local N4 scene cache now passes its accuracy
gates; only the exact seam codec below receives memory credit.

Deferred candidates may still test, one at a time:

- reduced precision with explicit scale;
- key-zenith rows plus residuals;
- shared spectral bases or dictionaries;
- source-spectrum factoring;
- cubed-sphere seam deduplication; and
- altitude/zenith delta coding.

Every decoded corner used by interpolation must pass Native15 physical error
gates. Exact zero and nonnegativity semantics must not be lost silently.

Accepted run `000579-point-local-scene-cache-p10-seam-dedup` qualifies the
first codec without changing any spectral value. W27's six separately stored
cube faces contain `4,374` logical direction slots but only `4,058` unique
physical directions. Storing the unique R32F values plus one `Uint16`
logical-to-unique index costs `150,235,908 bytes` for the 617-block nautical
cache, versus `161,925,480 bytes` uncompressed: a `7.219105973933194%`
reduction. All `40,481,370` decoded scalars compare exactly and 63 GPU probes
are exact. The named RTX 2060 twelve-frame lookup batch measures `51 ms`
uncompressed and `55 ms` decoded. This selects seam deduplication for future
production consideration, retains the uncompressed payload as the correctness
oracle, and grants no memory credit to lossy precision, basis, dictionary, or
residual candidates.

Production hookup H6 exposed a shader scheduling defect that P10 did not gate:
the initial point-local consumer repeated packed-row work and exact-seam index
fetches inside every Native15 channel. With Q30 that source shape admitted as
many as `7,200` R32F reads plus `7,200` redundant R16UI reads per output pixel.
Hoisting the channel-invariant work did not fix the live application. The
earlier `gl.finish()` proof is superseded because pass-local timer queries
measured roughly 673-880 ms per 1920-by-1080 scalar frame.

The selected resident derivative preserves the accepted P10 files as its
validated source, duplicates seam values back into a logical W27 face grid,
and packs Native15 into four RGBA32F groups. Hardware bilinear filtering then
performs each four-direction W27 interpolation in one sample. Q30 requires at
most 480 atlas reads per output pixel. The largest deployed source package
remains `161,192,508` bytes; the largest GPU derivative is `185,326,380` bytes.
Accepted timer-query proof
`tmp/extraterrestrial/production-adoption/flat32-distant-sun-runtime-performance-20260831-11`
measures 22.22 ms mean and 22.30 ms p95 across eight warmed 1920-by-1080 frames
on the RTX 2060/D3D11. These observations close the reported sub-one-FPS
regression on that hardware; they do not set a portable performance ceiling.
At 3840 by 2160 the same atlas measures 123.32 ms mean and 127.10 ms p95;
resolution scaling or reprojection remains necessary for a 30-FPS 4K target.

## Physical Resource And Lifecycle Result

Accepted run `000572-point-local-scene-cache-p9-w27-asset` builds the complete
selected San Jose nautical cache. Its packed R32F payload is
`161,925,480 bytes`; payload, ledger, and manifest total `161,957,892 bytes`.
Construction on the named RTX 2060/D3D11 WebGL2 configuration takes `22.8 s`.

Accepted superseding run
`000577-point-local-scene-cache-p9-resources-lifecycle` proves complete load,
upload, atomic publication, failed-build preservation, replacement,
supersession, context restoration, and disposal. Exact cache texel accounting
is:

```text
steady resident             161,925,480 bytes
atomic replacement          323,850,960 bytes
replacement plus staging    485,776,440 bytes
```

Observed host-clock measurements are `832 ms` load, `117 ms` first upload,
`59 ms` replacement upload, `140 ms` restoration upload, and `64 ms` for a
twelve-frame 640-by-400 single-cache-lookup kernel batch. WebGL does not expose
opaque driver overhead, so the evidence selects support only for the named
RTX 2060 execution and does not claim a general GPU-memory ceiling.

Production PA5 proof
`tmp/extraterrestrial/production-adoption/pa5-lifecycle-20260829-7` exercises
the production exact-seam loader/controller on the same named RTX 2060. It
passes exact reuse, failed-replacement preservation, same-context complete
replacement, old-cache retirement, real WebGL context loss/restoration,
asset-backed reconstruction, and idempotent disposal with zero final WebGL
errors. Its exact-seam logical accounting is `150,235,908 bytes` resident,
`300,471,816 bytes` for two complete resident caches during atomic replacement,
and `450,707,724 bytes` with one candidate payload staged. Lost-context GPU
objects are released while their original context is lost; the exact validated
asset selection remains the restoration authority and is reloaded only after
the new context exists.

## Validation Contract

### Hard Algorithm32 B1 non-regression gate

Production consideration requires the point-local cache path to meet or beat
the current accepted Algorithm32 result on the unchanged B1 directional
spectral-radiance benchmark. Lower RMSE is better. The operational ceiling is
the reflection-completed F68 aggregate accepted by run `000479`:

```text
aggregate spectral RMSE <= 11.820391604126252 mW m^-2 sr^-1 nm^-1
```

The gate now passes in accepted run
`000545-point-local-scene-cache-b1-non-regression` at
`11.554012538468113`, or `0.26637906565813907` below the ceiling, on the
complete Direct40/W27/F68/N4/Q30 observable. Accepted derivative run `000546`
preserves all six figures from its sealed candidate table. Production remains
unchanged; this is contained qualification evidence, not promotion.

The first runtime-sized spectral follow-up cannot be judged against that
Direct40 ceiling alone. Run `000549-point-local-scene-cache-b1-native15-retention` averages
the Direct40 source irradiance, Rayleigh coefficient, Mie extinction, and
ground albedo independently into the canonical fifteen equal-width bins,
executes the actual GPU recurrence at those inputs, and reconstructs the B1
coordinates by piecewise-constant hold. It scores `12.293121003109862`, or
`0.4727293989836099` above the previous model's Direct40 score. Its 31-channel representation
difference from Direct40 is `3.8546085068418026`. That is an absolute
Direct40-to-Native15 loss measurement, not a matched architecture gate.
Run `000551` preserves the complete requested visual evidence regardless of
that initially unmatched gate.

Accepted run `000558-previous-model-b1-native15-comparison` applies the exact
same fifteen physical inputs and reconstruction to the previous model. It
scores `12.586323005727962`, making the point-local Native15 result
`0.29320200261810037` better. The previous and point-local Native15 penalties
relative to their own Direct40 controls are respectively `0.7659314016017102`
and `0.739108464641749`. Thus the point-local representation passes matched
Native15 non-regression and loses slightly less accuracy during reduction.
Run `000559` owns the complete fair visual comparison.

The accepted result follows three preserved defect isolations. Rejected run
`000535` found that direct J1 phase used local `+Z` instead of the row's actual
local source vector. Rejected run `000536` corrected that vector but remained
at `14.699769088419915`. Run `000539` then showed that above-horizon exact-
ground J1 taps were zero because binary32 representative-point roundoff could
place the nominal `0 m` node slightly inside the sphere. Run `000543` located
the external discrepancy at J1 by executing current Algorithm32 at cumulative
orders one through four. Run `000544` proved the boundary-aware visibility
correction through J3, then exposed a J4 spike caused by the still-narrower
ground-origin inward-transport boundary rule. The accepted implementation
uses one `1 m` binary32-safe exact-ground policy for both source visibility
and inward transport rejection. Pre-`000545` appearance evidence remains
plausibility evidence only; it cannot qualify physical accuracy.

This is the B1 measurement score, not image RGB RMSE and not a direct
candidate-to-Bruneton pixel difference. It uses all 17 captures, 81 directions
per capture, and the 31 scored wavelength samples from 360 through 712.5 nm;
the aggregate remains `sqrt(sum(per_time_rmse^2) / 17)`. The candidate must be
read through the point-local scene-cache consumer with the selected live view
integration. It may not substitute an unprojected solver field, change the B1
measurements or preprocessing, apply exposure/display transforms, or tune the
threshold after seeing output.

The complete accepted 17-time F68 score vector remains comparison evidence and
must be reported beside the candidate so an aggregate pass cannot hide where
accuracy moved. The hard threshold is the aggregate unless the owner later
selects per-time non-regression as an additional gate. Bruneton's reproduced
`11.28323859` score remains external context, not this promotion threshold.
Failure blocks production promotion but does not prevent further contained
diagnosis and refinement.

The first implementation remains a plausibility POC, but qualification of the
selected design requires:

- exact recurrence wiring through J4;
- finite and nonnegative Native15 field values;
- direct actual-point source visibility and event splitting;
- held-out interpolation tests in altitude, local solar zenith, and outgoing
  direction;
- scene-support closure for every runtime stencil;
- comparison of direct Native15 with a conservatively reduced 40-wavelength
  build;
- an independently implemented, physically matched Bruneton comparison;
- sparse over-resolved actual-point GPU oracles;
- San Jose solar-noon, sunset, civil, nautical, and antisolar controls;
- near-ground, terminator, weak-blue, and shortened-object queries;
- camera rotation and declared translation-support queries;
- object-shortened path composition;
- complete payload, staging, resident, and observed driver-memory ledgers;
- atomic publication, cache swap, context restoration, and disposal; and
- unconditional writing of requested diagnostic images even when a gate
  fails.

Accuracy thresholds and denominator floors are frozen before candidate output
is inspected. Daylight energy may not hide weak twilight failure.

### P8 owner decision

Accepted run `000569-point-local-scene-cache-p8-owner-decision` completes P8
and selects the current Native48/Z180/W27/F68/N4/Q30 candidate. Its external
accuracy evidence is Direct40 B1 `11.554012538468113` against the frozen
`11.820391604126252` ceiling and matched Native15 B1
`12.293121003109862` against the previous model's `12.586323005727962`.

Run `000568` remains immutable evidence of an earlier interpretation that
treated a shifted-grid comparison as a promotion gate. Run `000569`
supersedes only that interpretation: the shifted execution is a numerical
sensitivity diagnostic within our own solver, not external accuracy data or
continuum truth. Its results do not reject the B1-qualified current grid.

The quadratic-altitude/terminator-dense experimental grid remains rejected by
its unchanged Direct40 B1 result `18.47808688506421`; all six of its B1 figures
remain preserved in run `000567`. No refined grid is selected by implication.
P9 has now measured the current uncompressed candidate and P10 has qualified
one exact codec. Neither phase authorizes production integration.

## Scope Boundaries

The selected design covers a radially stratified spherical atmosphere and a
distant collimated Sun. It does not select coordinates for the existing
Flat/dome finite local Sun. A later local study may reuse the compiler,
Native15, recurrence, ledger, loading, and lifecycle infrastructure but must
independently prove its position/source coordinate sufficiency.

The design does not include:

- clouds, terrain-dependent atmospheric shadows, or horizontal atmosphere
  variation;
- dynamic atmosphere composition inside one cache;
- object-cast volumetric shadows;
- a new Color or exposure model;
- stellar, Sun-tile, or Moon raster representation; or
- production promotion.

## Open Decisions

The stored semantic and primary coordinates are selected. Remaining decisions
are:

- whether later caches expand beyond P0's fixed San Jose observer,
  complete-rotation, arbitrary-shortened-endpoint support;
- whether later evidence should reopen the selected Native48/Z180 mappings;
- broader supported-hardware resident, transition, and opaque-driver limits;
- cache-swap behavior for deferred discrete Sun animation; and
- whether lossy codecs should ever be studied beyond the qualified exact seam
  deduplication; and
- broader observer/support regions beyond the qualified one-degree inventory.

## Current Conclusion

The selected correction does not change Geometry's ray termination or
Algorithm32's live sampling structure. It makes each existing path sample
zenith-aware by querying one point-local scene cache with actual altitude,
actual local solar zenith, and actual source-relative outgoing direction.

The contained implementation now stops projecting solver fields through a
fixed observer. It packs selected local `(altitude, mu_s)` rows from the
actual-point N4 solver, publishes them as one scene cache, and consumes them
from the ordinary Algorithm32 integration loop. Its qualification sequence is
complete.
The selected handoff is the Native48/Z180/W27/F68/N4/Q30 point-local design,
with uncompressed Native15 retained as its oracle and exact seam deduplication
qualified as the preferred stored representation. Production PA1 through PA5
now own the executable contracts/domains, exact offline compiler, immutable
two-texture resident upload, point-local lookup, exact asset direction, and
quadratic-near-observer Q30 live transport inside Geometry's endpoint, and
transactional exact-cache publication, resource policy, and context recovery.
PA6 production numerical and scene qualification is complete. PA7 is owner-
selected and complete; the six-state deployment catalog, runtime-only package
emitter, obsolete receiver-column GPU-runtime removal, and mandatory exact-
asset migration of the older celestial-composition WebGL fixture are
implemented. The complete 0-degree through 108-degree construction inventory,
byte-level verification, bin-covered runtime derivative, scalar resolver, and
Flat32 integration are complete. The focused
[Flat32 hookup plan](../production/flat32-one-degree-cache-hookup-plan.md)
records the qualification and release evidence.
