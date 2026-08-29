# Solar-Zenith Scene-Cache POC Plan

Status: historical observer-projected plausibility POC complete, current
through 2026-08-28. Its stored page representation is not the selected
successor contract. Accepted immutable run
`000509-san-jose-nautical-actual-point-cache-poc` contains the complete
Native15 page, contained page-only runtime consumption, and the unconditional
`640 x 400` render. This plan owns the operational sequence for the POC only. It
does not implement the selected point-local cache, begin the numbered
qualification plan, or claim physical accuracy.

Implementation belongs under
[`scripts/extraterrestrial/solar-zenith-cache/san-jose-nautical-cache-poc/`](../../../../scripts/extraterrestrial/solar-zenith-cache/san-jose-nautical-cache-poc/README.md).
The eventual runner belongs under the existing authorized runner root at
`scripts/extraterrestrial/solar-zenith-cache/runners/`. Every generated cache,
shader, bundle, log, readback, diagnostic, and render belongs to a new
immutable run below `tmp/extraterrestrial/runs/`.

The [solar-zenith cache design](solar-zenith-cache-design.md) remains the
physical authority. The
[long-form distant-Sun plan](distant-sun-solar-zenith-cache-plan.md) remains
the qualification plan. This document deliberately removes its validation,
resource-qualification, codec, paging, and production ceremonies from the
first-look implementation.

The owner subsequently selected one point-local cumulative-density cache per
scene, addressed by altitude, actual local solar zenith, and local
source-relative outgoing direction. The revised
[distant-Sun plan](distant-sun-solar-zenith-cache-plan.md) supersedes this
document for new implementation. This plan remains the canonical operational
record for runs `000502` through `000515`; its observer-ray projection,
validity mask, and added page-altitude diagnostics remain historical evidence.

## Objective

Produce one `640 x 400` render of the retained San Jose nautical-twilight
scene using a real scene-specific Native15 cumulative-density cache page
constructed from the complete actual-point distant-Sun recurrence through N4.

The result answers one informal question:

> Does the intended cache representation produce a plausible nautical-
> twilight horizon when actual-point solar-zenith state participates in every
> scattering order?

The image is written regardless of whether it looks plausible. No numerical
or appearance threshold can suppress the requested output.

## Fixed POC Scope

The first request uses the exact run-`000493` scene family:

- San Jose, observer height `1.7 m`;
- instant `2024-06-21T04:26:03.503Z`;
- solar elevation `-9.756817735470484 degrees`;
- sunset-facing camera at `5 degrees` elevation;
- `78 degrees` vertical field of view;
- `640 x 400` viewport;
- spherical Earth with `6,360 km` bottom and `6,420 km` top radii;
- retained 300-DU ozone-enabled atmosphere;
- reflection-completed Fibonacci-68 incoming quadrature;
- cubed-sphere W39 outgoing storage with `9,126` directions;
- Native48 altitude support;
- Native15 `R32F` spectral storage; and
- maximum scattering order N4.

W39 is deliberately POC-only. It preserves the outgoing domain of the
run-`000493` comparison image so the first zenith-aware result does not also
change visual angular resolution. The qualified successor plan returns to
the production W27 baseline; no measured evidence currently establishes that
W39 earns its roughly `2.09x` resident-size cost over W27.

The fixed machine-readable values and parent identities are owned by the
[lane contract](../../../../scripts/extraterrestrial/solar-zenith-cache/san-jose-nautical-cache-poc/lane-contract.json).

The POC excludes Bruneton comparison, a complete CPU oracle, formal error
gates, convergence qualification, compression, paging, animation, local Sun,
production integration, and a generalized deployment asset.

## Non-Negotiable Fidelity Boundary

The POC is narrow in scenes and evidence, not in transport semantics. It must
be an accurate implementation of the proposed scene-page cache path:

1. construct actual-point J1 through J4;
2. change radius, local solar zenith, and local direction along every
   transported ray;
3. split integration at Earth, atmosphere, and source-visibility events;
4. feed only the preceding pure transported order into the next order;
5. store the projected cumulative local scattering density `C4` in the scene
   page; and
