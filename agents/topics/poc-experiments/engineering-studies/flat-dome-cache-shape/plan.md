# Flat Dome Cache Shape: Slice-Count Study

Status: execution selected; M1 in progress. The execution record and status own measured progress.

## Outcome and Scope

Determine how many sample-to-dome-distance slices the new cache needs, and
report the accuracy, actual cache size, and construction performance at each
count. Give the owner real color swatches across dome distances and altitudes
for the new cache, independent probe, and libRadtran. This is an exploratory
implementation and measurement plan; preparing it does not authorize execution.

The [design](design.md) owns the fixed North Pole-centered dome, finite ground
disk, sample coordinate, and accuracy-guide contracts. The [status](status.md)
owns the resumption point. The source root is
`experiments/flat-dome-cache-shape/`; all generated artifacts, including reports,
builds, solver streams, and swatches, remain below the experiment's ignored
`tmp/experiments/flat-dome-cache-shape/` output root. Production and earlier
experiments are read-only. No runtime production integration is included.

The owner selects the quadratic distribution for this first study. Other
exponents, uniform distributions, slope-derived distributions, and adaptive
placement are deferred. This study measures slice-count effects with the
spacing formula held fixed; it does not search all possible cache shapes.

## Starting Point and Consequential Assumptions

- The isolated scaffold, folder mapping, empty ignored output root, and local
  type-check configuration exist. No physical result or cache candidate exists.
- Production's source-centered slab/cylinder cache and observer-centered view
  dome do not represent the required fixed boundary. Use them only as labeled
  controls, never as the dome's accuracy authority.
- Reuse the existing cache-free independent probe and libRadtran installation.
  Pin their exact sources, inputs, versions, and relevant earlier evidence.
  The probe needs a dome-aware adaptation inside this new source root. Its
  reference path must not call candidate indexing, interpolation, or cache code.
- The recovered shallow cap with approximately 20,015,114.442035925 meters disk
  radius and 100,000 meters apex is the initial baseline to authenticate. Pin
  exact values and optical/source profiles in M1; these are baseline choices,
  not a claim that the owner selected every recovered numerical constant.
- Changing Sun distance from the North Pole can require a distinct physical
  cache configuration. Do not infer arbitrary translation symmetry from the
  current production cache. Prove rotation/reflection and directional handling.
- libRadtran comparisons require a declared physical match. Establish whether
  the installed solver can express the finite-source cap; otherwise retain
  its closest useful supported guide cases with explicit geometry differences,
  alongside physically matched controls. Do not score those differences as
  cache interpolation error or silently omit the requested third column.

## Fixed Distribution and Count Matrix

For N nominal slice nodes, including both endpoints:

```text
u_i = i / (N - 1),                 i = 0 ... N - 1
d_i = d_max(z) * u_i^2
```

`d_i` is the shortest Euclidean distance from the atmospheric sample to the
finite curved dome surface. It is not observer distance, disk-rim distance,
vertical clearance, or ray exit distance. `d_max(z)` is the maximum valid
sample-to-dome distance at altitude z under the pinned geometry. Derive and
verify it and the inverse position mapping before constructing nodes. For an
axisymmetric shallow cap, the expected maximum for in-atmosphere altitudes is
the axis clearance H minus z; treat that as a check to prove, not an unchecked
formula for arbitrary future dome shapes.

Quadratic spacing concentrates nodes near the dome surface and widens them at
greater clearance. Do not claim it automatically enforces the earlier
slope-spacing hypothesis in every physical coordinate. Other distributions
remain deferred unless the owner subsequently selects them.

The initial nominal counts are **2, 4, 8, 16, 32, and 64**. N counts slice nodes,
not intervals: there are N minus 1 intervals. Report the N requested slice
planes, actual valid spatial-node total, and actual node/memory increase
relative to production. The existing cache has no dome-distance axis, so do
not claim it already supplies one physically correct slice of the new field.

At a given altitude/Sun-distance row, some dome distances can be geometrically
unreachable. Omit invalid combinations with an explicit valid-domain rule;
never clamp them into apparently valid samples. At a collapsed domain, such as
the apex or a source/map-center degeneracy, deduplicate coincident nodes and
report effective counts. Do not force N distinct nodes into zero width.

M1 must demonstrate interpolation coverage after this omission, especially
for N=2 and N=4: a valid query must have supported reconstruction, not an empty
row or an invented bracket. Define boundary-aware reconstruction explicitly.
If supplemental boundary nodes are necessary, use one declared policy across
counts, report their actual number/storage/build cost, and distinguish nominal
quadratic slices from that support. Do not rescale the selected formula per
row, extrapolate silently, or hide missing support with direct-solver fallback.
A count that cannot represent the valid query domain is reported as a failed
candidate with its counterexample, not assigned fabricated accuracy numbers.

