# Flat Dome Cache Shape Execution

Status: scene-render R1-R3 complete; final-size renders checked, R4 reporting in progress.

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

## Scene-render follow-up planning

The owner requested code that constructs a complete cache, supplies it to an
updated atmosphere shader, and renders an actual Three.js scene in two opposite
directions near the disk rim. A finite ground object is required; other visible
objects are omitted. The owner stopped premature implementation and requested
a plan. The initial two-degree/eye-height settings and later five-mile/100-m
proposal were superseded by owner-delegated distance/height selection with an
explicit inside-dome constraint. The owner retained natural FOV rather than
the proposed telephoto framing.

The [scene-render plan](scene-render-plan.md) owns the exact current settings,
material/source assumptions, implementation sequence, estimates and evidence
criteria. One separate agent completed the create-plan critique. Both findings
were incorporated: explicit Native15 spectral ground endpoint normalization/
composition, and an early small rim crop using final projection/pixel centers.
There were no rejected suggestions and no added standards-review round.

Only planning/continuity documents changed. No new run was allocated, numerical
execution or implementation started, dependency installed, or Git write made.
Prior independent-execution authority covered the completed count study and
does not start this follow-up. Future execution begins at R1 if selected.

## Scene-render execution

The owner selected independent-execution of the saved scene-render plan. The
existing experiment/source/output boundaries remain in force. Local checkpoints
within this assigned work use the adviser's preaccepted messages; production
changes and pushing remain outside scope.

### R1 - Shared-context live cache

Use the public `ShaderRuntimePass` constructor directly through a browser-bundle
alias to its unchanged production source. Its public fragment/uniform boundary
supports the new field without pretending the old slab compact-cache contract
can represent it. Retain production camera reconstruction and pass ownership,
derive experiment-owned cap/lookup/capture GLSL, and use Three-managed FP32
textures throughout. The old rectangular/raycast-only ground and byte-packed
distance input are replaced inside the experiment, not production.

Accepted `00043-r1-three-cache` compares34 old/new physical rays against a fresh
raw-WebGL N12 build. All four pure orders and all15 channels match exactly:
maximum absolute/relative difference0. Cumulative retention's maximum relative
rounding discrepancy is1.173e-7. The live3036-node middle-Sun field owns
19,096,352 texture bytes including lookup tables; build/verification cache
targets peak at76,221,728 bytes, excluding opaque driver/JS costs. This is
camera-independent data, returned as a `DomeCacheResource` for direct consumption.

Runs43/44's `constructionAndInspectionMilliseconds` label includes the later
comparison-query preparation/readback, about85 seconds total. Preserve those
original values but do not call them pure construction. The current builder
records field construction/inspection and comparison queries separately and
reuses R1 evidence rather than compiling/running redundant comparison queries
for every subsequent scene session.

### R2/R3 - Real ground, adapted shader, pilot and reference checks

The scene has an actual Three `Mesh` covering the disk, clipped analytically
in observer-local coordinates. Its one floating-point capture pass outputs
physical hit distance, hit flag and spectral material identity. Both headings
use that renderer input and the same cumulative texture. The updated atmosphere
shader integrates analytic J1 plus cumulative J2-J4 exactly once, applies the
spectral ground endpoint through wavelength-dependent transmission, then converts
through the fixed CIE/linear-sRGB/exposure/transfer chain.

The angular address/weight selection is hoisted out of the per-distance loop
because view direction is constant along a ray. Lookup physics and quadrature
are unchanged; this avoids repeating the98-direction search at every sample.
Record it as a view-evaluation implementation change, not a new cache series.

Accepted `00044-r3-three-pilot` supplies the320x180 pair and1280x64 crop at
the final full-frame projection. Real ground draws, finite rim hit/miss, camera
directions and sampled spectral outputs are retained. The outward rim is a
sharp ground termination near the horizon, not a visible wall; the inward
atmospheric band is brighter. Most sky is dark because the chosen camera is
only about5m below the shallow cap and looks into vacuum above that local roof.
No per-view exposure or framing adjustment is made.

Accepted `00045-r2-scene-probe` independently samples16 new rays/all15 channels,
1920 batches, with converged binary64 J1 and sampled J2-J4. Its GPU work took
7.414s. Intrinsic N12 query errors are materially worse here: median17.63%,
p95/max37.25%. Original broad-study accuracy does not qualify this near-rim pose.
No count/distribution search is silently added to hide that limitation.

