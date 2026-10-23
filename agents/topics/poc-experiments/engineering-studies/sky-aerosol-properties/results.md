# Aerosol properties — first campaign results

The independent N1 screen is complete. Reduced loading with less absorption can
brighten and neutralize the noon horizon while retaining solar glow. More forward
scattering can strengthen that glow. These results identify configurations for
full-scattering confirmation; they do not select a new production atmosphere or
establish what a measured clear sky should look like.

## Reviewable comparisons

- [Comparison gallery](../../../../../tmp/experiments/sky-aerosol-properties/runs/00003-visual-report/comparison.html)
- [Compact color comparison](../../../../../tmp/experiments/sky-aerosol-properties/runs/00003-visual-report/appearance-comparison.png): columns original, zero aerosols, combined candidate. Top row is the away-Sun horizon; bottom row is the solar surround at a shared lower exposure.
- [Physical spectra](../../../../../tmp/experiments/sky-aerosol-properties/runs/00003-visual-report/spectra.svg): absolute spectral radiance and equal-luminance spectral shape.
- [All ray metrics, TSV](../../../../../tmp/experiments/sky-aerosol-properties/runs/00001-property-refine/metrics.tsv)
- [Verified summary](../../../../../tmp/experiments/sky-aerosol-properties/runs/00002-verify-report/summary.json)

The images are diffuse first-order angular sky fields, not app screenshots.
There is no direct solar disk or scene geometry. The solar panels use azimuth and
elevation coordinates, which stretch horizontal angular structure near the high
Sun; they should not be interpreted as perspective halo shapes. Primary images
retain the original P2 response and fixed illuminance of 117791.53 lux. The solar
comparison uses one additional exposure multiplier of 0.125 for every setting,
because the primary near-Sun display otherwise approaches white. Raw float RGB,
primary images and bracket images remain available for every field.

## M1 — Physical controls and interpretation

The baseline is the authenticated San Jose solar-noon spherical geometry from
H40, Sun elevation about 76.1 degrees, observer height 5 m. The original exponential
medium has beta=0.04, SSA=0.8, Cornette–Shanks g=0.7, aerosol scale height 1200 m
and molecular scale height 8000 m. Native15 source and spectra, black ground and
disabled gas absorption remain fixed. The vertical distribution is unchanged.
Different media are atmosphere choices, not atmospheric-algorithm corrections.

The earlier baseline reproduces exactly. The species control gives zero change
in the molecular N1 term at fixed extinction, and aerosol N1 scales with SSA to
4.22e-15 relative residual. Thus raising SSA at fixed extinction adds aerosol
scattering while removing the same amount of absorption. The separate
beta=0.032/SSA=1 endpoint holds original aerosol scattering fixed while reducing
extinction; its interpretation is distinct.

Disposition: controls accepted. A single independent plan critique was completed
and all five recommendations were incorporated; no standards reviewers or audits
were started.

## M2 — Noon sensitivity and bounded follow-on

Horizon values below refer to the away-Sun ray at 0.05 degrees elevation.
Glow contrast is the mean diffuse luminance at Sun offsets 0.5/1/2 degrees divided
by the mean at 5/10 degrees toward zenith. It excludes the disk and is a sparse
radial diagnostic, not integrated annular flux or total solar brightness.

| Setting | Original extinction fraction | SSA | g | Horizon Y, cd/m² | Change in horizon Y | Horizon xy | Glow contrast |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| Original | 100% | 0.80 | 0.70 | 2187.13 | baseline | 0.30170, 0.31619 | 1.208 |
| Zero aerosols | 0% | 0.80 | 0.70 | 7283.11 | +233.0% | 0.32687, 0.34442 | 1.026 |
| No aerosol absorption, fixed extinction | 100% | 1.00 | 0.70 | 2373.78 | +8.5% | 0.30541, 0.31944 | 1.214 |
| No absorption, original scattering retained | 80% | 1.00 | 0.70 | 2654.70 | +21.4% | 0.30525, 0.31976 | 1.208 |
| Reduced loading | 25% | 0.95 | 0.70 | 4539.55 | +107.6% | 0.31403, 0.33016 | 1.162 |
| Broader scattering | 50% | 0.95 | 0.55 | 3964.42 | +81.3% | 0.31518, 0.32928 | 1.074 |
| More forward scattering | 50% | 0.95 | 0.85 | 2876.24 | +31.5% | 0.29959, 0.31616 | 1.882 |
| Combined candidate | 25% | 0.95 | 0.85 | 4219.78 | +92.9% | 0.31035, 0.32719 | 1.802 |
| Lower-loading combination | 10% | 0.95 | 0.85 | 5724.14 | +161.7% | 0.31969, 0.33683 | 1.630 |

