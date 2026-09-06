# Flat32 One-Degree Scene-Cache Hookup

Focus: Engine conformance and production benchmark export.

Related owners: [runtime-integration](../../production-app/runtime-integration/flat32-one-degree-cache-hookup-plan.md).

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
The [production closeout plan](../../production-app/release/color-star-cache-closeout-plan.md) inventories
the current owner-disposition candidates without reopening H1-H7.
