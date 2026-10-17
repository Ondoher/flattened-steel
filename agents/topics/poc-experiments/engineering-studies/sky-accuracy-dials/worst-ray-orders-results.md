# H58: Largest B1 Disagreements With libRadtran

Completed the [selected-ray plan](worst-ray-orders-plan.md). All1377 B1 time/ray
cells were ranked by corrected-cache spectral RMSE against the retained
libRadtran table. The two missing rays now have fresh independent GPU and local
libRadtran references through orders1-4 and all orders; the matching third ray
was reused exactly. Production and earlier evidence remain unchanged.

**The largest retained-reference discrepancies are much larger than the cache's
errors against the fresh matched solvers.** Fresh libRadtran and the independent
solver agree in brightness within their empirical intervals at all15 selected
ray/order targets. The underlying cache discrepancy is already visible at N1;
excess later scattering partly offsets it. This does not identify which retained-
reference setup difference causes the larger gap, or rank a newly solved full sky.

## Images And Data

Final accepted run00368 owns:

- [Cumulative order swatches](../../../../../tmp/experiments/sky-accuracy-dials/runs/00368-h58-order-report/swatches.png)
- [Order-by-order spectra and sampling intervals](../../../../../tmp/experiments/sky-accuracy-dials/runs/00368-h58-order-report/spectra.png)
- [Signed pure-order cache errors](../../../../../tmp/experiments/sky-accuracy-dials/runs/00368-h58-order-report/order-errors.png)
- [Retained versus fresh reference swatches](../../../../../tmp/experiments/sky-accuracy-dials/runs/00368-h58-order-report/reference-swatches.png)
- [Spectra and signed residuals versus retained libRadtran](../../../../../tmp/experiments/sky-accuracy-dials/runs/00368-h58-order-report/reference-residuals.png)
- [Full1377-cell ranking](../../../../../tmp/experiments/sky-accuracy-dials/runs/00368-h58-order-report/ranking.json)
- [Retained-reference comparison table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00368-h58-order-report/retained-lib-comparison.tsv)
- [Cache versus matched order references](../../../../../tmp/experiments/sky-accuracy-dials/runs/00368-h58-order-report/cache-to-reference.tsv)
- [Physical order contributions](../../../../../tmp/experiments/sky-accuracy-dials/runs/00368-h58-order-report/pure-orders.tsv)

All images use all40 solved spectral channels and the same CIE midpoint/p2
mapping with common source illumination. No per-method gain,white balance or
exposure fit is applied. These bright near-Sun swatches approach white under
that mapping; physical Y and signed spectral residuals reveal differences that
are difficult to see in RGB. T40/T60 denote transport intervals,not channel counts.

## Locked Selection

| Rank | Paper time | Ray | Grid x,y | Elevation | Sun separation | Baseline RMSE | Corrected RMSE |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| 1 |09:30|67|4,7|33.7490deg|7.3689deg|23.4340|23.8232 |
| 2 |09:45|67|4,7|33.7490deg|10.4878deg|19.0682|19.4820 |
| 3 |11:00|57|3,6|53.3665deg|4.1932deg|17.1626|18.0013 |

RMSE is mW m^-2 sr^-1 nm^-1 over the same31 scored channels360-712.5nm,
against the retained libRadtran total. These are the literal top three cells,
including adjacent times at one direction. Selection preceded fresh reference
calculation. Absolute spectral RMSE favors these bright near-Sun cases; this
selection does not claim the horizon's relative error is smaller everywhere.

The retained table is authenticated against SHA-256
`4e11e9ebc6c8cf2eb85e608d86a750b827a17d13582f4b89f035b71824b204f4`.
Every spectral cell was recomputed from saved cache values and that reference;
the original H56 measurement SSE ledger was checked separately. This selection
is different from largest measured-paper RMSE and from H57's largest score change.
The full paper scores and their no-regression gate are unchanged.

