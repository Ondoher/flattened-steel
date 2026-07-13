# Sun-Disk Appearance Implementation Plan

Status: Steps 1 through 3 are complete. Step 4.0 retains and verifies Bruneton's
direct Figure-1 output mapping; the attempted extra sRGB transfer was rejected.
Steps 4.1 through 4.9 produced a qualified automatic-exposure experiment, but
Step 4.10 rejected it after retained visual evaluation found that the bounded
candidate made the two-hours-after-sunset scene resemble blue daylight.
Production publishes no exposure binding and uses the fixed Figure-1
coefficient. Step 4.11 is closed as a rejected candidate rather than a
production promotion. Step 5.1 has frozen the evidence/output boundary and
classified immutable run `000240-production-sun-appearance-paired-diagnostic`
as an operational failure with no scientific conclusion. GPU-only run `000241`
also failed operationally at aggregate profile-identity validation, and corrected
run `000242` rejected scientifically after exposing a real Flat/local
four-sample raster miss in the intended wide view. The exact screen-space
conic-overlap raster candidate is implemented and has produced the first
non-qualifying two-scene hardware-GPU development pair: both Suns now register,
but the fixed Figure-1 mapper collapses both subpixel points to essentially
white output. At the user's direction, the exhaustive Step 5.2 proof sequence
is paused while a short GPU-only visual loop applies the already-authored ACES
GLSL to those same two scenes. This does not accept Step 5.2, 5.3, or 5.4 and
does not authorize production. CPU/reference/GLSL and paired CPU/GPU work
return once, at final verification in Step 5.7. The first production
Flat/local finite-disk normal path is implemented; its remaining production
Step 9 qualification is tracked by the production integration plan.
Conservative glare is Step 6 and remains optional and separate.

Design authority: [Sun-disk appearance design](sun-disk-appearance-design.md).

## Relationship To The Production Plan

Step 6.10 first seals the current distant-Sun implementation as a reproducible
baseline by completing its type, Node, Three/WebGL, application, lifecycle, and
B1 gates. Passing those gates proves structural correctness; it does not accept
the current sunset appearance as realistic.

After that baseline, execute the distant-Sun diagnostic and default-appearance
work below before finalizing a shared glare or display response for stars. The
Flat/local implementation in production Step 9 adopts the accepted Sun
appearance policy while retaining its own finite-source cache and controller.
Alternate UI presentations follow the realistic default and are not a blocker
for the initial Sun implementation.

## 1. Seal And Capture The Current Baseline

Status: complete.

1. Complete production integration Step 6.10 without an appearance tweak.
2. Record the exact source/profile, atmosphere, observer, time, FOV, viewport,
   display configuration, and current shader/cache identities.
3. Capture San Jose at ordinary daylight, sunset minus 30, minus 20, minus 10,
   and sunset using the same camera framing.
4. Preserve raw and displayed evidence rather than screenshots alone.

**Exit:** all structural gates and the complete B1 run pass, and the weak-disk
sequence can be reproduced from one recorded configuration.

## 2. Add A Focused Radiance Diagnostic

Status: complete only for the bounded center-ray transport/display
classification. Immutable run
`000217-production-sun-disk-transport-diagnostic` captured the unchanged
production cache, production-resolution source paths, geometry support,
optical-depth families, linear RGB, and mapped RGB for all five fixed San Jose
conditions. Run `000221`
repeated the same evidence after the display change. A proposed full J4
adjacent-ray browser probe was rejected after its module-readiness path exceeded
the bounded diagnostic timeout; no failed harness was retained. These runs show
that a production-resolution direct disk remains large and warm, but neither
provides the accepted GPU disk/sky/circumsolar evidence required by Step 5. Run
`000221` imported live dirty production with a hard-coded commit label and its
stored mapped RGB does not match the restored fixed mapper, so it remains
transport evidence rather than a current display oracle.

Add a non-public diagnostic path that reports, for the selected disk and nearby
pixels:

- disk-center and maximum disk native-15 radiance;
- adjacent-sky native-15 radiance;
- photopic disk-to-sky ratio;
- approximately 1-degree disk-plus-circumsolar radiance;
- live disk coverage, horizon support, and scene visibility;
- `pathRadiance`, `celestialRadiance`, and `preDisplayRadiance` separately;
- projected linear RGB, exposure gain, mapped RGB, and final output RGB; and
- finite/overflow/clamp state at every conversion boundary.

The diagnostic consumes existing production results. It does not add a public
profile option, modify cache identity, or become a second renderer.

**Exit:** each disappearance is classified as raw-transport loss, display
contrast collapse, geometric/visibility rejection, or a measured combination.

## 3. Bound The Direct-Transport Explanation

Status: complete for the decision to leave direct transport unchanged, with a
model caveat. The physical disk cone accepts only
`0.0001031937740025381` of the normalized `g = 0.7` Henyey-Greenstein forward
energy; a one-degree cone accepts `0.0014358837300022997`. Across the retained
conditions the stored finite-disk/exact ratios change production-resolution
luminance by approximately `0.0008%` through `0.0433%`; the one-degree ratios
change it by approximately `0.0111%` through `0.6043%`. The runner used
Henyey-Greenstein while production uses Cornette-Shanks, so the final Step 5.7
CPU/reference verification repeats the comparison consistently rather than
treating those fractions as universal.
The `(1 - g)` result is much larger and remains a diagnostic bound only. Full
extinction remains production behavior.

Run three isolated calculations against exactly the baseline source paths:

1. current full molecular and aerosol extinction;
2. the reviewed `(1 - g)` total-aerosol approximation as an upper diagnostic
   bound, never as the candidate implementation; and
3. full molecular extinction and aerosol absorption, with only aerosol
   scattering reduced by the phase-function energy accepted inside a declared
   angular cone.

The third calculation requires separated aerosol absorption and scattering
optical depths. Add that separation at the atmosphere model's trusted numerical
boundary without changing the ordinary optical-depth result or its callers.
The Sun-specific candidate consumes the separated values; ordinary atmospheric
transport continues to consume the established total extinction.

Determine whether the acceptance cone represents only the physical disk or an
explicit disk-plus-circumsolar appearance region. Do not infer it from pixel size
or allow viewport resolution to change transported source energy.

**Exit:** select full extinction or one bounded apparent-source approximation
from raw disk/sky evidence. The ordinary atmosphere and complete B1 result remain
exact. If no transport candidate materially improves raw contrast, make no
transport change and proceed to display diagnosis.

## 4. Evaluate And Reject Shared Sky-Derived Automatic Exposure

Status: complete as a rejected experiment. Steps 4.0 through 4.9 implemented and
qualified the candidate; Step 4.10 rejected its visual behavior; Step 4.11
disconnected it from production while retaining the contained implementation
as historical research rather than an accepted future star design.
Color retains Bruneton's Figure-1 exponential curve and writes
its result directly at the ultimate raw-shader output. The CPU mirror, both type
checks, all 536 Node specs, and all 12 real Three/WebGL specs pass at the current
4.0 baseline. This changes no atmosphere or celestial cache. The Union Glacier
Flat-180 diagnostic still maps the transported warm spectrum to exact white
because the exponential mapper saturates all three channels.

