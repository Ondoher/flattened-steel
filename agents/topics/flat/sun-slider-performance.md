# Sun-position Slider Performance

Status: engine-owned observation updates no longer repeat full-profile hash
checks. The owner requested this change on 2026-11-08; implementation and
comparative verification are complete. The pre-change baseline is preserved below.

The baseline slider's input handler is quick. Most delay occurred in the retained physical
observation preparation path, especially synchronous construction-profile
serialization/hashing. Receiver lighting is another significant cost. Scene,
shader programs and the canonical scattering cache remain retained.

## Removal Of Repeated Profile Checks

Owner guidance: content created and owned by our constructors/services is
trusted when passed between internal collaborators or reused. Do not repeatedly
rescan, rehash or validate that generated content. Validate external inputs and
enforce physical/domain invariants when accepting actual changes. Generation,
cancellation and resource-lifetime checks address changing operational state;
they are separate from content revalidation. This principle also guides future
cleanup beyond the three profile checks removed here; this task has not audited
every remaining internal validation call.

The retained frame controller identifies observation profiles it constructs
against its own active cache. Those profiles no longer run full-content
validation after staging or at publication. The private retained facade update
also consumes the engine-created profile directly. This removes the three
profile rescans without introducing a runtime switch or accepting a caller flag
that bypasses validation.

External frame/configuration ingress retains full profile validation. Physical
constructor validation, supported-view checks, complete receiver/celestial
checks, cancellation/generation handling and the small live-frame identity
checks remain. The mutation regression still rejects a changed source position
through the live-frame identity. Staging consumers must treat owned physical
construction data as immutable. Initial profile content-identity construction
is unchanged; this change removes repeated checks of that identity.

Types for the engine and app, 18 frame lifecycle tests, 93 facade/shader-handle
tests, all 224 app browser tests and the normal production build pass. The
regression requires zero full-profile validation calls across owned observation
staging, retained facade updates and frame publication. Scoped formatting and
Git whitespace pass. Engineering standards reviewers remain cancelled.

The same real MUI pointer/GPU probe measures six warmed updates per mode:

| Mode | Before frame proxy | After frame proxy | Reduction |
| --- | ---: | ---: | ---: |
| Full, one view | 287 ms | 137 ms | 52% |
| No atmosphere, one view | 290 ms | 124 ms | 57% |
| Shader off, one view | 285 ms | 141 ms | 51% |
| Full, two views | 585 ms | 255 ms | 56% |

Every measured owned update has zero full-profile validation calls. The probe
matches requested timestamps, canonical construction identities, retained
program counts and receiver readback counts against the baseline. It creates
no shader programs or replacement canonical cache entries. No pixel or
receiver-radiance equivalence campaign was performed; the change removes pure
integrity rescans and leaves the numerical preparation/sampling code unchanged.

Current Full-mode runtime preparation is about 117 ms; remaining work includes
about 52 ms constructing the live profile (including its initial identity),
35 ms measuring receiver lighting, and other facade/publication work. This
change does not remove initial identity construction or the 30 GPU readbacks.

Current evidence is under `.codex-tmp/profile-hash-removal/`: `comparison.json`,
the current `report.json`, `gpu-profile` log/result, type/test/build logs and
the preserved starting patch/HEAD. The GPU probe took 69.3 seconds including
cold warm-ups, which are excluded from the latency medians. Disposable browser
profiles were removed. Historical measurements and evidence were not changed.

## Baseline Measurements

Measured the actual MUI pointer path in the current built app, Chrome 156 with
the NVIDIA RTX 2060/ANGLE D3D11 backend, at 1100×800. The scene uses San Jose
coordinates 37.33939, −121.89496, 5 m observer height and a fixed June 20, 2024
time reference. Each row is the median of six warmed updates; initial scene,
second-view cache construction and first mode use are excluded. Readiness waits
for preparation completion and scene-ready state. The frame proxy adds two
animation-frame callbacks; it is not physical display latency or a render-FPS
measurement.

| Mode | Input handler | Preparation/UI ready | Frame proxy | GPU readbacks |
| --- | ---: | ---: | ---: | ---: |
| Full, one view | 1.85 ms | 276 ms | 287 ms | 30 |
| No atmosphere, one view | 1.75 ms | 274 ms | 290 ms | 30 |
| Shader off, one view | 2.05 ms | 279 ms | 285 ms | 30 |
| Full, two views | 1.95 ms | 579 ms | 585 ms | 60 |

