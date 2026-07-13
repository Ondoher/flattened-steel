# Algorithm32 Whole-Algorithm Benchmark Conclusion

Whole-algorithm classifications: Algorithm32: **FAVORABLE**; Algorithm32-J2: **FAVORABLE**; Algorithm32-J3: **FAVORABLE**; Algorithm32-J4: **FAVORABLE**; Algorithm32-J5: **FAVORABLE**.

This document owns the retained native-15 evaluation and its piecewise-constant
15-to-40 projection. The active shared B1--B3 reports and figures now contain
the later direct-40 paper-profile rerun. Its separate current conclusion is
[Algorithm32 Paper-Profile Whole-Algorithm Conclusion](algorithm32-paper-profile-whole-algorithm-conclusion.md).

## Subjects and decision rules

Algorithm32 Default is the unchanged production comparison boundary. The comparison subjects `Algorithm32₂`, `Algorithm32₃`, `Algorithm32₄`, and `Algorithm32₅` use the retained W27 outgoing cache, pinned 34-direction incoming quadrature, 48 physical altitude nodes, view-only actual-node altitude interpolation, and cumulative scattering through their named maximum order. The provenance run id and complete numerical-control packet below identify each evaluated subject.

Each subject retains its native 15-channel spectral-radiance packet and applies the same predeclared piecewise-constant projection onto the Bruneton comparison coordinates. Each is classified independently with its own pre-result judgment record; the comparator thresholds are identical. Adding J2 through J5 does not replace or retroactively alter the Default assessment.

Subsequent project policy selects cumulative J4 as Algorithm32's default going forward. This document preserves the preselection comparison and its stable subject labels; J5 remains retained comparison evidence, not the default.

Under the current nomenclature, plain `Algorithm32` means order 4, while a non-default order is written with a subscript, such as `Algorithm32₂` or `Algorithm32₅`; `Algorithm32₄` is valid when the order needs to be explicit. The hyphenated names below remain unchanged stable evidence identifiers.

| stable id | role | controls | sealed run | B1 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | B2 RMSE (W m^-2) | B3 RMSE (mW m^-2 sr^-1 nm^-1) | classification |
| --- | --- | --- | --- | ---: | ---: | ---: | --- |
| Algorithm32 | unchanged comparison baseline | 40/20/34/48 | 000074-production-algorithm32-kider-b1-b2-b3-boundary | 14.635671 | 6.181836 | 14.635671 | favorable |
| Algorithm32-J2 | cumulative scattering through order 2 | 40/20/34/48; W27/4374/Jthrough2; view-only-linear-physical-altitude-over-actual-nodes | 000152-algorithm32-n-order-j2-kider-b1-b2-b3-boundary | 14.311678 | 3.872070 | 14.311678 | favorable |
| Algorithm32-J3 | cumulative scattering through order 3 | 40/20/34/48; W27/4374/Jthrough3; view-only-linear-physical-altitude-over-actual-nodes | 000153-algorithm32-n-order-j3-kider-b1-b2-b3-boundary | 12.991564 | 2.237308 | 12.991564 | favorable |
| Algorithm32-J4 | cumulative scattering through order 4 | 40/20/34/48; W27/4374/Jthrough4; view-only-linear-physical-altitude-over-actual-nodes | 000151-algorithm32-n-order-j4-kider-b1-b2-b3-boundary | 12.810328 | 1.914404 | 12.810328 | favorable |
| Algorithm32-J5 | cumulative scattering through order 5 | 40/20/34/48; W27/4374/Jthrough5; view-only-linear-physical-altitude-over-actual-nodes | 000154-algorithm32-n-order-j5-kider-b1-b2-b3-boundary | 12.795853 | 1.834969 | 12.795853 | favorable |

## Comparison with unchanged Algorithm32

Signed changes below are candidate minus Default. A negative value is a lower error for that aggregate; a positive value is a higher error. These paired aggregate changes do not establish that every direction, wavelength, or time changes in the same way.

