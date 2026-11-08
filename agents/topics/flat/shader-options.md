# Flat Earth Shader Options

Status: implemented and locally verified.

The owner selected independent per-view sky options, with Sun illumination 0%
and disc brightness 100% whenever atmosphere is disabled. Full uses physical
lighting. No atmosphere retains Algorithm32 celestial/color composition with
atmospheric view transport disabled. Shader off directly renders the Three
scene, bypassing atmosphere/celestial composition. Disc brightness remains
configured at 100%; the bypass does not draw the shader-owned solar disc.

Both atmosphere-disabled modes add a small neutral ambient fill so the ground
remains visible. It is a retained, per-scene Three AmbientLight, separate from
the physical Sun lights. The model supplies a reference intensity of 0.03;
Full sets it to zero. No atmosphere divides this reference by the existing
color model's display gain before scene capture, preventing zero-Sun night
exposure from turning the fill white. Shader off uses the reference directly.
This changes only the presentation light, preserving receiver measurements,
display adaptation, star brightness, Sun illumination 0% and disc brightness 100%.
The light remains installed in the scene across mode changes and physical
updates; its intensity alone changes.

The existing feature-owned controls expose Sky in each view toolbar and its
Camera and sky settings section. Model-service owns each view's canonical
selection and derives the fixed Sun policy. Session/controller/view relay the
intent. Runtime applies presentation to retained bindings, lights and receiver
adaptation on every draw, including later height/time/location publications.
Switching back to Full restores illumination. Mode changes request a redraw
without preparing a new physical observation or rebuilding the cache/shader handle.
The first direct Three render compiles its screen-output material program;
subsequent direct renders reuse it. Full/No atmosphere transitions compile none.
Surface retry preserves the mode; closing the page releases it.

## Current Ambient-fill Verification

All 133 Flat browser tests and client types pass. Existing shader-option tests
now also cover the derived fill, composition-gain compensation and restoration
of zero ambient in Full. Actual hardware-GPU
[proof](../../../.codex-tmp/flat-ambient-fill/gpu-proof.json) and
[captures](../../../.codex-tmp/flat-ambient-fill/no-atmosphere-with-fill.png)
verify a level camera over the ground. The bottom-quarter sample is black
without fill and RGB (2,9,0) with No atmosphere fill, versus (2,11,1) in Shader
off. All sampled ground pixels are visible but dim. Full restores physical
source intensities with ambient zero. The scene, light, shader handle and cache
construction remain identical through mode changes and time/elevation updates.
No atmosphere changes compile no new programs; the first Shader off uses the
same single direct-output program already documented below. The normal app
build and scoped formatting pass.

The [runner](../../../.codex-tmp/flat-ambient-fill/gpu-proof.mjs) suppresses only
the new fill for its zero-fill comparison; scene/cache/shader preparation is
real. Its first-intensity evidence is preserved separately: the uncompensated
No atmosphere fill produced white ground and is superseded by the compensated
result. Earlier star-only images and proofs remain unchanged. Standards review
remains owner-cancelled; no experiment or physical cache behavior changed.

## Retained Original Shader-options Qualification

Task baseline: commit 7b2a888f, before app implementation. Preexisting changes
are .prettierignore, agents/topics/flat/README.md and the two city JSON files,
plus transfer/. Preserve those changes. Review session root:
.codex-tmp/review-standards/session-9VBuAG. Topic-refresh reloads production
context and folder standards; calibration readiness reports PASSED. The prior
owner cancellation of engineering reviews remains in force, so no reviewer
was started and no standards-compliance claim is made. Primary owns checks.
The dome-cache experiment remains suspended and supplies no app runtime code.

Local application types pass. The final existing browser suite passes all
127 tests, covering scoped choices, renderer-independent retry, fixed Sun policy,
composition/direct rendering, localization/event relay, listener cleanup and
renderer-restoration failure. Task-owned files pass Prettier/curly and Git
whitespace checks. The required repository-wide formatting diagnostic reports
338 preexisting files; it did not format or modify those files. Normal Flat
application output was rebuilt successfully.

## Retained Original GPU Evidence

[Mode-switch proof](../../../.codex-tmp/review-standards/session-9VBuAG/gpu-proof.json)
and [Sun-facing/physical-update proof](../../../.codex-tmp/review-standards/session-9VBuAG/gpu-sun-proof.json)
exercise the actual built app on the hardware renderer, with no browser errors.
The [No atmosphere capture](../../../.codex-tmp/review-standards/session-9VBuAG/sun-no-atmosphere-2.png)
shows the visible solar disc at 100% with Sun illumination zero. Full restores
the physical scene lights. Mode switches retain the exact frame, cache lease
and shader handle; Full/No atmosphere do not compile new programs. First
Shader off compiles one direct-output program/two shaders; later switches reuse
it. Physical time/elevation updates legitimately replace observation lease
wrappers but keep the same canonical construction, scene and handle. The off
settings survive those updates, and returning to Full restores the newly
computed physical light intensities. The normal toolbar was visually inspected;
its added selector does not overlap the time controls. Generic workspace tool
rows now grow to fit wrapped controls without feature-specific host logic.

An initial GPU check exposed an unnecessary program change from hiding lights.
The implementation now keeps lights installed and scales their intensities,
retaining physical intensity baselines at publication and restoring them on
rollback. Earlier harness failures (Windows build destination and observation
lease identity comparison) are retained beside the final proofs. A final
rollback-error fix was checked by the 127-test run; it does not change the
GPU-verified happy path. No independent standards review was performed.

The owner has now selected a whole-repository checkpoint preserving these
shader options with the subsequent stellar, control and toolbar-design work.
The later [MUI migration verification](../component-refactor/mui-migration-execution.md#m4-final-handoff)
also covers the retained Sky-mode behavior. No publication was requested.
The suspended experiment and its evidence were not changed.
