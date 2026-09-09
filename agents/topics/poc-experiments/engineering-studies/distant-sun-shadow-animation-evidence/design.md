# Distant-Sun Shadow Animation Evidence Experiment Design

## Objective

Adapt the standard San Jose box scene and its shadow lighting to the GPU-resident distant-Sun animation renderer, beginning with a single 55-degree-FOV view two hours before sunset aimed toward the sunset position.

## Acceptance Question

Can the standard San Jose boxes and production shadow lighting be reproduced in the cache-backed renderer so that a verified native-4K still at two hours before sunset clearly shows the scene, its directional shadows, and the future sunset direction at a 55-degree vertical field of view?

## Isolation Boundary

Authored experiment work remains below `experiments/distant-sun-shadow-animation-evidence/`. Generated output remains below `tmp/experiments/distant-sun-shadow-animation-evidence/`. Production and other experiment trees are read-only inputs unless their write scope is separately authorized.

## Output and run rules

- The experiment source root is `experiments/<slug>/`. Authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests belong there.
- The generated-output root is `tmp/experiments/<slug>/`. Builds, caches, browser profiles, reports, captures, diagnostics, renders, logs, progress records, temporary files, and other generated intermediates belong only there and must remain ignored by Git.
- Derive repository, source, and output roots from the location of a checked-in repository marker rather than `process.cwd()`.
- Real-path-check every read and write boundary. Reject symlinks, junctions, reparse points, and any resolved path outside its declared root.
- Use a new `runs/<run-id>/` directory for each evidence-bearing execution. Never overwrite or reopen a completed run. Copy or derive reused material into the new run and retain its source identity.
- Record the command, inputs, relevant configuration, implementation revision or hashes, tool/runtime versions, environment facts that affect the result, parent artifacts, derivation operation, and resulting artifact identities.
- Finalize a run with an explicit terminal state: `accepted`, `rejected`, `failed`, or `interrupted`. Publish its terminal manifest only after all artifacts are closed and hashed.
- A verifier may read the run it validates but must not mutate it. Corrections and retries create a new run.
- Keep production and other experiment trees read-only during experiment execution unless the engineer explicitly expands the write scope.

## Monitorable progress

Every operation expected to run longer than one minute writes UTF-8 JSON Lines to:

```text
tmp/experiments/<slug>/runs/<run-id>/progress.jsonl
```

Append one event at process start, every phase transition, at least once every 30 seconds while active, and at terminal completion or failure. Flush each event so another process can tail the file while the operation runs. Each event contains:

```json
{
	"timestamp": "2026-09-04T12:00:00.000Z",
	"phase": "compute",
	"completed": 24,
	"total": 100,
	"message": "Processing sample batch 24 of 100."
}
```

`timestamp`, `phase`, and `message` are always required. Include `completed` and `total` when work is countable. Terminal events additionally include `state` with one of the allowed terminal states. Do not place secrets, credentials, or unnecessary personal data in progress records.

## Decisions

### Creative continuation

The next work follows the owner-authored
[creative-animation prompt](../../../../../experiments/distant-sun-shadow-animation-evidence/prompts/new-animation.md).
It owns the rendering requirements, creative freedom, repository-wide working
boundary, duration, and autonomous preview/revision approach. The earlier
scientific plan remains a record of the static proof and deferred measurement
work; it does not impose feedback gates on this creative continuation.
Historical evidence and completed runs remain immutable.

The creative film uses the existing production one-degree scene caches through
an experiment-owned exact-time adapter. Cache-bin replacement and encoding
waits are outside its ideal 30-fps presentation timeline. This does not qualify
the separate shared-atlas shadow adapter or measure live performance. Existing
spectral, geometry, recording, and Three utilities are reused; only the new
scene, camera, integration, and separately cloned lighting are authored here.

### Initial still before animation

The first evidence is one lossless native-4K PNG, not a video or performance
claim. It uses a 55-degree vertical FOV and the standard San Jose scene's box
geometry, ground receiver, materials, shadow camera, and production shadow
lighting. The observation time is exactly two hours before the scenario's
computed sunset. The camera looks toward the horizon position where sunset
will occur while preserving enough foreground geometry to make shadow
direction and length visible.

The accepted composition places the exact computed sunset direction within
the left side of the frame rather than forcing it to the center. Its camera
direction is the normalized horizontal bisector of that sunset direction and
the canonical negative-Z box line, with a frozen `-0.12` downward component.
This keeps the future sunset at NDC `[-0.6253422761, 0.1347242139]` while
showing useful foreground and a long directional shadow.

### Read-only parents

Production supplies the canonical San Jose scene and shadow configuration.
The closed GPU-resident shared-block-cache experiment supplies the accepted
cache-backed distant-Sun renderer and exact packet data. Both remain read-only.
Adapted source lives here, and generated artifacts are new derivatives with
complete parent paths, hashes, configuration, operation, and resulting hashes.

### Reusable recording boundary

The repository-owned `scripts/animation-evidence/` package supplies generic
trace, replay, recording, streaming, diagnostic, and manifest mechanics.
Scene construction, solar time, sunset direction, shadows, cache addressing,
and renderer integration remain experiment adapters. The initial still may
reuse artifact-manifest mechanics but does not encode video.

### Performance boundary

The still proves appearance and scene hookup only. Later animation timing will
run without encoding, screenshots, readback, or artifact transfer inside its
timed interval. Each frame will retain shadow-state and cache-transition facts
so the cost of changing shadows can be compared with stable-shadow frames.

## Resolved Facts and Remaining Boundary

- The canonical static source is `src/flat32/EndpointScene.js`,
  `src/flat32/LocalSunSceneLighting.js`, and `src/flat32/consts.js`, exercised
  through the production spherical/distant diagnostic with review objects
  enabled by the contained adapter.
- Production marks every directional-light shadow dirty when the distant-Sun
  direction changes and also sets the renderer shadow-map `needsUpdate` flag.
  The later animation timer must surround the complete shadow-bearing render,
  with recording and readback excluded.
- The accepted still is a production one-degree-cache composition control.
  Installing the same scene into the shared packet-atlas animation path remains
  required before animation-performance conclusions are drawn.
