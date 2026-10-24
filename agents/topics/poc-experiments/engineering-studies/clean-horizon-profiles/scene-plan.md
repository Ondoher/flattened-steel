# ARM-Informed San Jose Scene Plan

State: the requested10-condition image matrix and targeted uncertainty renders are
complete under independent execution authorized on2026-10-24. S1 is complete;
S2/S3 deliver pilot evidence and a functioning illustrative adapter, with the
registered optical accuracy targets not fully met. S4 images and S5
evidence verification/report are complete. [Scene results](scene-results.md)
records the exact limitations and deferred quantitative checks. The earlier
[plan](plan.md) and [M1 results](results.md) retain their original gates/findings.

## Outcome and scope

Produce actual full-scene images of an ARM-informed low-aerosol atmosphere in
spherical/globe geometry at San Jose:

| Observer height above ground | Noon | Sunset |
| --- | --- | --- |
| 5 m | Required | Required |
| 100 m | Required | Required |
| 500 m | Required | Required |
| 2 km | Required | Required |
| 40 km | Required | Required |

These ten candidate views are the final deliverable, each with a matched current
Bruneton comparison. The gallery must show actual horizon appearance, sky color,
surface visibility and, where in frame, the Sun and its surrounding glow.
Swatches and selected-ray spectra support these scenes; they do not replace them.
There is no automatic production promotion or expectation that every horizon is clear.

This mixes exploratory physical reconstruction with contained renderer implementation.
The December 5, 2023 ARM SGP case is the starting lead. It is transplanted into
the existing San Jose source/scene geometry as an idealized atmosphere, not claimed
as measured San Jose weather. Keep the original M1 conclusion intact: no complete
measured ambient profile was established. Label the new result **ARM-informed
reconstruction**, distinguishing observations, derived optics and assumptions.

Unlike the original qualification campaign, a missing measured near-field layer
does not by itself end this image campaign. Register defensible explicit modeling
assumptions, test their effects and continue toward the ten views. Do not describe
an assumed layer or fitted proxy as directly measured. Reject invalid physical
inputs and repair incompatible transport; disappointing appearance is a result
to render and report, not a reason to omit a requested altitude or time.

Production, operational caches and all sealed earlier evidence remain read-only.
Source changes belong under `experiments/clean-horizon-profiles/`, and generated
work under its declared ignored output root. Existing [design](design.md) run,
progress and provenance rules apply. The owner subsequently authorized execution
of this sequence through independent-execution on 2026-10-24.

## Registered scene and comparison conditions

- Use the existing San Jose location, scene date and app-defined Globe noon/sunset
  presets used by the earlier horizon studies. Resolve and record exact location,
  UTC instants and source directions before rendering. Authenticate sunset against
  the retained `2024-06-21T03:26:03.503Z` case rather than assuming it is still the
  app's value. Use one common noon instant and one common ground-defined sunset
  instant at all five heights; do not move time to place the disk on each elevated limb.
- Observer heights are exactly 5, 100, 500, 2,000 and 40,000 m above the common
  modeled ground. Record the common sea-level/ground-radius convention and local
  to physical coordinates. Measured SGP site altitude is not added a second time.
- Primary camera: 1024x576, DPR 1, 50-degree vertical perspective FOV, looking in
  the Sun's azimuth with the actual geometric horizon centered vertically. Use
  the same pose for candidate/baseline at each height/time. The noon Sun can be
  above the frame; this does not justify moving the horizon out of the required view.
  Retain camera matrices, true limb depression and disk elevation relative to it.
- Keep scene objects, world transforms, green ground material, lighting policy,
  molecular/source spectra, gas/refraction choices, scattering-order truncation,
  spectral basis and rendering numerics common within every profile comparison.
  Atmospheric aerosols change; molecular pressure/temperature changes remain a
  separate factor. Scene objects may naturally become small at higher altitudes.
- Default gallery shows the current production `color-reset-altitude-half-v1`
  display policy with each atmosphere's own physical receiver illumination.
  Also provide matched fixed-exposure versions: use the Bruneton display gain
  for both profiles at each height/time. This separates radiance from adaptation;
  retain raw physical illumination and display control separately. No fitted
  white balance, sharpening, fabricated fade or per-image exposure optimization.
  Fixed exposure is fixed **within each pair**; its gain may differ between heights
  or times. Use retained linear radiance/CSV for cross-condition photometric claims.