The atmosphere-only comparison is now the mandatory standard gate
`npm run gate:algorithm32:bruneton-sky-color`. Its tracked contract and sealed
oracle identity are owned by
`scripts/extraterrestrial/fixtures/bruneton-b1-sky-color-gate-v1.json`; the
complete reference spectra remain in the checksum-pinned Bruneton rows of
`references/results/experiments/b1-directional-sky-radiance/published-models.tsv`.
Immutable run
`tmp/extraterrestrial/runs/000235-bruneton-shader-sky-color-comparison/`
proves that the current shader is correctly rejected by this gate.
It projects the Bruneton paper model and the production GPU shader's 40-channel
B1 readbacks through the same CIE 1931 / linear-sRGB calculation on all 1,377
matched rays, then applies Bruneton's direct Figure-1 output mapping. The Sun
disk is excluded. Aggregate final-display RGB RMSE is `0.0254154486`, mean CIE
1976 u-prime/v-prime distance is `0.0071864464`, and
mean absolute relative luminance error is `4.660%`. The shader is biased on
average by approximately `(+0.00764, -0.00656, -0.03026)` display RGB relative
to Bruneton: slightly redder and materially deficient in blue. Neither model
has a display channel at or above `0.999` in this B1 domain, so this matched-sky
color difference is independent of the plateau demonstrated for much brighter
retained direct-Sun inputs. Earlier order-localization run `000231` measured RGB
RMSE `0.1749263179` under the rejected extra-transfer policy; later run `000235`
measures `0.0254154486` after restoring direct Figure-1 output. These successive
runs locate the policy boundary but are not a same-run controlled ablation.

Steps 2 and 3 make display mapping the leading explanation and show that the
retained finite-angle transport alternatives are too small to be a useful
appearance correction under the selected aerosol profile. Step 5 must still
establish the normal-path disk/sky relationship. The pre-view tranche uses the
actual GPU cache and shader; the paired CPU/GPU and refined-convergence record
is deferred to final verification rather than repeated during visual work.
Leave cache construction, source radiometry, optical depth, and ordinary
`pathRadiance` unchanged; only a reference-qualified result may change the
global Color owner.

### 4.0 Retain the corrected display baseline

Status: complete.

Retain the direct Figure-1 output and the HDR captured-scene bridge. Do not
restore the rejected output sRGB transfer or introduce a disk-specific peak
normalization. Preserve the current CPU/shader parity and the measured
`0.0254154486` pre-exposure sky-color comparison baseline.

### 4.1 Define the production exposure contracts

Status: complete. Ambient contracts now define the immutable geometry-owned
meter plan and samples, the optional geometry capability, the exact
`color.skyExposureCoefficientTexture` binding, explicit measurement and
resource diagnostics, instantaneous/smoothed temporal modes, the required
renderer surface, and the Color-owned runtime resource lifecycle. The fixed
resource intentionally has no viewport resize contract. Explicit inspection is
the only diagnostic readback seam; normal rendering remains GPU-resident. No
runtime class, shader contribution, public configuration, cache, or display
behavior changed. Algorithm32 and Flat32 type checks pass. The complete 17-case
GPU B1 regeneration remains accepted at aggregate RMSE `11.820392` with boundary
SHA-256 `d366ba11a0697aa471f8a822da9ccc9964a67bfcfb18cad0764de62a33583a7f`.

Add ambient contracts for:

- a geometry-owned observer-upper-hemisphere meter plan;
- one runtime-owned sky-exposure resource;
- the one-pixel exposure texture binding;
- exposure diagnostics containing measured sky illuminance, target exposure,
  effective display coefficient, bounds, and temporal state; and
- runtime lifecycle operations needed to render, inspect, resize when relevant,
  and dispose the resource.

The public Algorithm32 configuration does not accept arbitrary meter rays,
reference luminance, bounds, or source-specific exposure. The initial policy is
an internal immutable Color/Geometry contract.

**Exit:** type checking proves one owner for every meter, binding, lifecycle, and
diagnostic value without changing runtime behavior.

### 4.2 Implement the geometry-owned sky quadrature

Status: complete. Shared geometry support now constructs the fixed four-ring by
eight-azimuth observer-local midpoint quadrature directly from each ring/column
coordinate. Flat and spherical geometry implement the same optional capability
and return the same ring-major plan without camera, FOV, viewport, source, or
geometry-shape input. Focused CPU proofs establish 32 unit directions, positive
equal-solid-angle and projected weights, numerical agreement with the exact
analytic `pi` uniform-radiance integral, stable ordering, fresh plan identity,
and equivalence across differing Flat and spherical configurations. Both type
checks, all 531 Algorithm32 Node specs, formatting, and whitespace checks pass.
The complete 17-case GPU B1 regeneration remains accepted at aggregate RMSE
`11.820392` with boundary SHA-256
`d366ba11a0697aa471f8a822da9ccc9964a67bfcfb18cad0764de62a33583a7f`.

Provide the same physical metering definition from Flat and spherical geometry:
a camera-independent upper-hemisphere, equal-solid-angle midpoint quadrature in
`mu = cos(theta)`, initially four rings by eight azimuths. Its projected weights
must integrate uniform radiance to exactly `pi * L`.

Generate sample directions analytically from the fixed 8-by-4 sample pixel
coordinate where practical. Avoid embedding dynamically indexed direction
arrays that force shader-loop unrolling. Geometry supplies only its physical
observer frame and atmosphere-boundary behavior; it does not own Color exposure.

**Exit:** CPU proofs establish unit directions, positive weights, exact `pi`
uniform integration, camera/FOV/viewport independence, and equivalent local and
distant definitions.

### 4.3 Add the Color-owned photopic meter projection

Status: complete. `BrunetonColorDisplayModel` now owns one CIE 1931 y-bar,
declared-channel-width, and `683 lm/W` projection for every accepted spectral
basis. Channel widths enter exactly once in both the CPU authority and the GLSL
weights. Native-15 and the exact direct-40 Bruneton comparison basis pass
independent nonuniform spectral controls. The shader helper accepts only a
`SpectralValue`; the meter's sample main supplies only `state.pathRadiance`.

Add one trusted spectral-radiance-to-photopic-luminance projection derived from
the configured spectral basis, CIE 1931 observer data, declared channel widths,
and `683 lm/W`. Apply channel widths exactly once. The meter evaluates ordinary
atmospheric `pathRadiance` only: no Sun disk, stars, `celestialRadiance`, captured
scene, blockers, or endpoint material enters the adaptation statistic.

**Exit:** CPU basis-packet and uniform-radiance proofs match independent
photopic calculations for Native-15 and the Bruneton comparison basis.

### 4.4 Render the sky samples into a small HDR field

Status: complete and installed through Step 4.7. `SkyExposureRuntime` derives an atmospheric-only
meter main from accepted assembled transport source. Each fragment analytically
derives one local direction from its 8-by-4 pixel coordinate, evaluates one
ordinary atmospheric ray, projects only `state.pathRadiance`, and writes one
`R32F` luminance texel. It contains no direction array and no 32-ray fragment
loop. The resource reports all three shader source sizes and complete program
preparation duration, and uses the existing real GPU timer-query owner for
per-pass sample, reduction, and coefficient measurements. Real WebGL proves all
32 luminance texels against independent analytic rays with no WebGL error. The
runtime wiring supplies the accepted live atmosphere, geometry, light-source,
and resident-cache uniforms without rebuilding a cache.

