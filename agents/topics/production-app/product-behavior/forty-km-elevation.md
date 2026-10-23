# 40 km elevation option

Status: complete and locally activated on 2026-10-23. Eight actual served GPU
captures pass. No remote deployment or push occurred.

The elevation dropdown includes 40 km in Flat/local and Globe/distant modes.
Camera and physical receiver height change together, reusing the runtime, scene
and ground mesh. The original Bruneton atmosphere and cache grid resolution are
unchanged. This extends coverage; it does not promise a crisper atmospheric horizon.

## Scene and rendering support

The fixed ground patch is 1,800 km across and the camera far distance is 1,200 km,
covering the approximately 714 km globe limb from 40 km. All presets use the same
mesh. Globe final-view integration uses 120 intervals at 40 km and returns to 30
at lower presets through a live uniform. Cache construction and receiver-light
physics retain their existing settings. Flat keeps its complete-column view policy.

The shared-cache atlas now derives sufficient capacity from the authenticated
package's largest required scene, retaining 24 layers as a minimum. This package
needs 29 layers: 519,561,216 bytes per atlas, approximately 495.5 MiB, versus
429,981,696 bytes previously. Isolated transitions can temporarily hold two
atlases (1,039,122,432 bytes). Actual allocation/device checks, packet identities,
format, cancellation and ownership checks remain active. Historical fixed route
qualification is optional rather than a prerequisite for a larger valid package.
The measured verification GPU was RTX 2060 through ANGLE/D3D11.

## Cache and activation

Selected immutable package:
`1e35e0ce4b064690d48ff9639c4c7a1ad557e1eb752716c9f2105a3ac8354e4b`.
The package contains 734,130,872 bytes, only 1,746,034 bytes more than the prior
10 km package. Inventory grows from 5,694 to 5,847 coordinate rows (153 additional,
about 2.7%), with 95 blocks and 109 verified scenes. The existing altitude grid
already extends nearly to the 60 km atmosphere top; the added rows cover further
combinations of altitude and local solar angle reached from the higher observer.
There is no altitude or angular density increase.

Generation, compression and reconstruction verification took 746,860 ms
(12.45 minutes), including concurrent app builds during this run. Peak measured
Node RSS was 330,940,416 bytes. This is one observed build, not a controlled timing
comparison. The package report is authenticated by SHA-256
`85d8230697d6ea7ac18ac2a83ac2d526ed59cd9476c65dca3d251a2ebf508d68`.

The new generator run is
`tmp/production-algorithm32/distant-sun-shared-block-cache/runs/2026-10-23T19-45-06-884Z-2b871d38-2d6c-45b4-9ade-fc309d41d8f4/`.
The [generation result](../../../../.codex-tmp/flat32-elevation-40km/package-result.json)
and [activation record](../../../../.codex-tmp/flat32-elevation-40km/activation.json)
identify the package, installed app build and matching server selection.

## Verification and limitations

The [input proof](../../../../.codex-tmp/flat32-elevation-40km/input-proof.json)
confirms unchanged serialized physical/numerical build inputs and retained old
coordinates. The [complete value comparison](../../../../.codex-tmp/flat32-elevation-40km/old-values-comparison.json)
checks 1,386,375,120 bytes across every prior coordinate, all 15 spectral channels
and 4,058 unique outgoing directions: all old Float32 values are bit-identical.
No new Bruneton RMSE score is claimed for this coverage-only change.

Checks pass: 109 package reconstructions; 18 shared-cache controller specs;
16 focused native browser cases; eight server tests; app and engine type checks;
production app/worker and browser-test builds; scoped Prettier and diff checks.
The controller cases include a 29-block scene and release of its owned resources.
Browser cases cover native selection, physical height, fixed ground coverage and
cache/scene reuse across all presets. Two early browser launches selected zero
tests while bundles were being rebuilt; the final completed-build run passes all
16 selected cases. Those earlier logs are retained rather than counted as passes.

The [scene gallery](../../../../.codex-tmp/flat32-elevation-40km/live-scenes-01/comparison.html)
contains globe noon horizon, noon Sun, shader-off geometry and sunset at 40 km;
globe 10 km noon and 2 km sunset regressions; and flat San Jose and Union Glacier
at 40 km. Every capture has zero page/WebGL errors, unchanged frames while idle,
and verified runtime/scene/ground reuse across elevation changes. Live globe
uniforms select 120 at 40 km and 30 on return to lower presets. Visual inspection
found no black horizon strip in the checked globe views. The pale atmospheric
limb remains, consistent with the earlier independent numerical evidence.

The [final verification](../../../../.codex-tmp/flat32-elevation-40km/final-verification.json)
authenticates actual HTTP-selected metadata, installed app files and captured
artifacts. The owned capture browser and local verification server are closed.
These checks sample specific views and do not certify every time, device or
camera ray. Standards calibration remains stale; no standards-compliance result
is claimed. No experiment was reopened or historical evidence modified.

## Preservation and rollback

The prior 10 km package `f2c37c079d41f212a3905b4cccb18c0da84766ad374324c9ae8734b4ba1b4b42`
and all previous packages remain intact. Task evidence and initial source copies
are below `.codex-tmp/flat32-elevation-40km/`. The exact preceding `dist` was not
copied before rebuilding. For a coherent rollback, restore this unit's source and
server selection from starting commit `22687fb7` and rebuild the app, preserving
both package directories. The task's source copies cover the initial app changes;
the later controller change is recoverable from that commit.
