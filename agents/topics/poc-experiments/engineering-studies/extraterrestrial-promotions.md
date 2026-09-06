# Extraterrestrial Experiment Promotions

Focus: Measured alternatives and retained or rejected mechanisms.

Related owners: [protocols](../protocols/extraterrestrial-promotions.md), [sources-provenance](../../pure-research/sources-provenance/extraterrestrial-promotions.md).

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
