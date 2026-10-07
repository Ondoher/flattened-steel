# Alternate Rays: Bounded Direct Reference Execution

## Authority and scope

The owner explicitly requested rerunning the current direct experiment on
alternate rays after accepting the high-sky, low-elevation and control-ray
selection. Reuse the validated cache-free Monte Carlo solver and retained
production/reference spectra. Change ray selection and wavelength coverage;
keep physical parameters, geometry conventions and numerical checks fixed.

One new GPU job after accepted 00231 and 40 charged GPU attempts. Maximum
job time 25 minutes, including a browser watchdog and cleanup reserve; retain
the existing absolute stop of 2026-09-15 22:44 UTC. No automatic retry or
adaptive parameter search. Retained forecast 1 MiB. For this newly authorized
package, prospectively transfer 1 MiB from unused C6 reporting allocation to
C5 attribution: C5 becomes 125 MiB, C6 becomes 11 MiB. This preserves the
256 MiB continuation allocation, global caps and every prior run. Given
00231 usage, reporting still has 3,563,465 bytes available, over 3 MiB.
This new package-specific transfer does not modify or reopen the consumed
00211 amendment or earlier execution plans.

Review unit: deterministic alternate-ray selection, its bounded runner and
package-specific admission/accounting. Reuse the scientific solver unchanged.
Baseline HEAD `c7803b241f0f8f409226354dc4fb72484f25a5ec`; preserve preexisting
work. Formal reviewers remain suspended; checkpoint advice remains blocked
by the recorded calibration gate.

## Selection fixed before direct evaluation

At each of 09:30 and 13:30, select three rays from the retained full benchmark.
All must be at least 30 degrees from the Sun, avoiding the previous near-Sun
set and giving margin beyond the 20-degree exclusion. Break rank ties by
canonical grid x then y. Choose six distinct rays total:

1. **High-sky gap:** elevation >=60 degrees; maximize control squared residual
   minus mean squared residual of Bruneton/libRadtran over channels 16-30
   (548-712.5 nm). The ranking value must be positive.
2. **Low-elevation apparent gain:** elevation <20 degrees; maximize mean
   reference squared residual minus control squared residual over channels
   0-11 (360-489.25 nm). The ranking value must be positive.
3. **Well-matched control:** elevation 20-60 degrees; minimize mean squared
   residual of all three models over all 31 scoring channels.

These deliberately selected diagnostic cases are not an unbiased sky sample.
Use exact original Sun geometry and authenticated measurements. The main
production comparison is the experiment's Native48 GPU control, with the
older published production capture retained separately. Neither is a new
current-source qualification. Bruneton and Elek are not independent here.

Evaluate channels **0, 8, 16, 24, 30**: 360, 454, 548, 642 and 712.5 nm.
This adds the missing middle-spectrum witness without dropping existing
blue/red witnesses. The direct solver receives physical inputs only; retained
model predictions and Kider values are never radiance inputs.

## Fixed numerical matrix

Every profile uses 8,192 independent paths per batch on all 30 scalar queries:

| Profile    | Solar nodes | Batches | Roulette starts | Seed offset |
| ---------- | ----------: | ------: | --------------: | ----------: |
| t32        |          32 |      32 |               8 |   536870912 |
| t64        |          64 |      32 |               8 |   536870912 |
| reference  |          64 |     256 |               8 |  1610612736 |
| roulette16 |          64 |      32 |              16 |  1610612736 |

Total: 86,507,520 paths; 2,097,152 independent reference paths per scalar.
No radiance or attenuation caches. Compensated termination includes all
interaction orders in expectation; safety-cap hits reject the calculation.
Reuse the CPU first-order 128/256-node refinement, GPU manufactured cases,
six-standard-error first-order parity allowance, paired attenuation and
termination checks, and fixed-count batch intervals from 00230.
Desired total precision remains max(0.5 mW, 0.5% of modeled radiance).
Report unresolved cases rather than tuning counts until a favorable outcome.

## Interpretation

For each scalar retain direct mean and uncertainty, first/second/higher
contributions, both production captures, Bruneton/libRadtran and measurement.
Compute baseline-minus-direct, direct-minus-Kider and their signed squared
error interaction. Distinguish beneficial cancellation, harmful approximation
and uncertainty. Classify effects only when they survive the marginal direct
sampling interval; that interval is not a systematic-error bound or joint CI.

Assess the two times and three selection roles separately. Do not infer a
full-sky direct score, declare all controls physically accurate, tune physical
parameters or promote a production change. Preserve all prior evidence and
the owner's adoption hold. Seal partial evidence as failed if execution fails.