- Record Sun-disk and scene-light presentation settings and hold them constant.
  Supplemental low-exposure Sun crops may explain clipping; do not replace the
  primary image or change atmospheric inputs to improve the screenshot.

## S1 - Complete and freeze a renderable reconstruction

Purpose: turn the acquired ARM lead into an explicit, reproducible physical model
without repeating the stalled search for a perfectly observed atmosphere.

1. Authenticate and reuse the December surface/AERONET/lidar inputs and primary
   handbooks from the completed M1 runs. Prefer the contemporaneous 19:32 UTC
   surface window, with exact cross-instrument time differences, locations and
   QC/impactor masks recorded. Use individual AERONET AOD timestamps and cloud/QC
   screening from the retained files nearest this window. The M1 daily AOD is a
   source-screening statistic, not a simultaneous column measurement. If individual
   data cannot be used, retain daily AOD as a noncontemporaneous constraint with
   temporal uncertainty. Apply the same explicit timing treatment to lidar bins;
   do not substitute another window or day silently.
   Before detailed reconstruction, perform a small shared-optics feasibility proof:
   inventory reference and renderer contract representations, then exercise one
   representative tabulated layer/phase input in both export and contained transport.
   Record supported forms, necessary conversions and the scoped fallback. This
   early implementation slice informs S1; it does not build the complete cache or
   reject the study for complexity. S3 reuses its findings rather than repeating it.
2. Separate the model into surface/overlap region, resolved lower/free troposphere,
   and remaining upper atmosphere through the existing modeled top. Do not use
   the raw 18.75 m lidar spike, a zero source flag, clipped negative extinction,
   or absent upper data as an observed clear layer. Lidar is at 355 nm; surface
   green optics are at 529 nm; AOD550 is derived from the column spectrum.
3. Choose and document one central reconstruction before any candidate images.
   Constrain it with simultaneous dry surface optics, actual temperature/pressure,
   column AOD and reliable lidar structure/uncertainties. Account explicitly for
   dry-to-ambient humidity growth using a compatible published relation or
   measured support. If a supplied relation is only a proxy, identify its source
   and applicability; do not fit its growth to the desired appearance.
4. Register at least two plausible near-field/humidity completions around that
   central case, using documented boundary-layer assumptions and observation
   uncertainty. A reconstruction may use nonnegative constrained inference, but
   must expose its smoothness/shape priors and residuals; it must not force noisy
   data or total AOD to an exact match by arbitrary normalization. Keep maximum
   systematic uncertainty separate from random standard error.
5. Complete wavelength-dependent extinction, absorption and scattering separately;
   retain a normalized angular phase representation. Use the conditional AERONET
   phase/SSA and surface backscatter/g as constraints with explicit extrapolation
   and height assumptions. A g-only analytic proxy is separately named and tested,
   not presented as uniquely determined by the measurements. Register phase and
   upper-column alternatives that probe the unresolved Sun glow and 40 km limb.
6. Prefer compatible existing published background data for every unobserved upper
   interval; account for the total column and avoid gaps between products. Report
   any tension with measured AOD. Do not append an entire preset's upper column
   without checking its loading, wavelength and phase consistency.
7. Export a versioned tabulated physical contract with complete derivation/source
   identities and an uncertainty register. Freeze candidate selection based on
   data consistency, not favorable horizon pixels.

Register concrete values/sources for this finite sensitivity matrix in the S1
contract. These are planned one-factor checks, not four open-ended adaptive searches.
Keep other factors at the central reconstruction. Test combinations only if
observed coupling warrants a separately recorded prediction.

| Factor | Registered alternatives and reason | Initial diagnostic conditions | Extra full-scene trigger |
| --- | --- | --- | --- |
| Near-field bridge | Two plausible surface-to-reliable-lidar completions; bracket overlap ambiguity | Noon 5/500 m; sunset 500 m | Contrast shift >0.02, Y shift >5%, or changed clarity interpretation: render the affected near-ground case |
| Humidity growth | Documented low/high applicable growth behavior around central relation; preserve actual RH inputs | Noon/sunset 500 m | Same contrast/Y trigger or altered solar-glow interpretation: render the affected case |
| Phase/spectral completion | Conditional measured-column phase versus one explicitly named compatible proxy/height assumption | 500 m sunset limb and 0.5/1/5-degree disk-center separations outside disk overlap | Resolved radiance/glow change >5%, clipping or changed visual interpretation: render the affected Sun view |
| Upper-column completion | Compatible published background alternatives with every gap and residual AOD reported | 40 km noon/sunset limb and source path | Contrast shift >0.02, Y shift >5%, or changed elevated-limb interpretation: render the affected 40 km case |