| candidate | B1 RMSE change | B1 percent change | B2 RMSE change | B2 percent change |
| --- | ---: | ---: | ---: | ---: |
| Algorithm32-J2 | -0.323993 | -2.21% | -2.309767 | -37.36% |
| Algorithm32-J3 | -1.644107 | -11.23% | -3.944528 | -63.81% |
| Algorithm32-J4 | -1.825343 | -12.47% | -4.267432 | -69.03% |
| Algorithm32-J5 | -1.839818 | -12.57% | -4.346867 | -70.32% |

## Adjacent n-order changes

These rows compare each completed cumulative n-order candidate with the immediately preceding n-order candidate. A negative value is a lower measured error. The shrinking J3-to-J4 and J4-to-J5 changes are evidence of diminishing in-sample improvement on these observables; they do not prove convergence or select a release order.

| transition | B1 RMSE change | B1 percent change | B2 RMSE change | B2 percent change |
| --- | ---: | ---: | ---: | ---: |
| Algorithm32-J2 -> Algorithm32-J3 | -1.320114 | -9.22% | -1.634762 | -42.22% |
| Algorithm32-J3 -> Algorithm32-J4 | -0.181236 | -1.40% | -0.322904 | -14.43% |
| Algorithm32-J4 -> Algorithm32-J5 | -0.014475 | -0.11% | -0.079435 | -4.15% |

## B1 -- directional spectral radiance

All five complete 55,080-value boundaries are required to be finite and nonnegative. Each aggregate uses all 42,687 scored values; the three time rows are the values printed by the paper for direct peer-threshold comparison.

| criterion | Algorithm32 observed | result | Algorithm32-J2 observed | result | Algorithm32-J3 observed | result | Algorithm32-J4 observed | result | Algorithm32-J5 observed | result | favorable maximum | limited maximum |
| --- | ---: | --- | ---: | --- | ---: | --- | ---: | --- | ---: | --- | ---: | ---: |
| Aggregate RMSE | 14.635671 | favorable | 14.311678 | favorable | 12.991564 | favorable | 12.810328 | favorable | 12.795853 | favorable | 18.300000 | 41.500000 |
| 10:15 RMSE | 12.205531 | favorable | 12.566513 | favorable | 11.414564 | favorable | 11.273115 | favorable | 11.254471 | favorable | 17.700000 | 39.900000 |
| 11:15 RMSE | 14.334822 | favorable | 13.720913 | favorable | 12.287330 | favorable | 12.044488 | favorable | 11.990547 | favorable | 18.700000 | 42.800000 |
| 13:15 RMSE | 15.334947 | favorable | 14.696935 | favorable | 12.893913 | favorable | 12.542795 | favorable | 12.463508 | favorable | 17.400000 | 40.500000 |

The native-15 numerical result is retained by the tables in this document and
the sealed run artifacts. The shared extended Figure 5 path has since been
regenerated with only the selected direct-40 paper-profile J4 boundary,
displayed as Algorithm32, and must not be cited as a native-15 figure.

## B2 -- hemispherical diffuse-sky irradiance

| criterion | Algorithm32 observed | result | Algorithm32-J2 observed | result | Algorithm32-J3 observed | result | Algorithm32-J4 observed | result | Algorithm32-J5 observed | result | favorable maximum | limited maximum |
| --- | ---: | --- | ---: | --- | ---: | --- | ---: | --- | ---: | --- | ---: | ---: |
| RMSE | 6.181836 | favorable | 3.872070 | favorable | 2.237308 | favorable | 1.914404 | favorable | 1.834969 | favorable | 12.018282 | 20.496808 |
| Absolute bias | 5.903324 | favorable | 3.457431 | favorable | 1.387249 | favorable | 0.766089 | favorable | 0.537648 | favorable | 11.941587 | 20.440403 |
| Worst absolute residual | 8.906779 | favorable | 6.312926 | favorable | 4.219415 | favorable | 3.557001 | favorable | 3.298635 | favorable | 14.100659 | 23.056024 |

Algorithm32: worst residual at 12:30; signed energy bias -5.903324 W m^-2.
Algorithm32-J2: worst residual at 12:30; signed energy bias -3.457431 W m^-2.
Algorithm32-J3: worst residual at 12:30; signed energy bias -1.387249 W m^-2.
Algorithm32-J4: worst residual at 12:30; signed energy bias -0.766089 W m^-2.
Algorithm32-J5: worst residual at 12:30; signed energy bias -0.537648 W m^-2.

