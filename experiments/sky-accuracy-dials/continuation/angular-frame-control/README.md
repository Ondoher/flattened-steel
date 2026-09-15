# Angular frame and polar placement control

This isolated phase-field diagnostic follows the prospective
[plan](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/angular-frame-control-plan.md).
It does not evaluate atmospheric incident radiance or measurement data.

`readAngularFrameControl(registration)` authenticates accepted 00210 and 00212,
their exact morning geometry, the retained analytic reference and its independent
64 by 256 cross-check, and unchanged phase/geometry/formula source identities.
`evaluateAngularFrameControl(input)` compares six frozen Sun-polar rules and
returns `sky-angular-frame-control-v1`. It explicitly evaluates both mirrors from
unchanged `sunFrameGroups` through `incidentWorld`. The original outgoing-origin
32 by 12 integral is replayed against its retained value. A private fixed Gauss24
constructor supplies only the matched 24 by 16 control.

Results retain signed product errors, reference and arithmetic allowances, phase
mass errors and allowances, five descriptive contrasts, 19 separate geometry/replay
checks and all 17 scientific predicates. Failed or unresolved gates remain in the
accepted diagnostic; authentication/execution failures produce failed evidence
with an unresolved conclusion. An unadmitted analytic reference cannot pass a
dependent product-error gate. Phase masses use the analytic normalization of one
and remain independent of convolution-reference adequacy.

`angularFrameControlProof()` checks Gauss24 moments through degree 47, positive
weights and symmetry, synthetic frames and explicit mirrors, the g=0 polynomial
convolution on unpartitioned rules, constant-field integration, and failed or
unresolved uncertainty-aware gates. It never evaluates retained target geometry.

The single CPU record has a 2 MiB cap and five-minute deadline, is charged to C5
through the latest resource-extension seal, and inherits the exact 00210 source
snapshot plus every changed/new source. The prior atmospheric package is not
debited. No temporary numerical cache or additional scratch is created.

```powershell
& 'C:/Users/gande/AppData/Roaming/nvm/v25.4.0/node.exe' experiments/sky-accuracy-dials/continuation/angular-frame-control/run.mjs tmp/experiments/sky-accuracy-dials/runs/00099-c0-registration
```

The runner retains the plan, compact input provenance, source delta, proof,
assessment, readable report and execution/cleanup record. It checks the pinned
Node binary and all parents/current sources again before finalization. Local
proof and POC type checking do not replace the deferred standards review.
