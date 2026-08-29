# San Jose Nautical Actual-Point Cache POC

Status: historical observer-projected POC. Its runs and implementation remain
preserved evidence, but its `(altitude, observer-ray direction)` page is not
the selected successor cache. New work follows the point-local
`(altitude, local solar zenith, local outgoing direction)` design in the
canonical distant-Sun plan. ZP4--ZP6 completed in accepted immutable run
`000509-san-jose-nautical-actual-point-cache-poc`, artifact-set SHA-256
`e55da100cb06f1f88897d0c5526a4fad654cc990728b458b9071ae6356178a70`.
The run contains the complete Native15 scene page, its validity mask, the
page-only runtime evidence, and the unconditional `640 x 400` render. Earlier
terminal and intermediate runs remain preserved.

Accepted follow-up run
`000510-san-jose-nautical-display-only-exposure-sweep` holds that page and all
transport fixed, changes only the source-luminance-lift gamma, and preserves
four `640 x 400` variants (`0.125`, `0.20`, `0.30`, and `0.40`). Its control is
byte-identical to run `000509`. This is display-selection evidence only; no new
gamma has been selected.

Accepted ZP7 run
`000511-san-jose-five-scene-actual-point-scattering` proves the ordered
multi-page path with five compatible scene requests in one shared solve. It
writes independently loadable Native15 pages and renders for solar noon, one
hour before sunset, ten minutes before sunset, sunset, and ten minutes after
sunset. The five page payloads total `131,414,400 bytes`. These are scattering
review images with the retained source-luminance-lift control and an analytic
Sun disk; stars are intentionally omitted.

Accepted solar-noon diagnostic run
`000513-san-jose-solar-noon-near-ground-page` keeps the Native48 N4 solver
unchanged but extends the durable page and its runtime lookup with altitude
rows at `1.7`, `10`, `50`, `100`, `250`, `500`, and `1,000 m`. The resulting
55-row Native15 page is `30,115,800 bytes`. It removes the broad dark
solar-noon horizon ramp seen in run `000511`: at image row 220, full-row mean
RGB rises from approximately `(12.10, 9.49, 7.89)` to
`(145.43, 144.62, 141.62)`. The black ground boundary remains. This isolates
insufficient near-observer page-altitude support as a cause of that ramp;
it is a plausibility diagnosis, not physical-accuracy or convergence evidence.
Run `000512` preserves the identical completed diagnostic output but sealed
as failed because its runner inspected image dimensions at the wrong result
object level.

Accepted runtime-only run
`000515-san-jose-solar-noon-validity-aware-runtime` returns to run `000511`'s
exact Native48 page and uploads its existing `438,048-byte` Geometry-derived
validity mask as `R8UI`. The candidate excludes invalid taps from the combined
W39-by-altitude stencil and renormalizes surviving weights; its paired
unmasked control uses the same sealed page. At image row 220, mean RGB
improves from approximately `(12.10, 9.49, 7.89)` to
`(80.52, 86.31, 91.74)`, but remains below the 55-row result's
`(145.43, 144.62, 141.62)`. The evidence separates two contributors:
invalid-zero interpolation and missing valid near-ground field samples.
Topology-aware interpolation is necessary, but it does not make the first
valid `1,875 m` row an adequate substitute for near-observer values. Run
`000514` preserves the completed paired images but sealed as failed under an
overly strict PNG-byte identity check; its unmasked control differs from run
`000511` by only two channels at one code value.

This lane exists to produce one plausibility render for the retained San Jose
nautical-twilight scene using an accurate vertical slice of the proposed final
cumulative-density cache. It is deliberately narrower than qualification: it
selects no production layout, memory limit, compression, streaming policy, or
multi-scene asset.

The operational sequence is owned by the
[Solar-Zenith Scene-Cache POC Plan](../../../../agents/topics/algorithm32/cache/solar-zenith-cache-poc-plan.md).

The machine-readable fixed contract is
[lane-contract.json](lane-contract.json). The parent containment policy is
[../containment-policy.json](../containment-policy.json), narrowed locally by
[containment-policy.json](containment-policy.json).

## Physical Target

The POC recomputes the actual-point distant-Sun recurrence through N4. Its
temporary construction fields preserve radius, local solar zenith, direction,
and wavelength:

```text
Jk(r, localSolarZenith, sourceRelativeOutgoingDirection, wavelength)
Lk(r, localSolarZenith, incomingDirection, wavelength)
```

Only the preceding pure transported order feeds the next order:

```text
J1
L1 -> J2
J2 -> L2
L2 -> J3
J3 -> L3
L3 -> J4
C4 = J1 + J2 + J3 + J4
```

