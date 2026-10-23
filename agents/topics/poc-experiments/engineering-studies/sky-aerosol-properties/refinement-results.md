# Aerosol refinement results

Status: M1-M3 investigation complete; final analysis and immutable evidence proof
accepted. The experiment remains active for owner selection of any next work.
Production source, cache assets and selected atmosphere remain unchanged.

## Conclusion

**Spreading the same aerosol column higher is the strongest supported adjustment.**
Changing the scale height from 1200 to 2400 m brightens the ground-level away-Sun
horizon by 14.25% in the full N1-4 cache and 14.66% in the cache-free independent
solver, while near-Sun light falls only 0.95% and glow contrast falls 0.10%.
This preserves the glow that was lost when aerosol loading was reduced.

It is a tradeoff: the 500 m and lower-Sun horizons also brighten, but the 2 km noon
horizon is about 2-3% dimmer. H1800 gives a smaller ground-level gain but did not
meet its registered elevated-view compromise gate. Neither profile is selected
for production. These are model-controlled sensitivities, not measured sky truth.

The [plan](refinement-plan.md) owns the frozen parameters and gates. The
[first-campaign results](results.md) retain their original N1 scope.

## Evidence to inspect

- [Final matched field gallery](../../../../../tmp/experiments/sky-aerosol-properties/runs/00044-refine-analysis/comparison.html)
  covers all four conditions, horizon and Sun views, at primary and common 0.125 exposure.
- [Order-resolved H2400 fields](../../../../../tmp/experiments/sky-aerosol-properties/runs/00041-refine-colors/comparison.html)
  and [H1200 fields](../../../../../tmp/experiments/sky-aerosol-properties/runs/00024-refine-colors/comparison.html).
- [Eleven-profile N1 measurements](../../../../../tmp/experiments/sky-aerosol-properties/runs/00008-refine-screen/metrics.tsv).
- [Three-solver horizon spectra](../../../../../tmp/experiments/sky-aerosol-properties/runs/00044-refine-analysis/spectra.svg),
  [per-ray qualification](../../../../../tmp/experiments/sky-aerosol-properties/runs/00044-refine-analysis/metrics.tsv),
  [N1 screen gallery](../../../../../tmp/experiments/sky-aerosol-properties/runs/00044-refine-analysis/screen.html),
  and [immutable proof](../../../../../tmp/experiments/sky-aerosol-properties/runs/00046-refine-verify/verification.json).

These are actual diffuse angular sky fields, not full app scene captures. The
horizon covers away-Sun azimuth 150-210 degrees, elevation 0.05-20 degrees; the Sun view is an
undistorted rectilinear 24 x 16 degrees field. The direct disk and scene objects are absent.
Colors use the same bin-integrated CIE1931 -> linear sRGB -> production P2 mapping,
fixed parent display illuminance and shared exposures. No candidate-specific
white balance or exposure was fitted. Raw spectra/linear RGB remain available.
The fields are 120 x 80; the N1 screen fields are 240 x 160.

## M1 - Separate numerical accuracy from atmosphere changes

Completed: authenticated prior evidence, external operational/order pilots,
full global N1-4 cache observations, matched order fields, independent order
references, path/angular/view diagnostics and uncertainty accounting.

The unchanged combo025 medium has loading 25%, SSA 0.95, Cornette-Shanks g=0.85,
H1200 m and alpha=0.8. Both solvers use spherical R6360 km, a 60 km atmosphere,
black ground, no gas absorption, refraction or polarization. Native15 optics
are evaluated at the registered channel centers; the solar source uses its
registered bin means and color uses bin-integrated CIE weights. This is not a
new Bruneton B1 score or a measured atmospheric-profile fit.

With the original 68 incoming directions, cached N1 -> N1-4 raises noon horizon
luminance from 4192 to 5943 cd/m^2. The independent high-sample N1-4 reference is
6284 cd/m^2: the cache is about 5.4% low, so interpreting that difference as aerosol
physics would be misleading.

The plan's one path diagnostic and one angular diagnostic were used at fixed
medium. In a representative green channel:

| Numerical control | Horizon N1-4 radiance, W m^-2 sr^-1 nm^-1 | Finding |
| --- | ---: | --- |
|68 incoming /60 construction intervals|0.089128|Initial deficit|
|68 incoming /120 intervals|0.088990|-0.15%; does not explain deficit|
|272 incoming /60 intervals|0.093875|Close to independent pilot0.093935|

