# Matched Sky Error Patterns And Cancellation

## What the comparison establishes

1. **Most of the spatial pattern is shared.** Outside 20 degrees from the
   Sun, the experiment control's residual correlates 0.974 with the mean of
   the Bruneton and libRadtran residuals. Signs agree on 37,876 of 39,917
   eligible wavelength samples (94.89%). The prediction difference from that
   reference mean is 1.907 mW RMS, versus 8.430 mW error against Kider.
   This is evidence of similar residual structure, not attribution to a
   particular physical or measurement cause.
2. **The retained implementation already meets the reference scores closely.**
   Its full score is 11.420 mW against Bruneton's 11.283 and libRadtran's
   11.481. Outside the near-Sun region it scores slightly better than both.
   These scores alone do not establish numerical correctness.
3. **Cancellation is directly visible away from the Sun.** On the two
   available non-near-Sun direct-reference rays, approximation error improves
   five of eight wavelength matches and worsens three. These signs survive
   the direct solver's marginal sampling intervals. The result holds for
   both separately retained production baselines.
4. **Removing approximation error also produces genuine local improvements.**
   At the zenith ray, the 642 and 712.5 nm errors fall from 9.452 to 5.024 mW
   and from 7.171 to 3.557 mW respectively when using the direct solution.
   A blanket statement that numerical correction harms the match is false.

## Scope and baseline identities

Accepted **00231-reference-match** is a retained-data reporting run, under the
[fixed plan](reference-comparison-plan.md). No model was rerun or fitted.
The full comparison covers 17 times, 81 directions and 31 wavelengths:
42,687 scalar samples. The three-way direct-reference decomposition covers
only five rays at four wavelengths. The direct result is not extrapolated
into a full-sky score.

Two saved versions of our implementation are kept distinct:

- **Experiment control:** authenticated `00000-inputs/native48-gpu.tsv`, the
  retained Native48 GPU production boundary used as this experiment's control.
  Its atmospheric coefficients and source-frame geometry match the direct
  reference on all 20 selected values. The difference includes finite-order
  truncation, quadrature and reconstruction effects; it is not all a coding bug.
- **Published capture:** the production GPU result identified by score
  manifest `000004-current-production-b1-b3-gpu-shaders`, dated September 11.
  Its exact output/provenance hashes match that manifest. It is a separate
  snapshot: 263/306 retained runtime-source hashes match today's tree.

Neither saved capture is presented as a fresh certification of today's
production source. The corrected-first/frozen-higher diagnostic hybrid is
not used as a substitute for either baseline. Bruneton and Elek have identical
spectral outputs here; they are not counted as independent reference witnesses.

## Full-sky regional scores

All entries are spectral RMSE in mW m^-2 sr^-1 nm^-1. Regions are fixed by
the original fitted solar geometry. Near Sun means separation <20 degrees;
its samples remain in the full score. Away-region elevation bands are <20,
20-60 and >=60 degrees. Each wavelength and direction receives equal weight.

| Region                                 | Rays across 17 times | Experiment control | Published capture | Bruneton | libRadtran |
| -------------------------------------- | -------------------: | -----------------: | ----------------: | -------: | ---------: |
| Full sky                               |                1,377 |             11.420 |            11.554 |   11.283 |     11.481 |
| Near Sun, set aside as a work priority |                   86 |             31.956 |            31.947 |   30.956 |     31.415 |
| Away from Sun                          |                1,291 |              8.430 |             8.626 |    8.483 |      8.651 |
| Away, low elevation                    |                  544 |             10.469 |            10.805 |   10.735 |     10.725 |
| Away, middle elevation                 |                  622 |              6.533 |             6.572 |    6.448 |      6.790 |
| Away, high elevation                   |                  125 |              6.679 |             6.737 |    5.897 |      6.557 |

The clearest regional relative weakness of the control is the high sky. Its
largest difference from reference predictions is instead at low elevation:
2.645 mW RMS from the reference mean, compared with 1.031 in the middle sky
and 1.345 in the high sky. Low elevation nevertheless scores better against
Kider than either reference. That combination makes low-elevation apparent
gains worth checking for compensation; the full region has no direct solution
yet, so cancellation there is demonstrated only on the selected ray below.

Outside the near-Sun region, band scores further locate the relative gaps:

| Wavelength band     | Experiment control | Bruneton | libRadtran |
| ------------------- | -----------------: | -------: | ---------: |
| Below 500 nm        |              9.686 |   10.323 |     10.527 |
| 500 to below 600 nm |              7.844 |    7.420 |      7.465 |
| 600 nm and above    |              7.236 |    6.756 |      6.991 |

The control's blue advantage offsets middle/red disadvantages in the aggregate.
This is a measured score tradeoff; only the direct-reference samples below
support classifying particular advantages as numerical cancellation.

