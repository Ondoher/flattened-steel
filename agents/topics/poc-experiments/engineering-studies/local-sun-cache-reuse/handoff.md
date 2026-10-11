# Local-Sun Cache Reuse Successor Handoff

Handoff date: 2026-10-11. Follow the minimal reload sequence in
[active-topic.md](../../../active-topic.md). Announce this topic and its focus.
The [status](status.md) owns current disposition; the [plan](plan.md) owns
execution requirements. This document routes resumption without duplicating
the detailed measurement records.

## Where Execution Stopped

P0–P5, P5-Celestial and selected follow-ups are delivered. No render job remains;
the heavy-execution lock and latest capture's browser profile are absent.
P6 recording, P7 closure/suspension, promotion and publication remain unselected.
Do not infer recording authorization from earlier independent-execution requests:
the owner explicitly selected a stop before generating the video.
The experiment is still the governing topic and has not been formally suspended.

The current task is an owner-selected whole-repository checkpoint. Prior
questions about iPhone FOV, possible color/FOV presets and close-up sunset
gradients were informational. They select no new experiment, preset,
implementation or render.

Before any new implementation, read [design](design.md), experiment-local
[instructions](../../../../../experiments/local-sun-cache-reuse/AGENTS.md), the
relevant owning records below and the actual selected plan phase. Refresh
reviewer readiness/context through review-standards; do not assume old agent
handles, receiver processes or readiness transfer to a new session.

## Evidence Entry Points

All run paths below are relative to `tmp/experiments/local-sun-cache-reuse/runs/`.
Owners retain physical parameters, derivations, parent inventories and limits.