B2 remains an integral transform of the B1 measurement field, not an independent instrument dataset. Its result can expose a different aggregate response to directional changes, but it is not an additional independent vote.

## B3 -- matched-atmosphere solver context

| value | Algorithm32 | Algorithm32-J2 | Algorithm32-J3 | Algorithm32-J4 | Algorithm32-J5 |
| --- | ---: | ---: | ---: | ---: | ---: |
| B1 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | 14.635671 | 14.311678 | 12.991564 | 12.810328 | 12.795853 |
| B3 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | 14.635671 | 14.311678 | 12.991564 | 12.810328 | 12.795853 |
| B3 minus B1 (mW m^-2 sr^-1 nm^-1) | +0.000000246 | +0.000000433 | -0.000000037 | -0.000000155 | +0.000000004 |
| consistency tolerance | 0.000001 | 0.000001 | 0.000001 | 0.000001 | 0.000001 |
| published libRadtran coarse RMSE | 11.48 | 11.48 | 11.48 | 11.48 | 11.48 |
| candidate / libRadtran RMSE ratio | 1.274884 | 1.246662 | 1.131669 | 1.115882 | 1.114621 |
| declared mismatch fields | 9/9 | 9/9 | 9/9 | 9/9 | 9/9 |
| inherited classification | favorable | favorable | favorable | favorable | favorable |

Each B1/B3 consistency check must pass, and each subject retains its own complete mismatch map. B3 is the same-measurement scalar observable as B1; it adds fuller-solver pedigree and declared model-difference context rather than an independent acceptance vote.

## Exact profile evidence

The hashes below bind each stable candidate id to its native and projected boundaries, provenance record, judgment rules, and mismatch map. The subjects do not share or overwrite candidate artifacts.

