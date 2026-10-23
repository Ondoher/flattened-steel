# Sky accuracy production promotion status

Selected2026-10-20: **Corrected60 + Sun-focused outgoing k=.35**, using completed
H61/H63 results. The [plan](sky-accuracy-promotion-plan.md) owns the sequence and
[transfer contract](sky-accuracy-promotion-contract.md) owns implementation seams.
Sky Accuracy Dials remains [suspended](../../poc-experiments/engineering-studies/sky-accuracy-dials/suspension-2026-10-20.md).

## Current disposition

The selected production port passes its bounded numerical, package-reconstruction,
application-rendering and lifecycle checks. The owner approved the increased
on-disk cache size on2026-10-21; both qualified candidates pass the revised disk
allowances. On2026-10-22 the owner explicitly directed activation as the app's
default. The canonical package is now published locally and selected with
`corrected60-sun035` and monotone-cubic lookup. The app and Worker rebuilt, all
eight server tests pass, and a fresh maintained-route GPU browser loads the new
identity with atmosphere state `ready` and zero rendering errors.
**Required production standards review remains incomplete** because live all-lane
calibration is stale. Owner-directed activation does not establish a compliant
handoff or satisfy the outstanding P3 review gate. No remote publication or push
occurred. ARM Spectral Validation and Sky Accuracy Dials remain suspended.

## Current default and rollback

The owner subsequently selected the Bruneton atmosphere with aerosol amount zero
for both app modes on 2026-10-22. The current default also includes complete
solar-coordinate coverage for all app elevations through 2 km, correcting an
exact-sunset horizon gap without changing any previously stored spectral values.
The algorithm remains corrected60/sun035 with monotone-cubic lookup. The
[zero-aerosol atmosphere record](../../production-app/product-behavior/zero-aerosol-atmosphere.md)
owns this physical selection, build, activation and new scene verification.
The numerical scores and qualification captures below describe the original
full-aerosol algorithm promotion; they are not new zero-aerosol paper scores.

The preceding full-aerosol package remains intact:
`8d185961cab8beb1e461cd1256be2875bb9a99e9f39e515b9288b92e5d2f6d37`,
725426183 bytes,109 scenes and90 blocks. Its report is3061 bytes with SHA-256
`76fcb62e8e70eececbbb7213591534042a38b8b28cfd577fda529de95034f5f7`.
During that preceding activation, only the distant-Sun package/report and matching scattering policy changed.
Native48/Native15/N4, P2/FP32, atmospheric composition, local-Sun defaults and
target-specific transition admission retain their existing selections.

The older canonical package
`9a30749c6d4e6c23d7a84839788c068133051fbbd9bd93d07de8b18a6ee432ec`
remains intact. Restore the authenticated
[rollback selection](../../../../.codex-tmp/sky-accuracy-promotion/handoff-01/rollback-selection.js)
only after checking the current candidate-selection hash, then rebuild/restart
and verify the loaded identity. Keep the legacy lookup and old report identity
paired; do not replace immutable package bytes.

Activation evidence:

- [Baseline and owner authority](../../../../.codex-tmp/sky-accuracy-promotion/activation-20261022-01/baseline.json).
- [Complete local publication](../../../../.codex-tmp/sky-accuracy-promotion/runs/2026-10-22T15-28-10-979Z-ac1c1499-6ba9-4c5f-9d93-cadecb3f8357/result.json).
- [Actual rebuilt app and loaded HTTP identities](../../../../.codex-tmp/sky-accuracy-promotion/activation-route-20261022-01/result.json)
  and [render](../../../../.codex-tmp/sky-accuracy-promotion/activation-route-20261022-01/current-route.png).

The fresh browser is Chrome155, using the qualified single-atlas route. Its owned
server and browser closed after verification. Existing unsupported dual-atlas
target behavior was not broadened. Publication reauthenticated all204 artifacts;
no GPU field was regenerated. Selected-server and shared-runtime local type
checks pass. Existing local-cache circular-import and body-parser warnings remain.

The darker horizon is consistent with the earlier matched libRadtran and independent
probe results, as the owner confirmed. Brightness preference is not a rejection
criterion. Matched scene appearance does not establish independent twilight truth.
The later incoming-grid, illumination, altitude and phase-control experiments were
not resumed. Atmospheric composition, aerosol amount, exposure and display defaults
were not changed to improve scores or appearance.