Triggers guide additional appearance evidence; they are not scientific acceptance
thresholds. Treat near-zero Y with the S2 absolute floor and establish that a shift
is resolved before attributing it to a factor. Five-seed confirmation remains
conditional on quantitative claims. Select the most sensitive near-ground case
and 40 km sunset for initial uncertainty images, without expanding to a full factorial grid.

Deliverable/report: central physical model, source-versus-assumption table,
completion/phase/background alternatives, integrated-column and residual checks,
and decisions linked from the existing execution log. Keep these in text/JSON/CSV;
no text-as-image artifacts.

Gate: advance a finite, nonnegative, conservative central model for **illustrative
reconstruction renders**, retaining uncertain claims. Source inconsistency rejects
that reconstruction rather than ARM as a whole. If December cannot be made
physically consistent, investigate the already acquired January case as the first
bounded alternative. Preserve all ten requested conditions. Uncertainty alone is
not a reason to stop at a report without images.

Estimate: initial 40-80 minutes to close the contract or identify the specific
missing capability; further optics work is uncertain. Reassess from actual progress,
not elapsed-time vetoes. First executable action is this reused-input audit and
central/completion registration, not another bulk download.

## S2 - Verify transport and show early appearance

Purpose: expose reconstruction effects and numerical defects before broad cache work.

1. Use fully spherical libRadtran/MYSTIC with the same physical contract. Start
   noon at 5 and 500 m, then sunset at 500 m and 40 km. Probe both sides of each
   true spherical limb and the selected Sun-facing azimuth. Reuse old anti-Sun
   controls only for claims whose geometry/physics actually match.
2. Retain spectra, direct transmission, path radiance, luminance and signed RGB.
   Compare the central model to Bruneton; add molecular-only on representative
   rays. Integrate the primary camera's finite pixel footprint before claiming
   edge sharpness. Treat black-ground transport as a mechanism check, with the
   actual green scene surface handled separately for image claims.
3. Probe the registered completion, phase and upper-background alternatives at
   the conditions most sensitive to them. Use three fixed pilot seeds to measure
   noise and work. For quantitative benefit claims, register a fixed five-seed
   confirmation batch before running it; target contrast 95% half-width <=0.02
   and Y half-width <=max(5%, 0.1 cd/m2). Keep physical-model uncertainty separate.
4. Check wavelength/layer/phase refinement, phase normalization, conservation,
   finite disk overlap and near-limb sign conventions. Complete one 40 km
   near-limb pilot early: high-altitude validation cannot be inferred from 500 m.
5. Share actual color strips and Sun swatches promptly where they explain physical
   color/glare changes. Label them sparse directional evidence. Do not wait for
   a favorable contrast score to start implementing the scene adapter.

Deliverable/report: reference ray evidence, uncertainty sensitivity and explicit
numerical versus physical-model findings. A model that remains hazy or becomes
brighter continues to scene rendering so the requested appearance can be assessed.
Repair numerical/export errors before attributing their effects to the profile.

Estimate: initial 20-40 minutes; refinement/confirmation 40-80 minutes if needed
for quantitative claims. The prior 24 native15 control cases took about two minutes,
but new phase/layer complexity and near-limb histories may change this materially.
Revise the estimate after the first representative model pilot.

## S3 - Render the first actual scene with faithful optics

Purpose: close the implementation gap that previously left alternate-profile work
at directional swatches, then establish the cost of the complete image matrix.

1. Inventory current cache construction, live view extinction/scattering, direct
   Sun transport, receiver illumination and object/ground compositing. Adapt them
   inside this experiment to the same height/spectral/phase contract. Do not change
   only the cache while live transport retains the Bruneton exponential. Reuse
   the S1 representative-layer feasibility proof and its registered conversions.
2. Build an experiment-owned scene harness using the current production renderer
   and existing scene/capture facilities as read-only inputs. Any build aliases,
   worker adapters or projected optical tables stay inside this lane. No runtime
   production dependency on experiment files and no production cache replacement.
3. Prove central-model extinction and integrated optical depth independently. Check
   layer transitions, interpolation and height-dependent scattering/absorption/phase
   in both the CPU/cache and live shader paths. Preserve production numerical choices
   where sufficient; register any refinement separately from the aerosol change.
