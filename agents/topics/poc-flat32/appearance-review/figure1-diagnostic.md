# Algorithm32 Figure 1 Diagnostic

Focus: Exploratory captures and qualitative candidate review.

Related owners: [benchmarks](../../poc-experiments/benchmarks/figure1-diagnostic.md).

## Inspection Contract

An accepted diagnostic verifies:

- all expected rows, columns, labels, scene orientations, fisheye boundaries,
  annotations, and native panel sizes;
- no missing, clipped, or resampled panel;
- the exact local calculation descriptor and output transform;
- hashes for published inputs, local panels, and the composed artifact; and
- explicit visual observations without converting resemblance into a metric.

The diagnostic may expose coherent cells, seams, rings, horizon steps, or
other structured artifacts missed by pooled numeric summaries. Any such
observation must be localized and tested at the pre-display spectral boundary
before it changes a numerical design.
