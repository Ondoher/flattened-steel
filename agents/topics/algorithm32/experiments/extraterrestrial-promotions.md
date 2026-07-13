# Extraterrestrial Experiment Promotions

Status: XA1 and XA2 ready for implementation; XA3 planned and requires
further protocol research.

These experiments turn retained extraterrestrial formulas and external data
into standalone evidence owned by this repository. They are preimplementation
research: no runner may import Algorithm32, `flat32`, a renderer, a cache, an
application, or another repository. Historical extraterrestrial records may
inform the question but are neither dependencies nor oracles.

## Retained Foundation And Promotion Gates

E4--E7 are useful standalone local foundations, and their current direct test
suite reports 27 passing tests. They are retained promotion candidates, not
official or citable experiments:

| Candidate | Foundation used here | Required promotion repair |
| --- | --- | --- |
| E4, `EXPERIMENT-A32-WF-000011` | Point-response and raster-conservation identity. | Replace generic "spectral flux" terminology with spectral irradiance density `F_lambda` in `W m^-2 nm^-1`. |
| E5, `EXPERIMENT-A32-WF-000012` | Ordinary/projected solid-angle integration and uniform-disk identity. | Make every input quantity and integration measure explicit. |
| E6, `EXPERIMENT-A32-WF-000013` | Direction-resolved visibility/transmittance integration. | Add explicit units and define every weight's measure and semantics. |
| E7, `EXPERIMENT-A32-WF-000014` | Pre-display spectral-radiance composition. | Add explicit units and distinguish integration weights from already integrated packets. |

Each candidate also needs its full stable ID in every artifact, exact command
and input identity, hashes, and bounded claim/non-claim statements before it
can be accepted and registered in `/references/experiments.md`. An imported
record or passing runner is not official evidence. XA1 and XA2 must restate
the needed analytic identities inside their own standalone definitions; they
must not import E4--E7 as runtime dependencies or treat retained results as
oracles.

## XA1 -- Point-Source Flux Conservation

- ID: `EXPERIMENT-A32-XA-001`; readiness: ready.
- Supports: `FACT-A32-002313`, `FACT-A32-002315`, `FACT-A32-003023`, and
  `FACT-A32-003034`.
- Question: for a typed point source owning spectral irradiance density,
  normalized response, exact perspective pixel solid angles, explicit
  off-raster mass, and exact-source-direction visibility/transmittance, does
  pixel radiance conserve every spectral channel without a second
  transmittance application?
- Inputs: an explicit typed 15-bin `F_lambda` packet in `W m^-2 nm^-1`, source
  identity and exact direction, direction-specific visibility and spectral
  transmittance, perspective corner rays, response weights, source positions
  including boundaries, and an independent pixel-solid-angle oracle.
- Iteration: one source position, response, transport state, and raster
  configuration.
- Acceptance: response weights are nonnegative and total one; after
  `E_lambda^t = V_s T_lambda(omega_s) F_lambda`, the on-raster sum
  `sum_i(L_lambda_i Omega_i)` plus the explicit off-raster partition
  reconstructs `E_lambda^t` within a predeclared binary64 tolerance. Negative
  controls must detect destination-pixel transport after spreading and any
  second transmittance application.
- Reuse boundary: E4 already establishes the core raster-conservation
  identity. XA1 independently restates it while adding typed source identity,
  exact perspective solid angle, and exact-direction transport ordering; it
  must not duplicate E4 merely under a new name or depend on E4's artifacts.
- Intended result: `references/results/experiments/xa1-point-source-flux-conservation/result.md`.

## XA2 -- Extended-Source Transport And Spectral Composition

- ID: `EXPERIMENT-A32-XA-002`; readiness: ready.
- Supports: `FACT-A32-003025` and `FACT-A32-003026`.
- Question: does direction-by-direction visibility/transmittance followed by
  exact-pixel solid-angle integration preserve the declared extended-source
  boundary without a center-direction shortcut, and does pre-display
  composition apply every contribution exactly once without a second coverage
  or transmittance multiplier?
