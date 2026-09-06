# Camera Spectral-Color Prior-Art Research

Focus: Sources, datasets, licenses, and canonical claim registers.

Related owners: [color-vision](../color-vision/camera-spectral-color-prior-art-research.md).

## RAW-to-ACES Method And Data

The Academy Software Foundation's
[rawtoaces](https://github.com/AcademySoftwareFoundation/rawtoaces) prefers
camera spectral sensitivities and illuminant SPDs when those measurements are
available. It derives white-balance factors and a camera-to-ACES transform,
falling back to camera metadata or LibRaw matrices when spectral data is not
available.

The separate
[rawtoaces-data](https://github.com/AcademySoftwareFoundation/rawtoaces-data)
repository contains camera response curves, illuminants, CIE-1931 functions,
and training patches. Its schema is unit-aware and uses a `380-780 nm`, `5 nm`
shape. The repository is Apache-2.0, while each spectral record also carries a
required license field. Concept proofs may use an acquired record when its
exact source, attribution, stated license, and derivation are retained.
Record-level redistribution and production-use clearance are deferred to
productization and do not gate Stage 8a.

The method and schema are directly useful. Higher-resolution response curves
can be integrated conservatively over the existing Algorithm32 bin boundaries
offline and stored with source, basis, numerical, and license fingerprints.


## Reuse Finding

No reviewed package should own the complete runtime pipeline. The smallest
justified reuse strategy is:

1. adapt PBRT/rawtoaces profile construction and characterization equations;
2. obtain or author a unit-declared sensor-response profile, retaining its
   source, attribution, and stated license for later productization review;
3. integrate it offline into the exact 15-bin basis;
4. fit or import a qualified `3 x 3` camera-to-XYZ/working-space matrix;
5. validate both matrices against Colour and at least one independent
   implementation or published vector;
6. keep exposure, photon conversion, noise/full-well clipping, white balance,
   development, and display encoding as visible separate contracts; and
7. execute only the compiled matrices and bounded scalar operations at runtime.

Every retained evidence product must be derivable rather than merely
attributable. Its record identifies and hashes the parent data, states the
equation or operation and numerical method, identifies the implementation and
tool versions, records all material parameters, and identifies the resulting
artifact. This applies equally to acquired response curves, resampled profiles,
fitted matrices, Colour oracle values, comparisons, and rendered outputs.
Derivation records qualify evidence; they do not restrict reuse of preserved
artifacts.

An ICC library or baked LUT may later implement the post-capture display path.
It may not normalize the spectral input, hide raw clipping, or infer physical
exposure from a pleasing image.


## T5 Colorimetric Prerequisite Research Result

The immediate source and method research is complete. It changes the proposed
characterization corpus, but it does not invalidate the earlier Stage 8a
PBRT/Colour parity proof or the accepted Stage 8c physical-capture proof.
Those remain evidence for their narrower claims.

### Selected source set

The primary relative camera profile is the Academy Software Foundation
[rawtoaces-data Canon EOS 5D Mark IV profile](https://github.com/AcademySoftwareFoundation/rawtoaces-data/blob/e9b8503cf8a0641f40e5345d9757bde60c15f423/data/camera/Canon_EOS_5D_Mark_IV_380_780_5.json).
Its own header identifies relative R/G/B response, `380--780 nm` at 5 nm,
Weta Digital authorship, `lightsaber` measurement equipment, and Apache-2.0.
The repository state inspected for this decision is commit
`e9b8503cf8a0641f40e5345d9757bde60c15f423`. Because the values are relative
effective responses rather than absolute quantum efficiency, they support
color ratios and characterization but not electron-count or named-camera
saturation claims. The acquired profile bytes have SHA-256
`c3d5bc6a271fa2d0270386e27aa5dcf258c64223322a1730b03815497375be29`.

The fit set is rawtoaces-data's
[190-patch training spectrum set](https://github.com/AcademySoftwareFoundation/rawtoaces-data/blob/e9b8503cf8a0641f40e5345d9757bde60c15f423/data/training/training_spectral.json),
also `380--780 nm` at 5 nm and Apache-2.0. Using this dedicated fit set permits
all 24 `ColorChecker N Ohta` patches in pinned Colour 0.4.6 to remain an
independent validation chart. Colour's dataset source states that these Ohta
(1997) reflectances are identical to the ISO 17321-1:2012 values. This is
stronger than the former provisional 18-training/6-held-out split, because no
ColorChecker patch now influences the matrix it evaluates. The acquired
training file has SHA-256
`1b63cc85f7cf521bf80450fc60172a424a551cc690fdb05313b2cfa7aaa66da1`;
the retained rawtoaces-data license has SHA-256
`c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4`.
The inspected Colour dataset module has SHA-256
`fca45b3c8c3644f361755b56bce1358c4f61737c6a2073603535acdc3233d80d`.

The observer and illuminant sources are official CIE datasets:

- [CIE 1931 2-degree observer](https://cie.co.at/datatable/cie-1931-colour-matching-functions-2-degree-observer),
  DOI `10.25039/CIE.DS.xvudnb9b`, acquired MD5
  `17cca777db64b17170f06f67ce9d3ab7`;
- [Illuminant D55](https://cie.co.at/datatable/relative-spectral-power-distributions-cie-illuminant-d55),
  DOI `10.25039/CIE.DS.qewfb3kp`, MD5
  `8b5678358f265567a0759b9800f17d7f`;
- [Illuminant D65](https://cie.co.at/datatable/cie-standard-illuminant-d65),
  DOI `10.25039/CIE.DS.hjfjmt59`, MD5
  `03d4eb9b837c60671627c946fb534deb`; and
- [Illuminant D75](https://cie.co.at/datatable/relative-spectral-power-distributions-cie-illuminant-d75),
  DOI `10.25039/CIE.DS.9fvcmrk4`, MD5
  `fc2ae36ece39ad1729696ab2833bd013`.

Each acquired hash matches the value advertised on its CIE page. Illuminant A
is not yet accepted: the [official A dataset page](https://cie.co.at/datatable/cie-standard-illuminant-1-nm)
advertises MD5 `6c33a1c3caff2d774f0f2025f3001a56`, but the CSV currently
served by that page's own download link hashes to
`ed0e4effb55d82b950c0912b6278a9d1`. This is an
upstream provenance inconsistency. The initial D55/D65/D75 proof does not need
A, so A is excluded rather than replaced with an unverified copy.

PBRT remains a valuable architectural and implementation comparison. Its
retained `spectrum.cpp` source and Apache-2.0 license already identify the
Canon EOS 5D Mark IV curves as arbitrary-scale relative spectral
energy-response matching functions. The direct rawtoaces-data profile is now
preferred as the primary dataset because it retains its own structured
identity and measurement metadata.

### Frozen oracle method

The reference operates on the inclusive `380--780 nm` overlap. Sources are
linearly resampled to 1 nm without extrapolation. With surface reflectance
`R`, illuminant `E`, camera channel response `S_c`, and CIE matching function
`xbar_j`, it computes:

```text
C_c(R,E) = integral R(lambda) E(lambda) S_c(lambda) d lambda
W_c(E)   = integral E(lambda) S_c(lambda) d lambda
Cwb_c    = C_c / W_c

k(E)     = 1 / integral E(lambda) ybar(lambda) d lambda
XYZ_j    = k(E) integral R(lambda) E(lambda) xbar_j(lambda) d lambda
```

There is no `lambda/(h c)` factor in this relative response calculation. Such
a factor belongs in the separately declared quantum-efficiency photon model;
adding it here would reinterpret an energy-response dataset and double-count
conversion already folded into that response.

The initial profile fits one unconstrained `3 x 3` ordinary least-squares
matrix from the 190 D55 white-balanced camera rows to D65-referred target
tristimuli. A perfect diffuser defines per-channel WB. All Ohta patches are
then independent D55 validation, and D65/D75 are untouched cross-illuminant
checks. One common scalar per illuminated chart is permitted; no patch may be
independently normalized. No clipping, development, tone curve, gamut map, or
display encoding participates.

The camera response, 190-patch reflectances, and Ohta chart are tabulated at
5 nm. The 1 nm path is therefore a numerical integration oracle over their
pinned piecewise-linear interpolation, not a claim that the underlying
measurements resolve 1 nm spectral features. It can measure added native-15
reduction error; it cannot recover spectral structure absent from the sources.

The 1 nm reference and native-15 representation must be evaluated as separate
paths through the same corpus. Report sensor-channel residual, matrix
residual, and the incremental native-15 color error separately. Pinned Colour
0.4.6 is a cross-check, while a contained independent runner owns expected
values so `CameraColorModel` cannot grade itself.

The pinned cross-check environment is Python `3.10.1`, Colour `0.4.6`, and
NumPy `2.2.6`. These versions and hashes describe how the research result was
derived; the later immutable run must retain them again with its executable
outputs.

[CIEDE2000](https://www.cie.co.at/publications/colorimetry-part-6-ciede2000-colour-difference-formula-1)
with `kL = kC = kH = 1` is retained as a diagnostic after both predictions are
expressed in Lab under the same D65 reference. CIE describes it as an
approximate relative magnitude, not a universal just-noticeable-difference or
pass boundary. The former provisional `approximately 1 DeltaE00` gate is
therefore withdrawn. A project acceptance budget may be selected only after
the independent error distribution is measured and must be labelled as an
authored engineering criterion.

### Prerequisite execution result

Verified immutable run `000373-camera-t5-colorimetric-prerequisite` (artifact
set `8249584487fa29fc8d819792188c8df5ec2ed56aaeb4fb720f7d69b1895531f1`)
materializes the exact selected bytes, licenses, URLs, commit/DOI identities,
hashes, tool versions, equations, independent oracle, common-scale corpus, and
per-patch results. Its 190-row D55 least-squares fit is rank 3. All 24 Ohta
patches remain independent under each of D55, D65, and D75, producing 72
validation cases; perfect-diffuser WB error is exactly zero in both paths.

Across the combined validation set, the 1 nm numerical path has mean/maximum
target `DeltaE00` `1.1263537242 / 3.1943921125`; native-15 has
`1.3518946099 / 3.0396253605`. The direct native-15-versus-1 nm difference is
mean/p95/maximum `0.7444356038 / 1.2774968035 / 2.3446275440`. Target XYZ RMSE
changes from `0.0088872737` to `0.0092759775`. Native-15 therefore introduces
a bounded, nonzero approximation smaller on average than the underlying
matrix-to-target error; the data do not justify calling it invisible in every
patch or declaring a universal perceptual threshold. This is adequate evidence
to proceed with the generic relative-color concept while retaining the exact
loss distribution for review.

Run `000372` is permanently retained as a failed environment-only attempt:
the sandbox denied the harness's read-only tracked-file inventory before the
oracle ran. It does not change the accepted calculation. Empirical linear RAW
captures and absolute sensor quantities remain necessary only for a named-
camera physical claim. Illuminant A remains excluded pending reconciliation of
the official checksum conflict.

The exact source-to-test mapping for the next control proof is canonical in
[Camera-Control Test Inventory](../../../../archives/topics/topic-consolidation-20260906/agents/topics/extraterrestrial/camera-control-test-inventory.md). It includes
retained noon and sunset EXIF examples, official camera-control and bracketing
manuals, CIE illuminants, EMVA sensor quantities, published sensor envelopes,
and the distinction between sourced observations, equation-derived validation
levels, and authored diagnostics. Do not duplicate those test values here.


## Remaining Qualification Work

The generic physical-capture relationship is qualified, but the accepted D3
ColorChecker-derived spectra are saturation stress data rather than a
colorimetric chart exposure: each patch was independently scaled to `75%` of
nominal full well. They cannot validate chart-relative lightness, white
balance, a characterization matrix, or camera-color accuracy.

The live, dependency-ordered research and acquisition backlog is canonical in
[Camera Controls Testing Plan](../../../../archives/topics/topic-consolidation-20260906/agents/topics/extraterrestrial/camera-controls-testing-plan.md#outstanding-research-and-data-acquisition).
In summary, remaining work is:

- materialize the now-selected rawtoaces 190-patch training set, Canon relative
  response, Ohta validation chart, and official CIE D55/D65/D75/observer bytes
  with source, hash, and license identity in immutable evidence;
- implement the frozen independent 1 nm sensor/XYZ/WB/matrix oracle and measure
  the information loss introduced by the native-15 basis;
- fit only the 190 D55 training reflectances and regenerate the independent
  24-patch Ohta D55 plus D65/D75 cases with one common scale per illuminant;
- reconcile the official Illuminant A checksum conflict before using A as
  qualification evidence;
- select a sourced fixed development operator and preserve raw capture as an
  unchanged control;
- qualify sky luminance ordering, chromaticity/colorfulness, highlight
  behavior, and temporal suitability before automatic exposure is introduced;
- retain raw-channel saturation separately from development and display
  clipping;
- benchmark the eventual compiled CPU and GPU paths; and
- obtain measured spectral sensitivity plus repeated black-subtracted linear
  RAW chart captures and actual QE, full-well, gain, noise, black level, ADC,
  optical, and development data before making any physical named-camera claim.

PBRT's Canon relative profile and Colour remain accepted Stage 8a
source/oracle inputs, not runtime dependencies and not physical sensor-scale
authorities. The pinned rawtoaces-data Canon response and 190-patch set are now
the selected T5 characterization sources once materialized in immutable run
evidence. CIE-JS and jsColorEngine remain references or future evaluation
candidates.
