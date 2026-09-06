# Production Color Reset Design

Focus: Engine conformance and production benchmark export.

Related owners: [color-celestial](../color-celestial/color-reset-design.md), [sources-provenance](../../pure-research/sources-provenance/color-reset-design.md).

## Qualification Invariants

- B1 Native15/Q30/cache values remain unchanged; aggregate RMSE remains within
  the established threshold and all six figures regenerate.
- Basic Bruneton remains independently selectable and authenticated.
- Candidate daylight and low-Sun output remains within the frozen preservation
  envelope.
- Identity filters reproduce the unfiltered path exactly.
- The 2,000-member roster, prefix, packet set, proxy partition, GPU readback,
  collision sums, and resource identities reproduce their accepted contracts.
- Stars remain exactly one pixel and use `q=24` without catalog-size tuning.
- Resize, DPR changes, context loss, replacement, supersession, and failures
  never publish mixed receiver, catalog, palette, filter, or Color generations.
- Production has no runtime import from the contained experiment.
