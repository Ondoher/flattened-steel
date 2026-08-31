# Normal Mode Test Plan

Status: active supporting acceptance plan, resumed on 2026-08-31 against the
production `BrunetonSourceLuminanceLiftColorDisplayModel` and the closed
one-degree distant-Sun cache baseline. Stage 0 prerequisite, Stage 1 frozen
ledger, and Stage 2A fixed
diagnostic laboratory accepted for their declared data/traceability claims.
Stage 2B research prerequisite `2B-R` was executed on 2026-08-14. Global
research prerequisite `3R-G` was completed on 2026-08-15 after live full-frame
evidence rejected the preserve-`M` candidate. The project subsequently narrowed
the goal to a reasonable global `Normal`; full-view prerequisite `2B-M` is now
optional future image-appearance research rather than a blocker. The referenced Normal configuration
remains active design for the
[Spectral Color-Transform Experiment Plan](spectral-color-transform-experiment-plan.md),
current through 2026-08-31. Historical recorded-input evidence remains valid
only within its declared transport identity; new live acceptance uses the
qualified point-local cache and shared dark state. This plan defines how lane
`A` will be tested as a
population-average human-viewing mode. It authorizes no production change and
does not modify the frozen Bruneton-derived lane `B`.

## Claim Boundary

`Normal` means a referenced population-average visual rendering on a declared
display under a declared viewing condition. It does not mean a literal
reproduction of retinal irradiance, an individual observer, a camera, or a
universal answer independent of display and surround.

The physical renderer supplies wavelength-resolved camera radiance. `Normal`
owns only the observer and display translation:

```text
spectral camera radiance
  -> standard-observer response
  -> adaptation and appearance correlates
  -> display-range lightness/chroma/gamut rendering
  -> display encoding
```

Every stage remains global and source-independent. Direct Sun, circumsolar sky,
ordinary sky, and their spectral sum use the same operations and settings.

## Facts That Bound Expectations

These facts justify relational expectations. They do not define an exact sunset
screenshot oracle.

The established Bruneton comparison is the accepted atmosphere-transport
boundary for this Color experiment. Stage 0 does not independently requalify
the atmosphere against libRadtran, site measurements, or a second transport
model. The optional
[Sun And Circumsolar Physics Expectations](sun-circumsolar-physics-expectations.md)
remain future transport context, not an active gate. Frostbite is retained
below only as subjective and implementation evidence.

