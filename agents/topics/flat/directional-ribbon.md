# Directional Ribbon

Each Earth toolbar has an independent compass toggle using MUI's
[ExploreOutlined icon](https://mui.com/material-ui/material-icons/?theme=Outlined).
The ribbon starts hidden and appears directly beneath the toolbar, above the
scene canvas. It contains only N, NE, E, SE, S, SW, W and NW, with a fixed blue
center indicator. Its 180-degree heading tape keeps several directions visible
independently of camera FOV. Labels move through the center as the camera turns.

The shared DirectionRibbon component owns the localized tape presentation and
its component stylesheet. The ordinary app build copies and links that stylesheet;
there is no runtime CSS import. Each feature page owns its ribbon row and retains
its existing surface/canvas while the row opens or closes. The workspace stays
generic and no feature imports another feature's implementation.

Visibility belongs to the feature's registered per-view model. The icon relays
intent through its view, controller and session; the session publishes state
without preparing another physical frame. Closing a view discards its visibility
preference. Camera quaternion notifications already used by mouse look and
Sun/Polaris focus produce clockwise heading from local north. A shared pure
helper projects the accepted quaternion; the right axis preserves yaw when the
camera looks vertically. The session exposes the resulting heading to presentation.
There is no polling loop or second simulation clock.

The ribbon's row consumes 32 pixels and the retained renderer's existing resize
observer adjusts its drawing buffer. Toggling or updating the ribbon does not
request cache construction or scene replacement. Each view follows its own
camera; shared date/time and the other view's visibility are unaffected.

## Verification

Flat types and all 239 maintained browser tests pass. The new cases cover eight
bearings, pitch and vertical looks, north wraparound, localized labels, scoped
toggle intent, independent model state, and retention of the exact mounted canvas.
The normal production build and real mixed-view layout/input checks pass.
The [live report](../../../.codex-tmp/direction-ribbon/20261108/browser-proof-r2/report.json)
verifies both actual compass buttons, native pointer-lock mouse look, Sun/Polaris
focus synchronization, independent visibility and desktop/narrow-window resizing.
The ribbon begins exactly at each toolbar's bottom edge and consumes 32 pixels;
at 600 pixels wide neither view creates horizontal page overflow. Both canvases,
renderers, the Flat frame and all shader program identities are retained. There
are no additional physical preparation calls during the controls/resize checks;
the spherical runtime retains one scene build.

Inspected captures: [desktop mixed views](../../../.codex-tmp/direction-ribbon/20261108/browser-proof-r2/both-ribbons.png)
and [narrow stacked views](../../../.codex-tmp/direction-ribbon/20261108/browser-proof-r2/narrow-ribbons.png).
Browser profiles were removed after success or failure. The first live probe caught
an app output whose generated HTML lacked the newly added stylesheet link;
the maintained test lane loads source styles directly, so a normal app build is
required before assessing production layout.

Engineering standards reviewers remain cancelled. Primary self-review and the
focused checks above own this change. The focus and Now changes accompany the
whole-repository checkpoint described in the
[camera-sync service final report](camera-sync-service-plan.md#m2-and-final-report).
