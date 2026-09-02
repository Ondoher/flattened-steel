# Color Reset Design

Status: closed contained-lane design and evidence history. Current production
design is owned by the
[Production Color Reset Design](../algorithm32/production/color-reset-design.md).
CR0 through
CR3 are accepted and CR4's global post-display response is accepted as
diagnostic evidence without a selected appearance row. CR4A establishes that
the unchanged Native15/Q30 sunset field already contains the required smooth
cool-sky/warm-horizon structure. CR4B accepts one smooth pre-tone achromatic
response family and selects its strongest clean row for diagnostic continuation
through CR4C. CR4C's first three-scene replay rejects that response because
plus-10-minute sky medians rise slightly above sunset. Its bounded two-scale
revision restores strict dimming, retains the blue greater sky and warm
horizon, and introduces no twilight clipping. CR4D accepts ordinary daylight
and low-Sun Bruneton preservation while keeping sunset report-only. CR4E
provides the complete authenticated six-scene owner-review stack without
changing or resampling a source panel. CR4F adds exact plus-20, plus-30, and
plus-45 minute acquisitions and localizes a sharp brightening to the current
response's steep 1-lux nautical term; appearance and continuity acceptance
remain false. CR4G replaces only that term with a predeclared slope-limited
family. All three rows pass the six-sample regional chronology and clipping
gates. Owner review identifies `slope-078` as the visual favorite and bounded
follow-ups check its low-Sun join and deep-twilight exposure. CR4H acquired the
missing approach-to-sunset samples. Rejected immutable CR4I run
`000035-cr4i-smooth-bruneton-shoulder-check` shows that none of three
anchor-preserving single-Hill broadenings jointly passes the frozen Bruneton
envelope and all-region chronology. Unsampled continuity remains unqualified.
Accepted presentation-only run
`000036-cr4j-slope-078-six-column-cadence` now supplies the exact complete
`slope-078` cadence as one 6-by-2 owner-review surface without rerunning or
changing Color. CR4K run `000037-cr4k-minimal-deep-twilight-lift` preserves
that equation while testing two pivot-only deep lifts. The `+0.15` row passes
all declared gates; the complete bracket is rejected because `+0.30` narrowly
misses the frozen sunset RMSE ceiling. Owner review finds the differences too
small to justify a change and retains `slope-078/p9`.
CR6 has executed through corrected, independently verified immutable run
`000044-cr6-stellar-contrast-onset`. Its exact eight-scene, 38-image contract
proves the complete palette, authoritative GPU projection, collision and mask
ownership, progressive onset, frozen sky replay, and consecutive-millisecond
108-degree transition. It rejects only because three source-red fixed members
and the source-blue quartile both have a zero median encoded color-axis delta
in the dark scene. The evidence localizes this to the restrained one-pixel
presentation and its final 8-bit quantization, not to sky Color, geometry,
catalog data, cache state, or transport. CR6A therefore brackets only one
global one-pixel presentation calibration at `1x`, `2x`, and `4x`; no row is
selected automatically. Its first complete execution, immutable run `000045`,
is rejected solely because a GPU-authored control was required to be
byte-exact to CR6's CPU-authored parent PNG. Independently verified immutable
run `000046-cr6a-stellar-presentation-scale-bracket-corrected` repairs only
that evidence oracle, reproduces every GPU frame byte-for-byte, and passes all
objective gates. Owner review rejects all three rows; the bracket remains
accepted evidence but supplies no selected stellar presentation. The global
scale-only family is closed under that earlier appearance target. The owner's
later clarification that every unresolved star must remain exactly one pixel
and rely only on pixel brightness explicitly authorizes CR6C's corrected
brightness-only calibration boundary without changing the architecture.
The catalog-first increment is now accepted by independently verified immutable
run `000047-cr6b-brightest-2000-catalog-proof`. CR6B proves only the exact
2,000-brightest BSC V/50 roster. Spectral materialization, runtime
capacity/integration, and appearance remain separate later decisions.
CR6C is complete. Independently verified immutable run
`000049-cr6c-one-pixel-brightness-calibration-narrowed` accepts the narrowed
brightness bracket, and native-scale review selects `q=24` as the lowest
satisfactory fixed-viewport one-pixel calibration under unchanged
`slope-078/p9`.
CR6D is accepted by independently verified immutable run
`000052-cr6d-toggleable-low-light-stellar-chroma`. It implements the minimal
stage-aware registry and the source-linear `human-low-light-chroma-v1` stellar
filter. The disabled path is exact; native-scale review recommends the moderate
`0.65` configuration as the optional enabled state. Future solar or other view
modes must still declare their own stage, target, compatibility, and evidence
boundary.
The physical distant-
Sun cache, Q30 camera-ray transport, Native15 spectra, and Bruneton/B1
qualification remain fixed inputs.

CR6F and CR6G now accept the complete 2,000-member spectral and runtime
capability; CR6H rejects its appearance under `q=24`, so the selected integrated
state retains 500 stars. CR7's static integration is owner-approved, and CR8
is accepted by immutable run `000065-color-reset-qualification`. Final
qualification preserves the pre-display physical B1 score while exposing two
distinct Color selections: `basic-bruneton` and the accepted
`color-reset-slope-078-p9` candidate. Basic Bruneton is not an alias or fallback
for the candidate, and an unsupported selection fails closed.

The active execution order is owned by the
[Color Reset Incremental Experiment Plan](color-reset-experiment-plan.md). The
former [Spectral Color-Transform Experiment Plan](spectral-color-transform-experiment-plan.md)
is retained as failure history and reference evidence; it is no longer the
active candidate-design authority.

## Goal

Build the smallest display and lighting system that satisfies four separate
relationships:

1. Daytime sky and scene appearance retain the qualified Bruneton result.
2. Twilight sky brightness and color progress plausibly from sunset into
   darkness without a source-time switch or independently graded frames.
3. Scene ambient illumination follows the light actually available at the
   receiver, including diffuse sky light after direct sunlight disappears.
4. Stars become visible progressively as their local sky background darkens,
   while retaining the transported stellar spectrum and brightness ordering.

This is a reset in experimental method, not a claim that all earlier evidence
was useless. Earlier work established important negative constraints: direct
source `E_v / pi` is not a complete twilight state; independent RGB curves,
per-pixel peak normalization, hard Ferwerda display clipping, and one coupled
disk-derived normalization can all destroy useful scene relationships.

## Fixed Boundary

The following are read-only experiment inputs:

- the qualified one-degree point-local distant-Sun cache inventory;
- exact cache loading, actual scene Sun placement, and the shared texture-free
  state at and above 108 degrees solar zenith;
- Q30 camera-path integration and the spherical ground endpoint;
- the Native15 spectral basis and all transported radiance values;
- the current stellar source, screen-palette, and atmospheric transmittance;
- the physical B1 comparison configuration and its current accepted RMSE; and
- unchanged production Bruneton as the daytime control.

The basic Bruneton color model also remains an explicit selectable B1 test
option through final qualification. A candidate comparison may coexist with
that option but may not replace its identity, redirect its selection, or make
the candidate the only executable B1 path.

Color may observe the resulting spectra. It may not retune scattering,
interpolation, quadrature, cache contents, source radiometry, ground geometry,
the darkness cutoff, or stellar radiometry to improve an image.

Production source under `src/algorithm32` and `src/flat32` remains a read-only
comparison surface. All new implementation remains under
`scripts/extraterrestrial/color-reset/`. All generated material remains under
`tmp/extraterrestrial/color-reset/`.

The pre-color-reset source snapshot, numbered runs, construction inventory,
and support output are preserved in the verified
[pre-color-reset archive set](../../../archives/extraterrestrial-pre-color-reset-20260831/README.md).
The bin-covered runtime package is both archived and retained extracted at
`server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1`
because the Flat32 resolver is not ZIP-aware.

## Responsibility Separation

The reset treats four related values as different data products. They must not
be collapsed into one scalar or one color curve merely because they all change
near sunset.

### 1. Spectral sky field

For a camera ray, atmosphere and celestial composition produce Native15
`preDisplayRadiance`. This is the physical input to display conversion. The
color-reset lane does not alter it.

### 2. Receiver light state

Lighting diagnostics retain at least:

```text
directSourceIrradiance(lambda)
diffuseSkyIrradiance(lambda)
totalAvailableIrradiance(lambda)
```

The diffuse term is the cosine-weighted upper-hemisphere integral of incoming
sky radiance at the receiver. Direct and diffuse spectra remain separately
available even when a derived photopic illuminance or equivalent diffuse
luminance is also recorded. This state drives scene-lighting experiments; it
is not display RGB and it is not inferred from a screenshot.

### 3. Global display state

The sky field passes through the unchanged Bruneton projection and presentation
as the control. A candidate may add only a scene-global, source-independent,
achromatic response whose condition state comes from a declared receiver-light
measurement. The same state and equation apply to every pixel and channel.

The first candidate question is deliberately narrow: can one common exposure
or luminance response reveal twilight while retaining the qualified Bruneton
daylight and low-Sun appearance inside a tight, measured error envelope? The
response must be one smooth function rather than a daylight/twilight switch or
a hard Bruneton-identity cutoff. A more complex shoulder or gamut operation is
not introduced unless a prior image experiment isolates clipping or display
capacity as the remaining defect.

### 4. Stellar contrast state

Stars retain their transported spectra and use the same final display boundary
as the sky. Their visibility is evaluated against the local displayed sky
background and the point-presentation contract. Time, solar zenith, source
kind, and the 108-degree cache transition may not directly switch stars on.

An early star diagnostic may visualize contrast or threshold crossings, but
that diagnostic is not itself a final star renderer and cannot feed back into
the sky curve.