Keep spectral channels, optical medium, source inputs, scattering orders,
base altitude and directional sampling, stored physical quantity, interpolation
rule, precision, packing, and hardware fixed across the primary count sweep.
If another change is required, identify a new comparison series instead of
attributing its gains to slice count. Improving the builder is a later phase,
not a hidden simultaneous variable.

Once an accuracy crossing is bracketed, try intermediate counts with the same
formula, for example 12 between 8 and 16 or 24 between 16 and 32. If 64 is still
improving without meeting a useful error tier, assess a larger count using the
pilot's measured cost and actual device capacity. Sixty-four is a starting
sweep endpoint, not an arbitrary resource veto or scientific success criterion.

## Physical Cases and Swatch Matrix

Freeze a common physical benchmark matrix before candidate results are used
to choose counts. Reuse the same cases and reference calculations for every N;
keep tuning cases separate from held-out cases. Do not compare each cache only
at its own node positions.

Use development cases to refine counts and identify a provisional recommendation.
Freeze the resulting count list and recommendation before evaluating the final
held-out matrix once for the per-count report. Do not repeatedly tune against
held-out results. If those results change the recommendation, disclose the
selection and use a fresh confirmation subset rather than relabeling reused
validation cases as untouched evidence.

The initial altitude panel is **2 m, 100 m, 1 km, 5 km, 10 km, 20 km, and 40 km**.
Include exact ground, apex, rim, and outside-atmosphere cases as separate
boundary controls. At each panel altitude choose common physical sample-to-dome
distances spanning the surface approach, shallow interior, middle, and maximum
valid clearance. Use fractional clearances such as 0, 0.001, 0.01, 0.05, 0.1,
0.25, 0.5, 0.75, and 1 times the valid maximum as initial placements; retain
absolute distances in meters and add non-grid held-out points. Authenticate
sample reachability for the pinned Sun position. A requested unreachable
combination is labeled unavailable rather than represented by a color.

Sample representative Sun/map-center offsets from the pinned application
physical model. Start with one configuration in M2, then cover at least three
representative offsets in the deciding sweep. Keep the source height and
source photometry fixed unless the series explicitly studies another source
configuration. Include reflection pairs and rigid rotations as symmetry
controls, near-grazing and zenith rays, Sun-facing and away-Sun directions, and
rays entering the atmosphere from outside. Every listed case has exact physical
origin, direction, source, boundary, units, and provenance.

For subjective comparison, use the same standardized viewing rays starting
at selected physical sample positions, integrating through the bounded
atmosphere. Swatches represent diffuse spectral path radiance, not a local
scattering density passed off as a sky color. Exclude terrain radiance and the
direct solar disk from the primary plate; label any supplemental full-scene
or source-transmission visualization separately.

Each slice-count panel contains altitude groups and rows labeled with actual
sample-to-dome distance and viewing direction. Its three method columns are:

1. New cache at the stated N and quadratic distribution.
2. Independent cache-free probe for the identical physical ray.
3. Actual libRadtran output for that case or its explicitly identified guide
   case, with physical-match status visible beside the color.

In addition, show a compact slice strip of valid node positions at each
altitude and representative off-node swatches. This makes slice locations and
interpolation differences inspectable without substituting node-only evidence
for held-out accuracy. Use the same physical comparison rows across N panels.
If output becomes large, group linked plates by N, altitude, and source
configuration; do not silently drop rim, dark, or high-altitude cases.

All methods use one pinned spectral-to-XYZ-to-sRGB conversion and the same
predeclared exposure/display transform for a panel series. No per-method,
per-count, or per-cell normalization, auto-exposure, white balancing, saturation
adjustment, or fitted reference correction. Keep the main display exposure
fixed across the primary series; an additional explicitly labeled common
exposure may reveal dark cases. Retain raw spectra, linear RGB/XYZ, displayed
RGB triplets, clipping/gamut flags, spectral coverage, and conversion identity.
Do not fabricate missing spectral bands or use three arbitrary wavelengths as
if they were a complete color spectrum. Match spectral definitions first.

Generate swatch pixels from the calculated physical results using normal
numeric/image tools. These images are essential evidence of actual color
appearance; never use image generation, illustrations, or guessed colors.
Missing/failed solver cases are text statuses, not fabricated swatches. The
three-method swatch obligation stays explicitly incomplete until actual
outputs are present, or the report identifies the remaining unavailable cases
and their cause without claiming a complete matched comparison.

