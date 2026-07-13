# Stage 2B Normal Reference Research

Status: research executed on 2026-08-14. Research prerequisite `2B-R` is
complete as an investigation but its authorization gate is **not passed**. The
standard observer, appearance equations, destination display, numerical gates,
held-out split, and lightweight observer-proxy review are frozen. The project
owner has narrowed the active experiment to transported direct sunlight at the
camera, excluding sky-field and ground-bounce adaptation. The frozen ledger and
its tracked fixture contain the required direct spectrum and apparent support.
The later global research prerequisite `3R-G` rejects the preserve-`M`
candidate and reactivates full-view prerequisite `2B-M`. See
[Global Normal Color-Rendering Research](global-normal-color-rendering-research.md)
for the current full-field decision; this document retains the earlier
direct-disk findings and frozen shared inputs.

This is the canonical research record for prerequisite `2B-R` in the
[Normal Mode Test Plan](normal-mode-test-plan.md). It records present decisions,
not a survey chronology.

## Question And Claim Boundary

The question was whether authoritative references determine every input needed
to translate the accepted absolute spectral camera radiance into a fixed,
population-average photopic `Normal` rendering on a 100-nit display without
fitting Sun images.

They do not. The references determine how a declared viewing condition is used;
they do not prescribe one universal outdoor condition. The project therefore
uses an explicitly pragmatic canonical condition rather than extending the
research gate. Consequently:

- Stage 2A remains valid evidence that the spectra contain displayable color.
- A fixed published example condition may qualify implementation mechanics, but
  it cannot qualify the project's “what an average eye would see” claim.
- The official ACES 2 transform remains a photographic rendering comparison,
  not a population-normal visual oracle.
- Final `N-P2-100` acceptance needs only a separately qualified,
  view-conditioned local-luminance measurement. This is measurement, not
  atmosphere validation.

## Authority Record

### Standard Observer

