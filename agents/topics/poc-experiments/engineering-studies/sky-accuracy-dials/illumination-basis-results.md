# H105-H112: illumination-basis integration results

The selected investigation is complete with a numerical success and an
exploratory, cost-limited physical lead. Positive basis weights can reproduce
the existing H100 illumination model accurately. A new curved-sector model
fails the near-Sun component gate. A fixed midpoint of the two models passes
both exposed Toronto gain checks, but has neither full protected-panel nor
practical native-builder qualification. Production is unchanged; the experiment
remains open.

[Final accepted00594 replay](../../../../../tmp/experiments/sky-accuracy-dials/runs/00594-h112-basis-proof/summary.json)
checks 12 local physical comparisons, 32 manufactured cases, 40 limiting
configurations, 9 phase-moment primitives, immutable evidence and local types.
The [execution record](illumination-basis-execution.md) owns all decisions,
recovery, timings and resumption; the [plan](illumination-basis-plan.md) retains
the original gates. H109 broad/fresh, H110 native recurrence and H111 full B1/
scenes were not earned. No new illumination or physical-reference histories
were generated; all eight reserved physical tuples remain unexposed.

## What was established

### Integration and illumination representation are separate

H100's interpolation was expressed as explicit nonnegative nodal coefficients,
including its sector restrictions, clamped endpoints and unsupported-row fallback.
Nodal reproduction, partition of unity and direct-evaluator parity passed.
The same incoming L values and original Rayleigh contribution were retained.

The initial hardware-GPU quadrature agrees closely with binary64 at the same
quadrature points, yet its sideways Toronto mass remains349ppm high and its
last weight change is.00244, outside the1ppm/.0005 admission gates. Thus matching
floating-point implementations does not establish adequate angular integration.

The diagnosed repair integrates Toronto's actual phase-table zeroth/first
azimuth moments between knots and turning points. It also splits polar
tangencies at `m=v0*mu +/- sqrt(1-v0^2)*sqrt(1-mu^2)`. Omitting the latter leaves
a4.25ppm mass defect even at polar order64. With those splits, the sideways
mass closes at machine precision and both successive weight changes pass.
The9 independent primitive comparisons agree within1.13e-12 relative error.
Same-model output differences plus empirical reference envelopes meet0.1% of
reference/floor for all four calibration witnesses. No global mass rescaling
or negative-weight clipping was used.

The corrected engine is a small binary64 CPU calibration. The tested GPU rule
remains unqualified; this is not a qualified hardware-GPU cache builder.
Manufactured smooth-field reconstruction bias is recorded separately from its
continuous phase-moment target, rather than mislabeled integration error.

### A different positive representation changes the physical answer

The bounded new model uses normalized curved-sector coordinates between rings,
with the same4096 retained nodes, positive support and physical boundaries.
Its phase weights pass numerical admission and independent direct same-model
checks across the two witnesses, both profiles and three bands (12fields).
All comparisons use the authenticated cache-free physical J2 histories; this
was not a new libRadtran observer-radiance comparison or a new full-paper score.

Signed total-J2 errors relative to those physical references:

| Exposed field | A original | H100 model | Sector model | Fixed midpoint |
| --- | ---: | ---: | ---: | ---: |
| Paper near-Sun red | +0.4372% | +0.1806% | +0.2906% | +0.2356% |
| Toronto near-Sun red | -4.8724% | -0.7960% | -3.2856% | -2.0408% |
| Paper sideways green | +0.1945% | -2.6889% | -0.6784% | -1.6837% |
| Toronto sideways green | +3.9345% | -2.0165% | +2.5086% | +0.2461% |

These are exposed local fields, not interval or whole-cache RMSE. Near-Sun red
is band8 (626.3333nm); sideways green is band5 (532.3333nm). Floors and spectral/
material/transport identities are unchanged from registration.

Opposing sideways residuals supported one preregistered bounded follow-on:
`bMix=.5*bH100+.5*bSector`. We averaged actual K weights before numerator and
denominator reduction, with a universal coefficient.5 and no parameter search,
new nodes or outgoing-dependent tuning. Positivity, partition and nodal
reproduction follow by convexity. The follow-on covers only the four decisive
fields above; it is not a complete12/36field protected screen.

[Accepted00593 paired decisions](../../../../../tmp/experiments/sky-accuracy-dials/runs/00593-h108-bound-proof/gains.json)
retain2000 shared-history resamples and the10%-of-active-bound numerical rule.
A single targeted same-model oracle refinement resolves the near-Sun decisions
without changing light, physical histories, weights or bootstrap quantiles:

- The sector model fails the50% near-Sun raw-Mie-defect reduction, while passing
  the20% sideways total-J gain.
- The fixed midpoint passes both exploratory Toronto gain checks. Its near-Sun
  raw-Mie numerical/path envelope is0.01587% of the reference scale, below10% of
  its active one-sided decision-bound distance.