## Bright-Scene Preservation

The daytime preservation rule is behavioral and measurable, but it does not
require an algorithmic identity branch:

- pure Bruneton is reproduced from the same current physical input;
- a candidate uses one finite response that is continuous in both value and
  slope over the measured receiver-light domain and smoothly converges on unit
  gain as available light increases;
- its displayed difference from Bruneton stays inside a numerical envelope
  fixed before CR4 executes. The envelope is tightest in ordinary daylight and
  may widen modestly and continuously as measured available light falls
  through the low-Sun range;
- the envelope is an evaluation rule, not a second response curve or a mode
  switch. Equivalent receiver-light states receive the same treatment at
  sunrise and sunset, without consulting a named time, Sun elevation, source
  family, or scene id; and
- the physical B1 radiance comparison remains unchanged because no experiment
  operation occurs before the Color boundary.

Exact framebuffer identity remains preferred where the smooth response
naturally produces it, but it is not mandatory solely to protect Bruneton.
Small changes are acceptable when they remain inside the frozen envelope and
allow a continuous transition into twilight. CR4 freezes the numerical bounds
before rendering and reports encoded-code and linear-light error together with
absolute-difference images.

Solar noon alone is not enough to establish preservation. The fixed review
matrix includes one hour before sunset, ten minutes before sunset, and sunset
so a nominal daylight match cannot conceal a low-Sun regression or a sharp
join near the horizon.

CR0 had no archived framebuffer with the complete current W27/Q30, fixed
`640 x 400` camera, and black-ground shape. Its control reproduction is
therefore established by a byte-verified snapshot of the current production
module closure plus exact fixture and cache identities, not by claiming an
unmatched historical PNG as a pixel oracle. The same-run solar-noon comparison
checks that the current production lift preserves Bruneton within one code.
Accepted run `000004-control-smoke` established exact solar-noon identity with
zero differing pixels. At sunset plus 60 minutes, unchanged Bruneton quantized
the frame to black while the current production lift exposed the cache field;
that contrast is a reproduced baseline fact, not acceptance of the current
twilight appearance. Accepted CR1 run `000005-six-scene-visual-baseline` now
freezes the complete shape-matched framebuffer control. It establishes exact
identity between Bruneton and the current lift at solar noon, one hour before
sunset, and ten minutes before sunset, with at most one display code of
difference at sunset. Later replay gates use CR1 rather than an unmatched
historical framebuffer.

## CR1 Diagnostic Boundary

CR1 establishes that the first twilight correction problem is state selection,
not absence of color in the transported field. Ten and 60 minutes after sunset
both report an exact-zero direct-source brightness proxy, but their raw sky
fields remain nonzero and differ by orders of magnitude. One shared dark lift
therefore over-amplifies the plus-10-minute sky into broad saturation while
revealing the plus-60-minute field without clipping. Both raw fields retain a
warm horizon and a bluer upper sky, and the supplemental dark state is exactly
zero with a valid installed runtime and unchanged geometry mask.

The plan owns the exact CR1 measurements and artifact identity. The design
consequence is now confirmed by CR2: a later global display response may not
use direct-source support alone to characterize twilight. Separate direct and
cosine-weighted diffuse receiver irradiance provide the missing unit-bearing
lighting state. No display equation is selected merely because that
measurement is available. CR3 has now proved the scene-lighting boundary; CR4
may observe the receiver state only through its separately declared global
display scalar.

## CR2 Receiver-Light Boundary

Accepted run `000007-available-light-inventory` establishes the receiver-light
measurement contract without changing Color. Its authority is a deterministic
64-by-64 midpoint product quadrature in local `mu = cos(zenith)` and azimuth,
integrated in binary64 over the common Q30 Native15 path radiance. The frozen
production 32-direction Hammersley result is retained only as a sensitivity
cross-check; it is not the CR2 diffuse authority because its spectral
difference from the refined result reaches `25.4693%` in a very dim channel.

The accepted state keeps these quantities distinct:

```text
directNormal(lambda)
directHorizontal(lambda) = directNormal(lambda) * max(0, up dot sourceCenter)
diffuseHorizontal(lambda) = integralUpperHemisphere L(lambda, omega) *
                            max(0, up dot omega) dOmega
totalHorizontal(lambda) = directHorizontal(lambda) + diffuseHorizontal(lambda)
```

Native15 spectra are authoritative; photopic lux and equivalent luminance are
diagnostic projections. Direct-normal is never added to diffuse-horizontal as
if the two shared an orientation. This distinction is material at sunset,
where direct-normal is `15.303799` lux but its horizontal projection is only
`0.011241` lux, while diffuse-horizontal remains `1012.653149` lux.

At ten and 60 minutes after sunset, direct support is exact zero in both cases,
but diffuse-horizontal illuminance is `385.009752` lux and `0.204409552` lux.
The receiver signal therefore distinguishes those states by
`1883.521330` times without consulting a clock, scene id, source kind, or
framebuffer. Repeated evaluation was exact, while the half-cell-rotated
quadrature differed by at most `0.0145091%` photopically and `0.0322762%` in
any significant spectral channel.

CR2 accepts measurement only. It does not accept a scene ambient bridge, a
Color response, twilight appearance, or stellar behavior. It proves that the
declared dark control at solar zenith `108.136575` degrees is exact zero; the
seven fixed scenes do not bracket 108 degrees, so transition continuity remains
unclaimed and the planned CR6 below/above bracket remains necessary.

## CR3 Neutral-Scene Lighting Boundary

Accepted run `000011-neutral-geometry-ambient-proof` establishes the first
scene-lighting consumer of the CR2 receiver state without introducing a Color
candidate. The bridge requires both authenticated inputs: source-normal
Native15 irradiance and the complete 4096-direction Native15 diffuse-radiance
field. It maps the fixed scene normal into spherical model space, evaluates

```text
L_direct(lambda,n)  = rho/pi * E_directNormal(lambda) * max(0,n dot s)
L_diffuse(lambda,n) = rho/pi * deltaMu * deltaPhi *
                      sum_i L_i(lambda) * max(0,n dot omega_i)
L_combined          = L_direct + L_diffuse
```

with one wavelength-independent `rho = 0.18`. Neither display state nor a
photopic label enters these equations. CR3 evaluates Native15 at the four
plane vertices and the 561 emitted `THREE.SphereGeometry(1,32,16)` vertex
normals. The GPU then interpolates the independently projected RGBY vertex
responses across fixed triangles. The result therefore accepts this declared
tessellated vertex domain and all rasterized RGBY pixels; it does not claim a
separate Native15 evaluation at every fragment.

All 565 vertex responses per scene had exact Native15 additivity. The largest
binary64 projected-RGB difference was `3.637978807091713e-12` absolute and
`7.682613081579062e-16` relative; stored float32 fields passed their declared
hybrid tolerance. Direct input and direct-only response were exact zero at ten
and sixty minutes after sunset, while diffuse up-plane outgoing luminance was
`22.0594338622081` and `0.0117118046431176 cd m^-2`, respectively. The CR3
up-plane diffuse sequence was strictly falling across solar noon, sunset, plus
ten, and plus sixty minutes.

The unchanged Bruneton presentation preserved every CR1 sky pixel outside the
geometry mask, independently confirmed from the twelve persisted PNGs with
zero RGBA-code differences. That same presentation quantized the physically
nonzero plus-sixty-minute surface response to black. The fixed-log diagnostic
reveals it without feeding back into lighting. CR3 therefore accepts the
ambient-light boundary and locates the next defect at Color; it does not accept
the diagnostic mapping, final twilight appearance, atmospheric transport over
long object paths, arbitrary materials, shadows, interreflection, local-Sun
behavior, or production adoption.

## Twilight Display Constraints

Any candidate display response must be:

- global for one scene state;
- achromatic before a separately justified joint gamut operation;
- finite, monotonic, and continuous in value and slope;
- one response across bright daylight and twilight, with no hard
  Bruneton-identity cutoff or named daylight/twilight mode switch;
- source-, geometry-, clock-, camera-, viewport-, and pixel-class independent;
- explicit about whether it acts in scene-linear, luminance, or encoded space;
- traceable from Native15 through signed linear RGB to encoded output; and
- evaluated on a wide sky field, not only a disk or narrow circumsolar crop.

The lane prohibits independent channel curves, per-pixel peak normalization,
image-derived metering, named-condition lookup tables, and a gamma selected
separately for each render. If a common scalar cannot solve the problem, that
is a useful result; the next experiment changes one identified boundary rather
than quietly adding several mechanisms.

## CR4 Predeclared Response

CR4 uses the CR2 total-horizontal photopic receiver illuminance

```text
E = E_direct,horizontal + E_diffuse,horizontal
```

in lux. It is one unit-bearing scalar shared by every pixel. Its accepted
values for the six review scenes are `117240.443278`, `15435.145760`,
`2155.426028`, `1012.664390`, `385.009752`, and `0.204409552` lux. The direct
and diffuse Native15 packets remain the authority; the photopic projection is
only the declared global Color state.

The one candidate family is

```text
g(E; G) = 1 + (G - 1) / (1 + (E / 68 lux)^4)
outputRgb = clamp(brunetonRgb * g(E; G), 0, 1)
```

with the fixed diagnostic row `G = 256, 512, 1024`. `G` is the finite
zero-light gain limit, not a time or scene selection. The function has zero
slope at zero, is finite and value/slope continuous over nonnegative `E`, and
smoothly approaches unit gain as `E` increases. One gain is applied to all
three channels and pixels after unchanged Bruneton; RGB ratios are therefore
unchanged until the explicit final display clamp.

