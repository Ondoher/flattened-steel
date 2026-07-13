# P0 Direct Packet Freeze v1

Status: approved design input for P0 F5. It freezes the direct comparison
packet and source closure; it authorizes no evaluator call.

## Packet

The spatial study stores and scores the full native-15 by W27 J2 packet at
each position node. There is no reduced wavelength or direction packet and no
per-component spatial cache.

| Field | Selected value |
| --- | --- |
| quantity | pure local scattering density J2 |
| spectral basis | native 15 scalar channels |
| outgoing domain | source-aligned W27 cubed sphere, 4,374 directions |
| incoming quadrature | source-oriented Fibonacci-34 with pinned order and weights |
| scalar precision | binary64 for direct authority; projected resident payload is R32F |
| node payload scalars | 4,374 * 15 = 65,610 |
| projected field bytes per node | 4 * 65,610 = 262,440 |

A query resolves an outgoing physical direction through the selected W27
geometry-owned chart. At chart seams, both node packets and the direct query
packet are transformed into the one declared compatible chart before
subtraction.

## Direct Evaluator Closure

| Path | SHA-256 | Role |
| --- | --- | --- |
| scripts/algorithm32-star/src/oracle/direct-j2.js | d2f191ae2b9ac22bd27f707dcb5293588eb2fd864766464affb15fdbff3ec56c | J2 authority |
| scripts/algorithm32-star/src/cache/l1-field.js | 70a86768f7185c138594392f0e8f1b34ccacc82981096bcdeef2753469f9c91e | direct incoming L1 |
| scripts/algorithm32-star/src/model/CanonicalAtmosphere.js | 005c9d69d0b4f8f368e336f0e4624938e28cc939bd69bd67bbde9fc6759bef06 | atmosphere |
| scripts/algorithm32-star/src/model/LocalPointSun.js | 198dec6140cfea317546733281fa96c74d4e79fff6031ff7a5406c1e1562366a | finite source |
| scripts/algorithm32-star/src/production-reference/light-sources/IncidentRadianceDirections.js | 9e3c810ca8ccf9239b154ca252609018c7a646d69a09affc74a880ddc067ceba | Fibonacci-34 |
| scripts/algorithm32-star/src/spectral/canonical-basis.js | 1c94db577042d24d5bf48e9c7a0c5868c092514a343a27ff3b7c66970981ac0a | native-15 |
| scripts/algorithm32-star/src/transport/SpectralCalculator.js | 66692a81df51ba0c962f5dc7846619d5094e23068d3b15d28cdd698bdd33c9ea | units and transport |

The complete recursive transitive closure is rehashed and checked before P2.
The direct primary, source transmittance, and construction transport controls
are each 15 intervals with endpoint-trapezoid integration. Ground is opaque
canonical-black; cap and rim are transparent exit followed by vacuum
continuation to the finite source.

## Approved Scope

This closes F5. It deliberately does not choose a reduced scoring packet:
all spatial approximation comparisons use the complete packet.

