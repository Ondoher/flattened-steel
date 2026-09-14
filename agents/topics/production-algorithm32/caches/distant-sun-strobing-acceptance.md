# Strobing Promotion Acceptance Policies

This document registers the P0 comparison policy before candidate scoring.
The [promotion plan](distant-sun-strobing-promotion-plan.md) owns phase and
release gates. These are engineering acceptance bounds, not a claim that the
four-metre surface approximation meets them.

## Physical Comparison

Compare each channel and each scattering order independently with a binary64
reference using the same physical profile. Accept a value only when
`abs(candidate - reference) <= absoluteFloor + relativeLimit * abs(reference)`.
Reject nonfinite values and negative physical densities or radiances.

| Quantity | Absolute floor | Relative limit |
| --- | --- | --- |
| Scattering density | `1e-10 W m^-3 sr^-1 nm^-1` | `0.01` |
| Directional radiance | `1e-8 W m^-2 sr^-1 nm^-1` | `0.01` |
| Transmittance | `1e-6` | `0.001` |

The one-percent bound limits the proposed surface displacement independently
of aggregate benchmark fit. Absolute floors prevent near-zero values from
dominating relative errors. They do not permit dropping dark samples. Retain
every raw value, per-channel maxima, RMS errors, failed coordinates, and the
worst normalized error, including its complete physical inputs.

Use all 15 Native15 channels and all 40 direct-40 benchmark wavelengths.
Compare N1, N2, N3, and cumulative N4 with the same recurrence integration
settings. Native15 and direct-40 remain separate profiles: source spectra,
ground boundary, transport quadrature, and display models are not exchanged.
Both profiles explicitly disable ozone.

The surface matrix includes logical heights 0, 1.7, 2, 4, and 8 metres, the
first two positive Native48 altitude nodes, and the midpoint of each of the
first two altitude intervals. Include solar zenith angles 0.5, 30, 60, 80,
89.5, 89.75, 90, 90.25, 90.5, 90.75, 91, 91.5, 96, and 107.5 degrees;
traverse both sunrise and sunset directions. Include vertical upward,
vertical downward, tangent, and grazing directions on either side of the
geometric horizon, plus all 17 by 81 registered B1 benchmark coordinates.
Compare the 2/4/8-metre candidates with the reference at the **logical**
height, not merely with a reference displaced to the candidate height.

If a surface candidate fails, preserve the failure and refine the numerical
representation or classification. Do not widen these bounds based on the
candidate result. Any later policy revision must receive a new identity and
keep the original scored results.

## Lookup Comparison

For matched CPU/GPU interpolation, use the same authenticated Float32 field
and direction/spatial stencil. Compare scattering density with an absolute
floor of `1e-10 W m^-3 sr^-1 nm^-1` and relative limit `2e-5`; this isolates
Float32 shader arithmetic from the separate physical-error budget.
Exercise integer knots, fractions 0.01, 0.25, 0.5, 0.75, and 0.99, physical
domain endpoints, altitude boundaries, horizons, and scene publications in
both directions. Exact packet encoding, decoding, and packing retain zero
bit tolerance. CPU knots equal their stored samples exactly. Shared tangents
agree between adjacent intervals; each interpolated component stays within
the two endpoint values.

Missing interior stencil support rejects preparation or produces an explicit
unsupported lookup; it never selects a one-sided fallback. One-sided slopes
are permitted only at explicit physical domain endpoints. Required support
is protected through atomic publication; prediction cannot evict it.

Render matched comparisons through Basic Bruneton without changing its
spectral projection, tone response, or encoding. The p2 response is excluded.
The plan's existing B1 ceiling, B2 control comparison, B3 consistency, and
resource limits remain additional independent gates.
