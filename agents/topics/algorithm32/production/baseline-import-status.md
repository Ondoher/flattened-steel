# Algorithm32 Baseline Import Status

Historical links into non-retained `scripts/algorithm32-star/...` files or
runs are archive-internal and resolve through the
[Algorithm32-Star evidence index](../archive/algorithm32-star/README.md).

Status: imported baseline present; cumulative-cache runtime and Stage 9
flat/local are complete and accepted within their stated evidence boundaries.
Stage 8 ground is implemented, but its production comparison report must be
regenerated in a new isolated evidence lane against the unchanged sealed Star
gold before renewed current Star-validation or acceptance; the archived Star
experiment is not reopened. Stage 10 has been corrected to the pinned Star captured-scene
compositor and its refreshed Node, type-check, direct-Star, and real-WebGL
acceptance checks pass. Stage 11.2's strict corrected Flat32 gate also passes.
Standalone release hardening and the remainder of the application migration
remain incomplete.

This document owns the current state of the imported production baseline. The
[implementation plan](production-implementation-plan.md) owns feature delivery;
the [testing topic](../../testing/README.md) owns runner architecture.

## Current Imported Surface

- `src/algorithm32` contains the imported production implementation and is the
  only maintained Algorithm32 source tree.
- The current tree contains 276 files, including 76 adjacent `*.spec.js` files
  and four adjacent `*.browser.js` files. The
  imported facade, atmosphere, geometry, source, transport, color,
  shader/runtime, and React/Three surface remains present alongside the new
  quantity, profile, executable-domain, and cache-contract modules.
- The former `quarantine` directory is absent.
- Ground-boundary and extraterrestrial durable type contracts are present
  under `src/algorithm32/types`.
- The stage-one cache foundation is independently loadable and declares the
  native-15 basis, native-48 position domain, Fibonacci-34 incoming domain,
  W27 outgoing domain, and order-4/15-interval production options. The
  executable domain owners expose their direct IDs, numerical tables, frames,
  and stencil behavior. Stage 3.1 adds source-owned distant-Sun binary64
  packing, private pure and cumulative field storage, distant-Sun field
  factories, and typed next-order/accumulation operations. Direct R32F
  `CacheFieldStorage` values carry GPU allocation facts. Stages 3.2
  through 3.4 add source-owned physical `J1`, direct-primary `L1`, generic
  Star-derived `L(k-1) -> Jk` scattering and `Jk -> Lk` transport, exact
  source-frame/W27 construction operations, and one nonresident CPU build for
  requested N1, N2, and default N4. The build intentionally retains sealed
  pure fields with the final cumulative field as a diagnostic and CPU/GPU
  oracle. The production default remains the native profile rather than the
  paper-comparison profile. Stage 8.1 adds the implemented explicitly profile-
  backed uniform Lambertian CPU ground path while retaining omitted ground as
  canonical black. Its scoped diagnostic-domain seam leaves production
  Native48/Fibonacci-34/W27 unchanged while enabling the sealed Star
  comparisons. Stage 3.5 adds the concrete resident CPU cache, typed resolved
  sampling, disposal, and spherical actual-node final-view stencils. Stage 4.0
  adds the common/CPU/GPU capability split, direct `DistantSunCpuCache` rename,
  structural N1/N2 build plans, owner modules, deterministic construction
  assembler, renderer-neutral executor, bounded probe seam, and opaque
  Three/WebGL2 R32F backend. Stages 4.1, 4.2, and 5 add the executable
  source-owned N1/N2/N4 programs and complete GPU recurrence through J4.
  Stages 6 and 7 add the source-created per-runtime controller, exact
  invalidation, serialized generations, atomic active publication, opaque
  backend binding, geometry-owned final-view reconstruction, and cumulative
  CPU/GPU runtime integration. The retired incident-cache strategy and CPU
  payload upload path are absent. Stage 8.2 adds reflective GPU ground
  construction with direct `J2`, pure higher-order illumination inputs,
  finite-segment transport, zero-BRDF handling, and boundary-aware controller
  invalidation.
