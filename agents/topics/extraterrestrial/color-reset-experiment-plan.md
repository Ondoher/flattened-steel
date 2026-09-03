# Color Reset Incremental Experiment Plan

Status: closed through CR8 by accepted immutable run
`000065-color-reset-qualification`. The detailed chronology below preserves
the intermediate accepted, rejected, skipped, and superseded decisions; it is
not current implementation instruction. Production adoption is owned by the
[Production Color Reset Implementation Plan](../algorithm32/production/color-reset-implementation-plan.md).
Remaining cross-surface disposition is owned by the
[production closeout plan](../algorithm32/production/color-star-cache-closeout-plan.md).

CR0 through CR3 are accepted and CR4's diagnostic execution was accepted
without an owner-selected appearance row. CR4A and CR4B are complete.
The authenticated paper inventory is accepted by immutable run
`000016-paper-sunset-reference-inventory`, the matched Native15/Q30 comparison
by `000019-native15-sunset-paper-visual-comparison`, and the single-scene
pre-tone exposure bracket by `000020-sunset-pre-tone-exposure-bracket`.
`G = 4096` was selected as the strongest clean CR4B diagnostic row. Its first
three-scene replay is preserved by rejected immutable run
`000021-sunset-nautical-pre-tone-sequence`. Accepted immutable run
`000022-cr4c-two-scale-sunset-nautical-pre-tone-sequence` then changes only the
smooth response shape and restores strict sunset-to-nautical dimming with no
black or saturated twilight pixels. Immutable run
`000025-cr4d-bright-low-sun-preservation-replay` accepts the daylight and low-
Sun Bruneton preservation replay. Immutable presentation run
`000027-cr4e-six-scene-new-color-bruneton-stack` now supplies the requested
six-row owner-review stack with the new color on the left and unchanged
Bruneton on the right. Accepted integrity-only run
`000032-cr4f-fine-twilight-cadence` adds exact plus-20, plus-30, and plus-45
minute Native15/N4/Q30/ozone acquisitions between the authenticated CR4C
endpoints. It exposes a sharp plus-30 to plus-45 brightening at the current
response's 1-lux nautical term. Accepted immutable run
`000033-cr4g-slope-limited-nautical-response-bracket` replaces only that term
in three replayed response rows. All three rows strictly dim across all six
sampled scenes and all three sky regions with zero black or saturated sky
pixels. At that stage owner review identified `slope-078` as the visual
favorite, with a possible preference for slightly brighter visible blue.
CR4H acquired the missing pre-sunset cadence fields. Rejected
immutable run `000035-cr4i-smooth-bruneton-shoulder-check` then tested three
anchor-preserving broadenings of the same sunset shoulder. The broadest row
nearly removes the whole-sky minus-5-minute-to-sunset rebound, but none clears
both the frozen Bruneton envelope and all-region chronology. The tested
single-Hill broadening is therefore closed without selecting a replacement.
Accepted presentation-only run
`000036-cr4j-slope-078-six-column-cadence` now places all twelve exact
`slope-078` frames in one native-resolution 6-by-2 review grid.
CR4K immutable run `000037-cr4k-minimal-deep-twilight-lift` then rendered the
control and `+0.15`/`+0.30`-stop pivot-only rows. The complete run is rejected
because the `+0.30` row narrowly exceeds the predeclared sunset RMSE ceiling;
the `+0.15` row passes every gate. Owner review finds neither lift materially
better and closes the exposure-tuning line without a change. The existing
`slope-078/p9` control is retained as the frozen twilight display input;
unsampled continuity acceptance remains outside the static evidence.
CR6 stellar contrast onset has executed twice. Sealed run `000043` exposed an
evidence-oracle defect: its CPU screen projection owned candidate membership
and its canonical palette proof did not cover the complete palette. Rejected,
independently verified immutable run `000044-cr6-stellar-contrast-onset`
repairs those boundaries and renders the complete 38-image set. It proves the
complete 60,120-scalar palette bit-exact, covers all 4,000 GPU member
projections, retains a nine-member fixed cohort, and passes every declared
integrity, causality, progressive-onset, transition, and no-regression gate
except the dark red/blue quartile check. That check compares three red members
whose median displayed delta is zero with a blue quartile whose median is also
zero. The run therefore localizes a one-pixel presentation/quantization
question rather than a sky, geometry, cache-transition, collision, transport,
or evidence-integrity failure. Its artifact-set SHA-256 is
`5d36ef15f32e37ef95addf4a3fe38d8ab8ff264c810386876a9d676f3875f2a7`.
CR6A is objectively accepted by independently verified immutable run
`000046-cr6a-stellar-presentation-scale-bracket-corrected`. Its complete
`1x/2x/4x` image set is byte-identical to rejected diagnostic run `000045`,
while the corrected oracle proves exact CPU-to-parent control replay and the
unchanged one-code GPU boundary. Every candidate, onset, color, transition,
containment, and image-order gate passes. Appearance selection remains an
explicit owner decision. Owner review rejects all three rows, so no stellar
presentation is selected. The global scale-only family closes as useful
diagnostic evidence under that earlier target. The later owner clarification
that unresolved stars must remain one pixel and rely only on pixel brightness
explicitly authorizes CR6C's corrected brightness-only calibration boundary.
CR6B catalog-only proof is accepted by independently verified immutable run
`000047-cr6b-brightest-2000-catalog-proof`. It proves the exact 2,000 brightest
eligible BSC V/50 members without materializing a replacement spectral catalog,
changing the runtime, or making an appearance claim.
CR6C is complete. Independently verified immutable run
`000049-cr6c-one-pixel-brightness-calibration-narrowed` accepts the narrowed
`1x/24x/32x` bracket, and native-scale review selects `q=24` as the lowest
satisfactory fixed-viewport one-pixel brightness calibration. The accepted
`slope-078/p9` atmosphere remains unchanged.
CR6D is complete. Independently verified immutable run
`000052-cr6d-toggleable-low-light-stellar-chroma` implements the minimal
stage-aware registry and its first source-linear stellar filter. Every gate
passes; the disabled row exactly replays CR6C, while both enabled rows preserve
linear luminance, `q=24`, one-pixel occupancy, onset, transition, sky, and
Color. Native-scale review recommends the moderate `0.65` row as the enabled
state while retaining physical color as the exact toggle-off path.
CR6E is complete. Independently verified immutable run
`000054-cr6e-toggleable-mesopic-stellar-luminance` adds the ordered CIE-
scotopic, sky-adapted stellar luminance option. Both prior toggle paths replay
exactly, all objective gates pass, and the owner approves half strength `0.5`
as the least aggressive useful optional state while full strength remains an
upper boundary.
CR6F and CR6G accept the complete 2,000-member Native15 materialization and
bounded runtime package in independently verified runs `000055` and `000057`.
CR6H run `000058` rejects the expanded appearance because none of the added
1,500 members becomes robust under accepted `q=24`; closure therefore retains
the accepted 500-star appearance. Owner direction to wrap the lane accepts
CR7's objectively green static integration in run `000062`. CR8 is complete
and accepted by independently verified run `000065-color-reset-qualification`.
It exactly regenerates the accepted B1 score and figures, preserves basic
Bruneton as a distinct selectable test Color path, and replays all CR7 images.
Immutable run `000005-six-scene-visual-baseline` remains the complete
shape-matched visual and numerical control, immutable run
`000007-available-light-inventory` is the accepted receiver-light authority,
and immutable run `000011-neutral-geometry-ambient-proof` is the accepted
neutral-scene lighting boundary. The contained two-scale pre-tone response is
diagnostic candidate code only; production remains unchanged.

The [Color Reset Design](color-reset-design.md) owns responsibility boundaries,
fixed inputs, scene definitions, and candidate constraints. This plan owns
execution order and current progress. It supersedes the former
[Spectral Color-Transform Experiment Plan](spectral-color-transform-experiment-plan.md)
as the active execution authority while preserving every earlier run as
read-only evidence.

## Objective

Reach visible, reviewable progress in small steps while preserving the
qualified daytime and physical-scattering baseline. Each increment answers one
question, produces a complete labeled image plate, and ends with an explicit
advance/revise/stop decision before the next mechanism is introduced.

## Run Namespace And Evidence Rules

Every experiment receives one new folder:

```text
tmp/extraterrestrial/color-reset/runs/NNNNNN-descriptive-kebab-slug/
```

This lane has an independent six-digit sequence beginning at `000001`. It uses
its own `.last-run-number` and `.run-allocation-lock`; it never fills gaps,
reuses a number, manually selects a number, or nests a numbered experiment
inside another. A retry or derived comparison is another experiment and gets
the next number.