6. consume that density through ordinary Algorithm32 camera-ray integration.

The following shortcuts are prohibited:

- using the current receiver-column C4 as J2--J4 input;
- adding actual-point J1 outside the cache;
- feeding cumulative density back into recurrence;
- rendering directly from temporary solver fields instead of the scene page;
- replacing local density with completed whole-sky radiance; or
- repairing the result in Color or exposure.

Numerical resolution remains provisional. The first POC may be slow or
visually imperfect, but its field meanings and recurrence must match the
intended cache.

## Selected POC Representation

### Temporary construction fields

For one wavelength at a time, the solver logically evaluates:

```text
Jk(radius, localSolarZenith, sourceRelativeOutgoingDirection)
Lk(radius, localSolarZenith, incomingDirection)
```

J1 need not be materialized over the complete W39-by-solar-zenith working
domain. The final scene-page J1 values can be evaluated directly at each
requested actual point because the higher-order recurrence is seeded by
direct L1, not by transported stored J1. This preserves the same J1 semantic
while avoiding both one large temporary field and interpolation of the sharp
direct terminator into the scene page. J2--J4 remain complete broad working
fields because their transport feeds later orders.

The first construction grid uses the fixed Native48 altitude domain, W39 for
J fields, F68 for L fields, and provisional complete solar-zenith support.
The initial solar-zenith control is the existing 180 one-degree cell-center
family from `0.5` through `179.5 degrees`. No scene culling is applied to the
temporary N4 solve because higher-order transport closure has not been proven
for the culled subset.

Solar-zenith interpolation and analytic source visibility remain separate.
The point-Sun visibility branch is evaluated from actual geometry; it is not
made continuous by interpolating across an Earth-shadow event.

### Durable scene page

Each output page stores:

```text
C4Scene(
    Native48 altitude,
    canonical observer-ray W39 direction,
    Native15 wavelength
) -> cumulative local spectral scattering density
```

Scene Sun zenith, observer position and height, canonical-frame convention,
and transport identity belong to page identity. Sun azimuth is normalized by
the canonical observer-up/Sun transform. The first POC has one page and
therefore performs no page interpolation.

The logical payload is:

```text
48 * 9,126 * 15 * 4 bytes = 26,282,880 bytes
```

or about `25.065 MiB`, before metadata or physical padding.

## Builder Architecture

The builder accepts one transport specification and an ordered non-empty list
of page requests:

```text
buildSceneCaches({
    transportSpec,
    scenePageRequests,
    outputWriter
})
```

`transportSpec` owns the atmosphere, planet, source model, ground, recurrence,
domains, wavelength basis, numerical controls, precision, and solver identity.
Each scene request owns observer state, Sun state, canonical transform, page
identity, and output name.

The first POC passes one San Jose request. The interface must also support:

- adding one new scene page in a later invocation;
- projecting several compatible pages from each resident wavelength field;
- writing every page independently;
- loading a page without loading a collection; and
- writing a later immutable collection manifest that references compatible
  page artifacts from multiple preserved runs.

Projection is downstream from recurrence. Solver passes must not know which
camera or scene pages will consume their pure-order fields.

### Compatibility family

Pages can share a collection or become interpolation neighbors only when all
of these match:

- planet, atmosphere, ozone, aerosol, and ground identities;
- distant-source model, source spectrum, and normalization;
- maximum order and pure-order recurrence;
- construction quadrature and integration controls;
- altitude, incoming, outgoing, and spectral domains;
- page coordinate mapping and canonical-frame convention;
- cumulative-density semantic and units; and
- scalar precision, packing, and schema.

A scene label is not a compatibility identity. Changing one item creates a
new family rather than silently mixing pages.

### Incremental artifacts

Every scene page is independently hashed and identified. An incremental run
never modifies an earlier page or manifest. It may:

1. recompute the compatible temporary field and emit only new pages; or
2. consume a separately preserved compatible solver artifact whose complete
   derivation and content identity are recorded.