Create a Color-owned runtime pass that renders one ordinary atmospheric ray per
sample texel into an 8-by-4 `R32F` target. Reuse accepted geometry, atmosphere,
light-source, and completed scattering-cache bindings. Do not rebuild a cache or
run celestial evaluation for the meter.

Derive a focused meter shader from the accepted assembly or a dedicated subset
without copying the atmospheric algorithm. It must evaluate transport once per
sample fragment, not invoke all 32 rays inside one fragment. Measure shader
source size, compile/link time, and per-frame GPU time; reject a structure that
reintroduces forced large-loop unrolling or the previous long shader-setup
regression.

**Exit:** real WebGL readback matches CPU-selected sky rays, remains finite in
bright and twilight scenes, and shows no celestial or scene contribution.

### 4.5 Reduce the field to one exposure coefficient

Status: complete. One `R32F` reduction target integrates the 32
sample texels with analytically derived projected solid angles. A second
one-pixel `R32F` target publishes the established Figure-1 coefficient times
the clamped exposure factor while the first target retains measured `E_v` for
explicit diagnostics. Step 4.9 places that instantaneous calculation behind the
accepted two-target temporal history. Normal rendering performs no readback and
restores the caller's render target. CPU and real-WebGL calculations agree at `15,329`,
`1,421`, `252`, `7.99`, and `0.0398 lux`, at the minimum-exposure clamp, and at
the zero-lux maximum-exposure clamp. Repeated disposal releases every target,
material, geometry, and timer exactly once.

Use a simple one-pixel GPU reduction over the 32 luminance texels. Accumulate
projected sky illuminance `E_v`, then compute:

```text
rho = 0.18
E_ref = pi * [-ln(1 - 0.18)] / (K * rho) ~= 11,828 lux
E_floor = E_ref / 16,384
grayCardExposure = E_ref / max(E_v, E_floor)
pupilAreaExposure = [D(E_v) / D(E_ref)]^2
exposure = clamp(min(grayCardExposure, pupilAreaExposure), 1 / 64, 16,384)
effectiveDisplayCoefficient = K * exposure
```

`D(E)` is the fixed Watson-Yellott binocular light-adapted pupil equation for
their `28.58`-year reference observer and the upper-hemisphere adapting-field
area. The coefficient pass evaluates it once; the normal shader still fetches
only the resulting scalar.

Store the coefficient in a one-pixel `R32F` texture. Keep `E_v` available in a
diagnostic channel or separate diagnostic target without requiring a normal-
frame GPU-to-CPU readback. The `1 / 64` and `16,384` limits are provisional
qualification values, not human-vision constants.

**Exit:** GPU and CPU coefficient calculations agree within the declared
floating-point tolerance at the retained `15,329`, `1,421`, `252`, `7.99`, and
`0.0398 lux` controls and at both clamp boundaries.

### 4.6 Apply the coefficient once at the Color boundary

Status: complete. Color declares one required `R32F` one-pixel coefficient
texture and performs one constant-location fetch after completed scene-linear
composition. The CPU mirror accepts the same positive effective coefficient.
No atmospheric, celestial, visibility, or cache calculation changed.

Bind the one-pixel coefficient texture through Color. After atmosphere, Sun,
stars, and captured geometry have formed one completed scene-linear RGB value,
apply the same coefficient through the existing Figure-1 expression:

```text
displayRgb = 1 - exp(
  -max(sceneLinearRgb, 0) * effectiveDisplayCoefficient
)
```

Do not apply exposure independently to spectral components, apply a second
output transfer, normalize a pixel, inspect source identity, or change a cache.
The normal main shader performs one constant-location texture fetch and one
scalar multiplication beyond its existing display work.

**Exit:** CPU and shader output agree for atmosphere-only, distant Sun,
Flat/local Sun, stars where enabled, and captured-scene composition. Blocking a
Sun changes its contribution but not the exposure statistic.

### 4.7 Integrate runtime ordering and lifecycle

Status: complete. `ShaderRuntimePass` owns one typed pre-render callback after
live-uniform refresh. `ShaderRuntimeInstaller` constructs the Color-owned meter,
installs its binding before required-binding validation, prepares its three
programs before the normal program, runs it immediately before Color, includes
its diagnostics, and disposes it on replacement, failure, or repeated teardown.
Normal frames perform no readback or cache construction.

Run sample and reduction passes after live uniforms and resident cache bindings
are current and immediately before the normal Color pass. Add the smallest typed
pre-render seam to the runtime pass/installer; do not put meter orchestration in
the application. Preserve render targets across ordinary frames, restore the
caller's render target after each meter pass, survive context restoration and
configuration replacement, and dispose every meter resource exactly once.

**Exit:** first-frame, replacement, supersession, failure cleanup, context
restoration, and repeated-disposal proofs pass without a synchronous readback or
cache reconstruction.

### 4.8 Qualify instantaneous exposure before temporal adaptation

Status: complete. Before history was enabled, real WebGL matched all 32 analytic
sample rays, projected illuminance, and the retained `15,329`, `1,421`, `252`,
`7.99`, `0.0398`, minimum-clamp, and maximum-clamp controls. The static curve was
accepted: it dims bright sky, raises twilight, and exposes a sufficiently
attenuated low Sun without inspecting the Sun or scene.

First render with the exact current-frame coefficient so spatial and radiometric
behavior can be verified without history. Capture the coefficient, sky
illuminance, disk/adjacent-sky linear values, and final RGB for the fixed San
Jose and Union Glacier sequences. Confirm that bright scenes can be dimmed,
twilight can be raised, and a high Sun may remain realistically overexposed.

Do not require the disk to remain visible. Require a sufficiently attenuated
low-Sun disk to become visible when its raw contrast lies inside the adapted
range. If a displayable warm disk still becomes accidental exact white, record
that as a separate global highlight-color problem rather than tuning exposure
to the disk.

**Exit:** one static exposure curve is accepted or rejected from measured local
and distant results without temporal behavior hiding a defect.

### 4.9 Add one-pixel temporal adaptation

Status: complete. The coefficient stage now uses two one-pixel `R32F` targets,
deterministic first-frame initialization, stop-space smoothing, `0.5 s` reducing
and `2 s` increasing time constants, and a `0.25 s` maximum accepted frame
delta. CPU and real-WebGL controls prove monotonic bounded updates and
frame-rate-independent convergence within R32F tolerance. History remains a
runtime resource and does not enter any model, shader, or cache identity.

After Step 4.8 accepts the static curve, retain exposure history in a one-pixel
ping-pong resource and smooth in stop space:

```text
nextStops = currentStops
  + (targetStops - currentStops) * (1 - exp(-deltaTime / tau))
```

Start qualification at approximately `0.5 s` when reducing exposure for a
brighter scene and `2 s` when increasing exposure for a darker scene. These are
provisional presentation values. Clamp caller delta time at the runtime timing
boundary, initialize deterministically on the first frame, and prevent history
from entering model, cache, or shader identity.

**Exit:** step changes are monotonic, bounded, frame-rate independent within
tolerance, free of oscillation, and converge to the exact Step 4.8 target.

### 4.10 Run the shared visual and numerical gates

