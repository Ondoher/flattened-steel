# ARM-Informed Scene Execution

State: all ten requested conditions are rendered with matched Bruneton images.
Reference pilots expose unresolved optical discrepancies; these are illustrative
reconstruction scenes, not a validated measured-atmosphere replacement.
The [scene plan](scene-plan.md) owns scope; [earlier results](results.md) retain
their original measured-profile qualification limits. This is not a production update.

## S1 - Registered reconstruction and shared-optics proof

The central model is
[00029-reconstruction/model.json](../../../../../tmp/experiments/clean-horizon-profiles/runs/00029-reconstruction/model.json).
It uses the December 5, 2023 19:31:54 UTC ARM interval. The individual Level2
AERONET AOD observation is only 86 seconds earlier, and conditional phase/SSA
retrieval has the same timestamp. The green surface band has five simultaneous
QC=0 scattering/absorption samples with the 10 micrometer impactor. No daily-column
mean was substituted for this interval.

Central reconstructed AOD550 is 0.02102; interval observed AOD550 is 0.01708.
The +0.00394 residual is retained rather than removed by column normalization.
The model is about 67% lower in column loading than the continuous Bruneton
formula, with surface extinction550 approximately 0.00150/km. These numbers
describe the reconstruction, not a newly observed full atmosphere.

The central inference uses nonnegative piecewise-linear extinction, a 300 m
well-mixed near-field assumption, soft measured-column constraint, weak shape
smoothness and published dry continental-clean free/upper extinction priors.
Lidar bins with missing source flags/cloud contamination do not become zero
observations. Its maximum systematic uncertainty is a bounded penalty scale,
not a Gaussian standard error. The initial model kept an overly strong unrelated
profile prior and left AOD about0.0316; weakening that unobserved prior brought
the independent column into better agreement before any candidate image existed.
That earlier derivation remains immutable in00028.

Humidity growth is an explicit proxy: interpolate published OPAC water-soluble
0/50%RH scattering between the observed dry-sample and ambient humidity. It is
not measured SGP chemistry. The conditional440/675nm AERONET angular shapes are
normalized in cosine space and interpolated at550nm; this scalar phase and
SSA0.7671 are held spatially and spectrally common. The observed column Angstrom
exponent1.065904 sets spectral extinction. Those are simplifying assumptions,
with surface/phase and upper-completion variants retained separately.

The published preset ends at35km. The central model uses its zero-above-boundary
convention as an explicit model extension, not evidence of aerosol-free observed
upper air. A separately labeled5km e-fold tail above35km tests that choice;
its column is0.02226. Other registered one-factor variants are a100m near-field
bridge, no hygroscopic growth, the published50%RH upper background, and a normalized
analytic phase proxy using the surface-derived asymmetry. Their complete contracts
and assumptions are in
[variants.json](../../../../../tmp/experiments/clean-horizon-profiles/runs/00029-reconstruction/variants.json).

The contained `ArmAtmosphere` samples the same height table in CPU medium,
runtime view GLSL and direct/celestial transmittance GLSL. The N4 compiler adapter
changes aerosol density sampling while retaining the production recurrence and
numerical policy. Conditional phase is exported directly to the compiler/reference.
No production source or cache was edited.

[00030 GPU proof](../../../../../tmp/experiments/clean-horizon-profiles/runs/00030-gpu-feasibility/proof.json)
compares actual float WebGL samples of extinction, scattering and phase against
CPU results across the modeled0-60km domain. Maximum relative difference is
5.03e-7 on the RTX2060 hardware path. This proves the sampler representation;
full cache/view agreement remains an S2/S3 obligation. Local JavaScript/TypeScript
checking passed after the adapter edits.

Exact app source times were resolved: San Jose noon is
2024-06-20T20:08:46.261Z, SZA13.890169 degrees; ground-defined sunset is
2024-06-21T03:26:03.503Z, SZA89.957915 degrees. Both instants remain common across
5m,100m,500m,2km and40km. The primary camera centers the true geometric limb,
with50degree vertical FOV at1024x576. At40km the Sun remains above that limb at
the common ground-defined sunset instant.

Disposition: advance this explicitly ARM-informed reconstruction to actual
scenes. Source uncertainty remains visible; no complete measured-profile or
visual-improvement claim is made yet.

## Rendered results

[Open the complete local gallery](../../../../../tmp/experiments/clean-horizon-profiles/runs/00055-scene-gallery/index.html).
It contains all ten ARM scenes, their ten matched Bruneton scenes, and two
additional uncertainty views. Every primary pair has native app display,
Bruneton-gain fixed exposure, and a common eight-times-lower highlight diagnostic.
PNG downloads and source/camera/exposure metadata are on the page. The earlier
noon-only and first full galleries remain immutable in00038 and00044.

These are actual current-renderer Globe images, not generated illustrations.
The atmosphere changes in this experiment; production files/cache do not.
All images are1024x576,50-degree vertical FOV, facing the Sun azimuth and centering
the geometric limb. Objects retain their world positions and can be outside frame.
The ground-defined sunset instant is common at every altitude. At40km the Sun
is about6.45degrees above the visible limb, rather than sitting on that limb.

| Height | Noon appearance versus Bruneton | Sunset appearance versus Bruneton |
| --- | --- | --- |
|5m|Bluer sky and less gray at the horizon; ground edge remains clear|Less brown, brighter yellow solar neighborhood; nearby object remains visible on the right|
|100m|Reduced whitish veil, visible ground boundary|Brighter and more blended solar neighborhood; reduced brown band|
|500m|Clearer color separation across the limb|Substantial brighter glow; native display blends the small disk into its surroundings; lower exposure resolves it|
|2km|Less white haze, but a thin atmospheric band remains|Broader bright band over the curved limb; haze remains|
|40km|A broad bright white/blue limb persists|The lower frame remains very bright; low exposure reveals a broad atmospheric transition, not a crisp clear edge|

Native-resolution inspection covered all20 primary images plus both uncertainty
images. No broad black overlay strip or missing/stale frame was observed. Thin
approximately one-pixel staircase/edge structure remains around some near-ground
limbs. Owner review also identified broader bright and gray bands above the limb;
these are separate from the pixel-scale geometry issue and are investigated below.
This capture does not prove subpixel geometric accuracy. The5m sunset
object is visible; absence of objects in other frames is consistent with the
unchanged scene and Sun-facing camera, not an object-removal setting. The native
40km frames have extensive near-white regions. Keep the lower-exposure control
in view before interpreting those regions as zero geometric contrast.

## S2/S3 - Reference comparison and numerical limits

The same optical table/phase is exported to fully spherical scalar MYSTIC with
512 vertical layers,100,000 photons and three fixed pilot seeds. There are96
native15 reference executions across noon5/500m and sunset500m/40km, including
both sides of each limb. Each finite pixel uses two distinct vertical Gaussian
nodes; horizontal reflection symmetry supplies the other two footprint samples.
These are local center-pixel directional checks, not full-sky reference renders.
The physical reference has a black ground; the actual scenes retain green ground.

[Reference and sensitivity analysis](../../../../../tmp/experiments/clean-horizon-profiles/runs/00054-scene-analysis/analysis.json)
retains spectra, CIE luminance, signed RGB, seed uncertainty and finite-pixel
contrast. The following range covers the four registered subrays at each condition.
It is N4 field replay relative to the three-seed all-orders reference mean,
not RMSE and not a confidence interval.

| Condition | Bruneton relative luminance discrepancy | ARM relative luminance discrepancy | ARM limb-contrast error |
| --- | --- | --- | --- |
|Noon5m|+21.2% to+24.0%|+2.1% to+8.5%|-0.0032|
|Noon500m|+27.2% to+27.8%|+2.7% to+5.0%|-0.0082|
|Sunset500m|+32.2% to+35.9%|-15.4% to+66.3%|-0.1727|
|Sunset40km|+10.6% to+12.3%|-2.2% to+7.1%|+0.0115|

ARM sunset500m is the important unresolved case: the below-limb field is about
66% high while above-limb rays are13-15% low. Its contrast misses the registered
0.02 target. This cannot be explained away as a preferred atmosphere appearance.
Across these comparisons, increasing view integration to480 intervals changes
luminance by at most about1.1%; it does not resolve the discrepancy. Independent
8,192-interval direct-transmission integration differs by at most0.00301 absolute,
inside the registered0.01 target. The evidence points to source-field/order/cache
approximations or their interplay, not chiefly the live view optical-depth step.
It does not isolate one of those mechanisms.

Production numerical choices were deliberately retained: N4, native15 spectrum,
N48 position domain and W27 outgoing directions with the current incoming grid.
There are no new cache height nodes:0 and1875m bracket the entire near-ground
profile structure. All48 native height nodes are supported, through59375m;
40km and neighboring height samples are covered without clamping. Coarse height
sampling is a plausible limitation for this structured reconstruction. A dedicated
height/angle refinement campaign was not run and is not implied by domain coverage.