## Measurements and Recommendation Rules

For every candidate N and physical configuration, report:

- Nominal/effective slice count, valid node count, packed GPU bytes, retained
  CPU bytes, and size growth relative to the existing cache control.
- Total cold-field construction time, separating CPU preparation, GPU work,
  packing/upload, and shader compilation where observable. Distinguish elapsed
  wall time from GPU timing and report timing proxies honestly.
- Peak temporary and total owned memory, device limits actually encountered,
  upload cost, and representative lookup time. Do not report nominal scalar
  payload alone as the complete cache size.
- Absolute and relative spectral errors, per-order J1 through J4 and cumulative
  Jthrough4, source transmittance, and reconstructed view radiance. Pin the
  recurrence/order convention and compare equal truncation; all-orders probe
  results are additional evidence, not a mislabeled J4 comparison.
- Physical luminance and chromaticity differences, and a documented color
  difference metric such as Delta E 2000 under one fixed white/display policy.
  Color metrics supplement raw radiometric error, not replace it.
- Median, p95, and maximum errors, the worst-case identities, and separate
  center/rim/grazing/altitude/source strata. Report errors against each guide
  separately and differences between the guides themselves; do not average
  the two references into synthetic truth.

Define the primary spectral view-radiance error as integrated absolute spectral
error divided by integrated absolute reference radiance, with explicit
wavelength weights and a pinned dark floor. Select the floor using the
reference-only matrix before candidate inspection; always report corresponding
absolute errors and separate dark cases. Freeze the exact metric, units,
case weighting, and uncertainty handling in M1. Monte Carlo confidence
intervals and libRadtran convergence must be small enough to distinguish the
count differences being interpreted. An unresolved comparison is inconclusive,
not a pass or a failure.

The reference compatibility table must be per observable as well as per
physical case: specify each guide's supported scattering orders, cumulative
order, source transmittance, spectral coverage, and reconstructed radiance.
Exclude unmatched-geometry or all-orders-only results from incompatible J4
cache-error tiers while still displaying their qualified actual guide swatches.
Every reported tier names the applicable guide and observable that supports it.

Separate total physical error from error attributable to slice count. Before
interpreting a plateau or a tier crossing, perform a small separately labeled
diagnostic refinement of non-slice controls such as altitude/direction
resolution, quadrature, or packing precision. Keep quadratic placement fixed.
If those controls dominate, report the floor and resolve its cause before
claiming that more slices are useless. Diagnostic series do not silently
replace the fixed controls of the primary count comparison.

There is no owner-selected numeric error ceiling yet. Provide engineering
comparison tiers of **0.5%, 1%, 2%, and 5%** for primary p95 radiance error,
with worst cases and uncertainty visible beside each. These tiers describe
tradeoffs, not new owner-approved accuracy requirements. Identify the smallest
measured count meeting each supported tier, the non-dominated size/build/error
choices, and the point where additional slices give little improvement. Refine
between tested counts when the likely decision changes. Never claim a globally
optimal count from a sparse sweep or a count below reference resolution.

Use one timed build per candidate during discovery, clearly labeled as such.
Repeat non-dominated candidates and adjacent counts at least three times to
report median/range and cold/warm-program effects. Never reuse the computed
field as a supposed fresh build. Reference calculations may be reused across
counts if geometry, medium, source, direction, spectral/order semantics, and
reference implementation remain identical. A relevant change invalidates only
the affected reference cases; preserve their original evidence.

## Milestones

### M1 - Frozen Geometry, Cases, and Comparison Contract

Purpose: resolve the largest uncertainties before an expensive cache sweep.

- [ ] Pin boundary/medium/source inputs and historical derivation identities.
- [ ] Prove stable dome intersection, finite-disk ground, sample-to-dome distance
  and inverse mapping, valid domain, outside intervals, and reflection handling.
- [ ] Demonstrate lookup coverage after invalid-node omission, including coarse
  counts, and define/count any required boundary support without rescaling
  the selected quadratic placement or hiding missing samples.
- [ ] Identify the exact independent-probe entry point; specify its isolated
  dome adaptation and reference-only convergence/uncertainty checks.
- [ ] Inspect installed libRadtran capabilities and pin the solver/case decks
  for exact matches and explicitly qualified guide/control comparisons. Do not
  install dependencies or modify the shared tool/old experiment as a shortcut.
