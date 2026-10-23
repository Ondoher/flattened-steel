# Twilight Exposure Experiment Plan

State: M1–M4 complete; see [results](results.md). This is an exploratory display-response
study. The owner invoked independent-execution on2026-10-23 and authorized this
campaign. Production promotion remains a separate owner-selected task.

## Outcome

Find a supported display response that reduces the expanding bright twilight band
without merely blackening the scene or moving the failure to lower elevations,
daylight, alternate viewing directions or stars. A useful negative result that
shows curve-only correction is insufficient is an acceptable experiment outcome.
The [design](design.md) owns controls, registered criteria and run boundaries.

## M1 - Trustworthy baseline and first visual evidence (complete)

Purpose: establish reusable display inputs and confirm the known failure before
candidate work. First executable step is an immutable `00000-baseline` run.

1. Pin current dirty source/build identities, production p2 parameters, atmosphere,
   cache package, display transfer, stellar configuration, GPU/runtime and camera.
2. Authenticate and copy existing +30/+40/+50 native/locked-exposure evidence into
   the new run with its parent lineage. Reuse successful scientific cache evidence.
3. Pin representative daytime and genuine-night controls, including actual UTC
   instants, camera and stellar configuration, before any candidate is scored.
   Capture lossless pre-gain/pre-tone linear data from the isolated production-
   derived scene; qualify re-encoding against the actual GPU. Keep source layers
   where needed to measure the Sun/atmosphere/stars independently.
4. Recompute native/frozen baseline metrics under the new band mask; historical
   whole-image white fractions are a different quantity. Define and seal atmospheric-band/disc masks, midtone and night-star controls,
   exact guard thresholds and measurement precision before candidate scoring.
5. Publish matched baseline/frozen-exposure images as soon as available, with
   selectable gain/brightness tables and a short milestone report in status.

Gate: evidence parity and provenance pass. A broken HDR reuse route advances via
corrected capture or direct GPU candidates, never PNG inversion. Diagnose the
cause before expanding. Initial estimate20-40 minutes, dominated by capture
qualification; measure this pilot and update remaining estimates.

## M2 - Small curve screen, then isolated alternatives (complete)

Purpose: test the simplest adequate correction and identify the mechanism.

1. Keep the meter and encoder fixed. Compare a small explicitly registered family
   that weakens/softens the steep twilight gain while maintaining daytime and
   genuine-night anchors. Use no more than three mechanisms at once; parameter
   values must come from the observed gain range and recorded control behavior.
2. Replay only the primary40 km +30/+40/+50 data first, together with daytime and
   night controls. Plotting the response curve is useful only if it reveals the
   gain relationship; gains/thresholds remain in JSON/CSV/native tables.
3. Evaluate gain densely around transitions/splices/floors and throughout the
   observed illumination range, including response continuity and illuminance-
   times-gain behavior. Reject nonfinite/negative/unstable mappings immediately. Reject a candidate
   whose improvement is solely scene blackening, lost useful stars, transferred
   hue/clipping defects or a collapsed horizon. If curve-only inputs are
   indistinguishable but desired outputs conflict, reject that curve family and
   record the evidence rather than endlessly tuning parameters.
4. If earned by those results, test camera-visible luminance metering with the
   curve/encoder fixed. Separately test a highlight shoulder at fixed meter/gain.
   Retain native and frozen-exposure controls. GPU rerender view/source-dependent
   candidates when saved linear data cannot represent the changed pipeline.
5. Compare supported combinations only after the isolated effect is understood.
   Publish a compact visual shortlist promptly and report every rejected branch.

Gate: clear broad-band clipping reduction with preserved color/structure and
protected controls. Inconclusive cases name the missing measurement and a bounded
resolution step. Failure rejects the candidate, not unrelated mechanisms.
Estimate20-40 minutes for cheap replay; GPU/meter implementation cost is conditional
and must be estimated from M1 and the first small implementation before expansion.

## M3 - Elevation, time and view regressions (complete)

Purpose: prove the correction is not a40 km/+50-minute fit.

1. Advance at most two candidates to the design's Globe time/elevation sweep:
   5 m,2 km,10 km,40 km; sunset through+60 at10-minute steps, plus daytime/night.