The 272-direction diagnostic was extended to all bands and protected conditions.
Every material comparison below uses the same 272/60 policy, focused outgoing
grid and solar interpolation. No production compiler was changed.

At noon/5 m the resulting H1200 cache versus independent N1-4 differences are
-0.11% at the 0.05 degrees away horizon, +0.33% at 3 degrees, +1.29% at solar offset 1 degrees and
+1.88% at offset 5 degrees. The qualified baseline N1 -> N1-4 horizon increase is now
4192 -> 6277 cd/m^2, about 49.7%; near-Sun mean light grows only 1.58% and contrast
changes about -1.14%. Multiple scattering fills the horizon much more strongly
than the solar halo in this setup.

Final-view 96 -> 192 interval changes are at most 0.048% in the initial cache and
0.029% for H2400. Paired independent 64/128 path-quadrature changes have maximum
absolute mean 0.000014% of N1-4 luminance across the selected rays. This is not
an absolute bound on all integration error. The independent N5+ tail is measured
separately; at baseline noon it adds about 0.38% at the horizon and 0.02% near the
Sun. Cache N1-4 is compared with independent N1-4, not with the all-order total.

Disposition: numerical diagnosis is complete within its authorized bound.
Qualified rays can support material sensitivity; remaining cache/reference
exceptions below are held. No further cache redesign is part of this study.

## M2 - Eleven-profile first-order screen

Completed eleven profiles,286 direct spectra and 22 GPU fields with shared
exposure brackets. Fixed extinction when varying SSA leaves molecular N1
unchanged; aerosol N1 scales with SSA to 4.33e-15 relative residual. GPU/direct
checks and finite-column checks are included in final verification.

| Change from combo025 | Horizon Y change | Near-Sun Y change | Glow contrast change | Disposition |
| --- | ---: | ---: | ---: | --- |
|H1800, fixed column|+14.0%|+0.12%|+0.004%|Promising vertical redistribution|
|H2400, fixed column|+23.0%|+0.19%|+0.003%|Strongest brightness lead; advanced|
|alpha0 /0.4|-0.57% /-0.28%|+0.87% /+0.39%|<+0.08%|Mostly hue; not a brightness solution|
|alpha1.2|+0.27%|-0.31%|-0.03%|Warmer hue, small brightness effect|
|loading 10% /15% /20%|+35.7% /+21.7% /+9.9%|-53.1% /-35.3% /-17.6%|-9.5% /-4.8% /-1.9%|Fail registered absolute-glow loss guard|
|SSA0.98 /1|+0.16% /+0.26%|+2.8% /+4.7%|+0.25% /+0.41%|Weak horizon lever in N1|

Reducing loading can brighten the horizon while severely dimming the absolute
solar surround, even if its contrast ratio still looks acceptable. Raising SSA
mainly adds near-Sun light here. Changing alpha shifts hue but moves horizon
brightness by less than 0.6%; these small effects are not rejected as impossible
N4 effects. They did not earn a second finalist or an unsupported combination.

Disposition: H2400 advanced as the distinct strongest lead. No Cartesian sweep,
cutoff layer, shifted layer or phase-function retuning was introduced.

## M3 - Full-order finalist across protected conditions

Both H1200 and H2400 retain exactly the same finite550 nm aerosol column,
loading, SSA and g; only the exponential scale height changes.

| Geometry | H1200 -> H2400 cache horizon Y, cd/m^2 | Cache change | Independent change | Independent endpoint envelope |
| --- | ---: | ---: | ---: | ---: |
|Noon,5 m|6277 -> 7171|+14.25%|+14.66%|+13.15 to +16.19%|
|Noon,500 m|7062 -> 7530|+6.63%|+6.64%|+5.35 to +7.95%|
|Sun15 degrees,5 m|7973 -> 9212|+15.54%|+14.99%|+13.06 to +16.96%|
|Noon,2 km|8373 -> 8160|-2.55%|-2.11%|-3.71 to -0.48%|

The endpoint envelopes divide opposite endpoints of the two separately estimated
95% luminance intervals. They are descriptive conservative endpoint envelopes,
not a formally calibrated joint 95% interval for the effect or all rays.
Sun15 degrees is a registered synthetic lower-Sun case, not a matched sunset timestamp.

