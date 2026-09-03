# Spectral Color-Transform Experiment Plan

Status: superseded as the active execution authority on 2026-08-31 by the
[Color Reset Incremental Experiment Plan](color-reset-experiment-plan.md). This
document and every run it names remain read-only failure, diagnostic, and
reference evidence. Its former reset sequence does not authorize another
candidate or large experiment grid.

At this plan's retirement, the production comparison baseline was
`BrunetonSourceLuminanceLiftColorDisplayModel`, qualified by immutable runs
`000466` and `000467`. That production path has since been removed. Current
Color behavior and remaining qualification work are owned by the
[Production Color Reset Design](../algorithm32/production/color-reset-design.md)
and
[Production Color Reset Implementation Plan](../algorithm32/production/color-reset-implementation-plan.md).
The qualified one-degree point-local scene-cache inventory, Q30 live transport,
Native15 `preDisplayRadiance`, and shared post-108-degree dark state remain
fixed upstream inputs. Nothing in this superseded plan authorizes resuming its
rejected Step 3 mapper.

## Preserved Reset Basis: Bruneton Primary Engine

The project owner reset the active implementation direction after production
spectra proved that the old Stage 1 starting data was invalid. Begin from the
exact contained production `BrunetonColorDisplayModel` and no other experimental
Color implementation:

```text
captured production native-15 preDisplayRadiance
  -> Bruneton CIE 1931 native-15 projection
  -> Bruneton linear RGB
  -> Bruneton display mapping
  -> display RGB
```

Focused run `000339-spectral-color-production-sun-focused-scalar-candidate`
and wide run `000340-spectral-color-production-wide-scalar-candidate` contain
same-run `renders/replay/` images produced by precisely this path before the
separate scalar candidate was evaluated. Their replay controls agree with the
production mapper within `2.3925994763196456e-7` absolute and with the final
framebuffer within one 8-bit code. Freeze those Bruneton replay images as the
new visual base.

Ignore the prior CAM16 candidate, receptor, MacLeod-Boynton, fixed-exposure,
independent-channel, endpoint, and scalar candidates when constructing the new
lane. They remain immutable failure or diagnostic evidence, not runtime,
configuration, calibration, or oracle inputs. Retain CIECAM16 only as an
independent scientific reference for how appearance correlates change with
viewing state; it is not the active Color engine.

The project's original bounded idea is retained in corrected form. Valid
condition-wide local light controls a smooth achromatic response. Effective
black and white points are derived response crossings, such as `1%` and `99%`,
not independently selected RGB thresholds and not clips. The response produces
one common gain for Bruneton linear RGB. It may not operate three channels
independently, identify the Sun, or derive parameters from the output image.
Chromatic adaptation is a separate concern: initially keep the adapting white
fixed neutral. Do not use the warm direct-Sun spectrum as an adapting white,
because that could normalize away the sunset relationship. A later chromatic
adaptation experiment requires a defensible diffuse or scene-illumination
estimate.

### Reset Execution Plan

1. **Freeze the Bruneton base — complete.** Retain the focused and wide
   same-run production-spectrum replays from runs `000339` and `000340`. No
   candidate proceeds unless the unadjusted path continues to reproduce these
   controls within the accepted floating-point and one-code limits.
2. **Characterize light adaptation before choosing a curve - complete.** Use fixed
   physical test spectra and sweep adapting luminance logarithmically while
   holding stimulus XYZ, adapting-white chromaticity, surround, and display
   fixed. Record CIECAM16 `Q`, `J`, `M`, `C`, `s`, and hue as reference
   expectations. Run a second sweep in which stimulus and adapting level change
   together, so desired adaptation is not confused with cancellation of the
   actual noon-to-sunset signal. This is a reference table, not a CAM16
   renderer.
3. **Repair the Bruneton highlight seam before adaptation.** Keep the exact
   Bruneton CIE 1931 projection. Select a smooth monotonic luminance response
   whose input scale retains absolute and relative field luminance. Apply its
   gain commonly to RGB, but do not pass the result through Bruneton's existing
   independent-channel Figure-1 shoulders and do not normalize each pixel by
   its peak channel. Gamut containment must preserve the chosen display
   luminance rather than promote every out-of-gamut HDR pixel to peak. Prove the
   static mapper on focused and wide production fields before making its
   operating range depend on `L_A`. Report its low/high crossings, slope, and
   asymptotes. Only after the static seam passes may one shared curve-position
   parameter follow the reference adaptation progression; do not introduce
   per-channel endpoints.
4. **Use only valid condition state.** For the first photopic test, derive the
   condition-wide adapting-luminance input from newly acquired production-path
   local-light evidence. Do not consume Stage 1 spectra. Keep local-light
   magnitude separate from adapting-white chromaticity and retain units and the
   exact clock/geometry identity.
5. **Prove the transform numerically.** Require neutrality, monotonicity,
   continuity across the local-light sweep, one common pre-Bruneton RGB gain,
   finite output, bounded toe/shoulder behavior, and exact identity with the
   unadjusted Bruneton control at the declared reference state. Track hue and
   colorfulness changes caused by Bruneton's existing channel-wise exponential
   rather than attributing them to adaptation.
6. **Render the correct production fields.** Apply the frozen candidate to the
   same four focused and wide conditions used by the base. Judge disk,
   circumsolar field, wider sky, black fraction, highlight plateau, brightness
   progression, and color ordering. The project owner remains the appearance
   proxy. Do not tune from a disk-only crop.
7. **Defer mesopic vision.** The initial lane is photopic. When the two-hours-
   after-sunset case is activated, add a separately sourced photopic/mesopic
   transition with rod-weighted sensitivity and progressive loss of color. Do
   not simulate the Purkinje effect by moving RGB endpoints.

