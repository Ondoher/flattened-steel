# Point-Local Cache Builder Experiment Design

## Objective

Create an extensible version of the current point-local shared-cache builder and
cache format that can support the Bruneton profile and expand its indexed
inventory into the logical cache needed to reproduce accepted Color Reset run 65.

## Acceptance Question

Can the adapted builder preserve application correctness while supporting the
Bruneton physical and numerical profile, with a shared cache whose indexed
expansion preserves the dimensions and values needed to reproduce accepted run
65 through point-local lookup? Extensibility and correctness are the primary
acceptance criteria. The current builder's performance is already sufficient;
preserve its sharing and efficient execution. Additional optimization is outside
this experiment's scope.

## Isolation Boundary

Authored experiment work remains below `experiments/point-local-cache-builder/`. Generated output remains below `tmp/experiments/point-local-cache-builder/`. Production and other experiment trees are read-only inputs unless their write scope is separately authorized.

## Output and run rules

- The experiment folder is the unnumbered slug `point-local-cache-builder` in topic, source, and output roots. The owner's clarified layout overrides the skill's current outer-prefix rule. Only run folders have a numeric prefix.
- The experiment source root is `experiments/point-local-cache-builder/`. Authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests belong there.
- The generated-output root is `tmp/experiments/point-local-cache-builder/`. Builds, caches, browser profiles, reports, captures, diagnostics, renders, logs, progress records, temporary files, and other generated intermediates belong only there and must remain ignored by Git.
- Derive repository, source, and output roots from the location of a checked-in repository marker rather than `process.cwd()`.
- Real-path-check every read and write boundary. Reject symlinks, junctions, reparse points, and any resolved path outside its declared root.
- Each execution owns one direct child of the experiment output folder, named `NNNNN-<slug>/`. The five-digit run sequence starts at `00000` independently within this experiment. There is no intermediate `runs/` directory. Allocate one greater than the maximum of `.last-run-number` and existing five-digit run prefixes under an exclusive `.run-allocation-lock`; atomically persist the counter and exclusively create the directory before work. Never fill gaps or reuse a number. Fail explicitly at `99999`. Failed and interrupted attempts consume their numbers. Slugs describe purpose, not results. Timestamps and UUIDs belong in metadata, not the folder prefix.
- The suffix after the five-digit prefix and separator is 1-16 ASCII characters, including any internal hyphens, in lowercase kebab-case. Thus a complete run folder name is at most 22 characters, for example `00000-baseline` or `00001-twilight`. Reject longer suffixes before allocating a run; do not silently truncate them. This limit reduces path-length problems and applies to newly created numbered subfolders. Keep detailed descriptions in run metadata.
- Never overwrite, rename, or reopen a completed run. Copy or derive reused material into the new run and retain its source identity. Prior experiments and their timestamp-named runs remain immutable.
- Record the command, inputs, relevant configuration, implementation revision or hashes, tool/runtime versions, environment facts that affect the result, parent artifacts, derivation operation, and resulting artifact identities.
- Finalize a run with an explicit terminal state: `accepted`, `rejected`, `failed`, or `interrupted`. Publish its terminal manifest only after all artifacts are closed and hashed.
- A forced process termination may prevent finalization. Preserve that unsealed attempt untouched, record its interrupted disposition in current status, and exclude it from sealed or accepted evidence. A retry uses a new run number; never reopen the partial run to invent a seal.
- A verifier may read the run it validates but must not mutate it. Corrections and retries create a new run.
- Keep production and other experiment trees read-only during experiment execution unless the engineer explicitly expands the write scope.

## Monitorable progress

Every operation expected to run longer than one minute writes UTF-8 JSON Lines to:

