# Completed Production Algorithm32 Plan Archive

Status: the 2026-09-11 production Algorithm32 engineering release plans are
retired. Current behavior and evidence remain owned by the focused design,
contract, qualification, and reference records. Deferred first-MVP work remains
owned by the [MVP requirements](../production-app/mvp/requirements.md).

The exact retired plan bytes are preserved under the repository-local ignored
archive root:

```text
archives/topics/production-algorithm32-release-20260911/
```

The archive manifest records every original path, byte count, SHA-256 identity,
and restoration path. The files remain available in this workspace without
making historical plans current guidance. A clone that does not contain the
ignored archive can recover the tracked originals from Git history.

## Current Owners

| Completed plan family | Current owner |
| --- | --- |
| Point-local compiler promotion | [Cache status](../production-algorithm32/caches/README.md), [shared runtime qualification](../production-algorithm32/caches/shared-runtime-qualification.md), and [production qualification](../production-algorithm32/qualification/color-reset-production-qualification.md) |
| Shared-block cache production and rollout | [Optimization design](../production-algorithm32/caches/distant-sun-cache-optimization-design.md) and [shared runtime qualification](../production-algorithm32/caches/shared-runtime-qualification.md) |
| Flat32 one-degree cache hookup | [Shared runtime qualification](../production-algorithm32/caches/shared-runtime-qualification.md) and [release qualification](../production-app/release/color-reset-production-qualification.md) |
| Production B1-B3 wiring | [Official experiment register](../../../references/experiments.md), [benchmark qualification](../poc-experiments/benchmarks/color-reset-production-qualification.md), and [release qualification](../production-app/release/color-reset-production-qualification.md) |
| Color Reset P0-P9 | [Color/celestial current dataflow](../production-algorithm32/color-celestial/current-dataflow.md), [release qualification](../production-app/release/color-reset-production-qualification.md), and [promotion manifest](../production-algorithm32/qualification/color-reset-promotion-manifest.md) |
| Deferred MVP gates | [M1-M3 requirements](../production-app/mvp/requirements.md) |

## Verified Original Identities

| Original repository path | Bytes | SHA-256 |
| --- | ---: | --- |
| `agents/topics/poc-experiments/benchmarks/production-b-experiment-wiring-plan.md` | 5183 | `303f3343612baaa7409912e75925c5a87af6e72b525c2c8c773481e563d3a933` |
| `agents/topics/production-algorithm32/caches/distant-sun-cache-optimization-plan.md` | 25476 | `c641669b6749335fa046c050beb01c6d789d6a110d037f4d91f13f7593434006` |
| `agents/topics/production-algorithm32/caches/point-local-compiler-promotion-plan.md` | 28179 | `cd8612e0c20a15757c06fdb78b8c773dcc29affbae5bb598af6f3f55b9238bed` |
| `agents/topics/production-algorithm32/caches/shared-runtime-rollout.md` | 6177 | `e41d42a55d7139217009163efbd891fa492ea4d6580c24a5ac7f13cf1d2bfde3` |
| `agents/topics/production-algorithm32/color-celestial/color-reset-implementation-plan.md` | 14234 | `751853bfd7c3128e0efd26fae408fac457320af3288ba56325afdc7a5ac18e9a` |
| `agents/topics/production-algorithm32/qualification/flat32-one-degree-cache-hookup-plan.md` | 3521 | `e57b0085896880f6e12a7118391a72a59fafe979132a2017cb8425e0ee0d276a` |
| `agents/topics/production-algorithm32/qualification/production-b-experiment-wiring-plan.md` | 21650 | `37fd1452374a1fe239b2b449730abff091f4db08be872836a791a623d1e8a005` |
| `agents/topics/production-app/product-behavior/color-reset-implementation-plan.md` | 1037 | `3dc40f6e74e3d765505e207f7cfbcb6132895bbd6be298dc14bede79d91629d6` |
| `agents/topics/production-app/release/color-reset-implementation-plan.md` | 9586 | `17e1b9c059f6f18117333cf299d20ebc5b7e824e8f0cfeb66c4d982fd9e140` |
| `agents/topics/production-app/runtime-integration/color-reset-implementation-plan.md` | 4444 | `f956c2b7bda1ece2d37df431d9242b81e38893a264a0647a00348f1bcb40dbfd` |
| `agents/topics/production-app/runtime-integration/flat32-one-degree-cache-hookup-plan.md` | 3060 | `917ddc549e7e4635c5dadafefe94baa9e0e1a3f0e0fce0cb0f557687049323a7` |
| `agents/topics/pure-research/sources-provenance/color-reset-implementation-plan.md` | 3549 | `a069f7d1b8cfe091df8218df3468f3a543cb10ffcdb4f8084c68321000b62477` |

The archive was populated by copy, each destination was read back and
SHA-256-compared, and only then were the original working files removed.
