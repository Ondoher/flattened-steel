# Local J2 angular attribution

This CPU-only extension follows the exact four ground outputs and four channels
of immutable run `00113-c2-local-j2`. It derives new angular sums from authenticated
incident values and evaluates only genuinely new continuous physical L1 rays.
It changes no production code or historical evidence.

The owning [attribution plan](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/attribution-plan.md)
authorizes `compensation-attribution-v1`. Each stage consumes at most 4 MiB of
the explicitly repurposed C5 reference-work allocation and at most one CPU hour,
including a conservative measured pilot and finalization reserve. Historical C5
qualification remains skipped. Actual cumulative original limits still apply.

Use the exact C0-registered Node executable. Each command except `proof` creates
a new sealed run. Supply the preceding stage's accepted complete run as `PARENT`.

```text
node experiments/sky-accuracy-dials/continuation/j2-angular/run.mjs proof
node experiments/sky-accuracy-dials/continuation/j2-angular/run.mjs derive C0 PLAN
node experiments/sky-accuracy-dials/continuation/j2-angular/run.mjs development C0 PLAN PARENT
node experiments/sky-accuracy-dials/continuation/j2-angular/run.mjs predict C0 PLAN PARENT
node experiments/sky-accuracy-dials/continuation/j2-angular/run.mjs fine C0 PLAN PARENT
```

`C0` is `tmp/experiments/sky-accuracy-dials/runs/00099-c0-registration`.
`PLAN` is `agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/attribution-plan.md`.
The exact plan bytes and identities must agree across stages. The prediction
stage refuses any previous fine-stage attempt, including failed attempts.

After the unresolved local-allocation development in `00155-j2-ang-dev`, the
current runner uses the registered global outer-error allocation for new
continuous incident rays. Its definition records that strategy. Original reused
incident values keep their original local-allocation policy and allowances.
The revised plan starts a new derive/development/prediction/fine chain; the
incomplete earlier chain cannot authorize a dependent target.

The derive stage exactly replays all original sums before deriving full-mu64
azimuth32/64/128 endpoint and azimuth32/64 midpoint controls from original
endpoint128 rays. Original full-mu16/azimuth32 midpoint and 512 new representatives
for full-mu32/azimuth32 midpoint complete a fixed-azimuth radial comparison.

Development computes outward-hemisphere Gauss8 and Gauss16 at azimuth64 midpoint.
The separate prediction stage freezes correction-shrinkage and mapped-agreement
predictions plus an empirical envelope. It explicitly leaves magnitude-order
prediction unresolved; two Gaussian levels do not justify an assumed power law.

The held stage computes hemisphere32 at midpoint64, endpoint64 and endpoint128,
plus independently mapped cosine=u² Gauss32 at endpoint128. Exact repeated
physical directions share newly evaluated incident results, giving 8,320 new
representative rays across the two origins. Different phase weights are applied
to both reflected directions and every outgoing target independently.

All reported densities are `W m^-3 sr^-1 nm^-1`, not sky-radiance RMSE. Incident
admission, empirical angular adequacy, prediction success and older-control
numerical-error reduction remain separate fields. Missing material evidence
retains null allowances. The new reference can rank older full-interval controls;
its own last-change allowance cannot independently qualify its own refinement.
No Kider, complete N4, positive-height ground limit or physical-uncertainty claim
is made by this runner.
