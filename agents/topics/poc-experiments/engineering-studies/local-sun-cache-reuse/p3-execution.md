# Shell Layout Execution

Owner-selected independent execution covers recast P3-P5. Stop before P6
recording, or if a fatal flaw remains after viable authorized workarounds.
P0-P2 evidence and production remain unchanged.

## Current State

P3-A through P3-D and the P4 application prototype are in development. No new implementation milestone is
complete. The coherent initial review unit now covers P3-A/P3-B geometry,
addressing, CPU/GPU construction, first-image collaborators and the P3-C
independent reference/proof collaborators developed with that same candidate.
Its preimplementation whole-experiment baseline remains:
`.codex-tmp/review-standards/session-2Ck6A5/baseline.json`.
Required standards readiness and final primary/audit evidence remain separate
from numerical proofs and render delivery.

## Decisions

| Question | Decision and reason |
| --- | --- |
| Where does generated evidence live? | New sealed runs under the declared experiment output root; this specific experiment boundary overrides the skill's generic scratch-output location. Review mechanics remain under `.codex-tmp/review-standards/`. |
| What does execution authorize? | Recast P3-P5, including the standard images, numerical proofs and app/lifecycle/resource qualification. Stop at the recording boundary; do not capture P6 preview or final video. |
| How is Euclidean radius made stable near the axis? | Evaluate radius excess over the altitude's axis distance using `e = rho^2 / (hypot(rho,h-z) + abs(h-z))`. Retain original physical coordinates and explicit axis support. Verify address/stencil behavior rather than subtracting rounded absolute radii. Exact storage nodes remain a P3-A decision. |
| Does omitting scattering bands omit ray propagation? | No. Empty scattering bands have no samples or scattering build work, but required source facts, boundary support and vacuum transport remain. |
| Can old reference and gate records qualify the layout? | No. Preserve P1 records; version the new topology/query matrix and state the physical truncation boundary explicitly before candidate results. Retain compatible quantity tolerances. |
| What happens to the old axis discontinuity? | Diagnose a bounded spatial/frame treatment and compare against physical-reference limits. Do not assume the shell layout repairs it. Explicitly limit or reject a candidate that cannot pass; a broad angular redesign requires a separate recorded scope decision. |
| Why did the first N4 build contain nonfinite fields? | Absolute large-cylinder quadratic arithmetic and rounded exit samples exposed out-of-domain transport that the old stencil clamped. Normalize the cylinder intersection using `(R-rho)/R`, retain explicit cylinder-exit identity, and sample its known boundary radius at the terminal construction tap. Do not admit arbitrary outside queries. Failed runs 00050-00055 remain immutable. |
| Does the first finite N4 image establish accuracy? | No. Run 00056 has finite fields, zero GL errors, CPU/GPU ray parity and complete measured candidate coverage, but its sky is grossly brighter than the current control. Investigate long-path quadrature and spatial resolution before any acceptance. |
| May the inherited transport quadrature be corrected? | Yes, as an explicit experiment-owned correctness workaround. The large fixed cylinder exposes coarse optically thick trapezoid intervals. Investigate analytic extinction columns and positive attenuation-weighted integration before enlarging sample counts; preserve physical equations, spectral/angular/order controls, original control and frozen tolerances. Record policy-change error separately from layout/reuse. |
| What did the continuous primary probes expose? | Run 00058 identifies J1 amplitude clamping outside the old placement-dependent source table and insufficient L1 path resolution. Derive the existing 2048 equal-inverse-square source-amplitude bands from the candidate slab/cylinder; keep continuous direct/source-disk facts separate. Investigate 120 construction intervals while retaining the original 15-interval control. Path count is an explicit numerical policy change; Native15/W27/F68/N4 and tolerances stay pinned. |
| How are images compared fairly? | Starting with run 00058, both paths use the control's measured adapting-luminance proxy. Earlier images are diagnostics with each path's own measured adaptation. Keep the newly measured spectra as physical observations, never normalize them to the control. |
| How is the spatial axis limit repaired? | Reconstruct each axis-node contribution along one canonical meridian, using the physical direction's horizontal magnitude and vertical component. CPU, construction and runtime use the same node-specific rule. Nonaxis taps retain W27 reconstruction. Continuity alone does not qualify physical angular accuracy. |
| Does F68 pass the new independent J2 diagnosis? | Not established. Refined continuous-primary/angular probes expose large discrepancies near the axis; simple phase normalization and polar midpoint recentering do not resolve them. Refine the independent uncertainty before rejection. As a numerical correctness workaround, investigate a distinct partitioned product incoming quadrature while keeping F68 as the unchanged control, outgoing W27/R32F/Native15/N4 and all acceptance limits. This changes numerical construction identity, never adds a Sun-angle spatial cache dimension or reuses P2 qualification. |
| Which denser quadrature is being investigated? | Forty positive Gaussian polar taps partitioned around the flat horizon, initially 24 cyclic azimuths (960 incoming directions). Run 00073 is finite and passes the measured primary and CPU/GPU rays. A 48-azimuth midpoint variant (1920 incoming directions) addresses cylinder-tangent integration bias; it remains a separate developmental policy. Outgoing W27, spectral channels, order and tolerances remain unchanged. |
| How is independent reference convergence improved? | Preserve old runs; integrate continuous primary transport using Simpson in `t=L*u^2`, then independently generated Gaussian polar integration under `mu=sinh(k*u)/sinh(k)` with its Jacobian. Increase k/resolution near the ground and refine azimuth quadrant endpoints at the physical cylinder tangents. Keep every original convergence and uncertainty limit. Rotational/reflection symmetry avoids duplicated L1 evaluations while retaining every phase tap. |
| May rejected evidence supply reference values? | Yes, only through explicit rejected-parent admission, full immutable inventory authentication and exact physical/schema compatibility. Preserve each reference cell's convergence and uncertainty; a rejected candidate does not invalidate independently computed reference values, and an inconclusive reference cannot grant acceptance. |
| Why is physical linear interpolation being replaced? | Independent off-grid J2 in run 00084 rejects the 457-node candidate, including roughly 36.5% error near the ground between coarse radial samples. Investigate interpolation of J after removing analytic extinction and continuous direct-incident decay, restoring that positive factor at the query. This uses physical equations without empirical fitting; stored J remains physical. Run 00087 improves accuracy but still fails. Bisect radial resolution seeds before another evaluation. |
| What prevents the refined constant-table shader from compiling? | Run 00095 exceeds the D3D11 register limit. Stop that invalid capture and seal its failed evidence; use immutable scalar texture inputs for node log factors instead of large shader constant arrays. Add immediate construction/shader-error rejection. This is a viable implementation workaround, not a fatal flaw. |
| Why did the 699-node first-order matrix still fail? | Run 00116 finds two failing packets between near-axis samples at 5/250 m. Mid-altitude-derived radii leave a large ground-row gap. Add ground-referenced shell radii for frozen radial seeds whose ground radius excess is at most one slab thickness. This is a geometry-derived refinement, not a fit to reference values. Run 00117 produces 775 retained nodes with the same six empty bands omitted. |
| How is the independent recurrence made practical? | Use the installed framework compiler for owned binary64 source; share source-meridian reflection and invariant phase convolution, checking Fourier sums against direct scalar sums. Optional three-channel packets share continuous columns and phase while retaining separate spectral values. Their common optical-depth-32 endpoint changes the discrete path rule, so record a distinct policy and require fresh convergence. |
| Why investigate a different construction path coordinate? | Coarse independent higher-order references show unresolved disagreements, especially at the outer cylinder. Uniform physical steps can miss source-function variation within optically thick intervals. Investigate squared-distance sampling with an optical-depth-64 integration prefix and positive attenuation weights. Run 00127 bounds the removed tails below one tenth of every absolute physical limit. Keep physical boundary/coverage identity intact and recheck accuracy; this tail bound does not validate the new quadrature. |
| How is the phase preparation pause addressed? | Prepare the same invariant Mie matrix and canonical identity in a run-pinned worker, transfer its Float32 buffer and terminate the worker on success, failure or cancellation. Yield between GPU layers through the existing scheduler. Run 00126 preserves the complete cumulative field hash of run 00118; responsiveness, exclusive timing and complete app lifecycle gates remain open. |
| Why replace the squared-distance trial? | Run 00128 fails four primary L1 checks at 99 km: 48 squared physical steps do not resolve the dense lower atmosphere on descending rays. Instead sample squared cumulative Rayleigh density column, with its analytic inverse; retain positive attenuation weights and the bounded tau-64 prefix. Run 00132 passes the measured primary probes and the complete withheld J1/J2 matrices. |
| Why change independent reference path integration? | Runs 00131/00133 remain inconclusive after fixed Simpson refinements: interpolated source functions have path knots. Split independent Gaussian integration at reference rho/altitude/azimuth knots, closest approach and physical density/attenuation scales. A half-step incoming azimuth rule avoids sampling the narrow cylinder-tangent transition at its endpoint; retain exact complex Fourier kernels and direct-sum parity. Run 00141 passes all nine quantities' coarse three-level path checks; spatial/angular convergence remains required. |
| Does the adapted construction module retain the inherited hash? | No. Recreate its identity from actual modified blocks and bindings through `CacheBuildModules.createBuildModule`. Earlier fresh-only evidence remains immutable and does not establish reuse. The new radius-excess support texture also removes a large dynamic shader constant array, while preserving R32F support values and explicit texture ownership. Verify it in a fresh capture before relying on it. |

## Saved Development Evidence