The hardware sampler proof is much tighter than these transport errors. It proves
that CPU and GPU read the same optical representation, not that the N4 angular/
spatial field is accurate. An order-tail bound and a full matched-order GPU-ray
comparison remain absent. The all-orders solver result cannot uniquely separate
truncation from interpolation. The gallery therefore labels the unresolved
numerical approximation visibly; the adapter is not declared fully validated.

## Reconstruction sensitivity

The five registered one-factor alternatives were compared with60 additional
MYSTIC executions at the native green band, three pilot seeds and the same finite
limb footprint. These are targeted triage checks, not full-color uncertainty bounds.

| Alternative | Tested condition | Green radiance change across the two limb sides |
| --- | --- | --- |
|100m rather than300m bridge|Noon500m|-0.3% to+1.2%|
|No humidity growth|Noon500m|+0.02% to+1.0%|
|Published50%RH upper background|Sunset40km|+2.3% to+2.8%|
|Surface-derived analytic phase proxy|Sunset500m|-90.4% to-81.7%|
|Assumed5km upper tail above35km|Sunset40km|+2.5% to+3.2%|

The small bridge/humidity differences should not be interpreted as resolved
benefits from three seeds. The very large phase sensitivity has a visible
counterpart: the additional500m sunset image restores a darker orange halo and
a distinct disk. That proxy is not selected as the correct atmosphere; surface
asymmetry does not uniquely determine the full ambient angular distribution.
The uncertainty gallery also shows that adding the unobserved upper tail can
create a strong40km Sunward glow even while the selected limb rays change only
a few percent. Selected rays alone do not characterize the solar neighborhood.

These alternatives leave molecular optics, column spectral shape and other
factors fixed. No five-seed benefit confirmation was registered or claimed.
The full planned sensitivity grid across times/heights, molecular-only matched
controls,0.5/1/5degree Sun-separation spectra, wavelength/layer convergence and
order-tail isolation remain deferred quantitative validation. They are not
silently counted as passed. The completed deliverable is the illustrative image
matrix and targeted uncertainty evidence; measured-profile qualification remains
inconclusive under the original M1 report.

## State, display and evidence checks

All20 primary images have recorded exact UTC/height, matching pair camera matrices,
active tabulated medium/source-field identity, zero WebGL error and actual hardware
renderer identity. Linear pre-display compositions are retained losslessly.
CPU display replay differs from native GPU output by at most one RGB byte.
Physical receiver lux and altitude-adjusted display-control lux are separate fields.
Fixed exposure is common within a pair, not common across the whole gallery.

[State-transition proof](../../../../../tmp/experiments/clean-horizon-profiles/runs/00052-arm-scene/captures.json)
checks noon500m -> sunset500m -> noon500m, then5m ->40km ->5m, against fresh captures.
All six images match within one RGB byte. The proof reuses authenticated N4 rows
by physical coordinate and republishes the selected atlas; it does not conceal a
transition with a page reload or rebuild the atmosphere for elevation changes.

[Final verification](../../../../../tmp/experiments/clean-horizon-profiles/runs/00057-scene-verify/verification.json)
passes:11,060 preceding artifacts rehashed (3,278.1MiB), immutable parent-run
identities checked, all10 conditions/20 primary frames present, and every image
loads under native/fixed/lower exposure in a real browser. Time filters expose
five noon rows and five sunset rows plus the two sunset uncertainty comparisons.
Local authored JavaScript/TypeScript checking and Python syntax checking pass.
Owned browsers/servers are closed and temporary browser profiles were removed.
The final verification covers57 prior runs:46 accepted and11 failed; failures
remain recorded as failures rather than relabeled successes. Dedicated experiment standards review
and independent audits are disabled by repository policy. No compliance claim
is made from that policy.

## Cost and implementation disposition

Measured on hardware RTX2060 via Chrome/D3D11 at1024x576:

| Work | Per-channel compilation/repacking total | Whole run elapsed |
| --- | --- | --- |
|Bruneton noon cache, first attempt|103.2s|141.1s, capture helper failed after cache completion|
|Bruneton noon, authenticated reuse|6.9s packing|69.4s for five captures|
|ARM noon|123.7s|179.7s for five captures|
|Bruneton sunset|119.7s|169.9s for five captures|
|ARM sunset|214.2s|271.2s for five captures|
|Phase uncertainty sunset|283.3s|332.6s for one capture|
|Upper-tail uncertainty sunset|168.4s|220.8s for one capture|

These are observed wall timings with concurrent reference work, not controlled
algorithm speed ratios. One cache is reused across all five heights; changing
Sun state requires different field content. Compiler-reported peak live field
allocation is148.65MiB per channel. Each declared runtime packet atlas has
495.49MiB logical capacity. Original and replacement atlases coexist during the
contained capture; their combined capacity is about991MiB, excluding driver,
textures, host staging and other resources. These capacities are not an observed
device peak. Node RSS snapshots across primary capture runs are151-656MiB and
are not browser/driver peaks. [Frame timing](../../../../../tmp/experiments/clean-horizon-profiles/runs/00056-arm-scene/captures.json)
uses three forced complete frames with gl.finish at each height. Median measured
completion is7.8ms at5m,9.1ms at100m,7.2ms at500m,7.2ms at2km and7.5ms at40km.
It includes CPU/browser submission and GPU completion at this fixed view, not
pure GPU timing or interactive app FPS. The evidence root after verification
retains about3,281.5MiB, including prior M1, failed attempts and implementation
snapshots; this is disk retention, not runtime cache size.

Implementation/helper recovery preserved prior payloads:12 successful baseline
reference spectra from00031 and all15 compiled baseline channels from00032 were
reused. SSA scaffolding, column indexing, required export metadata and a stale
stellar-only HDR assumption were repaired in new runs. The subsequent capture,
reference and gallery runs are accepted; failed predecessors remain immutable.

Disposition: images support a useful low-aerosol comparison near the ground,
with a strong Sun-glow/phase tradeoff. They do not solve the40km fuzzy-limb goal
or establish this reconstruction as a production replacement. No production
profile/cache/display was changed. The experiment remains available for owner
review; no automatic promotion or closure is performed.

[Execution log](execution-log.md) owns consequential decisions and checkpoints.


## Owner-review follow-up: bright rim and gray band

The owner identified a bright line immediately above the horizon and a broader
gray area above it. Those are visible in the retained500m and2km noon frames;
the earlier pixel-scale-edge note did not adequately describe this appearance.

[Open the focused diagnostic comparison](../../../../../tmp/experiments/clean-horizon-profiles/runs/00062-horizon-bands/index.html).
It shows the original,480-interval view and atmospheric-path-only image for both
heights. Diagnostic run00060 reuses the exact original N4 field without a rebuild.
Its baseline float output matches the retained scene exactly, and path plus
attenuated scene composition reconstructs total radiance to better than6.3e-8
relative in the tested horizon region. Thus this is the same appearance under
controlled interventions, not a different source or exposure.

Findings:

- Both upper bands are present in atmospheric path radiance before exposure and
  before adding green-ground color. The lower scene contribution does not create them.
- Increasing view integration30->480 preserves the bands. Maximum sky-side RGB
  change within the tested central horizon region is0.69% at500m and1.06% at2km.
- Replacing mesh-only path termination with exact spherical ground clipping gives
  zero sky-side path-radiance change in that region. The initial endpoint/overlay
  explanation is not supported for these upper bands. The diagnostic total image
  does change on the ground side because earlier truncation can disable scene
  attenuation when the mesh endpoint lies farther; that version is not a fix.
- Eighteen native15 spherical MYSTIC calculations in00059 test the2km band at
  0.2,0.6 and1.2degrees above the limb, using three fixed pilot seeds and the
  same finite-pixel quadrature. The reference also changes brightness/color with
  angle. Our retained-field replay in00061 is about7.8% dim at0.2degrees,4.0%
  dim at0.6degrees and14.4% bright at1.2degrees. At1.2degrees its linear B/R
  ratio is1.102 versus reference1.236: it is too neutral as well as too bright.

This supports a mixed interpretation: physical atmospheric structure exists, but
our cached field distorts its brightness/color and exaggerates the gray region.
It does not establish that the narrow rim is entirely artificial, or distinguish
scattering-order truncation from spatial/angular cache reconstruction.

The reconstruction has extinction550 about13.2/Mm around1-1.3km versus1.5/Mm at
surface, while the native cache has no height node between0 and1875m. This motivated the executed height-resolution test below. The initial diagnosis
did not change height or outgoing sampling; the new test separates height build
propagation and final interpolation. Exposure/blur is not an evidence-based correction.

