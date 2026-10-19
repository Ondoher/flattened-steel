# H97-H104: phase-aware integration of shared illumination samples

Status: completed with a negative phase-only and exploratory/cost-limited
reconstruction disposition. The [results](phase-cell-integration-results.md)
own the outcome; the [execution record](phase-cell-integration-execution.md)
owns decisions and verification. Accepted00581 completes H104; H101-H103
conditional broad/fresh/native/B1/scenes were not triggered. Production and
prior evidence remain unchanged; the experiment remains open.
The owner-requested independent scientific critique is incorporated, including
error attribution, normalized uncertainty, forward validation, real-cell
equations and measured builder feasibility. This is not a standards-review lane.

## Goal and falsifiable prediction

Test whether integrating the Mie phase function over angular cells, while
reusing one set of incoming-light samples, removes the near-Sun/sideways
tradeoff found in [H89-H96](structured-incoming-results.md). Preserve the exact
paper and Toronto optical profiles, source, transport and boundary conventions.
This initially concerns spherical geometry/distant Sun and pure atmospheric J2
with a black boundary. Flat/local geometry needs a separate matched extension.

The expensive quantity is incoming radiance L at a position, wavelength and
previous scattering order. Reuse it across outgoing cache directions. Let C_i
be a complete angular partition, with sample omega_i in C_i and nonnegative
phase function P per steradian. Define:

```text
K_i(v) = integral over C_i of P(omega dot v) dOmega
M_cell(v) = beta_M * sum_i L_i K_i(v)
D_cell(v) = sum_i K_i(v)
J(v) = R_existing(v) + M_cell(v) / D_cell(v)
```

Keep the current shared Mie normalization equation; sum all cells before
division. Record raw numerator, phase mass and normalized Mie separately.
Correct cell integration should make D approach the independently known unit
mass without fitted area rescaling. Initially hold Rayleigh at its existing
point-quadrature value to isolate the Mie intervention. This is a build-time
operator; the final runtime shader remains a cache lookup.

Prediction: phase-only refinement at fixed L samples reduces both the raw
near-Sun numerator deficit and the sideways denominator error, instead of
moving one into the other. Alternative: the remaining error is dominated by
the representation of L inside each cell; more accurate phase weights then
converge to a biased answer. Distinguish those outcomes explicitly.

## H97: registration, real cells and feasibility

Freeze materials, quantities, geometry/cell identities, look/travel signs,
operators, tolerances, costs, reference identities and decisions before new
atmospheric results. Band3/5/8 mean469.6667/532.3333/626.3333nm: blue/green/red.
Use the original fixed floors: paper4.742795497816345e-14 and
Toronto4.888931382758012e-14. Never recalculate them from a selected subset.

Start with the retained full boundary/horizontal structured grids:

- Bboth64x64 k=.5, both physical constructions, including broad00557 parents.
- Bboth64x64 k=.35, failing construction1 from00559; obtain construction0
  only if it earns repetition. No new light traces are needed for the initial
  common six-point screen.

Gauss weights are integration coefficients, not automatically geometric cell
areas. Do not silently call them cell areas or assume Gauss nodes are centroids.
Construct and authenticate an actual full-sphere partition first. Preferred
initial construction uses dual polar strips within each registered polar panel,
with edges at neighboring physical-cosine midpoints and the panel endpoints.
Within a strip, extend the ring's ground/horizontal azimuth sectors along their
actual physical boundary curves as polar cosine varies. Define dual cells
inside each sector with its own boundary endpoints. The complete azimuth domain
is periodic; an individual ground/sky sector is not periodic across its ends.
Charge extra cells/samples if a boundary/topology repair needs them.

Freeze executable cell equations before numerical admission. For sorted sample
cosines m_j in a registered polar panel [a,b], strip edges are a, the neighboring
physical-cosine midpoints, and b. Let b_s(m), b_(s+1)(m) be the ordered, unwrapped
azimuth boundary curves of one sector. At sample ring m_j define:

```text
t_jsk = (phi_jsk - b_s(m_j)) / (b_(s+1)(m_j) - b_s(m_j))
t cell edges = 0, neighboring t midpoints, 1
C_jsk = {m in strip_j,
         phi = b_s(m) + t * (b_(s+1)(m) - b_s(m)), t in cell_jsk}
dOmega = (b_(s+1)(m) - b_s(m)) dm dt
```

