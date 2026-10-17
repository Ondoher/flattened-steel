# H60 Incoming Angular Resolution Results

The incoming sweep does not repair H59's outgoing-angle N1 interpolation error.
That distinction was clarified during execution, and the remaining GPU build was
stopped. Preserve the useful higher-order evidence without treating it as a
replacement for exact-angle N1 reconstruction. Production remains unchanged.

## Completed Numerical Findings

The complete-domain screen00383 rebuilt all native fields through fourth order
at407,501,642nm. Fresh F68 reproduces H59 exactly. Original cached N1 stays
bit-for-bit identical under every incoming rule. GL256 completed all40 bands in
00385. The selected GL512 full confirmation00386 was stopped after17 retained
channels, including3 reused screen channels; it is not a qualified full case.

All metrics below are means of the three fixed H59 witnesses, against the same
matched independent physical-order references. Spectral units are
mW m^-2 sr^-1 nm^-1. Full scoring uses31 bands360-712.5nm; colors use all40.

| Rule | Screen higher-only RMSE | Screen N1-4 RMSE | Full higher-only RMSE | Full N1-4 RMSE |
| --- | ---: | ---: | ---: | ---: |
| F68 | 0.69340 | 2.74232 | 0.65397 | 2.38809 |
| GL128,8x16 | 0.74983 | 4.10352 | not run | not run |
| GL256,16x16 | 0.12792 | 3.33521 | 0.12998 | 2.98262 |
| GL512,16x32 | 0.13745 | 3.29020 | stopped | stopped |
| GL1024,32x32 | 0.23212 | 3.13254 | not run | not run |

GL256 is the registered three-band knee: lowest observed cost among rules within
5% of best higher-only error. Its full higher-only error is80.1% lower than F68,
but total N1-4 error is24.9% higher. This is a limited higher-order result,
not a total-accuracy sweet spot, physical convergence proof or full B1 score.
Increasing count alone is not monotonically better: GL1024 has worse screened
higher-only agreement than256/512. Rule family and polar/azimuth placement also
change relative to F68.

## What Changes And What Stays Fixed

H60 changes the incoming integration rule throughout the native compiler,
including later ground-irradiance angular sums. It rebuilds complete native
J1/L1/J2/L2/J3/L3/J4 fields, rather than editing selected rows. Only the three
witness spectra and diagnostics are retained. Incoming refinement cannot change
J1 or the outgoing lookup grid.

The outgoing domain remains W27:27x27 nodes on each of6 cubed-sphere faces,
4374 logical direction slots, including shared-face seam duplicates. Adjacent
node spacing is2.131-4.399degrees (mean3.156degrees across face-neighbor pairs).
Lookup uses up to4 direction taps. Refining incoming quadrature cannot reduce
those outgoing interpolation distances.

The fixed first-order deficit was partly offset by F68's higher-order excess.
Removing much of that excess makes total radiance dimmer and its total spectral
fit worse. At256 directions the N3 brightness errors change from+22.3,+17.9,+5.6%
to-3.3,-5.0,-3.4%; N4 changes from+43.4,+41.7,+11.6% to-8.5,-6.6,-5.8%.
The same-order Monte Carlo sampling limits remain distinct from numerical bias.
The pointwise reference bands in00389 do not establish256 as statistically
better than512; the registered knee is a point-estimate/cost selection only.
The earlier H59 N1 replacement stays a separately labelled comparison; it is
never mixed into H60 candidates.

## Cost And Limits

GL256's median complete-wavelength wall time is8.77s across40 observations,
including the3 reused screen channels. Its range is6.59-82.03s; observed median
native field-pass time sums to1.05s. F68's fresh H60 timing has only3 observations,
median9.42s and range5.67-31.04s; its all40-band accuracy reuses the exactly
replayed H59 baseline. Driver/deferred work and host scheduling affect these
measurements. They do not establish that256 directions generally build faster
than68. Peak compiler-owned field allocation rises from157.9 to171.1MiB;
these are not total GPU-memory measurements. Outgoing cache dimensions stay fixed.

Only three selected rays were scored. No new external solver, full B1 benchmark,
production integration, twilight qualification, outgoing-grid refinement or
variable-per-order incoming campaign was executed. Different incoming rules per
order remain a possible later higher-order refinement, not a fix for N1 lookup.
The next relevant N1 investigation would hold incoming integration fixed and
change outgoing representation or reconstruction; it is not started here.

## Evidence And Verification

The [execution record](incoming-resolution-execution.md) owns decisions, commands,
run disposition, resource use and final verification. The [registered plan](incoming-resolution-plan.md)
retains the original question and the explicit scope correction. Qualified final images from00388:

- [Accuracy and cost](../../../../../tmp/experiments/sky-accuracy-dials/runs/00388-h60-report/accuracy-cost.png)
- [Pure-order brightness errors](../../../../../tmp/experiments/sky-accuracy-dials/runs/00388-h60-report/order-errors.png)
- [Common-display swatches](../../../../../tmp/experiments/sky-accuracy-dials/runs/00388-h60-report/swatches.png)
- [Spectra](../../../../../tmp/experiments/sky-accuracy-dials/runs/00388-h60-report/spectra.png)

The bright near-Sun swatches look very similar; signed numerical residuals and
order plots carry the small differences. Reference bands00389 and finalproof00390
are accepted. Local types, self-review, image inspection, immutable checks and
cleanup pass. No further build is running. Historical and
partial evidence remains immutable.
