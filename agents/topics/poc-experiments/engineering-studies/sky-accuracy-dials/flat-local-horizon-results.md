# Independent Flat/Local Horizon Expectations

## Conclusion

The independent calculation predicts the same subdued, slightly cool local N1
horizon seen in current production for San Jose closest. **This evaluation does
not establish that production is wrong.** Its selected single-scattering result
agrees with the independent reference across all 18 registered rays. Agreement
validates the tested numerical implementation under shared physical assumptions;
it does not validate the hypothetical atmosphere against an observed natural sky.

The [actual side-by-side images](../../../../../tmp/experiments/sky-accuracy-dials/runs/00284-h36-h37-report/comparison.svg)
use the current app camera, scene, medium, point source, observer-ray domain and
display on both sides. The right image replaces cache-based transport with
independent continuous N1 integration. Neither exposure nor color was fitted.
The [physical luminance plot](../../../../../tmp/experiments/sky-accuracy-dials/runs/00286-h37-figures/luminance.svg)
and [chromaticity plot](../../../../../tmp/experiments/sky-accuracy-dials/runs/00286-h37-figures/chromaticity.svg)
separate brightness from hue; connecting lines guide the eye between computed
rays and do not claim a densely sampled all-order image.

Current production remains unchanged. No cache correction or promotion is selected.

## Frozen Problem And Independence

