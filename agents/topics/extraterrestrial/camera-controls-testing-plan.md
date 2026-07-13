# Camera Controls Testing Plan

## Purpose

This document owns execution and acceptance for the configurable
`CameraColorModel` concept proof. The
[Camera-Control Test Inventory](camera-control-test-inventory.md)
remains the single owner of exact sources, case IDs, levels, equations,
expected values, and tolerances. The
[Camera Controls Development Plan](camera-controls-development-plan.md) owns
the functionality being built.

Testing accompanies Color-model development as vertical slices. Producing an
image does not prove a control: its physical law, owned internal boundary,
invariants, public Color result, and composition behavior must pass first.

## Claims under test

1. A declared profile maps native-15 radiance into three sensor channels
   according to its effective response.
2. Shutter, aperture, pixel area, and declared neutral attenuation change
   photon collection according to their physical equations.
3. Full-well clipping destroys raw channel information before ISO, white
   balance, characterization, or development.
4. ISO/system gain changes post-well signal, not collected photons or raw
   saturation.
5. ADC selection changes codes and quantization, not upstream physical state.
6. White balance, characterization, and development change only their owned
   downstream representations.
7. A combined configuration equals composition of its independently proven
   controls.
8. The ordinary `CameraColorModel` public result equals the terminal value of
   its diagnostic trace, so no runner-only reconstruction becomes the actual
   renderer.

This proof does not claim named-camera fidelity, stochastic sensor fidelity,
automatic-exposure quality, final photographic development, HDR recovery, or
spatial optical fidelity.

## Frozen baseline

Use the inventory baseline: accepted production wide-noon native-15 field,
accepted Stage 8c generic sensor, sourced noon-phone exposure, fixed D55 white
balance, accepted generic characterization, identity development,
deterministic noise-off operation, and declared output encoding.

Every independent sweep changes one quantity. All other parameters and input
bytes remain fixed. Each level is represented by a complete immutable
`CameraColorProfile` derived from the frozen baseline profile; there are no
loose test-only model parameters. The atmosphere is not rerun or retested.

## Evidence retained for every case

- case and parent-configuration IDs;
- complete profile ID, parent-profile ID, changed field, and profile hash;
- source artifact and profile hashes;
- implementation, build, and tool identities;
- exact parameters, units, and applied equation;
- disk-center, upper-quarter-sky, and top-center-sky intermediates;
- full-frame raw and ADC clipping counts;
- relevant finite, zero, and boundary counts;
- calculated expectation, measured error, and gate result; and
- hashes for reports and any rendered endpoints.

Every execution writes a new immutable run. Reused sources remain unchanged,
and every derivative identifies its parents and derivation.

## Test methods

### Multi-reference rule

No Color-sensitive conclusion may use production display output alone.
The evidence is divided into four suites whose claims may not be substituted
for one another:

1. **Mechanics:** zero, neutral, native-bin impulses, scalar copies, and exact
   clipping-boundary spectra prove algebra, ordering, invariance, and boundary
   behavior.
2. **Colorimetry:** full-resolution ColorChecker reflectances, CIE
   illuminants, a perfect neutral, measured relative camera responses, CIE XYZ
   functions, and a pinned independent oracle prove spectral projection,
   white balance, characterization, and native-15 discretization error.
3. **Physical exposure:** unit-bearing Algorithm32 radiance plus a declared
   physical sensor profile prove photons, electrons, full-well clipping, gain,
   and ADC behavior. A generic authored profile supports only a generic
   concept claim.
4. **Appearance:** complete Algorithm32 fields and sourced photographs support
   full-context review. Unmatched photographs remain qualitative and cannot
   supply expected pixels.

Production RGB remains an identity/regression control. A result passes only
the suite whose inputs and oracle justify it.

The accepted `T3` ColorChecker stimuli were individually scaled to place each
patch at `75%` of the nominal full well. That is valid saturation stress data,
but it destroys chart-relative lightness and is therefore prohibited as a
white-balance, characterization, or camera-color accuracy oracle. The
colorimetric suite must instead use one common exposure scale for all patches
under a given illuminant.

### Boundary-value proof

