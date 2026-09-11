# Algorithm32 Current Dataflow

Focus: Color, receiver light, visible sources, and stellar presentation.

Related owners: [architecture-contracts](../architecture-contracts/current-dataflow.md), [caches](../caches/current-dataflow.md), [transport-geometry](../transport-geometry/current-dataflow.md).

## Shared Spectral Path And Captured-Scene Composition

Final atmospheric state remains native-15 spectral path radiance plus
transmittance. `BrunetonColorDisplayModel` retains the E8 native-15
CIE/bin-width/683/XYZ-to-linear-sRGB path projection. Separately, the composer
captures the ordinary Three scene in renderer-linear sRGB before the
atmosphere pass. At the display boundary, the color model:

1. averages native-15 transmittance channels into the retained red, green, and
   blue display bands selected during the historical comparison work;
2. applies those bands only when a scene endpoint lies within the atmosphere
   segment;
3. combines `pathLinearSrgb + sceneLinearSrgb *
sceneTransmittanceRgb`; and
4. performs the final display encoding once.

Flat32 selects the fixed `ColorResetSlope078P9ColorDisplayModel`. Before first
frame publication, the receiver-light owner combines geometry-supported,
atmosphere-transmitted direct-horizontal irradiance with cache-derived diffuse-
horizontal irradiance and publishes their photopic total in lux. Color Reset
uses that facade-owned scalar directly, applies its fixed scene-global common
gain before the unchanged Figure-1 mapping, and retains the complete captured-
scene composition described above. Basic Bruneton remains the exact explicit
physical/B1 control. The superseded source-luminance-lift runtime path has been
removed.

This RGB-band operation is a display-boundary compositor, not RGB atmospheric
transport or cache construction. `ShaderRuntimePass` binds the current
composer read-buffer texture as the captured scene color on every render.
`ShaderBuilder` no longer declares or requires a native-15 matte endpoint
texture. `Algorithm32AtmosphereComposer` no longer accepts or owns an endpoint
adapter.

The historical pre-retirement source pins were
`scripts/algorithm32-star/src/output/spectral-to-rgb.js` at SHA-256
`e55fa94464c506e6bdb3a664196bf9763759d5f22709577f4b0918deeed629fc`
for E8 and
`scripts/algorithm32-star/src/production-reference/color/BrunetonColorDisplayModel.js`
at SHA-256
`35595582e4e08c38776f056f4244c6ef76006ece60716cabd982df81ba341626`
for the compositor, preserved from `C:\dev\poly-gc-react` commit
`514d5f6080d2dd485efdb07b5da9a203357a40c0`. These exact paths and hashes are
provenance records only; they are not current executable authorities and must
not be retargeted.

The historical replacement focused browser gate passed `1/1` and exercised a real
captured scene texture, both the attenuated-endpoint and background branches,
CPU/shader agreement, read-buffer rebinding, diagnostics, and cleanup. The
earlier endpoint-adapter lane is superseded and cannot accept this path.


## Open Color Reset And Celestial Boundaries

Production now contains the spherical/distant Sun with independently selected
brightest-500 or brightest-2,000 rosters,
one-pixel stellar screen-index/palette generation, and final celestial
composition machinery. P1 adds one exact Flat32 selection owner for Color,
celestial enablement, stellar catalog, and ordered presentation filters. These
selections are independent: Basic Bruneton no longer disables celestial
sources. Unknown values fail closed. P6 resolves the two recognized stellar
filters through `view-presentation-filter-registry-v1`, assigns deterministic
order and a complete configuration identity, and owns exact CPU equations plus
the source-linear GLSL hook. P7 installs the hook between the separate stellar
E8 projection and unchanged common scene/display composition. Empty, disabled,
and nonstellar paths are exact identity; unsupported mode, Color, weight, or
ordering combinations fail closed. Brightest-2,000 requires its
authenticated local production package and fails before mode construction when
that package is absent. Production now computes the retained
geometry-supported, atmosphere-transmitted direct-normal packet, derives its
separate receiver-horizontal projection, reduces the installed cache over the
fixed identified 32-direction cosine-weighted quadrature, and atomically
publishes diffuse-horizontal plus the exact total-horizontal sum. The facade
starts with a complete zero-diffuse state, exposes all four packets and their
photopic projections, and Flat32 replaces that state from the installed cache
before composed-frame preflight. Failure, cancellation, disposal, and
supersession preserve the prior complete state; the path reads neither a
framebuffer nor named time.

