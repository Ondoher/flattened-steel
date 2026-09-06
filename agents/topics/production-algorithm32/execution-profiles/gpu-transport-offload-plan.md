# Flat/Local GPU Transport Offload Plan

Focus: Complete execution configurations and their propagation.

Related owners: [caches](../caches/gpu-transport-offload-plan.md), [interaction-prototypes](../../poc-flat32/interaction-prototypes/gpu-transport-offload-plan.md), [qualification](../qualification/gpu-transport-offload-plan.md).

## Capability And Observability Rules

Required structural outcomes for the default preset:

- packed Flat transport storage is zero;
- no CPU transport query/tap loop runs in the production planner; and
- `J2 -> L2` and `J3 -> L3` use the fused GPU contributor.

The implemented path requires WebGL2, fragment `highp` float/int arithmetic,
R32F array render targets, float sampling through `sampler2D` and
`sampler2DArray`, `texelFetch`, a texture width of at least 4,374 for the W27
field, and at least 15 array layers for native-15. It no longer requires the
indexed interim's 16,384-wide transport textures. The conformance environment
reported a 16,384 maximum texture size, 2,048 array layers, and
`EXT_color_buffer_float`; supported-hardware confirmation remains diagnostic
follow-up.

The completed implementation determines its required GPU capabilities. Record
the WebGL2, R32F array-render-target, float-sampling, precision, texture
size/layer, and shader facts it actually uses. Timing, compilation,
responsiveness, lifecycle, visual, and resource observations are diagnostics
for later optimization; they are not quality-selection inputs or pass/fail
budgets in this transaction.

If one fused layer makes the selected preset unacceptably slow, report that
experience or let the user choose a separately declared lower preset. A future
change may investigate bounded position-row submissions while preserving one
wavelength output and exact math. Do not combine all wavelength layers into
one uninterruptible draw.

If compilation dominates, separately investigate canonical positional input
sampler names so the `L2` and `L3` programs can share source and compiled
program identity. Do not broaden `CachePassAssembler` during the initial
cutover without measured need.

If GPU execution performs poorly, profile stencil search, random W27 reads,
exponentials, and duplicate shader compilation before proposing extra storage.
A preliminary GPU pass that recreates the padded 165 MB kernel is not an
accepted fallback. Any compact GPU-kernel alternative requires a separate
memory/performance comparison and explicit authorization.
