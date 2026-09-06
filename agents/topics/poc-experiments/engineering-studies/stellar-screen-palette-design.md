# Stellar Screen-Palette Cache Design

Focus: Measured alternatives and retained or rejected mechanisms.



## Optimization Path 2: Share Similar Palette Values

After exact per-pixel aggregation, qualified-close final spectra may share one
palette entry. Similarity is a physical native-15 error policy, not screenshot
similarity. It must bound at least:

- every channel's absolute residual;
- every materially nonzero channel's relative residual; and
- integrated spectral irradiance residual.

If this path is resumed, its simplest candidate is a standard-pipeline shader
compression pass after exact sparse aggregation:

1. retain each selected sparse representative's exact final spectrum;
2. assign qualified representatives with a deterministic bounded GPU
   algorithm; and
3. shader-write the remapped palette and matrix into a staging pair.

CPU palette construction or rewrite remains prohibited. Any future online GPU
compression must retain an exact per-pixel accumulator or equivalent
provenance; adding to an already approximated shared representative would
compound error.

Compression never removes a member or changes its pixel assignment. Exact
member-count and integrated-flux ledgers are evaluated before and after it.

This optimization is deferred and may not be necessary. No similarity policy
is selected. Do not add a compression implementation unless the project owner
explicitly resumes this path.


## Optimization Path 3: Reduce Matrix Index Width

After the final palette is complete, an optional standard-pipeline compaction
stage may construct a dense remap and shader-write a narrower successor matrix:

- if the remapped highest index is at most `255`, write an eight-bit unsigned-
  integer texture;
- otherwise retain the sixteen-bit unsigned-integer texture;
  or
- use the already selected wider representation when the qualified capacity
  requires it.

The threshold includes reserved entry zero. CPU rewriting/upload is not a
production path. Shader-side index-width rewriting changes no palette value or
pixel association and must reproduce every remapped index exactly.
