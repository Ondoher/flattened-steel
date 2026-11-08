# Flat Earth Time: Degrees From Closest

Status: implemented on 2026-11-05 through the owner-authorized
[workspace comps plan](workspace-comps-implementation-plan.md). The
[execution record](workspace-comps-execution.md) owns verification and decisions.

## Meaning And Placement

The owner selected an alternate time input for the Sun's daily orbit position
before/after closest approach to the selected location, with 0° at closest. It
is an alternate editor of the shared timestamp for both views, not elevation,
azimuth, camera FOV, a per-view override or a second clock.

Each Flat Earth toolbar's clock opens a **Shared time** popup with a slider,
signed angle, before/after legends, closest marker and **Time settings** entry. Shared
configuration contains **Location and time** and **Flat Earth time** sections.
The latter supplies the slider, numeric Degrees field, closest-reference
explanation, date basis and resolved device date/time. Both toolbar entries show
the same open state. Page settings targets the independent Camera section of
the exact view instead.

Flat Earth contributes its editors through the generic configuration service;
the workspace does not import or identify their implementations. The app-wide
animation-loop service remains the accepted timestamp owner through configuration.
The [provider contract](component-service-proposal.md#configuration-provider-contract)
owns the extension boundary. Accepted location/time and camera values survive
panel/section changes; numeric drafts belong to a registered editor model-service,
independent of a canvas lifetime.

## Sun-position Snapping

The toolbar popup and configuration slider use magnetic stops every 45° from
−180° through +180°, including closest at 0°. Pointer/touch input snaps within
2° of a stop and moves freely outside that radius. Keyboard steps remain 0.1°,
and numeric entry retains its existing precision. This edits the same shared
timestamp through the existing gesture/controller path.

FlatEarthTimeControls owns the presentation policy. Its
`SUN_POSITION_SNAP_INTERVAL_DEGREES` constant is 45; changing it to 15 generates
the finer stop grid without changing the shared control or either editor's JSX.
The interval and attraction radius are independent. The
[shared Slider contract](../component-refactor/slider-snapping-assessment.md#shared-slider-contract)
owns generic snapping behavior.

Verification: client types, all 224 Flat browser tests and the normal production
build pass. The feature regression exercises pointer input near every stop in
both editor placements, verifies the owning view/token receives the snapped
angle, and confirms free input between stops. Logs/results are under
`.codex-tmp/sun-position-snapping/`. Scoped formatting and Git whitespace pass.

## First-Pass Conversion And Editing Policy

Independent execution selected the following reversible implementation policy
from the comp's working proposals:

- Negative degrees precede closest; positive degrees follow it. The slider is
  bounded at -180°/+180° with 0.1° steps; the toolbar rounds its compact readout to
  one decimal. Numeric entry accepts signed dot-decimal degrees in that range
  and retains useful precision up to canonical integer milliseconds. Its readout
  uses one to six decimal places, so precise accepted input is not silently
  displayed as a different one-decimal value. Labels use app localization;
  richer locale-specific numeric syntax is not introduced in this first pass.
- Choose the geometry-resolved closest occurrence nearest the accepted instant,
  considering adjacent UTC dates. Freeze that reference for one pointer/key
  gesture. Signed offsets use the production 24-hour daily orbit. The endpoints
  are twelve hours before/after that chosen occurrence; dragging does not
  automatically wrap. The date readout is the device-local date of that
  reference, while resolved time is the accepted instant in device time.
- Ordinary time changes and location changes recompute the nearest reference.
  Location changes preserve the accepted timestamp. There is no retained angle
  mode or promise to preserve both angle and instant when location changes.
- Slider input seeks shared time through one controller operation. A valid
  numeric draft is accepted on Enter or blur. Incomplete/invalid text remains
  visible with feedback and does not seek; Escape restores the accepted
  representation. Section changes retain unfinished model-owned drafts. A valid
  blur can accept before navigation, consistent with the numeric acceptance rule.
- A new slider gesture supersedes a numeric draft. An external location/time
  update invalidates an active gesture; its late events cannot write. Numeric
  text survives external updates and resolves against the current reference
  on a fresh acceptance. View/panel removal ends only its control's gesture;
  stopping the feature clears editor state and retains shared accepted time.
- Missing location yields an unavailable angle and disabled range with a route
  to Location editing, rather than invented coordinates or an accepted zero.

The controller seeks through the configuration/current-time capability. Existing
scene sessions coalesce newer requests and retain coherent completed frames with
per-view preparing/failure feedback. A requested angle is not a claim that every
canvas has already completed that frame.

## Production Geometry Support

[FlatEarthGeometry.resolveObservationInstant](../../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js)
already accepts a date basis, unit-bearing location and closest-angle policy.
Its [contract](../../../src/algorithm32/implementation/flat-earth/types.d.ts)
and [FlatSynchronizer](../../../src/algorithm32/implementation/flat-earth/synchronization/FlatSynchronizer.js)
own seasonal/world synchronization. Positive angles follow the clockwise orbit;
that resolver normalizes within its selected daily orbit. A signed editor cannot
obtain day selection merely by passing a negative angle into that normalized API.

The additive public `describeClosestApproach` operation selects a nearby closest
occurrence and derives its signed 24-hour offset. `resolveClosestOffset` converts
a signed angle against that explicit occurrence to a canonical UTC instant.
The app uses these public operations rather than a guessed local-noon formula
or a private synchronization import. The existing
[Flat32 controller](../../../src/flat32/LocationTimeController.js) remains read-only
integration reference and is not a runtime dependency.

The date remains necessary for seasonal state. The app's animation-loop phase
is startup-relative and is not relabelled as degrees from closest. The
closest-angle readback follows geometry/location, not that startup epoch.

The fixed San Jose sample uses37.33939°,-121.89496° and June 20, 2024:
closest `2024-06-20T20:08:48.339Z`; +45° resolves to
`2024-06-20T23:08:48.339Z`, displayed **Jun 20, 2024 ·4:08:48 PM** in device
America/Los_Angeles. The execution evidence records properly spaced localized
UI values, fixed signed-offset fixtures, day-boundary readback and actual edits.

## Presentation And Further Work

The [comp handoff](configuration-toolbar-comps.md#shared-time-slider-update)
retains the original design artifacts. The execution record links actual
application images and measurements. The four assigned frame/header/scene/panel
rectangles match the specification. Current device-local date/time entry remains
unchanged; location time-zone lookup/override, explicit DST ambiguity, new time
modes, playback UI and broader numeric localization remain future work.
