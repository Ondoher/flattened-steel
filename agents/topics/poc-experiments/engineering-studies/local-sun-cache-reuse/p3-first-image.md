# P3-B First Fresh Shell Image

The owner selected P3-B on 2026-10-09. This delivery owns its first fresh Flat0
construction, V3a image, allocation/work observations and completion authority.
P3-C onward remains unselected. Production and historical evidence are unchanged.

## Direct Images And Reproduction

- [Comparison PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00482-p3-shell-v3a/comparison.png):
  left fresh old grid, middle fresh shell candidate, right 50 times absolute
  RGB-byte difference. Both use the same frozen placement, camera and
  control-derived adaptation; receivers are freshly measured at the exact state.
- [Candidate PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00482-p3-shell-v3a/candidate.png)
  and [control PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00482-p3-shell-v3a/control.png).
- [Construction observations](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00482-p3-shell-v3a/construction.json),
  [complete result](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00482-p3-shell-v3a/result.json),
  [inputs and derivation](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00482-p3-shell-v3a/inputs.json),
  [recipe](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00482-p3-shell-v3a/recipe.json)
  and [browser/tool identity](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00482-p3-shell-v3a/browser.json).

Reproduction allocates new immutable runs:

```text
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- run-shell-capture.js --current-contract
```

The current mode permits only frozen Flat0 or Flat180 state selection; it accepts
no numerical-policy overrides. The default remains Flat0. It authenticates
the complete sealed 00478 parent inventory and pins the exact contract, gates
and layout hashes owned by [P3-A](p3-contract.md#frozen-contract). It preserves
the selected 1,049-node v9 mesh, N4/Native15/R32F, W27, polar40/midpoint-azimuth48,
column48-tail64 construction and column15 runtime. Source/medium policies remain
unchanged. Black physical ground and disabled ozone remain explicit limits.
Legacy capture modes and their reference probes remain available under their
original policies; this mode does not execute deferred primary-convergence
studies or use their thresholds as current gates. It creates no image-gallery
HTML artifact, and removes its owned browser profile before sealing.

## Construction And Ordinary Correctness

| Observation                               | Fresh selected candidate                                                                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Physical shell bands                      | 61 total, 55 admitted, six omitted (IDs 0–5)                                                                                                  |
| Allocated scattering nodes                | 1,049 occupied; zero nodes in omitted bands                                                                                                   |
| Angular domains                           | 1,920 incoming, 4,374 outgoing                                                                                                                |
| Fresh build, including phase preparation  | 25,713.1 ms; below the retained 30,000 ms build limit in this sample                                                                          |
| Peak live backend field bytes             | 825,898,680                                                                                                                                   |
| Host phase payload                        | 33,592,320 bytes; separately identified 1,920 × 4,374 matrix                                                                                  |
| Submitted backend layers                  | 165, including 15 receiver layers; 150 cache-construction layers                                                                              |
| Logical scalar-output invocations         | 572,407,845 including 15 receiver scalars; 572,407,830 cache scalars                                                                          |
| Complete retained pure/transported fields | J1–J4 and L1–L3; all read back across every Native15 channel                                                                                  |
| Invalid field scalars                     | Zero nonfinite values and zero negative values in those seven fields; cumulative field has zero nonfinite or out-of-allowance negative values |
| CPU/GPU view radiance                     | 1,440 channel comparisons, zero failures; maximum tolerance ratio 0.0049003                                                                   |
| Source-axis continuity                    | 2,100 comparisons, zero failures                                                                                                              |
| Checked ray coverage                      | All 96 candidate rays admitted, zero excluded                                                                                                 |
| WebGL errors                              | None                                                                                                                                          |

Allocations come from actual backend allocation calls; submissions come from
actual submitted layer calls. Scalar counts are width × height per submitted
layer, not hardware instruction or performance counters. All candidate field
heights are 1,049, so no omitted-band scattering slots are allocated or
submitted. This does not quantify savings against an equivalent unculled build;
that separate omission comparison remains P3-C. Logical field/phase bytes do not
measure physical device memory or establish the complete application payload.

The old control has 285 positions and builds in 2,303.0 ms. Its measured CPU/GPU
view comparison also passes, but it excludes nine horizon-sentinel rays and fails
791 axis-continuity comparisons. Those observations are retained explicitly;
old-grid agreement is not an acceptance oracle. The shell sky is visibly darker
with a different horizon response; maximum old/new display difference is 123
RGB-byte values. Both construction and runtime numerical policies differ between
these behavior controls, so the pixels cannot isolate a shell-layout effect or
establish either model's physical accuracy. Exact receiver spectra are retained
separately. No new numerical policy was tuned from this image or Flat90 results.

CPU/GPU view agreement uses the same constructed candidate field and checks
implementation consistency. It does not validate every construction equation,
transmittance/endpoint channel or approximation error independently. Broad
field/ray/omission checks, five-state cadence, reuse and repeated application
resource qualification remain later steps under the [plan](plan.md).

## Bounded Execution And Source Completion

The [JavaScript wrapper result](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00481-resource-bound/result.json)
records exit 0, no telemetry failure, peak owned private bytes 6,645,047,296,
peak summed working sets 4,381,466,624 and minimum free bytes 8,975,409,152.
The workload completed within its ten-minute limit and the fixed 8 GiB owned
limit/free-memory reserve. This includes transient browser/build/readback work;
it is sampled host-process evidence, not a GPU memory measurement. No compiled
helper was built or run. Both new runs are sealed accepted first-build records;
that disposition does not accept all P3-C/P5 qualification claims.

The coherent review unit covers current capture selection/provenance, browser
allocation/work/field observations and ambient contracts, plus unchanged
run/boundary/admission, omission and phase-worker collaborators. Its
[baseline](../../../../../.codex-tmp/review-standards/session-laYxAk/baseline.json)
predates P3-B edits. Pre-existing diagnostic and P3-A work is preserved.
Local experiment type checking passes. P3-B completion requires this unit's
[validation receipt](../../../../../.codex-tmp/review-standards/session-laYxAk/validation.json)
to be exit-0 `CLEAN` with matching primary and independent audit ledgers.
Until that gate validates, deliverables are recorded and implementation completion
remains open. No later phase or recording is selected by this delivery.

## Owner-Requested Flat180 View

The owner additionally selected the same sky-only scene at Flat180. This uses
Union Glacier's frozen orbital state at `2024-12-15T05:27:41.487Z`, twelve hours
after Flat0. Camera, viewport, physical source/medium parameters, black ground,
color model and selected cache policies remain unchanged. Each control/candidate
pair uses its freshly measured control adaptation, as in the Flat0 procedure;
exposure is not pinned across the two orbital states. No horizon-color correction
or broader P3-C qualification was selected.

- [Flat180 candidate PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00484-p3-shell-v3a/candidate.png).
- [Flat180 comparison PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00484-p3-shell-v3a/comparison.png):
  old grid, shell candidate and amplified difference in the same panel order.
- [Complete observations](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00484-p3-shell-v3a/result.json),
  [construction/work facts](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00484-p3-shell-v3a/construction.json)
  and [derivation](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00484-p3-shell-v3a/inputs.json).
- [Bounded JavaScript execution](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00483-resource-bound/result.json).

```text
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- run-shell-capture.js --current-contract --state=flat-180
```

The narrow source change permits that explicit frozen state while retaining
rejection of numerical overrides and all other current-mode state requests.
The previous Flat0 evidence stays immutable. The supplemental source unit's
[baseline](../../../../../.codex-tmp/review-standards/session-AiWW1g/baseline.json)
predates its edits; its completion requires a matching exit-0 `CLEAN`
[review receipt](../../../../../.codex-tmp/review-standards/session-AiWW1g/validation.json).
This receipt reviews the state-selection extension and unchanged capture/run
collaborators; it does not relabel the prior Flat0 source-review evidence or
accept a five-state, omission-equivalence or reuse qualification claim.