- Stage 9 adds `FlatEarthGeometry`, the finite-distance local point Sun,
  selected scaled 19-by-15 position stencils, local CPU fields/cache, GPU plan
  and packing, source controller, opaque runtime binding, Stage 8 ground
  recurrence reuse, and bounded real-browser evidence. The 100 km/4.8 Mm v4
  case selects 285 positions under its spatial and logical-resource gates.
  Stage 10 now retains E8's native-15 spectral path projection, captures the
  Three scene in renderer-linear sRGB before the atmosphere pass, and applies
  Star's RGB-band transmittance and scene composition at the single display
  boundary. The temporary native-15 endpoint binding and adapter are removed.
- Existing production interfaces own their current contracts directly.
  Unit-bearing boundary changes retain no aliases, fallback readers,
  versioned shadows, old/new switches, or compatibility translation bridges.
- Direct-source contracts now conform to the
  [production Algorithm32 radiometric naming rule](../../standards/overlay.md#add-production-algorithm32-durable-scientific-quantities-and-provenance)
  across configuration, CPU transport, shader assembly, and production
  fixtures. The retired names have no compatibility aliases.
- The original imported snapshot is retained in
  [`algorithm32-import-baseline-2026-07-19.zip`](../../../../archives/algorithm32-import-baseline-2026-07-19.zip).

## Open Baseline Work

- Create a durable import manifest recording source revision, original paths,
  imported paths, and content hashes.
- Add the standalone public package entry point.
- Complete the broader cross-stage pinned-source conformance audit and parity
  record. Stage 8's retained offline report against the project-lifetime
  [Star parity data set](star-parity-data-set.md) is historical passing
  evidence; regenerate the production report against the unchanged sealed
  gold. Stage 9's scoped flat-geometry, local-Sun, and direct-reference
  comparisons are complete;
  ordinary Jasmine and Karma lanes remain independent of the uncommitted bulk
  artifact.
- Replace source-repository fixture/evidence locators with canonical external
  references or registered official experiments during citation hardening.
- Confirm mechanically that production modules have no runtime import from
  experimental, archived, or external-repository trees.

## Current Verification

- `npm run test:algorithm32` executes the adjacent production specs through
  the repository's Jasmine configuration. The current full result is 426
  specs with zero failures in 117.61 seconds. Obsolete assertions of internal
  type, shape, constant, and metadata structure have been removed while
  executable behavior and semantic-ingress coverage remain in place.
- `npm run test:algorithm32:three` owns the adjacent browser Jasmine specs
  through the standalone Karma/Chrome configuration. The current complete
  lane passes 5 of 5 specs on Chrome Headless 150 and ANGLE's Microsoft Basic
  Render Driver. Four specs cover scalar-array capabilities, R32F array-layer
  execution, resource cleanup, and an assembler-produced shader through the
  production backend; the fifth covers Stage 10 captured-scene composition,
  hit attenuation, and background bypass.
- A focused rerun of the manufactured cumulative-field complete-ray/public
  cutover spec passes `1/18` selected specs with 17 skipped and zero failures
  in `25.376s` on Chrome Headless 150 and ANGLE's Microsoft Basic Render
  Driver. It exercised the assembled final Algorithm32 shader with the former
  40-interval setting supplied through the runtime integer uniform. Production
  now defaults to 15, so this historical result is not current final-view
  control evidence. Because its cache is manufactured, it was final-shader/
  runtime evidence rather than native cache-construction evidence; it does
  not change the separate combined native lane's environment-unverified
  status.
- The focused
  [Stage 11.2 Flat32 browser lane](#focused-stage-112-flat32-browser-reproduction)
  passes its single strict application spec after build in Chrome Headless 150
  on D3D11. It establishes responsive full-domain temporary-N1 setup and the
  corrected captured-scene compositor, but not default-N4 application
  acceptance or supported-hardware performance qualification.
- The retained dedicated
  [Stage 8 ground browser lane](#focused-stage-8-ground-browser-reproduction)
  result passed all five specs on the same Microsoft Basic Render Driver using
  reduced diagnostic domains. Its authenticated projection unit check also
  passes. This focused result does not change the separate native combined
  lane's environment status.

- The suite covers the imported production surface and the current quantity,
  geometry, light-source, cache, runtime, shader, renderer, and application
  contracts, including the Stage 2 canonical spectral-basis and unit-bearing
  packet cutover, one typed spectral public input, unit-bearing phase,
  path, quadrature, and ray-origin values, Stage 3.1 field structure, physical
  N1 construction,
  physical later-order kernel parity, deterministic N2/N4 pass-graph
  orchestration, source-local orientation and source-axis propagation, one
  canonical boundary shape, all 1,530 preserved direct-L1 parity values,
  the full transported-J1 versus legacy-L1 material-mismatch diagnostic,
  exact W27/construction transport policies, independently mapped incoming
  and outgoing direction domains, the generic and distant-source stored-field
  transport seams, cumulative isolation, absence of N2 `L2` and N4 `L4`, all
  Native-48 exact final-view nodes, strict near-node interpolation, endpoint
  clamping, former-bin-boundary continuity, complete resolved position-by-W27
  sampling, retained cumulative-reader and physical sample-provenance identity,
  an actual source-built N1 resident read, and disposal behavior.
- Stage 8 coverage adds the distinct spectral-BRDF quantity, explicit
  profile albedo without a native default, `albedo / pi`, boundary/profile
  packet ownership, spherical typed hits, direct J2 source/return attenuation,
  occlusion and incidence cosine, higher-order construction-position lookup,
  `J3 <- L1`, `J4 <- L2`, omitted/zero numerical identity,
  cumulative exclusion, N1/N2/N4 accounting, and complete boundary-dependent
  CPU field/cache identity. The source-conformance corrections use exact unit
  transmittance at zero return distance and the retained construction-position
  lookup. The retained direct reduced-domain binary64 Star comparison and
  dedicated GPU parity result are historical passing evidence; a fresh
  production comparison report is required for renewed current acceptance. The
  [archived Star data-set contract](star-parity-data-set.md)
  and the [ground topic](../ground/README.md) own their evidence and production
  claim boundaries.
- Stage 9 coverage adds analytic flat plane/path bounds, selected scaled
  19-by-15 position nodes, explicit-node and uniform diagnostic overrides,
  source-relative frames, clamped bilinear construction/view stencils,
  finite-distance point-Sun primary and direct fields, pure-order recurrence
  with reflective ground, concrete local CPU/GPU cache ownership, complete
  plan and controller reuse identities, controller publication/lifecycle,
  W3/N4 bounded probes, and
  W27/N1 complete-ray runtime transport. The scoped flat-geometry, local-Sun,
  and direct-reference Star reports pass with zero failures, gaps, or error;
  the [archived Star data-set owner](star-parity-data-set.md)
  owns their exact hashes and claim limits. The
  [promotion register](../flat-local/unresolved-research.md) owns v1-v4
  convergence and the remaining selected-control and angular limitations.
- Stage 10 coverage preserves E8 native-15 CIE/bin-width/683/XYZ path
  projection and adds the pinned Star captured-scene compositor,
  renderer-linear scene input, RGB-band transmittance, endpoint/background
  branch behavior, per-frame read-buffer binding, observable WebGL output,
  diagnostics, and cleanup. The removed endpoint texture and adapter are not
  production contracts.
- Stage 4.0 coverage adds owner-contract polymorphism, exact structural N1/N2
  graphs, trusted typed owner/binding composition, executable
  `CacheFieldStorage` allocation facts, deterministic dependency-aware
  assembly, pass/layer execution, cancellation, failure cleanup,
  last-consumer release, bounded probes, opaque runtime binding creation,
  external Three capability rejection, R32F layer submission and readback,
  renderer-state restoration, and idempotent resource disposal. Allocation
  consumes direct field IDs and `CacheFieldStorage` facts.
- Stages 4.1, 4.2, and 5 coverage executes every produced N1/N2/N4 field and
  makes 1,200 selected produced-field comparisons against 825 unique checked
  binary64 oracle scalars under the unchanged predeclared bounds. The worst
  observed allowed-error ratio is `0.150138`. Exact N1 copying, bit-identical shared
  N2/N4 fields, cumulative isolation, selected-only readback, temporary
  release, result retention, and cleanup pass. N4 reports `37,791,360` bytes
  peak field storage, `19,270,656` bytes peak packed data, `44,562,816` bytes
  peak tracked storage, and `12,597,120` bytes resident result storage.
- The selected Fibonacci-34 executable vectors, golden ratio, and quadrature
  weight are pinned as exact Node/Algorithm32-Star-compatible literals.
  Browser assertions confirm that the Fibonacci domain, numerical profile,
  and complete production profile retain the same content identities as Node
  and the checked oracle.
- Stage 6/7 controller and runtime coverage establishes complete
  N1/N2/default-N4 publication, deterministic plan/backend-capability
  reuse keys, exact active reuse, changed-owner rebuilds, independent
  per-runtime controllers,
  serialized supersession, active A-to-staging B-to-requested A behavior,
  failure and caller-cancellation preservation, and exactly-once owned-result
  disposal without backend disposal. It also covers one cumulative query per
  path point, absence of a separate direct term, opaque runtime-binding
  installation, transactional shader replacement, controller reuse by live
  source/backend/scheduler ownership, cache selection by direct plan reuse
  identity, and live camera bindings.
- The Stage 7 browser surface executes the predeclared Native-48 node, clamp,
  former-boundary, W27 exact/interior/seam/corner, complete-ray, no-direct-term,
  and N1/N2/N4 public-cutover seams. The focused complete-ray oracle deliberately
  uses the same R32F field on CPU and GLSL to isolate traversal and addressing;
  a sparse binary64 resident-cache complete-ray fixture remains release-level
  hardening.
- `npm run typecheck:algorithm32` passes with zero diagnostics. Boundary
  narrowing, literal and tuple preservation, declaration visibility, and
  physical/runtime assignability now satisfy the JavaScript/JSDoc static lane.
  Shared Algorithm32 contracts are top-level aliases and interfaces in included
  ambient `types.d.ts` files and consumers name them directly; the production
  tree contains no TypeScript `declare`, `declare global`, `type X =
import(...).X`, `import type`, or relative `import(...).X` reference to an
  ambient contract.
- `npm run build` passes in `7.0s`. Its only reported note is Babel's existing
  large-file deoptimization notice for `react-dom`; it is not an Algorithm32
  build failure.
- The current live Stage 3.5 production-versus-Star diagnostic passes all six
  resolved-stencil cases and all 90 N4 resident spectral comparisons. The
  [spatial-reconstruction authority](../cache/spatial-reconstruction.md)
  owns the numerical bounds and claim boundary.
- The existing source-organization audit covers 111 non-spec production
  JS/JSX modules and reports no inline `@typedef`/`@callback` declarations or
  file-local or class method calls to later declarations. It is not the
  broader full-source conformance audit, which remains follow-up work.
- Stage 8's green local and dedicated browser suites are paired with direct
  pinned-Star output evidence. They do not complete the broader cross-stage
  source-conformance audit, import manifest, citations, release suite, or
  supported-hardware qualification.

### Focused Stage 7 Browser Reproduction

The Karma configuration accepts `ALGORITHM32_THREE_GREP` through
karma-jasmine's permanent grep seam, so the focused evidence does not require
committed `fit`/`fdescribe` markers. From PowerShell, run:

```powershell
$env:ALGORITHM32_THREE_GREP = '/(matches the full checked Native48\/W27 lookup surface in real WebGL|matches complete-ray transport and installs public N1, N2, and N4 cutovers over a manufactured field)/'
npm run test:algorithm32:three
Remove-Item Env:ALGORITHM32_THREE_GREP
```

The selected specs are:

- `matches the full checked Native48/W27 lookup surface in real WebGL`; and
- `matches complete-ray transport and installs public N1, N2, and N4 cutovers
over a manufactured field`.

### Focused Stage 8 Ground Browser Reproduction

`npm run test:algorithm32:ground:three` passes `5/5` specs in
`4m32.783s` browser time and `16.845s` spec time on Chrome Headless 150
with Three r180, WebGL2, and ANGLE's
Microsoft Basic Render Driver. The four GPU N4 cases are:

- Native16/W9 with omitted ground;
- Native16/W9 with reflective ground;
- Native4/W3 with an explicit-zero boundary; and
- Native4/W3 with matching omitted ground.

The run executes 40 fields and checks 3,600 selected field scalars across
12,960 comparisons, 360 resident scalars, 1,890 exact zero/omitted checks,
540 Star reflective differentials, 540 GPU reflective differentials, and 540
overlapping reflective differentials. Each of `J2`, `J3`, `J4`, `Jthrough2`,
`Jthrough3`, and `Jthrough4` contributes 90 Star, 90 GPU, and 90 overlapping
differentials. The run reports zero failures, coverage gaps, coordinate
mismatches, WebGL errors, or resource leaks. Existing compiler unroll and
uninitialized-value warnings remain diagnostic noise rather than assertion or
WebGL failures.

The authenticated bounded-projection unit lane passes `2/2` specs.
Node authenticates and projects only the declared sections and probes; the
browser never receives the archive. `Jthrough1` coverage is labeled according
to the executable graph: N4 has no copy pass, so that lane checks the logical
`Jthrough1` value while the ordinary N1 lane owns copy-pass evidence.

### Focused Stage 9 Flat/Local Browser Reproduction

`npm run test:algorithm32:local-sun:three` passes `5/5` specs with no skips or
failures on Chrome Headless 150, WebGL2, and ANGLE's Microsoft Basic Render
Driver. The current rerun takes `29.386s` browser total and `27.004s` test
time.

The lane supplies compositional evidence:

- an explicit two-by-two/W3 construction domain executes N1, N2, and N4 pass
  probes, cumulative lookup, omitted/zero/nonzero ground behavior, runtime
  publication, cleanup, and lifecycle seams;
- production W27 executes N1 through public ShaderBuilder setup for three
  complete rays and all 90 radiance/transmittance scalars; and
- the promoted scaled 19-by-15 production domain, logical resource ceilings,
  and unchanged numerical tolerances are pinned by the canonical GPU policy.

It does not contain W3/N4 numerical complete-ray parity or a production-domain
W27/N4 browser build. A bounded W27/N4 attempt exceeded `904.064s` against the
120-second bounded-build criterion and was reverted. No frozen gate requires
that domain-by-order-by-ray matrix cell, so it remains optional hardening.

The canonical policy is:

| File                                                              | Bytes | SHA-256                                                            |
| ----------------------------------------------------------------- | ----: | ------------------------------------------------------------------ |
| `src/algorithm32/fixtures/local-sun-gpu-cache-parity-policy.json` | 7,309 | `6277936ecfd510ccde250fc779d6b41a44d9fd14c9935a6488629075c7cd9968` |

The pre-fix
`archives/algorithm32-flat-local-gpu-policy/selected-domain-policy-v2-pre-static-language-fix.json`
is 6,647 bytes with SHA-256
`9a3593f0ffa149ca049083471c234b139ab27ed81b25e6f713c4f8dfd83e3bb6`
and is preserved because it embedded a source-specific filename in otherwise
generic fixture metadata. The amendment changed metadata, not the selected
domain, tolerances, cases, resource ceilings, or numerical browser result.
Focused scaffold and policy checks pass `14/14`.

Post-promotion report
`archives/algorithm32-flat-local-cache-domain-convergence/report-post-promotion.json`
is 37,114 bytes with SHA-256
`4164791f97a67e9d8516c383ced28971f9fb1d9d064a6ab9611cd57097296e19`.
It retains the selected domain, reproduces the v4 spatial maxima, passes
default realization and logical-resource gates, and records 285 positions,
9,690 transport queries, 236 taps per query, `164,707,792` packed-data bytes,
`74,795,400` resident bytes, and `389,675,392` peak tracked logical bytes.

The [flat/local promotion register](../flat-local/unresolved-research.md) owns
the v1-v4 convergence reports, selected-domain metrics, and the explicit
15-versus-60, W9, scaled-configuration, and hardware claim boundaries.
The current convergence-policy test passes `1/1` in `28.988ms`.

### Focused Stage 10 Composition Browser Reproduction

With `ALGORITHM32_THREE_GREP` selecting
`Stage 10 Star scene-composition browser gate`,
`npm run test:algorithm32:three` passes `1/1` focused real-WebGL spec with zero
failures on Chrome Headless 150.

The gate captures a known renderer-linear scene pixel through the actual
composer read buffer, exercises Star's attenuated-endpoint and unattenuated-
background branches, compares GPU output with the CPU color model, observes
dynamic read-buffer binding, and covers diagnostics, WebGL errors, and
cleanup. Focused Node results pass `8/8` for
`BrunetonColorDisplayModel`, `7/7` for `ShaderRuntimePass`, and `19/19` for
`ShaderBuilder`. Both `npm run typecheck:algorithm32` and
`npm run typecheck:flat32` pass.

A direct offline diagnostic against the two pinned Star authorities compares
all nine selected E8 scalars and 54 compositor scalars with maximum absolute
error `8.881784197001252e-16`. The production compositor GLSL helper block is
byte-for-byte identical to the pinned Star helper. The authorities are:

- `scripts/algorithm32-star/src/output/spectral-to-rgb.js`, SHA-256
  `e55fa94464c506e6bdb3a664196bf9763759d5f22709577f4b0918deeed629fc`;
  and
- `scripts/algorithm32-star/src/production-reference/color/BrunetonColorDisplayModel.js`,
  SHA-256
  `35595582e4e08c38776f056f4244c6ef76006ece60716cabd982df81ba341626`,
  preserved from `C:\dev\poly-gc-react` commit
  `514d5f6080d2dd485efdb07b5da9a203357a40c0`.

The earlier `4/4` endpoint-texture/adapter result targeted the removed
implementation and is superseded. It is not part of the corrected Stage 10
acceptance record.

### Focused Stage 11.2 Flat32 Browser Reproduction

`npm run test:ui:flat32` builds the local application and passes `1/1` focused
spec in Chrome Headless 150 on D3D11. Browser execution is `15.070s`, spec
execution is `15.052s`, and the command takes `42.4s` including builds. The
Karma launcher retains GPU execution; the application fills its host viewport
at the browser device-pixel ratio, and its camera, drawing buffer, and composer
targets resize when that host changes size.

The spec observes:

- one ambient and six flat/local directional Three lights, six targets, six
  4096-by-4096 static PCF-soft shadow maps, and their caster/receiver facts;
- a direct Three frame during setup and another direct frame after a cache
  wavelength-layer scheduler yield;
- a spherical/distant temporary-N1 attachment over the complete
  Native-48/Fibonacci-34/W27/native-15 production domains with canonical black
  ground;
- production 15-interval cache construction and final-view transport;
- a nonzero composer center scene-input pixel and a nonzero, different final
  output pixel through the corrected Star display-boundary compositor;
- at least one preflighted and one subsequent Algorithm32 runtime frame,
  zero runtime render errors, and zero WebGL errors; and
- stopped direct and atmosphere frame counters after idempotent cleanup.

The runtime publishes only after its final program reaches asynchronous Three
compilation readiness and an actual composed frame passes runnable-program,
runtime, linker, WebGL, and nonzero-pixel checks. Cache programs use the same
asynchronous readiness boundary, and the executor yields between wavelength
layers through the application scheduler. The composer captures the Three
scene before the atmosphere pass for Star's display-boundary composition.
Stage 11.2 is complete. Temporary N1 remains an explicit integration
checkpoint; default N4 remains the Stage 11.8 application gate.

## Claim Boundary

Presence of the copied files alone does not establish standalone parity,
physical correctness, or release readiness. The selected-scalar N1/N2/N4 GPU
construction gate, cumulative runtime path, and focused Stage 8 reduced-domain
Star/CPU/GPU ground parity are established. Stage 9's selected flat/local
domain and bounded compositional GPU/runtime evidence and Stage 10's corrected
Star-output, CPU, shader, and focused real-WebGL composition evidence are also
established within the limits above. The Stage 11.2 result establishes
the corrected captured-scene compositor, responsive full-domain N1 setup, and
lifecycle. It does not establish default-N4 application acceptance or the
broader full native N1/N2/N4 browser lane. These results do not complete the
broader cross-stage pinned-source audit, arbitrary scaled
flat/local convergence, beyond-W27 evidence, selected-domain
supported-hardware resource/performance qualification, citations, or release
hardening.

## Archive Source

Durable extraction rules and compliance-gap leads were recovered from the
archived initialization audit and overview in the
[topic-documentation archive](../../../../archives/topic-documentation-archive-2026-07-19.zip).
Historical source-worktree state and pass counts were not promoted.
