# Production Ambient-Light Plan

Canonical design: [Production Ambient-Light Design](ambient-light-design.md).

- [x] A0 — Trace the receiver-light, neutral-Lambertian, Three-light, scene
  capture, and final composition boundaries.
- [x] A1 — Add a reversible atmosphere-shader isolation button that retains
  scene lighting and persists across mode replacement.
- [x] A2 — Replace the orientation-independent distant diffuse adapter with the
  selected black-ground upper-hemisphere approximation and reset local-mode
  colors during mode transitions.
- [x] A3 — Add focused contract coverage, run the Flat32 type check, and pass
  the focused browser lane (`24/24`).
- [x] A4 — Pass the exact-cache application lane (`25/25`) with the local cache
  endpoint configured; the first unconfigured invocation produced an expected
  HTTP 404 and is not a product failure.
- [x] A5 — Replace the invalid plus-one-hour comparison. Raw direct output
  clipped sunset HDR values, while the first display-only correction wrongly
  reapplied physical-radiance exposure to renderer-scale Three light values and
  made the `0.4696449` hemisphere result black. Use the compositor's exact
  renderer-linear-to-display conversion, then capture matched on/off evidence
  and review the remaining scene-hit atmospheric contribution separately.
  Owner review rejected run `000015` as too bright and confirmed that run
  `000014` saturated nearly all geometry.
- [x] A6 — Correct only the scene-light adapter's physical-E8-to-unitless-Three
  bridge, leaving atmosphere and Color source unchanged. Matched candidate runs
  `000016`/`000017` at plus one hour and `000018`/`000019` at sunset have zero
  WebGL errors and no white-geometry regression. Both type checks, Algorithm32
  `610/610`, and the exact-cache Flat32 lane `25/25` pass.
- [ ] A7 — Obtain owner appearance review of the lighting-only candidate,
  especially the very dark plus-one-hour geometry, before selecting or revising
  the scene-light calibration. This decision is closeout item C3 in the
  [production closeout plan](color-star-cache-closeout-plan.md).

The atmosphere and Color algorithms remain fixed throughout this plan. Any
further magnitude or chromaticity correction selected by A7 requires a named
scene-light equation and a new evidence boundary; it must not be hidden in the
diagnostic toggle or implemented in Color.
