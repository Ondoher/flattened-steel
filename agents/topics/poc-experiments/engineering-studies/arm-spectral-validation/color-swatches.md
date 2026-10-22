# Matched zenith color swatches

These compare the same ARM SGP zenith direction and the same two observation
windows on 22 August 2023. Columns are ARM measured, libRadtran full-profile,
and corrected production-cache probes. They are not horizon measurements.

- [Common exposure image](../../../../../tmp/experiments/arm-spectral-validation/runs/00038-zenith-swatches/common-exposure.png)
- [Equal-luminance image](../../../../../tmp/experiments/arm-spectral-validation/runs/00038-zenith-swatches/equal-luminance.png)
- [Vector common-exposure image](../../../../../tmp/experiments/arm-spectral-validation/runs/00038-zenith-swatches/common-exposure.svg)
- [Colors, luminance, transform and checks](../../../../../tmp/experiments/arm-spectral-validation/runs/00038-zenith-swatches/colors.json)
- [Underlying spectra](../../../../../tmp/experiments/arm-spectral-validation/runs/00038-zenith-swatches/spectra.json)

Top row: pilot, 22:20–22:24 UTC. Bottom row: reserved, 22:00–22:04 UTC.
Common exposure preserves brightness differences; the second image normalizes
each swatch to the same luminance to isolate hue. Hues are similar after that
normalization. ARM is darker in the common-exposure view.

## Derivation

The [visible extension](../../../../../tmp/experiments/arm-spectral-validation/runs/00034-visible-inputs/contract.json)
preserves the frozen atmosphere and viewing geometry. A common 26-node spectral
representation covers 400–800 nm, using 20 nm spacing plus the original nine
channels. GPU computation adds only 17 production channels, reusing the earlier
nine read-only. Two libRadtran full-profile cases extend all 26 wavelengths;
their original nine channels replay exactly.

ARM is averaged into the same nominal 4 nm bands, clipped at the 400/800 nm
endpoints. Each spectrum is reconstructed linearly and integrated against the
original CIE 1931 2-degree matching functions on 1 nm cells, using the exact
integral of the two linear functions' product. Input mW converts to W, with
683 lm/W. XYZ converts to signed linear sRGB/D65 and standard sRGB encoding,
without white balance or chromatic adaptation.

One exposure gain, 0.0001886764314304738, applies to all six primary swatches.
It places the largest linear RGB component across the figure at 0.85. Separate
equal-luminance swatches isolate hue. Neither image clips a gamut channel.
D65-white and color-linearity controls pass; both rendered images were inspected.

| Window   | ARM luminance | libRadtran luminance | Production luminance |
| -------- | ------------: | -------------------: | -------------------: |
| Pilot    |        1571.0 |               2507.5 |               2573.1 |
| Reserved |        1787.1 |               2722.2 |               2867.3 |

Luminance is cd/m2 over 400–800 nm. The common representation changes ARM
luminance by less than 0.26% versus its native measured spectrum; the color
record retains the corresponding chromaticity shifts.

Colors remain conditional. Below 440 nm, phase, SSA and albedo use the nearest
440 nm retrieval, not an invented measurement. Continuum models omit some gas
absorption present in measured spectra. Every color excludes visible tails
outside 400–800 nm. The [original comparison's](results.md) calibration, profile,
operator and scattering-order limits still apply. Similar hue does not
establish absolute spectral accuracy.

## Preservation and verification

Runs 00034, 00035, 00037 and 00038 retain inputs, GPU channels, libRadtran spectra
and swatches. Run 00036 preserves a failed bundle: Windows CRLF made the old
solver parse `NULL` incorrectly. The writer now uses LF; the corrected run is
separate. No sealed run was modified. Host-owned sealing avoids the earlier
WSL small-file hashing delay. Python AST and local TypeScript checks pass.
Production source/assets/defaults are unchanged. No dedicated reviewers or
experimental test suite were introduced.