The focused report validates all parent artifact hashes, image dimensions,
float decomposition/baseline equality and local source types. Old galleries/runs
remain immutable, including the initial failed diagnostic00058 (composer lookup,
repaired in00060). No production source, profile, cache or display changed.


## Height-resolution hypothesis test

[Open the height-test gallery and ray tables](../../../../../tmp/experiments/clean-horizon-profiles/runs/00072-height-results/index.html).

Conclusion: height interpolation contributes to the gray-band shape, but denser
lower-atmosphere sampling alone is not a successful fix. The original claim about
the0-1875m gap was too narrow: the upper gray-band ray stays above1945m. Its direct
readout distortion occurs in the1875-3125m interval, with the aerosol layer's upper
edge spread across too wide an interpolation cell. This localization is supported
by a readout split, not inferred merely from a prettier image.

The experiment retained every original48 height knot and added100,300,500,800,
1000,1300,1600,2000,2500 and3000m (58total). A second construction also adds125m
sampling below3km (76total). Optics/profile, N4, incoming/outgoing and solar grids,
source, view30 and geometry were unchanged. Scene lighting and original frame gain
were held fixed to isolate atmospheric path effects, rather than relighting each
candidate. Actual GPU images at500m and2km noon are shown in the gallery.

Each field was read through the original48-node grid and its refined grid.
A separate texture bridge replays the original field with exactly matching linear
float output at both heights; native display replay differs by at most one RGB byte.
Build-only changes move the selected-ray Y error by less than0.5percentage point.
The large image/ray change occurs during final height interpolation, rather than
strong recursive magnification from constructing later scattering orders.

Signed luminance discrepancy against the same spherical MYSTIC pilot means:

| Readout and construction |0.2degrees above limb|0.6degrees|1.2degrees|
| --- | --- | --- | --- |
|Original48 / original48|-7.75%|-4.01%|+14.40%|
|58build / original48|-7.91%|-4.41%|+13.90%|
|58build / refined58|+20.50%|+19.82%|+5.95%|
|76build / refined76|+20.54%|+19.91%|+5.95%|
|58build / add lookup knots below1875m only|+21.03%|+20.76%|+13.90%|
|58build / add lookup knots above1875m only|-8.44%|-5.35%|+5.95%|

The final two rows are CPU replay diagnostics of the same retained58-height field;
they do not claim additional full-scene split renders. The corresponding center
rays have minimum heights518m,1322m and1946m. Adding only lower knots leaves the
upper gray-band sample unchanged; adding2000/2500/3000m knots changes it to the
same result as the full refinement. For that upper sample B/R improves from1.102
to1.156, versus reference1.236, while nearby lower-band samples become too neutral
under the full refinement. Physical/color accuracy is not established by removing
one visible gray region.

The58->76 dense refinement changes the three ray luminances by at most0.076%.
Both full-frame comparisons differ by at most one RGB byte. This is good local
height convergence, but the selected-ray mean absolute Y error gets worse:
8.72% original,15.42% at58heights and15.46% at76heights. Relative Y RMSE across the
same three means increases from9.72% to16.82/16.87%. These are three-direction
metrics, not full-sky RMSE. The upper-only diagnostic has mean absolute error6.58%,
but intentionally retaining a coarser lower grid is not a principled final fix;
it can preserve cancellation of another error.

At native resolution the upper gray strip is reduced under dense readout, the
near-limb region changes brightness/color, and the bright rim persists. No broad
black strips, missing support or stale state were found in the tested images.
The coarse-readout ablations retain the original band pattern. Six images for
58heights and six for76heights preserve original/build-only/dense comparisons.

Cost:15-channel compile/extract/pack/retention took139.0s at58heights and244.1s
at76heights; complete runs took229.0s and334.5s. Compiler-reported peak live field
allocation was179.61/235.35MiB. The isolated noon textures occupy495.49/649.27MiB
versus410.06MiB for their48-height bridge. These are selected32-solar-row texture
capacities, not complete production-package sizes or observed device peaks.
All180 solar positions were included in each N4 construction. Timings are observed
wall times, not controlled benchmark speed ratios.

Runs00063/00066 hold the fields/images;00064/00065 and00067/00068 hold dense/coarse
reference replays;00070/00071 isolate lower/upper lookup knots.00069 is the earlier
immutable result page;00072 adds the split and is the current complete report.
It rehashes the input artifacts and output-parent manifest identities, proves
non-height construction inputs equal, checks all original knots retained,
validates bridge output and local source types, and loads all12 gallery images
in a real browser without page errors. All new runs are accepted and owned
browser resources/temp profiles are closed/removed.

Disposition: the proposed first-gap explanation is only partly supported and
needs the interval correction above. Reject blanket lower-height refinement as
a sufficient solution to both horizon features. Another approximation remains;
angular reconstruction, remaining height transitions and order/reference mismatch
are not isolated by this test. Do not choose a coarse grid solely for a favorable
reference score. No further grid escalation, profile tuning, production promotion
or automatic experiment closure is part of this completed hypothesis test.


## Thin white rim: ground-object versus exact-sphere test

The owner specifically suspects the thin, clean white line is an exact-sphere /
visual-ground mismatch. This is separate from the broader gray-band height test.
[Direct alignment comparison](../../../../../tmp/experiments/clean-horizon-profiles/runs/00074-ground-alignment/index.html)
shows actual images and per-pixel masks for the original512x512 ground grid and
1024x1024 grid, a fourfold increase from524,288 to2,097,152 triangles. The saved
N48 ARM noon atmosphere/cache,500m/2km views, camera, exposure and lighting stay
fixed. No atmosphere cache was rebuilt.

The diagnostic compares the captured scene endpoint and an analytic sphere root
for exactly the same reconstructed pixel ray. Binary64 reconstruction from the
recorded camera independently checks the analytic hit mask. Both ground meshes
use R=6360000m, zero lift, the same tangent-frame origin and +/-900km patch extent.
This checks coverage and endpoint distances directly, rather than using the
absence of a WebGL error or an above-band radiance test as a geometry proof.

| Height | Ground segments per side | Mesh/sphere disagreement pixels | Median mesh-minus-sphere endpoint distance |
| --- | --- | --- | --- |
|500m|512|2|12.77m|
|500m|1024|1|3.01m|
|2km|512|0|10.22m|
|2km|1024|0|2.55m|

Counts cover52,224pixels in the1024x51 strip around each horizon. At500m the two
original misses are isolated at(x109,y289) and(x914,y289); refinement removes the
first, leaving the second. At2km there is no mask disagreement in this strip.
GPU analytic and independent binary64 hit masks agree at every tested pixel.
Distances are not exact: GPU float-root versus binary64 root differences reach
8.96m at500m and3.62m at2km near tangency, and mesh distance outliers reach hundreds
of meters near the most sensitive grazing rays. These are distinct from coverage.
Do not describe the ground as perfectly coincident in all numerical quantities.

The decisive rim check uses the two sky pixels immediately above the analytic
boundary in every column:2,048pixels per height. All are classified as sky by both
meshes and the sphere. After4x ground triangles their RGB bytes and linear RGB
are exactly unchanged. The white rim persists. At the image center, row287 is sky
and row288 is ground under both definitions and both mesh resolutions.

Therefore a small coverage/depth mismatch exists, but does not explain the
continuous white line in these cases. It can explain isolated edge specks and
must not be conflated with the full-width rim. The previous blanket description
of the geometry test was too broad; this direct measurement now states its scope.

One architectural detail matters: the ordinary live-view shader currently ends
paths at captured scene/ground-mesh depth. It does not independently clip final
view rays at the exact sphere. Exact spherical ground is used by other physical,
CPU and cache paths. At the visible boundary the live calculation switches from
a finite ground-ended ray to a longer atmospheric ray without a scene endpoint.
This test localizes the remaining white-line question to that radiance transition
or its approximation; it does not prove that the sharp rim radiance is physical.
A matched reference through the immediately adjacent pixel footprints would be
the next radiometric check, separately from mesh coverage.

Run00073 retains images, masks, float endpoints, mesh metadata and the unchanged
cache provenance.00074 verifies parent artifact hashes, cameras, physical radii,
mesh segment counts, independent hit geometry, rim-color comparison, local types
and all eight gallery images in a real browser. Resources/temp profiles are
closed/removed. Pixel-center/noon/heading/FOV limits and subpixel precision remain
explicit. Production, the profile, cache data and old evidence are unchanged;
the refined mesh is a diagnostic rather than a promoted production change.

## Actual compiler analytic ground-intersection test

The owner clarified that the target was the shader's true-sphere ground-hit
branch, rather than the meshes. The previous helper-sphere/mesh comparison did
not exercise the cache compiler's actual emitted function bodies. This follow-up
addresses that distinction explicitly.

