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
surface, while the native cache has no height node between0 and1875m. Resolving
that elevated layer in the cache is the strongest next spatial-sampling test;
outgoing-direction interpolation is another unseparated candidate. Neither was
changed in this diagnosis. Exposure/blur is not an evidence-based correction.

The focused report validates all parent artifact hashes, image dimensions,
float decomposition/baseline equality and local source types. Old galleries/runs
remain immutable, including the initial failed diagnostic00058 (composer lookup,
repaired in00060). No production source, profile, cache or display changed.
