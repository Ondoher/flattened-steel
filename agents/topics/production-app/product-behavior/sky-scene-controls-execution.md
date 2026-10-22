# Sky, scene and elevation controls execution

Selected work: M1 and subsequently M1a, authorized through independent-execution.
M1 is checkpointed; M1a implementation and verification are complete. M2-M4 and video-scene presets
are not selected. ARM and Sky Accuracy Dials remain
suspended. The [plan](sky-scene-controls-plan.md) owns the outcomes and later work.

## Current state

M1's runtime and coordinate foundations are complete. The new controls are not yet
exposed in the UI. M1a's independent No-atmosphere Sun illumination and
disc-brightness controls are implemented and GPU-verified; M2-M4 remain unselected.
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
  mode wins when both are supplied. The existing two-state UI remains until M2.
- The shared transport main hook is the common shader seam for distant and compact
  local view composition. A typed binding controls whether it evaluates atmospheric
  transport or supplies zero atmospheric radiance and unity view transmission.
  Geometric bounds, celestial generation, endpoint occlusion, color response and
  physical receiver illumination remain with their current owners.
- Both geometry adapters treat scene Y as height above ground, not an offset from
  the configured observer. Camera Y is height divided by the 1000 m/scene-unit
  scale; geometry and camera therefore receive the same height exactly once.
- Physical observer changes must invalidate endpoint preparation within the same
  geometry kind. The controller stages camera/endpoints together and restores both
  through the existing rollback callback. Location/time state reconstruction must
  retain independent selections.

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

## Resumption boundary

M1 and M1a's implementation, appearance and lifecycle proofs are complete;
the linked checkpoint receipts preserve their local commit identities. M1's
physical lighting and visibility findings remain the baseline, rather than being
relabeled as a physical defect.

After M1a, on owner selection of M2, expose the three-state sky and Sun controls through
normal UI state/labels, explicitly disable unsupported legacy rectangular behavior,
and cover selected-mode propagation through all publication/restoration paths.
Retain the M1 limitation as baseline evidence and qualify M1a's presentation behavior
separately; do not relabel the physical baseline as defective.
M3 owns the object toggle and public elevation controls, pending-height selection
merges, complete frame-boundary camera/endpoint transactions and elevated renders.
M4 owns combined qualification and the bounded production review. No video scenes,
remote publishing or further numerical experiment was started.
