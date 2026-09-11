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
| Algorithm32 Node | `641/641` in the final C6 rerun |
| Algorithm32 WebGL | `32/32` in Chrome Headless 153 |
| B1 support contracts | `54/54`; direct-40 profiles, finalized-run validation, and official runner contracts pass |
| Flat32 exact-cache application | `37/37` in Chrome Headless 153 |
| Algorithm32 and Flat32 type checks | pass |
| Flat32 build | pass |
| Runtime dependencies | accepted; 462 executable files, no contained, temporary-output, or external-repository runtime import |
| 1080p supported-hardware performance | accepted on RTX 2060/D3D11: 23.994 ms mean and 24.339 ms p95 atmosphere GPU time |
| Stellar resources | accepted by production WebGL recast: 152,000-byte split source textures, 2,001-entry 16-row palette, collision conservation, replacement, disposal, and context restoration |
| One-pixel lifecycle | accepted across view, resize, bounded DPR 2, mode replacement, context loss/restoration, failure preservation, disposal, and supersession |

The fresh immutable dependency report is
`tmp/production-algorithm32/distant-sun-shared-block-cache/qualification/2026-09-11T20-41-01-004Z-ddd5ce51-c86a-409d-b24d-c6d69f745713/result.json`.
The supported-hardware performance report is
`tmp/extraterrestrial/production-color-reset/p9/c6-performance-1080p-human-000001/verification-report.json`.
Logical resource sizes are contract evidence; WebGL2 does not expose a
portable driver-resident byte measurement, so none is inferred.