Retain values after spectral projection, photon collection, electron
collection, raw clipping, gain, ADC, white balance, characterization,
development, and encoding through `CameraColorModel.traceRadiance`. Diagnose
the first divergence rather than only the final image.

### Independent-oracle or analytic proof

Use an independent construction or analytic equation where required. The
implementation under test may not create its expected result through the same
code path.

### Invariance proof

Hash or compare upstream intermediates that the changed control does not own.
Also compare the derived profile with its parent and require that only the
declared field and derivation metadata changed. Byte-identity requirements and
tolerances come from the inventory.

### Scaling and monotonic proof

Verify shutter, aperture, area, attenuation, and gain laws. Verify monotonic
clipping when exposure, gain, or capacity changes in a known direction.

### Composition proof

Compare a direct combined evaluation with independently composed qualified
operators at every retained boundary, not only encoded RGB. Also require
`radianceToDisplayRgb(spectrum)` to equal the trace's terminal encoded result.

### Rendered review

Render only the baseline, declared sweep endpoints, useful interaction
diagnostics, and curated configurations. Numerical failure cannot be
overridden by appearance. Appearance can reject a development candidate
without rejecting qualified capture mechanics.

## Required inputs, operations, and justified results

| Suite | Required inputs | Operation | Justified expectation |
|---|---|---|---|
| Mechanics | Exact zero, flat neutral, fifteen native-bin impulses, scalar copies, and analytically constructed spectra immediately below/at/above each channel boundary | Trace every public model stage and compare with independently evaluated scalar/matrix equations | Exact zero preservation; pre-clip linearity; expected 0/1/2/3-channel clipping; monotonic clipping; public result equals trace terminal result. |
| Spectral projection | Pinned relative camera-response curves, original chart/training reflectances and illuminants, runtime native-15 bins, and an independent pinned implementation | On the common `380--780 nm` domain, linearly resample source data to 1 nm without extrapolation; integrate relative sensor RGB at 1 nm; separately compile and evaluate `3 x 15`; compare both and retain the discretization residual | Runtime agrees with the independent native-15 calculation to numerical tolerance. The difference between native-15 and 1 nm is reported as measured information loss on independent validation stimuli. No universal perceptual threshold is assumed before that distribution is known. Failure identifies spectral resolution separately from matrix or tone-curve error. |
| Characterization | The rawtoaces 190-patch training spectra, the independent 24-patch `ColorChecker N Ohta` validation chart, one common scale per illuminant, a perfect diffuser, pinned Canon EOS 5D Mark IV relative responses, CIE XYZ references, D55 fit illumination, and D65/D75 cross-illuminant cases | Compute camera RGB and reference XYZ independently; derive per-channel WB from the perfect diffuser; fit one unconstrained `3 x 3` least-squares matrix only on the 190-patch D55 set; apply that frozen WB/matrix procedure to all 24 validation patches and to untouched D65/D75 cases before development | The matching perfect diffuser maps to neutral; upstream capture remains byte-identical; the local fit reproduces the independent fit; training, independent-chart, cross-illuminant, and native-15 errors are reported separately. Cross-illuminant sets are not corrected from their own patch answers. Tone mapping cannot participate. Illuminant A remains excluded until its official checksum conflict is resolved. |
| Physical exposure | Absolute Algorithm32 spectral radiance, optics/exposure, pixel area, absolute QE, full well, gain, and ADC parameters with units and provenance | Convert radiance to photon exposure, integrate electrons by sensor channel, clip at full well, then apply gain and ADC | Shutter/area/transmission scale linearly; f-number follows inverse square; reciprocal exposures agree; ISO cannot alter photons, electrons, or raw clipping; all-channel clipping removes recoverable raw chromatic ratios. |
| Development | Accepted characterized linear RGB, neutral and saturated ramps, complete clock fields, declared output space/display, and one fully specified development operator | Apply development only after accepted capture/WB/characterization; then gamut handling and encoding | Monotonic and continuous output; neutral preservation; upstream byte identity; no recovery of raw-clipped channel ratios; smooth temporal progression. Exact photographic pixels require a matched capture and are otherwise not expected. |
| Empirical named camera | Measured spectral sensitivity, black-subtracted linear RAW chart captures, measured illuminant, exposure metadata, repeat captures, and applicable sensor/profile metadata | Predict normalized raw RGB before WB/development and compare with measured RAW; then qualify the camera transform on held-out captures | Residuals are bounded by measured repeatability plus declared model error. Without this suite, no named-camera fidelity claim is allowed. |

