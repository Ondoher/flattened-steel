# Sky, scene and elevation controls execution

Selected work: all milestones M1-M4 including M1a, authorized through independent-execution.
M1 and M1a are checkpointed; M2-M4 are functionally implemented and qualified.
Production standards sign-off remains incomplete under stale global calibration.
Video-scene presets
are not selected. ARM and Sky Accuracy Dials remain
suspended. The [plan](sky-scene-controls-plan.md) owns the outcomes and later work.

## Current state

All requested controls are exposed: Full / No atmosphere / Shader off, independent
Sun percentages in No atmosphere, Objects On/Off, and 5/500/2000 m elevation.
Elevation changes reuse the installed cache, runtime, scene, camera and objects.
They update the physical eye, lighting and prepared view coherently. Full scene
replacement remains confined to geometry/source-family replacement.
The remaining-controls baseline is `.codex-tmp/review-standards/session-dqMRIJ/baseline.json`
at checkpoint b49d3740. The M4 governing review retains the earlier M1 baseline so the entire
controls unit remains in scope, including committed M1/M1a changes.
The M1a baseline is
`.codex-tmp/review-standards/session-sTAUst/baseline.json`; preceding plan edits
are present in that baseline. Review readiness still reports stale all-lane
calibration; source review remains batched at M4. The M1 pre-edit baseline is
`.codex-tmp/review-standards/session-oXe4fl/baseline.json`, at HEAD
9423a8543729b11044e3d9176b51289233187a7a. It includes the previously completed,
uncommitted transition-guard fix and planning documents; those are not attributed
to M1. Generated proof stays under `.codex-tmp/flat32-sky-scene-controls/`.
Production review readiness still reports stale all-lane calibration. No standards
reviewer has started; the plan batches source review at M4. This does not claim
compliance or authorize external governance changes.

## Decisions and findings

- The app has one canonical `skyRenderMode` selection: `full`, `no-atmosphere`,
  `shader-off`. Existing application `atmosphereShaderEnabled` and runtime
  `atmosphereEnabled` callers retain their Full/Shader-off mapping. The explicit
  mode wins when both are supplied. The UI now exposes the three canonical choices.
- The shared transport main hook is the common shader seam for distant and compact
  local view composition. A typed binding controls whether it evaluates atmospheric
  transport or supplies zero atmospheric radiance and unity view transmission.
  Geometric bounds, celestial generation, endpoint occlusion, color response and
  physical receiver illumination remain with their current owners.
- Both geometry adapters treat scene Y as height above ground, not an offset from
  the configured observer. Camera Y is height divided by the 1000 m/scene-unit
  scale; geometry and camera therefore receive the same height exactly once.
- Physical observer changes within the supported cache do not require a cache or
  scene rebuild. The controller reuses installed resources and stages only the
  new physical eye and matching view/receiver inputs. Geometry-family replacement
  uses isolated scene preparation. Location/time reconstruction retains independent
  selections; pending preparation cannot overwrite newer presentation choices.

## M1 evidence and disposition

The common shader seam is proven on RTX 2060 / Chrome Headless 155 / ANGLE D3D11.
In No atmosphere, the normal celestial compositor stays active while view transport
supplies zero atmospheric radiance and unity atmospheric transmission. Physical
receiver illumination, the existing display response and stellar filters remain.
No offline package or physical atmosphere was rebuilt or changed. Returning to Full
restores the ordinary path.

Actual captures at San Jose, 2024-06-21 07:00 UTC, 640 by 480 pixels and device scale
1 show Full on the left and No atmosphere on the right:

- [Distant scene comparison](../../../../.codex-tmp/flat32-sky-scene-controls/m1-02/spherical-distant-full-vs-no-atmosphere.png):
  stars remain visible against the black sky; the ground blocks the lower sky.
- [Compact local comparison](../../../../.codex-tmp/flat32-sky-scene-controls/m1-02/flat-local-full-vs-no-atmosphere.png):
  the atmospheric glow disappears while the finite Sun and physically lit objects
  remain. Their lighting was deliberately retained.
- [Local higher view](../../../../.codex-tmp/flat32-sky-scene-controls/m1-local-zenith-01/flat-local-full-vs-no-atmosphere.png):
  isolates the sky away from the finite Sun. The right side is practically black
  under the unchanged physical display settings; it is not a conspicuous star field.