The achromatic proof evaluates only pixels for which no RGB channel reaches
that clamp. Its predeclared maximum cross-product error is `1e-12`; clipped
pixels are counted separately and are not used to claim ratio preservation.

The preservation envelope is a separate gate and never enters `g`. It applies
where `E >= 1000 lux`, derived solely from the receiver scalar, and therefore
includes solar noon, one hour before sunset, ten minutes before sunset, and
sunset in the fixed matrix. Within that domain the maximum allowed RGB-code
difference is `1 + 4 / (1 + (E / 2000)^2)` and allowed RGB-code RMSE is
`0.2 + 0.8 / (1 + (E / 2000)^2)`. The domain threshold selects which frozen
Bruneton relationship is being qualified; it is evaluation-only and is not a
response cutoff. Equal receiver-light values receive the same criterion at
sunrise and sunset.

The immutable replay requests 30 control/candidate panels, 18 amplified
candidate-versus-Bruneton difference images, three diagnostic figures, and one
decision plate. Every one of those 52 images is written before any gate. The
run may accept the diagnostic evidence, but only owner review can select a
final appearance row.

Immutable run `000013-global-achromatic-twilight-sweep` accepts that diagnostic
claim. Its 81-artifact set has SHA-256
`098add701fdb6af73df7b861e27f57c908293619768f77df1240a08ba111e2fa`;
independent verification confirms the full ordered image set and post-image
gate evaluation. Restrained `G = 256` and balanced `G = 512` remain eligible
for appearance review. Strong `G = 1024` is diagnostic-only because its sunset
maximum RGB-code difference `5` and RMSE `1.167215524` exceed the frozen
`4.183769673` and `0.836753935` limits. The accepted run establishes candidate
integrity and eligibility, not visual approval.

## CR4A Sunset Reference Boundary

The paper comparison is a diagnostic for separating spectral shape from
presentation brightness. It does not add a physical oracle. The authenticated
inputs are Eric Bruneton's retained paper PDF for Figure 9 and the losslessly
extracted full-spectral Figure 1 panels already retained under `references/`.

Two presentations must remain visibly and numerically separate:

1. The matched Figure 9 swatch applies that figure's exact `1024 x 576`,
   90-degree horizontal pinhole view, uniformly scales each complete sky model
   to `36 W m^-2` horizontal sky irradiance, adds the transmitted solar disk
   under the same scale, and then uses the declared exponential display map.
   This presentation exposes hue and spatial structure while intentionally
   discarding absolute brightness.
2. The absolute Figure 1 dome applies the exact `256 x 256` equidistant upper-
   hemisphere projection and unchanged Bruneton mapping to unscaled Q30
   Native15 radiance. It adds no display normalization and no solar disk. This
   presentation retains the darkness defect the Color reset must solve.

Our side uses the current 15 wavelength ranges because that is the intended
runtime cache contract. Paper panels retain their original per-model spectral
contracts: the Figure 9 models use their original 3/8/15/11-wavelength paths,
and Figure 1 uses the paper's 40-wavelength comparison path. Every plate labels
that mismatch instead of implying wavelength parity.

Figure 9's sunrise row and Figure 1's low-Sun row are subjective display
renderings. The paper includes no calibrated sunset/twilight measurements for
those rows, independently normalizes the Figure 9 models, and uses different
location, date, atmosphere, source position, and display conditions from the
San Jose control. Consequently no image RMSE, pixel-distance rank, absolute
luminance match, or paper-model winner is valid. Review is limited to the
ordinal presence, placement, smoothness, and progression of the warm horizon
band and blue greater sky.

The source-relative `Z=87` bridge controls projection and Sun elevation. The
actual San Jose sunset at `Z=89.957915` answers the product-facing question.
A geographically oriented dome is retained separately so alignment for the
paper column cannot conceal an azimuth-frame defect.

If the equal-irradiance Native15 swatch retains the expected warm-horizon and
blue-upper-sky structure while the absolute dome is too dark, the next
candidate stays at Color and applies one achromatic exposure before the
unchanged Bruneton exponential. It must remain receiver-light driven, smooth,
finite, global, and common to all RGB channels. The paper's normalization can
bound a diagnostic bracket but cannot become a per-scene exposure lookup. If
the normalized field lacks the expected structure, Color work stops and the
fixed physical boundary is reopened explicitly rather than concealed by a
color curve.

Accepted runs `000016-paper-sunset-reference-inventory` and
`000019-native15-sunset-paper-visual-comparison` select the first outcome. The
actual-sunset Native15 field needs a `5.507140248` uniform factor to reproduce
Figure 9's deliberately normalized 36 W m^-2 presentation, while the
unnormalized dome is much darker. That factor is diagnostic evidence only. It
does not become a candidate value or per-scene target. The observed smooth
warm band, cooler greater sky, and source-relative/geographic agreement are
sufficient to keep the physical scattering boundary closed for CR4B.

## CR4B Pre-Tone Response Boundary

Accepted run `000020-sunset-pre-tone-exposure-bracket` moves the achromatic
operation ahead of the unchanged Bruneton exponential:

```text
g(E; G) = 1 + (G - 1) / (1 + (E / 3 lux)^1.3)
exposedLinearRgb = signedProjectedLinearRgb * g(E; G)
displayRgb = unchangedBrunetonExponential(exposedLinearRgb)
```

`E` is CR2 total-horizontal receiver illuminance. One identical scalar applies
to every pixel and RGB channel, and the same finite, value- and slope-continuous
equation applies across the complete receiver-light domain. The bracket freezes
`G = 2048`, `4096`, and `8192`; their actual-sunset gains are `2.056929394`,
`3.114375119`, and `5.229266569`.

All three rows retain a smooth cool greater sky and warm horizon. The first two
have no black or saturated sky pixels; `G = 8192` has no black sky and a
localized `1.101%` saturated patch around the solar center. `G = 4096` is
selected as the provisional CR4C row because it is the strongest clean row:
it gives a clear blue-gray greater sky and warm horizon without beginning the
sequence with `G = 8192`'s pale, flattened circumsolar patch. This is
diagnostic selection only; it is not an owner-approved appearance, paper
target, bright-range preservation result, or production choice.

## CR4C Chronology Diagnosis

Rejected immutable run `000021-sunset-nautical-pre-tone-sequence` carries the
exact CR4B `G = 4096`, `E0 = 3 lux`, `p = 1.3` response through sunset, plus
10 minutes, and plus 60 minutes. It reproduces the selected CR4B sunset pixels,
uses one shader with only CR2 `E` changing, preserves zero black and zero
saturated sky pixels, and exposes a strongly blue greater sky at plus 60.

The response nevertheless fails the predeclared chronology relationship. The
whole-sky median rises from `0.422471` to `0.434010`, the upper-sky median from
`0.362845` to `0.378573`, and the horizon-band median from `0.562925` to
`0.575270` before all three fall at plus 60. The failure is therefore a narrow
over-amplification of the plus-10 receiver state, not missing spectral color or
display clipping.

One bounded CR4C revision may change only the smooth scalar response shape. It
must continue to use CR2 total-horizontal illuminance, one common pre-tone RGB
gain, one equation over all scenes, and the unchanged Bruneton exponential.
It may introduce a second smooth light-scale term only if the recorded fields
show that one Hill knee cannot jointly preserve the clean sunset, strictly dim
through plus 10, and expose plus-60 blue. It may not independently grade a
scene or use the paper's normalized pixels as a target.

## Accepted CR4C Two-Scale Boundary

Immutable run `000022-cr4c-two-scale-sunset-nautical-pre-tone-sequence`
accepts this bounded diagnostic response:

```text
g(E) = 1
     + 3.5 / (1 + (E / 980 lux)^9)
     + 5300 / (1 + (E / 1 lux)^3)
exposedLinearRgb = signedProjectedLinearRgb * g(E)
displayRgb = unchangedBrunetonExponential(exposedLinearRgb)
```

The first term owns the sunset transition while becoming numerically unit gain
through the bright and low-Sun controls. The second term is negligible above
deep twilight and exposes the much dimmer nautical field. This separation is
necessary because lowering the original single Hill knee enough to restore
chronology leaks large gains into one hour and ten minutes before sunset. The
sum remains one finite scene-global scalar: `g(0) = 5304.5`, `g` approaches
one as `E` increases, `g'(0) = 0`, and `g'(E) < 0` for `E > 0`. Both value and
slope are continuous; no branch or independently selected scene exposure is
introduced.

The sunset, plus-10, and plus-60 gains are `2.493660403`, `4.499312710`, and
`5259.616583`. True encoded-luminance medians strictly decrease in the whole
sky (`0.356071 -> 0.263385 -> 0.176685`), upper sky
(`0.303435 -> 0.224468 -> 0.141093`), and horizon band
(`0.485555 -> 0.368319 -> 0.313239`). All three twilight scenes retain zero
black and zero saturated sky pixels. Their upper-sky blue-dominant fractions
are `94.20%`, `100%`, and `100%`.

This accepts the equation, exact immutable replay, and three-scene chronology
diagnostic only. It does not establish owner-approved appearance, continuous
animation across the large plus-10-to-plus-60 sampling gap, final bright-range
preservation, a paper match, or production adoption.

## CR4D Bright-Range Result

Accepted immutable run `000025-cr4d-bright-low-sun-preservation-replay`
replays solar noon, one hour before sunset, ten minutes before sunset, and
sunset through unchanged Bruneton and the exact CR4C two-scale response. The
legacy receiver-light envelope is unchanged and gates only the first three
daylight/low-Sun controls. Sunset is mandatory report-only evidence because no
owner-approved replacement sunset envelope exists.