4. Audit the complete cache coordinate domain, transport paths and interpolation
   needed for 0-40 km observations, including paths through the lower atmosphere.
   Test exact requested heights and neighboring altitude samples near 40 km.
   Extend/refine the contained cache as necessary; do not silently clamp/extrapolate.
5. Produce the first **actual 500 m noon** candidate/Bruneton pair, then a **40 km
   sunset** pilot. Verify atmosphere-off geometry at the two heights if needed
   to separate a ground/overlay edge defect from atmospheric haze. Compare selected
   rendered rays with S2 under matching surface-boundary assumptions. Differences
   from N4 versus all orders must be bounded or identified, not silently tuned away.
   Before seeing the comparison, register matching spectral, angular-footprint,
   layer, source and surface conditions. Initial transport/interpolation targets
   are direct-transmission absolute error <=0.01 and radiance/luminance error
   <=max(5%, 0.1 cd/m2), with contrast error <=0.02 on registered limb pairs.
   Isolate order truncation using a qualified matched-order reference if available,
   or a separately supported order-tail estimate; all-orders agreement alone does
   not isolate cache error. Require smaller errors for any smaller claimed aerosol
   effect. These targets support renderer-validation claims, not visual acceptance.
6. Capture cache construction time, peak/estimated host and GPU allocation with
   method labels, retained size and frame time. Reuse compatible generated profile
   content across observer heights; a height change alone should not cause a rebuild.
   Record when a different Sun state genuinely requires new content.

Deliverable/report: first two actual paired scenes, adapter proof, selected-ray
agreement and measured build/capture pilot. Publish images as soon as available.

Gate: repair a concrete optical/format/cache-support or allocation failure in the
affected path. Complexity, build time, lack of perfect observations, or an aesthetic
regression are reportable; they are not campaign vetoes. A provisional diagnostic
   preview may be shown with its unresolved defect labeled. Geometry/state/format
   defects must be repaired before final capture. An unresolved numerical optical
   approximation may still be delivered across all requested conditions, with a
   visible approximation label and reference discrepancy; do not call that adapter
   validated or attribute its error to the measured profile. If the first
   implementation approach fails, retain the physical contract
and adapt a compatible contained rendering path rather than substituting swatches.

Estimate: adapter and first cache are **unknown** until the contract and this pilot
identify the representation changes. Report a revised estimate before broad builds.
Cache-building complexity is not a limiting criterion in this experiment.

## S4 - Complete noon, then sunset, at every requested height

Purpose: deliver the owner's complete, directly comparable image set.

1. Finish and publish the five noon pairs first, in ascending height order. Include
   the S3 preview only if it passes the same final capture checks; otherwise repair
   that case into a new run. Then finish the five sunset pairs in the same order.
   The early 40 km sunset feasibility preview does not replace this final set.
2. For every case capture the ARM-informed central reconstruction and matched
   Bruneton scene using the registered camera, source, surface and display policy.
   Retain linear pre-display output and physical metadata so fixed-exposure
   diagnostics can be derived and independently replayed without rebuilding physics.
3. Verify actual published UTC, observer height, source direction, geometric limb,
   active medium/cache/phase identities, precision, complete state and zero
   page/WebGL errors. Distinguish a stale displayed frame from the requested state.
   Check one 5 m -> 40 km -> 5 m transition and a noon -> sunset -> noon transition
   against fresh-state captures. Visually inspect **every** final candidate/baseline
   pair at native resolution and record geometric-limb placement, ground/objects,
   Sun disk/glow, clipping, seams/black strips and missing/stale content. Valid
   metadata and zero WebGL errors alone do not establish a correct displayed image.
4. Provide native-display images and a paired fixed-exposure toggle for all ten
   conditions. Demonstrate CPU re-encoding agrees with the GPU output before
   using derived display variants. Add a common lower-exposure diagnostic if clipping
   hides the sunset differences; preserve primary frames unchanged.
5. Render uncertainty variants at the most sensitive near-ground case and the
   40 km sunset case. If the registered alternatives produce a visibly different
   conclusion at another altitude/time, add that affected case's variant images;
   do not force all uncertainty into a favorable central screenshot.
6. Assemble one local HTML gallery: noon and sunset sections, five height rows,
   candidate/Bruneton comparisons, fixed/native exposure controls, downloadable PNGs
   and selectable metadata. Essential image content is actual appearance; all
   status, source descriptions and measurements remain text/tables. Publish noon,
   sunset and final gallery updates in fresh immutable runs; reference accepted
   captures with their parents rather than overwriting any sealed page or image.

