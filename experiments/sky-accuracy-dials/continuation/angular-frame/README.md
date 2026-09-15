# Boundary-aware angular frame package

The [prospective plan](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/angular-frame-plan.md)
owns the one morning h1000 comparison, its independent-coordinate reference
and all frozen accuracy gates. Physical incident integration remains in the
unchanged four-worker solver. No production or historical numerical file is changed.

```text
node experiments/sky-accuracy-dials/continuation/angular-frame/run.mjs pilot <C0>
node experiments/sky-accuracy-dials/continuation/angular-frame/run.mjs sun16 <C0> <acceptedPilotRun>
node experiments/sky-accuracy-dials/continuation/angular-frame/run.mjs sun32 <C0> <acceptedPilotRun>
node experiments/sky-accuracy-dials/continuation/angular-frame/run.mjs radial32 <C0> <acceptedPilotRun>
node experiments/sky-accuracy-dials/continuation/angular-frame/run.mjs radial64 <C0> <acceptedPilotRun>
node experiments/sky-accuracy-dials/continuation/angular-frame/run.mjs assess <C0> <acceptedPilotRun>
```

Each command creates a separate immutable record; stages never auto-chain.
`prepareAngularFrame(stage,C0,pilotRun?)` performs read-only preflight without
allocating a record or starting workers.
The package includes failed, incomplete and assessment records in its16MiB/60min
accounting. Pilot and assessment caps are3MiB/five minutes; references are at
most6MiB and require a complete accepted pilot. Reference byte forecasts double
the pilot's measured compressed bytes per incident node. Time forecasts use
twice its aggregate incident rate divided across four workers, plus90seconds
for startup, accounting and finalization. Slowest task time remains a separate
diagnostic. Hard deadlines stop work with30seconds reserved for finalization.
Every non-assessment admission also reserves3MiB and five package minutes for
the final assessment, including when a reference stops or fails.

`readAngularFrameRuns(registration)` authenticates every package seal and returns
`{run,seal,terminal,retainedBytes,document?}` entries. Stage `reference.json`
documents use `sky-angular-frame-stage-v1`; assessment/failed records need not
have that artifact. `readAngularFrameNodes(entry)` authenticates compressed and
uncompressed batch identities and replays their exact cost counters.

`nodes-NNNN.json.gz` files retain ordered `SkyVolumeJ2Node` arrays, including
every available task duration and work counter. The caller journals each
completed256-node batch before the next begins and flushes completed state
during finalization after an interruption. In-progress unavailable counters stay
explicitly marked. Up to eight original unresolved witnesses are retained.
`matrixComplete` denotes complete incident/geometry/mirror admission; it is not
an angular accuracy claim. The pure final assessment retains all six frozen
outcomes, including unresolved conclusions when reference stages are absent.

Source reconstruction uses the immutable00210archive plus every changed/new
source file. Every omitted current source matches its00210identity; the full
current source inventory and latest resource-extension seal remain authenticated
parents. Run `angularFrameGeometryProof`, `angularFrameRunnerProof` and
`angularFrameAssessmentProof` for synthetic checks without workers or evidence.
Formal implementation review remains deferred under the owner's instruction.
