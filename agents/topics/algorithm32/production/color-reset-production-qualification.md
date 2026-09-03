# Color Reset Production Qualification

Status: engineering qualification substantially complete; fresh B1 GPU
regeneration, owner appearance judgment, and source/licensing closure remain
open.

This document owns the current P8 engineering evidence and P9 deployment and
release checklist. The [production design](color-reset-design.md) owns the
algorithm and the [implementation plan](color-reset-implementation-plan.md)
owns phase completion. Cross-surface disposition and final sequencing are
owned by the [production closeout plan](color-star-cache-closeout-plan.md).

## Selected Runtime Surface

Omitted application configuration selects:

- Color: `color-reset-slope-078-p9`;
- stellar catalog: `brightest-2000`; and
- stellar presentation: `human-mesopic-luminance-v1`, followed by
  `human-low-light-chroma-v1`.

`?colorModel=basic-bruneton`, `?stellarCatalog=brightest-500`, and
`?stellarPresentation=physical` retain the exact physical controls. The
superseded source-luminance-lift implementation and query route are removed.

## Appearance Sequence

The immutable production cadence is under
`tmp/extraterrestrial/production-color-reset/runs/`:

| Run | Condition | Result |
| --- | --- | --- |
| `000018-p8-human-solar-noon` | solar noon | ready; selected default generation |
| `000019-p8-human-sunset` | sunset | ready; accepted Color Reset sunset response |
| `000020-p8-human-sunset-plus-10m` | sunset +10 minutes | ready |
| `000021-p8-human-sunset-plus-30m` | sunset +30 minutes | ready |
| `000022-p8-human-sunset-plus-60m` | sunset +60 minutes | ready; visible one-pixel stars |
| `000023-p8-human-sunset-plus-90m` | sunset +90 minutes | ready |
| `000024-p8-human-solar-zenith-108-below` | immediately below 108 degrees | exact cache remains ready |
| `000025-p8-human-solar-zenith-108-above` | immediately above 108 degrees | shared texture-free dark cache |
| `000026-p8-human-sunset-plus-120m` | sunset +120 minutes | dark cache; stars remain independent |

Every capture reports `color-reset-slope-078-p9`, `brightest-2000`, the two
ordered human filters, and zero WebGL errors. The review sheet is
`tmp/extraterrestrial/production-color-reset/p8/cadence-summary-000001/p8-human-cadence.png`.
Engineering inspection finds a coherent daylight-to-dark chronology, exact
108-degree cache transition, and one-pixel stellar presentation. Final P8
appearance acceptance remains an owner judgment.

## Engineering Gates

| Gate | Current result |
| --- | --- |
| Algorithm32 Node | `610/610` after superseded-path removal |
| Algorithm32 WebGL | `26/26` in Chrome Headless 153 |
| B1 support contracts | `17/17`; direct-40 profiles and finalized-run validation pass |
| Flat32 exact-cache application | `24/24` in Chrome Headless 153 |
| Algorithm32 and Flat32 type checks | pass |
| Flat32 build | pass |
| Runtime dependencies | accepted; 462 executable files, no contained, temporary-output, or external-repository runtime import |
| 1080p supported-hardware performance | accepted on RTX 2060/D3D11: 22.14 ms mean and 22.43 ms p95 atmosphere GPU time |
| Stellar resources | accepted by production WebGL recast: 152,000-byte split source textures, 2,001-entry 16-row palette, collision conservation, replacement, disposal, and context restoration |
| One-pixel lifecycle | accepted across view, resize, bounded DPR 2, mode replacement, context loss/restoration, failure preservation, disposal, and supersession |

The immutable dependency report is
`tmp/extraterrestrial/production-color-reset/p8/dependency-inventory-000003/dependency-inventory.json`.
The supported-hardware performance report is
`tmp/extraterrestrial/production-color-reset/p8/performance-1080p-human-000002/verification-report.json`.
Logical resource sizes are contract evidence; WebGL2 does not expose a
portable driver-resident byte measurement, so none is inferred.

## B1 Boundary

The retained CPU reference can still build the paper-profile cache offline.
The current B1 GPU harness cannot yet regenerate its 40-channel paper-profile
table because it calls ordinary runtime setup without an exact prebuilt asset.
Production runtime correctly rejects that request. The production offline
scene-cache compiler currently emits only its fixed Native15/W27/F68 package,
not B1's direct-40 paper profile. Closing this gate requires a production-owned
offline B1 compiler/asset adapter; restoring runtime recurrence is prohibited.
The B1 score remains required to be at or below RMSE
`11.820391604126252`, and B1 physical scoring must bypass Color while its
figures explicitly retain Basic Bruneton as their display control.

## Deployment Inventory

Tracked deployment code comprises `src/algorithm32`, `src/flat32`, the Flat32
router and package services, and the ordinary Flat32 build output. Runtime
must not import `scripts/extraterrestrial`, `tmp/extraterrestrial`, or the
external comparison repository.

These required payloads remain local-only and must be excluded from public
release artifacts until their project-wide research and redistribution rows
close:

- `server/flat32/data/brightest-2000-stellar-package-v1`;
- `server/flat32/data/human-vision-filter-package-v1`; and
- any derivative that embeds their BSC, Pickles, Johnson/SVO, Vega, or
  CIE-derived bytes.

The server data README owns materialization and verification commands. Missing
or altered payloads fail closed before application construction.

## Release Checklist

- [x] Production defaults select Color Reset, brightest-2,000, and the human
  filter chain.
- [x] Basic Bruneton, brightest-500, and physical presentation remain explicit
  controls.
- [x] The superseded source-luminance-lift production implementation and route
  are removed.
- [x] Current production, dataflow, Flat32 configuration, deployment inventory,
  and qualification documentation name this design and plan as canonical.
- [x] Complete Node, WebGL, exact-cache Flat32, type-check, build, dependency,
  lifecycle, resource, and supported-hardware performance gates pass.
- [ ] Regenerate and accept the fresh production B1 table and all six figures.
- [ ] Record owner acceptance of the complete production appearance sequence.
- [ ] Close every applicable row in the
  [project-wide research register](../../../../references/followup.md#missing-third-party-sources-or-canonical-registrations).
- [ ] Document licenses and redistribution clearance for every selected
  external-data payload and derivative.
- [ ] Re-run all release lanes after the final source/licensing payload set is
  fixed.

Until every unchecked item closes, engineering use is qualified on the pinned
matrix, but scientific/numerical-authority acceptance, public redistribution,
and final P9 release closure remain provisional.