| Claim/work | Read first | Principal evidence |
| --- | --- | --- |
| Inherited math versus flat/local assumptions | [Abstraction inventory](abstraction-inventory.md), [current evidence policy](reference-method.md#current-evidence-policy) | Hashed inventory sources; no absolute-error claim |
| Selected layout and acceptance contract | [P3 contract](p3-contract.md) | `00478-p3-contract` |
| Compact layout and six empty-band omissions | [P3-C qualification](p3-layout-qualification.md) | `00519-p3-layout-report` |
| Admitted horizontal movement/reuse | [P3-D movement](p3-movement.md) | `00538-p3-move-report` |
| Candidate disposition and in-app construction | [Disposition](p3-disposition.md), [P4 application](p4-application.md) | P4 lifecycle report plus final P5 report |
| Ten exact-time sky/colored-scene pairs | [P5 qualification](p5-qualification.md) | `00639-p45-app-report/result.json`; 1,200 matched states |
| Original celestial integration | [P5-Celestial delivery](p5-celestial.md), [design basis](p5-celestial-design.md) | `00675-celestial-report/result.json`, combined parent `00674-p5-celestial` |
| Current stellar adaptation and ray termination | [Human vision](celestial-human-vision.md), [boundary correction](celestial-boundary-correction.md) | `00704-p5-celestial`, `00706-p5-celestial`, `00712-p5-celestial` |
| Contained Sun coverage correction | [Disc correction](sun-disc-correction.md) | Focused overlap proof and subsequent captures linked by owner |
| Optional overhead-calibrated radius | [Sun-size calibration](sun-size-calibration.md) | `00723-sun-size-proof/result.json`, GPU `00721-p5-celestial` |
| Union Glacier central-view image | [Central-view capture](central-view-capture.md) | `00725-p5-celestial/flat-180-combined.png` |
| Latest spherical/distant comparison | [Spherical sunset capture](spherical-sunset-capture.md) | `00733-globe-sunset/san-jose-sunset.png` |

The short 00674 preview is two seconds/24 frames at one physical state with a
small camera pan. It is not the P6 full-orbit film. P0/P1's original solstice
film clock is historical; use December 14, 2024 for current film derivation.
P5's `00610-p5-coverage` proves 1,801 future camera/source states under its recorded
support policy, but does not qualify the finished observatory/celestial film.

Recorded CLEAN review receipts live under `.codex-tmp/review-standards/`:
P3-C `session-N3K216`, P3-D `session-P0m3QN`, combined P3-E–P5
`session-przBnI`, initial celestial `session-OL6CBp`, corrected boundary
`session-fRGqrh`, calibration `session-IWnZ82`, central view `session-tH8W5P`
and latest spherical capture `session-LNzZAs`, each `validation.json`.
Other follow-ups have separate receipts linked by their owners. These retain
their frozen scope. Do not relabel them with new fingerprints or treat them as
fresh validation of this handoff. Declare/capture a new implementation unit
before changes; its required primary/audit evidence must validate before closure.

## Current Choices And Assumptions

- Current display is p2; human-vision stellar presentation uses the globe's
  shared luminance/color filters with actual receiver adaptation. Plain Bruneton
  captures remain separate comparisons, not the current default.
- The current stellar roster uses the shared 2,000-star production catalog.
  Flat-star placement follows the owner-confirmed design notes. Shared celestial
  consumption applies the ordinary view ray's accumulated transmission once
  at termination, then combines boundary light with atmospheric path radiance.
  Do not restore the superseded full-slab star transmission override.
- Fixed 16-mile Sun radius remains the default. Optional overhead calibration
  uses `radius = sourceHeight * sin(meanRealAngularDiameter / 2)` with
  1919 arcseconds; at 3000-mile height it is about 13.95531 miles. The optional
  mode preserves source power/reference irradiance. See its owner for details.
- Current still captures use 1024×768. Optional `human-central` FOV is 60°
  horizontal, approximately 46.82645° vertical at 4:3. Standard still FOV remains
  70° vertical. The film retains the original camera score/FOV; the central-view
  trial does not replace that choreography.
- Black physical ground, disabled ozone, a homogeneous flat medium, finite
  local source and finite atmospheric view boundary are explicit assumptions.
  Visible ground/material reflectance is separate from atmospheric ground bounce.
- Warm lower-band color and far-Sun color are accepted as defensible under the
  model. The Flat180 source trace has an analytic comparison, not a completed
  dedicated measurement. Positive stellar spectra can remain almost invisible:
  Union Glacier's measured adaptation is about 31.1 cd/m², above the low-light
  boost threshold. Do not force stars to appear by arbitrary brightness changes.
- Defensibility and consistency are the selected evidence depth. Error bars,
  gray-horizon diagnosis, ozone/reflective-ground changes and shared-value build
  optimizations are deferred. Sky Accuracy Dials is suspended and informative
  only; compensating-error findings do not authorize a new model change.

## Source And Reproduction

Use authored source, not an old generated `bundle.js`, as the resumption base.
Source entrypoints under `experiments/local-sun-cache-reuse/`:

- `run-celestial.js`, `celestial-browser.js`, `bruneton-sun-variant.js`: selected
  captures and contained bundle adapters.
- `shell-client.js`, `shell-celestial.js`, `celestial-proof.js`: cache/frame and
  celestial integration. Read the owning design before changing transmission.
- `sun-size.js`, `prove-sun-size.js`, `sun-coverage/correction.js`: optional size
  policy and experimental coverage correction.
- `run-globe-sunset.js`, `globe-sunset-browser.js`: latest ordinary production
  comparison. Its host bundles the production module worker and serves the
  selected shared-service assets without modifying production application code.
- `run-resource-bounded.js`, `resource-monitor/`, `ExperimentRun.js`: guarded
  launch, JavaScript telemetry, run allocation and finalization.

These are reproduction commands, not instructions to launch another job now:

```powershell
npx --no-install tsc -p experiments/local-sun-cache-reuse/jsconfig.json
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- run-celestial.js --stage=p2-human-scene-180 --sun-size=overhead-calibrated --fov=human-central
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- run-globe-sunset.js
```

The spherical sunset owner records its actual published observation and worker/
asset identities. Waiting for a UI label alone previously captured the wrong
state; verify actual published observation and actual camera before accepting.

## Next Execution Boundary

When the owner selects P6, follow the full film plan in this order:

1. Read the original [The Hours adapter](../../../../../scripts/flat32/the-hours/README.md)
   and pinned read-only D-drive film inputs. Prepare an experiment-owned replay
   with a hashed scene-equality manifest: deterministic seed, assets, geometry,
   transforms, materials, portals, camera score, shadows and presentation.
2. Derive Union Glacier's December 14, 2024 Flat180 start instant and increasing
   24-hour clock through Flat540. Preserve original Sun-relative camera rules;
   do not repeat modulo-angle requests that jump the date backward.
3. Recheck current scene endpoints, celestial inputs and full trajectory support
   against the existing P5 coverage evidence. Reuse within its admitted domain;
   otherwise await a compatible exact-state rebuild. Never clamp, hold a frame
   or silently alter visual terrain/physical ground to make the replay fit.
4. Deliver the scene-composition still, low-resolution orbit preview and short
   wrap/replacement checks. Freeze the film recipe, including explicit Sun-size
   mode and media/temporal gates. Calibrated size is optional; no global default
   change or film-specific calibrated-radius selection has been made.
5. Preserve the original scene's one shared 4096² shadow map and one-second
   diffuse/adaptation samples with cubic interpolation. Sky/direct Sun/source
   positions remain exact-time. Keep unsmoothed diagnostics separate.
6. Record 1024×768, 30 fps, 60 seconds, 1,800 distinct ideal states plus a separate
   lossless Flat540 endpoint. Verify decoded media, trace and provenance; deliver
   native video, review copy and milestone stills. This is offline capture, not
   proof of live 30 fps. Owner film review precedes P7 disposition.

P6 is not yet implemented or executed. It requires its own authored adapter,
review baseline and completion evidence. Production adoption remains separate.

## Boundaries And Operational Discipline

Writes: authored source under `experiments/local-sun-cache-reuse/`, documentation
in this topic, generated evidence under `tmp/experiments/local-sun-cache-reuse/`.
Review artifacts use the existing `.codex-tmp/review-standards/` lane.
Production, other experiments, sealed runs, archives and `D:/flattened-steel`
remain read-only. Preserve unrelated worktree changes; do not reset them.

JavaScript implementation/tooling is required; Python may support suitable tasks.
No C#/native-executable exception exists. Pre-existing native-helper edits must
remain untouched and unexecuted. No experimental unit-test suite/framework is
allowed; use focused self-verifying proof runners.

Default heavy controls: 8 GiB free-memory reserve, 8 GiB aggregate owned-process
ceiling, ten-minute job limit and one heavy job at a time. Previous phase-scoped
6 GiB exceptions expired. Give each diagnostic a question, invariant, bounded
domain, discriminator and stop condition; avoid automatic resolution escalation
or overnight sweeps. Keep monitorable progress and clean up owned processes.

Allocate a new immutable run; never reopen an old one. Preserve parent hashes,
schemas, source/tool identities, parameters and derivation operations. Keep PNGs/
native video and compact reproduction information, not HTML galleries or complete
Chrome profiles. Run finalization uses `ExperimentRun.finish`, not an invented
seal API; retain declared path/reparse checks and the five-digit allocation rule.

The [status](status.md#next-action) records the owner's checkpoint selection and
the retained native-helper boundary. Use end-experiment only if the owner ends
or suspends the lane; standards
restoration provenance is owned by [status](status.md#standards-restoration-provenance).
