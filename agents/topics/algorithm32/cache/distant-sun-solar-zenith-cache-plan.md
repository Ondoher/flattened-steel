# Distant-Sun Branch-Integrated Solar-Zenith Cache Plan

Status: candidate contained research and implementation plan under
representation reconsideration, current through 2026-08-27. No numbered phase
is implemented or authorized by this document. Production remains unchanged.

No successor stored semantic or coordinate layout is selected. The
branch-integrated phases below remain a candidate sequence drafted before the
owner reopened the representation choice. Pre-phase run
`000498-san-jose-nautical-zenith-culling-memory` instead quantifies the
geometric memory opportunity for a culled actual-point cumulative-density
alternative. Its result does not complete P0 or authorize P1; this plan must be
reconciled with the eventual representation decision before numbered work
begins.

This plan implements and qualifies only a radially stratified spherical
atmosphere illuminated by a distant collimated Sun. It owns execution order,
phase status, immutable evidence, and acceptance gates for the numerical design
in the [Distant-Sun Solar-Zenith Spectral Cache Design](solar-zenith-cache-design.md).
The design document remains the authority for equations and physical meaning.

All new proof source stays below
`scripts/extraterrestrial/solar-zenith-cache/`. All generated assets, logs,
captures, reports, and evidence stay in new immutable runs below
`tmp/extraterrestrial/`. The lane creates focused self-verifying proof runners,
not an experimental unit-test tree. Existing production source and sealed runs
remain read-only.

## Candidate Objective

If branch-integrated storage is selected after the pre-phase representation
comparison, deliver a contained offline compiler and runtime proof for one
uncompressed Native15 distant-Sun atmosphere asset that:

- preserves actual-point `(r, mu, mu_s, nu)` physics through N4;
- stores branch-length-indexed completed path-radiance integrals;
- supports full-boundary and finite/object-shortened segments;
- is reusable across its declared distant-Sun elevation and azimuth range;
- loads only a query-derived subset of the offline asset;
- records exact disk, decode, staging, GPU-resident, and runtime costs; and
- passes independently frozen physical and spectral error gates.

The plan ends with an owner decision about a later production port. It does
not land production code and does not implement or qualify a local Sun.

## Candidate Semantic And Open Coordinate Fork

For branch `g`, checkpoint length `ell_i`, Native15 channel `lambda`, and
maximum order `N`, the stored radiance is

```text
F_N(g, ell_i, lambda) = integral from 0 through ell_i of
    T_g(0 -> t, lambda) * J_<=N(p_g(t), v_g, lambda) dt
```

Every checkpoint is one completed integral. Runtime interpolates its upper
limit; it never sums checkpoint values. `ell` is physical distance in metres.
A normalized coordinate and an integer checkpoint index are storage mappings,
not physical units. Offline quadrature count is independent of retained
checkpoint count.

If the branch-integrated candidate survives pre-phase comparison, Phase 3
provisionally selects between:

1. origin-indexed `F(r, mu, mu_s, nu, ell, lambda)`, which adds a true fifth
   axis; and
2. a canonical whole-ray prefix such as `F(b, eta, nu, x, lambda)`, which may
   replace origin redundancy but changes paging and finite-segment algebra.

Neither layout, `N_ell = 15`, nor two-page residency is preselected. Phase 3
also builds a single-boundary-total endpoint-algebra comparator. It is not a
third checkpoint semantic, but it is required before extra checkpoint storage
can be justified.

## Pre-Limit Resource Policy