The [final verification](../../../../.codex-tmp/sky-accuracy-promotion/final-verification-01/result.json)
authenticates the earlier numerical/runtime evidence and reports its historical
`adoptionReady:false`; it was not rewritten by activation.
Its earlier storage hold is superseded only by the owner-approved
[disk acceptance](../../../../.codex-tmp/sky-accuracy-promotion/size-approval-01/result.json);
the historical report is unchanged. All qualification outputs remain below `.codex-tmp/sky-accuracy-promotion/`.

## Milestone report and gate dispositions

| Gate                                           | Result                          | Evidence and limits                                                                                                                  |
| ---------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| P0 ownership and compatibility contract        | Pass                            | Named compiler, serializer, service, CPU/GPU and application owners; explicit legacy/candidate pairing                               |
| P1 production adaptation and local checks      | Pass within tested scope        | 680 engine specs;45 Flat32 browser cases; focused compiler/policy12, generation11 and server6 checks; applicable type checks         |
| Preserved analytic N1                          | Pass, bounded witness           | Nine exact Float32 J1 probes at three wavelengths and identical Native48/W27 nodes; not a whole-field proof                          |
| Native51 full-spectrum paper reproduction      | Pass                            | 40 wavelengths,17 times,81 rays,31 scoring bands; sensitivity and aggregate gates below                                              |
| Matched Native48 paper route                   | Pass                            | Fresh legacy15 control and candidate use identical anchored/cubic physical queries                                                   |
| Native15 persisted reconstruction              | Pass                            | All109 scenes for canonical candidate, Toronto candidate and matched Toronto legacy control                                          |
| Matched actual scene rendering                 | Pass                            | 28 captures: seven current/candidate scenes for each of canonical and Toronto optics                                                 |
| Real packed CPU/GPU lookup                     | Pass                            | Maximum relative4.6702569484e-6 below unchanged5e-6; finite/nonnegative values and real packet probes                                |
| Runtime lifecycle                              | Pass on supported bounded route | Four actual receipts: supersession, held disjoint jumps, darkness releasing atlas, context restoration and zero coherence failures   |
| Flat/local isolation                           | Pass, smoke scope               | Actual compact N1 frame; unchanged local defaults and coordinate-frame round trip; no qualification of focused mapping for local Sun |
| Rebuilt current route and rollback preparation | Pass within stated scope        | Fresh compiled Bootstrap/Worker, maintained server route, loaded current package; authenticated candidate/rollback files prepared    |
| Owner-approved package-storage acceptance      | Pass                            | Canonical725426183 bytes and Toronto727455714 fit the revised750000000-byte ceiling; authenticated in size-approval-01               |
| Required production standards review           | Incomplete                      | Stale all-lane calibration prevents reviewer startup; no compliance claim                                                            |

The ordinary Flat32 browser suite passes45 of46 cases; its explicitly opt-in full
rectangular-cache acceptance case is skipped. Actual shared-cache full scenes and
compact-local smoke checks above are separate executed evidence. Engine,
shared-generation, shared-runtime and Flat32 type checks pass. The production app,
shared Worker and browser-test bundles build. Existing local-cache circular-import
warnings remain visible during builds. Whole-repository formatting and
`git diff --check` pass. No new failed test is outstanding.

## Numerical results

| Comparison                                         | Aggregate spectral RMSE |
| -------------------------------------------------- | ----------------------: |
| Authenticated H61 focused target, Native51         |      11.593958857038787 |
| Production compiler focused reproduction, Native51 |      11.593960694173592 |
| Retained Original40 paper control                  |       11.62291402828908 |
| Fresh matched legacy15 control, Native48           |       15.30298660938046 |
| Production focused candidate, Native48             |       11.27205204948326 |

Native51 aggregate replay deviation is0.0000018371348052mW, below the frozen
0.0001 sensitivity budget. Maximum same-query spectral relative deviation is
9.1611918643e-7, below5e-6. The production reproduction improves Original40 by
0.0289533341mW. Native48 improves its fresh matched control by26.34%.
Native48 versus Native51 is a representation bridge, not same-request replay.
The full40-band result does not relabel Native15 app rendering as a Direct40 score.
Per-interval regressions remain disclosed; the plan's aggregate gate passes.

- [Native51 intervals](../../../../.codex-tmp/sky-accuracy-promotion/paper-native51-report-02/interval-rmse.tsv)
  and [error domes](../../../../.codex-tmp/sky-accuracy-promotion/paper-native51-report-02/dome-comparison.png).
- [Native48 intervals](../../../../.codex-tmp/sky-accuracy-promotion/bridge-report-01/interval-rmse.tsv)
  and [matched bridge result](../../../../.codex-tmp/sky-accuracy-promotion/bridge-report-01/result.json).