- [CPU topology proof](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00049-p3-shell-proof/result.json):
  457 compact samples, six omitted inner bands, complete on-node/address checks
  and stable radius-excess recovery, including a one-millimetre offset. CPU
  evidence only; the sealed implementation hashes precede later type-only repairs.
- [Order-one diagnostic image](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00053-p3-shell-v3a/comparison.png):
  fresh control / fresh candidate / 50x RGB difference, explicitly not N4.
- [First finite N4 image](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00056-p3-shell-v3a/comparison.png):
  gross brightness disagreement; unqualified candidate. Candidate build 2,689.3 ms,
  peak observed field allocation 359,805,240 bytes, zero CPU/GPU ray failures and
  zero excluded measured rays. These are instrumented first-capture facts,
  not app responsiveness, physical GPU bytes or warm benchmark qualification.
- [Bounded optical N4 image](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00057-p3-shell-v3a/comparison.png):
  attenuation-weighted construction removes the gross overbrightness. Finite
  values and visual plausibility do not establish physical accuracy.
- [Independent primary diagnosis](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00058-p3-shell-v3a/result.json):
  binary64 analytic J1 and continuous Simpson L1 at 21 selected nodes, five
  L1 and seven J1 directions, all 15 channels. L1 refinement uses
  60/120/240/480/960 intervals. Candidate maximum gate ratio 6.0281 fails the
  frozen physical limit; source-table and path-resolution repairs are in development.

## Next Step

Primary J1/L1 probes pass after source-relative amplitude bounds and 120-interval
optical integration. Binary-search shell addressing reduces the observed
build from 36.5 seconds in run 00059 to 2.318 seconds in run 00060; these are
diagnostic observations, not repeated app benchmarks. Run 00062 passes the
one-millimetre CPU axis limit and measured CPU/GPU view rays. Run 00065 removes
redundant axis shader work and confirms a finite N4 build.

Run 00073's initial 960-direction candidate builds in 10,185 ms, including
3,534 ms of CPU phase preparation. Its 359,805,240-byte peak counts fields only;
it excludes immutable phase/program data and is not complete app resource evidence.
Run 00080 verifies the allocation-light continuous-primary oracle against its
original implementation at 4,410 scalars, with zero failures and observed
281.2 ms versus 59.5 ms. This is a diagnostic timing, not a benchmark claim.

Run 00083 converges independent J2 at all seven axis altitudes. Run 00084 rejects
the initial candidate at off-axis points. Run 00087's factor-aware reconstruction
remains finite; the derivative [J2 comparison](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00089-p3-reference-cmp/result.json)
has 34 accepted, one rejected and seven inconclusive physical points. Its
uncertainty-inclusive spatial maximum is 0.1674 and p95 RMS 0.03223, failing the
unchanged 0.1/0.02 limits. This is J2-only evidence, not full qualification.

Run 00097 exercises the refined candidate: 699 compact samples, 1920 midpoint
incoming taps and node log factors as immutable texture inputs. Its finite N4
build measures 27,756 ms including 7,762 ms of CPU phase preparation; the
550,336,680-byte observed field peak excludes immutable phase data and is not
full active/staging or responsiveness qualification.

The [complete J2 comparison](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00103-p3-reference-cmp/result.json)
qualifies all 42 physical points and 294 spectral packets. Its
uncertainty-inclusive maximum normalized error is 0.0224021 and p95 normalized
RMS is 0.00696431, passing the unchanged 0.1/0.02 spatial limits. This is a
J2-only result, not candidate or phase completion.

An experiment-owned binary64 native reference now evaluates J2/J3/J4 and
L1/L2/L3 on an independent rho/altitude/angular tensor grid. It imports no
candidate field values or shell stencils. Existing installed framework tooling
compiles its source into a new evidence run; no dependency or experimental
unit-test suite was added. Fourier phase convolution is checked independently
against direct scalar summation, and optical-depth-32 tails have explicit
positive-source bounds. Its coarse developmental runs are unqualified until
separate spatial, angular and path convergence resolve every required cell.
Runs 00107, 00109 and 00112 separately verify numerical equivalence after
query grouping, tensor-lookup acceleration and reflection sharing; these
equivalence checks do not qualify physical accuracy.

Complete the first-order off-grid inventory and independent higher-order
convergence next. Freeze no accepted policy and do not open Flat90 holdout
results yet. Complete fields, views/receivers, omission, movement and P4/P5
remain open, together with required source-review completion evidence.

The near-axis refinement in run 00118 passes all 294 first-order packets in
run 00120 (maximum normalized error 0.014557, p95 RMS 0.008638).
Run 00123 rechecks compatible independent J2 and passes all 42 points
(maximum 0.021947, p95 RMS 0.005858). These are Flat0 J1/J2 observations.
The unchanged production control fails its separate first-order matrix;
agreement with that control is not an acceptance criterion.

Three-level spatial reference refinement, higher-order physical acceptance and
the bounded squared-path candidate are still in development. Concurrent CPU
reference work affects capture timing; neither the 31,261 ms diagnostic fresh
build nor the 36,758 ms worker capture is an exclusive resource benchmark.
The worker capture's identical cumulative field hash establishes preservation
of that measured field, not general lifecycle or responsiveness qualification.

Run 00132's density-column trial passes the measured primary probes (maximum
physical gate ratio 0.121754), builds in 24,706 ms and remains finite. Run 00135
passes all withheld J1 packets; run 00136 passes all J2 physical points
(maximum normalized error 0.021360, p95 RMS 0.004726). The timing is a diagnostic
capture, not repeated resource qualification. Run 00128 separately measures a
13.6 ms phase-preparation UI gap; full-build responsiveness remains open.

Run 00144 verifies the new radius-excess texture and actual module identity.
Its cumulative hash, all sampled J1-J4 packets, measured CPU/GPU rays and
coverage match run 00132 exactly. Run 00146 passes all 294 withheld J1 packets;
run 00147 passes the compatible qualified J2 matrix at all 42 physical points.
The 27,997 ms build remains a concurrent diagnostic timing.

The omission control is now under development: preserve identical occupied
nodes and query stencils, append one strictly empty-band slot per altitude row,
and dispatch explicit zero values before evaluating atmospheric equations.
This measures real extra allocation/dispatch in a bounded unculled control,
without claiming the source-strength table's 2048 bands are field layers.
Runs 00150/00151 retain occupied hashes for every pure and transported field
and count any nonzero empty slot. Run 00154 passes all eight occupied-field
hashes bit-for-bit, with zero nonzero empty slots. Omitting the 114 control
slots saves 89,754,480 peak logical field bytes (699,927,480 versus
610,173,000). These are bounded equivalent-control allocation/dispatch facts,
not physical device-memory telemetry or a whole-layout benefit claim.
Run 00153's first comparison failed because source inventories arrived in
different orders; sorting their exact path/hash inventories resolves that
verifier issue without changing either parent. The compact candidate never
allocates the control slots.

Run 00152 exposes a distinct inherited runtime issue: both CPU and GPU
transmission fail 540 of 1440 channels against analytic flat-medium columns.
Common-path parity cannot qualify their shared coarse trapezoid rule. Develop
an explicitly identified experiment-owned runtime rule with analytic extinction
and positive source-function interval integration, retaining the production
control and all physical/frame-cost limits. This does not invalidate passing
cache-construction J1/J2 evidence; views and lighting remain open.
Run 00155 keeps the complete constructed cumulative hash unchanged. Its owned
view and receiver contribution uses the same analytic columns and positive
source-function interval rule; the owned CPU calculator matches the measured
GPU rays with zero common-path failures. The transmission proof
`00157-p3-view-t-proof` passes every candidate CPU/GPU channel while the control
still fails 540 channels in each path. Direct/diffuse lighting changes are
retained as new observations, not normalized to hide this correction. Radiance,
receiver, frame-cost and complete app lifecycle accuracy remain unqualified.

The independently refined spatial reference `00157-p3-ref-converge` remains
inconclusive after run 00143 (2,221,352 ms). Higher-order differences are largest
near the outer cylinder. Investigate source-function/boundary resolution;
do not label an unqualified reference disagreement a physical rejection.
The two different `00157` labels exposed a concurrent sequence-allocation race;
both sealed named runs stay immutable. Future allocations must serialize.

Run 00156 derives a 930-node vertical refinement without fitted values:
bisect original altitude intervals wider than half a Rayleigh scale height
when starting below four such scale heights. Added altitudes are 17,000,
22,500 and 31,250 metres; six empty-band omissions remain. Run 00158 verifies
the fresh runtime-corrected capture and hoisted query factors, with finite
fields and a 25,868 ms concurrent diagnostic build. Runs 00161/00162 pass its
complete withheld J1/J2 inventories; 00163 passes candidate transmission.

Run 00164 diagnoses construction transport against the same GPU J2 field:
96 selected L2 packets have no raw physical-limit failures, with maximum gate
ratio 0.039533; 85 packets pass that diagnostic's path-convergence check.
This separates quadrature from field-representation error and supplies no
independent physical-field acceptance. Angular reference refinement 00159
remains inconclusive; 00160 is computing the next angular level. Path refinement
00171 is computing a higher independent Gaussian order. All uncertainty
dimensions and tail/roundoff budgets remain required before higher-order claims.

The radius-row stencil had held horizontal distance fixed across altitude
despite using Euclidean shell nodes. Layout 00165 identifies a radius-preserving
rule with positive axis/outer-boundary fans. Run 00166 is finite, has zero
measured CPU/GPU failures, and passes J1/J2 in 00167/00168. Its 30,767 ms
concurrent build is a diagnostic observation, not an exclusive resource pass.
The later source parenthesizes altitude differences to retain tiny radius
excesses; do not relabel 00166 with that changed source identity.