2. Freeze the design's held-out table and exact UTC instants before candidate
   scoring; if tuning uses a held-out failure, label it refinement and retain a
   fresh independent check. Screen away-from-Sun, zenith and5-degree close-up views at representative
   failing/control times. Metering branches also check small turns/FOV changes
   for exposure jumps; freeze gain in comparison controls to identify the cause.
   Run a short repeatable camera/FOV sequence and compare settled response; if
   temporal state is added, measure overshoot, oscillation and settled brightness.
3. Check Union Glacier and Flat/local at the design's initial held-out endpoints.
   Expand a failure or promising discrepancy only with a recorded prediction.
4. Measure added metering/encoding cost and retained resources using matched
   resolution and interval settings. Report GPU warm-up/disjoint uncertainty;
   do not confuse cache load time with interactive frame cost.
5. Publish comparable scene images and per-case tables, including regressions;
   report the disposition and specific unresolved tradeoffs.

Gate: retain a candidate only with supported behavior across the protected cases.
Reject or refine a failed mechanism locally; do not silently drop failing heights
or accept a favorable average. Estimated40-80 minutes if a reusable HDR route works;
otherwise estimate from measured GPU batches before running this expanded matrix.

## M4 - Reproducible conclusion and handoff (complete)

1. Verify source/parent/artifact hashes, run containment, optical/cache identity,
   parameter records, closed resources and explicit terminal states. Re-run only
   missing or invalidated checks. Type-check authored JavaScript after edits.
2. Write a final report against the original goal: winner/negative conclusion,
   mechanism evidence, images where appearance matters, per-case limitations,
   measured cost and any conditional work not triggered.
3. Preserve all earlier results and a precise resumption point. A retained
   candidate gets a production handoff description, not automatic integration.

Gate: the evidence supports the report and every started branch has a disposition.
Estimate20 minutes for verification/reporting, revised using actual evidence size.

## Adaptive scope and early exits

When evidence opens a distinct promising lead, record its observation, mechanism,
falsifiable prediction, smallest next comparison, cost estimate and protected
cases before execution. Allowed leads concern exposure response, visible-field
metering, highlight rolloff and narrowly justified independent star presentation.
Do not expand to atmospheric optics, scattering corrections or new cache builds.
An unsupported optical/geometry change is a separate follow-on, not a quiet detour.

Stop a candidate early for bad evidence, no material improvement or transferred
failure; repair an invalid measurement before calling the hypothesis false.
After repeated candidates fail for the same mechanism, stop that parameter search
and use its result to decide a distinct branch. If no supported lead remains,
finish with the negative conclusion. Time/resource estimates are progress review
points, not arbitrary restrictions on authorized productive work.

## Reporting, review and continuation

Every milestone ends with a concise report in status: completed work/artifacts,
observations versus interpretation, verification/limitations and next disposition.
Link useful images immediately when available, rather than waiting for the whole
campaign. Chronology and branch decisions belong in an execution log created when
execution begins; current state stays in status. Long operations emit append-only
progress every30 seconds and at phase transitions in their immutable run.

One read-only plan critique is required by create-plan before final handoff. Its
scope is this plan/design against the owner goal and the existing exposure evidence;
completion is incorporation or a specific goal-based reason to decline a suggestion.
No standards reviewers or independent audits run. No recurring milestone reviews
are requested. A new discretionary review would first need a stated trigger,
precise question, smallest scope and completion condition. Keep checkpoint adviser
monitoring separate from scientific acceptance.

## Plan critique

One read-only create-plan critique completed by a separate agent on2026-10-23.
All recommendations were incorporated: explicit owning-topic write authority;
daytime/night HDR anchors before candidate scoring; a concrete held-out table and
fresh checks after tuning; dense curve-continuity and short camera/FOV sequence
checks; diagnostic versus production metering-cost separation; and explicit
whole-image versus atmospheric-band metric distinction. Frozen exposure remains
a causal control, not appearance ground truth. No suggestions were rejected.
No additional review gate or broader physical-validation campaign was added.
No candidate execution had started at the time of plan critique.
