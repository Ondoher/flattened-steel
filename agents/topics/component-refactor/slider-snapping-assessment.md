# Magnetic Slider Adaptation Assessment

Status: shared Slider adaptation implemented and locally verified.
The owner authorized the adaptation after the source assessment below.

The snapping behavior now extends the existing class-based shared Slider through
optional props. The upstream package does not rely on private MUI
internals, DOM measurements or a replacement thumb. It transforms the numeric
value emitted by MUI before notifying the caller. Current MUI's public change
and commit callbacks provide the same integration point.

## Sources And Compatibility

Inspected [MagneticSlider source](https://github.com/loucadufault/MagneticSlider/blob/main/src/MagneticSlider.js),
its repository LICENSE/package.json and npm metadata for version 1.0.4.
The published peers require React 16/17 and @material-ui/core 4.12.3;
Flat uses the current @mui/material wrapper. The repository LICENSE contains
the MIT notice; package metadata declares ISC. Preserve the source notice if
copying its code, and retain this discrepancy in provenance.

Downloaded source, metadata, license, retrieval URLs and the proof are under
`.codex-tmp/magnetic-slider-assessment/`. No package was installed or executed.
The arithmetic probe evaluates only the inspected upstream target-selection
function and an independent small numeric prototype.

## Shared Slider Contract

- `snapPoints` accepts a readonly numeric array; `snapRadius` enables attraction
  when positive. Snapping stays disabled by default. Radius is in slider-value units, such as
  degrees for the alternate time input; visual marks need not be snap targets.
- `_resolveValue` selects the nearest point inside the inclusive radius, passing
  through values outside it and ignoring targets outside min/max. The first
  supplied point wins an equal-distance tie. No sorting, caller mutation or
  uncontrolled-value wrapper is needed for Flat's scalar controlled Slider.
- Both onChange and onCommit use the same normalization.
- Attraction applies during pointer/touch input. Normal keyboard steps are preserved
  so an arrow key can move away from a snapped point. Existing interaction
  start/end/cancel handling and MUI focus behavior remain in place.
- External controlled value changes are displayed as supplied and do not trigger
  snapping or callbacks. New snap props apply on subsequent input. Custom snap
  props are consumed by the wrapper and never forwarded to MUI or DOM elements.
- The feature decides its points and radius. Flat Earth's
  [Sun-position policy](../flat/flat-earth-time-input.md#sun-position-snapping)
  now configures its toolbar and configuration sliders. Other callers keep
  their previous behavior without snap props.

The independent numeric implementation adds no service/model, package dependency, shader/cache changes,
manual element references, custom drag handling or additional visual styles.

## Upstream Issues To Avoid

The upstream sorting wrapper shallow-copies the marks array, then adds missing
magneticScale fields to the original mark objects. Its dead-zone midpoint uses
(high − low) / 2 rather than low + (high − low) / 2. The proof reproduces the
error with marks 100/200: input 150 snaps to 200 despite a configured midpoint
dead zone. Snapping every keyboard event also traps small steps at a mark;
five 0.1 steps from zero with radius 2 remain at zero. The upstream commit
callback is forwarded without the change callback's normalization.

## Verification

The standalone probe reproduces the midpoint and keyboard issues. Its independent
prototype passes nine checks for snapping from either side, passing through
outside the radius, multiple points, disabled/empty snapping and keyboard
escape, with frozen points unchanged. See `probe-result.json`.

The application adaptation is in Slider.jsx and its ambient AppSliderProps
contract. Types, all 223 browser tests and the normal production build pass.
The five added integration cases exercise real MUI pointer movement, equal
change/commit values, keyboard movement away from a snap point, native touch,
optional/updated settings, inclusive boundaries and permitted-domain targets.
The existing cancellation test now also enables snapping and verifies late
pointer movement cannot revive the retired gesture. Frozen unsorted points
remain unchanged; snap props do not appear as DOM attributes. Scoped source
formatting and Git whitespace checks pass. Results are under
`.codex-tmp/slider-snapping/` (types, final-browser and build logs/results).

The feature-owned Sun-position policy is linked above. The preceding neutral shader-off
lighting changes remain in the working tree and are separate work. No source
standards review is claimed; the owner's cancellation remains in effect.
