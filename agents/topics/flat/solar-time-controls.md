# Globe solar-event and shared-time controls

Status: implemented and verified on 2026-11-09.

The Globe toolbar has an AccessTime clock button between FOV and focus. Its
text-only menu selects Sunrise, Solar noon or Sunset. Each action updates the
existing shared timestamp, so both views receive the same instant. Camera
direction and elevation are not changed by the event selection.

The date is the selected timestamp's device-local calendar date, matching the
current global date/time editor. Location-based time-zone selection remains
deferred. Calendar bounds use successive local midnights, including days with
daylight-saving transitions; no fixed 24-hour local-date assumption is added.

Sunrise and sunset mean the rendered Sun's upper edge meeting the spherical
ground horizon. They use the current requested Globe elevation, horizon dip
`acos(R / (R + h))`, and the same 0.004675-radian solar radius as the renderer.
The event condition is Sun-center altitude `−dip − angularRadius`. No extra
atmospheric refraction or conventional −0.833-degree correction is applied.
Solar noon means upper meridian passage, whether or not the Sun is visible.
Unavailable events stay disabled and are labeled unavailable; they never
substitute noon or silently select a different date.

The `SphericalSolarEvents` numerical helper consumes the existing geometry's
Sun direction. Meridian extrema bracket even brief polar crossing pairs; signed
crossings are refined to a millisecond within the approximate solar model.
That numerical tolerance is not a claim of millisecond astronomical accuracy.
The registered SphericalEarthModel service owns a per-view cache keyed by
calendar bounds, location and requested height. Same-day time, orientation and
FOV changes reuse it. View closure and application stop release those records.
React presents the view's prepared menu options and relays intent through its
owning view/controller; no feature calls the other Earth implementation.

Global date/time configuration adds **−10 min** and **+10 min** beside Apply
and Now. These immediately step the accepted shared instant by exactly ten
elapsed minutes and replace unfinished date/time drafts, like the existing Now
action. Seconds and milliseconds are preserved, and stepping can cross dates
or daylight-saving boundaries. Apply continues to accept explicitly edited
drafts; stepping does not parse those drafts or depend on a selected location.

Verification:

- Flat type checking and the normal Flat build pass.
- All **288** maintained browser tests pass, including geometric event
  direction checks, elevation changes, polar day/night, event-cache reuse,
  exact view routing, disabled actions and shared stepping across New Year.
- Source formatting and whitespace checks pass.
- [Native served-app verification](../../../.codex-tmp/solar-time-controls/20261109/browser-final/report.json)
  passes: the initially unavailable clock, all three real menu actions, both
  views displaying the selected shared instant, ten-minute buttons replacing
  drafts, requested-elevation event changes and Union Glacier polar-day choices.
  No page errors; the disposable browser profile was removed.
- Inspected [clock menu](../../../.codex-tmp/solar-time-controls/20261109/browser-final/clock-menu.png)
  and [final time actions](../../../.codex-tmp/solar-time-controls/20261109/browser-grid/time-step-buttons.png).
  The actions use two columns: Apply/Now followed by the backward/forward pair.
  A final [layout check](../../../.codex-tmp/solar-time-controls/20261109/browser-grid/report.json)
  verifies compact button heights and paired rows after correcting the tall
  wrapping found in the initial capture. That profile was also removed.

The full native functional check took 94.4 seconds, including browser startup,
scene preparation and assertions. The final CSS/layout-only check took 25.3
seconds; its capture did not wait for scientific scene preparation. These are
runner wall times, not interaction-latency benchmarks. The final normal build
passes after the CSS correction. Existing functional/type results are reused
because that last correction changes only the action-row layout.

Engineering reviewers remain cancelled. This is application-control
verification, not a new atmosphere or scattering qualification.

## Horizon timing investigation

The owner reported a possible several-minute sunrise/sunset offset on
2026-11-09. A native-render reproduction at San Jose (37.33939, -121.89496),
5 m elevation, on that device-local date selected sunset at 16:59:46.957 PST.
The Sun-center altitude was -0.339704 degrees: the negative horizon dip plus
the negative solar radius, as specified above. Three minutes earlier the
center was +0.215295 degrees and the rendered disk was visible immediately
above the ground; at the selected sunset and three minutes later no disk
was visible. The camera was level and aimed at the Sun's current azimuth.

The [native report](../../../.codex-tmp/solar-horizon/20261109/browser-check/report.json)
and captures [before](../../../.codex-tmp/solar-horizon/20261109/browser-check/sunset--3.png),
[at](../../../.codex-tmp/solar-horizon/20261109/browser-check/sunset-0.png) and
[after](../../../.codex-tmp/solar-horizon/20261109/browser-check/sunset-3.png)
record this reproduction. There were no page errors; the disposable browser
profile was removed. This establishes consistency for that sample, not an
astronomical accuracy claim or identification of the owner's exact case.

First/last upper-limb contact leaves effectively no visible disk at the exact
event. A half-visible disk corresponds to center crossing and a different
instant. Published apparent sunrise/sunset also includes a refraction
correction, which this renderer and event selector currently omit; the
[US Naval Observatory definitions](https://aa.usno.navy.mil/faq/RST_defs)
describe that convention. The owner confirmed that the report concerned the
Sun appearing below the rendered horizon at both events in San Jose on
2026-11-09, then accepted leaving the current behavior unchanged.

Refraction is explicitly deferred to a future discussion. The current
geometric upper-limb definition remains in place; no center-crossing shortcut
or arbitrary time offset is selected. Future apparent-event support would
need consistent treatment in the displayed Sun position and event calculation.
No application code or event definition changed during this investigation.
