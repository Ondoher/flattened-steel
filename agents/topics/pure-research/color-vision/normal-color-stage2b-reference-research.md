# Stage 2B Normal Reference Research

Focus: Colorimetry, perception, adaptation, and camera premises.

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
