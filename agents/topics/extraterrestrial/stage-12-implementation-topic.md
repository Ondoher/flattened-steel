# Stage 12 Extraterrestrial Implementation

Status: complete, candidate-qualified. The Stage 12 experiment established
the requested spherical/flat celestial cache mechanisms, normal-runtime
integration, subjective scene renders, and shared local-brightness response.
Deferred work is no longer an experimental closure condition; it is owned by
the [extraterrestrial production follow-up](promotion-plan.md).
The baseline is sealed; the candidate contains G1 geometry, G2 synthetic
lifecycle, G3 CPU star fields, G4 derived CPU Sun-disk data, and G5's internal
ray-probe evaluator, an R32F primary celestial GPU cache-render path, and a
live distant-Sun GPU consumer with matched scene-hit visibility, a G8
hardware/resource/lifecycle qualification record, and the bounded live GPU
stellar point raster. The candidate remains evidence only and is not a
production runtime dependency.

## Accepted G0 Checkpoint

- Source revision:
  `ea2621155641e47626495195215d26f654668f08`.
- `src/algorithm32` Git tree:
  `5f17471509162e6877de2cc45d0daf0e0ec2cb99`.
- Source/baseline/candidate inventory: 285 files, 4,423,394 bytes, aggregate
  SHA-256
  `515987a60fdf661ef283e42bcf436c1bc5baf0a8768e33969a53e49da097612d`.
- Decision manifest:
  [G0 decision manifest](../../../scripts/extraterrestrial/decisions/g0-decision-manifest-v1.json),
  content fingerprint
  `sha256:37c0fd85c82c887ba4d65c51ce7b2eb74e231d63c1f680e78efc3e0e108f8f43`.
- Accepted immutable run: `000002-g0-boundary-contract-proof`, 10/10
  assertions, 25/25 classified negative controls, proof fingerprint
  `sha256:751a96775acdd4a6376c10f8a0b1db27ef94b74c4943cb85ebb33222c91f5026`,
  artifact-set SHA-256
  `e5308c60137ddcb46624755e1ad149a13f91aa9ae129969f64dde66bbaff7d8a`.
- Terminal run `000001-g0-boundary-contract-proof` is preserved as a verified
  failed attempt.
- Reproduce the accepted proof with
  `node scripts/extraterrestrial/runners/run-g0-boundary-contract-proof.js`
  and verify a terminal record with
  `npm --prefix scripts/extraterrestrial run verify:run -- <run-id>`.

The accepted G0 claim is deliberately limited to isolation, dependency
closure, ownership, schemas, named-frame mechanics, typed quantities,
static/live identity, roster semantics, shared Sun identity, and classified
failure behavior. Its deferred field-coordinate and stencil decision was
subsequently resolved by accepted G1 evidence.

## Accepted G1 Checkpoint

- Candidate-only implementation: `SphericalCelestialContributionDomain`,
  delegated by `SphericalEarthGeometry`; `FlatEarthGeometry` explicitly
  rejects `spherical-sun-stars-radial-v1`.
- Accepted immutable run: `000008-g1-geometry-transform-proof`, 11/11
  assertions and 5/5 negative controls, artifact-set SHA-256
  `21eb028380303e0a5a6843be17787b5c2a6068920a4b05099a4fe849a0c8dd06`.
- The proof covers named-frame epoch/geography placement, altitude nodes,
  `(h, u)` bilinear stencils, pre-lookup ground-horizon zero, full/partial/
  empty uniform-Sun support, a top-atmosphere build path, and camera-free
  field/query identity. Its field-plan marker remains
  `sha256:g1-synthetic-field-plan-v1` across placement changes.
- Terminal runs `000003` through `000006` are retained failed attempts. The
  run ledger is allocated through `000008`; the next allocation is `000009`.
- Reproduce with
  `node scripts/extraterrestrial/runners/run-g1-geometry-transform-proof.js`
  and verify with
  `npm --prefix scripts/extraterrestrial run verify:run -- 000008-g1-geometry-transform-proof`.

The accepted claim is limited to geometry mechanics. It does not establish
transported payloads, rasterization, live visibility, or GPU execution.

## Accepted G2 Checkpoint

- Candidate-only implementation:
  `caches/celestial/CelestialContributionCacheController.js`, created only by
  the spherical geometry contribution domain.
- Accepted immutable run: `000009-g2-generation-lifecycle-proof`, 10/10
  assertions and 3/3 negative controls, artifact-set SHA-256
  `613fd79c87835928d52a5f50b466843a6d0fd112f167d9ca692320b16ad7d4d5`.
- The proof accepts only complete two-star plus single-Sun synthetic
  generations; exact requests reuse the active generation, rejected and
  superseded staging preserves it, publication precedes old-generation
  disposal, and controller/generation disposal is idempotent without disposing
  the external backend. It reports logical 720 B, packed 768 B, peak 1,536 B,
  and resident 768 B synthetic resource categories.
- The distinct `celestialCacheController`, `celestialCacheGeneration`, and
  `celestialCacheIdentity` slots are present; no transported payload, shader,
  raster, live-visibility, or GPU claim is made.
- The ledger is allocated through `000009`; the next allocation is `000010`.
- Reproduce with
  `node scripts/extraterrestrial/runners/run-g2-generation-lifecycle-proof.js`
  and verify with
  `npm --prefix scripts/extraterrestrial run verify:run -- 000009-g2-generation-lifecycle-proof`.

G3 now owns candidate CPU point-set transport and its direct-transport parity
proof; it cannot treat synthetic G2 payloads as transport results or oracles.

## Accepted G3 Checkpoint

- Candidate-only implementation:
  `caches/celestial/CpuStarPointSetCache.js`, using geometry build samples and
  the candidate `CanonicalAtmosphere` as the sole direct-transmittance owner.
- Accepted immutable run: `000017-g3-cpu-star-transport-proof`, 6/6
  assertions and 2/2 negative controls, artifact-set SHA-256
  `6923c0cc0835b7cbc9ab816de7bbc8530d9913c72602232d4f0d71dc5b01052e`.
- The proof accepts two complete 15-channel binary64 point-irradiance fields.
  Every exact node matches independent direct transport with zero measured
  relative error. Stratified probes meet the declared mixed tolerance of 15%
  relative or `1e-11` absolute irradiance density (worst normalized error
  `0.9009522166916418`); below-horizon queries are exact spectral zero before
  interpolation, and the aggregate equals its retained member sum.
