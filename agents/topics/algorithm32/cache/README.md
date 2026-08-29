# Algorithm32 Scattering Cache

Status: current selected cache topic.

This topic owns the numerical meaning, domains, sampling rules, construction
contract, and lifecycle of Algorithm32's atmospheric scattering cache. The
[production topic](../production/README.md) owns delivery sequence and actual
code status. The [validation topic](../validation/README.md) owns external
benchmark claims and whole-output diagnostics.

## Implemented Baseline

The implemented spherical/distant path uses one camera-independent but
receiver-column/source-state-specific cumulative local spectral
scattering-density cache. That representation remains runtime authority until
a separately qualified successor is promoted.

The current working-domain selection has:

- 15 scalar spectral channels;
- cumulative scattering through order 4 by default;
- the ordered Native48 physical altitude nodes with an exact `0 m` boundary
  node and 47 interior nodes through `59,375 m`;
- reflection-completed ordinary Fibonacci-68 incoming quadrature;
- source-aligned W27 outgoing reconstruction;
- 15-interval production construction transport; and
- geometry-owned linear interpolation between actual neighboring altitude
  nodes only at final view lookup.

The original first-release `2 m`/Fibonacci-34 selection remains historical
implementation and parity evidence. Changing the boundary node and incoming
quadrature did not repair the representation's missing actual-point
solar-zenith state.

Pure orders remain separate while they feed the recurrence. The cumulative
field never feeds the next order. Supported requested maxima are 1, 2, and 4,
with 4 as the default. An N=4 build constructs pure J3 internally, but N=3 is
not a standalone requested configuration. Changing the requested maximum
order causes a complete cache rebuild.

The production recurrence seeds source-specific `J1` and `L1` separately.
`L1` is the direct-primary radiance integrated continuously along each
selected incoming-quadrature ray; generic stored-density transport begins with
`J2 -> L2`.
Those algorithms and logical field shapes are current production behavior.
The closed Algorithm32-Star experiment records their historical selection but
is no longer executable authority or a production source. Any renewed
conformance claim must select independent authority through the current
production architecture boundary. Source-text, class-layout, and physical
CPU-packing identity with the historical implementation are not requirements.

Production cache construction is GPU-resident. The CPU builder and recurrence
remain the deterministic oracle for focused values, complete rays, and
CPU/GPU parity; they do not remain a second production construction path after
GPU promotion. A cache phase is not complete until its GPU construction,
lookup, lifecycle, and focused parity seams are integrated.

## Working Documents

Each normative fact has one canonical owner. The cache contract is the
umbrella physical/numerical authority; focused documents own their detailed
reconstruction rules or software realization and are linked rather than
copied.

- [Selected cache contract](cache-contract.md) owns field meaning, recurrence,
  frozen domains, physical ownership, ground participation, invalidation,
  runtime calculation, and completion-evidence categories.
- [Distant-Sun solar-zenith cache design](solar-zenith-cache-design.md)
  owns the selected point-local successor field: one cumulative local-density
  cache per scene, addressed by altitude, actual local solar zenith, complete
  source-relative outgoing direction, and Native15 payload. It also owns
  scene-support culling, packing, resource accounting, resolution,
  redundancy/compression studies, and the qualification boundary. It changes
  no implemented baseline by itself.
- [Distant-Sun point-local solar-zenith cache plan](distant-sun-solar-zenith-cache-plan.md)
  records the contained execution sequence and phase gates. P0 through P10 are
  complete: P7 closes in run `000570`, P8 accepts the current
  Native48/Z180/W27 grid in run `000569`, P9 builds and measures the complete
  uncompressed W27 asset in runs `000572`/`000577`, and P10 qualifies exact
  seam deduplication in run `000579`. Shifted-grid results remain non-blocking
  diagnostics and the tested refined grid remains B1-rejected. The plan
  contains no local-Sun or production implementation phase.
- [Cache interface design](cache-design.md) owns the ambient
  type surface, owner contributions, pass representation and assembly, GPU
  backend and executor, concrete classes, runtime handoff, and lifecycle
  mechanics.
