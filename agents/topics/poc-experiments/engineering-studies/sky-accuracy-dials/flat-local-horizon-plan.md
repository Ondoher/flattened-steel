# Flat/Local Horizon: Defensible Reference Plan

**Selected for independent execution by the owner, 2026-10-16.** The execution
request lifts the earlier planning hold. H34–H37 form the initial package; H38
follow-ons depend on the findings. The elapsed-work estimate is guidance, with
continued monitoring while strong positive progress is being made. Current
progress and decisions are recorded in [execution notes](flat-local-horizon-execution.md).
Scientific checklist items below are complete within the stated qualified scope;
[results](flat-local-horizon-results.md) own findings and limits. Source-milestone
completion requires the separate generated review validation in session-dEqSA3.
The [current lifecycle](status.md#experiment-lifecycle) owns any selected follow-on.

## Goal And Limits Of The Claim

First establish how the San Jose closest local-Sun horizon should look under
specified physical assumptions, with justified numerical accuracy. Then identify
which calculations, model assumptions or display operations explain the current
appearance. Orange, white and gray are possible outcomes to investigate; none is
an acceptance target. Do not tune atmospheric parameters or exposure to obtain
the preferred color.

The owner clarified during execution that there is no established evidence that
current production is wrong. Independent expected appearance and the physical
reasons for it are the primary outcome; agreement is useful evidence, not a failed
search for a defect. Any proposed correction must follow a demonstrated mismatch.

A converged independent solver can establish the solution to a declared physical
model. Agreement cannot establish that a hypothetical flat atmosphere and nearby
Sun reproduce a measured natural sky. Report numerical uncertainty separately
from uncertainty in the source, aerosols, ground and atmospheric boundaries.

This continuation stays inside the existing [design](design.md) and experiment
boundaries. Production and other experiments remain read-only. The ended angular
quadrature and altitude reconstruction experiments remain ended. Preserve every
earlier run and derive new evidence into new runs only.

## Evidence To Reuse, With Its Original Limits

- [H21–H26 independent reference](independent-horizon-reference-results.md):
  cache-free binary64 single scattering and GPU stochastic multiple scattering,
  analytic controls and recorded convergence. Reuse the machinery; authenticate
  its inputs and compatibility before treating it as a current-app reference.
- [H27 brightness investigation](horizon-brightness-results.md): a physical
  low-horizon brightness dip already exists in the tested single-scattering
  model. A small GPU display proof also found a raw-shader encoding concern.
  Neither result certifies today's complete application or its output contract.
- [H33 species attribution](horizon-second-order-results.md): demonstrated
  angular integration errors and opposing species contributions in selected
  second-order calculations. This suggests tests; it does not identify the cause
  of the local app's horizon.
- [Earlier stage measurements](horizon-diagnosis-results.md): retained physical
  state, spectra and display attribution. Historical screenshots are witnesses,
  not exact current-state registrations.

The independent reference must not import production transport, density, phase,
cache reconstruction or integration functions. Record shared physical data,
spectral tables and generic numerical dependencies explicitly. Production cache
values are comparison measurements, never inputs to the reference solution.

The [accuracy criterion](reference-model-target.md#current-accuracy-metric)
remains unchanged: qualified libRadtran comparisons support isolated correctness;
any eventual full-cache candidate must match or improve the paper RMSE under the
fixed original protocol. Existing spherical/distant-source reference data do not
certify a finite local source in a flat medium. No new external installation,
data acquisition or AERONET campaign is selected here.

## H34 — Register The Current Problem

- [x] Freeze a reproducible current-app San Jose closest, solar-noon state.
  Record resolved date/time, source position, spectrum, power/reference irradiance
  and inverse-square normalization, source extent, observer altitude, camera,
  cache identity, scattering order and native spectral-bin semantics.
- [x] Record atmospheric density profiles, extinction/scattering coefficients,
  phase functions, single-scattering albedo, absorption, ground treatment and
  every material difference from the paper atmosphere. The nominal scientific
  control uses paper settings; retain an explicitly separate matched-app case
  wherever today's app differs. Do not conflate a material change with a cache
  error.
- [x] Specify the physical medium boundary separately from the observer's view
  termination. In particular, an observer-centered dome cutoff on the camera ray
  is not automatically a physical boundary on every later scattering ray.
- [x] Register 18 initial rays: elevations 0.05°, 0.25°, 1°, 3°, 10° and 20°,
  each toward, across and away from the Sun. Save actual vectors and exclude or
  flag direct-source/ground occlusion. Keep exact horizon boundary cases as
  separate controls rather than mixing them with strictly positive elevations.
- [x] Save an actual baseline horizon image and its exposure, adaptation, white
  balance, tone mapping, transfer and framebuffer settings. Use a bounded
  resolution, initially at most 1024 × 768, rather than a film or full-display
  capture campaign.

**Deliverable:** authenticated problem manifest, ray diagram/table and baseline
image. Freeze the comparison definitions and numerical tolerances before examining
reference-versus-app agreement.

### Registered Decision Quantities

Before the first comparison, freeze the following draft tolerances and exact ray
pairings in the problem manifest. These concern matching physical inputs, order
and domain; they are not preferred-color targets.

| Quantity | Definition | Proposed practical agreement tolerance |
| --- | --- | --- |
| Absolute brightness | Signed relative app-minus-reference luminance at each ray | ±2% |
| Horizon gradient | Ratio of luminance at each elevation below 1° to the 10° ray at the same azimuth; compare app/reference ratios | ±2% relative ratio difference |
| Color | Signed app-minus-reference differences in CIE x and y at each ray | ±0.002 in each coordinate |
| Spectral shape and amplitude | Signed relative residual per native visible bin, retaining absolute residuals and the original spectra | ±2% above the registered negligible-signal floor |

Keep the 20° ray as an additional upper-sky control. Register absolute tolerances
for negligible signals in their authenticated units before running. Do not move
floors or tolerances after seeing discrepancies. Do not hide horizon failures in
an average over elevation, azimuth or wavelength.

Classify each quantity using its sampling interval and separately reported
estimated discretization uncertainty: **agreement within tolerance** when the
resulting numerical uncertainty envelope lies wholly inside the tolerance band;
**resolved disagreement** when it lies wholly outside; **unresolved** otherwise.
An effect can be statistically resolved while still inside the practical
tolerance; report that distinction. Refinement estimates are not rigorous bounds,
and physical-input uncertainty does not excuse a mismatch in a matched-input
comparison. Preserve covariance for ratios and paired differences. Do not claim
a simultaneous confidence level for the whole ray/bin set from marginal intervals.

## H35 — Qualify The Independent Calculation

- [x] Authenticate selected parent artifacts and terminal seals, inventory shared
  dependencies, and qualify the existing reference for the registered problem.
  Reuse compatible qualification evidence after checking its scope and identities;
  rerun affected controls rather than repeating the entire historical suite.
- [x] Check vacuum, Beer attenuation, homogeneous-source integration, exponential
  density columns, phase normalization/sampling, source visibility and flux
  units, inverse-square behavior and flat boundary intersections. Include a
  controlled distant-source limit with fixed observer irradiance.
- [x] Compare independent single-scattering formulations and quadrature
  refinements. Target at most 0.2% deterministic radiance change above a
  predeclared negligible-signal floor. Define that floor in the authenticated
  spectral units and bin convention before execution. Refinement differences
  estimate numerical stability; they are not rigorous error bounds.
- [x] Use all native visible spectral bins for color conclusions. At decisive
  rays, check energy-preserving spectral refinement and disclose the assumption
  about within-bin solar shape. Three-band pilots may estimate cost but cannot
  certify final color.

**Deliverable:** qualification table identifying passed controls, unresolved
accuracy limits and which physical inputs remain assumed. A failure blocks the
affected scientific claim, not unrelated documentation or analysis.

## H36 — Establish Expected Radiance And Its Causes

**First milestone:** complete matched N1 rays and the first H37 comparison image
before broader order, distance or species attribution. H37 presentation work may
therefore begin before the remaining H36 tasks.

- [x] Record the unchanged app's actual scattering order. Compute independent
  N1 spectra for the registered rays. If the app uses N1, compare it directly
  under matched physical inputs and observer-ray domain. If its actual order is
  higher, preserve that baseline and obtain a separately labelled forced-N1
  diagnostic through experiment-local configuration. Compare that diagnostic
  with independent N1, and compare the unchanged app only with a reference
  summed through its actual order. If the latter is not yet available, leave
  that comparison pending. An order mismatch is not evidence of cache error.
- [x] On a small decisive subset spanning the low horizon and upper sky, estimate
  N1, N2, N3, N4 and the remaining multiple-scattering contribution using the
  independent GPU solver. Preserve unbiased tail handling; never silently drop
  paths at a safety cutoff.
- [x] Compare the app's camera-ray termination with an extended/infinite-slab
  camera-ray case as a separate intervention. Hold scattering order and the
  physical medium fixed. Do not confound domain changes with additional orders.
- [x] Record species, last-scatter altitude/distance and scattering-order
  contributions with additive totals. Track both source-to-scatter and
  scatter-to-observer distances and optical depths. Previous distance summaries
  excluded the direct solar leg; they cannot answer this entire question.
- [x] Preserve batch identities and covariance for correlated differences and
  color ratios. Use independent-seed, refinement and roulette checks. Proposed
  precision targets are 95% sampling half-widths near 1% for luminance/decisive
  radiance and 0.001 for chromaticity coordinates, with actual widths reported.
  Targets missed within the budget remain unresolved rather than becoming
  evidence of a difference.

**Deliverable:** expected spectra, luminance and chromaticity ranges for named
assumptions, with a breakdown of whether nearby or distant scattering supplies
the horizon. Distinguish sampling, discretization and physical-model uncertainty.
Report the registered agreement classifications per ray and quantity; explain
resolved discrepancies separately from uncertain or practically small effects.

## H37 — Connect Physical Radiance To The Visible Horizon

- [x] Trace physical spectrum → XYZ/xy and luminance → linear RGB → tone-mapped
  linear output → encoded framebuffer bytes → saved image. Establish the
  intended output contract using a neutral-ramp control and the actual app path.
  Do not select a transfer merely because it makes the horizon brighter, or apply
  the display transfer twice.
- [x] Hold exposure, adaptation, white balance, camera and presentation settings
  fixed across comparisons; preserve the unchanged app baseline. Do not fit
  exposure to reduce a reference discrepancy.
- [x] Produce the first side-by-side N1 diagnostic horizon and matched independent
  N1 render or spatial strip as soon as those calculations qualify, with enough
  angular coverage to show the gradient. Identify whether the app image is the
  unchanged runtime or a forced-N1 diagnostic. If runtime order differs, also
  retain the unchanged baseline and present its own matched-order comparison
  when available. For sparse multiple-scattering samples, show measured points
  and uncertainty separately; do not present interpolation as a fully computed image.
- [x] Present physical luminance/chromaticity plots beside fixed-display images
  so a darker output can be distinguished from a neutral spectral balance.

**Visual checkpoints:** actual baseline at H34; reference-versus-app horizon at
the first qualified N1 comparison, before broader attribution; final annotated
side-by-side at H37. Use interim
swatches or plots when helpful, without requiring images for every run. Label
source geometry, order, domain, exposure and numerical uncertainty on comparisons.

**First-goal completion:** provide a defensible expected appearance for the
declared model, evidence that the reference is converged to reported tolerances,
and registered agreement/disagreement/unresolved classifications against the
appropriate app order. Include measured horizon brightness ratios, chromaticity
and signed spectral residuals alongside the images. A first N1 image is a progress
milestone, not completion of any outstanding runtime-order or all-order claim.
Where evidence cannot distinguish causes, state the remaining alternatives and
a costed test.

## H38 — Conditional Follow-On Work

Select follow-ons from the measured discrepancy; this is an outline, not an
automatic parameter sweep or permission to change production.

| Observation | Next discriminating test |
| --- | --- |
| App differs from an independent reference at its matched order | Isolate cache coordinates/interpolation, spectral packing, view integration and termination, one intervention at a time; use forced N1 to narrow the cause. |
| N1 agrees, but independent later orders change the horizon | Attribute the missing contribution by order, species and location before proposing an order/cache change. |
| Ray-domain cases differ materially | Test view termination and coverage separately from the medium's physical boundary. |
| Spectra agree but rendered images differ | Resolve the measured display contract/encoding discrepancy using neutral controls. |
| Independent solutions agree on a dim or neutral horizon | Test uncertain physical assumptions rather than declaring the solver wrong from appearance alone. |

Physical sensitivity candidates include aerosol phase, albedo, loading and
height, source position/extent/spectrum, and ground reflectance. Vary one at a
time with an explicitly stated normalization. Reflective-ground tests require
an independently qualified boundary/BRDF extension; the existing black-ground
solver does not already support that claim. If compensation appears, use a small
targeted paired/factorial comparison instead of a broad search for warmer colors.

Any resulting full-cache proposal has a separate paper-RMSE gate and must preserve
production twilight behavior. This plan does not authorize production promotion.

## Proposed Execution And Verification Envelope

When execution is explicitly requested, first refresh the governing topic and
reviewer readiness, capture the implementation review baseline, authenticate
selected evidence, and check current source/backend identity and storage. Do not
renew old compute packages or relabel historical receipts.

**GPU first.** Favor the GPU for spectral probe batches, scattering estimates,
diagnostic cache builds and horizon image generation. Experiment-local shaders,
direct GPU harnesses and batching are appropriate; they need not follow product
architecture, runtime APIs or product resource-admission policies. Keep numerical
independence, experiment isolation, provenance and applicable experiment checks.
Use short CPU binary64/analytic calculations as independent controls and for work
where GPU setup would cost more than the calculation. Do not default a substantial
workload to the CPU merely because a CPU implementation already exists; record
the reason for a material CPU fallback and estimate its cost first.

Use **60 minutes total elapsed work as planning guidance**, including context
and compatibility checks, implementation, numerical/capture work, repairs,
analysis, required reviews and reporting. Initially estimate **20 minutes** of
numerical/capture work; this is a planning estimate rather than an automatic stop.
Keep individual GPU jobs bounded at 10 minutes and run only one GPU job at once.
Start the elapsed clock when execution is requested; waiting for tools or reviews
counts. Neither elapsed-work estimate guarantees that every H34–H37 deliverable fits.

At **30 minutes elapsed**, report progress toward the first qualified N1 image,
the largest remaining uncertainty and an estimate for the remaining work. If
the image is not ready, prioritize that milestone over broader attribution. A
pilot must determine the bounded workload before costly multiple-scattering or
image work. Broader H36 attribution proceeds only after the first comparison
image, with an updated estimate of the remaining effort.

At **60 minutes elapsed**, assess and report results, pending reviews, remaining
uncertainty and the next expected milestone. **Continue without stopping or
requesting renewed permission while strong positive progress is being made.**
Positive progress means qualified comparisons or images becoming available,
precision improving toward the registered targets, or evidence narrowing the
possible causes. Time spent or repeated activity alone is not positive progress.

Beyond that checkpoint, reassess at least every **15 minutes**, maintain regular
user-facing updates and revise the remaining-work estimate. Continue within the
selected goals and experiment boundaries; do not expand into unrelated sweeps.
If progress stalls, investigate the cause and choose a bounded corrective step
or report the concrete blocker and a costed continuation. Do not stop merely
because an elapsed estimate has been reached, or relax numerical targets to
finish. These progress checkpoints do not themselves require another review or
successful-science rerun.

Propose at most **16 MiB additional retained evidence**, within the existing
512 MiB lane retention cap, 1 GiB scratch cap and 40 GiB free-disk floor. Check
actual headroom before activation. Retain compact spectra, provenance and bounded
images; avoid full-cache exports, full-resolution films and duplicate fields.
Do not introduce a new free-system-memory admission gate.

Use immutable runs, real-path ownership checks and progress heartbeats at most
30 seconds apart. Routine repairs may retry within the package after recording
the failure and changed cause; every attempt gets a new run. Preserve all prior
evidence. Do not repeat successful science solely to verify a report.

After authored code stabilizes, run the local type check and required mapped
source reviews at one coherent implementation milestone, including the mandatory
types/contracts review and applicable audit. Individual diagnostic runs and image
updates do not each require another review. Scientific results and implementation
review completion must retain separate statuses.

**Current state:** execution selected. Scientific and implementation completion
remain separate gates, tracked in the execution notes and experiment status.