| Geometry | Absolute near-Sun mean change | Contrast change | Registered10% loss guard |
| --- | ---: | ---: | --- |
|Noon,5 m|-0.95%|-0.10%|Pass|
|Noon,500 m|+17.21%|+1.89%|Pass|
|Sun15 degrees,5 m|-0.22%|-0.72%|Pass|
|Noon,2 km|+75.63%|+11.36%|Pass|

Six held-out left/right/down offsets at 1 degrees/5 degrees also retain light: their changes
range -0.96 to -0.92% at ground noon, +16.12 to +17.24% at 500 m,
-2.21 to -0.49% at Sun15 degrees, and+66.16 to +75.89% at 2 km. These verify directional
sensitivity, not independent accuracy of every held-out ray.

At ground noon the horizon xy moves from(0.29454,0.31078) to(0.29934,0.31606):
slightly warmer and nearer descriptive D65, while still blue of it. This is
primarily a brightness/vertical-distribution adjustment, not a universal whitening
operation. At Sun15 degrees the horizon also becomes warmer.

Physical interpretation: at the same total column, H2400 halves the aerosol
concentration at ground level and puts more of the material higher up. This
reduces dense low-level horizontal attenuation while retaining scattering into
the solar surround. The two local density profiles cross near 1.66 km; at 2 km
H2400 has about 15% more local aerosol than H1200. The elevated-view tradeoff
therefore has a physical mechanism and is reproduced by the independent solver.
The integral is a balance of illumination, extinction and scattering; local
density alone does not determine its final radiance.

### Bounded H1800 compromise test

Registered before execution: require at least 5% ground horizon gain, at least
0.5 percentage point less2 km horizon penalty than H2400, and retain glow in all
four conditions; only then add independent noon/2 km confirmation.

[Run00040](../../../../../tmp/experiments/sky-aerosol-properties/runs/00040-refine-midpoint/decision.json)
finds +8.67% ground horizon gain and -2.08% at 2 km. The 2 km improvement over H2400 is
0.469 percentage point, narrowly below 0.5. Glow passes. The branch stops at its
registered cache screen; independent H1800 confirmation is not triggered.
This is a failed advancement gate, not proof that H1800 is aesthetically inferior.

## Reference qualification and limits

Final spectral/uncertainty analysis is in run 00044. The independent comparison qualifies 21/32 selected
medium/geometry/ray combinations against all targets. All comparisons pass the
physical matching checks. Six are held because the norm of marginal spectral
95% halfwidths is 1.03-1.19%, slightly over the 1% target, despite luminance
uncertainty below 1%. Five exceed a cache-disagreement target:

- H1200,500 m: solar offsets 1 degrees/+2.07% Y and 5 degrees/+2.52% Y.
- H1200,2 km: solar offsets 1 degrees/+5.53% Y and 5 degrees/+5.24% Y; spectrum and chromaticity
  also miss targets. Much of this already appears in cached N1 reconstruction.
- H1200,Sun15 degrees horizon:-2.09% Y and 2.43% spectrum residual after the higher-sample
  reference. The H2400 lower-Sun horizon remains within disagreement targets.

The spectrum uncertainty check is the width-weighted norm of per-channel 95%
halfwidths divided by spectral norm. It is explicitly not a joint 95% confidence
ball. Luminance intervals retain cross-channel batch covariance; both uncertainty
measures must be <=1% for full ray qualification. Earlier partial report 00035
used the luminance uncertainty gate alone;00043 adds the conservative spectral
check. No failed tolerance was relaxed to retain a result.

Independent transport uses deterministic converged N1 plus Monte Carlo pure
N2,N3,N4, with raw Monte Carlo N1 retained as a separate control. The strongest
runs use 16 x 8192 main paths per band/ray plus 8 paired 64-quadrature batches.
Other protected noon conditions use 16 x 2048 plus 8 paired batches. Both media use
four selected rays and 15 channels. Two lower-Sun references were refined rather
than restarting the full parameter screen.

The external route uses installed libRadtran 2.0.1-MYSTIC, fully spherical 1D,
scalar Rayleigh with zero depolarization, explicit aerosol layer optical depths,
SSA 0.95,256 Legendre moments for the same Cornette-Shanks phase function,
black ground, vroom off and maximum 4 scatterings. Executed input decks, binary,
worker, source units and raw output are archived and authenticated. This setup
validates these model inputs, not arbitrary real-world atmospheric conditions.

