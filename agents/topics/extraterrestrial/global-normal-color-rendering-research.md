# Global Normal Color-Rendering Research

Status: research prerequisite `3R-G` completed on 2026-08-15. It rejects the
preserve-`M` candidate as a basis for further tuning and defines full-view
measurement prerequisite `2B-M`. The project subsequently narrowed the active
objective to a reasonable global `Normal`; `2B-M` is retained as optional
future image-appearance research and no longer blocks the global experiment
owned by the Color experiment plan. This record authorizes no production change.

This document owns the scientific boundary for translating the complete
composed Sun-and-atmosphere field to the `100 cd/m2` Normal display. The
[Stage 2B research](normal-color-stage2b-reference-research.md) continues to
own the standard observer, CAM16 equations, display definition, and frozen
calibration/held-out split. The
[Color experiment plan](spectral-color-transform-experiment-plan.md) owns
execution order.

## Question

What evidence justifies the relationship between brightness and colorfulness
when an absolute outdoor spectral-radiance field, including the Sun and its
surrounding atmosphere, is reproduced on a much dimmer Rec.709 display?

The previous question was too narrow. It asked how to retain red in an isolated
solar disk after brightness mastering. The actual requirement is one
source-independent rendering of the entire composed field:

```text
spectral path radiance + spectral celestial radiance
  -> composed pre-display spectrum at every pixel
  -> population-observer projection
  -> spatial adaptation and appearance
  -> display rendering and encoding
```

Atmospheric and celestial terms remain separately measurable before addition,
but Color receives no object identity. A disk mask, disk-only appearance state,
or separate grade is prohibited.

## Authority And Findings

### Single-Stimulus CAM16 Is Necessary But Insufficient

