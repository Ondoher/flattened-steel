# Stage 9.6 Containment Inventory

Historical links into non-retained `scripts/algorithm32-star/...` files or
runs are archive-internal and resolve through the
[Algorithm32-Star evidence index](../archive/algorithm32-star/README.md).

Status: current semantic inventory for Stages 9.6.0 through 9.6.6. Stages
9.6.0 through 9.6.2 contain the interrupted overlay and implement the selected
fixed facts/domain behavior and continuous direct-primary `L1` recurrence.
Stage 9.6.2a completes the post-implementation production-conformance and
direct-order evidence remediation. Its v3 gold executes Star N1, N2, and N4
independently, and the refreshed production comparison authenticates both
implementations' complete relevant inputs and passes every field, exact, edge,
shared-prefix, cumulative, resident-sampling, and zero-query-time-scaling
check.

Stage 9.6.3 replaces the local GPU construction graph and passes its
omitted-ground numerical, graph, upload, readback, and bounded resource gates.
Explicit-zero and nonzero reflective CPU/GPU behavior is implemented and
checked, but those outputs remain validation-pending and unaccepted because
their independent physical Star evidence boundary is unresolved. Stage 9.6.4
enables and verifies the supported local-Sun controller, lifecycle,
invalidation, publication, and complete resource accounting. Stage 9.6.5
cuts ordinary Flat32 over to the selected N4 strategy and accepted
observer-centered final-view dome. Stage 9.6.6 passes the final source,
built-output, regression, type, evidence, build, syntax, and diff gates. This
document records that state; the
[production implementation plan](production-implementation-plan.md#96-integrate-the-accepted-n2048-flatlocal-shell-cache)
continues to own sequence and gates.

## Authority And Evidence Boundary

The numerical migration authority was the accepted Star implementation
manifest at the retired path
`scripts/algorithm32-star/cases/local-sun-shell-cache-accepted-implementation-v1.json`,
whose retirement is recorded by the
[Algorithm32-Star evidence index](../archive/algorithm32-star/README.md),
SHA-256
`6a27106bce134174309a59908c6bcbb278a22989f74c64274347840ccc8abeb6`,
under identity
`local-sun-shell-cache-accepted-implementation-v1-sha256:457bc753c9c3814560a8af0aaeeabaf3ea6efe64718e75e36b09a8bc863ee00e`.
It selects:

- source-subpoint z19/rho15 positions, paired-Fibonacci-34 incoming
  radiance, W27 outgoing scattering density, native-15 spectra, and requested
  N1, N2, and N4 recurrence;
- 2,048 equal-inverse-square shells with 2,049 boundaries, higher-index
  ownership at an exact internal boundary, and arithmetic-mean held incident
  amplitude only while constructing `J1`;
- continuous finite-source direction, source path, transmittance,
  inverse-square amplitude, and direct-primary `L1`;
- generic stored-field transport only for `J2 -> L2` and `J3 -> L3`, with
  pure fields feeding recurrence and separate cumulative addition;
- no query-time shell multiplier and no CPU scattering/radiance field upload
  to the GPU; and
- independent physical source and camera state.

The manifest explicitly records `productionMutationAuthorized: false`.
Production must therefore implement the selected behavior through the
[production architecture boundaries](architecture-boundaries.md#algorithm-source-promotion-and-conformance);
the Star module structure and the interrupted production overlay are not
implementation architecture.

### Run `000325` Is Invalid

The retained `result.json` for
`000325-local-sun-shell-cache-phase2-gpu-conformance` historically says
`"status": "accepted"`. That field is not current evidence authority. The
later accepted manifest explicitly supersedes `000325` because its launcher
delegated implementation to production packages. The run is circular
production-backed evidence, not an independent Star producer, and cannot
validate CPU output, GPU output, the pass graph, or a production claim.

The run's archive-internal
`scripts/algorithm32-star/runs/000325-local-sun-shell-cache-phase2-gpu-conformance/provenance.json`
remains useful only as a containment ledger. Its historical hashes identify
an affected set; they do not define the current source, an authorized commit
range, or code to restore. Production work was intermixed with legitimate
changes and stopped partway through, so containment is semantic rather than
Git-range based.

## Current Execution Boundary

The current source-owned CPU path has these mechanics:

```text
N1: J1(shell-held), Jthrough1 = J1

N2: J1(shell-held), L1(continuous), J2 = scatter(L1),
    Jthrough2 = J1 + J2

N4: N2, L2 = transport(J2), J3 = scatter(L2),
    Jthrough3 = Jthrough2 + J3,
    L3 = transport(J3), J4 = scatter(L3),
    Jthrough4 = Jthrough3 + J4
```

`LocalSunLightSource` derives mandatory source-paired shell facts internally.
Its caller configuration no longer selects a shell count, identity, or
continuous-versus-shell strategy. The source retains its shell-fact owner in
a private instance property outside the public normalized configuration
snapshot. The public CPU request also has no construction-domain injection;
`LocalSunLightSource.buildCpuScatteringCache()` always derives the selected
paired-Fibonacci-34 production domain. Bounded domain injection remains only
on the internal comparison/build seam.

`local-sun-primary-scattering-density.js` receives the construction-only
shell-held light adapter for `J1`.
`local-sun-primary-radiance.js` constructs `L1` from the continuous source
calculator and does not read shell facts or stored `J1`.
`local-sun-scattering-density-transport.js` rejects every input except pure
`J2` or pure `J3`. Generic scatter and cumulative addition retain their
existing production owners.

The independent Star-only gold fixture at the retired path
`src/algorithm32/light-sources/fixtures/algorithm32-star-local-sun-shell-cpu-gold.json`
has identity
`algorithm32-star-local-sun-shell-cpu-gold-v3-sha256:bb3a1f871a375e53d9c180899003041afc4dda93cbe3fe69e62080481bd8d0c9`
and file SHA-256
`61532368d7efa2d4a60fc932a901097a8e583ccb0eb3593eb9b26d29c2674985`.
It was generated without importing or executing a production module,
authenticates its 24-file capture closure, and executes the bounded z2/rho2,
paired-Fibonacci-34, W3, native-15, omitted-ground N1, N2, and N4 requests
independently.

The authenticated production comparison report at the retired path
`src/algorithm32/light-sources/fixtures/algorithm32-star-local-sun-shell-cpu-comparison-report.json`
has identity
`algorithm32-star-local-sun-shell-cpu-comparison-report-v3-sha256:358f1abbbc910774be040baae85d240c2d2d0ca14c9eb4f51bb96af5ceaddd5a`,
file SHA-256
`d5fa37c70729eec944f59a7802f51b3a66dfb875969f0f1d076ab9ab0ea2c399`,
and state `passed`. It authenticates the frozen sources and complete
production inputs and covers the three matching requests with 40,560 field
scalar comparisons, 26,900 core exact leaves, 224 exact input-authentication
leaves, 29 behavioral edge records, 648 resident exact-node/direction
samples, and 9,720 resident sampled scalars, all with zero mismatches. The
compared facts, fields, shared prefixes, cumulative identities, public CPU
entrypoint, zero query-time shell scaling, and predeclared tolerances all
pass. This closes Stage 9.6.2a only for the declared omitted-ground CPU
boundary.

No independent physical reflective local-ground output has been established
for this changed flat/local recurrence. Omitted ground does not validate
explicit-zero or nonzero reflective ground. CPU/GPU agreement and the
spherical Stage 8 report cannot close that evidence gap. The user has deferred
only this independent Star evidence work. Reflective local-ground behavior
remains required in production CPU/GPU implementation and tests; its claim
remains validation-pending until the evidence work is resumed.

The GPU construction boundary now has these mechanics and evidence:

- `LocalSunCacheSource` binds the deterministically converted 2,049-scalar
  R32 shell-boundary payload only in `primary-j1`; continuous `direct-l1`,
  scatter, stored transport, accumulation, ground work, and query-time code
  contain no shell binding;
- `local-sun-cache-plan.js` emits exact N1/N2/N4 direct-`L1` graphs and has no
  stored `J1 -> L1` pass;
- N1 and N2 create no packed transport payload, while N4 creates one logical
  `CacheTransportData` payload and reuses its source and coefficient
  `CacheData` values in both later transport passes;
- `src/algorithm32/fixtures/local-sun-gpu-cache-parity-policy.json` is the sole
  v3 policy and is pinned to the unchanged v3 CPU gold and refreshed passing
  comparison report;
- the focused Chrome 150 lane passes `3/3` with 40,560
  omitted-ground comparisons across N1/N2/N4, including 22,320 N4 scalars,
  plus 3,300 explicit-zero and 3,300 nonzero reflective CPU/GPU probes, all
  with zero mismatches;
- exact shared prefixes, the 8,196-byte boundary upload, no CPU `J`/`L`
  upload, readback requests no larger than 4,096 scalars, zero WebGL errors,
  and a 5,224.8 ms slowest bounded build pass; and
- `LocalSunLightSource.createCacheController()` publishes through the verified
  source-owned controller lifecycle.

Run `000335` supplies GPU method, tolerance, and resource authority only. Its
4/4 path controls do not supply scalar gold for production's 15/15 controls.

## Owner Classification

### Legitimate Production Owners To Preserve

| Owner group                                                                                                             | Legitimate responsibility                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FlatEarthGeometry`                                                                                                     | Physical z19/rho15 nodes, source-subpoint radial/tangent/vertical frame, construction rays and bounds, physical reconstruction, and final position/direction stencils.     |
| `LocalSunConstructionDomainSelection`, `LocalSunFieldPacking`, `LocalSunCpuFields`, `LocalSunCpuCache`, `LocalSunCache` | One coherent local source domain, executable packing and addressing, typed CPU fields, completed CPU sampling, and completed GPU runtime-cache shape.                      |
| `LocalSunLightSource`                                                                                                   | Physical finite-source state and radiometry, source-specific `J1`/`L1`, mandatory source-paired facts, construction identities, cache type, and the controller factory.    |
| `CanonicalAtmosphere` and the Stage 8 ground owner                                                                      | Medium, phase, extinction, transmittance, and the existing omitted/reflective boundary architecture. The reflective local numerical claim remains open.                    |
| Generic scattering, stored transport, and accumulation operations                                                       | Source-independent pure-field recurrence after the source-specific primary fields. These owners must not learn shell policy.                                               |
| `CacheOperations`, `CachePassAssembler`, `CacheGpuExecutor`, and `ThreeCacheBackend`                                    | Generic GPU operations, assembly, execution, allocation, submission, bounded readback, and disposal.                                                                       |
| `LocalSunCacheSource`, `local-sun-cache-plan.js`, and `local-sun-cache-fingerprint.js`                                  | Current local GPU source modules, exact graph/final result, replacement schema identity, and verified fingerprint-driven lifecycle behavior.                               |
| `LocalSunCacheController`                                                                                               | Retained scheduling/publication owner. Its typed public lifecycle, invalidation, publication, failure, cancellation, replacement, and resource behavior pass Stage 9.6.4.  |
| Flat32 `ModeController`, `Algorithm32Runtime`, and supported-mode owners                                                | Transactional candidate preparation/publication, last-valid-state preservation, runtime ownership, and the supported flat/local versus spherical/distant pairing boundary. |
| Distant-Sun and spherical owners                                                                                        | The unchanged supported spherical/distant algorithm, domains, layouts, graph, identities, and N1/N2/N4 outputs frozen below.                                               |

### Selected Behavior Recast Into Production Owners

| Production surface                                                                                                                                   | Current semantic disposition                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sampling-domains/direction/fibonacci/PairedFibonacci34DirectionDomain.js`, its constants and focused specification, and `sampling-domains/index.js` | One fixed pinned paired-Fibonacci-34 domain: 17 open-hemisphere nodes followed by exact antipodes, uniform `4*pi/34` weights, canonical zero, source-subpoint radial/tangent/vertical frame, id `algorithm32-paired-fibonacci-34-incoming-v1`, content hash `sha256:9cc84ee3f5509e8935b5ea4352e4f194ea2ecef02ade136afc47dc642ba1c0b9`.                                                                                           |
| `local-sun-consts.js`, `create-local-sun-shell-fact-cache.js`, `LocalSunShellFactCache.js`, source configuration/types, and focused fact specs       | Fixed 2,048-shell source-derived facts with schema `algorithm32-local-sun-shell-facts-v1`, id `algorithm32-local-sun-shell-facts`, 2,049 private binary64 boundaries, 2,048 private binary64 held scales, copied array access, and higher-index internal-boundary ownership.                                                                                                                                                     |
| `LocalSunLightSource.js`                                                                                                                             | Mandatory fact creation, shell-held construction-light adapter used only for `J1`, continuous ordinary direct-light sampling, selected contract description, and enabled source-owned GPU publication.                                                                                                                                                                                                                           |
| `local-sun-primary-scattering-density.js`                                                                                                            | Retained legitimate primary-`J1` operation. Its selected behavior comes from the source-provided shell-held construction sample; the operation remains the `J1` owner rather than becoming a shell-cache implementation.                                                                                                                                                                                                         |
| `local-sun-primary-radiance.js`                                                                                                                      | New source-owned continuous direct-primary `L1`; it evaluates each path sample through continuous finite-source geometry/radiometry and does not transport stored `J1`.                                                                                                                                                                                                                                                          |
| `local-sun-cpu-cache-build.js` and `local-sun-scattering-density-transport.js`                                                                       | Direct `L1` seeds `J2`; generic stored transport is restricted to `J2 -> L2` and `J3 -> L3`; only pure fields feed recurrence.                                                                                                                                                                                                                                                                                                   |
| `LocalSunConstructionDomainSelection.js`, local field owners, local CPU specs, and source specs                                                      | Paired-Fibonacci-34 is the ordinary flat/local incoming domain. The public CPU request cannot inject a construction domain; bounded injection remains an internal diagnostic seam. Current selected identities include `algorithm32-local-sun-z19-rho15-paired-fibonacci34-w27-v2`, `algorithm32-local-sun-z19-rho15-paired-fibonacci34-radiance-packing-v2`, and `algorithm32-local-sun-paired-fibonacci34-shell-cpu-field-v3`. |
| Star-only CPU gold, comparison policy, and passing production report                                                                                 | Independent omitted-ground N1/N2/N4 authority. The pinned gold and authenticated passing report establish the production binary64 CPU recast as the scoped omitted-ground Star-validated result and GPU oracle. The completed Stage 9.6.3 browser lane compares the matching GPU fields with that authority; none of these artifacts establishes reflective-ground Star authority.                                               |
| `src/algorithm32/fixtures/local-sun-gpu-cache-parity-policy.json`                                                                                    | Sole canonical `algorithm32-flat-local-gpu-cache-parity-policy-v3` policy for paired-Fibonacci-34, shell-held `J1`, continuous direct `L1`, and every affected Stage 9.6 field. It pins the accepted v3 CPU gold/report and records the passing construction, lifecycle, Flat32, and containment gates. It does not claim independent reflective-ground validation or supported-hardware qualification.                          |
| `FlatLocalMode`, `ModeController`, and Flat32 browser coverage                                                                                       | Ordinary N4 uses source-derived shell facts and the fixed paired-Fibonacci-34 domain. Transactional failure preserves and republishes the active runtime and cleans unowned resources. The accepted observer-centered 100 km/1,926,774 m final-view dome removes the sharp horizon discontinuity.                                                                                                                                |

### Rejected Or Removed Production Surface

| Surface                                                                         | Containment result                                                                                                                                                                                    |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Variable paired-Fibonacci count ladder                                          | Removed from production. `PairedFibonacciDirectionDomain.js` is absent; production exposes only the selected fixed paired-Fibonacci-34 descriptor. Counts 38/42/46/50 remain experiment history only. |
| Lebedev candidates                                                              | Removed from production. `Lebedev38DirectionDomain.js` and its candidate exports/tests are absent.                                                                                                    |
| Fibonacci diagnostic rotation                                                   | Removed from the spherical/distant Fibonacci-34 factory and its tests. Its pinned original vectors and identity are retained unchanged.                                                               |
| Invariant phase-table optimization                                              | Removed from transport/local source contracts, implementations, and tests. No phase-table member remains in the CPU recurrence surface.                                                               |
| Caller-selected shell policy                                                    | Removed. Public local-Sun configuration has no shell count, shell identity, shell cache, or strategy option. The source always derives its fixed facts.                                               |
| Public CPU construction-domain selection                                        | Removed. The public source CPU build always derives the selected production domain; bounded domain injection is internal comparison machinery only.                                                   |
| Flat32 `fibx`, `leb38`, `pairfib`, and `shell2048` selectors                    | Removed from application configuration, URL handling, and runtime selection. The ordinary flat/local candidate uses the one fixed selected domain/source contract.                                    |
| Old/new strategy compatibility                                                  | Absent. There is no supported continuous-versus-shell switch, fallback reader, alias, or query-time cumulative shell scaling path.                                                                    |
| `src/algorithm32/light-sources/fixtures/local-sun-shell-gpu-parity-policy.json` | Removed as a shadow authority. Its historical path, schema, hash, and supersession reason are retained only in the canonical v3 policy.                                                               |

The focused Chrome 150 browser lane now supplies the Stage 9.6 construction
and public-lifecycle evidence. It passes `3/3` and compares independent N1,
N2, and N4 omitted-ground builds with the Star-only v3 gold, plus bounded
explicit-zero and nonzero reflective production CPU/GPU builds. It also
publishes, reuses, replaces, and disposes through the public controller.

### Stage 9.6.3 Replacement Disposition

| Surface                                                                               | Current disposition                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LocalSunCacheSource.js`                                                              | Current local GPU source-module owner. Shell facts bind only to `primary-j1`; the separate source-owned `direct-l1` module constructs continuous `L1` without an input field or shell data.                                                                                         |
| `local-sun-cache-plan.js`                                                             | Current exact graph owner. The stored `J1 -> L1` pass is deleted; N1/N2/N4 emit the accepted direct-`L1` graphs. N1/N2 allocate no packed transport data, and N4 reuses one logical transport payload.                                                                              |
| `LocalSunCacheController.js`                                                          | Retained typed scheduling/publication owner. It serializes generations and owns cancellation, supersession, failure preservation, atomic complete-result publication, exact reuse, replacement, and idempotent disposal.                                                            |
| `local-sun-cache-plan.spec.js` and `local-sun-cache-controller.spec.js`               | Cover observable graph, truncation, ground ordering, logical data reuse, every declared rebuild/non-rebuild input, supersession, cancellation, failure preservation, replacement, and cleanup.                                                                                      |
| `src/algorithm32/fixtures/local-sun-gpu-cache-parity-policy.json` and its policy spec | Sole v3 policy, refreshed to the accepted CPU authority and completed Stage 9.6.3-9.6.6 construction, lifecycle, Flat32, and containment gates. It makes no independent reflective-ground or supported-hardware claim.                                                              |
| `src/algorithm32/three/_tests/local-sun-gpu-parity.browser.js`                        | Current three-spec bounded GPU conformance lane. It verifies omitted-ground Star/CPU/GPU fields, reflective CPU/GPU behavior, exact graphs and prefixes, upload/readback bounds, resource cleanup, zero WebGL errors, and public controller publication/reuse/replacement/disposal. |
| Local GPU plan/field/fingerprint schema constants                                     | Directly identify the published replacement graph and fields without compatibility aliases.                                                                                                                                                                                         |

### GPU Architecture-Debt Disposition

Stage 9.6.3 closes every local-only conformance item ledgered by the Stage
9.6.2a audit:

- `FlatEarthGeometry` retains executable rho, interval, and transport spectral
  extent facts independently of descriptor metadata or fixed native-basis
  constants;
- `LocalSunCacheSource.js` follows the required helper ordering and owns the
  continuous direct-`L1` contribution;
- the plan and controller consume typed internal owners, the stored
  `J1 -> L1` route is absent, and N2 allocates no packed transport data;
- local source, module, plan, field, descriptor, and fingerprint identities
  describe the replacement graph;
- all six `LocalSunCacheBuildPlanRequest` properties are documented; and
- the affected GPU constants owner no longer uses runtime freezing.

Separately,
`distant-sun-cache-plan.js` reconstructs typed domain/control shapes and drives
transport from controls-descriptor metadata, while
`CacheConstructionControlsDescriptor.js` is a Pascal-named non-class utility
that also owns module constants. Those latter findings are active
spherical/distant/shared legacy debt, not evidence that its numerical output
changed and not an automatic part of the local Stage 9.6.3 authorization.
They require separately scoped, regression-covered hardening and are not
silently folded into the completed local GPU recast.

## Exact `000325` Production Provenance

The hashes below are the historical values recorded by `000325`. The
disposition is based on the current semantic owner map, not hash equality
with today's intermixed working tree.

| Historical production path                                                      | `000325` SHA-256                                                   | Semantic disposition                                                                                                                                                 |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/algorithm32/caches/gpu/CacheGpuExecutor.js`                                | `8c611f952d9d3909b4a781ca9ce12f235551412a5f2af18f81d35b72090d16fc` | Legitimate generic executor owner; preserve.                                                                                                                         |
| `src/algorithm32/caches/gpu/CachePassAssembler.js`                              | `37ac2726944263bbb8fc7abb4ea45844f90709397ee56068f38367af08720290` | Legitimate generic assembler owner; preserve.                                                                                                                        |
| `src/algorithm32/fixtures/local-sun-gpu-cache-parity-policy.json`               | `6277936ecfd510ccde250fc779d6b41a44d9fd14c9935a6488629075c7cd9968` | The recorded v2 content is superseded; the same canonical path now owns the sole v3 policy used by the passing 9.6.3 construction gate.                              |
| `src/algorithm32/light-sources/LocalSunCacheController.js`                      | `cb7513e3e98fa3d71da2134a6b4cec238569e7eaaed6aa415bb4425ec4567b4f` | Retained typed scheduling/publication owner; its public lifecycle and publication contract pass Stage 9.6.4.                                                         |
| `src/algorithm32/light-sources/LocalSunCacheSource.js`                          | `d33f33c19d7af2ce7251c81aa7f81cbbc5d84079016c11998d07594cbab87ed1` | Retained GPU source-module owner, now replaced with shell-isolated `primary-j1` and continuous `direct-l1` contributions.                                            |
| `src/algorithm32/light-sources/LocalSunLightSource.js`                          | `3e267c28306f1737d8c89ab30ff221e946bbd3b6feda7424e42e0db2188e2a6d` | Selected source behavior recast: mandatory facts, shell-held `J1`, continuous ordinary light, and enabled source-owned GPU factory.                                  |
| `src/algorithm32/light-sources/LocalSunShellFactCache.js`                       | `2d4b4fab3f2cabe3f34f4a53c5dca89518e5532c7c642b1f4e67c7301f47ab99` | Experimental path replaced by the fixed focused fact class; selected behavior recast.                                                                                |
| `src/algorithm32/light-sources/_tests/local-sun-cache-controller.spec.js`       | `dd7da28135e2be6696ab5054f5672128e37b40ad16cb3dbe82acd5d25e879fe9` | Current typed construction and public lifecycle/publication coverage, including reuse, replacement, invalidation, failure, cancellation, supersession, and disposal. |
| `src/algorithm32/light-sources/_tests/local-sun-cache-plan.spec.js`             | `82dc3e91ab31f022ee2901e99b95d7cf9a88657b8ea7634bee5f3e9ecdcf1ff5` | Rewritten current coverage for exact direct-`L1` N1/N2/N4 graphs, ground ordering, and logical transport-data reuse.                                                 |
| `src/algorithm32/light-sources/_tests/local-sun-cpu-cache.spec.js`              | `ccbf0b70d39514e843cefa13edf0ef3306553786753b9f545f205e078186292b` | CPU mechanics recast for fixed facts/domain, continuous `L1`, later-only stored transport, and J1 isolation; independent omitted-ground comparison passes.           |
| `src/algorithm32/light-sources/fixtures/local-sun-shell-gpu-parity-policy.json` | `4bcf68c299e2d4b5f9fa6dff294e5737dab4eb5d05dd3af443182a3e4dcc4ac8` | Invalid shadow policy authority removed; its historical identity and supersession reason remain in the canonical v3 policy.                                          |
| `src/algorithm32/light-sources/local-sun-cache-plan.js`                         | `8ab602c9a7d2c6f4067204ce3d52ee4e0882d3c7624b9a9aecd8bc4cc9408363` | Retained graph owner, now replaced with exact N1/N2/N4 direct-`L1` graphs and no N1/N2 packed transport allocation.                                                  |
| `src/algorithm32/light-sources/local-sun-cpu-cache-build.js`                    | `e61e17bde1431de5c9d6d999a80cbdb3142133525f8114a678f2602280489e87` | Selected CPU recurrence recast to continuous direct `L1` and later-only stored transport.                                                                            |
| `src/algorithm32/light-sources/local-sun-primary-scattering-density.js`         | `07e13a1b7c941b1fb59caeddaed080be9731afcd059d4908ff46f695a679524d` | Legitimate primary-`J1` owner retained; selected shell-held amplitude enters through its light-source collaborator.                                                  |
| `src/algorithm32/three/ThreeCacheBackend.js`                                    | `81198f97f719b6f1c8c329fd14ef0ce5a7adf35a4be3a515b907df01123b609d` | Legitimate generic renderer backend; preserve.                                                                                                                       |
| `src/algorithm32/three/_tests/local-sun-gpu-parity.browser.js`                  | `455c523ef1f3c846b99eb50859fd84ab091f78d4820f9949ec9c4f3cebb133b1` | Historical implementation superseded; the current three-spec lane supplies bounded GPU construction and public-controller evidence.                                  |

The provenance also lists package/runner infrastructure. Those files explain
how the run crossed the evidence boundary; they are not additional
Algorithm32 numerical owners.

## Pre-Cutover Spherical/Distant Freeze

The following current identities are the local-only cutover regression
boundary. They must remain byte-for-byte identical through Stage 9.6.

| Spherical/distant fact              | Exact identity                                                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Default construction selection      | `algorithm32-distant-sun-cpu-native48-w27-v1`                                                                                                                            |
| Native-48 position domain           | id `algorithm32-native-48-position-v1`; hash `sha256:4607a46195252a09df23c6b1684921146fcd3a0beaf68ac40da5ce228ae8428e`; 48 positions                                     |
| Fibonacci-34 incoming domain        | id `algorithm32-fibonacci-34-incoming-v1`; hash `sha256:1e9784b6b940f154cbd3d69988e23c993c24f9cc12853aac993aa4d14c12141c`; 34 directions                                 |
| W27 outgoing domain                 | id `algorithm32-cubed-sphere-w27-outgoing-v1`; hash `sha256:b27c677bb8527d77fe7a50a2caa7f7a2af16c99ccf37138e1f75e9e4085047a0`; 4,374 directions                          |
| Native-15 spectral basis            | id `algorithm32-native-15-spectral-basis-v1`; hash `sha256:a03a3c7f45d9bd4ff8adf6482e9d1aac1acd72423758ecf797ac24f6dffba891`; 15 channels                                |
| Default native production profile   | id `algorithm32-native-production-default-v1`; hash `sha256:aceb50e3578f622658a6f1bcadcd13ecff90f36a177022af64f69209981faea9`                                            |
| Incoming radiance packing           | id `algorithm32-distant-sun-fibonacci-34-radiance-packing-v1`; layout hash `sha256:89f249272521c3316b3c353a0bfc160c538186bd8aa314b2690662391aeded0c`; 24,480 scalars     |
| Outgoing scattering-density packing | id `algorithm32-distant-sun-w27-scattering-density-packing-v1`; layout hash `sha256:5f005db14a7785281d612dbcba5aac8f68f26643e08272f51974284bb4e4fa1c`; 3,149,280 scalars |
| GPU field provenance                | `algorithm32-distant-sun-gpu-cache-plan-v1`                                                                                                                              |
| CPU field provenance                | `algorithm32-distant-sun-cpu-field-v1`                                                                                                                                   |
| GPU plan base identity              | `algorithm32-distant-sun-cache-construction-v1`                                                                                                                          |
| GPU fingerprint schema              | `algorithm32-distant-sun-gpu-cache-fingerprint-v1`                                                                                                                       |

The selected distant-Sun logical fields and published outputs are:

| Request | Exact produced fields in order                                                                                                                                                                                | Published logical result  | Result field descriptor                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------- |
| N1      | `distant-sun-j1`, `distant-sun-j-through-1`                                                                                                                                                                   | `distant-sun-j-through-1` | `algorithm32-distant-sun-j-through-1-field-v1` |
| N2      | `distant-sun-j1`, `distant-sun-l1`, `distant-sun-j2`, `distant-sun-j-through-2`                                                                                                                               | `distant-sun-j-through-2` | `algorithm32-distant-sun-j-through-2-field-v1` |
| N4      | `distant-sun-j1`, `distant-sun-l1`, `distant-sun-j2`, `distant-sun-j-through-2`, `distant-sun-l2`, `distant-sun-j3`, `distant-sun-j-through-3`, `distant-sun-l3`, `distant-sun-j4`, `distant-sun-j-through-4` | `distant-sun-j-through-4` | `algorithm32-distant-sun-j-through-4-field-v1` |

The corresponding default GPU cache descriptor ids are
`algorithm32-distant-sun-gpu-cache-n1-v1`,
`algorithm32-distant-sun-gpu-cache-n2-v1`, and
`algorithm32-distant-sun-gpu-cache-n4-v1`. Plan and fingerprint content
hashes also include the concrete source, atmosphere, geometry, boundary,
controls, pass modules, and backend capabilities. They must be compared
before and after the local cutover using the same request; no context-free
static content hash is invented here.

Stage 9.6.3 leaves this spherical/distant freeze unchanged. The local-only
replacement does not edit these identities, selected graphs, or published
logical results.

## Open Gates

- Independent physical Star validation for explicit-zero and nonzero
  reflective local-ground output remains deferred and must pass before those
  outputs can be called Star-validated, accepted, or an oracle.
- No Stage 9.6 implementation or containment gate remains open.
- Full selected-domain supported-hardware timing and resource qualification
  remains open; the bounded Chrome lane is conformance evidence, not that
  release claim.
