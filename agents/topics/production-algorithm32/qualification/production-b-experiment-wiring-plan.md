# Production B-Experiment Wiring Plan

Focus: Engine conformance and production benchmark export.

Related owners: [benchmarks](../../poc-experiments/benchmarks/production-b-experiment-wiring-plan.md).

## Fixed Boundary

The canonical closeout candidate is cumulative J4 over the existing 17 B1
conditions, 81 directions per condition, and 40 direct spectral coordinates.
The B1 aggregate RMSE must be no greater than
`11.820391604126252 mW m^-2 sr^-1 nm^-1`. B3 must reproduce the same-run B1
aggregate within `0.000001 mW m^-2 sr^-1 nm^-1`. Existing predeclared B1 and
B2 classification rules remain conjunctive rather than being replaced by the
closeout threshold.

Physical scoring must bypass Color, display encoding, tone mapping, and the
human-vision presentation filters. The six comparison figures must explicitly
use Basic Bruneton as their display control. This is an experiment control,
not a change to the ordinary Flat32 default.

Before implementation begins, reconcile any stale result descriptions in the
[B1 runner documentation](../../../../scripts/experiments/b1-directional-sky-radiance/README.md)
with this fixed boundary. Do not change a predeclared judgment rule in response
to the new result.


## Ownership And Dataflow

```text
B1 production profile
  -> production-owned offline direct-40 compiler adapter
  -> verified content-addressed cache assets
  -> production GPU cache loader and final-view transport shader
  -> immutable 17 x 81 x 40 B1 production boundary
  -> B1 independent scorer and six figures
  -> B2 integration of the exact B1 table
  -> B3 31-channel cube derived from that exact table
  -> one immutable B1-B3 score record
```

Production code and production-owned offline tooling may implement profile,
compiler, asset, loader, and shader integration. The experiment directories
continue to own benchmark mapping, independent scoring, figures, and result
publication. No contained experiment or archived Star implementation may be
imported by production at runtime.

All new execution and qualification output belongs below a new immutable run
under `tmp/extraterrestrial/production-color-reset/p8/`. Existing retained,
sealed, archived, or published results must not be modified or overwritten.


### C1.1 - Freeze And Test The B-Family Contract

Status: complete.

- Encode the canonical J4, 17-condition, 81-direction, direct-40 boundary as a
  single production-run contract.
- Require one backend, one production revision, one profile family, and one
  complete ordered condition set.
- Require B2 and B3 to resolve their inputs only through the validated B1
  production-run manifest.
- Test rejection of incomplete selections, mixed backends, changed axes,
  missing cubes, and mismatched provenance.

Gate: the contract tests demonstrate that no collection of unrelated tables
or assets can be presented as one canonical B-family run.

Result: `ProductionRun` now requires canonical J4, the ordered 17-condition
set, the paper profile, the production F68 incoming domain, one supported
backend, a complete direct-40 proposed table, canonical B3 axes, and matching
per-condition profile provenance. The combined scorer applies the exact
`11.820391604126252` closeout ceiling conjunctively with favorable predeclared
B1 and B2 classifications plus favorable, consistent, mismatch-complete B3.
The retained native 34-direction evidence contract is distinct from the
current paper-profile F68 contract; no retained artifact was changed. The B1
production support suite passes `23/23`, and the independent B1, B2, and B3
runner suites pass `65/65`.


### C1.2 - Define The Direct-40 Production Asset Contract

Status: complete.

- Define the exact asset shape needed by one B1 condition: direct-40 spectral
  basis, Native48 position domain, W27 outgoing domain, F68 incoming domain,
  cumulative J4 order, and the B1 numerical controls.
- Record profile, source, atmosphere, geometry, ground, domain, numerical,
  compiler, payload, and derivation identities.
- Make compatibility validation explicit and fail closed for the wrong basis,
  condition, order, source direction, domain, shape, byte length, or hash.
- Keep the qualification asset distinguishable from the deployed
  Native15/Z180 scene-cache inventory wherever their contracts differ.

Gate: independently constructed valid fixtures round-trip, and every declared
incompatibility is rejected before GPU installation.

