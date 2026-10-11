# P3-A Construction And Correctness Contract

The owner selected P3-A closeout on 2026-10-09. This document owns its pinned
contract and completion authority. P3-B onward and the video were not selected.

## Frozen Contract

- [Authored contract](../../../../../experiments/local-sun-cache-reuse/p3-contract.json).
- [Sealed contract](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00478-p3-contract/contract.json),
  SHA-256 `186b8be60929276c1208dbd72d2c648a3782cd4346c59f4a0c74efcc9826a704`.
- [Current gates](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00478-p3-contract/gates.json),
  SHA-256 `c5794fb707b7da7c87713e19ebaf77ae7e3816d6cc72e929958e12a4aa33210d`.
- [Exact selected layout](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00478-p3-contract/layout.json)
  and [derivation/provenance](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00478-p3-contract/provenance.json).

This preserves selection 00281 and layout 00217: source height 4,828,032 m,
100,000 m slab, 33,378,000 m source-centered cylinder, v9 layout with 1,049 compact
nodes, Euclidean-radius interpolation and geometric-density normalization.
Native15, W27, partitioned polar40/azimuth48, N4, R32F, 2,048 source-amplitude
bands, column48-tail64 build and column15 runtime remain unchanged.
The source reference distance/radius/spectrum remain the frozen controls;
height is not the calibration distance. Ground is physically black and ozone
absorption stays disabled. Mathematical defense is owned by the
[inventory](abstraction-inventory.md), under the
[current evidence policy](reference-method.md#current-depth-of-numerical-defense).

For h>H, bands with outer radius strictly below h-H are omitted from allocation
and construction. Tangencies/support are retained. Radius excess is evaluated
stably; row-axis and outer-cylinder nodes support compact cross-row stencils.
Outgoing angular dependence remains. Vacuum propagation and required boundary
segments are preserved, even where no scattering sample is allocated.

Pure J1–J4, transported L1–L3 and cumulative Jthrough4 retain separate meanings.
Recurrence consumes its preceding pure order; view/receiver consumers use the
cumulative field. Horizontal transforms must rotate directional frames and move
the source-centered domain coherently. Height or physical-property changes
rebuild; unsupported queries reject or request replacement rather than clamp.
No additional independent Sun-angle axis is introduced.

## Current Checks And Deferred Studies

The new gate identity retains quantity units, absolute/CPU-GPU/reuse tolerances,
all-channel comparisons, finite/nonnegative requirements, complete-ray admission,
temporal residuals, display consistency and logical/performance resource limits.
Omission must compare identical occupied nodes/equations and report actual
allocation/work savings. Field and application consistency are not independently
measured physical accuracy. Five-state images and exact-state lighting remain
later deliverables; Flat90's frozen holdout/mutation rule remains intact.

The old global-reference convergence policy, physical error thresholds and
spatial/angular/path/order accuracy-estimation studies are explicitly retained
under `deferredAccuracy`. They are neither current gates nor passed results.
Mathematical rationale and ordinary correctness suffice for the new numerical
policies. Historical flags and sealed evidence stay unchanged.

Later scoring must record this contract/gate identity. Existing runners that
hard-code old gate/reference parents require scoped adaptation and review before
claiming a current result; merely reading old results does not adopt this policy.

## Baseline And Readiness Proofs

The coherent source unit covers contract authoring/freezing and the replacement
resource monitor, plus their unchanged boundary/run/stencil/type collaborators.
Its [baseline](../../../../../.codex-tmp/review-standards/session-KIyAKe/baseline.json)
was captured before implementation. Pre-existing C# diagnostic, proof and ambient
declaration edits are retained; they are not new execution authority.

- [Contract bookkeeping proof](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00478-p3-contract/result.json):
  61 bands, six omitted, 1,049 nodes, 220 admitted probes, node-weight error below
  1e-10, normalized-weight error below 1e-12 and all four unsupported queries rejected.
  This is topology/contract evidence, not an error-bar experiment.
- [Script telemetry proof](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00477-script-telemetry/result.json):
  wrapper/child/exit accounting, overlapping and unknown-root rejection, retirement
  rejection and zero compiled programs.
- [Wrapper integration](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00479-resource-bound/result.json)
  and [its tiny child proof](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00480-script-telemetry/result.json):
  exit 0, no monitor failure, peak private bytes 250,773,504, peak summed working sets
  258,322,432 and minimum free bytes 12,444,114,944. The wrapper's one-minute proof
  did not build a cache or render anything.

JavaScript now queries existing PowerShell/CIM process counters. There is no
generated helper executable, compilation, installation or language exception.
The fixed query reads OS facts; JavaScript owns validation, descendant/birth
identity tracking, sums, deadlines and cleanup. Missing counters, query failure,
PID reuse and invalid ownership fail closed. Previously observed descendants
remain owned when ancestors exit. The existing wrapper keeps its exclusive job
lock, 8 GiB owned limit/free-memory reserve and ten-second query deadline.
Host process-query access is required; a denied query stops before heavy work.
This is sampled telemetry, not an atomic kernel census, allocation cap or GPU
memory measurement. Other native scientific launchers remain unauthorized.

Local experiment type checking passes. Review startup has current calibration,
normalization, folder mappings, generated guide and formatting diagnostics.
The scoped source review supplies refreshed work context; old diagnostic review
receipts are not relabeled as current readiness or completion evidence.

## Completion Authority

P3-A deliverables and local proofs are recorded above. Its phase completion is
conditional on the current source review's
[validation receipt](../../../../../.codex-tmp/review-standards/session-KIyAKe/validation.json)
being exit-0 `CLEAN` for the matching request, with actual primary and independent
audits. If that receipt is missing, stale or nonclean, the implementation-completion
gate remains open. This link is the authority, rather than an anticipated review
result in this document. P3-B becomes the next selectable phase after that gate:
adapt the selected capture runner to the new contract and promptly deliver the
fresh Flat0 comparison image. No subsequent execution is authorized by P3-A closeout.