Both Full images are pixel-identical to a pre-M1 source control at those settings:
maximum and mean encoded byte differences are zero. The control overlays the eight
M1-modified runtime/transport modules from HEAD 9423a854, while retaining other
modules including the preceding transition fix. It is not a complete historical
checkout. [GPU evidence and source identities](../../../../.codex-tmp/flat32-sky-scene-controls/m1-02/result.json)
retain this derivation and separate captures of restored Full.

### Physical height and cache support

The [six-combination coordinate witness](../../../../.codex-tmp/flat32-sky-scene-controls/m1-coordinates-01/result.json)
uses the actual production geometry and Algorithm32Bindings, not a repeated copy
of their formulas. It also checks the local view cone against its selected compact
profile. Every physical camera height equals the selected geometry height.

| Selected height | Camera scene Y | Distant enclosing altitude nodes | Local enclosing altitude nodes |
| --------------- | -------------- | -------------------------------- | ------------------------------ |
| 5 m             | 0.005          | 0–1,875 m                        | 0–250 m                        |
| 500 m           | 0.5            | 0–1,875 m                        | Exact 500 m node               |
| 2 km            | 2              | 1,875–3,125 m                    | 1,500–3,000 m                  |

All are inside existing support, with no height clamping or altitude extrapolation.
The local topology is unchanged by receiver elevation; observation/source placement
and view/receiver preparation still belong to the existing owners. Complete GPU
scene captures at the higher elevations remain M3 work, not evidence claimed here.

### Visibility limitation discovered

Geographic midnight does not produce a dark sky in this flat/local physical model:
its finite Sun remains above the surface horizon. The actual local staged frame
reports 2,727.721 lux total horizontal illuminance and 150.524 cd/m² stellar
adaptation luminance. The display uniform exactly matches that receiver illuminance
before and after the atmosphere switch; this is current physical lighting, not a
stale daylight frame.

The [additional GPU witness](../../../../.codex-tmp/flat32-sky-scene-controls/m1-local-stars-01/result.json)
reads the actual generated stellar index/palette with the actual scene-hit mask:
1,294 unoccluded pixels carry positive finite sums of the 15 existing boundary
spectral samples, with a maximum sum of 0.0011534675. This is an unscaled GPU
boundary-spectrum measurement, not a replacement sky render or final visible-star
count. Stellar generation remains ready/complete. The ordinary higher-view PNG
has only one nonzero RGB pixel at encoded value 1; most stellar signal is below
practical display visibility. An exploratory offscreen composer readback also
returned zero at its half-float output; it is not a pre-display spectral measurement
and does not supersede the explicit palette witness.

Disposition: the shader and height feasibility gate is established in both paths,
including positive local stellar inputs without atmospheric attenuation. A strong
local visual star-field claim remains unproven at the retained display settings.
M2 must retain this limitation visibly in its report. If the owner expects obvious
stars even with this physically bright local illumination, that requires an
explicit presentation-policy decision; this milestone does not invent a star gain,
replace the physical model or redesign adaptation.

### Ownership for subsequent implementation

| Concern                                                   | Owning integration point                                                                             |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Canonical selection and old boolean compatibility         | Flat32SceneControls; application state always supplies skyRenderMode and unit-bearing observerHeight |
| Height, camera and endpoint preparation                   | ModeController invalidation; application preparation/rollback callbacks; geometry adapters           |
| Atmospheric view radiance and transmission                | Algorithm32Transport, controlled by presentation.atmosphericViewEnabled                              |
| Distant render selection and mutable camera bindings      | Algorithm32Runtime                                                                                   |
| Compact per-frame bindings and retained physical lighting | LocalSunFramePreparer and existing complete-frame owner                                              |
| Sun, stellar generation and physical/scene occlusion      | Existing geometry, celestial generation and screen-palette consumers                                 |
| Exposure, color and human filters                         | Existing Color Reset P2 and filter owners; unchanged                                                 |

### Verification and cost

- 682 Algorithm32 specs pass, including the new transport control.
- 52 browser cases pass; the separate full production-cache acceptance case remains
  excluded from the basic lane. Cases cover compatibility, all three height
  mappings, state preservation, same-kind height invalidation/rollback and normal
  mode transactions.
- Both local type checks pass. Fresh app/Worker and browser bundles build.
- Final type checks, app/Worker and browser builds, all 52 selected browser cases,
  repository formatting and patch whitespace checks pass. The
  [local checkpoint receipt](../../../../.codex-tmp/flat32-sky-scene-controls/m1-checkpoint.json)
  records the resulting commit identity and whole-repository scope; no remote push
  is authorized. It includes the preceding transition fix already in the baseline.