The baseline horizon's four external full-spectrum repeats average6303 cd/m^2,
+0.31% relative to independent, with1.32% spectral L2 residual and1.37% Student95
luminance halfwidth. H2400's two repeats average7233 cd/m^2, +0.39%
relative to independent, weighted spectral L2 residual 1.47%. The two-repeat
Student95 halfwidth is 2.52%, so external agreement is corroboration rather than
<=1% external uncertainty certification. Doubling mass layers 256 -> 512 in the
baseline matched-seed control changes luminance by -0.0012%. A three-band N1
solar pilot's 12% green discrepancy reduced to 1.4% at tenfold photon count;
that pilot is not a full-spectrum N1 qualification.

The baseline full-spectrum solar-offset1 degree external mean is1.62% above
independent, but its four-repeat luminance halfwidth is12.13% and spectral L2
residual6.30%. It does not qualify solar-surround accuracy. Retaining this
negative precision result is preferable to presenting a close mean as validation.
Additional high-photon external Sun runs are deferred; the physical halo
sensitivity has independent/cache support but is not externally certified here.

## Execution decisions, corrections and retained evidence

- Keep numerical and material interventions separate; use 272/60 for both media.
- Use one initial full-order finalist, then one registered H1800 compromise.
  No new sunset case, rich mixture or wavelength-dependent SSA was earned.
- Stop expansion after the registered compromise gate; retain every adverse ray.
- 00006 remains scientifically invalidated for experimental wavelength-shader
  constant reuse; corrected observations are00009 onward.
- 00013 remains failed because production admits 60 construction intervals;00014
  changes only a generated experiment copy for the 120 diagnostic.
- 00019 remains failed for orchestration run attribution during concurrent external
  allocation. Its completed baseline00020 was preserved and reused by 00023.
- Candidate color reports00026/00037 used an H1200 direct packet for their N1 parity
  diagnostic. Their spectra, images and N4 metrics remain usable, but those
  parity files are superseded by correctly matched00041/00039 respectively.
  Main analysis already uses matched direct controls00018, so material findings
  were not computed from the mismatched parity diagnostics.
- Legacy color reports store nominal noon directions for lower-Sun near-Sun rays.
  Actual shader queries were correctly rotated; final analysis reconstructs and
  checks actual directions from captured controls against independent queries.
- Source-normalized R/B is recomputed explicitly in final analysis; older default
  ratio fields are not used to claim source-normalized hue agreement.
- The first final verifier00045 failed when the sandbox denied its read-only Git
  child process. The same proof completed with host execution in00046. This did
  not require rerunning transport or changing production/Git permissions.

## Cost, verification and checkpoints

The [final proof](../../../../../tmp/experiments/sky-aerosol-properties/runs/00046-refine-verify/verification.json)
authenticates all closed run artifacts and their prior-evidence parent identities,
physical controls, GPU/direct N1 parity, held-out angle geometry, finite fields
and faithful accounting of failed targets. Production is unchanged relative to
the initial recovery checkpoint; owned browser/solver scratch is empty.

There are five historical progress-cadence exceptions:00007,00021,00022,00028
and00038 have maximum gaps108.1,61.3,66.6,38.6 and62.2 seconds respectively,
exceeding the30-second contract. Their artifacts/terminal states authenticate,
but monitoring compliance is not claimed. Synchronous host work and scheduling
can delay an event-loop heartbeat; future long runs need an independent heartbeat
or bounded yielding around serialization/I/O. Old progress records remain intact.

The retained closed-run inventory is 519.4 MiB, including the first campaign,
invalidated observations and failure records; the final proof adds a small amount.
No previous evidence was deleted. The new measured execution spans about59 minutes
from the first pilot through final proof, excluding earlier preparation; this is
wall time with overlapping CPU/GPU work, not pure compute or reasoning time.
The baseline external eight-case batch alone took53.8 minutes wall time.

Full15-band/four-condition observed cache runs took 105 s for H1200 and 133 s for
H2400 at 272 directions. These are observed diagnostic jobs, not controlled
benchmarks or deployable package-build timings. The original 68 run took 103 s;
GPU load/JIT overlap means these numbers do not establish free angular refinement.

The compiler logical texture peak is 180588960 bytes plus 321226560 bytes for
experimental pure/cumulative observation accumulators, an upper bound of about
479 MiB for these allocations. This is not driver/OS peak memory. Sampled Node
RSS is about 171-202 MB; total browser/WSL process peaks and historical peak scratch
were not instrumented and must not be inferred from unrelated Chrome processes.
One owned GPU browser runs at a time; installed CPU MYSTIC runs alongside it.