Use physical Sun cosine m here: its solid-angle measure already incorporates
the warp, so do not multiply its Jacobian twice. Include construction1's
artificial polar bisectors as registered panel edges, and continue its azimuth
bisectors deterministically as midpoint curves of the parent sectors. Label
sectors and children explicitly; do not reconstruct their identity from node
indices. Use one half-open ownership convention at shared boundaries/poles.
Zero-length sectors at tangency have zero measure, not an extra sampled cell.

Prove single coverage, positive physical area, total4pi, sample containment,
periodicity, polar caps, coalescent tangencies, aligned Sun/up fallback, altitude0
and both constructions. Sector topology may change only at registered polar
breakpoints; reject an invalid construction before radiance. Cells must not
bridge an identified ground/sky illumination discontinuity and then pretend
one sampled value resolves both sides. If the proposed partition cannot satisfy
these properties, register a simpler boundary-conforming partition and its own
matched point control before scoring; do not force retained samples into it.
Add independent physical membership/area checks against saved cell bounds,
actual ground intersections and cap measures. C-star must use a separately
implemented membership calculation, not the weight engine's cell-index routine.

Record which retained L values match exact physical nodes, material, solver
and path resolution. New representative nodes require new traces. A value at
a node is not a measured cell-average; piecewise-constant L is an explicit
approximation, not an exact reconstruction.

Audit full-builder scaling before a large numerical sweep. Rows vary in
altitude/Sun geometry; phase tables can vary by wavelength. A dense
location x outgoing x cell x wavelength K matrix can be far larger than the
L field. Stream bounded outgoing/cell blocks; estimate persistent storage,
scratch, bandwidth and recomputation across N2-N4. Claim reuse across bands,
locations or orders only after exact identity and scheduling checks. Record
ray-tracing work and phase/geometry integration work separately. Deliver actual
row/outgoing/band counts from the authenticated builder, a scheduling diagram
for N2-N4, and a measured representative weight/reduction block before broad
expansion. For scale, float32 weights for4096outgoing x4096cells x40bands need
2.5GiB per physical row; the existing4374outgoing count needs still more.
Specify which blocks survive across orders, which are recomputed, and whether
any compression is independently qualified. Streaming reduces peak storage,
not the underlying computation. Charge setup, phase-table upload and bandwidth.

## H98: qualify phase-cell weights without light tracing

Develop the weight engine independently of atmospheric L. GPU is preferred
for large phase-only integrations; CPU handles cheap geometry and reductions.
Freeze its coordinate system, refinement sequence and tolerances before H99.
An outgoing-centered phase-coordinate integration is a useful independent
check against direct integration over the source-centered physical cells.
For Toronto, respect the actual tabulated cosine knots and per-steradian
convention; analytic paper phase and the tabulated profile both participate.

Require nonnegative finite weights, full mass error <=1e-6, and two successive
refinements with sum_i abs(K_fine-K_coarse) <=5e-4. These differences are
convergence diagnostics, not certified error bounds against the exact integral.
Use beta_M * max_i(abs(L_i)) * sum_i abs(deltaK_i) as a raw-numerator
perturbation diagnostic after L is available. Also include denominator changes:

```text
abs(M_f/D_f - M_c/D_c)
 <= abs(M_f-M_c)/D_f + abs(M_c)*abs(D_f-D_c)/(D_f*D_c)
```

Require positive denominators. Qualify the normalized result by agreement with
independently refined C-star in the other coordinate/membership implementation.
Propagate a conservative numerical M/D envelope through total J and decisions;
positive numerator/denominator intervals permit ratio endpoints M_lo/D_hi and
M_hi/D_lo. Do not label an empirical refinement envelope a rigorous certificate.
Before a close decision, its normalized-output uncertainty must be <=0.1% of
the reference/frozen-floor scale and the decision must remain unchanged across
the envelope. If the envelope exceeds10% of distance to an active decision
threshold, refine or report unresolved. Unit mass alone does not qualify cell
allocation; global rescaling cannot repair a failed engine.

Test constant L, smooth directional fields, narrow lobes displaced from the
Sun, and discontinuities placed on and near cell boundaries. Check the
continuous target separately from the piecewise-constant representation.
For example, integral P=1 gives the constant-field target; a continuous linear
field has a target from the independently integrated first phase moment.
Its sampled piecewise-constant approximation need not reproduce that linear
target exactly. An independent integral of the same piecewise-constant field
isolates K error from illumination-representation error.