- GPU setup-to-ready observations were about 14.5–19.5 seconds for the main four
  captures. These include shader setup, data preparation and receiver work, and
  reuse OS/browser caches; they are not isolated cache-build or rendering benchmarks.
- Baseline/current Full captures, failed capture diagnostics and repair attempts
  remain separate. The scratch entry first returned an unserializable diagnostic;
  narrowing its output repaired reporting without a production algorithm change.
  A later browser invocation selected no cases after app build invalidated the
  test bundle; rebuilding the browser group repaired the runner order.
- Algorithm32Runtime already exceeds the 1,000-line source warning threshold;
  M1 adds a narrow integration seam, rather than an unrelated runtime refactor.

Production source review remains batched at M4 and incomplete under current stale
calibration. Checkpoint advice recommends a coherent intermediate local commit;
that advice does not establish standards compliance.
The final callable checks preserve explicit boolean rejection in the existing
setters. They do not change the valid Full/No-atmosphere GPU paths captured above;
those unchanged valid-path captures are reused rather than rerendered for a
validation-only edit.

## M1a implementation, evidence and disposition

M1a separates Sun illumination and visible disc radiance in No atmosphere.
Both fractions are finite 0-1 values and default to one. The runtime retains them
through other sky modes; Full and Shader off use ordinary physical lighting.
Application state/configuration and `setSunPresentation` carry the choices, but
native UI controls remain M2 work.

### Decisions and ownership

- `Flat32SceneControls` owns acceptance. Application/controller state retains the
  latest independent choices through location/time reconstruction and pending
  publication; presentation fractions are excluded from physical runtime identity.
- `LocalSunSceneLighting` retains the unscaled renderer intensity of each existing
  Sun-owned direct and diffuse light. Its reversible scale touches no unrelated
  lights or shadow-map allocation. Physical lighting updates and rollback use the
  newest presentation fraction rather than restoring stale effective intensities.
- Algorithm32's `setReceiverLightPresentationScale` scales live receiver lux,
  luminance and stellar-adaptation bindings. The existing exposure calculator and
  Color Reset/filter policy consume those effective inputs. Physical receiver
  packets, public physical measurement getters and source brightness remain intact.
  This app's receiver measurement represents its Sun-derived illumination; no new
  decomposition of lighting or replacement display model was introduced.
- The shared `CelestialScreenPaletteConsumerShaderContribution` multiplies only
  Sun-disc radiance. Existing stellar source intensities and physical occlusion
  remain. Disc brightness does not feed receiver measurement/adaptation. Normal
  display adaptation can still alter its final encoded appearance; this is an
  independent radiance fraction rather than a promise of constant screen pixels.
- The real context-restoration check exposed an existing local publication failure:
  `Scene renderer is not running.` `ThreeSceneRuntime` now permits complete
  publication during its restored-context boundary before animation resumes, while
  continuing to reject publication into a lost or stopped context. The regression
  case verifies publication precedes resumed rendering.

### GPU appearance and measurements

The [main GPU proof](../../../../.codex-tmp/flat32-sky-scene-controls/m1a-04/result.json)
uses hardware RTX 2060 / ANGLE D3D11 / HeadlessChrome 112 at 640 by 480, device
scale one. Both geometries use San Jose at 2024-06-21 07:00 UTC with the same
observation, view, source definitions and existing display/filter policy.
Full and default No atmosphere are pixel-identical to M1 controls: maximum byte
difference zero in all four comparisons. The control overlays changed production
JavaScript from checkpoint d3f41bd5; it is not a full historical checkout.

The [local scene comparison](../../../../.codex-tmp/flat32-sky-scene-controls/m1a-04/flat-local-illumination-comparison.png)
shows 100%, 10% and 0% illumination from left to right, with disc radiance at 100%.
The Sun remains drawn as scene lighting is removed and existing stars become visible.

| Local illumination | Physical receiver lux | Effective lux | Effective stellar adaptation, cd/m² | Nonblack sky pixels outside the disc |
| --- | --- | --- | --- | --- |
| 100% | 2727.7211 | 2727.7211 | 150.5237 | 0 |
| 10% | 2727.7211 | 272.7721 | 15.0524 | 2 |
| 0% | 2727.7211 | 0 | 0 | 103 |