Status: rejected. The first visual pass treated the luminous sky as an 18% gray
subject and underexposed daylight. Adding the missing diffuse-reflectance term
fixed noon but exposed the reciprocal curve's second defect: it amplified the
retained sunset control by `8.32x` and made sunset nearly white. The replacement
uses the lesser of the gray-card exposure and the Watson-Yellott pupil-area
response. It retains `0.772x` at the `15,329 lux` daylight control while limiting
the `1,421 lux` sunset control to `1.136x` and complete darkness to approximately
`13.56x`. The corrected complete 538-spec Node lane and 12-spec real-WebGL lane
pass, and a fresh San Jose N4 sequence is retained under the
production-integration output root. The retained two-hours-after-sunset control
then showed that even the bounded response can amplify residual atmospheric
radiance into a false blue daytime sky. Production therefore disconnects the
coefficient texture and meter runtime and restores the fixed Figure-1
coefficient. The implementation remains contained for future star work.
The corrected complete GPU B1
regeneration retains aggregate RMSE `11.820392` mW
and table SHA-256
`d366ba11a0697aa471f8a822da9ccc9964a67bfcfb18cad0764de62a33583a7f`.

The current visual sequence remains rejected. San Jose disk visibility is lost
at sunset minus 30, appears weakly at minus 20 through severe channel
saturation, and reaches code RGB `[255, 255, 0]` at minus 10 beside a sampled
sky value near `[255, 254, 80]`. Those screenshots retain code values but no
paired raw luminance or declared framebuffer transfer; they do not prove that
the disk has lower emitted display luminance. Any replacement highlight mapping
must establish and then preserve disk-to-adjacent-sky ordering through the
complete output path without a Sun-specific gain or color branch.
Matched Bruneton run `000235` reproduces the prior display RGB RMSE
`0.0254154486`, mean u-prime/v-prime distance `0.0071864464`, and mean absolute
relative luminance error `4.660%`: the pre-existing transport delta remains,
but exposure causes no regression. Production N4 captures cover San Jose solar
noon, sunset minus 30/20/10 minutes, and sunset; spherical/distant Union Glacier;
and Flat/local 0, 135, and 180 distance controls. Setup remains dominated by the
existing cache transaction at approximately `33.1` to `41.1 s`; the exposure
passes add no cache rebuild. Captures and logs are under
`tmp/extraterrestrial/production-integration/`.

The rejected candidate was evaluated with:

1. San Jose daylight, sunset minus 30, minus 20, minus 10, and sunset;
2. Union Glacier local and distant controls, including Flat 180;
3. local close, medium, and long source distances;
4. horizon, partial coverage, partial blocker, and full blocker cases;
5. bright-to-dark and dark-to-bright adaptation transitions;
6. complete Node and real Three/WebGL lanes;
7. complete GPU B1 transport regeneration; and
8. the matched Bruneton sky-color gate.

B1 spectral RMSE remained unchanged because exposure did not alter transport.
The Bruneton comparison applied one oracle-derived coefficient to both datasets
and therefore did not conceal the transport delta. Production has no automatic-
exposure behavior after rejection.

**Exit:** rejection is complete, the fixed production coefficient is restored,
B1 transport is unchanged, and the retained exposure implementation has no
production binding or execution path.

### 4.11 Close the rejected automatic-exposure tranche

Status: complete as a rejection. Color publishes no exposure texture or binding,
so the production installer neither constructs nor executes the retained meter
runtime. The fixed Figure-1 coefficient is restored. Any future star-adaptation
work must re-enter through a separately accepted design rather than silently
reactivating this policy. Algorithm32 type checking, all 538 Node specs, all 12
real Three/WebGL specs, and the complete 17-condition GPU B1 regeneration pass;
B1 remains `11.820392` mW m^-2 sr^-1 nm^-1 with unchanged table SHA-256
`d366ba11a0697aa471f8a822da9ccc9964a67bfcfb18cad0764de62a33583a7f`.

Do not add glare, bloom, limb darkening, refraction, an exposure slider, or a
solar-filter mode in Step 4. Those features must not compensate for an
unresolved direct-disk or exposure defect.

**Step 4 exit:** the candidate is rejected without an atmospheric or B1 change.
Production uses the fixed Figure-1 coefficient. Low-Sun visibility and
highlight/gamut behavior remain open and may not be solved with the rejected
meter or a source-specific rule.

## 5. Qualify One ACES 2 Global Output-Transform Candidate