## Direct evidence away from the Sun

Use `n = control - direct`, `p = direct - Kider`, and `r = control - Kider`.
The retained computation verifies `r=n+p` and `r^2=n^2+p^2+2np`.
Opposite signs can cancel; the squared-error test additionally checks whether
the cancellation actually makes the score better, rather than overshooting.

Residuals and differences below are spectral mW. D is the noon low-elevation
ray (12.1 degrees elevation, 60.5 degrees from Sun); E is the noon zenith ray
(22.2 degrees from Sun). E is just outside the chosen near-Sun boundary and
does not establish behavior throughout the high sky.

| Ray / wavelength | Direct residual p | Approximation difference n | Control residual r | Effect of approximation on Kider match |
| ---------------- | ----------------: | -------------------------: | -----------------: | -------------------------------------- |
| D / 360          |           +20.546 |                     -2.646 |            +17.900 | Helps through cancellation             |
| D / 454          |           -24.439 |                     +3.535 |            -20.904 | Helps through cancellation             |
| D / 642          |           -38.320 |                     +2.127 |            -36.192 | Helps through cancellation             |
| D / 712.5        |           -38.225 |                     -0.682 |            -38.907 | Worsens the deficit                    |
| E / 360          |            +8.359 |                     -1.580 |             +6.779 | Helps through cancellation             |
| E / 454          |            -3.734 |                     +4.814 |             +1.080 | Crosses zero but still helps           |
| E / 642          |            +5.024 |                     +4.428 |             +9.452 | Worsens the excess                     |
| E / 712.5        |            +3.557 |                     +3.614 |             +7.171 | Worsens the excess                     |

All eight effect classifications survive the individual direct-reference 95%
sampling intervals. Those half-widths range from 0.113 to 0.340 mW. They do
not cover physical-input uncertainty, systematic solver error or joint
multiple-comparison confidence. No error is inferred solely from a Kider score.

On these eight deliberately selected scalars, control RMSE is 21.705 mW,
direct RMSE 22.557, Bruneton 21.905 and libRadtran 21.647. For the older
published capture it is 21.882, with the same five helpful/three harmful
classifications. Their respective squared-error reductions relative to the
direct estimate are 301.733 and 240.108 (spectral mW)^2 summed over eight
values. The change in squared error (control minus direct) decomposes into
a -384.556 cross term plus 82.823 squared approximation difference.

Across all 20 selected scalars, nine show beneficial cancellation and eleven
show harm, for either saved baseline. The control still has a lower subset
RMSE (60.729 versus 63.535). Most of that aggregate benefit comes from the
near-Sun cases now set aside. This is not proof that its favorable full-sky
score is principally or exclusively caused by cancellation.

## What this directs us toward

Keep the shared near-Sun issue out of the next work priority. Separate two
questions elsewhere: the extra high-sky/middle-red mismatch, and whether the
low-elevation/blue advantage survives numerical correction. A small matched
extension of direct-reference coverage in those regions would resolve more
than another undirected resolution sweep. This report does not start that
execution or authorize changing physical coefficients.

Reference models are empirical controls, not exact truth. Shared residual
correlation includes subtraction of the same measurements and common
physical assumptions; it cannot assign causality or demonstrate competing
models' internal error cancellation. Independent direct coverage across more
directions/times is still needed before claiming a general numerical fix.
The owner's adoption hold remains.

## Verification and provenance

Seal path: `tmp/experiments/sky-accuracy-dials/runs/00231-reference-match/sealed.json`.
SHA-256: `eec39850444983bbde01e0df8848d34749de7e01f7f41082b1ffd2299ed12aec`.
The run's `analysis.json.gz` retains regional, spectral-band, per-time and
per-direction summaries, all 20 decompositions, exact input identities and
the production-source audit. Its source delta plus authenticated parent
snapshot preserves the executable calculation.

The [runner](../../../../../experiments/sky-accuracy-dials/continuation/reference-comparison/run.mjs)
authenticates measurement and published-model table hashes, both production
captures and their provenance, and accepted direct-reference artifacts.
All 1,377 table keys and 20 selected measurement/geometry joins pass; all
selected physical coefficients match. Recomputed full Bruneton/libRadtran
scores reproduce the existing aggregate values. Thirty-one manufactured
checks cover cancellation, overshoot, uncertainty, duplicate/nonfinite input
rejection and region partitioning. The complete experiment type check passes.

Accepted run time: **42.620 seconds**, with no GPU work or transport solve.
Retained output: **559,329 bytes**, charged to C6 reporting. Scratch was
removed; seal and campaign verification pass with no source or heartbeat
failures. Formal reviewers remain suspended; no standards-review completion
is claimed. Current resource totals are owned by the status document.