- [Outgoing reconstruction](outgoing-reconstruction.md) is the canonical owner
  of the exact W27 direction rule, its numerical gate, resource implications,
  and claim boundary.
- [Spatial reconstruction](spatial-reconstruction.md) is the canonical owner
  of the exact final-view position stencil, its evidence, current status, and
  CPU/shader completion requirements.
- [Local-Sun whole-flat-world cache design](local-sun-cache-design.md) is an
  archive redirect for terminal historical evidence. No active local-Sun
  successor design is selected.
- [Superseded alternatives](superseded-alternatives.md) records closed designs
  that must not return as implementation fallbacks.

## Terminal Flat/Local Research

The archived material linked by the
[local-Sun whole-flat-world cache redirect](local-sun-cache-design.md)
records the former scattering-aligned shell-family design and its exact
historical representation facts. Its characterization plan and self-contained
Star implementation are terminal accepted engineering evidence, indexed by the
[Algorithm32-Star evidence archive](../archive/algorithm32-star/README.md).
They are not an active study or editable implementation surface. Production
now owns the promoted behavior and the
[Flat32 application design](../production/flat32-migration-inventory.md#future-application-cache-quality-profiles-and-feature-policies)
owns later profile, control, feature-policy, and time-animation follow-up.

The
[source-relative animation and in-setup reconfiguration follow-up](cache-design.md#deferred-follow-up-source-relative-animation-and-in-setup-reconfiguration)
owns retained GPU infrastructure and compatible live-update mechanics. The
spherical/distant numerical replacement is now owned separately by the
[solar-zenith cache design](solar-zenith-cache-design.md). Neither document
changes the implemented cache or lifecycle contract by itself.

The
[dome-aware nonlinear position-index proposal](cache-design.md#proposed-flatlocal-dome-aware-nonlinear-position-index)
records the earlier sparse position family and its terminal evidence. Stage 1
accepts its explicit map/world-centered atmosphere boundary, Stage 2 accepts
the coordinate invariant for the frozen direct binary64 slice, and Stage 3
rejects the complete predeclared node-additive sparse-position path under the
unchanged resident representation. The independently useful exact ragged
transport proposal remains separate. The current scaled 19-by-15 flat/local
cache remains production behavior.

The terminal
[local-Sun shell-cache characterization plan](../experiments/local-sun-shell-cache-experiment-plan.md)
records the isolated namespace, immutable run sequence, inputs, and accepted
claim boundaries used before production promotion. Algorithm32-Star is
retired; its bridge and evidence capsule no longer exist. Any future cache
study requires a new isolated lane and the independent-authority route in the
current production architecture contract.

## Implemented Foundation, CPU Oracle, And GPU Construction

`src/algorithm32` now contains the selected cache's direct data, domain,
construction, result, and lifecycle contracts. The governing retirement and
replacement decision is in
[Algorithm32 reconciliation Step 2.9](../archive/reconciliation-2026-08-04/algorithm32/reconciliation-plan.md#29-retire-descriptors-and-justify-assembly-declarations);
this status summary records the resulting cache surface rather than restating
that decision.

- unit-bearing scalar, spectral-basis, and spectral-packet contracts;
- an explicitly native production profile that is not the paper/comparison
  profile;
- executable native-48, source-local reflection-completed ordinary
  Fibonacci-68, and source-local W27 domain owners with direct ids, nodes or
  vectors, integration weights, counts, and lookup behavior;
- direct `CacheConstructionOptions` carrying only the production transport
  interval count and requested maximum scattering order;
- source-owned binary64 CPU packing/addressing and direct R32F GPU
  `CacheFieldStorage` allocation facts;
- direct `CacheFieldSpec { id, storage }` requests for pure and cumulative GPU
  fields, with omitted ground represented by `null` and a canonical executable
  zero-reflection module rather than a synthetic boundary identity;
- source-owned distant-Sun executable packing and direct domain selections for
  Fibonacci-68 radiance and W27 scattering fields;
- private mutable-then-sealed binary64 CPU fields and distant-Sun factories for
  pure `Lk`, pure `Jk`, and cumulative `JthroughN`;
- a typed source-independent builder boundary that delegates `L(k-1) -> Jk`
  calculation to a supplied synchronous kernel, plus a separate accumulator
  whose contract accepts only contiguous pure `J1...JN` fields;
- source-owned physical distant-Sun N=1 construction over native-48 x W27 x
  native-15, with sealed pure `J1`, sealed `Jthrough1`, and an order-1
  nonresident result that reports its direct `CacheConstructionOptions`;
- production source-frame conversion, containing-bin construction lookup,
  and exact dominant-face W27 interpolation;
- source-owned direct-primary `L1` over native-48 x the selected incoming
  domain x native-15. The preserved first-release Fibonacci-34 fixture covers
  1,530 historical parity scalars; and
- generic production pure stored `Jk -> Lk` CPU transport plus a
  distant-source adapter that owns native coordinates, W27 mapping, physical
  frame resolution, the production 15-interval count, allocation, and
  provenance;
- generic production physical `L(k-1) -> Jk` scattering with independent
  source-local incoming and outgoing domain mapping and exact declared
  reflection-completed Fibonacci-68 weights; and
- one source-owned nonresident CPU build for requested N1, N2, and default N4,
  with exact pass graphs `J1`; `J1, L1, J2`; and
  `J1, L1, J2, L2, J3, L3, J4`;
- geometry-owned final-view Native-48 reconstruction with exact-node reads,
  endpoint clamping, and adjacent physical-node interpolation while retaining
  the separate construction lookup; and
- a concrete resident `DistantSunCpuCache` that consumes a completed
  N1, N2, or N4 result, retains its cumulative reader and physical
  `sampleProvenanceIdentity`, samples resolved position-by-W27 stencils across
  all 15 wavelengths, returns a typed cumulative scattering-density packet,
  and disposes its reader.

For the selected 4,374-direction, 48-position, 15-wavelength J field, the
binary64 CPU layout declares 25,194,240 bytes and the R32F GPU layout declares
12,597,120 bytes. The distant-Sun CPU factory now allocates that private
binary64 storage. A Fibonacci-68 `Lk` field contains 48,960 scalars and occupies
391,680 bytes in binary64 (195,840 bytes in R32F); a W27 `Jk` or `JthroughN`
field contains 3,149,280 scalars and occupies 25,194,240 bytes in binary64.
Physical N1 applies source-path transmittance and
phase-weighted Rayleigh/Mie scattering without view transmittance or view-path
measure. N2 adds direct `L1` and physical `J2`; N4 continues with stored-field
`L2`, physical `J3`, stored-field `L3`, and physical `J4`. N2 constructs no
`L2`, N4 constructs no `L4`, and only the pure preceding order enters each
recurrence operation. The current source-owned entry supports only requested
maxima 1, 2, and 4 and defaults to 4. The production profile default remains
native rather than paper-comparison. An omitted boundary selects canonical
black ground directly; an explicit `UniformLambertianGroundBoundary` supplies
direct `id`, `model`, spectral `albedo`, BRDF, and cache-module behavior.
Direct `L1` remains separate from stored `J1`; the generic transport accepts
`J1` for diagnostics but enters production recurrence only at `J2 -> L2`.

The nonresident CPU result intentionally retains sealed pure `J` and `L`
fields with the final cumulative field for diagnostics and CPU/GPU oracle
work and reports the direct options that completed. The resident concrete
cache retains only the completed cumulative reader and its physical sample
provenance; it does not retain the pure diagnostic fields. It provides resolved
CPU sampling and disposal as the oracle surface. The distinct
`DistantSunCache` owns the cumulative GPU artifact, opaque runtime binding, and
final-view shader contribution, while its source-created controller owns
publication and lifecycle.
The pre-existing cache interfaces now contain these canonical shapes directly;
there is no parallel versioned type or compatibility alias.

Stages 4.0 through 5 complete the selected GPU construction surface:

- separate common, synchronous CPU-oracle, and opaque GPU cache capabilities;
- the direct `DistantSunCpuCache` naming cutover with no retired alias;
- ambient owner module, binding/data, field/storage, pass, plan, shader,
  backend, executor, probe, scheduler, artifact, and runtime-binding contracts
  expressed as top-level aliases and interfaces without TypeScript `declare`;
- executable atmosphere, spherical-geometry, distant-source, shared
  canonical-black-ground, cache-layout, and generic-operation owner modules;
- source-owned executable primary `J1` and direct-primary `L1`, plus generic
  pure-field scatter, transport, copy, and cumulative-add operations;
- exact source-owned requested-order graphs of `J1, Jthrough1` for N1;
  `J1, L1, J2, Jthrough2` for N2; and
  `J1, L1, J2, Jthrough2, L2, J3, Jthrough3, L3, J4, Jthrough4` for N4;
- one geometry-packed, atmosphere-dependent 15-interval transport dataset for
  N4, reused unchanged by the pure `J2 -> L2` and `J3 -> L3` passes;
- deterministic dependency-aware construction shader assembly;
- trusted typed plan execution using explicit `CacheFieldStorage` allocation
  facts, JavaScript pass/wavelength orchestration, bounded probes,
  last-consumer release, cancellation, failure cleanup, and result-only
  artifact ownership;
- required exact logical-memory diagnostics for peak live field storage, peak
  pass-bound packed data, their peak tracked sum, and resident result-field
  storage, all as unit-bearing byte values and explicitly excluding
  renderer/driver overhead; and
- an opaque Three/WebGL2 R32F backend with external renderer capability checks,
  state-neutral compilation/submission/readback, and real-browser execution of
  an assembler-produced shader.

Step 2.9 supersedes Stage 4's metadata surface with direct contracts. A
`CacheBuildModule` directly declares `provides`, `requires`, shader blocks, and
bindings to the provider-neutral `CachePassAssembler`; its actively consumed
`contentHash` remains the module content identity consumed by deterministic
ordering, shader/pass identity, plan identity, and reuse.
`CacheData.contentHash` likewise remains where packed value content is consumed.
`CacheBuildPlan` carries only direct `identity`, `fields`, `passes`, and
`result`; `CacheBuildArtifact` carries only its cumulative result, opaque
runtime bindings, diagnostics, and disposal. Each runtime binding carries only
its binding `id`, shader `valueKey`, logical `fieldId`, and `backendId`. CPU
build results expose their cumulative and retained pure fields plus direct
`options`, while resident CPU caches expose `sampleProvenanceIdentity`. No
parallel cache-part or owner snapshot is part of the current surface.

The
[checked-in GPU parity policy](../../../../src/algorithm32/implementation/distant-sun/cache/fixtures/gpu-cache-parity-policy.json)
was declared before production GPU output. It selects all 15 wavelength
layers, five W27 scattering-density queries, five Fibonacci-34 radiance
queries, and the error rule
`absolute + relative * abs(binary64 CPU oracle)`. Its bounds are absolute
`2e-9` plus relative `0.005` for pure radiance, absolute `2e-12` plus relative
`0.005` for pure scattering density, absolute `8e-12` plus relative `0.005`
for cumulative scattering density, and zero error for exact-copy checks. The
fixture's schema, coordinates, and selected domain facts have a focused
fixture check.

The policy bounds remain relevant, but those five Fibonacci-34 coordinates
are a frozen first-release evidence surface rather than a description of the
current reflection-completed Fibonacci-68 domain.

Stages 4.1, 4.2, and 5 are accepted under that policy. The accepted
software-renderer evidence covers exact N1 copy, bit-identical shared N2/N4
values, selected-only readback, result-only retention, cleanup, and
staging-resource lifecycle. The
[baseline import status](../production/baseline-import-status.md) owns the
exact comparison counts, observed error, and artifact-memory results. The
ordinary Fibonacci-34 parent vectors and weights are pinned as exact literals;
the current selection deterministically appends each reflected partner with
half weight. This gives Node and browser runtimes the same
reflection-completed Fibonacci-68 executable values. The parent's match to the
closed Star selection is historical provenance, not current authority.

Those browser results establish numerical and staging-resource lifecycle
conformance of the graph; the software renderer does not establish
supported-hardware timing or resource budgets. Detailed software interfaces,
pass ids, bindings, lifetimes, and diagnostic semantics belong to
[cache-design.md](cache-design.md), not this status summary.

Stages 6 and 7 complete the visible cumulative-cache path. The source creates
one controller per runtime attachment; complete N1/N2/default-N4 results
publish atomically. Each source-specific controller compares a private reuse
key derived from the direct plan identity and complete backend capabilities;
the composer-owned backend installs an opaque resident binding; and CPU/shader
final-view traversal performs one cumulative lookup per path point from
geometry-resolved Native-48 and W27 stencils. The retired
incident-cache API, CPU payload upload, direct-view term, incident-direction
loop, and compatibility path are absent.

The focused Stage 7 browser gate passes opaque-binding lookup, cumulative
CPU/GLSL traversal, and automatic public setup for N1/N2/N4. The full combined
nine-spec browser lane remains environment-unverified on the
Microsoft Basic Render Driver. The
[baseline import status](../production/baseline-import-status.md) owns exact
run results and the still-open sparse binary64/capable-hardware evidence.

## Open Work

- The selected [distant-Sun plan](distant-sun-solar-zenith-cache-plan.md) is
  complete through P10. Run `000569` owns the external-accuracy decision, run
  `000570` closes the P0 scene-support contract, runs `000572`/`000577` own
  the uncompressed asset and named-hardware lifecycle ledger, and run `000579`
  qualifies exact seam deduplication. Open work is now limited to an explicitly
  authorized production port, broader hardware/opaque-driver budgets,
  deferred animation, any separately justified lossy codec study, and later
  independent local-Sun design.
- Preserve the terminal
  [historical Star flat/local dome-cache evidence](../archive/algorithm32-star/experiments/star-flat-local-cache-plan.md#stage-3-evidence).
  Focused run `000201` accepts all 165 candidate-v4 tests; deciding run
  `000202` rejects the 319-node candidate on its four frozen accuracy gate
  IDs, and the unchanged resident ceiling closes further node-additive
  refinement under this representation. Stage 4 is blocked and there is no
  current executable sparse candidate. Any future continuation requires a
  separately scoped representation or compression decision with new frozen
  authority and inputs. Do not reopen the selected Stage 9 cache or old Star
  rectangular cache as an implementation shortcut.
- Renewing the legacy Stage 8 Star-validation claim requires a new isolated
  evidence lane that consumes the unchanged sealed gold; the archived Star
  experiment itself is not reopened.
- Complete expanded final-view CPU/GPU ray parity, pinned-source provenance,
  citations, and release-level lifecycle coverage during follow-on hardening.
- Declare and measure supported hardware precision, cold/rebuild time,
  renderer/driver peak and resident memory, steady lookup/runtime cost, and
  staged-build responsiveness. The implemented logical-byte diagnostics do
  not replace those hardware budgets.

Changing reflection-completed Fibonacci-68, W27, the 48 nodes, construction lookup, 15 transport
intervals, the 15-channel basis, or the order-4 default requires separately
scoped evidence. Those physical and numerical selections are not incidental
implementation choices.

The retired Star parity artifact was sealed at 40 construction intervals.
Former offline parity consumers selected that value through an explicit
comparison-only control to reproduce the Star capture exactly. The artifact
is historical evidence only, not a current executable input or the production
default, and it cannot enter the source-controller/runtime publication path.

## Archive Sources

The detailed research methods, run narratives, and rejected alternatives are
retained in the
[topic-documentation archive](../../../../archives/topic-documentation-archive-2026-07-19.zip).
The durable content recovered here came from the archived cache-design,
outgoing-fit, spatial-fit, Bruneton-invariant, and primary-factorization
documents. The archive is provenance, not current guidance.
