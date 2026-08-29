# Active Topic

Current active topic: `algorithm32-solar-zenith-cache-production-adoption`.

Canonical entry document:
[Solar-Zenith Cache Production Adoption](algorithm32/production/solar-zenith-cache-adoption-plan.md).

Qualified numerical authority:
[Distant-Sun Solar-Zenith Cache Design](algorithm32/cache/solar-zenith-cache-design.md).

Completed contained execution authority:
[Distant-Sun Point-Local Solar-Zenith Scene-Cache Plan](algorithm32/cache/distant-sun-solar-zenith-cache-plan.md).

Implemented production baseline:
[Algorithm32 Production](algorithm32/production/README.md).

## Immediate Focus

The contained Native48/Z180/W27/F68/N4/Q30 point-local distant-Sun cache is
qualified through P10. The active topic is now its production adoption.

Begin with PA0: a read-only migration inventory mapping the qualified
point-local compiler, cache, lookup, Q30 integration, exact seam codec, and
lifecycle behavior onto the current production architecture. Identify every
affected owner, consumer, file, verification lane, replacement boundary, and
rollback seam before implementation.

Production has not changed. The current containment policy still requires new
implementation under `scripts/extraterrestrial/` and generated evidence under
`tmp/extraterrestrial/`. Obtain explicit owner authorization before the first
write to `src/algorithm32`, `src/flat32`, or an application surface.

## Minimal Reload Sources

Read these files in order and no others during bootstrap:

1. [Repository workflow instructions](../../AGENTS.md)
2. [Production-adoption plan](algorithm32/production/solar-zenith-cache-adoption-plan.md)
3. [Qualified solar-zenith design](algorithm32/cache/solar-zenith-cache-design.md)
4. [Algorithm32 production status](algorithm32/production/README.md)
5. [Implemented cache contract](algorithm32/cache/cache-contract.md)
6. [Production current dataflow](algorithm32/production/current-dataflow.md)