Result: the production-owned
[`B1Direct40CacheAssetManifest`](../../../../scripts/algorithm32/production-b-experiments/B1Direct40CacheAssetManifest.js)
defines a content-addressed qualification asset distinct from the deployed
Native15/Z180 manifest. It binds the exact production profile, condition,
source direction, physical input identities, Native48/F68/W27/direct-40
domains, `40/20/40/J4` numerical controls, layer-major exact-seam layout,
compiler derivation, and production revision. The fixed payload is
`31,165,440` bytes (`40 x 48 x 4058` little-endian Float32 values), accompanied
by an `8,748`-byte logical-W27-to-unique Uint16 map. Its compatibility check
rejects a wrong basis, condition, source direction, domain, numerical control,
shape, path, hash, or uncovered manifest mutation before installation. The
focused contract tests pass `4/4`; the expanded B1 production support lane
passes `27/27`, and the Algorithm32 type check passes.


### C1.3 - Make The Production Offline Compiler Profile-Driven

Status: complete.

- Extract or extend the reusable production compiler seam currently owned by
  the distant-Sun offline compiler so it can accept an explicit, validated
  production execution profile.
- Preserve the current fixed Native15/Z180 compiler path and its identities.
- Reuse the production recurrence implementation; do not copy its equations
  into the B1 experiment harness.
- Preserve output containment, exclusive creation, real-path checks, link
  rejection, progress recording, and complete derivation evidence.

Gate: the existing production cache-compiler qualification remains green, and
a direct-40 dry run resolves the exact intended profile without emitting a
runtime-recurrence path.

Result: the new production-owned
[`DistantSunProfileCompilerInputs`](../../../../scripts/algorithm32/production-b-experiments/DistantSunProfileCompilerInputs.js)
normalizes one explicit Algorithm32 execution profile into the existing
offline GPU recurrence request. It derives the singleton source-zenith field,
Native48/F68/W27 domains, all 40 source/Rayleigh/Mie/ground channels, disabled-
ozone boundary, `20/40/J4` construction controls, profile identity, and a
content-derived numerical identity. Unsupported geometry, source,
atmosphere, domain, order, or ozone boundaries fail before browser execution.
The GPU compiler now consumes planet, atmosphere, source-path, incoming-count,
and transport constants from that request instead of silently fixing them in
shader source. CanonicalAtmosphere exposes its already-validated immutable
sea-level coefficient packets for this offline use. The deployed compiler
continues to use its unchanged Native15/Z180 input owner; pinned tests preserve
its exact build-request hash
`364d05afddbe0fec61f8941fa25ae71b70835706102946f025689d29ff65bf04`
and ledger hash
`b5e38741359b0e60ce6155a47941a000192c7aec1b6240d48bf3ab3bb032f671`.
The expanded B1 production support lane passes `31/31`, Algorithm32 passes
`610/610`, and the Algorithm32 type check passes. A fresh ignored Native15
compiler regression at
`tmp/extraterrestrial/production-color-reset/p8/c1-3-native15-regression-000001`
reproduces the qualified oracle, exact-seam, and direction-index payload hashes
`d7948cd1611cf2b5949093e60340be51bff392aeaf3c882145f4521376080b66`,
`db662148ce282e890b547a4db5deddbbfe5fff980a4f604709ad4739c0bab8d3`, and
`9b3873eb3529ecda1aa1569172ccb6bc85c4d22e3e037d3ddf8639452bfe34c8`.
Its cache identity is
`algorithm32-distant-sun-scene-cache-sha256:a9b3115f2ae57cc3aa5a262f87aee9d24176c7ee14ad08cc892171ba8126976b`.
The new run remains immutable, and no runtime recurrence path was added.


### C1.4 - Implement The B1 Offline Asset Adapter

Status: complete.

- Map `createBrunetonProductionProfile()` into the profile-driven production
  compiler request without silently resampling its 40-coordinate basis.
- Compile one complete J4 cache asset for each of the 17 canonical conditions.
- Finalize every asset transactionally with a content-addressed manifest and
  immutable payload hashes.
