# Measured Clean Horizon Profiles Experiment Status

Status: requested illustrative scene campaign complete, with reference limitations.
The experiment remains selected for owner review, with no production promotion
or automatic closure. Earlier M1 measured-profile qualification is inconclusive.

## Current result

[Scene results](scene-results.md) owns the current model, appearance, reference
errors, uncertainty checks, cost and verification. [Open the complete gallery](../../../../../tmp/experiments/clean-horizon-profiles/runs/00055-scene-gallery/index.html).
All San Jose Globe noon and sunset views at5m,100m,500m,2km and40km are rendered,
each with matched Bruneton, native/fixed/lower exposure, metadata and PNG download.
Two additional images test phase shape at500m sunset and upper aerosols at40km sunset.

The explicitly ARM-informed model reuses December2023 surface/AERONET/lidar data
with documented near-field, humidity, phase/spectral and upper-layer assumptions.
It is not measured San Jose weather. Its AOD550 is0.02102 versus the nearby
observed0.01708; the residual is retained. No new credentials/downloads were needed.

Near-ground noon views are less gray; sunset is brighter around the Sun. The40km
limb remains broad and bright. Phase shape is a major uncertainty. Source-field
replay disagrees substantially with spherical MYSTIC at500m sunset, so the
adapter is illustrative rather than fully validated. Direct-transmission and
GPU sampler representation checks pass their stated bounds. No order-tail bound,
five-seed benefit confirmation or full uncertainty/convergence grid is claimed.

## Owner-review horizon-band diagnosis

[Scene results](scene-results.md#owner-review-follow-up-bright-rim-and-gray-band)
owns the focused diagnosis.00062-horizon-bands contains the original/fine/path-only
comparison and verification. Upper bright/gray bands originate in atmospheric
path radiance;480 view intervals and exact-sphere ground clipping do not remove
them. New spherical reference rays show a physical gradient plus a cached-field
brightness/color distortion. Height sampling of the elevated aerosol layer and
outgoing angular reconstruction remain unseparated hypotheses. No fix or profile
change is promoted; the images should not be called fully validated.

## Verification and next boundary

All20 primary frames and two uncertainty frames were inspected at native size.
No broad black strip or stale frame was observed; thin pixel-scale limb steps
remain visible. Native GPU versus CPU display replay is within one RGB byte.
Noon/sunset/noon and5m/40km/5m transitions match fresh-state captures within one byte.
Final verification00057 is accepted:11,060 artifacts rehashed, gallery modes and
time filters checked in a real browser, local authored types passed. Earlier M1 evidence and failed attempts remain immutable.

The owner may compare the gallery and choose any follow-on. No production cache,
profile or display changed; no promotion is proposed from unresolved accuracy.
Do not repeat downloads or completed cache builds without changed inputs.
[Execution log](execution-log.md) owns decisions and local checkpoints.

## Standards provenance and lifecycle

Permanent assignment: experiments -> experiment (base plus types.md). No
experiment-specific standards set, deeper assignment or overlay was added;
there is no temporary configuration to restore at closure. Dedicated experiment
standards reviewers and audits remain disabled; checkpoint monitoring is active.
No standards-compliance result follows from that policy.
