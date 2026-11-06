# Flat Dome Cache Shape Execution

Status: M1-M4 complete under the owner's independent-execution invocation.

The [plan](plan.md) owns milestones, measurements, count matrix, and report
requirements. The [status](status.md) owns the next action. Local checkpoints
recommended by the checkpoint adviser are preaccepted for this assigned work;
no push, deployment, or production modification is authorized.

## Decisions

- Retain the selected quadratic distribution and vary only count in the primary
  sweep. Other distributions and dense-uniform curve fitting remain deferred.
- Use the recovered 100 km shallow cap and North Pole AEQD disk as the first
  explicit physical baseline. Verify stable cap geometry and coordinate support
  before allocating scattering fields. Geometry checks are not scattering
  accuracy evidence.
- Reuse the existing independent-probe algorithm as an independently adapted
  reference. libRadtran remains a separate accuracy guide; exact finite-cap and
  finite-source compatibility must be established per observable.
- Preserve the previous city changes and unrelated working-tree changes outside
  this lane's local checkpoints.

## Milestone Reports

### M1: geometry and initial contract slice

Accepted run `00001-m1-boundary` records 190 analytic and coordinate checks,
including outward zero-length exits, inward paths, outside-origin entry,
finite ground, and clearance inversion. Maximum roundtrip error was
3.092281986027956e-11 meters. The earlier `00000` failed at sandbox-blocked WSL
launch after geometry checks; it remains immutable. The authorized host retry
created a new run and authenticated the installed libRadtran version output.

Accepted run `00002-m1-contract` pins 567 common physical rays, Native15 optical
inputs, 98 reflection-complete angular directions, and valid row-boundary
support. At the middle Sun offset, four retained RGBA32F fields are forecast
to grow from about 16.1 MiB at N=2 to 358.5 MiB at N=64, excluding auxiliary and
transient allocations. These are layout forecasts, not measured GPU allocations
or build times. The next pilot must measure them.

The curved boundary breaks the production cache's source-centered rotational
reduction. The experiment uses a canonical positive-y half-domain and reflects
outgoing/incoming directions with position. Each valid row retains the selected
global quadratic nodes and adds counted endpoints where necessary; coarse
counts must not silently clamp invalid combinations. Coordinate proofs are
not scattering-accuracy evidence.

The installed solar-source contracts do not yet establish an exact finite-cap,
finite-point-source libRadtran comparison. The initial contract uses explicit
locally matched collimated-source guide/control cases and keeps their geometry
and all-orders differences out of incompatible J4 accuracy tiers. Actual guide
swatches remain required. M1 stays open for GPU probe and full lookup controls.

Run `00004-m1-probe-pilot` verifies the independently adapted cache-free kernel
on ANGLE/NVIDIA RTX 2060. Twenty-four 8192-path batches across three 1 km
sunward rays took 3.188 seconds inside the browser, including compilation and
readback/reduction. The J1 differences from converged binary64 integration
were 0.063%, 0.228%, and 0.173%, inside the declared sampling-uncertainty check.
J2-J4 values are retained as pilot observations, not accepted cache accuracy.
The earlier sandbox-blocked launch is preserved as failed run `00003`.

Local experiment types pass. Dedicated engineering reviewers/audits remain
disabled. No cache-size optimum, accepted accuracy count, or production
integration is claimed.

### M2: first working cache and three-method swatches

Run `00008-m2-cache-pilot` builds N=2/N=4 fields on RTX 2060 and reconstructs
18 rays across 2 m, 1 km, and 40 km. All inspected field channels are finite
and nonnegative. Two earlier failed cache runs (`00005`, `00006`) retain the
diagnosed rim-contact/padded-channel nonfinite failure. The correction uses
the proven cap-interior ground intersection and a stable downward column;
zero-length atmospheric queries return zero before sampling.

Pilot retained verification-field payloads were 15.77 MiB and 27.33 MiB. The
browser reported 1.360/2.519 seconds per build, including field inspections;
program compilation took 52.802 seconds, and the first query incurred another
47.380 seconds of first-use work. These are exploratory wall timings, not an
idle repeated performance qualification. The next series separates inspection
time and tests releasing pure-order fields while retaining only the cumulative
higher-order field. Actual resident and peak build memory will be reported
separately rather than presenting verification overhead as required residency.

Run `00012-m1-probe-pilot` retains full Native15 spectra at three 1 km clearances;
360 independent batches took 3.034 seconds including browser kernel work and
readback. The faster reduction retains only required order moments, without
changing physical sampling. Run `00011-m2-lib-guide` supplies actual all-orders
local-height slab/collimated-source guide spectra. Failed native adapter runs
`00007`, `00009`, `00010` preserve template, worker-boundary, and missing sensor
altitude diagnostics; each cause was repaired in a fresh run.

