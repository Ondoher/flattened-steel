# Sun-angle Residual Analysis

## Main conclusion

**The mismatch has a repeatable angular component outside the near-Sun region.**
After removing each time/elevation/wavelength mean, a fixed smooth function of
Sun angle predicts 41.1% of the remaining squared residual in the experiment
control and 43.6% in the mean of Bruneton/libRadtran, using held-out times.
Every model has positive aggregate skill at all 17 held-out times.

The shared visible-light pattern has a broad deficit around **40–80 degrees
from the Sun**. It remains after accounting for time and elevation offsets.
That supports testing angular scattering assumptions; it does not identify
phase-function error uniquely or justify multiplying rendered brightness by
an empirical angle curve.

**The 360 nm excess behaves differently.** Its large raw bias mostly does not
follow the within-ring angular pattern. The angular diagnostic accounts for
only 6.0% of its centered squared residual in our control and 2.7% in the
reference mean. Treat the violet excess and the broad visible angular deficit
as distinct diagnostic targets rather than assuming one phase adjustment
will fix both.

## Evidence and scope

Accepted [00233-angular-residual](../../../../../tmp/experiments/sky-accuracy-dials/runs/00233-angular-residual/sealed.json)
consumes the [fixed retained-data plan](angular-residual-plan.md).
Seal SHA-256:
`2200d50a2857f2012936aac70f2b03a222c3e94ac4add95a12c0e7e6f031fb05`.

The full descriptive comparison uses 17 times × 81 directions × 31 scoring
wavelengths: **42,687 scalars per model**. It authenticates 00231's geometry
and exact spectral parents, plus 50 selected direct-reference scalars from
00230/00232. The experiment control and older published production capture
remain separately labeled. No new atmospheric calculation, GPU execution,
parameter change or current-production qualification occurred.

## What remains after controlling time and elevation

For each time, exact grid elevation ring and wavelength, subtract its mean
model-minus-Kider residual. Also subtract the same group's mean from each of
the three explanatory variables: cos(angle), cos²(angle), cos³(angle).
Fit those centered variables by ordinary least squares, independently at each
wavelength. Exclude angles <20 degrees, the zenith and groups with fewer than
four rays. The resulting comparison covers **1,274 rays and 39,494 scalars**
per model and residual definition.

Train on 16 times and test on the remaining time, repeated for all 17.
The baseline predicts zero centered residual. Skill is
`1 − held-time error² sum / held-time centered residual² sum`.
No degree selection, smoothing adjustment or parameter sweep was performed.

| Retained model               | Centered RMS before, mW | After angular prediction, mW | Squared-residual reduction | Positive held times |
| ---------------------------- | ----------------------: | ---------------------------: | -------------------------: | ------------------: |
| Experiment control           |                   5.074 |                        3.893 |                      41.1% |               17/17 |
| Published production capture |                   5.183 |                        3.935 |                      42.4% |               17/17 |
| Bruneton                     |                   5.163 |                        3.657 |                      49.8% |               17/17 |
| libRadtran                   |                   4.547 |                        3.603 |                      37.2% |               17/17 |
| Mean of the two references   |                   4.798 |                        3.604 |                      43.6% |               17/17 |

**These are not reductions in full benchmark RMSE.** Held-time ring means are
calculated using held observations. This tests transfer of angular departures
from those means, not independent prediction of absolute sky brightness.
The percentages refer only to residual variation left after centering.
The reference mean is a descriptive shared pattern, not physical truth.

The result survives changing the residual definition to
`2*(model−measurement)/(model+measurement)`: aggregate conditional reductions
are 61.7% for the control, 62.2% for published production, 61.1% for Bruneton,
53.5% for libRadtran and 56.5% for the reference mean. Thus the angular
association is not confined to the brightest samples under absolute weighting.

Aggregate absolute skill ranges from 22.6–70.7% across held times for the
control and 14.6–74.0% for the reference mean. Some narrower band/time tests
fail: reference-mean blue at 09:30 is −19.3%; Bruneton blue at 09:30 is −31.1%
and middle at 09:45 is −0.10%; libRadtran blue at 09:30 is −10.1%, and its
fractional red comparison at 13:30 is −1.15%. Preserve these failures.

## Shape of the shared residual

Raw mean residuals for the reference mean, in spectral mW m⁻² sr⁻¹ nm⁻¹.
Negative values mean the modeled sky is too dim:

| Sun separation | Blue, 360–489.25 nm | Middle, 501–595 nm | Red, 606.75–712.5 nm |
| -------------- | ------------------: | -----------------: | -------------------: |
| 20–40°         |              −1.264 |             +0.180 |               +2.748 |
| 40–60°         |              −1.698 |             −7.243 |               −4.871 |
| 60–80°         |              +2.664 |             −5.090 |               −5.104 |
| 80–100°        |              +6.384 |             −1.509 |               −3.170 |
| 100–120°       |              +7.899 |             +0.145 |               −2.444 |
| 120–140°       |              +9.513 |             +2.262 |               −1.046 |

The middle/red deficits in both the 40–60° and 60–80° cells occur at **all
17 times**, for both the control and reference mean. After exact-stratum
centering, reference middle-band bias remains −3.601 mW at 40–60° and
−1.032 mW at 60–80°, versus +3.043 mW at 80–100°. The trough therefore
cannot be explained solely by different average elevations or times in the bins.

