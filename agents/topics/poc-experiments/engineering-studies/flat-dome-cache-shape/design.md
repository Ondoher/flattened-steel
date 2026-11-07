# Flat Dome Cache Shape Experiment Design

## Objective

Determine an accurate, compact scattering-cache representation for the fixed North Pole-centered atmospheric dome, including each atmospheric sample's Euclidean distance to the curved dome surface, slice spacing, interpolation, and valid transforms.

## Acceptance Question

Which cache coordinates and nonuniform slice distribution reproduce dome-bounded direct and multiple scattering with measured error, storage, build-time, lookup-cost, and transform-reuse tradeoffs?

## Isolation Boundary

Authored experiment work remains below `experiments/flat-dome-cache-shape/`. Generated output remains below `tmp/experiments/flat-dome-cache-shape/`. Production and other experiment trees are read-only inputs unless their write scope is separately authorized.

## Output and run rules

- `flat-dome-cache-shape` is the unnumbered `<slug>` identity defined by the skill's [folder-identity contract](../../../../../.agents/skills/start-experiment/SKILL.md#folder-identity).
- The experiment source root is `experiments/flat-dome-cache-shape/`. Authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests belong there.
- The experiment source root owns `jsconfig.json` with `allowJs`, `checkJs`, and `noEmit` enabled. Run its type check after authored code changes and self-review against the folder-mapped standards, including `types.md`. Dedicated standards reviewers, independent audits, and compliance-ledger gates are disabled under the repository experiment policy. Keep checkpoint-advisor monitoring active and complete the experiment's own scientific and evidence checks. A more-specific folder assignment may add standards guidance without enabling reviewers.
- The generated-output root is `tmp/experiments/flat-dome-cache-shape/`. Builds, caches, browser profiles, reports, captures, diagnostics, renders, logs, progress records, temporary files, and other generated intermediates belong only there and must remain ignored by Git.
- Derive repository, source, and output roots from the location of a checked-in repository marker rather than `process.cwd()`.
- Real-path-check every read and write boundary. Reject symlinks, junctions, reparse points, and any resolved path outside its declared root.
- Use a new `runs/<sequence>-<name>/` directory for each evidence-bearing execution. `sequence` is exactly five decimal digits followed by `-`; `name` is descriptive kebab-case and is limited to 16 characters, excluding the `#####-` sequence string. Allocate the next sequence within this experiment only, never fill a gap or reuse a sequence, and reject malformed prefixed entries. Never overwrite or reopen a completed run. Copy or derive reused material into the new run and retain its source identity.
- Record the command, inputs, relevant configuration, implementation revision or hashes, tool/runtime versions, environment facts that affect the result, parent artifacts, derivation operation, and resulting artifact identities.
- Finalize a run with an explicit terminal state: `accepted`, `rejected`, `failed`, or `interrupted`. Publish its terminal manifest only after all artifacts are closed and hashed.
- A verifier may read the run it validates but must not mutate it. Corrections and retries create a new run.
- Keep production and other experiment trees read-only during experiment execution unless the engineer explicitly expands the write scope.

## Monitorable progress

Every operation expected to run longer than one minute writes UTF-8 JSON Lines to:

```text
tmp/experiments/flat-dome-cache-shape/runs/<sequence>-<name>/progress.jsonl
```

Append one event at process start, every phase transition, at least once every 30 seconds while active, and at terminal completion or failure. Flush each event so another process can tail the file while the operation runs. Each event contains:

```json
{
	"timestamp": "2026-09-04T12:00:00.000Z",
	"phase": "compute",
	"completed": 24,
	"total": 100,
	"message": "Processing sample batch 24 of 100."
}
```

`timestamp`, `phase`, and `message` are always required. Include `completed` and `total` when work is countable. Terminal events additionally include `state` with one of the allowed terminal states. Do not place secrets, credentials, or unnecessary personal data in progress records.

## Decisions

### Required physical behavior

