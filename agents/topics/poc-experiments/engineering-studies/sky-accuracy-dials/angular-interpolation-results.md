# H59 Angular Interpolation Results

Status: completed. The [plan](angular-interpolation-plan.md) owns the hypotheses;
the [execution record](angular-interpolation-execution.md) owns decisions,
reproduction, timing and verification. Production remains unchanged.

**N1 outgoing-angle interpolation is a demonstrated error source.** Replacing
that readout with exact requested-angle phase evaluation improves the selected
independent comparisons and the complete B1 paper score. It does not explain or
fix the remaining later-order errors.

## What Is Established

Outgoing angular interpolation contributes materially to the selected rays'
first-order deficit. The paired test changes only phase evaluation at the
requested outgoing angle, using identical GPU direct coefficients and original
altitude/solar anchors, operators and Q30 view samples. All physical inputs,
source transmission and compiled later orders stay fixed. Native replay and
original outgoing-node controls match exactly in accepted00371; a second GPU
implementation of the original final angular lookup agrees within9.91e-8.

| Wavelength | Ray1 N1 brightening | Ray2 N1 brightening | Ray3 N1 brightening |
| --- | ---: | ---: | ---: |
|407nm|0.866%|0.359%|1.073%|
|501nm|0.990%|0.412%|1.222%|
|642nm|1.080%|0.453%|1.325%|

Against the matched dense binary64 N1 reference, this removes20-83% of the
absolute component residual across the nine screen cells. Eight cells exceed
the predeclared25% materiality target. Ray3 at642nm slightly overshoots: its
error changes from-1.118% to+0.192%. Smaller remaining residuals are not explained
by this test and are not automatically attributed to another mechanism.

Readout changes to pure N2-N4 are much smaller: the largest absolute relative
change in these screen cells is0.335%. Neither this finding nor the N1
correction explains all previously measured later-order errors.

## Recurrence And Incoming Quadrature

Accepted00372 measures frozen-input native transport on four initial rows.
Accepted00374 and00377 use eight geometry-selected rows distributed across the
three witnesses. They separately replace L2 or L3 rows computed with the same
transport60 equation and exact requested-angle evaluation of the original F68
scattering sum. Other compiled field entries retain their original inputs.

The isolated L2 intervention reaches pure N3/N4 at approximately3-140ppm of
those contributions; the L3 intervention reaches N4 at2-126ppm. For the same
eight rows and68 directions, uniform positive weights give mean absolute
field-change ratios deltaL3/deltaL2 of0.104,0.097,0.156 at407,501,642nm.
These bounded observations show propagation with attenuation on that support.
They do not establish global attenuation, rule out effects elsewhere, or
reproduce the large earlier higher-order discrepancies.

Accepted00375 changes incoming angular integration separately. Every L1 value
on the new Gauss16-polar x16/32-azimuth rules is freshly evaluated with native
source20 and transport60. Repeating the F68 rule reproduces native L1 exactly;
paired F68 query reconstruction agrees within2.29e-7. At the eight tested rows,
changing the incoming rule shifts direct J2 by several percent, reaching about
17%, while outgoing interpolation remains at a few tenths of a percent.
The256/512 pair is not fully converged, and polar resolution is unchanged.
This is evidence of a separate incoming-rule sensitivity, not a new physical
reference, a global candidate, or a claim that512 is the correct answer.

## Full-Spectrum And Full-B1 Validation

Accepted00379 retains all40 wavelengths, reusing channels0-11 exactly from the
immutable disk-limit failure00378 and computing28 remaining channels. Native
cumulative spectra reproduce H55 exactly at all three witnesses; node probes
agree exactly. The alternative GPU native-angular reconstruction differs by at
most1.20e-7 relative.

| Witness | Native N1 Y | Exact-angle N1 Y | Dense N1 Y | Missing N1 brightness removed |
| --- | ---: | ---: | ---: | ---: |
|09:30/ray67|15893.7|16057.6|16155.8|62.5%|
|09:45/ray67|13860.8|13920.5|13990.1|46.2%|
|11:00/ray57|13148.1|13315.0|13328.6|92.4%|

Y is cd/m?, integrated over all40 Direct40 bands with the shared CIE table.
All three exceed the preregistered25% materiality target. Their N1 spectral
RMSEs against the dense reference over the31 scoring bands fall from
3.8597to2.0317,2.2268to1.5968,and2.7264to0.9478mW. Cumulative N1-4 spectral
RMSE against the independent solver falls from3.0965to1.5206,2.2647to1.6530,
and1.8032to0.6918mW. These are selected-ray comparisons, not a global independent
solver score. External libRadtran's wider component intervals remain those
qualified in H58; no new external solver campaign was needed.

