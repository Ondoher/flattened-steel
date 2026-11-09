# Camera-sync UI Integration Plan

Status: M1-M2 complete under the owner's independent-execution request on
2026-11-08. This plan adds the UI and
Earth-page integration excluded from the completed
[service-only plan](camera-sync-service-plan.md). The
[Sync Window design](sync-window-design.md) owns the accepted behavior.

## Outcome and boundaries

Both Earth toolbars have a `SyncAltOutlined` button immediately after the
compass button. It opens a text-only action menu. The same glyph is always
shown; MUI ToggleButton's standard primary selected treatment indicates that
this window receives ongoing camera updates. Clicking/opening the menu does
not toggle selection. Each view updates its own selection from `synced`.

The working app supports Match now, Follow other view, Link both views and
Stop syncing. Direction and requested observer elevation synchronize through
the existing `camera-sync` service. FOV, aspect ratio, sky mode and compass
visibility remain per-view; shared location/date/time remain as they are.

Completion includes mixed and same-type views, early participant registration,
no callback echoes, overlapping requests and exact cleanup on page replacement,
comparison closure and application shutdown. The workspace must remain generic;
Earth features do not import or call each other's implementations.

No debounce/coalescing, richer error codes, settings-page sync controls,
scattering/cache changes, parser/time-zone work or new UI framework. Do not
rewrite the tested coordinator or add UI assumptions to its contract. Correct
a coordinator defect only if integration exposes a concrete contract violation;
preserve its existing regression coverage and record the focused correction.

## Starting point and baseline

- Whole-repository checkpoint `661b67fb` contains the service and preceding
  Earth controls. Preserve the subsequent uncommitted ambient-declaration fix
  and the owner's UI decisions. Capture the actual HEAD/status/diff at execution.
- Service evidence: 26 contract specs, 267 total passing Flat browser specs,
  normal build and types. The latest ambient-only declaration correction also
  passed type checking. Reuse those results for unchanged code; integration
  needs new verification of actual consumers.
- The class currently exports `CameraSync` without instantiating it. Main
  imports other app services, and shutdown already retires both Earth owners.
- Each Earth controller owns sessions by view ID; the same feature controller
  can host both views. Each session owns its runtime and physical-height lane.
- `IconMenuButton` already supplies MUI menu behavior and text-only action items
  when `value` is omitted. Its current trigger is an ordinary IconButton without
  a MUI selected state. Existing icon styles target `.MuiIconButton-root`.
- The runtime camera callback also reports look status and, in Flat, FOV
  operations. Listening indiscriminately to all session state changes would
  generate unwanted sync traffic and echoes.

## Integration decisions and ownership

### Application and receiver lifetimes

Construct `CameraSync` explicitly with the application's registry in main
before `registry.start()`; retain the constructor-only service module. Stop it
after Earth controllers have retired their participants. Do not use the master
registry for intra-application camera synchronization.

Introduce one reusable, instance-specific receiver adapter under
`src/flat/common/`, implementing the existing ambient `CameraSyncReceiver`
contract. It is a registered Service with a unique name incorporating view ID
and mounted lifetime, not a shared singleton or a renamed utility model.
Controllers construct/register it early, supply initial requested controls,
and delegate callbacks to that exact session. `camera-sync.unregister` removes
its registry entry. The owner also invalidates its callbacks before retiring
the session/model. Names, handles and callback guards must protect replacements
even when the same primary view ID is reused for a different page.

### State and camera operations

The coordinator remains authoritative for subscriptions. Retain a disposable
per-view notification projection for presentation, using the existing scoped
feature state. Preserve the current subscription mode when `synced('now')`
arrives. `them` and `both` select the button; `off` clears selection. Keep enough
mode information to determine menu availability even though the button has
only two appearances. Do not introduce a second global subscription model.

User pointer look, Sun/Polaris focus, and height commands publish requested
orientation/elevation. A focus command publishes its resulting local direction;
it does not independently focus the other scene's astronomical target. Manual
movement of a one-way follower leaves the subscription intact; only Off cancels.

Publish new height requests before asynchronous preparation completes. Do not
publish old accepted height when an earlier frame finishes. FOV, ribbon, resize,
look-status and shared-time/location notifications must not produce camera
updates unless the synchronized controls actually changed through user intent.
Use explicit command/origin paths and small field comparisons where necessary,
not hashing or a subscription to every `_emit`.