The atmospheric boundary is fixed in the North Pole-centered map frame. Its
curvature must affect view paths, source attenuation, direct scattering, and
every multiple-scattering order. The ground is a finite disk. An outward ray
at the atmospheric surface immediately enters vacuum; a ray directed inward
may traverse atmosphere. The boundary is transparent, with no invented rim
wall. After atmosphere exit, light retains the complete distance and direction
to its finite source for inverse-square falloff and source-size calculations.

These are owner requirements. Existing production behavior and historical
documents are comparison evidence, not authority to omit them. A visually
clipped view sampling a slab-derived field does not meet the requirement.

### Initial boundary baseline to pin

Recover the historical North Pole AEQD frame and shallow spherical cap as the
initial comparison input: disk radius approximately 20,015,114.442035925 meters,
apex 100,000 meters, horizontal center at the projection origin, ground at zero
altitude. Record the exact profile, source revision, equation, units, medium,
and numerical realization before a deciding run. These recovered numeric
values are a starting baseline, not newly claimed owner selections.

For horizontal map radius r, disk radius R, and apex H, the recovered equation
is:

```text
centerZ = (H^2 - R^2) / (2H)
sphereRadius = (H^2 + R^2) / (2H)
capHeight(r) = ((R-r)(R+r)) / (sqrt(sphereRadius^2-r^2)-centerZ)
```

The factored height form avoids subtracting large nearly equal quantities.
Boundary intersection needs its own stable binary64 and binary32 treatment;
do not assume the present shader's naive quadratic is accurate for a shallow
world-scale cap. Establish exact rim/apex/tangent/contact classifications.

At the rim this cap meets the ground. An elevated observer can therefore be
outside the atmosphere. Support vacuum-only rays, outside-to-inside intervals,
and outside-to-atmosphere-to-vacuum paths without treating the observer as
necessarily inside or allowing ground outside the disk.

### Coordinate hypothesis

For each atmospheric sample, investigate altitude, horizontal distance from
the Sun's subpoint, and the shortest Euclidean distance from that sample to the
curved dome surface. The owner clarified that the additional coordinate belongs
to the sample, not the observer. It is distinct from horizontal distance inward
from the disk rim, vertical clearance, view-ray travel distance, and the exit
distance along a particular ray. Derive it from the finite cap, including its
rim, rather than silently using the unrestricted supporting sphere. Retain
inside/outside classification separately from an unsigned distance.

With fixed Sun height and Sun distance from the map center, prove whether
altitude and sample-to-dome distance recover map radius sufficiently to locate
the sample up to reflection across the Sun/map-center axis. Establish the valid
domain, invertibility, and numerical conditioning rather than assuming the old
two-horizontal-distance argument applies unchanged. Apply any reflection
consistently to incoming/outgoing directions. Address degeneracy when the Sun
is at the map center and at axes, rim contacts, and samples outside the cap.
Do not allocate unreachable coordinate combinations merely to preserve a
rectangular grid. Every scattering path still requires its own directional
dome intersection; nearest-surface distance is not its path length.

Sun distance from the North Pole remains a physical configuration input. An
extra sample coordinate alone does not prove reuse as that distance changes.
Rigid rotation about the North Pole and reflection are candidate symmetries;
arbitrary source-centered translation is not presumed valid. Distinguish
changes in configuration from cheap lookup/transform changes, and measure the
implications for height, time, location, and independent views. Do not bake a
camera or observer position into a supposedly reusable atmospheric field.

### Candidate shapes and slice spacing

The owner selects a quadratic distribution for the first slice-count study:

```text
d_i = d_max(z) * (i / (N - 1))^2,     i = 0 ... N - 1
```

N includes both endpoint nodes. The coordinate is sample-to-dome Euclidean
distance; d_max(z) is the maximum valid distance at the sample altitude under
the pinned geometry. Derive and check that maximum and the inverse physical
mapping before allocating nodes. Deduplicate collapsed domains and omit
unreachable combinations without silent coordinate clamping.

