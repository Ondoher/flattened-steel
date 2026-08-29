# Distant-Sun Point-Local Solar-Zenith Scene-Cache Plan

Status: contained execution plan complete through P10, current through
2026-08-29. P7 closes the P0 fixed-observer camera/object contract in accepted
run `000570`; P8 retains the Native48/Z180/W27/F68/N4/Q30 candidate under the
owner-selected external-accuracy boundary; P9 measures its complete
uncompressed W27 asset and lifecycle in accepted runs `000572` and `000577`;
and P10 qualifies exact cubed-sphere seam deduplication in accepted run
`000579`. Production remains unchanged.

The [canonical design](solar-zenith-cache-design.md) selects one point-local
cache per scene:

```text
C4(altitude, localSolarZenith, outgoingDirection, Native15)
```

This plan replaces the earlier branch-integrated checkpoint sequence. It does
not implement observer-projected pages, camera-origin branch checkpoints,
canonical prefixes, or boundary-total fields.

All implementation belongs below `scripts/extraterrestrial/`. All generated
output belongs in new immutable runs below `tmp/extraterrestrial/`. The
historical observer-projected lane and every prior run remain read-only
evidence.

## Objective

Build, load, and exercise one uncompressed Native15 scene cache that makes the
ordinary Algorithm32 path sampler local-solar-zenith aware without changing
Geometry's ray-length contract.

The selected runtime remains:

```text
rayLength = Geometry.resolveVisibleLength(...)

for each Algorithm32 sample along rayLength:
    calculate actual point
    calculate altitude and local solar zenith
    transform outgoing direction into the local source frame
    query one scene cache
    accumulate transmittance-weighted spectral density
```

The first implementation targets the retained San Jose distant-Sun scenes.
Solar noon provides the clearest near-ground control; nautical twilight
provides the decisive missing-`mu_s` control.

## Fixed Decisions

- Stored semantic: cumulative local spectral scattering density through N4.
- Runtime axes: altitude, local solar zenith, and complete source-relative
  outgoing direction.
- Payload: Native15 spectral values; no RGB cache representation.
- One atomically published cache per scene Sun state.
- Geometry continues to provide ray termination; the cache contains no camera
  or object dimension.
- Objects shorten the live integration ray and do not rebuild the cache.
- The existing pure-order recurrence remains `L1 -> J2 -> L2 -> J3 -> L3 ->
  J4`; cumulative density never feeds recurrence.
- Offline construction time and temporary memory do not constrain the stored
  physics. Resident scene-cache memory remains a governing measurement.
- Production W27 is the qualification baseline. A first visual POC may retain
  W39 only to compare directly with the historical POC.
- Native15 `R32F` is the uncompressed correctness baseline. Compression waits
  until qualification.
- Requested images are written regardless of appearance or numerical gates.

## Required Scene-Support Decision

Before inventory construction, P0 must declare what one scene cache promises
to support. At minimum the declaration contains:

- permitted camera-origin region;
- permitted camera directions or complete rotation support;
- ground, atmosphere, and object endpoint ranges;
- altitude range;
- local-solar-zenith range reachable at each altitude; and
- behavior for an out-of-support query.

A fixed observer with rotation, a bounded camera volume, and unrestricted
planet-wide motion create different inventories. They use the same field
semantic but cannot share byte claims.

The first San Jose POC may freeze the existing observer position with complete
rotation and arbitrary object-shortened endpoints. Any wider translation
support must be declared and measured rather than inferred.

## Selected Logical And Packed Layout

The logical field is rectangular:

```text
altitude node
local-solar-zenith node
outgoing direction
Native15 spectrum
```

The physical cache may omit altitude/zenith blocks unreachable by declared
scene support. One retained inventory block contains all outgoing directions
and all Native15 values at one altitude/zenith node.

The first packed representation uses:

```text
x = W27 or comparison W39 outgoing index
y = packed (altitude, local-solar-zenith) row
z = Native15 wavelength layer
format = R32F
```

A ledger maps physical altitude/zenith stencils to packed rows. It must provide
every lower/upper altitude and zenith neighbor required by runtime
interpolation. Missing support is an explicit error, not a zero field value.

One published scene-cache handle may internally bind more than one hardware
texture if required by limits, but all resources publish, swap, restore, and
dispose atomically. There is no Sun-position paging inside one scene cache.

## Memory Baselines

One retained block costs:

```text
W27: 262,440 bytes
W39: 547,560 bytes
```

Full Native48/Z180 rectangular caches cost:

```text
W27: 2,267,481,600 bytes (about 2.112 GiB)
W39: 4,730,918,400 bytes (about 4.405 GiB)
```

Run `000498`'s conservative San Jose nautical W27 ledger retains 617 blocks or
`154.424171 MiB`; a one-node exterior halo retains 713 blocks or
`178.451271 MiB`. These are input evidence for P1, not accepted N4 cache
sizes.

The plan chooses no memory limit before it records:

- uncompressed payload bytes;
- ledger and global-resource bytes;
- physical texture allocation;
- complete-cache steady residency;
- atomic replacement transition peak; and
- observed driver allocation on named hardware.

## Builder Strategy