Status: active. Step 5.1 is complete as an evidence/output boundary and records
the operational failures and scientific rejection through run `000242`. Step
5.2a's evidence controls are statically closed, and the Step 5.2b candidate is
implemented, but its immutable proof and the canonical Step 5.2c ledger are
paused. The active executable is the non-qualifying short GPU visual loop
recorded in the
[short-loop state](sun-disk-appearance-short-loop-state.md). The pre-final
visual lane is GPU-only. This is one bounded candidate, not
permission to compare or tune multiple tone mappers. The authoritative
architecture and claim limits are owned by the [Sun-disk appearance
design](sun-disk-appearance-design.md#6-selected-global-output-transform-candidate).

### 5.1 Freeze the executable evidence and output contract

Status: complete for the boundary; no scientific evidence is accepted from the
first execution. Before changing Color, keep one focused self-verifying
diagnostic under `scripts/extraterrestrial/` and allocate every generated
record under `tmp/extraterrestrial/`. Do not create an experimental unit-test
tree. Each run hashes every executed production, runner, and fixture file, the
assembled fragment shader, selected profile and cache identities, dependency
lock, and dirty-worktree inventory. Record browser, GPU, renderer,
render-target formats, color-management configuration, default-framebuffer
behavior, and image-export path. Every allocated run reaches accepted,
rejected, or failed terminal state.

Immutable run `000240-production-sun-appearance-paired-diagnostic` is verified
`operational-failed`. It retains 67 artifacts totaling 14,675,300 bytes at
artifact-set SHA-256
`cbce14c9ea1ebc652db200cea8e2eb0aa058551045127e555dd8fc25c56da63b`.
All five distant conditions completed, while all three Flat conditions reached
the approximately `4,500,000 ms` absolute shard limit while their CPU work was
still advancing. Two concurrent CPU-heavy Chrome shards also made the host UI
unresponsive. The fixture identity changed during execution. The run therefore
contains neither `gates.json` nor a complete aggregate and supports no
raw-order, CPU/GPU-parity, ACES, or appearance conclusion. Production is
unchanged.

Immutable run `000241-production-sun-appearance-gpu-visual-evidence` completed
all eight hardware-GPU browser shards but is verified `operational-failed`
because its executed fixture named the production profile `native-15` while
the producer reported `algorithm32-native-production-default-v1`. Its 59
artifacts total 1,580,297 bytes at artifact-set SHA-256
`dd44ea2da3bb80b808b7506a5abee1a389602f00af5c6c9edd0ba3f4c981653c`.
The completed shard payloads are not accepted or reused.

Immutable run `000242-production-sun-appearance-gpu-visual-evidence` is a
complete scientific rejection. Its 82 artifacts total 11,527,345 bytes at
artifact-set SHA-256
`722a2a103b83386a94a7f220e242faab8708dc6312b31e56ce65abbfe2f858d7`.
It established hardware-GPU execution, sealed executable closure, 8 conditions,
2 viewports, 104 unique rows, exact float32 spectral composition, expected
cache/source routes, and 144 nominal pair identities. Only 135 pair identities
had positive disk coverage and positive direct celestial Y; all 135 were
strictly ordered. Nine wide-view Flat disk labels had zero disk contribution,
so `144/144` is not an accepted disk-order result. The retained Flat-long wide
diagnostic image contains no visible disk.

Run `000242` also exposed three evidence-control defects. Its transparent
fullscreen sentinel did not establish a transfer; three normal framebuffer
codes matched PNG exactly but differed by one code from the mapper32 round-Q8
prediction; and two Flat placement/radial expectations were overprecise or
internally inconsistent. Correct the controls without reclassifying that run:
use a proven no-dither transfer probe, a declared one-code normal-framebuffer
envelope with exact PNG-to-framebuffer equality, a one-meter authored placement
bound, and strict actual-center-to-cache-radius identity.

Replace absolute progress aborts with two distinct controls: frequent progress
heartbeats and a declared inactivity timeout. A run with measurable forward
progress is not aborted merely because an elapsed-time estimate is exceeded.
Pre-final GPU runs use one browser and one condition shard at a time unless a
measured lower-impact configuration proves it leaves CPU and memory headroom
for the interactive UI. Final CPU-heavy verification uses concurrency `1`,
below-normal process priority where the host supports it, and an explicit CPU
and memory reserve. These controls govern runners; they do not weaken any
scientific gate.

Freeze these distinct output stages:

1. completed native spectrum and scene-linear RGB;
2. raw mapper float output;
3. offscreen render-target readback;
4. default-framebuffer readback; and
5. PNG or screenshot code values.

Declare the transfer function and effective quantizer at each boundary. For an
unsigned normalized `b`-bit target, use the recorded implementation of:

```text
Q_b(x) = round((2^b - 1) * clamp(x, 0, 1)) / (2^b - 1)
```

Do not infer an sRGB transfer from the `linear-srgb` descriptor or append one to
make the output look familiar. Direct CIE Y is the physical ordering authority
before display conversion. RGB luma after encoding is an output-ordering metric,
not calibrated emitted display luminance unless the display EOTF is declared.

Establish the transfer with two routes. The deterministic route disables
WebGL `DITHER`, verifies the current program, a nontransparent fullscreen draw,
RGBA32F values, GL state, and context attributes, and requires exact
round-to-nearest Q8 framebuffer and direct-PNG codes for one supported transfer.
Restore the measured prior DITHER state before the normal scene route. The
normal default framebuffer may differ from the deterministic prediction by at
most one code, while its direct PNG export must equal the measured framebuffer
exactly. A draw, program, context, GL, ledger, DITHER-disable, or
DITHER-restoration failure is operational; a valid measured transfer outside
the frozen supported contract is a scientific boundary rejection.

**Exit:** the contract identifies the exact executable source and every
rendering, encoding, and quantization boundary; the operationally failed run is
retained without being treated as science; and the next run starts from one
unchanged, pre-hashed fixture identity. Run `000221` mapped RGB is excluded from
the current display oracle.

### 5.2 Repair the Flat raster and acquire the GPU evidence used before viewing

Status: active but formally paused after implementation of the selected
candidate. Step 5.2a is statically ready. Runs `000241` and `000242` are terminal
and preserved; neither authorizes ACES or a production change. Step 5.2b's
contained conic-overlap shader and proof runner are statically ready but not
accepted. A non-qualifying hardware-GPU development run at the unchanged wide
viewport now shows the medium and long Suns at the aimed pixel, while the fixed
Figure-1 mapper renders both as essentially identical white subpixel points.
The short visual loop therefore tests the unchanged contained ACES GPU shader
on the same pair before spending more time on qualification. Step 5.2b still
must accept before the canonical Step 5.2c ledger or any production change.
Do not increase the evidence resolution to hide the wide-view miss, try a
center/full-coverage fallback, or compare another sampler if the selected
candidate rejects.

#### 5.2a Close the evidence-control defects

Use the corrected two-route output contract from Step 5.1. Freeze the actual
production profile identity at ingress, validate each browser shard
operationally before starting the next, hash only deterministic output facts
across shards, and compare every normal framebuffer/PNG row inside its declared
envelope. Recompute every raw pair from its recorded sample rows in the host
runner. Preserve exact source radiance, authored physical radius, spectral
basis, fixed Figure-1 constants, hardware renderer identity, served/executable
closure, complete protected-root identity, and direct PNG path.

**Exit:** static review, syntax, formatting, fixture parsing, closure, and diff
integrity pass. This substep authorizes only the focused proof; it is not a
scientific result.

#### 5.2b Prove one exact Flat/local finite-disk raster

Add one contained proof-only Flat contribution after the unchanged production
result. For each pixel, reconstruct the affine unnormalized model ray, form the
exact forward finite-sphere screen conic, complete it to an ellipse, and compute
the circle-convex-pixel overlap. Publish `analyticCoverage` separately from the
four quarter-ray disk-hit mask. Let `diskHitCount` count geometric ray/body hits
before scene blocking and `visibleTransportCount` count their visible subset.

When `diskHitCount > 0`, scale the existing visible production celestial
spectrum by `analyticCoverage / (diskHitCount / 4)`. Blocked hits stay in the
denominator. When analytic coverage is positive but the four rays all miss,
evaluate one source-center transport ray only if the current output pixel's
scene-hit texel is clear, then weight that spectrum by analytic coverage. The
fallback direction supplies only radiance/transmittance; it does not take
visibility from a neighboring projected source-center pixel. Retain exact zero
outside support, the current source/cache/atmosphere path, and one
`pathRadiance + celestialRadiance` composition. The eventual candidate performs
at most four transport evaluations per pixel; the contained proof records the
unchanged production control and any one additional fallback evaluation
separately.

Run one immutable hardware-GPU proof for Flat medium and long at the unchanged
`641 x 401 / 78-degree` and `961 x 541 / 50-degree` viewports. Use a bounded
5-by-5 tile and source-center phase offsets `0`, `0.25`, `0.5`, `0.75`, and `1`
pixel. Include clear, full-blocked, and fixed partial-edge-blocked cases;
Flat-close full-coverage non-regression; and a distant-family shader/resource
non-regression control. Use an independent bounded binary64 direct ray/sphere
subdivision only as a geometry oracle. Do not separately invoke the CPU N4
atmospheric-scattering/cache authority, run refined source-path convergence,
render a CPU full frame, or persist a visual candidate. The sealed normal
distant-GPU builder's bounded 11-by-13-by-15 binary64 direct-celestial
reference/support helper remains part of GPU setup and is recorded explicitly;
it is not the deferred CPU-heavy scene lane.

Require exact/declared gates for:

- analytic coverage versus the independent oracle, conic coefficients,
  conditioning, forward-half-space clipping, clamp residuals, and `[0, 1]`;
- phase continuity, exact empty/full controls, and one-pixel-shift invariance;
- coverage-normalized candidate celestial spectrum across viewports and
  5-by-5 tile-integrated `celestialRadiance * pixelSolidAngle` energy;
- geometric-hit versus visible-count blocker semantics, including the partial
  edge blocker, and exact full-block suppression;
- unchanged source-cache spectrum, ordinary path, cache/resource/binding
  identity, and single float32 composition;
- bounded shader growth, program preparation, hardware renderer, and no new
  GPU resource; and
- Flat-close equivalence plus exact absence of the proof contribution from the
  distant shader.

Use serial browser execution, advancing work heartbeats, and an inactivity-only
watchdog. A malformed apparatus or environment is `failed`; a complete red
numerical, energy, continuity, blocker, or non-regression gate is `rejected`.
On rejection, stop for raster redesign without trying another candidate.

**Exit:** one accepted immutable focused record authorizes integration of the
same analytic raster into the canonical capture controls. No output-transform
or appearance claim is made.

#### 5.2c Acquire the canonical GPU disk and circumsolar ledger

Instrument the normal production GPU cache, analytic live raster, and shader
pipeline without adding a public diagnostic or second renderer. Do not
separately invoke the binary64 N4 atmospheric-scattering/cache field, run
refined CPU source-path convergence, or render a CPU full-frame preview during
this pre-final visual tranche. Those
authorities return once in Step 5.7. For each sample retain:

- `pathRadiance`, `celestialRadiance`, and `preDisplayRadiance`;
- native spectrum, CIE XYZ, and direct CIE Y;
- signed linear RGB, mapper float RGB, and all Step 5.1 output stages;
- analytic disk coverage, quarter-ray geometric hit mask/count, visible
  transport mask/count, applied weight/fallback route, horizon support, scene
  visibility, cache generation, and lookup stencil; and
- the actual GPU cache value, shader-stage values, framebuffer stages, and
  final codes under the frozen output contract.

The spherical/distant grid is San Jose solar noon, sunset minus 30, minus 20,
minus 10, and sunset. The Flat/local grid uses close, medium, and long source
distances. Each condition samples disk center, an inside-limb point fixed at
`0.95` apparent radii, and `0.5`, `1`, and `2` degrees from disk center. At low
elevation, take circumsolar samples both zenithward and along equal elevation.
Repeat at two declared FOV/viewport combinations and retain all four live
transport subsamples plus analytic coverage so raster support is not confused
with Color behavior. Execute the
conditions serially in a single browser/shard lane and preserve UI resource
headroom under the Step 5.1 policy.

Use production Cornette-Shanks phase behavior consistently. Measure the actual
GPU cache and report the retained exact-sunset cache/path discrepancy as an
unresolved fact rather than correcting it in Color. This pre-final record does
not relabel the GPU path as numerical ground truth; the 20-interval CPU path and
refined convergence sequence are final-verification authorities.

Build a sealed pair ledger from raw CIE Y. Resolve each comparison back to its
recorded rows and recompute its identity, membership, margin, validity, and
ordering in the host runner. A disk row is evidence only when analytic coverage
and direct celestial Y are both positive; all 144 required pairs must be valid
and strictly ordered. Require
`pathRadiance + celestialRadiance = preDisplayRadiance` within a declared
float32 tolerance and require geometry, coverage, and visibility to agree with
the normal live raster. Across Flat viewports, compare ordinary path spectrum,
coverage-normalized candidate celestial spectrum, and tile-integrated
celestial-radiance solid-angle energy; do not require unresolved center-pixel
`preDisplayRadiance` to be identical across different pixel footprints. If a
required low-Sun disk does not have greater raw Y
than its paired sky, route that case to transport/circumsolar work and exclude it
from the display-recovery claim.

**Exit:** one accepted immutable GPU record classifies every required pair
before display work and supplies the fixed calibration and holdout inputs for
the sole candidate. It makes no CPU/GPU-parity or refined-convergence claim.

### 5.3 Freeze the official ACES candidate and reference tools

Pin the official ACES release
[`v2.0.0+2025.04.04`](https://github.com/aces-aswf/aces/releases/tag/v2.0.0%2B2025.04.04)
at release commit `35e1e6ac2c26ec75433547d5d0a3a881f39bd9f5`, including
its exact submodule identities, reference CTL, tables, and custom AMPAS
`License Terms for Academy Color Encoding System Components`. Preserve the
required notices, conditions, disclaimer, and trademark restrictions. The
submodule-inclusive release ZIP is asset `243655543`, 316,810 bytes, with
locally measured SHA-256
`b9a7eb69dc57e1732b2bd63a060a94ad10fb9c61de2cdc33055f95594a3b08fa`;
GitHub publishes no digest for that asset. Add the official release and
technical documentation to the canonical repository references before
production formulas cite them.

Freeze one candidate configuration:

- current production spectral projection and CIE XYZ;
- normalized D65 scene RGB equal to the current signed linear RGB multiplied
  once by the fixed `DISPLAY_TONE_MAP_K` coefficient;
- the official conversion to ACES2065-1 with no project-authored pre-clamp;
- the released ACES 2 core algorithm and default parameters;
- D65 creative white and a 100-nit Rec.709 rendering target; and
- the one display encoding identified and sealed by Step 5.1 from the renderer
  contract.

The fixed coefficient is scene normalization, not automatic exposure. It does
not vary with source, time, camera, local pixels, or the rejected meter. A fixed
official lookup table or cusp table is permitted only as part of the pinned core
and becomes hashed Color-owned constant data. A generated 3D LUT substitute,
custom shoulder, alternate gamut mapper, or comparison against Reinhard, Hable,
AgX, or another ACES parameter set is outside this candidate.

The official core is not clamp-free. At the 100-nit preset it converts AP0 to
AP1 and clamps AP1 components to the released `[0, 1024]` forward domain before
the JMh rendering operations; the output transform later bounds target RGB
before encoding. Preserve those operations unchanged and record their lower and
upper clamp masks. “No pre-clamp” in this plan means no additional project
clamp of signed linear Rec.709/D65 or ACES2065-1 input.

The fixed decision fixture
`scripts/extraterrestrial/fixtures/production-sun-appearance-paired-v1.json`
predeclares 144 pixel pairs and 576 raster-subsample pairs, split into 84
calibration and 60 holdout pixel pairs. Its two viewports, radial orientations,
convergence ladder, tolerances, official forward-limit policy, candidate
identity, and non-regression limits are frozen before execution.

Freeze the official reference CTL as the bounded numerical authority, the
pinned OCIO implementation as a cross-check rather than a second oracle, and
one contained faithful ACES GLSL implementation. Record their complete source,
binary, compiler/runtime, license, table, and executable dependency identities.
Reference execution in this tranche is limited to sample packets and fixed
numerical sweeps; it does not generate a CPU full-frame preview.

**Exit:** one manifest seals the complete reference package, color conversion,
global scale, rendering target, display encoding, parameters, and calibration /
holdout partition before candidate images are viewed.

### 5.4 Qualify the contained GLSL against the bounded reference decision

Execute the official reference transform against the GPU-acquired paired
samples and a fixed grid covering neutrals, hue sweeps, saturation sweeps,
negative target-RGB coordinates, zero crossings, gamut cusps, and finite values
from black through at least twice the largest measured Sun input. Keep
calibration and holdout records separate. Cross-check the bounded CTL result
with the pinned OCIO path, then require the contained real-WebGL ACES GLSL to
match the reference within predeclared absolute, relative, and ULP tolerances
and to produce identical final quantized codes for every sealed pair and
holdout anchor. Visual judgment may not select or change a parameter.

Require:

- finite, continuous output over the qualified signed domain;
- the released J tone scale to remain continuously increasing on the official
  `[0, 1024]` 100-nit forward domain, with only continuous nondecreasing
  behavior required on inputs legitimately flattened by the official upper
  clamp;
- no hidden project-authored clamp before the official core, while recording
  the official AP1 lower/upper clamp masks separately;
- continuous model-hue and colorfulness behavior through negative-blue and
  upper-gamut crossings;
- strict post-rendering-target Y ordering for every pair with sealed raw
  `Y_disk > Y_sky` in the declared low-Sun envelope;
- no new center-to-`2`-degree radial inversion or local halo;
- nonidentical, noninverted output for each designated low-Sun pair after the
  Step 5.1 encoding and quantization; and
- the same fixed transform applied to both sides of the matched Bruneton
  comparison, retaining or improving RGB RMSE `0.0254154486`, mean u-prime /
  v-prime distance `0.0071864464`, and mean absolute relative luminance error
  `4.660%`; and
- no candidate view generation until all reference, GPU-vs-reference,
  raw-order, radial-order, encoding, quantization, and non-regression gates are
  accepted.

High-noon code-value white is permitted, but its rendering-target ordering may
not invert. ACES model `h` is a correlate rather than an exact perceived-hue
oracle, and the complete gamut transform need not preserve physical CIE Y
exactly; the pair ledger tests the resulting facts directly.

Bounded CTL/OCIO sample execution is permitted here because it establishes the
numerical authority. CPU N4/cache/refined convergence and CPU full-frame visual
generation remain excluded until Step 5.7.

**Exit:** the sealed reference candidate and its contained faithful GLSL either
pass every numerical gate and become eligible for GPU views or are terminally
rejected. Rejection leaves production on the fixed Figure-1 mapper and ends
Step 5 without trying another curve.

### 5.5 Produce the first GPU-only candidate views

Only after Step 5.4 passes, render the fixed local and distant inspection views
through the contained faithful ACES GLSL and the normal GPU shader stages. Use
the Step 5.1 single-browser/single-shard resource policy, actual framebuffer
encoding, and image export. Do not invoke a CPU full-frame renderer, regenerate
CPU N4/cache fields, or run refined convergence for visual inspection.

Judge whether the unchanged candidate produces a believable disk, sky, and
circumsolar relationship at daylight, the retained low-Sun sequence, and the
Flat close/medium/long cases. Visual review may accept or reject the sealed
candidate but may not tune its scale, parameters, tables, encoding, or shader.
An unnaturally isolated but numerically ordered disk routes to Step 6 glare; a
stair-stepped limb routes to raster sampling; either route remains distinct
from Color.

**Exit:** the first viewable artifact set is either accepted as an unchanged
appearance candidate for production porting or rejects the candidate without
parameter or curve shopping.

### 5.6 Port the accepted core once at Color

Only after Steps 5.4 and 5.5 pass and the unchanged views are accepted for
continuation, implement the pinned core and bounded CPU mirror under the
existing Bruneton Color feature owner. Authoring the mirror here does not
authorize CPU full-frame or heavy scene generation before Step 5.7. Split
coherent transform, conversion, and fixed-table responsibilities rather than
pushing the existing Color class past the repository file-size limit. Preserve
the pinned equations, constants, and operation order; describe the result as
exact ACES 2 only if it matches the released input convention, preset, core,
and output encoding.

Apply the transform once after captured scene, atmosphere, and celestial inputs
form the completed scene-linear RGB. Add no exposure texture, reduction pass,
history, source lookup, time branch, Sun identifier, local adaptation, or
per-pixel normalization. Preserve signed project input through the project
conversion to ACES2065-1, add no project-authored clamp, and then invoke the
official core's AP1 clamp and gamut operations unchanged. Do not apply the old
per-channel exponential or another transfer afterward.
Update the output color-space descriptor to state the actual post-transform
contract.

**Exit:** source review proves one global Color-owned route for atmosphere,
captured scene, local Sun, and distant Sun; null-roster and celestial spectral
composition remain unchanged and no frame-varying display resource exists.

### 5.7 Restore all authorities for final verification and decide once

Do not change the sealed transform after Step 5.4. Final verification is the
one point at which the deferred CPU-heavy authorities return. Run:

1. the complete pinned-reference, production CPU, and real-WebGL GLSL grid with
   predeclared absolute, relative, and ULP tolerances, identical final
   quantized codes for every sealed pair and holdout anchor, finite output,
   continuous gamut crossings, neutral stability, deterministic fixed-table
   lookup, and no NaN or infinity;
2. one immutable paired normal-path CPU/GPU record with the production
   transform, including the production binary64 N4/cache authority, current
   20-interval source path, refined convergence ladder, actual GPU cache, all
   raw-order pairs, and both output paths;
3. type checking and the complete Node and real Three/WebGL lanes;
4. fixed local/distant application captures, only after numerical gates pass;
5. FOV, viewport, disk/pixel-boundary, blocker, and every
   `0`, `0.25`, `0.5`, `0.75`, and `1` four-sample coverage case;
6. the complete GPU B1 regeneration, requiring the spectral table and
   aggregate `11.820392` mW result to remain exact; and
7. the tracked Bruneton sky-color gate with the same fixed transform on both
   datasets.

Run CPU-heavy work with concurrency `1`, below-normal process priority where
supported, and reserved CPU and memory for the interactive UI. Each long phase
must publish condition/sample progress heartbeats. Supervision may fail a phase
after a declared interval with no measurable progress, but it must not impose
an absolute elapsed-time abort while work continues to advance. A watchdog or
runner failure is operational, never a scientific rejection.

Measure shader source size, compile/link time, normal frame cost, and fixed data
or binding inventory. Reject accidental shader expansion or an unplanned
dynamic resource. Exercise context restoration and replacement only for
resources the faithful core actually requires.

The Bruneton non-regression bounds above do not weaken its tracked strict
thresholds. Report its terminal accepted/rejected status; if that gate remains a
promotion blocker under its owner, the appearance candidate cannot be described
as fully promoted even when it preserves the pre-existing metrics.

Accept the sealed candidate unchanged or reject the whole candidate. Failure is
routed without another appearance tweak:

- missing raw disk order -> transport/circumsolar investigation;
- reference order passes but framebuffer order fails -> output precision or
  encoding;
- numerical gates pass but the disk looks unnaturally isolated -> Step 6 glare
  or surround-response work;
- Bruneton metrics regress -> reject the ACES candidate;
- visible limb stair-stepping -> improve disk sampling, not Color.

**Step 5 exit:** one accepted record promotes the exact pinned transform with
every required gate and claim limit, or one rejected record leaves the fixed
Figure-1 production mapper in place and requires a new design before another
display candidate is attempted.

## 6. Add A Conservative Default Glare Response

Once direct disk transport and display mapping are understood, add only enough
optical/perceptual response to avoid an unnaturally isolated raster circle. The
first candidate should be a normalized response driven by the already exposed
Sun radiance and angular distance from the disk. Analytic evaluation, bounded
quadrature, or another explicitly finite iteration is permitted. It must:

- declare its iteration bounds and demonstrate acceptable measured setup and
  frame cost;
- use the accepted global display mapping without assuming automatic exposure;
- preserve spectral or linear-RGB chromaticity until the display boundary;
- distinguish disk, atmospheric circumsolar light, and optical glare in its
  diagnostics;
- avoid changing atmospheric `pathRadiance` or cache construction; and
- avoid accidental shader-source expansion, forced compiler unrolling, or loops
  whose termination is not statically or operationally bounded.

The response needs a declared observer/display interpretation. If no defensible
default can be selected, retain the physically transported disk without glare
rather than inventing an undocumented effect.

**Exit:** the default response looks plausible at daylight and sunset, conserves
or explicitly accounts for response energy, remains stable across FOV and
resolution, and leaves atmosphere/B1 results unchanged.

## 7. Apply The Policy To Flat/Local Sun

Status: the first production finite-disk normal path is implemented. The
rejected automatic-exposure policy is disconnected for both local and distant
paths. Any replacement shared Color policy must apply to both through the same
Color/runtime owners, not a local-only implementation. `FlatLocalMode` constructs the same
`BrunetonColorDisplayModel` and now enables its exact configured local Sun
through the `flat-local-finite-sun-v1` roster. The dedicated scalar `R32F`
field, finite-body ray support, atmosphere transmittance, four-sample disk
coverage, matched scene visibility, and one-addition composition reach
`ready` and visibly render in focused N1 browser proofs. Full production Step
9 qualification remains open, including the clear/partial/blocked matrix,
replacement and context restoration, and exact solid-angle/direct-lighting
parity.

The ad-hoc Union Glacier Flat-180 CPU center-ray diagnostic computes strongly
warm transported linear RGB (`[1, 0.54660, 0.16505]` relative to peak), and the
retained channel-wise exponential maps that sampled HDR triplet to exact white.
It is not an immutable normal-GPU-path parity record. Step 5 supplies the paired
raw disk/circumsolar evidence and applies the same accepted output transform to
both geometries.

Production Step 9 implements the local visible disk through its distinct finite-
Sun cache. Reuse only the accepted physical and presentation policies:

- the same source-radiance and absorption semantics;
- the same definition of any finite angular acceptance;
- the same global Color and glare response;
- equivalent disk-profile vocabulary; and
- equivalent diagnostics and visual acceptance cases.

The local path still derives direction, apparent radius, atmosphere segment, and
distance behavior from its finite source. It does not reuse the distant cache,
controller, query field, or constant angular radius.

Add local cases at close, medium, and long source distance; horizon crossing;
full and partial scene occlusion; and the existing Union Glacier and San Jose
inspection views where applicable.

**Exit:** local and distant Suns express the same appearance rules while their
different geometry and transport remain visible in the results. Local-only
changes run the local production gates; any shared or distant seam also reruns
the complete B1 gate.

## 8. Add Optional Realism Refinements Separately

Evaluate in this order, with a separate evidence set for each:

1. wavelength-dependent limb darkening when the disk is sufficiently resolved;
2. near-horizon atmospheric refraction and disk flattening;
3. wavelength-dependent dispersion and flash behavior;
4. climate/humidity aerosol appearance profiles; and
5. a more complete observer or camera glare response.

None is required to ship the first realistic default. A refinement that changes
atmospheric transport inherits the atmosphere's validation standard.

## 9. Defer Alternate UI Presentations Until The Default Is Accepted

After the default passes, a conventional exposure-compensation slider may add a
user-selected stop offset around the accepted fixed or future global exposure:

```text
finalExposure = baseExposure * 2^compensationStops
```

Define any disk-emphasis, educational, filtered-view, or accessibility
presentation separately as a named immutable profile. UI selection may change
only declared presentation behavior. It cannot rebuild physical caches, change
source radiometry, bypass occlusion, or become correctness evidence.

A future simulated neutral-density solar filter may reuse the scalar display
infrastructure by applying `10^-opticalDensity` to the entire completed scene.
It must disable or constrain any future automatic exposure so adaptation cannot
cancel the filter. Colored filters use spectral transmission before RGB conversion. A
disk-only visibility treatment is an educational inspection mode, not a
physical solar filter.

Profile names, exact parameters, exposure-slider range, public API, persistence,
and UI controls remain future application decisions.

## 10. Preserve Star-Compatible Decisions

Before production Step 7 settles star appearance, retain these reusable seams:

- the same global highlight response, with adaptation separately qualified;
- normalized optical response with declared iteration bounds and off-raster
  accounting;
- exact source-direction visibility before response spreading;
- chromaticity preservation; and
- diagnostics that separate transport from display.

Do not port Sun disk support or its finite-angle aerosol approximation to stars.
Stars remain unresolved point irradiance sources with exact pixel-solid-angle
conversion and a separately qualified point-response policy.

## Resume Handoff

Current production state:

- local and distant finite disks reach the one shared pre-Color spectral sum;
- production-resolution direct-Sun evidence remains large and warm, and the
  current channel mapper demonstrably plateaus for retained sampled values;
- immutable run `000240-production-sun-appearance-paired-diagnostic` is a
  verified operational failure, not science: its five distant shards
  completed, its three Flat shards timed out while CPU-progressing, its
  fixture identity changed in flight, and it produced no aggregate gates;
- no accepted record yet pairs normal-path disk and adjacent sky radiance
  through a declared encoding and quantization boundary, so complete
  rendered-scene causality and luminance-rank inversion remain unproven;
- Color uses the fixed Bruneton Figure-1 coefficient and its channel-wise
  exponential mapping;
- no production shader exposure texture exists, so `SkyExposureRuntime` is not
  constructed or executed; and
- the rejected exposure code remains only as contained research for possible
  future star work.

Immediate next transaction:

1. Preserve `000240` unchanged and use its failure to enforce the progress- and
   host-responsiveness policy; do not reuse any partial output as input.
2. Complete Step 5.2's immutable GPU-only disk-center, inside-limb, and `0.5`,
   `1`, and `2` degree diagnostic for both geometries, one browser/shard at a
   time. Preserve run `000221` and all retired Star evidence unchanged.
3. Freeze official ACES tag `v2.0.0+2025.04.04`, the current fixed global
   scale, 100-nit Rec.709/D65 target, actual renderer encoding, bounded
   CTL/OCIO tools, contained faithful GLSL, and calibration/holdout inputs.
4. Require the bounded reference and GPU-vs-reference numerical decision to
   pass before generating any view.
5. Generate the first fixed local/distant candidate views through the contained
   GPU shader only. Do not change production Color before this checkpoint.
6. Only after the unchanged candidate views are accepted, port the exact core
   once at Color. Restore CPU/reference/refined paired work only in final Step
   5.7 verification, then run the complete production gates, GPU B1, and
   tracked Bruneton sky-color gate without changing the sealed transform.

Do not reactivate automatic exposure, tune the Sun independently, add glare, or
change atmospheric/cache construction in this transaction. Do not compare
alternate curves or tune ACES parameters from screenshots. Production Step 9
lifecycle, visibility-matrix, context-restoration, and exact direct-lighting
hardening remain open but are separate from the immediate display diagnosis.

Last green checkpoint recorded on 2026-08-13:

- `npm run typecheck:algorithm32`;
- `npm run test:algorithm32`: 538/538;
- `npm run test:algorithm32:three`: 12/12;
- `npm run test:algorithm32:b1-production`: 17/17; and
- complete production GPU B1: `11.820392` mW m^-2 sr^-1 nm^-1, table SHA-256
  `d366ba11a0697aa471f8a822da9ccc9964a67bfcfb18cad0764de62a33583a7f`.

## Verification Cadence

For every production-changing group:

1. run focused type and numerical checks;
2. run the affected Node and real Three/WebGL lanes;
3. capture the fixed visual/radiance cases;
4. verify shader assembly time and per-frame cost did not regress materially;
5. run application coverage for the affected geometry; and
6. run the complete B1 experiment whenever shared or distant atmospheric,
   spectral, Color, source, geometry, or shader seams changed.

Documentation-only work and isolated diagnostics do not require B1. A genuinely
local-only Step 9 change does not require B1 unless it touches a shared seam.