The ordinary Flat32 application defaults to `color-reset-slope-078-p9`,
brightest-2,000, and the ordered mesopic-luminance then low-light-chroma
stellar chain. `stellarPresentation=physical` selects an empty filter chain.
Brightest-500 remains an explicit catalog control. The selected Color Reset
path is production behavior: the
facade owns its live total-horizontal-lux binding and the model applies the
fixed common gain before unchanged Bruneton display encoding. The Color-free
neutral Lambertian owner now derives separate direct, diffuse, and exactly
additive combined Native15 scene radiance from the same receiver generation.
Flat32 projects the direct-normal and diffuse-horizontal packets through E8,
the unchanged Figure-1 exponential, and inverse sRGB before assigning its
unitless Three directional lights and black-ground upper-hemisphere light.
This scene-light adapter bridge prevents physical projected values from being
misread directly as renderer-linear display values and leaves Color unchanged.
The hemisphere light preserves the measured horizontal response while
providing the selected uniform-upper-sky normal dependence: full for upward,
half for vertical, and zero for downward normals. It remains an explicitly
limited approximation rather than a directional sky reconstruction. The
application can diagnostically bypass only final Algorithm32 composition while
retaining this scene lighting. The bypass renders the raw Three scene to linear
HDR and applies the compositor's renderer-linear-to-display conversion plus
sRGB encoding; it does not reapply physical-radiance exposure to renderer-scale
lights. Raw default-framebuffer rendering is invalid because unbridged physical
values can clip it white. The explicit brightest-2,000 path
authenticates its local-only manifest, exact double-precision roster and
packets, and CR6G float32 payloads before constructing the source. Generation
uploads separate `2000x1 RGBA32F` member and `2000x15 R32F` spectrum textures,
uses a 2,001-entry R32F palette, retains lowest-canonical collision ownership,
and sums every colliding packet once. The tiled transport layout expands to
64 by 32 member tiles in a `704x419x15` R32F array. The one-pixel presentation
policy retains the historical q1 base `60,999.839486002405`, identifies the
accepted CR6C multiplier `24`, and writes the resulting
`1,463,996.1476640578` scale into palette generation. No time, catalog-size,
viewport, or framebuffer term enters that calibration.
Optional human-vision filter algorithms are production-owned live application
behavior and are enabled by the ordinary application default. The stellar palette retains rows 0-14 for
the unchanged transported Native15 values and row 15 for collision-combined
apparent magnitude. Its compatibility identity also covers Color, registry,
scotopic-weight content, receiver light, and adaptation luminance. The
adaptation scalar is the median photopic luminance of the fixed 32 receiver-sky
samples, documented as an approximation to the contained screen-pixel median.
The nonstellar Flat/local mode explicitly receives an empty stellar-filter
list; returning to spherical/distant restores the application selection.
The current architecture and execution order are owned by the
[Production Color Reset Design](color-reset-design.md) and
[Production Color Reset Implementation Plan](../../../../archives/topics/production-algorithm32-release-20260911/agents/topics/production-app/release/color-reset-implementation-plan.md).
The [promotion manifest](color-reset-promotion-manifest.md) owns the P0
evidence, production-owner, fixed-500, qualification, and redistribution
inventory.
The [closed contained plan](../../../../archives/topics/topic-consolidation-20260906/agents/topics/extraterrestrial/color-reset-experiment-plan.md)
remains evidence history.

Flat geometry, the finite-distance point Sun, and the Stage 9.1-9.5 local-cache
behavior are implemented within their recorded production boundaries. The
paired-plus-rotated-Fibonacci-68/N=2048/continuous-`L1` facts/domain and omitted-ground CPU
contract are implemented through Stage 9.6.2. Stage 9.6.2a closes the
contract/executable-owner, private-surface, runtime-mechanics, public
entrypoint, and direct requested-N1/N2/N4 implementation gaps for that omitted-ground
CPU path. Stage 9.6.3 implements the replacement GPU construction graph
and closes its omitted-ground numerical, graph, upload, readback, and bounded
resource gates. Stages 9.6.4-9.6.6 complete public lifecycle/resources,
ordinary N4 Flat32 cutover, and containment. Reflective local CPU/GPU behavior
is implemented and checked. Its former Star comparisons are historical only;
any renewed numerical acceptance requires a newly selected independent
authority and isolated evidence lane under the production architecture
boundary.

