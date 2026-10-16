# H41: Residual Horizon Tint Before And After Display

Owner-selected diagnosis after [H39](flat-local-aerosol-results.md) and
[H40](distant-aerosol-results.md). Reuse their accepted independent N1 spectra;
do not change the atmosphere, production or earlier evidence.

## Registered Method

Recompute independent bin-integrated CIE XYZ and signed linear sRGB from every
saved ray. Retain luminance and chromaticity before gain, after the production
p2 achromatic gain, and after its per-channel display mapping. Interpret final
PNG code values with the standard sRGB decoding curve to estimate nominal
display-linear RGB/XYZ. This is a diagnostic of the saved images under an sRGB
viewing assumption, not a measurement of the owner's monitor or visual adaptation.

Normalize before/after linear RGB to the same Y only for diagnostic swatches,
then encode those swatches with standard sRGB. Keep original physical luminance
and actual p2 output separately. Include a neutral D65 reference and the source
spectrum's chromaticity, without choosing a new white balance or neutralizing
the measured spectrum. Use R/B and CIE xy as numerical descriptors, not perceptual
error scores. Separate source-relative spectral change from display change.

Use the exact baseline illuminance of each parent image and authenticate its
derivation. Check matrix inverse consistency, sRGB round trips, neutral preservation,
unchanged chromaticity under scalar gain and reproduction of retained CIE colors.
Cross-check the production midpoint/rounded-matrix projection separately against
an independently coded midpoint calculation. The main swatches use a common
bin-integrated CIE input to isolate display mapping; the local parent's original
projection convention is retained in the additional projection controls.
Retain every ray/case reading; show away-facing zero-aerosol 0.05-, 3- and
20-degree colors for both geometries. No new transport integration or GPU job is
needed. Write derivatives into a new immutable run with complete parent identities.

## Outcome

Accepted [run 00290](../../../../../tmp/experiments/sky-accuracy-dials/runs/00290-h41-tint/sealed.json)
contains 126 saved-ray color diagnoses and 126 projection controls. The earlier
accepted 00289 retains the initial common-CIE diagnostic; 00290 adds the
projection control after discovering that H39 and H40 used different projection
conventions. Both are preserved. Neither reruns atmospheric transport.

The [comparison swatches](../../../../../tmp/experiments/sky-accuracy-dials/runs/00290-h41-tint/comparison.svg)
show before/after display color at identical nominal screen Y=0.35 in the first
two columns. The third retains p2 brightness for that same common independent
CIE input. These are sampled diagnostic colors, not new scene captures or
pixel-exact reproductions of H39's original projection. Neutral and source chips
provide color references; the source spectrum is not normalized to D65.

## What Creates The Remaining Warmth?

At zero aerosol, the lowest away-facing horizon is warm before display mapping.
Both the independent bin-integrated projection and production midpoint projection
show this. The display softens that horizon warmth; it does not introduce it.

Linear red/blue ratio at 0.05 degrees (neutral D65 is 1.0):

| Geometry | Independent physical color | Production projection | Common-CIE input after p2 and sRGB decoding | Production projection after p2 and sRGB decoding |
| --- | ---: | ---: | ---: | ---: |
| Local | 1.3966 | 1.3723 | 1.2717 | 1.2503 |
| Distant | 1.2390 | 1.2189 | 1.1594 | 1.1432 |

H39's local image uses the production projection, while H40's distant independent
image uses the common bin-integrated projection. The production projection
reduces the horizon R/B by about 1.7% locally and 1.6% distantly; it does not
create the red excess. Its greatest R/B difference across all 126 records is
1.744%. The p2 scalar gain preserves chromaticity; the hue change occurs in the
per-channel mapping and its nominal screen interpretation.

The source spectrum itself has chromaticity (0.32151, 0.33081) and independent
linear R/B=1.1327, compared with D65 (0.31270, 0.32900) and R/B=1.0. Under the
same independent projection, the local horizon's R/B is another 23.3% above
the source ratio, and the distant horizon another 9.4%. The declared source is
already warm relative to this display reference; spectral transport changes
the balance further. These are descriptive ratios, not an additive causal split
of source and atmospheric mechanisms or a reason to replace the source spectrum.

## Why The Band Can Still Stand Out

The mapping has a different effect on the darker higher sky. At 20 degrees,
independent R/B changes from 0.3663 to 0.2077 locally and 0.3646 to 0.2154
distantly: the nominal displayed sky becomes more strongly blue. Consequently,
the horizon-to-20-degree R/B contrast increases by about 61% locally and 58%
distantly, even though the horizon itself becomes less warm. These percentages
are computed as `(screen horizon RB / screen 20-degree RB) /
(physical horizon RB / physical 20-degree RB) - 1`, using the retained summary.
This could make the remaining band stand out by contrast; that perceptual effect
has not been measured on the owner's display.

The original 100%-aerosol lowest rays are cooler than D65 in both physical and
nominal screen color: local R/B=0.8172 before mapping and 0.7286 afterward;
distant 0.8456 and 0.7752. Their subdued gray appearance and the warmer
zero-aerosol horizon are distinct measured color/brightness outcomes.

## Evidence And Qualification

[readings.json](../../../../../tmp/experiments/sky-accuracy-dials/runs/00290-h41-tint/readings.json)
retains physical XYZ/RGB, gain, output codes, nominal screen color and source
reference for every ray/case.
[projection-controls.json](../../../../../tmp/experiments/sky-accuracy-dials/runs/00290-h41-tint/projection-controls.json)
retains the production-projected colors and independent parity checks.
[summary.json](../../../../../tmp/experiments/sky-accuracy-dials/runs/00290-h41-tint/summary.json)
owns the plotted witnesses and actual swatch values.

Retained physical CIE values reproduce within 3.69e-16 relative; scalar-gain xy
drift is at most 1.12e-16. Neutral preservation, sRGB round trips and matrix
inverse consistency pass. The production projection agrees with the independently
coded midpoint/rounded-matrix projection within 2.55e-15 relative. No gamut
clipping was needed for the equal-Y swatches. Original lux inputs and the exact
H40-recorded p2 implementation graph were authenticated.

00290 took 7.697 seconds through seal/cleanup and 9.832 seconds including final
verification. 00289 took 8.715 seconds including verification. No GPU job or
new scattering calculation ran. Scratch was removed in both runs and retention
remains within the experiment budget. This qualifies color-stage arithmetic
under the declared N1 inputs and nominal sRGB viewing assumption; it does not
validate atmospheric realism, full multiple scattering, observer adaptation,
monitor calibration or a new production default.

Run `node experiments/sky-accuracy-dials/horizon/tint.mjs` to derive a new report.
The local type check and configured formatting check pass. The bounded
implementation/results review baseline and final evidence live under
`.codex-tmp/review-standards/session-lTSUXY/`; native validation separately owns
the source-completion gate. No production edit or further experiment is selected.