Layout 00169 investigates geometric-density normalization: remove extinction
times unattenuated inverse-square dilution during interpolation, retaining
direct-beam attenuation in physical J1. This tests whether direct-attenuated
normalization is inappropriate for higher-order diffuse fields. No values are
fitted and no acceptance limits change. Run 00170 is computing the fresh capture.
Run 00172 proves 18,995 CPU stencil queries, including row/cell interiors,
one-millimetre axis offsets and outer-boundary approaches. Positive admitted
weights preserve radius moments within 7.46 nanometres and altitude moments
within 6.81e-13 metres. GPU precision and physical accuracy remain open.

Run allocation now uses a nonce-owned cross-process exclusive lock. It never
steals or deletes another owner's lock; the historical duplicate sequence names
remain unchanged. Native convergence now also requires identical C# source
hashes across the three declared one-dimensional refinements. No fatal flaw has
been established. P3 completion and P4/P5 remain open; stop before P6 recording.

The coherent review unit now also includes developmental P3-D adapters that
share this candidate's construction and lookup collaborators. The original
pre-P3 baseline remains `.codex-tmp/review-standards/session-2Ck6A5/baseline.json`;
these files did not exist at capture. This does not close an implementation gate
or grant a fresh source-review result. Before the final review, refresh affected
context and include the complete changed unit and relevant unchanged collaborators.

Boundary-resolution diagnosis is in progress. Layout 00176 adds row-local
support at 0.25, 1, 4 and 16 shortest spectral extinction lengths inward from
the physical vacuum cylinder, producing 998 admitted nodes. Run 00177 passes
20,383 CPU stencil queries. Capture 00178 is finite, and 00180/00181 pass J1/J2.
Its 36,759 ms build ran alongside independent references and does not pass an
exclusive build-time gate. Independent reference 00179 augments its original
rho tensor seeds with ground-extinction boundary offsets at separately defined
0.125–64 length multiples before spatial bisection; it imports no shell nodes.
Candidate and reference physical equations, cylinder and tolerances stay fixed.

Reference 00179 is finite but unqualified. Against its boundary-supported coarse
values, the 998-node candidate's largest raw J3/J4 gate ratios are 1.148/1.098,
compared with 1.368/2.168 for the 930-node geometric-normalization trial.
These are unresolved comparisons, not acceptance or rejection. Independent
spatial refinements 00183/00184 are computing. Run 00185 passes all nine
quantities' three-level path check at 32x64 angular support using 00138/00171/00175;
that old-grid path result cannot substitute for matching boundary-grid uncertainty.

The still-only movement capture 00182 exercises the 998-node candidate at
synthetic 0/17 degrees. All ten constructed field arrays agree bit-for-bit,
all measured fresh/reused CPU/GPU rays pass, and paired PNG RGB bytes are
identical. Radius/altitude-cell and angular-seam comparisons have no failures,
including per-node axis handling. Compensated CPU/GPU endpoints differ by at
most 3.73e-9 metres. This is limited developmental movement evidence, not
complete physical, temporal or app lifecycle qualification.

The owned shell client now centralizes canonical build bindings and per-cache
support-texture disposal for movement/application use. The axis-roundoff build
adapter recreates its module identity from actual blocks. CPU reconstruction
retains precomputed analytic node factors and one exact rho/z query factor;
this caches no field values and changes no equations. Its local type check passes.

Run 00186 proves the entire 8,398,080-value phase matrix retains its canonical
`sha256:82d85def25f25cc1aa739a3e09dbf2e02d978dc0b463cf84d70de7efa9870da6`
identity when explicitly sorted numeric JSON and native SHA-256 replace the
worker's synchronous serializer/hash. Observed host hashing was 21,218 ms
versus 3,704 ms under concurrent reference load; these single diagnostic host
timings do not qualify browser responsiveness or cold-build time.

Run 00187 is computing seven rotation poses and three nonzero horizontal
translations without video. A source-read correction made after its frozen
bundle restricts canonical ray-baseline assignment to artifact key zero,
rather than every zero-degree translated pose. The translation equivalence
checks in that frozen run therefore need corrected replay; preserve them as
diagnostics. No repeated rotation build is needed solely for that baseline
bookkeeping change. Exact source/observer translations move the equivalent
observer dome as well; fixed-camera fresh/reused rays remain separate checks.

Expanded readiness request v3 passed all required lanes: architecture context
`sha256:1284a73fca671d93c0a02073b7839aa197790222b5def022e2bdba63bfb40533`,
contracts context `sha256:e028391a4aadeb6ffe1e7c83446471df5612c3f5dfca1514c5426d6ae7e4a513`,
and verification context `sha256:72d3cc8a366ea1d4265bc5d25611fabe8e65f5098074276bba5b3a5fb1545af0`.
The verification lane maps only root `.gitignore`; experiment mapping remains
base plus types. Readiness is not completed source review.

A second movement-check bookkeeping defect was found in 00187: the local radial
offset shadowed the translation argument used by the inverse-transform check.
That invalidates its expanded inverse-transform results, including rotations;
00182 predates this edit and remains valid for its limited matrix. The source
now names the radial offset separately. All affected transform checks require
fresh evidence; unchanged direct field hashes and images remain diagnostics.

Run 00188 repeats complete phase identity equivalence with a discovered local
module closure and direct W27 domain ownership rather than facade construction.
The native reference now checks every incoming tap at fixed pole, horizon and
midlatitude/azimuth sentinels after computing the full field, reducing the
quadratic validation cost. It adds independent L4 ray values and explicit tail
and roundoff records. Run 00189 completes the coarse boundary-supported case;
matching-resolution replay is computing. New reference qualification requires
new same-source convergence families; old references are not relabeled.

The P4 publication work is declared as a separate coherent implementation unit
before coding, sharing the existing shell client and model collaborators.
Its baseline is `.codex-tmp/review-standards/session-FKwHoD/baseline.json`.
The happy path publishes one prepared frame containing cache transform,
source, receiver light and shadow facts, with leased cache/controller ownership.
P3 numerical selection remains open; developmental reuse cannot supply a
qualified public identity. Complete lifecycle/resource qualification and source
review remain open. No film work is selected.

Runs 00190 and 00195 complete the new native implementation at 32x64 angular
support with Gaussian path orders eight and four. Run 00191 verifies all nine
shared quantities against the old matching-resolution run 00179: all 39,690
scalars are bit-identical. This equivalence does not waive the same-source
convergence gate or qualify the added L4 packet. Runs 00193/00200 supply angular
refinements and 00198 supplies the next path refinement. Old-source spatial
run 00184 remains separate. The excessive all-outgoing direct audit in 00160
was stopped at its exact owned executable; its failed run and partial evidence
remain immutable. The new bounded-outgoing audit still sums every incoming tap.

Run 00187 ended at the browser evaluation timeout, retaining its diagnostic
artifacts. Run 00196 completes the full seven-rotation/three-translation matrix
with both bookkeeping corrections. Shared spatial/angular support reduces
duplicate proof work without caching field values; sampled equivalence with
the original field reader is bit-exact. Run 00201 authenticates the complete
sealed inventory and passes every synthetic movement gate: bit-identical fields,
all five reconstruction inventories, complete rays, source facts, endpoints
and paired RGB images. Physical, orbital and temporal qualification remain open.

Runs 00194 and 00197 exercise the actual GPU application publication path.
Run 00197 also deliberately fails compilation, cancels after GPU submission,
rejects an over-budget request before allocation, and disposes publication while
a renderer retains a frame lease. Each case preserves the prior complete frame;
the final idempotent renderer release retires all owned resources. Supersession,
successful physical replacement and full resource qualification remain open.

Run 00199 makes exact source placement, axis fallback and observer-dome position
runtime uniforms in the experiment-owned contributor. Its view and receiver
shader identities stay identical at 0/17 degrees. The second prepared frame
falls from 52,807 ms in 00197 to 133.4 ms, while all 1,440 CPU/GPU ray and
transmission scalars pass and endpoint disagreement stays below 3.73e-9 m.
The first cold frame took 64,059.9 ms under concurrent reference load, so this
does not pass the 60-second preparation gate or establish exclusive timings.
These runs preserve exact unsmoothed receiver lighting and do not change
production. Run 00192 preserves the failed initial application hash-API call.

Run 00202 adds real GPU-build supersession: the newer request cancels staging
while the old complete frame remains available, then publishes using that
existing cache. Run 00203 observes public field allocation/release and all
listed negative lifecycle cases, ending with no live fields. Its instrumentation
was outside the shader adapter, so its immutable-data count omits inputs added
by that adapter; it cannot establish the complete payload budget. Instrumentation
now sits beneath adaptation so it receives the actual compiled shader bindings.

Run 00204 passes all ten quantities' boundary-grid three-level path convergence,
including L4, using 00195/00190/00198. Angular and spatial uncertainty remain
separate. Run 00205 begins new-source spatial refinement rather than relabeling
old-source evidence. Source review and complete physical admission remain open.

