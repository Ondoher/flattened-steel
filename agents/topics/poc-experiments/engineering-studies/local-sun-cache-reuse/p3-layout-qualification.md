# P3-C Fresh Layout And Omission Qualification

Status: numerical delivery is accepted. Implementation completion is derived
from the matching review receipt in the completion authority below; until it
is exit-0 CLEAN, P3-C remains open. Later selection belongs to the [current status](status.md#next-action).
This document owns the final P3-C result, saved evidence and limits.

## Fixed Model And Source Unit

The [P3 contract](p3-contract.md) and [abstraction inventory](abstraction-inventory.md)
retain the selected 1,049-node Euclidean shell topology, Native15/W27/N4,
incoming polar40/azimuth48, column48-tail64 build, column15 runtime,
geometric-density normalization, black physical ground, disabled ozone and
unchanged p2 display model. The [traced warm lower band](lower-band-source-trace.md)
is accepted as defensible under those assumptions. No color fitting or new
approximation-error research was performed.

Current captures apply the existing P2 compensated observer-dome endpoint
adapter to the contained candidate. It evaluates the same physical boundary
using two float parts; diagnostic directions and endpoint readback preserve
high/low components. This corrects an ordinary FP32 endpoint discrepancy
without changing geometry, field policy, integration counts or tolerances.
The adapter's present scope is the fixed fixture observer; other origins and
movement require their later phase checks. Production source is unchanged.

The coherent unit covers capture adaptation, complete field bookkeeping,
current topology/omission proof adapters, the bounded cumulative lookup probe,
the sealed result derivation and the explicit temporary resource exception.
Its pre-edit [baseline](../../../../../.codex-tmp/review-standards/session-N3K216/baseline.json)
preserves earlier dirty work. Unchanged runtime, geometry, phase, source,
precision, omission and run-boundary collaborators remain review inputs.

## Accepted Evidence And Images

The [sealed disposition](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00519-p3-layout-report/result.json)
and its [derivation](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00519-p3-layout-report/inputs.json)
authenticate every selected parent inventory and the exact contract, state,
layout and numerical settings. All five captures share one source closure.
The Flat90 holdout opened after development and omission checks, with the
pre-holdout selection/layout identity guard intact and no subsequent tuning.

| State   | Candidate image                                                                                   | Old-grid comparison                                                                                  | Capture / guarded parent | Build seconds               |
| ------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------- |
| Flat0   | [PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00507-p3-shell-v3a/candidate.png) | [Plate](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00507-p3-shell-v3a/comparison.png) | 00507 / 00506            | 35.58, expanded diagnostics |
| Flat45  | [PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00514-p3-shell-v3a/candidate.png) | [Plate](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00514-p3-shell-v3a/comparison.png) | 00514 / 00513            | 28.41                       |
| Flat90  | [PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00518-p3-shell-v3a/candidate.png) | [Plate](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00518-p3-shell-v3a/comparison.png) | 00518 / 00517            | 39.66, expanded diagnostics |
| Flat135 | [PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00512-p3-shell-v3a/candidate.png) | [Plate](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00512-p3-shell-v3a/comparison.png) | 00512 / 00511            | 27.79                       |
| Flat180 | [PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00516-p3-shell-v3a/candidate.png) | [Plate](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00516-p3-shell-v3a/comparison.png) | 00516 / 00515            | 36.81, expanded diagnostics |

These are the frozen Union Glacier December 14 fixture and successive
three-hour states, at 720 x 414/FOV70 with a five-metre observer. The sky-only
black lower half remains part of the fixture. Each old-grid/candidate pair
shares its control's measured adaptation; exposure is not fixed across states.
Plate order is old grid, candidate and 50x absolute byte difference. Old-grid
appearance is behavior comparison, not a physical accuracy target. No gallery
was authored; standalone PNGs are the visual deliverables.

## Correctness And Omission Results

- All five states retain complete J1-J4 and L1-L3 validity/hash inventories,
  96 complete view rays with all 15 spectral channels, finite nonnegative
  cumulative fields, Native15 GPU receiver packets, axis continuity and no
  excluded rays. Recomputed CPU/GPU radiance and transmission comparisons pass.
- Each primary state, Flat0/90/180, passes 68,824,890 scalar comparisons of
  cumulative J against the binary64 pure-order sum. The sum is accumulated as
  readbacks arrive; arrays are then released while hashes and counts remain.
- Each primary state passes 1,659,615 cumulative lookup channel comparisons:
  110,641 physical point/direction queries times Native15. The GPU probe derives
  a scalar-channel view of the actual lookup source, uploads one measured
  wavelength plane at a time and preserves every spatial/angular weight and
  reconstruction factor. It covers all occupied nodes, cell interiors, axis,
  shell seams and ground/top/cylinder edges with fixed sentinels; all 4,374 W27
  outgoing directions are checked at six representative points. This is not
  the full spatial-by-direction Cartesian GPU lookup product. Full readback
  validity, additive accounting and omission hashes cover every stored scalar.
- Maximum CPU/GPU endpoint difference is 3.73e-9 m in every state, passing
  the unchanged 0.01 m limit. This reports the compensated high/low endpoint;
  ordinary transport arithmetic remains FP32. View spectra pass independently.
- The [support proof](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00495-p3-stencil-proof/result.json)
  passes 21,424 queries, including node identity, off-grid support, curved
  cross-row edges and compact addressing. Maximum radius/altitude moment
  errors are 7.45e-9 m and 6.81e-13 m; node-weight error is 4.83e-12.
- The [omission proof](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00510-p3-omission/result.json)
  authenticates compact 00507 and equivalent unculled 00509 under identical
  equations, occupied topology and source closure. Every occupied J1-J4,
  L1-L3 and cumulative field is bit-identical. All 132 appended proof-only
  empty slots are zero. Six nonintersecting bands receive no compact storage
  or dispatch positions; conservative/tangent support remains admitted.

Peak logical field allocation is 825,898,680 bytes compact versus 929,824,920
bytes unculled: **103,926,240 bytes (99.1 MiB)** avoided. Actual submitted scalar
writes decrease by **72,028,440**. The unculled proof represents one empty slot
per omitted band/altitude row; these are bounded matched-control savings,
not a hypothetical historical-grid estimate or physical GPU-byte telemetry.
The unchanged phase payload is 33,592,320 bytes. Whole-layout cost and omission
benefit remain separate conclusions; the compact layout is larger than the
old 285-position grid.

## Resource Exception And Performance Limits

After four guarded captures reached the default machine reserve, the owner
replied "I'll make a short term exception" on 2026-10-09. The selected
interpretation is a temporary **6 GiB machine free-memory reserve for P3-C**.
Every current capture records this scope, authorization, exact threshold and
restoration rule in its guarded parent's inputs. The 8 GiB aggregate owned
ceiling, ten-minute limit, exclusive heavy-job ownership, script-only tooling
and fail-closed sampled telemetry remain active. No C# exception was granted.

Accepted current cadence runs reached 3.90-5.40 GiB peak owned private bytes
and 7.11-7.82 GiB minimum free memory. The unculled proof reached 5.61 GiB
private and 7.05 GiB free. These pass their actual 6 GiB exception reserve;
they are not relabeled as 8 GiB reserve passes. The launcher default remains
8 GiB. The exception is not selected for subsequent phases; omit its explicit
flag after P3-C. Run chronology and failed/incomplete attempts are preserved
in the [execution log](p3-execution.md#p3-c-execution--2026-10-09).

Ordinary Flat45/135 captures met the 30-second construction target. Expanded
primary diagnostics took 35.58-39.66 seconds and the unculled diagnostic took
44.21 seconds, exceeding that target. Their field accounting/readback costs
are retained, and no repeated timing benefit or overall performance pass is
claimed. Repeated construction, replacement, responsiveness and memory
qualification remain P4/P5 work. Browser profiles are removed before normal
capture finalization; interrupted historical evidence is preserved.

Inherited CPU receiver diagnostics construct a separate CPU cache and are
not a same-policy candidate acceptance oracle. Current GPU receiver packets
and view consistency are retained; complete app lighting/lifecycle and
fresh/reused receiver agreement remain later obligations. Quantified physical
approximation error, source movement/reuse, other observer origins, ozone and
ground changes, app integration and recording remain outside P3-C.

## Reproduction And Completion Authority

Use the existing JavaScript resource wrapper and capture runner with an
explicit frozen state. Primary states add the layout flag; the equivalent
unculled Flat0 additionally adds the unculled flag. The temporary exception
requires this explicit P3-C command form:

```text
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 --reserve-mib=6144 --p3-c-reserve-exception -- run-shell-capture.js --current-contract --state=flat-0 --qualify-layout
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 --reserve-mib=6144 --p3-c-reserve-exception -- run-shell-capture.js --current-contract --state=flat-0 --qualify-layout --unculled
node experiments/local-sun-cache-reuse/prove-shell-stencil.js 00478-p3-contract --current-contract
node experiments/local-sun-cache-reuse/prove-shell-omission.js --current-contract 00507-p3-shell-v3a 00509-p3-shell-v3a
node experiments/local-sun-cache-reuse/qualify-p3-layout.js 00507-p3-shell-v3a@00506-resource-bound 00514-p3-shell-v3a@00513-resource-bound 00518-p3-shell-v3a@00517-resource-bound 00512-p3-shell-v3a@00511-resource-bound 00516-p3-shell-v3a@00515-resource-bound 00495-p3-stencil-proof 00510-p3-omission
```

Numerical completion is the accepted sealed 00519 disposition. Implementation
completion additionally requires local type checking, formatting and matching
mapped primary reviews plus independent audits, validated by exit-0 CLEAN in
[this receipt](../../../../../.codex-tmp/review-standards/session-N3K216/validation.json).
This receipt-derived status avoids editing reviewed context after validation.
A missing or non-CLEAN receipt leaves P3-C open. No inherited physical accuracy,
movement, performance, production promotion or recording gate is passed by
this source review. Current selection and subsequent steps belong to the [status](status.md#next-action).