## Retained Reference Versus Matched Solvers

| Brightness Y,cd/m2 | Worst ray | Second ray | Third ray |
| --- | ---: | ---: | ---: |
| Retained libRadtran total |18677.5|16284.3|15135.0 |
| Baseline cache throughN4 |16851.7|14811.5|13803.5 |
| Corrected cache throughN4 |16828.6|14787.1|13750.9 |
| Independent all orders |17029.7+/-61.1|14923.5+/-66.3|13874.7+/-69.9 |
| Fresh matched libRadtran all orders |17107.8+/-112.0|14918.3+/-83.9|13721.7+/-441.5 |

Fresh throughN4 libRadtran Y is17113.0+/-182.6,14919.6+/-141.5,
13725.6+/-407.6. Independent throughN4 is17019.0+/-61.2,14913.0+/-66.2,
13868.3+/-69.9. All15 independent/external brightness intervals overlap.
The agreement is not a pointwise spectral-convergence claim.

The pinned [retained generator wrapper](../../../../../references/downloads/bruneton-clear-sky-models-4df2ec6609bc-full/clear-sky-models-4df2ec6609bc0127a478bd34fff29c94352579cc/atmosphere/model/libradtran/libradtran.cc)
contains pseudo-spherical transport,100 molecular layers,20 aerosol moments,
and quarter-degree view-azimuth rounding. Its moment loop samples positive
scattering cosines only. The fresh reference uses fully spherical MYSTIC,
layer setting128 (191 combined optical shells),96 analytic Cornette-Shanks
moments and exact ray angles. Layer construction and aerosol coefficient
sampling differ too. These are concrete source/setup leads. This campaign did
not isolate their individual effects or regenerate the legacy configuration;
it does not establish which one causes the retained-reference gap.

## Where The Cache Deviates

| Corrected cache versus independent throughN4 | Worst ray | Second ray | Third ray |
| --- | ---: | ---: | ---: |
| Brightness error | -1.119% | -0.844% | -0.847% |
| Same-order spectral RMSE,mW |3.0965|2.2647|1.8032 |

Dense binary64 N1 Y is16155.8,13990.1,13328.6; saved cache N1 Y is15893.7,
13860.8,13148.1. N1 is unchanged by the corrections and has deficits of1.62%,
0.92%,1.35% against those direct integrals. The GPU N1 sampling estimates have
separate empirical intervals retained in the plots and controls.

At the worst ray,the independent pure N1/N2/N3/N4 contributions are16132.0,
732.9,123.9,30.2cd/m2. The corrected cache contributes15893.7,740.0,151.5,43.4.
Its missing N1 light is partly concealed by excess later light. The same pattern
appears at the other two rays. Corrections reduce most later excesses while
leaving N1 fixed,removing some compensation and slightly worsening cumulative
agreement. A later-order excess may inherit an earlier incoming-field error;
this decomposition does not uniquely blame an isolated later-order formula.

The independently estimated beyondN4 brightness is10.65,10.52,6.39cd/m2,
or0.0625%,0.0706%,0.0461% of throughN4. That small tail cannot explain the
large retained-reference gap. Cumulative reconstruction remainders are retained
separately; the pure-order figure uses actual saved physical-order fields.

## Precision And Limits

Independent reference: all15 Y and all15 per-band targets pass. Maximum95% Y
half-width is0.505%; maximum per-band half-width is0.539%. Its binary64 N1
controls and paired64/128 quadrature remain separate from sampling precision.

libRadtran:9/15 Y targets pass the3% target;0/15 rows pass the10% worst-band
criterion. Maximum Y half-width is5.143%; maximum per-band half-width is42.516%.
The fresh first two all-order Y estimates are tighter than1%,but that does not
certify every spectral band. Plots show these intervals; no extra photon sweep
was added merely to turn every target into a pass. Near-Sun per-band component
claims rely on the tighter independent/dense references,with libRadtran serving
as the broader external check.

