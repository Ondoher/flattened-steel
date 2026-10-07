# Alternate Rays: Direct Reference Results

## Conclusion

**Cancellation persists outside the near-Sun region.** Solving the declared
equations more accurately worsens the five-wavelength Kider RMSE on all six
new rays. The effect survives the reported sampling uncertainty: the experiment
control's approximation helps 22 of 30 scalars, harms five, and is unresolved
in three. This confirms a conflict between numerical accuracy and measurement
agreement on these selected cases; it does not identify the physical or
observational cause of the remaining residual.

The high-sky gap does **not** disappear in the direct solution. At both times,
the baseline is already brighter than the direct solution at 548–712.5 nm,
partially hiding a deficit against Kider. Eliminating that approximation makes
the deficit larger. Conversely, at 360 nm the direct solution is too bright
on all six rays. A global brightness adjustment cannot resolve both patterns.

The direct solution remains reasonably close to the competing models while
sharing much of their measurement mismatch. Across the six rays at each
wavelength, direct-versus-Bruneton RMS is 1.20–2.42 mW and
direct-versus-libRadtran RMS is 0.78–1.88 mW. Their differences exceed our
sampling uncertainty, so they are not identical solutions. This comparison
does not establish that those implementations have our numerical errors.

## Fixed selection and execution

Accepted [00232-alternate-rays](../../../../../tmp/experiments/sky-accuracy-dials/runs/00232-alternate-rays/sealed.json)
consumes the single-job [execution plan](alternate-rays-plan.md).
Seal SHA-256:
`4ee0ad742f4e37b04983ba8177eb45bbe3f4cb5073d9a647b48b464dbde9def8`.

Selection used retained spectra before evaluating the new direct solution.
At each time, choose the largest long-wavelength high-sky disadvantage, the
largest blue low-elevation advantage, and the best jointly matched middle-sky
control, with Sun separation at least 30 degrees. These are deliberately
selected diagnostics, not an unbiased sample. “Control” means the best match
among eligible rays; it is not an assumption of physical correctness.

| Time  | Role               | Grid x,y | Elevation | Sun separation |
| ----- | ------------------ | -------- | --------: | -------------: |
| 09:30 | High-sky gap       | 4,4      |    90.00° |         48.94° |
| 09:30 | Low-elevation gain | 2,0      |    12.12° |        122.51° |
| 09:30 | Control            | 3,2      |    53.37° |         83.40° |
| 13:30 | High-sky gap       | 5,4      |    71.92° |         39.86° |
| 13:30 | Low-elevation gain | 0,4      |    12.12° |         56.10° |
| 13:30 | Control            | 7,4      |    33.75° |         78.03° |

Wavelengths: **360, 454, 548, 642, 712.5 nm**. The physical medium, geometry
conventions and scientific GPU solver remain unchanged. No radiance or
attenuation fields are cached. Retained measurements and competing predictions
are used only for comparison, never as solver radiance inputs.

## Matched scores

Spectral RMSE in mW m⁻² sr⁻¹ nm⁻¹ across the five wavelengths per ray:

| Time / role             | Experiment control | Published production capture | Direct | Bruneton | libRadtran |
| ----------------------- | -----------------: | ---------------------------: | -----: | -------: | ---------: |
| 09:30 high              |              5.768 |                        5.772 |  6.551 |    5.018 |      6.108 |
| 09:30 low               |              7.484 |                        7.464 | 10.270 |    9.795 |      9.682 |
| 09:30 control           |              3.868 |                        3.865 |  5.196 |    4.303 |      5.319 |
| 13:30 high              |              7.175 |                        7.220 |  7.986 |    5.619 |      7.142 |
| 13:30 low               |             21.999 |                       25.741 | 27.276 |   25.360 |     25.081 |
| 13:30 control           |              5.682 |                        5.511 |  7.534 |    6.408 |      7.682 |
| All 30 selected scalars |             10.583 |                       11.896 | 13.165 |   11.940 |     12.236 |

These are selected-set scores, **not** full Bruneton benchmark scores.
The two production captures are retained historical data, not fresh
current-source qualification. Their difference is material on the afternoon
low ray: keep the baselines separate. Published production shows helpful
approximation in 21 scalars, harmful approximation in five, and four unresolved.
Both captures have lower per-ray RMSE than the direct solution on all six rays.

