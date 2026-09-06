# Receptor-Response Parameter Research

Focus: Colorimetry, perception, adaptation, and camera premises.

## Research Question

Which parts of a brightness-dependent spectral response can be fixed from a
population observer and photoreceptor evidence, and which parts remain an
explicit rendering approximation?

The intended operation is:

```text
complete spectrum -> linear overlapping receptor catches -> nonlinear response
```

It is not a nonlinear tone curve independently applied to wavelength bins.
Cone fundamentals are overlapping linear sensitivities. Because nonlinear
response does not commute with spectral summation, per-bin nonlinear curves
would make equal-cone-response metamers diverge.


## Frozen Spectral Receptors

Primary spectral sensitivities are the CIE 2006 L/M/S cone fundamentals for a
2-degree field in energy terms, DOI `10.25039/CIE.DS.tijidesg`, from CIE
170-1:2006 table 6.7. The official dataset covers `390-830 nm` in `5 nm`
steps, specifies linear interpolation and zero extrapolation, and is licensed
CC BY-SA 4.0. Its locally retained SHA-256 is
`f48160edf11c1a121aaaf41d4c3b7513385bfc9c60d726b88e735519f6d37b1f`,
matching the CIE metadata.

For each native spectral bin, integrate the piecewise-linear CIE fundamental
over the complete bin interval. Do not use an unqualified center sample. Sum
all wavelength contributions into L, M, and S before applying a response
curve. The later proof compares this native-15 integration with a one-nanometer
reference.

Use the CIE 170-2:2015 physiological LMS-to-XYZ_F matrix retained in the
fixture. It provides a standard linear normalization and a reversible route to
an XYZ-like display coordinate. D65 channel normalization makes a declared D65
stimulus neutral without using the attenuated Sun as the adapting white.
Rec.709 is defined through the conventional colorimetric observer, so the
resulting XYZ_F-to-Rec.709 step is a declared display approximation whose gamut
and reconstruction residuals remain observable; it is not silently equated
with CIE 1931 XYZ.


## What Physiology Supports

Valeton and van Norren, “Light adaptation of primate cones: An analysis based
on extracellular data,” DOI `10.1016/0042-6989(83)90167-0`, found that primate
foveal cone responses across adapting backgrounds were described by the
incident-light Naka-Rushton form

```text
R / R_max = I^n / (I^n + sigma^n)
```

with `n = 0.74`. Human psychophysical work by Tyler, “Saturation Revealed by
Clamping the Gain of the Retinal Light Response,” DOI
`10.1016/0042-6989(95)00298-7`, found the clamped human retinal saturation
response closer to the Naka-Rushton hyperbola than the tested alternatives.
Wade and Wandell, “Chromatic Light Adaptation Measured using Functional
Magnetic Resonance Imaging,” reports that cone-class adaptation must be tied to
cone isomerization rather than photopic luminance alone and found human
responses broadly consistent with Valeton/van Norren-style mean-field cone
adaptation.

This evidence supports the response family and a reference exponent. It does
not provide one universal `sigma(L_A)` in `cd/m2` for this renderer. The
experimental `sigma` depends on retinal illuminance or cone isomerization,
adapting spectrum, pupil, photopigment bleaching, response range compression,
and experimental configuration. Stockman et al., “Human cone light adaptation:
from behavioral measurements to molecular mechanisms,” DOI
`10.1167/6.11.5`, further shows that steady-state cone sensitivity across the
photopic range is maintained by multiple mechanisms rather than one fixed
saturation threshold.

Therefore anatomy does **not** uniquely determine where an arbitrary rendered
wavelength “goes white” or “goes black” from the accepted global `L_A` alone.
White appearance also includes post-receptor and contextual processing. A
renderer must declare the operating-range placement.


## Frozen Reference Approximation

The primary executable reference keeps the anatomically supported pieces
separate from the rendering choice:

1. CIE 2006 LMS fixes overlapping spectral integration.
2. `n = 0.74` fixes the Naka-Rushton shape reference.
3. Accepted global `L_A = E_v / pi` supplies the condition-wide brightness
   state; it remains an equivalent-diffuse proxy, not retinal illuminance.
4. CAM16's standardized `F_L(L_A)` and response constants place the
   half-saturation point:

```text
k = 1 / (5 L_A + 1)
F_L = 0.2 k^4 (5 L_A) + 0.1 (1-k^4)^2 (5 L_A)^(1/3)
sigma(L_A) = [100 * 27.13^(1/0.42)] / F_L
R_c = I_c^0.74 / [I_c^0.74 + sigma(L_A)^0.74]
```

The numerator is `258806.80980163`. CAM16 supplies an evidence-backed,
reproducible appearance placement that is already independently verified in
this project. It is explicitly not relabeled as an anatomical
cone-isomerization constant. The exact CAM16 CAT16 response remains a separate
control because its basis and exponent may not be mixed invisibly with CIE LMS.

