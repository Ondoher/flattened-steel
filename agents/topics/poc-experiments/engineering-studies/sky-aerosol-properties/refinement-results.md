# Aerosol refinement execution

Status: active. The owner selected the reviewed refinement plan for independent
execution. Production source, selected cache and earlier evidence remain read-only.

## Current boundary

M1 authenticated the completed N1 screen and executed the two-ray spherical
libRadtran and single-band GPU pilots (00004/00005). The full-band observation
in 00006 exposed an experimental view-shader constant-reuse bug; its multi-band
output is invalidated, preserved and excluded. The corrected observer recreates
its wavelength-dependent shader for each channel. Production recurrence is unchanged.

Run 00007 is collecting repeated external Native15 references. Run 00008 is the
eleven-profile N1 screen. At fixed aerosol column, H=1800/2400 m initially raises
away-horizon N1 luminance by about14%/23%, with negligible near-Sun loss. These are
first-order sensitivities; M1 qualification and conditional M3 remain open.

The frozen controls, numerical gates, glow guard and adaptive scope are owned by
[the plan](refinement-plan.md). The first campaign remains owned by [results](results.md).

## Decisions

- Preserve every earlier run and existing dirty production change.
- Keep new implementation, output and solver work within this experiment's roots.
- Use the installed external solver; its availability does not qualify accuracy.
- Treat order limits, numerical error and atmospheric changes separately.

## M2 first-order screen

Run [00008](../../../../../tmp/experiments/sky-aerosol-properties/runs/00008-refine-screen/metrics.tsv)
completed all eleven profiles, 286 direct spectra and 22 GPU fields. Source and
full numerical controls are in its immutable registration and manifest.

| Change from combo025 | Horizon Y change | Near-Sun Y change | Glow change | Disposition |
| --- | ---: | ---: | ---: | --- |
| H1800 m, fixed column | +14.0% | +0.12% | +0.004% | Promising vertical redistribution |
| H2400 m, fixed column | +23.0% | +0.19% | +0.003% | Strongest brightness lead |
| alpha0 / alpha0.4 | −0.57% / −0.28% | +0.87% / +0.39% | <+0.08% | Mostly spectral hue, not brightness |
| alpha1.2 | +0.27% | −0.31% | −0.03% | Warmer hue, small brightness effect |
| Loading10% / 15% / 20% | +35.7% / +21.7% / +9.9% | −53.1% / −35.3% / −17.6% | −9.5% / −4.8% / −1.9% | All exceed absolute-glow loss guard |
| SSA0.98 / 1.0 | +0.16% / +0.26% | +2.8% / +4.7% | +0.25% / +0.41% | Real but weak horizon lever in N1 |

The vertical changes preserve the aerosol column and solar surround. Reducing
loading brightens the horizon at a substantial absolute solar-glow cost even when
contrast remains acceptable. Neither is yet a full-scattering atmospheric choice.

## M1 numerical findings and permitted refinement

The corrected full-band cache in 00009 and its [actual field gallery](../../../../../tmp/experiments/sky-aerosol-properties/runs/00010-refine-colors/comparison.html)
show a noon away-horizon increase from4192 to5943cd/m² between cached N1 and
N1–4. Near-Sun luminance rises from14468 to14691cd/m²; contrast changes from1.795
to1.775. Final-view96→192 refinement changes selected luminance by at most0.048%.

The independent Monte Carlo pilot/full screen (00011/00012) places the horizon
around6267cd/m² and the first external Native15 result is6347cd/m². These are not
yet the final uncertainty-qualified means. The cache's roughly5% horizon deficit
fails the2% numerical target, so its absolute horizon accuracy is held.

The plan's single path and angular refinement diagnostics were exercised at
unchanged material. The initial120-interval call (00013) was rejected by the
production compiler's fixed60 contract; it is preserved as failed. A generated
experiment-only copy admitted120 (00014), changing the green-band N1–4 horizon
by−0.15%, which does not explain the deficit. Increasing incoming quadrature
from68 to272 directions (00015), at the original60 intervals, moves that band from
0.089128 to0.093875W m^-2 sr^-1 nm^-1, close to the independent0.093935 pilot mean.

Decision: extend this one angular diagnostic to all bands and conditions before
using it for physical comparisons. Keep the68-direction outputs as controls.
This is experimental numerical qualification, not a production algorithm update.
The higher-photon independent repeat (00016) is reducing reference uncertainty.
No further cache-design branch is enabled.

The completed00016 independent repeat and272-direction full spectrum now place
the noon horizon at6284 versus6277cd/m² (−0.11%), and the3° ray at6637 versus
6659cd/m² (+0.33%). The solar-offset1°/5° cache values are+1.29%/+1.88% higher.
All-band uncertainties and per-ray target dispositions are being assembled.

## M3 active finalist and bounded follow-on

H2400 is the initial finalist. Both it and the unchanged atmosphere now have
full-band272-direction caches, protected-condition fields and direct N1 controls.
The current cache shows horizon changes of+14.25% at5m, +6.63% at500m,
+15.54% with a15° Sun, and−2.55% at2km. The registered glow guard passes; the2km
solar-surround luminance increases75.6%. Independent order probes across these
conditions and external column/photon controls remain active.

One adaptive physical question is earned: would H1800 retain a useful ground-level
gain while reducing the2km horizon penalty? After the serial GPU queue, allow one
H1800 full-cache check at the same272/60 policy. Advance to targeted independent
noon/2km confirmation only if its ground-level gain is at least5%, its2km horizon
penalty improves by at least0.5 percentage point over H2400, and the glow guard
passes. Otherwise report the unsuccessful compromise test without expanding the
height sweep. This is a bounded material test, not another numerical-grid branch.

## Verification and checkpoints

Local type check passes. Cache/direct reconstruction and higher-order reference
qualification remain open. Dedicated standards review is disabled for this study.

Local recovery checkpoint: `b00c7f40` — `checkpoint: preserve Flat32 updates and
aerosol refinement setup`. It includes the earlier completed app work, first screen
and this runnable setup. Git's whitespace diagnostic reported CRLF/trailing-space
warnings; the commit succeeded. No push was performed.
