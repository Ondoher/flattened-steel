# Predictable Sky Accuracy Dials Experiment

Current focus: the [gray horizon diagnosis](horizon-diagnosis-plan.md), selected
by the owner on 2026-10-14. Start there for the San Jose solar-noon and Flat
closest witnesses, accuracy interactions and bounded execution. The older
[follow-up guide](follow-up-context.md) retains Kider evidence and hypotheses.

The [bounded horizon results](horizon-diagnosis-results.md) now own the paired
stage measurements, continuous local reference and species/display attribution.

The current [H7 aerosol horizon results](horizon-aerosol-results.md) show the
measured phase/SSA response in both N1 geometries, with sampled-color comparisons.
The [experiment lifecycle](status.md#experiment-lifecycle) owns suspension
and resumption. Earlier Kider scientific focus: the
[aerosol phase/albedo sensitivity](aerosol-sensitivity-results.md).
Use its [supported-wavelength interpretation](aerosol-sensitivity-results.md#supported-wavelength-interpretation):
454-712.5 nm improve in aggregate; phase and albedo each improve both controls,
but their combination overshoots. The owner excludes unsupported 360 nm from
this diagnosis, with historical full scores preserved. The direct solver
already avoids the identified approximation mechanisms; production adoption
is still on hold. The [case evaluation](aerosol-cancellation-evaluation.md) owns the
preceding hypotheses, using the [Sun-angle residual analysis](angular-residual-results.md).
A shared visible deficit follows Sun angle after controlling time/elevation
means, while the 360 nm excess has little conditional angular predictability.
The report separates held-time diagnostics from physical attribution. No run
is active and the adoption hold remains. The [alternate-ray reference](alternate-rays-results.md)
owns the original-atmosphere reference; [regional results](reference-comparison-results.md)
own the earlier full retained-data comparison.

The [completed direct convergence results](direct-convergence-results.md)
evaluate the [continuous mathematical target](idealized-model.md). The cache-free
stochastic solver includes all scattering orders in expectation; the main
Kider disagreements persist. Fifteen of 20 values meet the preset sampling
precision, with the remaining widths reported explicitly. No run is active.
The [earlier deterministic results](direct-solver-results.md) remain evidence.

The [five diagnostic rays](diagnostic-rays.md) give concrete retained Kider
mismatches to examine against that formulation, with exact selectors, signed
spectral residuals and a same-time, same-elevation contrast pair.

### Local Math Preview

Open [Algorithm Idealization](idealized-model.md) in VS Code and press
**Ctrl+Shift+V** for Markdown Preview, or **Ctrl+K, V** for preview beside the
source. VS Code's built-in local KaTeX renderer handles the equations; its
`markdown.math.enabled` setting defaults to `true`. Use `$...$` for inline
math and `$$` on separate lines around display equations. See the
[VS Code math documentation](https://code.visualstudio.com/docs/languages/markdown#_math-formula-rendering).

The idealization document's 13 display equations were checked with the locally
installed KaTeX renderer without network access. This checks equation rendering;
it is not a numerical validation of the atmospheric model.

## Evidence Routing

The [solar-registration analysis](solar-registration-results.md) is complete
through accepted 00228. Retained measurements and known-direction controls
isolate sparse-representation bias and regional disagreement in the fitted
solar axis. No timing/alignment correction or Kider RMSE gain is qualified.
The prior [remaining-factors pass](remaining-factors-results.md) remains closed,
including its two failed GPU observation attempts. No execution is active.

The [findings brief](accuracy-findings-brief.md) summarizes what is useful now
and the recommended next substantial milestone.
The [status](status.md) owns execution progress, current work and review gates.
The [error-source inventory](error-sources.md) prioritizes attribution before
further mitigation development.
The [hypothesis report](results.md) records completed findings, and the
[continuation goals](continuation-goals.md) define the next scientific objective.
The [continuation findings](continuation-results.md) record the completed C0-C6
numerical and compensation evidence. The active
[attribution plan](attribution-plan.md) and [attribution findings](attribution-results.md)
own the subsequent component-reference and compensation investigation.
The [second-order viewing-ray reference](second-order-reference-plan.md) develops
the next package's physical target and bounded execution sequence.
Its [outer refinement](second-order-refinement-plan.md),
[angular admission](second-order-angular-plan.md), and conditional
[12:30 transfer](second-order-transfer-plan.md) registrations freeze the
remaining component-reference and compensation tests.
The [matched higher-order registration](matched-order-plan.md) and
[altitude-by-order forecasts](matched-order-transfer-plan.md) distinguish
finite omitted scattering from changing reconstruction and recurrence responses.
The [altitude convergence registration](altitude-convergence-plan.md) tests
held count responses and competing interpolation/boundary error rates.
Its [ground-boundary control](ground-boundary-plan.md) separately tests the
missing atmospheric-side direct-ground contribution to the J2 ground sample.
The [nonnegative-order bound](positive-order-bound-plan.md) tests how much of
the remaining measurement excess cannot be removed by correcting later orders.
The [source-column audit](source-column-plan.md) separates source-transmission
convergence from cache reconstruction and the existing source/transport balance.
The registered [source/reconstruction diagnostic](source-reconstruction-plan.md)
uses those retained columns to distinguish the two errors at matching samples.
The [phase/transmission diagnostic](phase-reconstruction-plan.md) separates
the remaining outgoing, solar-phase and source-transmission reconstruction terms.
The [continuation execution plan](continuation-plan.md) defines the phased tests
and gates. The [compiler contract boundary](continuation-review-resolution.md)
records the owner's narrow repair and compatibility authorizations.

## Objective

Develop predictable atmospheric-scattering accuracy controls judged against
scientific expectations and independent numerical references, with interaction
tests and bounded storage. Report Kider measurement agreement separately, under
the [correctness standard](continuation-goals.md#standard-of-correctness).

## Governing Documents

- [Design](design.md)
- [Completed first campaign plan](plan.md)
- [Status](status.md)
- [Hypothesis report, overall conclusion and evidence](results.md)
- [Continuation goals and success criteria](continuation-goals.md)
- [Continuation execution plan](continuation-plan.md)

## Repository Surfaces

- Authored source and controls: `experiments/sky-accuracy-dials/`
- Generated output: `tmp/experiments/sky-accuracy-dials/`
- Experiment documentation: its owning locations, as authorized in the [design](design.md#isolation-boundary)
- Production and other experiments: read-only unless separately authorized

The [altitude/solar transmission attribution](transmission-reconstruction-plan.md)
separates the remaining phase-independent reconstruction error using bounded
independent crossed-coordinate columns.

The [density-factored column test](column-reconstruction-plan.md) evaluates a
representation derived from the known exponential density profile after the
altitude source of transmission error has been isolated.

The [original-grid/source-count test](source-grid-plan.md) checks whether the
identified representation corrections restore predictable source refinement
with the original altitude and solar anchors.

The [accuracy-control map](accuracy-controls.md) records which numerical and
operational controls are qualified, their mechanisms, costs and remaining
limits.

The [angular-background diagnostic](angular-background-plan.md) partitions
existing radial/azimuth refinement responses using retained incident radiances,
without assuming the finest angular rule is an oracle.

The [smooth angular partition](angular-regions-plan.md) traces the remaining
directional refinement response toward the Sun, near the radial tangent and
elsewhere, using the same retained incident samples.

The [held source refinement](source-refinement-plan.md) tests a genuinely new
S320 count after the identified first-order reconstruction errors are corrected.

The [manufactured angular integral](angular-lobes-plan.md) isolates sampling of
the declared phase-function peaks, with an independent analytic answer and
equal-cost coordinate comparisons.

The [boundary-aware angular frame](angular-frame-plan.md) carries that sampling
question into the actual atmosphere at one fixed point. Its
[resource extension](resource-extension-plan.md) conserves the total allocation
while making unused earlier phase capacity available for reference work.

The [frame/placement control](angular-frame-control-plan.md) tests why the
boundary-aware atmospheric construction overshoots, by isolating its azimuth
origin and polar node placement against the known analytic phase integral.

The [endpoint/cancellation control](angular-endpoint-plan.md) follows that
identified placement error with exact-zero components, a held-count formula
and a matched coordinate change that retains the physical boundaries.

The [atmospheric coordinate attribution](angular-theta-plan.md) tests that
identified mechanism on actual incident radiance at the same point, using a
matched-count control and one independent-coordinate refinement check.
