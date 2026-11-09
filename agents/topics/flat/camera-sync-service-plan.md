# Camera-sync Service Implementation Plan

Status: M1-M2 implementation and verification complete on 2026-11-08 under the
owner's independent-execution request. The final report below owns results and
the checkpoint record. Page, UI and production startup integration are excluded.

## Outcome and scope

Implement the registered Polylith service named `camera-sync` in
`src/flat/services/camera-sync.js`, following the
[Sync Window design](sync-window-design.md). That document owns behavior;
this plan owns the implementation sequence and verification.

Completion means isolated consumers can register, publish camera controls,
request all four sync modes and unregister through the service's public
capability, with the specified callbacks and asynchronous behavior.

This task does not connect Earth pages, change their controllers, sessions or
models, add instance-specific production receivers, add UI, or import the
service into `src/flat/main/main.jsx` or another production startup path.
Direction/elevation are the only synchronized values. FOV, debounce/coalescing,
typed error codes, and renderer integration remain deferred. There are no new
dependencies, server changes, cache builds, renders or deployment tasks.

## Starting point and implementation choices

- Existing services extend `Service` from `@polylith/core`, register named
  capabilities with `implement`, and accept an isolated registry for testing.
- The installed registry exposes `subscribe(name)` and `unregister(name)`.
  Unregistering removes registry lookup; it does not invalidate references
  already held by consumers or stop asynchronous operations.
- The existing Flat Jasmine/browser lane imports service specs through
  `src/flat/spec.js`. Use that lane rather than introducing a new runner.
- Preserve all preceding uncommitted controls and resize changes. Capture the
  current HEAD, status and relevant diff before implementation; they form the
  baseline for distinguishing this unit's edits.
- Export a constructible `CameraSync` class. Construction in an explicit
  registry exposes `camera-sync`; do not activate a default instance in the
  production application as part of this task.
- Use opaque, non-reused symbol handles. Stale or foreign handles have no
  effect and must never resolve to a replacement registration.
- The contract covers two participants, independently of any UI. Do not add
  multi-party pairing. A third registration must report the ambiguous-peer
  error rather than silently choosing an arbitrary other participant.
- Receiver service names must identify distinct registered instances. Prevent
  duplicate active ownership of a receiver name. Retain the original receiver
  identity so unregister cannot delete a replacement registered under that
  name. These are ownership guards, not repeated validation of owned controls.
- Copy the small camera record and quaternion at ownership boundaries. Trust
  the typed payload; do not add hashes, repeated schema scans or freezing.
- Public `update`, `sync` and `unregister` complete without waiting for
  `cameraChanged` promises. Start/stop own the service lifetime and cleanup.

## Files

| File | Purpose |
| --- | --- |
| `src/flat/services/camera-sync.js` | Service implementation, participant state, subscriptions, callbacks and cleanup. |
| `src/flat/services/camera-sync.d.ts` | Public service capability and documented methods. |
| `src/flat/services/types.d.ts` | Ambient public mode, handle, controls, orientation and receiver capability types, following the loaded canonical placement rules. |
| `src/flat/services/types/CameraSync.d.ts` | Implementation-private participant state, if needed. |
| `src/flat/services/_tests/CameraSyncSpec.js` | Isolated-registry contract tests using instance-specific receiver services. |
| `src/flat/spec.js` | Import the service spec into the maintained test lane only. |

Update this plan's execution record, the owning design when implementation
details are settled, and current-topic links/status. No additional application
source files are expected to change.

## M1 — Usable isolated service and mode transitions

Purpose: establish a working service through its public Polylith capability
without relying on Earth views or a UI.

1. Load the applicable folder standards and local authoring rules. Capture the
   baseline and confirm the existing registry operations on a fresh isolated
   registry. This is the first executable step after execution is authorized.
