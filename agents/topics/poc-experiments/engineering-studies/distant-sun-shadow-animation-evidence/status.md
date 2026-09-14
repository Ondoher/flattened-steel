# Distant-Sun Shadow Animation Evidence Experiment Status

Status: **closed successfully**. P0-P2 static composition and The Hours
creative animation are accepted and independently verified.

## Current State

The creative continuation is **The Hours**, a sixty-second desert-observatory
film from pre-astronomical dawn to full darkness. It reuses the existing
Algorithm32 runtime, astronomy, Native15 spectra, geometry-provided spherical
ground, and extracted animation-evidence recorder. The experiment adds a
deterministic armillary, terraces, colonnade, dunes, and a fluid camera score.
Cloned lighting uses the production direct/sky spectral bridge, one shared
4096-square shadow map, and a restrained local sand-bounce approximation.
The [ground response note](../../../../../experiments/distant-sun-shadow-animation-evidence/creative/ground-reflectance.md)
owns the illustrative desert spectrum and unchanged black-ground atmosphere
cache limitation. No production or existing lighting source is modified.

Latest creative preview: `1788974313115-creative-animation`, accepted with
eleven 1920-by-1080 PNGs, including same-cache-bin consecutive-frame checks.
Visual inspection confirms day/twilight illumination, foreground shadow
references, nighttime stars, revised surface variation, and lateral camera
offsets that keep the sculpture clear of the centered horizon Sun. Runtime
guards reject silent atmosphere fallback or incomplete celestial publication.
The completed native-4K film is owner-accepted and independently verified.
This is ideal offline choreography, not a runtime-performance measurement. The
[creative source guide](../../../../../experiments/distant-sun-shadow-animation-evidence/creative/README.md)
records reproduction commands and the existing capabilities reused.

The experiment's success criterion is satisfied: the repository can construct
and record a deterministic, full-day Algorithm32 animation with fluid camera
movement, time-dependent spectral illumination, visible celestial sources,
and local Sun-aligned shadows at native 4K. The accepted film also provides
external visual evidence of that result.

## Appearance Continuation

The [appearance continuation](continuation-plan.md) is active. Its diagnostic
phase completed without changing the renderer or accepted film. Accepted run
`1789171222384-creative-strobing-diagnosis` measured every encoded frame and
found that the recurring brightness reversals straddle hard one-degree
atmosphere-cache publications. Cache-boundary temporal curvature is 5.08 times
the stable-frame level over the full image and 7.01 times in the upper sky; 33
of the 40 strongest full-frame curvature events are cache-adjacent. Retained
scene-light values are smoother at cache transitions, excluding their
interpolation as the primary source. The strong monotonic changes at sunrise
and sunset are distinct from this repeated flash pattern.

The diagnosis artifact set is
`d11dfb90549a3d0df8dc9a540b2c416ace03dc01a4c5774c25449d68cf9cd4e0`.
No correction was applied. The plan intentionally defers cache continuity work
until after the ozone-free horizon decision; F2 records the star disposition
without a rendering change.

F1 has built, authenticated, installed, and selected the complete ozone-free
production-format cache. Generated run
`2026-09-12T00-24-02-253Z-703e6867-62cf-43b2-a2e0-faa218aaa9a2` produced package
identity `2243c1ab2c2d529131759b32d72cee2a2e4b32098e1cc450c0d48cf34ed4edc7`:
109 scenes, 89 blocks, and 505,753,993 package bytes. Its 109 reconstructed
scenes and production service/router admission pass. The former deployed
package remains intact for rollback. F1 now awaits the owner's visual
lower-horizon disposition from Flat32.
The app bundle contains no cache-package or qualification-evidence allowlist;
it validates the server-selected transition policy against the running GPU,
ANGLE backend, Chrome major version, evidence format, and byte budget.

F2 is closed without a renderer change. The owner inspected the existing stars
in the native application and found their appearance acceptable. The earlier
visibility concern is attributed to the recording or presentation path and is
deferred unless it becomes a larger problem. The one-pixel production control
remains selected; no footprint candidate was built.