- Emit a set manifest binding all 17 condition assets to the exact production
  revision and B1 profile family.

Gate: a post-build verifier independently authenticates every asset, the set
is complete and ordered, and rerunning cannot reopen or overwrite the run.

Result: the production-owned `B1Direct40OfflineAssetAdapter` maps the exact
40 profile coordinates into the profile-driven compiler without resampling,
executes the shared GPU recurrence through a production-only browser entry,
and exact-seam encodes all 40 wavelength-major Native48/W27 layers. Each
condition is exclusively created and publishes its compiler-evidence record,
content-addressed `31,165,440`-byte Float32 payload, `8,748`-byte Uint16 map,
and content-addressed condition manifest in that order; the manifest is the
transactional completion boundary. The separate verifier rejects links,
escapes, extra or missing manifests, unsafe paths, incompatible profiles,
wrong production revisions, byte-length or hash changes, and unauthenticated
compiler evidence. The ordered set contract requires all 17 canonical
conditions and publishes its set manifest only after their condition manifests
exist.

Fresh immutable run
`tmp/extraterrestrial/production-color-reset/p8/c1-4-direct40-assets-000002`
contains 17 independently verified assets, 69 files, and `538,820,874` total
bytes. Its manifest SHA-256 is
`0b4ca20cb3eec56c3a1ec094493d2be649d617f3c866b84fc6f25d7b2b2e2c4d`
and its set identity is
`algorithm32-b1-direct40-cache-set-sha256:a62d08be115c5559224fd7915017cf606233ffe920ef5c4e88c0a24ab03cd30c`.
The standalone verifier authenticates all 17 assets. The earlier `000001`
attempt stopped before emitting any layer or manifest because its browser
entry exposed a bare package import; it remains an unpublished noncanonical
prefix. A post-refactor Native15 regression at
`tmp/extraterrestrial/production-color-reset/p8/c1-4-native15-host-regression-000001`
reproduces the unchanged qualified manifest, cache identity, oracle, exact-
seam, and direction-index hashes. The B1 production support lane passes
`37/37`, Algorithm32 passes `610/610`, and the Algorithm32 type check passes.


### C1.5 - Wire Exact Assets Into The Production GPU Host

Status: complete.

- Give the B1 GPU host the verified asset-set descriptor rather than permission
  to construct a cache.
- Make the browser host serve or load only manifest-authorized asset bytes.
- Configure each production B1 profile with its matching exact prebuilt cache.
- Install the cache through the production loader/backend and retain the
  production final-view transport shader.
- Remove the B1 harness dependency on ordinary `Algorithm32.setupShader()`
  constructing recurrence data.

Gate: an asset-backed GPU condition completes while the ordinary runtime
missing-asset rejection remains green and no runtime code path invokes the
recurrence.

Result: the B1 GPU host now independently verifies the complete asset set
before browser launch, exposes only its repository-contained manifest and
payload paths, binds each condition to its verified asset identity, and loads
the exact payload through the production immutable-texture backend. The
browser preserves the Node-verified profile identity and serialized source
direction across the Node/Chrome transcendental-rounding boundary, while the
fetched asset manifest still revalidates the complete production profile and
condition boundary before upload. The progress adapter delegates immutable
uploads without compiling or submitting recurrence work.

Bounded run
`tmp/extraterrestrial/production-color-reset/p8/c1-5-bounded-output-000005`
completed the `09:30` J4 condition through the production final-view shader
and all 81 direct-40 readbacks on the RTX 2060/D3D11 path. Its provenance
records asset set
`algorithm32-b1-direct40-cache-set-sha256:a62d08be115c5559224fd7915017cf606233ffe920ef5c4e88c0a24ab03cd30c`
and condition asset
`algorithm32-b1-direct40-cache-sha256:7813f5c14a32dbf109b3caec65aebde0e1c5fb30e4cd9a513ffb2ab687829d8a`.
The progress log contains asset installation and final-view preparation only;
it contains no recurrence shader preparation or layer submission. Earlier
bounded prefixes `000001` through `000003` remain failed, noncanonical,
immutable diagnostics; successful pre-containment-audit prefix `000004` is
also retained as noncanonical evidence. The B1 production support lane passes `40/40`,
Algorithm32 passes `610/610` including ordinary missing-asset rejection, and
the Algorithm32 type check passes.