Observations and interpretation:

- Removing absorption alone is a modest brightness change at this ray. It does
  not establish an explanation for the production brown/gray color. The original
  N1 horizon here is on the blue side of D65; its physical spectrum and its final
  displayed color must be distinguished from the full N4 scene.
- Lower loading has a larger brightness effect. At 25% loading/SSA0.95/g0.7 the
  horizon chromaticity is close to D65 white, while the sparse glow contrast is
  only 3.8% below the original and clearly above the zero-aerosol control.
- Broader scattering moves the horizon toward white but weakens the glow. The
  more forward shape strengthens the glow but leaves the 50%-loading horizon bluer.
- These separate effects earned one bounded interaction test: combine lower
  loading with the forward shape. The 25%/SSA0.95/g0.85 combination has a near-neutral
  noon horizon and 49.1% more glow contrast than the original. Its absolute radiance
  remains in the retained spectra; contrast alone is not a brightness measurement.

Disposition: retain the combined candidate and the simpler 25%/SSA0.95/g0.7
comparison for subsequent full-scattering work. Do not promote either from N1.
Reject absorption alone as a complete explanation within this screen, and reject
the broad-phase branch as a simultaneous improvement to both selected visual goals
at the sampled noon condition. These are order-limited dispositions.

## M3 — Height and lower Sun challenge the simple explanation

Height and Sun angle were changed separately. At noon/500 m, original and zero
controls plus no-absorption and 50%/SSA0.95/g0.7 cases were compared. Raising SSA
to one brightens the selected horizon by 6.5%; halving loading with SSA0.95
brightens it by 47.9%, with glow contrast 1.7% below the matched original.

At Sun elevation 15 degrees and observer height 5 m, the same controls were
compared. Removing absorption brightens the selected horizon by 5.4%; halving
loading with SSA0.95 brightens it by 79.3%, while essentially preserving the
original glow contrast. However, the horizon becomes warmer in physical
chromaticity. Removing all aerosols is warmer still. This does not support a
general rule that aerosols alone cause a warm horizon or that removing them
necessarily whitens it.

The forward-shape combinations were tested at noon only. Their higher-altitude,
lower-Sun and full N4 behavior remains unresolved. The 15-degree case is a synthetic
controlled lower-Sun geometry, not a matched San Jose sunset timestamp.

Disposition: first campaign complete; retain the useful noon lead with its
geometric and order limitations. A matched full N4 cache/render and libRadtran
comparison is the next confirmation campaign, not an already established result.

## Evidence, cost and recovery

- `00000-property-screen`: deliberately interrupted pilot, retained as failed.
  All eleven noon CPU packets and early images remain intact. Saturated solar
  output and roughly 40-second repeated shader compilation motivated a new run.
- `00001-property-refine`: accepted. Authenticates and reuses the pilot's closed
  CPU packets after checking unchanged numerical implementations, then adds two
  interaction settings, the geometric challenges, raw float output and common
  exposure brackets. One uniform-controlled GPU program preserves the equations
  and quadrature while eliminating repeated compilation. This continuation took
  168.894 seconds, excluding initial setup and the preserved pilot.
- `00002-verify-report`: accepted read-only verification and numerical report.
  There are 420 converged ray spectra and 42 GPU fields. Maximum GPU/CPU spectral
  relative difference is 8.811e-6 (0.000881%). Maximum active progress gap is 24.738 s.
- `00003-visual-report`: accepted actual-image and spectral-plot derivation.
  All 42 raw float fields have the expected size and zero non-finite values.

The local experiment type check and scaffold check pass. Hashes, runtime/tool
identities, physical inputs, parent derivation and artifact identities are retained
in the run manifests. The preserved H40 geometry/spectra are inputs; the suspended
Sky Accuracy Dials experiment was not reopened or modified.

No full cache was built by this campaign. The recent production package rebuild
took about ten minutes and retained about 685 MiB, which is context rather than
a measured estimate for each new aerosol configuration. Build time, memory and
size must be measured during the confirmation work; they are reportable costs,
not scientific rejection criteria. No production source, package selection,
atmosphere setting or runtime behavior changed in this experiment.