`DeltaE00` is a diagnostic only: CIEDE2000 is evaluated with
`kL = kC = kH = 1` after both predictions are converted to Lab using the same
declared D65 reference white. CIE describes the formula as an approximate
relative color-difference magnitude; it does not establish one universal
JND or project pass threshold. Consequently, `DeltaE00` is not applied to
encoded screenshots or uncontrolled photographs, and any later numeric pass
budget must be explicitly authored and justified from the measured oracle
distribution rather than presented as a CIE requirement.

## Outstanding research and data acquisition

### Required before `T5` color characterization

Items 1--6 are now satisfied for the initial D55/D65/D75 concept proof by
verified immutable run `000373-camera-t5-colorimetric-prerequisite` (artifact
set `8249584487fa29fc8d819792188c8df5ec2ed56aaeb4fb720f7d69b1895531f1`).
Illuminant A remains explicitly excluded; its exclusion satisfies the initial
proof boundary without claiming that its source conflict has been resolved.

1. **Materialize the researched sources in immutable run evidence.** Retain
   and hash the rawtoaces 190-patch training set and Canon EOS 5D Mark IV
   relative response, Colour 0.4.6 `ColorChecker N Ohta` reflectances, exact
   patch identities/order, official CIE D55/D65/D75 and 1931 2-degree tables,
   source attribution, license, wavelength support, and interpolation policy.
   Research has identified these exact sources; the executable run must copy
   their bytes and provenance rather than depend on the mutable research cache.
2. **Resolve or exclude Illuminant A.** The official CIE page advertises MD5
   `6c33a1c3caff2d774f0f2025f3001a56`, while the CSV currently served by its
   own download link hashes to `ed0e4effb55d82b950c0912b6278a9d1`.
   Do not use A as qualification evidence until that conflict is reconciled.
   D55, D65, D75, and the 1931 observer match their advertised official hashes
   and are sufficient for the initial proof.
3. **Freeze the camera-response semantics.** Use the rawtoaces Canon EOS 5D
   Mark IV `380--780 nm`, 5 nm, relative R/G/B response as the primary
   characterization input. It is an effective relative response, not absolute
   QE; therefore the characterization integral contains no additional photon
   conversion. Retain PBRT's embedded curves as a prior implementation
   comparison, not as the physical scale authority.
4. **Materialize the independent colorimetric oracle.** Implement the frozen
   1 nm sensor/XYZ/WB/matrix equations below in a contained proof runner using
   pinned Colour 0.4.6 only as a cross-check. The implementation under test
   must not generate its own expected values. Pin all tool and numerical
   versions, matrices, source hashes, and per-patch results.
5. **Measure native-15 information loss.** Generate the same sensor RGB and XYZ
   results from the 1 nm piecewise-linear reference and compiled native-15
   spectra.
   Record channel error and added `DeltaE00` separately from the intrinsic
   camera-to-XYZ matrix residual. This determines whether the native-15
   representation is adequate for this concept proof or whether
   more spectral resolution is needed. Do not choose a tolerance from the
   candidate's result.
6. **Regenerate the colorimetric corpus correctly.** Fit on all 190 rawtoaces
   training reflectances under D55. Validate on all 24 Ohta patches, which do
   not influence the fit, and on untouched D65/D75 cases. Use one common scale
   within each illuminant so relative lightness survives; retain a perfect
   diffuser separately. The accepted per-patch-scaled D3 records remain
   immutable saturation evidence only.

### Frozen relative-color oracle

The initial characterization is relative color, not electron prediction. For
reflectance `R(lambda)`, illuminant `E(lambda)`, camera response `S_c(lambda)`,
and CIE color-matching function `xbar_j(lambda)`, linearly resample source data
onto inclusive `380--780 nm` 1 nm samples and use the same numerical
integration rule throughout:

```text
C_c(R,E) = integral R(lambda) E(lambda) S_c(lambda) d lambda
W_c(E)   = integral E(lambda) S_c(lambda) d lambda
Cwb_c    = C_c / W_c

k(E)     = 1 / integral E(lambda) ybar(lambda) d lambda
XYZ_j    = k(E) integral R(lambda) E(lambda) xbar_j(lambda) d lambda
```

`W_c` is the perfect-diffuser channel response; division performs the declared
illuminant white balance. A common scalar exposure may be applied to every
patch under one illuminant, but it must cancel before or be represented by the
single fitted scale rather than normalize patches independently. Fit one
unconstrained `3 x 3` matrix by ordinary linear least squares from the 190 D55
`Cwb` rows to their D65-referred target tristimuli. This D55-capture/D65-output
choice is the frozen PBRT-style initial profile, not chromatic adaptation
silently added after fitting. Apply the matrix unchanged to the independent
Ohta chart and cross-illuminant cases, then compare in the fixed output
reference. No tone curve, gamut mapping, clipping, or display encoding may
participate in this qualification.

The camera response, 190-patch set, and Ohta chart are measured/tabulated at
5 nm. Therefore "1 nm oracle" means higher-resolution numerical integration of
the pinned piecewise-linear 5 nm data. It isolates integration and native-15
reduction error; it is not evidence of unmeasured 1 nm physical structure.

### Required before a named-camera claim

7. **Acquire empirical RAW validation.** Locate or capture linear RAW
   ColorChecker data for a camera with a measured spectral-sensitivity profile,
   including dark/black level, measured or retained illuminant spectrum,
   exposure metadata, chart geometry, and repeated captures. Retain original
   files and hashes. JPEGs are not substitutes.
8. **Acquire physical device parameters.** Obtain absolute QE or a justified
   radiometric calibration, pixel area/fill behavior, full well, conversion
   gain, black level, ADC range, and relevant optical transmission before
   predicting named-camera electrons or saturation.
9. **Establish empirical tolerances.** Use repeat-capture variation and source
   calibration uncertainty to set normalized-RAW and held-out Color tolerances.
   Do not retrofit thresholds from the candidate's observed errors.

### Required before final development or photographic matching

10. **Select a sourced development operator.** Freeze its equation, working
    space, tone scale, gamut handling, output display, encoding, parameters,
    and reference implementation. Identity remains the only executable
    development until this is complete.
11. **Acquire matched scene references if numerical photographic comparison is
    desired.** A usable reference needs original RAW, camera/profile identity,
    lens/filter information, exposure and WB, location/time, scene/atmosphere
    conditions, and retained processing instructions. Existing web images and
    video frames remain qualitative.

Items 1--6 were the immediate data prerequisite for `T5` and are complete for
D55/D65/D75. Items 7--9 are not required for the generic concept proof, but
they are mandatory before its results are attributed to a named camera. Items
10--11 gate `T9` development and any numerical photographic-match claim. `T4`
gain/ADC mechanics may continue independently.

## Execution tranches

These follow the inventory's `P0`--`P9` dependencies and the development
plan's `D0`--`D9` packages.

### `T0` — containment, provenance, units, and baseline

- Validate source paths, hashes, units, bin handling, and derivations.
- Replay the accepted Stage 8c baseline.
- Run the exact-zero diagnostic.
- Freeze the `CameraColorModel` public/trace contract, complete
  `CameraColorProfile` schema and derivation rule, and diagnostic serialization.

Stop if the baseline does not reproduce; later controls may not repair it.

### `T1` — spectral camera profile

- Verify the compiled `3 x 15` response against accepted construction and the
  independent Colour evidence.
- Verify zero preservation and linear scaling before clipping.
- Retain raw chromatic progression across captured clock states.
- Record unresolved physical responses folded into the effective profile.

Named-camera and separately variable sensor-stack claims remain blocked.

### `T2` — optical capture controls

- Execute the inventoried shutter, aperture, pixel-area, and filter/OD cases.
- Verify linear shutter/area and inverse-square f-number scaling.
- Verify ideal-neutral chromaticity invariance before clipping.
- Verify attenuation from sourced optical density.
- Render only baseline and declared endpoints.