Solar noon and one hour before sunset are framebuffer-identical to Bruneton.
Ten minutes before sunset has maximum RGB-code difference `1` and RMSE
`0.434373`, within ceilings `2.850596` and `0.570119`. Sunset exactly replays
CR4C and reports maximum difference `83` and RMSE `53.438003` without being
converted into a preservation pass. The run therefore accepts the qualified
daylight/low-Sun relationship and the honest sunset boundary; it does not
approve sunset appearance.

The current CR4C twilight frames have zero black and zero saturated sky
pixels, so the conditional CR5 display-capacity shoulder is skipped. Adding a
shoulder without a demonstrated capacity defect would introduce an unowned
mechanism. Owner appearance review now decides whether the response may become
the frozen sky/background input to CR6 stellar onset.

## CR4E Owner-Review Presentation Boundary

Accepted immutable run `000027-cr4e-six-scene-new-color-bruneton-stack`
combines the complete six-scene sequence into one review surface. It uses the
accepted CR4D panels from solar noon through sunset and the accepted CR4C
panels at ten minutes and one hour after sunset. New color is always left and
unchanged Bruneton is always right.

This is a layout-only derivative. Each source PNG and parent manifest is
hash-authenticated, each `640 x 400` decoded RGBA region is copied at 1:1 with
no smoothing, and the embedded regions are independently compared back to the
decoded sources with zero changed channels. The run adds labels and borders
outside those regions, not a new display operation or appearance claim. Its
artifact-set SHA-256 is
`b7ead7abfebf71d8aa5466c5ca77dc906caea79c820dafb00944a9ce1e2a2469`.

## CR4F Fine-Cadence Boundary

Accepted integrity-only run `000032-cr4f-fine-twilight-cadence` places sunset
and sunset plus 10, 20, 30, 45, and 60 minutes in one new-color column. The
sunset, plus-10, and plus-60 PNGs are authenticated byte-exact CR4C endpoints.
The other three scenes are fresh Native15/N4/Q30/ozone acquisitions through
one-degree bins 93, 95, and 97 with their own CR2 total-horizontal receiver-
light measurements. All panels precede the stack and are embedded at 1:1 with
zero changed RGBA channels.

The evidence distinguishes the remaining defect from the physical field. At
plus 30 minutes, `E = 20.2939303 lux` produces gain `5.134053`; at plus 45,
`E = 1.34437269 lux` produces gain `1549.808549`. The abrupt visible
brightening therefore follows the current deep-nautical Hill term rather than
a missing spectrum, changed ground mask, or cache/transport discontinuity.
The next candidate may revise only this smooth global response boundary and
must retain daylight/low-Sun preservation and the physical owners. Artifact-
set SHA-256:
`60e01c9cd2b26579f5c83cc0904f29b920493000a497019c5f2b0f6b2cf21042`.

## CR4G Slope-Limited Response Boundary

CR4F proves that the physical field dims smoothly while the accepted CR4C
response brightens it abruptly near one lux. CR4G therefore changes only the
deep-nautical global display response. It replays all six immutable RGBY fields
and masks from accepted runs `000005` and `000032`; it does not rebuild or
interpolate scattering, receiver light, cache data, or geometry.

The rejected continuity control remains the exact CR4C two-Hill response. The
candidate family retains CR4C's sunset term and replaces its cubic 1-lux term
with one finite soft-knee power-law adaptation:

```text
base(E) = 1 + 3.5 / (1 + (E / 980 lux)^9)
x(E) = ln(385 lux / (E + 0.02 lux)) / 0.1
adapt(E;q) = exp(q * 0.1 * softplus(x(E)))
g(E;q) = base(E) * adapt(E;q)
q in {0.70, 0.74, 0.78}
```

`E` remains CR2 total-horizontal illuminance. The `0.02`-lux floor makes the
function finite and continuously differentiable at zero. Its high-light limit
is unit gain. Below the sunset shoulder, the adaptation's absolute logarithmic
elasticity is bounded by `q`, so it cannot reproduce the control's roughly
`2.12` elasticity at plus 45 minutes. Pre-run exact-field replay rejected
`q >= 0.79` because the horizon band rose between plus 20 and plus 30 minutes;
`0.78` is therefore the brightest first-bracket boundary rather than a fitted
appearance target. The three rows bracket only this one slope parameter; every
other equation, field, display constant, and scene fact is shared.

The first claim is deliberately discrete: each candidate must dim strictly at
all six measured scenes in the exact CR4C whole-sky, upper-sky, and horizon
regions without black or saturated sky pixels. Dense response evaluation
proves the declared mathematical slope boundary, but it cannot by itself claim
continuous physical appearance between fields that were not rendered. Owner
review remains necessary before one row is frozen and bright/low-Sun
preservation is rerun.

Immutable run `000033-cr4g-slope-limited-nautical-response-bracket` accepts
that discrete claim. The CR4C control reproduces its plus-30 to plus-45
reversal, while all three candidate rows strictly dim across all six scenes in
all three regions. No candidate frame contains a black or saturated sky pixel.
The maximum deep-response positive logarithmic elasticities are `0.699865`,
`0.739857`, and `0.779849` for `slope-070`, `slope-074`, and `slope-078`.
The independently verified artifact-set SHA-256 is
`fd180391714f77ba2365d7f9ee487f63a61cb664170016f048caf0cc6c24108a`.

The visual result removes the switch-like rebound rather than concealing it:
each candidate now darkens from plus 30 through plus 45 and plus 60 while the
warm horizon and cool greater sky persist. The bracket also establishes the
remaining appearance tradeoff. `slope-070` is the darkest, `slope-078` is the
brightest, and none has been selected automatically. Acceptance does not yet
cover a continuous animation, the bright/low-Sun preservation replay for the
new response, or production adoption.

## CR4H Low-Sun Acquisition Boundary

Owner review makes `slope-078` the current visual favorite without freezing
it. The next unresolved join is not deep nautical twilight: it is the large
sampling gap between one hour before sunset, ten minutes before sunset, and
sunset. CR4H therefore changes no Color design and acquires only the missing
physical evidence at sunset minus 45, 30, 20, and 5 minutes.

Each scene must execute the same Native15/N4/Q30/ozone transport, exact one-
degree cache selection, fixed San Jose camera, and spherical ground endpoint
as CR4F. It retains the signed projected linear RGBY field, R8 hit mask,
4096-direction Native15 receiver field, and CR2 direct/diffuse/total receiver-
light record. One authenticated CR4C sunset image may appear on the acquisition
plate as context; the response used to preview newly acquired fields is not a
candidate claim. CR4H accepts only acquisition and integrity.

Immutable run `000034-cr4h-low-sun-cadence-acquisition` accepts that boundary.
Its exact `(solar elevation degrees, total-horizontal lux)` pairs are
`(+8.029526, 10806.649112)`, `(+5.316880, 6596.110497)`,
`(+3.535053, 3632.919600)`, and `(+0.905991, 1495.612181)`. All four RGBY
fields, R8 masks, 4096-direction Native15 receiver fields, receiver-light
records, and cache identities are retained. The six requested images precede
the gates, D3D11 CPU/GPU replay remains within one encoded code, and the
independently verified 52-artifact set totals `20,624,682` bytes with SHA-256
`92b779126f25e6b0b0bfa43e1efaf6ec684b5776bd708f187959ef977907155f`.
The acquisition does not accept its CR4C preview appearance.

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

## CR4I Anchor-Preserving Smooth-Shoulder Boundary

CR4I keeps the owner-preferred CR4G `q = 0.78` deep response and asks only
whether CR4G's `p = 9` sunset Hill shoulder approaches Bruneton too abruptly.
The current whole-sky medians at one hour before sunset, ten minutes before
sunset, and sunset are `0.749046`, `0.327153`, and `0.356067`; the last sampled
step therefore rebounds by about `8.84%` even though the analytic response is
continuous.

The candidate family adds no new term:

```text
g_p(E) = [1 + A_p / (1 + (E / S_p)^p)]
       * exp(0.78 * 0.1 * softplus(ln(P_p / (E + 0.02)) / 0.1))
```

For each `p` in `{4, 3.5, 3}`, `A_p`, `S_p`, and `P_p` are derived rather
than independently tuned: they make the binary64 response reproduce the exact
CR4G `slope-078` gains at sunset, plus 10 minutes, and plus 60 minutes. This leaves
`p` as the sole free degree of freedom and preserves the reviewed nautical
anchor images. Rounded descriptive values are:

| row | `p` | `A_p` | `S_p` lux | `P_p` lux | gain at -60 min | gain at -10 min |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| restrained | `4` | `3.69133665` | `919.470020` | `364.985830` | `1.0000465` | `1.1183186` |
| middle | `3.5` | `3.80959056` | `893.397592` | `353.520903` | `1.0001777` | `1.1669944` |
| broad | `3` | `4.00372315` | `851.769182` | `336.033700` | `1.0006727` | `1.2327147` |

The executable fixture retains full binary64 values and analytic anchor
residuals. Decoded GPU anchor pixels are expected to be exact and may differ by
at most one RGB code where independent GLSL evaluation rounds differently.
Every curve is finite, smooth, positive, monotonically
nonincreasing with receiver illuminance, and approaches unit gain at high
light. Compared with the control's approximately `0.704` log2-lux-stop
10-to-90-percent shoulder width, the three rows broaden it to approximately
`1.585`, `1.811`, and `2.113` stops. The operation remains one common scalar
on signed projected linear RGB before the unchanged Bruneton exponential.

CR4I separates three decisions:

1. Raw physical field and receiver-light progression is compared only to the
   normalized Koomen/Patat trend inside each publication's valid domain.