The existing contained GPU solver already constructs the correct transient
logical field over Native48, Z180, F68, and W39. The successor compiler removes
only the fixed-observer projection stage.

For each wavelength:

```text
initialize the packed scene-cache accumulator

evaluate J1 at every retained local field state
accumulate selected J1 rows

construct J2 from L1
accumulate selected J2 rows
transport J2 to L2

construct J3 from L2
accumulate selected J3 rows
transport J3 to L3

construct J4 from L3
accumulate selected J4 rows

write the completed packed wavelength layer
```

Rows are selected by `(altitudeIndex, solarZenithIndex)` and copied directly
from the local solver field. No observer ray, altitude-shell intersection,
projection validity mask, camera canonical frame, or branch-distance mapping
participates.

## Runtime Strategy

At each existing Algorithm32 quadrature point, runtime calculates:

```text
p = observer + distance * worldRay
h = length(p) - bottomRadius
localUp = normalize(p)
mu_s = dot(localUp, sceneSunDirection)
localOutgoing = express(worldRay, localUp, sceneSunDirection)
```

The packed ledger resolves the two altitude and two solar-zenith rows. W27 or
W39 supplies the four outgoing-direction taps. The cache reconstructs one
Native15 spectrum from at most 16 taps.

The outer path length, sample distances, view transmittance, object shortening,
endpoint composition, celestial composition, and Color remain unchanged.

## Phase P0 — Contract And Scene-Support Freeze

Status: complete in accepted immutable run
`000516-point-local-scene-cache-p0-contract` (artifact-set SHA-256
`c1c7630ad076c74aba3ea0c987879b15c0c42f1cca2cf003eeb7ec220308724c`).

Deliverables:

- create a new contained successor lane;
- pin the selected cumulative-density semantic and units;
- pin the first scene Sun state and supported camera/spatial region;
- pin Native48, provisional Z180, F68, W39-for-POC, Native15, N4, ozone, and
  numerical controls;
- define exact out-of-support behavior;
- define packed-row ledger and cache manifest schemas; and
- record the historical runs consumed as comparison evidence.

Gate P0:

- one scene means one declared cache identity and support domain;
- camera and object state are absent from the stored axes;
- Geometry's ray-length contract is unchanged; and
- all implementation/output paths satisfy containment and immutable-run rules.

## Phase P1 — Inventory And Culling Ledger

Status: complete in accepted immutable run
`000517-point-local-scene-cache-p1-inventory` (artifact-set SHA-256
`91cb2e9938e1f24ba3a7feb5e5217ae45b120aff33d18a585c7e1b274ad3c5ac`).

The fixed San Jose observer, complete camera rotation, and arbitrary
Geometry-shortened endpoints retain 618 altitude/zenith blocks for solar noon
and 617 for nautical twilight. Both occupy 18 complete Z180 pages, but the
packed ledgers cost only `338,392,080` and `337,844,520` bytes with W39, or
`162,187,920` and `161,925,480` bytes with W27. The proof exercised
`6,736,896` reachable local queries and more than `26.6 million` stencil taps
per scene. These are exact logical R32F counts, not N4 construction,
interpolation-accuracy, physical-texture, or driver-memory evidence.

Deliverables:

- enumerate every altitude/zenith block reachable by the P0 scene support;
- add interpolation-safe altitude and zenith halos;
- prove every declared runtime query has a complete 2-by-2 physical stencil;
- compare rectangular, complete-page, and packed-row byte counts;
- measure solar-noon and nautical inventories independently; and
- record W39 POC and W27 successor sizes without selecting a limit.

Gate P1:

- no retained block depends on a camera-ray shell intersection;
- no missing block is interpreted as spectral zero;
- the ledger deterministically round-trips every retained physical node; and
- the declared support closure is complete.

## Phase P2 — Selected-Row GPU Accumulator

Status: complete in accepted immutable run
`000519-point-local-scene-cache-p2-accumulator` (artifact-set SHA-256
`8ad58afb3c45175c015c3e2f4d4997294698352fcf3f1403f27f25da7959c873`).
At `595 nm`, it emits exactly 618 solar-noon and 617 nautical packed rows,
proves binary32 cumulative order identities, finite nonnegative values,
preceding-pure-order recurrence, and complete tracked temporary release. Run
`000518` is the preserved sandbox-denied Chrome-launch predecessor.

Deliverables:

- replace observer-page projection with packed local-row accumulation;
- evaluate direct J1 over retained local states;
- copy and accumulate selected pure J2, J3, and J4 rows;
- retain preceding-pure-order recurrence only;
- process one wavelength at a time; and
- expose selected probes and complete resource ledgers.

Gate P2:

- one wavelength emits the exact packed row count;
- every emitted scalar is finite and nonnegative;
- `C4 = J1 + J2 + J3 + J4` at selected probes;
- no cumulative field feeds recurrence; and
- all temporary solver resources release after their last use.

## Phase P3 — Complete Native15 Scene-Cache Compiler