Pixel counts describe the top 200 screenshot rows, excluding a small box around
the recorded disc center; they are not star counts. At zero illumination all 103
positive pixels exceed five encoded byte levels. Raw stellar adaptation remains
150.5237 cd/m². The normal night-adaptation floor remains inside the display model.
The [derived observations](../../../../.codex-tmp/flat32-sky-scene-controls/m1a-observations-01/observations.json)
authenticate unchanged stellar source/view identities and physical measurements.
Palette-generation identity changes normally when effective adaptation changes;
unchanged source intensity does not mean the filtered palette must have identical
bytes. No stellar gain or replacement stars were added.

The [disc comparison](../../../../.codex-tmp/flat32-sky-scene-controls/m1a-observations-01/flat-local-disc-comparison.png)
holds illumination at zero and uses 100%, 0.001% and 0% disc radiance. A zero
disc-radiance setting retains the Sun body's existing occlusion. The
[distant night comparison](../../../../.codex-tmp/flat32-sky-scene-controls/m1a-04/spherical-distant-illumination-comparison.png)
is unchanged across illumination fractions because that observation already has
zero physical Sun illuminance. Neither geometry reports a GL or render error in
the accepted main proof. The default cache package identity remains unchanged.

Main setup-to-ready observations were 8.6-14.4 seconds, with warm-cache and shader
reuse differences. These are setup observations, not a cache-build or frame-rate
benchmark. Source changes require no cache package rebuild; a changed adaptation
can trigger the ordinary stellar palette regeneration.

### Verification and recovery

- Full Algorithm32 lane: 683 specifications pass in 137.4 seconds. The two affected
  shared celestial-consumer cases also pass after the final compositor connection.
- Final browser lane: 55 cases pass; the separate full production-cache acceptance
  case remains excluded from the basic lane. New checks cover independent fractions,
  physical/effective separation, pending selection preservation, invalid input,
  unrelated lights, measured lighting rollback and restored-context publication.
- Both local type checks and fresh app/Worker and browser builds pass.
- Failed GPU helpers are preserved separately: an absent diagnostic source lookup,
  an oversized/unserializable resource diagnostic, and an initial connection to an
  inactive legacy Sun consumer. The shared active consumer now owns disc scaling.
  Main proof JSON is accepted; its PowerShell host reported a nonzero wrapper status
  alongside a Puppeteer stderr warning, with no recorded proof/GL/render error.
- The first lifecycle run preserves the real context-restoration failure above.
  The [corrected lifecycle proof](../../../../.codex-tmp/flat32-sky-scene-controls/m1a-lifecycle-02/result.json)
  exits successfully: both restored geometries retain zero illumination and 20%
  disc radiance, with no GL/render errors. Shader off is pixel-identical to M1 in
  both geometries, and re-entering No atmosphere restores the retained fractions.
  Observed restoration times are 3.7 seconds local and 9.2 seconds distant, including
  ordinary resource regeneration; these are not cache-build benchmarks.
- The lifecycle proof's distant case is San Jose at 2024-06-21 20:00 UTC, looking
  toward the Sun. Its physical receiver measurement is 117331.3567 lux while the
  effective display input is zero. The
  [actual restored daylight view](../../../../.codex-tmp/flat32-sky-scene-controls/m1a-lifecycle-02/spherical-distant-restored-context.png)
  shows the retained disc and existing stars. Hardware/software match the main GPU
  proof; browser tests separately use Chrome Headless 155.

Production source review remains the single stable M4 unit and is incomplete;
current calibration readiness still prevents standards reviewer startup. This
milestone does not claim standards compliance. The checkpoint adviser recommends
this coherent functional unit. The
[local checkpoint receipt](../../../../.codex-tmp/flat32-sky-scene-controls/m1a-checkpoint.json)
owns its exact commit identity, whole-repository scope and checks; no remote push
is authorized. It includes the preceding accepted M1a plan revision. Source review
and native UI controls remain deferred to their planned milestones.

## M2 - Native sky and Sun controls

Implemented the native three-state Sky selector, independent percentage inputs
visible only in No atmosphere, retained values and selected-state reporting.
Objects uses an actual boolean pressed-state button; elevation uses a native
select. Existing boolean application/runtime callers retain their Full/Shader-off
mapping. The legacy rectangular local mode exposes No atmosphere and live
elevation as unavailable; it remains usable in Full and Shader off. When that
legacy destination is selected by configuration, the geometry switch is disabled
in No atmosphere with guidance to choose Full or Shader off first.

