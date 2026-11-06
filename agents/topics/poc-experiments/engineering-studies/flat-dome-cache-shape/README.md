# Flat Dome Cache Shape Experiment

Status: slice study and Three.js scene-render follow-up complete, with qualified near-rim accuracy.

## Objective

Determine an accurate, compact scattering-cache representation for the fixed North Pole-centered atmospheric dome, including each atmospheric sample's Euclidean distance to the curved dome surface, slice spacing, interpolation, and valid transforms.

The owner requires the atmosphere to end at the fixed dome and ground to end
at the disk rim. The present production slab and observer-centered diagnostic
dome do not satisfy that requirement. This experiment investigates a replacement
cache representation; historical implementation notes do not establish an
owner decision to omit the fixed boundary.

The starting hypothesis adds each atmospheric sample's shortest Euclidean
distance to the curved dome surface to altitude and distance from the Sun's
subpoint. The design owns the precise coordinate and its distinction from
observer distance and horizontal distance to the disk rim. The owner selected
quadratic distance spacing for the first study, with other distributions
deferred. The [plan](plan.md) varies slice count and requires numerical
accuracy/size/build results plus real cache/probe/libRadtran swatches across
sample distances and altitudes.

The owner selects the existing independent probe and libRadtran as accuracy
guides. The [design](design.md#reference-and-measurements) owns their comparison
roles, adaptation requirements, and physical-match limits. Cache size and build
performance are the primary optimization variables among accurate candidates.

## Governing Documents

- [Design](design.md)
- [Completed scene-render plan](scene-render-plan.md)
- [Two-view scene report](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00053-r4-scene-report/index.html)
- [Completed slice-count plan](plan.md)
- [Status](status.md)
- [Execution record](execution.md)

## Repository Surfaces

- Authored source and controls: `experiments/flat-dome-cache-shape/`
- Generated output: `tmp/experiments/flat-dome-cache-shape/`
- Production and other experiments: read-only unless separately authorized

## Context and Historical Inputs

- [Recovered boundary and prior study](../cache-design.md#selected-stage-1-geometry-input): historical evidence, not permission to change this experiment's scope or production.
- [Production Flat application](../../../flat/README.md): current application and integration context.
- Historical commit `280878ed` retains `FlatWorldAtmosphereDomain.js`,
  `FlatWorldAtmosphereTransportGeometry.js`, and
  `flat-world-atmosphere-boundary-profile-v1.json` beneath its
  `scripts/algorithm32-star/` tree. Inspect or copy with recorded derivation;
  never reopen or modify that retired lane.

## Current Focus

The completed [scene-render plan](scene-render-plan.md) implements a reusable
complete cache, an updated atmosphere shader, and an actual Three.js finite-ground
scene facing outward and inward from one inside-dome location. The owner delegated
distance/height selection and kept natural FOV. The [scene report](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00053-r4-scene-report/index.html)
links both full-size renders, measured costs, verification and raw evidence.
Integration works; the new near-rim rays expose up to 37.53% air-radiance error
against the independent probe. This is a qualified experimental result, not a
production accuracy claim. The [status](status.md) owns verification and next action.

The completed [slice-study report](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00041-m4-report/index.html)
remains evidence, with qualifications in the [execution record](execution.md).
N12 is a provisional study configuration, not an accepted production cache or
universal optimum. Production promotion, experiment closure, and alternative
distance distributions remain separate owner selections.
