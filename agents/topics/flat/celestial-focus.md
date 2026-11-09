# Celestial Focus Menu

Both Earth features provide a Focus on menu with Sun and Polaris actions in
their toolbar and Camera settings. It retains the existing MUI focus icon and
uses localized labels. The menu is disabled until a rendered observation exists.
Choices execute commands without retaining a selected target, so the same action
can be repeated after manual camera movement.

Each action passes through the owning view, controller and session to its exact
runtime. Focus uses the displayed observation while a replacement is preparing.
It changes and saves only that view's camera orientation, then requests a redraw.
Shared location/time, camera height and FOV remain unchanged. Focus does not track
the target continuously or rebuild the scene/cache. Existing Sun aiming remains.

Polaris uses member `bsc-v50-hr-424` (Alpha Ursae Minoris) from the already loaded
brightest-2,000 catalog. The app-owned stellar service returns its canonical J2000
direction. Flat Earth uses its existing geometry-owned dome projection. Spherical
Earth uses a CPU counterpart of its existing stellar shader's mean-of-date
precession, sidereal time and local east/north/up transform. This targets the
catalog star's offset from the celestial pole. Physical horizon/ground occlusion
still applies; focus does not alter star visibility or lighting.

The shared IconMenuButton supports both kinds of menu: supplying a value retains
its existing radio-selection behavior; omitting it gives ordinary menu actions
without a selected state. MUI continues to own anchoring, keyboard interaction,
dismissal and focus restoration.

## Verification

Flat's maintained production build and 234 browser tests pass, including scoped,
repeatable Sun/Polaris actions in both toolbars and settings, plus catalog tuple
ownership. All 33 focused SphericalEarthGeometry tests pass, including pole
placement at J2000. Flat and engine type checks pass.

The [live proof](../../../.codex-tmp/focus-menu/20261108/browser-proof-r2/report.json)
passes both real menus, Sun/Polaris aiming and two-view isolation without changing
shared time or rebuilding the spherical scene. Native GPU readback compares the
new spherical CPU calculation directly against the existing stellar shader for
Polaris at three latitudes and three dates spanning 2000-2050. All nine cases pass
the declared 2e-5 component tolerance. The earlier proof's duplicated shader
struct was a diagnostic assembly error; its report is preserved and the corrected
probe passes. Both disposable browser profiles were removed.

[Menu capture](../../../.codex-tmp/focus-menu/20261108/browser-proof-r2/spherical-earth-menu.png)
and [mixed focused views](../../../.codex-tmp/focus-menu/20261108/browser-proof-r2/both-focused.png)
were inspected. Browser captures/measurements remain ignored; no browser data is
retained. Whole-repository checkpoint disposition is recorded in the
[camera-sync service final report](camera-sync-service-plan.md#m2-and-final-report).

Engineering standards reviewers remain cancelled. The primary owns self-review;
this focused update does not rerun the completed spherical cache qualification.