There is no hard black threshold or white clip in the primary curve. Zero input
maps to zero and the response approaches one asymptotically. Report the `1%`
and `99%` response crossings as diagnostics; do not clip there. This makes
black and white behavior observable without inventing a biological threshold.


## Projection And Metamer Result

Immutable run `000294-spectral-color-receptor-projection-proof` accepts the
projection and operation ordering (artifact set
`b866e80e451c5d8b1d2077822ffc8b2d4c2b870e9dcdf2081fd2c85b8b3e6909`).
The exact piecewise-linear CIE fundamental integral over every native bin agrees
with an independent one-nanometer construction to
`5.2753657089343e-16` maximum relative error. All 25 eligible disk spectra
round-trip from LMS through the declared CIE 2015 XYZ_F matrix with maximum
relative residual `4.657780671341199e-16`.

The proof constructs two nonnegative native-15 spectra that differ materially
but have exactly equal integrated LMS catches. Their primary Naka-Rushton
responses are also exactly equal. The prohibited alternative—applying the
nonlinearity to wavelength values before overlapping receptor integration—
separates the same pair by `0.0017164935297639384` relative. This supplies the
required metamer counterexample rather than relying only on an architectural
assertion.

Reconstructed CIE 2015 XYZ_F is not numerically identical to the historical CIE
1931 observer. Across the 25 measured disk spectra, the maximum absolute Y
difference is `5.728013%` and maximum CIE 1976 u-v distance is `0.00366966`.
This is retained as the measured cost of intentionally changing observer basis;
it is not a native-bin convergence failure and must remain visible in later
comparisons.

Immutable run `000295-spectral-color-receptor-curve-sweep` accepts the receptor
operating-range step (artifact set
`0ac84ae83f6e9d25830f56a8892d9329ca25b827bea8f64d4631fb5f59008923`).
It evaluates the primary `n = 0.74` response, exact CAM16 CAT16 response
control, and linear LMS control across 60 native-wavelength/state curves and 16
reference curves. All analytic crossings, monotonicity, D65 neutrality,
finiteness, measured-state distinction, progressive dimming, and progressive
red-minus-blue gates pass.

The result is informative rather than universally flattering: noon response is
`[0.9995656, 0.9995524, 0.9994928]`, sunset minus 30 is
`[0.9956561, 0.9955214, 0.9949241]`, minus 10 is
`[0.9876279, 0.9872263, 0.9855158]`, and exact sunset is
`[0.8156596, 0.8045775, 0.7768309]`. The sequence avoids a shared 99% plateau
and preserves warm ordering, but strong receptor separation appears late. Do
not hide that finding with a fitted display curve.

Immutable run `000301-spectral-color-receptor-display-proof` accepts the
complete measured numerical qualification (artifact set
`7e2b6dadea5b7f49d81b01b892ef880d073dab7a0e8d9dfd4697b08a2cb876b2`). The
fixed response-to-display scale, signed Rec.709 behavior, same-luminance gamut
intersection, metamer identity, neutrality, continuity, hue, warm ordering, and
plateau behavior pass all 13 gates. No calibration output is exact white or
gamut limited. Rejected run `000300` led only to correcting the material-input
plateau threshold to `0.55%`, consistent with the accepted approximately
`0.53%` native observer-projection uncertainty; the transform was unchanged.

Immutable run `000302-spectral-color-local-light-record` accepts that reusable
four-condition evidence (artifact set
`dedb03462344654252096e9879972bfa21a3328ba0b18b5c6db9dfd4bc4cb9c1`). The
manifest-verified Stage 1 ledger already contained direct Algorithm32 results at
all four exact clock instants, so no new atmosphere execution was needed. The
record retains transported direct spectrum, visible support, spectral
irradiance, `E_v`, `L_A`, and complete condition identity. The next step is the
four-frame atmospheric-context review using those records.

The project owner subsequently selected CIE 170-2 MacLeod-Boynton chromaticity
to supply the missing cone-to-color separation. Immutable run
`000306-spectral-color-macleod-boynton-display-proof` (artifact set
`9fb4d544e7126580e30d981c2a5ca5e9ba6729d759b4834d679b5d97ec1d78bf`)
accepts the numerical bridge. It applies the receptor response once to the
cone-fundamental luminance `Y_F`, not independently to L, M, and S, while
retaining CIE-standard `l_MB` and `s_MB` chromaticity through display
reconstruction and explicit same-Y gamut containment. This supersedes direct
interpretation of nonlinear cone responses as linear display LMS.


## Camera Boundary

Camera response is structurally parallel but not part of this prerequisite.
Measured sensor quantum-efficiency curves replace LMS; aperture, shutter,
lens transmission, pixel area, and wavelength-to-photon conversion determine
photoelectrons; read noise/black level defines the lower operating boundary;
full-well capacity defines saturation; and analog/digital gain plus development
defines encoding. Those mechanical values should be placed in separate camera
fixtures after the eye reference is tested. They may reuse the spectral
integration and curve-sweep harness but cannot determine eye parameters.
