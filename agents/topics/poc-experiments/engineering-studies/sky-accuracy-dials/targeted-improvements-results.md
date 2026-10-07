# Targeted GPU First Pass: Results

## Decision

Correct query density, query phase and sunlight-column reconstruction together.
Then use source-sample count as a precomputation accuracy control. Do not choose
phase-only correction or source count by the original Kider score: those choices
can reward compensating errors.

The combined S160 candidate reduced first-order numerical RMS by **99.47%** on
the selected complete rays. It nevertheless **worsened aggregate Kider proxy
RMSE by 3.90%** with the original higher-order light held fixed. This first pass
therefore supports a correctness implementation direction, but does not establish
an overall Bruneton RMSE improvement or qualify production promotion.

The [fixed plan](targeted-improvements-plan.md) is consumed. Stop here; its
result does not authorize another reference or parameter campaign.

## Evidence And Scope

Accepted run: **00224-targeted-gpu**. Its immutable
[seal](../../../../../tmp/experiments/sky-accuracy-dials/runs/00224-targeted-gpu/sealed.json)
has SHA-256 `0ef9d71d0f250fbde0ed95d0bcfeeb4420661a462b15a13a8bee3c457ea5eec9`.
Acceptance means the registered corrected-versus-raw numerical group screens
passed; it does not mean Kider improved.

One NVIDIA RTX 2060 hardware job evaluated 13 representations, two source
counts, two view levels, 40 retained rays and four channels. All new source
and ray integrations ran on the GPU. CPU work prepared geometry and scored
results; no independent reference integration or higher-order field was rerun.
The 160 scalars cover five times and deliberately difficult probes, not the
full 17-time Kider boundary or the full Bruneton qualification set.

Parents are the original C0 geometry, 00103 GPU build request, 00110 assessment
and measurement rows, independently cross-checked 00109 physical P1 references,
and 00188/00189 source-column witnesses. Exact inputs, tools, shader source and
derivation identities are retained by the seal. All **160 raw-control witnesses**
and **32 source-column witnesses** pass their frozen diagnostic guards.

The following tables are rounded summaries of the sealed `groups.json` and
`assessment.json.gz`. Scores use spectral mW units. Numerical RMS is
`1000 * sqrt(mean((candidate P1 - independent P1)^2))`. Proxy RMSE replaces
only P1 in the retained GPU result. No measurement or physical coefficient was
fitted. Individual rows, all groups, signed factorial vectors and pairwise
inner products remain in the assessment artifact.

## Which Changes Help

| Representation                       | Source count | P1 numerical RMS | Kider proxy RMSE | Interpretation                                                                     |
| ------------------------------------ | -----------: | ---------------: | ---------------: | ---------------------------------------------------------------------------------- |
| Original combined control            |           80 |            9.010 |           30.858 | Substantial known error improves its apparent fit through cancellation.            |
| Query phase only                     |           80 |            9.456 |           30.488 | Better proxy with worse numerical error: reject as a score-driven selection.       |
| Query density only                   |           80 |            1.154 |           32.634 | Removes the largest positive error; exposes negative transmission error.           |
| Query density and phase              |           80 |            0.685 |           32.207 | Phase now reduces the exposed numerical error and improves the density-only proxy. |
| Corrected columns only               |           80 |           11.315 |           31.143 | Removing a negative error exposes more of the uncorrected positive density error.  |
| Density, phase and corrected columns |           80 |            0.139 |           32.079 | Joint correction reduces the opposing first-order errors.                          |
| Density, phase and corrected columns |          160 |            0.048 |           32.061 | Further movement toward the reference, with a small aggregate proxy improvement.   |

At S160 the complete correction improves absolute P1 error on all 160 scalars,
at both view levels, relative to the original S80 control. At S80 it improves
159/160 at level 16 and 160/160 at level 8; aggregate and every time group
pass the registered numerical-reduction screen. This is not a universal
pointwise guarantee.

### Time Dependence Must Remain Visible

| Time  | Original S80 proxy | Corrected S160 proxy | Direction |
| ----- | -----------------: | -------------------: | --------- |
| 09:30 |             29.025 |               28.025 | Improves  |
| 10:15 |             18.888 |               13.566 | Improves  |
| 11:15 |             24.314 |               25.961 | Worsens   |
| 12:30 |             48.451 |               52.056 | Worsens   |
| 13:30 |             24.966 |               28.042 | Worsens   |

Every time group has a large reduction in P1 numerical error. The different
proxy directions come from how the removed error aligns with the remaining
discrepancy. They do not justify time-dependent blends or offsets.

## What Was Cancelling

There are two distinct balances.

1. **Within P1:** coarse reconstruction creates a large positive density error.
   Underestimated sunlight transmission creates a negative error. Correcting
   either one alone changes how much of the other remains visible. Phase
   interpolation and operation order add smaller, structured interactions.
2. **Against the remaining result:** the original P1 error also partly offsets
   the fixed higher-order/model/observation discrepancy. Removing that error
   can worsen Kider even when the P1 calculation becomes more accurate.

For the second balance, let `n = candidate P1 - reference P1` and
`r = retained higher light + reference P1 - measurement`. Then
`SSE = ||n||² + 2 n·r + ||r||²`. Values below are spectral W squared:

| Term                                                       | Original S80 | Corrected S160 |       Change |
| ---------------------------------------------------------- | -----------: | -------------: | -----------: |
| Sum of known P1 error squared                              |  0.012989188 |    0.000000361 | -0.012988827 |
| Sum of remaining discrepancy squared                       |  0.164354106 |    0.164354106 |            0 |
| Signed cross term, twice the error/remainder inner product | -0.024985852 |   +0.000115380 | +0.025101231 |