[Actual-branch comparison gallery](../../../../../tmp/experiments/clean-horizon-profiles/runs/00079-analytic-results/index.html)
contains the original views, consistent analytic termination, a deliberately
naive clipping control and unmodified horizon crops. At500m and2km San Jose noon,
the continuous white rim and upper gray band remain. No production code changed.

Run00076 executes the actual compiler common GLSL with its recorded
anchored-radial/stable-factored policy. It calls representativePoint and
incomingPhysicalDirection before rayBlockedByGround, groundBoundaryHit,
atmosphereBranchLength, sphereRoots and firstPositiveRoot. This is actual GLSL
on an RTX2060 through Chrome155/D3D11, compared with binary64 geometry using the
same stored Float32 local cosine. It covers7800queries at all48 original cache
heights plus500m and2000m, four solar indices, three azimuths and13 angular
positions around each geometric limb.

Ground-hit classifications differ in192queries, all at the requested exact
tangent. None differ at any tested nonzero offset, including0.00001degrees.
Outside0.001degrees, maximum branch-distance error is2.603m across all tested
heights,0.052m at500m and0.123m at2km. Exact-tangent distance error can reach133m:
the discriminant is poorly conditioned there. At surface contact the negative
branch-length sentinel and first-positive-root selection have different intended
semantics; a far root in that contact case is not counted as a wrong near root.
The sphereRoots/firstPositiveRoot pipeline also agrees exactly with groundBoundaryHit
for3684positive-height ground queries with matching classification; no matching
sky query returns a positive ground root. This anchor probe does not validate
every displaced transport point.

Run00075 reuses the unchanged N48 N4 ARM noon field from00037. The live A/B uses
the actual emitted geometry bodies, with token renaming for collision avoidance
and live observer/ray anchor binding. The original instrumented float image is
identical to the stock capture. Analytic termination clips paths to physical
ground and aligns the scene endpoint when necessary so surface attenuation
remains applied. Closer scene objects retain their own termination.

| Height | Analytic ground endpoints | Scene paths shortened | Scene endpoints losing attenuation | Maximum change in2048sky-rim pixels |
| --- | --- | --- | --- | --- |
|500m|294114|294112|0|0linear RGB,0RGB bytes|
|2km|292894|292888|0|0linear RGB,0RGB bytes|

The center ground endpoint moves about27.6m/26.1m nearer at500m/2km, so the A/B
really exercises the termination difference. The sky immediately above the limb
retains exactly the original path lengths and radiance. Actual emitted
rayBlockedByGround and groundBoundaryHit agree throughout the52224pixel horizon
strip, and their hit masks agree with binary64 pixel-ray reconstruction.

Whole-frame differences are not all zero:500m has a48-byte maximum at the isolated
mesh/sphere coverage misses;2km changes by at most1byte. The diagnostic does not
synthesize green ground where the mesh misses. These isolated pixels must not be
confused with the unchanged continuous sky rim. A naive clip that leaves a farther
scene endpoint can disable attenuation and cause a22-byte green change at2km;
that control is not a valid correction.

Conclusion: the tested intersection arithmetic and live termination inconsistency
are not a sufficient explanation or correction for the continuous rim. This does
not establish that the cached near-limb radiance is physically correct. Source-field
values and interpolation across ground-crossing versus sky directions remain an
open, separate hypothesis, along with the previously measured height/reference
errors. Neither the N4 source field nor its angular stencils were changed here.

The scene capture took96.6s including cache loading, two baseline views and14
instrumented outputs; no N4 rebuild was performed. Run00079 rehashes all parent
artifacts, verifies actual branch/attenuation flags and the baseline bridge, runs
local source type checking and loads all10gallery images in a real browser.
Run00077 preserves the first report attempt, which rejected the known favicon404
alongside real browser errors; the corrected report accepts that exact favicon
message while retaining shader/page/host failure checks. Owned browser processes
and temporary profiles were closed/removed. There is no standards-compliance or
production-promotion claim.

## Larger native renders and preview-scale appearance

The owner's magnified crop did not show a distinct sharp white stripe, prompting
new native-resolution renders. [Large-image viewer](../../../../../tmp/experiments/clean-horizon-profiles/runs/00082-resolution-view/index.html)
provides500m and2km noon at1024x576,2048x1152 and4096x2304, defaulting to a single
full-width4096image. Select1:1to inspect pixels with scrolling. Direct original
PNGs, exact unmodified angular-region crops, a420px preview and selectable row
profiles are included. The larger images are freshly rendered, not upscaled.

Run00081 retains the four new GPU images/raw Float32 composites. N48 N4 source
field, ARM optics,50degree FOV, pose and illumination/display gain are unchanged
from00075. Every frame records and checks actual canvas, both composer buffers,
scene-color/depth/hit textures, capture viewport and shader viewport dimensions.
The GPU PNG and CPU re-encoding of its raw composition agree within1RGB byte.
The four-view run took102.8s, including source-field reuse, rendering and retention;
no cache reconstruction was needed.

An initial attempt00080resized the host canvas but left the separate active
staged composer's depth/hit inputs at the old resolution. This produced repeated
ground rows and is retained as a partial-resize diagnostic, not the accepted
native comparison. The contained harness now explicitly resizes that active
composer and verifies all dimensions after the completed frame. Production's
resize lifecycle was not modified or validated by this harness repair.

The enlarged crops refine our earlier description: the feature is a bright
near-horizon shoulder ending against darker ground, rather than an isolated
one-pixel white brightness spike in the inspected center-column profiles. The
last8 original-resolution pixel spacings of sky have no isolated local encoded-
luma peak at any of the three sizes. This does not remove the broad bright
shoulder or the upper gray strip, and does not validate their physical accuracy.
The sky/ground color step is present in the native pixels:

| Height | Native width | Last sky RGB | First ground RGB | Encoded-luma drop at boundary |
| --- | --- | --- | --- | --- |
|500m|1024|234,233,237|179,212,229|27.29bytes|
|500m|2048|234,233,237|185,215,231|23.72bytes|
|500m|4096|234,233,237|189,217,232|21.37bytes|
|2km|1024|219,220,232|202,216,232|6.48bytes|
|2km|2048|220,221,232|205,217,232|6.05bytes|
|2km|4096|221,221,232|206,218,232|5.33bytes|

Encoded luma here is0.2126R+0.7152G+0.0722B of PNG bytes, a display-contrast
quantity, not physical luminance. Higher resolution puts adjacent pixel centers
closer to the actual limb, so these edge samples have different angular support.
The decreasing jump is not a continuum convergence proof. A small preview can
emphasize the shoulder/boundary's apparent thinness; we have not reproduced the
owner's unknown browser zoom/filter and cannot attribute all appearance to it.
The earlier phrase continuous white rim should not be read as proof of a distinct
white one-pixel stripe in the source image.

The viewer separately labels a4096-to1024reduction: average each4x4block of raw
linear radiances, then apply the unchanged display transform. Versus the original
1024native image, mean absolute RGB difference across the1024x40horizon strip is
0.171/0.079bytes at500m/2km. Maxima are27/9bytes and are concentrated near the
boundary, where pixel footprints/coverage matter. This is a spatial-sampling
comparison, not a new physical reference or a claim to eliminate the artifact.

Run00082 authenticates all parent artifacts, checks common optics/pose/gain and
all dimensions, passes source types, and exercises24elevation/source/display
combinations in a real browser. All8image/crop pairs decode;1:1and420px display
widths are explicitly verified. Browser resources/temp profiles are closed.
No production/profile/cache change or new reference qualification is claimed.

## Fine vertical spherical libRadtran comparison

The owner requested a finely resolved above-horizon reference trace against the
production algorithm. [Final three-seed plots, spectra and CSVs](../../../../../tmp/experiments/clean-horizon-profiles/runs/00091-vertical-results/index.html)
compare the current ARM-informed500m and2km San Jose noon atmosphere with fully
spherical libRadtran/MYSTIC. Production here means the actual production GPU
transport/cache shader with this experimental atmosphere, rather than a change
back to the default Bruneton aerosols. The atmosphere and N48 N4 field are fixed.

There are95directions per height: fine sampling through approximately2degrees
above the true geometric limb, closer limb controls, and sparse context to5degrees.
The original87image-row queries match the4096x2304central column. A corrected
registration then retargets GPU queries to the exact physical reference angles;
those retargeted queries are not claimed to remain exact image pixel centers.
Reference inputs use their recorded angles rather than rounded nominal labels.
Each reference direction has three independent100000photon seeds per native
wavelength, yielding570complete native15 spectral cases. Source, phase/SSA,
vertical aerosol table, molecular coefficients, black boundary and planet radii
match; no refraction/gas absorption is added. All-orders MYSTIC remains distinct
from N4 production. These are point rays, not finite-pixel averages or a ground
surface render.

