# Isolating The Remaining Kider Mismatch

## Current Decision

The [follow-up guide](follow-up-context.md) owns the current hypothesis register
and additional Kider data leads. The [case evaluation](aerosol-cancellation-evaluation.md)
connects this framework to the numerical corrections already tested. Direct
all-order evidence and the angular analysis now supplement the earlier passes.
The completed [aerosol sensitivity](aerosol-sensitivity-results.md#supported-wavelength-interpretation)
adds a phase/albedo factorial. The owner now excludes unsupported 360 nm from
this diagnosis. On 454-712.5 nm, each factor separately improves both controls;
together they overshoot. The original full benchmark remains unchanged.

Preserve the demonstrated accuracy conclusions and defer adoption under the
[owner's hold](status.md#owner-decision-preserve-conclusions-defer-adoption).
Use the corrected numerical calculation as a fixed experimental control when
separating observation and physical-input effects. The
[completed second pass](remaining-factors-results.md) owns the order effects;
the [registration analysis](solar-registration-results.md) now owns the
retained-data fit checks and known-axis controls. The remaining distinctions
below are an investigation framework, not new GPU results.
No closed run, consumed plan, resource allocation or measurement is changed.

## What Is Already Separated

- Phase and albedo have separate and joint direct-solver responses under a
  fixed regional alternative. Mean phase directionality versus detailed shape,
  and albedo level versus wavelength dependence, are not yet separated. This
  is physical-input sensitivity with the known approximation mechanisms already
  avoided; production corrections remain deferred. The
  [cancellation interpretation](aerosol-sensitivity-results.md#numerical-and-physical-cancellation)
  records the unexecuted old/new-numerics by old/new-aerosols comparison.
- First-order reconstruction contains identified opposing density and
  transmission errors. Their joint correction greatly reduces reference error.
  Phase-only correction can improve the proxy by increasing numerical error.
- Higher density/altitude corrections improve the available independent P2
  comparisons while worsening aggregate Kider agreement. Their numerical bias
  can therefore mask part of the remaining discrepancy.
- Added H orders five and six worsen all five selected time groups. T320 has
  only a tiny aggregate effect. These particular changes are low-priority
  explanations. Later [all-order direct estimates](direct-convergence-results.md)
  and [alternate rays](alternate-rays-results.md) retain the mismatch without
  the original cache, within their reported numerical limits.
- The selected raw spectral values reproduce exactly. None of the selected
  probes uses the index-zero anomaly repair. This rules out those processing
  discrepancies at these selectors, not every possible measurement error.
- Registration checks now isolate sparse-representation bias and regional
  inconsistency. Tested fitting quadrature has little effect, and a clock-only
  model does not improve withheld-time prediction over constant azimuth zero.
  Independent capture geometry is still required before applying a correction.

## Factors And Discriminating Comparisons

| Factor                                                   | Comparison that separates its effect                                                                                                                                            | Remaining ambiguity                                                                                                                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solar/view registration                                  | Check both solar coordinates across capture times; distinguish a rigid instrument rotation from a clock change. Check the symmetry fit on withheld wavelengths and sky regions. | Sky asymmetry and interpolation can move a fitted axis. Independent orientation or solar-image evidence is needed to establish correct registration.                         |
| Instrument angular acceptance                            | Apply the documented angular response to an unchanged radiance field; compare center-ray and aperture-average predictions with both offset signs retained.                      | A wider optic and broader aerosol scattering can look similar near the Sun. The actual optic/kernel must be established independently.                                       |
| Absolute radiance calibration or incident solar spectrum | Compare absolute amplitude and angular/spectral shape separately as diagnostics; use independent radiometric or irradiance evidence for any scale correction.                   | In the present fixed-medium model, incident-source scaling and detector scaling can be indistinguishable from radiance alone. A fitted gain does not identify their cause.   |
| Aerosol phase function                                   | Vary a physically normalized scattering distribution with extinction and other inputs held fixed; inspect angular redistribution over matched wavelengths and times.            | Registration and aperture averaging can mimic some angular changes. A better score alone does not identify aerosol properties.                                               |
| Aerosol amount, absorption and vertical distribution     | Vary one physical input at a time with its linked scattering/extinction effects kept consistent; compare wavelength, elevation and time responses.                              | Similar spectral responses may require independent atmospheric measurements to distinguish them. Higher orders must be regenerated where the input changes their recurrence. |
| Ground and later scattering                              | Preserve the physical ground boundary and compare individual retained order increments against existing references.                                                             | The current references do not identify the entire higher-order numerical remainder. Missing positive light cannot remove the established morning P1+P2 excess.               |

These response patterns are tests to discriminate hypotheses, not claimed
measurements of the untested factors. Geometry, optics and physical parameters
can remain confounded even when each changes RMSE appreciably.

## Completed Retained-data Partition and Remaining Geometry Question

The [regional comparison](reference-comparison-results.md) and
[angular analysis](angular-residual-results.md) now partition retained residuals
by time, wavelength, elevation and Sun angle. They establish shared visible
angular structure and a separate violet excess; do not repeat this as unstarted
work. Preserve signed spectral/angular diagnostics and the original
absolute-unit benchmark score in any subsequent comparison.

The completed registration analysis retains the original fit and checks sky
regions and wavelengths on separate subsets. Its
[findings](solar-registration-results.md) own the observed transfer failures.
A stable fit is evidence of repeatability, not proof of correct physical pointing.
Under the declared horizontally uniform model, reflection about the solar
vertical plane supplies a useful symmetry control. An asymmetric measured
remainder can also come from horizontal atmospheric variation or the instrument.

The current fit is especially important because it is derived from the same
measured radiance used to score the algorithm. Its 7-17.2 degree departure from
theoretical azimuth is not an independent calibration measurement. The
[fit implementation](../../../../../scripts/experiments/b1-directional-sky-radiance/benchmark.js:219)
minimizes hemisphere reflection error using interpolated measurements. Its
[solar calculation](../../../../../scripts/experiments/b1-directional-sky-radiance/benchmark-domain.js:80)
converts local capture labels to UTC by adding four hours. The
[subset provenance](../../../../../scripts/experiments/b1-directional-sky-radiance/inputs/KIDER-PROVENANCE.md)
and the retained supplement's 12:15 EDT example support checking conventions
carefully rather than declaring a timezone error from the paper's general GMT
wording. No clock correction has been established.

The locally inspected primary-data README links separate HDR imagery,
pyranometer and atmospheric records. A filename inventory of the retained Kider
download directory found no corresponding HDR, irradiance or grib files.
Those links identify potentially independent evidence; they do not mean that
evidence has already been acquired or verified here.

## Criteria For A Useful Attribution

For a fixed baseline residual r and a factor response d, retain the signed
response and the exact score change, 2*sum(r*d) + sum(d*d). A response that is
too small or has the wrong pattern cannot explain the target discrepancy in
its tested range. Similar response patterns identify a confounding pair that
needs independent evidence or a small interaction comparison.

Call a cause supported only when its inputs/conventions have independent
support, its predicted response survives withheld time/direction/wavelength
checks, and the existing numerical-reference checks remain satisfied. Report
unsupported physical parameters as sensitivities. Never adjust tolerances,
per-ray offsets or known numerical bias to make a proposed explanation pass.

Any retry of the failed observation payload should begin with a small
non-radiance browser-transfer proof. Later direct-solver GPU runs already
succeeded through their compact path; the failed 85 MB texture transfer is
not a blanket blocker on all GPU work and establishes no atmospheric result. Keep sample
helpers loop-free, keep source integration precomputed, and retain the owner's
GPU-first, bounded-execution preference. This document allocates no new GPU
attempt and does not start a physical-parameter fitting campaign.