The generic snap resolver was below the timing resolution in these samples.
Warm measured edits create no new GL programs, compile no shaders and allocate
no replacement canonical scattering cache. Receiver reduction still creates
two small temporary 3D/array texture allocations per view per update, visible
in texImage3D/texStorage3D counts. These are small representative local sample sets;
other locations, dimensions and machines may change the timings.

## Where One Full-mode Update Spends Time

| Work | Median time |
| --- | ---: |
| Construct the live CPU physical profile | 55 ms |
| Three construction-profile integrity checks | 139 ms total |
| Measure and reduce receiver lighting | 42 ms |
| Other retained observation preparation, publication and draw submission | About 32 ms |
| Additional readiness/frame-proxy scheduling | About 19 ms |

The retained runtime preparation itself is about 268 ms. The three detailed
stages above are separate in the measured one-view timeline. The raw report
also times enclosing methods; those inclusive parent durations overlap and
must not be added to their children. Independently calculated medians do not
form an exact additive partition.

### Profile Construction And Hashes

[`prepareLocalObservation`](../../../src/algorithm32/implementation/local-sun/cache/frames/LocalSunFrameController.js:643)
derives a new live CPU profile for every accepted observation. Its
[`_createLiveProfile`](../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactConstructionProfile.js:344)
constructs new physical owners and another construction profile, including
topology/position metadata and a full content identity.

[`assert`](../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactConstructionProfile.js:317)
then recomputes that identity three times: at facade observation acceptance,
after frame preparation and immediately before publication. Each check is
roughly 46 ms in Full. The
[`identity input`](../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactConstructionProfile.js:93)
includes topology nodes, bands, rows, directions, positions and physical data,
even when most of those inputs are unchanged by a time edit.

[`CanonicalValueHash`](../../../src/algorithm32/value-identity/CanonicalValueHash.js:60)
recursively serializes the data, encodes it and calculates SHA-256 synchronously
in JavaScript. Warm-only CPU sampling identifies sha256Value as the largest
named function cost, followed by substantial canonical serialization/encoding.
This work occupies the browser's main thread.

### Receiver Lighting And Publication

[`_stageUpdate`](../../../src/flat/features/flat-earth/runtime/FlatEarthRuntime.js:599)
unconditionally prepares a new receiver-light measurement before staging the
retained observation update, including when the selected mode is Shader off.
The transport samples 32 hemisphere directions over 15 spectral channels;
sampling and GPU reduction each read back channel results, producing 30
synchronous GPU readbacks per view. In Full, about 24 ms of the 42 ms lighting
measurement is spent inside readPixels calls, including GPU synchronization.

[`FlatEarthSession._process`](../../../src/flat/features/flat-earth/FlatEarthSession.js:261)
serializes complete updates. New time requests coalesce while the current
complete frame is prepared, so the displayed Sun progresses in larger jumps
under continuous dragging. Main-thread hashing and GPU waits also delay
subsequent pointer processing. No explicit slider debounce accounts for the
quarter-second latency.

The baseline diagnosis selected repeated full-profile checking as the first
target; its removal is now complete above. Initial profile construction and
receiver GPU readback batching remain possible follow-ons, with no further
optimization selected by this task.

## Evidence And Boundaries

Generated evidence is under `.codex-tmp/sun-slider-profile/`:

- `report.json`: current built-bundle hash, environment, all measured updates,
  per-stage durations, GL counts and warm-only CPU aggregates.
- `summary.json`: medians grouped by mode.
- `final-profile.log` and `.result.json`: successful final execution.
- `profile.mjs`: transparent in-memory timing/count wrappers; no mocked
  physical calculations, skipped work or production source edits.

All 24 measured updates complete without page errors; the probe verifies one
runtime preparation per view for each update. Disposable profiles are removed
in finally; cookies/caches are not retained. Earlier harness failures are
preserved as failure-01/02.json. The preliminary successful report used a
DOM-only readiness check that could observe React's previous ready attribute;
its readyMs field is not valid latency evidence. The final probe waits for
runtime completion as well, and samples CPU only during warmed edits.

The [earlier control optimization](control-update-optimization-execution.md)
remains historical evidence. The baseline profiler changed no application
source; the subsequent owner-selected implementation above changes only
retained-update validation. No former evidence or contained experiment was
changed. Engineering standards reviewers remain cancelled; no compliance claim
is made.