The centered pattern does not imply the same additive correction at every
elevation. Descriptive same-time/ring pairs separated by at least 30° show
reference middle-band slopes predominantly negative on the 53.37° elevation
ring (16/17 times), but positive on the 12.12° ring (16/17 times). Different
rings cover different parts of the angular curve and have different transport
weights. The pairs overlap and do not supply independent significance tests.

### The violet excess is a separate clue

At 360 nm the reference mean is too bright by +13.265 mW at 40–60° and
+18.188 mW at 80–100°. After centering those become −0.348 and +0.157 mW.
At 548 nm the corresponding raw values are −7.431 and −1.331 mW, with
centered values −3.800 and +3.324 mW. Pooling 360 nm with the rest of the
blue band conceals this difference.

| Wavelength | Control conditional angular skill | Reference-mean conditional angular skill |
| ---------- | --------------------------------: | ---------------------------------------: |
| 360 nm     |                              6.0% |                                     2.7% |
| 454 nm     |                             43.1% |                                    54.6% |
| 548 nm     |                             41.4% |                                    42.0% |
| 642 nm     |                             38.7% |                                    34.8% |
| 712.5 nm   |                             29.8% |                                    25.9% |

The smaller 360 nm skill does not prove a particular spectral absorption
error. It shows that a universal angular explanation is incomplete.

## Coverage and direct-reference cross-check

| Angular bin | Retained rays | Times represented |
| ----------- | ------------: | ----------------: |
| 0–20°       |            86 |                17 |
| 20–40°      |           251 |                17 |
| 40–60°      |           362 |                17 |
| 60–80°      |           327 |                17 |
| 80–100°     |           243 |                17 |
| 100–120°    |            97 |                13 |
| 120–140°    |            11 |                 3 |
| 140–180°    |             0 |                 0 |

The 120–140° bin contains only low rays at 09:30–10:00. Do not interpret it
as a full-day backward-scattering constraint. Near-Sun observations remain
in the complete retained tables but are excluded from these fits.

Available direct estimates support the visible deficit without the production
cache: at 548 nm, the 48.94° morning ray is −6.786 ±0.088 mW and the 56.10°
afternoon ray is −31.628 ±0.127 mW. The 83.40° morning control is only
−1.042 ±0.067 mW. Their elevations differ; these selected examples are
supporting witnesses, not a controlled phase-function comparison or an
independent full-sky test. Intervals describe marginal sampling uncertainty.

## Interpretation and next decision

The repeated angular pattern strengthens the case for a **broad angular
scattering mismatch outside the forward peak**. It is shared by our saved
model and both references, and survives the time/elevation mean control.
This is evidence about the pattern, not proof that aerosol phase shape is
the source. Multiple scattering, attenuation, ground reflection, acquisition
geometry and instrument response can also produce angular structure.

Use two separate targets for a future physical test: (1) the visible trough
around 40–80°, and (2) the broadly positive 360 nm bias. Any proposed phase
change must preserve phase normalization and be evaluated through the complete
transport equations; its response must transfer across wavelength, elevation
and time. Do not apply the fitted residual polynomial as a shader correction.
No new physical test or production adoption is part of this completed package.

The geometry here uses the original fitted Sun direction. Its previously
identified uncertainty remains unresolved. Held times are neighboring samples
from one morning, not independent days or independently measured aerosol
states. A successful angular fit therefore cannot determine a unique aerosol
mixture. The numerical-correction adoption hold remains in force.

## Artifacts and verification

- [Complete analysis, folds, coverage, matched pairs and direct witnesses](../../../../../tmp/experiments/sky-accuracy-dials/runs/00233-angular-residual/analysis.json.gz)
- [Reference mean: raw angular residual](../../../../../tmp/experiments/sky-accuracy-dials/runs/00233-angular-residual/angular-shared-raw.png)
- [Reference mean: centered angular residual](../../../../../tmp/experiments/sky-accuracy-dials/runs/00233-angular-residual/angular-shared-centered.png)
- [Experiment control: raw angular residual](../../../../../tmp/experiments/sky-accuracy-dials/runs/00233-angular-residual/angular-control-raw.png)
- [Experiment control: centered angular residual](../../../../../tmp/experiments/sky-accuracy-dials/runs/00233-angular-residual/angular-control-centered.png)

Full experiment type check and 21 manufactured checks pass, including known
polynomial recovery with arbitrary stratum offsets, removal of pure offsets,
singular-design rejection and held-time exclusion. Authenticated joins
reproduce the complete Bruneton/libRadtran benchmark scores and all 50 direct
measurement identities. Source authentication, immutable seal verification
and campaign accounting pass. The four standard-library PNG plots were
visually inspected; their exact coordinates and rendering tools are retained.

Charged CPU-job elapsed time: **51,289 ms**. Retained evidence: **976,671
bytes**, within the 1.5 MiB forecast. Scratch peaked at 5,636 bytes and is
absent. There were no GPU jobs or new atmospheric integrations. Formal
reviewers remain suspended; checkpoint advice remains blocked by the existing
calibration gate. No execution remains active.
