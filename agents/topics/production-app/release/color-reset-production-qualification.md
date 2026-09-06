# Color Reset Production Qualification

Focus: Release gates, deployment inputs, and owner decisions.

Related owners: [qualification](../../production-algorithm32/qualification/color-reset-production-qualification.md), [benchmarks](../../poc-experiments/benchmarks/color-reset-production-qualification.md).

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


## Deployment Inventory

Tracked deployment code comprises `src/algorithm32`, `src/flat32`, the Flat32
router and package services, and the ordinary Flat32 build output. Runtime
must not import `experiments/extraterrestrial`, `tmp/extraterrestrial`, or the
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
