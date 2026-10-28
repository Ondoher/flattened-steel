# Measured Clean Horizon Profiles Experiment

Status: suspended by the owner on2026-10-26. Resume only after explicit owner
selection; [status](status.md#suspension-and-resumption-boundary) owns the handoff.
All ten ARM-informed San Jose scene conditions are rendered, with matched
Bruneton comparisons and targeted uncertainty images. Selected reference checks
expose unresolved numerical errors, especially sunset500m. This is an illustrative
reconstruction result; production is unchanged. The completed58/76-height test
identifies height-lookup sensitivity but rejects it as a sufficient horizon fix.
The completed570-case fine spherical reference trace confirms broad physical
structure and angle-dependent production errors. The combined780-case trace now
also supports the sharp opaque-ground boundary contrast, separately from the
broader gray-band discrepancy. The latest [native PNG comparison](../../../../../tmp/experiments/clean-horizon-profiles/runs/00106-raster-assess/index.html)
adds matched pixel footprints and shows excess local sky-side brightening at2km.
See [scene results](scene-results.md) for the pointwise uncertainty and scope.

Latest owner request: [GreenSea seven-height gallery](../../../../../tmp/experiments/clean-horizon-profiles/runs/00143-water-heights/index.html).
Includes2000,100,50,40,30,20,10m, Flat/Globe20/35degree FOVs and the back two
objects, with hidden controls. Earlier images are reused unchanged.
[Scene results](scene-results.md#expanded-greensea-gallery-with100m-and2km) own exact
conditions, derivation, verification and limits.

Latest images: [Combined5m/100m/500m FOV viewer](../../../../../tmp/experiments/clean-horizon-profiles/runs/00123-fov-heights/index.html)
compares Flat/local Closest and Globe/distant noon at all seven perspective
presets. [Scene results](scene-results.md#near-ground-fov-follow-up-at100m-and5m)
own controls, checks and altitude-dependent appearance. All requested100m/5m
images are complete; previous500m evidence is reused unchanged.

Latest diagnosis: [Flat ground-extent controls](../../../../../tmp/experiments/clean-horizon-profiles/runs/00115-flat-extent/index.html)
leave the broad shoulder unchanged. [Scene results](scene-results.md#flat-ground-extent-hypothesis-test)
own the extent/clip separation, measured changes and limitations.

Latest owner-requested stills: [Flat/local Closest and Globe/distant noon at500m](../../../../../tmp/experiments/clean-horizon-profiles/runs/00113-paired-500m/index.html),
same ARM atmosphere, horizon centered, default FOV and no review objects.
[Scene results](scene-results.md#owner-requested-paired-views-at500m) own conditions,
verification and limits. Earlier Flat/local5m/100m images remain linked there.

## Objective

Render an explicitly ARM-informed low-aerosol reconstruction at San Jose noon and
sunset at 5 m, 100 m, 500 m, 2 km and 40 km, with matched Bruneton comparisons.

## Governing Documents

- [Design](design.md)
- [Current scene plan](scene-plan.md)
- [Earlier qualification plan](plan.md)
- [Status](status.md)
- [Results and color controls](results.md)

Focus: actual scene images from the ARM lead, with reconstruction assumptions
and appearance uncertainty visible. Near-ground clarity remains the motivation;
2 km and 40 km extend the requested image matrix. Lower aerosol loading alone
does not establish clarity. Production profile, cache and display are read-only.

## Repository Surfaces

- Authored source and controls: `experiments/clean-horizon-profiles/`
- Generated output: `tmp/experiments/clean-horizon-profiles/`
- Production and other experiments: read-only unless separately authorized
