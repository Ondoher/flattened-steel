# Predictable Sky Accuracy Dials Experiment Design

Completed diagnosis: [H120-H125 interior illumination](interior-illumination-results.md).
Independent node/interior light separates nodal transport, illumination-function
reconstruction and phase integration. Their local errors can cancel; component
and absolute-angular metrics must accompany signed totals. The tested positive
source-phase-coordinate repair does not qualify. No production architecture or
cache representation is adopted by this diagnostic. Accepted00634 verifies the
selected route; production unchanged, experiment open, no active numerical job.

Completed: [H113-H119 positive-mixture follow-up](positive-mixture-results.md).
The fixed midpoint improves Toronto's 36-field local J2 estimates but worsens
paper-atmosphere agreement versus complete Sun4096. Sun-gated and integrated-
Rayleigh follow-ons do not establish both-profile qualification. GPU-hybrid
weights work locally; binary transport lowers measured prototype elapsed times
by about40-43%, without a native-build claim. Accepted00618 verifies90field
derivatives, frozen decisions, operator/primitive checks, immutable evidence,
transport parity, cleanup and local types. Strict numerical scopes remain explicit.
Conditional broad/fresh/native/B1/scenes were untriggered. No job remains;
production unchanged; experiment open. The [execution record](positive-mixture-execution.md)
owns decisions, recovery, timings and resumption; the [plan](positive-mixture-plan.md)
retains unchanged gates.

Completed: [H105-H112 positive illumination bases](illumination-basis-results.md).
Explicit positive basis weights reproduce H100 numerically; exact Toronto
azimuth moments plus polar phase-knot tangencies separate integration error from
representation bias. A fixed convex midpoint improves the two exposed Toronto
gains, but full protection/practical native cost remain unqualified. The
[plan](illumination-basis-plan.md) retains gates, and the
[execution record](illumination-basis-execution.md) owns decisions and timings.
Accepted00594 closes the selected local route; broad/fresh/native/B1/scenes were
untriggered. No numerical job remains. Production unchanged; experiment open.

Completed: [phase-aware cell integration](phase-cell-integration-results.md).
Shared illumination with accurate cell phase weights repairs mass but fails
joint accuracy gains. Positive reconstruction provides a useful local near-Sun
lead without protected/practical qualification. Accepted00581 verifies the
72field causal screen, numerical geometry/phase/uncertainty/path proofs,
reconstruction, images, cleanup and types. Conditional broad/native/B1/scenes
were untriggered; fresh physical validation remains unexposed. Production
unchanged; experiment open. The [execution record](phase-cell-integration-execution.md)
owns complete decisions and timings.

Completed [H89-H96 structured incoming grids](structured-incoming-results.md).
Ground/horizontal boundary alignment improves local J2, but the broad and
stronger-concentration rules trade near-Sun numerator accuracy against off-axis
phase-mass error. No candidate qualifies; accepted00564 verifies the evidence
and local types. Native recurrence, full paper scoring and scenes were conditional
and untriggered. Production is unchanged; the experiment remains open.

Completed [H57 selected paper-ray order comparison](paper-ray-orders-results.md): all40 wavelengths for three adverse/control rays, matched independent GPU and libRadtran references, final swatches/spectra and pure-order cancellation diagrams in verified00363. The corrections reduce excess at one low ray but deepen a deficit at its counterpart; near the Sun, improved later-order contributions expose unchanged dim N1 light. External sampling limits and the disclosed post-compute monitoring repair remain explicit. Production is unchanged.

Completed [H56 B1 regression diagnosis](paper-b1-diagnosis-results.md): both full Direct40 ablations and the factorial/order/reference ledgers are accepted through00351. Transport and normalization each worsen paper RMSE slightly; their changes expose existing radiance deficits and interact. The normalization second-order change helps the final fit, but third/fourth-order changes outweigh it. Reconstruction/rounding contributes negligibly. Toronto evidence is preserved; production is unchanged.

## Objective

Completed [H53 matched full-scene capture](scene-render-results.md) adds actual
production-renderer before/after images for canonical and Toronto optical
material separately. Its results own appearance measurements, verification,
timings and decisions. It does not promote the diagnostic change.

Completed continuation: [H48-H52 Toronto horizon order attribution](toronto-order-attribution-results.md).
The selected0.05-degree probes demonstrate new angular/transport errors,
inherited amplification and cancellation, with a contained diagnostic
intervention and independent component references. No further campaign or
production change is selected. The plan/execution record retain scope and limits.

