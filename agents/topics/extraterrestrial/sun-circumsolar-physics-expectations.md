# Sun And Circumsolar Physics Expectations

Status: deferred optional transport reference, current through 2026-08-14. The
active [Spectral Color-Transform Experiment Plan](spectral-color-transform-experiment-plan.md)
accepts the existing Bruneton-qualified atmosphere output and does not require
the independent comparisons below. This document preserves useful physical
expectations for a future transport revisit. It does not authorize a production
change, prescribe a display appearance, or make Frostbite screenshots into
radiometric evidence.

## Claim Boundary

The disk renderer does not need to reproduce a research solar observatory, but
it should preserve the radiometry that materially affects its apparent color:

- a sourced extraterrestrial solar spectral irradiance;
- date-dependent Sun-Earth distance and angular support;
- a correctly normalized disk-radiance profile;
- atmosphere-owned direct-beam transmittance;
- independently computed atmospheric path radiance around the disk; and
- a declared population observer after physical composition.

Frostbite remains a useful subjective and architectural comparison. It is not
the source spectrum, atmosphere oracle, uncertainty model, or numerical
acceptance authority for this experiment.

The active Color lane does not install libRadtran, fit AERONET data, or judge
the accepted atmosphere output against this document. Its Stage 0 checks only
data capture, cache/composition observability, and spectral adequacy for the
observer transform.

## Reference Hierarchy

Use sources in this order. A lower tier may not override a disagreement at a
higher tier merely because it produces a more attractive image.

1. **Extraterrestrial spectrum.** Use the
   [TSIS-1 Hybrid Solar Reference Spectrum](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2020GL091709)
   as the primary spectral irradiance reference. It spans `202-2730 nm`; the
   published high-resolution spectrum reports uncertainty of `0.3%` from
   `460-2365 nm`, `0.5%` from `400-460 nm`, and `1.3%` below `400 nm` and above
   `2365 nm`. Retain the exact dataset version and checksum.
