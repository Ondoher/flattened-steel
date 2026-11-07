# Flat Dome Cache Shape Experiment

Status: suspended by the owner on 2026-11-06; completed study/render evidence retained, accuracy and production adoption unresolved.

Execution is paused. The owner accepts deferring the dome-boundary work because
it currently matters chiefly in extreme conditions. Resume only after a new
owner selection; see the [resumption record](resumption.md). This is a priority
decision, not production acceptance or a scientific claim that all boundary
effects are negligible.

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
- Latest Union Glacier Camp, 5,000 m, green-ground renders: [toward the Sun](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00056-r4-three-final/inward.png), [opposite](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00056-r4-three-final/outward.png)
- [Original 45 m scene report](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00053-r4-scene-report/index.html)
- [Completed slice-count plan](plan.md)
- [Status](status.md)
- [Suspension and resumption record](resumption.md)
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
links the original 45 m renders, measured costs, verification and raw evidence.
The latest owner-directed scene is Union Glacier Camp at 5,000 m, closest-approach
Sun, level opposite headings and green ground. Run `00056` supplies that pair
with geometry/display/resource checks; sky colors are visible, along with
Sunward angular banding. The earlier 20 m rim pair remains in run `00054`.
Integration works; the original
45 m near-rim rays exposed up to 37.53% air-radiance error against the independent
probe. This does not quantify Union Glacier accuracy. The [status](status.md)
owns current verification and next action.

The completed [slice-study report](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00041-m4-report/index.html)
remains evidence, with qualifications in the [execution record](execution.md).
N12 is a provisional study configuration, not an accepted production cache or
universal optimum. Production promotion, experiment closure, and alternative
distance distributions remain separate owner selections.