Successful P4 replacement controls are source height +10,000 m, source power
times 1.1, and Mie single-scattering albedo times 0.9. The latter is a bounded
physical atmosphere change with unchanged extinction, density heights and phase;
arbitrary atmosphere changes are not claimed. Layout reconstruction uses the
frozen physical resolution seeds and omits empty bands before allocating a
height replacement. A local comparison finds the original-height reconstruction
identical in every value to the 998-node layout (object property order differs).
Each replacement retains the prior complete renderer-leased frame during build.
The shared application identity includes each changed physical control; its
horizontal placement exclusion remains developmental until complete P3 admission.

Run 00206 completes all three successful physical replacements. Every measured
CPU/GPU ray and transmission channel passes, each replacement receives a distinct
canonical identity, and staging preserves the prior complete renderer-leased
frame. Instrumentation beneath shader adaptation observes a 1,047,662,400-byte
backend payload peak and complete final retirement. This excludes scene targets,
runtime support and shared host phase; full application admission remains open.

Run 00210 compiles independent view and receiver programs concurrently, waiting
for both to settle before cleanup or publication. Preparation falls to 34,420 ms
for the initial frame, 40,495 ms for height and 38,709 ms for albedo under concurrent
reference load. All measured CPU/GPU channels pass; the power replacement passes
the separate 1.1-times spectral linearity invariant across all 1,440 channels.
The new eight-millisecond responsiveness monitor exposes 1,033–15,498 ms gaps
inside preparation, failing the unchanged 100 ms criterion. Synchronous receiver
GPU readback is a correction target; faster compilation alone is insufficient.
These single diagnostic timings do not close repeated resource qualification.

Runs 00208/00209 are compact and bounded-unculled captures. A host-only JSDoc
change between them prevents their complete source closures from matching.
Run 00211 repeats the compact capture with the exact 00209 closure. Run 00212
authenticates both parents and passes all eight occupied-field hashes bit-for-bit,
with zero nonzero empty slots. The compact 998-node layout omits 132 empty slots
and saves 103,926,240 peak logical field bytes versus the 1,130-slot control.
The compact capture's 31,845 ms concurrent build is not a build-time pass.

The next application correction uses an experiment-owned receiver sampler with
the canonical 32-direction ingress, unchanged transport equations and GPU
irradiance reducer, but fence-backed asynchronous readback. It restores the
renderer target while waiting and retains in-flight resources until completion;
cancellation is checked between completed GPU operations. A new owned-context
WebGL allocation observer includes texture, renderbuffer and buffer lifetimes
missed by the backend-only inventory. Run 00213 is checking the resulting
physical replacements, value parity and responsiveness. These sources require
the same mandatory local type check and final primary/audit review as the rest
of P4; readiness is not completed source review.

Run 00213 preserves every measured diffuse receiver value bit-for-bit relative
to 00210 after cooperative readback. All CPU/GPU rays pass; the second frame's
maximum preparation UI gap is 54.6 ms. Cold and physical-replacement gaps remain
186–264 ms under concurrent references, so responsiveness does not pass. Actual
GL allocation tracking observes a 1,047,724,580-byte peak, separately from the
33,592,320-byte shared host phase and backend-owned host data copies.

Run 00214 delivers the first ordinary six-box application still and successful
height/albedo/power replacements. The familiar meshes/materials, six per-object
4096 maps, PCF filtering, bias, normal bias, radius and shadow strength come from
the ordinary scene. Exact measured receiver spectra drive the light color and
intensity; each object's finite-source direction uses that same frame's source.
There is no film lighting interpolation or shared film shadow map. Observed GL
payload peaks at 1,079,260,912 bytes; complete logical admission still requires
the accompanying host payload inventory and repeated timing qualification.

During staging, the ordinary scene copies its last complete displayed pixels
to an owned snapshot texture, then retires its lazy shadow-map storage. Its
fields, meshes, shader bindings and exact lighting facts remain leased. A failed
replacement can resume that old exact scene; successful publication releases
the old renderer lease before lazily allocating the new frame's ordinary maps.
This changes storage lifetime during a frozen frame, not shadow settings or the
completed rendered image. Run 00215 proves the preserved pixels bit-identical
and repeats GPU compile failure, cancellation, resource rejection, supersession
and final disposal while a renderer still leases the complete old frame. Those
cases pass, with complete final backend retirement. Whole-application numerical,
resource and temporal qualification remain open.

New-source spatial reference 00205 completes its first bisection. Raw comparisons
of the 998-node candidate have no per-channel 10-percent J2/J3/J4 failures, but
J4's p95 normalized RMS is 0.022855, above 0.02. Its largest errors occur at the
outer cylinder. This is not qualified rejection: independent spatial/angular
uncertainty remains open. Investigate a distinct geometric bisection of existing
boundary extinction-length support: 0.25, 0.5, 1, 2, 4, 8 and 16 lengths per row.
Retain physical equations, all limits and the unchanged 998-node control. Nodes
derive from physical scale intervals, never fitted values. The new policy must
pass a fresh capture, independent accuracy and its own complete resource budget.

The fresh checkpoint adviser recommends preserving this coherent developmental
P3/P4 slice now, with message `feat(experiment): add local-Sun shell cache reuse
prototype`. It treats the unfinished numerical and responsiveness gates as
documented continuation work, not completed qualification. Prior automatic
approval review rejected Git mutation pending direct owner acceptance; no retry,
staging or checkpoint was performed. This does not block further authorized
experiment work or read-only review.

Run 00217 derives 1,049 nodes by bisection of the physical boundary-scale
intervals. Run 00219 passes 21,424 positive-stencil queries. Capture 00218 is
finite; runs 00220/00221 pass complete independent J1/J2 reconstruction. Against
the still-unqualified spatial reference 00205, raw J4 p95 normalized RMS falls
from 0.022855 (998 nodes) to 0.017051 (1,049 nodes), with no per-channel physical
failures. This is a developmental improvement, not higher-order acceptance.
Run 00216 captures Flat 45 with the preserved 998-node policy; Flat 90 remains
unopened for candidate results.

P4 readiness v3 refresh passed architecture and contracts with request
`9543e22188a0b366ed7bcb60fa89871c26b6b68935af0e311845b523507f4460`.
Contexts are `sha256:feab617323870f7d7e2a0e5964740811d6f7a13519bda5fb7cbaaba551534108`
and `sha256:6260ddfca19e2b82b554e546395219a62da8944fa6571aab0b19cd4f4b7cc94d`.
This is readiness only; final source review must include later resource-bound
changes and all relevant collaborators.

Run 00222 rejects height replacement before allocation under the old admission
estimate. Question: does the added boundary resolution make replacement
inherently inadmissible? Decision: first correct double-counted shared phase
ownership and model the actual pass-resource lifetimes. The phase GPU texture
retires before accumulation's three-scattering-field peak; one shared host
phase is outside individual cache owners. Do not raise the 1.2 GB limit.
The new bound includes retained cache-local numeric support, transient backend
host copies, and both complete frame target sets. Allocation observations remain
an independent check on that bound.

Run 00223 completes the 1,049-node ordinary-scene height/albedo/power replacements.
Every prior displayed frame remains bit-identical; all measured CPU/GPU rays
pass. Maximum admitted payload is 1,196,700,640 bytes. Observed GL allocation
peaks at 1,113,240,964 bytes, separately from shared host phase 33,592,320 bytes
and maximum backend host program-copy payload 33,685,900 bytes. These diagnostic
observations do not yet close full resource or repeated timing qualification.
Cold preparation is 33,043 ms; replacements take 19,707–43,986 ms. Maximum UI
gaps are 165–235 ms, still above 100 ms under concurrent native-reference load.

Old-source spatial run 00184 completes after 10,688,416 ms. Its unchanged-source
three-level family passes J2 but remains inconclusive for higher orders and
transported/grid quantities (00224). Many cells meet the uncertainty magnitude
but fail the required decreasing-difference criterion; some transported cells
also exceed the budget. Retain this evidence without relabeling it as the newer
L4-capable reference. New-source spatial and angular computations continue.
No fatal physical flaw has been established; complete independent views and
receiver uncertainty remain required.

Run 00225 exports the independent coarse binary64 source-function grids without
changing recurrence arithmetic. Run 00230 compares every shared ten-quantity
scalar with 00190: all 44,100 values are bit-identical despite independent worker
scheduling. Current-source export refinements 00236 (spatial) and 00237 (angular)
are computing separately from the preserved pre-export reference families.

Run 00227 proves actual application observer movement and a coverage exit. The
old domain rejects the outside observer; a newly built 1,050-node compact domain
admits all ninety-six rays, preserves prior displayed pixels bit-for-bit and has
zero CPU/GPU ray failures. Endpoint error is below 3.73e-9 metres. Its conservative
observed application payload bound is 1,184,978,512 bytes. This is lifecycle,
coverage and parity evidence, not physical qualification of the enlarged domain.

Runs 00232/00234 repeat omission on the 1,049-node selected development policy.
All eight occupied-field hashes match the equivalent 1,181-slot unculled build
exactly; empty slots are zero. Omitting allocation and computation saves
103,926,240 peak logical field bytes. Run 00235 is independently repeating the
full seven-rotation/three-translation fresh/reused matrix under this policy.

Question: can the native recurrence diagnose actual sky and ambient light,
rather than only withheld scattering/transport samples? Decision: export its
independently computed normalized source functions and integrate complete finite
camera rays plus independently refined receiver directions. Candidate directions
and geometry are ingress; candidate values remain comparison outputs only.
The derivation and separate convergence obligations are owned by the reference
method. No production or historical result is changed.

Run 00228 preserves a rejected analytic-integrator probe that mistakenly applied
the finest invariant bound to every coarser rule. Run 00229 keeps every coarser
error but applies the closed-form bound to the finest rule: maximum error
4.53e-14, endpoint error 7.86e-10 metres, constant-stencil error 4.44e-16.
This does not change any frozen physical or convergence gate.

