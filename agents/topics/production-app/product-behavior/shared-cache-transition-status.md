# Shared-cache transition allocation

State: implemented and locally verified, 2026-10-22. Standards review remains incomplete.

The owner requested that a policy-only memory restriction must not fail an app
update. The reported failure was `Shared-cache jump requires a qualified dual-atlas
transition budget.` It was emitted before attempting a GPU allocation.

## Behavior and scope

SharedDistantCacheAssets no longer fingerprints the renderer and Chrome version
to choose a runtime allocation allowance. DistantSunSharedCacheController attempts
an isolated replacement atlas when a new scene cannot coexist with the visible
scene in the current atlas. A historical byte allowance or absent transition
qualification cannot reject that attempt. Existing qualification-harness input
fields remain accepted for retained callers, but do not govern runtime transitions.

The controller retains the last published atlas while the replacement prepares,
publishes only a complete frame, releases superseded preparation before starting
another, and retires the old atlas after publication. Peak residency remains two
atlases. Default residency, cache format, selected package, scattering calculations,
larger-route layout qualification and package integrity validation are unchanged.

Actual backend dimension/format support, GPU allocation/upload errors and context
loss still prevent unsafe publication. Genuine data/transport failures are also
reported rather than disguised as successful GPU work. This change removes a
policy failure; it does not hide errors or replace the requested scene with a
partial one.

## Verification and review

- Controller regressions: 17 cases pass, covering unqualified forward/reverse jumps,
  the corrected cubic policy, two-atlas cancellation, actual allocation/upload
  failure rollback and retry, darkness and context restoration.
- Algorithm32 and Flat32 local type checks pass.
- Fresh app, shared-cache Worker and Polylith browser-test builds pass.
- All 9 focused resolver/selection cases pass in Chrome Headless 155, including
  selection without renderer fingerprint access or qualification evidence.
- All 8 existing ThreeCacheBackend cases pass. Allocation/upload failure assertions
  in the controller use injected backend failures; these checks do not claim a
  new full-scene GPU transition capture.
- Repository formatting preflight, `npm run format:check` and `git diff --check`
  pass; the formatting log is retained in the review session.
- Production review remains incomplete: topic refresh rechecked readiness and
  received `Stale all-lane calibration; prepare again`. No standards reviewer was
  started and no compliance result is claimed.

Review unit: the shared-cache controller and its ambient contracts/regressions,
Flat32 shared-cache selection and its contracts/browser regression, and this topic
handoff. Starting HEAD is 9423a8543729b11044e3d9176b51289233187a7a. The preceding
controls plan, its README link and active-topic edits were already present. The
review session is `.codex-tmp/review-standards/session-BWY0Ic`; its setup succeeded
after a sandbox spawn restriction, but a formal pre-edit capture was not recorded.
That limitation must be retained in any subsequent review request.
The post-edit source snapshot is recorded separately as `post-edit-snapshot.json`,
not presented as a pre-edit baseline. Checkpoint advice found the fix functionally
coherent. It is preserved with the subsequent owner-authorized M1 runtime
foundation; the [controls execution record](sky-scene-controls-execution.md) owns
that checkpoint receipt and its scope. No remote push was authorized.

## Other work

The [sky, scene and elevation controls plan](sky-scene-controls-plan.md) remains
planning only. This bug fix does not authorize its implementation. ARM validation
and Sky Accuracy Dials remain suspended. No cache rebuild or external governance
repair is needed for this fix.
