# Color Reset Production Qualification

Focus: Release gates, deployment inputs, and owner decisions.

Related owners: [qualification](../../production-algorithm32/qualification/color-reset-production-qualification.md), [benchmarks](../../poc-experiments/benchmarks/color-reset-production-qualification.md).

## Appearance Sequence

The rejected [canonical C1.9 B1-B3 run](../../poc-experiments/benchmarks/production-b-family-c1-9-result.md)
remains immutable. The corrected
[official production B1 result](../../../../references/results/experiments/b1-directional-sky-radiance/gpu/result.md)
includes all six figures and passes the fixed B1 ceiling at
11.554013953257604. The accepted
[combined score record](../../../../references/results/experiments/b1-b3-production-scores/gpu/000004-current-production-b1-b3-gpu-shaders/manifest.json)
uses that same manifest. B2 is favorable at `2.406574 W m^-2` RMSE, and B3 is
favorable at `11.554014 mW m^-2 sr^-1 nm^-1` with same-run B1 consistency and
all five mismatch declarations.

The accepted record was verified from the repository root with:

```text
npm run score:algorithm32:b1-b3-production:official
npm run score:algorithm32:b2-production:official
npm run score:algorithm32:b3-production:official
node --test --test-isolation=none scripts/experiments/b1-directional-sky-radiance/ProductionRun.test.js scripts/experiments/b1-directional-sky-radiance/score-production-run.test.js scripts/experiments/b2-hemispherical-sky-irradiance/run.test.js scripts/experiments/b3-matched-atmosphere-solver/run.test.js
```

The combined command is the publication gate. The two component commands
prove that B2 and B3 remain separately runnable against the registered current
production boundary.

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
108-degree cache transition, and one-pixel stellar presentation. The project
owner accepts this complete cadence as the production engineering appearance
target, closing C2. The approval does not broaden the M3 scientific-authority
or redistribution claims.


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
- [x] Regenerate and accept the fresh production B1 table and all six figures.
- [x] Run B2 and B3 from the corrected production manifest and accept the
  combined B1-B3 record.
- [x] Record owner acceptance of the complete production appearance sequence.
- [x] Defer the remaining applicable rows in the
  [project-wide research register](../../../../references/followup.md#missing-third-party-sources-or-canonical-registrations)
  to [MVP requirement M3](../mvp/requirements.md#m3--color-reset-scientific-authority),
  preserving every claim limitation.
- [x] Defer licenses and redistribution clearance for every selected
  external-data payload and derivative to M3; retain each affected payload as
  local-only and exclude it from public artifacts until cleared.
- [x] Re-run all engineering-release lanes after the final appearance decisions
  are fixed, preserving the M3 authority and distribution restrictions.

The 2026-09-11 C6 rerun passed 641 Algorithm32 Node specs, 32 Algorithm32
WebGL specs, 37 Flat32 full-cache specs, both type checks, the Flat32 build,
server and dependency gates, compiler payload compatibility, the production
Bruneton comparison, and the official B1-B3 commands. The fresh 1080p RTX 2060
proof passed with 23.994 ms mean and 24.339 ms p95 runtime GPU time at DPR 1;
its immutable report is
`tmp/extraterrestrial/production-color-reset/p9/c6-performance-1080p-human-000001/verification-report.json`.
The compiler compatibility result is
`tmp/algorithm32/point-local-cache-compiler/compatibility-2d7a5617-ada8-4420-b80e-54195c55dcd0/result.json`,
and the production Bruneton result is
`tmp/algorithm32/point-local-cache-compiler/bruneton-16f47e82-5eb2-49bf-b1fc-d71fa541b529/result.json`.

P9 engineering-release closure is complete on the pinned matrix. Scientific
and numerical authority for the C4 rows and public redistribution clearance
for the C5 payloads remain provisional through M3.