Secondary aperture, lens, and angular effects are excluded.

### `T3` — full well and raw clipping

- Materialize a saturation-mechanics corpus and run analytic, spectrally
  varied ColorChecker-derived stress spectra, and transported Sun/sky stimuli.
- Sweep inventoried full-well capacities.
- Prove pre-clip electrons are invariant.
- Prove lower capacity cannot reduce clipping.
- Retain channel clip masks and distinguish partial from all-channel clipping.
- Confirm clipping precedes every downstream operation.
- Demonstrate no-, one-, two-, and all-channel clipping separately and report
  the resulting loss of recoverable channel ratios.

This tranche establishes when solar-disk color becomes unrecoverable. It does
not qualify ColorChecker colorimetry: the accepted D3 per-patch scale is a
clipping stimulus, not a chart exposure.

### `T4` — sensor electronics and ADC

- Sweep inventoried ISO-relative gains with stochastic effects disabled.
- Prove photons, pre-gain electrons, and raw clipping are invariant.
- Verify post-well gain and ADC clipping.
- Compare 10- and 12-bit cases with the half-code quantization bound.
- Repeat the deterministic control and require byte identity.

Noise, black drift, PRNU, crosstalk, and nonlinear ADC claims wait for sourced
profiles.

### `T5` — white balance and characterization

- Complete outstanding research/data items 1--6 and materialize the separate
  common-exposure colorimetric corpus.
- Run the 1 nm and native-15 spectral projection comparison before fitting a
  matrix.
- Fit only the 190 rawtoaces D55 training patches; retain all 24 Ohta D55
  patches and D65/D75 cross-illuminant cases as untouched validation. Add A
  only after its source checksum conflict is resolved.
- Run CIE-derived WB cases and accepted/diagnostic matrices before development.
- Require byte-identical capture, clipping, and ADC evidence.
- Verify perfect-neutral behavior, independent matrix calculation, independent
  chart error, cross-illuminant error, and separately reported native-15 loss.
- Verify only post-raw or post-WB representations change, respectively.

### `T6` — development boundary

- Replay identity development exactly.
- Prove every earlier intermediate remains unchanged.
- Record the dark, weakly blue identity presentation as a diagnostic rather
  than a failed capture result.

A non-identity candidate remains blocked until its equation, source/authored
status, parameters, and expectations are frozen in the inventory.

### `T7` — required interactions

Execute only the inventoried interaction families:

- aperture/shutter reciprocity;
- multiplicative optical composition;
- optical exposure versus post-well ISO;
- clipping versus white balance;
- downstream isolation; and
- direct combined evaluation versus composed operators.

This proves the independently developed controls form one coherent Color
model.

### `T8` — curated configurations

Render ready sourced configurations: generic noon phone/DSLR settings, generic
sunset phone/DSLR settings, OD 5 manual disk diagnostic, and separate AEB
members. Predict clipping and intermediates before rendering each case.

External photographs are qualitative context, not pixel or named-camera
oracles. An ordinarily exposed clipped disk is acceptable. The sky must retain
chromatic relationships that survive capture.

### `T8.1` — exposure prediction and profile selection

Before `T9`, evaluate complete profiles against the same production spectral
field. Normal mode admits a compact clipped source but rejects broad raw, ADC,
display-highlight, or exact-white loss; among qualifying candidates it selects
the brightest encoded field. Disk-visible mode additionally requires every
disk-center raw channel below full well. Manual mode returns the requested
profile without optimization. An optional prior exposure and maximum EV step
may constrain later passing-time selection without freezing a timelapse policy.

Test prediction repeatability, public-model parity, constraint classification,
deterministic ranking, no-qualified reporting, disk recovery, manual identity,
and continuity-budget behavior. Policy thresholds are application choices,
not camera physics. Noise, blur, depth of field, diffraction, camera-specific
JPEG development, glare, and lens artifacts are outside scope.

### `T8.3` — stopped unresolved prerequisite

This tranche was not run. Its former requirement was to freeze one sourced
generic exposure calibration that
connects scene radiometry and exposure settings to sensor saturation and
normalized RAW. The current `ISO / 100` post-well gain remains a valid ordering
fixture but may not stand in for ISO 12232 calibration or real-camera
sensitivity.

