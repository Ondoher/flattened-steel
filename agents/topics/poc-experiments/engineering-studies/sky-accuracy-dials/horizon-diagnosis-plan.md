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

The owner selected [matched libRadtran radiance agreement](reference-model-target.md#current-accuracy-metric)
as the primary numerical-accuracy metric on 2026-10-14. Preserve the paper's fixed
physical inputs for its competitive benchmark; Kider is secondary empirical
evidence. Reference configuration equivalence and convergence must be qualified
before calling a discrepancy numerical error. Flat/finite-Sun cases retain their
matched continuous references until an equivalent libRadtran problem is established.
H0-H7 evidence keeps its original definitions. H7's Toronto substitution remains
a physical sensitivity, not a correction to the fixed paper benchmark. No new
compute package is selected by this metric change.

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

## Next Actions: H3-H6

H3-H6's bounded scientific work is complete as accepted 00244-00247. The
[assumption results](horizon-assumption-results.md) own findings, limitations and
the matching implementation gate. The following sequence and registrations are
retained as the executed plan; no additional package is automatically selected.

The owner selected the following continuation after H0-H2. Its purpose is to
identify the assumption responsible for the missing orange. The continuous local
reference reused the installed spectral-to-RGB weights, so transport agreement
does not independently validate color conversion. CPU/GPU display agreement also
establishes implementation parity rather than correctness of the chosen mapping.

1. **H3 - Independently check spectral-to-color conversion.** Start with the saved
   local and distant spectra from accepted 00239-00241. Independently calculate
   XYZ, chromaticity, luminance and linear RGB from documented color-matching data
   and integration rules; do not reuse the installed projection weights or their
   builder. Check wavelength/channel order, spectral-density units, wavelength
   integration weights, normalization, matrix conventions and negative/clipped
   values. Use simple known-spectrum controls and state the provenance of any
   shared source tables. Compare before exposure and display mapping, then account
   for those stages separately. Retain signed differences and numerical tolerances.
   A warmer independent result would implicate conversion; agreement would narrow
   the search while leaving the fifteen-channel spectral resolution unqualified.

2. **H4 - Trace wavelength contributions along the Flat rays.** If H3 does not
   explain the symptom, instrument a handful of the existing continuous N1 rays,
   including the neutral band and an upper-sky control. Retain distance/altitude,
   source and view extinction columns and transmittance, source-distance dilution,
   and Rayleigh/Mie spectral contributions by path segment. Locate where the warm
   contribution becomes insufficient or blue contribution dominates. Check source
   spectrum, coefficients, phase-angle convention, units and geometric endpoints
   against their defining equations. Keep combined extinction when attributing
   emission; label any deliberate equation intervention as a diagnostic.

3. **H5 - Compare matched scattering orders and explicit headings.** Begin with
   N1 in both local and distant geometries, recording heading relative to the Sun
   and a small common elevation set. Preserve and identify each witness's physical
   inputs; use separately declared controls to isolate individual geometry/source
   differences. Do not attribute the current local-N1/distant-N4 difference to
   geometry alone. Examine distant N1 versus N4 only with compatible authenticated
   order evidence or a separately bounded matched calculation. Report unavailable
   reference support instead of substituting the older Kider configuration.

4. **H6 - Test the implicated assumption.** Select a source-spectrum, extinction,
   phase, geometry or conversion intervention only after the preceding evidence
   identifies a candidate. Freeze the predicted signed spectral/color change,
   uncertainty, inputs and stop conditions before generating its result. Change
   one assumption at a time and recompute affected transport/orders consistently.
   If two factors are implicated, register the small baseline/A/B/A+B comparison
   under Accuracy Interactions. Check whether improvement exposes another error
   that had been compensating for it; appearance alone does not establish a fix.

**The owner's independent-execution request authorized H3-H6.**
The executed H3 package uses accepted 00239-00241 and the unchanged original
CIE CSV, with independently authored quadrature and the W3C D65 XYZ-to-linear-sRGB
matrix. Compare the declared midpoint rule separately from bin-integrated matching
functions; the latter assumes a constant spectrum within each bin and is not a
recovered high-resolution spectrum. Controls verify the publisher CSV checksum,
equal-energy chromaticity, D65 white and individual-bin linearity. Midpoint parity
uses 1e-8 relative tolerance; retain matrix/within-bin changes without treating them
as implementation failures. Limit H3 to 120 seconds CPU and 4 MiB new evidence,
with no browser/GPU job or cache build. Freeze its recipe in a fresh run before
computing, preserve all signed results, and continue only on attributable evidence.
H4-H6 depend on the results; register their bounded packages before execution.
Begin with a handful of reference
rays, with no cache rebuild, broad accuracy sweep, production change or automatic
N4 campaign. Earlier compute allocations remain consumed. Preserve parent runs and
write every derivative into a fresh run under the existing experiment contract.

Batch any authored-code review at a coherent milestone using bootstrap's existing
folder-resolved rules, including the required types review. Do not add production
review standards because the probes read production implementations, or request a
new pass after each diagnostic run or candidate tweak. This documentation update
does not initiate a reviewer round.

### Registered H4 Package

Accepted 00244 independently reproduces midpoint projection and leaves the Flat
3-degree band nearly neutral under bin-integrated color matching. H4 therefore
proceeds with the accepted 00241 continuous physical inputs and three existing
center rays: 0.05, 3 and 20 degrees. Recompute the same continuous N1 equation at
4096 Simpson intervals, retaining Rayleigh/Mie contributions in distance strata,
source/view optical depths, density and phase values. Require relative radiance
parity with 00241 within 1e-10 and additive stratum/species residual below 1e-12.
Prediction: the neutral band combines nearby blue Rayleigh and warm Mie emission;
distance-varying source attenuation/dilution and view extinction must explain the
retained totals without an additional color operation. This is attribution, not
an aerosol-removal simulation. Limit H4 to 120 seconds CPU and 2 MiB new evidence.

### Registered H5 Package

Accepted 00245 reproduces the prior N1 spectra to about 6e-15 relative and preserves
the warm-Mie/blue-Rayleigh balance. H5 uses Native15 source/medium inputs, 5 m
observer altitude, elevations 0.25/3/20 degrees and Sun-relative headings 0/90/180
degrees. Retain the actual San Jose local finite-source placement and independently
resolve the distant source placement through its current geometry owner.

Use a controlled chain: flat finite source at its observed placement and top
100 km; flat parallel source matched to its observer direction and irradiance;
then the same parallel source in spherical geometry at the same top; then the
60 km distant top; then actual distant observer Sun direction and Native15 incident
irradiance. Each adjacent pair changes one declared geometric/source boundary.
The first two cases retain each elevation's accepted observer-dome ray length,
which is azimuth-invariant; spherical cases use the physical upper boundary.
These are physical contrasts, not matched photographs or a cache accuracy claim.
Use 2048/4096 Simpson view intervals and 64/128 Gauss nodes for curved optical
columns; require <1e-4 relative refinement, retain failures without relaxation.
Prediction: the neutral Flat band persists when replacing finite illumination by
locally matched parallel illumination because effective scattering is relatively
near the observer; source altitude/geometry can alter the balance without requiring
a conversion defect. No compatible current N1/N4 order package is yet established;
do not spend a new N4 campaign merely to complete this contrast. Limit H5 to
120 seconds CPU and 4 MiB new evidence; progress/guards apply between rays.

### Registered H6 Package

Accepted 00246 retains a near-neutral 3-degree away-Sun Flat N1 band under matched
parallel illumination; curvature makes the same-order control bluer. H4 shows
strong blue near-path contributions balanced by warmer attenuated far-path light
and warm Mie emission. At the observer on that ray, the current g=0.7 Mie phase
value is about 0.01038 sr^-1 versus Rayleigh's 0.06353 sr^-1. Test this angular
suppression and the assumed 0.8 scattering albedo as explicitly uncalibrated
physical sensitivities, not accuracy refinements or recommended aerosol settings.

Use the same 0.05/3/20-degree local rays and full combined extinction, with four
recomputed N1 cases: baseline; A changes only Mie g to zero within the same
Cornette-Shanks family; B changes only Mie single-scattering albedo to one; A+B.
Zero g in this family has a Rayleigh-shaped phase, not an isotropic phase. Check
phase normalization and forward-scattering direction separately. Prediction:
A increases warm off-Sun Mie emission enough to give warm RGB ordering at 3 degrees,
while the 20-degree control remains blue; B alone produces a smaller warm shift.
Because albedo scales only the Mie source at fixed extinction, the spectral
interaction must satisfy I_AB = 0.25 * (L_A - L_baseline), to 1e-10 relative
above a 1e-12 absolute floor. Retain sign reversals and misses. The comparison
cannot establish actual aerosol phase/albedo from an expected image color.
Limit H6 to 120 seconds CPU and 2 MiB new evidence, with no cache build or GPU job.

## H7: Measured Aerosol Handling And Horizon Response

The owner selected this next diagnostic experiment on 2026-10-14. Continue in the
existing Sky Accuracy Dials lane. Reuse the authenticated phase/SSA retrieval and
representation from [00234/00235](aerosol-sensitivity-results.md); do not replace
the atmosphere by the uncalibrated g=0 endpoint used in H6.

Implement experiment-owned wavelength-dependent normalized phase tables and SSA
in the continuous reference. Use the same material handling in flat and spherical
geometry. No production implementation, cache build or default change is selected.
The retained Toronto Level 1.5 retrieval is a physical alternative, not a measured
San Jose atmosphere. Keep its extinction/AOD, vertical profile and ground inputs
out of this intervention: preserve each witness's existing medium and source.

### Frozen Package

- Parent inputs: accepted 00235's normalized 83-node phase tables and SSA bands;
  accepted 00246's physical N1 ray configurations; accepted 00239's display state.
- Rays: elevations 0.25/3/20 degrees, Sun-relative headings 0/90/180 degrees;
  actual local finite-Sun flat case and actual distant-source spherical N1 case.
- Four recomputed cases: original aerosol; measured phase only; measured SSA
  only; measured phase and SSA together. Retain every signed spectral/color change
  and the phase-by-SSA interaction rather than adding their isolated effects.
- Spectral policy: interpolate normalized phase and SSA between supported
  retrieval bands for Native15 centers at or above 440 nm. Keep the original phase
  and SSA at the three lower centers, without extrapolating 440 nm into them.
  Report this as a partial-band intervention, not a complete measured spectrum.
- Validate table positivity, normalization, angle convention and wavelength
  interpolation. Use 2048/4096 view intervals and 64/128 curved column nodes,
  with <1e-4 relative refinement and <1e-10 parity to the retained N1 baseline.
  Preserve prediction misses; do not alter acceptance tolerances after results.
- Prediction: the broader measured off-Sun phase and higher visible SSA increase
  the warm Mie contribution on the Flat 3-degree away-Sun ray. Phase+SSA should
  increase its raw R/B ratio, without requiring every ray or model to improve.
  The prior 39.1% selected-visible Kider improvement is not a horizon prediction
  or a new full-benchmark score.
- Produce a compact sampled-color SVG comparison at fixed baseline display
  illuminance, plus a separately labelled equal-luminance diagnostic to distinguish
  brightness from hue. Use the installed midpoint color convention for displayed
  chips and retain independent bin-integrated color values as a cross-check.
  These are labelled ray samples, not app screenshots or full-scene renders.
- One CPU-only package: at most 180 seconds including setup/retention and 4 MiB
  retained output, no automatic retry on cap exhaustion. Reuse parents read-only,
  allocate a fresh run, publish progress between rays and preserve immutable seals.

Assess whether the supported aerosol changes warm the horizon, how phase and SSA
balance, whether upper sky is preserved, and whether display compression masks
the raw change. Current distant N4, all-order aerosol transport, real-aerosol
calibration and production promotion retain their separate unqualified status.
Batch only the mapped experiment review at the stable implementation milestone.
The H7 baseline is `.codex-tmp/review-standards/session-UQDsIf/baseline.json`.

## Resources And Evidence

### H8: Component And Scattering-Order Cancellation Map

The owner selected a map of compensating inaccuracies, including offsets arising
during later scattering. Build one retained-data CPU report, without atmospheric
recomputation or physical-input changes. Use paper-atmosphere 00224 numerical
factorial results, independent P1 reference/geometry 00109/00110, libRadtran's
authenticated published spectra, independent P2 witnesses 00179/00200, and the
matched H order-1-through-6 diagnostics from 00171. Preserve all parents.

Within P1, use a declared ordered telescoping decomposition: corrected remainder;
density reconstruction; phase reconstruction; sunlight-column reconstruction;
transmission/product grouping; split/combined grouping. Restore each inaccurate
operation in that fixed order. These conditional contributions depend on that
path and are not a unique allocation of interacting errors. Add the unisolated
higher-order/reference gap so their signed sum reproduces baseline minus
libRadtran. Verify pointwise additivity and the full SSE cross-term identity.
Map negative cross terms as opposition and positive terms as reinforcement;
opposition alone does not establish that dropping either term improves the score.

At the four qualified P2 scalars, separate measured P1 error, measured P2 error
and the unisolated later-order/reference remainder. Elsewhere retain the higher
remainder as unknown rather than attributing it to P2 or later orders. Also show
the measured order-5/6 increment and its effect on reference agreement, with
unchanged first-four-order prefix checks. Positive radiance contributions are
not themselves numerical errors. Later orders can contain compensating errors;
missing independent tail truth remains an explicit coverage gap.

Deliver an offline interactive HTML map, static figure and compact numerical
decomposition, with filters for time/wavelength and sparse benchmark-grid views.
Spatial cancellation is pointwise: opposing errors must occur at the same
time, direction and wavelength. Distinguish horizon/upper-sky locations using
their retained elevations; a signed mean over different locations is not evidence
that local errors cancel. Show both net signed error and opposition strength,
and leave unsampled positions blank. Pairwise aggregate cross terms accompany,
but cannot replace, that spatial map.
Do not fill unsampled sky positions or label the map as a complete sky survey.
All claims are against retained libRadtran output; configuration/convergence
qualification remains open. This is numerical diagnosis under fixed paper inputs.
Limit the package to 120 seconds including temporary plotting-tool setup and
2 MiB retained output, with ordinary
disk/progress/immutable-run rules and no GPU/browser job. Batch the mapped source
review once the coherent implementation is stable. Baseline:
`.codex-tmp/review-standards/session-4zJwZ4/baseline.json`.

### H9: Join Retained Small-Ray References

The owner selected this reporting package after H8. Join accepted 00230's five
all-order stochastic rays to 00250's component decomposition at matching times,
directions and channels. Verify physical inputs against 00103 and geometry against
the original 00099 registration. Split the signed total residual into measured P1
error, aggregate higher-order approximation/truncation error, and continuous-solver
minus retained libRadtran. Preserve the direct sampling intervals, precision misses
and the shared, opposing uncertainty in the last two terms. At the four independent
P2 scalars, split out P2 error and the remaining order-three-plus approximation.
Compare the matched N5/N6 increment without treating it as an error estimate.

Include 00232's six alternate rays as a separately identified baseline/reference
comparison, checking the same physical packet and published reference identities.
Do not substitute its Native48 control for H8's H hybrid. Include 00245's actual
Flat horizon species/distance attribution as a separate geometry and spectral
boundary; never join it numerically to the spherical paper reference.

Write one new immutable CPU-only report with compact numerical output and an
offline table view. No atmospheric integration, cache build, GPU/browser job,
dependency installation or parameter fitting. Limit execution through retention
to 60 seconds and new evidence to 2 MiB; no automatic cap retry. Record testable
hypotheses with predicted signs/locations, discriminating tests and falsifiers,
without automatically executing those new tests. Batch one mapped review for this
coherent source/documentation unit. Baseline:
`.codex-tmp/review-standards/session-RwbPUa/baseline.json`.

### H10-H14: Test The Four Hypotheses

The owner selected the [hypothesis test plan](hypothesis-test-plan.md) after H9.
It owns the exact witnesses, profile/geometry boundaries, predicted outcomes,
falsifiers and stage admission rules. The proposed package starts with a reference
audit, then bounds three targeted numerical comparisons and a final assessment
to 20 minutes of aggregate execution, at most three serial GPU attempts and
16 MiB of new retained evidence. The [hypothesis results](hypothesis-test-results.md)
record the completed owner-directed bounded sequence, including measured phase P1,
raw order replay, Native48 attribution, Flat N1 cache evidence and explicit missing
full recurrence cells. Failed runs remain immutable; no earlier run is reopened.

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

The [current accuracy criterion](reference-model-target.md#current-accuracy-metric)
now uses qualified libRadtran agreement in place of Kider agreement to judge
numerical accuracy. The [H8 cancellation map](cancellation-map-results.md) applies
that criterion to retained paper-atmosphere component/order evidence. Exact
reference configuration and convergence qualification remain open.

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
The selected [H3-H6](#next-actions-h3-h6) scientific sequence is recorded in the
[assumption results](horizon-assumption-results.md). The owner-selected
[H7 aerosol comparison](#h7-measured-aerosol-handling-and-horizon-response) is
scientifically complete as accepted 00248/00249; the
[aerosol horizon results](horizon-aerosol-results.md) own findings, charts,
verification, resource accounting and its matching implementation-review gate.
The selected H8 retained-data package is scientifically complete as accepted
00250. The [cancellation-map results](cancellation-map-results.md) own its spatial
coverage, conditional P1 decomposition, four independent P2 witnesses, N5/N6 effect,
resources and matching implementation-review gate. The owner-selected H9 join is
scientifically complete as accepted 00251; the
[small-ray results](small-ray-cancellation-results.md) own the new attribution,
separate baseline/geometry boundaries and testable hypotheses. The
[H10-H14 results](hypothesis-test-results.md) record the finished bounded tests and
their remaining scientific limits. No scientific job is active. Matched Flat
near-horizon N1 cache/reference evidence is now in 00261; original path evidence is in 00245;
matched near-horizon paper all-order component references remain absent.
The coherent H3-H6 implementation unit
starts from `.codex-tmp/review-standards/session-b5Eogw/baseline.json`, captured
before authored code changes; review is batched after the selected sequence.
Implementation completion requires its matching current primary/audit receipt.
Historical scientific status and deferred review boundaries remain in
[status](status.md#verification-boundary). Reviewer lifecycle follows the
[repository owner](../../../standards/reviewer-status.md).