2. Display preservation is measured only against unchanged Bruneton. The
   existing CR4D envelope remains a hard gate at one hour before sunset and
   acquired conditions whose solar elevation is at least `+5` degrees; all
   lower-Sun deviations are mandatory report-only evidence.
3. Owner review decides whether a broader row is a more plausible continuous
   join. Passing chronology or a publication trend never selects a row.

The absolute-zero black/saturation gate begins at sunset, matching the
established twilight claim. Earlier scenes retain complete clipping counts as
report-only evidence because unchanged Bruneton can already saturate the solar
disk there; the frozen Bruneton maximum-code and RMSE envelope remains the one
gate on candidate deviation before sunset.

The note that `slope-078` might subjectively benefit from slightly brighter
blue is deliberately not implemented as a channel operation. All CR4I rows are
achromatic and share the selected deep anchors, so the run determines whether
the transported blue merely needs a credible exposure transition. A later
chromatic experiment is justified only if this controlled check leaves a
separable color defect.

Immutable run `000035-cr4i-smooth-bruneton-shoulder-check` rejects this
candidate family while accepting its complete execution integrity. All 68
images precede the gates, all anchor responses remain within one encoded code,
and all twilight clipping gates pass. `p=4` remains closest to Bruneton but
leaves minus-five-to-sunset rises of `8.853%`, `13.311%`, and `4.278%` in the
whole, upper, and horizon regions and misses the minus-30 RMSE ceiling. `p=3`
nearly flattens the whole-sky step (`+0.008812%`) and keeps the horizon falling,
but leaves a `3.835883%` upper-sky rise and misses the preservation envelope at
all three hard-gated pre-sunset scenes. The maximum hard-range difference is
still only one code, making the visual tradeoff explicit without satisfying
the predeclared relationship.

The Koomen/Patat figure supports only the unchanged physical input's broad
twilight trend; it supplies no ranking among these achromatic display rows.
The artifact-set SHA-256 is
`d5d7273e8200bd15070db6bf17d2acefe65908c2762d6e2cff12ca1d859aea38`.
The result closes exponent-only, anchor-preserving Hill broadening. It does not
reject `slope-078`, select a replacement, or resolve the owner's brighter-blue
observation.

## CR4J Six-Column Cadence Presentation Boundary

CR4J is a layout-only view of CR4I's exact `slope-078-p9-control` PNGs. It
places all twelve acquired conditions from minus 60 through plus 60 minutes in
two chronological rows of six native-resolution panels. Labels and gutters
remain outside the copied `640 x 400` source rectangles. Every embedded source
rectangle must decode pixel-identically to its authenticated CR4I parent.

This derivative reruns no Color, transport, cache, or metric and makes no new
appearance or scientific claim. It exists solely to make the current favorite's
complete cadence reviewable at once.

Immutable run `000036-cr4j-slope-078-six-column-cadence` accepts this
presentation boundary. The `3940 x 986` PNG embeds all twelve authenticated
`640 x 400` panels with zero changed RGBA channels, no smoothing, and labels
outside the source rectangles. Its independently verified 30-artifact set
totals `1,446,291` bytes and has SHA-256
`bbbf09fb3ac9ef4073d3286a5aa79eb6af06fd6ba703cfd3923a6e9149f9f3b0`.
The result is not an appearance selection or a new Color/scientific claim.

## CR4K Minimal Deep-Twilight Lift Boundary

CR4K keeps the complete `slope-078/p9` equation and varies only its existing
adaptation pivot. For intended deep lifts `s` in `{0.15, 0.30}` stops,

```text
P_s = 385 lux * 2^(s / 0.78)
```

gives pivots `439.8971145541154` and `502.62200361827666` lux. Because the
deep response is proportional to `P^q` with unchanged `q=0.78`, the candidate
gain ratios approach exactly `2^0.15` and `2^0.30`. The existing softplus knee
fades that change smoothly toward zero as receiver light rises: both rows are
numerically unchanged through the qualified bright range, nearly unchanged at
sunset, partially active at plus 10 minutes, and fully active from plus 20
through plus 60 minutes.

This is one existing degree of freedom, not a new exposure stage. `A=3.5`,
`S=980 lux`, `p=9`, `q=0.78`, `F=0.02 lux`, `w=0.1`, the signed-linear RGB
operation, and unchanged Bruneton exponential all remain fixed. The response
stays global, achromatic, source-independent, finite, smooth, monotonic, and
asymptotically unit gain in bright light.

The owner-supplied nautical-twilight photographs are qualitative appearance
context only. They reinforce a visible blue greater sky, narrow warm horizon,
smooth cool-to-warm vertical transition, and potentially black foreground.
Unknown exposure, white balance, tone mapping, solar depression, atmosphere,
clouds, Moon, local lights, site, and camera prevent any absolute luminance,
hue, pixel, or similarity comparison. They never enter the response or a
numerical gate.

CR4K retains the exact twelve-scene field replay. Objective guards own bright
range inheritance, control reproduction, response math, GPU parity, regional
chronology, and clipping. Visual review asks only whether the smallest lift
makes the existing plus-45/plus-60 blue plainly visible without flattening the
gradient, widening the warm band into a sheet, or introducing a lobe, seam,
gray/brown wash, or bright horizon plateau. A passing row still requires owner
selection; failure cannot infer a chromatic operation.

Immutable run `000037-cr4k-minimal-deep-twilight-lift` resolves this bracket.
All 43 images precede runner gates, the exact `slope-078/p9` control replays,
and both rows retain strict sunset-through-plus-60 dimming with zero black or
saturated twilight sky pixels. The `+0.15` row preserves every sampled scene
through sunset within the frozen one-code/`0.05`-RMSE boundary and is eligible
for owner review. The `+0.30` row differs by at most one code at sunset but has
sky/all-pixel RMSE `0.070225`/`0.052316`; it is therefore rejected despite
passing every other guard. The images retain the same spatial and chromatic
relationships under a smooth common lift. This does not select `+0.15`, relax
the preservation envelope after observing the result, repair the inherited
`p=9` pre-sunset rebound, or authorize a channel-specific correction.

The owner closes the bounded exposure search after reviewing all three exact
cadences: `+0.15` is eligible but not materially different, and `+0.30` is
still only a modest change while missing the preservation gate. The selected
contained sky/background input therefore remains the unchanged
`slope-078/p9` response. Later star work must consume that frozen input rather
than retune it for star visibility.

## Ambient-Lighting Constraints

Diffuse scene light is a physical lighting input, not an exposure substitute.
CR3 establishes that boundary on neutral Lambertian geometry so material color
and artistic lighting do not hide the relationship. It separates direct-only,
diffuse-only, and combined illumination while holding sky presentation fixed.

The intended relationship is:

```text
surface response = direct source contribution
                 + diffuse hemispherical sky contribution
```

Both terms retain unit-bearing spectral or linearly projected values. Display
exposure may change the presentation of the completed frame, but it may not
change the recorded incident irradiance or be used as a scene ambient value.

## Star-Appearance Constraints

The star experiment begins only after a twilight sky candidate is frozen for
review. It tests a cadence across sunset, twilight, and the shared dark cache
state. For stars that remain geometrically visible, the expected relationship
is that brighter catalog members cross useful contrast first and additional
members become distinguishable as the local sky background falls.

Exact visible-star count need not be strictly monotonic when catalog members
move, cross the horizon, collide, or become scene-blocked. The evidence must
therefore retain fixed-member tracks, local background, pre- and post-display
stellar values, collision/visibility facts, and a generated contrast overlay.

## CR6 Stellar Contrast Onset Boundary

Status: corrected execution complete and rejected by independently verified
immutable run `000044-cr6-stellar-contrast-onset`. The machine-readable
authority is
[`cr6-stellar-contrast-onset-v1.json`](../../../scripts/extraterrestrial/color-reset/fixtures/cr6-stellar-contrast-onset-v1.json).

CR6 introduces no new stellar-visibility function. Its only candidate is the
existing physical one-pixel presentation evaluated under the frozen
`slope-078/p9` sky Color. This is a materially new qualification relationship
even though it adds no mechanism: the accepted stellar source and transport
have never been observed through the selected color-reset background.

The stellar source remains the reviewed 500-member BSC V/50 selection in
FK5/J2000 order with its accepted Native15 photometry. Its presentation
identity remains `stellar-one-pixel-presentation-000435-v1`. At each occupied
pixel,

```text
stellarBoundary(lambda,p)
    = 60999.839486002405
    * sum in canonical member order of sourceIrradiance_i(lambda)

transportedStar(lambda,p)
    = wholePixelSceneVisibility(p)
    * viewPathTransmittance(lambda,p)
    * stellarBoundary(lambda,p)

finalSpectrum(lambda,p)
    = skySpectrum(lambda,p) + transportedStar(lambda,p)
```

The final spectrum is projected once and receives the same frozen
`slope-078/p9` pre-tone scalar and unchanged Bruneton exponential as sky-only.
The lowest canonical colliding member owns the screen index, but every
colliding Native15 packet remains in the canonical sum. Geometry rejects
below-horizon or off-viewport members. The existing whole-pixel scene-hit mask
owns object rejection. This increment makes no fractional object-edge claim.

The candidate's runtime visibility factor is exactly one. Local background,
contrast, encoded-code difference, and population count exist only in
evidence. They cannot change a palette value or suppress a member. Time may
enter the geometry-owned stellar transform; it may not select presentation
gain or visibility. Scene id, solar zenith, cache status, source kind,
framebuffer contents, local sky value, catalog magnitude, and star count are
likewise forbidden presentation inputs.

