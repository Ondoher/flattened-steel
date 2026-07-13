# P0 Source And Boundary Freeze v1

Status: approved design input for P0 F1--F2. This freezes physical source facts,
slice cases, and the whole-flat-world boundary. It authorizes no physical
evaluation.

## Source Owner

Flat32 owner: src/flat32/FlatLocalMode.js
SHA-256: 69adcbd65ed29253d61ee1c34349b978fbd63e02aac53fd9e7a602760a72ffb7

| Fact | Value |
| --- | --- |
| source height | 4,800,000 m |
| reference distance | 4,800,000 m |
| reference spectral incident scale | 1 |
| radius clamp | 25,749.504 m |
| distance falloff | enabled |
| spectral basis | Flat32 native-15 irradiance |

Pinned Star finite-source primitive:
scripts/algorithm32-star/src/model/LocalPointSun.js
SHA-256: 198dec6140cfea317546733281fa96c74d4e79fff6031ff7a5406c1e1562366a

## Source Cases

Every case uses source position [a, 0, 4,800,000] m and builds a separate
cache. The map center is [0,0].

| sourceCaseId | a (m) | Mirror |
| --- | ---: | --- |
| centered | 0 | self under centered rotational reduction |
| near-center-east-1m | 1 | near-center-west-1m |
| near-center-west-1m | -1 | near-center-east-1m |
| nominal-east-4800km | 4,800,000 | nominal-west-4800km |
| nominal-west-4800km | -4,800,000 | nominal-east-4800km |
| outer-east-16000km | 16,000,000 | outer-west-16000km |
| outer-west-16000km | -16,000,000 | outer-east-16000km |
| near-rim-east | 19,915,114.442035925 | near-rim-west |
| near-rim-west | -19,915,114.442035925 | near-rim-east |

The reflection control transforms position and outgoing direction together:
(x,y,z,omegaX,omegaY,omegaZ) -> (x,-y,z,omegaX,-omegaY,omegaZ).
The initial vertical slice is y=0. East/west source cases remain independently
constructed and compared rather than silently deduplicated.

## Boundary Owner

The physical boundary is the selected flat-world atmosphere boundary:

| Fact | Value |
| --- | --- |
| frame | north-pole-aeqd-fixed-map-z-up-meters-v1 |
| map radius R | 20,015,114.442035925 m |
| atmosphere apex H | 100,000 m |
| ground | finite opaque disc |
| cap and rim | transparent atmosphere exit |
| medium | pinned canonical native-15 atmosphere |

The complete slice domain is -R <= x <= R and 0 <= z <= h(abs(x)), with
p(x,z)=(x,0,z). There is no observer, camera, ray, cache-radius, or
source-distance cap.

## Clamp Proof

For every source case, the smallest possible source-to-atmosphere distance is
the centered cap point:

    4,800,000 m - 100,000 m = 4,700,000 m

It exceeds the radius clamp by 4,674,250.496 m. The clamp is inactive over
the complete domain. Binary64 geometry uses the inherited absolute-or-relative
gate max(1e-9 m, 1e-12 * scale); analytic ground/cap/rim rules decide ties.

## Approved Scope

This file closes F1 and F2. The source and boundary bytes, this file, and the
shell-family manifest must be rehashed before P1.

