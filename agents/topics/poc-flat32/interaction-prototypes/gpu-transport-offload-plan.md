# Flat/Local GPU Transport Offload Plan

Focus: Unselected control and quality-selection interactions.

Related owners: [caches](../../production-algorithm32/caches/gpu-transport-offload-plan.md), [qualification](../../production-algorithm32/qualification/gpu-transport-offload-plan.md), [execution-profiles](../../production-algorithm32/execution-profiles/gpu-transport-offload-plan.md).

## User-Selected Quality Presets

Status: retained interaction policy; lower-preset availability and presentation
remain unselected. This is not the current engine-default inventory. The
[execution-profile owner](../../production-algorithm32/execution-profiles/README.md)
and [cache owner](../../production-algorithm32/caches/README.md) define current
production profiles.

Flat/local quality is selected by the user through named presets. A preset is
one complete, immutable construction profile: maximum scattering order,
position and direction domains, transport interval count, and every other
fact that changes the cache result or its resource use. The selected preset
is a direct plan and reuse-key input. Changing it constructs a replacement
cache; the application never silently substitutes a lower preset.

The original offload plan's fixed-profile and transport authorities are
retained in its archive; they are not relabeled as current defaults by this
prototype note. Lower presets are intentional approximations, not failed
instances of the default. They require fixed declared parameters and must
compile, construct, remain finite and nonnegative, preserve lifecycle and
publication behavior, and report their selected identity. They do not require
numerical or visual parity with the default authority. Do not measure,
compare, threshold, or otherwise qualify a lower preset's correctness loss
against the default preset; only the default receives authority comparison.

This transaction does not invent lower preset values or select them from
hardware measurements. Their availability and user-facing presentation are
application decisions outside this plan. The implementation determines the
GPU capabilities it actually requires; capability observations do not permit
silent quality substitution.