| profile | artifact role | path | bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
| Algorithm32 | native 15-channel boundary | references/results/experiments/b1-directional-sky-radiance/algorithm32-native-15.tsv | 460845 | `b334f91cfcdfb3092a31082b32799e9aaadd13590db391c806187827700783a8` |
| Algorithm32 | B1/B2 projected boundary | references/results/experiments/b1-directional-sky-radiance/algorithm32-proposed.tsv | 1184605 | `64a4ace30fd712ebdbe6c4386a7bcc495ec3f631f8ad12704e726a24bcbe97e7` |
| Algorithm32 | B3 prefix cube | references/results/experiments/b3-matched-atmosphere-solver/algorithm32-proposed-cube.json | 875029 | `eb9298b777ce5f374726f9c40e33be1b8085df6ed4d9a454518f7c7876d7b6be` |
| Algorithm32 | boundary provenance | references/results/experiments/b1-directional-sky-radiance/algorithm32-boundary-provenance.json | 2284 | `04f9f9787093cf7788a0a0f87e94fb665b3d46d9c4e047cda2359d94042bdc79` |
| Algorithm32 | judgment rules | scripts/experiments/whole-algorithm-judgment-rules.json | 3919 | `5b5624b39b917c750ca6329ff7b9b74dcdeabd56dcee911d93a9d15893d2fd27` |
| Algorithm32 | B3 mismatch map | scripts/experiments/b3-matched-atmosphere-solver/algorithm32-mismatch-map.json | 2765 | `eb871ea75fd79f5bc8fe155a059c297a9a3a93a45399bf4e613835fcd12f3ee1` |
| Algorithm32-J2 | native 15-channel boundary | references/results/experiments/b1-directional-sky-radiance/algorithm32-j2-native-15.tsv | 460432 | `3dc9199ba8cff23f50b521785526eb3e51af570b0d5f600055c24021a67d1354` |
| Algorithm32-J2 | B1/B2 projected boundary | references/results/experiments/b1-directional-sky-radiance/algorithm32-j2-proposed.tsv | 1183509 | `ddfc4e8072a2f1fb3ba130f210d5d0c1cbff2d411c4663e1abf9a24e269bd72b` |
| Algorithm32-J2 | B3 prefix cube | references/results/experiments/b3-matched-atmosphere-solver/algorithm32-j2-proposed-cube.json | 874366 | `02cdc3be224d88274a723a6c8ad255c447d0173b7e2d19625bdf724e4127c545` |
| Algorithm32-J2 | boundary provenance | references/results/experiments/b1-directional-sky-radiance/algorithm32-j2-boundary-provenance.json | 2777 | `939b12908e50d248faa4328aa50253fa43777f3b2f03274a36483329ff6fdedf` |
| Algorithm32-J2 | judgment rules | scripts/experiments/whole-algorithm-j2-judgment-rules.json | 4277 | `a0c74bac293270ac3eb52d01debb8d6ab694c94d4793c2284be64ab748fc4482` |
| Algorithm32-J2 | B3 mismatch map | scripts/experiments/b3-matched-atmosphere-solver/algorithm32-j2-mismatch-map.json | 3282 | `6cce16b2b3ac1f4e9fe11e1dda48a3506333ce736507bc134ff1744b341e3642` |
| Algorithm32-J3 | native 15-channel boundary | references/results/experiments/b1-directional-sky-radiance/algorithm32-j3-native-15.tsv | 460144 | `567619009a9452a1377dbc4af43650264768dec4c7d2dea491e28ba9471fd404` |
| Algorithm32-J3 | B1/B2 projected boundary | references/results/experiments/b1-directional-sky-radiance/algorithm32-j3-proposed.tsv | 1182749 | `adbee8d268275d3279c59a98942443179c06a07fdce9eb4634145db1d0a35fa0` |
| Algorithm32-J3 | B3 prefix cube | references/results/experiments/b3-matched-atmosphere-solver/algorithm32-j3-proposed-cube.json | 873936 | `f416770807f913f093d9fae27a2c7424ef081af3a97c754e85b24d80465a45d5` |
| Algorithm32-J3 | boundary provenance | references/results/experiments/b1-directional-sky-radiance/algorithm32-j3-boundary-provenance.json | 2777 | `9ef959fa49362443d04abd5b7927e20655ff951f6c73d52df98892b5d4d86182` |
| Algorithm32-J3 | judgment rules | scripts/experiments/whole-algorithm-j3-judgment-rules.json | 4277 | `87424c0a401b88188069690f64769b4905cab9aa789728f6f845fee60329d6fa` |
| Algorithm32-J3 | B3 mismatch map | scripts/experiments/b3-matched-atmosphere-solver/algorithm32-j3-mismatch-map.json | 3287 | `24d00d22526b8b0cceb168718852e4cd0ef9d18794466a790173942656c545f9` |
| Algorithm32-J4 | native 15-channel boundary | references/results/experiments/b1-directional-sky-radiance/algorithm32-j4-native-15.tsv | 459998 | `e3707ac3d2fea3efade6dc3eba4f41ed66494221037a7eea2241aa0c061d6bd2` |
| Algorithm32-J4 | B1/B2 projected boundary | references/results/experiments/b1-directional-sky-radiance/algorithm32-j4-proposed.tsv | 1182354 | `be0c00c992a57ca09fb56f05139dbc76b67e487befa51a32adb8907b6b57e0f9` |
| Algorithm32-J4 | B3 prefix cube | references/results/experiments/b3-matched-atmosphere-solver/algorithm32-j4-proposed-cube.json | 873638 | `b52ec040c14dc8d548b099d982baab66dbec476270cf5b9d54b1bb4256b3b1eb` |
| Algorithm32-J4 | boundary provenance | references/results/experiments/b1-directional-sky-radiance/algorithm32-j4-boundary-provenance.json | 2777 | `826784c1b6c8f104c6e1fc0cb0e1c750e51e02c4e64c7c9ef5e0258357ca59a6` |
| Algorithm32-J4 | judgment rules | scripts/experiments/whole-algorithm-j4-judgment-rules.json | 4277 | `7575c7af2c0f121971e1f7591bfd26ba8985f51ce86851b30977fc0073048f8c` |
| Algorithm32-J4 | B3 mismatch map | scripts/experiments/b3-matched-atmosphere-solver/algorithm32-j4-mismatch-map.json | 3292 | `a5bd1cae9223e632afe586d9a7092a7768161d766962c5ec372ad5bdedbe5575` |
| Algorithm32-J5 | native 15-channel boundary | references/results/experiments/b1-directional-sky-radiance/algorithm32-j5-native-15.tsv | 459929 | `a54768f9abc7e6f1ed718188ac80934e1e93a56dd718ae4e2425ced9ea298382` |
| Algorithm32-J5 | B1/B2 projected boundary | references/results/experiments/b1-directional-sky-radiance/algorithm32-j5-proposed.tsv | 1182177 | `2c71eadabc7a97c7e482fe06a83fc5dd2a4ef0550c16dbef30cff686c920b9af` |
| Algorithm32-J5 | B3 prefix cube | references/results/experiments/b3-matched-atmosphere-solver/algorithm32-j5-proposed-cube.json | 873577 | `6a432d0df7e86ada456eace42d0e7727125f941dfe187a1b75064c68a99f0db6` |
| Algorithm32-J5 | boundary provenance | references/results/experiments/b1-directional-sky-radiance/algorithm32-j5-boundary-provenance.json | 2777 | `147d9f4fc82ae592e694dc634314a84fca5c9bc3c524b011a633948eabad80f7` |
| Algorithm32-J5 | judgment rules | scripts/experiments/whole-algorithm-j5-judgment-rules.json | 4277 | `0f2b1a694ae436ec809d8aa0a5a84aa653510f2ef7c5e0802f05ca71d1e7239f` |
| Algorithm32-J5 | B3 mismatch map | scripts/experiments/b3-matched-atmosphere-solver/algorithm32-j5-mismatch-map.json | 3297 | `5f792f637ad7f2f0fee3630c48b50c281e89672d7cbf23370477640983e1282c` |

