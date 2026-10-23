# Elevated globe horizon cache coverage

The recurring black strip is reproduced at San Jose's exact Sunset preset,
looking at the Sun from 2 km with 50° vertical FOV. This is a cache-coordinate
coverage defect. The earlier clean tests used Sunset minus ten minutes; their
results did not establish that the reported view was correct.

## Diagnosis and causal control

The [unmodified served app](../../../../.codex-tmp/flat32-sky-scene-controls/live-horizon-sunset-01/result.json)
reproduces 2,495 black pixels at DPR 1 and 7,752 at DPR 2. The failing pixels are
sky rays above the visible ground. Their transport radiance is non-finite;
adjacent sky and ground samples remain finite. Neither changing the ground
patch nor suppressing invalid values is the selected correction.

The package retains Native48 altitude samples, but its per-scene solar-coordinate
coverage was calculated for an observer at 1.7 m. An elevated observer sees
farther around the sphere, including additional local solar angles. The
[independent coordinate audit](../../../../.codex-tmp/flat32-sky-scene-controls/sunset-rays-audit-01.json)
finds missing resident cubic neighbours at altitude indices 43–45 and solar
index 79 on the last Q30 path interval. Those samples are around 55–56 km in
altitude and 946–998 km along the ray. An invalid final contribution contaminates
the accumulated pixel despite the finite earlier contributions.

The [matched GPU counterfactual](../../../../.codex-tmp/flat32-sky-scene-controls/support-counterfactual-01/result.json)
loads additional existing blocks for the same physical view. Required blocks
increase from 17 to 21; the existing 24-layer atlas suffices. Black pixels fall
from 2,495 to zero. Geometry, atmospheric composition, scattering equations,
camera, display mapping and shader source remain unchanged.

- [Before](../../../../.codex-tmp/flat32-sky-scene-controls/support-counterfactual-01/h2000-fov50-objectsfalse.png).
- [Expanded-residency control](../../../../.codex-tmp/flat32-sky-scene-controls/support-counterfactual-01/expanded-support.png).

The auxiliary `sunset-support-01` offscreen field probe omitted target-coordinate
rescaling. Its pixel-specific field readbacks are inconclusive and are not used
to establish lookup support. The matched control above establishes causality.

## Selected correction

The shared-package generator now accepts
`--maximum-observer-altitude-meters 2000`. It authenticates the old control
records, derives expanded ledgers, and leaves all parent evidence immutable.
For each solar bin it computes visibility at both bin edges from the maximum
observer altitude, retains the old coordinate inventory as a subset, and adds
the cubic solar neighbours. The visibility bound is:

`acos(R / (R + observerHeight)) + acos(R / (R + sampleHeight))`.

Each altitude row uses its next altitude node as the upper query bound, preserving
altitude interpolation closure. Visibility increases with observer altitude, so
the 2 km ledger also covers every lower supported elevation. This changes the
retained and resident coordinate inventory; it does not change physical field
equations or introduce a live tracing replacement. Elevation changes continue
to reuse the installed cache and scene.

The new inventory proof checks every row in all 109 bins against an independent
sphere bound, preserves every old coordinate, includes cubic neighbours, and
confirms every scene fits the existing 24-layer atlas. Shared-generation type
checking passes. The generation suite passes ten cases in its first run; its
two browser-host fault cases hit their deadlines while competing with GPU
compilation, then both pass in an isolated rerun. Evidence is retained under
`.codex-tmp/flat32-sky-scene-controls/elevated-cache-tests*`.

## Current boundary

GPU computation and all 109 reconstruction checks pass. The new immutable package
is published locally and selected; the [zero-aerosol atmosphere record](zero-aerosol-atmosphere.md)
owns its exact identity, size, build timing and rollback. Its immutable build is in
`tmp/production-algorithm32/distant-sun-shared-block-cache/runs/2026-10-22T21-32-39-428Z-b59c3c93-0188-48cf-8c1e-d5f8a669a195`.
The [exact shared-coordinate comparison](../../../../.codex-tmp/flat32-sky-scene-controls/elevated-package-verification-01.json)
checks 1,349,366,160 decoded bytes: every sample at all 5,542 old coordinates is
bit-identical. The new package retains 5,607 coordinates, adding 65. All 109
scenes require at most 22 resident blocks, within the existing 24-layer allocation.
The [actual scene qualification](../../../../.codex-tmp/flat32-sky-scene-controls/elevated-scenes-01/result.json)
passes seven captures: 5/100/500/2000 m at 50° vertical FOV, a 5° sunset zoom,
and the owner's wider viewport proportions at DPR 1 and 2. Every capture has zero
black pixels. Across all elevation changes the runtime, scene, camera, ground
meshes and cache attachment remain identical. A separate GPU mask checks all 15
spectral radiance/transmittance channels at every pixel in the 1195×750 view:
zero non-finite pixels and zero GL errors. No runtime errors were reported.

- [Corrected 2 km / 50° view](../../../../.codex-tmp/flat32-sky-scene-controls/elevated-scenes-01/sunset-2km-fov50-height471-dpr1.png).
- [Corrected 2 km view at the original proof dimensions](../../../../.codex-tmp/flat32-sky-scene-controls/elevated-scenes-01/sunset-h2000.png).
- [5° sunset zoom](../../../../.codex-tmp/flat32-sky-scene-controls/elevated-scenes-01/sunset-2km-fov5-height750-dpr1.png).

The source proof fixes the observation to the exact resolved Sunset instant
`2024-06-21T03:26:03.503Z`; its diagnostic time label still reads `Flat 180`.
This label does not change the Sun direction or atmosphere state. The original
served-app reproduction used the ordinary native Sunset button. The maintained
app server now [serves the exact corrected identity](../../../../.codex-tmp/flat32-sky-scene-controls/elevated-live-selection-01.json).
All eight server tests pass after activation. Generator type checking and scoped
formatting pass. Dedicated standards sign-off remains incomplete under the
existing stale reviewer calibration; no compliance result is claimed. The
checkpoint adviser recommends a checkpoint of the coherent current tree; no
commit or remote publication was made for this follow-up.
