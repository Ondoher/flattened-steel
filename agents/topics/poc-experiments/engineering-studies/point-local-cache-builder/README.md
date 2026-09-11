# Point-Local Cache Builder Experiment

Status: application compatibility, Bruneton qualification, and 300 DU ozone follow-up accepted.

## Objective

Create an extensible version of the current point-local shared-cache builder and
cache format that can support the Bruneton profile and expand its indexed
inventory into the logical cache needed to reproduce accepted Color Reset run 65.
The design owns the correctness target and expansion contract. Preserve the
current builder's efficient sharing and execution; additional optimization is
outside this experiment's scope.

## Governing Documents

- [Design](design.md)
- [Plan](plan.md)
- [Status](status.md)

## Repository Surfaces

- Authored source and controls: `experiments/point-local-cache-builder/`
- Generated output: `tmp/experiments/point-local-cache-builder/`
- Production and other experiments: read-only unless separately authorized

## Commands

Run from the repository root:

```text
node experiments/point-local-cache-builder/run-profiles.js
node experiments/point-local-cache-builder/run-build.js
node experiments/point-local-cache-builder/run-build.js --bruneton
node experiments/point-local-cache-builder/run-build.js --bruneton-ozone
node experiments/point-local-cache-builder/run-controls.js
node experiments/point-local-cache-builder/run-evaluate.js
node experiments/point-local-cache-builder/run-evaluate.js --ozone
node experiments/point-local-cache-builder/run-verify.js
```

The default build performs the small application proof. `--bruneton` generates
the complete target profile and qualifies its expanded caches against run 65.
`--input <repository-relative-json>` accepts explicit `buildRequest`, `scenes`,
and `wavelengths` for a compatible proof workload; array lengths determine scene
and channel counts. The module API accepts the same explicit inputs.
The current Native48/Z180/W27 domain owners and N4 recurrence are retained;
unsupported domain substitutions fail before GPU work.

`--bruneton-ozone` runs the same complete Bruneton workload with the retained
300 DU ozone absorption profile and compares it diagnostically with the accepted
ozone-off point-local result.

`run-evaluate.js` reuses the completed, authenticated cache from run `00003`
without regenerating GPU data. Its `--ozone` form authenticates and reuses the
ozone staging blocks from run `00008` without copying or regenerating them.
`run-verify.js` verifies this experiment's recorded evidence set, input guards,
and serialized expansion. These commands name the recorded parent runs
explicitly; they are evidence reproduction commands.

The [status](status.md) owns run identities and results. Chrome GPU execution
requires a host environment that permits launching the browser.
