# P2 Execution

Selected by the owner through `independent-execution` on 2026-10-08.
Original investigation: fixed-height, fixed-offset rotations under the unchanged
shell policy. Its results below remain preserved. The owner-requested
[P2 corrective continuation](plan.md#p2-corrective-continuation)
is now selected; [correction progress](p2-corrections.md) owns the new work; P3-P7 and production changes remain unselected.

## Result And Evidence

- Starting repository state captured before edits in
  `.codex-tmp/review-standards/session-s1Pzi3/baseline.json`.
- P0-P1 evidence and frozen limits retained unchanged.
- V1: accepted diagnostic run `00025-p2-v1` compares 0/17-degree fresh builds
  and canonical fields. The [17-degree plate](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00025-p2-v1/angle-17-comparison.png)
  shows fresh/reused/50x difference panels. Maximum RGB-byte difference: 1;
  all inspected field and ray reuse scalars passed their frozen limits.
- Strict inverse transformation at the source axis failed. Production's fixed
  radial fallback is not rotated with that equivalence query. This is retained
  as a limitation, not permission to change angular reconstruction.
- Selected run `00027-p2-selected` completed all seven rotations at N4,
  z19/rho15 (285 positions), W27 (4,374 outgoing directions), F68 and Native15.
  All ten resident fields were measured completely before disposal. Node and
  cell-center reconstruction, angular seams, eight represented shell-boundary
  sentinels with +/-1 m offsets, ground/top/outer boundaries and 96 complete rays
  were checked at each angle.
- [Sealed disposition](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00030-p2-handoff/result.json):
  unrestricted reuse is rejected. P2 exits through its identified-counterexample
  branch. No qualified complete-ray reuse region is declared, so P3 translation
  cannot proceed on these results. The experiment remains active; it is not ended
  or suspended by this phase handoff.
- V1/V2: [selected 17-degree image](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00027-p2-selected/angle-17-comparison.png),
  [fresh/reused blink](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00027-p2-selected/blink-17.mp4),
  and [3-second rotation clip](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00027-p2-selected/rotation.mp4).
  All seven still pairs differ by at most one RGB byte; p95 is zero. The reused
  still uses the same fresh receiver adaptation. The clip uses one canonical
  cache and fixed canonical adaptation, with no fresh-per-frame comparator.
  It is a diagnostic visual, not temporal or receiver-light qualification.

| Check                           | Selected-profile result                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| J1-J4 and cumulative fields     | All measured scalar reuse comparisons passed.                                                                                                                                   |
| Transported L1                  | All measured scalar reuse comparisons passed.                                                                                                                                   |
| Transported L2/L3               | Failed at 45/90/135/271 degrees: respectively 142/168/142/177 scalars across both fields. Worst error is 1.5072 times the frozen absolute-plus-relative limit.                  |
| Production-frame reconstruction | All sampled cumulative and pure-J node/off-grid/seam/boundary comparisons passed.                                                                                               |
| Strict inverse transform        | Away-axis probes passed; axis probes failed at every nonzero angle because production selects a fixed radial fallback.                                                          |
| Fresh/reused CPU and GPU rays   | All 15-channel spectra passed, as did CPU/GPU radiance and transmission parity. Covered and uncovered rays are retained separately; this agreement does not admit clamped rays. |
| Coverage                        | World-fixed excluded rays: 9/9/22/60/86/90/44 of 96, in matrix order. Equivalent rotated probes each exclude 9.                                                                 |
| CPU/GPU endpoints               | 55 of 96 rays fail the unchanged 0.01 m bound at each angle; maximum 9.8323 m. This also occurs at zero rotation, so it is a baseline endpoint issue.                           |
| Independent source invariants   | 42 sentinels per angle: source distance rotational error <=9.32e-10 m, inverse-square relative error <=1.62e-16, analytic transmission residual <=1.12e-16.                     |

The worst L2/L3 residual indices decode to position 15: altitude 250 m,
radial index zero, on the source axis. This localizes the observed field
counterexample, but does not establish the exact cause of every failure.
`FlatScatteringCacheGeometry` flattens position indices as `zIndex*rhoCount+rhoIndex`.
A change to axis/angular reconstruction requires a separately scoped decision.
Physical horizontal symmetry alone does not establish discrete rotational
invariance. The much larger strict-axis query failure is distinct from the small
L2/L3 construction differences.

No nonfinite or excessive negative scalar was observed in the retained residual
inventories. CPU reference rays reconstruct measured GPU cache data: their
agreement verifies common-path parity, not independent higher-order accuracy.

## Decisions

| Question                                                    | Decision and reason                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Where should generated output live?                         | Use the experiment's declared ignored run root; this specific owner boundary takes precedence over the generic skill's scratch-root default.                                                                                                                                                                           |
| Which rotations?                                            | Retain the frozen 0/17/45/90/135/180/271 degree matrix, derived from Flat 0 at fixed height and offset. They are synthetic rotations, not geographic time presets.                                                                                                                                                     |
| How should images be presented?                             | Direct PNG comparisons and a native motion clip; no retained HTML viewer or Chrome profile.                                                                                                                                                                                                                            |
| What forms the source-review unit?                          | P2 harness, contracts and owning current-state documents, with unchanged run-boundary and P1 controls as relevant collaborators. One stable review milestone covers the unit.                                                                                                                                          |
| Can the bounded profile use W3?                             | The public production facade requires W27. Retain W27/N4/F68/Native15 and reduce only spatial nodes to z5/rho5. Preserve the rejected W3 setup attempt.                                                                                                                                                                |
| How should camera bindings handle an explicit profile?      | Supply the profile-owned geometry to the existing camera binding adapter without changing production. Preserve the failed initial adapter attempt.                                                                                                                                                                     |
| What about sub-nanometer rotation roundoff in the radius?   | Derive bounded radial nodes from their original fractions using the actual rotated radius, with an exact endpoint. Record the radius delta; do not relax production endpoint checks.                                                                                                                                   |
| Can clamped ray agreement count as coverage?                | No. Record every out-of-cylinder ray and exclude it from reuse admission, even when production fresh/reused output agrees.                                                                                                                                                                                             |
| How should endpoint discrepancies be handled?               | Retain CPU/GPU endpoint errors independently of fresh/reused spectral agreement. The one-centimeter gate remains unchanged.                                                                                                                                                                                            |
| Why did the full diagnostic attempt stop?                   | Run 00026 reached the final angle but exceeded Puppeteer's protocol timeout. Preserve it as failed; set the next selected run's connection timeout to 30 minutes. Reuse the completed bounded V1 and perform the decisive full selected matrix rather than duplicate every diagnostic build.                           |
| Does visual agreement qualify reuse despite field failures? | No. Keep the frozen limits and reject unrestricted reuse through P2's counterexample exit. No constrained complete-ray domain has been qualified.                                                                                                                                                                      |
| What did final self-review correct?                         | Normalize the active-topic line endings, repair the summary template relative link, and realpath-check/hash media tool metadata. Derive new handoff/media runs and refresh the complete source/context request; prior records remain immutable.                                                                        |
| What is the next branch?                                    | The owner has requested the correction sequence as a planned P2 continuation. The plan owns its axis/frame, L2/L3, coverage, endpoint and requalification steps. Original rejection persists; P3 and production remain unselected. Shell culling is scheduled after P5 qualification, immediately before P6 recording. |

## Verification And Completion Authority

- Local `npx --no-install tsc -p experiments/local-sun-cache-reuse/jsconfig.json`
  and repository `npm run format:check` are required alongside source review.
- [Media verification](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00031-p2-media/result.json)
  authenticates the complete selected parent inventory and verifies all MP4
  packets: 90 frames/3 s and 60 frames/2 s, both AVC at exactly 30 fps.
  This verifies encoded structure/timing, not decoded playback quality.
- Read-only comparison against the captured baseline found no changes under
  production `src/`, supporting `scripts/`, or the protected historical
  extraterrestrial experiment. Existing sealed runs remain immutable.
- Original investigation completion authority is the recorded exit-0 `CLEAN` in the
  [P2 primary and independent audit ledger](../../../../../.codex-tmp/review-standards/session-s1Pzi3/validation.json).
  The coherent review unit includes the P2 harness/contracts/current-state
  documents and explicitly selected unchanged run/provenance collaborators.
  Numerical rejection was an allowed outcome. This ledger covers the original
  reviewed unit and context; it does not qualify the newly planned continuation,
  which requires its own baseline, context refresh and validated source review.

Reproduce the decisive capture with
`node experiments/local-sun-cache-reuse/run-rotation.js selected --motion`,
then pass its new immutable run name to `summarize-rotation.js` and
`verify-rotation-media.js` in the same source directory. Each command allocates
new evidence; it never reopens these runs. Inputs retain source closure, bundle,
parent manifest/artifact, browser executable and hardware identities. Disposable
profiles are removed before sealing. The old sealed 00017 profile remains intact.

## Timing, Checkpoints And Deferred Work

The selected run took 240.5 seconds from run start to seal, including bundling,
shader compilation, probes, image/video encoding and cleanup. Per-angle cache
build plus full-field readback measured 942.1-2502.4 ms. These instrumented wall
times are not a benchmark of ordinary app rendering, warm-frame speed, physical
memory or replacement responsiveness. The successful allocation establishes only
that this diagnostic workload ran on the pinned GPU.

No local checkpoint has been created. Earlier automatic approval review rejected
staging/committing without direct owner acceptance; that disposition is preserved.
Checkpoint advice recommends preserving the coherent P0-P2 counterexample unit as
`experiment: record local-Sun cache reuse P0-P2 counterexample`. The earlier
approval rejection remains applicable; no staging or commit occurred. This advice
is separate from numerical and standards completion.

P3-P7 are unselected. Independent higher-order physical/reference convergence,
resource qualification, in-app replacement/lighting coherence, full temporal
checks and the identical-scene film remain unexecuted. No experimental unit-test
tree was created; the requested proof runners produce immutable run evidence.
The incomplete full diagnostic run is retained separately from successful V1
and selected-profile evidence. The plan now owns the requested source-axis, transported-field, coverage and
endpoint corrections as a P2 continuation. Its current implementation and qualification
state are owned by [P2 corrections](p2-corrections.md).
Shell culling remains outside P2 and is scheduled as the final optimization
evaluation after P5 qualification, immediately before P6 recording.
