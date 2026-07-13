# Distant-Sun Solar-Zenith Spectral Cache Design

Status: active canonical research design under representation reconsideration,
current through 2026-08-27. This document owns the numerical design space for
the proposed replacement of the spherical/distant atmosphere's reduced
reference-column cache. No successor stored semantic, grid, packing, or
resource limit is selected. It does not authorize a production change or an
accuracy claim. The
[distant-Sun execution plan](distant-sun-solar-zenith-cache-plan.md) owns any
contained implementation phase; none has started. All experiments remain
contained under `scripts/extraterrestrial/` and `tmp/extraterrestrial/`.

This is a **solar-zenith** cache design. In this document, "zenith page" means
a page along the solar-zenith coordinate `mu_s`; it does not mean a page along
the view-zenith coordinate `mu`. That term applies to the origin-indexed
candidate. The canonical-prefix candidate may use differently keyed chunks
and must not be mislabeled as a `mu_s` page.

The document distinguishes established current behavior from unselected
research candidates. The missing `mu_s` state is established. Run `000497`
provides strong causal evidence that the omitted actual-point direct
first-order term accounts for nearly all of the focused source-axis valley.
Branch-length-indexed cumulative path-radiance integrals, a boundary-total
field, and an actual-point cumulative local-density field are all candidates.
Run `000498` now supplies a first exact geometry/storage census for culling the
local-density candidate by observer Sun state; it does not select that
representation or establish spectral accuracy.

## Authority And Relationships

- The [implemented cache contract](cache-contract.md) remains runtime authority
  until a separately qualified successor is promoted.
- The [cache interface design](cache-design.md) owns compatible runtime program
  reuse, loading, atomic publication, failure preservation, context
  restoration, and disposal mechanics. This document owns the proposed
  offline numerical compiler and field representation.
- The [distant-Sun execution plan](distant-sun-solar-zenith-cache-plan.md)
  owns implementation order, phase status, immutable evidence, and acceptance
  gates. This design remains the numerical authority.
- The [spherical twilight cache-coordinate correction][twilight-correction]
  owns the accepted actual-point diagnosis that motivates this design.
- The [celestial appearance architecture][appearance-design] owns boundary
  composition, Color separation, and the retained `000493`--`000495`
  appearance and ozone diagnostic evidence. The linked twilight-correction
  section owns run `000497` and its focused actual-point J1 diagnosis; this
  design consumes that inference when selecting the replacement field. The
  atmosphere remains the owner of ozone absorption/extinction.
- The pinned Bruneton reference dimensions and mappings are retained in
  [constants.h][bruneton-constants], [functions.glsl][bruneton-functions], and
  [demo.cc][bruneton-demo].

[twilight-correction]: ../../extraterrestrial/celestial-contribution-cache-design.md#spherical-twilight-cache-coordinate-correction
[appearance-design]: ../../extraterrestrial/sun-disk-appearance-design.md
[bruneton-constants]: ../../../../references/downloads/bruneton-precomputed-atmosphere-34f14e7/constants.h
[bruneton-functions]: ../../../../references/downloads/bruneton-precomputed-atmosphere-34f14e7/functions.glsl
[bruneton-demo]: ../../../../references/downloads/bruneton-precomputed-atmosphere-34f14e7/demo.cc

## Decision Summary

The current decision state is:

1. replace the observer-column twilight approximation with a spherical field
   that preserves actual-point `r`, `mu`, `mu_s`, and `nu` physics;
2. retain wavelength-resolved Native15 data through atmosphere transport and
   reconstruct Native15 before Color;
3. build transport truth offline and spend offline time where terminator,
   horizon, source-relative, and near-ground behavior changes rapidly;
4. compare, without preselection, an actual-point cumulative local-density
   field with branch-integrated checkpoints, a canonical whole-ray prefix,
   and a single-boundary-total endpoint representation;
5. quantify complete assets, runtime residency, staging, atomic replacement,
   and observed driver allocation before choosing a representation or memory
   ceiling;
6. treat run `000498`'s zenith-culling result as geometry/logical-byte evidence
   for the local-density candidate only; and
7. measure spectral redundancy and codecs only after an uncompressed physical
   representation passes accuracy gates.

The work covers only a radially stratified spherical atmosphere illuminated
by a distant collimated Sun. It may produce reusable compiler, spectral,
manifest, loading, and lifecycle machinery, but it selects no finite/local-Sun
coordinates, field layout, asset, or production contract.

## Why This Design Exists

### Current nautical-twilight symptom

The focused scene is run `000466`'s San Jose
`sunset-plus-one-hour` configuration:

- UTC `2024-06-21T04:26:03.503Z`;
- solar elevation `-9.7568177355 degrees`, geometrically within nautical
  twilight;
- observer height `1.7 m`;
- sunset-facing camera at about `5 degrees` elevation; and
- the retained source-luminance-lift Color model.

The rendered sunset horizon contains two broad red/brown flanks separated by a
deep minimum at the projected solar azimuth. The current evidence favors one
source-centered luminance depression or annular shoulder whose screen
cross-section looks like two lobes. It does not favor two independent
screen-fixed lobes.

The feature is already present in diffuse Native15 path radiance before
celestial composition and Color. At zero-degree sky elevation in run `000493`,
the source-axis photopic luminance is about `0.00342847 cd m^-2`, while the
equal flanks near source-relative azimuth `-50` and `+50 degrees` are about
`0.01361185 cd m^-2`, roughly four times brighter.

### What the recent controls ruled down

- Reflection-completed Fibonacci-68 removes the earlier left/right numerical
  imbalance but does not remove the radial topology.
- Run `000493` changes ozone, incoming quadrature, and outgoing W27-to-W39
  storage together. It proves that the depression survives that combined
  configuration, not which of those three changes is individually immaterial.
- Run `000494` then isolates W39 from a W77-density camera-facing outgoing
  patch. It leaves `98.0391%` of displayed pixels byte-identical, moves every
  changed channel by only one code, and leaves the raw spectral topology
  effectively unchanged. This rules down the tested W39-to-W77 refinement;
  it does not independently isolate W27 from W39.
- The isolated B1 ozone comparison lowers every retained boundary-radiance
  value but has a small, mixed effect on measurement RMSE. Together with the
  combined twilight run, this shows that ozone has a real spectral effect and
  that the ozone-enabled configuration retains the depression. It does not
  make ozone itself an isolated twilight-topology control.
- The front/back control in run `000495` does not reproduce the strong feature
  behind the camera. Its sunset-facing peak-to-center ratio is about `4.22`,
  versus about `1.47` behind.
- The current source/outgoing phase conventions have been traced through CPU
  and GPU paths and do not support a simple incoming/outgoing sign inversion
  as the cause.

These are diagnostic eliminations, not proof that every angular discretization
is adequate. They make a missing spherical position coordinate the highest-
value next hypothesis.

### Actual-point direct-light causal control

Contained run
`000497-san-jose-nautical-twilight-actual-point-j1-control` is accepted
diagnostic evidence (artifact-set SHA-256
`3460c9e3b4d450757861ad57ef9ae459d0a34b2d52af729611a68638cae82877`).
It preserves the exact run-`000493` ozone/F68/W39/N4 cache, product, camera,
Color, and scene. One handle first renders that current result, then adds only
direct first-order radiance integrated at each actual view-path point. It does
not rebuild the cache and does not feed the added term into J2--J4. The
toggle-off PNG is byte-identical to run `000493`.

At zero-degree sky elevation, the independent binary64 `320 x 320` control
finds:

```text
current center                 0.0034284716091 cd m^-2
current mean +/-50-degree flank 0.0136118522177 cd m^-2
actual-point L1 center          0.0109779150570 cd m^-2
actual-point L1 mean flank      0.0010788592759 cd m^-2
hybrid center                   0.0144063866661 cd m^-2
hybrid mean flank               0.0146907114936 cd m^-2
```

The actual-point term closes `97.20795%` of the original center/flank deficit.
The browser's production-count `15 x 15` calculation closes `99.95389%`, and
its Native15 result agrees with the independent binary64 calculation at the
same count within the retained comparison evidence. The augmented image turns
the deep two-flank cross-section into a continuous source-facing horizon band.

This strongly supports missing actual-point solar-zenith/terminator state as
the cause of the focused luminance deficit. It is not a qualified replacement
cache: J2--J4 still come from the old receiver-column recurrence, the full
field has not been recomputed in `(r, mu, mu_s, nu)`, and the converged oracle
currently covers the three decisive horizon rays rather than every pixel.

### The current reference-column defect

The spherical/distant cache currently stores altitude and a source-relative
outgoing direction. For every altitude, its construction point lies on the
single radial column above the observer. Runtime view-path points are reduced
back to altitude and sample that column.

This loses the local solar zenith at the actual point. A real horizon ray moves
through points whose local radial normals rotate with Earth curvature. Two
points at the same altitude can therefore have different Earth-shadow status
and very different source-path transmittance.

At the focused solar depression, a point must be about

```text
h_visible = R * (sec(9.7568177355 degrees) - 1)
          ~= 93,342 m
```

above a spherical Earth before the Sun just clears the geometric limb. The
current atmosphere ends at `60,000 m`; its highest Native48 cache node is
`59,375 m`. Consequently every stored first-order source sample on the
observer column is ground-blocked in this scene.

The order evidence agrees:

- run `000471` has exact-zero N1 along the complete retained horizon trace;
- pure N2 is the first nonzero contribution and already has the depression;
- at N2, center luminance is about `20.83%` of the symmetric flank maximum;
  and
- N3 and N4 add positive energy but reinforce rather than remove the topology.

This does not prove the corrected answer must be bright at the center. It does
prove that the present cache cannot represent first-order sunlight reaching a
distant point along a curved horizon when the same-altitude observer-column
point is shadowed.

## Rejected Shortcuts

### Build the vertical column directly below the Sun

Moving the one construction column to the subsolar point would make that
column sunlit, but it would only move the approximation error:

- the observer and antisolar sky would incorrectly reuse a subsolar column;
- actual points on opposite sides of the terminator would still collapse to
  the same altitude state;
- the field would remain tied to one source placement and require rebuilding
  as the Sun moved; and
- the source-facing horizon could become systematically too bright rather
  than physically correct.

A single column cannot represent both sides of a spherical terminator.

### Add the Sun angle only to the cache identity

Rebuilding the same reduced field for every Sun angle does not restore the
actual point's local radial normal along a view path. It makes the cache
placement-specific without adding the missing state.

### Keep increasing incoming or outgoing direction counts

Those remain useful convergence controls. Run `000471` isolates the reflected
incoming quadrature, and run `000494` isolates the W39-to-W77 camera patch;
neither materially changes the topology. Run `000493` retains it under the
combined F68/W39/ozone configuration, although it does not isolate W27 from
W39. None of these changes adds Earth-shadow position information.