Status: complete in accepted immutable run
`000520-point-local-scene-cache-p3-compiler` (artifact-set SHA-256
`16271de0e4c5de115335655ccfd6a0670604458a4340d659a06da7116f4da17d`).
It writes independently loadable Native15 W39 payloads of `338,392,080` bytes
for solar noon and `337,844,520` bytes for nautical twilight, with separate
ledgers, manifests, derivations, and content hashes.

Deliverables:

- execute all 15 wavelength schedules;
- write one uncompressed scene-cache payload and packed-row ledger;
- write cache identity, support, layout, units, and derivation metadata;
- preserve complete content hashes; and
- support adding another independently built scene cache without mutating an
  earlier run.

Gate P3:

- payload and ledger sizes match exact arithmetic;
- every wavelength uses the same logical inventory;
- the cache is independently loadable; and
- immutable-run verification passes.

## Phase P4 — Zenith-Aware Runtime Lookup

Status: complete in accepted immutable run
`000522-point-local-scene-cache-p4-runtime` (artifact-set SHA-256
`6595be5cab9e1d75bfb6717dbf44b612c9b50e0f0a3efa04c217c59859042e2c`).
Exact nodes resolve one tap; the manufactured off-grid state resolves eight
nonzero taps with unit total weight. GPU reconstruction agrees with CPU
addressing within `1.23447e-13` maximum absolute error. Unsupported states
fail explicitly. Run `000521` preserves the exact-node tolerance predecessor.

Deliverables:

- load and bind the packed scene cache as one runtime provider;
- compute actual-point altitude and `mu_s` at every path sample;
- transform the live outgoing direction into the local source frame;
- implement the 2-altitude by 2-zenith by 4-direction stencil;
- preserve Native15 through path integration; and
- fail explicitly on unsupported queries.

Gate P4:

- manufactured local states resolve the declared packed rows and weights;
- exact nodes produce exact single-row/single-direction access;
- off-grid weights sum to one;
- no observer-projection or validity-mask path participates; and
- the outer Algorithm32 sample distances and Geometry ray length remain
  unchanged.

## Phase P5 — Solar-Noon And Nautical Plausibility Renders

Status: complete in accepted immutable run
`000524-point-local-scene-cache-p5-renders` (artifact-set SHA-256
`85d3bb8298775210d5a30c88d8c3ae6faecd80eba4b06060f5353d9c78df1d25`).
Both unconditional `640 x 400` images use only their complete P3 point-local
cache. Solar-noon row 220 measures `(148.74, 146.33, 141.94)`, close to run
`000513`'s successful `(145.43, 144.62, 141.62)` near-ground diagnostic. The
nautical source band measures `57.81`, versus left/right flanks `53.58` and
`58.16`; the prior central depression is absent in this first-look metric.
Run `000523` preserves the post-render historical-image-decode stall; its
uploaded images were not promoted or copied.

Deliverables:

- render the retained San Jose solar-noon scene first;
- render the retained San Jose nautical-twilight scene second;
- preserve both images regardless of appearance;
- compare solar-noon horizon profiles with runs `000511`, `000513`, and
  `000515`; and
- compare nautical source-axis/flank behavior with runs `000493`, `000497`,
  and `000509`.

Gate P5 is operational only for the first look:

- the complete cache loads;
- both scenes render without resource or shader failure;
- no additive actual-point correction or observer-projected page is used; and
- all outputs and configuration identities are preserved.

## Phase P6 — Radial And Solar-Zenith Resolution

Status: complete. P6.1 is complete in accepted immutable runs
`000525-point-local-scene-cache-p6-radial-build` (artifact-set SHA-256
`9513169456d7da76a839d97e434fc01b6927c4294af3ec178bd13151af424d66`)
and `000526-point-local-scene-cache-p6-radial-diagnostic` (artifact-set SHA-256
`bac0ecad8c5f25208c0150c1a92b7413dfcdac8c32605f16963ffdf5e6a02690`).
The isolated quadratic 48-node radial redistribution does not remove the gray
band, and retained, linear, and chromaticity views show that display
compression is not its primary cause. The dominant first camera-path midpoint
lies at about `190.3 m` altitude and supplies more than `92.6%` of the focused
Native15 spectral sum. P6.2 is complete in accepted immutable run
`000527-point-local-scene-cache-p6-components` (artifact-set SHA-256
`f85d0412aa15feb4929ed47fb1f48cbc94a4c7dc5ca4964e9975e8b39b9e33c0`).
The gray-band focus is `56.79%` final-event Mie and `49.07%` J2--J4, versus
`16.89%` and `29.35%` in the blue-sky control. This attribution does not by
itself select a physical correction.
P6.3 is complete in accepted immutable run
`000528-point-local-scene-cache-p6-aerosol-sweep` (artifact-set SHA-256
`87ea6c235558b427ca0ca27d104ddb87b885701da2639a40b9733744eb901729`).
The pale band survives with zero aerosol, where J1 supplies `77.70%` of the
focused result. Aerosol changes brightness and hue but is not the structural
cause. The next isolated P6 step refines the uniform 15-interval camera-path
quadrature around the dominant near-ground interval while reusing the complete
canonical cache unchanged.
P6.4 is complete in accepted immutable run
`000529-point-local-scene-cache-p6-view-quadrature` (artifact-set SHA-256
`c3d1f025692483e98d2f6090367abf7afd0e3389a22d96ccbfcddca878166ea3`).
Using the exact canonical cache, quadratic near-observer spacing changes row
220 from gray to blue at the same 15-sample count; 30 and 60 intervals then
converge within `0.71%` magnitude and `0.000593` normalized spectral shape.
The uniform camera-path quadrature is the causal defect. P6.5 subsequently
qualifies the general Q30 view-path rule across retained Sun states and
endpoint classes.
P6.5 is complete in accepted immutable run
`000530-point-local-scene-cache-p6-q30-qualification` (artifact-set SHA-256
`e63cc4b2b516e2909c33d456f3966ca713e7f4bbf2c91aa883c00c47db2d03f9`).
All six Q30/Q60 solar-noon, nautical, and opaque-black 10 km object renders are
preserved. Against uniform-960 sparse integration, Q30's worst result is the
solar-noon horizon at `0.927412%` magnitude error and `0.000764425` normalized
shape error, within the frozen `2%` and `0.002` gates. Q30 is the contained
candidate for subsequent coverage; production remains unchanged.