The [first report](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00013-m2-pilot-report/index.html)
contains real cache/probe/libRadtran swatches, raw spectra, common exposure,
scope labels, and CSV. Spectral radiance errors at the three pilot clearances
were 2.081%, 5.121%, 1.747% for N=2 and 1.844%, 0.325%, 0.846% for N=4.
These six observations do not establish the final count or global accuracy.

### M3 decisions before the full sweep

- Keep the selected quadratic dome-distance distribution and frozen base
  altitude/source-distance support. The 96 horizon-focused incoming quadrature
  directions exclude exact tangent rays at the zero-thickness rim. Two zero-
  incoming-weight polar outgoing addresses are added before the full series
  so zenith queries need not extrapolate from oblique directions. This is an
  explicit new measurement series; original pilot data remain unchanged.
- Freeze 567 development rays, 144 off-panel validation rays, and nine mirror/
  outside-entry/vacuum controls before full output inspection. Validation data
  may be computed with the fields but are not used for development count tuning.
- The reference uses a converged direct-J1 control variate plus independently
  sampled J2-J4; raw sampled J1 remains an independent sanity check. Seed ranges
  are allocated contiguously per group/batch without the old large-group wrap.
- Forecast the main GPU probe from the measured pilot at roughly nine minutes
  for development and three for validation, with uncertainty from case optical
  depths. Cache builds are expected to scale to tens of seconds at N=64, plus
  first-use compilation. Measure rather than enforce these estimates.
- Only physically/order-compatible reference quantities enter accuracy tiers.
  libRadtran's local slab/all-orders guide is shown as such, with statistical
  uncertainty and no claim of an exact finite-cap comparison.

Local checkpoint `4b7be2d9` preserved the M1 geometry/reference foundation under
the adviser's preaccepted message. City data and unrelated changes were excluded.

### M3 initial sweep and development reference

Run `00014-m3-cache-sweep` completed all 18 fields: N=2,4,8,16,32,64 at three
Sun offsets. Every inspected field is finite/nonnegative. Releasing pure-order
fields and querying the retained cumulative field changes radiance by less
than 7e-7 relative. Maximum resident cumulative field plus lookup textures
grows from 4.04 MiB at N2 to 97.16 MiB at N64. Peak build/verification textures
are separate; opaque driver/program allocations are not measured.

Run `00017-m3-probe-dev` completed 61,200 independent batches over development
and controls in 473.884 browser seconds. Run `00020-m3-dev-analysis` freezes
dark floors from reference-only development results and excludes dark/vacuum
cases from tier denominators. Primary p95 spectral errors are 15.528%, 7.840%,
2.720%, 1.439%, 1.137%, and 1.059% in increasing count order. Probe integrated
radiance p95 95%-interval half-width is 0.266%; conservative band bounds are
retained too. These are development observations, not held-out recommendations.

Choose N6/N12/N24 around the 5%/2% crossings and knee. Diagnose path quadrature,
angular support, and source-distance support separately at N32/middle Sun
offset, using development/control rays only. Keep these diagnostic series
separate from the count comparison; no new distance distribution is selected.

The full 567-case native campaign is `00018-m3-lib-guide`, with 30,000 photons
per case and native `mc_std` uncertainty. The installed build rejects
`mc_spectral_is` (preserved failed run `00015`). Run `00016` provides three
Native15 guide spectra with standard errors. Run `00019-m3-guide-proof` matches
these cases using a cache-free all-orders slab/parallel-source probe: all 45
channel comparisons satisfy the declared broad combined-uncertainty check.
This supports shared-physics/units consistency at measured precision, not an
exact dome comparison or sub-percent native validation. Native uncertainty is
larger than the cap probe's in some channels.

## Timing and Resumption

### M3 refined counts, frozen selection, and validation

Runs `00021` and `00026` add N5/N6/N9/N10/N11/N12/N24 without changing spacing
or primary physical controls. The final development analysis is `00027`.
N5 has5.492% p95 error, N6 has2.718%, N9 has2.459%, N10 has1.908%, N11
has1.694%, and N12 has1.601%. N6 is the first tested development5% point
estimate; N10 is the first2% point estimate. No primary count reaches1%.
Conservative sums of per-band sampling half-widths move the2% descriptive
crossing to N24; these sums are not simultaneous confidence guarantees.
N6/N8's nearly equal p95 must not be interpreted as resolved statistical
superiority. Their worst-case behavior differs, and the actual quadratic node
sets are not nested when N changes.