Acceptance requires:

- unchanged atmosphere spectra and unchanged `T0`--`T8.2` control ordering;
- independent agreement for the chosen exposure calibration at unsaturated
  and saturated analytic fixtures;
- explicit traces of predevelopment camera RGB, normalized RAW, developed
  linear RGB, and encoded sRGB;
- a frozen minimal camera-development equation whose behavior is justified by
  a standard, publication, or clearly labeled generic design—not fitted to one
  reference JPEG;
- preserved neutral, monotonic, clipping, and downstream-isolation behavior;
- pre/post-development chromaticity and luminance reports for representative
  noon and sunset sky regions; and
- controlled clear-sky and analytic/chart expectations kept separate from
  qualitative Wikimedia and owner-supplied image review.

Resolution, framing, clouds, glare, PSF enlargement, and lens artifacts are
not failure explanations for clear-sky chromaticity and remain deferred.

### `T9` — stopped, not authorized

The project owner stopped the camera-emulation experiment before this tranche.
The former plan would have introduced one frozen development candidate at a time.
Test monotonicity, neutrality, highlight behavior, gamut behavior, continuity,
and ownership isolation before comparison frames.

The project owner is the observer proxy. Compare candidate development with
identity, production, and clearly labelled external photographic references.
Do not claim numerical matching to an uncontrolled photograph.

## Non-factorial budget

```text
one baseline
+ sum of independent control levels
+ six required interaction families
+ ready curated configurations
```

Do not construct a Cartesian grid. Add a combination only for a real product
mode, common photographic use, or diagnosed interaction not already covered.

## Failure handling

- A `T0`--`T5` failure returns to the matching development package and blocks
  dependent tranches.
- A `T6` or `T9` appearance failure does not invalidate upstream mechanics
  unless boundary evidence locates the divergence there.
- A composition failure returns to the first mismatching retained boundary.
- A missing sourced characteristic stays explicit and blocked; downstream
  Color may not be tuned to conceal it.
- Prior accepted and rejected evidence remains immutable.

## Acceptance

Stage 8c.2 mechanics pass when every ready inventory case through `T8` passes,
direct composition agrees with independently proven operations, required
derivations are immutable and traceable, and no downstream stage conceals an
upstream failure. The accepted renders must come from the public
`CameraColorModel` configured by a complete retained profile, not from loose
runner parameters or a proof-runner reconstruction.

`T9` did not execute. Passing Stage 8c.2 does not accept a final look, named
camera, automatic exposure, timelapse schedule, HDR merge, noise, glare,
product UI, or production code. There is no active next camera stage.

## Current test status

`T0` is accepted in immutable run `000366-camera-color-model-d0-t0` (artifact
set `185f9eb2a23485705c1b3269bfdf2beb7ab0d638738241de654d1fb08b346d4c`).
Cases `B-01`, `B-02`, and `B-03` pass through the public
`CameraColorModel`: retained unit/provenance evidence, byte-identical Stage 8c
baseline framebuffer, identical full-frame raw clipping, exact-zero
propagation, finite full-frame output, and zero public/trace mismatches.

`T1` is now accepted in immutable run
`000367-camera-color-model-d1-t1` (artifact set
`8bf33764f0ead4524653035284582a98050657e4fa2e7b7adc19ebb7df96ca0f`).
All `R-ORACLE`, `R-SCALE`, `R-CLOCK`, and `R-PUBLIC` gates pass. Matrix/oracle
relative errors remain below `4e-16`; pre-clip scaling and chromaticity errors
are exactly zero; every frozen scale remains below full well; and all four
complete fields have zero non-finite values or public/trace mismatches.

`T2` is accepted in immutable run `000370-camera-color-model-d2-t2` (artifact
set `85e39815201169ecf0c56b35bd8c4551bfd5ffeaa7aed31cbfede3375dec5e88`).
All ready shutter, aperture, ideal OD, and pixel-area levels obey their
analytic pre-clip scaling laws and preserve sensor chromaticity. Clipping is
monotonic with collection factor, OD 5 recovers the raw disk boundary, all
endpoint renders come from the public model, and every level is a complete
traced profile rather than a loose override. `T3` full-well/raw-clipping proof
is next, beginning with the multi-source Color-reference corpus.