2. **Solar placement and scale.** Use the corrected Reda-Andreas
   [Solar Position Algorithm](https://research-hub.nrel.gov/en/publications/solar-position-algorithm-for-solar-radiation-applications-2/)
   or an independently verified equivalent for geocentric/topocentric solar
   geometry, Sun-Earth distance, and refraction inputs. Its reported angular
   uncertainty is much smaller than the Sun's roughly half-degree support.
3. **Independent atmospheric transfer.** Use
   [libRadtran](https://acp.copernicus.org/articles/5/1855/2005/index.html), with
   the capabilities documented for
   [version 2.0.1](https://gmd.copernicus.org/articles/9/1647/2016/index.html),
   as the offline comparison solver. It can compute spectral direct irradiance
   and directional radiance with molecular absorption, aerosol/cloud optical
   properties, multiple scattering, polarization, and spherical treatments.
   It is reference evidence, never a runtime dependency or generated oracle
   input.
4. **Site/date atmosphere.** Prefer quality-assured NASA
   [AERONET Version 3](https://aeronet.gsfc.nasa.gov/) direct-Sun and inversion
   products from `NASA_Ames` over generic aerosol guesses. NASA Ames is at
   `37.419986, -122.056969, 10 m`, close enough to San Jose to be a strong
   regional constraint, not a claim of identical air along the horizon path.
5. **Observer projection.** Use official
   [CIE 1931 2-degree 1 nm data](https://cie.co.at/datatable/cie-1931-colour-matching-functions-2-degree-observer)
   for the primary small-field photopic diagnostic. Wide-field and mesopic
   alternatives remain explicit Normal configurations rather than corrections
   to the physical spectra.

An empirical wavelength-dependent disk profile may use Hestroffer and Magnan's
[solar limb-darkening model](https://adsabs.harvard.edu/pdf/1998A%26A...333..338H).
This is a second-order disk-shape refinement. It must be energy-normalized and
must not change the disk-integrated TSIS irradiance.

## Reference Calculation

Let `E_HSRS(lambda)` be spectral irradiance at the reference distance and `d`
the ephemeris Sun-Earth distance in astronomical units:

```text
E0(lambda, t) = E_HSRS(lambda) / d(t)^2
alpha(t)      = apparent solar angular radius from geometry
Omega(t)      = 2*pi*(1 - cos(alpha(t)))       geometric solid angle
Omega_p(t)    = pi*sin(alpha(t))^2             projected solid angle
```

For the first uniform-disk calculation:

```text
L_TOA_mean(lambda, t) = E0(lambda, t) / Omega_p(t)
```

For an optional radial profile `p(lambda, mu)`, normalize it over the apparent
disk before use:

```text
L_TOA(lambda, mu, t)
  = E0(lambda, t) * p(lambda, mu)
    / integral_disk(p(lambda, mu) * cos(theta) dOmega)
```

This integral is a mandatory invariant: integrating the emitted disk radiance
over its support must recover `E0` within numerical tolerance. Limb darkening
may redistribute energy across the disk but may not invent or remove it.

For each unblocked camera-to-boundary ray, direct unscattered radiance is:

```text
tau(lambda) = tau_Rayleigh + tau_aerosol + tau_ozone
            + tau_other_absorbers
T(lambda)   = exp(-tau(lambda))
L_direct(lambda) = L_TOA(lambda) * T(lambda)
```

Atmospheric scattering into an individual view ray is a separate solution of
the radiative-transfer equation:

```text
L_camera_ray(lambda) = L_path(lambda) + L_direct(lambda)
```

The pixel contribution is the integral of those radiances over the portion of
the pixel footprint covered by the disk. `coverage * representative radiance`
is a fixed-cost approximation to that integral; the offline reference performs
the resolved integral and measures the approximation error.

`L_path` includes the circumsolar aureole. It is not derivable from direct
transmittance alone: its magnitude and angular falloff depend strongly on the
aerosol phase function and multiple scattering. The reference solver must
integrate illumination over the finite solar disk when resolving the innermost
`0.5-2 degree` field.

Geometry, not Color, determines partial horizon coverage, terrain/ground
blocking, and apparent placement under refraction. Once the entire disk is
blocked, direct camera radiance is exactly zero while atmospheric twilight path
radiance can remain nonzero.

## Date-Matched San Jose Inputs

The AERONET Level 2 direct-Sun record is available for the target evening. At
`2024-06-21T02:26:41Z`, about one hour before the retained
`2024-06-21T03:26:03.503Z` sunset, NASA Ames reports, among other fields:

```text
solar zenith angle       79.032144 degrees
AOD 500 nm                0.167740
AOD 440 nm                0.204884
AOD 380 nm                0.256850
precipitable water        1.373982 cm
ozone                     323.353501 DU
```

Using that row's reported optical air mass `5.124519`, Beer-Lambert applied to
the aerosol term alone gives approximate transmissions of `0.423` at `500 nm`,
`0.350` at `440 nm`, and `0.268` at `380 nm`. These are useful measured
directional constraints: molecular scattering and gas absorption still have to
be applied, and they are not predictions for the roughly one-hour-later
horizon.

A Level 2 almucantar phase-function retrieval is also available at
`2024-06-21T02:37:57Z`, with solar zenith `81.087346 degrees` and coincident
`AOD440 = 0.201566`. Preserve the original AERONET rows, retrieval type,
quality level, processing date, and missing-value markers when acquiring the
reference inputs.

These observations are regional and precede the final horizon interval. Do not
extrapolate them to sunset as exact truth. Build a site-informed atmosphere
ensemble around them:

- interpolate measured spectral AOD only within its supported time interval;
- fit a declared aerosol spectral model and retain its residuals;
- use the retrieved phase function where supported and bracket its evolution;
- source pressure and vertical temperature/humidity from the nearest sounding
  or a documented reanalysis;
- use the reported ozone column with a sourced vertical profile and bracket the
  column/profile uncertainty;
- declare surface albedo and horizon elevation; and
- vary refraction through plausible pressure/temperature states.

At least one generic standard-atmosphere run remains as a control. It must not
replace the site-informed ensemble.

## Expected Relationships

### Strict Physical And Numerical Invariants

- The extraterrestrial spectrum is common to all times in the sequence apart
  from the computed `1/d^2` scale and negligible change over a few hours.
- Projected-solid-angle integration of top-of-atmosphere disk radiance recovers
  the source irradiance.
- Every unblocked direct-beam channel satisfies `0 <= T <= 1` and
  `L_direct = L_TOA * T` within the declared float/integration tolerance.
- Every ray satisfies `L_camera_ray = L_path + L_direct`; every pixel satisfies
  the corresponding footprint integral, within its declared raster
  approximation tolerance.
- A fully ground-blocked disk has exactly zero direct contribution.
- Observer XYZ computed from a high-resolution reference converges under
  spectral refinement before the native 15-channel projection is judged.

These are proof gates, not uncertainty envelopes.

### Reference-Envelope Expectations

- Toward the horizon, growing slant optical depth should greatly reduce direct
  disk radiance and usually suppress short visible wavelengths more strongly.
  Molecular Rayleigh extinction alone gives a strong short-wavelength trend;
  aerosols and ozone alter its magnitude and shape.
- The exact horizon spectrum is highly sensitive to aerosol loading, aerosol
  phase function, vertical distribution, ozone, refraction, and the real
  horizon. It should fall inside a declared reference ensemble, not match one
  guessed RGB or one Frostbite curve.
- Circumsolar radiance and its radial falloff are especially sensitive to
  forward aerosol scattering. AOD without a phase-function constraint is
  insufficient to predict the aureole.
- Noon is the clean scale and source-normalization control. Sunset-minus-60 is
  the strongest date-matched aerosol control. The final low-Sun samples stress
  spherical path length and extrapolation. Two hours after sunset stresses path
  radiance and geometry blocking, not direct-disk color.
- A wavelength-dependent limb profile may alter resolved center-to-limb color
  and anti-aliased edge energy. It should have little influence on an unresolved
  disk after energy-conserving integration, so it cannot explain a grossly
  white, gray, or incorrectly scaled Sun.

## Comparison Metrics And Tolerances

Compare the candidate and offline reference before Color at the same geometry:

- top-of-atmosphere disk-integrated irradiance and mean radiance;
- spectral optical depth and transmittance;
- direct, path, and total spectral radiance;
- CIE XYZ/Y and `x,y` or `u',v'` chromaticity derived from the full spectra;
- disk-to-sky ratio by wavelength;
- circumsolar radial radiance slope and directional asymmetry; and
- native-15 versus high-resolution observer projection error.

Use log-radiance residuals where values span orders of magnitude, but retain
signed absolute residuals near zero. Separate three tolerance classes:

1. **Identity tolerance:** float, interpolation, and quadrature error for the
   strict equations above. This should be tight and implementation-derived.
2. **Same-input solver tolerance:** candidate versus libRadtran with harmonized
   spectrum, profiles, geometry, absorbers, aerosol optical properties, and
   surface boundary. Determine it from solver-convergence experiments before
   viewing images.
3. **Atmospheric-state envelope:** the range produced by defensible variations
   of measured or missing site inputs. A result outside this envelope is a
   transport discrepancy; a result inside it is physically plausible, not
   proven to be the historical sky.

Do not assign percentage, chromaticity, or appearance thresholds until the
reference solver's spectral/angular convergence and the input ensemble have
been generated. Choosing them from the candidate renders would turn the
comparison into tuning.

## Consequence For Normal

Physics qualifies the spectral input to `Normal`; it cannot specify a unique
finite-display reproduction of looking at the Sun. Once the input passes the
gates above, `Normal` is expected to:

- preserve the ordering and chromatic relationships of direct and circumsolar
  spectra through observer projection;
- keep failures traceable to a named appearance, gamut, or display boundary;
- compress luminance globally without condition-specific Sun corrections; and
- produce explained differences when observer, adaptation, or display
  configurations change.

A physically credible spectrum followed by an unattractive display result is a
Color problem. A spectrum that violates an identity or sits outside the
same-input/reference envelope is not repaired in Color.