First images: cell boundaries and sample positions; phase-mass distribution
for near-Sun and sideways outgoing witnesses; convergence/error versus work.
Retain signed per-cell numerator contributions at both failure witnesses and
show illumination concentration around the Sun separately from phase-weight
concentration around the outgoing direction.
Do not show three-band diagnostics as sky-color swatches.

Early hatch: fix invalid cells or phase conventions before any light tracing.
A numerically valid but expensive engine may receive one bounded scientific
mechanism test. It cannot earn a practical-builder claim from ray reuse alone.

## H99: reused-light causal screen

Use the six exposed points node-89, held-0, held-1, held-2, held-3 and
reserved-out-1, both profiles and all3bands. These include the near-Sun raw-Mie
failure, sideways phase-mass failure and high/low-Sun ground/altitude controls.
Begin with construction1 for both base grids:36cases per grid,72total.
Authenticate compatible raw incidents in00552/00541/00559 and their recorded
parents rather than deriving radiance from summary scores.

Compare four explicit quantities at identical L samples:

| Operator | Purpose |
| --- | --- |
| A: original point P with original quadrature weights | Exact retained algorithm replay |
| B: point P with true cell solid angles | Isolate the changed angular representation/measure |
| C: integrated cell P with piecewise-constant L | Proposed intervention; B-to-C isolates phase treatment |
| C-star: independent-coordinate refined integral of that same piecewise-constant L | Qualify phase integration independently of the continuous-light reference |

For every operator use the identical original Rayleigh value R_A:

```text
M_A = beta_M sum_i L_i P_i w_i; D_A = sum_i P_i w_i
M_B = beta_M sum_i L_i P_i A_i; D_B = sum_i P_i A_i
M_C = beta_M sum_i L_i K_i;     D_C = sum_i K_i
J_X = R_A + M_X/D_X, X = A,B,C,C-star
```

A_i is actual cell area; w_i is the old quadrature coefficient. A Rayleigh-area
or Rayleigh-reconstruction change is a separately registered intervention.

For A/B/C retain raw Rayleigh, raw Mie, sampled phase mass, normalized Mie and
total J2. C-star is a numerical operator reference, not independent physical
truth. The existing independent cache-free continuous-J2 histories supply the
physical comparison. Do not improve a denominator and assume the numerator
became accurate, or credit A-to-C wholly to phase integration.

Freeze grid-specific predictions. The Toronto witnesses supply the mechanism
gain tests; paper and all remaining cases are protected comparisons. For k=.5,
require >=50% reduction of the
resolved node-89 red raw-Mie defect and >=20% reduction of sideways green
total-J error versus its own A baseline. For k=.35, near-Sun red is already
good and is a protected case, not a50%-reduction claim; require >=20% reduction
of sideways green total-J error versus its A baseline. Freeze paired upper-
margin tests before exposure. For both grids require no resolved material
protected total-error regression versus complete Sun4096. Show B-to-C signed
changes and the full A-to-B representation effect. A baseline defect too small
for the reference precision is inconclusive, not a large relative gain.

The sideways phase-mass repair is an engine check: it largely follows from
unit-mass admission and is not independent evidence of better atmospheric
accuracy. If mass improves without the declared total-J gain, label the result
denominator repair without atmospheric improvement. This can earn only a
specific H100 diagnosis, not qualification.

Use the inherited2000 shared-history bootstrap draws, seed1013904223, preserving
band covariance and independent profile/group histories. For each case protect
candidateError-controlError-max(.2*controlError,.02). Distinguish exploratory
paired intervals from confirmation after adaptive selection. Keep64/128 L-path
checks; above1% in any species/raw/normalized quantity triggers256. Even below
that trigger, qualify decisive comparisons against the active decision margin:
require the decision to survive both path resolutions and a numerical/path
envelope below10% of threshold distance, or refine/report unresolved. Weight
refinement and L-path refinement are different error controls.

Reject a configuration early if it transfers the resolved defect to another
protected witness. A useful partial repair can earn only H100's bounded error
separation, not automatic broad/native expansion. Useful survivors receive the
other physical construction before a broad screen.

## H100: separate illumination approximation from phase quadrature

For the near-Sun and sideways witnesses, plus at most two decision-critical
altitude witnesses per profile, retain:

```text
J_C - J_true = (R_A - R_true) + (m_C - m_star) + (m_star - M_true)
               Rayleigh error    phase error     remaining Mie residual
m_X = M_X/D_X
```

