# Global Normal Color-Rendering Research

Focus: Colorimetry, perception, adaptation, and camera premises.

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