## Generated benchmark reports and figure

| profile | artifact role | path | bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
| shared | B1 result | references/results/experiments/b1-directional-sky-radiance/result.md | 26363 | `c2d3b9eba2bbef4eb92838f7ba37fcfb2b4925dbcc738f8b07e047a6758a42ce` |
| shared | B1 Figure 5 chart | references/results/experiments/b1-directional-sky-radiance/figures/b1-figure5-relative-error-domes.svg | 213541 | `2b9a98ea399f78132b62815558c5013fe1ded86c637be7cfc1ae5514f2a3d379` |
| shared | B2 result | references/results/experiments/b2-hemispherical-sky-irradiance/result.md | 17197 | `c27548238724d1d63e5a7aa80e3ac819cc50dc944bfefe039f5440430e047f24` |
| shared | B3 result | references/results/experiments/b3-matched-atmosphere-solver/result.md | 66234 | `189f9ddecd68e8a5af82cbd1395f7b75b58b502f5c4e70994dd89f6dcf82d1f9` |

## Conclusion

Algorithm32: **FAVORABLE**; Algorithm32-J2: **FAVORABLE**; Algorithm32-J3: **FAVORABLE**; Algorithm32-J4: **FAVORABLE**; Algorithm32-J5: **FAVORABLE**. Each classification combines that subject's B1 and B2 thresholds with its B1/B3 consistency result and complete mismatch declaration. The comparison reports the effect of cumulative scattering through J2 to J5 without treating a visual impression or a post-result threshold as authority.

These benchmark results do not by themselves establish convergence beyond J5 or account for construction cost and steady-state performance. A subsequent project-policy decision selects J4 as Algorithm32's default. Default remains the unchanged implementation comparison boundary until the selected J4 path passes the integration, parity, lifecycle, and performance gates owned by the cache design.

These are in-sample comparisons because the adopted aerosol parameters were fitted to the same Kider measurements. No classification establishes out-of-sample atmospheric accuracy, flat-geometry accuracy, finite-local-source accuracy, resolved-solar-disc accuracy, surface-material correctness, or pointwise equality with libRadtran. Those declared limitations remain under every classification.