The first approach is sufficient for the POC because offline time is not the
governing constraint. Universal-field persistence is optional infrastructure,
not a prerequisite.

## Offline N4 Schedule

A full W39 J field for one wavelength over `48 * 180 * 9,126` states is about
`300.78 MiB` in scalar `R32F`. This is an offline working-set fact, not a cache
size, resource target, acceptance gate, or representation-selection input.
Operational construction memory is not a POC constraint.

Projection is linear, so the builder directly evaluates page J1 and projects
and accumulates each later pure order into the much smaller scene-page output
before releasing that order. This schedule keeps pure-order ownership explicit
and writes independently useful scene pages; it is not required as a memory
optimization. An implementation may retain more simultaneous working fields
when that makes the solver simpler or easier to inspect.

```text
for wavelength in Native15:
    initialize each requested scene-page wavelength accumulator to zero

    evaluateAndAccumulateDirectJ1AtActualPagePoints(requestedPages)

    L1 = buildDirectIncomingRadiance()

    J2 = scatter(L1)
    projectAndAccumulate(J2, requestedPages)
    L2 = transportActualPoint(J2)
    release J2 and L1

    J3 = scatter(L2)
    projectAndAccumulate(J3, requestedPages)
    L3 = transportActualPoint(J3)
    release J3 and L2

    J4 = scatter(L3)
    projectAndAccumulate(J4, requestedPages)
    release J4 and L3

    write each requested scene-page wavelength result
```

This is exactly:

```text
project(J1 + J2 + J3 + J4)
    = project(J1) + project(J2) + project(J3) + project(J4)
```

The displayed schedule can avoid retaining a universal cumulative J field,
but that saving has no decision weight in this POC. The builder may retain a
universal cumulative field, pure-order fields, source/destination ping-pong,
or inspection readbacks when useful. None of those temporary resources become
runtime cache payload merely because the offline compiler allocated them.

## Scene-Page Projection

For each canonical observer-ray W39 direction and Native48 altitude:

1. construct the ray from the fixed observer;
2. solve its valid forward intersection with the requested altitude shell;
3. reject ground-occluded or nonexistent branch states explicitly;
4. compute the actual point, radius, and local radial frame;
5. compute actual-point local solar zenith;
6. transform the observer ray into the solver's local source-relative outgoing
   coordinates;
7. evaluate direct J1 at that actual point, or sample the current J2--J4
   pure-order field; and
8. add it to that scene page's wavelength accumulator.

Direction interpolation therefore moves through the observer-ray scene-page
field, not through the old receiver-column approximation. The page records a
validity/branch policy wherever the rectangular W39-by-Native48 storage
contains no valid forward atmospheric point.

## Runtime Access

The contained runtime performs:

```text
world ray
    -> canonical observer-up/Sun ray
    -> W39 direction stencil

actual path sample
    -> altitude stencil

scene page(direction, altitude, wavelength)
    -> Native15 C4 density
```

Algorithm32 retains its current outer structure:

```text
for each camera-ray interval:
    update Native15 view transmittance
    density = scenePage.lookup(sampleAltitude, canonicalRayDirection)
    pathRadiance += transmittance * density * intervalLength
```

Object intersections can continue shortening the ray. Atmospheric path
radiance remains Native15 until the existing celestial-composition and Color
boundary. The POC does not add an incident-direction loop to runtime.

## Implementation Work Packages

### ZP0 — Lane and contract

Status: complete.

- create the contained implementation root;
- pin the run-`000493` scene and run-`000497` comparison identity;
- record cache semantics, exclusions, and containment; and
- establish the multi-page builder boundary.

### ZP1 — Lane-local inputs and executable domains

Status: complete. Accepted immutable run
`000502-san-jose-nautical-zp1-input-domains`, artifact-set SHA-256
`88f6be0f314473e3bc2cc317b26ae2e5e7f0490ae799e83577df8cb792dddb62`.
Terminal run `000501` is preserved as the failed overly-tight W39 diagnostic
attempt; it changed no domain value or cache data.