- Member-radiometry changes alter field identity; placement and camera state do
  not. Terminal runs `000010` through `000016` are retained failed refinement
  attempts. The ledger is allocated through `000017`; the next allocation is
  `000018`.
- Reproduce with
  `node scripts/extraterrestrial/runners/run-g3-cpu-star-transport-proof.js`
  and verify with
  `npm --prefix scripts/extraterrestrial run verify:run -- 000017-g3-cpu-star-transport-proof`.

## Accepted G4 Checkpoint

- Candidate-only implementation:
  `caches/celestial/CpuSunDiskRadianceCache.js`, derived from an existing
  `DistantSunLightSource`; it accepts no separate Sun radiometry or placement
  definition.
- Accepted immutable run: `000024-g4-cpu-sun-disk-transport-proof`, 6/6
  assertions and 2/2 negative controls, artifact-set SHA-256
  `ec1831112c88c1a14470ef5dce837e76245ad531368c4ff85e656247b434a599`.
- The proof derives uniform 15-channel disk radiance by dividing the shared
  atmospheric Sun irradiance by its angular solid angle, then applies only the
  candidate atmosphere's direct transmittance. Exact nodes differ from direct
  binary64 transport by at most `2.3049312601276617e-15`; off-node probes meet
  the selected 15% relative or `1e-11` absolute policy (worst normalized
  error `0.9009522166916419`).
- Geometry packets retain the one shared Sun for full, partial horizon-crossing,
  and empty support. Ground-blocked and out-of-disk samples are exact zero;
  source or support mismatches reject. G4 does not raster, compose, or apply
  scene visibility.
- Terminal runs `000018` through `000021` are retained failed refinements. The
  boundary-stencil correction is requalified by accepted G1 run `000022` and
  G3 run `000023`. The ledger is allocated through `000024`; the next
  allocation is `000025`.
- Reproduce with
  `node scripts/extraterrestrial/runners/run-g4-cpu-sun-disk-transport-proof.js`
  and verify with
  `npm --prefix scripts/extraterrestrial run verify:run -- 000024-g4-cpu-sun-disk-transport-proof`.

G5 now owns CPU Sun-disk raster integration and spectral composition. It may
consume G4's derived extended radiance and G3 point irradiance, but it must not
reapply atmospheric transmittance, create another Sun owner, or change either
cache's camera-independent field identity.

## Work And Canonical Guidance

We are implementing and qualifying the first
`CelestialContributionCache` family for a spherical Earth and radial
atmosphere:

- one bounded aggregate star layer whose members retain transported
  15-channel point irradiance until live visibility and rasterization;
- one distant uniform Sun-disk layer carrying transported 15-channel
  radiance; and
- one spectral addition, `pathRadiance + celestialRadiance`, before Color.

Geometry owns celestial/geographic/model/cache transforms and creates the
celestial controller. The Moon, flat geometry, profiled disks, celestial
mutual ordering, and catalog-scale stars are later families.

