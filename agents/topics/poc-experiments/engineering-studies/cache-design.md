# Algorithm32 Cache Interface Design

Focus: Measured alternatives and retained or rejected mechanisms.

Related owners: [caches](../../production-algorithm32/caches/cache-design.md), [architecture-contracts](../../production-algorithm32/architecture-contracts/cache-design.md), [product-behavior](../../production-app/product-behavior/cache-design.md).

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
[local-Sun scattering-aligned shell index](../../../../archives/topics/retired-20260906/agents/topics/algorithm32/cache/local-sun-cache-design.md)
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
[Stage 1 boundary decision](../../../../archives/topics/retired-20260906/agents/topics/algorithm32/experiments/flat-world-atmosphere-boundary-decision.md)
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
[historical Stage 1 evidence](../../../../archives/topics/retired-20260906/agents/topics/algorithm32/archive/algorithm32-star/experiments/star-flat-local-cache-plan.md#stage-1-evidence)
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
[historical Stage 2 evidence](../../../../archives/topics/retired-20260906/agents/topics/algorithm32/archive/algorithm32-star/experiments/star-flat-local-cache-plan.md#stage-2-evidence)
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
[historical Stage 3 evidence](../../../../archives/topics/retired-20260906/agents/topics/algorithm32/archive/algorithm32-star/experiments/star-flat-local-cache-plan.md#stage-3-evidence)
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
[Algorithm32-Star evidence archive](../../../../archives/topics/retired-20260906/agents/topics/algorithm32/archive/algorithm32-star/README.md).
The
[flat/local dome-cache experiment plan](../../../../archives/topics/retired-20260906/agents/topics/algorithm32/experiments/star-flat-local-cache-plan.md)
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
[experiment contract](../protocols/experiment-contract.md)
and
[promotion checklist](../protocols/promotion-checklist.md),
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
[production authority contract](../../production-algorithm32/architecture-contracts/architecture-boundaries.md#required-independent-output-evidence)
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
