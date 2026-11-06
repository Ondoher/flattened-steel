# Flat Dome Cache Shape Execution

Status: M2 pilot published; executing M3 under the owner's independent-execution invocation.

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

Measure stage and run elapsed times in generated manifests. Overall elapsed
includes authoring, tools, solver/browser waits, verification, and recovery;
it is not pure reasoning or GPU time. The first implementation slice establishes
immutable run allocation and an independently verifiable physical coordinate.