J_true/R_true/M_true have independent-history uncertainty; m_star has separately
qualified phase numerical uncertainty. The remaining Mie residual includes
illumination reconstruction AND finite L-path transport error. It cannot be
called pure reconstruction error. Publish both species and these uncertainties.
To isolate reconstruction where a live decision needs it, additionally qualify
the continuous angular integral m_cont,h of the same finite-path L_h operator:

```text
m_star - M_true = (m_star - m_cont,h) + (m_cont,h - M_true)
                   representation        finite-path/physical residual
```

New continuous actual-angle traces are charged and limited to the selected
diagnostic witnesses; their angular integration needs independent refinement.
They are not interpolation of a retained outgoing cache. Without this extra
oracle, retain the honest combined-residual label. Do not treat subtraction of
uncertain values or finite-path convergence as an exact physical attribution.

If refining K stops changing C while the remaining Mie residual is resolved,
use the matched finite-path contrast where necessary, then test one registered
illumination repair: positive reconstruction from neighboring retained values,
or nested cell subdivision with newly traced representatives. Keep the other
factor fixed, forbid interpolation across a physical discontinuity, and charge
new L evaluations and stencil/memory work. A cell-average weighted by the
outgoing phase is not a reusable outgoing-independent illumination sample.

Keep at most two live representation variants and normally one repair wave.
Continue another wave only for a recorded new mechanism, attainable margin and
bounded contrast; two waves merely transferring error require reassessment.
Do not repeatedly increase phase resolution after evidence establishes an
illumination floor. Negative or cost-limited results are useful dispositions.

## H101: broad robustness, cost frontier and fresh validation

Broad development uses the21unique physical tuples from the former22-ID panel.
Held-6/held-7 duplicate: select lexicographically held-6 before scoring and retain
the old22-ID aggregate only as labeled compatibility evidence. Compare complete
Sun1024/1408/2048/4096 controls as whole points, both profiles,3bands and both
constructions. All earlier targets, including old reserved IDs, are exposed.

Separate scientific gain at identical illumination samples from practical
accuracy/cost. The initial20% mean/worst improvement test applies at the same
L-trace budget, with no resolved material case/profile/statistic regressions.
That alone does not establish equal total build cost. For a practical finalist,
compare measured phase-weight plus L-transport plus reduction time, required
storage and recomputation against complete controls. Allow a25%-less-total-work
route with mean/worst within10%, or a20% gain at comparable measured total
work. Freeze timing protocol and the comparable-work tolerance after H97's
pilot but before broad scoring; repeated timing must report noise and setup.
Never combine different controls' best statistics. Reject whole-point domination.

Only a robust prospective method earns new frozen physical validation. Register
at most two finalists, one complete comparator and one gain profile/statistic
per finalist, second-construction requirements, exact costs, seed, refinement
rules and joint maximum protected margin before exposing new L or references.
Use empirical one-sided95% with one finalist,97.5% each if either of two may
qualify. Upper gain and protected bounds must pass; resolved failure rejects,
unresolved margins permit only registered attainable reference refinement.

Proposed fresh tuple coverage (altitude m / Sun elevation deg / view elevation
deg / local azimuth deg) is below; authenticate signs and exact nonoverlap in
registration. These tuples are reserved now and must not enter development.

```text
0 / 55 / .2 / 0             1500 / 55 / .2 / 90
0 / 1.25 / 1.20 / .05       1500 / 1.25 / .35 / 90
3000 / 25 / 15 / 135        10000 / -1.5 / 5 / 160
250 / 20 / 19.8 / .2        2500 / 2 / 1 / 170
```

Azimuth0points toward the horizontal Sun projection in the verified source
frame. Authenticate separation acos(dot(view,Sun)) explicitly: reserve one
forward witness <=.1degree and a second <=.5degree, along with the sideways
and horizon controls. Do not infer forward coverage from descriptive labels.

Acquire matched independent references in both atmospheres, preserving raw
histories/species/covariance; use the qualified pure-J2 estimator, not a later-
order precision claim. Main/control precision and up to4critical refinements
per profile must be frozen with a resolution-cost estimate. Do not refine a
night reference when a separate qualified daylight witness already rejects.

## H102: conditional native recurrence

Only a validated survivor earns substantial builder integration. Prove per-row
cell/direction identities shared by L transport and J integration, support-row
evaluation, phase-table hashes, signs, padding and streaming blocks. No equal-
index interpolation between unlike physical directions. Demonstrate that L is
sampled once per row/band/order and reused across outgoing directions; account
for any newly traced illumination representatives explicitly.