Received settings use a separate application path: update the owning camera
model/session, apply orientation to the retained runtime, and request height
through its existing preparation lane. Do not call `cameraSync.update` from
this path, including later preparation completion. Do not hold a global
"receiving sync" flag across an await, which would swallow genuine user input.

The receiver's async callback settles for its own application request. If
physical height preparation is required, expose the smallest request-completion
contract from the existing session lane. New callbacks remain callable while
older ones are unfinished. Superseded, detached or failed requests settle with
an Error value; successful requests settle without a value. A view with no
runtime can retain requested controls for later attachment. Do not create a
second preparation queue or promise lock, and do not leave superseded promises
pending indefinitely. Existing generation/lifetime checks preserve latest
intent; late completion must not overwrite newer orientation/elevation.
Preserve the height lane's existing no-op check against pending height:
orientation traffic carrying the same requested height attaches to the existing
height outcome rather than cancelling/restarting preparation.

### Menu policy and shared presentation

Keep the coordinator free of UI knowledge. Controllers derive availability
through the workspace's public state/events, not another feature's models or
private maps. Initial reads occur after workspace readiness. Disable the trigger
with one open view, and also when the second view has no selected page. Current
Earth pages register and supply initial camera controls during page mount;
service requests before peer state exists still follow the agreed no-op rule.

| This view's subscription | Match now | Follow other view | Link both views | Stop syncing |
| --- | --- | --- | --- | --- |
| Off | Enabled | Enabled | Enabled | Enabled |
| Following (`them`) | Disabled | Disabled: already following | Enabled | Enabled |
| Bidirectional (`both`) | Disabled | Disabled | Disabled: already linked | Enabled |

Stop syncing remains available with two populated views even when this view's
indicator is off: the other view may be following it. It cancels the whole
relationship. The source of a one-way relationship displays off; the follower
displays selected. Both show selected for a reciprocal relationship.

Extend the shared icon-menu trigger with an optional controlled selected
presentation rendered by an actual MUI ToggleButton, using context control
size and `color="primary"`. Menu `value`/radio selection remains separate;
the sync menu omits `value` and contains plain action items. Preserve existing
IconButton behavior for other consumers, native attributes, localization,
tooltip, MUI anchoring, keyboard dismissal and focus restoration. Opening the
menu must not apply the current IconButton expanded-state fill to the selected
ToggleButton. Use MUI's selected styles rather than recreating them in CSS.

If peer closure or replacement makes the trigger unavailable while the menu
is open, close the menu and reject stale item activation during dismissal.
Preserve MUI focus restoration when the trigger remains usable, and do not
attempt to focus a disabled or removed trigger or steal focus from a new live
control. Use the existing menu lifecycle and event anchoring, without DOM
queries or new element-ref orchestration.

## Expected file ownership

| Surface | Planned responsibility |
| --- | --- |
| `src/flat/main/main.jsx` | Explicit coordinator construction and shutdown order. |
| `src/flat/common/` receiver adapter and ambient declarations | Reusable per-instance Service delegating callbacks to its owning feature; no scene knowledge. |
| `src/flat/components/IconMenuButton.jsx`, its trigger collaborator and ambient types | Optional controlled MUI-selected menu trigger, independent of menu action selection. |
| Both Earth controllers, sessions and runtime camera operations | Receiver lifetime, user publication, incoming control application and asynchronous completion. |
| Both Earth views, toolbar components and ambient contracts | Scoped state/action projection and the sync button beside the compass. |
| Existing feature model-services where needed | Camera/request facts already owned there; no utility classes named models or duplicate global subscription state. |
| `src/flat/phrases/en-US.json` | All sync names, action labels and state descriptions through localization without fallbacks. |
| Existing service/control/feature specs and `src/flat/spec.js` | Focused integration regressions in the maintained lane. |

All new/changed `.d.ts` contracts are ambient and export no symbols. Runtime
JSDoc refers directly to ambient types, with descriptions on the next line.
Follow local React rules: prepare logic/lists before JSX, named handlers and
region-owning render helpers. Do not import CSS at runtime. This is bounded
camera/UI integration, not an opportunity to refactor unrelated base controls.

## M1 — Working sync control in the actual app

Purpose: deliver the first meaningful browser result: both toolbars expose the
chosen button and real camera matching/following works through the service.

1. Load the applicable standards, capture the actual baseline, and verify the
   shared selected-trigger behavior with a small maintained control test before
   broad integration. Capture current scene/camera resource identities for
   later retention checks, without rebuilding scientific assets.