The corrected captured-scene composition selected during the historical Star
work is implemented. Its refreshed Node, type-check, direct-Star, and
real-WebGL results are retained historical evidence rather than current Star
authority. V5 post-promotion verification passes without changing the v4
selection. The architecture retains independent geometry and source
owners, but the current
[supported pairings](../architecture-contracts/architecture-boundaries.md#supported-geometry-and-source-pairings)
do not include flat/distant or spherical/local.
Extraterrestrial sources follow `flat32` in the declared delivery order.

This repository now contains a runnable host-sized `flat32` application. Its
local owners create the DOM shell, a browser-device-pixel-ratio Three renderer,
camera, ordinary matte ground and review objects, and the source
application's initial one-ambient/six-directional flat/local Three lighting
with all six targets. It retains the matching six 4096-by-4096 PCF-soft shadow
maps, exact recast focus/camera configuration, isolated per-object caster
layers, and shared ground receiver. `ThreeSceneRuntime` owns direct fallback,
composer/base-pass preparation, map enablement, PCF selection, capability
checks, frame operation, and update policy; `LocalSunSceneLighting` owns the
six light and camera/tuning configurations; and `EndpointScene` owns casters,
receivers, and physical depth endpoints.

`SphericalDistantMode` owns the current native-production spherical geometry,
distant source, canonical black ground, and ordinary N4 configuration.
`Algorithm32Runtime` owns the backend, cache-build scheduler, live bindings,
asynchronous shader preparation, composed-frame
preflight, atomic render-operation replacement, direct-scene failure fallback,
and ordered disposal. Host resizing changes only scene capture and final
composition pixels; it does not reduce the cache domains or the six 4096
shadow maps.

The [Flat32 one-degree scene-cache hookup plan](../../../../archives/topics/production-algorithm32-release-20260911/agents/topics/production-app/runtime-integration/flat32-one-degree-cache-hookup-plan.md)
is complete. Flat32 preserves the observation's live source direction for
placement while resolving its scalar solar zenith, validating the selected
offline package, and atomically publishing the new cache.
The normal Polylith server mounts the resolver at
`/flat32/api/distant-sun-scene-cache` and immutable assets below
`/flat32/scene-caches/`. `FLAT32_DISTANT_SUN_CACHE_ROOT` selects the deployed
package root; local omission uses the qualified bin-covered package set at
`server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1`.

The first hooked-up shader placed exact-seam index and packed-row resolution
inside the Native15 loop and admitted up to 14,400 texture reads per output
pixel under Q30. Hoisting invariant work alone did not materially improve the
live application. Pass-local GPU queries measured roughly 673-880 ms per
1920-by-1080 scalar frame, proving the earlier `gl.finish()` counter evidence
was CPU-submission timing. RGBA channel packing reached roughly 63-73 ms after
warm-up; the selected face-grid atlas reaches 22.22 ms mean and 22.30 ms p95
over eight warmed frames on the named RTX 2060/D3D11 path. Accepted proof is
`flat32-distant-sun-runtime-performance-20260831-11`. Algorithm32 `591/591`,
Algorithm32 WebGL `23/23`, and the full exact-cache Flat32 lane `16/16` pass.
The same pass measures 123.32 ms mean at 3840 by 2160, so 4K 30-FPS rendering
remains open. These timings are hardware-specific and do not establish a
portable performance guarantee.

The composer captures the Three scene before the atmosphere pass, and the
runtime supplies that read-buffer texture to the retained display-boundary
compositor. After the fused Flat transport cutover, the ordinary-N4 Flat32
lane passes `3/3` in Chrome Headless 151, covering the application path and
two transactional failure paths in 53.181 seconds. The earlier 108.656-second
ready-state and 3m41s complete-lane observations belong to the pre-fusion
packed/indexed implementations. Timing remains diagnostic; the current
headless environment reports a software renderer and does not establish
supported-hardware performance.

The first independent Stage 11.4 interaction slice is implemented:
`PointerLookController` owns the legacy pointer-lock rotation settings,
canvas activation, lock-state accessibility text, and listener cleanup. A
click on the scene locks the pointer and rotates the existing camera; Escape
releases it.

Stage 11.3's transactional owners are implemented: `ModeController`
prepares an isolated candidate, preflights it, publishes it atomically, and
only then disposes the replaced runtime. Failed candidates and constructor
failures preserve and republish the prior runtime and dispose all unowned
mode, composer, and target resources. Current Stage 9.6 evidence exercises
successful flat/local publication through the enabled local-Sun controller.

The partial Stage 11.5 controls and source-update owners remain present. Their
compact toolbar includes San Jose and Union Glacier, Flat 0/45/90/135/180,
Flat/Globe time basis, Sunrise/Solar-noon/Sunset, and globe hour/minute
offsets. `LocationTimeController` retains the source application's
`FlatSynchronizer` calculations and 450 ms coalescing delay, and
`Flat32ApplicationState` remains the one requested-state snapshot. The current
focused lane verifies requested-versus-published state, scaled source-bearing
domains, source-update invalidation, independent camera state, and successful
transactional publication through the selected Stage 9.6 cache.

The application being adapted remains in
`C:\dev\poly-gc-react`; it is migration evidence, not a runtime or build
dependency. Stage 11 incrementally adapts required behavior to the production
interfaces here; the
[implementation plan](../../production-app/product-behavior/production-implementation-plan.md#11-integrate-flat32)
owns that migration and the prohibition on a retained external runtime/build
dependency. Stage 9.6.5 restored and verifies default N4; broader Stage 11.8
acceptance remains separate work.

Broader pinned-source auditing, new isolated independent Stage 8 and reflective
local-ground evidence, the import manifest, citations,
the expanded release suite, arbitrary scaled flat/local convergence,
beyond-W27 evidence, and selected-domain supported-hardware performance/
resource qualification remain open. Stage 8's retained focused reflective
Star-output and GPU evidence is historical passing evidence only. Renewed
acceptance requires a newly selected authority under the production
architecture boundary, not a rerun of the retired bridge. The broader audit
must not be described as complete. None of these gaps creates an alternate
accepted cache or runtime path.
