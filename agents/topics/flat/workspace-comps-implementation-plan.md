# Flat Workspace Comps Implementation Plan

Status: executing under the owner's independent-execution invocation on2026-11-05.
The [execution record](workspace-comps-execution.md) owns progress and decisions.
M1 is complete; M2/M3 have a working desktop slice; M4 remains pending.

## Outcome And Scope

Implement the [current four slider comps](configuration-toolbar-comps.md#shared-time-slider-update)
as working React presentation in Flat, using the existing ReMVC features and
registered services. The static HTML is a visual reference, not application
source to transplant. The implementation includes the supporting summary-led
frame and configuration navigation from the earlier page-settings family;
the inline-editing alternative is outside this plan.

Completion means:

- Shared accepted location and device-local date/time summaries remain visible
  and open their ordinary editors. Preserve city search, manual coordinates,
  local entry formats and their existing acceptance/error behavior.
- Each Flat Earth view retains page selection, Page settings, independent
  elevation/FOV, Center on Sun, pointer look and optional second-view close.
- Each Flat Earth toolbar shows the Shared time slider, angle, closest marker,
  before/after meaning and Time settings entry. Both toolbars and the dedicated
  configuration slider/numeric field edit one shared timestamp.
- Configuration distinguishes Shared settings from each populated view target;
  shared sections expose Location and time / Flat Earth time. Page settings
  opens that view's Camera section. Time settings opens the shared Flat Earth
  time section and highlights consistently in both toolbars.
- The live application follows T1 at 1440×900, T2 at 1440×900 with two views and
  a 360px right panel, T3 at 1100×800 with a 300px bottom panel, and T4 at
  600×900 with a 370px bottom panel. Preserve the specified grouping, palette,
  typography and control sizes; use responsive Grid rather than absolute
  positions copied from the prototype. Controls remain reachable between these
  sizes and below 600px without horizontal document overflow.
- The scene remains real, resizes to its actual container, retains independent
  cameras, and receives shared time/location changes without stale publication
  or new clocks. Requested and rendered values are distinguishable while a
  frame is preparing or has failed.

No MUI, new database/server routes, socket transport, time-zone lookup/picker,
animation buttons, fuzzy-search expansion, camera linking, persistence, globe
page, experiment work or deployment is included. The later execution invocation
authorizes local checkpoints with adviser-suggested messages. Device time remains
the current entry/display basis. Preserve existing keyboard/focus behavior;
this does not add a separate accessibility or localization expansion project.
New user-facing strings still use the existing localization capability.

## Starting Point And Reuse

The [Flat entry](README.md) owns current implementation and verification.
Workspace, global configuration, native app-wide date/time fields, the shared
animation-loop clock, and Flat Earth's real scene/camera tools already work.
Models are registered Polylith services. No replacement app scaffold is needed.

The existing contribution catalog has configuration scope but no selectable
section metadata. WorkspaceModel stores configuration open/target, not section.
ConfigurationPanel currently mounts every configuration contribution for its
target. The global feature currently supplies the full editor without toolbar
summaries; Flat Earth supplies camera tools without Camera/Time configuration
providers. These are the implementation gaps, not completed capabilities.

Reuse these visual and behavioral sources:

- [Slider specification](design-comps/2026-11-05/shared-time/slider-spec.md) and
  [four-image author inspection](design-comps/2026-11-05/shared-time/inspection.md).
- [Earlier page-settings specification](design-comps/2026-11-05/page-settings/revision-spec.md)
  for Camera access and [original visual specification](design-comps/2026-11-05/visual-spec.md)
  for ordinary location/date-time forms.
- [Feature/service ownership](component-service-proposal.md) and
  [alternate time-input note](flat-earth-time-input.md).
- Existing production `FlatEarthGeometry.resolveObservationInstant` for
  closest-angle conversion. Its synchronizer normalizes an orbit modulo 24 hours;
  it does not by itself define the signed editor's day/wrap policy. The clock's
  startup-relative phase is not closest angle.

The latest comp integrity record is
`.codex-tmp/flat-ui-comps/2026-11-05/shared-time/verification.json`.
It records four inspected images and unchanged hashes for 50 existing app files.
The preceding model-service unit passed client types, builds and 109 browser
tests. Those results explain the baseline; changed source/contracts invalidate
their use as verification of this implementation. Preserve previous evidence
and the current dirty working tree; capture a new baseline rather than reverting
or committing unrelated work.

## Ownership And Likely Files

Names for new files are proposed; preserve these responsibilities if naming changes.

| Owner / files                                                                                                                                                           | Responsibility                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/workspace/models/WorkspaceModel.js` and declarations                                                                                                          | Configuration target/selected-section state, open views and safe fallback when a contribution or view disappears. No city/time/astronomy state.                                                                           |
| `features/workspace/services/ui-contributions.js`, `types.d.ts`, controller/view declarations                                                                           | Localized section metadata, generic section selection/open-settings capability, and exact registration/mount/release lifetime. Keep old contribution consumers compatible or migrate them together.                       |
| `features/workspace/controller.js`, `views/workspace.js`                                                                                                                | Resolve registered providers, mount only selected settings content, expose populated targets/sections and selected-state facts through the public capability. No branches on feature names.                               |
| `features/workspace/components/{WorkspaceShell,WorkspaceToolbar,Workspace,ViewportFrame,ConfigurationPanel}.jsx` and `styles/workspace.css`                             | Frame layout, summaries host, generic page-settings action, selectors/sections, responsive docking and focus return.                                                                                                      |
| `features/global-configuration/controller.js`, `views/global-configuration.js`, proposed `components/GlobalConfigurationSummary.jsx`, existing editor components/styles | Contribute Location/time summaries and the Location and time section; route summary edits through generic settings navigation. Retain existing catalog, coordinate/date-time models and acceptance operations.            |
| `features/flat-earth/controller.js`, `views/flat-earth.js`, entry/build/declarations                                                                                    | Register shared Flat Earth time and per-view Camera providers, toolbar presentation and navigation. Coordinate shared time edits and independent sessions through public services.                                        |
| Proposed `features/flat-earth/models/FlatEarthTimeModel.js` and `.d.ts`                                                                                                 | Registered model-service for alternate-editor drafts, conversion/readback rules and derived reference facts. Accepted timestamp stays in the existing clock. A shared editor model is independent of any canvas lifetime. |
| Proposed `features/flat-earth/components/{FlatEarthTimeControls,FlatEarthTimePanel,FlatEarthCameraPanel}.jsx`, existing `FlatEarthViewTools.jsx`, feature CSS/types     | Present native range/numeric input, closest reference/resolved time, and Camera controls. Reuse feature-local controls where useful; no private imports across features.                                                  |
| `src/flat/styles/app.css`; `phrases/en-US.json`                                                                                                                         | Reuse/extend existing shared CSS tokens and localized labels. Keep feature-specific rules with their owner and linked through feature build assets.                                                                       |
| `src/algorithm32/implementation/flat-earth` public geometry contract, only if M1 proves necessary                                                                       | Small additive geometry-owned readback/reference API with focused engine tests; avoid private synchronizer imports or duplicate astronomy in the app. No scientific/cache redesign.                                       |

All React components remain class presentation components talking to their
owning view; views project/relay, controllers orchestrate, model-services own
rules and drafts. Resolve dependencies in `ready()` and release exact tokens.
Apply [React](/C:/Users/gande/.codex/documentation/standards/react.md),
[ReMVC](/C:/Users/gande/.codex/documentation/standards/remvc.md) and the
[local authoring rules](../standards/overlay.md): prepared JSX values/lists,
helper-owned region wrappers, ambient declaration imports, next-line JSDoc,
method/type spacing and control-flow braces. Do not add runtime checks that
revalidate trusted internal types; validate actual numeric/user input and
ownership invariants.

## Milestones

### M1 — Establish Time Semantics And Contribution Contracts

Purpose: settle the small but consequential conversion and navigation gaps
before coupling them to expensive rendered scenes.

1. Capture the whole working-tree baseline plus hashes of the intended source,
   current public contracts and reference comp images. Identify a new ignored
   execution evidence directory, for example
   `.codex-tmp/flat-workspace-comps/<execution-date>/<unit>/`; never overwrite
   the comp or prior test roots.
2. Define the smallest generic settings request: target plus registered section,
   with an optional provider-owned editor focus intent for Location versus
   date/time. Add label/order metadata, selected-state projection and fallback
   rules. Distinguish section selection from mount token identity. Keep unknown
   or removed targets safe and avoid enabled empty Page settings destinations.
3. Exercise production forward conversion and available inverse/reference
   support with a small JS proof. Use 0, ±45, ±180 degrees; device-midnight/UTC
   date boundaries; longitudes near ±180; a seasonal date boundary; and no
   location. Establish what date basis means in device display versus geometry.
   Reuse the +45 sample below as one reference, not the only correctness case.
   Round trips alone are insufficient: retain fixed closest-instant fixtures
   from existing production evidence, and independently calculated signed time
   offsets/expected occurrence dates for negative angles, midnight and both
   endpoints. Do not obtain both expected and actual answers from the new
   forward/inverse operations.
4. Record a concrete round-trip truth table and editor policy in the owning
   time-input note before enabling time writes. Recommended starting behavior:
   an alternate representation, no retained angle mode; location changes preserve
   the timestamp; bounded signed slider at 0.1° resolution; freeze the selected
   closest-approach occurrence for a single drag/edit so crossing midnight cannot
   move the reference during the gesture. Define the occurrence, the two ±180
   endpoints, subsequent readback and date rollovers explicitly. Resolve the
   interruption recommendations below in the same policy record. These are
   implementation recommendations to validate, not already accepted domain rules.
5. Prefer existing public geometry. If readback cannot be expressed correctly
   through it, add a narrow public geometry-owned operation and tests. Never
   use a guessed local noon or the animation service's startup-relative phase.
   If a remaining product choice changes the visible meaning materially, record
   the exact alternatives and obtain that decision before those time writes;
   independent frame/navigation work can continue.

Deliverables: contract/data-flow notes, conversion examples with exact instants,
proposed policy disposition and any small public-API change/tests. Advance time
implementation when round trips and date choices are coherent within declared
integer-millisecond/display tolerances. A failed assumption triggers a corrected
conversion policy, not a second clock or silent date adjustment.

Estimate: 1–3 hours; inverse/date-boundary support is the main uncertainty. Update
the remaining estimate from this pilot. Pure proof/tests need Node, not WebGL.

Recommended interruption policy to finalize in M1 and test in M3:

| Event                                       | Slider gesture                                                                                                                               | Unfinished numeric draft                                                                                                                              |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Location changes                            | End the old-reference gesture; ignore its late events. Preserve timestamp and derive the new reference before another gesture.               | Retain text, mark the reference changed, and require a fresh acceptance resolved against the current location/reference.                              |
| Ordinary time edit or external clock tick   | Supersede the old gesture and refresh accepted readback. Distinguish own seek notifications so they do not cancel their originating gesture. | Refresh accepted readouts, retain draft, and resolve a later explicit acceptance against the current reference rather than a stale captured snapshot. |
| Slider used while numeric text is dirty     | The new slider gesture supersedes the draft and uses a coherent current reference.                                                           | Replace the draft with the resulting accepted angle; never keep two competing requested values.                                                       |
| Toolbar's view closes or a section unmounts | End only the unmounted control's gesture; ignore late events. Surviving controls remain usable.                                              | Retain model-owned text across ordinary panel/section remounts. Feature stop clears editor lifetime; accepted time survives.                          |

The frozen reference applies only while its gesture is current. Endpoints do not
auto-wrap on continued dragging. This table is the proposed conflict policy,
not a claim that static comps already demonstrate it; record any M1 revision
with the numerical/interaction reason before implementing writes.

### M2 — Deliver The Working Frame And Settings Navigation

Purpose: produce an early usable visual slice with existing data/editor behavior.
Depends on M1's generic contracts; time conversion need not delay this slice.

1. Implement selected sections and public open-settings requests in the
   workspace model/controller/view. Populate Shared settings and exact open-view
   targets from registered providers. Select only one section's content at a
   time, release previous mounts exactly, and retain model-owned editor drafts
   on section switches. Keep shared Time availability independent of a single
   view; the Flat Earth feature can register it for its activated app lifetime.
2. Add global summary presentation using accepted configuration/current time.
   Each Edit opens Location and time at the intended editor. Opening a summary
   must not accept unfinished text or alter the timestamp.
3. Register a real Camera section for each mounted Flat Earth view and a generic
   Page settings shortcut beside its page selector. It reuses the same camera
   model values/actions as toolbar controls; no extra Apply or mirrored state.
4. Implement the summary-led shell, explicit Settings for selector and shared
   section navigation. Retain normal location/date/time entry and disclosure
   behavior. Generic workspace CSS owns frame dimensions; provider CSS owns
   controls/content. Apply the selected palette and compact button treatment.
5. Preserve Escape, focus and draft semantics: initial opening focuses the
   requested editor or panel; section changes do not steal focus repeatedly;
   closing returns to the actual opener. If that opener/view vanished, use a
   stable workspace fallback. Ordinary field/dialog Escape handling retains
   precedence over the panel's close action.

Deliverables: a live desktop single/comparison frame with working summaries,
scope/section selection and per-view Camera configuration. Capture one actual
desktop screenshot once the slice is usable to show geometry, hierarchy and
color, rather than waiting for the entire plan. Focused tests demonstrate
registration fallback, selected-content mounting, draft retention, summary
navigation, independent Camera changes and exact lifecycle cleanup.

Advance when the first slice works without feature imports in the workspace,
remounting canvases on panel changes, duplicate registrations or lost drafts.
Estimate: 3–5 hours; mount/focus compatibility is the main uncertainty.

### M3 — Connect The Shared Time Panel And Toolbar Sliders

Purpose: turn matching static values into one real shared-time workflow.
Depends on M1's resolved conversion policy and M2's contribution/navigation seam.

1. Register the feature-local alternate-time model-service; derive accepted
   angle/reference/readouts from the shared timestamp and location. Keep numeric
   drafts distinct from canonical time. Present a clear unavailable state when
   location is missing; provide a route to location editing rather than inventing
   coordinates, showing a valid-looking zero, or disabling unrelated settings.
2. Contribute Flat Earth time at shared scope with a native `input type="range"`,
   signed Degrees text input with `inputmode="decimal"` (preserving `+45.0`),
   zero marker, before/after legends, date basis and resolved device-time readout.
   The suggested numeric interaction is acceptance on Enter or valid blur,
   Escape to restore the accepted representation, and retained invalid/incomplete
   text with local feedback and no timestamp write. Record the chosen behavior
   with the M1 policy; there is no panel-wide Apply. Preserve the slider's
   Shared time / degrees-from-closest accessible name, before/after value text,
   associated reference explanation and visible focus. Use native range keyboard
   operation with the same shared-time action as pointer input.
3. Add a separate Shared time row to every Flat Earth toolbar, reusing the same
   model/controller operation as the panel. Its mounting view controls placement
   only. A toolbar edit updates the shared time owner and both scenes; it does
   not mutate that view's Camera record. Both Time settings buttons read the
   generic shared section's open state; Page settings highlights only its own
   view's Camera target.
4. Reconcile ordinary date/time changes and clock ticks back into all accepted
   angle/readouts without overwriting an active numeric draft or repeatedly
   writing the clock. Define how a slider action supersedes a numeric draft and
   how a removed provider/view ends a gesture. Location changes preserve accepted
   time and recompute the closest reference according to M1.
5. Coalesce rapid requests through the existing newest-request scene flow. Keep
   one shared accepted timestamp even if views finish different frames at
   different moments; retain/update per-view pending/failure feedback. Never
   label an older displayed frame with the requested angle as if it had rendered.
   Closing the panel/view or stopping the feature releases only its owned
   listeners/gesture resources; shared accepted time survives.

Deliverables: live panel and toolbar controls with model/controller tests for
numeric drafts, round trips, external updates, shared writes, independent camera
state and cleanup. Real-browser evidence must change a slider and numeric field,
observe the actual clock and both rendered observation identities, then change
ordinary date/time and confirm readback. A screenshot alone is insufficient.

Advance when every input path shares the same instant, a rapid-update/close test
cannot publish stale results, and no per-view clock or accepted-angle duplicate
has been added. Estimate: 4–7 hours after M1; GPU frame preparation affects test
duration and must be measured before promising smooth continuous playback.

### M4 — Match Responsive Comps And Verify The Complete Result

Purpose: establish appearance and behavior in the real application, including
the density tradeoff shown in the compact comps.

1. Tune Grid/container rules to T1–T4. Preserve camera/time semantic rows, global
   summaries, all required controls, selected states, zero marks and one scene
   hint per view. Use the right panel at T2 and bottom panel at T3/T4. Keep target
   and section navigation reachable outside the scrolling settings body.
2. Exercise nearby widths and narrower/shorter windows, not just four fixed
   screenshots. Reflow/scroll deliberately when the supplied arrangements no
   longer fit. Do not force two undersized toolbars merely to retain side by
   side at every width. Preserve the optional second view and its state through
   responsive layout changes. Confirm locale-derived date/time and longer
   labels do not cause overlap or hide actions. Below the supplied targets,
   this is a containment/reachability safeguard using existing fallback behavior,
   not a newly designed phone layout or a commitment to additional breakpoints.
3. Run client type checking, feature test compilation/build, the Flat browser
   suite, formatting and whitespace checks. Use `npm run typecheck:flat`,
   `polylith build flat`, and `npm run test:ui:flat` (or existing isolated build
   equivalents when a watcher would race). Reuse the current test infrastructure.
   Run focused engine tests/types if the geometry contract changes; broaden only
   for an affected engine concern. Server is unchanged: do not repeat unrelated
   suites without a reason. Coverage remains disabled.
4. In real Chrome/WebGL, exercise missing location, city/manual coordinates,
   date/time acceptance, shared sliders/numeric input, invalid drafts, panel
   reopen/section changes, rapid seeks, loading/failure recovery, independent
   cameras, repeated second-view close/reopen, Escape/focus return, range keyboard
   input and resize. Exercise the M1 interruption matrix during active gestures
   and drafts, including the clock's existing live mode without adding playback UI.
   Verify no duplicate clock/editor writes, stale view actions, unexpected
   browser errors, or resources remaining after stop. Preserve earlier failure
   captures if a fix requires another run.
5. Capture and inspect the actual application at all four assigned sizes under
   common reference conditions. The essential image evidence is frame geometry,
   typography/color, visible shared/view scope, slider/numeric placement and
   clipping. Render each live canvas at its own aspect ratio; do not paste the
   comp scene image into the app. Compare chrome/layout to the reference PNGs
   without treating aspect-ratio-dependent scene pixels as a layout regression.
   Record exact tokens: #121212 background, #F2F2F2 text/borders, current #ABD3FA
   action blue, Arial/Helvetica and the specified type/control sizes. Measure
   the four frame/header/panel bounds against the designer specification.

Reference for meaningful comparison: San Jose at latitude 37.33939°, longitude
−121.89496°, date basis June 20, 2024, angle +45°; the current production resolver
returns `2024-06-20T23:08:48.339Z` / device America/Los_Angeles
**Jun 20, 2024 · 4:08:48 PM**. Use elevation 5m and vertical FOV 50° for both
reference captures; then separately vary one camera to prove independence.
Record build/source identities, viewport/device scale, locale/zone, timestamp,
camera values, render completion and any intentional layout differences.

Deliverables: four real screenshots, machine-readable behavior/containment
results, relevant test/type/build output and a concise final comparison report.
Complete when requested placements and shared-time behavior work, required
controls remain reachable and new checks pass. Classify visual differences as
fixed, owner-accepted deviation (with its decision link), or unresolved mismatch;
do not call an unresolved required placement/dimension mismatch complete merely
because it was reported. Record outstanding product policy choices honestly.
A static comp inspection or matching initial values is not runtime verification.

Estimate: 2–4 hours, plus measured GPU startup/frame costs. Repair only the
affected layer when a check fails and rerun the invalidated evidence; do not
restart the entire sequence for an isolated layout or browser issue.

## Execution Record, Review And Handoff

First executable step, once implementation is authorized: record the baseline
and run M1's focused conversion/readback proof while drafting the minimal generic
settings section contract. No broad scaffolding or new review process is needed.

Rough implementation estimate: 10–19 hours, not measured elapsed time or a hard
limit. Update after M1 and the first useful frame slice; the dominant unknowns
are day/angle readback and rapid real-renderer updates. Existing runtimes,
installed Chrome and the current GPU are sufficient starting resources; no new
package or external repository write is assumed. M2 frame work can progress
independently of unresolved angle policy after its navigation contract is stable.

Keep a concise execution log alongside this plan when execution starts. Each
milestone entry records completed substeps, deliverable/evidence links,
observations versus interpretation, limitations/checks, disposition and exact
next action. Publish useful working captures promptly. Keep the plan's milestone
status and owning Flat README current; do not turn current-state documents into
a chronological log. Preserve all prior comp/run evidence. If interrupted,
resume from the recorded next action and validate only evidence whose source,
contracts or environment changed.

At completion, report the result against the scope above, link runtime and
visual evidence, record any policy choices/deviations and update the time-input
note, component proposal and Flat status. Do not claim a performance guarantee
from valid static frames. No deployment, commit or experiment resumption follows
automatically.

The owner's cancelled engineering standards-review process remains inactive;
primary self-review and local checks apply. This plan does not enable reviewers
or recreate refinement. Its one separate-agent critique, required by create-plan,
is a read-only review of the plan, not engineering compliance or visual acceptance.
No additional discretionary agent review is scheduled. Record a bounded reason,
question, scope and completion condition before adding one during execution.

## Plan Critique

One read-only second-agent critique completed on 2026-11-05. Incorporated its
requests for independently expected signed/day-boundary results, an explicit
gesture/draft interruption matrix, native range/decimal text semantics and
keyboard/reference checks, bounded smaller-window scope, and exact visual-token
and geometry comparison with unresolved mismatches kept open. Its stylesheet
correction had already been applied during the critique: `src/flat/styles/app.css`
is the current owner. No suggestions were rejected. This was a plan critique,
not a source standards review; no additional review round is needed.

## Current Resumption Point

- M1 complete; M2/M3 working desktop slice; M4 pending.
- Next: preserve the tested slice, refine Camera labels/configuration and verify
  full interactions/responsive targets. See the execution record for evidence.
- Execution is authorized; no experiment resumption or deployment is selected.
