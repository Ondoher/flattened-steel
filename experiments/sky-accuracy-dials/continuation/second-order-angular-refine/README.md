# Fixed-point azimuth refinement

`runSecondOrderAngularRefinement(C0, attributionPlanPath, angularPlanPath, stage,
baselineViewRun, priorAngularRun?)` evaluates a new radial16/azimuth64 placement
on the exact complete 32-node Gaussian-eight view for `p-0930-5-7`, channels 0/8.
The baseline must be an accepted, complete `sky-second-order-view-v1` record
with the original three angular rules and all physical inner admissions.

`low` computes intervals 0/1; `high` computes intervals 2/3 and also consumes
the accepted low-stage angular record. Each stage computes 16 new points,
1,536 reflection representatives per point, for 24,576 new incident evaluations.
The original view attenuation and geometry are reused exactly. Original
coarse/fine/mapped densities are retained as comparison data; new refined values
always come from the newly evaluated azimuth64 incidents.

The exact plan owner is
`agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/second-order-angular-plan.md`.
Its extension and stage must be registered before execution. Raw angular,
attribution and reference plans are frozen alongside complete source identities
and bytes. The original numerical core must match the baseline; high-stage reuse
also requires the identical azimuth executor/integrator implementation and the
same exact baseline artifact.

`view.json` has the distinct schema `sky-second-order-angular-view-v1`. Every
point retains its exact node, original transmission, `baselineAngular`, separate
`refinedRows`, new work and an immutable baseline pointer. Original angular rule
names remain unchanged. A high-stage record additionally identifies every refined
point inherited from its low-stage parent.

`integrateSecondOrderAzimuth` reports each physical interval and the full view,
for both channels and all four source components plus the combined source. It
retains original fine and new integrals with incident/view allowances, signed
corrections, and positive path integrals of absolute local corrections. The
absolute value is taken before path summation, so opposite-signed changes cannot
cancel. The earlier ordinary-coarse-to-fine absolute response and its separate
incident/view allowances are retained on the same nodes. Original three-rule
`baselineIntegrals` are also available.

For source difference `d`, incident uncertainty `U`, shared transmission `T` and
its uncertainty `Ut`, the absolute-correction terms are `sum(w*T*abs(d))`,
`sum(w*T*U)` and `sum(w*Ut*(abs(d)+U))`. The earlier response uses the analogous
original fine-minus-coarse quantities. No shrinkage pass is inferred here. A
separate prospective assessment applies the registered 20% response envelope and
floor; because the earlier response changed both radial and azimuth counts, it
does not establish an isolated azimuth convergence exponent.

Missing refined halves produce null refined/correction values while complete
original comparison values remain available. `matrixComplete` concerns the
selected half; `fullViewComplete` requires all 32 refined points.
`predictionsPassed` records physical inner admission only. Angular/outer adequacy,
frozen-increment conclusions and Kider qualification remain separate.

Execution uses four bounded workers, unchanged global volume-L1 admission,
C5 resource accounting, a 4 MiB retained cap, one hour minus a 60-second sealing
reserve, host-headroom/progress guards and a twice-slowest-point forecast.
Work artifacts count only newly computed incidents; inherited low-stage work
and original transmission are identified separately. Parent records remain
immutable, and bounded unresolved witnesses remain explicit.

The same authenticated coordinate fallback and interrupted-attempt collector as
[the outer refinement runner](../second-order-refine/README.md) runs after each
original worker batch. Its pinned `00170` witness, raw coordinate amendment and
four current numerical source identities are additional explicit inputs. Original
angular prediction bytes remain unchanged. Each affected refined point retains
its complete attempt-artifact pointer; low-stage reuse authenticates those extra
sources as well as the original core and azimuth executor.

Costs include original worker work and every completed additional Simpson method,
with actual parent-thread work and elapsed time recorded separately. In-flight
method counts remain null when interrupted. Compressed attempts preserve all
completed and interrupted records; original full witnesses are bounded at eight.
The focused proof also exercises callback retention and exact cancellation errors
on manufactured empty rays without evaluating physical radiation.

The CLI is `low/high C0 attributionPlan angularPlan baselineView [priorAngular]`.
The focused local proof uses manufactured components/transmission, validates
uncancelled weight-times-transmission sums and uncertainty terms, rejects changed
geometry/policies, and verifies null results for a missing half. It evaluates no
physical radiation and creates no immutable run:

```powershell
& 'C:/Users/gande/AppData/Roaming/nvm/v25.4.0/node.exe' 'experiments/sky-accuracy-dials/continuation/second-order-angular-refine/proof.mjs' 'tmp/experiments/sky-accuracy-dials/runs/00099-c0-registration'
```
