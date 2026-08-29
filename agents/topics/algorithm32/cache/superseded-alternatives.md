# Superseded Cache Alternatives

Status: closed alternatives; not implementation options.

The current cache is the Native48-with-`0 m`-boundary,
reflection-completed-Fibonacci-68 incoming, W27 outgoing, cumulative-density
design described by this topic. The following alternatives remain closed and
must not reappear as expedient implementation fallbacks.

| Closed alternative | Current disposition |
| --- | --- |
| Fibonacci-68/four-nearest outgoing point cloud | Rejected as an outgoing lookup because coherent angular cells remained visible. It supplies diagnostic evidence only. |
| Prior Bruneton-invariant `(r, mu, mu_s, nu, branch)` implementations | Superseded as implementations and evidence. The owner-directed [solar-zenith cache design](solar-zenith-cache-design.md) now selects an independently constructed Native15 point-local cumulative-density field addressed by altitude, local solar zenith, and complete outgoing direction. Its [distant-Sun plan](distant-sun-solar-zenith-cache-plan.md) may reuse current contained actual-point solver machinery but may not treat the closed Bruneton-invariant lane as acceptance evidence. |
| Bruneton 512-direction incoming quadrature and 50-interval transport | Belonged to the superseded invariant lane; not numerical controls for Algorithm32's selected cache. |
| Phase-baked primary field on Bruneton's sourced scattering dimensions | Rejected. The stored quantity did not match the quantity for which those dimensions and mappings were published. |
| Phase-factored composite transmittance plus `J2+` invariant cache | Superseded with its parent lane. Its compact transmittance evidence does not select a current production representation. |
| Retrofitting inferred uniform altitude bins or a new spatial coordinate into the implemented Native48 density/final-view correction | Excluded from that correction. Final view lookup uses the actual retained node coordinates. This does not constrain the separately qualified successor grid in the [solar-zenith cache design](solar-zenith-cache-design.md). |

## Durable Lessons

- Published dimensions and interpolation rules are evidence only for the
  physical quantity and factorization they actually store. A derived
  Algorithm32 field must be validated under its own name and must not be
  described as published Bruneton output.
- Source/horizon discontinuities, branch identity, and highp interpolation
  are real design concerns, but observations from a superseded mapping do not
  import that mapping into the current cache.
- Direction indices are storage coordinates, not physical identities shared
  between domains.
- Exact GPU arithmetic controls and off-node reconstruction error are separate
  measurements and require separate tolerances.

Reopening any closed alternative requires a new preimplementation research
question, frozen decision rule, standalone evidence, and an explicit decision
to replace part of the selected contract. An implementation or performance
problem alone does not reopen it.

Detailed experiment histories are retained in the
[topic-documentation archive](../../../../archives/topic-documentation-archive-2026-07-19.zip).