The canonical architecture is the
[Celestial Contribution Cache design](celestial-contribution-cache-design.md).
The canonical sequence and observable conclusions are the
[Stage 12 implementation plan](promotion-plan.md). Open only the design
section or plan stage required by the current task; do not preload either
document during bootstrap. Do not begin Stage 12.1 until the
[12.0 observable conclusion](promotion-plan.md#120-freeze-the-implementation-boundary-and-executable-contracts)
passes.

## Hard Experiment Boundary

- Tracked source and control root: `scripts/extraterrestrial/`.
- Ignored execution and qualification output root:
  `tmp/extraterrestrial/`.
- After the baseline is sealed it is immutable. Only
  `scripts/extraterrestrial/candidate/` is a mutable implementation surface.
- Before an explicitly authorized Stage 12.10 promotion, do not modify any
  code outside `scripts/extraterrestrial/`. This includes production,
  Flat32, application/build wiring, root package configuration, the archived
  Star lane, other experiments, and `C:\dev\poly-gc-react`.
- External code may be inspected read-only only when the design or current
  plan stage requires a comparison. The sole copy exception is the
  manifest-governed Stage 12.0 production snapshot into the sealed baseline
  and initial candidate. External code may not otherwise be imported, copied
  at runtime, patched, or used as the owner of an experimental fix.
- No runnable may import live production, Flat32, Star, another experiment,
  an external repository, or generated output. Bare dependencies must be
  experiment-local, declared, pinned, and locked.
- Every generated build, proof result, run, browser bundle, profile, cache,
  report, capture, readback, diagnostic, render, log, and temporary artifact
  goes under `tmp/extraterrestrial/` and is never committed.
- Derive roots from repository identity, real-path-check reads and writes,
  and reject symlinks, junctions, `..` escapes, and absolute-path escapes.
- Canonical topic, design, plan, and status documentation may be updated;
  documentation maintenance is not permission to place implementation
  outside the experiment.

If work requires a code or output write outside these roots, or contradicts
the design or current plan stage, stop before the write and ask for explicit
authorization.

## Proof-Of-Concept Verification

This lane exists to prove the celestial cache concept and develop its cache
strategies. During candidate work:

- do not create or run an experimental `tests/` tree, unit-test suite or
  file, unit-test framework dependency, or package test command;
- do not extend or rely on production unit tests copied into the sealed
  baseline/candidate;
- use focused self-verifying runners under
  `scripts/extraterrestrial/runners/`, each with one stated question, fixed
  inputs, measured invariants and negative controls, and an explicit
  accepted/rejected/failed/interrupted conclusion; and
- retain every qualifying execution through the immutable run protocol
  below.

These runners are scenario-level concept proofs, not a regression suite under
another name. Syntax, type, build, containment, fingerprint, CPU/GPU parity,
and browser checks remain available when they directly support a proof.
Missing unit tests are not a Stage 12.0-12.9 gap. Unit and regression-test
design is deferred until an accepted candidate reaches explicit production
promotion and hardening.

## Progressive Experimental Goals

Work through these goals in order. A goal closes only when its success
condition is recorded by an accepted immutable proof run; a rejected or
failed run informs the next attempt but does not close the goal. Goal labels
are progress markers, not run numbers.

| Goal | Objective | Success |
| --- | --- | --- |
| `G0` / 12.0 — complete | Establish the isolated lane and freeze the smallest supported contracts. | Accepted by immutable run `000002-g0-boundary-contract-proof`: the baseline is sealed, the candidate starts identical, containment holds, decisions are recorded, and the contract proof accepts the supported Sun/star fixtures and contracts while rejecting prohibited inputs. |
| `G1` / 12.1 — complete | Prove geometry-owned celestial placement and cache coordinates. | Accepted by immutable run `000008-g1-geometry-transform-proof`: geography, time, altitude, horizon, star directions, and Sun support produce deterministic query packets and stencils without camera state entering field identity. |
| `G2` / 12.2 — complete | Prove aggregate generation identity and lifecycle with synthetic payloads. | Accepted by immutable run `000009-g2-generation-lifecycle-proof`: complete generations publish atomically, exact requests reuse, failures and supersession preserve the active generation, and replacement/disposal release owned resources correctly. |
| `G3` / 12.3 — complete | Prove the transported CPU star cache. | Accepted by immutable run `000017-g3-cpu-star-transport-proof`: cached 15-channel point irradiance meets independent direct transport at nodes and declared interpolation probes, is exact zero below the horizon, and preserves per-star plus aggregate values. |
| `G4` / 12.4 — complete | Prove derived CPU Sun-disk transport data. | Accepted by immutable run `000024-g4-cpu-sun-disk-transport-proof`: shared-Sun 15-channel extended radiance meets direct transport at nodes and declared interpolation probes; full/partial/empty support remains geometry-owned and blocked/out-of-support samples are exact zero. |
| `G5` / 12.5 — complete | Prove CPU rasterization and spectral composition. | Accepted by immutable run `000025-g5-ray-probe-frame-evaluator-proof`: ray-probe-selected sample rays and visibility produce celestial radiance, retain path radiance, and compose pre-display radiance exactly once. |
| `G6a` / 12.6 — complete | Prove the primary celestial-cache/source interface and fragment assembly for the spherical distant Sun. | Accepted by immutable run `000027-g6a-primary-celestial-cache-proof`: the independent Sun returns a serializable uniform-radiance fragment; geometry owns source slots and assembly; `sampleLight()` preserves clear/partial/empty classifications and exact zero. Flat north-polar azimuthal-equidistant mapping is designed against the same interface but separately qualified later. |
| `G6b` / 12.6 — complete | Select and prove a viable GPU representation strategy over the accepted G6a interface. | Accepted by immutable run `000028-g6b-r32f-representation-proof`: the primary cache uses standard scalar `R32F` direction/position/wavelength array layout with one layer per native channel and binary32 indexed-readback parity. |
| `G6c` / 12.6 — complete | Construct, publish, and query the selected primary cache GPU resource. | Accepted by immutable run `000030-g6c-gpu-cache-render-proof`: source radiometry, geometry-owned `(h,u)` coordinates, and the canonical atmosphere GLSL module assemble one cache-render pass that constructs an 11 x 13 x 15 `R32F` field in real headless WebGL2. Exact-node CPU/GPU error is `3.7420860638829985e-7`; the runtime binding is distinct, lookup uses explicit geometry stencils, and an injected allocation failure preserves the active generation. Direct upload of CPU-computed final transported fields is excluded. |
| `G7` / 12.7 — complete, distant-Sun scope | Prove live GPU consumption. | Accepted by immutable run `000046-g7-live-gpu-consumption-proof`: real WebGL2 assembles cache lookup, live raster, and pre-display composition; four reconstructed sub-pixel Sun rays read matching live scene-hit texels. Clear output has full and partial disk coverage, and an all-blocked scene is exact zero without a cache rebuild. GPU star projection is deferred. |
| `G8` / 12.8 — complete, distant-Sun scope | Qualify the selected cache strategy. | Accepted by immutable run `000047-g8-distant-sun-qualification`: the declared Chrome-headless WebGL2/SwiftShader contract passes exact-node, memory, build-time, live-frame, exact-reuse, failure-preservation, repeated-disposal, and fresh-backend rehydration budgets. GPU stars and application-level context-loss handling remain outside this scope. |
| Pre-G9 completion track — active | Complete deferred visible/runtime capability work. | Visual evidence is accepted by `000048-g7-visual-capture-proof`; normal facade/ShaderBuilder/EffectComposer installation is accepted by `000064-g7-three-atmosphere-integration`; replacement/rebuild is accepted by `000144-pre-g9-celestial-replacement-runtime-proof`; and the real 500-star runtime raster, scene-hit suppression, and off-frame response are accepted by `000152-pre-g9-stellar-live-raster-proof`. The former nearest-template B mismatch measured by `000162` is resolved by the bracketed B/V policy accepted by `000163` and normal source-materialization requalification `000164`. HDR sky-derived exposure is now implemented and exercised by `000169`, but its full bright/dark, source-exclusion, lifecycle, and calibrated-bounds qualification remains open, as do live celestial transforms/placement refresh and application-level context-loss recovery. Flat/dome and finite-body/Moon work retain their own adapter/object designs and evidence. |
| `G9` / 12.9 — blocked pending completion track | Close the experimental claim. | One tracked record identifies all required immutable runs, candidate delta, reproduction data, accepted claims, and exclusions only after the user-required completion track is accepted. |

## Accepted G6c Checkpoint

- Candidate-only implementation: `PrimaryCelestialGpuPlan`,
  `PrimaryCelestialGpuCache`, and `PrimaryCelestialGpuCacheController`, with
  source, geometry, and atmosphere cache-build shader modules and a distinct
  `cache.primaryCelestialRadiance` runtime binding.
- Accepted immutable run: `000030-g6c-gpu-cache-render-proof`, 7/7
  assertions, terminal artifact-set SHA-256
  `5f6ee01b02e1a26fbc9a62e783b87223680701bc25dfb42c36e73d3bbfabd350`.
- A real Chrome headless WebGL2 backend constructed one 11 x 13 x 15 scalar
  `R32F` array field through one cache-render pass and fifteen layer
  submissions. All 2,145 exact nodes were selected-read back; maximum error
  against the CPU direct-transport oracle was `3.7420860638829985e-7`.
- The browser proof validates a distinct celestial binding, shader-side
  explicit `(u,h)` bilinear stencil lookup, and preservation of the published
  generation after an injected allocation failure. Terminal run `000029` is
  retained as a failed assertion-handling attempt. The ledger is allocated
  through `000030`; the next allocation is `000031`.
- Reproduce with
  `node scripts/extraterrestrial/runners/run-g6c-gpu-cache-render-proof.js`
  and verify with
  `npm --prefix scripts/extraterrestrial run verify:run -- 000030-g6c-gpu-cache-render-proof`.

## Accepted G7 Checkpoint

- Candidate-only implementation adds `sampleCelestialCache`,
  `evaluateCelestialRadiance`, and `composeSpectralRadiance` assembly order;
  distinct `celestialRadiance` and `preDisplayRadiance` state; spherical live
  `(h,u)` stencil resolution; and a primary distant-Sun consumer over the
  published `cache.primaryCelestialRadiance` resource.
- Accepted immutable run: `000046-g7-live-gpu-consumption-proof`, 6/6
  assertions, terminal artifact-set SHA-256
  `4fa84cb03e315647369b210114d47f0ce5169b9f1aac5d0337e3f4600e42befe`.
- Chrome headless WebGL2 compiled the assembled shader and rendered 172
  nonzero clear pixels, including 24 partial-coverage disk pixels. Replacing
  only the live scene-hit texture with an all-blocked texture produced exact
  zero, proving that visibility is live and not cached with the field.
- The consumer reconstructs four sub-pixel physical rays and applies the
  same geometry-owned cache stencil to each accepted Sun sample. It is a
  distant-Sun proof only: GPU star projection/off-frame response, live
  placement refresh, full facade integration, and broad G8 qualification
  remain open. Terminal runs `000031` through `000045` are retained failed
  diagnostic attempts; the next allocation is `000047`.
- Reproduce with
  `node scripts/extraterrestrial/runners/run-g7-live-gpu-consumption-proof.js`
  and verify with
  `npm --prefix scripts/extraterrestrial run verify:run -- 000046-g7-live-gpu-consumption-proof`.

## Accepted G8 Checkpoint

- Qualification contract:
  [G8 distant-Sun qualification contract](../../../scripts/extraterrestrial/decisions/g8-distant-sun-qualification-contract-v1.json).
  It fixes Chrome headless WebGL2/ANGLE SwiftShader, the 11 x 13 x 15 R32F
  layout, resource ceilings, 5 s initial-build and 1 s live-two-frame limits,
  and the distant-Sun-only claim boundary.
- Accepted immutable run: `000047-g8-distant-sun-qualification`, 8/8
  assertions, terminal artifact-set SHA-256
  `1e81faf4d0d61878900018000a2d8db60adfb72734bfd7075f806bd7fbbf4370`.
- Measured values: 10 ms initial render-build, 20 ms live two-frame execution,
  8,580 B resident and 8,736 B peak tracked storage, and selected exact-node
  error `2.8011093547655602e-9`. Exact repeat requests reuse the active
  generation; injected failure preserves it; repeated disposal rejects retired
  use; a newly created WebGL2 backend deterministically rehydrates the field.
- This is not an application-level context-loss handler or GPU-star
  qualification. The next allocation is `000048`; G9 must close only the
  supported distant-Sun evidence and exclusions.
- Reproduce with
  `node scripts/extraterrestrial/runners/run-g8-distant-sun-qualification.js`
  and verify with
  `npm --prefix scripts/extraterrestrial run verify:run -- 000047-g8-distant-sun-qualification`.

## Pre-G9 Completion Track

The previously accepted G7/G8 Sun-only evidence is necessary but insufficient
for topic closure. Visual evidence is now accepted by immutable run
`000048-g7-visual-capture-proof`, with terminal artifact-set SHA-256
`5cc4d352e68fbab44ff1ce9078023e5ad4672a93f7d9ac4241a51d1934087b04`.
Supplemental visual run `000059-g7-atmosphere-preview` retains a legible
display-path Sun disk over a limited single-scattering atmospheric context,
with terminal artifact-set SHA-256
`f9ddb1d5d0a040a4cd7441cf0d731d17fc4253fa7b69bcea7983921cf679b34e`.
It is an exposure-scaled visual aid, not the normal cumulative-cache transport
path or the deferred ShaderBuilder/shader-handle integration.
Normal runtime installation is now accepted by immutable run
`000064-g7-three-atmosphere-integration`, terminal artifact-set SHA-256
`7eb007d502defa42e2866b3b59363ba7f55175ea94e2126690441eef6d53a522`.
It proves the application-owned `CelestialRuntimeParticipant`, geometry-owned
primary celestial GPU controller, normal atmospheric cumulative cache, and
live celestial cache bind through `Algorithm32.setupShader()` into one real
Three `EffectComposer` pass. The neutral-daylight image is a scenario input,
not an alternative display path. Celestial replacement/rebuild is accepted by
immutable run `000144-pre-g9-celestial-replacement-runtime-proof`: a real
ShaderBuilder/shader-handle rebuild publishes a new primary field and shader
binding, injected staging allocation failure preserves the active configuration
and installed pass, and retirement releases both primary fields at their
respective lifecycle boundaries.
Superseding immutable run `000079-g7-three-subjective-globe-scenes` retains
two renderer-scene-input contexts: San Jose / June sunset and Union Glacier /
December solar noon. Both use the normal cumulative atmosphere and live Sun
cache over the `SphericalEarthGeometry` observer-local spherical ground
endpoint, candidate-native solar spectrum, the native disk radius, and
order-4 scattering. Both scenes use the fixture-default 78-degree vertical
FOV and canonical display exposure. Camera and material remain presentation
inputs, so these are visual aids only, not ephemeris, geography, or
observational validation.
Do not begin G9 closure until all remaining work below is implemented and
accepted through fresh immutable evidence:

**Catalog-coordinate checkpoint:** immutable run
`000109-pre-g9-bright-star-catalog-contract-proof` accepts the first real
source roster under `scripts/extraterrestrial/catalogs/`: the checked-in
CDS/VizieR BSC V/50 TSV yields 9,096 valid stars and deterministically selects
the 500 brightest by V magnitude then HR identifier. It proves their
`celestial-rh-v1` J2000 coordinate conversion, source-definition/placement
adapter, and Unix-epoch spherical overhead invariant. The catalog contains no
native-15 calibrated stellar spectrum; its V-band values are relative-only and
the proof does not constitute star cache construction or GPU rendering.

**Stellar celestial source checkpoint:** accepted immutable run
`000112-pre-g9-stellar-celestial-source-proof` accepts the candidate-only
`StellarCelestialSource` over that roster. It is now the public owner of
catalog identity, static point definitions, and epoch-bound canonical
placements; the celestial runtime participant exposes it in an explicit
point-source slot and spherical geometry consumes only those outputs. Live
rotation changes placements without changing its catalog identity. The source
intentionally exposes no cache fragment and infers no native-15 radiometry
from catalog photometry, so star transport/raster work remains open.

**Next implementation step — stellar photometry and bounded transport cache:**
materialize source-owned native-15 apparent irradiance packets from the BSC
V magnitude, flux-calibrated stellar templates, and Johnson B/V calibration;
then construct the 500-member bounded point cache through the normal
geometry-owned R32F cache path. No stellar luminosity or inverse-square
reconstruction is permitted. The selected 512-capacity 32-by-16 tile layout
keeps member lookup portable; point raster/visibility stays deferred.
Packet materialization is now accepted by immutable run
`000113-pre-g9-stellar-photometry-proof`: it imports the pinned BSC, Pickles,
and SVO inputs, produces all 500 source-owned native-15 apparent irradiance
packets, and reconstructs their declared Johnson V magnitudes. The next active
substep was geometry-packed 512-capacity CPU/GPU cache construction and
qualification. Its CPU/cache-plan portion is accepted by immutable run
`000122-pre-g9-stellar-tiled-cache-cpu-proof`: the real 500-member fields are
packed into the 32-by-16, 352-by-208-by-15 layout; inactive tiles are exact
zero; and live placements leave static identity unchanged. Immutable run
`000142-pre-g9-stellar-tiled-cache-proof` accepts real headless-WebGL2
construction through the normal `TiledStarPointSetGpuCacheController`: one
352-by-208-by-15 `R32F` field is rendered in fifteen wavelength submissions,
selected scalar readback remains within binary32 tolerance, unused tiles are
zero, and injected allocation failure preserves the active generation. The
earlier browser timeouts were caused by the proof server returning
`browser/index.html` as `application/octet-stream`; Chrome fetched it as a
download and never ran the module. Mapping `.html` to `text/html` restores the
normal browser path. The shared-transmittance implementation used for the
catalog-scale field is independently requalified by immutable run
`000123-g3-cpu-star-transport-proof`, which preserves the original direct
transport and interpolation conclusions.

**Stellar live-raster checkpoint:** immutable run
`000152-pre-g9-stellar-live-raster-proof` accepts normal
`Algorithm32`/`ShaderBuilder`/`EffectComposer` consumption of the complete
500-member `352 x 208 x 15` tiled `R32F` field. The first point response is
the exact spherical footprint containing the source direction: its normalized
weight is one in that pixel and zero elsewhere, so it contributes transported
irradiance divided once by that pixel's exact solid angle. Renderer-produced
scene-hit visibility at that same footprint suppresses the contribution before
response; an opposite camera retains no target response and does not
renormalize it at the frame boundary. The initial catalog directions are the
canonical epoch-zero directions; live body/time placement remains separate.
Immutable run `000153-g7-three-atmosphere-integration` requalifies the normal
Sun-only composer after celestial accumulation changed from assignment to
additive composition for coexistence with the stellar layer.

**Photometry shape audit:** immutable measurement run
`000162-stellar-photometry-b-band-reconstruction-experiment` independently
integrates each completed native-15 packet through the pinned Johnson B
energy-counter response and compares it to the catalog target
`B = V + (B-V)`. V reconstruction remains exact to `1e-10` mag, but the
former nearest-template selection has median absolute B residual `0.03148`
mag, p95 `0.15099` mag, and worst residual `0.97205` mag. The candidate now
uses a nonnegative blend of the two Pickles shapes bracketing the measured B/V
flux ratio, V-normalizes that blend, and scales it to catalog V. Accepted
immutable run `000163-stellar-photometry-b-band-reconstruction-experiment`
independently reconstructs both B and V for all 500 members within
`8.881784197001252e-16` mag. Immutable run
`000164-pre-g9-stellar-photometry-proof` requalifies normal source packet
materialization and provenance for this `v2` bracketed policy. The B/V source
radiometry is now justified; the still-open star-visibility work is the HDR
display/exposure path rather than source packet scale or two-band shape.
Immutable run `000165-subjective-globe-one-hour-after-sunset-stars-render`
reconfirms that conclusion in the normal renderer: the B/V-qualified stellar
layer is assembled and active in the physically dark one-hour-after-sunset
scene, but no sky-star pixels survive the fixed daylight display conversion.

The candidate now has a Geometry-provided upper-sky quadrature and Color-owned
`R32F` HDR illuminance meter; retained run `000169` measures the one-hour-after
sunset sky and resolves stars through one uniform exposure. Retained run
`000170` removes the harness-owned RGB ground override and installs Geometry's
default Lambert endpoint, which is correctly black before ambient lighting is
added. Ambient scene-light ownership and calibration remain the next work.

Retained run `000172` supplies that first ambient bridge: the scene refreshes
the Color-owned sky probe before capture, reads its one scalar for ordinary
Three lighting, and applies `E_v / 10,240 lux` to a neutral ambient light on
the Geometry endpoint. The one-hour-after-sunset reading is
`0.0053322226740419865 lux`, producing intensity
`5.2072487051191278e-7`; the ground stays dark and the stellar sky remains
visible. It is not yet a fully radiometric endpoint-lighting qualification.

Run `000173` establishes the next HDR correction: its Sun-facing sunset meter
is `1,436.133056640625 lux`, and the prototype's direct reciprocal display
gain of 7.13 makes the sky visibly too bright. The probe is therefore now
defined as local visual brightness, which must drive both ambient lighting and
a separately calibrated Color curve; it is not itself an inverse-exposure
command.

The former CIE-threshold curve is superseded: its gain was exactly `1` for
both the `1,436 lux` sunset and the `185.739 lux` twenty-minute twilight, so
it was not a continuous exposure calculation. Candidate Color now derives one
global photographic exposure from the same sky meter,
`min((0.18 * pi / K) / max(E_v, E_min), gain_max)`, where `K` is the retained
Figure-1 coefficient. The derived reference is about `1,931 lux`, and no
source-, time-, star-, or per-pixel-specific gain is introduced. Retained run
`000180` confirms the anti-solar twenty-minute scene is now visibly exposed
as twilight; `000181` retains the one-hour stellar scene. The former run
`000182` records the rejected attempt to use Color's display reference as the
Three ambient-light scale: it made the ground neon-bright because that scale
algebraically cancels display adaptation. The current temporary Three bridge
therefore continues to use the same physical meter but its distinct
`E_v / 10,240` daylight-scene calibration, pending radiometric endpoint
shading.

Candidate Color uses the standard Figure-1 exponential mapping after its CIE
projection, with one global sky-meter adaptation gain for dark scenes.
Immutable run `000187-subjective-globe-twenty-minutes-after-sunset-
opposite-upward-stars-render` first accepted the sampled `RGBA32F`
photopic-plus-linear-RGB irradiance path. The temporary normalized
lux-to-intensity bridge is now removed: Geometry passes that sampled HDR RGB
irradiance directly to Three's Lambert ambient input with unit intensity,
Three applies its `1 / pi` BRDF factor, and the normal half-float composer
buffer preserves it to Color. Color composes HDR scene-linear RGB directly,
then uses its probe-derived global adaptation gain before the final display
map. The gain derives `E_ref = 0.18 * pi / K`, is clamped from `1` to
`16,384` (14 stops), and never dims daylight. Immutable `000194` restores visible colored
twenty-minute twilight from the same `185.739 lux` physical sky sample;
`000195` retains the matching sunset bright-side check. Analytic Lambert
proportionality remains to be qualified.
Run `000188-subjective-globe-twenty-minutes-after-sunset-sun-facing-stars-
render` retains the requested return to the Sun-facing fixture camera and its
original 5-degree elevation at the same twenty-minute time; with fixed Color
and the Sun 3.35 degrees below the horizon it remains near-black. Run
`000189-subjective-globe-sunset-sun-facing-stars-render` retains the matching
exact-sunset view, where the warm horizon and small Sun disk are present.
Visual-only run `000206-subjective-globe-san-jose-solar-noon-render` adds the
matching San Jose apparent-solar-noon context through the unchanged normal
spherical/distant cache path. Its source direction is derived in the harness
from the same NOAA fractional-year declination/equation-of-time model used by
`FlatSynchronizer`; the 640 x 400 south-facing, 45-degree-elevation view
records `15,329.3046875` lux from Geometry's sky meter. It is a reusable
daylight context capture, not ephemeris or transport qualification.
Superseding visual-only run
`000207-subjective-globe-san-jose-solar-noon-ground-render` keeps that same
source and meter but restores the fixture's 5-degree view elevation, placing
the Geometry-owned spherical ground and horizon in the lower frame.
Run `000208-subjective-globe-san-jose-solar-noon-distant-boxes-render` adds
the 60 km cyan and 250 km orange distant review boxes as ordinary Lambert
scene meshes. Their tangent east/north locations are raised by the spherical
surface drop before scene assembly; the camera and scene-depth extent are
extended to retain the 250 km object. This remains visual context only.
The symmetric daytime adaptation experiment in `000209` is retained as a
rejected visual direction: applying the sky-meter ratio directly made the noon
scene far too dark. Superseding run
`000210-subjective-globe-san-jose-solar-noon-distant-boxes-render` restores
the standard Figure-1 exponential display curve while retaining the bounded
dark-scene meter lift. It restores the expected pale horizon and blue overhead
gradient without changing atmospheric cache construction or transport.
Run `000211-subjective-globe-san-jose-three-hours-after-sunset-distant-boxes-
render` retains the same ground-and-box composition at a NOAA-derived Sun
elevation of approximately `-24.56` degrees. Its upper-sky meter is the known
dark-end exact-zero floor, and only four pixels survive the present display
path; it is a retained dark-scene capture, not star-visibility evidence.
The bounded dark-adaptation revision retains the `1` daylight floor and raises
only the maximum gain to `16,384`. Matched normal-renderer captures
`000212-subjective-globe-san-jose-solar-noon-distant-boxes-render` and
`000213-subjective-globe-san-jose-sunset-distant-boxes-render` reproduce the
daylight and sunset compositions without applying dark lift. Run
`000214-subjective-globe-san-jose-three-hours-after-sunset-distant-boxes-render`
uses the same ground, boxes, camera, atmosphere, and real 500-star cache; at
the meter's current zero floor it records 49 nonblack stellar pixels. This is
a bounded shared Color response, not a time-, source-, or star-specific rule.

Runs `000178` and `000179` still establish that the absent twenty-minute
points are neither a missing stellar layer nor a coarse output footprint. The
reviewed twilight limiting-magnitude approximation is a calibration/reference
check for the rendered result, not a new star-specific raster gate: the
established design remains one local atmospheric-brightness measurement that
drives Color exposure and Geometry endpoint ambient light. Star visibility
must remain the consequence of transported stellar radiance competing with
the scattered atmospheric sky under those two shared brightness-driven
responses. Calibration and lifecycle qualification remain open.

Immutable run `000185-twilight-local-brightness-calibration` now establishes
the first six-point, atmospheric-only meter baseline at solar depressions
`0, 3, 6, 9, 12, 15` degrees. It records `1421.196, 252.268, 7.986,
0.03978, 0, 0 lux` and the corresponding shared Color-exposure/Geometry-
ambient responses. The exact zero results at 12 and 15 degrees are a dark-end
meter/result floor, not a physical black-sky conclusion. Resolve that floor
before fitting either shared response to the external limiting-magnitude
target; do not introduce a time, magnitude, or star-specific visibility rule.

Immutable run `000186-twilight-sky-probe-range-diagnostic` locates the floor
upstream of the meter: all 32 geometry-provided atmospheric sample rays have
positive log-luminance at 11 degrees, but all 32 are already exact zero at 12
and 15 degrees. This is an atmospheric dark-twilight path-radiance/support
diagnosis, not an HDR reduction, Color-exposure, or Geometry-ambient tuning
failure. The one-hour-after-sunset stellar result remains valid within the
working range; broader calibrated twilight behavior requires this upstream
transport issue to be resolved first.

**Spherical twilight cache-coordinate checkpoint:** the normal distant-Sun
scattering cache is currently a reduced reference-column field indexed by
altitude and the source-relative W27 view direction. It does not retain the
actual sample's local spherical Sun elevation. Accepted immutable run
`000205-subjective-globe-twenty-minutes-after-sunset-actual-point-j1-control-render`
is a normal-renderer, order-1 diagnostic that bypasses only this lookup and
computes ground visibility plus Sun-path transmittance at every actual
spherical ray point. At the retained San Jose 20-minute Sun-facing fixture it
records `130.01573181152344` lux and a narrow warm horizon; the accepted
reduced-cache scene `000194` records `185.73931884765625` lux and a broader
brown transition. The diagnostic proves the current `(h, W27)` lookup is not
equivalent to spherical twilight transport. It does not accept the direct
control as a replacement cache, nor does it qualify higher-order scattering.
The active numerical follow-up is now owned by the
[solar-zenith cache design](../algorithm32/cache/solar-zenith-cache-design.md).
Accepted run `000497` strengthens the diagnosis by closing `97.20795%` of the
focused center/flank deficit with actual-point direct first-order radiance.
The design now selects one point-local cumulative-density cache per scene,
addressed by altitude, actual local solar zenith, and complete local
source-relative outgoing direction. Its
[distant-Sun plan](../algorithm32/cache/distant-sun-solar-zenith-cache-plan.md)
freezes scene support, builds the packed altitude/zenith inventory, reuses the
actual-point N4 solver to accumulate selected local rows, compiles Native15,
and makes the ordinary Algorithm32 samples query actual `mu_s`. Geometry keeps
its ray-length contract. It does not select a common local/distant field or
transformed-source interface. The existing reduced cache remains unchanged
before complete cache-render, higher-order, live, lifecycle, and HDR
requalification. Existing Bruneton scores remain historical to the reduced
cache.

Ambient lighting now takes the same sampling path: Geometry consumes sampled
sky linear-RGB diffuse irradiance at endpoint normals, while the companion
photopic scalar remains available for local-brightness work. The Three ambient
input is direct HDR RGB irradiance—not a white `E_v / 10,240` substitute—and
the offscreen composer buffer remains half-float linear sRGB until Color's
final mapping. Flat32's elevation-driven ambient floor is not a valid model
for this work. Stage 12 makes no further implementation or qualification
claim. The following retained handoff splits numerical field ownership to the
[solar-zenith cache design](../algorithm32/cache/solar-zenith-cache-design.md)
and production API sequencing to the
[production follow-up plan](promotion-plan.md#production-follow-up-backlog).

1. **Distant-Sun solar-zenith field:** qualify the point-local spherical scene
   cache under its canonical design and contained plan. A later production
   port may define live distant-source transform ingress, but finite/local
   coordinates and any common local/far API require a separate design after
   distant acceptance. Retain the current `(h, W27)` cache unchanged, then
   separately requalify direct/higher-order transport, rendering, live lookup,
   HDR metering, endpoint irradiance, lifecycle, and regenerated reports if a
   production port is authorized.
2. **Live placement and transforms:** retain celestial-source transform ingress
   as a later production/celestial-integration requirement, not a promise made
   by the distant-Sun numerical design. Placement/geography/body orientation
   refresh only the live query/transform state, never the physical field unless
   its static invalidation inputs change. Directional star catalogs use the shared
   live `Rz(-thetaEarth(t))` pole rotation before spherical-shell or flat-dome
   presentation placement. The base map uses the Unix epoch with longitude zero
   at canonical `+X`/dome azimuth zero; later calibration is an explicit
   alignment offset. Equal celestial and terrestrial latitude/longitude are
   the overhead alignment invariant at that epoch.
   The initial Flat implementation uses no separate calibration: it computes
   the same angle at the same simulator time, applies the same
   `Rz(-thetaEarth(t))`, and then projects onto its dome. A Flat-specific
   observed-sky offset is optional later work, not an initial dependency.
3. **Application context loss/recovery:** qualify actual renderer context loss
   and restoration through the normal runtime participant, not merely fresh
   backend rehydration.
4. **Flat/local finite Sun:** implement the separately planned
   `flat-local-finite-sun-v1` source/geometry/cache family. Its
   simulator-configured uniform surface radiance and physical radius are the
   only radiometric/scale authority; finite-disk illumination derives from the
   same radiance and visible solid angle. Qualify source-relative cache
   construction, live horizontal orbit transforms, finite-body raster and
   visibility, static invalidation, and normal runtime installation.

   Initial mechanics and cache-render evidence is accepted: `000080` proves
   the source-owned radius/radiance, solid-angle illumination, and finite-body
   support contract; `000082` proves real WebGL2 construction and readback of
   the family-specific `1 x 1 x 15` `R32F` source-radiance cache, its live
   body/atmosphere shader contribution, and failure preservation. Full normal
   `ShaderBuilder` installation and mutable center-binding refresh are accepted
   by `000087`, which installs the combined normal cumulative-cache and finite
   disk pass through `EffectComposer` and updates the live center to 100 km
   without replacing its celestial cache generation. `000092` accepts 512 x
   512 clear, fully scene-blocked, and partial disk visibility over the
   `FlatEarthGeometry`-owned ground/horizon endpoint through renderer-produced
   depth and hit inputs. It uses the accepted Flat32 observer-centered dome
   (100 km apex; 1,926,774 m maximum view-ray extent), which removes the
   planar white-horizon discontinuity. Static-invalidation qualification
   remains open.

   Accepted runs `000100-union-glacier-flat-0-render`,
   `000101-union-glacier-flat-180-render`, and
   `000106-union-glacier-flat-90-render`, and
   `000107-union-glacier-flat-45-render` retain the corrected boxed Union
   Glacier contexts: each uses the fixed 720 x 414, 70-degree horizon-facing
   camera, Flat32 lighting, and six review boxes. Flat 0 fixes the source
   center at `[0, 6,283,427.593, 4,828,032] m`, 37.538 degrees above frame;
   Flat 45 fixes it at `[-8,882,196.551, 9,962,553.551, 4,828,032] m`,
   19.886 degrees above the horizon and in frame;
   Flat 90 fixes it at `[-12,561,323.593, 18,844,750.419, 4,828,032] m`,
   12.034 degrees above the horizon and in frame; Flat 180 fixes it at
   `[-24,595.666, 31,412,707.264, 4,828,032] m`, 8.738 degrees above the
   horizon and in frame. Superseding run
   `000102-union-glacier-flat-180-render` makes the center a required
   geometry-owned live shader binding and records that the finite-disk uniform
   equals the selected Flat 180 atmospheric source center. It prevents a
   static celestial-cache default from leaving the disk at Flat 0 while the
   atmosphere has moved. These establish requested scene configurations, not
   geography, ephemeris, observational, or full visual-match evidence; warm
   Flat32 screenshot parity remains open.

Flat north-polar azimuthal-equidistant/dome mapping and finite extraterrestrial
objects (Sun transformable body extension and Moon) must be planned as their
own geometry/source capability families before implementation. Directional star
source data is fixed in the shared `celestial-rh-v1` latitude/longitude frame;
spherical shell and flat-dome positions are geometry-owned presentation
transforms, not source distance or cache data. The local Sun
is now fixed as a simulator-configured, source-owned finite uniform body with
physical radius and 15-channel surface radiance; the current Flat32 defaults
are 3,000 miles center height and a 16-mile radius. Geometry owns its live
center/distance/apparent-support transform, while direct illumination derives
from the same radiance over the visible disk solid angle, not a second
reference-distance or inverse-square scale. These remain program-close
prerequisites, but not implicit variations of the spherical distant-Sun cache.

## Immutable Run Records

Every experiment calculation, proof-runner execution, qualifying build,
browser/GPU run, render, evidence command, failed attempt, or interrupted
attempt receives a new run initialized before that work begins. The default
namespace is:

```text
tmp/extraterrestrial/runs/NNNNNN-descriptive-kebab-slug/
```

Its historical `000001` through `000585` directories are retired in the
verified
[pre-color-reset archive set](../../../archives/extraterrestrial-pre-color-reset-20260831/README.md).
Only the live allocator tombstone `.last-run-number = 000585` remains in the
default root, preventing reuse while keeping the archived directories out of
the working tree.

An owner-approved lane may declare a separate namespace below
`tmp/extraterrestrial/` when isolation from the large default ledger is itself
part of the lane contract. The active additional namespace is:

```text
color-reset:
  tmp/extraterrestrial/color-reset/runs/NNNNNN-descriptive-kebab-slug/
```

Each namespace owns an independent counter and allocation lock in its `runs`
root. All initialization, finalization, containment, derivation, and
immutability rules below apply unchanged. Because the same six-digit number may
exist in more than one namespace, every cross-run reference to a non-default
run records its namespace or complete contained path in addition to its run id.

Run identity rules:

- `NNNNNN` is six decimal digits, starts at `000001`, and is monotonic within
  its owning run namespace through `999999`.
- Allocate `1 + max(.last-run-number, greatest existing six-digit prefix)`
  while holding the exclusive `.run-allocation-lock`; update the counter
  atomically. Only the allocator may change these two control entries.
- Never fill a gap or reuse a number, even if a directory is missing. The run
  number is identity, not proof of stage order or acceptance.
- Normalize the requested slug with Unicode NFKD, remove combining marks,
  lowercase it, spell `*` as `star`, collapse each non-`[a-z0-9]` sequence to
  one hyphen, and trim hyphens. The result must be 1-96 characters, match
  `[a-z0-9]+(?:-[a-z0-9]+)*`, and describe purpose rather than outcome.
- Create the run directory exclusively. No manual numbering or nested
  numbered run directories are allowed.

The owning runner writes only inside its newly allocated directory. Before
physical calculation, candidate scoring, proof evaluation, browser launch, or
GPU work, it records `result.json`, `report.md`, `command.txt`, `inputs.json`,
`provenance.json`, `environment.json`, and `references/manifest.json`. It
finalizes exactly once as `accepted`, `rejected`, `failed`, or `interrupted`,
then writes `artifact-manifest.json` last over the terminal artifact set.

After terminal manifest creation, never modify, rename, delete, repair,
complete, reuse, or reopen the run. Preserve malformed, failed, interrupted,
and partial attempts as they are; every correction or unchanged retry gets
the next number.

The owner-approved pre-color-reset relocation is not deletion of evidence: a
live historical copy may leave its former directory only after complete
entry/SHA-256 verification and archive-set indexing under `archives/`. The ZIP
then becomes the immutable run location, its original repository-relative path
remains the restoration identity, and the archived entry may never be changed
or replaced. This exception does not apply to active color-reset runs.

## Normal Working Rules

- The [repository rules](../../../AGENTS.md) and
  [experiment-local rules](../../../scripts/extraterrestrial/AGENTS.md)
  remain authoritative; this topic narrows them and never relaxes them.
- Provisional code must preserve the selected architectural ownership.
  Sources own radiometry and celestial placement facts; geometry owns
  transforms, cache coordinates, and controller creation; atmosphere owns
  transport; the celestial cache owns generation identity, fields, lookup,
  publication, and disposal; raster/visibility owns live source resolution;
  and Color owns spectral-to-display conversion. Runners may orchestrate and
  observe these owners but may not absorb or replace them.
- Work only on the current plan stage and its observable conclusion. Passing
  code without that conclusion does not complete the stage.
- Preserve unrelated user changes and avoid destructive synchronization.
- Fail loudly on unsupported families, invalid inputs, containment escape,
  stale identity, or missing evidence. Do not introduce a silent fallback.
- Run checks proportionate to the change and record qualifying executions
  through the immutable run protocol.
- After a design decision, update the owning design. After implementation,
  replace stale current-state facts here and in the owning status document;
  keep chronology only in a designated log or immutable run.
- Generated output may be reused by later contained experiments for any
  experimental role. The sole reuse restriction is preservation of prior
  evidence: the source run and its artifacts remain closed, immutable, and
  intact, while copies and derivatives are written into a new run. Record the
  source, schema, provenance, hashes, and compatibility identities needed to
  qualify the downstream claim. Every evidence artifact must additionally
  retain an unbroken derivation record: identified parent artifacts, operation
  or equation, implementation/tool identity, material parameters, and result
  identity. These are evidence requirements, not reuse permission gates.
- Do not promote candidate code merely because a run is accepted. Production
  changes begin only at the explicit promotion stage and after reconciliation
  with then-current production.
