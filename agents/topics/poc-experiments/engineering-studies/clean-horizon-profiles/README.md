# Measured Clean Horizon Profiles Experiment

Status: all ten ARM-informed San Jose scene conditions are rendered, with matched
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

Latest images: [FOV preset sweep at500m](../../../../../tmp/experiments/clean-horizon-profiles/runs/00118-fov-presets/index.html)
compares Flat/local Closest and Globe/distant noon at120,90,50,35,20,5and2degrees.
[Scene results](scene-results.md#field-of-view-preset-comparison) own controls,
checks and presentation recommendations:5degrees for the clearest fade/edge
comparison,20degrees for more context.

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