- [N1 witness](../../../../.codex-tmp/sky-accuracy-promotion/n1-native48-01/result.json).

## Reviewable scenes and runtime evidence

Each profile has San Jose noon toward/side/away, sunset-10, sunset,+30 and+60minutes.
Captures use actual production application rendering, Native15/Native48, fixed
P2/FP32,1024x768,60-degree horizontal field of view and5-degree pitch. Both sides
use the same physical observation, camera and display; no exposure normalization.
Toronto means authenticated H63 per-channel aerosol phase/SSA with the same
extinction, amount and density profile. Its legacy control is a qualification
profile, not a deployed Toronto package.

| Profile   | Noon                                                                                               | Sunset                                                                                        | Sunset+60                                                                                            | Complete capture/lookup record                                                                   |
| --------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Canonical | [Pair](../../../../.codex-tmp/sky-accuracy-promotion/scenes-05/comparison-noon-toward.png)         | [Pair](../../../../.codex-tmp/sky-accuracy-promotion/scenes-05/comparison-sunset.png)         | [Pair](../../../../.codex-tmp/sky-accuracy-promotion/scenes-05/comparison-sunset-plus60.png)         | [Fourteen captures](../../../../.codex-tmp/sky-accuracy-promotion/scenes-report-01/result.json)  |
| Toronto   | [Pair](../../../../.codex-tmp/sky-accuracy-promotion/toronto-scenes-01/comparison-noon-toward.png) | [Pair](../../../../.codex-tmp/sky-accuracy-promotion/toronto-scenes-01/comparison-sunset.png) | [Pair](../../../../.codex-tmp/sky-accuracy-promotion/toronto-scenes-01/comparison-sunset-plus60.png) | [Fourteen captures](../../../../.codex-tmp/sky-accuracy-promotion/toronto-scenes-01/result.json) |

Left is the legacy production algorithm; right is the selected candidate. Toronto's
legacy noon capture exhibits cyan over-brightening; the candidate removes that
feature while preserving the darker horizon. Sunset/twilight remain bright and
warm under these fixed inputs. No independent whole-scene twilight authority or
appearance-based correction is claimed.

Actual packed lookup maxima are4.6702569484e-6 canonical and1.3590359838e-6 Toronto.
A former +30min comparison mixed binary64 CPU query inputs with their rounded
Float32 GPU uploads. Using identical serialized queries fixes the proof without
relaxing its tolerance. The earlier row-angle arithmetic alignment alone did not
explain that deviation. Failed records remain intact.

[Canonical lifecycle receipts](../../../../.codex-tmp/sky-accuracy-promotion/canonical-lifecycle-01/result.json)
and Toronto's report verify four complete lifecycle cases. Chrome155 correctly
rejects retained Chrome154 dual-atlas admission evidence. Supported single-atlas
operation holds a disjoint jump without changing visible state; darkness releases
all atlas bytes; context restoration preserves the selected scene and direction.
No old target evidence was relabeled. Larger allocations on Chrome155 remain
unqualified. This limitation applies to candidate and current rollback selection.

The [local isolation smoke](../../../../.codex-tmp/sky-accuracy-promotion/local-isolation-01/local-smoke.json)
retains `local-sun-compact-v9-native15-n1-v1`, local N1/distant N4 defaults,
analytic exponential source columns and the existing48-interval local cache
transport. Model/scene direction round trip agrees within1e-12 and WebGL reports
no error. The [rebuilt current route](../../../../.codex-tmp/sky-accuracy-promotion/built-route-02/result.json)
loads the unchanged deployed identity through the actual compiled app/server route.

## Package preparation and measured cost

The [handoff manifest](../../../../.codex-tmp/sky-accuracy-promotion/handoff-01/result.json)
authenticates every artifact of both current and candidate packages:204 artifacts,
109 scenes and90 blocks each. The candidate is
`8d185961cab8beb1e461cd1256be2875bb9a99e9f39e515b9288b92e5d2f6d37`, report3061 bytes,
SHA-256 `76fcb62e8e70eececbbb7213591534042a38b8b28cfd577fda529de95034f5f7`.
The immediate rollback is the preceding package
`9a30749c6d4e6c23d7a84839788c068133051fbbd9bd93d07de8b18a6ee432ec`,
Native48/Native15/N4, cubic/P2/FP32 and legacy lookup. It is not the older P9/linear
predecessor. Its retained rollback selection, report and package bytes remain unchanged.

