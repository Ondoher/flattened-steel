# Algorithm32 Star Parity Data Set

Status: frozen project-lifetime conformance-data contract with one completed,
verified, read-only artifact. The sealed Star gold remains valid and unchanged.
The retained Stage 8 production report is historical passing evidence; a fresh
production comparison is required before the current tree can be called
Star-validated. The purpose, capture matrix, complete numerical
inputs, reduced domains, diagnostic queries, comparison policies, canonical
scalar layout, and retention policy are selected below. Star collection,
binary assembly, semantic validation, reading, verification, scoped production
domain selection, offline Stage 8 comparison, and dedicated bounded
Karma/WebGL projection are implemented. Flat-geometry, local-Sun, and
flat/local direct-reference production comparators are also implemented for
the Star outputs that exist. The production flat/local cache remains
compositionally validated because Star has no integrated flat/local cache.

The standalone capture, semantic-verification, and historical comparison
tooling was archived with the closed Star experiment on 2026-07-29. Its
current locator is the
[Algorithm32-Star evidence archive](../../../../evidence/algorithm32-star/README.md).
The retained live island contains only the authenticated local-Sun CPU closure,
the bounded ground-parity browser support closure, and their ESM boundary. A
new capture or repin requires a new isolated lane; the archived tree is not
reopened.