2. Add the service and ambient contracts. Include `CameraSyncMode` as the
   string union, `CameraSyncControls` with orientation and
   `observerHeightMeters`, and a receiver with `synced` plus
   `cameraChanged(...): Promise<Error | void>`.
3. Register two fake instance-specific receiver services. Implement participant
   registration, initial/requested-state snapshots and `update` delivery.
   Remember delivered requested controls without requiring receiver echoes.
4. Implement the mode and transition rules from the design. Use the other
   participant's current requested settings for the initial caller update.
   Do not send the source a redundant initial `cameraChanged` for `both`.
5. Add focused maintained specs demonstrating:
   - `now` copies once; later source updates are not delivered unless an
     existing subscription already permits them. The requesting receiver gets
     `synced('now')`; this action notification does not replace the remembered
     subscription or prevent its later deliveries.
   - `them` immediately copies to its caller and follows only the other page.
     The requesting receiver gets `synced('them')` for a one-way relationship.
   - `both` immediately copies only to its caller, notifies both with
     `synced('both')`, and forwards later changes in either direction.
   - Reciprocal `them` requests become `both` and notify both participants.
   - `now` preserves subscriptions; `them` cannot downgrade `both`; repeated
     `both` retains bidirectional delivery. These direct service calls work
     independently of the UI availability rules.
   - `off` from either participant cancels all subscriptions and publishes the
     specified `off` notifications. Repeating it leaves synchronization off.
   - Requests without the other registration or its initial state do nothing:
     no callback, subscription or deferred activation after it becomes ready.
   - Mutation of input or delivered objects cannot change retained snapshots;
     a later sync uses the latest requested state, including delivered state.

Deliverables: implementation, declarations and early public-contract specs;
link their test output and type-check result in the execution record.

Completion: the isolated service demonstrates initial copy, one-way and
two-way updates, transitions and no-op readiness behavior. Report any concrete
contract discrepancy before proceeding, resolve routine implementation choices
within this scope, and retain completed evidence.

Estimate: roughly 20–40 minutes, dominated by mode/notification tests. This is
an estimate rather than a work limit; update it from actual progress.

## M2 — Async overlap, ownership cleanup and service-only handoff

Purpose: establish that lifecycle changes and slow receivers do not invalidate
the contract or accidentally integrate the service into the application.

1. Implement unregister/stop cleanup. Remove participant state and its owned
   receiver registration; notify the remaining affected participant with
   `synced('off')`. Keep stale handles harmless, including after stop/start.
   Do not remove another service that has replaced the original receiver name.
2. Exercise async receivers with manually controlled promises:
   - Leave one call unresolved, then prove the next `cameraChanged` is invoked
     immediately for that same receiver. Do not await, serialize or lock out
     new changes behind an earlier promise.
   - Complete older calls after newer ones. Completion must not publish stale
     controls, start new deliveries or change subscription state.
   - Return an `Error` from a receiver. The service ignores that result and
     continues delivering; there is no rollback, retry or UI notification.
   - Turn synchronization off, unregister, stop or replace a receiver while
     a promise is pending. Already invoked work is not cancellable through
     this contract, but its completion must not revive a relationship or
     address a new participant. Subsequent `update` calls follow the new state.
3. Contain unexpected callback throws/rejections using the existing diagnostic
   conventions so they do not create unhandled promise rejections or prevent
   unrelated valid deliveries. Expected failures still use returned `Error`
   values; do not introduce a new error-result protocol.
4. Cover synchronous callback reentrancy. Have `synced`, and the initial
   synchronous portion of `cameraChanged`, call `off` or `unregister`. The
   surrounding operation must not restore the cancelled relationship, invoke
   a receiver removed by that callback, or continue obsolete subscription
   notifications. Establish state before callbacks and respect any newer
   transition or registration retirement before further notification.
5. Cover independent application registries, ownership conflicts, stale
   handles, registry removal and clean restart with isolated service tests.
