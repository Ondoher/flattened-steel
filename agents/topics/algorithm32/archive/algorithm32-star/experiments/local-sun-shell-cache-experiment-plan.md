# Local-Sun Base-Fact Shell Characterization Plan

Status: Phase 1 complete. Steps 1 and 2 are accepted, and Step 3 reached its
perceptual-limit stop at the first passing tested count, `N = 2,048`. Phase 2
diagnostic implementation and conformance are accepted through P2.7 under the
self-contained Star physical v3 contract.
This is now a terminal archived experiment plan. Its statements about
production describe the experiment's original scope; later promotion is owned
by the production plan. Missing Star source and run links are archive-internal
and resolve through the
[Algorithm32-Star evidence index](../../../../evidence/algorithm32-star/README.md).

Terminal step: **P2.7 diagnostic GPU conformance is accepted in run `000335`.
The complete Star-local implementation is frozen as accepted in run
`000345`.**

## Objective

Characterize the difference between continuous direct available light at
shell-relative radii and the one light level represented by that shell across
increasing inverse-square shell counts.

The deciding sequence stops:

1. at the first completed tested count whose required display-referenced
   differences are all below the frozen human-perception limit; or
2. if no count passes, after the last count whose family-wide innermost shell
   remains at least `1.5 m`.

Every completed count retains its full characterization. The terminal report
shows the last five completed counts, or all completed counts when fewer than
five exist.

This is characterization only. A later implementation may accept
`shellCount` as a setup parameter after a separate implementation decision.

## Authority And Claim Boundary

| Concern | Canonical owner |
| --- | --- |
| Fact representation, shell equations, geometry-query contract, memory equation, source cases, and scientific stop meanings | [Local-Sun whole-flat-world cache design](../cache/local-sun-cache-design.md) |
| Selected whole-flat-world atmosphere boundary | [Flat-world atmosphere boundary decision](flat-world-atmosphere-boundary-decision.md) |
| Downstream physical quantity and spectral basis | [Selected cache contract](../cache/cache-contract.md) |
| Spectral-radiance to display-linear sRGB boundary | [E8 spectral-to-RGB result](../../../../references/results/experiments/e8-spectral-to-rgb-boundary-correctness/result.md) |
| Display-referenced visibility evidence | [E2 display-referenced convergence result](../../../../references/results/experiments/e2-display-referenced-convergence/result.md) |
| Immutable run mechanics and provenance | Archive-internal `scripts/algorithm32-star/experimental-lane-rules.md` |
| Accepted prerequisites and rejected prior sparse lineage | [Terminal Star flat/local plan](star-flat-local-cache-plan.md) |
| Current production selection | [Flat/local cache promotion work](../flat-local/unresolved-research.md) |

The Star lane supplies engineering evidence only. It is not an official
independent scientific experiment and does not select production.

## Selected Test Contract

The plan consumes, without redefining, these selected design facts:

- Resident facts are two independent one-dimensional tables. For source case
  `c`, `U_c = N + 1` shared radial boundaries are derived from that case's
  `r_min,c` and `r_max,c`; one global `V = 48` atmosphere table reuses the
  selected production Native-48 coordinates and adjacent lookup.
  Source cases are alternative cache configurations, so only one `U_c` is
  resident at a time and `B_fact(N)` is not multiplied by the experiment's
  case count.
- The two boundaries and their derived light levels deterministically define
  the one light input that would generate a shell's cached result for a fixed
  atmosphere and exact-geometry context. The study does not construct that
  result. The input is held throughout the shell; available light is not
  reconstructed at the query by interpolating the two boundary light levels.
- There is no resident `U * V` product and no around-shell axis.
- Geometry converts its native coordinates and selected source into the exact
  source-relative query packet. The light comparison maps
  `distanceFromSource` to `u`. Deciding records are generated directly in
  shell-relative inverse-square coordinates; they do not invent a second
  physical position axis.
- The light-to-display calculation uses one fixed normalized direct-primary
  radiance response bank per source case. It is evaluated once at the retained
  local-Sun map-center anchor and five retained ray roles, then scaled by
  either the continuous or shell-held light level. Atmosphere and geometry
  are therefore fixed response inputs rather than deciding spatial axes.
- The packed binary64 fact size is `B_fact(N) = 8N + 1,168` bytes.
- The family-wide minimum innermost-shell width is `1.5 m`. For the currently
  documented source family, the centered case controls and gives
  `N_width_max = 1,484,977` and `B_fact = 11,880,984` bytes.
- The distant-Sun `12,597,120`-byte field is a sizing guide only. It is not a
  third stopping condition.

The characterization constructs no resident scattering cache, directional
packet, W27 field, native-15 spatial field, interpolated cached `J`, GPU
resource, browser output, or render. Native spectral values may exist
transiently only when the frozen perception projection mathematically
requires them.

## Step 1 - Freeze One Family Manifest

Create:

```text
agents/topics/algorithm32/experiments/local-sun-shell-cache-inputs/
  base-fact-family-v1.json
```

The manifest is the single entry point for every deciding run. It contains
content hashes or content-addressed locators for:

1. the exact varying source origins, fixed reused source characteristics and
   light evaluator, geometry/source frames, world boundary,
   geometry-to-source-relative transform, and derived `r_min`/`r_max`;
2. the globally shared atmosphere/profile, exact whole-world geometry, fixed
   response anchor, and five response-direction identities used to construct
   the normalized direct-primary response bank;
3. the binary64 `U_c` and `V` schemas, the selected Native-48 numeric altitude
   coordinates and clamped actual-neighbor lookup, and complete
   resident/construction byte equations;
4. the exact rule that calculates the one shell-held light level from
   adjacent shell boundaries and their derived light levels;
5. the continuous direct-light evaluator;
6. the minimal display projection, comparison metric, display/viewing
   conditions, uncertainty calculation, and strict perception limit;
7. the complete bounded sample matrix, stable sample identities, and
   nondeciding harness fixtures;
8. the count sequence, family-width calculation, two scientific stops,
   completeness rule, result schema, and final-five rule; and
9. the fresh family identity, runner/source closure, commands, environment
   capture, and immutable-run policy.

The manifest freezes the complete decision surface before any deciding
output. A changed item creates a fresh family manifest and new run lineage.

### Fixed Source Evaluation