This document is the canonical owner for the Algorithm32-star parity data set:
what it proves, how it is generated, what it contains, how its bulk data is
organized, and how an offline consumer reads and compares it. The
[architecture boundaries](architecture-boundaries.md#algorithm-source-promotion-and-conformance)
own the general source-promotion rules; this document applies them to this
project's shared conformance artifact.

## Decision

Build one independent Algorithm32-star gold data set covering implemented Star
behavior relevant to the two supported geometry/source pairings:

- spherical geometry with the distant Sun; and
- flat geometry with the finite-distance local Sun.

Coverage follows the Star implementation boundary. Spherical/distant has a
complete Star N4 cache builder, so its gold contains complete reduced pure
fields. Flat/local has Star geometry, source, and direct/reference primitives
but no integrated N-order cache, so its gold contains only those implemented
primitive and direct outputs. Do not implement or fabricate a second Star
cache to create a parity target for behavior Star never produced.

The retained data uses a reduced conformance profile so complete pure fields
can be compared without paying the time and storage cost of every
production-resolution capture. All bulk numeric values from all cases are
assembled into one little-endian binary64 payload. A metadata-only JSON
manifest makes that payload self-describing. Both files ultimately live with the project's
other evidence in one external ZIP archive.

The bulk payload and manifest are project-lifetime evidence:

- they are not committed to Git;
- they are not production assets or runtime dependencies;
- they are not ordinary unit-test correctness fixtures;
- they are generated only by a Star-only collector;
- production comparison reads them without modifying them; and
- production outputs and comparison results go into separate reports.

The working artifact names are:

```text
algorithm32-star-parity/
  manifest.json
  fields.f64le
```

The data directory is staged under the ignored `archives/` tree. Temporary
per-case fragments may be used while collecting, but the retained bulk
numeric data is consolidated into the single `fields.f64le` file.

## Completed Artifact

The current project-lifetime artifact was captured at
`2026-07-23T03:01:31.301Z` and is sealed under the ignored
`archives/algorithm32-star-parity` directory. It is not committed. Both files
are read-only and independently pass the generic container verifier and the
frozen semantic-manifest validator.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `manifest.json` | 2,406,966 | `59d6b1419368869f5dc19f238fbbd8051c11dbb2576540aad029c62eff569b7e` |
| `fields.f64le` | 8,092,640 | `efa133071cf130778622bf699966437dd81cd5d357261fa1d4a4208a079d18e1` |

The sealed verifier passes all 205 authenticated sections across six cases and
30 domains. The completed manifest also contains 14 verified frozen key-source
pins and hashes for all 75 transitive Star/capture sources executed by the
collector. Whole-payload and every section hash verify. Both full spherical
records contain their expected 79
scientific sections and four exact cumulative derivations. The explicit-zero
record contains all seven pure fields, and all seven pure-field plus four
cumulative omitted-versus-zero checks are exact. The five flat/local reference
rays were also checked exactly against all 300 accepted spectral scalars from
run `000004-direct-local-sun-selected-rays` before the spherical builds ran.

The former independent verifier and capture commands are retired with the
archived runnable tree. The completed artifact identities above remain the
project record; any future recapture requires a new isolated lane and a
deliberate repin.

## Completed Stage 8 Comparisons

The retained Stage 8.1 production comparison report is historical evidence
for the production sources and configuration paths it recorded:

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `archives/algorithm32-star-parity-comparison/report-final.json` | 628,835 | `06f64d900004feebaecce2b2ccafc9d7d84366283f91a95b180e40a078c2651e` |

It passes all `3/3` declared spherical cases, 21 pure-field and nine
cumulative comparisons, and all `1,710,720` of `1,710,720` scalar
comparisons. Eleven exact comparisons cover 32,040 exact scalars, and all 12
cumulative hashes match. The report records zero numerical, exact, hash,
structural, gold, and coverage failures.

The sealed manifest, payload, Star inputs, and hashes above have not changed
and do not require recapture. Production source hashes and configuration paths
have changed since this report was written, including restoration of the
15-interval production default and relocation of the explicit frozen
40-interval comparison controls. Under the
[source-conformance rules](architecture-boundaries.md#required-independent-output-evidence),
`report-final.json` therefore cannot be claimed as current evidence for the
production tree. Regenerate the production comparison report against the
existing sealed gold before renewing the Stage 8 Star-validated, accepted, or
CPU-oracle claims. Preserve the report path and hash above as historical
evidence.

Git revision and dirty-state inspection could not be captured because process
spawning returned `EPERM`. The report records the user-confirmed intentional
working-tree state and production source hashes instead; it does not represent
the unavailable Git inspection as successful.

Stage 8.2 reuses the authenticated gold through a bounded Node-to-browser
projection. The browser receives only the selected sections and probes, never
the archive. The
[baseline import status](baseline-import-status.md#focused-stage-8-ground-browser-reproduction)
owns the exact dedicated command, environment, cases, scalar totals,
comparisons, bounded-projection checks, and passing result. Controller
invalidation remains separate observable Node lifecycle evidence.

## Completed Flat/Local Star Comparisons

The current production comparators pass every flat/local output for which Star
has an independent producer:

| Report | Bytes | SHA-256 | Coverage |
| --- | ---: | --- | --- |
| `archives/algorithm32-star-flat-geometry-primitive-comparison/report.json` | 24,531 | `b7f4e1768e3d9be57e7e038db225e8146aa8d2044f687247f888a43ec39e241e` | 11/11 records, 156 numeric scalars, 47 exact leaves |
| `archives/algorithm32-star-local-sun-primitive-comparison/report.json` | 27,897 | `b1bde24c0314947e1f4a2164e99535cf1921d1d91f568bdd5a0ae1369f6caf53` | 18/18 records, 612 numeric scalars, 283 exact leaves |
| `archives/algorithm32-star-flat-local-reference-output-comparison/report.json` | 40,795 | `7c69ef10b883fb095b5dfa430c2ee9fe6c937272e8cb022ab7b3f5f1348bc998` | 5/5 rays, 20/20 spectral sections, 300 spectral scalars, 465 numeric path leaves, 15 exact path leaves |

All three reports contain zero failures, coverage gaps, or maximum numerical
error. The synthetic direct-reference comparator lane passes `3/3`.

The first report establishes only `FlatAtmosphereGeometry` coordinate, view,
and reusable-path outputs. The second establishes only `LocalPointSun`
source-relative, direct-light, falloff, clamp, and source-path outputs. The
third establishes the five direct-only Star reference rays. None is a
flat/local cache, recurrence, GPU, or later-order parity report.

## Claim Boundary

The data set supports this claim:

> The production numerical owners match the pinned Algorithm32-star
> algorithms for every declared behavior and output that Star implements.

It does not establish:

- scientific or physical correctness;
- equality of complete Native-48/W27 production fields;
- production-resolution reconstruction accuracy;
- supported-hardware performance or memory budgets;
- release readiness; or
- the correctness of a test-generated expectation.

Scientific confidence remains owned by published comparisons, external
benchmarks, and registered official experiments. Native-48/W27 mapping,
interpolation, addressing, seam, and WebGL behavior remain covered by their
production-domain checks. This data set supplies the independent
Star-to-production algorithm-fidelity layer between those two bodies of
evidence.

The reduced profile executes the same production numerical owners used by the
production configuration. A separately rewritten small implementation would
only validate itself. The shared construction-domain selection seam leaves the
production default unchanged at Native48/Fibonacci-34/W27 and permits
Native16/W9 plus Native4/W3 only for direct plan or CPU diagnostic execution.
The frozen spherical corpus also uses an explicit comparison-only
40-interval construction control so a comparator reproduces the captured Star
inputs exactly; ordinary production omission selects 15. Neither the reduced
domains nor the 40-interval comparison control enters controller/runtime
publication or final-view stencils. This reduced full-field requirement
applies to spherical/distant only.

## Capture Matrix

The selected data set contains two full N4 captures, one inexpensive
explicit-zero N4 micro profile, and a small flat/local primitive-output corpus:

| Record id | Star output boundary | Expensive cache build | Current readiness |
| --- | --- | --- | --- |
| `spherical-distant-omitted` | complete Native16/W9 N4 pure/cumulative cache with omitted canonical-black ground | one N4 build | captured, authenticated, and verified |
| `spherical-distant-reflective` | complete Native16/W9 N4 pure/cumulative cache with the selected nonzero diagnostic Lambertian ground | one N4 build | captured, authenticated, and verified |
| `spherical-distant-explicit-zero` | complete Native4/W3 N4 pure/cumulative micro profile with explicit zero Lambertian ground, checked against a matching omitted micro build | two small N4 builds | both branches executed; all pure and cumulative checks are exact |
| `flat-geometry-primitives` | selected plane bounds, atmosphere coordinates, view/reusable segments, and path samples from `FlatAtmosphereGeometry` | none | captured, authenticated, and decoded |
| `local-sun-primitives` | selected source-relative positions, direct-light samples, falloff, and source-path limits from `LocalPointSun` | none | captured, authenticated, and decoded |
| `flat-local-reference-outputs` | the five direct-only spectra/rays already defined by `local-sun-basic-v1`, with exact quantity/order semantics | none | captured and exactly matched to accepted run `000004`; no cache fields are implied |

Each spherical row is one full N4 build. A single spherical N4 result supplies
the numerical gold for N1, N2, and N4 because those requests use exact
prefixes of the same pure recurrence:

- N1 uses `J1` and `Jthrough1`;
- N2 uses `J1`, `L1`, `J2`, and `Jthrough2`; and
- N4 uses `J1` through `J4` and `L1` through `L3`.

Separate production executions still verify requested-order planning,
publication, allocation, and lifecycle behavior. They do not require
additional Star full-field captures. Flat/local cache composition, recurrence
reuse, lifecycle, and CPU/GPU agreement are production evidence; they are not
misreported as full-cache Star parity.

### Explicit-zero boundary

The two full captures cover omitted and nonzero reflective ground. Explicit
zero is covered separately by the selected Native4/W3 micro profile. It uses
the same native-15 basis, Figure 1 scene, Fibonacci-34 incoming quadrature,
the frozen comparison-only 40 construction-transport intervals, 20
source-transmittance intervals, and N4 recurrence as the full cases, while
reducing only the position domain to
four native-style nodes and the outgoing domain to W3 (`6 * 3^2 = 54`).
Its exact Native4 altitudes are `[2, 22500, 37500, 52500]` meters. Its
explicit boundary contains fifteen zero reflectances aligned to the native-15
wavelengths; all other case inputs are identical to the full spherical cases.

The collector runs the micro profile twice: once with omitted ground and once
with an explicit fifteen-channel all-zero Lambertian boundary. It retains the
complete explicit-zero `J1` through `J4` and `L1` through `L3` fields, records
the matching omitted hashes, and requires exact canonical-byte equality for
every pure and cumulative field. The boundary/cache descriptors remain
distinct and are compared separately as identities. If a run reveals only a
`+0` versus `-0` encoding difference, the collector may canonicalize all
numerical zeros to positive zero under an explicit manifest policy before the
byte comparison. Any nonzero mismatch is a failure and does not authorize a
weaker rule.

This is direct branch execution at every affected order and output kind, not
an alias from the omitted full capture. Its retained pure fields occupy only
`152,640` bytes, about `0.146 MiB`; the matching omitted micro build may be
discarded after its canonical hashes and equality result are sealed.

## Reduced Conformance Profile

The spherical/distant full-field profile retains the frozen Star capture
controls that exercise the recurrence while reducing the two largest cache
axes:

| Concern | Conformance setting | Relationship to spherical/distant production |
| --- | --- | --- |
| Spectral basis | native-15, all channels | unchanged |
| Scene | `figure1-10h15-z41` | existing Star Figure 1 scene and GPU-conformance scene |
| Position domain | Native-16 | same native generator and containing-bin construction lookup as Native-48 |
| Incoming radiance | source-local Fibonacci-34 and its weights | unchanged |
| Outgoing density | source-aligned W9 cubed sphere, 486 stored directions | same topology and lookup family as W27, at one ninth the stored directions |
| Construction transport | 40 uniform physical-distance intervals | frozen Star comparison input; production defaults to 15 |
| Source transmittance | 20 intervals | unchanged |
| Maximum order | N4 | unchanged |
| Star numeric precision | binary64 | unchanged |

All actual inputs—not merely labels—must be embedded or content-addressed in
the manifest. This includes spectral wavelengths and bin semantics,
atmosphere/profile values, source state, geometry, ground BRDF inputs, position
nodes, direction vectors and weights, lookup policies, transport controls,
orders, and precision.

### Frozen spherical inputs

The spherical scene is `sceneById('figure1-10h15-z41')` from
`scripts/algorithm32-star/src/production-dome/figure1-scenes.js`. Its selected
source direction is:

```text
[0.6469772316140625, 0.10878378230678928, 0.754709580222772]
```

Both full cases use the canonical native-15 atmosphere, spectral channels,
source irradiance, spherical radii, 2 m observer/cache boundary, and distant
source created by the Star production-reference collaborators. The exact
controls passed to the Star calculation are:

```json
{
  "pathIntervalCount": 40,
  "sourceTransmittanceIntervalCount": 20,
  "incidentDirectionCount": 34,
  "incidentAltitudeBinCount": 16
}
```

The N-order builder receives `maximumScatteringOrder: 4`,
`transportPathIntervalCount: 40`, and a `CubedSphereDirectionDomain` with
`faceWidth: 9` and `createSourceAlignedCubedSphereBasis(directionToLight)`.
The omitted and reflective full captures differ only in their ground-boundary
input and resulting identities.

These 40-interval values identify the sealed gold and its direct parity
execution. They are not current production defaults. Production comparisons
must request the matching comparison-only control explicitly from
`src/algorithm32/light-sources/fixtures/star-parity-consts.js`; a production build or
final-view traversal that omits a control uses 15. Runtime light-source
constants do not expose this control, and rebuilt `dist/flat32` output contains
neither Star-parity identifiers nor a 40-interval transport literal.

Native-16 is selected instead of P12. Its altitude nodes in meters are:

```text
[2, 5625, 9375, 13125, 16875, 20625, 24375, 28125,
 31875, 35625, 39375, 43125, 46875, 50625, 54375, 58125]
```

They map exactly to Native-48 indices:

```text
[0, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46]
```

This retains the native node formula and construction lookup family while
reducing position-proportional work by three. It does not make higher-order
Native16 results equal to Native48 results; it defines the reduced
implementation-conformance domain.

### Diagnostic reflective ground

The reflective case uses an artificial, parity-only native-15 ramp with id
`algorithm32-parity-diagnostic-ramp-native15-v1`. In native wavelength order,
its hemispherical-reflectance values are:

```text
[0.0625, 0.125, 0.1875, 0.25, 0.3125,
 0.375, 0.4375, 0.5, 0.5625, 0.625,
 0.6875, 0.75, 0.8125, 0.875, 0.9375]
```

These exact binary fractions give every wavelength a nonzero, distinct value,
exercise a fifteen-to-one scale range, and avoid importing a point-sampled
paper-comparison grass spectrum into the native bin-average profile. The Star
boundary receives the exact native wavelength centers and these values as its
aligned interpolation table; production receives the corresponding typed
native-basis reflectance packet. This spectrum is diagnostic evidence only.
It is not a measured material, a recommended surface, or a production default.

The selected production flat/local spatial domain is a scaled 19-by-15
`z`/`rho` grid. It is not represented by Native-16 or W9 in this data set
because Star has no flat/local cache field using those axes. Flat/local
primitive records store their explicit physical query inputs and returned
outputs instead.

Star's existing flat-geometry, local-Sun, and direct/reference outputs are
valid parity authorities for exactly what they compute. They are not evidence
for nonexistent flat/local cache fields or recurrence outputs.

### W9 relationship to W27

W9 keeps the six boundary-inclusive gnomonic faces, source-aligned frame,
duplicated seam/corner storage, dominant-face tie break, exact face centers,
and bilinear lookup used by W27. Its 486 directions reduce the outgoing axis
from `6 * 27^2 = 4,374` to `6 * 9^2 = 486`.

W9 is not generally a node subset of W27. It was also rejected as a production
reconstruction resolution by archive-internal run
`scripts/algorithm32-star/runs/000100-n-order-outgoing-cubed-sphere-w9/report.md`.
That rejection limits rendering and reconstruction claims; it does not prevent
W9 from exercising the common algorithm and topology for implementation
parity.

### Expected size

For one spherical Native16/W9 case:

- one `Jk` field has `16 * 486 * 15 = 116,640` binary64 scalars;
- one `Lk` field has `16 * 34 * 15 = 8,160` binary64 scalars; and
- four `J` plus three `L` fields occupy `3,928,320` bytes, about
  `3.75 MiB`.

The two full spherical cases occupy `7,856,640` raw pure-field bytes, about
`7.49 MiB`. Adding the retained explicit-zero micro fields brings the known
pure-field payload to `8,009,280` bytes, about `7.64 MiB`, before the small
diagnostic and flat/local primitive sections.

These are binary64 payload figures. They are not build-time estimates and do
not predict fixed setup, direct-authority, or browser costs.

## Retained Values

For each full-field case, retain:

1. the complete pure `J1`, `J2`, `J3`, and `J4` fields;
2. the complete pure `L1`, `L2`, and `L3` fields;
3. canonical hashes of Star's directly produced cumulative
   `Jthrough1` through `Jthrough4`;
4. predeclared resident-cache queries for N1, N2, and N4;
5. predeclared complete spectral rays for N1, N2, and N4; and
6. small pairing-specific primitive traces needed to localize a parity
   failure.

Do not store the cumulative arrays again. Reconstruct them in this exact
binary64 operation order and verify each reconstructed canonical hash against
the directly produced Star cumulative hash:

```text
Jthrough1 = J1
Jthrough2 = (J1 + J2)
Jthrough3 = ((J1 + J2) + J3)
Jthrough4 = (((J1 + J2) + J3) + J4)
```

Pure fields must never be reconstructed by subtracting cumulative fields.
`L1` through `L3` are retained even when theoretically reproducible because
they are small and each is a meaningful transport boundary.

Diagnostic spectra and numeric primitive traces also live in
`fields.f64le`. Their definitions, labels, shapes, and physical query inputs
live in the manifest. The manifest contains no large JSON numeric arrays.

For flat/local, retain only values directly emitted by the pinned Star
primitive or reference operation named by the record. Every record identifies
the exact method, input, quantity, and semantics. It contains no `Jk`, `Lk`,
or cumulative cache field unless Star later independently implements and uses
that output for reasons other than creating parity gold.

## Frozen Spherical Diagnostics

Every diagnostic spectrum contains all fifteen wavelengths. The field probes
below are extracted for both full spherical cases. Each listed `J` coordinate
is extracted from `J1` through `J4` and each listed `L` coordinate from `L1`
through `L3`:

| Field family | `(positionIndex, directionIndex)` coordinates |
| --- | --- |
| `J` / W9 | `(0, 40)`, `(0, 445)`, `(4, 0)`, `(8, 40)`, `(12, 121)`, `(15, 485)` |
| `L` / Fibonacci-34 | `(0, 0)`, `(0, 17)`, `(4, 8)`, `(8, 17)`, `(12, 25)`, `(15, 33)` |

W9 index 40 is the source-facing `+X` face center, index 121 is the
anti-source `-X` face center, and index 445 is the negative projected-up face
center whose low-altitude rays exercise the ground-facing branch. The other
coordinates cover a face corner, interior positions, and the final stored
node. The manifest stores the generated physical vector for every referenced
direction; indices alone are not sufficient identity.

The resident query corpus evaluates every wavelength for N1, N2, and N4 at
these exact physical inputs:

| Query id | Altitude (m) | Direction |
| --- | ---: | --- |
| `exact-low-source` | 2 | W9 index 40; `[0.6469772316140625, 0.10878378230678928, 0.754709580222772]` |
| `exact-middle-corner-node` | 31875 | W9 index 0; `[0.8989652083037574, -0.4343012516367401, 0.05695592230965302]` |
| `position-and-direction-interior` | 30000 | positive-X face `(u, v) = (0.125, -0.375)`; `[0.841957274856477, 0.25944747619255387, 0.4730697141157624]` |
| `face-seam` | 5625 | positive-X/positive-Y seam; `[0.3402337726432198, 0.7742400820888476, 0.5336602620019748]` |
| `lower-clamp` | 0 | anti-source; `[-0.6469772316140625, -0.10878378230678928, -0.754709580222772]` |
| `upper-clamp-corner` | 60000 | cubed-sphere corner; `[-0.1519002506398816, 0.559913943633321, 0.8145076362935608]` |

The complete-ray corpus reuses the already predeclared production runtime
cases from `src/algorithm32/fixtures/runtime-cache-parity-policy.json`, with
all fifteen wavelengths and N1, N2, and N4 retained:

- `bottom-upward-atmosphere-exit`: origin `[6360002, 0, 0]`, direction
  `[1, 0, 0]`, atmosphere-exit termination;
- `interior-tangent-atmosphere-exit`: origin `[6375000, 0, 0]`, direction
  `[0, 1, 0]`, atmosphere-exit termination; and
- `object-shortened-upward`: origin `[6360002, 0, 0]`, direction `[1, 0, 0]`,
  object endpoint at 10,000 m.

## Frozen Flat/Local Corpus

Flat/local uses the existing `local-sun-basic-v1` case exactly as defined in
`scripts/algorithm32-star/cases/local-sun-basic.js`. It remains explicitly a
development/parity input, not a justified production parameter selection:

- observer `[0, 0, 5]` m and flat atmosphere top 100,000 m;
- observer dome apex 100,000 m and maximum view extent 1,926,774 m;
- local source position `[4800000, 0, 4800000]` m, reference distance
  4,800,000 m, spectral scale 1, radius 25,749.504 m, and inverse-square
  falloff enabled; and
- 16 view-path intervals and 8 source-transmittance intervals.

### Flat-geometry primitives

Capture `resolveAtmosphereCoordinate` at `[0, 0, 0]`, `[0, 0, 5]`,
`[100, -200, 50000]`, and `[0, 0, 100000]` meters. Capture complete
`resolveViewRaySegment` results for the default observer with directions
`[0, 0, 1]`, `[1, 0, 0]`, and `[0, 0, -1]`, plus an upward request capped by
`endDistanceMeters: 1234`.

Capture complete reusable-path results, including every path sample's
position, atmosphere coordinate, distance, previous-interval length, and
trapezoid measure, for:

- start `[0, 0, 1000]`, direction `[0, 0, 1]`, `sampleCount: 4`;
- start `[100, 200, 1000]`, direction `[0, 0, -1]`, `sampleCount: 4`; and
- start `[0, 0, 100]`, direction
  `[0.7071067811865475, 0, -0.7071067811865475]`,
  `maxDistanceMeters: 1000`, `sampleCount: 2`.

These cases cover top, ground, observer-dome, explicit-limit, and
ground-occluded finite-endpoint behavior without claiming a flat cache.

### Local-Sun primitives

For each selected position, retain `resolveSourceRelativePosition`, the full
fifteen-channel `sampleDirectLighting` result and metadata, and
`resolveSourcePathLimit`:

```text
observer:             [0, 0, 5]
reference distance:   [0, 0, 4800000]
twice reference:      [-4800000, 0, 4800000]
source center:        [4800000, 0, 4800000]
inside source radius: [4812874.752, 0, 4800000]
on source radius:     [4825749.504, 0, 4800000]
```

The last three positions exercise the deterministic center direction, radius
clamp, and exact-radius boundary. Positions used only by this source primitive
need not lie inside the flat atmosphere.

### Existing direct/reference outputs

Rerun and retain the direct-only outputs already accepted by
`scripts/algorithm32-star/runs/000004-direct-local-sun-selected-rays` for all
five `local-sun-basic-v1` rays: `zenith`, `source-bearing-45deg`,
`opposite-45deg`, `north-horizon`, and `source-bearing-horizon`. For every ray,
retain all fifteen channels of completed spectral radiance, direct radiance,
zero second-order radiance, and transmittance, together with the complete view
segment and all seventeen trapezoid path points. This is parity against an
existing Star direct/reference calculation. It is not a flat/local N-order
cache claim.

## Frozen Comparison Policies

Structural ids, shapes, axis lengths, indices, field/order meanings,
categories, units, and exact-zero semantics must match exactly. For Star versus
production binary64 field, radiance, and completed-ray scalars, a nonzero
candidate passes when either its absolute error is at most `4e-18` or its
relative error is at most `1e-12`. This carries forward the existing
production-versus-Star engineering gate from
`../cache/spatial-reconstruction.md`. A Star zero requires an exact numerical
zero. A positive Star transmittance must remain positive and pass the
`1e-12` relative bound; the absolute floor must not permit a positive
near-zero transmittance to collapse to zero.

For CPU geometry values, lengths and positions use `1e-9` m absolute or
`1e-12` relative error. Unit-vector components, interpolation weights,
dimensionless source scales, and non-path primitive scalars use `1e-14`
absolute or `1e-12` relative error. Booleans, integer indices, boundary kinds,
sample counts, and categorical metadata match exactly.

Spherical GPU construction reuses
`src/algorithm32/fixtures/gpu-cache-parity-policy.json` and its additive
`absolute + relative * abs(oracle)` rule:

| Quantity | Absolute | Relative |
| --- | ---: | ---: |
| pure radiance | `2e-9` | `0.005` |
| pure scattering density | `2e-12` | `0.005` |
| cumulative scattering density | `8e-12` | `0.005` |
| exact copy | `0` | `0` |

Resident GPU comparisons reuse
`src/algorithm32/fixtures/runtime-cache-parity-policy.json`: complete-ray
radiance uses `2e-9` absolute plus `0.005` relative; transmittance uses `2e-6`
absolute plus `0.00002` relative; cumulative density uses `8e-12` absolute
plus `0.005` relative. These R32F policies apply to the predeclared diagnostic
queries served to Karma, not as permission to download the whole pack in an
ordinary browser test.

This data-set contract does not own the flat/local GPU tolerance. Star supplies
binary64 primitive and direct gold, while the production flat/local GPU graph
is compared compositionally against its binary64 CPU path. Stage 9
predeclared and now retains that R32F policy in
`src/algorithm32/fixtures/local-sun-gpu-cache-parity-policy.json` using the
existing per-quantity absolute-plus-relative pattern. The
[baseline status](baseline-import-status.md#focused-stage-9-flatlocal-browser-reproduction)
owns its exact current hash and browser result. That policy does not fabricate
whole-cache Star gold.

## Canonical Binary Layout

`fields.f64le` is an uncompressed sequence of IEEE-754 binary64 values in
little-endian byte order. The eventual outer ZIP supplies archival
compression. Avoiding an inner compression/container scheme keeps the reader
small and makes offsets, hashes, recovery, and independent inspection
straightforward.

Every section begins on an eight-byte boundary. Sections are stored in
manifest order without overlap. Each section declares:

- stable section and case ids;
- quantity, units, pure/cumulative status, and scattering order;
- axis names, axis lengths, and referenced domain ids;
- scalar type `float64` and byte order `little-endian`;
- byte offset and byte length in `fields.f64le`;
- SHA-256 of its exact canonical bytes; and
- the source record or derivation that produced it.

### Field axis order

Canonical fields use the production logical order:

```text
axes: wavelength, position, direction
direction is fastest

linearIndex = direction
            + directionCount * (position
            + positionCount * wavelength)
```

For a field with `D` directions and `P` positions, scalar
`(wavelength, position, direction)` starts at:

```text
section.byteOffset
  + 8 * (direction + D * (position + P * wavelength))
```

Star's current CPU field arrays use wavelength-fastest order. The Star-only
exporter must transpose those values into this canonical order before hashing
or writing them. The manifest records both the source layout identity and the
canonical layout identity. Production and Star arrays must never be compared
by assuming their raw offsets have the same meaning.

## Manifest

`manifest.json` is UTF-8 JSON and remains small enough to inspect and diff.
Its frozen schema id is `algorithm32-star-parity-manifest-v1`, and the data-set
id is `algorithm32-star-parity-reduced-v1`. At minimum it records:

- data-set id, schema version, creation tool, and state;
- purpose and the claim boundary from this document;
- exact Star source paths and SHA-256 hashes;
- collector source path/hash and execution environment;
- complete case inputs and content identities;
- spectral, position, incoming-direction, and outgoing-direction domains;
- source, geometry, atmosphere, ground, order, and numerical controls;
- section metadata and canonical hashes;
- cumulative derivations and direct-Star verification hashes;
- resident queries, complete rays, and primitive-trace definitions;
- predeclared CPU and GPU comparison policies;
- explicit coverage and open-coverage declarations; and
- SHA-256 and byte length of the complete `fields.f64le` payload.

The manifest must distinguish facts shared by cases from pairing-specific
facts. It must not imply that the production flat/local case uses spherical
positions or W9 unless those domains are explicitly selected for that
pairing.

## Selected Star Owners And Capture Wiring

The following key source hashes are frozen for the first capture. The
collector must additionally enumerate and hash every transitive Star source
it executes; this table is not permission to omit dependencies from the
manifest.

| Star source | SHA-256 |
| --- | --- |
| `src/n-order-cache/build-cpu-distant-n-order-cache.js` | `98aa61f7cf441226eef38f40043ea729b5b1feb93cbea4d9160b7a4c33ead24a` |
| `src/n-order-cache/CubedSphereDirectionDomain.js` | `9ae4788e34aaed042007534130a028a83cef9222d5c6a243ca9d341e38a51d7c` |
| `src/n-order-cache/GroundBoundarySphericalEarthGeometry.js` | `c18b6a3467d6d557d4a9cec812ad9eafd88c8a0785e4d784835009771e0e92a0` |
| `src/n-order-cache/ground-boundaries/GroundBoundary.js` | `cdfd261bef5c0b4857ebeb9d663cf4ee447dd48669ca06e438b8fd0952e154f1` |
| `src/n-order-cache/ground-boundaries/UniformLambertianGroundBoundary.js` | `46d34ab696548722d2b0f21d01ce6adf217fd569d820db194f4fcaa8b3c048ae` |
| `src/production-dome/production-algorithm32.js` | `17812c7b025273d4ac98dee87c0c82d38413a6158f02d90bfbe4d62d2ab31934` |
| `src/production-dome/figure1-scenes.js` | `c2397074ed2a3db96a129d3741e2c56aea1aa6d5129533f4802a6790282e057b` |
| `cases/local-sun-basic.js` | `7cc8e5735b9ba5491c8e2646c2322363cfd9c993dd7a4c27da15a19d2b06ac09` |
| `src/model/FlatAtmosphereGeometry.js` | `da7cd795e2a1c1b38c35a0affd945095e031898834735107eb4b3423da7c138d` |
| `src/model/LocalPointSun.js` | `198dec6140cfea317546733281fa96c74d4e79fff6031ff7a5406c1e1562366a` |
| `src/model/CanonicalAtmosphere.js` | `005c9d69d0b4f8f368e336f0e4624938e28cc939bd69bd67bbde9fc6759bef06` |
| `src/spectral/canonical-basis.js` | `1c94db577042d24d5bf48e9c7a0c5868c092514a343a27ff3b7c66970981ac0a` |
| `src/transport/Reference.js` | `bd0eca2e81c9307208a3778f40290e434a6d9a28ee1263da0b799fde0d7087b1` |
| `src/transport/SpectralCalculator.js` | `66692a81df51ba0c962f5dc7846619d5094e23068d3b15d28cdd698bdd33c9ea` |

Paths in this table are relative to `scripts/algorithm32-star`. Any change to
one of these hashes invalidates the affected first-capture pin and requires a
deliberate repin before collection.

The ordinary `createProductionAlgorithm32` factory currently instantiates
`SphericalEarthGeometry`, which does not expose
`resolveGroundBoundaryHit`; passing a reflective boundary through that
factory fails before construction. Star already implements the required hit
algorithm in `GroundBoundarySphericalEarthGeometry`. The collector therefore
needs one Star-only capture factory that instantiates the same canonical
native-15 collaborators and controls while substituting that existing
ground-aware subclass. Use that same subclass for omitted, reflective, and
explicit-zero records so geometry wiring is not a case variable. This is
capture plumbing around an existing Star algorithm, not authorization to add
a second cache implementation. The factory itself must be pinned and must not
import `src/algorithm32`.

## Collection And Assembly

The collector follows this sequence:

1. Freeze the affected Star source paths/hashes, collector hash, complete
   inputs, domains, cases, extraction set, and acceptance policies before
   observing production output.
2. Verify those pins, then run the Star N4 builder for exactly one case.
3. Retain the completed pure and direct cumulative fields, transpose them to
   canonical order, verify the cumulative derivations, evaluate the declared
   queries/rays/traces, and write a hashed exclusive temporary case fragment.
4. Repeat for each ready case. Never import `src/algorithm32` from the
   collector.
5. Assemble verified case fragments into one manifest and one binary payload,
   verify all ranges and hashes, then atomically rename the completed pair.
6. Mark the Star data read-only and record its manifest and payload hashes
   before any production comparison.
7. Run production comparison as a separate consumer and write a separate
   report. Never append production values or comparison results to the Star
   gold.

The current Star builders expose complete fields only after a full N4 build.
Therefore the honest computation restart boundary is one complete case, not a
field or pass inside that build. An interrupted case is rerun. Completed
temporary case fragments can be reused during final assembly.

Spherical/distant records may be captured and sealed before the flat/local
primitive extraction set is ready. Each record fragment has its own content
hash, so later assembly does not change already captured values.

## Reader Contract

The offline [reader](../../../../scripts/algorithm32-star/parity-data-set/ParityDataSetReader.js)
and
[structured-output decoder](../../../../scripts/algorithm32-star/parity-data-set/capture/StructuredNumericDecoder.js)
remain in the path-pinned validation island. The full semantic verifier is the
archive-internal path
`scripts/algorithm32-star/parity-data-set/capture/verify-star-parity-data-set.js`.
These are project tooling, not production runtime modules.
The reader provides inspect, verify, section-read, and scalar-read operations
with the following semantics. The production comparator is a separate
implemented consumer and never mutates the gold.

To open a data set:

1. Parse `manifest.json` and require the supported schema and completed state.
2. Open `fields.f64le` read-only.
3. Verify its declared byte length and whole-payload SHA-256.
4. For every requested section, verify eight-byte alignment, nonnegative
   range, no overflow, no overlap, and
   `byteLength = 8 * product(shape)`.
5. Hash the exact section bytes and compare the declared SHA-256.
6. Decode each scalar explicitly as little-endian binary64.
7. Apply the declared semantic checks, such as finite values and the expected
   field quantity.

The scalar read operation is:

```text
linearIndex = direction + D * (position + P * wavelength)
byteOffset  = section.byteOffset + 8 * linearIndex
value       = dataView.getFloat64(byteOffset, true)
```

The final `true` is required; it requests little-endian decoding. A reader
must reject an unknown manifest version, missing case/domain, hash mismatch,
out-of-range index, truncated payload, or inconsistent shape rather than
guessing.

Direct fields and spectra are read with `readSection`; canonical field scalars
may also use `readScalar` with named axis coordinates. Structured primitive,
path, diagnostic, and input records retain a layout description in the
manifest and numeric leaves in one authenticated section. Reconstruct one as
follows:

```js
const inspection = await reader.inspect();
const description =
	inspection.manifest.records.flatGeometryPrimitives.outputs;
const values = await reader.readSection(description.sectionId);
const output = new StructuredNumericDecoder().decode({
	description,
	values,
});
```

The completed artifact has successfully decoded all ten structured record
descriptions. Consumers still call `verify()` before treating any decoded
value as gold.

Reader/container unit tests use tiny synthetic manifests and payloads. They do
not require the project-lifetime Star data. Ordinary Jasmine and Karma suites
must not discover or require `archives/algorithm32-star-parity`.

For an explicit GPU comparison run, Node opens and verifies the data, then a
dedicated Karma configuration or middleware serves only the predeclared
sections/probes needed by the browser. The browser must not fetch or decode
the entire archive implicitly. Karma remains the real-browser host; the pack
remains offline Star gold rather than a unit-test correctness oracle.

## Comparison And Reports

The offline comparator:

- compares production and Star by logical case, field, position, direction,
  and wavelength coordinates;
- compares every spherical reduced binary64 CPU pure field under a
  predeclared rule;
- reconstructs and checks cumulative N1/N2/N4 outputs in the declared order;
- compares flat/local primitive, primary, or direct outputs only where the
  manifest names an actual Star producer;
- applies a separately predeclared R32F policy to GPU values;
- evaluates the retained resident queries, rays, and primitive traces; and
- reports missing coverage independently from numerical failures.

SHA-256 proves artifact integrity. It proves algorithm parity only where the
acceptance policy explicitly requires byte identity. Otherwise parity comes
from the declared scalar comparison; a matching integrity hash is not a
substitute for that comparison.

Each comparison report records the Star manifest and payload hashes,
production revision-inspection status and source hashes, reader/comparator
hashes, environment, executed cases and sections, acceptance policy, maximum
errors, failures, and coverage gaps. A small durable report may be committed
or referenced by current-state documentation. The bulk Star data remains
outside Git.

## Retention And Final Archive

During the project, keep the manifest, binary payload, case fragments still
needed for recovery, and comparison reports under the ignored evidence/archive
area. Production code, ordinary tests, and application builds must remain
functional when that area is absent.

At project archival:

1. verify every manifest, payload, case, and comparison-report hash;
2. remove superseded temporary fragments;
3. place the retained data-set directory and reports into the larger project
   ZIP;
4. record the final ZIP SHA-256 in the surviving project record; and
5. treat the ZIP as historical conformance evidence, not a maintained runtime
   dependency.

## Current Production Consumers

The capture choices remain frozen, and the ignored manifest and payload passed
whole-file, per-section, and semantic verification before retirement. The
offline Stage 8 binary64 report, bounded Karma/WebGL result, and Stage 9 scoped
comparisons remain historical passing evidence. Only
`npm run test:algorithm32:ground:three` remains as a live bounded Star-derived
browser gate; it consumes the retained support closure rather than the bulk
archive. This gate and its retained Star support are temporary conformance
infrastructure. Remove them after the applicable production conformance
closure is accepted and durably recorded; do not preserve Star coupling as a
production regression dependency.

The retired comparators and capture tools are not current consumers. A later
change requiring new Star data, a repin, or another production comparison
requires a new isolated evidence lane and explicit authority; it does not
modify or reopen this archived experiment.