### Repair the result in ozone or Color

Ozone is a real atmosphere-owned extinction term and should remain available,
but it is not a terminator coordinate. Color receives the already-depressed
spectrum and cannot restore missing path radiance without becoming a scene-
specific correction.

## Coordinates And Physical Meaning

For sample position `p`, outward view direction `v`, and distant-Sun direction
`s`, define:

```text
r    = length(p)
mu   = dot(p, v) / r       = cosine of view zenith
mu_s = dot(p, s) / r       = cosine of solar zenith
nu   = dot(v, s)           = cosine of view/Sun separation
```

Equivalently, if `theta_s` is the local solar zenith angle,
`mu_s = cos(theta_s)`. Solar elevation above the local horizon is
`asin(mu_s)`.

The local transport state used by the offline solver is therefore:

```text
J_<=N(r, mu, mu_s, nu, lambda)
```

where `J_<=N = J1 + ... + JN` and `lambda` is a Native15 spectral
channel. The actual-point cumulative-density candidate retains this state;
the branch-integrated candidates instead retain completed integrals
constructed from it.

For a declared ray branch `g`, define its anchor `p0(g)`, outward direction
`v(g)`, and path

```text
p_g(t) = p0(g) + t * v(g)
tau_g(t, lambda) = integral from 0 through t of beta_ext(p_g(q), lambda) dq
F_N(g, ell, lambda) = integral from 0 through ell of
    exp(-tau_g(t, lambda)) * J_<=N(p_g(t), v(g), lambda) dt
```

`F_N` has path-radiance units `W m^-2 sr^-1 nm^-1`. Every retained
`F_N(..., ell_i, ...)` is a separately completed integral from the branch
anchor through physical length `ell_i`. It is not one term in a discrete sum
of checkpoints. `N_ell`, the number of retained checkpoints, is independent
of the much larger offline quadrature count used to evaluate each integral.

Branch length `ell` is measured in metres and obeys
`0 <= ell <= ell_max(g)`. A storage mapping may expose dimensionless
`u_ell = phi_g(ell)` in `[0, 1]` and integer checkpoint index `i_ell`; neither
is the physical unit. The asset must identify the anchor, orientation,
ground-versus-space branch, terminal boundary, exact checkpoint distances or
their deterministic warp, inverse mapping, and interpolation rule.

The ground/space branch is derivable from ray geometry rather than a freely
sampled physical dimension, but it must remain explicit in lookup semantics.
Interpolation must never cross disconnected branch kinds merely because
their packed coordinates are adjacent.

The four geometric coordinates separate the information that the current
cache folds together:

- `r` locates the point vertically;
- `mu` describes the path relative to the local radial direction;
- `mu_s` locates the point relative to the terminator; and
- `nu` preserves source-relative scattering angle.

### Branch-coordinate layout fork

The checkpoint-integral semantic is one candidate; its address layout is also
open. A future evidence phase may compare two checkpoint representations and
the single-boundary-total endpoint comparator defined below.

**Origin-indexed checkpoints** retain the camera-origin invariants and add a
fifth coordinate:

```text
F_N(r, mu, mu_s, nu, ell, lambda)
```

This makes a sky query's `mu_s` page pair straightforward and returns an
origin-to-endpoint integral directly. It repeats prefixes for neighboring
origins and multiplies storage by the retained branch-checkpoint count.

**Canonical whole-ray prefixes** describe one connected participating-medium
interval of an oriented line by its closest-approach vector `b_vector` and
signed distance `x` from closest approach. Each connected interval has its own
upstream anchor in the `+v` orientation. A prefix never crosses opaque ground;
if ground separates two atmospheric intervals, they have distinct branch keys
and anchors. Let

```text
b   = length(b_vector)
eta = dot(normalize(b_vector), s)
nu  = dot(v, s)
q(x) = b_vector + x * v
```

Because `normalize(b_vector)` is perpendicular to `v` and `s` is a unit
vector, valid canonical coordinates also obey

```text
eta^2 + nu^2 <= 1.
```

Then

```text
r(x)    = sqrt(b^2 + x^2)
mu(x)   = x / r(x)
mu_s(x) = (b * eta + x * nu) / r(x)
```

Away from the radial degeneracy, the inverse from an origin state is

```text
x   = r * mu
b   = r * sqrt(1 - mu^2)
eta = (mu_s - mu * nu) / sqrt(1 - mu^2)
```

This can replace origin `r`/`mu` plus a separate length multiplier with a
canonical prefix field such as `F_N(b, eta, nu, x, lambda)`. A segment from
ordered signed coordinates `a <= b_end` in the same connected atmospheric
interval is reconstructed from prefix values and prefix transmittance:

```text
L(a -> b_end, lambda) =
    [F_N(b_end, lambda) - F_N(a, lambda)] / T(a, lambda)
T(a -> b_end, lambda) = T(b_end, lambda) / T(a, lambda)
```

where each `T(x)` is measured from that interval's same upstream anchor and
`T(a)` must be positive and numerically representable. The identity is not
defined across opaque ground or a zero/underflowed prefix. This layout may
avoid the fifth-axis multiplier, but `eta` varies across view rays; the
ordinary camera-wide two-`mu_s`-page claim no longer follows. It also must
qualify cancellation in short segments, division by weak transmittance,
ground-intersecting versus tangent/space branches, and the degeneracies at
`b = 0` and `abs(mu) = 1`. At `b = 0`, `eta` is undefined and the asset must
use a separately declared radial convention rather than an arbitrary value.

**Single-boundary-total endpoint algebra** remains a candidate comparator, not
a checkpoint representation. Let `B_N(x, lambda)` be the already-
integrated radiance from state `x` to the forward terminal boundary of the
same connected branch. For an endpoint `y` downstream of `x`,

```text
L(x -> y, lambda) =
    B_N(x, lambda) - T(x -> y, lambda) * B_N(y, lambda).
```

Both boundary lookups must use geometrically consistent actual-point states,
and the interval from `x` through `y` must not cross opaque ground. This
representation can avoid an explicit retained length axis, but subtraction of
near-equal values can lose short-segment precision. The execution plan must
build and qualify it on the same endpoint corpus before claiming that branch
checkpoints justify their additional memory.

No size or residency advantage is accepted until the plan measures this fork.

The cosine coordinates are coupled. For fixed `mu` and `mu_s`, physically
valid `nu` lies within

```text
mu * mu_s - sqrt((1 - mu^2) * (1 - mu_s^2))
  <= nu <=
mu * mu_s + sqrt((1 - mu^2) * (1 - mu_s^2))
```

The page/address mapping must preserve that domain and its clamping rules.
Nominal rectangular texture slots outside it are storage artifacts, not
independent physical states. The asset compiler must define how invalid slots
are populated, and the runtime must never interpolate an invalid value as if
it were an independent solution. Qualification must cover the degeneracies at
`mu = +/-1` and `mu_s = +/-1`, where the admissible `nu` interval collapses.

The geometric source-shadow boundary at radius `r` is

```text
mu_s_shadow(r) = -sqrt(1 - (R_ground / r)^2)
```

for a point-source Sun with no refraction. A rectangular `r x mu_s` lattice
cuts diagonally across this boundary. Grid mapping and interpolation must not
leak a material direct-source contribution across it.

For a radially stratified atmosphere and uniform spherical ground, absolute
longitude, latitude, and solar azimuth are not independent cache dimensions.
Geometry reconstructs the four invariants from world-space state. This makes
one asset reusable across locations, times, and Sun azimuths.

That reuse has limits. A different atmosphere composition, planet radii,
height profile, ground model, source spectral shape, scattering-order policy,
or numerical integration policy is a different asset. Horizontal clouds,
terrain, weather, or nonuniform ground break the assumed symmetry.

## What The Current Algorithm32 Cache Stores

The persistent spherical/distant field is cumulative spectral scattering
density:

```text
C4(lambda) = J1(lambda) + J2(lambda) + J3(lambda) + J4(lambda)
```

Its units are `W m^-3 sr^-1 nm^-1`. One persistent sample is identified by:

- one of 48 altitude nodes;
- one outgoing cubed-sphere direction; and
- one of 15 wavelength channels.

At N4 the construction graph transiently builds `J1`, `L1`, `J2`, `C2`,
`L2`, `J3`, `C3`, `L3`, `J4`, and `C4`. Only cumulative `C4` remains resident
after last-use disposal. Historical Fibonacci-34 and current
reflection-completed Fibonacci-68 directions are construction quadrature for
the transient `L` fields; they are not a persistent cache axis.

The runtime reconstructs camera radiance by integrating this density along a
view path:

```text
L(lambda) = integral T_view(s, lambda)
                     * C4(p(s), v, lambda) ds
```

Branch length is not a current cache index. Geometry resolves a camera-ray
start and endpoint from atmosphere, ground, and scene intersections; the live
transport then approximates the integral with the configured 15 uniform view
intervals. Those 15 quadrature intervals are transient numerical work, not 15
stored partial integrals. A branch-integrated candidate moves that integral
offline and may retain completed branch checkpoints; the cumulative-density
candidate retains a separately qualified live branch integral.

Each stored 15-channel vector already encodes:

- source spectral irradiance;
- Rayleigh and Mie spectral coefficients;
- altitude densities;
- phase evaluated for its directions;
- source-to-point extinction and Earth-shadow decisions;
- ground reflection when enabled;
- all retained scattering orders; and
- ozone absorption when the ozone atmosphere definition is selected.

It does not store final view-integrated sky radiance, view transmittance,
optical depth, separate Rayleigh/Mie/ozone coefficients, separate scattering
orders, RGB, or sub-bin spectral detail.

### Current resident field sizes

All values below are one cumulative Native15 `R32F` field, excluding transient
construction fields and metadata. W27 is the implemented outgoing layout;
W39 and the camera patch are contained diagnostic layouts.

| outgoing layout | directions | dimensions | resident bytes | resident MiB |
| --- | ---: | --- | ---: | ---: |
| W27 | 4,374 | `4374 x 48 x 15` | 12,597,120 | 12.014 |
| W39 | 9,126 | `9126 x 48 x 15` | 26,282,880 | 25.065 |
| W39 plus camera patch | 15,821 | `15821 x 48 x 15` | 45,564,480 | 43.454 |

Naively adding 32 solar-zenith slices to the implemented W27 density field
would make the complete scattering asset about `384.43 MiB`, with two
uncompressed resident pages costing about `24.03 MiB`. At the contained W39
diagnostic resolution those figures are `802.09 MiB` and `50.13 MiB`.
More importantly, the live path integrator could traverse several `mu_s`
intervals along one ray. Merely adding a page axis to this representation does
not automatically produce a two-page runtime.

## Bruneton Reference Architecture