Scientific basis: [CIECAM16](https://www.cie.co.at/publications/cie-2016-colour-appearance-model-colour-management-systems-ciecam16)
supplies viewing-condition-specific perceptual correlates and chromatic
adaptation; [Stockman et al.](https://doi.org/10.1167/6.11.5) show that cone
light adaptation across large intensity ranges uses multiple sensitivity
mechanisms, not one clip; [CIE 191:2010](https://www.cie.co.at/publications/recommended-system-mesopic-photometry-based-visual-performance)
distinguishes the changing spectral sensitivity of rod/cone transition. These
facts constrain the design but do not uniquely determine the final SDR
rendering curve.

Reset checkpoint preserved from the pre-cache Color lane: the Bruneton base is
frozen and verified, reference characterization in step 2 is accepted, and the
first step-3 seam proof is complete and rejected. The old Stage 1 ledger and
all pre-reset Color candidates remain historical evidence only. The later
source-luminance-lift production adoption supersedes this checkpoint's former
claim that production was unchanged; it does not accept the rejected mapper or
complete Step 3.

Immutable focused run
`000349-spectral-color-production-sun-focused-bruneton-luminance-highlight`
(artifact set
`0f689ef66e779593b1e9977bda1fc9aefa41c84bc60bafeaf9573a69a1edcd38`)
and wide run
`000350-spectral-color-production-wide-bruneton-luminance-highlight`
(artifact set
`6fa40c543fcaecad0b10f602b94a28e372be458b9f062c9a72b551be7e00d8ac`)
execute the first static seam proof. They begin with newly acquired production
native-15 spectra and reproduce the production Bruneton control within the
accepted linear, mapper, and one-code framebuffer bounds. The candidate changes
only the final mapping: Figure 1 is evaluated once on Rec.709 luminance, that
gain is shared by signed linear RGB, negative display channels are clipped, and
one common peak scale contains gamut. Disk centers are no longer white: their
display RGB progresses from `[1, 0.8277, 0.7064]` at noon to
`[1, 0.2250, 0]` at sunset. This is not a success. Every center's mapped
luminance is already exactly `1`; per-pixel peak containment then removes
absolute brightness. In the wide fields, `237,933 / 257,041` noon pixels,
`165,879 / 257,041` minus-30 pixels, and `148,102 / 257,041` minus-10 pixels
are gamut limited. The result is a bright orange sheet rather than the
production sky relationship. Reject this mapper and specifically prohibit
per-pixel peak normalization as gamut handling. The useful retained finding is
that a common RGB gain preserves the warm disk ratios that independent-channel
saturation erased; the remaining problem is a correctly scaled luminance curve
and luminance-preserving gamut containment.

Immutable run `000348-bruneton-light-adaptation-reference-sweep` (artifact set
`92818466930e0ebb3407d5d599eed47f31d6156e00007a6b4f140be3045d0132`)
accepts the step-2 reference characterization. It evaluates six analytic
D65/Rec.709 colorimetric stimuli at nine photopic adapting luminances from
`1` to `10,000 cd/m2`, for `108` total rows. Full illuminant discounting keeps
chromatic adaptation out of this luminance-only experiment. The project and
pinned independent CIECAM16 implementations agree within
`6.120055926018651e-12`; their internal matrix/scalar result is exact at the
reported precision.

The run separates two relationships. In its deliberately asymmetric test, an
absolute stimulus held fixed while the adapting field rises becomes a
progressively dimmer part of that field: brightness `Q` falls to about `76.4%`
of its low-adaptation value and colorfulness `M` to about `23-24%`; hue moves by
at most `0.563 degrees`. This does **not** predict that a real daylight sky
becomes less blue. Sky radiance, illumination, and the surrounding field do not
remain fixed while adaptation alone rises. In the proportional-illumination
test, which better represents a surface or sky brightening with its adapting
environment, relative lightness `J` stays nearly constant, brightness `Q`
increases about `6.70x`, and chromatic-stimulus colorfulness `M` increases about
`2.16-2.19x`, while hue moves by at most `0.452 degrees`. Thus the reference
supports a smooth, strongly compressive brightness response plus a separate
luminance-dependent colorfulness relationship. It does not support hard
high/low clipping or treating relative lightness `J` alone as displayed
brightness. Neither synthetic sweep replaces validation on correct production
sky spectra and complete fields.

For step 3, use the proportional-illumination relationship as the primary
outdoor curve constraint and retain the fixed-absolute-patch relationship only
as an asymmetric-adaptation control. Final acceptance comes from correct
production Sun-and-sky fields, not either analytic patch sweep.
All authored experiment implementation remains under `scripts/extraterrestrial/`
and all generated records, plots, captures, and intermediates remain under
`tmp/extraterrestrial/`.

The owning architecture is the
[Celestial Appearance And Sun-Disk Architecture](sun-disk-appearance-design.md).
This plan changes no atmosphere or celestial ownership. It isolates the current
largest problem: translating wavelength-resolved camera radiance into useful
display RGB without destroying its chromatic relationships.

The detailed component, evidence, prerequisite-acquisition, and configuration
requirements for the primary observer mode are owned by the
[Normal Mode Test Plan](normal-mode-test-plan.md).

The established Bruneton comparison is accepted as atmosphere qualification for
this Color experiment. Optional future transport comparisons are documented in
[Sun And Circumsolar Physics Expectations](sun-circumsolar-physics-expectations.md),
but they do not gate the active plan.

## Objective

Preserve the verified Bruneton rendering of valid production spectra, then add
the smallest global, smooth light-adaptation response justified by reference
appearance relationships. Local-light magnitude may move the achromatic
operating range; it may not select independent channel curves or normalize away
the measured noon-to-sunset stimulus. Apply one transform to the complete
composed field and retain exact unadjusted Bruneton output as the control.

This objective does not require the solar disk to remain visible, bounded, or
colored in every output. Preserve physical and spectral relationships through
the owned boundaries, but allow valid occlusion, bounded raster sampling,
exposure, clipping, glare, gamut limits, and the global display transform to
remove the displayed disk. Do not add disk-specific support, exposure, Color,
or overlay behavior merely to satisfy visibility.

The remainder of this document retains completed pre-reset stages and failure
evidence for traceability. Where their candidate instructions conflict with the
Active Reset and Reset Execution Plan above, the reset plan is authoritative.

## Fixed Physical Inputs

- Spherical/distant location: San Jose, latitude `37.3382`, longitude
  `-121.8863`, observer height `5 m`.
- Date basis and anchors: the retained June 2024 San Jose fixture, with apparent
  solar noon `2024-06-20T20:08:00.000Z` and sunset
  `2024-06-21T03:26:03.503Z`.
- Spherical Sun: current native spectral source and angular radius.
- Flat/local context: the established contained Flat fixture and observer. Its
  geographic labels remain presentation labels, not ephemeris validation.
- Flat orbit rate: `360 degrees / 24 hours = 0.25 degrees/minute`.
- Flat noon anchor: closest approach, `0 degrees`.
- Flat sunset anchor: farthest placement, `180 degrees`.
- Atmosphere, source, geometry, spectral basis, and numerical profiles are
  fingerprinted and held constant within one dataset.

The contained named-atmosphere catalog is accepted for configuration and model
representability in immutable run
`000297-named-atmosphere-composition-contract-proof` (artifact set
`b300ec7e0667aeb1695044632cc467e8e907a130b449157e0cbb3e1af0670c1a`). It
provides molecular-only, canonical `1x`, canonical-aerosol `2x`, and
canonical-aerosol `4x` definitions by varying only the Mie column-loading
coefficient. These are controlled comparison inputs, not reconstructed weather
classes. Ozone and elevated-layer names remain explicitly unsupported by the
current atmosphere model. This catalog does not alter the frozen Stage 1
ledger or the active Color qualification input.

The required solar-noon window is the two-hour interval centered on noon: one
hour before through one hour after. Extending it to two hours on each side is a
later additive measurement, not part of the first required record.

## Observation Matrix

### Spherical/Distant

Sunset series, every ten minutes:

```text
-60, -50, -40, -30, -20, -10, 0, +10 minutes from sunset
```

Add one distant-only night control at `+120 minutes` from sunset. It is not part
of the ten-minute cadence and has no required Flat equivalent.

Solar-noon series, every thirty minutes:

```text
-60, -30, 0, +30, +60 minutes from apparent solar noon
```

### Flat/Local Equivalent

Use the same offsets on the Flat 24-hour orbit. Positive time advances the
orbit angle.

```text
noon/closest:
  -60, -30, 0, +30, +60 minutes
  -> -15, -7.5, 0, +7.5, +15 degrees around closest approach

sunset/farthest:
  -60, -50, -40, -30, -20, -10, 0, +10 minutes
  -> 165, 167.5, 170, 172.5, 175, 177.5, 180, 182.5 degrees
```

Store normalized angles and the unwrapped angle above so the sequence remains
ordered across the orbit seam. Geometry resolves the resulting finite source
position and apparent support; the fixture does not invent a spherical solar
elevation for Flat.

## Recorded Quantities

For every condition, record unit-bearing native spectral arrays before any
display conversion:

1. transported direct celestial radiance at the Color boundary;
2. atmosphere-only path radiance on the disk-center ray;
3. total pre-display radiance on that ray;
4. source placement, apparent support, horizon/ground state, atmosphere path,
   cache or integration identity, and all input fingerprints; and
5. derived CIE XYZ, direct Y, chromaticity, and signed linear RGB as diagnostics,
   never as replacements for the native spectrum.

Record the disk-center atmosphere-only value even though the direct disk will
later be composited on that ray. This keeps the two Color inputs separable.
Retain unattenuated source radiance and transmittance only when already exposed;
they are optional provenance and do not gate this Color experiment.

### Surrounding-Sky Samples

At angular radii `0.5`, `1`, and `2` degrees from disk center, record
atmosphere-only path-radiance spectra in four radial directions: zenithward,
horizonward, and both equal-elevation directions. Geometry records ground or
horizon blocking instead of substituting another ray when a direction is not
valid.

At the distant `+120 minute` night control, the geometric Sun direction is
expected to be below the horizon. Preserve that ground-blocked classification
and exact-zero direct camera contribution; do not integrate a fictitious path
through Earth or move the source onto the horizon. For visible sky context,
record separate rays at the Sun's azimuth and `0.5`, `1`, and `2` degrees above
the geometric horizon, plus zenith. Label these as horizon-context samples, not
as samples surrounding a visible disk.

Produce overlays for each condition showing:

- transported disk spectrum;
- disk-center atmosphere-only spectrum;
- every valid surrounding-sky spectrum;
- the mean and range of the surrounding samples; and
- disk-to-sky ratios by wavelength.

The immutable evidence is numeric JSON/CSV with units, identities, and hashes.
Plots are generated views of that evidence and may not become oracle inputs.

## Acquisition Rules

- Initialize each atmosphere definition once and reuse it for every observation
  in that geometry series. Changing time moves geometry; it does not reconstruct
  atmosphere.
- Acquire all conditions through one focused self-verifying runner and immutable
  run record. Do not create an experimental unit-test tree.
- Record values from the actual current transport path plus a clearly identified
  reference calculation when one already exists. Never silently substitute CPU
  values for GPU values or vice versa.
- Do not apply exposure, tone mapping, gamut mapping, display transfer, bloom,
  glare, limb darkening, or screenshot-derived correction during acquisition.
- Establish a small preflight subset before the full matrix. Stop if identities,
  units, composition, or bounded execution cannot be verified.
- Preserve the current ozone-off dataset. A sourced ozone-on dataset is a
  separate atmosphere variant with the same matrix and may not overwrite or be
  mixed with the baseline.

## Stage 0: Normal-Mode Data Prerequisite

Complete the cache/data audit and measurement-sidecar preflight in the
[Normal Mode Test Plan](normal-mode-test-plan.md) before acquiring the full
ledger. The preflight leaves ordinary cache semantics unchanged and records the
source spectrum plus the post-transport atmosphere-only, post-raster celestial,
and post-composition spectra through bounded selected-ray probes.

Do not modify the cache to recover upstream source/transmittance operands. Stage
0 needs the transported `celestialRadiance`, atmosphere-only `pathRadiance`, and
composed `preDisplayRadiance` already presented at the Color boundary. Also
retain native spectra for the full upper-hemisphere quadrature and run the
native-15 versus higher-resolution observer-projection check. No full
observation matrix or Color fitting begins until those required inputs are
readable and internally consistent.

Stage 0 is accepted in immutable run
`000251-normal-color-stage0-preflight` (artifact set
`56fafebc76bbaa754fd061b17afff8679b67d808913699c474c972b869ceb138`).
One current-candidate atmosphere setup was reused across San Jose solar noon,
sunset minus ten minutes, and sunset plus 120 minutes. The sidecar retained 321
Color-boundary spectra over 107 rays, including both visible-disk center/four
inside-limb sets and every 32-ray hemisphere set. Host wall time was `32.498 s`.

The maximum additive-composition relative residual was
`5.289916935062263e-8`; the below-horizon direct contribution was exact zero.
Against exact one-nanometer CIE integration of the declared piecewise-constant
bin-average representation, the native center-weight projection differed by at
most `0.535599%` in Y and `0.00251155` in CIE 1976 u-v. These pass the declared
five-percent and `0.005` prerequisites. The run qualifies Color-boundary
observability and the native observer projection for the first Color
experiments; it makes no new atmosphere-transport claim.

The retained 32-ray hemisphere remains an integration diagnostic. It does not
qualify local luminance for adaptation; the separate bounded local-luminance
measurement required by the Normal plan remains future work.

## Stage 1: Validate The Frozen Spectral Ledger

Before Color work, require:

- finite values and explicit quantity/units for every channel;
- `total = path + direct` within tolerance;
- stable source and atmosphere fingerprints across time samples;
- monotonic observation and Flat orbit ordering;
- exact separation of disk and surrounding-sky rows; and
- plots regenerated solely from the retained numeric ledger.

These are acquisition and Color-boundary composition-integrity checks on the accepted
Bruneton-qualified transport result. Stage 1 does not compare atmosphere output
to libRadtran, AERONET, or a reconstructed historical San Jose atmosphere.

This stage makes no appearance claim. Unexpected spectra route back to source,
geometry, or atmosphere and are not corrected in Color.

Stage 1 spectral integrity is accepted in immutable run
`000258-spectral-color-stage1-ledger` (artifact set
`abe89535535f523d4d04a0a5e9fe5cef86bff441f274cd998103e0121a7cacd5`).
It post-verifies the complete GPU shard output from immutable acquisition run
`000257-spectral-color-stage1-ledger` against that run's SHA-256 manifest and
materializes the authoritative JSON/CSV ledger plus 27 generated SVG overlays.
The ledger retains all 14 spherical/distant and 13 Flat/local conditions,
`1,311` rays, and `3,867` eligible native spectra.

Maximum additive-composition residual was `5.794122332978879e-8` relative.
Maximum native-bin observer-projection disagreement was `0.530308%` in Y and
`0.00251805` in CIE 1976 u-v. All identity, ordering, ray-aiming, finiteness,
nonnegativity, composition, and required night-control gates passed. The
`+120 min` geometric-Sun direct spectrum is exact zero.

Two findings remain separate from Color acceptance:

- Acquisition run `000257` took `877.726 s`, so it failed the predeclared
  ten-minute performance target. This does not require rebuilding transport
  during Stage 2/3 iteration, which reads the frozen ledger.
- One exact-sunset horizonward limb row is geometrically ground-blocked but
  exposes nonzero raw celestial radiance because the current spherical GPU path
  does not apply the CPU geometry's ground intersection to that intermediate.
  The row retains the raw diagnostic, has no path or composed spectrum, and is
  explicitly marked `excluded-ground-blocked-ray`; Color does not correct or
  consume it.

## Stage 2: Isolated Disk Color Laboratory

Create a small fixed-cost renderer that reads one retained transported disk
spectrum directly. It bypasses live atmosphere and caches. Render analytic disk
coverage against black at a fixed framing and resolution, with no glare or
bloom.

Stage 2 begins at the spectral Color boundary. Its input is an already-recorded
eligible spectrum plus declared observer, adaptation, display, and output
configuration. It does not build, load, validate, or reason about atmosphere or
celestial caches; derive placement; classify horizons; resolve obstructions; or
repair transport. Ground-blocked and otherwise ineligible acquisition rows are
filtered by the frozen ledger contract before Color receives an input. Their
diagnostics remain upstream evidence and create no branch in the Color
implementation.

### Stage 2A Fixed-Diagnostic Result

Immutable run `000263-spectral-color-stage2-isolated-disk` (artifact set
`0d934afef8c065879e0e8e941952a23cca0aeac8ba6fc1a317ba2c2e1b317f69`)
accepts the isolated-disk laboratory and its first fixed diagnostic lane. It
manifest-verifies the Stage 1 ledger and processes all 25 eligible direct-disk
spectra without executing atmosphere, cache, geometry, placement, or
obstruction logic.

The diagnostic lane uses the official CIE 1931 2-degree observer projection,
an unbounded `8 * log2(1 + Y / 1e6)` luminance map in nits, one joint gamut
intersection along the line from the same-luminance D65 neutral to the signed
linear-sRGB result, and the standard sRGB piecewise encoding. These parameters
were frozen before viewing the rendered plates. They define a diagnostic, not a
population-average visual-adaptation claim.

Across the retained `3.077821e6` through `1.532649e9 cd/m2` disk range, the map
produced `16.2224` through `84.6620` unbounded display nits. It preserved
projected chromaticity to `1.11e-16`, passed neutral and strictly increasing
lightness sweeps, required at most `12.1276%` joint gamut compression, and
produced zero exact-white disks. Frozen lane `B` reproduced its retained
signed-linear RGB within `1.67e-15` relative error and mapped all 25 disks to
exact white.

Visual inspection of the generated analytic-disk plates confirms that lane `A`
retains the measured sequence differences while lane `B` is uniformly white.
This accepts Stage 2A traceability and the laboratory itself. It does not accept
the diagnostic mapping as `Normal`; Stage 2B must replace its diagnostic
luminance parameters with a referenced, explicitly configured photopic
adaptation/appearance model before Stage 3.

### Stage 2B Fixed Referenced Candidate Result

Immutable run `000265-spectral-color-stage2-normal-comparison` (artifact set
`d0429cff98d8228e460d87a72c98c959d7e663ef6f8d2dd71b8b97d52819e500`)
rejects the existing fixed official ACES 2/Hellwig 2022 Rec.709-D65 100-nit
candidate on the same 25 spectra. The implementation and its fixed
`0.00029282576866764276` scene scale were reused without tuning. Output was
finite and technically below one, but every condition became the identical
neutral triplet `[0.9999999403953552, 0.9999999403953552,
0.9999999403953552]`.

This is a practical white plateau even though it is not literal binary32 one.
It establishes that attaching the previous fixed scene scale to the absolute
photopic projection is not a viable `Normal` configuration. Do not tune that
scale from the disk plate. The active candidate instead derives wavelength-
resolved direct irradiance from the retained transported disk radiance and
apparent angular support. No viewport-field measurement blocks this isolated
disk work. Stage 3 remains blocked until the direct-disk candidate is accepted.

Prerequisite research `2B-R` was executed on 2026-08-14 and is owned by the
[Stage 2B Normal Reference Research](normal-color-stage2b-reference-research.md).
It fixes CIE 1931 2-degree as primary observer, CIECAM16 as primary appearance
candidate, Hellwig/ACES as comparisons, the destination display, numerical
gates, held-out split, and lightweight observer-proxy review protocol. It also rejects the
assumption that a published fixed example condition can establish outdoor
population-average `Normal`. That isolated-disk proxy used direct spectral
irradiance and an optional equivalent diffuse luminance `E_v / pi`; it explicitly
does not claim full sky/ground/scene adaptation. The current reasonable-`Normal`
scope accepts that bounded approximation. Full-view `2B-M` remains available if
a later spatial image-appearance objective requires it; no new atmosphere
physics is required for the active work.

One Color-owned design freeze remains before the next plate. The resolved disk
sample is transported spectral radiance `L_lambda`; the projected-solid-angle
integral `E_lambda` is retained as direct-solar context and as the source of the
optional adapting proxy. Feeding `E_lambda` to a radiance-based observer
projection, or using the same direct signal as both sample and normalization
without retaining an absolute-sensitive brightness coordinate, would erase or
severely compress the very intensity relationship under test. The candidate
must therefore declare its sample units, its adaptation inputs, the correlate
that drives display lightness, and a fixed monotonic 100-nit mapping before a
new plate is generated.

The correlate is now selected. Primary `Normal` uses condition-varying
steady-state adaptation from the declared direct-Sun proxy and CIECAM16
brightness `Q`; one fixed monotonic function maps `Q` to the 100-nit display.
Relative lightness `J` with an unchanged reference is retained only as an
absolute-comparison diagnostic. The remaining bridge work is to define the
fixed `Q` mapping numerically and prove it before generating another plate.

The mapping design is now frozen by the Stage 2B research record: integrate
only visible analytic disk support for `E_lambda`; derive `Q_0` from the fixed
display white and `Q_master` from the tracked unattenuated physical source; use
the fixed logarithmic mastering equation; and intersect brightness and
colorfulness jointly with the Rec.709 appearance volume while preserving hue.
Two independent binary64 CIECAM16 implementations had to agree before GPU
parity. The resulting historical next step was implementation and synthetic
numerical proof, not a decision plate.

The corrected fully adapted, exact-D65 bridge is accepted in immutable run
`000272-spectral-color-stage2b-reference-bridge`; its anchors are `Q_0 =
196.31177443154246` and `Q_master = 3785.269948190865`, and its mastering range
is `0.6819923084765764` to `0.9889125417329584`. Run
`000276-spectral-color-stage2b-output-proof` accepts inverse output-condition
CAM16 and the joint Rec.709 mapping over all 25 retained and 288 synthetic
inputs. It reports zero unexplained plateaus, zero exact-white disks, and 25
distinct float outputs. Run `000278-spectral-color-stage2b-independent-conformance`
accepts forward and inverse agreement against pinned Color.js CAM16 with
maximum correlate difference `6.536993168992922e-12` and inverse XYZ difference
`8.526512829121202e-14`. Run
`000281-spectral-color-stage2b-calibration-plate` then generated the centered
3-by-3 calibration plate from exactly the frozen nine-row subset. It retained
nine distinct float outputs, zero exact-white outputs, and no active gamut
boundary; exact row-identity checks excluded all sixteen held-out rows from the
review artifacts. The plate is generated evidence, not perceptual acceptance.
The project owner subsequently rejected the plate for insufficient red tones.
This rejects the candidate's `M/Q`-preserving colorfulness rule, not the
accepted physical ledger or numerical CIECAM16 implementation. Spherical
sunset retained input chromaticity `(x,y) = (0.361071,0.346723)`, but joint
brightness/colorfulness scaling reduced CAM16 `M` from `39.2388` to `3.9422`;
Flat/farthest-minus-30 retained `(0.431659,0.413647)` but fell from `48.0293` to
`3.8668`. No calibration row was gamut-boundary limited, so final Rec.709
intersection did not cause the weak color. Reopen only the fixed,
source-independent colorfulness rendering relationship while retaining the
accepted `Q` brightness mapping as the control. Requalify on calibration rows
before any candidate freeze or held-out presentation.

Immutable run `000284-spectral-color-stage2b-colorfulness-candidates` accepts
that calibration-only numerical and presentation comparison. The primary lane
preserves source-condition CAM16 `M` through the unchanged `Q` mastering curve
and reduces `M` only at fixed mastered `Q` and hue when required by Rec.709.
This fixed-brightness boundary replaced the attempted joint black-origin ray,
which has no positive Rec.709 intersection for the high-colorfulness Flat
farthest inputs. The diagnostic lane instead preserves transported CIE
chromaticity at the same target `Q` before a same-luminance D65 gamut
intersection. The primary lane passed nine calibration and 175 synthetic
inputs, produced no exact-white output, and increased red dominance for every
warm calibration row. Six calibration rows used its fixed-`Q` colorfulness
boundary; three diagnostic rows required their same-luminance gamut boundary.
Both centered plates now await observer-proxy comparison. Held-out rows remain
uncomputed and unpresented for this candidate.

Lane `A` exposes every stage:

```text
native spectrum
  -> population-average observer response
  -> tristimulus/color-space coordinates
  -> declared Normal adaptation or fixed diagnostic exposure
  -> joint highlight/chroma/gamut mapping
  -> display encoding
```

The first pass uses fixed diagnostic exposure to locate projection or mapping
failures. The second uses the referenced population-average `Normal` observer.
Camera execution remains separate from the active `Normal` candidate, but its
architecture is no longer undefined or dependent on eye acceptance. Manual,
Auto Timelapse, and HDR Timelapse configurations consume the same physical
spectra through the camera pipeline owned by the celestial-appearance design.
Lane `B` consumes the same recorded spectrum through the unchanged Bruneton
implementation.

The observer, adaptation, appearance, tone/chroma/gamut, display, spatial,
mesopic, and later temporal tests follow the component ladder and one-variable
configuration matrix in the
[Normal Mode Test Plan](normal-mode-test-plan.md).

Compare the full sunset, noon, spherical, and Flat sequences. Iteration changes
only lane `A`; it never regenerates transport data.

## Stage 3: Recorded Circumsolar Color And Composition

Pass every recorded atmosphere-only disk-center, circumsolar, horizon-context,
and zenith spectrum through lanes `A` and `B` under exactly the same observer,
exposure, output-transform, and display settings as the disk. Retain each Color
stage so a sky-spectrum failure cannot be hidden by the final composite.

Render the samples first as individually identified spectral/color swatches and
overlays. A later spatial preview may interpolate the recorded circumsolar
samples with a declared method, but that interpolation is presentation only and
cannot become transport evidence or a fitting target.

Composite analytic disk coverage over the recorded disk-center atmosphere path
radiance:

```text
recorded pre-display spectrum
  = recorded atmosphere path spectrum
  + coverage * recorded transported disk spectrum
```

Also render the surrounding-sky samples as spatial or chart overlays so the
disk can be judged against the measured circumsolar range. Keep the physical
addition spectral and apply Color once after composition. Do not tune the disk
independently from the sky.

For the distant two-hours-after-sunset control, apply Color to the recorded
Sun-azimuth horizon-context and zenith spectra with no disk contribution. This
night control becomes a required input to the later exposure work; it verifies
that a setting which preserves sunset highlights does not make the post-sunset
sky unusable, and that a setting which reveals the dark sky does not silently
define the daytime or sunset response.

Immutable run `000286-spectral-color-stage3-calibration-context` completes the
first calibration-only sparse-context view for the preserve-`M` candidate. It
applies one unchanged condition state to the direct disk, recorded
path-plus-direct center, atmosphere-only center, and all eligible circumsolar
spectra for the nine calibration conditions. The plate uses the twelve direct
`0.5`, `1`, and `2` degree samples as piecewise-constant directional sectors;
it does not interpolate a continuous sky. Three exact-sunset horizonward
sectors retain their recorded ground-blocked classification. Across 132
transformed quantities, every output is finite and bounded, no output is exact
white, and maximum center composition residual is
`5.3887837850900735e-8`. This is contextual observer-review evidence, not full
Stage 3 acceptance: lane `B`, held-out conditions, the distant night control,
and any continuous spatial preview remain pending.

At the project owner's correction, the sparse-sector plate is not treated as a
render of the Sun in atmospheric context. Run
`000288-spectral-color-stage3-full-frame-context` provides that missing
calibration view from live spherical/distant GPU composition for sunset minus
60 minutes, minus 30 minutes, and sunset. The preserve-`M` transform is applied
once to every composed pixel with one condition state; it does not identify or
separately render the solar disk. The run contains `391,053` pixels, no exact
white output, and fully visible center reconciliation within `0.0008551`
relative to the frozen selected-ray ledger. Exact sunset separately retains the
current horizon-raster divergence (`0.074411` relative).

This is accepted evidence but adverse candidate evidence: `328,082` pixels
require fixed-brightness colorfulness boundary reduction, including `99.87%`
of the exact-sunset frame. The nearly uniform brown field means the candidate's
full-frame color-volume behavior is not credible. Research `3R-G`, owned by
[Global Normal Color-Rendering Research](global-normal-color-rendering-research.md),
rejects preserve-`M` as a development candidate. Colorfulness is
luminance-dependent, and preserve-`M` is not a credible full-field rendering
rule. The project has deliberately narrowed the objective from a general
spatial human-vision model to a reasonable global rendering. Do not interpolate
between preserve-`M/Q` and preserve-`M`, tune an exponent from images, or reveal
held-out rows.

## Receptor-Response Normal Plan

This plan replaces the superseded `Q_t` to `J_t` / ACES-coupling plan. Model a
reasonable eye as overlapping spectral receptors followed by one global,
brightness-dependent saturating response. The existing CAM16, ACES 2,
preserve-`M/Q`, and preserve-`M` implementations remain unchanged controls; none
is the active candidate.

Use the direct spectral illumination already retained at the observer to
resolve one global brightness state. Do not acquire a new viewport field,
sample the framebuffer, construct a spatial adaptation texture, identify the
Sun in Color, or apply local exposure.

For each condition, derive visible direct spectral irradiance from transported
disk radiance and analytic visible support:

```text
E_lambda = L_lambda * visibleDiskSolidAngle
E_v = 683 * sum(E_lambda * CIE_ybar * wavelengthBinWidth)
L_A = max(E_v / pi, declaredMinimumAdaptingLuminance)
```

`E_v / pi` is an explicit equivalent-diffuse approximation, not a claim that
the direct Sun is a complete model of visual adaptation. The accepted global
state is an input to the receptor curves, recalculated only when clock,
geometry, or lighting state changes and applied uniformly to every composed
pixel.

The active ordering is mandatory:

```text
composed native-15 spectrum
  -> linear integration through overlapping L, M, and S sensitivities
  -> three global adaptation-dependent receptor responses
  -> fixed D65-normalized LMS-to-display conversion
```

Do not apply a nonlinear curve independently to wavelength bins before their
receptor integration. Nonlinear per-wavelength processing would make metamers
diverge and create color differences unavailable to the selected observer.

Execute the receptor work in this order:

1. **Global-state table.** From the frozen calibration ledger, record condition,
   visible disk solid angle, `E_lambda`, `E_v`, `L_A`, CAM16 `F_L`, and source
   `Q`, `J`, `M`, and hue. Require finite values, continuous visible-disk
   behavior, progressive sunset reduction, and distinct noon, sunset-minus-30,
   sunset-minus-10, and sunset states. Stop before rendering if the proxy
   produces an implausible or self-normalized progression.
2. **Receptor-parameter prerequisite.** Freeze the CIE 2006 2-degree LMS
   energy fundamentals, native-15 integration convention, absolute or declared
   relative normalization, D65 receptor white, Naka-Rushton response family,
   exponent, brightness-to-half-saturation relationship, black threshold,
   adaptation gains, and LMS-to-display normalization from published evidence.
   The receptor-response portion of the verified CAM16 implementation is the
   first control. Do not fit these parameters from Sun images.
3. **Projection and metamer proof.** Precompute the native-15-to-LMS matrix.
   Reconstruct XYZ through the declared LMS/XYZ transform and compare with the
   accepted CIE projection. Use constructed equal-LMS spectral pairs to prove
   that integration precedes nonlinearity and that metamers remain identical.
4. **Curve sweeps.** For every native wavelength, sweep radiance from below the
   black threshold through receptor saturation and retain L, M, S, and display
   RGB. Repeat for equal-energy white, D65, unattenuated Sun, noon,
   sunset-minus-30, sunset-minus-10, and sunset spectra. These numeric curves
   and generated plots expose where each stimulus leaves black, changes color,
   and approaches the white asymptote.
5. **Numerical receptor proof.** Require finite bounded responses, monotonicity
   in every receptor, smooth black and white approach, neutral stability,
   metamer identity, hue continuity, distinct noon/low-Sun outputs, preserved
   warm ordering, and no unexplained common-white plateau. Apply the frozen
   curves to existing measured spectra only; do not execute atmosphere or
   caches.
6. **Full-context calibration review.** Apply one condition-wide receptor state
   and one transform to every composed pixel in four centered atmospheric
   frames: noon, sunset-minus-30, sunset-minus-10, and sunset. Compare the
   primary receptor model with the CAM16 receptor-response control and retained
   failed Color controls. Measure black and saturation fractions,
   Sun-to-circumsolar contrast, horizon gradients, red/orange progression,
   repeated-color plateaus, and disk/horizon continuity. The project owner is
   the observer proxy for whether the result is reasonable.

   Reuse the exact-time local-light record accepted in immutable run
   `000302-spectral-color-local-light-record` (artifact set
   `dedb03462344654252096e9879972bfa21a3328ba0b18b5c6db9dfd4bc4cb9c1`). Its
   four condition records were materialized from the manifest-verified Stage 1
   ledger, which traces to direct Algorithm32 acquisition run `000257`; no new
   atmosphere execution was necessary. They retain transported direct spectral
   radiance, analytic visible solar support, derived direct spectral irradiance,
   photopic `E_v`, `L_A = E_v / pi`, exact clock/geometry identity, and
   source/atmosphere fingerprints. The review applies each recorded condition
   state uniformly to its matching complete composed frame. Generic time-of-day
   approximations and neighboring condition values remain prohibited.
7. **Runtime proof.** Benchmark the fixed native-15-to-LMS projection, three
   response evaluations, and one LMS-to-display matrix. If the nonlinear
   evaluations are too expensive, replace only those evaluations with three
   qualified one-dimensional LUTs. No full-frame analysis or spatial
   convolution belongs in the runtime design.
8. **Camera extension, executed as four gated stages.** Camera configurations
   share the composed spectral input and proof harness but remain separate from
   the population-observer `Normal` candidate. The canonical software,
   dataset, equation, and reuse evidence is the
   [Camera Spectral-Color Prior-Art Research](camera-spectral-color-prior-art-research.md).

   **8a. Relative spectral-camera projection proof.** Begin from the valid
   production-GPU native-15 full-frame captures at noon, sunset minus 30,
   sunset minus 10, and sunset. Do not rerun atmosphere transport and do not
   use the invalid historical Stage 1 rendering spectra. Process every composed
   pixel uniformly; no Sun mask or object-specific Color branch is permitted.

   Prepare a CIE-1931 ideal-sensor control and one explicitly named measured
   camera profile. The first recommended measured comparison is PBRT's Canon
   EOS 5D Mark IV response. Licensing is not a concept-proof gate: retain the
   exact source, attribution, and any stated license with the evidence, then
   perform redistribution and production-use clearance during productization.
   Hold the first comparison white balance at a declared daylight value near
   `5500 K`.

   Here, *compile a profile* means precompute spectral integration weights; it
   does not mean compiling program source. If `L[i]` is Algorithm32's
   bin-average radiance for native channel `i`, construct:

   ```text
   response[c,i] = integral over native bin i of
     sensorEnergyResponsivity[c](lambda)

   sensorRaw[c] = exposureScale
     * sum over i=0..14 of L[i] * response[c,i]
   ```

   The result is one `3 x 15` matrix: three overlapping camera-response rows
   for the fifteen fixed spectral inputs. A runtime pixel therefore evaluates
   only three fixed 15-term dot products. Switching camera profiles changes
   these 45 coefficients, not shader topology.

   If a source profile supplies quantum efficiency rather than calibrated
   energy responsivity, offline construction must also incorporate optical
   transmission, bin width, and photon conversion `lambda / (h*c)`. The
   profile contract must identify its response quantity and units so photon
   conversion is neither omitted nor applied twice. Arbitrary relative PBRT
   response curves qualify relative camera color only; they do not qualify
   absolute electron counts, noise, or physical full-well clipping.

   Fit or import a separate qualified `3 x 3` camera-RGB-to-XYZ or
   camera-RGB-to-working-space matrix following the PBRT/rawtoaces
   color-chart method. Record response-curve identity, illuminant, native-basis
   fingerprint, response semantics and units, integration method, fit error,
   stated source license and provenance. Every produced matrix, reference value,
   diagnostic, and render must retain its complete derivation: identified and
   hashed parent artifacts, equation or operation, code/tool version, material
   parameters, numerical method, and result identity. Use Colour as the primary
   independent high-resolution oracle and at least one additional
   implementation or published vector. Evaluate CIE-JS and jsColorEngine only
   as optional independent evidence; neither becomes a runtime dependency.

   Stage 8a passes only when high-resolution and compiled-native-15 projection
   agree within a declared, evidence-derived tolerance; zero remains zero;
   scaling a non-clipped spectrum scales sensor raw linearly; no input is
   normalized; disk/sky raw ratios remain traceable; and sunset chromatic
   progression survives into raw camera RGB. Localize every discrepancy to
   spectral projection, the `3 x 3` matrix, or later display processing before
   proceeding.

   **Stage 8a is complete and accepted.** Immutable run
   `000358-camera-relative-projection-stage8a` (artifact set
   `69607f8d1a9339f6cc9d69a0c568cba85bd41ec25e80e55e66b2906d55b9d249`)
   consumed the preserved focused and wide production native-15 fields from
   runs `000351` and `000352`, without rerunning atmosphere transport. It
   projected all `2,056,328` pixels through the PBRT Canon EOS 5D Mark IV
   relative response and the ideal CIE 1931 control. Independently constructed
   Colour 0.4.6 and JavaScript native-15 weights agree within
   `5.557567351869024e-16` for the camera and
   `3.6562111888486406e-16` for the ideal control; the independent `3 x 3`
   fits agree within `7.993605777301127e-14`. Zero maps to zero, tested
   unclipped scaling is exactly linear at binary64 reporting precision, and all
   projected pixels are finite. The wide-view disk-center sunset/noon raw
   red-to-blue ratio factor is `6.211529447797385`; the raw chromaticity
   distance is `0.340818223445315`. Fixed six-patch held-out characterization
   error is mean `0.7508652161238495` and maximum `1.3858401494799768`
   Delta E 2000. Post-run verification recomputed the same artifact-set hash.
   This accepts relative camera color only, not physical exposure, electrons,
   noise, full-well clipping, ISO, ADC behavior, or a physical Canon body
   claim. Proceed to Stage 8b.

   **8b. Fixed-exposure full-frame proof.** Apply a small declared stop-space
   exposure bracket to the same four complete production spectral fields with
   automatic exposure disabled. Keep the Sun centered in its actual
   atmosphere and retain one fixed white balance and development configuration
   across the plate. Record, for matched disk and sky locations, native-15
   spectrum, unexposed sensor RGB, exposed raw RGB, raw-channel clipping,
   white-balanced RGB, working/display RGB, and final encoding. Raw clipping
   and display/gamut clipping must be counted separately. Select no exposure
   from an isolated disk or a pleasing screenshot. This stage establishes
   whether a camera response can preserve the correct atmosphere and disk
   relationship before physical sensor claims or automatic metering.

   **Stage 8b is technically complete and awaits project-owner appearance
   review.** Immutable run `000359-camera-fixed-exposure-stage8b` (artifact
   set
   `279c374cc5d3396603c31a29d281e84fc8b0bcd5602e7f238015abeed75ba7d3`)
   reused the accepted Stage 8a profile and all `2,056,328` production source
   pixels without atmosphere execution. It rendered `32` full-resolution
   frames and `8,225,312` bracketed pixels across both views, four clock
   conditions, and fixed stops `[-4, -2, 0, +2]`. Exposure zero was derived
   once by mapping the median positive D65 `Y = 6.188941021700464` of the
   complete wide noon field to `0.18`, producing the fixed scale
   `0.029084135616878677`. Every matching stop uses the same multiplier.

   The run applies no raw clipping because PBRT's relative response has no
   qualified full-well scale. It records raw and display clipping separately,
   then applies only the fixed Stage 8a characterization, Rec.709 conversion,
   display-boundary clipping, and standard sRGB encoding. All intermediates
   are finite, exact-zero spectra remain black, no nonzero spectrum collapses
   to exact black, and no pixel becomes exact white. The wide-view
   sunset/noon pre-clip disk-center red-to-blue ratio factor is
   `611.5878592417649`; each view retains four distinct encoded disk-center
   triplets. Wide-field highlight clipping ranges from single-digit disk
   pixels at low exposures to `231,815` pixels for noon at `+2`, while
   exact sunset has only six high-clipped disk pixels at every stop. The
   verifier reproduced the 42-artifact identity.

   Initial inspection confirms a blue-noon to warm-minus-30 to orange/gold-
   minus-10 to dark red-horizon sunset progression, while also exposing broad
   minus-30 highlight loss at zero and positive stops. This is qualified
   evidence for the project owner's full-context decision, not an accepted
   appearance and not authorization to begin Stage 8c.

   Immutable presentation run
   `000360-camera-stage8b-production-comparisons` (artifact set
   `b491d659d1cbcb9c7297ea96a58e41e66bba00a7bb4b3ef476111c0243ea5612`)
   places the corresponding direct production GPU reference on the left and
   each Stage 8b camera result on the right for all 32 view/condition/exposure
   combinations. The two `641 x 401` inputs are joined with a 16-pixel neutral
   divider into `1298 x 401` comparisons. Decoded left and right pixels are
   byte-identical to their verified parents; the compositor performs no
   resampling or Color operation. Use this run for the owner decision while
   retaining runs `000331`, `000332`, and `000359` as the scientific
   source owners.

   In a separate qualitative review against the owner-supplied Sony RX10
   II/M2 sunrise-video screenshots, the project owner finds the `EV +2` row
   the closest match in most cases. This judgment concerns the external
   video's bright scene exposure and washed-out solar region; it is **not** a
   comparison against the production GPU row in run `000360`. The locations,
   atmosphere, foreground, optics, exposure automation, and exact solar
   elevations are unmatched, and the video does not publish aperture, shutter,
   ISO, focal length, picture profile, or exposure changes. Therefore `+2`
   is a useful qualitative camera-appearance reference only. Do not reinterpret
   it as a production-match calibration, physical aperture/shutter/ISO, or
   universal camera EV.

   The owner also observes that `EV +2` is close to the production GPU
   presentation in several low-Sun cases, but differs materially from
   production at solar noon. Production is not a camera oracle. A subsequently
   supplied high-Sun video frame now provides qualitative camera context:
   saturated blue sky, a large clipped white solar core, and no recoverable
   disk boundary. The owner finds that gross exposure again favors the `+2`
   row. This supports `+2` as the current cross-elevation qualitative
   camera-presentation row, while still not calibrating a physical EV because
   the reference lacks source identity and camera settings.

   The high-Sun reference also contains strong radial rays, veiling glare, and
   colored lens ghosts. Those are spatial optical/sensor effects absent from
   Stage 8b, not Color errors. Do not enlarge or whiten the disk inside the
   spectral transform to imitate them. A later explicit glare/point-spread
   stage may operate on clipped source energy, and a geometry-owned application
   overlay may keep the true disk location discoverable. Neither mechanism
   changes atmosphere transport or the core camera-color matrix.

   The owner accepts the two similar high-Sun captures as the subjective basis
   for the next sky-color refinement. Hold the Stage 8a camera matrix and
   `EV +2` exposure fixed. The desired qualitative relationship is a deeper,
   more saturated blue sky while the Sun remains clipped; do not match the
   captures' pixels, glare kernel, or exact hue. First trace representative
   blue-sky pixels through sensor raw, D65 XYZ, pre-clip Rec.709, clipped
   Rec.709, and encoded sRGB to localize the saturation loss. Only then compare
   the current hard-clip control with the smallest standard camera-development
   operation that addresses the identified seam. Preserve luminance ordering,
   avoid a Sun-specific Color branch, and keep optical glare separate.

   A sourced noon still now strengthens this target. Wikimedia Commons'
   `Sun at noon.jpg` records a Samsung Galaxy M01 at ISO 102, f/2.2,
   1/6444 s, 2.26 mm, average-metered auto exposure, auto white balance, and
   sRGB output--approximately `EV100 14.9`. Its processed JPEG still combines
   a deep blue sky with a fully clipped, enlarged white solar region. Use it as
   a setting-backed sanity reference for the qualitative relationship, not as
   a clear-atmosphere pixel oracle. The cloudy field and undisclosed phone
   development remain unmatched, and Stage 8b's relative exposure cannot be
   converted to physical EV before Stage 8c establishes absolute sensor scale.

   The owner accepts that the displayed solar disk will be unrecoverable under
   most ordinary single-exposure camera conditions. Camera acceptance must no
   longer require a bounded or colored disk. Preserve the physical disk
   spectrum and geometry internally, allow capture/display clipping to remove
   its visible boundary, and evaluate sky exposure and color independently.
   Disk recovery belongs only to explicit Manual underexposure/filter, HDR,
   diagnostic, or application-locator modes. Do not add a Sun-specific Color
   correction to satisfy ordinary camera output.

   **8c. Physically scaled sensor proof.** Only after 8a and 8b succeed, add
   unit-bearing aperture/optical throughput, shutter time, pixel area or
   equivalent optical etendue, quantum efficiency or calibrated responsivity,
   black/read-noise floor, saturation/full-well capacity, ISO/system gain, and
   ADC behavior. Follow EMVA 1288's separation of these quantities. Keep
   photon-to-electron conversion and raw capture clipping before white balance,
   camera-to-display conversion, and development. Do not attach a named-camera
   physical claim to authored or merely relative parameters. If measured
   absolute data is unavailable, label the result as an authored generic
   camera and state its limits.

   The first Stage 8c case is now frozen as an **EXIF-anchored generic-phone
   proof**, not a Galaxy M01 reproduction. Use the Wikimedia noon still's
   recorded `f/2.2`, `1/6444 s`, ISO 102, 2.26 mm, average-metered auto
   exposure, auto white balance, and sRGB output as the setting-backed exposure
   configuration. Use the valid production noon native-15 field as the
   transported source. Acquire sourced generic-phone values where available
   and declare every authored remainder: pixel area, optical transmission,
   absolute QE/spectral response, full-well capacity, read noise, system gain,
   ADC and development curve. Glare is explicitly deferred.

   The proof must perform photon conversion and raw full-well clipping before
   white balance and development. Its primary relationship gate is that useful
   blue-sky raw values remain below full well while the direct Sun exceeds it
   and becomes unrecoverable. Apply a fixed global phone-like development only
   after that capture proof; use the Wikimedia still and paired high-Sun
   captures for subjective blue-sky review, never pixel fitting. Do not add
   bloom, veiling glare, starburst rays, lens ghosts, or another spatial
   optical kernel to this first case. Label the result generic and report
   sensitivity to every authored sensor parameter; no output may be called a
   Galaxy M01 reproduction.

   **Stage 8c discrete execution checklist (canonical restart sequence):**

   1. **Audit the capture boundary.** Verify from the contained production
      snapshot that captured native-15 `preDisplayRadiance` is bin-average
      `W m^-2 sr^-1 nm^-1`, that source irradiance is divided by the Sun's
      apparent solid angle to form disk radiance, and that native bin widths
      have not already been integrated. Record source paths and hashes.
   2. **Freeze the generic sensor envelope.** Retain the Wikimedia EXIF facts
      (`f/2.2`, `1/6444 s`, ISO 102, 2.26 mm, average metering, auto white
      balance, sRGB). Separately label pixel pitch, lens transmission, absolute
      QE amplitude, full well, noise, gain, ADC, and development as sourced or
      authored. Do not make a Galaxy M01 claim.
   3. **Compile the photon-response profile offline.** Globally normalize the
      accepted Stage 8a PBRT response shapes, scale them to the authored QE
      peak, integrate `QE_c(lambda) * lambda` over each native bin, and fit a
      fixed D55 sensor-to-D65 XYZ matrix with the pinned Colour oracle. Retain
      the oracle input/output and independent JavaScript matrix comparison.
   4. **Apply physical capture in the required order.** For every production
      noon spectrum compute on-axis image irradiance with
      `E_lambda = L_lambda * pi/(4*N^2) * transmission`, convert photons to
      electrons using pixel area and shutter time, and clip electrons at full
      well. This clipping must occur before ISO/gain, ADC, white balance,
      camera characterization, Rec.709 conversion, or sRGB encoding.
   5. **Prove the raw relationship.** At minimum retain disk-center,
      upper-quarter sky, and top-center sky spectra and electron counts. The
      nominal case passes only if all direct-Sun raw channels clip and all
      named blue-sky channels remain below full well. Run the declared cross
      product of pixel pitch, QE, transmission, and full well; report the
      fraction retaining the same relationship.
   6. **Render only the minimal diagnostic.** Produce the generic-phone wide
      noon result through the fixed characterization and minimal sRGB path,
      plus an immutable copy of its production reference. Do not add a tone
      look, bloom, veiling glare, starburst, ghost, PSF, or Sun-specific Color
      branch in this proof.
   7. **Qualify and preserve evidence.** Run the focused self-verifying runner,
      require finite full-frame results, verify protected-file identity and
      module containment, and finalize one immutable run with all parents,
      equations, parameter sources, authored assumptions, tool versions,
      artifact hashes, sweep data, and claim limits.
   8. **Make the next decision from evidence.** First decide whether physical
      capture robustly explains a clipped Sun beside an unclipped sky. Only
      after that passes, inspect sky brightness/color and choose whether a
      fixed standard development curve is needed. Glare remains a later,
      separately owned experiment.

   Current implementation inputs for this checklist are
   `camera-generic-phone-stage8c-v1.json`,
   `camera-stage8c-colour-oracle.py`, and
   `run-camera-generic-phone-stage8c.js` under `scripts/extraterrestrial/`.
   They are accepted by immutable run
   `000363-camera-generic-phone-stage8c` (artifact set
   `06c581d4802ffc2598a76147edac62db0c4b93e2c3c954d562f8159a71242829`).
   The nominal `1.12 um`, `50%` peak-QE, `70%` transmission, `5000 e-`
   profile places disk center at `6,972.5x`, `12,932.5x`, and `8,194.2x`
   full well in raw R/G/B, while upper-quarter sky remains at
   `3.05%`, `6.74%`, and `5.09%` and top-center sky at `1.35%`, `3.27%`,
   and `2.70%`. All `81/81` combinations of authored pixel pitch, QE,
   transmission, and full well retain an all-channel-clipped Sun and
   unclipped named sky. Only nine full-frame pixels clip, all in all three
   channels. Colour and JavaScript characterization matrices agree to
   `3.30e-14` maximum absolute error; all values are finite and containment
   passes.

   Failed run `000361` contains only the sandbox-denied read-only containment
   attempt. Run `000362` first accepted the raw relationship but is superseded
   as display evidence because it omitted the fixed sensor white-balance step
   and rendered a magenta fully clipped highlight. Run `000363` derives D55
   white-balance multipliers `[1.910069, 1, 1.560811]`, applies them after raw
   clipping and before characterization, and maps the fully clipped disk to
   near-white encoded sRGB `[0.990965, 0.997621, 0.989130]`.

   This accepts the physical-capture relationship, not phone-like final
   appearance. The minimal no-tone-curve render is dark and weakly blue.

   **The prior next step--selecting one development operator directly--is
   superseded.** Stage 8c now proceeds by proving individual camera controls
   and their composition before accepting any combined camera preset.

   **8c.2. Camera-control factorization and composition proof:**

   All camera-control functionality is implemented as one configurable
   `CameraColorModel`, which owns the complete native-15 spectral-radiance to
   encoded-display conversion. Sensor capture, clipping, electronics, white
   balance, characterization, and development are ordered internal stages of
   that Color model. Every parameter is supplied through one versioned,
   immutable `CameraColorProfile`; control changes select or derive another
   complete profile rather than passing loose values to the model. The
   [Camera Controls Development Plan](camera-controls-development-plan.md)
   owns its architecture, work packages, diagnostic interfaces, and promotion
   boundaries. The
   [Camera Controls Testing Plan](camera-controls-testing-plan.md) owns the
   execution and acceptance sequence. Exact cases, sources, levels,
   expectations, and tolerances remain owned by the
   [Camera-Control Test Inventory](camera-control-test-inventory.md). A runner
   may implement only inventoried cases and may not infer a factorial grid from
   the listed control levels.

   The inventory's source audit is complete for the executable mechanics and
   static frequent-use cases. It distinguishes inherited Algorithm32 fields,
   retained EXIF observations, published standards/manufacturer/paper data,
   equation-derived validation levels, and authored diagnostics. The latter
   may test ordering or isolation but may never be reported as observed camera
   behavior. Development candidates and the exact timelapse exposure policy
   remain blocked because their data are not yet frozen.

   Keep one fixed production spectral field and the accepted Stage 8c sensor
   profile while changing exactly one control per independent proof. Separate
   user-facing settings from fixed camera/lens characteristics:

   | Owner/layer | Independently varied quantity | Required invariant or law |
   |---|---|---|
   | Optical capture | shutter time `t` | Pre-clip electrons scale exactly as `t`; spectrum and chromaticity do not change. |
   | Optical capture | f-number `N` | Pre-clip electrons scale as `1/N^2`; no post-capture value may feed back into capture. |
   | Optical capture | neutral-density attenuation in stops | Pre-clip electrons scale as `2^-stops`; ideal ND does not change chromaticity. |
   | Sensor electronics | ISO/analog gain | Incident photons and pre-gain electrons remain identical; only post-well signal/DN and ADC clipping change. |
   | Sensor electronics | full well and ADC range | Full-well clipping precedes gain; ADC clipping follows gain. Report both separately. |
   | Color processing | white-balance multipliers or preset | Raw electrons and raw clipping remain identical; only post-raw channel ratios change. |
   | Color processing | fixed camera characterization matrix | Raw and white-balanced values remain identical; only working-space coordinates change. |
   | Development | exposure/look/tone operator | Every capture and Color intermediate remains identical; only developed output changes. |
   | Automatic policy | metering and exposure compensation | These select explicit aperture/shutter/ISO settings; they are not an additional pixel transform. |
   | Multi-capture policy | HDR bracket and merge | Each bracket member must first pass the single-capture model independently; merging is a later separate owner. |

   Pixel pitch, QE curves, lens transmission, full-well capacity, read noise,
   black level, and ADC precision are device/profile characteristics rather
   than ordinary per-shot controls. They remain independently configurable for
   validation, but must not be presented as camera-setting sliders unless the
   selected device actually exposes them.

   The complete color-influence ranking now also includes CFA/QE response,
   cover-glass and IR/UV-cut transmission, real lens/filter spectral response,
   pixel fill factor/microlens/angular response, conversion gain, black/dark/
   noise/crosstalk characteristics, ADC transfer, and deferred spatial optics.
   The Camera-Control Test Inventory owns that ranking. Treat these as fixed
   profile characteristics even when the experiment varies them diagnostically.

   The inventory also owns a dependency-ordered `P0`–`P9` execution queue.
   Physical profile tests for QE/CFA, the sensor stack, lens/filter response,
   pixel geometry, saturation, gain/black/noise/crosstalk, ADC, and spatial
   optics are explicitly included. Downstream WB, matrix, development,
   interactions, and frequent-use configurations may run only after their
   upstream characteristic groups pass or are explicitly held fixed with the
   documented limitation.

   Execute the factorized proof in this order:

   1. Freeze a deterministic control fixture using the accepted wide-noon
      native-15 field, the Stage 8c generic sensor, no stochastic noise, fixed
      D55 white balance, fixed characterization, and identity development.
   2. Run shutter-only, aperture-only, ideal-ND-only, ISO-only, white-balance-
      only, matrix-only, and development-only sweeps. At every boundary retain
      the disk-center and named-sky values plus full-frame clipping counts.
   3. Prove exposure reciprocity with at least three aperture/shutter pairs
      having equal `t/N^2`. They must produce the same deterministic pre-clip
      electrons and raw clipping, within a declared numerical tolerance.
   4. Prove multiplicative optical composition:
      `captureScale = t * transmission * 2^-ND / N^2`. A direct combined
      evaluation must equal application of the independently proven factors.
   5. Prove the required non-commutativity: optical exposure before full-well
      clipping must differ from ISO gain after full-well clipping whenever the
      source saturates. This prevents ISO from being implemented as another
      photon-exposure multiplier.
   6. Prove downstream isolation: changing white balance, matrix, or
      development must produce byte-identical recorded raw electrons and raw
      clipping evidence.
   7. Do **not** construct the Cartesian product of control levels. Independent
      sweeps hold every other control at one frozen baseline, so their cost is
      proportional to the sum of selected levels rather than their product.
      Add only targeted pairwise cases where an interaction is physically
      meaningful: aperture/shutter reciprocity, optical exposure versus ISO,
      raw clipping versus white balance, and capture versus development.
   8. Only after the independent gates pass, render one compact baseline-
      relative plate: the baseline, each one-control variation, the required
      interaction cases, and a small curated set of frequent combined uses.
      Do not render a factorial grid or collapse all controls into a single
      unexplained `EV` label.
   9. Define the frequent combined configurations strictly as lists of already
      proven control values. The initial curated set is:

      - bright-daylight generic phone, anchored by the Wikimedia settings;
      - ordinary daylight camera exposure;
      - sunset/low-Sun scene exposure that accepts a clipped disk;
      - shutter-underexposed disk-recovery/manual diagnostic;
      - passing-time automatic-exposure checkpoint; and
      - the individual short/scene exposures of a later HDR bracket, evaluated
        independently without implementing the merge.

      Freeze exact values from sourced examples or visibly authored settings
      immediately before execution. A combined configuration passes only when
      its intermediates equal the direct composition predicted by the relevant
      individual control proofs.

   The combination budget is therefore `baseline + sum(independent levels) +
   required interaction cases + curated frequent configurations`. It must not
   grow as the factorial or full Cartesian product of all settings. Add a new
   combination later only when it represents an actual product mode, a common
   photographic use, or a failed interaction that needs diagnosis.

   This stage proves camera emulation mechanics, not a named camera's secret
   firmware. Appearance review begins only after the independent controls and
   combination laws pass. Glare, motion blur, depth of field, diffraction,
   vignetting, rolling shutter, automatic metering, temporal smoothing,
   stochastic noise, and HDR merge remain separately introduced effects.

   **Terminal Stage 8c.2 decision.** Runs `000382`, `000384`, and
   `000385` accept control composition, deterministic selection under authored
   profiles, and prediction-to-render parity. They do not establish absolute
   real-camera exposure or photographically optimal settings. Setting-backed
   review run `000386-camera-wikimedia-noon-reproduction` (artifact set
   `1ab2e6b8e2d747be9b2c5205cdc8d81c436bae90ec08777f69b64433652ece8f`)
   is technically valid but visually fails: its gray-blue clear field does not
   reproduce the reference's deep-blue sky or circumsolar appearance. Missing
   clouds and glare are insufficient to explain the clear-sky color failure.

   The project owner has declared the camera-emulation experiment a failure and
   stopped the lane. Do not execute `D8.3/T8.3`, `D9/T9`, or the later camera
   stages. The missing absolute exposure calibration, real-ISO interpretation,
   developed-sRGB boundary, and clear-sky appearance qualification remain
   documented failure boundaries. Retain the accepted control mechanics only
   as historical evidence for their narrow claims; do not promote them into a
   camera-emulation candidate. Do not reopen atmosphere transport or add
   glare/cloud simulation to reinterpret the failure.

   **8d. Passing-time exposure proof -- stopped, not authorized.** The former
   continuation would have added Manual Camera, Auto Timelapse,
   and HDR Timelapse. Auto Timelapse uses a fixed geometry-owned angular
   metering pattern, a declared `0.18` middle-gray target, exposure compensation
   in stops, and temporally smoothed stop-space tracking. It holds aperture and
   daylight white balance fixed, ramps shutter first, and changes ISO/gain only
   at a declared shutter limit. Do not use direct solar irradiance alone as the
   meter and do not tune exposure or smoothing from rendered screenshots.
   Prefer a precomputed metering and exposure schedule for offline animation so
   forward playback, reverse playback, seeking, and repeated renders are
   deterministic. Runtime camera Color remains the `3 x 15` dot products plus
   bounded scalar clipping/exposure operations, one fixed `3 x 3` conversion,
   and fixed development; it performs no full-frame analysis or spectral
   library execution per pixel.

   `D0/T0` is now accepted in immutable run
   `000366-camera-color-model-d0-t0` (artifact set
   `185f9eb2a23485705c1b3269bfdf2beb7ab0d638738241de654d1fb08b346d4c`).
   The contained public `CameraColorModel`, complete immutable baseline
   `CameraColorProfile`, profile compiler, and trace contract reproduce the
   accepted Stage 8c framebuffer byte-for-byte across `257,041` pixels, retain
   the accepted `9` raw-clipped pixels, produce no public/trace mismatch or
   non-finite value, and preserve exact zero.

   `D1/T1` is accepted in immutable run
   `000367-camera-color-model-d1-t1` (artifact set
   `8bf33764f0ead4524653035284582a98050657e4fa2e7b7adc19ebb7df96ca0f`).
   Profile response agrees with retained Colour and independent pinned-Python
   evaluation below `4e-16` relative; five-level pre-clip scaling and sensor
   chromaticity are exact at reported precision; and all `1,028,164`
   full-field evaluations are finite with zero public/trace mismatch. Proceed
   to `D2/T2` after retaining its exact exposure/filter source documents.

   `D2/T2` is accepted in immutable run
   `000370-camera-color-model-d2-t2` (artifact set
   `85e39815201169ecf0c56b35bd8c4551bfd5ffeaa7aed31cbfede3375dec5e88`).
   Thirteen complete profiles qualify shutter, aperture, ideal-neutral OD, and
   pixel-area controls over `3,341,533` full-field evaluations. Maximum factor
   and chromaticity errors are below `6.2e-16` and `1.12e-16`; clipping is
   monotonic; OD 5 removes all raw clipping; and all nine endpoint renders have
   zero public/trace mismatch. Exact Stanford and official Baader source bytes
   are retained and hashed. Proceed to `D3/T3` full-well/raw clipping.

   Production RGB is only a regression lane, not camera Color truth. `D3/T3`
   first materializes analytic, pinned Colour/ColorChecker, camera-response,
   transported-sky, and qualitative photographic records as the versioned
   `CameraColorReferenceCorpus`. Saturation then exercises no-, one-, two-, and
   all-channel clipping rather than judging Color only from production sky.

   `D3/T3` is accepted in immutable run
   `000371-camera-color-model-d3-t3` (artifact set
   `ec5a8b3b330a5864d79aa949000ce96438f9a40023ce4043786e13d80eb315ad`).
   Its `132`-record multi-source corpus and five full-well profiles pass `645`
   evaluations with exact pre-clip invariance and explicit 0/1/2/3-channel
   clipping. Production RGB is not used as its Color oracle. Proceed to
   `D4/T4` sensor electronics and ADC.

Post-sunset direct illumination becomes zero while the sky remains illuminated.
For this calibration step, use one declared diagnostic minimum `L_A` and do not
claim it as the final post-sunset observer model. Resolve that case later with
the separately deferred ambient-light redesign; it does not block the four
visible-Sun calibration frames.

This plan uses all nine frozen calibration observations for numerical state
checks but generates the four declared full-context frames for the first visual
decision. Held-out observations remain sealed until a candidate is frozen.

The global-state table is accepted in immutable run
`000291-spectral-color-global-state-table` (artifact set
`66a3b985650148c54b239ade9f9bee142d88c44d8452c8dfe3c9020e835c9594`).
It manifest-verifies the frozen Stage 1 ledger and retains native-15
irradiance plus the derived global state for exactly the nine calibration
observations. Direct photopic illuminance spans `119.49398463128085` to
`105233.15142421998 lux`; `L_A` spans `38.03611664763064` to
`33496.75245260507 cd/m2`; and `F_L` spans `0.5750718101940465` to
`5.512190725331983`. The adaptation floor is inactive for every calibration
row. Noon exceeds both one-hour neighbors, and the spherical sunset sequence
decreases strictly from minus 60 to minus 30 to sunset.

State-only checks for noon, sunset-minus-30, sunset-minus-10, and sunset are
finite and distinct in `E_v`, `L_A`, and CAM16 `Q`; no display transform or
review image was generated for the non-calibration minus-10 row. This accepts
the direct-illumination global-state proxy for the narrowed experiment without
claiming complete visual adaptation. Proceed to the receptor-parameter
prerequisite, then the LMS projection and metamer proof.

The receptor-parameter prerequisite is accepted in immutable run
`000293-spectral-color-receptor-parameter-proof` (artifact set
`8bde2baa90ceda20df41422192b858bed21826d93d83fdb05e75b9f348043b38`).
The pinned CIE dataset matches its published hash; the D65-normalized
LMS/XYZ_F matrix round trip, response crossings, monotonic bounded sweeps, and
equal-LMS identity pass 11 assertions. The accepted claim remains limited: CIE
LMS and the `n = 0.74` response shape are physiological references, while the
CAM16-derived half-saturation placement is explicitly a reproducible appearance
choice. Proceed to native-15 LMS projection, one-nanometer convergence, and
constructed spectral-metamer proof without generating images.

The projection and metamer step is accepted in immutable run
`000294-spectral-color-receptor-projection-proof` (artifact set
`b866e80e451c5d8b1d2077822ffc8b2d4c2b870e9dcdf2081fd2c85b8b3e6909`).
Its exact three-by-fifteen bin-integrated LMS matrix agrees with an independent
one-nanometer construction to `5.2753657089343e-16` maximum relative error, and
all 25 eligible disk spectra round-trip through CIE 2015 XYZ_F to
`4.657780671341199e-16` relative. A materially different constructed pair has
exactly equal integrated LMS and nonlinear receptor response; applying the
nonlinearity before spectral integration incorrectly separates it by
`0.0017164935297639384` relative. The CIE 2006 LMS/XYZ_F versus CIE 1931
comparison is retained as a deliberate observer-basis diagnostic, not an
integration gate: its measured maximum difference is `5.728013%` in Y and
`0.00366966` in CIE 1976 u-v. Proceed to receptor curve sweeps; do not generate
full-context images yet.

The receptor operating-range sweep is accepted in immutable run
`000295-spectral-color-receptor-curve-sweep` (artifact set
`0ac84ae83f6e9d25830f56a8892d9329ca25b827bea8f64d4631fb5f59008923`).
It retains 60 wavelength/state curves with 4,860 samples and 16 equal-energy,
D65-neutral, unattenuated-source, and measured-condition reference curves.
Analytic 1%, 50%, and 99% crossings, monotonicity, finite CAM16 controls, D65
neutrality, measured-state distinction, progressive dimming, and progressive
red-minus-blue warmth pass ten assertions. Mean primary response is
`0.9995369` at noon, `0.9953672` at sunset minus 30, `0.9867900` at minus 10,
and `0.7990227` at sunset. Thus the four states do not share a 99% white
plateau, but the declared placement predicts very weak chromatic separation at
noon and minus 30 and much stronger separation only near exact sunset. Preserve
that as candidate behavior; do not compensate with a fitted display curve.
The complete measured-spectrum receptor/display proof is accepted in immutable
run `000301-spectral-color-receptor-display-proof` (artifact set
`7e2b6dadea5b7f49d81b01b892ef880d073dab7a0e8d9dfd4697b08a2cb876b2`). All
13 gates pass across `1,001` neutral samples, `1,331` response-cube samples,
nine measured calibration spectra, and the metamer, continuity, hue, gamut, and
plateau checks. No calibration result is exact white or gamut limited. Rejected
run `000300` exposed a gate defect rather than a transform defect: its blanket
plateau rule classified the noon-minus-60/noon-plus-60 pair as materially
different even though its input difference was only `0.147%`. The corrected
gate treats input differences below `0.55%` as near-equivalent, consistent with
the accepted approximately `0.53%` native observer-projection uncertainty; the
Color transform itself did not change. The candidate is frozen. Immutable run
`000302-spectral-color-local-light-record` accepts the reusable exact-time
local-light inputs. Immutable run `000305-spectral-color-receptor-full-frame`
(artifact set
`625e481391af5c6d15aed3d893c6fef4f8994052dc4e0611dc2b8f9920cbc986`)
accepts the four-frame output as technically qualified observer-proxy review
evidence, not as an accepted appearance. One atmosphere setup produced noon,
sunset-minus-30, sunset-minus-10, and sunset; all 15 composed channels were
retained before one uniform receptor transform processed `521,404` pixels.
There are zero exact-white, gamut-limited, or black pixels. Disk-center encoded
RGB progresses from `[0.999831, 0.999804, 0.999773]` at noon to
`[0.937905, 0.912812, 0.899754]` at sunset, but the complete fields remain
visibly gray and low-chroma. The active gate is the project owner's review.

The project owner selected CIE 170-2 MacLeod-Boynton chromaticity for the next
candidate rather than mapping independently compressed cone responses directly
to display LMS. Immutable run
`000306-spectral-color-macleod-boynton-display-proof` (artifact set
`9fb4d544e7126580e30d981c2a5ca5e9ba6729d759b4834d679b5d97ec1d78bf`)
accepts the numerical implementation. It computes `Y_F = 0.68990272 L +
0.34832189 M`, `l_MB = 0.68990272 L / Y_F`, and `s_MB = 0.0371597 S / Y_F`;
only `Y_F` receives the frozen Naka-Rushton brightness response. MacLeod-Boynton
chromaticity reconstructs exactly and remains invariant across six orders of
spectral scaling, D65 remains neutral, all ten measured outputs remain distinct
and non-white, and warmth increases strictly from noon through sunset. All ten
measured disk outputs require same-Y Rec.709 containment because mapped
brightness lies near peak. This boundary behavior is reported rather than
hidden or used to retune the physical chromaticity. Proceed to a four-frame
full-context review before any promotion or exposure change.

Immutable run `000308-spectral-color-macleod-boynton-full-frame` (artifact set
`94c1bc77e669e5d84f974a13cf676a0b3644fe37678fd5e0ffcb449b62c79024`)
accepts that review artifact for technical integrity. A single atmosphere setup
produced all four exact-time native-15 fields; one unchanged MacLeod-Boynton
transform processed all `521,404` pixels. Zero pixels are exact white or black,
and `688` pixels (`0.132%`) are gamut limited. Disk-center warmth improves over
the direct-response run, especially at exact sunset, whose encoded center is
`[1.0, 0.897138, 0.853907]`. The atmospheric field nevertheless remains
predominantly gray and the minus-30/minus-10 disks remain near neutral. Treat
this as evidence that standard cone chromaticity preservation removes one
collapse mechanism but does not supply the opponent contrast/colorfulness gain
needed for a satisfactory appearance. Appearance acceptance remains pending.

Rejected immutable run `000307` completed rendering but failed containment
finalization because its wrapper used prohibited dynamic import. Run `000308`
uses a static entry and changes no Color or transport equation.

Immutable run `000310-spectral-color-fixed-chromaticity-full-frame` (artifact
set `1fa76605894eaf0dceb20da273673baf6ee32f331754c5feccf00439f2aeb5d7`)
accepts a fixed-`50 cd/m2` CIE 2015 `XYZ_F` chromaticity diagnostic over the
same four complete native-15 fields. It intentionally removes all absolute
brightness and adaptation differences while preserving the standard-observer
chromaticity of each nonzero composed spectrum. All `521,404` pixels are
finite and bounded, with zero exact-white, black, saturated, or gamut-limited
pixels. The disk is modestly warm at noon, minus 30, and minus 10, and clearly
warmer at exact sunset; the surrounding field remains nearly neutral. This
demonstrates that color information survives transport and spectral projection,
but is partly suppressed by the prior brightness/display mappings. It also
demonstrates that the wider clear ozone-off field does not contain strong raw
chromaticity that a different cone table could reveal. Do not add another
wavelength-response curve. The next minimal candidate first performs the
unchanged standard-observer spectral integration to signed linear RGB. The
already-recorded condition-wide local brightness selects black thresholds
`B_R`, `B_G`, `B_B` and white thresholds `W_R`, `W_G`, `W_B`; one fixed
monotonic range shape maps each channel between its selected endpoints for
every pixel in the frame. Threshold selection may vary with the global local-
light state, but never by pixel, source identity, or wavelength sample. D65
must remain neutral, channel response must remain monotonic, and useful warm
chromaticity must not be forced toward D65 at the Rec.709 peak. Applying the
nonlinearity after spectral integration preserves the accepted metamer result
from run `000294`; applying it independently to wavelengths is prohibited.
Run `000309` is a
numerically identical predecessor superseded only because its proof-state label
incorrectly implied observer review.

Immutable run `000311-spectral-color-rgb-range-proof` (artifact set
`f7e02614aa4376405c796dc3f7ec85a7e589accf38beedaed1b64dfacada52dd`)
accepts the minimal brightness-selected RGB-range transform for its declared
numerical claim. Recorded `L_A` and full analytic solar-disk support derive one
condition-wide midpoint; the retained `n = 0.74` response defines effective 1%
black and 99% white crossings and is applied independently only after standard
spectral integration to linear Rec.709. Ten of ten gates pass: finite bounds,
exact neutral balance, strict monotonicity over twelve orders of relative input,
crossing reconstruction, changing condition ranges, distinct measured outputs,
strict noon-to-sunset warmth, and no exact-white or exact-black disk. This is
not an appearance acceptance. The disk warmth metric rises from `0.0210106` at
noon to `0.0293708` at sunset, less separation than the fixed-50-nit diagnostic.
Proceed to the four exact-time full-frame review without changing the range
equations; use that review to decide whether the RGB range is sufficient.

Immutable run `000312-spectral-color-rgb-range-full-frame` (artifact set
`b41a823a720e92049f3c5761adb7b9de3419adb23e1a4c80719b616963a99719`)
accepts the four-frame artifact for technical integrity; the project owner
rejects the unchanged `000311` formulation completely for color and brightness.
One atmosphere setup produced
all four native-15 fields and the RGB-range transform processed all `521,404`
pixels without a Sun branch. There are no exact-white, saturated, or gamut-
limited pixels, but noon has `130,174` effective-black pixels (`99.864%` of the
frame). At the other extreme, exact sunset maps the wider field to bright gray
and reduces disk/background separation. A single direct-solar midpoint plus
fixed `n = 0.74` response therefore cannot own both ends of the required scene
range. More fundamentally, `L_A = Y_disk * omega_visible / pi`; for the first
three fully visible conditions, the chosen midpoint `L_A * pi / omega_full`
equals disk Y and cancels the time-varying absolute brightness exactly. At
sunset, `omega_visible / omega_full = 0.565448`, so the midpoint falls relative
to the still-visible center and reverses the intended brightness trend. The
same saturating response compresses channel ratios and reduces the retained
warmth relationship. Run `000311` now has only an internal arithmetic claim and
does not qualify a development candidate. Preserve standard spectral
integration and the global RGB-range architecture, but replace this coupled
normalization with independently selected brightness-dependent black and white
endpoints and a fixed monotonic mapping between them. Do not tune or extend the
rejected midpoint equation. A future full-field parameter sweep may consume an
immutable capture from an earlier run. Preserve that source run and its
artifacts unchanged, write every derivative into the new run, and record enough
source and compatibility identity to qualify the comparison. Candidate
comparisons should still share one declared input field so transport
differences cannot masquerade as Color differences.

Immutable run `000313-spectral-color-rgb-endpoint-sweep` (artifact set
`6b643097c193be4fbab130637c89fc04bfaed1cf36fffdc6cf60283a3df6dc60`)
follows that rule: one atmosphere acquisition feeds 18 in-memory combinations
of scene dynamic range (`10^6`, `10^8`, `10^10`), sublinear endpoint slope
(`0.25`, `0.5`, `0.75`), and noon peak (`0.75`, `0.9`). Each candidate derives
independent RGB white endpoints and uses a fixed logarithmic map between its
black and white endpoints. Zero candidates survive the declared gates. The
best-ranked row passes disk brightness ordering, material noon-to-sunset disk
span, warmth ordering and retention, black/saturation bounds, and disk-to-sky
separation. It fails because mean field luminance rises `0.39255 -> 0.63876`
from noon to sunset and a neutral input acquires `0.10873` encoded channel
spread. The comparison plate remains beige/gray with a pale disk. Reject this
entire per-channel log-endpoint family rather than widening its grid. Its two
jobs conflict: endpoint adaptation brightens the wider field as `L_A` falls,
and distinct nonlinear channel endpoints cannot preserve the neutral axis.
The next candidate must give brightness one scalar owner and retain standard
RGB ratios separately; no further endpoint sweep is authorized by this result.

Immutable run `000314-spectral-color-scalar-rgb-sweep` (artifact set
`13bdaf1d65d137e09396c0aa39e2ef5bc7f722682f0c0943fc61c18dcfa65916`)
tests that separation directly. One scalar logarithmic luminance map provides
an identical linear gain to R, G, and B after standard spectral integration;
only a common positive-gamut scale may follow. Across the best candidate,
neutral spread is zero and maximum disk-center RGB-ratio error is
`5.55e-17`. Its center dims materially and warms monotonically, with no black,
saturated, or gamut-limited pixels. Visual inspection confirms that the beige/
brown field cast introduced by independent channel endpoints is gone. The
remaining surrounding field is gray because its accepted ozone-off spectra are
near-neutral, as already isolated by run `000310`.

No candidate passes every declared gate. The best row (`dr6-a0-p075`) fails
only `strict-mean-brightness-decrease`: encoded field mean rises from `0.39804`
at noon to `0.55500` at sunset even though disk center falls from `0.87975` to
`0.67495`. Do not interpret the zero-survivor count as renewed evidence for
per-channel curves. Before accepting or rejecting the scalar design, record the
pre-transform mean luminance of each complete spectral field and determine
whether a Sun-centered atmosphere-scattering view is physically expected to
dim in the mean. The gate may not impose a scene-wide relation that transport
does not supply.

Immutable run `000316-spectral-color-fixed-exposure-sweep` (artifact set
`d804cd3b5dafa8402235bc8da4ceefaf8e8d4cd8707cd19a0983a69a03c07a05`)
then removes the disputed local-brightness path completely. Its five fixed
exposures are shared across all four clock states and operate directly on
standard scene-linear Rec.709. There is no adaptation, tone curve, endpoint
selection, or independent channel operation; unclipped RGB ratios are preserved
to `1.11e-16`. The diagnostic does not recover strong sky color. At an exposure
that makes the field visible, the 15-degree Sun-centered atmosphere is gray
with only a weak warm sunset gradient; larger exposures simply clip the field
to white. This falsifies the working assumption that removing local-brightness
adjustment alone will restore the missing sky colors.

Pause brightness-curve development. The next bounded prerequisite is a spatial
pre-Color audit at representative viewport locations. Retain each native-15
spectrum, its CIE 2006 LMS/CIE 2015 XYZ_F projection, signed linear Rec.709,
chromaticity, and fixed-exposure value. Compare the current standard projection
with the retained Bruneton lane's projection on the identical spectrum. Also
separate the 15-degree circumsolar-field claim from a wider-sky claim. Do not
add saturation or opponent enhancement until this audit says whether color is
absent in transport or lost in projection.

That audit is complete. On 32 identical native-spectrum pixels, the current CIE
2006 LMS/CIE 2015 `XYZ_F` projection remains within `0.002676` CIE 1976 u-v of
Algorithm32's production CIE 1931 projection. Both preserve the input's blue-
dominant noon-sky and warm sunset-center channel relationships. Projection is
not the first material loss seam.

Immutable run `000317-spectral-color-fixed-exposure-wide-field` (artifact set
`321997f98335af9f1f2d554db2acc06d46ea517ca2986f002c185e13a9545352`)
uses Algorithm32's own CIE 1931 bin-center projection, fixed exposure, and a
`90`-degree vertical field. The wider blue atmospheric gradient is plainly
visible without any local-brightness input or channel adjustment. The earlier
`15`-degree Sun-centered fixture selected only the pale circumsolar field and
therefore discarded the wider sky color at acquisition/framing time. Split the
review fixtures: retain `15` degrees for disk and immediate-circumsolar
diagnostics, but require a wide field for claims about the surrounding scene or
sky color. Brightness-transform work may resume only against the correctly
scoped view.

Immutable run `000318-spectral-color-bruneton-captured-field` (artifact set
`70a56acf8a752c92ff23d490f14be5050bae426b8055f23ab412253663f1e0c4`)
establishes the direct legacy-color control. Every composed native-15 pixel in
one fresh 90-degree four-frame acquisition is passed to the unchanged contained
`BrunetonColorDisplayModel.radianceToDisplayRgb()` method. No experiment-owned
Color equation runs. The rendered sky is visibly blue, proving that captured
transport and the established colorer retain scene color. At the same time,
all four solar centers and `82,500` total pixels become exact white, preserving
the original reason for seeking a replacement.

Use this as the new minimal comparison boundary. A replacement should begin
from the Bruneton projection/display behavior and change one operation at a
time, with the 90-degree field held fixed. It succeeds only if it preserves the
Bruneton control's sky-color ordering while reducing its exact-white plateau.
Do not resume receptor, independent-channel, or local-brightness experiments as
a combined pipeline.

The control also makes the sunset failure exact. At sunset, warm center linear
RGB `[4.6651e6, 3.0533e6, 2.5785e6]` becomes `[1,1,1]`; `29,935` pixels are
exact white and `81,396` are saturated. Bruneton therefore preserves the wider
blue-sky relationship but destroys the bright orange circumsolar relationship
in its final independent-channel exponential. The next one-variable experiment
retains its native-15 CIE 1931 projection and fixed Figure 1 scalar curve, but
evaluates that curve once on luminance and applies the resulting common gain to
linear RGB. Any final containment must scale all channels together. This is a
testable isolation of the white-plateau defect, not a new observer model or
local-brightness path.

Immutable run
`000320-spectral-color-bruneton-normal-shader` (artifact set
`ed996a60b38fe2f7056aa6084cb853dc7253c72da12be8918d4fe1d44cb33f89`)
is rejected as a literal Bruneton lane-`B` baseline. It invokes the mutable
contained candidate's normal GPU pass, including its candidate-only
sky-illuminance refresh and `visualAdaptationGain`; the sealed baseline does
not contain those operations. The evidence itself contains
no CPU projection, exposure, tone curve, or Color reconstruction. All four
centers are exact white; the four frames contain `151,407` exact-white and
`239,090` saturated pixels. Exact sunset alone contains `53,196` exact-white
and `81,396` saturated pixels. These facts describe that modified candidate,
not untouched lane `B`. The official Bruneton demo presentation additionally
uses an exposure uniform, optional white-point division, and a final `1/2.2`
power; the project adapter explicitly records the latter two operations as
omitted. The replacement control must freeze and name the captured native
spectrum, sealed-baseline GPU projection, sealed-baseline Figure-1 output, and
final presented application pixel separately. Run `000319` remains only an
external fixed-exposure CPU diagnostic.

The corrected comparison is accepted technically in immutable run
`000325-spectral-color-corrected-bruneton-presentations` (artifact set
`f034cc7813e9b2fb3c79476d45c271f5d3f78d4c7d794dea48b708328324536c`).
Both rows are GPU outputs from the same composed native-15 pixels. The sealed
project adapter produces `151,407` exact-white and `239,090` saturated pixels.
Bruneton's documented default luminance presentation (`exposure = 10 * 1e-5`,
unity white point, final `1/2.2` power) reduces those totals to `59,906` and
`191,139`, respectively, but all four disk centers remain exact white and the
sunset atmospheric field remains visually non-orange. This proves that omitted
presentation processing materially changes the image but does not explain the
remaining failure. Before another Color candidate, audit unit and scale at
named pixels across native spectrum, GPU projected linear RGB, official
Bruneton luminance convention, exposure multiplication, and mapped output.
Run `000324` is invalid because runtime uniform refresh forced both requested
rows to the sealed-project selector; runs `000321`--`000323` are failed setup or
evidence-finalization attempts.

The actual production GPU base is accepted in immutable run
`000331-spectral-color-production-gpu-bases` (artifact set
`1e106c04b40680d26bcbafe577db51763100a45a74ad5b52ae4cfd5eb9ea6612`).
Four direct normal-framebuffer PNGs come from the preserved production
Algorithm32 shader, production cache backend, composer pass, and RTX 2060
execution. They visibly restore the expected time progression, including gold
at sunset minus 10 and an orange-red horizon at sunset. This falsifies the
assumption that the reconstructed candidate/captured-field renders faithfully
represent production output. Treat run `000331` as the base-image authority.
The next prerequisite is a same-ray, same-clock seam comparison of run `000331`
production `preDisplayRadiance` and signed linear RGB against the Stage 1/live
captured lane. No new Color curve or exposure selection is authorized before
the first divergent physical or numerical boundary is identified.

Immutable run `000332-spectral-color-production-gpu-sun-focused-bases`
(artifact set
`686e5dee030ff4ff8cadb0bb1cdcb369bd56cc14ddd975038a2f9cc1cf62e324`)
adds the paired production Sun-focused base at `641 x 401`, `15` degrees, and
disk-center aim for the same four times. It is the disk/circumsolar visual
authority; run `000331` remains the wide-field scene authority. A reconstructed
or captured-spectrum lane does not pass merely by recovering one palette. It
must reproduce the production spatial and color relationships in both base
sets, beginning with exact same-ray spectral and signed-linear seam parity.

### Immediate Production-Reproduction Gate

Before any further Color, exposure, or ozone experiment, reproduce the two
production authorities from production GPU spectral data. Execute these steps
in order:

1. In one qualifying execution per view, capture the production normal
   framebuffer together with the same pixels' four `preDisplayRadiance`
   packets (all native-15 channels) and production signed linear RGB. The
   diagnostic reads occur only after the normal framebuffer capture and may
   not alter the image being treated as authority.
2. Replay each captured native-15 spectrum through the exact preserved
   production Color operations: the production CIE 1931 native-15 projection,
   the production Figure-1 display mapping, and framebuffer quantization.
3. Require the CPU spectral projection to agree with the GPU signed-linear
   readback within a declared floating-point tolerance, the replayed display
   values to agree with the production mapper, and every final RGB channel to
   fall within one 8-bit code value of the production framebuffer. Retain
   maximum error and mismatch counts rather than relying on visual similarity.
4. First pass the `641 x 401`, 15-degree, disk-centered four-condition set from
   run `000332`; then pass the wide-context four-condition set from run
   `000331`. Save paired production and replay PNGs plus numerical seam evidence
   in each immutable run.
5. Only after both replays pass, compare the current captured-spectrum lane
   against the production spectrum at identical clocks, camera rays, and
   composition seams. The first divergent seam determines the correction:
   spectrum means acquisition/transport/geometry/cache/composition/units;
   signed linear RGB means observer projection; mapped RGB means Color; and
   framebuffer-only divergence means presentation or quantization.

Generated PNGs from prior runs remain review references, not numerical oracle
inputs. Qualification uses values captured together in the execution being
verified. Correct only the first divergent seam, and do not resume candidate
Color design until both production views are reproduced.

This gate is now executed. Immutable focused replay run
`000334-spectral-color-production-sun-focused-replay-proof` (artifact set
`ee0a352031feaff8df40c22fa9f5a6ab72262722018771a4135247fae5b6347c`)
and wide replay run `000335-spectral-color-production-wide-replay-proof`
(artifact set
`984428c9b7a604acac2d91bd0f12a45ade454a7dd22c7ce560f0251950b5aa9d`)
both pass. Across the two views, maximum production-spectrum replay error is
`6.802096451871264e-7` relative at signed linear RGB,
`2.3925994763196456e-7` absolute at mapped RGB, and one 8-bit framebuffer
code. The production images therefore require no unidentified post-processing:
their captured native-15 `preDisplayRadiance` plus the preserved production
CIE 1931/Figure-1 path reproduces them.

Immutable same-run focused comparison
`000338-spectral-color-production-sun-focused-candidate-seam-proof` (artifact
set `dd201ac540d767b1f3dd00cf03b6089284e3f86b0529c930ca85757e1fd83595`)
locates the first current-candidate divergence at `preDisplayRadiance`, before
Color. Candidate CIE 1931 GPU projection agrees with the same CPU production
projection to at most `4.1898469373276766e-7` relative, ruling out projection
as the first loss. Disk-center native-15 maximum relative differences are
`2.64979%` at noon, `94.7459%` at sunset minus 30, `99.92096%` at minus 10,
and `99.92528%` at sunset; full-field normalized spectral RMSE is `5.63725%`,
`72.0749%`, `73.5882%`, and `140.3984%`, respectively. Do not perform the
wide candidate comparison or alter Color until the production and candidate
transport/composition inputs to `preDisplayRadiance` are audited and the first
upstream cause is corrected. A fresh focused comparison took about 19 minutes
end to end and therefore fails the under-ten-minute interactive target.

At the project owner's request, the last scalar Color candidate was then
evaluated before any new design work, but only against fresh production
spectra. Immutable runs
`000339-spectral-color-production-sun-focused-scalar-candidate` and
`000340-spectral-color-production-wide-scalar-candidate` apply the
`dr6-a0-p075` structure unchanged: a `10^6` scene range, `0.75` noon placement,
zero endpoint-adaptation slope, one logarithmic luminance map, identical gain
on positive linear RGB, and common gamut containment. The zero slope makes the
old Stage 1 local-light record irrelevant. Absolute endpoints are recomputed
from each run's newly captured production noon center, so no invalid Stage 1
spectrum enters the candidate.

Both runs pass their same-run production replay controls, with at most
`6.802096451871264e-7` signed-linear relative error,
`2.3925994763196456e-7` mapper absolute error, and one framebuffer code. The
candidate center progresses from encoded
`[0.943670, 0.869399, 0.793600]` at noon to
`[1.0, 0.705826, 0.292244]` at minus 30,
`[1.0, 0.541407, 0]` at minus 10, and
`[1.0, 0.508057, 0]` at sunset. This is materially warmer than the old
run-`000314` result, proving that its faulty transport field masked the
candidate's response. It does not accept the candidate: the wide sunset frame
has `166,089 / 257,041` effective-black pixels, the low-Sun center reaches a
common-gamut boundary, and the focused atmosphere remains a broad brown/orange
field. Preserve these two runs as the correct-input review of the latest scalar
candidate before starting the clean production-Bruneton base lane.

Runs `000333`, `000336`, and `000337` are failed harness/watchdog attempts and
make no parity or seam claim. Run `000333` exposed the earlier reference
documentation error: run `000332` actually captured `641 x 401` at 15 degrees;
only its field-of-view override took effect. The canonical dimensions above
have been corrected to the measured artifact.

Rejected immutable run `000303` exposed a spectral readback-control defect:
every requested group returned channels zero through three. Rejected run
`000304` corrected that defect and reconciled all fully visible centers, then
exposed an inapplicable inherited gate that required the spectral sunset-center
difference to occupy a historical three-channel RGB divergence range. Run
`000305` freezes the correct spectral maximum at `0.5%`; measured sunset-center
spectral divergence is `0.233%`. Neither correction changed the Color transform.

## Stage 4: Exposure Revisit

Only after stages 2 and 3 preserve useful chromatic differences, evaluate one
Frostbite-informed, physically parameterized global exposure. Begin with manual
camera/EV settings and automatic adaptation disabled. Keep settings fixed across
each sequence. Include the two-hours-after-sunset horizon-context and zenith
spectra as explicit exposure controls. Compare lane `A` against frozen lane `B`
and retain the exposed linear values before the output transform.

Exposure is one scalar over the linear observer or sensor response. It may not
be wavelength-specific, source-specific, or derived solely from a darkening sky.
Later camera UI, metering, and sensor profiles remain a separate extension.

## Stage 5: Live Atmosphere Reintegration

After the recorded-input laboratory is accepted, reconnect lane `A` to the live
composition seam:

```text
pathRadiance + viewTransmittance * celestialBoundaryRadiance
```

For every observation, compare the live shader's pre-Color spectral values and
lane `A` stage outputs with the frozen ledger and isolated renderer. A mismatch
is an integration defect; it does not authorize retuning the transform.

The live comparison consumes the observer-site direct illumination records
accepted in run `000302`. Their source Stage 1 acquisition already ran
Algorithm32 at each exact observation time: clock drove geometry, geometry
resolved source placement and visible support, and atmosphere supplied the
transported spectrum. No generic solar-elevation, daylight, or neighboring-frame
value may stand in for a condition's recorded local lighting state.

Only after this equivalence holds should centered full-frame renders be used for
review by the project owner as the designated observer proxy. Cache strategy,
production promotion, Moon/stars, camera profiles,
glare, and exhaustive qualification remain outside this plan.

## Lane A Acceptance Requirements

- The transform is global and source-independent.
- Neutral spectra remain neutral within declared tolerance.
- Increasing input luminance cannot decrease the declared lightness coordinate.
- Distinct warm HDR inputs do not collapse to the same exact-white output while
  the target display still has representable lightness or chroma available.
- Gamut handling is joint and explicit; signed linear RGB is not independently
  clamped before it is evaluated.
- Disk/sky ordering and chromatic relationships can be traced through every
  stage.
- Direct-disk, atmosphere-only circumsolar, night-sky, and spectrally composed
  inputs all use the same Color operations and settings.
- The same transform handles spherical and Flat records without geometry IDs or
  condition-specific branches.
- Runtime work is fixed per pixel with fixed spectral channels and bounded
  lookup/interpolation cost.
- Lane `B` remains byte-for-byte unchanged throughout comparison.

Visual credibility is necessary but not sufficient. No screenshot becomes a
physical oracle, and no large qualification grid begins before the isolated and
recorded-sky sequences are accepted.

## Deliverables

1. authored observation and sampling fixture;
2. accepted Normal-mode measurement-sidecar and spectral-resolution preflight;
3. focused immutable spectral-acquisition run;
4. numeric spectral ledger and generated overlay report;
5. contained lane `A` Color implementation and isolated disk renderer;
6. paired lane `A`/lane `B` isolated disk, circumsolar, night-sky, and composed
   comparisons;
7. fixed-exposure comparison after raw Color acceptance; and
8. live-atmosphere equivalence record before any full-frame qualification.

## Immediate Follow-Up: Ozone

Once the active receptor-based lane `A` has produced a numerically qualified
Color solution and the project owner has accepted its full atmospheric context
as a good development result, the next work item is the canonical ozone
implementation and ozone-off/on comparison. Ozone does not interrupt or become
a fitting variable for the current Color work.

That follow-up will replace the current zero-absorption placeholder with a
sourced density profile, declared column amount, and wavelength-dependent
cross sections integrated over the native spectral bins. The same absorption
term must enter CPU medium sampling, live GPU extinction, atmosphere-cache
extinction, and celestial direct-transmittance construction. Ozone-off must
remain compatible with the accepted canonical atmosphere; ozone-on receives a
distinct atmosphere identity and one construction per composition, reused
across all observation times.

Use the accepted Color solution unchanged to compare ozone off and on over the
San Jose sunset sequence. Record spectral transmittance, atmospheric path
radiance, composed pre-display radiance, and final Color output. A result may
inform the physical atmosphere definition but may not authorize retuning the
Color transform per atmosphere.

Bruneton transport non-regression is a hard acceptance gate. The accepted
17-condition spectral-radiance comparison has aggregate RMSE `11.820392`
`mW m^-2 sr^-1 nm^-1`; the ozone solution must improve that value or retain it
within the comparison's already accepted numerical tolerance. Ozone-off must
also reproduce the accepted table identity and per-condition results. The
pinned 17-condition Bruneton reference is explicitly no-ozone, even though the
downloaded Bruneton Earth demo enables a `300 DU` ozone profile by default.
Therefore ozone-on requires a separately identified Bruneton reference using
the same ozone column, profile, cross sections, spectral sampling, non-ozone
atmosphere parameters, geometry, and numerical controls as Algorithm32. An
ozone-on result scored against the existing no-ozone table is diagnostic only
and cannot pass this gate.

The first ozone qualification configuration is now frozen to Bruneton's own
Earth-demo ozone definition: `300 DU`, the linear density profile that rises
from zero at `10 km` to its maximum at `25 km` and returns to zero at `40 km`,
and Bruneton's retained bin-averaged `233 K` ozone cross sections. The run must
apply those same ozone facts to Algorithm32 and the newly generated Bruneton
reference while retaining the B1 comparison's non-ozone atmosphere, geometry,
spectral, and numerical parameters. Do not substitute another ozone dataset or
locally tuned column in this qualification run. Other sourced ozone models may
be separate later compositions.

The historical display-RGB RMSE `0.0254154486` is a separate Color diagnostic.
It may be retained and reported, but it may not replace or weaken the physical
spectral-radiance RMSE gate.

## Explicitly Deferred

- production changes or promotion;
- modification or removal of the Bruneton lane;
- cache topology and reuse;
- automatic exposure and temporal metering;
- named camera bodies, measured sensors, lens simulation, and camera UI;
- Moon, planet, and star appearance;
- live glare, bloom, refraction, limb-darkening, and green-flash implementation
  beyond the bounded offline reference calculations; and
- exhaustive CPU/GPU, Color-reference, and display-device qualification.
