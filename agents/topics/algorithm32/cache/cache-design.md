# Algorithm32 Cache Interface Design

Status: selected software design with one explicitly non-selected flat/local
research proposal. This document describes the accepted software surface for
GPU cache construction and runtime ownership and clearly labels the proposed
extension below. The production plan owns delivery status. The
[Algorithm32 reconciliation plan](../archive/reconciliation-2026-08-04/algorithm32/reconciliation-plan.md#29-retire-descriptors-and-justify-assembly-declarations)
owns the Step 2.9 direct-contract decision; this document records the resulting
cache interface without duplicating that decision.

## Authority And Scope

This document owns the production cache's software interfaces, assembly
boundaries, renderer-adapter boundary, concrete class roles, and the software
realization of resource lifecycle. The
[selected cache contract](cache-contract.md) is the umbrella authority for
field meaning, recurrence, frozen numerical domains, construction options,
ground participation, invalidation semantics, runtime calculation, and
completion-evidence categories. The
[spatial reconstruction contract](spatial-reconstruction.md) owns the exact
final-view position lookup and its evidence. The
[outgoing reconstruction contract](outgoing-reconstruction.md) owns the exact
W27 direction lookup and its evidence. The
[solar-zenith cache design](solar-zenith-cache-design.md) owns the active
successor research representation and does not alter these implemented
interfaces before promotion. Its
[distant-Sun execution plan](distant-sun-solar-zenith-cache-plan.md) owns the
contained phase order and evidence gates. The
[production implementation plan](../production/production-implementation-plan.md)
owns delivery order and implementation status.

This document consumes those numerical contracts; it does not restate or
replace them. Interface examples below describe how accepted calculations are
assembled and owned, not an independent numerical specification.
The explicitly labeled flat/local proposal is a research design only. If it is
promoted, its selected numerical facts move to the cache contract and a
flat/local reconstruction authority rather than becoming normative here by
proximity to the accepted interfaces.

The design retains the accepted production algorithms and logical data shapes.
It does not retain the retired experiment's API shape, raw Three.js resource
exposure, CPU-uploaded primary fields, or manual browser-harness lifecycle.

## Implementation Status

The executable staging surface through Stage 5 is complete and accepted. It
includes the
ambient contracts, common/CPU/GPU capability split, direct CPU-cache rename,
deterministic assembler, trusted typed executor, executable
`CacheFieldStorage` allocation facts, bounded probes, shared black-ground
module, opaque Three/WebGL2 backend, source-owned primary `J1` and direct
`L1`, generic scatter/transport/accumulation programs, and exact N1, N2, and
N4 plans. Spherical/distant N4 reuses one geometry-packed,
atmosphere-dependent transport kernel through `CacheOperations`. Flat/local
N4 instead reconstructs rays and stencils and evaluates extinction directly
inside both GPU transport passes through `IntegratedCacheTransport`; it
constructs and uploads no packed transport kernel. Neither plan produces
`L4`. The executor records exact logical field and packed-data payloads as
unit-bearing byte values while releasing every non-result field after its
final consumer.

The accepted software-renderer evidence covers exact N1 copy, bit-identical
shared N2/N4 values, selected-only readback, result-only retention, and
cleanup under the unchanged predeclared bounds. The
[baseline import status](../production/baseline-import-status.md) owns the
exact comparison counts, observed error, and artifact-memory results. Exact
literal pinning of the ordinary Fibonacci-34 parent data plus deterministic
reflection completion gives Node and browser runtimes the same current
Fibonacci-68 executable vectors and weights.

That software-renderer result establishes staging-path conformance, not
supported-hardware performance. Hardware timing and resource budgets remain
open.

The Stage 6/7 controller and runtime surface is present. `DistantSunCache`
owns one completed artifact, `DistantSunCacheController` owns one assembler,
executor, serialized generation stream, direct plan/backend-capability reuse
key, and atomically published active cache, and the public build request
carries only physical collaborators, basis, order, and cancellation. Focused Jasmine
coverage establishes exact reuse, changed-owner rebuilds, independent
controllers, complete N1/N2/default-N4 publication, failure preservation,
external cancellation, A-to-B-to-A supersession, and exactly-once owned-result
disposal without backend disposal.

`createCacheController` is the one public source cache factory. `ShaderBuilder`
awaits its cumulative cache, consumes the cache-owned final-view contribution,
and asks the backend to install the opaque binding. The composer owns the
backend after every attachment that uses it. CPU and shader final-view paths
receive geometry-resolved Native-48 and W27 stencils and perform one cumulative
lookup per path point; no incident-cache API, CPU upload, direct-view term, or
compatibility path remains.

Stage 9 also implements the separate `LocalSunCpuCache`, `LocalSunCache`, and
`LocalSunCacheController` through the same generic recurrence, executor,
backend, publication, and runtime boundaries. Its selected position domain is
the scaled 19-by-15 `z`/source-subpoint-`rho` grid. For the qualified 100 km by
4.8 Mm case, its current production realization has 285 position nodes,
9,690 transport output queries, 74,795,400 resident bytes, zero packed
transport bytes, 63,024 peak packed auxiliary bytes, and 224,386,200 peak
tracked logical bytes in the selected software-renderer proof. The
[flat/local promotion register](../flat-local/unresolved-research.md) owns the
selection, exact evidence, and claim limits.

## Design Goals

The interface must make these facts structural:

- the atmospheric light source owns the complete cache design, primary `J1`
  and direct `L1`, selected executable domains, direct field storage, and build
  graph, while its per-runtime controller owns reuse-key comparison, staging,
  and atomic publication for one consumer;
- atmosphere, geometry, ground, source, and generic transport contribute only
  the construction behavior they own;
- generic construction depends only on typed interface contracts and
  executable field/storage facts; it never asks whether a source is local or
  distant or whether geometry is flat or spherical;
- the generic recurrence accepts only a pure preceding field and never a
  cumulative field;
- the JavaScript executor owns pass and wavelength-layer orchestration while
  GPU programs perform the field work;
- Three.js and WebGL remain behind one renderer adapter;
- normal construction performs no full CPU readback;
- the CPU implementation remains an oracle rather than a second production
  construction strategy;
- failed, cancelled, or superseded staging work cannot damage the active
  cache; and
- the final runtime retains only the cumulative GPU field.

## Proposed Flat/Local Dome-Aware Nonlinear Position Index

Status: concrete research proposal. Its Stage 1 physical boundary inputs are
selected and its analytic boundary is accepted within the isolated engineering
study, and Stage 2 accepts the missing-coordinate/canonical-half-domain
invariant for its frozen direct binary64 slice. No cache change is selected.
Star-lane Stages 0 through 2 are accepted. Stage 3 has reached its terminal
predeclared result: candidates v2, v3, and v4 are structurally conformant but
rejected on the unchanged held-out direct-J2 accuracy gates, and the terminal
v4 candidate exhausts the unchanged resident-field node budget. Further
node-additive refinement of this path is closed and Stage 4 is blocked. The
current scaled 19-by-15 `z`/`rho` domain remains production behavior. Nothing
in this section changes its direct contract, reuse key, interpolation, cache
data, or evidence.

Every Star-lane path, command, oracle, and authority statement retained in
this closed proposal is an exact pre-retirement historical record only. It is
not a current executable surface or acceptance authority.

The former
[local-Sun scattering-aligned shell index](local-sun-cache-design.md)
is terminal archived evidence. No active local-Sun successor representation
is selected; any future one requires a new design rather than reopening that
historical family.

This proposal addresses two different problems and keeps them separate:

1. a whole-flat-world atmosphere boundary introduces a missing physical
   position coordinate that the current source-centered `z`/`rho` cache cannot
   represent; and
2. the current construction transport representation contains exact padding
   and host/backend copies that can be removed without changing any physical
   coordinate.

Transport compaction can be evaluated against the current selected domain
first. It does not make the current two-dimensional position key physically
sufficient for a map-centered atmosphere. Conversely, a nonlinear position
mesh does not by itself remove fixed-row transport padding.

### Selected Stage 1 geometry input

The recovered flat work does not contain an accepted executable whole-world
atmosphere boundary. The old repository's archived `ext-018` work implemented
an observer-centered diagnostic dome, while `ext-025` left map/world-centered
edge behavior pending. Current production retains that same distinction:
`FlatEarthGeometry` applies the observer-centered dome only to final-view rays;
reusable source and cache-construction paths use ground, a top plane, and a
source-centered radial cache boundary. Algorithm32-star likewise has no
integrated dome-aware flat/local N-order cache.

The recovery evidence is:

- `C:\dev\poly-gc-react\agents\topics\apps\flat\reconciliation\archive\mark-i-m2-calibration-and-evidence-plan.md`,
  where `ext-018` owns the observer-centered diagnostic result and `ext-025`
  leaves map/world-centered edge verification pending;
- `C:\dev\poly-gc-react\scripts\flat\reconciliation\POC\src\geometry\FlatEarthGeometry.js`,
  whose dome builder rejects every non-observer-centered policy; and
- the current `src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js`, whose
  reusable construction explicitly excludes the observer dome.

These are evidence and implementation history, not a runtime dependency or an
already selected full-world equation.

The
[Stage 1 boundary decision](../experiments/flat-world-atmosphere-boundary-decision.md)
now selects the experiment inputs recovered from that repository:

- the fixed North-Pole azimuthal-equidistant map frame with
  `C = [0, 0] m`;
- the closed whole-world disc with
  `R = 20,015,114.442035925 m`;
- the `earth-clear-day` flat boundary profile at
  `H = 100,000 m`, paired with the already pinned
  `canonical-atmosphere` optical medium; and
- a zero-thickness South-Pole rim seam with opaque ground below and
  transparent atmosphere exit across the cap, not an opaque or reflective
  vertical wall.

The retained profile and its external source hashes are
content-addressed in
`scripts/algorithm32-star/cases/flat-world-atmosphere-boundary-profile-v1.json`.
The recovered values do not turn the old observer-centered implementation
into whole-world authority. The map-centered surface and its explicit rim
classification remain a new experiment selection.

The selected Stage 1 boundary reuses the recovered shallow-sphere apex/rim
construction but moves its horizontal center from the observer to the fixed
map center. For the selected circular map footprint of radius `R` and
atmosphere apex altitude `H` above ground at `C`:

```text
centerZ      = (H^2 - R^2) / (2 * H)
sphereRadius = (H^2 + R^2) / (2 * H)
sphereCenter = (C.x, C.y, centerZ)

surfaceTerm(r) = sqrt(sphereRadius^2 - r^2)
capAltitude(r) =
  ((R - r) * (R + r)) / (surfaceTerm(r) - centerZ)
0 <= r <= R
```

This surface passes through `(r = 0, z = H)` and the ground rim
`(r = R, z = 0)`. The atmosphere domain is the volume between ground and that
cap. `R` comes from the selected whole-map projection/domain profile; `H`
comes from the selected atmosphere profile. Neither is derived from the
camera, cache node count, Sun distance, or a render cap.
The quotient is algebraically equal to
`centerZ + surfaceTerm(r)` but avoids subtracting two world-scale values for a
shallow cap.

For an in-domain origin `O` and unit ray `D`, form the ground-relative,
map-radius-scaled implicit sphere directly rather than subtracting two
absolute world endpoints or burying low altitude in a world-scale sphere
coordinate:

```text
dx = O.x - C.x
dy = O.y - C.y
r  = hypot(dx, dy)
xR = dx / R
yR = dy / R
zR = O.z / R
centerR = centerZ / R

rMinus = (r - R) / R
rPlus  = (r + R) / R
a = dot(D, D)
b = xR * D.x + yR * D.y + (zR - centerR) * D.z
c = rMinus * rPlus + zR * (zR - 2 * centerR)
s = sqrt(max(0, b^2 - a * c))

tauExit =
  onBoundary(O) and b >= 0 ? 0
  : b >= 0                ? -c / (b + s)
                           : (-b + s) / a

tExit = R * tauExit
```

The scaled quadratic is algebraically identical to the physical sphere;
it conditions the calculation without changing a source position, ray
direction, or physical distance. The quotient branch avoids cancellation for
a shallow cap and an outward ray. For an exact unit vector `a = 1`; retaining
the explicit coefficient is required in finite precision because a
step-rounded normalized vector need not have an exactly unit represented dot
product. CPU and GLSL apply the same boundary classifications and compare the
nonnegative cap root with ground or any separately selected opaque boundary.
The pinned `onBoundary` policy handles exact/tangent contact before the
quotient so `0 / 0` cannot occur. Outward contact returns a zero-length
in-atmosphere segment rather than a fallback distance.

Stage 1's pre-output binary32 matrix refines only the finite-precision
realization of that same implicit sphere. Directly storing the roughly
two-billion-meter sphere center in one binary32 scalar can erase meter-scale
altitude before `Qn.z` is formed. The matching binary32 CPU/shader candidate
therefore uses the map-radius form above and evaluates its small terms in
factored form. It must preserve physical near-rim clearance before division:

```text
r        = hypot(O.x - C.x, O.y - C.y)
qMinus1  = (r - R) / R
qPlus1   = (r + R) / R
radialC  = qMinus1 * qPlus1
```

Forming a rounded `q = r / R` and only then subtracting one is not the selected
realization: at the whole-world radius it can discard the final meters of
clearance before the factored term is formed. The same physical-clearance
factors are used by the stable cap quotient. This reassociation is
algebraically identical to `(q - 1) * (q + 1)` and does not move the cap,
source, ground, or rim. The retained Stage 1 matrix continues to own the exact
feature cases and unchanged 32-ULP non-contact binary32 gate.

This is the selected Stage 1 engineering candidate, not a recovered accepted
equation or a production boundary. Replacing it reopens the axisymmetry and
coordinate-sufficiency proof below.

The
[historical Stage 1 evidence](../archive/algorithm32-star/experiments/star-flat-local-cache-plan.md#stage-1-evidence)
verifies the geometry-owned `FlatWorldAtmosphereDomain` before any cache index
is scored. The selected domain and its implementation preserve:

- the fixed map/world center `C`, map footprint, atmosphere surface, and exact
  transparent-exit equation;
- the stable CPU intersection algorithm and matching shader calculation;
- whether the surface is axisymmetric about `C`;
- boundary classification for ground, physical atmosphere exit, and any
  opaque map boundary;
- use of the physical atmosphere exit by view, source-transmittance, direct
  primary, and reusable cache-construction rays;
- altitude-based density, scattering, and absorption without rescaling them
  to fit the dome; and
- vacuum continuation from atmosphere exit to a finite light source when the
  light remains physically farther away, while retaining the complete
  sample-to-source distance for direction, inverse-square falloff, and
  source-radius behavior.

The selected boundary must be observer-independent. Camera motion must not
change it or rebuild the cache. A physical observer-centered all-path dome
would instead make the reusable field observer-dependent and is a different
design.

No scalar no-hit cap, cache radius, terminal position row, source-distance
scale, or camera far plane may stand in for this physical selection. The cache
node envelope is an approximation domain, never a ray boundary.

### Why a nonlinear `rho` remap is insufficient

Let:

- `C` be the fixed horizontal map/world center;
- `S` be the horizontal subpoint of the finite Sun;
- `P` be a horizontal sample position; and
- `z` be its altitude.

The current position key is effectively:

```text
(z, rhoSun)
rhoSun = length(P - S)
positionIndex = zIndex * rhoCount + rhoIndex
```

For a horizontally homogeneous slab, rotation about `S` makes this reduction
valid. A map-centered finite atmosphere with `S != C` breaks that symmetry.
Two points can have the same `z` and `rhoSun` while having different distances
to the map center, different atmosphere thicknesses, and different ray exits.
Every scalar remap `rhoSun -> f(rhoSun)` still aliases those points. Morton,
Hilbert, or another reordering of the same nodes may improve locality but also
cannot restore the missing coordinate.

The first mandatory diagnostic holds `z` and `rhoSun` fixed and compares points
at different map radii. With `C = (0, 0)`, `S = (4.8 Mm, 0)`, and
`rhoSun = 4 Mm`, the initial points are:

```text
toward map center:       (0.8 Mm, 0)
transverse:              (4.8 Mm, 4 Mm)
away from map center:    (8.8 Mm, 0)
reflected transverse:    (4.8 Mm, -4 Mm)
```

The first three must not be forced to one cache position. The two transverse
points must agree only after the position and outgoing-direction frames are
reflected together. This counterexample is a gate before a large cache build.

The
[historical Stage 2 evidence](../archive/algorithm32-star/experiments/star-flat-local-cache-plan.md#stage-2-evidence)
passes that gate for the frozen direct binary64 slice. All three required
non-reflection pairs have distinct physical exits or fields, while the
transverse reflection control is exact after both position and direction are
reflected. This accepts the need for the additional invariant and the
canonical reflection reduction for that slice; it does not select a mesh,
interpolation rule, node count, cache field, or production change.

### Candidate invariant coordinates

When the selected atmosphere surface and medium are axisymmetric about `C`,
the combined map/source system has reflection symmetry about the horizontal
line through `C` and `S`. For `S != C`, define:

```text
a     = length(S - C)
eAxis = (S - C) / a
eSide = a fixed perpendicular to eAxis
x     = dot(P - C, eAxis)
y     = abs(dot(P - C, eSide))
key   = (z, x, y)
```

This is a canonical half-domain, not a dense azimuth axis. The equivalent
two-center distances are:

```text
rhoMap^2 = x^2 + y^2
rhoSun^2 = (x - a)^2 + y^2
```

Thus `(z, rhoSun, rhoMap)` and `(z, x, y)` carry the same generic positional
information up to the declared reflection. The axial/transverse form avoids
the poorly conditioned inverse of the two distances near coincident centers.
When `S == C`, the extra dimension collapses under rotational symmetry to
`(z, rhoMap)` and the geometry supplies one deterministic direction-frame
fallback.

For `side = dot(P - C, eSide) < 0`, canonicalization reflects both operands
across the vertical `C`/`S` plane:

```text
Pcanonical = P - 2 * side * eSide
Dcanonical = D - 2 * dot(D, eSide) * eSide
```

`D` is the physical outgoing direction. The W27 direction stencil is resolved
from `Pcanonical` and `Dcanonical` together. On the plane, the geometry uses
the declared positive `eSide` fallback. Reflecting position without direction,
or direction without position, is an invalid cache lookup.

The geometry may derive boundary-fitted locator coordinates such as normalized
map radius or signed dome clearance after the physical surface is selected.
Those coordinates are allowed only for node placement and cell lookup. They
must be monotone over the physical domain and may not shorten a ray, move the
Sun, flatten atmosphere thickness, or clamp a physical sample to the nearest
node.

For the shallow-sphere candidate, the initial exact locator is:

```text
r   = sqrt(x^2 + y^2)
q   = r / R

centerFeature = q == 0
rimFeature    = q == 1 and z == 0

phi = centerFeature ? 0 : atan2(y, x) in [0, pi]
eta = rimFeature ? 0 : z / capAltitude(r)
```

`q = 0` collapses all `phi` values to the map center, and `q = 1` collapses the
zero-thickness rim's `eta` values. Those are explicit topology
identifications, not near-equal coordinates. This maps the curved physical
volume to a fixed logical half-domain while preserving the exact analytic cap.
The locator validates `q` and `z` against the physical domain before these
branches; it does not clamp an out-of-domain value to zero or one.

The binary32 shader locator defines `q` in normalized map-center-relative
coordinates and takes the two feature branches on exact representable zero or
one. Its CPU parity resolver applies the same binary32 normalization before
cell selection. The binary64 physical reference separately retains the pinned
geometry contact rule (`1e-9 m` absolute or `1e-12` relative). The experiment
must include exact center/rim inputs and the immediately adjacent binary32
values on both sides so a CPU/GLSL classification mismatch or an unintended
collapsed annulus is a failure.

If the selected map, medium, ground, or atmosphere surface is not axisymmetric
and reflection-symmetric, this three-coordinate reduction is invalid. The
experiment must reject it rather than treating approximate visual symmetry as
an indexing fact.

### Sparse nonlinear topology and packed node IDs

A full tensor product over `z`, `x`, and `y` is the brute-force control, not
the candidate. The candidate is a constrained tetrahedral mesh in the exact
boundary-fitted logical half-domain:

```text
physical position
  -> geometry-owned canonical (z, x, y)
  -> exact boundary-fitted logical coordinate
  -> coarse cell accelerator
  -> containing logical tetrahedron
  -> four contiguous positionNodeIds plus barycentric weights
```

Here, nonlinear indexing means that physical position is resolved through a
boundary-fitted, piecewise cell locator and indirection table rather than an
affine tensor-product flattening formula. It is not a lossy hash: two
physically distinct canonical coordinates never share a node ID unless they
are the same retained mesh vertex.

The tetrahedra are affine in a source-cube-local quotient locator space and
generally curvilinear in physical space through the analytic boundary mapping.
A straight physical tetrahedral envelope is not an accepted substitute for
the curved atmosphere: an inscribed envelope would leave an uncovered shell,
while a circumscribed one would invent atmosphere outside the selected
boundary. Every node's physical position is obtained from the pinned analytic
mapping.

The first discard-only candidate used ordinary uncollapsed
`(q, phiFraction, eta)` barycentrics and then discarded tetrahedra whose
feature-collapsed node IDs repeated. Pre-execution proof rejected that rule:
the surviving three tetrahedra covered only part of each center- and
rim-adjacent cube. It produced no physical output and received no run
identity.

The Stage 3 candidate-v2 baseline normalizes each selected source cube to
`(u, v, w)` and evaluates barycentrics in these exact quotient coordinates:

```text
center-adjacent q slab: (u, u * v, w)
interior q slab:        (u, v, w)
rim-adjacent q slab:    (u, v, (1 - u) * w)
```

The center transform collapses the local angular axis only at `q = 0`; the
rim transform collapses the local altitude axis only at `q = 1`. The same
transform is applied to the source-cube vertices and each query before
barycentric evaluation. Three retained Freudenthal tetrahedra tile each
boundary triangular prism, while all six tile each interior cube. In
normalized locator coordinates each boundary tetrahedron has absolute
determinant `1/6`, and the three-cell total is `1/2`, exactly the prism
measure. Locator vertices are reconstructed from the retained level tables,
source-cube ID, permutation ID, and these fixed rules; no exact-position hash,
canonicalization table, or stored per-cell vertex table belongs to the packed
candidate.

The baseline topology remains identified as `candidate-v2`. Before any
candidate-v2 Stage 3 output, static audit superseded its first evidence matrix
because three named probes did not strictly distinguish the rejected
discard-only cells and the full-search oracle still inherited accelerator
ownership. Its frozen policy-v3/matrix-v3 evidence uses strict
old-gap/new-cell-interior probes, a global all-cell oracle, independent
matrix-derived topology, physical-mapping and metric checks, observed
primitive-call accounting, and recursive import closure. This was an
evidence-design correction, not a topology, physical-boundary, node-count, or
resource-formula change.

Candidate-v3 then applied the separately frozen deterministic ten-node,
seven-star refinement to produce 305 nodes and 1,296 cells. Candidate-v4
applied the terminal resource-saturating deterministic ten-star refinement to
produce 319 nodes and 1,345 cells while retaining the same quotient locator,
physical dome, W27/native-15 resident field, and four-tap consumer boundary.
The candidate-v4 retained inputs were frozen before output: policy raw
SHA-256
`ec7fc018c13776ab9ff45910f4d8ec8fbaf879f3be6ece081c745ec50b399bc8`
and matrix raw SHA-256
`a385ca2996f7e87a462cc64e989198ebe797760ef226af812f279296cb6bdc35`.

The topology must:

- include exact ground, atmosphere-surface, map-rim, map-center/source-axis,
  and source-center-degeneracy features;
- collapse the declared `q = 0` and zero-thickness-rim duplicate coordinates
  to unique node IDs, admit no zero-volume interior cell, and retain a positive
  physical mapping Jacobian away from those analytic collapsed boundaries;
- store only reachable cells and nodes;
- begin with a coarse boundary-conforming mesh and refine by deterministic
  longest-edge subdivision or an equivalently pinned rule;
- refine from held-out field error, not from camera location or a hand-set
  physical distance cutoff;
- assign each retained physical node one contiguous opaque
  `positionNodeId`; and
- provide a deterministic coarse-bin-to-candidate-cell table so CPU and GPU
  lookup never linearly scan the whole mesh.

Node ID has no metric or physical meaning. Geometry owns the node table, cell
table, accelerator, canonical reflection, and both construction and final-view
stencils. The concrete local-Sun cache owns the dense node-ID storage axis.
Generic recurrence, the executor, and the renderer backend remain unaware of
flat geometry and tetrahedra.

The existing four-position-tap consumer boundary can remain:

```ts
type DomeAwarePositionStencil = Readonly<{
	indices: readonly [number, number, number, number];
	weights: readonly [number, number, number, number];
}>;
```

Inside a valid cell, weights must be finite, nonnegative within a pinned
roundoff allowance, and sum to one. A boundary query may collapse duplicate
vertices and zero weights but retains the fixed four-lane shader shape.
An uncovered in-domain query is a build/configuration failure. It is never
served by terminal-row or nearest-cell clamping.

The resident read remains:

```text
texelFetch(
  cumulativeField,
  ivec3(directionIndex, positionNodeId, wavelengthIndex),
  0
)
```

Its logical shape remains `[W27 direction, packed position node,
native-15 wavelength]`. With `P` packed nodes, resident R32F bytes remain:

```text
residentBytes = 4 * 4,374 * P * 15 = 262,440 * P
```

The current 80 MiB resident ceiling permits at most 319 nodes for the field
alone under unchanged W27/native-15 storage. The combined resident gate below
also includes required topology and lookup resources, so another layout may
permit fewer nodes. Candidate-v4 demonstrates that its complete 319-node
layout fits with 121,304 bytes of headroom, while a 320-node field alone
exceeds the ceiling. This is a feasibility gate, not permission to stop
refinement at a particular count. If the accuracy-qualified mesh does not fit,
the proposal fails the current resident representation and must either be
rejected or followed by a separately designed field-value compression study.
Artificially deleting nodes, shrinking the world, or lowering the Sun to
satisfy the ceiling is prohibited.

### Stage 3 terminal sparse-candidate result

The
[historical Stage 3 evidence](../archive/algorithm32-star/experiments/star-flat-local-cache-plan.md#stage-3-evidence)
retains the candidate-v2 baseline and the two predeclared node-additive
refinements:

| Candidate | Focused evidence                     | Deciding evidence         |                Topology | Result                                    |
| --------- | ------------------------------------ | ------------------------- | ----------------------: | ----------------------------------------- |
| v2        | run `000194`, 123 tests accepted     | run `000195`, 15/16 gates | 295 nodes / 1,260 cells | rejected on held-out direct-J2 accuracy   |
| v3        | run `000197`, 144/144 tests accepted | run `000198`, 16/19 gates | 305 nodes / 1,296 cells | rejected only on the H/V accuracy gates   |
| v4        | run `000201`, 165/165 tests accepted | run `000202`, 16/20 gates | 319 nodes / 1,345 cells | rejected only on the H/V/W accuracy gates |

The candidate-v2 maximum normalized L-infinity is
`2.207397222561571` against `0.1`, and its p95 normalized RMS is
`0.9825588119795285` against `0.02`. Candidate-v3 improves the retained H
surface to `0.891560716143075` / `0.3982647449659014` and reports
`0.665113743081585` / `0.24696158884240738` on its independent V surface,
but both remain outside the same limits. Its combined resident size is
`80,088,908` bytes and its peak tracked logical size is `431,994,660` bytes.

Candidate-v4 further improves H to
`0.38124590303594585` / `0.17052603364464278` and V to
`0.491972686064957` / `0.20214936622655572`, but still fails both limits.
Its freshly frozen independent W surface is substantially worse at
`6.968497055654817` / `3.0195444147383035`. Run `000202` passes every
mapping, topology, coverage, interpolation, accelerator, feature-collapse,
reflection, explicit-rejection, spectral-validity, resource, provenance, and
independence gate. Only the four frozen accuracy gate IDs fail: two score H
and one each score V and W, with all three metric surfaces reported
separately.

Candidate-v4 retains `83,764,776` combined resident bytes and projects
`451,821,040` peak tracked logical bytes. Its resident headroom is only
`121,304` bytes. One additional unchanged node requires at least `262,464`
bytes before any new cell or accelerator storage, and a 320-node field alone
would require `83,980,800` bytes, exceeding the `83,886,080`-byte resident
ceiling by `94,720` bytes.

This terminal result closes further node-additive refinement of this
predeclared sparse path under the unchanged W27/native-15/four-tap resident
field representation. It does not reject the Stage 1 physical boundary or
Stage 2 coordinate invariant, prove that every arbitrary placement of at
most 319 nodes fails, or reject a separately designed field compression or
representation. The exact ragged-transport companion also remains an
independent storage study. Stage 4, higher-order, GPU, rendering, and
production work remain blocked, and the selected production 19-by-15 cache is
unchanged.

The known exact resident-field topology redundancy is much smaller than the
transport padding: W27 stores 4,374 face-local slots but has 4,058 unique
seam/corner directions. For the current 285 positions, deduplicating only those
316 direction slots could save 5,403,600 bytes, about 7.22 percent of the
resident field. Any stronger claim that most resident field values are
redundant requires its own lossless-content or error-bounded compression study;
it is not assumed by this position-index proposal.

The complete cache reuse key must include the selected physical boundary,
source state, canonical-frame policy, node coordinates, tetrahedra,
accelerator, refinement policy, position-stencil implementation, W27/native-15
domains, construction options, and ground boundary. Camera and display state
remain excluded.

### Completed Indexed Transport Interim

The Flat/local offload transaction first replaced the pre-fusion fixed
maximum-tap rows with an exact CSR representation. That representation was a
temporary algorithm-preservation control and is no longer a production
construction path.

The fixed control stored 9,690 rows with 236 slots per row, for 2,286,840 tap
slots. Complete enumeration found 677,983 active taps and 1,608,857 padding
slots. The indexed control retained the active sequence as:

```ts
type RaggedCacheTransportData = Readonly<{
	queryCount: number;
	activeTapCount: number;
	queryOffsets: CacheData;
	sourceDirectionIndices: CacheData;
	sourcePositionNodeIds: CacheData;
	coefficients: CacheData;
}>;
```

`queryOffsets` has `queryCount + 1` entries. The source arrays have
`activeTapCount` entries, coefficients have shape `[activeTapCount, 15]`, and
the shader traversed each half-open row range. Complete sequence hashes and
selected R32F outputs established exact fixed-row-to-indexed equivalence. The
logical indexed transport payload was 46,141,608 bytes; its R32F GPU packing,
including row padding, was 46,858,240 bytes rather than the fixed control's
164,652,480 transport bytes.

The fused production cutover subsequently removed both Flat representations
from plan construction, shader bindings, uploads, and execution. Production
now reports exactly zero Flat packed transport bytes. The concrete CPU fixed
and indexed builders remain diagnostic authorities for the sealed transition
evidence; they are not runtime fallbacks or selectable product strategies.
Spherical/distant packed transport was not part of this interim transaction
and remains unchanged.

### Archived Algorithm32-star feasibility experiment

Do not revive Star's rectangular local cache in place. Its
`FlatAtmosphereGeometry`, `local-j2-cache-descriptor`,
`local-j2-cache`, provisional case, and resident local-dome GPU lane encode
the old `z`/`rho` domain and exclude the dome from reusable L1/J2 paths.
Modifying them would create a new algorithm and then incorrectly compare it
with itself.

The user-authorized study ran in a new, isolated engineering lane inside the
standalone Algorithm32-Star package. That lane is now closed; its rules,
source, and immutable runs are archive-internal and indexed by the
[Algorithm32-Star evidence archive](../archive/algorithm32-star/README.md).
The
[flat/local dome-cache experiment plan](../experiments/star-flat-local-cache-plan.md)
records the executed sequence. New source was isolated, every observed result
received a new immutable run, and historical source/result identities were not
rewritten into the candidate.

The experiment plan is the sole owner of the exact source tree, runner names,
execution stages, and terminal status. This design constrains their
physical and numerical behavior without maintaining a second copy of those
operational facts.

It imported unchanged, hash-pinned Star primitives for the canonical
atmosphere, local point Sun, spectral basis, L1 directional samples, the
exported `integrateBuilderJ2Node`, and the independent direct-J2 oracle. It
also reused Star's generic arbitrary position-domain, directional-cache,
and CPU-field containers. Runs `000035-cpu-local-j2-cache-oracle-comparison` and
`000037-cpu-local-cached-algorithm32-star-dome` are harness/reporting
templates only.

The key archive-internal reusable paths were
`scripts/algorithm32-star/src/cache/l1-field.js`,
`scripts/algorithm32-star/src/cache/local/build-local-j2-cache.js` for only its
exported node integrator,
`scripts/algorithm32-star/src/oracle/direct-j2.js`, and the canonical
atmosphere, local point-Sun, spectral-basis, and generic CPU-field owners under
`scripts/algorithm32-star/src`. Each imported transitive source is hashed in
the experiment report.

The experiment-local geometry owned the newly experiment-selected transparent
map-centered boundary and applies it consistently to view, source, and
reusable paths.
Star supplies primitive evaluators; it is not authority for that geometry,
the nonlinear coordinates, topology, interpolation, resource limits, or an
integrated flat cache. The runner imported no `src/algorithm32` production
module, modified no pinned Star primitive, and wrote no result into the sealed
Star parity artifact. The archived lane is no longer an allocation or
implementation surface.

The experiment plan owns staged execution. It must preserve the numerical
prerequisites declared here: select the physical boundary before testing a
position reduction, prove coordinate sufficiency before building a large
mesh, establish a direct L1/J2 slice before higher orders, converge an
independent dense reference before scoring sparse N4, and pass binary64 CPU
work before GPU work. The later exact ragged transport interim was independent
because it neither justified nor depended on the new physical coordinate.

### Independent higher-order reference

The direct Star oracle covers the initial L1/J2 feasibility slice only. It
cannot accept J3, J4, or Jthrough4. Before any higher-order candidate is
scored, the experiment must add an independently implemented
`DenseFlatWorldN4Reference` with these constraints:

- it imports neither `src/algorithm32` nor the candidate
  `DomeAwareLocalPositionDomain`;
- it evaluates the selected pure-field recurrence in binary64 on a structured
  boundary-fitted `(eta, q, phi)` grid with ordinary eight-tap trilinear
  reconstruction, not the candidate tetrahedral topology or locator;
- it uses the same pinned physical boundary, native-15 basis, W27 outgoing
  domain, Fibonacci-34 incoming quadrature, ground choice, source state, and
  selected 15-interval options;
- it retains J1, L1, J2, L2, J3, L3, J4, and Jthrough4 values needed for the
  predeclared field and complete-ray probes; and
- its source, complete inputs, outputs, and refinement reports are hashed in
  immutable Star engineering runs and never added to the Star parity artifact.

The structured reference is refined independently in `eta`, `q`, and `phi`.
It becomes the scoring reference only when two successive refinements pass
maximum normalized L-infinity `0.01` and p95 normalized RMS `0.002` for every
retained J1-J4/Jthrough4 probe and selected complete ray. If that reference
does not converge within the declared offline resource allowance, there is no
higher-order oracle and the sparse candidate cannot be promoted.

This scoring authority is internal to the engineering lane. It is not an
official independent experiment merely because it is structurally different
from the sparse candidate. Before promotion, a separate study must satisfy the
[experiment contract](../experiments/experiment-contract.md)
and
[promotion checklist](../experiments/promotion-checklist.md),
or this reference must be redesigned so it can satisfy their independence
rule without prohibited Star imports.

The direct J2 oracle, analytic boundary cases, manufactured constant fields,
and the structurally different dense N4 reference are complementary checks.
Agreement of two resolutions of the sparse tetrahedral candidate is not an
independent correctness result.

### Authority route used for promotion

Star had no output producer for this whole-world boundary or integrated
flat/local cache, and the study correctly forbade manufacturing one and
calling it Star authority. Promotion therefore used a scoped
no-Star-producer decision: reused Star primitives retained their pinned
comparisons, while the new boundary, position representation, integrated
recurrence, dense-reference evidence, CPU/GPU parity, lifecycle, and
application gates were classified as a new numerical selection. The current
[production authority contract](../production/architecture-boundaries.md#required-independent-output-evidence)
generalizes that evidence route for future capabilities without reopening
Star.

### Predeclared evidence and promotion gates

The study must retain every failure and report, at minimum:

- analytic CPU boundary distances and classifications at the map center,
  source axis, ground, apex, rim, horizontal/tangent, outside-domain, and
  near-southern-edge positions;
- equality of view, source, direct-primary, and reusable construction exits
  between the selected geometry owners;
- the same-`z`/same-`rhoSun` toward/transverse/away counterexample;
- reflected-position plus reflected-direction equality and continuity on the
  reflection/source axes;
- exact-node reads, constant-field preservation, finite nonnegative weights,
  sum-to-one, tetrahedron-face continuity, accelerator/full-search agreement,
  no illegal key collision, and explicit rejection of uncovered queries;
- CPU/GPU cell, node-ID, weight, canonical-direction, and cache-fetch parity;
- held-out and nested-refinement comparisons for every affected J1, J2, J3,
  J4, and Jthrough4 field plus selected complete rays;
- San Jose and Union Glacier cases at Flat 0, 90, and 180, together with
  synthetic center, source-near, source-far, transverse, and near-rim cases;
- exact ragged-versus-fixed transport values and accumulation order;
- full reuse keys, rebuild/non-rebuild behavior, cancellation, atomic
  publication, and result-only retention; and
- resident, cell/index, transport, host-staging, backend, peak-live, build-time,
  and runtime-lookup resources.

Geometry binary64 distances retain the existing `1e-9 m` absolute or `1e-12`
relative policy. The production field convergence gate retains the Stage 9 v4
limits: maximum normalized L-infinity no greater than `0.1`, maximum p95
normalized RMS no greater than `0.02`, and no negative or non-finite scalar.
For each compared spectrum, the exact retained definitions are:

```text
scale = max(max(abs(reference)), 1e-30)
normalizedLInf = max(abs(candidate - reference)) / scale
normalizedRms =
  sqrt(mean(((candidate - reference) / scale)^2))
```

The p95 is the nearest-rank value at one-based rank
`ceil(0.95 * sampleCount)`, clamped to the final sorted sample. These
definitions and the complete probe set are frozen in `policy.json`. Current
checked CPU/GPU per-quantity policies remain unchanged. Tolerances may be made
stricter before execution but not relaxed after candidate output.

For the qualified 100 km/4.8 Mm control, the ceilings are applied to these
complete candidate totals:

```text
combinedResidentBytes =
  cumulativeField
  + residentNodeCoordinates
  + residentCellTopology
  + residentCellAccelerator
  + any residentCanonicalizationOrStencilTables

peakTrackedLogicalBytes =
  peakLiveFields
  + peakLiveTransportAndAuxiliaryData
  + peakLiveTopologyAndLookupData
  + trackedHostOrBackendMaterializationCopies
```

`combinedResidentBytes` must not exceed 83,886,080, and
`peakTrackedLogicalBytes` must not exceed 469,762,048. No node, cell,
accelerator, candidate-list, canonicalization, or precomputed-stencil resource
is excluded because it is called metadata. Ragged transport must additionally
meet the 50 MiB current-domain packed-data target, and those bytes still count
inside the peak total. Offline dense-reference resources are reported
separately and cannot enter the production runtime.

No fixed candidate node count is a physical acceptance criterion. Supported-
hardware timing and renderer/driver allocation remain separately required
before a production-readiness claim.

The candidate is rejected if it needs an artificial distance cap, source
scaling, observer-dependent boundary, terminal-row clamp, incomplete world
coverage, unproven symmetry collapse, relaxed error bound, or unreported
storage copy. A resource miss is evidence that this representation is too
large; it is not permission to alter the simulated world.

Promotion requires a separate explicit decision and coordinated updates to
the production architecture authority contract, selected cache contract, the
flat/local reconstruction authority, the flat/local promotion register,
production dataflow and plan, ambient types, reuse keys, CPU/GPU owners,
fixtures, and browser gates. Production must continue to import neither Star
nor the experiment. Spherical/distant output and lifecycle behavior must
remain unchanged.

## Naming And Ambient Types

Algorithm32 uses ambient declaration files so JavaScript receives IntelliSense
and type checking without repeated JSDoc `import(...)` expressions. New cache
types therefore remain ambient and use one compact `Cache` prefix where global
disambiguation is needed.

Ambient contracts are top-level type aliases and interfaces in included
`types.d.ts` files. They do not use TypeScript `declare`, `declare global`, or
module-import aliases. Same-basename declaration files for exported runtime
classes use ordinary `export class` declarations.

Do not repeat `ScatteringCacheConstruction` in every infrastructure name. Use
this vocabulary consistently:

| Concept                          | Selected name        |
| -------------------------------- | -------------------- |
| Owner-supplied construction unit | `CacheBuildModule`   |
| Context supplied to an owner     | `CacheBuildContext`  |
| One logical GPU operation        | `CachePass`          |
| Complete source-owned graph      | `CacheBuildPlan`     |
| Successful staging output        | `CacheBuildArtifact` |
| Construction shader assembler    | `CachePassAssembler` |
| Renderer-neutral GPU adapter     | `CacheGpuBackend`    |
| JavaScript build orchestrator    | `CacheGpuExecutor`   |
| Opaque resident GPU field        | `GpuCacheField`      |
| Distant-source production cache  | `DistantSunCache`    |
| Distant-source CPU oracle cache  | `DistantSunCpuCache` |
| Local-source production cache    | `LocalSunCache`      |
| Local-source CPU oracle cache    | `LocalSunCpuCache`   |

Longer names remain where they carry domain meaning rather than architectural
context. Retain `ScatteringCache`, `createScatteringCache`,
`ScatteringCacheBuildRequest`, `cumulativeScatteringDensity`,
`maximumScatteringOrder`, and `buildCpuScatteringCache`.

Cache-pass assembly contracts live in
`src/algorithm32/shader-assembly/cache-pass/types.d.ts`; cache plan, execution,
artifact, binding, and backend contracts live in
`src/algorithm32/gpu-cache-runtime/types.d.ts`; generic construction-transport
contracts live in `src/algorithm32/atmospheric-transport/cache/types.d.ts`; and common
source-cache consumer contracts live in
`src/algorithm32/light-source-support/cache/types.d.ts`. Class declarations
use the nearest `types/<ClassName>.d.ts` owner when they expose a public
service or concrete class surface.

## Boundary Overview

```text
Algorithm32AtmosphereComposer
  creates ThreeCacheBackend from its renderer
        |
        v
Algorithm32 / ShaderBuilder
  asks lightSource for one runtime-owned CacheController
        |
        v
source-specific CacheController
  accepts createScatteringCache(request)
  derives executable domains, options, and CacheBuildPlan
  compares a private plan/backend-capability reuse key
        |
        +--> source.createCacheModule(context)
        +--> atmosphere.createCacheModule(context)
        +--> geometry.createCacheModule(context)
        +--> ground.createCacheModule(context), when present
        +--> generic transport/cache modules
        |
        v
CacheGpuExecutor
  CachePassAssembler -> CacheShader -> CacheGpuBackend
        |
        v
CacheBuildArtifact
  cumulative GpuCacheField + opaque runtime binding + diagnostics + disposal
        |
        v
source-specific GpuScatteringCache
  runtime ShaderContribution + opaque runtime binding + disposal
```

Construction assembly and final-view runtime assembly are distinct. The
existing `Algorithm32ShaderAssembler` remains the view/runtime assembler. It
must not become the cache-pass assembler because its camera, scene-depth,
endpoint, and display concerns do not exist during cache construction.

## Public Cache Capabilities

The common cache interface owns lifecycle only. The CPU oracle capability adds
synchronous resolved sampling and physical sample provenance; the GPU
capability instead exposes final-view assembly and opaque bindings without
readback. The common lifetime surface and CPU/GPU capabilities are therefore
separated.

```ts
interface ScatteringCache {
	/** Release resources owned by this cache. Repeated disposal is safe. */
	dispose(): void;
}

interface CpuScatteringCache extends ScatteringCache {
	/** Identify the physical provenance of returned spectral samples. */
	readonly sampleProvenanceIdentity: string;

	/** Sample the CPU oracle from already-resolved physical stencils. */
	sampleResolved(request: ScatteringCacheSampleRequest): SpectralScatteringDensityPacket;
}

interface GpuScatteringCache extends ScatteringCache {
	/** Contribute source-specific final-view lookup and runtime bindings. */
	createShaderContribution(request: ShaderContributionRequest): ShaderContribution | readonly ShaderContribution[];

	/** Return opaque bindings for the privately owned cumulative field. */
	getRuntimeBindings(): CacheRuntimeBindings;
}
```

`GpuScatteringCache` exposes no synchronous sampler. Parity and diagnostic
reads use the backend's selected-scalar probe seam and never masquerade as
normal runtime sampling.

## Source-Owned Controller And Factory

`LightSourceModel.createIncidentRadianceCache` is replaced directly. No alias,
fallback reader, old/new switch, or compatibility translation remains.

A configured light-source model may be shared by more than one Algorithm32
instance or renderer. It therefore must not store one global active GPU cache.
The source creates one controller per Algorithm32/runtime attachment. That
source-specific controller owns direct reuse-key comparison, staging
generations, active publication, failure isolation, and disposal for exactly
one consumer.

```ts
interface LightSourceModel {
	readonly id: string;

	createCacheController(request: CacheControllerRequest): CacheController;

	// Existing direct-lighting, source-path, endpoint-lighting, and runtime
	// contribution surfaces remain until separately superseded.
}

type CacheControllerRequest = Readonly<{
	backend: CacheGpuBackend;
	scheduler?: CacheBuildScheduler;
}>;

interface CacheController {
	readonly active: GpuScatteringCache | null;

	createScatteringCache(request: ScatteringCacheBuildRequest): Promise<GpuScatteringCache>;

	dispose(): void;
}
```

The public request supplies physical collaborators and execution capability,
not source-owned cache internals:

```ts
type ScatteringCacheBuildRequest = Readonly<{
	atmosphere: AtmosphereModel & CacheBuildContributor;
	geometry: GeometryModel & CacheBuildContributor;
	groundBoundary?: (GroundBoundary & CacheBuildContributor) | null;
	spectralBasis: SpectralBasis;
	maximumScatteringOrder?: SupportedCacheScatteringOrder;
	signal?: AbortSignal;
}>;
```

The controller defaults an absent `maximumScatteringOrder` to 4. The
source-specific controller, not the caller, derives:

- one coherent executable position/incoming/outgoing domain selection;
- direct pure and cumulative field ids with `CacheFieldStorage`;
- source-owned GPU addressing facts consumed by contributed modules;
- direct `CacheConstructionOptions`;
- the source-specific `J1` and direct `L1` operations;
- the complete N1, N2, or N4 pass graph; and
- one `CacheBuildPlan.identity` over direct graph and source-specific reuse
  facts, followed by the controller-private reuse key that also includes
  backend capabilities.

The retired request properties `field`, `incomingDirectionDomain`, `controls`,
and `gpu: unknown` are not retained.

## Owner Contribution Capability

The cache build uses one structural capability rather than separate long
provider-interface names for atmosphere, geometry, source, and ground.

```ts
interface CacheBuildContributor {
	createCacheModule(context: CacheBuildContext): CacheBuildModule;
}
```

The build request uses intersections with the existing domain interfaces.
This keeps `AtmosphereModel`, `GeometryModel`, and `GroundBoundary` focused on
their CPU/runtime contracts while making the stronger GPU construction
capability mandatory exactly where it is consumed.

`createCacheModule` is separate from the existing runtime
`createShaderContribution`. A cache module directly declares construction
GLSL, bindings, and packed physical data for provider-neutral pass assembly.
Its `provides` and `requires` are consumed by `CachePassAssembler`, and its
`contentHash` remains an active deterministic module-order,
assembled-shader, plan, and reuse input. It never receives or returns `THREE`,
a renderer, a camera, a composer, a scene, a material, a render target, or a
live texture.

The source-owned planner calls only the contributors relevant to a pass; an
owner does not manufacture empty modules for unrelated passes.

| Pass                           | Required ownership                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `primary-j1`                   | source, atmosphere, geometry, concrete cache layout                                                       |
| `direct-l1`                    | source, atmosphere, geometry, concrete cache layout                                                       |
| `scatter`                      | atmosphere, geometry/framing, generic cache operations, concrete cache layout, and ground when applicable |
| `transport` spherical/distant  | geometry-owned packed transport kernel and accessors, `CacheOperations`, and distant cache layout         |
| `transport` Flat/local         | Flat geometry rays/stencils, atmosphere extinction, `IntegratedCacheTransport`, and local cache layout    |
| `accumulate`                   | generic cache operations and concrete cache layout                                                        |

The canonical black-ground module supplies the declared zero-reflection seam
for applicable passes. A reflective boundary replaces that module directly;
each contributed module carries its own direct `contentHash`, while the plan's
source-specific reuse facts record the selected boundary's direct `id` or
`null`. Neither changes generic pass ownership.

The atmospheric source owns the construction source direction. Geometry-owned
frame and path shader operations accept that direction as an argument; a
geometry module does not publish a second source-direction binding. This keeps
flat/spherical substitution behind the geometry capability while preventing
contradictory duplicated direction state.

For spherical/distant N4, the planner asks geometry once to resolve and pack
the selected construction rays and interpolation taps. That request supplies
the atmosphere's accepted `sampleMedium` capability, the source-owned physical
direction to the source, and the accepted interval count. Geometry returns
one `CacheTransportData` value, and the planner places that same value in both
transport contexts. The geometry module binds its source addresses and
atmosphere-dependent `T * ds * interpolation` coefficients;
`CacheOperations` applies those coefficients to the pure input field, and the
distant layout supplies field addressing.

For Flat/local N4, the planner constructs no transport table. Each transport
pass contains Flat geometry, canonical atmosphere,
`IntegratedCacheTransport`, and the local layout. Geometry reconstructs the
physical ray and z/rho/W stencils, atmosphere evaluates extinction at each
path point, the layout reads the pure input field, and the integrated
operation accumulates the selected 15-interval path directly in the fragment
shader. The source does not participate in either later-order transport pass.

## Packed Transport Data Seam For Spherical/Distant

The spherical/distant packed kernel crosses one explicit
provider/request/context seam:

```ts
type CacheTransportData = Readonly<{
	queryCount: number;
	tapCount: number;
	sources: CacheData;
	coefficients: CacheData;
}>;

type CacheTransportDataRequest = Readonly<{
	atmosphere: Pick<AtmosphereModel, 'sampleMedium'>;
	domains: CacheConstructionDomains;
	directionToSource: UnitVector3;
	intervalCount: number;
}>;

interface CacheTransportDataProvider {
	createTransportData(request: CacheTransportDataRequest): CacheTransportData;
}
```

For spherical/distant construction, queries are position-major over the
Native-48 position nodes and current reflection-completed Fibonacci-68
radiance directions. `sources` has
shape `[tapCount * 3, queryCount]` and stores, per tap, the W27 source-direction
index, Native-48 source-position index, and active flag. `coefficients` has
shape `[tapCount, queryCount, 15]` and stores the wavelength-major spectral
transport coefficient in meters. Both are scalar `CacheData`; the backend
privately realizes their `sampler2D` and `sampler2DArray` resources.

For the spherical/distant plan, `CacheTransportData` is direct executable
construction input. Its `sources`
and `coefficients` are `CacheData` values whose retained `contentHash` values
identify their normalized packed content for module and plan reuse. The
provider owns ray bounds, retained construction lookup, W27 stencils, path
integration, and packing. The source-owned planner owns when the provider is
called and which pass contexts receive the returned kernel. The generic
transport operation owns only the packed-tap loop and scalar field
read/accumulation; the assembler, executor, and backend do not reconstruct
physical transport.

This fixed maximum-tap representation remains selected only for
spherical/distant transport. Flat/local has no production
`CacheTransportData`; its completed indexed interim is retained only as
sealed transition evidence and must not be confused with the proposed
addition of a map-relative physical invariant.

The distant-source plan request reflects this requirement without burdening
smaller graphs: N1 and N2 require a `CacheBuildContributor` geometry, while N4
requires `CacheBuildContributor & CacheTransportDataProvider` and an
atmosphere that supplies both construction modules and `sampleMedium`.

## Trusted Polymorphic Composition

Source kind and geometry kind remain private implementation choices behind
their interfaces. Generic cache code trusts the ambient/JSDoc contract of each
object and the values constructed by production owners. The source-owned
planner creates the accepted graph, the assembler mechanically orders and
emits its modules, the executor schedules that graph, and the backend realizes
the supplied executable `CacheFieldStorage` facts.

Runtime type checks do not repeat interface shape, trusted contract contents,
module ownership, symbol namespaces, binding types, pass compatibility, or
identity agreement at those internal seams. Executable domain owners,
`CacheFieldSpec`, `CacheBuildModule`, `CacheBuildPlan`, and backend handles are
consumed directly; no parallel owner snapshot or structural metadata packet
proves that they are executable.

The genuine public cache request boundary validates only externally supplied
semantic values and ranges, such as the requested scattering order. The Three
adapter also checks live renderer capabilities and opaque resource
ownership/lifetime because those conditions exist only at runtime. Accepted
internal values and repository constants are trusted thereafter.

Generic cache components may not contain behavior such as:

```js
if (source.kind === 'distant') {
	/* ... */
}
if (source.kind === 'local') {
	/* ... */
}
if (geometry.kind === 'spherical') {
	/* ... */
}
if (geometry.kind === 'flat') {
	/* ... */
}
if (geometry instanceof SphericalEarthGeometry) {
	/* ... */
}
```

A concrete source validates externally supplied radiometry and source values
at its public configuration boundary, then constructs its primary-field
mapping, domains, controller, and modules from trusted values. A concrete
geometry does the same for externally supplied coordinates and bounds. Their
direct ids may participate in the owning plan's reuse facts or diagnostics;
generic code does not select algorithms from those ids.

Consequently, adding the local Sun or flat geometry supplies new concrete
modules, executable domains, and cache classes behind the same interfaces.
It does not add a local/distant or flat/spherical branch to generic assembly,
recurrence, execution, or runtime sampling.

## Build Module Contract

```ts
type CacheBuildOwner = 'lightSource' | 'atmosphere' | 'geometry' | 'ground' | 'transport' | 'cache';

type CachePassKind = 'primary-j1' | 'direct-l1' | 'scatter' | 'transport' | 'accumulate';

type CacheOrder = 1 | 2 | 3 | 4;

type CacheShaderPhase = 'declare' | 'function' | 'main';

type CacheShaderBlock = Readonly<{
	id: string;
	phase: CacheShaderPhase;
	order: number;
	source: string;
}>;

type CacheBindingKind = 'uniform' | 'data' | 'define';
type CacheBindingFrequency = 'build' | 'pass' | 'layer';

type CacheData = Readonly<{
	id: string;
	quantity: string;
	units: string;
	shape: readonly number[];
	values: readonly number[];
	contentHash: string;
}>;

type CacheBindingValue = number | boolean | UnitValue | Position | UnitVector3 | SpectralPacket | CacheData;

type CacheBindingSpec = Readonly<{
	id: string;
	name: string;
	kind: CacheBindingKind;
	shaderType: string;
	frequency: CacheBindingFrequency;
}>;

type CacheBinding = CacheUniformBinding | CacheDataBinding | CacheDefineBinding;

type CacheBuildModule = Readonly<{
	id: string;
	owner: CacheBuildOwner;
	provides: readonly string[];
	requires: readonly string[];
	blocks: readonly CacheShaderBlock[];
	bindings: readonly CacheBinding[];
	contentHash: string;
}>;
```

Bindings are declarative and typed. The ambient `CacheUniformBinding`,
`CacheDataBinding`, and `CacheDefineBinding` variants pair each shader type and
frequency with the value it accepts. Bare numbers and booleans are limited to
dimensionless/discrete shader values; durable physical scalars use
unit-bearing `UnitValue` contracts, and property names do not encode units. The
backend normalizes accepted values to its canonical scalar representation
once at the CPU/GPU boundary. A binding never exposes a Three.js texture or
WebGL enum through this contract. `CacheData` is normalized packed data, not a
renderer resource; its quantity, units, shape, and content identity remain
explicit. Backend-created textures or buffers that carry it stay private.

Modules use symbol provision and requirement sets so the assembler can derive
stable dependency order independently of contribution arrival order. The
source-owned graph supplies a complete, typed module set; the assembler does
not defensively revalidate those repository-owned definitions. `contentHash`
covers the module's blocks, binding specifications, and the stable content
identities of its values; object identity and contribution arrival order never
enter shader identity.

This retirement does not weaken physical spectral identity. Accepted
`SpectralBasis` and `SpectralPacket` content identities, compatibility checks,
semantics, units, and provenance remain owned by the spectral contracts and
enter cache construction wherever an executable consumer requires them.

## Field And Pass Contracts

Build plans refer to logical fields by source-owned ids. A field specification
contains only the direct allocation request and no live resource or parallel
field snapshot.

```ts
type CacheFieldId = string;

type CacheFieldStorage = Readonly<{
	format: 'R32F';
	width: number;
	height: number;
	layers: number;
}>;

type CacheFieldSpec = Readonly<{
	id: CacheFieldId;
	storage: CacheFieldStorage;
}>;

interface CacheConstructionDomains {
	readonly id: string;
	readonly positionDomain: PositionDomain;
	readonly positionNodes: readonly PositionDomainNode[];
	readonly positionCount: number;
	readonly incomingDirectionDomain: DirectionDomain;
	readonly incomingUnitVectors: readonly UnitVector3[];
	readonly incomingIntegrationWeights: SolidAngleWeights;
	readonly incomingDirectionCount: number;
	readonly outgoingDirectionDomain: DirectionDomain;
	readonly outgoingUnitVectors: readonly UnitVector3[];
	readonly outgoingDirectionCount: number;
	resolveOutgoingDirectionStencil(direction: UnitVector3): ScatteringCacheDirectionStencil;
}

type CacheGroundReflection =
	| Readonly<{
			kind: 'direct-source';
	  }>
	| Readonly<{
			kind: 'pure-radiance';
			illumination: CacheFieldSpec;
	  }>;

type CacheBuildContext = Readonly<{
	kind: CachePassKind;
	order: CacheOrder;
	inputs: readonly CacheFieldSpec[];
	output: CacheFieldSpec;
	options: CacheConstructionOptions;
	domains: CacheConstructionDomains;
	/** Present when a direct-radiance pass executes an interval count. */
	pathIntervalCount?: number;
	/** Present only for a selected packed transport implementation. */
	transportData?: CacheTransportData;
	/** Present only when a reflective scatter pass consumes ground work. */
	groundReflection?: CacheGroundReflection;
}>;

type CachePass = Readonly<{
	id: string;
	kind: CachePassKind;
	order: CacheOrder;
	inputs: readonly CacheFieldId[];
	output: CacheFieldId;
	modules: readonly CacheBuildModule[];
}>;

type CacheBuildPlan = Readonly<{
	identity: CacheReuseIdentity;
	fields: readonly CacheFieldSpec[];
	passes: readonly CachePass[];
	result: CacheFieldId;
}>;
```

`CacheBuildContext` is the resolved view supplied to contributors while the
plan stores ids. The executor mechanically creates the field registry and
consumer counts required to run the trusted source-owned graph. Successful
execution returns the completed field and its runtime binding directly; it
does not construct a second cache-part declaration.

The plan's direct `CacheReuseIdentity` covers each logical field's `id` and
`storage`, every pass, and each participating module's `id`, `owner`, and
actively consumed `contentHash`. Source-specific planners add only demonstrated
reuse facts: the coherent domain-selection id, direct position/incoming/
outgoing domain-owner ids, and the selected ground-boundary `id` or `null`.
The controller then combines `plan.identity` with measured backend capabilities
in a private reuse key. The executor consumes the fields, passes, storage, and
modules directly; it does not recompute identity to validate them.

The source-owned planner, typed contracts, and focused graph tests make these
states unrepresentable in a production plan:

- a cumulative field entering `scatter` or `transport`;
- a density field entering `scatter` where pure radiance is required;
- a radiance field entering `accumulate`;
- mismatched position or spectral domains;
- assuming incoming and outgoing direction indices are identities; and
- producing `L4` for a requested N4 build.

`accumulate` has three valid shapes:

1. one pure `J1` input initializes `Jthrough1` for an N1 build;
2. pure `J1` and pure `J2` initialize `Jthrough2` for an N2 or N4 build; or
3. one cumulative `Jthrough(k-1)` input plus pure `Jk` produces
   `Jthroughk`.

These explicit cumulative outputs avoid relabeling a pure field as a
cumulative field, keep field roles truthful, and preserve the accepted
separate cumulative-add operation without adding an unnecessary N2/N4 copy.

## Plan Conformance To The Numerical Contract

The source-owned `CacheBuildPlan` translates the recurrence and requested N1,
N2, or N4 dependency graph defined in
[cache-contract.md](cache-contract.md#stored-quantity-and-recurrence) one for
one. The cache contract remains numerical authority; the tables below record
the exact software pass realization needed for assembly and resource
lifetime.

The ordered pass graphs are shown below. Field notation maps directly to the
concrete ids: `Jk` is `distant-sun-j{k}`, `Lk` is
`distant-sun-l{k}`, and `Jthroughk` is
`distant-sun-j-through-{k}`.

| Build | Pass id                                 | Kind         | Inputs            | Output      |
| ----- | --------------------------------------- | ------------ | ----------------- | ----------- |
| N1    | `distant-sun-primary-j1`                | `primary-j1` | none              | `J1`        |
| N1    | `distant-sun-accumulate-j1`             | `accumulate` | `J1`              | `Jthrough1` |
| N2    | `distant-sun-primary-j1`                | `primary-j1` | none              | `J1`        |
| N2    | `distant-sun-direct-l1`                 | `direct-l1`  | none              | `L1`        |
| N2    | `distant-sun-scatter-l1-to-j2`          | `scatter`    | `L1`              | `J2`        |
| N2    | `distant-sun-accumulate-j1-j2`          | `accumulate` | `J1`, `J2`        | `Jthrough2` |
| N4    | `distant-sun-primary-j1`                | `primary-j1` | none              | `J1`        |
| N4    | `distant-sun-direct-l1`                 | `direct-l1`  | none              | `L1`        |
| N4    | `distant-sun-scatter-l1-to-j2`          | `scatter`    | `L1`              | `J2`        |
| N4    | `distant-sun-accumulate-j1-j2`          | `accumulate` | `J1`, `J2`        | `Jthrough2` |
| N4    | `distant-sun-transport-j2-to-l2`        | `transport`  | `J2`              | `L2`        |
| N4    | `distant-sun-scatter-l2-to-j3`          | `scatter`    | `L2`              | `J3`        |
| N4    | `distant-sun-accumulate-j-through-2-j3` | `accumulate` | `Jthrough2`, `J3` | `Jthrough3` |
| N4    | `distant-sun-transport-j3-to-l3`        | `transport`  | `J3`              | `L3`        |
| N4    | `distant-sun-scatter-l3-to-j4`          | `scatter`    | `L3`              | `J4`        |
| N4    | `distant-sun-accumulate-j-through-3-j4` | `accumulate` | `Jthrough3`, `J4` | `Jthrough4` |

The N1 and N2 entries are complete plans, not prefixes that execute the N4
tail. N1 constructs no `L1`. N2 constructs no `L2`. N4 constructs no `L4`.
Every recurrence input is a pure field; no `JthroughN` field enters a scatter
or transport pass.

The plan representation adds only the storage/publication `accumulate`
operations shown above. Those operations initialize or extend cumulative
storage; they are not scattering orders. Positive graph tests establish this
structure without downstream structural revalidation.

Lifetimes follow the exact ordered consumer lists. In N1, `J1` is released
after `distant-sun-accumulate-j1`, and `Jthrough1` is retained. In N2, `L1` is
released after `distant-sun-scatter-l1-to-j2`; `J1` and `J2` are released after
`distant-sun-accumulate-j1-j2`; and `Jthrough2` is retained.

For N4, the executor applies these last-consumer releases:

| Completed pass                          | Fields released after the pass | Field retained or still live |
| --------------------------------------- | ------------------------------ | ---------------------------- |
| `distant-sun-scatter-l1-to-j2`          | `L1`                           | `J1`, `J2`                   |
| `distant-sun-accumulate-j1-j2`          | `J1`                           | `J2`, `Jthrough2`            |
| `distant-sun-transport-j2-to-l2`        | `J2`                           | `Jthrough2`, `L2`            |
| `distant-sun-scatter-l2-to-j3`          | `L2`                           | `Jthrough2`, `J3`            |
| `distant-sun-accumulate-j-through-2-j3` | `Jthrough2`                    | `J3`, `Jthrough3`            |
| `distant-sun-transport-j3-to-l3`        | `J3`                           | `Jthrough3`, `L3`            |
| `distant-sun-scatter-l3-to-j4`          | `L3`                           | `Jthrough3`, `J4`            |
| `distant-sun-accumulate-j-through-3-j4` | `Jthrough3`, `J4`              | retained result `Jthrough4`  |

`Jthrough4` has no consumers and is the only field transferred to the
successful artifact. Physical pooling may reuse released resources, but it
cannot change this logical graph or extend a field's ownership. The executor
allocates each pass output before releasing that pass's last-use inputs, so
memory diagnostics include that transition peak.

## Construction Shader Assembly

```ts
type CacheShader = Readonly<{
	id: string;
	source: string;
	sourceHash: string;
	bindings: readonly CacheBinding[];
	output: CacheFieldSpec;
}>;

interface CacheAssembler {
	assemble(pass: CachePass, output: CacheFieldSpec): CacheShader;
}

class CachePassAssembler implements CacheAssembler {
	assemble(pass: CachePass, output: CacheFieldSpec): CacheShader;
}
```

The executor resolves the pass's logical output id through its field registry
and supplies that trusted `CacheFieldSpec` to the assembler. The assembler
orders the source-owned modules, emits one complete construction fragment
shader, and records its stable identity. It does not revalidate owner symbols,
binding types, or repository constants. It also does not resolve plan ids,
allocate resources, compile renderer programs, submit work, read results, or
manage cache lifecycle. `CacheBuildModule` is the direct provider declaration
consumed here; there is no nested assembly packet. The fullscreen vertex
shader may remain a backend/executor constant because it carries no physical
ownership.

The renderer backend owns the GLSL version directive because it also owns the
rendering API and vertex shader. `CachePassAssembler` owns construction define
emission so define literals participate directly in deterministic source
identity; the backend consumes those typed bindings and does not emit a second
define.

## GPU Backend

The backend is the only cache-construction surface that knows the rendering
API. Physics-facing objects never accept raw Three.js or WebGL objects.

```ts
interface GpuCacheField {
	readonly id: CacheFieldId;
	readonly storage: CacheFieldStorage;
	readonly backendId: string;
	dispose(): void;
}

interface CacheGpuProgram {
	readonly id: string;
	readonly sourceHash: string;
	dispose(): void;
}

type CacheLayerSubmission = Readonly<{
	program: CacheGpuProgram;
	inputs: readonly Readonly<{
		id: CacheFieldId;
		field: GpuCacheField;
	}>[];
	output: GpuCacheField;
	layer: number;
	bindings: readonly CacheBinding[];
}>;

interface CacheRuntimeBinding {
	readonly id: string;
	readonly valueKey: 'cache.cumulativeScatteringDensity';
	readonly fieldId: CacheFieldId;
	readonly backendId: string;
}

type CacheRuntimeBindings = Readonly<{
	backendId: string;
	bindings: readonly CacheRuntimeBinding[];
}>;

type CacheRuntimeBindingInstallRequest = Readonly<{
	bindings: CacheRuntimeBindings;
	uniforms: Record<string, {value: unknown}>;
}>;

type CacheGpuCapabilities = Readonly<{
	id: string;
	api: string;
	scalarFormat: 'R32F';
	supportsArrayRenderTargets: boolean;
	supportsFloatSampling: boolean;
	maximumTextureSize: number;
	maximumArrayLayers: number;
}>;

type CacheProbeRequest = Readonly<{
	field: GpuCacheField;
	coordinates: readonly DirectionalSpectralFieldCoordinates[];
}>;

type CacheProbe = Readonly<{
	field: CacheFieldId;
	coordinates: readonly DirectionalSpectralFieldCoordinates[];
}>;

interface CacheProbeReader {
	readSelectedScalars(request: CacheProbeRequest): Promise<CacheProbeResult>;
}

type CacheProbeResult = Readonly<{
	fieldId: CacheFieldId;
	samples: readonly Readonly<{
		coordinates: DirectionalSpectralFieldCoordinates;
		value: number;
	}>[];
}>;

interface CacheGpuBackend {
	readonly id: string;
	readonly capabilities: CacheGpuCapabilities;

	allocateField(field: CacheFieldSpec): GpuCacheField;

	compile(shader: CacheShader): CacheGpuProgram | Promise<CacheGpuProgram>;

	/** Submit one layer and restore every renderer state value before returning. */
	submitLayer(request: CacheLayerSubmission): void;

	createRuntimeBinding(field: GpuCacheField): CacheRuntimeBinding;

	installRuntimeBindings(request: CacheRuntimeBindingInstallRequest): void;

	dispose(): void;
}
```

`GpuCacheField`, `CacheGpuProgram`, and `CacheRuntimeBinding` are opaque
renderer-neutral handles. A field exposes only its direct logical id,
executable storage facts, and owning backend id without exposing its resource.
A runtime binding exposes its binding id, shader value key, logical field id,
and backend id. A Three implementation may privately hold an R32F array target,
texture, material, scene, and camera; none cross this interface.

The backend checks the live renderer's required WebGL2, R32F array-target,
sampler, size, layer, and precision capabilities when that external runtime
enters the adapter. Allocation and submission then use `CacheFieldStorage`,
not a second field description. Every `submitLayer` call captures and restores
renderer state internally, including failure paths; the renderer-neutral
executor relies on that state-neutral contract. A controller's direct reuse
key includes the complete measured capability value because it can change plan
realization.

Real Three/WebGL conformance is exercised through the standalone browser lane
owned by the [testing topic](../../testing/README.md). That lane tests the
backend and executor against an actual browser renderer without making the
browser harness part of the production cache interface.

`CacheProbeReader` is a separate optional diagnostic capability. A concrete
Three adapter used by diagnostics may implement both interfaces, but
`ScatteringCacheBuildRequest` and normal construction accept only
`CacheGpuBackend`. This prevents production execution from acquiring a
readback dependency accidentally. The probe reads only declared scalar
coordinates; there is no full-field readback method. A diagnostic request
declares a logical `CacheProbe` by field id before execution. The executor
resolves it to a live-field `CacheProbeRequest` immediately after the producing
pass and before that field's last-consumer release.

## GPU Executor

```ts
type CacheExecutionOptions = Readonly<{
	scheduler?: CacheBuildScheduler;
	signal?: AbortSignal;
	probeReader?: CacheProbeReader;
	probes?: readonly CacheProbe[];
}>;

interface CacheBuildScheduler {
	/** Yield at an executor-declared safe boundary. */
	yieldControl(): Promise<void>;
}

type CachePassDiagnostic = Readonly<{
	id: string;
	submissionDuration?: Duration;
	probe?: CacheProbeResult;
}>;

type CacheBuildMemoryDiagnostics = Readonly<{
	peakFieldStorage: UnitValue<'bytes'>;
	peakPackedDataStorage: UnitValue<'bytes'>;
	peakTrackedStorage: UnitValue<'bytes'>;
	residentFieldStorage: UnitValue<'bytes'>;
}>;

type CacheBuildDiagnostics = Readonly<{
	passes: readonly CachePassDiagnostic[];
	memory: CacheBuildMemoryDiagnostics;
}>;

type CacheBuildArtifact = Readonly<{
	result: GpuCacheField;
	runtimeBindings: CacheRuntimeBindings;
	diagnostics: CacheBuildDiagnostics;
	dispose(): void;
}>;

class CacheGpuExecutor {
	constructor(
		request: Readonly<{
			backend: CacheGpuBackend;
			assembler: CacheAssembler;
		}>,
	);

	execute(plan: CacheBuildPlan, options?: CacheExecutionOptions): Promise<CacheBuildArtifact>;

	dispose(): void;
}
```

The executor owns:

- dependency order;
- shader assembly and compilation;
- logical-field to live-resource mapping;
- the JavaScript pass loop;
- the JavaScript wavelength-layer loop;
- staging resource cleanup;
- last-consumer release and pooling;
- cancellation checks and cooperative scheduler yields;
- selected-value probe requests;
- exact logical field, packed-data, tracked-peak, and resident byte
  diagnostics; and
- reliance on the backend's state-neutral submission contract.

The GPU program owns the parallel position/direction work and its declared
incoming-direction or path-tap loop. The JavaScript executor never loops over
individual cache positions, directions, or spectral scalar values.

Memory diagnostics are required on every successful artifact. All four values
carry `units: "bytes"`; the property names identify the measurement rather
than encoding a unit. `peakFieldStorage` is the maximum sum of live logical
R32F field payloads, including the transition where a pass output has been
allocated but its final-use inputs have not yet been released.
`peakPackedDataStorage` is the maximum scalar `CacheData` payload bound by one
pass. `peakTrackedStorage` is the maximum, evaluated per pass, of live field
payload plus that pass's packed data. `residentFieldStorage` is the completed
cumulative result's R32F payload.

These are exact logical payload counts: R32F and packed scalar data each count
four bytes per scalar. They do not claim renderer-driver allocation size and
exclude texture alignment, framebuffer/program objects, implementation
temporaries, and other backend overhead. Hardware performance acceptance may
supplement these required logical diagnostics with renderer-specific
measurements without changing this contract.

The artifact is the direct successful result: one cumulative `GpuCacheField`,
its opaque `CacheRuntimeBindings`, diagnostics, and idempotent disposal. It
does not publish a second cache-part description or construction snapshot.

## Concrete Production Classes

The existing CPU resident class is renamed directly. The old name is not kept
as an alias.

```ts
class DistantSunCpuCache implements CpuScatteringCache {
	constructor(buildResult: DistantSunCpuCacheResult);
	readonly sampleProvenanceIdentity: string;
	sampleResolved(request: ScatteringCacheSampleRequest): SpectralScatteringDensityPacket;
	dispose(): void;
}

class DistantSunCache implements GpuScatteringCache {
	constructor(artifact: CacheBuildArtifact);
	createShaderContribution(request: ShaderContributionRequest): ShaderContribution | readonly ShaderContribution[];
	getRuntimeBindings(): CacheRuntimeBindings;
	dispose(): void;
}
```

`LocalSunCpuCache` exposes the same direct CPU capability and
`sampleProvenanceIdentity`. `LocalSunCache` exposes the same GPU capability and
additionally reports its source facts, boundary upload, zero-valued packed
transport metric, and executor memory through `LocalSunCacheResourceReport`.
Neither concrete cache
exposes a parallel cache snapshot. The nonresident CPU build results retain
their pure fields, final cumulative field, requested maximum order, and direct
`CacheConstructionOptions`; the resident CPU caches retain only the cumulative
reader and its physical sample provenance.

The source exposes a controller factory and retained CPU oracle operations;
plan construction remains a source-owned implementation detail of the
controller.

```ts
class DistantSunLightSource implements LightSourceModel {
	createCacheModule(context: CacheBuildContext): CacheBuildModule;

	createCacheController(request: CacheControllerRequest): DistantSunCacheController;

	buildCpuScatteringCache(request: DistantSunCpuCacheRequest): DistantSunCpuCacheResult;
}

class DistantSunCacheController implements CacheController {
	constructor(
		request: Readonly<{
			source: DistantSunLightSource;
			backend: CacheGpuBackend;
			scheduler?: CacheBuildScheduler;
		}>,
	);

	readonly active: DistantSunCache | null;

	createScatteringCache(request: ScatteringCacheBuildRequest): Promise<DistantSunCache>;

	dispose(): void;
}
```

The existing physical model classes gain the structural construction
capability while retaining their CPU and view/runtime surfaces:

```ts
class CanonicalAtmosphere implements AtmosphereModel, CacheBuildContributor {
	createCacheModule(context: CacheBuildContext): CacheBuildModule;
	createShaderContribution(request: ShaderContributionRequest): ShaderContribution | readonly ShaderContribution[];
}

class SphericalEarthGeometry implements GeometryModel, CacheBuildContributor, CacheTransportDataProvider {
	createTransportData(request: CacheTransportDataRequest): CacheTransportData;
	createCacheModule(context: CacheBuildContext): CacheBuildModule;
	createShaderContribution(request: ShaderContributionRequest): ShaderContribution | readonly ShaderContribution[];
}
```

`UniformLambertianGroundBoundary` implements `CacheBuildContributor`. A null
boundary selects the canonical black-ground
module owned by the cache construction package; callers do not need a
placeholder ground object. A reflective ground supplies direct `id`, `model`,
and spectral `albedo` facts plus its executable BRDF/module behavior. The plan
records its `id`; omission remains `null` and has no synthetic content hash.

Generic scatter, packed transport, and accumulation modules are supplied by
the source-independent `CacheOperations` contributor. The separate
`IntegratedCacheTransport` contributor owns fused physical-path transport.
Neither contains a source-specific primary branch or selects behavior from a
source or geometry identity.

```ts
class CacheOperations implements CacheBuildContributor {
	createCacheModule(context: CacheBuildContext): CacheBuildModule;
}

class IntegratedCacheTransport implements CacheBuildContributor {
	createCacheModule(context: CacheBuildContext): CacheBuildModule;
}
```

The renderer adapter is concrete and isolated:

```ts
class ThreeCacheBackend implements CacheGpuBackend, CacheProbeReader {
	constructor(
		request: Readonly<{
			THREE: unknown;
			renderer: unknown;
		}>,
	);

	readonly id: string;
	readonly capabilities: CacheGpuCapabilities;
	allocateField(field: CacheFieldSpec): GpuCacheField;
	compile(shader: CacheShader): CacheGpuProgram;
	submitLayer(request: CacheLayerSubmission): void;
	createRuntimeBinding(field: GpuCacheField): CacheRuntimeBinding;
	readSelectedScalars(request: CacheProbeRequest): Promise<CacheProbeResult>;
	dispose(): void;
}
```

## Numerical Authority

The [selected cache contract](cache-contract.md) owns the retained production
algorithms and logical data shapes. This design maps that calculation into
production interfaces; it does not establish numerical authority from
interface examples. Current and future acceptance must follow the
[production conformance rules](../production/architecture-boundaries.md#algorithm-source-promotion-and-conformance)
with a newly selected independent authority in a new isolated evidence lane.
The retired Star source is historical only and is not an executable authority
or regression oracle.

The production software surface does not promote:

- raw `THREE`, renderer, target, texture, material, scene, or camera values in
  physics requests or cache results;
- caller-selected domains, layouts, options, or recurrence operations;
- a browser harness manually assembling source-owned order graphs;
- CPU-uploaded `J1` or `L1` as the production primary path;
- normal full-field readback;
- unit-bearing property suffixes;
- runtime `Object.freeze`; or
- compatibility aliases for the incident-radiance strategy.

## Lifecycle And Publication

Resource ownership follows this sequence:

1. The per-runtime source controller validates the external request's semantic
   values and ranges and chooses N1, N2, or default N4.
2. The controller creates a generation-scoped `CacheBuildPlan`, derives a
   private reuse key from `plan.identity` and backend capabilities, returns the
   active cache on equality, or starts a staging execution.
3. The executor owns every allocated staging field and program until success.
4. The executor releases pure/intermediate resources after their final
   consumer and returns one `CacheBuildArtifact` containing the completed
   cumulative field and its backend-created opaque runtime bindings.
5. The controller wraps the artifact in `DistantSunCache` only after the complete
   requested graph succeeds.
6. If the generation is still current, the controller atomically publishes the
   new cache and then disposes the previously active cache.
7. Failure, cancellation, or supersession disposes all staging resources and
   leaves the active cache usable.
8. `createScatteringCache` resolves only with the cache that became active. It
   never returns a partial or superseded cache.
9. Controller disposal cancels staging work and disposes its active cache.
   Source model disposal does not implicitly dispose another runtime's
   controller. Backend disposal remains the composer/renderer adapter's
   responsibility.

One controller-owned executor is intentionally single-flight. Each newer valid
request advances the generation, aborts the previous generation, and waits for
that execution to settle before starting replacement work. A superseded call
rejects with `AbortError`. This also covers active A, staging B, then requested
A: B is cancelled and the already-active A is returned after B has cleaned up.

Reuse-key equality may reuse only the current controller's active cache. The
key contains the direct `CacheBuildPlan.identity` and the complete measured
backend capability record. The plan identity already covers the result field
through its direct id/storage, every pass and module, the selected executable
domain ids, and the selected ground-boundary id or `null`. Source and
atmosphere values consumed by modules enter through those modules' retained
`contentHash`; packed `CacheData` bindings contribute their own retained
`contentHash`. The controller's per-backend scope supplies resource ownership,
so a process-local sequential backend id is not part of the key. Signals,
schedulers, cameras, objects, scene/display state, observer height, and legacy
incident-cache policy are not transport inputs. Executable fields, passes,
storage, modules, and backend handles continue to drive execution directly.

## Runtime Integration Surface

`ShaderSetupRequest` gains one typed property:

```ts
readonly cacheBackend: CacheGpuBackend;
```

`Algorithm32AtmosphereComposer` creates `ThreeCacheBackend` because it already
owns the renderer and Three namespace. It passes the backend into
`Algorithm32.setupShader` and disposes it after all caches using it have been
disposed.

Stage 7 extends the backend-owned runtime seam so the adapter installs an
opaque `CacheRuntimeBinding` into the renderer material/uniform target. The
public binding never exposes a Three texture, render target, or other raw
renderer resource.

`ShaderBuilder` creates and retains one source controller for its Algorithm32
runtime attachment, then remains asynchronous. Its configured-model path
changes from:

```text
create incident cache -> fill CPU coordinates -> upload CPU payload
```

to:

```text
await controller.createScatteringCache -> accept opaque runtime bindings and
the cache-owned ShaderContribution
```

The old `_buildSourceCreatedIncidentRadianceCache` and
`_createCacheTexturePayloads` path is removed. `ShaderResourceBuilder` no
longer uploads the production scattering cache from CPU arrays. The runtime
assembler consumes the GPU cache's ordinary `ShaderContribution`; it does not
receive the construction plan, pure fields, or backend programs.

Each shader result/handle attachment owns its controller and active cache.
Configuration replacement stages the next attachment first, preserves the
installed controller/cache if construction fails, and only after success
atomically swaps the attachment and disposes the previous controller/cache.
The composer-owned backend is disposed after every attachment using it.
`ExecutionConfig.maximumScatteringOrder` selects 1, 2, or 4 and defaults to 4.

The CPU reference path makes the same direct conceptual cutover: final-view
evaluation consumes cumulative values through `CpuScatteringCache` and does
not retain `IncidentRadianceSampling`, a direct-view term, or an incident-
direction loop. Direct-primary `L1` remains only the source-owned construction
seed. Generic reference/runtime code does not branch on distant/local source
kind or spherical/flat geometry kind.

Final-view shader reconstruction follows the same resolved-coordinate seam as
the CPU path. Geometry first produces one `AtmosphereCoordinate` for the view
ray sample. Atmosphere consumes that coordinate directly, and geometry derives
the actual-node position stencil and source-framed W27 direction stencil. The
concrete cache sampler accepts only those two stencils and owns only its fixed
direction/position/wavelength addressing; it does not receive a physical
position, source kind, geometry kind, domain-owner snapshot, or texture-derived
coordinate.

The CPU-facing geometry surface exposes those two resolved operations directly:

```ts
interface GeometryModel {
	resolveScatteringCachePositionStencil(
		request: ScatteringCachePositionStencilRequest,
	): ScatteringCachePositionStencil;

	resolveScatteringCacheDirectionStencil(request: ScatteringCacheDirectionRequest): ScatteringCacheDirectionStencil;
}
```

Generic final-view CPU transport does not import W27 or ask geometry only for an
intermediate source-frame direction. The shader contribution provides the
equivalent two stencil functions behind the same geometry ownership boundary.

Spherical geometry reconstructs altitude from the frame-updated
`geometry.cameraGroundRelativePosition` vector and the ray offset. That vector
is the model-space camera position minus the geometry-owned ground anchor
`bottomRadius * observerUpDirection`, normalized to meters before entering the
shader. The rationalized radial/transverse calculation does not subtract two
Earth-scale float32 radii, so submeter offsets at Native-48 nodes and former
boundaries remain representable. `geometry.cameraWorldPosition` remains the
physical ray origin; both values must describe the same camera frame.

Before observing Stage 7 output, check in the runtime parity policy covering
all Native-48 nodes, endpoint clamps, former altitude boundaries, W27 exact
nodes/interiors/seams/corners, completed rays, no-double-count behavior, and
N1/N2/N4 selection. This policy is runtime acceptance plumbing, not new
numerical research.

## Direct Replacements

The interface migration changes producers, consumers, tests, and declarations
together, then removes the retired shape in the same implementation change.

- Replace `LightSourceModel.createIncidentRadianceCache` with
  `createCacheController`; the returned controller exposes
  `createScatteringCache` for one runtime attachment.
- Replace the old caller-owned `ScatteringCacheBuildRequest` fields with the
  source-owned factory request defined here.
- The CPU oracle is `DistantSunCpuCache`; the retired resident-cache name is
  absent.
- Its request and result are `DistantSunCpuCacheRequest` and
  `DistantSunCpuCacheResult`; no retired type aliases remain.
- Add the production GPU `DistantSunCache`.
- Split the common, CPU, and GPU cache capabilities.
- Remove production `DistantSunIncidentRadianceCache`, its builder, its CPU
  payload upload, and its runtime lookup contribution when the replacement
  path lands.
- Keep the CPU recurrence, fields, resolved reader, and fixtures only as the
  independent oracle and diagnostic surface.
- Keep `Algorithm32ShaderAssembler` for final-view runtime assembly.
- Add `CachePassAssembler`, `CacheGpuExecutor`, and `ThreeCacheBackend` for
  construction.

There are no deprecated aliases, overloads accepting the retired request,
fallback readers, versioned shadows, or old/new feature switches.

## File Placement

The production [source layout](../../../../src/algorithm32/README.md#source-layout)
is final. `shader-assembly/cache-pass` owns provider-neutral cache-pass
declarations and assembly, `gpu-cache-runtime` owns shared runtime values and
execution, and `implementation/three-cache-backend` owns the public concrete
Three/WebGL backend. `atmospheric-transport/cache` owns generic recurrence, `ground-transport/cache`
owns the omitted-ground provider, `light-source-support/cache` owns the common
source-cache contract and CPU storage, and each concrete source owns its
nested cache, plan, packing, fixtures, and lifecycle.

Stateful objects with resource identity or lifecycle use classes. Stateless
plan derivation, identity, packing, and pass-definition helpers remain focused
neighboring functions. Complex shared JSDoc contracts remain as top-level
aliases and interfaces in the nearby included ambient declaration file.
Public orchestration methods follow the lower-level helpers they compose.

## Contract And Coding Rules

- Validate and normalize only semantic values and ranges at a genuine external
  or public API ingress. Runtime types belong to JSDoc, ambient declarations,
  and the type checker.
- Rely on the accepted readonly contract internally. Trust repository constants
  and records created by source, module, plan, assembler, executor, and backend
  implementations rather than revalidating them at each seam.
- Use no `Object.freeze`; readonly intent belongs to JSDoc and type checking.
- Durable property names do not contain units. Unit-bearing types carry units
  as data. A local scalar normalized to one known unit may name that unit.
- CPU packing owners retain logical offsets and addressing. GPU plans request
  allocation directly through `CacheFieldSpec { id, storage }`; concrete cache
  owners retain shader-addressing definitions and cache-read mapping.
  `CacheGpuBackend` owns physical allocation, and `CacheGpuExecutor` owns pass
  and layer submission.
- Preserve `CacheBuildModule.contentHash` because the assembler and reuse path
  consume it, and preserve `CacheData.contentHash` where packed-value identity
  is consumed. Do not infer a parallel owner snapshot from either direct fact.
- Texture channels are scalar storage lanes and never RGB semantics.
- Cache construction has no camera, object, scene material, post-exit source,
  or display dependency.
- Generic assembly and execution contain no local/distant source or
  flat/spherical geometry branches; concrete owners satisfy the same contracts
  behind the interfaces.
- Source-specific primary operations remain source-specific. Generic scatter,
  transport, accumulate, executor, and backend surfaces contain no distant-Sun
  branch.

## Current Acceptance Boundary

The implemented staging surface follows these accepted decisions:

- the common/CPU/GPU cache split is accepted;
- `CacheBuildContributor.createCacheModule` is the selected owner seam;
- the source-owned request excludes domains, layouts, options, and injected
  recurrence operations;
- typed composition and execution depend on interface contracts and executable
  storage facts without inspecting concrete source or geometry kinds;
- `CacheTransportDataProvider.createTransportData` is the spherical-geometry
  seam for the distant packed atmosphere-dependent kernel; its transport
  passes contain geometry, `CacheOperations`, and distant layout modules;
- Flat/local transport constructs no packed kernel; its passes contain Flat
  geometry, atmosphere, `IntegratedCacheTransport`, and local layout modules;
- `accumulate(J1)` initializes N1, while `accumulate(J1, J2)` initializes
  N2/N4 cumulative storage;
- the source-owned typed plan never places cumulative fields on a recurrence
  input;
- the exact N1, N2, and N4 pass graphs and last-consumer lifetimes are the ones
  recorded in this document, and N4 produces no `L4`;
- construction and runtime shader assemblers remain separate;
- `CacheBuildModule` and `ShaderContribution` remain the direct provider
  declarations consumed by those separate assemblers; no nested assembly
  object is interposed;
- `CacheFieldSpec` contains only direct `id` and `storage`, and
  `CacheBuildPlan` contains only `identity`, `fields`, `passes`, and `result`;
- `CacheGpuBackend` exposes only opaque field/program/binding handles;
- `CacheGpuExecutor` owns JavaScript pass/layer orchestration and staging
  cleanup and returns required unit-bearing logical-memory diagnostics;
- the direct build artifact retains only the cumulative GPU field, its opaque
  runtime bindings, diagnostics, and disposal;
- the accepted Flat/local cache remains the scaled 19-by-15
  `z`/source-subpoint-`rho` domain with geometry-owned four-tap bilinear
  reconstruction, fused GPU transport, and exactly zero packed Flat transport
  storage;
- every source-owned plan conforms to the recurrence and order policy in the
  selected numerical contract; and
- direct replacement removes the incident-cache strategy without a
  compatibility bridge.

The dome-aware nonlinear position topology remains outside this acceptance
boundary. The exact ragged Flat transport companion was completed as an
interim representation-equivalence control and then superseded by fused
transport; it is not a production strategy or fallback. Neither historical
surface may change production direct contracts, reuse keys, construction,
publication, or runtime sampling.

The Stage 4.1-through-5 numerical gate is closed. The accepted real-browser
software-renderer evidence establishes exact N1 accumulation, bit-identical
shared N2/N4 field values, cumulative pure-order sums, both N4 transport
passes, selected-only readback, result-only retention, and cleanup under the
unchanged binary32 bounds. The
[baseline import status](../production/baseline-import-status.md) owns the
exact comparison and artifact-memory results. Exact ordinary Fibonacci-34
parent data plus deterministic reflection completion gives identical current
Fibonacci-68 executable vectors and weights in Node and browser runtimes.
Supported-hardware timing and resource budgets remain open because
the accepted run used a software renderer.

The per-runtime `DistantSunCacheController` implements direct reuse-key
comparison, serialized generation supersession, failure isolation, and atomic
publication.
The Stage 7 direct replacement connects that controller to the public source
boundary, the cache-owned final-view sampler, and opaque backend binding with
no second accepted runtime path. Full release parity and supported-hardware
budgets remain follow-on acceptance work rather than alternate implementation
strategies.

The focused Stage 7 real-WebGL gate exercises opaque-binding addressing,
cumulative CPU/GLSL traversal, and automatic public setup for requested N1,
N2, and N4. This isolates runtime addressing, integration, and ownership; it
is not the release-grade binary64 complete-ray oracle. The
[baseline import status](../production/baseline-import-status.md) owns exact
run results and the combined nine-spec browser-lane environment limitation.

## Deferred Follow-Up: Source-Relative Animation And In-Setup Reconfiguration

Status: deferred mandatory MVP follow-up. This work is intentionally later
than the current construction-time implementation, but Algorithm32 MVP cannot
close until it is implemented and qualified. Resume it at production Stage 14
with an explicit cache-transform investigation.

The future MVP stage must animate both supported source/geometry families
without constructing a complete replacement facade and scene for every clock
tick. Its enabling problem is a cache transform or equivalent reusable cache
parameterization that preserves the accepted physical result across supported
time/location changes.

A finite local source approaches a distant source as direction variation,
inverse-square variation, and angular extent across the atmosphere approach
zero. That mathematical limit motivates a later comparison, but does not prove
the two sources share one cache tensor. The active distant plan selects no
local coordinate family; local source state, layout, and residency require a
separate design after distant qualification.

The current application transaction is too broad for source-only
configuration changes. A change within one supported geometry/source pairing
should retain the active composer, GPU backend, executor, compiled cache
programs, and final-view program. When a physical cache input changes, the
same setup should build candidate fields through the retained infrastructure,
preflight their bindings, atomically replace the active cache and uniforms,
then dispose the replaced fields. Failure or supersession must preserve the
published configuration. Pairing, backend-capability, or incompatible
layout/schema changes may still require setup replacement.

The flat/local reuse hypothesis is:

- source height, radius, radiometry, atmosphere, and omitted or horizontally
  uniform ground remain fixed;
- horizontal source translation and bearing are represented by the existing
  source-subpoint-relative `z`/`rho` coordinates and radial/tangent frame;
- one fixed radial domain covers the intended animation trajectory; and
- final-view source position, source subpoint, lighting, and lookup
  coordinates become updateable bindings rather than cache-program identity.

Under those conditions, apparent source elevation changes by sampling a new
`rho`; horizontal translation should not by itself invalidate the cache.
This is a hypothesis requiring direct comparison with independently rebuilt
caches before the reuse-key policy changes. Domain coverage and the
resolution cost of spreading 15 radial nodes over a complete trajectory must
be decided explicitly.

The spherical/distant numerical replacement is owned by the
[distant-Sun solar-zenith scene-cache design](solar-zenith-cache-design.md).
It selects one point-local cumulative-density Native15 cache per scene,
addressed by altitude, actual local solar zenith, and complete local
source-relative outgoing direction. Geometry retains ray termination and
Algorithm32 retains live path sampling. The
[distant-Sun plan](distant-sun-solar-zenith-cache-plan.md) owns the contained
phase gates, offline compiler, packed scene residency, and qualification. This
interface document retains only compatible program reuse, loading,
active/staging publication, failure preservation, and disposal mechanics; it
does not independently select the spherical field, local-Sun layout, or a
two-page assumption.

When resumed, the work must:

1. prove the flat translation/rotation and spherical azimuth invariants and
   publish an exact rebuild/non-rebuild matrix;
2. separate compiled program identity from build-specific bindings and retain
   setup infrastructure across compatible configuration updates;
3. select fixed animation-domain coverage without silently weakening spatial
   resolution;
4. compare retained-cache output against independent full rebuilds at
   representative source positions, including near-horizon cases;
5. expose compile, GPU execution, browser-yield, preflight, and publication
   timings plus an observable no-rebuild animation path; and
6. treat animated direct lighting and the six 4096-pixel shadow maps as a
   separate performance problem rather than folding them into atmospheric
   cache identity.

This note changes no accepted direct contract, reuse key, cache domain,
lifecycle, or runtime behavior. The current implementation remains the
authority until a separately planned and evidenced promotion is approved.