`T3` is accepted in immutable run `000371-camera-color-model-d3-t3` (artifact
set `ec5a8b3b330a5864d79aa949000ce96438f9a40023ce4043786e13d80eb315ad`).
The retained multi-source corpus broadens saturation-mechanics evidence beyond
production spectra. Five full-well profiles pass pre-clip invariance,
monotonicity, finite/parity, held-out-partition, and exact 0/1/2/3-channel
clipping gates. Its ColorChecker records were independently scaled to `75%` of
the nominal full well, so they are not chart-colorimetry or camera-accuracy
evidence. `T4` electronics and ADC testing may proceed next. Illuminant A is
not part of the initial colorimetric proof.

The `T5` prerequisite is now accepted and independently verified in immutable
run `000373-camera-t5-colorimetric-prerequisite` (artifact set
`8249584487fa29fc8d819792188c8df5ec2ed56aaeb4fb720f7d69b1895531f1`).
Run `000372` is retained as a failed environment-only attempt: sandbox policy
denied the harness's read-only tracked-file inventory before the oracle ran.
The accepted run retains 13 exact source/license/metadata files, a rank-3
190-patch D55 fit, all 72 independent Ohta validation cases, and exact neutral
perfect-diffuser WB. Across combined D55/D65/D75 validation, native-15 versus
the 1 nm numerical reference has mean/p95/maximum `DeltaE00` of
`0.7444356038 / 1.2774968035 / 2.3446275440`. The 1 nm and native-15 target
means are `1.1263537242` and `1.3518946099`; target XYZ RMSE changes from
`0.0088872737` to `0.0092759775`. This measures a bounded added approximation,
not a universal perceptual pass threshold. It supplies the declared
D55/D65/D75 generic relative-color evidence used by accepted `T5`; A and
named-camera claims remain excluded.

`T4` is accepted on the current shared Color-stage implementation in verified
immutable run `000375-camera-color-model-d4-t4` (artifact set
`04ccb783237087984ea0c000f5b21f7d98e781fed1bccbb268d65a957a6a8afb`).
Five post-well gains and 10/12-bit ADC profiles produce zero upstream,
downstream-isolation, or public/trace mismatches. The gain equation error is
exactly zero; maximum quantization error is `0.0004887586`, or
`0.9999999999998855` of the half-code bound; ADC-clipped channel counts are
nondecreasing `[0,1,3,3,3]`; deterministic repeats are byte-identical. Run
`000374` preserves the same accepted calculation before the shared raw-color
stage refactor; `000375` is the controlling current-code evidence.

`T5` is accepted in verified immutable run
`000376-camera-color-model-d5-t5` (artifact set
`12e756b300ddeb73b472a28aa8e588cb6807de77f2b0bc5119f6ffe4cc279330`).
The model now exposes one normalized-raw trace boundary used by the ordinary
spectral path. JavaScript and independent Python 190-row fits agree within
`1.620925616e-14`; CIE D55/D65/D75 WB agrees within
`1.110223025e-16`; all 72 independent matrix projections agree exactly.
Changing WB leaves capture through ADC byte-identical, changing the matrix
leaves capture through WB byte-identical, and every public spectral result
equals its trace terminal value. This accepts relative WB and characterization
mechanics with identity development. `T6` is next; A, appearance development,
and named-camera fidelity remain excluded.

`T6` is accepted in verified immutable run
`000378-camera-color-model-d6-t6` (artifact set
`b4e3df1903b362891e02cb9345d1255b4f07e06899d18d9eee466922e5edebb4`).
The profile now selects versioned interface `camera-development-v1` with the
sole allowed `identity-clamp` operator. Eight direct boundary cases, 18
spectral cases, and six normalized-raw cases pass with zero identity, public-
trace, or earlier-boundary mutation errors. In-range values are exact,
out-of-range values obey only the declared `[0,1]` boundary clamp, the ramp is
monotonic, and an unfrozen non-identity operator is rejected. The retained
dark weak-blue diagnostic maps linear `[0.01,0.02,0.04]` unchanged before sRGB
encoding; it remains diagnostic rather than an appearance failure. Run
`000377` preserves the failed proof assertion that incorrectly required
out-of-range clamp cases to be exact identity. No development look has been
selected.

