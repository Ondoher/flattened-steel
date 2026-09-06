# Color Reset Production Promotion Manifest

Focus: Engine conformance and production benchmark export.

Related owners: [color-celestial](../color-celestial/color-reset-promotion-manifest.md), [sources-provenance](../../pure-research/sources-provenance/color-reset-promotion-manifest.md).

## Qualification Matrix

- Host: established Windows production lane.
- Browser: current pinned Chrome Headless executable; P0/P1 observed
  `153.0.0.0` reporting Windows 10.
- Graphics: WebGL2 through ANGLE/D3D11 on the NVIDIA GeForce RTX 2060
  reference path.
- Full-frame appearance/performance: 1920 by 1080 drawing buffer at DPR 1.
- DPR 2: bounded viewport for one-pixel occupancy, screen-index rebuild,
  resize, context, and lifecycle gates; drawing buffer no larger than 1920 by 1080.
- Explicit non-claims: arbitrary browser, GPU, operating system, viewport,
  DPR, and 4K performance.
