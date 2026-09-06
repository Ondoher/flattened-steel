# Production Color Reset Implementation Plan

Focus: Release gates, deployment inputs, and owner decisions.

Related owners: [sources-provenance](../../pure-research/sources-provenance/color-reset-implementation-plan.md), [runtime-integration](../runtime-integration/color-reset-implementation-plan.md), [color-celestial](../../production-algorithm32/color-celestial/color-reset-implementation-plan.md), [product-behavior](../product-behavior/color-reset-implementation-plan.md).

## Completion Target

Promote receiver-light state, `color-reset-slope-078-p9`, neutral direct and
diffuse scene lighting, the complete brightest-2,000 catalog, one-pixel
`q=24`, and the reversible ordered human-vision filters into the existing
Algorithm32/Flat32 architecture. Retain `basic-bruneton` as an explicit option
and introduce no contained runtime dependency or old/new compatibility bridge.

The initial appearance-qualified release surface is spherical/distant. Work is
split into independently reviewable increments so a catalog, Color, lighting,
or filter defect cannot be hidden by another simultaneous change.


## Selected Pre-Execution Boundaries

Source research and official-experiment registration are deferred. Production
implementation, deterministic reproduction, and engineering verification may
proceed using the accepted contained results as provisional algorithmic
authority. An unresolved source-gap row continues to block final scientific or
  numerical-authority acceptance and release qualification for the affected
  capability. The project owner subsequently directed application default
  activation before those research items close; that direction does not waive
  the source, licensing, or release gates.

The initial qualification matrix is Windows, the current pinned Chrome
Headless executable, WebGL2 via ANGLE/D3D11, and the NVIDIA GeForce RTX 2060.
The promotion manifest records the exact browser version used by each gate; P0
observed Chrome Headless 153. Full-frame appearance and performance use a
1920-by-1080 drawing buffer at DPR 1. DPR 2 qualification is limited to
one-pixel raster occupancy, screen-index rebuild, resize, and lifecycle
behavior using a bounded CSS viewport whose drawing buffer does not exceed
1920 by 1080. Broader browsers, GPUs, operating systems, viewports, and 4K
performance are not part of this promotion gate.

External-data source payloads and derivatives may be generated and exercised
locally, but BSC, Pickles, Johnson/SVO, Vega, and CIE-derived bytes may not be
publicly distributed or placed in a release package until their applicable
license and redistribution rows close. A production-owned data layout does not
remove that restriction; publicly distributed repositories must also keep the
affected bytes outside tracked surfaces pending clearance.


## P8 - Run Production Qualification

Status: substantially complete. The
[production qualification record](color-reset-production-qualification.md)
owns current evidence and the remaining gates.

- Regenerate the exact B1 table and all six figures using explicit
  `basic-bruneton`; require RMSE at or below `11.820391604126252` without Color
  participating in physical scoring.
- Reproduce the CR7 daylight-through-dark cadence under the production
  candidate and run a new 2,000-star production appearance sequence.
- Treat the 2,000-star sequence as integration qualification, not as permission
  to increase `q=24` when faint members remain sub-robust.
- Verify daylight, low-Sun, twilight chronology, direct/diffuse scene lighting,
  physical and filtered stars, catalog transition, resize, DPR, mode switching,
  context loss/restoration, failure preservation, disposal, and supersession.
- Run complete Algorithm32 Node/WebGL, Flat32, type-check, build, performance,
  memory, and supported-hardware resource gates.
- Produce source and runtime-dependency inventories proving no contained import.

Gate: every design invariant passes from production source, all requested
images exist before appearance judgment, and owner review accepts the complete
2,000-star production presentation as engineering evidence. Open rows in the
[project-wide research register](../../../../references/followup.md#color-reset-research-register)
keep affected scientific/numerical-authority and release gates
provisional even when every engineering check passes.

Current result: the full nine-condition default-human cadence exists and
passes engineering inspection, including the exact 108-degree cache boundary.
Algorithm32 Node passes `610/610`, Algorithm32 WebGL passes `26/26`, the exact-
cache Flat32 lane and build pass `24/24`, both type checks pass, the runtime-
dependency inventory is clean, and the RTX 2060/D3D11 1080p gate measures
22.14 ms mean and 22.43 ms p95 atmosphere GPU time. Production stellar
resource and lifecycle gates pass. Fresh GPU B1 regeneration remains blocked
on a production-owned offline adapter for the direct-40 paper profile; runtime
recurrence will not be restored. Owner acceptance of the production cadence is
also still required.


## P9 - Select Defaults And Close Promotion

Status: partially complete by project-owner direction. Application defaults,
superseded-path removal, and documentation/release inventory are complete;
source/licensing closure and the final release gate remain pending.

Entry condition: every applicable row in the
[project-wide research register](../../../../references/followup.md#color-reset-research-register)
is closed by its required authority and registration, and every externally
derived byte selected for distribution has documented license and
redistribution clearance. P1-P8 engineering completion does not waive this
condition.

- [x] Select `color-reset-slope-078-p9` as the ordinary application default;
  retain `basic-bruneton` as the explicit B1/control option. The owner directed
  this activation before full P8 closure.
- [x] Make the brightest-2,000 roster the ordinary production stellar catalog;
  retain brightest-500 as an explicit control.
- [x] Keep perceptual filters reversible and separately selectable. The owner
  selected the ordered mesopic-then-chroma `human` configuration as the
  ordinary application default; `physical` remains the exact disabled control.
- [x] Remove the superseded source-luminance-lift implementation and configuration
  paths if no remaining production claim requires them; do not leave a
  permanent compatibility bridge.
- [x] Complete the production status, current dataflow, Flat32 documentation, public
  configuration documentation, deployment inventory, and release checklist.

Gate: one production strategy remains, current documentation names this design
and plan as canonical, all release lanes pass after default selection, and the
closed experiment remains evidence rather than runtime code.

Default-activation result: omission now resolves to
`color-reset-slope-078-p9`, `brightest-2000`, and the ordered human stellar
presentation. Flat32 loads/authenticates the 2,000-star and scotopic-weight
packages before application construction and publishes the resolved Color,
catalog, and filter identities on the shell. Explicit physical presentation,
Basic Bruneton, and brightest-500 controls remain available. The superseded
source-luminance-lift route has been removed. Captures
`000015` and `000016` verify the no-override sunset and sunset-plus-one-hour
routes; the latter contains visible one-pixel stars. Flat32 passes `23/23` in
the basic lane and `24/24` in the exact-cache application lane. Against the
prior candidate-camera production captures, their RGB-byte RMSE is
`0.00322748612183951` at sunset and `0.0656101173600536` at plus one hour;
the small plus-one-hour delta is consistent with the expanded catalog. Capture
`000014` is retained but is not default-route evidence because its diagnostic
suffix explicitly selected Basic Bruneton.

Human-default result: run `000017` proves the no-override plus-one-hour route
publishes and executes `human-mesopic-luminance-v1` followed by
`human-low-light-chroma-v1`. Against the otherwise identical physical run
`000016`, only 351 of 768,000 RGB channels change (RMSE
`0.110709125263759`, maximum delta `42`). The full exact-cache Flat32 lane
passes `24/24`, including switching through the nonstellar Flat/local mode;
the application supplies an empty stellar-filter list in that mode and
restores the selected chain on spherical/distant return.
