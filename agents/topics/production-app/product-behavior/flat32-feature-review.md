# Flat32 Features For Production-App Review

Status: candidate inventory requested by the owner on 2026-10-26. Every entry
is pending review for possible inclusion or adaptation. None is selected for
the finished app or its MVP by appearing here.

The [application roles](../README.md#application-roles-and-current-status) own
the distinction between the Flat32 integration test bed, the production engine
and the future deployable app. This document owns the Flat32-derived candidate
list. It records observed capabilities rather than a proposed product design.

## Review Method And Evidence

The inventory is based on inspection of the current Flat32 view, control and
startup source, with linked topic records for behavior and verification limits.
This documentation pass did not run the application or repeat its qualification.
Source links identify implementations; linked result owners retain their claims.

All candidates have decision **pending**. Owner review may select **include**,
**adapt**, **defer** or **omit**, with a rationale and separate MVP disposition.
An adaptation needs a defined product behavior before implementation. Existing
labels, preset values, layout, URL parameters and test geometry are reference
choices, not requirements for the finished app.

Candidate review must respect the selected
[production-app behavior](README.md#selected-production-app-behavior), including
the location scope. The remaining location-selection choices below are open.

## Scene And Observation Candidates

| ID | Feature observed in Flat32 | Existing capability and source | Question for product review |
| --- | --- | --- | --- |
| F32-01 | Flat/Globe switching | Switch between flat/local-Sun and spherical/distant-Sun geometry/source families. [View](../../../../src/flat32/Flat32View.js), [mode controller](../../../../src/flat32/ModeController.js). | Include both families, and how should users select or compare them? |
| F32-02 | Location selection | Presets for San Jose, Union Glacier and 85 degrees south at zero longitude, with preset-specific dates. [Constants](../../../../src/flat32/consts.js), [location/time controller](../../../../src/flat32/LocationTimeController.js). | Retain presets, adapt to arbitrary locations, or offer both? |
| F32-03 | Time basis and event selection | Flat angular presets 0/45/90/135/180, a Flat/Globe time-basis toggle, sunrise/solar-noon/sunset events, and hour or ten-minute adjustments. [View](../../../../src/flat32/Flat32View.js), [location/time controller](../../../../src/flat32/LocationTimeController.js). | Which time concepts and controls should the product expose? |
| F32-04 | Observer elevation | Physical observer/camera presets at 5, 100 and 500 m, 2, 10 and 40 km; availability depends on the installed mode. [Scene controls](../../../../src/flat32/Flat32SceneControls.js), [view](../../../../src/flat32/Flat32View.js), [40 km evidence](forty-km-elevation.md). | Retain discrete heights or adapt the range and interaction? |
| F32-05 | Mouse-look camera | Click-to-lock pointer control rotates the camera with configured sensitivity and polar limits. [Pointer-look controller](../../../../src/flat32/PointerLookController.js). | Adapt navigation for the intended users and devices, including alternatives to pointer lock? |
| F32-06 | Perspective framing | Vertical field-of-view presets at 120, 90, 50, 35, 20, 5 and 2 degrees; configuration can supply other valid perspective angles. [Constants](../../../../src/flat32/consts.js), [scene controls](../../../../src/flat32/Flat32SceneControls.js). | Which framing presets or zoom interaction belong in the product? |
| F32-07 | Center on Sun | Aim the camera at the physical Sun in the currently displayed scene, preserving height, FOV and physical state; this does not enable tracking or reveal an occluded Sun. [Application](../../../../src/flat32/Flat32Application.js), [behavior and evidence](center-on-sun.md). | Include a centering action, and what explanation should accompany a hidden Sun? |
| F32-08 | Atmosphere comparison modes | Full atmosphere, No atmosphere and Shader off selections; No atmosphere availability depends on the installed mode. [View](../../../../src/flat32/Flat32View.js), [scene controls](../../../../src/flat32/Flat32SceneControls.js). | Which comparison modes help users, and which remain developer controls? |
| F32-09 | Illustrative Sun presentation | In No atmosphere mode, independently adjust Sun illumination and disc brightness from 0 to 100 percent. Adaptation follows illumination; Full uses physical lighting. [View](../../../../src/flat32/Flat32View.js), [scene controls](../../../../src/flat32/Flat32SceneControls.js). | Include an explicitly illustrative control, adapt its presentation, or omit it? |
| F32-10 | Ground, scene objects and shadows | Ground and six matte review objects provide scale, occlusion and lighting/shadow cues. An Objects toggle hides review objects while retaining ground. [Scene](../../../../src/flat32/EndpointScene.js), [view](../../../../src/flat32/Flat32View.js), [integration description](../../../../src/flat32/README.md). | What scene content should replace or retain these test objects? |

## Presentation And Configuration Candidates

These capabilities exist in configuration or startup query selections; their
presence does not imply that Flat32 provides an ordinary interactive UI for them.

| ID | Feature observed in Flat32 | Existing capability and source | Question for product review |
| --- | --- | --- | --- |
| F32-11 | Color and exposure behavior | Altitude-aware Color Reset default and explicit Basic Bruneton/P2/P9 controls selected at startup. [Bootstrap](../../../../src/flat32/Flat32Bootstrap.js), [selection contracts](../../../../src/flat32/Flat32ProductionSelections.js), [twilight behavior](twilight-exposure.md). | Which display behavior should be the default, and should users see alternatives? |
| F32-12 | Stars and catalog selection | Configured stellar sources with brightest-500 or brightest-2,000 catalog selections and mode-specific support. [Bootstrap](../../../../src/flat32/Flat32Bootstrap.js), [selection contracts](../../../../src/flat32/Flat32ProductionSelections.js). | Include stars, which catalog and mode coverage are needed, and what assets can ship under MVP M3? |
| F32-13 | Low-light stellar presentation | Startup choices for physical, chroma, mesopic or combined human presentation, using the supported filter configuration and required assets. [Bootstrap](../../../../src/flat32/Flat32Bootstrap.js), [selection contracts](../../../../src/flat32/Flat32ProductionSelections.js). | Select one presentation or expose a clearly explained comparison? |

## Interaction And Reliability Candidates

These are application behaviors to review alongside visible features. Their
user-facing outcomes may be retained through a different implementation.

| ID | Feature observed in Flat32 | Existing capability and source | Question for product review |
| --- | --- | --- | --- |
| F32-14 | Setup and state feedback | Progress, ready/error messages, displayed time and selected settings; pending requests are distinguished from the scene currently shown. [View](../../../../src/flat32/Flat32View.js), [application](../../../../src/flat32/Flat32Application.js). | What loading, pending-state and failure feedback does the product need? |
| F32-15 | Safe scene updates | Prepare replacement mode/time/location state before publication, cancel superseded preparation and preserve the last accepted scene on failure. [Mode controller](../../../../src/flat32/ModeController.js), [application](../../../../src/flat32/Flat32Application.js). | Retain these continuity guarantees, and how should cancellation and retry appear? |
| F32-16 | Responsive, on-demand rendering | Host-sized viewport and resize handling, redraw after changes, idle rendering suspension and hidden-tab pause. Caller-owned continuous and manual frame cadences are also available. [Runtime](../../../../src/flat32/ThreeSceneRuntime.js), [scheduling behavior](on-demand-rendering.md). | Retain idle efficiency and define the supported devices, resizing behavior and animation cadence? |
| F32-17 | Runtime recovery and cleanup | Context-loss/restoration handling, coordinated resource disposal and direct-scene fallback during setup or failure. [Runtime](../../../../src/flat32/ThreeSceneRuntime.js), [application](../../../../src/flat32/Flat32Application.js). | What recovery behavior and visible fallback should the finished app provide? |

## Developer Tooling To Review Separately

Flat32 also has diagnostic startup scenes, cache-selection controls, optional GPU
performance telemetry and caller-driven manual rendering. These are candidates
for developer or support tooling rather than assumed end-user features. Their
sources are [bootstrap](../../../../src/flat32/Flat32Bootstrap.js) and
[runtime](../../../../src/flat32/ThreeSceneRuntime.js). Review their retention,
access and product relevance without carrying test-bed implementation details
into ordinary user flows by default.

## Relationship To MVP And Other Backlog

The [MVP requirements](../mvp/requirements.md) remain the canonical owner of
efficient compatible time/location animation, engine hardening, and scientific
authority/distribution clearance. This inventory neither closes nor expands
those requirements. In particular, existing frame cadence options and discrete
time controls do not establish completion of MVP M1's time/location animation.

Future cache-quality profiles and per-mode saved-camera behavior remain proposals
or deferred work in the [migration inventory](flat32-migration-inventory.md), not
implemented features asserted here. Moon/planet rendering, light pollution,
optical effects and other [pending release decisions](../release/color-star-cache-closeout-plan.md#owner-disposition-candidates)
retain their existing owners. The ignored personal gallery and experiment-only
water-material images do not establish in-app media export or water rendering.

Next step: owner review of these candidates and their MVP disposition. No design,
implementation, deployment or experiment resumption is authorized by this list.
