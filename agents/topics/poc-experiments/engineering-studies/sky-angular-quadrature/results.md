# Sky Angular Quadrature Results

The planned Q0-Q4 numerical work is complete. **Reject this angular correction as a standalone full-cache change:** isolated integration improves, but aggregate paper RMSE worsens by 1.395%. No production source or cache asset was changed.

## Full Paper Result

| Model                                               | Aggregate RMSE (mW m^-2 sr^-1 nm^-1) |
| --------------------------------------------------- | -----------------------------------: |
| Matched F68 baseline                                |                      11.622914028289 |
| Qualified horizon2048 candidate                     |                      11.785034900924 |
| Frozen retained Native51 control                    |                      11.622914028289 |
| Published Bruneton/Elek boundary reproduced locally |                      11.283238587982 |
| Published libRadtran boundary reproduced locally    |                      11.480546935686 |

Lower is better. The candidate fails both the no-regression gate and the selected Bruneton target. It improves the first three paper times and worsens the remaining14. This is the original complete17times x81directions x31scored wavelengths, with all 40 point wavelengths transported and retained. The paper atmosphere, grass, Native51 positions, Z180, W27, source20/transport40 and Q30 reconstruction remain fixed. Only incoming vectors and positive solid-angle weights change.

The reference is the original paper measurement boundary. libRadtran's published measurement score is context; it is not a matched N4 radiance oracle. No physical parameter was tuned to recover the score.

## Which Calculation Improved

A phase-normalized rule can still miss a narrow grazing incident field. The original three positive uniform product rules all failed the declared screen. At2,048 directions the Mie phase integral was essentially exact, while the worst manufactured grazing-field error was10.3006% and the worst tested continuous P2 source error3.62594%.

A prospectively registered receiver-local horizon-concentrated family qualified its2,048-direction member: worst Mie phase-mass error 0.08091%, manufactured-field error 0.007927%, physical P2 source error 0.04904%, and reference refinement 0.03451%. Its1,024- and1,536-direction members failed the phase-mass gate. All misses remain in immutable runs.

The sampled4,608-direction propagation refinement changed cumulative results by at most 0.002530% at 548nm, on one paper state plus nine horizon/control rays. That is a useful sensitivity check, not full spectral N4 error certification. Every captured J1 field was byte-identical between matched baseline and candidate, at all 40 wavelengths; the intervention begins at J2.

## Where The Score Changes Balance

The exact cellwise identity is `deltaSSE = 2 * residual * delta + delta^2`. Over 42,687 scored scalars, 15,803 improve and 26,884 worsen. Improving cells contribute -0.1962928731 and worsening cells +0.3582864997 in summed squared radiance-density units; their net +0.1619936265 reproduces the score change.

| Separately integrated pure-order change             | RMS (mW m^-2 sr^-1 nm^-1) | Signed mean |
| --------------------------------------------------- | ------------------------: | ----------: |
| J1                                                  |                         0 |           0 |
| J2                                                  |                  0.457489 |   -0.146968 |
| J3                                                  |                  0.571142 |   -0.269985 |
| J4                                                  |                  0.397270 |   -0.211082 |
| Difference from cumulative nonlinear reconstruction |                  0.000271 |    0.000003 |

These are response magnitudes, not independent estimates of each order's absolute error. J3 has the largest RMS response; later scattering is materially involved. The small last row shows that nonlinear regrouping contributes little to this particular intervention's final change.

The largest ray improvement is 09:30, grid (4,8); the largest deterioration is 11:00, grid (3,6). A strongly deteriorating edge ray also occurs at 13:30, grid (0,4). The interaction depends on direction and time. Better component integration removes a contribution that helped match the measurement reference in many cells, while improving others. This does not yet identify which remaining calculation or physical-input mismatch supplies the opposing residual.

The table is derived from `spatial.csv.gz`: RMS is `sqrt(mean(delta_order^2))` over the scored cells; signed means use the same cells. The source spectra, exact deltas and reconstruction remainder are retained, so those summaries do not replace their data.

## Horizon Witnesses

