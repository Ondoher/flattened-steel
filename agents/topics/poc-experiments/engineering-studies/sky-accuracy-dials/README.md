# Predictable Sky Accuracy Dials Experiment

Completed: [H75-H82 geometry-driven incoming refinement](geometry-incoming-results.md).
No tested candidate qualifies against complete Sun-only accuracy/cost controls.
The campaign isolates a base-layer alignment error and follows it through
placement ensembles and component-only refinement; local fixes do not transfer
across the development panel. [Execution and verification](geometry-incoming-execution.md)
retain all decisions. Conditional fresh validation/native/B1/scenes were not
triggered. Production is unchanged; the experiment remains open, with no job or
further campaign selected.

Completed: [H69-H70 adaptive incoming grids](adaptive-incoming-results.md).
All3 layered designs fail the joint local gate after both paper/Toronto screens
and fine-count rescue. Toronto finest worst errors12.61-25.00% exceed the Sun1024
control's3.78%; none advances. Accepted00455/00456 own images and verification.
[Execution decisions](adaptive-incoming-execution.md) preserve qualifications;
conditional H71-H74 were not reached. Production unchanged; no job is active.

Completed: [H68 Sun-focused incoming grids](incoming-sun-results.md). Mean local
J2 error falls from130.2% with ordinary68 to4.27% with Sun256 and1.37% with
Sun1024; hybrid1024 gives1.05% mean/4.13% worst. Accepted00449/00450 own all108
cases, raw/normalized figures, maps and verification. Local scope only; no
full-cache correction, paper RMSE qualification, promotion or active job.

Completed: [H67 sunset L1/J2 attribution](sunset-j2-results.md). At the selected
sunlit exact node, sparse incoming F68 yields6.43x independent red J2 even with
accurate L1; refined continuous angular integration gives1.00x. Smaller input
errors partly cancel this. Accepted00447/00448 own probes, images and verification.
Three-band/local scope only; no production correction or further run selected.

Completed: [H66 camera-facing outgoing grid](camera-grid-results.md). Rotating
the same-count dense region toward the primary sunset view changes brightness
by only-0.64% there; the large later-order excess remains. Accepted00445 owns
the replay, all15 camera wavelengths, images and verification. Production is
unchanged; no job or further campaign is active.

Completed: [H65 independent pre-sunset/sunset comparison](presunset-probe-results.md).
The independent solver corroborates libRadtran at both times and all three rays;
both corrected caches retain large later-order excesses. Accepted00441 verifies
the data;00442 owns the shared lower-exposure preview. No job remains and
production is unchanged.

Completed: [H64 Toronto dusk independent brightness](twilight-reference-results.md).
Matched libRadtran probes identify a substantial sunset later-order excess in
both corrected caches; +30minute higher rays agree closely. Late-twilight sampling
and layer limits remain explicit. Accepted00433 verifies the campaign; no job
is active and production remains unchanged.

Completed: [H63 matched Toronto scene comparisons](toronto-scene-results.md),
all six H62 views with measured phase/SSA applied to every configuration.
The results own four comparison sheets, runtime/lookup measurements and
accepted00426 evidence. No GPU job is active; production and earlier evidence
remain unchanged.

Completed: the owner-selected [H62 sunset +60-minute comparison](outgoing-scene-results.md#additional-one-hour-twilight-scene),
including final image, measurements and explicit progress-log qualification.
Earlier evidence and production remain unchanged; no GPU job is active.

Completed [H62 matched scene renders](outgoing-scene-results.md): three noon
headings, sunset and twilight, matched lookup proofs and runtime measurements.
The results own images and qualifications. Production is unchanged; no job is
active. The additional one-hour scene is linked above; further scenes await selection.

Completed [H61 Sun-focused outgoing grid](outgoing-focus-results.md): same4374
slots/F68 incoming,86% lower isolated N1 interpolation residual and full B1 RMSE
11.59396 versus Corrected60 11.66848 and Original40 11.62291. The paper gate
passes; production and earlier evidence remain unchanged.

Stopped further [H60 incoming refinement](incoming-resolution-results.md) after
clarifying that H59's N1 defect is outgoing-angle interpolation. The completed
256-direction test improves higher-order error but worsens total selected-ray
fit; it leaves N1 identical. Evidence and final
verification are preserved. H61 above owns the subsequent outgoing test;
production remains unchanged.

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

The [H54 selected-ray reference overlay](toronto-order-attribution-results.md#h54-selected-ray-with-libradtran)
adds saved libRadtran references to 00342's 0.05-degree cumulative-order plots,
with explicit N2/N3 gaps and an N4/all-orders distinction. No solver was rerun.

Completed [H53 matched full-scene capture](scene-render-results.md) shows
original15 and normalized60 caches in the actual production renderer, for
canonical and Toronto optical material separately. The results own all image
links, measurements, execution decisions and limits; production is unchanged.

Completed [H48-H52 Toronto horizon order attribution](toronto-order-attribution-results.md)
locates the0.05-degree excess and demonstrates angular/transport error,
propagation and cancellation. The [plan](toronto-order-attribution-plan.md) and
[execution summary](toronto-order-attribution-execution.md) retain scope and
verification. No further numerical campaign or production change is selected.

Latest completed follow-on: [H47 Toronto three-method order comparison](libradtran-horizon-results.md#h47-toronto-three-method-order-comparison),
using the completed [shared validation tool](../../../../../scripts/libradtran/README.md).
H42 reference qualification and H43's matched production compiler/lookup comparison
are scientifically complete, with new comparison images. Completed H44 compares
the canonical 100% aerosol atmosphere against production N4, including final
images, spectral residuals and physical-input/convergence checks. The [H41 residual tint
diagnosis](horizon-tint-results.md) and H39/H40 remain immutable parents.
Production source stays read-only; no local-source extension is selected.

**Reopened for owner-selected independent execution on 2026-10-16.** The
[flat/local horizon results](flat-local-horizon-results.md) own the independent
expected appearance, current-app comparison, physical explanation and uncertainty.
The [plan](flat-local-horizon-plan.md) and [execution notes](flat-local-horizon-execution.md)
retain scope, decisions and verification. The [status lifecycle](status.md#experiment-lifecycle)
owns current work; the [suspension record](suspension.md) preserves the earlier boundary.
The earlier [gray horizon diagnosis](horizon-diagnosis-plan.md) retains the
San Jose solar-noon and Flat closest witnesses. The separate
[angular-quadrature experiment](../sky-angular-quadrature/results.md) is ended.
The older
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
