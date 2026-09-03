# Flat32 One-Degree Scene-Cache Hookup

Status: closed through H7 on 2026-08-31. Flat32 resolves, validates, uploads,
and atomically publishes the qualified bin-covered runtime inventory, and all
post-cutoff solar angles share one valid texture-free dark scattering state.
This plan records the completed path from the verified construction inventory
to the application.

## Goal

Connect Flat32's spherical/distant mode to the generated one-degree cache
inventory through a scalar-solar-zenith server resolver while preserving the
actual scene Sun direction, exact package validation, one-cache residency, and
atomic runtime replacement.

The completed production-adoption work remains the implementation baseline.
This plan does not reopen cache construction, spectral representation, Q30,
Color, geometry endpoints, or the local-Sun path.

## Fixed Decisions

- Solar azimuth is not a cache dimension. Spherical symmetry, the
  source-relative cache frame, the Bruneton/B1 directional evidence, the six
  scene builds, and complete-rotation tests establish the rotational contract.
  A focused covariance regression records that contract; no additional
  azimuth inventory is built.
- Flat32 derives the actual distant-Sun direction once from its observation by
  using the existing production placement equations. That live direction owns
  scene lighting and Geometry source placement.
- The cache package owns its representative solar-zenith bin and canonical
  build provenance. Its manifest direction does not replace the live scene
  azimuth.
- The resolver request contains one finite scalar solar-zenith angle in
  degrees. Location, time, azimuth, model identity, and cache identity are not
  resolver inputs.
- The resolver returns a small descriptor. Immutable manifest, ledger, exact
  R32F payload, and R16UI index files remain static content-addressed assets.
- Only one complete cache is resident. Existing candidate isolation, failed-
  replacement preservation, cancellation, supersession, and atomic
  publication remain the lifecycle.
- The verified source inventory is immutable. Runtime-only derivatives are
  emitted into a new output root; generated payloads are not committed as
  source.
- Angles beyond the qualified non-dark range return an explicit dark or
  unsupported result. They never clamp silently to 108 degrees. A dark result
  selects the one shared texture-free zero-scattering cache and remains a
  successfully published Algorithm32 state; unsupported remains a failure.

## Target Flow

```text
Flat32 observation
  -> production distant-Sun placement owner
  -> actual direction + observer solar zenith
  -> GET resolver(solarZenithDegrees)
  -> exact bin/package descriptor
  -> manifest and payload hash validation
  -> immutable R32F/R16UI upload
  -> candidate preflight
  -> atomic Flat32 publication
```

## H1 - Align the asset and scene contracts

- [x] add one production scene-state owner that returns the actual model-space
      distant-Sun direction and observer solar zenith from a Flat32
      observation, reusing the existing geometry placement equations;
- [x] separate the cache's representative zenith/build identity from the live
      scene direction in the asset-selection contract;
- [x] make `SphericalDistantMode` install the actual scene direction while the
      loader validates the selected canonical package independently;
- [x] replace the handwritten six-state observation lookup with a generated
      zenith-bin catalog contract; and
- [x] add a focused rotation-covariance regression proving that rotating Sun,
      sample, and outgoing direction together preserves the selected cache
      coordinates and Native15 result.

H1 is complete when changing azimuth changes scene placement but neither the
selected zenith bin nor cache values.

## H2 - Emit deployment packages and implement the resolver

- [x] generalize the runtime-only packager to consume the verified 109-package
      inventory index rather than the six-record source catalog;
- [x] emit 109 runtime-only packages plus one generated compact catalog into a
      new immutable output root;
- [x] implement the scalar resolver entry point with finite/range validation,
      deterministic bin ownership, explicit dark/unsupported responses, and
      content-addressed descriptor URLs;
- [x] keep payload delivery outside the resolver response and prove every
      returned descriptor resolves to the packaged manifest hash; and
- [x] retain a local reference server for end-to-end Flat32 proof without
      making it a runtime cache builder.

H2 is complete: every supported scalar in `[0, 108)` resolves to its verified
runtime-only package; 108 degrees and larger return explicit darkness, and
invalid requests fail explicitly.