The pinned Bruneton reference under
`references/downloads/bruneton-precomputed-atmosphere-34f14e7/` uses the same
four geometric coordinates. Its default scattering dimensions are:

```text
r     = 32
mu    = 128
mu_s  = 32
nu    = 8
```

They are packed as a `256 x 128 x 32` 3D scattering texture, with the x axis
combining `nu` and `mu_s`. The same reference uses a `256 x 64`
transmittance texture and a `64 x 16` irradiance texture.

With combined scattering textures and half precision, the retained reference
resource sizes are:

| resource | format | size |
| --- | --- | ---: |
| transmittance | `RGBA32F 256 x 64` | 0.250 MiB |
| scattering | `RGBA16F 256 x 128 x 32` | 8.000 MiB |
| irradiance | `RGBA32F 64 x 16` | 0.015625 MiB |
| total | | 8.265625 MiB |

Using full float for scattering makes the total `16.265625 MiB`. These are
sizes for Bruneton's three-channel reference representation, not acceptable
Native15 storage sizes for this project.

The Bruneton demo precomputes the LUT at startup. It does not load a disk
asset, and it keeps the complete `mu_s` dimension resident. Its important
architectural precedent is that one field supports any Sun placement in the
configured solar-zenith range without rebuilding.

Its scattering lookup is a boundary-integrated representation; it does not
establish this project's branch-checkpoint count, finite-segment algebra, or
memory. The reference dimensions remain a useful geometric comparator, not a
claim that adding `N_ell` checkpoints is free.

The half-precision Earth demo sets its maximum solar zenith to `102 degrees`,
or `-12 degrees` solar elevation; its full-float configuration uses
`120 degrees`, or `-30 degrees`. Its nonlinear `mu_s` mapping deliberately
concentrates samples around the horizon. At ground radius, the first default
half-precision sample elevations are approximately:

```text
-12.0000, -10.1205, -8.5516, -7.2087, -6.0336, -4.9853 degrees
```

The focused `-9.7568-degree` Sun lies between the second and third samples.
An instantaneous ground-sky query therefore needs those two pages. Covering
the entire closed nautical band from `-12` through `-6 degrees` at once would
touch the first six samples because `-6 degrees` lies just above the
`-6.0336-degree` sample. Ordinary streaming does not keep that whole band
resident simultaneously.

The default range is insufficient for astronomical twilight. A project asset
must declare its supported solar-elevation interval explicitly. The likely
**dense twilight qualification interval** is at least `+5` through
`-24 degrees`, with allocation concentrated around the terminator rather than
uniformly in angle or cosine. A general replacement must additionally cover
daylight through `+90 degrees`, either in the same mapping or in a separately
identified compatible bright-sky asset; `+5 degrees` is not a complete upper
support limit.

## Candidate Stored Quantities

### Candidate semantic: cumulative integral checkpoints

The runtime candidate stores `F_N(g, ell_i, lambda)`, the completed Native15
path-radiance integral from a declared branch anchor through checkpoint length
`ell_i`. The terminal checkpoint equals the conventional full-boundary
integrated-radiance result. Intermediate checkpoints support object-shortened
paths and arbitrary atmospheric endpoints without marching the local density
field at runtime.

Runtime interpolates a completed integral as a function of requested physical
length. It never sums stored checkpoints. For a nonnegative medium and source,
each spectral channel must be finite, nonnegative, and nondecreasing with
`ell`, subject only to a declared numerical tolerance.

Native15 transmittance or optical depth is a first-class companion quantity.
It is used for celestial boundary attenuation and, if the canonical prefix
layout wins, for segment subtraction. Integrated atmospheric radiance already
contains view attenuation over its declared prefix and must not be attenuated
a second time.

### Address-layout candidates