6. Run `npm run typecheck:flat`, the maintained `npm run test:ui:flat` lane,
   relevant formatting checks and `git diff --check`. Use disposable browser
   profiles and remove their data on success or failure. Run the normal
   `npm run build:flat` after the test lane, which emits a test bundle.
7. Verify the normal production import graph still does not import
   `camera-sync.js`; no Earth feature or application startup was wired to it.
   Do not launch shader/cache qualification or native render checks for this
   service-only change.
8. Update the execution record and current topic with the final file list,
   verification, limitations and the future integration boundary.

Deliverables: complete service and regression tests; selectable test logs and
type/build results below an ignored `.codex-tmp/camera-sync/<run>/` folder.
No screenshots are needed because this task has no visual output.

Completion: all required checks pass; callbacks can overlap; returned errors
are ignored; removal and restart preserve lifetime isolation; the normal app
remains unconnected to the new service. Do not claim renderer-side latest-wins
behavior: pages are not yet integrated and must eventually handle their own
overlapping application requests.

Estimate: roughly 20–40 minutes, including tests and build. The main uncertainty
is callback/lifetime edge cases. There is no reason to parallelize implementation
for this small shared-state service.

## Reporting, review and recovery

Record a concise report after each milestone below: deliverables and logs,
observed results, limitations or decisions, and the next action. The final
report evaluates the service-only outcome and explicitly states that page/UI
integration, metering and richer errors remain deferred.

Engineering standards reviewers remain cancelled. Primary self-review uses the
folder-mapped standards; this plan does not reactivate reviewers or require
scientific qualification. Checkpoint-adviser monitoring retains its independent
whole-repository scope. The create-plan skill's one read-only plan critique is
recorded below; no recurring milestone critiques are required.

If a check fails, preserve its output, diagnose the affected contract, and rerun
the relevant check after correction. Do not reset unrelated working-tree
changes or broaden into page integration to make a test pass.

## Execution record

- M1: complete; normal mode flows, missing-peer-state no-ops and owned snapshots
  are verified through the public registry capability.
- M2: complete; async overlap, callback reentrancy, error results, registry
  ownership, stop/restart and production non-integration are verified.
- Next action: no service implementation work remains. Checkpoint details are
  linked from the final report. Any later Earth-page/UI integration requires
  a separate owner request.
- External dependencies: existing installed Polylith and maintained test/build
  tools only. No external service or repository writes are required.

### Execution decisions

- The loaded canonical types standard places public data in the nearest
  ambient `types.d.ts`. Use `services/types.d.ts` rather than the earlier
  draft's per-service ambient file. Keep the exported service declaration
  beside its implementation; runtime JSDoc continues to avoid import expressions
  per the owner's instruction.
- Scratch/evidence root: `.codex-tmp/camera-sync/20261108-01/`.
- The service declaration exports its capability; one ambient reference to that
  exported interface preserves the owner's no-import-expression runtime JSDoc
  rule. Public data remains ambient rather than duplicated in the module.
- `start` is idempotent for an active lifetime. `stop` rejects new registrations,
  releases owned receiver registrations and cancels subscriptions; already
  invoked asynchronous work is not cancellable and is never awaited.

### M1 normal-flow report

The real registry baseline passed. The service, declaration and eight new
contract tests are implemented. The maintained Flat browser lane passed all
249 specs, including the eight new cases, in 32.2 seconds; Flat type checking
passed in 8.2 seconds. These are wall-clock runner measurements, not CPU or
reasoning time. Logs/results: `m1-tests` and `m1-types` under the scratch root.
The tests establish initial caller adoption, now/them/both/off, reciprocal
subscriptions, direct requests normally disabled by a UI, and snapshot
ownership without echoes. M1's final missing-peer-state check is included in
the passing M2 verification batch. No production page/startup imports were added.

### M2 and final report