2. Implement the controlled MUI trigger and localized text-only actions. Verify
   that menu opening does not change selected state, context size is inherited,
   and existing menu/radio consumers retain their behavior.
3. Activate the existing coordinator in the application registry. Add the
   instance-specific receiver adapter and its owner-driven retirement.
4. Wire each feature's session to publish user-origin camera changes and apply
   incoming orientation/elevation without echoes. Add only the required retained
   orientation and request-completion operations. Keep FOV independent.
5. Relay menu intent through React -> owning view -> controller -> camera-sync.
   Project callback state back through that same ownership chain. Wire workspace
   availability without placing feature knowledge in the workspace or service.
6. Add normal-path maintained tests: initial values published before renderer
   readiness, Match now, one-way following, reciprocal/two-way linking, Off,
   selected states for source/follower/both, and no update echo. Include both
   toolbar-height and settings-height user entry paths.
7. Run Flat types, the maintained Flat browser lane and normal build. Serve the
   real app using a disposable browser profile. Capture a single-view disabled
   button and mixed views demonstrating one-way and two-way selected treatment;
   exercise the actual menu and an actual camera change.

Deliverables: working integration and focused tests, plus real served-app
captures proving placement, text-only menus and standard selected treatment.
Native camera measurements, not screenshots alone, establish copied controls.
Publish links and a concise milestone report in the execution record as soon
as the working slice is verified.

Completion: the owner can open comparison, match a camera, enable following or
both, move/focus/change height, and stop synchronization. Service behavior is
unchanged and existing toolbars remain functional. This is the first visible
browser milestone; it is not final lifecycle verification.

Estimate: roughly 45–90 minutes, with the existing height lane's completion
semantics the main uncertainty. Update this estimate after the early session
test. It is guidance, not a timeout or authorization boundary.

## M2 — Lifetime, concurrency and full UI verification

Purpose: prove that the feature remains coherent under rapid changes, different
page combinations and repeated mounting, without rebuilding scenes needlessly.

1. Exercise retained-resource behavior for orientation/focus: no cache/scene
   replacement, accepted local direction in both geometries, independent FOV
   and aspect ratios. Height uses only existing necessary preparation.
2. Test rapid height and orientation requests while prior callback application
   is pending. Prove new callbacks are invoked, genuine user input is published,
   received changes do not echo, old frame completion does not publish stale
   controls, and superseded promises settle. Return expected errors without
   throwing; retain the coordinator's ignored-error policy and existing page
   error presentation without an automatic unlink.
   Repeated orientation-only changes at the same requested height must not
   restart pending height preparation; completion tracking reuses that request.
   Shared time/location updates must not republish stale camera controls.
   Off stops future propagation but does not inherently cancel an already
   accepted application. Follow Off with newer local camera input and prove
   older work cannot overwrite it or restore the selected/link state.
3. Verify mixed views, two Flat views and two Spherical views; repeat page
   replacement within the same view ID. Close/reopen comparison while linked,
   preparing or with a menu open. Verify original receiver removal, fresh
   identities, no stale callbacks reaching replacements, survivor off/disabled
   state, exact listener cleanup, failed mount rollback, renderer retry and
   application shutdown/restart.
   When eligibility disappears, assert that the menu closes, stale item
   activation is ignored, and focus does not move into a retired view or a
   disabled trigger.
4. Test direct service actions that the UI disables using existing service
   coverage rather than redesigning the coordinator. Add integration assertions
   for the menu availability table, `now` preserving selection, reciprocal
   `them` notifications, and Off initiated from the source whose button is off.
5. Use the normal served app for native pointer-look and focus actions, height
   changes and configuration-panel height entry. Record controls and retained
   resource/preparation counters. Include narrow/stacked layout, menu bounds,
   keyboard navigation/Escape/focus return and configuration/comparison resizing.
   Inspect the actual MUI on/off treatment; do not substitute an illustrative
   mockup for rendered-app evidence.
6. Run appropriate Flat types, maintained browser tests, formatting/whitespace
   and normal build after final source changes. Reuse unchanged coordinator
   tests in that lane; run no unrelated engine/cache qualification. Run the
   existing Flat server lane if activation/build changes affect its contracts.
7. Update current design/status links and the final execution report. Dispose
   every automation profile on success/failure, preserving captures/logs only.
   No push or deployment is included.

Deliverables: passing integration tests, actual browser reports and inspected
captures under ignored `.codex-tmp/camera-sync-ui/<run>/`, linked below.

