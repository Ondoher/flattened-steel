# Predictable Sky Accuracy Dials Experiment Plan

Stopped further [H60 incoming refinement](incoming-resolution-results.md) after
clarifying that H59's N1 defect is outgoing-angle interpolation. The completed
256-direction test improves higher-order error but worsens total selected-ray
fit; it leaves N1 identical. Evidence and final
verification are preserved. No new outgoing test or production change is selected.

Completed [H59 angular interpolation attribution](angular-interpolation-results.md).
Exact-angle N1 readout removes46-92% of the selected brightness deficits and
improves full B1 RMSE to11.5920mW, beating original11.6229 and corrected11.6685.
Later-order discrepancies remain; bounded recurrence and incoming-rule limits are
explicit. Production is unchanged and no follow-on campaign is selected.

Completed [H58 largest-libRadtran-disagreement comparison](worst-ray-orders-results.md)
ranks all1377 B1 cells and compares the three largest retained-reference errors
through scattering orders. Fresh matched libRadtran and independent references
agree in brightness much more closely than either agrees with the retained
reference. Smaller cache errors begin at N1 and are partly offset by later light.
Final00368 verifies; precision limits and reference-setup differences are explicit.
Production and prior evidence remain unchanged.

Completed [H57 selected paper-ray order comparison](paper-ray-orders-results.md): all40 wavelengths for three adverse/control rays, matched independent GPU and libRadtran references, final swatches/spectra and pure-order cancellation diagrams in verified00363. The corrections reduce excess at one low ray but deepen a deficit at its counterpart; near the Sun, improved later-order contributions expose unchanged dim N1 light. External sampling limits and the disclosed post-compute monitoring repair remain explicit. Production is unchanged.

Completed [H56 B1 regression diagnosis](paper-b1-diagnosis-results.md): both full Direct40 ablations and the factorial/order/reference ledgers are accepted through00351. Transport and normalization each worsen paper RMSE slightly; their changes expose existing radiance deficits and interact. The normalization second-order change helps the final fit, but third/fourth-order changes outweigh it. Reconstruction/rounding contributes negligibly. Toronto evidence is preserved; production is unchanged.

Completed [H55 Bruneton B1 comparison](paper-b1-results.md): all 40 paper wavelengths, all 17 interval scores and Figure5 dome comparisons are retained in accepted run 00347. Aggregate RMSE rises from 11.6229 to 11.6685 (+0.3921%); the paper no-regression gate is not met. Exact baseline/J1 checks, local types, image inspection, immutable verification and cleanup pass. Production remains unchanged; the experiment stays open.

Completed [H53 full-scene capture](scene-render-results.md) follows the owner's
[scene-only plan](scene-render-plan.md), with separate matched canonical and
Toronto pairs and verified images. No additional campaign is selected.

H48-H52 [Toronto order attribution](toronto-order-attribution-results.md) is
complete: saved0.05-degree order budgets, independent local references,
component controls, propagation/cancellation tests and reviewable figures.
The [plan](toronto-order-attribution-plan.md) retains the registered method.
No additional numerical work or production promotion is selected.

The completed continuation is the owner-selected [H47 Toronto three-method order comparison](libradtran-horizon-results.md#h47-toronto-three-method-order-comparison).
Its registration and results own current findings, qualifications and completion
gates. Completed H42/H43 retains its zero-aerosol comparison. The earlier [flat/local plan](flat-local-horizon-plan.md) remains historical
guidance for that completed package. The original campaign below retains
its historical work items and gates; completed steps do not activate new runs.
Historical review-gate wording below records its original campaign; current
work follows the repository's no-review experiment verification policy.

## Acceptance Gate

Can independently varied and combined numerical controls predict spectral changes and accuracy trends on unexecuted configurations without relying on cancellation or uncontrolled storage growth?

## A. Controlled Runner And Baseline

- [x] Declare hypotheses, storage limits, withholding scheme, and prediction gates in the design.
- [x] Capture the review baseline before implementation.
- [x] Refresh mapped reviewer readiness for this topic.
- [x] Snapshot authenticated compact controls, 17 condition geometries, Kider spectra, and comparison spectra.
- [x] Implement exclusive run allocation, progress heartbeat, source/input hashes, storage enforcement, terminal seals, verification, and scratch cleanup (formal implementation gate remains below).
- [x] Implement generic geometry and a streaming single-wavelength GPU runner retaining spectra rather than fields (baseline and review gates remain below).
- [x] Reproduce the Native48 baseline and Native51 development comparison; establish repeatability and implementation parity.
- [x] Type-check the coherent implementation and execute positive/negative prediction-contract proofs.

Implementation completion requires current mapped primary and independent-audit
evidence with an exit-0 `CLEAN` ledger validation. The [status](status.md) identifies
the machine-owned completion record; scientific checkmarks do not waive this gate.

## B. Isolated Mechanisms

- [x] Run Qview 30/60/120 on the same fields; predict held-level changes from the lower levels.
- [x] Compare cumulative interpolation, grouped first/higher orders, and continuous analytic first order.
- [x] Run positive incoming-quadrature manufactured checks and a count ladder; verify pure J1 invariance.
- [x] Vary source and recurrence transport integration independently; verify the predicted first affected order.
- [x] Refine retained near-ground nodes and outgoing directions, using analytic first order to separate reconstruction from higher-order effects.
- [x] Freeze every quantitative candidate prediction before execution, distinguish exploratory screens, retain misses, and measure costs and spectral/score effects separately.

## C. Relationships And Validation

- [x] Run altitude x first-order-representation and selected angular/path interactions as complete factorials.
- [x] Withhold intervention outcomes at the remaining conditions and validate full 17 x 81 x 40 finalists.
- [x] Implement density factorization and a real N5/N6 control when the preceding evidence identifies a useful discriminating test; require prefix parity before interpreting extra orders.
- [x] Separate empirical convergence from measured Kider fit and quantify unsupported/nonmonotone controls.
- [x] Produce a compact dial scorecard, prediction calibration, spectra/score tables, and scientific figures.
- [x] Verify all retained runs, scratch cleanup and storage totals; publish executable commands and limitations.
- Final implementation gate: applicable source-review evidence must satisfy the same current `CLEAN` validation required above.

## Promotion Boundary

Experiment results are evidence, not production architecture. Promotion requires a separate production-owned design, implementation plan, and verification boundary.