- [ISO/CIE 11664-1:2019](https://www.cie.co.at/publications/colorimetry-part-1-cie-standard-colorimetric-observers-0)
  states that the CIE 1931 observer represents normal color vision for roughly
  `1 degree` to `4 degree` fields at photopic adaptation. This is the selected
  primary observer for the small solar disk and immediate foveal field.
- The official
  [CIE 1931 2-degree one-nanometre table](https://cie.co.at/datatable/cie-1931-colour-matching-functions-2-degree-observer)
  is the numerical authority. The contained CSV has SHA-256
  `fa663e3535a7e0763a745993a1f0a192eb0275ac46ad2d1befd7626841e713c1`.
- The CIE 1964 10-degree observer remains comparison `N-P10`; it is not a
  per-pixel switch.
- Photopic `N-P2` is not a night-vision claim. CIE defines photopic use above
  an average adaptation luminance of about `5 cd/m2` for non-foveal tasks;
  CIE 191 mesopic processing remains a later configuration.

### CIECAM16

- [CIE 248:2022](https://www.cie.co.at/publications/cie-2016-colour-appearance-model-colour-management-systems-ciecam16)
  standardizes CIECAM16 as a viewing-condition-specific model for related
  colors, including self-luminous displays. It does not define a universal
  viewing condition.
- Li et al., “Comprehensive color solutions: CAM16, CAT16, and CAM16-UCS,”
  DOI [`10.1002/col.22131`](https://doi.org/10.1002/col.22131), supplies the
  forward/inverse equations and the viewing-condition definitions used here.
  The inspected author-uploaded paper bytes had SHA-256
  `63816603af7821203ba158a134c4b89fec665e89c4808caf5843d727a78fb548`.
- Its Appendix A defines relative sample and white tristimulus values, adapting
  luminance, background, and surround as separate inputs. With `Y_w = 100`:

```text
XYZ_relative = 100 * XYZ_absolute / L_w
Y_b = 100 * L_b / L_w
L_A = L_w * Y_b / Y_w = L_b
S_R = L_SW / L_DW
```

  `L_w`, `L_b`, `L_A`, `L_SW`, and `L_DW` are in `cd/m2`. Average surround is
  `S_R >= 0.2`, dim is `0 < S_R < 0.2`, and dark is `S_R = 0`. The model's
  induction factors are `(F, c, N_c) = (1.0, 0.69, 1.0)` for average,
  `(0.9, 0.59, 0.9)` for dim, and `(0.8, 0.525, 0.8)` for dark.
- Therefore `XYZ_absolute -> XYZ_relative` is known only after `L_w` is known.
  Choosing `L_w` or `L_A` by looking at the disk plate would simply rename the
  rejected scene scale.

### Hellwig 2022 And ACES 2

- Hellwig and Fairchild, “Brightness, lightness, colorfulness, and chroma in
  CIECAM02 and CAM16,” DOI
  [`10.1002/col.22792`](https://doi.org/10.1002/col.22792), proposes a linear
  relationship between lightness and brightness and revised colorfulness/chroma
  equations. The inspected author copy had SHA-256
  `31f16ec674a8791ce5ebabb9d204079eaa8e256c4b44f29401cbcc04f2ea6e0d`.
- The paper explicitly recommends specifying adapting luminance directly
  instead of deriving it accidentally through a background parameter. Its
  validation uses Munsell and LUTCHI data, including white luminances from
  `0.4` to `842 cd/m2`; it does not validate direct-solar luminances in the
  millions or billions of `cd/m2`.
- [ACES 2 rendering documentation](https://docs.acescentral.com/system-components/output-transforms/technical-details/rendering-overview/)
  describes a scene-linear photographic rendering transform using a simplified
  Hellwig-derived `JMh` space, a lightness tone scale, chroma compression, and
  gamut compression. Its purpose is image rendering and output matching, not a
  normative prediction of an outdoor observer.
- The pinned ACES 2 CTL uses `ref_luminance = 100`, `L_A = 100`, `Y_b = 20`,
  and dim-surround factors `(0.9, 0.59, 0.9)`. Its contained source hash is
  `545a95d5f44f929365aaf989b266b98c14f2ebe1e7dea2ce9d30d0213f2d1b7a`.
  These are ACES rendering parameters. They do not supply the missing
  physical-radiance-to-scene-linear normalization.
- [ACES tone-scale requirements](https://docs.acescentral.com/system-components/output-transforms/technical-details/tone-mapping/)
  support the structural requirements already adopted here: continuous,
  continuously increasing, defined for all floats, and non-asymptotic before
  a declared display limit.
- [ACES gamut compression](https://docs.acescentral.com/system-components/output-transforms/technical-details/gamut-compression/)
  is a useful implementation comparison because it works jointly in `J` and
  `M` while holding hue, but ACES documents experimental/aesthetic choices and
  intentional burn toward white at high `J`. It cannot be the success oracle.

### Destination Display And Review Environment

The destination is sufficiently specified and is now frozen for the first
candidate:

| Property | `N-P2-100` value | Authority/rationale |
| --- | --- | --- |
| limiting/encoding primaries | Rec.709/sRGB: R `(0.640,0.330)`, G `(0.300,0.600)`, B `(0.150,0.060)` | [ITU-R BT.709-6](https://www.itu.int/rec/R-REC-BT.709-6-201506-I/en) |
| white | D65 `(0.3127,0.3290)` | BT.709 and W3C sRGB |
| peak/reference white | `100 cd/m2` | ACES 2 Rec.709 100-nit preset and BT.2035 |
| reference black | `< 0.01 cd/m2`; mathematical transform black `0` | [ITU-R BT.2035](https://www.itu.int/rec/R-REC-BT.2035-0-201307-I) |
| encoding | IEC sRGB piecewise, full-range float evidence before optional 8-bit plates | [ACES 2 presets](https://docs.acescentral.com/system-components/output-transforms/parameters/) |
| room illumination | `10 lux` | BT.2035 |
| background behind display | D65, `10% +/- 2%` of reference white (`8` to `12 cd/m2`) | BT.2035 |
| surround class | dim for the destination appearance calculation | CAM16 `0 < S_R < 0.2`; the nominal ratio is `0.10` |

The use of a 100-nit sRGB-piecewise ACES preset is explicit; it is not the
IEC sRGB encoding-condition display, whose nominal white is `80 cd/m2`. Float
output, encoding, and quantization remain separate evidence stages.

## Frozen Model Roles

1. `CIECAM16` is the primary candidate for population-average related-color
   adaptation because it is the current CIE standard.
2. `Hellwig 2022` is a research comparison for the revised brightness and
   colorfulness relationships.
3. The official `ACES 2` rendering transform is a contained photographic
   comparison and a source of structural and executable gamut/tone tests.
4. No outputs are averaged. No model is selected from disk attractiveness.
5. No model alone supplies the source adapting state or a complete naked-eye
   HDR reproduction.

### Normal Brightness Decision

The primary `Normal` candidate uses a condition-varying, steady-state adapting
condition and CIECAM16 brightness correlate `Q` to drive display brightness.
It does not use relative lightness `J` as the display-brightness coordinate.
The same fixed monotonic `Q`-to-display mapping is used for every observation;
only the physically derived viewing-condition inputs vary.

This choice follows the declared fully adapted observer. `J` expresses
lightness relative to the adopted white, so deriving both the sample
normalization and adapting condition from the current direct-Sun signal can
cancel much of the measured noon-to-sunset intensity change. `Q` retains the
appearance model's dependence on absolute adapting luminance and is therefore
the more appropriate correlate for comparing fully adapted conditions. A fixed
reference white across the sequence would instead describe one unchanged
observer state; retain that behavior only as an absolute-comparison diagnostic.

The adapting condition remains the declared direct-solar `E_v / pi` proxy for
this isolated experiment. It is not a claim that direct sunlight alone fully
describes adaptation in a real sky. If the fixed `Q` rendering produces an
unacceptable relationship, revise or reject the proxy/model claim rather than
introducing condition-specific exposure or tone-map tuning.

### Frozen Stage 2B Rendering Bridge

The remaining bridge choices are frozen as follows.

1. **Visible direct-solar support.** The adaptation-side spectral irradiance is
   the integral of transported disk radiance over only the analytically visible
   projected solar support. At a horizon intersection, the below-horizon disk
   segment contributes zero. Geometry supplies the disk/horizon relationship;
   Color consumes the resulting unit-bearing visible-support factor and does
   not reconstruct atmosphere or repair obstruction.
2. **Fixed `Q` mastering curve.** Let `Q_0` be CIECAM16 brightness of the
   destination display's D65 reference white under the frozen output viewing
   condition. Let `Q_master` be CIECAM16 brightness of the canonical
   unattenuated solar source under the same fixed direct-Sun adaptation rule.
   The source-independent runtime mapping is
   `t(Q) = log(1 + Q/Q_0) / log(1 + Q_master/Q_0)`, limited to `[0,1]` only at
   the declared mastering boundary. `Q_master` is derived from tracked physical
   source data, never from the 25 transported disk outputs.
3. **Joint appearance-volume boundary.** Preserve CIECAM16 hue and the source
   colorfulness-to-brightness direction. If the mapped appearance lies outside
   Rec.709, intersect that joint appearance direction with the display color
   volume using deterministic bounded bisection. Reduce brightness and
   colorfulness together; do not hold luminance at `100 cd/m2` while reducing
   colorfulness to the white vertex. No hue sector, RGB channel, condition, or
   celestial identity receives an independently tuned correction.
4. **Independent equation verification.** Qualify the binary64 CIECAM16
   reference against a separately authored or pinned independent
   implementation using identical retained inputs. An authoritative CIE 248
   vector remains desirable but does not block development when the two
   implementations satisfy the frozen tolerance. GPU parity follows the
   accepted binary64 reference.

The logarithmic curve is a declared rendering intent, not a normative law of
vision. Its anchors are nevertheless reproducible: one comes from the fixed
display condition and the other from the tracked physical emitter ceiling.
This permits Color implementation and falsification without fitting a rendered
Sun sample.

Development gates established that a fully adapted D65 configuration must set
CAM16 illuminant discounting explicitly and must derive exact display XYZ from
the frozen Rec.709 D65 chromaticity; rounded white XYZ produced a measurable
neutral-axis error and was rejected rather than hidden by tolerance changes.
Run `000272-spectral-color-stage2b-reference-bridge` accepts that corrected
bridge with `Q_0 = 196.31177443154246`, `Q_master = 3785.269948190865`, and
exact-sunset visible support `0.5654480183171776`.

Run `000276-spectral-color-stage2b-output-proof` accepts inverse CAM16 and the
joint Rec.709 boundary over 25 retained and 288 synthetic inputs. Run
`000278-spectral-color-stage2b-independent-conformance` executes a pinned
Color.js CAM16 oracle at commit `349008c68d6273c61e1d3138936ad28a6c7f2b21`;
maximum forward correlate disagreement is `6.536993168992922e-12` and maximum
inverse XYZ disagreement is `8.526512829121202e-14`. Numerical prerequisites
are complete for the calibration-only plate. Immutable run
`000281-spectral-color-stage2b-calibration-plate` generated the centered nine-row
calibration artifact without computing or presenting held-out display outputs.
The run did not freeze the candidate or authorize held-out presentation, and
the project owner rejected the plate for insufficient red tones. Evidence
shows that the input
warmth survived spectral projection, but the frozen `M/Q`-preserving step
reduced spherical-sunset CAM16 `M` from `39.2388` to `3.9422` and
Flat/farthest-minus-30 from `48.0293` to `3.8668`; no calibration output was
gamut-boundary limited. The `M/Q` policy is therefore rejected for `Normal`.
Retain the accepted `Q` brightness curve as a control and research a
source-independent colorfulness mapping that does not automatically scale
colorfulness by the full HDR brightness-compression ratio.

Run `000284-spectral-color-stage2b-colorfulness-candidates` implements the next
fixed comparison. The primary candidate interprets CAM16 `M` as the perceived
colorfulness quantity to preserve across the unchanged brightness mastering
step. At the output boundary it retains mastered `Q` and hue and reduces only
`M` toward the neutral at that brightness. This is not a reduction toward the
white vertex: `Q` remains the previously selected condition brightness. A
separate diagnostic retains the transported CIE chromaticity at the same target
`Q`, with a same-luminance D65 intersection only if Rec.709 requires it.

The fixed-`Q` boundary is a necessary revision to the earlier joint `Q/M` ray.
For the high-colorfulness Flat/farthest inputs, the joint ray had no positive
Rec.709 intersection and collapsed to black; fixed-`Q` colorfulness reduction
retains the maximum in-gamut warm color instead. The candidate passed the nine
calibration rows and 175 synthetic inputs, increased red dominance for every
warm calibration row, and produced no exact-white result. This remains accepted
comparison evidence, not selection of the candidate. Full-frame run `000288`
and research `3R-G` subsequently reject it as a development candidate;
held-out rows remain unpresented.

## Active Direct-Solar Camera Metric

The active disk experiment uses the transported disk-center
`celestialRadiance` already retained by Stage 1. This is spectral radiance at the
camera after atmospheric attenuation and before Color. It is the correct input
for the color of a resolved disk and is independent of viewport, field of view,
ground fraction, and raster resolution.

When a single total direct-solar quantity is needed, integrate the uniform disk
over its projected solid angle. For a camera plane normal to the disk center:

```text
spectral direct irradiance E_lambda = L_lambda * pi * sin(alpha)^2
photopic direct illuminance E_v     = Y_disk * pi * sin(alpha)^2
```

`alpha` is the apparent angular radius. Spherical/distant uses the fixed tracked
fixture radius; every Flat/local condition already records
`apparentAngularRadiusRadians`. The raw direct value remains exact zero when the
Sun is geometrically unavailable.

The primary integrated result remains the native wavelength-resolved array in
`W m^-2 nm^-1`. Calculate the projected-solid-angle multiplication independently
for every retained spectral channel. Photopic `E_v`, XYZ, chromaticity, and any
appearance-model scalar are derived views of that array and may not replace it.

If CIECAM16 requires a pragmatic adapting-luminance scalar for this isolated
disk experiment, use the equivalent diffuse luminance:

```text
L_A = max(E_v / pi, 1e-6 cd/m2)
```

Retain raw `E_v` separately so the numerical floor cannot be mistaken for
physical sunlight. This proxy intentionally ignores atmospheric sky illumination,
ground bounce, scene content, and adaptation history. It is project
configuration, not a claim that direct solar illuminance alone predicts full
human adaptation.

The retained `E_lambda` also has a downstream lighting use: it is the direct
spectral solar illuminant at the camera location for a plane normal to the Sun.
It must not be mislabeled as scene ambient. Spectral sky ambient is instead the
cosine-weighted hemispherical integral of directional atmosphere path radiance
at the receiving point. A later lighting interface may expose direct and
diffuse spectral irradiance together, with ground/scene bounce separate. That
reuse does not add a prerequisite to the active isolated-disk Color experiment.

## Deferred Full-View Defaults

The following defaults are frozen for the first `Normal` candidate. They are
project configuration, not a claim that these are the unique parameters of
average human vision:

| Concern | Frozen default |
| --- | --- |
| view direction | track the geometry-resolved celestial target while visible; for a below-horizon target, retain its azimuth and clamp the view center to the geometric horizon |
| gaze | viewport center |
| view | perspective, `16:9`, `60 degrees` vertical field of view |
| measurement raster | `1024 x 576`; also run one `512 x 288` resolution sanity comparison |
| included field | every visible pre-display pixel, including sky, ground, and celestial support |
| compact bright objects | included normally; no source identification, exclusion, or luminance clipping |
| angular weight | exact pixel solid angle, otherwise uniform over the viewport |
| local adapting luminance `L_A` | solid-angle-weighted geometric mean of photopic `Y`, with a fixed `1e-6 cd/m2` floor before the logarithm |
| adapting white | D65 chromaticity |
| background | `L_b = L_A` |
| reference white luminance | `L_w = 5 * L_A`, giving relative `Y_b = 20` |
| surround | fixed dim CIECAM16 surround |
| temporal state | steady-state, fully luminance-adapted to `L_A` |

The reduction is exactly:

```text
L_A = (1 cd/m2) * exp(
  sum_i(deltaOmega_i * ln(max(Y_i, 1e-6 cd/m2) / (1 cd/m2)))
  / sum_i(deltaOmega_i)
)
```

There is no additional center weight, percentile, auto-exposure state, or
condition-specific parameter.

These defaults now seed active full-view prerequisite `2B-M`; `3R-G` adds a
spatial adaptation-field diagnostic rather than silently replacing them.

## Reactivated Measurement: Prerequisite 2B-M

For the active full-view appearance experiment, the ledger does not contain the deterministic
view raster needed to calculate the frozen `L_A`. The retained 32-ray hemisphere
is an integration diagnostic;
its sparse equal-purpose sampling has no declared view, retinal/angular support,
or deterministic viewport reduction. It cannot silently become `L_A`.

The full-view candidate assumes a steady observer adapted to the measured local
viewing field. No adaptation history, dwell time, or transition model is needed
for this prerequisite. `2B-M` retains the raw absolute XYZ field and derives
both the frozen global `L_A` control and the spatial adaptation-white/`L_A`
fields specified by `3R-G`.

Before making a full-view `N-P2-100` claim, qualify the frozen deterministic
view-space calculation. For each observation retain the view identity, absolute
pre-display photopic `Y` field, exact pixel solid angles, resulting `L_A`, and
the declared resolution sanity comparison.

This acquisition does not revalidate Bruneton transport. It samples accepted
Color-boundary radiance. It may be a bounded dedicated view probe rather than a
cache product or the current sky-illuminance quadrature.

The existing `SkyIlluminanceProbe` is explicitly unsuitable for `2B-M`. It is a
sparse upper-hemisphere projected-illuminance quadrature, evaluates atmospheric
path radiance rather than the complete viewed field, and has no gaze-centered
spatial support. `2B-M` instead consumes the same pre-display field the observer
would view. Its reduction may be implemented as a fixed-resolution buffer and
deterministic reduction pyramid; it need not produce a display plate.

### Architecture And Interface Availability Audit

The contained architecture was inspected on 2026-08-14 to decide whether
`2B-M` needs new physical information or only a new interface. The result is:

| Scope | Information sufficient? | Interface sufficient? | Decision |
| --- | --- | --- | --- |
| active direct-solar disk metric | yes | yes for the recorded-input experiment | derive native spectral irradiance from the frozen ledger and tracked support |
| later full-view field from frozen Stage 1 ledger | no | n/a | future denser deterministic view acquisition |
| later live sky plus celestial field | yes | no | future pre-display field interface |
| complete view including renderer scene surfaces | not unit-complete | no | later add an absolute scene-radiance/luminance calibration contract |

The live shader already carries unit-bearing native spectral `pathRadiance`,
`celestialRadiance`, and their additive `preDisplayRadiance`. It also already
contains the CIE photopic projection. Geometry supplies the actual camera ray
reconstruction and viewport needed to derive per-pixel angular support. No new
atmosphere coefficient, transport output, cache quantity, or celestial-source
quantity is required. The active direct-solar calculation is already possible
from the recorded disk spectrum and apparent support.

What is missing is an owned measurement surface. The normal runtime encodes the
composed result directly to display RGB, and `ShaderHandle` exposes only the old
sky-illuminance helper. The Stage 1 harness proved that a terminal Color
contribution can read `preDisplayRadiance`, but it retained only selected center
rays, 12 circumsolar rays, and a 32-ray hemisphere per condition. Those rows do
not define the actual viewed raster or a converged local field.

The minimum contained addition for the active full-view experiment is a Color-owned, pre-encoding
view-field measurement path that:

1. uses the actual camera projection, viewport, and gaze center;
2. writes absolute CIE XYZ from `preDisplayRadiance` to a fixed floating-point
   view target before tone/gamut/display encoding;
3. derives exact per-pixel solid angle from geometry's reconstructed pixel
   corner rays;
4. applies the frozen source-independent spatial reduction and retains its
   fingerprint; and
5. exposes a unit-bearing result containing `L_A`, view identity, reduction
   identity, and the resolution sanity comparison.

That later full-view claim requires one new bounded acquisition;
the current ledger cannot be promoted into that field by interpolation. The
acquisition reuses the accepted algorithm and changes no atmosphere result.

The renderer scene color is a separate limitation. It is identified only as
HDR linear sRGB and is added beside the physical spectral result; its interface
does not declare an absolute luminance scale. This does not block the current
empty-scene sky-and-disk experiment. Before the same measurement is used as a
general scene adaptation or camera-metering service, scene rendering must
declare how linear RGB maps to absolute XYZ or `cd/m2`.

The geometric-mean viewport reduction is a pragmatic fixed project rule.
CIECAM16 does not prescribe how to reduce a complex HDR sky to one condition,
and the project is not claiming that this rule is a normative CIE derivation.
Kuang, Johnson, and Fairchild's iCAM06 work remains supporting evidence for
spatially localized adaptation, not a dependency or authorization to resume
sky-derived automatic camera exposure.

## Predeclared Numerical Gates

These original numerical gates remain frozen and are supplemented by the
full-view measurement gates in `3R-G`:

| Gate | Requirement |
| --- | --- |
| official observer identity | exact contained CIE CSV SHA-256 above |
| native/reference spectral projection | retain accepted Stage 1 bounds: relative `Y <= 5%`, CIE 1976 `u'v' <= 0.005` |
| CPU equation conformance | published/authoritative reference vectors: absolute correlate error `<= 1e-6` |
| GPU versus binary64 CPU | per component `abs <= 2e-6 + 2e-5 * max(1, abs(reference))` |
| round trip where defined | relative XYZ residual `<= 2e-5`, with zero handled by the absolute term above |
| finiteness | every retained and synthetic intermediate finite; no hidden replacement |
| neutral stability | CPU `M,C <= 1e-6`; encoded-float RGB channel spread `<= 2e-6` before quantization |
| monotonicity | dense neutral and retained-hue luminance sweeps never decrease by more than the GPU absolute tolerance and are strictly increasing in binary64 before a declared display boundary |
| continuity | paired `1e-5` relative perturbations across every branch/seam produce convergent output; maximum encoded-float RGB pair distance `<= 2e-4` |
| hue continuity | circular hue change across the same seam probes `<= 0.1 degree` unless the input chroma is below the neutral threshold |
| plateau detection | unequal eligible inputs may not share all three encoded-float channels within `2e-6` unless the evidence identifies the same explicit display-boundary intersection; 8-bit duplicates are reported separately |
| gamut bound | mapped float RGB lies in `[0,1]`; signed/pre-gamut RGB and compression distance are retained |

An unavailable official CIECAM16 numerical vector may be cross-checked during
development with an independent implementation, but final conformance requires
either the CIE 248 vector/equivalent normative material or two independent
implementations of the published equations with the common vector and exact
inputs retained. Secondary library output cannot become the sole oracle.

## Frozen Calibration And Held-Out Split

No physical or appearance parameter may be fitted to either set. The calibration
set is for implementation debugging and reviewer training only.

Calibration rows (`9`):

```text
spherical-distant: noon-minus-60, noon, noon-plus-60,
                   sunset-minus-60, sunset-minus-30, sunset
flat-local:         closest, farthest-minus-30, farthest-plus-10
```

Held-out rows (`16`): every other eligible Stage 2 disk row. The runner must
materialize both lists and assert their disjoint union is the accepted 25-row
inventory before computing outputs.

## Frozen Observer-Proxy Review Protocol

The project owner acts as the sole designated observer proxy. This is a
development acceptance review, not a population study and not evidence that a
render reproduces a universal naked-eye appearance. ITU-R BT.500-style sample
sizes, vision screening, randomization, confidence intervals, and vote
thresholds are intentionally out of scope.

After the numerical and reference gates pass:

- use calibration rows for iteration and explanation;
- freeze the candidate settings before presenting the held-out rows;
- present the held-out rows on the intended 100-nit-class target when practical
  and record the actual display and approximate room conditions;
- ask whether the sequence preserves the predeclared relations: continuous
  warming/dimming where predicted, disk/sky distinction where predicted,
  coherent noon-to-sunset behavior, and usable post-sunset context without
  forcing sunset to white; and
- retain the observer proxy's decision and notes with the run evidence.

The candidate passes the perceptual development gate only with explicit proxy
approval. A rejection returns the candidate to Color work without changing the
accepted physical spectra. Because one informed proxy is used, the result may
be described only as project acceptance, not population validation.

## Decision

`2B-R` research is complete for its historical direct-disk scope. Research
`3R-G` supersedes its candidate authorization for the current full-field goal
and reactivates `2B-M`. The research removed several
false choices:

- CIE 1931 2-degree is fixed for the primary foveal observer.
- CIECAM16 is primary; Hellwig 2022 and official ACES 2 have comparison roles.
- the destination 100-nit display and review environment are fixed.
- the direct spectral irradiance and optional `E_v / pi` adaptation proxy are
  fixed for the active isolated-disk experiment.
- numerical gates and the observer-proxy review are fixed.
- the rejected ACES scene scale may not return under another name.

Retain the direct spectral irradiance and its photopic summaries as source and
lighting evidence, but do not use its `E_v / pi` proxy as the adapting condition
for every full-frame pixel. Proceed with the deterministic composed-field
measurement and reference lanes specified by `3R-G`; this requires no new
atmosphere physics.

The research fixes the available physical quantities but does not authorize
interchanging them. For a resolved disk, `L_lambda` is the spectral radiance
stimulus projected to absolute XYZ; `E_lambda` is its disk-integrated
direct-solar metric. Before rendering another candidate, the implementation
design must freeze how the optional `E_v / pi` adapting proxy and CIECAM16
normalization retain an absolute-sensitive brightness coordinate. In
particular, a per-condition reference derived from the same signal must not
silently cancel the measured intensity differences. This is a Color-bridge
design and numerical-proof requirement, not a request for new atmosphere data.
