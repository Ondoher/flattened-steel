# Distant-Sun Shadow Animation Evidence Experiment Plan

## Acceptance Gate

Can the standard San Jose boxes and production shadow lighting be reproduced in the cache-backed renderer so that a verified native-4K still at two hours before sunset clearly shows the scene, its directional shadows, and the future sunset direction at a 55-degree vertical field of view?

## Work

### P0 - Pin the scene and view

- [x] Identify and hash the canonical production San Jose box scene, ground,
  materials, shadow-light configuration, and sunset calculation.
- [x] Identify and hash the accepted cache-backed renderer parents.
- [x] Freeze native 3840-by-2160 output, 55-degree vertical FOV, exact
  two-hours-before-sunset state, sunset-facing camera direction, and visible
  foreground composition.

Completeness: one checked-in control names every parent and executable view
parameter without relying on descriptive metadata to recover values.

### P1 - Adapt geometry and shadow lighting

- [x] Reproduce the canonical boxes, ground receiver, materials, directional
  shadow light, and shadow-camera parameters through experiment-owned code.
- [x] Connect the camera, distant-Sun/cache state, visible Sun placement,
  endpoint lighting, shadow direction, and shadow-map refresh to one explicit
  state.
- [x] Prove box transforms and shadow settings match their production parent.

Completeness: the live cache-backed frame visibly contains the standard boxes
and ground shadows, with no production or sealed-experiment write.

### P2 - Publish the first still

- [x] Execute a new immutable browser run and capture one lossless native-4K
  PNG at the frozen P0 state.
- [x] Record command, environment, browser/GPU facts, source and parent hashes,
  exact solar/camera/light/shadow/cache state, pixel probes, and derivation.
- [x] Independently verify containment, artifact identities, dimensions,
  nonblack/nonuniform content, and terminal acceptance.
- [x] Visually inspect the image for useful sunset-facing composition and
  legible changing-shadow reference geometry.

Completeness: an accepted, independently verified image is ready for owner
review and establishes the static composition for later animation.

### P3 - Later animation measurement

- [ ] Define a shadow-aware frame trace that separates render/shadow-map cost,
  cache switching, and recording.
- [ ] Reuse the animation-evidence toolkit for trace-faithful viewable output.

Status: deferred scientific measurement work. The next creative animation
follows the [prompt](../../../../../experiments/distant-sun-shadow-animation-evidence/prompts/new-animation.md)
without a formal plan or intermediate feedback gates; this checklist is not a
prerequisite for that work.

Closure: P3 is not required by the static acceptance gate or the accepted
creative-film brief. It remains unstarted future scientific work and does not
leave this successfully closed experiment incomplete.

## Promotion Boundary

Experiment results are evidence, not production architecture. Promotion requires a separate production-owned design, implementation plan, and verification boundary.
