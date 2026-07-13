# ER1 Typed Celestial Source Contract

Overall status: **accepted**

ER1 establishes quantity-bearing source facts only. It produced no camera,
realized geometry, atmosphere, point response, display conversion, or image.

- Canonical basis: 15 bin-average density channels,
  360..830 nm.
- Bounded canonical solar integral: 739.583675777778 W m^-2
  over 360..830 nm; this is not total solar irradiance.
- Sirius fixture: CALSPEC SIRIUS,
  8970 SCI rows, direct absolute Earth-observer F_lambda,
  no magnitude rescaling.
- Maximum independent Sirius channel residual:
  5.040631857745e-23
  W m^-2 nm^-1.
- Full Gaia-G synthetic AB magnitude (diagnostic):
  -1.340474003.
- 2.5-mag algebra/parser round-trip error:
  0.000000000000e+0 mag.
- Same-support 15-channel Gaia approximation error:
  1.254716012369e-4 mag.
- LIME: sealed-research-candidate-not-executed-or-calibrated. It owns candidate disk-equivalent
  reflectance and is not a resolved BRDF or accepted lunar calibration.

Accepted criteria: 16/16.

The next action is ER2 exact pixel-solid-angle and normalized point-response conservation.