Accepted00380 evaluates the general frozen-increment readout over the complete
17x81x40 boundary:

`C4_angle = C4_corrected - C1_corrected + C1_angle`.

It uses exact retained GPU direct-base coefficients, original altitude/solar
anchors and Q30 attenuation, and binary64 phase arithmetic rounded to the
original Float32 field/readout boundary. Native N1 replay over all55080 entries
agrees within3.90e-6 relative; direct-angle replay at the120 witness band/ray
cells agrees within3.16e-6. Both are inside the declared5e-6 allowance. This is
an experimental general readout, not a deployed GPU runtime implementation.

| Complete B1 configuration | Aggregate spectral RMSE, mW |
| --- | ---: |
|Original paper baseline, transport40|11.6229140283|
|Corrected transport60 + Mie normalization|11.6684823920|
|Corrected60 + exact-angle N1 readout|**11.5920225214**|

The candidate improves0.6553% over corrected60 and0.2658% over the original
paper baseline. It improves13of17 time intervals versus corrected60 and10of17
versus original40. Some intervals still regress; an aggregate win is not a
claim of uniform accuracy. The numerical paper no-regression gate passes.

[All17 interval scores](../../../../../tmp/experiments/sky-accuracy-dials/runs/00380-h59-b1/interval-rmse.tsv)
retain the complete before/after table. Accepted00382's paired-arithmetic
sensitivity score is11.5920333962mW, differing by only0.0000108748mW. The paper
improvement therefore survives removal of the native GPU/binary64 phase replay
difference; it is not a rounding artifact.

The isolated L2/L3 interventions preserve unaffected prefixes exactly. Combining
the selected N1 readout and L2 patch gives interaction residual at most5.56e-17
W m^-2 sr^-1 nm^-1. On this bounded support, their observable effects are
additive to arithmetic precision, and the N1 readout effect dominates.

## Visual Evidence

- [All40-band swatches with dense/independent references](../../../../../tmp/experiments/sky-accuracy-dials/runs/00381-h59-report/swatches.png).
- [N1 spectral curves](../../../../../tmp/experiments/sky-accuracy-dials/runs/00381-h59-report/spectra.png).
- [Signed pure-order errors and reference intervals](../../../../../tmp/experiments/sky-accuracy-dials/runs/00381-h59-report/order-errors.png).
- [Full B1 Figure5 dome comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00380-h59-b1/dome-comparison.png).
- [Interim angular screen](../../../../../tmp/experiments/sky-accuracy-dials/runs/00376-h59-report/angular-effects.png).

Swatches use the same all40-band CIE integration, fixed paper illumination and
production-p2 display model. These bright near-Sun rays map close to white;
the Y labels and signed error plot reveal changes that the display compresses.
Spectral panels use a shared scale within each ray, with all raw values retained
in the linked run's numerical artifacts. Dome colors are band-integrated
relative errors against measured spectra, not rendered sky colors. The figures
were inspected; no three-band sky swatch was fabricated.

## Conclusions And Remaining Boundaries

The stored N1 phase-bearing angular grid smooths the near-Sun source lobe and
loses first-order light at these witnesses. Evaluating phase at the requested
angle using identical coefficients removes a substantial part of that loss.
L1 is already analytic, so the N1 readout correction leaves the compiled
higher orders fixed. A future implementation can use a factored N1 readout,
but must preserve the validated anchor/interpolation order and undergo its own
production adaptation, runtime performance and twilight qualification.

Pure later-order errors remain large despite their tiny final angular-readout
changes. The bounded recurrence test demonstrates propagation, but not the
previous large higher-order error growth. Incoming-rule sensitivity is a
separate candidate cause; the256/512 experiment is not a converged attribution.
Neither result establishes behavior outside the tested support or a solution
to the entire horizon investigation.

Accepted00382 verifies all13 preceding H59 runs, exact partial reuse, component
and combined-intervention identities, arithmetic sensitivity and scratch cleanup.
Historical failed runs retain their failed states. The owner-approved retained
disk allowance is656MiB; source type checks, image inspection and whitespace
checks pass. Dedicated reviewers/audits remain disabled. The experiment stays
open, with no production change, promotion or additional campaign selected.