Pure-order fields and the accumulated source field are traced separately. Because
the solar interpolation is monotone and nonlinear, tracing their sum need not
equal summing the separately traced increments. The maximum relative closure
residual is 0.118% across the three full caches; it is retained as a reconstruction
diagnostic rather than mislabeled as roundoff or an exact pure-order identity.

Local type checking passes. No experimental unit-test tree was created.
Dedicated standards reviews/audits are disabled by experiment policy; no
standards-compliance claim is made. Checkpoint advice remains active.

Local checkpoints:

- `b00c7f40` - preserve prior completed app work, first campaign and initial setup.
- `6368bb3a` - preserve refinement measurements and the analysis harness.
- Final handoff message: `docs(experiment): conclude aerosol refinement study`;
  its commit identity is available in Git history and the execution reply. No push.

M1-M3 and the bounded adaptive branch are complete, with their explicit qualified,
held and rejected claim boundaries. App integration, a production cache selection,
measured-profile claims and B1 scores are outside this execution. Any next campaign
starts from this report and preserves these runs; no further run is queued.

## Full-scene review follow-on

Owner selected the recommended scene review after M1-M3 completed. Compare
combo025/H1200 with fixed-column H2400 in the actual Flat32 renderer, using
separate experiment-owned atlases and physically matching live media. Production
assets/defaults remain read-only. The first batch is San Jose solar noon: away
horizon at5m,500m,2km and Sun-centered close-ups at5m/2km. Fixed camera, objects,
source, display illuminance and viewport apply within every material pair.

Use the existing full272/60 Native51 recurrence controls and focused/cubic
outgoing reconstruction. Map recurrence rows by exact physical height into the
Native48 app atlas; runtime altitude interpolation remains Native48. Earlier retained probes are not an app atlas; build the requested
complete rows anew, retaining their identities and packet/upload proof. Startup
production assets supply address metadata only and are replaced before captures.
The actual production view shader remains Q30/quadratic; this visual review does
not replace the earlier96-interval spectral qualification. Freeze the display
illuminance to the first campaign value to isolate material appearance.

During capture development two adapter errors were corrected. Startup receiver
lighting was originally retained after replacing the atlas; final captures instead
remeasure lighting from the newly published atlas before updating object lights.
More substantially, copying Native48 altitude ordinals into the Native51 compiler
selected the wrong physical heights above the inserted low-altitude nodes. Final
extraction maps each app address to an exactly equal compiler height and proves
that mapping before accepting images. Runs00047-00054 remain sealed but are
superseded and excluded from all scene-appearance conclusions. Their hash proofs
establish byte integrity, not correctness of the old altitude correspondence.
The M1-M3 solver observations were not produced by this adapter and are unaffected.

The corrected full builds are runs00055 (H1200) and00056 (H2400). The accepted
[primary scene proof/gallery](../../../../../tmp/experiments/sky-aerosol-properties/runs/00057-scene-report/comparison.html)
contains five matched pairs: away-Sun horizon at5m,500m and2km, plus Sun-centered
20-degree close-ups at5m and2km. Horizon views use50-degree vertical FOV.
Left is always combo025/H1200; right is fixed-column H2400. The actual renderer,
objects, direct Sun and stars are used. These are globe/distant-Sun noon scenes;
flat/local-Sun and sunset changes have not been tested by this follow-on.

Visual observation: the away-Sun horizon differences are subtle at this field of
view. Both profiles retain a pale horizon and visible solar glow. The ground-level
Sun surround is slightly weaker for H2400; at2km its solar surround is much
brighter and broader in the displayed image. This is consistent with the earlier
qualified elevated near-Sun tradeoff and supports reviewing height as part of
profile selection. It does not establish that the brighter elevated appearance
is incorrect. H2400 remains a candidate, not a selected production atmosphere.

The primary mean absolute RGB code changes are0.37,0.56 and0.57 out of255 for
the5m,500m and2km horizon images,4.61 for the5m Sun view and28.91 for the2km
Sun view. These describe entire 8-bit screenshots including foreground; they are
neither radiance percentages nor RMSE against an independent physical reference.
Do not substitute them for the earlier selected-ray spectral measurements.