- create the fixed scene fixture from the lane contract;
- implement or adapt lane-local Native48, F68, W39, and Native15 executable
  tables without live production or historical-candidate imports;
- create transport and scene-page request records; and
- add the canonical observer-up/Sun transform.

Done when the lane-local owners can enumerate every solver and scene-page
state deterministically. Static syntax/import checks allocate no run; any
executed enumeration is recorded through the immutable-run protocol rather
than treated as a unit test.

The accepted implementation provides:

- the exact run-`000493` scene fixture;
- Native48, 180 one-degree solar-zenith centers, reflected F68, Native15, and
  source-relative W39 executable owners;
- a separate observer/Sun-canonical W39 owner with identical nodes but a
  distinct physical identity;
- canonical observer/Sun frame transforms;
- the retained ozone-enabled atmosphere and N4 numerical transport spec; and
- one-page and ordered multi-page build-request construction.

The accepted enumeration records `78,848,640` J states and `587,520` L states
per wavelength, plus `438,048` spectra and `26,282,880` logical bytes in the
final W39 Native15 scene page. These are domain and storage facts only; no
transport value was constructed.

### ZP2 — Actual-point geometry and transport addressing

Status: complete. Accepted immutable run
`000506-san-jose-nautical-zp2-geometry-addressing`, artifact-set SHA-256
`1a1e6db160ddf870aad99917eb39817a3e58b1f96c27815dbe673df3d6be9c2e`.
Run `000503` is preserved as a failed evidence-serialization attempt;
runs `000504` and `000505` preserve accepted intermediate geometry states.
The terminal run adds explicit zero-distance ground-entry and atmosphere-exit
rejection discovered by the final boundary audit.

- implement atmosphere and ground intersections;
- implement local `r`, `mu_s`, and source-relative frames along transport
  rays;
- split at atmosphere, ground, tangent, and source-visibility events;
- implement solar-zenith and directional field lookup; and
- implement observer-ray scene-page projection coordinates and invalid-state
  handling.

Done when the GPU passes can receive complete actual-point query packets for
direct, transport, and projection operations.

The accepted implementation provides analytic sphere intersections and
ground/top branch termination, interior radial-tangent and exact distant-Sun
visibility splitting, actual-point source-relative frames, Native48/Z180/W39
stencils, and explicit scene-page projection validity. It retains the
production transport-direction convention: the same forward physical ray
direction addresses stored outgoing scattering density along `Jk -> Lk`.
For the exact San Jose observer, the source-facing horizontal branch exits
Earth shadow at `542,820.2352429515 m` before its atmosphere-top endpoint.
The proof records 14/14 focused assertions and changes no production file.

### ZP3 — Wavelength-scheduled GPU recurrence

Status: complete. Accepted immutable run
`000508-san-jose-nautical-zp3-gpu-recurrence`, artifact-set SHA-256
`1c78cea29acfb9ae581a340092c43ecd5f1f5202096945534677b12cea0b4bf2`.
Run `000507` is preserved as a sandbox-blocked process-launch attempt; no
browser or GPU work began in that run.

- implement J1 and direct L1;
- implement generic `L(k-1) -> Jk` scattering over F68;
- implement actual-point `Jk -> Lk` transport across radius and solar zenith;
- preserve pure-order resource flow through J4; and
- implement last-use release according to the memory schedule.

Done when one wavelength can execute J1--J4 and expose each pure J order to the
projection boundary without cumulative feedback.

The accepted RTX 2060 / D3D11 WebGL2 execution covers the complete `595 nm`
field domains: J fields are `9,126 x 8,640 R32F`, and L fields are
`68 x 8,640 R32F`. It executes direct base, J1, direct L1, J2, L2, J3, L3,
and J4 in order. Each pure J order is independently probed before release;
only `L1 -> J2 -> L2 -> J3 -> L3 -> J4` participates in later-order
recurrence. No cumulative field exists or feeds recurrence.

The last-use ledger releases all eight working fields and ends at zero live
field bytes. Peak tracked field storage is `320,094,720 bytes`
(`305.266113 MiB`), corresponding to one W39 J field plus two F68 L fields.
The 10/10 focused assertions establish execution, pure-order wiring,
containment, and lifecycle only. They do not establish physical accuracy,
convergence, a multi-wavelength cache page, or appearance.