The CPU/GPU final comparison must not share a CPU-projected stellar field.
The GPU path independently projects the transported Native15 stellar packet
through E8, adds that GPU stellar RGB to the GPU atmosphere-only RGB, and
passes the result through the GPU frozen display replay. The CPU path performs
the corresponding CPU projection, addition, and display evaluation. The
active shared celestial consumer gives positive Sun coverage precedence over
the stellar lookup, while the star-only diagnostic omits the Sun by design;
therefore CR6 additionally requires zero occupied stellar pixels under
positive Sun coverage across all eight scenes before claiming equivalence.

The sky input remains exactly:

```text
g(E) = [1 + 3.5 / (1 + (E / 980 lux)^9)]
     * exp(0.78 * 0.1
           * softplus(ln(385 lux / (E + 0.02 lux)) / 0.1))
```

applied as one common scalar to signed projected linear RGB before the
unchanged Bruneton exponential. CR6 may measure newly required receiver state
at plus 90 minutes and immediately below 108 degrees, but it may not alter
this equation or use a stellar result to choose its input.

The exact static cadence is sunset, plus 10, plus 30, plus 60, plus 90, the
last integer millisecond below the 108-degree transition, the next millisecond
above it, and plus 120 minutes. The transition instants are
`2024-06-21T05:24:58.209Z` at `107.99999984592024` degrees and
`2024-06-21T05:24:58.210Z` at `108.00000194253896` degrees. The first must
resolve ready bin 108; the second must resolve the texture-free dark state.
This consecutive-millisecond pair isolates the cache contract while leaving
stellar geometry effectively fixed. The runner recomputes these facts rather
than trusting labels.

All 500 members receive a scene-by-scene ledger. The composition background
is the exact star-free sky-only pixel. A valid star-free 5-by-5 ring median is
also retained as local context but never replaces the exact pixel in
composition evidence. Encoded luminance uses
`Y8 = 0.2126 R8 + 0.7152 G8 + 0.0722 B8`; a floored Weber contrast is
report-only.

There is no accepted psychophysical threshold. Two renderer facts are named:

- encoded onset: the first eligible frame where at least one RGB code differs
  from sky-only; and
- robust onset: the first eligible frame where the maximum channel delta is
  at least two codes, one beyond the permitted CPU/GPU framebuffer residual.

One-, two-, four-, and eight-code counts are all reported so the conclusion
does not depend on concealing threshold sensitivity. None is a human-
visibility or real-camera model.

The fixed cohort is the complete set of members that remain in the viewport,
above the local horizon, whole-pixel scene-visible, and collision-free in all
eight conditions. The rule cannot observe final candidate pixels. At least
eight members are required to support the declared tracks and quartiles;
otherwise the evidence is insufficient. Brightness quartiles use the
candidate-independent geometric mean of transported photopic one-pixel
luminance over the six main cadence scenes.

Objective acceptance establishes only that the existing physical path causes
progressive renderer-resolved contrast: later robust crossings occupy at least
two intervals, the bright quartile's median onset is no later than the faint
quartile's, conditional fixed-member tracks do not regress when their
background and transported signal both favor visibility, and the dark frame
retains brightness and red/blue ordering without exact-white collapse.
Population counts have no target value.

Across the consecutive-millisecond transition pair, projected pixels,
eligibility, collisions, and masks must be exact; robust membership must not
change; and the displayed stellar delta may change by at most one code. The
sky-only pair has the same one-code boundary. A larger sky change is an
upstream dark-cache or frozen-display defect. It cannot be compensated with a
stellar threshold or gain.

All 32 individual images and six figures precede scientific gates. Owner
review at native 1:1 scale remains the appearance authority for plausible
timing, color and brightness variety, collision/horizon artifacts, and an
observable transition seam. Passing freezes this unchanged presentation only
for the static San Jose distant-Sun CR7 input. It does not qualify unsampled
animation, partial object coverage, local-Sun/flat behavior, Moon or planets,
bloom/PSF/sensor effects, a larger catalog, psychophysical visibility, or
production adoption. A rejected presentation may open one separately
predeclared CR6A mechanism only after the evidence localizes the defect.

Corrected run `000044` closes the evidence-integrity questions that invalidated
the prior attempt. Its full palette proof compares 60,120 float32 scalar
values with zero bit/ULP mismatch. Its GPU projection readback covers all
4,000 member-scene records and 272 occupied groups with no set or
representative mismatch. The nine-member fixed cohort has eight robust
crossings after sunset across two intervals, preserves brightness onset order,
and records no conditional regression. The 108-degree pair preserves exact
geometry, collision, mask, and robust membership with at most one code of
display difference. All 38 images precede gates and the independently verified
artifact-set SHA-256 is
`5d36ef15f32e37ef95addf4a3fe38d8ab8ff264c810386876a9d676f3875f2a7`.

The sole failed relation is more specific than “stellar color is wrong.” At
plus 120 minutes, five fixed members are robust, five robust RGB-delta triples
are distinct, no stellar-added pixel is exact white, and visible members show
red, neutral, and blue deltas. However, the predeclared red color quartile is
formed from three near-horizon members whose median encoded color-axis delta
is zero; the blue quartile's median is also zero. The strict `red > blue`
predicate therefore fails even though transported source axes remain ordered.
This rejects CR6 as declared and authorizes one presentation follow-up, but it
does not justify a channel curve, visibility threshold, sky change, PSF, or
transport change.

## CR6A One-Pixel Presentation Calibration Boundary

CR6A changes one presentation-owned value only: a wavelength-independent
multiplier on the existing camera-independent one-pixel calibration. Its rows
are exactly `q = 1`, `2`, and `4`, corresponding to effective
irradiance-to-boundary-radiance scales `60999.839486002405`,
`121999.67897200481`, and `243999.35794400962`.

The current machine-readable input authority is
[`cr6a-stellar-presentation-scale-bracket-v2.json`](../../../scripts/extraterrestrial/color-reset/fixtures/cr6a-stellar-presentation-scale-bracket-v2.json).
The executed v1 authority remains immutable provenance for rejected run
`000045`.

The authoritative replay equation is

```text
finalLinearRgb_q(p) = skyLinearRgb_000044(p)
                    + q * gpuTransportedStarLinearRgb_000044(p)
```

followed once by the unchanged `slope-078/p9` gain and Bruneton exponential.
The scalar commutes with the fixed linear camera-path transport and E8
projection, so this replay is algebraically equivalent to multiplying the
one-pixel boundary calibration before those operations. Catalog irradiance and
spectral ratios remain unchanged; the bracket calibrates only how an
unresolved point is represented by its single raster pixel. The parameter is
global and remains independent of time, scene, solar zenith, cache status,
source kind, pixel, wavelength/channel, sky background, magnitude, star count,
camera, viewport, and framebuffer.

Run `000044` is an admissible rejected parent because its execution and
artifact set are independently verified and the candidate failure occurs only
after the exact fields CR6A reuses. CR6A authenticates that parent before and
after execution, constructs each sparse star RGB field only from canonical
actual screen representatives and the parent authoritative GPU projection,
and records every field, ledger, operation, parameter, tool, and result
identity in the derivation chain. The browser evaluates all three rows over
the full `640 x 400` fields through RGBA32F inputs; an independent CPU replay
is a parity oracle, not the candidate renderer.

CR6 authored its retained final-composite PNGs with the binary64 CPU display
path and used its separately rendered GPU result only for an accepted one-code
parity check. The `1x` independent CPU replay must therefore reproduce all
eight parent images exactly. The GPU-authored `1x` image must remain within one
code of both CPU and parent, and all non-stellar pixels must remain exact.
The two candidate rows must retain no robust stars at sunset, plus 10, or plus
30 minutes; at plus 60 they must expose at least one but fewer than all
occupied pixels, and plus 90 may not lose robust population. Dark frames may
contain neither a saturated-channel stellar pixel nor an exact-white added
pixel. Brightness quartiles retain their order. Color is evaluated only among
members whose displayed increment is robust: their source and display
red-minus-blue axes must retain a positive relationship. Invisible color
quartiles are still reported but do not gate a calibration by equality at
zero. The exact 108-degree geometry and one-code transition continuity remain
mandatory.

Pre-run exact replay gives the bounded review landmarks `(robust +60, dark
peak code) = (6,21)`, `(12,39)`, and `(22,73)` for `1x`, `2x`, and `4x`.
These values justify the bracket width but cannot select a row. The complete
30-image set precedes gates and remains available on rejection. Owner review
at native scale decides whether restrained, stronger, or unchanged
presentation best establishes credible onset. CR6A does not qualify bloom,
PSF, sensor response, arbitrary viewport behavior, a larger catalog,
psychophysical thresholds, unsampled animation, local-Sun/flat behavior, or
production adoption.

Rejected immutable run `000045-cr6a-stellar-presentation-scale-bracket`
rendered all 30 declared images before gates and passed every candidate,
progression, brightness, visible-color, transition, containment, and
derivation relation. Its sole failure was the mis-scoped GPU-to-CPU exactness
gate. Across sunset through plus 90 minutes, the GPU control differs from the
CPU-authored parent in `10`, `2`, `6`, `4`, and `2` RGB channels, each by one
code; the last three scenes are exact. Those are CR6's own recorded CPU/GPU
parity fingerprints. The independently verified 63-artifact run totals
`8,758,270` bytes and has artifact-set SHA-256
`4db7e1ae90bd8af3745f9107a7be7df2bbd4dea1b57186f5e5688f9892f66a0b`.
The v2 rerun changes only the evidence oracle and adds the previously missing
direct CPU-to-parent proof. It cannot alter `q`, a rendered equation, a scene,
or an appearance criterion.