Separate N32/middle-Sun diagnostics are `00022` (path24→48), `00024`
(angular8×12→12×16), and `00025` (source-distance rows17→33). Primary p95
is1.310%; diagnostic p95 values are1.310%,0.840%,1.349%. This identifies an
angular contribution to the plateau, not complete convergence or proof that
more slices never help. Diagnostic fields do not replace the primary series.

Run `00028-m3-selection` freezes all13 counts and provisional N12 balanced/
N6 lower-cost choices before held-out evaluation. Run `00029` supplies the
untouched144-ray probe, and `00030` evaluates it once. Selection does not
change: N12 p95 is1.458%, maximum3.987%; N6 p95 is2.098%, maximum6.553%.
No fresh confirmation is triggered because the development choices are kept.
Other counts' held-out results are reported without retuning to their rankings.

Run `00031-m3-optics` compares actual source/view attenuation shader output
against independent binary64 cap intersections and exact columns on576 rays.
Maximum absolute transmission discrepancies are9.0003e-6 and2.9664e-7.

All567 native processes in `00018` completed physically;29 parsing cases
failed due tiny signed roundoff or undefined native standard deviations.
Run `00032-m3-guide-recover` derives all567 actual spectra without rerunning
solvers. Seventeen spectra retain explicitly recorded signed roundoff before
normalization below1e-12 of their own peak;16 have unavailable uncertainty
channels, with overlap. These are labeled unresolved native precision, not
assigned invented zero uncertainty. The original failed campaign is immutable.

Read-only production metadata control `00034-m3-prod-control` records1049
positions,1920 incoming/4374 outgoing directions, and275,299,560 bytes nominal
single-FP32-field scalar payload. Experimental96 incoming/98 outgoing directions
are substantially coarser. New position counts, packing, and finite-cap geometry
also differ. Measured experimental sizes/times do not predict production at
its directional resolution. The final report must show this qualification,
position-node ratios, and any source-derived resolution-transfer estimates
separately from measured allocations/builds.

Run `00033-m3-timing` measures three fresh fields per count at the middle Sun
offset with shared programs, after reference GPU jobs close. Timing at other
Sun offsets remains a discovery observation, not a triplicate claim. Cold
program compilation and first-query lazy work are separate, substantial costs;
first-field warm-up remains visible in build ranges. Pure-field verification
and inspection costs are retained separately from primary field construction.

Local checkpoint `dd6ced12` preserves the working physical pilot and initial
M3 measurement machinery under the adviser's preaccepted exact message.

### Monitoring correction

The older finalizer writes a terminal event before synchronous recursive
hashing. The native campaign's large artifact tree makes that stage long and
unmonitored after the terminal timestamp. Preserve its exact original evidence
and report the gap. The current finalizer emits progress while hashing and
only then writes its terminal event and matching progress hash. Do not rerun
physical solvers or rewrite sealed progress merely to conceal the limitation.

### Final native-view correction

Final deck inspection found a second adapter issue: original away-low native
cases used relative azimuth0 (sunward) rather than180 degrees. Sunward and
zenith cases are unaffected, as are every cache/probe accuracy result, frozen
selection, held-out result, timing, and attenuation comparison. Preliminary
reports `00035`/`00037` are superseded for their away-ray native columns; keep
them immutable and do not use those columns as the requested guide evidence.

Run `00038-m3-lib-away` recomputes only the189 affected native cases. The adapter
now derives unsigned relative azimuth from the actual view/source vectors,
retains it in metadata, and asserts that the deck contains that value. It also
preserves negligible signed roundoff and undefined uncertainty directly, using
the same explicit policy as the earlier recovery. Merged artifact `00039`
reuses the378 unaffected original spectra and replaces these189 cases.
Matched all-orders slab/parallel proof `00040` checks three away rays across45
channels; all pass the declared broad combined-sampling check. Its maximum
per-channel point difference is31.18%, within broad native uncertainty; it
does not establish sub-percent native precision.

Run `00036-m4-verification` authenticated28,079 immutable files (5,002,306,574
bytes), original/cold-timing build and view shader identities, angular weights/
reflection, rotated cap intervals (maximum4.0745e-10 m difference), and exact
cached mirror equality. It reports old monitoring gaps honestly. Replacement
verification `00042` reuses still-valid sealed-parent checks through exact
original manifest identities, verifies new native/reference/report artifacts
and transitive parents, and reruns geometry/symmetry controls.