| Height | Region above limb | Production luminance difference vs MYSTIC | MYSTIC Y and95% halfwidth (cd/m2) |
| --- | --- | --- | --- |
|500m|0.00278degrees|+3.87%|8212.9 +/-108.1|
|500m|0.59642degrees|-5.01%|7555.4 +/-15.7|
|500m|1.20272degrees|-8.06%|7395.2 +/-20.9|
|2km|0.00420degrees|-5.49%|7384.1 +/-30.6|
|2km|0.59805degrees|-4.07%|7394.6 +/-48.9|
|2km|1.19671degrees|+14.54%|8582.6 +/-103.5|

At500m the95-point error range is-8.16% to+3.90%; mean absolute relative Y error
is5.90%. At2km it is-8.68% to+14.55%; mean absolute error is8.83%. These describe
this directional trace, not a full-sky RMSE. Worst normalized spectral RMSE is
9.64%/12.31% at500m/2km. Maximum reference Y95% halfwidth is1.51%/1.26% of its
mean, well below the largest observed differences. Intervals use Student t(df2)
from per-seed integrated luminances, preserving within-spectrum covariance.
They are pointwise, not a simultaneous angular confidence band; common seeds
across directions correlate the angular noise.

Both solvers produce broad near-limb structure. At2km, within the sampled
0to2.05degree region, the production brightness rise from its local minimum to
maximum is50.6%, versus20.8% for MYSTIC. Sampled production maximum is near1.31degrees,
while the sampled reference maximum is near1.50degrees. These are sampled extrema,
not fitted peak positions or peak-angle confidence estimates. Around1.20degrees,
production linear-RGB B/R is1.116 versus reference1.250: the excess is less blue
and more neutral. The broad gray/bright band therefore has a physical-reference
counterpart, but production exaggerates its brightness and neutrality.

At500m the corresponding maximum/minimum ratio excess is25.6% in production
versus11.1% in the reference; the brightening very close to the limb is real in
both calculations, with a steeper production contrast. This above-limb trace
does not independently validate the abrupt sky/green-ground pixel transition.
It does not establish a separate one-pixel white stripe or eliminate effects
from displaying the images at small preview size.

Increasing only live view integration from30to480intervals changes Y by at most
0.513% at500m and0.693% at2km. It does not remove the measured discrepancy. Raw
spectral differences precede exposure/scaling. Missing orders above N4 alone also
cannot explain the positive2km lobe: omitted scattering contributions are
nonnegative. The result does not isolate cache interpolation, source construction,
remaining geometry approximations or reference discretization as the cause.
The negative500m differences can still contain an order-tail contribution.

Verification: original GPU queries reproduce source4096image RGB to3.3e-6relative;
spectral-to-production-RGB projection agrees to4.6e-7. After correcting an
inverse-trig diagnostic, actual GPU/reference elevations agree within2.7e-6degrees
and azimuths within1.6e-6degrees. Every retargeted ray has no scene/ground endpoint.
The reference run is accepted with570successful cases. Final report00091rehashes
all parent artifacts, reparses every raw spectrum, checks actual SZA/height/view/
seed/photon/source-spectrum inputs, passes local source types and exercises both
height selections with all six PNG figures loading in a real browser. PNG/SVG
figures, common-exposure color samples, pointwise intervals and selectable CSV/
JSON preserve the derivation. The512-layer reference export is retained from prior
work; no new full layer/order-tail convergence or measured-profile qualification
is claimed. Browser resources/temp profiles are closed.

Evidence chain:00083original GPU probe;00084all three reference seeds;00085corrected
GPU registration;00086isolated prebuilt plotting libraries;00088GPU proof;
00090single-seed preview;00091final comparison.00087retains a sandbox-blocked
child type-check attempt, retried successfully in00088.00089is the earlier preview
with cosmetic title encoding repaired in00090. All earlier runs remain immutable.

Cost: reference calculation/staging took1628.1s (27.1min) with four concurrent
processes; sealing completed at1667.5s. Median individual case wall time was10.77s.
The run retains25140hashed artifacts totaling774.8MiB, plus its6.5MiB manifest.
Those are logical file sizes and observed wall times, not isolated solver CPU
benchmarks. No new atmospheric cache was built. Production remains unchanged.


## Combined trace across the opaque-ground boundary

The owner requested the missing below-limb trace, combined with the existing sky
samples. [Combined profile, edge detail, spectra and color viewer](../../../../../tmp/experiments/clean-horizon-profiles/runs/00095-limb-results/index.html)
is accepted. It preserves all190 previous direction rows and570 reference cases
unchanged, adding35 directions per height and210 successful three-seed MYSTIC
cases. The combined260 directions cover ground context to-2degrees and sky to
+5degrees at500m and2km, with paired controls down to approximately+/-0.00025degree
from the geometric limb. These are point rays, not finite-pixel averages.

The sharp boundary is distinct from the broad above-horizon gradient. Both the
fully spherical reference and production show a substantial radiance drop when a
ray first meets opaque ground. The below-limb ray loses the atmospheric path
behind that surface. The broad gray-band disagreement remains above this edge;
it is not an explanation for compressing a smooth gradient into the sharp step.

The cache/reference boundary is black. The app adds a separately lit green RGB
surface. To hold that input common, the report independently integrates the
reference extinction along exact spherical shell paths, then forms
`reference atmospheric path RGB + captured scene RGB * reference transmission RGB`.
This is a controlled reference hybrid, not a self-consistent reflective green-ground
libRadtran scene. No spectral ground reflectance or ground-light feedback is
invented. Production uses the actual GPU path and the same captured surface input.

| Height | Reference hybrid drop across adjacent4Kpixels | Actual production drop | Reference / production display-luma drop (byte scale) |
| --- | --- | --- | --- |
|500m|27.49%|26.86%|23.44 /21.37|
|2km|6.56%|6.60%|4.91 /5.33|

Percentage drops use linear-RGB luminance before display tone mapping, looking
from the first sky pixel to the first ground pixel at approximately+/-0.011596degree.
Physical spectral luminance is reported separately for the atmospheric path.
At the closest paired controls, its black-boundary drop is31.07% in MYSTIC versus
30.04% in production at500m, and7.48% versus7.56% at2km. With the common surface,
linear-RGB drops become23.23% versus22.48%, and5.28% versus5.24%. These are finite
separated samples, not an extrapolated exact-tangent limit. Paired three-seed
95% uncertainty preserves cross-direction covariance.

The reference therefore supports the existence and approximate contrast of the
native ground/sky step. It does not qualify the entire atmosphere, resolve the
broad gray-band error, or establish a separate isolated white-pixel stripe.
N4 production versus all-orders MYSTIC and reference layer discretization remain
explicit limitations. No production shader, profile, cache or display changed.

Verification:00092 captures actual4096x2304 scene inputs and stock/analytic30/480
interval paths.00093 adds the210 cases using unchanged authenticated optical
inputs from00084. Installed libRadtran source confirms that its lower-row layer
convention matches the existing export; no old reference correction is needed.
00094 independently checks spherical extinction/transmission, GPU projection,
surface composition and actual pixel agreement. GPU/image relative RGB error is
at most1.36e-6; independent transmission convergence is below1e-9 absolute, with
exported-layer versus continuous-profile differences below1.54e-6.00095 rehashes
parents, reparses all new spectra, checks actual view/seed/height inputs, and
passes local source types plus both gallery selections in a real browser. The
edge and combined plots were visually inspected. Stock image claims use actual
pixel centers; continuous subpixel comparisons use analytic sphere endpoints.

Reference calculation/staging took487.55s (8.13min), with four concurrent solver
processes; sealing completed at500.98s. No old sky case was rerun and no cache was
rebuilt. All earlier runs remain immutable. Further investigation requires owner
selection; the requested combined trace is complete.


## Matched native raster horizon comparison

[Final native PNG comparison and reading guide](../../../../../tmp/experiments/clean-horizon-profiles/runs/00106-raster-assess/index.html)
provides the missing independent raster comparison. Each method supplies two actual
central camera columns (x2048/2049) by96rows (y1080-1175) of the same4096x2304,
50degree San Jose noon view at500m and2km. This is a narrow horizon strip, not a
full-sky reference image. Enlargement copies pixels128times horizontally and
4times vertically, with pixelated browser display. No image-color interpolation,
denoising or fitted exposure is added. The raw512x96 production context is also
shown. All eight primary path/composite strips were visually inspected.