Transport must update radius, local solar zenith, and local directional
coordinates at every integration point. Earth, atmosphere, and
source-visibility events must split the affected integration interval. The
POC may use provisional resolution, but it may not use the current receiver
column, an additive J1 repair, cumulative feedback, or a scene-color repair.

## Durable POC Product

The temporary coupled construction field is projected into exactly one
scene-page cache:

```text
C4SanJose(
    altitude,
    canonical observer-ray outgoing direction,
    Native15 wavelength
) -> cumulative local scattering density
```

The fixed scene Sun zenith is page identity rather than a sampled runtime
axis. The page retains the existing cumulative-density semantic and units.
The contained Algorithm32 copy must consume it through the ordinary camera-ray
integration:

```text
pathRadiance += viewTransmittance * C4SanJose * pathMeasure
```

Camera rotation is handled by the observer-up/Sun canonical transform. This
single page is tied to the fixed observer position and height; translation,
Sun-page interpolation, animation, and cache replacement are outside the POC.

The builder interface must nevertheless separate one transport-solve
specification from a list of scene-page requests:

```text
build({
    transportSpec,
    scenePageRequests: [scene0, scene1, ...]
})
```

The first POC supplies a one-element list. A later invocation may add one page
or project several compatible pages while each wavelength's temporary field
is resident. Page projection must not be embedded in the recurrence passes.
Every page is an independently identified output carrying its observer,
scene-Sun zenith, canonical-frame convention, domains, spectral basis, stored
semantic, and parent transport identity.

Incremental addition follows immutable-run rules. A later run writes new
pages and, when needed, a new collection manifest that references earlier
immutable page artifacts; it never appends to or rewrites an earlier run.
The builder may either recompute the compatible temporary field or consume a
separately preserved compatible universal solver artifact with a complete
derivation identity. Reuse is an optimization, not a different physical path.

Only pages with identical atmosphere, planet, source model, recurrence,
numerical controls, Native15 basis, coordinate domains, page semantic, and
canonical-frame convention belong to one interpolation-compatible family.
Observer and Sun state remain page identity. The future runtime may load an
individual page immediately; interpolation between pages is enabled only
after compatible bracketing pages exist.

## Fixed Scene

- Parent configuration: immutable run
  `000493-san-jose-nautical-twilight-ozone-f68-w39-preview`.
- Causal comparison only: immutable run
  `000497-san-jose-nautical-twilight-actual-point-j1-control`.
- Instant: `2024-06-21T04:26:03.503Z`.
- Solar elevation: `-9.756817735470484 degrees`.
- Observer height: `1.7 m`.
- Camera: sunset-facing, `5 degrees` elevation, `78 degrees` vertical field
  of view, `640 x 400` output.
- Atmosphere: retained 300-DU ozone-enabled configuration.
- Construction: reflected Fibonacci-68 incoming quadrature, W39 outgoing
  domain, Native48 altitude domain, Native15 spectrum, and N4.

W39 is retained only to make the first image directly comparable with the
run-`000493` scene. The qualified successor plan returns to the production
W27 outgoing-domain baseline.

## Intended Implementation Boundary

Implementation added to this lane should remain separated into these owners:

- `geometry/`: actual-point coordinates, canonical transforms, branch events,
  and scene-page projection geometry;
- `solver/`: wavelength-scheduled GPU J/L recurrence and pure-order lifetime;
- `compiler/`: transport-solve orchestration, a list of scene-page requests,
  projection scheduling, and independently writable page artifacts;
- `cache/`: scene-page storage, compatibility identity, collection references,
  and lookup;
- `runtime/`: contained Algorithm32 integration and display wiring; and
- `fixtures/`: the fixed scene and provisional numerical controls.

The eventual entry point belongs at
`scripts/extraterrestrial/solar-zenith-cache/runners/run-san-jose-nautical-actual-point-cache-poc.js`.
It must allocate its render under a new immutable directory in
`tmp/extraterrestrial/runs/`. Generated shaders, bundles, readbacks, cache
pages, logs, and images also belong to that run.

## Deliberate Exclusions

This first-look lane does not require Bruneton comparison, a CPU field oracle,
formal thresholds, convergence qualification, N1/N2 images, compression,
paging, animation, generalized manifests, production integration, or a
pass/fail appearance decision. It writes the requested N4 image even if the
result looks implausible. Mandatory containment and immutable-run mechanics
remain in force; they are evidence-preservation rules, not validation gates.

Offline construction working memory is not a design consideration for this
POC. It may be recorded for diagnosis, but it does not constrain field shape,
resolution, order, or scheduling. Backend allocation is only an execution
feasibility concern; use a capable backend or lossless chunking rather than
changing the final cache representation. Final scene-page size remains a
relevant property because those pages are the durable runtime caches.