### M4: final report and verification

The [corrected standalone report](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00041-m4-report/index.html)
and [concise numerical summary](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00041-m4-report/summary.md)
are accepted run `00041`. Its [count CSV](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00041-m4-report/summary.csv),
all-row CSV/JSON, reference-compatibility CSV, and 78 actual PNG plates cover 13
counts, three Sun offsets, seven altitudes, nine clearances, three views, and
two common exposures. Filters expose common physical rows across counts,
equal-area method swatches, RGB/clipping, slice strips, per-order errors,
native precision limits, and raw spectra/XYZ/Lab. libRadtran remains an unmatched
local-height slab/parallel-source/all-orders guide. The 144 held-out rays and
nine boundary/mirror controls are cache/probe comparisons.

N12 is a provisional balanced study configuration: development/held-out p 95
spectral errors 1.601%/1.458%, maximum resident texture payload 19.387 MiB across
source positions, and middle-Sun median build 6.303 s (6.261-6.403 s). N6 is the
lower-cost comparison:2.718%/2.098%,10.488 MiB maximum,2.405 s median. N10 is the
smallest tested development 2% point estimate; N24 is first under the conservative
per-band allowance. These are descriptive tiers, not owner-selected requirements
or simultaneous-confidence guarantees. N64 has 1.059% development p 95 and costs
97.164 MiB/50.456 s median. The angular control improves the plateau; current
fixed controls do not establish universal 1% accuracy. Higher-order relative
errors and rare-event uncertainty remain larger than cumulative errors.

Cold program compilation was 50.509 s and first query/lazy work 49.356 s, additional
to field construction. The first N2 build has a 15.774 s cold outlier, retained
in its range. Repeated-field timing took 591.822 s overall including compilation,
query, inspection, serialization, and finalization. These are workstation wall
times; external activity was not controlled. Experimental angular resolution
differs substantially from production, so measured sizes/times cannot be
transferred directly to production.

Final verification `00042` freshly authenticates 10,066 files/1,732,659,682 bytes
and reuses 27,829 unchanged file checks from `00036` through original manifest
identities. It follows transitive experiment parents, matches currently generated
build/view GLSL to discovery/timing, confirms exact cached mirror equality,
and verifies rotated cap geometry. Ten retained-batch grouping checks confirm
that the new linear-time probe reduction preserves the old batch order/grouping,
removing its post-GPU quadratic filtering gap without rerunning numerical paths.
Historical monitoring gaps remain recorded. Current hashing emits progress.
Local types, source formatting, Python syntax, Git whitespace, actual HTML
rendering/filters, and subjective swatch inspection pass. Dedicated standards
reviews remain disabled; no standards-compliance claim is made.

The selected plan is complete with qualified native coverage and a conditional
count recommendation. Production integration, stronger angular convergence,
other distance distributions, exact native dome support, and lifecycle closure
remain separate owner selections. Data remain below
`C:\dev\flattened-steel\tmp\experiments\flat-dome-cache-shape\runs`.

### Reproduction

Use the experiment's proof runners with existing Node/Chrome and installed
WSL libRadtran. `run-candidate.mjs --sweep` performs the initial counts;
`--sweep --counts 5,6,9,10,11,12,24` adds intermediate fields as a new run.
`run-probe.mjs --all` supplies development, `run-development.mjs` analyzes
accepted discovery runs, and `run-candidate.mjs --counts 32 --refine path`
(or `angle`, `beta`) supplies separate non-slice diagnostics. Freeze with
`run-selection.mjs` before `run-probe.mjs --validation` and
`run-validation.mjs`. `run-lib.mjs --all` supplies actual native guide cases;
the recovery runner is pinned to this campaign's original raw outputs.
`run-candidate.mjs --timing --counts 2,4,5,6,8,9,10,11,12,16,24,32,64 --repeats 3`
records representative repeated timing. `run-optics.mjs` and
`run-production-control.mjs` supply auxiliary controls. `run-report.mjs`
selects finalized evidence and publishes a new report; `run-verification.mjs`
checks immutable report parents. Every runner creates a new monotonic run;
commands do not overwrite an existing result.

Measure stage and run elapsed times in generated manifests. Overall elapsed
includes authoring, tools, solver/browser waits, verification, and recovery;
it is not pure reasoning or GPU time. The first implementation slice establishes
immutable run allocation and an independently verifiable physical coordinate.

The final local checkpoint uses the adviser-preaccepted message
`feat(experiments): complete flat dome cache slice study`; it contains this
completed execution record. No push or production modification is included.
