# Sky Accuracy Dials: Continuation Execution Plan

The [status document](status.md) owns execution authority, current runs, open
work and verified implementation milestones.

The bounded C0-C6 batch is complete. The owner authorizes adapting the plan
and continuing independently toward the broader scientific goals. The
[compensation attribution plan](attribution-plan.md) owns the active extension,
its new reference tests and adaptive branching. Its results do not reopen or
replace the earlier sealed C5 skip or other historical evidence.

## Purpose And Ownership

Execute the [continuation goals](continuation-goals.md): explain why a more
accurate calculation can worsen Kider agreement, then qualify numerical and
operational controls whose benefits are understood and predicted. Lower RMSE
alone is insufficient.

This document owns the continuation sequence, proposed cases, admission gates,
resource allocations and stopping decisions. The [design](design.md) retains
the experiment's physical control, source/output boundaries and immutable-run
contract. The [hypothesis report](results.md) owns completed evidence; the
[first campaign plan](plan.md) remains its completed checklist. The
[status](status.md) owns progress and verification records.

The sequence is C0 -> C1 -> C2 -> C3 -> C4 -> C5 -> C6. A phase can finish with
a documented limitation that prevents a stronger claim. C6 is mandatory even
when an earlier scientific or resource gate ends further execution.

## Fixed Comparisons And Evidence Scopes

Keep Direct40, atmospheric/ground inputs, surface observer, fitted geometry,
collimated Sun, Z180, spectral units and scoring weights matched to the first
campaign. Physical parameters are not numerical tuning variables in this pass.

| Scope                  | Samples                                                                        | Use                                                                                |
| ---------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Screen                 | 09:30, 11:15, 13:30; all 81 rays; channels 0,8,16,24,30,39                     | Mechanism development; five registered channels contribute to screened Kider RMSE. |
| Component probes       | Eight fixed rays at each of 09:30,10:15,11:15,12:30,13:30; channels 0,8,24,30  | Independent local reference and residual attribution; never presented as full B1.  |
| Full                   | All 17 times x 81 rays x 40 channels                                           | Final construction captures; registered Kider RMSE uses channels 0-30.             |
| Prospective assessment | Fourteen times outside the screen, for a not-yet-executed target configuration | Spectral, numerical-error and score prediction checks.                             |
| Order diagnostic       | Original all-time channels 0/8 N4-N6 evidence                                  | Scattering-tail warning and attribution; not a full-spectrum reference.            |

C0 freezes the component-probe identities from the existing baseline. Include
the known 09:30 points (4,7), (5,7), (3,7), 10:15 point (3,6), and 12:30 point
(3,5). At each time add the nearest-Sun, highest-elevation and lowest-elevation
rays; deduplicate and fill to eight using decreasing baseline point SSE, with
grid-index tie breaking. This selection uses existing evidence, not new target
outcomes. It deliberately samples difficult regions rather than estimating an
unbiased whole-sky average.

The existing measurements are already known. Coarse/medium construction
outputs may be available at all times before predicting a finer target.
Fourteen held intervention outcomes are not fourteen unseen measurements.
Every prediction manifest names any target samples already used in development;
they are excluded from prospective assessment. A reference run must not execute
the exact target under another name.

### Control identities

- B is the retained production-matched baseline: P48/W27/F68, S20/T40, N4,
  original Q30 view. Reuse its accepted spectra as historical comparison.
- H is the continuation working control: P48/W27/I512, S80/T160, N4,
  altitude-segmented view with eight subdivisions per altitude interval.
  H is a new combination to validate, not an already qualified accuracy preset.
- P counts retained altitude nodes; W is outgoing face width; I is incoming
  sample count; S/T count source/transport intervals. Existing P51/55/63 changes
  subdivide the original bottom 0-1875 m interval, not the whole altitude grid.

Keep cumulative, grouped-first/higher, and analytic/factored-first-order
representations explicitly named. For nonlinear cubic reconstruction,
L(Cn)-L(Cn-1) is an effective cumulative increment, not a separately integrated
pure-order contribution.

## C0: Freeze The Campaign And Establish Admission

- [x] Authenticate the 99 retained runs and reuse the compact inputs and
      summary rather than regenerating the first campaign.
- [x] Record current free disk space, available host memory, renderer, texture
      limits and software identities. The previous measured device was an
      RTX 2060 through ANGLE; do not assume it is unchanged.