This formula concentrates slices near the dome and increases spacing farther
inside. It is a selected starting distribution, not a measured optimal shape
or proof of the slope-spacing hypothesis. Hold it fixed while varying slice
count. The [slice-count plan](plan.md) owns the count matrix, reference cases,
accuracy/cost measurements, and three-method color-swatch protocol.

Other exponents, uniform or slope-derived spacing, error-adaptive placement,
and alternative normalized coordinates are deferred until later owner
selection. Do not silently add a distribution search to this first sweep.
Position topology, interpolation, directional framing, and packing must still
be physically valid; keep those choices fixed across the count comparison and
report actual valid-domain node counts and retained bytes. Grazing paths and
illumination gradients may expose limits of the selected formula, which should
be reported rather than concealed by changing distributions mid-comparison.

### Deferred follow-up: fit a distribution from dense uniform slices

The owner proposes a later study using many evenly spaced sample-to-dome
distance slices to discover a suitable placement curve. Use the dense field
to measure where scattering varies and where removing or widening slices
introduces interpolation error, then fit a monotone placement curve that
concentrates a smaller number of slices in the important regions. Compare
that curve with quadratic spacing at equal actual storage and report build
cost as well as accuracy. Evaluate whether one curve transfers across
altitudes, directions, and Sun configurations instead of assuming it does.

The dense uniform cache is fitting evidence, not a replacement accuracy
authority: establish its convergence and retain the independent probe and
libRadtran comparisons. Fit on development cases and validate on fresh or
untouched cases, including the requested color swatches. This idea is recorded
for later selection and does not add uniform builds or curve fitting to the
current quadratic slice-count study.

### Reference and measurements

The owner selects the existing independent probe and libRadtran as the accuracy
guides. Accuracy is a required comparison condition while cache size and build
performance are the primary optimization variables. Candidate-cache agreement
with another resolution of itself is not sufficient accuracy evidence.

Start from the existing [cache-free independent probe](../../../../../experiments/sky-accuracy-dials/horizon-reference/gpu.mjs)
and its owning reference inputs. Identify and pin the exact entry point,
kernel, physical inputs, and established comparison evidence before execution.
Its kernel includes flat geometry and finite-source paths, but the selected
fixed-dome boundary must be adapted and validated within this new experiment's
source root. Keep the earlier experiment and its evidence immutable. The
adapted probe must remain independent of candidate cache construction, node
selection, packing, interpolation, and lookup. Compare pure orders and
cumulative scattering, with seed/batch uncertainty and convergence recorded
for stochastic estimates. Direct binary64 integration and analytic boundary
checks support the probe's verification; they do not silently replace the two
owner-selected accuracy guides.

Use the existing [libRadtran tool](../../../../../scripts/libradtran/README.md)
as the second independent guide. Before each comparison, establish the selected
solver's ability to express the case's geometry, source, boundary, medium,
spectral quantities, ground treatment, and viewing directions. Distinguish
exactly matched cases from shared-physics controls or explicitly approximate
comparisons. Existing spherical or plane-parallel results do not by themselves
validate the new finite-disk dome. If an exact dome/finite-source comparison is
unavailable, retain libRadtran's applicable controls and report that coverage
limit; never disguise geometry differences as cache interpolation error. Pin
solver version, input deck, solver options, raw output, uncertainty/convergence,
and all unit or spectral conversions. Do not fit the candidate to discrepancies
caused by unmatched physical cases.

Use independent analytic boundary checks and integration refinement so neither
guide validates itself through candidate indexing or interpolation. Historical
Star code and evidence may inform geometry recovery but do not become an
official new reference without recorded derivation and new validation. The
production slab cache is a control, not physical truth for the fixed dome.

