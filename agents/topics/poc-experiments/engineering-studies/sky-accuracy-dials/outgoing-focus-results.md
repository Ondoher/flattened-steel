# H61 Same-Count Sun-Focused Outgoing Grid

Status: complete. The same-count outgoing warp improves the full B1 aggregate
and passes the original paper-baseline gate. Production and prior evidence remain
unchanged. No production or twilight qualification is claimed.
The [plan](outgoing-focus-plan.md) owns registration and the
[execution record](outgoing-focus-execution.md) owns decisions and qualification.

## Isolated N1 Result

The warp redistributes the existing4374 W27 slots toward the physical Sun.
It changes outgoing representation only: incoming F68, source20, normalized
transport60, native51/Z180, Q30/cubic readout and paper Direct40 atmosphere stay
fixed. No exact-angle N1 replacement is mixed into the candidate.

Forward angular map:tan(theta_physical/2)=k*tan(theta_grid/2).
The inverse uses1/k. The Sun axis belongs to each solar cache row, so both
recurrence and final cubic solar taps resolve the appropriate row's inverse.
As a reconstruction domain, the grid needs no quadrature Jacobian factor.
Incoming integration weights are unchanged.

| Warp k | Mean N1 residual versus exact-angle control, mW | Change versus identity |
| --- | ---: | ---: |
| 1, identity | 1.67066 | baseline |
| .75 | 0.57301 | -65.7% |
| .5 | 0.60892 | -63.6% |
| .35 | 0.23514 | -85.9% |

The preregistered gate selects.35: it is the only warp within10% of the best
mean, improves the mean by at least20%, and improves every witness. These are
three-wavelength results at407/501/642nm, not full-spectrum scores. The exact-angle
control uses the same GPU direct-base coefficients and spatial/view operators;
it isolates outgoing interpolation rather than certifying the full atmosphere.

[GPU N1 progress image](../../../../../tmp/experiments/sky-accuracy-dials/runs/00393-h61-report/n1-screen.png).
The image was inspected. Accepted00391 supplies the numerical screen;00393 and
00396 retain the selection and its derivation.

## Full Recurrence Screen

Identity run00392 reproduces all1377 B1 rays through every cumulative order
within1.83e-7 relative at the three wavelengths, versus the5e-6 limit.
The small GPU angular-reconstruction rounding is distinct from node movement.

Candidate00394 rebuilds the complete J1/L1/J2/L2/J3/L3/J4 fields with forward
warping at stored J nodes and inverse mapping in every J lookup. Actual Float32
cumulative fields are queried; no later-order increment is frozen. This compiler's
L1 remains its analytic direct-scattering transport, so a changed J1 lookup does
not feed L1. Changed J2 reconstruction feeds L2 and hence J3, then L3/J4.

| Witness | Original C4 spectral RMSE | Sun-focused C4 spectral RMSE |
| --- | ---: | ---: |
| 09:30, x4/y7 | 3.57822 | 2.17112 |
| 09:45, x4/y7 | 2.62518 | 2.07847 |
| 11:00, x3/y6 | 2.02356 | 0.63817 |

Units:mW m^-2 sr^-1 nm^-1 over the same three bands, against matched independent
N1-4. This permits the registered40-band expansion; it does not establish a
paper RMSE improvement. Saved libRadtran/independent reference setup and sampling
limits from H58 remain; no external solver was rerun.

## Full40-Band B1 Result

Accepted00395 rebuilds the full native domain through N4 at all40 wavelengths,
retaining all1377 rays and reusing the three screen channels byte-for-byte.
Accepted final report00397 scores all17 conditions/42687 registered spectral
samples. RMSE uses31 bands360-712.5nm; colors use all40 bands.

| Configuration | Full B1 aggregate RMSE, mW |
| --- | ---: |
| Original40 paper baseline | 11.622914 |
| Corrected60, ordinary W27 | 11.668482 |
| Corrected60, Sun-focused k=.35 | **11.593959** |

The candidate improves0.6387% versus Corrected60 and0.2491% versus Original40.
14 of17 intervals improve versus Corrected60;09:45,10:00 and11:45 regress slightly.
10 of17 improve versus Original40. The full-cache paper gate passes, despite the
coarser background. Original40 is the H55 paper-configured baseline, not a Toronto
app capture. The H59 exact-angle N1 diagnostic remains a separate
[comparison](angular-interpolation-results.md), not part of this candidate.

The all40-band isolated N1 residual falls from mean1.50313 to0.21219mW (-85.9%).
Against the matched independent cumulative N1-4 reference,31-band witness RMSEs
are3.09646 to1.76878,2.26466 to1.74948,1.80315 to0.62116mW. Most of the selected
improvement is N1; later-order error reductions are small and one witness's N2/N3
fit slightly worsens. The warp does not resolve all remaining higher-order errors.

## Reviewable Images And Tables

- [Outgoing node placement](../../../../../tmp/experiments/sky-accuracy-dials/runs/00397-h61-report/outgoing-grid.png)
- [Full interval RMSE table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00397-h61-report/interval-rmse.tsv)
- [Figure5 dome comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00397-h61-report/dome-comparison.png)
- [Common-CIE/p2 swatches](../../../../../tmp/experiments/sky-accuracy-dials/runs/00397-h61-report/swatches.png)
- [Cumulative spectra](../../../../../tmp/experiments/sky-accuracy-dials/runs/00397-h61-report/spectra.png)
- [Pure-order spectral errors](../../../../../tmp/experiments/sky-accuracy-dials/runs/00397-h61-report/order-errors.png)

All images were inspected. Dome colors encode paper-relative spectral error,
not displayed sky color. Selected near-Sun swatches are bright and visually close;
use their photometry and spectra to judge the small radiance differences. At the
illustrated45.5-degree solar row, unique nodes within10degrees of the Sun increase
from38 to250; within30degrees,285 to1445. Total logical slots remain4374.

## Verification, Cost And Limits

Accepted post-run proof00398 authenticates all seven H61 runs, exact reuse,
fixed input request/F68, finite pure/cumulative outputs, unchanged field dimensions,
N1 screen/full-build replay, complete B1 coverage and scratch cleanup. Local
source types, self-review and diff checks pass. Dedicated experiment reviewers
remain disabled; no standards-compliance verdict is implied.

The full run computes37 new wavelengths in314.9s wall time before sealing,
reusing3. Median new-channel time is5.97s, range4.43-26.92s, including field
observation and all-ray reconstruction. Identity screening has only3 wavelengths,
so do not infer a universal build-speed ratio. Compiler peak fields are157.9MiB;
the qualification observer adds306.3MiB of temporary cumulative-field buffers,
plus query storage. Those observation buffers are not increased final cache size
or a measured production memory requirement. Final retained evidence is649.65MiB
under656MiB, scratch zero, free disk over99GiB.

This validates one outgoing representation under the registered paper atmosphere
and selected-ray independent controls. It does not establish a globally optimal
warp, solve every cache error, validate the flat/local source, preserve twilight,
or measure runtime mapping cost. Production integration, broader lighting controls
and twilight regression checks remain future work. No further run is active.