Initial check `00046` fails because it compares cap exit at an ideal binary64
camera direction with exit at the actual FP32 reconstructed camera direction.
For the27.5-million-meter pilot horizon path, a small camera-direction rounding
change moves the far exit by166.4m. At the actual measured GPU direction the
independent solver differs by only0.66m. `00047` separates camera quantization
from solver error, retains both, and applies the original solver error bound
to like-for-like directions; it does not widen the bound or rewrite `00046`.

Accepted `00048-r4-three-final` produces both1280x720 images from one completed
cache. Camera-only height/FOV changes keep texture and shader identities;
auxiliary outside-outward rays are vacuum and outside-inward rays enter the
cap. The actual final views remain at45m,5km inside, level90-degree horizontal
FOV. Zero-air/unit-transmission checks verify the declared ground spectrum.
`00049` verifies actual fragments: zero display-code difference from the CPU
color owner, maximum transmission error2.05e-7, maximum spectral ground
composition discrepancy2.70e-9. New scene-air errors span3.11%-37.53% against
the matched probe; these are approximation limits, not port/display errors.

Final-source checks additionally record owned-resource counters after disposal,
and reject undrawn/nonfinite pixels. A fresh final run retains that evidence;
source formatting/type-only changes do not trigger the old full count/native
campaigns. R4 completion and handoff are recorded below.

### R4 - Final pair and qualified completion

Canonical final run `00050-r4-three-final` renders the two unannotated 1280x720
PNGs through the updated shader and real finite ground mesh. Both use one live
N12 cache. Settings remain 5 km inside the rim, 45 m high, level camera, 90-degree
horizontal FOV, fixed inward Sun and exposure 0.06. The camera is inside the
49.95725 m local roof with 4.95700 m shortest clearance. The outward ground
cutoff is distinguishable approximately 5.76 pixels below the horizon; it is
not a large cliff or an opaque dome. The inward atmospheric band is brighter.
Both actual images were inspected; no extra scene objects were introduced.

`00050` reproduces both `00048` PNGs and assembled GLSL byte-for-byte. It records
owned Three resources dropping from two geometries/three textures to zero/zero,
explicit cache disposal and requested context loss. Camera height/FOV checks
retain cache and shader identities; final rendering restores the selected pose.
Node verification rejects undrawn/nonfinite pixels and checks actual ground
participation. `00051-r2-scene-check` verifies the final source's geometry,
transmission, spectral endpoint composition and display conversion against
independent calculations and the existing new probe run. No additional native
guide campaign or count/distribution sweep was needed.

The [final scene report](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00053-r4-scene-report/index.html)
and its [summary](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00053-r4-scene-report/summary.md)
link the pair, settings, timing, raw pixel spectra, accuracy CSV and resource
identities. Report `00052` remains immutable; `00053` corrects report text spacing
without rerendering physics. The latter authenticates 1,259 parent files totaling
86,453,084 bytes and verifies both native-size images in a browser without errors.
Observed scene-run progress gaps are at most 25.015 s. Prior slice-study
monitoring limitations remain in that study's evidence. Primary self-verification
is not an independent audit or a standards-compliance result.

Actual scene-air errors on the 16 matched rays range from 3.11% to 37.53%, with
median 17.87%. Independent uncertainty is much smaller. The cause is not isolated
to distance slice count; the present spatial/angular representation remains
unqualified for this near-rim pose. Exact port parity, correct composition and
successful integration do not resolve this accuracy limit. Keeping that measured
qualification completes the plan's stated scope; silently retuning the cache
would begin an unselected investigation. Ground is the frozen diagnostic spectral
endpoint with no surface feedback into the absorbing-ground scattering solution.

Run `00050` measured 10.592 s compilation, 7.643 s field construction/inspection,
and 3.758 s camera/shader preparation plus auxiliary reuse controls. Outward/
inward shader wall times were 0.546/0.297 s; totals with readback, PNG and checks
were 1.642/1.319 s. Cache-owned retained textures total 18.212 MiB and cache/
verification peak targets 72.691 MiB. These are synchronized workstation wall
and owned-payload measurements, not isolated GPU timer results or full-process
memory. Final frames use synchronized four-row GPU tiles at full projection.