Deliverables:

- measure held-out Native15 interpolation error for Native48;
- test a fixed-count radial redistribution with denser valid near-ground
  support;
- treat run `000524`'s pale gray solar-noon near-ground band as an explicit
  defect and preserve it as the visual and spectral control;
- separate cache interpolation, atmospheric scattering, and display
  conversion at that band by recording pre-display Native15 values plus
  Rayleigh, aerosol, and scattering-order contributions;
- render the solar-noon control after each isolated radial or model change,
  preserving every image regardless of its gate result;
- refine local solar zenith around the terminator and low elevations;
- independently refine outgoing direction and construction quadrature; and
- return from comparison W39 to production W27 unless evidence justifies a
  different decision.

Gate P6 freezes the first qualified altitude, zenith, incoming, and outgoing
domains only after held-out physical error and scene-cache bytes are recorded.
It may not accept the current gray near-ground band as plausible haze. The
band must either be materially corrected by the selected resolution/model
change or be causally isolated to a named non-cache owner with a concrete
correction step that is completed before P7 begins.

## Phase P7 — Camera And Scene-Object Coverage

Status: complete in accepted immutable run
`000570-point-local-scene-cache-p7-closure`. It consumes the sealed P1
full-rotation closure, P6 endpoint-class qualification, P7 object renders, and
six-scene sequence. It additionally proves Native15 opaque-black, lit, and
emissive endpoint composition, moving-object cache reuse, the P0 no-translation
boundary, and explicit out-of-support failure. Object-cast volumetric shadows
remain outside scope.

Deliverables:

- exercise complete camera rotation;
- exercise every P0-declared camera translation bound;
- exercise ground-, atmosphere-, and object-shortened rays;
- verify `L_atmosphere + T_view * L_surface` endpoint composition;
- verify moving objects do not rebuild or invalidate the cache; and
- report queries outside declared scene support.

Object-cast volumetric shadows remain explicitly outside this gate.

## Phase P8 — Independent Physical And Spectral Qualification

Status: complete and accepted by superseding owner-decision run `000569`.

Deliverables:

- build the physically matched 40-wavelength B1 candidate through the actual
  point-local cache consumer and selected live view integration;
- preserve the exact B1 measurement boundary, 17 times, 81 directions, 31
  scored 360--712.5 nm values, units, preprocessing, and aggregate equation;
- require aggregate spectral RMSE no greater than the accepted current
  Algorithm32 F68 score `11.820391604126252 mW m^-2 sr^-1 nm^-1`; this is the
  hard promotion non-regression gate selected by the owner;
- report the candidate beside all 17 accepted F68 per-time scores even though
  the aggregate, rather than each individual time, is the selected hard gate;
- compare all 40 values and their conservative Native15 reduction;
- build sparse over-resolved actual-point GPU oracles;
- separate J1, J2, J3, and J4 diagnostics;
- test source scaling, ozone, aerosols, symmetry, rotation, and exact-zero
  invariants; and
- cover solar noon, sunset, civil, nautical, astronomical, antisolar,
  near-ground, terminator, and weak-blue states.

Gate P8 applies thresholds frozen before candidate output is inspected. The
B1 gate scores physical spectral radiance before Color, exposure, gamma, or
other display transforms; image-space similarity is separate evidence.

### Immediate follow-up — B1 point-local non-regression

Status: executed; numerical gate accepted after exact-ground binary32 boundary
correction, with diagnostic and figure evidence preserved.

1. Freeze run `000479`'s reflection-completed F68 candidate table and
   `11.820391604126252 mW m^-2 sr^-1 nm^-1` aggregate as the baseline.
2. Adapt the B1 paper-profile inputs, 17 Sun states, 81 directions, Direct40
   wavelengths, N4, F68, and W27 to the contained point-local compiler.
3. Stream one wavelength layer at a time through packed scene rows, the real
   point-local lookup, Geometry atmosphere endpoints, and Q30 view integration;
   do not persist seventeen complete 40-channel caches.
4. Preserve the complete 1,377-row by 40-channel candidate table, exact input
   and implementation identities, sparse cache probes, and all per-time scores.
