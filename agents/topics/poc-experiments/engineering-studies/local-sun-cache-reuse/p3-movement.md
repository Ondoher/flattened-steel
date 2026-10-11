# P3-D Movement And Reuse

Numerical qualification is **accepted** in
[00538-p3-move-report](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00538-p3-move-report/result.json).
Implementation completion is derived from the matching exit-0 CLEAN
[primary/audit validation](../../../../../.codex-tmp/review-standards/session-P0m3QN/validation.json).
A missing, stale or non-CLEAN receipt keeps P3-D open. This record owns the
result, decisions and limitations. The later owner-selected P3-E through P5
unit is tracked by its [execution record](p4-p5-execution.md); recording remains
unselected.

## Selected Unit And Evidence

Owner selection: independent-execution P3-D, 2026-10-10. Baseline:
.codex-tmp/review-standards/session-P0m3QN/baseline.json, captured before changes.
Capture/qualification adapters, their declarations and the affected telemetry
monitor form one review unit with relevant unchanged construction, geometry,
transport, reconstruction, precision and run-boundary collaborators.

The unchanged [00478 contract](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00478-p3-contract/contract.json)
pins the 1,049-node compact layout, six omitted inner bands, Native15/W27/N4,
R32F, polar40/azimuth48 incoming quadrature, source-height/coverage and transport
policies. Every selected cell compares a newly built field with a retained
canonical field at the same physical frame. No old-grid result is an accuracy
oracle. No source, medium, ground, color, tolerance or recording policy was tuned.

| Capture             | Guard                | Recorded cases                                                  |
| ------------------- | -------------------- | --------------------------------------------------------------- |
| 00527-p3-shell-move | 00526-resource-bound | 0/17/45/90 degree rotations                                     |
| 00531-p3-shell-move | 00530-resource-bound | 0/135/180/271 degree rotations                                  |
| 00533-p3-shell-move | 00532-resource-bound | Canonical, [250,0], [0,-1000], [10000,10000] metre translations |
| 00535-p3-shell-move | 00534-resource-bound | Exact Flat0/45/90 fixtures                                      |
| 00537-p3-shell-move | 00536-resource-bound | Exact Flat0/135/180 fixtures                                    |

These are 14 distinct poses and 18 recorded rows including repeated canonical
controls. Orbital cases use the original Union Glacier December 14 fixture
observations, not the later December-solstice film. The qualifier authenticates
all selected parent inventories, recipes, exact observations, contract/layout,
complete browser/worker source closure and identical compiled browser bundles.
The host launcher gained orbital subset selection after the first group;
its grouping-only revision is recorded separately from the unchanged browser
bundle and numerical closure. All commands and source/tool identities remain
in the sealed inputs. Successful runs remove temporary Chrome profiles before
sealing; PNGs, traces, launch settings and useful reproduction inputs remain.

## Result And Reviewable Images

- All ten complete fields are byte-identical in every cell: pure J1-J4,
  L1-L3 and cumulative J-through-2/3/4. Complete validity passed. This hashes
  572,407,830 stored FP32 scalar values per pose. Zero field residual follows
  byte identity; a mismatch would reject without an invented error magnitude.
- Each pose checks 164,354 cumulative spatial queries over 4,442 points and
  37 directions, all 15 channels, including seams, boundaries and the axis.
  Direct-frame and inverse-transform comparisons and 2,100 axis-approach
  scalars pass. Pure-order off-grid comparisons are not repeated here;
  their complete stored-field identities are retained.
- All 96 view rays pass CPU/GPU, fresh/reused and co-transformed source/camera
  checks across Native15 radiance and transmission. All 32 fixed GPU receiver
  directions pass fresh/reused comparison across 480 spectral values.
- Every retained CPU integration point is independently checked against the
  pinned source-centered cylinder/slab. No ray is excluded or admitted by
  clamping. All 42 source sentinels pass distance, inverse-square and
  transmission invariants. Fresh GPU/CPU endpoint maximum is 3.73e-9 metres,
  inside the unchanged 0.01 metre gate; reused and co-transformed endpoints pass.
- All paired images have maximum and p95 RGB-byte difference zero. The largest
  co-transformed GPU spectral absolute difference is 5.96e-8, inside the
  frozen absolute-plus-relative reuse gate. These are consistency observations,
  not universal physical accuracy bounds.