Local checkJS/types and all 47 experiment JavaScript/declaration files' Prettier/
curly formatting pass. The final source differs from the sealed final run only
in formatting its console summary; no physics or executable semantics changed.
Current documentation links and Git whitespace are checked before checkpoint.
Dedicated standards reviewers/audits remain disabled. No experimental unit-test
tree was created. Exact native finite-cap oracle coverage, persistent cache
packaging, app integration and broader accuracy/convergence studies remain
explicitly deferred.

Reproduce a fresh final pair with
`node experiments/flat-dome-cache-shape/run-scene-render.mjs --final`.
`run-scene-probe.mjs` supplies the independent scene rays;
`run-scene-check.mjs --render-run <run-name>` verifies a selected rendering;
`run-scene-report.mjs` publishes a new report from finalized matching inputs.
All runners allocate new immutable runs. Do not reopen or overwrite saved ones.

R1-R4 are complete with the stated accuracy qualification. No numerical process
is running and no implementation blocker remains. Owner review is the next
action; production promotion, further research and lifecycle closure remain
separate selections. The adviser-preaccepted scoped local checkpoint uses
`feat(experiments): render flat dome cache scene`. It excludes unrelated city,
Flat topic, transfer and Prettier-ignore changes; no push is authorized.

### Owner-directed 20 m render adjustment

After inspecting the first pair, the owner requested closest-approach Sun and
then a 20 m observer height. Inspection confirmed the existing source already
has zero orbital degrees from closest: source and observer share the positive-X
radial line. The Sun is about 25.77 degrees above the horizon on this orbit.
No source-radius, Sun-height or exposure adjustment was made.

Changed the default observer height from 45 m to 20 m and made camera-only
base/height/FOV diagnostics derive their height from the request. The existing
outside-observer controls stay at 60 m. Accepted run `00054-r4-three-final`
builds one fresh camera-independent cache for the new rendering session and
uses it for both full-size headings. The local cap remains 49.95725 m high,
leaving 29.95575 m shortest clearance. The natural-FOV rim depression is now
0.22918 degrees, about 2.56 pixels. Both actual PNGs were inspected: the outward
blue atmospheric band is more visible, while most upper sky remains dark.

