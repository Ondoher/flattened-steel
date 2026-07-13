# Finite object transfer refined baseline

Status: accepted

## Summary

Generated 84 primary finite object-transfer cases:
`2` Sun cases, `7` distances, and `6` synthetic object spectra. The
transport endpoint is spectral radiance by wavelength. CIE, sRGB, tone mapping,
and PNG output are display consumers only.

Criteria passed: 14. Failed:
0. Unresolved:
1. The unresolved convergence-backed effect margin belongs to the transfer-convergence follow-up.

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
| Max split-segment transmittance error | 1.1102230246251565e-16 |
| Max split-segment path-radiance error | 5.551115123125783e-17 |
| Min transmittance | 0.000006198481417080833 |
| Max transmittance | 1 |
| Incident sky cache entries | 68 |
| Min convergence margin | not run |

## Distance Responses

- figure1-06h00-z87: mean T 100 m = 0.9930568439807088, mean T 100 km = 0.009887934282066127, path fraction change = 0.9235521686463982
- figure1-13h15-z21: mean T 100 m = 0.9930568439807088, mean T 100 km = 0.009887934282066127, path fraction change = 0.8217731938111599

## Display Boundary

`contact-sheet.png` is generated from `transfer-cases.json`. It uses one
fixed artifact-wide display mapping: CIE to linear sRGB, then
`1 - exp(-k * linear_sRGB)` with `k = 1 / (5 * 683)`. Swatches are
organized as Sun-case and object-spectrum blocks with distance rows and four
columns: source object, attenuated object, path radiance, and final radiance.

The source object spectra are algorithmic unit radiance arrays. They are not
material reflectance measurements.

## Next

Run `node scripts/flat/atmosphere-environment/run.js --step=transfer-refined-convergence` to test the refined baseline against the next doubled sample counts.