Test pure and cumulative J2/J3/J4 microbuilds in both atmospheres, isolating
native L1 path error and L2/L3 previous-cache reconstruction. Include a separately
registered San Jose sunset+60min protected witness before large native work;
declare its place outside the fresh gain aggregate before exposure. Use matched
independent references where physically supported. For signals below the frozen
floor, predeclare an absolute uncertainty criterion or a justified analytic
upper bound; all-zero sampled histories alone do not prove negligible radiance.

The Mie kernel must preserve constant fields after shared normalization, remain
nonnegative and respect source/species scaling. Preserve and report the unchanged
Rayleigh quadrature's mass defect rather than assume the entire kernel is exact
for constant illumination. Check whether a local improvement survives propagation before
claiming an N4 benefit. A failed recurrence can feed a distinct, bounded H100
diagnostic; it does not silently waive the frozen validation or native gate.

## H103: conditional paper scoring and reviewable scenes

For a surviving practical native method, run the exact paper atmosphere/source/
grass setup,40wavelengths,31scored bands and all17intervals x81dome rays. Match
or improve authenticated H61Focused60 and H55Original40 aggregate RMSE at full
precision. Publish all interval changes and dome comparisons. libRadtran is
an isolated matched physical check where supported; paper RMSE remains the
full-cache acceptance gate. Toronto uses its own matched atmosphere references.

Obtain selected15-band observer spectra and actual matched paper/Toronto noon,
sunset,+30/+60minute scenes with common display/exposure. Preserve current
production twilight as a protected visual comparison; independently justified
physical changes and owner visual decisions remain explicit. Do not fit an
atmosphere/exposure to make the comparison pass. Runtime stays lookup-only.

## H104: execution, images, evidence and completion

Prefer GPU for phase weights, actual-angle traces, independent paths and renders;
CPU for small analytic/geometry checks and reductions. One numerical GPU job
at a time, bounded dispatch and the existing30-second progress contract. Make
phase-only, L-trace and native timings separately visible. Publish meaningful
images at admission, causal screen, component attribution and each material
lead. Show cell/phase maps and signed errors early; real15/40-band colors and
scenes only at the qualified later stages. An image per batch is unnecessary.

The60-minute point is a progress/resource review, not an automatic stop while
strong evidence or a distinct useful lead warrants continued monitoring.
Estimate each stage after a measured pilot; do not promise that cell weights
are cheap just because no new L traces are involved. Initial reused-light/math
work is expected to need roughly10-24MiB of additional retained evidence;
measure actual remaining space before execution. Current retained limit is
1152MiB with a2MiB sealing reserve,1GiB live scratch and40GiB minimum free disk.
Any justified amendment uses the owner's standing experiment authority and is
recorded before execution. Never delete or alter earlier evidence to fit.

Authored source stays under experiments/sky-accuracy-dials; generated output
under tmp/experiments/sky-accuracy-dials; owning documents stay here. Preserve
all sealed runs and their complete derivation chains. Verify canonical roots,
reject links/junctions, and reuse only authenticated compatible parents. Do not
edit existing source during active snapshot-bound runs. Preserve usable results
and fix a diagnosed failure in a new run, rather than blind retries.

Use local types and focused self-verifying scientific proof runners; no unit-
test tree or dedicated standards reviewers/audits. Checkpoint-advisor advice
remains separate. Final replay covers cell coverage, phase weights, source reuse,
operators A/B/C/C-star, independent uncertainty, deduplication, decisions,
costs, images, cleanup and conditional-stage disposition.

Complete with a qualified candidate and its limits, a justified negative or
cost-limited result after useful leads, or a specific external blocker after
unaffected work. Save concise results and complete decisions. Production
promotion requires separate authorization; the experiment stays open unless
the owner explicitly ends or suspends it. The selected execution is complete.

## Independent critique incorporated

The owner-requested read-only secondary-agent critique identified seven issues;
all are addressed above: Mie-only attribution with separate Rayleigh/path terms;
normalized uncertainty and decision-sensitive precision; truly forward reserved
angles; identical Rayleigh in A/B/C; executable cell/sector/bisector equations
and independent membership checks; atmospheric gain beyond automatic mass
repair; and numerical builder dimensions, scheduling and measured block cost.
Its optional per-cell signed contributions and separate Sun/outgoing maps are
also included. The critique performed no implementation or numerical execution.