## Creative Film And Verification

- Accepted render: `1788974488678-creative-animation`.
- Film: `captures/creative-full-day.mp4`, 3840 by 2160, 60 seconds,
  30 fps, 1,800 frames, AVC, 258,596,947 bytes.
- Film SHA-256:
  `91e4b8595217eb39c669cdf0d86ec4d1030e9b2114dbf0485ecb8a0a4d91b4c4`.
- Render artifact set:
  `25953f738ece16e4a82fa90f27893a58d6e8f045582a89f616a7a32fec8a4807`.
- Independent accepted verification:
  `1788976234370-creative-video-verification`; artifact set
  `b6c23e8779f8b13acfa69ebc0032527223630375f773ac62adffa6fcfd608ffb`.
- All 1,800 encoded presentation timestamps and the complete scene trace
  pass cadence/duration checks. Ten exact decoded checkpoints, including
  the final frame, pass browser decoding and immutable-parent rehashing.
- Maximum checkpoint mean absolute RGB difference is 0.436 code values
  on the aligned 480-by-270 diagnostic comparison (not a full-resolution
  quality metric). Decoded daylight, sunset, and closing frames were viewed.
- Native-4K frame-zero star preservation passes: peak 232 versus 239;
  bright-pixel count 108 versus 135 at threshold 32. Production's one-pixel
  stars remain visible at native resolution but become faint when downscaled.
- Nine lossless native-4K captures, all frame states, consumed cache manifest
  identities, source identities, and encoding derivation remain with the film.
- Combined focused type checking passes for all new creative JavaScript;
  formatting and whitespace checks pass. Production, existing lighting,
  shared recorder, RNG, and historical evidence remain unchanged.

### Retained static proof

The contained runner enables the exact production San Jose review-object
scene, ground receiver, materials, six per-object directional shadow lights,
and six 4096-by-4096 shadow maps without modifying production. It resolves the
production astronomical sunset state, selects exactly two hours earlier, and
captures a 55-degree native-4K composition that keeps the future sunset
direction in frame while showing useful boxes, ground, and a long shadow.

This accepted still uses the production one-degree cache as the static
composition control. It does not yet claim that the closed shared packet atlas
has been installed with shadows, and it makes no animation-performance claim.

## Retained Static Verification

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

None. Near-horizon appearance concerns are acknowledged but do not prevent
acceptance of the film; they belong to later atmosphere/cache work. The
shared-atlas shadow adapter, scientific measurement, and local-Sun animation
are separate future lanes rather than unfinished work in this experiment.

## Repeatability Boundary

The creative runner, deterministic seed, camera and astronomical score,
recording command, full 1,800-frame trace, dependency identities, consumed
JSON inputs, and independent verifier are retained. The accepted render and
verification artifact manifests reverify without change, and the reusable
animation-evidence toolkit passes all seven focused behavioral checks.

The workflow is rerunnable in the current repository environment, but the run
is not a self-contained restoration package. A clean restoration also needs
the ignored `dist/flat32` build, installed Node/browser dependencies,
Mediabunny 1.55.7, and the generated Algorithm32 cache packages identified by
the evidence. Hardware video encoding may produce different MP4 bytes while
preserving the same scene states and appearance. A future portability effort
may package those prerequisites and perform a fresh-render comparison; it is
not required to close this successful experiment.

## Next Action

Preserve the accepted runs and source. The owner will finish inspecting the
selected ozone-free F1 package in the normally started Flat32 app and record
whether it improves the lower horizon. Preserve the former production package
for rollback. F2 retains the current one-pixel stars with no change. The
contained [Distant-Sun Recording Strobing Experiment](../distant-sun-recording-strobing/README.md)
now owns correction and recording qualification for the diagnosed
cache-publication flashing.
Portability packaging and local-Sun animation remain outside that continuation.
The last checkpoint is
`90d285cb5c6fe86d9882ebba257bac9dd51b60fb`, made before the creative work; the
finished creative source and closeout documentation remain uncommitted pending
an explicit checkpoint request.
