# Distant-Sun Strobing Release Preparation

The owner selected P4 under independent execution on 2026-10-07 through the
first owner approval. Publication and active application-default switching
await deployment approval. The [promotion status](distant-sun-strobing-promotion-status.md)
owns phase and release gates. P4's final check and review receipts belong to
`.codex-tmp/p4-strobing-20261007/summary.md`; pending gates remain open until
their required receipts validate.

## Proposed Selection

Publish the P2-qualified anchored Native48/Native15/N4 package
`9a30749c6d4e6c23d7a84839788c068133051fbbd9bd93d07de8b18a6ee432ec`.
Its `package-set.json` is 3,268 bytes, SHA-256
`bee0301de150115a5c068c492b20e5e631f4bd7da4104b4f847d4564dda3145e`.
Select `monotone-cubic` through the server selection owner and
`color-reset-slope-078-p2` through the application selection owner. P2 already
selects FP32 scene-linear storage; explicit P9 and Basic Bruneton controls
remain available. The unselected Native51 trial is excluded.

The cache retains all 109 scenes and 90 encoded blocks. Existing P2 physical
and Bruneton qualifications and owner-accepted P3 appearance evidence remain
the scientific release parents. P4 adds lifecycle, broad release, source-review,
staging and rollback qualification. The two-atlas ceiling is 859,963,392 bytes
on the qualified RTX 2060 / ANGLE D3D11 target. There is no new real-time
frame-rate target.

## Preparation And Deployment

`publish-shared-runtime.js` accepts explicit `--source-root`, `--source-package`,
`--package-identity`, `--report-sha256`, `--report-bytes`, and `--task-root`
arguments in `--name=value` form. `--prepare=true` exclusively stages below
the task's ignored `staged/<identity>/` folder. Omit that flag only after
deployment approval to publish below `server/flat32/data/shared-block/<identity>/`.
The publisher authenticates the complete graph and all files, preserves the
parent, writes the report last, and verifies repeated publication read-only.
Qualification output stays in new task-owned run children.

P4 uses the retained parent under `D:/flattened-steel/archive/`, stages in
`.codex-tmp/p4-strobing-20261007/`, and supplies exact selected identities.
The task's deployment artifact contains replacement selection files and
before/after hashes. Require current source hashes to match the recorded inputs.
Publish the complete package first, then apply server package/report/interpolation
and application color selections together. Rebuild and restart the production
application/server, verify loaded identities, and run a short rendering sequence.
Those deployment checks occur after approval.

## Compatible Rollback

Retain the current package
`2243c1ab2c2d529131759b32d72cee2a2e4b32098e1cc450c0d48cf34ed4edc7`:
report length 3,268 bytes, SHA-256
`cfb287edddcbeabb90224af61e6d253fc0ff78b92eb3bb6dc50b758cb3c3ac4e`.
P4 authenticates its complete 203-file, 505,753,993-byte inventory read-only.
Rollback restores this package/report, linear interpolation, and the P9 default
with its existing FP16 scene target, then rebuilds/restarts and verifies loaded
identities and short rendering. Keep both immutable packages intact; rollback
changes selections without deleting evidence or the selectable P2 owner.
