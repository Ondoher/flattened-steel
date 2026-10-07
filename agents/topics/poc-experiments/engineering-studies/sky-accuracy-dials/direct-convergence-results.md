# Direct Idealization: Stochastic Convergence Results

## Conclusion

**Reference-model context:** the subsequent
[matched retained-data comparison](reference-model-target.md) shows that
Bruneton and libRadtran share much of the large local Kider disagreement.
The following numerical findings stand, but these selected residuals alone
do not establish failure relative to the paper's benchmark standard.

The cache-free calculation now includes all scattering orders in expectation.
It preserves the important Kider disagreements. At 454 nm, the noon near-Sun
ray B remains **47.35% too dim**, while the same-elevation ray C remains
**11.44% too bright**. Increasing numerical resolution alone does not bring
this fixed physical formulation and its current inputs into agreement with
both measurements.

This resolves the missing-order question at useful diagnostic precision.
It does not establish an exact solution: **15 of 20 values meet the preset
sampling-precision target**; five have slightly wider intervals. The remaining
measurement differences are much larger than the reported sampling intervals.
No physical parameters were fitted and no numerical inaccuracies were chosen
to compensate for a residual. The implementation-adoption hold remains.

## Evidence and method

Accepted run: `tmp/experiments/sky-accuracy-dials/runs/00230-direct-converge`.
Seal SHA-256:
`f7e9dca4f8efe52f4cb236124e8b7149c903ff877a7f061d42be62e5cd402acb`.
The [fixed plan](direct-convergence-plan.md) is consumed; no retry is active.

The new [stochastic source](../../../../../experiments/sky-accuracy-dials/continuation/direct-solver/monte-carlo.mjs)
evaluates the [idealized equations](idealized-model.md) without radiance or
attenuation caches. Null-collision sampling integrates free flight; exact
phase-function rejection sampling integrates incoming directions. Ground
reflection is coupled into the same path. Compensated random termination
includes arbitrarily late interactions in expectation. The safety limits
failed no paths; the largest observed interaction count was 31.

All 4,480 batches completed: **36,700,160 paths** across the fixed matrix.
The independent reference uses 1,048,576 paths per scalar ray/wavelength.
The other profiles test solar attenuation and random termination, using
paired initial random states. Inputs are copied unchanged from 00229; its
`previous` values and Kider measurements are comparison data only.

The sealed recipe records parent identities, tool hashes, source snapshots,
shader bytes, physical parameters, seeds, counts and derivation operations.
`results.json.gz` owns means, uncertainties, contrasts and acceptance flags;
the four `*-batches.json.gz` artifacts own the underlying batch means.
Numbers below multiply spectral watts by 1,000. Residual is model minus Kider;
percentage residual divides that difference by Kider. No rescaling is fitted.

## Five rays at 454 nm

Units: spectral mW m^-2 sr^-1 nm^-1. Intervals are approximate marginal 95%
sampling intervals, not uncertainties in the atmosphere or measurements.
Ray names and geometry are defined in [diagnostic rays](diagnostic-rays.md).

| Ray                    | Direct reference |   Kider | Residual | Relative residual |
| ---------------------- | ---------------: | ------: | -------: | ----------------: |
| A: morning near Sun    |  214.270 ± 0.577 | 185.531 |  +28.739 |           +15.49% |
| B: noon closest to Sun |  210.979 ± 0.891 | 400.727 | -189.747 |           -47.35% |
| C: noon, B's elevation |  154.903 ± 0.653 | 139.004 |  +15.898 |           +11.44% |
| D: noon low elevation  |  119.603 ± 0.219 | 144.043 |  -24.439 |           -16.97% |
| E: noon zenith         |   95.801 ± 0.340 |  99.535 |   -3.734 |            -3.75% |

All five meet the preset tolerance at this wavelength. The modeled B/C
brightness ratio is **1.362**, versus **2.883** in the measurements. A common
brightness multiplier cannot fix that directional contrast. This identifies
a remaining shape mismatch; it does not identify which physical-input or
observation assumption causes it.

## What was previously being balanced