### ZP4 — Multi-page scene-cache compiler

Status: complete in accepted run `000509`.

- accept an ordered list of scene requests;
- project and accumulate J1--J4 into each requested page;
- process and write all Native15 wavelength layers;
- write independent page identity and payload records; and
- allow later collection manifests to reference compatible preserved pages.

Done when the exact San Jose request produces a complete independently
loadable scene page through the same interface that can accept more requests.

The compiler processes all 15 Native15 wavelengths independently. For each
wavelength it evaluates direct J1 at actual page points, projects pure J2--J4
before release, and writes one layer of the final layer-major R32F payload.
The resulting page is exactly `26,282,880 bytes`; its separate validity mask
uses explicit zero for invalid rectangular nodes.

### ZP5 — Contained runtime consumer

Status: complete in accepted run `000509`.

- load the generated San Jose page;
- bind its canonical frame and W39/Native48 lookup;
- replace only the contained cache provider;
- retain the current camera-ray transmittance and path integration; and
- retain the current celestial and Color composition path.

Done when the contained renderer consumes only the generated scene page for
atmospheric cumulative density and requires no actual-point correction term.

The contained runtime uploads the generated payload as an R32F texture array,
looks up Native15 density through canonical W39 direction and Native48
altitude interpolation, and performs the retained 15-interval camera-ray
integration. It has no additive actual-point correction. The preserved
run-`000493` celestial screen palette is an immutable input, and the retained
source-luminance-lift Color path remains downstream.

### ZP6 — Plausibility render

Status: complete in accepted run `000509`.

- add
  `run-san-jose-nautical-actual-point-cache-poc.js` under the authorized
  solar-zenith runner root;
- initialize a new immutable run before GPU work;
- build the page and render the fixed `640 x 400` scene;
- write the candidate image regardless of appearance;
- record configuration, cache identity, basic execution diagnostics, and the
  terminal run manifest; and
- report the image path for owner inspection.

This work package has operational checks only: required resources must be
finite and complete enough to render, containment must hold, and failures must
be reported. It has no Bruneton, CPU-oracle, RMSE, convergence, color, or
subjective acceptance gate.

The required image is preserved at
`captures/san-jose-nautical-actual-point-cache-poc.png` inside run `000509`.
It is `640 x 400`, contains `141,786` non-black pixels, and was written without
an appearance gate. The sealed run passes 10/10 operational assertions and
the post-run immutable-record verifier.

#### Display-only follow-up

Accepted immutable run
`000510-san-jose-nautical-display-only-exposure-sweep` reuses the sealed
run-`000509` page byte-for-byte and renders source-luminance-lift gamma values
`0.125`, `0.20`, `0.30`, and `0.40` with every transport, celestial, tone-map,
and maximum-gain input fixed. The `0.125` output is byte-identical to the ZP6
image, and upper-sky mean output darkens monotonically across the sweep. The
run passes 6/6 focused assertions and the immutable-run verifier; artifact-set
SHA-256 `4c78d6014e06c7679c7e70013cd6043dc2d60935321bc8ae41ee5db09a4c927f`.
This follow-up does not reopen ZP6 or select a canonical exposure value.

### ZP7 — Incremental page additions

Status: first five-page batch complete in accepted run `000511`; solar-noon
near-ground page diagnostic complete in accepted run `000513`.

Later scene requests use the same builder API. A request may build alone or be
batched with other compatible requests. Each invocation writes new immutable
pages, and any expanded collection is represented by a new manifest rather
than mutation of an existing collection.

Run `000511-san-jose-five-scene-actual-point-scattering` exercises the batch
path with ordered requests for ten minutes after sunset, sunset, ten minutes
before sunset, one hour before sunset, and solar noon. Each Native15
wavelength field is solved once and projected into all five page accumulators
before release. The run writes five independent `26,282,880-byte` pages, one
new collection manifest, and five `640 x 400` renders. It passes 8/8 focused
assertions plus immutable-run verification; artifact-set SHA-256
`73cc0bffc967c1e1cb5dbe1f74e06937357133d890bb237349f962cece84b679`.
The images retain the production-oriented source-luminance-lift control and an
analytic uniform distant-Sun disk while omitting stars for scattering focus.