All intervals are empirical95% sampling intervals,excluding discretization and
systematic error. Independent Float32 geometry,1m reflection offset,and the
limited parent layer refinement remain explicit approximations. These three
screened rays establish neither a fresh global maximum nor a full-cache accuracy
win,and do not waive the paper RMSE promotion gate.

## Execution And Decisions

1. The owner first clarified absolute RMSE,then refined the target to libRadtran.
   No solver run executed before the final libRadtran selection was locked.
2. Rank against retained full-B1 coverage,then compare fresh matched references.
   Keep that screening target distinct from a newly solved full-sky oracle.
3. Reuse the exactly matching third-ray GPU batches from00355 and external
   readings from00361. Exact byte-equivalent values and physical packet/source/
   wavelength/grass compatibility were checked.00361's admission still discloses
   original00360's post-compute monitoring defect; no historical state was relabeled.
4. Compute only two missing rays:24x8192 independent histories per band plus
   paired64/128 quadrature; four20000-photon external seeds per prefix,40bands,
   layer setting128 and two concurrent CPU cases. Surface reflection counts as
   an interaction. All orders is distinct from throughN4.
5. Preserve common display mapping and add signed residuals instead of fitting
   swatch exposure. Never invent retained per-order spectra.
6. Failed00364 preserves a sandbox-blocked browser spawn. Approved launch access
   allowed unchanged inputs in accepted00366. No numerical failure was concealed.
7. An interim CLI invocation treated the selection flag as an optional external
   path and aborted before allocation.00367 used an explicit absent argument;
   the optional-argument parser was subsequently repaired without changing any
   physical calculation or reducer. Final00368's full-reference invocation is unchanged.
8. Raise only retained-disk allowance592to624MiB after measuring604,303,609bytes
   of prior evidence. The bounded package ultimately retains622,438,853bytes;
   scratch is zero and free disk112.35GB. Scratch/system/GPU limits are unchanged.
9. Continue this bounded campaign while monitored positive progress is made.
   No unrequested full-sky solve,cache build,legacy-wrapper reproduction or
   follow-on causal campaign was added.
10. Report unmet external precision honestly. Preserve raw seeds,tool inputs,
    manifests,all40 wavelengths,order/tail identities and comparison provenance.

GPU00366 took370.00seconds overall,with231.24seconds in browser phases including
compilation,execution and readback. External00365 took2649.93seconds(44.17minutes)
including staging,40 new tool invocations and cleanup,while reusing20 cases.
Interim00367 took32.73seconds; final00368 took33.96seconds. These are measured
phase wall times,not model reasoning time or isolated solver/kernel timings.

## Verification And Handoff

Accepted00365,00366,00367,00368 and the preserved failed00364 all pass ordinary
immutable-run verification. Source and input identities pass; reused third-ray
GPU/external values match their parents exactly. The five final images were
inspected (the final order-error PNG is byte-identical to its inspected interim).
Source types,formatting,numerical/order identities and owned-resource cleanup
pass. All solver/browser clients exited and scratch is empty.

Dedicated experiment reviewers/audits remain disabled by owner policy. No
standards-compliance claim is made. The checkpoint adviser accepts this completed unit and supplied the preauthorized
message `Diagnose worst B1 cache disagreements against libRadtran`. Its judgment
is separate from scientific qualification; the final handoff reports the Git identity. No push,promotion
or additional numerical campaign is selected. The experiment remains open.

## Reproduction

Each command allocates a new immutable run; substitute returned parent paths:

```text
node experiments/sky-accuracy-dials/paper-rays/independent.mjs full --worst-lib
node experiments/sky-accuracy-dials/paper-rays/external.mjs full --worst-lib
node experiments/sky-accuracy-dials/paper-rays/report.mjs report <gpu-run> <external-run> --worst-lib
node node_modules/typescript/bin/tsc -p experiments/sky-accuracy-dials/jsconfig.json
```