Run 00231 captured consumer source too late during concurrent edits; it remains
diagnostic and cannot qualify executed-source provenance. Decision: freeze source
at entry, before parent authentication or integration. Run 00233 repeats all
ninety-six rays and diffuse irradiance with reliable early source capture; no
raw physical-limit failures occur. Runs 00238/00239 refine view quadrature and
00240/00241 refine receiver directions. Run 00243 passes all ten complete-view/
receiver order quantities' Gaussian 8/16/32 convergence. Run 00242 retains
receiver 128/256/512 inconclusive cells: uncertainty magnitude is small, but
some channels fail the required reduction by two. Continue refinement without
waiving that rule; raw receiver agreement is not acceptance.

Question: do newly added class/public contracts meet canonical type placement?
An early contracts consultation identifies the publication class exported with
functions and an inline public identity shape. Decision: move the class into its
own implementation module, name the ambient public identity and capability, and
add its dedicated same-name declaration. Apply the same placement to the new
receiver/resource/scene owners and separate the runtime calculator from runtime
factory functions. Local type checking passes after these moves. This consultation
is not the required final primary/audit source review; implementation gates remain
open. A standalone scalar comparator now keeps the independent view consumer's
executed math closure separate from evolving application/model modules.

The P5 temporal/resource/benefit qualification unit is declared before coding.
It owns experiment-local exact-time state generation, self-verifying GPU motion
and repeated timing runners, and any owned application worker bridge needed to
keep the real app responsive during GPU preparation. Existing P3/P4 numerical,
publication, scene and proof collaborators remain in its dependency inventory;
their open qualification gates are not inherited as passes. Capture baseline
`.codex-tmp/review-standards/session-F3zwty/baseline.json` before these edits.
Recording and production promotion remain unselected.

P5 baseline capture completed at `session-F3zwty/baseline.json`; architecture
and contracts acknowledge readiness request
`0eaebc2669a648f6420bd965ace8b5091a0bf725589d64d11a76dbe0322e35c9`.
Their contexts are `sha256:86f104c35bb385be7f8ec57ac6a17881365fd69b661b6a96542911288d7c97db`
and `sha256:460063d6cf7ae52b1808b2373e7e86aff036f3d96cc8cb7ddbc260212e8b28c1`.
Readiness is not source-review completion.

Run 00251 authenticates the selected 1,049-node policy's complete synthetic
seven-rotation/three-translation matrix: all field hashes, reconstruction,
complete rays, endpoint, source/coverage and paired RGB gates pass. Orbital and
physical qualification remain separate. Run 00281 freezes this numerical
selection and its actual source closure before opening orbital Flat90 results;
it explicitly does not accept unresolved physical or resource cells.

The P5 application bridge transfers the real canvas to an owned worker and
measures the page event loop separately from worker preparation. Run 00253
passes page responsiveness (31.8 ms maximum gap), exact rays and prior-pixel
preservation. Run 00257 preserves the failed replacement timing measurements.
Runtime height/albedo uniforms and removal of the unused inherited radial-node
declaration keep view/receiver shader sources identical across unchanged,
height, albedo and power requests. Run 00271 measures 27.8 ms page gap,
20,571/18,109/20,174 ms physical replacements and a conservative observed
1,184,190,544-byte application payload. All measured CPU/GPU rays pass and prior
pixels are identical. These are single runs under concurrent reference work,
not exclusive repeated performance qualification. Pending GPU build work is
included in complete preparation through the receiver fence; CPU submission
time alone is not reported as completed build time.

Run 00275 repeats compilation failure, cancellation, rejection before
allocation, actual GPU supersession and disposal with a live renderer lease.
Each preserves the complete prior frame and retires owned fields at final
release. Run 00278 repeats actual observer movement and coverage-exit replacement
through the worker app; no measured ray fails and endpoint error is below
3.73e-9 m. The enlarged domain's physical accuracy remains open.

Run 00265 freezes 600 exact physical states at 48-second physical intervals,
120 around each cadence angle, without candidate evaluation or interpolation.
Run 00263 retains the failed initial closure discovery. Complete receiver
reference refinement now uses independently weighted positive Gaussian polar
and periodic azimuth rules within the original 1,024-direction cap. Run 00277
passes the azimuth axis; run 00276 retains unresolved coarse polar cells.
Run 00267 preserves a rejected source-family mismatch after documentation/
formatting edits; no old identity is relabeled. Current consumers share the
stable formatted closure. Native angular run 00200 completes; its three-level
family 00279 remains inconclusive under the unchanged convergence rule, so
higher-order physical admission stays open. Native export refinements 00236
and 00237 complete, and 00280 is computing the second spatial bisection.

Runs 00287/00289 execute two identical exact-time states through retained and
separately built fresh caches. Run 00290 preserves a verifier rejection caused
only by nondeterministic Rollup watch-file inventory ordering; 00291/00297
compare sorted complete identities and pass all spectra and RGB bit-for-bit.
Two states remain diagnostic, not a 120-state temporal pass. Full reuse run
00292 completes all 120 Flat0 states: 119 actual builds avoided, zero measured
CPU/GPU ray failures, 61.6 ms maximum page gap, 1,163,596,276-byte conservative
application payload and 0.3-0.7 ms center-state warm rendering after one warmup.
The full fresh control is computing. Its longer protocol timeout is the sole
permitted launcher-source difference in temporal comparison: the verifier
derives and hashes that exact text replacement, checks all runtime identities
and complete physical recipes, and retains both original launcher identities.

Uniform Gaussian receiver polar refinement 00286 still has small but unresolved
changes. A positive horizon-focused composite trapezoid control 00293-00295
does not resolve the original budget (00299); it is preserved unqualified.
A distinct horizon-focused Gaussian receiver rule is being measured within
the same 1,024-direction cap. For native construction, the new reference-only
hemisphere rule splits the Gaussian polar integral at the physical ground
horizon, then maps each half with the original sinh5 transformation. It places
support nearer grazing rays without changing field equations, candidate nodes
or physical acceptance. Each input records a distinct polar-rule identity;
old and new angular families cannot be mixed. Its source and normalization
are independently recorded, and all three-level budgets remain required.

Run 00304 independently checks positive direction weights, unit directions and
analytic sphere/hemisphere moments for the horizon-focused rules. These are
quadrature invariants, not transport acceptance. The Gaussian sinh5 receiver
family 00305 qualifies primary radiance, L2 and total irradiance but retains one
unresolved channel in each of L3/L4. The alternate polar family 00312 qualifies
the higher orders but fails primary/total budgets; its azimuth family 00311
retains higher-order rate failures. The square-coordinate family 00316 qualifies
primary/total but retains higher-order rate failures. None supplies complete
receiver acceptance, and passing subsets have not been assembled into a false
whole-family pass. The horizon-split native construction 00300/00309 now has two
completed levels; its next angular bisection is computing in 00317.

Question: how should the remaining lengthy exact-time workload run without
overlapping GPU owners or losing individual evidence? Decision: an owned
sequential matrix launcher invokes the existing fresh/reused capture and
comparison proofs, retaining every child identity and completed cell. It records
120 actual constructions per fresh trajectory, never substitutes field hashes
for those executions, and stops if a required temporal comparison fails. Scene
and sky-only workloads stay explicitly separate. Local type checking passes.

Expanded P3-P5 readiness v4 is acknowledged by architecture/contracts for
request `23f732438d4524dcc2e1f60c0b561a2e175b7d5a27356edac4ae9f4ca9a6f38c`.
Contexts are `sha256:01e87b4ff7b2429f14c8a8d9d042235859e330048895ad3b2f356b3e89278b48`
and `sha256:ad0ed9779e4962a2d6ad37c48546d342d14553fe38157d80a8f9d0657afc882e`.
Later matrix-source/context changes must be included in final review refresh;
these readiness acknowledgements are not completed source review.

The fresh P5 checkpoint adviser recommends the coherent contained prototype
with message `feat(experiment): add local-Sun shell cache reuse P3-P5 prototype`.
It explicitly leaves physical, full-matrix, repeated-resource and source-review
gates open. The prior automatic Git-approval rejection still applies; no staging
or commit was attempted.

Run 00329 completes the full 120-state Flat0 fresh/reused temporal proof. All
sky radiance and transmission channels are identical; receiver derivative
residuals remain below 3.52e-7, against frozen 0.002/0.004 limits. Maximum RGB
byte difference is one, p95 zero, and all frame/end-point/parity checks pass.
The verifier authenticates complete parents but retains only measured proof
quantities, avoiding duplicated allocation histories from their large aggregate
results. Its scoped parent reader can begin with a small recipe artifact while
still checking every sealed artifact. No parent result is changed.

Run 00333 executes the remaining four colored-scene and all five sky-only
120-state pairs sequentially. Each child retains its own actual executed closure
and complete parent identities; the matrix's initial collaborator snapshots are
starting provenance, not a claim that later child verifier source is unchanged.
Application/field source stays frozen while each fresh/reused pair executes.
There is no encoded video or presentation interpolation.

