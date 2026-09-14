# Bounded adaptive view evaluation

This C3 implementation changes the final view integration of fixed captured
fields. It does not change recurrence fields or supply a numerical reference.

`prepareAdaptiveViewPlan(buildRequest, probes)` creates local sparse field
coordinates and `rays`. Each ray contains `geometry` and reconstruction
`samples` indexed by `geometry.nodes[].id`. All levels 1/2/4/8/16 are prepared
inside each physical altitude segment. The nonnested union has exactly 31P
locations. `preparedQueryCount` reports this construction work separately.
Callers may remap local field coordinates into a larger capture union.

`prepareAdaptiveFields(pureOrders, factored)` creates the three cumulative
higher-order fields once per wavelength, using left-fold Float32 additions.
`createAdaptiveFieldEvaluator(spec, channel, ray, fields, interpolation)` binds
the common runtime callback. It evaluates medium once and reconstructs either
four scalar fields (raw J1) or five (two species lighting fields for J1).
The caller passes that same callback and cost declaration to both:

- `evaluateAdaptiveRay(ray.geometry, callback, options)` for the 4P/8P/16P
  total-query checkpoints;
- `evaluateUniformAdaptiveRay(ray.geometry, callback, level, options)` for an
  independently counted uniform 4/8/16 control.

Each invocation owns a fresh lazy cache. Adaptive initialization evaluates
level 1 and level 2 in every segment: 3P queried nodes and 2P active nodes.
Refining active level n to 2n costs 2n new midpoint queries. All discarded
coarse and trial values remain charged, so queried nodes equal
`2 * activeNodeCount - P`. A checkpoint stops when its highest-priority next
refinement cannot fit. It leaves any unused budget available to the next
checkpoint and does not fill it with cheaper lower-priority refinements.

The common N1-N4 mesh uses the maximum retrospective indicator
`T * (abs(Bfine - Bcoarse) + abs(Afine - Acoarse) * abs(F))`, divided by the
next refinement's query count. `T` is the current foreground attenuation and
`F` the current downstream grouped radiance. Coarse and fine are the two
already evaluated levels, not an uncounted forecast of the next level.
Ties prefer the lower active level, then the lower segment index. There is
no fitted convergence exponent or early exit on a small indicator.

Segment transfers use the same two half-step attenuation factors as the
ordinary view equation. The final result folds all active nodes directly
in observer order, with separate J1/H2/H3/H4 accumulators. J1 is added after
integration to produce grouped N1-N4. Transfer composition is used only for
priority calculations; it does not regroup final summation arithmetic.

`retainMesh` must be selected explicitly. Ordinary screen rays should retain
counters and radiances; full meshes belong only to frozen diagnostic probes.
Logical medium/reconstruction counters describe the callback above. They do
not claim actual instruction counts or hide preparation, field accumulation,
GPU construction or reference-evaluation work.

`adaptiveViewProof()` runs pure manufactured checks without allocating an
evidence record. It verifies support geometry, counts, caching, deterministic
prefixes, unused budgets, exact uniform arithmetic, transfer composition,
vacuum/slab/polynomial integrals, foreground attenuation and higher-order
sensitivity. A positive narrow bump missed by every permitted midpoint is
retained as an explicit aliasing counterexample. Thus neither the priority
indicator nor uniform 16 is an exact reference, and these proofs establish
no atmospheric accuracy improvement or predictable Kider gain.