### C1.6 - Preserve The Color-Free Measurement Seam

Status: complete.

- Retain the native four-channel-at-a-time GPU spectral readback until all 40
  channels are captured.
- Prove that Color Reset, display encoding, tone mapping, and stellar
  presentation filters cannot affect the B1 table, B2 integration, or B3 cube.
- Select Basic Bruneton explicitly only when generating the six visual
  comparison figures.
- Record the scoring and figure-control identities separately in provenance.

Gate: focused tests fail if a Color or presentation contribution reaches the
physical measurement boundary, and the figure manifest names Basic Bruneton.

Result: `B1MeasurementBoundary` now owns separate immutable records for the
physical scoring boundary and the six-figure Color control. Physical scoring
is fixed to the direct-40 post-transport/pre-Color observable, ten four-channel
RGBA32F reads, no display encoding, no tone mapping, and no stellar filters.
The browser rejects an assembled readout shader that lacks the native channel
path or contains a Color Reset, encoding, tone, or presentation contribution.
Every production B1 provenance record carries the exact measurement contract,
and `ProductionRun` rejects any mutation before B1, B2, or B3 scoring.

The production scorer explicitly selects `basic-bruneton` only for figure
generation and records `bruneton-figure1-display`, six controlled artifacts,
and `participatesInPhysicalScoring: false` separately from the physical
scoring boundary in its score manifest. Bounded GPU run
`tmp/extraterrestrial/production-color-reset/p8/c1-6-measurement-output-000001`
passed the assembled-shader guard, completed all 81 direct-40 readbacks, and
reproduced C1.5's table SHA-256
`1f80bb81e52ba336461dd109777da2e156f3ae6f9c8ebac16c4f8eca4ce317ca`.
The focused production-B suite passes `45/45`, Algorithm32 passes `610/610`,
and the Algorithm32 type check passes. A direct attempt to render the six
figures from the retained paper boundary stopped before artifact creation
because that historical provenance identifies 34 incoming directions rather
than the current required 68. Its
`tmp/extraterrestrial/production-color-reset/p8/c1-6-figure-output-000001`
prefix remains noncanonical; C1.9 will render the figures from the fresh full
68-direction boundary and publish the now-mandatory figure-control record.


### C1.7 - Strengthen Run And Derivation Provenance

Status: complete.

- Extend the production-run manifest with the production revision, compiler
  identity, asset-set identity, all 17 asset identities, profile hashes, GPU
  capabilities, and output hashes.
- Preserve the exact relationship from asset inputs through B1 table, B2
  integration, B3 cube, reports, and figures.
- Require interrupted and bounded runs to remain noncanonical and outside the
  accepted publication path.
- Keep CPU-reference and GPU-production identities distinct.

Gate: the existing `ProductionRun` validator authenticates the complete chain
before any B scorer executes, and tampering at each layer is rejected.

Result: production-run schema
`algorithm32-current-production-b1-run-v3` now distinguishes the CPU-reference
and production-GPU execution identities and records the production revision,
offline compiler, authenticated asset-set manifest, all 17 ordered cache-asset
and profile identities, GPU capabilities, selected profile hashes, output
hashes, and table derivation. `ProductionRun` reconstructs and validates this
chain before exposing scorer inputs. The combined score schema
`algorithm32-current-production-b1-b3-scores-v3` carries the exact source
manifest, table, provenance, cube, asset, and profile identities forward into
the B1, B2, B3, report, and figure products.