`T7` is accepted in verified immutable run
`000379-camera-color-model-d7-t7` (artifact set
`82262da32dedea97a18f41658643323e9b057e59b07fa4fce9dd2f1837d29fc5`).
All six frozen interaction families pass without a factorial sweep. Four
reciprocity cases have maximum relative error `3.667965e-16`; two combined
optical products have maximum error `1.560929e-16`. The tracked source-Sun
spectrum changes from baseline full-well fractions
`[6342.0069,12467.5201,8480.3126]` to OD 5 fractions
`[0.0634201,0.1246752,0.0848031]`; subsequent gain leaves that raw recovery
unchanged while reaching ADC clipping. All three WB presets preserve the
fully clipped raw Sun, downstream matrix/development isolation passes, and 11
direct model evaluations match the separately authored composed equations
with zero numeric, discrete, or public/trace error.

`T8` is accepted in verified immutable run
`000382-camera-color-model-d8-t8` (artifact set
`c2cf6efab91308d86e58d0a2123b2fb35fed85b46fb4406f77e90f085bbed275`).
Eight ready non-factorial configurations were predicted before a separate
render pass and all clipping counts matched exactly. Raw-clipped pixel counts
are `9` for phone daylight, `9` for DSLR noon, `63,597` for phone sunset, `6`
for DSLR sunset, `0` for OD 5 manual disk recovery, and `9 / 9 / 9,356` for
the `-3 / 0 / +3 EV` AEB members. OD 5 recovers the noon disk center without
raw clipping, while the standard `-3 EV` AEB member still clips all three disk
channels. Mean encoded luminance increases strictly across the AEB sequence.
All eight public renders use the complete `CameraColorModel` with identity
development; the plate is review evidence, not final appearance acceptance.
`T8.1` exposure prediction and deterministic complete-profile selection are
accepted in verified immutable run
`000384-camera-exposure-selection-d8-1-t8-1` (artifact set
`8b47a56b8eb9aa9f0dd13601fee7351a502e5c0f24258cb0d88789ff71317a39`).
All eight full-field evaluations are finite and deterministic; the evaluator's
disk-center output exactly equals the public model. Normal noon and sunset
select the brightest qualifying DSLR-settings profiles, disk-visible selects
OD 5, manual returns its requested phone-sunset profile, an impossible policy
returns no candidate, and the optional continuity budget excludes profiles
outside its EV step. These are best among the supplied complete profiles under
the declared policy, not universal photographic optima. `T8.3` was canceled,
so they remain uncalibrated historical selector outputs and are not accepted
as predictions of the best real camera settings.

`T8.2` prediction-to-render presentation is accepted in verified immutable run
`000385-camera-exposure-selected-renders-d8-2-t8-2` (artifact set
`1c5f79f457b0aa5e243c77dc7594e0676f9cabab0705a1598bc793a45b396348`).
All five selected mode/profile images match their predicted clipping and mean
luminance exactly and reproduce the earlier same-profile PNG byte for byte.
The no-qualified control has no fallback image. This accepts the connection
from setting prediction to image production, not a final development look.

Setting-backed external review run
`000386-camera-wikimedia-noon-reproduction` (artifact set
`1ab2e6b8e2d747be9b2c5205cdc8d81c436bae90ec08777f69b64433652ece8f`)
renders the centered 15-degree production noon field at ISO 102, `f/2.2`, and
`1/6444 s` and places it beside a Sun-centered crop of Wikimedia's source JPEG.
Prediction mechanics pass, but appearance does not match: the generated sky is
weak gray-blue and its circumsolar transition is minimal. This is the decisive
terminal failure evidence. The project owner subsequently declared the
camera-emulation experiment a failure and stopped it; `T8.3`, `T9`, and
passing-time camera work will not proceed. Real-setting prediction,
photographic ranking, and final development remain unaccepted. The plate does
not reproduce the Galaxy M01, clouds, glare, field of view, or Samsung
processing.