Run `000513-san-jose-solar-noon-near-ground-page` isolates the dark solar-noon
horizon ramp without changing the scene, display path, Native48 solver,
solar-zenith-180 support, F68 incoming quadrature, W39 outgoing domain,
Native15 basis, or N4 recurrence. It adds page-projection and runtime-lookup
altitude rows at `1.7`, `10`, `50`, `100`, `250`, `500`, and `1,000 m`, making
one 55-row `30,115,800-byte` page. All 15 layers are finite and nonnegative,
the render is preserved, and the immutable run passes 9/9 operational
assertions plus verification; artifact-set SHA-256
`e2eea012fc27f0f9e090467a0cc2bed21eef8957dcab316060e02ddc37fdd241`.
The broad dark ramp disappears. Full-row mean RGB at image row 220 changes
from approximately `(12.10, 9.49, 7.89)` in run `000511` to
`(145.43, 144.62, 141.62)`, while the intentional black ground boundary
remains. This establishes that the ramp was caused in part by sparse/invalid
near-observer page-altitude interpolation; it does not establish a final
altitude grid or physical accuracy. Run `000512` remains preserved as the
harness-only failed predecessor: it completed the same solve and render but
checked image dimensions at the wrong object level.

Run `000515-san-jose-solar-noon-validity-aware-runtime` isolates the topology
part of that result with no cache rebuild and no added altitude rows. It
reuses run `000511`'s exact `26,282,880-byte` Native48 solar-noon page and its
`438,048-byte` validity mask, preserves an unmasked control, and changes only
the candidate runtime stencil: invalid W39-by-altitude taps are excluded and
the remaining weights renormalized. Row-220 mean RGB changes from
approximately `(12.10, 9.49, 7.89)` to `(80.52, 86.31, 91.74)`, materially
better but still below run `000513`'s `(145.43, 144.62, 141.62)`. The run
passes 9/9 operational assertions plus immutable verification; artifact-set
SHA-256 `f25da54902239b1c36e7feaa23a35b681bc4529e92a4715ba1ffebb38e905127`.
This demonstrates that Geometry validity must participate in reconstruction
and that valid near-ground field support is independently required. Run
`000514` preserves the completed predecessor images but failed only because a
two-channel, one-code GPU rerender difference violated an exact PNG-hash gate.

## Intended Lane Structure

```text
san-jose-nautical-cache-poc/
  fixtures/
  geometry/
  solver/
  compiler/
  cache/
  runtime/
  lane-contract.json
  containment-policy.json
  README.md

solar-zenith-cache/runners/
  run-san-jose-nautical-actual-point-cache-poc.js
```

Files are added only as their work package begins. No experimental `tests/`
tree or test-framework dependency is created.

## Principal Risks

- **GPU allocation capability.** One W39 pure-J wavelength field is about
  `300.78 MiB`, and the straightforward solver may retain several working
  fields. If one backend cannot allocate the accurate solve, use a capable
  offline backend or lossless field-safe chunking. Do not reduce physical
  state, order, or final page semantics to meet an operational-memory target.
- **Cross-zenith transport.** A transport lookup that accidentally remains in
  its starting zenith layer reproduces the defect. Actual-point coordinates
  are computed at every integration sample.
- **Terminator leakage.** Blind interpolation can smear direct sunlight across
  Earth shadow. Analytic source visibility and event splitting remain explicit
  even without formal validation.
- **Projection mismatch.** The scene page uses observer-ray directions while
  the solver uses local source-relative directions. Geometry owns that
  transform; the runner may not approximate it from screen coordinates.
- **Hidden historical dependency.** Prior runs and production are read-only
  inputs or comparison evidence. Runnable code and required fixtures remain
  inside the new lane.