The two candidates in
[Branch-coordinate layout fork](#branch-coordinate-layout-fork) implement the
same integral semantic:

1. origin-indexed `(r, mu, mu_s, nu, ell)` checkpoints; and
2. canonical whole-ray prefixes such as `(b, eta, nu, x)`.

The first is simpler and preserves direct `mu_s` page selection, but branch
checkpoints are a fifth storage multiplier. The second can replace origin
redundancy rather than add an axis, but changes page locality and needs two
conditioned prefix reads for a finite segment. The plan selects between them
using held-out physical error, disk and resident bytes, query-trace page
unions, texture fetches, and numerical conditioning.

### Boundary-total and local-density comparators

A single Bruneton-like boundary total remains a useful memory and full-sky
comparator. On one connected branch it reconstructs a downstream endpoint by
`L(x -> y) = B(x) - T(x -> y) * B(y)`. The plan builds and qualifies that
identity on the same endpoint corpus, including short-segment cancellation,
weak transmittance, and opaque-ground exclusion. It is not assumed sufficient
merely because its storage is smaller.

The `mu_s`-extended Algorithm32 local-density field remains an over-resolved
oracle and a runtime candidate alongside the integrated representations. One W39
Native15 `R32F` density page is already `25.065 MiB`, and a live path can cross
many `mu_s` intervals. It is valuable for validating recurrence and branch
integrals without implying that its layout should ship.

A tangent ray through the current 60-km atmosphere can rotate the local radial
normal by as much as about `7.839 degrees`. The offline solver must preserve
that changing actual-point state through J1--J4; it may not construct branch
integrals from the current receiver-column `C4` field.

### Selection boundary

No stored semantic is selected. Address layout, checkpoint policy when
applicable, transmittance representation, grid, precision, physical packing,
and residency remain open. The purpose of contained prototypes is to establish
which uncompressed field reproduces actual-point spherical transport at all
retained orders within a viable measured resource envelope, not merely which
one makes a pleasing twilight image.

This contained numerical prototype may construct the canonical distant-source
field directly. It does not select a live transformed-source ingress or a
common local/far API; those remain later production-integration decisions. Any
production promotion must
reconcile the accepted field with that source-transform interface; that API
sequencing does not own or block the contained numerical truth experiment.

## Spectral Contract

The runtime atmosphere remains spectral. `RGB coefficient` is not an accepted
description of the project cache.

The first retained basis remains Native15: 15 bin-average channels spanning
`360` through `830 nm`, with width `31.3333333333 nm` and centers:

```text
375.6667, 407, 438.3333, 469.6667, 501,
532.3333, 563.6667, 595, 626.3333, 657.6667,
689, 720.3333, 751.6667, 783, 814.3333 nm
```

Offline construction may use a much finer wavelength grid, more integration
samples, and higher numerical precision. The accepted asset compiler must
conservatively reduce that result into the declared Native15 bin-average
semantics. Runtime lookup reconstructs Native15 before celestial composition,
material response, or Color. Integrated atmospheric path radiance already
contains attenuation along its view path and must not be multiplied by view
transmittance a second time. Native15 transmittance remains a separate lookup
for attenuating extraterrestrial boundary radiance and for the declared
endpoint/segment reconstruction algebra.

Color conversion remains downstream:

```text
Native15 atmospheric path radiance
  + Native15 transmittance * Native15 celestial boundary radiance
  -> one source-independent Color boundary
```

No cache codec may convert the atmosphere to RGB internally and later label
the result spectral.

### Boundary-only Native15 reference sizes

These figures describe one terminal boundary total per geometric state. They
are a comparator, not the size of an origin-indexed checkpoint field. One
default-resolution `mu_s` page contains `32,768` nominal rectangular storage
slots. Some `(mu, mu_s, nu)` slots lie outside the physical domain; the byte
arithmetic still counts them.

| representation | bytes/page | MiB/page | two pages |
| --- | ---: | ---: | ---: |
| direct 15-channel `R16F` payload (quantized) | 983,040 | 0.9375 | 1.875 MiB |
| four `RGBA16F` groups (16 slots) | 1,048,576 | 1.0000 | 2.000 MiB |
| direct 15-channel `R32F` logical payload | 1,966,080 | 1.8750 | 3.750 MiB |

Across all 32 solar-zenith samples, the direct spectral boundary-radiance
payload is
`30 MiB` in 15-channel half precision or `60 MiB` in `R32F`. A four-RGBA
half layout is `32 MiB` because it carries one unused slot per state.

Native15 transmittance plus irradiance at the reference spatial resolutions
adds about `0.498 MiB` in half precision or `0.996 MiB` in `R32F` when all 15
channels are retained.

At the reference geometric resolution, a complete all-zenith Native15 asset is
therefore about `30.498 MiB` in direct 15-channel half precision,
`32.498 MiB` with four-`RGBA16F` scattering packing, or `60.996 MiB` in
`R32F`, before any separately retained Mie/order component, metadata, staging,
or codec.

These are logical scalar-payload bounds unless a physical packing is named.
For example, four `RGBA32F` groups use `2 MiB` per page, `4 MiB` for two pages,
and `64 MiB` over 32 pages; packed Native15 `RGBA32F` transmittance and
irradiance add about `1.0625 MiB`. A practical all-`RGBA32F` asset is therefore
about `65.0625 MiB`. The mixed `32.498 MiB` value above combines padded
scattering with unpadded logical global payloads and is only an arithmetic
bound.

### Origin-indexed branch-checkpoint multiplier

If `ell` is retained as a fifth axis, each solar-zenith page contains
`32 x 128 x 8 x N_ell` Native15 states. Its direct `R32F` radiance payload is

```text
bytes per mu_s page = 32 * 128 * 8 * N_ell * 15 * 4
```

At the reference geometric resolution:

| retained checkpoints `N_ell` | `R32F` MiB/page | two full pages | 32-page asset |
| ---: | ---: | ---: | ---: |
| 8 | 15.000 | 30.000 MiB | 480 MiB |
| 12 | 22.500 | 45.000 MiB | 720 MiB |
| 15 | 28.125 | 56.250 MiB | 900 MiB |
| 24 | 45.000 | 90.000 MiB | 1,440 MiB |
| 32 | 60.000 | 120.000 MiB | 1,920 MiB |

For `N_ell = 15`, direct 15-lane `R16F` is `14.0625 MiB` per page,
`28.125 MiB` for two, and `450 MiB` over 32 pages. Four-`RGBA32F` packing is
`30 MiB` per page, `60 MiB` for two, and `960 MiB` over 32 pages. These are
radiance-only logical or named-packing bytes; they exclude staging, driver
padding, metadata, and any separately stored component.

### Pre-limit memory ledger

No memory ceiling, page-count limit, or target hardware class is selected by
this design yet. The arithmetic below defines the uncompressed measurement
envelope that must precede those decisions. It keeps five quantities separate:

1. complete offline asset bytes;
2. decoded CPU bytes and compiler truth working sets;
3. steady GPU query-set residency;
4. active-plus-prefetch, successor, and retiring GPU peaks; and
5. observed renderer/driver allocation on named hardware.

The first four can be bounded from a selected packing. The fifth cannot be
derived portably from WebGL and must be measured. No compression saving is
credited anywhere in this ledger.

#### Complete origin-indexed asset sweep

Let `M = N_mu_s` and let `E_R` be the retained radiance-checkpoint count. At
the reference `32 x 128 x 8` geometric grid, one `(mu_s, i_ell)` Native15 slab
contains `32,768` spectra and costs exactly
`1,966,080 bytes = 1.875 MiB` in direct 15-lane `R32F`. Therefore:

```text
radiance MiB = 1.875 * M * E_R
```

The complete radiance-only logical payload is:

| `E_R` radiance checkpoints / `M` zenith samples | 16 | 24 | 32 | 48 | 64 |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 8 | 240 MiB | 360 MiB | 480 MiB | 720 MiB | 960 MiB |
| 12 | 360 MiB | 540 MiB | 720 MiB | 1,080 MiB | 1,440 MiB |
| 15 | 450 MiB | 675 MiB | 900 MiB | 1,350 MiB | 1,800 MiB |
| 24 | 720 MiB | 1,080 MiB | 1,440 MiB | 2,160 MiB | 2,880 MiB |
| 32 | 960 MiB | 1,440 MiB | 1,920 MiB | 2,880 MiB | 3,840 MiB |

Four `RGBA32F` groups carry one unused sixteenth lane and multiply every
radiance entry above by `16/15`; direct `R16F` divides it by two but is a
lossy later codec. The current production backend proves that scalar
`R32F` array storage can avoid RGBA padding, but the successor's physical
flattening and chunk textures are not selected yet.

Storing Native15 checkpoint transmittance on the same five axes would double
the radiance payload. Because transmittance is source-independent in the
declared static atmosphere, the leading candidate instead factors it as
`(r, mu, ell, lambda)`. Let `E_T` be its independently selected checkpoint
count. One factored `ell` slab costs
`245,760 bytes = 0.234375 MiB` in direct `R32F`, so:

```text
factored-transmittance MiB = 0.234375 * E_T
radiance-plus-factored-T MiB = 1.875 * M * E_R + 0.234375 * E_T
```

Source independence removes `mu_s` and `nu` from transmittance; it does not
prove that its metre mapping, checkpoint count, or runtime slab union matches
radiance. All following combined examples explicitly use the illustrative
matched-grid case `E_R = E_T = 15`.

For `M = 32` under that matched-grid example, radiance is exactly
`943,718,400 bytes = 900 MiB`; factored transmittance is
`3,686,400 bytes = 3.515625 MiB`; and their total is
`947,404,800 bytes = 903.515625 MiB`. Four-`RGBA32F` packing makes the same
pair `960 + 3.75 = 963.75 MiB`. A retained irradiance resource, page table,
branch mask, coordinate table, or component field is additional.

These figures count every nominal rectangular slot, including physically
invalid coupled `(mu, mu_s, nu)` states. Ragged-domain compaction is a later
measured layout, not a saving assumed by the baseline. They also assume that
checkpoint metre locations come from a compact deterministic mapping. A
distinct `R32F` length at every five-dimensional radiance state would add
`60 MiB` at `M = 32`, `E_R = 15`; `R64` lengths would add `120 MiB`.

#### Origin-indexed runtime residency

For an active page set `P`, let `E_p` be the exact set of `ell` checkpoint
indices used on page `p`, and let `T_Q` be the factored-transmittance slab set.
The general direct-`R32F` steady payload is:

```text
steady MiB = 1.875 * sum(p in P, |E_p|) + 0.234375 * |T_Q|
```

Four-`RGBA32F` changes the coefficients to `2` and `0.25`. Compatible
transitions use the set union of old and new `E_p` on every shared page plus
the union of their `T_Q` sets. Incompatible replacements add the independently
calculated old and new footprints.

The following special case assumes two bracketing `mu_s` pages, the same `Q`
distinct `ell` indices on each page and in `T_Q`, identical old/new counts,
and identical packing:

```text
steady = Q * (2 * 1.875 + 0.234375) MiB
adjacent Sun transition = Q * (3 * 1.875 + 0.234375) MiB
same-size fully incompatible replacement = 2 * steady
```

The adjacent case shares the middle immutable `mu_s` page and the factored
transmittance chunk. The same-size incompatible case assumes nothing can be
shared but keeps identical old/new counts and packing.
Each cell below is `direct R32F / four-RGBA32F` MiB:

| `Q` | representative query set | steady | adjacent shared transition | same-size incompatible replacement |
| ---: | --- | ---: | ---: | ---: |
| 1 | terminal sky only | 3.984375 / 4.25 | 5.859375 / 6.25 | 7.968750 / 8.50 |
| 2 | one interpolated finite endpoint | 7.968750 / 8.50 | 11.718750 / 12.50 | 15.937500 / 17.00 |
| 3 | terminal sky plus one distinct finite interval | 11.953125 / 12.75 | 17.578125 / 18.75 | 23.906250 / 25.50 |
| 4 | small varied-endpoint union | 15.937500 / 17.00 | 23.437500 / 25.00 | 31.875000 / 34.00 |
| 8 | wider endpoint union | 31.875000 / 34.00 | 46.875000 / 50.00 | 63.750000 / 68.00 |
| 15 | two complete checkpoint pages | 59.765625 / 63.75 | 87.890625 / 93.75 | 119.531250 / 127.50 |

The general incompatible replacement peak is `old active footprint + new
complete footprint`, using each asset's own layout, query union,
transmittance, globals, and physical packing. It is not `2 * steady` when the
successor changes any of those facts.

Exact coordinate hits can reduce a bracket. Prefetch, irradiance, lookup
tables, codec globals, diagnostic readback, pool slack, and driver allocation
are excluded. A real frame owns its exact union; the representative labels do
not establish a guaranteed `Q`.

If no `mu_s` paging is possible but `ell` chunks remain independent, all 32
zenith samples must be resident for each required checkpoint index. This
example likewise assumes equal radiance and transmittance checkpoint-index
counts:

| resident `ell` indices | direct `R32F` radiance plus factored T | four-`RGBA32F` radiance plus factored T |
| ---: | ---: | ---: |
| 1 | 60.234375 MiB | 64.25 MiB |
| 2 | 120.468750 MiB | 128.50 MiB |
| 3 | 180.703125 MiB | 192.75 MiB |
| 15 | 903.515625 MiB | 963.75 MiB |

This is the direct cost of losing Sun-position locality. Loading all 15
checkpoint indices is the complete radiance-plus-factored-T payload in this
matched-grid example, not a small runtime page pool.

#### Boundary-total comparator memory

The single-boundary-total comparator has no retained `ell` axis. At the same
reference counts, one `mu_s` page is `1.875 MiB` logical `R32F` or `2 MiB` in
four-`RGBA32F`; all 32 pages are `60` or `64 MiB`. Reference-resolution
Native15 transmittance plus irradiance adds `0.99609375 MiB` logical or
`1.0625 MiB` packed if both resources are retained, producing payload totals of
`60.99609375` or `65.0625 MiB`.

A terminal sky query normally needs two radiance pages. A finite segment uses
the union of the `mu_s` brackets at both endpoints: normally two pages when the
brackets coincide, three when they overlap, and four when disjoint. Exact
coordinate hits can reduce the union to one page. Thus the ordinary off-grid
range is `3.75` through `7.5 MiB` logical or `4` through `8 MiB` packed; the
exact-node minimum is `1.875` or `2 MiB`, before global transmittance/
irradiance. A frame with varied endpoints can still span all 32 pages. This
comparator is small on disk relative to the origin-indexed checkpoint field,
but its subtraction conditioning and real frame-wide page union remain
evidence questions.

#### Canonical-prefix memory envelope

Canonical-prefix storage has no honest final byte count until its grid and
connected-interval policy converge. Its exact formula can nevertheless be
fixed. Let `A` be the stored `(eta, nu)` pair count; let `G` be the set of
nonradial `b < R_ground` nodes with two disconnected atmospheric intervals;
let `S` be the one-interval tangent/space nodes; and let `X` be each interval's
retained prefix-node count. Including an explicit radial convention when
present:

```text
N_prefix =
  A * [sum(i in G)(X_i_minus + X_i_plus) + sum(i in S)X_i]
  + N_nu * (X_0_minus + X_0_plus)

logical R32F bytes = 60 * N_prefix
four-RGBA32F bytes = 64 * N_prefix
```

For dense rectangular angular storage with one common `N_x`, ignoring the
small radial correction:

```text
N_prefix = N_eta * N_nu * N_x * (2 * N_b_ground + N_b_space)
```

The second connected interval below opaque ground is real radiance storage,
not metadata. For the purely illustrative count tuple
`(N_b, N_eta, N_nu, N_x) = (32, 32, 8, 128)`:

| ground-crossing `b` nodes | logical `R32F` | four-`RGBA32F` |
| ---: | ---: | ---: |
| 0 | 60 MiB | 64 MiB |
| 8 | 75 MiB | 80 MiB |
| 16 | 90 MiB | 96 MiB |
| 24 | 105 MiB | 112 MiB |
| 32 | 120 MiB | 128 MiB |

These are arithmetic examples, not candidate estimates. Ragged packing of the
physical `eta^2 + nu^2 <= 1` domain can reduce them; refined axes, branch
seams, and prefix transmittance can increase them. Storing Native15
transmittance at every prefix node would double the field unless a qualified
factorization wins.

The initial bounded arithmetic sweep is:

| sweep point `(N_b, N_eta, N_nu, N_x)` | dense one-interval logical / packed |
| --- | ---: |
| `(32, 32, 8, 128)` | 60 / 64 MiB |
| any one of `b`, `eta`, `nu`, or `x` doubled | 120 / 128 MiB |
| `(48, 48, 12, 192)` | 303.75 / 324 MiB |
| `(64, 64, 16, 256)` | 960 / 1,024 MiB |

Each value must still be multiplied by the measured valid-domain and
connected-interval factors. Runtime residency is the union of chunks touched
by both prefix endpoint stencils over the full frame. Because `eta` varies by
view ray, no two-page working-set claim is available without those traces.

#### Offline truth, staging, and physical allocation

At `M = 32`, `E_R = 15`, a monolithic binary64 radiance-checkpoint array is
`1,800 MiB`. Holding it together with the `900 MiB` `R32F` candidate is
`2,700 MiB`, before solver state. One binary64 local-density field over
`(r, mu, mu_s, nu, lambda)` at the same reference grid is `120 MiB`; every
simultaneously retained full order/component field adds its own payload.
Streaming completed slabs can reduce output-buffer residency, but it does not
remove the coupled N4 solver's working set. Doubling all four geometric axes
multiplies field memory by 16; doubling branch-checkpoint count as well makes
the multiplier 32. The builder must therefore record its actual field
lifetime graph and peak process memory rather than materialize every truth,
order, and candidate array by default.

One-at-a-time decoded CPU staging has a lower bound of one radiance slab:
`1.875 MiB` direct `R32F` or `2 MiB` packed. For an uncompressed slab of size
`S`, one simultaneously retained fetched input plus decoded output is `2S`.
Two decoded outputs plus one retained input are `3S`; two complete retained
input/output pairs are `4S`. The actual peak is the sum of every simultaneously
live fetched/stored buffer, decoder workspace, decoded buffer, repack/upload
backing, hash scratch, and retained restoration mirror. Browser/driver upload
and command buffers remain a separate observed renderer/driver category. The
loader must record a lifetime timeline rather than apply a blanket double-
buffer multiplier.

For comparison, the implemented W27 field is one base-level
`4374 x 48 x 15` scalar `R32F` two-dimensional array render target with
wavelength on the array-layer axis, nearest/clamp sampling, no mipmaps, and no
depth or stencil. It is `12.01355 MiB` resident. Its accepted N4 evidence
reports `36.04065 MiB` peak live construction fields,
`42.49841 MiB` peak same-pass tracked field-plus-packed data, and a
`12.01355 MiB` result. Keeping the old active cache during successor
construction raises the known logical tracked high-water to at least
`54.512 MiB`; driver allocation is still excluded. These current numbers are
comparators, not limits for the new representation.

The new field is five-dimensional logically, but WebGL has no native 5-D
texture. Before a limit is chosen, each prototype must record actual texture
count, dimensions, format, mip count, live and allocated texels, padding,
invalid slots, sampler count, CPU copies, and simultaneous active/staging/
retiring resources. It must also record `MAX_TEXTURE_SIZE`,
`MAX_ARRAY_TEXTURE_LAYERS`, fragment and combined texture-unit limits, and the
float-sampling and `R32F` render-target capabilities applicable to the chosen
loader/sampler path. WebGL exposes no portable accurate VRAM-byte query, so
renderer/driver steady and peak deltas must be measured on named hardware and
browser/ANGLE paths, including delayed reclamation after disposal.

The first uncompressed runtime-candidate asset uses Native15 `R32F`, with an
independent higher-precision construction oracle. `R16F`, spectral bases,
dictionaries, residuals, implicit zeroes, and domain compaction are later
measured codecs or layouts. None may be used to make the pre-limit baseline
look smaller.

## Resolution Strategy

Because runtime memory rather than offline time is the constraint, spend
resolution where it changes the physical result:

1. **Solar zenith near the terminator.** Resolve source visibility and the
   rapidly moving Earth-shadow boundary, especially from roughly `+5` through
   `-24 degrees` solar elevation.
2. **View zenith near the horizon.** Preserve tangent-path optical depth and
   the transition between ground-intersecting and atmosphere-exiting rays.
3. **Relative view/Sun angle near the source-facing depression.** Resolve the
   center and the observed approximately `51--54-degree` shoulder without
   assuming that feature is correct.
4. **Radius near the ground and shadow boundary.** Resolve low-altitude density
   gradients and the altitude at which the Sun becomes visible.
5. **Branch length around physical events.** Resolve atmosphere entry/exit,
   closest approach, ground intersection, source-visibility transitions, and
   short object endpoints without equating checkpoint count with quadrature
   count.
6. **Numerical quadrature and spectral resolution.** Increase offline
   source-path, view-path, angular, and wavelength integration until the LUT
   resolution, rather than construction error, owns the residual.

These axes should use physically motivated nonlinear mappings. Doubling every
axis is a useful cost bound, not the preferred allocation policy.

### Branch-checkpoint selection

Checkpoint count and mapping are selected from over-resolved cumulative truth
curves. The first study compares `N_ell = 8, 12, 15, 24, 32` under uniform
distance, optical-depth-aligned, and analytic event-aligned mappings. Fifteen
is a candidate because it offers a useful comparison with the current runtime
cost; it is not accepted merely because the current renderer uses 15 live
quadrature intervals.

Every applicable branch mapping must retain or exactly derive:

- the zero-length anchor and terminal atmosphere or ground boundary;
- atmosphere entry and exit;
- tangent or closest-approach location;
- ground intersection;
- every direct-source visibility or Earth-shadow crossing; and
- denser support in near-ground and rapidly changing optical-depth regions.

The focused San Jose horizon ray's first sunlit region near `543 km` is one
required evidence landmark, not a universal hard-coded node. Per-branch
adaptive nodes are an acceptable truth representation; a runtime grid must
provide a deterministic mapping that interpolates coherently across
neighboring branch geometries.

Selection repeatedly splits the interval with the worst held-out physical
error until a candidate passes or reaches the declared checkpoint-count study
envelope. That study envelope bounds the experiment; it is not a selected
runtime memory ceiling.
Metrics include all Native15 channels, transmittance/optical depth, photopic
luminance, full-boundary equality, arbitrary shortened endpoints, shadow
crossings, and the nautical source-axis center/flank relation. The selected
mapping must be rechecked after the full N4 truth field exists; a J1-only
choice is preliminary.

For an unobstructed sky ray, the terminal checkpoint is already one accurate
completed boundary integral. Intermediate checkpoints primarily serve finite
or object-shortened segments. Their value must be justified by those queries,
not by treating a full-sky ray as a 15-term runtime sum.

The finite solar radius softens the geometric terminator over roughly the
Sun's `0.267-degree` angular radius, and atmospheric refraction can move the
apparent horizon by a comparable scale. Resolving `mu_s` far more finely while
retaining a center-ray point Sun and no refraction would converge the current
model, not necessarily real twilight. These omissions must be explicit in the
truth asset and revisited before interpreting sub-degree page refinement as
physical accuracy.

The offline compiler should first generate a deliberately over-resolved truth
asset, then derive runtime candidates. It must not tune grid coordinates from
the final RGB screenshot.

## Page And Chunk Layout

The offline asset must use independently addressable chunks rather than
requiring the complete field to be loaded. Leaving unused coordinate columns
inside one allocated texture does not save GPU memory.

For the origin-indexed candidate, one logical `mu_s` page contains every
retained `r`, `mu`, `nu`, `ell`, and Native15 value at one solar-zenith sample.
It should be physically subdivided into `(mu_s, i_ell)` slabs so a terminal
sky query need not load every intermediate checkpoint. The runtime explicitly
fetches the required lower/upper coordinate slabs and applies the declared
interpolation weights only after reconstructing Native15 values.

For the canonical-prefix candidate, chunk keys follow the selected branch
coordinates and may not be `mu_s` pages at all. The manifest and loader must
describe named axes and an opaque coordinate-family query packet rather than
hard-code `mu_s` into generic storage machinery. The plan's query-trace study
owns the concrete chunk key.

### Chunk manifest

Each chunk record must include at least:

- asset schema and atmosphere identity;
- coordinate-family and source-model identities;
- every chunk-axis index, exact coordinate, and interpolation interval;
- coordinate-mapping identity for `r`, `mu`, `mu_s`, `nu`, and branch length
  when the origin-indexed representation is selected, or the complete
  canonical-prefix mapping otherwise;
- branch anchor, orientation, kind, terminal boundary, checkpoint count,
  exact/derived metre nodes, warp and inverse, and interpolant;
- stored-field semantic and units;
- transmittance/optical-depth representation and segment algebra;
- Native15 basis identity;
- dimensions, scalar count, precision, and byte length;
- codec, dictionary, basis, key-page, and residual identities when present;
- uncompressed content hash and stored-byte hash;
- parent truth-asset identity and derivation equation; and
- error ledger against the truth asset.

The complete asset manifest also binds planet radii, atmosphere and ozone
profiles, aerosol/ground parameters, source spectrum, scattering orders,
integration rules, compiler/tool identity, and every chunk hash. It also binds
the source angular-support model--either an explicit collimated center ray or
a solar angular radius and emission profile--plus the refraction and
source-visibility policy. Those choices change the terminator solution and
therefore select a different asset.

## Runtime Residency And Streaming

### Ordinary ground-sky query

For the origin-indexed candidate, geometry computes
`(r, mu, mu_s, nu, branch, ell)` at the camera. A full atmosphere-boundary sky
ray uses the terminal `ell` slab from the lower and upper `mu_s` pages. Those
two terminal slabs are the complete radiance residency for that query, not two
complete checkpoint pages.

Sun azimuth does not choose a new page. It changes `nu` and the world-to-local
coordinate reconstruction. Sun elevation changes `mu_s` and therefore the
active slab pair.

For the canonical-prefix candidate, geometry emits its selected branch-family
packet and the sampler resolves the two prefix locations needed by the
segment. Its resident set is a query-derived chunk union; no two-page promise
is made before page traces establish one.

### Aerial perspective and extended query sets

A finite endpoint under the origin-indexed candidate interpolates one requested
`ell` between lower and upper checkpoints on both `mu_s` pages, normally a
four-slab working set. A frame with varied object depths, a reflection probe,
or a space camera may need a wider union. The terminal sky checkpoint can be a
different slab from those endpoint intervals.

The resolver must calculate the complete coordinate interval from every
physical query state the frame will issue. It must not infer residency from
camera Sun angle alone when endpoints, prefixes, or other query families use
different states.

Canonical-prefix segment recovery uses two completed prefix values and their
transmittance algebra. It must qualify short-segment cancellation and weak-
transmittance conditioning rather than falling back silently to local-density
marching.

Initial coordinate interpolation is linear or another explicitly monotone
scheme in reconstructed Native15 values. Unconstrained cubic interpolation can
overshoot and is not an initial option. Any interpolation remains an
approximation to the radiative-transfer solution and must be compared with
independently constructed off-grid states and held-out branch lengths.

### Chunk pool

A practical pool is query-derived and contains:

- every slab/chunk required by the active query packet;
- selected adjacent prefetch chunks; and
- optionally one retiring compatible set during atomic replacement.

The Bruneton three-channel reference page is `256 KiB`, so keeping the global
transmittance/irradiance textures plus 2, 3, or 4 reference pages costs
`0.765625`, `1.015625`, or `1.265625 MiB`. Native15 boundary pages use the
larger sizes listed above. Those reference figures describe boundary totals,
not the chosen checkpoint field.

Sun motion is slow relative to frame time. Prefetch begins before an active
coordinate interval crosses its threshold. A query set becomes visible only
after every required resource and identity is ready.

Publication is atomic over both the chunk set and the source/query state that
selected it. While a successor loads, the renderer must either retain the old
Sun transform and query packet with the old compatible set or report the new
frame unavailable; it must never sample stale chunks with a new state.

### Failure and lifecycle rules

- Never silently clamp a query to the nearest resident coordinate chunk.
- Never substitute black or an incompatible atmosphere chunk.
- Preserve the last complete compatible query set while a successor loads.
- Publish source/query state and chunk sets atomically.
- Reject stale asynchronous completions by complete asset/chunk identity.
- Restore every required chunk after context loss before sampling it.
- Release retiring chunks exactly once after no installed handle can read them.
- Report missing-range, decode, upload, context, and shader failures separately.

## Offline Construction

Offline computation permits more work but does not relax evidence requirements.

The construction pipeline is:

```text
sourced atmosphere + planet + ground + source + numerical policy
  -> converged order-separated actual-point spherical truth solver
  -> dense cumulative branch-integral truth curves
  -> order/component conservation checks
  -> branch-coordinate and runtime-grid reduction
  -> uncompressed Native15 candidate asset
  -> independently decodable coordinate chunks
  -> optional spectral/page/checkpoint codec derivation
  -> immutable asset manifest and error ledger
```

The solver must recompute the complete actual-point N4 solution. Reintegrating
the current receiver-column `C4` would preserve the defect in J2--J4. Pure
orders retain the existing recurrence rule: only the preceding pure order
feeds the next, and cumulative fields never feed recurrence.

Build the complete coupled truth field before splitting chunks. Multiple
scattering and irradiance construction can depend on neighboring states and
global order results. Along a higher-order incoming transport ray, local
`mu_s` changes just as it does along a camera ray. Independently computing only
the chunks currently needed is not equivalent unless a later derivation proves
that construction factorization.

The offline builder is the implementation endpoint for this plan: a physics
solver, cumulative branch integrator, grid reducer, asset writer, and
independent verifier. Runtime loading is a separate contained consumer proof,
not an excuse to make the offline solver depend on renderer state.

The runtime loader should stream coordinate chunks directly into bounded decode and
upload buffers. It must not read the entire offline asset into CPU memory merely
to retain a bounded GPU query set.

Offline construction may increase:

- spectral integration resolution;
- `r`, `mu`, `mu_s`, `nu`, and branch-coordinate resolution;
- source/view-path integration intervals;
- scattering-angle quadrature;
- retained scattering order; and
- compiler precision.

Each increase needs a convergence ledger. "Offline" is permission to spend
time, not permission to omit numerical qualification.

## Redundancy Between Branch Checkpoints

Adjacent cumulative checkpoints are necessarily correlated because a later
integral contains the earlier prefix. That does not make an index-only or
low-precision delta representation automatically safe. The difference between
two nearly equal prefixes can contain the complete radiance of a short object
segment, and one small interval can contain the entire moving terminator
signal.

The uncompressed field stores or reconstructs completed prefix values first.
Later checkpoint codecs may test interval deltas, analytic low-order curves,
shared bases, or sparse event residuals, but must preserve terminal equality,
monotonicity, short-segment conditioning, and held-out endpoint radiance.
Canonical-prefix subtraction and origin-indexed checkpoint interpolation are
qualified separately; they have different numerical failure modes.

## Redundancy Between Solar-Zenith Pages

Adjacent pages should be strongly correlated away from the terminator. The
important exception is exactly the feature this design is intended to restore:
source visibility and the Earth-shadow boundary move through the field as
`mu_s` changes. A globally small residual can contain the entire twilight
signal.

Compression must therefore optimize worst-case physical error rather than
global variance or average daytime energy.

### Key page plus residual

One candidate stores periodic full key pages and independently decodable
residuals:

```text
P_i = K_j + Delta_(j,i)
```

or, only for an adjacent pair:

```text
P_(i+1) = P_i + Delta_i
```

In the best case, an active Native15 default-resolution pair consisting of one
`R32F` key page and one `R16F` residual costs `2.8125 MiB`, versus `3.75 MiB`
for two full `R32F` pages, a 25% reduction before metadata. An interval that
requires one key plus two residuals costs `3.75 MiB`, so periodic keys do not
guarantee resident savings. That arithmetic is not a quality claim.

Requirements:

- no long dependency chains or cumulative drift;
- every streamed unit independently decodable from one named key;
- block scaling or another declared treatment for weak channels;
- exact page-boundary continuity checks; and
- separate error reporting inside and outside the terminator region.

Storing a compressed residual on disk but expanding it to a full page on the
GPU saves disk/network bandwidth, not resident GPU memory. Direct GPU memory
saving requires sampling the key-plus-residual representation in the shader.

### Separate direct and multiple scattering

Direct/single scattering has the sharpest shadow boundary and should receive
the densest `mu_s` sampling and most conservative precision. Higher-order
scattering is generally smoother and may tolerate coarser pages or stronger
compression.

This is a representation option, not permission to change the physics. Runtime
must still reconstruct the same cumulative Native15 radiance, and any separate
component fields increase fixed overhead.

### Terminator-aligned residuals

A residual may compress better in a coordinate warped with the analytic
shadow boundary. That is promising but high risk: a misaligned warp can create
ringing, negative radiance, or a moving seam at exactly the horizon of
interest. Treat it as a later codec experiment after the uncompressed paged
field is correct.

## Spectral Redundancy

There is no known exact algebraic reduction below 15 values per stored spectrum.
Even first order contains wavelength-varying source radiance multiplied by
Rayleigh, Mie, ozone, and Beer-Lambert exponentials whose optical depths vary
over the domain. Later orders mix many such paths. A sampled spectral matrix
can therefore have full rank even when it lies close to a low-dimensional
manifold.

An exploratory recomputation from the sealed run-`000493` 585-spectrum probe
ledger supports testing compression but is not a separately sealed derived
artifact and does not qualify the cache. Here, "global reconstruction error"
means `100 * ||X - X_k||_F / ||X||_F` after centering. Maximum per-channel
relative error uses the nonzero retained values directly; a future corpus must
declare a material denominator floor before that metric becomes a gate:

- all 585 final path-radiance spectra are distinct as exact 15-value vectors;
- centered rank-4 PCA has about `0.010420%` global reconstruction error;
- rank-6 has about `0.001357%`;
- rank-8 has about `0.0000637%`; and
- these are downstream, path-integrated spectra from one twilight scene, which
  can be smoother than the underlying cached density or LUT field.

The credible first linear-basis candidates are therefore 8 coefficients, then
6 if worst-case Native15 and rendered errors permit it. Four coefficients are
an aggressive research point, not a default.

Global error alone is misleading: in this narrow corpus rank 4 reaches about
`7.9%` maximum per-channel relative error, while rank 8 is needed to bring the
maximum below about `0.79%`. Rank 1 even reconstructs negative scalar values.
Weak-channel and nonnegativity gates therefore own the decision, not variance
explained.

For the current W39 field, retaining 8, 6, or 4 `R32F` coefficients per node
would reduce one cumulative field from `25.065 MiB` to approximately `13.368`,
`10.026`, or `6.684 MiB`, respectively. Basis storage is negligible. The
decoder must reconstruct Native15 before interpolation-dependent consumers and
Color; a shared linear decoder can commute with linear interpolation, but
nonnegativity still requires qualification. These coefficient sizes assume
physically packed scalar storage; a six-coefficient layout padded into two
RGBA textures consumes the same node payload as eight coefficients.

### Recorded-proxy base/gain/delta screen

Accepted contained run
`000500-native15-base-gain-delta-rough-study` (artifact-set SHA-256
`de295f1de16ed258d7979cb9d49f1501bccd32fef996d85adeeca1f41f4a05aa`)
is the first immutable rough screen of the proposed normalized-shape
dictionary. It deliberately precedes a raw successor-cache asset only to
answer whether the representation is worth retaining as a later candidate;
it does not complete plan Phase 9 or select a codec.

The corpus contains 3,991 labeled Native15 path-radiance spectra from runs
`000258`, `000471`, `000493`, `000494`, and `000497`. It has 3,270 exact input
vectors. The 721 duplicates beyond the first are copies of the exact-zero
run-`000471` N1 vector; no cross-run exact duplicate was found. Float32
conversion leaves 3,269 exact vectors and changes only 45 of 59,865 scalars,
with `2.08594e-15` relative Frobenius conversion error. The fit uses 885
records; 352 whole-condition, whole-elevation-row, or whole-azimuth-column
records are internally held out. Run `000494`, the six run-`000471` order/
quadrature conditions, and run `000497` remain separately labeled external
stress cohorts rather than one manufactured cache population.

The rough codec is

```text
S_hat(lambda) = gain * [D_base[baseId](lambda) + D_delta[deltaId](lambda)]
```

with exact zero reserved, deterministic normalized-shape clustering,
nonnegative least-squares Float32 gain, a fixed base while selecting a shared
signed delta, and shader-like Float32 decode. Dictionary sizes include the
reserved zero ID. The study also measures direct per-sample signed int8 and
int16 residual controls. Indices are never interpolated; a runtime candidate
would decode every geometric corner before interpolating Native15 values.

The useful observed points are:

| representation | compact logical record | run-493 blocked-grid max spectral L2 | same cohort max blue-band error | actual-point J1 max spectral L2 |
| --- | ---: | ---: | ---: | ---: |
| 256-base + gain | 5 bytes | 1.84449% | 10.9235% | 34.8153% |
| 64-base + gain + 64 shared deltas | 6 bytes | 1.47800% | 5.80442% | 34.1635% |
| 256-base + gain + 64 shared deltas | 6 bytes | 1.54037% | 6.23518% | 34.5424% |
| 64-base + gain + direct int8 residual | 24 bytes | 0.00816924% | 0.129019% | 0.150090% |
| 64-base + gain + direct int16 residual | 39 bytes | 0.0000382311% | 0.000330593% | 0.000635619% |

The compact records use one-byte IDs because every tested dictionary has at
most 256 entries. Fixed uint16 records are 6, 8, 25, and 40 bytes for base,
shared-delta, int8, and int16 respectively. The direct-residual controls are
not nonnegative by construction: across all blocked/external cohorts, the
int8 variants reconstruct small negative values in run-`000471` N2 and
run-`000497` J1, while the int16 variants retain three or four negative J1
scalars. The 64-base int8 J1 control has only `0.150090%` maximum spectral L2
error but `219.613%` maximum weak-blue-band relative error. The corresponding
int16 values are `0.000635619%` and `2.19917%`. Average or full-spectrum error
therefore cannot stand in for weak-channel and nonnegativity qualification.

Under fixed uint16 IDs and direct 15-float dictionaries, run `000498`'s
3,118,662-spectrum halo population is `178.451 MiB` raw, `17.849 MiB` for a
64-base/gain representation, `23.801 MiB` with 64 shared deltas, `74.358 MiB`
with direct int8 residuals, and `118.971 MiB` with direct int16 residuals. The
37,791,360-spectrum full Native48/W27/180-zenith rectangle is respectively
`2,162.439`, `216.248`, `288.333`, `901.020`, and `1,441.630 MiB`. These are
logical directly sampled codec bytes including dictionaries. Expanding a
compressed asset back to Native15 R32F before GPU upload would retain the raw
resident cost.

The result supports substantial approximate shape redundancy in familiar
path-integrated spectra, but it rejects an assumption that one small global
base/shared-delta dictionary automatically covers distinct scattering
components or weak twilight channels. The actual-point J1 cohort is a
deliberately different component and is not a sizing population; its failure
is evidence about transfer, not proof that a dictionary fitted to a complete
future field must fail. The next qualifying codec evidence still requires the
uncompressed raw N4 successor field, held-out complete solar pages/branches,
corner-decoded interpolation, moving-terminator continuity, and the full
Native15 physical gates. No representation or precision is selected by this
screen.

This was intentionally an eight-iteration rough screen, not an optimizer-
convergence study. All base fits converged, but seven of the eight shared-
delta fits reached the iteration cap; their errors do not establish the best
possible dictionaries. Relative metrics use one frozen absolute `1e-12`
floor. Very large weak-channel percentages can therefore involve truth near
`1e-11` through `1e-10`; retained absolute, band-energy, ratio, and worst-
identity evidence must accompany them.

## Shared Spectral Dictionary Design

The proposed dictionary is a **spectral** dictionary. It stores Native15
spectral shapes, not RGB colors.

### Exact dictionary

An exact dictionary interns bit-identical 15-float vectors and stores one index
per geometric sample. It is lossless, but current evidence gives no reason to
expect many exact repeats beyond explicitly unused slots or component-specific
exact zeroes. Every one of the 585 retained final path spectra is unique. A
full truth-cache census is required before allocating an exact dictionary
format.

Let `N` be slots per page, `P` pages, `K` globally unique spectra, `B` bytes per
stored spectrum, and `I` bytes per index. An exact global dictionary saves
payload only when

```text
K * B + N * P * I < N * P * B
```

and only if its GPU indirection cost is acceptable. A 16-bit index caps the
global dictionary at 65,536 entries; a larger exact census needs 32-bit indices
or explicitly partitioned dictionaries. The census must report `K/(N*P)` and
the resulting physical packing, not merely count repeated values.

At minimum, reserve one code for the exact-zero spectrum and measure spatial
runs of that code. Invalid rectangular slots and direct source components in
Earth shadow may make this worthwhile even when total multiple-scattered
radiance is nonzero and other vectors are unique.

### Quantized shape dictionary

A more promising vector-quantized representation is:

```text
S(lambda) = A * D[index](lambda) + R(lambda)
```

where:

- `A` is a per-sample nonnegative amplitude;
- `index` selects a normalized Native15 dictionary shape;
- `D` is one global dictionary shared by every solar-zenith page; and
- `R` is an optional residual representation.

This remains wavelength-resolved, but it is lossy unless the residual restores
the exact vector.

A global dictionary is preferable to page-local dictionaries. It exploits
cross-zenith reuse and prevents the same physical spectrum from changing code
semantics at a page boundary.

### Illustrative memory arithmetic

The following default-page example is a boundary-only 32,768-state comparator.
An origin-indexed checkpoint field multiplies per-state index/amplitude bytes
by `N_ell`, although one global dictionary may still be shared across all
checkpoints and solar pages.

For one default Bruneton-like boundary page:

- one 16-bit index per state is `0.0625 MiB`;
- one `R32F` amplitude per state is `0.125 MiB`; and
- a global 4,096-entry Native15 `R32F` dictionary is `0.234375 MiB`.

Two resident boundary-page index/amplitude sets plus that dictionary would therefore be
about `0.609375 MiB` before residuals, metadata, and auxiliary fields. Across
all 32 pages, the same representation would be about `6.234375 MiB` before
residuals. This is a rate bound, not evidence that 4,096 shapes satisfy the
physical error budget. It assumes each dictionary vector occupies exactly
15 `R32F` scalars. Four physical `RGBA32F` texels use 64 rather than 60 bytes
per entry; with that packing the corresponding values are `0.625 MiB` and
`6.25 MiB`.

For comparison, the current W39 density field has 438,048 geometric nodes. A 16-bit
index, `R32F` amplitude, and 4,096-entry Native15 `R32F` dictionary total about
`2.741 MiB`, versus `25.065 MiB` raw. A 65,536-entry dictionary totals about
`6.257 MiB`. With four-`RGBA32F` dictionary entries those totals become about
`2.757 MiB` and `6.507 MiB`. Again, neither figure includes residuals or proves
quality.

### GPU lookup and interpolation

Indices cannot be interpolated. For every geometric stencil corner, runtime
must:

1. fetch the index and amplitude;
2. fetch or reconstruct its Native15 dictionary vector;
3. apply any residual; and
4. interpolate the reconstructed spectral values.

Interpolating indices first is invalid. A packed dictionary can expose four
spectral channels per texture fetch, but the extra indirection and bandwidth
must be measured against the raw-page alternative.

Dictionary qualification must specifically detect:

- contours at codeword boundaries;
- discontinuities when `mu_s` pages change;
- large relative errors in weak blue twilight channels;
- negative reconstructed channels;
- poor handling of near-zero amplitudes;
- loss of ozone's non-power-law spectral shape; and
- errors concentrated in the source-axis valley or moving terminator.

## Other Structural Redundancy

These findings apply mainly if the current cubed-sphere density layout is
retained. A factored `(mu, nu)` LUT already removes much of the same angular
redundancy and must not count the savings twice.

### Cubed-sphere seam duplication

W27 stores 4,374 face nodes but only 4,058 unique physical directions. Sharing
exact edge/corner nodes would save 316 directions, or about 7.22% of the field.
W39 stores 9,126 nodes but 8,666 are unique, a 5.04% saving.

### Source-plane reflection

For a radial atmosphere, uniform/black ground, and source-centered frame, the
field is symmetric under reflection across the source/up plane. A
symmetry-enforcing build could reduce the seam-deduplicated W27 field to about
2,081 reflection orbits (`12.014` to `5.716 MiB`) and W39 to about 4,409
orbits (`25.065` to `12.110 MiB`).

Those parenthetical reductions combine seam deduplication and reflection. The
seam-deduplicated baselines alone are about `11.146 MiB` for W27 and
`23.802 MiB` for W39; do not report the combined result as reflection-only
savings.

The mathematics is exact for the declared symmetric model, but a currently
built sequential `R32F` field may contain roundoff asymmetry. Pairwise
construction or explicit symmetrization is required before treating it as
byte-lossless.

### Scattering orders and transient peak

The persistent cache already eliminates order redundancy by retaining only
cumulative `C4`. Offline construction also removes the runtime GPU peak of
roughly three outgoing fields during accumulation. Keeping separate order
fields for diagnostics or compression would add storage and must be explicit.

### Altitude and precision

Native48 has no exact duplicate altitude nodes. Thinning it or replacing it
with splines is lossy and especially risky near tangent and shadow boundaries.

Blind `R16F` storage is also risky. Weak twilight channels can underflow or
receive large relative error even while daytime energy metrics look excellent.
Log, block-float, or scaled residual representations require the same
Native15 worst-case qualification as a spectral dictionary.

## Recommended Compression Study

Compression selection should use a full offline truth census, not screenshots
or the 585-probe sample alone.

For every candidate asset:

1. hash and count exact duplicate Native15 vectors, including exact-zero runs;
2. normalize nonzero spectra by several candidate amplitudes and measure shape
   distributions;
3. evaluate shared linear bases at ranks 4 through 12;
4. evaluate shared vector dictionaries from 64 through 65,536 entries;
5. evaluate key-page/residual coding with independent decode points;
6. evaluate hybrids such as basis coefficients plus a small residual
   dictionary;
7. hold out complete `mu_s` pages, whole branches, and checkpoint intervals,
   not random texels, during fitting; and
8. select by the worst physical error that matters, not compression ratio or
   variance explained.

Useful hybrid candidates, in order, are:

1. uncompressed Native15 checkpoint chunks as the correctness baseline;
2. 8-coefficient shared linear basis;
3. 6-coefficient basis if the worst-case gates pass;
4. one global normalized-shape dictionary with amplitude and optional basis
   residual;
5. independent key-page-plus-residual chunks; and
6. direct/multiple-scattering fields with different page density or codec.

Do not combine every technique in the first implementation. Each codec needs
an isolated rate-distortion result so a failure can be attributed.

## Validation Contract

### Physical and spectral invariants

- Every reconstructed Native15 value is finite.
- Nonnegative source/medium configurations reconstruct nonnegative radiance
  within a declared numerical tolerance.
- The zero-length checkpoint is exact zero, and the terminal checkpoint agrees
  with an independently integrated full-boundary result.
- For nonnegative transport, each Native15 cumulative integral is
  nondecreasing with physical branch length within a declared tolerance.
- Prefix transmittance starts at one and is nonincreasing inside each connected
  interval; segment reconstruction satisfies the declared prefix composition
  identity without crossing opaque ground or dividing by a zero/underflowed
  prefix.
- The independently built boundary-total comparator satisfies
  `L(x -> y) = B(x) - T(x -> y) * B(y)` on the same valid endpoint corpus and
  reports cancellation and short-segment conditioning separately.
- Checkpoint index, normalized coordinate, and physical metre length round-trip
  under the asset mapping, including every retained event node.
- Interpolation never crosses disconnected ground/space branch kinds or treats
  an invalid rectangular slot as an independently solved physical state.
- Exact-zero and ground-blocked semantics are preserved for the applicable
  direct source-visibility/transmittance component. A blocked direct solar ray
  does not imply zero total twilight radiance; multiple scattering and remote
  illuminated path segments can remain nonzero.
- Source energy, transmittance, and scattering-order accumulation use declared
  units and identities.
- Ozone contributes absorption/extinction only. It adds no scattering
  coefficient or phase-function term, but its attenuation changes `J1` and
  later scattering radiance indirectly.
- Reconstructed total fields are continuous at ordinary `mu_s` page
  boundaries within the declared tolerance. A point-source visibility branch
  may contain a sharp physical boundary; its direct component must obey that
  declared branch rather than being blurred merely to satisfy continuity. A
  finite-disk source defines a different, explicitly smoother contract.
- Queries outside the supported solar-elevation range fail explicitly; they do
  not clamp silently.

### Error measurements

Measure at least:

- absolute error per Native15 channel;
- relative error above a declared material floor;
- integrated spectral energy;
- photopic luminance and XYZ;
- signed linear RGB before gamut handling;
- view transmittance and path radiance separately;
- page-boundary temporal change as the Sun moves;
- source-axis center versus the approximately `50-degree` flanks;
- low-elevation blue-band energy and `470/626 nm` ratio; and
- endpoint and aerial-perspective reconstruction;
- held-out branch-length interpolation and short-segment conditioning;
- `N_ell` convergence independently from offline quadrature convergence; and
- coordinate-chunk boundary continuity and query-derived resident-set traces.

Daylight energy must not hide weak twilight failure. Reports must stratify by
solar elevation, altitude, view zenith, view/Sun angle, scattering component,
ozone state, aerosol profile, and ground model.

### Reference comparisons

The first qualification matrix should include:

- direct high-resolution actual-point J1 at twilight;
- order-separated or component-separated J1/J2/J3/J4 evidence;
- an over-resolved offline Algorithm32 density/path oracle;
- an independently compiled Bruneton-like Native15 result;
- the existing B1 daylight boundary;
- San Jose sunset, civil, nautical, and astronomical controls; and
- camera-facing, antisolar, zenith, and horizon paths.

Run `000497` confirms the focused prediction for direct first order: restoring
actual-point source visibility raises the source-axis nautical horizon and
closes about `97.2%` of the measured three-ray deficit under converged
binary64 integration. Complete acceptance still requires recomputing and
comparing the higher-order field, rather than treating the hybrid image alone
as a finished atmosphere solution.

### Resource and lifecycle evidence

Record:

- complete offline asset bytes;
- per-chunk stored and decoded bytes;
- CPU staging and GPU resident peaks;
- dictionary/basis/global-resource bytes;
- chunk decode, upload, and publication times;
- prefetch hit/miss behavior;
- context-loss restoration;
- stale-load rejection and disposal counts; and
- frame cost and texture-fetch count.

## Asset Identity And Compatibility

One cache asset can serve any Sun angle only when all static physical and
numerical inputs match. Its identity must include:

- planet bottom/top radii and geometry policy;
- atmosphere density profiles and coefficients;
- ozone and aerosol composition;
- ground albedo/reflection model;
- source spectral shape and normalization policy;
- source angular support and emission profile, including explicit collimated
  center-ray policy or solar angular radius;
- refraction and source-visibility policy;
- Native15 basis and offline spectral-integration grid;
- maximum scattering order and component layout;
- source-model and coordinate-family identities;
- coordinate mappings, ranges, branch kinds, anchors, and orientations;
- `r`, `mu`, `mu_s`, `nu`, and branch-length sample coordinates for the
  origin-indexed candidate, or the complete canonical-prefix axes;
- checkpoint count, warp/inverse, metre nodes, interpolation, and terminal
  boundary policy;
- transmittance/optical-depth representation and segment algebra;
- integrator/quadrature/convergence policies, distinguishing retained
  checkpoints from internal quadrature intervals;
- field semantic and units;
- precision and codec identities;
- compiler/tool/source revisions; and
- every global, chunk, dictionary, basis, and residual content hash.

Changing Sun direction selects different chunks and lookup coordinates without
invalidating the asset. A time change has that property only when every other
identity-bound atmosphere, ground, source, and numerical input remains fixed.
Changing any static item above selects another asset.

## Scope Boundaries

### Spherical distant Sun first

This design and its execution plan implement and qualify only a distant
collimated source with parallel rays in a radially stratified spherical
atmosphere. It is the proposed successor to the reduced
`(altitude, W27/W39 direction)` cache that failed the twilight-equivalence
diagnostic. Local-Sun implementation is not a completion criterion.

### Finite/local Sun

The phrase "local Sun" covers two geometrically different cases and must not
freeze them into one conclusion.

For a **spherical radially stratified atmosphere with a fixed finite point
source**, let the source center be `S = rho * A`, where `A` is a fixed unit
axis and `rho = length(S)` is its geocentric source-center radius. An origin-
indexed tuple can retain the same number of geometric axes as the distant
candidate only when `rho` is fixed in asset identity; sampling `rho` adds an
axis:

```text
r     = length(p)
mu    = dot(p / r, v)
zeta  = dot(p / r, A)
kappa = dot(v, A)
ell   = branch length
```

The three direction cosines must lie in their Gram-matrix domain:

```text
1 + 2 * mu * zeta * kappa - mu^2 - zeta^2 - kappa^2 >= 0.
```

Along `q(t) = p + t * v`, these values and fixed `rho` determine

```text
r_t^2       = r^2 + t^2 + 2 * r * t * mu
A dot q(t)  = r * zeta + t * kappa
d_t^2       = rho^2 + r_t^2 - 2 * rho * (r * zeta + t * kappa)
mu_s(t)     = [rho * (r * zeta + t * kappa) - r_t^2] / (r_t * d_t)
nu(t)       = [rho * kappa - (r * mu + t)] / d_t.
```

These point-source equations require `d_t > 0`. A branch that reaches the
source center has an inverse-square and direction singularity and must be
excluded or governed by an explicit finite-emitter radius, clamp, or
termination policy.

In the distant limit, `zeta` becomes `mu_s` and `kappa` becomes `nu`. A
canonical line may likewise use `(b, eta, kappa, x)` at fixed `rho`, with

```text
d(x)^2 = rho^2 + b^2 + x^2 - 2 * rho * (b * eta + x * kappa).
```

Its valid angular domain includes `eta^2 + kappa^2 <= 1`.

This makes same-rank spherical finite-source storage a legitimate later
hypothesis. It does not make the distant and finite assets identical, and it
does not yet prove a viable grid, page key, resident set, point/area emission
policy, or inverse-square precision. A finite area source adds angular-support
and visibility integration that this point-source derivation does not cover.

The existing **Flat/dome local Sun** is different. Its atmosphere/map center,
source subpoint, dome or map boundary, and finite source placement form a
two-center problem. The current source-centered `z x rho` position family
cannot be inferred from the spherical tuple above, and additional map-relative
invariants or a distinct coordinate family may be required.

The implemented distant and local caches already share recurrence and logical
lifecycle concepts rather than one concrete field shape. The distant plan
therefore includes a pre-layout mathematical shape-impact audit: it must show
that generic manifests/loaders do not preclude a same-rank spherical finite
source and must retain an explicit Flat/dome counterexample. That audit is not
a local implementation or accuracy claim. A later local study may reuse
cumulative-integral semantics, Native15 tooling, compiler orchestration,
manifests, codecs, loaders, and atomic publication, but it must independently
select its source model, sufficient coordinates, asset identity, and resource
contract.

After distant-Sun acceptance, a separate local study should select spherical
versus flat and point versus area-source physics, prove coordinate sufficiency,
demonstrate convergence to the distant limit under preserved far-field
irradiance, measure dimensions and residency, and only then write a local-Sun
plan.

### Not covered

- clouds, weather, terrain shadows, or horizontal atmosphere variation;
- dynamic atmosphere composition inside one asset;
- a new Color or exposure policy;
- stellar, Sun-tile, or Moon raster representation;
- a production promotion; or
- artistic correction of the nautical-twilight image.

## Implementation Sequence

The [distant-Sun execution plan](distant-sun-solar-zenith-cache-plan.md) records
the operational phases, deliverables, and gates for the branch-integrated
candidate. Before that sequence can be authorized, a focused spectral/N4
follow-up must compare run `000498`'s cumulative-density culling opportunity
with the other uncompressed candidates. If branch-integrated storage is then
selected, its candidate order is:

1. freeze physical semantics and prove branch geometry;
2. select preliminary branch checkpoints and provisionally choose origin-
   indexed versus canonical-prefix addressing with high-resolution cumulative
   J1 curves, while measuring the boundary-total endpoint comparator;
3. build an independent actual-point N4 truth solver;
4. requalify the checkpoint mapping and the complete layout fork at N4, then
   compile and qualify an uncompressed Native15 offline asset;
5. prove a contained loader/sampler and query-derived residency;
6. perform physical, spectral, endpoint, lifecycle, and resource
   qualification; and
7. study one codec at a time only after the uncompressed representation passes.

The end product is a qualified distant-Sun offline compiler and contained
runtime proof. Production promotion and local-Sun design are separate owner
decisions.

## Open Decisions

The following are intentionally unresolved:

- origin-indexed `(r, mu, mu_s, nu, ell)` storage versus canonical whole-ray
  prefix coordinates;
- whether either checkpoint layout materially outperforms the qualified
  single-boundary-total endpoint identity after short-segment conditioning;
- retained branch-checkpoint count, metre mapping, interpolant, and chunk key;
- factored transmittance/optical-depth storage and finite-segment algebra;
- the exact full daylight-to-night support range beyond the proposed dense
  twilight interval of `+5` to `-24 degrees`;
- grid mappings and counts for every selected coordinate;
- whether single Mie, direct/single scattering, irradiance, or scattering
  orders remain separately stored;
- `R32F`, scaled `R16F`, block-float, or another spectral precision policy;
- maximum chunk residency for each supported query family;
- linear basis, spectral dictionary, page residual, hybrid, or no compression;
- whether to adopt source-SPD factoring and how to represent it. The declared
  elastic wavelength-independent transport is linear in each source spectral
  channel, so factoring a fixed per-channel source amplitude is algebraically
  available; precision, zero handling, units, and asset/source identity still
  require qualification; and
- which compiler/runtime infrastructure a later finite/local-source design can
  reuse, and whether a fixed-range spherical point source can reuse the same
  axis count while Flat/dome requires a distinct family. No common
  local/distant physical field shape or asset is selected here.

## Current Conclusion

The current twilight problem is no longer best treated as a color or angular-
sample-count problem. The cache is missing the coordinate that tells it where
an actual spherical point lies relative to the solar terminator.

No successor representation is selected. The branch-integrated checkpoint,
canonical-prefix, single-boundary-total, and actual-point cumulative-density
options must be compared under the same Native15 physical-error and complete
resource ledger.

Accepted pre-phase run `000498` establishes a concrete memory opportunity for
the cumulative-density option at the exact San Jose +1h Sun state. On a
hypothetical 180-center one-degree zenith lattice with current Native48-v2,
production W27, and direct Native15 `R32F`, a conservative
altitude-interpolation-safe ragged ledger retains `617` of `8,640` blocks:
`154.424171 MiB` instead of `2,162.438965 MiB`, a `92.858796%` reduction. One
extra angular node on both sides retains `713` blocks or `178.451271 MiB`. If
the physical layout can only retain complete zenith pages, those figures rise
to `216.243896 MiB` for 18 pages or `240.270996 MiB` for 20 pages.

Those counts are not an accuracy or construction result. The next evidence
must determine whether the one-degree zenith interpolation preserves actual
spectra and whether a complete actual-point N4 solver can construct the same
culled subset without hidden dependencies. It must also measure a real ragged
packing; otherwise the whole-page figures own the comparison. A universal
all-Sun offline asset remains larger even if one scene uses only this subset.

There is likely substantial *approximate* redundancy across adjacent zenith
pages and among Native15 spectral shapes. There is not yet evidence of enough
*exact* duplicate spectra to justify an index-only dictionary. The design
therefore starts each candidate from an uncompressed Native15 correctness
baseline and treats every dictionary, basis, delta, or cross-zenith residual
as a separately qualified compression layer. The first qualified asset is
distant-Sun only; local/finite-source coordinates remain a later independent
design.
