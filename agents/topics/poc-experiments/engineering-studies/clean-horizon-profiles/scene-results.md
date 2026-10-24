# ARM-Informed Scene Execution

State: S1 complete; S2 reference pilots and S3 contained scenes are underway.
The ten requested noon/sunset conditions remain open until actual captures pass.
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

## S2/S3 - Current recovery boundary

The first12 noon500m Bruneton reference spectra completed in00031; later helper
assumptions rejected candidate export. Those12 payloads are authenticated and
reused in new runs. The legacy helper's0.8SSA scaffold is discarded and replaced
by the candidate optical library; final source data use the registered0.7671.
Column integration validation and explicit geometry/quantity metadata were repaired
without rerunning those completed baseline spectra.

The first current-renderer baseline cache completed all15channels throughN4 in
00032. Its old HDR probe assumed a stellar-specific shader expression that the
selected pass did not contain. Capture repair uses only total linear composition,
which is the requested diagnostic. The completed cache rows are retained and reused
by exact physical coordinate mapping. Run00035 successfully captures all five
Bruneton noon views. Re-encoding total pre-display linear output agrees with the
actual GPU image within one RGB byte at every channel/pixel. Candidate noon
construction is underway; first paired images remain pending.

[Execution log](execution-log.md) owns decisions and checkpoint records. Update
this document at the next actual-image milestone with measured cache/capture costs,
reference findings and links; do not report missing images as delivered.