The loss of beneficial cancellation is larger than the removed P1 error
squares. The remainder mixes higher-order numerical error, model mismatch and
observation discrepancy; this test does not identify its separate causes.

### Joint Terms Matter

At S80 the factorial's density correction has a signed mean effect of
**-7.410 mW**; the column correction alone has **+1.816 mW**. Their additional
interaction is **-1.400 mW**, with **2.000 mW RMS**. That interaction is large
relative to the column main effect's 2.531 mW RMS. Additive recommendations
based only on individual corrections would be misleading.

The phase main effect is +0.241 mW in signed mean, with a -0.030 mW
density-by-phase interaction. Column-by-phase and triple interactions are
smaller but retained. Signs describe these measured vectors, not universal
behavior at every wavelength or direction.

### Moving Transmission Is A Separate Operation

Moving the original transmission outside the original product reconstruction
changes radiance by **1.894 mW RMS**. Switching that separated transmission to
corrected columns adds **0.654 mW RMS**. Calling the whole change a column
accuracy improvement would conflate two operations.

With query density and phase already corrected, moving the original
transmission changes radiance by only about **0.000005 mW RMS**. Correcting the
columns then changes it by **0.547 mW RMS**, toward the reference. This control
isolates the useful column correction from the interpolation/product grouping
effect. Split-versus-combined original controls also agree within the much
larger directional guard.

## Source Count Becomes A Useful Dial After Correction

Increasing S80 to S160 raises the computed P1 radiance. In the original
representation it makes numerical error worse on 158/160 scalars at both view
levels. After the three corrections it makes numerical error smaller on
160/160 scalars at both levels.

The corrected aggregate proxy improves by **0.0176 mW RMSE** at either view
level, above the plan's 0.01 useful-change floor. Four time groups improve;
10:15 worsens by about 0.035 mW. The first-order error direction improves in
every time group. The source-count change is representation-dependent:
its RMS radiance effect is 0.140 mW on the raw split field and 0.092 mW on the
corrected field; the source-by-representation interaction is 0.048 mW RMS.

This is strong directional evidence, not a precise new convergence estimate.
The observed P1 RMS decrease, 0.139 to 0.048 mW, is smaller than the sum of
the conservative view-level diagnostic RMS guards, approximately 0.217 mW.
It therefore does not establish a guard-resolved absolute refinement gain
under that test. Both view levels, every scalar's direction and the retained
S320 component evidence support the direction. No finer ladder was run.

## Accuracy And Implementation Cost

| Knob             | Correctness direction                                                                                                             | Runtime consequence and remaining qualification                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Query density    | Evaluate the physical exponential at the sample, outside cache interpolation.                                                     | Fixed arithmetic per sample; requires a representation that separates the known density.                                                                    |
| Query phase      | Evaluate the physical phase for the ray/Sun angle.                                                                                | Fixed arithmetic; may be hoisted outside the ray march for a collimated Sun. First-order outgoing-direction interpolation can then be avoided.              |
| Sunlight columns | Cache separate species columns normalized by local density, with the finite-top tail adjustment; undo the transform at the query. | Fixed solar/altitude lookups and exponentials, no source-path loop inside the sample. Exact production layout and lookup cost remain unmeasured.            |
| Source count     | Increase after the representation corrections.                                                                                    | More precomputation work, no extra per-sample source integration or inherent cache-size increase. A complete solver must regenerate affected higher orders. |
| View samples     | More outer ray samples reduce the observed view discretization effect.                                                            | Total ray work scales with samples. Keep every sample helper loop-free; this pass only compared levels 8 and 16.                                            |

The measured passes took approximately **6 ms for columns and 9 ms for rays**,
including synchronization/readback, on the RTX 2060. The retained job debit is
67.9 seconds, including evidence preparation and authentication. This is a
small diagnostic batch with CPU-prepared stencils, not a production shader
benchmark. It does not measure runtime geometry/stencil selection, complete
cache generation, browser startup as GPU work, or per-candidate production cost.

The authored ray shader has one outer march loop and no loops in the sample
helper closure. The packed diagnostic needs 1,063 shared source anchors and
46,080 prepared samples, evaluating 4,792,320 variant samples. A promoted
implementation must also keep geometry and lookup selection loop-free.

For each species with scale height `H`, cache
`Z(h, mu) = C(h, mu) * exp(h/H) + (H/mu) * exp((h-hTop)/H)`.
At the query, reconstruct `Z` and recover
`C = Z * exp(-h/H) - (H/mu) * exp(-hTop/H)` before applying
`T = exp(-(betaR * CR + betaM * CM))`. The tail adjustment conditions the
interpolated quantity; it does not add an actual infinite atmosphere.
These tests cover outward, sunlit source paths. Grazing, occulted and twilight
branches need separate qualification before general runtime use.

## Closeout

Only one new evidence record was created, retaining 4,948,862 bytes. All
historical evidence is preserved; owned browser scratch was removed and
verified absent. The full experiment type check and six focused manufactured
checks pass. Formal standards review remains deferred by the owner; these
results do not close that source-review gate. The
[status](status.md) owns current resource totals and checkpoint-adviser state.

The next implementation decision is whether to carry the jointly corrected
P1 representation into a separately scoped full-solver comparison with
corrected higher-order behavior. The available evidence does not justify
retaining a known P1 bias to recover the old score. No further execution is
included in this first pass.