5. Score with the unchanged B1 measurement boundary and equation. Accept the
   promotion gate only when aggregate RMSE is no greater than
   `11.820391604126252`; preserve failed output without weakening the gate.

The Direct40 result owns the primary non-regression decision. Conservative
Native15 reduction remains a separately reported follow-up and cannot replace
or relax the Direct40 gate.

Rejected run `000535-point-local-scene-cache-b1-non-regression` first exposed
a contained compiler defect: direct J1 used local `+Z` as the source phase
direction for every solar-zenith row. Its `33.395280492741584` aggregate is
diagnostic only. The corrected compiler uses
`(sin(solarZenith), 0, cos(solarZenith))` in the local source-relative frame.

Rejected run `000536-point-local-scene-cache-b1-non-regression` executes the
corrected complete Direct40/W27/F68/N4/Q30 observable. Its aggregate RMSE is
`14.699769088419915 mW m^-2 sr^-1 nm^-1`, exceeding the frozen ceiling by
`2.879377484293663`. All 17
per-time scores, the 1,377-by-40 table, packed-ledger identities, sparse cache
probes, and GPU facts are preserved. Accepted derivative run
`000538-point-local-scene-cache-b1-figures` preserves the complete six-figure
B1 set from that sealed table.

Accepted diagnostic runs `000539`, `000543`, and `000544` isolate two coupled
binary32 ground-boundary errors. Exact `0 m` J1 rows were zero for an
above-horizon Sun because a representative point rounded slightly inside the
ground sphere and the raw positive-root test treated the far root as an
occluder. After source visibility was made boundary-aware, J1 aggregate RMSE
improved from `27.722843611108893` to `24.90946661314442`, but J4 spiked to
`26.676770746633608`: inward transport still used a narrower `0.25 m`
boundary tolerance and could select a through-Earth branch after nonzero
ground rows reached later orders. Applying the same `1 m` binary32-safe
ground policy to inward transport removes that spike.

Accepted run `000545-point-local-scene-cache-b1-non-regression` executes the
complete corrected Direct40/W27/F68/N4/Q30 boundary and scores
`11.554012538468113`, which is `0.26637906565813907` below the frozen current-
Algorithm32 ceiling. The hard aggregate non-regression gate is therefore
closed successfully. Accepted derivative run `000546` preserves all six B1
figures from the sealed accepted table. Accepted derivative run `000547`
preserves the canonical full-model `b1-per-time-rmse.svg`, using the complete
published-model comparison set and the accepted point-local result as the
selected Algorithm32 series. Subsequent Native15 and grid-sensitivity work is
closed by the terminal owner decision below; the B1 aggregate remains the
selected external accuracy gate.

### Immediate diagnostic ladder — B1 regression attribution

Status: completed for regression attribution. Run `000536` remains the
immutable rejected control and its threshold was not changed.

1. Validate the complete B1 observation mapping: all 81 directions, fitted
   solar azimuths, local/world transforms, and forward-scattering cell
   placement. Begin with the worst run-`000536` residual at `11:00`, grid
   `(3, 6)`, `477.5 nm`.
2. Preserve separately scored cumulative order boundaries `J1`, `J1+J2`,
   `J1+J2+J3`, and `J1+J2+J3+J4`, including all 17 per-time scores and
   residual domes, to identify the first order that introduces the regression.
3. Repeat the order attribution with canonical black and B1 grass ground and
   compare sparse ground-hit branch values with the established Algorithm32
   ground calculation.
4. Consume the same candidate cache with Q30, uniform 40, and an over-resolved
   view-path reference so camera quadrature is separated from cache
   construction and reconstruction.
5. At the worst residuals compare exact actual-point values, full rectangular
   field values, packed-row reads, altitude interpolation, solar-zenith
   interpolation, and W27 outgoing interpolation. Attribute error to field
   construction or a named reconstruction axis.
6. Compare sparse `J1`, `L1`, `J2`, `L2`, `J3`, `L3`, and `J4` values with the
   current Algorithm32 implementation at physically matched states, including
   observer-column states where both representations must agree.
7. Preserve every diagnostic output regardless of outcome, update the owning
   design/status documents, and select the next numerical change only after a
   specific error boundary has been demonstrated.

Run `000539` closes mapping to `3.3306690738754696e-16` maximum cosine error,
rules down grass-versus-black ground and Q30-versus-uniform/over-resolved view
quadrature, and exposes zero exact-ground J1 taps carrying about `98%` of the
first focused altitude stencil. Run `000543` executes the read-only current
Algorithm32 B1 boundary at cumulative J1 through J4: its aggregate sequence is
`24.381786328373472`, `14.094434631631465`, `12.187366290386846`, and
`11.820391604126252`, versus the pre-correction point-local sequence
`27.722843611108893`, `16.39425033793466`, `14.169369167591903`, and
`14.699769088419915`. This locates the first discrepancy at J1 rather than a
later-order-only recurrence error. Run `000544` proves the source-visibility
half of the boundary correction and exposes the remaining inward-transport
half through its isolated J4 spike. Run `000545` proves the complete boundary
correction at the frozen observable and passes the unchanged gate.

