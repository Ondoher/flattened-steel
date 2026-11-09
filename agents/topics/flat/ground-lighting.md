# Flat Earth ground lighting

Status: implemented and verified on 2026-11-08.

The green Lambert ground remains `#4fa33d`. Its illumination now comes from
the same measured direct-normal Sun spectrum and diffuse-horizontal sky
spectrum that Flat32 uses, through the same spectral-to-renderer conversion.
Previously Flat measured those spectra for the shader but left the Three
ground on the source adapter's white calibration lights. That made the
ground too bright and insufficiently colored under low-Sun conditions.

`runtime/FlatEarthSceneLighting.js` owns a retained upper-hemisphere sky light
with a black lower hemisphere and a finite-Sun point light. The point light
uses zero additional distance decay because the receiver measurement already
includes source transport. Three applies the surface cosine; the spectral
bridge uses normal incidence so it does not apply that cosine twice.

`FlatEarthRuntime` applies the measurement before its first preflight render.
Ordinary location/time/elevation updates prepare new light colors, intensities
and source placement alongside the existing shader transaction. Publication
updates the retained lights; rollback restores their previous colors,
intensities and positions. Presentation scaling retains the unscaled measured
intensities, so switching back to Full restores physical illumination.
No atmosphere and Shader off preserve the selected neutral presentation fill
and disable the Sun-derived direct/diffuse lights.

Verification:

- Flat type checking passes.
- All **283** maintained Flat browser tests pass. Two new cases compare the
  incident direct/diffuse RGB numerically with Flat32 for bright, dim and zero
  measurements, and cover retained staging/rollback and presentation restore.
- The normal Flat build, targeted formatting and whitespace checks pass.
- [Native corrected-scene report](../../../.codex-tmp/ground-lighting/20261108/browser-after/report.json):
  Union Glacier at 00:00, 06:00, 12:00 and 18:00 UTC on November 8, 2026;
  retained scene/composer/shader/lights through time and 5-km elevation updates;
  both disabled-atmosphere modes and Full restoration; and an injected
  publication failure restoring the prior light colors/intensities/positions
  all pass. No page errors; disposable browser profiles were removed.
- [Matched rendered comparison](../../../.codex-tmp/ground-lighting/20261108/comparison.json):
  at 06:00 UTC the lower-ground patch changes from approximately RGB
  **(144, 225, 112)** to **(4, 12, 2)**. The sampled sky pixels are identical.
  All four cases reduce the excessive ground brightness. These are encoded
  screenshot pixel measurements, not physical luminance or accuracy metrics.
  Inspected [previous](../../../.codex-tmp/ground-lighting/20261108/browser-before-reference/union-6.png)
  and [corrected](../../../.codex-tmp/ground-lighting/20261108/browser-after/union-6.png)
  renders reproduce the reported bright-green discrepancy and its correction.

The first attempted before capture contained the corrected code because an
existing background builder had already updated the application bundle. It is
preserved as `browser-before/`, but is not the baseline. The actual comparison
uses `browser-before-reference/`: an ignored fixture restoring only the three
runtime lighting call-site changes from Git HEAD `53ba1937` in the otherwise
identical bundle. `reconstruct-baseline.mjs` records that operation. No source
reversion or historical evidence modification was needed.

The application does not import Flat32 at runtime; its lighting implementation
is used only as an independent comparison in the maintained tests. The engine,
scattering cache, green material and sky calculation are unchanged. Engineering
reviewers remain cancelled; these are primary-agent checks, not a new physical
qualification or standards-compliance claim.