Independent spherical MYSTIC reference rays are computed at the actual GPU-derived
subpixel directions. Image-area2x2 Gauss integration happens before display mapping;
eight edge rows additionally have4x4 controls. There are2048 unique subrays and
6144 three-seed cases, each with10000 photons per native wavelength. Source/model,
black-ground boundary, native15 channels and display are unchanged. The original
N48 N4 field is reused; no cache is rebuilt. Native center samples reproduce the
actual image within3.30e-6relative RGB, physical elevations match within1.82e-6degrees,
and spectral/RGB projection within4.04e-7. Primary production strips retain stock
shader endpoints and native scene buffers; exact-sphere termination is a separate
control. Scene buffers retain their native sampling during atmospheric supersampling.

The pale shoulder and ground step are present in both rasters. At2km, production
also has a stronger small sky-side rise; it is not merely hidden by an SVG gradient.
The wider production gray/bright band is more pronounced, consistent with the
previous trace. Around1.2degrees in these pixels, production atmospheric linear-RGB
luminance proxy is about7.8% below the reference at500m and14.3% above it at2km.
These pixel-proxy values are distinct from the earlier physical CIE-Y trace metrics.

| Height | Feature | Production change,4x4 pixels | MYSTIC change and paired95% halfwidth |
| --- | --- | --- | --- |
|500m|Final two sky rows|+0.302%|+0.219% +/-0.305percentage points|
|500m|Three-row sky shoulder|+1.101%|+0.595% +/-0.830points|
|500m|Sky to ground|-35.600%|-35.641% +/-1.279points|
|2km|Final two sky rows|+0.519%|+0.094% +/-0.185points|
|2km|Three-row sky shoulder|+1.597%|+0.402% +/-0.961points|
|2km|Sky to ground|-9.402%|-8.801% +/-0.493points|

Here4x4 means subpixel quadrature within each native pixel, not a different camera
resolution. Changes use atmospheric-path linear-RGB luminance proxy before display
mapping, averaging the two columns. The final sky pair is rows1150to1151; the
three-row shoulder is1148to1151; ground begins at1152. Each reference seed supplies
a paired row ratio, then the three ratios supply a mean and Student t(df2) interval.
Shared seeds retain angular covariance and also correlate the2x2/4x4 results.
Intervals are pointwise, not simultaneous confidence across the image; the finer
sampling is a consistency check, not an independent replication. The2x2 results
have the same direction: at2km final-sky rise0.519% versus0.091% +/-0.311points.
Thus500m shoulder differences remain unresolved, while the selected2km pairs
support a local production excess under these fixed inputs. They do not establish
an isolated spike everywhere along the horizon or identify its numerical cause.

Actual stock production2x2-to4x4 edge path changes are at most0.00190% /0.00136%
at500m/2km. Reference mean changes are at most0.40% /0.12%, with Monte Carlo
uncertainty retained. No full pixel/refraction/layer/scattering-tail convergence
or observational atmosphere qualification is claimed. N4 versus all orders remains
a material difference. Cache interpolation/source construction are unseparated.

Atmosphere-only images are the independent black-boundary comparison. The green
surface version remains a controlled hybrid: MYSTIC path plus the same captured
app RGB surface times independently calculated spherical extinction/transmission.
It does not add reflective-ground feedback. With the common surface,2x2 sky-ground
proxy drops are26.86% production versus26.35% reference at500m, and6.60% versus6.29%
at2km. Those composite means do not carry a new simultaneous uncertainty claim.

Evidence:00098 native capture;00101 GPU/footprint proof;00099 direct point pilot;
00100 intentionally stopped/sealed partial batch;00102 complete accepted reference;
00103/00104 provisional completed500m subset/images;00105 final pixel composition,
raw/deck/input/image/projection checks and gallery;00106 final assessment with
both quadrature orders and byte-identical PNG copies. All6144 raw spectra are
reparsed and view/height/seed/photon/wavelength inputs checked. Installed solver
and data identities are unchanged. Final local source types and real-browser
image decoding/pixelated presentation pass. Earlier runs remain immutable.

The installed camera-grid pilot00096 rejects an unavailable parser option.00097
exits successfully but returns zero camera radiance; it is explicitly unqualified,
and none of its spectra supplies an image. Point quadrature uses the previously
working spherical solver. The intentional concurrency transition reuses1236 closed
reading receipts from00100 in00102;4908 more cases are computed. Four old raw outputs
without closed receipts are conservatively recomputed and match byte for byte.
No previous570/210 sky/limb reference case is rerun for this raster study.

Cost: native capture108.25s; partial reference run631.19s including sealing;
resumed complete batch1683.07s including sealing, with1627.98s calculation/validation
in the resumed worker. Combined observed reference-run wall time is38.6min, not an
isolated solver CPU benchmark. Partial and resumed runs retain7.75/27.79MiB of
hashed artifacts plus manifests; browser/report work is additional. More parallel
workers reduce waiting without changing physics. No production profile, cache,
shader, app setting or display policy changes. No further run is automatically selected.


## Owner-requested flat/local closest images

