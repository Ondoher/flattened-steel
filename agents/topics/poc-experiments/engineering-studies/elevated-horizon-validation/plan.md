# Elevated Horizon Validation Plan

State: executed and verified on 2026-10-23. The owner invoked independent-execution.
[Results](results.md) record all milestone dispositions, evidence and limits;
[status](status.md) owns the resumption point. Production remains read-only.

## Outcome and starting point

Explain the spectral brightness and ground/sky contrast of the elevated globe
horizon, separating atmosphere assumptions, numerical transport and rendering.
A useful negative or inconclusive result is acceptable; a visually sharp horizon
is not a success criterion. The [design](design.md) owns physical matching,
boundary semantics, source/output isolation and evidence preservation.

Start from revision `e4b21c44`, its selected original-Bruneton cache, and the
recent 10 km San Jose noon captures. Shader-off sharpness is useful geometry
context; it does not establish the shader's physical correctness. Prior 5 m
libRadtran and independent-probe evidence supplies reusable input-export and
solver methods, not validation of this elevated boundary. Authenticate reused
source/artifacts and preserve their derivation chains.

The first executable step is M1's baseline/geometry registration and libRadtran
installation check. No extra approval is required for routine choices once
execution is requested. Do not infer numerical execution from experiment setup.

## M1 - Establish a trustworthy elevated reference

Purpose: verify that the external solver is calculating the intended atmosphere,
altitude and ground/sky rays before investing in a comparison image.

- [x] Capture exact executable profile, cache/source hashes, source spectrum,
      observer, Sun, camera, FOV, scene-depth/ground identity and display settings.
      Treat the saved 10 km globe/noon case as provisional screenshot context; label
      any unmatched screenshot settings explicitly.
- [x] Implement run allocation, path checks, artifact/parent hashes, terminal
      manifest and 30-second progress heartbeat. Keep the shared tool read-only;
      adapt its launcher AND Python worker inside this experiment, as specified by the
      design, before even doctor. Include repository discovery, copy identities and
      both output-root checks. Finalize the outer manifest after the host receipt.
- [x] Verify installed libRadtran and WSL through the established route; select
      fully spherical scalar MYSTIC/VROOM-off, matched physics and 10 km observer.
      Register all physical/unit differences and eliminate unintended defaults.
- [x] Register analytic ground/sky intersections and horizon depression. Capture
      actual app mesh/depth classification and camera pixel rays too; record any
      silhouette difference, angular footprint, antialiasing and output resolution. Pilot
      rays at offsets -0.1 and +0.1 degrees from the true horizon, plus local
      horizontal and a high-sky control. Use the actual screenshot azimuth when
      recoverable; otherwise explicitly start with anti-solar and label that choice.
- [x] Start at three diagnostic wavelengths. Verify output angular/sign
      conventions and surface sensitivity, finite outputs, seed variation and
      vertical-grid behavior. Include 10 km as an explicit layer boundary and
      independently check exported integrated optical depths.
- [x] Confirm matched black-ground boundary first. Test whether a neutral .2
      Lambertian boundary can be represented equivalently before using it as an
      end-to-end production comparison. Audit the cache boundary before paying for
      additional albedo scans; first finish whichever shared-boundary comparison is
      available without constructing a large new controlled solver. Qualify the solver's angular aperture near
      the limb; retain exact tangent only as a boundary diagnostic.

Deliverable: `results.md` M1 report with the matched-input ledger, pilot spectra,
ray classifications, input-fidelity differences and measured solver throughput.
Keep operational data in JSON/CSV and the native Markdown report. After geometry
qualification, publish a small provisional three-wavelength horizon strip when it
shows actual color/spatial differences. Label its approximate mapping and sparse
sampling, prohibit photometric conclusions and retain it beside the final strip;
do not interpolate a fabricated smooth boundary. No image is needed for status.

Advancement: correct geometry/units and a usable independent reference. If source,
surface or phase matching is unsupported, repair only that export/adapter or
narrow the comparison to explicitly common components. An unresolved reference
is inconclusive, not proof against the atmosphere or production. Preserve failed
runs; do not continue to broad scoring with unqualified conventions.

Estimate: 20-40 minutes for registration and adapter setup, with WSL/tool health
and elevated MYSTIC throughput uncertain. Time a representative pilot solve and
update the overall forecast before M2. Do not promise a full scan from a
three-wavelength runtime alone.

## M2 - Compare the spectral horizon and its visible contrast

Purpose: answer the baseline question using matched rays on both sides of the
boundary, with useful visual evidence before an expensive broad scan.