- Inputs: perspective pixel domains, analytic uniform disks, declared
  per-direction blockers and transmittance, exact quadrature directions and
  solid-angle weights with units, explicit path/endpoint/point spectral
  packets, and an independent high-order angular integral.
- Iteration: disk radius, occlusion geometry, quadrature refinement, and
  spectral component combination.
- Acceptance: the coupled exact-pixel result converges to the independent
  integral; negative controls detect center-direction visibility or
  transmittance, a second scalar coverage multiplier, a second transmittance,
  and incorrect or duplicate composition. The final packet equals the
  declared channel-wise sum within a predeclared tolerance.
- Reuse boundary: E5--E7 own the component conservation, transport, and
  composition identities. XA2 independently restates those identities and
  supplies the coupled exact-pixel extraterrestrial boundary, wrong-route
  controls, and no-second-multiplier conclusion without depending on their
  retained artifacts. Its first Stage 12 use is the uniform distant Sun-disk
  mechanics fixture; it establishes no Moon rendering or lunar ordering.
- Intended result: `references/results/experiments/xa2-extended-source-transport-and-composition/result.md`.

## XA3 -- Calibrated Sun, Sirius, And Moon Inputs

- ID: `EXPERIMENT-A32-XA-003`; readiness: requires further protocol research.
- Stage boundary: the active Sun-and-stars implementation does not consume the
  lunar branch. Before XA3 executes, its Sun and Sirius results must be
  independently classifiable from the deferred Moon work, or the Moon work
  must move to a newly registered experiment identity.
- Question: do the retained Sun, Sirius, LIME, Air-LUSI, and ROLO payloads
  reproduce their declared spectral-basis transformations and independent
  calibration comparisons under predeclared uncertainty bounds?
- Inputs: repository-local payloads under
  `references/downloads/extraterrestrial-sources-2026-07-12/`, their canonical
  hashes and source identities, declared wavelength/bin transformations, and
  explicit uncertainty models.
- Iteration: source class, spectral bin, and published measurement or anchor.
- Research prerequisite: predeclare an objective case domain, spectral-bin
  operators, independent oracle values, uncertainty propagation, tolerances,
  and result classification. Freeze the exact LIME release branch, including
  release-linear interpolation, coefficient/covariance ordering, release SRF
  sign convention, and nearest-signed ASD phase selection. Use Air-LUSI bins
  2--15 as the decisive fully covered comparison and a qualified ROLO bin-1
  comparison only as the short-wavelength complement.
- Acceptance: verify every selected payload hash; independently reproduce the
  CALSPEC Sirius transform, the canonical Sun packet against TSIS, and the
  selected disk-integrated Moon model; then report all residuals with the
  predeclared uncertainties and classification. The Moon conclusion remains
  disk-integrated and does not claim a resolved lunar BRDF/radiance model.
- Fact boundary: no new paper-facing calibration value is admitted until this
  research is complete and the experiment produces its citable result.
- Intended result: `references/results/experiments/xa3-calibrated-celestial-inputs/result.md`.

## Subjective Globe Cases Are Not Evidence

The ER6/ER8 eight-case San Jose and Union Glacier matrix was selected for
subjective rendering. It is not an objective scientific sample, numerical
convergence domain, implementation oracle, or publication fixture. Its JPL
responses, reconstructed states, CPU residuals, and rendered outputs may be
retained as application/rendering inputs only; none may support a fact or an
official experiment. They are forbidden as XA3 cases, expected values, or
calibration oracles.

`EXPERIMENT-A32-XA-004` is therefore retired as an experiment proposal and
must not be created from this matrix. A future paper-facing ephemeris,
geometry, or convergence claim would require a new experiment ID, an
objectively selected case domain, and independently predeclared controls.

The current external bibliography and downloaded payload ownership are in the
[reference topic](../../references/README.md). Record 067's rolled-back code
promotion is excluded from every XA experiment and cannot serve as a
production or parity oracle.
