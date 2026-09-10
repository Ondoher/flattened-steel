# Shared Cache Calculation Reuse Experiment Design

## Objective

Plan unique calculation requirements and shared result inventories for input-driven scene lists, minimizing repeated GPU work and setup while preserving qualified cache results.

## Acceptance Question

Can dependency-based planning and retained GPU execution reproduce the application controls exactly with less work or lifecycle overhead than the qualified shared generator, then preserve the separate direct-40 profile?

## Isolation Boundary

Authored experiment work remains below `experiments/00000-shared-cache-calculation-reuse/`. Generated output remains below `tmp/experiments/00000-shared-cache-calculation-reuse/`. Production and other experiment trees are read-only inputs unless their write scope is separately authorized.

## Output and run rules

- `00000-shared-cache-calculation-reuse` is the `<sequence>-<slug>` identity allocated by the skill's [folder-identity contract](../../../../../.agents/skills/start-experiment/SKILL.md#folder-identity).
- The experiment source root is `experiments/00000-shared-cache-calculation-reuse/`. Authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests belong there.
- The generated-output root is `tmp/experiments/00000-shared-cache-calculation-reuse/`. Builds, caches, browser profiles, reports, captures, diagnostics, renders, logs, progress records, temporary files, and other generated intermediates belong only there and must remain ignored by Git.
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
tmp/experiments/00000-shared-cache-calculation-reuse/runs/<run-id>/progress.jsonl
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

### Comparison authority

Initial controls are the 109 dense application caches under
`server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1/`
and the accepted shared package identified by the
[shared-generation qualification](../../../production-algorithm32/caches/shared-generation-qualification.md).
That owner records the immutable run, package/source identities, exact
reconstruction evidence, and measured baseline. Authenticate consumed artifacts
and retain those identities in every derived run.

The qualified generator already computes one common field per Native15
wavelength and reconstructs all controls through shared blocks. This existing
sharing is the baseline, not a new result. Separate calculation, setup, transfer,
packaging, and verification costs. Reuse existing evidence; rerun a baseline
only when a new claim needs a measurement the existing evidence cannot supply.

The application profile remains Native15, receiver-local, ozone enabled, and
black ground, with qualified geometry, quadrature, scattering orders, and
arithmetic unchanged. Later compatibility uses the canonical v8 direct-40
assets identified in the
[B-family result](../../benchmarks/production-b-family-c1-9-result.md)
and [ground-contact investigation](../../benchmarks/production-b-family-ground-contact-investigation.md).
Preserve its source-aligned frame, 40 spectra, 40 transport intervals, disabled
ozone, grass reflection, and exact scene positions. These are distinct profiles;
sharing across them requires proven identical dependencies.

### Calculation identity and inventory

Accept an input list of scenes or times with explicit physical and numerical
configuration. Resolve times to actual calculation inputs before deciding
equivalence. Plan a dependency graph of outputs and required intermediates.
Assign each equivalent operation one work identity and each materialized result
an inventory index. Each scene maps its logical cache entries to that inventory,
retaining shape and ordering metadata.

Candidate keys include operation/version, complete parent identities, physical
profile, spectra, altitude/direction coordinates, frame, quadrature, sampling,
scattering order, precision, and material parameters. Audit the equations to
establish dependencies per operation; omit a field only with a dependency
argument. Confirm canonical dependency equality after hash matches and avoid
serialization that accidentally merges distinct floating-point values.

Distinguish equivalent work from coincidentally equal output bytes. The former
avoids calculations; the latter may save storage after computation. Similar
outputs or nearby times do not prove equivalence. Physical symmetry requires
proof that discrete sampling and frame conventions preserve the calculation.
Counting unique final results does not establish minimum intermediate work.

### Retained execution and bounded resources

Use one application and retained GPU context; compile each required compatible
program variant once per session. Reuse allocations and batch compatible work.
Multiple algorithm stages may require distinct retained shaders. Investigate
shared spectral coefficients, sampling, geometry, paths, and phase terms only
where dependency analysis proves reuse. Preserve arithmetic order for exactness.

Input size has no baked-in 17- or 109-scene ceiling. Batch size and GPU residency
obey explicit resource budgets. Metadata and persistent inventory may grow with
unique work. Spill completed results into the new run and reload without
recomputation. Prove mapping validity, ordering, eviction, invalidation, and
failure cleanup. Resource exhaustion must fail explicitly, never drop scenes.

### Proof and measurement policy

### Selected first candidate

The executed candidate preserves complete shader source bytes. A guarded
derivation of the read-only production compiler changes resource ownership and
wait placement; its generated executable and parent hash belong to each run.
Exact source anchors fail closed if the parent changes. No production compiler
file is modified and no approximation or uniform substitution is selected.

| Work | Required dependencies retained | Selected reuse |
| --- | --- | --- |
| Direct source field and J1 | Complete physical/spectral profile, geometry/frame, directions and source-path quadrature | Existing common field only |
| L1 | Profile, incoming directions/weights and transport quadrature | Existing common field only |
| J2-J4 | Previous L, incoming/outgoing sampling, phase and scattering coefficients; source-aligned ground illumination order | Existing common field only |
| L2-L3 | Previous J/L, geometry, transport quadrature and ground boundary | Existing common field only |
| Scene extraction | Ordered union coordinate map and cumulative J1-J4 values | Shared inventory indexes and persisted results |
| Shader programs | Exact complete vertex/fragment source and the same GPU context | Retain identical program variants |
| Texture allocation | Exact dimensions, component format and scalar type, exclusive lease | Pool storage; reupload input data and fully overwrite scratch targets |

The texture budget is 512 MiB. Program residency is capped at 256, with eviction
only between wavelength jobs; evicted programs may be compiled again. This is a
resource limit, not a scene-count limit. The measured improvement criterion is
fewer allocations, compilations, or explicit completion waits with exact output;
elapsed-time measurements must disclose host workload differences. Persistent
result residency is separately proved with a two-row cache and file-backed reload.

### Proof scope

Begin with inventory extraction and planning, using existing data. Final caches
do not automatically supply oracle values for every proposed intermediate;
identify missing evidence before implementing its optimization.

Use focused self-verifying proof runners, not an experimental unit-test tree or
test-framework dependency. Complete reconstruction must exactly match
authenticated control payloads. Keep existing-byte mapping proofs separate
from new GPU computation proofs. A numerical departure fails the exactness
claim; do not silently loosen tolerances or benchmark thresholds.

Measure requested, unique, and executed work by stage; inventory reuse; program
creation; allocations; synchronization; transfer bytes; observable CPU/GPU
memory; and elapsed time by phase. State instrumentation gaps. Combined setup
time is not isolated shader compilation time. Compare cold and retained-session
behavior when execution reaches that stage.

Use focused correctness/data reviews and one consolidated final correctness,
lifecycle, and containment review, following the owner's reduced review cadence.
Reuse unchanged evidence. Pin meaningful improvement criteria from the inventory
findings before expensive execution; no speedup is claimed at scaffold time.

## Open Questions

- Which additional operations repeat beyond the qualified common-field generator?
- What inventory granularity avoids excessive metadata and I/O?
- Which intermediates lack oracle evidence, and what smallest proof establishes them?
- Which program variants remain invariant across wavelengths and profiles?
- What resource budgets and improvement criteria should govern execution?
