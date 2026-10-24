# Twilight exposure production promotion

State: P1-P3 complete on 2026-10-23. Implementation task,
not another exposure experiment. Outcome: make the accepted altitude-half response
the app default, preserve ordinary/Flat behavior and physical measurements, and
close the experiment without changing any sealed evidence or optical cache.

## Baseline and scope

HEAD d40a4e4a; `.codex-tmp/twilight-exposure-promotion/baseline.json` records the
four pre-existing selected-gallery source/document changes. Preserve them.
Accepted parent: experiment00011-regressions/70 cases and00013-verify, plus
00014-selected-images. Findings and limitations remain in the experiment results.
The owner accepted promotion after seeing5 m sunset and the recommendation page.
Twilight stars remain dimmer and a narrow late bright limb remains; no retuning.

Destination: existing Color implementation and Flat32 model selection/runtime
bindings, focused tests and current product documents. No experimental runtime
imports, new GPU pass, cache construction, atlas change or physical meter override.
Generated production proof stays in ignored `.codex-tmp/twilight-exposure-promotion/`.

## P1 Close and establish production ownership

1. Inventory manifests/resources; end the experiment with its accepted finding,
   preserve all failed/accepted evidence and record the separately authorized promotion.
2. Resolve permanent folder standards and temporary overlays; none are recorded
   for this experiment. Validate mappings and refresh the generated guide.
3. Route active-topic to Product Behavior/twilight exposure and run production
   reviewer topic refresh. Calibration currently reports stale; no standards
   reviewer may start. Record blocked review honestly and continue under the root
   owner-directed operational-restrictions policy. Self-review remains required.
4. Record this baseline and one independent bounded plan critique before coding.

Deliverable: closed experiment, production route and reviewable promotion plan.
Completion: evidence intact, resources closed, standards state and review limit
explicit. Estimate about20 minutes including context and design checks.

## P2 Install the versioned display response

1. Add `color-reset-altitude-half-v1` beside existing Color models; retain p2/p9
   as explicit controls. Adapt the exact selected constants and smooth height/
   illumination response into production-owned typed/documented code.
2. Keep CPU conversion used for physical scene-light presentation on the existing
   p2 behavior. Provide an explicit unit-bearing display-adaptation operation for
   frame exposure, separate from the facade's physical receiver illuminance.
3. Add a small overridable uniform-name hook to the existing p9 encode generator,
   preserving p9/p2 shader output. The successor uses its own display-only lux
   uniform and still retains the physical receiver binding for observation.
4. In the existing runtime presentation-binding update, compute the display value
   from the raw facade getter multiplied by the illustrative presentation scale
   exactly once, then use current spherical geometry height. The existing physical
   runtime binding is already presentation-scaled; do not multiply that again.
   Flat supplies zero height weight. Bind the adjusted display value on
   every complete frame so time/elevation/mode publications cannot leave stale gain.
   Compact staging receives its own facade, so derive context from that facade's
   geometry rather than a previously displayed mode.
5. Select the successor by default, retain float32 scene precision and existing
   explicit controls, selectors/types/labels. Do not change the No-atmosphere Sun
   illumination semantics or scale physical light twice.

Deliverable: app/worker build and focused CPU/selection tests. Verify all70 parent
gain cases from retained immutable data, below10 km/Flat identity, day/zero-light
anchors, and live-height transition values. A failed comparison repairs the port;
it does not permit changing the approved formula. Estimate20-40 minutes.

## P3 Verify actual served behavior and hand off

1. Type-check engine/app, run focused existing and new production tests, build the
   app and shared worker. Use production fixture/output rules, not experiment runners.
2. Capture the actual default app in an owned browser at matched1024x576 pose/FOV:
   San Jose Globe40 km +30/+40/+50/+60/+100/night;5 m sunset and+80; Flat Union
   Glacier180; and one diagnostic25 km/+50 interior point. Reuse old image inputs
   without changing them. Confirm selected
   model, raw physical meter, separate display value, no page/WebGL errors and
   matching UTC, camera quaternion/FOV,1024x576 resolution and float32 precision.
   Require at most one byte difference in99.9% of RGB channels against the accepted
   prototype/native controls; diagnose failures rather than loosening that bound.