Exact internal production `L1/L2/L3` scalar parity at matched observer-column
states remains part of P8's broader sparse-oracle qualification. It is not an
open attribution blocker: the cache-node taps, cumulative order boundaries,
single-variable boundary controls, black-ground control, quadrature controls,
and accepted full B1 rerun already demonstrate the causal error boundary.

### Immediate follow-up — actual Native15 B1 retention

Status: complete; matched Native15 non-regression is accepted by sealed run
`000558`.

1. Freeze the canonical fifteen equal-width bins spanning `360` through
   `830 nm`, with centers from `375.6666666666667` through
   `814.3333333333333 nm`.
2. Reduce the Direct40 physical source irradiance, Rayleigh coefficient, Mie
   extinction, and grass albedo inputs independently by equal-weight mean over
   the canonical B1 membership
   `nativeIndex(k) = min(14, floor(3 * k / 8))`.
3. Execute the actual point-local W27/F68/N4/Q30 cache path at those fifteen
   bin-average inputs; do not reduce the completed Direct40 radiance table.
4. Reconstruct the unchanged forty-coordinate B1 boundary by canonical
   piecewise-constant hold using the same membership, then score the original
   17 times, 81 directions, and 31 scored wavelengths without modifying the
   measurements or equation.
5. Preserve the 1,377-by-15 Native15 table, reconstructed 1,377-by-40 table,
   all per-time scores, Direct40-versus-Native15 representation error, GPU
   facts, and canonical full-model figures regardless of outcome.

The original `11.820391604126252 mW m^-2 sr^-1 nm^-1` ceiling belongs to the
previous model's Direct40 execution. It remains the Direct40 decision boundary
but is not a fair Native15 ceiling. Matched Native15 non-regression instead
compares both models after the identical physical-input reduction and
piecewise-constant reconstruction.

Rejected run `000549-point-local-scene-cache-b1-native15-retention` executes
the actual GPU recurrence at the fifteen bin-average physical inputs and
scores `12.293121003109862`. That is `0.4727293989836099` above the frozen
ceiling and `0.739108464641749` worse than the accepted Direct40 parent. The
Native15 reconstruction differs from Direct40 by
`3.8546085068418026 mW m^-2 sr^-1 nm^-1` RMSE over the 31 scored channels;
its largest absolute difference is `25.499218525345647` at `395.25 nm` in
the `09:30`, `(4,7)` sample. This rejects equal-weight averaging of every
physical input followed by piecewise-constant reconstruction as the selected
Native15 realization under the unmatched Direct40 ceiling. It does not reject
that realization under a fair model comparison.

Accepted derivative run `000551-point-local-scene-cache-b1-native15-figures`
preserves all six standard B1 figures plus the canonical full-model per-time
comparison despite the parent rejection. Failed operational browser-launch
and figure-launch predecessors `000548` and `000550` remain preserved.

Accepted run `000558-previous-model-b1-native15-comparison` supplies the
missing matched control. The previous model scores `12.586323005727962` under
the identical Native15 physical inputs and reconstruction, versus
`12.293121003109862` for the point-local cache. The point-local cache is
therefore `0.29320200261810037` better under Native15, as well as
`0.26637906565813907` better under Direct40. Native15 adds
`0.7659314016017102` error to the previous model and `0.739108464641749` to
the point-local model; the new model's reduction penalty is
`0.026822936959961297` smaller. The contained production snapshot reproduces
the sealed previous Direct40 score within `4.350769025052159e-7`, and all
duplicated slots within each Native15 bin are exactly equal. The matched
Native15 gate is accepted.

Run `000556` owns the complete 34-build GPU payload reused by run `000558`;
it failed only while reading GPU identity after intentional context disposal.
Runs `000552` through `000555` and `000557` preserve the contained setup and
post-processing predecessors. Accepted derivative run `000559` preserves 13
unconditional fair-comparison figures.

### Terminal P8 grid-sensitivity decision

Runs `000561` through `000565` test coordinate-node sensitivity beyond the
external B1 observable. Run `000561` compares the current field with a complete
midpoint-shifted execution of the same solver, and run `000562` attributes the
largest differences to altitude and solar-zenith coordinates rather than W27.
Run `000563` makes an experimental refined grid substantially less sensitive
to the same perturbation. These are solver-versus-solver diagnostics, not
comparisons with measured data or an independently converged physical oracle.

The unchanged Kider B1 measurement remains the stronger external accuracy
boundary. Rejected run `000564` scores the experimental refined grid at
`18.47808688506421`, versus the frozen `11.820391604126252` ceiling, and run
`000567` preserves all six figures regardless of that failure. The refined
grid is therefore rejected.

Run `000568` preserved an initial interpretation that treated the shifted-grid
threshold as a promotion gate. Superseding accepted run
`000569-point-local-scene-cache-p8-owner-decision` retains that immutable
evidence but reclassifies it as non-blocking diagnostic information. The
selected P8 candidate remains Native48/Z180/W27/F68/N4/Q30, backed by Direct40
B1 `11.554012538468113` and matched Native15 B1 `12.293121003109862` versus
the previous model's `12.586323005727962`. Grid-convergence work reopens only
for a specific visible twilight defect, a successively over-resolved reference,
or external twilight spectral measurements.