Standalone V3c plates show fresh, reused and 50x absolute RGB difference:
[17 degrees](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00527-p3-shell-move/angle-17-comparison.png),
[10 km diagonal translation](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00533-p3-shell-move/angle-1002-comparison.png),
[exact Flat180](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00537-p3-shell-move/angle-2004-comparison.png).
The fresh receiver supplies the same adaptation for each pair. Frame state is
exact; film lighting interpolation is absent. Standalone fresh/reused PNGs
and spectral/geometry traces accompany every plate. No image gallery is added.

## Construction Identity And Admission Defense

[00529-p3-frame-policy](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00529-p3-frame-policy/result.json)
resolves the actual owners at all five orbital states and at observer offsets
[0,0] and [10000,-10000] metres. Their complete canonical policy and coverage
identities match. The policy includes actual source spectrum/configuration,
source-strength boundaries and held scales, layout, atmosphere, black ground,
execution/quadrature, transport, precision and units. Implementation identity
must accompany that numerical policy in a future construction key.

Under A1-A4, horizontal homogeneity and isotropic emission let field coordinates
use position relative to the source, with vertical coordinates unchanged.
The canonical cylinder has source-centered radius 33,378,000 metres and altitude
0-100,000 metres; source height is 4,828,032 metres. Its source-distance bounds
are h-H and sqrt(h*h+R*R), independent of observer placement. The matrix supplies
ordinary numerical covariance evidence in addition to this derivation.

This supports excluding compatible horizontal placement from **construction**
identity. Live source position, observer position, observer-centered dome and
query admission remain **runtime frame** inputs. No production key or API is
changed. Source-height, atmosphere, ground, emission or numerical-policy changes
require a compatible rebuild. Domain exits require replacement/rejection,
never silent clamping. Tested movement does not establish unrestricted use
with a nonuniform medium, terrain reflection or a different source model.

## Cost, Decisions And Deferred Work

All five final jobs meet the original 8 GiB machine reserve, 8 GiB owned-private/
working ceiling, exclusive-heavy-job rule and ten-minute cap. The temporary
P3-C 6 GiB exception was not used. Observed final-job durations are 5.99-7.68
minutes; peak private bytes are 6,973,878,272, peak working-set bytes
3,139,051,520 and minimum machine free bytes 11,797,061,632. These are wrapper
telemetry samples, not dedicated GPU-memory measurements. Instrumented fresh
builds take 29.98-35.56 seconds, including readbacks. Several exceed the
historical 30-second target. The [current owner timing disposition](plan.md#p5--qualify-defensibility-motion-and-benefit)
accepts this startup cost and prioritizes reuse; repeated timing and application
payload qualification remain P4/P5 work. No overall performance pass is inferred.

Questions and decisions during this execution:

1. ?P3-clean? meant P3-D, confirmed by the owner. Execute that phase only.
2. Reuse the existing rotation harness through an explicit pinned adapter;
   preserve numerical equations rather than create another solver.
3. Stream every field into validity/hash evidence, retaining cumulative arrays
   for actual lookup/ray comparisons. This reduces duplicate diagnostic memory.
4. Run a bounded two-pose pilot before the matrix. Preserve 00521/00522 as
   pilot evidence; the final matrix uses the later common numerical closure.
5. The first matrix attempt, 00523/00524, stopped on historical PID reuse.
   Retire only descendant identities already observed absent in a validated
   census. Pin wrapper/root identities, reject changed live identities and
   require current parent-chain ownership for newly admitted processes. The
   focused real telemetry proof 00525 passes. One post-repair retry passed;
   no memory threshold, deadline or unavailable-telemetry gate was relaxed.
6. Split the exact orbital matrix into two small jobs, each with its own
   canonical control, to stay inside the ten-minute ceiling. Authenticate
   unchanged bundles/numerical source separately from the host grouping revision.
7. Separate construction-policy symmetry from live frame geometry. Retain
   observer/source/dome identity and admission even when construction is reused.
8. Defer quantified interpolation/integration error bars and repeated performance
   to later selected work. Preserve black physical ground and disabled ozone;
   Sky Accuracy Dials remains informative only.
9. Checkpoint advice is NOT_READY for the complete worktree: unrelated pre-existing
   native-helper edits remain outside this task. No local checkpoint, push or
   compilation was performed. Review source completion is separate from Git advice.
10. P3-D execution stopped at its selected boundary. The owner subsequently
    selected P3-E through P5; the [current execution record](p4-p5-execution.md)
    owns that work. Production promotion and video remain unselected.

Local type checking, formatting and source review are required in addition to
accepted numerical evidence. The receipt above owns current primary/audit
validation; prose does not substitute for it. Failed/interrupted runs and all
historical evidence remain immutable. The [execution log](p3-execution.md)
retains chronology. No further heavy capture is needed for this frozen matrix.