1. [ISO/CIE 11664-1:2019](https://cie.co.at/publications/colorimetry-part-1-cie-standard-colorimetric-observers-0)
   specifies the CIE 1931 observer as representative of observers with normal
   color vision for roughly `1` to `4` degree fields at photopic adaptation. It
   specifies the CIE 1964 observer for fields greater than roughly `4` degrees
   at sufficiently high photopic levels without rod participation. The official
   [CIE 1931 2-degree tables](https://cie.co.at/datatable/cie-1931-colour-matching-functions-2-degree-observer)
   are available at `1 nm` steps. Therefore the current 2-degree basis is a
   defensible population reference for a small foveal region, but it does not by
   itself settle wide-field sky or low-light behavior.
2. [CIECAM16](https://cie.co.at/publications/cie-2016-colour-appearance-model-colour-management-systems-ciecam16)
   is explicitly viewing-condition-specific, combines chromatic adaptation with
   perceptual attribute correlates, uses the CIE 1931 observer, and is intended
   for related colors including self-luminous displays. Therefore tristimulus
   values alone are insufficient to define `Normal`; adapting white/luminance,
   background, surround, and display conditions must be declared inputs.
3. [CIE 191:2010](https://cie.co.at/publications/recommended-system-mesopic-photometry-based-visual-performance)
   establishes a mesopic system based on visual performance for night-time
   conditions. The ISO/CIE observer scope above is photopic. Therefore a
   two-hours-after-sunset result cannot be claimed as general human appearance
   from a photopic-only mode; it is both an exposure control and a required
   mesopic comparison.
4. Frostbite reports a zenith Sun luminance of approximately
   `1.69e9 cd/m2`, while common ACES output targets include `100 nit` video and
   `1000 nit` HDR. Even the latter is about `1.69 million` times lower than the
   reported zenith disk luminance. Literal display reproduction is impossible;
   `Normal` must preserve useful appearance relationships while compressing
   absolute range. See pages 26-27 of the
   [Frostbite sky paper](https://media.contentapi.ea.com/content/dam/eacom/frostbite/files/s2016_pbs_frostbite_sky_clouds.pdf)
   and the official
   [ACES tone-scale targets](https://docs.acescentral.com/system-components/output-transforms/technical-details/tone-mapping/).
5. Frostbite's example transmittance changes from approximately
   `[0.925, 0.861, 0.755]` at zenith to
   `[0.0499, 0.004, 0.00004]` at the horizon. Its exact RGB sampling is not our
   spectral model, but the large relative suppression of shorter wavelengths
   justifies expecting the transported low-Sun disk to dim strongly and shift
   toward longer wavelengths before Color.
6. The official [ACES 2 rendering architecture](https://docs.acescentral.com/system-components/output-transforms/technical-details/rendering-overview/)
   separates lightness `J`, colorfulness `M`, and hue `h`, tone-maps lightness,
   and adjusts colorfulness while aiming to preserve hue. Its tone-scale
   requirements are continuous, continuously increasing, and non-asymptotic.
   These are justified structural expectations for lane `A`, even if lane `A`
   ultimately uses a different appearance model or output transform.
7. Frostbite's PBR pipeline applies physical camera exposure before its ordinary
   tone mapping, color grading, and display encoding, and validates absolute
   scale with Sunny 16. See pages 82-86 of
   [Moving Frostbite to PBR](https://blog.selfshadow.com/publications/s2014-shading-course/frostbite/s2014_pbs_frostbite_slides.pdf).
   Exposure can select a useful range; it cannot create chromatic information or
   replace appearance and gamut rendering.

The justified expectation is therefore not one exact RGB triplet. It is that
the measured long-wavelength shift, direct/sky ordering, and spatial gradients
remain traceable through an observer transform and survive display compression
unless the target gamut or peak genuinely cannot represent them.

This experiment accepts the atmosphere's emitted spectra as its physical input.
Stage 0 checks that acquisition and cache boundaries preserve those spectra and
their decomposition; it does not decide whether the atmosphere should have
emitted different values. A credible input still does not by itself qualify
`Normal` appearance.

## Current Data Audit

### Available Today

- The source retains 15 unit-bearing spectral channels and derives disk radiance
  from source irradiance and solid angle in
  [DistantSunCelestialSource](../../../scripts/extraterrestrial/candidate/src/algorithm32/caches/celestial/DistantSunCelestialSource.js).
- Runtime `ShaderState` contains separate 15-channel `pathRadiance`,
  `celestialRadiance`, `preDisplayRadiance`, and `transmittance` values in
  [ShaderBuilder](../../../scripts/extraterrestrial/candidate/src/algorithm32/implementation/ShaderBuilder.js).
- Composition explicitly adds path and celestial spectra before Color in
  [CelestialSpectralComposer](../../../scripts/extraterrestrial/candidate/src/algorithm32/composition/CelestialSpectralComposer.js).
- The geometry-owned upper-sky plan supplies 32 equal-solid-angle directional
  samples in
  [SkyIlluminanceProbePlan](../../../scripts/extraterrestrial/candidate/src/algorithm32/geometries/SkyIlluminanceProbePlan.js).
- Bounded selected-scalar GPU readback already exists for cache evidence and can
  be adapted within the contained experiment.

### Information Lost Or Not Exposed

- The distant celestial cache stores `sourceRadiance * transmittance`, not the
  two operands. That is acceptable for the active Color experiment because its
  required input is the transported celestial spectrum, not a new diagnosis of
  atmosphere extinction.
- The live distant raster reconstructs four coverage rays but looks up the
  transported cache with the Sun-center direction. It does not retain the
  actual-ray transmittance variation across the disk.
- `ShaderState` has the required decomposed spectra, but the ordinary runtime
  API does not expose a bounded readback of all four values at selected pixels.
- The current sky probe collapses its hemisphere to photopic illuminance and
  linear sRGB, while its per-direction diagnostic retains only log photopic
  luminance. It discards each ray's native spectrum and cannot derive an
  adaptation white or verify wavelength-resolved circumsolar behavior.
- The native 15-channel ledger does not by itself establish that its roughly
  `31.33 nm` binning is adequate for CIE integration or a future ozone model.
- No record currently binds adapting luminance, adaptation white, background,
  surround, display primaries/white, display peak/black, or temporal adaptation
  state to each Color result.

The present cache and composed shader state contain the spectra needed by
`Normal`. Stage 0 must expose them without changing their semantics; it does not
need to reconstruct how the qualified atmosphere produced them.

Stage 0 did expose them without a cache change. Immutable run
`000251-normal-color-stage0-preflight` used one atmosphere setup for the three
declared solar times and retained 321 native spectra across 107 selected rays.
All selected rays satisfied the combined binary32 additive-composition bound;
the maximum relative residual was `5.289916935062263e-8`. The ground-blocked
two-hours-after-sunset direct contribution was exact zero, and host acquisition
took `32.498 s`.

Stage 1 then froze the complete Color input matrix in immutable run
`000258-spectral-color-stage1-ledger`: 14 spherical/distant conditions, 13
Flat/local conditions, 1,311 rays, and 3,867 eligible native spectra. The
maximum additive relative residual is `5.794122332978879e-8`; maximum observer
projection disagreement is `0.530308%` in Y and `0.00251805` in CIE 1976 u-v.
This dataset is the fixed input to the component tests below. Its originating
one-time acquisition missed the ten-minute performance target (`877.726 s`),
but Color iteration does not reconstruct those caches.

## Prerequisite: Measurement Sidecar

Do not redesign the production cache first. Add a contained acquisition sidecar
under `scripts/extraterrestrial/` that observes selected rays without becoming a
runtime dependency. Generated data remains under `tmp/extraterrestrial/`.

For every selected disk or sky ray, the sidecar records:

1. spectral-bin definitions and accepted transport/configuration fingerprint;
2. exact geometry ray, visibility, support, and coverage facts;
3. post-transport atmosphere-only `pathRadiance`;
4. post-raster transported `celestialRadiance`;
5. post-composition `preDisplayRadiance` actually presented to Color;
6. host-recomputed `path + celestial` residual;
7. float precision and CPU/GPU provenance for every value; and
8. observer, adaptation, display, and output-encoding configuration identities.

If source boundary radiance, transmittance, or resident-cache stencil values are
already exposed cheaply, retain them as optional diagnostics. Their absence
does not block this Color experiment and does not authorize a cache change.

Use a bounded float readback arranged as fixed groups of native channels; do not
read complete cache fields. Read disk center plus four inside-limb rays at
`0.95` apparent radius: zenithward, horizonward, and both equal-elevation
directions. This exposes the transmittance gradient that the current center
lookup can hide.

Extend the existing 32-ray upper-hemisphere probe for acquisition so it retains
all native spectral channels per direction and a native spectral irradiance
integral. Derive, but do not substitute for those data:

- photopic luminance distribution;
- log-average and percentile luminances;
- adapting-white XYZ/chromaticity;
- hemisphere irradiance and illuminance; and
- provisional field-wide adapting luminance and background values.

The 32-ray hemisphere is an integration quadrature, not a sufficient estimator
of local luminance around the current view, the Sun, or another compact bright
source. Before a scene-derived `Normal` adaptation state is accepted, add and
compare a separate bounded local-luminance measurement. Candidate
representations include a solid-angle-weighted neighborhood centered on the
view and a spectral or tristimulus luminance pyramid with declared angular
support. Preserve the spatial support, weighting kernel, and exclusion or
inclusion of the celestial disk as explicit configuration. This reusable
measurement may later serve local contrast, glare, and camera metering, but it
must not be inferred from the sparse hemisphere quadrature.

The initial isolated laboratory may use a fixed declared adaptation state. A
scene-derived `Normal` configuration may not be tested until the sidecar records
the field information from which that state is derived.

### Spectral-Resolution Check

Before freezing the ledger, evaluate the native-15 observer projection against a
higher-resolution reference using the same source and atmosphere definitions at
selected noon, low-Sun, and night-sky rays. Use official CIE `1 nm` observer data
and explicitly state how source and medium values are reconstructed or evaluated
between native bins.

Record convergence of XYZ, Y, chromaticity, and relevant appearance correlates.
Set tolerances before viewing lane `A` images. If native-15 is inadequate,
retain both:

- the actual native-15 runtime spectrum; and
- a higher-resolution diagnostic reference spectrum.

Do not silently replace runtime evidence with the reference or fit per-channel
corrections to screenshots.

The accepted Stage 0 check treated each native value according to its declared
contiguous-bin-average semantics: radiance was constant inside that bin and was
integrated against the official one-nanometer CIE 1931 2-degree table. It then
compared that result with the runtime's bin-center color-matching weight. Across
all 321 retained spectra, worst relative Y disagreement was `0.535599%` and
worst CIE 1976 u-v distance was `0.00251155`, passing the predeclared `5%` and
`0.005` bounds. Native-15 is therefore adequate for the first lane `A` Color
experiments; this result does not qualify a future ozone spectrum or another
observer basis.

### Established Transport Boundary

The prior Bruneton comparison is accepted as the atmosphere qualification for
this experiment. Do not install or run libRadtran, fit AERONET measurements,
construct a historical-atmosphere uncertainty ensemble, or tune atmosphere
parameters as part of Stage 0.

The sidecar identity remains required only to prove that the value presented to
Color is the sum the established transport path produced. A failed
`path + celestial` reconciliation is an acquisition or composition-boundary
defect. It does not reopen the atmospheric scattering model.

The higher-resolution spectral check is also retained because it tests whether
the 15-channel Color input can reproduce observer integrals. It compares
representations of the accepted transport result; it is not an independent
atmosphere validation.

### No Cache Modification In Stage 0

Do not add a companion transmittance field or alter celestial-cache construction
for this experiment. The Color boundary needs the transported celestial, path,
and composed spectra already present in `ShaderState`.

Use a three-condition preflight: solar noon, sunset minus 10 minutes, and two
hours after sunset. The full matrix does not run until those Color-boundary
spectra, units, identities, and provenance are readable and internally
consistent. Missing upstream source/transmittance decomposition is explicitly
non-blocking.

## Normal Components And Tests

The Stage 2A fixed diagnostic is accepted in run
`000263-spectral-color-stage2-isolated-disk`. It qualifies the isolated input
path, CIE projection, continuous luminance mapping seam, joint gamut operation,
display encoding, analytic-disk renderer, and frozen lane `B` comparison. Its
fixed logarithmic scale is intentionally not the primary `N-P2-100`
configuration. The component sequence below resumes at adaptation and
appearance-model selection; upstream spectral acquisition need not be repeated.

Run `000265-spectral-color-stage2-normal-comparison` rejects the first fixed
referenced candidate. The unchanged official ACES 2/Hellwig 2022 100-nit path
and its prior `0.00029282576866764276` scene scale returned one identical
near-white RGB triplet for all 25 disk spectra. This passes finiteness but fails
the required lightness/chroma distinction. The scale may not be tuned from
these images. Before another `N-P2-100` candidate, define from references how
absolute `cd/m2` input, adapting luminance, adapting white, background, and
surround establish the appearance-model normalization.

### Stage 2B Completion Path

Complete Stage 2 with one accepted fixed `N-P2-100` configuration. Before any
new disk render, select from cited color-appearance/viewing-condition references
and freeze the following unit-bearing inputs: adapting-white XYZ/chromaticity,
adapting luminance, reference or diffuse-white luminance, background luminance,
surround, display black and peak, display white/primaries, and output encoding.
The isolated black plate is presentation geometry and may not be treated as the
observer's adapting field.

Replace the inherited opaque scene scale with an explicit absolute-to-model
bridge. If the selected model expects relative tristimulus values, the candidate
bridge is recorded in the form

```text
XYZ_relative = 100 * XYZ_absolute / Y_reference
```

where `XYZ_absolute` retains the ledger's `cd/m2` basis and `Y_reference` is
derived from the declared viewing condition, not fitted from any Sun sample.
Adapting luminance remains a separate appearance-model input; neither quantity
is an exposure knob. If a selected model uses a different normalization, record
its normative equation, units, and rationale instead of silently adapting this
one.

Execute the remaining work in this order:

1. freeze the absolute-to-display bridge before inspecting new disk plates:
   use `L_lambda` as the resolved disk stimulus, retain `E_lambda` separately
   as the direct-solar context/adaptation metric, and select an
   absolute-sensitive appearance correlate plus fixed monotonic 100-nit map
   that cannot self-normalize the condition sequence;
2. run CIECAM16 and the contained Hellwig 2022/ACES 2 route on identical
   absolute XYZ inputs and fixed viewing conditions, retaining pre-display
   lightness/brightness, chroma/colorfulness, and hue;
3. select one appearance model from numerical/reference evidence without
   averaging outputs or fitting either model to screenshots;
4. map its appearance-lightness coordinate through one continuous, strictly
   increasing display-range function defined by the declared black,
   diffuse-white, and peak anchors;
5. perform one joint hue-aware colorfulness/gamut operation before display
   encoding, retaining signed and pre-gamut values;
6. qualify synthetic neutral, luminance, wavelength, hue, and gamut-boundary
   sweeps before running all 25 eligible disks; and
7. freeze on a declared calibration subset, then obtain the project owner's
   held-out relational review as the designated observer proxy.

Step 1 is complete. The fixed bridge uses visible analytic solar support,
CIECAM16 `Q`, the source-independent logarithmic `Q_0`/`Q_master` mastering
curve owned by the research record, joint hue-preserving appearance-volume
intersection, and two independent binary64 equation implementations before GPU
parity. Continue at step 2 without generating a decision plate until the
reference bridge and synthetic gates pass.

Run `000272-spectral-color-stage2b-reference-bridge` accepts the corrected
fully adapted exact-D65 bridge. Run `000276-spectral-color-stage2b-output-proof`
accepts inverse output-condition CAM16 and joint Rec.709 numerical behavior:
maximum relative XYZ round-trip residual `1.0383068616755186e-15`, neutral RGB
spread `8.881784197001252e-16`, hue error `1.807620719773695e-11` degrees,
continuity distance `0.0000218444446166999`, zero unexplained plateaus, and zero
exact-white disks. Run `000278-spectral-color-stage2b-independent-conformance`
accepts the pinned independent Color.js forward/inverse comparison. Numerical
prerequisites now authorize the nine-row calibration plate. The sixteen
held-out rows remain unpresented until settings are frozen. Immutable run
`000281-spectral-color-stage2b-calibration-plate` generated that centered
nine-row plate with nine distinct float outputs, zero exact-white outputs, and
no gamut-boundary limiting. Exact artifact identity checks confirm that none of
the sixteen held-out rows was display-transformed or presented. Numerical plate
generation did not itself accept or freeze the candidate, and the project owner
rejected the generated plate for insufficient red tones. The diagnostic
localizes the failure to the frozen
`M/Q`-preserving colorfulness rule: it reduced spherical-sunset `M` from
`39.2388` to `3.9422` and Flat/farthest-minus-30 `M` from `48.0293` to `3.8668`,
with zero calibration rows reaching the Rec.709 boundary. The next candidate
must therefore change and requalify colorfulness rendering while holding the
accepted `Q` brightness mapping, spectra, appearance equations, and output
viewing condition fixed. The first preserved-`M` attempt showed that the prior
joint black-origin `Q/M` gamut ray can have no positive Rec.709 intersection
for the Flat/farthest inputs, so that boundary is not retained blindly.

Run `000284-spectral-color-stage2b-colorfulness-candidates` accepts a revised
calibration-only candidate and diagnostic. The candidate preserves CAM16 `M`
and intersects the display volume by reducing only `M` at fixed mastered `Q`
and hue. The diagnostic preserves transported CIE chromaticity at the same
target `Q` before any required same-luminance gamut intersection. The candidate
passed 175 synthetic inputs and all nine calibration rows with maximum hue
error `5.4001247917767614e-12` degrees, maximum continuity distance
`0.000038051830693257405`, zero exact-white outputs, and nine distinct float
outputs. Every warm row has greater red dominance than under the rejected
`M/Q` policy. Subsequent full-frame run `000288` showed that this pointwise
policy drove `328,082 / 391,053` pixels to the display boundary. Research
`3R-G` therefore rejects preserve-`M` as a development candidate; held-out rows
remain sealed.

Stage 2B passes only if this one source-independent configuration remains finite
and continuous, preserves the ledger's warm and lightness relationships until a
declared display/gamut boundary, introduces no unexplained common white
plateau, and passes held-out review on the declared display and surround. The
Sun may reach display peak where the declared rendering requires it; distinct
inputs may not collapse because of an undocumented scale, independent channel
clipping, or numerical rounding.

No new atmosphere qualification or cache work is needed. The active bounded
approximation uses direct-solar `E_v / pi` to drive one global state for every
pixel. It does not claim complete spatial adaptation. The owning experiment
plan defines the global-state table and the receptor-response proof sequence
that now precedes another candidate.

Immutable run `000291-spectral-color-global-state-table` accepts the first of
those steps. All nine calibration states are finite; `E_v`, `L_A`, and CAM16
`Q` remain distinct across the declared visual-state checks; the adaptation
floor is inactive for calibration; and no atmosphere, cache, framebuffer, or
display transform was executed. The former `Q_t` to `J_t` / ACES-coupling step
is superseded. Immutable run `000293-spectral-color-receptor-parameter-proof`
accepts the limited CIE LMS and Naka-Rushton parameter reference, with the
CAM16-derived half-saturation placement explicitly classified as an appearance
choice rather than anatomy. The active step is now the native-15 LMS projection,
one-nanometer convergence, and constructed spectral-metamer proof. Immutable
run `000294-spectral-color-receptor-projection-proof` accepts that step with
exact metamer identity after LMS integration and response, and with a positive
negative-control separation when nonlinearity is incorrectly applied before
integration. Immutable run `000295-spectral-color-receptor-curve-sweep` accepts
the next operating-range step across all 15 native wavelengths and four physical
brightness states. The declared response is finite, monotonic, D65-neutral, and
retains progressive dimming and warmth without a common 99% plateau. It also
predicts near-white receptor responses through sunset minus 30, which remains a
candidate characteristic to test rather than a value to tune away. The complete
measured-spectrum numerical qualification is accepted in immutable run
`000301-spectral-color-receptor-display-proof` (artifact set
`7e2b6dadea5b7f49d81b01b892ef880d073dab7a0e8d9dfd4697b08a2cb876b2`). All
13 gates pass and no measured calibration output is exact white or gamut
limited. Rejected run `000300` identified a blanket plateau-gate defect: a
`0.147%` input difference was below the accepted approximately `0.53%` native
observer-projection uncertainty and was not a material input distinction. The
corrected `0.55%` material-input threshold changes only the proof gate, not the
transform. No review image or held-out display transform has been generated.

#### Prerequisite 2B-R: Reference And Acceptance Research

This prerequisite is complete. It required one focused research record,
reviewed for internal consistency and frozen as a tracked control input. It
uses primary or standards-authoritative sources wherever available and records
the source edition, section, equation or test vector, units, and interpretations
needed to connect the source to this experiment.

The research record must establish:

1. the claim boundary for fixed photopic population-average `Normal`;
2. the selected standard observer and numerical integration convention;
3. the complete fixed viewing condition: adapting white, adapting luminance,
   reference/diffuse-white luminance, background luminance, surround, and the
   relationship among them;
4. the normative bridge from absolute ledger XYZ in `cd/m2` to each candidate
   appearance model, explicitly distinguishing normalization from exposure;
5. the authoritative CIECAM16 and Hellwig 2022 equations or implementations
   and their published/reference test vectors;
6. the canonical 100-nit D65 Rec.709/sRGB-class display black, peak,
   primaries/white, transfer function, quantization, ambient, and surround;
7. the structural form and fixed anchors of the lightness and joint
   colorfulness/gamut rendering, without fitting Sun samples;
8. predeclared numerical tolerances for reference-vector agreement, CPU/GPU
   agreement, finiteness, continuity, monotonicity, neutral stability, hue
   continuity, gamut-boundary continuity, and common-plateau detection;
9. the calibration and held-out observation split; and
10. the lightweight observer-proxy review protocol, including the intended
    display, held-out presentation, relational questions, and explicit project
    acceptance decision.

Every scalar must carry units and provenance. Derived values must retain their
equations and inputs. Where a standard permits multiple viewing conditions or
implementations, the record must state the alternatives considered and the
reason for the fixed selection. Unknowns may not be filled from rendered disk
appearance, lane `B`, Frostbite screenshots, or condition-specific tuning.

The prerequisite passes only when another implementation can construct the
complete `N-P2-100` configuration and its acceptance tests from this record
without making an additional appearance decision. Completing the paper review
alone does not accept a Color transform; it only authorizes the Stage 2B
implementation and numerical comparison. The later human review remains an
acceptance gate and may remain operationally pending while the numerical
candidate is developed.

Research `2B-R` is complete in the
[Stage 2B Normal Reference Research](normal-color-stage2b-reference-research.md),
and authorizes the narrowed direct-disk experiment. CIECAM16 specifies how declared viewing conditions
enter the model; it does not prescribe one outdoor adapting luminance or white.
The official ACES scale is photographic and likewise does not bridge the
ledger's absolute `cd/m2`. For the isolated disk, use wavelength-resolved direct
solar irradiance from the retained radiance and apparent support; an optional
`E_v / pi` equivalent-diffuse-luminance proxy supplies CIECAM16 `L_A`.

#### Optional 2B-M: View-Conditioned Adapting Field

If a later objective requires a general spatial image-appearance model, `2B-M`
requires the pre-encoding composed XYZ
field and deterministic global and spatial adaptation fields defined by
[Global Normal Color-Rendering Research](global-normal-color-rendering-research.md).
This samples accepted transport and adds no atmosphere physics. The first
sky-and-celestial measurement excludes renderer scene surfaces because their
absolute-radiance contract remains unavailable. It does not block the active
reasonable-global `Normal` experiment.

### 1. Spectral Input Integrity

Test unit identity, bin centers/widths, finite/nonnegative physical spectra,
source/transmittance multiplication, path/direct addition, and native/reference
projection convergence. No Color stage may repair a failure here.

### 2. Population-Average Observer

Primary configuration `N-P2` uses the official CIE 1931 2-degree tables and
declared numerical quadrature. Test official table hashes, neutral/equal-energy
behavior, wavelength impulses, linear scaling, and agreement between CPU and
GPU implementations.

Configuration `N-P10` substitutes the CIE 1964 10-degree observer to measure the
importance of the wider sky field. It is a comparison configuration, not a
per-pixel switch between observers.

### 3. Adaptation Inputs

Record every canonical input. For the isolated-disk candidate, derive
wavelength-resolved direct irradiance from the transported disk spectrum and
projected solid angle. Use `L_A = max(E_v / pi, 1e-6 cd/m2)` only as the declared
equivalent-diffuse-luminance proxy, with D65 adapting white, `L_b = L_A`,
`L_w = 5 L_A`, relative `Y_b = 20`, dim surround, and steady-state adaptation.
The old upper-sky gain is not an adaptation model and is not reused.

### 4. Chromatic Adaptation And Appearance Correlates

Evaluate a referenced CIECAM16 configuration and at least one HDR-oriented
appearance configuration such as the simplified Hellwig 2022 route used by
ACES 2. Record lightness/brightness, chroma/colorfulness, and hue before display
rendering. Require neutral stability, finite results across the full ledger,
continuous response, and no source-specific branches.

For primary `Normal`, vary the steady-state adapting condition by observation
using the fixed direct-solar proxy and drive display brightness from CIECAM16
`Q`, not relative lightness `J`. Use one unchanged monotonic `Q`-to-display
function across the entire matrix. This represents the declared fully adapted
observer while avoiding the known cancellation caused by measuring a stimulus
relative to a white derived from that same stimulus. Keep a fixed-reference
`J` rendering only as a diagnostic of transported absolute relationships.

The first comparison chooses a model; it does not average their outputs or tune
either model from screenshots.

### 5. Lightness And Dynamic-Range Rendering

Map the selected appearance brightness coordinate `Q` to the declared display
peak and black for primary `Normal`; diagnostic configurations may retain their
explicitly named coordinates.
Test monotonic sweeps through every retained disk and sky hue direction, with
special attention to values above the current exact-white threshold. Require a
continuous, increasing, non-asymptotic float mapping before the final display
limit.

The physical Sun may legitimately reach the display maximum. Acceptance does
not require it to remain colored at every elevation and adaptation. It requires
that loss of distinction be attributable to a declared display/adaptation limit,
not independent RGB saturation or numerical rounding hidden inside the mapper.

### 6. Chroma And Gamut Rendering

Perform gamut mapping jointly in an appearance/color-volume space. Retain signed
linear RGB diagnostics; do not clamp them before deciding how an out-of-gamut
color is rendered. Test hue continuity, neutral-axis stability, boundary
continuity, and disk/sky chromatic ordering at every observation.

### 7. Display Encoding And Viewing Condition

Begin with one canonical `100 nit`, D65, Rec.709/sRGB-class display target and a
declared surround/ambient condition. Separate rendering from the final transfer
function and quantization. Record float output before encoding and code values
after encoding so transfer or 8-bit plateaus cannot be confused with Color.

Add a `1000 nit` target only after the 100-nit result is stable. A display target
is a configuration, not a new physical rendering.

### 8. Spatial Context

Test in this order:

1. spectral swatches;
2. analytic disk on black;
3. atmosphere-only circumsolar swatches;
4. disk plus recorded center-ray path spectrum;
5. declared interpolation of the measured circumsolar field; and
6. live full-frame reintegration.

Immutable run `000302-spectral-color-local-light-record` accepts the reusable
condition-wide direct-light record (artifact set
`dedb03462344654252096e9879972bfa21a3328ba0b18b5c6db9dfd4bc4cb9c1`). It
materializes the four exact-time records from the accepted Stage 1 ledger and
therefore from direct Algorithm32 acquisition run `000257`; Algorithm32 did not
need to run again. The records retain transported direct spectrum, visible
support, spectral irradiance, `E_v`, `L_A`, exact clock/geometry identity, and
source/atmosphere fingerprints. The full-frame review consumes the matching
record. A generic time-of-day estimate or neighboring condition remains an
invalid substitute.

Immutable run `000305-spectral-color-receptor-full-frame` accepts the centered
noon, sunset-minus-30, sunset-minus-10, and sunset plate as technically
qualified observer-proxy evidence (artifact set
`625e481391af5c6d15aed3d893c6fef4f8994052dc4e0611dc2b8f9920cbc986`). It
retains every composed native-15 pixel before Color, reuses one atmosphere
setup, applies one condition-wide state and one source-independent transform,
and produces no exact-white, gamut-limited, or black pixels. This is not a
positive appearance decision: visual inspection finds a predominantly gray,
low-chroma field and a nearly white disk until only mild warming at exact
sunset. The designated project-owner observer decision remains pending.

Immutable run `000308-spectral-color-macleod-boynton-full-frame` accepts the
same four-frame protocol with the CIE 170-2 separated brightness/chromaticity
bridge (artifact set
`94c1bc77e669e5d84f974a13cf676a0b3644fe37678fd5e0ffcb449b62c79024`).
Exact sunset is substantially warmer, while the wider atmosphere remains gray
and earlier low-Sun disks remain nearly neutral. The run is technically valid
but does not establish a satisfactory `Normal` appearance. It isolates the
remaining deficiency after chromaticity preservation to perceptual opponent
contrast/colorfulness rather than transport, spectral readback, or independent
cone saturation.

Immutable run `000310-spectral-color-fixed-chromaticity-full-frame` (artifact
set `1fa76605894eaf0dceb20da273673baf6ee32f331754c5feccf00439f2aeb5d7`)
then separates that diagnosis from brightness entirely. Every nonzero composed
spectrum retains its CIE 2015 `XYZ_F` chromaticity at a common `50 cd/m2`; the
result is a technical diagnostic, not a `Normal` appearance proposal. The Sun
is modestly warm throughout the four-state sequence and materially warmer at
exact sunset, but the wider field remains nearly neutral. Thus no further cone
sensitivity or wavelength-to-color specification is required. The remaining
reasonable-`Normal` problem is narrower: after standard spectral integration,
use the recorded condition-wide local brightness to select independent RGB
black and white thresholds, then apply one fixed monotonic range shape per
channel across the complete frame. Neutral preservation constrains the three
ranges together; they are not arbitrary grades. This must map absolute
brightness without erasing retained chromaticity at the Rec.709 highlight
boundary. Do not apply nonlinear response per wavelength or use opponent
enhancement to manufacture wider-field color absent from these clear ozone-off
spectra. Run `000309` has the same
numeric output but is superseded because its inherited proof-state label was
not appropriate for a no-appearance-claim diagnostic.

Immutable run `000311-spectral-color-rgb-range-proof` accepts the corresponding
minimal numerical candidate (artifact set
`f7e02614aa4376405c796dc3f7ec85a7e589accf38beedaed1b64dfacada52dd`).
The condition-wide range midpoint is derived rather than fitted:
`L_A * pi / omega_sun`. A common neutral-balanced range is evaluated
independently by the integrated R, G, and B values, using the retained
`n = 0.74` response and reporting its 1%/99% effective crossings. All ten
pre-image gates pass. The candidate is numerically safe but compresses more
chromatic separation than the fixed-luminance diagnostic, so only the unchanged
four-frame atmospheric review can accept or reject its reasonable appearance.

Run `000312-spectral-color-rgb-range-full-frame` performs that review, and the
project owner rejects the candidate completely. Noon is effectively black outside the disk
(`99.864%` effective-black pixels), whereas sunset becomes a bright gray field;
the disk is only mildly warm, and noon through minus 10 lose real brightness
variation. For a fully visible uniform disk, the proposed midpoint is
algebraically equal to disk luminance and therefore normalizes the measured
variation away. Partial support at sunset lowers the adaptation proxy relative
to the visible center and makes sunset incorrectly brighter. The common
saturating curve simultaneously compresses RGB ratios and loses color. The
next proof must keep RGB resolution and standard integration but derive black
and white thresholds independently from local brightness, without dividing
pixel radiance by a value derived from that same pixel class. A fixed monotonic
curve then spans those endpoints uniformly across the frame. Run `000311` is
retained only as proof that the rejected arithmetic is finite and monotonic.

Run `000313-spectral-color-rgb-endpoint-sweep` tests the independently selected
endpoint alternative in one 18-candidate live sweep and finds zero survivors
(artifact set
`6b643097c193be4fbab130637c89fc04bfaed1cf36fffdc6cf60283a3df6dc60`).
The least-bad row recovers a decreasing and materially varying disk-center
brightness and retains numerical warmth without black or saturated pixels.
However, its complete field brightens toward sunset and its independently
calibrated log-channel ranges tint a neutral input by `0.10873` encoded units.
The visual result remains beige/gray. This rejects the per-channel logarithmic
endpoint family, not merely the sampled constants. A subsequent candidate must
map brightness once and preserve or balance RGB chromatic relationships in a
separate linear step; three independent nonlinear channel ranges may not own
both brightness and color.

Run `000314-spectral-color-scalar-rgb-sweep` performs that next test (artifact
set `13bdaf1d65d137e09396c0aa39e2ef5bc7f722682f0c0943fc61c18dcfa65916`).
It establishes the intended structural result: a single scalar brightness map
plus common RGB gain preserves neutral exactly and preserves the measured disk
RGB ratios to floating-point precision, eliminating the former algorithmic
brown cast. Its best row is neither black nor saturated, dims the disk
materially, and retains the fixed-chromaticity diagnostic's warmth. The wider
field remains gray because the accepted clear ozone-off field spectra are
near-neutral, not because this transform equalizes the channels.

Overall candidate acceptance remains pending because every row fails the
declared whole-frame mean-dimming relation; the best row's mean increases from
`0.39804` to `0.55500` while its disk center correctly decreases. Add
pre-transform full-field luminance statistics before deciding this gate. If the
transported Sun-centered atmospheric field itself brightens in the mean toward
the horizon, `Normal` must not reverse that physical relationship merely to
satisfy an assumed scene-brightness sequence.

Run `000316-spectral-color-fixed-exposure-sweep` is the direct control for that
question (artifact set
`d804cd3b5dafa8402235bc8da4ceefaf8e8d4cd8707cd19a0983a69a03c07a05`).
It applies only a fixed scalar scene-linear exposure, clipping, and sRGB
encoding. No local-light or adapting-state value reaches Color, and unclipped
RGB ratios are invariant to `1.11e-16`. The complete 15-degree Sun-centered
field still renders predominantly gray, with only weak sunset warmth before
clipping. Local-brightness adjustment therefore cannot explain all missing sky
color. Before another `Normal` mapping, audit native spectra and projected
chromaticity at spatially named sky pixels and compare the current projection
against frozen lane `B` on identical inputs. Run `000315` is rejected because
an evidence-field naming typo stopped it after acquisition.

The follow-up seam audit finds no material projection collapse: the current CIE
2015 and Algorithm32 CIE 1931 sky projections differ by at most `0.002676` in
CIE 1976 u-v and both retain the expected channel ordering. Run
`000317-spectral-color-fixed-exposure-wide-field` (artifact set
`321997f98335af9f1f2d554db2acc06d46ea517ca2986f002c185e13a9545352`)
then restores the production CIE 1931 projection and changes the review field
from `15` to `90` degrees. The wider blue sky gradient returns under fixed
exposure with no local adaptation. The `15`-degree frame was a circumsolar
diagnostic, not a valid whole-scene color review. Future observer-proxy scene
plates must include enough angular field to contain the wider atmospheric color;
the narrow fixture remains useful only for the disk and near-Sun relationship.

Run `000318-spectral-color-bruneton-captured-field` provides the minimal legacy
control (artifact set
`70a56acf8a752c92ff23d490f14be5050bae426b8055f23ab412253663f1e0c4`).
It invokes the unchanged contained Bruneton colorer's public operation on every
captured spectrum and clearly restores the blue sky. It also yields `[1,1,1]`
at every disk center and `82,500` exact-white pixels. Future `Normal` work must
compare against this complete 90-degree field and preserve its sky color while
isolating one proposed improvement to the white plateau at a time.

Run `000318` is not a sunset-color reference: the orange glow is present in its
warm pre-curve RGB but its independent exponential channels all saturate to
one. Exact sunset has `29,935` exact-white and `81,396` saturated pixels. The
next controlled comparison keeps Bruneton's projection and replaces only the
three channel-wise curve evaluations with one luminance evaluation and common
RGB gain.

Run `000320-spectral-color-bruneton-normal-shader` is rejected as the
authoritative literal Bruneton control (artifact set
`ed996a60b38fe2f7056aa6084cb853dc7253c72da12be8918d4fe1d44cb33f89`).
It executes the mutable contained candidate, whose Color owner contains an
experiment-added sky-illuminance adaptation operation absent from sealed lane
`B`. Its float evidence remains valid for that candidate: it preserves the blue
wide-field gradient but produces `[1,1,1]` at all four
disk centers, `151,407` exact-white pixels, and `239,090` saturated pixels.
Exact sunset has `53,196` exact-white and `81,396` saturated pixels and no
center warmth. It cannot establish what untouched lane `B` or the final
application presentation does. The corrected control must record the sealed
baseline's intermediate linear RGB and Figure-1 output, then separately record
renderer/output-pass presentation. It must also distinguish the project
adapter from Bruneton's official demo, whose exposure, optional white point,
and final display power are not all implemented by the adapter. Runs `000318`
and `000319` remain CPU diagnostics and cannot substitute for that proof.

Run `000325-spectral-color-corrected-bruneton-presentations` supplies that
corrected two-row GPU proof (artifact set
`f034cc7813e9b2fb3c79476d45c271f5d3f78d4c7d794dea48b708328324536c`).
Adding Bruneton's documented default luminance exposure and final display power
reduces exact-white pixels from `151,407` to `59,906`, so the omitted
presentation operations are consequential. They do not restore sunset orange:
all disk centers remain `[1,1,1]` and `191,139` pixels remain saturated. The
next gate is not another appearance curve. It is a named-pixel unit/scale audit
from native-15 radiance through GPU linear RGB and the official luminance
exposure convention. Run `000324` is rejected because uniform refresh reset its
second presentation selection before drawing.

Run `000331-spectral-color-production-gpu-bases` supplies the authoritative
production normal-framebuffer bases (artifact set
`1e106c04b40680d26bcbafe577db51763100a45a74ad5b52ae4cfd5eb9ea6612`).
Unlike the reconstructed controls, the actual production GPU frames show the
expected blue-to-pale-warm-to-gold-to-orange-red sequence. The earlier failure
is therefore not an inherent consequence of Bruneton's production Color path.
Before further `Normal` work, compare production and captured native-15
pre-display spectra plus signed linear RGB on identical named rays and exact
clock states. Run `000331` is the visual base for that audit.

Run `000332-spectral-color-production-gpu-sun-focused-bases` is the companion
disk/circumsolar authority at `481 x 271` and `15` degrees (artifact set
`686e5dee030ff4ff8cadb0bb1cdcb369bd56cc14ddd975038a2f9cc1cf62e324`).
No further `Normal` candidate is reviewable until captured-spectrum replay can
reproduce both this focused set and run `000331`'s wide-context set.

The same lane `A` state applies to all samples. Interpolated previews are not
transport evidence. Ocular glare is initially disabled so it cannot disguise a
Color failure.

Run `000286-spectral-color-stage3-calibration-context` accepts the first
calibration-only direct-sample context plate for the preserve-`M` candidate. It
uses one condition state for each disk, center composition, center path, and
eligible circumsolar path spectrum, with no interpolation. The twelve
circumsolar rays appear as directional sectors at `0.5`, `1`, and `2` degrees;
ground-blocked sectors are hatched rather than replaced. All 132 transformed
quantities are finite and bounded, with zero exact-white samples and maximum
recorded spectral composition residual `5.3887837850900735e-8`. This satisfies
the calibration presentation form for steps 3 and 4 above but awaits
observer-proxy contextual review. It does not authorize held-out rows,
continuous-field interpolation, or live reintegration.

The project owner rejected that sparse-sector presentation as an answer to
spatial context and clarified that Color must not separate the solar disk from
anything else in the rendered view. Immutable run
`000288-spectral-color-stage3-full-frame-context` therefore captures three live
San Jose spherical/distant calibration frames at sunset minus 60 minutes,
minus 30 minutes, and sunset. It exposes the GPU's already-composed
`preDisplayRadiance` over a centered `481 x 271`, 15-degree field, then applies
one condition-wide preserve-`M` reference transform to all `391,053` pixels.
There is no Sun mask, overlay, enlargement, or source-specific Color branch.

The run is accepted as integration and review evidence, not as acceptance of
the candidate. No pixel is exact white, and the two fully visible center pixels
reconcile with the selected-ray ledger within `0.0008551` relative. Exact
sunset reports a `0.074411` live-raster versus mathematical-center divergence
caused at the horizon/support boundary instead of pretending those samples are
identical. More importantly, `328,082` pixels hit the fixed-`Q` colorfulness
boundary: `70,595` at minus 60, `127,303` at minus 30, and `130,184` at
sunset. The resulting near-uniform atmospheric fields expose a full-frame
weakness that the isolated disk and sparse-sector plates could not establish.
Observer-proxy review must decide whether to reject or revise the candidate;
held-out rows remain sealed.

### 9. Mesopic Night Configuration

Configuration `N-M` uses the two-hours-after-sunset horizon-context, hemisphere,
and zenith spectra. It introduces a referenced mesopic response only after the
photopic static pipeline is understood. Compare `N-M` with `N-P2` on identical
spectra and display settings to isolate rod/cone response from exposure and tone
mapping.

No pixel chooses photopic or mesopic behavior from its own luminance. The mode
uses one declared observer adaptation state derived from the viewing field.

### 10. Temporal Adaptation

Temporal adaptation is not part of the first `Normal` candidate because Stage 2
assumes the observer is already fully adapted in luminance to each measured
local field.

After static noon, sunset, and night states pass, replay the retained sequence in
chronological order with explicit dwell times and an initialized observer state.
Record adaptation state independently from scene time. Also replay isolated
step changes to expose instability or pumping. Temporal adaptation never changes
the physical ledger.

Treat temporal exposure smoothing as an optional animation/state feature for
interactive verisimilitude, not as the operation that makes a static low-light
render valid. The fixed Bruneton Figure-1 coefficient remains the baseline;
one separate global exposure factor may be derived from
`LocalLightLevelCalculator.adaptingLuminanceProxy` and applied immediately for
a static state. The production calculator now exposes `modifyExposure` to
compose the unchanged baseline with such a caller-supplied positive achromatic
factor; it deliberately does not select the factor. Interactive playback may
smooth that factor in logarithmic
exposure-value space, with independently declared bright- and dark-adaptation
time constants. This smoothing changes only the rate at which viewer exposure
approaches its target: it never changes atmosphere, source radiometry, cache
contents, raster response, or the physical ledger. Deterministic tests and
captures must bypass the animation and use an explicit fixed exposure or the
instantaneous target. Do not restore the abandoned sky probe or encode source,
star, or time-of-day branches in this state.

### 11. Ocular Scatter And Glare

Glare is necessary for a later complete naked-eye appearance of an intense Sun,
but it is not part of the first Color acceptance. When introduced, it consumes a
denser angular radiance field and a referenced population-average ocular point
spread/scatter model. The current sparse circumsolar samples are not sufficient
to qualify it; acquisition must be expanded before that stage.

### 12. Observer-Proxy Visual Review

After the numerical and reference gates pass, evaluate the primary and selected
comparison configurations with the project owner acting as the sole designated
observer proxy. Use the intended target display and surround when practical and
record the actual conditions. Ask predeclared relational questions rather than
asking the proxy to reproduce an RGB value:

- Does the low Sun become progressively dimmer and warmer without unexplained
  discontinuities?
- When the disk is visible, are its relationships to the measured circumsolar
  field explainable? Its disappearance is not independently a failure.
- Does the noon-to-sunset-to-night sequence remain plausible as one observer
  mode rather than a collection of independently graded images?
- Does the two-hours-after-sunset sky remain usable without forcing sunset onto
  the white plateau?

Tune only on the declared calibration subset, then evaluate unchanged settings
on held-out observations. Retain the proxy's decision and notes. Explicit proxy
approval accepts the perceptual development gate; rejection returns the
configuration to Color work. This review is not a population study and may not
be reported as population validation or a universal psychophysical result.

## Required Evidence Views

For every configuration and observation retain:

- native spectrum and source/path/direct/total decomposition;
- exact-ray and resident-cache comparison;
- XYZ/Y and chromaticity;
- observer cone/tristimulus response;
- adaptation inputs and state;
- appearance lightness, brightness, chroma/colorfulness, and hue;
- rendered display-light values before gamut and encoding;
- signed and gamut-mapped target RGB;
- encoded/quantized output;
- disk and circumsolar spatial sample identity; and
- lane `A`/frozen lane `B` paired output from identical physical input.

Plots must show spectral overlays, stage-by-stage disk/sky trajectories, tone
curves at the actual sampled hues, and spatial swatches. A screenshot without
the row identities above is not evidence.

## Configuration Matrix

Run configurations serially and change one concern at a time:

| ID | Observer/adaptation | Display | Purpose |
| --- | --- | --- | --- |
| `N-P2-100` | CIE 1931 2-degree, fixed photopic state | 100 nit | Primary static `Normal` candidate |
| `N-P10-100` | CIE 1964 10-degree, same photopic state | 100 nit | Wide-field observer sensitivity |
| `N-P2-FIELD-100` | CIE 1931, hemisphere-derived static state | 100 nit | Test measured viewing-field adaptation |
| `N-M-100` | Referenced mesopic state | 100 nit | Two-hours-after-sunset human-view comparison |
| `N-P2-1000` | Same as primary | 1000 nit | Isolate display dynamic-range effects |
| `A-CAMERA-MANUAL` | Manual physical camera exposure; no auto meter | declared target | Separate photographic comparison |
| `B-BRUNETON` | Frozen current implementation | current target | Historical comparison, never tuned |

Do not run their Cartesian product. `N-P2-100` must first pass the component
ladder. Each later configuration changes only the named observer, adaptation,
display, or camera concern.

## Acceptance Logic

`Normal` advances to live atmosphere only when:

- acquisition exposes and reconciles every required Color-boundary spectrum;
- geometry-blocking and `path + celestial` composition identities pass as
  data-path integrity checks;
- native spectral resolution has a bounded, recorded observer-projection error;
- official observer/reference calculations pass focused self-verifying proofs;
- adaptation inputs are measured or explicitly fixed, never implicit;
- direct, circumsolar, night, and composed spectra use identical Color stages;
- warm spectral relationships remain traceable until a declared gamut/display
  boundary;
- lightness mapping is continuous and monotonic without the current numerical
  white plateau;
- configurations differ for explained observer/display reasons rather than
  condition IDs; and
- the designated observer proxy explicitly finds the held-out sequence credible
  enough to justify reintegration.

If numerical gates pass but visual review fails, retain the evidence and reject
the configuration. Do not tune physical transport, ozone, disk brightness, or
individual observations inside Color.