The fresh bounded proof
`tmp/extraterrestrial/production-color-reset/p8/c1-7-provenance-output-000001`
loaded successfully only with the explicit noncanonical allowance. It records
run `current-production-b1-gpu-shaders-20260903T211040049Z`, all 17 asset
identities, the selected 09:30 profile, RTX 2060/D3D11 capabilities, and table
SHA-256
`1f80bb81e52ba336461dd109777da2e156f3ae6f9c8ebac16c4f8eca4ce317ca`.
Its exact `bounded-or-diagnostic` / `publicationEligible: false` classification
is recomputed by the validator, and the default canonical load rejects it
before scoring or publication. Focused mutation tests reject changes to the
revision, compiler, set manifest, embedded set, asset identity, profile hash,
GPU-capability record, J4 default-provenance alias, and output derivation. The
focused production-B suite passes `47/47`,
Algorithm32 passes `610/610`, and the Algorithm32 type check passes.


### C1.8 - Run A Bounded End-To-End Proof

Status: complete; the former worst condition passes the parity gate.

- Build and verify one representative condition in a fresh run.
- Load it through the production GPU path and capture all 81 direct-40 spectra.
- Compare the result pointwise with the production CPU reference for the same
  profile.
- Verify shader preparation, finite/nonnegative output, resource cleanup,
  context cleanup, progress evidence, and provenance finalization.

Gate: the bounded proof passes its predeclared CPU/GPU tolerance and leaves no
published or partially canonical record.

Result: fresh bounded run
`current-production-b1-gpu-shaders-20260903T211845411Z` under
`tmp/extraterrestrial/production-color-reset/p8/c1-8-gpu-output-000001`
authenticated the complete asset set, prepared the production shader, captured
all 3,240 finite/nonnegative direct-40 values, and finalized its noncanonical
manifest. Its progress record confirms handle, target, three zero textures,
backend, renderer, canvas, context-loss request, browser, and module-server
cleanup. Fresh independent binary64 run
`current-production-b1-cpu-reference-20260903T211841256Z` under
`tmp/extraterrestrial/production-color-reset/p8/c1-8-cpu-output-000001`
completed the same 09:30/J4 profile and finalized its noncanonical manifest.

The predeclared production R32F envelope remains the absolute RMS limit `2e-7`
and maximum absolute residual limit `2e-6`. Investigation retained every failed
prefix and found four production-adaptation discrepancies: the offline compiler
used a receiver-local rather than production source-aligned frame, interpolated
construction altitudes rather than selecting their containing bins, omitted
production ground-radiance recurrence semantics, and recovered altitude by the
float32-cancellation-prone `length(point) - bottomRadius` expression. Stable
ground/top intersections, exact W27 tolerance, and the production ground-relative
curvature altitude expression now apply only to the profile-driven production
compiler mode; the deployed Native15 receiver-local compiler mode is unchanged.

The former worst condition was rerun alone, per project-owner direction, under
`tmp/extraterrestrial/production-color-reset/p8/c1-8-stable-altitude-diagnostic-000001`.
Its independently verified v8 asset is
`algorithm32-b1-direct40-cache-sha256:d9c78655bc3466d1caee474de9f01f3e37aaee354ba5920036e6541fbb689833`.
The actual production GPU final-view report at
`parity-v8-000001/parity-report.json` passes all 3,240 values with RMS
`1.6437580389881614e-7` and maximum absolute residual
`8.357800406200155e-7`. The parallel binary64 final-view evaluation of the
same exact R32F asset also passes with RMS `1.6225871567685206e-7` and maximum
absolute residual `9.258900772191048e-7`, isolating runtime GPU error below the
declared envelope. This closes the bounded C1.8 parity defect. It does not
claim that the unexecuted 17-condition canonical C1.9 set passes; no full-set
build or run was performed after the fix.


## Verification Lanes

The implementation must add focused coverage for profile-to-compiler mapping,
asset schema and hash validation, incompatibility rejection, immutable run
publication, asset-backed GPU installation, runtime-recurrence exclusion,
Color-free readback, and same-run B1-B3 consumption. It must also retain the
existing B1 production support suite and the production distant-Sun cache
compiler, loader, WebGL, and runtime missing-asset gates.

The canonical execution commands may be finalized during C1.3-C1.7. They must
provide separate commands for asset construction/verification, bounded GPU
proof, full B1 boundary generation, and combined B1-B3 scoring. No command may
default to overwriting a prior output directory.