Completion: all accepted actions and indicator states work for mixed/same-type
views; lifecycle and concurrent requests preserve ownership/latest intent;
existing controls/retained rendering remain intact. Report actual measurements
and limits without claiming new physical/scientific qualification.

Estimate: roughly 30–60 minutes after M1, primarily browser warmup and lifecycle
verification. Reuse operational caches and prior unchanged evidence; do not
regenerate caches for UI testing.

## Reporting, review and recovery

Keep milestone reports here: completed work and evidence links, observed
results, decisions/limitations, disposition and next action. The final report
compares the result with this UI outcome, lists verification/deferred work and
records any checkpoint. No visual-design or engineering-review pipeline is
enabled: engineering standards reviewers remain cancelled. Primary self-review
and checkpoint-adviser monitoring keep their existing separate roles.

The create-plan skill requires one read-only critique before handoff; record
it below. No repeat review is attached to ordinary edits or milestone reports.
For a genuinely new bounded review need, state its question/scope before
dispatch. Repair the affected portion after a failed check while preserving
prior evidence and unrelated working-tree changes; do not fix errors by
serializing callbacks, silently breaking links, or weakening no-echo/latest-
intent assertions.

## Execution record

- M1: complete; actual mixed-view UI matching/following/bidirectional/off checks
  pass, with inspected captures and independent FOV.
- M2: complete; maintained concurrency/lifecycle tests and native mixed/same-type,
  configuration-height, cleanup and restart checks pass.
- First executable step after authorization: reload applicable standards and
  capture the current implementation baseline, then test the selected trigger.
- Authority: the owner requested independent execution of this plan, including
  both milestones and skill-authorized local checkpoints. No push/deployment.
- External dependencies: installed MUI/Polylith/Three and existing operational
  cache assets and maintained test/build tools; no new packages are needed.
- Deliberately deferred: debounce/coalescing, FOV synchronization, richer error
  codes, settings-page sync commands and scientific requalification.

### Execution decisions and recovery

- Evidence root: `.codex-tmp/camera-sync-ui/20261108-01/`. Baseline HEAD is
  `661b67fb`; `baseline.json`/`baseline.diff` retain the pre-existing declaration
  correction and UI design work.
- Ambient same-basename `camera-sync.d.ts` shadowed the JavaScript class when
  first imported into main. Its interface now lives directly in the included
  `services/types.d.ts`; no declaration exports or import bridges were added.
  Touched Earth controller/view contracts were also made directly ambient.
- A generated edit initially replaced rather than appended the existing
  common type vocabulary. It was restored byte-for-byte from the unchanged
  baseline before appending the new contracts; subsequent types pass. Failed
  type-check logs are retained and no existing declarations were discarded.
- The selected shared trigger uses MUI ToggleButton, with its color API adapted
  separately from ordinary IconButton props. The menu remains an action menu,
  so its optional radio value is not used to represent sync selection.
- Runtime orientation application is a separate non-reporting path. Only real
  user orientation differences or height requests publish controls. Height
  callbacks share the existing pending request; newer requests settle older
  outcomes with Error rather than waiting for them.
- The first browser harness selected unsupported 70-degree FOV/1000-meter
  presets, and later clicked during a closing MUI menu transition. The proof
  now uses existing 90-degree/500-meter presets and waits for portal removal.
  Prior failed reports remain preserved; these were probe corrections, not
  product policy changes or relaxed assertions.

### M1 report

The selected trigger, scoped receiver services, application activation and both
scene integrations are implemented. Types, the maintained browser lane and the
normal build pass. Final verification below includes the subsequent concurrency,
failure and non-camera-state regressions.

The real Polylith-served Chrome proof passed M1 in
[m1-passed.json](../../../.codex-tmp/camera-sync-ui/20261108-01/browser-m2/m1-passed.json).
It verifies the disabled one-view button; placement beside compass; text-only
menu; Match now with no update echo; one-way following and reciprocal them;
both selected indicators; disabled actions while linked; focus direction;
500-meter height propagation; Off; and independent 35/90-degree FOVs.

Captures in the same run: `single-disabled.png`, `one-way.png`, `two-way.png`,
and `linked-menu.png`. The rendered primary selected treatment and menu layout
were inspected. M1 is complete; M2 reused the same served build and disposable
browser lifetime. No shader/cache rebuild or
scientific qualification is part of these claims.

### M2 and final report