Qualified capture [00281 registration](../../../../../tmp/experiments/sky-accuracy-dials/runs/00281-h34-h37-local/registration.json)
records the freshly bundled current source, San Jose Flat 0/closest, observer
height 5 m, actual compact-v9-native15 policy and actual N1 order. It retains
source position near (0, −1541849.612, 4828032) m, source spectrum/reference
distance, atmosphere, camera, uniforms, renderer and shader. The cache reports
1049 receiver positions and 15 spectral channels. Setup timing belongs to the
[execution performance record](flat-local-horizon-execution.md#performance-evidence-and-handoff).

The declared model is an unpolarized point emitter with inverse-square dilution,
an infinite horizontal 100 km exponential slab, Rayleigh height 8 km, aerosol
height 1.2 km, Cornette–Shanks g=0.7, aerosol single-scattering albedo 0.8 and
no ozone absorption. Source normalization distance is 4800 km. The exact current
molecular/aerosol coefficients and Native15 solar packet are frozen data; do not
call this an exact continuous paper spectrum merely because aerosol controls
match the paper. The visible solar disc and the point-source atmospheric
illumination approximation are distinct. All-order controls use black ground.

Independent host transport imports no production density, phase, cache,
coordinate lookup or view integrator. It uses authenticated physical inputs and
the earlier independent math. A separately coded browser transport evaluates
continuous N1 from physical data, exact exponential columns and logarithmic Gauss
quadrature. Shared inputs, generic quadrature and common display remain explicit
dependencies; this is numerical independence, not independent empirical physics.

There are six elevations (0.05°, 0.25°, 1°, 3°, 10°, 20°) at toward/cross/away
azimuths. Retained directions/endpoints establish the actual rays, including the
observer dome. These registered center rays have long atmospheric endpoints,
not intervening review-object hits. Camera-ray cutoffs do not constrain secondary
scattering paths in the independent physical slab.

## Matched N1 Agreement

The accepted [evaluation](../../../../../tmp/experiments/sky-accuracy-dials/runs/00284-h36-h37-report/evaluation.json)
preserves signed spectra, CIE color, brightness ratios, uncertainty estimates and
per-quantity classifications. All tested quantities are inside their registered
practical tolerances:

| Quantity | Largest observed discrepancy | Registered tolerance |
| --- | ---: | ---: |
| App versus independent luminance, 18 rays | 0.5515% | 2% |
| Individual spectral bin, 270 values | 1.5531% | 2% above signal floor |
| CIE x | 0.000297 | 0.002 |
| CIE y | 0.000261 | 0.002 |
| Horizon/10° luminance ratio | 0.2681% | 2% relative |

The host 64/128-node refinement change is at most 1.17×10⁻¹⁵ relative on these
rays. This is an empirical refinement observation, not a rigorous absolute error
bound. The independently generated 128-node GPU shader matches host spectra on
checked image-center rays within **0.000433%**. Manufactured controls cover
exponential columns, phase normalization, boundaries, vacuum, homogeneous Beer
integration and source normalization. The full declared Native15 basis is used
for color; no three-band estimate is presented as full color.

## Why This Model Produces A Subdued Horizon

Away from the Sun, the reference N1 readings are:

| Elevation | Luminance, cd/m² | CIE x, y | Light-weighted last-scatter altitude |
| --- | ---: | --- | ---: |
| 0.05° | 1932.72 | 0.29948, 0.31443 | 18.3 m |
| 3° | 2974.55 | 0.31188, 0.33070 | 3092 m |
| 10° | 2506.15 | 0.27628, 0.29634 | 6059 m |
| 20° | 1702.95 | 0.26197, 0.27628 | 6740 m |

The low horizon is **35.0% dimmer than 3°** and **22.9% dimmer than 10°** in
physical luminance, before tone mapping. Its CIE coordinates indicate a modest
cool tint; the more neutral 3° band is brighter. Brightness and hue are separate
measurements, so a neutral-looking band need not be white at the selected exposure.

At 0.05°, **96.1% of N1 luminance comes from within 50 km**, and over 99.8% from
within 100 km. The light-weighted last-scatter distance is 15.3 km. The low ray
remains in the dense near-ground mixture, while the 3° ray samples much higher,
more Rayleigh-dominated air. Rayleigh supplies about 66.8% of the low-ray N1
luminance, versus 83.1% at 3°; aerosol scattering supplies the remainder at the
same total extinction.

The physical balance is the local in-scattering source versus extinction along
the observer path. The forward-peaked aerosol phase law redirects relatively
little source light into these large-angle views, while aerosols still extinguish
light and absorb the fraction allowed by their 0.8 albedo. A long horizontal
path therefore does not simply accumulate indefinitely brighter or redder light.
It suppresses remote contributions and approaches the source/extinction balance
of the nearby low layer. The registered species/path attribution explains the
computed balance; a quantitative claim about changing aerosol physics would still
require a separate controlled physical intervention.

Both legs are retained. For the low away ray, the light-weighted in-medium solar
leg is about 105 km, source optical depth about 0.183 and observer-leg optical
depth about 1.004. These are weighted means across wavelength and scattering
position; exponentiating a mean does not give the mean transmission. Most of the
roughly 5068 km source distance is outside the atmosphere. Looking along this ray
is predominantly seeing nearby illuminated scatterers through an optically thick
layer, rather than seeing remote unlit atmosphere directly.

Extending the initial view beyond the app dome changes these N1 luminances by at
most about **0.0086%**. Dome truncation does not explain this tested N1 horizon.
This does not claim a universal multiple-scattering boundary-error bound.

## Independent Multiple-Scattering Expectations

The earlier accepted GPU all-order run 00267 is reused after checking every
physical transport input. The source-position difference is only binary64
rounding (about 2.3×10⁻¹⁰ m); its actual Float32 GPU inputs are identical, and
host N1 sensitivity is below 10⁻¹² relative. The
[compatibility record](../../../../../tmp/experiments/sky-accuracy-dials/runs/00284-h36-h37-report/compatibility.json)
preserves that qualification. No old run is altered or presented as newly computed.

These are independent **infinite-slab** expectations on three away rays, with
all scattering orders in expectation and compensated roulette. They are not a
same-order comparison against current N1 or an all-order full-frame render.
The following marginal 95% intervals describe sampling only:

| Elevation | Continuous N1 Y | All-order Y ± half-width, cd/m² | All-order mean batch x, y |
| --- | ---: | ---: | --- |
| 0.05° | 1932.72 | 3366.77 ± 22.52 | 0.28115, 0.29422 |
| 3° | 2974.79 | 4687.68 ± 11.45 | 0.28742, 0.30299 |
| 20° | 1702.95 | 2439.10 ± 5.00 | 0.24487, 0.25016 |

All-order luminance half-widths are below 0.67%; x/y half-widths are below 0.00080
for these three witnesses. Later scattering brightens the 0.05° horizon by about
74% relative to N1, but shifts it **toward blue**, not orange. The all-order low
horizon remains about 28% dimmer than the 3° band. N5 and later contribute only
about 0.84% of the low-ray all-order luminance. This quantifies the selected
single-scattering approximation rather than identifying a cache reconstruction bug.

The earlier compatible Native30/60 controls and original CIE projection qualify
the sampled spectral reconstruction at selected rays; they cannot restore unknown
within-bin solar structure. Physical source/aerosol assumptions and reflective
ground remain separate model uncertainties. Three away rays do not certify the
entire all-order horizon in every azimuth.

## Display And Follow-On Decision

The image comparison holds the existing p2 illuminance gain and Bruneton
exponential display response fixed. Its right-hand image independently computes
transport, then deliberately shares the app's display and scene composition.
The physical spectra/XYZ/luminance comparison above is independent of that display.

All 31 retained H27 runtime/color dependencies, including Three and the raw shader
pass, match current hashes. The unchanged neutral-ramp GPU proof is reused in
[display qualification](../../../../../tmp/experiments/sky-accuracy-dials/runs/00284-h36-h37-report/display-qualification.json).
It establishes byte behavior; it does not establish that another gamma transfer
is required. The installed model declares its mapped values as display output.
An extra sRGB transfer would be a presentation counterfactual, not a correction
inferred from a preference for a whiter horizon. The physical brightness dip is
already present before display.

H38 yields no selected cache fix. The first goal is met scientifically for these
declared assumptions: there is an independently supported expected appearance
and a physical explanation. If the owner wants a different physical hypothesis,
the next useful experiment would vary aerosol phase/absorption or ground treatment
under controlled source normalization, or evaluate a matched finite-domain
all-order image. Do not search parameters for an orange target. Any eventual
full-cache change retains the separate paper-RMSE and twilight gates.

## Evidence And Verification

Capture 00281 remains **failed** because the parent edited the unexecuted report
evaluator and ambient declarations during rendering. The whole-tree guard caught
those changes. Its completed computational artifacts are qualified by separate
accepted [00285 recovery](../../../../../tmp/experiments/sky-accuracy-dials/runs/00285-h37-qualify/qualification.json):
all other experiment source identities and the actual bundled dependency graph
are unchanged, the changed evaluator is absent from the capture's executed imports,
declarations are not executable, and retained CPU/GPU controls pass. Recovery
preserves the failed parent state and saves the exact executed capture source.
This is scoped artifact qualification, not retroactive whole-run acceptance.

Accepted report 00284 adds all-order species/distance attribution to earlier
accepted derivative 00283; their capture input is explicitly qualified by 00285.
Setup attempts 00277–00280 remain failed; 00278 additionally fails the progress-gap
verifier. Report attempt 00282 retains the exact-identity rejection that led to
explicit rounding qualification. A rejected overlong recovery name created no run
or numerical output. Every existing run and artifact remains immutable.

The [execution performance record](flat-local-horizon-execution.md#performance-evidence-and-handoff)
owns timings, retention and resource measurements. Old all-order GPU batches were
reused rather than regenerated. Final mapped source
review is determined by `.codex-tmp/review-standards/session-dEqSA3/validation.json`;
scientific acceptance alone does not declare implementation completion.
[Execution notes](flat-local-horizon-execution.md) own decisions, verification
and checkpoint information.