Deliverable/report: complete noon gallery update, then complete sunset update,
with 10 central reconstruction images and their 10 matched baseline images at
minimum. Fixed-exposure versions and targeted uncertainty views are additional
image variants, not extra requested scene conditions.

Gate: completeness and reproducibility, not a required amount of visual improvement.
Missing or invalid images leave that condition open; recover only the affected
capture/cache. Report if an effect is physical, display-related, numerical or
unresolved rather than smoothing it out. A cache/adapter failure is not scientific
evidence that the ARM profile has a fuzzy horizon.

Estimate: **unknown until S3**. Scale measured cache and capture work to the remaining
conditions, including whether noon/sunset share content. Update before this stage.
Existing 0-40 km production assets and older captures are reusable only when their
complete physical, source, view and display identities match.

## S5 - Verify, report and preserve the result

1. Check the complete 5x2 scene matrix, links/images/metadata and rendered physical
   contract. Rehash artifacts and derivation chains, run the local source type check,
   and close all owned browser/server resources before sealing runs.
2. Report clarity and Sun-glow tradeoffs by height/time, comparison with Bruneton
   and selected libRadtran rays, and how robust the images are to reconstruction
   assumptions. Keep measured-source confidence separate from renderer correctness.
3. Include actual build/capture times, memory/allocation evidence, retained size,
   frame cost, any sampling changes and unresolved limitations. Distinguish measured
   stage time from total elapsed time and planning estimates.
4. Link the complete gallery from an overall scene-results report and update current
   status. Preserve earlier M1 results under their original claims. Request checkpoint
   advice at coherent execution milestones under the existing lifecycle; no push
   or automatic experiment closure/promotion.

Completion: the ten requested rendered conditions with baseline comparisons and
an honest reconstruction/uncertainty report. Missing precision can limit quantitative
claims; it does not silently turn an incomplete image matrix into success.
Estimate: 20-40 minutes after captures, revised if artifact verification finds defects.

## Adaptation, progress and authority

Follow supported leads within the reconstruction and renderer objective. Keep at
most two adaptive alternatives active. Before each new branch record evidence,
mechanism, prediction, bounded next proof, cost and protected cases. Examples are
an improved published humidity law, another already acquired ARM interval, a more
faithful phase representation or a cache-domain refinement. Do not reopen a broad
source search or change exposure to conceal an aerosol-model defect.

Log download failures and move to the next compatible source or explicit modeling
assumption. No blind retries, repeated control campaigns or modifications of sealed
runs. Retain useful payloads, repair into fresh runs and update estimates from pilots.
Administrative readiness, historical profile identities and fixed time/disk guidance
are not update vetoes; actual device/format/physical-input failures are addressed
specifically. Broad data uncertainty is reported, with each affected claim bounded.

Use the existing execution log for resumption: completed steps, decisions, evidence,
next action and open dependencies. Every milestone ends with a concise report
containing deliverables, observations versus interpretation, checks/cost/limitations,
and advance/refine/reject-branch disposition. Share useful visual evidence immediately.
Long operations retain the existing 30-second flushed progress contract.

The owner authorized independent execution of this sequence on 2026-10-24.
No new owner decision is needed inside an authorized execution merely because a
documented modeling or implementation choice must be made.

## Bounded plan critique

One separate read-only create-plan critique is requested before handoff. Its scope
is this scene plan's fidelity to the 10 requested conditions, handling of incomplete
ARM data, altitude/time/camera/display controls, renderer feasibility, early evidence,
recovery and completion gates. Supply only this draft and the M1 result/design
sections needed to judge those questions. Completion is one actionable critique
and incorporation record. It is a plan critique, not an implementation or standards
review, and does not gate execution on a new owner approval.

No additional discretionary reviews are requested. Any later review need must name
its trigger, precise question, smallest affected scope, completion condition and
whether it gates further work. Contained standards reviewers/audits remain disabled.

Critique record: one independent read-only pass completed. All six recommendations
incorporated: early shared-optics feasibility proof; contemporaneous versus daily
AOD/timing distinction; registered numerical agreement and order-tail limits;
finite one-factor sensitivity matrix; native-resolution visual inspection plus
time-transition proof; pair-fixed exposure interpretation and immutable gallery
updates. No recommendations rejected. No additional review or approval gate added.
