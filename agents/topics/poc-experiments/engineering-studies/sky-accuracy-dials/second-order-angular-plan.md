# Fixed-point Second-order Angular Admission

Extension: `compensation-attribution-v1`. This prospectively registers the
azimuth64 targets and complete empirical allowance required by the
[outer refinement plan](second-order-refinement-plan.md). It is frozen before
either angular target. Existing coarse and Simpson4 outputs are known; the
Gaussian8, Simpson8 and new angular outcomes are not used to choose these gates.

## Exact Target And Bounded Stages

Keep the original C0 `p-0930-5-7` observer and view, channels 0/8, atmosphere,
ground albedo, phase functions and order definition. Use the complete accepted
Gaussian8 square-root-height view from the registered `gauss8-high` stage as
the baseline: all 32 original physical nodes and their exact attenuation.

- `low`: independently evaluate radial16/azimuth64 midpoint at its sixteen
  nodes in physical intervals 0/1.
- `high`: independently evaluate the remaining sixteen nodes in intervals 2/3,
  then reuse the accepted low-stage values unchanged to assemble the full view.

The original ordinary-coarse, ordinary-fine and mapped-fine rows remain
original evidence. Newly solved radial16/azimuth64 rows have their own identity.
At each node retain atmosphere-Rayleigh, atmosphere-Mie, ground-Rayleigh,
ground-Mie and their combined source, with the unchanged independent global
L1 admission. Each stage computes 24,576 incident representatives with four
bounded workers. Missing halves remain null, never zero.

## Held Angular Prediction

For each channel and each of the four components and combined source, use the
same Gaussian8 nodes. Let w be the positive path weight, T the admitted original
view transmission, and U_T its allowance. For two local source estimates A/B
with incident allowances U_A/U_B define

```text
D(A,B) = sum(w*T*abs(A-B))
I(A,B) = sum(w*T*(U_A+U_B))
V(A,B) = sum(w*U_T*(abs(A-B)+U_A+U_B))
C(A,B) = I(A,B)+V(A,B)
```

Absolute value precedes path summation; opposite height responses cannot cancel.
Denote ordinary radial8/azimuth16 by Q0, radial16/azimuth32 by Q1, and the new
radial16/azimuth64 by Q2. Predict all ten whole-view comparisons satisfy

`D(Q2,Q1) <= 0.2*D(Q1,Q0) + C(Q2,Q1) + 0.2*C(Q1,Q0) + 1e-8 W`.

The earlier Q0-to-Q1 step changed both angular coordinates. This is a forecast
of a smaller residual angular response, not an isolated azimuth convergence
exponent. Report signed responses beside the uncancelled responses, and retain
all failed and unresolved checks. Per-interval values locate failures but do
not silently replace the registered whole-view tests.

## Empirical Reference Allowance

The reference candidate R is the complete Gaussian8 view with Q2. The source
components are independently integrated before being combined. For each
spectral channel retain these separate nonnegative terms, in radiance watts:

1. Incident and final-view allowances of R, including their cross term.
2. Outer allowance: the larger of `abs(G8-G4)+U(G8)+U(G4)` and
   `abs(S8-G8)+U(S8)+U(G8)`, using ordinary-fine angular values and their
   incident-plus-view U. Both complete comparisons are required.
3. Azimuth allowance: `D(Q2,Q1)+C(Q2,Q1)` on the exact Gaussian8 nodes.
4. Radial-placement allowance: `D(Qmapped,Q1)+C(Qmapped,Q1)` on those same
   nodes, where Qmapped is the original independent mapped-fine placement.

Sum these terms as U_R. This deliberately retains some overlapping inner
uncertainties. It is an empirical numerical allowance, not a rigorous error
bound, measurement uncertainty, or proof against every shared discretization
bias. Outer changes are measured under Q1; this admission assumes their
interaction with the smaller Q1-to-Q2 response is covered by retaining the full
angular response and placement terms. A material angular response or failed
shrinkage test rejects that assumption and calls for a matched additional
outer/angular comparison. The earlier isolated angular factorial supplies
supporting local evidence, without becoming a whole-path bound.

Require all physical inner admissions, all twelve outer predictions and all
ten held angular predictions to pass, complete contributions, and
`U_R <= 5e-5 W` and `U_R <= 0.2*abs(H-R)` in both channels. Failure keeps the
component reference unqualified and selects a bounded diagnostic refinement.
Do not tune these gates to obtain an adequate result.

## Dial And Measurement Assessment

Once admission passes, apply the outer plan's frozen 80% error-reduction
prediction to P55 raw and P48 density factoring with their exact matched
controls and fixed-field allowances. Compare the remaining six existing
controls descriptively against the same reference; a change below joint
allowance is unresolved. These old GPU outputs are already known. The new
reference output, not the old candidate output, is the held quantity here.

For original H, separate its P2 numerical difference H-R from the measurement
residual after substituting physical P1 and P2 while retaining original effective
J3/J4. Preserve the exact SSE identity and compensation cross term. A frozen
substitution is a component diagnostic and cannot qualify a regenerated N4
solver or a full Kider score. Register the contrasting 12:30 transfer case
before its independent physical viewing reference is computed.

## Resources And Evidence

Reserve 4 MiB and at most one CPU-job hour per angular stage, with a one-minute
sealing reserve, twice the slowest complete-point cost forecast, four workers,
unchanged host headroom, C5 allocation and 40 GiB disk floor. Retain compact
source sums and provenance; incident arrays remain reproducible in memory.
Use a separate derived assessment record, capped at 4 MiB and five minutes,
for exact integral replay, gate outcomes, dial comparisons and score algebra.
Record worker time separately from the original wall-time CPU-job ledger.

The new angular executor and assessment helpers share the deferred source unit
based at `871690d3`. Local type checks and focused proofs continue; formal review
remains deferred under the owner's instruction. Production is read-only and
all earlier generated evidence remains immutable.