The [local UI capture](../../../../.codex-tmp/flat32-sky-scene-controls/m234-04/flat-local-controls-stars.png)
shows actual existing stars at zero Sun illumination with a retained 20% disc.
The [distant UI capture](../../../../.codex-tmp/flat32-sky-scene-controls/m234-04/spherical-distant-controls-stars.png)
shows the same native controls. Both use San Jose, 2024-06-21 07:00 UTC,
800 by 600 pixels, device scale one and the existing catalog/filter policy.
The scratch initial-state seeding explicitly labels that observation; early
`m234-02` UI images inherited an incorrect location label from the older proof
helper and are not the final UI evidence.

An actual publication defect was corrected: a later compact frame could reinstall
Algorithm32 rendering after Shader off had been selected. Complete local frame
publication now uses the same selected-render-operation owner as initial
publication. Native controls do not recreate numerical caches when sky or Sun
presentation changes.

## M3 - Object visibility and cache-reusing elevations

Objects Off hides all six review boxes, removes their depth bounds and shadows,
and retains ground, lights and reversible object resources. Shadow maps refresh
on visibility changes. The view's live scene diagnostics follow the accepted
visibility/lighting selection.

- [Local objects and shadows, On then Off](../../../../.codex-tmp/flat32-sky-scene-controls/m234-04/flat-local-objects-comparison.png).
- [Distant objects and shadows, On then Off](../../../../.codex-tmp/flat32-sky-scene-controls/m234-04/spherical-distant-objects-comparison.png).
- [Local 500 m](../../../../.codex-tmp/flat32-sky-scene-controls/m234-04/flat-local-height-500-8.png) and
  [2 km](../../../../.codex-tmp/flat32-sky-scene-controls/m234-04/flat-local-height-2000-10.png).
- [Distant 500 m](../../../../.codex-tmp/flat32-sky-scene-controls/m234-04/spherical-distant-height-500-24.png) and
  [2 km](../../../../.codex-tmp/flat32-sky-scene-controls/m234-04/spherical-distant-height-2000-26.png).

### Owner clarification and verification

The owner clarified that elevation must not require a cache or scene rebuild.
The [independent coordinate/cache witness](../../../../.codex-tmp/flat32-sky-scene-controls/height-cache-reuse-01.json)
executes production bindings with the same installed 5 m geometry at all three
camera heights. Model-space heights are exactly 5, 500 and 2000 m in both
geometries. All three local live profiles have the same cache content identity
and the same canonical construction identity. Observer height is a sampling
position, not a different atmosphere or source field.

The initial broad scene-replacement path, retained in `m234-02` evidence, was
replaced for elevation-only requests. The
[GPU reuse witness](../../../../.codex-tmp/flat32-sky-scene-controls/m234-04/result.json)
checks object-reference identity, not just equal labels: runtime, scene, accepted
camera, endpoint owner, every surface mesh, and local construction-cache object
or distant shared attachment remain the same through 5 -> 500 -> 2000 -> 5 m.
The local controller leases its existing canonical field; no second construction
cache is built. The distant runtime uses the installed shared package.

Only observer-dependent state is prepared. Distant preparation updates physical
geometry/receiver lighting and moves the existing camera at the frame boundary.
Local preparation reuses the field and scene while preparing the matching view,
receiver and celestial packet. Its observer dome and finite-star observer inputs
are currently part of shader preparation, so a previously unseen local elevation
can still incur shader/view work. That is a remaining performance limitation,
not a cache rebuild. View depth bounds follow the actual camera and visible
endpoints rather than retaining the original 5 m horizon cap.

Ground and boxes remain surface-anchored, yaw/pitch remains unchanged, and accepted
labels stay with the displayed frame during preparation. New sky/Sun/object
choices survive acceptance. Superseded work cannot publish. A failed preparation
restores the accepted physical selection while retaining newer presentation
choices. Full isolated scene/camera staging is retained only for geometry/source
family replacement, with pointer-look rebound to the accepted camera.

### Measured cost and scope

On RTX 2060 / ANGLE D3D11 / HeadlessChrome 112, the final height matrix observed:

| Update | Distant | Compact local |
| --- | --- | --- |
| First 500 m | 0.23 s | 10.68 s |
| First 2 km | 0.23 s | 13.30 s |
| Return to 5 m | 0.23 s | 1.12 s |