No steady-state, transition, construction, disk, or driver-memory ceiling is
selected before the [pre-limit memory ledger](solar-zenith-cache-design.md#pre-limit-memory-ledger)
is completed and then replaced by measurements from the real layouts. The
initial ledger deliberately reports an envelope rather than fitting a design
to a guessed budget.

The resource decision has four evidence levels:

1. exact logical arithmetic for every candidate count and scalar format;
2. exact physical packing, chunk, staging, and active/prefetch/successor/
   retiring resource unions from the prototype;
3. query traces for ordinary sky, varied endpoints, probes, ground, and space;
   and
4. observed steady and peak renderer/driver deltas on named hardware.

P0 freezes the ledger schema, not a limit. P3 produces provisional J1
rate/accuracy/query-union curves and may eliminate dominated layouts without
inventing an absolute ceiling. P5 repeats them at N4, may change the layout,
and presents the first complete uncompressed frontier for an owner choice
before P6 compilation. P8 adds observed runtime and driver allocation before
any supported-hardware budget is final. Compression does not contribute
credit before P9.

## Frozen Claim Boundary

The first truth asset fixes and hashes:

- planet bottom/top radii and spherical geometry policy;
- radially stratified atmosphere, aerosols, and ozone profile;
- ozone as absorption/extinction only, never scattering or phase;
- ground model and albedo;
- distant collimated source direction convention, angular-support policy,
  Native15 irradiance, and normalization;
- Native15 bin-average semantics and the higher-resolution offline spectrum;
- requested N1, N2, and N4 recurrence with only the preceding pure order
  feeding the next;
- source/view/angular/spectral integration policies;
- source-visibility, refraction, and finite-disk policy;
- supported solar-elevation interval;
- branch kinds, units, coordinate mappings, and precision; and
- compiler, solver, writer, verifier, and source revisions.

Camera, Color, stars, Sun tiles, display exposure, and screen resolution are
not asset axes. They can appear only in downstream diagnostic renders.

## Phase 0 — Contract And Evidence Freeze

Deliverables:

- one versioned field-semantic record;
- units and sign conventions for every coordinate and quantity;
- explicit ground, tangent/space, and terminal branch definitions;
- one upstream prefix anchor per connected participating-medium interval and
  an explicit prohibition on prefixes across opaque ground;
- both coordinate candidates and their inverse mappings;
- truth-corpus identities and held-out partitions;
- predeclared numerical tolerances and denominator floors;
- a pre-limit analytical memory ledger covering complete assets, decoded
  staging, steady query unions, compatible and incompatible atomic
  replacement, and compiler truth memory for all declared count sweeps; and
- resource-ledger and failure-status schemas for logical, physically packed,
  and observed driver bytes.

Gate P0:

- every physical, numerical, source, and tool input has one owner and identity;
- no production or local-Sun implementation or accuracy claim appears in the
  contract;
- branch checkpoint count is declared open;
- no memory ceiling, page-count limit, target hardware class, or compression
  credit is selected from analytical payload arithmetic alone; and
- candidate output has not been inspected before error thresholds are frozen.

## Phase 1 — Geometry, Branch Mapping, And Shape-Impact Oracle

Implement a cache-free binary64 geometry oracle for:

- atmosphere entry/exit and ground intersection;
- tangent/closest-approach coordinates;
- actual-point `r`, `mu`, `mu_s`, and `nu` along a branch;
- analytic Earth-shadow/source-visibility crossings;
- `ell`, normalized address, checkpoint index, and inverse mapping; and
- physical-domain validity and disconnected branch kinds.

Before the distant address layout is provisionally selected, add a
mathematical shape-impact audit for later local work. It must:

- independently verify the design's same-rank fixed-range spherical point-
  source invariants `(r, mu, zeta, kappa, ell)` with fixed geocentric source-
  center radius `rho = length(S)` in asset identity, failing P1 if a
  counterexample is found and treating sampled `rho` as an additional axis;
- show their distant limit `zeta -> mu_s` and `kappa -> nu`;
- retain a concrete Flat/dome two-center counterexample in which atmosphere or
  map center, source subpoint, and boundary state are not represented by that
  spherical tuple; and
- verify that named-axis manifests and opaque query packets do not hard-code a
  `mu_s` page family.

This is a coordinate-sufficiency and interface-shape audit only. It does not
construct a local cache or qualify local physics.

Required fixtures include ground, atmosphere, space, tangent, radial, horizon,
and degeneracy cases. The retained San Jose nautical horizon must reproduce
its first sunlit region near `543 km` without hard-coding that value.

Gate P1:

- every mapping is monotone over its declared connected branch;
- zero and terminal endpoints are exact;
- forward/inverse round trips pass their frozen tolerance;
- canonical states obey `eta^2 + nu^2 <= 1`, use a declared radial convention
  at `b = 0`, and keep each prefix inside one connected interval;
- finite-spherical origin states obey
  `1 + 2*mu*zeta*kappa - mu^2 - zeta^2 - kappa^2 >= 0`, canonical finite
  states obey `eta^2 + kappa^2 <= 1`, and any `d_t = 0` source-center
  singularity has an explicit excluded-domain, finite-radius, clamp, or
  termination policy;
- no interpolation path crosses invalid or disconnected states; and
- analytic and independently sampled visibility events agree; and
- the finite-spherical derivation and Flat/dome counterexample above are both
  retained before P3 without selecting a local asset.

## Phase 2 — Cumulative J1 Checkpoint Study

Construct high-resolution binary64 actual-point J1 cumulative curves before
building a full field. Use training branches plus whole held-out branches and
held-out endpoint lengths.

Compare retained counts `8`, `12`, `15`, `24`, and `32` under:

- uniform physical distance;
- optical-depth-aligned spacing;
- analytic event-aligned spacing; and
- an adaptive worst-interval splitter used as a truth upper bound.

Every candidate includes zero and terminal endpoints plus applicable
entry/exit, ground, tangent, source-visibility, and high-gradient landmarks.
Measure construction convergence separately from checkpoint interpolation and
`R32F` quantization.

Gate P2 selects a preliminary checkpoint mapping only if it passes:

- absolute Native15 error and relative error above a frozen floor;
- spectral energy, photopic Y, XYZ, and signed-linear-RGB error;
- transmittance/optical-depth error;
- zero, nonnegative, and nondecreasing cumulative-integral invariants;
- full-boundary equality and arbitrary shortened-segment error;
- source-visibility crossing and short-segment conditioning; and
- the retained nautical center/flank diagnostic.

Failure to find a passing checkpoint grid within the declared `8` through
`32` study counts rejects the explicit checkpoint-axis candidate; those study
counts are not a runtime memory limit, and failure does not authorize post-hoc
threshold changes.

## Phase 3 — Provisional Coordinate-Layout Decision

Build reduced uncompressed prototypes for both checkpoint-coordinate
candidates and a boundary-total endpoint comparator using the same J1 truth
curves, endpoints, and query corpus.

For origin-indexed storage, record the real five-axis payload and
`(mu_s, i_ell)` slab working sets. At the provisional reference grid, direct
Native15 `R32F` with 15 checkpoints is `28.125 MiB` per `mu_s` page,
`56.25 MiB` for two complete pages, and `900 MiB` over 32 pages.
Those figures are one point in the required `N_mu_s = 16, 24, 32, 48, 64`
by `N_ell = 8, 12, 15, 24, 32` sweep, not a selected limit. Include factored
transmittance, coordinate tables, physical padding, active query unions,
adjacent shared-page transitions, fully incompatible replacements, and CPU
decode/upload overlap at every point. Select and report radiance and factored-
transmittance checkpoint counts, metre mappings, and runtime slab unions
independently; source independence does not imply equal `ell` grids.

For canonical prefixes, record converged `(b, eta, nu, x)` counts, prefix
subtraction error, weak-transmittance amplification, disconnected branch
handling, and actual query chunk unions. No size is inferred from the
origin-indexed grid. Its byte ledger must count both atmospheric intervals for
every ground-crossing line, invalid-domain or ragged-packing policy, radial and
tangent seams, transmittance, and the exact physical chunk layout.

For the comparator, let `B(x)` be radiance from actual-point state `x` to the
forward terminal boundary of its connected branch, and reconstruct a
downstream endpoint `y` with

```text
L(x -> y) = B(x) - T(x -> y) * B(y).
```

Build both boundary lookups from geometrically consistent actual-point states.
Reject queries that cross opaque ground, and measure subtraction cancellation,
short-segment relative error, transmittance underflow, bytes, fetches, and
resident query unions on exactly the checkpoint candidates' endpoint corpus.

Gate P3 provisionally selects one checkpoint layout using:

- held-out physical error;
- exact logical disk and decoded bytes;
- GPU packing and resident bytes;
- per-frame active, prefetched, successor, and retiring chunk-union
  distributions with P50/P95/P99 and worst case;
- CPU fetched, decoded, repacked, upload-backing, verification, and
  restoration-mirror peaks;
- texture dimensions/counts/formats plus texture-size, array-layer, fragment-
  sampler, combined-sampler, and float-format capability limits;
- texture fetches and interpolation work;
- short-segment numerical conditioning; and
- endpoint, full-boundary, ground, and space support.

The checkpoint layout must also show a measured advantage over the comparator
that is sufficient to justify its extra state. If neither checkpoint candidate
is viable, or the boundary-total identity dominates it, stop and revise the
representation in the design before compiling an asset. P3 is a J1 decision
only and cannot freeze the final layout; P5 must reopen it at N4.

## Phase 4 — Independent Actual-Point N4 Truth Solver

Implement an offline binary64-or-higher solver that retains pure
`J1, L1, J2, L2, J3, L3, J4` evidence and cumulative `JthroughN` only for
comparison. It must evaluate actual-point solar state and Earth shadow along
every source, incoming, transport, and view path.

It must not read the current receiver-column `C4` as physical truth. Only the
preceding pure order feeds recurrence; cumulative feedback is a manufactured
failure case.

Gate P4:

- internal quadratures converge independently on every retained axis;
- recurrence and order/component conservation identities hold;
- N1 agrees with run `000497`'s actual-point three-ray oracle;
- blocked direct components and nonzero multiple-scattered shadow radiance are
  distinguished correctly;
- symmetry controls pass where the declared atmosphere/ground is symmetric;
  and
- all 15 channels are finite with declared nonnegative tolerances.

## Phase 5 — N4 Layout And Resolution Convergence

Vary each selected physical axis, retained branch checkpoints, internal
quadrature, and Native15 reduction independently. Hold out complete solar
states, branches, checkpoint intervals, orders, and wavelength conditions.

Repeat the P2 checkpoint selection against the complete N4 field. Rebuild and
recompare both checkpoint-coordinate candidates and the single-boundary-total
endpoint comparator on held-out N4 states and the same segment corpus. P5 may
reverse P3's layout choice or reject the explicit checkpoint representation;
neither the J1 mapping nor the J1 address decision is grandfathered.

Freeze every nondominated uncompressed N4 grid and layout that passes the
predeclared physical, conditioning, and query-union gates. Record its complete
resource envelope without discarding it against an unselected absolute memory
ceiling. A J1 mapping or layout that fails at N4 is rejected.

Recompute the complete P3 memory frontier with the N4-selected counts and
actual compiler/runtime packing. P5 may not inherit a ceiling from the J1
prototype, and it must keep logical bytes distinct from observed driver
allocation.

Gate P5 records the uncompressed Pareto frontier for coordinate layout,
checkpoint mapping, grid, transmittance algebra, and resource envelope. Before
P6, the owner selects one measured candidate envelope for compilation or
rejects the checkpoint representation. This is the first resource-limit
decision; it is not backdated into P0--P3.

## Phase 6 — Offline Asset Compiler

Compile the P5-selected grid from the converged truth solver. First emit
uncompressed Native15 `R32F`; do not add a basis, dictionary, residual codec,
or half precision.

The immutable asset contains at least:

```text
manifest.json
coordinates.json
source-model.json
branch-mapping.json
transmittance-manifest.json
radiance/<coordinate-chunk>.bin
transmittance/<coordinate-chunk>.bin
checksums.json
order-component-probes.json
convergence-ledger.json
derivation.json
validation-report.md
```

The actual names may be refined before P0; their semantic records may not be
omitted. Every chunk records logical and physical packing, units, dimensions,
byte lengths, uncompressed and stored-byte hashes, parents, and derivation.

Gate P6:

- two independent builds produce identical declared bytes and hashes;
- a separate verifier reconstructs the manifest and every content hash;
- decode reproduces the uncompressed values exactly;
- retained order probes agree with P4 and the selected layout agrees with P5;
  and
- complete disk, peak construction, and verification resources are recorded.

## Phase 7 — Contained Loader, Sampler, And Residency

Implement a contained runtime consumer around an opaque coordinate-family
query packet. Generic loader code must not assume that every family has a
`mu_s` page, even though the first concrete asset is distant-Sun only.

The sampler returns:

- already-integrated Native15 atmospheric path radiance for the requested
  segment; and
- the separately defined Native15 transmittance needed for celestial or
  endpoint composition.

It never attenuates integrated atmospheric radiance twice and never restores a
live density-marching fallback silently.

Residency is the exact union required by the frame's query packets. Loading and
publication atomically bind asset, distant-source state, query packet, and
chunk set. Missing ranges fail explicitly; stale loads, black substitution,
and incompatible clamping are prohibited.

Gate P7:

- all-resident and split-chunk sampling agree under the frozen tolerance;
- ordinary sky, varied endpoint, probe, ground, and space query unions pass;
- prefetch, stale completion, failure preservation, context restoration, and
  exact-once disposal pass; and
- a dummy second coordinate-family manifest proves generic compiler/loader
  plumbing has no hard-coded distant-axis assumption. This is an architecture
  fixture, not local-Sun physics or accuracy evidence.

## Phase 8 — Physical, Appearance, And Resource Qualification

The qualification matrix includes:

- exact San Jose sunset, civil, nautical, and astronomical states;
- run `000497`'s source-axis and `+/-50-degree` causal controls;
- daylight B1 with the unchanged measurement boundary;
- source-facing, antisolar, zenith, horizon, ground, and space paths;
- full-boundary and object-shortened segments;
- page/chunk-crossing Sun-motion sweeps;
- low-elevation blue energy and the `470/626 nm` ratio; and
- order-separated and ozone-on/off physical diagnostics.

Spectral/oracle gates own acceptance. Every requested diagnostic image is
written even if an appearance gate fails; failure status must not suppress
captures. A Bruneton side-by-side panel is not required for the first causal
qualification.

Record complete asset bytes, stored and decoded chunk bytes, CPU staging,
GPU resident and driver peaks, decode/upload/publication times, cache misses,
frame cost, texture fetches, and the observed query-union distribution.
Record cold load, steady terminal sky, varied endpoints, page/chunk crossing,
prefetch, compatible Sun transition, incompatible asset replacement, failed
load, context restoration, and delayed post-disposal reclamation as separate
timelines. Report texture format, dimensions, count, padding, invalid slots,
sampler count, `MAX_TEXTURE_SIZE`, `MAX_ARRAY_TEXTURE_LAYERS`, fragment and
combined texture-unit limits, applicable float-sampling/render-target support,
and hardware/browser/ANGLE identity with every driver result.

Gate P8 decides whether the checkpoint representation is viable relative to a
P3/P5-qualified single boundary total plus two-lookup segment algebra. It may
accept correct physics while rejecting the representation on memory.

## Phase 9 — Compression And Redundancy

Compression begins only after the uncompressed field passes P8. Run one codec
per immutable experiment:

1. implicit exact-zero representation;
2. reduced precision or scaled/block-float storage;
3. shared linear spectral bases;
4. global spectral dictionary plus amplitude/residual;
5. cross-zenith key pages and residuals; and
6. cross-checkpoint delta or curve representations.

Fitters hold out complete solar pages, branches, and checkpoint intervals.
Worst-case Native15, terminator, weak-blue, segment, page-boundary, and
conditioning errors own selection. Compression ratio and global variance do
not.

## Phase 10 — Owner Decision

Produce one terminal decision record:

- accept the contained distant-Sun compiler and runtime representation;
- reject it with exact failing gates; or
- retain it as an oracle while selecting another runtime layout.

Only an accepted result may motivate a separate production-port plan.
Production changes, source-transform integration, and cache-interface cutover
are outside this plan.

## Local-Sun Impact And Deferred Follow-Up

Current distant and local implementations do not share one concrete cache
shape. They share Native15/atmosphere semantics, pure-order recurrence,
generic scatter/transport concepts, and lifecycle principles. Source-specific
J1/L1, Geometry, domains, packing, concrete cache, and source controller remain
distinct.

Concretely, the implemented distant persistent field is
`W27 x 48 altitude nodes x Native15`; the implemented Flat/local field is
`W27 x (19 z nodes x 15 source-centered rho nodes) x Native15`. Their GPU
storage records both look like direction-by-position-by-wavelength fields, but
the position coordinates and source physics are not interchangeable. Replacing
the distant field therefore must not mutate a supposedly universal tensor
shape underneath the local cache.

This plan deliberately future-proofs only potentially reusable machinery:

- cumulative-integral and checkpoint semantics;
- high-accuracy integration and convergence tooling;
- named-axis manifests, hashes, and error ledgers;
- codec infrastructure;
- bounded loader/pool and atomic publication mechanics; and
- an opaque source-family coordinate-query boundary.

It does not select a shared physical tensor. The Phase-1 shape audit must keep
two future cases distinct:

- for a radially stratified spherical atmosphere and a fixed-range point
  source `S = rho * A`, origin invariants `(r, mu, zeta, kappa, ell)` can have
  the same axis count as the distant tuple, with `zeta = dot(p/r, A)`,
  `kappa = dot(v, A)`, and fixed geocentric source-center radius `rho` in asset
  identity; sampling `rho` adds an axis. This is a legitimate same-rank
  hypothesis, not a qualified local layout; and
- the implemented Flat/dome local source is a two-center problem involving
  atmosphere or map center, source subpoint, and map/dome boundary. It may
  require additional invariants and a distinct coordinate family.

In either case a finite source has branch-varying direction, `mu_s`, `nu`,
visibility, and inverse-square irradiance. An area emitter additionally has
branch-varying angular support. Matching axis count therefore would not make
the distant and finite assets interchangeable.

After P10, a separate local study may:

1. select spherical versus flat and point versus area-source physics;
2. prove sufficient local invariants with counterexamples;
3. prove convergence to the distant limit using `S_D = D * s_hat` and a
   radiometric normalization such as `K(D) = E_infinity * D^2` that preserves
   finite far-field irradiance;
4. measure extra dimensions, asset families, and residency;
5. decide which modules genuinely remain shared; and
6. create a separate local-Sun plan.

Other than the pre-P3 mathematical shape-impact audit, local implementation and
accuracy work is not required for any phase in this plan. A later local design
must select its source model and coordinate sufficiency rather than treating a
new source-distance value as automatic qualification.

## Status Ledger

| Phase | Status | Current result |
| --- | --- | --- |
| Pre-phase zenith-culling census | accepted exploratory evidence | Run `000498`: 617 conservative ragged altitude/zenith blocks (`154.424171 MiB`) or 713 with a one-node halo (`178.451271 MiB`); whole-page equivalents are 18 pages (`216.243896 MiB`) or 20 pages (`240.270996 MiB`). Geometry/logical bytes only; no spectral, N4 closure, packing, or layout-selection claim. |
| Pre-phase recorded-proxy codec screen | accepted exploratory evidence | Run `000500` measures base/gain, shared-delta, and direct int8/int16 residual rate-distortion over labeled downstream Native15 path-radiance cohorts. It finds strong approximate redundancy but weak-blue, nonnegativity, and out-of-family transfer failures. It does not use raw successor-cache data, select a codec, complete P9, or contribute compression credit to the uncompressed frontier. The canonical design owns its measurements. |
| P0 contract freeze | pending | Analytical pre-limit memory envelope added; evidence inputs and schemas not frozen |
| P1 branch geometry/shape impact | pending | No implementation |
| P2 J1 checkpoint study | pending | No implementation |
| P3 provisional coordinate decision | pending | Two checkpoint layouts and boundary-total comparator retained |
| P4 N4 truth solver | pending | No implementation |
| P5 N4 layout/convergence | pending | No implementation |
| P6 offline compiler | pending | No implementation |
| P7 loader/sampler | pending | No implementation |
| P8 qualification/resources | pending | No implementation |
| P9 compression | blocked by P8 | No codec selected |
| P10 owner decision | blocked by P8 | No production authorization |

## Done Condition

This plan is complete only when P10 records an owner decision backed by an
immutable, independently verified distant-Sun asset, offline compiler,
contained runtime sampler, full error ledger, and measured resource envelope.
Local-Sun design and production promotion remain separate work even after that
condition is met.
