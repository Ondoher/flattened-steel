# Fixed continuation resource extension

This contained accounting module implements the exact
[registered transfer](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/resource-extension-plan.md):
C3 40→28 MiB, C6 20→12 MiB and C5 104→124 MiB. It retains every other
allocation, slot and original resource limit. It grants no scientific qualification.

`resourceExtensionRecord` derives the closed `sky-continuation-resource-extension-v1`
record. `authenticateResourceExtension` consumes chronological pre-extension
counters without recursively scanning the campaign. The dispatcher preserves
the original allocation verifier and replaces the active parent seal only after
the new extension passes authentication. Duplicate, reordered, unparented,
overspent and cap-changing extensions are rejected.

`resourceExtensionSources(throughAcceptedRun)` returns `{sources, delta, baseSnapshot}`
against exact accepted00210. The immutable prior source archive plus all changed/new
entries reconstructs the complete current POC source. Every omitted current file
must match its original identity; source deletions are rejected. The ordinary
run harness additionally retains and verifies the complete current source inventory.

Read-only preflight and explicit execution are separate:

```text
node experiments/sky-accuracy-dials/continuation/resource-extension/run.mjs preflight tmp/experiments/sky-accuracy-dials/runs/00099-c0-registration
node experiments/sky-accuracy-dials/continuation/resource-extension/run.mjs run tmp/experiments/sky-accuracy-dials/runs/00099-c0-registration
```

`resourceExtensionProof()` in `proof.mjs` exercises manufactured accounting and
rejection cases without allocating a run. The execution record is charged to C6
under the pre-transfer caps, retains a768KiB seal reserve, stays within2MiB and
five CPU-job minutes, and preserves at least3MiB of C6 reporting capacity after
the full record forecast. Historical evidence and the original amendment remain
unchanged. Formal implementation review is deferred under the active owner direction.