## Phase P9 — Physical Resources And Lifecycle

Status: complete in accepted immutable runs
`000572-point-local-scene-cache-p9-w27-asset` and
`000577-point-local-scene-cache-p9-resources-lifecycle`. Failed operational
predecessors `000571`, `000573`, `000574`, and `000575` remain preserved.

Run `000572` constructs the complete selected San Jose nautical Native15 W27
asset on the RTX 2060 in `22.8 s`. Its `617 x 4,374 x 15` payload is exactly
`161,925,480 bytes`; ledger plus manifest bring the complete asset to
`161,957,892 bytes`.

Run `000577` loads, uploads, publishes, fails, replaces, supersedes,
context-restores, and disposes that asset on the same named D3D11 WebGL2 GPU.
Exact cache texel residency is `161,925,480 bytes` steady and
`323,850,960 bytes` during atomic replacement; retaining the loaded payload
during replacement makes the accounted peak `485,776,440 bytes`. Host-clock
measurements record `832 ms` load, `117/59 ms` first/replacement upload,
`140 ms` restore upload, and `64 ms` for twelve 640-by-400 single-cache-lookup
kernels. WebGL exposes successful allocation and the exact committed texel
lower bound, but not opaque driver overhead. Consequently the named RTX 2060
configuration is supported by this evidence; no general hardware or opaque
driver-memory ceiling is selected.

Deliverables:

- measure complete asset, packed payload, ledger, staging, steady resident,
  transition, and driver bytes;
- measure construction, load, upload, publication, and frame costs;
- prove atomic scene-cache replacement and failure preservation;
- prove context restoration, supersession, and disposal; and
- select supported-hardware resource limits from observed evidence.

No compression credit participates in P9's uncompressed baseline.

## Phase P10 — Compression And Owner Decision

Status: complete for the first selected exact codec in accepted immutable run
`000579-point-local-scene-cache-p10-seam-dedup`. Failed shader-typing
predecessor `000578` remains preserved.

Study one codec at a time against the accepted uncompressed cache. Candidate
families include reduced precision, key-zenith residuals, shared spectral
bases, dictionaries, source-spectrum factoring, and seam deduplication.

The owner then decides whether to:

- promote the uncompressed or qualified compressed design;
- revise a failed resolution or packing choice;
- retain the implementation as contained research; or
- stop the production path.

Production changes require separate explicit authorization.

Run `000579` selects exact cubed-sphere seam deduplication for future
production consideration while retaining the uncompressed asset as the
correctness oracle and deferring lossy codecs. W27's `4,374` logical slots
contain `4,058` unique physical directions. A `Uint16` logical-to-unique map
plus the unique R32F payload costs `150,235,908 bytes`, saving
`11,689,572 bytes` or `7.219105973933194%`. Exhaustive decode compares all
`40,481,370` stored scalars with zero mismatches; 63 GPU probes are exact.
On the named RTX 2060, twelve matched lookup-kernel frames take `51 ms`
uncompressed and `55 ms` through the index. That single-run timing is reported
as observed evidence, not a general performance bound. Reduced precision,
bases, dictionaries, and residual codecs receive no memory credit.

## Historical Evidence Ledger