[CIE 248:2022](https://www.cie.co.at/publications/cie-2016-colour-appearance-model-colour-management-systems-ciecam16)
defines CIECAM16 as a viewing-condition-specific transform between XYZ and
perceptual attribute correlates for related colors on media including
self-luminous displays. It supplies correlates; it does not prescribe an HDR
rendering intent or a reduction of a complex scene to one adapting condition.

The CIE definition of a
[colour appearance model](https://www.cie.co.at/eilvterm/17-32-003) explicitly
warns that a single-stimulus model cannot completely account for an image when
macroscopic viewing conditions and the other colors in the image affect a
pixel's appearance. Consequently, applying CAM16 independently to every pixel
with one direct-Sun-derived adapting scalar is not a qualified full-image model.

### Colorfulness Cannot Be Separated From Brightness Compression

Hunt's definition of colorfulness records the luminance dependence now called
the Hunt effect: for a fixed chromaticity, perceived colorfulness generally
increases with luminance. See Hunt, “The Specification of Colour Appearance.
I. Concepts and Terms,” DOI
[`10.1002/col.5080020202`](https://doi.org/10.1002/col.5080020202).

Equal CAM16 `M` under two correctly declared viewing conditions is a meaningful
corresponding-color target: the model predicts equal perceived colorfulness.
The preserve-`M` experiment did not preserve the complete corresponding
appearance, however. It deliberately remapped `Q`, retained `M` unchanged, and
then used a fixed-`Q` gamut projection. No cited appearance result establishes
that hybrid as the least-distorting response to an unattainable source
appearance. The alternative ratio likewise lacks a perceptual derivation:

```text
M_output = M_source
M_output / Q_output = M_source / Q_source
```

Preserving `M` remains a useful diagnostic of whether corresponding
colorfulness is physically reachable on the display. It is not an authorized
output rule once brightness is intentionally changed and the corresponding
appearance is outside the display volume. The `M/Q` rule happened to reduce
`M` with `Q`, but its linear ratio was not derived from a visual-response law.
Both remain useful rejected controls, not candidate families.

### Image-Appearance Models Use Spatial Adaptation

Kuang, Johnson, and Fairchild,
[“iCAM06: A refined image appearance model for HDR image rendering”](https://markfairchild.org/PDFs/PAP26.pdf),
DOI [`10.1016/j.jvcir.2007.06.003`](https://doi.org/10.1016/j.jvcir.2007.06.003),
starts from absolute CIE XYZ, explicitly distinguishes image-appearance models
from single-color appearance models, and incorporates spatial adaptation,
photoreceptor response, local contrast, the Hunt effect, the Stevens effect,
and surround response. Its HDR evaluation used 23 normal-color-vision
observers, a characterized `180 cd/m2` display, twelve preference images, and
four real scenes for reproduction-accuracy comparison. The inspected author
PDF has SHA-256
`5e9abfc435b0641a9b614151c24ac6859f3623af7875fded00610e5db7d58d31`.

iCAM06 is not adopted blindly. Several constants and its percentile clipping
are empirical, and its bilateral decomposition is not automatically the right
runtime architecture. It is the primary scientific reference because it states
the correct problem: reproduce a spatially complex absolute-luminance field
under different viewing conditions, rather than preserve a single CAM
correlate pixel by pixel.

Mantiuk, Daly, and Kerofsky,
[“Display Adaptive Tone Mapping”](https://www.cl.cam.ac.uk/~rkm38/pdfs/mantiuk08datm.pdf),
DOI [`10.1145/1360612.1360667`](https://doi.org/10.1145/1360612.1360667),
independently supports treating reproduction as a display-constrained
optimization of visible contrast distortion. It also establishes that display
black, peak, reflections, ambient illumination, and viewing conditions are
part of a defined reproduction problem. Its primary contribution is luminance
and contrast, so it is supporting evidence rather than the colorfulness oracle.

### ACES 2 Supplies A Reproducible Rendering Control, Not Human-Vision Truth

The official ACES 2
[chroma-compression specification](https://docs.acescentral.com/system-components/output-transforms/technical-details/chroma-compression/)
does not preserve `M` after tone mapping. It first rescales colorfulness by

```text
M_s = M * (J_t / J)^(1 / (c*z))
```

then applies an invertible, hue-dependent nonlinear compression/expansion. Its
[gamut compression](https://docs.acescentral.com/system-components/output-transforms/technical-details/gamut-compression/)
moves jointly in `J` and `M`, preserves hue as a base assumption, begins a
smooth roll-off before the limiting gamut surface, and documents that some
vector choices were selected experimentally for aesthetic preference.

This provides two useful controls: tone compression and colorfulness cannot be
designed independently, and gamut reduction should be a smooth interior
mapping rather than sending most pixels directly to the display boundary.
ACES remains a photographic rendering intent and cannot establish `Normal` by
itself.

[ITU-R BT.2446-1](https://www.itu.int/pub/R-REP-BT.2446-1-2021) likewise treats
HDR-to-SDR tone mapping and color-volume reduction as separate required stages
and includes subjective evaluation. It is evidence that no unique
physics-only SDR conversion exists, not an oracle for absolute outdoor vision.

## Diagnosis Of The Preserve-M Candidate

Run `000288-spectral-color-stage3-full-frame-context` is the decisive adverse
evidence. The candidate used the direct solar `E_v/pi` proxy as one source
adapting state for every pixel, remapped `Q`, preserved source CAM16 `M`, and
reduced only `M` at fixed output `Q` when Rec.709 was exceeded.

That combination confounded three operations:

1. prediction of source appearance;
2. compression of source appearance to display capability; and
3. final gamut containment.

It also used a disk-derived adapting condition for the entire sky. Across the
three live calibration frames, `328,082 / 391,053` pixels reached the fixed-`Q`
gamut boundary. At exact sunset the count was `130,184 / 130,351`. The nearly
uniform brown result is therefore not evidence that the spectrum lacks spatial
variation. It shows that the pointwise candidate discarded most of that
variation at its display boundary.

Decision: reject `stage2b-normal-q-log-preserve-m-fixed-q-boundary-v1` as a
development candidate. Retain its source, fixtures, and immutable evidence as
a failed control. Do not interpolate between preserve-`M/Q` and preserve-`M`,
choose an exponent by eye, or tune a colorfulness curve from another disk
plate.

## Optional Prerequisite 2B-M

This prerequisite defines the evidence needed for a general spatial
image-appearance claim. The active project no longer makes that claim: it uses
one global direct-illumination-derived state as a reasonable bounded
approximation. Consequently this work is retained but deferred.

No new atmospheric physics is needed. Acquire a deterministic view of the
already accepted composed transport field. For all nine observations in the
frozen calibration split, retain:

1. the actual camera projection, view direction, gaze, field of view, viewport,
   and exact pixel solid angle;
2. absolute CIE 1931 XYZ for every composed `preDisplayRadiance` pixel before
   any appearance, gamut, exposure, or encoding operation;
3. selected native-15 spectral pixels sufficient to reconcile the full-field
   XYZ projection with the accepted spectral ledger;
4. a solid-angle-weighted global luminance summary for comparison only;
5. deterministic spatial adaptation-white XYZ and adapting-luminance fields at
   declared angular scales;
6. source-field local contrast, hue, colorfulness, and gamut-distance maps;
7. the same quantities after every candidate stage; and
8. resolution convergence between the frozen `1024 x 576` view and
   `512 x 288` sanity view.

Use the already frozen 16:9, 60-degree vertical view from the Stage 2B research,
centered by geometry on the visible celestial target. The current 15-degree
run is useful failure evidence but does not qualify adaptation. Include the Sun
normally in every reduction. Do not identify, remove, clip, or separately
weight it. Scene surfaces remain absent from this first sky-and-celestial
measurement because their absolute-radiance contract is not yet available;
ground/scene appearance is a later extension.

### Spatial Adaptation Field

The acquisition writes absolute CIE XYZ directly from the native spectral
state to a floating-point target. It may not use the Stage 3
spectral-to-linear-Rec.709-to-XYZ round trip as the new measurement interface.
Selected native-15 probes reconcile the direct field projection.

The acquisition must retain the raw absolute XYZ field, not only its reduction.
Derive two predeclared adaptation diagnostics from it:

- the frozen global solid-angle-weighted geometric-mean `L_A` as a control; and
- a local spatial field using the iCAM06-motivated `5 degree` Gaussian scale.

The local field is now frozen as a positive isotropic Gaussian over angular
distance with `sigma = 5 degrees`, truncated at `3 sigma`, multiplied by exact
pixel solid angle, renormalized at viewport edges, and accumulated in binary64
for reference evidence. Apply the same linear kernel independently to absolute
`X`, `Y`, and `Z`; do not blur chromaticity ratios. The filtered XYZ is the
local adaptation-white field and its filtered `Y` is the measured local
luminance input from which each reference model derives its own declared
`L_A`. The global control retains the previously frozen `1e-6 cd/m2` floor for
its geometric mean. No floor, percentile, or clipping modifies the retained raw
XYZ field.

A bounded image pyramid or fixed separable approximation is compatible with
the runtime requirement, but it must be qualified against the binary64 angular
Gaussian. Every runtime pixel performs fixed work and reads a fixed number of
values. This is a Color measurement/appearance operation, not a sky probe,
atmosphere cache, or source-specific calculation.

Before reference rendering, the measurement passes only if both resolutions
are finite, the fully visible disk-center XYZ agrees with the selected spectral
ledger within `1%` relative per nonzero component, global geometric-mean `L_A`
differs by at most `2%`, and after solid-angle-aware resampling the 99th
percentile local-field disagreement is at most `5%` in `Y` and `0.005` in CIE
1976 `u'v'`. Disk and horizon discontinuities are reported separately and may
not be hidden by relaxing these field gates.

## Reference Lanes Before A New Candidate

Implement and compare the following on calibration fields only:

1. **`G-CAM16-GLOBAL` diagnostic:** current CAM16 equations with the frozen
   global view-derived condition. This isolates the effect of replacing the
   disk-derived adaptation scalar.
2. **`G-CAM16-LOCAL` diagnostic:** the same equations with the frozen spatial
   adaptation-white and `L_A` fields. It tests context dependence without yet
   inventing a new output mapper.
3. **`G-ICAM06-REF` reference:** a faithful binary64 reproduction-accuracy
   implementation of the cited iCAM06 stages, retaining every intermediate and
   clearly marking its empirical parameters and percentile clipping. It is a
   scientific comparator, not automatically the production choice.
4. **`G-ACES2-100` rendering control:** pinned official ACES 2 `100 nit`
   chroma/gamut structure on the same observer-projected input with its physical
   normalization declared. It tests a mature smooth color-volume rendering
   strategy but makes no naked-eye claim.
5. **Rejected controls:** preserve-`M/Q`, preserve-`M`, and chromaticity
   preservation. They may be measured but not tuned or presented as new
   candidates.

Do not construct a hybrid until these references expose which error belongs to
source appearance prediction, brightness rendering, interior colorfulness
rendering, or gamut containment.

## Predeclared Full-Frame Tests

Exact RGB is not the success oracle. For every reference lane, measure these
relationships over the complete calibration fields:

- **Composition identity:** the input is the composed field; analysis labels
  may identify disk and sky only after Color and may never branch the transform.
- **Hue behavior:** retain continuous hue ordering wherever source
  colorfulness exceeds the neutral threshold; report every hue reversal and
  discontinuity.
- **Hunt-effect behavior:** for controlled equal-chromaticity sweeps, source
  colorfulness must change monotonically with luminance in the direction
  predicted by the selected appearance model. After display rendering, retain
  that ordering wherever achievable and report where display constraints
  prevent corresponding-color matches; do not assume constant output `M` or a
  fixed `M/Q` ratio as the solution.
- **Spatial contrast:** retain the sign and rank ordering of disk-to-circumsolar,
  circumsolar-to-wider-sky, and horizon-gradient contrasts at the declared
  angular scales. Report contrast compression separately from gamut effects.
- **Colorfulness ordering:** warm low-Sun regions that are more colorful in the
  selected source image-appearance reference must not become less colorful than
  less-colorful neighbors unless a documented display constraint forces it.
- **Boundary behavior:** record distance to the Rec.709 volume before and after
  compression, onset of roll-off, fraction on the numerical boundary, and the
  number and area of appearance plateaus. Boundary occupancy is evidence, not a
  success criterion by itself; unexplained large spatial plateaus fail.
- **Continuity and resolution:** retain the existing numerical continuity gates
  and require the declared spatial relationships to survive the half-resolution
  sanity rendering.
- **Global coherence:** one unchanged configuration must explain noon, sunset,
  and post-sunset behavior. No observation-time identifier or source identity
  may select a curve.

The project owner remains the observer proxy after numerical comparison. Review
the full calibration frames first. Freeze the selected reference-derived
candidate before revealing held-out frames. The review asks whether atmospheric
gradients, Sun/sky relationships, progressive warming/dimming, and post-sunset
usability remain coherent; it does not ask for a preferred isolated disk color.

## Decision Boundary

Science does not yield one unique SDR image of an outdoor HDR scene. It can,
however, prevent arbitrary choices:

- source radiance and observer projection remain physical and standard-based;
- source appearance must use the complete spatial field;
- luminance-dependent colorfulness cannot be treated as invariant;
- brightness, interior colorfulness rendering, and gamut containment must be
  separately observable;
- display constraints and any remaining rendering intent must be explicit; and
- candidate selection must occur on complete calibration frames against
  reference implementations, not by adjusting the solar disk.

The global-state table is accepted in immutable run
`000291-spectral-color-global-state-table`. The project subsequently replaced
the `Q_t` to `J_t` / ACES-coupling candidate plan with the simpler
receptor-response plan owned by the Color experiment plan. CAM16 and ACES 2
remain references and controls. The active next step is the receptor-parameter
prerequisite followed by LMS projection/metamer proof. `2B-M` returns only if
the project again requires a general spatial image-appearance model.