[Prepared publication commands](../../../../.codex-tmp/sky-accuracy-promotion/handoff-01/commands.md),
[candidate selection](../../../../.codex-tmp/sky-accuracy-promotion/handoff-01/candidate-selection.js)
and [exact rollback selection](../../../../.codex-tmp/sky-accuracy-promotion/handoff-01/rollback-selection.js)
remain immutable preparation evidence; the owner-authorized local activation is
recorded above. Publication accepts explicit `--scattering-accuracy`;
the [actual CLI mismatch proof](../../../../.codex-tmp/sky-accuracy-promotion/publication-pairing-01/result.json)
rejects unlike package/lookup policies before copying. Owner-approved disk
acceptance now passes; the prepared historical materials retain their original
preapproval wording. The owner supplied local publication/activation authority on
2026-10-22; required production review remains outstanding.

| Resource                                                       | Canonical candidate | Toronto candidate | Toronto legacy control |
| -------------------------------------------------------------- | ------------------: | ----------------: | ---------------------: |
| Package bytes                                                  |           725426183 |         727455714 |              511160270 |
| Whole generation, including compression and109 reconstructions |             433.76s |           677.99s |                628.44s |
| GPU execution                                                  |             110.71s |           275.75s |                297.91s |
| Actual shared atlas bytes                                      |           429981696 |         429981696 |              429981696 |

The preceding default's package storage is506706259 bytes. The newly selected cache adds
43.17% on disk while preserving atlas dimensions. Generated storage, staging,
Node RSS, framebuffers and GPU atlas memory are separate quantities. These serial
builds did not control GPU clocks or host load, so timings do not isolate the cost
of changing interval count. Build complexity is reported, not a new scientific
rejection threshold. The owner approved the increased on-disk cache size on
2026-10-21. The production package ceiling is now750000000 bytes; the working-disk
ceiling is2297483648 bytes (prior2GiB plus the same150000000-byte package growth),
preserving staging/browser headroom. Node RSS, GPU memory and generation-time
limits are unchanged. Current retained canonical/Toronto run footprints are
2161826194 and2172848288 bytes, both within that working-disk allowance.
The new disk-acceptance record reauthenticates all204 artifacts and reuses all109
verified reconstructions per candidate, without GPU recomputation, publication or
rewriting the original failed runs. Those historical failures retain the old600MB
rule and are superseded only for disk acceptance. Toronto legacy control already
passed its original time, disk and host-memory gates.

[Measured frame timings](../../../../.codex-tmp/sky-accuracy-promotion/performance-01/frames.tsv)
use eight valid non-disjoint runtime-shader timer queries per12-frame canonical
measurement window on RTX2060/Chrome155/ANGLE D3D11. Means are41.03-43.22ms current
and42.25-46.00ms candidate; paired increments are0.70-3.03ms. CPU submission and
animation-frame wall time are not substituted for GPU duration. These observations
are not a universal frame-rate guarantee.

## Decisions, preservation and next action

Only transport60, exact discrete Mie normalization and outgoing k=.35 are selected.
Incoming F68, source transmittance20, N4, physical profiles and display remain under
their existing owners. The explicit Toronto adapter authenticates phase/SSA parents;
canonical emitted-shader witnesses remain byte-identical. No runtime experiment
imports were introduced. Protected experiment runs and deployed packages are intact.

Failed pilot01/02, paper-report01, scene01-05 and built-route01 records remain.
Completed computation was reused for reporting repairs. Canonical scene recovery
retains original browser bundles; separate lifecycle receipts repair its missing
reporting evidence without repeating the completed scenes. The final verification
also snapshots current qualification/recovery helpers for continuity.

Local checkpoints040442ed,cf4a191e and35a9d023 preserve the integration, spectral
qualification adapter and publication/provenance work. Git works through approved
execution; no ACL changes or remote push occurred. The initial production baseline
is `.codex-tmp/review-standards/session-UIqdMw/baseline.json`; topic-refresh evidence
is retained under `session-VNveUf`. Checkpoints do not certify adoption or compliance.

Readiness was rechecked after qualification and still reports
`Stale all-lane calibration; prepare again`. The
[review skill](C:/Users/gande/.codex/skills/review-standards/SKILL.md) states:
"Missing or stale recorded calibration blocks startup." No standards reviewer
started; the required bounded production review and independent audits remain open.
External governance definitions/calibration records were not silently repaired.

The original full-aerosol default activation is complete and is superseded by the
owner-selected zero-aerosol atmosphere linked above. Remaining governance work is to
restore reviewer readiness and execute the plan's required bounded production
review; it is not represented as complete by this activation. Reuse the completed
packages and qualification evidence. Rebuilding their GPU fields is unnecessary
unless source or physical inputs change.
No qualification-owned browser, server or GPU job remains active.
