# Sky, scene and elevation controls execution

Selected work: M1 only, authorized 2026-10-22 through independent-execution.
M2-M4 and video-scene presets are not selected. ARM and Sky Accuracy Dials remain
suspended. The [plan](sky-scene-controls-plan.md) owns the outcomes and later work.

## Current state

M1's runtime and coordinate foundations are complete. The new controls are not yet
exposed in the UI; M2-M4 remain unselected. The pre-edit baseline is
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

## Resumption boundary

M1 stops here. On owner selection of M2, expose the three-state sky control through
normal UI state/labels, explicitly disable unsupported legacy rectangular behavior,
and cover selected-mode propagation through all publication/restoration paths.
Preserve the local display-visibility limitation and its physical explanation.
M3 owns the object toggle and public elevation controls, pending-height selection
merges, complete frame-boundary camera/endpoint transactions and elevated renders.
M4 owns combined qualification and the bounded production review. No video scenes,
remote publishing or further numerical experiment was started.
