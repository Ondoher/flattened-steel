# Distant-Sun Shadow Animation Evidence Experiment Status

Status: P0-P2 static composition accepted; creative-animation prompt saved and
execution awaiting the requested repository checkpoint.

## Current State

The contained runner enables the exact production San Jose review-object
scene, ground receiver, materials, six per-object directional shadow lights,
and six 4096-by-4096 shadow maps without modifying production. It resolves the
production astronomical sunset state, selects exactly two hours earlier, and
captures a 55-degree native-4K composition that keeps the future sunset
direction in frame while showing useful boxes, ground, and a long shadow.

This accepted still uses the production one-degree cache as the static
composition control. It does not yet claim that the closed shared packet atlas
has been installed with shadows, and it makes no animation-performance claim.

## Latest Verification

- Post-scaffold normalization, generated standards guide, and topic-refresh
  reviewer lifecycle pass.
- Scaffold structure and hash-pinned initial-still control created.
- Output root: `tmp/experiments/distant-sun-shadow-animation-evidence/`.
- Canonical accepted run: `1788967802382-initial-shadow-still`.
- Capture: `captures/san-jose-two-hours-before-sunset-fov55.png`, 3840 by
  2160, SHA-256
  `e247f1e5f71f0e33c497b15ac146e02c2783dd4b1e6cb97bb57a24d5f2b5ca84`.
- Artifact-set identity:
  `809992d6f0e291cec4268432a5927c5cd739f2adf414d057208e907fc3a57fcf`.
- Computed sunset: `2024-06-21T03:26:03.503Z`, solar zenith
  `89.9579152265345` degrees.
- Captured observation: `2024-06-21T01:26:03.503Z`, solar zenith
  `67.83711988940226` degrees.
- Future sunset projection: NDC
  `[-0.6253422760918885, 0.1347242139468797]`, inside the frame.
- Runtime scene: six shadow casters, seven receivers, six directional lights,
  six allocated 4096-by-4096 shadow maps, no WebGL error or context loss.
- Independent verifier passed containment, complete artifact identity, PNG
  signature and dimensions, FOV, caster count, and shadow-map facts.
- Focused JavaScript type checking passes for the runner, verifier, constants,
  and ambient experiment contracts.

## Blockers

None for the static composition. The shared-atlas animation adapter is planned
work, not a current blocker.

## Next Action

Complete the requested repository checkpoint, then execute the
[creative-animation prompt](../../../../../experiments/distant-sun-shadow-animation-evidence/prompts/new-animation.md).
The user has supplied the requirements and authorized autonomous creative work
within the repository, with no formal plan or intermediate feedback gates.
The new animation has not started. The separate shared-atlas shadow adapter
and scientific measurement remain unproven; the accepted still is unchanged.
