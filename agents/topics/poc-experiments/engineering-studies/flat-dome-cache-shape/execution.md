# Flat Dome Cache Shape Execution

Status: executing M1 under the owner's independent-execution invocation.

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

## Timing and Resumption

Measure stage and run elapsed times in generated manifests. Overall elapsed
includes authoring, tools, solver/browser waits, verification, and recovery;
it is not pure reasoning or GPU time. The first implementation slice establishes
immutable run allocation and an independently verifiable physical coordinate.
