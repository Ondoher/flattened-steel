# Stage 9.6 Containment Inventory

Focus: Engine conformance and production benchmark export.

Related owners: [caches](../caches/stage-9.6-containment-inventory.md).

## Authority And Evidence Boundary

The numerical migration authority was the accepted Star implementation
manifest at the retired path
`scripts/algorithm32-star/cases/local-sun-shell-cache-accepted-implementation-v1.json`,
whose retirement is recorded by the
[Algorithm32-Star evidence index](../../../../archives/topics/retired-20260906/agents/topics/algorithm32/archive/algorithm32-star/README.md),
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
[production architecture boundaries](../architecture-contracts/architecture-boundaries.md#algorithm-source-promotion-and-conformance);
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


## Open Gates

- Independent physical Star validation for explicit-zero and nonzero
  reflective local-ground output remains deferred and must pass before those
  outputs can be called Star-validated, accepted, or an oracle.
- No Stage 9.6 implementation or containment gate remains open.
- Full selected-domain supported-hardware timing and resource qualification
  remains open; the bounded Chrome lane is conformance evidence, not that
  release claim.