The ground remains the fixed warm-gray diagnostic endpoint: zero-air RGB
100,95,94 (#645F5E) at common exposure, before atmospheric attenuation. The
owner asked about its appearance; no ground-color change was requested.

The runner's independent geometry/column/display/composition checks pass,
with zero display-code discrepancy, maximum transmission discrepancy 1.69e-6
and composition discrepancy 2.36e-9. Owned textures/geometries are zero after
disposal. Source types and formatting are checked. This small view adjustment
does not repeat the independent probe campaign, pure-order comparison, native
guides or full report. Report `00053` and its 37.53% error remain evidence for
the original 45 m pose; do not report that error as the 20 m accuracy.

The latest pair is linked from status and entry. Existing sealed runs are
unchanged. No production files were edited; no numerical process is running.
The adviser recommends the scoped local checkpoint
`fix(experiments): lower flat dome scene camera`, preaccepted under the active
independent-execution workflow. Unrelated changes stay excluded; no push.

### Green ground for future renderings

The owner requested green instead of warm-gray ground going forward. The
default scene endpoint now applies a fixed nonnegative Gaussian green filter
(center 550 nm, sigma 35 nm, floor 0.08) to the source spectral shape, then
normalizes to the original gray96 CIE-Y luminance at exposure 0.06. This gives
zero-air RGB 66,107,25 (#426B19), retaining spectral transmission/composition
and the same brightness reference. The equation and generated packet remain
in every future render's settings; this is an authored diagnostic material,
not a fitted physical surface or scattering-boundary change.

Local types, formatting and the computed green endpoint are checked. No GPU
render or cache rebuild is required for this future-default edit. Existing
renders, reports, sealed runs and production source remain unchanged.

### Union Glacier Camp, closest Sun, level opposite views at 50 m

The owner requested a visible demonstration from Union Glacier Camp, with the
Sun at closest approach, camera level toward the Sun's bearing, a second view
behind it, and elevation 50 m. Used the existing catalog addition's coordinates
(-79.76667, -82.86667), documented in
`src/flat/features/global-configuration/assets/data/cities-source.json`.
Height is above the experiment's flat ground, not surveyed camp altitude.
The Sun's orbit radius/height, exposure 0.06, N12 cache layout, quadrature and
90-degree horizontal FOV are retained. Green ground is now actually rendered.

AEQD radius is R*(90-latitude)/180. Actual map observer coordinates are
[-18731106.342972297, 2344148.7045384943, 50] m. Rotate the complete source/
observer/view configuration into the canonical source-positive-X cache frame,
using longitude-90 degrees, without moving the North Pole or atmospheric cap.
The inverse rotation, actual map source/observer coordinates and formula are
recorded in settings. This uses the cap's rigid rotation symmetry and does not
translate the source-centered field. The Sun shares the observer's longitude
at closest approach, 0 degrees; its altitude is 28.5606 degrees. The level
Sunward heading is north (canonical -X), and the other heading south (+X).

The camp is 1,137,895.9504 m inside the disk edge. Its roof is 11,047.3989 m high,
leaving 10,996.9105 m shortest clearance. Replaced the renderer request's
hardcoded 5 km ground mask with the actual configured rim distance. Outside
controls now use local cap height plus 10 m, rather than assuming 60 m is
outside everywhere. Camera base/height/FOV checks remain tied to the selected
50 m observer. Both views retain a single completed live cache.

Accepted run `00055-r4-three-final` renders Sunward first (inward.png), then
exactly opposite (outward.png), both 1280x720. Visual inspection confirms a
colored sky and green ground in both: the Sunward sky is brighter with a warm
horizon, while the opposite sky is darker blue. Angular interpolation bands
are visible in the Sunward view and remain an explicit limitation. The existing
scene contract has no visible solar disk mesh; Sunward refers to bearing.

Local independent geometry/column/composition/display checks pass. Maximum
transmission discrepancy is 5.77e-7, spectral composition discrepancy 1.87e-9,
and display discrepancy zero code values; there are no nonfinite/undrawn
pixels. Ideal-camera versus GPU-direction far interval discrepancy is 30.071 m,
with solver error checked separately at the same measured GPU direction.
Owned resources drop to zero after disposal. Sunward/opposite frame totals
including capture/readback/PNG/checks are 1.963/1.828 s on the recorded RTX2060.
No independent-probe campaign or native guide was repeated for this pose, and
previous near-rim error numbers do not quantify its accuracy.

Types, formatting, current links, Git whitespace, immutable artifact hashes and
recorded coordinate/heading identities are checked before handoff. Current
source defaults match this scene. No production or city-data files were edited,
and existing runs remain immutable. No numerical process is running.
Final authentication checks all 221 run artifacts (15,785,574 bytes), verifies
the actual-map/canonical rotation for observer and Sun, closest-approach phase,
heading order and shared-cache identities. The adviser recommends
`feat(experiments): render Union Glacier dome scene` for this scoped local
checkpoint, preaccepted by the active execution workflow. Unrelated changes
remain excluded; no push.

### Union Glacier repeat at 5 km altitude

The owner requested the same two scenes at 5 km camera altitude. Changed only
the default observer height from 50 m to 5,000 m. Retained Union Glacier Camp
coordinates, the closest-approach source position/orbit, level northward and
southward headings, green spectral ground endpoint, exposure 0.06, 90-degree
horizontal FOV, Native15 N12 cache layout and quadrature. Camera-dependent
diagnostics derive their height from the request. This is 5 km above the
experiment's flat ground, with shortest dome clearance 6,047.130 m; the Sun's
elevation changes geometrically to 28.5359 degrees without moving the Sun.

Accepted immutable run `00056-r4-three-final` supplies inward.png (toward the
Sun's bearing) and outward.png (180 degrees away), both 1280x720, from one
shared completed cache. Actual images were inspected. The ground is visibly
veiled by scattering on the longer slant paths; sky and green ground remain
visible. Existing angular banding remains an approximation limitation.

Local independent geometry, columns, spectral composition and display checks
pass: maximum transmission discrepancy 8.07e-8, composition discrepancy
2.31e-9 and display discrepancy zero code values. No nonfinite/undrawn pixels;
owned textures and geometries are zero after disposal. Both frame totals,
including capture/readback/PNG/checks, were 1.633 and 1.408 s on the recorded
hardware. Local source types/formatting and immutable artifact hashes are
checked before handoff. No fresh probe or native accuracy campaign is claimed.
Existing runs, production and unrelated changes remain unchanged. No numerical
process is running.

Final authentication verifies 221 artifacts (11,479,288 bytes) and matches all
retained scene settings except height and its derived coordinates/geometry to
run `00055`. The adviser recommends `feat(experiments): render Union Glacier at 5 km`
as the preaccepted scoped local checkpoint. No push.