## What balances what

Let `n = baseline − direct`, `p = direct − Kider`. Then baseline residual is
`n + p`, and its squared error is `n² + p² + 2np`. Opposite signs indicate
cancellation; the interval-aware benefit test also checks that cancellation
does not overshoot enough to increase squared error. Here the 22 beneficial
control cases also have robust opposite signs. The direct interval measures
sampling uncertainty, not systematic implementation or measurement uncertainty.

The added **548 nm** witness exposes the balance directly; units below are mW:

| Time / role   | Approximation `n` | Direct residual `p` | Baseline residual `n+p` | Direct 95% half-width | Approximation effect           |
| ------------- | ----------------: | ------------------: | ----------------------: | --------------------: | ------------------------------ |
| 09:30 high    |            +0.616 |              −6.786 |                  −6.170 |                 0.088 | Cancels part of deficit        |
| 09:30 low     |            −1.326 |              +3.655 |                  +2.330 |                 0.120 | Cancels part of excess         |
| 09:30 control |            +0.083 |              −1.042 |                  −0.959 |                 0.067 | Small beneficial cancellation  |
| 13:30 high    |            +0.988 |              −8.217 |                  −7.229 |                 0.108 | Cancels part of deficit        |
| 13:30 low     |            +7.239 |             −31.628 |                 −24.389 |                 0.127 | Strong beneficial cancellation |
| 13:30 control |            −0.284 |              −1.925 |                  −2.209 |                 0.080 | Worsens deficit                |

The morning low-ray blue advantage comes from underestimating radiance:
at 360 nm, `n = −6.268` cancels a direct excess of `+21.409` mW.
On the afternoon low ray, the important benefit is instead an overestimate:
at 454 nm, `n = +9.412` cancels a direct deficit of `−23.299` mW.
The sign changes with time, direction and wavelength. This is not a single
uniform gain or a single error that can be adjusted everywhere.

Five harmful cases are morning-low 712.5 nm, afternoon-low 360 nm, and
afternoon-control 454/548/712.5 nm. The three unresolved cases are
morning-low 642 nm and morning-control 454/712.5 nm. The sealed
[results](../../../../../tmp/experiments/sky-accuracy-dials/runs/00232-alternate-rays/results.json.gz)
retain every component, uncertainty, model value and balance calculation.

## Numerical evidence and cost

- Completed all **86,507,520 paths**, including **2,097,152 reference paths
  per scalar**, in 10,560 batches. All scattering orders are included in
  expectation with compensated random termination; deepest observed path: 34.
- **30/30** sampling, attenuation-refinement and termination comparisons pass
  the preset max(0.5 mW, 0.5%) target. Sampling half-widths are **0.032–0.165 mW**.
- Largest paired attenuation change plus its half-width: **0.000023 mW**;
  largest termination contrast plus half-width: **0.0533 mW**.
- Full experiment type check, **84 CPU proof checks**, three GPU manufactured
  cases, CPU first-order 128/256 refinement and **30 first-order GPU parity
  checks** pass. Immutable seal verification and campaign accounting pass.
- RTX 2060 main GPU evaluation: **28.45 seconds**. Charged job elapsed time:
  **69.48 seconds**, including admission, setup, checks and cleanup; within the
  fixed 25-minute cap. No retry or physical-parameter search occurred.
- Retained evidence: **756,201 bytes**. Owned scratch peaked at 15,159,804 bytes
  and is absent. All prior evidence remains immutable.

These checks support numerical adequacy for the reported directional effects.
They do not prove the absence of every systematic solver error. Formal
reviewers remain suspended; checkpoint advice remains blocked by the recorded
calibration gate. No production implementation changed.

## Consequence for the next decision

Further sampling refinement is unlikely to explain residuals of several to
tens of mW on these rays. Preserve the numerical-correction evidence and the
adoption hold. Do not tune discretization to recreate the helpful bias.

The next useful attribution is the **remaining direct-solution difference
from reference models and observations**, with spectral physical inputs,
phase-law behavior away from the Sun and observation geometry kept distinct.
This run identifies where that investigation must explain opposite signs;
it does not choose which physical input is wrong. Any future parameter test
should state the predicted spectral/angular response first and check both
times and control rays. No additional run is authorized by this consumed plan.
