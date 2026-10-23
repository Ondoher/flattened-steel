# Center on Sun

State: implemented, built and locally activated; browser and live GPU checks pass.
Owner requested a native Center on Sun button on 2026-10-23.

The action uses the currently published mode's geometry to aim the existing
camera at the physical Sun in Flat/local or Globe/distant mode. It retains
position, elevation, field of view, physical state, runtime and cache, and requests
one on-demand redraw. If a different time or location is still preparing, the
action uses the scene currently displayed. Before a mode is published, it has
no effect. A Sun behind the ground remains occluded; centering does not change
visibility, time or elevation and does not enable tracking.

Evidence and build logs belong below `.codex-tmp/flat32-center-sun/`.
The review unit is this camera control's application/view/controller/type changes
and focused browser coverage, with baseline commit a1547549 and pre-existing
performance/twilight diagnosis documents preserved. Standards calibration is
stale; no standards-compliance result is claimed.

## Verification

App type checking, production app/worker build, browser-test build, 17 focused
native browser cases, full repository and scoped formatting checks pass. Tests
cover native button dispatch and actual geometry/camera direction in both modes,
including the depressed late-twilight Sun at 40 km. The first test run rejected
the normal DOM PointerEvent argument in an overly strict spy assertion; the final
assertion verifies that the native click dispatches the action exactly once.
No implementation behavior was weakened for that test repair.

The [actual served-app observations](../../../../.codex-tmp/flat32-center-sun/live-01/result.json)
verify native clicks in both modes at 5-degree FOV, with physical Sun-direction
alignment equal to1, unchanged camera position/FOV/state/resources and no idle
successor frames. Both frames have zero page/WebGL errors. The Globe image is
strongly overexposed around the Sun under the existing display response; centering
is verified geometrically and does not alter the known exposure issue.
[Final verification](../../../../.codex-tmp/flat32-center-sun/final-verification.json)
identifies the checked source, built app and captured results. The owned browser
and server are closed. No cache rebuild, profile/exposure change, performance
quality-tier change or remote push was performed. Existing diagnostic documents
and their evidence are retained.
