# Gray Horizon Diagnosis

## Selected Question

The owner reopened Sky Accuracy Dials on 2026-10-14 to diagnose the gray/muddy
horizon in both current cache paths. Diagnose before changing behavior.
The leading owner hypothesis is a shared problem that Flat geometry or its
parameters exacerbate. This is a hypothesis to test, not a measured attribution.

Selected witnesses supplied by the owner:

- San Jose at solar noon: pale gray band immediately above the ground.
- Flat San Jose closest: stronger brown-gray band. **Orange is expected along
  this horizon; gray is the defect to explain.** The attached screenshots identify
  the visible symptom; they do not supply spectral measurements or complete state.

Resolve these labels through current application controls. Record the actual mode,
date basis, resolved instant, camera, observer altitude, viewing direction, Sun
geometry, cache identity/order, atmosphere, ground, source and display state before
comparison. Do not infer a date or exact view ray from a screenshot.

## Controls And Stage Isolation

Use the ordinary current packed compact local-Sun configuration and current
distant-Sun configuration. Authenticate actual selections rather than substituting
an older experiment profile. Preserve each mode's geometry and physical inputs;
the scenes are separate witnesses, not a matched physical pair. Within each mode,
hold all inputs fixed except the stage under examination.

Trace the first loss of horizon color through:

1. Physical inputs: source spectrum, density/extinction, scattering spectra,
   phase, ground contribution, enabled absorption and scattering-order selection.
2. Cache construction and lookup: spectral payload, normalization/restoration,
   coordinate transforms, support/boundaries, interpolation and packing.
3. Viewing-ray accumulation: path length, altitude, extinction, sample positions,
   geometry intersections and any ground/sky mixture at the horizon.
4. Color and presentation: spectrum to XYZ/linear RGB, exposure/adaptation,
   gamut/clipping, display transform and scene composition.

Begin with the source/contract trace and a compact set of rays immediately above
the physical horizon plus an upper-sky control. Record geometry-owned ray directions
and Sun-relative azimuth. Exclude ground and the solar disk from sky-only comparison;
inspect boundary composition separately. Cached/reference comparisons within a mode
must use the same physical ray, spectral basis, physical inputs and order target.
The old Kider distant-Sun solver is not a local-Sun reference without a matched
physical implementation. Report missing reference support explicitly.

Retain spectral radiance before color conversion, XYZ/chromaticity and luminance,
scene-linear RGB and final display RGB where available. Record units, spectral
basis, exposure, negative/clipped values, transmittance and composition factors.
Offline reference integration is allowed; runtime source integration remains
precomputed and sample helpers retain the design's loop-free contract.

## Accuracy Interactions

The owner expects this investigation to expose how accuracy changes balance out.
Retain signed spectral and color changes at every observed stage. A better-looking
image can result from compensation; it does not establish numerical correctness.
Separate convergence toward a matched reference, physical-input sensitivity and
agreement with the owner's expected appearance.

After isolation identifies two plausible interacting controls, freeze predictions
for baseline, A alone, B alone and A+B on the same small ray set. Measure their
joint departure from the sum of isolated changes. Preserve sign reversals,
overshoots, null results and uncertainty. Register that bounded interaction package
before execution; do not launch a broad factorial search or tune to the screenshot.

## Bounded Sequence

- **H0 — Register and trace:** restore the topic, freeze the two control recipes,
  map actual implementation paths and identify available observation points.
  Source inventory needs no behavior changes or cache rebuilds.
- **H1 — Observe:** author only the minimal experiment-owned probe needed for
  one compact paired diagnostic package. Freeze inputs, predicted signatures and
  stop conditions before execution. Review authored code as one coherent milestone
  under the experiment's mapped standards, including the required types review.
- **H2 — Attribute:** choose one discriminating comparison from H1 evidence.
  Separate a shared cause from Flat amplification and accuracy compensation.
  Define the next bounded package before another run.

No saturation adjustment, aerosol fit, color correction, accuracy ladder, full
observation campaign or production fix is selected. Existing ozone-free horizon
evidence and aerosol sensitivity are comparison leads, not attribution for these
screenshots. Verify enabled inputs before proposing absorption toggles; physical
input comparisons must rebuild affected orders rather than mix incompatible fields.

## Resources And Evidence

Prior compute packages remain consumed. This continuation starts with H0 and does
not renew the previous 42 GPU attempts or multi-hour campaigns. Register H1 before
running it: one GPU job at a time, a ten-minute ceiling including setup, and at most
16 MiB of additional retained evidence within the existing 512 MiB total. Do not
retry automatically when the ceiling is reached. Record time, bytes and incomplete
outcomes. The [design](design.md#storage-and-execution-budget) retains its 1 GiB
scratch and 40 GiB free-disk limits and immutable-run/cleanup rules.

Use compact spectra, plots and bounded horizon crops; retain no full-resolution
frames or film. Operations over one minute publish flushed 30-second progress.
Authored probes belong in `experiments/sky-accuracy-dials/`; generated output belongs
in `tmp/experiments/sky-accuracy-dials/`. Derive and real-path-check roots, reject
links, allocate a fresh run and preserve complete derivation identities. Production,
other experiments and earlier runs remain read-only. Adoption remains on hold.

## Current Progress

Resumption and owner-selected witnesses are registered. Initial H0 source tracing
establishes these implementation facts at baseline `64d049f563d96127a691e776f792a9954ba89e60`:

- [Application presets](../../../../../src/flat32/consts.js) define San Jose at
  37.3382, -121.8863 with date basis `2024-06-20T12:00:00.000Z`.
  [Time resolution](../../../../../src/flat32/LocationTimeController.js) resolves
  Flat 0 through `closest-angle` at zero degrees and solar noon through a separate
  preset path. Capture resolved instants rather than assuming equivalence.
- [Bootstrap](../../../../../src/flat32/Flat32Bootstrap.js) defaults to compact
  local-Sun lookup and selects ordinary local N1 versus distant N4. Preserve
  this distinction while diagnosing the two current witnesses.
- Both [local mode](../../../../../src/flat32/FlatLocalMode.js) and
  [distant mode](../../../../../src/flat32/SphericalDistantMode.js) call the same
  [color factory](../../../../../src/flat32/Flat32ColorDisplayModel.js).
  [Production selections](../../../../../src/flat32/Flat32ProductionSelections.js)
  default to p2 and an empty presentation-filter list. Optional low-light filters
  target stars; their names alone are not evidence of sky desaturation.
- The [p2 model](../../../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js)
  inherits the [p9 display implementation](../../../../../src/algorithm32/implementation/color-reset-slope-078-p9/ColorResetSlope078P9ColorDisplayModel.js),
  using its own constants. It applies an achromatic receiver-illuminance gain
  followed by a per-channel exponential mapping. The shared
  [Bruneton owner](../../../../../src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js)
  supplies spectral projection and scene/transmittance composition. These are
  observation points, not demonstrated causes of the screenshots.

H0-H2's bounded scientific work is recorded in the
[diagnosis results](horizon-diagnosis-results.md): accepted 00239 live paired
observations, 00240 continuous local N1 reference, 00241 fixed-extinction species
attribution and 00243 assessment. The Flat gray band exists before display and
persists in the continuous N1 model; the shared display response compresses color
separation further. No production fix or distant N4 accuracy claim is made.
That results document owns exact limits, recovery, resources and questions/decisions.
Implementation completion requires its matching current primary/audit receipt.
Historical scientific status and deferred review boundaries remain in
[status](status.md#verification-boundary). Reviewer lifecycle follows the
[repository owner](../../../standards/reviewer-status.md).
