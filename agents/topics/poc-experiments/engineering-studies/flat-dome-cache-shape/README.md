# Flat Dome Cache Shape Experiment

Status: M2 pilot published; executing M3 accuracy and performance measurements.

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
- [Plan](plan.md)
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

Compare the initial count sweep against the independent development reference,
refine useful count crossings, diagnose other error floors, and freeze counts
before held-out validation. The full native guide campaign is running. The
[pilot swatches](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00013-m2-pilot-report/index.html)
are available; the final report remains pending. The design owns scientific
decisions; the plan owns sequencing; status owns verification and next action.