- **Long build time.** Wavelength scheduling and incremental artifact writing
  permit progress without converting offline time into a runtime shortcut.

## Status Ledger

| Work package | Status | Current result |
| --- | --- | --- |
| ZP0 lane and contract | complete | Dedicated contained lane, fixed scene/cache contract, and multi-page builder boundary recorded. |
| ZP1 inputs and domains | complete | Run `000502` accepts 14/14 focused assertions over lane-local Native48, solar-zenith-180, F68, frame-distinct W39, Native15, canonical observer/Sun frame, ozone-enabled transport spec, ordered multi-page requests, containment, and unchanged production inventories. Artifact-set SHA-256 `88f6be0f314473e3bc2cc317b26ae2e5e7f0490ae799e83577df8cb792dddb62`. |
| ZP2 geometry/addressing | complete | Run `000506` accepts 14/14 focused assertions over exact ground/top/limb intersections, zero-distance boundary rejection, an interior radial tangent, source-visibility splitting, changing local `r` and `mu_s`, normalized in-range Native48/Z180/W39 stencils, direct/transport/projection packets, explicit invalid projection states, containment, and unchanged production inventories. Artifact-set SHA-256 `1a1e6db160ddf870aad99917eb39817a3e58b1f96c27815dbe673df3d6be9c2e`. |
| ZP3 GPU recurrence | complete | Run `000508` accepts 10/10 focused assertions for the complete `595 nm` Native48/Z180/F68/W39 R32F recurrence through J4 on the RTX 2060. J1--J4 are exposed independently, no cumulative field is allocated or fed back, all eight working fields release after last use, peak tracked field storage is `320,094,720 bytes`, and production remains unchanged. Artifact-set SHA-256 `1c78cea29acfb9ae581a340092c43ecd5f1f5202096945534677b12cea0b4bf2`. |
| ZP4 scene-cache compiler | complete | Run `000509` writes all 15 independently projected wavelength layers into a complete `26,282,880-byte` Native15 W39 R32F page plus explicit validity mask. |
| ZP5 runtime consumer | complete | Run `000509` uploads and consumes only the generated scene page through canonical W39/Native48 lookup and retained 15-interval camera-ray integration, with no additive actual-point correction. |
| ZP6 plausibility render | complete | Run `000509` preserves the unconditional `640 x 400` PNG and passes 10/10 operational assertions. Artifact-set SHA-256 `e55da100cb06f1f88897d0c5526a4fad654cc990728b458b9071ae6356178a70`. |
| ZP7 incremental pages | first batch complete | Run `000511` projects five compatible scene pages from each shared wavelength solve, writes `131,414,400` total payload bytes plus a collection manifest, and preserves all five scattering renders. Artifact-set SHA-256 `73cc0bffc967c1e1cb5dbe1f74e06937357133d890bb237349f962cece84b679`. |
| Solar-noon near-ground page diagnostic | complete | Run `000513` retains the Native48 N4 solve and adds seven page/runtime altitude rows, producing a `30,115,800-byte` 55-row page. The broad dark horizon ramp disappears while black ground remains. Artifact-set SHA-256 `e2eea012fc27f0f9e090467a0cc2bed21eef8957dcab316060e02ddc37fdd241`. |
| Solar-noon validity-aware runtime diagnostic | complete | Run `000515` reuses the exact run-`000511` Native48 page, adds only its `438,048-byte` Geometry validity mask at runtime, excludes invalid interpolation taps, and renormalizes surviving weights. It materially reduces but does not eliminate the ramp, proving that topology masking and near-ground field resolution are separate requirements. Artifact-set SHA-256 `f25da54902239b1c36e7feaa23a35b681bc4529e92a4715ba1ffebb38e905127`. |

## Done Condition

The first POC is done when one terminal immutable run contains a complete
Native15 N4 San Jose scene page and the requested `640 x 400` render produced
through ordinary contained Algorithm32 cache access. The render is delivered
for inspection regardless of appearance. Any conclusion about accuracy,
representation selection, resolution, memory limits, or production use
requires later work outside this POC plan.