Independently verified immutable run
`000046-cr6a-stellar-presentation-scale-bracket-corrected` accepts this
corrected objective boundary. Its 24 GPU full frames are byte-identical to run
`000045`; the independent CPU `1x` result is exact to all eight CPU-authored
CR6 parent PNGs; and GPU `1x` remains inside the one-code parity boundary. All
other objective gates pass unchanged. At plus 60 minutes, the three rows have
`6`, `12`, and `22` robust pixels out of `32`, and their plus-120 peak deltas
are `21`, `39`, and `73` codes. The fixed-cohort robust color correlations are
`0.987372`, `0.989583`, and `0.965455`, with no dark clipping or white
collapse. The 65-artifact set totals `8,939,566` bytes and has SHA-256
`c27f702e168bc4f7a54da53038b1718c58207b7cb5db5e96cfa294ea649e4dde`.

This accepts the calibration bracket as evidence, not an appearance row.
Owner review rejects `1x`, `2x`, and `4x`. The result therefore closes the
original CR6A bracket without selecting a presentation. It does not by itself
prove whether the shared failure is intensity, point footprint, onset timing,
population, color, or another presentation relationship. CR6B intervenes only
as an independent catalog-roster proof. The owner's subsequent one-pixel,
brightness-only constraint localizes and authorizes CR6C; it does not reopen
footprint, threshold, population, or Color mechanisms. The integrated CR7
sequence remains blocked by the separate spectral and runtime decisions.

## CR6B Exact Brightest-2,000 Catalog Boundary

Status: complete and accepted by independently verified immutable run
`000047-cr6b-brightest-2000-catalog-proof`. CR6B is a roster and provenance
proof, not a spectral, runtime, or appearance candidate.

The sole source is the BSC V/50 TSV with SHA-256
`d79223194f938533b4a4b7d832249d8661cf7adda088a8a0ec44039d3baab759`.
The established parser exposes `9,096` eligible records. The complete ordering
contract is ascending finite `Vmag` followed by ascending HR, with the first
`2,000` records selected. This deterministically begins with HR `2491` at
`Vmag = -1.46` and ends with HR `7474` at `Vmag = 5.17`. The production
500-member roster is an exact ordered prefix. All 2,000 selected members must
remain present; omission, replacement, and spectral clamping are forbidden.

The run writes the exact roster plus complete derivation identities and, before
gates, renders separate all-sky maps for the 500-member prefix and complete
2,000-member roster, a rank-magnitude plot, and one labeled summary plate.
Those figures judge source coverage and roster shape; they do not represent
final stellar appearance.

Four decisions remain deliberately independent:

1. **Catalog roster:** CR6B may accept only source identity, deterministic
   ranking, exact membership/order/endpoints, production-prefix identity, and
   finite unit directions.
2. **Spectral materialization:** the current Pickles policy covers `1,993`
   selected members. It must report HR `868`, `8316`, `1845`, `4163`, `2289`,
   `4846`, and `9004` as seven retained too-red outliers. Their later spectral
   treatment requires its own predeclared boundary and cannot omit or clamp a
   member to make CR6B pass.
3. **Runtime capacity and integration:** a later increment owns texture and
   buffer limits, generation cost, loading, and the replacement seam. CR6B
   leaves the production 500-member runtime byte-identical.
4. **Appearance:** only after the roster, all 2,000 spectra, and runtime
   contracts are accepted may a new image experiment judge density, onset,
   footprint, brightness, or color. CR6B makes none of those claims.

This sequence prevents a visually better or worse frame from silently
changing roster membership, photometry policy, and runtime representation at
the same time. CR6F, CR6G, and CR6H subsequently resolved those three
boundaries; CR7 and CR8 are now complete.

The accepted run writes all four declared figures before gates, proves the
complete production 500-member ID/direction prefix exactly, and accepts every
catalog-selection and containment relationship. Its 33 artifacts total
`2,293,026` bytes and have artifact-set SHA-256
`ce50de53045f1e6f0ef33dcdc2b935a7023d5e28095b3d5f13add4980c370c57`.
At the CR6B stopping point, the Pickles/Johnson policy's supported B-V range ended at
`1.8857631512379314`, so the seven redder members remain catalog members but
received no spectral packet in CR6B. CR6F later supplied their accepted
color-constrained continuum proxies without reopening the roster.

That spectral boundary must distinguish template-color coverage from wavelength
coverage. Native15 still covers the same 15 visible bins; the failure is that
the current 107 templates synthesize only
`-0.2991335514183669 <= B-V <= 1.8857631512379314`, while the seven catalog
targets extend to `2.68`. Interpolation is permitted only inside a valid
bracket. Clamping to the reddest template, silently extrapolating its shape,
dropping a member, or treating a normal M spectrum as an unqualified carbon-
star spectrum is not an accepted solution.

A later predeclared spectral increment must keep the other `1,993` materialized
packets unchanged, retain V-magnitude scaling, produce a finite nonnegative
Native15 irradiance packet with units `W m^-2 nm^-1` for every accepted member,
and demonstrate the declared Johnson B-V relationship. Any added empirical
library or physical model requires source, version, license, file hash,
wavelength coverage, resampling equation, and applicability provenance. This
is still separate from runtime storage and rendered appearance.

## CR6C One-Pixel Brightness Calibration Boundary

The owner has clarified that every unresolved star remains exactly one raster
pixel and relies only on that pixel's brightness for visibility. Light
pollution and Moon illumination remain deferred; San Jose supplies the fixed
summer geometry and cadence only. This rules out a PSF, enlarged footprint,
bloom, halo, or visibility threshold as the next mechanism.

CR6C retains the complete source, Native15 photometry, camera-path transport,
E8 projection, geometry, collision groups, masks, sky field, and accepted
`slope-078/p9` Color. It changes one presentation-owned scalar only:

```text
finalLinearRgb_q(p) = skyLinearRgb_000044(p)
                    + q * gpuTransportedStarLinearRgb_000044(p)
q in the predeclared brightness bracket
```

The first fixed rows were the historical `1x` control, a `16x` reference
candidate, and a `32x` upper candidate. Independently verified immutable run
`000048-cr6c-one-pixel-brightness-calibration` shows that `16x` leaves the
declared HR `1708` plus-30 anchor at one code while `32x` reaches two codes.
Every other integrity and scientific relationship passes and neither candidate
clips. The narrowed replay therefore retains `1x` and `32x` and changes only
the middle row to `24x`. Their effective one-pixel boundary scales are
`60999.839486002405`, `1463996.1476640578`, and `1951994.863552077`.
The scalar is wavelength-independent and cannot observe time, scene, solar
zenith, cache state, source kind, pixel, local background, magnitude, star
count, camera, viewport, or framebuffer. Stellar visibility remains exactly
one; appearance emerges only from addition to the changing physical sky and
the shared fixed Color mapping.

The previous CR6A requirement of zero robust stars through plus 30 minutes is
not retained. At plus 30, solar depression is `4.9954648167966` degrees and
the exact eligible roster includes HR `1708` at `V=0.08`. Sunset and plus 10
remain required star-free controls. Both candidate rows must move that anchor
at least two RGB codes by plus 30, retain progressive sampled population, and
preserve dark brightness/color ordering, clipping guards, CPU/GPU parity, and
the exact consecutive-millisecond 108-degree transition. Two codes remain a
renderer-confidence boundary rather than a human-visibility model. Native
1:1 review owns the actual appearance selection.

CR6C freezes the atmosphere curve so stellar brightness and nautical-sky
brightness are not tuned together. If the star row resolves but the nautical
sky remains too dim, a later separately predeclared atmosphere-only increment
may exercise the explicitly retained wiggle room. CR6C makes no arbitrary-
viewport, display-hardware, 2,000-member, light-pollution, Moon, animation, or
production claim.

Independently verified immutable run
`000049-cr6c-one-pixel-brightness-calibration-narrowed` accepts every declared
gate. At plus 30 minutes, `24x` moves HR `1708` exactly two codes and exposes
three robust pixels while sunset and plus 10 retain none. At plus 60 it exposes
30 robust pixels with peak `87`; at plus 90 all 32 occupied pixels are robust
with peak `228`. The `32x` row adds only one robust plus-30 pixel, no plus-60 or
plus-90 population, and raises the corresponding late peaks to `108` and
`241`. Neither row saturates or reaches exact white. Native-scale review
therefore selects `q=24`, effective boundary scale `1463996.1476640578`, as
the lowest satisfactory row with the greater late-dark headroom. The accepted
65-artifact set totals `8,888,747` bytes and has SHA-256
`bcd129d7484bbec696c8a3877d9822e4a3cdf89e0d17c3e8614909f4ad62c001`.

The accepted atmosphere remains `slope-078/p9`. CR4K's already-qualified
`+0.15` deep-twilight row is the sole first atmosphere candidate if the slight
nautical dimness is pursued, but it is not part of the CR6C selection and must
be evaluated in a separate atmosphere increment followed by a replay of the
selected stellar composition.

## Toggleable View-Presentation Filter Boundary Introduced By CR6D

Status: implemented and accepted in immutable run
`000052-cr6d-toggleable-low-light-stellar-chroma`; moderate `0.65` is the
recommended optional enabled configuration, and physical color remains the
exact disabled state.