## H3 - Wire the asynchronous resolver into Flat32

- [x] make the injected Flat32 cache resolver asynchronous;
- [x] let `ModeController` await mode preparation inside its existing
      generation/cancellation transaction;
- [x] resolve the package before constructing spherical/distant Algorithm32,
      then pass both the actual scene direction and exact asset selection;
- [x] preserve the last published atmosphere while resolution, download,
      validation, upload, or preflight is pending or fails;
- [x] expose resolving, loading, ready, dark, and failure states through the
      existing Flat32 status surface; and
- [x] retain the local-Sun mode and its synchronous construction behavior
      unchanged.

H3 is complete when arbitrary supported Flat32 observations select, load, and
atomically publish the expected one-degree package while using the observation's
actual Sun azimuth.

## H4 - Qualify the hooked-up application and release it

- [x] prove every half-open one-degree bin has interpolation-closed ledger
      support at both interval edges and assemble the required row union;
- [x] prove all 5,494 physical coordinates shared between parent caches have
      byte-identical Native15 rows, so assembly adds no numerical approximation;
- [x] select and record the 108-degree darkness cutoff and half-up, half-open
      ownership rule;
- [x] prove resolver rejection, missing assets, hash mismatch, supersession,
      context restoration, cache swaps, scene objects, ground, and complete
      camera rotation;
- [x] retain the qualified PA6 Direct40/Native15 numerical evidence because the
      deployed payload rows are byte-exact derivatives rather than rebuilt
      transport values, and emit the real Flat32 application render; and
- [x] pass Algorithm32 and Flat32 typechecks, deterministic suites, real-WebGL
      suites, the Flat32 build, and diff/format checks.

H4 is complete when the generated catalog replaces the six-state catalog as
Flat32's selected production path. Continuous interpolation and continuous Sun
animation remain deferred; discrete state changes use complete atomic cache
swaps.

## Completion Evidence

- Bin-support diagnostic:
  `tmp/extraterrestrial/production-adoption/one-degree-bin-support-20260830-1`.
- Qualified runtime packages:
  `tmp/extraterrestrial/production-adoption/one-degree-bin-covered-runtime-packages-20260830-1`.
  The set contains 109 packages and `17,230,339,148` bytes; its largest
  resident cache is `161,192,508` bytes.
- Real application proof:
  `tmp/extraterrestrial/production-adoption/flat32-one-degree-bin-covered-hookup-20260830-1`.
  The fractional `56.60595628589379`-degree request published N4 with zero
  WebGL errors.
- Release gates: both typechecks pass, Algorithm32 passes `591/591`, Flat32's
  full exact-cache browser lane passes `16/16`, the Flat32 build passes, and
  `git diff --check` passes.

## H5 - Mount the production application route

- [x] register Flat32's Polylith server router from `builds/flat32.json`;
- [x] mount the scalar resolver at
      `/flat32/api/distant-sun-scene-cache` and immutable package assets at
      `/flat32/scene-caches/`;
- [x] make the browser endpoint relative to the Flat32 document instead of
      site-root absolute;
- [x] validate the package root, report, catalog hash, and every served path;
      allow `FLAT32_DISTANT_SUN_CACHE_ROOT` to override the qualified local
      package root for deployment; and
- [x] prove the ordinary `npm start` server returns ready/dark/error states,
      serves the exact manifest, and reaches an installed atmosphere through
      the real Flat32 renderer.

The original H4 proof used the focused reference host. H5 closes the missed
deployment seam discovered when the normal Polylith static server returned
HTTP 404. The accepted normal-server proof is
`tmp/extraterrestrial/production-adoption/flat32-polylith-namespaced-cache-route-20260831-1`.

## H6 - Remove resident lookup redundancy

- [x] isolate the severe steady-frame regression from resolver, download,
      validation, upload, cache-swap, and static-shadow work;
- [x] account for the point-local Q30 shader: the original loop placement
      performed as many as 7,200 R32F cache reads and 7,200 redundant R16UI
      direction-map reads per output pixel;