The service is implemented at
[camera-sync.js](../../../src/flat/services/camera-sync.js), with its adjacent
public declaration, ambient public types and private registration type. Its
only application-tree importer is the maintained
[service spec](../../../src/flat/services/_tests/CameraSyncSpec.js). The class
registers `camera-sync` when explicitly constructed; the normal app does not
construct or import it.

All 267 maintained Flat browser tests pass, including 26 camera-sync cases.
The complete spec covers missing peer state without deferred activation,
overlapping callbacks and reverse completion, ignored returned Error values,
unregister/off/stop during pending work, same-name receiver replacement,
cross-registry and stale-handle isolation, restart and synchronous callback
reentrancy. Unexpected callback throws/rejections are diagnosed without
blocking other notifications; expected returned errors remain ignored.

Evidence below `.codex-tmp/camera-sync/20261108-01/`:

- [Baseline](../../../.codex-tmp/camera-sync/20261108-01/baseline.json)
  and `baseline.diff` preserve the preceding uncommitted whole-repository state.
- [Types](../../../.codex-tmp/camera-sync/20261108-01/m1-types.result.json):
  pass, 8.2 seconds. Production implementation/declarations were unchanged
  after that check; subsequent edits added tests and documentation.
- [Complete browser suite](../../../.codex-tmp/camera-sync/20261108-01/m2-tests.result.json):
  pass, 32.5 seconds; `m2-tests.log` retains individual case results.
- [Normal build](../../../.codex-tmp/camera-sync/20261108-01/final-build.result.json):
  pass, 20.1 seconds, after the browser test bundle.
- [Non-integration proof](../../../.codex-tmp/camera-sync/20261108-01/unconnected.json):
  only the test imports the module; the normal bundle contains no camera-sync
  implementation. No feature/session/UI code was changed during this unit.
- Targeted Prettier checks and `git diff --check` pass. Disposable browser
  temporary directories were removed, including cookies/cache; none are kept
  as evidence. No dedicated standards review was run or claimed.

The browser logs retain three existing React act warnings, also present in the
pre-service comparison-selection suite. They are not camera-sync failures;
this service-only unit does not alter the unrelated React test lifecycle.

These timings measure runner wall time, not callback throughput, GPU work or
model reasoning time. The plan's estimates were guidance; no performance
benchmark was needed for this service-only implementation.

The initial design's mode notifications and synchronous reentrancy cases were
added through the earlier independent plan critique. Primary self-review
checked the new service/types/spec against the loaded standards and owner
rules; the cancelled engineering review process was not reactivated.

Limitations are intentional: there is no production consumer yet. Renderer-side
application of overlapping elevation/orientation requests, actual UI state and
end-to-end camera linking remain untested until integration. FOV, request
metering and structured error codes remain deferred. No service-contract tests
required by this plan remain deferred, and there is no implementation blocker.

The independent-execution skill authorizes a local checkpoint after adviser
evaluation. It covers the whole repository, including the preceding focus,
Now, compass, scene-resize and comparison-selection changes. The exact result
will be retained in
[checkpoint.json](../../../.codex-tmp/camera-sync/20261108-01/checkpoint.json);
nothing is pushed. Git history identifies the commit containing this report.

The checkpoint adviser recommended the complete tree as a coherent unit and
suggested `Add Earth camera controls and sync foundation`. The owner's skill
invocation preapproves that local message. The whole-tree inspection found no
large-data warnings, generated execution output or credential candidates.

## Plan critique

One separate agent reviewed the draft against the owner's design and the
service-only boundary. Both recommendations were incorporated:

- Make `synced('now')` and one-way `synced('them')` explicit test obligations,
  including preservation of subscriptions after a direct `now` request.
- Test synchronous callback reentrancy independently of async promise overlap,
  protecting cancellation, receiver removal and notification freshness.

No suggestions were rejected. The critique requested no extra milestones,
UI work, renderer verification or review round. This was a read-only plan
critique, not implementation verification or a standards-compliance result.