Independent receiver polar integration split at native knots passes all orders
in 00327; its azimuth refinement also passes in 00332. Their finest grids differ,
so no combined acceptance is claimed. Question: can both axes share a final
1,024-direction grid without dropping unbounded light? Decision: retain a
declared positive envelope for the tiny interval below the first positive
independent polar knot, mu=0.00035713769265339855. Its cosine mass is pi*mu^2.
Because a positive attenuation integral cannot exceed its maximum normalized
source function, each higher-order bound uses the maximum authenticated native
coefficient; primary incidence/phase/scattering bounds are analytic. No mass
renormalization is applied, and the bound is added once to the final budget.
Run 00336 passes the retained-domain analytic moments. Polar family 00342
passes, but azimuth 00343 fails primary/total budgets. The alternative common
32-by-32 grid passes azimuth (00350) but fails polar (00349). Preserve those
inconclusive cells rather than combining passing subsets from incompatible
finest grids.

The next bounded receiver reference uses positive Gaussian samples on both
Sun-aligned half circles. Alignment comes only from physical source geometry;
both halves are evaluated independently. This addresses the measured primary
forward-scattering peak without changing the cache, equations, spectrum, limits
or actual 1,024-direction cap. Its common finest grid is 64 polar by 16 azimuth;
both polar and azimuth three-level families require fresh measured convergence.

## 2026-10-09 Execution Interruption

The owner terminated the overnight workload because of high memory use and
VS Code unresponsiveness. Saved progress stops around 13:17 UTC. Run 00333's
matrix was interrupted during 00335's fresh Flat45 trajectory, around publication
91 of 120; 00334's reuse capture completed, but that pair has no completed
temporal proof. Native reference runs 00207, 00280, 00288 and 00317 were still
unfinished. Receiver probe runs 00358-00362 completed as diagnostic captures;
they do not establish combined convergence or complete physical admission.

Four native reference jobs used twelve workers concurrently with browser
captures and other verification. One host-memory observation left roughly
4.4 GiB free on the 31.8 GiB machine; peak memory was not measured. Capture
results repeated cumulative allocation histories per frame and again in the
aggregate, producing roughly 185-302 MB result files and additional live-object
overhead. The application's logical payload budget did not bound the overall
execution workload. Compact retention in the temporal verifier did not fix
the producer's duplication. Execution failed to enforce an aggregate host
resource budget or stage the remaining matrix behind decisive physical checks.

