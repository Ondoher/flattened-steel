# Color Reset Design

Focus: Colorimetry, perception, adaptation, and camera premises.

## Published Twilight Reference Boundary

CR4I uses two primary publications as physical-shape checks, never as display
or exposure targets.

Koomen et al., *Measurements of the Brightness of the Twilight Sky*, JOSA 42
(1952), measured clear-sky photopic brightness and plane illumination for
solar altitudes from `+5` through `-15` degrees. Its Sacramento Peak zenith
series and horizontal-plane illumination series are retained in the fixture
with their original units and explicit conversions. The strongest reported
relationship is approximately one decade of physical sky-brightness loss per
two degrees of solar-altitude decrease from about `-3` to `-11` degrees. The
late values approach the instrument's photopic limit, so the experiment uses
the series as a normalized logarithmic trend rather than an absolute oracle.

Patat, Ugolnikov, and Postylyakov, *UBVRI twilight sky brightness at
ESO-Paranal*, A&A 455 (2006), provides zenith-region polynomial fits over
solar zenith distance `95 <= zeta <= 105` degrees. For each band,

```text
m_f(zeta) = a0 + a1 * (zeta - 95) + a2 * (zeta - 95)^2
```

in magnitudes per square arcsecond. The retained coefficients are:

| band | `a0` | `a1` per degree | `a2` per degree squared | fit RMS | early slope |
| --- | ---: | ---: | ---: | ---: | ---: |
| U | `11.78` | `1.376` | `-0.039` | `0.24` | `1.23 +/- 0.01` |
| B | `11.84` | `1.411` | `-0.041` | `0.12` | `1.24 +/- 0.01` |
| V | `11.84` | `1.518` | `-0.057` | `0.18` | `1.14 +/- 0.02` |
| R | `11.40` | `1.567` | `-0.064` | `0.29` | `1.09 +/- 0.03` |
| I | `10.93` | `1.470` | `-0.062` | `0.40` | `0.94 +/- 0.03` |

Within one band, normalized physical flux is
`10^(-0.4 * (m_f(zeta) - m_f(95)))`. UBVRI magnitudes are not linear sRGB,
CIE Y, or candelas per square metre. A direct Native15-to-UBVRI comparison
would require authenticated band responses and zero points, so the first check
shows the five normalized publication curves as chromatic context and compares
only broad raw-field/receiver-light slopes. The fixed camera does not contain
the true zenith; its upper-sky statistic is explicitly a non-matched-direction
report, not a Patat residual.

Both references describe different sites, altitudes, atmospheric states,
view directions, and measurement systems. One hour before sunset is above
Koomen's `+5`-degree boundary and cannot be supplied by extrapolating either
paper. Bruneton remains its display authority. No publication value enters a
runtime equation, parameter solve, image normalization, pass/fail pixel
target, or RMSE.


## Explicitly Deferred

- production promotion or compatibility bridges;
- automatic or temporal exposure;
- camera emulation, named cameras, lens glare, bloom, and sensor noise;
- Moon and planet appearance;
- atmosphere, ozone, cache, quadrature, or Q30 retuning;
- animation and cache-swap scheduling beyond static state checks; and
- population-level psychophysical validation.