- [x] Freeze probe identities, scopes, thresholds below, candidate/reference
      labels and a case ledger with parent/operation/output identities.
- [x] Establish per-job estimates, actual resource counters and the remaining
      campaign allowances before admitting any expensive work.
- [x] Capture the implementation review baseline and identify the first
      coherent source-review milestone through the existing reviewer workflow.

**Output:** an immutable campaign registration and admission proof record.
No GPU construction is allocated to C0. Stop if input authenticity, physical
compatibility, output isolation or the resource floor cannot be established.

## C1: Build Component References And Verify Actual Dependencies

C1 establishes the minimum controls and proof support below. The
[status](status.md#verification-and-implementation-gate) owns implementation and
review evidence; the [findings](continuation-results.md) own the measured scope.
Local J2 execution is assigned to C2 below.

- S160, T320 and segmented subdivision 16, with explicit count admission,
  shader bounds, selectors and prediction contracts. Existing proofs that
  intentionally reject these values must be updated for the new admitted
  domain; historical sealed proof records remain unchanged.
- A distinct endpoint-aware incoming azimuth placement at fixed sample count.
  The current product rule uses mirrored midpoint pairs. The shifted rule must
  emit azimuth 0 and pi once each, then mirrored interior pairs; simply changing
  the old midpoint offset duplicates one endpoint and omits the other.
- A bounded union of permitted adaptive and reference view queries, with
  explicit sparse-support capture for the component probes at 10:15/12:30 as
  well as the three screen times. Include both independent reference quadrature
  formulations before field disposal. Current sparse supports are fixed before
  generation; later evaluation cannot request arbitrary missing samples.
  Charge these supports and probe outputs to the same job's resource allocation
  and record their provenance and any target exposure. C1 retained integrated
  fixed-field references at the extra times; C3 adaptive evaluation still needs
  its own compatible per-query capture before field disposal.
- Independent binary64 component integration, using two distinct deterministic
  quadrature formulations with manufactured/exact checks. Start with direct J1
  and final-view integration; attempt local J2 probes only within the CPU cap.
- Explicit live-memory measurement and cancellation/timeout handling. The
  existing GPU runner timeout is 30 minutes; a 90-minute ceiling requires a
  deliberate bounded runner change before a long case is admitted.

Prove positive weights, total solid angle, unique incoming nodes, exact intended
reflection symmetry, constant/low-order moments and phase integration. Do not
renormalize phase values to conceal integration error. Prove scorer identities,
reference-allowance propagation and invalid prediction/case rejection with
focused self-verifying runners.

**Critical causal control:** current L1 transport evaluates
`directScatteringDensity` at its samples; it does not read cached J1. Allocate
at most two screen constructions: H and H with only final-view J1 density
factorization. Reconstruct the later orders and check that J2-J4 agree at the
same coordinates and controls. A changed sparse support is not a failed field
hash: compare matched values or arrange an identical support explicitly.
Capture the declared reference selectors with H so C2 can reuse it as R0.

This establishes whether final-view J1 changes are isolated. Feeding cached
raw or factored J1 into L1 would introduce an approximation into the existing
analytic path; it must not be described as correcting a cached-J1 recurrence
defect. That alternate solver is outside the initial case matrix.

For local J2 reference work, pilot one probe first. Admit at most sixteen
space/wavelength queries from the frozen probe set, integrating continuous L1
with independent source/path/angular refinement. A timeout or unresolved
integral is a reference limitation, not a zero error estimate.

Execution sequencing: place this local-J2 pilot at the beginning of C2 and charge
its retained evidence to C2. C1's first implementation milestone verifies the
implemented J1/final-view references and actual recurrence dependencies. The J2
pilot needs its own registered boundary contract: the current ground knot uses
zero inward L1, whereas the positive-height boundary limit includes reflected
ground light. Compare the matched rule and any boundary-limit diagnostic under
distinct labels. Do not silently change the finite-N4 reference problem.
Any comparison to retained GPU J2 needs explicit point capture before field
disposal; the C1 integrated spectra cannot supply those missing point values.

**Exit gate:** baseline/causal parity, mathematical/admission proofs and the
first implementation review milestone pass. Component references carry their
own remaining-error evidence. Source ownership, type checking and mapped
primary/audit review follow the existing
[experiment instructions](../../../../../experiments/sky-accuracy-dials/AGENTS.md).
Do not create an experimental unit-test suite or framework.

## C2: Construct A Finite-Order Reference Envelope

The first reference target is the pinned **N4 problem**. It is not an
infinite-order physical solution. N6 evidence remains a separate tail diagnostic.
An unresolved tail prevents claims about total scattering accuracy even if
N4 discretization becomes well resolved.

Run the screen profiles below in order. Each row is a complete named profile
derived from the preceding row unless an explicit parent is given. Reuse C1's
H capture when its exact selector and provenance match.

| ID  | Change or profile                       | Question                                                     |
| --- | --------------------------------------- | ------------------------------------------------------------ |
| R0  | H                                       | Working reference baseline.                                  |
| R1  | R0 with S160                            | Remaining source integration sensitivity.                    |
| R2  | R1 with T320                            | Remaining transport sensitivity on finer source integration. |
| R3  | R2 with P55                             | Initial altitude refinement in this background.              |
| R4  | R3 with P63                             | Does altitude sensitivity diminish?                          |
| R5  | R4 with W39                             | Outgoing reconstruction sensitivity.                         |
| R6  | R5 with W51                             | Further outgoing sensitivity at the present layout ceiling.  |
| R7  | R6 with I2048                           | Incoming refinement on the finest spatial profile.           |
| R8  | R7 with the alternate azimuth placement | Same-count angular placement sensitivity.                    |
| R9  | R7 with S80                             | Source refinement checked in the final background.           |
| R10 | R7 with T160                            | Transport refinement checked in the final background.        |
| R11 | R7 with P55                             | Altitude sensitivity checked in the final background.        |

Evaluate segmented subdivisions 8 and 16 on the same screen constructions
where their support fits the allocation. The numerical reference member uses
16; candidate working controls continue to use eight unless declared otherwise.
This extra screen selection does not authorize retaining several full-run views.

The sequence and return comparisons expose background dependence; do not infer
independence from this being a one-factor-at-a-time ladder. Use component
references and C4 interactions to identify unresolved contributions. W51 is
a layout ceiling, not evidence that outgoing reconstruction has converged.

Build reference allowances as described below. Resolve component references
first; qualify an N4 reference only where its important errors are accounted
for. If the largest profiles fail memory or timing admission, retain the finest
admitted envelope and narrow the conclusions. Do not silently reduce a case's
resolution and retain its original identity.

**Output:** reference members, per-scope error allowances, remaining terms and
a decision about which claims can advance. At most twelve screen constructions
are allocated; reuse can save a slot. No new simple incoming quarter-law forecast
is attempted: that law already failed twice in the first campaign.

## C3: Test Operational And Representation Controls

Use H as the common background unless the row says otherwise. Every case has
a mechanism question registered before execution. Exploratory rows may record
an unknown response magnitude; that does not count as a passed prediction.

| Work package              | Bounded new screen constructions | Test and expected discrimination                                                                                                                                                                                                                   |
| ------------------------- | -------------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V: view sampling          |                                2 | Compare uniform altitude-segment subdivisions 4/8/16 with adaptive allocation within a predeclared finite query union, at matched evaluation budgets. Test whether allocation reduces view-integration error more efficiently than uniform counts. |
| D: density representation |                                5 | At P48 and P55 compare combined raw, split-species raw and density-factored J2-J4. H supplies combined raw P48; five new cases complete the three-representation x two-altitude comparison.                                                        |
| I: incoming distribution  |                                3 | Alternate azimuth placement at I512, an equal-count aspect-ratio alternative, and the corresponding finer I2048 placement. Test count and distribution separately, using continuous-L1/local-J2 references where available.                        |

For V, allow dyadic subdivision levels 1/2/4/8/16. Their midpoint sets are not
nested: the complete permitted union contains 31P locations, not 16P. Include
any additional independent-reference query locations in the support estimate.
Count all runtime evaluations, including rejected trial evaluations, against budgets
equivalent to 4P, 8P and 16P uniform steps. Retain the actual counts when an
algorithm stops early. Precomputing a larger support union is construction work
and must be reported separately; it is not free runtime sampling. Compare
against the independent view reference and the uniform-16 result without
calling the latter exact. Frozen fields isolate the operational control.
Use H for the first construction and C1's final-J1-factorized background for
the second, so the view method is checked under a related reconstruction
correction as well. Keep each representation's grouping control explicit.

For D, factor **J2-J4** into separate Rayleigh/Mie lighting coefficients and
apply physical density at transport/view query locations. Preserve analytic L1
and keep final J1 raw for this package, so the intervention reaches an actual
cached recurrence boundary. Regenerate the affected later orders in all five
cases. Split-species raw applies density at retained nodes and uses the same
species interpolation, accumulation order and pass structure as the factored
case. At each altitude count, combined-raw versus split-raw measures grouping
effects; split-raw versus factored isolates moving density evaluation to query
locations, subject to separately assessed coefficient-storage roundoff.
Match analytic L1, integration controls, ground treatment and final aggregation.
If raw J1 is reconstructed separately, use H's matching grouped-first/higher
output instead of its differently grouped cumulative output.
Keep interpolation limiting equivalent, or identify and control its
effect before making that attribution. Stream species passes where possible to avoid
doubling the largest live textures; count the extra work and apply ground
contributions once.

For I, the equal-count alternative is 8 cosine nodes x 64 azimuth nodes at
I512, compared with the existing 16 x 32 rule. Generic controls already admit
this combination; add its named case, provenance and prediction contracts.
Check weights, moments and phase integration before sky execution. Do
not choose the winning placement by Kider score alone.

For every package, retain the radiance response, numerical-reference error,
Kider residual terms, first affected order and cost. The factor coverage record
also includes source/transport counts, solar interpolation, precision, geometry
and scattering tail. Use existing evidence and targeted component probes for
those factors; record why an additional construction is or is not warranted.
Arbitrary whole-altitude redistribution, solar-grid replacement and the
outgoing-resolution x density-factorization interaction are deferred from this
bounded matrix, not declared solved. Outgoing resolution is still tested in C2
and covered by the completed campaign.

**Exit gate:** the second implementation milestone for new representation and
sampling code is reviewed and its proofs pass before declaring C3 complete.
At most ten new screen constructions; repeated diagnostics consume these slots.

## C4: Explain And Predict Joint Corrections

Use complete 2 x 2 comparisons and the spectral interaction
I_AB = L_AB - L_A - L_B + L_H before analyzing SSE. Reuse compatible vertices.

| Relationship                                             | Existing vertices                   |       New screen constructions |
| -------------------------------------------------------- | ----------------------------------- | -----------------------------: |
| Final-view J1 factorization x higher-order factorization | H, C1 final-J1-only, C3 higher-only |                   1 joint case |
| Incoming placement x T160->320                           | H, C3 placement at T160             | 2: T320 control and joint case |
| Higher-order factorization x incoming placement          | H and both isolated C3 changes      |                   1 joint case |

The altitude/factorization comparisons and their matched grouping controls
already completed in C3 require analysis, not another sweep. For joint cases,
check whether grouping effects could account for the inferred interaction;
use an explicitly reassigned matched-control slot or limit attribution if that
contribution is unresolved.

Before each unexecuted joint case, freeze an additive prediction where it is
scientifically justified, or an explicit interaction model. A first-order
perturbation model may evaluate changed quadrature/reconstruction against
baseline fields and propagate through a frozen baseline recurrence; record
omitted feedback and nonlinear reconstruction terms. It may not compute the
target's complete changed recurrence and call that a prediction.

Quantify numerical error, compensation and remaining discrepancy using the
goals document's SSE decomposition. For an observed regression, identify the
suspected offsetting contribution and check whether the joint correction
behaves as predicted. A reversal of score benefit is insufficient evidence of
spectral amplification.

**Output:** explained or unresolved regressions, interaction restrictions, and
at most two candidate dials for full qualification. Four new screen constructions
maximum. A useful explanation can advance to C6 even if no dial advances to C5.

## C5: Prospective Full Qualification

Select candidates by the declared numerical mechanism and reference adequacy,
then their potential practical benefit. Do not select an under-resolved setting
because its residual cancellation gives the lowest screening RMSE.

Allocate at most eight full constructions:

1. Full H control.
2. Full selected fine reference member.
3. Full independent/check reference member selected by numerical uncertainty,
   not favorable Kider fit.
4. Candidate A medium setting at all times.
5. Candidate A held finer setting, after its prediction is sealed.
6. Candidate B medium setting, if a second candidate is justified.
7. Candidate B held finer setting, after its prediction is sealed.
8. A held joint setting or an additional reference needed to resolve uncertainty.

Retain one final-view selection per full run. Where a runtime evaluator derives
another selection from the same retained/live support, it still consumes a
full-capture slot and the corresponding bytes; sharing construction work does
not make its evidence free.

Candidate A/B levels and predictors are selected and recorded after C3/C4,
before their new target outputs exist. Prefer a new level within the admitted
domain. If the finest screen level was already evaluated, its fourteen
non-screen outcomes can still be predicted; the three screen outcomes cannot
be relabelled as held. A discrete method change can be the target when its
prediction model and development inputs are explicit.

Require reference allowances at the actual full assessment groups. Do not
transfer a screen allowance to all times without supporting evidence. If more
reference work is needed, reassign the second candidate's slots to reference
checks and qualify at most one dial. If the eight slots cannot establish an
adequate reference, report the resulting restricted/component claim instead
of claiming full-solver accuracy.

Report both the fourteen-condition prospective result and the complete
17-time registered score. Display every time's regression and its angular/
spectral concentration. This plan does not require every time to improve.
It supplies local intervention validation; new-atmosphere, true-horizon and
independent-measurement generalization remain outside its claims.

## Reference, Prediction And Score Gates

All proposed thresholds below are engineering criteria for this continuation,
recorded before target execution. They are not claims of statistical significance.

### Reference adequacy

For each declared comparison boundary, retain an empirical reference allowance
U from the observed refinement differences, independent-formulation disagreement
and precision/grouping controls, including relevant interactions. Document the
combination equation and the evidence for any extrapolated remainder. Without
a validated convergence law, do not divide the latest difference by an assumed
Richardson factor. Keep unresolved terms explicitly unresolved, not zero.

Use a conservative starting allowance of twice the largest supported remainder
or independent-method discrepancy per component, then sum component allowances
and separately measured interaction allowances. This is an empirical envelope,
not a rigorous bound or confidence interval. Refinement failure, a missing
material component or unexplained independent-method disagreement makes the
reference inadequate for the affected claim, regardless of a small computed U.

For claimed numerical-error reduction D, require U <= 0.20D and, with the same
reference uncertainty on control and candidate,

```text
||Lcontrol - Lreference|| - ||Lcandidate - Lreference|| > 2U
```

Use consistent norms/weights within each scope. A fixed-cache view reference
can qualify view-integration accuracy; it cannot establish the cache or the
whole N4 solver is accurate. Finite-N4 resolution does not establish a converged
scattering tail. Recompute attribution under all adequate reference members
and report conclusions that depend on the selected member.

### Prospective qualification

| Claim                     | Gate                                                                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Spectral response         | Existing >=90% significant-scalar sign agreement and <=25% relative vector error in every predeclared condition/angular group. Retain the original 1e-8 W radiance implementation floor.               |
| Numerical-error reduction | Predicted direction is correct, the reduction survives reference allowance, and predicted magnitude differs by at most 25% where resolved.                                                             |
| Useful Kider benefit      | Aggregate RMSE improves by at least 0.01 mW m^-2 sr^-1 nm^-1 on both the fourteen-condition assessment and complete registered score. Smaller gains may qualify only as numerical improvements.        |
| Score forecast            | Correct aggregate direction; absolute forecast error <= max(25% of predicted improvement, 0.01 mW m^-2 sr^-1 nm^-1).                                                                                   |
| Accuracy mechanism        | Independent numerical error decreases and the claimed benefit is checked with the dominant related correction applied. Dependence on preserved numerical bias prevents an unrestricted accuracy claim. |

The spectral floor measures implementation behavior. Reference uncertainty
governs attribution to numerical error; it does not make the directly computed
fixed-data Kider score uncertain. Measurement uncertainty is separate and has
not been calibrated. The practical 0.01 threshold does not establish physical
truth or statistical significance.

The 84 usual full-assessment groups overlap. Passing aggregate scores cannot
override a failed group prediction. Retain classifications separately:
numerical control; predictable response; useful Kider improvement; combined
accuracy claim; unresolved/rejected. A failure in one category must not be
hidden by success in another.

## Resource Allocation And Admission

The [design's storage limits](design.md#storage-and-execution-budget) remain
hard boundaries: 512 MiB total retained evidence, 1 GiB live disk scratch,
40 GiB free-space floor, one GPU job at a time. Existing evidence is about
150.21 MiB and counts toward the total. Copying old files does not free space.

This pass additionally caps new retained output at **256 MiB**, GPU constructions
at **36**, full captures at **8**, summed GPU-job elapsed time at **18 hours**
(including capture/readback), and summed CPU-only reference/analysis job elapsed
time at **8 hours**. These are independent
ceilings; reaching any one can end execution before all slots are used.

| Phase                       | New GPU construction/capture allowance | New retained allocation |
| --------------------------- | -------------------------------------: | ----------------------: |
| C0 registration/admission   |                                      0 |                   4 MiB |
| C1 component/parity work    |                              2 screens |                  16 MiB |
| C2 reference envelope       |      12 screens, including reusable R0 |                  44 MiB |
| C3 isolated work packages   |                             10 screens |                  40 MiB |
| C4 joint targets            |                              4 screens |                  16 MiB |
| C5 qualification            |                        8 full captures |                 104 MiB |
| C6 reports and verification |                                      0 |                  20 MiB |
| Failure and sealing reserve |                     No extra job slots |                  12 MiB |
| Total ceiling               |                36; no more than 8 full |                 256 MiB |

The table reflects the sealed allocation amendment. It restores C3's 40 MiB
allowance while retaining C1's 16 MiB: transfer
4 MiB from unused C0 registration space and 4 MiB from C2 because accepted H
already supplies R0. C0's sealed original allocation remains immutable; the
amendment records both versions and leaves every global ceiling unchanged.
The status document owns the amendment's execution evidence.

C1's captures evaluate the complete 1/2/4/8/16 midpoint query union, but retain
final spectra and component diagnostics rather than the transient fields or
per-segment integrands. C3 V therefore needs its two planned constructions to
run the new adaptive evaluator. The uniform outputs are comparison evidence;
they are insufficient to derive that new evaluator's output after field disposal.

Allocations include each phase's predictions, assessments, metadata and seals,
not just spectra. The full allocation assumes about 13 MiB per capture. Recent
one-view full runs retained about 9.5 MiB; two views retained 16.2 MiB. Screen
allocations average 4 MiB per construction; large profiles may exceed that.
Admit using an explicit upper estimate for the next record and remaining
report/failure reserve. Unused slots/bytes may be reassigned between packages
within all global caps; record the reason before the replacement case executes.

Use compact JSON for new-run objects, manifests and mechanism wrappers, with
lossless compression of exact source snapshots. Preserve schemas, parsed values,
source identities and derivation links; verify round trips and leave historical
run bytes unchanged. Forecast 3 MiB for the complete C2 ladder assessment and
2 MiB for the C3 mechanism catalog, including its 512 KiB terminal reserve.
Mechanism captures reserve 1 MiB for terminal metadata and forecast the actual
packed source/control/spectra bytes plus 1.5 MiB of diagnostics and 1 MiB of
metadata before allocation. These are estimates enforced by write guards,
not mathematical bounds on compression.
Retain every canonical compressed JSON assessment table and the human-readable
`scores.csv` and `adequacy.csv`; derive other CSV forms when needed instead of
retaining duplicate compressed CSV tables. Admission must count the complete
prospective record, including definition, provenance, summary, progress and seal,
within the existing phase and campaign ceilings.

Forecast 12 MiB for the complete C6 record, including a 1 MiB terminal reserve,
within its existing 20 MiB phase allocation. The complete table/model/source
and metadata estimate is approximately 6.53 MiB before twelve PNGs; the prior
8 MiB record estimate left insufficient conservative figure/seal headroom.
This admission margin changes neither scientific output nor actual retention.

Observed native full runs took roughly 4-7 minutes; I512/I2048 screens took
46/98 seconds. Budget **30-90 minutes per full construction**, with a
six-channel screen pilot first; the status owns actual execution measurements.
Initial planning allowance is about **6-18 GPU-job hours** plus component analysis;
implementation/review time is separate. These are estimates, not promised
completion times. Preserve a 30-minute screen timeout and a 90-minute full
timeout, bounded also by remaining campaign time. A timed-out run consumes its
slot and retained evidence allocation.

Use the current texture layout only: maximum planned P63/W51/I2048, with
S160/T320 and subdivision 16 admitted explicitly. W53 exceeds the observed
16384-wide limit. P91 is merely a dimensional ceiling and is not planned.
The combined maximum needs about 852 MiB of live scalar recurrence fields,
before overhead. Two simultaneously resident species
fields can exceed 1.4 GiB. Sequential species accumulation also needs safe
read/write separation: qualify float32 additive blending or budget an extra
transport texture for ping-pong accumulation. One source field plus three
transport fields is about 941 MiB at the maximum profile. Prove texture
lifetimes and reject plans exceeding **1 GiB estimated scalar field storage**
in this pass.

GPU field memory and disk scratch are different budgets. P63/subdivision16
requires 1008 intervals per ray, or about 1.39 million full-boundary sample
records, with substantial transient CPU storage. Adaptive and independent
reference query unions add support beyond that uniform-16 estimate and require
their own admission calculation. Measure the pilot's process
private-memory peak, require at least 2 GiB host headroom, and cap combined
runner/browser private memory at the smaller of 6 GiB or half the initially
available host memory. Observe available memory during long jobs. If either
the estimate or observed peak fails admission, reduce scope under a new case
identity or stop; do not rely on texture dimensions alone.

Stream wavelengths and species; retain compact spectra, selected point/order
summaries, predictions and derivations. Do not retain field dumps or cache
packages. Delete only owned reproducible scratch after its dependent evidence
is sealed and verified. Preserve failed and rejected runs.

## Stopping And Branching Rules

- An implementation/parity/provenance failure stops dependent scientific work
  until corrected and verified. Reuse prior review evidence only while its
  request remains valid; batch review at coherent implementation milestones.
- An inadequate reference stops the affected accuracy qualification, not all
  component learning. Complete the reference limitation and attribution report.
- A failed prospective angular/interpolation law ends extension of that same
  law to another level. Permit at most one new mechanism/model revision per
  work package within its remaining slots; preserve both outcomes.
- Stop refinement for a claim when its effect is unresolved against U or below
  the practical benefit threshold and no identified mechanism justifies another
  discriminating test. Do not spend remaining slots merely because they exist.
- If numerical accuracy improves while Kider worsens, complete the compensation
  accounting. Do not tune back toward the old bias and call it accuracy.
- Persistent disagreement after adequate numerical resolution produces a bounded
  physical/observation hypothesis proposal in C6. No aerosol, ground, phase or
  measurement-footprint fitting is silently added to this numerical campaign.
- Resource floors, caps, allocation failures and timeouts produce explicit
  restricted/incomplete outcomes. No automatic expansion to another drive,
  deletion of old evidence, bigger texture layout or production changes.

## C6: Final Evidence And Decision

- [ ] Verify every new terminal record, parent derivation, score selector and
      prediction registration; reconcile actual compute/storage use.
- [ ] Publish reference adequacy and compensation tables for the important
      regressions, including unresolved errors and finite-order limits.
- [ ] Publish the factor coverage record and dial table: where each control acts,
      regeneration requirements, range, reference/score response, costs,
      restrictions, failures and prospective evidence.
- [ ] Produce compact full-time RMSE curves, reference-error versus cost plots,
      compensation/interaction plots and the existing noon/early-morning point
      views where supported. Keep scopes and shared color scales explicit.
- [ ] Classify the result separately as improved understanding, numerical dials,
      measurement-improving accuracy dials, and work still unresolved.
- [ ] Refresh the owning findings/status documents and validate the applicable
      implementation/documentation evidence before claiming completion.

Production promotion, application color/strobing changes, full-spectrum N6,
infinite-order claims and new physical-model calibration are not part of this
execution matrix. A completed bounded campaign can honestly qualify no new
accuracy dial; its explanations and rejected predictions remain useful evidence.

## Implementation And Launch Boundary

Orchestration and controls live under
`experiments/sky-accuracy-dials/continuation/`, adapting the existing
profile, view, streaming execution, analysis and order helpers.
The implemented commands and their exercised status are owned by the
[status document](status.md#continuation-execution). Each coherent implementation
unit requires applicable local checks and mapped review. Evidence from one
milestone does not certify later changes. Source implementation and manufactured
proof acceptance do not establish execution of the planned GPU targets.

Generated runs remain under `tmp/experiments/sky-accuracy-dials/runs/` with the
existing allocation, progress heartbeat, path checks, seals and scratch rules.
The owner has requested execution. Resume from the accepted phase boundary in
the status document and preserve all preceding evidence; completed runs supply
comparison inputs without being replayed.