- [ ] Register guide applicability per observable, scattering order, spectrum,
  and transmittance/radiance quantity; identify which results may support tiers.
- [ ] Freeze count semantics, quadratic placement, physical and held-out cases,
  stored quantities, J1 through J4 conventions, metrics, dark floor policy, display
  conversion, exposure, and swatch/report schema.

Deliverables: pinned input/case manifest, coordinate/boundary proof report,
reference compatibility table, forecast node/storage counts, and a concise M1
report. Analytic proofs may proceed while solver compatibility is inspected;
both must resolve before claiming a matched three-method pilot.

Completion: the first physical cases are reproducible, the coordinate is
sufficient or a precise limitation is identified, and each guide's role is
explicit. If the coordinate is insufficient, report the counterexample and
minimum needed correction before any broad sweep; do not build misleading
fields to fill the matrix.

Estimate: roughly 1?3 hours of investigation/preparation, with substantial
uncertainty in recovered inputs and solver geometry support. Numerical/reference
cost remains unknown until M2. These are planning estimates, not stop limits.

### M2 - Small Working Slice and First Three-Method Swatches

Purpose: demonstrate the physical comparison and measure real cost early.

- [ ] Implement the minimal dome-aware candidate and independent probe adaptation
  inside this experiment, with ambient types and self-verifying proof runners.
- [ ] Use the existing libRadtran installation through an experiment-owned case
  adapter. Keep all new generated solver inputs/outputs below this lane's run
  root; if the shared CLI owns a different output root, derive an isolated
  adapter here rather than editing it or losing the declared output boundary.
- [ ] Implement real-path containment, monotonic run allocation, derivation
  manifests, and append-only progress at transitions and every 30 seconds for
  operations expected to exceed one minute. Type-check authored code.
- [ ] Build N=2 and N=4 with the same formula and a small, representative subset
  of altitudes, clearances, and directions; establish J1 and a higher-order
  comparison before extrapolating total cost.
- [ ] Publish the first actual cache/probe/libRadtran swatch plate and numeric
  table promptly, with uncertainty, match status, display settings, timings,
  memory, and any unfilled comparison cells visible.

Deliverables: runnable pilot, physical raw output, early three-method swatches,
error/timing/memory table, and M2 report. No numerical implementation or solve
is performed merely to prepare this plan.

Completion: outputs are finite and attributable to actual calculations, no
candidate/reference lookup code is shared, boundary/vacuum controls agree,
and the pilot supports defensible estimates. Failed candidates produce useful
failure evidence; repair the affected portion into a new run rather than
restarting the whole study. If libRadtran cannot reproduce the physical dome,
retain clearly labeled actual guide swatches and matched controls; the report
must state that exact three-method dome equivalence remains unestablished.

Estimate: several hours of implementation is plausible; solve duration, GPU
memory, and reference sample counts are unknown. Use measured per-node/per-order
build cost and per-case reference uncertainty from this pilot to estimate M3,
and record that estimate before beginning the full matrix.

### M3 - Slice-Count Accuracy and Performance Sweep

Purpose: measure how much accuracy each extra slice buys at its actual cost.

- [ ] Execute counts 2, 4, 8, 16, 32, and 64 with quadratic placement and frozen
  controls. Cover the agreed altitudes and valid clearances, at least three
  representative Sun offsets, J1 through J4 and cumulative scattering, and development
  view/direction cases. Keep boundary and symmetry controls in the results.
- [ ] Produce per-count numerical tables and three-method swatch plates as
  results arrive. Reuse authenticated reference outputs across N.
- [ ] Add intermediate counts around supported accuracy-tier crossings and
  the size/time/error tradeoff knee using development cases. A larger endpoint is an allowed follow-on
  when the data support it and actual allocation remains feasible.
- [ ] Diagnose non-slice error floors in a separate small refinement series
  before interpreting a plateau or threshold crossing.
- [ ] Freeze the final count list and provisional recommendation, then evaluate
  the held-out matrix once across counts for the final per-count report. If
  validation changes the selection, disclose it and use fresh confirmation.
- [ ] Measure repeat-build statistics for non-dominated and neighboring counts.
  Investigate non-monotonic errors, packing discontinuities, reference noise,
  and GPU precision before interpreting apparent improvements.
- [ ] Keep all unsuccessful/failed/interrupted runs immutable. Do not tune to
  held-out points or change display normalization to improve appearance.

Deliverables: full count/physical-case CSV and JSON, reference provenance,
per-count swatch plates, device/timing/memory evidence, refinement comparisons,
and M3 report separating observations from interpretation.