[Open the two requested images](../../../../../tmp/experiments/clean-horizon-profiles/runs/00108-flat-closest/index.html):
[5m PNG](../../../../../tmp/experiments/clean-horizon-profiles/runs/00108-flat-closest/flat-5.png) and
[100m PNG](../../../../../tmp/experiments/clean-horizon-profiles/runs/00108-flat-closest/flat-100.png).
Both use San Jose, Flat/local, Closest (the app's Flat0 preset), default50degree
vertical FOV, horizon centered and review objects disabled. Ground remains visible.
The native frames are2048x1152. The source azimuth sets the horizontal heading;
the Sun is naturally outside this horizon-centered closest view. The same frozen
ARM model00029 supplies coefficients, vertical aerosol density, SSA and phase.

The ordinary flat app uses compact localN1, rather than globeN4. To render the
layered profile faithfully, the contained bundle substitutes that profile's density
and exact piecewise-linear flat columns in CPU optical depth, GPU cache/source
columns, normalization factors and live transport. The existing ArmAtmosphere
provides the same conditional phase. No production source or asset changes.
The normal flat100km top remains; the profile sampler retains its defined clamp
beyond its last height (the retained aerosol endpoint is zero). The flat cache's
original policy labels remain in app metadata; adaptation.json records the actual
layered-column substitutions. This is a profile render, not promotion or a new
Bruneton-score/algorithm-correctness claim.

00108 verifies actual canvas/composer/scene-color dimensions, physical5m/100m
states, location/time/mode/FOV/object flags, and zero GL error on the NVIDIA RTX2060.
All pixels are nonblack, with1185/1466 distinct RGB values. Both images were
visually inspected. Exact CPU columns agree with independent65536-midpoint
integration within2.05e-6relative across the selected controls. Accepted00109
rehashes the sealed capture, verifies both gallery images in a real browser, and
runs the exact retained live-shader density/column functions on WebGL2 against
the CPU values: maximum relative/floored error4.28e-8 for density and1.14e-7 for
columns, with zero GL error. Local authored types pass.

00107 is the preserved initial export attempt: rendering/state checks passed but
visual inspection rejected its blank PNGs because capture occurred after an async
bridge allowed the browser to clear its drawing buffer. It is not usable image
evidence despite its execution-accepted manifest.00108 draws and exports
synchronously and adds explicit pixel-content checks. Earlier runs remain immutable.
No full independent flat-scene radiance reference or B1 rerun is claimed. The
owner's Bruneton non-regression requirement remains binding on accepted fixes.


## Owner-requested paired views at500m

[Flat/local Closest and Globe/distant noon](../../../../../tmp/experiments/clean-horizon-profiles/runs/00113-paired-500m/index.html)
provide the requested two native2048x1152 images at500m: same frozen ARM model,
San Jose, default50degree vertical FOV, horizon centered, no review objects,
ground retained. Flat uses horizontal pitch; Globe centers its actual depressed
limb (about0.7184degree). Click each image for its unchanged full PNG.

Flat00110 and Globe00111 are accepted and visually inspected. Flat retains a
broader brown-gray shoulder; Globe has a sharper ground boundary with a thin
bright rim. No scene object or broad black strip is visible. These compare the
requested app modes: finite/local Closest illumination with localN1 versus
distant/noon illumination with globeN1-4 and their native exposure. The difference
is not an isolated measurement of curvature, scattering order or aerosol effects.

The flat runner now accepts explicit height arguments while retaining5m/100m
as its default. The Globe runner's contained still-500 mode hides objects and
captures only500m at2048x1152. It authenticates and reuses the existing00037 ARM
N4 field without rebuilding it. Actual canvas/composer/color/depth/hit sizes,
state/location/time/height/FOV, physical height, hidden review meshes and zero GL
error are checked. Globe native HDR/display replay differs by at most one byte.

Focused00112 rehashes the Flat capture, checks its live density/column functions
on hardware GPU, image decoding and local types. Final00113 rehashes both renders
and that proof, checks matching profile,500m states, horizon poses and hidden
objects, copies PNGs byte-for-byte, verifies image content and browser decoding,
and passes local types. No production update, accepted numerical fix, full flat
radiance reference or new B1 result is claimed. Existing non-regression requirements
continue to apply to any later accepted algorithm changes.


## Flat ground-extent hypothesis test

[Native image comparison and exact pixel metrics](../../../../../tmp/experiments/clean-horizon-profiles/runs/00115-flat-extent/index.html)
complete the owner-requested extent test at San Jose500m, Flat/local Closest,
same ARM profile and no review objects. New00114 renders a fresh baseline,
extension-only, extension plus farther camera clip, and baseline-return at both
50degree and5degree vertical FOV.00115 verifies and publishes the six comparison
images; both runs are accepted. Production is unchanged.

The existing1800km-wide plane and all2048 triangles remain intact. An eight-triangle
coplanar ring increases width to7200km, borrowing the same ground material and
shadow settings. Extent-only retains the1200km camera far clip. The separate far
control increases that clip to4800km; physical atmosphere boundaries, cache,
camera position/direction, illumination and exposure remain unchanged. Actual
shader hit/endpoint/atmosphere-bound values are retained for five full-height
pixel columns. The5degree views are matched diagnostic zooms, not app preset changes.

**Result: increasing the ground extent alone does not change any image byte at
either FOV.** At5degrees the center-column first ground hit moves from row583
(about879km) to581(about1199km), yet atmospheric composition erases the visible
surface difference. The broad gray-brown shoulder is unchanged. This rejects
finite patch size as a sufficient explanation for that shoulder in this view.

With the farther clip, the50degree image changes by at most one RGB byte.
The5degree close-up changes one2048-pixel row(y578), by at most25RGB bytes;
all other rows remain within one byte. This is a new thin line, not removal of
the broad shoulder. Its center ground endpoint is about2638km away while the
shader's atmosphere segment ends near1930km at the configured dome. The control
therefore exposes a separate ground-beyond-atmosphere composition issue and is
not proposed as an appearance fix. Row localization is derived from per-pixel
maximum RGB-channel differences greater than one between the retained baseline
and extended-far PNGs, without resampling.

Fresh default baseline reproduces delivered00110 exactly; both baseline-return
controls also reproduce exactly. Actual original vertex data/camera pose/lux
remain protected, retained shaders/source/profile/lighting match, GL errors are
zero, six gallery images decode at2048x1152, and local authored types pass.
The original and extended default frames are visually equivalent; close-up
baseline and farther-clip frames were inspected and the thin new line retained.
No new cache, profile tuning, production change, accepted numerical fix or B1
score claim. Atmosphere/source-field behavior and configured atmospheric boundary
remain separate leads; this test does not establish which causes the shoulder.


## Field-of-view preset comparison

[Interactive preset comparison](../../../../../tmp/experiments/clean-horizon-profiles/runs/00118-fov-presets/index.html)
provides all seven current perspective presets:120,90,50,35,20,5and2degrees
vertical FOV. Each has a native2048x1152 Flat/local Closest and Globe/distant noon
image at San Jose500m, same ARM atmosphere, horizon centered, no objects and
original ground/clip. The dropdown opens at20degrees; show-all displays14images.
Every image links to its native PNG.00116 Flat,00117 Globe and00118 comparison
are accepted immutable runs.

The sweep supports the owner's framing observation. At35/50degrees and wider,
Flat's fade occupies a narrow screen band and appears more abrupt. At20degrees
it is easier to distinguish the soft Flat transition from Globe's distinct edge
while retaining surrounding context. The5degree pair shows this distinction most
clearly: Flat gradually blends through the distant ground/sky colors while Globe
retains a recognizable horizon.2degrees magnifies it further but discards much
scene context. These are presentation recommendations from inspected images,
not numerical acceptance thresholds or proof of physical correctness.

No aerosol, cache, exposure, camera position/direction, ground or clipping changes
are used to create the effect. A1degree band at image center spans about21.6pixels
at50degrees,57.0at20degrees,230.3at5degrees and576.0at2degrees. This follows
H*tan(0.5degree)/tan(verticalFov/2), and describes projection scale rather than a
measured haze-width/convergence result. Renderers recompute every native frame;
none is an enlarged crop or an interpolated image derived from another FOV.

The Flat path uses the public app FOV setter and verifies actual camera/app state,
fixed pose/far clip/lux/shader/original mesh, output sizes and no GL errors.
Globe authenticates the existing00037 N4 field and retains matching packets,
illumination/gain, observation, pose and output/input sizes. Native HDR/display
replay stays within one RGB byte. All seven pairs were visually inspected;
no missing objects, blank frames or broad black strips appeared. Globe's thin
bright rim and the broad atmospheric color differences remain visible.

00118 rehashes capture parents, checks profile/mode/height/FOV/object/pose and
protected factors, image content/dimensions and interactive selector/show-all
behavior in a real browser, and passes local types. Both return-to50 controls
reproduce exactly. Prior delivered50degree Flat reproduces exactly and Globe
within one RGB byte. Observed run elapsed times:94.79s Flat,80.43s Globe and14.05s
report/verification, including run sealing. These are capture-run costs, not
interactive shader frame benchmarks. No new Globe cache build was needed.

Each mode retains its own horizon-centered pose, source geometry, localN1 versus
globeN1-4 and native adaptation. This compares app appearance rather than isolating
curvature or validating a physical atmosphere. Production settings, cache and
Bruneton scores remain unchanged; no accepted algorithm fix is claimed.


## Near-ground FOV follow-up at100m and5m

[Combined height/FOV viewer](../../../../../tmp/experiments/clean-horizon-profiles/runs/00123-fov-heights/index.html)
adds the requested100m and5m comparisons and retains the previous500m set.
All seven perspective presets(120/90/50/35/20/5/2degrees) have Flat/local Closest
and Globe/distant noon pairs. The viewer opens at100m/5degrees, labels the selected
altitude explicitly, and links each unchanged native2048x1152 PNG and metadata.
Separate complete galleries remain available at
[100m](../../../../../tmp/experiments/clean-horizon-profiles/runs/00121-fov-presets/index.html) and
[5m](../../../../../tmp/experiments/clean-horizon-profiles/runs/00122-fov-presets/index.html).
The combined viewer links42primary images, including14reused500m frames.

00119 captures both Flat heights with distinct height-qualified FOV filenames;
00120 captures both Globe heights while authenticating/reusing the same00037
ARM N4 field. Ground extent, camera clipping, atmospheric reconstruction, source
configuration and native display policy remain unchanged. Within each height/mode,
only FOV changes; camera position/direction and illumination/exposure stay fixed.
Each mode continues to center its own horizon independently. Native adaptation
may differ between heights, so screenshots alone are not calibrated cross-height
radiance comparisons. LocalN1/globeN1-4 and source-geometry differences remain.

Visually,100m still shows a soft Flat fade at5degrees and more clearly at2degrees.
At5m that transition is much more compressed: both modes look sharply divided
at ordinary framing, and even the narrowest current preset gives a less striking
fade-versus-edge contrast than500m. The500m framing recommendation should not be
treated as height-independent. All28new native frames were visually inspected;
no blank frames, unexpected scene objects or broad black strips were found.
The narrow ground/sky band and native color differences are retained.

00121/00122 authenticate both capture runs, verify actual height/mode/FOV/pose,
no-object state, viewport/input dimensions, profile, fixed factors, native image
content, browser controls and local types. All four return-to50degree images match
exactly. The new100m/5m Flat50degree frames also reproduce earlier00108 exactly,
including5m after the100m sequence. No prior matching no-object native Globe
baseline is claimed at these heights; those use the exact return controls.
Globe HDR/display replay remains within one byte.00123 rehashes all three report
parents, verifies all42linked image states/dimensions and tests all21height/FOV
selector combinations in a real browser, with zero errors and passing types.

Observed elapsed times, including sealing:129.43s Flat,119.01s Globe,13.06s100m
report,12.92s5m report and10.41s unified viewer. Respective retained artifacts are
200.76/229.90/5.34/5.18/0.51MiB; the two capture runs retain full raw/HDR evidence.
These are capture/report costs, not interactive frame benchmarks. No new Globe
cache build, production update, numerical fix or Bruneton score claim. All earlier
evidence remains immutable; no further investigation is automatically selected.


## Object-enabled100m/5degree views

[Object-facing comparison](../../../../../tmp/experiments/clean-horizon-profiles/runs/00126-objects-100m/index.html)
provides the requested Flat/local Closest and Globe/distant noon images at100m,
5degree vertical FOV, same ARM atmosphere and native2048x1152. Original review
objects are enabled, without relocation or scaling. Previous Sun-facing headings
looked away from the negative-Z object group, so both cameras turn toward it;
Flat remains level and Globe centers its depressed horizon. Camera position,
ground, clipping, medium, illumination, exposure and cache are retained.

Three nearby/object-edge compositions are preserved: yaw-14/-4/35degrees from
negative scene-Z. At5degrees the nearby boxes are larger than the vertical frame
and therefore cropped; two headings leave different amounts of clear horizon.
The distant-edge heading shows the very faint far box without enlarging it.
The page has a framing selector and a matching hidden-object control. This is
an app-appearance comparison with localN1 versus globeN1-4 and their existing
source-geometry/native-adaptation differences, not isolated curvature validation.

00124 Flat and00125 Globe captures are accepted; the existing00037 ARM N4 field
is reused.00126 authenticates both parents and checks actual height/FOV/mode,
profile, object flags/transforms, camera/viewport, zero GL errors, PNG contents,
frustum intersection and a nonzero visible pixel effect versus the hidden controls.
Nearby framings alter about0.74-0.93million pixels; the far box is much fainter
(max8RGB bytes Flat and2Globe). All six object-enabled images were visually
inspected. All six gallery control combinations decode correctly in a real
browser, and local authored types pass. Images are copied from synchronous native
PNG exports without resizing or color adjustment. No production update, new
numerical fix or Bruneton score claim; earlier evidence remains immutable.


## Back-two-only100m/5degree views

[Updated Flat/Globe pair](../../../../../tmp/experiments/clean-horizon-profiles/runs/00129-objects-100m/index.html)
implements the owner's requested removal of the four nearer objects. Only review
objects5(distant cyan) and6(far orange) are visible; objects1-4 and their shadow
participation are hidden. All original transforms/sizes remain unchanged. Both
cameras face the back pair at20degrees from negative scene-Z, retaining100m,
5degree vertical FOV, horizon-centered pitch, same ARM profile, ground/clip,
illumination/exposure and localN1/globeN1-4. Native PNGs are2048x1152.

00127 Flat,00128 Globe and00129 publication/verification are accepted. Final
frames record exactly the selected two visible meshes and both intersect each
view's frustum; all nearer meshes are hidden. Matching all-hidden controls retain
camera/lux/transforms and demonstrate actual pixel effects(954933Flat and714554
Globe pixels change by more than one RGB byte). Both primary images were visually
inspected; the cyan object's upper part is cropped by the narrow frame. Browser
image/control checks, zero GL error, immutable parent hashes and local types pass.
Original objects were neither deleted from production nor moved/resized. No
production or numerical change, new cache build or Bruneton score claim.


## Wider back-two views at100m

[20degree and35degree Flat/Globe comparison](../../../../../tmp/experiments/clean-horizon-profiles/runs/00132-objects-100m/index.html) widens the owner's
previous5degree view while keeping the same ARM profile,100m height,20degree
object-facing yaw, mode-specific horizon pitch, original transforms, ground,
clipping, source and native exposure. Only review objects5/6 remain visible;
nearer objects1-4 and their shadows remain hidden.20degrees fits the full cyan
box with substantial sky/ground context;35degrees provides more surrounding space.
The far object remains a faint bar in Flat and is much less visible in Globe.
These remain localN1 versus globeN1-4 appearance views with different source
geometry/adaptation, not an isolated curvature or numerical-accuracy comparison.

00130Flat and00131Globe captures are accepted; the Globe reuses00037's N4 cache.
00132 authenticates parents and publishes four native2048x1152 images plus their
all-hidden controls without resampling or color edits. Actual metadata confirms
requested FOV,100m height, selected visibility, original transforms, both retained
meshes intersecting the frustum, zero GL errors and unchanged hidden-control
camera/lux. Enabled objects affect157620/118559pixels at20degrees and49164/37407
at35degrees(Flat/Globe,more than one RGB byte). All four primary images visually
inspected. Four gallery FOV/visibility combinations decode correctly in a real
browser, and local authored types pass. Globe capture took71.9seconds including
reuse/publication/capture; this is not an interactive frame benchmark. No new
Globe cache build, production change or Bruneton score claim. Prior evidence
remains immutable.


## GreenSea static ground-material trial

[GreenSea versus original ground](../../../../../tmp/experiments/clean-horizon-profiles/runs/00137-water-100m/index.html) implements the owner's requested
GreenSea trial using their `references/textures/GreenSea_S.jpg` and `_N.jpg` pair.
Both are2048x966. The original images remain unmodified; the contained renderer
loads color as sRGB and normals as linear data, with repeated world-X/-Z UVs,
100m-wide by47.168m-high tiles, normal strength0.6, mipmaps and16x anisotropy on
the capture device. The normal convention is Three's default tangent-space
convention; no authored convention was supplied or independently calibrated.
The ground retains Lambert lighting, with white material tint replacing the
green tint so the photograph supplies its color. Only UVs/material change:
original ground positions, indices, surface termination and meshes remain.

The four primary frames retain100m elevation,20/35degree FOVs,20degree yaw, only
objects5/6, same ARM atmosphere, physical source, cache and native display.
Water appears blue-green with visible wave detail. Regular repetition forms bands
and converging patterns toward the horizon;100m is an illustrative tile scale,
not a measured wave scale. The photo includes fixed lighting/perspective cues.
This is static surface appearance: no displacement, animation, reflective-water
material, new ground-reflection scattering field or physical-ocean claim.

00135Flat and00136Globe captures are accepted, reusing00037's Globe N4 field.
00137 authenticates both parents and the original00132 gallery, verifies matching
camera/profile/object transforms/lux, exact map identities, attached color/normal
maps, unchanged vertices/indices and zero GL errors. Against the original ground,
all eight frames retain byte-identical pixels in the clear-sky upper fifth and
change587776pixels by more than one byte in the lower quarter. This proves a
visible surface effect; no isolated normal-only contribution was measured.
Eight material/FOV/visibility gallery combinations decode in a real browser;
local authored types pass and all four primary images were visually inspected.
Images remain native2048x1152 with no resampling or post-color edits. Capture
wall times were107.9s Flat,55.4s Globe and12.5s report; no interactive performance
benchmark is claimed. No production or atmospheric numerical update, new Globe
cache build or Bruneton score claim. Previous evidence remains immutable.

Texture credit: Keith333, [Water - Batch of15Seamless Textures with normalmaps](https://opengameart.org/content/water-batch-of-15-seamless-textures-with-normalmaps),
CC BY3.0. The original paired images are scaled/repeated and their normals used
for lighting. The owner-supplied15-file texture library is preserved unchanged.


## GreenSea elevation series50m down to10m

[Five-height Flat/Globe gallery](../../../../../tmp/experiments/clean-horizon-profiles/runs/00140-water-heights/index.html) supplies the owner's50,40,30,20,10m
sequence at both20/35degree vertical FOVs:20primary2048x1152 images plus20matching
all-hidden object controls. The page selects elevation, FOV and object visibility;
full PNGs and actual metadata remain directly accessible. All modes retain San
Jose, the ARM reconstruction, GreenSea color/normal pair,100m tile width,0.6normal
strength,20degree object-facing yaw, original ground/object transforms and the
back two meshes5/6. The horizon pitch is level in Flat and adjusted to the true
geometric limb at each Globe elevation. Existing source geometry/native exposure
and localN1/globeN1-4 distinctions remain. This is an appearance series, not an
isolated curvature test or a numerical algorithm improvement.

The app's discrete elevation allow-list did not include these heights. Both
contained bundles replace only that check with finite5-40000m acceptance; the
production controls remain unchanged. Each requested height is within the existing
cache domain.00138Flat/00139Globe are accepted; Globe authenticates and reuses
00037's unchanged N4 field. Actual observer height, camera Y, FOV and horizon pitch
are checked at every capture; height-specific names prevent overwriting evidence.
The material is restored before the next elevation's ordinary scene preparation.

00140 authenticates both parent manifests/artifacts and publishes the native PNG
encodings without resizing or color edits. All40frames pass actual height/mode,
profile/material identities, map attachment, unchanged ground vertices/indices,
selected visibility, native dimensions and zero GL-error checks. Hidden controls
retain camera/lux/object transforms and produce measurable object differences in
all20pairs(34094-157642pixels change by more than one RGB byte). All20gallery
height/FOV/visibility combinations decode correct images in a real browser, local
source types pass, and all20primary images were visually inspected. Foreground
wave patterns enlarge as the eye lowers; repeating texture bands and photographic
lighting remain. No normal-only, interactive-performance or new reference-accuracy
claim is made. Capture wall times:318.9s Flat,104.5s Globe,18.8s publication/checks.
No new Globe cache, production update or Bruneton score claim; all prior evidence
remains immutable. The earlier100m comparison remains00137.