Verification reconstructs every uploaded packet byte from retained cumulative
source-density rows and compares its hash to the GPU upload record:22 populated
slots and1408 coordinate rows per medium. It also proves exact physical-height
correspondence, source and coefficient matching (maximum relative discrepancy
4.44e-16), matching cameras/physical observer heights/display settings, finite
nonnegative compiler results and released compiler fields. Startup package data
provide addresses only; final scattering coefficients come from the new builds.
The app still uses Native48 altitude interpolation and Q30/quadratic view
integration, so these captures do not inherit the earlier Native51/Q96 spectral
qualification as an exact runtime-equivalence claim.

Build-and-capture times were133.3s for H1200 and121.0s for H2400 on RTX2060,
ANGLE/D3D11 with installed Chrome155. Each retains about300MiB including raw rows,
bundles, source/input identities, captures and immutable manifests. Sampled Node
RSS at completion was800.2MiB and323.8MiB respectively; these are not peak process
or GPU-driver measurements. The experiment atlas allocates24 RGBA32F layers of
648x1728 pixels, about410MiB, with22 populated. The recurrence's reported logical
texture allocation is separate; no measured total GPU-memory peak is claimed.
One owned GPU browser is used at a time. Both builds met the30-second progress
cadence (maximum gaps24.1s and24.9s). Owned browser scratch is removed after exit.

The source is experiment-owned and type checking passes. Production source,
cache assets and default selection remain unchanged from checkpoint868c7e2d.
The checkpoint adviser recommends preserving this complete scene-review unit;
no dedicated standards review or independent audit was requested.

The [complete scene gallery](../../../../../tmp/experiments/sky-aerosol-properties/runs/00060-scene-brackets/comparison.html)
adds shared one-eighth-exposure Sun views from runs00058/00059. Its
[verification](../../../../../tmp/experiments/sky-aerosol-properties/runs/00060-scene-brackets/verification.json)
authenticates the primary proof, equal uploaded packet hashes, identical physical
inputs/cameras and the exact display-only RGB multiplier. Both primary and bracket
images have0.0366% nearly white pixels, confined to the direct disk in visual
inspection. The darker views help inspect the halo, but the primary surrounds
were not simply clipped flat white. The bracket runs reused the corrected raw
rows without rebuilding scattering and took50.3s/33.3s; both met progress cadence.

Total retained follow-on evidence, including the excluded development captures,
is1250.0MiB. All earlier runs remain intact. The experiment-owned browser instances
are closed and scratch is empty. The scene-review task is complete: no render,
reference calculation or production change is queued. Production adoption and
additional times/flat scenes remain owner decisions. The local handoff checkpoint
uses `feat(experiment): add corrected aerosol scene review`; its identity is in
Git history and the execution reply. No push.

## Production-numerics profile-only scene comparison

Owner requires any numerical change to be rechecked against Bruneton before
production adoption. Runs00055-00060 used diagnostic Native51/F272 construction,
so they cannot establish a profile-only comparison to production. Preserve those
runs and their qualified scope. This follow-on repeats the five scene views using
the selected production package's exact build request, replacing only its
atmosphere fields for each experimental profile. All source, planet, ground,
spectral, angular, altitude, numerical and shader-profile settings remain equal.
No production setting is changed and no new Bruneton score is claimed.

Compare production zero-aerosol atmosphere, combo025/H1200 and fixed-column H2400.
The zero-aerosol reference is rebuilt through the same compiler at production
settings; it is clearly distinguished from an unmodified deployed-cache capture.
Use Native48 positions,68 incoming directions,15 spectra,60 construction intervals,
cumulative N1-4, production focused outgoing lookup/cubic solar interpolation and
production Q30 view integration. Retain the same shared fixed display illuminance,
viewport, objects, cameras and physical observer heights as the previous gallery.
Primary renders use unmodified production display encoding; Sun views additionally
get the same one-eighth exposure diagnostic. That shared exposure is a comparison
control, not medium-dependent normal app adaptation.

Primary builds are complete:00061 production zero-aerosol atmosphere,00062
combo025/H1200,00063 fixed-column H2400. The accepted
[primary profile-only gallery](../../../../../tmp/experiments/sky-aerosol-properties/runs/00064-scene-report/comparison.html)
contains fifteen actual scene captures in five three-column comparisons. Left is
the production atmosphere, middle is combo025, right is H2400. Each original
capture is1024x576; the combined PNGs are3072x576 and can be opened at full size.

