# Production Ambient-Light Design

Focus: Release gates, deployment inputs, and owner decisions.

Related owners: [runtime-integration](../runtime-integration/ambient-light-design.md), [appearance-review](../../poc-flat32/appearance-review/ambient-light-design.md).

## Acceptance Boundary

Contract and browser tests establish routing, lifecycle, and exact toggle
behavior. Matched images with the shader both enabled and bypassed are required
before judging whether the remaining ambient-light magnitude or chromaticity is
credible. Runs `000016` and `000017` are the matched plus-one-hour lighting-
bridge candidate; runs `000018` and `000019` are its matched sunset endpoint.
At plus one hour the bridged hemisphere intensity is
`0.000010643550067986926` and direct intensity is zero. At sunset they are
`0.0902917757354653` and `0.0017027433434433892`, respectively. The new
shader-on captures no longer saturate scene geometry. Owner appearance review,
including whether plus-one-hour geometry is now too dark, remains open. Visual
dissatisfaction is not permission to alter the atmosphere or Color algorithm.