Both milestones are complete. Each Earth toolbar offers Match now, Follow other
view, Link both views and Stop syncing beside its compass. The selected button
means this view receives updates. Direction and requested elevation synchronize;
FOV and other page presentation remain independent. The coordinator itself was
reused unchanged, and the workspace remains generic. The settings-panel scope
hint now explains that synchronization includes elevation.

Verification and evidence:

- [Maintained browser lane](../../../.codex-tmp/camera-sync-ui/20261108-01/final-tests.result.json):
  **281/281 pass**, 27.0 seconds runner wall time, including 14 added control and
  integration cases over the 267-test baseline. Both session implementations
  cover overlapping callbacks, shared pending height, newer local input after
  Off, returned application errors, detach and retired-receiver isolation.
- [Flat types](../../../.codex-tmp/camera-sync-ui/20261108-01/final-types.result.json):
  pass, 7.8 seconds. The [normal production build](../../../.codex-tmp/camera-sync-ui/20261108-01/handoff-build.result.json)
  passes in 18.7 seconds. After correcting the localized settings scope hint,
  the [repository build](../../../.codex-tmp/camera-sync-ui/20261108-01/final-copy-build.result.json)
  passes in 29.6 seconds. Formatting and whitespace
  checks pass. No server route or server contract changed, so no server suite
  was added or rerun for this client-only activation.
- [Actual served-app report](../../../.codex-tmp/camera-sync-ui/20261108-01/browser-m2/report.json):
  mixed Earth views, two Flat and two Spherical views; all menu policies;
  matching/following/reciprocal links/Off; native pointer look and focus;
  500-meter toolbar elevation; independent 35/90-degree FOV; retained canvas,
  renderer and program identities with no orientation-only preparation; keyboard
  Enter/Escape/focus restoration; peer closure with an open menu; fresh receiver
  identities; narrow/stacked menus; configuration resizing; failed mount rollback;
  renderer retry; and application shutdown/restart all pass. Wall time 139.7 seconds.
- [Configuration entry report](../../../.codex-tmp/camera-sync-ui/20261108-01/browser-settings/report.json):
  real Flat settings elevation 500 meters and Spherical settings elevation
  2,000 meters each update both views with exactly one user publication and no
  echo. Shared location/time changes preserve the cameras without sync traffic.
  Wall time 47.0 seconds. Both native runs report no page errors and confirm
  disposable browser profile removal.

Inspected rendered captures:
[one-way selection](../../../.codex-tmp/camera-sync-ui/20261108-01/browser-m2/one-way.png),
[narrow text-only menu](../../../.codex-tmp/camera-sync-ui/20261108-01/browser-m2/narrow-menu.png),
and [configuration elevation](../../../.codex-tmp/camera-sync-ui/20261108-01/browser-settings/configuration-height.png).
The same standard MUI glyph and primary selected treatment are used in both
toolbars; opening the menu does not toggle the button.

These are local runner and native-proof wall times, including launch/build,
cache loading and assertions, not isolated CPU/GPU latency benchmarks. Existing
operational caches and unchanged scientific evidence were reused; this task
makes no new scattering, cache-accuracy or standards-compliance claim.
Engineering reviewers remain cancelled; the primary agent self-reviewed the
changed code and contracts. Checkpoint advice is a separate whole-repository
assessment: the adviser recommends this complete tree as a coherent milestone;
its [advice](../../../.codex-tmp/camera-sync-ui/20261108-01/checkpoint-advice.md)
records the preapproved commit message.

No required verification remains deferred. FOV synchronization, debounce,
structured error codes, settings-page sync commands and scientific
requalification remain outside this plan. There are no blockers. The next
product step is owner-selected; no push or deployment is included. The
skill-authorized whole-repository local commit and remaining worktree state
are recorded in
[checkpoint.json](../../../.codex-tmp/camera-sync-ui/20261108-01/checkpoint.json).

## Plan critique

One separate agent reviewed this draft against the owner contract and current
camera/session/control code. All three recommendations were incorporated:

- Preserve pending-height no-op behavior under orientation traffic, and attach
  completion tracking to the existing request instead of restarting it.
- Close the menu when eligibility disappears, reject stale item activation,
  and protect sensible focus behavior during removal/dismissal.
- Prove Off permits already accepted work to finish without overwriting newer
  local input or restoring link/selected state.

No suggestions were rejected. No additional milestone, UI decision, scientific
verification or review round was requested. This was a read-only plan critique,
not implementation verification or an engineering standards-compliance result.