Low-light human vision supports a presentation correction without changing the
physical stellar calculation. Controlled low-illuminance observations report
that chroma generally contracts toward neutral as illumination falls, with
hue-dependent residuals and blue/green brightness retention
([Shin, Yaguchi, and Shioiri 2004](https://doi.org/10.1007/s10043-004-0265-2)).
Rod excitation also alters mesopic color appearance rather than preserving an
ordinary photopic RGB relationship
([Cao et al. 2008](https://pubmed.ncbi.nlm.nih.gov/18561973/)). Most directly
for this lane, naked-eye stellar color is estimated to become unavailable near
apparent magnitude `V=3`, even though fainter stars remain detectable
([Vollmer 2026](https://pubmed.ncbi.nlm.nih.gov/41842225/)). CIE 191 supplies
an authoritative mesopic spectral-sensitivity framework for visual performance,
but it is not treated as a complete stellar color-appearance model
([CIE 191:2010](https://www.cie.co.at/publications/recommended-system-mesopic-photometry-based-visual-performance)).

The approximation is the first consumer of a general, stage-aware view-
presentation filter registry. The registry permits later named modes, including
a solar-view mode, without turning physical transport or Color into a catch-all
conditional. Its conceptual stage order is fixed:

```text
physical spectral outputs
  -> spectral-view filters             (future; before spectral projection)
  -> per-source linear RGB projection
  -> source-linear filters             (CR6D uses target=stellar here)
  -> source/sky/scene composition
  -> composed-linear filters           (future; whole composed field)
  -> slope-078/p9 and Bruneton display mapping
  -> display-output filters            (future; presentation-only output)
```

Only the `source-linear` hook required by CR6D may be implemented in this
increment; the other stages are reserved typed boundaries, not speculative
runtime code. A later filter implements only its declared stage. A physically
modeled optical solar filter belongs at `spectral-view` and must apply its
provenance-backed transmission consistently to every affected radiance before
projection. A Sun-only false-color or glare-reduction view is instead a
presentation approximation with an explicit `target=solar`; it cannot make a
physical optical-transmission or eye-safety claim.

Every stage stack is an explicit ordered list, not an arbitrary callback or
shader-injection surface. Each registered filter has a stable id, version,
stage, target, enabled flag, parameter schema, declared inputs and outputs, and
derivation identity. Supported targets are registered semantic owners such as
`stellar`, `solar`, `all-extraterrestrial`, or `whole-frame`, not ad hoc pixel
predicates. An empty registry, or a registry whose filters are all disabled,
is the exact identity path. Stage and list order are semantically significant
and participate in the pipeline identity. Adding a filter, changing its order
or stage, or changing its parameters requires a separately predeclared evidence
increment.

The first configuration contract is:

```text
viewPresentationFilters = {
  version: "v1",
  filters: [
    {
      id: "human-low-light-chroma-v1",
      stage: "source-linear",
      target: "stellar",
      enabled: false | true,
      fullColorMagnitude: 0.0,
      neutralMagnitude: 3.2,
      maximumChromaRetention: selected experiment value
    }
  ]
}
```

`enabled=false` must be byte-exact to CR6C. The toggle is manual configuration;
it does not switch from time, solar angle, background pixels, or framebuffer
state. The registry may expose multiple individually switchable filters or
named configurations, but enabling incompatible modes must fail closed rather
than silently reorder or combine them. Each later mode declares its own target,
stage, compatibility set, and evidence boundary.

For `human-low-light-chroma-v1`, let `s` be the transported linear star RGB,
`Y` its value on the E8 projection's authenticated luminance axis, `w` the
authenticated achromatic RGB direction, and `n` the achromatic RGB having the
same `Y`. For apparent magnitude `m`:

```text
t = clamp((3.2 - m) / 3.2, 0, 1)
h = t^2 * (3 - 2*t)
k = maximumChromaRetention * h
filteredStarRgb = n + k * (s - n)
```

The operation preserves pre-display luminance analytically, remains smooth in
magnitude, retains some color only for the brightest stars, and approaches
neutral at `V=3.2`. CR6D brackets `maximumChromaRetention` at `0.65` and
`0.40`. Accepted run `000052` proves maximum numerical luminance error below
`7e-18`, exact disabled replay and nonstellar identity, and preserved sampled
onset/transition behavior. Native-scale review selects `0.65` as the least
aggressive sufficient enabled state; `0.40` remains evidence, not the
recommendation. The physical-color identity path remains available.

The CR6D filter is forbidden to change catalog membership, source spectra,
transport, position, collision ownership, mask membership, occupied-pixel
count, point footprint, sky RGB, atmosphere, `q=24`, or shared Color. It may
not introduce clipping as a hidden gamut policy. CR6D changes stellar chroma
only. A future Purkinje/mesopic luminance filter or solar mode is a separate
registered filter and experiment because each owns a different perceptual or
instrument responsibility. A later physical filter may transform derived
radiance only at its declared physical stage; no filter mutates upstream source
or transport evidence.

### Mesopic stellar luminance filter introduced by CR6E

Status: implemented and accepted by immutable run
`000054-cr6e-toggleable-mesopic-stellar-luminance`.

`human-mesopic-luminance-v1` is a second ordered source-linear stellar filter,
executed before `human-low-light-chroma-v1`. It consumes authenticated
transported Native15 stellar radiance and one explicit scene adaptation scalar:
the median physical sky luminance over unmasked pixels before stars, exposure,
and Color. It cannot inspect the final framebuffer or alter the sky.

The filter integrates the official CIE scotopic efficiency function
`V'(lambda)` over the Native15 bins with maximum scotopic efficacy `1700 lm/W`,
compares that scotopic luminance `Ys` with authenticated E8 photopic luminance
`Yp`, and smoothly blends their ratio across the declared off-axis mesopic
range `0.005–5 cd/m^2`. The exact equation and strength bracket are owned by
CR6E in the plan. Scaling RGB before the accepted moderate chroma contraction
keeps luminance and chroma responsibilities separate.

The E8 linear-sRGB projection may legitimately contain negative wide-gamut
components. CR6E scales all finite RGB components by one positive luminance
ratio, preserving their signs; it does not clamp or reinterpret them before
the unchanged Color boundary.

This is a standardized spectral-sensitivity approximation, not a complete CIE
191 implementation, temporal dark-adaptation model, retinal point-spread
model, or claim that every star brightens. Stars with `Ys/Yp < 1` dim; those
with `Ys/Yp > 1` brighten. The physical and CR6D moderate paths remain exact
toggle states. Any accepted luminance row must requalify `q=24` and the complete
sampled onset because it intentionally changes apparent stellar luminance.

The owner-approved optional enabled configuration uses
`maximumRodContribution=0.5` followed by CR6D's moderate chroma filter. It is
the least aggressive row that produces useful sampled dark-scene separation:
at plus 60 minutes its peak rises from `74` to `102` codes, while full strength
rises to `126`; in later dark scenes half strength peaks at `246` versus full
strength's `253` without adding robust members. Both candidates preserve
`q=24`, exact one-pixel occupancy, the sky, Color, transition behavior, and
zero saturated/exact-white stellar pixels. Full strength remains an upper
boundary, and both the CR6D moderate and physical-color states remain exact
toggle paths.

## Image-First Experiment Contract

Every increment asks one question and changes at most one responsibility. Each
runner writes its complete requested render set before evaluating appearance or
numeric acceptance gates. A failed appearance gate never suppresses or deletes
an image. If integrity, containment, compilation, or rendering itself fails,
the run preserves every partial artifact and finalizes as failed or
interrupted.

Every image-producing experiment emits:

- individually named full-resolution PNGs;
- one labeled contact sheet that can be reviewed without opening every file;
- the control and candidate in a stable row/column order;
- black, saturation, and gamut/contrast masks when relevant;
- a JSON record tying each panel to scene, physical input, display operation,
  and hashes; and
- a short `progress.json` with first-image and completed-plate elapsed times.

The working target is a first PNG within three minutes and the complete first
decision plate within ten minutes. If an experiment cannot meet that target,
split acquisition from replay and reuse the immutable captured field in a new
run with a complete derivation chain. Do not spend a long run constructing a
large candidate grid before producing the first useful image.

## Fixed Review Scenes

The primary San Jose, sunset-facing matrix is:

| Scene                     | Time                       |
| ------------------------- | -------------------------- |
| Solar noon                | `2024-06-20T20:08:00.000Z` |
| One hour before sunset    | `2024-06-21T02:26:03.503Z` |
| Ten minutes before sunset | `2024-06-21T03:16:03.503Z` |
| Sunset                    | `2024-06-21T03:26:03.503Z` |
| Ten minutes after sunset  | `2024-06-21T03:36:03.503Z` |
| One hour after sunset     | `2024-06-21T04:26:03.503Z` |

The two-hours-after-sunset time
`2024-06-21T05:26:03.503Z` is an additional dark/star control, not a seventh
independently graded scene. Star-onset work adds intermediate cadence and two
conditions bracketing the computed 108-degree cache transition.

The first image loop uses the retained `640 x 400`, 78-degree wide field and a
black ground/foreground unless an increment explicitly introduces neutral
scene geometry. A focused disk view may be diagnostic evidence but never the
sole appearance gate.

## Decision Rule

An increment has only three useful outcomes:

1. **Advance:** its one relationship and integrity checks pass, so the result
   is frozen as the next experiment's control.
2. **Revise this boundary:** images isolate a defect inside the responsibility
   being tested; the next numbered run changes only that mechanism.
3. **Route upstream or stop:** the required input is absent, discontinuous, or
   inconsistent before the tested mechanism. Color and exposure are not used
   to hide that defect.

Visual approval remains the final plausibility decision for sky, ambient scene,
and star appearance. Numerical gates protect invariants and locate failures;
they do not claim that a plausible twilight image has been achieved.

## Explicitly Deferred

- production promotion or compatibility bridges;
- automatic or temporal exposure;
- camera emulation, named cameras, lens glare, bloom, and sensor noise;
- Moon and planet appearance;
- atmosphere, ozone, cache, quadrature, or Q30 retuning;
- animation and cache-swap scheduling beyond static state checks; and
- population-level psychophysical validation.
