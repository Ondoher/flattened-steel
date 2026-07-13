# Finite object transfer refined convergence pass

Status: accepted

## Summary

Generated 84 primary finite object-transfer cases:
`2` Sun cases, `7` distances, and `6` synthetic object spectra. The
transport endpoint is spectral radiance by wavelength. CIE, sRGB, tone mapping,
and PNG output are display consumers only.

Criteria passed: 15. Failed:
0. Unresolved:
0. Convergence comparison against 005-transfer-refined-baseline passed: true. Minimum effect-to-convergence margin: 6.4074899093834174.

## What It Shows

- Zero-distance transfer preserved object radiance.
- Black objects returned only atmospheric path radiance.
- Object-radiance differences stayed linear under view transmittance.
- Longer finite segments reduced mean transmittance.
- Low-Sun and high-Sun cases produced different path radiance.

## Key Metrics

| Metric | Value |
| --- | ---: |
| Max final-composition error | 0 |
| Max zero-distance transmittance error | 0 |
| Max zero-distance path radiance | 0 |
| Max black-object identity error | 0 |
| Max linearity error | 1.7763568394002505e-15 |
| Max split-segment transmittance error | 1.6653345369377348e-16 |
| Max split-segment path-radiance error | 5.551115123125783e-17 |
| Min transmittance | 0.000006197013019846065 |
| Max transmittance | 1 |
| Incident sky cache entries | 272 |
| Min convergence margin | 6.4074899093834174 |

## Distance Responses

- figure1-06h00-z87: mean T 100 m = 0.993056843980429, mean T 100 km = 0.009886757277291373, path fraction change = 0.9195301836306533
- figure1-13h15-z21: mean T 100 m = 0.993056843980429, mean T 100 km = 0.009886757277291373, path fraction change = 0.8008245079430655

## Display Boundary

`contact-sheet.png` is generated from `transfer-cases.json`. It uses one
fixed artifact-wide display mapping: CIE to linear sRGB, then
`1 - exp(-k * linear_sRGB)` with `k = 1 / (5 * 683)`. Swatches are
organized as Sun-case and object-spectrum blocks with distance rows and four
columns: source object, attenuated object, path radiance, and final radiance.

The source object spectra are algorithmic unit radiance arrays. They are not
material reflectance measurements.

## Next

State goal reached for the transfer baseline and convergence proof. Optional later tracks are Lambertian surface lighting, local Sun, and flat long-sightline follow-ups.