- Protection is not silently promoted: the midpoint's Toronto maximum protected
  margin remains precision-limited under the conservative retained envelope;
  complete panel and prospective qualification are absent. Mean/worst tradeoffs
  against the complete Sun4096 controls are also not jointly qualified.

The midpoint is therefore a useful compromise to retain, not a demonstrated
globally better interpolation. Its paper sideways error is worse than A despite
the strong Toronto improvement. No new atmospheric composition or exposure was
fitted. Component residuals remain visible: at the Toronto sideways witness,
fixed Rayleigh contributes+0.3707% and midpoint Mie-0.1246%, giving+0.2461% total.
Improved total agreement still does not establish that every component is exact.

### Practicality remains a separate unresolved requirement

H107 measures72 resident GPU point-rule R/M/D blocks with three100-draw timing
trials each, spanning both profiles, three bands, low/high Sun and0/1200m
altitude. Measured per-outgoing work is.0011875-.157ms across those blocks.
These are microkernels, not measured full native cache builds.

The accurate CPU moment prototype costs2069ms for two near-Sun fields and
10948ms for two sideways fields at their admitted orders. Comparing those CPU
times directly with GPU timings does not establish an intrinsic method slowdown.
The initial GPU pilot is dominated by streamed geometry preparation, browser
dispatch and readback, and also fails Toronto precision. Neither implementation
demonstrates the plan's combined accuracy/time route. Full native transport,
ground support, scheduling, storage/recomputation and performance are unqualified.

The8640row/4374outgoing/40band scaling and22.5TiB dense all-band tensor estimate
were retained as dimensional checks; that tensor was never allocated. Shared
phase identity can reduce repeated work across bands, but global scattering
orders still require either retaining K or recomputing it. No free cross-order
cache or native timing is assumed. Runtime rendering remains unchanged and no
live phase integration was introduced.

## Reviewable evidence

- [Reused starting map, clearly annotated](../../../../../tmp/experiments/sky-accuracy-dials/runs/00583-h105-basis-reg/starting-evidence.svg)
- [Initial GPU/binary64 parity and convergence](../../../../../tmp/experiments/sky-accuracy-dials/runs/00585-h106-basis-pilot/basis-parity.png)
- [Phase-knot moment repair](../../../../../tmp/experiments/sky-accuracy-dials/runs/00587-h106-knot-repair/moment-repair.png)
- [Measured work comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00588-h107-basis-cost/cost-comparison.png)
- [Twelve-field sector/component comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00590-h108-sector-wave/sector-comparison.png)
- [Four-field fixed-midpoint comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00591-h108-basis-gates/basis-midpoint.png)
- [Manufactured and limiting proofs](../../../../../tmp/experiments/sky-accuracy-dials/runs/00592-h112-basis-mfg/summary.json)

Images are numerical diagnostics, not three-band sky colors. The midpoint image
retains00591's conservative pre-refinement envelope labels; its radiance values
are unchanged.00593 owns the tighter near-Sun uncertainty and final decisions.
Figures were inspected for readable labels and complete comparison columns.
No full-spectrum dome or scene is represented as completed; those were conditional.

## Completion boundary

H105 registration, H106 numerical calibration/manufactured checks, H107 cost
assessment, H108 bounded representation/midpoint diagnosis and H112 final replay
are complete. The investigation answers what was testable on this route: basis
integration can be correct while representations give different physical errors;
a fixed positive mixture helps selected witnesses without establishing a practical
full-cache replacement. No further refinement of an isolated bound can alone
earn advancement past the missing practical and full-panel gates.

H109 broad/repeated/fresh qualification, H110 global recurrence/native cost,
H111 paper RMSE/domes (17 intervals, 40 wavelengths) and 15-band matched scenes remain
untriggered. A future continuation needs a measured practical basis/weight route
and joint protection before exposing reserved cases or claiming N4/B1 gains.
Retain the fixed midpoint as an exposed lead; do not optimize its coefficient
on these witnesses or relabel them fresh.

All13 allocations00582-00594 are preserved, including four failures.00582 has
an explicit post-constructor failure receipt with a disclosed heartbeat gap;
the final replay authenticates its exact inventory/hashes/cleanup separately
and never treats it as accepted numerical or original-snapshot evidence.
The other failures and successful payload reuse are documented in the execution
record. Final retained evidence is1145.47MiB under1152MiB, with scratch0 and
about108GiB free disk. No retention amendment or deletion was needed.

First allocation to final proof spans40m43s, including implementation/analysis
gaps and recovery, with some overlapping CPU verification. It is not pure GPU
compute or a native-cache benchmark. Local types and focused immutable proofs
passed; no experimental unit-test tree, standards reviewer or independent audit
was introduced, and no standards-compliance claim is made. Checkpoint advice
remains separate. The experiment stays open with no numerical job remaining.