At 0.05 degrees, Sun-facing physical luminance changes 7100.9 to 4744.8 cd/m^2 (-33.2%), cross-Sun 4094.7 to 3887.6(-5.1%), and away-Sun 3578.3 to 3641.5(+1.8%). The correction does not produce a uniform horizon brightening.

These are spherical paper/grass, Sun-zenith 14 degrees, observer 5m witnesses. H33's app source-aligned/Native15/black-ground setup is a distinct component witness. These results neither certify the current app horizon nor justify changing local-Sun rendering. Full-color previews use one fixed exposure, Direct40 point-sample trapezoids on 360-818.25 nm, D65 and sRGB encoding. Partial spectra were shown only as scalar plots.

## Reviewable Evidence

- [Final matched horizon swatches](../../../../../tmp/experiments/sky-angular-quadrature/runs/00012-q3-q4-report/horizon.svg).
- [Spatial improvement/deterioration map](../../../../../tmp/experiments/sky-angular-quadrature/runs/00012-q3-q4-report/spatial.svg).
- [Per-time paper scores](../../../../../tmp/experiments/sky-angular-quadrature/runs/00012-q3-q4-report/scores.svg).
- [Exact score report](../../../../../tmp/experiments/sky-angular-quadrature/runs/00012-q3-q4-report/paper-scores.json).
- [Cancellation and refinement data](../../../../../tmp/experiments/sky-angular-quadrature/runs/00012-q3-q4-report/cancellation.json).
- [Lossless spatial/order table](../../../../../tmp/experiments/sky-angular-quadrature/runs/00012-q3-q4-report/spatial.csv.gz).
- [Qualified source-only comparison](../../../../../tmp/experiments/sky-angular-quadrature/runs/00003-q1-screen/comparison.svg).

## Execution And Verification

All 13 runs have verified immutable terminal seals; scratch is empty. Recorded runner time totals 1560.385seconds(26.01minutes), including registrations, numerical captures, repair verification and analysis. This is runner telemetry, not total model/authoring/review time. The initial Q0/Q1/pilot work took about106seconds; subsequent allocated work stayed below its30-minute numerical cap. Full baseline and candidate captures took 448.508seconds and 954.154seconds, and the independent finer pilot 42.133seconds.

On the RTX 2060, measured logical live recurrence-field peaks were 157.94MiB for F68 and 296.61MiB for horizon2048. These exclude driver/browser allocations and are not final cache sizes. Final position/solar/outgoing/spectral dimensions and the actual sampled reconstruction code remain unchanged. No complete production cache package was persisted or production lookup performance certified; the full benchmark uses streamed fields and compact spectra.

The original baseline CLI post-seal verifier exited on a generic 16MiB reader limit after successfully publishing a 26.08MiB accepted terminal manifest. `00008-q2-base-verify` verified the original seal, all 90 artifacts, progress, source integrity, cleanup and original storage allowance with no numerical rerun or relabelling. Future manifests reference one shared definition artifact. `00010-q2-space-amend` prospectively raised retained storage from 64 to 96 MiB to preserve that immutable evidence and finish analysis; the numerical cap and scratch allowance did not change. Final retained evidence is70,500,782bytes(67.23MiB).

The local type check, all 13 seal/inventory checks and storage/cleanup checks pass. Required mapped source-review primary/audit evidence is owned by `.codex-tmp/review-standards/session-ad9QEx/validation.json`; that receipt determines implementation-completion review state. Review covers this experiment's authored unit, with unchanged numerical/compiler collaborators inspected as context, not a production promotion.

## Disposition And Follow-Up

Retain the rule, spectra and maps as diagnostic evidence. Do not adopt this standalone correction into the full cache. A useful next isolated question is why transported higher-order contributions move already-negative paper residuals further negative: compare L1/L2/L3 transport and source reconstruction on the strongly improving and worsening rays against an independent matched reference before selecting a second factor. Keep the paper atmosphere fixed; do not tune aerosols to recover aggregate agreement.

The complete [execution decision record](execution-decisions.md) owns questions, choices and reasons. Review outcomes, checkpoint identifiers and final operational state are recorded in the local execution summary. Sky Accuracy Dials stays suspended; this experiment remains active with its planned execution complete, ready for owner review rather than automatically closed.