Pin the physical quantity actually stored, spectral basis, units, medium,
source, direction representation, scattering orders, integration controls,
and case matrix before comparing shapes. Compare direct and per-order
scattering plus cumulative scattering; a first-order-only or screenshot-only
result cannot establish multiple-scattering accuracy. Include reconstructed
view radiance/transmittance and source attenuation.

Use separate development and held-out positions/directions, including center,
mid-disk, rim approaches, near-cap samples, grazing rays, ground hits, outside
observers, representative Sun offsets, mirror pairs, rigid rotations, and
elevation/time/location changes. Report absolute errors and relative errors
with an explicit dark-value policy. Freeze metric definitions, reference
convergence tolerances, and numerical decision thresholds before deciding
runs; no numeric accuracy threshold has yet been selected.

For each candidate record node/slice counts, actual versus nominal packed
storage, transient and peak GPU/CPU memory, construction time, lookup cost,
upload cost, and error distribution by physical regime. Report the measured
Pareto tradeoff rather than rejecting a scientifically useful result because
of an arbitrary budget or previously accepted profile identity. Only concrete
device allocation limits or invalid inputs justify an operational refusal.

Progressively establish coordinate sufficiency, direct/J1 behavior, higher
orders, then CPU/GPU precision and representative renders. Report partial
findings as partial; do not claim complete cache validity from an early slice.

### Experiment and promotion boundary

Use JavaScript or Python helpers and existing runtimes. Keep runtime
JavaScript and ambient declarations within the source root. Use self-verifying
proof runners, not a new test-framework suite or experimental unit-test tree.
No production change, dependency installation, old-lane resumption, or long
numerical execution is selected merely by creating this experiment. A future
production integration must reconcile ground meshes/intersections, atmosphere
paths, Sun attenuation, the separate star presentation surface, cache reuse,
frame transactions, and lifecycle verification with the new physical owner.

### Completed Three.js scene-render follow-up

The owner requests a real cache-builder to atmosphere-shader to Three.js scene
integration, producing outward/inward renders from one location near the rim.
The final scene includes a finite ground object and atmosphere, without other
visible objects. Both views consume the same complete cache and differ only
by a 180-degree heading change. The owner requires the observer to remain
inside the dome, delegates height/distance selection to make the edge legible,
and keeps natural framing rather than the proposed telephoto view.

The original near-rim framing is retained as completed evidence. The owner
subsequently selected Union Glacier Camp, now at 5,000 m, closest-approach Sun, a level
view toward its bearing and one exactly opposite, with green ground. This is
a scene-setting change within the experiment, not a cache distribution search.

The [scene-render plan](scene-render-plan.md) owns exact framing, material/source
assumptions, code responsibilities, stages, verification, and resource estimates.
It supersedes earlier provisional location/height proposals for this follow-up.
The owner selected independent-execution and R1-R4 are complete. The
[scene report](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00053-r4-scene-report/index.html)
contains both actual renders and verification. The integration succeeds, while
the near-rim reference samples expose substantial approximation error. The
status and execution record own its measurements and qualifications. This does
not reopen the completed slice-count comparison or change its evidence, select
another distance distribution, or promote experimental code into production.

## Open Questions

The selected quadratic count study is complete. The [execution record](execution.md)
and its final report own pinned physical inputs, guide applicability, measured
count tradeoffs, validation, and limitations. The nonzero-source coordinate
and boundary support work in the studied domain; the result is conditional on
the fixed directional and spatial representation.

- How should angular representation converge before a production adaptation,
  and how do count/size/build tradeoffs transfer at production resolution?
- Can a native solver provide an exact finite-cap/finite-source comparison,
  rather than the explicitly qualified local slab/all-orders guides?
- How should the unstudied map-center chart degeneracy and source-radius
  changes be handled without assuming invalid translation symmetry?
- Would an owner-selected alternative distribution or later dense-uniform
  curve-fitting study improve the measured compromises?

These research questions remain deferred. The separately requested scene-render
follow-up has its own plan and does not authorize those broader investigations.