These are request-to-settled-frame observations including renderer warmup and
readiness polling, not isolated cache-build or frame-rate benchmarks. The local
delay is retained as an optimization opportunity; it does not justify rebuilding
the cache or scene. Runtime GPU object counts settle across elevation changes.
The first Shader-off use lazily retains the existing direct-display resources;
that one-time allocation is distinct from unbounded growth.

## M4 - Combined qualification and handoff

Both supported geometries pass the bounded hardware matrix: native sky modes,
all three physical heights, objects On/Off, independent Sun choices during pending
height changes, rapid supersession, daylight/night views and twilight smoke.
Matched Full night captures have maximum encoded byte difference zero from the
pre-M2 checkpoint b49d3740, using the changed-module overlay documented by the
GPU runner. This is a controlled source overlay, not a full historical checkout.
The distant package identity remains
`8d185961cab8beb1e461cd1256be2875bb9a99e9f39e515b9288b92e5d2f6d37`.
No atmosphere, cache-format, source spectrum or stellar-intensity parameter changed.

The [final lifecycle proof](../../../../.codex-tmp/flat32-sky-scene-controls/m4-03/result.json)
also verifies failed preparation at 500 m, retained independent choices, actual
context loss/restoration, repeated mode cycles, location changes, geometry
replacement and resizing. Context loss legitimately recreates lost GPU resources;
it is separate from ordinary elevation changes. This final repeat includes the
dynamic depth-bound correction. The earlier `m4-01` remains evidence of the first
successful lifecycle run. `m4-02` stopped before browser startup because the app
build was replacing the Worker file; running against the completed build repaired
that runner-order error without a production source change.

The full Algorithm32 lane passes: 683 specifications, zero failures, 220.9 seconds.
The final selected browser run passes 59 cases (the separate full-cache case is
excluded from that basic lane), including the added cache-identity case. Final
app/Worker and browser bundles build. Both application type checks and the
maintained The Hours caller type check pass. The final full-cache browser lane
passes **all 60 cases**, including the legacy rectangular rendering, native
controls, mode replacement, resize and restoration acceptance, in 151.5 seconds
(`.codex-tmp/review-standards/session-dqMRIJ/browser-tests-full-04.log`). Initial
attempts omitted the proxy or used a URL root that did not match Karma's nested
application path; the root-containment check correctly rejected those inputs.
The first fully configured run completed real rendering, mode replacement, resize
and restoration but exposed stale harness expectations: the prior Sun coverage
policy id, button text on the new select, and immediate requested labels before
frame acceptance. Assertions now check the current v2 policy, actual selected
value, and accepted labels before publication plus new labels after publication.
The corrected full case passes; no production failure was hidden by loosening
its rendering, pixel, cache, resize or restoration checks.
Existing capture and
The Hours callers were adapted only for the changed control/controller contracts;
no video scene preset was added and no film was rerendered.

Primary self-review covers resource reuse, failure ownership, current/pending state
merges, actual coordinates and legacy availability. Required production standards
review remains **INCOMPLETE**: final host preparation of the complete M1-M4 unit
reports `Stale all-lane calibration; prepare again` in
`.codex-tmp/review-standards/session-dqMRIJ/prepare-host.log`. No standards reviewer
was started, and tests do not establish standards compliance. No global governance
files were repaired or waived. Checkpoint advice is separate from that limitation.
The adviser recommends `feat(flat32): add sky scene and elevation controls` for
the complete coherent unit. The
[local checkpoint receipt](../../../../.codex-tmp/flat32-sky-scene-controls/m234-checkpoint.json)
owns the resulting commit, exact scope and final worktree state; no push is
authorized. Repository formatting and patch whitespace checks pass. Initial
PowerShell/nested checkpoint attempts were denied writes to Git objects. Direct
approved host staging through `cmd.exe` with login disabled succeeded without ACL
changes. That establishes the working launcher, not the precise cause of the
earlier denial; no application repair or scientific rerun was required.

Geometry/source-family replacement temporarily overlaps old and candidate scene,
composer and shadow resources so the accepted frame remains usable. Elevation
does not duplicate the scene or construction cache. Renderer counts are object
counts, not a driver VRAM measurement; no new device-memory ceiling was imposed.

## Remaining boundary

Functional M1-M4 work and local qualification are complete. The remaining
production compliance dependency is external reviewer calibration. Once repaired,
prepare the complete controls review from the preserved M1 baseline and run only
the affected mapped lanes; do not relabel old reviews or claim current compliance.
Video presets, remote publication and further numerical experiments remain deferred.
ARM and Sky Accuracy Dials remain suspended.