| Evidence | Current use |
| --- | --- |
| Run `000497` | Strong causal evidence that actual-point solar-zenith state repairs the focused nautical J1 deficit. |
| Run `000498` | Geometry and logical-byte evidence for scene-specific altitude/zenith culling. |
| Run `000500` | Proxy redundancy screen only; no codec selected. |
| Runs `000502`, `000506`, `000508` | Reusable contained domains, actual-point geometry, and complete transient N4 solver evidence. |
| Runs `000509` and `000511` | Historical observer-projected page compilation/runtime evidence; not the successor stored contract. |
| Run `000513` | Shows the projected solar-noon page is highly sensitive to missing near-ground support. |
| Run `000515` | Shows validity masking repairs only part of the rejected projected-page defect. |
| Run `000516` | Freezes the point-local C4 contract, first San Jose support envelope, two independent scene-cache identities, schemas, and explicit out-of-support failure. |
| Run `000517` | Proves deterministic packed-row inventory and complete altitude/zenith stencil closure for solar noon and nautical twilight, with exact W39/W27 logical-byte counts. |
| Run `000519` | Accepts the one-wavelength selected-row GPU accumulator; run `000518` is its sandbox-denied predecessor. |
| Run `000520` | Accepts the complete independently loadable Native15 W39 solar-noon and nautical point-local scene caches. |
| Run `000522` | Accepts complete-cache binding and manufactured exact/off-grid point-local runtime lookup; run `000521` preserves the exact-node tolerance predecessor. |
| Run `000524` | Accepts the operational solar-noon and nautical first-look renders and preserves both PNGs unconditionally; run `000523` preserves the post-render comparison stall. |
| Run `000525` | Accepts the isolated fixed-count quadratic 48-node solar-noon radial-control cache. |
| Run `000526` | Preserves six unconditional radial/display images and complete focused Native15 path traces; rules down the tested radial redistribution and display compression as primary causes of the gray band. |
| Run `000527` | Separates J1--J4 and final-event Rayleigh/Mie contributions at three focused pixels; closes component reconstruction below `8.20e-8` relative error and identifies elevated aerosol and higher-order participation in the gray band. |
| Run `000528` | Rebuilds and renders complete `0x/0.25x/0.5x/1x` aerosol caches; proves aerosol controls brightness and hue but the pale band survives without it, where J1 dominates. |
| Run `000529` | Reuses the canonical cache and isolates view-path quadrature; same-count quadratic spacing corrects the gray band and 30/60 interval results converge closely. |
| Run `000539` | Preserves the pre-correction B1 mapping, cumulative-order, ground, quadrature, and sparse reconstruction ladder; exact-ground above-horizon J1 taps are zero. |
| Run `000543` | Preserves read-only current Algorithm32 F68 cumulative J1-through-J4 B1 references and locates the point-local discrepancy at J1. |
| Run `000544` | Preserves the source-visibility boundary correction: J1--J3 improve materially, while the isolated J4 spike exposes the remaining narrower inward-transport boundary rule. |
| Run `000545` | Accepts the complete corrected Direct40/W27/F68/N4/Q30 B1 gate at `11.554012538468113`, below the unchanged `11.820391604126252` ceiling. |
| Run `000546` | Preserves all six B1 figures from accepted run `000545`. |
| Run `000547` | Preserves the canonical full-model B1 per-time RMSE comparison with the complete published-model set and accepted point-local candidate. |
| Run `000549` | Rejects the actual equal-bin Native15 realization at `12.293121003109862`, `0.4727293989836099` above the frozen gate; failed launch predecessor `000548` is preserved. |
| Run `000551` | Preserves the rejected Native15 result's six standard B1 figures plus canonical full-model comparison; failed launch predecessor `000550` is preserved. |
| Run `000558` | Accepts matched Native15 non-regression: previous `12.586323005727962`, point-local `12.293121003109862`, improvement `0.29320200261810037`; it derives the complete GPU payload from failed-metadata source run `000556`. |
| Run `000559` | Preserves 13 fair-comparison figures for both models and both spectral representations. |
| Run `000570` | Closes the P0 fixed-observer P7 camera, endpoint, composition, moving-object, and support-failure contract. |
| Run `000572` | Builds the complete selected 617-block Native15 W27 nautical asset and records its exact payload and construction timing. |
| Run `000577` | Accepts the superseding named-RTX-2060 uncompressed resource, timing, publication, failure, replacement, supersession, restoration, and disposal proof. |
| Run `000579` | Qualifies exact W27 seam deduplication with zero scalar mismatches and records the contained P10 disposition. |

## Status Ledger

| Phase | Status | Current result |
| --- | --- | --- |
| Historical actual-point solver and projected-page POC | complete diagnostic evidence | Actual-point recurrence is available; observer-projected storage is rejected as the final design. |
| P0 contract and scene support | complete | Run `000516` accepts the successor lane and first support contract. |
| P1 inventory and culling ledger | complete | Run `000517` accepts independent 618-block solar-noon and 617-block nautical ledgers with full stencil closure. |
| P2 selected-row accumulator | complete | Run `000519` accepts direct packed local-row accumulation at 595 nm. |
| P3 Native15 compiler | complete | Run `000520` accepts both complete uncompressed W39 scene caches. |
| P4 runtime lookup | complete | Run `000522` accepts zenith-aware packed lookup and unchanged Geometry-length sampling. |
| P5 plausibility renders | complete | Run `000524` preserves and operationally accepts solar-noon and nautical first looks. |
| P6 resolution | complete | Run `000530` qualifies Q30 across both retained scenes and Geometry endpoint classes against uniform-960 sparse integration. |
| P7 camera/object coverage | complete | Run `000570` closes full rotation, the P0 fixed observer, endpoint classes and composition, moving-object reuse, and explicit support failure using sealed runs `000517`, `000530`, `000531`, and `000533`. |
| P8 qualification | complete and accepted | Run `000569` selects the current Native48/Z180/W27 grid under the external B1 boundary. Shifted-grid runs are non-blocking diagnostics; the refined candidate remains B1-rejected. |
| P9 resources/lifecycle | complete | Runs `000572` and `000577` build the complete W27 asset and accept named-RTX-2060 allocation, timing, publication, failure preservation, atomic replacement, supersession, restoration, and disposal. |
| P10 compression/decision | complete contained decision | Run `000579` qualifies exact seam deduplication at `7.2191%` savings with zero scalar mismatches, retains the uncompressed oracle, and defers lossy codecs. Production remains unchanged. |

## Done Condition

This plan is complete only when one point-local scene cache has been compiled,
consumed by the unchanged Geometry-length/Algorithm32-sampling structure,
qualified across the declared scene support including object-shortened rays,
measured on named hardware, and presented to the owner with an uncompressed
resource ledger and any separately qualified codec results.

This condition is met by runs `000570`, `000572`, `000577`, and `000579` in
combination with the accepted P0--P8 evidence. Any production port or broader
hardware-support promise is separate work requiring explicit authorization.