```text
tmp/experiments/point-local-cache-builder/00000-baseline/progress.jsonl
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

### Baseline and authority

Start from `scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerator.js`
and its receiver-local inventory, inputs, GPU compiler, and shared consumer.
Adapt within this experiment's source boundary. Preserve the local Sun-angle
dimension and point-local lookup. The legacy source-aligned B1 adapter is not
the implementation baseline or correctness oracle.

Use the authenticated application controls and package identified by the
[production qualification](../../../production-algorithm32/caches/shared-generation-qualification.md).
The [prior evaluation](../00000-shared-cache-calculation-reuse/current-builder-evaluation.md)
owns the existing timing and optimization analysis. Existing common-field sharing
is baseline behavior, not a new improvement; reuse this evidence without reruns.

Later B1 correctness uses accepted
`tmp/extraterrestrial/color-reset/runs/000065-color-reset-qualification/`,
specifically `data/b1-point-local-direct40-w27-q30.tsv`, SHA-256
`e6d62e23ec0184cc9941e8305d4ea9e69691cf996d5bce8523afb641830ce634`.
Its B1 score is 11.554012538468113 mW m^-2 sr^-1 nm^-1. Authenticate inputs and
derivation; matching a score alone does not prove matching calculations.

### Inputs and shared calculation inventory

Cache expansion means resolving a scene's indexes into the inventory to recover
its complete logical cache, retaining spectral channels, altitude, local Sun
angle, outgoing direction, ordering, and profile identity. It must not substitute
a scene-level source angle for the angle at each sample. Expansion itself does
not recalculate scattering or invent missing samples. A finer domain or changed
physical profile requires additional correctly identified calculations.

Run 65 is the accepted correctness authority for the target behavior. Its pinned
table is comparison evidence, not assumed to have the same serialized cache
format. Verify indexed reconstruction against matching cache controls, and
qualify the resulting B1 radiance values against run 65. Establish numerical
comparison criteria before running that qualification; neither equal scores
alone nor byte identity between different storage formats defines success.

Accept scene definitions or resolvable times as an input list with explicit
physical and numerical profiles. No 17- or 109-scene ceiling belongs in the
algorithm. Memory and execution budgets remain bounded. Each scene cache maps
logical entries into a shared inventory. Work identities retain all material
physical, spectral, geometric, quadrature, order, precision, parent, and
implementation inputs. Equal output bytes alone do not prove equivalent work.
Preserve intermediate dependency closure even when few final rows are requested.

Generalize Native15 defaults, fixed catalog assertions, spectral strides, block
sizing, and the experiment-local package reader together. First preserve the
application profile exactly. Later adapt to B1's 40 spectra, disabled ozone,
spectral grass ground, and 40 transport intervals; Q30 belongs to final view
integration. Confirm the complete profile against run 65 before B1 execution.

### Execution and effort

Preserve the current builder's common-field calculation sharing, single-context
batch execution, and resource lifecycle. Change profile, input, and cache-format
assumptions only as needed for the extension. Do not add persistent service
lifecycle, shader uniform conversion, phase tables, dependency pruning, or I/O
optimization work to this experiment. Additional physical work required by the
Bruneton profile is not itself a performance regression.

First prove daytime and twilight selections at two wavelengths against existing
application data. Capture existing timing and work counters during required
correctness runs to detect accidental loss of sharing or execution efficiency.
Do not run a separate optimization campaign or repeat the baseline solely to
seek speedup.

Use focused self-verifying runners, one review per coherent change, and a
consolidated final correctness/lifecycle review. Reuse unchanged verification
evidence. Investigate material regressions using comparable workload and profile
measurements. No experimental unit-test suite is introduced.

## Resolved Extension Scope

Scene lists, selected spectral channels, physical profile, transport sampling,
spectral strides, and block sizes are explicit inputs. Native48/Z180/W27 and N4
remain executable compatibility requirements; arbitrary replacement grids or
recurrences are outside this proof. Application ozone remains enabled at 300 DU.
Bruneton ozone is disabled to reproduce its accepted physical profile. The
criteria below were pinned before calculation and are unchanged after qualification.

## Selected Verification Criteria

The accepted input proof `00000-profiles/profiles.json` pins exact application
Float32 comparison and B1 agreement limits before GPU execution: maximum absolute
radiance difference 2e-7 W m^-2 sr^-1 nm^-1, RMS difference 5e-8 in the same units,
and absolute aggregate-score difference 0.001 mW m^-2 sr^-1 nm^-1. All 55,080 B1
radiances participate; no aggregate-only acceptance is allowed. Report actual
differences and image comparisons even when the limits pass.

The cache package retains production's byte-lane shuffle and Zstandard codec,
8x8 spatial grouping split as required by the 16 MiB decoded-block limit,
wavelength-major Float32 values, and exact W27 seam indexes. Qualification
decodes each block once into a new-run derivative, then reads channel slices.
Consumer comparison uses authenticated serialized metadata, matching the JSON
configuration delivered to the GPU, including normalization of signed zero.