- [x] At the M1 azimuth, use horizon-relative offsets
      -1, -.1, -.02, +.02, +.1 and +1 degrees as the initial six-ray set. Add local
      horizontal and high-sky controls. Expand to intermediate angles only where
      needed to resolve the transition, retaining exact angle/solid-angle meanings.
- [x] Acquire installed production N4 radiance and MYSTIC all-order radiance
      in matched spectral bands. N1-N4 decomposition is conditional on a resolved
      residual requiring order attribution; the deployed final cache stores N4 only.
      First finish one azimuth and publish its early
      comparison; conditional additional azimuths are solar-facing and 90 degrees.
      Keep direct Sun pixels separate from diffuse comparisons.
- [x] In all outcomes, capture actual app scene input/depth, finite-path T,
      L_path and final color for a few ground rays and adjacent sky controls. Compare
      optical depth with an independent direct path integral, then reproduce the
      RGB compositing arithmetic. Agreement for black-ground transport alone does
      not validate the actual green-ground fade. This small mandatory check precedes
      any conclusion that the profile explains the entire app image.
- [x] Use at least three independent seeds for pilot uncertainty, extending
      seeds/photon counts when noise prevents interpretation. Repeat key limb rays
      with refined optical layers and spectral quadrature. Report uncertainty of
      differences and contrast, not only uncertainty of each luminance separately.
      Use independent full-spectrum replicate vectors to calculate Y and C per
      replicate and empirical Student-t intervals across replicates. Preserve any
      covariance from shared samples; otherwise combine independent errors explicitly.
      Do not double-count photon and between-seed variance. Three seeds give only a
      provisional noise estimate; require stability across further batches and photon
      increases before claiming resolved agreement. State that empirical intervals
      cannot guarantee coverage of rare histories or systematic errors.
- [x] Compare controlled black ground; add matched neutral ground only after M1
      qualifies equivalent surface feedback. For actual green-ground app rendering,
      record differences in spectral surface/scene lighting rather than silently
      count them as atmospheric errors.
- [x] Publish a registered vertical horizon strip for production and libRadtran,
      with identical exposure/color transform and essential geometric mask. The image
      communicates actual color and spatial transition. Retain raw spectra and
      brightness-vs-angle curves in CSV/JSON, with plots where their shape is useful.
- [x] Compute absolute Y, band residuals and signed paired contrast
      C(delta)=(Y_above-Y_below)/(Y_above+Y_below) for delta=.02,.1,1 degrees.
      Retain numerator/denominator and mark negligible denominators unresolved.
      Estimate transition width only if a meaningful monotonic crossing exists.

Deliverable: M2 report in `results.md`, early/final strip links, spectra, contrast
metrics, error bars and convergence controls. Publish useful artifacts as they
arrive rather than waiting for every angle/azimuth to finish.

