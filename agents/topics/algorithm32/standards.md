# Algorithm32 Standards

Status: living Algorithm32-specific authoring-standards owner. This document
collects rules that specialize the repository [Code Conventions]
(../standards/code-conventions.md), [Type Conventions](../standards/types.md),
and [JSDoc Conventions](../standards/jsdoc.md). A repository-wide convention
continues to apply unless this document records a deliberate Algorithm32
exception.

## Scope

Algorithm32 standards cover reusable conventions for expressing durable
Algorithm32 numerical and physical facts in code. They do not define runtime
behavior, cache or shader mechanics, production ownership, implementation
plans, experiment evidence, or source-specific design decisions. Each rule has
one canonical owner.

## Durable Physical Data And Units

Public and durable Algorithm32 quantities carry explicit units, physical
quantity, spectral basis, point/bin meaning, and provenance identity.

Property names do not encode units. A dimensional durable property uses a
neutral physical name and a unit-bearing value whose data includes both
`value` and `units`; for example, use
`altitude: { value, units }`, not `altitudeMeters: number`. Unit conversion
operates on that value type.

After an accepted unit-bearing value is normalized for local computation, the
local scalar can and should name its known unit, such as `altitudeMeters`. This
exception is limited to local computational bindings; it does not permit unit
suffixes on configuration, request, result, sample, serialized,
class, or other durable properties.

Radiometric names describe both the quantity and its stage in the data flow.
Configured channels and CPU direct-light samples expose `sourceIrradiance`
before atmospheric source-path attenuation, with that transmittance represented
separately. A shader value after source-path attenuation is
`incidentIrradiance`. Reserve `incidentRadiance` for directional radiance. The
retired incident-radiance cache is not a production contract.

## Related Specialized Owners

- [Production Architecture Boundaries](production/architecture-boundaries.md)
  owns production ownership and runtime-boundary rules.
- [Cache Design](cache/cache-design.md) currently owns cache-specific direct
  plans, storage, binding, assembly, reuse, and shader-resource behavior.
- [Production Current Dataflow](production/current-dataflow.md) currently
  records production physical-quantity flow.

## Future Additions

No additional Algorithm32-specific authoring convention is currently defined.
Add one here only when it is a reusable rule for writing code, rather than a
rule for runtime behavior, ownership, implementation, or evidence.

## Diagnostics

Diagnostics are applicable to isolated experimental code: focused proof
runners may collect and report the declared numerical, lifecycle, resource,
or browser observations needed to establish an experiment's claim. Production
diagnostics are deferred. Do not introduce production diagnostic APIs,
logging, report formats, or runtime instrumentation until their owner,
consumer, retention, and validation boundary are designed and accepted.

## Consolidation Rule

When adding an Algorithm32-specific authoring rule here, replace its former
copy with a link to this document. Keep detailed capability design,
implementation, behavior, ownership, and evidence facts in their existing
owners. Record an explicit exception whenever an Algorithm32 requirement
differs from a repository-wide standard.

## Open Organization Decisions

- Choose whether this document remains one concise Algorithm32 supplement or
  becomes an index for focused Algorithm32 authoring-standard documents.
- Establish an experimental diagnostic authoring standard for CPU, GPU, shader,
  browser, and resource-lifecycle proof code if the current policy needs more
  detail.