3. Exercise40 km→5 m→40 km, Globe→compact Flat→Globe, time and full/no-atmosphere
   switches with non-unit and zero illustrative scales. Verify display value
   refresh, unchanged cache identity and no elevation-triggered cache construction.
   Preserve actual images because appearance is essential; keep metrics as JSON/text.
4. Update the current production owner document with default, evidence and known
   limits. Retain experiment conclusions as historical findings with closure status.
   Report CPU binding cost/no new pass and any precision/review limitations honestly.

Completion: production default uses the accepted response, scoped tests/build and
served comparisons pass, physical assets unchanged, evidence and outcome linked.
Estimate20-40 minutes; cache/server/browser warm-up is the main uncertainty.
No deployment/push is authorized. No new experimental branches are opened.

## Review and execution record

One read-only create-plan critique is scoped to this plan's formula port, binding
ownership/stale-state risks and verification sufficiency against the selected
experiment. Incorporate recommendations unless opposed to the stated goal.
It is not a standards audit and introduces no owner approval pause. No additional
discretionary review is requested. Dedicated production reviews remain unavailable
while calibration is stale; do not represent self-review as standards sign-off.

Milestone reports and decisions will be recorded here; the existing production
twilight-exposure document owns final current behavior. First step: closure and
topic refresh, then implement the saved formula with separate display binding.

## Plan critique and P1 report

One independent read-only critique completed. All six recommendations incorporated:
raw/scaled lux distinction; explicit base CPU versus altitude-aware frame semantics;
default/explicit float32 selection tests; exact transition and illustrative-scale
coverage; a served25 km interior comparison; and the predeclared pixel bounds above.
No suggestions rejected and no extra review/approval gate introduced.

P1 complete: experiment ended,15 terminal runs and released browser profiles
confirmed, permanent mappings intact, no temporary entries to restore, standards
guide refreshed, production topic selected. Reviewer calibration is stale, so no
production reviewer/audit started and no compliance result is claimed. Baseline
and pre-existing page edits are recorded under the plan-owned output root.

## P2 report

Implemented the accepted versioned Color successor, separate display-control
binding, staged/ordinary frame refresh and default/explicit selection. Raw receiver
measurements, p2 CPU scene-light conversion and existing physical cache stay intact.
Engine/app type checks pass. All 70 retained gain cases match; 11 focused engine
Color specs and 72 applicable basic browser specs pass (one existing full-cache
spec is excluded by that lane). App, worker and browser-test builds pass.

The initial browser filter selected zero tests; the corrected literal filter and
complete basic suite passed. Diagnostic browser attachment changed the capture
viewport in the first two proof attempts. A third attempt exceeded the helper's
default navigation timeout; the established larger startup allowance resolves it.
These failures are preserved and are not production test successes.

## P3 report and handoff

Complete. Ten actual default-app renders match the accepted prototype with a
maximum of one byte in every RGB channel, stronger than the predeclared 99.9%
bound. Matching includes UTC, pose/FOV, 1024x576 canvas and float32 scene color.
Eight spherical cases are retained in `gpu-04`. Its Flat image also matches, but
the helper incorrectly read the initial mode facade rather than the active
compact frame's receiver measurement. The corrected Flat measurement and the
25 km interior case pass in `gpu-05`. No production-source repair was needed.

All 25 live Full/No-atmosphere checks pass through 40 km, 5 m, Flat, and return
to Globe, with unit, 25%, zero and 65% illustrative scales. Raw receiver light
is invariant; physical presentation and separate display controls refresh
correctly without double scaling. A same-time 40 km -> 5 m -> 40 km check retains
the scene, runtime, cache backend, shader and composer. No page/WebGL errors.
Production input and cache descriptor hashes remain unchanged throughout proof.

[Comparison images](../../../../.codex-tmp/twilight-exposure-promotion/index.html),
[qualification report](../../../../.codex-tmp/twilight-exposure-promotion/report.json)
and the sealed manifest preserve parents, derivation, failed helpers and final
evidence. Scope format/type checks, 11 engine Color specs, 72 basic browser specs,
70 accepted gain cases and app/worker/browser builds pass. CPU binding-update cost
was not separately benchmarked; the shader gains no new pass, ray samples or atlas.
The experiment remains ended, and production now owns the selected default.
Reviewer calibration remains stale: no dedicated standards review or sign-off
is claimed. Checkpoint advice identified one coherent promotion unit; no commit,
push or deployment is part of this handoff.