Initial interpretation thresholds, registered before scoring: target empirical
95% uncertainty in each key contrast no larger than .01, and uncertainty in Y
no larger than 2%, with layer/spectral refinement changes below 1% in Y and .01
in contrast. Treat a production-reference contrast difference greater than .03
and greater than twice its estimated uncertainty as a discrepancy worth diagnosis;
also flag Y differences above 5% when resolved. These initially flag total-method
residuals: they do not establish implementation error until N4/all-orders tail and
surface effects are bounded. Use common-order/direct N1 evidence if available;
otherwise retain truncation as an unresolved contribution. Check spectral relative errors
only above an explicit low-signal floor (initially 1% of that spectrum's peak),
retaining absolute residuals everywhere. These are diagnostic decision thresholds,
not a proof of universal accuracy or limits on making an update. Report residuals
and N4/all-orders truncation even when the threshold is not exceeded.

If low contrast is independently reproduced within resolved tolerances, retain
that evidence and advance to a bounded profile-sensitivity branch. If a resolved
mismatch exists, advance to component diagnosis. If uncertainty dominates, refine
the affected rays only; do not declare agreement from a noisy image. Freeze
thresholds with the first scoring run; any revision defines a new comparison.

Estimate: update from M1 photon/layer/band throughput. Full matched-band scans
may dominate time; do not automatically run every wavelength, azimuth and albedo
combination. Initial storage guidance 50-150 MiB; measure actual output and retain
compact spectra/provenance. No arbitrary time, disk or cache-build complexity
limit rejects an informative branch.

## M3 - Explain whichever difference the evidence identifies

Choose the smallest branch supported by M2; do not launch all branches together.

### If the reference reproduces the low-contrast horizon

- [x] Hold solver, geometry, surface and display fixed. Start with baseline,
      50% aerosol column and zero aerosols as mechanism controls. Preserve phase,
      SSA and vertical shape while changing loading; zero aerosols is diagnostic,
      not a proposed production default.
- [x] Separate molecular-only effects from aerosol sensitivity. If vertical
      placement is the remaining question, compare an explicit fixed-column
      redistribution with its extinction/SSA identities and near-ground controls.
- [x] Report changes in contrast, transmittance where independently available,
      spectral color and solar-neighborhood brightness. Distinguish a profile-induced
      difference from evidence that a particular real atmosphere is more accurate.

### If production and reference differ substantially (not triggered)

- Decompose actual app ground/depth input, finite-path T, L_path and final
  display. Compare with independent direct optical-depth integration and direct
  N1 probes where applicable, keeping those labelled independently from MYSTIC.
- Check source/phase exports, ground/sky classification, path endpoints,
  below-observer geometry and output compositing before changing cache grids.
- Test finer final-view integration, raw/full-resolution rendering and
  cache interpolation independently. Only extend order-resolved or cache-build
  diagnostics when a falsifiable prediction connects them to the measured error.
- Protect the already matched sky controls and the existing 2 km horizon.
  Isolate atmosphere from approximate scene lighting and surface feedback.

Deliverable: M3 causal report with baseline/control comparisons, supported and
rejected mechanisms, unresolved alternatives, actual timings and memory/storage.
Use real strip images for meaningful appearance changes; no text-as-image reports.

Gate: reject an individual proposed explanation when its predicted effect is
absent beyond uncertainty, or it only transfers the discrepancy to a protected
case. Preserve that result; do not reject the broader investigation. If numerical
error and physical sensitivity coexist, report both rather than force one cause.
Conditional duration is unknown until the mechanism and pilot are identified.

## M4 - Synthesize and follow earned leads

- [x] Summarize what the evidence establishes about profile, transport, surface
      lighting and display, separating observations from inference.
- [x] Extend to 2 km, another Sun time/azimuth, an independent solver or measured
      atmospheric reference only when it discriminates a live explanation. A result
      at 10 km/noon does not validate every elevation or sunset.
- [x] Before each adaptive branch, record supporting evidence, distinct mechanism,
      falsifiable prediction, cheapest next comparison, input identities, cost forecast,
      advance/reject/inconclusive criteria and cases to protect. Keep at most two
      active branches; close redundant ones. Follow productive new evidence even if
      the initially listed explanations have been exhausted.
- [x] At roughly 60 minutes and at each milestone, reassess information gained,
      precision, remaining costs and next useful result. Time is monitoring guidance;
      continue strong progress within authority. Stop blind repetition or widening
      scope without a testable prediction, not a productive investigation merely
      because a timer elapsed.
- [x] Finish with an overall `results.md` report, complete/inconclusive/rejected
      branch dispositions, limitations, reusable evidence and explicit next action.
      Promotion or closure/suspension uses its own owner-directed workflow.

## Reporting, verification and recovery

Each milestone report states completed work and evidence links, observations,
interpretation, limitations/verification, decision and next action. Maintain
`status.md` as the single current resumption point and use a separate execution
log only for chronology. Every run records commands, input/source/tool identities,
parent artifacts, operation, material settings and output hashes. Runs exceeding
one minute publish append-only progress at least every 30 seconds. Allocate
immutable run sequences from 00000; retries/refinements get new runs. Diagnose
failures, reuse authenticated completed data, and repair only the affected portion.

Prefer GPU probes/rendering where feasible; MYSTIC may use its installed CPU
solver. Report measured computation and cache-build costs rather than reject a
scientifically useful method for complexity alone. Use JS/Python helpers only.
No experimental framework tests, new dependencies or production edits are needed
for setup. Type-check authored implementation before claiming a milestone done.

## Plan critique and review scope

One read-only second-agent critique of this draft is required by create-plan.
Its scope is the plan/design and minimum baseline/tool evidence; questions are
whether the comparisons isolate the owner's appearance concern, whether surface,
geometry or spectral assumptions invalidate a claim, and whether early gates and
adaptive branches are useful. Complete by incorporating recommendations unless
they contradict the owner's goals; record the outcome in `status.md`.
No dedicated standards reviewers or independent compliance audits are enabled.
No recurring or additional review is requested. A future review need must name
its precise trigger, question, smallest affected scope and completion condition.

## Executed adaptations and conditional work

All selected milestone outcomes are complete; checked conditional items mean the
condition was assessed, not that every listed optional scan ran. The installed
cache contains cumulative N4 only. Its within-1.3% limb brightness residual and
resolved low contrast did not earn an order-resolved rebuild. Final-only GPU
readback plus Q30/Q120 and direct T checks answered the appearance question.

Neutral-ground feedback, vertical redistribution, other heights/azimuths/times,
observational datasets and production promotion were not triggered. The mandatory
actual-app component audit ran even though black-ground transport agreed.
The single plan critique was completed during setup and was not repeated.