The
[selected local-light rule](../cache/local-sun-cache-design.md#selected-source-cases-and-local-light-evaluation)
is not an unresolved experimental choice. Every case reuses the retained
native-15 source spectrum, reference distance, spectral scale, radius clamp,
enabled inverse-square falloff, and exact `LocalPointSun` evaluation. Only
the enumerated three-dimensional source origin varies between source cases.
Step 1 records the origins and content-pins the reused inputs and evaluator;
it does not define a replacement light calculation.

### Selected Native-48 Atmosphere Rule

The `V = 48` coordinate and lookup contract is also resolved. It reuses the
existing production Native-48 numerical rule exactly:

```text
vAltitudeMeters[0] = 2

for 1 <= i < 48:
    vAltitudeMeters[i] =
        ((i + 0.5) / 48) * 60,000
```

For the selected flat geometry these numbers mean meters above flat ground.
Lookup clamps below row 0 and above row 47, returns one tap at an exact node,
and otherwise linearly weights the two actual adjacent node coordinates. It
does not rescale the coordinates to the 100 km flat-atmosphere height and does
not reuse the distant cache's separate construction-nearest lookup.

Step 1 content-pins the canonical coordinate generator, adjacent lookup
implementation, descriptor content hash, and flat-altitude semantic
adaptation identified by the
[cache design](../cache/local-sun-cache-design.md#atmosphere-table). It does
not choose new coordinates or a new lookup.

This selected `V` rule remains outside the deciding light-only comparison. It
is frozen for representation identity and resource accounting, not treated
as another error axis.

### Selected Shell-Generation Light Rule

For shell `i`, let `entryLight` and `exitLight` be the exact available-light
levels derived from its two inverse-square boundaries. The one light level
used to generate that shell's cached result is:

```text
shellHeldLightLevel = (entryLight + exitLight) / 2
```

Here, `lightLevel` is the scalar inverse-square incident scale that multiplies
the one fixed native-15 reference spectrum:

```text
lightLevel(radius) =
    referenceSpectralScale
  * (referenceDistance / radius)^2
```

The selected domain is outside the source-radius clamp. The fixed spectrum is
introduced only by the shared minimal perception projection; it is not
duplicated or averaged channel by channel.

This is the midpoint in normalized inverse-square coordinate and minimizes
the maximum absolute light-level error over an equal-light shell. It is held
throughout the shell; query-time interpolation or direct-light recomputation
is not permitted.

The narrow calculation interface is:

```text
calculateShellLightLevel(
    shellEntryRadius,
    shellExitRadius,
    shellEntryLightLevel,
    shellExitLightLevel
) -> shellHeldLightLevel
```

The permitted inputs are exactly the two adjacent `U_c` radii, the entry and
exit light levels derived transiently from those radii and the shared source.
No atmosphere tuple, query distance, cached field, spectral field, or hidden
resident input is permitted. Samples at different inverse-square phases
within one shell share this shell-held light level while their direct light
levels differ.

The direct evaluator applies the fixed local-light rule at the exact
shell-relative sample radius. The selected perception projection applies the
same fixed normalized response to both light levels. The light level is the
only approximated input.

For inverse-square phase `t` from shell entry `0` to exit `1`:

```text
sampleU = (shellIndex + t) / shellCount
sampleRadius =
    inverseSquareRadius(
        selectedSourceCase.rMin,
        selectedSourceCase.rMax,
        sampleU
    )

directLight(t) =
    (1 - t) * entryLight + t * exitLight

signedLightDelta(t) =
    directLight(t) - shellHeldLightLevel
  = (1/2 - t) * (entryLight - exitLight)
```

The raw light delta is zero at `t = 1/2` and has equal-magnitude opposite-sign
extrema at the two boundaries. The frozen interior phases characterize the
perceptual projection between those controls.

Within one source case, every equal-inverse-square shell has the same raw
boundary light span and therefore the same raw delta at a given phase. Inner
shell emphasis is a denser projection/context stress sample, not a claim that
its raw light error is larger. Whole-range and outer guards are required.

```text
C = referenceSpectralScale * referenceDistance^2

perShellLightSpan(sourceCase, N) =
    C
  * (sourceCase.rMin^-2 - sourceCase.rMax^-2)
  / N
```

### Selected Fixed-Response Perception Projection

The light-to-display rule is selected rather than left as a later experiment
choice. Its identity is `fixed-direct-primary-response-bank-v1`. It reuses:

- the retained `local-sun-basic-v1` observer anchor `[0, 0, 5] m` and five
  named ray roles;
- the selected whole-flat-world geometry and canonical atmosphere;
- the accepted Stage 2 direct-primary endpoint-trapezoid controls of `15`
  path intervals and `15` source-transmittance intervals;
- the typed E8 canonical spectral-radiance-to-display-linear-sRGB boundary;
  and
- E2's continuous display-linear-sRGB-to-ITP transform, display conditions,
  uncertainty, and strict visibility gate.

The retained executable owners are
[`local-sun-basic.js`](../../../../scripts/algorithm32-star/cases/local-sun-basic.js),
[`LocalPointSun.js`](../../../../scripts/algorithm32-star/src/model/LocalPointSun.js),
[`l1-field.js`](../../../../scripts/algorithm32-star/src/cache/l1-field.js),
[`spectral-math.js`](../../../../scripts/algorithm32-star/src/spectral/spectral-math.js),
the
[Stage 2 matrix](../../../../scripts/algorithm32-star/cases/flat-local-dome-cache-index-stage2-matrix-v1.json),
and
[`spectral-to-rgb.js`](../../../../scripts/algorithm32-star/src/output/spectral-to-rgb.js).
Step 1 content-pins them and their transitive inputs; their present paths are
not substitutes for hashes.

For source case `c`, response role `d`, and native spectral channel `lambda`,
let:

```text
responseAnchor = [0, 0, 5] m

anchorLightLevel[c] =
    LocalPointSun(c)
      .sampleDirectLighting({ position: responseAnchor })
      .metadata.totalScale

anchorRadiance[c, d, lambda] =
    evaluateIncomingSingleScatteredRadiance({
        position: responseAnchor,
        incomingDirection: responseDirection[c, d],
        geometry: wholeWorldGeometry,
        calculator: calculatorForSourceCase[c],
        pathIntervalCount: 15,
        sourceTransmittanceIntervalCount: 15
    }).radiance.values[lambda]

unitResponse[c, d, lambda] =
    anchorRadiance[c, d, lambda] / anchorLightLevel[c]

comparisonRadiance(L, c, d, lambda) =
    L * unitResponse[c, d, lambda]
```

`anchorLightLevel[c]` is finite and strictly positive for every frozen source
case. Direct-primary transport is linear in the source term, so scaling the
normalized response by `L` changes only the tested light level. The result is
a correctly typed spectral-radiance packet; source irradiance is never
relabelled as radiance.

The five base response directions are the existing local-Sun render probes:

| `responseRoleId` | Base world direction for the centered/east cases |
| --- | --- |
| `fixture-zenith` | `[0, 0, 1]` |
| `fixture-source-bearing-45deg` | `[0.7071067811865475, 0, 0.7071067811865475]` |
| `fixture-opposite-45deg` | `[-0.7071067811865475, 0, 0.7071067811865475]` |
| `fixture-north-horizon` | `[0, 1, 0]` |
| `fixture-source-bearing-horizon` | `[1, 0, 0]` |

For each negative-`x` source case, the manifest derives the response direction
by applying the joint reflection
`M_x([x, y, z]) = [-x, y, z]` to the already declared positive-`x`
direction. It does not regenerate a local frame with a changed handedness.
The centered case uses the base directions and treats rotations about the
vertical source axis as a structural symmetry check.

For either the direct or shell-held light level, E8 maps the comparison
radiance to display-linear sRGB:

```text
XYZ_j =
    sum_i(
        CIE1931_j(lambda_i)
      * comparisonRadiance_i
      * binWidthNanometers_i
    )

linearSrgb = 683 * M_XYZ_to_sRGB * XYZ

displayLinearSrgb =
    clamp(
        -expm1(-max(0, linearSrgb) / (5 * 683)),
        0,
        1
    )
```

No component encoding, eight-bit quantization, image format, or renderer
enters the deciding comparison. E2 then applies its retained transform from
continuous display-linear sRGB through absolute D65 XYZ and BT.2100/PQ ITP:

```text
observedDelta =
    720 * hypot(
        directITP.I - shellHeldITP.I,
        directITP.T - shellHeldITP.T,
        directITP.P - shellHeldITP.P
    )

referenceUncertainty = 0
displayTransformUncertainty = 1.485163121927885e-10

totalDelta =
    observedDelta
  + referenceUncertainty
  + displayTransformUncertainty

samplePass = totalDelta < 1
```

The frozen E2 display conditions are D65, `80 cd/m^2` white,
`0.2 cd/m^2` viewer-observed black, `16 cd/m^2` image background,
`4.1 cd/m^2` surround, and `64 lux` ambient illumination.

Every radial record is evaluated under all five response roles. These roles
are a small fixed perceptual-response bank, not cache coordinates or spatial
sample dimensions. The bank is an offline display diagnostic, not the
shell-cached value, and adds zero bytes to `B_fact(N)`. The resulting stop
means potential indistinguishability under this frozen response diagnostic.
It does not prove imperceptibility for every possible world position, ray,
display, adaptation state, or complete rendered scene. Raw signed and
absolute light-level deltas remain retained so tone-map saturation cannot
hide the underlying shell approximation.

### Containing-Shell And Boundary-Side Rule

For ordinary queries, the normalized inverse-square domain uses half-open
shell ownership:

```text
0 <= sampleU < 1:
    shellIndex = floor(shellCount * sampleU)

sampleU = 1:
    shellIndex = shellCount - 1
```

Thus an exact internal boundary belongs to the higher-index, farther shell.
This is a lookup tie rule, not a change to the physical boundary or direct
light.

The structural boundary matrix also retains both one-sided limiting records:
`phase = 1` for the nearer shell and `phase = 0` for the farther shell. They
share one physical coordinate and direct light level but intentionally use
different shell-held values. Their stable identities include source case,
shell index, and side, so coordinate-based deduplication may not erase either
record.

### Frozen Count Sequence

The selected initial deciding sequence is:

```text
N_sequence =
    uniqueSorted(
        powers of two from 1 through 1,048,576,
        N_width_max = 1,484,977
    )
```

This produces at most 22 completed count tests. A manifest assertion requires
the sequence to be strictly increasing, width-valid, and to end with the
derived `N_width_max`.

This logarithmic ladder is the selected initial manifest sequence because it
bounds the complete count study while spanning the full useful resolution
range. It characterizes the first passing tested count; it does not search
every integer count.

"First successful" means first in this frozen sequence. It is not the smallest
successful integer `N`.

## Bounded Sample Matrix

The sample workload is bounded independently of `N`. It emphasizes the inner
shells without evaluating every shell or forming a `U * V` test product.

### Radial Shell Samples Per Count

Select, then deduplicate only identical semantic sample identities:

```text
inner shells:
    indices 0 through min(N, 64) - 1
    inverse-square phases:
        1/64, 1/16, 1/4, 1/2, 3/4, 15/16, 63/64

whole-range guards:
    m = min(N, 64)

    for 0 <= k < m:
        if m == 1:
            shellIndex = 0
        else:
            shellIndex =
                floor(
                    (
                        2 * k * (N - 1)
                      + (m - 1)
                    )
                  / (2 * (m - 1))
                )

    inverse-square phases:
        1/64, 1/2, 63/64

outer guards:
    final min(N, 8) shell indices
    inverse-square phases:
        1/64, 1/2, 63/64

structural boundary controls:
    phases 0 and 1 at every selected shell
```

The integer whole-range formula is round-to-nearest with positive half ties
rounded upward. It is independent of binary floating-point division.

The `64`-shell inner and whole-range limits keep the deciding workload
independent of `N`. Inner shells receive the full seven-phase profile.
Whole-range and outer guards retain the two near-boundary probes as well as
the exact midpoint control, so they cannot appear error-free merely because
only the arithmetic-mean point was sampled. Step 1 freezes these values
before output.

Selection membership is metadata, not identity. When one shell/phase belongs
to multiple `inner`, `whole`, or `outer` coverage roles, it is evaluated once
and retains all of those roles. Distinct one-sided boundary records are never
merged, even when they have the same physical radius.

Stable identities are:

```text
interior:
    light-v1/{sourceCaseId}/shell-{i}/phase-{phaseTag}/{responseRoleId}

boundary:
    light-v1/{sourceCaseId}/shell-{i}/{entry|exit}-boundary-{j}/{responseRoleId}
```

`phaseTag` is the manifest's canonical rational token (`1of64`, `1of16`,
`1of4`, `1of2`, `3of4`, `15of16`, or `63of64`), not a formatted
binary64 value. For a shell `i`, entry boundary `j = i` and exit boundary
`j = i + 1`.

Boundary controls verify that adjacent shells share the same physical
boundary and direct light level, and that each shell has the expected
one-sided endpoint delta. The shell-held approximation is allowed to step at
a boundary; these controls do not falsely require it to be continuous. They
do not enter percentile statistics. They do enter the perceptual gate,
maximum, worst-sample identity, and margin. The decisive maximum also includes
every interior shell-relative/response-role comparison.

At the maximum nonoverlapping shape, reached by the high-count portion of the
selected ladder, each source case has:

```text
134 distinct selected shells
658 interior phase records
268 side-labelled boundary records
926 radial records
```

Crossing those records with five response roles and nine alternative source
cases gives:

```text
maximum comparisons per completed N =
    926 * 5 * 9
  = 41,670

maximum percentile-eligible interior comparisons =
    658 * 5 * 9
  = 29,610

maximum percentile-excluded boundary comparisons =
    268 * 5 * 9
  = 12,060

exact maximum if all 22 selected counts complete =
    sum(comparisonCount(N) for N in N_sequence)
  = 662,760
```

Manifest validation rejects an incomplete mapping, duplicate semantic
identity, lost coverage role, changed response cross-product, or generated
workload above these maxima. Streaming records is allowed so offline evidence
does not become resident cache memory.

Percentiles use only finite interior comparisons, including the exact
midpoint controls, across all source cases and response roles. Boundary
records are excluded. For sorted zero-based values `v` of length `n`, the
selected nearest-rank rule is:

```text
percentile(p) = v[max(0, ceil(p * n) - 1)]
```

The overall maximum and pass gate still include every interior and boundary
comparison. Stratified maxima prevent one response role or coverage class
from being hidden by the aggregate percentiles.

### Nondeciding Geometry And Response Qualification

Physical world positions are not crossed with the radial matrix. Geometry,
boundary, and response construction are instead qualified before deciding
output with a bounded structural set:

- the `18` accepted Stage 1 `B01` through `B18` geometry fixtures;
- the four accepted Stage 2 `C01` through `C04` positions crossed with the
  five retained response directions, for `20` records;
- one source-relative transform at the response anchor for each of the nine
  source cases; and
- the `9 * 5 = 45` normalized response-bank records.

This is at most `92` qualification records. It covers center, ground, cap,
rim, tangent, source-axis, transverse, oblique, outside-domain, and reflected
behavior without claiming those positions are another deciding cache axis.
The radial probe radius and response-anchor distance are separate named
values; the anchor's physical distance never overwrites the radial light
level.

## Step 2 - Qualify The Harness

Run one fresh immutable focused qualification using only nondeciding fixtures.
It verifies:

- the family manifest and every transitive source hash;
- the frozen `92`-record maximum, geometry-to-source-relative conversion,
  exact ray/boundary facts, and east/west joint reflection;
- inverse-square boundary generation and shared-boundary identity;
- exact reproduction of the selected Native-48 coordinates, endpoint clamps,
  exact-node single taps, adjacent-node weights, descriptor content hash, and
  flat-altitude semantic identity without using `V` in deciding fixtures;
- the `U_c` half-open lookup and terminal endpoint, arithmetic-mean
  shell-held light rule, midpoint identity, both side-labeled endpoint
  extrema, and absence of an extra spatial axis;
- `B_fact(N)`, the `1.5 m` family-width calculation, and
  `N_width_max = 1,484,977`;
- deterministic construction of all `45` normalized direct-primary response
  records from the selected whole-world `15`/`15` transport path;
- response normalization, correctly typed radiance scaling, and rejection of
  an irradiance packet relabelled as radiance;
- reproduction of E8's retained projection cases, E2's retained transform and
  uncertainty cases, and the strict `totalDelta < 1` rule;
- exact integer whole-range shell selection, semantic deduplication, stable
  identities, retained coverage roles, the `41,670` per-count maximum, and
  bounded deterministic sample generation with no deciding-sample access;
- complete, perceptual-stop, width-stop, tie, failed, and interrupted state
  transitions; and
- zero cache-field, GPU, browser, render, application, and production work.

Exit: the focused run is accepted, its terminal manifest verifies, and no
deciding sample has been evaluated.

Any failed or interrupted qualification remains immutable. An unchanged-input
operational retry uses a new numbered run in the same family. A correction to
a frozen input or source creates a new manifest and family lineage.

## Step 3 - Characterize The Frozen Family

### Run One Immutable Result Per Count

For each `N` in `N_sequence`:

1. verify the family manifest and all prior required terminal manifests;
2. verify `familyMinimumInnerWidth(N) >= 1.5 m`;
3. allocate and initialize a new numbered run before physical calculation;
4. construct each source case's `U_c` boundary facts for this count, one case
   at a time;
5. construct or verify the source case's five-record normalized response bank;
6. stream the frozen radial and response-role matrix;
7. evaluate the continuous direct light level at the radial sample;
8. calculate the shell-held light level through the frozen midpoint rule;
9. scale the fixed response by each light level and apply only E8 and E2;
10. retain every comparison record and complete the per-count summary; and
11. finalize the run exactly once.

For one sample:

```text
selectedSource = sourcesByCaseId[sample.sourceCaseId]
U_case = radialBoundariesBySourceCase[sample.sourceCaseId]

shellEntryRadius = U_case[sample.shellIndex]
shellExitRadius = U_case[sample.shellIndex + 1]

shellEntryLightLevel =
    deriveAvailableLight(shellEntryRadius, selectedSource.fixedFacts)

shellExitLightLevel =
    deriveAvailableLight(shellExitRadius, selectedSource.fixedFacts)

shellHeldLightLevel =
    calculateShellLightLevel(
        shellEntryRadius,
        shellExitRadius,
        shellEntryLightLevel,
        shellExitLightLevel
    )

sampleRadius =
    inverseSquareRadius(
        selectedSource.rMin,
        selectedSource.rMax,
        (sample.shellIndex + sample.phase) / N
    )

directLightLevel =
    deriveAvailableLight(sampleRadius, selectedSource.fixedFacts)

unitResponse =
    responseBank[sample.sourceCaseId][sample.responseRoleId]

directRadiance =
    scaleSpectralPacket(unitResponse, directLightLevel)

shellHeldRadiance =
    scaleSpectralPacket(unitResponse, shellHeldLightLevel)

directITP =
    linearSrgbToItp(
        projectSpectralRadianceToRgb(directRadiance).displayLinearSrgb
    )

shellHeldITP =
    linearSrgbToItp(
        projectSpectralRadianceToRgb(shellHeldRadiance).displayLinearSrgb
    )

observedDelta =
    deltaEItp(directITP, shellHeldITP)

totalDelta =
    observedDelta
  + 0
  + 1.485163121927885e-10

samplePass =
    totalDelta < 1
```

The response bank contains the atmosphere, geometry, source position, and ray
dependence needed by this bounded perception diagnostic. Those facts are
fixed before the direct/shell-held split and are not reevaluated as shell
sample axes. Its reference uncertainty is exactly zero; E2's retained display
transform uncertainty is the only nonzero declared term.

The selected visibility gate is E2's scoped rule:

```text
observed Delta E ITP + all declared uncertainty < 1
```

The family manifest must pin E2's exact display conditions and the projection
that supplies its comparison values. This is a potential-indistinguishability
diagnostic under those conditions, not a universal correctness claim.

### Required Records

Each sample retains:

```text
family and run identity
N, shell index, and inverse-square phase
ordinary lookup owner or one-sided boundary-control side
source case, response role, coverage roles, and stable sample identity
sample radius and response-bank identity
direct light level
shell-held light level
signed and absolute light-level delta
direct and shell-held typed comparison radiance
E8 display-linear sRGB and E2 ITP values
observed and uncertainty-inclusive perceptual delta
pass/fail
```

Each completed count retains:

```text
N
innermost width by source case
family minimum width and controlling source case
B_fact(N)
required and completed sample counts
maximum, p99, and p95 total delta
minimum/maximum signed and maximum absolute light-level delta
maximum total delta by source case
maximum total delta by response role
maximum total delta by inverse-square phase
inner-shell maximum
whole-range-guard maximum
outer-guard maximum
boundary-control maximum
failed-sample count
worst sample identity
margin to the perception limit
structural-control result
fullySuccessful
```

A count is complete only when every required sample and structural control has
a finite retained result. `fullySuccessful` requires every structural control
and every deciding shell-relative/response-role comparison to pass.
A boundary control participates in the maximum, worst-sample identity, margin,
and all-sample perceptual gate even though it is excluded from p95 and p99.
A complete nonpassing count is finalized as `rejected`; a complete fully
successful count is finalized as `accepted`. Failure, cancellation, nonfinite
output, or incomplete coverage is `failed` or `interrupted` and does not
advance the sequence. An unchanged-input operational retry uses the same
family and `N` in a new run. Any correction to a frozen input, evaluator,
generator, projection, or runner requires a new family manifest and lineage;
its deciding sequence restarts, and its closeout does not mix prior-family
count results unless an exact reuse rule was frozen before either family
produced deciding output.

### Exactly Two Scientific Stops

Evaluate the terminal state only after a complete count:

```text
perceptualPassed = fullySuccessful
widthBackstopReached = (N == N_width_max)

if perceptualPassed:
    stopReason = perceptual-limit-reached
    stop

if widthBackstopReached:
    stopReason = minimum-shell-width-reached
    stop

continue with the next frozen N
```

If `N_width_max` also passes, retain both flags and close as perceptual
success. Failure or interruption is not a third scientific stop.

## Step 4 - Close The Family

Create one immutable closeout run that consumes only verified terminal
manifests and retained result records. It reports:

- the family identity and every completed, failed, and interrupted run;
- the exact terminal flags and stop reason;
- the complete observed count/error/memory curve;
- the first successful count in the frozen sequence, when present;
- the final five completed counts, or all when fewer than five completed,
  with `N`, family width, `B_fact`, signed/absolute light error, maximum,
  p99, p95, failed-count, worst identity, gate margin, and terminal flags;
- any incomplete final attempt separately;
- all retained per-sample and per-count artifact locators; and
- the claim boundary and remaining implementation/promotion prerequisites.

A width-stop family can be scientifically complete even though its last count
run is `rejected`. The closeout must not reinterpret a width stop as
perceptual success.

## Phase 2 - Experimental Cache Implementation

Phase 2 develops an isolated Algorithm32-Star CPU cache candidate using the
closed Phase 1 fact family and `N = 2,048`. It is engineering evidence only:
it neither modifies nor selects the production cache, and it does not treat
the Phase 1 perceptual result as validation of a complete scattering cache.

### Entry Inputs

The phase must content-pin the accepted Phase 1 family manifest, closeout run
`000237`, the `N = 2,048` terminal run `000234`, selected local-Sun source,
whole-flat-world geometry, Native-48 atmosphere contract, numerical controls,
and all reused Star primitives. It creates a fresh implementation manifest and
new immutable run lineage; it must not amend the frozen characterization
family or any prior run.

### First CPU Candidate

Create a dedicated namespace under:

```text
scripts/algorithm32-star/src/local-sun-shell-cache-implementation/
```

The first candidate builds a binary64 `ShellFactCache` for one active source
case. It retains the 2,049 inverse-square radial boundaries, the one
arithmetic-mean held light scale for each of the 2,048 shells, and the
existing 48-row Native-48 altitude coordinate/lookup contract. Its identity
includes shell count, source configuration, source/light inputs, geometry,
atmosphere/profile inputs, and numerical controls. A change to any identity
input requires an atomic rebuild.

The fact layer stays factorized: radial `U_c` and altitude `V` data are
independent one-dimensional tables. It must not materialize a resident
`U_c * V` table or invent an around-shell coordinate. The modeled
`17,552`-byte fact block is not, by itself, a complete scattering-field
allocation.

### Required Cache Contract Before Physical Output

Phase 2's candidate is a factorized scattering cache, not a fact store that
evaluates transport on demand. Its shell fact block is configuration,
identity, and construction input; the candidate must retain the
source-specific factorized scattering payload required by the selected pure
order recurrence:

```text
J1 -> L1 -> J2 -> L2 -> ... -> Jk
```

Each next `Jk` must consume the preceding pure `L(k-1)` radiance, and a
cumulative result is derived without feeding cumulative values back into a
later order. The Phase 2 manifest must bind this existing cache contract to
the new shell/Native-48 representation by naming the retained and returned
physical quantities, payload layout, construction versus query-time work,
exact resource and construction-peak equations, direct continuous oracle,
held-out case matrix, numerical/display metrics, and acceptance/rejection
limits. Phase 1's fixed direct-primary response bank is not a substitute for
this implementation oracle.

### Integration Boundaries

Geometry owns conversion from world inputs to the source-relative query
packet, `distanceFromSource`, exact ray length, and ground/cap/rim/exit
classification. The cache uses the distance only to select a shell-held light
scale. It must reuse the pinned `LocalPointSun` continuous evaluator and
direct-primary transport owner as CPU references rather than reimplementing
source or geometry physics. Atmospheric illumination and renderer endpoint
lighting remain separate consumers of the configured source/cache facts.

### Reusable Prior-Cache Mechanics

The earlier local J2 cache may be inspected only for explicitly pinned
implementation mechanics. Its useful patterns are: typed scalar-spectral
packets and storage, descriptor/identity validation before construction,
separate cache-builder versus direct-oracle calculations, direct-primary
`L1` directional sampling, and pure-order recurrence:

```text
J1 -> L1 -> J2 -> L2 -> ... -> Jk
```

Each `Jk` consumes only the preceding pure `L(k-1)` radiance. Cumulative
fields are derived after pure-order construction and never feed the next
order. Ground participation, if applicable, must use the selected current
ground contract at every relevant order. These mechanics may be adapted only
after they are enumerated and hash-pinned by the Phase 2 manifest.

The previous local cache's `z`/`rho`/outgoing-angle topology, 512-direction
construction choice, local source frame, observer-dome behavior, provisional
J2 payload, and historical outputs are not authority for this phase. Phase 2
must derive its source-relative shell lookup, exact whole-world boundary
behavior, direction domain, payload, and acceptance limits from its new
manifest and independent oracle.

### Concrete Execution Plan

Phase 2 executes the following ordered CPU work packages. Each package has
focused tests and a fresh immutable run; a rejected result preserves its
artifacts and blocks only the package that depends on it.

1. **P2.0 - Freeze the implementation manifest.** Create
   `local-sun-shell-cache-implementation-v1.json`, pinning `000234`, `000237`,
   the `N = 2,048` fact inputs, selected cache-contract field semantics,
   Native-48/W27/native-15 domains, source, geometry, transport controls,
   ground contract, source closure, test matrix, metrics, resource equations,
   and rejection rules. The manifest declares `JthroughN` as the public cached
   quantity and the established pure-order recurrence as the construction
   rule. It reuses the scalar directional-spectral layout: `x = direction`,
   `y = position`, `layer = wavelength`, one `R32F` scalar per texel. One
   48-by-4,374-by-15 field is therefore `12,597,120` bytes; binary64 CPU
   staging is exactly twice that per simultaneously live field.

   **Status: complete.** Accepted run `000239-local-sun-shell-cache-phase2-freeze`
   verifies the terminal artifacts for `000234` and `000237` before freezing
   the 19-input implementation closure. Its manifest identity is
   `local-sun-shell-cache-implementation-v1-sha256:f8e8b4af4459cb1d2d9b243ee39c33679f7d8185f5b33b71ad6605fbbf049eff`;
   its exact manifest SHA-256 is
   `367aed89db4f734415463ee0f4d177e46b8553b09d815fcd40b35f2006cdd33a`.
   Run `000238` remains a preliminary immutable freeze record that did not
   verify its parent terminal artifacts before freezing.

2. **P2.1 - Implement the immutable fact layer.** Add
   `ShellFactCache.js`, `ShellFactCacheDescriptor.js`, and focused tests under
   `src/local-sun-shell-cache-implementation/`. The descriptor creates one
   active source case's 2,049 `U_c` boundaries, 2,048 held light scales, and
   the shared 48-row `V` lookup. It exposes only geometry-fed shell and
   altitude stencils, validates its complete identity, and reports the exact
   `17,552`-byte fact-block accounting. It does not return scattering values.

   **Status: complete.** Accepted run `000241-local-sun-shell-cache-phase2-fact-tests`
   passes all three focused checks: the frozen N=2,048 fact bytes and arrays,
   exact half-open/higher-index internal-boundary ownership with endpoint
   clamp, and Native-48 binary64 density/stencil rows. Run `000240` is a
   retained rejected diagnostic that exposed the corrected one-ULP boundary
   tie bug. No scattering field or deciding physical sample was constructed.

3. **P2.2 - Implement the factorized CPU scattering-cache surface.** Add
   `LocalSunShellScatteringCache.js` and `ShellHeldLightSource.js`. The cache
   accepts typed pure `Jk` and construction `Lk` fields, exposes only the
   cumulative `Jthrough4` field, and constructs the required pure recurrence.
   The `U_c` shell facts remain a separate source-light factor and do not
   become a resident `U_c * V` field.
   `ShellHeldLightSource.js` is a construction adapter: it substitutes the
   selected shell-held source scale while preserving the pinned `LocalPointSun`
   spectrum, source direction, clamp, and geometry packet. It must never
   substitute held light into the direct continuous oracle.

   **Status: retained v1 structural evidence, superseded by physical v2.** Accepted run
   `000242-local-sun-shell-cache-phase2-scattering-tests` passes both focused
   checks with stable sources and a valid artifact manifest: the construction
   adapter preserves the continuous source direction while replacing its
   scale, and the builder invokes exactly `J1 -> L1 -> J2 -> L2 -> J3 -> L3
   -> J4` before exposing cumulative `Jthrough4`. This is typed construction
   wiring only: it constructs no scored physical field and evaluates no
   deciding physical sample.

4. **P2.3 - Prove the factorization before scoring it.** The builder must
   retain a descriptor for every stored factor, its physical quantity,
   spectral basis, direction domain, construction/query dependency, and byte
   count. Resource accounting is the fact block plus the exact sum of live
   directional-spectral fields, where each R32F field is `12,597,120` bytes
   and each binary64 CPU staging field is `25,194,240` bytes. A focused
   structural suite proves that no resident factor is an undeclared `U_c * V`
   array, no around-shell axis is introduced, and every `Jk` consumes only
   pure `L(k-1)`. This is the required proof that the retained payload is a
   cache compatible with higher-order construction, not an on-demand
   transport evaluator.

   **Status: complete.** Accepted run
   `000244-local-sun-shell-cache-phase2-query-packet-tests` passes all three
   focused query-packet checks with stable sources and valid artifacts. It
   proves source-relative shell resolution and `V` lookup occur before cache
   lookup, and that the held-light factor is consumed without cache-side
   world-coordinate interpretation. Run `000245` is a duplicate accepted
   rerun. Accepted run
   `000246-local-sun-shell-cache-phase2-factor-descriptor-tests` completes
   P2.3 with typed Native-48/W27/native-15 descriptors, exact R32F and
   binary64 byte accounting, a pure-order dependency graph, and explicit
   absence of `U_c * V` and around-shell axes. Rejected run
   `000243-local-sun-shell-cache-phase2-factorization-proof` is retained as a
   superseded diagnostic, not a blocking result. It incorrectly invoked the
   field sampler directly and treated its absence of world/source coordinates
   as a cache-contract failure. The selected ownership boundary is earlier:
   `LocalPointSun.resolveSourceRelativePosition(position)` supplies exact
   `distanceFromSource` and direction, while the accepted flat geometry
   supplies altitude, boundary classification, and ray/path facts. The query
   adapter must combine those geometry-owned facts with the `U_c` shell lookup
   and `V` altitude stencil before it invokes the retained directional factor.
   P2.3 now implements that packet and verifies that the cache consumes the
   resolved factor without reinterpreting world coordinates.

   Accepted physical diagnostic run
   `000251-local-sun-shell-cache-phase2-physical-factorization-counterexample`
   shows that two queries at the same Native-48 altitude and the same
   source-relative outgoing role retain materially different normalized J1
   after inverse-square light scale is removed. Source distance changes source
   elevation and the source-transmittance path. The selected V-by-W27 field
   plus scalar U light factor has no coordinate for that dependence. This
   rejects v1's decision to discard the second physical position coordinate.
   It does not establish an additional distance-varying physical quantity:
   direction and path remain geometry variables. Accepted run
   `000253-local-sun-shell-cache-phase2-physical-freeze` supersedes v1 with a
   `z * rho` physical position domain and applies the held shell amplitude
   only while constructing J1 at each geometry-owned node. Query-time
   cumulative scaling is forbidden.

5. **P2.4 - Establish the direct CPU oracle and candidate comparison.** Add a
   direct continuous-light transport oracle by adapting the existing
   `withheld-direction-authority` path. It calls the pinned `LocalPointSun`
   and exact whole-world geometry without reading candidate payload, preserves
   the candidate-independent withheld-direction partition, and adds the
   closed Phase 1 source, shell-side, ground/cap/rim/exit, and
   scattering-order cases. Compare scalar spectral error first; apply E8/E2
   only as the named secondary display diagnostic. The builder and oracle must
   have independent accumulation paths.

   **Status: complete.** Accepted run
   `000252-local-sun-shell-cache-phase2-direct-oracle-tests` completes `810`
   scalar comparisons across all nine frozen sources, four whole-world
   classifications, two one-sided internal-shell cases, and 15 channels.
   Each candidate result differs from continuous authority by exactly the
   selected held/continuous light ratio. Earlier `000247` and `000250` are
   superseded: their typed spectral packets
   were incorrectly treated as numeric arrays, producing zero-length
   comparisons. `000252` fixes the adapter and is the first valid P2.4
   authority.

6. **P2.5 - Build through the selected maximum scattering order.** Construct
   pure fields in order, transport each pure `Jk` to `Lk`, derive cumulative
   `JthroughN` only after the pure fields exist, and validate that cumulative
   data never becomes recurrence input. Exercise omitted, zero, and nonzero
   ground boundaries at every applicable order.

   **Status: accepted bounded physical implementation and conformance.** Run
   `000248-local-sun-shell-cache-phase2-cpu-builder-tests` accepts the full
   48-by-4,374-by-15 allocation, pure recurrence, cumulative derivation, and
   three ground-routing modes under an explicit deterministic manufactured
   kernel and remains v1 mechanics evidence only. Corrected run
   `000254-local-sun-shell-cache-phase2-physical-cpu-tests` uses the physical
   source, atmosphere, geometry, primary transport, later-order scattering,
   and stored-field transport implementations to construct
   `J1 -> L1 -> J2 -> L2 -> J3 -> L3 -> J4` over a bounded `z2 * rho2`,
   Fibonacci-34/W3/native-15 fixture. It verifies cumulative identities,
   geometry-domain preservation, shell-only J1 amplitude substitution, and
   omitted, zero, and nonzero ground. The selected z19/rho15/W27 contract is
   implemented but its approximately 751 MB retained binary64 N4 build was
   not executed as a full-domain timing benchmark.

7. **P2.6 - Measure resource and lifecycle behavior.** Record fact bytes,
   factor bytes, final resident bytes, peak construction bytes, build time,
   identity equality, source/configuration invalidation, atomic replacement,
   cancellation/failure preservation, and disposal. A source or identity
   change must build a replacement cache completely before publication.

   **Status: accepted.** Run
   `000249-local-sun-shell-cache-phase2-lifecycle-tests` records modeled `17,552`
   fact bytes, `88,179,840` construction-factor R32F bytes, `12,614,672`
   final resident bytes, and a `75,600,272`-byte modeled binary64 peak. It
   accepts identity, invalidation, atomic replacement, preservation on
   cancellation/failure, and disposal for the superseded mechanics candidate.
   Corrected run
   `000255-local-sun-shell-cache-phase2-physical-resource-lifecycle-tests`
   accepts the physical resource families: `17,552` fact bytes, `74,795,400`
   R32F bytes per W27 J field, `581,400` per Fibonacci-34 L field,
   `300,925,800` for four pure J plus three pure L fields, `74,812,952`
   final resident bytes including facts, and `751,459,952` retained binary64
   CPU build bytes. It also accepts identity, invalidation, atomic
   replacement, cancellation/failure preservation, and disposal. Full-domain
   physical construction time and supported-hardware performance remain
   unmeasured and are not claimed.
   Accepted run `000258-local-sun-shell-cache-star-cpu-dome` closes the
   Star-object integration surface: the existing flat/local case constructs a
   bounded z19/rho2/Fibonacci-34/W3 `Jthrough4` cache, resolves cumulative
   position/direction stencils along every Star view path, disables the
   separate direct-primary loop because cached J1 is already present, and
   renders a retained subjective fisheye PNG. This is visual integration
   evidence, not selected W27 accuracy or supported-hardware performance.
   Runs `000256` and `000257` are superseded diagnostics.
   Accepted run `000259-union-glacier-shell-cache-subjective-scene` adds the
   intended ground-level subjective fixture: the frozen Union Glacier /
   Flat 0 finite source illuminates a perspective sky, ground, and three
   matte distance-reference boxes at 250 m, 3 km, and 30 km. Every object ray
   is shortened at its endpoint, cached atmosphere is integrated only over
   that physical segment, and endpoint color is attenuated by the resulting
   spectral transmittance. This fixture demonstrates atmospheric effects on
   distant objects; it does not model local geography or supply an accuracy
   oracle.
   Accepted run
   `000260-union-glacier-flat180-shell-cache-subjective-scene` generates the
   same fixture at the canonical Union Glacier Flat 180 time. It resolves the
   source through `LocationTimeController`, expands the bounded rho endpoint
   from the Flat 0 range to the actual `31.413 Mm` observer/source-subpoint
   distance, and derives matching subjective shell facts before construction.
   Its approximately `8.738 deg` source elevation and darker retained scene
   are therefore physical inputs, not an image rotation or radial clamp.
   Accepted run `000261` rerenders that unchanged Flat 180 scene at 384 by
   256 traced pixels and supersedes `000260` as the readable subjective
   artifact. It is a fresh render, not an upscale.
   Accepted run
   `000262-union-glacier-flat135-shell-cache-subjective-scene` holds the
   384-by-256 camera, boxes, endpoint composition, and cache dimensions fixed
   while selecting canonical Flat 135. Its actual `29.110 Mm` rho endpoint,
   matching shell facts, and approximately `9.417 deg` source elevation are
   retained. The still-dark horizon is an observed subjective result; its
   cause has not been attributed.
   Accepted run
   `000263-union-glacier-flat45-shell-cache-subjective-scene` repeats the
   unchanged high-resolution fixture at canonical Flat 45. Independent
   coordinate arithmetic and the physical local-Sun evaluator agree on the
   `14.194 Mm` observer/source distance; the source is `19.886 deg` above the
   flat horizon, is not radius-clamped, and has inverse-square incident scale
   `0.11436755656756563`. Its materially brighter horizon makes the lighting
   states visibly distinguishable.
   Accepted run
   `000264-union-glacier-flat0-shell-cache-subjective-scene` supplies the
   matching 384-by-256 closest-lighting baseline at `7.924 Mm` true source
   distance and `37.538 deg` elevation. It retains the same camera, boxes,
   cache dimensions, and endpoint composition and is visibly brighter than
   the 45/135/180 variants.
   Accepted run
   `000265-union-glacier-flat0-fov90-shell-cache-subjective-scene` changes
   only Flat 0's vertical field of view from 54 to 90 degrees. The additional
   upper sky includes the `37.538 deg` source elevation but remains pale
   rather than strongly blue, so framing alone does not resolve the observed
   color difference.
   Accepted run
   `000270-union-glacier-flat0-production-aligned-n4-shell-cache-subjective-scene`
   completes the production-domain CPU diagnostic with z19-by-rho15
   positions, Fibonacci-34 incoming radiance, W27 outgoing density,
   native-15 spectra, N4, production 15-interval controls, and the production
   RGB-band endpoint compositor. A position-invariant phase table removes
   repeated typed packet construction from J2-J4 while preserving the
   physical J2 fixture bit-for-bit. The binary64 cache build takes
   `147.14 s`; the 384-by-288 render takes `66.57 s`. This remains experimental
   CPU evidence and does not start P2.7 or change production.
   Accepted run
   `000271-union-glacier-flat180-production-aligned-n4-shell-cache-subjective-scene`
   repeats the identical production-domain N4 fixture at canonical Flat 180.
   Its source is approximately `8.738 deg` above the horizon at `31.413 Mm`
   horizontal offset. The binary64 cache build takes `154.76 s` and the
   384-by-288 render takes `63.42 s`; the retained result is materially darker
   and warmer than Flat 0, with charcoal upper sky and concentrated amber
   horizon brightening.
   Accepted run
   `000272-union-glacier-flat180-production-aligned-n4-camera180-shell-cache-subjective-scene`
   keeps that Flat 180 source, cache, ground, and sunward boxes fixed while
   turning only the camera azimuth by 180 degrees. The anti-solar image has
   nearly uniform charcoal sky and a neutral gray horizon, with no orange
   ring. The current production-domain CPU diagnostic therefore localizes the
   amber brightening toward the source bearing rather than around the whole
   scene.
   Accepted run
   `000273-union-glacier-flat180-production-aligned-n4-no-boxes-shell-cache-subjective-scene`
   restores the forward source-bearing camera and omits the three boxes
   entirely. The retained sky-ground image exposes the broad amber horizon
   glow without endpoint composition, confirming that the structure belongs
   to atmospheric transport.
   Accepted annotation-only run
   `000274-union-glacier-flat180-production-aligned-n4-sun-disk-marker`
   projects the frozen source center into `000273` at pixel `(192, 112)` and
   marks it with a red X. The projected disk center is horizontally central
   at `8.73779 deg` elevation.

   The resulting Flat 180 asymmetry is diagnostic only. Any candidate change
   to the selected Fibonacci-34 direction count, vectors, source-local
   orientation, generator, or integration weights must retain the current
   implementation as the comparison baseline and rerun and rescore the
   applicable comparison-paper evaluation before selection. Improved
   subjective appearance or mirror symmetry does not replace that comparison.

8. **P2.7 - GPU only after CPU acceptance.** Mirror the accepted typed
   factor layout in scalar GPU resources, preserve the CPU cache identity and
   recurrence order, and compare CPU/GPU factors, `JthroughN` queries,
   resource sizes, and lifecycle behavior before renderer or application work.

   **Status: accepted diagnostic conformance.** The implementation uploads the active source case's `2,049`
   equal-inverse-square shell boundaries as an R32F data texture and applies
   the containing shell's arithmetic-mean incident scale only while building
   GPU J1. Continuous source direction and source-path transmittance remain
   unchanged, and no query-time cumulative scale is applied. Authoritative
   self-contained run
   `000335-local-sun-shell-cache-phase2-star-gpu-conformance` constructs
   physical J1/L1 in GLSL, reuses the Star-local generic recurrence through
   J4, uploads no CPU field, and passes all `22,320` bounded scalar
   comparisons under the frozen R32F policy. Run `000325` is retained as
   invalid evidence because its launcher delegated implementation to
   production packages. Star-local physical v3 freeze `000336`, CPU
   conformance `000337`, and resource/lifecycle run `000339` replace that
   dependency.

P2.0 through P2.3 are construction and structural gates. P2.4 through P2.6
are deciding CPU evidence. P2.7 is a separate post-CPU conformance phase. No
package may substitute the old provisional local J2 cache as its oracle or
silently turn the fact block into the public scattering payload.

The requested stopping point is now reached at accepted P2.7.
Production/default source behavior remains unchanged; physical v3 is a
self-contained experimental implementation under `scripts/algorithm32-star/`.

### Evidence Order

1. Prove shell and Native-48 lookup, identity, bounds, and atomic rebuild
   behavior with focused tests.
2. Build the readable binary64 CPU candidate and compare it with the frozen
   continuous-source/direct-transport oracle on predeclared source, position,
   ray, boundary, and scattering-order cases.
3. Record spectral, display-referenced, resource, construction-peak, and
   lifecycle evidence in new immutable runs.
4. Only after CPU acceptance, implement a GPU acceleration of the accepted
   calculation and compare CPU/GPU fields, completed rays, resources, and
   lifecycle behavior before any renderer or application review.

No Phase 2 run may import production modules, application code, sealed parity
payloads, or historical provisional local-cache results as its numerical
authority. It follows the Star engineering-lane lifecycle and remains subject
to separate CPU/GPU, lifecycle, resource, application, official-experiment,
and production-promotion decisions.

## Later Implementation Handoff

Only a later implementation phase may expose `shellCount` as a setup
parameter. It must:

- derive the same inverse-square boundaries;
- consume geometry-owned source-relative query facts;
- reject a configuration whose family-wide inner width is below `1.5 m`;
- include shell count and all cache-relevant inputs in identity;
- rebuild atomically when those inputs change; and
- receive separate CPU/GPU, lifecycle, resource, application, and production
  approval.

This characterization does not modify production.

The completed balanced-quadrature trials do not change that boundary.
Unrotated Lebedev-38 run `000275` scored a defective orientation with 12
nodes and `26.6667%` of total weight exactly on the flat horizon; Flat180 run
`000276` consequently saturated through later-order growth. The corrected
cube-diagonal rotation was chosen from node geometry alone, gives a minimum
`abs(localZ)` of `0.24732126143424193`, and preserves antipodal closure and
zero first moment under a fresh identity. Flat N2/N4 runs `000294` and
`000295` reduce mirror RMS from `15.46215` / `42.08325` to
`5.05973` / `8.15926` without gross growth. Paper run `000296` and score
analysis `000297` improve B1 RMSE from Fibonacci-34's `11.925783` to
`11.758052` but worsen B2 RMSE from `2.629376` to `2.842668`, with worse
B2 bias and worst residual as well. The corrected candidate fails the
predeclared head-to-head selection rule and is not selected. Production and
default paths remain Fibonacci-34. Another balanced rule or higher-order
convergence study requires a fresh identity and the same full paper gate.

The next fresh trial tested whether the cube-diagonal rotation had removed
too much grazing coverage. A score-independent five-degree rotation about the
positive cube diagonal keeps the 12 formerly horizontal nodes within
`0.78 deg` to `3.92 deg` of the horizon without leaving any at exact zero.
N2 run `000298` remains below the display rejection limits, but N4 run
`000299` grows to a pale clipped sky. Derivative run `000300` measures
`50.703%` near-white and `34.624%` exact-white upper-sky pixels, exceeding
the retained `50%` / `25%` gross-clipping limits. The candidate therefore
fails before the paper gate; no B1/B2/B3 boundary is generated for it.

The subsequent paired-Fibonacci family removes orientation search as the
primary variable. Counts `34, 38, 42, 46, 50` were frozen before output; each
contains `N / 2` equal-area source-local Fibonacci directions and their exact
antipodes. Renderer runs `000301` through `000310` find only count 34 both
stable and low-asymmetry through N4. Count 38 crosses the exact-white clipping
limit; counts 42, 46, and 50 remain below that hard limit but retain large N4
mirror residuals.

Paper boundaries `000311` through `000314` and accepted analysis `000317`
select paired Fibonacci-34 under the frozen B1-first rule. Its B1 RMSE is
`11.769137`, versus production Fibonacci-34's `11.925783`; B2 RMSE is
`2.705527` versus `2.629376`. Higher paired counts worsen both the B1 curve
and the Flat 0 asymmetry instead of converging monotonically. Paired
Fibonacci-34 is therefore the selected experimental candidate for any future
promotion study, but production remains unchanged. P2.7 diagnostic
conformance is accepted separately in self-contained run `000335`.

## Current State

Step 1 is complete. The frozen manifest is
[`base-fact-family-v1.json`](local-sun-shell-cache-inputs/base-fact-family-v1.json).
Its family identity is
`local-sun-base-fact-family-v1-sha256:221f587130ef9664a2593e1dd8c96dc9709c4e9c67f38d4342d941ccace3f61d`;
the exact manifest bytes have SHA-256
`72cf2dd8cc9cf0b9c6388331202c0d4c354eb6c77feb4b0743e3557703bb3160`.

The manifest retains the derived binary64 `r_min`/`r_max` and clamp proof for
all nine source cases, packed fact schema, Native-48 adaptation, geometry
query packet, arithmetic-mean shell-light rule, fixed response projection,
bounded qualification and deciding matrices, result schemas, count ladder,
two stops, immutable run policy, and 36-file executable/immutable input
closure. Mutable current-state documents are authority locators rather than
family content pins, avoiding a circular family change when status is
refreshed.

Focused run
[`000221`](../../../../scripts/algorithm32-star/runs/000221-local-sun-shell-cache-family-tests/report.md)
is accepted with all 8 tests passing, stable sources, zero deciding samples,
zero cache fields, zero GPU/browser/render work, and a valid terminal
artifact manifest. Rejected run `000207` retains the first one-ULP assertion
diagnostic; accepted runs `000208` through `000215` retain pre-final family
iterations. Run `000211` failed before qualification when its new command
changed a pinned package file; it has no deciding output. Runs `000217` and
`000220` retain pre-final deciding-runner diagnostics and do not belong to the
final ladder because their record/lifecycle contract was superseded before
the final source closure was frozen.

Step 2 is accepted in
[`000222`](../../../../scripts/algorithm32-star/runs/000222-local-sun-shell-cache-step2-harness-qualification/report.md).
All 92 frozen nondeciding records pass: 18 retained Stage 1 geometry
fixtures, 20 Stage 2 geometry/direction records, nine source-relative anchor
transforms, and 45 normalized direct-primary response-bank records. Native-48,
shell/width, and bounded-generator structural controls pass. Every response
bank record also passes the pinned E8 projection, E2 ITP identity, and strict
uncertainty-inclusive `< 1` check. Sources remain stable, and every
deciding/cache/GPU/browser/render/application/production counter is zero.
Accepted runs `000213`, `000214`, `000216`, and `000219` are retained prior
qualification executions; `000222` is the complete authority for the final
manifest above.

Step 3 is complete. Each deciding count received a fresh immutable run that
verified this final manifest, the accepted `000222` qualification, and its
complete predecessor before evaluating only the frozen radial/response
matrix. The completed ladder is `N = 1, 2, 4, ..., 2,048` in runs `000223`
through `000234`. Runs through `N = 1,024` are complete rejected
characterizations. Final run
[`000234`](../../../../scripts/algorithm32-star/runs/000234-local-sun-shell-cache-n-2048/report.md)
is the first passing tested count: all 41,445 records pass, maximum total
`Delta E_ITP = 0.8790355418118457`, p99 `0.2438788047293341`, p95
`0.04518726750984048`, and perception-limit margin `0.12096445818815427`.
Its sources are stable and terminal artifact manifest valid. The
`perceptual-limit-reached` stop ends the frozen ladder; it does not claim
that `2,048` is the smallest passing integer count.

Step 4 closeout is accepted in
[`000237`](../../../../scripts/algorithm32-star/runs/000237-local-sun-shell-cache-family-closeout/report.md).
It verifies every retained Step 3 terminal artifact, reconstructs the
authoritative predecessor-linked final ladder, retains the complete
count/error/memory curve and final-five table, and records the scoped claim
boundary. It performs no new physical evaluation or cache, GPU, browser,
render, application, or production work. Runs `000235` and `000236` remain
retained superseded closeout diagnostics because the former omitted the
readable family identity and the latter lacked the required rendered report.

Runs `000205` and `000206` remain prior-family evidence only. They do not
satisfy this plan, select its fact representation, or authorize continuation
of their DirectJ2 procedure. The genuinely prior sparse-topology plan remains
historical at
[the archived sparse-topology plan](archive/local-sun-shell-cache-experiment-plan-sparse-topology-v1.md).