Completion: every requested count has measured results or an explicit concrete
failure, enough neighboring counts resolve the recommendation to a stated
precision, and subjective panels cover the requested methods, altitudes,
and sample distances. Missing reference precision or physical-match coverage
remains explicitly inconclusive rather than becoming a favorable score.

Estimate: update from M2 before execution. Dominant unknowns are retained-field
size, higher-order build scaling, and probe/libRadtran uncertainty per case.
Time alone is a review point, not grounds to discard productive evidence.
Reduce redundant cases or stage the matrix only with documented coverage;
never silently omit the difficult regimes or change the accuracy question.

### M4 - Owner-Readable Results and Slice Recommendation

Purpose: make the count decision assessable numerically and visually.

- [ ] Produce a standalone HTML report with selectable numeric tables and real
  side-by-side swatches, plus a concise Markdown result summary and CSV/JSON.
  Save the generated HTML/images/data under a new finalized run and link from
  the owning status; retain reports from earlier milestones unchanged.
- [ ] Provide a summary row per N: spacing formula, actual nodes/bytes, build
  time and repeats, spectral/luminance/color errors, worst cases, uncertainty,
  reference match status, and links to its altitude/distance swatch panels.
- [ ] Show storage and build-time tradeoffs against accuracy, the tested minimum
  for each supported tier, and recommended count(s) with residual risks.
  Present graphs only where they reveal those relationships; keep labels and
  numeric results in searchable text/tables rather than screenshotting prose.
- [ ] Identify differences between probe and libRadtran, untriggered follow-ons,
  unresolved cases, and whether more slices are still useful. The owner may
  prefer a measured color/size/build compromise over the automatic tier pick.
- [ ] Verify final artifact identities, derivation, containment, progress/terminal
  manifests, reproduction commands, local types, and durable resumption state.

Completion: the report answers how many slices were tested, their accuracy and
cost, and which count is supported by which evidence. It contains actual
new-cache/probe/libRadtran swatches with honest scope labels. A supported
negative or inconclusive result is valid, but cannot be described as an
accepted optimal slice count. Production promotion remains a separate task.

Estimate: roughly 1?2 hours of report/verification work after measurements;
extra reference refinement is conditional and must be estimated from M3.

## Evidence, Progress, Recovery, and Reports

Use the design's immutable run contract. No run is allocated during planning.
The first evidence-bearing execution uses `runs/00000-<name>/`, with subsequent
strictly increasing sequences. Long operations write flushable progress events
at least every 30 seconds. Preserve commands, input/output hashes, tool/device
identities, parent evidence, transformations, seeds, and solver settings.

At each milestone publish a concise report linking deliverables, observations,
interpretation, uncertainty/limits, verification, disposition, and next action.
Send an update as useful numerical or swatch artifacts become available; do
not wait for the entire sweep. Maintain an execution record in this topic when
execution begins, keeping current state in status and chronology in that record.
After interruption, resume from finalized evidence and the recorded next action;
never reopen a sealed run. Diagnose and retry only affected portions in new runs.

Dedicated standards reviewers and independent audits remain disabled for this
contained experiment. The primary agent owns self-review, local type checking,
and the scientific/evidence checks. Checkpoint-adviser monitoring remains
active. The create-plan skill requires one read-only second-agent plan critique;
that critique does not authorize numerical execution or enable standards reviews.
No additional discretionary reviewer round is planned for ordinary refinement
already anticipated above. Material replanning follows the skill's critique rule.

## Deferred Follow-up

The owner proposes a later dense, evenly spaced slice study to fit a more
efficient placement curve. The [design note](design.md#deferred-follow-up-fit-a-distribution-from-dense-uniform-slices)
owns this idea and its validation conditions. It is not part of this plan's
execution sequence; quadratic spacing remains fixed throughout the current
count sweep.

## Plan Critique and First Executable Step

The required one-pass read-only critique was completed by a separate agent.
All four suggestions were incorporated: valid-domain interpolation coverage
and counted boundary support; diagnostic checks for non-slice error floors;
reference applicability by observable/order; and development-only count tuning
followed by frozen held-out validation and fresh confirmation if selection
changes. No suggestions were rejected, no distribution search was added, and
no additional review round or numerical execution was requested.

First executable step after execution is selected: pin the recovered dome,
existing probe identity, and libRadtran solver/physical-case compatibility in
M1, then freeze the common benchmark and color conversion. No implementation,
physical run, dependency installation, Git write, or production change has been
started by this planning request.