A read-only process check after termination found no surviving heavy reference
jobs, with about 14.6 GiB free. No workloads were restarted. Completed sealed
evidence remains valid within its claims; interrupted output remains incomplete
and must not be reopened or overwritten. The
[plan](plan.md#remaining-work-and-execution-controls) owns resource corrections
and the remaining execution order. P3-P5 completion gates and final reviews
remain open; production and the recording are unchanged.

## Resumed Resource And Reference Work

The owner reselected remaining-plan execution, stopping before video generation.
Review baseline: `.codex-tmp/review-standards/session-F7R3b4/baseline.json`;
architecture/contracts readiness request `95a4e4b9746380c22b63e3d68f66401f8a872ad2f72b4555e82441c939ac6058`
is acknowledged. Readiness is not completed source review.

Decision: launch a single heavy job through `run-resource-bounded.js`, with an
8 GiB owned private/working-set stop threshold, an 8 GiB machine free-memory
reserve and a bounded duration. Samples include the wrapper and its owned child
tree; limits are sampled stops, not kernel allocation caps. Unavailable telemetry
fails closed. Streaming complete-inventory hashing and per-frame event-prefix
references remove avoidable payload duplication without changing evidence.
Old runs remain immutable. Resource/source verification remains in progress.

Runs 00364/00366 reuse the saved phase-aligned receiver captures: polar refinement
passes, azimuth does not. Run 00368 builds the missing hemisphere-split angular
reference alone, under resource wrapper 00367. No full render matrix is launched.

Question: can a narrow primary phase peak be resolved within the existing
receiver direction cap? Decision: investigate a physical phase control variate.
At each polar row, fit the known Rayleigh/Mie observer phase functions to two
already computed independent primary rays, subtract that model from measured
primary samples, and restore its independently integrated azimuth mean. No new
transport directions or candidate values enter. Retain all raw rays, the signed
correction and its phase-integration refinement bound. Higher orders remain
unchanged; all common-grid and convergence gates still apply. This is a reference
integration correction, not a candidate equation or acceptance-limit change.

Runs 00377/00378 pass focused retention and physical-phase calibration. The
representative 120-frame event representation falls from 56,622,940 bytes to
967,680 bytes with complete prefix/order and hash checks. Analytic phase mixtures
agree with an independent dense periodic sum within 4.45e-16; a dark primary
field retains exactly zero. Run 00379 is an expected rejected second launcher
while 00367 owns the heavy-job lock; it launches no computation and leaves the
running job untouched. These are observed focused proofs, not final source review.

Runs 00380-00384 apply the calibrated correction to unchanged saved independent
rays, retaining original transport provenance and recomputing candidate receiver
comparisons. Runs 00385/00386 pass all polar/azimuth quantities and channels on
the same finest 64-by-16 receiver grid. The phase-only bound is below 3.7e-16;
positive horizon and phase bounds are included once. Native construction
spatial/angular/path budgets remain separate and unresolved. The full render
matrix remains unlaunched while the missing native angular reference completes.

The native consumer now shares aligned little-endian field buffers after complete
finite/positive validation rather than retaining a second numeric copy; other
endianness/alignment retains explicit decoding. String policy unions now have
documented ambient aliases. Local type checking passes. The resumed source unit's
primary/audit standards gates remain open until the implementation stabilizes.

Run 00368 completes the guarded finer angular reference in 1,397,847 ms,
with 797,831,168 bytes peak private memory and 15,204,302,848 bytes minimum
machine free memory. Run 00388 rejects its convergence family because the
azimuth offset differs: 0 instead of the coarse levels' midpoint 0.5.
Question: can that diagnostic be treated as the planned bisection? Decision:
no; preserve it and repeat the finer level with the matching midpoint policy
in 00392, alone under wrapper 00391. No identity or gate is changed.
Run 00390 consumes the coarse native export through the physical primary
control; all raw 96-view and receiver channel limits pass, without closing
combined construction uncertainty. Run 00387 repeats analytic ray integration:
finest error 4.53e-14 and endpoint error 7.86e-10 metres.

The first resumption primary reviews return findings, not completion evidence:
`.codex-tmp/review-standards/session-F7R3b4/arch-primary-v2.json` and
`types-primary-v2.json`. Ambient external type-import expressions are replaced
by the available Three namespace contracts; local type checking passes.
Heavy entry points now require an inherited capability matching the checked
exclusive lock and live wrapper PID. Run 00393 proves unguarded admission is
rejected without heavy computation. Positive guarded admission and refreshed
primary/independent audit evidence remain required. Active-topic wording is
refreshed; these review corrections do not qualify the whole P3-P5 matrix.

Run 00392 completes the matching-midpoint reference in 1,378,769 ms under
wrapper 00391: peak private memory 796,532,736 bytes and minimum machine free
memory 14,667,825,152 bytes. Run 00394 retains unresolved angular channels in
all ten quantities. The maximum J2 uncertainty fraction is 1.02545 of its
acceptance tolerance at point [0,0,5], outgoing vertical, channel 14; the
required fraction is 0.1. Primary L1 has only tiny numerical rate failures,
while every primary uncertainty magnitude is far below budget. No pass is claimed.
Runs 00395/00396 prove positive guarded admission; unguarded admission was
rejected in 00393. The actual heavy entry points enforce that launch contract.

Question: how to improve angular accuracy without simply multiplying the heavy
workload? Decision: try a positive Gaussian mapping with support at both
hemisphere endpoints, and remove unused field-grid cuts from analytic primary
transport. The reference method owns the exact equations and fresh-evidence
requirements. Declare this coherent independent-reference correction unit
before coding and capture baseline
`.codex-tmp/review-standards/session-YSBQ8p/baseline.json`. P3-P5 source and
qualification gates remain open. All new heavy runs remain individually bounded;
the full browser matrix and video remain unlaunched.

Both required lanes acknowledge readiness request
`1ed8aa60f25e73d41c1488a114ddb76be1f748f522bc9bf677bdecb35616f16e`
for that unit. The native source now has SHA-256
`1fe9f77caa6a4d3f808cedf8093673d881758fa1cf277400fca18057b04bae79`.
Run 00404 passes positive spherical moments, unit-direction checks and a
closed-form squared Cornette-Shanks phase integral at g=0.7. The finest
endpoint-supported phase-product error is 3.10e-14; coarse errors remain recorded.
Local type checking passes. Run 00406 completes its first new angular level
in 72,346 ms under wrapper 00405, peaking at 232,615,936 private bytes; the
next level is computing in 00408. These are developmental measurements, not
physical acceptance. Run 00403 preserves the former family's unresolved
complete-view angular channels even though all raw candidate limits pass.

Question: how to return exact large reviewer ledgers while specialists remain
read-only and their tool stores/sessions are isolated? Decision: the parent owns
a bounded loopback RAM receiver and artifact persistence, while reviewers send
compressed report chunks. Reports retain their actual actor, request fingerprint
and checked digest. No reviewer writes files or Git state. Earlier reports remain
historical findings/readiness records; final primary/audit validation is still open.

Run 00408 completes the middle endpoint-supported angular level in 290,475 ms;
00410 completes the finer level in 1,184,256 ms, under wrapper 00409. Its
peak private memory is 829,620,224 bytes, with minimum machine free memory
13,886,861,312 bytes. Primary query L1 is bit-identical across the family.
Run 00411 retains unresolved higher-order channels: direct J2/J3/J4 uncertainty
magnitudes fit their individual budgets, but not every decreasing-difference
criterion passes. Interpolated fields and transport additionally retain magnitude
failures. These are reference failures, not evidence of a candidate rejection.

Complete-view consumers 00414/00416/00418 have no raw sky or receiver failures.
Run 00419 retains unresolved higher-order angular uncertainty; the largest
view-L2 uncertainty is 0.47464 of its comparison tolerance, above the required
0.1. Total sky and receiver magnitudes fit this axis budget, but some reduction
criteria remain unresolved. No combined physical pass is claimed. Run 00412
records a sandbox spawn denial; the guarded retry runs outside the sandbox
without changing memory or duration limits. Spatial refinement now runs alone.

The independent-reference correction unit has exit-0 CLEAN primary/audit
validation at `.codex-tmp/review-standards/session-YSBQ8p/validation.json`,
fingerprint `a1a97ca1efea9f98836b12d97aa37155b15c8f0de18fe32fa6795a6a42da2270`.
Architecture covers 1,707 obligations and contracts 119. This applies to the
reviewed correction and captured context, not complete P3-P5 source or physical
qualification. Subsequent governing-context changes require a fresh final
request; preserved reports are never relabeled.

Question: can changing interpolation support explain nonmonotone angular
differences even after the phase-integral calibration passes? Decision: test
an independent nested outgoing-polar support, keeping incoming quadrature,
physical equations and all acceptance limits fixed. The existing reference
stores outgoing values at nonnested Gaussian incoming nodes plus the poles;
each bisection moves those interpolation knots. The proposed control stores
outgoing values at symmetric hemisphere `sin(pi*k/(2*n))^2` nodes, including
zero and both poles, so doubled levels retain every old interpolation node.
This is a hypothesis, not a claim that all remaining error is interpolation.
The current spatial run has already compiled its own frozen source copy and
continues unchanged. Capture a new correction baseline under
`.codex-tmp/review-standards/session-EU8ZD9/` before coding. All comparison
families require fresh matched native source and consumer identities.

Local checkpoint `66017327` saves the contained prototype and open gates.
The parent erroneously continued to commit after the staged whitespace check
reported CRLF line endings. Repair checkpoint `38cfe900` converts the eight
affected authored text files to LF, with no text changes under
`--ignore-space-at-eol`; staged whitespace and local type checks then pass.
No protected run, C# source, production implementation or commit history was
rewritten. Future dependent evidence uses the actual new closure identities.

Both required lanes acknowledge nested-reference readiness request
`80d72b1926ef4c6075fec525ae146a1ac9a263601229827a87433c0b593d4fdc`.
Run 00422 passes ordered/finite, pole/horizon, symmetry and exact nesting checks
for outgoing levels 8 through 128, alongside the unchanged angular analytic
calibrations. Local type checking and whitespace checks pass. Incoming quadrature
is unchanged. Physical angular convergence and source review remain open until
fresh native families and primary/independent audit validation complete.

Nested-reference primary/independent audit validation is exit-0 CLEAN at
`.codex-tmp/review-standards/session-EU8ZD9/validation.json`, fingerprint
`49b7a656e5500a31c31fa96bcc833734b6cc37586dd4c2b7efd29fdf561b733c`.
It covers 2,049 architecture and 153 contracts obligations in that captured unit.
Runs 00424/00428 complete its first two angular levels in 83,636/305,030 ms;
the fine level is running alone. Primary query L1 and direct J2 in 00424 are
bit-identical to 00406, as expected for an outgoing-interpolation-only change.
The source review does not close physical or broad P3-P5 completion gates.

Run 00421 completes the former source's spatial level 1 in 977,611 ms, under
wrapper 00420: peak private memory 904,568,832 bytes, minimum free memory
13,824,933,888 bytes. Its complete-view consumer 00426 has zero raw sky/receiver
failures and a maximum receiver residual of 0.23914 comparison tolerances.
Spatial changes are largest around rho=6,341,820 m, within the coarse grid's
4,172,250-to-8,344,500 m interval. These two levels do not establish convergence.

Question: do loose operator norms prevent a useful numerical roundoff/tail
bound even when fields converge? The current generic phase bound is 18.2062,
while the measured finite phase-row mass is near one. Decision: build a separate
finite-operator bound proof, with baseline under
`.codex-tmp/review-standards/session-tSnPNl/`, without altering native fields.
Derive a checked new bound program from the exact frozen native source in a new
run, replacing only its entry with an authored operator-measurement entry. Replay
all executed grid/query transport kernel cases with no source-field values;
retain positive kernel masses and sample counts. Read authenticated field
maxima one artifact at a time. Bound the continuous primary source with analytic
altitude-interval endpoint envelopes, not fitted or sampled maxima. Combine
finite phase norms, transport norms, stored field envelopes and conservative
floating-point margins to rederive tails/roundoff. This proof cannot waive
spatial/angular/path convergence, and every derivative records its parents,
source transformation, equations and tool identities.

Run 00430 completes the finest nested-outgoing level in 1,270,302 ms under
wrapper 00429: peak private memory 793,759,744 bytes, minimum free machine
memory 15,424,831,488 bytes. Run 00431 retains unresolved angular higher orders.
Primary L1 is bit-identical; direct J2/J3/J4 uncertainty magnitudes fit the
individual 0.1 budgets, but their reduction-rate criteria do not all pass.
Grid J2 reaches 0.14434 comparison tolerances and L2 reaches 0.31907, above
the allowed 0.1 uncertainty fraction. Nested support did not resolve the
physical qualification problem; it is not accepted as an accuracy remedy.

Run 00433 executes the separate finite-operator replay for native parent 00424
under wrapper 00432. It replays 1,547,380 cases at 475 grid positions and 42
distinct query points in 30,983 ms. Maximum positive phase mass is 1.00000000356,
and the transport masses are approximately one. The largest rederived radiance
roundoff bound is 3.93145e-11, and the tail bound is 2.44703e-14. Wrapper peak
private memory is 174,936,064 bytes, minimum free memory 16,835,379,200 bytes.
Local type checking and whitespace checks pass. These are finite-construction
bounds from an unreviewed proof unit, not qualified physical accuracy. Required
source review, consumer arithmetic and empirical convergence remain separate
open gates. No additional browser matrix or video was launched.

Run 00435 repeats the operator proof on middle native parent 00428 with the
final entry-snapshot and exact-case inventory checks. Its phase norm is
1.00000000002912; largest radiance roundoff is 8.60838e-11 and tail is
2.44702e-14. Wrapper 00434 peaks at 187,396,096 private bytes with minimum
free memory 15,762,649,088 bytes. No physical acceptance is inferred.

The finite-operator review request
`.codex-tmp/review-standards/session-tSnPNl/operator-request.json` has architecture
primary/audit reports covering 2,220 rows each. Contracts primary covers 170
rows and finds an inline complex query contract in `types.d.ts`. The repair
extracts documented `LocalSunNativeOperatorQuery`; local type checking passes.
That authored type change invalidates the captured request's freshness. Preserve
the reports as original findings evidence; prepare a fresh request and complete
required primary/audit validation before reporting this unit complete. The
separate native integration/convergence issue remains open.

The repaired finite-operator unit has exit-0 CLEAN validation at
`.codex-tmp/review-standards/session-tSnPNl/operator-v2-validation.json`,
fingerprint `428d5b7d9c388850b46f80fc3368b68fda6c692d405d9ed60fd5e73df51280c6`.
It covers 2,220 architecture and 170 contracts obligations, with actual distinct
primary/audit actors. The new context/type repair is reviewed rather than
relabeling v1. This is finite-operator source completion, not P3-P5 qualification.

After the interruption, no heavy native process or execution lock remained;
the local type check passes. The interruption is not an unresolved runtime
error. The owner explicitly asks to continue while explaining accuracy.

Question: does the nested sine-squared outgoing support underresolve the
horizon relative to incoming integration? At the finest 64-node level, the
first positive incoming cosine is 4.61801e-6, while stored outgoing support
starts at 0.00240764. Decision: test a separately identified nested sine-fourth
support. Squaring that stored coordinate again places the first node at
5.79671e-6 while preserving exact nested support, zero and poles. Keep incoming
quadrature, C# physical helpers and acceptance gates unchanged. This can address
interpolated fields/transport; it cannot fix the separate direct J2 rate failures.
Declare the coherent horizon-support correction with baseline
`.codex-tmp/review-standards/session-4avMFH/baseline.json` before coding. Use a
bounded 8/16/32 family first; inspect its result before any larger refinement.

Horizon-support source validation is exit-0 CLEAN at
`.codex-tmp/review-standards/session-4avMFH/validation.json`, fingerprint
`4242c588accb3496a900cbea504f4b12361a8b676e94ed6049fcbe3e1aa27661`.
It covers 1,707 architecture and 119 contracts obligations with distinct
primary/audit actors. Run 00438 passes both geometric support powers and
unchanged analytic integration checks. Runs 00440/00442 complete the first
two native levels in 23,054/93,456 ms. Physical convergence remains open.
The finest former-family operator replay 00437 also completes: maximum
roundoff 2.61959e-10 and tail 2.44702e-14. Its wrapper peaks at 187,944,960
private bytes; minimum free memory is 15,268,982,784 bytes.

Wrappers 00443 and 00445 stop the 32-node reference and its new-run retry
because the PowerShell/CIM resource census fails. Their largest measured
private memory is 287,776,768/201,670,656 bytes, well below 8 GiB. The owned
child trees are stopped; incomplete native attempts 00444/00446 are never
reopened. The numerical equations did not yield these monitoring failures.
The local checkpoint adviser recommends a coherent save, but approved
`git add -A` fails inserting the log blob with Permission denied. Read-only
inspection confirms no staged changes and the existing inherited Git deny
ACLs; do not change protections or treat this as an approval-review rejection.

Question: how to preserve enforced resource sampling after repeated local
CIM failures? Decision: replace that service dependency with a small native
Toolhelp process snapshot plus owned-process memory readings. Retain the
exclusive lock, exact ownership closure, five-second scheduling, 10-second
sampler timeout, fail-closed behavior, 8 GiB limits and 90-minute ceiling.
Compile a pinned source once into each new wrapper run, record compiler/source
identities, and exercise the real guard before retrying the reference. Declare
this telemetry repair with baseline
`.codex-tmp/review-standards/session-BZzuqX/baseline.json` before coding.

Run 00447 fails before launch because the new compiler-identity capture calls
a two-argument hashing helper with one argument. Replace it with a direct hash
of the read-only compiler bytes. Local type and whitespace checks then pass.
Guarded admission 00448/00449 passes with the native collector: peak owned
private memory 145,072,128 bytes, minimum machine free memory 13,465,001,984
bytes, and a 28.08 ms measured collector call. The source repair's required
primary/audit review remains open. The fresh 32-node quartic-support reference
00451 runs alone under wrapper 00450 with unchanged 45-minute, 8 GiB owned
memory and 8 GiB reserve limits. Repeated live samples are succeeding; no
physical acceptance is inferred from monitor recovery.

The telemetry repair's captured primary/audit source unit has exit-0 CLEAN
validation at `.codex-tmp/review-standards/session-BZzuqX/validation.json`,
fingerprint `82b929e9d24ae2b55a5cb707fbd7100f4bf896d9d57dbcead9b83d1217f88e60`:
1,537 architecture and 119 contracts obligations with distinct audit actors.
Reference 00451 completes in 325,724 ms; wrapper 00450 records no failure,
363,270,144 peak private bytes and 12,863,401,984 minimum free bytes.
Three-level angular proof 00452 remains inconclusive. The dominant near-source
L2 change shrinks from 9.45149e-5 to 1.92035e-5, but its uncertainty is still
0.79270 comparison tolerances versus the allowed 0.1; L1 remains bit-identical.

Question: does the outgoing horizon layout address every limiting horizontal
case? Decision: no. At [31,041,540,0,99,000], direction [1,0,0], channel 1,
quartic N32 L2 is exactly the prior squared N32 value 2.1048887140019637e-7.
Both include outgoing mu=0, so this case retains an incoming-integration error
independent of the new outgoing spacing. Keep that limitation explicit. Run
00454 tests N64 under wrapper 00453, unchanged 45-minute and memory limits,
to form a matched 16/32/64 family before selecting another reference change.

Local checkpoint `64321806` saves the 15-path reference/telemetry correction.
A fresh approved read-only token/access probe succeeds; exact pre-staging,
staged-byte and staged-whitespace checks pass. Git emits an object-write warning
during the successful commit, but the named tree object is readable, every
committed file matches the accepted bytes, and the worktree is clean immediately
after verification. No push or permission/ACL changes occur. Feed the exact
multiline message through Git stdin to avoid conflicting skill requirements
about temporary message-file location; no message file is created.

Question: can a small primary-only diagnostic isolate incoming polar versus
azimuth uncertainty before more full recurrence refinements? Decision: derive
an entry from the exact frozen native source and preserve every physical helper.
Evaluate selected independently chosen source/boundary/horizon cases at separate
incoming polar and azimuth refinements, with a common finest grid and an exact
parent-level reproduction check. No candidate values enter or change. This is
diagnostic evidence only, not a full construction or acceptance substitute.
Capture baseline `.codex-tmp/review-standards/session-c62h6i/baseline.json`
before source edits; run the proof only after the current heavy job finishes.

Wrapper 00453 stops native attempt 00454 because its native collector command
fails after repeated valid samples. Peak measured private memory is 806,268,928
bytes, minimum machine free memory 11,992,559,616 bytes: no measured threshold
breach. The current error message omits exit/signal/timeout details, so the cause
cannot be assigned. Preserve the incomplete child and repair diagnostics before
repeating the long workload. Short native-collector proofs remain useful but do
not establish long-job reliability.

Diagnostic wrapper 00455 fails before computation because its label exceeds the
16-character run-name contract. Rename it `p3-primary-angle`. Runs 00457/00459
then reproduce all seven parent J2 quantities and finish in 4,969/18,796 ms.
Selected polar/azimuth uncertainty magnitudes fit the budget, but the ground
boundary's azimuth reduction criterion fails. The source edit invalidates the
first diagnostic request. Its architecture audit also catches a multiline quote
incorrectly assigned to line 1; preserve that original primary as invalid
evidence and require exact single-line source quotes in the fresh request.

Run 00461 fails its product-rule normalization check before native computation
at high azimuth count. Derive each polar rule through one fixed eight-azimuth
product, check its analytic mass, and refine azimuth independently rather than
duplicating identical polar weights. This also removes avoidable direction-array
allocation. Run 00463 finishes the uniform 256-by-2,048 diagnostic in 91,605 ms
but the boundary azimuth reduction remains inconclusive.

Question: can the existing positive quadrant-Gaussian azimuth rule resolve that
boundary more efficiently? Decision: test it with the original continuous primary
transport and phase factors, retaining exact parent reproduction and a common
finest 256-by-512 grid. Add the complete transitive generator source closure to
the early snapshot; no candidate inputs enter. Run 00465 finishes in 41,249 ms
under wrapper 00464: all seven selected polar and azimuth magnitude/reduction
checks pass. Maximum azimuth uncertainty is 0.00006162 comparison tolerances;
maximum polar uncertainty is 0.00005396. Wrapper peak private memory is
202,047,488 bytes, minimum free memory 12,900,925,440 bytes. These are selected
scalar primary J2 diagnostics, not a complete field or higher-order qualification.
Fresh primary/audit source validation for the stabilized diagnostic is required.

The stabilized primary-angular diagnostic has exit-0 CLEAN source validation at
`.codex-tmp/review-standards/session-c62h6i/validation-v2.json`, fingerprint
`732af097eaa17dc1eac6a9526a4c7ddf277276a415d25921b4e1ddd62f58343c`.
It covers architecture 3,161, contracts 411 and verification 138 obligations,
each with an actual distinct primary and independent audit. Verification scope
is the two unchanged imported production-constant collaborators, not an added
experiment testing lane. The first architecture transport retained a wrongly
escaped line splitter and corrupted truncated base64; preserve its invalid
attempt. The actual replacement primary rereads single physical LF lines and
transfers entirely within one Node process; its digest is
`3487109fcf85bcd0da2bdeaf28bee3c5ff8505783ccb111ad0458c62c9d5223c`.
The independent audit verifies every quoted line. This completes that captured
diagnostic source unit, not P3-P5 physical qualification.

Question: can the monitor avoid repeatedly starting a managed executable while
retaining strict fail-closed sampling? Decision: keep one source-pinned collector
alive throughout each owned job, warm it before launching computation, and use
bounded increasing sequence/root requests with checked matching responses.
Capture genuine pre-edit baseline `session-Tcrd8i/baseline.json`; both required
lanes acknowledge readiness `18d0b6963c4bf81cefd60ddf72c3c8e3bc28b03961e214ea911ce957ca7be454`.
The read-only census, ten-second response deadline, five-second sample scheduling,
8 GiB owned-memory limit/reserve, exclusive capability and 90-minute ceiling are
unchanged. EOF retires the owned collector, with bounded collector-only cleanup.
Retain bounded original exit/code/signal/timeout output in resource failures.
This repairs a plausible startup dependency; it does not assign the earlier
unrecorded failure's exact cause. Guarded admission 00466/00467 passes with
85,073,920 peak private bytes and 12,933,246,976 minimum free bytes. Local type
and whitespace checks pass. Sustained runtime proof and the repair's fresh
source-review validation remain open.

Sustained guarded replay 00468/00469 completes the same diagnostic in 36,724 ms,
with all seven polar/azimuth cases passing and identical measurements to 00465.
The persistent collector responds throughout and retires normally; wrapper peak
private memory is 197,849,088 bytes, minimum free memory 12,750,757,888 bytes.
Include the warmup measurement in peaks and enforce the same stop thresholds
before launching heavy computation. The source unit is stabilized for review;
long-job reliability still requires the next full reference attempt.

Run 00470 deliberately tightens the owned limit to 1 MiB. The measured warmup
is 80,998,400 private bytes, so the guard rejects it before launching a child
proof. Its result records the original structured failure, the collector retires,
and the exclusive lock is removed. Exit 1 is the expected prelaunch rejection
for this focused check, not another unexplained telemetry failure. Existing
admission/replay checks and local type/whitespace checks remain passing.

The persistent telemetry unit validates exit-0 CLEAN at
`.codex-tmp/review-standards/session-Tcrd8i/validation.json`, fingerprint
`b6addb71af0f5ddd3a7f1c8028214c0d48715b84146e9d8d36a4c88efb35aef3`,
covering architecture 1,366 and contracts 102 obligations with distinct actual
primary/audit actors. This applies to the captured source unit and context;
subsequent governing-document updates require readiness refresh and the final
experiment handoff must validate current applicable evidence. Long-job
monitoring and complete native accuracy remain open. The adviser recommends
saving the diagnostic/monitor correction as a coherent local checkpoint.
