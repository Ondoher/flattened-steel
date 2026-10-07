# Remaining Factors: Bounded Second Pass

## Decision

Keep the jointly corrected first-order calculation. The retained evidence does
not justify another higher-order cache factorial for improving the current
proxy. It does identify the signed mechanisms that make correctness repairs
look worse against measurements.

The observation audit identifies an unresolved comparison issue: the existing
fitted solar azimuth differs from the theoretical azimuth by **7 to 17.2
degrees** across the selected times. This is a calibration difference, not
proof that either direction is correct. Resolve its provenance before treating
physical coefficients as score-fitting controls.

## Retained Order Accounting

Accepted **00225-remain-account** consumes the
[prospective remaining-factors plan](remaining-factors-plan.md). Its
[seal](../../../../../tmp/experiments/sky-accuracy-dials/runs/00225-remain-account/sealed.json)
has SHA-256 `b927afb9919d4b6c22c389b1d8448a15effdb60b7d7d3b53a32ae3e4aae0fbc6`.
Seven manufactured checks and 240 matched order-prefix checks pass. This
stage performs no new radiance integration.

It holds the corrected S160 first order from 00224 fixed and substitutes each
retained candidate's own higher contribution, computed as its cumulative N4
minus its own N1. Thus a candidate's original first-order error cannot leak
into the comparison. The matched subset is 40 rays at channels 0/8, **80
scalars**, covering five times. It is deliberately difficult selected evidence,
not a full Bruneton RMSE qualification.

| Retained higher-light change              | Proxy RMSE, spectral mW | Proxy gain, spectral mW | Independent P2 evidence                        |
| ----------------------------------------- | ----------------------: | ----------------------: | ---------------------------------------------- |
| Original H higher light                   |                31.34244 |                       0 | Baseline                                       |
| More near-ground altitude resolution, P55 |                31.56112 |                -0.21868 | All four available errors decrease             |
| Density-factored reconstruction, P48      |                31.64316 |                -0.30072 | All four available errors decrease             |
| Density-factored reconstruction, P55      |                31.58865 |                -0.24621 | All four available errors decrease             |
| Doubled higher transport, T320            |                31.34071 |                +0.00173 | All four available errors decrease             |
| Add H orders five and six                 |                31.93817 |                -0.59573 | Finite added light, not an infinite-tail bound |

Positive gain means a lower proxy error. The same gain signs hold at the earlier
corrected first-order viewing level. T320 falls below the registered 0.01 mW
work-priority floor. That floor decides whether to spend on new cache builds;
it does not decide whether a numerical correction is scientifically valid.
The conditional two-build factorial is therefore **skipped**.

### Exactly How The Remaining Balance Works

For original residual `r = corrected P1 + original higher light - measurement`
and a higher-light change `d`, the exact squared-error change is
`2 * sum(r*d) + sum(d*d)`. The first term tells whether the correction aligns
with the discrepancy already present. The second term is always nonnegative.

| Change                | Signed cross term, spectral W squared | Squared change, spectral W squared |
| --------------------- | ------------------------------------: | ---------------------------------: |
| P55                   |                          +0.000924528 |                       +0.000175950 |
| Density-factored P48  |                          +0.001104018 |                       +0.000411241 |
| T320                  |                          -0.000008896 |                       +0.000000210 |
| H orders five and six |                          +0.002439819 |                       +0.000576058 |

Density factoring lowers mean higher light by about **2.03 mW**. That often
helps morning excess, but deepens important later deficits. Its proxy gain by
time is +0.187, +0.845, -0.300, -0.550 and -1.228 mW, respectively. Its known
P2 corrections remain valid despite those regressions.

Adding H orders five and six raises mean light by about **2.15 mW** and worsens
the proxy in **all five time groups**. Missing positive orders cannot be a
general explanation for both excessive and insufficient modeled light. This
finite comparison does not bound every order beyond six.

The independently checked morning ray at 360/454 nm already exceeds the
measurements by at least **10.95/21.70 mW** with only physical P1 and P2, after
their retained allowances. All later physical orders are nonnegative. At the
selected noon ray, the H residual is instead about **-56.59/-189.25 mW**;
correcting its positive P2 numerical bias deepens that deficit. One brightness
offset or retained numerical bias cannot correctly address both situations.

## Observation Audit

The selected 160 measurement values reconstruct **exactly** from 40 original
spectral files. Filename direction checks, the canonical Y reflection and
linear wavelength sampling agree with the existing benchmark. Channels
0/8/24/30 correspond to 360/454/642/712.5 nm. None of these selected probes uses
the existing index-zero anomaly repair; that repair cannot explain their
residuals. All 40 original directions reproduce from the retained scene data.