1. **Missing higher orders dim the sky.** At 454 nm, interactions three and
   later add 7.307, 3.788, 3.753, 14.865 and 3.516 mW to A-E respectively.
   Omitting them hides part of the excess in A/C while worsening deficits
   elsewhere. They are now evaluated, rather than supplied by frozen fields.
2. **The sign can change with scattering depth.** At D/360 nm, the previous
   two-interaction value was 6.686 mW below Kider. The full stochastic estimate
   is 20.546 ± 0.156 mW above it; orders three and later contribute
   27.203 mW. The earlier deficit was not a stable model conclusion.
3. **Coarse angular quadrature still matters in the old direct calculation.**
   At B/454 nm its finest completed second order was 10.371 mW, compared with
   10.798 ± 0.104 mW here. At D/454 nm the comparison is 29.468 versus
   30.225 ± 0.099 mW. Those old profiles were not fully converged.
4. **The large B/C disagreement survives those corrections.** The completed
   higher-order contribution at B is much smaller than its remaining deficit.
   Further order extension cannot supply a missing 190 mW: this estimator
   already includes those orders in expectation. Conversely, suppressing
   correct positive light to improve A/C would restore a balancing inaccuracy.

The appropriate reference for later efficiency tradeoffs is the equation's
computed value with uncertainty. Approximation error should be measured
against that reference, and the separate Kider residual should stay visible.

## Numerical checks and remaining precision

- Complete experiment type check and **53 CPU manufactured checks pass**.
  GPU vacuum, vacuum-ground and absorption-only checks pass.
- All 20 first-order comparisons pass the prescribed CPU/GPU statistical
  check. Maximum discrepancy is 2.606 estimated standard errors. Binary64
  128-to-256-node refinement changes first order by at most 2.43e-11 mW.
  This tiny change is not a bound on GPU floating-point error.
- Doubling solar integration from 32 to 64 nodes changes no total by more
  than **0.000017 mW**, including the paired 95% sampling allowance. Such
  small differences are below a useful claim of absolute GPU accuracy.
- Delaying compensated termination from interaction 8 to 16 changes no
  total by more than **0.059 mW**, including its paired sampling allowance.
- Independent halves of the reference differ by at most 2.16 combined
  standard errors. No favorable-half selection or adaptive stopping was used.
- Of four reused independent second-order comparisons, three lie inside
  the reference's marginal 95% sampling interval. B/360 nm differs by
  0.081 mW (2.64 standard errors); the independently seeded t64 estimate
  is 14.810 ± 0.129 mW against the retained 14.792 mW reference. This is
  not treated as an exact cross-solver match or silently removed.

The target was max(0.5 mW, 0.5% of modeled radiance). These five reference
values miss the sampling target; no extra run was used to chase the cutoff:

| Ray | Wavelength | Reference | 95% half-width | Target half-width |
| --- | ---------: | --------: | -------------: | ----------------: |
| A   |     642 nm |   123.563 |          0.619 |             0.618 |
| A   |   712.5 nm |    96.936 |          0.533 |             0.500 |
| B   |     642 nm |   123.889 |          0.766 |             0.619 |
| B   |   712.5 nm |    97.612 |          0.732 |             0.500 |
| C   |     642 nm |    84.881 |          0.536 |             0.500 |

Their measurement residual magnitudes range from 16.4 to 137.8 mW, so this
remaining sampling width does not obscure their mismatch direction.
All 20 attenuation and termination contrasts pass the prescribed tolerance.
The run is accepted as completed evidence, not certification of universal
convergence or exact physical correctness. GPU binary32 error, finite random
number precision, rare-path sampling and physical/observation assumptions
are outside the sampling intervals. The first-order checks and paired
contrasts constrain some of those numerical concerns, not all of them.

## Cost and boundaries

The job took **65.685 seconds** including setup and retention. The main
browser computation took **15.599 seconds**, including 0.405 seconds of shader
compilation plus readback and batch callbacks. These are measured execution
times for this hardware and workload, not production-shader benchmarks.

Retained evidence: **457,624 bytes**. Owned scratch peaked at 15,158,917 bytes
and was removed. Seal verification and complete campaign accounting pass;
there are no source-authentication or heartbeat failures. The status document
owns remaining campaign resources and deferred review. No production behavior
changed, no full Bruneton benchmark ran, and no overall RMSE gain is claimed.