The [verification](../../../../../tmp/experiments/sky-aerosol-properties/runs/00064-scene-report/verification.json)
asserts complete request equality with selected production after substituting
only atmosphere. Within atmosphere, only its identity and the aerosol scale
height, loading, single-scattering albedo and phase shape may differ. Molecular
coefficients, ozone choices, source, ground, planet, all sampling domains,
numerical options and shader profile are fixed. The zero-aerosol request equals
the production request without substitutions. Physical heights, camera/viewports,
shared display context and live media match their controls. Every uploaded packet
hash is reconstructed from retained rows:22 slots and1408 coordinate rows per
profile. All compiler fields are finite/nonnegative and released after extraction.

Visual conclusion at production settings: both aerosol profiles restore a broad
solar surround relative to the current zero-aerosol atmosphere. H2400 is slightly
weaker near the Sun at5m than combo025, but substantially brighter at2km. The
wide away-Sun horizon differences are subtle. This preserves the qualitative
profile tradeoff seen earlier while removing the experimental numerical changes
from this comparison. It is an appearance result, not new independent transport
qualification or an assertion about which synthetic atmosphere is most realistic.
The earlier Native51/F272 reference residuals do not qualify these Native48/F68
renders automatically. No Bruneton RMSE measurement or production change is made.

For combo025 versus H2400, the mean screenshot RGB-code differences are0.39,0.56
and0.64 out of255 for the5m/500m/2km horizons,4.62 for the5m Sun and28.91 for the
2km Sun. All fifteen profile/view pair metrics are retained in the proof. These
are display differences across entire screenshots, including objects, not physical
radiance percentages or reference RMSE.

Primary build-and-capture times are115.1s,111.6s and113.5s respectively on the
RTX2060 / Chrome155 / ANGLE D3D11 lane. The retained primary runs occupy211.0,
211.9 and212.3MiB. Completion-time sampled Node RSS is272.6,296.8 and135.9MiB;
these are not peak process/browser/GPU measurements. Each build met the30-second
progress cadence (maximum gap below25s). Atlas shape and allocation are unchanged
from the preceding scene adapter; one owned GPU browser is active at a time.

The [complete profile-only gallery](../../../../../tmp/experiments/sky-aerosol-properties/runs/00068-scene-brackets/comparison.html)
adds six Sun captures at the common0.125 exposure, derived in runs00065-00067
without rebuilding scattering. The
[final derivation proof](../../../../../tmp/experiments/sky-aerosol-properties/runs/00068-scene-brackets/verification.json)
authenticates the primary proof, matching packet hashes, exact display-only
multiplier, unchanged physical inputs and camera/height/exposure pairing across
all three profiles. Brackets took38.5s,51.0s and35.6s and met progress cadence.
Near-white pixels remain0.0366% in every primary/bracket Sun image, confined to
the direct disk on inspection. The surround differences are visible at both
exposures; the primary views are not merely flat clipping artifacts.

The completed follow-on retains659.3MiB, preserves all earlier evidence and
leaves owned browser scratch empty. All owned GPU browsers are closed. Source
type checking and the request/packet/height/capture/display proofs pass. No
experimental unit-test suite or standards-review pass was introduced. The
checkpoint adviser recommends this as a coherent local checkpoint under message
`feat(experiment): add production-profile scene comparison`; its identity is in
Git history and the execution reply. No push. No job remains queued. Production
remains unchanged.

### Owner preference after scene review

The owner identified fixed-column H2400 as the preferred profile after reviewing
the production-numerics comparisons. Retain the same total aerosol column as
combo025, scale height2400m, SSA0.95, phase shape g0.85 and spectral exponent0.8.
The owner subsequently closed the experiment and explicitly authorized H2400
production promotion. Its execution is owned by the production plan; no further
experiment run is queued.
A later integration should preserve production Native48/F68 and other numerical
settings. Any numerical change requires a matched unchanged-paper-atmosphere
Bruneton B1 check across all times before adoption.

### Final experiment disposition

Ended2026-10-22 through end-experiment. H2400 is accepted as the owner-selected
physical profile for production integration, with all scientific limitations above
retained. All68 runs, including failures and superseded observations, remain
sealed and unchanged. No owned browser/job/scratch remains. No temporary standards
configuration was introduced or removed; permanent mapping/types remain active.
[Production promotion](../../../production-app/product-behavior/h2400-atmosphere-plan.md)
is separately authorized and owns activation; closure does not certify it complete.