The retained author paper describes approximately 0.5-degree motor error,
approximately three-minute hemisphere scans and 1/8-degree foreoptics. The
selected spectral headers do not identify each scan's optic or individual
sample timestamp. Those facts support sensitivity tests, not a fabricated
instrument calibration. See the
[retained author text](../../../../../references/downloads/kider-clear-sky-framework-2014/paper-author-version.extracted.txt)
and [benchmark processing record](../../../../../references/results/experiments/b1-directional-sky-radiance/result.md).

| Time  | Fitted minus theoretical solar azimuth |
| ----- | -------------------------------------: |
| 09:30 |                           -7.0 degrees |
| 10:15 |                           -9.0 degrees |
| 11:15 |                          -12.8 degrees |
| 12:30 |                          -15.2 degrees |
| 13:30 |                          -17.2 degrees |

The benchmark derives its azimuth from a hemisphere-symmetry fit within a
20-degree window around the theoretical direction. This audit preserves that
fit; it neither reruns it nor substitutes theoretical geometry. Its size and
time dependence warrant checking acquisition timing, orientation conventions
and fit provenance. They do not establish which of those is responsible.
The fixed small-angle sensitivity cannot settle that larger registration issue.

## GPU Observation Matrix

The [fixed observation plan](remaining-observation-plan.md) specifies corrected
P1 at S160, all 40 rays/four channels, both viewing levels, elevation and azimuth
offsets of both signs, and uniform 1/8-degree cones at two angular quadratures.
Higher light remains fixed. Even a successful matrix measures first-order
observation sensitivity, not the full instrument-convolved solver.

**No pointing or cone response was obtained.** Attempt **00226-remain-observe**
was interrupted after the browser wrapper stalled without returning output.
Its exact pending stage was not conclusively instrumented. Both blank pages
responded to read-only probes, and closing the owned browser did not settle
the runner. Narrow recovery preserved its artifacts and sealed the interruption.
Its [seal](../../../../../tmp/experiments/sky-accuracy-dials/runs/00226-remain-observe/sealed.json)
has SHA-256 `e658067b37be8d8245a908500e3f365ad99fa1bafa61c1e558d9e3e162684bc7`.

The single allowed retry, **00227-remain-observe**, reached direct DevTools
evaluation, then failed at its five-minute `Runtime.callFunctionOn` timeout.
Its [seal](../../../../../tmp/experiments/sky-accuracy-dials/runs/00227-remain-observe/sealed.json)
has SHA-256 `2acf485135f163ca7dcb7eca34bcb153630ad6313806d7522fc4f82a6ccdf01c`.
The payload contains an 85,524,480-byte Float32 sample texture transferred as
base64. Transport size or browser execution may be involved, but this pass did
not establish the cause. No GPU output, baseline-parity result, angular
stability result or observation-score improvement is claimed. An invocation
counter in the failed seal is not proof that its shaders executed.

Both attempts retain the independently completed raw-data audit and 42 passing
manufactured checks. Those checks establish input consistency and manufactured
angular moments, not the missing atmospheric response. The complete experiment
type check passes. Both scratch trees are removed. The
[narrow recovery plan](remaining-observation-retry.md) is consumed; there is no
third attempt. Further transport debugging should begin with a small
non-radiance transfer proof before another evidence allocation.

This pass used one retained-data assessment and two unsuccessful observation
attempts, retaining **4,678,278 bytes**. Their charged elapsed total is about
16.5 minutes, including a conservative interruption charge; session work and
local preflights are additional. Execution stopped approximately 48 minutes
after the three-hour window opened. The conditional higher-cache factorial was
skipped by its scientific work-priority gate, not by the browser failure.

## Implementation Decisions

- Preserve analytic query density and phase with density-normalized sunlight
  columns. Refine source integration after correcting that representation.
- Keep higher-order density and altitude repairs as correctness work. Do not
  tune their remaining numerical error to recover a favorable proxy.
- Give another transport-count or order-count ladder low priority for this
  residual: the observed transport gain is tiny, and extra finite orders worsen
  every selected time group.
- Audit the existing solar registration before a physical-parameter search.
  If physical inputs are later varied, constrain them by physical evidence and
  assess their linked effects through all orders. This pass does not identify
  an aerosol, irradiance or atmosphere-profile correction.

The running sample evaluator retains **one outer viewing-ray loop and no loops
inside a sample or its helpers**. Source integration is precomputed. The cone
quadratures are experiment-side observation comparisons; they are not an added
runtime sampling requirement. Production performance and complete-solver
accuracy remain unqualified. The [status](status.md) owns final resource and
deferred-review accounting.