- [x] resolve the four exact-seam direction indices, four packed rows,
      support state, and altitude/solar-zenith weights once per physical path
      sample, outside the Native15 channel loop;
- [x] preserve Q30, Native15, the validated R32F/R16UI source assets,
      interpolation nodes, and one-cache residency;
- [x] transpose the unchanged Native15 values into four RGBA channel groups
      over a logical W27 face-grid atlas and use hardware bilinear direction
      interpolation;
- [x] add a source-level regression assertion that prevents direction-map or
      packed-row resolution from returning to the spectral loop; and
- [x] correct the full Flat32 Karma proxy to consume the production
      `/flat32/scene-caches/` asset namespace and rerun the complete gates.

H6 is complete. The earlier `gl.finish()` proof measured CPU submission rather
than GPU completion and is superseded. Pass-local
`EXT_disjoint_timer_query_webgl2` evidence first measured the scalar path at
roughly 673-880 ms per 1920-by-1080 frame. RGBA channel packing reduced warmed
frames to roughly 63-73 ms; the selected face-grid atlas removes manual W27
direction taps and reaches 22.22 ms mean / 22.30 ms p95 across eight warmed
frames. Accepted proof is
`tmp/extraterrestrial/production-adoption/flat32-distant-sun-runtime-performance-20260831-11`.
The atlas raises the maximum resident derivative from a `161,192,508`-byte
source package to `185,326,380` GPU bytes while preserving every Native15
float. These are local supported-hardware observations, not general hardware
guarantees. A separate high-DPI diagnostic measures 123.32 ms mean and
127.10 ms p95 at a true 3840-by-2160 drawing buffer, so H6 does not claim a
30-FPS 4K result. Both
typechecks, the Flat32 build, Algorithm32 `591/591`, Algorithm32 WebGL
`23/23`, and the full exact-cache Flat32 lane `16/16` pass. The cache inventory
and every deployed payload remain unchanged.

## H7 - Keep the shader live after the darkness cutoff

- [x] distinguish the resolver's intentional `dark` result from unsupported
      or failed cache resolution;
- [x] provide one attachment-local, texture-free cache implementation whose
      cumulative Native15 scattering density is zero at every sample;
- [x] keep the actual scene Sun direction, spherical geometry, live transport,
      scene composition, and celestial sources in the ordinary Algorithm32
      pipeline;
- [x] publish `dark` as a ready cache state without downloading, clamping, or
      retaining an angle-specific package; and
- [x] exercise San Jose at sunset plus two hours (`108.136575` degrees) through
      the real application and the full browser gate.

H7 is complete. The real application published the dark state in approximately
664-694 ms with zero render errors and continued atmosphere frames. The full
Flat32 exact-cache lane passes `16/16`; Algorithm32 passes `594/594`, both
typechecks and the Flat32 build pass, and the `[0, 108)` package inventory is
unchanged.

## Closure

All H1-H7 work items are complete and no unchecked item remains. The qualified
inventory, offline compiler, deployment packages, resolver, Flat32 lifecycle,
resident atlas lookup, supported-angle cache swaps, and shared dark state form
the closed production baseline.

The following remain deliberately outside this plan and do not block closure:

- continuous or discrete Sun animation policy beyond complete atomic swaps;
- 4K resolution/reprojection performance work;
- applying the distant-Sun cache design to the Flat/local source;
- Color/display correction; and
- stellar appearance correction.

Any future cache change must open a new focused plan or explicitly reopen this
one with new evidence. Color and star work may consume this cache baseline but
must not retune its physical spectral data.
The [production closeout plan](color-star-cache-closeout-plan.md) inventories
the current owner-disposition candidates without reopening H1-H7.

## Stop Conditions

Stop only for a defect that changes the selected cache representation, requires
an azimuth dimension despite the fixed rotational contract, violates the
immutable inventory, or prevents a safe recommendation. Ordinary endpoint,
packaging, asynchronous-lifecycle, and application-integration defects remain
part of this plan.