All other rules in
[Immutable Run Records](stage-12-implementation-topic.md#immutable-run-records)
remain mandatory. Seven initial records exist before calculation or rendering,
the run finalizes once, and `artifact-manifest.json` is written last. Prior
runs and historical evidence are read-only. Pre-color-reset generated material
now resides in the verified
[archive set](../../../archives/extraterrestrial-pre-color-reset-20260831/README.md);
restore or derive a required artifact into a new color-reset run rather than
recreating an old live path. Every derivative records parent artifact, schema,
hash, operation/equation, implementation/tool identity, material parameters,
compatibility identity, and result identity.

Contained source lives only under `scripts/extraterrestrial/color-reset/`.
Generated runs, browser profiles, bundles, captures, reports, logs, and
intermediates live only under `tmp/extraterrestrial/color-reset/`. Production
source is directly inventoried before and after each run and must remain
byte-identical. Focused self-verifying runners are used; no experimental
unit-test tree or test-framework dependency is created.

### Render-before-gate rule

Every requested image is rendered and written before appearance and metric
gates are evaluated. A rejected candidate still retains its complete plate.
Only an integrity or rendering failure can prevent the full set; partial
output is then preserved in the failed/interrupted run.

### Progress-time rule

- target first PNG: at most three minutes after the run initializes;
- target first complete decision plate: at most ten minutes;
- publish stage timestamps to `progress.json`; and
- if either target is missed, the next run splits expensive acquisition from
  fast immutable-field replay before expanding the experiment matrix.

## Fixed Controls

- physical input: current one-degree point-local cache, Q30 transport,
  spherical ground, Native15, and shared post-108-degree dark state;
- display control: unchanged production Bruneton;
- live comparison: current `BrunetonSourceLuminanceLiftColorDisplayModel`;
- primary scenes: solar noon, sunset minus 60 minutes, sunset minus 10 minutes,
  sunset, sunset plus 10 minutes, and sunset plus 60 minutes;
- supplemental dark control: sunset plus 120 minutes; and
- first viewport: sunset-facing `640 x 400`, 78-degree vertical field.

No increment changes cache spectra, transport, ozone, source radiometry,
stellar radiometry, geometry, Q30, or the B1 calculation.

## Incremental Work Plan

### CR0 - Reproduce two controls quickly

Status: complete and accepted by immutable run `000004-control-smoke`.

Question: can the new lane reproduce trusted current output before it changes
Color?

Render solar noon and sunset plus 60 minutes through:

1. unchanged Bruneton; and
2. current production source-luminance lift.

Required images are four individual PNGs, one two-by-two contact sheet, and an
absolute framebuffer-difference image for each pair. Retain current cache,
shader, Color, scene, and protected-source identities.

Judge success by:

- both scene pairs render and are labeled correctly;
- the Bruneton panel executes through a byte-verified snapshot of the current
  production closure with the exact current fixture and cache identities;
- the current production lift retains that same-run Bruneton solar-noon result
  within the existing one-code bright-scene tolerance, with byte identity
  preferred;
- the candidate/control difference is localized and numerically recorded;
- production inventories are unchanged; and
- the first PNG and complete plate meet the progress-time targets.

This step is an infrastructure and reproduction gate, not an appearance
acceptance. If it fails, repair the lane or reproduction seam before designing
a candidate.

Accepted result:

- all four control panels, the labeled contact sheet, and both absolute-
  difference images were written before gates;
- the first PNG completed in `12.007` seconds and the plate in `20.907`
  seconds;
- unchanged Bruneton and the production lift were framebuffer-identical at
  solar noon: zero differing pixels and zero RGB-code RMSE;
- unchanged Bruneton quantized the plus-60-minute frame to black, while the
  current production lift exposed `148,973` nonblack pixels from the same exact
  cache and transport;
- the Z14 and Z100 exact caches remained resident and identity-preserved across
  Color replacement; and
- production inventories, contained implementation closure, served Three
  closure, runtime health, D3D11 backend, ground endpoint, and artifact hashes
  passed.

This accepts only the CR0 infrastructure/reproduction relationship. It does
not accept the current twilight appearance. Earlier runs `000001` through
`000003` are sealed failed setup/gate attempts and make no result claim.

No archived framebuffer has CR0's current W27/Q30, fixed `640 x 400` camera,
and black-ground shape. CR0 therefore makes no false prior-pixel replay claim:
its reproduction authority is the exact current source/cache/fixture identity,
while the same-run solar-noon comparison gates the production lift's declared
bright-scene identity. CR1 will freeze the first shape-matched framebuffer
control for later replay experiments.

### CR1 - Establish the complete visual baseline

Status: complete and accepted by immutable run
`000005-six-scene-visual-baseline`.

Question: what is visibly wrong across the agreed scene sequence before a new
operation is introduced?

Render all six primary scenes plus the supplemental dark control. Each scene
gets stable rows for unchanged Bruneton, current production lift, a
pre-display luminance heatmap, and black/saturation masks. Produce individual
images, one chronological contact sheet, and a small plot of field luminance
percentiles and disk/horizon/zenith samples.

Judge success by completeness and diagnosis, not beauty:

- every requested image exists even when current output is implausible;
- the six primary scenes are ordered and use exact fixed instants;
- raw/linear diagnostics agree with the displayed panel identities;
- daylight/low-Sun differences from Bruneton are explicitly counted;
- twilight defects are described by location, luminance, chromaticity, and
  clipping rather than by a new correction; and
- the dark state is a valid installed shader result, not a failed cache.

CR1 freezes the image and numerical control used by later replay runs.

Accepted result:

- all 28 stable scene panels, the chronological contact sheet, the luminance
  plot, seven full-resolution raw RGBY fields, and seven R8 scene-hit masks
  were written before gates; the complete image set contains 30 PNGs and the
  browser uploaded 44 declared artifacts;
- the first PNG completed in `12.527` seconds and the decision plate in
  `56.180` seconds;
- all four panels shared with CR0 replayed byte-for-byte, all scene-hit masks
  were identical across the two display controls and diagnostic renderer, and
  the installed two-hours-after-sunset dark state produced an exact zero field
  and black display;
- solar noon, one hour before sunset, and ten minutes before sunset were
  framebuffer-identical between unchanged Bruneton and the production lift;
  sunset differed by at most one code with RGB-code RMSE `0.0513`;
- at ten minutes after sunset the current direct-source brightness proxy was
  exactly zero even though raw sky luminance had median `232.956 cd/m^2`,
  horizon median `190.769 cd/m^2`, and zenith probe `63.4161 cd/m^2`; applying
  the production dark lift saturated `53.521959%` of sky pixels;
- at one hour after sunset the same proxy remained exactly zero while raw sky
  luminance had median `0.127753 cd/m^2`, horizon median `0.307036 cd/m^2`,
  and zenith probe `0.0304587 cd/m^2`; the production lift revealed this field
  with zero saturated sky pixels while Bruneton quantized it to black; and
- the raw field retained a warm-horizon/blue-upper-sky chromatic split at both
  twilight times. The principal defect is therefore the source-only global
  display state, not missing cached color, changed ground coverage, or failed
  scattering transport.

The independently verified artifact set contains 76 records totaling
`35,435,275` bytes and has SHA-256
`2f7b49dd239fcaf5399c65bfebc59195458edf0b82910cf9987e341b76a615fc`.
These findings accept CR1's completeness and diagnosis only; they do not
accept either twilight display appearance.

### CR2 - Measure the light that remains at twilight

Status: complete and accepted by immutable run
`000007-available-light-inventory`.

Question: does the receiver-light signal explain why direct-source-only state
fails at twilight?

Change no display operation. Across the same scenes, record unit-bearing
Native15 direct-source irradiance and cosine-weighted upper-hemisphere diffuse
sky irradiance. Derive photopic direct, diffuse, and total illuminance only as
diagnostics. Also retain sky-background luminance percentiles, horizon and
zenith luminance, and the exact physical/cache identities.

Required images are a direct-versus-diffuse time plot, fifteen-channel spectral
strips, an annotated CR1 contact sheet, and a horizon/zenith/background plot.

Judge success by:

- finite unit-bearing spectra with the expected 15 channels;
- exact separation of direct and diffuse terms;
- diffuse sky light remains nonzero wherever the physical sky render remains
  illuminated after direct disk support falls;
- the sampled sunset cadence has no unexplained discontinuity, the declared
  dark control is exact zero, and continuity immediately across the 108-degree
  transition remains explicitly unclaimed until the CR6 bracket scenes; and
- repeated evaluation of a scene is numerically stable.

If the diffuse term disappears while the pre-display sky is visibly lit, stop
and repair measurement/lighting ownership. Do not compensate in Color.

Accepted result:

- all seven 4096-direction Native15 radiance fields and all four requested
  figures were written before gates; the first PNG completed in `72.526`
  seconds and the annotated decision plate in `75.362` seconds;
- every direct-normal, direct-horizontal, diffuse-horizontal, and
  total-horizontal packet retained the exact 15-channel basis, physical
  quantity, units, and equation, while Color, caches, the CR1 parent, and
  production source remained unchanged;
- direct support was exact zero at both ten minutes and one hour after sunset,
  while diffuse-horizontal illuminance was `385.009752021460` lux and
  `0.204409552372762` lux respectively, a `1883.52133035033`-fold distinction;
- sunset retained `1012.65314922260` lux of diffuse-horizontal light, and the
  two-hours-after-sunset texture-free dark state was exact zero in every
  direct, diffuse, total, repeated, rotated, and production-cross-check
  channel;
- all repeated 4096-by-15 raw and integrated measurements were exact. The
  largest half-cell-rotation difference was `0.0145091%` photopically and
  `0.0322762%` in any significant spectral channel, far below the declared
  sensitivity limits; and
- the independently verified artifact set contains 41 records totaling
  `5,121,712` bytes and has SHA-256
  `dcd6cdd8146094d05427ad180af7fccefdbaa67e290d1b5f21e6a0d4b03697ba`.

This accepts the receiver-light measurement only. It does not accept an
ambient-light bridge, Color operation, twilight appearance, or stellar
behavior. The seven fixed scenes end with a last ready sample at solar zenith
`99.745250` degrees and a dark control at `108.136575` degrees; they do not
bracket the 108-degree transition and therefore make no transition-continuity
claim. CR6 retains the planned below/above bracket.

Run `000006-available-light-inventory` is a sealed failed integrity setup. It
wrote the complete measurement and image set and passed every scientific gate,
but an annotation stroke changed one parent-sheet pixel in each of 3,066 rows
(`9,198` bytes, maximum code difference `102`). It makes no accepted claim.
The seven raw fields and the other three figures replayed byte-for-byte in the
accepted corrected run.

### CR3 - Apply measured ambient light to neutral geometry

Status: complete and accepted by immutable run
`000011-neutral-geometry-ambient-proof`.

Question: does the measured diffuse signal light scene geometry in the way the
available sky light implies?

Hold sky Color unchanged. Render a neutral Lambertian sphere and plane at solar
noon, sunset, sunset plus 10 minutes, and sunset plus 60 minutes. For each
scene produce direct-only, diffuse-only, and combined lighting rows. Use the
same material, camera, display operation, and scale across the complete plate.

Judge success by:

- recorded incident irradiance is unchanged by display exposure;
- direct-only goes to zero only when geometry/source visibility requires it;
- diffuse-only remains visible while CR2 records available diffuse light;
- combined output equals the declared direct-plus-diffuse linear-light
  composition before Color within numerical tolerance;
- pre-display surface response falls smoothly, and any tint on the neutral
  material is explained by the incident spectrum rather than the lighting
  bridge; and
- the result has no named-time or distant-Sun-only branch.

This accepts the ambient-light input boundary, not the final sky appearance.

Accepted result:

- all twelve primary frames, the common fixed-log pre-display sheet, the
  Native15/additivity figure, four full-resolution RGBY fields, and the shared
  R8 geometry mask were written before gates; the complete image set contains
  15 PNGs;
- the first PNG completed in `5.988` seconds and the decision plate in
  `6.429` seconds;
- each scene evaluated all four plane vertices and all 561 emitted
  `THREE.SphereGeometry(1,32,16)` vertices. Native15 direct-plus-diffuse
  additivity was exact across all 565 vertices and three retained analytical
  probes per scene;
- the largest binary64 projected-RGB additivity difference was
  `3.637978807091713e-12` absolute and `7.682613081579062e-16` relative. The
  largest stored-float32 difference was `0.0047607421875` at solar-noon scale,
  with only `6.275225602405567e-7` relative error, inside the predeclared
  hybrid absolute-or-relative tolerance;
- up-plane photopic outgoing radiance fell strictly from solar noon through
  sunset, plus ten minutes, and plus sixty minutes. The diffuse values were
  `723.832317445140`, `58.0207515610864`, `22.0594338622081`, and
  `0.0117118046431176 cd m^-2`, respectively;
- the freshly rehydrated direct Native15 input and direct-only raster response
  were exact zero at plus ten and plus sixty minutes, while diffuse and
  combined pre-display response remained nonzero;
- all twelve persisted primary PNGs independently replayed the immutable CR1
  Bruneton backplate exactly outside the geometry mask: zero differences over
  `626,632` compared RGBA codes per frame; and
- parent artifacts were freshly read and decoded after the final image,
  production inventories remained unchanged, D3D11/WebGL2 stayed healthy,
  and the separately invoked terminal verifier accepted all 57 artifacts
  totaling `52,550,399` bytes with artifact-set SHA-256
  `6d3c23060973e14e325e1fb87d28d1e61efe9a445f2fe57c101d2db04eb0d8a5`.

The unchanged Bruneton presentation makes the plus-sixty-minute surface
quantize to black even though its physical diffuse response is nonzero. The
common fixed-scale diagnostic exposes that response and makes plus ten visibly
brighter than plus sixty. This is a Color-boundary observation and the direct
motivation for CR4; it is not a missing-light or ambient-bridge failure.

Runs `000008` and `000009` are sealed failed launch/harness attempts. Run
`000010` retained the complete coherent image and physical result but is
sealed rejected because its independent reader incorrectly required both the
absolute and relative float32 ceilings while the declared browser gate used
the hybrid either-ceiling policy. The corrected accepted run does not
reinterpret or reopen any prior attempt.

### CR4 - Test the smallest twilight display adjustment

Status: diagnostic execution complete and accepted by immutable run
`000013-global-achromatic-twilight-sweep`; later bounded work through CR4K
retains `slope-078/p9` as the owner-selected no-change result.

Question: can one global achromatic response driven by measured available light
improve twilight while retaining the Bruneton daylight and low-Sun range
inside a tight preservation envelope?

Predeclare a small diagnostic sweep around one candidate curve. It must use one
receiver-light scalar selected from CR2, one equation across all scenes, one
common gain for RGB, and a value- and slope-continuous approach to unit gain as
available light increases. It must not clamp into an exact Bruneton branch at
a bright-scene threshold. Before execution, freeze a receiver-light-indexed
comparison envelope that is tightest in ordinary daylight and may widen only
modestly and continuously through low-Sun conditions. That envelope evaluates
the one response; it does not alter it, and it makes no sunrise/sunset or named-
scene distinction. Render unchanged Bruneton, current production, and each
candidate for solar noon, sunset, sunset plus 10 minutes, and sunset plus 60
minutes. Replay the additional CR1 one-hour-before and ten-minutes-before
sunset controls for the preservation metrics. Do not normalize a pixel by its
peak channel and do not add a separate gamut or shoulder model.

Judge success by:

- solar noon and every declared bright/low-Sun control stay inside the frozen
  Bruneton preservation envelope; exact pixels are preferred but not required;
- sampled gain and image-difference curves contain no value discontinuity or
  slope kink at a former bright-scene identity threshold;
- each scene uses one scalar for all pixels, and every scene uses the same
  scalar derivation and display equation;
- the twilight horizon becomes usefully visible without turning the field into
  a broad gray, brown, or orange sheet;
- chronological brightness is continuous with bounded black and clipped
  fractions;
- signed RGB ratios remain unchanged until an explicit display clip; and
- the owner selects a plausible row or concludes that scalar-only response is
  insufficient.

No large parameter search follows a complete failure. That failure advances
the diagnosis, not the candidate.

Frozen CR4 input:

- scalar: CR2 total-horizontal receiver illuminance `E` in lux;
- response: `g(E;G) = 1 + (G - 1) / (1 + (E / 68)^4)` followed by one common
  RGB multiplication and the existing explicit display clamp;
- fixed rows: `G = 256`, `512`, and `1024`;
- preservation applicability: `E >= 1000 lux`, evaluation-only;
- maximum-code envelope: `1 + 4 / (1 + (E / 2000)^2)`;
- RGB-code-RMSE envelope: `0.2 + 0.8 / (1 + (E / 2000)^2)`; and
- unclipped achromatic cross-product ceiling: `1e-12`; and
- image set: 30 panels, 18 amplified differences, three diagnostics, and one
  decision plate, all written before gates.

Run `000013` wrote and independently verified all 81 artifacts (`8,155,157`
bytes; artifact-set SHA-256
`098add701fdb6af73df7b861e27f57c908293619768f77df1240a08ba111e2fa`).
Every declared integrity and scientific gate passed. The first image completed
in `2.952` seconds and the complete decision plate in `8.167` seconds.
Restrained `G = 256` and balanced `G = 512` preserve the frozen Bruneton
envelope at every applicable scene; strong `G = 1024` fails it at sunset with
maximum RGB-code difference `5` and RMSE `1.167215524`, against ceilings
`4.183769673` and `0.836753935`. No row is appearance-approved automatically.
Run `000012-global-achromatic-twilight-sweep` is a sealed failed Chrome sandbox
launch with no accepted result claim.

### CR4A - Establish a qualitative sunset reference and isolate the defect

Status: complete and accepted as a qualitative diagnosis by immutable runs
`000016-paper-sunset-reference-inventory` and
`000019-native15-sunset-paper-visual-comparison`. No Color candidate was
introduced in this increment.

Question: when our current Native15/Q30 sunset field is shown both at its
absolute Bruneton brightness and under the paper's equal-sky-irradiance
presentation, is the visible defect primarily missing spectral structure or
insufficient display exposure?

This diagnosis is intentionally split into two immutable runs so the first
useful image arrives before the expensive transport acquisition:

1. `paper-sunset-reference-inventory` losslessly extracts the eight Figure 9
   sunrise swatches from the authenticated paper PDF, copies the nine retained
   Figure 1 `Z=87` domes, and renders labeled paper-only columns. Its gates are
   file, XObject, projection-metadata, and derivation integrity only.
2. `native15-sunset-paper-visual-comparison` renders the current point-local
   Native15/Q30 sky through the exact Figure 9 pinhole and Figure 1 equidistant
   dome projections. It includes a San Jose `Z=87` bridge, the actual San Jose
   sunset at `Z=89.957915`, source-relative comparison orientation, an actual
   geographic orientation, and an unnormalized luminance diagnostic. The
   Figure 9-style copies use that figure's one uniform `36 W m^-2` sky-
   irradiance normalization and solar-disk convention; the absolute domes do
   neither.

The paper panels are subjective display references, not radiometric sunset
measurements. They were produced for different locations, atmospheric
profiles, solar positions, and per-model wavelength counts. Figure 9 also
normalizes every model independently and the low-Sun Figure 1 row has no
measurement panel. Therefore this increment prohibits image RMSE, pixel-
similarity acceptance, absolute-luminance equivalence, or a claim that one
paper model is ground truth.

Judge progress qualitatively by the presence and placement of the warm horizon
band, blue upper sky, directional symmetry/smoothness, and the difference
between normalized and absolute presentation. If normalization exposes the
expected warm-horizon/blue-sky structure while the absolute view remains too
dark, advance to the pre-tone exposure increment without changing scattering.
If the normalized Native15 field itself lacks that structure, stop before
Color and reopen the spectral/transport diagnosis.

Accepted result:

- run `000016` preserved all 17 authenticated paper panels byte-for-byte and
  produced the three paper-only review plates; its independently verified
  artifact-set SHA-256 is
  `e5c45a85efb4107a0440f6d3af0f08ff562c52cf0b1910473d6056987241ae37`;
- run `000019` produced all 26 requested PNGs and five Native15 raw fields in
  `25.839` seconds, with exact bin-87/bin-90 caches, Q30 transport, no WebGL
  errors, unchanged production inputs, and independently verified artifact-
  set SHA-256
  `603940164f713a05b0eb30a183a0835cffc55c68cc271f89e5977c81749a9c55`;
- the `Z=87` and actual-sunset fields retain a smooth cool greater sky and warm
  horizon band in both the dome and pinhole projections. The actual-sunset
  36 W m^-2 diagnostic uses one `5.507140248` multiplier and exposes that
  structure without a channel curve;
- the unnormalized actual-sunset dome preserves the same structure but is
  substantially darker. CR4A therefore routes the next change to one global
  achromatic pre-tone exposure, not to spectral transport or scattering; and
- failed runs `000014`, `000015`, `000017`, and `000018` remain sealed setup or
  renderer-diagnostic evidence and make no accepted comparison claim.

### CR4B - Bracket one pre-tone exposure response

Status: complete and accepted as diagnostic evidence by immutable run
`000020-sunset-pre-tone-exposure-bracket`. No row is appearance-approved.

Question: can one smooth, receiver-light-driven, achromatic exposure applied
to signed projected linear RGB before the unchanged Bruneton exponential
mapping reveal the accepted sunset structure without a new channel curve or
display shoulder?

The first run changes only this boundary and renders the actual sunset through
a small predeclared three-row bracket. It writes every row, differences,
clipping masks, and a labeled decision plate before evaluating the existing
bright/low-Sun preservation evidence. The paper normalization factor may
inform the bracket's scale, but it is not copied as the candidate and does not
become a target brightness.

Judge progress by a visible warm horizon plus blue greater sky, no new lobes
or broad gray/orange sheet, bounded clipping, and a sunset change consistent
with the owner-relaxed low-Sun preservation rule. This is a plausibility
selection only; it does not freeze production appearance.

Accepted result:

- the frozen response is
  `g(E;G) = 1 + (G - 1) / (1 + (E / 3 lux)^1.3)`, applied once to
  signed projected linear RGB before the unchanged Bruneton exponential;
- all 12 requested images were written before gates, with the first image at
  `4.895` seconds and the decision plate at `5.164` seconds;
- the three sunset gains were `2.056929394`, `3.114375119`, and
  `5.229266569` for `G = 2048`, `4096`, and `8192` respectively;
- the first two rows had zero black and zero saturated sky pixels. `G = 8192`
  had zero black sky and a localized `1.101%` saturated patch around the solar
  center, below the broad-failure ceiling retained for CR4C;
- every integrity, parent-authentication, Native15-field replay, WebGL2,
  D3D11, CPU/GPU parity, pre-tone-ordering, common-scalar, analytic-response,
  and image-order gate passed; and
- the independently verified artifact-set SHA-256 is
  `df9b90b4245b3abc59787e9c66b0d2b7bb5cf2b4fea88dd475f43feb209708cc`.

`G = 4096` is the provisional CR4C diagnostic row because it is the strongest
bracket member with zero black and zero saturated sky pixels. It clearly
exposes the accepted cool greater-sky/warm-horizon structure without the pale,
flattened circumsolar patch already visible at `G = 8192`. This lets the
nautical replay isolate chronology instead of beginning with a display-
capacity confound. It is not owner appearance approval, a paper match, a
preservation decision, or a production selection.

### CR4C - Carry one response through nautical twilight

Status: complete as diagnostic evidence. Immutable run
`000021-sunset-nautical-pre-tone-sequence` rejects the first response, and
immutable run `000022-cr4c-two-scale-sunset-nautical-pre-tone-sequence`
accepts the bounded response revision. Appearance acceptance remains false.

Render unchanged Bruneton, the selected diagnostic response, and the paper-
normalized structural diagnostic at sunset, plus 10 minutes, and plus 60
minutes. Reuse immutable Native15 fields when compatible. The same receiver-
light equation and parameters apply to all three scenes; no per-scene gain,
clock branch, or Sun-angle lookup is permitted.

Judge progress by chronological dimming, a persistent but narrowing warm
horizon, visible blue in the greater nautical sky, low black/saturation
fractions, and no discontinuity in sampled response value or slope. A visually
useful run remains diagnostic until owner review.

First-run result:

- all 17 requested PNGs were written in `16.305` seconds before gates and the
  terminal run was independently verified with artifact-set SHA-256
  `3f61815d53a2a5cb8208e97bf12d1de85d38a705e0f1120f290398d4e62f14cb`;
- exact CR1/CR2 parents, CR4B sunset pixels, structure scales, shader identity,
  WebGL2/D3D11 health, CPU/GPU parity, zero black/saturated sky, and all image-
  order gates passed;
- whole-sky, upper-sky, and horizon-band encoded-luminance medians were
  `0.422471 -> 0.434010 -> 0.136594`,
  `0.362845 -> 0.378573 -> 0.108839`, and
  `0.562925 -> 0.575270 -> 0.247705`; and
- the slight sunset-to-plus-10 rise rejects the response chronology even
  though the plus-60 image exposes the previously hidden blue greater sky.

This routes the next change narrowly to the response shape. It does not reopen
Native15 scattering, the caches, Q30, Bruneton, or the receiver-light state.

Accepted revision:

```text
g(E) = 1
     + 3.5 / (1 + (E / 980 lux)^9)
     + 5300 / (1 + (E / 1 lux)^3)
```

- one common scalar still multiplies signed projected linear RGB before the
  unchanged Bruneton exponential; the two smooth light scales add no scene,
  time, Sun-angle, source-kind, pixel, or channel branch;
- all 17 requested PNGs were written in `7.899` seconds before gates and the
  independently verified artifact-set SHA-256 is
  `4952c7b4781999885a44e9495d9566c6f4f8f3f0e6f6679fbd93a9fdb3cde656`;
- sunset, plus-10, and plus-60 gains are `2.493660403`, `4.499312710`, and
  `5259.616583`;
- whole-sky medians fall `0.356071 -> 0.263385 -> 0.176685`, upper-sky medians
  fall `0.303435 -> 0.224468 -> 0.141093`, and horizon medians fall
  `0.485555 -> 0.368319 -> 0.313239`;
- every twilight frame has zero black and zero saturated sky pixels, while the
  upper-sky blue-dominant fraction is `94.20%`, `100%`, and `100%`; and
- every integrity, five-parent authentication, rejected-run read-only,
  WebGL2/D3D11, CPU/GPU parity, exact-gain, analytic-response, chronology,
  clipping, shader-identity, and image-order gate passes.

The accepted claim is the contained response and three-scene diagnostic, not
owner-approved appearance, intermediate-cadence continuity, production
selection, or a paper match.

### CR4D - Recheck the bright and low-Sun preservation range

Status: complete and accepted as diagnostic preservation evidence by immutable
run `000025-cr4d-bright-low-sun-preservation-replay`.

Replay solar noon, one hour before sunset, ten minutes before sunset, and
sunset through the unchanged Bruneton control and the one CR4C response. Use
the already frozen receiver-light-indexed preservation method, updated only if
the owner has explicitly accepted a different continuous envelope. Render all
frames and differences before gates. Only after this increment may the
candidate replace CR4's unselected post-display rows as the input to CR5/CR6.

Accepted result:

- all 18 requested PNGs were written in `9.561` seconds before gates and the
  independently verified artifact-set SHA-256 is
  `4ce2f0ae986a5c317ad49d5075bfa0ab7ef24257029ebb245a9f0849f0a6fedd`;
- solar noon and one hour before sunset are framebuffer-identical to unchanged
  Bruneton with zero maximum RGB-code difference and zero RMSE;
- ten minutes before sunset differs by at most one RGB code with RMSE
  `0.434373`, inside the unchanged maximum-code/RMSE ceilings `2.850596` and
  `0.570119`;
- sunset exactly replays the accepted CR4C candidate but is deliberately
  report-only: maximum difference `83`, RMSE `53.438003`, and no replacement
  sunset envelope is inferred after observing it;
- the exact response, one-shader/one-uniform seam, CPU/GPU parity, clipping-
  delta masks, all parents, production inventories, and image order pass; and
- failed run `000023` preserves the complete image set but could not serialize
  one undefined terminal field. Rejected run `000024` exposed a rounded
  offline-RMSE value incorrectly treated as an exact browser oracle. The
  accepted run removes that false equality rather than fitting it to the
  observed number; the unchanged preservation envelope remains the gate.

### CR4E - Present the complete six-scene owner-review stack

Status: complete and accepted as a presentation-only derivation by immutable
run `000027-cr4e-six-scene-new-color-bruneton-stack`.

Place solar noon, one hour before sunset, ten minutes before sunset, sunset,
ten minutes after sunset, and one hour after sunset in chronological rows.
Each row puts the accepted CR4C two-scale color at left and unchanged Bruneton
at right. Reuse the exact accepted `640 x 400` parent PNGs without scaling or
rerunning transport or Color.

Accepted result:

- one `1348 x 2864` PNG was written in `3.411` seconds before integrity gates;
- all twelve parent PNGs and both accepted parent manifests were hash-
  authenticated before and after composition;
- every embedded `640 x 400` panel region reproduces its decoded parent RGBA
  values exactly, with new color left and Bruneton right in all six rows;
- the independently verified 30-artifact set has SHA-256
  `b7ead7abfebf71d8aa5466c5ca77dc906caea79c820dafb00944a9ce1e2a2469`;
  and
- run `000026-cr4e-six-scene-new-color-bruneton-stack` is a sealed failed
  sandbox browser-launch attempt with no image or result claim.

CR4E adds no appearance gate or new scientific claim. It is the compact image
surface for the pending owner decision.

### CR4F - Resolve the sunset-to-nautical cadence

Status: complete and accepted as integrity-only owner-review evidence by
immutable run `000032-cr4f-fine-twilight-cadence`.

Render one new-color column at sunset and sunset plus 10, 20, 30, 45, and 60
minutes. Reuse the accepted CR4C endpoint PNG bytes at sunset, plus 10, and
plus 60 minutes. At plus 20, 30, and 45 minutes, independently acquire the
exact Native15/N4/Q30/ozone field through bins 93, 95, and 97, measure CR2
total-horizontal receiver illuminance, and evaluate the unchanged CR4C
response. No image, illuminance, or per-scene grading interpolation is used.

Accepted result:

- all six individual `640 x 400` PNGs and the `688 x 2972` chronological stack
  were written in `37.154` seconds before gates;
- the endpoint images replay run `000022` byte-for-byte, all live acquisitions
  and exact-pixel stack embeddings pass, and the independently verified
  artifact-set SHA-256 is
  `60e01c9cd2b26579f5c83cc0904f29b920493000a497019c5f2b0f6b2cf21042`;
- the `(E lux, gain)` cadence is `(1012.664390, 2.493660)`,
  `(385.009752, 4.499313)`, `(104.711737, 4.504616)`,
  `(20.2939303, 5.134053)`, `(1.34437269, 1549.808549)`, and
  `(0.204409552, 5259.616583)`; and
- the visible sharp brightening lies between plus 30 and plus 45 minutes, where
  the receiver signal approaches the steep 1-lux nautical Hill term. The next
  revision therefore belongs to Color response shape rather than scattering,
  cache selection, or transport.

Runs `000028` through `000030` are sealed setup-only failures. Run `000031`
wrote all six individual images but failed at stack construction because a
live `Uint8Array` was passed directly to `ImageData`; none is authoritative.
CR4F accepts acquisition, derivation, and composition integrity only, not
appearance or continuous animation.

### CR4G - Replace the 1-lux switch-like response

Status: complete and accepted as discrete chronology/integrity evidence by
immutable run `000033-cr4g-slope-limited-nautical-response-bracket`.
Appearance selection remains open.

Question: can a broad, slope-limited receiver-light response remove CR4F's
plus-30 to plus-45 brightness reversal while retaining the accepted physical
field, sunset shoulder, blue greater sky, and warm horizon?

Replay the six immutable CR1/CR4F RGBY fields and scene-hit masks. Do not run
cache construction, atmospheric transport, or field interpolation. The CR4C
two-Hill response is the rejected continuity control. Three candidate rows
retain its sunset term and replace only its steep 1-lux nautical term:

```text
base(E) = 1 + 3.5 / (1 + (E / 980 lux)^9)
x(E) = ln(385 lux / (E + 0.02 lux)) / 0.1
adapt(E;q) = exp(q * 0.1 * softplus(x(E)))
g(E;q) = base(E) * adapt(E;q)
q in {0.70, 0.74, 0.78}
```

The `0.02`-lux floor makes the response finite and continuously
differentiable at zero; softplus makes the bright transition smooth; and the
adaptation contribution's absolute logarithmic elasticity remains below
`q < 0.79`. The bracket ceiling is the brightest pre-run value found to keep
all three exact CR4C regions strictly dimming at every sampled scene. One
scalar still multiplies signed projected linear RGB before the
unchanged Bruneton exponential. No row observes time, scene id, Sun angle,
pixel location, channel, or the rendered image.

Render and upload, in this order, all 24 full-resolution response/scene PNGs,
four six-scene chronology plates, one response/median diagnostic, and one
complete response-by-scene decision plate. All 30 images precede scientific
gates. Preserve every row whether it passes or fails.

Judge progress by:

- exact authentication and immutability of runs `000005` and `000032` and all
  selected fields, masks, receiver-light facts, and CR4F control PNGs;
- decoded-pixel replay of the CR4C control and reproduction of its known
  plus-30 to plus-45 reversal;
- CPU/GPU agreement within one encoded RGB code and a healthy D3D11 WebGL2
  replay;
- strictly decreasing true encoded-luminance medians across all six scenes in
  the exact CR4C whole-sky, upper-sky, and horizon-band regions for each
  eligible candidate;
- zero black and zero saturated sky pixels in each candidate frame;
- finite, positive, monotonically nonincreasing gain with the declared bright
  limit and dense analytic verification of the deep-response slope boundary;
  and
- unchanged production and parent inventories.

Passing a row accepts only response integrity and six-sample chronology. It
does not establish owner-approved appearance or unsampled animation
continuity. The brightest passing row may be identified for review but cannot
be selected automatically. Bright/low-Sun preservation is rerun after the
owner chooses an appearance row.

Accepted result:

- all 24 full-resolution frames and all six labeled figures were written
  before runner gates; the first PNG completed in `5.399` seconds and the
  decision plate in `12.819` seconds;
- the CR4C control replays the immutable parent PNGs and reproduces the
  plus-30 to plus-45 reversal in every declared region, while all three CR4G
  candidates strictly decrease at every adjacent sampled scene in the whole,
  upper, and horizon regions;
- `slope-070`, `slope-074`, and `slope-078` have maximum deep-response
  positive log elasticities `0.699865`, `0.739857`, and `0.779849`, remain
  positive and monotonic, and reach unit gain at the declared bright proof
  endpoint;
- every candidate frame has zero black and zero saturated sky pixels. Their
  whole-sky medians at plus 30, 45, and 60 minutes are respectively
  `0.156307 -> 0.065560 -> 0.030853`,
  `0.173236 -> 0.081011 -> 0.040395`, and
  `0.192576 -> 0.100048 -> 0.054414`;
- CPU/GPU parity, the RTX 2060 D3D11 replay, exact parent authentication,
  production/snapshot/implementation immutability, image order, derivations,
  and every integrity gate pass; and
- the independently verified 61-artifact set totals `5,453,199` bytes and has
  SHA-256
  `fd180391714f77ba2365d7f9ee487f63a61cb664170016f048caf0cc6c24108a`.

`slope-078` is the brightest passing row and therefore the upper appearance-
review boundary. It has not been automatically selected. The run accepts only
the sampled chronology and integrity claim, not appearance, continuous
animation, bright/low-Sun preservation under the new response, or production
adoption.

### CR4H - Acquire the missing low-Sun cadence

Status: complete and accepted as acquisition/integrity evidence by immutable
run `000034-cr4h-low-sun-cadence-acquisition`.

Question: what exact physical fields and receiver-light states occupy the
large gap between one hour before sunset, ten minutes before sunset, and
sunset?

Acquire San Jose sunset minus 45, 30, 20, and 5 minutes through the unchanged
Native15/N4/Q30/ozone transport, one-degree scene cache, fixed sunset-facing
camera, and spherical black-ground endpoint. Retain each signed projected
linear RGBY field, R8 scene-hit mask, 4096-direction Native15 receiver field,
and CR2 total-horizontal receiver-light measurement. Include one authenticated
CR4C sunset parent panel only to make the acquisition plate immediately
readable. The CR4C response used for the live preview is presentation state,
not a tested candidate.

Write every individual scene PNG and the ordered acquisition plate before
integrity gates. Judge this run only by exact scene/cache selection, finite
fields, valid masks, stable receiver measurement, CPU/GPU agreement, D3D11
health, parent/source/cache immutability, and the progress-time contract. Do
not accept or reject appearance, a response shape, Bruneton preservation, or a
publication match in CR4H.

Accepted result:

- all five individual `640 x 400` panels and the one-column acquisition plate
  were written before gates; the first PNG completed in `18.429` seconds and
  the plate in `51.864` seconds;
- the exact `(solar elevation degrees, total-horizontal lux)` pairs are
  `(+8.029526, 10806.649112)`, `(+5.316880, 6596.110497)`,
  `(+3.535053, 3632.919600)`, and `(+0.905991, 1495.612181)` for sunset
  minus 45, 30, 20, and 5 minutes;
- all four live scenes retain their `4,096,000`-byte RGBY field,
  `256,000`-byte R8 mask, `245,760`-byte 4096-direction Native15 receiver
  field, complete receiver-light record, exact bin/package provenance, and a
  healthy D3D11 replay with at most one encoded RGB code of CPU/GPU
  difference;
- the sunset context PNG is byte-identical to accepted run `000022`, every
  source panel is embedded in the stack exactly, and the parent, cache inputs,
  control snapshot, protected production source, and contained implementation
  remain unchanged; and
- independent verification accepts 52 artifacts totaling `20,624,682` bytes
  with artifact-set SHA-256
  `92b779126f25e6b0b0bfa43e1efaf6ec684b5776bd708f187959ef977907155f`.

This accepts only the missing cadence data and its derivation chain. The CR4C
preview pixels add no Color, appearance, preservation, or publication claim.

### CR4I - Check a smoother Bruneton-to-twilight shoulder

Status: complete and rejected as a candidate family by independently verified
immutable run `000035-cr4i-smooth-bruneton-shoulder-check`.

Question: can the owner-preferred `slope-078` nautical appearance be retained
while the same global response approaches Bruneton more gradually through the
last daylight hour?

Replay the immutable CR1, CR4H, and CR4F fields at sunset offsets `-60`,
`-45`, `-30`, `-20`, `-10`, `-5`, `0`, `+10`, `+20`, `+30`, `+45`, and
`+60` minutes. Render five rows:

1. unchanged Bruneton;
2. the exact CR4G `slope-078` / `p = 9` control;
3. an anchor-preserving restrained `p = 4` shoulder;
4. an anchor-preserving middle `p = 3.5` shoulder; and
5. an anchor-preserving broad `p = 3` shoulder.

The three candidates add no operation. They keep the CR4G floor, soft-knee,
and `q = 0.78` adaptation form and use the shoulder exponent as their sole
free degree of freedom. For each exponent, derive its amplitude, transition
illuminance, and adaptation pivot so its gain exactly reproduces `slope-078`
at sunset, plus 10 minutes, and plus 60 minutes. The predeclared binary64
targets are approximately:

| Row | `p` | shoulder amplitude | transition lux | adaptation pivot lux |
| --- | ---: | ---: | ---: | ---: |
| restrained | `4` | `3.69133665` | `919.470020` | `364.985830` |
| middle | `3.5` | `3.80959056` | `893.397592` | `353.520903` |
| broad | `3` | `4.00372315` | `851.769182` | `336.033700` |

The fixture and analytic proof retain full-precision derived values; these
rounded numbers are descriptive, not executable pins. One smooth global
scalar still multiplies signed projected linear RGB before the unchanged
Bruneton exponential. No response observes time, scene id, solar angle,
pixel, channel, camera, or publication curve.

Render all individual response/scene frames, response chronologies,
candidate-versus-Bruneton differences, the complete review matrix, and the
physical/reference and response diagnostics before any gate. Publication
evidence is deliberately separate from display fitting:

- Koomen et al. (1952) supplies measured photopic sky brightness and plane
  illumination over solar altitude `+5` through `-15` degrees; compare only
  normalized logarithmic physical slopes inside that domain.
- Patat, Ugolnikov, and Postylyakov (2006) supplies UBVRI zenith-region fits
  over solar depression `5` through `15` degrees; compare the normalized V
  slope to the non-matched-direction raw field only as report-only shape
  evidence and show the UBVRI family as chromatic context.
- One hour before sunset remains outside both publication domains and is
  judged against unchanged Bruneton, not an extrapolated reference curve.

The publication curves are different-site, different-atmosphere, different-
direction physical measurements. They are never SDR values, exposure gains,
RGB targets, or RMSE oracles.

Judge progress by:

- exact parent, field, mask, receiver-light, source, and authored-input
  identities;
- every requested image written before gates, with healthy WebGL2/D3D11 and
  at most one encoded RGB code of CPU/GPU disagreement;
- a finite, positive, continuously differentiable, monotonically
  nonincreasing response that approaches unit gain at high light;
- binary64 gain reproduction of the selected CR4G anchors at sunset, plus 10,
  and plus 60 minutes, with exact decoded pixels preferred and at most one RGB
  code of independently evaluated GLSL rounding difference permitted;
- the unchanged CR4D Bruneton envelope at one hour before sunset and every
  acquired scene whose solar elevation is at least `+5` degrees;
- mandatory Bruneton maximum-code, RGB-RMSE, differing-pixel, and regional-
  median reports at every lower-Sun scene, without converting an observed
  sunset deviation into a post-hoc gate;
- strict sampled dimming without a regional rebound across the complete
  cadence; zero black or saturated sky pixels from sunset onward; and complete
  report-only pre-sunset clipping counts, where the unchanged Bruneton solar
  disk can already be saturated and the separate preservation envelope owns
  candidate deviation; and
- normalized raw-field/receiver-light slopes that remain within the broad
  published trend without fitting Color to those measurements.

Passing accepts only this sampled integrity, preservation, and smooth-join
check. It does not automatically select `p`, approve appearance, establish
continuous animation between samples, introduce a blue-channel correction,
or promote production. The owner's note that `slope-078` could subjectively
use a little brighter blue remains a review observation; because this
experiment is achromatic, it first determines whether the spectrum merely
needs more visible exposure or a separately owned chromatic question remains.

Rejected result:

- all 60 full-resolution frames, five chronology plates, the seven-scene
  decision plate, response/Bruneton plot, and publication/raw-field plot were
  written before gates; the first image completed in `6.682` seconds, the
  decision plate in `23.362` seconds, and all 68 images in `23.605` seconds;
- every integrity, parent, authored-input, CPU/GPU, D3D11, clipping, anchor,
  response-math, containment, and render-order check passed. The three
  candidates reproduce the selected sunset, plus-10, and plus-60 anchors
  within one encoded RGB code and retain zero black/saturated sky pixels from
  sunset onward;
- the `p=4` row still rises from minus five minutes to sunset by `8.853%`,
  `13.311%`, and `4.278%` in the whole, upper, and horizon regions, and its
  minus-30-minute RGB-code RMSE `0.327969` exceeds the frozen `0.267356`
  ceiling;
- the `p=3.5` row reduces those rises to `4.531%`, `8.432%`, and `0.644%`, but
  its minus-30-minute RMSE is `0.517224`;
- the broad `p=3` row makes the whole-sky step nearly flat at `+0.008812%` and
  the horizon continues downward, but the upper sky still rises `3.835883%`.
  It also exceeds the RMSE envelope at minus 60, 45, and 30 minutes, although
  its maximum hard-range difference remains one RGB code; and
- the normalized Koomen/Patat plot retains the same broad physical dimming
  trend in the unchanged receiver-light/raw field. It cannot distinguish the
  Color rows because no candidate changes that physical input. Independent
  verification accepts 97 artifacts totaling `14,083,944` bytes with
  artifact-set SHA-256
  `d5d7273e8200bd15070db6bf17d2acefe65908c2762d6e2cff12ca1d859aea38`.

The rejected claim is narrow: changing only this anchor-preserving Hill
exponent cannot satisfy both relationships. The run does not reject the
owner-preferred `slope-078` appearance, alter its nautical anchors, or resolve
the separate brighter-blue observation.

### CR4J - Present the complete `slope-078` cadence in six columns

Status: complete and accepted as a presentation-only derivative by immutable
run `000036-cr4j-slope-078-six-column-cadence`.

Question: what does the current owner-preferred row look like across every
acquired condition from one hour before through one hour after sunset when the
complete cadence is visible at once?

Authenticate the twelve `slope-078-p9-control` PNGs in rejected-but-verified
CR4I run `000035`. Compose them at native `640 x 400` resolution with no
resampling into a two-row, six-column grid. The first row is sunset minus 60,
45, 30, 20, 10, and 5 minutes. The second row is sunset, plus 10, 20, 30, 45,
and 60 minutes. Put concise scene/elevation/receiver-light labels outside the
source pixels.

Write the complete grid before integrity gates. Judge only parent and source-
PNG authentication, exact decoded-pixel embedding, declared order, no image
smoothing, derivation completeness, immutable inputs, and containment. CR4J
reruns no Color, transport, cache, publication, or scientific gate and adds no
appearance selection.

Accepted result:

- the requested `3940 x 986` PNG was written in `5.572` seconds before
  runner-owned gates;
- all twelve exact `640 x 400` `slope-078-p9-control` parent panels are in the
  declared chronology with solar-elevation and receiver-light labels outside
  their source rectangles;
- all `12,288,000` embedded RGBA channels are byte-exact, with no smoothing or
  resampling;
- rejected CR4I parent identity, selected source artifacts, contained
  implementation, and protected production inventories remained unchanged;
  and
- independent verification accepts 30 artifacts totaling `1,446,291` bytes
  with artifact-set SHA-256
  `bbbf09fb3ac9ef4073d3286a5aa79eb6af06fd6ba703cfd3923a6e9149f9f3b0`.

This accepts only the presentation derivation. It does not select
`slope-078`, add a Color or scientific claim, or reinterpret CR4I's rejected
candidate-family result.

### CR4K - Test a minimal deep-twilight exposure lift

Status: complete by independently verified immutable run
`000037-cr4k-minimal-deep-twilight-lift`; the complete bracket is rejected,
while the restrained `+0.15`-stop row passes every declared gate. Owner review
retains the existing control because the visible benefit is too small to
justify changing it.

Question: can a very small smooth achromatic lift make the existing blue
greater sky easier to see at nautical twilight without changing the selected
`slope-078/p9` daylight-to-sunset behavior or recreating a late brightness
reversal?

Replay the same twelve authenticated CR4I fields and masks. Keep the exact
`slope-078/p9` response as the control and vary only its existing adaptation
pivot `P`:

| Row | Intended deep lift | `P` lux |
| --- | ---: | ---: |
| control | `0` stop | `385` |
| restrained | `+0.15` stop | `439.8971145541154` |
| brighter | `+0.30` stop | `502.62200361827666` |

The candidate pivots are derived by
`P_s = 385 * 2^(s / 0.78)`. All other values remain exactly fixed:
`A=3.5`, `S=980 lux`, `p=9`, `q=0.78`, `F=0.02 lux`, and `w=0.1`.
Consequently the operation remains the same smooth global achromatic response
and its deep-response ratios are exactly `2^0.15` and `2^0.30`. At the sampled
states the lifts are negligible through sunset, approximately `+0.098` and
`+0.230` stop at plus 10 minutes, and reach their declared deep values by plus
20 minutes. No new term, channel curve, scene branch, image metering, cache,
transport, or spectrum change is introduced.

The owner-supplied photographs labeled nautical twilight are uncalibrated
qualitative context only. Their solar depression, exposure, tone curve, white
balance, atmosphere, clouds, Moon, foreground, and local-light contribution
are not matched. They may support review of a visible blue greater sky, narrow
warm horizon, smooth vertical transition, and dark foreground, but they may
not supply pixel targets, absolute brightness or hue, RMSE, fitting, or a
claim of scene equivalence.

Render and upload before scientific gates, in order:

1. all 36 full-resolution response/scene frames;
2. one native-resolution six-column, two-row cadence plate for each response;
3. one three-row by six-column sunset-through-plus-60 comparison plate;
4. one amplified candidate-versus-control difference plate;
5. one black/saturation mask plate; and
6. one response-gain and regional-median diagnostic.

All 43 images remain available whether a candidate passes or fails. Judge
progress by exact parent and field authentication; control replay; unchanged
pre-sunset pixels within one encoded code; finite, monotonic, smooth response
math; CPU/GPU agreement within one encoded code; strict sunset-through-plus-60
whole/upper/horizon median dimming; zero black and saturated sky pixels from
sunset onward; no new lobe, seam, broad gray/brown wash, white/yellow horizon
plateau, or flattened vertical gradient; and unchanged protected source.

Passing accepts only the bounded replay and sampled guards. Owner review may
select the smallest lift that makes the plus-45 and plus-60 greater sky read
clearly blue at ordinary plate scale. The photographs are never an automatic
selection oracle, and failure does not authorize a blue-channel correction.

Result:

- all 36 full-resolution frames and all seven review/diagnostic plates were
  written before gates. The first PNG completed in `5.501` seconds, the
  sunset-through-plus-60 decision plate in `14.897` seconds, and all 43 images
  in `15.315` seconds;
- every integrity, parent, implementation, protected-source, decoded cadence-
  embedding, D3D11/WebGL2, CPU/GPU, control-replay, response-math, pivot,
  chronology, and clipping check passes. Every sunset-through-plus-60 frame
  has zero black and zero saturated sky pixels;
- the `+0.15` row passes the complete gate set. Its whole-sky median increases
  from the control's `0.100331` to `0.110161` at plus 45 minutes and from
  `0.054414` to `0.059751` at plus 60, while all whole/upper/horizon medians
  remain strictly decreasing from sunset through plus 60;
- the `+0.30` row also passes response math, pivot identity, CPU/GPU parity,
  regional chronology, and clipping. It is rejected only at sunset, where its
  maximum difference from the control is one encoded code but sky RGB RMSE is
  `0.070225` and all-pixel RGB RMSE is `0.052316`, both compared with the
  predeclared `0.05` ceiling. Its plus-45 and plus-60 whole-sky medians are
  `0.122209` and `0.066478`;
- visual inspection retains the same smooth blue greater sky, narrow warm
  horizon, and dark foreground in both rows without an evident new lobe,
  seam, gray/brown wash, white/yellow plateau, or flattened gradient. The
  owner photographs remain qualitative context and did not enter this result;
  and
- independent verification accepts 72 artifacts totaling `10,656,973` bytes
  with artifact-set SHA-256
  `411617368762c3a7f9aa86aa1b0bdb154881addbf67dd9c5f563f358ce7b69bd`.

This result makes `+0.15` the only newly eligible row; it does not select that
row automatically. The brighter `+0.30` images remain review evidence but do
not satisfy the frozen preservation contract. The known inherited
minus-five-minute-to-sunset `p=9` rebound remains report-only and unchanged.

Owner conclusion: the three rows do not differ enough to justify further
exposure work or a new parameter choice. Retain `slope-078/p9` unchanged as
the contained twilight display input and close CR4K as a useful no-change
result. This is an appearance decision for the current static sequence, not an
unsampled-animation qualification.

### CR5 - Isolate display-capacity handling, only if CR4 requires it

Status: skipped for the current candidate. CR4C records zero black and zero
saturated sky pixels at sunset, plus 10 minutes, and plus 60 minutes, so
display capacity is not the remaining defect.

Question: did CR4 fail primarily because useful common-gain color reached the
display boundary?

Run this step only when CR4's masks and signed values isolate clipping or gamut
capacity as the remaining defect. Hold the accepted CR4 exposure/state fixed
and add exactly one smooth monotonic luminance shoulder with joint,
luminance-preserving gamut containment. Compare the same four scenes and emit
highlight, gamut-boundary, and RGB-ratio error masks.

Judge success by:

- the frozen CR4 Bruneton preservation envelope remains intact;
- warm RGB ordering and wider-sky color survive;
- no per-pixel normalization promotes broad regions to display peak;
- the former orange-sheet/highlight plateau does not recur; and
- the shoulder changes only pixels whose declared display capacity requires
  it.

If CR4 did not isolate display capacity, skip CR5 and open a new narrowly owned
diagnostic instead of assuming this mechanism.

### CR6 - Establish progressive star onset

Status: executed and rejected by independently verified immutable run
`000044-cr6-stellar-contrast-onset` after a corrected evidence rerun. The
retained `slope-078/p9` twilight display input remains frozen. The executable
input authority is
[`cr6-stellar-contrast-onset-v1.json`](../../../scripts/extraterrestrial/color-reset/fixtures/cr6-stellar-contrast-onset-v1.json).

Question: do stars become visible because their local background falls rather
than because of a time or cache-state switch?

CR6 changes no physical or display equation. Its single candidate is the
existing `stellar-one-pixel-presentation-000435-v1` source under the newly
frozen sky Color. For each occupied pixel, all colliding catalog Native15
irradiances are summed in canonical-member order, multiplied by the unchanged
`60999.839486002405` boundary-radiance scale, transported once through the
common camera path, rejected only by geometry or the existing whole-pixel
scene-hit mask, added to the sky spectrum, and passed through the same
`slope-078/p9` plus unchanged Bruneton display mapping. The runtime stellar
visibility factor is identically one. Local background and contrast are
diagnostics only; they do not feed the final renderer.

This first candidate is deliberately a no-new-mechanism check. It does not add
a stellar threshold, exposure, gain, screen-space halo, clock branch, Sun-
angle branch, cache-state branch, source-kind branch, magnitude cutoff, or
star-count target. Observation time remains a legitimate input only to the
geometry-owned stellar transform and projection.

The exact eight-scene order is:

| Scene | UTC instant | Solar zenith | Cache state |
| --- | --- | ---: | --- |
| sunset | `2024-06-21T03:26:03.503Z` | `89.95791522653448` | ready, bin 90 |
| plus 10 minutes | `2024-06-21T03:36:03.503Z` | `91.66578905821635` | ready, bin 92 |
| plus 30 minutes | `2024-06-21T03:56:03.503Z` | `94.9954648167966` | ready, bin 95 |
| plus 60 minutes | `2024-06-21T04:26:03.503Z` | `99.74525026663457` | ready, bin 100 |
| plus 90 minutes | `2024-06-21T04:56:03.503Z` | `104.14826387038352` | ready, bin 104 |
| immediately below 108 degrees | `2024-06-21T05:24:58.209Z` | `107.99999984592024` | ready, bin 108 |
| immediately above 108 degrees | `2024-06-21T05:24:58.210Z` | `108.00000194253896` | texture-free dark |
| plus 120 minutes | `2024-06-21T05:26:03.503Z` | `108.13657515628435` | texture-free dark |

The transition pair is the consecutive pair of integer UTC milliseconds
found by binary search against the pinned scene-state implementation. The run
must recompute and verify both angles, their one-millisecond separation, and
their ready/dark classifications before rendering.

Each condition emits, in order, a sky-only frame, a normalized stellar
diagnostic, the final physical composite, and a local-contrast overlay. The
normalized diagnostic gives every eligible point equal diagnostic intensity
while retaining transported spectral chromaticity; it is visibly labeled and
never becomes candidate input. After the 32 full-resolution scene images, the
runner writes six figures: final-composite cadence, complete 8-by-4 decision
matrix, fixed-member onset/contrast tracks, brightness/color ordering,
108-degree transition differences, and eligibility/collision/horizon/mask
facts. All 38 images are written and uploaded before any scientific gate, and
all remain available on rejection.

The member ledger covers all 500 canonical BSC V/50 members at every scene.
It retains member id, projected pixel, viewport and horizon classification,
whole-pixel scene visibility, collision group and representative, transported
Native15 value, pre-display stellar RGB/luminance, exact same-pixel sky-only
RGB, a star-free 5-by-5 ring-median context value, final RGB, encoded RGB and
luminance deltas, and onset facts. The exact same-pixel sky-only value is the
composition background; the ring median is report-only context.

There is no accepted psychophysical threshold. CR6 records two renderer
boundaries instead:

- encoded onset is the first eligible cadence frame where any encoded RGB
  channel differs from sky-only; and
- robust onset is the first where the maximum channel delta reaches two
  codes, one code beyond the allowed CPU/GPU framebuffer disagreement.

One-, two-, four-, and eight-code counts and a floored Weber-contrast value are
all reported. None is called a human-visibility limit or used to fit the
candidate.

The fixed cohort is selected before candidate display values are inspected:
all members that remain inside the viewport, above the geometry-owned horizon,
whole-pixel scene-visible, and collision-free at all eight conditions. Fewer
than eight such members rejects evidence sufficiency instead of relaxing the
rule. Candidate-independent brightness is the geometric mean of transported
photopic one-pixel stellar luminance over the six main cadence scenes; this
defines bright and faint quartiles before onset results are read.

Judge success by:

- exact parent, production-snapshot, catalog, photometry, point-presentation,
  response, scene, cache, and authored-input identities;
- all 38 images preceding gates, healthy WebGL2/D3D11, protected-source
  immutability, and CPU/GPU agreement within one encoded code; the GPU final
  path must use an independently GPU-projected stellar E8 value rather than a
  CPU-projected stellar field shared with the reference path;
- exact canonical collision summation, unit presentation factor, common
  camera-path transmittance, whole-pixel masking, and one shared Color
  evaluation for sky plus stars;
- zero occupied stellar pixels under positive Sun coverage, proving that the
  star-only diagnostic is equivalent to the active shared celestial
  consumer's Sun-first rule for this cadence;
- exact sky-only replay against the four shared CR4K control scenes within the
  frozen one-code/`0.05`-RMSE boundary;
- at least eight fixed-cohort members, at least one member crossing robust
  onset after sunset, and robust onsets represented in at least two different
  cadence intervals rather than one population switch;
- a top-brightness-quartile median onset no later than the bottom quartile;
- no fixed member losing robust status or robust delta across an adjacent
  interval where its measured local background does not rise and its
  transported stellar luminance does not fall; all other regressions remain
  explicitly explained by those recorded physical facts;
- at plus 120 minutes, at least one robust fixed member, brighter-quartile
  median delta above the faint quartile, retained red/blue quartile ordering,
  at least two resolved RGB-delta values, and no exact-white stellar-added
  pixel;
- exact projected pixels, eligibility, collision groups, and masks across the
  consecutive-millisecond transition pair, unchanged robust membership, and
  at most one code of per-star displayed-delta difference; and
- at most one sky-only code of change across that same pair. A larger sky
  discontinuity routes upstream to the shared dark-cache or frozen-display
  boundary and may not be hidden by stellar tuning.

Population counts remain reports, not target values. Passing these gates
accepts renderer-resolved causality and static sampled integrity only. The
owner reviews the final composites at native 1:1 scale for believable onset,
brightness and color variety, absence of an all-at-once switch or uniform-white
points, collision/horizon artifacts, and a visible transition seam. Objective
metrics do not establish human visibility or a camera/reference-photo match.

Owner acceptance freezes the unchanged one-pixel presentation as CR7 input.
Rejection may open one separately predeclared CR6A mechanism only when the
evidence localizes a stellar-presentation defect. A failed sky-only transition
routes upstream instead. CR6 does not qualify unsampled animation, fractional
object-edge masking, Moon or planet appearance, local-Sun/flat behavior,
bloom or a point-spread function, a larger catalog, or production adoption.

Result:

- all 32 individual images and six figures were written before gates; the
  first image completed in `24.462` seconds and the complete image set in
  `78.560` seconds;
- the complete 501-entry by 15-channel palette proof covers 60,120 scalar
  comparisons with zero bit or ULP mismatches, and the authoritative GPU
  projection covers all 4,000 member-scene records, 272 occupied screen
  groups, and zero set or representative mismatches;
- the fixed cohort contains nine members, robust onset spans two cadence
  intervals with eight later crossings, and the top brightness quartile's
  median onset index `3` precedes the bottom quartile's index `5` without a
  conditional no-regression violation;
- the consecutive-millisecond 108-degree pair passes exact geometry,
  collision, mask, robust-membership, and one-code display continuity, and the
  sky-only pair is identical;
- the plus-120-minute control retains five robust fixed members, five distinct
  robust RGB-delta triples, and no exact-white stellar-added pixel; and
- every gate passes except `darkOrderingAndColor`: the source red/blue
  quartile medians remain ordered (`1 > -0.0338884`), but both displayed
  quartile medians are zero after one-pixel encoding. The run is therefore
  rejected without changing its images or relaxing the observed gate.

The corrected result proves that the failure is downstream of the catalog,
palette, GPU projection, collision accumulation, geometry, transport, frozen
sky Color, and 108-degree transition. It also shows the unchanged candidate
is clean but very restrained at native scale: plus 60 minutes has six robust
pixels out of 32 occupied, while plus 90 and plus 120 peak at 23 and 21 codes.
This evidence is sufficient to open exactly one bounded CR6A presentation
calibration bracket.

### CR6A - Bracket the one-pixel presentation calibration

Status: objective execution accepted by independently verified immutable run
`000046-cr6a-stellar-presentation-scale-bracket-corrected`, but all three rows
are owner-rejected on appearance. No presentation is selected. Its executable
input authority is
[`cr6a-stellar-presentation-scale-bracket-v2.json`](../../../scripts/extraterrestrial/color-reset/fixtures/cr6a-stellar-presentation-scale-bracket-v2.json).

Question: can one small camera-independent calibration of the existing
one-pixel point presentation make stellar onset clearly readable while
retaining the physical catalog, brightness/color relationships, progressive
cadence, and shared sky Color?

Authenticate rejected-but-independently-verified run `000044` and replay its
exact eight sky RGBY fields, scene masks, member ledger, authoritative GPU
projection, collision representatives, and transported stellar E8 values.
Use three rows:

| Row | Multiplier `q` | Effective one-pixel boundary scale |
| --- | ---: | ---: |
| control | `1` | `60999.839486002405` |
| restrained | `2` | `121999.67897200481` |
| stronger | `4` | `243999.35794400962` |

For every occupied pixel and wavelength-independent row scalar,

```text
finalLinearRgb_q(p) = skyLinearRgb(p) + q * transportedStarLinearRgb(p)
```

followed once by the unchanged frozen `slope-078/p9` and Bruneton exponential.
Because camera-path transport and E8 projection are linear, this is
algebraically identical to multiplying the existing one-pixel
irradiance-to-boundary-radiance presentation calibration before those fixed
operations. It does not change catalog irradiance, spectral ratios,
transmittance, collision membership, geometry, masks, sky Color, visibility,
or source selection. `q` is one fixed candidate-row parameter: it cannot
observe time, scene, solar zenith, cache status, pixel, channel, background,
catalog magnitude, star count, camera, viewport, or framebuffer.

The browser must reconstruct the sparse stellar field only from `000044`'s
canonical actual-representative rows and authoritative
`gpuPreDisplayStarLinearRgb` values, evaluate every candidate composite on the
GPU through RGBA32F inputs, and independently replay the same equation on the
CPU. CR6's retained final-composite PNGs were authored by its binary64 CPU
display path; its GPU display replay was the separately accepted one-code
parity check. The corrected control therefore must reproduce all eight parent
PNGs exactly through the independent CPU replay, while its GPU output must
remain within one encoded code of both that CPU result and the parent. This is
an oracle correction, not a relaxed candidate or changed renderer.

Render and upload before scientific gates, in order:

1. all 24 full-resolution row-by-scene final composites;
2. one native-resolution eight-scene cadence plate for each row;
3. one native-resolution eight-by-three decision matrix;
4. one robust-count/peak-code progression figure; and
5. one fixed-member dark brightness/color figure.

All 30 images remain available on rejection. Judge the bracket by exact
parent authentication and immutability, exact CPU control replay, complete
derivations, GPU/CPU and GPU/parent agreement within one encoded code, zero
robust stars at sunset and plus 10 minutes, zero robust stars at plus 30
minutes, at least one
but fewer than all occupied pixels robust at plus 60, no robust-count loss at
plus 90, no saturated or exact-white dark stellar pixel, top-versus-bottom
brightness ordering, and a positive source/display color relationship among
members that are actually robust. Do not reuse CR6's invalid comparison of
invisible color-quartile members as a gate. Retain the exact transition pair
and require its inherited geometry plus one-code stellar continuity.

The pre-run exact replay predicts `(robust +60, dark peak)` of `(6,21)`,
`(12,39)`, and `(22,73)` for control, restrained, and stronger. No row is
selected from those predictions. Passing accepts only the bounded
presentation-calibration evidence; owner review at native scale selects a row
or retains the control. It does not qualify a PSF, bloom, arbitrary viewport,
larger catalog, psychophysical threshold, animation, local Sun, or production.

First execution result:

- all 30 images were written before gates, with the first image at `7.103`
  seconds, the decision plate at `10.577` seconds, and the complete image set
  at `10.682` seconds;
- every gate except `controlQ1ExactParentReplay` passed, including D3D11,
  GPU/CPU parity, non-stellar pixel invariance, progressive onset, dark
  brightness/color relationships, and the consecutive-millisecond transition;
- the five lit-sky `1x` comparisons differ from the CPU-authored parent by
  only `10`, `2`, `6`, `4`, and `2` RGB channels respectively, each by one
  code, while the other three scenes are exact. Those counts equal the CR6
  GPU/CPU parity fingerprints scene by scene; and
- the rejected run is independently verified with 63 artifacts totaling
  `8,758,270` bytes and artifact-set SHA-256
  `4db7e1ae90bd8af3745f9107a7be7df2bbd4dea1b57186f5e5688f9892f66a0b`.

The corrected rerun retains the exact same 30 GPU-authored images and every
scientific gate. It adds the missing direct CPU-to-parent comparison and may
accept only when that comparison is exact in all eight scenes. Run `000045`
remains rejected and immutable; it is diagnosis and visual evidence, not an
accepted bracket.

Corrected result:

- all 30 images were written before gates, with the first image at `6.150`
  seconds, the decision plate at `9.687` seconds, and the complete image set
  at `9.794` seconds;
- all 24 GPU full frames are byte-identical to run `000045`, proving the
  oracle-only correction did not change a candidate image;
- the independent CPU `1x` replay is exact to all eight CPU-authored CR6
  parent PNGs, while GPU `1x` remains within one code of both CPU and parent;
- at plus 60 minutes the `1x`, `2x`, and `4x` rows contain `6`, `12`, and `22`
  robust pixels out of `32`; their plus-120 peak deltas are `21`, `39`, and
  `73` codes;
- every declared integrity and scientific gate passes, including zero robust
  stars through plus 30 minutes, progressive sampled onset, no dark clipping
  or white collapse, brightness ordering, positive robust-member color
  correlation, and exact 108-degree geometry with one-code continuity; and
- independent verification accepts 65 artifacts totaling `8,939,566` bytes
  with artifact-set SHA-256
  `c27f702e168bc4f7a54da53038b1718c58207b7cb5db5e96cfa294ea649e4dde`.

This accepts the bounded calibration evidence only. Owner review rejects
`1x`, `2x`, and `4x`; this closes CR6A's global scale-only presentation
family, no row is frozen for CR7, and a wider multiplier search is not
authorized. The catalog-only CR6B proof is now accepted without changing any
presentation relationship. Before a later appearance increment, state what
visual relationship is unacceptable across the three rows and predeclare one
mechanism that tests that diagnosis. A quietly combined brightness,
visibility, and footprint change is not authorized by this result.

### CR6B - Prove the exact brightest-2,000 catalog roster

Status: complete and accepted by independently verified immutable run
`000047-cr6b-brightest-2000-catalog-proof`.

Question: can the contained lane construct and prove the exact 2,000 brightest
eligible BSC V/50 members while retaining every selected member and leaving
spectral materialization, runtime integration, and appearance unchanged?

The sole catalog authority is
`scripts/extraterrestrial/catalogs/bright-star-catalog-v50.tsv`, SHA-256
`d79223194f938533b4a4b7d832249d8661cf7adda088a8a0ec44039d3baab759`.
Its existing parser yields `9,096` eligible records. Rank those records by
ascending finite `Vmag`, then ascending HR as the deterministic tie-break, and
take the first `2,000`. The expected endpoints are HR `2491` at `Vmag = -1.46`
and HR `7474` at `Vmag = 5.17`. The accepted production 500-member roster must
be an exact ordered prefix of the result.

Write the exact 2,000-member roster and its complete source/selection
provenance. Before evaluating gates, render all four required figures:

1. an all-sky map of the exact production 500-member prefix;
2. an all-sky map of all 2,000 with ranks 1-500 and 501-2,000 distinguished;
3. a rank-versus-visual-magnitude plot; and
4. one labeled summary plate containing all three views and the roster facts.

Judge the roster proof by exact source identity, exactly `9,096` eligible
records, exactly `2,000` unique ordered members, the two exact endpoints, an
exact production-500 prefix, and finite unit directions for every member. No
selected member may be omitted, substituted, or clamped.

Current Pickles materialization is coverage evidence only in CR6B. It covers
`1,993` of the exact roster and must explicitly report the seven too-red
members: HR `868`, `8316`, `1845`, `4163`, `2289`, `4846`, and `9004`. Their
presence does not reject the roster proof, and CR6B may not silently force them
through the existing spectral bracket. A later separately predeclared
spectral-materialization increment must resolve those seven while retaining
all 2,000. Runtime texture capacity and integration are another independent
increment. Only after roster, spectra, and runtime contracts are resolved may
a catalog-appearance experiment compare the larger catalog in rendered
scenes. Passing CR6B accepts the roster and provenance only.

Accepted result:

- the authenticated parser exposed exactly `9,096` eligible records and the
  deterministic selection produced exactly `2,000` unique members from HR
  `2491` at `-1.46` through HR `7474` at `5.17`;
- all `500` production member IDs and all `1,500` direction scalars are exact,
  with zero prefix mismatches and zero maximum scalar difference;
- all four requested PNGs were written in `4.343` seconds after initialization
  and before gate evaluation, including separate 500/2,000 all-sky maps, the
  rank-magnitude plot, and the complete summary plate;
- all `2,000` members have finite B-V, spectral type, and unit direction. The
  unchanged Pickles/Johnson policy covers `1,993` and retains the seven declared
  exceptions without packet output, omission, replacement, or clamping;
- every source, containment, protected-production, implementation, image-order,
  and terminal-verification gate passes; and
- independent verification accepts 33 artifacts totaling `2,293,026` bytes
  with artifact-set SHA-256
  `ce50de53045f1e6f0ef33dcdc2b935a7023d5e28095b3d5f13add4980c370c57`.

This closes only catalog membership, order, coordinates, and provenance. It
does not accept spectra for the seven outliers, a 2,000-member runtime, or a
stellar appearance.

### CR6C - Calibrate one-pixel stellar brightness

Status: complete. The first bracket is rejected by independently verified
immutable run `000048-cr6c-one-pixel-brightness-calibration`; its `32x` row
alone clears the corrected bright-star anchor. Independently verified immutable
run `000049-cr6c-one-pixel-brightness-calibration-narrowed` accepts the narrowed
bracket, and native-scale review selects `24x` as the lowest satisfactory row.

Question: can one global brightness calibration of the unchanged single-pixel
stellar presentation make the brightest eligible stars begin to appear at a
credible clear, moonless natural-sky twilight stage while preserving source
photometry, transport, geometry, collisions, masks, the accepted sky Color,
and exact one-pixel occupancy?

The owner's clarified target retains a point source as exactly one occupied
pixel. No PSF, footprint, bloom, halo, threshold, visibility switch, clock
branch, solar-angle branch, local-background branch, catalog suppression, or
atmosphere change is permitted. San Jose supplies only the fixed summer
geometry and cadence; light pollution and Moon illumination remain deferred.

Authenticate immutable CR6 run `000044` and replay its exact sky RGBY fields,
scene masks, canonical actual representatives, and authoritative
`gpuPreDisplayStarLinearRgb`. Retain the exact historical `1x` control and
render two new rows:

| Row | Multiplier `q` | Effective one-pixel boundary scale |
| --- | ---: | ---: |
| control | `1` | `60999.839486002405` |
| reference candidate | `16` | `975997.4317760385` |
| upper candidate | `32` | `1951994.863552077` |

The sole candidate equation remains

```text
finalLinearRgb_q(p) = skyLinearRgb_000044(p)
                    + q * gpuTransportedStarLinearRgb_000044(p)
```

followed once by unchanged `slope-078/p9` and the unchanged Bruneton
exponential. Catalog irradiance and spectral ratios are not changed; `q`
calibrates only the displayed brightness of the unresolved one-pixel source.

The corrected onset relationship uses HR `1708`, `V=0.08`, which is eligible
in the plus-30-minute frame at solar depression `4.9954648167966` degrees.
Sunset and plus 10 minutes must remain free of robust stellar pixels. Both
candidate rows must give HR `1708` at least a two-code maximum RGB increment
at plus 30 minutes, then retain a nondecreasing robust population through plus
60 and plus 90 minutes. The two-code value remains a renderer-confidence
boundary, not a psychophysical definition; native-scale owner review decides
whether a row is actually bright enough. Dark frames must retain brightness
ordering, positive robust-member color relationship, one-code CPU/GPU parity,
the exact 108-degree transition geometry, and no saturated or exact-white
stellar pixel.

Write all 24 full-resolution frames, three cadence plates, the complete
decision matrix, count/peak diagnostic, and fixed-member brightness/color
diagnostic before gates. A failed row remains complete evidence. Passing
accepts only the fixed-viewport one-pixel brightness relationship. It does not
qualify other viewports, display hardware, light pollution, Moon illumination,
the 2,000-member runtime, or production.

First-bracket result:

- all 30 images were written in `8.859` seconds before scientific gates and
  the run is independently verified with artifact-set SHA-256
  `85500f766a9982440f25ab3f85b7041985b25632425b963a710b00670b6980f0`;
- every integrity, parent, implementation, protected-source, chronology,
  clipping, brightness/color, CPU/GPU, and transition gate passes;
- `16x` gives HR `1708` only a one-code plus-30 increment and therefore misses
  the corrected anchor, while `32x` gives it two codes and passes;
- at plus 60, `16x` and `32x` have `29` and `30` robust pixels with peaks `63`
  and `108`; at plus 90 their peaks are `200` and `241`; neither row contains
  a saturated or exact-white stellar pixel; and
- the complete run rejects only because both candidate rows were required to
  clear the anchor. The `32x` row is eligible but remains an upper review
  boundary rather than an automatic selection.

The narrowed replay changes only the middle row from `16x` to `24x`:

| Row | Multiplier `q` | Effective one-pixel boundary scale |
| --- | ---: | ---: |
| control | `1` | `60999.839486002405` |
| narrowed candidate | `24` | `1463996.1476640578` |
| upper replay | `32` | `1951994.863552077` |

It retains every first-bracket input, output, and gate. Both candidates must
clear the same HR `1708` plus-30 anchor. Native-scale review selects the
lowest satisfactory row; `32x` remains the known passing upper boundary.

Accepted narrowed result:

- all 30 images were written in `7.967` seconds before scientific gates;
  every integrity, corrected-onset, chronology, clipping, brightness/color,
  CPU/GPU, containment, and transition gate passes;
- at plus 30, `24x` gives HR `1708` exactly two codes, exposes `3` robust
  pixels, and retains zero robust pixels at sunset and plus 10 minutes;
- at plus 60, `24x` has `30` robust pixels out of `32`, `25` at eight codes,
  and peak `87`; at plus 90 all `32` occupied pixels are robust with peak
  `228`;
- `32x` provides only one additional robust plus-30 pixel and no plus-60 or
  plus-90 population benefit, while raising those peaks to `108` and `241`;
- neither row contains a saturated or exact-white stellar pixel, and the
  consecutive-millisecond 108-degree pair remains exact in geometry and
  robust membership with one-code display continuity; and
- independent verification accepts 65 artifacts totaling `8,888,747` bytes
  with artifact-set SHA-256
  `bcd129d7484bbec696c8a3877d9822e4a3cdf89e0d17c3e8614909f4ad62c001`.

Native-scale review selects `q=24`, effective boundary scale
`1463996.1476640578`, as the contained fixed-viewport one-pixel stellar
brightness calibration. It is the lowest tested passing row, provides the
required sparse bright-star onset, and retains more late-dark headroom than
`32x`. The accepted `slope-078/p9` atmosphere remains unchanged. The prior
CR4K `+0.15` deep-twilight row remains the only already-qualified atmosphere
follow-up if the separately observed slight nautical dimness is pursued; it
is not folded into this stellar selection and would require a separate
combined replay before replacing the current sky control.

### CR6D - Add a toggleable low-light stellar perception option

Status: complete and accepted by independently verified immutable run
`000052-cr6d-toggleable-low-light-stellar-chroma`.

Question: can a manually toggleable, luminance-preserving approximation of
low-light human color perception make the one-pixel stars less colorful while
preserving the accepted CR6C brightness progression and every physical input?

Introduce only the source-linear registry hook required by the general view-
presentation filter boundary. Its identity path has no enabled filter and must
reproduce CR6C byte-for-byte. Its only initial registered filter is
`human-low-light-chroma-v1`, applied to transported linear stellar RGB before
the selected `q=24` multiplication, sky addition, and unchanged Color mapping.
The filter uses only authenticated apparent V magnitude and the authenticated
E8 luminance/achromatic basis. It cannot observe time, solar angle, local sky,
framebuffer state, pixel position, or catalog population.

Render exactly three rows:

| Row | Filter enabled | Maximum chroma retention |
| --- | --- | ---: |
| physical-color control | no | identity |
| moderate low-light approximation | yes | `0.65` |
| strong low-light approximation | yes | `0.40` |

Both candidate rows use `fullColorMagnitude=0.0` and
`neutralMagnitude=3.2`. Between those anchors, the smooth Hermite relationship
owned by the design controls chroma. These values bracket appearance; they do
not claim a complete retinal simulation or universal observer.

Replay the exact eight CR6C scenes and fixed members from authenticated run
`000049`. Write all 24 full-resolution frames before gates, followed by three
native-scale cadence plates, a complete decision matrix, a magnitude-versus-
retained-chroma plot, and a fixed-member luminance/chroma diagnostic. The
physical row must be copied from or byte-proven against its authenticated
parent rather than treated as a visual approximation.

Required objective gates are:

- disabled-stack control and all nonstellar pixels are byte-exact to CR6C;
- every pre-display candidate star preserves authenticated luminance within a
  predeclared binary64/float32 parity tolerance and remains finite,
  nonnegative, and unclipped;
- positions, membership, collision representatives, masks, one-pixel
  occupancy, `q=24`, sky fields, and Color identities are exact;
- retained chroma is continuous and nonincreasing with V magnitude for a fixed
  candidate, is no greater than physical color, reaches its declared maximum
  at `V<=0`, and reaches zero at `V>=3.2`;
- the moderate row retains at least as much chroma as the strong row for every
  member, with exact equality only where both are neutral or source-achromatic;
- CR6C onset remains credible: zero robust stars at sunset and plus 10, HR
  `1708` reaches at least two codes at plus 30, and robust population remains
  progressive through plus 60 and plus 90;
- no candidate produces a saturated or exact-white stellar pixel, and the
  consecutive-millisecond 108-degree transition remains continuous; and
- implementation, containment, derivation, protected-source, render-before-
  gate, and terminal-verification checks pass.

Native-scale review decides whether the physical, moderate, or strong row is
the preferred enabled state. Passing the experiment makes the selected filter
configuration available as a toggle; it does not remove the physical-color
path or enable the filter automatically. A later filter, particularly a
Purkinje/mesopic luminance reweighting or solar-view mode, requires its own id,
stage, target, parameters, order, compatibility declaration, images, and gates.
A luminance-changing stellar filter also requires CR6C brightness
requalification. Do not combine CR6D with
the seven-outlier spectral materialization, 2,000-member runtime integration,
atmosphere adjustment, or CR7.

Accepted result:

- all 30 requested images were written in `8.714` seconds before scientific
  gates; all integrity, replay, luminance, chroma, onset, clipping, transition,
  containment, and parent-immutability gates pass;
- the disabled row reproduces all eight accepted CR6C `q=24` PNGs byte-for-
  byte, and every enabled-row nonstellar pixel remains exact;
- maximum pre-display luminance error is below `7e-18`; robust populations
  remain `0, 0, 3, 30, 31` through sunset plus 90 for both enabled rows, with
  the required HR `1708` plus-30 anchor intact;
- the physical/moderate/strong plus-60 peak codes are `87`, `74`, and `70`,
  and the plus-90 peaks are `228`, `218`, and `214`, with no saturated or
  exact-white stellar pixels;
- native-scale review recommends moderate `maximumChromaRetention=0.65` as
  the least aggressive sufficient enabled state. Strong `0.40` reaches the
  same fixed-cohort robust color-axis correlation (`0.4591`) while reducing
  peaks further, so it remains an available bracket rather than the
  recommendation; and
- independent verification accepts 67 artifacts totaling `13,123,366` bytes
  with artifact-set SHA-256
  `032ab071dc21477b0cffb2eea7cda1f7378ed736370d7867e443b6ee82f3a089`.

Runs `000050` and `000051` are sealed non-authoritative setup failures. The
first was denied permission to spawn Chrome before browser work; the second
failed closed before rendering on an incorrect local roster-schema spelling.
Neither makes an appearance or scientific claim.

This selects a contained optional configuration, not an automatic mode or a
production change. Physical color remains exactly available. Future solar,
spectral-view, Purkinje/mesopic-luminance, and whole-frame filters still require
separate ids, stages, compatibility declarations, experiments, and claims.

### CR6E - Add a toggleable mesopic stellar luminance option

Status: complete and accepted by independently verified immutable run
`000054-cr6e-toggleable-mesopic-stellar-luminance`.

Question: can an explicit sky-adaptation and CIE scotopic-weighted stellar
luminance option improve dark stellar visibility without changing point size,
physical transport, the accepted atmosphere, or CR6D's moderate chroma option?

CR6E adds only `human-mesopic-luminance-v1`, ordered immediately before
`human-low-light-chroma-v1` at `stage=source-linear`, `target=stellar`. For each
scene, adaptation luminance `La` is the median authenticated physical sky Y over
unmasked sky pixels before stars, exposure, and Color. Define:

```text
t = clamp((log10(5) - log10(max(La, 0.005))) / 3, 0, 1)
rodWeight = maximumRodContribution * t^2 * (3 - 2*t)
Yp = authenticated E8 photopic luminance of transported stellar RGB
Ys = 1700 * integral(transported Native15 spectrum * CIE V'(lambda) dlambda)
Ymes = Yp + rodWeight * (Ys - Yp)
luminanceAdjustedRgb = transportedRgb * (Ymes / Yp)
```

The CIE `0.005–5 cd/m^2` off-axis scotopic/mesopic/photopic boundaries anchor
the blend. The smooth log interpolation and strength bracket are declared
approximations, not CIE 191 conformance or a retinal simulation. Red stars may
dim when `Ys/Yp < 1`; blue-green stars may brighten when it exceeds one.

Render four rows over the exact eight CR6D scenes:

| Row | Mesopic luminance | Moderate chroma | Maximum rod contribution |
| --- | --- | --- | ---: |
| physical control | off | off | identity |
| CR6D moderate control | off | on | `0` |
| half mesopic | on | on | `0.5` |
| full mesopic upper boundary | on | on | `1.0` |

Write all 32 full-resolution frames before gates, then four cadence plates, a
complete matrix, adaptation-weight plot, stellar S/P response plot, and fixed-
member brightness/color diagnostic. Physical and moderate controls must replay
accepted runs `000049` and `000052` byte-for-byte. Candidate nonstellar pixels,
positions, membership, collisions, masks, and one-pixel occupancy remain exact.
Sunset through +30 must be exact to the CR6D moderate row because `La >= 5`.
At darker scenes, each candidate must follow the declared per-member S/P
relationship, retain finite RGB without changing channel signs or adding a
gamut clamp, preserve progressive onset, and introduce no saturated or exact-
white stellar pixel. `q=24` must be explicitly
requalified; a row that fails is evidence only. Native-scale review selects a
recommended enabled state or retains CR6D moderate without luminance change.

CR6E is perception-only. It changes no source spectrum, radiance, transport,
sky, atmosphere, Color, or point footprint. Do not combine it with the seven-
outlier spectral materialization, runtime capacity, a solar filter, moonlight,
light pollution, atmosphere adjustment, or CR7.

Accepted result:

- all 40 requested images were written in `9.588` seconds before scientific
  gates, with the first PNG at `5.385` seconds;
- the physical row replays all eight accepted CR6C `q=24` PNGs byte-for-byte,
  and the moderate control replays all eight accepted CR6D PNGs byte-for-byte;
- both candidates are exact to the moderate control from sunset through plus
  30 minutes, as required by the measured sky adaptation luminances above
  `5 cd/m^2`;
- at plus 60 minutes the half/full peak stellar codes rise from the moderate
  control's `74` to `102`/`126`, while robust counts remain `30` and no row
  clips; in the darker sampled scenes half strength peaks at `246`, compared
  with the full row's `253`, without gaining robust members;
- the measured per-star changes follow the transported spectrum's CIE
  scotopic/photopic ratio: blue-green spectra can brighten and red spectra can
  dim, so this is not a global brightness multiplier;
- native-scale review selects, and the owner approves,
  `maximumRodContribution=0.5` as the least aggressive useful optional enabled
  state. Full strength remains the tested upper boundary, while CR6D moderate
  and physical color remain exact toggle paths; and
- independent verification accepts 79 artifacts totaling `24,029,241` bytes
  with artifact-set SHA-256
  `2dcbf0fea5bf4edc0d667d437ab853ffbb9401cb8214f4a4e1d2be01c1359df5`.

Run `000053-cr6e-toggleable-mesopic-stellar-luminance` is a sealed failed
implementation attempt. It rejected legitimate negative wide-gamut E8 RGB
components before completing the candidate rows and makes no scientific or
appearance claim. The accepted implementation instead requires finite RGB,
applies one positive scale, preserves channel signs, and adds no hidden clamp.

### CR6F - Materialize the complete brightest-2,000 Native15 roster

Status: complete and accepted by independently verified immutable run
`000055-cr6f-brightest-2000-spectral-materialization`.

Question: can all 2,000 accepted CR6B members receive finite nonnegative
Native15 packets while preserving the existing 1,993-member Pickles equation
and reconstructing catalog Johnson `B-V` and `V` for the seven red outliers?

For the covered 1,993 members, retain the exact bracketed Pickles/Johnson
equation. For the seven outliers, use the type-appropriate predeclared Pickles
base in fixture `cr6f-brightest-2000-spectral-materialization-v1.json`, apply
the smooth positive tilt
`S(lambda)=Sbase(lambda)*(lambda/lambdaV)^alpha`, solve `alpha` against catalog
Johnson `B-V`, then normalize Johnson V to catalog `Vmag`. This is a
photometry-constrained Native15 continuum approximation. Carbon-star molecular
bands, emission lines, and variability are explicitly unclaimed.

Write the complete packet set and all three spectral figures before gates.
Accept only if roster order is exact, all 30,000 scalars are finite and
nonnegative, the partition is exactly 1,993 retained plus seven declared
proxies, and both V and B-V residuals are at most `1e-10` magnitude. Omission,
red-end clamping, runtime integration, and appearance changes are forbidden.

Accepted result: all 2,000 ordered packets and 30,000 Native15 scalars pass;
the retained/proxy partition is exactly `1,993/7`, no scalar is nonfinite or
negative, and maximum reconstructed V/B-V residuals are
`1.7763568394002505e-15`/`1.3322676295501878e-15` magnitude. The independently
verified artifact-set SHA-256 is
`a380716366661c7b9bddcd6b025bd1c111d9e60b8a03cde6445e6cd0a61649c4`.

### CR6G - Qualify the brightest-2,000 runtime package

Status: complete and accepted by independently verified immutable run
`000057-cr6g-brightest-2000-runtime-capacity`.

Question: can the exact CR6B roster and CR6F packets occupy a bounded WebGL2
package with an explicit ordered replacement seam? Pack member direction and V
into one `2000x1 RGBA32F` texture and Native15 spectra into one
`2000x15 R32F` texture. The total declared payload must not exceed `262,144`
bytes. Authenticate both parents, upload both textures, and require exact
float32 shader readback at member indices `0`, `499`, `500`, and `1999` for
member texels and spectral channels `0`, `7`, and `14`. Write the runtime
diagnostic before gates. This accepts capacity and the contained replacement
package only; appearance and production integration remain unclaimed.

Accepted result: independently verified immutable run
`000057-cr6g-brightest-2000-runtime-capacity` accepts the `152,000`-byte
package, `4.0543 ms` contained build, D3D11 texture upload, and all 28 exact
float32 shader readbacks. Its artifact-set SHA-256 is
`ae7224f0b85859a08d896f32b7be24c33472b9b3e034f07b365f96024af90627`.
Run `000056` is a sealed sandbox-launch failure and makes no claim.

### CR6H - Evaluate brightest-2,000 appearance

Status: executed and rejected by independently verified immutable run
`000058-cr6h-brightest-2000-appearance`.

Render the exact accepted 500-star half-mesopic control and a complete
2,000-star candidate over all eight CR6E scenes. Preserve one-pixel `q=24`,
moderate chroma, half mesopic response, sky, Color, and the first 500 exact
transported packets. For the added 1,500 members, exploit the accepted
spherical-atmosphere azimuth independence and linearly interpolate each
Native15 view-transmittance channel by local ENU up coordinate from all 4,000
authenticated CR6 member-scene records. This is an explicit transport
surrogate, not a new atmosphere claim.

Write 16 panels and four complete figures before gates. Require no robust star
at sunset or plus 10, at least three at plus 30, progressive sampled onset, at
least one robust added member by plus 60, exact one-pixel occupancy, no
saturated/exact-white stellar pixel, and continuous consecutive-millisecond
108-degree counts. Passing objective gates still requires appearance review.

Result: all 20 images and every integrity/onset/occupancy/clipping/transition
gate pass except the predeclared requirement that at least one added member be
robust by plus 60. The added 1,500 increase occupied candidate pixels from the
roughly 30-member control field to `131–163`, but contribute zero two-code
robust pixels in every scene under accepted `q=24`. The owner-directed closure
therefore retains the accepted 500-star appearance rather than reopening
brightness calibration solely to expose fainter catalog members. The complete
2,000 roster, spectra, and runtime package remain accepted reusable capability.
The rejected appearance artifact-set SHA-256 is
`2252cfa5a6c7bd9ed0ba767e0fb3a4ca70b41f29369ed2644509358366c3fd5e`.

### CR7 - Combine the accepted pieces

Status: complete. Objective evidence is accepted by independently verified
immutable run `000062-integrated-color-reset-sequence`, and the owner's
direction to wrap the lane supplies the required appearance approval.

Question: do the independently accepted sky, ambient, and stellar pieces remain
credible when rendered together?

Retain the accepted 500-star path. Render the complete eight-scene CR6E cadence
plus the CR3 solar-noon control. At the three shared sunset, plus-10, and
plus-60 instants, place CR3's authenticated direct-plus-diffuse neutral geometry
over the accepted CR6E sky/star frame only at the exact CR3 geometry mask,
mapping its predisplay RGB through the frozen `slope-078/p9` Color. Solar noon
replays CR3, where the candidate is Bruneton-identical; the other five CR6E
frames remain exact because no authenticated CR3 geometry state exists there
and the geometry is outside this composition claim. Produce all nine frames, a
chronological contact sheet, and a geometry-localized difference sheet.

Judge success by:

- daylight and low-Sun Bruneton preservation;
- plausible continuous twilight sky and horizon;
- scene ambient that follows CR2 available light;
- progressive star onset without a dark-state seam;
- no responsibility-specific result changes when merely composed; and
- explicit owner approval of the complete static sequence.

Objective result: all nine frames and both figures precede gates; changes are
exactly confined to the `99,342`-pixel CR3 geometry mask; geometry mean display
codes strictly dim `10.1716 -> 7.2662 -> 1.1335`; no geometry pixel saturates;
all uncomposed frames replay their accepted parents exactly; and protected
sources remain unchanged. The independently verified artifact-set SHA-256 is
`bc1759ab26dad40ae620d4997b2713bd7f3f283bc88721ef78fa753df7909adb`.
Runs `000059` and `000060` are sealed diagnostic-metric failures caused by an
all-zero whole-mask median. Run `000061` additionally exposes and preserves the
incorrect interpretation of CR3's pixel-major mode layout. None supersedes
corrected run `000062`.

### CR8 - Qualify the accepted candidate

Status: complete and accepted by independently verified immutable run
`000065-color-reset-qualification`.

Question: did the accepted appearance work preserve every physical and
daylight invariant it was required not to change?

Regenerate the complete current B1 figure set and current physical RMSE report,
then produce final Bruneton/candidate scene sheets and the production-source
inventory proof. This step changes no candidate equation.

The basic Bruneton color model remains an explicit selectable B1 test path.
CR8 must execute and identify that path directly; the accepted candidate may
be compared with it but may not replace, alias, or silently redirect it.

Judge success by:

- B1 Native15/Q30/cache values and accepted RMSE remain at the current
  qualified score within their existing tolerance;
- the basic Bruneton color-model option executes under its own authenticated
  identity and remains selectable for every applicable B1 test;
- all B1 figures are present even if the qualification rejects;
- declared daytime and low-Sun scenes retain Bruneton within the frozen CR4
  receiver-light-indexed preservation envelope;
- every CR7 image and identity reproduces from the frozen candidate; and
- containment, derivation, and protected-source checks pass.

CR8 accepts contained evidence only. Production adoption requires a separate
owner decision and production plan.

Accepted result: the restored B1 table is exact at SHA-256
`e6d62e23ec0184cc9941e8305d4ea9e69691cf996d5bce8523afb641830ce634`;
aggregate RMSE is exactly `11.554012538468113`, below the unchanged
`11.820391604126252` threshold; and all six standard B1 figures regenerate
byte-for-byte. `basic-bruneton` resolves independently to
`bruneton-figure1-display`, the candidate resolves to its own `slope-078/p9`
identity, and unsupported selection fails closed. Basic Bruneton scene replay
is within the established one-code CPU/GPU boundary, the candidate is exact at
solar noon, all eleven CR7 images replay exactly, and protected production
sources remain byte-identical. The independently verified artifact-set SHA-256
is `1f5fa1226d1520847fa900fea14870144e6c07f1cbecd11dc0ff4246d2b8bfe1`.
Runs `000063` and `000064` are sealed setup/oracle diagnostics and make no
qualification claim.

## Current Position

- [x] reset objective and responsibility split defined;
- [x] fixed physical and Bruneton boundaries defined;
- [x] image-first, render-before-gate, and progress-time rules defined;
- [x] independent output namespace and numbering convention selected;
- [x] CR0-CR8 increments and success decisions defined;
- [x] CR0 control-smoke accepted by `000004-control-smoke`;
- [x] CR1 complete baseline accepted by
      `000005-six-scene-visual-baseline`;
- [x] CR2 available-light inventory accepted by
      `000007-available-light-inventory`;
- [x] CR3 neutral-geometry ambient proof accepted by
      `000011-neutral-geometry-ambient-proof`;
- [x] CR4 global achromatic twilight sweep executed and diagnostic evidence
      accepted by `000013-global-achromatic-twilight-sweep`;
- [x] CR4 owner review found no row ready to select: the sunset control remains
      too dark and the middle-nautical greater sky lacks enough visible blue;
- [x] CR4A paper-reference inventory and Native15 matched/absolute comparison
      accepted by `000016-paper-sunset-reference-inventory` and
      `000019-native15-sunset-paper-visual-comparison`;
- [x] CR4B sunset pre-tone bracket accepted as diagnostic evidence by
      `000020-sunset-pre-tone-exposure-bracket`; `G = 4096` selected only for
      provisional CR4C continuation;
- [x] first CR4C sunset-to-nautical sequence rendered completely and rejected
      by `000021-sunset-nautical-pre-tone-sequence` for non-dimming sunset-to-
      plus-10 medians;
- [x] bounded two-scale CR4C response revision accepted as diagnostic evidence
      by `000022-cr4c-two-scale-sunset-nautical-pre-tone-sequence`;
- [x] CR4D bright/low-Sun preservation replay accepted by
      `000025-cr4d-bright-low-sun-preservation-replay`;
- [x] CR4E six-scene owner-review stack accepted as a presentation-only
      derivation by `000027-cr4e-six-scene-new-color-bruneton-stack`;
- [x] CR4F fine twilight cadence accepted as integrity-only owner-review
      evidence by `000032-cr4f-fine-twilight-cadence`; it localizes the sharp
      brightening to the current response's 1-lux nautical term;
- [x] CR4G slope-limited nautical response bracket accepted as sampled
      chronology/integrity evidence by
      `000033-cr4g-slope-limited-nautical-response-bracket`;
- [x] owner review identifies `slope-078` as the current visual favorite but
      requests one preservation/reference check before selection;
- [x] CR4H low-Sun cadence fields accepted as integrity evidence by
      `000034-cr4h-low-sun-cadence-acquisition`;
- [x] CR4I published-curve/smooth-shoulder replay completed and rejected as a
      candidate family by `000035-cr4i-smooth-bruneton-shoulder-check`;
- [x] CR4J complete `slope-078` six-column cadence accepted as a
      presentation-only derivation by
      `000036-cr4j-slope-078-six-column-cadence`; its owner review led to the
      bounded CR4K check;
- [x] CR4K minimal deep-twilight lift replay completed by rejected immutable
      run `000037-cr4k-minimal-deep-twilight-lift`; the `+0.15` row passes all
      gates and the `+0.30` row fails only the frozen sunset RMSE ceiling;
- [x] owner closes further exposure tuning and retains `slope-078/p9`; the
      eligible `+0.15` row offers too little visible benefit to replace it;
- [x] CR5 conditional display-capacity isolation skipped because the accepted
      CR4C twilight sequence has no black or saturated sky pixels;
- [x] CR6 stellar contrast onset predeclared as an eight-scene, 38-image
      no-new-mechanism experiment by
      `cr6-stellar-contrast-onset-v1.json`;
- [x] corrected CR6 execution preserved by independently verified rejected
      run `000044-cr6-stellar-contrast-onset`; every gate except the dark
      invisible-member color-quartile comparison passes;
- [x] CR6A one-pixel presentation calibration bracket constrained to exact
      global multipliers `1`, `2`, and `4` with a 30-image output contract;
- [x] first CR6A execution preserved by rejected, independently verified run
      `000045-cr6a-stellar-presentation-scale-bracket`; its only failed gate
      compared a GPU frame for exact identity with a CPU-authored parent;
- [x] corrected CR6A evidence accepted by independently verified run
      `000046-cr6a-stellar-presentation-scale-bracket-corrected`;
- [x] CR6A owner review rejects `1x`, `2x`, and `4x`; no appearance row is
      selected and that earlier bracket closes under its original target;
- [x] CR6B exact-brightest-2,000 catalog-only proof predeclared ahead of any
      new appearance mechanism;
- [x] CR6B exact roster and four required figures accepted by independently
      verified run `000047-cr6b-brightest-2000-catalog-proof`;
- [x] CR6C corrected one-pixel brightness relationship predeclared with
      `1x`, `16x`, and `32x` rows while freezing sky Color and exact one-pixel
      occupancy;
- [x] CR6C narrowed `1x/24x/32x` bracket accepted by independently verified
      run `000049-cr6c-one-pixel-brightness-calibration-narrowed`; native-scale
      review selects `q=24` as the lowest satisfactory one-pixel row;
- [x] stage-aware toggleable view-presentation filter registry and bounded
      CR6D stellar low-light chroma option predeclared;
- [x] CR6D identity/moderate/strong bracket accepted by independently verified
      run `000052`; moderate `0.65` is the recommended enabled state and the
      physical-color toggle remains exact;
- [x] CR6E mesopic stellar luminance option predeclared as a separate
      source-linear filter and mandatory `q=24` requalification;
- [x] CR6E physical/moderate/half/full bracket accepted by independently
      verified run `000054`; the owner approves half strength `0.5` as the
      optional enabled state and both prior toggle paths remain exact;
- [x] spectral materialization for the seven too-red members accepted by
      independently verified run `000055` without omission or clamping;
- [x] 2,000-member runtime capacity accepted separately by independently
      verified run `000057`;
- [x] larger-catalog appearance evaluated by independently verified rejected
      run `000058`; no added member becomes robust under accepted `q=24`, so
      closure retains the accepted 500-star appearance;
- [x] CR6A rejection localized to one presentation relationship and the
      owner-authorized CR6C brightness-only follow-up completed;
- [x] CR7 objective integrated sequence accepted by independently verified run
      `000062`; owner wrap-up direction supplies appearance approval;
- [x] CR8 qualification accepted by independently verified run `000065`, with
      basic Bruneton retained as an explicit independent B1 Color option.

## Immediate Next Step

The contained experimental lane is closed. Preserve run `000065` and its
parents as immutable evidence. Production adoption is now owned by the
[Production Color Reset Design](../algorithm32/production/color-reset-design.md)
and
[Production Color Reset Implementation Plan](../algorithm32/production/color-reset-implementation-plan.md).

## Closed-Lane Resume Point

The CR0-CR8 lane is complete. The remaining text in this section records the
historical pre-closure handoff that led to CR6F-CR8; it is superseded as work
instruction by accepted run `000065-color-reset-qualification` and is retained
only as completed-plan history. Resume future work from the closure facts in
the active topic, not from the historical requests below.

### Historical pre-closure handoff

CR6D's accepted authority is
`tmp/extraterrestrial/color-reset/runs/000052-cr6d-toggleable-low-light-stellar-chroma`.
Its decision is `evidence/proof.json`, complete review image is
`figures/cr6d-complete-decision-matrix.png`, and recommended cadence is
`figures/cr6d-moderate-065-cadence.png`. Authenticate it through its terminal
manifest or the color-reset verifier; never alter or reopen it. The tracked
closure is the registry and low-light owner below `stellar/`, the CR6D fixture,
browser harness, and runner. A future solar filter must receive a new id and
experiment; a physical optical solar filter belongs at `spectral-view`, while
a Sun-only display approximation cannot claim optical transmission or eye
safety.

CR6E's accepted authority is
`tmp/extraterrestrial/color-reset/runs/000054-cr6e-toggleable-mesopic-stellar-luminance`.
Its decision is `evidence/proof.json`, complete review image is
`figures/cr6e-complete-decision-matrix.png`, recommended cadence is
`figures/cr6e-mesopic-half-cadence.png`, and adaptation/S-P diagnostics are
`figures/cr6e-adaptation-weight.png` and
`figures/cr6e-stellar-scotopic-photopic-response.png`. Authenticate it through
its terminal manifest or the color-reset verifier; never alter or reopen it.
The official CIE scotopic source is preserved in the tracked CR6E fixture
closure with DOI `10.25039/CIE.DS.gr6w4b5g`; the implementation has no runtime
dependency on the retired visual-adaptation experiment.

For the next spectral-materialization increment, start from accepted immutable
run
`tmp/extraterrestrial/color-reset/runs/000047-cr6b-brightest-2000-catalog-proof`.
Its authoritative reusable roster is
`data/cr6b-brightest-2000-roster.json`, its decision is
`evidence/proof.json`, and its compact visual is
`figures/cr6b-brightest-2000-catalog-summary.png`. Authenticate the run through
its terminal manifest or the color-reset verifier; never alter or reopen it.

Other direct run artifacts are
`evidence/cr6b-current-photometry-coverage.json`,
`figures/cr6b-first-500-all-sky.png`,
`figures/cr6b-brightest-2000-all-sky.png`, and
`figures/cr6b-magnitude-by-rank.png`. All paths in this paragraph are relative
to the immutable run root above.

The tracked CR6B closure is:

- `scripts/extraterrestrial/color-reset/stellar/Cr6bBrightest2000Catalog.js`;
- `scripts/extraterrestrial/color-reset/fixtures/cr6b-brightest-2000-catalog-v1.json`;
- `scripts/extraterrestrial/color-reset/harness/cr6b-brightest-2000-catalog-browser.js`;
- `scripts/extraterrestrial/color-reset/runners/run-cr6b-brightest-2000-catalog-proof.js`.

The current 107-template Pickles/Johnson/Native15 policy spans synthetic
`B-V = -0.2991335514183669` through `1.8857631512379314`. The seven retained
catalog members are redder (`B-V = 1.97` through `2.68`), so interpolation has
no red-side bracket. This is a template-color-coverage limit, not a Native15
wavelength limit and not missing BSC position or magnitude data.

In roster order their exact `(HR, B-V)` pairs are `(868, 2.11)`,
`(8316, 2.35)`, `(1845, 2.07)`, `(4163, 2.68)`, `(2289, 1.97)`,
`(4846, 2.54)`, and `(9004, 2.60)`.

The next spectral increment has not selected a policy yet. Before execution it
must predeclare a provenance-backed treatment for the late-M/supergiant and
carbon-star cases; preserve the current result for all `1,993` already covered
members, including the exact production 500 prefix; emit one finite,
nonnegative, unit-bearing 15-channel packet for every one of the `2,000`
accepted roster members; and prove the intended Johnson B-V and V-magnitude
relationships. Its complete spectral diagnostic figures must be written before
gates. A retired stellar materializer may be inspected read-only and adapted
into a new contained implementation, but it may not be modified or become a
runtime dependency. Do not combine this with texture-capacity work, runtime
integration, point presentation, onset, or scene appearance.
