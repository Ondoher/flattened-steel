# Execution-Profile Incremental Verification

Status: Stage 13 Steps 3.0 through 3.11 implemented; Step 3.12 closure is
active. This document owns the verification boundary used by Steps 3.1 through
3.12; the method inventory continues to own implementation coverage.

## Frozen Before-Change Boundary

The complete pre-change Node boundary was executed on 2026-08-08 before the
first Step 3.1 edit:

- `npm run test:algorithm32`: 467 specifications, zero failures, 74.6 seconds;
- `npm run typecheck:algorithm32`: pass;
- Native test basis identity:
  `sha256:ecd39bb8c4aa5591d5d6d5043c68f881d92cdde893c3f602dc3930a2ce57d971`;
- Native-15 production basis/profile values:
  `profiles/native-15/_tests/native-15-profile.spec.js`;
- canonical atmosphere CPU and shader values:
  `implementation/canonical-atmosphere/_tests/CanonicalAtmosphere.spec.js`;
- distant and local source packet/placement behavior:
  `implementation/distant-sun/_tests/distant-sun-light-source.spec.js` and
  `implementation/local-sun/_tests/LocalSunLightSource.spec.js`;
- Native grass albedo and BRDF:
  `implementation/uniform-lambertian-ground/_tests/uniform-lambertian-ground-boundary.spec.js`;
- distant plan identity, pass ordering, reuse, and `distant-sun-j-through-4`
  result:
  `implementation/distant-sun/cache/_tests/DistantSunCacheController.spec.js`;
- local fused plan ordering, identity, zero packed transport, and
  `local-sun-j-through-4` result:
  `implementation/local-sun/cache/_tests/local-sun-cache-plan.spec.js`;
- selected binary64 CPU values and cache sampling:
  the distant/local CPU cache suites and retained parity-policy fixtures; and
- runtime assembly/display behavior:
  `rendering-runtime/_tests`, `shader-assembly/runtime/_tests`, and
  `implementation/bruneton-color/_tests`.

The current browser and application authorities remain the existing commands
`npm run test:algorithm32:three` and `npm run test:ui:flat32`. They are required
at the first group that changes their runtime owners and are not substitutes
for the fast Node gate after each earlier group.

## Method Coverage By Group

| Step | Inventory owners covered                                                                           | Incremental authority                                                                               |
| ---- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 3.1  | `SpectralBasis`, spectral semantics, direction-domain capabilities, shared cache-order type        | basis identity, point-coordinate construction, domain unit/weight/stencil suites, typecheck         |
| 3.2  | `CanonicalAtmosphere`, distant/local source constructors, uniform Lambertian boundary              | exact Native physical suites plus direct-40/aligned packet CPU and shader/cache probes              |
| 3.3  | `Algorithm32`, Native profile completion, `SharedModel`, `SpectralModel`, spherical/Flat placement | facade/model/placement suites and rejection-before-resource checks                                  |
| 3.4  | distant/local domain selections, spherical/Flat cache geometry, field packing, CPU cache artifacts | packing round trips and exact Native stencils/cache packet shapes                                   |
| 3.5  | `Reference`, `SpectralCalculator`, distant primary evaluator                                       | Native J1/final-view probes and multi-ray direct-40 J1 sampling                                     |
| 3.6  | existing distant CPU provider and J2/J4 recurrence                                                 | selected Native J2/J4 binary64 values, identities, and direct-40 completion                         |
| 3.7  | distant CPU J3/J5 additions                                                                        | deterministic new fields plus unchanged J1/J2/J4 probes                                             |
| 3.8  | existing distant GPU controller and J1/J2/J4 plans                                                 | exact Native plans/shaders and focused 40-layer CPU/GPU parity                                      |
| 3.9  | distant GPU J3/J5 graph                                                                            | CPU-authority probes plus unchanged Native J4 plan                                                  |
| 3.10 | local controller/provider/cache and Flat runtime owners                                            | fused transport proof, zero packed transport, local CPU probes, and Flat32 browser gate             |
| 3.11 | `ShaderBuilder`, `ShaderAssemblyPreparer`, final transport, and color/display                      | exact Native shader/display suites, Three browser gate, and direct-40 compile/projection probes     |
| 3.12 | every inventory owner and request declaration                                                      | source audit, full typecheck/Node/browser/application gates, complete direct-40 J2-J5 CPU execution |

## Incremental Stop Rule

Every group runs formatting, `git diff --check`, Algorithm32 typecheck, its
focused suites, and the complete Node suite. A group that changes a browser or
application owner also runs that owner's existing browser gate. Any Native
identity, selected numeric value, plan/pass order, shader source, display
value, packed-transport policy, or application result change stops the sequence
unless the owning plan explicitly identified that exact change as the group's
intended behavior.

No generated output from these gates becomes an implementation input or
oracle. Exact expectations remain in their canonical source-owned tests and
fixtures rather than being copied into this document.

## Current Group Evidence

Steps 3.1 through 3.4 completed on 2026-08-08. The combined 3.5-through-3.11
implementation boundary was verified on 2026-08-09:

- point-sampled/Native basis focus: 5 specifications, zero failures;
- physical atmosphere/source/ground focus: 65 specifications, zero failures;
- complete Node boundary: 475 specifications, zero failures;
- Algorithm32 typecheck and formatting/diff checks: pass;
- Three/WebGL browser boundary: 7 checks, zero failures, including both 4,080
  output manufactured-transport cases and the sealed local N4 fused-transport
  comparison; and
- rebuilt Flat32 browser boundary: 3 checks, zero failures.

The current boundary adds positive checks for point semantics, aligned
physical inputs, complete legacy and explicit profile retention, rejection
before placement, and direct-40 distant/local packing plus resident CPU packet
shape. The obsolete mutable-basis specifications were removed with that
capability. No Native numerical expectation, cache graph, shader output, or
application check was weakened.

The current-production direct-40 builder, backend-identified hashed run
manifest, derived B3 cube contract, and B1/B2/B3 manifest adapters also pass
their focused checks. The generator now selects `cpu` binary64 reference or
`gpu` production shaders explicitly while retaining one output schema. Bounded
09:30 J1 CPU and GPU boundaries completed; all 3,240 native spectral values
agree with RMSE `6.377535195764365e-8`, maximum absolute difference
`4.506948655391696e-7`, and maximum relative difference
`3.3782811798143713e-6`. A bounded 09:30 J2 GPU boundary also completed,
proving higher-order cache construction and final-view shader execution.
Production result routing now derives a non-overlapping `cpu/` or `gpu/`
subdirectory beneath each experiment owner from that backend identity. The
focused production-run suite passes
9/9, the combined B1/B2/B3 and Figure 5 suite passes 70/70, alternate-root
smoke runs wrote all three reports, and the figure smoke run deterministically
wrote all eight expected artifacts. No canonical generation was started by
these routing checks.
Step 3.12 remains open until complete direct-40 J2-through-J5 CPU execution and
the final fallback/request audit are retained; neither backend's canonical
17-condition generation has been started.