The completed continuation is the [H47 Toronto three-method order comparison](libradtran-horizon-results.md#h47-toronto-three-method-order-comparison),
selected on 2026-10-16. It adds matched independent GPU N1, cumulative N4 and
all-order estimates to saved H45/H46 production and libRadtran results, with
three-angle color images, spectral plots, sampling and integration controls.
Completed H44's result owner retains the physical registration, scattering-order and
view/layer-refinement limits, uncertainty, images and measured residuals.
The earlier [flat/local results](flat-local-horizon-results.md) remain evidence
under their declared assumptions, without presuming production is wrong. The
[lifecycle](status.md#experiment-lifecycle) owns current work; the historical
[suspension record](suspension.md) retains resumption history. The earlier
[gray horizon diagnosis](horizon-diagnosis-plan.md) remains evidence. Existing
isolation, provenance and resource limits still apply.

Develop predictable atmospheric-scattering accuracy controls judged against
scientific expectations and independent numerical references, with interaction
tests and bounded storage. The
[continuation goals](continuation-goals.md#standard-of-correctness) own the
correctness standard. The owner's
[accuracy criteria](reference-model-target.md#current-accuracy-metric) distinguish
isolated correctness against verified matched libRadtran from the full-cache
requirement to match or improve paper RMSE under fixed paper parameters.

## Acceptance Question

The [continuous mathematical target](idealized-model.md) now states the proposed
ideal formulation of this algorithm under its existing physical assumptions.
It owns the exact transport equations; numerical implementations approximate
that target, and observation comparison remains a separate operation.

Can independently varied and combined numerical controls predict spectral changes and accuracy trends on unexecuted configurations without relying on cancellation or uncontrolled storage growth?

The first campaign is complete. The [continuation goals](continuation-goals.md)
define the next scientific objective, and the
[continuation execution plan](continuation-plan.md) owns its proposed cases,
criteria and allocations within this experiment's existing boundaries.
Independent execution is bounded by each registered package; completed plans
do not authorize automatic extensions. The [status](status.md) owns
completed implementation milestones, current work and review evidence.

## Isolation Boundary

Authored experiment implementation, controls and fixtures remain below
`experiments/sky-accuracy-dials/`. The owner explicitly authorizes updating this
experiment's documentation wherever it lives, including its owning topic
documents under `agents/topics/`. That documentation authority does not permit
changes to historical evidence or unrelated work. Generated output remains
below `tmp/experiments/sky-accuracy-dials/`.

Production and other experiment trees remain read-only inputs except for
separately authorized work. The completed
[compiler contract repair](continuation-review-resolution.md) was limited to
comments, ambient declarations and the existing filename compatibility
exception; production executable behavior remains unchanged. Further production
behavior changes or promotion require separate authorization.

## Output and run rules

- `sky-accuracy-dials` is the unnumbered experiment identity.
- The experiment source root is `experiments/sky-accuracy-dials/`. Authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests belong there.
- The experiment source root owns `jsconfig.json` with `allowJs`, `checkJs`, and `noEmit` enabled. Run its type check after authored code changes and self-review against mapped standards, including `types.md`. The repository experiment policy disables dedicated reviewers and independent audits; checkpoint advice and the experiment's scientific and evidence checks remain active.
- The generated-output root is `tmp/experiments/sky-accuracy-dials/`. Builds, caches, browser profiles, reports, captures, diagnostics, renders, logs, progress records, temporary files, and other generated intermediates belong only there and must remain ignored by Git.
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
tmp/experiments/sky-accuracy-dials/runs/<sequence>-<name>/progress.jsonl
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

## Storage And Execution Budget

Budget against current disk space only. The owner's copy to another drive
does not release space on C:. Initial observed free space was 50,601,861,120
bytes. Stop starting work below 40 GiB free. Limit this experiment to 1184 MiB
of retained evidence and 1 GiB of live scratch; enforce both before expensive
work and before writes. Run one GPU job at a time. Do not use another drive
or delete any previous experiment, production, or historical artifact.

### Budget amendment history

H113's positive-mixture follow-up raises retained disk from 1152 to 1184 MiB
under standing owner authority. Starting retained evidence is 1201242464 bytes
(1145.47 MiB), scratch 0 and about 108.6 GiB free disk. Initial compact probes,
figures and immutable manifests are estimated at 8-24 MiB. Preserve the 2 MiB
seal reserve, 1 GiB scratch allowance, 40 GiB free minimum and all earlier runs.

H92's horizontal-boundary/complementary-resolution follow-on raised retained
output1024to1152MiB under the owner's standing AFK authority. At that amendment
retention was1022805452bytes (975.42MiB), scratch0; the estimate was50-100MiB of
new field/reference/figure/proof work. Preserve every prior run, the
2MiB sealing reserve,1GiB live scratch and40GiB free-disk minimum.

H89-H96 raises retained disk from896to1024MiB under the owner's standing AFK
authority. Starting retention is915833140bytes (873.41MiB), with no scratch and
about95GiB free. Structured/boundary local screens, reference refinements,
validation if earned and reviewable figures can require another40-120MiB.
Retain compact recipes and stream numerical fields; any native/full-scene
phase gets a fresh measured estimate. Scratch/free-disk bounds and all earlier
evidence remain unchanged.

H75-H82 raises retained disk from768to896MiB under the owner's explicit AFK
authority to make decisions needed to proceed. Starting retention is776671024
bytes (740.691MiB); expected new compact evidence80-140MiB includes development
references, controlled comparisons and exploration waves. Scratch/free-disk
bounds stay unchanged. Every earlier run remains immutable.

The owner approved768MiB retained disk for H69-H74's two-atmosphere adaptive
incoming campaign, then authorized further justified decisions while AFK.
Starting retained evidence is766948749bytes, scratch0. Prior runs remain
immutable; live scratch and free-disk bounds remain unchanged.

H67's owner-approved amendment raises728to736MiB retained disk for the
[sunset L1/J2 attribution](sunset-j2-results.md), including selected compiler
fields, independent path/angular probes, plots and immutable verification.
It preserves all earlier evidence; scratch, system/GPU and free-disk bounds
are unchanged. H65's earlier728MiB approval remains recorded by its own plan.

H62's owner-approved amendment raises656to720MiB retained disk for the matched
scene captures, authenticated bundles and immutable manifests. Measured starting
retention is681,305,932bytes, scratch zero, free disk106,245,005,312bytes.
Earlier evidence remains intact; system/GPU and scratch bounds are unchanged.
Compact control-hash recipes avoid repeating full domain vectors per artifact;
actual retained costs will be measured, rather than assuming the old H53 manifest
overhead recurs.

H59's owner-approved amendment raises624to656MiB retained disk after measuring
657,261,884bytes including the failed partial run's terminal manifest. Earlier
runs remain immutable; new recipes replace repeated full control objects with
canonical control hashes. The [H59 execution record](angular-interpolation-execution.md)
owns final totals and the exact12-wavelength reuse. Scratch, system/GPU memory,
production-cache and free-disk requirements are unchanged.

H58 raises the retained allowance from592 to624MiB. Observed retained evidence
is604,303,609bytes, leaving16.4MB below the old bound. A bounded new GPU/reference
package plus images and sealing reserve can exceed that headroom. The32MiB
amendment preserves all earlier runs without deletion; free disk is113.9GB,
live scratch is zero, and system/GPU memory and production limits are unchanged.

H53 raises the retained allowance from 512 to 544 MiB to preserve both requested
full-scene pairs, their sealed derivation records and the final comparison report.
After the two accepted captures, actual retained bytes were 540,116,069, including
the second run's 11,086,416-byte final seal. Its sealing overhead exceeded the
allocator's 2 MiB reserve and prevented allocating the small report. There were
115,277,656,064 free disk bytes and no live scratch. This bounded amendment
requires no numerical rerun, deletion or modification of earlier evidence;
system/GPU memory limits and production cache configuration do not change.

Reproducible bundles, browser profiles, uploads, and intermediate fields belong
under `tmp/experiments/sky-accuracy-dials/scratch/<unique-owner>/`. Scratch is
explicitly excluded from retained evidence. Record its owning run, recipe,
source/input identities, high-water byte count, and cleanup outcome. Cleanup
must verify the resolved absolute target is strictly inside this scratch root,
verify ownership, reject links/junctions throughout the target tree, and occur
after dependent spectra and checks are retained. Never delete a `runs/` path.
Retained failures and prediction failures are evidence and remain immutable.

Compute one wavelength at a time, accumulate pure orders in memory, evaluate
the requested sky rays immediately, and retain compact binary64 spectra.
Four cumulative orders for all 17 x 81 x 40 samples require 1,762,560 bytes.
Do not retain cache packages, full recurrence textures, duplicate per-channel
control documents, films, or full-resolution images. Snapshot the small
authenticated build request, condition geometry, measurement data, and needed
source once; retain derivation links for later runs.

## Scientific Controls

The [current metric owner](reference-model-target.md#current-accuracy-metric)
defines reference qualification, spectral scoring and the separate flat/local-Sun
boundary. The controls below retain the first campaign's frozen protocol and
historical predictions; future accuracy assessments use the new primary metric
and identify Kider residuals explicitly as empirical evidence. This change does
not reopen consumed campaigns or alter their registered gates.

Keep the matched Direct40, ground, atmosphere, collimated source, Z180 solar
grid, anchored numerical policy, and Basic Bruneton physical B1 boundary as
the initial control. Score registered channels 0-30; retain all 40 for final
qualification. Preserve spectral units and exact fitted Sun/observer geometry.
All 17 existing measurements have been seen previously; describe withholding
as prospective intervention validation, never as unseen measurement data.

Use 09:30, 11:15, and 13:30 at channels 0, 8, 16, 24, 30, 39 for inexpensive
screens, keeping all 81 directions. Lock predictions for the remaining times
before full evaluation. Finalists use the complete 17 x 81 x 40 boundary.
Compare numerical convergence separately from Kider agreement. A dial may
predictably improve the numerical solution while worsening Kider RMSE.

Predictions target the spectral change delta first. Given control residual
e = Lcontrol - measured, score predictions use the exact identity
deltaSSE = 2 e dot delta + norm(delta)^2. A predictor may consume earlier
development runs but cannot consume the candidate it predicts or simply run
its full recurrence under another name. Freeze predictions, uncertainty, and
scope before candidate generation; retain misses.

Define a negligible-change floor from unchanged-control repeatability and
reference uncertainty before testing signs. Initial empirical targets are at
least 90% sign agreement above that floor and at most 25% relative vector
prediction error within each declared condition/angular stratum. Explicitly
report unsupported, nonmonotone, and interacting controls. These are empirical
engineering targets, not universal error bounds.

For factors A and B, measure the spectral interaction
IAB = LAB - LA - LB + Lcontrol before considering RMSE. Use full 2 x 2
factorials for selected relationships. Predict interactions explicitly when
the mechanism suggests them; do not infer independence from aggregate scores.

## Hypotheses And Dials

| Factor                            | Initial hypothesis and prospective falsification                                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Near-ground altitude nodes        | Refining 48 to 51, 55, then 63 retained-node grids reduces positive N1 reconstruction bias. Losses concentrate in low-altitude view samples. Analytic N1 should remove most of this sensitivity; test the remaining higher-order effect.                                                                                                                             |
| Outgoing directions               | W27 to W39/W51 reduces the angular error of smooth fields, with larger sensitivity near steep lobes. Analytic N1 should remove its own W dependence. Validate spatially and spectrally; nonnested grids need independent-location checks.                                                                                                                            |
| Incoming quadrature               | More and better distributed positive-weight directions reduce phase-weighted integration error. Changing only this factor cannot change J1. Test constant fields and actual sky; never silently renormalize phase values to hide error.                                                                                                                              |
| View integration                  | Qview 30/60/120 changes final radiance while leaving recurrence fields bit-identical. Capture the union of query supports in one recurrence pass, then test convergence and predict correction sizes.                                                                                                                                                                |
| Altitude-aligned view integration | Split each ray at every physical cache altitude knot, then use 1/2/4/8 midpoint substeps per segment. P48 uses 48/96/192/384 actual steps. This removes altitude interpolation derivative jumps from interval interiors; freeze a second-order prediction from two preceding levels before each target. Outgoing-direction reconstruction can still introduce jumps. |
| Source integration                | Qsource 20/40/80 affects direct attenuation and can change every order. Test its coupling to near-ground and grazing paths.                                                                                                                                                                                                                                          |
| Recurrence integration            | Qtransport 40/80/160 leaves pure J1 unchanged but changes later orders. Test interactions with incoming direction count and altitude resolution.                                                                                                                                                                                                                     |
| First-order representation        | Exact phase/local density with direct source transmittance reduces interpolation bias. Separate cached-N1 plus cached-higher-orders from analytic-N1 plus cached-higher-orders to measure cubic grouping effects. Frozen-increment substitutions are diagnostics, not regenerated solutions.                                                                         |
| Density factorization             | Caching separate Rayleigh/Mie lighting coefficients and evaluating physical densities at query altitude may reduce height sensitivity. Requires separate coefficient fields; combined J cannot uniquely recover both. Implement after simpler controls identify value.                                                                                               |
| Solar interpolation               | Current fractional-angle cubic is expected to be small at noon. Test controlled reconstruction changes while preserving Z180 and exact knots; arbitrary solar-grid refinement requires complete experiment-owned coordinate changes.                                                                                                                                 |
| Precision and geometry            | Binary64 reference, stable roots, exact surface height and matched angular frames should bound arithmetic artifacts. Preserve anchored controls and use targeted probes rather than changing geometry alongside sampling.                                                                                                                                            |
| Scattering orders                 | First assess sampling at fixed N4. The observed blue N4 contribution warrants a contained N5/N6 driver with unchanged physical inputs and bit-exact J1-J4 prefix checks. Retain a distinct six-order result schema and use channels 0/8 across all 17 times as an explicitly partial spectral diagnostic. Production remains fixed through J4.                       |
| Atmosphere and observation model  | Keep physical inputs fixed until numerical effects are understood. Any later phase/profile or optical-footprint experiment must be separately identified, with a prediction and no claim that an unknown instrument response has been calibrated.                                                                                                                    |

## Running Shader Cost

The owner requires O(1), loop-free evaluation within each ray sample.
Multiple samples along a ray are expected and permitted. For N samples,
sample evaluation therefore costs O(N) per ray; a single complete-ray lookup
is not required. The per-sample path, including called helpers, must contain
no loops, including fixed-count loops.

Use fixed-count cache lookups and bounded reconstruction arithmetic at each
sample. Do not perform nested source-path integration, incoming-direction
integration, scattering-order iteration or iterative reconstruction within
a sample. Precomputation and independent reference integration may perform
the additional work needed to improve accuracy.

View sample count and placement remain possible runtime accuracy controls.
Altitude-segmented or adaptive sampling may be considered at the outer ray
integration level, provided sample evaluation stays loop-free and the sample
selection overhead and total ray cost are assessed separately. Existing query
savings do not establish a shader speedup. The practical per-sample lookup and
instruction budget and total ray sample budget remain to be measured.

## Representation And Hardware

Use an experiment-owned generic cubed-sphere geometry/view evaluator and browser
entry around the read-only production compiler where possible. Preserve its
Float32 cumulative addition order and production solar cubic for baseline
parity. Because cubic is nonlinear, interpolation of a sum and sum of
interpolations are different controls. Record each representation explicitly.

For the existing flattened field layout, height is 180P and J width is 6W^2.
The observed texture limit 16,384 permits P <= 91 and odd W <= 51. Preflight
incoming width and both viewport dimensions as well. Estimate live field
memory as 4(180P)(6W^2 + 2I) bytes, plus direction textures and driver/CPU
overhead; dimension fit alone is not memory qualification. Larger grids need
an explicit experiment-owned layout change. Adaptation may not edit production.

## Review Milestone

The initial review unit includes the new experiment source/configuration and
topic scaffold, with baseline
`.codex-tmp/review-standards/session-RFjzF6/baseline.json` captured before writes.
Batch source review when the streaming runner, contracts, and baseline proof
are coherent. Require local type checking plus validated primary and independent
audit evidence for the mapped lanes before claiming implementation completion.
Later scientific executions from unchanged reviewed code do not require repeat
source reviews. Changed mechanisms get a new explicit review unit.

## Development Decisions

The first screening baseline reproduces retained CPU spectra to numerical
roundoff. Its Q30/Q60/Q120 observations falsified a universal second-order
prediction for the reconstructed cache field. Independent continuous first-order
integration follows that scaling much more closely. The altitude-aligned rule
therefore tests a concrete source of nonsmoothness instead of fitting a new
exponent to each response.

First-order density factorization is implemented as a diagnostic: construct
separate analytic Rayleigh/Mie lighting fields, reconstruct them, and apply
physical density at the query point. Retain a split-species grouping/rounding
control and compare with continuous J1 at identical source/view quadrature.
Substituting it into C4-C1 freezes later increments and must be labelled as
such. This does not implement higher-order coefficient fields or qualify a
fully regenerated factorized solver.

Source 20/40/80 and transport 40/80/160 pass the locked second-order model in
the screening and fourteen-condition prospective validation scopes. Segmented
1/2/4 misses the near-Sun magnitude gate; the unchanged model passes at 2/4/8.
The source-by-transport additive prediction passes, while incoming-by-transport
does not. The finer I128/I512/I2048 directional test retains another prediction
failure. No failed gate was relaxed or replaced with an aggregate-only check.

Complete source/transport-by-first-order-representation contrasts distinguish
actual spectral interaction from changed baseline residual alignment. Spatial
attribution retains all registered point errors and a grid-index noon figure.
The six-order diagnostics stay in a separate partial spectral schema. The
[scientific results](results.md) own all numerical outcomes and qualification
limits; the consolidated scorecard retains complete selectors and derivations.

Display color conversion is outside the scored spectral boundary. The B1
scorer consumes spectral radiance before RGB conversion or display mapping;
an app color change cannot explain a difference in these retained spectral
scores. No application color or strobing implementation is changed here.
