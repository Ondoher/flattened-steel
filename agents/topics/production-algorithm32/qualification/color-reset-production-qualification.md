# Color Reset Production Qualification

Focus: Engine conformance and production benchmark export.

Related owners: [release](../../production-app/release/color-reset-production-qualification.md), [benchmarks](../../poc-experiments/benchmarks/color-reset-production-qualification.md).

## Selected Runtime Surface

Omitted application configuration selects:

- Color: `color-reset-slope-078-p9`;
- stellar catalog: `brightest-2000`; and
- stellar presentation: `human-mesopic-luminance-v1`, followed by
  `human-low-light-chroma-v1`.

`?colorModel=basic-bruneton`, `?stellarCatalog=brightest-500`, and
`?stellarPresentation=physical` retain the exact physical controls. The
superseded source-luminance-lift implementation and query route are removed.


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
