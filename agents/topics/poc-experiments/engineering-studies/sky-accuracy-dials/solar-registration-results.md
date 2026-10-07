# Solar Registration: Findings

## Decision

The retained-data analysis isolates limitations in the measurement-derived
solar direction. Sparse sampling and interpolation can bias the fitted axis,
and different sky regions disagree near noon. The tested increase in fitting
quadrature barely changes that axis. A clock-only hypothesis does not explain
the observed offsets better on withheld times than a constant azimuth offset.

Neither a physical alignment correction nor a timing correction is qualified.
Keep the original comparison geometry and the owner's
[hold on adopting the numerical corrections](status.md#owner-decision-preserve-conclusions-defer-adoption).
This analysis measures reflection-symmetry loss, not Kider radiance RMSE. It
does not establish how much registration contributes to the remaining RMSE.

## Evidence And Scope

Accepted [00228-solar-register](../../../../../tmp/experiments/sky-accuracy-dials/runs/00228-solar-register/sealed.json)
executes the consumed [fixed plan](solar-registration-plan.md). Its seal SHA-256 is
`494d17ecf89840773902d0fdd0d4aeff4cfcbad2217046bc081a8d1f30cb7c2c`.
It passes 247 manufactured checks and replays all 17 original fitted azimuths
within the registered 1e-9-degree allowance. It retains 612 subset fits and 102
cross-channel transfers in
[assessment.json.gz](../../../../../tmp/experiments/sky-accuracy-dials/runs/00228-solar-register/assessment.json.gz).
The complete experiment type check and immutable-run verification pass.

The analysis reuses all 17 captures, their 81 directions and 40 channels from
accepted 00000-inputs. Measurement SHA-256 is
`a751d56dc0d8deb87958cbc9e811204a38f2b86101c732109c3503dfcfedad74`;
control SHA-256 is
`dc09ac84462a00d62ae5a1d73f8fff0183fcb82106a31a260e70d17ad749f9b6`.
The run records original grids, parent seals, implementation/tool identities
and exact source changes relative to the authenticated 00226 source snapshot.
That base snapshot remains necessary to reconstruct the source; its failed
GPU execution contributes no numerical evidence to this analysis.

One CPU analysis took 60.384 seconds and retained 558,446 bytes. No GPU attempt,
new atmospheric integration or applied geometry change occurred. Owned scratch
is absent. [Status](status.md#current-resource-accounting) owns campaign totals
and the deferred formal-review boundary. No further run is active.

## Factors Isolated

| Factor                                    | Observed response                                                                   | Interpretation                                                                                                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fitting quadrature, 16 by 64 to 32 by 128 | Thirteen original fits unchanged; four move by 0.2 degrees                          | This tested quadrature refinement cannot explain the original 7-17.2-degree theoretical-to-fitted difference. It does not refine the underlying 81 measurements.       |
| Spectral selection                        | Maximum spread across four channel-specific full-sky fits is 4.0 degrees            | Wavelength agreement is often stronger than regional agreement, but all channels share sampling and interpolation. It does not independently validate geometry.        |
| Disjoint native sky rings                 | Inner/outer integrated axes differ by 6.6 degrees at 12:15 and 9.6 degrees at 12:30 | A single inferred axis is sensitive to which measured sky region supplies it. The 12:30 inner fit reaches the search edge, so its unconstrained optimum is unresolved. |
| Lower/higher sky quadrature               | Integrated axes differ by 16.4 degrees at 12:15 and 18.4 degrees at 12:30           | Strong regional inconsistency; these two subsets share bicubic interpolation inputs and are not independent raw-data validation.                                       |
| Known-axis broad synthetic field, g=0.6   | All 17 full-sky fits recover the known axis to the 0.2-degree search resolution     | The method can recover a sufficiently broad symmetric field on this grid.                                                                                              |
| Known-axis sharp synthetic field, g=0.9   | Fitted error ranges from -6.4 to +8.6 degrees despite correct input alignment       | Sparse representation alone can produce substantial registration bias. The varying signs do not reproduce the entire one-signed measured offset.                       |

The analytic control is the positive manufactured field
`I(v)=1+2*(1-v_z)+(1-g*g)/(1+g*g-2*g*dot(v,s))^(3/2)` sampled on the exact
native directions, with the known theoretical Sun vector `s`. It is not an
atmospheric solution or an estimate of the measured aerosol parameter.
The sharp control produces negative interpolated samples at 11 of 17 times
despite positive native values, demonstrating cubic overshoot. The real
integrated grid has one negative interpolated sample at 09:30 and none at the
other 16 times. These observations do not identify how much of the actual
fitted-axis bias is caused specifically by negative overshoot.

Regional fits also fail to transfer cleanly. At 12:15, choosing the native
outer-ring axis reduces that region's normalized symmetry loss from 0.04292
to 0.03615, while increasing the disjoint inner-ring loss from 0.01094 to
0.07932. Thus selecting the better outer-region fit would sacrifice another
region's agreement. A lower fitting loss alone cannot establish correctness.

Across the 51 transfers from each selected channel to the other three,
channel 0 improves symmetry loss relative to the original integrated axis in
6 cases, worsens it in 36 and ties in 9; channel 8 gives 9 improvements,
24 regressions and 18 ties. Neither channel supplies a uniformly better axis.
These counts concern symmetry loss, not radiance error against Kider.

The integrated full-sky near-minimum width grows from 2.8 degrees at 09:30 to
11 degrees at 12:30 and 12 degrees at 12:45. Width means the span within an
absolute 0.01 normalized-loss increment of the minimum; it is not a confidence
interval. Eleven measured-data subset fits hit the finite search boundary.
Broad or truncated minima must not be reported as precisely identified angles.

## Alignment And Timing Hypotheses

Fit nine alternating capture times and evaluate the other eight. The target
is the original measurement-derived azimuth, not an independently observed Sun.
The [hypothesis artifact](../../../../../tmp/experiments/sky-accuracy-dials/runs/00228-solar-register/hypotheses.json)
retains every prediction and the zenith change implied by each clock shift.

| Descriptive model       | Clock shift, minutes | Azimuth zero, degrees | Training RMS, degrees | Withheld-time RMS, degrees |
| ----------------------- | -------------------: | --------------------: | --------------------: | -------------------------: |
| Constant azimuth zero   |                    0 |                -12.22 |                  3.21 |                       2.77 |
| Clock only              |                  -29 |                     0 |                  2.39 |                       3.11 |
| Clock plus azimuth zero |                  -18 |                 -5.09 |                  1.08 |                       1.72 |

Clock-only fits training times better but withheld times worse than a constant
zero offset. The combined model describes the trend better with an extra
parameter; that is not evidence of a real -18-minute clock error or a
-5.09-degree orientation correction. Shared estimator bias can survive this
time split. Constant azimuth zero also does not cover arbitrary instrument tilt.

The clock-only hypothesis changes solar zenith by as much as +5.33 degrees;
the combined hypothesis by +3.30 degrees. An azimuth-only adjustment would not
implement either timing hypothesis consistently. None of these changes was
applied to the solver or measurement boundary.

## What This Means For Removing Balancing Inaccuracies

The previous [numerical and order accounting](remaining-factors-results.md)
still establishes which component corrections remove known error. This new
analysis identifies another possible source of mismatch: the inferred solar
axis depends on sky representation and regional structure. Tuning scattering
or restoring numerical bias against an uncertain axis could compensate for
that registration error without solving its cause.

The next useful evidence is an independently anchored solar direction or
acquisition orientation/timing record for the same captures, preferably from
the dataset's existing HDR images or calibration metadata. Existing local
measurement tables and fitted scene controls do not provide that independent
anchor. Check source availability and capture correspondence before any new
atmospheric calculation. A prospective estimator change should first recover
known directions across both broad and sharp controls, then transfer across
disjoint measured regions; a proxy improvement alone is insufficient.

This package closes at attribution of estimator limitations. It does not
authorize another sweep, qualify replacement geometry, alter the loop-free
per-sample runtime constraint or establish a Bruneton RMSE gain.
